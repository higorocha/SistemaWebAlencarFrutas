import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { CalendarOutlined } from '@ant-design/icons';
import moment from '../../../config/momentConfig';

// Container estilizado para o input de range de datas
const DateRangeContainer = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
    height: ${props => props.height || '32px'};
    padding: 8px 12px 8px 36px;
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

// Container do calendário com responsividade
const CalendarContainer = styled.div`
  position: fixed;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 8px;
  width: 560px; // Largura padrão para desktop
  max-width: calc(100vw - 20px); // Evita que fique maior que a largura da tela
  display: flex;
  flex-direction: column;
  
  @media (max-width: 600px) {
    width: 320px; // Mais estreito em telas pequenas
  }
`;

// Cabeçalho do calendário
const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  
  .month-year {
    font-weight: bold;
    font-size: 14px;
    color: #1890ff;
    
    @media (max-width: 600px) {
      font-size: 13px; // Texto um pouco menor em telas pequenas
    }
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
    
    @media (max-width: 600px) {
      width: 28px; // Botões um pouco maiores para facilitar o toque
      height: 28px;
    }
  }
`;

// Container dos calendários
// Container dos calendários com layout adaptativo
const CalendarsContainer = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 24px; // Aumenta o espaço entre os calendários quando empilhados
  }
`;

// Container de um calendário individual
const SingleCalendarContainer = styled.div`
  flex: 1;
`;

// Linha de dias da semana
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

// Grid de dias mais responsivo
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
    
    @media (max-width: 600px) {
      min-height: 32px; // Garantir altura mínima para facilitar o toque
    }
    
    &:hover {
      background-color: #f0f5ff;
    }
    
    &.selected {
      background-color: #1890ff;
      color: white;
    }
    
    &.in-range {
      background-color: #e6f7ff;
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

// Botões de rodapé
const FooterButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  
  button {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid;
    cursor: pointer;
    font-size: 12px;
    
    @media (max-width: 600px) {
      padding: 8px 16px; // Botões maiores para facilitar o toque
      font-size: 14px;
    }
    
    &.cancel {
      border-color: #d9d9d9;
      color: rgba(0, 0, 0, 0.65);
      background-color: white;
      
      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }
    }
    
    &.apply {
      border-color: #1890ff;
      background-color: #1890ff;
      color: white;
      
      &:hover {
        background-color: #40a9ff;
        border-color: #40a9ff;
      }
    }
  }
`;

/**
 * Componente personalizado para seleção de intervalo de datas
 */
const MiniRangeDateInputPersonalizavel = ({
  value = [],
  onChange,
  placeholder = "DD/MM → DD/MM",
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
  // Estados para controle do componente
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [displayValue, setDisplayValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startMonth, setStartMonth] = useState(moment().startOf('month'));
  const [endMonth, setEndMonth] = useState(moment().add(1, 'month').startOf('month'));
  const containerRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  
  // Atualiza o valor quando as props mudam
  useEffect(() => {
    if (Array.isArray(value) && value.length === 2) {
      const [start, end] = value;
      if (moment.isMoment(start) && moment.isMoment(end)) {
        setStartDate(start);
        setEndDate(end);
        setDisplayValue(`${start.format('DD/MM')} → ${end.format('DD/MM')}`);
      }
    } else if (!value || value.length === 0) {
      setStartDate(null);
      setEndDate(null);
      setDisplayValue('');
    }
  }, [value]);
  
  // Atualiza a posição do calendário quando ele é aberto
useEffect(() => {
    if (isCalendarOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth <= 600;
      const calendarWidth = isMobile ? 320 : 560; // Largura ajustada conforme o dispositivo
      const calendarHeight = isMobile ? 500 : 400; // Altura pode ser maior em dispositivos móveis devido ao layout em coluna
      
      // Calcula a posição inicial
      let leftPosition;
      
      // Em telas muito pequenas, centraliza horizontalmente
      if (windowWidth <= 400) {
        leftPosition = Math.max(0, (windowWidth - calendarWidth) / 2);
      } else {
        leftPosition = rect.left + window.scrollX;
        
        // Ajusta a posição horizontal se necessário
        if (leftPosition + calendarWidth > windowWidth - 20) {
          // Tenta alinhar à direita do componente
          const rightAligned = rect.right - calendarWidth;
          leftPosition = rightAligned > 0 ? rightAligned : Math.max(0, (windowWidth - calendarWidth) / 2);
        }
      }
      
      // Ajusta a posição vertical
      let topPosition = rect.bottom + window.scrollY + 4;
      
      // Em telas muito pequenas, checa se há espaço suficiente abaixo
      if (topPosition + calendarHeight > windowHeight + window.scrollY - 20) {
        // Verifica se há mais espaço acima ou abaixo
        const spaceAbove = rect.top - window.scrollY;
        const spaceBelow = windowHeight - (rect.bottom - window.scrollY);
        
        if (spaceAbove > spaceBelow && spaceAbove >= calendarHeight) {
          // Posiciona acima se houver espaço suficiente
          topPosition = rect.top + window.scrollY - calendarHeight - 4;
        } else if (windowHeight < calendarHeight) {
          // Se a tela for menor que o calendário, posiciona no topo
          topPosition = window.scrollY + 10;
        }
      }
      
      setCalendarPosition({
        top: topPosition,
        left: leftPosition,
      });
    }
  }, [isCalendarOpen]);
  
  // Fechar o calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.calendar-popup')
      ) {
        handleCalendarClose(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função para abrir o calendário
  const handleInputClick = () => {
    setIsCalendarOpen(true);
    // Define os meses de início para o calendário
    if (startDate) {
      setStartMonth(startDate.clone().startOf('month'));
      setEndMonth(endDate ? endDate.clone().startOf('month') : startDate.clone().add(1, 'month').startOf('month'));
    } else {
      setStartMonth(moment().startOf('month'));
      setEndMonth(moment().add(1, 'month').startOf('month'));
    }
    
    // Configura datas temporárias para seleção
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsSelecting(false);
  };
  
  const handleCalendarClose = (applyChanges = false) => {
    setIsCalendarOpen(false);
    
    if (applyChanges && tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      
      // Formata para exibição
      setDisplayValue(`${tempStartDate.format('DD/MM')} → ${tempEndDate.format('DD/MM')}`);
      
      // Notifica a mudança
      if (onChange) {
        onChange([tempStartDate, tempEndDate]);
      }
    }
  };
  
  const handlePrevMonth = (whichCalendar) => {
    if (whichCalendar === 'start') {
      setStartMonth(startMonth.clone().subtract(1, 'month'));
    } else {
      setEndMonth(endMonth.clone().subtract(1, 'month'));
    }
  };
  
  const handleNextMonth = (whichCalendar) => {
    if (whichCalendar === 'start') {
      setStartMonth(startMonth.clone().add(1, 'month'));
    } else {
      setEndMonth(endMonth.clone().add(1, 'month'));
    }
  };
  
  const handleDayClick = (day) => {
    if (isDateDisabled(day)) return;
    
    if (!isSelecting) {
      // Primeiro clique - seleciona data inicial
      setTempStartDate(day);
      setTempEndDate(null);
      setIsSelecting(true);
    } else {
      // Segundo clique - seleciona data final ou redefine se for anterior
      if (day.isBefore(tempStartDate)) {
        setTempStartDate(day);
        setTempEndDate(null);
      } else {
        setTempEndDate(day);
        setIsSelecting(false);
      }
    }
  };
  
  const isDateDisabled = (date) => {
    if (!disabledDate) return false;
    return disabledDate(date);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setDisplayValue('');
    
    if (onChange) {
      onChange([]);
    }
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
  
  // Gerar dias do calendário para um mês específico
  const generateCalendarDays = (month) => {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');
    
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
  
  // Verificar se uma data está no intervalo selecionado
  const isInRange = (date) => {
    if (!tempStartDate || !tempEndDate) return false;
    
    return date.isAfter(tempStartDate) && date.isBefore(tempEndDate);
  };
  
  // Renderizar o calendário usando um portal
  const renderCalendar = () => {
    if (!isCalendarOpen) return null;
    
    const startMonthDays = generateCalendarDays(startMonth);
    const endMonthDays = generateCalendarDays(endMonth);
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
        <CalendarsContainer>
          {/* Calendário de início */}
          <SingleCalendarContainer>
            <CalendarHeader>
              <button onClick={() => handlePrevMonth('start')} title="Mês anterior">
                &lt;
              </button>
              <div className="month-year">
                {startMonth.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
              </div>
              <button onClick={() => handleNextMonth('start')} title="Próximo mês">
                &gt;
              </button>
            </CalendarHeader>
            
            <WeekdaysRow>
              {weekdays.map((weekday, index) => (
                <div key={`start-weekday-${index}`} className="weekday">
                  {weekday}
                </div>
              ))}
            </WeekdaysRow>
            
            <DaysGrid>
              {startMonthDays.map((day, index) => {
                const isSelectedStartDay = tempStartDate && day.isSame(tempStartDate, 'day');
                const isSelectedEndDay = tempEndDate && day.isSame(tempEndDate, 'day');
                const isToday = day.isSame(today, 'day');
                const isCurrentMonth = day.isSame(startMonth, 'month');
                const isDisabled = isDateDisabled(day);
                const dayInRange = isInRange(day);
                
                return (
                  <div
                    key={`start-day-${index}`}
                    className={`day 
                      ${isSelectedStartDay || isSelectedEndDay ? 'selected' : ''} 
                      ${isToday ? 'today' : ''} 
                      ${!isCurrentMonth ? 'other-month' : ''} 
                      ${isDisabled ? 'disabled' : ''}
                      ${dayInRange ? 'in-range' : ''}
                    `}
                    onClick={() => !isDisabled && handleDayClick(day)}
                  >
                    {day.date()}
                  </div>
                );
              })}
            </DaysGrid>
          </SingleCalendarContainer>
          
          {/* Calendário de fim */}
          <SingleCalendarContainer>
            <CalendarHeader>
              <button onClick={() => handlePrevMonth('end')} title="Mês anterior">
                &lt;
              </button>
              <div className="month-year">
                {endMonth.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
              </div>
              <button onClick={() => handleNextMonth('end')} title="Próximo mês">
                &gt;
              </button>
            </CalendarHeader>
            
            <WeekdaysRow>
              {weekdays.map((weekday, index) => (
                <div key={`end-weekday-${index}`} className="weekday">
                  {weekday}
                </div>
              ))}
            </WeekdaysRow>
            
            <DaysGrid>
              {endMonthDays.map((day, index) => {
                const isSelectedStartDay = tempStartDate && day.isSame(tempStartDate, 'day');
                const isSelectedEndDay = tempEndDate && day.isSame(tempEndDate, 'day');
                const isToday = day.isSame(today, 'day');
                const isCurrentMonth = day.isSame(endMonth, 'month');
                const isDisabled = isDateDisabled(day);
                const dayInRange = isInRange(day);
                
                return (
                  <div
                    key={`end-day-${index}`}
                    className={`day 
                      ${isSelectedStartDay || isSelectedEndDay ? 'selected' : ''} 
                      ${isToday ? 'today' : ''} 
                      ${!isCurrentMonth ? 'other-month' : ''} 
                      ${isDisabled ? 'disabled' : ''}
                      ${dayInRange ? 'in-range' : ''}
                    `}
                    onClick={() => !isDisabled && handleDayClick(day)}
                  >
                    {day.date()}
                  </div>
                );
              })}
            </DaysGrid>
          </SingleCalendarContainer>
        </CalendarsContainer>
        
        <FooterButtons>
          <button className="cancel" onClick={() => handleCalendarClose(false)}>
            Cancelar
          </button>
          <button 
            className="apply" 
            onClick={() => handleCalendarClose(true)}
            disabled={!tempStartDate || !tempEndDate}
          >
            Aplicar
          </button>
        </FooterButtons>
      </CalendarContainer>,
      document.body
    );
  };
  
  return (
    <DateRangeContainer 
      ref={containerRef}
      hasValue={displayValue.length > 0}
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
        value={displayValue}
        readOnly
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        {...restProps}
      />
      {displayValue.length > 0 && (
        <button
          className="clear-button"
          onClick={handleClear}
          title="Limpar datas"
          type="button"
        >
          ×
        </button>
      )}
      
      {renderCalendar()}
    </DateRangeContainer>
  );
};

export default MiniRangeDateInputPersonalizavel;