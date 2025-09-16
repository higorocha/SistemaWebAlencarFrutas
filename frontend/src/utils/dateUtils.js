/**
 * Utilitários para manipulação de datas e semanas
 */

/**
 * Calcula o número da semana no ano para uma data específica
 * Usa a mesma lógica do calendário (semanas ISO - segunda a domingo)
 * @param {Date|string} data - Data para calcular a semana
 * @returns {number} Número da semana no ano (1-53)
 */
export const obterNumeroSemana = (data) => {
  const dataObj = new Date(data);
  
  // Normalizar para data local (sem fuso horário)
  const dataLocal = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
  
  // Usar a mesma lógica do calendário (semanas ISO)
  const primeiroDiaAno = new Date(dataLocal.getFullYear(), 0, 1);
  const diaSemana = primeiroDiaAno.getDay();
  const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const primeiroDiaSemana = new Date(primeiroDiaAno);
  primeiroDiaSemana.setDate(primeiroDiaAno.getDate() + diasParaSegunda);
  
  let dataAtual = new Date(primeiroDiaSemana);
  let numeroSemana = 1;
  
  while (dataAtual <= dataLocal) {
    const fimSemana = new Date(dataAtual);
    fimSemana.setDate(fimSemana.getDate() + 6);
    
    if (dataLocal >= dataAtual && dataLocal <= fimSemana) {
      return numeroSemana;
    }
    
    dataAtual.setDate(dataAtual.getDate() + 7);
    numeroSemana++;
  }
  
  return numeroSemana;
};

/**
 * Formata uma data para o padrão brasileiro
 * @param {Date|string} data - Data para formatar
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
export const formatarData = (data) => {
  return new Date(data).toLocaleDateString('pt-BR');
};

/**
 * Formata uma data para o padrão brasileiro (apenas dia/mês)
 * @param {Date|string} data - Data para formatar
 * @returns {string} Data formatada (DD/MM)
 */
export const formatarDataCurta = (data) => {
  return new Date(data).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit' 
  });
};

/**
 * Calcula a diferença em dias entre duas datas
 * @param {Date|string} dataInicio - Data de início
 * @param {Date|string} dataFim - Data de fim
 * @returns {number} Diferença em dias
 */
export const calcularDiferencaDias = (dataInicio, dataFim) => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  return Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
};

/**
 * Calcula a diferença em semanas entre duas datas
 * @param {Date|string} dataInicio - Data de início
 * @param {Date|string} dataFim - Data de fim
 * @returns {number} Diferença em semanas
 */
export const calcularDiferencaSemanas = (dataInicio, dataFim) => {
  const dias = calcularDiferencaDias(dataInicio, dataFim);
  return Math.floor(dias / 7);
};

/**
 * Verifica se uma data está dentro de um período
 * @param {Date|string} data - Data para verificar
 * @param {Date|string} dataInicio - Início do período
 * @param {Date|string} dataFim - Fim do período
 * @returns {boolean} True se a data está no período
 */
export const estaNoPeriodo = (data, dataInicio, dataFim) => {
  const dataObj = new Date(data);
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  return dataObj >= inicio && dataObj <= fim;
};

/**
 * Calcula o status de maturação baseado nos dias desde o registro
 * @param {number} diasDesdeRegistro - Número de dias desde o registro
 * @returns {string} Status da maturação ('maturacao', 'colheita', 'alerta', 'vencido')
 */
export const calcularStatusMaturacao = (diasDesdeRegistro) => {
  if (diasDesdeRegistro < 100) {
    return 'maturacao';
  } else if (diasDesdeRegistro <= 115) {
    return 'colheita';
  } else if (diasDesdeRegistro <= 125) {
    return 'alerta';
  } else {
    return 'vencido';
  }
};
