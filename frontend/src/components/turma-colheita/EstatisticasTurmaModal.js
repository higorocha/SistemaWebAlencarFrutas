// src/components/turma-colheita/EstatisticasTurmaModal.js

import React, { useState, useEffect } from "react";
import { Modal, Card, Row, Col, Statistic, Table, Tag, Space, Typography, Spin, Divider, Button, Tooltip } from "antd";
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  AppleOutlined, 
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FilterOutlined,
  CalculatorOutlined,
  MessageOutlined
} from "@ant-design/icons";
import PropTypes from "prop-types";
import styled from "styled-components";
import Chart from "react-apexcharts";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency } from "../../utils/formatters";
import MiniSelectPersonalizavel from "../common/MiniComponents/MiniSelectPersonalizavel";

const { Title, Text } = Typography;

// Styled components para tabela com tema personalizado
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: 16px;
    font-size: 14px;
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
    cursor: pointer;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background-color: #d1fae5 !important;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    font-size: 14px;
  }

  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .ant-table-cell-fix-left,
  .ant-table-cell-fix-right {
    background-color: inherit !important;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }

  /* CORREÇÃO ESPECÍFICA: Esconder linha de medida */
  .ant-table-measure-row {
    display: none !important;
  }
`;

const EstatisticasTurmaModal = ({ 
  open, 
  onClose, 
  turmaId, 
  turmaNome 
}) => {
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState(null);
  const [intervaloMeses, setIntervaloMeses] = useState(6);
  const [dadosGrafico, setDadosGrafico] = useState(null);

  useEffect(() => {
    if (open && turmaId) {
      fetchEstatisticas();
    }
  }, [open, turmaId]);

  useEffect(() => {
    if (estatisticas && estatisticas.detalhes) {
      processarDadosGrafico();
    }
  }, [estatisticas, intervaloMeses]);

  const fetchEstatisticas = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/turma-colheita/${turmaId}/estatisticas`);
      setEstatisticas(response.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      showNotification("error", "Erro", "Erro ao carregar estatísticas da turma");
    } finally {
      setLoading(false);
    }
  };

  const processarDadosGrafico = () => {
    if (!estatisticas?.detalhes) return;

    const dataAtual = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataAtual.getMonth() - intervaloMeses);

    // Filtrar dados do período selecionado
    const dadosFiltrados = estatisticas.detalhes.filter(item => {
      const dataColheita = new Date(item.dataColheita);
      return dataColheita >= dataInicio && dataColheita <= dataAtual;
    });

    // Agrupar por mês
    const dadosPorMes = {};
    dadosFiltrados.forEach(item => {
      const data = new Date(item.dataColheita);
      const chaveMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dadosPorMes[chaveMes]) {
        dadosPorMes[chaveMes] = {
          quantidade: 0,
          valor: 0,
          valorPago: 0,
          pedidos: new Set(),
        };
      }
      
      dadosPorMes[chaveMes].quantidade += item.quantidade;
      dadosPorMes[chaveMes].valor += item.valor || 0;
      dadosPorMes[chaveMes].valorPago += item.valorPago || 0;
      dadosPorMes[chaveMes].pedidos.add(item.pedido);
    });

    // Converter para arrays ordenados
    const meses = Object.keys(dadosPorMes).sort();
    const quantidades = meses.map(mes => dadosPorMes[mes].quantidade);
    const valores = meses.map(mes => dadosPorMes[mes].valor);
    const valoresPagos = meses.map(mes => dadosPorMes[mes].valorPago);
    const pedidos = meses.map(mes => dadosPorMes[mes].pedidos.size);

    // Formatar labels dos meses
    const labelsMeses = meses.map(mes => {
      const [ano, mesNum] = mes.split('-');
      const data = new Date(ano, mesNum - 1);
      return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    setDadosGrafico({
      meses: labelsMeses,
      quantidades,
      valores,
      valoresPagos,
      pedidos,
    });
  };

  const columns = [
    {
      title: "Pedido",
      dataIndex: "pedido",
      key: "pedido",
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "Data",
      dataIndex: "dataColheita",
      key: "dataColheita",
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: "#059669" }} />
          <Text>{new Date(date).toLocaleDateString('pt-BR')}</Text>
        </Space>
      ),
    },
    {
      title: "Fruta",
      dataIndex: "fruta",
      key: "fruta",
      render: (text) => (
        <Space>
          <AppleOutlined style={{ color: "#059669" }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Quantidade",
      dataIndex: "quantidade",
      key: "quantidade",
      render: (value, record) => (
        <Text strong>
          {value.toLocaleString('pt-BR')} {record.unidade}
        </Text>
      ),
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      render: (value) => (
        <Text style={{ color: "#059669" }}>
          R$ {formatCurrency(value || 0)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "pagamentoEfetuado",
      key: "pagamentoEfetuado",
      render: (pago) => (
        <Tag 
          color={pago ? "green" : "orange"} 
          icon={pago ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {pago ? "Pago" : "Pendente"}
        </Tag>
      ),
    },
    {
      title: "Obs",
      key: "observacoes",
      width: 60,
      render: (_, record) => {
        if (!record.observacoes || record.observacoes.trim() === '') {
          return null;
        }
        
        return (
          <Tooltip 
            title={record.observacoes}
            placement="top"
            overlayStyle={{ maxWidth: 300 }}
          >
            <MessageOutlined 
              style={{ 
                color: "#059669", 
                fontSize: "16px",
                cursor: "pointer"
              }} 
            />
          </Tooltip>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Modal
        title={
          <span style={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "16px",
            backgroundColor: "#059669",
            padding: "12px 16px",
            margin: "-20px -24px 0 -24px",
            display: "block",
            borderRadius: "8px 8px 0 0",
          }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            Carregando estatísticas...
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Fechar
          </Button>
        ]}
        width={1000}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px",
          },
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            padding: 0,
          }
        }}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  if (!estatisticas) {
    return (
      <Modal
        title={
          <span style={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "16px",
            backgroundColor: "#059669",
            padding: "12px 16px",
            margin: "-20px -24px 0 -24px",
            display: "block",
            borderRadius: "8px 8px 0 0",
          }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            Estatísticas da Turma
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Fechar
          </Button>
        ]}
        width={1000}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px",
          },
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            padding: 0,
          }
        }}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Text type="secondary">Nenhuma estatística disponível</Text>
        </div>
      </Modal>
    );
  }

  const { totalGeral, totaisPorUnidade, detalhes } = estatisticas;

  // Configuração do gráfico
  const opcoesGrafico = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          pan: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          reset: true,
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    colors: ['#059669', '#1890ff', '#52c41a', '#fa8c16'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    markers: {
      size: 6,
      hover: {
        size: 8,
      }
    },
    xaxis: {
      categories: dadosGrafico?.meses || [],
      title: {
        text: 'Período',
        style: {
          color: '#666',
          fontSize: '14px',
          fontWeight: 600,
        }
      },
      labels: {
        style: {
          colors: '#666',
          fontSize: '12px',
        }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Quantidade (unidades)',
          style: {
            color: '#059669',
            fontSize: '14px',
            fontWeight: 600,
          }
        },
        labels: {
          style: {
            colors: '#059669',
            fontSize: '12px',
          },
          formatter: (value) => value.toLocaleString('pt-BR')
        }
      },
      {
        opposite: true,
        title: {
          text: 'Valor (R$)',
          style: {
            color: '#1890ff',
            fontSize: '14px',
            fontWeight: 600,
          }
        },
        labels: {
          style: {
            colors: '#1890ff',
            fontSize: '12px',
          },
          formatter: (value) => `R$ ${formatCurrency(value)}`
        }
      }
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontWeight: 600,
      markers: {
        width: 12,
        height: 12,
        radius: 6,
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value, { seriesIndex }) => {
          if (seriesIndex === 0) return `${value.toLocaleString('pt-BR')} unidades`;
          if (seriesIndex === 1) return `R$ ${formatCurrency(value)}`;
          if (seriesIndex === 2) return `R$ ${formatCurrency(value)}`;
          return value;
        }
      }
    },
    grid: {
      borderColor: '#f0f0f0',
      strokeDashArray: 4,
    }
  };

  const seriesGrafico = dadosGrafico ? [
    {
      name: 'Quantidade Colhida',
      type: 'line',
      data: dadosGrafico.quantidades,
    },
    {
      name: 'Valor Total',
      type: 'line',
      data: dadosGrafico.valores,
    },
    {
      name: 'Valor Pago',
      type: 'line',
      data: dadosGrafico.valoresPagos,
    }
  ] : [];

  return (
    <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          Estatísticas - {turmaNome}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>
      ]}
      width={1000}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px",
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        }
      }}
      centered
      destroyOnClose
    >
      {/* Seletor de Intervalo e Gráfico */}
      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Evolução Temporal</span>
          </Space>
        }
        style={{ 
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        headStyle={{
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          color: "#ffffff",
          borderRadius: "8px 8px 0 0",
        }}
        extra={
          <Space>
            <Text strong style={{ color: "#ffffff" }}>Período:</Text>
            <MiniSelectPersonalizavel
              value={intervaloMeses}
              onChange={setIntervaloMeses}
              options={[
                { value: 3, label: '3 meses' },
                { value: 6, label: '6 meses' },
                { value: 9, label: '9 meses' },
                { value: 12, label: '12 meses' },
              ]}
              placeholder="Selecione o período"
              height="32px"
              fontSize="12px"
              iconColor="#ffffff"
              iconSize="14px"
              customPadding="6px 8px 6px 28px"
              style={{ 
                width: "120px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
              icon={<FilterOutlined />}
            />
          </Space>
        }
      >
        {dadosGrafico && dadosGrafico.meses.length > 0 ? (
          <Chart
            options={opcoesGrafico}
            series={seriesGrafico}
            type="line"
            height={350}
          />
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "40px",
            color: "#8c8c8c"
          }}>
            <BarChartOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
            <Text type="secondary">
              Nenhum dado disponível para o período selecionado
            </Text>
          </div>
        )}
      </Card>

      {/* Cards de Resumo */}
      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo Geral</span>
          </Space>
        }
        style={{ 
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        headStyle={{
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          color: "#ffffff",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Total Colhido"
                value={totalGeral.quantidade}
                formatter={(value) => value.toLocaleString('pt-BR')}
                suffix="unidades"
                valueStyle={{ color: "#059669" }}
                prefix={<AppleOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Valor Total"
                value={totalGeral.valor}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
                valueStyle={{ color: "#059669" }}
                prefix={<DollarOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Valor Pago"
                value={totalGeral.valorPago}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
                valueStyle={{ color: totalGeral.valorPago > 0 ? "#52c41a" : "#d9d9d9" }}
                prefix={<CheckCircleOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Pedidos"
                value={totalGeral.totalPedidos}
                suffix={`• ${totalGeral.totalFrutas} fruta(s)`}
                valueStyle={{ color: "#1890ff" }}
                prefix={<ShoppingCartOutlined />}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Totais por Unidade */}
      {Object.keys(totaisPorUnidade).length > 0 && (
        <Card
          title={
            <Space>
              <CalculatorOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo por Unidade de Medida</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Row gutter={[16, 16]}>
            {Object.entries(totaisPorUnidade).map(([unidade, total]) => (
              <Col xs={24} sm={12} md={8} key={unidade}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Statistic
                    value={total.quantidade}
                    formatter={(value) => value.toLocaleString('pt-BR')}
                    suffix={unidade}
                    valueStyle={{ fontSize: "18px", color: "#059669", fontWeight: "600" }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      R$ {formatCurrency(total.valor)}
                    </Text>
                    {total.valorPago > 0 && (
                      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                        Pago: R$ {formatCurrency(total.valorPago)}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Tabela de Detalhes */}
      {detalhes && detalhes.length > 0 && (
        <Card
          title={
            <Space>
              <AppleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Detalhes das Colheitas</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <StyledTable
            columns={columns}
            dataSource={detalhes}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
            bordered={true}
            scroll={{ x: 600 }}
          />
        </Card>
      )}

      {(!detalhes || detalhes.length === 0) && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Text type="secondary">Nenhuma colheita registrada para esta turma</Text>
        </div>
      )}
    </Modal>
  );
};

EstatisticasTurmaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turmaId: PropTypes.number,
  turmaNome: PropTypes.string,
};

export default EstatisticasTurmaModal;
