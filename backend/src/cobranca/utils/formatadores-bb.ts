/**
 * Formatadores de dados para API de Cobrança do Banco do Brasil
 * 
 * Converte dados do formato interno para o formato esperado pela API BB
 */

/**
 * Formata data para o formato esperado pelo BB: dd.mm.aaaa
 * @param data Data no formato Date ou string (YYYY-MM-DD)
 * @returns Data formatada como dd.mm.aaaa
 */
export function formatarDataBB(data: Date | string): string {
  let dateObj: Date;
  
  if (typeof data === 'string') {
    // Se for string no formato YYYY-MM-DD, converter para Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      dateObj = new Date(data + 'T00:00:00');
    } else {
      dateObj = new Date(data);
    }
  } else {
    dateObj = data;
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida: ${data}`);
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Formata valor monetário para o formato esperado pelo BB: 123.45
 * @param valor Valor numérico
 * @returns Valor formatado como string com 2 casas decimais
 */
export function formatarValorBB(valor: number): string {
  if (valor < 0) {
    throw new Error('Valor não pode ser negativo');
  }

  return valor.toFixed(2);
}

/**
 * Formata CPF/CNPJ removendo caracteres não numéricos
 * IMPORTANTE: Mantém zeros à esquerda (regra específica para numeroInscricao)
 * @param cpfCnpj CPF ou CNPJ com ou sem formatação
 * @returns CPF/CNPJ apenas com números
 */
export function formatarCPFCNPJ(cpfCnpj: string): string {
  if (!cpfCnpj) {
    throw new Error('CPF/CNPJ não pode ser vazio');
  }

  // Remove apenas caracteres não numéricos, mantendo zeros à esquerda
  return cpfCnpj.replace(/[^\d]/g, '');
}

/**
 * Formata CEP removendo caracteres não numéricos
 * @param cep CEP com ou sem formatação
 * @returns CEP apenas com números
 */
export function formatarCEP(cep: string): string {
  if (!cep) {
    return '';
  }

  return cep.replace(/[^\d]/g, '');
}

/**
 * Formata telefone removendo caracteres não numéricos
 * @param telefone Telefone com ou sem formatação
 * @returns Telefone apenas com números
 */
export function formatarTelefone(telefone: string): string {
  if (!telefone) {
    return '';
  }

  return telefone.replace(/[^\d]/g, '').slice(0, 30); // Limite de 30 caracteres
}

/**
 * Formata string para maiúsculas e limita tamanho
 * @param texto Texto a ser formatado
 * @param maxLength Tamanho máximo (padrão: sem limite)
 * @returns Texto em maiúsculas e limitado
 */
export function formatarTextoBB(texto: string, maxLength?: number): string {
  if (!texto) {
    return '';
  }

  let resultado = texto.toUpperCase().trim();
  
  if (maxLength && resultado.length > maxLength) {
    resultado = resultado.slice(0, maxLength);
  }

  return resultado;
}
