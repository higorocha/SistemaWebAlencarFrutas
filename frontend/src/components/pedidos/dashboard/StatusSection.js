// src/components/pedidos/dashboard/StatusSection.js

import React from "react";
import { Card, Typography, Row, Col, Empty, Badge } from "antd";
import {
  ClockCircleOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PedidoCard from "./PedidoCard";

const { Title, Text } = Typography;

const StatusSection = ({ 
  title, 
  pedidos = [], 
  actionType, 
  onAction, 
  onVisualizar,
  icon, 
  color = "#059669",
  description,
  emptyText = "Nenhum pedido encontrado"
}) => {
  const sectionStyle = {
    height: "100%", // Para ocupar toda a altura do container pai
  };

  const headerStyle = {
    backgroundColor: color,
    color: "#ffffff",
    padding: "16px 24px",
    margin: "-1px -1px 0 -1px",
    borderRadius: "8px 8px 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const contentStyle = {
    padding: "16px",
    maxHeight: "400px", // Altura máxima
    overflowY: "auto", // Scroll vertical
    overflowX: "hidden",
    flex: 1, // Ocupar espaço disponível
  };

  const EmptyState = () => (
    <Empty
      image={icon}
      imageStyle={{
        height: 48,
        color: "#d9d9d9",
        fontSize: "48px",
      }}
      description={
        <Text type="secondary" style={{ fontSize: "14px" }}>
          {emptyText}
        </Text>
      }
    />
  );

  return (
    <div style={sectionStyle}>
      <Card
        style={{
          borderRadius: "8px",
          border: `1px solid ${color}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          height: "500px", // Altura fixa para garantir limite
          maxHeight: "500px", // Altura máxima
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
              {icon}
            </div>
            <div>
              <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                {title}
              </Title>
              {description && (
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
                  {description}
                </Text>
              )}
            </div>
          </div>
          <Badge
            count={pedidos.length}
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              color: color,
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
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%"
            }}>
              <EmptyState />
            </div>
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
                  <div className="pedido-info-item pedido-cliente" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Cliente</strong>
                  </div>
                  <div className="pedido-frutas" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Frutas</strong>
                  </div>
                  <div className="pedido-info-item pedido-data" style={{ flex: "1 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>
                      {actionType === "colheita" && "Prev. Colheita"}
                      {actionType === "precificacao" && "Data Colheita"}
                      {actionType === "pagamento" && "Data Colheita"}
                    </strong>
                  </div>
                </div>
                <div className="pedido-action-button" style={{ flex: "0 0 60px", textAlign: "left" }}>
                  <strong>Ação</strong>
                </div>
              </div>

              {pedidos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  actionType={actionType}
                  onAction={onAction}
                  onVisualizar={onVisualizar}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Componentes pré-configurados para cada seção
export const AguardandoColheitaSection = ({ pedidos, onAction, onVisualizar }) => (
  <StatusSection
    title="Aguardando Colheita"
    description="Pedidos criados e aguardando colheita"
    pedidos={pedidos}
    actionType="colheita"
    onAction={onAction}
    onVisualizar={onVisualizar}
    icon={<ShoppingOutlined style={{ fontSize: "24px" }} />}
    color="#1890ff"
    emptyText="Nenhum pedido aguardando colheita"
  />
);

export const AguardandoPrecificacaoSection = ({ pedidos, onAction, onVisualizar }) => (
  <StatusSection
    title="Aguardando Precificação"
    description="Colheitas realizadas aguardando precificação"
    pedidos={pedidos}
    actionType="precificacao"
    onAction={onAction}
    onVisualizar={onVisualizar}
    icon={<DollarOutlined style={{ fontSize: "24px" }} />}
    color="#722ed1"
    emptyText="Nenhum pedido aguardando precificação"
  />
);

export const AguardandoPagamentoSection = ({ pedidos, onAction, onVisualizar }) => (
  <StatusSection
    title="Aguardando Pagamento"
    description="Pedidos precificados aguardando pagamento"
    pedidos={pedidos}
    actionType="pagamento"
    onAction={onAction}
    onVisualizar={onVisualizar}
    icon={<CreditCardOutlined style={{ fontSize: "24px" }} />}
    color="#faad14"
    emptyText="Nenhum pedido aguardando pagamento"
  />
);

export default StatusSection;