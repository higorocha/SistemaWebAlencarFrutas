// src/components/producao/StatusCardsBanana.js

import React from "react";
import { Row, Col, Card, Statistic, Typography } from "antd";
import {
  FileTextOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { intFormatter } from "../../utils/formatters";

const { Text } = Typography;

const StatusCardsBanana = ({ stats = {} }) => {
  const {
    totalControles = 0,
    totalFitas = 0,
    totalAreas = 0,
    mediaFitasPorArea = 0,
  } = stats;

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  };

  return (
    <div className="status-cards-row">
      {/* Total de Registros */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Total de Registros
              </Text>
            }
            value={intFormatter(totalControles)}
            prefix={<FileTextOutlined style={{ color: "#059669", fontSize: "16px" }} />}
            valueStyle={{ color: "#059669", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Total de Fitas */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Total de Fitas
              </Text>
            }
            value={intFormatter(totalFitas)}
            prefix={<BarChartOutlined style={{ color: "#1890ff", fontSize: "16px" }} />}
            valueStyle={{ color: "#1890ff", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Áreas com Registros */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Áreas com Registros
              </Text>
            }
            value={intFormatter(totalAreas)}
            prefix={<EnvironmentOutlined style={{ color: "#52c41a", fontSize: "16px" }} />}
            valueStyle={{ color: "#52c41a", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>

      {/* Média por Área */}
      <div className="status-cards-col">
        <Card style={cardStyle} styles={{ body: { padding: "12px" } }}>
          <Statistic
            title={
              <Text style={{ color: "#666", fontSize: "11px" }}>
                Média por Área
              </Text>
            }
            value={mediaFitasPorArea}
            precision={1}
            prefix={<CalculatorOutlined style={{ color: "#faad14", fontSize: "16px" }} />}
            valueStyle={{ color: "#faad14", fontSize: "18px", fontWeight: "600" }}
          />
        </Card>
      </div>
    </div>
  );
};

export default StatusCardsBanana;
