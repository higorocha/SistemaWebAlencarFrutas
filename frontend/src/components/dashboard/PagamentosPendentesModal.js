// src/components/dashboard/PagamentosPendentesModal.js

import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Button,
  Typography,
  Spin,
  Alert,
  Checkbox,
  Input,
  Divider,
  Tooltip,
  Empty,
  Select,
  DatePicker,
  Form
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  AppleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency, capitalizeNameShort, capitalizeName } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import { getFruitIcon } from "../../utils/fruitIcons";
import { MaskedDatePicker } from "../common/inputs";
import { SecondaryButton } from "../common/buttons";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import moment from "moment";
import { Box } from "@mui/material";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Styled components seguindo padrão do sistema - removido, usando ResponsiveTable

// Styled component para o spinner com animação
const SpinnerContainer = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Container removido - usando ResponsiveTable component

// Styled component para linha sendo paga (animação de saída)
const LinhaComAnimacao = styled.tr`
  ${props => props.$sendoPago && `
    animation: fadeOutPayment 0.8s ease-in-out;
    background-color: #f6ffed !important;

    @keyframes fadeOutPayment {
      0% { background-color: #ffffff; opacity: 1; transform: scale(1); }
      50% { background-color: #52c41a; opacity: 0.8; transform: scale(1.02); }
      100% { background-color: #f6ffed; opacity: 0.6; transform: scale(0.98); }
    }
  `}

  ${props => props.$comCheckmark && `
    background-color: #f6ffed !important;

    .checkmark-container {
      animation: checkmarkAppear 0.6s ease-in-out;

      @keyframes checkmarkAppear {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
    }
  `}

  ${props => props.$itemPago && `
    background-color: #f6ffed !important;
    border-left: 4px solid #52c41a !important;
    opacity: 0.85;

    td {
      color: #52c41a !important;
      font-weight: 500;
    }

    .ant-tag {
      background-color: #f6ffed !important;
      border-color: #52c41a !important;
      color: #52c41a !important;
    }
  `}
`;

const PagamentosPendentesModal = ({
  open,
  onClose,
  turmaId,
  turmaNome,
  onPagamentosProcessados
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [dados, setDados] = useState(null);
  const [colheitasSelecionadas, setColheitasSelecionadas] = useState([]);
  const [observacoesPagamento, setObservacoesPagamento] = useState('');
  const [itensSendoPagos, setItensSendoPagos] = useState([]);
  const [itensComCheckmark, setItensComCheckmark] = useState([]);
  const [pagamentosProcessados, setPagamentosProcessados] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [dataPagamentoSelecionada, setDataPagamentoSelecionada] = useState(null);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState(null);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroDataColheita, setFiltroDataColheita] = useState(null);

  useEffect(() => {
    if (open && turmaId) {
      fetchDados();
    }
  }, [open, turmaId]);

  useEffect(() => {
    if (!open) {
      // Limpar dados quando modal fechar
      setDados(null);
      setColheitasSelecionadas([]);
      setObservacoesPagamento('');
      setItensSendoPagos([]);
      setItensComCheckmark([]);
      setPagamentosProcessados(false);
      setModalConfirmacaoAberto(false);
      setDataPagamentoSelecionada(null);
      setFormaPagamentoSelecionada(null);
      setFiltroBusca('');
      setFiltroDataColheita(null);
    }
  }, [open]);

  useEffect(() => {
    if (modalConfirmacaoAberto) {
      setDataPagamentoSelecionada(moment());
      setFormaPagamentoSelecionada('PIX');
    }
  }, [modalConfirmacaoAberto]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/turma-colheita/${turmaId}/pagamentos-pendentes`);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showNotification('error', 'Erro', 'Erro ao carregar dados da turma');
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar modal informando se houve pagamentos processados
  const fecharModal = () => {
    onClose(pagamentosProcessados);
  };

  const handleSelecaoColheita = (colheitaId, selecionada) => {
    // Verificar se o item já foi pago (não deve ser selecionável)
    const item = dados?.colheitas.find(c => c.id === colheitaId);
    if (item?.status === 'PAGO') {
      return; // Não permitir seleção de itens já pagos
    }

    if (selecionada) {
      setColheitasSelecionadas(prev => [...prev, colheitaId]);
    } else {
      setColheitasSelecionadas(prev => prev.filter(id => id !== colheitaId));
    }
  };


  const calcularTotalSelecionado = () => {
    if (!dados) return 0;
    return dados.colheitas
      .filter(c => colheitasSelecionadas.includes(c.id) && c.status !== 'PAGO')
      .reduce((acc, c) => acc + (c.valorColheita || 0), 0);
  };

  const colheitasFiltradas = useMemo(() => {
    if (!dados) return [];

    let lista = [...dados.colheitas];

    if (filtroBusca.trim()) {
      const termo = filtroBusca.trim().toLowerCase();
      lista = lista.filter(colheita => {
        const nomeCliente = (colheita.cliente?.nome || '').toLowerCase();
        const numeroPedido = (colheita.pedidoNumero || '').toLowerCase();
        const placa = (colheita.placaPrimaria || '').toLowerCase();

        return (
          nomeCliente.includes(termo) ||
          numeroPedido.includes(termo) ||
          placa.includes(termo)
        );
      });
    }

    if (filtroDataColheita && filtroDataColheita.length === 2 && filtroDataColheita[0] && filtroDataColheita[1]) {
      const [inicio, fim] = filtroDataColheita;
      lista = lista.filter(colheita => {
        if (!colheita.dataColheita) return false;
        const data = moment(colheita.dataColheita);
        return data.isSameOrAfter(inicio, 'day') && data.isSameOrBefore(fim, 'day');
      });
    }

    return lista;
  }, [dados, filtroBusca, filtroDataColheita]);

  // Função para calcular total colhido agrupado por unidade de medida
  const totaisColhidos = useMemo(() => {
    if (!dados) return [];

    const colheitasBase = colheitasSelecionadas.length > 0
      ? dados.colheitas.filter(colheita =>
          colheitasSelecionadas.includes(colheita.id) && colheita.status !== 'PAGO'
        )
      : colheitasFiltradas.filter(colheita => colheita.status !== 'PAGO');

    const totaisPorUnidade = colheitasBase.reduce((acc, colheita) => {
      const unidade = colheita.unidadeMedida || 'un';
      const quantidade = colheita.quantidadeColhida || 0;

      if (!acc[unidade]) {
        acc[unidade] = 0;
      }

      acc[unidade] += quantidade;
      return acc;
    }, {});

    return Object.entries(totaisPorUnidade).map(([unidade, total]) => ({
      unidade,
      total
    }));
  }, [dados, colheitasSelecionadas, colheitasFiltradas]);

  const limparFiltros = () => {
    setFiltroBusca('');
    setFiltroDataColheita(null);
  };

  const filtrosAtivos = useMemo(() => (
    Boolean(
      filtroBusca.trim() ||
      (filtroDataColheita && filtroDataColheita.length === 2 && filtroDataColheita[0] && filtroDataColheita[1])
    )
  ), [filtroBusca, filtroDataColheita]);

  const totalAPagar = useMemo(() => {
    if (!dados) return 0;

    if (colheitasSelecionadas.length > 0) {
      return dados.colheitas
        .filter(c => colheitasSelecionadas.includes(c.id) && c.status !== 'PAGO')
        .reduce((acc, c) => acc + (c.valorColheita || 0), 0);
    }

    return colheitasFiltradas
      .filter(colheita => colheita.status !== 'PAGO')
      .reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);
  }, [dados, colheitasSelecionadas, colheitasFiltradas]);



  // Função para abrir modal de confirmação
  const abrirModalConfirmacao = () => {
    setModalConfirmacaoAberto(true);
  };

  // Função para processar pagamentos (após confirmação)
  const processarPagamentos = async () => {
    if (!dataPagamentoSelecionada) {
      showNotification('error', 'Validação', 'Selecione a data do pagamento.');
      return;
    }

    if (!formaPagamentoSelecionada) {
      showNotification('error', 'Validação', 'Selecione a forma de pagamento.');
      return;
    }

    try {
      // Fechar modal de confirmação
      setModalConfirmacaoAberto(false);

      setLoadingPagamento(true);

      // Se nenhuma seleção, pagar todas as colheitas PENDENTES
      const itensDisponiveis = dados.colheitas.filter(c => c.status !== 'PAGO');
      const idsParaPagar = colheitasSelecionadas.length > 0
        ? colheitasSelecionadas
        : itensDisponiveis.map(c => c.id);

      // Marcar itens como sendo pagos (animação de saída)
      setItensSendoPagos(idsParaPagar);

      // Aguardar animação de saída
      await new Promise(resolve => setTimeout(resolve, 200));

      const dadosPagamento = {
        colheitaIds: idsParaPagar,
        observacoes: observacoesPagamento.trim() || undefined,
        dataPagamento: dataPagamentoSelecionada
          ? dataPagamentoSelecionada.clone().startOf('day').add(12, 'hours').toISOString()
          : undefined,
        formaPagamento: formaPagamentoSelecionada || undefined
      };

      const response = await axiosInstance.patch(
        `/api/turma-colheita/${turmaId}/processar-pagamentos`,
        dadosPagamento
      );

      // Mostrar checkmark nos itens pagos
      setItensComCheckmark(idsParaPagar);
      setItensSendoPagos([]);

      // Aguardar animação do checkmark
      await new Promise(resolve => setTimeout(resolve, 300));

      // ATUALIZAR DADOS LOCALMENTE - marcar itens como PAGOS em vez de remover
      const colheitasAtualizadas = dados.colheitas.map(colheita => {
        if (idsParaPagar.includes(colheita.id)) {
          return { ...colheita, status: 'PAGO' };
        }
        return { ...colheita, status: colheita.status || 'PENDENTE' };
      });

      // Recalcular totais considerando apenas itens PENDENTES
      const colheitasPendentes = colheitasAtualizadas.filter(colheita => colheita.status === 'PENDENTE');
      const novoValorTotal = colheitasPendentes.reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);

      // Atualizar estado local
      setDados(prevDados => ({
        ...prevDados,
        colheitas: colheitasAtualizadas,
        resumo: {
          ...prevDados.resumo,
          valorTotalPendente: novoValorTotal,
          quantidadeColheitas: colheitasPendentes.length
        }
      }));

      const tipoOperacao = colheitasSelecionadas.length > 0 ? 'selecionados' : 'todos';
      showNotification(
        'success',
        'Pagamentos Processados',
        `${response.data.quantidadePagamentos} pagamento(s) ${tipoOperacao} processado(s). Total: ${formatCurrency(response.data.totalPago)}`
      );

      // Marcar que houve pagamentos processados
      setPagamentosProcessados(true);

      // Limpar seleções e estados de animação
      setColheitasSelecionadas([]);
      setObservacoesPagamento('');
      setItensComCheckmark([]);
      setDataPagamentoSelecionada(null);
      setFormaPagamentoSelecionada(null);

      // Chamar callback para atualizar dados no componente pai
      if (onPagamentosProcessados) {
        onPagamentosProcessados();
      }

      // Verificar se ainda há pendências após atualização local
      const aindaTemPendencias = colheitasPendentes.length > 0;

      if (!aindaTemPendencias) {
        // Fechar modal automaticamente se não há mais pendências
        setTimeout(() => {
          fecharModal();
          showNotification(
            'success',
            'Todos os Pagamentos Concluídos',
            `Não há mais pendências para ${turmaNome}.`
          );
        }, 400);
      }
      // NÃO chamar callback NUNCA durante o processamento para evitar "piscar"
      // O modal é autossuficiente e gerencia seus próprios dados

    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      // Limpar estados de animação em caso de erro
      setItensSendoPagos([]);
      setItensComCheckmark([]);

      showNotification(
        'error',
        'Erro',
        error.response?.data?.message || 'Erro ao processar pagamentos'
      );
    } finally {
      setLoadingPagamento(false);
    }
  };

  const colunas = [
    {
      title: <CheckCircleOutlined style={{ color: '#059669' }} />,
      key: 'selecao',
      width: 60,
      render: (_, record) => {
        const sendoPago = itensSendoPagos.includes(record.id);
        const comCheckmark = itensComCheckmark.includes(record.id);
        const isPago = record.status === 'PAGO';

        // Se item já foi pago, mostrar checkmark permanente
        if (isPago) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            </div>
          );
        }

        // Se está sendo processado, mostrar checkmark animado
        if (comCheckmark) {
          return (
            <div className="checkmark-container">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            </div>
          );
        }

        // Se está sendo pago, mostrar spinner
        if (sendoPago) {
          return (
            <SpinnerContainer style={{
              width: '18px',
              height: '18px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #059669'
            }} />
          );
        }

        // Se está pendente, mostrar checkbox
        return (
          <Checkbox
            checked={colheitasSelecionadas.includes(record.id)}
            onChange={(e) => handleSelecaoColheita(record.id, e.target.checked)}
            disabled={loadingPagamento}
          />
        );
      },
    },
    {
      title: 'Pedido',
      dataIndex: 'pedidoNumero',
      key: 'pedidoNumero',
      width: 140,
      render: (numero) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {numero}
        </Tag>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 200,
      ellipsis: true,
      render: (nome) => capitalizeNameShort(nome || ''),
    },
    {
      title: 'Placa',
      dataIndex: 'placaPrimaria',
      key: 'placaPrimaria',
      width: 140,
      render: (placa) => (
        placa ? placa.toUpperCase() : '-'
      ),
    },
    {
      title: 'Fruta',
      dataIndex: ['fruta', 'nome'],
      key: 'fruta',
      width: 180,
      render: (nome) => (
        <Space>
                    {getFruitIcon(nome, { width: 20, height: 20 })}
          <span style={{ fontWeight: '500' }}>{capitalizeName(nome || '')}</span>
        </Space>
      ),
    },
    {
      title: 'Quantidade',
      key: 'quantidade',
      width: 130,
      render: (_, record) => (
        <Text strong>
          {record.quantidadeColhida.toLocaleString('pt-BR')} {record.unidadeMedida}
        </Text>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valorColheita',
      key: 'valorColheita',
      width: 130,
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: 'Data Colheita',
      dataIndex: 'dataColheita',
      key: 'dataColheita',
      width: 140,
      render: (data) => (
        data ? new Date(data).toLocaleDateString('pt-BR') : '-'
      ),
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      key: 'observacoes',
      width: 120,
      render: (obs) => (
        obs ? (
          <Tooltip title={obs}>
            <MessageOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        ) : '-'
      ),
    },
  ];

  const possuiSelecao = colheitasSelecionadas.length > 0;
  const totalItensConfirmacao = possuiSelecao
    ? colheitasSelecionadas.length
    : (dados?.colheitas?.filter(colheita => colheita.status !== 'PAGO').length || 0);
  const valorTotalConfirmacao = possuiSelecao
    ? calcularTotalSelecionado()
    : dados?.resumo?.totalPendente || 0;
  const mensagemConfirmacao = possuiSelecao
    ? "Apenas itens selecionados serão pagos"
    : "Todos os itens pendentes serão pagos";

  const metodosPagamento = [
    {
      value: 'PIX',
      label: 'PIX',
      color: '#52c41a',
      icon: <PixIcon width={16} height={16} />
    },
    {
      value: 'BOLETO',
      label: 'Boleto Bancário',
      color: '#1890ff',
      icon: <BoletoIcon width={16} height={16} />
    },
    {
      value: 'TRANSFERENCIA',
      label: 'Transferência Bancária',
      color: '#722ed1',
      icon: <TransferenciaIcon width={16} height={16} />
    },
    {
      value: 'DINHEIRO',
      label: 'Dinheiro',
      color: '#faad14',
      icon: '💰'
    },
    {
      value: 'CHEQUE',
      label: 'Cheque',
      color: '#f5222d',
      icon: '📄'
    },
  ];

  const confirmacaoDesabilitada = !dataPagamentoSelecionada || !formaPagamentoSelecionada;


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
          <DollarOutlined style={{ marginRight: 8 }} />
          Pagamentos Pendentes - {capitalizeName(turmaNome || '')}
        </span>
      }
      open={open}
      onCancel={fecharModal}
      width={isMobile ? '95vw' : 1400}
      footer={null}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      <div style={{ 
        position: 'relative',
        minHeight: loading ? '400px' : 'auto'
      }}>
        {/* Overlay de Loading */}
        {(loading || loadingPagamento) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: '8px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <SpinnerContainer />
              <div style={{
                color: '#059669',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {loading ? 'Carregando pagamentos pendentes...' : 'Processando pagamentos...'}
              </div>
            </div>
          </div>
        )}

        {dados ? (
        <div>
          {/* Informações da Turma */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Turma" : "Informações da Turma"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                color: "#ffffff",
                borderRadius: "8px 8px 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >

            {/* Nome da Turma */}
            <div style={{
              marginBottom: isMobile ? '16px' : '20px',
              padding: isMobile ? '8px 0' : '12px 0'
            }}>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                color: '#8c8c8c',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Nome da Turma
              </div>
              <div style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: '8px'
              }}>
                🏢 {capitalizeName(turmaNome || '')}
              </div>
              <Divider style={{ margin: '8px 0' }} />
            </div>

            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Pendente" : "Total Pendente"}
                  value={dados.resumo.totalPendente}
                  prefix={<DollarOutlined />}
                  formatter={value => formatCurrency(value)}
                  valueStyle={{
                    color: '#fa8c16',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Colheitas" : "Colheitas Pendentes"}
                  value={dados.resumo.quantidadeColheitas}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{
                    color: '#722ed1',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Pedidos"
                  value={dados.resumo.quantidadePedidos}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{
                    color: '#1890ff',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Frutas"
                  value={dados.resumo.quantidadeFrutas}
                  prefix={<AppleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{
                    color: '#52c41a',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
            </Row>


            {dados.turma.chavePix && (
              <div style={{ marginTop: '16px' }}>
                <Alert
                  message={
                    <Space>
                      <CreditCardOutlined />
                      <strong>Chave PIX:</strong>
                      <Text code>{dados.turma.chavePix}</Text>
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                />
              </div>
            )}
          </Card>

          {/* Busca e Filtros */}
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
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                color: "#ffffff",
                borderRadius: "8px 8px 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, 16]} wrap={isMobile}>
            <Col xs={24} sm={24} md={15}>
              <Input
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Buscar por cliente, pedido ou placa"
                allowClear
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
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

          {/* Tabela de Colheitas */}
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Colheitas" : "Colheitas Pendentes"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                color: "#ffffff",
                borderRadius: "8px 8px 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >

            {colheitasFiltradas.length > 0 ? (
              <>
                <ResponsiveTable
                  columns={colunas}
                  dataSource={colheitasFiltradas}
                  rowKey="id"
                  minWidthMobile={1200}
                  showScrollHint={true}
                  components={{
                    body: {
                      row: ({ children, record, ...props }) => (
                        <LinhaComAnimacao
                          {...props}
                          $sendoPago={itensSendoPagos.includes(record?.id)}
                          $comCheckmark={itensComCheckmark.includes(record?.id)}
                          $itemPago={record?.status === 'PAGO'}
                        >
                          {children}
                        </LinhaComAnimacao>
                      ),
                    },
                  }}
                />

                {/* Área de Pagamento - Sempre visível */}
                <Divider />
                <div style={{
                  backgroundColor: '#f6ffed',
                  padding: isMobile ? '12px' : '16px',
                  borderRadius: '8px'
                }}>
                  <Row gutter={isMobile ? [8, 12] : [16, 16]} align="middle">
                    <Col xs={12} md={6}>
                      <Statistic
                        title={
                          isMobile
                            ? (colheitasSelecionadas.length > 0 ? "Selecionados" : "Total")
                            : (colheitasSelecionadas.length > 0 ? "Itens Selecionados" : "Total de Itens")
                        }
                        value={colheitasSelecionadas.length > 0 ? colheitasSelecionadas.length : colheitasFiltradas.length}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{
                          color: '#52c41a',
                          fontSize: isMobile ? '1rem' : '1.5rem'
                        }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title={isMobile ? "Colhido" : "Total Colhido"}
                      value={totaisColhidos.map(item => `${item.total.toLocaleString('pt-BR')} ${item.unidade}`).join(', ')}
                        prefix={<AppleOutlined />}
                        valueStyle={{
                          color: '#0ea5e9',
                          fontSize: isMobile ? '1rem' : '1.5rem'
                        }}
                        formatter={(value) => (
                          <div style={{ 
                            fontSize: isMobile ? '1rem' : '1.5rem',
                            color: '#0ea5e9',
                            fontWeight: '600'
                          }}>
                          {totaisColhidos.map((item, index) => (
                              <span key={index} style={{ marginRight: '8px' }}>
                                <span style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
                                  {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span style={{ 
                                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                                  color: '#8c8c8c',
                                  marginLeft: '4px',
                                  textTransform: 'uppercase',
                                  fontWeight: 'normal'
                                }}>
                                  {item.unidade}
                                </span>
                              {index < totaisColhidos.length - 1 && !isMobile && (
                                  <span style={{ 
                                    color: '#000000',
                                    margin: '0 15px',
                                    fontSize: '1.5rem',
                                    verticalAlign: 'middle',
                                    display: 'inline-block',
                                    lineHeight: '1',
                                    transform: 'translateY(-4px)'
                                  }}>
                                    •
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title={isMobile ? "A Pagar" : "Total a Pagar"}
                        value={totalAPagar}
                        prefix={<DollarOutlined />}
                        formatter={value => formatCurrency(value)}
                        valueStyle={{
                          color: '#059669',
                          fontSize: isMobile ? '1rem' : '1.25rem'
                        }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <Button
                        type="primary"
                        size={isMobile ? "middle" : "large"}
                        icon={<DollarOutlined />}
                        onClick={abrirModalConfirmacao}
                        loading={loadingPagamento}
                        style={{
                          backgroundColor: '#059669',
                          borderColor: '#059669',
                          width: '100%',
                          marginTop: isMobile ? '8px' : '0'
                        }}
                      >
                        {isMobile
                          ? (colheitasSelecionadas.length > 0 ? 'Pagar Selecionados' : 'Pagar Todos')
                          : (colheitasSelecionadas.length > 0 ? 'Pagar Selecionados' : 'Pagar Todos')
                        }
                      </Button>
                    </Col>
                  </Row>

                  <Row style={{ marginTop: isMobile ? '12px' : '16px' }}>
                    <Col span={24}>
                      <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                        <Space>
                          <MessageOutlined style={{ color: '#059669' }} />
                          <span style={{
                            fontWeight: '700',
                            color: '#333',
                            fontSize: isMobile ? '12px' : '14px'
                          }}>
                            {isMobile ? 'Observações' : 'Observações do Pagamento'}
                          </span>
                        </Space>
                      </div>
                      <TextArea
                        rows={isMobile ? 2 : 3}
                        placeholder={isMobile ? "Observações (opcional)" : "Observações sobre o pagamento (opcional)"}
                        value={observacoesPagamento}
                        onChange={(e) => setObservacoesPagamento(e.target.value)}
                        style={{
                          borderRadius: 6,
                          borderColor: "#d9d9d9",
                          fontSize: isMobile ? '14px' : '16px'
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={filtrosAtivos ? "Nenhuma colheita encontrada com os filtros aplicados" : "Nenhuma colheita pendente"}
                style={{ padding: '40px' }}
              />
            )}
          </Card>

          {/* Footer customizado */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}>
            <Button onClick={fecharModal} size="large">
              Fechar
            </Button>
          </div>
        </div>
        ) : !loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Empty
              description="Nenhum dado encontrado"
              style={{ color: '#8c8c8c' }}
            />
          </div>
        ) : null}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmActionModal
        open={modalConfirmacaoAberto}
        onCancel={() => setModalConfirmacaoAberto(false)}
        onConfirm={processarPagamentos}
        title="Confirmar Pagamento"
        confirmText="Confirmar Pagamento"
        cancelText="Cancelar"
        icon={<DollarOutlined />}
        iconColor="#059669"
        confirmDisabled={confirmacaoDesabilitada}
        customContent={
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ 
              fontSize: "48px", 
              color: "#059669", 
              marginBottom: "16px",
              display: "block"
            }}>
              <DollarOutlined />
            </div>
            <Text style={{ 
              fontSize: "16px", 
              fontWeight: "500", 
              color: "#333",
              lineHeight: "1.5",
              marginBottom: "20px",
              display: "block"
            }}>
              Você está prestes a processar os pagamentos das colheitas selecionadas.
            </Text>
            
            {/* Detalhes da operação */}
            <div style={{
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "16px",
              textAlign: "left"
            }}>
              <Text style={{ fontSize: "14px", fontWeight: "600", color: "#059669", display: "block", marginBottom: "8px" }}>
                📋 Detalhes da Operação:
              </Text>
              <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.6" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>👤 Colhedor:</strong> {turmaNome}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>📦 Total de itens:</strong> {totalItensConfirmacao}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>💰 Valor total:</strong> R$ {valorTotalConfirmacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ marginBottom: "0" }}>
                  <strong>ℹ️ Observação:</strong> {mensagemConfirmacao}
                </div>
              </div>
            </div>
            {/* Campos adicionais */}
            <div style={{ marginTop: "16px" }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: "left", marginBottom: "6px" }}>
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <Text strong style={{ color: "#059669" }}>Data do Pagamento</Text>
                    </Space>
                  </div>
                  <MaskedDatePicker
                    value={dataPagamentoSelecionada}
                    onChange={setDataPagamentoSelecionada}
                    size="middle"
                    style={{ borderRadius: 6 }}
                    disabledDate={(current) => current && current > moment().endOf('day')}
                    placeholder="Selecione a data"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: "left", marginBottom: "6px" }}>
                    <Space>
                      <CreditCardOutlined style={{ color: "#059669" }} />
                      <Text strong style={{ color: "#059669" }}>Método</Text>
                    </Space>
                  </div>
                  <Select
                    value={formaPagamentoSelecionada}
                    onChange={setFormaPagamentoSelecionada}
                    placeholder="Selecione a forma"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    {metodosPagamento.map((metodo) => (
                      <Option key={metodo.value} value={metodo.value}>
                        <Space>
                          {typeof metodo.icon === 'string' ? (
                            <span>{metodo.icon}</span>
                          ) : (
                            metodo.icon
                          )}
                          <span>{metodo.label}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </div>
            {confirmacaoDesabilitada && (
              <Alert
                type="warning"
                showIcon
                message="Preencha a data e a forma de pagamento para continuar."
                style={{ marginTop: "16px", textAlign: "left" }}
              />
            )}
          </div>
        }
      />
    </Modal>
  );
};

PagamentosPendentesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turmaId: PropTypes.number,
  turmaNome: PropTypes.string,
  onPagamentosProcessados: PropTypes.func,
};

export default PagamentosPendentesModal;