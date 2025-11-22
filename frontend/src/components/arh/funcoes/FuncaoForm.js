// src/components/arh/funcoes/FuncaoForm.js

import React from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Row,
  Col,
  Card,
  Space,
  Switch,
  Typography,
} from "antd";
import {
  IdcardOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { MonetaryInput } from "../../common/inputs";

const { TextArea } = Input;
const { Text } = Typography;

const FuncaoForm = ({
  funcaoAtual,
  setFuncaoAtual,
  editando,
  erros,
  setErros,
}) => {
  const handleChange = (field, value) => {
    // Converter valor monetário para número se necessário
    let processedValue = value;
    if (field === "valorDiariaBase" && value !== undefined && value !== null && value !== "") {
      processedValue = typeof value === "string" ? parseFloat(value) : value;
    }

    setFuncaoAtual(prev => ({
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

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Informações Básicas */}
        <Card
          title={
            <Space>
              <IdcardOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações da Função</span>
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
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome da Função</span>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Ex: Colheita, Debaste, Defensivos"
                  value={funcaoAtual.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nome ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Valor da Diária (R$)</span>
                  </Space>
                }
                validateStatus={erros.valorDiariaBase ? "error" : ""}
                help={erros.valorDiariaBase}
                required
              >
                <MonetaryInput
                  value={funcaoAtual.valorDiariaBase}
                  onChange={(value) => handleChange("valorDiariaBase", value)}
                  placeholder="0,00"
                  addonAfter="R$"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.valorDiariaBase ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <ClockCircleOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Duração Padrão (horas)</span>
                  </Space>
                }
                validateStatus={erros.duracaoPadraoHoras ? "error" : ""}
                help={erros.duracaoPadraoHoras}
              >
                <Input
                  type="number"
                  placeholder="Ex: 8"
                  value={funcaoAtual.duracaoPadraoHoras}
                  onChange={(e) => handleChange("duracaoPadraoHoras", e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.duracaoPadraoHoras ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <SafetyOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Exige EPI?</span>
                  </Space>
                }
                help="Marque se a função exige equipamento de proteção individual"
              >
                <Space>
                  <Switch
                    checked={funcaoAtual.exigeEpi || false}
                    onChange={(checked) => handleChange("exigeEpi", checked)}
                    style={{
                      backgroundColor: funcaoAtual.exigeEpi ? "#059669" : "#d9d9d9",
                    }}
                  />
                  <Text style={{ 
                    color: funcaoAtual.exigeEpi ? "#059669" : "#666",
                    fontWeight: funcaoAtual.exigeEpi ? "600" : "400"
                  }}>
                    {funcaoAtual.exigeEpi ? "Sim, exige EPI" : "Não exige EPI"}
                  </Text>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Observações e Status */}
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Descrição da Função</span>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Descrição detalhada da função, atividades, etc. (opcional)"
                  value={funcaoAtual.descricao || ""}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Status da Função</span>
                  </Space>
                }
                help="Funções inativas não aparecem para seleção no cadastro de funcionários"
              >
                <Space>
                  <Switch
                    checked={funcaoAtual.ativo !== false}
                    onChange={(checked) => handleChange("ativo", checked)}
                    style={{
                      backgroundColor: funcaoAtual.ativo !== false ? "#059669" : "#d9d9d9",
                    }}
                  />
                  <Text style={{ 
                    color: funcaoAtual.ativo !== false ? "#059669" : "#666",
                    fontWeight: funcaoAtual.ativo !== false ? "600" : "400"
                  }}>
                    {funcaoAtual.ativo !== false ? "Ativa" : "Inativa"}
                  </Text>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

FuncaoForm.propTypes = {
  funcaoAtual: PropTypes.object.isRequired,
  setFuncaoAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
};

export default FuncaoForm;

