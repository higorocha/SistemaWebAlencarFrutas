// src/pages/Pedidos.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin, Select, DatePicker, Tag } from "antd";
import {
  ShoppingCartOutlined,
  PlusCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { PrimaryButton, SecondaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";
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
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  
  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados da aplicação
  const [loading, setLoading] = useState(false);
  const [totalPedidos, setTotalPedidos] = useState(0);
  
     // Estados para busca e filtros
   const [searchTerm, setSearchTerm] = useState("");
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

  // Função para buscar pedidos da API
  const fetchPedidos = useCallback(async (page = 1, limit = 20, search = "", status = "", dataInicio = null, dataFim = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

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
  }, [fetchClientes]);

  useEffect(() => {
    const dataInicio = dateRange[0] ? dateRange[0].toISOString() : null;
    const dataFim = dateRange[1] ? dateRange[1].toISOString() : null;
    
    fetchPedidos(currentPage, pageSize, searchTerm, statusFilter, dataInicio, dataFim);
  }, [fetchPedidos, currentPage, pageSize, searchTerm, statusFilter, dateRange]);

  // Funções de manipulação de filtros
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates || []);
    setCurrentPage(1);
  }, []);

     // Função para limpar filtros
   const handleClearFilters = useCallback(() => {
     setSearchTerm("");
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
      await fetchPedidos(currentPage, pageSize, searchTerm, statusFilter);
      
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      const message = error.response?.data?.message || "Erro ao salvar pedido";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  }, [pedidoEditando, fetchPedidos, currentPage, pageSize, searchTerm, statusFilter, handleCloseModal]);

  // Função para atualizar colheita
  const handleSaveColheita = useCallback(async (colheitaData) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/colheita`, colheitaData);
      showNotification("success", "Sucesso", "Colheita registrada com sucesso!");
      
      setColheitaModalOpen(false);
      setPedidoSelecionado(null);
      await fetchPedidos(currentPage, pageSize, searchTerm, statusFilter);
      
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const message = error.response?.data?.message || "Erro ao registrar colheita";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  }, [pedidoSelecionado, fetchPedidos, currentPage, pageSize, searchTerm, statusFilter]);

  // Função para atualizar precificação
  const handleSavePrecificacao = useCallback(async (precificacaoData) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/precificacao`, precificacaoData);
      showNotification("success", "Sucesso", "Precificação realizada com sucesso!");
      
      setPrecificacaoModalOpen(false);
      setPedidoSelecionado(null);
      await fetchPedidos(currentPage, pageSize, searchTerm, statusFilter);
      
    } catch (error) {
      console.error("Erro ao definir precificação:", error);
      const message = error.response?.data?.message || "Erro ao definir precificação";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  }, [pedidoSelecionado, fetchPedidos, currentPage, pageSize, searchTerm, statusFilter]);

  // Função para criar novo pagamento
  const handleNovoPagamento = useCallback(async (pagamentoData) => {
    try {
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
      
      // Atualizar lista de pedidos
      await fetchPedidos(currentPage, pageSize, searchTerm, statusFilter);
      
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
    }
  }, [fetchPedidos, currentPage, pageSize, searchTerm, statusFilter, pedidoSelecionado]);

  // Função para remover pagamento
  const handleRemoverPagamento = useCallback(async (pagamentoId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/pedidos/pagamentos/${pagamentoId}`);
      showNotification("success", "Sucesso", "Pagamento removido com sucesso!");
      
      // Atualizar lista de pedidos
      await fetchPedidos(currentPage, pageSize, searchTerm, statusFilter);
      
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
    }
  }, [fetchPedidos, currentPage, pageSize, searchTerm, statusFilter, pedidoSelecionado]);

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
        <Title level={2} style={{ margin: 0, color: "#2E7D32", marginBottom: 8 }}>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Sistema de Pedidos
        </Title>
        <Text type="secondary" style={{ fontSize: "14px" }}>
          Gerencie o fluxo completo dos pedidos: criação, colheita, precificação e pagamento
        </Text>
      </Box>

             {/* Seção de Filtros Reorganizada */}
       <Box 
         sx={{ 
           p: 3,
           bgcolor: "#f9f9f9",
           borderRadius: 2,
           border: "1px solid #e8e8e8",
           mb: 0
         }}
       >
        <Box sx={{ mb: 2 }}>
          <Text strong style={{ color: "#2E7D32", fontSize: "16px" }}>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filtros de Busca
          </Text>
        </Box>

                 {/* Linha de Filtros */}
                  <Box 
            sx={{ 
              display: "flex", 
              gap: 2, 
              mb: 0,
              flexWrap: "wrap"
              // alignItems removido para comportamento padrão (stretch)
            }}
          >
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 350px" } }}>
            <Text style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Buscar por número, cliente ou fruta:
            </Text>
                         <SearchInput
               placeholder="Ex: João Silva, Maçã..."
               onChange={handleSearch}
               value={searchTerm}
               style={{ 
                 width: "100%", 
                 height: "32px", 
                 fontSize: "14px",
                 marginBottom: "0" // <-- ADICIONADO PARA NEUTRALIZAR MARGEM INLINE
               }}
             />
          </Box>
          
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 200px" } }}>
            <Text style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Status:
            </Text>
                                      <Select
               value={statusFilter}
               onChange={handleStatusFilter}
               style={{ width: "100%", height: "32px", marginBottom: "0" }} // <-- ADICIONADO PARA NEUTRALIZAR MARGEM INLINE
             >
               <Option value="">📋 Todos</Option>
               <Option value="PEDIDO_CRIADO">🆕 Pedido Criado</Option>
               <Option value="AGUARDANDO_COLHEITA">⏳ Aguardando Colheita</Option>
               <Option value="COLHEITA_REALIZADA">✅ Colheita Realizada</Option>
               <Option value="AGUARDANDO_PRECIFICACAO">💰 Aguardando Precificação</Option>
               <Option value="PRECIFICACAO_REALIZADA">💵 Precificação Realizada</Option>
               <Option value="AGUARDANDO_PAGAMENTO">💳 Aguardando Pagamento</Option>
               <Option value="PAGAMENTO_REALIZADO">✅ Pagamento Realizado</Option>
               <Option value="PEDIDO_FINALIZADO">🎉 Pedido Finalizado</Option>
               <Option value="CANCELADO">❌ Cancelado</Option>
             </Select>
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 200px" } }}>
            <Text style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Período:
            </Text>
                         <RangePicker
               value={dateRange}
               onChange={handleDateRangeChange}
               placeholder={["Início", "Fim"]}
               format="DD/MM/YYYY"
               style={{ width: "100%", height: "32px", marginBottom: "0" }} // <-- ADICIONADO PARA NEUTRALIZAR MARGEM INLINE
             />
          </Box>

                     <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
             {/* Text invisível para criar estrutura idêntica aos outros campos */}
             <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>
             
                           <SecondaryButton
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
                style={{ height: "32px" }}
              >
                Limpar
              </SecondaryButton>
           </Box>
        </Box>

        {/* Resumo dos filtros ativos */}
        {(searchTerm || statusFilter || dateRange.length > 0) && (
          <Box 
            sx={{ 
              mt: 2, 
              pt: 2, 
              borderTop: "1px solid #e8e8e8",
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center"
            }}
          >
            <Text strong style={{ fontSize: "12px", color: "#666" }}>
              Filtros ativos:
            </Text>
            {searchTerm && (
              <Tag color="blue" closable onClose={() => setSearchTerm("")}>
                Busca: {searchTerm}
              </Tag>
            )}
            {statusFilter && (
              <Tag color="green" closable onClose={() => setStatusFilter("")}>
                Status: {statusFilter.replace(/_/g, ' ')}
              </Tag>
            )}
            {dateRange.length > 0 && (
              <Tag color="orange" closable onClose={() => setDateRange([])}>
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
           size="large"
         >
           Novo Pedido
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
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `${range[0]}-${range[1]} de ${total} pedidos`
              }
              pageSizeOptions={['10', '20', '50', '100']}
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
        />

        {/* Modal para Editar Pedido */}
        <EditarPedidoDialog
          open={modalOpen && !!pedidoEditando}
          onClose={handleCloseModal}
          onSave={handleSavePedido}
          pedido={pedidoEditando}
          loading={loading}
          clientes={clientes}
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
    </Box>
  );
};

export default Pedidos;
