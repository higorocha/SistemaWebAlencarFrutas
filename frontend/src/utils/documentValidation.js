// src/utils/documentValidation.js

/**
 * Valida se um CPF é válido seguindo o algoritmo oficial brasileiro
 * @param {string} cpf - CPF a ser validado (com ou sem máscara)
 * @returns {boolean} - true se válido, false se inválido
 */
export const validarCPF = (cpf) => {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  
  // Verifica se os dígitos verificadores estão corretos
  return (
    parseInt(cpfLimpo.charAt(9)) === digito1 &&
    parseInt(cpfLimpo.charAt(10)) === digito2
  );
};

/**
 * Valida se um CNPJ é válido seguindo o algoritmo oficial brasileiro
 * @param {string} cnpj - CNPJ a ser validado (com ou sem máscara)
 * @returns {boolean} - true se válido, false se inválido
 */
export const validarCNPJ = (cnpj) => {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 2;
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  
  // Validação do segundo dígito verificador
  soma = 0;
  peso = 2;
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  
  // Verifica se os dígitos verificadores estão corretos
  return (
    parseInt(cnpjLimpo.charAt(12)) === digito1 &&
    parseInt(cnpjLimpo.charAt(13)) === digito2
  );
};

/**
 * Valida um documento (CPF ou CNPJ) e retorna informações sobre a validação
 * @param {string} documento - Documento a ser validado
 * @returns {object} - Objeto com informações da validação
 */
export const validarDocumento = (documento) => {
  if (!documento || documento.trim() === '') {
    return {
      valido: true, // Campo opcional
      tipo: null,
      mensagem: null
    };
  }
  
  const documentoLimpo = documento.replace(/\D/g, '');
  
  if (documentoLimpo.length === 11) {
    // É um CPF
    const cpfValido = validarCPF(documento);
    return {
      valido: cpfValido,
      tipo: 'CPF',
      mensagem: cpfValido ? null : 'CPF inválido. Verifique os dígitos verificadores.'
    };
  } else if (documentoLimpo.length === 14) {
    // É um CNPJ
    const cnpjValido = validarCNPJ(documento);
    return {
      valido: cnpjValido,
      tipo: 'CNPJ',
      mensagem: cnpjValido ? null : 'CNPJ inválido. Verifique os dígitos verificadores.'
    };
  } else {
    return {
      valido: false,
      tipo: null,
      mensagem: 'Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)'
    };
  }
};
