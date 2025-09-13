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
  Tag,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  CalculatorOutlined,
  DollarOutlined,
  TruckOutlined,
  PercentageOutlined,
  AppleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  LinkOutlined,
  TagOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../utils/formatters";
import { MonetaryInput } from "../../components/common/inputs";
import { FormButton } from "../common/buttons";
import VisualizarAreasFitasModal from "./VisualizarAreasFitasModal";
import axiosInstance from "../../api/axiosConfig";

const { Title, Text } = Typography;
const { Option } = Select;

const PrecificacaoModal = ({
  open,
  onClose,
  onSave,
  pedido,
  loading,
}) => {
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
  
  // Estados para dados e modais
  const [areasProprias, setAreasProprias] = useState([]);
  const [areasFornecedores, setAreasFornecedores] = useState([]);
  const [fitasBanana, setFitasBanana] = useState([]);
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [frutaSelecionada, setFrutaSelecionada] = useState(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState('areas'); // 'areas' ou 'fitas'

  // Carregar dados quando modal abrir
  useEffect(() => {
    const fetchDados = async () => {
      try {
        // Buscar áreas próprias
        const responseAreas = await axiosInstance.get("/api/areas-agricolas");
        setAreasProprias(responseAreas.data || []);

        // Buscar áreas de fornecedores
        const responseAreasFornecedores = await axiosInstance.get("/api/areas-fornecedores");
        setAreasFornecedores(responseAreasFornecedores.data || []);

        // Buscar fitas de banana
        const responseFitas = await axiosInstance.get("/fitas-banana");
        setFitasBanana(responseFitas.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    if (open) {
      fetchDados();
    }
  }, [open]);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {
      // Preparar dados das frutas para o formulário
      const frutasForm = pedido.frutasPedidos?.map(fruta => {
        return {
          frutaPedidoId: fruta.id,
          frutaNome: fruta.fruta?.nome,
          quantidadeReal: fruta.quantidadeReal || 0,
          quantidadeReal2: fruta.quantidadeReal2 || 0,
          unidadeMedida1: fruta.unidadeMedida1,
          unidadeMedida2: fruta.unidadeMedida2,
          // NOVA ESTRUTURA: Arrays de áreas e fitas
          areas: fruta.areas || [],
          fitas: fruta.fitas || [],
          valorUnitario: fruta.valorUnitario || 0,
          unidadePrecificada: fruta.unidadePrecificada || fruta.unidadeMedida1,
          valorTotal: fruta.valorTotal || 0,
        };
      }) || [];
      
      form.setFieldsValue({
        frutas: frutasForm,
        frete: pedido.frete || 0,
        icms: pedido.icms || 0,
        desconto: pedido.desconto || 0,
        avaria: pedido.avaria || 0,
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
      // Determinar qual quantidade usar baseado na unidade de precificação selecionada
      let quantidadeParaCalculo = 0;
      
      if (fruta.unidadePrecificada === fruta.unidadeMedida1) {
        quantidadeParaCalculo = fruta.quantidadeReal || 0;
      } else if (fruta.unidadePrecificada === fruta.unidadeMedida2) {
        quantidadeParaCalculo = fruta.quantidadeReal2 || 0;
      } else {
        // Fallback para primeira unidade se não houver unidade selecionada
        quantidadeParaCalculo = fruta.quantidadeReal || 0;
      }
      
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

    const novaUnidade = frutas[frutaIndex].unidadePrecificada === frutas[frutaIndex].unidadeMedida1 
      ? frutas[frutaIndex].unidadeMedida2 
      : frutas[frutaIndex].unidadeMedida1;

    form.setFieldValue(['frutas', frutaIndex, 'unidadePrecificada'], novaUnidade);
    
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
    
    // Calcular valor total de cada fruta individualmente considerando a unidade de precificação
    frutas.forEach((fruta, index) => {
      if (fruta.valorUnitario) {
        let quantidadeParaCalculo = 0;
        
        if (fruta.unidadePrecificada === fruta.unidadeMedida1) {
          quantidadeParaCalculo = fruta.quantidadeReal || 0;
        } else if (fruta.unidadePrecificada === fruta.unidadeMedida2) {
          quantidadeParaCalculo = fruta.quantidadeReal2 || 0;
        } else {
          quantidadeParaCalculo = fruta.quantidadeReal || 0;
        }
        
        const valorTotal = quantidadeParaCalculo * fruta.valorUnitario;
        form.setFieldValue(['frutas', index, 'valorTotal'], valorTotal);
      }
    });
    
    calcularValoresConsolidados(frutas, frete || 0, icms || 0, desconto || 0, avaria || 0);
  };

  // Funções para abrir modais de visualização
  const handleVisualizarAreas = (fruta, frutaIndex) => {
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setTipoVisualizacao('areas');
    setVisualizarModalOpen(true);
  };

  const handleVisualizarFitas = (fruta, frutaIndex) => {
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setTipoVisualizacao('fitas');
    setVisualizarModalOpen(true);
  };

  // Verificar se fruta tem áreas vinculadas (não placeholders)
  const hasLinkedAreas = (fruta) => {
    return fruta?.areas && fruta.areas.some(area => 
      area.areaPropriaId || area.areaFornecedorId
    );
  };

  // Verificar se fruta tem fitas vinculadas
  const hasLinkedFitas = (fruta) => {
    return fruta?.fitas && fruta.fitas.length > 0;
  };

  // Obter nomes das áreas vinculadas
  const getLinkedAreasNames = (fruta) => {
    if (!fruta?.areas) return [];
    
    const realAreas = fruta.areas.filter(area => 
      area.areaPropriaId || area.areaFornecedorId
    );

    return realAreas.map(area => {
      if (area.areaPropriaId) {
        const areaPropria = areasProprias.find(a => a.id === area.areaPropriaId);
        return {
          nome: areaPropria?.nome?.toUpperCase() || `ÁREA ${area.areaPropriaId}`,
          tipo: 'propria'
        };
      } else {
        const areaFornecedor = areasFornecedores.find(a => a.id === area.areaFornecedorId);
        return {
          nome: areaFornecedor?.nome?.toUpperCase() || `ÁREA FORNECEDOR ${area.areaFornecedorId}`,
          tipo: 'fornecedor'
        };
      }
    });
  };

  // Obter nomes das fitas vinculadas
  const getLinkedFitasNames = (fruta) => {
    if (!fruta?.fitas) return [];
    
    return fruta.fitas.map(fita => {
      const fitaBanana = fitasBanana.find(f => f.id === fita.fitaBananaId);
      return {
        nome: fitaBanana?.nome || `Fita ${fita.fitaBananaId}`,
        cor: fitaBanana?.corHex || '#52c41a',
        quantidade: fita.quantidadeFita
      };
    });
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

      const formData = {
        frutas: values.frutas.map(fruta => ({
          frutaPedidoId: fruta.frutaPedidoId,
          valorUnitario: typeof fruta.valorUnitario === 'string' ? parseFloat(fruta.valorUnitario) : fruta.valorUnitario,
          unidadePrecificada: fruta.unidadePrecificada,
        })),
        frete: values.frete ? (typeof values.frete === 'string' ? parseFloat(values.frete) : values.frete) : 0,
        icms: values.icms ? (typeof values.icms === 'string' ? parseFloat(values.icms) : values.icms) : 0,
        desconto: values.desconto ? (typeof values.desconto === 'string' ? parseFloat(values.desconto) : values.desconto) : 0,
        avaria: values.avaria ? (typeof values.avaria === 'string' ? parseFloat(values.avaria) : values.avaria) : 0,
      };

      await onSave(formData);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Erro ao definir precificação:", error);
    } finally {
      setSubmitLoading(false);
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
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <DollarOutlined style={{ marginRight: 8 }} />
          Definir Precificação
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width="95%"
      style={{ maxWidth: 1400 }}
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
      {pedido && (
        <>
          {/* Informações do Pedido */}
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Pedido</span>
              </Space>
            }
            style={{ 
              marginBottom: 16,
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
              }
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Text strong>Pedido:</Text>
                <br />
                <Text style={{ color: "#059669", fontWeight: "600" }}>{pedido.numeroPedido}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Cliente:</Text>
                <br />
                <Text>{pedido.cliente?.nome}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Data Colheita:</Text>
                <br />
                <Text>{pedido.dataColheita ? moment(pedido.dataColheita).format('DD/MM/YYYY') : '-'}</Text>
              </Col>
              <Col xs={24} md={6}>
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas da Precificação</span>
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
            {(fields) => (
              <>
                {/* Cabeçalho das colunas */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
                  <Col xs={24} md={4}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <AppleOutlined style={{ marginRight: 8 }} />
                      Fruta
                    </span>
                  </Col>
                  <Col xs={24} md={3}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <CalculatorOutlined style={{ marginRight: 8 }} />
                      Und 1
                    </span>
                  </Col>
                  <Col xs={24} md={3}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <CalculatorOutlined style={{ marginRight: 8 }} />
                      Und 2
                    </span>
                  </Col>
                  <Col xs={24} md={4}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <EnvironmentOutlined style={{ marginRight: 8 }} />
                      Áreas
                    </span>
                  </Col>
                  <Col xs={24} md={3}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <TagOutlined style={{ marginRight: 8 }} />
                      Fitas
                    </span>
                  </Col>
                  <Col xs={24} md={3}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <DollarOutlined style={{ marginRight: 8 }} />
                      Valor Unit.
                    </span>
                  </Col>
                  <Col xs={24} md={4}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <CalculatorOutlined style={{ marginRight: 8 }} />
                      Total
                    </span>
                  </Col>
                </Row>

                {fields.map(({ key, name, ...restField }, index) => {
                  const fruta = form.getFieldValue('frutas')?.[index];
                  
                  return (
                    <div key={key}>
                      <Row gutter={[16, 16]} align="baseline">
                        {/* Nome da Fruta */}
                        <Col xs={24} md={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'frutaNome']}
                          >
                            <Tooltip title={fruta?.frutaNome || ''} placement="top">
                              <Input
                                disabled
                                value={fruta?.frutaNome || ''}
                                style={{
                                  borderRadius: "6px",
                                }}
                              />
                            </Tooltip>
                          </Form.Item>
                        </Col>

                        {/* Quantidade Real */}
                        <Col xs={24} md={3}>
                          <Input
                            disabled
                            value={`${fruta?.quantidadeReal || '0'} ${fruta?.unidadeMedida1 || ''}`.trim()}
                            style={{
                              borderRadius: "6px",
                            }}
                          />
                        </Col>

                        {/* Quantidade Real 2 */}
                        <Col xs={24} md={3}>
                          <Input
                            disabled
                            value={fruta?.unidadeMedida2 ? `${fruta?.quantidadeReal2 || '0'} ${fruta?.unidadeMedida2}`.trim() : ''}
                            style={{
                              borderRadius: "6px",
                            }}
                            className={!fruta?.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                          />
                        </Col>

                        {/* Coluna de Áreas */}
                        <Col xs={24} md={4}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {hasLinkedAreas(fruta) ? (
                              <>
                                  {/* Botão com apenas ícone */}
                                  <Tooltip title="Ver áreas">
                                    <FormButton
                                      icon={<EyeOutlined />}
                                      onClick={() => handleVisualizarAreas(fruta, index)}
                                      style={{ 
                                        minWidth: '32px',
                                        width: '32px',
                                        padding: '0'
                                      }}
                                    />
                                  </Tooltip>
                                
                                {/* Badges das áreas */}
                                {getLinkedAreasNames(fruta).slice(0, 1).map((area, idx) => (
                                  <Tag 
                                    key={idx} 
                                    size="small" 
                                    color={area.tipo === 'propria' ? 'green' : 'blue'}
                                    style={{ 
                                      fontSize: '11px',
                                      maxWidth: '60px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {area.nome}
                                  </Tag>
                                ))}
                                
                                {/* Badge "+X" se houver mais áreas */}
                                {getLinkedAreasNames(fruta).length > 1 && (
                                  <Tag size="small" color="blue" style={{ fontSize: '11px' }}>
                                    +{getLinkedAreasNames(fruta).length - 1}
                                  </Tag>
                                )}
                              </>
                            ) : (
                              <Tag color="default" style={{ fontSize: '11px' }}>
                                Sem áreas
                              </Tag>
                            )}
                          </div>
                        </Col>

                        {/* Coluna de Fitas */}
                        <Col xs={24} md={3}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {hasLinkedFitas(fruta) ? (
                              <>
                                  {/* Botão com apenas ícone */}
                                  <Tooltip title="Ver fitas">
                                    <FormButton
                                      icon={<EyeOutlined />}
                                      onClick={() => handleVisualizarFitas(fruta, index)}
                                      style={{ 
                                        minWidth: '32px',
                                        width: '32px',
                                        padding: '0'
                                      }}
                                    />
                                  </Tooltip>
                                
                                {/* Badges das fitas */}
                                {getLinkedFitasNames(fruta).slice(0, 1).map((fita, idx) => (
                                  <Tag 
                                    key={idx} 
                                    size="small" 
                                    style={{ 
                                      fontSize: '11px',
                                      backgroundColor: fita.cor + '20',
                                      borderColor: fita.cor,
                                      color: '#333',
                                      maxWidth: '60px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {fita.nome}
                                  </Tag>
                                ))}
                                
                                {/* Badge "+X" se houver mais fitas */}
                                {getLinkedFitasNames(fruta).length > 1 && (
                                  <Tag size="small" color="purple" style={{ fontSize: '11px' }}>
                                    +{getLinkedFitasNames(fruta).length - 1}
                                  </Tag>
                                )}
                              </>
                            ) : (
                              <Tag color="default" style={{ fontSize: '11px' }}>
                                Sem fitas
                              </Tag>
                            )}
                          </div>
                        </Col>

                        {/* Valor Unitário */}
                        <Col xs={24} md={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'valorUnitario']}
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
                              size="large"
                            />
                          </Form.Item>
                        </Col>

                        {/* Valor Total */}
                        <Col xs={24} md={4}>
                          <Input
                            disabled
                            value={formatarValorMonetario(fruta?.valorTotal || 0)}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              backgroundColor: "#f0fdf4",
                              textAlign: "center",
                              fontWeight: "600",
                              color: "#15803d",
                            }}
                          />
                        </Col>
                      </Row>

                      {index < fields.length - 1 && <Divider style={{ margin: "8px 0" }} />}
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Valores Consolidados</span>
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
            <Col xs={24} md={6}>
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

            <Col xs={24} md={6}>
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

            <Col xs={24} md={6}>
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

            <Col xs={24} md={6}>
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

        {/* Seção 3: Resumo Financeiro */}
        <Card
          title={
            <Space>
              <CalculatorOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo Financeiro</span>
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
            <Col xs={24} md={6}>
              <div style={{ 
                backgroundColor: "#f8fafc", 
                border: "1px solid #e2e8f0", 
                borderRadius: "8px", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "block" }}>
                  Valor Total Frutas
                </Text>
                <Text style={{ fontSize: "18px", fontWeight: "700", color: "#334155" }}>
                  {formatarValorMonetario(valores.valorTotalFrutas)}
                </Text>
              </div>
            </Col>

            <Col xs={24} md={6}>
              <div style={{ 
                backgroundColor: "#fefce8", 
                border: "1px solid #fde047", 
                borderRadius: "8px", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "12px", color: "#a16207", marginBottom: "4px", display: "block" }}>
                  Adicionais
                </Text>
                <Text style={{ fontSize: "18px", fontWeight: "700", color: "#ca8a04" }}>
                  +{formatarValorMonetario(valores.frete + valores.icms)}
                </Text>
              </div>
            </Col>

            <Col xs={24} md={6}>
              <div style={{ 
                backgroundColor: "#fef2f2", 
                border: "1px solid #fecaca", 
                borderRadius: "8px", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "12px", color: "#dc2626", marginBottom: "4px", display: "block" }}>
                  Descontos
                </Text>
                <Text style={{ fontSize: "18px", fontWeight: "700", color: "#ef4444" }}>
                  -{formatarValorMonetario(valores.desconto + valores.avaria)}
                </Text>
              </div>
            </Col>

            <Col xs={24} md={6}>
              <div style={{ 
                backgroundColor: "#f0fdf4", 
                border: "1px solid #bbf7d0", 
                borderRadius: "8px", 
                padding: "16px",
                textAlign: "center"
              }}>
                <Text style={{ fontSize: "12px", color: "#16a34a", marginBottom: "4px", display: "block" }}>
                  VALOR FINAL
                </Text>
                <Text style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>
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
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
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
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {submitLoading ? "Confirmando..." : "Confirmar Precificação"}
          </Button>
        </div>
      </Form>

      {/* Modal de Visualizar Áreas/Fitas */}
      <VisualizarAreasFitasModal
        open={visualizarModalOpen}
        onClose={() => {
          setVisualizarModalOpen(false);
          setFrutaSelecionada(null);
        }}
        fruta={frutaSelecionada}
        tipo={tipoVisualizacao}
        areasProprias={areasProprias}
        areasFornecedores={areasFornecedores}
        fitasBanana={fitasBanana}
      />
      </Modal>
  );
};

export default PrecificacaoModal;
