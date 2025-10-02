// src/components/pedidos/dashboard/StatusCards.js

import React from "react";
import { Row, Col, Card, Statistic, Typography } from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { formatarValorMonetario } from "../../../utils/formatters";
import useResponsive from "../../../hooks/useResponsive";
import styled from "styled-components";

const { Text } = Typography;

// Styled Card consistente com Dashboard principal
const CardStyled = styled(Card)`
  border-radius: 0.625rem;
  box-shadow: 0 0.125rem 0.3125rem rgba(0,0,0,0.15), 0 0.125rem 0.625rem rgba(0,0,0,0.05);
  height: 100%;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-0.125rem);
  }
`;

const StatusCards = ({ stats = {} }) => {
  const { isMobile, isTablet, isSmallTablet, isLargeTablet } = useResponsive();

  const {
    totalPedidos = 0,
    valorTotalAberto = 0,
    pedidosAtivos = 0,
    pedidosFinalizados = 0,
    valorRecebido = 0,
    pedidosVencidos = 0,
  } = stats;


  // Determinar configurações baseadas no tamanho da tela
  const gridConfig = isMobile
    ? { columns: '1fr 1fr', gap: '0.75rem', iconSize: '1.75rem', valueSize: '1.125rem', labelSize: '0.6875rem', padding: '0.5rem', minHeight: '6.25rem' }
    : isTablet
    ? { columns: 'repeat(3, 1fr)', gap: '0.875rem', iconSize: '1.875rem', valueSize: '1.1875rem', labelSize: '0.75rem', padding: '0.625rem', minHeight: '7rem' }
    : null;

  // Labels abreviados para tablets (evitar quebra de linha)
  const getLabel = (fullLabel, shortLabel) => {
    if (isMobile) return fullLabel; // Mobile usa labels completos (espaço 2x3)
    if (isTablet) return shortLabel; // TODOS os tablets usam abreviações (576px-992px)
    return fullLabel; // Desktop usa completos (>= 992px)
  };

  // Estilo comum para labels (evitar quebra de linha)
  const labelStyle = {
    fontSize: gridConfig?.labelSize || '0.6875rem',
    color: '#8c8c8c',
    textAlign: 'center',
    fontWeight: '400',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    padding: '0 4px'
  };

  return (
    <>
      {isLargeTablet ? (
        /* Large Tablet (768px-992px) - Grid 3x2 Compacto */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.625rem',
          marginBottom: '1rem'
        }}>
          {/* Card 1: Total de Pedidos */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              minHeight: '5.5rem'
            }}>
              <ShoppingOutlined style={{ fontSize: '1.5rem', color: '#059669', marginBottom: '0.375rem' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#059669', lineHeight: 1, marginBottom: '0.25rem' }}>
                {totalPedidos}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#8c8c8c',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: 1.2
              }}>
                Total de Pedidos
              </div>
            </div>
          </CardStyled>

          {/* Card 2: Pedidos Ativos */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              minHeight: '5.5rem'
            }}>
              <ClockCircleOutlined style={{ fontSize: '1.5rem', color: '#1890ff', marginBottom: '0.375rem' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1890ff', lineHeight: 1, marginBottom: '0.25rem' }}>
                {pedidosAtivos}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#8c8c8c',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: 1.2
              }}>
                Pedidos Ativos
              </div>
            </div>
          </CardStyled>

          {/* Card 3: Pedidos Finalizados */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              minHeight: '5.5rem'
            }}>
              <CheckCircleOutlined style={{ fontSize: '1.5rem', color: '#52c41a', marginBottom: '0.375rem' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#52c41a', lineHeight: 1, marginBottom: '0.25rem' }}>
                {pedidosFinalizados}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#8c8c8c',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: 1.2
              }}>
                Pedidos Finalizados
              </div>
            </div>
          </CardStyled>

          {/* Card 4: Aguardando Pagamento */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              minHeight: '5.5rem'
            }}>
              <DollarOutlined style={{ fontSize: '1.5rem', color: '#faad14', marginBottom: '0.375rem' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#faad14', lineHeight: 1, marginBottom: '0.25rem' }}>
                {formatarValorMonetario(valorTotalAberto)}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#8c8c8c',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: 1.2
              }}>
                Aguardando Pagamento
              </div>
            </div>
          </CardStyled>

          {/* Card 5: Valor Recebido */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              minHeight: '5.5rem'
            }}>
              <CheckCircleOutlined style={{ fontSize: '1.5rem', color: '#52c41a', marginBottom: '0.375rem' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#52c41a', lineHeight: 1, marginBottom: '0.25rem' }}>
                {formatarValorMonetario(valorRecebido)}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#8c8c8c',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: 1.2
              }}>
                Valor Recebido
              </div>
            </div>
          </CardStyled>

          {/* Card 6: Pedidos Vencidos */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              minHeight: '5.5rem'
            }}>
              <WarningOutlined
                style={{
                  fontSize: '1.5rem',
                  color: pedidosVencidos > 0 ? '#ff4d4f' : '#d9d9d9',
                  marginBottom: '0.375rem'
                }}
              />
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: pedidosVencidos > 0 ? '#ff4d4f' : '#d9d9d9',
                lineHeight: 1,
                marginBottom: '0.25rem'
              }}>
                {pedidosVencidos}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#8c8c8c',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: 1.2
              }}>
                Pedidos Vencidos
              </div>
            </div>
          </CardStyled>
        </div>
      ) : isMobile || isTablet ? (
        /* Mobile e Small Tablet (< 768px) - Grid 2x3 igual Dashboard.js */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Card 1: Total de Pedidos */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <ShoppingOutlined style={{ fontSize: '28px', color: '#059669', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#059669', lineHeight: 1.2, marginBottom: '6px' }}>
                {totalPedidos}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Total de Pedidos
              </div>
            </div>
          </CardStyled>

          {/* Card 2: Pedidos Ativos */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <ClockCircleOutlined style={{ fontSize: '28px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1890ff', lineHeight: 1.2, marginBottom: '6px' }}>
                {pedidosAtivos}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Pedidos Ativos
              </div>
            </div>
          </CardStyled>

          {/* Card 3: Pedidos Finalizados */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <CheckCircleOutlined style={{ fontSize: '28px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#52c41a', lineHeight: 1.2, marginBottom: '6px' }}>
                {pedidosFinalizados}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Pedidos Finalizados
              </div>
            </div>
          </CardStyled>

          {/* Card 4: Aguardando Pagamento */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <DollarOutlined style={{ fontSize: '28px', color: '#faad14', marginBottom: '8px' }} />
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#faad14', lineHeight: 1.2, marginBottom: '6px' }}>
                {formatarValorMonetario(valorTotalAberto).replace('R$ ', '')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Aguardando Pagamento
              </div>
            </div>
          </CardStyled>

          {/* Card 5: Valor Recebido */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <CheckCircleOutlined style={{ fontSize: '28px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#52c41a', lineHeight: 1.2, marginBottom: '6px' }}>
                {formatarValorMonetario(valorRecebido).replace('R$ ', '')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Valor Recebido
              </div>
            </div>
          </CardStyled>

          {/* Card 6: Pedidos Vencidos */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <WarningOutlined
                style={{
                  fontSize: '28px',
                  color: pedidosVencidos > 0 ? '#ff4d4f' : '#d9d9d9',
                  marginBottom: '8px'
                }}
              />
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: pedidosVencidos > 0 ? '#ff4d4f' : '#d9d9d9',
                lineHeight: 1.2,
                marginBottom: '6px'
              }}>
                {pedidosVencidos}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Pedidos Vencidos
              </div>
            </div>
          </CardStyled>
        </div>
      ) : (
        /* Desktop: Layout original horizontal */
        <div className="status-cards-row">
          {/* Total de Pedidos */}
          <div className="status-cards-col">
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              styles={{ body: { padding: "0.75rem" } }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>
                    Total de Pedidos
                  </Text>
                }
                value={totalPedidos}
                prefix={<ShoppingOutlined style={{ color: "#059669", fontSize: "1rem" }} />}
                valueStyle={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </div>

          {/* Pedidos Ativos */}
          <div className="status-cards-col">
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              styles={{ body: { padding: "0.75rem" } }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>
                    Pedidos Ativos
                  </Text>
                }
                value={pedidosAtivos}
                prefix={<ClockCircleOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
                valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </div>

          {/* Pedidos Finalizados */}
          <div className="status-cards-col">
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              styles={{ body: { padding: "0.75rem" } }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>
                    Pedidos Finalizados
                  </Text>
                }
                value={pedidosFinalizados}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
                valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </div>

          {/* Valor Total em Aberto */}
          <div className="status-cards-col">
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              styles={{ body: { padding: "0.75rem" } }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>
                    Aguardando Pagamento
                  </Text>
                }
                value={formatarValorMonetario(valorTotalAberto)}
                prefix={<DollarOutlined style={{ color: "#faad14", fontSize: "1rem" }} />}
                valueStyle={{ color: "#faad14", fontSize: "1rem", fontWeight: "600" }}
              />
            </Card>
          </div>

          {/* Valor Recebido */}
          <div className="status-cards-col">
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              styles={{ body: { padding: "0.75rem" } }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>
                    Valor Recebido
                  </Text>
                }
                value={formatarValorMonetario(valorRecebido)}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
                valueStyle={{ color: "#52c41a", fontSize: "1rem", fontWeight: "600" }}
              />
            </Card>
          </div>

          {/* Pedidos Vencidos */}
          <div className="status-cards-col">
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
                ...(pedidosVencidos > 0 && {
                  borderColor: "#ff4d4f",
                  boxShadow: "0 0.125rem 0.5rem rgba(255, 77, 79, 0.15)"
                })
              }}
              styles={{ body: { padding: "0.75rem" } }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>
                    Pedidos Vencidos
                  </Text>
                }
                value={pedidosVencidos}
                prefix={
                  <WarningOutlined
                    style={{
                      color: pedidosVencidos > 0 ? "#ff4d4f" : "#d9d9d9",
                      fontSize: "1rem"
                    }}
                  />
                }
                valueStyle={{
                  color: pedidosVencidos > 0 ? "#ff4d4f" : "#d9d9d9",
                  fontSize: "1.125rem",
                  fontWeight: "600"
                }}
              />
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusCards;