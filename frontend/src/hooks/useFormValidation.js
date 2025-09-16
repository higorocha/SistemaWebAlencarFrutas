// src/hooks/useFormValidation.js

import { useMemo } from 'react';

/**
 * Hook para validação de formulários com memoização
 */
export const useFormValidation = (valoresPagamento, pedidos) => {
  return useMemo(() => {
    const validacao = {};
    let totalValido = 0;
    let quantidadeValida = 0;

    Object.entries(valoresPagamento).forEach(([pedidoId, valor]) => {
      const pedido = pedidos.find(p => p.id.toString() === pedidoId);

      if (!pedido) {
        validacao[pedidoId] = { isValid: false, hasValue: false, error: 'Pedido não encontrado' };
        return;
      }

      const saldoDevedor = (pedido.valorFinal || 0) - (pedido.valorRecebido || 0);
      const valorNumerico = typeof valor === 'string' ? parseFloat(valor) || 0 : valor || 0;

      const hasValue = valorNumerico > 0;
      const isValid = hasValue && valorNumerico <= saldoDevedor;

      validacao[pedidoId] = {
        isValid,
        hasValue,
        valorNumerico,
        saldoDevedor,
        error: hasValue && !isValid ? 'Valor excede saldo devedor' : null
      };

      if (hasValue) {
        quantidadeValida++;
        if (isValid) {
          totalValido += valorNumerico;
        }
      }
    });

    return {
      validacao,
      totalValido,
      quantidadeValida,
      temErros: Object.values(validacao).some(v => v.hasValue && !v.isValid),
      podeSalvar: quantidadeValida > 0 && !Object.values(validacao).some(v => v.hasValue && !v.isValid)
    };
  }, [valoresPagamento, pedidos]);
};

/**
 * Hook para validação específica de pagamentos
 */
export const usePagamentoValidation = (pagamento, saldoDevedor) => {
  return useMemo(() => {
    const valor = typeof pagamento === 'string' ? parseFloat(pagamento) || 0 : pagamento || 0;

    return {
      hasValue: valor > 0,
      isValid: valor > 0 && valor <= saldoDevedor,
      exceedsLimit: valor > saldoDevedor,
      valor
    };
  }, [pagamento, saldoDevedor]);
};