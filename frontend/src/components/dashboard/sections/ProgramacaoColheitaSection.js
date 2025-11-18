import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Row, Col } from 'antd';
import { styled } from 'styled-components';
import ProgramacaoColheitaGrid from '../ProgramacaoColheitaGrid';
import EstatisticasFrutasColheita from '../EstatisticasFrutasColheita';
import useResponsive from '../../../hooks/useResponsive';

const CardStyled = styled.div`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  background: white;
  padding: ${props => props.$isMobile ? '12px' : '16px'};
  transition: transform 0.2s ease-in-out;
  position: relative;

  &:hover {
    transform: translateY(-2px);
  }

  ${props => props.$isFullscreen ? `
    width: 100%;
    height: 100%;
    min-height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    padding: ${props.$isMobile ? '16px' : '24px'};
    overflow: hidden;
  ` : ''}
`;

const ContentRow = styled(Row)`
  width: 100%;
  ${props => props.$isFullscreen ? `
    flex: 1;
    height: 100%;
  ` : ''}
`;

const ProgramacaoColheitaSection = ({
  programacaoColheita = [],
  onColheitaClick
}) => {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('1'); // '1' = Semana Atual, '2' = Atrasadas
  const [weekOffset, setWeekOffset] = useState(0);
  const fullscreenRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenChange = useCallback(() => {
    const alvo = fullscreenRef.current;
    setIsFullscreen(document.fullscreenElement === alvo);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggleFullscreen = useCallback(() => {
    const alvo = fullscreenRef.current;
    if (!alvo) return;

    if (document.fullscreenElement === alvo) {
      document.exitFullscreen?.();
      return;
    }

    alvo.requestFullscreen?.().catch((erro) => {
      console.error('Não foi possível alternar para tela cheia:', erro);
    });
  }, []);

  const getWeekRange = useCallback((offset = 0) => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() + offset * 7);

    const day = baseDate.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const format = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
    const label = `${format.format(monday)} - ${format.format(sunday)}`;

    // Número da semana (sequencial) - mesma lógica do PrevisaoBananaSection
    const calcularNumeroSemanaSequencial = (data) => {
      const ano = data.getFullYear();
      const primeiroDiaAno = new Date(ano, 0, 1);
      const diaSemana = primeiroDiaAno.getDay();
      const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      const primeiroDiaSemana = new Date(primeiroDiaAno);
      primeiroDiaSemana.setDate(primeiroDiaSemana.getDate() + diasParaSegunda);
      primeiroDiaSemana.setHours(0, 0, 0, 0);

      const dataSegunda = new Date(data);
      const diaSemanaData = dataSegunda.getDay();
      const diasParaSegundaData = diaSemanaData === 0 ? -6 : 1 - diaSemanaData;
      dataSegunda.setDate(dataSegunda.getDate() + diasParaSegundaData);
      dataSegunda.setHours(0, 0, 0, 0);

      const diffMs = dataSegunda.getTime() - primeiroDiaSemana.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.floor(diffDays / 7) + 1;
    };

    const numero = calcularNumeroSemanaSequencial(baseDate);

    return {
      inicio: monday,
      fim: sunday,
      label,
      numero,
      isAtual: offset === 0,
    };
  }, []);

  const selectedWeek = useMemo(() => getWeekRange(weekOffset), [getWeekRange, weekOffset]);

  const handleNavigateWeek = useCallback((delta) => {
    setWeekOffset(prev => prev + delta);
  }, []);

  const handleResetWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  // Calcular altura dos cards em fullscreen (mesma lógica do ProgramacaoColheitaGrid)
  const cardHeightFullscreen = useMemo(() => {
    if (!isFullscreen) return null;
    return isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 180px)';
  }, [isFullscreen, isMobile]);

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
      <Col xs={24}>
        <CardStyled
          ref={fullscreenRef}
          $isMobile={isMobile}
          $isFullscreen={isFullscreen}
        >
          <ContentRow gutter={[24, 0]} $isFullscreen={isFullscreen} style={isFullscreen ? { flex: 1 } : undefined}>
            {/* Esquerda: Programação de Colheita Diária */}
            <Col xs={24} lg={16} style={isFullscreen ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
              <div style={isFullscreen ? { flex: 1, display: 'flex', flexDirection: 'column' } : {}}>
                <ProgramacaoColheitaGrid
                  programacaoColheita={programacaoColheita}
                  onColheitaClick={onColheitaClick}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  selectedWeek={selectedWeek}
                  onNavigateWeek={handleNavigateWeek}
                  onResetWeek={handleResetWeek}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              </div>
            </Col>

            {/* Direita: Estatísticas de Frutas */}
            <Col xs={24} lg={8} style={isFullscreen ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
              <div style={isFullscreen ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}}>
                <EstatisticasFrutasColheita 
                  programacaoColheita={programacaoColheita} 
                  activeTab={activeTab}
                  selectedWeek={selectedWeek}
                  isFullscreen={isFullscreen}
                  cardHeight={cardHeightFullscreen}
                />
              </div>
            </Col>
          </ContentRow>
        </CardStyled>
      </Col>
    </Row>
  );
};

export default ProgramacaoColheitaSection;
