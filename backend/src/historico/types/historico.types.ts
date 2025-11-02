import { StatusPedido } from '@prisma/client';

/**
 * Enum com todos os tipos de ações rastreadas no histórico de pedidos
 *
 * Categorias:
 * - CRIAÇÃO: Ações de criação de pedido
 * - EDIÇÃO: Edições gerais e ajustes
 * - COLHEITA: Operações de colheita
 * - PRECIFICAÇÃO: Operações de precificação
 * - PAGAMENTO: Operações de pagamento
 * - FINALIZAÇÃO: Operações de finalização/cancelamento
 * - TRANSIÇÃO: Transições automáticas de status
 */
export enum TipoAcaoHistorico {
  // Criação
  CRIACAO_PEDIDO = 'CRIACAO_PEDIDO',

  // Edição
  EDICAO_GERAL = 'EDICAO_GERAL',
  EDICAO_DADOS_COMPLEMENTARES = 'EDICAO_DADOS_COMPLEMENTARES',

  // Colheita
  ATUALIZACAO_COLHEITA = 'ATUALIZACAO_COLHEITA',
  COLHEITA_COMPLETADA = 'COLHEITA_COMPLETADA',

  // Precificação
  ATUALIZACAO_PRECIFICACAO = 'ATUALIZACAO_PRECIFICACAO',
  AJUSTE_PRECIFICACAO = 'AJUSTE_PRECIFICACAO',

  // Pagamento
  PAGAMENTO_ADICIONADO = 'PAGAMENTO_ADICIONADO',
  PAGAMENTO_ATUALIZADO = 'PAGAMENTO_ATUALIZADO',
  PAGAMENTO_REMOVIDO = 'PAGAMENTO_REMOVIDO',

  // Finalização
  FINALIZAR_PEDIDO = 'FINALIZAR_PEDIDO',
  CANCELAR_PEDIDO = 'CANCELAR_PEDIDO',
  REMOVER_PEDIDO = 'REMOVER_PEDIDO',

  // Transições automáticas
  TRANSICAO_AGUARDANDO_COLHEITA = 'TRANSICAO_AGUARDANDO_COLHEITA',
  TRANSICAO_AGUARDANDO_PRECIFICACAO = 'TRANSICAO_AGUARDANDO_PRECIFICACAO',
  TRANSICAO_AGUARDANDO_PAGAMENTO = 'TRANSICAO_AGUARDANDO_PAGAMENTO',
}

/**
 * Interface tipada para detalhes do histórico
 * Substitui o 'any' genérico por estrutura bem definida
 */
export interface HistoricoDetalhes {
  /** Status anterior do pedido */
  statusAnterior?: StatusPedido;

  /** Novo status do pedido */
  statusNovo?: StatusPedido;

  /** Mensagem descritiva da ação */
  mensagem?: string;

  /** Valor monetário relacionado (para pagamentos) */
  valor?: number;

  /** Método de pagamento (para operações de pagamento) */
  metodoPagamento?: string;

  /** ID do pagamento (para operações de pagamento) */
  pagamentoId?: number;

  /** Campo específico que foi alterado */
  campo?: string;

  /** Valor anterior do campo (para comparações) */
  valorAnterior?: any;

  /** Novo valor do campo (para comparações) */
  valorNovo?: any;

  /** Operações com frutas */
  frutas?: Array<{
    frutaId: number;
    frutaNome: string;
    acao: string;
    quantidadeAnterior?: number;
    quantidadeNova?: number;
  }>;

  /** Dados adicionais específicos da operação */
  dadosOperacao?: any;

  /** Observações adicionais */
  observacoes?: string;

  /** Motivo da ação (útil para cancelamentos) */
  motivo?: string;
}

/**
 * Interface para registro de ação no histórico
 */
export interface RegistrarAcaoParams {
  pedidoId: number;
  usuarioId: number;
  acao: TipoAcaoHistorico;
  detalhes?: HistoricoDetalhes;
}

/**
 * Mapeamento de descrições amigáveis para cada tipo de ação
 */
export const DESCRICAO_ACOES: Record<TipoAcaoHistorico, string> = {
  [TipoAcaoHistorico.CRIACAO_PEDIDO]: 'Pedido criado',
  [TipoAcaoHistorico.EDICAO_GERAL]: 'Dados básicos editados',
  [TipoAcaoHistorico.EDICAO_DADOS_COMPLEMENTARES]: 'Dados complementares editados',
  [TipoAcaoHistorico.ATUALIZACAO_COLHEITA]: 'Colheita atualizada',
  [TipoAcaoHistorico.COLHEITA_COMPLETADA]: 'Colheita completada',
  [TipoAcaoHistorico.ATUALIZACAO_PRECIFICACAO]: 'Precificação atualizada',
  [TipoAcaoHistorico.AJUSTE_PRECIFICACAO]: 'Precificação ajustada',
  [TipoAcaoHistorico.PAGAMENTO_ADICIONADO]: 'Pagamento adicionado',
  [TipoAcaoHistorico.PAGAMENTO_ATUALIZADO]: 'Pagamento atualizado',
  [TipoAcaoHistorico.PAGAMENTO_REMOVIDO]: 'Pagamento removido',
  [TipoAcaoHistorico.FINALIZAR_PEDIDO]: 'Pedido finalizado',
  [TipoAcaoHistorico.CANCELAR_PEDIDO]: 'Pedido cancelado',
  [TipoAcaoHistorico.REMOVER_PEDIDO]: 'Pedido removido',
  [TipoAcaoHistorico.TRANSICAO_AGUARDANDO_COLHEITA]: 'Aguardando colheita',
  [TipoAcaoHistorico.TRANSICAO_AGUARDANDO_PRECIFICACAO]: 'Aguardando precificação',
  [TipoAcaoHistorico.TRANSICAO_AGUARDANDO_PAGAMENTO]: 'Aguardando pagamento',
};
