/**
 * Utilitários de formatação para o backend
 * Equivalente ao formatters.js do frontend
 */

/**
 * Capitaliza a primeira letra de cada palavra em um nome
 * @param name Nome a ser capitalizado
 * @returns Nome capitalizado
 */
export const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formata um valor monetário para o padrão brasileiro
 * @param value Valor a ser formatado
 * @returns Valor formatado como string (ex: "1.234,56")
 */
export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return "0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata um valor monetário com símbolo R$
 * @param value Valor a ser formatado
 * @returns Valor formatado com R$ (ex: "R$ 1.234,56")
 */
export const formatCurrencyBR = (value: number): string => {
  return `R$ ${formatCurrency(value)}`;
};

/**
 * Formata um número inteiro com separador de milhar
 * @param value Valor a ser formatado
 * @returns Número formatado (ex: "1.234")
 */
export const formatNumber = (value: number): string => {
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
};

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY
 * @param date Data a ser formatada
 * @returns Data formatada
 */
export const formatDateBR = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    return 'Data inválida';
  }
};

/**
 * Formata um CPF para o padrão XXX.XXX.XXX-XX
 * @param cpf CPF com apenas números
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }
  
  return cpf;
};

/**
 * Formata um CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 * @param cnpj CNPJ com apenas números
 * @returns CNPJ formatado
 */
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  
  if (numeros.length === 14) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`;
  }
  
  return cnpj;
};

/**
 * Formata um telefone para o padrão brasileiro (XX) XXXXX-XXXX
 * @param telefone Telefone com apenas números
 * @returns Telefone formatado
 */
export const formatTelefone = (telefone: string): string => {
  if (!telefone) return '';
  const numeros = telefone.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  
  return telefone;
};
