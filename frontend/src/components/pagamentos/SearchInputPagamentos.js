// src/components/pagamentos/SearchInputPagamentos.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Spin, Tooltip } from 'antd';
import { SearchOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { debounce } from 'lodash';
import axiosInstance from '../../api/axiosConfig';
import { capitalizeName } from '../../utils/formatters';
import { formatarCPF } from '../../utils/formatters';

// Container principal
const SearchContainer = styled.div`
  position: relative;
  width: 100%;

  .ant-input {
    borderRadius: 6px;
    fontSize: 14px;
    fontWeight: 500;
    transition: all 0.2s ease;
  }

  .ant-input-affix-wrapper {
    transition: all 0.2s ease;

    &.loading-state {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
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
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05);
  z-index: 1050;
  max-height: 300px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

// Item de sugestão
const SuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.$isSelected && `
    background-color: #e6f7ff;
    border-left: 3px solid #1890ff;
  `}
`;

// Cabeçalho da sugestão
const SuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

// Ícone do tipo de busca
const TypeIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 12px;
  color: #333333;
  background-color: #ffffff;
  border: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
`;

// Texto do tipo
const TypeText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Texto da sugestão
const SuggestionText = styled.div`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

// Texto secundário
const SuggestionSubtext = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

// Loading
const LoadingContainer = styled.div`
  padding: 16px;
  text-align: center;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .loading-text {
    font-size: 14px;
    color: #1890ff;
    font-weight: 500;
  }
`;

// Container de busca vazia
const EmptyContainer = styled.div`
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
`;

const SearchInputPagamentos = ({
  placeholder = "Buscar por colhedor, funcionário, CPF, lote ou conta...",
  value = "",
  onChange,
  onSuggestionSelect,
  onSearch,
  style = {},
  size = "middle",
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState('idle'); // 'idle', 'loading', 'success', 'no-results', 'error'
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Sincronizar value externo com estado interno
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Função para buscar sugestões no backend
  const fetchSuggestions = useCallback(async (term) => {
    const trimmedTerm = term?.trim() || '';
    
    if (!trimmedTerm || trimmedTerm.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setSearchStatus('idle');
      return;
    }

    try {
      setIsLoading(true);
      setSearchStatus('loading');
      setIsOpen(true);

      // Buscar sugestões do backend
      const response = await axiosInstance.get(`/api/pagamentos/busca-inteligente?term=${encodeURIComponent(trimmedTerm)}`);
      const backendSuggestions = response.data || [];

      setSuggestions(backendSuggestions);

      if (backendSuggestions.length === 0) {
        setSearchStatus('no-results');
        setSuggestions([{
          type: 'no-results',
          label: 'Sem resultados',
          value: trimmedTerm,
          icon: '🔍',
          color: '#999',
          description: `Nenhum resultado encontrado para "${trimmedTerm}"`
        }]);
      } else {
        setSearchStatus('success');
      }

      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSearchStatus('error');
      setSuggestions([{
        type: 'error',
        label: 'Erro',
        value: trimmedTerm,
        icon: '⚠️',
        color: '#f5222d',
        description: 'Erro ao buscar sugestões. Tente novamente.'
      }]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      fetchSuggestions(term);
    }, 300),
    [fetchSuggestions]
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value) {
      setSearchStatus('idle');
      setIsOpen(false);
    } else {
      debouncedSearch(value);
    }

    if (onChange) {
      onChange(value);
    }
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'no-results' || suggestion.type === 'error') {
      return;
    }

    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchStatus('idle');

    if (onChange) {
      onChange("");
    }

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (!isOpen || suggestions.length === 0)) {
      // Se pressionar Enter sem sugestões abertas, aplicar busca por texto
      if (onSearch && searchTerm.trim()) {
        onSearch(searchTerm);
      }
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (onSearch && searchTerm.trim()) {
          // Se não há sugestão selecionada, aplicar busca por texto
          onSearch(searchTerm);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SearchContainer ref={containerRef} style={style}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        allowClear
        prefix={(() => {
          if (isLoading) {
            return <LoadingOutlined style={{ color: '#1890ff' }} spin />;
          }

          if (searchStatus === 'success' && searchTerm.length >= 2) {
            return (
              <Tooltip title="Resultados encontrados">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            );
          }

          if (searchStatus === 'no-results' && searchTerm.length >= 2) {
            return (
              <Tooltip title="Nenhum resultado encontrado">
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            );
          }

          if (searchStatus === 'error') {
            return (
              <Tooltip title="Erro na busca">
                <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
              </Tooltip>
            );
          }

          return <SearchOutlined style={{ color: searchTerm ? '#1890ff' : '#bfbfbf' }} />;
        })()}
        size={size}
        className={isLoading ? 'loading-state' : ''}
        style={{
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          ...style,
        }}
        {...props}
      />

      <SuggestionsDropdown $isOpen={isOpen}>
        {isLoading ? (
          <LoadingContainer>
            <LoadingOutlined style={{ color: '#1890ff' }} spin />
            <span className="loading-text">Buscando sugestões...</span>
          </LoadingContainer>
        ) : (
          suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={`${suggestion.type}-${index}`}
              $isSelected={index === selectedIndex}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{
                cursor: suggestion.type === 'no-results' || suggestion.type === 'error' ? 'default' : 'pointer',
                opacity: suggestion.type === 'no-results' || suggestion.type === 'error' ? 0.7 : 1
              }}
            >
              <SuggestionHeader>
                <TypeIcon color={suggestion.color}>
                  {suggestion.icon}
                </TypeIcon>
                <TypeText>{suggestion.label}</TypeText>
              </SuggestionHeader>
              <SuggestionText>{
                ['colhedor', 'funcionario'].includes(suggestion.type)
                  ? capitalizeName(suggestion.value)
                  : suggestion.type === 'funcionario' && suggestion.metadata?.cpf
                  ? formatarCPF(suggestion.metadata.cpf)
                  : suggestion.value
              }</SuggestionText>
              <SuggestionSubtext>{suggestion.description}</SuggestionSubtext>
            </SuggestionItem>
          ))
        )}
      </SuggestionsDropdown>
    </SearchContainer>
  );
};

export default SearchInputPagamentos;

