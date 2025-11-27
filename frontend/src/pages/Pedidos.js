// src/pages/Pedidos.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin, Select, DatePicker, Tag, Segmented, Divider } from "antd";
import {
  ShoppingCartOutlined,
  PlusCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
// Importar ícones do Iconify
import { Icon } from "@iconify/react";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { CentralizedLoader } from "components/common/loaders";
import { PrimaryButton, SecondaryButton, PDFButton } from "components/common/buttons";
import { SearchInput, SearchInputInteligente } from "components/common/search";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../components/Icons/PaymentIcons";
import useResponsive from "../hooks/useResponsive";
import moment from "moment";
import { getFruitIcon } from "../utils/fruitIcons";
import { capitalizeName } from "../utils/formatters";

const PedidosTable = lazy(() => import("../components/pedidos/PedidosTable"));
const EditarPedidoDialog = lazy(() =>
  import("../components/pedidos/EditarPedidoDialog")
);
const NovoPedidoModal = lazy(() => import("../components/pedidos/NovoPedidoModal"));
const ColheitaModal = lazy(() => import("../components/pedidos/ColheitaModal"));
const PrecificacaoModal = lazy(() => import("../components/pedidos/PrecificacaoModal"));
const PagamentoModal = lazy(() => import("../components/pedidos/PagamentoModal"));
const PagamentosAutomaticosModal = lazy(() => import("../components/pedidos/PagamentosAutomaticosModal"));

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Pedidos = () => {
  const { isMobile, isTablet } = useResponsive();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [dataPrevistaFiltroTabela, setDataPrevistaFiltroTabela] = useState(null);
  
  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados da aplicação
  const [loading, setLoading] = useState(false);
  const [totalPedidos, setTotalPedidos] = useState(0);

  // Estados para CentralizedLoader
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");
  
     // Estados para busca e filtros
   const [searchTerm, setSearchTerm] = useState(""); // ✅ Mantido para o input de busca
   const [appliedFilters, setAppliedFilters] = useState([]); // Filtros aplicados via sugestão
   const [statusFilters, setStatusFilters] = useState([]); // ✅ Alterado para array
   const [dateFilterType, setDateFilterType] = useState("criacao"); // 'criacao' ou 'colheita'
   const [quickDateFilter, setQuickDateFilter] = useState(""); // Filtro rápido de período
   const [dateRange, setDateRange] = useState([]);

  // Estados dos modais
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  
  // Estados dos modais específicos
  const [colheitaModalOpen, setColheitaModalOpen] = useState(false);
  const [precificacaoModalOpen, setPrecificacaoModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [pagamentosAutomaticosModalOpen, setPagamentosAutomaticosModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  // Dados auxiliares
  const [clientes, setClientes] = useState([]);

  // Callback para controlar loading dos modais
  const handleModalLoading = useCallback((loading, message) => {
    setCentralizedLoading(loading);
    if (message) {
      setLoadingMessage(message);
    }
  }, []);

  // ✅ FUNÇÃO AUXILIAR: Criar payload de filtros preservando todos os valores
  const buildFiltersPayload = useCallback(() => {
    const filters = [];

    appliedFilters.forEach((filter) => {
      if (!filter || !filter.type || filter.value === undefined || filter.value === null) {
        return;
      }

      const normalizedValue =
        typeof filter.value === "string"
          ? filter.value.trim()
          : filter.value?.toString()?.trim();

      if (!normalizedValue) {
        return;
      }

      filters.push({
        type: filter.type,
        value: normalizedValue,
      });
    });

    return filters;
  }, [appliedFilters]);

  // ✅ FUNÇÃO ATUALIZADA: Buscar pedidos com suporte a filtros aninhados
  const fetchPedidos = useCallback(async (page = 1, limit = 20, filters = [], statuses = [], dataInicio = null, dataFim = null, tipoData = 'criacao') => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando pedidos...");
      setLoading(true);
      const params = new URLSearchParams();
      
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      // ✅ ENVIAR MÚLTIPLOS STATUS
      if (statuses && statuses.length > 0) {
        statuses.forEach(status => params.append('status', status));
      }

      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      if (tipoData) params.append('tipoData', tipoData); // 'criacao' ou 'colheita'

      // ✅ ENVIAR FILTROS ANINHADOS PARA O BACKEND
      if (filters && filters.length > 0) {
        filters.forEach(({ type, value }) => {
          if (type && value) {
            params.append('filters', `${type}:${encodeURIComponent(value)}`);
          }
        });
      }

      const response = await axiosInstance.get(`/api/pedidos?${params.toString()}`);

      setPedidos(response.data.data || []);
      setPedidosFiltrados(response.data.data || []);
      setTotalPedidos(response.data.total || 0);

    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      showNotification("error", "Erro", "Erro ao carregar pedidos");
      setPedidos([]);
      setPedidosFiltrados([]);
      setTotalPedidos(0);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, []);

  // Função para lidar com pedido removido
  const handlePedidoRemovido = useCallback((pedidoId) => {
    // Remover o pedido da lista local
    setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    setPedidosFiltrados(prev => prev.filter(p => p.id !== pedidoId));
    setTotalPedidos(prev => prev - 1);
  }, []);

  // Função para buscar clientes ativos
  const fetchClientes = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/clientes/ativos");
      setClientes(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  }, []);

  // useEffect para carregar dados na inicialização
  useEffect(() => {
    fetchClientes();
    // Carregar todos os pedidos na inicialização (sem filtros)
    fetchPedidos(1, pageSize, [], [], null, null, 'criacao');
  }, [fetchClientes, fetchPedidos, pageSize]);

  // Função para calcular datas dos períodos rápidos
  const calculateQuickDateRange = useCallback((period) => {
    const hoje = moment();
    let dataInicio, dataFim;

    switch (period) {
      case 'hoje':
        dataInicio = hoje.startOf('day');
        dataFim = hoje.endOf('day');
        break;
      case 'semana':
        // ISO Week: Segunda-feira a Domingo (padrão brasileiro)
        // Exemplo: Se hoje é quinta 23/10, pega segunda 20/10 até domingo 26/10
        dataInicio = hoje.clone().startOf('isoWeek');
        dataFim = hoje.clone().endOf('isoWeek');
        break;
      case 'ultimos7':
        dataInicio = hoje.clone().subtract(7, 'days').startOf('day');
        dataFim = hoje.endOf('day');
        break;
      case 'ultimos15':
        dataInicio = hoje.clone().subtract(15, 'days').startOf('day');
        dataFim = hoje.endOf('day');
        break;
      case 'ultimos30':
        dataInicio = hoje.clone().subtract(30, 'days').startOf('day');
        dataFim = hoje.endOf('day');
        break;
      default:
        return null;
    }

    return [dataInicio, dataFim];
  }, []);

  const getCurrentDateFilterParams = useCallback(() => {
    let dataInicio = null;
    let dataFim = null;
    let tipoDataParaEnviar = dateFilterType;

    if (dataPrevistaFiltroTabela) {
      const dataMoment = moment(dataPrevistaFiltroTabela, 'YYYY-MM-DD');
      dataInicio = dataMoment.clone().startOf('day').toISOString();
      dataFim = dataMoment.clone().endOf('day').toISOString();
      tipoDataParaEnviar = 'colheita';
    } else if (quickDateFilter) {
      const calculatedDates = calculateQuickDateRange(quickDateFilter);
      if (calculatedDates) {
        dataInicio = calculatedDates[0].toISOString();
        dataFim = calculatedDates[1].toISOString();
      }
    } else if (dateRange && dateRange.length === 2) {
      dataInicio = dateRange[0].toISOString();
      dataFim = dateRange[1].toISOString();
    }

    if (!dataPrevistaFiltroTabela && !(dataInicio && dataFim)) {
      tipoDataParaEnviar = 'criacao';
    }

    return { dataInicio, dataFim, tipoData: tipoDataParaEnviar };
  }, [dateFilterType, dataPrevistaFiltroTabela, quickDateFilter, dateRange, calculateQuickDateRange]);

  const handleRefreshPedidos = useCallback(() => {
    const { dataInicio, dataFim, tipoData } = getCurrentDateFilterParams();
    fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);
  }, [
    fetchPedidos,
    currentPage,
    pageSize,
    buildFiltersPayload,
    statusFilters,
    getCurrentDateFilterParams,
  ]);

  // ✅ Helper centralizado: retorna datas e tipo de data atualmente ativos
  const getActiveDateParams = useCallback(() => {
    let dataInicio = null;
    let dataFim = null;
    let tipoData = dateFilterType;

    if (quickDateFilter) {
      const calculatedDates = calculateQuickDateRange(quickDateFilter);
      if (calculatedDates) {
        dataInicio = calculatedDates[0].toISOString();
        dataFim = calculatedDates[1].toISOString();
      }
    } else if (dateRange && dateRange.length === 2) {
      dataInicio = dateRange[0].toISOString();
      dataFim = dateRange[1].toISOString();
    }

    // Se não há filtro de data ativo, force 'criacao' por consistência com a listagem padrão
    if (!(dataInicio && dataFim)) {
      tipoData = 'criacao';
    }

    return { dataInicio, dataFim, tipoData };
  }, [quickDateFilter, dateRange, dateFilterType, calculateQuickDateRange]);

  // ✅ NOVA LÓGICA: Processar todos os filtros aninhados corretamente
  useEffect(() => {
    const { dataInicio, dataFim, tipoData } = getCurrentDateFilterParams();
    fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);
  }, [
    fetchPedidos,
    currentPage,
    pageSize,
    buildFiltersPayload,
    statusFilters,
    getCurrentDateFilterParams,
  ]);

  // Funções de manipulação de filtros
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    // Não aplicar filtro automaticamente - só atualizar o termo de busca
  }, []);

  // Função para processar ícone correto para filtros de vale
  const getFilterIcon = useCallback((suggestion) => {
    if (suggestion.type === 'vale' && suggestion.metadata?.metodoPagamento) {
      const metodo = suggestion.metadata.metodoPagamento;
      switch (metodo) {
        case 'PIX':
          return <PixIcon width={14} height={14} style={{ marginRight: '2px' }} />;
        case 'BOLETO':
          return <BoletoIcon width={14} height={14} style={{ marginRight: '2px' }} />;
        case 'TRANSFERENCIA':
          return <TransferenciaIcon width={14} height={14} style={{ marginRight: '2px' }} />;
        case 'DINHEIRO':
          return '💰';
        case 'CHEQUE':
          return '📄';
        default:
          return suggestion.icon;
      }
    }
    // Ícones de frutas/culturas via fruitIcons
    if (suggestion.type === 'fruta') {
      return getFruitIcon(suggestion.value, { width: 14, height: 14, style: { marginRight: '2px' } });
    }
    if (suggestion.type === 'cultura') {
      return getFruitIcon(suggestion.value, { width: 14, height: 14, style: { marginRight: '2px' } });
    }
    if (suggestion.type === 'turma') {
      return '🧑‍🌾';
    }
    return suggestion.icon;
  }, []);

  // Função para lidar com seleção de sugestão
  const handleSuggestionSelect = useCallback((suggestion) => {
    // Processar sugestão para ter o ícone correto
    const processedSuggestion = {
      ...suggestion,
      icon: getFilterIcon(suggestion)
    };

    // ✅ CORREÇÃO: Para tipos com ID, usar ID para filtro exato
      if (suggestion.metadata?.id) {
      if (suggestion.type === 'cliente') {
        processedSuggestion.value = suggestion.metadata.id.toString();
        processedSuggestion.displayValue = capitalizeName(suggestion.value);
      } else if (suggestion.type === 'fruta') {
        processedSuggestion.value = suggestion.metadata.id.toString();
        processedSuggestion.displayValue = capitalizeName(suggestion.value);
      } else if (suggestion.type === 'area') {
        processedSuggestion.value = suggestion.metadata.id.toString();
        processedSuggestion.displayValue = capitalizeName(suggestion.value);
      } else if (suggestion.type === 'cultura') {
        // Novo filtro por cultura, segue padrão de fruta (ID numérico)
        processedSuggestion.value = suggestion.metadata.id.toString();
        processedSuggestion.displayValue = capitalizeName(suggestion.value);
      } else if (suggestion.type === 'numero') {
        // Para número de pedido, usar o número mesmo (não o ID)
        processedSuggestion.value = suggestion.value;
      } else if (suggestion.type === 'turma') {
        processedSuggestion.value = suggestion.metadata.id.toString();
        processedSuggestion.displayValue = capitalizeName(suggestion.metadata.nome || suggestion.value);
      }
    }

    // Tratar tipos que não usam metadata.id mas devem capitalizar para exibição
    if (!suggestion.metadata?.id) {
      if (['cliente', 'fruta', 'cultura', 'area', 'motorista', 'fornecedor', 'turma'].includes(suggestion.type)) {
        processedSuggestion.displayValue = capitalizeName(processedSuggestion.displayValue || suggestion.value);
      }
    }

    setAppliedFilters(prev => [...prev, processedSuggestion]);
    setSearchTerm(""); // Limpar input para permitir novo filtro
    setCurrentPage(1);
  }, [getFilterIcon]);

  const handleStatusFilter = useCallback((statuses) => {
    // Se "TODOS" foi selecionado, limpar todos os outros
    if (statuses.includes('TODOS')) {
      // Se já tinha "TODOS" e selecionou outro, remover "TODOS"
      if (statusFilters.includes('TODOS') && statuses.length > 1) {
        const semTodos = statuses.filter(s => s !== 'TODOS');
        setStatusFilters(semTodos);
      } else {
        // Se acabou de selecionar "TODOS", limpar tudo e deixar só ele
        setStatusFilters([]);
      }
    } else {
      // Se selecionou qualquer outro status, garantir que "TODOS" não está na lista
      setStatusFilters(statuses.filter(s => s !== 'TODOS'));
    }
    setCurrentPage(1);
  }, [statusFilters]);

  // Handler para filtro rápido de período
  const handleQuickDateChange = useCallback((value) => {
    setQuickDateFilter(value);
    if (value) {
      // Limpa o RangePicker (excludente)
      setDateRange([]);
    }
    setCurrentPage(1);
  }, []);

  // Handler para RangePicker
  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates || []);
    if (dates && dates.length > 0) {
      // Limpa o período rápido (excludente)
      setQuickDateFilter("");
    }
    setCurrentPage(1);
  }, []);

     // ✅ Função para limpar filtros
   const handleClearFilters = useCallback(() => {
     setSearchTerm("");
     setAppliedFilters([]);
     setStatusFilters([]); // Reset para "Todos"
     setDateFilterType("criacao"); // Reset para "Criação"
     setQuickDateFilter(""); // Reset filtro rápido de período
     setDateRange([]);
    setDataPrevistaFiltroTabela(null);
     setCurrentPage(1);
   }, []);

  /**
   * ✅ Função para gerar PDF dos pedidos
   * 
   * IMPLEMENTAÇÃO FUTURA:
   * Esta função será responsável por gerar um relatório PDF dos pedidos filtrados.
   * 
   * Opções de implementação:
   * 
   * 1. PASSAR FILTROS PARA O BACKEND:
   *    - Enviar todos os filtros ativos para uma rota de PDF no backend
   *    - Backend executa a query com os filtros e gera o PDF
   *    - Vantagem: Backend controla a geração, melhor para grandes volumes
   *    - Endpoint sugerido: POST /api/pedidos/exportar-pdf
   * 
   * 2. PASSAR DADOS JÁ FILTRADOS:
   *    - Usar o array 'pedidos' que já está filtrado no frontend
   *    - Enviar os dados para o backend ou gerar no próprio frontend
   *    - Vantagem: Garante que o PDF contém exatamente o que o usuário vê
   *    - Bibliotecas sugeridas: jsPDF, pdfmake, react-pdf
   * 
   * 3. HÍBRIDO:
   *    - Enviar filtros + dados de paginação
   *    - Backend valida e complementa informações
   *    - Retorna PDF com dados completos e formatados
   * 
   * DADOS A INCLUIR NO PDF:
   * - Título: "Relatório de Pedidos"
   * - Data de geração
   * - Filtros aplicados (descrição legível)
   * - Tabela com pedidos: número, cliente, data, frutas, status, valores
   * - Totalizadores: quantidade de pedidos, valor total, etc.
   * - Logo da empresa (opcional)
   * 
   * BIBLIOTECAS RECOMENDADAS:
   * - Backend: PDFKit (Node.js), Puppeteer (HTML to PDF)
   * - Frontend: jsPDF, pdfmake, react-pdf
   */
  const handleGeneratePdf = useCallback(() => {
    // ✅ COLETA DE FILTROS ATIVOS
    const filtrosAtivos = [];

    // Filtros de busca com chips
    if (appliedFilters.length > 0) {
      appliedFilters.forEach(filter => {
        filtrosAtivos.push(`${filter.label}: ${filter.displayValue || filter.value}`);
      });
    }

    // Filtro de status
    if (statusFilters.length > 0) {
      const statusNomes = statusFilters.map(s => s.replace(/_/g, ' ')).join(', ');
      filtrosAtivos.push(`Status: ${statusNomes}`);
    }

    // Filtro de período rápido
    if (quickDateFilter) {
      const periodoNome = 
        quickDateFilter === 'hoje' ? 'Hoje' :
        quickDateFilter === 'semana' ? 'Esta semana' :
        quickDateFilter === 'ultimos7' ? 'Últimos 7 dias' :
        quickDateFilter === 'ultimos15' ? 'Últimos 15 dias' :
        quickDateFilter === 'ultimos30' ? 'Últimos 30 dias' : quickDateFilter;
      
      const tipoDt = dateFilterType === 'criacao' ? 'Criação' : 'Previsão Colheita';
      filtrosAtivos.push(`${tipoDt}: ${periodoNome}`);
    }

    // Filtro de range de datas
    if (dateRange.length > 0) {
      const tipoDt = dateFilterType === 'criacao' ? 'Criação' : 'Previsão Colheita';
      const periodo = `${dateRange[0]?.format('DD/MM/YYYY')} - ${dateRange[1]?.format('DD/MM/YYYY')}`;
      filtrosAtivos.push(`${tipoDt}: ${periodo}`);
    }

    // ✅ INFORMAÇÕES ADICIONAIS PARA O PDF
    const dadosParaPdf = {
      // Filtros aplicados
      filtros: filtrosAtivos,
      
      // Dados dos pedidos (usar o array 'pedidos' que já está no estado)
      pedidos: pedidos,
      
      // Total de registros
      totalRegistros: totalPedidos,
      
      // Paginação atual
      paginacao: {
        paginaAtual: currentPage,
        registrosPorPagina: pageSize,
        totalPaginas: Math.ceil(totalPedidos / pageSize)
      },
      
      // Data de geração
      dataGeracao: moment().format('DD/MM/YYYY HH:mm:ss'),
      
      // Tipo de data usado no filtro
      tipoDataFiltro: dateFilterType,
    };

    // ✅ POR ENQUANTO: Mostrar notificação com os filtros ativos
    // PRÓXIMO PASSO: Chamar API ou biblioteca de PDF
    if (filtrosAtivos.length === 0) {
      showNotification(
        'info',
        'Gerar PDF',
        'Nenhum filtro ativo. O PDF será gerado com todos os pedidos da página atual.'
      );
    } else {
      const mensagem = filtrosAtivos.join(' | ');
      showNotification(
        'success',
        'Em desenvolvimento',
        `Filtros que serão aplicados: ${mensagem}`
      );
    }

    // TODO: Implementar geração de PDF
    console.log('📄 Dados preparados para PDF:', dadosParaPdf);
    
    /*
    // EXEMPLO DE CHAMADA AO BACKEND (descomentar quando implementar):
    
    try {
      const response = await axiosInstance.post('/api/pedidos/exportar-pdf', {
        filtros: dadosParaPdf.filtros,
        // Opção 1: Enviar apenas os filtros
        filtrosQuery: {
          appliedFilters,
          statusFilters,
          dateRange: dateRange.length > 0 ? {
            inicio: dateRange[0].toISOString(),
            fim: dateRange[1].toISOString()
          } : null,
          quickDateFilter,
          dateFilterType
        },
        // Opção 2: Enviar os dados já filtrados
        dadosPedidos: pedidos,
        // Metadados
        metadata: {
          dataGeracao: dadosParaPdf.dataGeracao,
          totalRegistros: dadosParaPdf.totalRegistros,
          paginacao: dadosParaPdf.paginacao
        }
      }, {
        responseType: 'blob' // Para receber o PDF como blob
      });

      // Criar URL do blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedidos_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      showNotification('success', 'PDF gerado com sucesso!', 'O download iniciará em instantes.');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showNotification('error', 'Erro ao gerar PDF', error.message);
    }
    */
  }, [appliedFilters, statusFilters, quickDateFilter, dateRange, dateFilterType, pedidos, totalPedidos, currentPage, pageSize]);

  // Funções de manipulação de modais
  const handleOpenCreateModal = useCallback(() => {
    setPedidoEditando(null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setPedidoEditando(null);
  }, []);

  // Funções específicas para cada tipo de modal
  const handleOpenColheitaModal = useCallback((pedido) => {
    // ✅ Pedido já vem com maoObra da listagem principal
    setPedidoSelecionado(pedido);
    setColheitaModalOpen(true);
  }, []);

  const handleOpenPrecificacaoModal = useCallback((pedido) => {
    setPedidoSelecionado(pedido);
    setPrecificacaoModalOpen(true);
  }, []);

  const handleOpenPagamentoModal = useCallback((pedido) => {
    setPedidoSelecionado(pedido);
    setPagamentoModalOpen(true);
  }, []);

  // Função para salvar pedido
  const handleSavePedido = useCallback(async (pedidoData) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage(pedidoEditando ? "Atualizando pedido..." : "Criando pedido...");
      setLoading(true);

      if (pedidoEditando) {
        // Nova rota de edição completa
        await axiosInstance.patch(`/api/pedidos/${pedidoEditando.id}/editar-completo`, pedidoData);
        showNotification("success", "Sucesso", "Pedido atualizado com sucesso!");
      } else {
        await axiosInstance.post("/api/pedidos", pedidoData);
        showNotification("success", "Sucesso", "Pedido criado com sucesso!");
      }
      
      handleCloseModal();
      // ✅ Recarregar respeitando TODOS os filtros ativos (inclui datas)
      const { dataInicio, dataFim, tipoData } = getActiveDateParams();
      await fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);
      
    } catch (error) {
      // Verificar se é erro de pedido duplicado - relançar para o modal tratar
      const errorData = error?.response?.data;
      if (errorData?.code === 'PEDIDO_DUPLICADO') {
        // Relançar o erro para que o NovoPedidoModal possa tratá-lo
        throw error;
      }
      
      // Para outros erros, mostrar notificação
      console.error("Erro ao salvar pedido:", error);
      const message = errorData?.message || "Erro ao salvar pedido";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [pedidoEditando, fetchPedidos, currentPage, pageSize, buildFiltersPayload, statusFilters, dateFilterType, handleCloseModal, getActiveDateParams]);

  // Função para atualizar colheita
  const handleSaveColheita = useCallback(async (colheitaData) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Registrando colheita...");
      setLoading(true);

      // ✅ Apenas salvar colheita, SEM recarregar lista aqui
      // A lista será recarregada DEPOIS que a mão de obra for salva
      const response = await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/colheita`, colheitaData);
      return response.data; // Retornar dados para o ColheitaModal usar

    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const message = error.response?.data?.message || "Erro ao registrar colheita";
      showNotification("error", "Erro", message);
      throw error;
    }
  }, [pedidoSelecionado]);

  // ✅ NOVO: Callback para finalizar salvamento (chamado APÓS salvar mão de obra)
  const handleColheitaCompleta = useCallback(async () => {
    try {
      setLoadingMessage("Atualizando lista de pedidos...");
      
      // Recarregar lista DEPOIS de salvar tudo (colheita + mão de obra), respeitando filtros
      const { dataInicio, dataFim, tipoData } = getActiveDateParams();
      await fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);

      showNotification("success", "Sucesso", "Colheita registrada com sucesso!");
      setColheitaModalOpen(false);
      setPedidoSelecionado(null);
    } catch (error) {
      console.error("Erro ao atualizar lista:", error);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [fetchPedidos, currentPage, pageSize, buildFiltersPayload, statusFilters, dateFilterType]);

  // Função para atualizar precificação
  const handleSavePrecificacao = useCallback(async (precificacaoData) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Definindo precificação...");
      setLoading(true);

      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/precificacao`, precificacaoData);
      showNotification("success", "Sucesso", "Precificação realizada com sucesso!");

      setPrecificacaoModalOpen(false);
      setPedidoSelecionado(null);

      setLoadingMessage("Atualizando lista de pedidos...");
      // ✅ Respeitar filtros ativos no recarregamento
      const { dataInicio, dataFim, tipoData } = getActiveDateParams();
      await fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);

    } catch (error) {
      console.error("Erro ao definir precificação:", error);
      const message = error.response?.data?.message || "Erro ao definir precificação";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [pedidoSelecionado, fetchPedidos, currentPage, pageSize, buildFiltersPayload, statusFilters, dateFilterType]);

  // Função para criar novo pagamento
  const handleNovoPagamento = useCallback(async (pagamentoData) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage(pagamentoData.id ? "Atualizando pagamento..." : "Registrando pagamento...");
      setLoading(true);

      if (pagamentoData.id) {
        // Edição - usar PATCH (remover id do body)
        const { id, ...dadosSemId } = pagamentoData;
        await axiosInstance.patch(`/api/pedidos/pagamentos/${id}`, dadosSemId);
        showNotification("success", "Sucesso", "Pagamento atualizado com sucesso!");
      } else {
        // Criação - usar POST
        await axiosInstance.post('/api/pedidos/pagamentos', pagamentoData);
        showNotification("success", "Sucesso", "Pagamento registrado com sucesso!");
      }

      setLoadingMessage("Atualizando lista de pedidos...");
      // Atualizar lista de pedidos respeitando filtros ativos
      const { dataInicio, dataFim, tipoData } = getActiveDateParams();
      await fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);

      // Atualizar pedido selecionado com os dados mais recentes
      if (pedidoSelecionado) {
        const response = await axiosInstance.get(`/api/pedidos/${pedidoSelecionado.id}`);
        setPedidoSelecionado(response.data);
      }

    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      const message = error.response?.data?.message || "Erro ao processar pagamento";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [fetchPedidos, currentPage, pageSize, buildFiltersPayload, statusFilters, pedidoSelecionado]);

  // Função para remover pagamento
  const handleRemoverPagamento = useCallback(async (pagamentoId) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Removendo pagamento...");
      setLoading(true);

      await axiosInstance.delete(`/api/pedidos/pagamentos/${pagamentoId}`);
      showNotification("success", "Sucesso", "Pagamento removido com sucesso!");

      setLoadingMessage("Atualizando lista de pedidos...");
      // Atualizar lista de pedidos respeitando filtros ativos
      const { dataInicio, dataFim, tipoData } = getActiveDateParams();
      await fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);

      // Atualizar pedido selecionado com os dados mais recentes
      if (pedidoSelecionado) {
        const response = await axiosInstance.get(`/api/pedidos/${pedidoSelecionado.id}`);
        setPedidoSelecionado(response.data);
      }

    } catch (error) {
      console.error("Erro ao remover pagamento:", error);
      const message = error.response?.data?.message || "Erro ao remover pagamento";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [fetchPedidos, currentPage, pageSize, buildFiltersPayload, statusFilters, pedidoSelecionado]);

  // Função para quando ajustes financeiros são salvos (frete, ICMS, desconto, avaria)
  const handleAjustesSalvos = useCallback(async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Atualizando dados do pedido...");

      // Atualizar lista de pedidos respeitando filtros ativos
      const { dataInicio, dataFim, tipoData } = getActiveDateParams();
      await fetchPedidos(currentPage, pageSize, buildFiltersPayload(), statusFilters, dataInicio, dataFim, tipoData);

      // Atualizar pedido selecionado com os dados mais recentes
      if (pedidoSelecionado) {
        const response = await axiosInstance.get(`/api/pedidos/${pedidoSelecionado.id}`);
        setPedidoSelecionado(response.data);
      }
    } catch (error) {
      console.error("Erro ao atualizar após ajustes:", error);
      // Não mostrar notificação aqui pois o modal já mostrou
    } finally {
      setCentralizedLoading(false);
    }
  }, [fetchPedidos, currentPage, pageSize, buildFiltersPayload, statusFilters, dateFilterType, pedidoSelecionado]);

  return (
    <Box 
      sx={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        gap: 2,
        p: 2
      }}
    >
      {/* Header com título */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 2 : 0,
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <Title
            level={isMobile ? 3 : 2} /* ✅ level={3} no mobile para evitar quebra de linha */
            style={{
              margin: 0,
              color: "#2E7D32",
              marginBottom: 8,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Icon 
              icon="mdi:cart" 
              style={{ 
                marginRight: 8, 
                fontSize: isMobile ? '26px' : '31px',
                color: "#2E7D32"
              }} 
            />
            Sistema de Pedidos
          </Title>
          <Text
            type="secondary"
            style={{
              fontSize: "14px",
              display: 'block',
              textAlign: 'left'
            }}
          >
            Gerencie o fluxo completo dos pedidos: criação, colheita, precificação e pagamento
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefreshPedidos}
          loading={loading}
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: '#f6ffed',
            borderColor: '#b7eb8f',
            color: '#52c41a',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderWidth: '2px',
            height: isMobile ? '32px' : '40px',
            padding: isMobile ? '0 12px' : '0 16px',
            fontSize: '0.875rem',
            alignSelf: isMobile ? 'flex-start' : 'center',
          }}
        >
          Atualizar
        </Button>
      </Box>

             {/* Seção de Filtros Reorganizada */}
       <Box
         sx={{
           p: isMobile ? 2 : 3,
           bgcolor: "#f9f9f9",
           borderRadius: 2,
           border: "1px solid #e8e8e8",
           mb: 0
         }}
       >
        <Box sx={{ mb: 2 }}>
          <Text strong style={{ color: "#2E7D32", fontSize: isMobile ? "0.875rem" : "1rem" }}>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filtros de Busca
          </Text>
        </Box>

                 {/* Linha de Filtros */}
                  <Box
            sx={{
              display: "flex",
              gap: isMobile ? 1 : 2,
              mb: 0,
              flexWrap: "wrap",
              flexDirection: isMobile ? 'column' : 'row'
            }}
          >
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 250px" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              Buscar pedidos:
            </Text>
            <SearchInputInteligente
              placeholder={isMobile ? "Buscar..." : "Digite nome, número, vale, motorista ou placa..."}
              value={searchTerm}
              onChange={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                marginBottom: "0",
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            />
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 220px" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              Status:
            </Text>
            <Select
              mode="multiple"
              allowClear
              value={statusFilters}
              onChange={handleStatusFilter}
              size={isMobile ? "small" : "middle"}
              maxTagCount={0}
              maxTagPlaceholder={(omittedValues) => `${omittedValues.length} selecionado(s)`}
              placeholder="Selecione o status"
              style={{
                width: "100%",
                marginBottom: "0",
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            >
              <Option value="TODOS">
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Todos
              </Option>

              <Option value="PEDIDO_CRIADO">
                <ShoppingCartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Pedido Criado
              </Option>
              <Option value="AGUARDANDO_COLHEITA">
                <ShoppingOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Aguardando Colheita
              </Option>
              <Option value="COLHEITA_PARCIAL">
                <CheckCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Colheita Parcial
              </Option>
              <Option value="COLHEITA_REALIZADA">
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Colheita Realizada
              </Option>
              <Option value="AGUARDANDO_PRECIFICACAO">
                <DollarOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                Aguardando Precificação
              </Option>
              <Option value="PRECIFICACAO_REALIZADA">
                <CheckCircleOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
                Precificação Realizada
              </Option>
              <Option value="AGUARDANDO_PAGAMENTO">
                <CreditCardOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Aguardando Pagamento
              </Option>
              <Option value="PAGAMENTO_PARCIAL">
                <CreditCardOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Pagamento Parcial
              </Option>
              <Option value="PAGAMENTO_REALIZADO">
                <CheckCircleOutlined style={{ marginRight: 8, color: '#a0d911' }} />
                Pagamento Realizado
              </Option>
              <Option value="PEDIDO_FINALIZADO">
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Pedido Finalizado
              </Option>
              <Option value="CANCELADO">
                <CloseCircleOutlined style={{ marginRight: 8, color: '#f5222d' }} />
                Cancelado
              </Option>
            </Select>
          </Box>

          {/* Divider entre filtros de status e toggle de data */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>
            <Divider 
              type="vertical" 
              style={{ 
                height: isMobile ? "32px" : "48px",
                margin: 0,
                borderColor: "#d9d9d9",
                borderWidth: "1px"
              }} 
            />
          </Box>

          {/* Toggle de Tipo de Data */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              Data:
            </Text>
            <Segmented
              options={[
                { label: 'Criação', value: 'criacao' },
                { label: 'Colheita', value: 'colheita' }
              ]}
              value={dateFilterType}
              onChange={setDateFilterType}
              size={isMobile ? "small" : "middle"}
              style={{
                fontWeight: "500"
              }}
            />
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 180px" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              Período:
            </Text>
            <Select
              value={quickDateFilter}
              onChange={handleQuickDateChange}
              size={isMobile ? "small" : "middle"}
              placeholder="Selecione"
              allowClear
              style={{
                width: "100%",
                height: isMobile ? "32px" : "40px",
                marginBottom: "0",
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            >
              <Option value="">
                <CalendarOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                Personalizado
              </Option>
              <Option value="hoje">
                <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Hoje
              </Option>
              <Option value="semana">
                <CalendarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Esta semana
              </Option>
              <Option value="ultimos7">
                <CalendarOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Últimos 7 dias
              </Option>
              <Option value="ultimos15">
                <CalendarOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Últimos 15 dias
              </Option>
              <Option value="ultimos30">
                <CalendarOutlined style={{ marginRight: 8, color: '#eb2f96' }} />
                Últimos 30 dias
              </Option>
            </Select>
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 240px" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              {dateFilterType === 'criacao' ? 'Data de Criação:' : 'Data Prevista Colheita:'}
            </Text>
                         <RangePicker
               value={dateRange}
               onChange={handleDateRangeChange}
               placeholder={["Início", "Fim"]}
               format="DD/MM/YYYY"
               size={isMobile ? "small" : "middle"}
               style={{
                 width: "100%",
                 height: isMobile ? "32px" : "40px",
                 marginBottom: "0",
                 fontSize: isMobile ? '0.875rem' : '1rem'
               }}
             />
          </Box>

                     <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
             {/* Text invisível para criar estrutura idêntica aos outros campos */}
             <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>

                           <SecondaryButton
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
                size={isMobile ? "small" : "middle"}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? '0 12px' : '0 16px',
                  fontSize: isMobile ? '0.75rem' : undefined
                }}
              >
                Limpar
              </SecondaryButton>
           </Box>
        </Box>

        {/* Resumo dos filtros ativos */}
        {(appliedFilters.length > 0 || statusFilters.length > 0 || quickDateFilter || dateRange.length > 0) && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px solid #e8e8e8",
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 0.5 : 1,
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            {/* Container dos filtros à esquerda */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobile ? 0.5 : 1,
                alignItems: "center",
                flex: 1
              }}
            >
              <Text strong style={{
                fontSize: isMobile ? "0.6875rem" : "0.75rem",
                color: "#666"
              }}>
                Filtros ativos:
              </Text>
            {appliedFilters.map((filter, index) => (
              <Tag
                key={`${filter.type}-${filter.value}-${index}`}
                color="blue"
                closable
                onClose={() => {
                  setAppliedFilters(prev => prev.filter((_, i) => i !== index));
                  setCurrentPage(1);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "2px" : "4px",
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  fontWeight: "500",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                <span style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>{filter.icon}</span>
                {filter.label}: {filter.displayValue || filter.value}
              </Tag>
            ))}
            {statusFilters.map((status, index) => (
              <Tag
                key={index}
                color="green"
                closable
                onClose={() => setStatusFilters(currentFilters => currentFilters.filter(s => s !== status))}
                style={{
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                Status: {status.replace(/_/g, ' ')}
              </Tag>
            ))}
            {quickDateFilter && (
              <Tag
                color="purple"
                closable
                onClose={() => setQuickDateFilter("")}
                style={{
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                {dateFilterType === 'criacao' ? '📅 Criação' : '📅 Previsão Colheita'}: {
                  quickDateFilter === 'hoje' ? 'Hoje' :
                  quickDateFilter === 'semana' ? 'Esta semana' :
                  quickDateFilter === 'ultimos7' ? 'Últimos 7 dias' :
                  quickDateFilter === 'ultimos15' ? 'Últimos 15 dias' :
                  quickDateFilter === 'ultimos30' ? 'Últimos 30 dias' : quickDateFilter
                }
              </Tag>
            )}
            {dateRange.length > 0 && (
              <Tag
                color="orange"
                closable
                onClose={() => setDateRange([])}
                style={{
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                {dateFilterType === 'criacao' ? '📅 Criação' : '📅 Previsão Colheita'}: {dateRange[0]?.format('DD/MM/YYYY')} - {dateRange[1]?.format('DD/MM/YYYY')}
              </Tag>
            )}
            </Box>

            {/* Botão PDF à direita */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                ml: isMobile ? 0 : 2,
                mt: isMobile ? 1 : 0,
                width: isMobile ? "100%" : "auto"
              }}
            >
              <PDFButton
                onClick={handleGeneratePdf}
                size={isMobile ? "small" : "middle"}
                tooltip="Gerar relatório PDF com os filtros ativos"
                style={{
                  width: isMobile ? "100%" : "auto",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  height: isMobile ? "28px" : "32px"
                }}
              >
                Gerar PDF
              </PDFButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Botões Novo Pedido e Pagamentos Automáticos */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <PrimaryButton
          icon={<PlusCircleOutlined />}
          onClick={handleOpenCreateModal}
          size={isMobile ? "small" : (isTablet ? "small" : "large")}
          style={{
            height: isMobile ? '32px' : (isTablet ? '36px' : '40px'),
            padding: isMobile ? '0 12px' : (isTablet ? '0 14px' : '0 16px'),
            fontSize: isMobile ? '0.75rem' : undefined
          }}
        >
          {isMobile ? 'Novo' : 'Novo Pedido'}
        </PrimaryButton>
        <PrimaryButton
          icon={<DollarOutlined />}
          onClick={() => setPagamentosAutomaticosModalOpen(true)}
          size={isMobile ? "small" : (isTablet ? "small" : "large")}
          style={{
            height: isMobile ? '32px' : (isTablet ? '36px' : '40px'),
            padding: isMobile ? '0 12px' : (isTablet ? '0 14px' : '0 16px'),
            fontSize: isMobile ? '0.75rem' : undefined,
            backgroundColor: '#059669',
            borderColor: '#047857'
          }}
        >
          {isMobile ? 'Pagamentos' : 'Pagamentos Automáticos'}
        </PrimaryButton>
      </Box>

      {/* Tabela de Pedidos */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Suspense fallback={<LoadingFallback />}>
          <PedidosTable
            pedidos={pedidosFiltrados}
            loading={loading}
            onEdit={(pedido) => {
              setPedidoEditando(pedido);
              setModalOpen(true);
            }}
            onColheita={handleOpenColheitaModal}
            onPrecificacao={handleOpenPrecificacaoModal}
            onPagamento={handleOpenPagamentoModal}
            onPedidoRemovido={handlePedidoRemovido}
            onResetPagination={() => setCurrentPage(1)}
            onFilterDataPrevista={(valor) => {
              setCurrentPage(1);
              if (valor) {
                setQuickDateFilter('');
                setDateRange([]);
                setDateFilterType('colheita');
                setDataPrevistaFiltroTabela(valor);
              } else {
                setDataPrevistaFiltroTabela(null);
                setDateFilterType('criacao');
              }
            }}
            dataPrevistaFilterValue={dataPrevistaFiltroTabela}
          />
        </Suspense>

        {/* Paginação */}
        {totalPedidos > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalPedidos}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
              showSizeChanger={!isMobile}
              showQuickJumper={false}
              showTotal={(total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]}/${total}`
                  : `${range[0]}-${range[1]} de ${total} pedidos`
              }
              pageSizeOptions={['10', '20', '50', '100']}
              size={isMobile ? "small" : "default"}
            />
          </Box>
        )}
      </Box>

      {/* Modais */}
      <Suspense fallback={<Spin size="large" />}>
        {/* Modal para Novo Pedido */}
        <NovoPedidoModal
          open={modalOpen && !pedidoEditando}
          onClose={handleCloseModal}
          onSave={handleSavePedido}
          onReload={handleRefreshPedidos}
          loading={loading}
          clientes={clientes}
          onLoadingChange={handleModalLoading}
        />

        {/* Modal para Editar Pedido */}
        <EditarPedidoDialog
          open={modalOpen && !!pedidoEditando}
          onClose={handleCloseModal}
          onSave={handleSavePedido}
          pedido={pedidoEditando}
          loading={loading}
          clientes={clientes}
          onLoadingChange={handleModalLoading}
        />

        <ColheitaModal
          open={colheitaModalOpen}
          onClose={() => {
            setColheitaModalOpen(false);
            setPedidoSelecionado(null);
          }}
          onSave={handleSaveColheita}
          onSaveComplete={handleColheitaCompleta}
          pedido={pedidoSelecionado}
          loading={loading}
          onLoadingChange={handleModalLoading}
        />

        <PrecificacaoModal
          open={precificacaoModalOpen}
          onClose={() => {
            setPrecificacaoModalOpen(false);
            setPedidoSelecionado(null);
          }}
          onSave={handleSavePrecificacao}
          pedido={pedidoSelecionado}
          loading={loading}
          onLoadingChange={handleModalLoading}
        />

        <PagamentoModal
          open={pagamentoModalOpen}
          onClose={() => {
            setPagamentoModalOpen(false);
            setPedidoSelecionado(null);
          }}
          onNovoPagamento={handleNovoPagamento}
          onRemoverPagamento={handleRemoverPagamento}
          onAjustesSalvos={handleAjustesSalvos}
          pedido={pedidoSelecionado}
          loading={loading}
        />

        <PagamentosAutomaticosModal
          open={pagamentosAutomaticosModalOpen}
          onClose={() => setPagamentosAutomaticosModalOpen(false)}
          loading={loading}
        />
      </Suspense>

      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />
    </Box>
  );
};

export default Pedidos;
