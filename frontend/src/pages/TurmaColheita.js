// src/pages/TurmaColheita.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin } from "antd";
import {
  OrderedListOutlined,
  PartitionOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { PrimaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";

const TurmaColheitaTable = lazy(() => import("../components/turma-colheita/TurmaColheitaTable"));
const AddEditTurmaColheitaDialog = lazy(() =>
  import("../components/turma-colheita/AddEditTurmaColheitaDialog")
);

const TurmaColheita = () => {
  const [turmasColheita, setTurmasColheita] = useState([]);
  const [turmasColheitaFiltradas, setTurmasColheitaFiltradas] = useState([]);

  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados da aplicação
  const [loading, setLoading] = useState(false);
  const [totalTurmas, setTotalTurmas] = useState(0);

  // Estados para busca
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState(null);

  const { Title } = Typography;

  // Função para buscar turmas de colheita da API com parâmetros
  const fetchTurmasColheita = useCallback(async (page = 1, limit = 20, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      if (search) params.append('search', search);

      const response = await axiosInstance.get(`/api/turma-colheita?${params.toString()}`);

      // Como o backend não tem paginação ainda, vamos simular localmente
      const todasTurmas = response.data || [];

      // Filtrar por busca se houver termo
      let turmasFiltradas = todasTurmas;
      if (search) {
        turmasFiltradas = todasTurmas.filter(turma =>
          turma.nomeColhedor?.toLowerCase().includes(search.toLowerCase()) ||
          turma.chavePix?.toLowerCase().includes(search.toLowerCase()) ||
          turma.observacoes?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Paginação local
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const turmasPaginadas = turmasFiltradas.slice(startIndex, endIndex);

      setTurmasColheita(turmasPaginadas);
      setTurmasColheitaFiltradas(turmasPaginadas);
      setTotalTurmas(turmasFiltradas.length);
      setCurrentPage(page);

    } catch (error) {
      console.error("Erro ao buscar turmas de colheita:", error);
      showNotification("error", "Erro", "Erro ao carregar turmas de colheita");
      setTurmasColheita([]);
      setTurmasColheitaFiltradas([]);
      setTotalTurmas(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect para carregar turmas na inicialização
  useEffect(() => {
    fetchTurmasColheita(currentPage, pageSize, searchTerm);
  }, [fetchTurmasColheita, currentPage, pageSize, searchTerm]);

  // Função para lidar com busca
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página ao buscar
  }, []);

  // Função para lidar com mudança de página
  const handlePageChange = useCallback((page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Função para abrir modal de criação
  const handleOpenCreateModal = useCallback(() => {
    setTurmaEditando(null);
    setModalOpen(true);
  }, []);

  // Função para abrir modal de edição
  const handleOpenEditModal = useCallback((turma) => {
    setTurmaEditando(turma);
    setModalOpen(true);
  }, []);

  // Função para fechar modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setTurmaEditando(null);
  }, []);

  // Função para salvar turma (criar ou editar)
  const handleSaveTurma = useCallback(async (turmaData) => {
    try {
      setLoading(true);

      if (turmaEditando) {
        // Editando turma existente
        await axiosInstance.patch(`/api/turma-colheita/${turmaEditando.id}`, turmaData);
        showNotification("success", "Sucesso", "Turma de colheita atualizada com sucesso!");
      } else {
        // Criando nova turma
        await axiosInstance.post("/api/turma-colheita", turmaData);
        showNotification("success", "Sucesso", "Turma de colheita criada com sucesso!");
      }

      handleCloseModal();
      // Recarregar lista de turmas
      await fetchTurmasColheita(currentPage, pageSize, searchTerm);

    } catch (error) {
      console.error("Erro ao salvar turma de colheita:", error);
      const message = error.response?.data?.message || "Erro ao salvar turma de colheita";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  }, [turmaEditando, fetchTurmasColheita, currentPage, pageSize, searchTerm, handleCloseModal]);

  // Função para deletar turma
  const handleDeleteTurma = useCallback(async (turmaId) => {
    Modal.confirm({
      title: "Confirmar exclusão",
      content: "Tem certeza que deseja excluir esta turma de colheita?",
      okText: "Sim, excluir",
      cancelText: "Cancelar",
      okType: "danger",
      onOk: async () => {
        try {
          await axiosInstance.delete(`/api/turma-colheita/${turmaId}`);
          showNotification("success", "Sucesso", "Turma de colheita removida com sucesso!");

          // Recarregar lista de turmas
          await fetchTurmasColheita(currentPage, pageSize, searchTerm);

        } catch (error) {
          console.error("Erro ao deletar turma de colheita:", error);
          const message = error.response?.data?.message || "Erro ao remover turma de colheita";
          showNotification("error", "Erro", message);
        }
      }
    });
  }, [fetchTurmasColheita, currentPage, pageSize, searchTerm]);

  return (
    <div style={{ padding: 16 }}>
      {/* Título */}
      <Typography.Title level={1} style={{ marginBottom: 16, color: "#059669" }}>
        Gestão de Turma de Colheita
      </Typography.Title>

      {/* Botão */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <PrimaryButton
          onClick={handleOpenCreateModal}
          icon={<PlusCircleOutlined />}
        >
          Nova Turma de Colheita
        </PrimaryButton>
      </div>

      {/* Campo de Busca */}
      <div style={{ marginBottom: "24px" }}>
        <SearchInput
          placeholder="Buscar por colhedor, PIX ou observações..."
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          style={{ marginTop: "8px" }}
        />
      </div>

      {/* Tabela */}
      <Suspense fallback={<LoadingFallback />}>
        <TurmaColheitaTable
          turmasColheita={turmasColheitaFiltradas}
          loading={loading}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteTurma}
        />
      </Suspense>

      {/* Paginação */}
      {totalTurmas > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalTurmas}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} de ${total} turmas de colheita`
            }
            pageSizeOptions={['10', '20', '50', '100']}
          />
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Suspense fallback={<Spin size="large" />}>
        <AddEditTurmaColheitaDialog
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTurma}
          turmaColheita={turmaEditando}
          loading={loading}
        />
      </Suspense>
    </div>
  );
};

export default TurmaColheita;