
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