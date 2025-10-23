
// src/utils/formatters.js
import moment from "../config/momentConfig";

export const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (isNaN(numberValue)) return "0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

export const formatMesAno = (mesAno) => { // Ajustado para usar "=>" no formato arrow function
  const [mes, ano] = mesAno.split('/');
  const data = new Date(Number(ano), Number(mes) - 1);
  return data
    .toLocaleString('pt-BR', { month: 'short' })
    .replace('.', '')
    .replace(/^\w/, (c) => c.toUpperCase()) + `/${ano}`;
};

export const numberFormatter = (value) => {
  // Aceita 0, mas trata null ou undefined como valor ausente
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const numberParser = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  // Remove o prefixo "R$ " (com ou sem espaço) e depois os pontos de milhar,
  // substituindo a vírgula decimal por ponto.
  const cleaned = value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
};

export const formatarNumero = (numero) => {
  if (numero === null || numero === undefined || isNaN(numero)) return "-";
  return Number(numero).toFixed(2);
}

export const capitalizeName = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const capitalizeNameShort = (name) => {
  if (!name) return "";
  
  // Cortar no hífen e pegar apenas a primeira parte
  const shortName = name.split('-')[0].trim();
  
  // Aplicar capitalizeName na parte cortada
  return capitalizeName(shortName);
}

export const formataLeitura = (value) => {
  // Aceita 0, mas trata null ou undefined como valor ausente
  if (value === null || value === undefined) return "-";
  
  // Converter para número e arredondar para inteiro
  const numeroInteiro = Math.round(Number(value));
  
  // Verificar se é um número válido
  if (isNaN(numeroInteiro)) return "-";
  
  // Formatar com separador de milhar (ponto) e sem decimais
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numeroInteiro);
};

// Formatador para números inteiros com separador de milhar
export const intFormatter = (value) => {
  if (value === null || value === undefined || value === "") return "";
  // Converte para número, arredonda e então formata com separador de milhar
  const intValue = Math.round(Number(value));
  return isNaN(intValue) ? "" : intValue.toLocaleString('pt-BR');
};

// Parser para converter o valor formatado de volta para número
export const intParser = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  // Remove os pontos que são separadores de milhar
  const cleaned = value.replace(/\./g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? undefined : parsed;
};

export const formatarData = (notificacao) => {
    // Primeiro verificar se deve usar createdAt ou created_at
    const dataString = notificacao
    
    try {
      // Usar moment para formatação
      const data = moment(dataString);
      
      // Verificar se é válido
      if (!data.isValid()) {
        return 'Data não disponível';
      }
      
      // Formatar no padrão brasileiro
      return data.format('DD/MM/YYYY');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data não disponível';
    }
  };

  // Função genérica para formatar qualquer data no padrão brasileiro
export const formatarDataBR = (dataString) => {
  if (!dataString) return "N/A";
  
  try {
    // Usar moment para formatação com configuração de fuso horário correto
    const data = moment(dataString);
    
    if (!data.isValid()) {
      return 'Data não disponível';
    }
    
    // Formatar no padrão brasileiro
    return data.format('DD/MM/YYYY');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data não disponível';
  }
};

// Formatar um valor numérico para exibição monetária (R$)
export const formatarValorMonetario = (valor) => {
  if (valor === null || valor === undefined || valor === '') return 'R$ 0,00';
  
  // Para valores já formatados, apenas retornar
  if (typeof valor === 'string' && valor.startsWith('R$')) return valor;
  
  // Formatar usando o mesmo padrão do formatCurrency
  return `R$ ${formatCurrency(valor)}`;
};

// Converter um valor formatado em moeda para número
export const converterParaNumero = (valor) => {
  if (!valor) return 0;
  
  // Removendo símbolo monetário e espaços
  let valorProcessado = valor.replace('R$ ', '').trim();
  
  // Substituindo pontos (separadores de milhar) e convertendo vírgula decimal para ponto
  valorProcessado = valorProcessado.replace(/\./g, '').replace(',', '.');
  
  // Verificando se é um número válido
  const numero = parseFloat(valorProcessado);
  return isNaN(numero) ? 0 : numero;
};

// Converter valor em R$ para percentual com base no valor total
export const converterValorParaPercentual = (valor, valorTotal) => {
  if (valorTotal <= 0 || !valor || isNaN(valor)) return 10;
  const percentual = (valor / valorTotal) * 100;
  // Arredondamento para duas casas decimais
  const percentualFormatado = parseFloat(percentual.toFixed(2));
  return Math.min(Math.max(percentualFormatado, 10), 100);
};

// Converter percentual para valor monetário com base no valor total
export const converterPercentualParaValor = (percentual, valorTotal) => {
  if (!percentual || isNaN(percentual)) return 0;
  return (percentual / 100) * valorTotal;
};

// ===== FUNÇÕES DE FORMATAÇÃO PARA CHAVES PIX =====

/**
 * Formata um telefone para o padrão brasileiro (XX) XXXXX-XXXX
 * @param {string} telefone - Telefone com apenas números
 * @returns {string} - Telefone formatado
 */
export const formatarTelefone = (telefone) => {
  if (!telefone) return '';
  const numeros = telefone.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  
  return telefone; // Retorna original se não conseguir formatar
};

/**
 * Formata um CPF para o padrão XXX.XXX.XXX-XX
 * @param {string} cpf - CPF com apenas números
 * @returns {string} - CPF formatado
 */
export const formatarCPF = (cpf) => {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }
  
  return cpf; // Retorna original se não conseguir formatar
};

/**
 * Formata um CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 * @param {string} cnpj - CNPJ com apenas números
 * @returns {string} - CNPJ formatado
 */
export const formatarCNPJ = (cnpj) => {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  
  if (numeros.length === 14) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`;
  }
  
  return cnpj; // Retorna original se não conseguir formatar
};

/**
 * Detecta o tipo de chave PIX e aplica a formatação apropriada
 * @param {string} chavePix - Chave PIX a ser formatada
 * @returns {string} - Chave PIX formatada
 */
export const formatarChavePix = (chavePix) => {
  if (!chavePix) return 'Não informado';
  
  // Remove espaços e caracteres especiais para análise
  const chaveLimpa = chavePix.replace(/\s/g, '');
  
  // Verifica se é e-mail
  if (chaveLimpa.includes('@')) {
    return chaveLimpa; // E-mail não precisa de formatação especial
  }
  
  // Remove todos os caracteres não numéricos para verificar tamanho
  const numeros = chaveLimpa.replace(/\D/g, '');
  
  // Verifica se é telefone (10 ou 11 dígitos)
  if (numeros.length === 10 || numeros.length === 11) {
    return formatarTelefone(numeros);
  }
  
  // Verifica se é CPF (11 dígitos)
  if (numeros.length === 11) {
    return formatarCPF(numeros);
  }
  
  // Verifica se é CNPJ (14 dígitos)
  if (numeros.length === 14) {
    return formatarCNPJ(numeros);
  }
  
  // Se não conseguir identificar, retorna a chave original
  return chavePix;
};

/**
 * ⚠️ FUNÇÃO LEGADA - NÃO MAIS NECESSÁRIA (mantida apenas para referência histórica)
 *
 * Esta função era utilizada para converter valores Decimal do Prisma para número JavaScript.
 *
 * CONTEXTO HISTÓRICO:
 * - Antes de 2025-10-23: Campos como quantidadeColhidaUnidade1 e quantidadeColhidaUnidade2
 *   eram do tipo Decimal no schema Prisma (@db.Decimal(10, 2))
 * - O Prisma retornava esses valores como objetos complexos: { s: 1, e: 4, d: [13333] }
 *   onde 's' é o sinal, 'e' é o expoente, 'd' são os dígitos
 * - Esta função era necessária para extrair o valor numérico desses objetos
 *
 * MUDANÇA:
 * - Em 2025-10-23: Campos de quantidade foram alterados de Decimal para Int
 * - Migration: 20251023160633_change_quantidade_colhida_to_int
 * - Agora o banco retorna valores inteiros diretos (ex: 500, 1000)
 * - Esta função não é mais necessária - use o valor diretamente
 *
 * USO ATUAL:
 * - ANTES: const qtd = converterDecimalPrisma(area.quantidadeColhidaUnidade1);
 * - AGORA:  const qtd = area.quantidadeColhidaUnidade1 || 0;
 *
 * @deprecated Não use esta função em código novo. Use os valores inteiros diretamente.
 * @param {any} valor - Valor que pode ser um objeto Decimal do Prisma ou número
 * @returns {number} - Número convertido
 */
export const converterDecimalPrisma = (valor) => {
  if (typeof valor === 'object' && valor?.d && Array.isArray(valor.d)) {
    // É um objeto Decimal do Prisma
    // A estrutura é: { s: 1, e: 4, d: [13333] }
    // Onde 's' é o sinal, 'e' é o expoente, 'd' são os dígitos
    const numero = parseFloat(valor.d.join(''));
    const expoente = valor.e || 0;

    // Se o expoente for menor que o número de dígitos, é um número inteiro
    const numeroDigitos = valor.d.join('').length;

    if (expoente < numeroDigitos) {
      // É um número inteiro, retorna sem divisão
      return numero;
    } else if (expoente >= 0) {
      // Aplica a divisão para decimais
      return numero / Math.pow(10, expoente);
    } else {
      // Multiplica para valores muito pequenos
      return numero * Math.pow(10, Math.abs(expoente));
    }
  }
  return valor;
};