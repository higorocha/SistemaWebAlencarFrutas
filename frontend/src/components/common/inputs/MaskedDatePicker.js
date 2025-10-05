// src/components/common/inputs/MaskedDatePicker.js

import React from 'react';
import { DatePicker } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';

/**
 * DatePicker com máscara automática de data (DD/MM/YYYY)
 * 
 * Adiciona barras automaticamente enquanto o usuário digita:
 * - Digite: 06122025
 * - Resultado: 06/12/2025
 * 
 * @component
 * @example
 * // Uso básico
 * <MaskedDatePicker
 *   value={dataColheita}
 *   onChange={(date) => setDataColheita(date)}
 *   placeholder="Selecione a data"
 * />
 * 
 * @example
 * // Com validação e desabilitação de datas futuras
 * <MaskedDatePicker
 *   value={dataPagamento}
 *   onChange={(date) => setDataPagamento(date)}
 *   disabledDate={(current) => current && current > moment().endOf('day')}
 *   showToday
 * />
 */
const MaskedDatePicker = ({ value, onChange, placeholder = "DD/MM/AAAA", showToday = true, ...props }) => {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) {
      const input = inputRef.current.querySelector('input');
      if (input) {
        const handleInput = (e) => {
          let inputValue = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
          
          // Adiciona primeira barra após 2 dígitos (dia)
          if (inputValue.length >= 2) {
            inputValue = inputValue.substring(0, 2) + '/' + inputValue.substring(2);
          }
          
          // Adiciona segunda barra após 4 dígitos (mês)
          if (inputValue.length >= 5) {
            inputValue = inputValue.substring(0, 5) + '/' + inputValue.substring(5, 9);
          }
          
          // Atualiza o valor do input com as barras
          e.target.value = inputValue;
          
          // Se a data estiver completa (10 caracteres), tentar converter para moment
          if (inputValue.length === 10) {
            const momentValue = moment(inputValue, 'DD/MM/YYYY', true);
            if (momentValue.isValid()) {
              onChange(momentValue);
            }
          }
        };

        input.addEventListener('input', handleInput);
        
        // Cleanup: remove o listener quando o componente desmontar
        return () => input.removeEventListener('input', handleInput);
      }
    }
  }, [onChange]);

  return (
    <div ref={inputRef} style={{ width: '100%' }}>
      <DatePicker
        {...props}
        value={value}
        onChange={onChange}
        format="DD/MM/YYYY"
        placeholder={placeholder}
        style={{ width: '100%', ...props.style }}
      />
    </div>
  );
};

MaskedDatePicker.propTypes = {
  /** Valor da data (objeto moment) */
  value: PropTypes.object,
  /** Callback chamado quando a data muda */
  onChange: PropTypes.func.isRequired,
  /** Placeholder do campo */
  placeholder: PropTypes.string,
  /** Tamanho do campo */
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  /** Função para desabilitar datas específicas */
  disabledDate: PropTypes.func,
  /** Mostra botão "Hoje" */
  showToday: PropTypes.bool,
  /** Estilos customizados */
  style: PropTypes.object,
};


export default MaskedDatePicker;
