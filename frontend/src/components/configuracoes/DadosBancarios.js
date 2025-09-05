// src/pages/conteudoAba/DadosBancarios.js
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
  Tooltip,
  Switch,
  InputNumber,
} from "antd";
import {
  BankOutlined,
  NumberOutlined,
  ContainerOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  ApiOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  UserOutlined,
  LockOutlined,
  BranchesOutlined,
  ShopOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig"; // substituindo axios por axiosInstance
import { showNotification } from "config/notificationConfig";
import { getBancoDisplay, getBancosOptions } from "../../utils/bancosUtils";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// Styled component para o Switch de convênios
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

const DadosBancarios = () => {
  const [form] = Form.useForm();
  const [apiForm] = Form.useForm();
  const [conveniosForm] = Form.useForm();
  const [contaCorrenteRecords, setContaCorrenteRecords] = useState([]);
  const [credenciaisRecords, setCredenciaisRecords] = useState([]);
  const [editingCredential, setEditingCredential] = useState(null);
  const [editingContaCorrente, setEditingContaCorrente] = useState(null);
  const [multaAtiva, setMultaAtiva] = useState(false);
  const [layoutBoletoFundoBranco, setLayoutBoletoFundoBranco] = useState(false);
  const [loadingConvenios, setLoadingConvenios] = useState(false);

  // URL dos endpoints do backend
  const API_URL = {
    contaCorrente: "/contacorrente",
    credenciaisAPI: "/credenciais-api",
    convenios: "/convenio-cobranca",
  };

  // Carrega os registros de Conta Corrente
  const loadContaCorrente = async () => {
    try {
      const response = await axiosInstance.get(API_URL.contaCorrente);
      setContaCorrenteRecords(response.data || []);
    } catch (error) {
      message.error("Erro ao carregar dados da Conta Corrente");
    }
  };

  // Carrega o registro de Credenciais API (se existir)
  const loadCredenciais = async () => {
    try {
      const response = await axiosInstance.get(API_URL.credenciaisAPI);
      if (response.data && response.data.length > 0) {
        setCredenciaisRecords(response.data);
      }
    } catch (error) {
      message.error("Erro ao carregar as Credenciais API");
    }
  };

  useEffect(() => {
    loadContaCorrente();
    loadCredenciais();
  }, []);

  // Carregar dados dos convênios
  useEffect(() => {
    const carregarConvenios = async () => {
      try {
        const response = await axiosInstance.get(API_URL.convenios);
        if (response.data) {
          // Mapear campos do backend para o frontend
          const dadosConvenio = {
            conta_corrente: response.data.contaCorrenteId,
            juros: response.data.juros,
            dias_aberto: response.data.diasAberto,
            multa_ativa: response.data.multaAtiva || false,
            layout_boleto_fundo_branco: response.data.layoutBoletoFundoBranco || false,
            valor_multa: response.data.valorMulta,
            carencia_multa: response.data.carenciaMulta,
            convenio: response.data.convenio,
            carteira: response.data.carteira,
            variacao: response.data.variacao,
          };
          
          conveniosForm.setFieldsValue(dadosConvenio);
          setMultaAtiva(response.data.multaAtiva || false);
          setLayoutBoletoFundoBranco(response.data.layoutBoletoFundoBranco || false);
        }
      } catch (error) {
        // Se for 404 ou similar, é porque não existe convênio ainda - isso é normal
        if (error.response?.status !== 404) {
          // Erro inesperado
        }
      }
    };

    carregarConvenios();
  }, [conveniosForm]);

  const onFinishContaCorrente = async (values) => {
    try {
      // Mapear "banco" para "bancoCodigo" para o backend
      const dadosFormatados = {
        bancoCodigo: values.banco,
        agencia: values.agencia,
        agenciaDigito: values.agenciaDigito,
        contaCorrente: values.contaCorrente,
        contaCorrenteDigito: values.contaCorrenteDigito,
      };

      if (editingContaCorrente && editingContaCorrente.id) {
        // Atualiza o registro via PUT
        const response = await axiosInstance.put(
          `${API_URL.contaCorrente}/${editingContaCorrente.id}`,
          dadosFormatados
        );
        setContaCorrenteRecords(prev => 
          prev.map(item => 
            item.id === editingContaCorrente.id ? response.data : item
          )
        );
        setEditingContaCorrente(null);
        showNotification(
          "success",
          "Dados Bancários",
          "Conta corrente atualizada com sucesso!"
        );
      } else {
        // Cria um novo registro via POST
        const response = await axiosInstance.post(
          API_URL.contaCorrente,
          dadosFormatados
        );
        setContaCorrenteRecords(prev => [...prev, response.data]);
        showNotification(
          "success",
          "Dados Bancários",
          "Conta corrente cadastrada com sucesso!"
        );
      }
      form.resetFields();
    } catch (error) {
      showNotification(
        "error",
        "Dados Bancários",
        "Erro ao salvar conta corrente!"
      );
    }
  };

  const handleEditContaCorrente = (contaCorrente) => {
    setEditingContaCorrente(contaCorrente);
    form.setFieldsValue({
      banco: contaCorrente.bancoCodigo, // Mapear bancoCodigo de volta para banco
      agencia: contaCorrente.agencia,
      agenciaDigito: contaCorrente.agenciaDigito,
      contaCorrente: contaCorrente.contaCorrente,
      contaCorrenteDigito: contaCorrente.contaCorrenteDigito,
    });
  };

  const handleDeleteContaCorrente = (id) => {
    confirm({
      title: "Confirmação de Exclusão",
      content: "Você tem certeza que deseja excluir esta conta corrente? Essa ação é irreversível.",
      okText: "Sim, excluir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axiosInstance.delete(`${API_URL.contaCorrente}/${id}`);
          setContaCorrenteRecords(prev => prev.filter(item => item.id !== id));
          if (editingContaCorrente && editingContaCorrente.id === id) {
            setEditingContaCorrente(null);
            form.resetFields();
          }
          showNotification(
            "success",
            "Dados Bancários",
            "Conta corrente excluída com sucesso!"
          );
        } catch (error) {
          showNotification(
            "error",
            "Dados Bancários",
            "Erro ao excluir conta corrente!"
          );
        }
      },
    });
  };

  const onFinishAPICredentials = async (values) => {
    try {
      // Mapear dados para o backend
      const dadosFormatados = {
        banco: values.banco,
        contaCorrenteId: values.contaCorrente,
        modalidadeApi: values.modalidadeApi,
        developerAppKey: values.developerAppKey,
        clienteId: values.clienteId,
        clienteSecret: values.clienteSecret,
      };

      if (editingCredential) {
        // Atualiza a credencial em edição
        const response = await axiosInstance.put(
          `${API_URL.credenciaisAPI}/${editingCredential.id}`,
          dadosFormatados
        );
        setCredenciaisRecords((prev) =>
          prev.map((item) =>
            item.id === editingCredential.id ? response.data : item
          )
        );
        setEditingCredential(null);
        showNotification(
          "success",
          "API",
          "Credenciais API atualizadas com sucesso!"
        );
      } else {
        // Verifica se já existe para a combinação banco + conta + modalidade
        const existente = credenciaisRecords.find(
          (item) =>
            item.banco === values.banco &&
            item.contaCorrenteId === values.contaCorrente &&
            item.modalidadeApi === values.modalidadeApi
        );
        if (existente) {
          const response = await axiosInstance.put(
            `${API_URL.credenciaisAPI}/${existente.id}`,
            dadosFormatados
          );
          setCredenciaisRecords((prev) =>
            prev.map((item) =>
              item.id === existente.id ? response.data : item
            )
          );
          showNotification(
            "success",
            "API",
            "Credenciais API atualizadas com sucesso!"
          );
        } else {
          const response = await axiosInstance.post(
            API_URL.credenciaisAPI,
            dadosFormatados
          );
          setCredenciaisRecords((prev) => [...prev, response.data]);
          showNotification(
            "success",
            "API",
            "Credenciais API cadastradas com sucesso!"
          );
        }
      }
      apiForm.resetFields();
    } catch (error) {
      showNotification("error", "API", "Erro ao salvar as Credenciais API");
    }
  };

  const handleEdit = (credential) => {
    setEditingCredential(credential);
    apiForm.setFieldsValue({
      banco: credential.banco,
      contaCorrente: credential.contaCorrenteId,
      modalidadeApi: credential.modalidadeApi,
      developerAppKey: credential.developerAppKey,
      clienteId: credential.clienteId,
      clienteSecret: credential.clienteSecret,
    });
  };

  const handleDelete = (id) => {
    confirm({
      title: "Confirmação de Exclusão",
      content: "Você tem certeza que deseja excluir esta credencial API?",
      okText: "Sim, excluir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await axiosInstance.delete(`${API_URL.credenciaisAPI}/${id}`);
          setCredenciaisRecords(prev => prev.filter(item => item.id !== id));
          if (editingCredential && editingCredential.id === id) {
            setEditingCredential(null);
            apiForm.resetFields();
          }
          showNotification(
            "success",
            "API",
            "Credencial API excluída com sucesso!"
          );
        } catch (error) {
          showNotification("error", "API", "Erro ao excluir a Credencial API");
        }
      },
      onCancel() {
        message.info("Exclusão cancelada.");
      },
    });
  };

  // Funções para Convênios
  const handleMultaChange = (checked) => {
    setMultaAtiva(checked);
    conveniosForm.setFieldsValue({ multa_ativa: checked });
    if (!checked) {
      conveniosForm.setFieldsValue({
        valor_multa: null,
        carencia_multa: null,
      });
    }
  };

  const handleLayoutBoletoChange = (checked) => {
    setLayoutBoletoFundoBranco(checked);
    conveniosForm.setFieldsValue({ layout_boleto_fundo_branco: checked });

    if (checked) {
      showNotification(
        "success",
        "Layout do Boleto",
        "Fundo branco ativado para boletos, salve as alterações!"
      );
    } else {
      showNotification(
        "success", 
        "Layout do Boleto",
        "Fundo verde ativado para boletos, salve as alterações!"
      );
    }
  };

  const onFinishConvenios = async (values) => {
    setLoadingConvenios(true);
    try {
      // Mapear campos do frontend para o backend
      const dataToSend = {
        contaCorrenteId: values.conta_corrente,
        juros: values.juros,
        diasAberto: values.dias_aberto,
        multaAtiva: values.multa_ativa || false,
        layoutBoletoFundoBranco: values.layout_boleto_fundo_branco || false,
        valorMulta: values.valor_multa || null,
        carenciaMulta: values.carencia_multa || null,
        convenio: values.convenio,
        carteira: values.carteira,
        variacao: values.variacao,
      };
      await axiosInstance.post(API_URL.convenios, dataToSend);
      showNotification(
        "success",
        "Sucesso",
        "Convênio de cobrança salvo com sucesso!"
      );
    } catch (error) {
      const msg = error.response?.data?.message || "Erro ao salvar convênio de cobrança.";
      showNotification(
        "error",
        "Erro",
        Array.isArray(msg) ? msg.join(", ") : msg
      );
    } finally {
      setLoadingConvenios(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Dados Bancários
      </Title>

      {/* Container Conta Corrente - Dividido em duas metades */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          Conta Corrente
        </Title>
        
        <Row gutter={[24, 0]}>
          {/* Metade Esquerda - Formulário */}
          <Col xs={24} lg={12}>
            <Card type="inner" title="Formulário de Conta Corrente" style={{ minHeight: '500px' }}>
              <Form layout="vertical" onFinish={onFinishContaCorrente} form={form}>
                                 {/* Banco - Select simplificado */}
                 <Form.Item
                   name="banco"
                   label={
                     <Text strong>
                       <BankOutlined style={{ marginRight: 8 }} />
                       Banco
                     </Text>
                   }
                   rules={[
                     { required: true, message: "Selecione o banco" },
                   ]}
                 >
                   <Select size="large" placeholder="Selecione o banco">
                     {getBancosOptions().map(banco => (
                       <Option key={banco.value} value={banco.value}>
                         {banco.label}
                       </Option>
                     ))}
                   </Select>
                 </Form.Item>

                <Row gutter={[16, 16]}>
                  {/* Agência */}
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="agencia"
                      label={
                        <Text strong>
                          <ShopOutlined style={{ marginRight: 8 }} />
                          Agência
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Informe o número da agência",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="Ex: 1234" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="agenciaDigito"
                      label={
                        <Text strong>
                          <NumberOutlined style={{ marginRight: 8 }} />
                          Dígito Agência
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Informe o dígito da agência",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="Ex: 0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  {/* Conta Corrente */}
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="contaCorrente"
                      label={
                        <Text strong>
                          <ContainerOutlined style={{ marginRight: 8 }} />
                          Conta Corrente
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Informe o número da conta corrente",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="Ex: 987654" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="contaCorrenteDigito"
                      label={
                        <Text strong>
                          <NumberOutlined style={{ marginRight: 8 }} />
                          Dígito Conta
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Informe o dígito da conta",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="Ex: 1" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" size="large" block>
                    {editingContaCorrente ? "Atualizar Conta Corrente" : "Cadastrar Conta Corrente"}
                  </Button>
                  {editingContaCorrente && (
                    <Button 
                      style={{ marginTop: 8 }} 
                      size="large" 
                      block 
                      onClick={() => {
                        setEditingContaCorrente(null);
                        form.resetFields();
                      }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </Form.Item>
              </Form>
            </Card>
          </Col>

                     {/* Metade Direita - Listagem */}
           <Col xs={24} lg={12}>
             <Card type="inner" title="Contas Correntes Cadastradas" style={{ minHeight: '500px' }}>
               <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                 <List
                   itemLayout="vertical"
                   dataSource={contaCorrenteRecords}
                   renderItem={(conta) => (
                  <List.Item
                    key={conta.id}
                    actions={[
                      <Button
                        type="text"
                        icon={<EditOutlined style={{ color: 'blue' }}/>}
                        onClick={() => handleEditContaCorrente(conta)}
                      >
                        Editar
                      </Button>,
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteContaCorrente(conta.id)}
                      >
                        Excluir
                      </Button>,
                    ]}
                  >
                                         <List.Item.Meta
                       title={getBancoDisplay(conta.bancoCodigo)}
                      description={
                        <>
                          <Text strong>Agência:</Text> {conta.agencia}-{conta.agenciaDigito} <br />
                          <Text strong>Conta Corrente:</Text> {conta.contaCorrente}-{conta.contaCorrenteDigito} <br />
                          <Text strong>Data de Cadastro:</Text>{" "}
                          {conta.createdAt ? new Date(conta.createdAt).toLocaleDateString('pt-BR') : "-"}
                        </>
                      }
                    />
                  </List.Item>
                                   )}
                 />
                 {contaCorrenteRecords.length === 0 && (
                   <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                     Nenhuma conta corrente cadastrada
                   </div>
                 )}
               </div>
             </Card>
           </Col>
        </Row>
      </Card>

      {/* Container Credenciais API - Dividido em duas metades */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          Credenciais API
        </Title>
        
                 <Row gutter={[24, 0]}>
           {/* Metade Esquerda - Formulário */}
           <Col xs={24} lg={12}>
             <Card type="inner" title="Formulário de Credenciais API" style={{ minHeight: '600px' }}>
              <Form layout="vertical" onFinish={onFinishAPICredentials} form={apiForm}>
                {/* Banco e Conta Corrente - Lado a lado */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                     <Col xs={24} sm={12}>
                     <Form.Item
                       name="banco"
                       label={
                         <Text strong>
                           <BankOutlined style={{ marginRight: 8 }} />
                           Banco
                         </Text>
                       }
                       rules={[{ required: true, message: "Selecione o banco" }]}
                     >
                       <Select size="large" placeholder="Selecione o banco">
                         {getBancosOptions().map(banco => (
                           <Option key={banco.value} value={banco.value}>
                             {banco.label}
                           </Option>
                         ))}
                       </Select>
                     </Form.Item>
                   </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="contaCorrente"
                      label={
                        <Text strong>
                          <ContainerOutlined style={{ marginRight: 8 }} />
                          Conta Corrente
                        </Text>
                      }
                      rules={[{ required: true, message: "Selecione a conta corrente" }]}
                    >
                      <Select size="large" placeholder="Selecione a conta corrente">
                        {contaCorrenteRecords.map((conta) => (
                          <Option key={conta.id} value={conta.id}>
                            {getBancoDisplay(conta.bancoCodigo)} - Ag: {conta.agencia}-{conta.agenciaDigito} CC: {conta.contaCorrente}-{conta.contaCorrenteDigito}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Modalidade API e Developer Application Key - Lado a lado */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="modalidadeApi"
                      label={
                        <Text strong>
                          <AppstoreOutlined style={{ marginRight: 8 }} />
                          Modalidade API
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Selecione a modalidade API",
                        },
                      ]}
                    >
                      <Select size="large" placeholder="Selecione a modalidade API">
                        <Option value="001 - Cobrança">001 - Cobrança</Option>
                        <Option value="002 - Pix">002 - PIX</Option>
                        <Option value="003 - Extratos">003 - Extratos</Option>
                        <Option value="004 - Pagamentos">004 - Pagamentos</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="developerAppKey"
                      label={
                        <Text strong>
                          <KeyOutlined style={{ marginRight: 8 }} />
                          Developer Application Key
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Informe a Developer Application Key",
                        },
                      ]}
                    >
                      <Input size="large" placeholder="Ex: chave123" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Cliente ID - Linha única */}
                <Form.Item
                  name="clienteId"
                  label={
                    <Text strong>
                      <UserOutlined style={{ marginRight: 8 }} />
                      Cliente ID
                    </Text>
                  }
                  rules={[{ required: true, message: "Informe o Cliente ID" }]}
                >
                  <Input size="large" placeholder="Ex: cliente001" />
                </Form.Item>

                {/* Cliente Secret - Linha única */}
                <Form.Item
                  name="clienteSecret"
                  label={
                    <Text strong>
                      <LockOutlined style={{ marginRight: 8 }} />
                      Cliente Secret
                    </Text>
                  }
                  rules={[
                    { required: true, message: "Informe o Cliente Secret" },
                  ]}
                >
                  <Input size="large" placeholder="Ex: secret001" />
                </Form.Item>

                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" size="large" block>
                    {editingCredential ? "Atualizar Credenciais API" : "Cadastrar Credenciais API"}
                  </Button>
                  {editingCredential && (
                    <Button 
                      style={{ marginTop: 8 }} 
                      size="large" 
                      block 
                      onClick={() => {
                        setEditingCredential(null);
                        apiForm.resetFields();
                      }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </Form.Item>
              </Form>
            </Card>
          </Col>

                     {/* Metade Direita - Listagem */}
           <Col xs={24} lg={12}>
             <Card type="inner" title="Credenciais API Cadastradas" style={{ minHeight: '600px' }}>
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                <List
                  itemLayout="vertical"
                  dataSource={credenciaisRecords}
                  renderItem={(item) => {
                    // Encontrar a conta corrente correspondente
                    const contaCorrelata = contaCorrenteRecords.find(conta => conta.id === item.contaCorrenteId);
                    const contaDisplay = contaCorrelata 
                      ? `Ag: ${contaCorrelata.agencia}-${contaCorrelata.agenciaDigito} CC: ${contaCorrelata.contaCorrente}-${contaCorrelata.contaCorrenteDigito}`
                      : 'Conta não encontrada';

                    return (
                      <List.Item
                        key={item.id}
                        actions={[
                          <Button
                            type="text"
                            icon={<EditOutlined style={{ color: 'blue' }}/>}
                            onClick={() => handleEdit(item)}
                          >
                            Editar
                          </Button>,
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(item.id)}
                          >
                            Excluir
                          </Button>,
                        ]}
                      >
                                                 <List.Item.Meta
                           title={`${getBancoDisplay(item.banco)} - ${item.modalidadeApi}`}
                           description={
                             <>
                               <Text strong>Banco:</Text> {getBancoDisplay(item.banco)} <br />
                               <Text strong>Conta:</Text> {contaDisplay} <br />
                               <Text strong>Modalidade:</Text> {item.modalidadeApi}
                             </>
                           }
                        />
                      </List.Item>
                    );
                  }}
                />
                {credenciaisRecords.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    Nenhuma credencial API cadastrada
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Container Convênios */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          Convênios
        </Title>

        <Form
          form={conveniosForm}
          layout="vertical"
          onFinish={onFinishConvenios}
        >
          {/* Subcontainer: Cobrança */}
          <Card type="inner" title="Cobrança">
            <Row gutter={[16, 16]} align="top">
              {/* Conta Corrente */}
              <Col xs={24} sm={6}>
                <Form.Item
                  name="conta_corrente"
                  label={
                    <Text strong>
                      <ContainerOutlined style={{ marginRight: 8 }} />
                      Conta Corrente
                    </Text>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Selecione a conta corrente",
                    },
                  ]}
                >
                  <Select size="large" placeholder="Selecione a conta corrente">
                    {contaCorrenteRecords.map((conta) => (
                      <Option key={conta.id} value={conta.id}>
                        {getBancoDisplay(conta.bancoCodigo)} - Ag: {conta.agencia}-{conta.agenciaDigito} CC: {conta.contaCorrente}-{conta.contaCorrenteDigito}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {/* Juros */}
              <Col xs={24} sm={4}>
                <Form.Item
                  name="juros"
                  label={
                    <Text strong>
                      <PercentageOutlined style={{ marginRight: 8 }} />
                      Juros (% ao mês)
                    </Text>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Informe o percentual de juros",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    placeholder="0,00"
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace("%", "")}
                    size="large"
                  />
                </Form.Item>
              </Col>
              {/* Dias em Aberto */}
              <Col xs={24} sm={4}>
                <Form.Item
                  name="dias_aberto"
                  label={
                    <Text strong>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      Dias em Aberto
                    </Text>
                  }
                  rules={[
                    { required: true, message: "Informe os dias em aberto" },
                  ]}
                >
                  <InputNumber min={1} max={365} placeholder="30" size="large" />
                </Form.Item>
              </Col>
              {/* Multa (Switch) */}
              <Col xs={24} sm={3}>
                <StyledSwitchContainer>
                  <Form.Item
                    name="multa_ativa"
                    label={
                      <Text strong>
                        <WarningOutlined style={{ marginRight: 8 }} />
                        Multa
                      </Text>
                    }
                    valuePropName="checked"
                  >
                    <div className="switch-wrapper">
                      <Switch
                        checked={multaAtiva}
                        onChange={handleMultaChange}
                      />
                    </div>
                  </Form.Item>
                </StyledSwitchContainer>
              </Col>
              {/* Layout Boleto (Switch) */}
              <Col xs={24} sm={7}>
                <StyledSwitchContainer>
                  <Form.Item
                    name="layout_boleto_fundo_branco"
                    label={
                      <Text strong>
                        <FileTextOutlined style={{ marginRight: 8 }} />
                        Layout Boleto
                      </Text>
                    }
                    valuePropName="checked"
                  >
                    <div className="switch-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Switch
                        checked={layoutBoletoFundoBranco}
                        onChange={handleLayoutBoletoChange}
                      />
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        {layoutBoletoFundoBranco ? 'Fundo branco - Clique para ativar fundo azul.' : 'Fundo azul - Clique para ativar fundo branco.'}
                      </Text>
                    </div>
                  </Form.Item>
                </StyledSwitchContainer>
              </Col>
              {/* Se a multa estiver ativa, exibe os campos Valor Multa e Carência na mesma linha */}
              {multaAtiva && (
                <>
                  <Col xs={24} sm={4}>
                    <Form.Item
                      name="valor_multa"
                      label={
                        <Text strong>
                          <PercentageOutlined style={{ marginRight: 8 }} />
                          Valor Multa (% ao mês)
                        </Text>
                      }
                      rules={[
                        { required: true, message: "Informe o valor da multa" },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        placeholder="0,00"
                        formatter={(value) => `${value}%`}
                        parser={(value) => value.replace("%", "")}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item
                      name="carencia_multa"
                      label={
                        <Text strong>
                          <CalendarOutlined style={{ marginRight: 8 }} />
                          Carência (dias)
                        </Text>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Informe os dias de carência",
                        },
                      ]}
                    >
                      <InputNumber min={0} max={30} placeholder="0" size="large" />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>

            {/* Linha 2: Convênio, Carteira e Variação */}
            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="convenio"
                  label={
                    <Text strong>
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      Convênio
                    </Text>
                  }
                  rules={[{ required: true, message: "Informe o convênio" }]}
                >
                  <Input size="large" placeholder="Ex: Convênio XYZ" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="carteira"
                  label={
                    <Text strong>
                      <CreditCardOutlined style={{ marginRight: 8 }} />
                      Carteira
                    </Text>
                  }
                  rules={[{ required: true, message: "Informe a carteira" }]}
                >
                  <Input size="large" placeholder="Ex: 123" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="variacao"
                  label={
                    <Text strong>
                      <RiseOutlined style={{ marginRight: 8 }} />
                      Variação
                    </Text>
                  }
                  rules={[{ required: true, message: "Informe a variação" }]}
                >
                  <Input size="large" placeholder="Ex: 001" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

                     <Form.Item style={{ marginTop: 16 }}>
             <Button
               type="primary"
               htmlType="submit"
               size="large"
               loading={loadingConvenios}
             >
               Salvar Convênio de Cobrança
             </Button>
           </Form.Item>
        </Form>
      </Card>
     </div>
   );
 };
 
 export default DadosBancarios;
