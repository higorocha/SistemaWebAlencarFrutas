//frontend/src/components/common/MiniComponents/MiniInputSearchPersonalizavel.js
import React from 'react';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// Componente estilizado para o input de busca
const SearchInputContainer = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
    height: ${props => props.height || '40px'};
    padding: 8px 12px 8px 36px;
    font-size: ${props => props.fontSize || '14px'};
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    transition: all 0.3s;
    color: ${props => props.textColor || '#000000'};

    &:hover,
    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.iconColor || '#1890ff'};
    font-size: ${props => props.iconSize || '16px'};
    z-index: 1;
    pointer-events: none;
  }

  .clear-button {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0, 0, 0, 0.25);
    font-size: 12px;
    background: none;
    border: none;
    cursor: pointer;
    display: ${props => (props.hasValue ? "block" : "none")};
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
 * Componente de input de busca personalizado
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.value - Valor atual do input
 * @param {Function} props.onChange - Função chamada quando o valor muda
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.height - Altura do input (ex: '40px')
 * @param {string} props.fontSize - Tamanho da fonte (ex: '14px')
 * @param {string} props.iconColor - Cor do ícone de busca
 * @param {string} props.iconSize - Tamanho do ícone de busca
 * @param {string} props.textColor - Cor do texto digitado
 * @param {Object} props.style - Estilos adicionais para o container
 * @param {React.ReactNode} props.icon - Ícone personalizado a ser exibido no input
 */
const MiniInputSearchPersonalizavel = ({
  value,
  onChange,
  placeholder = "Buscar...",
  height,
  fontSize,
  iconColor,
  iconSize,
  textColor,
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
    <SearchInputContainer 
      hasValue={value && value.length > 0}
      height={height}
      fontSize={fontSize}
      iconColor={iconColor}
      iconSize={iconSize}
      textColor={textColor}
      style={style}
    >
      <span className="search-icon">{icon || <SearchOutlined />}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        {...restProps}
      />
      {value && value.length > 0 && (
        <button
          className="clear-button"
          onClick={handleClear}
          title="Limpar busca"
          type="button"
        >
          ×
        </button>
      )}
    </SearchInputContainer>
  );
};

export default MiniInputSearchPersonalizavel;