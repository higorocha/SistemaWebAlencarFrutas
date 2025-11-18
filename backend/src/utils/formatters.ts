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

/**
 * Formata data para o formato ddmmaaaa usado pela API do Banco do Brasil
 * 
 * Conforme documentação da API de Pagamentos:
 * - Formato: ddmmaaaa (omitir zeros à esquerda APENAS no DIA)
 * - Exemplo: 9012022 (9 de janeiro de 2022) - dia sem zero à esquerda
 * - Exemplo: 19042023 (19 de abril de 2023) - dia com 2 dígitos
 * 
 * Regras:
 * - DIA: 1 ou 2 dígitos (sem zero à esquerda se dia < 10)
 * - MÊS: SEMPRE 2 dígitos (com zero à esquerda se mês < 10)
 * - ANO: SEMPRE 4 dígitos
 * 
 * @param data Data a ser formatada (aceita string no formato ddmmaaaa, Date, ou string ISO)
 * @returns Data formatada: D ou DD + MM + YYYY (mês sempre 2 dígitos)
 */
export const formatarDataParaAPIBB = (data: string | Date): string => {
  if (!data) {
    throw new Error('Data não fornecida');
  }

  let dia: number;
  let mes: number;
  let ano: number;

  // Se já está no formato ddmmaaaa (string de 7-8 dígitos), validar e reformatar
  if (typeof data === 'string' && /^\d{7,8}$/.test(data)) {
    // Pode ter 7 ou 8 dígitos (dia com ou sem zero à esquerda)
    const dataStr = data;
    
    // Se tem 8 dígitos, assumir formato DDMMYYYY
    if (dataStr.length === 8) {
      dia = parseInt(dataStr.slice(0, 2), 10);
      mes = parseInt(dataStr.slice(2, 4), 10);
      ano = parseInt(dataStr.slice(4), 10);
    } else if (dataStr.length === 7) {
      // Se tem 7 dígitos, assumir formato DMMYYYY (dia sem zero à esquerda)
      dia = parseInt(dataStr.slice(0, 1), 10);
      mes = parseInt(dataStr.slice(1, 3), 10);
      ano = parseInt(dataStr.slice(3), 10);
    } else {
      throw new Error(`Data inválida: ${data}. Formato esperado: ddmmaaaa (7 ou 8 dígitos)`);
    }
  } else {
    // Tentar parsear como Date ou string ISO
    const dateObj = typeof data === 'string' ? new Date(data) : data;
    
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Data inválida: ${data}`);
    }
    
    dia = dateObj.getDate();
    mes = dateObj.getMonth() + 1; // getMonth() retorna 0-11
    ano = dateObj.getFullYear();
  }

  // Validar valores
  if (isNaN(dia) || isNaN(mes) || isNaN(ano) || dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    throw new Error(`Data inválida: dia=${dia}, mês=${mes}, ano=${ano}`);
  }

  // Dia: sem zero à esquerda (conforme documentação)
  const diaFormatado = dia.toString();
  
  // Mês: sempre 2 dígitos (com zero à esquerda se < 10)
  const mesFormatado = mes.toString().padStart(2, '0');
  
  // Ano: sempre 4 dígitos
  const anoFormatado = ano.toString();

  return `${diaFormatado}${mesFormatado}${anoFormatado}`;
};