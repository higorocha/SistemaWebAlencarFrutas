

import React, { useState, useEffect } from "react";
import { Modal, Button, Space, message, Form, Input, Select, Row, Col, Typography, Card, Divider } from "antd";
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
import { MonetaryInput, MaskedDatePicker } from "../../components/common/inputs";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { validarFrutasDuplicadas, validarPedidoCompleto } from "../../utils/pedidoValidation";
import useResponsive from "../../hooks/useResponsive";
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
  onLoadingChange, // Callback para controlar CentralizedLoader
}) => {
  const { isMobile } = useResponsive();
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
    { value: 'ML', label: 'Mililitros (ML)' },
    { value: 'LT', label: 'Litros (LT)' },
  ];

  const handleSalvarPedido = async (values) => {
    try {
      setIsSaving(true);

      // 🔍 DEBUG: Verificar valores recebidos
      console.log('📋 Valores recebidos do formulário:', values);
      console.log('📅 Data do pedido RAW:', values.dataPedido);
      console.log('📅 Data prevista colheita RAW:', values.dataPrevistaColheita);
      console.log('📅 Tipo da data do pedido:', typeof values.dataPedido);
      console.log('📅 Tipo da data prevista:', typeof values.dataPrevistaColheita);

      // ✅ NOVA VALIDAÇÃO: Usar validação completa do pedido
      console.log('🔍 Validando pedido completo...', {
        totalFrutas: values.frutas?.length || 0,
        frutas: values.frutas?.map(f => ({ frutaId: f.frutaId, nome: frutas.find(fr => fr.id === f.frutaId)?.nome }))
      });

      const resultadoValidacao = validarPedidoCompleto(values, frutas);

      if (!resultadoValidacao.valido) {
        console.error('❌ Validação do pedido falhou:', {
          erros: resultadoValidacao.erros,
          avisos: resultadoValidacao.avisos
        });

        // Mostrar primeiro erro encontrado
        const primeiroErro = resultadoValidacao.erros[0] || "Erro de validação";
        showNotification("error", "Erro de Validação", primeiroErro);

        // Log todos os erros para debug
        if (resultadoValidacao.erros.length > 1) {
          console.warn('Erros adicionais encontrados:', resultadoValidacao.erros.slice(1));
        }

        return;
      }

      // Mostrar avisos se existirem (mas não bloquear)
      if (resultadoValidacao.avisos.length > 0) {
        console.warn('⚠️ Avisos encontrados:', resultadoValidacao.avisos);
        resultadoValidacao.avisos.forEach(aviso => {
          showNotification("warning", "Aviso", aviso);
        });
      }

      console.log('✅ Validação do pedido passou!');

      // Validação simples das datas
      if (values.dataPedido && values.dataPrevistaColheita) {
        if (moment(values.dataPrevistaColheita).isBefore(moment(values.dataPedido), 'day')) {
          showNotification("error", "Erro", "Data prevista para colheita não pode ser anterior à data do pedido");
          return;
        }
      }

      // PADRÃO "FECHAR-ENTÃO-LOADING": Fechar modal ANTES de iniciar loading
      form.resetFields();
      onClose();

      // Notificar parent component para iniciar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(true, "Criando pedido...");
      }

      // Processar datas para formato ISO
      const dataPedidoProcessada = values.dataPedido
        ? moment(values.dataPedido).startOf('day').add(12, 'hours').toISOString()
        : undefined;
      const dataPrevistaProcessada = values.dataPrevistaColheita
        ? moment(values.dataPrevistaColheita).startOf('day').add(12, 'hours').toISOString()
        : undefined;

      console.log('📅 Data do pedido processada:', dataPedidoProcessada);
      console.log('📅 Data prevista processada:', dataPrevistaProcessada);

      const formData = {
        ...values,
        dataPedido: dataPedidoProcessada,
        dataPrevistaColheita: dataPrevistaProcessada,
        // NOVA ESTRUTURA: Criar área placeholder para satisfazer validação do backend
        frutas: values.frutas.map(fruta => ({
          ...fruta,
          // Garantir que quantidadePrevista seja número
          quantidadePrevista: typeof fruta.quantidadePrevista === 'string' ? parseFloat(fruta.quantidadePrevista) : fruta.quantidadePrevista,
          areas: [{
            // Área placeholder - será substituída durante a colheita
            observacoes: 'Área a ser definida durante a colheita'
          }],
          fitas: [] // Array vazio de fitas
        }))
      };

      console.log('🚀 FormData final sendo enviado:', formData);
      console.log('🚀 Datas no formData final:', {
        dataPedido: formData.dataPedido,
        dataPrevistaColheita: formData.dataPrevistaColheita
      });

      await onSave(formData);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      // Em caso de erro, reabrir o modal
      onClose(false); // false indica que não deve fechar
    } finally {
      setIsSaving(false);
      // Notificar parent component para parar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(false);
      }
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
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "10px 12px" : "12px 16px",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          <ShoppingCartOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? 'Novo Pedido' : 'Novo Pedido'}
        </span>
      }
      open={open}
      onCancel={handleCancelar}
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "75rem" }}
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
        wrapper: { zIndex: 1000 }
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
              <span style={{ 
                color: "#ffffff", 
                fontWeight: "600",
                fontSize: "0.875rem"
              }}>Informações do Pedido</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
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
              padding: isMobile ? 12 : 16
            }
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ 
                      fontWeight: "700", 
                      color: "#333",
                      fontSize: isMobile ? "0.8125rem" : "0.875rem"
                    }}>Cliente</span>
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
                  size={isMobile ? "small" : "middle"}
                  style={{
                    borderRadius: "0.375rem",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? "0.875rem" : "1rem"
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

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ 
                      fontWeight: "700", 
                      color: "#333",
                      fontSize: isMobile ? "0.8125rem" : "0.875rem"
                    }}>Data do Pedido</span>
                  </Space>
                }
                name="dataPedido"
                rules={[
                  { required: true, message: "Data do pedido é obrigatória" },
                ]}
              >
                <MaskedDatePicker
                  style={{
                    width: "100%",
                    borderRadius: "0.375rem",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? "0.875rem" : "1rem"
                  }}
                  size={isMobile ? "small" : "middle"}
                  placeholder="Selecione a data"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ 
                      fontWeight: "700", 
                      color: "#333",
                      fontSize: isMobile ? "0.8125rem" : "0.875rem"
                    }}>Data Prevista para Colheita</span>
                  </Space>
                }
                name="dataPrevistaColheita"
                rules={[
                  { required: true, message: "Data prevista para colheita é obrigatória" },
                ]}
              >
                <MaskedDatePicker
                  style={{
                    width: "100%",
                    borderRadius: "0.375rem",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? "0.875rem" : "1rem"
                  }}
                  size={isMobile ? "small" : "middle"}
                  placeholder="Selecione a data"
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
              <span style={{ 
                color: "#ffffff", 
                fontWeight: "600",
                fontSize: "0.875rem"
              }}>Frutas do Pedido</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
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
              padding: isMobile ? 12 : 16
            }
          }}
        >
          <Form.List name="frutas">
            {(fields, { add, remove }) => (
              <>
                {/* Cabeçalho das colunas - Oculto em mobile */}
                {!isMobile && (
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
                )}

                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="baseline">
                       <Col xs={24} md={6}>
                         <Form.Item
                           {...restField}
                           name={[name, 'frutaId']}
                           label={
                             isMobile ? (
                               <Space size="small">
                                 <AppleOutlined style={{ color: "#059669" }} />
                                 <span style={{ 
                                   fontWeight: "700", 
                                   color: "#059669",
                                   fontSize: "14px"
                                 }}>Fruta</span>
                               </Space>
                             ) : undefined
                           }
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
                            size={isMobile ? "small" : "middle"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "14px" : "16px"
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
                           label={
                             isMobile ? (
                               <Space size="small">
                                 <CalculatorOutlined style={{ color: "#059669" }} />
                                 <span style={{ 
                                   fontWeight: "700", 
                                   color: "#059669",
                                   fontSize: "14px"
                                 }}>Quantidade</span>
                               </Space>
                             ) : undefined
                           }
                           rules={[
                             { required: true, message: "Quantidade prevista deve ser maior que 0" },
                             {
                               validator: (_, value) => {
                                 // Converter string para número se necessário
                                 const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                 
                                 if (!numValue || numValue <= 0) {
                                   return Promise.reject(new Error("Quantidade deve ser maior que zero"));
                                 }
                                 
                                 return Promise.resolve();
                               }
                             }
                           ]}
                         >
                          <MonetaryInput
                            placeholder="Ex: 1.234,56"
                            size={isMobile ? "small" : "large"}
                            style={{ 
                              width: "100%",
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "14px" : "16px"
                            }}
                          />
                        </Form.Item>
                      </Col>

                       <Col xs={24} md={6}>
                         <Form.Item
                           {...restField}
                           name={[name, 'unidadeMedida1']}
                           label={
                             isMobile ? (
                               <Space size="small">
                                 <CalculatorOutlined style={{ color: "#059669" }} />
                                 <span style={{ 
                                   fontWeight: "700", 
                                   color: "#059669",
                                   fontSize: "14px"
                                 }}>Unidade Principal</span>
                               </Space>
                             ) : undefined
                           }
                           rules={[
                             { required: true, message: "Unidade de medida principal é obrigatória" },
                           ]}
                         >
                          <Select 
                            placeholder="Selecione a unidade"
                            size={isMobile ? "small" : "middle"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "14px" : "16px"
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
                           label={
                             isMobile ? (
                               <Space size="small">
                                 <CalculatorOutlined style={{ color: "#059669" }} />
                                 <span style={{ 
                                   fontWeight: "700", 
                                   color: "#059669",
                                   fontSize: "14px"
                                 }}>Unidade Secundária</span>
                               </Space>
                             ) : undefined
                           }
                         >
                          <Select 
                            placeholder="Selecione a unidade (opcional)" 
                            allowClear
                            size={isMobile ? "small" : "middle"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "14px" : "16px"
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
                        <div style={{ 
                          display: "flex", 
                          gap: isMobile ? "8px" : "8px", 
                          justifyContent: isMobile ? "center" : "center",
                          flexDirection: isMobile ? "row" : "row",
                          marginTop: isMobile ? "8px" : "0",
                          paddingTop: isMobile ? "8px" : "0",
                          borderTop: isMobile ? "1px solid #f0f0f0" : "none"
                        }}>
                          {/* Botão de remover para todas as frutas */}
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              if (fields.length > 1) {
                                remove(name);
                              }
                            }}
                            disabled={fields.length <= 1}
                            size={isMobile ? "small" : "large"}
                            style={{
                              borderRadius: "3.125rem",
                              height: isMobile ? "32px" : "40px",
                              width: isMobile ? "32px" : "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              border: "0.125rem solid #ff4d4f",
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
                              onClick={() => {
                                add({
                                  frutaId: undefined,
                                  quantidadePrevista: undefined,
                                  unidadeMedida1: undefined,
                                  unidadeMedida2: undefined
                                });
                              }}
                              size={isMobile ? "small" : "large"}
                              style={{
                                borderRadius: "3.125rem",
                                borderColor: "#10b981",
                                color: "#10b981",
                                borderWidth: "0.125rem",
                                height: isMobile ? "2rem" : "2.5rem",
                                width: isMobile ? "2rem" : "2.5rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0.125rem 0.5rem rgba(16, 185, 129, 0.15)",
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
                    {index < fields.length - 1 && <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />}
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
              <span style={{ 
                color: "#ffffff", 
                fontWeight: "600",
                fontSize: "0.875rem"
              }}>Observações</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
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
              padding: isMobile ? 12 : 16
            }
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ 
                      fontWeight: "700", 
                      color: "#333",
                      fontSize: isMobile ? "0.8125rem" : "0.875rem"
                    }}>Observações sobre o Pedido</span>
                  </Space>
                }
                name="observacoes"
              >
                <TextArea
                  rows={isMobile ? 3 : 4}
                  placeholder="Observações sobre o pedido (opcional)"
                  size={isMobile ? "small" : "middle"}
                  style={{
                    borderRadius: "0.375rem",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? "0.875rem" : "1rem"
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
            gap: isMobile ? "8px" : "12px",
            marginTop: isMobile ? "1rem" : "1.5rem",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "0.0625rem solid #e8e8e8",
          }}
        >
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancelar}
            disabled={loading || isSaving}
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
            loading={loading || isSaving}
            size={isMobile ? "small" : "large"}
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
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
  onLoadingChange: PropTypes.func, // Callback para controlar CentralizedLoader
};

export default NovoPedidoModal;
