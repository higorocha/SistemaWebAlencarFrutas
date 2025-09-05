// src/components/common/inputs/HectaresInput.js
// Componente reutilizável para input de valores em hectares
// Formatação automática: separador de milhares, 2 casas decimais, sufixo "ha"

import React from "react";
import { Form, Input } from "antd";
import { NumericFormat } from "react-number-format";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const HectaresInput = ({
  label,
  value,
  onChange,
  placeholder = "0,00",
  required = false,
  disabled = false,
  error = null,
  help = null,
  style = {},
  ...props
}) => {
  const theme = useTheme();

  const inputStyle = {
    borderRadius: "6px",
    borderColor: error ? theme.palette.forms.fieldError : theme.palette.forms.fieldGroupBorder,
    ...style,
  };

  return (
    <Form.Item
      label={label}
      validateStatus={error ? "error" : ""}
      help={help || error}
      required={required}
    >
      <NumericFormat
        customInput={Input}
        placeholder={placeholder}
        value={value}
        onValueChange={(values) => onChange(values.value)}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        suffix=" ha"
        disabled={disabled}
        style={inputStyle}
        {...props}
      />
    </Form.Item>
  );
};

HectaresInput.propTypes = {
  label: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  help: PropTypes.string,
  style: PropTypes.object,
};

export default HectaresInput; 