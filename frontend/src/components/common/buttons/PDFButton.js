// src/components/common/buttons/PDFButton.js

import React, { useEffect, useRef } from "react";
import { Button, Tooltip } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const PDFButton = ({
  onClick,
  loading = false,
  disabled = false,
  size = "middle",
  type = "default",
  style = {},
  children,
  tooltip = "Exportar PDF",
  showTooltip = true,
  icon = true,
  ...props
}) => {
  const buttonRef = useRef(null);

  // Função para remover text-shadow (solução para sombra após clique)
  const removeTextShadow = (element) => {
    if (element) {
      element.style.setProperty('text-shadow', 'none', 'important');
      // Aplicar também aos filhos
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        child.style.setProperty('text-shadow', 'none', 'important');
      });
    }
  };

  // useEffect para garantir que o text-shadow seja removido
  useEffect(() => {
    if (buttonRef.current) {
      removeTextShadow(buttonRef.current);
      // Executar após um pequeno delay também
      const timeout = setTimeout(() => {
        if (buttonRef.current) {
          removeTextShadow(buttonRef.current);
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleClick = (e) => {
    removeTextShadow(e.currentTarget);
    if (onClick) onClick(e);
  };

  const handleFocus = (e) => {
    removeTextShadow(e.currentTarget);
  };

  const handleMouseEnter = (e) => {
    const button = e.currentTarget;
    if (!disabled && !loading) {
      button.style.backgroundColor = "#b91c1c";
      button.style.borderColor = "#b91c1c";
    }
    removeTextShadow(button);
  };

  const handleMouseLeave = (e) => {
    const button = e.currentTarget;
    if (!disabled && !loading) {
      button.style.backgroundColor = "#dc2626";
      button.style.borderColor = "#dc2626";
    }
    removeTextShadow(button);
  };

  const buttonContent = (
    <Button
      ref={buttonRef}
      type={type}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={handleClick}
      onFocus={handleFocus}
      icon={icon ? <FilePdfOutlined /> : null}
      style={{
        backgroundColor: "#dc2626",
        borderColor: "#dc2626",
        color: "#ffffff",
        // Remover sombras de texto em todos os estados
        textShadow: "none",
        ...style,
        ...(type === "default" && {
          backgroundColor: "#dc2626",
          borderColor: "#dc2626",
          color: "#ffffff",
        }),
        ...(disabled && {
          backgroundColor: "#f5f5f5",
          borderColor: "#d9d9d9",
          color: "#bfbfbf",
        }),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children || "PDF"}
    </Button>
  );

  if (showTooltip && tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
};

PDFButton.propTypes = {
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  type: PropTypes.oneOf(["default", "primary", "ghost", "dashed", "link", "text"]),
  style: PropTypes.object,
  children: PropTypes.node,
  tooltip: PropTypes.string,
  showTooltip: PropTypes.bool,
  icon: PropTypes.bool,
};

export default PDFButton;
