

import React, { useState, useEffect } from "react";
import { Modal, Button, Space, message, Form, Input, Select, DatePicker, Row, Col, Typography, Card, Divider } from "antd";
import PropTypes from "prop-types";
import { 
  SaveOutlined, 
  CloseOutlined, 
  ShoppingCartOutlined,
  UserOutlined,
  AppleOutlined,
  CalendarOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import { MaskedDecimalInput } from "../../components/common/inputs";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import moment from "moment";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const NovoPedidoModal = ({
  open,
  onClose,
  onSave,
  loading,
  clientes,
}) => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [frutas, setFrutas] = useState([]);

  // Carregar frutas ativas
  useEffect(() => {
    const fetchFrutas = async () => {
      try {
        const response = await axiosInstance.get("/api/frutas");
        const frutasAtivas = response.data.data?.filter(fruta => fruta.status === 'ATIVA') || [];
        setFrutas(frutasAtivas);
      } catch (error) {
        console.error("Erro ao buscar frutas:", error);
        showNotification("error", "Erro", "Erro ao carregar frutas");
      }
    };

    if (open) {
      fetchFrutas();
    }
  }, [open]);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open) {
      form.resetFields();
      // Adicionar primeira fruta por padrão
      form.setFieldsValue({
        frutas: [{
          frutaId: undefined,
          quantidadePrevista: undefined,
          unidadeMedida1: undefined,
          unidadeMedida2: undefined
        }]
      });
    }
  }, [open, form]);

  const unidadesMedida = [
    { value: 'KG', label: 'Quilogramas (KG)' },
    { value: 'TON', label: 'Toneladas (TON)' },
    { value: 'CX', label: 'Caixas (CX)' },
    { value: 'UND', label: 'Unidades (UND)' },
  ];

  const handleSalvarPedido = async (values) => {
    try {
      setIsSaving(true);

      // Validar se pelo menos uma fruta foi selecionada
      if (!values.frutas || values.frutas.length === 0) {
        showNotification("error", "Erro", "Adicione pelo menos uma fruta ao pedido");
        return;
      }

      // Validar se todas as frutas têm dados obrigatórios
      for (let i = 0; i < values.frutas.length; i++) {
        const fruta = values.frutas[i];
        if (!fruta.frutaId || !fruta.quantidadePrevista || !fruta.unidadeMedida1) {
          showNotification("error", "Erro", `Complete todos os campos obrigatórios da fruta ${i + 1}`);
          return;
        }
        
        // Validar se as unidades são diferentes
        if (fruta.unidadeMedida2 && fruta.unidadeMedida1 === fruta.unidadeMedida2) {
          showNotification("warning", "Aviso", `As unidades de medida da fruta ${i + 1} devem ser diferentes`);
          return;
        }
      }

      const formData = {
        ...values,
        dataPrevistaColheita: values.dataPrevistaColheita 
          ? moment(values.dataPrevistaColheita).startOf('day').toISOString()
          : undefined,
      };

      await onSave(formData);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    form.resetFields();
    onClose();
  };

  // Adicionar nova fruta
  const adicionarFruta = () => {
    const frutasAtuais = form.getFieldValue('frutas') || [];
    form.setFieldsValue({
      frutas: [...frutasAtuais, {
        frutaId: undefined,
        quantidadePrevista: undefined,
        unidadeMedida1: undefined,
        unidadeMedida2: undefined
      }]
    });
  };

  // Remover fruta
  const removerFruta = (index) => {
    const frutasAtuais = form.getFieldValue('frutas') || [];
    if (frutasAtuais.length > 1) {
      const novasFrutas = frutasAtuais.filter((_, i) => i !== index);
      form.setFieldsValue({ frutas: novasFrutas });
    }
  };

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
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Novo Pedido
        </span>
      }
      open={open}
      onCancel={handleCancelar}
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
      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSalvarPedido}
        initialValues={{
          frutas: [{
            frutaId: undefined,
            quantidadePrevista: undefined,
            unidadeMedida1: undefined,
            unidadeMedida2: undefined
          }]
        }}
      >
        {/* Seção 1: Informações do Pedido */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Pedido</span>
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
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Cliente</span>
                  </Space>
                }
                name="clienteId"
                rules={[
                  { required: true, message: "Cliente é obrigatório" },
                ]}
              >
                <Select
                  placeholder="Selecione um cliente"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                >
                  {clientes.map((cliente) => (
                    <Option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Data Prevista para Colheita</span>
                  </Space>
                }
                name="dataPrevistaColheita"
                rules={[
                  { required: true, message: "Data prevista para colheita é obrigatória" },
                ]}
              >
                <DatePicker
                  style={{ 
                    width: "100%",
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                  format="DD/MM/YYYY"
                  placeholder="Selecione a data"
                  disabledDate={(current) => current && current < moment().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Frutas do Pedido */}
        <Card
          title={
            <Space>
              <AppleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas do Pedido</span>
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
          <Form.List name="frutas">
            {(fields, { add, remove }) => (
              <>
                {/* Cabeçalho das colunas */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
                  <Col xs={24} md={6}>
                                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <AppleOutlined style={{ marginRight: 8 }} />
                       Fruta
                     </span>
                  </Col>
                  <Col xs={24} md={4}>
                                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <CalculatorOutlined style={{ marginRight: 8 }} />
                       Quantidade
                     </span>
                  </Col>
                  <Col xs={24} md={6}>
                                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <CalculatorOutlined style={{ marginRight: 8 }} />
                       Unidade Principal
                     </span>
                  </Col>
                  <Col xs={24} md={6}>
                                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <CalculatorOutlined style={{ marginRight: 8 }} />
                       Unidade Secundária
                     </span>
                  </Col>
                  <Col xs={24} md={2}>
                                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       Ações
                     </span>
                  </Col>
                </Row>

                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    <Row gutter={[16, 16]} align="baseline">
                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'frutaId']}
                          rules={[
                            { required: true, message: "Fruta é obrigatória" },
                          ]}
                        >
                          <Select
                            placeholder="Selecione uma fruta"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              option.children.toLowerCase().includes(input.toLowerCase())
                            }
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          >
                            {frutas.map((fruta) => (
                              <Option key={fruta.id} value={fruta.id}>
                                {fruta.nome}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantidadePrevista']}
                          rules={[
                            { required: true, message: "Quantidade prevista deve ser maior que 0" },
                          ]}
                          // NORMALIZADOR: Converte o valor de texto para número puro
                          normalize={(value) => {
                            if (!value) return null;
                            const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                            return isNaN(numero) ? null : numero;
                          }}
                        >
                          <MaskedDecimalInput
                            placeholder="Ex: 1.234,56"
                            size="large"
                            style={{ 
                              width: "100%",
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unidadeMedida1']}
                          rules={[
                            { required: true, message: "Unidade de medida principal é obrigatória" },
                          ]}
                        >
                          <Select 
                            placeholder="Selecione a unidade"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          >
                            {unidadesMedida.map((unidade) => (
                              <Option key={unidade.value} value={unidade.value}>
                                {unidade.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unidadeMedida2']}
                        >
                          <Select 
                            placeholder="Selecione a unidade (opcional)" 
                            allowClear
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          >
                            {unidadesMedida.map((unidade) => (
                              <Option key={unidade.value} value={unidade.value}>
                                {unidade.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={2}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          {/* Botão de remover para todas as frutas */}
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              remove(name);
                              removerFruta(index);
                            }}
                            size="large"
                            style={{
                              borderRadius: "50px",
                              height: "40px",
                              width: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              border: "2px solid #ff4d4f",
                              color: "#ff4d4f",
                              backgroundColor: "#ffffff",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#fff2f0";
                              e.target.style.transform = "scale(1.05)";
                              e.target.style.transition = "all 0.2s ease";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#ffffff";
                              e.target.style.transform = "scale(1)";
                            }}
                          />

                          {/* Botão de adicionar apenas na última fruta */}
                          {index === fields.length - 1 && (
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={adicionarFruta}
                              size="large"
                              style={{
                                borderRadius: "50px",
                                borderColor: "#10b981",
                                color: "#10b981",
                                borderWidth: "2px",
                                height: "40px",
                                width: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                backgroundColor: "#ffffff",
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#f0fdf4";
                                e.target.style.borderColor = "#059669";
                                e.target.style.color = "#059669";
                                e.target.style.transform = "scale(1.05)";
                                e.target.style.transition = "all 0.2s ease";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#ffffff";
                                e.target.style.borderColor = "#10b981";
                                e.target.style.color = "#10b981";
                                e.target.style.transform = "scale(1)";
                              }}
                            />
                          )}
                        </div>
                      </Col>
                    </Row>
                    {index < fields.length - 1 && <Divider style={{ margin: "16px 0" }} />}
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Card>

        {/* Seção 3: Observações */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Observações</span>
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
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações sobre o Pedido</span>
                  </Space>
                }
                name="observacoes"
              >
                <TextArea
                  rows={4}
                  placeholder="Observações sobre o pedido (opcional)"
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancelar}
            disabled={loading || isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading || isSaving}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {isSaving ? "Criando..." : "Criar Pedido"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

NovoPedidoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  clientes: PropTypes.array.isRequired,
};

export default NovoPedidoModal;
