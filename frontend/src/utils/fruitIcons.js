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

// Função para obter o ícone SVG de uma fruta
export const getFruitIcon = (frutaNome, props = {}) => {
  if (!frutaNome) return null;
  
  const nome = frutaNome.toLowerCase().trim();
  
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
  getFruitIconComponent,
  supportedFruits,
  isFruitSupported
};