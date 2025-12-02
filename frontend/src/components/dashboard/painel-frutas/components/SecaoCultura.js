// src/components/dashboard/painel-frutas/components/SecaoCultura.js
import React, { useState } from 'react';
import { Card, Row, Col, Typography, Segmented, Divider, Collapse } from 'antd';
import { BarChartOutlined, LineChartOutlined, CaretRightOutlined } from '@ant-design/icons';
import CulturaHeader from './CulturaHeader';
import GraficoProdutividade from './GraficoProdutividade';
import TabelaDesempenhoAreas from './TabelaDesempenhoAreas';
import { getCulturaIconPath } from '../../../../utils/fruitIcons';

const { Panel } = Collapse;

const SecaoCultura = ({ dados, corTema }) => {
  const [tipoGrafico, setTipoGrafico] = useState('bar'); 

  // Prepara dados para o gráfico
  const prepararDadosGrafico = () => {
    const map = new Map();
    dados.frutas.forEach(fruta => {
      fruta.dadosGrafico.forEach(d => {
        const key = d.dia; 
        if (!map.has(key)) map.set(key, { name: key }); 
        map.get(key)[fruta.nome] = d.qtd;
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name - b.name);
  };

  const dadosGrafico = prepararDadosGrafico();
  const chavesFrutas = dados.frutas.map(f => ({ key: f.nome }));

  // Ícone principal da cultura
  const iconMain = getCulturaIconPath(dados.cultura);

  return (
    <Card 
      bordered={false}
      style={{ 
        marginBottom: 24, 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}
      styles={{ 
        body: { padding: 0 } // Remove padding padrão para controlar layout interno
      }}
    >
      {/* HEADER ESTILO PROJETO (Sólido com cor da cultura) */}
      <Collapse 
        defaultActiveKey={['1']} 
        ghost 
        expandIcon={({ isActive }) => (
          <CaretRightOutlined 
            rotate={isActive ? 90 : 0} 
            style={{ fontSize: 16, color: '#ffffff' }} 
          />
        )}
        style={{
          backgroundColor: corTema,
          borderBottom: `2px solid ${corTema}CC` // Borda um pouco mais escura
        }}
      >
        <Panel 
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={iconMain} 
                  alt="" 
                  style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} 
                  onError={(e) => {
                    if (e && e.target) {
                      e.target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <Typography.Text style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {dados.cultura}
              </Typography.Text>
            </div>
          }
          key="1"
          style={{ padding: '4px 0' }} // Ajuste fino do header
        >
          {/* CORPO DO CARD (Fundo Branco) */}
          <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '0 0 8px 8px' }}>
            
            {/* Bloco de KPIs (Totais) */}
            <CulturaHeader dados={dados} cor={corTema} />

            <Divider style={{ margin: '24px 0', borderColor: '#f0f0f0' }} />

            <Row gutter={[32, 24]}>
              {/* Coluna Principal: Gráficos */}
              <Col xs={24} lg={15}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 16 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 4, height: 24, backgroundColor: corTema, borderRadius: 2 
                    }} />
                    <Typography.Title level={5} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                      Evolução da Produção
                    </Typography.Title>
                  </div>
                  
                  <Segmented
                    options={[
                      { value: 'bar', icon: <BarChartOutlined /> },
                      { value: 'line', icon: <LineChartOutlined /> },
                    ]}
                    value={tipoGrafico}
                    onChange={setTipoGrafico}
                    size="small"
                  />
                </div>

                {/* Container do Gráfico com estilo "Box" */}
                <div style={{ 
                  height: 340, 
                  background: '#f8fafc', // Fundo sutil cinza
                  borderRadius: 12, 
                  padding: '16px 16px 0 16px',
                  border: '1px solid #eef2f6'
                }}>
                  <GraficoProdutividade 
                    data={dadosGrafico} 
                    keys={chavesFrutas} 
                    type={tipoGrafico}
                    colorBase={corTema}
                    unidade={dados.resumo.unidade}
                  />
                </div>
              </Col>

              {/* Coluna Lateral: Detalhamento */}
              <Col xs={24} lg={9}>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                   <div style={{ 
                      width: 4, height: 24, backgroundColor: corTema, borderRadius: 2 
                    }} />
                  <Typography.Title level={5} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                    Produtividade por Área
                  </Typography.Title>
                </div>
                
                <div style={{ 
                  border: '1px solid #f0f0f0',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}>
                  <TabelaDesempenhoAreas 
                    frutas={dados.frutas} 
                    mediaGeral={dados.resumo.produtividadeMedia}
                    unidade={dados.resumo.unidade}
                    corBase={corTema}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default SecaoCultura;
