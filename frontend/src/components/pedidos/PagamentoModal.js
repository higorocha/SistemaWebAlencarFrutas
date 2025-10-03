// src/components/pedidos/PagamentoModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Statistic,
  Tag,
  Table,
  Divider,
  Empty,
  Tooltip,
} from "antd";
import {
  CreditCardOutlined,
  DollarOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CalendarOutlined,
  BankOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { formatarValorMonetario, formataLeitura } from "../../utils/formatters";
import { PrimaryButton } from "../common/buttons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import useNotificationWithContext from "../../hooks/useNotificationWithContext";
import NovoPagamentoModal from "./NovoPagamentoModal";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import styled from "styled-components";
import getTheme from "../../theme";
import useResponsive from "../../hooks/useResponsive";

const { Title, Text } = Typography;

// Obter tema para cores
const theme = getTheme('light');

// Função para obter a cor do status baseada no tema
const getStatusColor = (status) => {
  return theme.palette.pedidoStatus[status] || theme.palette.pedidoStatus.DEFAULT;
};

// Função para calcular o status local baseado no valor restante
const calcularStatusLocal = (pedido, valorRestante) => {
  // Se não há valor restante, o pedido está finalizado
  if (valorRestante <= 0) {
    return 'PAGAMENTO_REALIZADO';
  }
  
  // Se há valor recebido mas ainda resta algo, é pagamento parcial
  if ((pedido?.valorRecebido || 0) > 0) {
    return 'PAGAMENTO_PARCIAL';
  }
  
  // Se não há valor recebido, está aguardando pagamento
  return 'AGUARDANDO_PAGAMENTO';
};

// Função para obter o texto do status em português
const getStatusText = (status) => {
  const statusTexts = {
    'PEDIDO_CRIADO': 'Pedido Criado',
    'AGUARDANDO_COLHEITA': 'Aguardando Colheita',
    'COLHEITA_REALIZADA': 'Colheita Realizada',
    'AGUARDANDO_PRECIFICACAO': 'Aguardando Precificação',
    'PRECIFICACAO_REALIZADA': 'Precificação Realizada',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    'PAGAMENTO_PARCIAL': 'Pagamento Parcial',
    'PAGAMENTO_REALIZADO': 'Pagamento Realizado',
    'PEDIDO_FINALIZADO': 'Pedido Finalizado',
    'CANCELADO': 'Cancelado'
  };
  
  return statusTexts[status] || status;
};

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

  /* LAYOUT FIXO PARA RESOLVER SCROLL HORIZONTAL */
  .ant-table-wrapper {
    width: 100%;
  }

  .ant-table {
    width: 100% !important;
    table-layout: fixed;
  }

  .ant-table-container {
    width: 100% !important;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-table-tbody > tr > td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* CORREÇÃO ESPECÍFICA: Esconder linha de medida */
  .ant-table-measure-row {
    display: none !important;
  }
`;

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

const PagamentoModal = ({
  open,
  onClose,
  pedido,
  loading,
  onNovoPagamento,
  onRemoverPagamento,
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const [novoPagamentoModalOpen, setNovoPagamentoModalOpen] = useState(false);

  // Hook para notificações com z-index correto
  const { error, contextHolder } = useNotificationWithContext();
  const [pagamentoEditando, setPagamentoEditando] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [operacaoLoading, setOperacaoLoading] = useState(false); // Loading para operações internas
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pagamentoParaRemover, setPagamentoParaRemover] = useState(null);

  // Buscar pagamentos quando modal abrir
  useEffect(() => {
    if (open && pedido?.id) {
      fetchPagamentos();
    }
  }, [open, pedido?.id]);

  const fetchPagamentos = async () => {
    try {
      setLoadingPagamentos(true);
      const response = await axiosInstance.get(`/api/pedidos/${pedido.id}/pagamentos`);
      
      // Garantir que seja um array
      const pagamentosArray = Array.isArray(response.data) ? response.data : Object.values(response.data || {});
      
      setPagamentos(pagamentosArray);
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      error("Erro", "Erro ao carregar pagamentos");
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const handleNovoPagamento = async (pagamentoData) => {
    try {
      // Fechar modal filho e mostrar overlay interno
      setNovoPagamentoModalOpen(false);
      setPagamentoEditando(null);
      setOperacaoLoading(true); // Ativar overlay interno

      await onNovoPagamento(pagamentoData);
      await fetchPagamentos(); // Recarregar lista interna
      // Não mostrar mensagem aqui pois a página principal já mostra
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      // Em caso de erro, reabrir o modal
      setNovoPagamentoModalOpen(true);
      setPagamentoEditando(pagamentoData.id ? pagamentoData : null);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false); // Desativar overlay interno
    }
  };

  const handleEditarPagamento = (pagamento) => {
    setPagamentoEditando(pagamento);
    setNovoPagamentoModalOpen(true);
  };

  // Função para abrir modal de confirmação
  const handleAbrirConfirmacaoRemocao = (pagamento) => {
    setPagamentoParaRemover(pagamento);
    setConfirmModalOpen(true);
  };

  const handleRemoverPagamento = async () => {
    if (!pagamentoParaRemover) return;
    
    try {
      await onRemoverPagamento(pagamentoParaRemover.id);
      await fetchPagamentos(); // Recarregar lista interna
      setConfirmModalOpen(false);
      setPagamentoParaRemover(null);
      // Não exibir notificação aqui pois o componente pai já exibe
    } catch (error) {
      console.error("Erro ao remover pagamento:", error);
      error("Erro", "Erro ao remover pagamento");
    }
  };

  // Calcular valores consolidados
  // Usar o valorRecebido consolidado do pedido (mais confiável)
  const valorTotalRecebido = pedido?.valorRecebido || 0;
  const valorRestante = (pedido?.valorFinal || 0) - valorTotalRecebido;
  const percentualPago = pedido?.valorFinal ? (valorTotalRecebido / pedido.valorFinal) * 100 : 0;
  
  // Calcular status local baseado no valor restante (mais preciso que o status do banco)
  const statusLocal = pedido ? calcularStatusLocal(pedido, valorRestante) : pedido?.status;
  

  // Função para formatar datas de forma segura
  const formatarData = (date) => {
    if (!date) return "-";
    
    try {
      // Se já é uma string, tentar parsear
      if (typeof date === 'string') {
        // Formato do banco: '2025-09-03 03:00:00' ou '2025-09-03 23:18:38.057'
        // Converter para formato ISO se necessário
        let dateString = date;
        
        // Se não tem 'T' e tem espaço, adicionar 'T' para formato ISO
        if (dateString.includes(' ') && !dateString.includes('T')) {
          dateString = dateString.replace(' ', 'T');
        }
        
        // Se não tem timezone, adicionar 'Z' para UTC
        if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
          dateString += 'Z';
        }
        
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
          console.warn('Data inválida após conversão:', dateString);
          return "-";
        }
        return parsedDate.toLocaleDateString("pt-BR");
      }
      
      // Se é um objeto Date
      if (date instanceof Date) {
        return date.toLocaleDateString("pt-BR");
      }
      
      // Tentar converter para Date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('Data inválida recebida:', date);
        return "-";
      }
      
      return parsedDate.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data recebida:', date);
      return "-";
    }
  };

  // Colunas da tabela de pagamentos
  const columns = [
    {
      title: "Data",
      dataIndex: "dataPagamento",
      key: "dataPagamento",
      width: 100,
      render: (date) => formatarData(date),
    },
    {
      title: "Valor",
      dataIndex: "valorRecebido",
      key: "valorRecebido",
      width: 120,
      render: (valor) => (
        <Text strong style={{ color: "#059669" }}>
          {formatarValorMonetario(valor)}
        </Text>
      ),
    },
    {
      title: "Método",
      dataIndex: "metodoPagamento",
      key: "metodoPagamento",
      width: 120,
      render: (metodo) => {
        const metodos = {
          PIX: { icon: <PixIcon width={16} height={16} /> },
          BOLETO: { icon: <BoletoIcon width={16} height={16} /> },
          TRANSFERENCIA: { icon: <TransferenciaIcon width={16} height={16} /> },
          DINHEIRO: { icon: "💰" },
          CHEQUE: { icon: "📄" },
        };
        const config = metodos[metodo] || { icon: "💳" };
        return (
          <Tag
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
              cursor: 'default',
              minHeight: '28px'
            }}
          >
            {typeof config.icon === 'string' ? <span>{config.icon}</span> : config.icon}
            {metodo}
          </Tag>
        );
      },
    },
    {
      title: "Conta",
      dataIndex: "contaDestino",
      key: "contaDestino",
      width: 120,
      render: (conta) => (
        <Tag color="blue">
          <BankOutlined /> {conta}
        </Tag>
      ),
    },
    {
      // Coluna para exibir o número do vale (referência externa do pagamento)
      // Campo opcional que pode conter informações como número de vale, comprovante, etc.
      title: "Vale",
      dataIndex: "referenciaExterna",
      key: "referenciaExterna",
      width: 100,
      ellipsis: true,
      render: (ref) => ref || "-",
    },
    {
      title: "Ações",
      key: "acoes",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* Botão de informações com tooltip para exibir observações do pagamento */}
          {record.observacoesPagamento && (
            <Tooltip 
              title={record.observacoesPagamento} 
              placement="topLeft"
              overlayStyle={{ maxWidth: 300 }}
            >
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}
          {/* Botão para editar o pagamento */}
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditarPagamento(record)}
            title="Editar pagamento"
            style={{ color: '#52c41a' }}
          />
          {/* Botão para remover o pagamento */}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleAbrirConfirmacaoRemocao(record)}
            title="Remover pagamento"
          />
        </Space>
      ),
    },
  ];

  // Função para obter informações das frutas com unidade de precificação
  const getFrutasInfo = () => {
    if (!pedido?.frutasPedidos || pedido.frutasPedidos.length === 0) {
      return "Nenhuma fruta";
    }

    return pedido.frutasPedidos.map((fp) => {
      const unidadePrec = fp.unidadePrecificada || fp.unidadeMedida1;
      const quantidade = unidadePrec === fp.unidadeMedida2 ? fp.quantidadeReal2 : fp.quantidadeReal;
      const quantidadeFormatada = formataLeitura(quantidade);
      return `${fp.fruta?.nome}: ${quantidadeFormatada} ${unidadePrec}`;
    }).join(", ");
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={
          <span style={{ 
            color: "#ffffff", 
            fontWeight: "600", 
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}>
            <CreditCardOutlined style={{ marginRight: "0.5rem" }} />
            {isMobile ? "Pagamentos" : "Gestão de Pagamentos"}
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={isMobile ? '95vw' : '90%'}
        style={{ maxWidth: isMobile ? '95vw' : "62.5rem" }}
        styles={{
          body: { 
            maxHeight: "calc(100vh - 12.5rem)", 
            overflowY: "auto", 
            overflowX: "hidden", 
            padding: isMobile ? 12 : 20 
          },
          header: { 
            backgroundColor: "#059669", 
            borderBottom: "0.125rem solid #047857", 
            padding: 0 
          },
          wrapper: { zIndex: 1000 }
        }}
        centered
        destroyOnClose
      >
        <div style={{ position: 'relative' }}>
          {/* Overlay de Loading para Operações */}
          {operacaoLoading && (
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
              borderRadius: '8px'
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
                  Processando pagamento...
                </div>
              </div>
            </div>
          )}

        {pedido && (
          <>
            {/* Informações do Pedido */}
            <Card
              title={
                <Space>
                  <EyeOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Informações do Pedido
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16, 
                border: "0.0625rem solid #e8e8e8", 
                borderRadius: "0.5rem", 
                backgroundColor: "#f9f9f9" 
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
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong>Pedido:</Text>
                  <br />
                  <Text>{pedido.numeroPedido}</Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong>Cliente:</Text>
                  <br />
                  <Text>{pedido.cliente?.nome}</Text>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Text strong>Frutas (Unidade de Precificação):</Text>
                  <br />
                  <Text>{getFrutasInfo()}</Text>
                </Col>
              </Row>
              <Divider style={{ margin: isMobile ? '8px 0' : '12px 0' }} />
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Status:</Text>
                  <br />
                  <Tag 
                    color={getStatusColor(statusLocal)}
                    style={{
                      backgroundColor: getStatusColor(statusLocal),
                      color: '#ffffff',
                      fontWeight: '600',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '13px'
                    }}
                  >
                    {getStatusText(statusLocal)}
                  </Tag>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Data do Pedido:</Text>
                  <br />
                  <Text>{formatarData(pedido.createdAt)}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Última Atualização:</Text>
                  <br />
                  <Text>{formatarData(pedido.updatedAt)}</Text>
                </Col>
              </Row>
            </Card>

            {/* Resumo Financeiro */}
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Resumo Financeiro
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16, 
                border: "0.0625rem solid #e8e8e8", 
                borderRadius: "0.5rem", 
                backgroundColor: "#f9f9f9" 
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  borderBottom: "0.125rem solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: isMobile ? "6px 12px" : "12px 20px"
                },
                body: { padding: isMobile ? "12px" : "20px" }
              }}
            >
              <Row gutter={[isMobile ? 8 : 20, isMobile ? 8 : 16]} align="middle">
                <Col xs={24} sm={12} md={6}>
                  <div style={{ 
                    backgroundColor: "#f0f9ff", 
                    border: "2px solid #0ea5e9", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <DollarOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR TOTAL
                    </Text>
                    <Text style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "block" }}>
                      {formatarValorMonetario(pedido.valorFinal)}
                    </Text>
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <div style={{ 
                    backgroundColor: "#f0fdf4", 
                    border: "0.125rem solid #22c55e", 
                    borderRadius: "0.75rem", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <BankOutlined style={{ fontSize: "24px", color: "#22c55e" }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RECEBIDO
                    </Text>
                    <Text style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", display: "block" }}>
                      {formatarValorMonetario(valorTotalRecebido)}
                    </Text>
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <div style={{ 
                    backgroundColor: valorRestante > 0 ? "#fef2f2" : "#f0fdf4", 
                    border: valorRestante > 0 ? "0.125rem solid #ef4444" : "0.125rem solid #22c55e", 
                    borderRadius: "0.75rem", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: valorRestante > 0 ? "0 2px 8px rgba(239, 68, 68, 0.15)" : "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <CalendarOutlined style={{ 
                        fontSize: "24px", 
                        color: valorRestante > 0 ? "#ef4444" : "#22c55e" 
                      }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RESTANTE
                    </Text>
                    <Text style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: valorRestante > 0 ? "#dc2626" : "#15803d",
                      display: "block"
                    }}>
                      {formatarValorMonetario(valorRestante)}
                    </Text>
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <div style={{ 
                    backgroundColor: percentualPago >= 100 ? "#f0fdf4" : percentualPago >= 50 ? "#fffbeb" : "#fef2f2", 
                    border: percentualPago >= 100 ? "0.125rem solid #22c55e" : percentualPago >= 50 ? "0.125rem solid #f59e0b" : "0.125rem solid #ef4444", 
                    borderRadius: "0.75rem", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: percentualPago >= 100 
                      ? "0 2px 8px rgba(34, 197, 94, 0.15)" 
                      : percentualPago >= 50 
                        ? "0 2px 8px rgba(245, 158, 11, 0.15)" 
                        : "0 2px 8px rgba(239, 68, 68, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <InfoCircleOutlined style={{ 
                        fontSize: "24px", 
                        color: percentualPago >= 100 ? "#22c55e" : percentualPago >= 50 ? "#f59e0b" : "#ef4444"
                      }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      % PAGO
                    </Text>
                    <Text style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: percentualPago >= 100 ? "#15803d" : percentualPago >= 50 ? "#d97706" : "#dc2626",
                      display: "block"
                    }}>
                      {percentualPago.toFixed(1)}%
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Lista de Pagamentos */}
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Pagamentos Realizados
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16, 
                border: "0.0625rem solid #e8e8e8", 
                borderRadius: "0.5rem", 
                backgroundColor: "#f9f9f9" 
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  borderBottom: "0.125rem solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: { padding: isMobile ? "8px" : "12px 16px" }
              }}
              extra={
                !isMobile && (
                  <PrimaryButton
                    icon={<PlusCircleOutlined />}
                    onClick={() => setNovoPagamentoModalOpen(true)}
                    disabled={valorRestante <= 0}
                    size="middle"
                  >
                    Novo Pagamento
                  </PrimaryButton>
                )
              }
            >
              {/* Botão Mobile para Novo Pagamento */}
              {isMobile && (
                <PrimaryButton
                  icon={<PlusCircleOutlined />}
                  onClick={() => setNovoPagamentoModalOpen(true)}
                  disabled={valorRestante <= 0}
                  size="middle"
                  block
                  style={{ marginBottom: 12 }}
                >
                  Novo Pagamento
                </PrimaryButton>
              )}

              {pagamentos.length > 0 ? (
                <StyledTable
                  columns={columns}
                  dataSource={pagamentos}
                  rowKey="id"
                  pagination={false}
                  loading={loadingPagamentos}
                  size="middle"
                  bordered={true}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                  }}
                  scroll={{ x: isMobile ? 800 : undefined }}
                />
              ) : (
                <Empty
                  description="Nenhum pagamento registrado"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>

            {/* Botões de Ação */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: isMobile ? "8px" : "12px", 
              marginTop: isMobile ? "1rem" : "1.5rem", 
              paddingTop: isMobile ? "12px" : "16px", 
              borderTop: "0.0625rem solid #e8e8e8" 
            }}>
              <Button 
                onClick={onClose} 
                disabled={loading}
                size={isMobile ? "small" : "large"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                Fechar
              </Button>
            </div>
          </>
        )}
        </div>
      </Modal>

      {/* Modal para Novo Pagamento */}
      <NovoPagamentoModal
        open={novoPagamentoModalOpen}
        onClose={() => {
          setNovoPagamentoModalOpen(false);
          setPagamentoEditando(null);
        }}
        onSave={handleNovoPagamento}
        pedido={pedido}
        valorRestante={valorRestante}
        loading={loading}
        pagamentoEditando={pagamentoEditando}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        title={
          <span style={{ 
            color: "#ffffff", 
            fontWeight: "600", 
            fontSize: "16px",
            backgroundColor: "#ef4444",
            padding: "12px 16px",
            margin: "-20px -24px 0 -24px",
            display: "block",
            borderRadius: "8px 8px 0 0",
          }}>
            <DeleteOutlined style={{ marginRight: 8 }} />
            Confirmar Exclusão
          </span>
        }
        open={confirmModalOpen}
        onCancel={() => {
          setConfirmModalOpen(false);
          setPagamentoParaRemover(null);
        }}
        onOk={handleRemoverPagamento}
        okText="Sim, Remover"
        cancelText="Cancelar"
        okButtonProps={{ 
          danger: true,
          style: { backgroundColor: '#ef4444', borderColor: '#ef4444' }
        }}
        cancelButtonProps={{ style: { borderColor: '#d9d9d9' } }}
        width={500}
        styles={{
          header: { backgroundColor: "#ef4444", borderBottom: "2px solid #dc2626", padding: 0 },
          body: { padding: 20 }
        }}
        centered
      >
        {pagamentoParaRemover && (
          <div>
            <p style={{ fontSize: "16px", marginBottom: "16px" }}>
              Tem certeza que deseja remover este pagamento?
            </p>
            <div style={{ 
              backgroundColor: "#fef2f2", 
              border: "1px solid #fecaca", 
              borderRadius: "8px", 
              padding: "16px",
              marginBottom: "16px"
            }}>
              <p style={{ margin: 0, fontWeight: "600", color: "#dc2626" }}>
                Detalhes do Pagamento:
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#374151" }}>
                <strong>Valor:</strong> {formatarValorMonetario(pagamentoParaRemover.valorRecebido)}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Método:</strong> {pagamentoParaRemover.metodoPagamento}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Data:</strong> {formatarData(pagamentoParaRemover.dataPagamento)}
              </p>
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PagamentoModal;