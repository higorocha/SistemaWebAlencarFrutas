// src/components/pedidos/tabs/DadosBasicosTab.js

import React, { useState, useEffect, useRef } from "react";
import { Button, Space, Form, Input, Select, DatePicker, Row, Col, Typography, Card, Divider, Tag } from "antd";
import PropTypes from "prop-types";
import {
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  AppleOutlined,
  CalendarOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import { MonetaryInput } from "../../../components/common/inputs";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";
import moment from "moment";

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

const DadosBasicosTab = ({
  pedidoAtual,
  setPedidoAtual,
  erros,
  setErros,
  canEditTab,
  clientes,
  onSave,
  onCancel,
  loading,
  isSaving,
}) => {
  const [frutas, setFrutas] = useState([]);
  const dataPrevistaOriginalRef = useRef(null);

  // Armazenar valor original da data prevista quando o componente monta
  useEffect(() => {
    if (pedidoAtual.dataPrevistaColheita) {
      dataPrevistaOriginalRef.current = moment(pedidoAtual.dataPrevistaColheita);
    }
  }, [pedidoAtual.dataPrevistaColheita]);

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

    fetchFrutas();
  }, []);

  // Função para gerenciar o foco do campo de data prevista
  const handleDataPrevistaFocus = () => {
    // Limpa o campo quando recebe foco
    setPedidoAtual(prev => ({
      ...prev,
      dataPrevistaColheita: null
    }));
  };

  // Função para gerenciar a perda de foco do campo de data prevista
  const handleDataPrevistaBlur = () => {
    const valorAtual = pedidoAtual.dataPrevistaColheita;
    
    // Se não há valor selecionado, restaura o valor original
    if (!valorAtual && dataPrevistaOriginalRef.current) {
      setPedidoAtual(prev => ({
        ...prev,
        dataPrevistaColheita: dataPrevistaOriginalRef.current.toDate()
      }));
    }
  };

  const handleChange = (field, value) => {
    // Para campos enum opcionais, converter string vazia ou undefined para null
    let processedValue = value;
    if (field === 'unidadeMedida2' && (value === '' || value === undefined)) {
      processedValue = null;
    }

    setPedidoAtual(prev => ({
      ...prev,
      [field]: processedValue,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Adicionar nova fruta
  const adicionarFruta = () => {
    setPedidoAtual(prev => ({
      ...prev,
      frutas: [...prev.frutas, {
        frutaId: undefined,
        quantidadePrevista: undefined,
        unidadeMedida1: undefined,
        unidadeMedida2: null,
        // Campos de colheita
        quantidadeReal: null,
        quantidadeReal2: null,
        areaPropriaId: undefined,
        areaFornecedorId: undefined,
        fitaColheita: undefined,
        // Campos de precificação
        valorUnitario: 0,
        unidadePrecificada: undefined, // Será definida automaticamente quando unidadeMedida1 for selecionada
        valorTotal: 0,
      }]
    }));
  };

  // Remover fruta
  const removerFruta = (index) => {
    if (pedidoAtual.frutas.length > 1) {
      setPedidoAtual(prev => ({
        ...prev,
        frutas: prev.frutas.filter((_, i) => i !== index)
      }));
    }
  };

  // Atualizar fruta específica
  const handleFrutaChange = (index, field, value) => {
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((fruta, i) => {
        if (i === index) {
          // Para campos enum opcionais, converter string vazia ou undefined para null
          let processedValue = value;
          if (field === 'unidadeMedida2' && (value === '' || value === undefined)) {
            processedValue = null;
          }
          
          // Para campos numéricos, garantir que seja um número válido ou undefined
          if (['quantidadePrevista', 'quantidadeReal', 'quantidadeReal2', 'valorUnitario', 'valorTotal'].includes(field)) {
            if (value === null || value === '' || value === undefined) {
              processedValue = undefined;
            } else {
              processedValue = Number(value);
            }
          }
          
          const frutaAtualizada = { ...fruta, [field]: processedValue };
          
          // Ajustar unidadePrecificada quando há inconsistência
          if (field === 'unidadeMedida1' || field === 'unidadeMedida2') {
            const unidade1 = field === 'unidadeMedida1' ? processedValue : fruta.unidadeMedida1;
            const unidade2 = field === 'unidadeMedida2' ? processedValue : fruta.unidadeMedida2;
            const unidadePrecificadaAtual = fruta.unidadePrecificada;
            
            // Se a unidade precificada não coincide mais com nenhuma das unidades disponíveis
            if (unidadePrecificadaAtual && 
                unidadePrecificadaAtual !== unidade1 && 
                unidadePrecificadaAtual !== unidade2) {
              // Definir a unidade primária como padrão para precificação
              frutaAtualizada.unidadePrecificada = unidade1;
            }
            
            // Se não há unidade precificada definida, definir a primária como padrão
            if (!frutaAtualizada.unidadePrecificada && unidade1) {
              frutaAtualizada.unidadePrecificada = unidade1;
            }
          }
          
          return frutaAtualizada;
        }
        return fruta;
      });
      
      return { ...prev, frutas: novasFrutas };
    });
  };

  const unidadesMedida = [
    { value: 'KG', label: 'Quilogramas (KG)' },
    { value: 'TON', label: 'Toneladas (TON)' },
    { value: 'CX', label: 'Caixas (CX)' },
    { value: 'UND', label: 'Unidades (UND)' },
    { value: 'ML', label: 'Mililitros (ML)' },
    { value: 'LT', label: 'Litros (LT)' },
  ];

  return (
    <>
      {/* CSS local para sobrescrever estilos do Ant Design */}
      <style>
        {`
          /* Estilo global para campos desabilitados comuns */
          .ant-input-disabled,
          .ant-select-disabled .ant-select-selector,
          .ant-picker-disabled {
            background-color: #f8f9fa !important;
            border-color: #f8bbb4 !important;
            color: #6c757d !important;
            cursor: not-allowed !important;
            opacity: 0.8 !important;
          }

          /* Estilo para campos habilitados - hover verde sutil */
          .ant-input:not(.ant-input-disabled):hover,
          .ant-select:not(.ant-select-disabled) .ant-select-selector:hover,
          .ant-picker:not(.ant-picker-disabled):hover .ant-picker-input input {
            border-color: #95d5b2 !important;
            transition: border-color 0.2s ease !important;
          }

          /* Estilo para campos habilitados - focus verde */
          .ant-input:not(.ant-input-disabled):focus,
          .ant-select:not(.ant-select-disabled) .ant-select-focused .ant-select-selector,
          .ant-picker:not(.ant-picker-disabled).ant-picker-focused .ant-picker-input input {
            border-color: #059669 !important;
            box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15) !important;
          }

          /* Melhorar contraste do placeholder em campos habilitados */
          .ant-input:not(.ant-input-disabled)::placeholder {
            color: #9ca3af !important;
          }

          /* Estilo para MonetaryInput */
          .ant-input-group .ant-input:not(.ant-input-disabled):hover {
            border-color: #95d5b2 !important;
          }

          .ant-input-group .ant-input:not(.ant-input-disabled):focus {
            border-color: #059669 !important;
            box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15) !important;
          }

          /* Estilo base para campos */
          .ant-input {
            border-radius: 6px;
            border-color: #d9d9d9;
          }
        `}
      </style>
    <div style={{ minHeight: "830px", position: "relative", paddingBottom: "80px" }}>
      <Form layout="vertical" size="large">
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
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Cliente</span>
                  </Space>
                }
                validateStatus={erros.clienteId ? "error" : ""}
                help={erros.clienteId}
                required
              >
                <Select
                  placeholder="Selecione um cliente"
                  value={pedidoAtual.clienteId || undefined}
                  onChange={(value) => handleChange("clienteId", value)}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.clienteId ? "#ff4d4f" : "#d9d9d9",
                  }}
                  disabled={!canEditTab("1")}
                >
                  {clientes.map((cliente) => (
                    <Option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Data do Pedido</span>
                  </Space>
                }
                validateStatus={erros.dataPedido ? "error" : ""}
                help={erros.dataPedido}
                required
              >
                <DatePicker
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    borderColor: erros.dataPedido ? "#ff4d4f" : "#d9d9d9",
                  }}
                  value={pedidoAtual.dataPedido ? moment(pedidoAtual.dataPedido) : undefined}
                  onChange={(date) => {
                    handleChange("dataPedido", date ? date.format('YYYY-MM-DD') : null);
                  }}
                  format="DD/MM/YYYY"
                  placeholder="Selecione a data"
                  disabled={!canEditTab("1")}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Data Prevista para Colheita</span>
                  </Space>
                }
                validateStatus={erros.dataPrevistaColheita ? "error" : ""}
                help={erros.dataPrevistaColheita}
                required
              >
                <DatePicker
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    borderColor: erros.dataPrevistaColheita ? "#ff4d4f" : "#d9d9d9",
                  }}
                  value={pedidoAtual.dataPrevistaColheita ? moment(pedidoAtual.dataPrevistaColheita) : undefined}
                  onChange={(date) => {
                    handleChange("dataPrevistaColheita", date ? date.format('YYYY-MM-DD') : null);
                  }}
                  format="DD/MM/YYYY"
                  placeholder="Selecione a data"
                  onFocus={handleDataPrevistaFocus}
                  onBlur={handleDataPrevistaBlur}
                  disabled={!canEditTab("1")}
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
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
            }
          }}
        >
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

          {pedidoAtual.frutas.map((fruta, index) => (
            <div key={index}>
              {/* 🆕 INDICADOR: Nova fruta adicionada durante edição */}
              {!fruta.frutaPedidoId && (
                <div style={{ marginBottom: 8 }}>
                  <Tag color="blue" style={{ fontSize: '13px', padding: '4px 8px' }}>
                    🆕 Nova Fruta - Preencher dados de {
                      pedidoAtual.status === 'PRECIFICACAO_REALIZADA' ||
                      pedidoAtual.status === 'AGUARDANDO_PAGAMENTO' ||
                      pedidoAtual.status === 'PAGAMENTO_PARCIAL' ||
                      pedidoAtual.status === 'PAGAMENTO_REALIZADO'
                        ? 'colheita e precificação'
                        : pedidoAtual.status === 'COLHEITA_REALIZADA' ||
                          pedidoAtual.status === 'AGUARDANDO_PRECIFICACAO'
                        ? 'colheita'
                        : 'básicos'
                    }
                  </Tag>
                </div>
              )}
              <Row gutter={[16, 16]} align="baseline">
                <Col xs={24} md={6}>
                  <Form.Item>
                    <Select
                      placeholder="Selecione uma fruta"
                      value={fruta.frutaId || undefined}
                      onChange={(value) => handleFrutaChange(index, 'frutaId', value)}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      style={{
                        borderRadius: "6px",
                        borderColor: "#d9d9d9",
                      }}
                      disabled={!canEditTab("1")}
                    >
                      {frutas.map((frutaOption) => (
                        <Option key={frutaOption.id} value={frutaOption.id}>
                          {frutaOption.nome}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={4}>
                  <Form.Item>
                    <MonetaryInput
                      placeholder="Ex: 1.234,56"
                      size="large"
                      style={{ 
                        width: "100%",
                        borderRadius: "6px",
                        borderColor: "#d9d9d9",
                      }}
                      value={fruta.quantidadePrevista}
                      onChange={(value) => handleFrutaChange(index, 'quantidadePrevista', value)}
                      disabled={!canEditTab("1")}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item>
                    <Select 
                      placeholder="Selecione a unidade"
                      value={fruta.unidadeMedida1 || undefined}
                      onChange={(value) => handleFrutaChange(index, 'unidadeMedida1', value)}
                      style={{
                        borderRadius: "6px",
                        borderColor: "#d9d9d9",
                      }}
                      disabled={!canEditTab("1")}
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
                  <Form.Item>
                    <Select 
                      placeholder="Selecione a unidade (opcional)" 
                      value={fruta.unidadeMedida2}
                      onChange={(value) => handleFrutaChange(index, 'unidadeMedida2', value)}
                      allowClear
                      style={{
                        borderRadius: "6px",
                        borderColor: "#d9d9d9",
                      }}
                      disabled={!canEditTab("1")}
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
                    {/* Botão de remover */}
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removerFruta(index)}
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
                      disabled={!canEditTab("1") || pedidoAtual.frutas.length <= 1}
                    />

                    {/* Botão de adicionar apenas na última fruta */}
                    {index === pedidoAtual.frutas.length - 1 && (
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
                        disabled={!canEditTab("1")}
                      />
                    )}
                  </div>
                </Col>
              </Row>
              {index < pedidoAtual.frutas.length - 1 && <Divider style={{ margin: "8px 0" }} />}
            </div>
          ))}
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
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações sobre o Pedido</span>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Observações sobre o pedido (opcional)"
                  value={pedidoAtual.observacoes || ""}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                  disabled={!canEditTab("1")}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
      
      {canEditTab("1") && (
        <div
          style={{
            position: "absolute",
            bottom: "-14px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "16px 0",
            borderTop: "1px solid #e8e8e8",
            backgroundColor: "#ffffff",
            zIndex: 1
          }}
        >
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            disabled={loading || isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            loading={isSaving}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {isSaving ? "Salvando..." : "Atualizar Pedido"}
          </Button>
        </div>
      )}
    </div>
    </>
  );
};

DadosBasicosTab.propTypes = {
  pedidoAtual: PropTypes.object.isRequired,
  setPedidoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  canEditTab: PropTypes.func.isRequired,
  clientes: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isSaving: PropTypes.bool,
};

export default DadosBasicosTab;
