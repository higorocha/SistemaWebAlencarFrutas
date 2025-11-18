// src/components/Icons/PDFIcon.js

import React from "react";
import { Tooltip } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

/**
 * Componente reutilizável de ícone PDF para tabelas
 * 
 * @param {Function} onClick - Função chamada ao clicar no ícone
 * @param {string} tooltip - Texto do tooltip (opcional)
 * @param {string} color - Cor do ícone (padrão: #dc2626 - vermelho PDF)
 * @param {number|string} fontSize - Tamanho da fonte do ícone (padrão: 16px)
 * @param {boolean} disabled - Se o ícone está desabilitado (padrão: false)
 * @param {object} style - Estilos adicionais para o ícone
 */
const PDFIcon = ({
  onClick,
  tooltip = "Gerar PDF",
  color = "#dc2626",
  fontSize = 16,
  disabled = false,
  style = {},
  ...props
}) => {
  const iconStyle = {
    color: disabled ? "#d9d9d9" : color,
    fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const iconElement = (
    <FilePdfOutlined
      style={iconStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!disabled && onClick) {
          e.target.style.color = "#b91c1c";
          e.target.style.transform = "scale(1.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && onClick) {
          e.target.style.color = color;
          e.target.style.transform = "scale(1)";
        }
      }}
      {...props}
    />
  );

  if (tooltip && !disabled) {
    return (
      <Tooltip title={tooltip} placement="top">
        {iconElement}
      </Tooltip>
    );
  }

  return iconElement;
};

PDFIcon.propTypes = {
  onClick: PropTypes.func,
  tooltip: PropTypes.string,
  color: PropTypes.string,
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  disabled: PropTypes.bool,
  style: PropTypes.object,
};

export default PDFIcon;

