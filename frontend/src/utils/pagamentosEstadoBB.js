/**
 * Utilitário para mapear estados do Banco do Brasil (estadoRequisicao) para cores e labels
 * Baseado na documentação oficial do BB API de Pagamentos
 * 
 * Estados do BB (1-10):
 * 1: Requisição com todos os lançamentos com dados consistentes (aguardando liberação)
 * 2: Requisição com ao menos um dos lançamentos com dados inconsistentes
 * 3: Requisição com todos os lançamentos com dados inconsistentes
 * 4: Requisição pendente de ação pelo Conveniado (aguardando liberação)
 * 5: Requisição em processamento pelo Banco
 * 6: Requisição Processada
 * 7: Requisição Rejeitada
 * 8: Preparando remessa não liberada
 * 9: Requisição liberada via API
 * 10: Preparando remessa liberada
 */

/**
 * Mapeia o estadoRequisicao do BB para configuração de exibição
 * @param {number|null|undefined} estadoRequisicao - Estado retornado pelo BB (1-10)
 * @returns {object} - Objeto com color, label e tooltip
 */
export const mapearEstadoBB = (estadoRequisicao) => {
  if (!estadoRequisicao) {
    return {
      color: 'default',
      label: 'N/A',
      tooltip: 'Estado não disponível',
      categoria: 'indefinido',
    };
  }

  switch (estadoRequisicao) {
    case 1:
      // Dados consistentes, aguardando liberação
      return {
        color: 'gold', // Amarelo
        label: 'Dados Consistentes',
        tooltip: 'Requisição com todos os lançamentos com dados consistentes - Aguardando liberação',
        categoria: 'aguardando',
      };
    
    case 2:
      // Dados inconsistentes (parcial)
      return {
        color: 'orange',
        label: 'Dados Inconsistentes',
        tooltip: 'Requisição com ao menos um dos lançamentos com dados inconsistentes',
        categoria: 'inconsistente',
      };
    
    case 3:
      // Todos inconsistentes (erro)
      return {
        color: 'red',
        label: 'Todos Inconsistentes',
        tooltip: 'Requisição com todos os lançamentos com dados inconsistentes',
        categoria: 'erro',
      };
    
    case 4:
      // Aguardando liberação
      return {
        color: 'gold', // Amarelo
        label: 'Aguardando Liberação',
        tooltip: 'Requisição pendente de ação pelo Conveniado',
        categoria: 'aguardando',
      };
    
    case 5:
      // Em processamento
      return {
        color: 'blue',
        label: 'Em Processamento',
        tooltip: 'Requisição em processamento pelo Banco',
        categoria: 'processando',
      };
    
    case 6:
      // Processada (sucesso)
      return {
        color: 'green',
        label: 'Processada',
        tooltip: 'Requisição Processada',
        categoria: 'concluido',
      };
    
    case 7:
      // Rejeitada (erro)
      return {
        color: 'red',
        label: 'Rejeitada',
        tooltip: 'Requisição Rejeitada',
        categoria: 'erro',
      };
    
    case 8:
      // Preparando remessa (processamento)
      return {
        color: 'blue',
        label: 'Preparando Remessa',
        tooltip: 'Preparando remessa não liberada',
        categoria: 'processando',
      };
    
    case 9:
      // Liberada (sucesso)
      return {
        color: 'green',
        label: 'Liberada',
        tooltip: 'Requisição liberada via API',
        categoria: 'concluido',
      };
    
    case 10:
      // Remessa liberada (sucesso)
      return {
        color: 'green',
        label: 'Remessa Liberada',
        tooltip: 'Preparando remessa liberada',
        categoria: 'concluido',
      };
    
    default:
      return {
        color: 'default',
        label: `Estado ${estadoRequisicao}`,
        tooltip: `Estado desconhecido: ${estadoRequisicao}`,
        categoria: 'indefinido',
      };
  }
};

/**
 * Hook para usar o mapeamento de estados do BB
 * @param {number|null|undefined} estadoRequisicao - Estado retornado pelo BB
 * @param {number|null|undefined} estadoRequisicaoAtual - Estado atual (prioritário)
 * @returns {object} - Configuração de exibição do estado
 */
export const useEstadoBB = (estadoRequisicao, estadoRequisicaoAtual = null) => {
  // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
  const estado = estadoRequisicaoAtual || estadoRequisicao;
  return mapearEstadoBB(estado);
};

