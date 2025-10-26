// src/hooks/useCoresPorTempo.js
import moment from 'moment';

/**
 * Hook customizado para obter cores e textos baseados na idade de uma data.
 * Utilizado para indicar o tempo de espera de pagamento de um pedido.
 *
 * @returns {{getCorPorData: (function(Date): {cor: string, texto: string, dias: number})}}
 */
const useCoresPorTempo = () => {
  /**
   * Calcula a diferença de dias entre a data fornecida e hoje,
   * e retorna uma cor e um texto correspondente à faixa de dias.
   *
   * @param {Date | string} data - A data de referência (ex: dataPrecificacaoRealizada).
   * @returns {{cor: string, texto: string, dias: number | null}}
   */
  const getCorPorData = (data) => {
    if (!data) {
      return { cor: '#d9d9d9', texto: '-', dias: null };
    }

    const hoje = moment();
    const dataReferencia = moment(data);
    const dias = hoje.diff(dataReferencia, 'days');

    let cor;

    if (dias <= 7) {
      cor = '#52c41a'; // Verde
    } else if (dias <= 15) {
      cor = '#faad14'; // Amarelo
    } else if (dias <= 30) {
      cor = '#fa8c16'; // Laranja
    } else {
      cor = '#ff4d4f'; // Vermelho
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
