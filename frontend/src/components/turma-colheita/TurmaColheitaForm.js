// src/components/turma-colheita/TurmaColheitaForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Card, Row, Col, Spin, Space, Select } from "antd";
import {
  UserOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  TeamOutlined
} from "@ant-design/icons";
import useResponsive from "../../hooks/useResponsive";

const { TextArea } = Input;
const { Option } = Select;

// Mapeamento dos tipos de chave PIX
const TIPOS_CHAVE_PIX = {
  1: "Telefone",
  2: "Email",
  3: "CPF/CNPJ",
  4: "Chave Aleatória"
};

const TurmaColheitaForm = ({
  turmaAtual,
  setTurmaAtual,
  erros,
  setErros,
  loadingData,
  onChavePixChange
}) => {
  const { isMobile } = useResponsive();

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

  // Handler especial para tipoChavePix que também atualiza modalidadeChave
  const handleTipoChavePixChange = (value) => {
    setTurmaAtual(prev => ({
      ...prev,
      tipoChavePix: value,
      modalidadeChave: value ? TIPOS_CHAVE_PIX[value] : undefined
    }));

    // Limpar erro do campo quando alterado
    if (erros.tipoChavePix) {
      setErros(prev => ({
        ...prev,
        tipoChavePix: undefined
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
    <div style={{ minWidth: 0 }}>
      <Form layout="vertical" size={isMobile ? "middle" : "large"}>
        {/* Seção 1: Dados do Colhedor */}
        <Card
          title={
            <Space>
              <TeamOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados do Colhedor</span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
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
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
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
                    height: isMobile ? 36 : undefined,
                  }}
                  size={isMobile ? "middle" : "large"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <CreditCardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Tipo da Chave PIX (Opcional)</span>
                  </Space>
                }
                validateStatus={erros.tipoChavePix ? "error" : ""}
                help={erros.tipoChavePix}
              >
                <Select
                  placeholder="Selecione o tipo"
                  value={turmaAtual.tipoChavePix}
                  onChange={handleTipoChavePixChange}
                  allowClear
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.tipoChavePix ? "#ff4d4f" : "#d9d9d9",
                    width: "100%",
                  }}
                  size={isMobile ? "middle" : "large"}
                >
                  <Option value={1}>{TIPOS_CHAVE_PIX[1]}</Option>
                  <Option value={2}>{TIPOS_CHAVE_PIX[2]}</Option>
                  <Option value={3}>{TIPOS_CHAVE_PIX[3]}</Option>
                  <Option value={4}>{TIPOS_CHAVE_PIX[4]}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    // Se há callback customizado, usar ele; senão usar o handler padrão
                    if (onChavePixChange) {
                      onChavePixChange(value);
                    } else {
                      handleFieldChange("chavePix", value);
                    }
                  }}
                  maxLength={100}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.chavePix ? "#ff4d4f" : "#d9d9d9",
                    height: isMobile ? 36 : undefined,
                  }}
                  size={isMobile ? "middle" : "large"}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Responsável pela Chave PIX (Opcional)</span>
                  </Space>
                }
                validateStatus={erros.responsavelChavePix ? "error" : ""}
                help={erros.responsavelChavePix}
              >
                <Input
                  placeholder="Nome da pessoa responsável pela chave PIX"
                  value={turmaAtual.responsavelChavePix}
                  onChange={(e) => handleFieldChange("responsavelChavePix", e.target.value)}
                  maxLength={100}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.responsavelChavePix ? "#ff4d4f" : "#d9d9d9",
                    height: isMobile ? 36 : undefined,
                  }}
                  size={isMobile ? "middle" : "large"}
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
            marginBottom: isMobile ? 12 : 16,
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
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
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
                  rows={isMobile ? 3 : 4}
                  placeholder="Observações sobre a turma de colheita (opcional)"
                  value={turmaAtual.observacoes || ""}
                  onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? 13 : undefined,
                  }}
                  size={isMobile ? "middle" : "large"}
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
  onChavePixChange: PropTypes.func,
};

export default TurmaColheitaForm;