// src/components/pedidos/dashboard/ActionButtons.js

import React from "react";
import { Row, Col, Button, Card } from "antd";
import {
  PlusCircleOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import useResponsive from "../../../hooks/useResponsive";

const ActionButtons = ({
  onNovoPedido,
  onLancarPagamento,
  loading = false
}) => {
  const { isMobile, isTablet } = useResponsive();

  const buttonStyle = {
    height: isMobile ? "2.625rem" : (isTablet ? "2.75rem" : "3rem"),
    fontSize: isMobile ? "0.8125rem" : (isTablet ? "0.84375rem" : "0.875rem"),
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? "0.375rem" : (isTablet ? "0.4375rem" : "0.5rem")
  };

  const cardStyle = {
    borderRadius: "0.5rem",
    border: "1px solid #d9d9d9",
    boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.06)",
    marginBottom: isMobile ? "1rem" : (isTablet ? "1.25rem" : "1.5rem")
  };

  return (
    <Card
      style={cardStyle}
      styles={{ body: { padding: isMobile ? "12px" : (isTablet ? "14px" : "16px") } }}
      title={
        <span style={{
          color: "#059669",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : (isTablet ? "0.9375rem" : "1rem")
        }}>
          Ações Rápidas
        </span>
      }
    >
      <Row gutter={isMobile ? [12, 12] : (isTablet ? [14, 14] : [16, 16])}>
        {/* Novo Pedido */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={onNovoPedido}
            style={{
              ...buttonStyle,
              backgroundColor: "#059669",
              borderColor: "#059669",
              width: "100%"
            }}
          >
            Novo Pedido
          </Button>
        </Col>

        {/* Lançar Pagamento */}
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Button
            type="primary"
            icon={<CreditCardOutlined />}
            onClick={onLancarPagamento}
            style={{
              ...buttonStyle,
              backgroundColor: "#1890ff",
              borderColor: "#1890ff",
              width: "100%"
            }}
          >
            Lançar Pagamento
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default ActionButtons;