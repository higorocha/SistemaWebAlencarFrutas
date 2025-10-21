// src/components/clientes/PedidosClienteModal.js

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Table, Space, Typography, Tag, Button, Select, Row, Col, Card, Statistic, Empty, Spin, DatePicker } from "antd";
import {
  ShoppingCartOutlined,
  FilterOutlined,
  CloseOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { SearchInput } from "../common/search";
import VisualizarPedidoModal from "../pedidos/VisualizarPedidoModal";
import Chart from "react-apexcharts";
import { formatCurrency, capitalizeName } from "../../utils/formatters";
import MiniSelectPersonalizavel from "../common/MiniComponents/MiniSelectPersonalizavel";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import moment from "moment";

const { RangePicker } = DatePicker;

const { Title, Text } = Typography;
const { Option } = Select;

const PedidosClienteModal = ({ open, onClose, cliente, loading = false }) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [intervaloMeses, setIntervaloMeses] = useState(3);
  const [dadosGrafico, setDadosGrafico] = useState(null);

  // Estatísticas do cliente
  const [estatisticas, setEstatisticas] = useState({
    totalPedidos: 0,
    pedidosAtivos: 0,
    pedidosFinalizados: 0,
    valorTotal: 0,
    valorPendente: 0,
  });

  // Carregar pedidos do cliente
  const fetchPedidosCliente = useCallback(async () => {
    if (!cliente?.id) return;

    try {
      const response = await axiosInstance.get(`/api/pedidos/cliente/${cliente.id}`);
      
      // Garantir que sempre temos um array válido
      let pedidosData = [];
      
      try {
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            pedidosData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            pedidosData = response.data.data;
          } else if (response.data.pedidos && Array.isArray(response.data.pedidos)) {
            pedidosData = response.data.pedidos;
          } else {
            // Se não conseguir extrair array, usar array vazio
            pedidosData = [];
          }
        }
      } catch (parseError) {
        console.warn("Erro ao processar resposta da API:", parseError);
        pedidosData = [];
      }
      
      // Garantir que pedidosData é sempre um array
      if (!Array.isArray(pedidosData)) {
        console.warn("pedidosData não é um array, convertendo para array vazio:", pedidosData);
        pedidosData = [];
      }
      
      setPedidos(pedidosData);
      setPedidosFiltrados(pedidosData);
      
      // Calcular estatísticas
      const stats = calcularEstatisticas(pedidosData);
      setEstatisticas(stats);
      
    } catch (error) {
      console.warn("Erro ao buscar pedidos do cliente (usando dados vazios):", error);
      // Não mostrar notificação de erro para dados vazios
      // showNotification("error", "Erro", "Erro ao carregar pedidos do cliente");
      setPedidos([]);
      setPedidosFiltrados([]);
      setEstatisticas({
        totalPedidos: 0,
        pedidosAtivos: 0,
        pedidosFinalizados: 0,
        valorTotal: 0,
        valorPendente: 0,
      });
    }
  }, [cliente?.id]);

  // Calcular estatísticas dos pedidos
  const calcularEstatisticas = (pedidos) => {
    // Garantir que pedidos é sempre um array válido
    if (!Array.isArray(pedidos)) {
      console.warn("calcularEstatisticas: pedidos não é um array, usando array vazio:", pedidos);
      pedidos = [];
    }
    
    // Verificar se pedidos está vazio
    if (pedidos.length === 0) {
      return {
        totalPedidos: 0,
        pedidosAtivos: 0,
        pedidosFinalizados: 0,
        valorTotal: 0,
        valorPendente: 0,
      };
    }

    const totalPedidos = pedidos.length;
    const pedidosAtivos = pedidos.filter(p => 
      !['PEDIDO_FINALIZADO', 'CANCELADO'].includes(p.status)
    ).length;
    const pedidosFinalizados = pedidos.filter(p => 
      p.status === 'PEDIDO_FINALIZADO'
    ).length;
    
    const valorTotal = pedidos.reduce((total, p) => total + (p.valorFinal || 0), 0);
    const valorPendente = pedidos
      .filter(p => !['PEDIDO_FINALIZADO', 'CANCELADO'].includes(p.status))
      .reduce((total, p) => total + (p.valorFinal || 0), 0);

    return {
      totalPedidos,
      pedidosAtivos,
      pedidosFinalizados,
      valorTotal,
      valorPendente,
    };
  };

  // Filtrar pedidos
  const filtrarPedidos = useCallback(() => {
    // Garantir que pedidos é sempre um array válido
    if (!Array.isArray(pedidos)) {
      console.warn("filtrarPedidos: pedidos não é um array, usando array vazio:", pedidos);
      setPedidosFiltrados([]);
      return;
    }
    
    // Se pedidos está vazio, não há nada para filtrar
    if (pedidos.length === 0) {
      setPedidosFiltrados([]);
      return;
    }
    
    let pedidosFiltrados = [...pedidos];

    // Aplicar filtro de busca
    if (searchTerm) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar no número do pedido
        const numeroMatch = pedido.numeroPedido?.toLowerCase().includes(searchLower);
        
        // Buscar nas observações
        const observacoesMatch = pedido.observacoes?.toLowerCase().includes(searchLower);
        
        // Buscar na referência externa dos pagamentos
        const referenciaMatch = pedido.pagamentosPedidos?.some(pagamento => 
          pagamento.referenciaExterna?.toLowerCase().includes(searchLower)
        );
        
        return numeroMatch || observacoesMatch || referenciaMatch;
      });
    }

    // Aplicar filtro de status
    if (statusFilter) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.status === statusFilter);
    }

    // Aplicar filtro de data do pedido
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const pedidoDate = moment(pedido.dataPedido);
        
        // Comparar apenas as datas (ignorar horário)
        const pedidoDateOnly = pedidoDate.format('YYYY-MM-DD');
        const startDateOnly = startDate.format('YYYY-MM-DD');
        const endDateOnly = endDate.format('YYYY-MM-DD');
        
        return pedidoDateOnly >= startDateOnly && pedidoDateOnly <= endDateOnly;
      });
    }

    setPedidosFiltrados(pedidosFiltrados);
  }, [pedidos, searchTerm, statusFilter, dateRange]);

  // Efeito para carregar pedidos quando o modal abrir
  useEffect(() => {
    if (open && cliente?.id) {
      fetchPedidosCliente();
    }
  }, [open, cliente?.id, fetchPedidosCliente]);

  // Função para abrir modal de visualização
  const handleOpenVisualizarModal = (pedido) => {
    setPedidoSelecionado(pedido);
    setVisualizarModalOpen(true);
  };

  // Função para processar dados do gráfico
  const processarDadosGrafico = () => {
    // Garantir que pedidos é um array válido
    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      console.warn("processarDadosGrafico: pedidos não é um array válido ou está vazio:", pedidos);
      return;
    }

    const dataAtual = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataAtual.getMonth() - intervaloMeses);

    // Filtrar pedidos do período selecionado
    const pedidosFiltrados = pedidos.filter(pedido => {
      try {
        const dataPedido = new Date(pedido.dataPedido);
        return dataPedido >= dataInicio && dataPedido <= dataAtual;
      } catch (error) {
        console.warn("Erro ao processar data do pedido:", pedido.dataPedido, error);
        return false;
      }
    });

    // Agrupar por mês
    const dadosPorMes = {};
    pedidosFiltrados.forEach(pedido => {
      const data = new Date(pedido.dataPedido);
      const chaveMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dadosPorMes[chaveMes]) {
        dadosPorMes[chaveMes] = {
          valorTotal: 0,
          valorRecebido: 0,
          quantidadePedidos: 0,
        };
      }
      
      dadosPorMes[chaveMes].valorTotal += pedido.valorFinal || 0;
      dadosPorMes[chaveMes].valorRecebido += pedido.valorRecebido || 0;
      dadosPorMes[chaveMes].quantidadePedidos += 1;
    });

    // Converter para arrays ordenados
    const meses = Object.keys(dadosPorMes).sort();
    const valoresTotais = meses.map(mes => dadosPorMes[mes].valorTotal);
    const valoresRecebidos = meses.map(mes => dadosPorMes[mes].valorRecebido);
    const quantidadesPedidos = meses.map(mes => dadosPorMes[mes].quantidadePedidos);

    // Formatar labels dos meses
    const labelsMeses = meses.map(mes => {
      const [ano, mesNum] = mes.split('-');
      const data = new Date(ano, mesNum - 1);
      return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    setDadosGrafico({
      meses: labelsMeses,
      valoresTotais,
      valoresRecebidos,
      quantidadesPedidos,
    });
  };

  // Efeito para limpar estados quando o modal fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setStatusFilter("");
      setDateRange(null);
      setPedidos([]);
      setPedidosFiltrados([]);
      setVisualizarModalOpen(false);
      setPedidoSelecionado(null);
      setEstatisticas({
        totalPedidos: 0,
        pedidosAtivos: 0,
        pedidosFinalizados: 0,
        valorTotal: 0,
      });
    }
  }, [open]);

  // Efeito para filtrar quando os filtros mudarem
  useEffect(() => {
    filtrarPedidos();
  }, [filtrarPedidos]);

  // Efeito para processar dados do gráfico
  useEffect(() => {
    if (pedidos.length > 0) {
      processarDadosGrafico();
    }
  }, [pedidos, intervaloMeses]);

  // Hook para cores de status centralizadas
  const { getStatusConfig } = usePedidoStatusColors();

  // Função para formatar status do pedido (cores centralizadas do tema)
  const formatarStatusPedido = (status) => {
    const config = getStatusConfig(status);

    // Mapeamento de ícones para status
    const statusIcons = {
      PEDIDO_CRIADO: <ClockCircleOutlined />,
      AGUARDANDO_COLHEITA: <ClockCircleOutlined />,
      COLHEITA_REALIZADA: <CheckCircleOutlined />,
      AGUARDANDO_PRECIFICACAO: <ClockCircleOutlined />,
      PRECIFICACAO_REALIZADA: <CheckCircleOutlined />,
      AGUARDANDO_PAGAMENTO: <ClockCircleOutlined />,
      PAGAMENTO_PARCIAL: <ExclamationCircleOutlined />,
      PAGAMENTO_REALIZADO: <CheckCircleOutlined />,
      PEDIDO_FINALIZADO: <CheckCircleOutlined />,
      CANCELADO: <MinusCircleOutlined />,
    };

    const icon = statusIcons[status] || <ClockCircleOutlined />;

    return (
      <Tag
        color={config.color}
        icon={icon}
        style={{
          borderRadius: "0.25rem",  // 4px
          fontWeight: "500",
          fontSize: "0.6875rem",  // 11px
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {config.text}
      </Tag>
    );
  };

  // Função para formatar valor monetário
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return "-";
    return moment(data).format('DD/MM/YYYY');
  };

  // Definição das colunas da tabela
  const columns = [
    {
      title: "Pedido",
      dataIndex: "numeroPedido",
      key: "numeroPedido",
      render: (text) => (
        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
          {text}
        </Text>
      ),
      width: "15%",
      sorter: (a, b) => a.numeroPedido.localeCompare(b.numeroPedido),
    },
    {
      title: "Data Criação",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (data) => (
        <Space>
          <CalendarOutlined style={{ color: "#059669", fontSize: "0.75rem" }} />
          <Text style={{ fontSize: "0.75rem" }}>{formatarData(data)}</Text>
        </Space>
      ),
      width: "15%",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Data Prevista",
      dataIndex: "dataPrevistaColheita",
      key: "dataPrevistaColheita",
      render: (data) => (
        <Text style={{ fontSize: "0.75rem" }}>
          {formatarData(data)}
        </Text>
      ),
      width: "15%",
      sorter: (a, b) => new Date(a.dataPrevistaColheita || 0) - new Date(b.dataPrevistaColheita || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => formatarStatusPedido(status),
      width: "20%",
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Valor Total",
      dataIndex: "valorFinal",
      key: "valorFinal",
      render: (valor) => (
        <Space>
          <DollarOutlined style={{ color: "#059669", fontSize: "0.75rem" }} />
          <Text strong style={{ color: "#333", fontSize: "0.75rem" }}>
            {formatarValor(valor)}
          </Text>
        </Space>
      ),
      width: "15%",
      sorter: (a, b) => (a.valorFinal || 0) - (b.valorFinal || 0),
    },
    {
      title: "Observações",
      dataIndex: "observacoes",
      key: "observacoes",
      render: (text) => (
        <Text
          style={{
            fontSize: "0.75rem",
            color: "#666",
            display: "block",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
          title={text}
        >
          {text || "-"}
        </Text>
      ),
      width: "20%",
    },
  ];

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
    colors: ['#059669', '#1890ff'],
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
          text: 'Valor (R$)',
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
          formatter: (value) => `R$ ${formatCurrency(value)}`
        }
      },
      {
        opposite: true,
        title: {
          text: 'Quantidade de Pedidos',
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
          formatter: (value) => value.toLocaleString('pt-BR')
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
      },
      itemMargin: {
        horizontal: 20,
        vertical: 0,
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value, { seriesIndex }) => {
          if (seriesIndex === 0) return `R$ ${formatCurrency(value)}`;
          if (seriesIndex === 1) return `${value} pedidos`;
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
      name: 'Faturamento Total',
      type: 'line',
      data: dadosGrafico.valoresTotais,
    },
    {
      name: 'Quantidade de Pedidos',
      type: 'line',
      data: dadosGrafico.quantidadesPedidos,
    }
  ] : [];

  return (
    <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "1rem",  // 14px mobile, 16px desktop
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",  // 10px 12px / 12px 16px
          margin: "-1.25rem -1.5rem 0 -1.5rem",  // -20px -24px 0 -24px
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",  // 8px
        }}>
          <ShoppingCartOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? `Pedidos - ${capitalizeName(cliente?.nome || "Cliente")}` : `Pedidos de ${capitalizeName(cliente?.nome || "Cliente")}`}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "75rem" }}  // 1200px
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",  // 200px convertido
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,  // px para estabilidade
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",  // 2px
          padding: 0,
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      {/* Estatísticas do Cliente */}
      <Card
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              Estatísticas do Cliente
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,  // px para estabilidade
          border: "0.0625rem solid #e8e8e8",  // 1px
          borderRadius: "0.5rem",  // 8px
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",  // 2px
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",  // 8px
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: {
            padding: isMobile ? "12px" : "16px"
          }
        }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Total" : "Total de Pedidos"}
              value={estatisticas.totalPedidos}
              valueStyle={{ color: "#1890ff", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Ativos" : "Pedidos Ativos"}
              value={estatisticas.pedidosAtivos}
              valueStyle={{ color: "#fa8c16", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Finalizados" : "Pedidos Finalizados"}
              value={estatisticas.pedidosFinalizados}
              valueStyle={{ color: "#52c41a", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Valor" : "Valor Total"}
              value={estatisticas.valorTotal}
              formatter={(value) => formatarValor(value)}
              valueStyle={{ color: "#059669", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<DollarOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Gráfico de Faturamento */}
      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              {isMobile ? "Evolução" : "Evolução do Faturamento"}
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: {
            padding: isMobile ? "12px" : "16px"
          }
        }}
        extra={
          <Space>
            {!isMobile && <Text strong style={{ color: "#ffffff" }}>Período:</Text>}
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
              height={isMobile ? "28px" : "32px"}
              fontSize={isMobile ? "0.6875rem" : "0.75rem"}  // 11px / 12px
              iconColor="#ffffff"
              iconSize={isMobile ? "12px" : "14px"}
              customPadding={isMobile ? "4px 6px 4px 24px" : "6px 8px 6px 28px"}
              maxHeight="200px"
              style={{
                width: isMobile ? "100px" : "120px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "0.375rem",  // 6px
                zIndex: 9999,
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
            height={isMobile ? 250 : 350}
          />
        ) : (
          <div style={{
            textAlign: "center",
            padding: isMobile ? "24px" : "40px",
            color: "#8c8c8c"
          }}>
            <BarChartOutlined style={{ fontSize: isMobile ? "36px" : "48px", marginBottom: isMobile ? "12px" : "16px" }} />
            <Text type="secondary" style={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>
              Nenhum dado disponível para o período selecionado
            </Text>
          </div>
        )}
      </Card>

      {/* Filtros e Busca */}
      <Card
        title={
          <Space>
            <FilterOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              {isMobile ? "Filtros" : "Filtros e Busca"}
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: {
            padding: isMobile ? "12px" : "16px"
          }
        }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 18 : 16]}>
          <Col xs={24} sm={24} md={12}>
            <SearchInput
              placeholder={isMobile ? "Buscar pedido..." : "Buscar por número do pedido, observações ou vale..."}
              value={searchTerm}
              onChange={setSearchTerm}
              style={{ width: "100%", marginBottom: 0 }}
              size={isMobile ? "middle" : "large"}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={isMobile ? "Status" : "Filtrar por status"}
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              allowClear
            >
              <Option value="">
                <Space>
                  <FilterOutlined style={{ color: "#8c8c8c" }} />
                  <span>Todos</span>
                </Space>
              </Option>
              <Option value="PEDIDO_CRIADO">
                <Space>
                  <ClockCircleOutlined style={{ color: getStatusConfig('PEDIDO_CRIADO').color }} />
                  <span>Criado</span>
                </Space>
              </Option>
              <Option value="AGUARDANDO_COLHEITA">
                <Space>
                  <ClockCircleOutlined style={{ color: getStatusConfig('AGUARDANDO_COLHEITA').color }} />
                  <span>Aguardando Colheita</span>
                </Space>
              </Option>
              <Option value="COLHEITA_REALIZADA">
                <Space>
                  <CheckCircleOutlined style={{ color: getStatusConfig('COLHEITA_REALIZADA').color }} />
                  <span>Colheita Realizada</span>
                </Space>
              </Option>
              <Option value="AGUARDANDO_PRECIFICACAO">
                <Space>
                  <ClockCircleOutlined style={{ color: getStatusConfig('AGUARDANDO_PRECIFICACAO').color }} />
                  <span>Aguardando Precificação</span>
                </Space>
              </Option>
              <Option value="PRECIFICACAO_REALIZADA">
                <Space>
                  <CheckCircleOutlined style={{ color: getStatusConfig('PRECIFICACAO_REALIZADA').color }} />
                  <span>Precificação Realizada</span>
                </Space>
              </Option>
              <Option value="AGUARDANDO_PAGAMENTO">
                <Space>
                  <ClockCircleOutlined style={{ color: getStatusConfig('AGUARDANDO_PAGAMENTO').color }} />
                  <span>Aguardando Pagamento</span>
                </Space>
              </Option>
              <Option value="PAGAMENTO_PARCIAL">
                <Space>
                  <ExclamationCircleOutlined style={{ color: getStatusConfig('PAGAMENTO_PARCIAL').color }} />
                  <span>Pagamento Parcial</span>
                </Space>
              </Option>
              <Option value="PAGAMENTO_REALIZADO">
                <Space>
                  <CheckCircleOutlined style={{ color: getStatusConfig('PAGAMENTO_REALIZADO').color }} />
                  <span>Pagamento Realizado</span>
                </Space>
              </Option>
              <Option value="PEDIDO_FINALIZADO">
                <Space>
                  <CheckCircleOutlined style={{ color: getStatusConfig('PEDIDO_FINALIZADO').color }} />
                  <span>Finalizado</span>
                </Space>
              </Option>
              <Option value="CANCELADO">
                <Space>
                  <MinusCircleOutlined style={{ color: getStatusConfig('CANCELADO').color }} />
                  <span>Cancelado</span>
                </Space>
              </Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={isMobile ? ["Início", "Fim"] : ["Data inicial", "Data final"]}
              value={dateRange}
              onChange={setDateRange}
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              format="DD/MM/YYYY"
              allowClear
              showTime={false}
              disabledTime={() => null}
              inputReadOnly
            />
          </Col>
        </Row>
      </Card>

      {/* Tabela de Pedidos */}
      <Card
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              {isMobile ? "Pedidos" : "Lista de Pedidos"}
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: {
            padding: isMobile ? "12px" : "16px"
          }
        }}
      >
        <ResponsiveTable
          columns={columns}
          dataSource={pedidosFiltrados}
          loading={loading}
          rowKey="id"
          minWidthMobile={1200}
          showScrollHint={true}
          onRow={(record) => ({
            onClick: () => handleOpenVisualizarModal(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} pedidos`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "#8c8c8c", fontSize: "0.875rem" }}>
                    Nenhum pedido encontrado
                  </span>
                }
              />
            ),
          }}
          size="small"
          bordered={true}
        />
      </Card>

      {/* Modal de Visualização */}
      <VisualizarPedidoModal
        open={visualizarModalOpen}
        onClose={() => {
          setVisualizarModalOpen(false);
          setPedidoSelecionado(null);
        }}
        pedido={pedidoSelecionado}
      />
    </Modal>
  );
};

PedidosClienteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cliente: PropTypes.object,
  loading: PropTypes.bool,
};

export default PedidosClienteModal;
