// src/components/common/buttons/PrimaryButton.js
// Componente reutilizável para botões primários das páginas
// Estilo: fundo verde, texto branco, bordas arredondadas, efeito de elevação no hover
// Uso: Botões principais como "Adicionar Áreas Agrícolas", "Novo Pagamento"

import React, { useEffect, useRef } from "react";
import { Button } from "antd";
import PropTypes from "prop-types";

const PrimaryButton = ({ 
  children, 
  icon, 
  onClick, 
  loading = false,
  disabled = false,
  size = "large",
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
    height: size === "large" ? "40px" : size === "middle" ? "36px" : "32px",
    padding: size === "large" ? "0 20px" : size === "middle" ? "0 16px" : "0 12px",
    fontSize: size === "large" ? "14px" : size === "middle" ? "14px" : "12px",
    transition: "all 0.2s ease",
    minWidth: size === "large" ? "120px" : size === "middle" ? "100px" : "80px",
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
      size={size}
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

PrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  onClick: PropTypes.func, // Não obrigatório para casos como htmlType="submit"
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  style: PropTypes.object,
  className: PropTypes.string,
};

export default PrimaryButton; 