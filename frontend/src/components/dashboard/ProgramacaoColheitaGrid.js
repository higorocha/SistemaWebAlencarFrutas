import React, { useMemo, useState } from 'react';
import { Card, Typography, Row, Col, Space, Tag, Tooltip, Tabs } from 'antd';
import { CalendarOutlined, UserOutlined, AppleOutlined, NumberOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useResponsive from '../../hooks/useResponsive';
import { formatarData } from '../../utils/dateUtils';
import { intFormatter, capitalizeName, capitalizeNameShort } from '../../utils/formatters';
import { getFruitIcon } from '../../utils/fruitIcons';
import './ProgramacaoColheitaGrid.css';

const { Text, Title } = Typography;

// Styled components para as abas
const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0 !important;
  }

  .ant-tabs-tab {
    padding: 10px 20px !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
    border-radius: 8px 8px 0 0 !important;
    border-bottom: 2px solid transparent !important; // Reserva espaço para a borda no hover
  }

  /* Aba Semana Atual (primeira aba) */
  .ant-tabs-tab:first-child {
    .ant-tabs-tab-btn {
      color: #059669 !important; // Cor padrão verde
    }

    &:hover {
      border-bottom-color: #059669 !important; // Borda verde no hover
    }

    &.ant-tabs-tab-active {
      border-color: #e8e8e8 !important;
      border-bottom-color: #fff !important;

      .ant-tabs-tab-btn {
        font-weight: 600 !important;
      }
    }
  }

  /* Aba Colheitas Atrasadas (segunda aba) */
  .ant-tabs-tab:nth-child(2) {
    .ant-tabs-tab-btn {
      color: #dc2626 !important; // Cor padrão vermelha
    }

    &:hover {
      border-bottom-color: #dc2626 !important; // Borda vermelha no hover
    }

    &.ant-tabs-tab-active {
      border-color: #e8e8e8 !important;
      border-bottom-color: #fff !important;

      .ant-tabs-tab-btn {
        font-weight: 600 !important;
      }
    }
  }

  .ant-tabs-content-holder {
    padding: 16px 0 0 0 !important;
    border-top: 1px solid #e8e8e8;
  }

  .ant-tabs-content {
    padding: 0 !important;
  }
`;

// Bolinha pulsante vermelha - MAIOR
const PulsingBadge = styled.div`
  width: 12px;
  height: 12px;
  background-color: #dc2626;
  border-radius: 50%;
  border: 2px solid #ffffff;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.6);
  margin-left: 8px;
  display: inline-block;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
      transform: scale(1.1);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
      transform: scale(1);
    }
  }
`;

const ProgramacaoColheitaGrid = ({ programacaoColheita = [], onColheitaClick, activeTab, onTabChange }) => {
  const { isMobile, isTablet } = useResponsive();

  // Função para calcular a semana atual (segunda anterior ao dia atual até domingo próximo)
  const calcularSemanaAtual = useMemo(() => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

    // Calcular a segunda-feira anterior (ou o próprio dia se for segunda)
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segundaFeira = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasParaSegunda, 0, 0, 0, 0);

    // Calcular o domingo próximo
    const diasParaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
    const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasParaDomingo, 23, 59, 59, 999);

    return { inicio: segundaFeira, fim: domingo };
  }, []);

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

  // Agrupar colheitas por categoria (semana atual e atrasadas)
  const { colheitasSemanaAtual, colheitasAtrasadas } = useMemo(() => {
    const semanaAtual = {};
    const atrasadas = {};

    // Buscar todas as datas únicas das colheitas
    const datasUnicasSemana = new Set();
    const datasUnicasAtrasadas = new Set();

    const statusVisiveisNaGrade = ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL'];

    // Filtrar colheitas por categoria
    programacaoColheita.forEach(item => {
      // 1. Ocultar itens de pedidos que não devem aparecer na grade (ex: já precificados)
      if (!statusVisiveisNaGrade.includes(item.statusPedido)) {
        return;
      }

      // 2. Se o pedido é de colheita parcial, ocultar apenas a fruta que já foi colhida
      if (item.statusPedido === 'COLHEITA_PARCIAL' && item.quantidadeReal && item.quantidadeReal > 0) {
        return;
      }

      // 3. Ocultar colheitas com quantidade exatamente igual a 1 (regra de negócio existente)
      if (item.quantidadePrevista === 1) {
        return;
      }

      const dataColheita = new Date(item.dataPrevistaColheita);
      const dataColheitaNormalizada = new Date(dataColheita.getFullYear(), dataColheita.getMonth(), dataColheita.getDate(), 0, 0, 0, 0);
      const dataStr = dataColheitaNormalizada.toISOString().split('T')[0];

      // Verificar se está dentro da semana atual
      if (dataColheitaNormalizada >= calcularSemanaAtual.inicio && dataColheitaNormalizada <= calcularSemanaAtual.fim) {
        datasUnicasSemana.add(dataStr);
      } else if (dataColheitaNormalizada < calcularSemanaAtual.inicio) {
        // Colheitas atrasadas (antes da semana atual)
        datasUnicasAtrasadas.add(dataStr);
      }
    });

    // Adicionar todos os dias da semana atual (segunda a domingo)
    for (let i = 0; i < 7; i++) {
      const data = new Date(calcularSemanaAtual.inicio);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      datasUnicasSemana.add(dataStr);
    }

    // Criar colunas para semana atual
    datasUnicasSemana.forEach(dataStr => {
      const [ano, mes, dia] = dataStr.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
      semanaAtual[dataStr] = {
        data: data,
        colheitas: [],
        totalColheitas: 0
      };
    });

    // Criar colunas para colheitas atrasadas
    datasUnicasAtrasadas.forEach(dataStr => {
      const [ano, mes, dia] = dataStr.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
      atrasadas[dataStr] = {
        data: data,
        colheitas: [],
        totalColheitas: 0
      };
    });

    // Distribuir colheitas nas colunas
    programacaoColheita.forEach(item => {
      // 1. Ocultar itens de pedidos que não devem aparecer na grade (ex: já precificados)
      if (!statusVisiveisNaGrade.includes(item.statusPedido)) {
        return;
      }

      // 2. Se o pedido é de colheita parcial, ocultar apenas a fruta que já foi colhida
      if (item.statusPedido === 'COLHEITA_PARCIAL' && item.quantidadeReal && item.quantidadeReal > 0) {
        return;
      }

      // 3. Ocultar colheitas com quantidade exatamente igual a 1 (regra de negócio existente)
      if (item.quantidadePrevista === 1) {
        return;
      }

      const dataColheita = new Date(item.dataPrevistaColheita);
      const dataStr = dataColheita.toISOString().split('T')[0];

      if (semanaAtual[dataStr]) {
        semanaAtual[dataStr].colheitas.push(item);
        semanaAtual[dataStr].totalColheitas++;
      } else if (atrasadas[dataStr]) {
        atrasadas[dataStr].colheitas.push(item);
        atrasadas[dataStr].totalColheitas++;
      }
    });

    return {
      colheitasSemanaAtual: semanaAtual,
      colheitasAtrasadas: atrasadas
    };
  }, [programacaoColheita, calcularSemanaAtual]);

  // Obter colunas ordenadas para semana atual
  const colunasSemanaOrdenadas = useMemo(() => {
    return Object.entries(colheitasSemanaAtual).sort(([dataA], [dataB]) => {
      return new Date(dataA) - new Date(dataB);
    });
  }, [colheitasSemanaAtual]);

  // Obter colunas ordenadas para atrasadas
  const colunasAtrasadasOrdenadas = useMemo(() => {
    return Object.entries(colheitasAtrasadas).sort(([dataA], [dataB]) => {
      return new Date(dataA) - new Date(dataB);
    });
  }, [colheitasAtrasadas]);

  // Verificar se há colheitas atrasadas
  const temColheitasAtrasadas = useMemo(() => {
    return Object.values(colheitasAtrasadas).some(coluna => coluna.totalColheitas > 0);
  }, [colheitasAtrasadas]);

  // Calcular o total de colheitas pendentes (que serão exibidas na grade)
  const totalColheitasPendentes = useMemo(() => {
    const totalSemana = Object.values(colheitasSemanaAtual).reduce((acc, col) => acc + col.totalColheitas, 0);
    const totalAtrasadas = Object.values(colheitasAtrasadas).reduce((acc, col) => acc + col.totalColheitas, 0);
    return totalSemana + totalAtrasadas;
  }, [colheitasSemanaAtual, colheitasAtrasadas]);

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
        <div className="cliente-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined className="cliente-icon" />
            <Text 
              className="cliente-nome"
              style={{ 
                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                fontWeight: '600',
                color: '#333'
              }}
            >
              {capitalizeNameShort(item.cliente)}
            </Text>
          </div>
          {item.numeroPedido && (
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '2px' }}>
              <Text style={{ fontSize: '11px', color: '#8c8c8c', fontWeight: 500 }}>
                #{item.numeroPedido}
              </Text>
            </div>
          )}
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
          minWidth: '230px',
          maxWidth: '322px',
          flex: '1 1 230px',
          marginBottom: isMobile ? '16px' : '0'
        }}
      >
        <Card
          className="coluna-dia"
          style={{
            backgroundColor: statusConfig.cor,
            borderColor: statusConfig.border,
            borderWidth: '2px',
            height: isMobile ? '350px' : '400px',
            minHeight: isMobile ? '350px' : '400px',
            maxHeight: isMobile ? '350px' : '400px'
          }}
          bodyStyle={{
            padding: isMobile ? '6px' : '8px',
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

  // Renderizar conteúdo de uma aba
  const renderConteudoAba = (colunas) => {
    if (colunas.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            color: '#8c8c8c'
          }}
        >
          <CalendarOutlined style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '16px' }} />
          <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>
            Nenhuma colheita nesta categoria
          </div>
          <Text type="secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            {activeTab === '1' ? 'Nenhuma colheita programada para esta semana' : 'Nenhuma colheita atrasada'}
          </Text>
        </div>
      );
    }

    return (
      <Row
        gutter={isMobile ? [8, 8] : [12, 12]}
        style={{
          margin: 0,
          overflowX: 'auto',
          flexWrap: 'nowrap',
          display: 'flex'
        }}
        className="programacao-colheita-grid"
      >
        {colunas.map(renderColunaDia)}
      </Row>
    );
  };

  // Configurar itens das abas
  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarOutlined style={{ fontSize: isMobile ? '14px' : '15px' }} />
          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>Semana Atual</span>
        </span>
      ),
      children: renderConteudoAba(colunasSemanaOrdenadas)
    }
  ];

  // Adicionar aba de colheitas atrasadas apenas se houver dados
  if (temColheitasAtrasadas) {
    tabItems.push({
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ClockCircleOutlined style={{ fontSize: isMobile ? '14px' : '15px' }} />
          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>Colheitas Atrasadas</span>
          <PulsingBadge />
        </span>
      ),
      children: renderConteudoAba(colunasAtrasadasOrdenadas)
    });
  }

  return (
    <div className="programacao-colheita-grid">
      <div className="grid-header" style={{ marginBottom: isMobile ? '8px' : '12px' }}>
        <Title
          level={4}
          style={{
            color: '#2E7D32',
            margin: 0,
            fontSize: isMobile ? '0.875rem' : '1rem',
            textAlign: 'left'
          }}
        >
          📅 Programação de Colheita
        </Title>
        {totalColheitasPendentes > 0 && (
          <Text
            style={{
              fontSize: isMobile ? '0.6875rem' : '0.75rem',
              color: '#666',
              textAlign: 'left',
              display: 'block',
              marginTop: '2px'
            }}
          >
            {totalColheitasPendentes} colheita{totalColheitasPendentes > 1 ? 's' : ''} programada{totalColheitasPendentes > 1 ? 's' : ''}
            {temColheitasAtrasadas && (
              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                {' • '}{Object.values(colheitasAtrasadas).reduce((acc, col) => acc + col.totalColheitas, 0)} atrasada{Object.values(colheitasAtrasadas).reduce((acc, col) => acc + col.totalColheitas, 0) > 1 ? 's' : ''}
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
        <StyledTabs
          type="card"
          activeKey={activeTab}
          onChange={onTabChange}
          items={tabItems}
        />
      )}
    </div>
  );
};

export default ProgramacaoColheitaGrid;
