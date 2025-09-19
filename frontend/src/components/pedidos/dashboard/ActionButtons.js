// src/components/pedidos/dashboard/ActionButtons.js

import React from "react";
import { Row, Col, Button, Card } from "antd";
import {
  PlusCircleOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";

const ActionButtons = ({ 
  onNovoPedido, 
  onLancarPagamento,
  loading = false 
}) => {
  const buttonStyle = {
    height: "48px",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  };

  const cardStyle = {
    borderRadius: "8px",
    border: "1px solid #d9d9d9",
    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
    marginBottom: "24px"
  };

  return (
    <Card 
      style={cardStyle} 
      styles={{ body: { padding: "16px" } }}
      title={
        <span style={{ color: "#059669", fontWeight: "600", fontSize: "16px" }}>
          Ações Rápidas
        </span>
      }
    >
      <Row gutter={[16, 16]}>
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