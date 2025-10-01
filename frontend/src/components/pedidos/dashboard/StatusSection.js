// src/components/pedidos/dashboard/StatusSection.js

import React from "react";
import { Card, Typography, Row, Col, Empty, Badge, Progress } from "antd";
import {
  ClockCircleOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PedidoCard from "./PedidoCard";
import useResponsive from "../../../hooks/useResponsive";

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
  emptyText = "Nenhum pedido encontrado",
  showProgress = false, // Nova prop para controlar o progress circular
  mobileTitle // Título compacto para mobile
}) => {
  const { isMobile } = useResponsive();

  const sectionStyle = {
    height: "100%", // Para ocupar toda a altura do container pai
    display: "flex",
    flexDirection: "column", // ✅ Layout flexível
  };

  const headerStyle = {
    backgroundColor: color,
    color: "#ffffff",
    padding: isMobile ? "0.75rem 1rem" : "1rem 1.5rem",
    margin: "-1px -1px 0 -1px",
    borderRadius: "0.5rem 0.5rem 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0, // ✅ Não encolhe
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: isMobile ? "0.5rem" : "0",
  };

  const contentStyle = {
    padding: isMobile ? "0.75rem" : "1rem",
    maxHeight: isMobile ? "21.875rem" : "26.875rem", // ✅ Altura máxima fixa
    overflowY: "auto", // ✅ Scroll vertical apenas aqui
    overflowX: "hidden",
    flex: 1, // ✅ Ocupa espaço disponível
  };

  const EmptyState = () => (
    <Empty
      image={icon}
      imageStyle={{
        height: "3rem",
        color: "#d9d9d9",
        fontSize: "3rem",
      }}
      description={
        <Text type="secondary" style={{ fontSize: "0.875rem" }}>
          {emptyText}
        </Text>
      }
    />
  );

  return (
    <div style={sectionStyle}>
      <Card
        style={{
          borderRadius: "0.5rem",
          border: `1px solid ${color}`,
          boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
          height: "32.5rem", // ✅ Altura fixa (será sobrescrita em mobile pelo CSS)
          display: "flex",
          flexDirection: "column",
        }}
        styles={{
          body: {
            padding: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column"
          }
        }}
      >
        {/* Header da seção */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ marginRight: isMobile ? "0.5rem" : "0.75rem" }}>
              {React.cloneElement(icon, { style: { fontSize: isMobile ? "1.25rem" : "1.5rem" } })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title level={isMobile ? 5 : 4} style={{ color: "#ffffff", margin: 0, fontSize: isMobile ? "0.875rem" : undefined }}>
                {isMobile && mobileTitle ? mobileTitle : title}
              </Title>
              {!isMobile && description && (
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8125rem" }}>
                  {description}
                </Text>
              )}
            </div>
          </div>
          {showProgress ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <Progress
                type="circle"
                percent={75}
                size={isMobile ? 28 : 32}
                strokeColor="#ffffff"
                trailColor="rgba(255,255,255,0.1)"
                showInfo={false}
                strokeWidth={6}
                style={{
                  position: "absolute",
                  top: "-15%",
                  left: "-30%",
                  transform: "translate(-50%, -50%)",
                  animation: "spin 1s linear infinite",
                  filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))"
                }}
              />
              <Badge
                count={pedidos.length}
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  color: color,
                  fontWeight: "600",
                  position: "relative",
                  zIndex: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  fontSize: isMobile ? "10px" : undefined,
                }}
              />
            </div>
          ) : (
            <Badge
              count={pedidos.length}
              style={{
                backgroundColor: "rgba(255,255,255,0.9)",
                color: color,
                fontWeight: "600",
                fontSize: isMobile ? "10px" : undefined,
              }}
            />
          )}
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
export const AguardandoColheitaSection = ({ pedidos, onAction, onVisualizar, showProgress = false }) => (
  <StatusSection
    title="Aguardando Colheita"
    mobileTitle="Colheita"
    description="Pedidos criados e aguardando colheita"
    pedidos={pedidos}
    actionType="colheita"
    onAction={onAction}
    onVisualizar={onVisualizar}
    icon={<ShoppingOutlined style={{ fontSize: "24px" }} />}
    color="#1890ff"
    emptyText="Nenhum pedido aguardando colheita"
    showProgress={showProgress}
  />
);

export const AguardandoPrecificacaoSection = ({ pedidos, onAction, onVisualizar, showProgress = false }) => (
  <StatusSection
    title="Aguardando Precificação"
    mobileTitle="Precificação"
    description="Colheitas realizadas aguardando precificação"
    pedidos={pedidos}
    actionType="precificacao"
    onAction={onAction}
    onVisualizar={onVisualizar}
    icon={<DollarOutlined style={{ fontSize: "24px" }} />}
    color="#722ed1"
    emptyText="Nenhum pedido aguardando precificação"
    showProgress={showProgress}
  />
);

export const AguardandoPagamentoSection = ({ pedidos, onAction, onVisualizar, showProgress = false }) => (
  <StatusSection
    title="Aguardando Pagamento"
    mobileTitle="Pagamento"
    description="Pedidos precificados aguardando pagamento"
    pedidos={pedidos}
    actionType="pagamento"
    onAction={onAction}
    onVisualizar={onVisualizar}
    icon={<CreditCardOutlined style={{ fontSize: "24px" }} />}
    color="#faad14"
    emptyText="Nenhum pedido aguardando pagamento"
    showProgress={showProgress}
  />
);

export default StatusSection;