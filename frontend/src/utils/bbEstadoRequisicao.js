/**
 * Utilitário para mapear estados de requisição do Banco do Brasil
 * Baseado na documentação oficial da API de Pagamentos BB
 * 
 * Estados do BB (estadoRequisicao):
 * 1 - Requisição com todos os lançamentos com dados consistentes (aguardando liberação)
 * 2 - Requisição com ao menos um dos lançamentos com dados inconsistentes
 * 3 - Requisição com todos os lançamentos com dados inconsistentes
 * 4 - Requisição pendente de ação pelo Conveniado (aguardando liberação)
 * 5 - Requisição em processamento pelo Banco
 * 6 - Requisição Processada (concluída)
 * 7 - Requisição Rejeitada
 * 8 - Preparando remessa não liberada
 * 9 - Requisição liberada via API (liberada)
 * 10 - Preparando remessa liberada (liberada)
 */

/**
 * Mapeia o estado de requisição do BB para configuração de exibição
 * @param {number|null|undefined} estadoRequisicao - Estado retornado pelo BB (1-10)
 * @returns {object} - Objeto com color, label, tooltip e categoria
 */
export const mapearEstadoRequisicao = (estadoRequisicao) => {
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
      return {
        color: 'gold', // Amarelo - aguardando liberação
        label: 'Dados Consistentes',
        tooltip: 'Requisição com todos os lançamentos com dados consistentes. Aguardando liberação.',
        categoria: 'aguardando',
      };
    case 2:
      return {
        color: 'orange', // Laranja - inconsistências parciais
        label: 'Dados Inconsistentes',
        tooltip: 'Requisição com ao menos um dos lançamentos com dados inconsistentes',
        categoria: 'inconsistente',
      };
    case 3:
      return {
        color: 'red', // Vermelho - todos inconsistentes
        label: 'Todos Inconsistentes',
        tooltip: 'Requisição com todos os lançamentos com dados inconsistentes',
        categoria: 'erro',
      };
    case 4:
      return {
        color: 'gold', // Amarelo - aguardando liberação
        label: 'Aguardando Liberação',
        tooltip: 'Requisição pendente de ação pelo Conveniado',
        categoria: 'aguardando',
      };
    case 5:
      return {
        color: 'blue', // Azul - em processamento
        label: 'Em Processamento',
        tooltip: 'Requisição em processamento pelo Banco',
        categoria: 'processando',
      };
    case 6:
      return {
        color: 'green', // Verde - processada/concluída
        label: 'Processada',
        tooltip: 'Requisição Processada',
        categoria: 'concluido',
      };
    case 7:
      return {
        color: 'red', // Vermelho - rejeitada
        label: 'Rejeitada',
        tooltip: 'Requisição Rejeitada',
        categoria: 'erro',
      };
    case 8:
      return {
        color: 'blue', // Azul - preparando remessa
        label: 'Preparando Remessa',
        tooltip: 'Preparando remessa não liberada',
        categoria: 'processando',
      };
    case 9:
      return {
        color: 'green', // Verde - liberada
        label: 'Liberada',
        tooltip: 'Requisição liberada via API',
        categoria: 'concluido',
      };
    case 10:
      return {
        color: 'green', // Verde - remessa liberada
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
 * Obtém a cor hexadecimal correspondente ao estado (para uso em React Native)
 * @param {number|null|undefined} estadoRequisicao - Estado retornado pelo BB (1-10)
 * @returns {string} - Cor hexadecimal
 */
export const obterCorEstadoRequisicao = (estadoRequisicao) => {
  const mapeamento = mapearEstadoRequisicao(estadoRequisicao);
  
  // Mapeamento de cores Ant Design para hex (para React Native)
  const coresHex = {
    gold: '#faad14',      // Amarelo
    orange: '#fa8c16',    // Laranja
    red: '#ff4d4f',       // Vermelho
    blue: '#1890ff',      // Azul
    green: '#52c41a',     // Verde
    default: '#6c757d',   // Cinza
  };
  
  return coresHex[mapeamento.color] || coresHex.default;
};

/**
 * Obtém apenas o label do estado (versão curta para mobile)
 * @param {number|null|undefined} estadoRequisicao - Estado retornado pelo BB (1-10)
 * @param {boolean} incluirNumero - Se deve incluir o número do estado (ex: "1 - Dados Consistentes")
 * @returns {string} - Label do estado
 */
export const obterLabelEstadoRequisicao = (estadoRequisicao, incluirNumero = false) => {
  const mapeamento = mapearEstadoRequisicao(estadoRequisicao);
  
  if (incluirNumero && estadoRequisicao) {
    return `${estadoRequisicao} - ${mapeamento.label}`;
  }
  
  return mapeamento.label;
};

