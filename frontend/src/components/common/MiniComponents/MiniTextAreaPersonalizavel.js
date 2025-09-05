import React from 'react';
import styled from 'styled-components';

// Container estilizado para o textarea
const TextAreaContainer = styled.div`
  position: relative;
  width: 100%;

  textarea {
    width: 100%;
    min-height: ${props => props.height || '80px'};
    padding: 8px 12px 8px 36px;
    font-size: ${props => props.fontSize || '14px'};
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    transition: all 0.3s;
    resize: vertical;

    &:hover,
    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .icon {
    position: absolute;
    left: 12px;
    top: 10px;
    color: ${props => props.iconColor || '#1890ff'};
    font-size: ${props => props.iconSize || '16px'};
    z-index: 1;
    pointer-events: none;
  }

  .clear-button {
    position: absolute;
    right: 12px;
    top: 8px;
    color: rgba(0, 0, 0, 0.25);
    font-size: 12px;
    background: none;
    border: none;
    cursor: pointer;
    display: ${(props) => (props.hasValue ? "block" : "none")};
    padding: 0;
    height: 16px;
    width: 16px;
    line-height: 1;

    &:hover {
      color: rgba(0, 0, 0, 0.45);
    }
  }
`;

/**
 * Componente de textarea personalizado
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.value - Valor atual do textarea
 * @param {Function} props.onChange - Função chamada quando o valor muda
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.height - Altura do textarea (ex: '80px')
 * @param {string} props.fontSize - Tamanho da fonte (ex: '14px')
 * @param {string} props.iconColor - Cor do ícone
 * @param {string} props.iconSize - Tamanho do ícone
 * @param {Object} props.style - Estilos adicionais para o container
 * @param {React.ReactNode} props.icon - Ícone a ser exibido
 */
const MiniTextAreaPersonalizavel = ({
  value,
  onChange,
  placeholder = "Digite aqui...",
  height,
  fontSize,
  iconColor,
  iconSize,
  style = {},
  icon,
  ...restProps
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
  };

  return (
    <TextAreaContainer 
      hasValue={value && value.length > 0}
      height={height}
      fontSize={fontSize}
      iconColor={iconColor}
      iconSize={iconSize}
      style={style}
    >
      <span className="icon">{icon}</span>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        {...restProps}
      />
      {value && value.length > 0 && (
        <button
          className="clear-button"
          onClick={handleClear}
          title="Limpar"
          type="button"
        >
          ×
        </button>
      )}
    </TextAreaContainer>
  );
};

export default MiniTextAreaPersonalizavel;