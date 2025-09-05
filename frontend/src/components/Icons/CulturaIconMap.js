// src/components/CulturaIconMap.js

export const culturaIconMap = {
    Milho: "🌽",
    Soja: "🌱",
    Trigo: "🌾",
    Algodão: "🌿",
    Melancia: "🍉",
    Mamão: "🍈",
    Côco: "🥥",
    Banana: "🍌",
    Laranja: "🍊",
    Acerola: "🍒",
    Melão: "🍈",
    Cacau: "🍫",
    Goiaba: "🫒",
    Abacaxi: "🍍",
    Uva: "🍇",
    Morango: "🍓",
    Abacate: "🥑",
    Pêra: "🍐",
    Pêssego: "🍑",
    Manga: "🥭",
    "Cana-de-Açúcar": "🎋",
    Café: "☕",
    Tomate: "🍅",
    Batata: "🥔",
    Cenoura: "🥕",
    Alface: "🥬",
    Pepino: "🥒",
    Berinjela: "🍆",
    Amendoim: "🥜",
    Castanha: "🌰",
  };
  
  export const getIconForCultura = (cultura) => {
    return culturaIconMap[cultura] || "🌱"; // Retorna um ícone padrão se a cultura não for encontrada
  };
  