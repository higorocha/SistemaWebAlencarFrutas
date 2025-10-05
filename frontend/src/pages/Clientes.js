// src/pages/Clientes.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin } from "antd";
import {
  OrderedListOutlined,
  PartitionOutlined,
  PlusCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
// Importar ícones do Iconify para agricultura
import { Icon } from "@iconify/react";
import { CentralizedLoader } from "components/common/loaders";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { PrimaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";
import useResponsive from "../hooks/useResponsive";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";

const ClientesTable = lazy(() => import("../components/clientes/ClientesTable"));
const AddEditClienteDialog = lazy(() =>
  import("../components/clientes/AddEditClienteDialog")
);
const PedidosClienteModal = lazy(() =>
  import("../components/clientes/PedidosClienteModal")
);

const { Title } = Typography;

const Clientes = () => {
  const { isMobile, isTablet } = useResponsive();
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);

  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados da aplicação
  const [loading, setLoading] = useState(false);
  const [totalClientes, setTotalClientes] = useState(0);

  // Estado para loading centralizado
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");

  // Estados para busca
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Novo estado para filtro de status

  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [dadosTemporarios, setDadosTemporarios] = useState(null); // Para manter dados em caso de erro

  // Estados do modal de pedidos
  const [pedidosModalOpen, setPedidosModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // Função para buscar clientes da API com parâmetros
  const fetchClientes = useCallback(async (page = 1, limit = 20, search = "", status = "") => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando clientes...");
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await axiosInstance.get(`/api/clientes?${params.toString()}`);
      
      setClientes(response.data.data || []);
      setClientesFiltrados(response.data.data || []);
      setTotalClientes(response.data.total || 0);
      setCurrentPage(response.data.page || 1);
      
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      showNotification("error", "Erro", "Erro ao carregar clientes");
      setClientes([]);
      setClientesFiltrados([]);
      setTotalClientes(0);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, []);

  // useEffect para carregar clientes na inicialização
  useEffect(() => {
    fetchClientes(currentPage, pageSize, searchTerm, statusFilter);
  }, [fetchClientes, currentPage, pageSize, searchTerm, statusFilter]);

  // Função para lidar com busca
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página ao buscar
  }, []);

  // Função para lidar com mudança de filtro de status
  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  }, []);

  // Função para lidar com mudança de página
  const handlePageChange = useCallback((page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Função para abrir modal de criação
  const handleOpenCreateModal = useCallback(() => {
    setClienteEditando(null);
    setModalOpen(true);
  }, []);

  // Função para abrir modal de edição
  const handleOpenEditModal = useCallback((cliente) => {
    setClienteEditando(cliente);
    setModalOpen(true);
  }, []);

  // Função para fechar modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setClienteEditando(null);
    setDadosTemporarios(null); // Limpar dados temporários
  }, []);

  // Função para abrir modal de pedidos
  const handleOpenPedidosModal = useCallback((cliente) => {
    setClienteSelecionado(cliente);
    setPedidosModalOpen(true);
  }, []);

  // Função para fechar modal de pedidos
  const handleClosePedidosModal = useCallback(() => {
    setPedidosModalOpen(false);
    setClienteSelecionado(null);
  }, []);

  // Função para salvar cliente (criar ou editar)
  const handleSaveCliente = useCallback(async (clienteData) => {
    // FECHAR MODAL IMEDIATAMENTE ao clicar em salvar
    handleCloseModal();

    try {
      setCentralizedLoading(true);
      setLoadingMessage(clienteEditando ? "Atualizando cliente..." : "Criando cliente...");
      setLoading(true);

      if (clienteEditando) {
        // Editando cliente existente
        await axiosInstance.patch(`/api/clientes/${clienteEditando.id}`, clienteData);
        showNotification("success", "Sucesso", "Cliente atualizado com sucesso!");
      } else {
        // Criando novo cliente
        await axiosInstance.post("/api/clientes", clienteData);
        showNotification("success", "Sucesso", "Cliente criado com sucesso!");
      }

      // Atualizar mensagem para recarregamento
      setLoadingMessage("Atualizando lista de clientes...");

      // Recarregar lista de clientes (sem delay adicional)
      const params = new URLSearchParams();
      if (currentPage) params.append('page', currentPage.toString());
      if (pageSize) params.append('limit', pageSize.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axiosInstance.get(`/api/clientes?${params.toString()}`);
      setClientes(response.data.data || []);
      setClientesFiltrados(response.data.data || []);
      setTotalClientes(response.data.total || 0);
      setCurrentPage(response.data.page || 1);

      // Limpar dados temporários após sucesso
      setDadosTemporarios(null);

    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      const message = error.response?.data?.message || "Erro ao salvar cliente";
      showNotification("error", "Erro", message);

      // MANTER OS DADOS PREENCHIDOS EM CASO DE ERRO
      setDadosTemporarios(clienteData);

      // REABRIR MODAL EM CASO DE ERRO
      if (clienteEditando) {
        // Se estava editando, manter os dados originais + dados preenchidos
        setClienteEditando({ ...clienteEditando, ...clienteData });
      } else {
        // Se era novo cliente, usar os dados preenchidos
        setClienteEditando(clienteData);
      }
      setModalOpen(true);

    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, [clienteEditando, fetchClientes, currentPage, pageSize, searchTerm, statusFilter, handleCloseModal]);

  // Função para deletar cliente
  const handleDeleteCliente = useCallback(async (clienteId) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Removendo cliente...");
      
      await axiosInstance.delete(`/api/clientes/${clienteId}`);
      showNotification("success", "Sucesso", "Cliente removido com sucesso!");
      
      // Atualizar mensagem para recarregamento
      setLoadingMessage("Atualizando lista de clientes...");
      
      // Recarregar lista de clientes (sem delay adicional)
      const params = new URLSearchParams();
      if (currentPage) params.append('page', currentPage.toString());
      if (pageSize) params.append('limit', pageSize.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axiosInstance.get(`/api/clientes?${params.toString()}`);
      setClientes(response.data.data || []);
      setClientesFiltrados(response.data.data || []);
      setTotalClientes(response.data.total || 0);
      setCurrentPage(response.data.page || 1);
      
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      const message = error.response?.data?.message || "Erro ao remover cliente";
      showNotification("error", "Erro", message);
    } finally {
      setCentralizedLoading(false);
    }
  }, [fetchClientes, currentPage, pageSize, searchTerm, statusFilter]);

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
      <Box sx={{ mb: 0 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '1.500rem' // 22px - um pouco menor que o padrão do level 2
          }}
        >
          {/* Ícone principal da página - deve ser igual ao do sidebar */}
          <Icon 
            icon="mdi:account-group" 
            style={{ 
              marginRight: 12, 
              fontSize: isMobile ? '31px' : '31px',
              color: "#059669"
            }} 
          />
          {/* Fallback para o ícone antigo caso o Iconify falhe */}
          <UserOutlined style={{ marginRight: 8, display: 'none' }} />
          Gestão de Clientes
        </Title>
      </Box>

      {/* Botão Novo Cliente */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <PrimaryButton
          onClick={handleOpenCreateModal}
          icon={<PlusCircleOutlined />}
        >
          Novo Cliente
        </PrimaryButton>
      </Box>

      {/* Busca */}
      <Box sx={{ mb: 2 }}>
        <SearchInput
          placeholder={isMobile ? "Buscar..." : "Buscar clientes por nome ou CPF/CNPJ..."}
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          size={isMobile ? "small" : "middle"}
          style={{
            width: "100%",
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        />
      </Box>

      {/* Tabela de Clientes */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Suspense fallback={<LoadingFallback />}>
          <ClientesTable
            clientes={clientesFiltrados}
            loading={false}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteCliente}
            onViewPedidos={handleOpenPedidosModal}
            onStatusFilter={handleStatusFilter}
            currentStatusFilter={statusFilter}
          />
        </Suspense>

        {/* Paginação */}
        {totalClientes > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalClientes}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              showSizeChanger={!isMobile}
              showQuickJumper={!isMobile}
              showTotal={(total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]}/${total}`
                  : `${range[0]}-${range[1]} de ${total} clientes`
              }
              pageSizeOptions={['10', '20', '50', '100']}
              size={isMobile ? "small" : "default"}
            />
          </Box>
        )}
      </Box>

      {/* Modais */}
      <Suspense fallback={<Spin size="large" />}>
        <AddEditClienteDialog
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCliente}
          cliente={clienteEditando}
          loading={false}
        />
      </Suspense>

      <Suspense fallback={<Spin size="large" />}>
        <PedidosClienteModal
          open={pedidosModalOpen}
          onClose={handleClosePedidosModal}
          cliente={clienteSelecionado}
          loading={false}
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

export default Clientes;
