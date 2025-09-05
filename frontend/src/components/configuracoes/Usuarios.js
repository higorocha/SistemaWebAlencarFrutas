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
} from "@ant-design/icons";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import InputMask from "react-input-mask";
import { showNotification } from "config/notificationConfig";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

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

  &.ant-form-item-has-error {
    border-color: #ff4d4f !important;
    margin-bottom: 0 !important; /* FORÇA margin-bottom 0 mesmo com erro */
  }
  &.ant-form-item-has-error:hover {
    border-color: #ff7875 !important;
  }
  &.ant-form-item-has-error:focus-within {
    border-color: #ff4d4f !important;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
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
    <EmailInputWrapper>
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
};

const Usuarios = () => {
  const [usuarioForm] = Form.useForm();
  const [senhaForm] = Form.useForm();
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadUsuarios();
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
      };

      await axiosInstance.post(API_URL.usuarios, dadosUsuario);
      showNotification("success", "Sucesso", "Usuário cadastrado com sucesso!");
      usuarioForm.resetFields();
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

  const onFinishSenha = async (values) => {
    try {
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
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Configurações de Usuários
      </Title>

      <Card style={{ marginBottom: 24, padding: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          Cadastro de Usuário
        </Title>
        <Form form={usuarioForm} layout="vertical" onFinish={onFinishUsuario}>
          <Row gutter={[16, 16]}>
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
            <Col xs={24} sm={8}>
              <Form.Item
                name="nivel"
                label={<Text strong><NumberOutlined style={{ marginRight: 8 }} /> Nível</Text>}
                rules={[{ required: true, message: "Selecione o nível" }]}
              >
                <Select size="large" placeholder="Selecione o nível">
                  <Option value="ADMINISTRADOR">Administrador</Option>
                  <Option value="USUARIO">Usuário</Option>
                  <Option value="CONVIDADO">Convidado</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
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
            <Col xs={24} sm={8}>
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
            <Button type="primary" htmlType="submit" size="large">
              Cadastrar Usuário
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card type="inner" title="Listagem de Usuários">
        <List
          itemLayout="vertical"
          dataSource={usuarios}
          loading={loading}
          renderItem={(usuario) => (
            <List.Item
              key={usuario.id}
              actions={[
                <Button type="text" onClick={() => openAlterarSenhaModal(usuario)} icon={<LockOutlined />}>
                  Alterar Senha
                </Button>,
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(usuario.id)}>
                  Excluir
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={usuario.nome}
                description={
                  <>
                    <Text>
                      <strong>CPF:</strong> {usuario.cpf ? usuario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-'} <br />
                      <strong>Email:</strong> {usuario.email} <br />
                      <strong>Nível:</strong> {usuario.nivel} <br />
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
      </Card>

      <Modal
        title={`Alterar Senha - ${selectedUsuario?.nome || ""}`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={senhaForm} layout="vertical" onFinish={onFinishSenha} initialValues={{ novaSenha: "", confirmarSenha: "" }}>
          <Form.Item
            name="novaSenha"
            label="Nova Senha"
            rules={[{ required: true, message: "Informe a nova senha" }]}
          >
            <Input.Password
              placeholder="Digite a nova senha"
              iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            />
          </Form.Item>
          <Form.Item
            name="confirmarSenha"
            label="Confirmar Nova Senha"
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
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Confirmar Alteração de Senha
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;
