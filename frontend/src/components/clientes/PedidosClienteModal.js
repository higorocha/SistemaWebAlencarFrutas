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
import { formatCurrency } from "../../utils/formatters";
import MiniSelectPersonalizavel from "../common/MiniComponents/MiniSelectPersonalizavel";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import moment from "moment";

const { RangePicker } = DatePicker;

const { Title, Text } = Typography;
const { Option } = Select;

// Styled components para o modal
const StyledModal = styled(Modal)`
  .ant-modal-header {
    background: #059669;
    border-bottom: 2px solid #047857;
    border-radius: 8px 8px 0 0;
  }

  .ant-modal-title {
    color: #ffffff !important;
    font-weight: 600;
    font-size: 16px;
  }

  .ant-modal-close {
    color: #ffffff !important;
  }

  .ant-modal-close:hover {
    color: #f0f0f0 !important;
  }

  .ant-modal-body {
    padding: 20px;
    max-height: "calc(100vh - 200px)";
    overflow-y: auto;
    overflow-x: visible;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: 12px 16px;
    font-size: 13px;
    border-bottom: 2px solid #047857;
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

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    font-size: 13px;
  }

  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e8e8e8;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }
`;

const PedidosClienteModal = ({ open, onClose, cliente, loading = false }) => {
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
          borderRadius: "4px", 
          fontWeight: "500",
          fontSize: "11px",
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
        <Text strong style={{ color: "#059669", fontSize: "13px" }}>
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
          <CalendarOutlined style={{ color: "#059669", fontSize: "12px" }} />
          <Text style={{ fontSize: "12px" }}>{formatarData(data)}</Text>
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
        <Text style={{ fontSize: "12px" }}>
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
          <DollarOutlined style={{ color: "#059669", fontSize: "12px" }} />
          <Text strong style={{ color: "#333", fontSize: "12px" }}>
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
            fontSize: "12px", 
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
    <StyledModal
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
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Pedidos de {cliente?.nome || "Cliente"}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 1200 }}
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
      {/* Estatísticas do Cliente */}
      <Card
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Estatísticas do Cliente</span>
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
            <Statistic
              title="Total de Pedidos"
              value={estatisticas.totalPedidos}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Pedidos Ativos"
              value={estatisticas.pedidosAtivos}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Pedidos Finalizados"
              value={estatisticas.pedidosFinalizados}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Valor Total"
              value={estatisticas.valorTotal}
              formatter={(value) => formatarValor(value)}
              valueStyle={{ color: "#059669" }}
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
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Evolução do Faturamento</span>
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
              maxHeight="200px"
              style={{ 
                width: "120px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
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

      {/* Filtros e Busca */}
      <Card
        title={
          <Space>
            <FilterOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Filtros e Busca</span>
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
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={12}>
            <SearchInput
              placeholder="Buscar por número do pedido, observações ou vale..."
              value={searchTerm}
              onChange={setSearchTerm}
              style={{ width: "100%", marginBottom: 0 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              size="large"
              allowClear
            >
              <Option value="">Todos</Option>
              <Option value="PEDIDO_CRIADO">Criado</Option>
              <Option value="AGUARDANDO_COLHEITA">Aguardando Colheita</Option>
              <Option value="COLHEITA_REALIZADA">Colheita Realizada</Option>
              <Option value="AGUARDANDO_PRECIFICACAO">Aguardando Precificação</Option>
              <Option value="PRECIFICACAO_REALIZADA">Precificação Realizada</Option>
              <Option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</Option>
              <Option value="PAGAMENTO_PARCIAL">Pagamento Parcial</Option>
              <Option value="PAGAMENTO_REALIZADO">Pagamento Realizado</Option>
              <Option value="PEDIDO_FINALIZADO">Finalizado</Option>
              <Option value="CANCELADO">Cancelado</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              height: "40px" // Força a mesma altura dos outros componentes
            }}>
              <RangePicker
                placeholder={["Data inicial", "Data final"]}
                value={dateRange}
                onChange={setDateRange}
                style={{ 
                  width: "100%",
                  height: "40px"
                }}
                size="large"
                format="DD/MM/YYYY"
                allowClear
                showTime={false}
                disabledTime={() => null}
                inputReadOnly
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabela de Pedidos */}
      <Card
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Lista de Pedidos</span>
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
          dataSource={pedidosFiltrados}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => handleOpenVisualizarModal(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} pedidos`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
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
    </StyledModal>
  );
};

PedidosClienteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cliente: PropTypes.object,
  loading: PropTypes.bool,
};

export default PedidosClienteModal;
