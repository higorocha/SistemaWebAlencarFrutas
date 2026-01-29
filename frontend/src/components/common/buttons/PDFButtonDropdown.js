// src/components/common/buttons/PDFButtonDropdown.js
/**
 * Botão PDF com menu dropdown reutilizável e elegante.
 * - Visual igual ao PDFButton (vermelho, ícone, label) com seta à direita.
 * - Seta dinâmica: para cima quando fechado, para baixo quando aberto (menu abre para cima).
 * - Overlay customizado: ícones por item, tooltip/descrição do relatório, layout diferenciado.
 *
 * Props menuItems: Array<{
 *   key: string,
 *   label: string,
 *   tooltip?: string,  // descrição do que tem no relatório (exibida no overlay)
 *   icon?: ReactNode,
 *   onClick?: () => void,
 *   disabled?: boolean
 * }>
 */

import React, { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Tooltip } from "antd";
import { FilePdfOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import "./PDFButtonDropdown.css";

const PDFButtonDropdown = ({
  menuItems = [],
  label = "Gerar PDF",
  loading = false,
  disabled = false,
  size = "middle",
  style = {},
  tooltip = "Gerar PDF",
  showTooltip = true,
  icon = true,
  ...props
}) => {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);

  const removeTextShadow = (element) => {
    if (element) {
      element.style.setProperty("text-shadow", "none", "important");
      const children = element.querySelectorAll("*");
      children.forEach((child) => {
        child.style.setProperty("text-shadow", "none", "important");
      });
    }
  };

  useEffect(() => {
    if (buttonRef.current) {
      removeTextShadow(buttonRef.current);
      const timeout = setTimeout(() => {
        if (buttonRef.current) removeTextShadow(buttonRef.current);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleMouseEnter = (e) => {
    const el = e.currentTarget;
    if (!disabled && !loading) {
      el.style.backgroundColor = "#b91c1c";
      el.style.borderColor = "#b91c1c";
    }
    removeTextShadow(el);
  };

  const handleMouseLeave = (e) => {
    const el = e.currentTarget;
    if (!disabled && !loading) {
      el.style.backgroundColor = "#dc2626";
      el.style.borderColor = "#dc2626";
    }
    removeTextShadow(el);
  };

  const handleItemClick = (item) => {
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
  };

  const dropdownContent = (
    <div className="pdf-dropdown-overlay">
      <div className="pdf-dropdown-header">
        <FilePdfOutlined style={{ fontSize: 16, color: "#ffffff" }} />
        <span className="pdf-dropdown-header-title">Relatórios PDF</span>
      </div>
      <div className="pdf-dropdown-items">
        {menuItems.map((item) => {
          const isDisabled = !!item.disabled;
          return (
            <button
              key={item.key}
              type="button"
              className={`pdf-dropdown-item ${isDisabled ? "pdf-dropdown-item-disabled" : ""}`}
              onClick={() => handleItemClick(item)}
              disabled={isDisabled}
            >
              <span className="pdf-dropdown-item-icon">
                {item.icon != null ? item.icon : <FilePdfOutlined />}
              </span>
              <span className="pdf-dropdown-item-content">
                <span className="pdf-dropdown-item-label">{item.label}</span>
                {item.tooltip && (
                  <span className="pdf-dropdown-item-tooltip">{item.tooltip}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const triggerButton = (
    <Button
      ref={buttonRef}
      type="default"
      size={size}
      loading={loading}
      disabled={disabled}
      icon={icon ? <FilePdfOutlined /> : null}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: "#dc2626",
        borderColor: "#dc2626",
        color: "#ffffff",
        textShadow: "none",
        display: "inline-flex",
        alignItems: "center",
        ...style,
        ...(disabled && {
          backgroundColor: "#f5f5f5",
          borderColor: "#d9d9d9",
          color: "#bfbfbf",
        }),
      }}
      {...props}
    >
      {label}
      {open ? (
        <DownOutlined
          style={{
            marginLeft: 8,
            fontSize: size === "small" ? 10 : 12,
            opacity: disabled ? 0.6 : 1,
          }}
        />
      ) : (
        <UpOutlined
          style={{
            marginLeft: 8,
            fontSize: size === "small" ? 10 : 12,
            opacity: disabled ? 0.6 : 1,
          }}
        />
      )}
    </Button>
  );

  const wrappedTrigger = showTooltip && tooltip ? (
    <Tooltip title={tooltip} placement="top">
      {triggerButton}
    </Tooltip>
  ) : (
    triggerButton
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      overlayClassName="pdf-dropdown-wrap"
      trigger={["click"]}
      placement="top"
      disabled={disabled || loading}
    >
      <span>{wrappedTrigger}</span>
    </Dropdown>
  );
};

PDFButtonDropdown.propTypes = {
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      tooltip: PropTypes.string,
      icon: PropTypes.node,
      onClick: PropTypes.func,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  label: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  style: PropTypes.object,
  tooltip: PropTypes.string,
  showTooltip: PropTypes.bool,
  icon: PropTypes.bool,
};

export default PDFButtonDropdown;
