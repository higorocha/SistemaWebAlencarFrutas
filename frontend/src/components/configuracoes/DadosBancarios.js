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
  message,
  Tooltip,
  Switch,
  InputNumber,
  Space,
  Divider,
  Alert,
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
  FormOutlined,
  UnorderedListOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig"; // substituindo axios por axiosInstance
import { showNotification } from "config/notificationConfig";
import { getBancoDisplay, getBancosOptions } from "../../utils/bancosUtils";
import styled from "styled-components";
import { PrimaryButton } from "../common/buttons";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";

const { Title, Text } = Typography;
const { Option } = Select;

// Styled components para aplicar o estilo do sistema
const PageContainer = styled.div`
  padding: 16px;
`;

const SectionContainer = styled.div`
  border: 1px solid #e8f5e8;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 24px;
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

const StyledList = styled(List)`
  .ant-list-item {
    border: 1px solid #e8f5e8 !important;
    border-radius: 12px !important;
    margin-bottom: 12px !important;
    padding: 16px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;

    &:hover {
      border-color: #10b981 !important;
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.1) !important;
      transform: translateY(-2px) !important;
    }

    .ant-list-item-meta-title {
      color: #059669 !important;
      font-weight: 600 !important;
    }

    .ant-list-item-meta-description {
      color: #666 !important;
    }

    .ant-list-item-action {
      .ant-btn {
        border-radius: 8px !important;
        transition: all 0.3s ease !important;

        &:hover {
          transform: translateY(-1px) !important;
        }
      }
    }
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
  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState(null);
  const [convenioExiste, setConvenioExiste] = useState(false);
  const [loadingConvenios, setLoadingConvenios] = useState(false);

  // Contas disponíveis para cadastrar convênio:
  // regra: só permitir selecionar contas que já tenham credenciais "001 - Cobrança"
  const contasComCredenciaisCobranca = contaCorrenteRecords.filter((conta) =>
    credenciaisRecords.some(
      (cred) =>
        cred.contaCorrenteId === conta.id &&
        cred.banco === "001" &&
        cred.modalidadeApi === "001 - Cobrança"
    )
  );

  // Estados para modais de exclusão
  const [deleteContaCorrenteModalOpen, setDeleteContaCorrenteModalOpen] = useState(false);
  const [contaCorrenteToDelete, setContaCorrenteToDelete] = useState(null);
  const [deleteCredencialModalOpen, setDeleteCredencialModalOpen] = useState(false);
  const [credencialToDelete, setCredencialToDelete] = useState(null);

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
      // Sempre seta o array, mesmo que vazio (para garantir que o estado está atualizado)
      setCredenciaisRecords(response.data || []);
    } catch (error) {
      message.error("Erro ao carregar as Credenciais API");
      setCredenciaisRecords([]); // Em caso de erro, seta como array vazio
    }
  };

  useEffect(() => {
    loadContaCorrente();
    loadCredenciais();
  }, []);

  // Carregar dados dos convênios por conta corrente
  useEffect(() => {
    const carregarConvenios = async () => {
      // Se não selecionou conta corrente, limpa o formulário
      if (!selectedContaCorrenteId) {
        conveniosForm.resetFields();
        setMultaAtiva(false);
        setLayoutBoletoFundoBranco(false);
        setConvenioExiste(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`${API_URL.convenios}?contaCorrenteId=${selectedContaCorrenteId}`);
        if (response.data) {
          // Mapear campos do backend para o frontend
          const dadosConvenio = {
            conta_corrente: response.data.contaCorrenteId,
            juros: response.data.juros,
            dias_aberto: response.data.diasAberto,
            multa_ativa: response.data.multaAtiva || false,
            layout_boleto_fundo_branco: response.data.boletoPix || false,
            valor_multa: response.data.valorMulta,
            carencia_multa: response.data.carenciaMulta,
            convenio: response.data.convenio,
            carteira: response.data.carteira,
            variacao: response.data.variacao,
            chave_pix: response.data.chavePix || null,
          };

          conveniosForm.setFieldsValue(dadosConvenio);
          setMultaAtiva(response.data.multaAtiva || false);
          setLayoutBoletoFundoBranco(response.data.boletoPix || false);
          setConvenioExiste(true);
        } else {
          // Não há convênio para esta conta - limpa todos os campos
          conveniosForm.setFieldsValue({
            conta_corrente: selectedContaCorrenteId,
            juros: undefined,
            dias_aberto: undefined,
            multa_ativa: false,
            layout_boleto_fundo_branco: false,
            valor_multa: undefined,
            carencia_multa: undefined,
            convenio: undefined,
            carteira: undefined,
            variacao: undefined,
            chave_pix: undefined,
          });
          setMultaAtiva(false);
          setLayoutBoletoFundoBranco(false);
          setConvenioExiste(false);
        }
      } catch (error) {
        // Se for 404, é porque não existe convênio para esta conta - limpa o formulário
        if (error.response?.status === 404) {
          // Limpa todos os campos mas mantém a conta corrente selecionada
          conveniosForm.setFieldsValue({
            conta_corrente: selectedContaCorrenteId,
            juros: undefined,
            dias_aberto: undefined,
            multa_ativa: false,
            layout_boleto_fundo_branco: false,
            valor_multa: undefined,
            carencia_multa: undefined,
            convenio: undefined,
            carteira: undefined,
            variacao: undefined,
            chave_pix: undefined,
          });
          setMultaAtiva(false);
          setLayoutBoletoFundoBranco(false);
          setConvenioExiste(false);
        } else {
          // Para outros erros, também limpa mas mantém a conta
          conveniosForm.setFieldsValue({
            conta_corrente: selectedContaCorrenteId,
            juros: undefined,
            dias_aberto: undefined,
            multa_ativa: false,
            layout_boleto_fundo_branco: false,
            valor_multa: undefined,
            carencia_multa: undefined,
            convenio: undefined,
            carteira: undefined,
            variacao: undefined,
            chave_pix: undefined,
          });
          setMultaAtiva(false);
          setLayoutBoletoFundoBranco(false);
          setConvenioExiste(false);
        }
      }
    };

    carregarConvenios();
  }, [selectedContaCorrenteId]);

  // Verifica se a conta corrente em edição tem credenciais de extrato
  const temCredenciaisExtrato = () => {
    if (!editingContaCorrente || !editingContaCorrente.credenciaisAPI) {
      return false;
    }
    return editingContaCorrente.credenciaisAPI.some(
      (cred) => cred.modalidadeApi === "003 - Extratos"
    );
  };

  const onFinishContaCorrente = async (values) => {
    try {
      
      // Mapear "conta_banco" para "bancoCodigo" para o backend
      const dadosFormatados = {
        bancoCodigo: values.conta_banco,
        agencia: values.agencia,
        agenciaDigito: values.agenciaDigito,
        contaCorrente: values.contaCorrente,
        contaCorrenteDigito: values.contaCorrenteDigito,
        // Tratar numeroContratoPagamento: remover espaços e converter para null se vazio
        numeroContratoPagamento: values.numeroContratoPagamento && String(values.numeroContratoPagamento).trim() !== '' 
          ? String(values.numeroContratoPagamento).trim() 
          : null,
      };

      // Sempre enviar campos de monitoramento quando estiver editando
      // Se os campos aparecem no formulário, é porque a conta tem credenciais de extrato
      if (editingContaCorrente && editingContaCorrente.id) {
        // Usar o valor do formulário diretamente - Boolean() garante true/false
        dadosFormatados.monitorar = Boolean(values.monitorar);
        // Enviar intervalo se foi preenchido
        if (values.intervalo !== undefined && values.intervalo !== null && values.intervalo !== '') {
          dadosFormatados.intervalo = Number(values.intervalo);
        }
      }

      if (editingContaCorrente && editingContaCorrente.id) {
        // Atualiza o registro via PUT
        await axiosInstance.put(
          `${API_URL.contaCorrente}/${editingContaCorrente.id}`,
          dadosFormatados
        );
        
        // Recarrega os dados para garantir que venham com relacionamentos atualizados
        await loadContaCorrente();
        
        setEditingContaCorrente(null);
        showNotification(
          "success",
          "Dados Bancários",
          "Conta corrente atualizada com sucesso!"
        );
      } else {
        // Cria um novo registro via POST
        await axiosInstance.post(
          API_URL.contaCorrente,
          dadosFormatados
        );
        
        // Recarrega os dados para garantir que venham com relacionamentos atualizados
        await loadContaCorrente();
        
        showNotification(
          "success",
          "Dados Bancários",
          "Conta corrente cadastrada com sucesso!"
        );
      }
      form.resetFields();
    } catch (error) {
      console.error('❌ Erro ao salvar conta corrente:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = "Erro ao salvar conta corrente!";
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showNotification(
        "error",
        "❌ Erro nos Dados Bancários",
        errorMessage
      );
    }
  };

  const handleEditContaCorrente = (conta) => {
    setEditingContaCorrente(conta);
    setSelectedContaCorrenteId(conta.id);
    form.setFieldsValue({
      conta_banco: conta.bancoCodigo,
      agencia: conta.agencia,
      agenciaDigito: conta.agenciaDigito,
      contaCorrente: conta.contaCorrente,
      contaCorrenteDigito: conta.contaCorrenteDigito,
      numeroContratoPagamento: conta.numeroContratoPagamento || undefined,
      monitorar: Boolean(conta.monitorar),
      intervalo: conta.intervalo || undefined,
    });
  };

  const handleDeleteContaCorrente = (id) => {
    setContaCorrenteToDelete(id);
    setDeleteContaCorrenteModalOpen(true);
  };

  const confirmDeleteContaCorrente = async () => {
    if (!contaCorrenteToDelete) return;
    
    try {
      await axiosInstance.delete(`${API_URL.contaCorrente}/${contaCorrenteToDelete}`);
      setContaCorrenteRecords(prev => prev.filter(item => item.id !== contaCorrenteToDelete));
      if (editingContaCorrente && editingContaCorrente.id === contaCorrenteToDelete) {
        setEditingContaCorrente(null);
        form.resetFields();
      }
      showNotification(
        "success",
        "Dados Bancários",
        "Conta corrente excluída com sucesso!"
      );
      setDeleteContaCorrenteModalOpen(false);
      setContaCorrenteToDelete(null);
    } catch (error) {
      console.error('❌ Erro ao excluir conta corrente:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = "Erro ao excluir conta corrente!";
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showNotification(
        "error",
        "❌ Erro ao Excluir Conta Corrente",
        errorMessage
      );
    }
  };

  const onFinishAPICredentials = async (values) => {
    try {
      // IMPORTANTE (ajuste de regra):
      // Para cadastrar convênio, a conta deve ter credenciais "001 - Cobrança".
      // Portanto, aqui não exigimos convênio prévio para salvar credenciais.

      // Mapear dados para o backend
      const dadosFormatados = {
        banco: values.api_banco,
        contaCorrenteId: values.api_contaCorrente,
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
            item.banco === values.api_banco &&
            item.contaCorrenteId === values.api_contaCorrente &&
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
      console.error('❌ Erro ao salvar credenciais API:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = "Erro ao salvar as Credenciais API!";
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showNotification(
        "error",
        "❌ Erro nas Credenciais API",
        errorMessage
      );
    }
  };

  const handleEdit = (credential) => {
    setEditingCredential(credential);
    apiForm.setFieldsValue({
      api_banco: credential.banco,
      api_contaCorrente: credential.contaCorrenteId,
      modalidadeApi: credential.modalidadeApi,
      developerAppKey: credential.developerAppKey,
      clienteId: credential.clienteId,
      clienteSecret: credential.clienteSecret,
    });
  };

  const handleDelete = (id) => {
    setCredencialToDelete(id);
    setDeleteCredencialModalOpen(true);
  };

  const confirmDeleteCredencial = async () => {
    if (!credencialToDelete) return;
    
    try {
      await axiosInstance.delete(`${API_URL.credenciaisAPI}/${credencialToDelete}`);
      setCredenciaisRecords(prev => prev.filter(item => item.id !== credencialToDelete));
      if (editingCredential && editingCredential.id === credencialToDelete) {
        setEditingCredential(null);
        apiForm.resetFields();
      }
      showNotification(
        "success",
        "API",
        "Credencial API excluída com sucesso!"
      );
      setDeleteCredencialModalOpen(false);
      setCredencialToDelete(null);
    } catch (error) {
      console.error('❌ Erro ao excluir credencial API:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = "Erro ao excluir a Credencial API!";
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showNotification(
        "error",
        "❌ Erro nas Credenciais API",
        errorMessage
      );
    }
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
    // Não mostra notificação - salva apenas quando clicar no botão "Salvar"
  };

  const podeExcluirConvenio = (contaCorrenteId) => {
    if (!contaCorrenteId) {
      return false;
    }
    
    // Verificar se tem credenciais de API do tipo "001 - Cobrança" cadastradas para esta conta corrente
    const temCredenciaisCobranca = credenciaisRecords.some(
      (cred) => cred.contaCorrenteId === contaCorrenteId && cred.modalidadeApi === "001 - Cobrança"
    );
    
    // Pode excluir se NÃO tem credenciais de cobrança
    return !temCredenciaisCobranca;
  };

  const handleDeleteConvenio = async () => {
    if (!selectedContaCorrenteId) return;

    // Verificar se pode excluir (não tem credenciais de API)
    if (!podeExcluirConvenio(selectedContaCorrenteId)) {
      showNotification(
        "error",
        "Não é possível excluir",
        "Não é possível excluir o convênio porque existem credenciais de API cadastradas para esta conta corrente."
      );
      return;
    }

    try {
      await axiosInstance.delete(`${API_URL.convenios}?contaCorrenteId=${selectedContaCorrenteId}`);
      showNotification(
        "success",
        "Convênios",
        "Convênio de cobrança excluído com sucesso!"
      );
      // Limpar formulário e estado após exclusão
      conveniosForm.resetFields();
      setMultaAtiva(false);
      setLayoutBoletoFundoBranco(false);
      setConvenioExiste(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erro ao excluir convênio";
      showNotification(
        "error",
        "Erro ao Excluir Convênio",
        errorMessage
      );
    }
  };

  const onFinishConvenios = async (values) => {
    setLoadingConvenios(true);
    try {
      // Validação de segurança: só permitir cadastrar convênio se a conta tiver credenciais de cobrança
      const temCredenciaisCobranca = credenciaisRecords.some(
        (cred) =>
          cred.contaCorrenteId === values.conta_corrente &&
          cred.banco === "001" &&
          cred.modalidadeApi === "001 - Cobrança"
      );
      if (!temCredenciaisCobranca) {
        showNotification(
          "error",
          "Credenciais obrigatórias",
          "Para cadastrar um convênio, primeiro cadastre as Credenciais API (modalidade '001 - Cobrança') para esta conta corrente."
        );
        return;
      }

      // Mapear campos do frontend para o backend
      const dataToSend = {
        contaCorrenteId: values.conta_corrente,
        juros: values.juros,
        diasAberto: values.dias_aberto,
        multaAtiva: values.multa_ativa || false,
        boletoPix: values.layout_boleto_fundo_branco || false,
        valorMulta: values.valor_multa || null,
        carenciaMulta: values.carencia_multa || null,
        convenio: values.convenio,
        carteira: values.carteira,
        variacao: values.variacao,
        chavePix: values.chave_pix || null,
      };
      await axiosInstance.post(API_URL.convenios, dataToSend);
      showNotification(
        "success",
        "Sucesso",
        "Convênio de cobrança salvo com sucesso!"
      );
      // Atualizar estado após salvar
      setSelectedContaCorrenteId(values.conta_corrente);
      setConvenioExiste(true);
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
    <PageContainer>
      <Title level={2} style={{ color: "#059669", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <BankOutlined />
        Dados Bancários
      </Title>

      {/* Container Conta Corrente - Dividido em duas metades */}
      <StyledCard
        title={
          <Space>
            <ContainerOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Conta Corrente</span>
          </Space>
        }
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          }
        }}
        style={{ marginBottom: 24 }}
      >
        
        <Row gutter={[24, 0]}>
          {/* Metade Esquerda - Formulário */}
          <Col xs={24} lg={12}>
            <StyledCard type="inner" style={{ height: "600px" }}>
              <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "0" }}>
                <FormOutlined style={{ marginRight: 8 }} />
                Formulário de Conta Corrente
              </Title>
              <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
              <StyledForm layout="vertical" onFinish={onFinishContaCorrente} form={form}>
                                 {/* Banco - Select simplificado */}
                 <Form.Item
                   name="conta_banco"
                   label={
                     <Text strong>
                       <BankOutlined style={{ marginRight: 8 }} />
                       Banco
                     </Text>
                   }
                   rules={[
                     { required: true, message: "⚠️ Seleção do banco é obrigatória" },
                   ]}
                 >
                   <Select size="large" placeholder="Selecione o banco">
                     <Option key="001" value="001">
                       001 - Banco do Brasil
                     </Option>
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
                          message: "⚠️ Número da agência é obrigatório",
                        },
                        {
                          max: 10,
                          message: "⚠️ Agência deve ter no máximo 10 caracteres",
                        },
                        {
                          pattern: /^[0-9]+$/,
                          message: "⚠️ Agência deve conter apenas números",
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
                          message: "⚠️ Dígito da agência é obrigatório",
                        },
                        {
                          max: 2,
                          message: "⚠️ Dígito da agência deve ter no máximo 2 caracteres",
                        },
                        {
                          pattern: /^[0-9]+$/,
                          message: "⚠️ Dígito da agência deve conter apenas números",
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
                          message: "⚠️ Número da conta corrente é obrigatório",
                        },
                        {
                          max: 20,
                          message: "⚠️ Conta corrente deve ter no máximo 20 caracteres",
                        },
                        {
                          pattern: /^[0-9]+$/,
                          message: "⚠️ Conta corrente deve conter apenas números",
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
                          message: "⚠️ Dígito da conta corrente é obrigatório",
                        },
                        {
                          max: 2,
                          message: "⚠️ Dígito da conta deve ter no máximo 2 caracteres",
                        },
                        {
                          pattern: /^[0-9Xx]+$/,
                          message: "⚠️ Dígito da conta deve conter apenas números ou X",
                        },
                      ]}
                      normalize={(value) => value ? value.toUpperCase() : value}
                    >
                      <Input size="large" placeholder="Ex: 1 ou X" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Número do contrato de pagamentos (opcional) */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="numeroContratoPagamento"
                      label={
                        <Text strong>
                          <NumberOutlined style={{ marginRight: 8 }} />
                          Número do Contrato de Pagamentos (opcional)
                          <Tooltip 
                            title="Este campo é necessário para operações de pagamento. Sem essa configuração, a conta não aparecerá para seleção nas operações de pagamento."
                            placement="top"
                          >
                            <InfoCircleOutlined 
                              style={{ 
                                marginLeft: 8, 
                                color: "#059669", 
                                cursor: "help",
                                fontSize: "14px"
                              }} 
                            />
                          </Tooltip>
                        </Text>
                      }
                      rules={[
                        {
                          validator: (_, value) => {
                            // Se o campo estiver vazio, não validar (é opcional)
                            if (!value) {
                              return Promise.resolve();
                            }
                            
                            // Converter para string e remover espaços
                            const valueStr = String(value).trim();
                            
                            // Se após remover espaços estiver vazio, não validar
                            if (valueStr === '') {
                              return Promise.resolve();
                            }
                            
                            // Validar se contém apenas números
                            if (!/^[0-9]+$/.test(valueStr)) {
                              return Promise.reject(new Error('⚠️ Número do contrato deve conter apenas números'));
                            }
                            
                            // Validar comprimento máximo
                            if (valueStr.length > 10) {
                              return Promise.reject(new Error('⚠️ Número do contrato deve ter no máximo 10 dígitos'));
                            }
                            
                            return Promise.resolve();
                          },
                        },
                      ]}
                      normalize={(value) => {
                        // Converter para string e remover espaços em branco
                        if (value === null || value === undefined) {
                          return value;
                        }
                        return String(value).trim();
                      }}
                    >
                      <Input size="large" placeholder="Ex: 731030" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Campos de Monitoramento - Apenas na edição */}
                {editingContaCorrente && (
                  <>
                    <Divider style={{ margin: "24px 0 16px 0", borderColor: "#e8e8e8" }} />
                    <Title level={5} style={{ color: "#059669", marginBottom: "16px", marginTop: "0" }}>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      Configurações de Monitoramento
                    </Title>
                    
                    {!temCredenciaisExtrato() ? (
                      <Alert
                        message="Monitoramento Indisponível"
                        description="Para ativar o monitoramento automático, é necessário vincular credenciais de extrato (003 - Extratos) a esta conta corrente."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    ) : (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <StyledSwitchContainer>
                            <Form.Item
                              label={
                                <Text strong>
                                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                                  Monitorar Conta Automaticamente
                                </Text>
                              }
                            >
                              <div className="switch-wrapper">
                                <Form.Item
                                  name="monitorar"
                                  valuePropName="checked"
                                  noStyle
                                >
                                  <Switch />
                                </Form.Item>
                                <Text style={{ marginLeft: 12, fontSize: '12px', color: '#666' }}>
                                  Ative para monitorar esta conta automaticamente
                                </Text>
                              </div>
                            </Form.Item>
                          </StyledSwitchContainer>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="intervalo"
                            label={
                              <Text strong>
                                <ClockCircleOutlined style={{ marginRight: 8 }} />
                                Intervalo de Monitoramento (segundos)
                              </Text>
                            }
                            rules={[
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  const monitorar = getFieldValue('monitorar');
                                  if (monitorar && (!value || value <= 0)) {
                                    return Promise.reject(new Error('Intervalo é obrigatório e deve ser maior que 0 quando monitorar está ativo'));
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                          >
                            <InputNumber
                              min={1}
                              placeholder="Ex: 3600 (1 hora)"
                              size="large"
                              style={{ width: '100%' }}
                              formatter={(value) => value ? `${value} segundos` : ''}
                              parser={(value) => value.replace(' segundos', '').replace(/\D/g, '')}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  </>
                )}

                <Form.Item style={{ marginTop: 24 }}>
                  <PrimaryButton 
                    htmlType="submit" 
                    size="large" 
                    block
                  >
                    {editingContaCorrente ? "Atualizar Conta Corrente" : "Cadastrar Conta Corrente"}
                  </PrimaryButton>
                  {editingContaCorrente && (
                    <PrimaryButton 
                      style={{ marginTop: 12, backgroundColor: '#6b7280', borderColor: '#6b7280' }} 
                      size="large" 
                      block 
                      onClick={() => {
                        setEditingContaCorrente(null);
                        form.resetFields();
                      }}
                    >
                      Cancelar Edição
                    </PrimaryButton>
                  )}
                </Form.Item>
              </StyledForm>
            </StyledCard>
          </Col>

                     {/* Metade Direita - Listagem */}
           <Col xs={24} lg={12}>
             <StyledCard
               type="inner"
               style={{ height: "600px" }}
               styles={{
                 body: {
                   height: "100%",
                   display: "flex",
                   flexDirection: "column",
                 },
               }}
             >
               <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "0" }}>
                 <UnorderedListOutlined style={{ marginRight: 8 }} />
                 Contas Correntes Cadastradas
               </Title>
               <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
               <div
                 style={{
                   flex: 1,
                   minHeight: 0,
                   overflowY: "auto",
                   overflowX: "hidden",
                   paddingBottom: 16, // respiro no fim da lista
                   paddingRight: 6, // evita o scroll colar no conteúdo
                 }}
               >
                 <StyledList
                   itemLayout="vertical"
                   dataSource={contaCorrenteRecords}
                   renderItem={(conta) => (
                  <List.Item
                    key={conta.id}
                    actions={[
                      <PrimaryButton
                        icon={<EditOutlined />}
                        onClick={() => handleEditContaCorrente(conta)}
                        size="small"
                      >
                        Editar
                      </PrimaryButton>,
                      <PrimaryButton
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteContaCorrente(conta.id)}
                        size="small"
                        style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                      >
                        Excluir
                      </PrimaryButton>,
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
             </StyledCard>
           </Col>
        </Row>
        </StyledCard>

      {/* Container Credenciais API - Dividido em duas metades */}
      <StyledCard
        title={
          <Space>
            <KeyOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Credenciais API</span>
          </Space>
        }
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          }
        }}
        style={{ marginBottom: 24 }}
      >
        
                 <Row gutter={[24, 0]}>
           {/* Metade Esquerda - Formulário */}
           <Col xs={24} lg={12}>
             <StyledCard type="inner" style={{ height: "600px" }}>
               <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "0" }}>
                 <FormOutlined style={{ marginRight: 8 }} />
                 Formulário de Credenciais API
               </Title>
               <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
              <StyledForm layout="vertical" onFinish={onFinishAPICredentials} form={apiForm}>
                {/* Banco e Conta Corrente - Lado a lado */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                     <Col xs={24} sm={12}>
                     <Form.Item
                       name="api_banco"
                       label={
                         <Text strong>
                           <BankOutlined style={{ marginRight: 8 }} />
                           Banco
                         </Text>
                       }
                       rules={[{ required: true, message: "Selecione o banco" }]}
                     >
                       <Select size="large" placeholder="Selecione o banco">
                         <Option key="001" value="001">
                           001 - Banco do Brasil
                         </Option>
                       </Select>
                     </Form.Item>
                   </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="api_contaCorrente"
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
                          <Tooltip
                            placement="top"
                            title={
                              <div style={{ maxWidth: 340 }}>
                                <b>Dica:</b> para emitir boletos, selecione e cadastre as credenciais da modalidade <b>001 - Cobrança</b>.
                                <br />
                                <br />
                                Depois, vá na seção <b>Convênios</b> e cadastre o convênio de cobrança para a mesma conta.
                                <br />
                                <br />
                                Só após isso a conta ficará disponível para seleção na geração de boletos.
                              </div>
                            }
                          >
                            <InfoCircleOutlined
                              style={{
                                marginLeft: 8,
                                color: "#059669",
                                cursor: "help",
                                fontSize: "14px",
                              }}
                            />
                          </Tooltip>
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

                <Form.Item style={{ marginTop: 24 }}>
                  <PrimaryButton 
                    htmlType="submit" 
                    size="large" 
                    block
                  >
                    {editingCredential ? "Atualizar Credenciais API" : "Cadastrar Credenciais API"}
                  </PrimaryButton>
                  {editingCredential && (
                    <PrimaryButton 
                      style={{ marginTop: 12, backgroundColor: '#6b7280', borderColor: '#6b7280' }} 
                      size="large" 
                      block 
                      onClick={() => {
                        setEditingCredential(null);
                        apiForm.resetFields();
                      }}
                    >
                      Cancelar Edição
                    </PrimaryButton>
                  )}
                </Form.Item>
              </StyledForm>
            </StyledCard>
          </Col>

                     {/* Metade Direita - Listagem */}
           <Col xs={24} lg={12}>
             <StyledCard
               type="inner"
               style={{
                 height: "600px",
               }}
               styles={{
                 body: {
                   height: "100%",
                   display: "flex",
                   flexDirection: "column",
                 },
               }}
             >
                <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "0" }}>
                  <UnorderedListOutlined style={{ marginRight: 8 }} />
                  Credenciais API Cadastradas
                </Title>
                <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingBottom: 16, // respiro no fim da lista
                    paddingRight: 6, // evita o scroll colar no conteúdo
                  }}
                >
                  <StyledList
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
                            <PrimaryButton
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(item)}
                              size="small"
                            >
                              Editar
                            </PrimaryButton>,
                            <PrimaryButton
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(item.id)}
                              size="small"
                              style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                            >
                              Excluir
                            </PrimaryButton>,
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
             </StyledCard>
           </Col>
        </Row>
        </StyledCard>

      {/* Container Convênios */}
      <StyledCard
        title={
          <Space>
            <FileTextOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Convênios</span>
          </Space>
        }
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          }
        }}
        style={{ marginBottom: 24 }}
      >

        <StyledForm
          form={conveniosForm}
          layout="vertical"
          onFinish={onFinishConvenios}
        >
          {/* Subcontainer: Cobrança */}
          <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "0" }}>
            <CreditCardOutlined style={{ marginRight: 8 }} />
            Configurações de Cobrança
          </Title>
          <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
            <Row gutter={[16, 16]} align="top">
              {/* Conta Corrente */}
              <Col xs={24} sm={5}>
                <Form.Item
                  name="conta_corrente"
                  label={
                    <Text strong>
                      <ContainerOutlined style={{ marginRight: 8 }} />
                      Conta Corrente
                      <Tooltip
                        placement="top"
                        title={
                          <div style={{ maxWidth: 340 }}>
                            Aqui aparecem somente contas que já possuem <b>Credenciais API</b> cadastradas com a modalidade <b>001 - Cobrança</b>.
                            <br />
                            <br />
                            <b>Fluxo recomendado:</b>
                            <br />1) Cadastre a conta corrente
                            <br />2) Cadastre as credenciais de API (001 - Cobrança)
                            <br />3) Cadastre o convênio de cobrança
                          </div>
                        }
                      >
                        <InfoCircleOutlined
                          style={{
                            marginLeft: 8,
                            color: "#059669",
                            cursor: "help",
                            fontSize: "14px",
                          }}
                        />
                      </Tooltip>
                    </Text>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Selecione a conta corrente",
                    },
                  ]}
                >
                  <Select 
                    size="large" 
                    placeholder="Selecione a conta corrente"
                    onChange={(value) => {
                      setSelectedContaCorrenteId(value);
                      // O useEffect vai carregar os dados automaticamente
                    }}
                  >
                    {contasComCredenciaisCobranca.map((conta) => (
                      <Option key={conta.id} value={conta.id}>
                        {getBancoDisplay(conta.bancoCodigo)} - Ag: {conta.agencia}-{conta.agenciaDigito} CC: {conta.contaCorrente}-{conta.contaCorrenteDigito}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {/* Juros */}
              <Col xs={24} sm={3}>
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
              <Col xs={24} sm={3}>
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
              <Col xs={24} sm={2}>
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
              {/* Se a multa estiver ativa, exibe os campos Valor Multa e Carência na mesma linha */}
              {multaAtiva && (
                <>
                  <Col xs={24} sm={3}>
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
                  <Col xs={24} sm={3}>
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
              {/* Boleto PIX (Switch) */}
              <Col xs={24} sm={3}>
                <StyledSwitchContainer>
                  <Form.Item
                    name="layout_boleto_fundo_branco"
                    label={
                      <Text strong>
                        <FileTextOutlined style={{ marginRight: 8 }} />
                        Boleto PIX
                        <Tooltip 
                          title="Para 'Boleto PIX' funcionar, a empresa do convênio precisa ter chave PIX cadastrada no BB"
                          placement="top"
                        >
                          <InfoCircleOutlined 
                            style={{ 
                              marginLeft: 8, 
                              color: "#059669", 
                              cursor: "help",
                              fontSize: "14px"
                            }} 
                          />
                        </Tooltip>
                      </Text>
                    }
                    valuePropName="checked"
                  >
                    <div className="switch-wrapper">
                      <Switch
                        checked={layoutBoletoFundoBranco}
                        onChange={handleLayoutBoletoChange}
                      />
                    </div>
                  </Form.Item>
                </StyledSwitchContainer>
              </Col>
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

          <Form.Item style={{ marginTop: 24 }}>
            <Space size="middle">
              {convenioExiste && (
                <PrimaryButton
                  icon={<DeleteOutlined />}
                  size="large"
                  onClick={handleDeleteConvenio}
                  disabled={!selectedContaCorrenteId || !podeExcluirConvenio(selectedContaCorrenteId)}
                  style={
                    !selectedContaCorrenteId || !podeExcluirConvenio(selectedContaCorrenteId)
                      ? { backgroundColor: '#d9d9d9', borderColor: '#d9d9d9', color: '#00000040', cursor: 'not-allowed' }
                      : { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }
                  }
                >
                  Excluir
                </PrimaryButton>
              )}
              <PrimaryButton
                htmlType="submit"
                size="large"
                loading={loadingConvenios}
              >
                Salvar Convênio de Cobrança
              </PrimaryButton>
            </Space>
          </Form.Item>
        </StyledForm>
        </StyledCard>

      {/* Modal de Confirmação - Exclusão de Conta Corrente */}
      <ConfirmActionModal
        open={deleteContaCorrenteModalOpen}
        onConfirm={confirmDeleteContaCorrente}
        onCancel={() => {
          setDeleteContaCorrenteModalOpen(false);
          setContaCorrenteToDelete(null);
        }}
        title="Confirmação de Exclusão"
        message="Você tem certeza que deseja excluir esta conta corrente? Essa ação é irreversível."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
      />

      {/* Modal de Confirmação - Exclusão de Credencial API */}
      <ConfirmActionModal
        open={deleteCredencialModalOpen}
        onConfirm={confirmDeleteCredencial}
        onCancel={() => {
          setDeleteCredencialModalOpen(false);
          setCredencialToDelete(null);
        }}
        title="Confirmação de Exclusão"
        message="Você tem certeza que deseja excluir esta credencial API?"
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
      />
    </PageContainer>
   );
 };
 
 export default DadosBancarios;
