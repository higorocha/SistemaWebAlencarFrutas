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
            value={`${formataLeitura ? formataLeitura(dados.resumo.totalColhido) : dados.resumo.totalColhido.toLocaleString('pt-BR')} ${dados.resumo.unidade}`}
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
            title="Produtividade Média"
            value={numberFormatter ? numberFormatter(dados.resumo.produtividadeMedia) : dados.resumo.produtividadeMedia.toLocaleString()}
            subValue={`${dados.resumo.unidade} / ha`}
            icon={<LineChartOutlined />}
          />
        </Col>
      </Row>
    </div>
  );
};

export default CulturaHeader;
