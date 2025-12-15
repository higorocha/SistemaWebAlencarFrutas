// src/components/common/inputs/HourInput.js
// Componente para input de horas com suporte a vírgula/ponto como separador decimal
// Máscara: separador decimal (,), 2 casas decimais

import React from "react";
import { Input } from "antd";
import { NumericFormat } from "react-number-format";
import PropTypes from "prop-types";

const HourInput = ({
  value,
  onChange,
  onPressEnter,
  onPressEsc,
  placeholder = "0,00",
  size = "small",
  disabled = false,
  style = {},
  className = "",
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
        // values.value é o valor numérico puro (ex: 1.5 ou 1.25)
        // values.formattedValue é o valor formatado (ex: 1,5 ou 1,25)
        if (onChange) {
          onChange(values.value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onPressEnter) {
          e.preventDefault();
          onPressEnter(e);
        } else if (e.key === 'Escape' && onPressEsc) {
          e.preventDefault();
          onPressEsc(e);
        }
      }}
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale={false}
      allowNegative={false}
      disabled={disabled}
      size={size}
      className={className}
      style={inputStyle}
      {...props}
    />
  );
};

HourInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onPressEnter: PropTypes.func,
  onPressEsc: PropTypes.func,
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
};

export default HourInput;
