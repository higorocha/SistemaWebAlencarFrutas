import React, { useRef, useEffect } from 'react';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { Chip, Box } from '@mui/material';
import styled from 'styled-components';

// Componente estilizado para o input com chips internos
const SearchInputContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: ${props => props.height || '40px'};

  .input-wrapper {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    width: 100%;
    min-height: ${props => props.height || '40px'};
    padding: 8px 12px 8px 36px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: white;
    transition: all 0.3s;

    /* Mobile responsivo */
    @media (max-width: 768px) {
      padding: 8px 40px 8px 36px; /* Mais espaço para o botão clear */
      min-height: 44px; /* Altura maior para touch em mobile */
    }

    &:hover,
    &:focus-within {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .search-input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    min-width: 80px; /* Menor em mobile */
    font-size: ${props => props.fontSize || '14px'};
    padding: 4px 0;
    
    /* Mobile: texto um pouco maior */
    @media (max-width: 768px) {
      min-width: 60px;
      font-size: 16px; /* Evita zoom no iOS */
    }
    
    &::placeholder {
      color: #bfbfbf;
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

    /* Mobile: ícone um pouco maior */
    @media (max-width: 768px) {
      font-size: 18px;
    }
  }

  .chip-container {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap; /* Manter chips em linha no mobile também */
    
    /* Mobile: chips menores se necessário */
    @media (max-width: 480px) {
      gap: 2px;
    }
  }

  .clear-all-button {
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
    z-index: 2;

    /* Mobile: botão maior para facilitar toque */
    @media (max-width: 768px) {
      height: 20px;
      width: 20px;
      font-size: 14px;
      right: 10px;
    }

    &:hover {
      color: rgba(0, 0, 0, 0.45);
    }
  }
`;

/**
 * Componente de input de busca com chips internos
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.value - Valor atual do input de busca
 * @param {Function} props.onChange - Função chamada quando o valor da busca muda
 * @param {Array} props.chips - Array de chips selecionados [{label, type, onDelete}]
 * @param {Function} props.onChipDelete - Função para deletar chip
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.height - Altura do input
 * @param {Object} props.style - Estilos adicionais
 */
const MiniInputSearchWithChips = ({
  value = '',
  onChange,
  chips = [],
  onChipDelete,
  placeholder = "Digite para buscar...",
  height = '40px',
  fontSize = '14px',
  iconColor = '#1890ff',
  iconSize = '16px',
  style = {},
  icon,
  ...restProps
}) => {
  const inputRef = useRef(null);

  // Focar no input após mudanças nos chips
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [chips.length]);

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleClearAll = () => {
    // Limpar input
    if (onChange) {
      onChange('');
    }
    // Limpar todos os chips
    chips.forEach((chip, index) => {
      if (onChipDelete) {
        onChipDelete(index);
      }
    });
  };

  const handleChipDelete = (chipIndex) => {
    if (onChipDelete) {
      onChipDelete(chipIndex);
    }
    // Focar no input após deletar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const hasValue = value.length > 0 || chips.length > 0;

  return (
    <SearchInputContainer 
      hasValue={hasValue}
      height={height}
      fontSize={fontSize}
      iconColor={iconColor}
      iconSize={iconSize}
      style={style}
    >
      <span className="search-icon">{icon || <SearchOutlined />}</span>
      
      <div className="input-wrapper">
        {/* Renderizar chips */}
        {chips.length > 0 && (
          <div className="chip-container">
            {chips.map((chip, index) => (
              <Chip
                key={`${chip.type}-${chip.label}-${index}`}
                label={chip.label}
                size="small"
                onDelete={() => handleChipDelete(index)}
                sx={{
                  height: { xs: '28px', sm: '24px' }, // Maior em mobile
                  fontSize: { xs: '13px', sm: '12px' },
                  bgcolor: chip.type === 'Lote' ? '#e8f5e8' : '#e3f2fd',
                  color: chip.type === 'Lote' ? '#2e7d32' : '#1976d2',
                  '& .MuiChip-deleteIcon': {
                    fontSize: { xs: '16px', sm: '14px' }, // Ícone maior em mobile
                    color: 'inherit'
                  },
                  '& .MuiChip-label': {
                    px: { xs: 1.2, sm: 1 }, // Mais padding em mobile
                    fontWeight: 500
                  }
                }}
              />
            ))}
          </div>
        )}
        
        {/* Input de busca */}
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={chips.length === 0 ? placeholder : "Continue digitando..."}
          value={value}
          onChange={handleInputChange}
          disabled={chips.length >= 2} // Limite de 2 chips
          {...restProps}
        />
      </div>

      {hasValue && (
        <button
          className="clear-all-button"
          onClick={handleClearAll}
          title="Limpar tudo"
          type="button"
        >
          ×
        </button>
      )}
    </SearchInputContainer>
  );
};

export default MiniInputSearchWithChips; 