// src/components/clientes/ClienteForm.js

import React from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Switch,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import { IMaskInput } from "react-imask";
import { validarDocumento } from "../../utils/documentValidation";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const ClienteForm = ({
  clienteAtual,
  setClienteAtual,
  editando,
  erros,
  setErros,
}) => {
  const handleChange = (field, value) => {
    setClienteAtual(prev => ({
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

    // Validação em tempo real para o campo documento
    if (field === 'documento' && value) {
      const validacao = validarDocumento(value);
      if (!validacao.valido) {
        setErros(prev => ({
          ...prev,
          documento: validacao.mensagem,
        }));
      }
    }
  };

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Informações Básicas */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações Básicas</span>
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
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome do Cliente</span>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Ex: Distribuidora ABC Ltda"
                  value={clienteAtual.nome}
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
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Razão Social</span>
                  </Space>
                }
                validateStatus={erros.razaoSocial ? "error" : ""}
                help={erros.razaoSocial}
              >
                <Input
                  placeholder="Ex: Distribuidora ABC Ltda"
                  value={clienteAtual.razaoSocial}
                  onChange={(e) => handleChange("razaoSocial", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.razaoSocial ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>CPF/CNPJ</span>
                  </Space>
                }
                validateStatus={erros.documento ? "error" : ""}
                help={
                  erros.documento || 
                  (clienteAtual.documento && (
                    <span style={{ color: "#52c41a", fontSize: "12px" }}>
                      {validarDocumento(clienteAtual.documento).tipo} válido
                    </span>
                  ))
                }
              >
                <IMaskInput
                  mask={[
                    { mask: '000.000.000-00' },
                    { mask: '00.000.000/0000-00' },
                  ]}
                  placeholder="Digite o CPF ou CNPJ"
                  onAccept={(value) => handleChange("documento", value)}
                  value={clienteAtual.documento || ''}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.documento ? "#ff4d4f" : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: '1px solid',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Inscrição Estadual</span>
                  </Space>
                }
                validateStatus={erros.inscricaoEstadual ? "error" : ""}
                help={erros.inscricaoEstadual}
              >
                <Input
                  placeholder="Ex: 123456789"
                  value={clienteAtual.inscricaoEstadual}
                  onChange={(e) => handleChange("inscricaoEstadual", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.inscricaoEstadual ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Inscrição Municipal</span>
                  </Space>
                }
                validateStatus={erros.inscricaoMunicipal ? "error" : ""}
                help={erros.inscricaoMunicipal}
              >
                <Input
                  placeholder="Ex: 987654321"
                  value={clienteAtual.inscricaoMunicipal}
                  onChange={(e) => handleChange("inscricaoMunicipal", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.inscricaoMunicipal ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Endereço */}
        <Card
          title={
            <Space>
              <EnvironmentOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Endereço</span>
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
            <Col xs={24} md={16}>
                              <Form.Item
                  label={
                    <Space>
                      <EnvironmentOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333" }}>Logradouro</span>
                    </Space>
                  }
                  validateStatus={erros.logradouro ? "error" : ""}
                  help={erros.logradouro}
                >
                  <Input
                    placeholder="Ex: Rua das Flores"
                    value={clienteAtual.logradouro}
                    onChange={(e) => handleChange("logradouro", e.target.value)}
                    style={{
                      borderRadius: "6px",
                      borderColor: erros.logradouro ? "#ff4d4f" : "#d9d9d9",
                    }}
                  />
                </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Bairro</span>
                  </Space>
                }
                validateStatus={erros.bairro ? "error" : ""}
                help={erros.bairro}
              >
                <Input
                  placeholder="Ex: Centro"
                  value={clienteAtual.bairro}
                  onChange={(e) => handleChange("bairro", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.bairro ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Cidade</span>
                  </Space>
                }
                validateStatus={erros.cidade ? "error" : ""}
                help={erros.cidade}
              >
                <Input
                  placeholder="Ex: Fortaleza"
                  value={clienteAtual.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.cidade ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Estado</span>
                  </Space>
                }
                validateStatus={erros.estado ? "error" : ""}
                help={erros.estado}
              >
                <Input
                  placeholder="Ex: CE"
                  value={clienteAtual.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.estado ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>CEP</span>
                  </Space>
                }
                validateStatus={erros.cep ? "error" : ""}
                help={erros.cep}
              >
                <IMaskInput
                  mask="00000-000"
                  placeholder="Ex: 60000-000"
                  onAccept={(value) => handleChange("cep", value)}
                  value={clienteAtual.cep || ''}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.cep ? "#ff4d4f" : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: '1px solid',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 3: Comunicação */}
        <Card
          title={
            <Space>
              <PhoneOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Comunicação</span>
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
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <PhoneOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Telefone Principal</span>
                  </Space>
                }
                validateStatus={erros.telefone1 ? "error" : ""}
                help={erros.telefone1}
              >
                <IMaskInput
                  mask="(00) 00000-0000"
                  placeholder="Ex: (88) 99966-1299"
                  onAccept={(value) => handleChange("telefone1", value)}
                  value={clienteAtual.telefone1 || ''}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.telefone1 ? "#ff4d4f" : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: '1px solid',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <PhoneOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Telefone Secundário</span>
                  </Space>
                }
                validateStatus={erros.telefone2 ? "error" : ""}
                help={erros.telefone2}
              >
                <IMaskInput
                  mask="(00) 00000-0000"
                  placeholder="Ex: (88) 99966-1300"
                  onAccept={(value) => handleChange("telefone2", value)}
                  value={clienteAtual.telefone2 || ''}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.telefone2 ? "#ff4d4f" : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: '1px solid',
                    transition: 'all 0.3s',
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
                    <MailOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Email Principal</span>
                  </Space>
                }
                validateStatus={erros.email1 ? "error" : ""}
                help={erros.email1}
              >
                <Input
                  placeholder="Ex: contato@empresa.com"
                  value={clienteAtual.email1}
                  onChange={(e) => handleChange("email1", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.email1 ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <MailOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Email Secundário</span>
                  </Space>
                }
                validateStatus={erros.email2 ? "error" : ""}
                help={erros.email2}
              >
                <Input
                  placeholder="Ex: financeiro@empresa.com"
                  value={clienteAtual.email2}
                  onChange={(e) => handleChange("email2", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.email2 ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 4: Observações */}
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
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações sobre o Cliente</span>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Observações sobre o cliente (opcional)"
                  value={clienteAtual.observacoes || ""}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
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
                    <BuildOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Tipo de Cliente</span>
                  </Space>
                }
                help="Marque se o cliente é uma indústria"
              >
                <Space>
                  <Switch
                    checked={clienteAtual.industria || false}
                    onChange={(checked) => handleChange("industria", checked)}
                    style={{
                      backgroundColor: clienteAtual.industria ? "#059669" : "#d9d9d9",
                    }}
                  />
                  <Text style={{ 
                    color: clienteAtual.industria ? "#059669" : "#666",
                    fontWeight: clienteAtual.industria ? "600" : "400"
                  }}>
                    {clienteAtual.industria ? "Indústria" : "Cliente Comum"}
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

ClienteForm.propTypes = {
  clienteAtual: PropTypes.object.isRequired,
  setClienteAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
};

export default ClienteForm; 