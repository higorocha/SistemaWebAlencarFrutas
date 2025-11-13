// src/components/fornecedores/EstatisticasFornecedorModal.js

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
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import useResponsive from "../../hooks/useResponsive";
import { PDFButton } from "../common/buttons";

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

const EstatisticasFornecedorModal = ({ 
  open, 
  onClose, 
  fornecedorId, 
  fornecedorNome 
}) => {
  const { isMobile } = useResponsive();
  const { getStatusColor, AGUARDANDO_PAGAMENTO, PEDIDO_FINALIZADO } = usePedidoStatusColors();
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState(null);
  const [intervaloMeses, setIntervaloMeses] = useState(6);
  const [dadosGrafico, setDadosGrafico] = useState(null);

  useEffect(() => {
    if (open && fornecedorId) {
      fetchEstatisticas();
    }
  }, [open, fornecedorId]);

  useEffect(() => {
    if (estatisticas && estatisticas.detalhes) {
      processarDadosGrafico();
    }
  }, [estatisticas, intervaloMeses]);

  const fetchEstatisticas = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/fornecedores/${fornecedorId}/estatisticas`);
      setEstatisticas(response.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      showNotification("error", "Erro", "Erro ao carregar estatísticas do fornecedor");
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com geração de PDF (em desenvolvimento)
  const handleGerarPDF = () => {
    showNotification('info', 'Em Desenvolvimento', 'A funcionalidade de gerar PDF ainda está em desenvolvimento.');
  };

  const processarDadosGrafico = () => {
    if (!estatisticas?.detalhes) return;

    const dataAtual = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataAtual.getMonth() - intervaloMeses);

    // Filtrar dados do período selecionado (usar dataColheita se disponível)
    const dadosFiltrados = estatisticas.detalhes.filter(item => {
      if (!item.dataColheita) return false;
      const dataColheita = new Date(item.dataColheita);
      return dataColheita >= dataInicio && dataColheita <= dataAtual;
    });

    // Agrupar por mês (separando por status: pago, precificado, não precificado)
    const dadosPorMes = {};
    dadosFiltrados.forEach(item => {
      if (!item.dataColheita) return;
      const data = new Date(item.dataColheita);
      const chaveMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dadosPorMes[chaveMes]) {
        dadosPorMes[chaveMes] = {
          // Quantidades agrupadas por unidade
          quantidadesPorUnidade: {},
          valorPago: 0,
          valorPrecificado: 0,
          valorTotal: 0,
          pedidos: new Set(),
        };
      }
      
      // Determinar status da colheita
      const temPagamentoId = item.pagamentoId !== undefined && 
                             item.pagamentoId !== null && 
                             typeof item.pagamentoId === 'number' && 
                             item.pagamentoId > 0;
      const statusPago = item.statusPagamento === 'PAGO';
      const statusPendente = item.statusPagamento === 'PENDENTE' || item.statusPagamento === 'PROCESSANDO';
      
      // Agrupar quantidades por unidade
      const unidade = item.unidade || 'UN';
      if (!dadosPorMes[chaveMes].quantidadesPorUnidade[unidade]) {
        dadosPorMes[chaveMes].quantidadesPorUnidade[unidade] = 0;
      }
      dadosPorMes[chaveMes].quantidadesPorUnidade[unidade] += item.quantidade || 0;
      dadosPorMes[chaveMes].pedidos.add(item.pedido);
      
      // IMPORTANTE: Usar apenas valores da tabela de pagamentos (valorTotal), nunca valores de venda (valor)
      if (temPagamentoId && statusPago) {
        // Colheita paga - usar apenas valorTotal do pagamento
        dadosPorMes[chaveMes].valorPago += item.valorTotal || 0;
        dadosPorMes[chaveMes].valorTotal += item.valorTotal || 0;
      } else if (temPagamentoId && statusPendente) {
        // Colheita precificada mas não paga - usar apenas valorTotal do pagamento
        dadosPorMes[chaveMes].valorPrecificado += item.valorTotal || 0;
        dadosPorMes[chaveMes].valorTotal += item.valorTotal || 0;
      }
      // Colheita não precificada não tem valor (valor = 0 até ser precificada) - não somar nada
    });

    // Converter para arrays ordenados
    const meses = Object.keys(dadosPorMes).sort();
    
    // Obter todas as unidades únicas de todos os meses
    const unidadesUnicas = new Set();
    meses.forEach(mes => {
      Object.keys(dadosPorMes[mes].quantidadesPorUnidade).forEach(unidade => {
        unidadesUnicas.add(unidade);
      });
    });
    const unidadesArray = Array.from(unidadesUnicas).sort();
    
    // Criar séries de quantidades por unidade
    const quantidadesPorUnidade = unidadesArray.map(unidade => ({
      name: `Quantidade (${unidade})`,
      data: meses.map(mes => dadosPorMes[mes].quantidadesPorUnidade[unidade] || 0),
    }));
    
    // Valores (apenas pago e precificado, não mostrar não precificado)
    const valoresPagos = meses.map(mes => dadosPorMes[mes].valorPago);
    const valoresPrecificados = meses.map(mes => dadosPorMes[mes].valorPrecificado);
    const valoresTotais = meses.map(mes => dadosPorMes[mes].valorTotal);
    const pedidos = meses.map(mes => dadosPorMes[mes].pedidos.size);

    // Formatar labels dos meses
    const labelsMeses = meses.map(mes => {
      const [ano, mesNum] = mes.split('-');
      const data = new Date(ano, mesNum - 1);
      return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    setDadosGrafico({
      meses: labelsMeses,
      quantidadesPorUnidade,
      unidades: unidadesArray,
      valoresPagos,
      valoresPrecificados,
      valoresTotais,
      pedidos,
    });
  };

  const columns = [
    {
      title: "Pedido",
      dataIndex: "pedido",
      key: "pedido",
      width: 140,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "Data",
      dataIndex: "dataColheita",
      key: "dataColheita",
      width: 130,
      render: (date) => (
        date ? (
          <Space>
            <CalendarOutlined style={{ color: "#059669" }} />
            <Text>{new Date(date).toLocaleDateString('pt-BR')}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: "Fruta",
      dataIndex: "fruta",
      key: "fruta",
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Space>
          <AppleOutlined style={{ color: "#059669" }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Área",
      dataIndex: "areaNome",
      key: "areaNome",
      width: 150,
      ellipsis: true,
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Quantidade",
      dataIndex: "quantidade",
      key: "quantidade",
      width: 150,
      render: (value, record) => (
        <Text strong>
          {value.toLocaleString('pt-BR')} {record.unidade}
        </Text>
      ),
    },
    {
      title: "Valor",
      key: "valor",
      width: 150,
      render: (_, record) => {
        // IMPORTANTE: Mostrar apenas valorTotal do pagamento (se existir)
        // Não mostrar valor de venda (valor sempre será 0)
        const valorExibir = record.valorTotal && record.valorTotal > 0 
          ? record.valorTotal 
          : 0;
        return (
          <Text style={{ color: "#059669", fontWeight: 500 }}>
            {valorExibir > 0 ? `R$ ${formatCurrency(valorExibir)}` : "-"}
          </Text>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, record) => {
        // Mesma lógica do FornecedorColheitaPagamentosModal
        // Se status é PAGO, mostrar badge verde "Pago"
        if (record.statusPagamento === 'PAGO') {
          const corPago = PEDIDO_FINALIZADO || getStatusColor('PEDIDO_FINALIZADO') || "#52c41a";
          return (
            <Tag
              style={{
                backgroundColor: corPago,
                color: "#ffffff",
                borderRadius: "4px",
                fontWeight: 600,
                border: "none",
                fontSize: "0.75rem",
                padding: "2px 8px",
              }}
            >
              Pago
            </Tag>
          );
        }
        
        // Se existe valorTotal (valor de compra/precificação), mostrar badge amarelo "Precificado"
        if (record.valorTotal && record.valorTotal > 0) {
          const corPrecificado = AGUARDANDO_PAGAMENTO || getStatusColor('AGUARDANDO_PAGAMENTO') || "#faad14";
          return (
            <Tag
              style={{
                backgroundColor: corPrecificado,
                color: "#ffffff",
                borderRadius: "4px",
                fontWeight: 600,
                border: "none",
                fontSize: "0.75rem",
                padding: "2px 8px",
              }}
            >
              Precificado
            </Tag>
          );
        }
        
        // Se não tem valorTotal e não está pago, não mostrar badge (colheita não precificada)
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Obs",
      key: "observacoes",
      width: 80,
      align: "center",
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
        footer={
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            flexWrap: isMobile ? "wrap" : "nowrap"
          }}>
            <PDFButton
              onClick={handleGerarPDF}
              size={isMobile ? "small" : "large"}
              tooltip="Gerar PDF"
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
                fontSize: isMobile ? "0.75rem" : undefined,
              }}
            >
              Gerar PDF
            </PDFButton>
            <div style={{ marginLeft: "auto" }}>
              <Button 
                onClick={onClose} 
                size={isMobile ? "small" : "large"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        }
        width={isMobile ? '95vw' : 1800}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? 12 : 20,
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
            Estatísticas do Fornecedor
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            flexWrap: isMobile ? "wrap" : "nowrap"
          }}>
            <PDFButton
              onClick={handleGerarPDF}
              size={isMobile ? "small" : "large"}
              tooltip="Gerar PDF"
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
                fontSize: isMobile ? "0.75rem" : undefined,
              }}
            >
              Gerar PDF
            </PDFButton>
            <div style={{ marginLeft: "auto" }}>
              <Button 
                onClick={onClose} 
                size={isMobile ? "small" : "large"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        }
        width={isMobile ? '95vw' : 1800}
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
    colors: ['#059669', '#10b981', '#0d9488', '#14b8a6', '#52c41a', '#faad14'],
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
        formatter: (value, { seriesIndex, w }) => {
          // Primeiras séries são quantidades por unidade
          if (seriesIndex < dadosGrafico?.unidades?.length) {
            const unidade = dadosGrafico.unidades[seriesIndex];
            return `${value.toLocaleString('pt-BR')} ${unidade}`;
          }
          // Depois vêm os valores (apenas Pago e Precificado)
          const indiceValor = seriesIndex - (dadosGrafico?.unidades?.length || 0);
          if (indiceValor === 0) return `R$ ${formatCurrency(value)} (Pago)`;
          if (indiceValor === 1) return `R$ ${formatCurrency(value)} (Precificado)`;
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
    // Séries de quantidades por unidade (eixo Y esquerdo)
    ...dadosGrafico.quantidadesPorUnidade.map(serie => ({
      name: serie.name,
      type: 'line',
      data: serie.data,
      yAxisIndex: 0,
    })),
    // Séries de valores (eixo Y direito) - apenas Pago e Precificado
    {
      name: 'Valor Pago',
      type: 'line',
      data: dadosGrafico.valoresPagos,
      yAxisIndex: 1,
    },
    {
      name: 'Valor Precificado',
      type: 'line',
      data: dadosGrafico.valoresPrecificados,
      yAxisIndex: 1,
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
          Colheitas - {fornecedorNome}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          gap: isMobile ? "8px" : "12px",
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <PDFButton
            onClick={handleGerarPDF}
            size={isMobile ? "small" : "large"}
            tooltip="Gerar PDF"
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
              fontSize: isMobile ? "0.75rem" : undefined,
            }}
          >
            Gerar PDF
          </PDFButton>
          <div style={{ marginLeft: "auto" }}>
            <Button 
              onClick={onClose} 
              size={isMobile ? "small" : "large"}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
              }}
            >
              Fechar
            </Button>
          </div>
        </div>
      }
      width={isMobile ? '95vw' : 1800}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
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
                valueStyle={{ color: "#059669", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                prefix={<AppleOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Valor Total"
                value={totalGeral.valor || 0}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
                valueStyle={{ color: "#059669", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                prefix={<DollarOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Valor Pago"
                value={totalGeral.valorPago || 0}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
                valueStyle={{ color: totalGeral.valorPago > 0 ? "#52c41a" : "#d9d9d9", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
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
                valueStyle={{ color: "#1890ff", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                prefix={<ShoppingCartOutlined />}
              />
            </div>
          </Col>
        </Row>
        
        <Divider style={{ margin: "16px 0" }} />
        
        {/* Estatísticas separadas por status */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Valor Pago"
                value={totalGeral.valorPago || 0}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
                valueStyle={{ color: "#52c41a", fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                prefix={<CheckCircleOutlined />}
              />
              <Text type="secondary" style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}>
                {(totalGeral.quantidadePaga || 0).toLocaleString('pt-BR')} unidades
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Valor Precificado"
                value={totalGeral.valorPrecificado || 0}
                formatter={(value) => `R$ ${formatCurrency(value)}`}
                valueStyle={{ color: "#faad14", fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                prefix={<ClockCircleOutlined />}
              />
              <Text type="secondary" style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}>
                {(totalGeral.quantidadePrecificada || 0).toLocaleString('pt-BR')} unidades
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Quantidade Não Precificada"
                value={totalGeral.quantidadeNaoPrecificada || 0}
                formatter={(value) => value.toLocaleString('pt-BR')}
                suffix="unidades"
                valueStyle={{ color: "#8c8c8c", fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                prefix={<AppleOutlined />}
              />
              <Text type="secondary" style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}>
                Sem valor (não precificada)
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: "center" }}>
              <Statistic
                title="Total Colheitas"
                value={totalGeral.quantidade || 0}
                formatter={(value) => value.toLocaleString('pt-BR')}
                suffix="unidades"
                valueStyle={{ color: "#059669", fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                prefix={<AppleOutlined />}
              />
              <Text type="secondary" style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}>
                {totalGeral.totalPedidos} pedidos • {totalGeral.totalFrutas} frutas
              </Text>
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
          <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
            {Object.entries(totaisPorUnidade).map(([unidade, total]) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={unidade}>
                <Card 
                  size="small" 
                  style={{ 
                    height: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                    transition: "all 0.3s ease",
                  }}
                  hoverable
                  styles={{
                    body: {
                      padding: isMobile ? "16px" : "20px",
                    }
                  }}
                >
                  {/* Header do Card - Unidade */}
                  <div style={{ 
                    textAlign: "center", 
                    marginBottom: isMobile ? 16 : 20,
                    paddingBottom: isMobile ? 12 : 16,
                    borderBottom: "2px solid #f0f0f0"
                  }}>
                    <Tag 
                      color="#059669" 
                      style={{ 
                        fontSize: isMobile ? "0.875rem" : "1rem",
                        fontWeight: 700,
                        padding: isMobile ? "4px 12px" : "6px 16px",
                        borderRadius: "6px",
                        marginBottom: 8,
                        border: "none"
                      }}
                    >
                      {unidade}
                    </Tag>
                    <Statistic
                      title="Total Colhido"
                      value={total.quantidade}
                      formatter={(value) => value.toLocaleString('pt-BR')}
                      valueStyle={{ 
                        fontSize: isMobile ? "1.5rem" : "1.75rem", 
                        color: "#059669", 
                        fontWeight: 700,
                        marginTop: 4
                      }}
                      prefix={<AppleOutlined style={{ fontSize: isMobile ? "16px" : "18px" }} />}
                    />
                  </div>
                  
                  {/* Quantidades por Status */}
                  <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                    <Text strong style={{ 
                      fontSize: isMobile ? "0.75rem" : "0.8125rem", 
                      display: "block", 
                      marginBottom: isMobile ? 10 : 12, 
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Quantidades
                    </Text>
                    <Space direction="vertical" size={isMobile ? 6 : 8} style={{ width: "100%" }}>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: isMobile ? "6px 8px" : "8px 12px",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "6px",
                        border: "1px solid #bbf7d0"
                      }}>
                        <Space size={6}>
                          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: isMobile ? "14px" : "16px" }} />
                          <Text style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem", color: "#333" }}>Pago</Text>
                        </Space>
                        <Text strong style={{ 
                          fontSize: isMobile ? "0.8125rem" : "0.875rem", 
                          color: "#52c41a",
                          fontWeight: 600
                        }}>
                          {total.quantidadePaga.toLocaleString('pt-BR')}
                        </Text>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: isMobile ? "6px 8px" : "8px 12px",
                        backgroundColor: "#fffbf0",
                        borderRadius: "6px",
                        border: "1px solid #fde68a"
                      }}>
                        <Space size={6}>
                          <ClockCircleOutlined style={{ color: "#faad14", fontSize: isMobile ? "14px" : "16px" }} />
                          <Text style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem", color: "#333" }}>Precificado</Text>
                        </Space>
                        <Text strong style={{ 
                          fontSize: isMobile ? "0.8125rem" : "0.875rem", 
                          color: "#faad14",
                          fontWeight: 600
                        }}>
                          {total.quantidadePrecificada.toLocaleString('pt-BR')}
                        </Text>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: isMobile ? "6px 8px" : "8px 12px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb"
                      }}>
                        <Space size={6}>
                          <AppleOutlined style={{ color: "#8c8c8c", fontSize: isMobile ? "14px" : "16px" }} />
                          <Text style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem", color: "#333" }}>Não Precificado</Text>
                        </Space>
                        <Text strong style={{ 
                          fontSize: isMobile ? "0.8125rem" : "0.875rem", 
                          color: "#8c8c8c",
                          fontWeight: 600
                        }}>
                          {total.quantidadeNaoPrecificada.toLocaleString('pt-BR')}
                        </Text>
                      </div>
                    </Space>
                  </div>
                  
                  {/* Valores (apenas pago e precificado) */}
                  {total.valor > 0 && (
                    <div>
                      <Text strong style={{ 
                        fontSize: isMobile ? "0.75rem" : "0.8125rem", 
                        display: "block", 
                        marginBottom: isMobile ? 10 : 12, 
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        Valores
                      </Text>
                      <Space direction="vertical" size={isMobile ? 6 : 8} style={{ width: "100%" }}>
                        {total.valorPago > 0 && (
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            padding: isMobile ? "8px 10px" : "10px 14px",
                            backgroundColor: "#f0fdf4",
                            borderRadius: "6px",
                            border: "1px solid #bbf7d0"
                          }}>
                            <Space size={6}>
                              <DollarOutlined style={{ color: "#52c41a", fontSize: isMobile ? "14px" : "16px" }} />
                              <Text style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem", color: "#333", fontWeight: 600 }}>Pago</Text>
                            </Space>
                            <Text strong style={{ 
                              fontSize: isMobile ? "0.875rem" : "0.9375rem", 
                              color: "#52c41a",
                              fontWeight: 700
                            }}>
                              R$ {formatCurrency(total.valorPago)}
                            </Text>
                          </div>
                        )}
                        {total.valorPrecificado > 0 && (
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            padding: isMobile ? "8px 10px" : "10px 14px",
                            backgroundColor: "#fffbf0",
                            borderRadius: "6px",
                            border: "1px solid #fde68a"
                          }}>
                            <Space size={6}>
                              <DollarOutlined style={{ color: "#faad14", fontSize: isMobile ? "14px" : "16px" }} />
                              <Text style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem", color: "#333", fontWeight: 600 }}>Precificado</Text>
                            </Space>
                            <Text strong style={{ 
                              fontSize: isMobile ? "0.875rem" : "0.9375rem", 
                              color: "#faad14",
                              fontWeight: 700
                            }}>
                              R$ {formatCurrency(total.valorPrecificado)}
                            </Text>
                          </div>
                        )}
                        {total.valor > 0 && (
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            padding: isMobile ? "10px 12px" : "12px 16px",
                            backgroundColor: "#eff6ff",
                            borderRadius: "6px",
                            border: "2px solid #3b82f6",
                            marginTop: 4
                          }}>
                            <Text strong style={{ 
                              fontSize: isMobile ? "0.875rem" : "0.9375rem", 
                              color: "#1e40af",
                              fontWeight: 700
                            }}>
                              Total
                            </Text>
                            <Text strong style={{ 
                              fontSize: isMobile ? "1rem" : "1.125rem", 
                              color: "#1e40af",
                              fontWeight: 700
                            }}>
                              R$ {formatCurrency(total.valor)}
                            </Text>
                          </div>
                        )}
                      </Space>
                    </div>
                  )}
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
          />
        </Card>
      )}

      {(!detalhes || detalhes.length === 0) && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Text type="secondary">Nenhuma colheita registrada para este fornecedor</Text>
        </div>
      )}
    </Modal>
  );
};

EstatisticasFornecedorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fornecedorId: PropTypes.number,
  fornecedorNome: PropTypes.string,
};

export default EstatisticasFornecedorModal;

