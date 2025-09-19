// src/pages/components/configuracoes/Geral.js
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Row,
  Col,
  Select,
  Switch,
  Card,
  Space,
  Divider,
} from "antd";
import InputMask from "react-input-mask";
import styled from "styled-components";
import {
  FileTextOutlined,
  CreditCardOutlined,
  RiseOutlined,
  BankOutlined,
  IdcardOutlined,
  HomeOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  AimOutlined,
  PercentageOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  formatarValorMonetario,
  numberFormatter,
  numberParser,
} from "../../utils/formatters";
import { GlobalOutlined, FlagOutlined } from "@ant-design/icons";
import { showNotification } from "config/notificationConfig";
import axiosInstance from "../../api/axiosConfig";
import { PrimaryButton } from "../common/buttons";

const { Title, Text } = Typography;
const { Option } = Select;

// Styled components para aplicar o estilo do sistema
const SectionContainer = styled.div`
  border: 1px solid #e8f5e8;
  padding: 24px;
  border-radius: 16px;
  margin-top: 16px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(5, 150, 105, 0.1);
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8f5e8;
  overflow: hidden;
  
  .ant-card-body {
    padding: 24px;
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    color: #059669 !important;
    font-weight: 600 !important;
    font-size: 14px !important;
  }

  .ant-input,
  .ant-select-selector,
  .ant-input-number {
    border: 2px solid #e8f5e8 !important;
    border-radius: 12px !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;

    &:hover {
      border-color: #10b981 !important;
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.1) !important;
    }

    &:focus,
    &.ant-input-focused,
    &.ant-select-focused .ant-select-selector {
      border-color: #059669 !important;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
    }
  }


  .ant-select-selector {
    height: 48px !important;
    
    .ant-select-selection-item {
      line-height: 24px !important;
    }
  }

  .ant-input-number {
    width: 100% !important;
    
    .ant-input-number-input {
      height: 24px !important;
      padding: 0 !important;
    }
  }
`;


const StyledSwitchContainer = styled.div`
  .ant-form-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }

  .switch-wrapper {
    display: flex;
    align-items: center;
    height: 50px;
    padding: 0 11px;
    border: 2px solid #e8f5e8;
    border-radius: 12px;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      border-color: #10b981;
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.1);
    }
  }

  .ant-switch {
    transform: scale(1.2);
  }
`;

// Componente customizado para inputs com máscara
const MaskedInput = ({ mask, ...props }) => (
  <InputMask
    mask={mask}
    maskChar={null} // Remove caracteres de máscara extras
    {...props}
  >
    {(inputProps) => <Input {...inputProps} size="large" />}
  </InputMask>
);

// Lista de estados brasileiros
const estados = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const Geral = ({ loading, dadosEmpresa, onSalvar }) => {
  const [form] = Form.useForm();
  const [loadingDadosEmpresa, setLoadingDadosEmpresa] = useState(false);

  // Carregar dados no formulário quando receber as props
  useEffect(() => {
    if (dadosEmpresa) {
      form.setFieldsValue({
        razaoSocial: dadosEmpresa.razao_social,
        nomeFantasia: dadosEmpresa.nome_fantasia,
        cnpj: dadosEmpresa.cnpj,
        proprietario: dadosEmpresa.proprietario,
        telefone: dadosEmpresa.telefone,
        logradouro: dadosEmpresa.logradouro,
        cep: dadosEmpresa.cep,
        bairro: dadosEmpresa.bairro,
        cidade: dadosEmpresa.cidade,
        estado: dadosEmpresa.estado,
      });
    }
  }, [dadosEmpresa, form]);

  const onFinish = (values) => {
    // Validar formatos
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/;
    const telefoneRegex = /^\(\d{2}\)\s\d{4,5}\-\d{4}$/;
    const cepRegex = /^\d{5}\-\d{3}$/;
  
    if (!cnpjRegex.test(values.cnpj)) {
      showNotification("error", "Erro", "CNPJ em formato inválido");
      return;
    }
  
    if (!telefoneRegex.test(values.telefone)) {
      showNotification("error", "Erro", "Telefone em formato inválido");
      return;
    }
  
    if (!cepRegex.test(values.cep)) {
      showNotification("error", "Erro", "CEP em formato inválido");
      return;
    }
    setLoadingDadosEmpresa(true); // Ativa o loading
    // Formatar dados antes de enviar
    const dadosFormatados = {
      razao_social: values.razaoSocial,
      nome_fantasia: values.nomeFantasia,
      cnpj: values.cnpj,
      proprietario: values.proprietario,
      telefone: values.telefone,
      logradouro: values.logradouro,
      cep: values.cep,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
    };
    onSalvar(dadosFormatados).finally(() => {
      setLoadingDadosEmpresa(false); // Desativa o loading após concluir
    });
  };

  const normalizeCep = (value) => {
    if (!value) return "";
    return value.replace(/[^\d]/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  return (
    <div>
      {/* Container para Dados Gerais da Empresa */}
      <SectionContainer>
        <StyledCard
          title={
            <Space>
              <BankOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados Gerais da Empresa</span>
            </Space>
          }
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              color: "#ffffff", 
              borderRadius: "8px 8px 0 0" 
            }
          }}
        >

        <StyledForm
          form={form}
          layout="vertical"
          onFinish={onFinish}
          data-form="dados-gerais-form"
        >
          <Row gutter={[16, 16]}>
            {/* Razão Social */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="razaoSocial"
                label={
                  <Text strong>
                    <BankOutlined style={{ marginRight: 8 }} />
                    Razão Social
                  </Text>
                }
                rules={[{ required: true, message: "Informe a razão social" }]}
              >
                <Input size="large" placeholder="Ex: Empresa XYZ LTDA" />
              </Form.Item>
            </Col>

            {/* Nome Fantasia */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="nomeFantasia"
                label={
                  <Text strong>
                    <HomeOutlined style={{ marginRight: 8 }} />
                    Nome Fantasia
                  </Text>
                }
                rules={[{ required: true, message: "Informe o nome fantasia" }]}
              >
                <Input size="large" placeholder="Ex: XYZ Comércio" />
              </Form.Item>
            </Col>

            {/* CNPJ */}
            {/* CNPJ */}
            <Col xs={24} sm={8}>
              <Form.Item
                name="cnpj"
                label={
                  <Text strong>
                    <IdcardOutlined style={{ marginRight: 8 }} />
                    CNPJ
                  </Text>
                }
                rules={[{ required: true, message: "Informe o CNPJ" }]}
              >
                <MaskedInput
                  mask="99.999.999/9999-99"
                  placeholder="00.000.000/0000-00"
                />
              </Form.Item>
            </Col>

            {/* Proprietário */}
            <Col xs={24} sm={8}>
              <Form.Item
                name="proprietario"
                label={
                  <Text strong>
                    <UserOutlined style={{ marginRight: 8 }} />
                    Proprietário
                  </Text>
                }
              >
                <Input size="large" placeholder="Nome do proprietário" />
              </Form.Item>
            </Col>

            {/* Telefone */}
            <Col xs={24} sm={8}>
              <Form.Item
                name="telefone"
                label={
                  <Text strong>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    Telefone
                  </Text>
                }
                rules={[{ required: true, message: "Informe o telefone" }]}
              >
                <MaskedInput
                  mask="(99) 99999-9999"
                  placeholder="(00) 00000-0000"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Endereço Separado */}
          <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "24px" }}>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            Endereço
          </Title>
          <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
          <Row gutter={[16, 16]}>
            {/* Logradouro */}
            <Col xs={24} sm={16}>
              <Form.Item
                name="logradouro"
                label={
                  <Text strong>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    Logradouro
                  </Text>
                }
                rules={[{ required: true, message: "Informe o logradouro" }]}
              >
                <Input size="large" placeholder="Ex: Rua Exemplo, 123" />
              </Form.Item>
            </Col>

            {/* CEP */}
            <Col xs={24} sm={8}>
              <Form.Item
                name="cep"
                label={
                  <Text strong>
                    <CompassOutlined style={{ marginRight: 8 }} />
                    CEP
                  </Text>
                }
                rules={[
                  { required: true, message: "Informe o CEP" },
                  {
                    validator: async (_, value) => {
                      if (value && !/^\d{5}-\d{3}$/.test(value)) {
                        throw new Error("CEP em formato inválido");
                      }
                    },
                  },
                ]}
              >
                <MaskedInput
                  mask="99999-999"
                  placeholder="00000-000"
                  maskChar={null}
                  value={normalizeCep(form.getFieldValue("cep"))}
                />
              </Form.Item>
            </Col>

            {/* Bairro */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="bairro"
                label={
                  <Text strong>
                    <AimOutlined style={{ marginRight: 8 }} />
                    Bairro
                  </Text>
                }
                rules={[{ required: true, message: "Informe o bairro" }]}
              >
                <Input size="large" placeholder="Ex: Centro" />
              </Form.Item>
            </Col>

            {/* Cidade */}
            <Col xs={24} sm={8}>
              <Form.Item
                name="cidade"
                label={
                  <Text strong>
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    Cidade
                  </Text>
                }
                rules={[{ required: true, message: "Informe a cidade" }]}
              >
                <Input size="large" placeholder="Ex: Marco" />
              </Form.Item>
            </Col>

            {/* Estado */}
            <Col xs={24} sm={4}>
              <Form.Item
                name="estado"
                label={
                  <Text strong>
                    <FlagOutlined style={{ marginRight: 8 }} />
                    Estado
                  </Text>
                }
                rules={[{ required: true, message: "Selecione o estado" }]}
              >
                <Select
                  size="large"
                  placeholder="UF"
                  showSearch
                  optionFilterProp="children"
                >
                  {estados.map((estado) => (
                    <Option key={estado} value={estado}>
                      {estado}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <PrimaryButton
              htmlType="submit"
              size="large"
              loading={loadingDadosEmpresa}
            >
              Salvar Dados da Empresa
            </PrimaryButton>
          </Form.Item>
        </StyledForm>
        </StyledCard>
      </SectionContainer>
    </div>
  );
};

export default Geral;
