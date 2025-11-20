// src/components/configuracoes/Usuarios.js
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Card,
  Select,
  List,
  Modal,
  message,
  Space,
  Divider,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  LockOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  NumberOutlined,
  MailOutlined,
  FormOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteFilled,
  AppleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import InputMask from "react-input-mask";
import { showNotification } from "config/notificationConfig";
import { PrimaryButton } from "../common/buttons";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// === Componentes Estilizados ===
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
    font-weight: 600;
    color: #059669;
  }
  
  .ant-input,
  .ant-input-password,
  .ant-select-selector {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #059669;
    }
    
    &:focus,
    &.ant-input-focused,
    &.ant-select-focused .ant-select-selector {
      border-color: #059669;
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
    }
  }

`;

const StyledList = styled(List)`
  .ant-list-item {
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 16px;
    padding-bottom: 20px;
    background: #ffffff;
    border: 1px solid #e8f5e8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.1);
      border: 1px solid #059669;
    }
  }
  
  .ant-list-item-meta-title {
    color: #059669;
    font-weight: 600;
    font-size: 16px;
  }
  
  .ant-list-item-meta-description {
    color: #666;
    line-height: 1.6;
  }
  
  .ant-list-item-action {
    margin-left: 16px;
    margin-top: 8px;
  }
`;

// Removendo StyledModal - usando Modal padrão com styles prop

// === Componente estilizado para o input de E-mail com domínio fixo ===
const EmailInputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px; /* Altura consistente com os demais inputs */
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  padding: 0 11px;
  font-size: 16px;
  transition: all 0.3s;
  margin-bottom: 0 !important; /* FORÇA margin-bottom 0 para consistência */

  &:hover {
    border-color: #40a9ff;
  }
  &:focus-within {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  .ant-input {
    border: none !important;
    box-shadow: none !important;
    height: 100% !important;
    padding: 0 !important;
    flex: 1;
    font-size: 16px;
    background-color: transparent !important;
    line-height: 50px;
    margin-bottom: 0 !important; /* FORÇA margin-bottom 0 no input interno */
  }

  .email-domain {
    color: rgba(0, 0, 0, 0.45);
    margin-left: 4px;
    white-space: nowrap;
    user-select: none;
    font-weight: 600;
  }

`;

// === Componente customizado para o campo de email ===
// Este componente integra corretamente com o Form do Ant Design
const CustomEmailInput = ({ value = '', onChange, placeholder }) => {
  // Extrai o nome de usuário do valor completo do email
  const username = value.split('@')[0] || '';

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    // Chama a função onChange passada pelo Form.Item com o valor completo do email
    if (onChange) {
      onChange(`${newUsername}@alencarfrutas.com.br`);
    }
  };

  return (
    <EmailInputWrapper className="email-input-wrapper">
      <Input
        placeholder={placeholder}
        value={username}
        onChange={handleUsernameChange}
      />
      <span className="email-domain">@alencarfrutas.com.br</span>
    </EmailInputWrapper>
  );
};


const API_URL = {
  usuarios: "/auth/users",
  updatePassword: "/auth/update-password",
  culturas: "/api/culturas",
};

const Usuarios = () => {
  const [usuarioForm] = Form.useForm();
  const [senhaForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [culturas, setCulturas] = useState([]);
  const [nivelSelecionado, setNivelSelecionado] = useState(null);
  const [nivelEdicao, setNivelEdicao] = useState(null);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_URL.usuarios);
      setUsuarios(response.data);
    } catch (error) {
      showNotification("error", "Erro", "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const loadCulturas = async () => {
    try {
      const response = await axiosInstance.get(API_URL.culturas);
      setCulturas(response.data);
    } catch (error) {
      showNotification("error", "Erro", "Erro ao carregar culturas.");
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadCulturas();
  }, []);

  const onFinishUsuario = async (values) => {
    try {
      const cpfFormatado = values.cpf.replace(/[^\d]/g, '');

      const dadosUsuario = {
        nome: values.nome,
        cpf: cpfFormatado,
        email: values.email,
        senha: values.senha,
        nivel: values.nivel,
        // Se o nível não for GERENTE_CULTURA, não envia culturaId
        // Se for GERENTE_CULTURA e tiver culturaId, inclui no objeto
        ...(values.nivel === 'GERENTE_CULTURA' && values.culturaId && { culturaId: values.culturaId }),
      };

      await axiosInstance.post(API_URL.usuarios, dadosUsuario);
      showNotification("success", "Sucesso", "Usuário cadastrado com sucesso!");
      usuarioForm.resetFields();
      setNivelSelecionado(null);
      loadUsuarios();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensagem ||
        "Erro ao cadastrar usuário.";
      showNotification("error", "Erro", msg);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: "Confirmação de Exclusão",
      content: "Você tem certeza que deseja excluir este usuário? Essa ação é irreversível.",
      okText: "Sim, excluir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axiosInstance.delete(`${API_URL.usuarios}/${id}`);
          showNotification("success", "Sucesso", "Usuário excluído com sucesso!");
          loadUsuarios();
        } catch (error) {
          const msg =
            error.response?.data?.message || 
            error.response?.data?.mensagem || 
            "Erro ao excluir usuário.";
          showNotification("error", "Erro", msg);
        }
      },
    });
  };

  const openAlterarSenhaModal = (usuario) => {
    setSelectedUsuario(usuario);
    senhaForm.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (usuario) => {
    setEditingUsuario(usuario);
    setNivelEdicao(usuario.nivel);

    // Garantir que o CPF esteja formatado corretamente
    const cpfFormatado = usuario.cpf
      ? usuario.cpf.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : '';

    editForm.setFieldsValue({
      nome: usuario.nome,
      cpf: cpfFormatado,
      email: usuario.email,
      nivel: usuario.nivel,
      culturaId: usuario.culturaId
    });
    setEditModalVisible(true);
  };

  const onFinishSenha = async (values) => {
    try {
      setLoading(true);
      await axiosInstance.post(API_URL.updatePassword, {
        email: selectedUsuario.email,
        novaSenha: values.novaSenha,
      });
      showNotification("success", "Sucesso", `Senha do usuário ${selectedUsuario.nome} alterada com sucesso!`);
      setModalVisible(false);
      loadUsuarios();
    } catch (error) {
      const msg =
        error.response?.data?.message || 
        error.response?.data?.mensagem || 
        "Erro ao alterar senha.";
      showNotification("error", "Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  const onFinishEdit = async (values) => {
    try {
      setLoading(true);
      console.log("Valores do formulário:", values);
      console.log("ID do usuário:", editingUsuario.id);

      const cpfFormatado = values.cpf.replace(/[^\d]/g, '');

      const dadosAtualizacao = {
        nome: values.nome,
        cpf: cpfFormatado,
        email: values.email,
        nivel: values.nivel,
        // Se o nível não for GERENTE_CULTURA, remove a cultura (envia null)
        // Se for GERENTE_CULTURA e tiver culturaId, inclui no objeto
        culturaId: values.nivel === 'GERENTE_CULTURA' ? (values.culturaId || null) : null,
      };

      console.log("Dados para envio:", dadosAtualizacao);

      await axiosInstance.put(`${API_URL.usuarios}/${editingUsuario.id}`, dadosAtualizacao);
      showNotification("success", "Sucesso", `Usuário ${values.nome} atualizado com sucesso!`);
      setEditModalVisible(false);
      setNivelEdicao(null);
      loadUsuarios();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensagem ||
        "Erro ao atualizar usuário.";
      showNotification("error", "Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* Seção: Cadastro de Usuário */}
      <StyledCard
        title={
          <Space>
            <FormOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Cadastro de Usuário</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          }
        }}
      >
        <StyledForm form={usuarioForm} layout="vertical" onFinish={onFinishUsuario}>
          <Row gutter={[16, 16]}>
            {/* Primeira Linha: Nome e CPF */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="nome"
                label={<Text strong><UserOutlined style={{ marginRight: 8 }} />Nome</Text>}
                rules={[{ required: true, message: "Informe o nome" }]}
              >
                <Input size="large" placeholder="Ex: João Silva" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cpf"
                label={<Text strong><IdcardOutlined style={{ marginRight: 8 }} />CPF</Text>}
                rules={[
                  { required: true, message: "Informe o CPF" },
                  { pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, message: "Formato de CPF inválido. Ex: 123.456.789-00" },
                ]}
              >
                <InputMask mask="999.999.999-99" maskChar="">
                  {(inputProps) => <Input {...inputProps} size="large" placeholder="Ex: 123.456.789-00" />}
                </InputMask>
              </Form.Item>
            </Col>

            {/* Segunda Linha: Nível, Cultura (condicional), Email, Senha */}
            <Col xs={24} sm={12} md={nivelSelecionado === 'GERENTE_CULTURA' ? 6 : 8}>
              <Form.Item
                name="nivel"
                label={<Text strong><NumberOutlined style={{ marginRight: 8 }} /> Nível</Text>}
                rules={[{ required: true, message: "Selecione o nível" }]}
              >
                <Select
                  size="large"
                  placeholder="Selecione o nível"
                  onChange={(value) => {
                    setNivelSelecionado(value);
                    // Limpar culturaId se não for GERENTE_CULTURA
                    if (value !== 'GERENTE_CULTURA') {
                      usuarioForm.setFieldValue('culturaId', undefined);
                    }
                  }}
                >
                  <Option value="ADMINISTRADOR">Administrador</Option>
                  <Option value="GERENTE_GERAL">Gerente Geral</Option>
                  <Option value="ESCRITORIO">Escritório</Option>
                  <Option value="GERENTE_CULTURA">Gerente de Cultura</Option>
                </Select>
              </Form.Item>
            </Col>

            {nivelSelecionado === 'GERENTE_CULTURA' && (
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="culturaId"
                  label={<Text strong><AppleOutlined style={{ marginRight: 8 }} /> Cultura</Text>}
                  rules={[{ required: true, message: "Selecione a cultura" }]}
                >
                  <Select size="large" placeholder="Selecione a cultura">
                    {culturas.map((cultura) => (
                      <Option key={cultura.id} value={cultura.id}>{cultura.descricao}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col xs={24} sm={12} md={nivelSelecionado === 'GERENTE_CULTURA' ? 6 : 8}>
              <Form.Item
                name="email"
                label={<Text strong><MailOutlined style={{ marginRight: 8 }} />Email</Text>}
                rules={[
                  { required: true, message: "Informe o nome de usuário" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const username = value.split('@')[0];
                      if (username.trim() === '') {
                        return Promise.reject(new Error("Informe o nome de usuário."));
                      }
                      const emailUsernameRegex = /^[a-zA-Z0-9._-]+$/;
                      if (!emailUsernameRegex.test(username)) {
                        return Promise.reject(new Error("Use apenas letras, números, '.', '_' ou '-'."));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <CustomEmailInput placeholder="Usuário" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={nivelSelecionado === 'GERENTE_CULTURA' ? 6 : 8}>
              <Form.Item
                name="senha"
                label={<Text strong><LockOutlined style={{ marginRight: 8 }} />Senha</Text>}
                rules={[{ required: true, message: "Informe a senha" }]}
              >
                <Input.Password
                  size="large"
                  placeholder="Digite a senha"
                  iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 16 }}>
            <PrimaryButton htmlType="submit" size="large">
              Cadastrar Usuário
            </PrimaryButton>
          </Form.Item>
        </StyledForm>
      </StyledCard>

      {/* Seção: Listagem de Usuários */}
      <StyledCard
        title={
          <Space>
            <UnorderedListOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Listagem de Usuários</span>
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
        <StyledList
          itemLayout="vertical"
          dataSource={usuarios}
          loading={loading}
          renderItem={(usuario) => (
            <List.Item
              key={usuario.id}
              actions={[
                <PrimaryButton onClick={() => openEditModal(usuario)} icon={<EditOutlined />} size="small">
                  Editar
                </PrimaryButton>,
                <PrimaryButton onClick={() => openAlterarSenhaModal(usuario)} icon={<LockOutlined />} size="small">
                  Alterar Senha
                </PrimaryButton>,
                <PrimaryButton onClick={() => handleDelete(usuario.id)} icon={<DeleteFilled />} size="small">
                  Excluir
                </PrimaryButton>,
              ]}
            >
              <List.Item.Meta
                title={usuario.nome}
                description={
                  <>
                    <Text>
                      <strong>CPF:</strong> {usuario.cpf ? usuario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-'} <br />
                      <strong>Email:</strong> {usuario.email} <br />
                      <strong>Nível:</strong> {
                        usuario.nivel === 'ADMINISTRADOR' ? 'Administrador' :
                        usuario.nivel === 'GERENTE_GERAL' ? 'Gerente Geral' :
                        usuario.nivel === 'ESCRITORIO' ? 'Escritório' :
                        usuario.nivel === 'GERENTE_CULTURA' ? 'Gerente de Cultura' :
                        usuario.nivel
                      } <br />
                      {usuario.culturaId && (
                        <>
                          <strong>Cultura:</strong> {culturas.find(c => c.id === usuario.culturaId)?.descricao || 'N/A'} <br />
                        </>
                      )}
                      <strong>Data de Cadastro:</strong>{" "}
                      {usuario.dataCadastro ? new Date(usuario.dataCadastro).toLocaleDateString('pt-BR') : "-"} <br />
                      <strong>Último Acesso:</strong>{" "}
                      {usuario.ultimoAcesso ? new Date(usuario.ultimoAcesso).toLocaleString('pt-BR') : "Nunca acessou"}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </StyledCard>

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
            <LockOutlined style={{ marginRight: 8 }} />
            Alterar Senha - {selectedUsuario?.nome || ""}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        styles={{
          body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto", overflowX: "hidden", padding: 20 },
          header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", padding: 0 },
          wrapper: { zIndex: 1100 }
        }}
        centered
        destroyOnClose
      >
        {/* Seção: Dados da Nova Senha */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Usuário: {selectedUsuario?.nome || ""}
              </span>
            </Space>
          }
          style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              borderBottom: "2px solid #047857", 
              color: "#ffffff", 
              borderRadius: "8px 8px 0 0",
              padding: "8px 16px"
            },
            body: { padding: "16px" }
          }}
        >
          <StyledForm form={senhaForm} layout="vertical" onFinish={onFinishSenha} initialValues={{ novaSenha: "", confirmarSenha: "" }}>
            <Form.Item
              name="novaSenha"
              label={<Text strong><LockOutlined style={{ marginRight: 8 }} />Nova Senha</Text>}
              rules={[{ required: true, message: "Informe a nova senha" }]}
            >
              <Input.Password
                placeholder="Digite a nova senha"
                iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
            <Form.Item
              name="confirmarSenha"
              label={<Text strong><LockOutlined style={{ marginRight: 8 }} />Confirmar Nova Senha</Text>}
              dependencies={["novaSenha"]}
              rules={[
                { required: true, message: "Confirme a nova senha" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("novaSenha") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("As senhas não conferem!"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Repita a nova senha"
                iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </StyledForm>
        </Card>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <PrimaryButton 
            onClick={() => setModalVisible(false)}
            disabled={loading}
            size="large"
            style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
          >
            Cancelar
          </PrimaryButton>
          <PrimaryButton 
            onClick={() => senhaForm.submit()}
            loading={loading}
            size="large"
          >
            Alterar Senha
          </PrimaryButton>
        </div>
      </Modal>

      {/* Modal de Edição de Usuário */}
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
            <EditOutlined style={{ marginRight: 8 }} />
            Editar Usuário - {editingUsuario?.nome || ""}
          </span>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
        styles={{
          body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto", overflowX: "hidden", padding: 20 },
          header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", padding: 0 },
          wrapper: { zIndex: 1100 }
        }}
        centered
        destroyOnClose
      >
        {/* Seção: Dados do Usuário */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Dados do Usuário
              </span>
            </Space>
          }
          style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              borderBottom: "2px solid #047857", 
              color: "#ffffff", 
              borderRadius: "8px 8px 0 0",
              padding: "8px 16px"
            },
            body: { padding: "16px" }
          }}
        >
          <StyledForm form={editForm} layout="vertical" onFinish={onFinishEdit}>
            <Form.Item
              name="nome"
              label={<Text strong><UserOutlined style={{ marginRight: 8 }} />Nome Completo</Text>}
              rules={[{ required: true, message: "Informe o nome completo" }]}
            >
              <Input
                placeholder="Digite o nome completo"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item
              name="cpf"
              label={<Text strong><IdcardOutlined style={{ marginRight: 8 }} />CPF</Text>}
              rules={[
                { required: true, message: "Informe o CPF" },
                { pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, message: "Formato de CPF inválido. Ex: 123.456.789-00" },
              ]}
            >
              <InputMask
                mask="999.999.999-99"
                maskChar=""
                placeholder="000.000.000-00"
              >
                {(inputProps) => (
                  <Input
                    {...inputProps}
                    style={{ borderRadius: 6 }}
                  />
                )}
              </InputMask>
            </Form.Item>

            <Form.Item
              name="email"
              label={<Text strong><MailOutlined style={{ marginRight: 8 }} />E-mail</Text>}
              rules={[
                { required: true, message: "Informe o nome de usuário" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const username = value.split('@')[0];
                    if (username.trim() === '') {
                      return Promise.reject(new Error("Informe o nome de usuário."));
                    }
                    const emailUsernameRegex = /^[a-zA-Z0-9._-]+$/;
                    if (!emailUsernameRegex.test(username)) {
                      return Promise.reject(new Error("Use apenas letras, números, '.', '_' ou '-'."));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <CustomEmailInput placeholder="Usuário" />
            </Form.Item>

            <Form.Item
              name="nivel"
              label={<Text strong><NumberOutlined style={{ marginRight: 8 }} />Nível de Acesso</Text>}
              rules={[{ required: true, message: "Selecione o nível de acesso" }]}
            >
              <Select
                placeholder="Selecione o nível"
                style={{ borderRadius: 6 }}
                onChange={(value) => {
                  setNivelEdicao(value);
                  // Se mudar para um nível diferente de GERENTE_CULTURA, limpa o culturaId
                  if (value !== 'GERENTE_CULTURA') {
                    editForm.setFieldValue('culturaId', undefined);
                  }
                }}
              >
                <Option value="ADMINISTRADOR">Administrador</Option>
                <Option value="GERENTE_GERAL">Gerente Geral</Option>
                <Option value="ESCRITORIO">Escritório</Option>
                <Option value="GERENTE_CULTURA">Gerente de Cultura</Option>
              </Select>
            </Form.Item>

            {nivelEdicao === 'GERENTE_CULTURA' && (
              <Form.Item
                name="culturaId"
                label={<Text strong><AppleOutlined style={{ marginRight: 8 }} />Cultura</Text>}
                rules={[{ required: true, message: "Selecione a cultura" }]}
              >
                <Select placeholder="Selecione a cultura" style={{ borderRadius: 6 }}>
                  {culturas.map((cultura) => (
                    <Option key={cultura.id} value={cultura.id}>{cultura.descricao}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </StyledForm>
        </Card>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <PrimaryButton 
            onClick={() => setEditModalVisible(false)}
            disabled={loading}
            size="large"
            style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
          >
            Cancelar
          </PrimaryButton>
          <PrimaryButton 
            onClick={() => editForm.submit()}
            loading={loading}
            size="large"
          >
            Salvar Alterações
          </PrimaryButton>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default Usuarios;
