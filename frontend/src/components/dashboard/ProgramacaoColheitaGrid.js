import React, { useMemo } from 'react';
import { Card, Typography, Row, Col, Space, Tag, Tooltip } from 'antd';
import { CalendarOutlined, UserOutlined, AppleOutlined, NumberOutlined } from '@ant-design/icons';
import useResponsive from '../../hooks/useResponsive';
import { formatarData } from '../../utils/dateUtils';
import { intFormatter, capitalizeName } from '../../utils/formatters';
import { getFruitIcon } from '../../utils/fruitIcons';
import './ProgramacaoColheitaGrid.css';

const { Text, Title } = Typography;

const ProgramacaoColheitaGrid = ({ programacaoColheita = [], onColheitaClick }) => {
  const { isMobile, isTablet } = useResponsive();

  // Função para obter ícone da fruta (agora usando SVG)
  const getFruitIconComponent = (frutaNome) => {
    return getFruitIcon(frutaNome, {
      width: isMobile ? '16' : '20',
      height: isMobile ? '16' : '20',
      style: { 
        flexShrink: 0,
        marginRight: '4px'
      }
    });
  };

  // Função para formatar quantidade
  const formatarQuantidade = (quantidade, unidade) => {
    // ✅ FORMATAR: Números com separador de milhar
    const quantidadeFormatada = intFormatter(quantidade);
    return `${quantidadeFormatada} ${unidade}`;
  };

  // Função para obter cores e status por dias restantes
  const getStatusConfig = (diasRestantes) => {
    if (diasRestantes < 0) {
      return {
        cor: '#fef2f2',
        border: '#f5222d',
        label: null, // Usar data para dias passados
        textColor: '#991b1b'
      };
    } else if (diasRestantes === 0) {
      return {
        cor: '#fff7e6',
        border: '#faad14',
        label: 'HOJE', // Apenas "HOJE" para hoje
        textColor: '#d46b08'
      };
    } else if (diasRestantes === 1) {
      return {
        cor: '#fef3c7',
        border: '#fa8c16',
        label: null, // Usar data para amanhã
        textColor: '#92400e'
      };
    } else {
      return {
        cor: '#f6ffed',
        border: '#52c41a',
        label: null, // Usar data para dias futuros
        textColor: '#166534'
      };
    }
  };

  // Agrupar colheitas por dia
  const colunasPorDia = useMemo(() => {
    const hoje = new Date();
    const colunas = {};
    
    // ✅ CORREÇÃO: Incluir dias passados (atrasados) + próximos 5 dias
    // Buscar todas as datas únicas das colheitas
    const datasUnicas = new Set();
    programacaoColheita.forEach(item => {
      const dataColheita = new Date(item.dataPrevistaColheita);
      const dataStr = dataColheita.toISOString().split('T')[0];
      datasUnicas.add(dataStr);
    });
    
    // Adicionar próximos 5 dias (hoje + 4)
    for (let i = 0; i < 5; i++) {
      // ✅ CORREÇÃO: Normalizar data para início do dia
      const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i, 0, 0, 0, 0);
      const dataStr = data.toISOString().split('T')[0];
      datasUnicas.add(dataStr);
    }
    
    // Criar colunas para todas as datas (passadas + futuras)
    datasUnicas.forEach(dataStr => {
      // ✅ CORREÇÃO: Criar data normalizada para início do dia
      const [ano, mes, dia] = dataStr.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
      colunas[dataStr] = {
        data: data,
        colheitas: [],
        totalColheitas: 0
      };
    });

    // Agrupar colheitas por data
    programacaoColheita.forEach(item => {
      const dataColheita = new Date(item.dataPrevistaColheita);
      const dataStr = dataColheita.toISOString().split('T')[0];
      
      if (colunas[dataStr]) {
        colunas[dataStr].colheitas.push(item);
        colunas[dataStr].totalColheitas++;
      }
    });

    return colunas;
  }, [programacaoColheita]);

  // Obter colunas ordenadas
  const colunasOrdenadas = useMemo(() => {
    return Object.entries(colunasPorDia).sort(([dataA], [dataB]) => {
      return new Date(dataA) - new Date(dataB);
    });
  }, [colunasPorDia]);

  // Renderizar item de colheita
  const renderItemColheita = (item, index) => {
    const statusConfig = getStatusConfig(item.diasRestantes);
    
    return (
      <div
        key={index}
        className="item-colheita"
        onClick={() => onColheitaClick && onColheitaClick(item)}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div className="cliente-info">
          <UserOutlined className="cliente-icon" />
          <Text 
            className="cliente-nome"
            style={{ 
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              fontWeight: '600',
              color: '#333'
            }}
          >
            {capitalizeName(item.cliente)}
          </Text>
        </div>
        
        <div className="fruta-quantidade">
          <div className="fruta-info">
            {getFruitIconComponent(item.fruta)}
            <Text 
              className="fruta-nome"
              style={{ 
                fontSize: isMobile ? '0.6875rem' : '0.75rem',
                color: '#666'
              }}
            >
              {capitalizeName(item.fruta)}
            </Text>
          </div>
          
          <div className="quantidade-info">
            <NumberOutlined className="quantidade-icon" />
            <Text 
              className="quantidade"
              style={{ 
                fontSize: isMobile ? '0.6875rem' : '0.75rem',
                fontWeight: '600',
                color: '#333'
              }}
            >
              {formatarQuantidade(item.quantidadePrevista, item.unidade)}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar coluna de dia
  const renderColunaDia = ([dataStr, colunaData]) => {
    // ✅ CORREÇÃO: Normalizar datas para início do dia (00:00:00) para evitar problemas de fuso
    const hoje = new Date();
    const dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
    
    // Normalizar a data da coluna também para início do dia
    const dataColuna = new Date(colunaData.data);
    const dataColunaNormalizada = new Date(dataColuna.getFullYear(), dataColuna.getMonth(), dataColuna.getDate(), 0, 0, 0, 0);
    
    const diferencaMs = dataColunaNormalizada.getTime() - dataAtual.getTime();
    const diasRestantes = Math.round(diferencaMs / (1000 * 60 * 60 * 24));
    
    const statusConfig = getStatusConfig(diasRestantes);
    const dataFormatada = formatarData(colunaData.data);
    
    // ✅ DEBUG: Log para verificar cálculo
    console.log('🔍 Debug Data:', {
      dataStr,
      dataAtual: dataAtual.toISOString(),
      dataColuna: dataColuna.toISOString(),
      dataColunaNormalizada: dataColunaNormalizada.toISOString(),
      diferencaMs,
      diasRestantes,
      statusLabel: diasRestantes === 0 ? 'HOJE' : dataFormatada
    });
    
    return (
      <Col 
        key={dataStr}
        span={24}
        style={{ 
          minWidth: '160px',
          maxWidth: '250px',
          flex: '1 1 160px',
          marginBottom: isMobile ? '16px' : '0'
        }}
      >
        <Card
          className="coluna-dia"
          style={{
            backgroundColor: statusConfig.cor,
            borderColor: statusConfig.border,
            borderWidth: '2px',
            height: isMobile ? '300px' : '350px',
            minHeight: isMobile ? '300px' : '350px',
            maxHeight: isMobile ? '300px' : '350px'
          }}
          bodyStyle={{
            padding: isMobile ? '4px' : '6px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header da coluna */}
          <div className="header-coluna" style={{ marginBottom: '4px' }}>
            {/* Mostrar "HOJE" como badge ou data como badge */}
            <div className="dia-label" style={{ textAlign: 'center', marginBottom: '1px' }}>
              <Tag
                color={statusConfig.border}
                style={{
                  fontSize: isMobile ? '0.625rem' : '0.6875rem',
                  fontWeight: '700',
                  padding: isMobile ? '2px 6px' : '4px 8px',
                  borderRadius: '4px',
                  margin: 0
                }}
              >
                {statusConfig.label || dataFormatada}
              </Tag>
            </div>
            
            {colunaData.totalColheitas > 0 && (
              <div className="contador-colheitas" style={{ textAlign: 'center', marginTop: '1px' }}>
                <Text 
                  style={{ 
                    fontSize: isMobile ? '0.625rem' : '0.6875rem',
                    color: '#666',
                    fontWeight: '500'
                  }}
                >
                  {colunaData.totalColheitas} colheita{colunaData.totalColheitas > 1 ? 's' : ''}
                </Text>
              </div>
            )}
          </div>

          {/* Lista de colheitas */}
          <div className="colheitas-lista" style={{ flex: 1, overflowY: 'auto' }}>
            {colunaData.colheitas.length === 0 ? (
              <div 
                className="sem-colheitas"
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '12px 0' : '20px 0',
                  color: '#999'
                }}
              >
                <CalendarOutlined style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '4px' }} />
                <div style={{ fontSize: isMobile ? '0.625rem' : '0.6875rem' }}>
                  Nenhuma colheita
                </div>
              </div>
            ) : (
              <div className="lista-items">
                {colunaData.colheitas.map((item, index) => renderItemColheita(item, index))}
              </div>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="programacao-colheita-grid">
      <div className="grid-header" style={{ marginBottom: isMobile ? '12px' : '16px' }}>
        <Title 
          level={4} 
          style={{ 
            color: '#2E7D32', 
            margin: 0, 
            fontSize: isMobile ? '0.875rem' : '1rem',
            textAlign: 'center'
          }}
        >
          📅 Programação de Colheita
        </Title>
        {programacaoColheita.length > 0 && (
          <Text 
            style={{ 
              fontSize: isMobile ? '0.6875rem' : '0.75rem',
              color: '#666',
              textAlign: 'center',
              display: 'block',
              marginTop: '4px'
            }}
          >
            {programacaoColheita.length} colheita{programacaoColheita.length > 1 ? 's' : ''} programada{programacaoColheita.length > 1 ? 's' : ''}
            {colunasOrdenadas.length > 5 && (
              <span style={{ color: '#f5222d', fontWeight: '600' }}>
                {' • '}{colunasOrdenadas.length} dias
              </span>
            )}
          </Text>
        )}
      </div>

      {programacaoColheita.length === 0 ? (
        <div 
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            color: '#8c8c8c'
          }}
        >
          <CalendarOutlined style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '16px' }} />
          <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>
            Nenhuma colheita programada
          </div>
          <Text type="secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Aguardando pedidos para colheita
          </Text>
        </div>
      ) : (
        <Row 
          gutter={isMobile ? [8, 8] : [12, 12]} 
          style={{ 
            margin: 0,
            height: isMobile ? '300px' : '350px',
            minHeight: isMobile ? '300px' : '350px',
            maxHeight: isMobile ? '300px' : '350px',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            display: 'flex'
          }}
          className="programacao-colheita-grid"
        >
          {colunasOrdenadas.map(renderColunaDia)}
        </Row>
      )}
    </div>
  );
};

export default ProgramacaoColheitaGrid;
