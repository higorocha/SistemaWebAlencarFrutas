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
import axiosInstance from "../../api/axiosConfig"; // substituindo axios por axiosInstance

const { Title, Text } = Typography;
const { Option } = Select;

const StyledSwitchContainer = styled.div`
  .ant-form-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px; // Mantém consistente com outros Form.Items
  }

  .switch-wrapper {
    display: flex;
    align-items: center;
    height: 50px; /* Definido para 50px para consistência */
    padding: 0 11px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: #40a9ff;
    }
  }

  .ant-switch {
    transform: scale(1.2);
  }
`;

// Removido StyledInputNumber. Usaremos o InputNumber padrão do Ant Design.
// const StyledInputNumber = styled(InputNumber)`...`;

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
      <div
        style={{
          border: "1px solid #ccc",
          padding: 16,
          borderRadius: 8,
          marginTop: 16,
        }}
      >
        <Title level={4} style={{ marginBottom: 16 }}>
          Dados Gerais da Empresa
        </Title>

        <Form
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
          <Title level={5} style={{ marginBottom: 16, marginTop: 24 }}>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            Endereço
          </Title>
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

          <Form.Item style={{ marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loadingDadosEmpresa}
            >
              Salvar Dados da Empresa
            </Button>
          </Form.Item>
        </Form>
      </div>


    </div>
  );
};

export default Geral;
