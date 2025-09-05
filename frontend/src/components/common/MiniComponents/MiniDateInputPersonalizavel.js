import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import moment from 'moment';
import 'moment/locale/pt-br';

// Configura o locale do moment para português
moment.locale('pt-br');

// Container estilizado para o input de data (sem ícone)
const DateInputContainer = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
    height: ${props => props.height || '32px'};
    padding: 8px 12px;
    font-size: ${props => props.fontSize || '14px'};
    border: 1px solid ${props => props.borderColor || '#d9d9d9'};
    border-width: ${props => props.borderWidth || '1px'};
    border-radius: 6px;
    transition: all 0.3s;
    background-color: ${props => props.backgroundColor || 'white'};

    &:hover,
    &:focus {
      border-color: #40a9ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
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

// Componente do Calendário estilizado - Agora usando position fixed para o portal
const CalendarContainer = styled.div`
  position: fixed;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 8px;
  width: 280px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  
  .month-year {
    font-weight: bold;
    font-size: 14px;
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
    width: 24px;
    height: 24px;
    border-radius: 4px;
    
    &:hover {
      background-color: #f0f5ff;
    }
  }
`;

const WeekdaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 5px;
  
  .weekday {
    font-size: 12px;
    font-weight: 500;
    color: #8c8c8c;
    padding: 5px 0;
  }
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  
  .day {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    
    &:hover {
      background-color: #f0f5ff;
    }
    
    &.selected {
      background-color: #1890ff;
      color: white;
    }
    
    &.today {
      border: 1px solid #1890ff;
    }
    
    &.other-month {
      color: #d9d9d9;
    }
    
    &.disabled {
      color: #d9d9d9;
      cursor: not-allowed;
      
      &:hover {
        background-color: transparent;
      }
    }
  }
`;

/**
 * Componente de input de data personalizado com calendário integrado
 */
const MiniDateInputPersonalizavel = ({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  height = "32px",
  fontSize,
  borderColor,
  borderWidth,
  backgroundColor,
  style = {},
  disabledDate,
  onPressEnter,
  onKeyDown,
  ...restProps
}) => {
  // Estado interno para controlar o texto do input
  const [inputValue, setInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const containerRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  
  // Atualiza o inputValue quando o value (moment) muda
  useEffect(() => {
    if (value && moment.isMoment(value)) {
      setInputValue(value.format('DD/MM/YYYY'));
    } else if (!value) {
      setInputValue('');
    }
  }, [value]);
  
  // Atualiza a posição do calendário quando ele é aberto
  useEffect(() => {
    if (isCalendarOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + window.scrollY + 4, // 4px de margem
        left: rect.left + window.scrollX,
      });
    }
  }, [isCalendarOpen]);
  
  // Fechar o calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        // Verificamos se o clique foi dentro do calendário
        !event.target.closest('.calendar-popup')
      ) {
        setIsCalendarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função para aplicar a máscara de data (DD/MM/YYYY)
  const applyMask = (text) => {
    // Remove tudo que não é dígito
    const numbers = text.replace(/\D/g, '');
    
    // Aplica a máscara
    let result = '';
    for (let i = 0; i < numbers.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        result += '/';
      }
      result += numbers[i];
    }
    
    return result;
  };

  // Função para validar e converter a data em objeto moment
  const validateAndConvert = (text) => {
    // Verifica se o texto está no formato completo (DD/MM/YYYY)
    if (text.length === 10) {
      const dateObj = moment(text, 'DD/MM/YYYY', true);
      
      // Verifica se a data é válida
      if (dateObj.isValid()) {
        onChange(dateObj); // Passa o objeto moment para o onChange
      } else {
        // Data inválida
        onChange(null);
      }
    } else if (text.length === 0) {
      // Input vazio
      onChange(null);
    }
    // Se não estiver completo, não faz nada (ainda está digitando)
  };

  const handleChange = (e) => {
    const newText = applyMask(e.target.value);
    setInputValue(newText);
    validateAndConvert(newText);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
  };
  
  const handleInputClick = () => {
    // Importante: não propagar o evento para evitar conflitos
    setIsCalendarOpen(true);
    if (value && moment.isMoment(value)) {
      setCurrentMonth(value.clone().startOf('month'));
    }
  };
  
  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };
  
  const handleDayClick = (day) => {
    if (isDateDisabled(day)) return;
    
    onChange(day);
    setIsCalendarOpen(false);
  };
  
  const isDateDisabled = (date) => {
    if (!disabledDate) return false;
    return disabledDate(date);
  };

  // Função para tratar teclas como Enter e Escape
  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    } 
    else if (e.key === "Enter" && onPressEnter) {
      onPressEnter();
    }
    else if (e.key === "Escape") {
      setIsCalendarOpen(false);
    }
  };
  
  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    
    // Ajustar para começar na semana (domingo a sábado)
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');
    
    const days = [];
    let day = startDate.clone();
    
    // Gerar todos os dias do mês mais os dias adjacentes do mês anterior/próximo
    while (day.isSameOrBefore(endDate)) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    
    return days;
  };
  
  // Renderizar o calendário usando um portal
  const renderCalendar = () => {
    if (!isCalendarOpen) return null;
    
    const days = generateCalendarDays();
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = moment().startOf('day');
    
    return ReactDOM.createPortal(
      <CalendarContainer 
        className="calendar-popup" 
        style={{ 
          top: `${calendarPosition.top}px`, 
          left: `${calendarPosition.left}px` 
        }}
      >
        <CalendarHeader>
          <button onClick={handlePrevMonth} title="Mês anterior">
            &lt;
          </button>
          <div className="month-year">
            {currentMonth.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
          </div>
          <button onClick={handleNextMonth} title="Próximo mês">
            &gt;
          </button>
        </CalendarHeader>
        
        <WeekdaysRow>
          {weekdays.map((weekday, index) => (
            <div key={`weekday-${index}`} className="weekday">
              {weekday}
            </div>
          ))}
        </WeekdaysRow>
        
        <DaysGrid>
          {days.map((day, index) => {
            const isSelectedDay = value && day.isSame(value, 'day');
            const isToday = day.isSame(today, 'day');
            const isCurrentMonth = day.isSame(currentMonth, 'month');
            const isDisabled = isDateDisabled(day);
            
            return (
              <div
                key={`day-${index}`}
                className={`day ${isSelectedDay ? 'selected' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleDayClick(day)}
              >
                {day.date()}
              </div>
            );
          })}
        </DaysGrid>
      </CalendarContainer>,
      document.body // Renderizamos no body para garantir que esteja acima de tudo
    );
  };
  
  return (
    <DateInputContainer 
      ref={containerRef}
      hasValue={inputValue.length > 0}
      height={height}
      fontSize={fontSize}
      borderColor={borderColor}
      borderWidth={borderWidth}
      backgroundColor={backgroundColor}
      style={style}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        {...restProps}
      />
      {inputValue.length > 0 && (
        <button
          className="clear-button"
          onClick={handleClear}
          title="Limpar data"
          type="button"
        >
          ×
        </button>
      )}
      
      {/* Renderizamos o calendário usando portal */}
      {renderCalendar()}
    </DateInputContainer>
  );
};

export default MiniDateInputPersonalizavel;