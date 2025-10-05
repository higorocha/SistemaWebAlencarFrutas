// src/components/pedidos/PrecificacaoModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Card,
  Divider,
  Statistic,
  Select,
  Input,
  Tooltip,
  DatePicker,
} from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  CalculatorOutlined,
  DollarOutlined,
  TruckOutlined,
  PercentageOutlined,
  AppleOutlined,
  CalendarOutlined,
  BuildOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../utils/formatters";
import { MonetaryInput, MaskedDatePicker } from "../../components/common/inputs";
import axiosInstance from "../../api/axiosConfig";
import useResponsive from "../../hooks/useResponsive";

const { Title, Text } = Typography;
const { Option } = Select;

const PrecificacaoModal = ({
  open,
  onClose,
  onSave,
  pedido,
  loading,
  onLoadingChange, // Callback para controlar CentralizedLoader
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [valores, setValores] = useState({
    valorTotalFrutas: 0,
    frete: 0,
    icms: 0,
    desconto: 0,
    avaria: 0,
    valorFinal: 0,
  });
  


  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {
      // Preparar dados das frutas para o formulário
      const frutasForm = pedido.frutasPedidos?.map(fruta => {
        return {
          frutaPedidoId: fruta.id,
          frutaNome: fruta.fruta?.nome,
          quantidadePrevista: fruta.quantidadePrevista || 0,
          quantidadeReal: fruta.quantidadeReal || 0,
          quantidadeReal2: fruta.quantidadeReal2 || 0,
          unidadeMedida1: fruta.unidadeMedida1,
          unidadeMedida2: fruta.unidadeMedida2,
          valorUnitario: fruta.valorUnitario || 0,
          unidadePrecificada: fruta.unidadePrecificada || fruta.unidadeMedida1,
          quantidadePrecificada: fruta.quantidadePrecificada || fruta.quantidadeReal || 0,
          valorTotal: fruta.valorTotal || 0,
        };
      }) || [];
      
      form.setFieldsValue({
        frutas: frutasForm,
        frete: pedido.frete || 0,
        icms: pedido.icms || 0,
        desconto: pedido.desconto || 0,
        avaria: pedido.avaria || 0,
        // Campos específicos para clientes indústria
        indDataEntrada: pedido.indDataEntrada ? moment(pedido.indDataEntrada) : undefined,
        indDataDescarga: pedido.indDataDescarga ? moment(pedido.indDataDescarga) : undefined,
        indPesoMedio: pedido.indPesoMedio || undefined,
        indMediaMililitro: pedido.indMediaMililitro || undefined,
        indNumeroNf: pedido.indNumeroNf || undefined,
      });
      
      calcularValoresConsolidados(frutasForm, pedido.frete || 0, pedido.icms || 0, pedido.desconto || 0, pedido.avaria || 0);
    } else if (open) {
      form.resetFields();
      setValores({
        valorTotalFrutas: 0,
        frete: 0,
        icms: 0,
        desconto: 0,
        avaria: 0,
        valorFinal: 0,
      });
    }
  }, [open, pedido, form]);

  // Função para calcular valores consolidados
  const calcularValoresConsolidados = (frutas, frete = 0, icms = 0, desconto = 0, avaria = 0) => {
    const valorTotalFrutas = frutas.reduce((total, fruta, index) => {
      // Usar a quantidade precificada para o cálculo
      const quantidadeParaCalculo = fruta.quantidadePrecificada || 0;
      const valorUnit = fruta.valorUnitario || 0;
      const valorTotalFruta = quantidadeParaCalculo * valorUnit;

      // Atualizar o valor total da fruta no formulário
      form.setFieldValue(['frutas', index, 'valorTotal'], valorTotalFruta);

      return total + valorTotalFruta;
    }, 0);

    // Converter valores monetários para número se necessário
    const freteNum = typeof frete === 'string' ? parseFloat(frete) || 0 : frete || 0;
    const icmsNum = typeof icms === 'string' ? parseFloat(icms) || 0 : icms || 0;
    const descontoNum = typeof desconto === 'string' ? parseFloat(desconto) || 0 : desconto || 0;
    const avariaNum = typeof avaria === 'string' ? parseFloat(avaria) || 0 : avaria || 0;

    const valorFinal = valorTotalFrutas + freteNum + icmsNum - descontoNum - avariaNum;

    setValores({
      valorTotalFrutas,
      frete: freteNum,
      icms: icmsNum,
      desconto: descontoNum,
      avaria: avariaNum,
      valorFinal: Math.max(0, valorFinal),
    });
  };

  // Função para alternar unidade de medida de uma fruta específica
  const toggleUnidadeFruta = (frutaIndex) => {
    const frutas = form.getFieldValue('frutas');
    if (!frutas[frutaIndex]?.unidadeMedida2) return;

    const frutaAtual = frutas[frutaIndex];
    const novaUnidade = frutaAtual.unidadePrecificada === frutaAtual.unidadeMedida1
      ? frutaAtual.unidadeMedida2
      : frutaAtual.unidadeMedida1;

    // Determinar a quantidade correta baseado na nova unidade
    let novaQuantidadePrecificada = 0;
    if (novaUnidade === frutaAtual.unidadeMedida1) {
      novaQuantidadePrecificada = frutaAtual.quantidadeReal || 0;
    } else if (novaUnidade === frutaAtual.unidadeMedida2) {
      novaQuantidadePrecificada = frutaAtual.quantidadeReal2 || 0;
    } else {
      novaQuantidadePrecificada = frutaAtual.quantidadeReal || 0;
    }

    // Atualizar tanto a unidade quanto a quantidade precificada
    form.setFieldValue(['frutas', frutaIndex, 'unidadePrecificada'], novaUnidade);
    form.setFieldValue(['frutas', frutaIndex, 'quantidadePrecificada'], novaQuantidadePrecificada);

    // Recalcular valores considerando a nova unidade
    const frutasAtualizadas = form.getFieldValue('frutas');
    const frete = form.getFieldValue('frete') || 0;
    const icms = form.getFieldValue('icms') || 0;
    const desconto = form.getFieldValue('desconto') || 0;
    const avaria = form.getFieldValue('avaria') || 0;

    // Recalcular com delay para garantir que o campo foi atualizado
    setTimeout(() => {
      calcularValoresConsolidados(frutasAtualizadas, frete, icms, desconto, avaria);
    }, 100);
  };

  // Observar mudanças nos campos do formulário
  const handleFieldChange = (changedFields, allFields) => {
    const formValues = form.getFieldsValue();
    const frutas = formValues.frutas || [];
    const { frete, icms, desconto, avaria } = formValues;
    
    // Calcular valor total de cada fruta individualmente usando quantidade precificada
    frutas.forEach((fruta, index) => {
      if (fruta.valorUnitario && fruta.quantidadePrecificada) {
        const valorTotal = fruta.quantidadePrecificada * fruta.valorUnitario;
        form.setFieldValue(['frutas', index, 'valorTotal'], valorTotal);
      }
    });
    
    calcularValoresConsolidados(frutas, frete || 0, icms || 0, desconto || 0, avaria || 0);
  };


  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true);
      
      // Validar se todas as frutas têm valor unitário
      for (let i = 0; i < values.frutas.length; i++) {
        const fruta = values.frutas[i];
        if (!fruta.valorUnitario || fruta.valorUnitario <= 0) {
          throw new Error(`Informe o valor unitário para a fruta ${i + 1}`);
        }
      }

      // PADRÃO "FECHAR-ENTÃO-LOADING": Fechar modal ANTES de iniciar loading
      form.resetFields();
      onClose();

      // Notificar parent component para iniciar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(true, "Definindo precificação...");
      }

      const formData = {
        frutas: values.frutas.map(fruta => ({
          frutaPedidoId: fruta.frutaPedidoId,
          valorUnitario: typeof fruta.valorUnitario === 'string' ? parseFloat(fruta.valorUnitario) : fruta.valorUnitario,
          unidadePrecificada: fruta.unidadePrecificada,
          quantidadePrecificada: typeof fruta.quantidadePrecificada === 'string' ? parseFloat(fruta.quantidadePrecificada) : fruta.quantidadePrecificada,
        })),
        frete: values.frete ? (typeof values.frete === 'string' ? parseFloat(values.frete) : values.frete) : 0,
        icms: values.icms ? (typeof values.icms === 'string' ? parseFloat(values.icms) : values.icms) : 0,
        desconto: values.desconto ? (typeof values.desconto === 'string' ? parseFloat(values.desconto) : values.desconto) : 0,
        avaria: values.avaria ? (typeof values.avaria === 'string' ? parseFloat(values.avaria) : values.avaria) : 0,
        // Campos específicos para clientes indústria
        indDataEntrada: values.indDataEntrada ? moment(values.indDataEntrada).startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss') : undefined,
        indDataDescarga: values.indDataDescarga ? moment(values.indDataDescarga).startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss') : undefined,
        indPesoMedio: values.indPesoMedio ? (typeof values.indPesoMedio === 'string' ? parseFloat(values.indPesoMedio) : values.indPesoMedio) : undefined,
        indMediaMililitro: values.indMediaMililitro ? (typeof values.indMediaMililitro === 'string' ? parseFloat(values.indMediaMililitro) : values.indMediaMililitro) : undefined,
        indNumeroNf: values.indNumeroNf ? (typeof values.indNumeroNf === 'string' ? parseInt(values.indNumeroNf) : values.indNumeroNf) : undefined,
      };

      await onSave(formData);
    } catch (error) {
      console.error("Erro ao definir precificação:", error);
      // Em caso de erro, reabrir o modal
      onClose(false); // false indica que não deve fechar
    } finally {
      setSubmitLoading(false);
      // Notificar parent component para parar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Função para formatar valor monetário
  const currencyFormatter = (value) => {
    if (!value && value !== 0) return "";
    
    const [intPart, decPart] = value.toString().split('.');
    const intFormatted = parseInt(intPart).toLocaleString('pt-BR');
    
    return `R$ ${intFormatted}${decPart ? ',' + decPart.slice(0, 2) : ''}`;
  };

  // Função para converter valor formatado de volta para número
  const currencyParser = (val) => {
    if (!val) return undefined;
    
    return val
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
  };

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
          <DollarOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? "Precificação" : "Definir Precificação"}
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
      {pedido && (
        <>
          {/* Informações do Pedido */}
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Informações do Pedido
                </span>
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
                padding: isMobile ? "12px" : "16px" 
              }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Pedido:</Text>
                <br />
                <Text style={{ color: "#059669", fontWeight: "600" }}>{pedido.numeroPedido}</Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Cliente:</Text>
                <br />
                <Text>{pedido.cliente?.nome}</Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Data Colheita:</Text>
                <br />
                <Text>{pedido.dataColheita ? moment(pedido.dataColheita).format('DD/MM/YYYY') : '-'}</Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Status:</Text>
                <br />
                <Text style={{ color: "#52c41a", fontWeight: "600" }}>Colheita Realizada</Text>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldChange}
      >
        {/* Seção 1: Frutas da Precificação */}
        <Card
          title={
            <Space>
              <AppleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Frutas da Precificação
              </span>
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
              padding: isMobile ? "12px" : "16px" 
            }
          }}
        >
          <Form.List name="frutas">
            {(fields) => (
                <>
                  {/* Cabeçalho das colunas - apenas desktop */}
                  {!isMobile && (
                    <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "0.125rem solid #e8e8e8" }}>
                      <Col md={7}>
                        <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                          <AppleOutlined style={{ marginRight: 8 }} />
                          Fruta
                        </span>
                      </Col>
                      <Col md={3}>
                        <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                          <CalculatorOutlined style={{ marginRight: 8 }} />
                          Prevista
                        </span>
                      </Col>
                      <Col md={3}>
                        <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                          <CalculatorOutlined style={{ marginRight: 8 }} />
                          Colhida
                        </span>
                      </Col>
                      <Col md={4}>
                        <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                          <CalculatorOutlined style={{ marginRight: 8 }} />
                          Quant. Precificada
                        </span>
                      </Col>
                      <Col md={4}>
                        <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                          <DollarOutlined style={{ marginRight: 8 }} />
                          Valor Unit.
                        </span>
                      </Col>
                      <Col md={3}>
                        <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                          <CalculatorOutlined style={{ marginRight: 8 }} />
                          Total
                        </span>
                      </Col>
                    </Row>
                  )}

                {fields.map(({ key, name, ...restField }, index) => {
                  const fruta = form.getFieldValue('frutas')?.[index];

                  return (
                    <div key={key}>
                      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="baseline">
                        {/* Nome da Fruta */}
                        <Col xs={24} md={7}>
                          <Form.Item
                            {...restField}
                            name={[name, 'frutaNome']}
                            label={isMobile ? (
                              <Space size="small">
                                <AppleOutlined style={{ color: "#059669" }} />
                                <span style={{ fontWeight: "700", color: "#059669", fontSize: "0.875rem" }}>
                                  Fruta
                                </span>
                              </Space>
                            ) : undefined}
                          >
                            <Tooltip title={fruta?.frutaNome || ''} placement="top">
                              <Input
                                disabled
                                value={fruta?.frutaNome || ''}
                                style={{
                                  borderRadius: "0.375rem",
                                  fontSize: isMobile ? "0.875rem" : undefined
                                }}
                                size={isMobile ? "small" : "middle"}
                              />
                            </Tooltip>
                          </Form.Item>
                        </Col>

                        {/* Quantidade Prevista */}
                        <Col xs={24} md={3}>
                          {isMobile && (
                            <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                              <CalculatorOutlined style={{ marginRight: 4 }} />
                              Prevista
                            </span>
                          )}
                          <Input
                            disabled
                            value={`${fruta?.quantidadePrevista || '0'} ${fruta?.unidadeMedida1 || ''}`.trim()}
                            style={{
                              borderRadius: "0.375rem",
                              textAlign: "center",
                              fontSize: isMobile ? "0.875rem" : undefined
                            }}
                            size={isMobile ? "small" : "middle"}
                          />
                        </Col>

                        {/* Quantidade Colhida */}
                        <Col xs={24} md={3}>
                          {isMobile && (
                            <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                              <CalculatorOutlined style={{ marginRight: 4 }} />
                              Colhida
                            </span>
                          )}
                          <Input
                            disabled
                            value={(() => {
                              // Lógica simples: sempre mostrar quantidadeReal com a unidade padrão (primeira unidade)
                              // Se o usuário alternar para segunda unidade via toggle, mostrará quantidadeReal2
                              const unidadePrecificada = fruta?.unidadePrecificada || fruta?.unidadeMedida1;

                              // Se unidade precificada é a segunda unidade E temos quantidadeReal2
                              if (fruta?.unidadeMedida2 &&
                                  unidadePrecificada === fruta.unidadeMedida2 &&
                                  fruta.quantidadeReal2) {
                                return `${fruta.quantidadeReal2} ${fruta.unidadeMedida2}`;
                              }

                              // Caso padrão: primeira unidade
                              return `${fruta?.quantidadeReal || '0'} ${fruta?.unidadeMedida1 || ''}`;
                            })()}
                            style={{
                              borderRadius: "0.375rem",
                              textAlign: "center",
                              color: "#10b981",
                              fontWeight: "600",
                              fontSize: isMobile ? "0.875rem" : undefined
                            }}
                            size={isMobile ? "small" : "middle"}
                          />
                        </Col>

                        {/* Quantidade Precificada */}
                        <Col xs={24} md={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantidadePrecificada']}
                            label={isMobile ? (
                              <Space size="small">
                                <CalculatorOutlined style={{ color: "#059669" }} />
                                <span style={{ fontWeight: "700", color: "#059669", fontSize: "0.875rem" }}>
                                  Quant. Precificada
                                </span>
                              </Space>
                            ) : undefined}
                            required={isMobile}
                            rules={[
                              { required: true, message: 'Quantidade obrigatória' },
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
                              placeholder="Ex: 1.250,00"
                              addonAfter={fruta?.unidadePrecificada || fruta?.unidadeMedida1 || 'UND'}
                              size={isMobile ? "small" : "large"}
                            />
                          </Form.Item>
                        </Col>

                        {/* Valor Unitário */}
                        <Col xs={24} md={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'valorUnitario']}
                            label={isMobile ? (
                              <Space size="small">
                                <DollarOutlined style={{ color: "#059669" }} />
                                <span style={{ fontWeight: "700", color: "#059669", fontSize: "0.875rem" }}>
                                  Valor Unit.
                                </span>
                              </Space>
                            ) : undefined}
                            required={isMobile}
                            rules={[
                              { required: true, message: 'Valor obrigatório' },
                              {
                                validator: (_, value) => {
                                  // Converter string para número se necessário
                                  const numValue = typeof value === 'string' ? parseFloat(value) : value;

                                  if (!numValue || numValue <= 0) {
                                    return Promise.reject(new Error("Valor deve ser maior que zero"));
                                  }

                                  return Promise.resolve();
                                }
                              }
                            ]}
                          >
                            <MonetaryInput
                              placeholder="Ex: 2,50"
                              addonAfter={
                                <span
                                  onClick={() => toggleUnidadeFruta(index)}
                                  style={{
                                    cursor: fruta?.unidadeMedida2 ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    fontWeight: 600,
                                    color: fruta?.unidadeMedida2 ? '#1890ff' : '#666'
                                  }}
                                  title={fruta?.unidadeMedida2 ? 'Clique para alternar unidade' : undefined}
                                >
                                  {fruta?.unidadePrecificada || fruta?.unidadeMedida1 || 'UND'}
                                </span>
                              }
                              size={isMobile ? "small" : "large"}
                            />
                          </Form.Item>
                        </Col>

                        {/* Valor Total */}
                        <Col xs={24} md={3}>
                          {isMobile && (
                            <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                              <CalculatorOutlined style={{ marginRight: 4 }} />
                              Total
                            </span>
                          )}
                          <Input
                            disabled
                            value={formatarValorMonetario(fruta?.valorTotal || 0)}
                            style={{
                              borderRadius: "0.375rem",
                              borderColor: "#d9d9d9",
                              backgroundColor: "#f0fdf4",
                              textAlign: "left",
                              fontWeight: "600",
                              color: "#15803d",
                              fontSize: isMobile ? "0.875rem" : undefined
                            }}
                            size={isMobile ? "small" : "middle"}
                          />
                        </Col>
                      </Row>

                      {index < fields.length - 1 && <Divider style={{ margin: isMobile ? "12px 0" : "8px 0" }} />}
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>
        </Card>

        {/* Seção 2: Valores Consolidados */}
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Valores Consolidados
              </span>
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
              padding: isMobile ? "12px" : "16px" 
            }
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label={
                  <Space>
                    <TruckOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Frete</span>
                  </Space>
                }
                name="frete"
                rules={[
                  {
                    validator: (_, value) => {
                      // Se não tem valor, é válido (campo opcional)
                      if (!value) return Promise.resolve();
                      
                      // Converter string para número se necessário
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      
                      if (numValue < 0) {
                        return Promise.reject(new Error("Frete não pode ser negativo"));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MonetaryInput
                  placeholder="Ex: 150,00"
                  addonAfter="R$"
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label={
                  <Space>
                    <PercentageOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>ICMS</span>
                  </Space>
                }
                name="icms"
                rules={[
                  {
                    validator: (_, value) => {
                      // Se não tem valor, é válido (campo opcional)
                      if (!value) return Promise.resolve();
                      
                      // Converter string para número se necessário
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      
                      if (numValue < 0) {
                        return Promise.reject(new Error("ICMS não pode ser negativo"));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MonetaryInput
                  placeholder="Ex: 89,75"
                  addonAfter="R$"
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label={
                  <Space>
                    <PercentageOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Desconto</span>
                  </Space>
                }
                name="desconto"
                rules={[
                  {
                    validator: (_, value) => {
                      // Se não tem valor, é válido (campo opcional)
                      if (!value) return Promise.resolve();
                      
                      // Converter string para número se necessário
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      
                      if (numValue < 0) {
                        return Promise.reject(new Error("Desconto não pode ser negativo"));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MonetaryInput
                  placeholder="Ex: 50,00"
                  addonAfter="R$"
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label={
                  <Space>
                    <PercentageOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Avaria</span>
                  </Space>
                }
                name="avaria"
                rules={[
                  {
                    validator: (_, value) => {
                      // Se não tem valor, é válido (campo opcional)
                      if (!value) return Promise.resolve();
                      
                      // Converter string para número se necessário
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      
                      if (numValue < 0) {
                        return Promise.reject(new Error("Avaria não pode ser negativo"));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <MonetaryInput
                  placeholder="Ex: 25,00"
                  addonAfter="R$"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 3: Dados Complementares (apenas para clientes indústria) */}
        {pedido?.cliente?.industria && (
          <Card
            title={
              <Space>
                <BuildOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Dados Complementares
                </span>
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
                padding: isMobile ? "12px" : "16px" 
              }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              <Col xs={24} sm={12} md={5}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "0.75rem" }}>Data Entrada</span>
                    </Space>
                  }
                  name="indDataEntrada"
                  rules={[
                    {
                      validator: (_, value) => {
                        // Se não tem valor, é válido (campo opcional)
                        if (!value) return Promise.resolve();
                        
                        // Validar se a data é válida
                        if (!value.isValid || !value.isValid()) {
                          return Promise.reject(new Error("Data inválida"));
                        }
                        
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <MaskedDatePicker
                    style={{ 
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    placeholder="Selecione a data"
                    disabledDate={(current) => current && current > moment().endOf('day')}
                    size="small"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={5}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "0.75rem" }}>Data Descarga</span>
                    </Space>
                  }
                  name="indDataDescarga"
                  rules={[
                    {
                      validator: (_, value) => {
                        // Se não tem valor, é válido (campo opcional)
                        if (!value) return Promise.resolve();
                        
                        // Validar se a data é válida
                        if (!value.isValid || !value.isValid()) {
                          return Promise.reject(new Error("Data inválida"));
                        }
                        
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <MaskedDatePicker
                    style={{ 
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    placeholder="Selecione a data"
                    disabledDate={(current) => current && current > moment().endOf('day')}
                    size="small"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Form.Item
                  label={
                    <Space>
                      <CalculatorOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "0.75rem" }}>Peso Médio</span>
                    </Space>
                  }
                  name="indPesoMedio"
                  rules={[
                    {
                      validator: (_, value) => {
                        // Se não tem valor, é válido (campo opcional)
                        if (!value) return Promise.resolve();
                        
                        // Converter string para número se necessário
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        
                        if (numValue && numValue <= 0) {
                          return Promise.reject(new Error("Peso deve ser maior que zero"));
                        }
                        
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <MonetaryInput
                    placeholder="Ex: 1.250,50"
                    addonAfter="KG"
                    size="small"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Form.Item
                  label={
                    <Space>
                      <CalculatorOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "0.75rem" }}>Média ML</span>
                    </Space>
                  }
                  name="indMediaMililitro"
                  rules={[
                    {
                      validator: (_, value) => {
                        // Se não tem valor, é válido (campo opcional)
                        if (!value) return Promise.resolve();
                        
                        // Converter string para número se necessário
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        
                        if (numValue && numValue <= 0) {
                          return Promise.reject(new Error("Média deve ser maior que zero"));
                        }
                        
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <MonetaryInput
                    placeholder="Ex: 500,75"
                    addonAfter="ML"
                    size="small"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={6}>
                <Form.Item
                  label={
                    <Space>
                      <NumberOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "0.75rem" }}>Número NF</span>
                    </Space>
                  }
                  name="indNumeroNf"
                  rules={[
                    {
                      validator: (_, value) => {
                        // Se não tem valor, é válido (campo opcional)
                        if (!value) return Promise.resolve();
                        
                        // Converter string para número se necessário
                        const numValue = typeof value === 'string' ? parseInt(value) : value;
                        
                        if (numValue && numValue <= 0) {
                          return Promise.reject(new Error("Número deve ser maior que zero"));
                        }
                        
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    placeholder="Ex: 123456"
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    min={1}
                    max={999999999}
                    controls={false}
                    formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
                    parser={(value) => value.replace(/[^0-9]/g, '')}
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {/* Seção 4: Resumo Financeiro */}
        <Card
          title={
            <Space>
              <CalculatorOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Resumo Financeiro
              </span>
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
              padding: isMobile ? "12px" : "16px" 
            }
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ 
                backgroundColor: "#f8fafc", 
                border: "0.0625rem solid #e2e8f0", 
                borderRadius: "0.5rem", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px", display: "block" }}>
                  Valor Total Frutas
                </Text>
                <Text style={{ fontSize: "1.125rem", fontWeight: "700", color: "#334155" }}>
                  {formatarValorMonetario(valores.valorTotalFrutas)}
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ 
                backgroundColor: "#fefce8", 
                border: "0.0625rem solid #fde047", 
                borderRadius: "0.5rem", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "0.75rem", color: "#a16207", marginBottom: "4px", display: "block" }}>
                  Adicionais
                </Text>
                <Text style={{ fontSize: "1.125rem", fontWeight: "700", color: "#ca8a04" }}>
                  +{formatarValorMonetario(valores.frete + valores.icms)}
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ 
                backgroundColor: "#fef2f2", 
                border: "0.0625rem solid #fecaca", 
                borderRadius: "0.5rem", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "0.75rem", color: "#dc2626", marginBottom: "4px", display: "block" }}>
                  Descontos
                </Text>
                <Text style={{ fontSize: "1.125rem", fontWeight: "700", color: "#ef4444" }}>
                  -{formatarValorMonetario(valores.desconto + valores.avaria)}
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ 
                backgroundColor: "#f0fdf4", 
                border: "0.0625rem solid #bbf7d0", 
                borderRadius: "0.5rem", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "0.75rem", color: "#16a34a", marginBottom: "4px", display: "block" }}>
                  VALOR FINAL
                </Text>
                <Text style={{ fontSize: "1.25rem", fontWeight: "800", color: "#15803d" }}>
                  {formatarValorMonetario(valores.valorFinal)}
                </Text>
              </div>
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
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            {submitLoading ? "Confirmando..." : "Confirmar Precificação"}
          </Button>
        </div>
      </Form>

      </Modal>
  );
};

export default PrecificacaoModal;
