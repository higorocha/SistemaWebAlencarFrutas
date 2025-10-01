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
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isLargeMobile, setIsLargeMobile] = useState(false);
  const [isSmallTablet, setIsSmallTablet] = useState(false);
  const [isLargeTablet, setIsLargeTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;

      // Breakpoints principais
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

      // Breakpoints específicos - agora reativos
      setIsSmallMobile(width < 375);
      setIsLargeMobile(width >= 375 && width < 576);
      setIsSmallTablet(width >= 576 && width < 768);
      setIsLargeTablet(width >= 768 && width < 992);
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
    // Breakpoints específicos - agora reativos
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
  };
};

export default useResponsive;
