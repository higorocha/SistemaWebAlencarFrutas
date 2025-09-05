/**
 * Utilitário para mapeamento e exibição de bancos brasileiros
 * Centraliza a informação de códigos e nomes dos bancos para uso em todo o sistema
 */

// Mapeamento dos principais bancos brasileiros
export const BANCOS = {
  '001': 'Banco do Brasil',
  '033': 'Banco Santander',
  '104': 'Caixa Econômica Federal', 
  '237': 'Bradesco',
  '341': 'Itaú Unibanco',
  '356': 'Banco Real',
  '399': 'HSBC Bank Brasil',
  '422': 'Banco Safra',
  '633': 'Banco Rendimento',
  '652': 'Itaú Unibanco Holding',
  '745': 'Banco Citibank',
  '748': 'Banco Cooperativo Sicredi',
  '756': 'Banco Cooperativo do Brasil',
};

/**
 * Retorna o nome do banco pelo código
 * @param {string} codigo - Código do banco (ex: "001")
 * @returns {string} Nome do banco ou "Banco não identificado"
 */
export const getBancoNome = (codigo) => {
  return BANCOS[codigo] || 'Banco não identificado';
};

/**
 * Retorna a exibição formatada do banco (código + nome)
 * @param {string} codigo - Código do banco (ex: "001")
 * @returns {string} Formato "001 - Banco do Brasil"
 */
export const getBancoDisplay = (codigo) => {
  const nome = getBancoNome(codigo);
  return `${codigo} - ${nome}`;
};

/**
 * Retorna lista de opções para Select do Ant Design
 * @returns {Array} Array de objetos {value, label} para usar no Select
 */
export const getBancosOptions = () => {
  // Criar array com todos os códigos
  const todosCodigos = Object.keys(BANCOS);
  
  // Separar Banco do Brasil dos demais
  const bancoDoBrasil = '001';
  const demaisBancos = todosCodigos.filter(codigo => codigo !== bancoDoBrasil);
  
  // Ordenar os demais bancos alfabeticamente pelo código
  demaisBancos.sort();
  
  // Criar lista final com Banco do Brasil primeiro
  const codigosOrdenados = [bancoDoBrasil, ...demaisBancos];
  
  return codigosOrdenados.map(codigo => ({
    value: codigo,
    label: getBancoDisplay(codigo)
  }));
};

/**
 * Verifica se um código de banco é válido
 * @param {string} codigo - Código do banco
 * @returns {boolean} True se o código existe no mapeamento
 */
export const isCodigoBancoValido = (codigo) => {
  return Object.prototype.hasOwnProperty.call(BANCOS, codigo);
}; 