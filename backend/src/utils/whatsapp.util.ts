/**
 * Formatar número de telefone para o WhatsApp
 * Converte formatos brasileiros para padrão internacional
 */
export function formatarNumeroTelefone(numero: string): string {
  if (!numero) return '';
  
  // Remove todos os caracteres não numéricos
  let numeroLimpo = numero.replace(/\D/g, '');
  
  // Se o número começar com +55, remove
  if (numeroLimpo.startsWith('55')) {
    numeroLimpo = numeroLimpo.substring(2);
  }
  
  // Se o número não tem 11 dígitos (DDD + 9 dígitos), tenta corrigir
  if (numeroLimpo.length === 10) {
    // Adiciona 9 na frente para celulares antigos (ex: 85 8888-8888 -> 85 9 8888-8888)
    numeroLimpo = numeroLimpo.substring(0, 2) + '9' + numeroLimpo.substring(2);
  }
  
  // Valida se tem 11 dígitos
  if (numeroLimpo.length !== 11) {
    throw new Error(`Número de telefone inválido: ${numero}. Deve ter 11 dígitos (DDD + 9 dígitos)`);
  }
  
  // Retorna no formato internacional brasileiro
  return `55${numeroLimpo}`;
}

/**
 * Valida se um número de telefone está no formato correto
 */
export function validarNumeroWhatsApp(numero: string): boolean {
  try {
    const numeroFormatado = formatarNumeroTelefone(numero);
    return numeroFormatado.length === 13 && numeroFormatado.startsWith('55');
  } catch {
    return false;
  }
}

/**
 * Exibe número no formato legível brasileiro
 */
export function exibirNumeroFormatado(numero: string): string {
  try {
    const numeroLimpo = numero.replace(/\D/g, '');
    
    if (numeroLimpo.length === 13 && numeroLimpo.startsWith('55')) {
      // Remove o código do país (55)
      const numeroSem55 = numeroLimpo.substring(2);
      const ddd = numeroSem55.substring(0, 2);
      const primeiraParte = numeroSem55.substring(2, 7);
      const segundaParte = numeroSem55.substring(7);
      
      return `+55 (${ddd}) ${primeiraParte}-${segundaParte}`;
    }
    
    return numero; // Retorna original se não conseguir formatar
  } catch {
    return numero;
  }
} 