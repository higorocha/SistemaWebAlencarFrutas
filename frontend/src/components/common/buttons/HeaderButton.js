// src/components/common/buttons/HeaderButton.js
// Componente reutilizável para botões de cabeçalho de seções
// Estilo especial: fundo branco, bordas verdes, texto verde

import React from "react";
import { Button } from "antd";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const HeaderButton = ({ 
  children, 
  icon, 
  onClick, 
  loading = false,
  disabled = false,
  style = {},
  ...props 
}) => {
  const theme = useTheme();

  const buttonStyle = {
    backgroundColor: theme.palette.forms.buttonHeader,
    borderColor: theme.palette.forms.buttonHeaderBorder,
    color: theme.palette.forms.buttonHeaderText,
    borderRadius: "6px",
    fontWeight: "600",
    borderWidth: "2px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    ...style,
  };

  return (
    <Button
      type="default"
      icon={icon}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      style={buttonStyle}
      className="header-button-hover"
      {...props}
    >
      {children}
    </Button>
  );
};

HeaderButton.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
};

export default HeaderButton; 