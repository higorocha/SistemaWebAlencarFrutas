// src/pages/Clientes.js

import React, { useEffect, useState, useCallback, lazy } from "react";
import { Typography, Button, Space, Modal } from "antd";
import {
  OrderedListOutlined,
  PartitionOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import { CentralizedLoader } from "../components/common/loaders";
import { PrimaryButton } from "../components/common/buttons";
import { SearchInput } from "../components/common/search";

const ClientesTable = lazy(() => import("../components/clientes/ClientesTable"));
const AddEditClienteDialog = lazy(() =>
  import("../components/clientes/AddEditClienteDialog")
);
const PedidosClienteModal = lazy(() =>
  import("../components/clientes/PedidosClienteModal")
);

const Clientes = () => {
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
  
  // Estados do modal de pedidos
  const [pedidosModalOpen, setPedidosModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const { Title } = Typography;

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
      
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      const message = error.response?.data?.message || "Erro ao salvar cliente";
      showNotification("error", "Erro", message);
      
      // REABRIR MODAL EM CASO DE ERRO
      setClienteEditando(clienteEditando ? clienteEditando : null);
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
         <div style={{ padding: 16 }}>
      {/* Título */}
      <Typography.Title level={1} style={{ marginBottom: 16, color: "#059669" }}>
        Gestão de Clientes
      </Typography.Title>

      {/* Botão */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <PrimaryButton
          onClick={handleOpenCreateModal}
          icon={<PlusCircleOutlined />}
        >
          Novo Cliente
        </PrimaryButton>
      </div>

      {/* Campo de Busca */}
      <div style={{ marginBottom: "24px" }}>
                 <SearchInput
           placeholder="Buscar clientes por nome ou CPF/CNPJ..."
           value={searchTerm}
           onChange={(value) => setSearchTerm(value)}
           style={{ marginTop: "8px" }}
         />
      </div>

             {/* Tabela */}
         <ClientesTable
           clientes={clientesFiltrados}
           loading={false}
           onEdit={handleOpenEditModal}
           onDelete={handleDeleteCliente}
           onViewPedidos={handleOpenPedidosModal}
           onStatusFilter={handleStatusFilter}
           currentStatusFilter={statusFilter}
         />

       {/* Paginação */}
       {totalClientes > 0 && (
         <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
           <Pagination
             current={currentPage}
             pageSize={pageSize}
             total={totalClientes}
             onChange={handlePageChange}
             onShowSizeChange={handlePageChange}
             showSizeChanger
             showQuickJumper
             showTotal={(total, range) => 
               `${range[0]}-${range[1]} de ${total} clientes`
             }
             pageSizeOptions={['10', '20', '50', '100']}
           />
         </div>
       )}

             {/* Modal de Criação/Edição */}
         <AddEditClienteDialog
           open={modalOpen}
           onClose={handleCloseModal}
           onSave={handleSaveCliente}
           cliente={clienteEditando}
           loading={false}
         />

       {/* Modal de Pedidos do Cliente */}
         <PedidosClienteModal
           open={pedidosModalOpen}
           onClose={handleClosePedidosModal}
           cliente={clienteSelecionado}
           loading={false}
         />

       {/* Loading Centralizado */}
       <CentralizedLoader
         visible={centralizedLoading}
         message={loadingMessage}
         subMessage="Aguarde enquanto processamos sua solicitação..."
       />
     </div>
   );
 };

export default Clientes;
