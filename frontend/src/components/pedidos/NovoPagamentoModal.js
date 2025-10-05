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
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../utils/formatters";
import { MonetaryInput, MaskedDatePicker } from "../../components/common/inputs";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import useResponsive from "../../hooks/useResponsive";

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
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {
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
    }
  }, [open, pedido, pagamentoEditando, form]);

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true);

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

      // Se estiver editando, adicionar o ID do pagamento
      if (pagamentoEditando) {
        formData.id = pagamentoEditando.id;
      }


      await onSave(formData);
      form.resetFields();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
    } finally {
      setSubmitLoading(false);
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
            {submitLoading ? (pagamentoEditando ? "Atualizando..." : "Registrando...") : (pagamentoEditando ? "Atualizar Pagamento" : "Registrar Pagamento")}
          </Button>
        </div>
      </Form>
    </Modal>
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
};

export default NovoPagamentoModal;
