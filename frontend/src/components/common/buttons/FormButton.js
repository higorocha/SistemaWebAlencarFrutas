// src/components/common/buttons/FormButton.js
// Componente específico para botões dentro de formulários
// Diferença do PrimaryButton: altura compatível com inputs (32px) e padding ajustado
// Uso: Botões em modais de formulário como "Vincular Áreas", "Vincular Fitas"

import React, { useEffect, useRef } from "react";
import { Button } from "antd";
import PropTypes from "prop-types";

const FormButton = ({ 
  children, 
  icon, 
  onClick, 
  loading = false,
  disabled = false,
  style = {},
  className = "",
  ...props 
}) => {
  const buttonRef = useRef(null);
  
  const buttonStyle = {
    backgroundColor: "#059669",
    borderColor: "#059669",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    border: "1px solid #059669",
    outline: "1px solid rgba(255, 255, 255, 0.3)",
    outlineOffset: "1px",
    fontWeight: 500,
    height: "48px", // Altura compatível com inputs size="large"
    padding: "0 12px",
    fontSize: "14px", // Fonte compatível com inputs
    transition: "all 0.2s ease",
    minWidth: "100px",
    // Remover sombras de texto em todos os estados
    textShadow: "none",
    ...style,
  };

  // Função simplificada para remover text-shadow
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

  // useEffect simplificado para garantir que o text-shadow seja removido
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

  const handleMouseEnterCustom = (e) => {
    const button = e.currentTarget;
    if (!button.disabled) {
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)";
    }
    removeTextShadow(button);
  };

  const handleMouseLeaveCustom = (e) => {
    const button = e.currentTarget;
    if (!button.disabled) {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)";
    }
    removeTextShadow(button);
  };

  return (
    <Button
      ref={buttonRef}
      type="primary"
      icon={icon}
      onClick={handleClick}
      onFocus={handleFocus}
      loading={loading}
      disabled={disabled}
      style={buttonStyle}
      className={className}
      onMouseEnter={handleMouseEnterCustom}
      onMouseLeave={handleMouseLeaveCustom}
      {...props}
    >
      {children}
    </Button>
  );
};

FormButton.propTypes = {
  children: PropTypes.node, // Não obrigatório para botões apenas com ícone
  icon: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
};

export default FormButton;