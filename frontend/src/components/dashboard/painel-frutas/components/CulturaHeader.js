// src/components/dashboard/painel-frutas/components/CulturaHeader.js
import React, { useState } from 'react';
import { Row, Col, Typography, Avatar, Tooltip } from 'antd';
import { 
  DollarOutlined, 
  AppstoreOutlined, 
  EnvironmentOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import { getFruitIconPath } from '../../../../utils/fruitIcons';
import { numberFormatter, formatCurrency } from '../../../../utils/formatters';

const { Text } = Typography;

// Componente auxiliar para Tag de Fruta
const FruitTag = ({ fruta, cor }) => {
  const [iconSrc, setIconSrc] = useState(getFruitIconPath(fruta.nome));
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 6,
      background: '#f1f5f9',
      padding: '4px 12px',
      borderRadius: 20,
      border: '1px solid #e2e8f0'
    }}>
      <Avatar 
        src={iconSrc} 
        size={20} 
        style={{ background: 'transparent' }}
        onError={() => setIconSrc('/icons/frutas_64x64.png')}
      />
      <Text style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
        {fruta.nome}
        <span style={{ marginLeft: 6, color: '#94a3b8' }}>|</span> 
        <span style={{ marginLeft: 6, fontWeight: 600, color: cor }}>
          {numberFormatter ? numberFormatter(fruta.total) : fruta.total.toLocaleString()}
        </span>
      </Text>
    </div>
  );
};

const CulturaHeader = ({ dados, cor }) => {
  
  // Função para criar o card de KPI estilo "VisualizarPedidoModal"
  // mas adaptado dinamicamente para a cor da cultura
  const KpiCard = ({ title, value, subValue, icon, colorOverride }) => (
    <div style={{
      backgroundColor: colorOverride ? `${colorOverride}10` : `${cor}10`, // 10% opacidade
      border: `1px solid ${colorOverride ? `${colorOverride}40` : `${cor}40`}`,
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      height: '100%',
      transition: 'transform 0.2s',
      cursor: 'default',
    }}>
      {/* Ícone Circular */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        color: colorOverride || cor,
        fontSize: '22px'
      }}>
        {icon}
      </div>
      
      {/* Textos */}
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: '#1e293b', 
          display: 'block',
          lineHeight: 1.2
        }}>
          {value}
        </Text>
        {subValue && (
          <Text style={{ fontSize: '12px', color: colorOverride || cor, fontWeight: 500 }}>
            {subValue}
          </Text>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        
        {/* KPI 1: Produção Total */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title={`Produção Total (${dados.resumo.unidade})`}
            value={numberFormatter ? numberFormatter(dados.resumo.totalColhido) : dados.resumo.totalColhido.toLocaleString()}
            subValue="Volume colhido"
            icon={<AppstoreOutlined />}
          />
        </Col>

        {/* KPI 2: Valor Estimado (Sempre verde monetário para consistência, ou cor da cultura se preferir) */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title="Receita Estimada"
            value={`R$ ${formatCurrency ? formatCurrency(dados.resumo.valorTotal) : dados.resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="Valor Bruto"
            icon={<DollarOutlined />}
            colorOverride="#059669" // Força verde dinheiro
          />
        </Col>

        {/* KPI 3: Área Total */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title="Área Colhida"
            value={dados.resumo.areaTotalHa.toFixed(1)}
            subValue="Hectares"
            icon={<EnvironmentOutlined />}
          />
        </Col>

        {/* KPI 4: Produtividade Média */}
        <Col xs={24} sm={12} md={6}>
          <KpiCard 
            title="Produtividade Média"
            value={numberFormatter ? numberFormatter(dados.resumo.produtividadeMedia) : dados.resumo.produtividadeMedia.toLocaleString()}
            subValue={`${dados.resumo.unidade} / ha`}
            icon={<BarChartOutlined />}
          />
        </Col>
      </Row>

      {/* Lista de Frutas (Tags/Chips abaixo dos cards) */}
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Composição:</Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {dados.frutas.map(f => (
            <FruitTag key={f.id} fruta={f} cor={cor} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CulturaHeader;
