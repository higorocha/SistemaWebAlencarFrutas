// src/utils/pedidoValidation.js

/**
 * Utilitário para validação de pedidos
 * Inclui validações de duplicatas e outras regras de negócio
 */

/**
 * Valida se há frutas duplicadas no pedido
 * @param {Array} frutas - Array de frutas do pedido
 * @param {Array} frutasDisponiveis - Array de frutas disponíveis para buscar nomes
 * @returns {Object} - { valido: boolean, frutasDuplicadas: [], mensagemErro: string }
 */
export const validarFrutasDuplicadas = (frutas, frutasDisponiveis = []) => {
  if (!frutas || !Array.isArray(frutas) || frutas.length === 0) {
    return { valido: true, frutasDuplicadas: [], mensagemErro: null };
  }

  // Contar occorrências de cada frutaId
  const contadorFrutas = {};
  const frutasDuplicadas = [];

  frutas.forEach((fruta, index) => {
    const frutaId = fruta.frutaId;
    
    if (!frutaId) return; // Ignorar frutas sem ID (ainda sendo selecionadas)

    if (!contadorFrutas[frutaId]) {
      contadorFrutas[frutaId] = {
        count: 0,
        indices: [],
        nome: frutasDisponiveis.find(f => f.id === frutaId)?.nome || `Fruta ID ${frutaId}`
      };
    }

    contadorFrutas[frutaId].count++;
    contadorFrutas[frutaId].indices.push(index + 1); // +1 para exibição (1-based)
  });

  // Identificar duplicatas
  Object.entries(contadorFrutas).forEach(([frutaId, dados]) => {
    if (dados.count > 1) {
      frutasDuplicadas.push({
        frutaId: parseInt(frutaId),
        nome: dados.nome,
        count: dados.count,
        indices: dados.indices
      });
    }
  });

  const temDuplicatas = frutasDuplicadas.length > 0;
  
  // Gerar mensagem de erro
  let mensagemErro = null;
  if (temDuplicatas) {
    if (frutasDuplicadas.length === 1) {
      const fruta = frutasDuplicadas[0];
      mensagemErro = `A fruta "${fruta.nome}" foi selecionada ${fruta.count} vezes (posições: ${fruta.indices.join(', ')}). Cada fruta pode ser adicionada apenas uma vez por pedido.`;
    } else {
      const nomesFrutas = frutasDuplicadas.map(f => `"${f.nome}"`).join(', ');
      mensagemErro = `As seguintes frutas foram selecionadas múltiplas vezes: ${nomesFrutas}. Cada fruta pode ser adicionada apenas uma vez por pedido.`;
    }
  }

  return {
    valido: !temDuplicatas,
    frutasDuplicadas,
    mensagemErro
  };
};

/**
 * Valida se há unidades de medida duplicadas para uma fruta
 * @param {string} unidadeMedida1 - Primeira unidade de medida
 * @param {string} unidadeMedida2 - Segunda unidade de medida
 * @param {string} nomeFruta - Nome da fruta para mensagem de erro
 * @returns {Object} - { valido: boolean, mensagemErro: string }
 */
export const validarUnidadesDuplicadas = (unidadeMedida1, unidadeMedida2, nomeFruta = 'Fruta') => {
  if (!unidadeMedida1 || !unidadeMedida2) {
    return { valido: true, mensagemErro: null };
  }

  const temDuplicata = unidadeMedida1 === unidadeMedida2;
  
  return {
    valido: !temDuplicata,
    mensagemErro: temDuplicata 
      ? `A ${nomeFruta} não pode ter a mesma unidade de medida (${unidadeMedida1}) para ambas as unidades. Por favor, selecione unidades diferentes ou remova a segunda unidade.`
      : null
  };
};

/**
 * Validação completa do pedido incluindo frutas duplicadas e outras regras
 * @param {Object} dadosPedido - Dados do pedido completo
 * @param {Array} frutasDisponiveis - Frutas disponíveis no sistema
 * @returns {Object} - { valido: boolean, erros: [], avisos: [] }
 */
export const validarPedidoCompleto = (dadosPedido, frutasDisponiveis = []) => {
  const erros = [];
  const avisos = [];

  // 1. Validar dados básicos obrigatórios
  if (!dadosPedido.clienteId) {
    erros.push("Cliente é obrigatório");
  }

  if (!dadosPedido.dataPrevistaColheita) {
    erros.push("Data prevista para colheita é obrigatória");
  }

  if (!dadosPedido.frutas || dadosPedido.frutas.length === 0) {
    erros.push("Adicione pelo menos uma fruta ao pedido");
  }

  // 2. Validar frutas duplicadas
  if (dadosPedido.frutas && dadosPedido.frutas.length > 0) {
    const validacaoFrutasDuplicadas = validarFrutasDuplicadas(dadosPedido.frutas, frutasDisponiveis);
    
    if (!validacaoFrutasDuplicadas.valido) {
      erros.push(validacaoFrutasDuplicadas.mensagemErro);
    }

    // 3. Validar cada fruta individualmente
    dadosPedido.frutas.forEach((fruta, index) => {
      const posicao = index + 1;
      const nomeFruta = frutasDisponiveis.find(f => f.id === fruta.frutaId)?.nome || `Fruta ${posicao}`;

      // Validar campos obrigatórios
      if (!fruta.frutaId) {
        erros.push(`Fruta ${posicao}: Selecione uma fruta`);
      }
      
      if (!fruta.quantidadePrevista || fruta.quantidadePrevista <= 0) {
        erros.push(`${nomeFruta}: Informe a quantidade prevista`);
      }
      
      if (!fruta.unidadeMedida1) {
        erros.push(`${nomeFruta}: Selecione a unidade de medida principal`);
      }

      // Validar unidades duplicadas
      if (fruta.unidadeMedida1 && fruta.unidadeMedida2) {
        const validacaoUnidades = validarUnidadesDuplicadas(
          fruta.unidadeMedida1, 
          fruta.unidadeMedida2, 
          nomeFruta
        );
        
        if (!validacaoUnidades.valido) {
          erros.push(validacaoUnidades.mensagemErro);
        }
      }

      // Avisos para quantidades muito baixas ou muito altas
      if (fruta.quantidadePrevista && fruta.quantidadePrevista < 1) {
        avisos.push(`${nomeFruta}: Quantidade prevista muito baixa (${fruta.quantidadePrevista})`);
      }
      
      if (fruta.quantidadePrevista && fruta.quantidadePrevista > 15000) {
        avisos.push(`${nomeFruta}: Quantidade prevista muito alta (${fruta.quantidadePrevista}). Verifique se está correta.`);
      }
    });
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
};