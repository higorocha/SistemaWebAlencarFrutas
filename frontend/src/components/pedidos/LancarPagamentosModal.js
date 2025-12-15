// src/components/pedidos/LancarPagamentosModal.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Card,
  Table,
  Empty,
  Statistic,
  Alert,
  Popover,
  Tooltip,
  ConfigProvider,
  Spin
} from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  CreditCardOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BankOutlined,
  PlusOutlined,
  CommentOutlined,
  UserOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../utils/formatters";
import { validatePedidosResponse } from "../../utils/validation";
import { useFormValidation } from "../../hooks/useFormValidation";
import { MonetaryInput, MaskedDatePicker } from "../common/inputs";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import SearchInputInteligente from "../common/search/SearchInputInteligente";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import ResponsiveTable from "../common/ResponsiveTable";
import useResponsive from "../../hooks/useResponsive";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const LancarPagamentosModal = ({
  open,
  onClose,
  onSave,
  onSuccess,
  loading
}) => {
  const { isMobile } = useResponsive();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [valoresPagamento, setValoresPagamento] = useState({});
  const [observacoesIndividuais, setObservacoesIndividuais] = useState({});
  const [valesIndividuais, setValesIndividuais] = useState({});

  // Resetar estado quando modal abrir/fechar
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        dataPagamento: moment(),
        contaDestino: 'ALENCAR'
      });
      setClienteSelecionado(null);
      setPedidos([]);
      setValoresPagamento({});
      setObservacoesIndividuais({});
      setValesIndividuais({});
    } else {
      form.resetFields();
      setClienteSelecionado(null);
      setPedidos([]);
      setValoresPagamento({});
      setObservacoesIndividuais({});
      setValesIndividuais({});
    }
  }, [open, form]);

  // Buscar pedidos do cliente selecionado
  const buscarPedidosCliente = useCallback(async (clienteId) => {
    try {
      setLoadingPedidos(true);

      const response = await axiosInstance.get(`/api/pedidos/cliente/${clienteId}`, {
        params: {
          status: 'AGUARDANDO_PAGAMENTO,PAGAMENTO_PARCIAL,PRECIFICACAO_REALIZADA'
        }
      });

      const validatedResponse = validatePedidosResponse(response.data);
      const pedidosCliente = validatedResponse.pedidos;

      // Filtrar apenas pedidos com saldo devedor
      const pedidosComSaldo = pedidosCliente.filter(pedido => {
        const saldoDevedor = (pedido.valorFinal || 0) - (pedido.valorRecebido || 0);
        return saldoDevedor > 0;
      });

      setPedidos(pedidosComSaldo);

      // Mostrar notificação se não há mais pedidos pendentes após processamento
      if (pedidosComSaldo.length === 0 && clienteSelecionado) {
        showNotification("success", "Sucesso", "Este cliente não possui pedidos pendentes!");
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      showNotification("error", "Erro", "Erro ao buscar pedidos do cliente");
      setPedidos([]);
    } finally {
      setLoadingPedidos(false);
    }
  }, []);

  // Handle seleção de cliente
  const handleClienteSelect = (suggestion) => {
    if (suggestion.type === 'cliente') {
      setClienteSelecionado({
        id: suggestion.metadata?.id,
        nome: suggestion.value,
        documento: suggestion.metadata?.documento
      });

      if (suggestion.metadata?.id) {
        buscarPedidosCliente(suggestion.metadata.id);
      }
    }
  };

  // Hook para validação otimizada
  const {
    validacao,
    totalValido,
    quantidadeValida,
    temErros,
    podeSalvar
  } = useFormValidation(valoresPagamento, pedidos);

  // Handle mudança de valor de pagamento
  const handleValorChange = useCallback((pedidoId, valor) => {
    setValoresPagamento(prev => ({
      ...prev,
      [pedidoId]: valor
    }));
  }, []);

  // Handle observações individuais
  const handleObservacaoChange = useCallback((pedidoId, observacao) => {
    setObservacoesIndividuais(prev => ({
      ...prev,
      [pedidoId]: observacao
    }));
  }, []);

  // Handle vales individuais
  const handleValeChange = useCallback((pedidoId, vale) => {
    setValesIndividuais(prev => ({
      ...prev,
      [pedidoId]: vale
    }));
  }, []);

  // Memoizar opções para evitar re-renderizações desnecessárias
  const metodosPagamento = useMemo(() => [
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
  ], []);

  const contasDestino = useMemo(() => [
    { value: 'ALENCAR', label: 'Alencar' },
    { value: 'FRANCIALDA', label: 'Francialda' },
    { value: 'GAVETA', label: 'Gaveta' },
  ], []);

  // Submit do formulário
  const handleSubmit = useCallback(async (values) => {
    try {
      // Usar validação otimizada
      if (quantidadeValida === 0) {
        showNotification("warning", "Atenção", "Informe pelo menos um valor de pagamento");
        return;
      }

      if (temErros) {
        showNotification("error", "Erro", "Existem valores que excedem o saldo devedor. Verifique os campos em vermelho.");
        return;
      }

      setSubmitLoading(true);

      // Preparar dados dos pagamentos usando validação otimizada
      const pagamentos = Object.entries(valoresPagamento)
        .filter(([pedidoId]) => validacao[pedidoId]?.hasValue && validacao[pedidoId]?.isValid)
        .map(([pedidoId, valor]) => {
          const valorRecebido = validacao[pedidoId].valorNumerico;

          return {
            pedidoId: parseInt(pedidoId),
            valorRecebido,
            dataPagamento: values.dataPagamento.startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss'),
            metodoPagamento: values.metodoPagamento,
            contaDestino: values.contaDestino,
            observacoesPagamento: observacoesIndividuais[pedidoId] || values.observacoesGlobal || null,
            referenciaExterna: valesIndividuais[pedidoId] || null
          };
        });

      await onSave(pagamentos);

      // Chamar callback de sucesso para atualizar dashboard
      if (onSuccess) {
        onSuccess();
      }

      // Atualizar lista de pedidos do cliente para refletir mudanças
      if (clienteSelecionado?.id) {
        await buscarPedidosCliente(clienteSelecionado.id);
      }

      // Reset apenas dos valores de pagamento, mantendo cliente e lista atualizada
      form.setFieldsValue({
        dataPagamento: moment(),
        contaDestino: 'ALENCAR',
        observacoesGlobal: ''
      });
      setValoresPagamento({});
      setObservacoesIndividuais({});
      setValesIndividuais({});

    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      showNotification("error", "Erro", "Erro ao processar pagamentos");
    } finally {
      setSubmitLoading(false);
    }
  }, [quantidadeValida, temErros, validacao, valoresPagamento, observacoesIndividuais, valesIndividuais, onSave]);

  const handleCancel = () => {
    form.resetFields();
    setClienteSelecionado(null);
    setPedidos([]);
    setValoresPagamento({});
    setObservacoesIndividuais({});
    setValesIndividuais({});
    onClose();
  };


  // Colunas da tabela de pedidos
  const columns = [
    {
      title: 'Nº Pedido',
      dataIndex: 'numeroPedido',
      key: 'numeroPedido',
      width: 140,
      sorter: (a, b) => {
        // Ordenação numérica do número do pedido
        const numA = parseInt(a.numeroPedido) || 0;
        const numB = parseInt(b.numeroPedido) || 0;
        return numA - numB;
      },
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Data',
      dataIndex: 'dataPedido',
      key: 'dataPedido',
      width: 90,
      sorter: (a, b) => {
        // Ordenação por data
        const dateA = moment(a.dataPedido);
        const dateB = moment(b.dataPedido);
        return dateA.valueOf() - dateB.valueOf();
      },
      render: (date) => (
        <Text style={{ fontSize: isMobile ? '13px' : '14px' }}>
          {moment(date).format('DD/MM/YY')}
        </Text>
      )
    },
    {
      title: 'Cliente',
      key: 'cliente',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: isMobile ? '13px' : '14px', display: 'block' }}>
            {record.cliente?.nome || '-'}
          </Text>
          {record.cliente?.documento && record.cliente.documento !== 'N/A' && (
            <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '12px' }}>
              {record.cliente.documento}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Frutas',
      dataIndex: 'frutasPedidos',
      key: 'frutas',
      width: 180,
      render: (frutas) => {
        if (!frutas || frutas.length === 0) return '-';
        const resumo = frutas.slice(0, 2).map(fp => fp.fruta?.nome).join(', ');
        const extras = frutas.length > 2 ? ` +${frutas.length - 2}` : '';
        return (
          <Text style={{ fontSize: isMobile ? '12px' : '14px' }} ellipsis={{ tooltip: true }}>
            {resumo}{extras}
          </Text>
        );
      }
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorFinal',
      key: 'valorFinal',
      width: 110,
      sorter: (a, b) => {
        // Ordenação numérica do valor total
        const valorA = parseFloat(a.valorFinal) || 0;
        const valorB = parseFloat(b.valorFinal) || 0;
        return valorA - valorB;
      },
      render: (valor) => (
        <Text strong style={{ color: '#333', fontSize: isMobile ? '13px' : '14px' }}>
          {formatarValorMonetario(valor || 0)}
        </Text>
      )
    },
    {
      title: 'Já Recebido',
      dataIndex: 'valorRecebido',
      key: 'valorRecebido',
      width: 110,
      sorter: (a, b) => {
        // Ordenação numérica do valor já recebido
        const valorA = parseFloat(a.valorRecebido) || 0;
        const valorB = parseFloat(b.valorRecebido) || 0;
        return valorA - valorB;
      },
      render: (valor) => (
        <Text style={{ color: '#52c41a', fontSize: isMobile ? '13px' : '14px' }}>
          {formatarValorMonetario(valor || 0)}
        </Text>
      )
    },
    {
      title: 'Saldo Devedor',
      key: 'saldoDevedor',
      width: 120,
      render: (_, record) => {
        const saldo = (record.valorFinal || 0) - (record.valorRecebido || 0);
        return (
          <Text strong style={{
            color: saldo > 0 ? '#cf1322' : '#52c41a',
            fontSize: '13px',
            backgroundColor: saldo > 0 ? '#fff2f0' : '#f6ffed',
            padding: '4px 8px',
            borderRadius: '4px',
            border: saldo > 0 ? '1px solid #ffccc7' : '1px solid #d9f7be'
          }}>
            {formatarValorMonetario(saldo)}
          </Text>
        );
      }
    },
    {
      title: 'Valor a Pagar',
      key: 'valorPagar',
      width: 140,
      render: (_, record) => {
        const valorAtual = valoresPagamento[record.id] || '';
        const validacaoPedido = validacao[record.id];
        const hasError = validacaoPedido?.hasValue && !validacaoPedido?.isValid;

        return (
          <MonetaryInput
            value={valorAtual}
            onChange={(value) => {
              handleValorChange(record.id, value);
            }}
            placeholder="0,00"
            size="small"
            className="monetary-input"
            status={hasError ? 'error' : ''}
            style={{ 
              width: '100%',
              borderColor: hasError ? '#ff4d4f' : undefined
            }}
          />
        );
      }
    },
    {
      title: 'Vale',
      key: 'vale',
      width: 120,
      render: (_, record) => (
        <Input
          value={valesIndividuais[record.id] || ''}
          onChange={(e) => handleValeChange(record.id, e.target.value)}
          placeholder="Vale"
          size="small"
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Obs.',
      key: 'observacoes',
      width: 60,
      render: (_, record) => (
        <Popover
          content={
            <div style={{ width: 280 }}>
              <TextArea
                rows={4}
                placeholder="Observações específicas para este pagamento..."
                value={observacoesIndividuais[record.id] || ''}
                onChange={(e) => handleObservacaoChange(record.id, e.target.value)}
                style={{ fontSize: '13px' }}
              />
            </div>
          }
          title={
            <Text strong style={{ color: '#059669' }}>
              Observações do Pagamento
            </Text>
          }
          trigger="click"
          placement="leftTop"
        >
          <Button
            size="small"
            icon={<CommentOutlined />}
            type={observacoesIndividuais[record.id] ? "primary" : "default"}
            style={{
              backgroundColor: observacoesIndividuais[record.id] ? '#059669' : undefined,
              borderColor: observacoesIndividuais[record.id] ? '#059669' : undefined
            }}
          />
        </Popover>
      )
    }
  ];

  // Usar valores do hook de validação otimizada
  const totalPagamentos = totalValido;
  const totalPedidos = quantidadeValida;

  // Tema para controlar espaçamento no mobile
  const mobileTheme = isMobile ? {
    components: {
      Form: {
        itemMarginBottom: 12,
        verticalLabelPadding: 0
      }
    }
  } : {};

  return (
    <ConfigProvider theme={mobileTheme}>
      {isMobile && (
        <style>{`
          .ant-form-item {
            margin-bottom: 12px !important;
          }
          .ant-form-item-row {
            margin-bottom: 12px !important;
          }
          .ant-form-item-explain,
          .ant-form-item-extra {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .ant-form-item-margin-offset {
            margin-bottom: 0 !important;
          }
          .ant-form-item-control {
            margin-bottom: 0 !important;
          }
          .ant-form-item-with-help .ant-form-item-explain {
            display: none !important;
          }
          .ant-col-24 > .ant-form-item {
            margin-bottom: 12px !important;
          }
          .ant-table-cell .ant-input,
          .ant-table-cell .ant-input-number-input,
          .ant-table-cell .monetary-input input {
            padding: 6px 8px !important;
            min-height: 32px !important;
          }
          .ant-table-cell .ant-form-item {
            margin-bottom: 0 !important;
          }
          /* Adicionar asterisco invisível para alinhar label de Observações Gerais */
          .observacoes-label::before {
            content: '*';
            color: transparent;
            margin-right: 6px;
          }
        `}</style>
      )}
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
            {isMobile ? 'Lançar Pagamentos' : 'Lançar Pagamentos em Lote'}
          </span>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={isMobile ? '95vw' : '90%'}
        style={{ maxWidth: isMobile ? '95vw' : "87.5rem" }}
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
          wrapper: { zIndex: 1100 }
        }}
        centered
        destroyOnClose
      >
      {/* Busca de Cliente */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Selecionar Cliente</span>
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
          body: { padding: isMobile ? "12px" : "16px" }
        }}
      >
        <SearchInputInteligente
          placeholder="Buscar cliente por nome, CPF ou CNPJ..."
          onSuggestionSelect={handleClienteSelect}
          style={{ marginBottom: 0 }}
        />

        {clienteSelecionado && (
          <Alert
            message={
              <Space>
                <Text strong>Cliente selecionado:</Text>
                <Text>{clienteSelecionado.nome}</Text>
                {clienteSelecionado.documento && clienteSelecionado.documento !== 'N/A' && (
                  <Text type="secondary">({clienteSelecionado.documento})</Text>
                )}
              </Space>
            }
            type="success"
            showIcon
            style={{ marginTop: 12, marginBottom: 0 }}
          />
        )}
      </Card>

      {/* Lista de Pedidos ou Empty State */}
      {!clienteSelecionado ? (
        <Card style={{
          marginBottom: isMobile ? 12 : 16,
          textAlign: 'center',
          padding: isMobile ? '20px 12px' : '40px 20px'
        }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                  Selecione um cliente para visualizar os pedidos
                </Text>
                <Text type="secondary" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>
                  Utilize o campo de busca acima para encontrar o cliente desejado
                </Text>
              </Space>
            }
          />
        </Card>
      ) : (
        <>

          {/* Form envolvendo tudo */}
          <Form
            form={form}
            layout="vertical"
            size={isMobile ? "small" : "large"}
            onFinish={handleSubmit}
            disabled={loading || submitLoading}
          >
            {/* Tabela de Pedidos */}
            <Card
              title={
                <Space>
                  <ShoppingCartOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    {isMobile ? `Pedidos (${pedidos.length})` : `Pedidos Pendentes (${pedidos.length})`}
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
                body: { padding: isMobile ? "12px" : "16px" }
              }}
            >
              {loadingPedidos ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  padding: isMobile ? '40px 20px' : '60px 40px'
                }}>
                  <Spin size="large" tip="Carregando pedidos...">
                    <div style={{ minHeight: '100px' }} />
                  </Spin>
                </div>
              ) : pedidos.length === 0 ? (
                <Empty
                  description="Este cliente não possui pedidos pendentes de pagamento"
                  style={{ padding: isMobile ? '12px 0' : '20px 0' }}
                />
              ) : (
                <div style={{
                  border: "0.0625rem solid #e8e8e8",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  marginBottom: isMobile ? 12 : 16
                }}>
                  <ResponsiveTable
                    columns={columns}
                    dataSource={pedidos}
                    rowKey="id"
                    loading={false}
                    minWidthMobile={1200}
                  />
                </div>
              )}
            </Card>

            {/* Resumo dos Pagamentos */}
            {clienteSelecionado && pedidos.length > 0 && (
              <Card
                loading={loadingPedidos}
                title={
                  <Space>
                    <DollarOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      {isMobile ? 'Resumo' : 'Resumo dos Pagamentos'}
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
                  body: { padding: isMobile ? "12px" : "20px" }
                }}
              >
                <Row gutter={[isMobile ? 8 : 24, isMobile ? 8 : 16]} align="middle">
                  <Col xs={24} sm={8}>
                    <div style={{
                      backgroundColor: "#fef2f2",
                      border: "0.125rem solid #ef4444",
                      borderRadius: "0.75rem",
                      padding: isMobile ? "12px" : "20px",
                      textAlign: "center",
                      boxShadow: "0 0.125rem 0.5rem rgba(239, 68, 68, 0.15)"
                    }}>
                      <div style={{ marginBottom: isMobile ? "4px" : "8px" }}>
                        <DollarOutlined style={{ fontSize: isMobile ? "24px" : "32px", color: "#ef4444" }} />
                      </div>
                      <Text style={{
                        fontSize: isMobile ? "11px" : "14px",
                        color: "#64748b",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "4px"
                      }}>
                        {isMobile ? 'SALDO DEVEDOR' : 'SALDO DEVEDOR TOTAL'}
                      </Text>
                      <Text style={{
                        fontSize: isMobile ? "20px" : "28px",
                        fontWeight: "700",
                        color: "#dc2626",
                        display: "block"
                      }}>
                        {formatarValorMonetario(pedidos.reduce((total, pedido) => {
                          const saldo = (pedido.valorFinal || 0) - (pedido.valorRecebido || 0);
                          return total + saldo;
                        }, 0))}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "0.125rem solid #0ea5e9",
                      borderRadius: "0.75rem",
                      padding: isMobile ? "12px" : "20px",
                      textAlign: "center",
                      boxShadow: "0 0.125rem 0.5rem rgba(14, 165, 233, 0.15)"
                    }}>
                      <div style={{ marginBottom: isMobile ? "4px" : "8px" }}>
                        <DollarOutlined style={{ fontSize: isMobile ? "24px" : "32px", color: "#0ea5e9" }} />
                      </div>
                      <Text style={{
                        fontSize: isMobile ? "11px" : "14px",
                        color: "#64748b",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "4px"
                      }}>
                        {isMobile ? 'QTD. PAGAMENTOS' : 'QUANTIDADE DE PAGAMENTOS'}
                      </Text>
                      <Text style={{
                        fontSize: isMobile ? "20px" : "28px",
                        fontWeight: "700",
                        color: "#0f172a",
                        display: "block"
                      }}>
                        {totalPedidos}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "0.125rem solid #22c55e",
                      borderRadius: "0.75rem",
                      padding: isMobile ? "12px" : "20px",
                      textAlign: "center",
                      boxShadow: "0 0.125rem 0.5rem rgba(34, 197, 94, 0.15)"
                    }}>
                      <div style={{ marginBottom: isMobile ? "4px" : "8px" }}>
                        <CreditCardOutlined style={{ fontSize: isMobile ? "24px" : "32px", color: "#22c55e" }} />
                      </div>
                      <Text style={{
                        fontSize: isMobile ? "11px" : "14px",
                        color: "#64748b",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "4px"
                      }}>
                        {isMobile ? 'VALOR TOTAL' : 'VALOR TOTAL DOS PAGAMENTOS'}
                      </Text>
                      <Text style={{
                        fontSize: isMobile ? "20px" : "28px",
                        fontWeight: "700",
                        color: "#15803d",
                        display: "block"
                      }}>
                        {formatarValorMonetario(totalPagamentos)}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Dados Comuns do Pagamento - Só exibe se houver pedidos */}
            {pedidos.length > 0 && (
              <Card
                title={
                  <Space>
                    <CreditCardOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      {isMobile ? 'Dados Comuns' : 'Dados Comuns dos Pagamentos'}
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
                  body: { padding: isMobile ? "12px" : "16px" }
                }}
              >
              {/* Primeira Row: Data do Pagamento */}
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      isMobile ? (
                        <Space size="small">
                          <CalendarOutlined style={{ color: "#059669" }} />
                          <Text strong style={{ color: "#059669", fontSize: "14px" }}>Data do Pagamento</Text>
                        </Space>
                      ) : (
                        <Space>
                          <CalendarOutlined style={{ color: "#059669" }} />
                          <Text strong style={{ color: "#333" }}>Data do Pagamento</Text>
                        </Space>
                      )
                    }
                    name="dataPagamento"
                    rules={[
                      { required: true, message: isMobile ? "" : "Por favor, selecione a data do pagamento" },
                    ]}
                  >
                    <MaskedDatePicker
                      size={isMobile ? "small" : "middle"}
                      style={{
                        width: "100%",
                        borderRadius: "0.375rem"
                      }}
                      placeholder="Selecione a data"
                      disabledDate={(current) => current && current > moment().endOf('day')}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      isMobile ? (
                        <Space size="small">
                          <CreditCardOutlined style={{ color: "#059669" }} />
                          <Text strong style={{ color: "#059669", fontSize: "14px" }}>Método de Pagamento</Text>
                        </Space>
                      ) : (
                        <Space>
                          <CreditCardOutlined style={{ color: "#059669" }} />
                          <Text strong style={{ color: "#333" }}>Método de Pagamento</Text>
                        </Space>
                      )
                    }
                    name="metodoPagamento"
                    rules={[
                      { required: true, message: isMobile ? "" : "Por favor, selecione o método de pagamento" },
                    ]}
                  >
                    <Select
                      size={isMobile ? "small" : "middle"}
                      placeholder="Selecione o método"
                      style={{ borderRadius: "0.375rem" }}
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
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      isMobile ? (
                        <Space size="small">
                          <BankOutlined style={{ color: "#059669" }} />
                          <Text strong style={{ color: "#059669", fontSize: "14px" }}>Conta Destino</Text>
                        </Space>
                      ) : (
                        <Space>
                          <BankOutlined style={{ color: "#059669" }} />
                          <Text strong style={{ color: "#333" }}>Conta Destino</Text>
                        </Space>
                      )
                    }
                    name="contaDestino"
                    rules={[
                      { required: true, message: isMobile ? "" : "Por favor, selecione a conta destino" },
                    ]}
                  >
                    <Select
                      size={isMobile ? "small" : "middle"}
                      placeholder="Selecione a conta"
                      style={{ borderRadius: "0.375rem" }}
                    >
                      {contasDestino.map((conta) => (
                        <Option key={conta.value} value={conta.value}>
                          {conta.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Segunda Row: Observações Gerais */}
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col span={24}>
                  <Form.Item
                    label={
                      isMobile ? (
                        <span className="observacoes-label">
                          <Space size="small">
                            <FileTextOutlined style={{ color: "#059669" }} />
                            <Text strong style={{ color: "#059669", fontSize: "14px" }}>Observações Gerais</Text>
                          </Space>
                        </span>
                      ) : (
                        <span className="observacoes-label">
                          <Space>
                            <FileTextOutlined style={{ color: "#059669" }} />
                            <Text strong style={{ color: "#333" }}>Observações Gerais</Text>
                          </Space>
                        </span>
                      )
                    }
                    name="observacoesGlobal"
                  >
                    <Input
                      size={isMobile ? "small" : "middle"}
                      placeholder={isMobile ? "Observações gerais" : "Observações que serão aplicadas aos pagamentos sem observação específica"}
                      style={{ borderRadius: "0.375rem" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              </Card>
            )}

            {/* Botões de Ação */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: isMobile ? "8px" : "12px",
              marginTop: isMobile ? "1rem" : "1.5rem",
              paddingTop: isMobile ? "12px" : "16px",
              borderTop: "1px solid #e8e8e8"
            }}>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={loading || submitLoading}
                size={isMobile ? "small" : "middle"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px"
                }}
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading || submitLoading}
                size={isMobile ? "small" : "middle"}
                disabled={!podeSalvar}
                style={{
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px"
                }}
              >
                {submitLoading ? "Processando..." : (isMobile ? `Lançar (${totalPedidos})` : `Lançar ${totalPedidos} Pagamento${totalPedidos !== 1 ? 's' : ''}`)}
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
    </ConfigProvider>
  );
};

LancarPagamentosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  loading: PropTypes.bool,
};

export default LancarPagamentosModal;