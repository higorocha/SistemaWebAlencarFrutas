// src/components/areas/DetalhesAreaModal.js

import React, { useState, useMemo } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Divider,
  Table,
  Empty,
  Button,
  Tooltip,
  DatePicker,
  Select,
  Switch,
} from "antd";
import PropTypes from "prop-types";
import {
  EnvironmentOutlined,
  AppstoreOutlined,
  DollarOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  FilterOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { formatarValorMonetario, numberFormatter } from "../../utils/formatters";
import moment from "moment";
import useResponsive from "../../hooks/useResponsive";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import ResponsiveTable from "../common/ResponsiveTable";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Cores para os gráficos
const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

const DetalhesAreaModal = ({ open, onClose, area, loading = false }) => {
  const { isMobile } = useResponsive();
  
  // Hook para cores de status centralizadas
  const { getStatusConfig } = usePedidoStatusColors();

  // Ref para a seção de pedidos (scroll automático)
  const secaoPedidosRef = React.useRef(null);

  // Estados para filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState(null);
  const [filtroDataFim, setFiltroDataFim] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState(null);

  // Estado para unidade de medida selecionada no gráfico de produção
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(null);

  // Função para formatar datas
  const formatarData = (data) => {
    if (!data) return "-";
    return moment(data).format("DD/MM/YYYY");
  };

  // Função para obter configuração de categoria
  const getCategoriaConfig = (categoria) => {
    const configs = {
      COLONO: { color: 'blue', text: 'Colono' },
      TECNICO: { color: 'green', text: 'Técnico' },
      EMPRESARIAL: { color: 'purple', text: 'Empresarial' },
      ADJACENTE: { color: 'orange', text: 'Adjacente' },
    };
    return configs[categoria] || { color: 'default', text: categoria };
  };

  // Aplicar filtros aos pedidos (frontend - para tabela)
  const pedidosFiltrados = useMemo(() => {
    if (!area?.pedidos) return [];
    
    let pedidos = [...area.pedidos];
    
    // Filtro por data
    if (filtroDataInicio && filtroDataFim) {
      pedidos = pedidos.filter(p => {
        const dataPedido = moment(p.dataPedido);
        return dataPedido.isBetween(filtroDataInicio, filtroDataFim, 'day', '[]');
      });
    }
    
    // Filtro por status
    if (filtroStatus) {
      // ✅ Status especial: VENCIDOS (calculado, não existe no banco)
      // Lógica unificada: dataColheita > 30 dias + saldo devedor
      if (filtroStatus === 'VENCIDOS') {
        const hoje = moment();
        const trintaDias = 30;

        pedidos = pedidos.filter(p => {
          // 1. Deve ter data de colheita
          if (!p.dataColheita) return false;

          // 2. Deve ter valor final
          if (!p.valorFinal || p.valorFinal <= 0) return false;

          // 3. Calcular dias desde a colheita
          const dataColheita = moment(p.dataColheita);
          const diasDesdeColheita = hoje.diff(dataColheita, 'days');

          // 4. Deve ter passado mais de 30 dias da colheita
          if (diasDesdeColheita < trintaDias) return false;

          // 5. Deve ter saldo devedor (valor não pago completamente)
          const valorRecebido = p.valorRecebido || 0;
          const saldoDevedor = p.valorFinal - valorRecebido;

          return saldoDevedor > 0;
        });
      } else {
        // Status normal do banco
        pedidos = pedidos.filter(p => p.status === filtroStatus);
      }
    }
    
    // Filtro por cliente
    if (filtroCliente) {
      pedidos = pedidos.filter(p => p.cliente?.id === filtroCliente);
    }
    
    return pedidos;
  }, [area, filtroDataInicio, filtroDataFim, filtroStatus, filtroCliente]);

  // Usar estatísticas calculadas do backend
  const estatisticas = area?.estatisticas || {
    totalPedidos: 0,
    totalFaturamento: 0,
    totalRecebido: 0,
    totalCustos: 0,
    margemBruta: 0,
    ticketMedio: 0,
    taxaInadimplencia: 0,
    valorInadimplente: 0,
  };

  // Usar dados de faturamento mensal do backend
  const dadosFaturamentoMensal = area?.estatisticas?.faturamentoPorMes || [];

  // Usar principais clientes do backend
  const principaisClientes = area?.estatisticas?.principaisClientes || [];

  // Usar dados de produção por mês e fruta do backend
  const producaoData = area?.estatisticas?.producaoPorMesFruta || { unidades: [], dados: {} };
  
  // Unidades disponíveis
  const unidadesDisponiveis = producaoData.unidades || [];
  const temMultiplasUnidades = unidadesDisponiveis.length > 1;

  // Inicializar unidade selecionada com a primeira disponível
  React.useEffect(() => {
    if (unidadesDisponiveis.length > 0 && !unidadeSelecionada) {
      setUnidadeSelecionada(unidadesDisponiveis[0]);
    }
  }, [unidadesDisponiveis, unidadeSelecionada]);

  // Dados do gráfico baseado na unidade selecionada
  const dadosProducaoMensal = useMemo(() => {
    if (!unidadeSelecionada || !producaoData.dados) return [];
    return producaoData.dados[unidadeSelecionada] || [];
  }, [producaoData, unidadeSelecionada]);

  // Extrair lista de frutas únicas para o gráfico
  const frutasUnicas = useMemo(() => {
    if (dadosProducaoMensal.length === 0) return [];
    
    const frutas = new Set();
    dadosProducaoMensal.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'mes') {
          frutas.add(key);
        }
      });
    });
    
    return Array.from(frutas);
  }, [dadosProducaoMensal]);

  // Processar lista de clientes únicos para o filtro
  const clientesUnicos = useMemo(() => {
    if (!area?.pedidos) return [];
    
    const clientesMap = new Map();
    area.pedidos.forEach(pedido => {
      if (pedido.cliente) {
        clientesMap.set(pedido.cliente.id, pedido.cliente.nome);
      }
    });
    
    return Array.from(clientesMap.entries()).map(([id, nome]) => ({ id, nome }));
  }, [area]);

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroDataInicio(null);
    setFiltroDataFim(null);
    setFiltroStatus(null);
    setFiltroCliente(null);
  };

  // Função para fechar o modal e limpar filtros
  const handleClose = () => {
    limparFiltros(); // Limpa os filtros antes de fechar
    onClose(); // Fecha o modal
  };

  // Função para aplicar filtro de vencidos e rolar para a seção
  const handleClickVencidos = () => {
    // Aplicar filtro de vencidos
    setFiltroStatus('VENCIDOS');
    
    // Rolar para a seção de pedidos após um pequeno delay
    setTimeout(() => {
      if (secaoPedidosRef.current) {
        secaoPedidosRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  // Verificar se tem cultura de banana
  const temBanana = useMemo(() => {
    if (!area?.culturas) return false;
    return area.culturas.some(c => c.cultura?.descricao?.toLowerCase().includes('banana'));
  }, [area]);

  if (!area) return null;

  const categoriaConfig = getCategoriaConfig(area.categoria);

  // Colunas da tabela de culturas
  const culturasCols = [
    {
      title: 'Cultura',
      dataIndex: ['cultura', 'descricao'],
      key: 'cultura',
      render: (text) => (
        <Text strong style={{ color: "#059669" }}>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: 'Periodicidade',
      dataIndex: ['cultura', 'periodicidade'],
      key: 'periodicidade',
      render: (tipo) => (
        <Tag color={tipo === 'PERENE' ? 'green' : 'blue'}>
          {tipo === 'PERENE' ? 'Perene' : 'Temporária'}
        </Tag>
      ),
    },
    {
      title: 'Área Plantada',
      dataIndex: 'areaPlantada',
      key: 'areaPlantada',
      align: 'right',
      render: (area) => (
        <Text>{numberFormatter(area)} ha</Text>
      ),
    },
    {
      title: 'Área Produzindo',
      dataIndex: 'areaProduzindo',
      key: 'areaProduzindo',
      align: 'right',
      render: (area) => (
        <Text strong style={{ color: "#059669" }}>
          {numberFormatter(area)} ha
        </Text>
      ),
    },
  ];

  // Colunas da tabela de pedidos
  const pedidosCols = [
    {
      title: 'Nº Pedido',
      dataIndex: 'numeroPedido',
      key: 'numeroPedido',
      width: 100,
      render: (text) => (
        <Text strong style={{ color: '#059669' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Data',
      dataIndex: 'dataPedido',
      key: 'dataPedido',
      width: 100,
      render: (data) => formatarData(data),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'left',
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} style={{ textAlign: 'center' }}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Valor',
      dataIndex: 'valorFinal',
      key: 'valorFinal',
      width: 120,
      align: 'right',
      render: (valor) => (
        <Text strong style={{ color: valor ? '#059669' : '#999' }}>
          {formatarValorMonetario(valor || 0)}
        </Text>
      ),
    },
  ];

  // Colunas da tabela de principais clientes
  const clientesCols = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      align: 'center',
      render: (_, __, index) => (
        <Text strong style={{ color: '#059669' }}>
          {index + 1}º
        </Text>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: 'nome',
      key: 'nome',
      ellipsis: true,
    },
    {
      title: 'Pedidos',
      dataIndex: 'totalPedidos',
      key: 'totalPedidos',
      width: 80,
      align: 'center',
      render: (total) => (
        <Tag color="blue">{total}</Tag>
      ),
    },
    {
      title: 'Total Faturado',
      dataIndex: 'totalFaturamento',
      key: 'totalFaturamento',
      width: 140,
      align: 'right',
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatarValorMonetario(valor)}
        </Text>
      ),
    },
  ];

  // Colunas da tabela de custos de colheita
  const custosCols = [
    {
      title: 'Turma/Colhedor',
      dataIndex: ['turma', 'nomeColhedor'],
      key: 'turma',
      width: 150,
      render: (nome) => (
        <Text strong>{nome || '-'}</Text>
      ),
    },
    {
      title: 'Pedido',
      dataIndex: ['pedido', 'numeroPedido'],
      key: 'pedido',
      width: 120,
    },
    {
      title: 'Fruta',
      dataIndex: ['fruta', 'nome'],
      key: 'fruta',
      width: 120,
    },
    {
      title: 'Quantidade',
      key: 'quantidade',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Text>
          {numberFormatter(record.quantidadeColhida)} {record.unidadeMedida}
        </Text>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valorColheita',
      key: 'valorColheita',
      width: 120,
      align: 'right',
      render: (valor) => (
        <Text strong style={{ color: '#ef4444' }}>
          {formatarValorMonetario(valor || 0)}
        </Text>
      ),
    },
    {
      title: 'Pago',
      dataIndex: 'pagamentoEfetuado',
      key: 'pagamentoEfetuado',
      width: 80,
      align: 'center',
      render: (pago) => (
        <Tag color={pago ? 'success' : 'error'}>
          {pago ? 'Sim' : 'Não'}
        </Tag>
      ),
    },
  ];

  // Colunas da tabela de controle de banana
  const fitasCols = [
    {
      title: 'Fita',
      key: 'fita',
      width: 150,
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: record.fitaBanana?.corHex || '#52c41a',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
            }}
          />
          <Text strong>{record.fitaBanana?.nome || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Qtd. Atual',
      dataIndex: 'quantidadeFitas',
      key: 'quantidadeFitas',
      width: 100,
      align: 'center',
      render: (qtd) => (
        <Tag color="blue">{qtd} und</Tag>
      ),
    },
    {
      title: 'Qtd. Inicial',
      dataIndex: 'quantidadeInicialFitas',
      key: 'quantidadeInicialFitas',
      width: 100,
      align: 'center',
      render: (qtd) => (
        <Text type="secondary">{qtd} und</Text>
      ),
    },
    {
      title: 'Data Registro',
      dataIndex: 'dataRegistro',
      key: 'dataRegistro',
      width: 120,
      render: (data) => formatarData(data),
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      key: 'observacoes',
      ellipsis: true,
      render: (obs) => (
        <Text type="secondary" style={{ fontStyle: 'italic' }}>
          {obs || '-'}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span
          style={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}
        >
          <EnvironmentOutlined style={{ marginRight: "0.5rem" }} />
          Detalhes da Área: {area.nome}
        </span>
      }
      open={open}
      onCancel={handleClose}
      footer={
        <Button onClick={handleClose} size={isMobile ? "small" : "large"}>
          Fechar
        </Button>
      }
      width={isMobile ? "95vw" : "90%"}
      style={{ maxWidth: isMobile ? "95vw" : "80rem" }}
      centered
      destroyOnClose
      loading={loading}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1000 },
      }}
    >
      {/* Seção 1: Informações Básicas */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              Informações Básicas
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            borderBottom: "0.125rem solid #047857",
            padding: isMobile ? "6px 12px" : "8px 16px",
          },
          body: {
            padding: isMobile ? "12px" : "16px",
          },
        }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
          <Col xs={24} sm={12} md={8}>
            <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
              Nome da Área:
            </Text>
            <br />
            <Text
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                fontWeight: "600",
                color: "#059669",
                marginTop: "4px",
              }}
            >
              {area.nome}
            </Text>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
              Categoria:
            </Text>
            <br />
            <Tag
              color={categoriaConfig.color}
              style={{
                fontSize: "0.75rem",
                padding: "4px 10px",
                fontWeight: "500",
                marginTop: "4px",
              }}
            >
              {categoriaConfig.text}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
              Área Total:
            </Text>
            <br />
            <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
              {numberFormatter(area.areaTotal)} hectares
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Seção 2: Culturas Plantadas */}
      <Card
        title={
          <Space>
            <AppstoreOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              Culturas Plantadas
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            borderBottom: "0.125rem solid #047857",
            padding: isMobile ? "6px 12px" : "8px 16px",
          },
          body: {
            padding: isMobile ? "12px" : "16px",
          },
        }}
      >
        {area.culturas && area.culturas.length > 0 ? (
          <ResponsiveTable
            columns={culturasCols}
            dataSource={area.culturas}
            rowKey="id"
            pagination={false}
            minWidthMobile={600}
            showScrollHint={true}
          />
        ) : (
          <Empty description="Nenhuma cultura cadastrada" />
        )}
      </Card>

      {/* Seção 3: Estatísticas/KPIs */}
      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              Estatísticas
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            borderBottom: "0.125rem solid #047857",
            padding: isMobile ? "6px 12px" : "8px 16px",
          },
          body: {
            padding: isMobile ? "12px" : "16px",
          },
        }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          {/* Total de Pedidos */}
          <Col xs={12} sm={12} md={8}>
            <div
              style={{
                backgroundColor: "#f0f9ff",
                border: "2px solid #0ea5e9",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <ShoppingOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} />
              </div>
              <Text
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                TOTAL PEDIDOS
              </Text>
              <Text
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  display: "block",
                }}
              >
                {estatisticas.totalPedidos}
              </Text>
            </div>
          </Col>

          {/* Faturamento Total (Pagamentos Recebidos) */}
          <Col xs={12} sm={12} md={8}>
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "2px solid #22c55e",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <DollarOutlined style={{ fontSize: "24px", color: "#22c55e" }} />
              </div>
              <Tooltip title="Soma dos pagamentos recebidos">
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                    cursor: "help",
                  }}
                >
                  FATURAMENTO
                </Text>
              </Tooltip>
              <Text
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#15803d",
                  display: "block",
                }}
              >
                {formatarValorMonetario(estatisticas.totalFaturamento)}
              </Text>
            </div>
          </Col>

          {/* Total Custos */}
          <Col xs={12} sm={12} md={8}>
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "2px solid #ef4444",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <DollarOutlined style={{ fontSize: "24px", color: "#ef4444" }} />
              </div>
              <Text
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                CUSTOS COLHEITA
              </Text>
              <Text
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#dc2626",
                  display: "block",
                }}
              >
                {formatarValorMonetario(estatisticas.totalCustos)}
              </Text>
            </div>
          </Col>

          {/* 
            ⚠️ CARD DE MARGEM BRUTA - OCULTO
            
            Motivo: A margem bruta pode não refletir a realidade completa da operação,
            pois considera apenas custos de colheita. Outros custos operacionais
            (insumos, manutenção, irrigação, etc.) não estão incluídos neste cálculo.
            
            Para habilitar este card, descomente o código abaixo e ajuste o md={8} 
            dos outros cards para md={6} para manter layout 4x2.
          */}
          {/* 
          <Col xs={12} sm={12} md={6}>
            <div
              style={{
                backgroundColor: estatisticas.margemBruta >= 0 ? "#f0fdf4" : "#fef2f2",
                border: estatisticas.margemBruta >= 0 ? "2px solid #22c55e" : "2px solid #ef4444",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                boxShadow: estatisticas.margemBruta >= 0 
                  ? "0 2px 8px rgba(34, 197, 94, 0.15)"
                  : "0 2px 8px rgba(239, 68, 68, 0.15)",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <BarChartOutlined 
                  style={{ 
                    fontSize: "24px", 
                    color: estatisticas.margemBruta >= 0 ? "#22c55e" : "#ef4444"
                  }} 
                />
              </div>
              <Tooltip title="Faturamento - Custos de Colheita (não inclui outros custos operacionais)">
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                    cursor: "help",
                  }}
                >
                  MARGEM BRUTA
                </Text>
              </Tooltip>
              <Text
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: estatisticas.margemBruta >= 0 ? "#15803d" : "#dc2626",
                  display: "block",
                }}
              >
                {formatarValorMonetario(estatisticas.margemBruta)}
              </Text>
            </div>
          </Col>
          */}

          {/* Ticket Médio */}
          <Col xs={12} sm={12} md={8}>
            <div
              style={{
                backgroundColor: "#fefbef",
                border: "2px solid #f59e0b",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <DollarOutlined style={{ fontSize: "24px", color: "#f59e0b" }} />
              </div>
              <Tooltip title="Média de faturamento por pedido pago">
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                    cursor: "help",
                  }}
                >
                  TICKET MÉDIO
                </Text>
              </Tooltip>
              <Text
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#d97706",
                  display: "block",
                }}
              >
                {formatarValorMonetario(estatisticas.ticketMedio)}
              </Text>
            </div>
          </Col>

          {/* Valor Inadimplente (>30 dias) - Clicável */}
          <Col xs={12} sm={12} md={8}>
            <Tooltip title="Clique para ver pedidos vencidos">
              <div
                onClick={handleClickVencidos}
                style={{
                  backgroundColor: (estatisticas.valorInadimplente || 0) === 0 ? "#f0fdf4" : "#fef2f2",
                  border: (estatisticas.valorInadimplente || 0) === 0 ? "2px solid #22c55e" : "2px solid #ef4444",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  boxShadow: (estatisticas.valorInadimplente || 0) === 0
                    ? "0 2px 8px rgba(34, 197, 94, 0.15)"
                    : "0 2px 8px rgba(239, 68, 68, 0.15)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = (estatisticas.valorInadimplente || 0) === 0
                    ? "0 4px 12px rgba(34, 197, 94, 0.25)"
                    : "0 4px 12px rgba(239, 68, 68, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = (estatisticas.valorInadimplente || 0) === 0
                    ? "0 2px 8px rgba(34, 197, 94, 0.15)"
                    : "0 2px 8px rgba(239, 68, 68, 0.15)";
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <CalendarOutlined 
                    style={{ 
                      fontSize: "24px", 
                      color: (estatisticas.valorInadimplente || 0) === 0 ? "#22c55e" : "#ef4444"
                    }} 
                  />
                </div>
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  VALOR ATRASADO
                </Text>
                <Text
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: (estatisticas.valorInadimplente || 0) === 0 ? "#15803d" : "#dc2626",
                    display: "block",
                  }}
                >
                  {formatarValorMonetario(estatisticas.valorInadimplente || 0)}
                </Text>
              </div>
            </Tooltip>
          </Col>

          {/* Taxa Inadimplência (%) - Clicável */}
          <Col xs={12} sm={12} md={8}>
            <Tooltip title="Clique para ver pedidos vencidos">
              <div
                onClick={handleClickVencidos}
                style={{
                  backgroundColor: estatisticas.taxaInadimplencia < 10 ? "#f0fdf4" : "#fef2f2",
                  border: estatisticas.taxaInadimplencia < 10 ? "2px solid #22c55e" : "2px solid #ef4444",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  boxShadow: estatisticas.taxaInadimplencia < 10
                    ? "0 2px 8px rgba(34, 197, 94, 0.15)"
                    : "0 2px 8px rgba(239, 68, 68, 0.15)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = estatisticas.taxaInadimplencia < 10
                    ? "0 4px 12px rgba(34, 197, 94, 0.25)"
                    : "0 4px 12px rgba(239, 68, 68, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = estatisticas.taxaInadimplencia < 10
                    ? "0 2px 8px rgba(34, 197, 94, 0.15)"
                    : "0 2px 8px rgba(239, 68, 68, 0.15)";
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <InfoCircleOutlined 
                    style={{ 
                      fontSize: "24px", 
                      color: estatisticas.taxaInadimplencia < 10 ? "#22c55e" : "#ef4444"
                    }} 
                  />
                </div>
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  % INADIMPLÊNCIA
                </Text>
                <Text
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: estatisticas.taxaInadimplencia < 10 ? "#15803d" : "#dc2626",
                    display: "block",
                  }}
                >
                  {estatisticas.taxaInadimplencia.toFixed(1)}%
                </Text>
              </div>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* Seção 4: Faturamento Mensal */}
      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              Faturamento x Custos - Últimos Meses
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            borderBottom: "0.125rem solid #047857",
            padding: isMobile ? "6px 12px" : "8px 16px",
          },
          body: {
            padding: isMobile ? "12px" : "16px",
          },
        }}
      >
        {dadosFaturamentoMensal.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosFaturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <RechartsTooltip
                formatter={(value) => formatarValorMonetario(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="faturamento"
                stroke="#059669"
                strokeWidth={2}
                name="Faturamento"
              />
              <Line
                type="monotone"
                dataKey="custos"
                stroke="#ef4444"
                strokeWidth={2}
                name="Custos"
              />
              <Line
                type="monotone"
                dataKey="margem"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Margem"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="Sem dados de faturamento" />
        )}
      </Card>

      {/* Seção 5: Produção por Mês e Fruta */}
      {unidadesDisponiveis.length > 0 && dadosProducaoMensal.length > 0 && (
        <Card
          title={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              gap: isMobile ? '8px' : '0'
            }}>
              <Space>
                <BarChartOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>
                  Produção Mensal por Fruta
                </span>
              </Space>
              
              {/* Toggle de unidades - só aparece se houver múltiplas */}
              {temMultiplasUnidades && (
                <Space size={isMobile ? "small" : "middle"}>
                  {unidadesDisponiveis.map(unidade => (
                    <Button
                      key={unidade}
                      size="small"
                      type={unidadeSelecionada === unidade ? "primary" : "default"}
                      onClick={() => setUnidadeSelecionada(unidade)}
                      style={{
                        backgroundColor: unidadeSelecionada === unidade ? "#ffffff" : "transparent",
                        color: unidadeSelecionada === unidade ? "#059669" : "#ffffff",
                        borderColor: "#ffffff",
                        fontWeight: unidadeSelecionada === unidade ? "600" : "400",
                        fontSize: isMobile ? "0.6875rem" : "0.75rem",
                        height: isMobile ? "24px" : "28px",
                        padding: isMobile ? "0 8px" : "0 12px",
                      }}
                    >
                      {unidade}
                    </Button>
                  ))}
                </Space>
              )}
            </div>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={dadosProducaoMensal}
              barSize={60}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="mes"
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <RechartsTooltip
                formatter={(value, name) => {
                  return [`${numberFormatter(value)} ${unidadeSelecionada}`, name];
                }}
              />
              <Legend />
              {frutasUnicas.map((fruta, index) => (
                <Bar 
                  key={fruta}
                  dataKey={fruta}
                  fill={COLORS[index % COLORS.length]}
                  name={fruta}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          
          {/* Informação da unidade de medida - só aparece se NÃO houver toggle */}
          {!temMultiplasUnidades && (
            <div style={{ 
              marginTop: '12px', 
              textAlign: 'center',
              padding: '8px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #e0e7ff'
            }}>
              <Text style={{ fontSize: '13px', color: '#64748b' }}>
                📊 Unidade: <Text strong style={{ color: '#059669' }}>
                  {unidadeSelecionada}
                </Text>
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Seção 6: Principais Clientes */}
      {principaisClientes.length > 0 && (
        <Card
          title={
            <Space>
              <TeamOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Principais Clientes (Top 10)
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          <ResponsiveTable
            columns={clientesCols}
            dataSource={principaisClientes}
            rowKey="id"
            pagination={false}
            minWidthMobile={500}
            showScrollHint={true}
          />
        </Card>
      )}

      {/* Seção 7: Pedidos com Filtros */}
      <div ref={secaoPedidosRef}>
        <Card
          title={
            <Space>
              <ShoppingOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Pedidos da Área
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
        {/* Filtros */}
        <div
          style={{
            padding: isMobile ? "12px" : "16px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #e8e8e8",
            marginBottom: "16px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <Text strong style={{ color: "#059669", fontSize: isMobile ? "0.875rem" : "1rem" }}>
              <FilterOutlined style={{ marginRight: 8 }} />
              Filtros de Busca
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              gap: isMobile ? "8px" : "16px",
              marginBottom: 0,
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={{ flex: isMobile ? "1 1 100%" : "1 1 240px" }}>
              <Text
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                  fontSize: isMobile ? "0.8125rem" : "0.875rem",
                }}
              >
                Data de Criação:
              </Text>
              <RangePicker
                placeholder={["Data Início", "Data Fim"]}
                format="DD/MM/YYYY"
                size={isMobile ? "small" : "middle"}
                style={{
                  width: "100%",
                  height: isMobile ? "32px" : "40px",
                }}
                onChange={(dates) => {
                  setFiltroDataInicio(dates?.[0] || null);
                  setFiltroDataFim(dates?.[1] || null);
                }}
              />
            </div>

            <div style={{ flex: isMobile ? "1 1 100%" : "0 0 200px" }}>
              <Text
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                  fontSize: isMobile ? "0.8125rem" : "0.875rem",
                }}
              >
                Status:
              </Text>
              <Select
                placeholder="Status"
                value={filtroStatus}
                allowClear
                size={isMobile ? "small" : "middle"}
                style={{
                  width: "100%",
                  height: isMobile ? "32px" : "40px",
                }}
                onChange={(value) => setFiltroStatus(value)}
              >
                <Option value="VENCIDOS" style={{ backgroundColor: "#fef2f2" }}>
                  <Space>
                    <CalendarOutlined style={{ color: "#ef4444" }} />
                    <Text strong style={{ color: "#ef4444" }}>
                      Vencidos
                    </Text>
                  </Space>
                </Option>
                <Option value="PEDIDO_CRIADO">Pedido Criado</Option>
                <Option value="AGUARDANDO_COLHEITA">Aguardando Colheita</Option>
                <Option value="COLHEITA_REALIZADA">Colheita Realizada</Option>
                <Option value="AGUARDANDO_PRECIFICACAO">Aguardando Precificação</Option>
                <Option value="PRECIFICACAO_REALIZADA">Precificação Realizada</Option>
                <Option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</Option>
                <Option value="PAGAMENTO_PARCIAL">Pagamento Parcial</Option>
                <Option value="PAGAMENTO_REALIZADO">Pagamento Realizado</Option>
                <Option value="PEDIDO_FINALIZADO">Pedido Finalizado</Option>
                <Option value="CANCELADO">Cancelado</Option>
              </Select>
            </div>

            <div style={{ flex: isMobile ? "1 1 100%" : "0 0 200px" }}>
              <Text
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                  fontSize: isMobile ? "0.8125rem" : "0.875rem",
                }}
              >
                Cliente:
              </Text>
              <Select
                placeholder="Cliente"
                allowClear
                showSearch
                optionFilterProp="children"
                size={isMobile ? "small" : "middle"}
                style={{
                  width: "100%",
                  height: isMobile ? "32px" : "40px",
                }}
                onChange={(value) => setFiltroCliente(value)}
              >
                {clientesUnicos.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.nome}
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
              <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>
              <Button
                icon={<CloseOutlined />}
                onClick={limparFiltros}
                size={isMobile ? "small" : "middle"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {pedidosFiltrados.length > 0 ? (
          <ResponsiveTable
            columns={pedidosCols}
            dataSource={pedidosFiltrados}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            minWidthMobile={800}
            showScrollHint={true}
          />
        ) : (
          <Empty description="Nenhum pedido encontrado com os filtros aplicados" />
        )}
      </Card>
      </div>

      {/* Seção 8: Custos de Colheita */}
      {area.custosColheita && area.custosColheita.length > 0 && (
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Custos de Colheita
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          <ResponsiveTable
            columns={custosCols}
            dataSource={area.custosColheita}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            minWidthMobile={900}
            showScrollHint={true}
          />
        </Card>
      )}

      {/* Seção 9: Controle de Banana (apenas se tiver banana) */}
      {temBanana && area.controlesBanana && area.controlesBanana.length > 0 && (
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Controle de Banana - Fitas
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          <ResponsiveTable
            columns={fitasCols}
            dataSource={area.controlesBanana}
            rowKey="id"
            pagination={false}
            minWidthMobile={700}
            showScrollHint={true}
          />
        </Card>
      )}
    </Modal>
  );
};

DetalhesAreaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  area: PropTypes.object,
  loading: PropTypes.bool,
};

export default DetalhesAreaModal;

