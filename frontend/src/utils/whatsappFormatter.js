import React from 'react';

/**
 * Processa formatação de texto do WhatsApp
 * *texto* → negrito
 * _texto_ → itálico  
 * ~texto~ → taxado
 * `texto` → código inline
 * ```texto``` → bloco de código
 */
export const formatWhatsAppText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Dividir o texto em partes, preservando quebras de linha
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Processar cada linha individualmente
    const processedLine = processLine(line);
    
    // Se é a última linha, não adicionar quebra
    if (lineIndex === lines.length - 1) {
      return processedLine;
    }
    
    // Adicionar quebra de linha entre as linhas
    return (
      <React.Fragment key={lineIndex}>
        {processedLine}
        <br />
      </React.Fragment>
    );
  });
};

const processLine = (line) => {
  const parts = [];
  let currentIndex = 0;
  
  // Regex para encontrar padrões de formatação
  // Ordem importa: código primeiro (para evitar conflitos), depois outros
  const patterns = [
    // Bloco de código (```texto```)
    {
      regex: /```([^`]+)```/g,
      component: (text, key) => (
        <code 
          key={key}
          style={{
            backgroundColor: '#f5f5f5',
            padding: '2px 4px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            border: '1px solid #e0e0e0'
          }}
        >
          {text}
        </code>
      )
    },
    // Código inline (`texto`)
    {
      regex: /`([^`]+)`/g,
      component: (text, key) => (
        <code 
          key={key}
          style={{
            backgroundColor: '#f5f5f5',
            padding: '1px 3px',
            borderRadius: '2px',
            fontFamily: 'monospace',
            fontSize: '0.9em'
          }}
        >
          {text}
        </code>
      )
    },
    // Negrito (*texto*)
    {
      regex: /\*([^*]+)\*/g,
      component: (text, key) => <strong key={key}>{text}</strong>
    },
    // Itálico (_texto_)
    {
      regex: /_([^_]+)_/g,
      component: (text, key) => <em key={key}>{text}</em>
    },
    // Taxado (~texto~)
    {
      regex: /~([^~]+)~/g,
      component: (text, key) => (
        <span key={key} style={{ textDecoration: 'line-through' }}>
          {text}
        </span>
      )
    }
  ];

  // Encontrar todas as ocorrências de formatação
  const matches = [];
  
  patterns.forEach((pattern, patternIndex) => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1], // Texto dentro dos marcadores
        component: pattern.component,
        patternIndex,
        fullMatch: match[0]
      });
    }
  });

  // Ordenar matches por posição
  matches.sort((a, b) => a.start - b.start);

  // Resolver conflitos (matches sobrepostos) - prioridade para padrões anteriores
  const resolvedMatches = [];
  matches.forEach(match => {
    const hasConflict = resolvedMatches.some(existing => 
      (match.start < existing.end && match.end > existing.start)
    );
    
    if (!hasConflict) {
      resolvedMatches.push(match);
    }
  });

  // Construir o resultado
  resolvedMatches.forEach((match, index) => {
    // Adicionar texto antes do match
    if (match.start > currentIndex) {
      const textBefore = line.substring(currentIndex, match.start);
      if (textBefore) {
        parts.push(textBefore);
      }
    }
    
    // Adicionar o componente formatado
    parts.push(match.component(match.text, `format-${index}`));
    
    currentIndex = match.end;
  });

  // Adicionar texto restante
  if (currentIndex < line.length) {
    const remainingText = line.substring(currentIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  // Se não há formatação, retornar o texto original
  if (parts.length === 0) {
    return line;
  }

  return parts;
};

export default formatWhatsAppText; 