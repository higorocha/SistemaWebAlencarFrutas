// src/components/turma-colheita/TurmaColheitaForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Card, Row, Col, Spin, Space } from "antd";
import {
  UserOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  TeamOutlined
} from "@ant-design/icons";

const { TextArea } = Input;

const TurmaColheitaForm = ({
  turmaAtual,
  setTurmaAtual,
  erros,
  setErros,
  loadingData
}) => {

  const handleFieldChange = (field, value) => {
    setTurmaAtual(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando alterado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };



  if (loadingData) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px"
      }}>
        <Spin size="large" tip="Carregando dados..." />
      </div>
    );
  }

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Dados do Colhedor */}
        <Card
          title={
            <Space>
              <TeamOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados do Colhedor</span>
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
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome do Colhedor/Turma</span>
                  </Space>
                }
                validateStatus={erros.nomeColhedor ? "error" : ""}
                help={erros.nomeColhedor}
                required
              >
                <Input
                  placeholder="Ex: João Silva"
                  value={turmaAtual.nomeColhedor}
                  onChange={(e) => handleFieldChange("nomeColhedor", e.target.value)}
                  maxLength={100}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nomeColhedor ? "#ff4d4f" : "#d9d9d9",
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
                    <CreditCardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Chave PIX (Opcional)</span>
                  </Space>
                }
                validateStatus={erros.chavePix ? "error" : ""}
                help={erros.chavePix}
              >
                <Input
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={turmaAtual.chavePix}
                  onChange={(e) => handleFieldChange("chavePix", e.target.value)}
                  maxLength={100}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.chavePix ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

        </Card>

        {/* Seção 2: Observações */}
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações sobre a Turma</span>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Observações sobre a turma de colheita (opcional)"
                  value={turmaAtual.observacoes || ""}
                  onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

TurmaColheitaForm.propTypes = {
  turmaAtual: PropTypes.object.isRequired,
  setTurmaAtual: PropTypes.func.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  loadingData: PropTypes.bool.isRequired,
};

export default TurmaColheitaForm;