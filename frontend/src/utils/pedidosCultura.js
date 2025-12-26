// frontend/src/utils/pedidosCultura.js
// Helpers para identificar agrupamento por cultura (fruta de primeira/segunda)

/**
 * Gera uma chave estável para identificar a fruta dentro do pedido.
 * - frutas existentes: usam `frutaPedidoId` ou `id`
 * - frutas novas (sem ids do backend): usam `new-${frutaId}`
 */
export function getFruitKey(frutaItem) {
  const key = frutaItem?.frutaPedidoId ?? frutaItem?.id ?? null;
  if (key !== null && key !== undefined) {
    return key;
  }

  const frutaId = frutaItem?.frutaId ?? null;
  if (frutaId !== null && frutaId !== undefined) {
    return `new-${frutaId}`;
  }

  return null;
}

function getCulturaIdFromFruta(fruta) {
  if (!fruta) return null;
  // Alguns pontos do frontend usam culturaId plano, outros usam fruta.cultura.id
  return fruta.culturaId ?? fruta?.cultura?.id ?? null;
}

function getCulturaDescricaoFromFruta(fruta) {
  if (!fruta) return "";
  return fruta?.cultura?.descricao ?? "";
}

function getDePrimeiraFromFruta(fruta) {
  if (!fruta) return false;
  return fruta?.dePrimeira ?? false;
}

function getNomeFromFruta(fruta) {
  if (!fruta) return "";
  return fruta?.nome ?? "";
}

/**
 * Constrói:
 * - metaByKey: dados mínimos por fruta (culturaId, dePrimeira, etc.)
 * - culturaInfoById: informa se existe fruta de primeira na cultura
 */
export function buildFrutasPedidoMeta(frutasDoPedido = [], frutasCatalogoById = {}) {
  const metaByKey = {};
  const culturaInfoById = {};

  (frutasDoPedido || []).forEach((frutaItem) => {
    const key = getFruitKey(frutaItem);
    if (!key) return;

    const frutaId = frutaItem?.frutaId ?? null;
    const frutaCatalogo = frutaId ? frutasCatalogoById?.[frutaId] : undefined;

    // Prioriza o objeto `fruta` já presente no item (quando veio do backend),
    // e faz fallback para catálogo (quando é fruta nova na edição).
    const frutaRef = frutaItem?.fruta || frutaCatalogo || null;

    const culturaId = getCulturaIdFromFruta(frutaRef);
    const culturaDescricao = getCulturaDescricaoFromFruta(frutaRef);
    const dePrimeira = getDePrimeiraFromFruta(frutaRef);
    const nome = getNomeFromFruta(frutaRef);

    metaByKey[key] = {
      culturaId,
      culturaDescricao,
      dePrimeira,
      nome,
    };

    if (culturaId !== null && culturaId !== undefined) {
      if (!culturaInfoById[culturaId]) {
        culturaInfoById[culturaId] = {
          hasPrimeira: false,
          frutaPrimeiraNome: "",
        };
      }

      if (dePrimeira) {
        culturaInfoById[culturaId].hasPrimeira = true;
        culturaInfoById[culturaId].frutaPrimeiraNome = nome || "";
      }
    }
  });

  return { metaByKey, culturaInfoById };
}

/**
 * Regra: se a cultura possui fruta de primeira e a fruta atual não é de primeira,
 * então ela herda vínculos da primeira (áreas/fitas).
 */
export function computeHerdaVinculosDaPrimeira(meta, culturaInfoById) {
  const culturaId = meta?.culturaId ?? null;
  if (culturaId === null || culturaId === undefined) return false;

  const culturaInfo = culturaInfoById?.[culturaId];
  return Boolean(culturaInfo?.hasPrimeira && meta?.dePrimeira !== true);
}


