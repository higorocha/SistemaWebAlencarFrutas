import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { CalendarOutlined } from '@ant-design/icons';
import { Tooltip } from '@mui/material';

// Container estilizado para o input de mês/ano
const MonthYearContainer = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
    height: 40px;
    padding: 8px 12px 6px 16px;
    font-size: ${props => props.fontSize || '14px'};
    border: 1px solid ${props => props.borderColor || '#d9d9d9'};
    border-width: ${props => props.borderWidth || '1px'};
    border-radius: 6px;
    transition: all 0.3s;
    background-color: ${props => props.backgroundColor || 'white'};
    text-align: center;
    box-sizing: border-box; /* Garantir que padding não afete altura total */

    &:hover,
    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .calendar-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #1890ff;
    font-size: 16px;
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

// Componente do seletor de mês/ano
const MonthYearPicker = styled.div`
  position: fixed;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 16px;
  width: 280px;
`;

const PickerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .year-display {
    font-weight: bold;
    font-size: 16px;
    color: #1890ff;
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #1890ff;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    font-size: 16px;
    
    &:hover {
      background-color: #f0f5ff;
    }
  }
`;

const MonthsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  
  .month {
    padding: 8px 4px;
    text-align: center;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid transparent;
    
    &:hover {
      background-color: #f0f5ff;
      border-color: #1890ff;
    }
    
    &.selected {
      background-color: #1890ff;
      color: white;
    }
    
    &.current {
      border-color: #1890ff;
    }
  }
`;

/**
 * Componente de input para seleção de mês/ano único
 */
const MiniMonthYearInput = ({
  value,
  onChange,
  placeholder = "MM/AAAA",
  height = "32px",
  fontSize,
  borderColor,
  borderWidth,
  backgroundColor,
  style = {},
  disabled = false,
  onPressEnter,
  onKeyDown,
  disabledTooltip,
  ...restProps
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const containerRef = useRef(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Converter valor para formato MM/YYYY
  const formatToMMYYYY = (value) => {
    if (!value) return '';
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object' && value.mes && value.ano) {
      return `${value.mes.toString().padStart(2, '0')}/${value.ano}`;
    }
    
    return '';
  };

  // Converter de MM/YYYY para objeto
  const parseFromMMYYYY = (value) => {
    if (!value) return null;
    
    const parts = value.split('/');
    if (parts.length !== 2) return null;
    
    const mes = parseInt(parts[0]);
    const ano = parseInt(parts[1]);
    
    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || ano < 2000) {
      return null;
    }
    
    return { mes, ano };
  };

  // Atualizar valor quando props mudam
  useEffect(() => {
    const formatted = formatToMMYYYY(value);
    setInputValue(formatted);
    
    if (value && typeof value === 'object' && value.mes && value.ano) {
      setSelectedMonth(value.mes);
      setSelectedYear(value.ano);
      setCurrentYear(value.ano);
    } else if (formatted) {
      const parsed = parseFromMMYYYY(formatted);
      if (parsed) {
        setSelectedMonth(parsed.mes);
        setSelectedYear(parsed.ano);
        setCurrentYear(parsed.ano);
      }
    }
  }, [value]);
  
  // Atualizar posição do picker quando aberto
  useEffect(() => {
    if (isPickerOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isPickerOpen]);
  
  // Fechar picker ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.month-year-picker')
      ) {
        setIsPickerOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Validar e formatar input manual
  const formatInput = (value) => {
    if (!value) return '';
    
    // Remover caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 6)}`;
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    const formatted = formatInput(value);
    setInputValue(formatted);
    
    // Tentar converter para objeto e chamar onChange
    const parsed = parseFromMMYYYY(formatted);
    if (parsed && onChange) {
      onChange(parsed);
    } else if (!formatted && onChange) {
      onChange(null);
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsPickerOpen(true);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedMonth(null);
    setSelectedYear(null);
    if (onChange) {
      onChange(null);
    }
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    } 
    else if (e.key === "Enter" && onPressEnter) {
      onPressEnter();
    }
    else if (e.key === "Escape") {
      setIsPickerOpen(false);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const handleMonthClick = (monthIndex) => {
    const mes = monthIndex + 1;
    const ano = currentYear;
    
    setSelectedMonth(mes);
    setSelectedYear(ano);
    setInputValue(`${mes.toString().padStart(2, '0')}/${ano}`);
    
    if (onChange) {
      onChange({ mes, ano });
    }
    
    setIsPickerOpen(false);
  };

  // Renderizar o picker
  const renderPicker = () => {
    if (!isPickerOpen) return null;
    
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentYearValue = currentDate.getFullYear();
    
    return ReactDOM.createPortal(
      <MonthYearPicker 
        className="month-year-picker" 
        style={{ 
          top: `${pickerPosition.top}px`, 
          left: `${pickerPosition.left}px` 
        }}
      >
        <PickerHeader>
          <button onClick={handlePrevYear} title="Ano anterior">
            &lt;
          </button>
          <div className="year-display">
            {currentYear}
          </div>
          <button onClick={handleNextYear} title="Próximo ano">
            &gt;
          </button>
        </PickerHeader>
        
        <MonthsGrid>
          {months.map((month, index) => {
            const monthNumber = index + 1;
            const isSelected = selectedMonth === monthNumber && selectedYear === currentYear;
            const isCurrent = currentYearValue === currentYear && currentMonthIndex === index;
            
            return (
              <div
                key={index}
                className={`month ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => handleMonthClick(index)}
              >
                {month.substring(0, 3)}
              </div>
            );
          })}
        </MonthsGrid>
      </MonthYearPicker>,
      document.body
    );
  };
  
  const inputComponent = (
    <MonthYearContainer 
      ref={containerRef}
      hasValue={inputValue.length > 0}
      height={height}
      fontSize={fontSize}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      style={style}
    >
      <CalendarOutlined className="calendar-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={7}
        {...restProps}
      />
      {inputValue.length > 0 && !disabled && (
        <button
          className="clear-button"
          onClick={handleClear}
          title="Limpar"
          type="button"
        >
          ×
        </button>
      )}
      
      {renderPicker()}
    </MonthYearContainer>
  );
  
  // Se tiver um tooltip para disabled e estiver desabilitado, envolver com Tooltip
  if (disabledTooltip && disabled) {
    return (
      <Tooltip 
        title={disabledTooltip} 
        placement="top" 
        arrow
      >
        <div>{inputComponent}</div>
      </Tooltip>
    );
  }
  
  return inputComponent;
};

export default MiniMonthYearInput; 