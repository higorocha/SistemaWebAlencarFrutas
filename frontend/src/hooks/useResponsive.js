import { useState, useEffect } from 'react';

/**
 * Hook para detectar o tamanho da tela e fornecer breakpoints responsivos
 * @returns {Object} Objeto com informações sobre o tamanho da tela
 */
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      if (width < 576) {
        setScreenSize('mobile');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 768) {
        setScreenSize('tablet');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < 992) {
        setScreenSize('small-desktop');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    // Verificar tamanho inicial
    checkScreenSize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    // Breakpoints específicos
    isSmallMobile: window.innerWidth < 375,
    isLargeMobile: window.innerWidth >= 375 && window.innerWidth < 576,
    isSmallTablet: window.innerWidth >= 576 && window.innerWidth < 768,
    isLargeTablet: window.innerWidth >= 768 && window.innerWidth < 992,
  };
};

export default useResponsive;
