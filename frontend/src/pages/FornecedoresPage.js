// src/pages/FornecedoresPage.js

import React, { useState, useEffect } from "react";
import {
  Space,
  Select,
  Typography,
  Pagination,
} from "antd";
import {
  UserOutlined,
} from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
import FornecedoresTable from "../components/fornecedores/FornecedoresTable";
import AddEditFornecedorDialog from "../components/fornecedores/AddEditFornecedorDialog";
import { PrimaryButton } from "../components/common/buttons";
import { SearchInput } from "../components/common/search";

const { Option } = Select;

const FornecedoresPage = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Carregar fornecedores
  const fetchFornecedores = async (page = 1, limit = 20, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append("search", search);

      const response = await axiosInstance.get(`/api/fornecedores?${params}`);
      setFornecedores(response.data || []);
      setTotal(response.data?.length || 0);
      setCurrentPage(page);
      setPageSize(limit);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      showNotification("error", "Erro", "Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
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
    try {
      if (editingFornecedor) {
        // Editar fornecedor existente
        await axiosInstance.put(`/api/fornecedores/${editingFornecedor.id}`, fornecedorData);
        showNotification("success", "Sucesso", "Fornecedor atualizado com sucesso!");
      } else {
        // Criar novo fornecedor
        await axiosInstance.post("/api/fornecedores", fornecedorData);
        showNotification("success", "Sucesso", "Fornecedor criado com sucesso!");
      }
      
      handleCloseModal();
      fetchFornecedores(currentPage, pageSize, searchTerm);
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      const errorMessage = error.response?.data?.message || "Erro ao salvar fornecedor";
      showNotification("error", "Erro", errorMessage);
      throw error;
    }
  };

  // Excluir fornecedor
  const handleExcluirFornecedor = async (id) => {
    try {
      await axiosInstance.delete(`/api/fornecedores/${id}`);
      showNotification("success", "Sucesso", "Fornecedor excluído com sucesso!");
      fetchFornecedores(currentPage, pageSize, searchTerm);
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      const errorMessage = error.response?.data?.message || "Erro ao excluir fornecedor";
      showNotification("error", "Erro", errorMessage);
    }
  };

  // Buscar fornecedores
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchFornecedores(1, pageSize, value);
  };

  // Mudança de página
  const handlePageChange = (page, size) => {
    fetchFornecedores(page, size, searchTerm);
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* Título */}
      <Typography.Title level={1} style={{ marginBottom: 16, color: "#059669" }}>
        Gestão de Fornecedores
      </Typography.Title>

      {/* Botão */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <PrimaryButton
          onClick={handleNovoFornecedor}
          icon={<UserOutlined />}
        >
          Novo Fornecedor
        </PrimaryButton>
      </div>

      {/* Campo de Busca */}
      <div style={{ marginBottom: "24px" }}>
        <SearchInput
          placeholder="Buscar fornecedores por nome ou CNPJ/CPF..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ marginTop: "8px" }}
        />
      </div>

                 {/* Tabela de Fornecedores */}
         <FornecedoresTable
           fornecedores={fornecedores}
           loading={loading}
           onEdit={handleEditarFornecedor}
           onDelete={handleExcluirFornecedor}
           currentPage={currentPage}
           pageSize={pageSize}
           onPageChange={handlePageChange}
           onShowSizeChange={handlePageChange}
         />

      {/* Paginação */}
      {total > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => 
              `${range[0]}-${range[1]} de ${total} fornecedores`
            }
            pageSizeOptions={['10', '20', '50', '100']}
          />
        </div>
      )}

      {/* Modal de Adição/Edição */}
      <AddEditFornecedorDialog
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSalvarFornecedor}
        fornecedor={editingFornecedor}
        loading={loading}
      />
    </div>
  );
};

export default FornecedoresPage;
