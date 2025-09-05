import React, { forwardRef } from "react";
import { Input } from "antd";
import { useIMask } from 'react-imask';
import PropTypes from "prop-types";

/**
 * Componente de Input Mascarado para Valores Decimais
 * 
 * @param {Object} props
 * @param {string|number} props.value - Valor atual do campo
 * @param {Function} props.onChange - Função chamada quando o valor muda
 * @param {string} [props.addonAfter] - Texto opcional para exibir após o input (ex: "KG", "TON")
 * @param {string} [props.size="large"] - Tamanho do input (small, default, large)
 * @param {string} [props.placeholder] - Placeholder do campo
 * @param {boolean} [props.disabled] - Se o campo está desabilitado
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {Object} [props.style] - Estilos inline adicionais
 * @param {Object} [props.maskOptions] - Opções personalizadas da máscara
 */
const MaskedDecimalInput = forwardRef((props, ref) => {
  const { 
    onChange, 
    addonAfter, 
    size = "large",
    placeholder = "Ex: 1.234,56",
    disabled = false,
    className = "",
    style = {},
    maskOptions = {},
    ...restProps 
  } = props;

  // Configuração padrão da máscara decimal brasileira
  const defaultMaskOptions = {
    mask: Number,
    scale: 2,
    thousandsSeparator: '.',
    radix: ',',
    padFractionalZeros: true,
    normalizeZeros: true,
    min: 0,
    max: 999999999.99,
  };

  // Mescla as opções padrão com as personalizadas
  const finalMaskOptions = { ...defaultMaskOptions, ...maskOptions };

  const {
    ref: iMaskRef,
    value,
    unmaskedValue,
    setValue, // 1. Exponha a função 'setValue'
  } = useIMask(
    finalMaskOptions,
    {
      // Envia o valor SEM máscara para o formulário do Ant Design
      onAccept: (value, mask) => onChange(mask.unmaskedValue),
    }
  );

  // Forçar atualização do valor quando a prop value mudar
  React.useEffect(() => {
    if (props.value !== undefined && props.value !== null && props.value !== unmaskedValue) {
      // 2. Use 'setValue' para atualizar o valor da máscara de forma segura
      setValue(props.value.toString());
    }
  }, [props.value, unmaskedValue, setValue]); // Atualize a dependência para 'setValue'

  // Se não tiver addonAfter, renderiza apenas o Input com máscara
  if (!addonAfter) {
    return (
      <Input
        {...restProps}
        ref={(el) => {
          // Combina as referências
          iMaskRef.current = el && el.input; 
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        value={value} // O valor é controlado pelo hook useIMask
        onChange={() => {}} // O onChange é gerenciado pelo onAccept do hook
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        size={size}
        style={style}
      />
    );
  }

  // Se tiver addonAfter, usa a mesma abordagem do componente antigo
  // que funcionava perfeitamente no ColheitaModal.js
  return (
    <Input
      {...restProps}
      ref={(el) => {
        // Combina as referências
        iMaskRef.current = el && el.input; 
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      }}
      value={value} // O valor é controlado pelo hook useIMask
      onChange={() => {}} // O onChange é gerenciado pelo onAccept do hook
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      size={size}
      style={style}
      addonAfter={addonAfter} // Usa o addonAfter nativo do Ant Design
    />
  );
});

MaskedDecimalInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  addonAfter: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  maskOptions: PropTypes.object,
};

export default MaskedDecimalInput;
