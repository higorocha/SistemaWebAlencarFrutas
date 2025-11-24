// src/components/arh/cargos/CargoForm.js

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

const CargoForm = ({
  cargoAtual,
  setCargoAtual,
  editando,
  erros,
  setErros,
}) => {
  const handleChange = (field, value) => {
    // Converter valor monetário para número se necessário
    let processedValue = value;
    if (field === "salarioMensal" && value !== undefined && value !== null && value !== "") {
      processedValue = typeof value === "string" ? parseFloat(value) : value;
    }

    setCargoAtual(prev => ({
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Cargo</span>
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome do Cargo</span>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Ex: Gerente de Produção"
                  value={cargoAtual.nome}
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Salário Mensal (R$)</span>
                  </Space>
                }
                validateStatus={erros.salarioMensal ? "error" : ""}
                help={erros.salarioMensal}
                required
              >
                <MonetaryInput
                  value={cargoAtual.salarioMensal}
                  onChange={(value) => handleChange("salarioMensal", value)}
                  placeholder="0,00"
                  addonAfter="R$"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.salarioMensal ? "#ff4d4f" : "#d9d9d9",
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Carga Horária Mensal (horas)</span>
                  </Space>
                }
                validateStatus={erros.cargaHorariaMensal ? "error" : ""}
                help={erros.cargaHorariaMensal}
              >
                <Input
                  type="number"
                  placeholder="Ex: 220"
                  value={cargoAtual.cargaHorariaMensal}
                  onChange={(e) => handleChange("cargaHorariaMensal", e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.cargaHorariaMensal ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <SafetyOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Adicional de Periculosidade (%)</span>
                  </Space>
                }
                validateStatus={erros.adicionalPericulosidade ? "error" : ""}
                help={erros.adicionalPericulosidade}
              >
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  value={cargoAtual.adicionalPericulosidade}
                  onChange={(e) => handleChange("adicionalPericulosidade", e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.adicionalPericulosidade ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Descrição do Cargo</span>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Descrição detalhada do cargo, responsabilidades, etc. (opcional)"
                  value={cargoAtual.descricao || ""}
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
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Cargo Gerencial</span>
                  </Space>
                }
                help="Cargos gerenciais podem ser vinculados como gerentes de funcionários diaristas"
              >
                <Space>
                  <Switch
                    checked={cargoAtual.isGerencial === true}
                    onChange={(checked) => handleChange("isGerencial", checked)}
                    style={{
                      backgroundColor: cargoAtual.isGerencial === true ? "#059669" : "#d9d9d9",
                    }}
                  />
                  <Text style={{ 
                    color: cargoAtual.isGerencial === true ? "#059669" : "#666",
                    fontWeight: cargoAtual.isGerencial === true ? "600" : "400"
                  }}>
                    {cargoAtual.isGerencial === true ? "Sim" : "Não"}
                  </Text>
                </Space>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Status do Cargo</span>
                  </Space>
                }
                help="Cargos inativos não aparecem para seleção no cadastro de funcionários"
              >
                <Space>
                  <Switch
                    checked={cargoAtual.ativo !== false}
                    onChange={(checked) => handleChange("ativo", checked)}
                    style={{
                      backgroundColor: cargoAtual.ativo !== false ? "#059669" : "#d9d9d9",
                    }}
                  />
                  <Text style={{ 
                    color: cargoAtual.ativo !== false ? "#059669" : "#666",
                    fontWeight: cargoAtual.ativo !== false ? "600" : "400"
                  }}>
                    {cargoAtual.ativo !== false ? "Ativo" : "Inativo"}
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

CargoForm.propTypes = {
  cargoAtual: PropTypes.object.isRequired,
  setCargoAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
};

export default CargoForm;

