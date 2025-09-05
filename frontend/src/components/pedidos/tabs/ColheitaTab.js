// src/components/pedidos/tabs/ColheitaTab.js

import React, { useState, useEffect, useRef } from "react";
import { Button, Space, Form, Input, Select, DatePicker, Row, Col, Typography, Card, Divider } from "antd";
import PropTypes from "prop-types";
import {
  SaveOutlined,
  CloseOutlined,
  CalendarOutlined,
  AppleOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined
} from "@ant-design/icons";
import { MaskedDecimalInput } from "../../../components/common/inputs";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";
import moment from "moment";

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

const ColheitaTab = ({
  pedidoAtual,
  setPedidoAtual,
  erros,
  setErros,
  canEditTab,
  frutas,
  areasProprias,
  areasFornecedores,
  onSave,
  onCancel,
  loading,
  isSaving,
}) => {
  const [modoAreaFruta, setModoAreaFruta] = useState({});
  const [selectAberto, setSelectAberto] = useState({});
  
  // Ref para controlar o valor original da data de colheita
  const dataColheitaOriginalRef = useRef(null);

  // Inicializar modo das áreas baseado nos dados das frutas apenas na primeira vez
  useEffect(() => {
    if (pedidoAtual.frutas && pedidoAtual.frutas.length > 0) {
      setModoAreaFruta(prev => {
        const novoModoAreaFruta = { ...prev };
        pedidoAtual.frutas.forEach((fruta, index) => {
          // Só inicializa se ainda não tem modo definido
          if (novoModoAreaFruta[index] === undefined) {
            if (fruta.areaFornecedorId) {
              novoModoAreaFruta[index] = 'terceiros';
            } else {
              novoModoAreaFruta[index] = 'propria';
            }
          }
        });
        return novoModoAreaFruta;
      });
    }
  }, [pedidoAtual.frutas]);

  // As áreas agora vêm como props do componente pai

  // Inicializar data de colheita original
  useEffect(() => {
    if (pedidoAtual.dataColheita) {
      dataColheitaOriginalRef.current = moment(pedidoAtual.dataColheita);
    }
  }, [pedidoAtual.dataColheita]);

  const handleChange = (field, value) => {
    setPedidoAtual(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Atualizar fruta específica
  const handleFrutaChange = (index, field, value) => {
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((fruta, i) => {
        if (i === index) {
          return { ...fruta, [field]: value };
        }
        return fruta;
      });
      
      return { ...prev, frutas: novasFrutas };
    });
  };

  // Função para gerenciar o foco do campo de data
  const handleDataColheitaFocus = () => {
    // Limpa o campo quando recebe foco
    setPedidoAtual(prev => ({
      ...prev,
      dataColheita: null
    }));
  };

  // Função para gerenciar a perda de foco do campo de data
  const handleDataColheitaBlur = () => {
    const valorAtual = pedidoAtual.dataColheita;
    
    // Se não há valor selecionado, restaura o valor original
    if (!valorAtual && dataColheitaOriginalRef.current) {
      setPedidoAtual(prev => ({
        ...prev,
        dataColheita: dataColheitaOriginalRef.current.toDate()
      }));
    }
  };

  const coresFita = [
    { value: 'Verde', label: 'Verde', color: '#52c41a' },
    { value: 'Azul', label: 'Azul', color: '#1890ff' },
    { value: 'Vermelho', label: 'Vermelho', color: '#ff4d4f' },
    { value: 'Amarelo', label: 'Amarelo', color: '#faad14' },
    { value: 'Laranja', label: 'Laranja', color: '#fa8c16' },
    { value: 'Rosa', label: 'Rosa', color: '#eb2f96' },
    { value: 'Roxo', label: 'Roxo', color: '#722ed1' },
    { value: 'Marrom', label: 'Marrom', color: '#8c8c8c' },
    { value: 'Preto', label: 'Preto', color: '#262626' },
    { value: 'Branco', label: 'Branco', color: '#f0f0f0' },
  ];

  return (
    <>
      {/* CSS local para sobrescrever estilos do Ant Design */}
      <style>
        {`
          /* Estilo para campos desabilitados customizados (sem segunda unidade) */
          .custom-disabled-visual.ant-input-disabled {
            background-color: #e8e8e8 !important;
            color: rgba(0, 0, 0, 0.25) !important; 
          }

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

          /* Estilo para MaskedDecimalInput */
          .ant-input-group .ant-input:not(.ant-input-disabled):hover {
            border-color: #95d5b2 !important;
          }

          .ant-input-group .ant-input:not(.ant-input-disabled):focus {
            border-color: #059669 !important;
            box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15) !important;
          }

          /* Ocultar mensagens de erro */
          .ant-form-item-has-error .ant-form-item-explain,
          .ant-form-item-has-error .ant-form-item-split,
          .ant-form-item-explain,
          .ant-form-item-split {
            display: none !important;
          }

          /* Estilo base para campos */
          .ant-input {
            border-radius: 6px;
            border-color: #d9d9d9;
          }
        `}
      </style>
    <div style={{ minHeight: "830px", position: "relative", paddingBottom: "80px" }}>
      <Form
        layout="vertical"
        size="large"
      >
      {/* Dados da Colheita */}
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados da Colheita</span>
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
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <CalendarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Data da Colheita</span>
                </Space>
              }
              validateStatus={erros.dataColheita ? "error" : ""}
              help={erros.dataColheita}
              required
            >
              <DatePicker
                style={{ 
                  width: "100%",
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                format="DD/MM/YYYY"
                placeholder="Selecione a data"
                disabledDate={(current) => current && current > moment().endOf('day')}
                value={pedidoAtual.dataColheita ? moment(pedidoAtual.dataColheita) : undefined}
                onChange={(date) => {
                  handleChange("dataColheita", date ? date.format('YYYY-MM-DD') : null);
                }}
                onFocus={handleDataColheitaFocus}
                onBlur={handleDataColheitaBlur}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <FileTextOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Observações da Colheita</span>
                </Space>
              }
            >
              <TextArea
                rows={3}
                placeholder="Observações sobre a colheita (opcional)"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.observacoesColheita || ""}
                onChange={(e) => handleChange("observacoesColheita", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Frutas da Colheita */}
      <Card
        title={
          <Space>
            <AppleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas da Colheita</span>
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
          <Col xs={24} md={5}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <AppleOutlined style={{ marginRight: 8 }} />
              Fruta
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Prevista
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Real
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Real 2
            </span>
          </Col>
          <Col xs={24} md={6}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              Área
            </span>
          </Col>
          <Col xs={24} md={4}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              Fita
            </span>
          </Col>
        </Row>

        {pedidoAtual.frutas.map((fruta, index) => (
          <div key={index}>
            <Row gutter={[16, 16]} align="baseline">
              {/* Nome da Fruta */}
              <Col xs={24} md={5}>
                <Form.Item>
                  <Input
                    disabled
                    value={frutas.find(f => f.id === fruta.frutaId)?.nome || ''}
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Quantidade Prevista */}
              <Col xs={24} md={3}>
                <Form.Item>
                  <Input
                    disabled
                    value={`${fruta.quantidadePrevista || ''} ${fruta.unidadeMedida1 || ''}`.trim()}
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Quantidade Real */}
              <Col xs={24} md={3}>
                <Form.Item
                  rules={[
                    { required: true },
                    { type: 'number', min: 0.01, message: 'Quantidade deve ser maior que 0' }
                  ]}
                  // NORMALIZADOR: Converte o valor de texto para número puro
                  normalize={(value) => {
                    if (!value) return null;
                    const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                    return isNaN(numero) ? null : numero;
                  }}
                >
                  <MaskedDecimalInput
                    placeholder="Ex: 985,50"
                    addonAfter={fruta.unidadeMedida1 || ''}
                    size="large"
                    value={fruta.quantidadeReal}
                    onChange={(value) => {
                      const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                      handleFrutaChange(index, 'quantidadeReal', isNaN(numero) ? null : numero);
                    }}
                    disabled={!canEditTab("2")}
                  />
                </Form.Item>
              </Col>

              {/* Quantidade Real 2 */}
              <Col xs={24} md={3}>
                <Form.Item
                  // NORMALIZADOR: Converte o valor de texto para número puro
                  normalize={(value) => {
                    if (!value) return null;
                    const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                    return isNaN(numero) ? null : numero;
                  }}
                >
                  <MaskedDecimalInput
                    placeholder="Ex: 50,00"
                    addonAfter={fruta.unidadeMedida2 || ''}
                    disabled={!fruta.unidadeMedida2 || !canEditTab("2")}
                    className={!fruta.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                    size="large"
                    value={fruta.quantidadeReal2}
                    onChange={(value) => {
                      const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                      handleFrutaChange(index, 'quantidadeReal2', isNaN(numero) ? null : numero);
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Área de Origem */}
              <Col xs={24} md={6}>
                <Form.Item
                  rules={[
                    { required: true, message: "Selecione uma área de origem" }
                  ]}
                >
                  <Select
                    key={`area-select-${index}-${modoAreaFruta[index] || 'propria'}`}
                    placeholder="Selecione a área"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    value={fruta.areaPropriaId ? `propria-${fruta.areaPropriaId}` : 
                           fruta.areaFornecedorId ? `fornecedor-${fruta.areaFornecedorId}` : undefined}
                    open={selectAberto[index]}
                    onDropdownVisibleChange={(open) => {
                      setSelectAberto(prev => ({ ...prev, [index]: open }));
                    }}
                    onChange={(value, option) => {
                      if (value === 'terceiros') {
                        // Apenas trocar modo, sem limpar áreas selecionadas
                        setModoAreaFruta(prev => ({ ...prev, [index]: 'terceiros' }));
                        // Manter select aberto após troca de modo
                        setTimeout(() => {
                          setSelectAberto(prev => ({ ...prev, [index]: true }));
                        }, 100);
                      } else if (value === 'propria') {
                        // Apenas trocar modo, sem limpar áreas selecionadas
                        setModoAreaFruta(prev => ({ ...prev, [index]: 'propria' }));
                        // Manter select aberto após troca de modo
                        setTimeout(() => {
                          setSelectAberto(prev => ({ ...prev, [index]: true }));
                        }, 100);
                      } else if (option?.data) {
                        const areaData = option.data;
                        if (areaData.tipo === 'propria') {
                          handleFrutaChange(index, 'areaPropriaId', areaData.id);
                          handleFrutaChange(index, 'areaFornecedorId', undefined);
                        } else {
                          handleFrutaChange(index, 'areaFornecedorId', areaData.id);
                          handleFrutaChange(index, 'areaPropriaId', undefined);
                        }
                        // Fechar select quando uma área real é selecionada
                        setSelectAberto(prev => ({ ...prev, [index]: false }));
                      }
                    }}
                    disabled={!canEditTab("2")}
                  >
                    {/* Renderizar baseado no modo atual */}
                    {(!modoAreaFruta[index] || modoAreaFruta[index] === 'propria') ? (
                      <>
                        {/* Áreas Próprias */}
                        {areasProprias.map((area) => (
                          <Option 
                            key={`propria-${area.id}`} 
                            value={`propria-${area.id}`}
                            data={{ tipo: 'propria', id: area.id }}
                          >
                            {area.nome}
                          </Option>
                        ))}
                        
                        {/* Opção para ir para terceiros */}
                        <Option value="terceiros">
                          <span style={{ color: '#1890ff', fontWeight: '500' }}>
                            🔄 Ver áreas de terceiros
                          </span>
                        </Option>
                      </>
                    ) : (
                      <>
                        {/* Opção para voltar para próprias */}
                        <Option value="propria">
                          <span style={{ color: '#52c41a', fontWeight: '500' }}>
                            🔄 Voltar para áreas próprias
                          </span>
                        </Option>
                        
                        {/* Áreas de Fornecedores */}
                        {areasFornecedores.map((area) => (
                          <Option 
                            key={`fornecedor-${area.id}`} 
                            value={`fornecedor-${area.id}`}
                            data={{ tipo: 'fornecedor', id: area.id }}
                          >
                            {area.nome} - {area.fornecedor?.nome || 'Fornecedor não informado'}
                          </Option>
                        ))}
                      </>
                    )}
                  </Select>
                </Form.Item>
              </Col>

              {/* Fita de Colheita */}
              <Col xs={24} md={4}>
                <Form.Item>
                  <Select
                    placeholder="Cor da fita"
                    allowClear
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    value={fruta.fitaColheita}
                    onChange={(value) => handleFrutaChange(index, 'fitaColheita', value)}
                    disabled={!canEditTab("2")}
                  >
                    {coresFita.map((cor) => (
                      <Option key={cor.value} value={cor.value}>
                        <Space>
                          <div style={{
                            width: 16,
                            height: 16,
                            backgroundColor: cor.color,
                            borderRadius: '50%',
                            border: '1px solid #d9d9d9'
                          }} />
                          {cor.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {index < pedidoAtual.frutas.length - 1 && <Divider style={{ margin: "8px 0" }} />}
          </div>
        ))}
      </Card>

      {/* Informações de Frete */}
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações de Frete</span>
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
          <Col xs={24} md={5}>
            <Form.Item
              label={
                <Space>
                  <CalculatorOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Pesagem</span>
                </Space>
              }
            >
              <Input
                placeholder="Ex: 2500"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.pesagem}
                onChange={(e) => handleChange("pesagem", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={5}>
            <Form.Item
              label={
                <Space>
                  <CarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Placa Principal</span>
                </Space>
              }
            >
              <Input
                placeholder="Ex: ABC-1234"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.placaPrimaria}
                onChange={(e) => handleChange("placaPrimaria", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={5}>
            <Form.Item
              label={
                <Space>
                  <CarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Placa Secundária</span>
                </Space>
              }
            >
              <Input
                placeholder="Ex: XYZ-5678 (reboque)"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.placaSecundaria}
                onChange={(e) => handleChange("placaSecundaria", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={9}>
            <Form.Item
              label={
                <Space>
                  <UserOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Motorista</span>
                </Space>
              }
            >
              <Input
                placeholder="Nome do motorista"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.nomeMotorista}
                onChange={(e) => handleChange("nomeMotorista", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
      
      {canEditTab("2") && (
        <div style={{ 
          position: "absolute", 
          bottom: "-14px", 
          left: 0, 
          right: 0,
          display: "flex", 
          justifyContent: "flex-end", 
          gap: 12, 
          padding: "16px 0", 
          borderTop: "1px solid #e8e8e8",
          backgroundColor: "#ffffff",
          zIndex: 1
        }}>
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
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
          >
            {isSaving ? "Salvando..." : "Atualizar Pedido"}
          </Button>
        </div>
      )}
      </Form>
    </div>
    </>
  );
};

ColheitaTab.propTypes = {
  pedidoAtual: PropTypes.object.isRequired,
  setPedidoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  canEditTab: PropTypes.func.isRequired,
  frutas: PropTypes.array.isRequired,
  areasProprias: PropTypes.array.isRequired,
  areasFornecedores: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isSaving: PropTypes.bool,
};

export default ColheitaTab;
