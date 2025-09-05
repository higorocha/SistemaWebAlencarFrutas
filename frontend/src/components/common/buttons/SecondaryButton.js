// src/components/common/buttons/SecondaryButton.js
// Componente reutilizável para botões secundários das páginas
// Estilo: mesma cor de fundo do PrimaryButton, bordas diferentes
// Uso: Botões secundários como "Adicionar Culturas"

import React from "react";
import { Button } from "antd";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const SecondaryButton = ({ 
  children, 
  icon, 
  onClick, 
  loading = false,
  disabled = false,
  size = "large",
  style = {},
  ...props 
}) => {
  const theme = useTheme();

  const buttonStyle = {
    backgroundColor: theme.palette.forms.buttonPrimary,
    borderColor: theme.palette.forms.buttonSecondary,
    color: theme.palette.forms.buttonText,
    borderRadius: "6px",
    fontWeight: "500",
    minWidth: "120px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    borderWidth: "2px",
    ...style,
  };

  return (
    <Button
      type="default"
      icon={icon}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      size={size}
      style={buttonStyle}
      className="secondary-button-hover"
      {...props}
    >
      {children}
    </Button>
  );
};

SecondaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  style: PropTypes.object,
};

export default SecondaryButton; 