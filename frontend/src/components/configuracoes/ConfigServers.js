// src/components/configuracoes/ConfigServers.js

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Switch,
  Select,
  InputNumber,
  Typography,
  Row,
  Col,
  Tabs,
  Tooltip,
  Space,
  Divider,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  SaveOutlined,
  GlobalOutlined,
  NumberOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SecurityScanOutlined,
  SendOutlined,
  WhatsAppOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { showNotification } from "../../config/notificationConfig";
import axiosInstance from "../../api/axiosConfig";
import { PrimaryButton } from "../common/buttons";

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const API_URL = {
  configEmail: "/config-email",
  configWhatsApp: "/config-whatsapp",
};

// Removido StyledPasswordInput. Usaremos o Input.Password padrão do Ant Design.
// const StyledPasswordInput = styled(Input.Password)`...`; 

// Removido StyledInputNumber. Usaremos o InputNumber padrão do Ant Design.
// const StyledInputNumber = styled(InputNumber)`...`; 

// Styled components para aplicar o estilo do sistema
const PageContainer = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  min-height: 100vh;
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
  .ant-input-password,
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

  .ant-input-password {
    .ant-input {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  }
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-tab {
    border-radius: 8px 8px 0 0 !important;
    border: 1px solid #e8f5e8 !important;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%) !important;
    margin-right: 8px !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
    }

    &.ant-tabs-tab-active {
      background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
      border-color: #059669 !important;
      
      .ant-tabs-tab-btn {
        color: #ffffff !important;
        font-weight: 600 !important;
      }
    }
  }

  .ant-tabs-content-holder {
    background: white;
    border-radius: 0 8px 8px 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border: 1px solid #e8f5e8;
    border-top: none;
    padding: 24px;
  }
`;

const NoMarginFormItem = styled(Form.Item)`
  margin-bottom: 0 !important;
`;

const ConfigServers = () => {
  // Email States
  const [emailForm] = Form.useForm();
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailTesteValue, setEmailTesteValue] = useState("");
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // WhatsApp States
  const [whatsappForm] = Form.useForm();
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [testWhatsAppLoading, setTestWhatsAppLoading] = useState(false);
  const [whatsappConfigExistente, setWhatsappConfigExistente] = useState(false);
  const [numeroTesteValue, setNumeroTesteValue] = useState("");

  // Estado para a aba ativa
  const [activeTab, setActiveTab] = useState("1");

  // =============== FUNÇÕES PARA EMAIL ===============
  // Função para buscar as configurações de email do backend
  const loadConfigEmail = async () => {
    try {
      setEmailLoading(true);
      const response = await axiosInstance.get(API_URL.configEmail);
      const data = response.data;

      // Atualizar o formulário com os dados recebidos
      emailForm.setFieldsValue({
        servidorSMTP: data.servidorSMTP,
        porta: data.porta,
        emailEnvio: data.emailEnvio,
        nomeExibicao: data.nomeExibicao,
        usuario: data.usuario,
        senha: "", // Não preenche a senha por segurança
        metodoAutenticacao: data.metodoAutenticacao,
        timeoutConexao: data.timeoutConexao,
        usarSSL: data.porta === 465, // Ajusta usarSSL com base na porta
        emailTeste: "", // Campo de teste não é armazenado no backend
      });

      setEmailTesteValue(""); // Garantir que o estado está limpo
    } catch (error) {
      showNotification(
        "error",
        "Erro",
        "Erro ao carregar configurações de email."
      );
    } finally {
      setEmailLoading(false);
    }
  };

  // Função para salvar as configurações de email
  const onFinishEmail = async (values) => {
    try {
      setEmailLoading(true);
      const {
        servidorSMTP,
        porta,
        emailEnvio,
        nomeExibicao,
        usuario,
        senha,
        metodoAutenticacao,
        timeoutConexao,
        usarSSL,
      } = values;

      // Enviar os dados para o backend
      const updateData = {
        servidorSMTP,
        porta,
        emailEnvio,
        nomeExibicao,
        usuario,
        metodoAutenticacao,
        timeoutConexao,
        usarSSL,
        ...(senha ? { senha } : {}), // Inclui o campo senha apenas se não estiver vazio
      };

      await axiosInstance.put(API_URL.configEmail, updateData);

      showNotification(
        "success",
        "Sucesso",
        "Configurações de email salvas com sucesso!"
      );
    } catch (error) {
      const msg =
        error.response?.data?.mensagem ||
        "Erro ao salvar configurações de email.";
      showNotification("error", "Erro", msg);
    } finally {
      setEmailLoading(false);
    }
  };

  // Função para testar as configurações de email
  const handleTestEmail = () => {
    const emailTeste = emailForm.getFieldValue("emailTeste");
    if (emailTeste) {
      setTestEmailLoading(true);
      // Enviar uma requisição para o backend para enviar o email de teste
      axiosInstance
        .post(`${API_URL.configEmail}/testar-email`, { emailTeste })
        .then(() => {
          showNotification(
            "success",
            "Sucesso",
            `Email de teste enviado para ${emailTeste}!`
          );
        })
        .catch((error) => {
          const msg =
            error.response?.data?.mensagem || "Erro ao enviar email de teste.";
          showNotification("error", "Erro", msg);
        })
        .finally(() => {
          setTestEmailLoading(false);
        });
    } else {
      showNotification(
        "warning",
        "Atenção",
        "Por favor, informe um email para teste."
      );
    }
  };

  // Função para monitorar mudanças no formulário de email
  const handleEmailValuesChange = (changedValues, allValues) => {
    if ("emailTeste" in changedValues) {
      setEmailTesteValue(changedValues.emailTeste);
    }
    if ("porta" in changedValues) {
      const porta = changedValues.porta;
      const usarSSL = porta === 465;
      emailForm.setFieldsValue({ usarSSL });
    }
  };

  // =============== FUNÇÕES PARA WHATSAPP ===============
  // Função para buscar as configurações de WhatsApp
  const loadConfigWhatsApp = async () => {
    try {
      setWhatsappLoading(true);
      const response = await axiosInstance.get(API_URL.configWhatsApp);
      if (response.data) {
        // Mapear dados do backend (camelCase) para campos do formulário (snake_case)
        const dadosMapeados = {
          nome_exibicao: response.data.nomeExibicao,
          numero_telefone: response.data.numeroTelefone,
          phone_number_id: response.data.phoneNumberId,
          business_account_id: response.data.businessAccountId,
          verify_token: response.data.verifyToken,
          access_token: response.data.accessToken,
          webhook_url: response.data.webhookUrl,
          ativo: response.data.ativo,
        };
        
        whatsappForm.setFieldsValue(dadosMapeados);
        setWhatsappConfigExistente(true);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        showNotification(
          "error",
          "Erro",
          "Erro ao carregar configurações do WhatsApp."
        );
      }
    } finally {
      setWhatsappLoading(false);
    }
  };

  // Função para salvar as configurações de WhatsApp
  const onFinishWhatsApp = async (values) => {
    try {
      setWhatsappLoading(true);
      const response = await axiosInstance.post(API_URL.configWhatsApp, values);
      
      // Verifica se a resposta tem uma mensagem específica
      const message = response.data.message || "Configurações de WhatsApp salvas com sucesso!";
      showNotification("success", "Configuração Salva", message);
      setWhatsappConfigExistente(true);
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.mensagem ||
        "Erro ao salvar configurações do WhatsApp.";
      showNotification("error", "Erro", msg);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleWhatsAppValuesChange = (changedValues, allValues) => {
    if ("numeroTeste" in changedValues) {
      setNumeroTesteValue(changedValues.numeroTeste);
    }
  };

  // Modifique a função handleTestWhatsApp para usar o número de teste
  const handleTestWhatsApp = async () => {
    const numeroTeste = whatsappForm.getFieldValue("numeroTeste");

    if (!numeroTeste) {
      showNotification(
        "warning",
        "Atenção",
        "Por favor, informe um número para teste."
      );
      return;
    }

    setTestWhatsAppLoading(true);
    try {
      const response = await axiosInstance.post(
        `${API_URL.configWhatsApp}/testar`,
        {
          telefone_teste: numeroTeste,
        }
      );

      if (response.data.success) {
        showNotification("success", "Teste Enviado", response.data.message);
      } else {
        showNotification(
          "error",
          "Erro no Teste",
          response.data.error || "Erro ao testar WhatsApp"
        );
      }
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.mensagem ||
        "Erro ao testar WhatsApp.";
      showNotification("error", "Erro no Teste", msg);
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  // Carregar configurações ao iniciar o componente
  useEffect(() => {
    if (activeTab === "1") {
      loadConfigEmail();
    } else if (activeTab === "2") {
      loadConfigWhatsApp();
    }
  }, [activeTab]);

  // Função para trocar de aba
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // =============== COMPONENTE EMAIL ===============
  const renderEmailTab = () => (
    <StyledCard
      title={
        <Space>
          <MailOutlined style={{ color: "#ffffff" }} />
          <span style={{ color: "#ffffff", fontWeight: "600" }}>Configurações do Servidor de Email</span>
        </Space>
      }
      loading={emailLoading}
      styles={{ 
        header: { 
          backgroundColor: "#059669", 
          color: "#ffffff", 
          borderRadius: "8px 8px 0 0" 
        }
      }}
    >
      <StyledForm
        form={emailForm}
        layout="vertical"
        onFinish={onFinishEmail}
        onValuesChange={handleEmailValuesChange}
      >
        <Row gutter={16}>
          {/* Servidor SMTP */}
          <Col xs={24} md={16}>
            <Form.Item
              name="servidorSMTP"
              label={
                <Text strong>
                  <GlobalOutlined style={{ marginRight: 8 }} />
                  Servidor SMTP
                </Text>
              }
              rules={[{ required: true, message: "Informe o servidor SMTP" }]}
            >
              <Input size="large" placeholder="Ex: smtp.gmail.com" />
            </Form.Item>
          </Col>

          {/* Porta */}
          <Col xs={24} md={8}>
            <Form.Item
              name="porta"
              label={
                <Text strong>
                  <NumberOutlined style={{ marginRight: 8 }} />
                  Porta
                </Text>
              }
              rules={[{ required: true, message: "Informe a porta" }]}
            >
              {/* Usando InputNumber padrão do Ant Design */}
              <InputNumber min={1} max={65535} placeholder="Ex: 587" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Email de Envio */}
          <Col xs={24} md={12}>
            <Form.Item
              name="emailEnvio"
              label={
                <Text strong>
                  <MailOutlined style={{ marginRight: 8 }} />
                  Email de Envio
                </Text>
              }
              rules={[
                { required: true, message: "Informe o email de envio" },
                { type: "email", message: "Email inválido" },
              ]}
            >
              <Input size="large" placeholder="Ex: sistema@seudominio.com" />
            </Form.Item>
          </Col>

          {/* Nome de Exibição */}
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeExibicao"
              label={
                <Text strong>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Nome de Exibição
                </Text>
              }
              rules={[
                { required: true, message: "Informe o nome de exibição" },
              ]}
            >
              <Input size="large" placeholder="Ex: Sistema de Informações - AlencarFrutas" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Usuário */}
          <Col xs={24} md={12}>
            <Form.Item
              name="usuario"
              label={
                <Text strong>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Usuário
                </Text>
              }
              rules={[{ required: true, message: "Informe o usuário" }]}
            >
              <Input size="large" placeholder="Usuário de autenticação" />
            </Form.Item>
          </Col>

          {/* Senha */}
          <Col xs={24} md={12}>
            <Form.Item
              name="senha"
              label={
                <Text strong>
                  <LockOutlined style={{ marginRight: 8 }} />
                  Senha
                </Text>
              }
            >
              {/* Usando Input.Password padrão do Ant Design */}
              <Input.Password
                size="large"
                placeholder="Senha de autenticação"
                iconRender={(visible) =>
                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Método de Autenticação */}
          <Col xs={24} md={8}>
            <Form.Item
              name="metodoAutenticacao"
              label={
                <Text strong>
                  <SecurityScanOutlined style={{ marginRight: 8 }} />
                  Método de Autenticação
                </Text>
              }
              rules={[
                {
                  required: true,
                  message: "Selecione o método de autenticação",
                },
              ]}
            >
              <Select size="large">
                <Option value="LOGIN">LOGIN</Option>
                <Option value="PLAIN">PLAIN</Option>
                <Option value="CRAM-MD5">CRAM-MD5</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Tempo Limite */}
          <Col xs={24} md={8}>
            <Form.Item
              name="timeoutConexao"
              label={
                <Text strong>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  Tempo Limite (segundos)
                </Text>
              }
              rules={[{ required: true, message: "Informe o tempo limite" }]}
            >
              {/* Usando InputNumber padrão do Ant Design */}
              <InputNumber min={1} max={300} placeholder="Ex: 30" size="large" />
            </Form.Item>
          </Col>

          {/* Usar SSL/TLS */}
          <Col xs={24} md={8}>
            <Form.Item
              name="usarSSL"
              label={
                <Text strong>
                  <LockOutlined style={{ marginRight: 8 }} />
                  Usar SSL/TLS
                </Text>
              }
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        {/* Email de Teste */}
        <Form.Item
          name="emailTeste"
          label={
            <Text strong>
              <MailOutlined style={{ marginRight: 8 }} />
              Email para Teste
            </Text>
          }
          rules={[{ type: "email", message: "Email inválido" }]}
        >
          <Input
            size="large"
            placeholder="Informe um email para testar as configurações"
          />
        </Form.Item>

        {/* Botões de Ação */}
        <Form.Item>
          <PrimaryButton
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            style={{ marginRight: 8 }}
            loading={emailLoading}
          >
            Salvar Configurações
          </PrimaryButton>
          <PrimaryButton
            size="large"
            onClick={handleTestEmail}
            disabled={!emailTesteValue}
            loading={testEmailLoading}
            icon={<SendOutlined />}
            style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
          >
            Testar Configurações
          </PrimaryButton>
        </Form.Item>
      </StyledForm>
    </StyledCard>
  );

  // =============== COMPONENTE WHATSAPP ===============
  const renderWhatsAppTab = () => (
    <StyledCard
      title={
        <Space>
          <WhatsAppOutlined style={{ color: "#ffffff" }} />
          <span style={{ color: "#ffffff", fontWeight: "600" }}>Configurações de Integração com WhatsApp</span>
        </Space>
      }
      loading={whatsappLoading}
      styles={{ 
        header: { 
          backgroundColor: "#059669", 
          color: "#ffffff", 
          borderRadius: "8px 8px 0 0" 
        }
      }}
    >
      <Typography>
        <Paragraph>
          Configure as credenciais para envio automático de faturas via WhatsApp
          Business Cloud API. Você precisará de uma conta no Meta Business e
          acesso ao WhatsApp Business API.
        </Paragraph>
      </Typography>

      <Divider />

      <StyledForm
        form={whatsappForm}
        layout="vertical"
        onFinish={onFinishWhatsApp}
        onValuesChange={handleWhatsAppValuesChange}
        initialValues={{
          ativo: true,
        }}
      >
        {/* Status de Ativação */}
        <Row gutter={16}>
          <Col xs={24} md={24}>
            <Form.Item
              name="ativo"
              label={
                <Text strong>
                  <WhatsAppOutlined style={{ marginRight: 8 }} />
                  Ativar envio de faturas via WhatsApp
                </Text>
              }
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Nome de Exibição */}
          <Col xs={24} md={12}>
            <Form.Item
              name="nome_exibicao"
              label={
                <Text strong>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Nome de Exibição
                </Text>
              }
              rules={[
                {
                  required: true,
                  message: "Informe o nome que será exibido nas mensagens",
                },
              ]}
            >
              <Input
                size="large"
                placeholder="Ex: AlencarFrutas - Sistema de Gestão"
              />
            </Form.Item>
          </Col>

          {/* Número de Telefone */}
          <Col xs={24} md={12}>
            <Form.Item
              name="numero_telefone"
              label={
                <Space>
                  <Text strong>
                    <WhatsAppOutlined style={{ marginRight: 8 }} />
                    Número de Telefone
                  </Text>
                  <Tooltip title="Formato internacional com código do país (ex: +5511999999999)">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              rules={[
                { required: true, message: "Informe o número de telefone" },
                {
                  pattern: /^\+[1-9]\d{1,14}$/,
                  message: "Formato internacional inválido",
                },
              ]}
            >
              <Input size="large" placeholder="Ex: +5511999999999" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Phone Number ID */}
          <Col xs={24} md={12}>
            <Form.Item
              name="phone_number_id"
              label={
                <Space>
                  <Text strong>
                    <NumberOutlined style={{ marginRight: 8 }} />
                    Phone Number ID
                  </Text>
                  <Tooltip title="ID do número fornecido pela Meta ao registrar seu número no WhatsApp Business">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: "Informe o ID do número de telefone",
                },
              ]}
            >
              <Input size="large" placeholder="Ex: 107269805412364" />
            </Form.Item>
          </Col>

          {/* Business Account ID */}
          <Col xs={24} md={12}>
            <Form.Item
              name="business_account_id"
              label={
                <Space>
                  <Text strong>
                    <NumberOutlined style={{ marginRight: 8 }} />
                    Business Account ID
                  </Text>
                  <Tooltip title="ID da sua conta de negócios no Meta Business (opcional)">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Input size="large" placeholder="Ex: 645372956427465" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Verify Token */}
          <Col xs={24} md={12}>
            <Form.Item
              name="verify_token"
              label={
                <Space>
                  <Text strong>
                    <SecurityScanOutlined style={{ marginRight: 8 }} />
                    Verify Token
                  </Text>
                  <Tooltip title="Token para verificação de webhooks (opcional)">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Input size="large" placeholder="Ex: alencarfrutas_whatsapp_verify_123" />
            </Form.Item>
          </Col>

          {/* Webhook URL */}
          <Col xs={24} md={12}>
            <Form.Item
              name="webhook_url"
              label={
                <Space>
                  <Text strong>
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    URL de Webhook
                  </Text>
                  <Tooltip title="URL para receber notificações de status (opcional)">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Input
                size="large"
                placeholder="Ex: https://seudominio.com/api/whatsapp-webhook"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Access Token - campo largo que fica sozinho */}
        <NoMarginFormItem
          name="access_token"
          label={
            <Space>
              <Text strong>
                <LockOutlined style={{ marginRight: 8 }} />
                Access Token
              </Text>
              <Tooltip title="Token de acesso permanente da API do WhatsApp Business">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: "Informe o token de acesso" }]}
        >
          <Input.TextArea
            placeholder="Cole aqui seu token de acesso"
            rows={3}
          />
        </NoMarginFormItem>

        {/* Número para Teste */}
        <Form.Item
          name="numeroTeste"
          label={
            <Text strong>
              <WhatsAppOutlined style={{ marginRight: 8 }} />
              Número para Teste
            </Text>
          }
          rules={[
            {
              pattern: /^[1-9][0-9]{10,11}$/,
              message: "Formato inválido. Informe apenas DDD + número",
            },
          ]}
        >
          <Input
            size="large"
            placeholder="Informe apenas DDD + número (Ex: 88999939726)"
          />
        </Form.Item>

        {/* Botões de Ação */}
        <Form.Item>
          <PrimaryButton
            htmlType="submit"
            loading={whatsappLoading}
            icon={<SaveOutlined />}
            size="large"
            style={{ marginRight: 8 }}
          >
            {whatsappConfigExistente ? "Atualizar" : "Salvar"}
          </PrimaryButton>

          <PrimaryButton
            onClick={handleTestWhatsApp}
            loading={testWhatsAppLoading}
            disabled={!whatsappConfigExistente}
            icon={<SendOutlined />}
            size="large"
            style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
          >
            Enviar mensagem de teste
          </PrimaryButton>
        </Form.Item>
      </StyledForm>

      <Divider />

      <Typography>
        <Title level={5}>Como configurar a API do WhatsApp</Title>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          1. Acesse o{" "}
          <a
            href="https://developers.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meta for Developers
          </a>
        </Paragraph>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          2. Crie uma aplicação do tipo Business
        </Paragraph>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          3. Adicione o produto "WhatsApp" à sua aplicação
        </Paragraph>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          4. Configure um número de telefone para testes ou conecte sua conta
          WhatsApp Business
        </Paragraph>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          5. Gere um token de acesso permanente
        </Paragraph>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          6. Copie o Phone Number ID e o Token para configurar aqui
        </Paragraph>
        <Paragraph style={{ 
          backgroundColor: '#fff3cd', 
          padding: '12px', 
          borderRadius: '6px',
          border: '1px solid #ffeaa7',
          marginTop: '16px'
        }}>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#856404' }} />
          <strong style={{ color: '#856404' }}>7. Para testar o envio de mensagens:</strong>
          <br />
          • Primeiro, envie uma mensagem manual para o WhatsApp configurado (o número que você cadastrou)
          <br />
          • Isso "abre a janela" de conversa no WhatsApp Business
          <br />
          • Depois, use o botão "Enviar mensagem de teste" aqui no sistema
          <br />
        </Paragraph>
      </Typography>
    </StyledCard>
  );

  // =============== RENDER PRINCIPAL ===============
  return (
    <PageContainer>
      <StyledTabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        size="large"
        tabBarStyle={{ marginBottom: 24 }}
      >
        <TabPane
          tab={
            <span>
              <MailOutlined style={{ fontSize: "18px", marginRight: 8 }} />
              Servidor de Email
            </span>
          }
          key="1"
        >
          {renderEmailTab()}
        </TabPane>
        <TabPane
          tab={
            <span>
              <WhatsAppOutlined style={{ fontSize: "18px", marginRight: 8 }} />
              WhatsApp Business
            </span>
          }
          key="2"
        >
          {renderWhatsAppTab()}
        </TabPane>
      </StyledTabs>
    </PageContainer>
  );
};

export default ConfigServers;
