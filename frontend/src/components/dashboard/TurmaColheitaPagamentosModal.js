// src/components/dashboard/TurmaColheitaPagamentosModal.js

import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Button,
  Typography,
  Spin,
  Alert,
  Checkbox,
  Input,
  Divider,
  Tooltip,
  Empty,
  Select,
  DatePicker,
  Form
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  AppleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency, capitalizeNameShort, capitalizeName, formatarDataParaAPIBB } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import useRestricaoDataPagamentoLoteBB from "../../hooks/useRestricaoDataPagamentoLoteBB";
import ResponsiveTable from "../common/ResponsiveTable";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import { getFruitIcon } from "../../utils/fruitIcons";
import { MaskedDatePicker } from "../common/inputs";
import { SecondaryButton } from "../common/buttons";
import CentralizedLoader from "../common/loaders/CentralizedLoader";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import moment from "moment";
import { Box } from "@mui/material";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Styled components seguindo padrão do sistema - removido, usando ResponsiveTable

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

// Container removido - usando ResponsiveTable component

// Styled component para linha sendo paga (animação de saída)
const LinhaComAnimacao = styled.tr`
  ${props => props.$sendoPago && `
    animation: fadeOutPayment 0.8s ease-in-out;
    background-color: #f6ffed !important;

    @keyframes fadeOutPayment {
      0% { background-color: #ffffff; opacity: 1; transform: scale(1); }
      50% { background-color: #52c41a; opacity: 0.8; transform: scale(1.02); }
      100% { background-color: #f6ffed; opacity: 0.6; transform: scale(0.98); }
    }
  `}

  ${props => props.$comCheckmark && `
    background-color: #f6ffed !important;

    .checkmark-container {
      animation: checkmarkAppear 0.6s ease-in-out;

      @keyframes checkmarkAppear {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
    }
  `}

  ${props => props.$itemPago && `
    background-color: #f6ffed !important;
    border-left: 4px solid #52c41a !important;
    opacity: 0.85;

    td {
      color: #52c41a !important;
      font-weight: 500;
    }

    .ant-tag {
      background-color: #f6ffed !important;
      border-color: #52c41a !important;
      color: #52c41a !important;
    }
  `}

  ${props => props.$itemProcessando && `
    background-color: #fffbe6 !important;
    border-left: 4px solid #faad14 !important;
    opacity: 0.9;

    td {
      color: #ad6800 !important;
      font-weight: 500;
    }

    .ant-tag {
      background-color: #fffbe6 !important;
      border-color: #faad14 !important;
      color: #ad6800 !important;
    }
  `}
`;

const TurmaColheitaPagamentosModal = ({
  open,
  onClose,
  turmaId,
  turmaNome,
  onPagamentosProcessados
}) => {
  const { isMobile, isTablet } = useResponsive();
  const {
    validarDataPagamento,
    disabledDate: disabledDatePixAPI,
    mostrarAlertaLiberacao,
    validarEMostrarErro,
  } = useRestricaoDataPagamentoLoteBB();
  const [loading, setLoading] = useState(false);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [dados, setDados] = useState(null);
  const [colheitasSelecionadas, setColheitasSelecionadas] = useState([]);
  const [observacoesPagamento, setObservacoesPagamento] = useState('');
  const [itensSendoPagos, setItensSendoPagos] = useState([]);
  const [itensComCheckmark, setItensComCheckmark] = useState([]);
  const [pagamentosProcessados, setPagamentosProcessados] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [dataPagamentoSelecionada, setDataPagamentoSelecionada] = useState(null);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState(null);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroDataColheita, setFiltroDataColheita] = useState(null);
  // Estados para contas correntes com credenciais de pagamentos
  const [contasDisponiveis, setContasDisponiveis] = useState([]);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [loadingContas, setLoadingContas] = useState(false);
  // Estado para loading do processamento PIX-API
  const [loadingPixAPI, setLoadingPixAPI] = useState(false);
  const [mensagemLoadingPix, setMensagemLoadingPix] = useState('');

  useEffect(() => {
    if (open && turmaId) {
      fetchDados();
    }
  }, [open, turmaId]);

  useEffect(() => {
    if (!open) {
      // Limpar dados quando modal fechar
      setDados(null);
      setColheitasSelecionadas([]);
      setObservacoesPagamento('');
      setItensSendoPagos([]);
      setItensComCheckmark([]);
      setPagamentosProcessados(false);
      setModalConfirmacaoAberto(false);
      setDataPagamentoSelecionada(null);
      setFormaPagamentoSelecionada(null);
      setFiltroBusca('');
      setFiltroDataColheita(null);
      setContasDisponiveis([]);
      setContaSelecionada(null);
      setLoadingPixAPI(false);
      setMensagemLoadingPix('');
    }
  }, [open]);

  useEffect(() => {
    if (modalConfirmacaoAberto) {
      setDataPagamentoSelecionada(moment());
      setFormaPagamentoSelecionada('PIX - API');
      // Buscar contas disponíveis quando o modal de confirmação abrir
      fetchContasDisponiveis();
    }
  }, [modalConfirmacaoAberto]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/turma-colheita/${turmaId}/pagamentos-pendentes`);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showNotification('error', 'Erro', 'Erro ao carregar dados da turma');
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar modal informando se houve pagamentos processados
  const fecharModal = () => {
    onClose(pagamentosProcessados);
  };

  const handleSelecaoColheita = (colheitaId, selecionada) => {
    // Verificar se o item já foi pago (não deve ser selecionável)
    const item = dados?.colheitas.find(c => c.id === colheitaId);
    if (item?.statusPagamento === 'PAGO' || item?.statusPagamento === 'PROCESSANDO') {
      return; // Não permitir seleção de itens já pagos ou em processamento
    }

    if (selecionada) {
      setColheitasSelecionadas(prev => [...prev, colheitaId]);
    } else {
      setColheitasSelecionadas(prev => prev.filter(id => id !== colheitaId));
    }
  };


  const calcularTotalSelecionado = () => {
    if (!dados) return 0;
    return dados.colheitas
      .filter(
        c =>
          colheitasSelecionadas.includes(c.id) &&
          c.statusPagamento !== 'PAGO' &&
          c.statusPagamento !== 'PROCESSANDO'
      )
      .reduce((acc, c) => acc + (c.valorColheita || 0), 0);
  };

  const colheitasFiltradas = useMemo(() => {
    if (!dados) return [];

    let lista = [...dados.colheitas];

    if (filtroBusca.trim()) {
      const termo = filtroBusca.trim().toLowerCase();
      lista = lista.filter(colheita => {
        const nomeCliente = (colheita.cliente?.nome || '').toLowerCase();
        const numeroPedido = (colheita.pedidoNumero || '').toLowerCase();
        const placa = (colheita.placaPrimaria || '').toLowerCase();

        return (
          nomeCliente.includes(termo) ||
          numeroPedido.includes(termo) ||
          placa.includes(termo)
        );
      });
    }

    if (filtroDataColheita && filtroDataColheita.length === 2 && filtroDataColheita[0] && filtroDataColheita[1]) {
      const [inicio, fim] = filtroDataColheita;
      lista = lista.filter(colheita => {
        if (!colheita.dataColheita) return false;
        const data = moment(colheita.dataColheita);
        return data.isSameOrAfter(inicio, 'day') && data.isSameOrBefore(fim, 'day');
      });
    }

    return lista;
  }, [dados, filtroBusca, filtroDataColheita]);

  // Função para calcular total colhido agrupado por unidade de medida
  const totaisColhidos = useMemo(() => {
    if (!dados) return [];

    const colheitasBase = colheitasSelecionadas.length > 0
      ? dados.colheitas.filter(colheita =>
          colheitasSelecionadas.includes(colheita.id) &&
          colheita.statusPagamento !== 'PAGO' &&
          colheita.statusPagamento !== 'PROCESSANDO'
        )
      : colheitasFiltradas.filter(
          colheita =>
            colheita.statusPagamento !== 'PAGO' &&
            colheita.statusPagamento !== 'PROCESSANDO'
        );

    const totaisPorUnidade = colheitasBase.reduce((acc, colheita) => {
      const unidade = colheita.unidadeMedida || 'un';
      const quantidade = colheita.quantidadeColhida || 0;

      if (!acc[unidade]) {
        acc[unidade] = 0;
      }

      acc[unidade] += quantidade;
      return acc;
    }, {});

    return Object.entries(totaisPorUnidade).map(([unidade, total]) => ({
      unidade,
      total
    }));
  }, [dados, colheitasSelecionadas, colheitasFiltradas]);

  const limparFiltros = () => {
    setFiltroBusca('');
    setFiltroDataColheita(null);
  };

  const filtrosAtivos = useMemo(() => (
    Boolean(
      filtroBusca.trim() ||
      (filtroDataColheita && filtroDataColheita.length === 2 && filtroDataColheita[0] && filtroDataColheita[1])
    )
  ), [filtroBusca, filtroDataColheita]);

  const totalAPagar = useMemo(() => {
    if (!dados) return 0;

    if (colheitasSelecionadas.length > 0) {
      return dados.colheitas
        .filter(
          c =>
            colheitasSelecionadas.includes(c.id) &&
            c.statusPagamento !== 'PAGO' &&
            c.statusPagamento !== 'PROCESSANDO'
        )
        .reduce((acc, c) => acc + (c.valorColheita || 0), 0);
    }

    return colheitasFiltradas
      .filter(
        colheita =>
          colheita.statusPagamento !== 'PAGO' &&
          colheita.statusPagamento !== 'PROCESSANDO'
      )
      .reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);
  }, [dados, colheitasSelecionadas, colheitasFiltradas]);



  // Função para abrir modal de confirmação
  const abrirModalConfirmacao = () => {
    setModalConfirmacaoAberto(true);
  };

  // Função auxiliar para obter informações da chave PIX baseado no tipo
  const obterInfoChavePix = (chavePix, tipoChavePix) => {
    if (!chavePix || !tipoChavePix) return null;
    
    const chave = chavePix.trim();
    
    // Usar o tipo já cadastrado no banco de dados
    switch (tipoChavePix) {
      case 1: // Telefone
        const telefoneLimpo = chave.replace(/\D/g, '');
        const ddd = telefoneLimpo.substring(0, 2);
        const numero = telefoneLimpo.substring(2);
        return { tipo: 1, ddd, telefone: numero };
      
      case 2: // Email
        return { tipo: 2, valor: chave };
      
      case 3: // CPF/CNPJ
        if (chave.length === 11) {
          return { tipo: 3, cpf: chave };
        } else if (chave.length === 14) {
          return { tipo: 3, cnpj: chave };
        }
        // Se não conseguir determinar se é CPF ou CNPJ, usar o valor como está
        return { tipo: 3, valor: chave };
      
      case 4: // Chave Aleatória
        return { tipo: 4, valor: chave };
      
      default:
        // Fallback: chave aleatória se tipo desconhecido
        return { tipo: 4, valor: chave };
    }
  };

  // Importar função de formatação de data para API BB
  const formatarDataParaAPI = formatarDataParaAPIBB;

  // Função para processar pagamentos via PIX - API
  const processarPagamentosPixAPI = async () => {
    console.log('🚀 [PIX-API] Iniciando processamento de pagamentos via PIX - API');
    console.log('📋 [PIX-API] Dados recebidos:', {
      dataPagamentoSelecionada,
      contaSelecionada,
      turmaId,
      dados: dados ? {
        turma: dados.turma,
        colheitasSelecionadas,
        totalColheitas: dados.colheitas.length
      } : null
    });

    try {
      // Buscar dados da conta selecionada
      const contaSelecionadaData = contasDisponiveis.find(c => c.id === contaSelecionada);
      if (!contaSelecionadaData) {
        throw new Error('Conta corrente selecionada não encontrada');
      }

      console.log('🏦 [PIX-API] Dados da conta selecionada:', contaSelecionadaData);

      // Ativar loader com mensagem inicial
      const mensagemInicial = `Processando pagamentos via PIX - API...`;
      setMensagemLoadingPix(mensagemInicial);
      setLoadingPixAPI(true);

      // Preparar dados das colheitas
      const itensDisponiveis = dados.colheitas.filter(
        c => c.statusPagamento !== 'PAGO' && c.statusPagamento !== 'PROCESSANDO'
      );
      const idsParaPagar = colheitasSelecionadas.length > 0
        ? colheitasSelecionadas
        : itensDisponiveis.map(c => c.id);

      const colheitasParaPagar = dados.colheitas.filter(c => idsParaPagar.includes(c.id));
      console.log('💰 [PIX-API] Colheitas para pagar:', colheitasParaPagar);

      // Verificar se a turma tem chave PIX e tipo de chave cadastrados
      if (!dados.turma?.chavePix) {
        throw new Error('A turma não possui chave PIX cadastrada. Configure a chave PIX da turma antes de realizar pagamentos via PIX - API.');
      }

      if (!dados.turma?.tipoChavePix) {
        throw new Error('A turma não possui tipo de chave PIX cadastrado. Configure o tipo da chave PIX da turma antes de realizar pagamentos via PIX - API.');
      }

      // Obter informações da chave PIX usando o tipo cadastrado no banco
      const chavePixInfo = obterInfoChavePix(dados.turma.chavePix, dados.turma.tipoChavePix);
      console.log('🔍 [PIX-API] Informações da chave PIX:', {
        chavePix: dados.turma.chavePix,
        tipoChavePix: dados.turma.tipoChavePix,
        modalidadeChave: dados.turma.modalidadeChave,
        chavePixInfo
      });

      if (!chavePixInfo) {
        throw new Error('Não foi possível processar as informações da chave PIX da turma');
      }

      // Formatar data do pagamento
      const dataFormatada = formatarDataParaAPI(dataPagamentoSelecionada);
      console.log('📅 [PIX-API] Data formatada para API:', dataFormatada);

      // Calcular valor total consolidado de todas as colheitas
      const valorTotalConsolidado = colheitasParaPagar.reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);
      const quantidadeColheitas = colheitasParaPagar.length;
      
      console.log(`💰 [PIX-API] Valor total consolidado: R$ ${valorTotalConsolidado.toFixed(2)} para ${quantidadeColheitas} colheita(s)`);

      // Função auxiliar para limitar string a um tamanho máximo
      const limitarString = (str, maxLength) => {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) : str;
      };

      // Obter número do pedido (primeiro pedido no caso consolidado)
      // Para pagamento consolidado, usar o primeiro pedido encontrado
      const numeroPedido = colheitasParaPagar.length > 0 
        ? (colheitasParaPagar[0].pedidoNumero || String(colheitasParaPagar[0].pedidoId) || '')
        : '';

      // Criar 1 ÚNICA transferência consolidada para todas as colheitas
      // descricaoPagamento: nome do colhedor (limite: 40 caracteres - conforme resposta do BB)
      // descricaoPagamentoInstantaneo: número do pedido (limite: 26 caracteres - conforme resposta do BB)
      const transferenciaConsolidada = {
        data: dataFormatada,
        valor: valorTotalConsolidado.toFixed(2),
        descricaoPagamento: limitarString(turmaNome || '', 40),
        descricaoPagamentoInstantaneo: limitarString(numeroPedido, 26),
        formaIdentificacao: chavePixInfo.tipo,
        // Campo customizado para salvar no item (não enviado ao BB)
        _responsavelChavePix: dados.turma?.responsavelChavePix || null,
      };

      // Adicionar campos condicionais baseados no tipo de chave
      if (chavePixInfo.tipo === 1) {
        transferenciaConsolidada.dddTelefone = chavePixInfo.ddd;
        transferenciaConsolidada.telefone = chavePixInfo.telefone;
      } else if (chavePixInfo.tipo === 2) {
        transferenciaConsolidada.email = chavePixInfo.valor;
      } else if (chavePixInfo.tipo === 3) {
        if (chavePixInfo.cpf) {
          transferenciaConsolidada.cpf = chavePixInfo.cpf;
        } else if (chavePixInfo.cnpj) {
          transferenciaConsolidada.cnpj = chavePixInfo.cnpj;
        }
      } else if (chavePixInfo.tipo === 4) {
        transferenciaConsolidada.identificacaoAleatoria = chavePixInfo.valor;
      }

      // Lista com 1 única transferência consolidada
      const listaTransferencias = [transferenciaConsolidada];

      console.log('📤 [PIX-API] Transferência consolidada montada:', listaTransferencias);

      // Obter dígito verificador da conta (já vem nos dados da conta selecionada)
      const digitoVerificador = contaSelecionadaData.contaCorrenteDigito || 'X';
      console.log('🔢 [PIX-API] Dígito verificador da conta:', digitoVerificador);

      // Preparar array de IDs das colheitas para relacionamento N:N
      // 1 única transferência consolidada pagará todas essas colheitas
      const colheitaIds = colheitasParaPagar.map(colheita => colheita.id);
      console.log(`🔗 [PIX-API] ${colheitaIds.length} colheita(s) serão pagas com 1 única transferência consolidada:`, colheitaIds);

      // Montar payload completo
      // ✅ numeroRequisicao é gerado automaticamente pelo backend (sequencial: 1, 2, 3...)
      const payload = {
        contaCorrenteId: contaSelecionada,
        // numeroRequisicao: removido - gerado automaticamente pelo backend
        agenciaDebito: contaSelecionadaData.agencia,
        contaCorrenteDebito: contaSelecionadaData.contaCorrente,
        digitoVerificadorContaCorrente: digitoVerificador,
        tipoPagamento: 128, // 128 = Pagamentos diversos
        listaTransferencias: listaTransferencias,
        colheitaIds: colheitaIds, // ✅ Adicionar array de IDs para relacionamento
        origemTipo: 'TURMA_COLHEITA', // ✅ Padronizar origem explicitamente
        origemNome: turmaNome ? `Turma de Colheita - ${turmaNome}` : 'Turma de Colheita' // ✅ Nome descritivo da origem
      };

      // ========================================
      // LOG COMPLETO DO PAYLOAD DE IDA
      // ========================================
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📤 [PIX-API] PAYLOAD COMPLETO DE IDA:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(JSON.stringify(payload, null, 2));
      console.log('═══════════════════════════════════════════════════════════════');

      // Atualizar mensagem antes de enviar para API
      const mensagemTransferencia = quantidadeColheitas === 1
        ? `Enviando 1 transferência via PIX - API...`
        : `Enviando 1 transferência consolidada (${quantidadeColheitas} colheitas) via PIX - API...`;
      setMensagemLoadingPix(mensagemTransferencia);
      
      // Chamar API de pagamentos
      console.log('🌐 [PIX-API] Enviando requisição para /api/pagamentos/transferencias-pix...');
      const response = await axiosInstance.post('/api/pagamentos/transferencias-pix', payload);

      // ========================================
      // LOG COMPLETO DA RESPOSTA
      // ========================================
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ [PIX-API] RESPOSTA COMPLETA DA API:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('Status HTTP:', response.status, response.statusText);
      console.log('Headers:', JSON.stringify(response.headers, null, 2));
      console.log('Body:', JSON.stringify(response.data, null, 2));
      console.log('═══════════════════════════════════════════════════════════════');

      // Log detalhado da resposta (resumo)
      if (response.data) {
        console.log('📊 [PIX-API] Resumo da resposta:');
        console.log('  - Número da requisição (gerado pelo backend):', response.data.numeroRequisicao);
        console.log('  - Estado da requisição:', response.data.estadoRequisicao);
        console.log('  - Quantidade de transferências:', response.data.quantidadeTransferencias);
        console.log('  - Valor total:', response.data.valorTransferencias);
        console.log('  - Transferências válidas:', response.data.quantidadeTransferenciasValidas);
        console.log('  - Valor válido:', response.data.valorTransferenciasValidas);
        
        if (response.data.listaTransferencias) {
          console.log('📋 [PIX-API] Detalhes das transferências:');
          response.data.listaTransferencias.forEach((transferencia, index) => {
            console.log(`  Transferência ${index + 1}:`, {
              identificadorPagamento: transferencia.identificadorPagamento,
              indicadorMovimentoAceito: transferencia.indicadorMovimentoAceito,
              erros: transferencia.erros || []
            });
          });
        }
      }

      // Se chegou aqui, a API retornou sucesso
      console.log('✅ [PIX-API] Pagamento via PIX - API processado com sucesso!');

      // Atualizar mensagem do loader
      setMensagemLoadingPix('Transferências processadas! Finalizando operação...');

      // Agora processar o pagamento no backend também (marcar como pago)
      console.log('🔄 [PIX-API] Marcando pagamentos como processados no backend...');
      await processarPagamentosBackend();
      console.log('✅ [PIX-API] Pagamentos marcados como processados no backend!');

      // Desativar loader
      setLoadingPixAPI(false);
      setMensagemLoadingPix('');

      return response.data;

    } catch (error) {
      console.error('❌ [PIX-API] Erro ao processar pagamento via PIX - API:', error);
      console.error('❌ [PIX-API] Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers
      });

      // Desativar loader em caso de erro
      setLoadingPixAPI(false);
      setMensagemLoadingPix('');

      throw error;
    }
  };

  // Função para processar pagamentos no backend (marcar como pago)
  const processarPagamentosBackend = async () => {
    const itensDisponiveis = dados.colheitas.filter(
      c => c.statusPagamento !== 'PAGO' && c.statusPagamento !== 'PROCESSANDO'
    );
    const idsParaPagar = colheitasSelecionadas.length > 0
      ? colheitasSelecionadas
      : itensDisponiveis.map(c => c.id);

    const dadosPagamento = {
      colheitaIds: idsParaPagar,
      observacoes: observacoesPagamento.trim() || undefined,
      dataPagamento: dataPagamentoSelecionada
        ? dataPagamentoSelecionada.clone().startOf('day').add(12, 'hours').toISOString()
        : undefined,
      formaPagamento: 'PIX - API'
    };

    console.log('📤 [PIX-API-BACKEND] Enviando requisição para marcar pagamentos como processados:');
    console.log('  - Endpoint: PATCH /api/turma-colheita/' + turmaId + '/processar-pagamentos');
    console.log('  - Payload:', JSON.stringify(dadosPagamento, null, 2));

    const response = await axiosInstance.patch(
      `/api/turma-colheita/${turmaId}/processar-pagamentos`,
      dadosPagamento
    );

    console.log('✅ [PIX-API-BACKEND] Resposta recebida:', JSON.stringify(response.data, null, 2));

    return response.data;
  };

  // Função para processar pagamentos (após confirmação)
  const processarPagamentos = async () => {
    if (!dataPagamentoSelecionada) {
      showNotification('error', 'Validação', 'Selecione a data do pagamento.');
      return;
    }

    if (!formaPagamentoSelecionada) {
      showNotification('error', 'Validação', 'Selecione a forma de pagamento.');
      return;
    }

    // Validação específica para PIX - API
    if (formaPagamentoSelecionada === 'PIX - API' && !contaSelecionada) {
      showNotification('error', 'Validação', 'Selecione uma conta corrente para pagamento via PIX - API.');
      return;
    }

    // Se for PIX - API, usar função específica
    if (formaPagamentoSelecionada === 'PIX - API') {
      // Validar data antes de processar
      if (!validarEMostrarErro(dataPagamentoSelecionada)) {
        return; // Interrompe se validação falhar
      }

      try {
        // Fechar modal de confirmação imediatamente para evitar conflitos visuais
        // O CentralizedLoader será exibido durante o processamento
        setModalConfirmacaoAberto(false);
        
        setLoadingPagamento(true);
        
        const responseAPI = await processarPagamentosPixAPI();

        // Se chegou aqui, a API retornou sucesso
        // O modal de confirmação já foi fechado anteriormente

        // Marcar itens como sendo pagos (animação de saída)
        const itensDisponiveis = dados.colheitas.filter(
          c => c.statusPagamento !== 'PAGO' && c.statusPagamento !== 'PROCESSANDO'
        );
        const idsParaPagar = colheitasSelecionadas.length > 0
          ? colheitasSelecionadas
          : itensDisponiveis.map(c => c.id);
        setItensSendoPagos(idsParaPagar);

        await new Promise(resolve => setTimeout(resolve, 200));

        // Mostrar checkmark nos itens pagos
        setItensComCheckmark(idsParaPagar);
        setItensSendoPagos([]);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Atualizar dados localmente
        const colheitasAtualizadas = dados.colheitas.map(colheita => {
          if (idsParaPagar.includes(colheita.id)) {
            // Para PIX - API, marcar como PROCESSANDO (aguardando liberação/webhook)
            return { ...colheita, statusPagamento: 'PROCESSANDO' };
          }
          return {
            ...colheita,
            statusPagamento: colheita.statusPagamento || 'PENDENTE',
          };
        });

        const colheitasPendentes = colheitasAtualizadas.filter(
          colheita => colheita.statusPagamento === 'PENDENTE'
        );
        const novoValorTotal = colheitasPendentes.reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);

        setDados(prevDados => ({
          ...prevDados,
          colheitas: colheitasAtualizadas,
          resumo: {
            ...prevDados.resumo,
            valorTotalPendente: novoValorTotal,
            quantidadeColheitas: colheitasPendentes.length
          }
        }));

        const tipoOperacao = colheitasSelecionadas.length > 0 ? 'selecionados' : 'todos';
        const numeroRequisicao = responseAPI?.numeroRequisicao;
        const mensagemSucesso = numeroRequisicao
          ? `Pagamento via PIX - API realizado com sucesso! ${responseAPI.quantidadeTransferenciasValidas || idsParaPagar.length} transferência(s) ${tipoOperacao}. Número da requisição: ${numeroRequisicao}`
          : `Pagamento via PIX - API realizado com sucesso! ${responseAPI.quantidadeTransferenciasValidas || idsParaPagar.length} transferência(s) ${tipoOperacao}.`;
        
        showNotification(
          'success',
          'Pagamentos via PIX - API Processados',
          mensagemSucesso
        );

        // Mostrar alerta sobre liberação da remessa até 21:00
        mostrarAlertaLiberacao(dataPagamentoSelecionada);

        setPagamentosProcessados(true);
        setColheitasSelecionadas([]);
        setObservacoesPagamento('');
        setItensComCheckmark([]);
        setDataPagamentoSelecionada(null);
        setFormaPagamentoSelecionada(null);

        if (onPagamentosProcessados) {
          onPagamentosProcessados();
        }

        const aindaTemPendencias = colheitasPendentes.length > 0;
        if (!aindaTemPendencias) {
          setTimeout(() => {
            fecharModal();
            showNotification(
              'success',
              'Todos os Pagamentos Concluídos',
              `Não há mais pendências para ${turmaNome}.`
            );
          }, 400);
        }

      } catch (error) {
        console.error('❌ [PIX-API] Erro ao processar pagamento:', error);
        setItensSendoPagos([]);
        setItensComCheckmark([]);

        const mensagemErro = error.response?.data?.message || error.message || 'Erro ao processar pagamento via PIX - API';
        showNotification(
          'error',
          'Erro no Pagamento PIX - API',
          mensagemErro
        );
        // Em caso de erro, o modal de confirmação já foi fechado
        // O usuário pode tentar novamente abrindo o modal novamente
      } finally {
        setLoadingPagamento(false);
      }
      return; // Sair da função aqui para não executar o código abaixo
    }

    // Código original para outros métodos de pagamento
    try {
      // Fechar modal de confirmação
      setModalConfirmacaoAberto(false);

      setLoadingPagamento(true);

      // Se nenhuma seleção, pagar todas as colheitas PENDENTES
      const itensDisponiveis = dados.colheitas.filter(
        c => c.statusPagamento !== 'PAGO' && c.statusPagamento !== 'PROCESSANDO'
      );
      const idsParaPagar = colheitasSelecionadas.length > 0
        ? colheitasSelecionadas
        : itensDisponiveis.map(c => c.id);

      // Marcar itens como sendo pagos (animação de saída)
      setItensSendoPagos(idsParaPagar);

      // Aguardar animação de saída
      await new Promise(resolve => setTimeout(resolve, 200));

      const dadosPagamento = {
        colheitaIds: idsParaPagar,
        observacoes: observacoesPagamento.trim() || undefined,
        dataPagamento: dataPagamentoSelecionada
          ? dataPagamentoSelecionada.clone().startOf('day').add(12, 'hours').toISOString()
          : undefined,
        formaPagamento: formaPagamentoSelecionada || undefined
      };

      const response = await axiosInstance.patch(
        `/api/turma-colheita/${turmaId}/processar-pagamentos`,
        dadosPagamento
      );

      // Mostrar checkmark nos itens pagos
      setItensComCheckmark(idsParaPagar);
      setItensSendoPagos([]);

      // Aguardar animação do checkmark
      await new Promise(resolve => setTimeout(resolve, 300));

      // ATUALIZAR DADOS LOCALMENTE - marcar itens como PAGOS em vez de remover
      const colheitasAtualizadas = dados.colheitas.map(colheita => {
        if (idsParaPagar.includes(colheita.id)) {
          return { ...colheita, statusPagamento: 'PAGO' };
        }
        return {
          ...colheita,
          statusPagamento: colheita.statusPagamento || 'PENDENTE',
        };
      });

      // Recalcular totais considerando apenas itens PENDENTES
      const colheitasPendentes = colheitasAtualizadas.filter(
        colheita => colheita.statusPagamento === 'PENDENTE'
      );
      const novoValorTotal = colheitasPendentes.reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);

      // Atualizar estado local
      setDados(prevDados => ({
        ...prevDados,
        colheitas: colheitasAtualizadas,
        resumo: {
          ...prevDados.resumo,
          valorTotalPendente: novoValorTotal,
          quantidadeColheitas: colheitasPendentes.length
        }
      }));

      const tipoOperacao = colheitasSelecionadas.length > 0 ? 'selecionados' : 'todos';
      showNotification(
        'success',
        'Pagamentos Processados',
        `${response.data.quantidadePagamentos} pagamento(s) ${tipoOperacao} processado(s). Total: ${formatCurrency(response.data.totalPago)}`
      );

      // Marcar que houve pagamentos processados
      setPagamentosProcessados(true);

      // Limpar seleções e estados de animação
      setColheitasSelecionadas([]);
      setObservacoesPagamento('');
      setItensComCheckmark([]);
      setDataPagamentoSelecionada(null);
      setFormaPagamentoSelecionada(null);

      // Chamar callback para atualizar dados no componente pai
      if (onPagamentosProcessados) {
        onPagamentosProcessados();
      }

      // Verificar se ainda há pendências após atualização local
      const aindaTemPendencias = colheitasPendentes.length > 0;

      if (!aindaTemPendencias) {
        // Fechar modal automaticamente se não há mais pendências
        setTimeout(() => {
          fecharModal();
          showNotification(
            'success',
            'Todos os Pagamentos Concluídos',
            `Não há mais pendências para ${turmaNome}.`
          );
        }, 400);
      }
      // NÃO chamar callback NUNCA durante o processamento para evitar "piscar"
      // O modal é autossuficiente e gerencia seus próprios dados

    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      // Limpar estados de animação em caso de erro
      setItensSendoPagos([]);
      setItensComCheckmark([]);

      showNotification(
        'error',
        'Erro',
        error.response?.data?.message || 'Erro ao processar pagamentos'
      );
    } finally {
      setLoadingPagamento(false);
    }
  };

  const colunas = [
    {
      title: <CheckCircleOutlined style={{ color: '#059669' }} />,
      key: 'selecao',
      width: 60,
      render: (_, record) => {
        const sendoPago = itensSendoPagos.includes(record.id);
        const comCheckmark = itensComCheckmark.includes(record.id);
        const isPago = record.statusPagamento === 'PAGO';
        const isProcessando = record.statusPagamento === 'PROCESSANDO';

        // Se item já foi pago, mostrar checkmark permanente
        if (isPago) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title="Pagamento concluído">
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
              </Tooltip>
            </div>
          );
        }

        // Se está em processamento (aguardando liberação no BB), mostrar relógio amarelo
        if (isProcessando) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title="Pagamento processando - Aguardando liberação no Banco do Brasil. O pagamento será concluído após a liberação e processamento pelo banco.">
                <ClockCircleOutlined style={{ color: '#faad14', fontSize: '18px' }} />
              </Tooltip>
            </div>
          );
        }

        // Se está sendo processado (animação temporária), mostrar checkmark animado
        if (comCheckmark) {
          return (
            <div className="checkmark-container">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            </div>
          );
        }

        // Se está sendo pago, mostrar spinner
        if (sendoPago) {
          return (
            <SpinnerContainer style={{
              width: '18px',
              height: '18px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #059669'
            }} />
          );
        }

        // Se está pendente, mostrar checkbox
        return (
          <Checkbox
            checked={colheitasSelecionadas.includes(record.id)}
            onChange={(e) => handleSelecaoColheita(record.id, e.target.checked)}
            disabled={loadingPagamento}
          />
        );
      },
    },
    {
      title: 'Pedido',
      dataIndex: 'pedidoNumero',
      key: 'pedidoNumero',
      width: 140,
      render: (numero) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {numero}
        </Tag>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 200,
      ellipsis: true,
      render: (nome) => capitalizeNameShort(nome || ''),
    },
    {
      title: 'Placa',
      dataIndex: 'placaPrimaria',
      key: 'placaPrimaria',
      width: 140,
      render: (placa) => (
        placa ? placa.toUpperCase() : '-'
      ),
    },
    {
      title: 'Fruta',
      dataIndex: ['fruta', 'nome'],
      key: 'fruta',
      width: 180,
      render: (nome) => (
        <Space>
                    {getFruitIcon(nome, { width: 20, height: 20 })}
          <span style={{ fontWeight: '500' }}>{capitalizeName(nome || '')}</span>
        </Space>
      ),
    },
    {
      title: 'Quantidade',
      key: 'quantidade',
      width: 130,
      render: (_, record) => (
        <Text strong>
          {record.quantidadeColhida.toLocaleString('pt-BR')} {record.unidadeMedida}
        </Text>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valorColheita',
      key: 'valorColheita',
      width: 130,
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: 'Data Colheita',
      dataIndex: 'dataColheita',
      key: 'dataColheita',
      width: 140,
      render: (data) => (
        data ? new Date(data).toLocaleDateString('pt-BR') : '-'
      ),
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      key: 'observacoes',
      width: 120,
      render: (obs) => (
        obs ? (
          <Tooltip title={obs}>
            <MessageOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        ) : '-'
      ),
    },
  ];

  const possuiSelecao = colheitasSelecionadas.length > 0;
  const totalItensConfirmacao = possuiSelecao
    ? colheitasSelecionadas.length
    : (dados?.colheitas?.filter(
        colheita =>
          colheita.statusPagamento !== 'PAGO' &&
          colheita.statusPagamento !== 'PROCESSANDO'
      ).length || 0);
  const valorTotalConfirmacao = possuiSelecao
    ? calcularTotalSelecionado()
    : dados?.resumo?.totalPendente || 0;
  const mensagemConfirmacao = possuiSelecao
    ? "Apenas itens selecionados serão pagos"
    : "Todos os itens pendentes serão pagos";

  const metodosPagamento = [
    {
      value: 'PIX - API',
      label: 'PIX - API',
      color: '#52c41a',
      icon: <PixIcon width={16} height={16} />
    },
    {
      value: 'PIX',
      label: 'PIX',
      color: '#52c41a',
      icon: <PixIcon width={16} height={16} />
    },
    {
      value: 'BOLETO',
      label: 'Boleto Bancário',
      color: '#1890ff',
      icon: <BoletoIcon width={16} height={16} />
    },
    {
      value: 'TRANSFERENCIA',
      label: 'Transferência Bancária',
      color: '#722ed1',
      icon: <TransferenciaIcon width={16} height={16} />
    },
    {
      value: 'DINHEIRO',
      label: 'Dinheiro',
      color: '#faad14',
      icon: '💰'
    },
    {
      value: 'CHEQUE',
      label: 'Cheque',
      color: '#f5222d',
      icon: '📄'
    },
  ];

  // Função para buscar contas correntes com credenciais de pagamentos
  const fetchContasDisponiveis = async () => {
    setLoadingContas(true);
    try {
      const response = await axiosInstance.get('/api/pagamentos/contas-disponiveis');
      setContasDisponiveis(response.data || []);
      if (response.data && response.data.length > 0) {
        setContaSelecionada(response.data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar contas disponíveis:', error);
      showNotification('error', 'Erro', 'Erro ao carregar contas correntes disponíveis');
    } finally {
      setLoadingContas(false);
    }
  };

  const confirmacaoDesabilitada = !dataPagamentoSelecionada || !formaPagamentoSelecionada || 
    (formaPagamentoSelecionada === 'PIX - API' && !contaSelecionada);


  return (
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
          <DollarOutlined style={{ marginRight: 8 }} />
          Pagamentos Pendentes - {capitalizeName(turmaNome || '')}
        </span>
      }
      open={open}
      onCancel={fecharModal}
      width={isMobile ? '95vw' : 1400}
      footer={null}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      <div style={{ 
        position: 'relative',
        minHeight: loading ? '400px' : 'auto'
      }}>
        {/* Overlay de Loading */}
        {(loading || loadingPagamento) && (
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
            borderRadius: '8px',
            minHeight: '400px'
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
                {loading ? 'Carregando pagamentos pendentes...' : 'Processando pagamentos...'}
              </div>
            </div>
          </div>
        )}

        {dados ? (
        <div>
          {/* Informações da Turma */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Turma" : "Informações da Turma"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
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
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >

            {/* Nome da Turma */}
            <div style={{
              marginBottom: isMobile ? '16px' : '20px',
              padding: isMobile ? '8px 0' : '12px 0'
            }}>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                color: '#8c8c8c',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Nome da Turma
              </div>
              <div style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: '8px'
              }}>
                🏢 {capitalizeName(turmaNome || '')}
              </div>
              <Divider style={{ margin: '8px 0' }} />
            </div>

            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Pendente" : "Total Pendente"}
                  value={dados.resumo.totalPendente}
                  prefix={<DollarOutlined />}
                  formatter={value => formatCurrency(value)}
                  valueStyle={{
                    color: '#fa8c16',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Colheitas" : "Colheitas Pendentes"}
                  value={dados.resumo.quantidadeColheitas}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{
                    color: '#722ed1',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Pedidos"
                  value={dados.resumo.quantidadePedidos}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{
                    color: '#1890ff',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Frutas"
                  value={dados.resumo.quantidadeFrutas}
                  prefix={<AppleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{
                    color: '#52c41a',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
            </Row>


            {dados.turma.chavePix && (
              <div style={{ marginTop: '16px' }}>
                <Alert
                  message={
                    <Space>
                      <CreditCardOutlined />
                      <strong>Chave PIX:</strong>
                      <Text code>{dados.turma.chavePix}</Text>
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                />
              </div>
            )}
          </Card>

          {/* Busca e Filtros */}
          <Card
            title={
              <Space>
                <FilterOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Buscar" : "Busca e Filtros"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
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
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, 16]} wrap={isMobile}>
            <Col xs={24} sm={24} md={15}>
              <Input
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Buscar por cliente, pedido ou placa"
                allowClear
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                value={filtroDataColheita}
                onChange={(value) => setFiltroDataColheita(value)}
                allowClear
                format="DD/MM/YYYY"
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
                disabledDate={(current) => current && current > moment().endOf('day')}
                placeholder={['Data Início', 'Data Fim']}
              />
            </Col>
            <Col xs={24} sm={12} md={3}>
              <SecondaryButton
                icon={<FilterOutlined />}
                onClick={limparFiltros}
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
                disabled={!filtrosAtivos}
              >
                Limpar
              </SecondaryButton>
            </Col>
          </Row>
          </Card>

          {/* Tabela de Colheitas */}
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Colheitas" : "Colheitas Pendentes"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
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
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >

            {colheitasFiltradas.length > 0 ? (
              <>
                <ResponsiveTable
                  columns={colunas}
                  dataSource={colheitasFiltradas}
                  rowKey="id"
                  minWidthMobile={1200}
                  showScrollHint={true}
                  components={{
                    body: {
                      row: ({ children, record, ...props }) => (
                        <LinhaComAnimacao
                          {...props}
                          $sendoPago={itensSendoPagos.includes(record?.id)}
                          $comCheckmark={itensComCheckmark.includes(record?.id)}
                          $itemPago={record?.statusPagamento === 'PAGO'}
                          $itemProcessando={record?.statusPagamento === 'PROCESSANDO'}
                        >
                          {children}
                        </LinhaComAnimacao>
                      ),
                    },
                  }}
                />

                {/* Área de Pagamento - Sempre visível */}
                <Divider />
                <div style={{
                  backgroundColor: '#f6ffed',
                  padding: isMobile ? '12px' : '16px',
                  borderRadius: '8px'
                }}>
                  <Row gutter={isMobile ? [8, 12] : [16, 16]} align="middle">
                    <Col xs={12} md={6}>
                      <Statistic
                        title={
                          isMobile
                            ? (colheitasSelecionadas.length > 0 ? "Selecionados" : "Total")
                            : (colheitasSelecionadas.length > 0 ? "Itens Selecionados" : "Total de Itens")
                        }
                        value={colheitasSelecionadas.length > 0 ? colheitasSelecionadas.length : colheitasFiltradas.length}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{
                          color: '#52c41a',
                          fontSize: isMobile ? '1rem' : '1.5rem'
                        }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title={isMobile ? "Colhido" : "Total Colhido"}
                      value={totaisColhidos.map(item => `${item.total.toLocaleString('pt-BR')} ${item.unidade}`).join(', ')}
                        prefix={<AppleOutlined />}
                        valueStyle={{
                          color: '#0ea5e9',
                          fontSize: isMobile ? '1rem' : '1.5rem'
                        }}
                        formatter={(value) => (
                          <div style={{ 
                            fontSize: isMobile ? '1rem' : '1.5rem',
                            color: '#0ea5e9',
                            fontWeight: '600'
                          }}>
                          {totaisColhidos.map((item, index) => (
                              <span key={index} style={{ marginRight: '8px' }}>
                                <span style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
                                  {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span style={{ 
                                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                                  color: '#8c8c8c',
                                  marginLeft: '4px',
                                  textTransform: 'uppercase',
                                  fontWeight: 'normal'
                                }}>
                                  {item.unidade}
                                </span>
                              {index < totaisColhidos.length - 1 && !isMobile && (
                                  <span style={{ 
                                    color: '#000000',
                                    margin: '0 15px',
                                    fontSize: '1.5rem',
                                    verticalAlign: 'middle',
                                    display: 'inline-block',
                                    lineHeight: '1',
                                    transform: 'translateY(-4px)'
                                  }}>
                                    •
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title={isMobile ? "A Pagar" : "Total a Pagar"}
                        value={totalAPagar}
                        prefix={<DollarOutlined />}
                        formatter={value => formatCurrency(value)}
                        valueStyle={{
                          color: '#059669',
                          fontSize: isMobile ? '1rem' : '1.25rem'
                        }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <Button
                        type="primary"
                        size={isMobile ? "middle" : "large"}
                        icon={<DollarOutlined />}
                        onClick={abrirModalConfirmacao}
                        loading={loadingPagamento}
                        style={{
                          backgroundColor: '#059669',
                          borderColor: '#059669',
                          width: '100%',
                          marginTop: isMobile ? '8px' : '0'
                        }}
                      >
                        {isMobile
                          ? (colheitasSelecionadas.length > 0 ? 'Pagar Selecionados' : 'Pagar Todos')
                          : (colheitasSelecionadas.length > 0 ? 'Pagar Selecionados' : 'Pagar Todos')
                        }
                      </Button>
                    </Col>
                  </Row>

                  <Row style={{ marginTop: isMobile ? '12px' : '16px' }}>
                    <Col span={24}>
                      <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                        <Space>
                          <MessageOutlined style={{ color: '#059669' }} />
                          <span style={{
                            fontWeight: '700',
                            color: '#333',
                            fontSize: isMobile ? '12px' : '14px'
                          }}>
                            {isMobile ? 'Observações' : 'Observações do Pagamento'}
                          </span>
                        </Space>
                      </div>
                      <TextArea
                        rows={isMobile ? 2 : 3}
                        placeholder={isMobile ? "Observações (opcional)" : "Observações sobre o pagamento (opcional)"}
                        value={observacoesPagamento}
                        onChange={(e) => setObservacoesPagamento(e.target.value)}
                        style={{
                          borderRadius: 6,
                          borderColor: "#d9d9d9",
                          fontSize: isMobile ? '14px' : '16px'
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={filtrosAtivos ? "Nenhuma colheita encontrada com os filtros aplicados" : "Nenhuma colheita pendente"}
                style={{ padding: '40px' }}
              />
            )}
          </Card>

          {/* Footer customizado */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}>
            <Button onClick={fecharModal} size="large">
              Fechar
            </Button>
          </div>
        </div>
        ) : !loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Empty
              description="Nenhum dado encontrado"
              style={{ color: '#8c8c8c' }}
            />
          </div>
        ) : null}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmActionModal
        open={modalConfirmacaoAberto}
        onCancel={() => setModalConfirmacaoAberto(false)}
        onConfirm={processarPagamentos}
        title="Confirmar Pagamento"
        confirmText="Confirmar Pagamento"
        cancelText="Cancelar"
        icon={<DollarOutlined />}
        iconColor="#059669"
        confirmDisabled={confirmacaoDesabilitada}
        customContent={
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ 
              fontSize: "48px", 
              color: "#059669", 
              marginBottom: "16px",
              display: "block"
            }}>
              <DollarOutlined />
            </div>
            <Text style={{ 
              fontSize: "16px", 
              fontWeight: "500", 
              color: "#333",
              lineHeight: "1.5",
              marginBottom: "20px",
              display: "block"
            }}>
              Você está prestes a processar os pagamentos das colheitas selecionadas.
            </Text>
            
            {/* Detalhes da operação */}
            <div style={{
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "16px",
              textAlign: "left"
            }}>
              <Text style={{ fontSize: "14px", fontWeight: "600", color: "#059669", display: "block", marginBottom: "8px" }}>
                📋 Detalhes da Operação:
              </Text>
              <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.6" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>👤 Colhedor:</strong> {turmaNome}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>📦 Total de itens:</strong> {totalItensConfirmacao}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>💰 Valor total:</strong> R$ {valorTotalConfirmacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ marginBottom: "0" }}>
                  <strong>ℹ️ Observação:</strong> {mensagemConfirmacao}
                </div>
              </div>
            </div>
            {/* Campos adicionais */}
            <div style={{ marginTop: "16px" }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: "left", marginBottom: "6px" }}>
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <Text strong style={{ color: "#059669" }}>Data do Pagamento</Text>
                    </Space>
                  </div>
                  <MaskedDatePicker
                    value={dataPagamentoSelecionada}
                    onChange={setDataPagamentoSelecionada}
                    size="middle"
                    style={{ borderRadius: 6 }}
                    disabledDate={(current) => {
                      // Se for PIX - API: usar validação do hook (bloqueia domingos e datas anteriores)
                      if (formaPagamentoSelecionada === 'PIX - API') {
                        return disabledDatePixAPI(current);
                      }
                      // Para outros métodos (PIX, DINHEIRO, ESPÉCIE, etc.): não permitir datas futuras
                      // (permitir apenas data atual e anteriores)
                      return current && current > moment().endOf('day');
                    }}
                    placeholder="Selecione a data"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: "left", marginBottom: "6px" }}>
                    <Space>
                      <CreditCardOutlined style={{ color: "#059669" }} />
                      <Text strong style={{ color: "#059669" }}>Método</Text>
                    </Space>
                  </div>
                  <Select
                    value={formaPagamentoSelecionada}
                    onChange={(value) => {
                      setFormaPagamentoSelecionada(value);
                      // Limpar conta selecionada se não for PIX - API
                      if (value !== 'PIX - API') {
                        setContaSelecionada(null);
                      } else if (contasDisponiveis.length > 0 && !contaSelecionada) {
                        // Se for PIX - API e não tiver conta selecionada, selecionar a primeira
                        setContaSelecionada(contasDisponiveis[0].id);
                      }
                    }}
                    placeholder="Selecione a forma"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    {metodosPagamento.map((metodo) => (
                      <Option key={metodo.value} value={metodo.value}>
                        <Space>
                          {typeof metodo.icon === 'string' ? (
                            <span>{metodo.icon}</span>
                          ) : (
                            metodo.icon
                          )}
                          <span>{metodo.label}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              {/* Select de contas correntes quando PIX - API for selecionado */}
              {formaPagamentoSelecionada === 'PIX - API' && (
                <Row gutter={[12, 12]} style={{ marginTop: "12px" }}>
                  <Col xs={24} sm={24}>
                    <div style={{ textAlign: "left", marginBottom: "6px" }}>
                      <Space>
                        <CreditCardOutlined style={{ color: "#059669" }} />
                        <Text strong style={{ color: "#059669" }}>Conta Corrente:</Text>
                      </Space>
                    </div>
                    <Select
                      value={contaSelecionada}
                      onChange={setContaSelecionada}
                      placeholder="Selecione a conta corrente"
                      style={{ width: "100%" }}
                      size="middle"
                      loading={loadingContas}
                      notFoundContent={loadingContas ? <Spin size="small" /> : "Nenhuma conta encontrada"}
                    >
                      {contasDisponiveis.map((conta) => (
                        <Option key={conta.id} value={conta.id}>
                          {conta.agencia} / {conta.contaCorrente} - {conta.nomeBanco || 'Banco do Brasil'}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
              )}
            </div>
            {confirmacaoDesabilitada && (
              <Alert
                type="warning"
                showIcon
                message="Preencha a data e a forma de pagamento para continuar."
                style={{ marginTop: "16px", textAlign: "left" }}
              />
            )}
          </div>
        }
      />

      {/* Loader centralizado para processamento PIX-API */}
      <CentralizedLoader
        visible={loadingPixAPI}
        message={mensagemLoadingPix || "Processando pagamentos via PIX - API..."}
        subMessage={loadingPixAPI ? "Por favor, aguarde. Não feche esta janela." : ""}
        size="large"
      />
    </Modal>
  );
};

TurmaColheitaPagamentosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turmaId: PropTypes.number,
  turmaNome: PropTypes.string,
  onPagamentosProcessados: PropTypes.func,
};

export default TurmaColheitaPagamentosModal;