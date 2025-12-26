// src/components/common/search/SearchInputLocalChips.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Input, Tooltip } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { debounce } from "lodash";

// Container principal (mantém padrão visual dos outros inputs de busca)
const SearchContainer = styled.div`
  position: relative;
  width: 100%;

  .ant-input {
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
`;

// Dropdown de sugestões
const SuggestionsDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  z-index: 1050;
  max-height: 300px;
  overflow-y: auto;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const SuggestionItem = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }

  ${(props) =>
    props.$isSelected &&
    `
    background-color: #f0fdf4;
    border-left: 3px solid #059669;
  `}
`;

const SuggestionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
  background-color: #ffffff;
  border: 1px solid #e1e5e9;
`;

const SuggestionMainText = styled.div`
  font-size: 13px;
  color: #333;
  font-weight: 600;
`;

const SuggestionSubText = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const EmptyContainer = styled.div`
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
`;

function normalizeText(text) {
  if (!text) return "";
  // Remove acentos de forma compatível (NFD + range de diacríticos)
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const SearchInputLocalChips = ({
  placeholder = "Buscar...",
  value = "",
  onChange,
  onSelect,
  items = [],
  minChars = 2,
  maxSuggestions = 10,
  size = "middle",
  style = {},
  inputStyle = {},
  allowClear = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filteredItems, setFilteredItems] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedValue = useMemo(() => normalizeText(value), [value]);

  const doFilter = useCallback(
    (rawTerm) => {
      const term = normalizeText(rawTerm);
      if (!term || term.length < minChars) {
        setFilteredItems([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }

      const results = (Array.isArray(items) ? items : [])
        .filter((item) => {
          const searchText = item?.searchText ? normalizeText(item.searchText) : "";
          const label = item?.label ? normalizeText(item.label) : "";
          const valueText = item?.value ? normalizeText(item.value) : "";
          return (
            searchText.includes(term) ||
            label.includes(term) ||
            valueText.includes(term)
          );
        })
        .slice(0, maxSuggestions);

      setFilteredItems(results);
      setIsOpen(true);
      setSelectedIndex(results.length > 0 ? 0 : -1);
    },
    [items, maxSuggestions, minChars],
  );

  const debouncedFilter = useMemo(() => debounce(doFilter, 200), [doFilter]);

  useEffect(() => {
    debouncedFilter(value);
    return () => {
      debouncedFilter.cancel();
    };
  }, [value, debouncedFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (item) => {
      if (!item) return;
      setIsOpen(false);
      setSelectedIndex(-1);
      if (onSelect) onSelect(item);
    },
    [onSelect],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (!isOpen || filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          handleSelect(filteredItems[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const prefixIcon = (
    <Tooltip title={normalizedValue && normalizedValue.length >= minChars ? "Buscar" : ""}>
      <SearchOutlined style={{ color: normalizedValue ? "#059669" : "#bfbfbf" }} />
    </Tooltip>
  );

  return (
    <SearchContainer ref={containerRef} style={style}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => (onChange ? onChange(e.target.value) : undefined)}
        onKeyDown={handleKeyDown}
        allowClear={allowClear}
        prefix={prefixIcon}
        size={size}
        style={{
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 500,
          transition: "all 0.2s ease",
          ...inputStyle,
        }}
      />

      <SuggestionsDropdown $isOpen={isOpen}>
        {filteredItems.length === 0 ? (
          <EmptyContainer>
            {normalizedValue && normalizedValue.length >= minChars
              ? `Nenhum resultado para \"${value}\"`
              : "Digite para buscar..."}
          </EmptyContainer>
        ) : (
          filteredItems.map((item, index) => (
            <SuggestionItem
              key={item.key || `${item.type || "item"}-${index}`}
              $isSelected={index === selectedIndex}
              onClick={() => handleSelect(item)}
            >
              <SuggestionTitleRow>
                <TypeBadge>{item.icon || "🔎"}</TypeBadge>
                <SuggestionMainText>{item.value || item.label || "-"}</SuggestionMainText>
              </SuggestionTitleRow>
              {item.description ? <SuggestionSubText>{item.description}</SuggestionSubText> : null}
            </SuggestionItem>
          ))
        )}
      </SuggestionsDropdown>
    </SearchContainer>
  );
};

SearchInputLocalChips.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object),
  minChars: PropTypes.number,
  maxSuggestions: PropTypes.number,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  style: PropTypes.object,
  inputStyle: PropTypes.object,
  allowClear: PropTypes.bool,
};

export default SearchInputLocalChips;


