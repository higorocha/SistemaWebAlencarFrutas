// src/components/pedidos/dashboard/PedidoCard.js

import React from "react";
import { Card, Button, Tag, Typography, Space, Tooltip } from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  CreditCardOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario, capitalizeName, capitalizeNameShort } from "../../../utils/formatters";
import useCoresPorTempo from "../../../hooks/useCoresPorTempo";
import useResponsive from "../../../hooks/useResponsive";

const { Text } = Typography;

const PedidoCard = ({ pedido, onAction, actionType, onVisualizar }) => {
  const { isMobile } = useResponsive();
  const { getCorPorData } = useCoresPorTempo();
  
  // Configurações de ação baseadas no tipo
  const getActionConfig = (type, status) => {
    const configs = {
      colheita: {
        icon: <ShoppingOutlined />,
        text: status === 'COLHEITA_PARCIAL' ? "Continuar Colheita" : "Registrar Colheita",
        color: "#1890ff",
        disabled: !["PEDIDO_CRIADO", "AGUARDANDO_COLHEITA", "COLHEITA_PARCIAL"].includes(status),
      },
      precificacao: {
        icon: <DollarOutlined />,
        text: "Definir Preços",
        color: "#722ed1",
        disabled: !["COLHEITA_REALIZADA", "AGUARDANDO_PRECIFICACAO"].includes(status),
      },
      pagamento: {
        icon: <CreditCardOutlined />,
        text: "Registrar Pagamento",
        color: "#faad14",
        disabled: !["PRECIFICACAO_REALIZADA", "AGUARDANDO_PAGAMENTO", "PAGAMENTO_PARCIAL"].includes(status),
      },
      visualizar: {
        icon: <EyeOutlined />,
        text: "Visualizar",
        color: "#1890ff",
        disabled: false,
      },
    };
    return configs[type] || configs.visualizar;
  };

  const actionConfig = getActionConfig(actionType, pedido.status);

  // Função para formatar frutas
  const renderFrutas = () => {
    if (!pedido.frutasPedidos || pedido.frutasPedidos.length === 0) {
      return <Text type="secondary">Sem frutas</Text>;
    }

    // Filtrar frutas onde a quantidade prevista > 1
    const frutasComColheita = pedido.frutasPedidos.filter(fruta => fruta.quantidadePrevista > 1);
    
    // Se não há frutas com quantidade de colheita > 1, mostrar todas as frutas normalmente
    if (frutasComColheita.length === 0) {
      if (pedido.frutasPedidos.length === 1) {
        return (
          <Tag color="green" style={{ margin: 0 }}>
            {capitalizeName(pedido.frutasPedidos[0].fruta?.nome || "N/A")}
          </Tag>
        );
      }
      return (
        <Tag color="blue" style={{ margin: 0 }}>
          {pedido.frutasPedidos.length} frutas
        </Tag>
      );
    }

    if (frutasComColheita.length === 1) {
      return (
        <Tag color="green" style={{ margin: 0 }}>
          {capitalizeName(frutasComColheita[0].fruta?.nome || "N/A")}
        </Tag>
      );
    }

    return (
      <Tag color="blue" style={{ margin: 0 }}>
        {frutasComColheita.length} frutas
      </Tag>
    );
  };

  // Verificar se o pedido está vencido
  const isVencido = pedido.status === "AGUARDANDO_COLHEITA" && 
    moment(pedido.dataPrevistaColheita).isBefore(moment(), 'day');

  const cardStyle = {
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
    marginBottom: "6px",
    width: "100%",
    transition: "all 0.2s ease",
    cursor: "pointer",
    ...(isVencido && {
      borderLeft: "3px solid #ff4d4f",
      borderColor: "#ffccc7",
    }),
  };

  return (
    <Card
      style={cardStyle}
      styles={{ body: { padding: "10px 12px" } }}
      hoverable
      className="pedido-card-container"
      onClick={() => onVisualizar && onVisualizar(pedido)}
    >
      {actionType === "pagamento" ? (
        /* Layout alinhado com colunas para aguardando pagamento */
        <div className="pedido-card-content">
          <div className="pedido-info-container">
            {/* Coluna 1: Nº Pedido + Valor */}
            <div className="pedido-info-item pedido-numero" style={{ flex: "0 0 auto", minWidth: "140px", flexDirection: "column", alignItems: "flex-start", gap: "4px", textAlign: "left", justifyContent: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <Text strong style={{ color: "#059669", fontSize: "14px", whiteSpace: "nowrap" }}>
                  {pedido.numeroPedido}
                </Text>
                {isVencido && (
                  <Tag color="error" style={{ fontSize: "10px", margin: 0, flexShrink: 0 }}>
                    VENCIDO
                  </Tag>
                )}
              </div>
              {(() => {
                let diasInfo = null;
                if (['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL'].includes(pedido.status)) {
                    let dataReferencia = pedido.dataColheita;
                    if (pedido.pagamentosPedidos && pedido.pagamentosPedidos.length > 0) {
                        const ultimoPagamento = [...pedido.pagamentosPedidos].sort((a, b) => new Date(b.dataPagamento) - new Date(a.dataPagamento))[0];
                        dataReferencia = ultimoPagamento.dataPagamento;
                    }
                    if (dataReferencia) {
                        diasInfo = getCorPorData(dataReferencia, pedido);
                    }
                }

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <Text style={{ 
                      color: pedido.valorFinal ? "#059669" : "#999", 
                      fontSize: "12px", 
                      fontWeight: "600",
                      backgroundColor: pedido.valorFinal ? "#f0fdf4" : "#f9f9f9",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: pedido.valorFinal ? "1px solid #bbf7d0" : "1px solid #e5e5e5",
                    }}>
                      {pedido.valorFinal ? formatarValorMonetario(pedido.valorFinal) : "A definir"}
                    </Text>

                    {diasInfo && diasInfo.dias !== null && (() => {
                      // Verificar se o cliente tem prazo diferenciado
                      const clienteDias = pedido.cliente?.dias;
                      const tooltipTitle = clienteDias !== null && clienteDias !== undefined
                        ? `Este cliente possui um prazo diferenciado de ${clienteDias} dia${clienteDias === 1 ? '' : 's'}`
                        : 'Este cliente não possui prazo diferenciado e está usando 30 dias como padrão';
                      
                      return (
                        <Tooltip title={tooltipTitle} placement="top">
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            backgroundColor: diasInfo.cor, color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '11px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            flexShrink: 0,
                            cursor: 'help'
                          }}>
                            {diasInfo.dias}
                          </div>
                        </Tooltip>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
            
            {/* Coluna 2: Cliente */}
            <div className="pedido-info-item pedido-cliente" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
              <UserOutlined style={{ color: "#666", fontSize: "12px" }} />
              <Text style={{ 
                fontSize: "13px", 
                whiteSpace: "normal", 
                wordWrap: "break-word",
                lineHeight: "1.3"
              }}>
                {capitalizeNameShort(pedido.cliente?.nome || "N/A")}
              </Text>
            </div>
            
            {/* Coluna 3: Frutas */}
            <div className="pedido-frutas" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
              {renderFrutas()}
            </div>
            
            {/* Coluna 4: Data Colheita */}
            <div className="pedido-info-item pedido-data" style={{ flex: "1 1 0", minWidth: "0", textAlign: "center", justifyContent: "center" }}>
              <CalendarOutlined style={{ color: "#666", fontSize: "12px", marginLeft: "-40px" }} />
              <Text style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap"}}>
                {pedido.dataColheita
                  ? moment(pedido.dataColheita).format("DD/MM")
                  : "S/data"}
              </Text>
            </div>
          </div>
          
          {/* Coluna 5: Ação */}
          <div className="pedido-action-button" style={{ flex: "0 0 60px", textAlign: "left", justifyContent: "flex-start" }}>
            {!isMobile ? (
              <Tooltip title={actionConfig.text}>
                <Button
                  type="primary"
                  icon={actionConfig.icon}
                  size="small"
                  style={{
                    backgroundColor: actionConfig.color,
                    borderColor: actionConfig.color,
                    minWidth: "36px",
                    height: "32px"
                  }}
                  disabled={actionConfig.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(pedido);
                  }}
                >
                  <span className="button-text-mobile">{actionConfig.text}</span>
                </Button>
              </Tooltip>
            ) : (
              <Button
                type="primary"
                icon={actionConfig.icon}
                size="small"
                style={{
                  backgroundColor: actionConfig.color,
                  borderColor: actionConfig.color,
                  minWidth: "36px",
                  height: "32px"
                }}
                disabled={actionConfig.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(pedido);
                }}
              >
                <span className="button-text-mobile">{actionConfig.text}</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Layout padrão para outras seções */
        <div className="pedido-card-content">
                    <div className="pedido-info-container">
                      {/* Coluna 1: Número do Pedido */}
                      <div className="pedido-info-item pedido-numero" style={{ flex: "0 0 auto", minWidth: "120px", textAlign: "left", justifyContent: "flex-start" }}>
                        <Text strong style={{ color: "#059669", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {pedido.numeroPedido}
                        </Text>
                        {isVencido && (
                          <Tag color="error" style={{ fontSize: "10px", margin: 0 }}>
                            VENCIDO
                          </Tag>
                        )}
                      </div>
                      
                      {/* Coluna 2: Cliente */}
                      <div className="pedido-info-item pedido-cliente" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <UserOutlined style={{ color: "#666", fontSize: "12px" }} />
                        <Text style={{
                          fontSize: "13px", 
                          whiteSpace: "normal", 
                          wordWrap: "break-word",
                          lineHeight: "1.3"
                        }}>
                          {capitalizeNameShort(pedido.cliente?.nome || "N/A")}
                        </Text>
                      </div>
                      
                      {/* Coluna 3: Frutas */}
                      <div className="pedido-frutas" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        {renderFrutas()}
                      </div>
                      
                      {/* Coluna 4: Data */}
                      <div className="pedido-info-item pedido-data" style={{ flex: "1 1 0", minWidth: "0", textAlign: "center", justifyContent: "center" }}>
                        <CalendarOutlined style={{ color: "#666", fontSize: "12px", marginLeft: "-40px" }} />
                        <Text style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>
                          {pedido.dataPrevistaColheita
                            ? moment(pedido.dataPrevistaColheita).format("DD/MM")
                            : "S/data"}
                        </Text>
                      </div>
                    </div>
                    
                    {/* Coluna 5: Ação */}
                    <div className="pedido-action-button" style={{ flex: "0 0 60px", textAlign: "left", justifyContent: "flex-start" }}>
                      {!isMobile ? (
                        <Tooltip title={actionConfig.text}>
                          <Button
                            type="primary"
                            icon={actionConfig.icon}
                            size="small"
                            style={(
                              pedido.status === 'COLHEITA_PARCIAL' && actionType === 'colheita'
                                ? {
                                    background: 'linear-gradient(135deg, #1890ff 49%, #faad14 51%)',
                                    borderColor: '#1890ff',
                                    minWidth: '36px',
                                    height: '32px',
                                  }
                                : {
                                    backgroundColor: actionConfig.color,
                                    borderColor: actionConfig.color,
                                    minWidth: '36px',
                                    height: '32px',
                                  }
                            )}
                            disabled={actionConfig.disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction(pedido);
                            }}
                          >
                            <span className="button-text-mobile">{actionConfig.text}</span>
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          type="primary"
                          icon={actionConfig.icon}
                          size="small"
                          style={(
                            pedido.status === 'COLHEITA_PARCIAL' && actionType === 'colheita'
                              ? {
                                  background: 'linear-gradient(135deg, #1890ff 49%, #faad14 51%)',
                                  borderColor: '#1890ff',
                                  minWidth: '36px',
                                  height: '32px',
                                }
                              : {
                                  backgroundColor: actionConfig.color,
                                  borderColor: actionConfig.color,
                                  minWidth: '36px',
                                  height: '32px',
                                }
                          )}
                          disabled={actionConfig.disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction(pedido);
                          }}
                        >
                          <span className="button-text-mobile">{actionConfig.text}</span>
                        </Button>
                      )}
                    </div>        </div>
      )}
    </Card>
  );
};

export default PedidoCard;