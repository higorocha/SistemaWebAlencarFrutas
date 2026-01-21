// src/components/pedidos/NovoPagamentoModal.js

import React, { useState, useEffect } from "react";
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
  Statistic,
  Alert,
  Tooltip,
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
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../utils/formatters";
import { MonetaryInput, MaskedDatePicker } from "../../components/common/inputs";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import useResponsive from "../../hooks/useResponsive";
import axiosInstance from "../../api/axiosConfig";
import AddEditClienteDialog from "../clientes/AddEditClienteDialog";
import { showNotification } from "../../config/notificationConfig";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const NovoPagamentoModal = ({
  open,
  onClose,
  onSave,
  pedido,
  valorRestante,
  loading,
  pagamentoEditando,
  boletoClienteErro,
  onClearBoletoClienteErro,
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [contasCorrentes, setContasCorrentes] = useState([]);
  const [loadingContas, setLoadingContas] = useState(false);

  // Quando o backend retornar "cliente incompleto para boleto", guardamos aqui
  // para exibir o botão "Atualizar cliente" ao lado do "Gerar Boleto".
  const [boletoClienteErroState, setBoletoClienteErroState] = useState(null); // { clienteId, clienteNome, missingFields }
  const [boletoApiErroState, setBoletoApiErroState] = useState(null); // { mensagem, erros }

  // Modal de edição do cliente (reutiliza AddEditClienteDialog)
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteDialogLoading, setClienteDialogLoading] = useState(false);
  
  // Observar mudança no campo metodoPagamento para mostrar/ocultar campo dataVencimento
  const metodoPagamento = Form.useWatch('metodoPagamento', form);

  // Carregar contas correntes com convênio de cobrança quando modal abrir e método for BOLETO
  useEffect(() => {
    const fetchContasCorrentes = async () => {
      // Só buscar contas se o método de pagamento for BOLETO
      if (metodoPagamento !== 'BOLETO') {
        setContasCorrentes([]);
        return;
      }

      try {
        setLoadingContas(true);
        // Somente contas aptas para emitir boleto:
        // - convênio de cobrança cadastrado
        // - credenciais API "001 - Cobrança" cadastradas
        const response = await axiosInstance.get('/contacorrente/com-convenio-e-credenciais-cobranca');
        setContasCorrentes(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar contas correntes:", error);
        setContasCorrentes([]);
      } finally {
        setLoadingContas(false);
      }
    };

    if (open) {
      fetchContasCorrentes();
    }
  }, [open, metodoPagamento]);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {
      // Se o componente for reaberto após erro (destroyOnClose), sincronizar com o erro vindo do pai
      setBoletoClienteErroState(boletoClienteErro || null);
      setBoletoApiErroState(null);
      if (pagamentoEditando) {
        // MODO EDIÇÃO: Carrega os dados diretamente.
        const dataPagamento = moment(pagamentoEditando.dataPagamento);

        form.setFieldsValue({
          pedidoId: pedido.id,
          dataPagamento: dataPagamento,
          valorRecebido: pagamentoEditando.valorRecebido,
          metodoPagamento: pagamentoEditando.metodoPagamento,
          contaDestino: pagamentoEditando.contaDestino,
          observacoesPagamento: pagamentoEditando.observacoesPagamento,
          referenciaExterna: pagamentoEditando.referenciaExterna,
        });

      } else {
        // MODO CRIAÇÃO: Define valores padrão.
        const dataPagamento = moment();

        form.setFieldsValue({
          pedidoId: pedido.id,
          dataPagamento: dataPagamento,
          contaDestino: 'ALENCAR', // Valor padrão
        });
      }
    } else if (open) {
      // Garante que o formulário seja limpo se o modal for fechado sem pedido.
      form.resetFields();
      setBoletoClienteErroState(boletoClienteErro || null);
      setBoletoApiErroState(null);
    } else {
      // Ao fechar, limpar estados auxiliares
      setBoletoClienteErroState(null);
      setBoletoApiErroState(null);
      setClienteDialogOpen(false);
      setClienteEditando(null);
    }
  }, [open, pedido, pagamentoEditando, form, boletoClienteErro]);

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true);
      setBoletoClienteErroState(null);
      setBoletoApiErroState(null);
      onClearBoletoClienteErro?.();

      // Converter valor para número se necessário
      const valorRecebido = typeof values.valorRecebido === 'string' ? parseFloat(values.valorRecebido) : values.valorRecebido;
      
      // Validação adicional: verificar se o valor não excede o restante
      // No modo de edição, considerar o valor original do pagamento
      let valorLimite = valorRestante;
      if (pagamentoEditando) {
        // Se está editando, somar o valor original do pagamento ao valor restante
        const valorOriginalPagamento = pagamentoEditando.valorRecebido || 0;
        valorLimite = valorRestante + valorOriginalPagamento;
      }
      
      if (valorRecebido > valorLimite) {
        form.setFields([
          {
            name: 'valorRecebido',
            errors: [`Valor não pode exceder R$ ${formatarValorMonetario(valorLimite)}`],
          },
        ]);
        return;
      }

      // Garantir que pedidoId seja um número
      const pedidoId = pedido?.id ? Number(pedido.id) : null;
      
      if (!pedidoId) {
        console.error("PedidoId não encontrado:", pedido);
        throw new Error("ID do pedido não encontrado");
      }

      const formData = {
        ...values,
        pedidoId: pedidoId, // Garantir que seja número
        valorRecebido: valorRecebido, // Garantir que seja número
        dataPagamento: values.dataPagamento.startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss'),
      };

      // Se for boleto, incluir dataVencimento formatada e contaCorrenteId
      if (formData.metodoPagamento === 'BOLETO') {
        if (values.dataVencimento) {
          formData.dataVencimento = values.dataVencimento.format('YYYY-MM-DD');
        }
        // contaCorrenteId deve ser preenchido no formulário
        if (!formData.contaCorrenteId) {
          throw new Error("Conta corrente é obrigatória para criar boleto");
        }
      }

      // Se estiver editando, adicionar o ID do pagamento
      if (pagamentoEditando) {
        formData.id = pagamentoEditando.id;
      }


      await onSave(formData);
      form.resetFields();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);

      // Se o backend bloquear por cadastro incompleto, habilitar ação de editar cliente
      const data = error?.response?.data;
      if (values?.metodoPagamento === "BOLETO" && data?.code === "CLIENTE_INCOMPLETO_BOLETO") {
        setBoletoClienteErroState({
          clienteId: data?.clienteId,
          clienteNome: data?.clienteNome,
          missingFields: data?.missingFields || [],
        });
        return;
      }

      if (values?.metodoPagamento === "BOLETO" && Array.isArray(data?.erros) && data.erros.length > 0) {
        setBoletoApiErroState({
          mensagem: data?.message || "Erro ao registrar boleto no Banco do Brasil",
          erros: data.erros,
        });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAbrirEdicaoCliente = async () => {
    const clienteId = boletoClienteErroState?.clienteId;
    if (!clienteId) {
      showNotification("warning", "Cliente não identificado", "Não foi possível identificar o cliente para edição.");
      return;
    }

    try {
      setClienteDialogLoading(true);
      const resp = await axiosInstance.get(`/api/clientes/${clienteId}`);
      setClienteEditando(resp.data);
      setClienteDialogOpen(true);
    } catch (e) {
      console.error("Erro ao buscar cliente para edição:", e);
      const msg = e?.response?.data?.message || "Erro ao carregar dados do cliente";
      showNotification("error", "Erro", msg);
    } finally {
      setClienteDialogLoading(false);
    }
  };

  const handleSalvarCliente = async (clienteData) => {
    const clienteId = clienteEditando?.id || boletoClienteErroState?.clienteId;
    if (!clienteId) {
      showNotification("warning", "Cliente não identificado", "Não foi possível identificar o cliente para salvar.");
      return;
    }

    try {
      setClienteDialogLoading(true);
      await axiosInstance.patch(`/api/clientes/${clienteId}`, clienteData);
      showNotification("success", "Sucesso", "Cliente atualizado com sucesso! Agora você pode gerar o boleto.");
      setClienteDialogOpen(false);
      setClienteEditando(null);
      setBoletoClienteErroState(null);
      onClearBoletoClienteErro?.();
    } catch (e) {
      console.error("Erro ao salvar cliente:", e);
      const msg = e?.response?.data?.message || "Erro ao salvar cliente";
      showNotification("error", "Erro", msg);
      throw e; // deixa o modal manter os dados se necessário
    } finally {
      setClienteDialogLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };


  // Opções de método de pagamento
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

  // Opções de conta destino (conforme enum do modelo)
  const contasDestino = [
    { value: 'ALENCAR', label: 'Alencar' },
    { value: 'FRANCIALDA', label: 'Francialda' },
    { value: 'GAVETA', label: 'Gaveta' },
  ];

  return (
    <>
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
          {pagamentoEditando ? (isMobile ? "Editar" : "Editar Pagamento") : (isMobile ? "Novo" : "Novo Pagamento")}
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "37.5rem" }}
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
      {pedido && (
        <>
          {/* Resumo do Pedido */}
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Resumo do Pedido
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
              body: { padding: isMobile ? "8px 12px" : "12px 16px" }
            }}
          >
            <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} align="middle">
              <Col xs={24} sm={12}>
                <Statistic
                  title={<Text strong style={{ fontSize: "12px" }}>Pedido</Text>}
                  value={pedido.numeroPedido}
                  valueStyle={{ fontSize: "14px" }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title={<Text strong style={{ fontSize: "0.75rem" }}>Valor Restante</Text>}
                  value={formatarValorMonetario(valorRestante)}
                  valueStyle={{ 
                    fontSize: "0.875rem", 
                    color: valorRestante > 0 ? "#cf1322" : "#059669",
                    fontWeight: "bold"
                  }}
                />
              </Col>
            </Row>
          </Card>

          {/* Alerta de validação */}
          {valorRestante <= 0 && (
            <Alert
              message="Pedido já está totalmente pago"
              description="Não é possível adicionar mais pagamentos a este pedido."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Alerta de erro da API do BB ao registrar boleto */}
          {boletoApiErroState?.erros?.length > 0 && (
            <Alert
              message={boletoApiErroState.mensagem || "Erro ao registrar boleto"}
              description={
                <div>
                  {boletoApiErroState.erros.map((erro, index) => (
                    <div key={`${erro.codigo || "BB"}-${index}`}>
                      • {erro.mensagem || "Erro não identificado"}
                      {erro.providencia ? ` — ${erro.providencia}` : ""}
                    </div>
                  ))}
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSubmit}
        disabled={loading || submitLoading || valorRestante <= 0}
      >
        {/* Dados do Pagamento */}
        <Card
          title={
            <Space>
              <CreditCardOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Dados do Pagamento
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
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Valor Recebido</span>
                  </Space>
                }
                name="valorRecebido"
                rules={[
                  { required: true, message: "Por favor, informe o valor recebido" },
                  {
                    validator: (_, value) => {
                      // Converter string para número se necessário
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      
                      if (!numValue || numValue <= 0) {
                        return Promise.reject(new Error("Valor deve ser maior que zero"));
                      }
                      
                      // No modo de edição, considerar o valor original do pagamento
                      let valorLimite = valorRestante;
                      if (pagamentoEditando) {
                        // Se está editando, somar o valor original do pagamento ao valor restante
                        const valorOriginalPagamento = pagamentoEditando.valorRecebido || 0;
                        valorLimite = valorRestante + valorOriginalPagamento;
                      }
                      
                      if (numValue > valorLimite) {
                        return Promise.reject(new Error(`Valor não pode exceder R$ ${formatarValorMonetario(valorLimite)}`));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MonetaryInput
                  placeholder="0,00"
                  style={{ borderRadius: 6 }}
                  addonAfter="R$"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Data do Pagamento</span>
                  </Space>
                }
                name="dataPagamento"
                rules={[
                  { required: true, message: "Por favor, selecione a data do pagamento" },
                ]}
              >
                <MaskedDatePicker
                  style={{ width: "100%", borderRadius: "0.375rem" }}
                  placeholder="Selecione a data"
                  disabledDate={(current) => current && current > moment().endOf('day')}
                  size={isMobile ? "middle" : "large"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <CreditCardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Método de Pagamento</span>
                  </Space>
                }
                name="metodoPagamento"
                rules={[
                  { required: true, message: "Por favor, selecione o método de pagamento" },
                ]}
              >
                <Select 
                  placeholder="Selecione o método" 
                  style={{ borderRadius: "0.375rem" }}
                  size={isMobile ? "middle" : "large"}
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

            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <BankOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Conta Destino</span>
                  </Space>
                }
                name="contaDestino"
                rules={[
                  { required: true, message: "Por favor, selecione a conta destino" },
                ]}
              >
                <Select 
                  placeholder="Selecione a conta" 
                  style={{ borderRadius: "0.375rem" }}
                  size={isMobile ? "middle" : "large"}
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

          {/* Campo de Data de Vencimento - Mostrar apenas quando método for BOLETO */}
          {metodoPagamento === 'BOLETO' && (
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333" }}>Data de Vencimento</span>
                    </Space>
                  }
                  name="dataVencimento"
                  rules={[
                    { required: true, message: "Por favor, selecione a data de vencimento do boleto" },
                  ]}
                >
                  <MaskedDatePicker
                    style={{ width: "100%", borderRadius: "0.375rem" }}
                    placeholder="Data de vencimento"
                    disabledDate={(current) => current && current < moment().startOf('day')}
                    size={isMobile ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={
                    <Space>
                      <BankOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333" }}>Conta Corrente</span>
                      <Tooltip
                        placement="top"
                        title={
                          <div style={{ maxWidth: 320 }}>
                            Para gerar boleto, a conta precisa estar configurada em:
                            <br />- <b>Credenciais API</b> com modalidade <b>001 - Cobrança</b>
                            <br />- <b>Convênios</b> (convênio de cobrança)
                            <br />
                            <br />
                            Se a conta não aparecer aqui, verifique essas configurações em <b>Configurações → Dados Bancários</b>.
                          </div>
                        }
                      >
                        <InfoCircleOutlined
                          style={{
                            marginLeft: 6,
                            color: "#059669",
                            cursor: "help",
                            fontSize: 14,
                          }}
                        />
                      </Tooltip>
                    </Space>
                  }
                  name="contaCorrenteId"
                  rules={[
                    { required: true, message: "Por favor, selecione a conta corrente para o boleto" },
                  ]}
                >
                  <Select 
                    placeholder="Selecione a conta corrente" 
                    style={{ borderRadius: "0.375rem" }}
                    size={isMobile ? "middle" : "large"}
                    loading={loadingContas}
                  >
                    {contasCorrentes.map((conta) => (
                      <Option key={conta.id} value={conta.id}>
                        {conta.agencia} / {conta.contaCorrente} - {conta.bancoCodigo === '001' ? 'Banco do Brasil' : conta.bancoCodigo}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item 
            label={
              <Space>
                <FileTextOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#333" }}>Observações do Pagamento</span>
              </Space>
            }
            name="observacoesPagamento"
          >
            <TextArea
              rows={isMobile ? 2 : 3}
              placeholder="Observações sobre o pagamento (opcional)"
              style={{ borderRadius: "0.375rem", borderColor: "#d9d9d9" }}
            />
          </Form.Item>

          <Form.Item 
            label={
              <Space>
                <FileTextOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#333" }}>Referência Externa(Vale)</span>
              </Space>
            }
            name="referenciaExterna"
          >
            <Input
              placeholder="Campo opcional"
              style={{ borderRadius: "0.375rem", borderColor: "#d9d9d9" }}
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>
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
            icon={<CloseOutlined />} 
            onClick={handleCancel} 
            disabled={loading || submitLoading} 
            size={isMobile ? "small" : "large"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Cancelar
          </Button>

          {/* Ação contextual: se boleto falhou por cadastro incompleto, oferecer edição do cliente */}
          {metodoPagamento === "BOLETO" && boletoClienteErroState?.clienteId && (
            <Button
              icon={<UserOutlined />}
              onClick={handleAbrirEdicaoCliente}
              loading={clienteDialogLoading}
              disabled={loading || submitLoading}
              size={isMobile ? "small" : "large"}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
              }}
            >
              Atualizar cliente
            </Button>
          )}

          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading || submitLoading}
            size={isMobile ? "small" : "large"}
            disabled={valorRestante <= 0}
            style={{ 
              backgroundColor: '#059669', 
              borderColor: '#059669',
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            {submitLoading 
              ? (pagamentoEditando 
                  ? "Atualizando..." 
                  : (metodoPagamento === 'BOLETO' ? "Registrando boleto..." : "Registrando..."))
              : (pagamentoEditando 
                  ? "Atualizar Pagamento" 
                  : (metodoPagamento === 'BOLETO' ? "Gerar Boleto" : "Registrar Pagamento"))}
          </Button>
        </div>
      </Form>
    </Modal>

    {/* Modal de edição do cliente (aberto a partir do erro do boleto) */}
    <AddEditClienteDialog
      open={clienteDialogOpen}
      onClose={() => {
        setClienteDialogOpen(false);
        setClienteEditando(null);
      }}
      onSave={handleSalvarCliente}
      cliente={clienteEditando}
      loading={clienteDialogLoading}
      requiredBoletoFields={boletoClienteErroState?.missingFields || []}
    />
    </>
  );
};

NovoPagamentoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  valorRestante: PropTypes.number,
  loading: PropTypes.bool,
  pagamentoEditando: PropTypes.object,
  boletoClienteErro: PropTypes.object,
  onClearBoletoClienteErro: PropTypes.func,
};

export default NovoPagamentoModal;
