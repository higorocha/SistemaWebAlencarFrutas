// src/components/producao/StatusCardsBanana.js

import React from "react";
import { Row, Col, Card, Statistic, Typography } from "antd";
import {
  FileTextOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { intFormatter, numberFormatter } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";

const { Text } = Typography;

const StatusCardsBanana = ({ stats = {} }) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const {
    totalControles = 0,
    totalFitas = 0,
    totalAreas = 0,
    mediaFitasPorArea = 0,
  } = stats;

  const cardStyle = {
    borderRadius: "0.75rem", // 12px → rem
    boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)", // 2px 8px → rem
    border: "0.0625rem solid #f0f0f0", // 1px → rem
  };

  const titleStyle = {
    color: "#666",
    fontSize: isMobile ? "0.6875rem" : "0.6875rem", // 11px
  };

  const iconStyle = {
    fontSize: isMobile ? "1rem" : "1rem", // 16px
  };

  const valueStyle = {
    fontSize: isMobile ? "1.125rem" : "1.125rem", // 18px
    fontWeight: "600",
  };

  return (
    <Row
      gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}
      style={{ marginBottom: isMobile ? "12px" : "16px" }}
    >
      {/* Total de Registros */}
      <Col xs={12} sm={12} md={6}>
        <Card style={cardStyle} styles={{ body: { padding: isMobile ? "8px" : "12px" } }}>
          <Statistic
            title={<Text style={titleStyle}>Total de Registros</Text>}
            value={intFormatter(totalControles)}
            prefix={<FileTextOutlined style={{ ...iconStyle, color: "#059669" }} />}
            valueStyle={{ ...valueStyle, color: "#059669" }}
          />
        </Card>
      </Col>

      {/* Total de Fitas */}
      <Col xs={12} sm={12} md={6}>
        <Card style={cardStyle} styles={{ body: { padding: isMobile ? "8px" : "12px" } }}>
          <Statistic
            title={<Text style={titleStyle}>Total de Fitas</Text>}
            value={intFormatter(totalFitas)}
            prefix={<BarChartOutlined style={{ ...iconStyle, color: "#1890ff" }} />}
            valueStyle={{ ...valueStyle, color: "#1890ff" }}
          />
        </Card>
      </Col>

      {/* Áreas com Registros */}
      <Col xs={12} sm={12} md={6}>
        <Card style={cardStyle} styles={{ body: { padding: isMobile ? "8px" : "12px" } }}>
          <Statistic
            title={<Text style={titleStyle}>Áreas c/ Registros</Text>}
            value={intFormatter(totalAreas)}
            prefix={<EnvironmentOutlined style={{ ...iconStyle, color: "#52c41a" }} />}
            valueStyle={{ ...valueStyle, color: "#52c41a" }}
          />
        </Card>
      </Col>

      {/* Média por Área */}
      <Col xs={12} sm={12} md={6}>
        <Card style={cardStyle} styles={{ body: { padding: isMobile ? "8px" : "12px" } }}>
          <Statistic
            title={<Text style={titleStyle}>Média por Área</Text>}
            value={numberFormatter(mediaFitasPorArea)}
            prefix={<CalculatorOutlined style={{ ...iconStyle, color: "#faad14" }} />}
            valueStyle={{ ...valueStyle, color: "#faad14" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatusCardsBanana;
