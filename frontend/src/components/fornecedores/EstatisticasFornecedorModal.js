// src/components/fornecedores/EstatisticasFornecedorModal.js

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Card, Row, Col, Statistic, Table, Tag, Space, Typography, Spin, Divider, Button, Tooltip, Input, DatePicker, Empty } from "antd";
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
  MessageOutlined,
  InfoCircleOutlined,
  HeatMapOutlined
} from "@ant-design/icons";
import PropTypes from "prop-types";
import styled from "styled-components";
import Chart from "react-apexcharts";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency, capitalizeName } from "../../utils/formatters";
import MiniSelectPersonalizavel from "../common/MiniComponents/MiniSelectPersonalizavel";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import useResponsive from "../../hooks/useResponsive";
import { PDFButton, SecondaryButton } from "../common/buttons";
import moment from "moment";
import PDFIcon from "../Icons/PDFIcon";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
  // ✅ Mantemos o código do gráfico, mas deixamos oculto por enquanto (para testes)
  const mostrarGrafico = false;
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState(null);
  const [intervaloMeses, setIntervaloMeses] = useState(6);
  const [dadosGrafico, setDadosGrafico] = useState(null);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroDataColheita, setFiltroDataColheita] = useState(null);

  useEffect(() => {
    if (open && fornecedorId) {
      fetchEstatisticas();
    }
  }, [open, fornecedorId]);

  useEffect(() => {
    if (!open) {
      // Limpar dados e filtros quando modal fechar
      setEstatisticas(null);
      setFiltroBusca('');
      setFiltroDataColheita(null);
    }
  }, [open]);

  useEffect(() => {
    if (mostrarGrafico && estatisticas && estatisticas.detalhes) {
      processarDadosGrafico();
    }
  }, [estatisticas, intervaloMeses, mostrarGrafico]);

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
      render: (text) => (
        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
          {text}
        </Text>
      ),
      sorter: (a, b) => (a.pedido || "").localeCompare(b.pedido || ""),
    },
    {
      title: "Data Colheita",
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
      title: "Data Pagamento",
      dataIndex: "dataPagamento",
      key: "dataPagamento",
      width: 130,
      render: (date) => (
        date ? (
          <Space>
            <CalendarOutlined style={{ color: "#52c41a" }} />
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
          <Text>{capitalizeName(text || '')}</Text>
        </Space>
      ),
    },
    {
      title: "Área",
      dataIndex: "areaNome",
      key: "areaNome",
      width: 150,
      ellipsis: true,
      render: (text) => <Text>{capitalizeName(text || '')}</Text>,
    },
    {
      title: "Quantidade",
      dataIndex: "quantidade",
      key: "quantidade",
      width: 90,
      render: (value, record) => (
        <Text strong>
          {value.toLocaleString('pt-BR')} {record.unidade}
        </Text>
      ),
    },
    {
      title: (
        <Space size={6}>
          <span>Valor Unitário</span>
          <Tooltip
            title="Valor unitário de compra do fornecedor. Ele é definido no processo de precificação/pagamento no modal de Pagamentos do Fornecedor. Se a colheita não foi precificada, fica vazio."
            placement="top"
          >
            <InfoCircleOutlined style={{ color: "#ffffff" }} />
          </Tooltip>
        </Space>
      ),
      key: "valorUnitario",
      width: 120,
      render: (_, record) => {
        // ✅ Importante: valorUnitario vem do pagamento do fornecedor (precificação/pagamento).
        // Se não houver precificação, não exibimos cálculo "estimado".
        const valorUnitario = record.valorUnitario;
        return (
          <Text style={{ color: "#059669", fontWeight: 500 }}>
            {typeof valorUnitario === "number" && Number.isFinite(valorUnitario) && valorUnitario > 0
              ? `R$ ${formatCurrency(valorUnitario)}`
              : "-"}
          </Text>
        );
      },
    },
    {
      title: "Valor",
      key: "valor",
      width: 90,
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
      width: 90,
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
      width: 190,
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
    {
      title: "PDF",
      key: "pdf",
      width: 60,
      align: "center",
      render: (_, record) => {
        const handleGerarPDFItem = () => {
          showNotification(
            'info', 
            'Em Desenvolvimento', 
            `A funcionalidade de gerar PDF para a colheita ${record.id} ainda está em desenvolvimento.`
          );
        };

        return (
          <PDFIcon
            onClick={handleGerarPDFItem}
            tooltip="Gerar PDF desta colheita"
            fontSize={18}
            color="#dc2626"
          />
        );
      },
    },
  ];

  // Filtrar detalhes baseado nos filtros de busca e data
  const detalhesFiltrados = useMemo(() => {
    if (!estatisticas?.detalhes) return [];

    let lista = [...estatisticas.detalhes];

    // Filtro de busca por pedido, fruta, área e quantidade
    if (filtroBusca.trim()) {
      const termo = filtroBusca.trim().toLowerCase();
      lista = lista.filter(item => {
        const numeroPedido = (item.pedido || '').toLowerCase();
        const nomeFruta = (item.fruta || '').toLowerCase();
        const nomeArea = (item.areaNome || '').toLowerCase();
        const quantidade = (item.quantidade || 0).toString().toLowerCase();

        return (
          numeroPedido.includes(termo) ||
          nomeFruta.includes(termo) ||
          nomeArea.includes(termo) ||
          quantidade.includes(termo)
        );
      });
    }

    // Filtro por range de data de colheita
    if (filtroDataColheita && filtroDataColheita.length === 2 && filtroDataColheita[0] && filtroDataColheita[1]) {
      const [inicio, fim] = filtroDataColheita;
      lista = lista.filter(item => {
        if (!item.dataColheita) return false;
        const data = moment(item.dataColheita);
        return data.isSameOrAfter(inicio, 'day') && data.isSameOrBefore(fim, 'day');
      });
    }

    return lista;
  }, [estatisticas, filtroBusca, filtroDataColheita]);

  // ✅ A partir daqui, tudo (resumos/cards/estatísticas) deve obedecer aos filtros.
  const resumoFiltrado = useMemo(() => {
    const lista = detalhesFiltrados || [];

    const totaisPorUnidade = {};
    let quantidadeTotal = 0;
    let quantidadePaga = 0;
    let quantidadePrecificada = 0;
    let quantidadeNaoPrecificada = 0;
    let valorTotal = 0;
    let valorPago = 0;
    let valorPrecificado = 0;

    const pedidosSet = new Set();
    const frutasSet = new Set();

    lista.forEach((item) => {
      const unidade = item.unidade || "UN";
      const quantidade = Number(item.quantidade) || 0;
      const valorItem = Number(item.valorTotal) || 0;

      if (!totaisPorUnidade[unidade]) {
        totaisPorUnidade[unidade] = {
          quantidade: 0,
          quantidadePaga: 0,
          quantidadePrecificada: 0,
          quantidadeNaoPrecificada: 0,
          valor: 0,
          valorPago: 0,
          valorPrecificado: 0,
          valorNaoPrecificado: 0,
        };
      }

      // Identificadores
      if (item.pedido) pedidosSet.add(item.pedido);
      if (item.fruta) frutasSet.add(item.fruta);

      // Totais gerais
      quantidadeTotal += quantidade;
      totaisPorUnidade[unidade].quantidade += quantidade;

      // Status de pagamento (mesma regra usada no componente para pago/precificado)
      const temPagamentoId =
        item.pagamentoId !== undefined &&
        item.pagamentoId !== null &&
        typeof item.pagamentoId === "number" &&
        item.pagamentoId > 0;
      const statusPago = item.statusPagamento === "PAGO";
      const statusPendente = item.statusPagamento === "PENDENTE" || item.statusPagamento === "PROCESSANDO";

      if (temPagamentoId && statusPago) {
        quantidadePaga += quantidade;
        totaisPorUnidade[unidade].quantidadePaga += quantidade;

        valorPago += valorItem;
        totaisPorUnidade[unidade].valorPago += valorItem;

        valorTotal += valorItem;
        totaisPorUnidade[unidade].valor += valorItem;
      } else if (temPagamentoId && statusPendente) {
        quantidadePrecificada += quantidade;
        totaisPorUnidade[unidade].quantidadePrecificada += quantidade;

        valorPrecificado += valorItem;
        totaisPorUnidade[unidade].valorPrecificado += valorItem;

        valorTotal += valorItem;
        totaisPorUnidade[unidade].valor += valorItem;
      } else {
        quantidadeNaoPrecificada += quantidade;
        totaisPorUnidade[unidade].quantidadeNaoPrecificada += quantidade;
        // Valor não precificado permanece 0 (valores só vêm da tabela de pagamentos)
      }
    });

    return {
      totaisPorUnidade,
      totalGeral: {
        quantidade: quantidadeTotal,
        quantidadePaga,
        quantidadePrecificada,
        quantidadeNaoPrecificada,
        valor: valorTotal,
        valorPago,
        valorPrecificado,
        valorNaoPrecificado: 0,
        totalPedidos: pedidosSet.size,
        totalFrutas: frutasSet.size,
      },
    };
  }, [detalhesFiltrados]);

  const estatisticasTabelaFiltradas = useMemo(() => {
    const lista = detalhesFiltrados || [];

    const quantidadesPorUnidade = {};
    let somaValorUnitario = 0;
    let qtdComValorUnitario = 0;

    lista.forEach((item) => {
      const unidade = item.unidade || "UN";
      const quantidade = Number(item.quantidade) || 0;
      quantidadesPorUnidade[unidade] = (quantidadesPorUnidade[unidade] || 0) + quantidade;

      const vu = item.valorUnitario;
      if (typeof vu === "number" && Number.isFinite(vu) && vu > 0) {
        somaValorUnitario += vu;
        qtdComValorUnitario += 1;
      }
    });

    const valorUnitarioMedio =
      qtdComValorUnitario > 0 ? somaValorUnitario / qtdComValorUnitario : null;

    return {
      quantidadesPorUnidade,
      quantidadeColheitas: lista.length,
      qtdComValorUnitario,
      valorUnitarioMedio,
      somaValorUnitario,
    };
  }, [detalhesFiltrados]);

  // Verificar se há filtros ativos
  const filtrosAtivos = useMemo(() => (
    Boolean(
      filtroBusca.trim() ||
      (filtroDataColheita && filtroDataColheita.length === 2 && filtroDataColheita[0] && filtroDataColheita[1])
    )
  ), [filtroBusca, filtroDataColheita]);

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroBusca('');
    setFiltroDataColheita(null);
  };

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
            Carregando colheitas...
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
            Colheitas realizadas no fornecedor - {fornecedorNome}
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

  const { detalhes } = estatisticas;
  const { totalGeral: totalGeralFiltrado, totaisPorUnidade: totaisPorUnidadeFiltrado } = resumoFiltrado;

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
          Colheitas realizadas no fornecedor - {fornecedorNome}
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
      {/* ✅ Busca e Filtros (agora no topo) */}
      {detalhes && detalhes.length > 0 && (
        <Card
          title={
            <Space>
              <FilterOutlined style={{ color: "#ffffff" }} />
              <span style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: isMobile ? "14px" : "16px"
              }}>
                {isMobile ? "Buscar" : "Busca e Filtros"}
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          }}
          bodyStyle={{ padding: isMobile ? "12px" : "16px" }}
        >
          <Row gutter={[isMobile ? 8 : 16, 16]} wrap={isMobile}>
            <Col xs={24} sm={24} md={15}>
              <Input
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Buscar por pedido, fruta, área ou quantidade"
                allowClear
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
                prefix={<FilterOutlined style={{ color: "#059669" }} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                value={filtroDataColheita}
                onChange={(value) => setFiltroDataColheita(value)}
                allowClear
                format="DD/MM/YYYY"
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
                disabledDate={(current) => current && current > moment().endOf('day')}
                placeholder={['Data Início', 'Data Fim']}
              />
            </Col>
            <Col xs={24} sm={12} md={3}>
              <SecondaryButton
                icon={<FilterOutlined />}
                onClick={limparFiltros}
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
                disabled={!filtrosAtivos}
              >
                Limpar
              </SecondaryButton>
            </Col>
          </Row>
        </Card>
      )}

      {/* Seletor de Intervalo e Gráfico (oculto para testes, sem remover) */}
      {mostrarGrafico && (
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
      )}

      {/* Totais por Unidade */}
      {Object.keys(totaisPorUnidadeFiltrado || {}).length > 0 && (
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
            {Object.entries(totaisPorUnidadeFiltrado).map(([unidade, total]) => (
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
          {detalhesFiltrados.length > 0 ? (
            <>
              <StyledTable
                columns={columns}
                dataSource={detalhesFiltrados}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="middle"
                bordered={true}
                scroll={{ x: 'max-content' }}
              />

              {/* ✅ Estatísticas consolidadas (obedecendo filtros) */}
              <Divider style={{ margin: isMobile ? "16px 0" : "24px 0" }} />
              <div style={{
                backgroundColor: "#ecfdf5",
                border: "2px solid #10b981",
                borderRadius: "12px",
                padding: isMobile ? "16px" : "20px",
                marginTop: "8px"
              }}>
                <Title level={5} style={{ 
                  color: "#059669", 
                  marginBottom: isMobile ? "12px" : "16px", 
                  marginTop: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <CalculatorOutlined />
                  Estatísticas Consolidadas
                </Title>
                
                <Row gutter={[isMobile ? 8 : 12, isMobile ? 12 : 16]}>
                  {/* Quantidades por Unidade */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: isMobile ? "12px" : "16px",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <AppleOutlined style={{ fontSize: "18px", color: "#16a34a" }} />
                        <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block" }}>
                          QTD POR UNIDADE
                        </Text>
                      </div>
                      {Object.keys(estatisticasTabelaFiltradas.quantidadesPorUnidade || {}).length > 0 ? (
                        <div style={{ 
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          alignItems: "center"
                        }}>
                          {Object.entries(estatisticasTabelaFiltradas.quantidadesPorUnidade || {}).map(([unidade, qtd], index) => (
                            <React.Fragment key={unidade}>
                              <div style={{ 
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                              }}>
                                <Text style={{ 
                                  fontSize: isMobile ? "16px" : "18px", 
                                  fontWeight: "700", 
                                  color: "#059669",
                                  display: "block",
                                  lineHeight: "1"
                                }}>
                                  {Number(qtd || 0).toLocaleString("pt-BR")}
                                </Text>
                                <Text style={{ 
                                  fontSize: "10px", 
                                  color: "#64748b", 
                                  display: "block",
                                  marginTop: "2px"
                                }}>
                                  {unidade}
                                </Text>
                              </div>
                              {index < Object.entries(estatisticasTabelaFiltradas.quantidadesPorUnidade || {}).length - 1 && (
                                <div style={{
                                  width: "4px",
                                  height: "4px",
                                  backgroundColor: "#94a3b8",
                                  borderRadius: "50%",
                                  flexShrink: 0
                                }} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <Text style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                          Nenhuma quantidade
                        </Text>
                      )}
                    </div>
                  </Col>

                  {/* Valor Total */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <DollarOutlined style={{ fontSize: "20px", color: "#16a34a", marginBottom: "6px" }} />
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        VALOR TOTAL
                      </Text>
                      <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#059669", display: "block" }}>
                        R$ {formatCurrency(totalGeralFiltrado.valor || 0)}
                      </Text>
                    </div>
                  </Col>

                  {/* Valor Pago */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "2px solid #52c41a",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <CheckCircleOutlined style={{ fontSize: "20px", color: "#52c41a", marginBottom: "6px" }} />
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        VALOR PAGO
                      </Text>
                      <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#52c41a", display: "block" }}>
                        R$ {formatCurrency(totalGeralFiltrado.valorPago || 0)}
                      </Text>
                    </div>
                  </Col>

                  {/* Valor Precificado */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#fffbeb",
                      border: "2px solid #faad14",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <ClockCircleOutlined style={{ fontSize: "20px", color: "#faad14", marginBottom: "6px" }} />
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        VALOR PRECIFICADO
                      </Text>
                      <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#faad14", display: "block" }}>
                        R$ {formatCurrency(totalGeralFiltrado.valorPrecificado || 0)}
                      </Text>
                    </div>
                  </Col>

                  {/* Valor Unitário Médio */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#fffbeb",
                      border: "2px solid #f59e0b",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      position: "relative"
                    }}>
                      <div style={{ marginBottom: "6px", display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" }}>
                        <DollarOutlined style={{ fontSize: "20px", color: "#f59e0b" }} />
                        <Tooltip
                          title={
                            estatisticasTabelaFiltradas.qtdComValorUnitario > 0
                              ? `Cálculo da Média: Soma dos valores unitários (R$ ${formatCurrency(estatisticasTabelaFiltradas.somaValorUnitario)}) dividido pela quantidade de colheitas com valor unitário (${estatisticasTabelaFiltradas.qtdComValorUnitario}). Fórmula: R$ ${formatCurrency(estatisticasTabelaFiltradas.somaValorUnitario)} ÷ ${estatisticasTabelaFiltradas.qtdComValorUnitario} = R$ ${formatCurrency(estatisticasTabelaFiltradas.valorUnitarioMedio)}. Apenas colheitas precificadas/pagas são consideradas no cálculo.`
                              : "A média é calculada somando todos os valores unitários das colheitas precificadas/pagas e dividindo pela quantidade de colheitas com valor unitário. Colheitas sem valor unitário não entram no cálculo."
                          }
                          placement="top"
                        >
                          <InfoCircleOutlined style={{ fontSize: "14px", color: "#f59e0b", cursor: "pointer" }} />
                        </Tooltip>
                      </div>
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        VALOR UNIT. MÉDIO
                      </Text>
                      <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#d97706", display: "block" }}>
                        {typeof estatisticasTabelaFiltradas.valorUnitarioMedio === "number" &&
                         Number.isFinite(estatisticasTabelaFiltradas.valorUnitarioMedio)
                          ? `R$ ${formatCurrency(estatisticasTabelaFiltradas.valorUnitarioMedio)}`
                          : "-"}
                      </Text>
                    </div>
                  </Col>

                  {/* Quantidade Não Precificada */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <AppleOutlined style={{ fontSize: "20px", color: "#8c8c8c", marginBottom: "6px" }} />
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        NÃO PRECIFICADA
                      </Text>
                      <Text style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#8c8c8c", display: "block" }}>
                        {(totalGeralFiltrado.quantidadeNaoPrecificada || 0).toLocaleString('pt-BR')}
                      </Text>
                      <Text style={{ fontSize: "10px", color: "#64748b", display: "block", marginTop: "2px" }}>
                        unidades
                      </Text>
                    </div>
                  </Col>

                  {/* Pedidos e Frutas */}
                  <Col xs={12} sm={8} md={6}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "2px solid #0ea5e9",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <ShoppingCartOutlined style={{ fontSize: "20px", color: "#0ea5e9", marginBottom: "6px" }} />
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        PEDIDOS / FRUTAS
                      </Text>
                      <Text style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#0ea5e9", display: "block" }}>
                        {totalGeralFiltrado.totalPedidos}
                      </Text>
                    </div>
                  </Col>

                  {/* Quantidade de Colheitas */}
                  <Col xs={12} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "2px solid #0ea5e9",
                      borderRadius: "8px",
                      padding: isMobile ? "10px" : "12px",
                      textAlign: "center",
                      minHeight: "75px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <HeatMapOutlined style={{ fontSize: "20px", color: "#0ea5e9", marginBottom: "6px" }} />
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        COLHEITAS
                      </Text>
                      <Text style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "700", color: "#0ea5e9", display: "block" }}>
                        {estatisticasTabelaFiltradas.quantidadeColheitas || 0}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filtrosAtivos 
                    ? "Nenhuma colheita encontrada com os filtros aplicados" 
                    : "Nenhuma colheita encontrada"
                }
              />
            </div>
          )}
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

