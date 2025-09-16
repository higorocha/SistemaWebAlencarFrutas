// src/components/pedidos/LancarPagamentosModal.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
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
  Tooltip
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
import { MonetaryInput } from "../common/inputs";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import SearchInputInteligente from "../common/search/SearchInputInteligente";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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

const LancarPagamentosModal = ({
  open,
  onClose,
  onSave,
  onSuccess,
  loading
}) => {
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
          status: 'AGUARDANDO_PAGAMENTO,PAGAMENTO_PARCIAL'
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
            dataPagamento: values.dataPagamento.toISOString(),
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
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Data',
      dataIndex: 'dataPedido',
      key: 'dataPedido',
      width: 90,
      render: (date) => (
        <Text style={{ fontSize: '13px' }}>
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
          <Text strong style={{ fontSize: '13px', display: 'block' }}>
            {record.cliente?.nome || '-'}
          </Text>
          {record.cliente?.documento && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
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
          <Text style={{ fontSize: '12px' }} ellipsis={{ tooltip: true }}>
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
      render: (valor) => (
        <Text strong style={{ color: '#333', fontSize: '13px' }}>
          {formatarValorMonetario(valor || 0)}
        </Text>
      )
    },
    {
      title: 'Já Recebido',
      dataIndex: 'valorRecebido',
      key: 'valorRecebido',
      width: 110,
      render: (valor) => (
        <Text style={{ color: '#52c41a', fontSize: '13px' }}>
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
          <Form.Item
            name={`valorPagar_${record.id}`}
            style={{ margin: 0 }}
            validateStatus={hasError ? 'error' : ''}
            help={hasError ? validacaoPedido?.error : ''}
          >
            <MonetaryInput
              value={valorAtual}
              onChange={(value) => {
                handleValorChange(record.id, value);
              }}
              placeholder="0,00"
              size="small"
              style={{ width: '100%' }}
            />
          </Form.Item>
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
          <CreditCardOutlined style={{ marginRight: 8 }} />
          Lançar Pagamentos em Lote
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={1400}
      styles={{
        body: { maxHeight: "calc(100vh - 120px)", overflowY: "auto", overflowX: "hidden", padding: 20 },
        header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", padding: 0 },
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
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Selecionar Cliente</span>
          </Space>
        }
        style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
            padding: "8px 16px"
          },
          body: { padding: "16px" }
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
                {clienteSelecionado.documento && (
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
        <Card style={{ marginBottom: 16, textAlign: 'center', padding: '40px 20px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Selecione um cliente para visualizar os pedidos
                </Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
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
            size="large"
            onFinish={handleSubmit}
            disabled={loading || submitLoading}
          >
            {/* Tabela de Pedidos */}
            <Card
              title={
                <Space>
                  <ShoppingCartOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>
                    Pedidos Pendentes ({pedidos.length})
                  </span>
                </Space>
              }
              style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
              styles={{
                header: {
                  backgroundColor: "#059669",
                  borderBottom: "2px solid #047857",
                  color: "#ffffff",
                  borderRadius: "8px 8px 0 0",
                  padding: "8px 16px"
                },
                body: { padding: "16px" }
              }}
            >
              {pedidos.length === 0 ? (
                <Empty
                  description="Este cliente não possui pedidos pendentes de pagamento"
                  style={{ padding: '20px 0' }}
                />
              ) : (
                <div style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginBottom: 16
                }}>
                  <StyledTable
                    columns={columns}
                    dataSource={pedidos}
                    rowKey="id"
                    loading={loadingPedidos}
                    pagination={false}
                    scroll={{ x: 1200 }}
                    size="middle"
                    bordered={true}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
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
                    <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo dos Pagamentos</span>
                  </Space>
                }
                style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
                styles={{
                  header: {
                    backgroundColor: "#059669",
                    borderBottom: "2px solid #047857",
                    color: "#ffffff",
                    borderRadius: "8px 8px 0 0",
                    padding: "8px 16px"
                  },
                  body: { padding: "20px" }
                }}
              >
                <Row gutter={[24, 16]} align="middle">
                  <Col span={8}>
                    <div style={{
                      backgroundColor: "#fef2f2",
                      border: "2px solid #ef4444",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)"
                    }}>
                      <div style={{ marginBottom: "8px" }}>
                        <DollarOutlined style={{ fontSize: "32px", color: "#ef4444" }} />
                      </div>
                      <Text style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        SALDO DEVEDOR TOTAL
                      </Text>
                      <Text style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", display: "block" }}>
                        {formatarValorMonetario(pedidos.reduce((total, pedido) => {
                          const saldo = (pedido.valorFinal || 0) - (pedido.valorRecebido || 0);
                          return total + saldo;
                        }, 0))}
                      </Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "2px solid #0ea5e9",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)"
                    }}>
                      <div style={{ marginBottom: "8px" }}>
                        <DollarOutlined style={{ fontSize: "32px", color: "#0ea5e9" }} />
                      </div>
                      <Text style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        QUANTIDADE DE PAGAMENTOS
                      </Text>
                      <Text style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", display: "block" }}>
                        {totalPedidos}
                      </Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "2px solid #22c55e",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
                    }}>
                      <div style={{ marginBottom: "8px" }}>
                        <CreditCardOutlined style={{ fontSize: "32px", color: "#22c55e" }} />
                      </div>
                      <Text style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        VALOR TOTAL DOS PAGAMENTOS
                      </Text>
                      <Text style={{ fontSize: "28px", fontWeight: "700", color: "#15803d", display: "block" }}>
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
                    <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados Comuns dos Pagamentos</span>
                  </Space>
                }
                style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
                styles={{
                  header: {
                    backgroundColor: "#059669",
                    borderBottom: "2px solid #047857",
                    color: "#ffffff",
                    borderRadius: "8px 8px 0 0",
                    padding: "8px 16px"
                  },
                  body: { padding: "16px" }
                }}
              >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item
                    label={
                      <Space>
                        <CalendarOutlined style={{ color: "#059669" }} />
                        <Text strong style={{ color: "#333" }}>Data do Pagamento</Text>
                      </Space>
                    }
                    name="dataPagamento"
                    rules={[
                      { required: true, message: "Por favor, selecione a data do pagamento" },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%", borderRadius: 6 }}
                      format="DD/MM/YYYY"
                      placeholder="Selecione a data"
                      disabledDate={(current) => current && current > moment().endOf('day')}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label={
                      <Space>
                        <CreditCardOutlined style={{ color: "#059669" }} />
                        <Text strong style={{ color: "#333" }}>Método de Pagamento</Text>
                      </Space>
                    }
                    name="metodoPagamento"
                    rules={[
                      { required: true, message: "Por favor, selecione o método de pagamento" },
                    ]}
                  >
                    <Select placeholder="Selecione o método" style={{ borderRadius: 6 }}>
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

                <Col span={8}>
                  <Form.Item
                    label={
                      <Space>
                        <BankOutlined style={{ color: "#059669" }} />
                        <Text strong style={{ color: "#333" }}>Conta Destino</Text>
                      </Space>
                    }
                    name="contaDestino"
                    rules={[
                      { required: true, message: "Por favor, selecione a conta destino" },
                    ]}
                  >
                    <Select placeholder="Selecione a conta" style={{ borderRadius: 6 }}>
                      {contasDestino.map((conta) => (
                        <Option key={conta.value} value={conta.value}>
                          {conta.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    label={
                      <Space>
                        <FileTextOutlined style={{ color: "#059669" }} />
                        <Text strong style={{ color: "#333" }}>Observações Gerais</Text>
                      </Space>
                    }
                    name="observacoesGlobal"
                  >
                    <Input
                      placeholder="Observações que serão aplicadas aos pagamentos sem observação específica"
                      style={{ borderRadius: 6, borderColor: "#d9d9d9" }}
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
              gap: 16,
              marginTop: 32,
              paddingTop: 20,
              borderTop: "2px solid #e8e8e8",
              backgroundColor: "#fafafa",
              margin: "32px -20px -20px -20px",
              padding: "20px 20px",
              borderRadius: "0 0 8px 8px"
            }}>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={loading || submitLoading}
                size="large"
                style={{
                  height: "48px",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "6px",
                  minWidth: "120px"
                }}
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading || submitLoading}
                size="large"
                disabled={!podeSalvar}
                style={{
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  height: "48px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  minWidth: "200px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                }}
              >
                {submitLoading ? "Processando..." : `Lançar ${totalPedidos} Pagamento${totalPedidos !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
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