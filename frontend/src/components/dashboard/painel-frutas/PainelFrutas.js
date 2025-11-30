import React from 'react';
import { Row, Col } from 'antd';
import GraficoCulturasFrutas from './sections/GraficoCulturasFrutas';
import GraficoAreasFrutas from './sections/GraficoAreasFrutas';
import ListagemAreas from './sections/ListagemAreas';
import useResponsive from '../../../hooks/useResponsive';

const PainelFrutas = () => {
  const { isMobile } = useResponsive();

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      {/* Seção 1: Gráfico Culturas/Frutas */}
      <Row gutter={isMobile ? [8, 16] : [24, 24]} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <Col xs={24}>
          <GraficoCulturasFrutas />
        </Col>
      </Row>

      {/* Seção 2: Gráfico Áreas e Frutas */}
      <Row gutter={isMobile ? [8, 16] : [24, 24]} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <Col xs={24}>
          <GraficoAreasFrutas />
        </Col>
      </Row>

      {/* Seção 3: Listagem de Áreas */}
      <Row gutter={isMobile ? [8, 16] : [24, 24]}>
        <Col xs={24}>
          <ListagemAreas />
        </Col>
      </Row>
    </div>
  );
};

export default PainelFrutas;

