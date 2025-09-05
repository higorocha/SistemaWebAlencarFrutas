// src/components/pedidos/dashboard/FinalizadosSection.js

import React from "react";
import { Card, Typography, Row, Col, Empty, Badge, Button, Tag, Tooltip, Pagination } from "antd";
import { CheckCircleOutlined, EyeOutlined, UserOutlined, CalendarOutlined } from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../../utils/formatters";

const { Title, Text } = Typography;

const FinalizadosSection = ({ pedidos = [], paginacao = {}, onPaginacaoChange, onAction }) => {

  const sectionStyle = {
    marginBottom: "32px",
  };

  const headerStyle = {
    backgroundColor: "#52c41a",
    color: "#ffffff",
    padding: "16px 24px",
    margin: "-1px -1px 0 -1px",
    borderRadius: "8px 8px 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const contentStyle = {
    padding: "24px",
    minHeight: "120px",
    maxHeight: "400px", // Altura máxima
    overflowY: "auto", // Scroll vertical
    overflowX: "hidden",
  };

  const cardStyle = {
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
    marginBottom: "12px",
    transition: "all 0.2s ease",
    cursor: "pointer"
  };

  // Função para obter configuração de status
  const getStatusConfig = (status) => {
    const configs = {
      PAGAMENTO_REALIZADO: { color: 'lime', text: 'Pago' },
      PEDIDO_FINALIZADO: { color: 'success', text: 'Finalizado' },
      CANCELADO: { color: 'error', text: 'Cancelado' },
    };
    return configs[status] || { color: 'default', text: status };
  };

  // Função para renderizar frutas
  const renderFrutas = (frutasPedidos) => {
    if (!frutasPedidos || frutasPedidos.length === 0) {
      return <Text type="secondary">-</Text>;
    }

    if (frutasPedidos.length === 1) {
      return (
        <Tag color="green" style={{ margin: 0, fontSize: "11px" }}>
          {frutasPedidos[0].fruta?.nome || '-'}
        </Tag>
      );
    }

    return (
      <Tag color="blue" style={{ margin: 0, fontSize: "11px" }}>
        {frutasPedidos.length} frutas
      </Tag>
    );
  };

  // Função para obter o pagamento mais recente
  const getUltimoPagamento = (pagamentosPedidos) => {
    if (!pagamentosPedidos || pagamentosPedidos.length === 0) {
      return null;
    }
    
    // Ordena por data de pagamento (mais recente primeiro)
    const pagamentosOrdenados = [...pagamentosPedidos].sort((a, b) => 
      new Date(b.dataPagamento) - new Date(a.dataPagamento)
    );
    
    return pagamentosOrdenados[0];
  };

  const EmptyState = () => (
    <Empty
      image={<CheckCircleOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
      imageStyle={{
        height: 48,
        color: "#d9d9d9",
        fontSize: "48px",
      }}
      description={
        <Text type="secondary" style={{ fontSize: "14px" }}>
          Nenhum pedido finalizado
        </Text>
      }
    />
  );

  return (
    <div style={sectionStyle}>
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #52c41a",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          maxHeight: "500px", // Altura máxima para consistência
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{ 
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header da seção */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ marginRight: "12px" }}>
              <CheckCircleOutlined style={{ fontSize: "24px" }} />
            </div>
            <div>
              <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                Pedidos Finalizados
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
                Pedidos concluídos e cancelados
              </Text>
            </div>
          </div>
          <Badge
            count={pedidos.length}
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              color: "#52c41a",
              fontWeight: "600",
            }}
          />
        </div>

        {/* Conteúdo da seção */}
        <div 
          className="status-section-scroll"
          style={{
            ...contentStyle,
            flex: 1,
            minHeight: 0, // Permite que o flex funcione corretamente
          }}
        >
          {pedidos.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "0px",
              width: "100%",
              paddingRight: "4px" // Espaço para o scroll
            }}>
              {/* Card de cabeçalho com labels das colunas */}
              <div className="pedido-card-content cabecalho-dashboard" style={{
                padding: "0px 12px",
                backgroundColor: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: "4px",
                marginBottom: "4px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#333",
                display: "flex",
                alignItems: "center"
              }}>
                <div className="pedido-info-container">
                  <div className="pedido-info-item pedido-numero" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Nº Pedido</strong>
                  </div>
                  <div className="pedido-info-item pedido-cliente" style={{ flex: "1.5 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Cliente</strong>
                  </div>
                  <div className="pedido-frutas" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Frutas</strong>
                  </div>
                  <div className="pedido-info-item pedido-data" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Data Pedido</strong>
                  </div>
                  <div className="pedido-info-item pedido-data-colheita" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Data Colheita</strong>
                  </div>
                  <div className="pedido-info-item pedido-valor" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Valor Final</strong>
                  </div>
                  <div className="pedido-info-item pedido-valor-recebido" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Valor Recebido</strong>
                  </div>
                  <div className="pedido-info-item pedido-data-pagamento" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Último Pagamento</strong>
                  </div>
                  <div className="pedido-info-item pedido-status" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Status</strong>
                  </div>
                </div>
                <div className="pedido-action-button" style={{ flex: "0 0 60px", textAlign: "left" }}>
                  <strong>Ação</strong>
                </div>
              </div>

              {/* Cards dos pedidos */}
              {pedidos.map((pedido) => (
                <Card
                  key={pedido.id}
                  style={{
                    borderRadius: "6px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #f0f0f0",
                    marginBottom: "4px",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                  }}
                  bodyStyle={{ padding: "8px 12px" }}
                  hoverable
                  className="pedido-card-container"
                  onClick={() => onAction(pedido)}
                >
                  <div className="pedido-card-content">
                    <div className="pedido-info-container">
                      {/* Número do pedido */}
                      <div className="pedido-info-item pedido-numero" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                          {pedido.numeroPedido}
                        </Text>
                      </div>

                      {/* Cliente */}
                      <div className="pedido-info-item pedido-cliente" style={{ flex: "1.5 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <UserOutlined style={{ color: "#666", fontSize: "12px" }} />
                        <Text className="text-ellipsis" style={{ fontSize: "12px" }} title={pedido.cliente?.nome}>
                          {pedido.cliente?.nome || "N/A"}
                        </Text>
                      </div>

                      {/* Frutas */}
                      <div className="pedido-frutas" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        {renderFrutas(pedido.frutasPedidos)}
                      </div>

                      {/* Data Pedido */}
                      <div className="pedido-info-item pedido-data" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <CalendarOutlined style={{ color: "#666", fontSize: "12px" }} />
                        <Text style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>
                          {pedido.dataPedido ? moment(pedido.dataPedido).format("DD/MM/YY") : "S/data"}
                        </Text>
                      </div>

                      {/* Data Colheita */}
                      <div className="pedido-info-item pedido-data-colheita" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <CalendarOutlined style={{ color: "#666", fontSize: "12px" }} />
                        <Text style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>
                          {pedido.dataColheita ? moment(pedido.dataColheita).format("DD/MM/YY") : "S/data"}
                        </Text>
                      </div>

                      {/* Valor Final */}
                      <div className="pedido-info-item pedido-valor" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <Text
                          strong
                          style={{
                            color: pedido.valorFinal ? "#059669" : "#999",
                            fontSize: "12px"
                          }}
                        >
                          {pedido.valorFinal ? formatarValorMonetario(pedido.valorFinal) : "-"}
                        </Text>
                      </div>

                      {/* Valor Recebido */}
                      <div className="pedido-info-item pedido-valor-recebido" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <Text
                          strong
                          style={{
                            color: pedido.valorRecebido ? "#52c41a" : "#999",
                            fontSize: "12px"
                          }}
                        >
                          {pedido.valorRecebido ? formatarValorMonetario(pedido.valorRecebido) : "-"}
                        </Text>
                      </div>

                      {/* Último Pagamento */}
                      <div className="pedido-info-item pedido-data-pagamento" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <CalendarOutlined style={{ color: "#666", fontSize: "12px" }} />
                        <Text style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>
                          {(() => {
                            const ultimoPagamento = getUltimoPagamento(pedido.pagamentosPedidos);
                            return ultimoPagamento ? moment(ultimoPagamento.dataPagamento).format("DD/MM/YY") : "S/pagamento";
                          })()}
                        </Text>
                      </div>

                      {/* Status */}
                      <div className="pedido-info-item pedido-status" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left", justifyContent: "flex-start" }}>
                        <Tag 
                          color={getStatusConfig(pedido.status).color} 
                          style={{ 
                            margin: 0,
                            fontSize: "10px"
                          }}
                        >
                          {getStatusConfig(pedido.status).text}
                        </Tag>
                      </div>
                    </div>

                    {/* Botão de ação */}
                    <div className="pedido-action-button" style={{ flex: "0 0 60px", textAlign: "left", justifyContent: "flex-start" }}>
                      <Tooltip title="Visualizar detalhes">
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          size="small"
                          style={{
                            backgroundColor: "#1890ff",
                            borderColor: "#1890ff",
                            minWidth: "32px",
                            height: "28px"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction(pedido);
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Paginação */}
        {paginacao.total > 0 && (
          <div style={{ 
            padding: "16px 24px", 
            borderTop: "1px solid #f0f0f0",
            display: "flex", 
            justifyContent: "flex-end" 
          }}>
            <Pagination
              current={paginacao.page}
              pageSize={paginacao.limit}
              total={paginacao.total}
              onChange={(page, size) => {
                if (onPaginacaoChange) {
                  onPaginacaoChange(page, size);
                }
              }}
              onShowSizeChange={(current, size) => {
                if (onPaginacaoChange) {
                  onPaginacaoChange(1, size);
                }
              }}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `${range[0]}-${range[1]} de ${total} pedidos finalizados`
              }
              pageSizeOptions={['10', '20', '50', '100']}
              style={{ margin: 0 }}
              size="small"
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default FinalizadosSection;