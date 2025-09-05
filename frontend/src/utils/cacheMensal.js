const CACHE_KEY_MENSAL = "sumarioMensalCache";

export const salvarCacheMensal = (dados) => {
  const cacheData = {
    dados,
    timestamp: new Date().toISOString(), // Salva a data/hora atual
  };
  localStorage.setItem(CACHE_KEY_MENSAL, JSON.stringify(cacheData));
};

export const obterCacheMensal = () => {
  const cache = localStorage.getItem(CACHE_KEY_MENSAL);
  if (!cache) return null;

  try {
    const { dados, timestamp } = JSON.parse(cache);
    const hoje = new Date().toISOString().split("T")[0];
    const dataCache = new Date(timestamp).toISOString().split("T")[0];

    // Valida o cache: retorna null se a data for diferente
    return hoje === dataCache ? dados : null;
  } catch (err) {
    console.error("Erro ao ler o cache mensal:", err);
    return null;
  }
};
