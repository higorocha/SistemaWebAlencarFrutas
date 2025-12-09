import React, { useState, useRef, useEffect } from 'react';
import { FilterOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// Container principal estilizado
const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

// Estilo do elemento de seleção que o usuário clica
const SelectTrigger = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen', 'hasValue', 'iconColor', 'customPadding', 'height', 'fontSize', 'iconSize', 'placeholder'].includes(prop),
})`
  width: 100%;
  height: ${props => props.height || '40px'};
  padding: ${props => props.customPadding || '8px 12px 8px 36px'};
  font-size: ${props => props.fontSize || '14px'};
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    border-color: #40a9ff;
  }
  
  ${props => props.isOpen && `
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  `}
  
  .select-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${props => props.placeholder && !props.hasValue ? '#bfbfbf' : 'inherit'};
  }
  
  .select-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.iconColor || '#1890ff'};
    font-size: ${props => props.iconSize || '16px'};
  }
  
  .arrow-icon {
    margin-left: 8px;
    transition: transform 0.3s;
    ${props => props.isOpen && 'transform: rotate(180deg);'}
    color: rgba(0, 0, 0, 0.45);
  }
  
  .loading-icon {
    margin-left: 8px;
    color: #1890ff;
  }
`;

// Dropdown com as opções
const SelectDropdown = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen', 'maxHeight'].includes(prop),
})`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  max-height: ${props => props.maxHeight || '300px'};
  overflow-y: auto;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05);
  z-index: 9999;
  display: ${props => props.isOpen ? 'block' : 'none'};
  padding: 4px 0;
`;

// Item individual no dropdown
const SelectOption = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isSelected'].includes(prop),
})`
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  ${props => props.isSelected && `
    font-weight: 500;
    background-color: #e6f7ff;
    color: #1890ff;
  `}
`;

/**
 * Componente de select personalizado
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.options - Array de opções no formato [{value: 'valor', label: 'Rótulo'}]
 * @param {any} props.value - Valor selecionado atualmente
 * @param {Function} props.onChange - Função chamada quando o valor muda
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.height - Altura do select (ex: '40px')
 * @param {string} props.fontSize - Tamanho da fonte (ex: '14px')
 * @param {string} props.iconColor - Cor do ícone (ex: '#1890ff')
 * @param {string} props.iconSize - Tamanho do ícone (ex: '16px')
 * @param {boolean} props.loading - Indica se está carregando
 * @param {Object} props.style - Estilos adicionais para o container
 * @param {string} props.maxHeight - Altura máxima do dropdown (ex: '300px')
 */
const MiniSelectPersonalizavel = ({
  options = [],
  value,
  onChange,
  placeholder = "Selecione...",
  height,
  fontSize,
  iconColor,
  iconSize,
  loading = false,
  style = {},
  maxHeight,
  icon = <FilterOutlined />, 
  customPadding,
  ...restProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Encontrar a opção selecionada para mostrar o label correto
  const selectedOption = options.find(option => option.value === value);
  
  // Alternar o estado do dropdown
  const toggleDropdown = () => {
    if (!loading) {
      setIsOpen(!isOpen);
    }
  };
  
  // Selecionar uma opção
  const handleSelect = (option) => {
    if (onChange) {
      onChange(option.value);
    }
    setIsOpen(false);
  };
  
  // Fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <SelectContainer ref={containerRef} style={style}>
      <SelectTrigger
        onClick={toggleDropdown}
        isOpen={isOpen}
        hasValue={!!selectedOption}
        placeholder={placeholder}
        height={height}
        fontSize={fontSize}
        iconColor={iconColor}
        iconSize={iconSize}
        customPadding={customPadding}
        style={{
          ...(style?.border ? { border: style.border } : {}),
        }}
        {...restProps}
      >
        <span className="select-icon">{icon}</span>
        
        <span className="select-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        {loading ? (
          <LoadingOutlined className="loading-icon" />
        ) : (
          <DownOutlined className="arrow-icon" />
        )}
      </SelectTrigger>
      
      <SelectDropdown isOpen={isOpen} maxHeight={maxHeight}>
        {options.map((option) => (
          <SelectOption
            key={option.value}
            isSelected={option.value === value}
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </SelectOption>
        ))}
        {options.length === 0 && (
          <SelectOption style={{ cursor: 'default', color: '#bfbfbf' }}>
            Nenhuma opção disponível
          </SelectOption>
        )}
      </SelectDropdown>
    </SelectContainer>
  );
};

export default MiniSelectPersonalizavel;