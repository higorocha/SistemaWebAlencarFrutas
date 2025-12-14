// src/components/turma-colheita/EstatisticasGeraisColheitas.js

import React, { useState } from "react";
import { Card, Statistic, Row, Col, Typography, Divider, Empty, Avatar, Spin } from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  RightOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { formatCurrency, capitalizeName } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import { Box } from "@mui/material";
import { getCulturaIconPath } from "../../utils/fruitIcons";

const { Title, Text } = Typography;

// Componente auxiliar para Avatar com tratamento de erro seguro
const SafeAvatar = ({ src, size, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  
  const handleError = () => {
    setImgSrc('/icons/frutas_64x64.png');
  };

  return (
    <Avatar 
      src={imgSrc} 
      size={size}
      onError={handleError}
      shape="square"
      {...props}
    />
  );
};

const EstatisticasGeraisColheitas = ({ dados, loading = false, onCulturaClick, turmaSelecionada = false }) => {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          minHeight: "200px",
        }}
      >
        <Spin size="large" style={{ color: "#059669" }} />
        <Text type="secondary" style={{ marginTop: 16, fontSize: "14px" }}>
          Carregando estatísticas...
        </Text>
      </Box>
    );
  }

  if (!dados) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          minHeight: "200px",
        }}
      >
        <Text type="secondary">Nenhum dado disponível</Text>
      </Box>
    );
  }


  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      {/* Cards de Estatísticas */}
      {turmaSelecionada ? (
        // Quando turma está selecionada: 6 cards em uma única linha
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Total de Colheitas"
                value={dados.totalColheitas || 0}
                prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Pgts. Efetuados"
                value={dados.pagamentos?.efetuados || 0}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Valor Pago"
                value={dados.pagamentos?.valorPago || 0}
                prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Valor Total"
                value={dados.totalValor || 0}
                prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Pgts. Pendentes"
                value={dados.pagamentos?.pendentes || 0}
                prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Valor Pendente"
                value={dados.pagamentos?.valorPendente || 0}
                prefix={<DollarOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14" }}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        // Quando não há turma selecionada: layout original com 2 linhas
        <>
          {/* Cards de Estatísticas - Primeira Linha */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total de Turmas"
                  value={dados.totalTurmas || 0}
                  prefix={<UserOutlined style={{ color: "#059669" }} />}
                  valueStyle={{ color: "#059669" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total de Colheitas"
                  value={dados.totalColheitas || 0}
                  prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pagamentos Efetuados"
                  value={dados.pagamentos?.efetuados || 0}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Valor Pago"
                  value={dados.pagamentos?.valorPago || 0}
                  prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a" }}
                  formatter={(value) => `R$ ${formatCurrency(value)}`}
                />
              </Card>
            </Col>
          </Row>

          {/* Cards de Estatísticas - Segunda Linha */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Quantidade Total"
                  value={Math.round(dados.totalQuantidade || 0)}
                  prefix={<BarChartOutlined style={{ color: "#722ed1" }} />}
                  valueStyle={{ color: "#722ed1" }}
                  formatter={(value) => value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Valor Total"
                  value={dados.totalValor || 0}
                  prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a" }}
                  formatter={(value) => `R$ ${formatCurrency(value)}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pagamentos Pendentes"
                  value={dados.pagamentos?.pendentes || 0}
                  prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Valor Pendente"
                  value={dados.pagamentos?.valorPendente || 0}
                  prefix={<DollarOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14" }}
                  formatter={(value) => `R$ ${formatCurrency(value)}`}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Cards de Colheitas por Cultura */}
      {dados.colheitasPorCultura && dados.colheitasPorCultura.length > 0 && (
        <Card>
          <Title level={5} style={{ marginBottom: 16, color: "#059669" }}>
            Colheitas por Cultura
          </Title>
          <Divider style={{ margin: "0 0 16px 0" }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {dados.colheitasPorCultura.map((cultura) => (
              <Card
                key={cultura.culturaId}
                hoverable
                onClick={() => {
                  if (onCulturaClick && cultura.culturaId) {
                    onCulturaClick(cultura.culturaId);
                  }
                }}
                style={{
                  cursor: onCulturaClick ? "pointer" : "default",
                  border: "1px solid #e8e8e8",
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  width: "100%",
                }}
                bodyStyle={{
                  padding: "16px",
                }}
                onMouseEnter={(e) => {
                  if (onCulturaClick) {
                    e.currentTarget.style.borderColor = "#059669";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(5, 150, 105, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (onCulturaClick) {
                    e.currentTarget.style.borderColor = "#e8e8e8";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMobile 
                      ? "1fr" 
                      : "2fr 1fr 1.5fr 1fr",
                    gap: isMobile ? 2 : 3,
                    alignItems: "center",
                  }}
                >
                  {/* Nome da Cultura */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <SafeAvatar 
                      size={24} 
                      src={getCulturaIconPath(cultura.culturaDescricao || "")} 
                    />
                    <Text
                      strong
                      style={{
                        fontSize: "16px",
                        color: "#059669",
                        margin: 0,
                      }}
                    >
                      {capitalizeName(cultura.culturaDescricao || "")}
                    </Text>
                    {onCulturaClick && (
                      <RightOutlined
                        style={{
                          color: "#059669",
                          fontSize: "14px",
                        }}
                      />
                    )}
                  </Box>

                  {/* Quantidade */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMobile ? "flex-start" : "flex-end",
                      gap: 0.5,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Quantidade
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: "15px",
                        color: "#059669",
                      }}
                    >
                      {Math.round(cultura.totalQuantidade || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })} {cultura.unidadeMedida || 'UND'}
                    </Text>
                  </Box>

                  {/* Valor Total */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMobile ? "flex-start" : "flex-end",
                      gap: 0.5,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Valor Total
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: "15px",
                        color: "#059669",
                      }}
                    >
                      R$ {formatCurrency(cultura.totalValor || 0)}
                    </Text>
                  </Box>

                  {/* Colheitas */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMobile ? "flex-start" : "flex-end",
                      gap: 0.5,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Colheitas
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: "15px",
                        color: "#1890ff",
                      }}
                    >
                      {cultura.totalColheitas || 0}
                    </Text>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Card>
      )}
    </Box>
  );
};

EstatisticasGeraisColheitas.propTypes = {
  dados: PropTypes.shape({
    totalTurmas: PropTypes.number,
    totalColheitas: PropTypes.number,
    totalQuantidade: PropTypes.number,
    totalValor: PropTypes.number,
    colheitasPorCultura: PropTypes.arrayOf(
      PropTypes.shape({
        culturaId: PropTypes.number,
        culturaDescricao: PropTypes.string,
        totalQuantidade: PropTypes.number,
        totalValor: PropTypes.number,
        totalColheitas: PropTypes.number,
        unidadeMedida: PropTypes.string,
      })
    ),
    pagamentos: PropTypes.shape({
      efetuados: PropTypes.number,
      pendentes: PropTypes.number,
      valorPago: PropTypes.number,
      valorPendente: PropTypes.number,
    }),
  }),
  loading: PropTypes.bool,
  onCulturaClick: PropTypes.func,
  turmaSelecionada: PropTypes.bool,
};

export default EstatisticasGeraisColheitas;

