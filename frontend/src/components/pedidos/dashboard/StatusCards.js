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

const { Text } = Typography;

const StatusCards = ({ stats = {} }) => {
  const {
    totalPedidos = 0,
    valorTotalAberto = 0,
    pedidosAtivos = 0,
    pedidosFinalizados = 0,
    valorRecebido = 0,
    pedidosVencidos = 0,
  } = stats;

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  };

  const statisticStyle = {
    ".ant-statistic-content": {
      fontSize: "24px",
      fontWeight: "600",
    },
  };

  return (
    <div className="status-cards-row">
      {/* Total de Pedidos */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Total de Pedidos
              </Text>
            }
            value={totalPedidos}
            prefix={<ShoppingOutlined style={{ color: "#059669", fontSize: "16px" }} />}
            valueStyle={{ color: "#059669", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Pedidos Ativos */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Pedidos Ativos
              </Text>
            }
            value={pedidosAtivos}
            prefix={<ClockCircleOutlined style={{ color: "#1890ff", fontSize: "16px" }} />}
            valueStyle={{ color: "#1890ff", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Pedidos Finalizados */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Pedidos Finalizados
              </Text>
            }
            value={pedidosFinalizados}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "16px" }} />}
            valueStyle={{ color: "#52c41a", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Valor Total em Aberto */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Aguardando Pagamento
              </Text>
            }
            value={formatarValorMonetario(valorTotalAberto)}
            prefix={<DollarOutlined style={{ color: "#faad14", fontSize: "16px" }} />}
            valueStyle={{ color: "#faad14", fontSize: "16px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Valor Recebido */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Valor Recebido
              </Text>
            }
            value={formatarValorMonetario(valorRecebido)}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "16px" }} />}
            valueStyle={{ color: "#52c41a", fontSize: "16px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Pedidos Vencidos */}
      <div className="status-cards-col">
        <Card 
          style={{
            ...cardStyle,
            ...(pedidosVencidos > 0 && {
              borderColor: "#ff4d4f",
              boxShadow: "0 2px 8px rgba(255, 77, 79, 0.15)"
            })
          }} 
          styles={{ body: { padding: "12px" } }}
        >
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Pedidos Vencidos
              </Text>
            }
            value={pedidosVencidos}
            prefix={
              <WarningOutlined 
                style={{ 
                  color: pedidosVencidos > 0 ? "#ff4d4f" : "#d9d9d9",
                  fontSize: "16px"
                }} 
              />
            }
            valueStyle={{ 
              color: pedidosVencidos > 0 ? "#ff4d4f" : "#d9d9d9", 
              fontSize: "18px", 
              fontWeight: "600" 
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default StatusCards;