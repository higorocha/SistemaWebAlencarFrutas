// src/components/pedidos/tabs/PrecificacaoTab.js

import React from "react";
import { Button, Space, Form, Input, Row, Col, Typography, Card, Divider } from "antd";
import PropTypes from "prop-types";
import {
  SaveOutlined,
  CloseOutlined,
  AppleOutlined,
  CalculatorOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CarOutlined,
  PercentageOutlined
} from "@ant-design/icons";
import { MaskedDecimalInput } from "../../../components/common/inputs";
import { formatarValorMonetario } from "../../../utils/formatters";

const { Text } = Typography;

const PrecificacaoTab = ({
  pedidoAtual,
  setPedidoAtual,
  erros,
  setErros,
  canEditTab,
  frutas,
  areasProprias,
  areasFornecedores,
  valoresCalculados,
  setValoresCalculados,
  onSave,
  onCancel,
  loading,
  isSaving,
  calcularValores,
}) => {

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

    // Calcular valores automaticamente para campos de precificação
    if (['frete', 'icms', 'desconto', 'avaria'].includes(field)) {
      const novosValores = {
        ...valoresCalculados,
        [field]: value || 0,
      };
      setValoresCalculados(novosValores);
      calcularValores(
        field === 'frete' ? (value || 0) : valoresCalculados.frete,
        field === 'icms' ? (value || 0) : valoresCalculados.icms,
        field === 'desconto' ? (value || 0) : valoresCalculados.desconto,
        field === 'avaria' ? (value || 0) : valoresCalculados.avaria
      );
    }
  };

  // Atualizar fruta específica
  const handleFrutaChange = (index, field, value) => {
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((fruta, i) => {
        if (i === index) {
          const frutaAtualizada = { ...fruta, [field]: value };
          
          // Se alterou o valor unitário, calcular o valor total da fruta
          if (field === 'valorUnitario') {
            let quantidadeParaCalculo = 0;
            
            if (fruta.unidadePrecificada === fruta.unidadeMedida1) {
              quantidadeParaCalculo = fruta.quantidadeReal || 0;
            } else if (fruta.unidadePrecificada === fruta.unidadeMedida2) {
              quantidadeParaCalculo = fruta.quantidadeReal2 || 0;
            } else {
              quantidadeParaCalculo = fruta.quantidadeReal || 0;
            }
            
            frutaAtualizada.valorTotal = quantidadeParaCalculo * (value || 0);
          }
          
          return frutaAtualizada;
        }
        return fruta;
      });
      
      return { ...prev, frutas: novasFrutas };
    });

    // Se alterou valor unitário ou unidade de precificação, recalcular valores consolidados
    if (['valorUnitario', 'unidadePrecificada'].includes(field)) {
      setTimeout(() => {
        calcularValores(
          valoresCalculados.frete || 0,
          valoresCalculados.icms || 0,
          valoresCalculados.desconto || 0,
          valoresCalculados.avaria || 0
        );
      }, 100);
    }
  };

  // Função para alternar unidade de medida de uma fruta específica
  const toggleUnidadeFruta = (frutaIndex) => {
    const fruta = pedidoAtual.frutas[frutaIndex];
    if (!fruta?.unidadeMedida2) return;

    const novaUnidade = fruta.unidadePrecificada === fruta.unidadeMedida1 
      ? fruta.unidadeMedida2 
      : fruta.unidadeMedida1;

    // Atualizar a unidade e recalcular o valor total individual
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((frutaItem, i) => {
        if (i === frutaIndex) {
          const frutaAtualizada = { ...frutaItem, unidadePrecificada: novaUnidade };
          
          // Recalcular valor total baseado na nova unidade
          let quantidadeParaCalculo = 0;
          if (novaUnidade === frutaItem.unidadeMedida1) {
            quantidadeParaCalculo = frutaItem.quantidadeReal || 0;
          } else if (novaUnidade === frutaItem.unidadeMedida2) {
            quantidadeParaCalculo = frutaItem.quantidadeReal2 || 0;
          } else {
            quantidadeParaCalculo = frutaItem.quantidadeReal || 0;
          }
          
          frutaAtualizada.valorTotal = quantidadeParaCalculo * (frutaItem.valorUnitario || 0);
          
          return frutaAtualizada;
        }
        return frutaItem;
      });
      
      return { ...prev, frutas: novasFrutas };
    });
    
    // Recalcular valores consolidados considerando a nova unidade
    setTimeout(() => {
      calcularValores(
        valoresCalculados.frete || 0, 
        valoresCalculados.icms || 0, 
        valoresCalculados.desconto || 0, 
        valoresCalculados.avaria || 0
      );
    }, 100);
  };

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
          .ant-select-disabled .ant-select-selector {
            background-color: #f8f9fa !important;
            border-color: #f8bbb4 !important;
            color: #6c757d !important;
            cursor: not-allowed !important;
            opacity: 0.8 !important;
          }

          /* Estilo para campos habilitados - hover verde sutil */
          .ant-input:not(.ant-input-disabled):hover,
          .ant-select:not(.ant-select-disabled) .ant-select-selector:hover {
            border-color: #95d5b2 !important;
            transition: border-color 0.2s ease !important;
          }

          /* Estilo para campos habilitados - focus verde */
          .ant-input:not(.ant-input-disabled):focus,
          .ant-select:not(.ant-select-disabled) .ant-select-focused .ant-select-selector {
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
        `}
      </style>
    <div style={{ minHeight: "830px", position: "relative", paddingBottom: "80px" }}>
      {/* Frutas da Precificação */}
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
          <Col xs={24} md={5}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              Área
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              Fita
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <DollarOutlined style={{ marginRight: 8 }} />
              Valor Unit.
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Total
            </span>
          </Col>
        </Row>

        {pedidoAtual.frutas.map((fruta, index) => (
          <div key={index}>
            <Row gutter={[16, 16]} align="baseline">
              {/* Nome da Fruta */}
              <Col xs={24} md={4}>
                <Input
                  disabled
                  value={frutas.find(f => f.id === fruta.frutaId)?.nome || ''}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    backgroundColor: "#f5f5f5",
                  }}
                />
              </Col>

              {/* Quantidade Real */}
              <Col xs={24} md={3}>
                <Input
                  disabled
                  value={`${fruta.quantidadeReal || '0'} ${fruta.unidadeMedida1 || ''}`.trim()}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    backgroundColor: "#f5f5f5",
                  }}
                />
              </Col>

              {/* Quantidade Real 2 */}
              <Col xs={24} md={3}>
                <Input
                  disabled
                  value={fruta.unidadeMedida2 ? `${fruta.quantidadeReal2 || '0'} ${fruta.unidadeMedida2}`.trim() : ''}
                  className={!fruta.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    backgroundColor: "#f5f5f5",
                  }}
                />
              </Col>

              {/* Área de Origem */}
              <Col xs={24} md={5}>
                <Input
                  disabled
                  value={fruta.areaPropriaId 
                    ? areasProprias.find(a => a.id === fruta.areaPropriaId)?.nome || '-'
                    : fruta.areaFornecedorId
                      ? `${areasFornecedores.find(a => a.id === fruta.areaFornecedorId)?.nome || ''} - ${areasFornecedores.find(a => a.id === fruta.areaFornecedorId)?.fornecedor?.nome || 'Fornecedor'}`
                      : '-'
                  }
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    backgroundColor: "#f5f5f5",
                  }}
                />
              </Col>

              {/* Fita de Colheita */}
              <Col xs={24} md={3}>
                <Input
                  disabled
                  value={fruta.fitaColheita || '-'}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    backgroundColor: "#f5f5f5",
                  }}
                />
              </Col>

              {/* Valor Unitário */}
              <Col xs={24} md={3}>
                <MaskedDecimalInput
                  placeholder="Ex: 2,50"
                  addonAfter={
                    <span
                      onClick={() => toggleUnidadeFruta(index)}
                      style={{ 
                        cursor: fruta.unidadeMedida2 ? 'pointer' : 'default',
                        userSelect: 'none', 
                        fontWeight: 600,
                        color: fruta.unidadeMedida2 ? '#1890ff' : '#666'
                      }}
                      title={fruta.unidadeMedida2 ? 'Clique para alternar unidade' : undefined}
                    >
                      {fruta.unidadePrecificada || fruta.unidadeMedida1 || 'UND'}
                    </span>
                  }
                  size="large"
                  value={fruta.valorUnitario}
                  onChange={(value) => {
                    const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                    handleFrutaChange(index, 'valorUnitario', isNaN(numero) ? null : numero);
                  }}
                  disabled={!canEditTab("3")}
                />
              </Col>

              {/* Valor Total */}
              <Col xs={24} md={3}>
                <Input
                  disabled
                  value={formatarValorMonetario(fruta.valorTotal || 0)}
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

            {index < pedidoAtual.frutas.length - 1 && <Divider style={{ margin: "8px 0" }} />}
          </div>
        ))}
      </Card>

      {/* Valores Consolidados */}
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
            <Form.Item
              label={
                <Space>
                  <CarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Frete</span>
                </Space>
              }
            >
              <MaskedDecimalInput
                placeholder="Ex: 150,00"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.frete}
                onChange={(value) => {
                  const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                  handleChange('frete', isNaN(numero) ? null : numero);
                }}
                disabled={!canEditTab("3")}
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
            >
              <MaskedDecimalInput
                placeholder="Ex: 89,75"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.icms}
                onChange={(value) => {
                  const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                  handleChange('icms', isNaN(numero) ? null : numero);
                }}
                disabled={!canEditTab("3")}
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
            >
              <MaskedDecimalInput
                placeholder="Ex: 50,00"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.desconto}
                onChange={(value) => {
                  const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                  handleChange('desconto', isNaN(numero) ? null : numero);
                }}
                disabled={!canEditTab("3")}
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
            >
              <MaskedDecimalInput
                placeholder="Ex: 25,00"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.avaria}
                onChange={(value) => {
                  const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                  handleChange('avaria', isNaN(numero) ? null : numero);
                }}
                disabled={!canEditTab("3")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Resumo Financeiro */}
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
                {formatarValorMonetario(valoresCalculados.valorTotalFrutas)}
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
                +{formatarValorMonetario(valoresCalculados.frete + valoresCalculados.icms)}
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
                -{formatarValorMonetario(valoresCalculados.desconto + valoresCalculados.avaria)}
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
                {formatarValorMonetario(valoresCalculados.valorFinal)}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {canEditTab("3") && (
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
    </div>
    </>
  );
};

PrecificacaoTab.propTypes = {
  pedidoAtual: PropTypes.object.isRequired,
  setPedidoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  canEditTab: PropTypes.func.isRequired,
  frutas: PropTypes.array.isRequired,
  areasProprias: PropTypes.array.isRequired,
  areasFornecedores: PropTypes.array.isRequired,
  valoresCalculados: PropTypes.object.isRequired,
  setValoresCalculados: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isSaving: PropTypes.bool,
  calcularValores: PropTypes.func.isRequired,
};

export default PrecificacaoTab;
