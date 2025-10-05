// src/pages/Pedidos.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin, Select, DatePicker, Tag } from "antd";
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
} from "@ant-design/icons";
// Importar ícones do Iconify
import { Icon } from "@iconify/react";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { CentralizedLoader } from "components/common/loaders";
import { PrimaryButton, SecondaryButton } from "components/common/buttons";
import { SearchInput, SearchInputInteligente } from "components/common/search";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../components/Icons/PaymentIcons";
import useResponsive from "../hooks/useResponsive";
import moment from "moment";

const PedidosTable = lazy(() => import("../components/pedidos/PedidosTable"));
const EditarPedidoDialog = lazy(() =>
  import("../components/pedidos/EditarPedidoDialog")
);
const NovoPedidoModal = lazy(() => import("../components/pedidos/NovoPedidoModal"));
const ColheitaModal = lazy(() => import("../components/pedidos/ColheitaModal"));
const PrecificacaoModal = lazy(() => import("../components/pedidos/PrecificacaoModal"));
const PagamentoModal = lazy(() => import("../components/pedidos/PagamentoModal"));

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Pedidos = () => {
  const { isMobile, isTablet } = useResponsive();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  
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
   const [statusFilter, setStatusFilter] = useState(""); // Valor vazio = "Todos"
   const [dateRange, setDateRange] = useState([]);

  // Estados dos modais
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  
  // Estados dos modais específicos
  const [colheitaModalOpen, setColheitaModalOpen] = useState(false);
  const [precificacaoModalOpen, setPrecificacaoModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
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

  // ✅ FUNÇÃO AUXILIAR: Criar objeto de filtros a partir de appliedFilters
  const createFiltersObject = useCallback(() => {
    const filters = {};
    appliedFilters.forEach(filter => {
      if (filter.type && filter.value) {
        filters[filter.type] = filter.value;
      }
    });
    return filters;
  }, [appliedFilters]);

  // ✅ FUNÇÃO ATUALIZADA: Buscar pedidos com suporte a filtros aninhados
  const fetchPedidos = useCallback(async (page = 1, limit = 20, filters = {}, status = "", dataInicio = null, dataFim = null) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando pedidos...");
      setLoading(true);
      const params = new URLSearchParams();
      
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (status) params.append('status', status);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      // ✅ ENVIAR FILTROS ANINHADOS PARA O BACKEND
      if (Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([type, value]) => {
          if (value && value.trim()) {
            params.append('filters', `${type}:${encodeURIComponent(value.trim())}`);
          }
        });
      }

      const response = await axiosInstance.get(`/api/pedidos?${params.toString()}`);

      setPedidos(response.data.data || []);
      setPedidosFiltrados(response.data.data || []);
      setTotalPedidos(response.data.total || 0);
      setCurrentPage(response.data.page || 1);

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
    fetchPedidos(1, pageSize, {}, "", null, null);
  }, [fetchClientes, fetchPedidos, pageSize]);

  // ✅ NOVA LÓGICA: Processar todos os filtros aninhados corretamente
  useEffect(() => {
    const dataInicio = dateRange[0] ? dateRange[0].toISOString() : null;
    const dataFim = dateRange[1] ? dateRange[1].toISOString() : null;

    // ✅ Usar função auxiliar para criar filtros aninhados
    fetchPedidos(currentPage, pageSize, createFiltersObject(), statusFilter, dataInicio, dataFim);
  }, [fetchPedidos, currentPage, pageSize, createFiltersObject, statusFilter, dateRange]);

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
        processedSuggestion.displayValue = suggestion.value; // Manter nome para exibição
      } else if (suggestion.type === 'numero') {
        // Para número de pedido, usar o número mesmo (não o ID)
        processedSuggestion.value = suggestion.value;
      }
    }

    setAppliedFilters(prev => [...prev, processedSuggestion]);
    setSearchTerm(""); // Limpar input para permitir novo filtro
    setCurrentPage(1);
  }, [getFilterIcon]);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates || []);
    setCurrentPage(1);
  }, []);

     // ✅ Função para limpar filtros
   const handleClearFilters = useCallback(() => {
     setSearchTerm("");
     setAppliedFilters([]);
     setStatusFilter(""); // Reset para "Todos"
     setDateRange([]);
     setCurrentPage(1);
   }, []);

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
      // ✅ Usar função auxiliar para criar filtros
      await fetchPedidos(currentPage, pageSize, createFiltersObject(), statusFilter, null, null);
      
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      const message = error.response?.data?.message || "Erro ao salvar pedido";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [pedidoEditando, fetchPedidos, currentPage, pageSize, createFiltersObject, statusFilter, handleCloseModal]);

  // Função para atualizar colheita
  const handleSaveColheita = useCallback(async (colheitaData) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Registrando colheita...");
      setLoading(true);

      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/colheita`, colheitaData);
      showNotification("success", "Sucesso", "Colheita registrada com sucesso!");
      
      setColheitaModalOpen(false);
      setPedidoSelecionado(null);
      // ✅ Usar função auxiliar para criar filtros
      await fetchPedidos(currentPage, pageSize, createFiltersObject(), statusFilter, null, null);
      
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const message = error.response?.data?.message || "Erro ao registrar colheita";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [pedidoSelecionado, fetchPedidos, currentPage, pageSize, createFiltersObject, statusFilter]);

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
      // ✅ Usar função auxiliar para criar filtros
      await fetchPedidos(currentPage, pageSize, createFiltersObject(), statusFilter, null, null);

    } catch (error) {
      console.error("Erro ao definir precificação:", error);
      const message = error.response?.data?.message || "Erro ao definir precificação";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [pedidoSelecionado, fetchPedidos, currentPage, pageSize, createFiltersObject, statusFilter]);

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
      // Atualizar lista de pedidos
      // ✅ Usar função auxiliar para criar filtros
      await fetchPedidos(currentPage, pageSize, createFiltersObject(), statusFilter, null, null);

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
  }, [fetchPedidos, currentPage, pageSize, createFiltersObject, statusFilter, pedidoSelecionado]);

  // Função para remover pagamento
  const handleRemoverPagamento = useCallback(async (pagamentoId) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Removendo pagamento...");
      setLoading(true);

      await axiosInstance.delete(`/api/pedidos/pagamentos/${pagamentoId}`);
      showNotification("success", "Sucesso", "Pagamento removido com sucesso!");

      setLoadingMessage("Atualizando lista de pedidos...");
      // Atualizar lista de pedidos
      // ✅ Usar função auxiliar para criar filtros
      await fetchPedidos(currentPage, pageSize, createFiltersObject(), statusFilter, null, null);

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
  }, [fetchPedidos, currentPage, pageSize, createFiltersObject, statusFilter, pedidoSelecionado]);

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
      <Box sx={{ mb: 3 }}>
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
              value={statusFilter}
              onChange={handleStatusFilter}
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                height: isMobile ? "32px" : "40px",
                marginBottom: "0",
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            >
              <Option value="">
                <EyeOutlined style={{ marginRight: 8, color: '#666' }} />
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

          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 240px" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              Data de Criação:
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
        {(appliedFilters.length > 0 || statusFilter || dateRange.length > 0) && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px solid #e8e8e8",
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 0.5 : 1,
              alignItems: "center"
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
            {statusFilter && (
              <Tag
                color="green"
                closable
                onClose={() => setStatusFilter("")}
                style={{
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                Status: {statusFilter.replace(/_/g, ' ')}
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
                Período: {dateRange[0]?.format('DD/MM/YYYY')} - {dateRange[1]?.format('DD/MM/YYYY')}
              </Tag>
            )}
          </Box>
        )}
      </Box>

      {/* Botão Novo Pedido */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-start" }}>
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
              showQuickJumper={!isMobile}
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
          pedido={pedidoSelecionado}
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
