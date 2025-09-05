// src/components/pedidos/NovoPagamentoModal.js

import React, { useState, useEffect, useRef } from "react";
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
import { MaskedDecimalInput } from "../../components/common/inputs";

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
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Ref para controlar o valor original da data de pagamento
  const dataPagamentoOriginalRef = useRef(null);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {
      if (pagamentoEditando) {
        // MODO EDIÇÃO: Carrega os dados diretamente.
        // O MaskedDecimalInput corrigido irá renderizar o valor corretamente.
        const dataPagamento = moment(pagamentoEditando.dataPagamento);
        dataPagamentoOriginalRef.current = dataPagamento;

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
        dataPagamentoOriginalRef.current = dataPagamento;

        form.setFieldsValue({
          pedidoId: pedido.id,
          dataPagamento: dataPagamento,
          contaDestino: 'ALENCAR', // Valor padrão
        });
      }
    } else {
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
      if (valorRecebido > valorRestante) {
        form.setFields([
          {
            name: 'valorRecebido',
            errors: [`Valor não pode exceder R$ ${formatarValorMonetario(valorRestante)}`],
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
        dataPagamento: values.dataPagamento.toISOString(),
      };

      // Se estiver editando, adicionar o ID do pagamento
      if (pagamentoEditando) {
        formData.id = pagamentoEditando.id;
      }

      console.log("Dados do pagamento:", formData); // Debug

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

  // Função para gerenciar o foco do campo de data
  const handleDataPagamentoFocus = () => {
    // Limpa o campo quando recebe foco
    form.setFieldValue('dataPagamento', null);
  };

  // Função para gerenciar a perda de foco do campo de data
  const handleDataPagamentoBlur = () => {
    const valorAtual = form.getFieldValue('dataPagamento');
    
    // Se não há valor selecionado, restaura o valor original
    if (!valorAtual) {
      form.setFieldValue('dataPagamento', dataPagamentoOriginalRef.current);
    }
  };

  // Opções de método de pagamento
  const metodosPagamento = [
    { 
      value: 'PIX', 
      label: 'PIX', 
      color: '#52c41a',
      icon: '💳'
    },
    { 
      value: 'BOLETO', 
      label: 'Boleto Bancário', 
      color: '#1890ff',
      icon: '🧾'
    },
    { 
      value: 'TRANSFERENCIA', 
      label: 'Transferência Bancária', 
      color: '#722ed1',
      icon: '🏦'
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
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <CreditCardOutlined style={{ marginRight: 8 }} />
          {pagamentoEditando ? "Editar Pagamento" : "Novo Pagamento"}
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      styles={{
        body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto", overflowX: "hidden", padding: 20 },
        header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", padding: 0 },
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
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo do Pedido</span>
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
              body: { padding: "12px 16px" }
            }}
          >
            <Row gutter={12} align="middle">
              <Col span={12}>
                <Statistic
                  title={<Text strong style={{ fontSize: "12px" }}>Pedido</Text>}
                  value={pedido.numeroPedido}
                  valueStyle={{ fontSize: "14px" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text strong style={{ fontSize: "12px" }}>Valor Restante</Text>}
                  value={formatarValorMonetario(valorRestante)}
                  valueStyle={{ 
                    fontSize: "14px", 
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados do Pagamento</span>
            </Space>
          }
          style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
          styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong style={{ color: "#333" }}>Valor Recebido</Text>
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
                      
                      if (numValue > valorRestante) {
                        return Promise.reject(new Error(`Valor não pode exceder R$ ${formatarValorMonetario(valorRestante)}`));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MaskedDecimalInput
                  placeholder="0,00"
                  style={{ borderRadius: 6 }}
                  addonAfter="R$"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
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
                  onFocus={handleDataPagamentoFocus}
                  onBlur={handleDataPagamentoBlur}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
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
                        <span>{metodo.icon}</span>
                        <span>{metodo.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
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

          <Form.Item 
            label={
              <Space>
                <FileTextOutlined style={{ color: "#059669" }} />
                <Text strong style={{ color: "#333" }}>Observações do Pagamento</Text>
              </Space>
            }
            name="observacoesPagamento"
          >
            <TextArea
              rows={3}
              placeholder="Observações sobre o pagamento (opcional)"
              style={{ borderRadius: 6, borderColor: "#d9d9d9" }}
            />
          </Form.Item>

          <Form.Item 
            label={
              <Space>
                <FileTextOutlined style={{ color: "#059669" }} />
                <Text strong style={{ color: "#333" }}>Referência Externa</Text>
              </Space>
            }
            name="referenciaExterna"
          >
            <Input
              placeholder="Campo opcional"
              style={{ borderRadius: 6, borderColor: "#d9d9d9" }}
            />
          </Form.Item>
        </Card>

        {/* Botões de Ação */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <Button 
            icon={<CloseOutlined />} 
            onClick={handleCancel} 
            disabled={loading || submitLoading} 
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading || submitLoading}
            size="large"
            disabled={valorRestante <= 0}
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
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
