// src/hooks/useRestricaoDataPagamentoLoteBB.js

import { useCallback, useEffect } from 'react';
import moment from '../config/momentConfig';
import { showNotification } from '../config/notificationConfig';

/**
 * Hook para validação de restrições de data e horário para pagamentos via API de Pagamentos em Lote do Banco do Brasil
 * 
 * Regras implementadas:
 * 1. Não permite selecionar domingos
 * 2. Se selecionar dia atual, não pode ser após 20:00 (se for, deve selecionar próximo dia útil)
 * 3. Mostra alerta informando que deve liberar remessa até 21:00 do dia atual
 * 
 * @returns {Object} Objeto com funções de validação e alertas
 */
const useRestricaoDataPagamentoLoteBB = () => {
  // Log do horário quando o hook é inicializado para verificar fuso horário
  useEffect(() => {
    const dataAtual = moment();
    const dataAtualUTC = moment.utc();
    const timezone = dataAtual.format('Z'); // Offset do timezone (ex: -03:00)
    const timezoneName = dataAtual.format('z'); // Nome do timezone (ex: BRT)
    const timezoneZone = dataAtual.tz(); // Timezone atual (ex: America/Sao_Paulo)
    const timezoneGuess = moment.tz.guess(); // Timezone detectado pelo navegador
    
    console.log('🕐 [useRestricaoDataPagamentoLoteBB] Hook inicializado - Verificação de Fuso Horário:');
    console.log('  📅 Data/Hora Local (BR):', dataAtual.format('DD/MM/YYYY HH:mm:ss'));
    console.log('  🌍 Data/Hora UTC:', dataAtualUTC.format('DD/MM/YYYY HH:mm:ss'));
    console.log('  🕒 Timezone Offset:', timezone, '(deve ser -03:00 para BR)');
    console.log('  📍 Timezone Name:', timezoneName, '(deve ser BRT ou BRST)');
    console.log('  ✅ Fuso horário configurado:', timezoneZone || 'America/Sao_Paulo (padrão)');
    console.log('  🔍 Timezone detectado pelo navegador:', timezoneGuess);
    console.log('  ⏰ Hora atual (formato 24h):', dataAtual.format('HH:mm:ss'));
  }, []);

  /**
   * Calcula o próximo dia útil (pula domingos)
   * @param {moment.Moment} dataInicial - Data inicial para começar a busca
   * @returns {moment.Moment} Próximo dia útil
   */
  const calcularProximoDiaUtil = useCallback((dataInicial) => {
    let proximaData = dataInicial.clone().add(1, 'day');
    
    // Pular domingos até encontrar um dia útil
    while (proximaData.day() === 0) { // 0 = domingo
      proximaData.add(1, 'day');
    }
    
    return proximaData;
  }, []);

  /**
   * Valida se a data selecionada está dentro das restrições
   * @param {moment.Moment|null} dataSelecionada - Data selecionada pelo usuário
   * @returns {Object} { valida: boolean, mensagem: string, proximoDiaUtil: moment.Moment|null }
   */
  const validarDataPagamento = useCallback((dataSelecionada) => {
    if (!dataSelecionada) {
      return {
        valida: false,
        mensagem: 'Selecione uma data de pagamento.',
        proximoDiaUtil: null,
      };
    }

    const dataAtual = moment();
    const horaAtual = dataAtual.hour();
    const minutoAtual = dataAtual.minute();
    const horaMinutoAtual = horaAtual * 60 + minutoAtual; // Converter para minutos para facilitar comparação
    const limiteHorario = 20 * 60; // 20:00 em minutos (1200 minutos)

    // Verificar se é domingo
    if (dataSelecionada.day() === 0) {
      const proximoDiaUtil = calcularProximoDiaUtil(dataSelecionada);
      return {
        valida: false,
        mensagem: `Não é possível selecionar domingo. Selecione o próximo dia útil: ${proximoDiaUtil.format('DD/MM/YYYY')}.`,
        proximoDiaUtil,
      };
    }

    // Verificar se é dia atual e se a hora é superior a 20:00
    if (dataSelecionada.isSame(dataAtual, 'day')) {
      if (horaMinutoAtual > limiteHorario) {
        const proximoDiaUtil = calcularProximoDiaUtil(dataAtual);
        return {
          valida: false,
          mensagem: `Após 20:00, não é possível criar pagamentos para o dia atual. Selecione o próximo dia útil: ${proximoDiaUtil.format('DD/MM/YYYY')}.`,
          proximoDiaUtil,
        };
      }
    }

    // Data válida
    return {
      valida: true,
      mensagem: null,
      proximoDiaUtil: null,
    };
  }, [calcularProximoDiaUtil]);

  /**
   * Função para usar no disabledDate do DatePicker
   * Desabilita domingos, datas anteriores à data atual e o dia atual se já passou das 20:00
   * @param {moment.Moment} current - Data atual sendo verificada
   * @returns {boolean} true se deve desabilitar, false caso contrário
   */
  const disabledDate = useCallback((current) => {
    if (!current) return false;

    const dataAtual = moment();
    const horaAtual = dataAtual.hour();
    const minutoAtual = dataAtual.minute();
    const horaMinutoAtual = horaAtual * 60 + minutoAtual;
    const limiteHorario = 20 * 60; // 20:00 em minutos

    // Desabilitar datas anteriores à data atual
    if (current < dataAtual.startOf('day')) {
      return true;
    }

    // Desabilitar domingos
    if (current.day() === 0) {
      return true;
    }

    // Se já passou das 20:00, desabilitar o dia atual
    if (current.isSame(dataAtual, 'day') && horaMinutoAtual > limiteHorario) {
      return true;
    }

    return false;
  }, []);

  /**
   * Mostra alerta informando que deve liberar a remessa até 21:00 do dia atual
   * Este alerta é mostrado sempre que um pagamento via API de Lote BB é criado com sucesso
   * @param {moment.Moment|null} dataPagamento - Data de pagamento selecionada (para referência, mas o alerta é sempre sobre o dia atual)
   */
  const mostrarAlertaLiberacao = useCallback((dataPagamento = null) => {
    const dataAtual = moment();
    
    showNotification(
      'info',
      'Importante: Liberação da Remessa',
      `Para que o pagamento seja processado, é necessário liberar a remessa em Relatórios → Pagamentos até as 21:00 do dia atual (${dataAtual.format('DD/MM/YYYY')} às 21:00).`
    );
  }, []);

  /**
   * Valida e mostra erro se necessário, retornando se a validação passou
   * Útil para validar antes de processar o pagamento
   * @param {moment.Moment|null} dataSelecionada - Data selecionada
   * @returns {boolean} true se válida, false caso contrário
   */
  const validarEMostrarErro = useCallback((dataSelecionada) => {
    const validacao = validarDataPagamento(dataSelecionada);
    
    if (!validacao.valida) {
      showNotification('error', 'Data de Pagamento Inválida', validacao.mensagem);
      return false;
    }
    
    return true;
  }, [validarDataPagamento]);

  return {
    validarDataPagamento,
    disabledDate,
    mostrarAlertaLiberacao,
    validarEMostrarErro,
    calcularProximoDiaUtil,
  };
};

export default useRestricaoDataPagamentoLoteBB;

