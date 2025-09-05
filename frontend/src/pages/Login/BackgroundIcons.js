import React, { useMemo } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { fruitIcons } from './styles';

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const IconWrapper = styled('div')(({ theme, top, left, delay, size }) => ({
  position: 'absolute',
  top,
  left,
  animation: `${float} 6s ease-in-out infinite`,
  animationDelay: delay,
  opacity: 0.2,
  zIndex: 0,
  img: {
    width: size,
    height: size,
    filter: theme.palette.mode === 'dark' 
      ? 'brightness(0.7) invert(0.8)' 
      : 'brightness(0.8)'
  }
}));

const BackgroundIcons = () => {
  // Função para verificar se duas posições estão suficientemente distantes
  const isPositionValid = (newPos, positions, minDistance) => {
    return positions.every(pos => {
      const distance = Math.sqrt(
        Math.pow(newPos.top - pos.top, 2) + Math.pow(newPos.left - pos.left, 2)
      );
      return distance >= minDistance;
    });
  };

  // Função para gerar posições únicas com espaçamento mínimo
  const generatePositions = (count, minDistance) => {
    const positions = [];
    const maxAttempts = 100; // Limite de tentativas para evitar loops infinitos

    while (positions.length < count) {
      let attempts = 0;
      let validPosition = false;

      while (!validPosition && attempts < maxAttempts) {
        const section = Math.floor(Math.random() * 9); // 9 seções
        const baseTop = Math.floor(section / 3) * 33.33;
        const baseLeft = (section % 3) * 33.33;

        const top = `${baseTop + Math.random() * 30}%`;
        const left = `${baseLeft + Math.random() * 30}%`;

        const newPosition = { top, left };
        if (isPositionValid(newPosition, positions, minDistance)) {
          positions.push(newPosition);
          validPosition = true;
        }

        attempts++;
      }

      // Se não encontrarmos uma posição válida após várias tentativas, adicionamos mesmo assim
      if (!validPosition) {
        const section = Math.floor(Math.random() * 9);
        const baseTop = Math.floor(section / 3) * 33.33;
        const baseLeft = (section % 3) * 33.33;

        positions.push({
          top: `${baseTop + Math.random() * 30}%`,
          left: `${baseLeft + Math.random() * 30}%`
        });
      }
    }

    return positions;
  };

  // Gera posições para os ícones usando useMemo
  const minDistance = 15; // Distância mínima entre ícones (em porcentagem da tela)
  const iconCount = fruitIcons.length * 8; // 8 instâncias de cada ícone
  const positions = useMemo(() => generatePositions(iconCount, minDistance), []);

  return (
    <>
      {fruitIcons.flatMap((fruit, index) =>
        Array(8).fill(fruit).map((_, i) => {
          const { top, left } = positions[index * 8 + i];
          const delay = `${Math.random() * 2}s`;
          const size = `${Math.random() * 20 + 40}px`;

          return (
            <IconWrapper key={`${fruit.icon}-${i}`} top={top} left={left} delay={delay} size={size}>
              <img 
                src={`/icons/${fruit.icon}.svg`} 
                alt={fruit.icon}
                style={{ transform: `rotate(${Math.random() * 360}deg)` }}
              />
            </IconWrapper>
          );
        })
      )}
    </>
  );
};

export default React.memo(BackgroundIcons);