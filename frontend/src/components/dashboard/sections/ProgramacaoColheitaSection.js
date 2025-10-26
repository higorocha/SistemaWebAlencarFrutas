import React, { useState } from 'react';
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

  &:hover {
    transform: translateY(-2px);
  }
`;

const ProgramacaoColheitaSection = ({
  programacaoColheita = [],
  onColheitaClick
}) => {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('1'); // '1' = Semana Atual, '2' = Atrasadas

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
      <Col xs={24}>
        <CardStyled $isMobile={isMobile}>
          <Row gutter={[24, 0]}>
            {/* Esquerda: Programação de Colheita Diária */}
            <Col xs={24} lg={16}>
              <ProgramacaoColheitaGrid
                programacaoColheita={programacaoColheita}
                onColheitaClick={onColheitaClick}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </Col>

            {/* Direita: Estatísticas de Frutas */}
            <Col xs={24} lg={8}>
              <EstatisticasFrutasColheita 
                programacaoColheita={programacaoColheita} 
                activeTab={activeTab} 
              />
            </Col>
          </Row>
        </CardStyled>
      </Col>
    </Row>
  );
};

export default ProgramacaoColheitaSection;
