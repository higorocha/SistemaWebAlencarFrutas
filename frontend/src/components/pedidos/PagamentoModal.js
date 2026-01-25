// src/components/pedidos/PagamentoModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Statistic,
  Tag,
  Table,
  Divider,
  Empty,
  Tooltip,
  Form,
  Collapse,
  message,
} from "antd";
import {
  CreditCardOutlined,
  DollarOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CalendarOutlined,
  BankOutlined,
  InfoCircleOutlined,
  EditOutlined,
  ToolOutlined,
  SaveOutlined,
  CloseCircleOutlined,
  TruckOutlined,
  PercentageOutlined,
  BarcodeOutlined,
  LoadingOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { formatarValorMonetario, formataLeitura } from "../../utils/formatters";
import { PrimaryButton, PDFButton } from "../common/buttons";
import { MonetaryInput } from "../common/inputs";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import useNotificationWithContext from "../../hooks/useNotificationWithContext";
import NovoPagamentoModal from "./NovoPagamentoModal";
import VisualizarBoletoModal from "./VisualizarBoletoModal";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import styled from "styled-components";
import getTheme from "../../theme";
import useResponsive from "../../hooks/useResponsive";

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Obter tema para cores
const theme = getTheme('light');

// Função para obter a cor do status baseada no tema
const getStatusColor = (status) => {
  return theme.palette.pedidoStatus[status] || theme.palette.pedidoStatus.DEFAULT;
};

// Função para calcular o status local baseado no valor restante
const calcularStatusLocal = (pedido, valorRestante) => {
  // Se não há valor restante, o pedido está finalizado
  if (valorRestante <= 0) {
    return 'PAGAMENTO_REALIZADO';
  }
  
  // Se há valor recebido mas ainda resta algo, é pagamento parcial
  if ((pedido?.valorRecebido || 0) > 0) {
    return 'PAGAMENTO_PARCIAL';
  }
  
  // Se não há valor recebido, está aguardando pagamento
  return 'AGUARDANDO_PAGAMENTO';
};

// Função para obter o texto do status em português
const getStatusText = (status) => {
  const statusTexts = {
    'PEDIDO_CRIADO': 'Pedido Criado',
    'AGUARDANDO_COLHEITA': 'Aguardando Colheita',
    'COLHEITA_REALIZADA': 'Colheita Realizada',
    'AGUARDANDO_PRECIFICACAO': 'Aguardando Precificação',
    'PRECIFICACAO_REALIZADA': 'Precificação Realizada',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    'PAGAMENTO_PARCIAL': 'Pagamento Parcial',
    'PAGAMENTO_REALIZADO': 'Pagamento Realizado',
    'PEDIDO_FINALIZADO': 'Pedido Finalizado',
    'CANCELADO': 'Cancelado'
  };
  
  return statusTexts[status] || status;
};

// Styled components para tabela com tema personalizado
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: 16px;
    font-size: 14px;
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
    cursor: pointer;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background-color: #d1fae5 !important;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    font-size: 14px;
  }

  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .ant-table-cell-fix-left,
  .ant-table-cell-fix-right {
    background-color: inherit !important;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }

  /* LAYOUT FIXO PARA RESOLVER SCROLL HORIZONTAL */
  .ant-table-wrapper {
    width: 100%;
  }

  .ant-table {
    width: 100% !important;
    table-layout: fixed;
  }

  .ant-table-container {
    width: 100% !important;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-table-tbody > tr > td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* CORREÇÃO ESPECÍFICA: Esconder linha de medida */
  .ant-table-measure-row {
    display: none !important;
  }
`;

// Styled component para o spinner com animação
const SpinnerContainer = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PagamentoModal = ({
  open,
  onClose,
  pedido,
  loading,
  onNovoPagamento,
  onRemoverPagamento,
  onAjustesSalvos,
  onFinalizarPedido,
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();
  const [form] = Form.useForm();

  const [novoPagamentoModalOpen, setNovoPagamentoModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [internalPedido, setInternalPedido] = useState(pedido); // NOVO ESTADO

  // Hook para notificações com z-index correto
  const { error, contextHolder } = useNotificationWithContext();
  const [pagamentoEditando, setPagamentoEditando] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [operacaoLoading, setOperacaoLoading] = useState(false); // Loading para operações internas
  const [ajustesLoading, setAjustesLoading] = useState(false); // Loading para salvar ajustes
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pagamentoParaRemover, setPagamentoParaRemover] = useState(null);
  const [boletos, setBoletos] = useState([]);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [confirmBaixaBoletoOpen, setConfirmBaixaBoletoOpen] = useState(false);
  const [boletoParaBaixar, setBoletoParaBaixar] = useState(null);
  const [baixandoBoletoId, setBaixandoBoletoId] = useState(null);
  const [metodoPagamentoAtual, setMetodoPagamentoAtual] = useState(null);
  const [boletoClienteErroParaModal, setBoletoClienteErroParaModal] = useState(null);
  const [visualizarBoletoModalOpen, setVisualizarBoletoModalOpen] = useState(false);
  const [boletoSelecionado, setBoletoSelecionado] = useState(null);
  const [loadingPDFBoletoId, setLoadingPDFBoletoId] = useState(null);
  const [verificandoBoletoId, setVerificandoBoletoId] = useState(null);
  const [finalizandoPedido, setFinalizandoPedido] = useState(false);
  const [confirmFinalizarPedidoOpen, setConfirmFinalizarPedidoOpen] = useState(false);

  // Sincronizar estado interno com props e resetar form
  useEffect(() => {
    setInternalPedido(pedido);
    if (pedido) {
      form.setFieldsValue({
        frete: pedido.frete || 0,
        icms: pedido.icms || 0,
        desconto: pedido.desconto || 0,
        avaria: pedido.avaria || 0,
      });
    }
  }, [pedido, form]);

  // Buscar pagamentos e boletos quando modal abrir
  useEffect(() => {
    if (open && pedido?.id) {
      fetchPagamentos();
      fetchBoletos();
    }
  }, [open, pedido?.id]);

  const fetchBoletos = async () => {
    try {
      setLoadingBoletos(true);
      const response = await axiosInstance.get(`/api/cobranca/boletos/pedido/${pedido.id}`);
      setBoletos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar boletos:", error);
      setBoletos([]);
    } finally {
      setLoadingBoletos(false);
    }
  };

  const fetchPagamentos = async () => {
    try {
      setLoadingPagamentos(true);
      const response = await axiosInstance.get(`/api/pedidos/${pedido.id}/pagamentos`);
      
      // Garantir que seja um array
      const pagamentosArray = Array.isArray(response.data) ? response.data : Object.values(response.data || {});
      
      setPagamentos(pagamentosArray);
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      error("Erro", "Erro ao carregar pagamentos");
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const handleNovoPagamento = async (pagamentoData) => {
    try {
      // Salvar método de pagamento atual para mostrar mensagem correta no overlay
      setMetodoPagamentoAtual(pagamentoData.metodoPagamento);
      setBoletoClienteErroParaModal(null);
      
      // Fechar modal filho e mostrar overlay interno
      setNovoPagamentoModalOpen(false);
      setPagamentoEditando(null);
      setOperacaoLoading(true); // Ativar overlay interno

      await onNovoPagamento(pagamentoData);
      await fetchPagamentos(); // Recarregar lista interna
      
      // Se for boleto, recarregar também a lista de boletos
      if (pagamentoData.metodoPagamento === 'BOLETO') {
        await fetchBoletos();
      }
      
      // Não mostrar mensagem aqui pois a página principal já mostra
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);

      // Se o erro foi "cliente incompleto para boleto", guardar para reabrir o modal
      // com o botão "Atualizar cliente" visível (o modal é destroyOnClose).
      const data = error?.response?.data;
      if (pagamentoData?.metodoPagamento === 'BOLETO' && data?.code === 'CLIENTE_INCOMPLETO_BOLETO') {
        setBoletoClienteErroParaModal({
          clienteId: data?.clienteId,
          clienteNome: data?.clienteNome,
          missingFields: data?.missingFields || [],
        });
      }

      // Em caso de erro, reabrir o modal
      setNovoPagamentoModalOpen(true);
      setPagamentoEditando(pagamentoData.id ? pagamentoData : null);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false); // Desativar overlay interno
      setMetodoPagamentoAtual(null); // Limpar método de pagamento
    }
  };

  const handleEditarPagamento = (pagamento) => {
    setPagamentoEditando(pagamento);
    setNovoPagamentoModalOpen(true);
  };

  // Função para abrir modal de confirmação
  const handleAbrirConfirmacaoRemocao = (pagamento) => {
    setPagamentoParaRemover(pagamento);
    setConfirmModalOpen(true);
  };

  const handleRemoverPagamento = async () => {
    if (!pagamentoParaRemover) return;
    
    try {
      await onRemoverPagamento(pagamentoParaRemover.id);
      await fetchPagamentos(); // Recarregar lista interna
      setConfirmModalOpen(false);
      setPagamentoParaRemover(null);
      // Não exibir notificação aqui pois o componente pai já exibe
    } catch (err) {
      console.error("Erro ao remover pagamento:", err);
      error("Erro", "Erro ao remover pagamento");
    }
  };

  // Função para abrir modal de confirmação de baixa
  const handleAbrirConfirmacaoBaixa = (boleto) => {
    setBoletoParaBaixar(boleto);
    setConfirmBaixaBoletoOpen(true);
  };

  // Função para montar payload do webhook no formato do BB
  const montarPayloadWebhook = (boleto) => {
    // Formatar data no formato "dd.mm.aaaa"
    const formatarDataBB = (data) => {
      if (!data) return null;
      const d = new Date(data);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${dia}.${mes}.${ano}`;
    };

    // Formatar data de liquidação no formato "dd/MM/yyyyHH:mm:ss" (sem espaço)
    const formatarDataLiquidacao = (data) => {
      if (!data) return null;
      const d = new Date(data);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, '0');
      const minuto = String(d.getMinutes()).padStart(2, '0');
      const segundo = String(d.getSeconds()).padStart(2, '0');
      return `${dia}/${mes}/${ano}${hora}:${minuto}:${segundo}`;
    };

    // Tentar extrair dados do responsePayloadBanco se existir
    let responseBB = null;
    try {
      if (boleto.responsePayloadBanco) {
        responseBB = typeof boleto.responsePayloadBanco === 'string' 
          ? JSON.parse(boleto.responsePayloadBanco) 
          : boleto.responsePayloadBanco;
      }
    } catch (e) {
      console.warn('Erro ao parsear responsePayloadBanco:', e);
    }

    // Extrair valores do responsePayloadBanco ou usar valores do boleto local
    const nossoNumero = boleto.nossoNumero || boleto.id?.toString().padStart(20, '0');
    const dataEmissao = responseBB?.dataEmissaoTituloCobranca 
      ? responseBB.dataEmissaoTituloCobranca.replace(/\./g, '.') // Já vem no formato dd.mm.aaaa
      : formatarDataBB(boleto.dataEmissao);
    const dataVencimento = responseBB?.dataVencimentoTituloCobranca
      ? responseBB.dataVencimentoTituloCobranca.replace(/\./g, '.') // Já vem no formato dd.mm.aaaa
      : formatarDataBB(boleto.dataVencimento);
    const valorOriginal = responseBB?.valorOriginalTituloCobranca 
      ? Math.round(responseBB.valorOriginalTituloCobranca) 
      : (boleto.valorOriginal ? Math.round(boleto.valorOriginal * 100) : 0); // Converter para centavos
    const valorPago = responseBB?.valorPagoSacado 
      ? Math.round(responseBB.valorPagoSacado) 
      : (boleto.dataPagamento && boleto.valorOriginal ? Math.round(boleto.valorOriginal * 100) : 0);
    const numeroConvenio = responseBB?.numeroConvenio || parseInt(boleto.numeroConvenio) || 0;
    const carteira = responseBB?.numeroCarteiraCobranca || parseInt(boleto.numeroCarteira) || 17;
    const variacao = responseBB?.numeroVariacaoCarteiraCobranca || parseInt(boleto.numeroVariacaoCarteira) || 35;
    const codigoModalidade = responseBB?.codigoModalidadeTitulo || 1;

    // Mapear status do boleto para codigoEstadoBaixaOperacional
    // 1 - Baixa Operacional BB, 2 - Baixa Operacional outros Bancos
    // Se o boleto está PAGO, usar 2 (outros bancos) como padrão
    const codigoEstadoBaixa = boleto.statusBoleto === 'PAGO' ? 2 : 2;

    const payload = {
      id: nossoNumero,
      dataRegistro: dataEmissao || formatarDataBB(new Date()),
      dataVencimento: dataVencimento || formatarDataBB(new Date()),
      valorOriginal: valorOriginal,
      valorPagoSacado: valorPago,
      numeroConvenio: numeroConvenio,
      numeroOperacao: responseBB?.numeroOperacao || Math.floor(Math.random() * 1000000), // Gerar número aleatório se não existir
      carteiraConvenio: carteira,
      variacaoCarteiraConvenio: variacao,
      codigoEstadoBaixaOperacional: codigoEstadoBaixa,
      dataLiquidacao: formatarDataLiquidacao(boleto.dataPagamento) || formatarDataLiquidacao(new Date()),
      instituicaoLiquidacao: 60746948, // Código do Banco do Brasil (padrão, pode vir do responseBB)
      canalLiquidacao: 3, // Internet (padrão, pode ser 1-9 conforme documentação)
      codigoModalidadeBoleto: codigoModalidade,
      tipoPessoaPortador: 2, // Pessoa Jurídica (padrão, 1=PF, 2=PJ)
      identidadePortador: 191, // Código do Banco do Brasil (padrão)
      nomePortador: "BancodoBrasilS.A.",
      formaPagamento: 1 // Forma de pagamento padrão
    };

    return payload;
  };

  // Função para abrir modal de visualização de boleto
  const handleVisualizarBoleto = (boleto) => {
    // Montar e logar payload do webhook no console
    const payloadWebhook = montarPayloadWebhook(boleto);
    console.log('📋 [WEBHOOK-PAYLOAD] Payload formatado para teste do webhook:');
    console.log(JSON.stringify([payloadWebhook], null, 2));
    console.log('📋 [WEBHOOK-PAYLOAD] Copie o JSON acima para testar no Portal BB');
    
    setBoletoSelecionado(boleto);
    setVisualizarBoletoModalOpen(true);
  };

  // Função para gerar PDF do boleto
  const handleGerarPdfBoleto = async (boleto) => {
    if (!boleto?.id) {
      showNotification("error", "Erro", "Boleto não encontrado para gerar PDF.");
      return;
    }

    try {
      setLoadingPDFBoletoId(boleto.id);
      
      // Fazer requisição para o endpoint de PDF
      const response = await axiosInstance.get(`/api/pdf/boleto/${boleto.id}`, {
        responseType: 'blob',
        transformResponse: [(data) => data], // Não transforma a resposta
      });

      // Extrair nome do arquivo do header Content-Disposition do backend
      let nomeArquivo = `boleto-${boleto.id}-${boleto.nossoNumero}.pdf`; // Fallback
      
      // Tentar diferentes formas de acessar o header
      const contentDisposition = 
        response.headers['content-disposition'] || 
        response.headers['Content-Disposition'];
      
      if (contentDisposition) {
        // Primeiro tenta o formato RFC 5987 (filename*=UTF-8''...)
        let match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (match && match[1]) {
          nomeArquivo = decodeURIComponent(match[1]);
        } else {
          // Fallback para o formato padrão (filename="...")
          match = contentDisposition.match(/filename="([^"]+)"/);
          if (!match) {
            match = contentDisposition.match(/filename=([^;]+)/);
          }
          if (match && match[1]) {
            nomeArquivo = match[1].replace(/['"]/g, '').trim();
          }
        }
      }

      // Criar blob do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento <a> para download
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
      
      showNotification("success", "PDF Gerado", "O PDF do boleto foi gerado e baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      
      // Tentar extrair mensagem de erro do response
      let errorMessage = "Erro ao gerar PDF do boleto.";
      
      if (error.response?.status === 404) {
        errorMessage = "Boleto não encontrado.";
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Por favor, faça login novamente.";
      } else if (error.response?.data) {
        // Se o erro vier como blob, tentar converter para texto
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir parsear, usar mensagem padrão
        }
      }
      
      showNotification("error", "Erro ao Gerar PDF", errorMessage);
    } finally {
      setLoadingPDFBoletoId(null);
    }
  };

  // Função para cancelar baixa
  const handleCancelarBaixa = () => {
    setConfirmBaixaBoletoOpen(false);
    setBoletoParaBaixar(null);
  };

  // Função para confirmar e baixar boleto
  const handleConfirmarBaixa = async () => {
    if (!boletoParaBaixar) return;

    setConfirmBaixaBoletoOpen(false);
    setBaixandoBoletoId(boletoParaBaixar.id); // Ativar spinner

    try {
      await axiosInstance.post(`/api/cobranca/boletos/${boletoParaBaixar.nossoNumero}/baixar`, {
        numeroConvenio: boletoParaBaixar.numeroConvenio
      });
      showNotification("success", "Sucesso", "Boleto baixado com sucesso!");
      await fetchBoletos(); // Recarregar lista de boletos (o baixado não aparecerá mais)
      setBoletoParaBaixar(null);
      setBaixandoBoletoId(null); // Desativar spinner
    } catch (err) {
      console.error("Erro ao baixar boleto:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Erro ao baixar boleto";
      showNotification("error", "Erro", errorMessage);
      setBoletoParaBaixar(null);
      setBaixandoBoletoId(null); // Desativar spinner em caso de erro
    }
  };

  // Função para verificar status do boleto manualmente
  const handleVerificarStatusBoleto = async (boleto) => {
    if (!boleto?.nossoNumero || !boleto?.contaCorrenteId) {
      showNotification("error", "Erro", "Dados do boleto incompletos para verificação.");
      return;
    }

    try {
      setVerificandoBoletoId(boleto.id);
      
      // Fazer requisição para verificar status
      const response = await axiosInstance.post(
        `/api/cobranca/boletos/${boleto.nossoNumero}/verificar-status?contaCorrenteId=${boleto.contaCorrenteId}`
      );

      const boletoAtualizado = response.data;
      const statusBoleto = boletoAtualizado?.statusBoleto || 'DESCONHECIDO';

      // Mapear status para texto legível
      const statusText = {
        'PAGO': 'PAGO',
        'ABERTO': 'ABERTO',
        'PROCESSANDO': 'PROCESSANDO',
        'VENCIDO': 'VENCIDO',
        'BAIXADO': 'BAIXADO',
        'ERRO': 'ERRO'
      }[statusBoleto] || statusBoleto;

      // Recarregar dados
      await fetchBoletos();
      await fetchPagamentos();

      // Se o boleto foi processado como pago, recarregar dados do pedido
      if (statusBoleto === 'PAGO') {
        // Buscar pedido atualizado para atualizar o estado interno
        try {
          const pedidoResponse = await axiosInstance.get(`/api/pedidos/${internalPedido.id}`);
          if (pedidoResponse.data) {
            setInternalPedido(pedidoResponse.data);
            
            // Atualizar form com novos valores se necessário
            form.setFieldsValue({
              frete: pedidoResponse.data.frete || 0,
              icms: pedidoResponse.data.icms || 0,
              desconto: pedidoResponse.data.desconto || 0,
              avaria: pedidoResponse.data.avaria || 0,
            });

            // Chamar callback de ajustes salvos para atualizar componente pai
            if (onAjustesSalvos) {
              await onAjustesSalvos();
            }
          }
        } catch (err) {
          console.error("Erro ao atualizar dados do pedido:", err);
          // Continuar mesmo com erro na atualização do pedido
        }
      }

      showNotification("success", "Status Verificado", `Status do boleto: ${statusText}`);
    } catch (err) {
      console.error("Erro ao verificar status do boleto:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Erro ao verificar status do boleto";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setVerificandoBoletoId(null);
    }
  };

  // Função para abrir modal de confirmação de finalização
  const handleAbrirConfirmacaoFinalizar = () => {
    setConfirmFinalizarPedidoOpen(true);
  };

  // Função para cancelar confirmação de finalização
  const handleCancelarFinalizar = () => {
    setConfirmFinalizarPedidoOpen(false);
  };

  // Função para finalizar pedido (chamada após confirmação)
  const handleFinalizarPedido = async () => {
    if (!internalPedido?.id) {
      showNotification("error", "Erro", "Pedido não encontrado");
      return;
    }

    try {
      setFinalizandoPedido(true);
      
      // Chamar endpoint de finalização
      await axiosInstance.patch(`/api/pedidos/${internalPedido.id}/finalizar`);
      showNotification("success", "Sucesso", "Pedido finalizado com sucesso!");

      // Buscar pedido atualizado
      const response = await axiosInstance.get(`/api/pedidos/${internalPedido.id}`);
      if (response.data) {
        setInternalPedido(response.data);
        
        // Atualizar form com novos valores se necessário
        form.setFieldsValue({
          frete: response.data.frete || 0,
          icms: response.data.icms || 0,
          desconto: response.data.desconto || 0,
          avaria: response.data.avaria || 0,
        });
      }

      // Chamar callback para atualizar componente pai
      if (onAjustesSalvos) {
        await onAjustesSalvos();
      }

      // Chamar callback específico de finalização se existir
      if (onFinalizarPedido) {
        await onFinalizarPedido();
      }

      // Recarregar pagamentos e boletos
      await fetchPagamentos();
      await fetchBoletos();

      // Fechar modal de confirmação
      setConfirmFinalizarPedidoOpen(false);

      // Fechar modal após finalizar com sucesso
      onClose();

    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      const message = error.response?.data?.message || "Erro ao finalizar pedido";
      showNotification("error", "Erro", message);
      // Fechar modal de confirmação mesmo em caso de erro
      setConfirmFinalizarPedidoOpen(false);
    } finally {
      setFinalizandoPedido(false);
    }
  };

  // Função para salvar ajustes financeiros (frete, icms, etc.)
  const handleSalvarAjustes = async (values) => {
    try {
      setAjustesLoading(true);
      const payload = {
        frete: values.frete ? parseFloat(String(values.frete).replace(/[^0-9,-]+/g, "").replace(",", ".")) : 0,
        icms: values.icms ? parseFloat(String(values.icms).replace(/[^0-9,-]+/g, "").replace(",", ".")) : 0,
        desconto: values.desconto ? parseFloat(String(values.desconto).replace(/[^0-9,-]+/g, "").replace(",", ".")) : 0,
        avaria: values.avaria ? parseFloat(String(values.avaria).replace(/[^0-9,-]+/g, "").replace(",", ".")) : 0,
      };
      await axiosInstance.patch(`/api/pedidos/${internalPedido.id}/ajustes-precificacao`, payload);
      showNotification("success", "Sucesso", "Ajustes financeiros salvos com sucesso!");

      // Atualiza o estado interno para refletir a mudança instantaneamente
      setInternalPedido(prevPedido => {
        const valorTotalFrutas = prevPedido.frutasPedidos.reduce((acc, fruta) => acc + (parseFloat(fruta.valorTotal) || 0), 0) || 0;
        const novoValorFinal = valorTotalFrutas + (payload.frete || 0) + (payload.icms || 0) - (payload.desconto || 0) - (payload.avaria || 0);
        return {
          ...prevPedido,
          ...payload,
          valorFinal: novoValorFinal,
        };
      });

      if (onAjustesSalvos) {
        await onAjustesSalvos();
      }

      setEditMode(false);
    } catch (err) {
      console.error("Erro ao salvar ajustes:", err);
      const message = err.response?.data?.message || "Erro ao salvar ajustes financeiros";
      showNotification("error", "Erro", message);
    } finally {
      setAjustesLoading(false);
    }
  };

  // =================================================
  // LÓGICA DE CÁLCULO CENTRALIZADA E REATIVA
  // =================================================
  const watchedValues = Form.useWatch([], form);
  const freteAtual = watchedValues?.frete ? parseFloat(String(watchedValues.frete).replace(/[^0-9,-]+/g, "").replace(",", ".")) : (parseFloat(internalPedido?.frete) || 0);
  const icmsAtual = watchedValues?.icms ? parseFloat(String(watchedValues.icms).replace(/[^0-9,-]+/g, "").replace(",", ".")) : (parseFloat(internalPedido?.icms) || 0);
  const descontoAtual = watchedValues?.desconto ? parseFloat(String(watchedValues.desconto).replace(/[^0-9,-]+/g, "").replace(",", ".")) : (parseFloat(internalPedido?.desconto) || 0);
  const avariaAtual = watchedValues?.avaria ? parseFloat(String(watchedValues.avaria).replace(/[^0-9,-]+/g, "").replace(",", ".")) : (parseFloat(internalPedido?.avaria) || 0);

  const valorTotalFrutas = internalPedido?.frutasPedidos?.reduce((acc, fruta) => acc + (parseFloat(fruta.valorTotal) || 0), 0) || 0;
  const valorBrutoPedido = valorTotalFrutas + freteAtual + icmsAtual;
  const valorFinalPedido = valorBrutoPedido - descontoAtual - avariaAtual;
  const valorTotalRecebido = internalPedido?.valorRecebido || 0;
  
  // Calcular valor de boletos pendentes (ABERTO, PROCESSANDO, VENCIDO)
  const valorBoletosPendentes = boletos
    .filter(boleto => ['ABERTO', 'PROCESSANDO', 'VENCIDO'].includes(boleto.statusBoleto))
    .reduce((acc, boleto) => acc + (parseFloat(boleto.valorOriginal) || 0), 0);
  
  // Valor restante considerando boletos pendentes
  const valorRestante = valorFinalPedido - valorTotalRecebido - valorBoletosPendentes;
  const percentualPago = valorFinalPedido > 0 ? (valorTotalRecebido / valorFinalPedido) * 100 : 0;
  
  // Calcular status local baseado no valor restante (mais preciso que o status do banco)
  const statusLocal = internalPedido ? calcularStatusLocal(internalPedido, valorRestante) : internalPedido?.status;
  

  // Função para formatar datas de forma segura
  const formatarData = (date) => {
    if (!date) return "-";
    
    try {
      // Se já é uma string, tentar parsear
      if (typeof date === 'string') {
        // Formato do banco: '2025-09-03 03:00:00' ou '2025-09-03 23:18:38.057'
        // Converter para formato ISO se necessário
        let dateString = date;
        
        // Se não tem 'T' e tem espaço, adicionar 'T' para formato ISO
        if (dateString.includes(' ') && !dateString.includes('T')) {
          dateString = dateString.replace(' ', 'T');
        }
        
        // Se não tem timezone, adicionar 'Z' para UTC
        if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
          dateString += 'Z';
        }
        
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
          console.warn('Data inválida após conversão:', dateString);
          return "-";
        }
        return parsedDate.toLocaleDateString("pt-BR");
      }
      
      // Se é um objeto Date
      if (date instanceof Date) {
        return date.toLocaleDateString("pt-BR");
      }
      
      // Tentar converter para Date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('Data inválida recebida:', date);
        return "-";
      }
      
      return parsedDate.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data recebida:', date);
      return "-";
    }
  };

  // Colunas da tabela de pagamentos
  const columns = [
    {
      title: "Data",
      dataIndex: "dataPagamento",
      key: "dataPagamento",
      width: 100,
      render: (date) => formatarData(date),
    },
    {
      title: "Valor",
      dataIndex: "valorRecebido",
      key: "valorRecebido",
      width: 120,
      render: (valor) => (
        <Text strong style={{ color: "#059669" }}>
          {formatarValorMonetario(valor)}
        </Text>
      ),
    },
    {
      title: "Método",
      dataIndex: "metodoPagamento",
      key: "metodoPagamento",
      width: 120,
      render: (metodo) => {
        const metodos = {
          PIX: { icon: <PixIcon width={16} height={16} /> },
          BOLETO: { icon: <BoletoIcon width={16} height={16} /> },
          TRANSFERENCIA: { icon: <TransferenciaIcon width={16} height={16} /> },
          DINHEIRO: { icon: "💰" },
          CHEQUE: { icon: "📄" },
        };
        const config = metodos[metodo] || { icon: "💳" };
        return (
          <Tag
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
              cursor: 'default',
              minHeight: '28px'
            }}
          >
            {typeof config.icon === 'string' ? <span>{config.icon}</span> : config.icon}
            {metodo}
          </Tag>
        );
      },
    },
    {
      title: "Conta",
      dataIndex: "contaDestino",
      key: "contaDestino",
      width: 120,
      render: (conta) => (
        <Tag color="blue">
          <BankOutlined /> {conta}
        </Tag>
      ),
    },
    {
      // Coluna para exibir o número do vale (referência externa do pagamento)
      // Campo opcional que pode conter informações como número de vale, comprovante, etc.
      title: "Vale",
      dataIndex: "referenciaExterna",
      key: "referenciaExterna",
      width: 100,
      ellipsis: true,
      render: (ref) => ref || "-",
    },
    {
      title: "Ações",
      key: "acoes",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* Botão de informações com tooltip para exibir observações do pagamento */}
          {record.observacoesPagamento && (
            <Tooltip 
              title={record.observacoesPagamento} 
              placement="topLeft"
              overlayStyle={{ maxWidth: 300 }}
            >
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}
          {/* Botão para editar o pagamento */}
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditarPagamento(record)}
            title="Editar pagamento"
            style={{ color: '#52c41a' }}
          />
          {/* Botão para remover o pagamento */}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleAbrirConfirmacaoRemocao(record)}
            title="Remover pagamento"
          />
        </Space>
      ),
    },
  ];

  // Função para obter informações das frutas com unidade de precificação
  const getFrutasInfo = () => {
    if (!internalPedido?.frutasPedidos || internalPedido.frutasPedidos.length === 0) {
      return "Nenhuma fruta";
    }

    return internalPedido.frutasPedidos.map((fp) => {
      const unidadePrec = fp.unidadePrecificada || fp.unidadeMedida1;
      const quantidade = unidadePrec === fp.unidadeMedida2 ? fp.quantidadeReal2 : fp.quantidadeReal;
      const quantidadeFormatada = formataLeitura(quantidade);
      return `${fp.fruta?.nome}: ${quantidadeFormatada} ${unidadePrec}`;
    }).join(", ");
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={
          <span style={{ 
            color: "#ffffff", 
            fontWeight: "600", 
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}>
            <CreditCardOutlined style={{ marginRight: "0.5rem" }} />
            {isMobile ? "Pagamentos" : "Gestão de Pagamentos"}
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={isMobile ? '95vw' : '90%'}
        style={{ maxWidth: isMobile ? '95vw' : "62.5rem" }}
        styles={{
          body: { 
            maxHeight: "calc(100vh - 12.5rem)", 
            overflowY: "auto", 
            overflowX: "hidden", 
            padding: isMobile ? 12 : 20 
          },
          header: { 
            backgroundColor: "#059669", 
            borderBottom: "0.125rem solid #047857", 
            padding: 0 
          },
          wrapper: { zIndex: 1000 }
        }}
        centered
        destroyOnClose
      >
        <div style={{ position: 'relative' }}>
          {/* Overlay de Loading para Operações */}
          {operacaoLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '32px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e8e8e8'
              }}>
                <SpinnerContainer />
                <div style={{
                  color: '#059669',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {metodoPagamentoAtual === 'BOLETO' ? 'Registrando boleto...' : 'Processando pagamento...'}
                </div>
              </div>
            </div>
          )}

        {internalPedido && (
          <>
            {/* Informações do Pedido */}
            <Card
              title={
                <Space>
                  <EyeOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Informações do Pedido
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16, 
                border: "0.0625rem solid #e8e8e8", 
                borderRadius: "0.5rem", 
                backgroundColor: "#f9f9f9" 
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  borderBottom: "0.125rem solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: { 
                  padding: isMobile ? "12px" : "16px" 
                }
              }}
            >
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong>Pedido:</Text>
                  <br />
                  <Text>{internalPedido.numeroPedido}</Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong>Cliente:</Text>
                  <br />
                  <Text>{internalPedido.cliente?.nome}</Text>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Text strong>Frutas (Unidade de Precificação):</Text>
                  <br />
                  <Text>{getFrutasInfo()}</Text>
                </Col>
              </Row>
              <Divider style={{ margin: isMobile ? '8px 0' : '12px 0' }} />
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Status:</Text>
                  <br />
                  <Tag 
                    color={getStatusColor(statusLocal)}
                    style={{
                      backgroundColor: getStatusColor(statusLocal),
                      color: '#ffffff',
                      fontWeight: '600',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '13px'
                    }}
                  >
                    {getStatusText(statusLocal)}
                  </Tag>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Data do Pedido:</Text>
                  <br />
                  <Text>{formatarData(internalPedido.createdAt)}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong>Última Atualização:</Text>
                  <br />
                  <Text>{formatarData(internalPedido.updatedAt)}</Text>
                </Col>
              </Row>
            </Card>

            {/* Resumo Financeiro */}
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Resumo Financeiro
                  </span>
                </Space>
              }
              extra={
                !editMode && (
                  <Tooltip title="Editar valores de frete, impostos, etc.">
                    <Button 
                      type="text" 
                      icon={<EditOutlined style={{ color: '#ffffff' }} />} 
                      onClick={() => setEditMode(true)} 
                    />
                  </Tooltip>
                )
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16, 
                border: "0.0625rem solid #e8e8e8", 
                borderRadius: "0.5rem", 
                backgroundColor: "#f9f9f9" 
              }}
              styles={{ 
                header: {
                  backgroundColor: "#059669", 
                  borderBottom: "0.125rem solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: isMobile ? "6px 12px" : "12px 20px"
                },
                body: { padding: isMobile ? "12px" : "20px" }
              }}
            >
              <Form form={form} onFinish={handleSalvarAjustes} layout="vertical">
                {editMode ? (
                  // MODO DE EDIÇÃO
                  <>
                    <Row gutter={[isMobile ? 8 : 16, 0]}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label={<Space><TruckOutlined /><strong>Frete</strong></Space>}
                          name="frete"
                          style={{ marginBottom: 16 }}
                        >
                          <MonetaryInput addonAfter="R$" size="large" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label={<Space><PercentageOutlined /><strong>ICMS</strong></Space>}
                          name="icms"
                          style={{ marginBottom: 16 }}
                        >
                          <MonetaryInput addonAfter="R$" size="large" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label={<Space><PercentageOutlined /><strong>Desconto</strong></Space>}
                          name="desconto"
                          style={{ marginBottom: 16 }}
                        >
                          <MonetaryInput addonAfter="R$" size="large" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          label={<Space><PercentageOutlined /><strong>Avaria</strong></Space>}
                          name="avaria"
                          style={{ marginBottom: 16 }}
                        >
                          <MonetaryInput addonAfter="R$" size="large" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row justify="end" gutter={8}>
                      <Col>
                        <Button 
                          onClick={() => {
                            setEditMode(false);
                            form.resetFields();
                          }}
                          disabled={ajustesLoading}
                        >
                          Cancelar
                        </Button>
                      </Col>
                      <Col>
                                                <Button 
                                                  type="primary" 
                                                  htmlType="submit" 
                                                  icon={<SaveOutlined />}
                                                  loading={ajustesLoading}
                                                  style={{ 
                                                    backgroundColor: '#059669', 
                                                    borderColor: '#059669',
                                                  }}
                                                >
                                                  Salvar Ajustes
                                                </Button>                      </Col>
                    </Row>
                    <Divider style={{ marginTop: 24, marginBottom: 0 }} />
                  </>
                ) : (
                  // MODO DE VISUALIZAÇÃO
                  <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} style={{ marginBottom: isMobile ? "12px" : "16px" }}>
                    <Col xs={12} sm={12} md={6}>
                      <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                        <Text style={{ fontSize: "11px", color: "#166534", fontWeight: "600", display: "block" }}>FRETE</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "700", color: "#15803d" }}>{`+ ${formatarValorMonetario(freteAtual)}`}</Text>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                        <Text style={{ fontSize: "11px", color: "#166534", fontWeight: "600", display: "block" }}>ICMS</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "700", color: "#15803d" }}>{`+ ${formatarValorMonetario(icmsAtual)}`}</Text>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                        <Text style={{ fontSize: "11px", color: "#991b1b", fontWeight: "600", display: "block" }}>DESCONTO</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "700", color: "#b91c1c" }}>{`- ${formatarValorMonetario(descontoAtual)}`}</Text>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                        <Text style={{ fontSize: "11px", color: "#991b1b", fontWeight: "600", display: "block" }}>AVARIA</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "700", color: "#b91c1c" }}>{`- ${formatarValorMonetario(avariaAtual)}`}</Text>
                      </div>
                    </Col>
                  </Row>
                )}
              </Form>

              <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 16]} align="middle">
                <Col xs={24} sm={12} md={valorBoletosPendentes > 0 ? 5 : 6}>
                  <div style={{ 
                    backgroundColor: "#f0f9ff", 
                    border: "2px solid #0ea5e9", 
                    borderRadius: "12px", 
                    padding: isMobile ? "12px" : "14px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)"
                  }}>
                    <div style={{ marginBottom: "6px" }}>
                      <DollarOutlined style={{ fontSize: isMobile ? "20px" : "22px", color: "#0ea5e9" }} />
                    </div>
                    <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR TOTAL
                    </Text>
                    <Text style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#0f172a", display: "block" }}>
                      {formatarValorMonetario(valorFinalPedido)}
                    </Text>
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={valorBoletosPendentes > 0 ? 5 : 6}>
                  <div style={{ 
                    backgroundColor: "#f0fdf4", 
                    border: "0.125rem solid #22c55e", 
                    borderRadius: "0.75rem", 
                    padding: isMobile ? "12px" : "14px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "6px" }}>
                      <BankOutlined style={{ fontSize: isMobile ? "20px" : "22px", color: "#22c55e" }} />
                    </div>
                    <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RECEBIDO
                    </Text>
                    <Text style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#15803d", display: "block" }}>
                      {formatarValorMonetario(valorTotalRecebido)}
                    </Text>
                  </div>
                </Col>

                {valorBoletosPendentes > 0 && (
                  <Col xs={24} sm={12} md={4}>
                    <div style={{ 
                      backgroundColor: "#fff7ed", 
                      border: "0.125rem solid #f59e0b", 
                      borderRadius: "0.75rem", 
                      padding: isMobile ? "12px" : "14px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)"
                    }}>
                      <div style={{ marginBottom: "6px" }}>
                        <BarcodeOutlined style={{ fontSize: isMobile ? "20px" : "22px", color: "#f59e0b" }} />
                      </div>
                      <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                        PENDENTES
                      </Text>
                      <Text style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#d97706", display: "block" }}>
                        {formatarValorMonetario(valorBoletosPendentes)}
                      </Text>
                    </div>
                  </Col>
                )}
                
                <Col xs={24} sm={12} md={valorBoletosPendentes > 0 ? 5 : 6}>
                  <div style={{ 
                    backgroundColor: valorRestante > 0 ? "#fef2f2" : "#f0fdf4", 
                    border: valorRestante > 0 ? "0.125rem solid #ef4444" : "0.125rem solid #22c55e", 
                    borderRadius: "0.75rem", 
                    padding: isMobile ? "12px" : "14px",
                    textAlign: "center",
                    boxShadow: valorRestante > 0 ? "0 2px 8px rgba(239, 68, 68, 0.15)" : "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "6px" }}>
                      <CalendarOutlined style={{ 
                        fontSize: isMobile ? "20px" : "22px", 
                        color: valorRestante > 0 ? "#ef4444" : "#22c55e" 
                      }} />
                    </div>
                    <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RESTANTE
                    </Text>
                    <Text style={{ 
                      fontSize: isMobile ? "16px" : "18px", 
                      fontWeight: "700", 
                      color: valorRestante > 0 ? "#dc2626" : "#15803d",
                      display: "block"
                    }}>
                      {formatarValorMonetario(valorRestante)}
                    </Text>
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={valorBoletosPendentes > 0 ? 5 : 6}>
                  <div style={{ 
                    backgroundColor: percentualPago >= 100 ? "#f0fdf4" : percentualPago >= 50 ? "#fffbeb" : "#fef2f2", 
                    border: percentualPago >= 100 ? "0.125rem solid #22c55e" : percentualPago >= 50 ? "0.125rem solid #f59e0b" : "0.125rem solid #ef4444", 
                    borderRadius: "0.75rem", 
                    padding: isMobile ? "12px" : "14px",
                    textAlign: "center",
                    boxShadow: percentualPago >= 100 
                      ? "0 2px 8px rgba(34, 197, 94, 0.15)" 
                      : percentualPago >= 50 
                        ? "0 2px 8px rgba(245, 158, 11, 0.15)" 
                        : "0 2px 8px rgba(239, 68, 68, 0.15)"
                  }}>
                    <div style={{ marginBottom: "6px" }}>
                      <InfoCircleOutlined style={{ 
                        fontSize: isMobile ? "20px" : "22px", 
                        color: percentualPago >= 100 ? "#22c55e" : percentualPago >= 50 ? "#f59e0b" : "#ef4444"
                      }} />
                    </div>
                    <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      % PAGO
                    </Text>
                    <Text style={{ 
                      fontSize: isMobile ? "16px" : "18px", 
                      fontWeight: "700", 
                      color: percentualPago >= 100 ? "#15803d" : percentualPago >= 50 ? "#d97706" : "#dc2626",
                      display: "block"
                    }}>
                      {percentualPago.toFixed(1)}%
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Boletos Emitidos (Aguardando Pagamento) */}
            {boletos.filter(b => ['ABERTO', 'PROCESSANDO', 'VENCIDO'].includes(b.statusBoleto)).length > 0 && (
              <Card
                title={
                  <Space>
                    <BarcodeOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      Boletos Emitidos (Aguardando Pagamento)
                    </span>
                  </Space>
                }
                style={{ 
                  marginBottom: isMobile ? 12 : 16, 
                  border: "0.0625rem solid #e8e8e8", 
                  borderRadius: "0.5rem", 
                  backgroundColor: "#f9f9f9" 
                }}
                styles={{ 
                  header: { 
                    backgroundColor: "#059669", 
                    borderBottom: "0.125rem solid #047857", 
                    color: "#ffffff", 
                    borderRadius: "0.5rem 0.5rem 0 0",
                    padding: isMobile ? "6px 12px" : "8px 16px"
                  },
                  body: { padding: isMobile ? "8px" : "12px 16px" }
                }}
              >
                {boletos.filter(b => ['ABERTO', 'PROCESSANDO', 'VENCIDO'].includes(b.statusBoleto)).length > 0 ? (
                  <StyledTable
                    columns={[
                      {
                        title: "Nosso Número",
                        dataIndex: "nossoNumero",
                        key: "nossoNumero",
                        width: 150,
                      },
                      {
                        title: "Valor",
                        dataIndex: "valorOriginal",
                        key: "valorOriginal",
                        width: 120,
                        render: (valor) => (
                          <Text strong style={{ color: "#059669" }}>
                            {formatarValorMonetario(valor)}
                          </Text>
                        ),
                      },
                      {
                        title: "Vencimento",
                        dataIndex: "dataVencimento",
                        key: "dataVencimento",
                        width: 120,
                        render: (date) => formatarData(date),
                      },
                      {
                        title: "Status",
                        dataIndex: "statusBoleto",
                        key: "statusBoleto",
                        width: 120,
                        render: (status) => {
                          const statusConfig = {
                            'ABERTO': { color: '#52c41a', text: 'Pendente' },
                            'PROCESSANDO': { color: '#faad14', text: 'Processando' },
                            'VENCIDO': { color: '#f5222d', text: 'Vencido' },
                          };
                          const config = statusConfig[status] || { color: '#8c8c8c', text: status };
                          return (
                            <Tag color={config.color}>
                              {config.text}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: "PDF",
                        key: "pdf",
                        width: 100,
                        align: "center",
                        render: (_, record) => (
                          <PDFButton
                            size="small"
                            tooltip="Gerar PDF do boleto"
                            onClick={() => handleGerarPdfBoleto(record)}
                            loading={loadingPDFBoletoId === record.id}
                            disabled={loadingPDFBoletoId === record.id}
                          >
                            Boleto
                          </PDFButton>
                        ),
                      },
                      {
                        title: "Ações",
                        key: "acoes",
                        width: 150,
                        align: "center",
                        render: (_, record) => (
                          <Space size="small">
                            <Tooltip title="Verificar status do boleto no banco">
                              <Button
                                type="text"
                                icon={verificandoBoletoId === record.id ? <LoadingOutlined spin /> : <SyncOutlined />}
                                size="small"
                                onClick={() => handleVerificarStatusBoleto(record)}
                                disabled={verificandoBoletoId === record.id}
                                style={{ color: '#1890ff' }}
                              />
                            </Tooltip>
                            <Tooltip title="Visualizar boleto">
                              <Button
                                type="text"
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => handleVisualizarBoleto(record)}
                              />
                            </Tooltip>
                            <Tooltip title="Baixar/Cancelar boleto">
                              <Button
                                type="text"
                                danger
                                icon={baixandoBoletoId === record.id ? <LoadingOutlined spin /> : <DeleteOutlined />}
                                size="small"
                                onClick={() => handleAbrirConfirmacaoBaixa(record)}
                                disabled={baixandoBoletoId === record.id}
                              />
                            </Tooltip>
                          </Space>
                        ),
                      },
                    ]}
                    dataSource={boletos.filter(b => ['ABERTO', 'PROCESSANDO', 'VENCIDO'].includes(b.statusBoleto))}
                    rowKey="id"
                    pagination={false}
                    loading={loadingBoletos}
                    size="middle"
                    bordered={true}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                    }}
                    scroll={{ x: isMobile ? 800 : undefined }}
                  />
                ) : (
                  <Empty
                    description="Nenhum boleto pendente"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            )}

            {/* Lista de Pagamentos */}
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Pagamentos Realizados
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16, 
                border: "0.0625rem solid #e8e8e8", 
                borderRadius: "0.5rem", 
                backgroundColor: "#f9f9f9" 
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  borderBottom: "0.125rem solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: { padding: isMobile ? "8px" : "12px 16px" }
              }}
              extra={
                !isMobile && (
                  valorRestante <= 0 ? (
                    <PrimaryButton
                      icon={<CheckCircleOutlined />}
                      onClick={handleAbrirConfirmacaoFinalizar}
                      loading={finalizandoPedido}
                      size="middle"
                    >
                      Finalizar Pedido
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      icon={<PlusCircleOutlined />}
                      onClick={() => setNovoPagamentoModalOpen(true)}
                      disabled={valorRestante <= 0}
                      size="middle"
                    >
                      Novo Pagamento
                    </PrimaryButton>
                  )
                )
              }
            >
              {/* Botão Mobile para Novo Pagamento ou Finalizar Pedido */}
              {isMobile && (
                valorRestante <= 0 ? (
                  <PrimaryButton
                    icon={<CheckCircleOutlined />}
                    onClick={handleAbrirConfirmacaoFinalizar}
                    loading={finalizandoPedido}
                    size="middle"
                    block
                    style={{ marginBottom: 12 }}
                  >
                    Finalizar Pedido
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    icon={<PlusCircleOutlined />}
                    onClick={() => setNovoPagamentoModalOpen(true)}
                    disabled={valorRestante <= 0}
                    size="middle"
                    block
                    style={{ marginBottom: 12 }}
                  >
                    Novo Pagamento
                  </PrimaryButton>
                )
              )}

              {pagamentos.length > 0 ? (
                <StyledTable
                  columns={columns}
                  dataSource={pagamentos}
                  rowKey="id"
                  pagination={false}
                  loading={loadingPagamentos}
                  size="middle"
                  bordered={true}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                  }}
                  scroll={{ x: isMobile ? 800 : undefined }}
                />
              ) : (
                <Empty
                  description="Nenhum pagamento registrado"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>

            {/* Botões de Ação */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: isMobile ? "8px" : "12px", 
              marginTop: isMobile ? "1rem" : "1.5rem", 
              paddingTop: isMobile ? "12px" : "16px", 
              borderTop: "0.0625rem solid #e8e8e8" 
            }}>
              <Button 
                onClick={onClose} 
                disabled={loading}
                size={isMobile ? "small" : "large"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                Fechar
              </Button>
            </div>
          </>
        )}
        </div>
      </Modal>

      {/* Modal para Novo Pagamento */}
      <NovoPagamentoModal
        open={novoPagamentoModalOpen}
        onClose={() => {
          setNovoPagamentoModalOpen(false);
          setPagamentoEditando(null);
          setBoletoClienteErroParaModal(null);
        }}
        onSave={handleNovoPagamento}
        pedido={internalPedido}
        valorRestante={valorRestante}
        loading={loading}
        pagamentoEditando={pagamentoEditando}
        boletoClienteErro={boletoClienteErroParaModal}
        onClearBoletoClienteErro={() => setBoletoClienteErroParaModal(null)}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmActionModal
        open={confirmModalOpen}
        onConfirm={handleRemoverPagamento}
        onCancel={() => {
          setConfirmModalOpen(false);
          setPagamentoParaRemover(null);
        }}
        title="Confirmar Exclusão"
        message={
          pagamentoParaRemover?.lancamentoExtratoPedidoId
            ? "Este pagamento está vinculado a um lançamento do extrato. Ao remover, o vínculo será desfeito."
            : "Tem certeza que deseja remover este pagamento? Esta ação não pode ser desfeita."
        }
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
        customContent={pagamentoParaRemover && (
          <div>
            <div style={{ 
              backgroundColor: "#fef2f2", 
              border: "1px solid #fecaca", 
              borderRadius: "8px", 
              padding: "16px",
              marginBottom: pagamentoParaRemover?.lancamentoExtratoPedidoId ? "12px" : 0
            }}>
              <p style={{ margin: 0, fontWeight: "600", color: "#dc2626" }}>
                Detalhes do Pagamento:
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#374151" }}>
                <strong>Valor:</strong> {formatarValorMonetario(pagamentoParaRemover.valorRecebido)}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Método:</strong> {pagamentoParaRemover.metodoPagamento}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Data:</strong> {formatarData(pagamentoParaRemover.dataPagamento)}
              </p>
            </div>
            {pagamentoParaRemover?.lancamentoExtratoPedidoId && (
              <p style={{ fontSize: "14px", color: "#dc2626", margin: 0 }}>
                ⚠️ O vínculo com o extrato será removido junto com o pagamento.
              </p>
            )}
          </div>
        )}
      />

      {/* Modal de Confirmação de Baixa de Boleto */}
      <ConfirmActionModal
        open={confirmBaixaBoletoOpen}
        onConfirm={handleConfirmarBaixa}
        onCancel={handleCancelarBaixa}
        title="Baixar/Cancelar Boleto"
        message={`Tem certeza que deseja baixar/cancelar este boleto? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Baixar"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
      />

      {/* Modal de Visualização de Boleto */}
      <VisualizarBoletoModal
        open={visualizarBoletoModalOpen}
        onClose={() => {
          setVisualizarBoletoModalOpen(false);
          setBoletoSelecionado(null);
        }}
        boleto={boletoSelecionado}
      />

      {/* Modal de Confirmação de Finalização de Pedido */}
      <ConfirmActionModal
        open={confirmFinalizarPedidoOpen}
        onConfirm={handleFinalizarPedido}
        onCancel={handleCancelarFinalizar}
        title="Finalizar Pedido"
        message="Tem certeza que deseja finalizar este pedido? Esta ação é irreversível e marcará o pedido como finalizado."
        confirmText="Sim, Finalizar"
        cancelText="Cancelar"
        confirmButtonDanger={false}
        icon={<CheckCircleOutlined />}
        iconColor="#059669"
      />
    </>
  );
};

export default PagamentoModal;