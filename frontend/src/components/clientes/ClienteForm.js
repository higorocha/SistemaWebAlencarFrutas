// src/components/clientes/ClienteForm.js

import React, { useEffect, useState, useRef } from "react";
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
  Spin,
  Modal,
  Button,
  Progress,
  InputNumber,
  Tooltip,
  Alert,
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
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CloseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { IMaskInput } from "react-imask";
import { validarDocumento } from "../../utils/documentValidation";
import { formatMissingClienteBoletoFields } from "../../utils/clienteBoletoValidation";
import { useClienteValidation } from "../../hooks/useClienteValidation";
import { useCnpjConsulta } from "../../hooks/useCnpjConsulta";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const ClienteForm = ({
  clienteAtual,
  setClienteAtual,
  editando,
  erros,
  setErros,
  requiredBoletoFields = [],
}) => {
  const { nomeValidation, validateNome, resetValidation } = useClienteValidation();
  const { cnpjData, consultarCnpj, resetConsulta } = useCnpjConsulta();
  
  // Ref para armazenar o valor inicial do documento quando o componente é montado
  // Inicializa com o valor atual do documento para evitar busca ao carregar cliente existente
  const documentoInicialRef = useRef(clienteAtual.documento || null);
  
  // Atualizar o valor inicial quando o cliente mudar
  useEffect(() => {
    documentoInicialRef.current = clienteAtual.documento || null;
    resetConsulta();
  }, [clienteAtual.id, resetConsulta]);
  
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
      } else {
        // Se é um CNPJ válido (14 dígitos), consultar API apenas se o valor mudou
        const documentoLimpo = value.replace(/\D/g, '');
        const documentoInicialLimpo = documentoInicialRef.current ? documentoInicialRef.current.replace(/\D/g, '') : null;
        
        // Só fazer a busca se o valor atual for diferente do valor inicial
        // Isso evita que a busca seja disparada ao carregar um cliente existente
        if (documentoLimpo.length === 14 && documentoLimpo !== documentoInicialLimpo) {
          consultarCnpj(value);
        }
      }
    } else if (field === 'documento' && !value) {
      // Se documento foi limpo, resetar consulta
      resetConsulta();
    }

    // Validação em tempo real para o campo nome
    if (field === 'nome') {
      if (value && value.trim().length >= 2) {
        validateNome(value, editando ? clienteAtual.id : null);
      } else {
        resetValidation();
      }
    }
  };

  // Resetar validação quando o componente for desmontado ou cliente mudado
  useEffect(() => {
    resetValidation();
    resetConsulta();
  }, [clienteAtual.id, resetValidation, resetConsulta]);

  // Estado para controlar modal de confirmação
  const [cnpjModalVisible, setCnpjModalVisible] = useState(false);
  const [dadosCnpjEncontrados, setDadosCnpjEncontrados] = useState(null);

  // Preencher formulário automaticamente quando dados do CNPJ chegarem
  useEffect(() => {
    if (cnpjData.data && !cnpjData.isLoading && !cnpjData.error) {
      setDadosCnpjEncontrados(cnpjData.data);
      setCnpjModalVisible(true);
    }
  }, [cnpjData.data, cnpjData.isLoading, cnpjData.error]);

  const handleConfirmarPreenchimento = () => {
    setClienteAtual(prev => ({
      ...prev,
      ...dadosCnpjEncontrados,
      // Manter o documento original formatado
      documento: prev.documento,
      // Manter o ID se estiver editando
      id: prev.id
    }));
    setCnpjModalVisible(false);
    setDadosCnpjEncontrados(null);
  };

  const handleCancelarPreenchimento = () => {
    setCnpjModalVisible(false);
    setDadosCnpjEncontrados(null);
  };

  // =====================================================
  // Destaques para fluxo de boleto (sem depender de borda)
  // =====================================================
  const isMissingForBoleto = (fieldKey) => {
    if (!Array.isArray(requiredBoletoFields) || requiredBoletoFields.length === 0) return false;
    if (!requiredBoletoFields.includes(fieldKey)) return false;

    if (fieldKey === "cpfCnpj") {
      return !(clienteAtual.documento || "").trim();
    }
    return !(String(clienteAtual[fieldKey] || "").trim());
  };

  const missingForBoletoNow = Array.isArray(requiredBoletoFields)
    ? requiredBoletoFields.filter((k) => isMissingForBoleto(k))
    : [];

  const makeBoletoAwareLabel = (iconNode, text, fieldKey) => {
    const needs = isMissingForBoleto(fieldKey);
    return (
      <Space>
        {iconNode}
        <span
          style={{
            fontWeight: "700",
            color: needs ? "#d48806" : "#333",
          }}
        >
          {text}
        </span>
        {needs && (
          <Tag
            color="gold"
            style={{
              borderRadius: 6,
              fontWeight: 700,
              marginInlineStart: 4,
            }}
          >
            Obrigatório p/ boleto
          </Tag>
        )}
      </Space>
    );
  };

  return (
    <div>
      <style>
        {`
          .rotating-progress .ant-progress-circle-path {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Form layout="vertical" size="large">
        {missingForBoletoNow.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message="Atenção: dados obrigatórios para boleto"
            description={`Preencha os campos destacados em amarelo: ${formatMissingClienteBoletoFields(missingForBoletoNow).join(", ")}.`}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}
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
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome do Cliente</span>
                  </Space>
                }
                validateStatus={
                  erros.nome
                    ? "error"
                    : nomeValidation.isValid === false
                      ? "error"
                      : nomeValidation.isValid === true
                        ? "success"
                        : ""
                }
                help={
                  erros.nome ||
                  (nomeValidation.message && (
                    <Space>
                      {nomeValidation.isChecking ? (
                        <LoadingOutlined style={{ color: "#1890ff" }} />
                      ) : nomeValidation.isValid === false ? (
                        <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
                      ) : nomeValidation.isValid === true ? (
                        <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      ) : null}
                      <span style={{
                        color: nomeValidation.isValid === false
                          ? "#ff4d4f"
                          : nomeValidation.isValid === true
                            ? "#52c41a"
                            : "#666"
                      }}>
                        {nomeValidation.message}
                      </span>
                    </Space>
                  ))
                }
                required
              >
                <Input
                  placeholder="Ex: Distribuidora ABC Ltda"
                  value={clienteAtual.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  suffix={
                    nomeValidation.isChecking ? (
                      <Spin
                        indicator={<LoadingOutlined style={{ fontSize: 16, color: "#1890ff" }} />}
                      />
                    ) : nomeValidation.isValid === false ? (
                      <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
                    ) : nomeValidation.isValid === true ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : null
                  }
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nome
                      ? "#ff4d4f"
                      : nomeValidation.isValid === false
                        ? "#ff4d4f"
                        : nomeValidation.isValid === true
                          ? "#52c41a"
                          : "#d9d9d9",
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
                label={makeBoletoAwareLabel(
                  <IdcardOutlined style={{ color: "#059669" }} />,
                  "CPF/CNPJ",
                  "cpfCnpj"
                )}
                validateStatus={erros.documento ? "error" : ""}
                help={
                  erros.documento ||
                  cnpjData.error ? (
                    <Space>
                      <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
                      <span style={{ color: "#ff4d4f", fontSize: "12px" }}>
                        {cnpjData.error}
                      </span>
                    </Space>
                  ) : cnpjData.isLoading ? (
                    <Space>
                      <LoadingOutlined style={{ color: "#1890ff" }} />
                      <span style={{ color: "#1890ff", fontSize: "12px" }}>
                        Consultando CNPJ...
                      </span>
                    </Space>
                  ) : cnpjData.data ? (
                    <Space>
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      <span style={{ color: "#52c41a", fontSize: "12px" }}>
                        CNPJ encontrado: {cnpjData.data.razaoSocial}
                      </span>
                    </Space>
                  ) : (clienteAtual.documento && (
                    <span style={{ color: "#52c41a", fontSize: "12px" }}>
                      {validarDocumento(clienteAtual.documento).tipo} válido
                    </span>
                  ))
                }
              >
                <div style={{ position: 'relative', width: '100%' }}>
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
                      borderColor: erros.documento
                        ? "#ff4d4f"
                        : cnpjData.isLoading
                          ? "#1890ff"
                          : (requiredBoletoFields.includes("cpfCnpj") && !(clienteAtual.documento || "").trim())
                            ? "#faad14"
                            : "#d9d9d9",
                      width: '100%',
                      height: '40px',
                      padding: '4px 11px',
                      fontSize: '14px',
                      border: `1px solid ${
                        erros.documento
                          ? "#ff4d4f"
                          : cnpjData.isLoading
                            ? "#1890ff"
                            : (requiredBoletoFields.includes("cpfCnpj") && !(clienteAtual.documento || "").trim())
                              ? "#faad14"
                              : "#d9d9d9"
                      }`,
                      transition: 'all 0.3s',
                      paddingRight: cnpjData.isLoading ? '40px' : '11px',
                    }}
                  />
                  {cnpjData.isLoading && (
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}>
                      <Progress
                        type="circle"
                        percent={75}
                        showInfo={false}
                        size={20}
                        strokeColor="#1890ff"
                        strokeWidth={8}
                        className="rotating-progress"
                      />
                    </div>
                  )}
                </div>
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
            <Col xs={24} md={16}>
                              <Form.Item
                  label={makeBoletoAwareLabel(
                    <EnvironmentOutlined style={{ color: "#059669" }} />,
                    "Logradouro",
                    "logradouro"
                  )}
                  validateStatus={erros.logradouro ? "error" : ""}
                  help={erros.logradouro}
                >
                  <Input
                    placeholder="Ex: Rua das Flores"
                    value={clienteAtual.logradouro}
                    onChange={(e) => handleChange("logradouro", e.target.value)}
                    style={{
                      borderRadius: "6px",
                      borderColor: erros.logradouro
                        ? "#ff4d4f"
                        : (requiredBoletoFields.includes("logradouro") && !(clienteAtual.logradouro || "").trim())
                          ? "#faad14"
                          : "#d9d9d9",
                      border: `1px solid ${
                        erros.logradouro
                          ? "#ff4d4f"
                          : (requiredBoletoFields.includes("logradouro") && !(clienteAtual.logradouro || "").trim())
                            ? "#faad14"
                            : "#d9d9d9"
                      }`,
                    }}
                  />
                </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={makeBoletoAwareLabel(
                  <EnvironmentOutlined style={{ color: "#059669" }} />,
                  "Bairro",
                  "bairro"
                )}
                validateStatus={erros.bairro ? "error" : ""}
                help={erros.bairro}
              >
                <Input
                  placeholder="Ex: Centro"
                  value={clienteAtual.bairro}
                  onChange={(e) => handleChange("bairro", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.bairro
                      ? "#ff4d4f"
                      : (requiredBoletoFields.includes("bairro") && !(clienteAtual.bairro || "").trim())
                        ? "#faad14"
                        : "#d9d9d9",
                    border: `1px solid ${
                      erros.bairro
                        ? "#ff4d4f"
                        : (requiredBoletoFields.includes("bairro") && !(clienteAtual.bairro || "").trim())
                          ? "#faad14"
                          : "#d9d9d9"
                    }`,
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={makeBoletoAwareLabel(
                  <EnvironmentOutlined style={{ color: "#059669" }} />,
                  "Cidade",
                  "cidade"
                )}
                validateStatus={erros.cidade ? "error" : ""}
                help={erros.cidade}
              >
                <Input
                  placeholder="Ex: Fortaleza"
                  value={clienteAtual.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.cidade
                      ? "#ff4d4f"
                      : (requiredBoletoFields.includes("cidade") && !(clienteAtual.cidade || "").trim())
                        ? "#faad14"
                        : "#d9d9d9",
                    border: `1px solid ${
                      erros.cidade
                        ? "#ff4d4f"
                        : (requiredBoletoFields.includes("cidade") && !(clienteAtual.cidade || "").trim())
                          ? "#faad14"
                          : "#d9d9d9"
                    }`,
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={makeBoletoAwareLabel(
                  <EnvironmentOutlined style={{ color: "#059669" }} />,
                  "Estado",
                  "estado"
                )}
                validateStatus={erros.estado ? "error" : ""}
                help={erros.estado}
              >
                <Input
                  placeholder="Ex: CE"
                  value={clienteAtual.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.estado
                      ? "#ff4d4f"
                      : (requiredBoletoFields.includes("estado") && !(clienteAtual.estado || "").trim())
                        ? "#faad14"
                        : "#d9d9d9",
                    border: `1px solid ${
                      erros.estado
                        ? "#ff4d4f"
                        : (requiredBoletoFields.includes("estado") && !(clienteAtual.estado || "").trim())
                          ? "#faad14"
                          : "#d9d9d9"
                    }`,
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={makeBoletoAwareLabel(
                  <EnvironmentOutlined style={{ color: "#059669" }} />,
                  "CEP",
                  "cep"
                )}
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
                    borderColor: erros.cep
                      ? "#ff4d4f"
                      : (requiredBoletoFields.includes("cep") && !(clienteAtual.cep || "").trim())
                        ? "#faad14"
                        : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: `1px solid ${
                      erros.cep
                        ? "#ff4d4f"
                        : (requiredBoletoFields.includes("cep") && !(clienteAtual.cep || "").trim())
                          ? "#faad14"
                          : "#d9d9d9"
                    }`,
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

        {/* Seção 4: Tipo e Prazo */}
        <Card
          title={
            <Space>
              <BuildOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Tipo e Prazo</span>
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
                    <BuildOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Tipo de Cliente</span>
                    <Tooltip
                      title={
                        <div style={{ maxWidth: "300px" }}>
                          <div style={{ marginBottom: "8px", fontWeight: "600" }}>
                            Cliente Indústria:
                          </div>
                          <div style={{ marginBottom: "8px" }}>
                            Quando marcado como "Indústria", o sistema habilita campos complementares nos pedidos:
                          </div>
                          <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                            <li>Data de Entrada</li>
                            <li>Data de Descarga</li>
                            <li>Peso Médio</li>
                            <li>Média em Mililitros</li>
                          </ul>
                          <div style={{ marginTop: "8px", fontSize: "11px", color: "#d9d9d9" }}>
                            Esses campos aparecem apenas para clientes classificados como indústria.
                          </div>
                        </div>
                      }
                      placement="top"
                    >
                      <InfoCircleOutlined 
                        style={{ 
                          color: "#059669", 
                          cursor: "help",
                          fontSize: "14px"
                        }} 
                      />
                    </Tooltip>
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

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Prazo (Dias)</span>
                  </Space>
                }
                validateStatus={erros.dias ? "error" : ""}
                help={erros.dias || "Número de dias para prazo de pagamento"}
              >
                <div style={{ display: "inline-block", width: "100px" }}>
                  <InputNumber
                    placeholder="Ex: 30"
                    min={0}
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: erros.dias ? "#ff4d4f" : "#d9d9d9",
                    }}
                    controls={false}
                    formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
                    parser={(value) => value.replace(/[^0-9]/g, '')}
                    value={clienteAtual.dias}
                    onChange={(value) => handleChange("dias", value)}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 5: Observações */}
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
        </Card>
      </Form>

      {/* Modal de Confirmação CNPJ */}
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
            <CheckCircleOutlined style={{ marginRight: 8 }} />
            CNPJ Encontrado!
          </span>
        }
        open={cnpjModalVisible}
        onCancel={handleCancelarPreenchimento}
        footer={null}
        width={600}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: 20
          },
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            padding: 0
          },
          wrapper: { zIndex: 1200 },
          mask: { zIndex: 1150 }
        }}
        centered
        destroyOnClose
      >
        {dadosCnpjEncontrados && (
          <>
            {/* Card com dados da empresa */}
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados da Empresa</span>
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
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ color: "#059669" }}>Razão Social:</Text>
                      <br />
                      <Text style={{ fontSize: "16px" }}>{dadosCnpjEncontrados.razaoSocial}</Text>
                    </div>
                    <div>
                      <Text strong style={{ color: "#059669" }}>Nome Fantasia:</Text>
                      <br />
                      <Text style={{ fontSize: "16px" }}>{dadosCnpjEncontrados.nome}</Text>
                    </div>
                    <div>
                      <Text strong style={{ color: "#059669" }}>Endereço:</Text>
                      <br />
                      <Text style={{ fontSize: "16px" }}>
                        {dadosCnpjEncontrados.logradouro}, {dadosCnpjEncontrados.numero} - {dadosCnpjEncontrados.bairro}
                      </Text>
                    </div>
                    <div>
                      <Text strong style={{ color: "#059669" }}>Cidade/Estado:</Text>
                      <br />
                      <Text style={{ fontSize: "16px" }}>
                        {dadosCnpjEncontrados.cidade} - {dadosCnpjEncontrados.estado}
                      </Text>
                    </div>
                    {dadosCnpjEncontrados.cep && (
                      <div>
                        <Text strong style={{ color: "#059669" }}>CEP:</Text>
                        <br />
                        <Text style={{ fontSize: "16px" }}>{dadosCnpjEncontrados.cep}</Text>
                      </div>
                    )}
                    {dadosCnpjEncontrados.email1 && (
                      <div>
                        <Text strong style={{ color: "#059669" }}>Email:</Text>
                        <br />
                        <Text style={{ fontSize: "16px" }}>{dadosCnpjEncontrados.email1}</Text>
                      </div>
                    )}
                    {dadosCnpjEncontrados.telefone1 && (
                      <div>
                        <Text strong style={{ color: "#059669" }}>Telefone:</Text>
                        <br />
                        <Text style={{ fontSize: "16px" }}>{dadosCnpjEncontrados.telefone1}</Text>
                      </div>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Pergunta de confirmação */}
            <Card
              style={{
                marginBottom: 16,
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#f0f9ff",
                borderColor: "#1890ff"
              }}
            >
              <div style={{ textAlign: "center", padding: "8px" }}>
                <Text style={{ fontSize: "16px", fontWeight: "500" }}>
                  Deseja preencher automaticamente os campos do formulário com estes dados?
                </Text>
              </div>
            </Card>

            {/* Botões de ação */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #e8e8e8"
            }}>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancelarPreenchimento}
                size="large"
              >
                Não, obrigado
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirmarPreenchimento}
                size="large"
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              >
                Sim, preencher
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

ClienteForm.propTypes = {
  clienteAtual: PropTypes.object.isRequired,
  setClienteAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  requiredBoletoFields: PropTypes.array,
};

export default ClienteForm; 