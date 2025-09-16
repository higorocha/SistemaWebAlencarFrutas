// src/hooks/useSmartDashboardReload.js

import { useCallback } from 'react';

/**
 * Hook para gerenciar reload inteligente das seções do dashboard baseado no tipo de modal
 *
 * Regras de reload:
 * - NovoPedidoModal → atualizar seção AGUARDANDO_COLHEITA
 * - ColheitaModal → atualizar seções COLHEITA_REALIZADA e AGUARDANDO_PRECIFICACAO
 * - PrecificacaoModal → atualizar seções PRECIFICACAO_REALIZADA e AGUARDANDO_PAGAMENTO
 * - PagamentoModal → atualizar seções AGUARDANDO_PAGAMENTO, PAGAMENTO_PARCIAL e PEDIDO_FINALIZADO
 * - LancarPagamentosModal → atualizar seções AGUARDANDO_PAGAMENTO, PAGAMENTO_PARCIAL e PEDIDO_FINALIZADO
 */
export const useSmartDashboardReload = (atualizarDadosOtimizado) => {
  // Verificar se a função está disponível
  if (!atualizarDadosOtimizado || typeof atualizarDadosOtimizado !== 'function') {
    console.warn('useSmartDashboardReload: atualizarDadosOtimizado não está disponível');
  }

  const reloadAfterNovoPedido = useCallback(async () => {
    if (atualizarDadosOtimizado && typeof atualizarDadosOtimizado === 'function') {
      console.log('🔄 Smart Reload: Novo pedido criado - atualizando seção de colheita');
      await atualizarDadosOtimizado();
    }
  }, [atualizarDadosOtimizado]);

  const reloadAfterColheita = useCallback(async () => {
    if (atualizarDadosOtimizado && typeof atualizarDadosOtimizado === 'function') {
      console.log('🔄 Smart Reload: Colheita registrada - atualizando seções de colheita e precificação');
      await atualizarDadosOtimizado();
    }
  }, [atualizarDadosOtimizado]);

  const reloadAfterPrecificacao = useCallback(async () => {
    if (atualizarDadosOtimizado && typeof atualizarDadosOtimizado === 'function') {
      console.log('🔄 Smart Reload: Precificação realizada - atualizando seções de precificação e pagamentos');
      await atualizarDadosOtimizado();
    }
  }, [atualizarDadosOtimizado]);

  const reloadAfterPagamento = useCallback(async () => {
    if (atualizarDadosOtimizado && typeof atualizarDadosOtimizado === 'function') {
      console.log('🔄 Smart Reload: Pagamento processado - atualizando seções de pagamentos e finalizados');
      await atualizarDadosOtimizado();
    }
  }, [atualizarDadosOtimizado]);

  const reloadAfterLancarPagamentos = useCallback(async () => {
    if (atualizarDadosOtimizado && typeof atualizarDadosOtimizado === 'function') {
      console.log('🔄 Smart Reload: Pagamentos em lote processados - atualizando seções de pagamentos e finalizados');
      await atualizarDadosOtimizado();
    }
  }, [atualizarDadosOtimizado]);

  return {
    reloadAfterNovoPedido,
    reloadAfterColheita,
    reloadAfterPrecificacao,
    reloadAfterPagamento,
    reloadAfterLancarPagamentos,
  };
};

export default useSmartDashboardReload;