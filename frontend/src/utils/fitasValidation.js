// src/utils/fitasValidation.js

/**
 * Utilitário para validação global de fitas de banana
 * Garante que o estoque não seja extrapolado quando múltiplas frutas usam o mesmo lote
 */

/**
 * Consolida o uso de fitas por controleBananaId considerando todas as frutas do pedido
 * @param {Array} todasFrutas - Array com todas as frutas do pedido
 * @returns {Object} - Objeto com consolidação do uso: { controleBananaId: { quantidade, frutas: [...] } }
 */
export const consolidarUsoFitas = (todasFrutas) => {
  const usoConsolidado = {};
  
  if (!todasFrutas || !Array.isArray(todasFrutas)) {
    return usoConsolidado;
  }

  todasFrutas.forEach((fruta, frutaIndex) => {
    if (!fruta.fitas || !Array.isArray(fruta.fitas)) return;
    
    fruta.fitas.forEach(fita => {
      if (!fita.detalhesAreas || !Array.isArray(fita.detalhesAreas)) return;
      
      fita.detalhesAreas.forEach(detalhe => {
        const controleBananaId = detalhe.controleBananaId;
        if (!controleBananaId) return;
        
        if (!usoConsolidado[controleBananaId]) {
          usoConsolidado[controleBananaId] = {
            quantidade: 0,
            frutas: []
          };
        }
        
        usoConsolidado[controleBananaId].quantidade += detalhe.quantidade || 0;
        usoConsolidado[controleBananaId].frutas.push({
          frutaIndex,
          frutaNome: fruta.frutaNome || `Fruta ${frutaIndex + 1}`,
          fitaBananaId: fita.fitaBananaId,
          fitaNome: fita._fitaNome || 'Fita',
          areaId: detalhe.areaId,
          quantidade: detalhe.quantidade || 0
        });
      });
    });
  });

  return usoConsolidado;
};

/**
 * Valida se há conflitos de estoque entre o uso consolidado e o estoque disponível
 * @param {Object} usoConsolidado - Resultado da função consolidarUsoFitas
 * @param {Object} estoqueDisponivel - Objeto com estoque por controleBananaId { id: quantidade }
 * @returns {Object} - { valido: boolean, conflitos: {} }
 */
export const validarEstoqueGlobal = (usoConsolidado, estoqueDisponivel) => {
  const conflitos = {};
  let valido = true;

  Object.entries(usoConsolidado).forEach(([controleBananaId, dadosUso]) => {
    const quantidadeUsada = dadosUso.quantidade;
    const estoqueDisp = estoqueDisponivel[controleBananaId] || 0;
    
    if (quantidadeUsada > estoqueDisp) {
      valido = false;
      conflitos[controleBananaId] = {
        quantidadeUsada,
        estoqueDisponivel: estoqueDisp,
        excesso: quantidadeUsada - estoqueDisp,
        frutasEnvolvidas: dadosUso.frutas
      };
    }
  });

  return { valido, conflitos };
};

/**
 * Calcula o estoque real disponível para um lote específico considerando uso já vinculado ao pedido
 * @param {string} controleBananaId - ID do lote (controle de banana)
 * @param {number} estoqueOriginal - Estoque original do lote
 * @param {Object} usoAtualPedido - Uso atual no pedido (da função consolidarUsoFitas)
 * @param {Array} fitasOriginaisBanco - Fitas originais salvas no banco (para modo edição)
 * @param {boolean} isModoEdicao - Se está em modo edição
 * @returns {number} - Estoque real disponível para seleção
 */
export const calcularEstoqueRealDisponivel = (
  controleBananaId, 
  estoqueOriginal, 
  usoAtualPedido, 
  fitasOriginaisBanco = [], 
  isModoEdicao = false
) => {
  // Uso atual no formulário
  const usoAtual = usoAtualPedido[controleBananaId]?.quantidade || 0;
  
  // Se estamos em modo edição, considerar quantidade já salva no banco
  let quantidadeJaSalvaNoBanco = 0;
  if (isModoEdicao && Array.isArray(fitasOriginaisBanco)) {
    fitasOriginaisBanco.forEach(fita => {
      if (fita.detalhesAreas && Array.isArray(fita.detalhesAreas)) {
        fita.detalhesAreas.forEach(detalhe => {
          if (detalhe.controleBananaId === controleBananaId) {
            quantidadeJaSalvaNoBanco += detalhe.quantidade || 0;
          }
        });
      }
    });
  }
  
  // Estoque real disponível = estoque original + quantidade já salva no banco - uso atual no formulário
  return estoqueOriginal + quantidadeJaSalvaNoBanco - usoAtual;
};

/**
 * Gera mensagens de erro amigáveis para conflitos de estoque
 * @param {Object} conflitos - Objeto de conflitos retornado por validarEstoqueGlobal
 * @returns {Array} - Array de mensagens de erro
 */
export const gerarMensagensErro = (conflitos) => {
  const mensagens = [];

  Object.entries(conflitos).forEach(([controleBananaId, dadosConflito]) => {
    const { quantidadeUsada, estoqueDisponivel, excesso, frutasEnvolvidas } = dadosConflito;
    
    // Agrupar por nome de fita para mensagem mais clara
    const frutasPorFita = frutasEnvolvidas.reduce((acc, fruta) => {
      const chave = `${fruta.fitaNome}_${controleBananaId}`;
      if (!acc[chave]) {
        acc[chave] = {
          fitaNome: fruta.fitaNome,
          frutas: [],
          quantidadeTotal: 0
        };
      }
      acc[chave].frutas.push(`${fruta.frutaNome} (${fruta.quantidade} fitas)`);
      acc[chave].quantidadeTotal += fruta.quantidade;
      return acc;
    }, {});

    Object.values(frutasPorFita).forEach(grupo => {
      mensagens.push(
        `Lote da ${grupo.fitaNome}: ${quantidadeUsada} fitas solicitadas > ${estoqueDisponivel} disponíveis. ` +
        `Excesso de ${excesso} fitas. Frutas envolvidas: ${grupo.frutas.join(', ')}`
      );
    });
  });

  return mensagens;
};

/**
 * Cria um mapa de estoque disponível a partir dos dados de fitas com áreas
 * @param {Array} fitasComAreas - Dados retornados do endpoint /controle-banana/fitas-com-areas
 * @returns {Object} - { controleBananaId: quantidade }
 */
export const criarMapaEstoqueDisponivel = (fitasComAreas) => {
  const mapa = {};
  
  if (!fitasComAreas || !Array.isArray(fitasComAreas)) {
    return mapa;
  }

  fitasComAreas.forEach(fita => {
    if (fita.areas && Array.isArray(fita.areas)) {
      fita.areas.forEach(area => {
        if (area.controles && Array.isArray(area.controles)) {
          area.controles.forEach(controle => {
            mapa[controle.id] = controle.quantidadeFitas || 0;
          });
        }
      });
    }
  });

  return mapa;
};

/**
 * Função principal de validação que pode ser usada nos componentes
 * @param {Array} todasFrutas - Todas as frutas do pedido com suas fitas
 * @param {Array} fitasComAreas - Dados do estoque disponível
 * @param {Array} fitasOriginaisBanco - Dados originais do banco (para modo edição)
 * @param {boolean} isModoEdicao - Se está em modo edição
 * @returns {Object} - { valido: boolean, conflitos: {}, mensagensErro: [] }
 */
export const validarFitasCompleto = (
  todasFrutas, 
  fitasComAreas, 
  fitasOriginaisBanco = [], 
  isModoEdicao = false
) => {
  // 1. Consolidar uso atual
  const usoConsolidado = consolidarUsoFitas(todasFrutas);
  
  // 2. Criar mapa de estoque disponível
  const estoqueDisponivel = criarMapaEstoqueDisponivel(fitasComAreas);
  
  // 3. Se estamos em modo edição, ajustar estoque considerando quantidades já salvas
  if (isModoEdicao && Array.isArray(fitasOriginaisBanco)) {
    const usoOriginalBanco = consolidarUsoFitas(fitasOriginaisBanco);
    
    // Adicionar de volta ao estoque as quantidades que já estavam salvas
    Object.entries(usoOriginalBanco).forEach(([controleBananaId, dadosUso]) => {
      if (estoqueDisponivel[controleBananaId] !== undefined) {
        estoqueDisponivel[controleBananaId] += dadosUso.quantidade;
      }
    });
  }
  
  // 4. Validar contra estoque
  const resultadoValidacao = validarEstoqueGlobal(usoConsolidado, estoqueDisponivel);
  
  // 5. Gerar mensagens de erro se houver conflitos
  const mensagensErro = resultadoValidacao.valido 
    ? [] 
    : gerarMensagensErro(resultadoValidacao.conflitos);
  
  return {
    valido: resultadoValidacao.valido,
    conflitos: resultadoValidacao.conflitos,
    mensagensErro,
    usoConsolidado,
    estoqueDisponivel
  };
};