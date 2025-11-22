// src/pages/ArhFolhaPagamento.js

import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from "react";
import { Typography, Select, Divider, Space } from "antd";
import {
  PlusCircleOutlined,
  OrderedListOutlined,
  LockOutlined,
  UnlockOutlined,
  FilterOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
import { PrimaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";
import useResponsive from "../hooks/useResponsive";
import { useAuth } from "../contexts/AuthContext";
import CentralizedLoader from "../components/common/loaders/CentralizedLoader";
import ConfirmActionModal from "../components/common/modals/ConfirmActionModal";
import { Box, Chip } from "@mui/material";
import { capitalizeName } from "../utils/formatters";

const FolhasTable = lazy(() => import("../components/arh/folha-pagamento/FolhasTable"));
const LancamentosTable = lazy(() => import("../components/arh/folha-pagamento/LancamentosTable"));
const NovaFolhaDialog = lazy(() => import("../components/arh/folha-pagamento/NovaFolhaDialog"));
const EditarLancamentoDialog = lazy(() => import("../components/arh/folha-pagamento/EditarLancamentoDialog"));
const AtualizarPagamentoDialog = lazy(() => import("../components/arh/folha-pagamento/AtualizarPagamentoDialog"));
const FinalizarFolhaDialog = lazy(() => import("../components/arh/folha-pagamento/FinalizarFolhaDialog"));
const AdicionarFuncionariosDialog = lazy(() => import("../components/arh/folha-pagamento/AdicionarFuncionariosDialog"));

const { Title } = Typography;

const STATUS_FOLHA = {
  RASCUNHO: { label: "Rascunho", color: "default" },
  PENDENTE_LIBERACAO: { label: "Pendente Liberação", color: "orange" },
  EM_PROCESSAMENTO: { label: "Em processamento", color: "blue" },
  FECHADA: { label: "Fechada", color: "green" },
  CANCELADA: { label: "Cancelada", color: "red" },
};

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const competenciaLabel = (folha) => {
  const mesAno = `${String(folha.competenciaMes).padStart(2, "0")}/${folha.competenciaAno}`;
  const quinzena = folha.periodo ? ` - ${folha.periodo}ª Quinzena` : "";
  return `${mesAno}${quinzena}`;
};

// Componente de fallback para Suspense
const SuspenseFallback = ({ message = "Carregando..." }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
      width: "100%",
    }}
  >
    <CentralizedLoader visible={true} message={message} />
  </Box>
);

const ArhFolhaPagamento = () => {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [folhas, setFolhas] = useState([]);
  const [selectedFolhaId, setSelectedFolhaId] = useState(() => {
    // Recuperar folha selecionada do cache
    const cached = localStorage.getItem("arh_folha_selecionada");
    return cached ? parseInt(cached, 10) : null;
  });
  const [folhasLoading, setFolhasLoading] = useState(false);
  const [lancamentos, setLancamentos] = useState([]);
  const [lancamentosLoading, setLancamentosLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editLancamento, setEditLancamento] = useState({ open: false, record: null });
  const [pagamentoModal, setPagamentoModal] = useState({ open: false, record: null });
  const [finalizarModal, setFinalizarModal] = useState(false);
  const [liberarModalOpen, setLiberarModalOpen] = useState(false);
  const [centralLoading, setCentralLoading] = useState(false);
  const [centralMessage, setCentralMessage] = useState("Processando...");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const isGerenteCultura = user?.nivel === "GERENTE_CULTURA";
  const isAdmin = user?.nivel === "ADMINISTRADOR";

  const carregarFolhas = useCallback(async () => {
    try {
      setFolhasLoading(true);
      const response = await axiosInstance.get("/api/arh/folhas", {
        params: { limit: 100 },
      });
      const lista = response.data?.data || response.data || [];
      setFolhas(lista);
      
      // Se houver folha selecionada no cache, validar se ainda existe
      if (selectedFolhaId) {
        const folhaExiste = lista.some((f) => f.id === selectedFolhaId);
        if (!folhaExiste && lista.length) {
          // Se não existe mais, selecionar a primeira
          setSelectedFolhaId(lista[0].id);
        }
      } else if (lista.length) {
        // Se não tem cache, selecionar a primeira
        setSelectedFolhaId(lista[0].id);
      }
    } catch (error) {
      console.error(error);
      showNotification("error", "Erro", "Não foi possível carregar as folhas.");
    } finally {
      setFolhasLoading(false);
    }
  }, [selectedFolhaId]);

  const carregarFuncionariosResumo = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/arh/funcionarios/resumo");
      setFuncionarios(response.data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const carregarLancamentos = useCallback(
    async (folhaId) => {
      if (!folhaId) {
        setLancamentos([]);
        return;
      }
      try {
        setLancamentosLoading(true);
        const response = await axiosInstance.get(
          `/api/arh/folhas/${folhaId}/lancamentos`,
        );
        setLancamentos(response.data || []);
      } catch (error) {
        console.error(error);
        showNotification("error", "Erro", "Falha ao carregar lançamentos.");
      } finally {
        setLancamentosLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    carregarFolhas();
    carregarFuncionariosResumo();
  }, [carregarFolhas, carregarFuncionariosResumo]);

  useEffect(() => {
    carregarLancamentos(selectedFolhaId);
  }, [selectedFolhaId, carregarLancamentos]);

  // Salvar folha selecionada no cache
  useEffect(() => {
    if (selectedFolhaId) {
      localStorage.setItem("arh_folha_selecionada", String(selectedFolhaId));
    }
  }, [selectedFolhaId]);

  const selectedFolha = folhas.find((folha) => folha.id === selectedFolhaId) || null;

  const filteredFolhas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return folhas.filter((folha) => {
      const matchSearch =
        competenciaLabel(folha).includes(term) ||
        folha.referencia?.toLowerCase().includes(term);
      const matchStatus =
        statusFilter === "ALL" || folha.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [folhas, searchTerm, statusFilter]);

  const salvarFolha = async (folhaData) => {
    // Fechar modal imediatamente
    setCreateModalOpen(false);

    try {
      setCentralLoading(true);
      setCentralMessage("Criando nova folha e incluindo funcionários ativos...");
      await axiosInstance.post("/api/arh/folhas", folhaData);
      showNotification("success", "Sucesso", "Folha criada com sucesso! Todos os funcionários ativos foram incluídos automaticamente.");
      
      setCentralMessage("Atualizando lista de folhas...");
      await carregarFolhas();
      
      // Selecionar a folha recém-criada
      const folhasAtualizadas = await axiosInstance.get("/api/arh/folhas", {
        params: { limit: 100 },
      });
      const lista = folhasAtualizadas.data?.data || folhasAtualizadas.data || [];
      if (lista.length > 0) {
        const novaFolha = lista.find(
          (f) =>
            f.competenciaMes === folhaData.competenciaMes &&
            f.competenciaAno === folhaData.competenciaAno &&
            f.periodo === folhaData.periodo
        );
        if (novaFolha) {
          setSelectedFolhaId(novaFolha.id);
        }
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Erro ao criar folha de pagamento.";
      showNotification("error", "Erro", message);
      
      // Reabrir modal em caso de erro
      setCreateModalOpen(true);
    } finally {
      setCentralLoading(false);
    }
  };

  const adicionarFuncionarios = async (funcionarioIds) => {
    if (!selectedFolha) {
      showNotification("warning", "Selecione uma folha.", "");
      return;
    }
    try {
      setCentralLoading(true);
      setCentralMessage("Adicionando funcionários...");
      await axiosInstance.post(
        `/api/arh/folhas/${selectedFolha.id}/lancamentos`,
        {
          funcionarioIds,
        },
      );
      showNotification("success", "Sucesso", "Funcionários adicionados!");
      setAddModalOpen(false);
      carregarLancamentos(selectedFolha.id);
      carregarFolhas();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Não foi possível adicionar os funcionários.";
      showNotification("error", "Erro", message);
    } finally {
      setCentralLoading(false);
    }
  };

  const removerFuncionario = async (lancamentoId) => {
    if (!selectedFolha) return;
    try {
      setCentralLoading(true);
      setCentralMessage("Removendo funcionário da folha...");
      await axiosInstance.delete(
        `/api/arh/folhas/${selectedFolha.id}/lancamentos/${lancamentoId}`,
      );
      showNotification("success", "Sucesso", "Funcionário removido da folha!");
      carregarLancamentos(selectedFolha.id);
      carregarFolhas();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao remover funcionário da folha.";
      showNotification("error", "Erro", message);
    } finally {
      setCentralLoading(false);
    }
  };

  const atualizarLancamento = async (values) => {
    if (!selectedFolha || !editLancamento.record) return;
    
    // Fechar modal imediatamente
    setEditLancamento({ open: false, record: null });
    
    try {
      setCentralLoading(true);
      setCentralMessage("Recalculando lançamento...");
      await axiosInstance.patch(
        `/api/arh/folhas/${selectedFolha.id}/lancamentos/${editLancamento.record.id}`,
        values,
      );
      showNotification("success", "Sucesso", "Lançamento atualizado!");
      carregarLancamentos(selectedFolha.id);
      carregarFolhas();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao atualizar o lançamento da folha.";
      showNotification("error", "Erro", message);
      
      // Reabrir modal em caso de erro
      setEditLancamento({ open: true, record: editLancamento.record });
    } finally {
      setCentralLoading(false);
    }
  };

  const marcarPagamento = async (values) => {
    if (!selectedFolha || !pagamentoModal.record) return;
    
    // Fechar modal imediatamente
    setPagamentoModal({ open: false, record: null });
    
    try {
      setCentralLoading(true);
      setCentralMessage("Atualizando pagamento...");
      await axiosInstance.patch(
        `/api/arh/folhas/${selectedFolha.id}/lancamentos/${pagamentoModal.record.id}/pagamento`,
        values,
      );
      showNotification("success", "Sucesso", "Pagamento atualizado!");
      carregarLancamentos(selectedFolha.id);
      carregarFolhas();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao atualizar o status do pagamento.";
      showNotification("error", "Erro", message);
      
      // Reabrir modal em caso de erro
      setPagamentoModal({ open: true, record: pagamentoModal.record });
    } finally {
      setCentralLoading(false);
    }
  };

  const finalizarFolha = async (dadosFinalizacao) => {
    if (!selectedFolha) return;
    
    // Fechar modal imediatamente
    setFinalizarModal(false);
    
    try {
      setCentralLoading(true);
      setCentralMessage("Finalizando folha...");
      await axiosInstance.patch(`/api/arh/folhas/${selectedFolha.id}/finalizar`, dadosFinalizacao);
      showNotification("success", "Sucesso", "Folha finalizada e aguardando liberação!");
      carregarFolhas();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao finalizar a folha.";
      showNotification("error", "Erro", message);
      
      // Reabrir modal em caso de erro
      setFinalizarModal(true);
    } finally {
      setCentralLoading(false);
    }
  };

  const editarFolha = async () => {
    if (!selectedFolha) return;
    try {
      setCentralLoading(true);
      setCentralMessage("Reabrindo folha para edição...");
      await axiosInstance.patch(`/api/arh/folhas/${selectedFolha.id}/reabrir`);
      showNotification("success", "Sucesso", "Folha reaberta para edição!");
      carregarFolhas();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao reabrir a folha.";
      showNotification("error", "Erro", message);
    } finally {
      setCentralLoading(false);
    }
  };

  const liberarFolha = async () => {
    if (!selectedFolha) return;
    
    // Fechar modal de confirmação
    setLiberarModalOpen(false);
    
    try {
      setCentralLoading(true);
      setCentralMessage("Liberando folha e processando pagamentos...");
      await axiosInstance.patch(`/api/arh/folhas/${selectedFolha.id}/liberar`);
      showNotification("success", "Sucesso", "Folha liberada e pagamentos processados!");
      carregarFolhas();
      carregarLancamentos(selectedFolha.id);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao liberar a folha.";
      showNotification("error", "Erro", message);
    } finally {
      setCentralLoading(false);
    }
  };

  const handleEditLancamento = useCallback((record) => {
    setEditLancamento({ open: true, record });
  }, []);

  const handleEditPagamento = useCallback((record) => {
    setPagamentoModal({ open: true, record });
  }, []);

  const canFinalize =
    selectedFolha &&
    !isGerenteCultura &&
    selectedFolha.status === "RASCUNHO";
  
  const canEdit =
    selectedFolha &&
    !isGerenteCultura &&
    selectedFolha.status === "PENDENTE_LIBERACAO";
  
  const canLiberate =
    selectedFolha &&
    isAdmin &&
    selectedFolha.status === "PENDENTE_LIBERACAO";

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
      }}
    >
      <CentralizedLoader
        visible={centralLoading}
        message={centralMessage}
        subMessage="Aguarde..."
      />

      {/* Header com título */}
      <Box sx={{ mb: 0 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "1.500rem",
          }}
        >
          <Icon
            icon="mdi:cash-multiple"
            style={{
              marginRight: 12,
              fontSize: isMobile ? "31px" : "31px",
              color: "#059669",
            }}
          />
          {isMobile ? "Folha de Pagamento" : "ARH • Folha de Pagamento"}
        </Title>
      </Box>

      {/* Botões de ação */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <PrimaryButton
          icon={<PlusCircleOutlined />}
          onClick={() => setCreateModalOpen(true)}
          disabled={isGerenteCultura}
        >
          Nova Folha
        </PrimaryButton>
      </Box>

      {/* Busca e Filtros */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <SearchInput
          placeholder={
            isMobile ? "Buscar..." : "Busque por competência ou referência..."
          }
          value={searchTerm}
          onChange={setSearchTerm}
          size={isMobile ? "small" : "middle"}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Todos os status", value: "ALL" },
            ...Object.entries(STATUS_FOLHA).map(([value, meta]) => ({
              label: meta.label,
              value,
            })),
          ]}
          suffixIcon={<FilterOutlined />}
          style={{ minWidth: 180 }}
          size={isMobile ? "small" : "middle"}
        />
      </Box>

      {/* Grid com duas colunas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 2,
        }}
      >
        {/* Coluna Folhas Registradas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              background: "#fff",
              borderRadius: 2,
              padding: 2,
              boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
            }}
          >
            <Title
              level={5}
              style={{
                color: "#059669",
                marginBottom: "8px",
                marginTop: "0",
                fontSize: "20px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Icon
                icon="mdi:file-document-multiple"
                style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }}
              />
              Folhas Registradas
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

            <Suspense fallback={<SuspenseFallback message="Carregando tabela..." />}>
              <FolhasTable
                folhas={filteredFolhas}
                loading={folhasLoading}
                onSelectFolha={setSelectedFolhaId}
                selectedFolhaId={selectedFolhaId}
              />
            </Suspense>
          </Box>
        </Box>

        {/* Coluna Resumo da Folha */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              background: "#fff",
              borderRadius: 2,
              padding: 2,
              minHeight: 220,
              boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
            }}
          >
            <Title
              level={5}
              style={{
                color: "#059669",
                marginBottom: "8px",
                marginTop: "0",
                fontSize: "20px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Icon
                icon="mdi:chart-box"
                style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }}
              />
              {selectedFolha ? `Resumo ${competenciaLabel(selectedFolha)}` : "Resumo"}
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

            {selectedFolha ? (
              <>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Chip label={`Total Bruto: ${currency(selectedFolha.totalBruto)}`} />
                  <Chip
                    label={`Total Líquido: ${currency(selectedFolha.totalLiquido)}`}
                    color="success"
                  />
                  <Chip
                    label={`Pago: ${currency(selectedFolha.totalPago)}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`Pendente: ${currency(selectedFolha.totalPendente)}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip label={`Lançamentos: ${selectedFolha.quantidadeLancamentos}`} />
                </Box>
                <Space wrap>
                  <PrimaryButton
                    icon={<OrderedListOutlined />}
                    disabled={selectedFolha?.status !== "RASCUNHO"}
                    onClick={() => setAddModalOpen(true)}
                  >
                    Adicionar Funcionários
                  </PrimaryButton>
                  <PrimaryButton
                    icon={<LockOutlined />}
                    disabled={!canFinalize}
                    onClick={() => setFinalizarModal(true)}
                  >
                    Finalizar Folha
                  </PrimaryButton>
                  <PrimaryButton
                    icon={<EditOutlined />}
                    disabled={!canEdit}
                    onClick={editarFolha}
                    style={{
                      backgroundColor: canEdit ? "#fa8c16" : undefined,
                      borderColor: canEdit ? "#fa8c16" : undefined,
                    }}
                  >
                    Editar Folha
                  </PrimaryButton>
                  <PrimaryButton
                    icon={<UnlockOutlined />}
                    disabled={!canLiberate}
                    onClick={() => setLiberarModalOpen(true)}
                  >
                    Liberar Folha
                  </PrimaryButton>
                </Space>
              </>
            ) : (
              <Typography.Text style={{ color: "#94a3b8" }}>
                Selecione uma folha para visualizar os detalhes.
              </Typography.Text>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabela de Lançamentos */}
      <Box
        sx={{
          background: "#fff",
          borderRadius: 2,
          padding: 2,
          boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
        }}
      >
        <Title
          level={5}
          style={{
            color: "#059669",
            marginBottom: "8px",
            marginTop: "0",
            fontSize: "20px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Icon
            icon="mdi:format-list-bulleted"
            style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }}
          />
          Lançamentos da Folha
        </Title>
        <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

        <Suspense fallback={<SuspenseFallback message="Carregando lançamentos..." />}>
          <LancamentosTable
            lancamentos={lancamentos}
            loading={lancamentosLoading}
            onEditLancamento={handleEditLancamento}
            onEditPagamento={handleEditPagamento}
            onRemoveFuncionario={removerFuncionario}
          />
        </Suspense>
      </Box>

      {/* Modal Nova Folha */}
        <Suspense fallback={<SuspenseFallback message="Carregando lançamentos..." />}>
        <NovaFolhaDialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSave={salvarFolha}
        />
      </Suspense>

      {/* Modal Adicionar Funcionários */}
      <Suspense fallback={<SuspenseFallback message="Carregando..." />}>
        <AdicionarFuncionariosDialog
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSave={adicionarFuncionarios}
          funcionarios={funcionarios}
          funcionariosNaFolha={lancamentos}
        />
      </Suspense>

      {/* Modal Editar Lançamento */}
        <Suspense fallback={<SuspenseFallback message="Carregando lançamentos..." />}>
        <EditarLancamentoDialog
          open={editLancamento.open}
          onClose={() => setEditLancamento({ open: false, record: null })}
          onSave={atualizarLancamento}
          lancamento={editLancamento.record}
        />
      </Suspense>

      {/* Modal Atualizar Pagamento */}
        <Suspense fallback={<SuspenseFallback message="Carregando lançamentos..." />}>
        <AtualizarPagamentoDialog
          open={pagamentoModal.open}
          onClose={() => setPagamentoModal({ open: false, record: null })}
          onSave={marcarPagamento}
          lancamento={pagamentoModal.record}
        />
      </Suspense>

      {/* Modal Finalizar Folha */}
        <Suspense fallback={<SuspenseFallback message="Carregando lançamentos..." />}>
        <FinalizarFolhaDialog
          open={finalizarModal}
          onClose={() => setFinalizarModal(false)}
          onSave={finalizarFolha}
          folha={selectedFolha}
        />
      </Suspense>

      {/* Modal Liberar Folha */}
      <ConfirmActionModal
        open={liberarModalOpen}
        onConfirm={liberarFolha}
        onCancel={() => setLiberarModalOpen(false)}
        title="Liberar Folha de Pagamento?"
        confirmText="Sim, Liberar Folha"
        cancelText="Cancelar"
        confirmButtonDanger={false}
        icon={<UnlockOutlined />}
        iconColor="#059669"
        customContent={
          selectedFolha && (
            <div style={{ padding: "16px 0" }}>
              <Typography.Title level={5} style={{ marginBottom: 16, color: "#059669" }}>
                Resumo da Folha
              </Typography.Title>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography.Text strong>Competência:</Typography.Text>
                  <Typography.Text>{competenciaLabel(selectedFolha)}</Typography.Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography.Text strong>Total Líquido:</Typography.Text>
                  <Typography.Text style={{ color: "#059669", fontWeight: "600" }}>
                    {currency(selectedFolha.totalLiquido)}
                  </Typography.Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography.Text strong>Total Pago:</Typography.Text>
                  <Typography.Text>{currency(selectedFolha.totalPago)}</Typography.Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography.Text strong>Pendente:</Typography.Text>
                  <Typography.Text style={{ color: "#faad14", fontWeight: "600" }}>
                    {currency(selectedFolha.totalPendente)}
                  </Typography.Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography.Text strong>Lançamentos:</Typography.Text>
                  <Typography.Text>{selectedFolha.quantidadeLancamentos}</Typography.Text>
                </div>
                <Divider style={{ margin: "12px 0" }} />
                <Typography.Text type="warning" style={{ fontSize: "12px", display: "block", marginTop: "8px" }}>
                  ⚠️ Após liberar, não será possível editar os valores. Pagamentos serão processados conforme o método definido.
                </Typography.Text>
              </div>
            </div>
          )
        }
      />
    </Box>
  );
};

export default ArhFolhaPagamento;
