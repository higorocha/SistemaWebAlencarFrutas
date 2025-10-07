// src/pages/FornecedoresPage.js

import React, { useState, useEffect } from "react";
import {
  Space,
  Select,
  Typography,
  Pagination,
  Modal,
} from "antd";
import {
  UserOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
// Importar ícones do Iconify para agricultura
import { Icon } from "@iconify/react";
import { Box } from "@mui/material";
import { CentralizedLoader } from "components/common/loaders";
import FornecedoresTable from "../components/fornecedores/FornecedoresTable";
import AddEditFornecedorDialog from "../components/fornecedores/AddEditFornecedorDialog";
import { PrimaryButton } from "../components/common/buttons";
import { SearchInput } from "../components/common/search";
import useResponsive from "../hooks/useResponsive";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";

const { Option } = Select;

const FornecedoresPage = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");
  const { isMobile } = useResponsive();

  // Carregar TODOS os fornecedores (sem paginação no backend)
  const fetchFornecedores = async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando fornecedores...");
      setLoading(true);
      
      const response = await axiosInstance.get(`/api/fornecedores`);
      const lista = response.data || [];
      setFornecedores(lista);
      setFornecedoresFiltrados(lista);
      setTotal(lista.length || 0);
      setCurrentPage(1);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      showNotification("error", "Erro", "Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  // Abrir modal para novo fornecedor
  const handleNovoFornecedor = () => {
    setEditingFornecedor(null);
    setModalOpen(true);
  };

  // Abrir modal para editar fornecedor
  const handleEditarFornecedor = (fornecedor) => {
    setEditingFornecedor(fornecedor);
    setModalOpen(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFornecedor(null);
  };

  // Salvar fornecedor
  const handleSalvarFornecedor = async (fornecedorData) => {
    // FECHAR MODAL IMEDIATAMENTE ao clicar em salvar
    handleCloseModal();
    
    try {
      setCentralizedLoading(true);
      setLoadingMessage(editingFornecedor ? "Atualizando fornecedor..." : "Criando fornecedor...");
      setLoading(true);
      
      if (editingFornecedor) {
        // Editar fornecedor existente
        await axiosInstance.put(`/api/fornecedores/${editingFornecedor.id}`, fornecedorData);
        showNotification("success", "Sucesso", "Fornecedor atualizado com sucesso!");
      } else {
        // Criar novo fornecedor
        await axiosInstance.post("/api/fornecedores", fornecedorData);
        showNotification("success", "Sucesso", "Fornecedor criado com sucesso!");
      }
      
      setLoadingMessage("Atualizando lista de fornecedores...");
      await fetchFornecedores();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      const errorMessage = error.response?.data?.message || "Erro ao salvar fornecedor";
      showNotification("error", "Erro", errorMessage);
      
      // REABRIR MODAL EM CASO DE ERRO
      setEditingFornecedor(editingFornecedor);
      setModalOpen(true);
      throw error;
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  };

  // Excluir fornecedor
  const handleExcluirFornecedor = async (id) => {
    Modal.confirm({
      title: "Confirmar exclusão",
      content: "Tem certeza de que deseja excluir este fornecedor? Essa ação não pode ser desfeita.",
      okText: "Sim",
      okType: "danger",
      cancelText: "Não",
      okButtonProps: {
        loading: false, // Desabilitar loading interno do modal
      },
      onOk: () => {
        // Executar operação de exclusão de forma assíncrona
        const executarExclusao = async () => {
          try {
            setCentralizedLoading(true);
            setLoadingMessage("Removendo fornecedor...");
            
            await axiosInstance.delete(`/api/fornecedores/${id}`);
            showNotification("success", "Sucesso", "Fornecedor excluído com sucesso!");
            
            setLoadingMessage("Atualizando lista de fornecedores...");
            await fetchFornecedores();
          } catch (error) {
            console.error("Erro ao excluir fornecedor:", error);
            const errorMessage = error.response?.data?.message || "Erro ao excluir fornecedor";
            showNotification("error", "Erro", errorMessage);
          } finally {
            setCentralizedLoading(false);
          }
        };
        
        executarExclusao();
        return true; // Fecha modal imediatamente
      },
    });
  };

  // Buscar fornecedores
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Mudança de página
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Filtrar localmente por termo de busca (atualiza apenas a lista derivada)
  useEffect(() => {
    const termo = (searchTerm || "").toLowerCase().trim();
    if (!termo) {
      setFornecedoresFiltrados(fornecedores);
      setTotal(fornecedores.length || 0);
      return;
    }

    const filtrados = fornecedores.filter((f) =>
      (f.nome || "").toLowerCase().includes(termo) ||
      (f.cnpj || "").toLowerCase().includes(termo) ||
      (f.cpf || "").toLowerCase().includes(termo) ||
      (f.documento || "").toLowerCase().includes(termo)
    );
    setFornecedoresFiltrados(filtrados);
    setTotal(filtrados.length || 0);
  }, [searchTerm, fornecedores]);

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
        <Typography.Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '1.500rem'
          }}
        >
          {/* Ícone principal da página - deve ser igual ao do sidebar */}
          <Icon 
            icon="mdi:truck-delivery" 
            style={{ 
              marginRight: 12, 
              fontSize: isMobile ? '31px' : '31px',
              color: "#059669"
            }} 
          />
          {/* Fallback para o ícone antigo caso o Iconify falhe */}
          <UserOutlined style={{ marginRight: 8, display: 'none' }} />
          {isMobile ? "Fornecedores" : "Gestão de Fornecedores"}
        </Typography.Title>
      </Box>

      {/* Botão Novo Fornecedor */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <PrimaryButton
          onClick={handleNovoFornecedor}
          icon={<PlusCircleOutlined />}
        >
          Novo Fornecedor
        </PrimaryButton>
      </Box>

      {/* Busca */}
      <Box sx={{ mb: 2 }}>
        <SearchInput
          placeholder={isMobile ? "Buscar..." : "Buscar fornecedores por nome ou CNPJ/CPF..."}
          value={searchTerm}
          onChange={handleSearch}
          size={isMobile ? "small" : "middle"}
          style={{
            width: "100%",
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        />
      </Box>

      {/* Tabela de Fornecedores */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <FornecedoresTable
          fornecedores={fornecedoresFiltrados}
          loading={false}
          onEdit={handleEditarFornecedor}
          onDelete={handleExcluirFornecedor}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onShowSizeChange={handlePageChange}
        />

        {/* Paginação */}
        {total > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              onShowSizeChanger={handlePageChange}
              showSizeChanger={!isMobile}
              size={isMobile ? "small" : "default"}
              showTotal={(total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]}/${total}`
                  : `${range[0]}-${range[1]} de ${total} fornecedores`
              }
              pageSizeOptions={['10', '20', '50', '100']}
            />
          </Box>
        )}
      </Box>

      {/* Modal de Adição/Edição */}
      <AddEditFornecedorDialog
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSalvarFornecedor}
        fornecedor={editingFornecedor}
        loading={loading}
      />
      
      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />
    </Box>
  );
};

export default FornecedoresPage;
