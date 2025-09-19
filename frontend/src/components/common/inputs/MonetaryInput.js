// src/components/common/inputs/MonetaryInput.js
// Componente simples para input de valores monetários
// Máscara: separador de milhares (.), separador decimal (,), 2 casas decimais

import React from "react";
import { Input } from "antd";
import { NumericFormat } from "react-number-format";
import PropTypes from "prop-types";

const MonetaryInput = ({
  value,
  onChange,
  placeholder = "0,00",
  addonAfter = null,
  size = "large",
  disabled = false,
  style = {},
  className = "",
  maskOptions, // Capturar para não passar para o DOM
  ...props
}) => {
  const inputStyle = {
    borderRadius: "6px",
    width: "100%",
    ...style,
  };

  return (
    <NumericFormat
      customInput={Input}
      placeholder={placeholder}
      value={value}
      onValueChange={(values) => {
        // values.value é o valor numérico puro (ex: 123.45)
        // values.formattedValue é o valor formatado (ex: 123,45)
        if (onChange) {
          onChange(values.value);
        }
      }}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale={false}
      allowNegative={false}
      disabled={disabled}
      size={size}
      className={className}
      style={inputStyle}
      addonAfter={addonAfter}
      {...props}
    />
  );
};

MonetaryInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func, // Removido isRequired para compatibilidade com Form.Item
  placeholder: PropTypes.string,
  addonAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  size: PropTypes.oneOf(['small', 'default', 'large']),
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
};

export default MonetaryInput;
