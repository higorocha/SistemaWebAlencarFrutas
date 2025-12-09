// src/components/dashboard/painel-frutas/components/CulturaHeader.js
import React from 'react';
import { Row, Col, Typography } from 'antd';
import { 
  DollarOutlined, 
  InboxOutlined, 
  EnvironmentOutlined, 
  LineChartOutlined 
} from '@ant-design/icons';
import { numberFormatter, formatCurrency, formataLeitura } from '../../../../utils/formatters';

const { Text } = Typography;

const CulturaHeader = ({ dados }) => {
  // Debug: verificar estrutura dos dados
  // console.log('CulturaHeader dados:', dados);
  // console.log('dadosUnidades:', dados?.resumo?.dadosUnidades);
  
  // Card estilo "VisualizarPedidoModal" (Seção Financeira)
  // Padronizado no Verde (#059669) para consistência total com o Header
  const KpiCard = ({ title, value, subValue, icon }) => (
    <div style={{
      backgroundColor: "#f0fdf4", // Verde muito claro (padrão sucesso/produção)
      border: "1px solid #bbf7d0", // Borda verde clara
      borderRadius: "8px",
      padding: "16px",
      textAlign: "left", // Alinhamento padrão dos cards
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      height: '100%',
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    }}>
      {/* Ícone com destaque */}
      <div style={{
        fontSize: '24px',
        color: "#15803d", // Verde mais escuro para ícone
        backgroundColor: "#dcfce7",
        borderRadius: "50%",
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        {icon}
      </div>
      
      {/* Conteúdo */}
      <div style={{ flex: 1 }}>
        <Text style={{ 
          fontSize: '11px', 
          color: "#166534", // Verde escuro para label
          fontWeight: '700', 
          textTransform: 'uppercase', 
          display: 'block', 
          marginBottom: 2 
        }}>
          {title}
        </Text>
        <Text style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: "#15803d", // Texto principal
          display: 'block',
          lineHeight: 1.2
        }}>
          {value}
        </Text>
        {subValue && (
          <Text style={{ fontSize: '12px', color: "#64748b", fontWeight: 500 }}>
            {subValue}
          </Text>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        
        {/* KPI 1: Produção */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title={`Produção Total`}
            value={
              <div>
                {dados?.resumo?.dadosUnidades && Array.isArray(dados.resumo.dadosUnidades) && dados.resumo.dadosUnidades.length > 0 ? (
                  dados.resumo.dadosUnidades.map((dadoUnidade, index) => (
                    <div 
                      key={dadoUnidade.unidade || index}
                      style={{ 
                        marginBottom: index < dados.resumo.dadosUnidades.length - 1 ? 4 : 0,
                        ...(index > 0 && {
                          borderTop: '1px solid #e5e7eb',
                          paddingTop: 4,
                          marginTop: 4,
                          fontSize: '14px',
                          color: '#64748b',
                          fontWeight: 500
                        })
                      }}
                    >
                      {formataLeitura ? formataLeitura(dadoUnidade.totalColhido || 0) : (dadoUnidade.totalColhido || 0).toLocaleString('pt-BR')} {dadoUnidade.unidade || ''}
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8' }}>Sem dados</span>
                )}
              </div>
            }
            subValue="Volume consolidado"
            icon={<InboxOutlined />}
          />
        </Col>

        {/* KPI 2: Receita */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title="Receita Estimada"
            value={`R$ ${formatCurrency ? formatCurrency(dados.resumo.valorTotal) : dados.resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="Valor Bruto"
            icon={<DollarOutlined />}
          />
        </Col>

        {/* KPI 3: Área */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title="Área Colhida"
            value={`${dados.resumo.areaTotalHa.toFixed(2)} ha`}
            subValue="Área produtiva"
            icon={<EnvironmentOutlined />}
          />
        </Col>

        {/* KPI 4: Produtividade */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title="Produtividade Média Total"
            value={
              <div>
                {dados?.resumo?.dadosUnidades && Array.isArray(dados.resumo.dadosUnidades) && dados.resumo.dadosUnidades.length > 0 ? (
                  dados.resumo.dadosUnidades.map((dadoUnidade, index) => (
                    <div 
                      key={dadoUnidade.unidade || index}
                      style={{ 
                        marginBottom: index < dados.resumo.dadosUnidades.length - 1 ? 4 : 0,
                        ...(index > 0 && {
                          borderTop: '1px solid #e5e7eb',
                          paddingTop: 4,
                          marginTop: 4,
                          fontSize: '14px',
                          color: '#64748b',
                          fontWeight: 500
                        })
                      }}
                    >
                      {numberFormatter ? numberFormatter(dadoUnidade.produtividadeMedia || 0) : (dadoUnidade.produtividadeMedia || 0).toLocaleString()} {dadoUnidade.unidade || ''}/ha
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8' }}>Sem dados</span>
                )}
              </div>
            }
            subValue="Por hectare"
            icon={<LineChartOutlined />}
          />
        </Col>
      </Row>
    </div>
  );
};

export default CulturaHeader;
