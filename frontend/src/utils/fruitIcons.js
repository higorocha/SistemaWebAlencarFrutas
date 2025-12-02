// utils/fruitIcons.js
import React from 'react';

// Importar ícones como módulos (PNG)
import melanciaIcon from '../assets/icons/melancia.png';
import bananaIcon from '../assets/icons/banana.png';
import mamaoIcon from '../assets/icons/mamao.png';
import cocoVerdeIcon from '../assets/icons/coco-verde.png';
import cocoSecoIcon from '../assets/icons/coco-seco.png';
import limaoIcon from '../assets/icons/limao.png';
import melaoIcon from '../assets/icons/melao.png';

// Ícone da Melancia
const MelanciaIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={melanciaIcon}
    alt="Melancia"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone da Banana
const BananaIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={bananaIcon}
    alt="Banana"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone do Mamão
const MamaoIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={mamaoIcon}
    alt="Mamão"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone do Coco Verde
const CocoVerdeIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={cocoVerdeIcon}
    alt="Coco Verde"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone do Coco Seco
const CocoSecoIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={cocoSecoIcon}
    alt="Coco Seco"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone do Limão
const LimaoIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={limaoIcon}
    alt="Limão"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone do Melão
const MelaoIcon = ({ width = 20, height = 20, style = {} }) => (
  <img
    src={melaoIcon}
    alt="Melão"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Mapeamento de frutas para ícones SVG
export const fruitIconMap = {
  // Melancia
  'melancia': MelanciaIcon,
  'melancias': MelanciaIcon,
  'watermelon': MelanciaIcon,
  
  // Banana
  'banana': BananaIcon,
  'bananas': BananaIcon,
  'banana-da-terra': BananaIcon,
  'banana-prata': BananaIcon,
  'banana-nanica': BananaIcon,
  
  // Mamão
  'mamao': MamaoIcon,
  'mamão': MamaoIcon,
  'mamaos': MamaoIcon,
  'mamões': MamaoIcon,
  'papaya': MamaoIcon,
  'papayas': MamaoIcon,
  
  // Coco Verde
  'coco-verde': CocoVerdeIcon,
  'coco verde': CocoVerdeIcon,
  'coco_verde': CocoVerdeIcon,
  'cocoverde': CocoVerdeIcon,
  'green-coconut': CocoVerdeIcon,
  
  // Coco Seco
  'coco-seco': CocoSecoIcon,
  'coco seco': CocoSecoIcon,
  'coco_seco': CocoSecoIcon,
  'cocoseco': CocoSecoIcon,
  'dry-coconut': CocoSecoIcon,
  'coco': CocoSecoIcon, // Fallback para coco se não especificado
  
  // Limão
  'limao': LimaoIcon,
  'limão': LimaoIcon,
  'limoes': LimaoIcon,
  'limões': LimaoIcon,
  'lemon': LimaoIcon,
  'lemons': LimaoIcon,
  'limao-tahiti': LimaoIcon,
  'limão-tahiti': LimaoIcon,
  
  // Melão
  'melao': MelaoIcon,
  'melão': MelaoIcon,
  'meloes': MelaoIcon,
  'melões': MelaoIcon,
  'melon': MelaoIcon,
  'melons': MelaoIcon,
  'melao-cantaloupe': MelaoIcon,
  'melão-cantaloupe': MelaoIcon,
};

// Função para obter o ícone SVG de uma fruta ou cultura
// Para culturas, usa o mesmo mapeamento das frutas (ex: "Banana" cultura -> ícone de banana)
export const getFruitIcon = (frutaOuCulturaNome, props = {}) => {
  if (!frutaOuCulturaNome) return null;
  
  const nome = frutaOuCulturaNome.toLowerCase().trim();
  
  // Busca por correspondência exata primeiro
  if (fruitIconMap[nome]) {
    const IconComponent = fruitIconMap[nome];
    return <IconComponent {...props} />;
  }

  // Busca por palavras-chave dentro do nome
  for (const [key, IconComponent] of Object.entries(fruitIconMap)) {
    if (nome.includes(key)) {
      return <IconComponent {...props} />;
    }
  }

  // Fallback: retorna ícone padrão (banana)
  return <BananaIcon {...props} />;
};

// Função para obter o caminho do ícone (para uso em src de img tags)
export const getFruitIconPath = (frutaOuCulturaNome) => {
  if (!frutaOuCulturaNome) return "/icons/frutas_64x64.png";
  
  const nome = frutaOuCulturaNome.toLowerCase().trim();
  
  // Mapeamento direto baseado nos arquivos da pasta public/icons ou assets/icons
  const fruitMap = {
    'banana': '/assets/icons/banana.png',
    'bananas': '/assets/icons/banana.png',
    'maçã': '/icons/apple.svg',
    'maca': '/icons/apple.svg',
    'melancia': '/assets/icons/melancia.png',
    'melancias': '/assets/icons/melancia.png',
    'uva': '/icons/uvas.svg',
    'uvas': '/icons/uvas.svg',
    'coco': '/assets/icons/coco-seco.png',
    'coco-verde': '/assets/icons/coco-verde.png',
    'coco verde': '/assets/icons/coco-verde.png',
    'coco-seco': '/assets/icons/coco-seco.png',
    'coco seco': '/assets/icons/coco-seco.png',
    'cacau': '/icons/cacao.svg',
    'tomate': '/icons/tomate.svg',
    'milho': '/icons/milho.svg',
    'cenoura': '/icons/cenoura.svg',
    'limao': '/assets/icons/limao.png',
    'limão': '/assets/icons/limao.png',
    'mamao': '/assets/icons/mamao.png',
    'mamão': '/assets/icons/mamao.png',
    'melao': '/assets/icons/melao.png',
    'melão': '/assets/icons/melao.png',
  };

  // 1. Tenta match exato
  if (fruitMap[nome]) return fruitMap[nome];

  // 2. Tenta match parcial (ex: "Banana Prata" -> banana)
  for (const [key, icon] of Object.entries(fruitMap)) {
    if (nome.includes(key)) return icon;
  }

  // 3. Fallback genérico
  return "/icons/frutas_64x64.png";
};

// Mapeamento de culturas para imports processados pelo webpack
// Usa os imports já existentes para garantir que os caminhos sejam processados corretamente
const culturaIconImports = {
  // Match exato com nomes completos (prioridade)
  'banana prata': bananaIcon,
  'coco seco': cocoSecoIcon,
  'coco verde': cocoVerdeIcon,
  'limao taiti': limaoIcon,
  'mamao formosa': mamaoIcon,
  'mamao havai': mamaoIcon,
  'mamao sanrais': mamaoIcon,
  'melancia': melanciaIcon,
  'melo': melaoIcon,
  'melao': melaoIcon,
  
  // Match por primeira palavra (fallback)
  'banana': bananaIcon,
  'coco': cocoSecoIcon, // Default para coco (sem especificação)
  'limao': limaoIcon,
  'mamao': mamaoIcon,
};

// Função específica para obter ícone de CULTURA (mapeia pelo nome da cultura)
// Culturas do sistema: "Banana Prata", "Coco Seco", "Coco Verde", "Limão Taiti", 
// "Mamão Formosa", "Mamão Havaí", "Mamão Sanrais", "Melancia", "Melão"
// Extrai a palavra principal do nome (ex: "Banana Prata" -> "Banana")
export const getCulturaIconPath = (culturaNome) => {
  if (!culturaNome) {
    console.log('[getCulturaIconPath] Nome vazio, retornando fallback');
    return "/icons/frutas_64x64.png";
  }
  
  console.log('[getCulturaIconPath] Nome original:', culturaNome);
  
  // Normaliza o nome: lowercase, remove acentos e espaços extras
  const nome = culturaNome.toLowerCase().trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Normaliza espaços
  
  console.log('[getCulturaIconPath] Nome normalizado:', nome);
  
  // Extrai a primeira palavra (cultura principal)
  // Ex: "banana prata" -> "banana", "coco verde" -> "coco", "limao taiti" -> "limao"
  const primeiraPalavra = nome.split(' ')[0];
  
  console.log('[getCulturaIconPath] Primeira palavra:', primeiraPalavra);
  
  // 1. Tenta match exato com o nome completo normalizado (ex: "coco verde")
  if (culturaIconImports[nome]) {
    console.log('[getCulturaIconPath] Match exato encontrado:', nome, '->', culturaIconImports[nome]);
    return culturaIconImports[nome];
  }
  
  // 2. Tenta match com a primeira palavra (ex: "banana prata" -> "banana")
  if (culturaIconImports[primeiraPalavra]) {
    console.log('[getCulturaIconPath] Match por primeira palavra:', primeiraPalavra, '->', culturaIconImports[primeiraPalavra]);
    return culturaIconImports[primeiraPalavra];
  }

  // 3. Tenta match parcial - verifica se o nome contém alguma chave do mapa
  // Ex: "coco verde" contém "coco", "mamão formosa" contém "mamão"
  for (const [key, icon] of Object.entries(culturaIconImports)) {
    // Evita matches muito genéricos (chave deve ter pelo menos 3 caracteres)
    if (key.length >= 3 && nome.includes(key)) {
      console.log('[getCulturaIconPath] Match parcial encontrado:', key, 'em', nome, '->', icon);
      return icon;
    }
  }

  // 4. Fallback genérico (usa ícone de /public/icons/ que é servido estaticamente)
  console.log('[getCulturaIconPath] Nenhum match encontrado, usando fallback');
  return "/icons/frutas_64x64.png";
};

// Função para obter apenas o componente (sem renderizar)
export const getFruitIconComponent = (frutaNome) => {
  if (!frutaNome) return BananaIcon;
  
  const nome = frutaNome.toLowerCase().trim();
  
  // Busca por correspondência exata primeiro
  if (fruitIconMap[nome]) {
    return fruitIconMap[nome];
  }

  // Busca por palavras-chave dentro do nome
  for (const [key, IconComponent] of Object.entries(fruitIconMap)) {
    if (nome.includes(key)) {
      return IconComponent;
    }
  }

  // Fallback: retorna banana
  return BananaIcon;
};

// Lista de todas as frutas suportadas
export const supportedFruits = Object.keys(fruitIconMap);

// Função para verificar se uma fruta é suportada
export const isFruitSupported = (frutaNome) => {
  if (!frutaNome) return false;
  
  const nome = frutaNome.toLowerCase().trim();
  
  // Busca por correspondência exata primeiro
  if (fruitIconMap[nome]) {
    return true;
  }

  // Busca por palavras-chave dentro do nome
  for (const key of Object.keys(fruitIconMap)) {
    if (nome.includes(key)) {
      return true;
    }
  }

  return false;
};

export default {
  fruitIconMap,
  getFruitIcon,
  getFruitIconPath,
  getCulturaIconPath,
  getFruitIconComponent,
  supportedFruits,
  isFruitSupported
};