// src/hooks/useCoresPorTempo.js
import moment from 'moment';

/**
 * Hook customizado para obter cores e textos baseados na idade de uma data.
 * Utilizado para indicar o tempo de espera de pagamento de um pedido.
 * 
 * Agora considera o campo 'dias' do cliente para ajustar as faixas de cores
 * proporcionalmente ao prazo específico do cliente.
 *
 * @returns {{getCorPorData: (function(Date, Object?): {cor: string, texto: string, dias: number})}}
 */
const useCoresPorTempo = () => {
  /**
   * Calcula a diferença de dias entre a data fornecida e hoje,
   * e retorna uma cor e um texto correspondente à faixa de dias.
   * 
   * Se o cliente tiver um campo 'dias' definido, as faixas são ajustadas
   * proporcionalmente mantendo as mesmas proporções do comportamento padrão:
   * - Verde: ≤ 23.3% do prazo (equivalente a 7/30)
   * - Amarelo: ≤ 50% do prazo (equivalente a 15/30)
   * - Laranja: ≤ 100% do prazo (equivalente a 30/30)
   * - Vermelho: > 100% do prazo
   *
   * @param {Date | string} data - A data de referência (ex: dataPrecificacaoRealizada).
   * @param {Object} [pedidoOuCliente] - Opcional. Pedido completo ou objeto com cliente.
   *                                    Se for pedido, deve ter `cliente` com `dias`.
   *                                    Se for cliente direto, deve ter `dias`.
   * @returns {{cor: string, texto: string, dias: number | null}}
   */
  const getCorPorData = (data, pedidoOuCliente = null) => {
    if (!data) {
      return { cor: '#d9d9d9', texto: '-', dias: null };
    }

    const hoje = moment();
    const dataReferencia = moment(data);
    const dias = hoje.diff(dataReferencia, 'days');

    // Extrair o campo 'dias' do cliente, se disponível
    let prazoCliente = null;
    if (pedidoOuCliente) {
      // Se for um pedido com cliente
      if (pedidoOuCliente.cliente && pedidoOuCliente.cliente.dias !== null && pedidoOuCliente.cliente.dias !== undefined) {
        prazoCliente = pedidoOuCliente.cliente.dias;
      }
      // Se for um cliente direto
      else if (pedidoOuCliente.dias !== null && pedidoOuCliente.dias !== undefined) {
        prazoCliente = pedidoOuCliente.dias;
      }
    }

    let cor;

    // Se não houver prazo específico do cliente, usar comportamento padrão
    if (!prazoCliente || prazoCliente <= 0) {
      if (dias <= 7) {
        cor = '#52c41a'; // Verde
      } else if (dias <= 15) {
        cor = '#faad14'; // Amarelo
      } else if (dias <= 30) {
        cor = '#fa8c16'; // Laranja
      } else {
        cor = '#ff4d4f'; // Vermelho
      }
    } else {
      // Calcular faixas proporcionais baseadas no prazo do cliente
      // Proporções do padrão: 7/30 = 0.233, 15/30 = 0.5, 30/30 = 1.0
      const limiteVerde = Math.round(prazoCliente * (7 / 30));
      const limiteAmarelo = Math.round(prazoCliente * (15 / 30));
      const limiteLaranja = prazoCliente; // 100% do prazo

      if (dias <= limiteVerde) {
        cor = '#52c41a'; // Verde
      } else if (dias <= limiteAmarelo) {
        cor = '#faad14'; // Amarelo
      } else if (dias <= limiteLaranja) {
        cor = '#fa8c16'; // Laranja
      } else {
        cor = '#ff4d4f'; // Vermelho
      }
    }

    return {
      cor,
      texto: `${dias} dia${dias !== 1 ? 's' : ''}`,
      dias,
    };
  };

  return { getCorPorData };
};

export default useCoresPorTempo;
