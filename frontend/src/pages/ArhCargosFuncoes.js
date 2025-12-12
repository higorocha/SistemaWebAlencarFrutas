// src/pages/ArhCargosFuncoes.js

import React, { useEffect, useState, useCallback, Suspense, lazy, useMemo } from "react";
import { Typography, Spin, Select, Divider, Pagination } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { CentralizedLoader } from "components/common/loaders";
import { PrimaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";
import useResponsive from "../hooks/useResponsive";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";

const AddEditCargoDialog = lazy(() => import("../components/arh/cargos/AddEditCargoDialog"));
const AddEditFuncaoDialog = lazy(() => import("../components/arh/funcoes/AddEditFuncaoDialog"));
const CargosTable = lazy(() => import("../components/arh/cargos/CargosTable"));
const FuncoesTable = lazy(() => import("../components/arh/funcoes/FuncoesTable"));

const { Title } = Typography;

const ArhCargosFuncoes = () => {
  const { isMobile } = useResponsive();
  
  // Estados para cargos
  const [cargos, setCargos] = useState([]);
  const [cargoModalOpen, setCargoModalOpen] = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [searchCargo, setSearchCargo] = useState("");
  const [statusFilterCargo, setStatusFilterCargo] = useState("ALL");
  const [currentPageCargo, setCurrentPageCargo] = useState(1);
  const [pageSizeCargo, setPageSizeCargo] = useState(20);
  
  // Estados para funções
  const [funcoes, setFuncoes] = useState([]);
  const [funcaoModalOpen, setFuncaoModalOpen] = useState(false);
  const [funcaoEditando, setFuncaoEditando] = useState(null);
  const [searchFuncao, setSearchFuncao] = useState("");
  const [statusFilterFuncao, setStatusFilterFuncao] = useState("ALL");
  const [currentPageFuncao, setCurrentPageFuncao] = useState(1);
  const [pageSizeFuncao, setPageSizeFuncao] = useState(20);
  
  // Estados gerais
  const [loading, setLoading] = useState(false);
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");

  // Buscar cargos
  const fetchCargos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/arh/cargos", { params: { limit: 100 } });
      const lista = response.data?.data || response.data || [];
      setCargos(lista);
    } catch (error) {
      console.error("Erro ao buscar cargos:", error);
      showNotification("error", "Erro", "Erro ao carregar cargos");
      setCargos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar funções
  const fetchFuncoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/arh/funcoes", { params: { limit: 100 } });
      const lista = response.data?.data || response.data || [];
      setFuncoes(lista);
    } catch (error) {
      console.error("Erro ao buscar funções:", error);
      showNotification("error", "Erro", "Erro ao carregar funções");
      setFuncoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar cargos localmente
  const cargosFiltrados = useMemo(() => {
    let lista = [...cargos];
    
    // Filtro de busca
    const termo = (searchCargo || "").toLowerCase().trim();
    if (termo) {
      lista = lista.filter((cargo) => {
        const nome = cargo.nome?.toLowerCase() || "";
        const descricao = cargo.descricao?.toLowerCase() || "";
        return nome.includes(termo) || descricao.includes(termo);
      });
    }
    
    // Filtro de status
    if (statusFilterCargo !== "ALL") {
      const ativo = statusFilterCargo === "ACTIVE";
      lista = lista.filter((cargo) => cargo.ativo === ativo);
    }
    
    return lista;
  }, [cargos, searchCargo, statusFilterCargo]);

  // Filtrar funções localmente
  const funcoesFiltradas = useMemo(() => {
    let lista = [...funcoes];
    
    // Filtro de busca
    const termo = (searchFuncao || "").toLowerCase().trim();
    if (termo) {
      lista = lista.filter((funcao) => {
        const nome = funcao.nome?.toLowerCase() || "";
        const descricao = funcao.descricao?.toLowerCase() || "";
        return nome.includes(termo) || descricao.includes(termo);
      });
    }
    
    // Filtro de status
    if (statusFilterFuncao !== "ALL") {
      const ativo = statusFilterFuncao === "ACTIVE";
      lista = lista.filter((funcao) => funcao.ativo === ativo);
    }
    
    return lista;
  }, [funcoes, searchFuncao, statusFilterFuncao]);

  // Dados paginados para cargos
  const cargosPaginados = useMemo(() => {
    const startIndex = (currentPageCargo - 1) * pageSizeCargo;
    const endIndex = startIndex + pageSizeCargo;
    return cargosFiltrados.slice(startIndex, endIndex);
  }, [cargosFiltrados, currentPageCargo, pageSizeCargo]);

  // Dados paginados para funções
  const funcoesPaginadas = useMemo(() => {
    const startIndex = (currentPageFuncao - 1) * pageSizeFuncao;
    const endIndex = startIndex + pageSizeFuncao;
    return funcoesFiltradas.slice(startIndex, endIndex);
  }, [funcoesFiltradas, currentPageFuncao, pageSizeFuncao]);

  // Carregar dados na inicialização
  useEffect(() => {
    setCentralizedLoading(true);
    setLoadingMessage("Carregando cargos e funções...");
    Promise.all([fetchCargos(), fetchFuncoes()]).finally(() => {
      setCentralizedLoading(false);
    });
  }, [fetchCargos, fetchFuncoes]);

  // Handlers para Cargos
  const handleOpenCreateCargoModal = useCallback(() => {
    setCargoEditando(null);
    setCargoModalOpen(true);
  }, []);

  const handleOpenEditCargoModal = useCallback((cargo) => {
    setCargoEditando(cargo);
    setCargoModalOpen(true);
  }, []);

  const handleCloseCargoModal = useCallback(() => {
    setCargoModalOpen(false);
    setCargoEditando(null);
  }, []);

  const handleSaveCargo = useCallback(async (cargoData) => {
    handleCloseCargoModal();

    try {
      setCentralizedLoading(true);
      setLoadingMessage(cargoEditando ? "Atualizando cargo..." : "Criando cargo...");

      if (cargoEditando) {
        await axiosInstance.patch(`/api/arh/cargos/${cargoEditando.id}`, cargoData);
        showNotification("success", "Sucesso", "Cargo atualizado com sucesso!");
      } else {
        await axiosInstance.post("/api/arh/cargos", cargoData);
        showNotification("success", "Sucesso", "Cargo criado com sucesso!");
      }

      setLoadingMessage("Atualizando lista de cargos...");
      await fetchCargos();

    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      const message = error.response?.data?.message || "Erro ao salvar cargo";
      showNotification("error", "Erro", message);

      // Reabrir modal em caso de erro
      if (cargoEditando) {
        setCargoEditando({ ...cargoEditando, ...cargoData });
      } else {
        setCargoEditando(cargoData);
      }
      setCargoModalOpen(true);

    } finally {
      setCentralizedLoading(false);
    }
  }, [cargoEditando, fetchCargos, handleCloseCargoModal]);

  const handleToggleCargoStatus = useCallback(async (cargo) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Atualizando status do cargo...");

      await axiosInstance.patch(`/api/arh/cargos/${cargo.id}/status`, {
        ativo: !cargo.ativo,
      });

      showNotification("success", "Sucesso", `Cargo ${!cargo.ativo ? "ativado" : "inativado"} com sucesso!`);
      await fetchCargos();

    } catch (error) {
      console.error("Erro ao atualizar status do cargo:", error);
      const message = error.response?.data?.message || "Erro ao atualizar status do cargo";
      showNotification("error", "Erro", message);
    } finally {
      setCentralizedLoading(false);
    }
  }, [fetchCargos]);

  // Handlers de paginação para Cargos
  const handlePageChangeCargo = useCallback((page, size) => {
    setCurrentPageCargo(page);
    if (size && size !== pageSizeCargo) {
      setPageSizeCargo(size);
      setCurrentPageCargo(1);
    }
  }, [pageSizeCargo]);

  const handleShowSizeChangeCargo = useCallback((current, size) => {
    setPageSizeCargo(size);
    setCurrentPageCargo(1);
  }, []);

  // Handlers para Funções
  const handleOpenCreateFuncaoModal = useCallback(() => {
    setFuncaoEditando(null);
    setFuncaoModalOpen(true);
  }, []);

  const handleOpenEditFuncaoModal = useCallback((funcao) => {
    setFuncaoEditando(funcao);
    setFuncaoModalOpen(true);
  }, []);

  const handleCloseFuncaoModal = useCallback(() => {
    setFuncaoModalOpen(false);
    setFuncaoEditando(null);
  }, []);

  const handleSaveFuncao = useCallback(async (funcaoData) => {
    handleCloseFuncaoModal();

    try {
      setCentralizedLoading(true);
      setLoadingMessage(funcaoEditando ? "Atualizando função..." : "Criando função...");

      if (funcaoEditando) {
        await axiosInstance.patch(`/api/arh/funcoes/${funcaoEditando.id}`, funcaoData);
        showNotification("success", "Sucesso", "Função atualizada com sucesso!");
      } else {
        await axiosInstance.post("/api/arh/funcoes", funcaoData);
        showNotification("success", "Sucesso", "Função criada com sucesso!");
      }

      setLoadingMessage("Atualizando lista de funções...");
      await fetchFuncoes();

    } catch (error) {
      console.error("Erro ao salvar função:", error);
      const message = error.response?.data?.message || "Erro ao salvar função";
      showNotification("error", "Erro", message);

      // Reabrir modal em caso de erro
      if (funcaoEditando) {
        setFuncaoEditando({ ...funcaoEditando, ...funcaoData });
      } else {
        setFuncaoEditando(funcaoData);
      }
      setFuncaoModalOpen(true);

    } finally {
      setCentralizedLoading(false);
    }
  }, [funcaoEditando, fetchFuncoes, handleCloseFuncaoModal]);

  const handleToggleFuncaoStatus = useCallback(async (funcao) => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Atualizando status da função...");

      await axiosInstance.patch(`/api/arh/funcoes/${funcao.id}/status`, {
        ativo: !funcao.ativo,
      });

      showNotification("success", "Sucesso", `Função ${!funcao.ativo ? "ativada" : "inativada"} com sucesso!`);
      await fetchFuncoes();

    } catch (error) {
      console.error("Erro ao atualizar status da função:", error);
      const message = error.response?.data?.message || "Erro ao atualizar status da função";
      showNotification("error", "Erro", message);
    } finally {
      setCentralizedLoading(false);
    }
  }, [fetchFuncoes]);

  // Handlers de paginação para Funções
  const handlePageChangeFuncao = useCallback((page, size) => {
    setCurrentPageFuncao(page);
    if (size && size !== pageSizeFuncao) {
      setPageSizeFuncao(size);
      setCurrentPageFuncao(1);
    }
  }, [pageSizeFuncao]);

  const handleShowSizeChangeFuncao = useCallback((current, size) => {
    setPageSizeFuncao(size);
    setCurrentPageFuncao(1);
  }, []);

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
            fontSize: '1.500rem'
          }}
        >
          <Icon 
            icon="mdi:briefcase-account" 
            style={{ 
              marginRight: 12, 
              fontSize: isMobile ? '31px' : '31px',
              color: "#059669"
            }} 
          />
          {isMobile ? "Cargos & Funções" : "ARH • Cargos & Funções"}
        </Title>
      </Box>

      {/* Grid com duas colunas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 2,
        }}
      >
        {/* Coluna Cargos */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Botão Novo Cargo */}
          <Box>
            <PrimaryButton
              onClick={handleOpenCreateCargoModal}
              icon={<PlusCircleOutlined />}
            >
              Novo Cargo
            </PrimaryButton>
          </Box>

          {/* Card com busca, filtro e tabela */}
          <Box
            sx={{
              background: "#fff",
              borderRadius: 2,
              padding: 2,
              boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
              minHeight: "750px",
              display: "flex",
              flexDirection: "column",
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
              <Icon icon="mdi:briefcase" style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }} />
              Cargos Mensalistas
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

            {/* Busca e Filtro */}
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <SearchInput
                placeholder={isMobile ? "Buscar..." : "Buscar cargo..."}
                value={searchCargo}
                onChange={(value) => {
                  setSearchCargo(value);
                  setCurrentPageCargo(1);
                }}
                size={isMobile ? "small" : "middle"}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Select
                value={statusFilterCargo}
                onChange={(value) => {
                  setStatusFilterCargo(value);
                  setCurrentPageCargo(1);
                }}
                size={isMobile ? "small" : "middle"}
                style={{ width: 120 }}
              >
                <Select.Option value="ALL">Todos</Select.Option>
                <Select.Option value="ACTIVE">Ativos</Select.Option>
                <Select.Option value="INACTIVE">Inativos</Select.Option>
              </Select>
            </Box>

            {/* Tabela */}
            <Suspense fallback={<Spin />}>
              <CargosTable
                cargos={cargosPaginados}
                loading={loading}
                onEdit={handleOpenEditCargoModal}
                onToggleStatus={handleToggleCargoStatus}
                currentPage={currentPageCargo}
                pageSize={pageSizeCargo}
              />
            </Suspense>

            {/* Paginação */}
            {cargosFiltrados.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Pagination
                  current={currentPageCargo}
                  pageSize={pageSizeCargo}
                  total={cargosFiltrados.length}
                  onChange={handlePageChangeCargo}
                  onShowSizeChange={handleShowSizeChangeCargo}
                  showSizeChanger={!isMobile}
                  showTotal={(total, range) =>
                    isMobile
                      ? `${range[0]}-${range[1]}/${total}`
                      : `${range[0]}-${range[1]} de ${total} cargos`
                  }
                  pageSizeOptions={['10', '20', '50', '100']}
                />
              </Box>
            )}

            {/* Info de totais */}
            <Box sx={{ mt: 1, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Total: {cargosFiltrados.length} {cargosFiltrados.length === 1 ? "cargo" : "cargos"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Coluna Funções */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Botão Nova Função */}
          <Box>
            <PrimaryButton
              onClick={handleOpenCreateFuncaoModal}
              icon={<PlusCircleOutlined />}
            >
              Nova Função
            </PrimaryButton>
          </Box>

          {/* Card com busca, filtro e tabela */}
          <Box
            sx={{
              background: "#fff",
              borderRadius: 2,
              padding: 2,
              boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
              minHeight: "750px",
              display: "flex",
              flexDirection: "column",
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
              <Icon icon="mdi:account-hard-hat" style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }} />
              Funções Diaristas
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

            {/* Busca e Filtro */}
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <SearchInput
                placeholder={isMobile ? "Buscar..." : "Buscar função..."}
                value={searchFuncao}
                onChange={(value) => {
                  setSearchFuncao(value);
                  setCurrentPageFuncao(1);
                }}
                size={isMobile ? "small" : "middle"}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Select
                value={statusFilterFuncao}
                onChange={(value) => {
                  setStatusFilterFuncao(value);
                  setCurrentPageFuncao(1);
                }}
                size={isMobile ? "small" : "middle"}
                style={{ width: 120 }}
              >
                <Select.Option value="ALL">Todas</Select.Option>
                <Select.Option value="ACTIVE">Ativas</Select.Option>
                <Select.Option value="INACTIVE">Inativas</Select.Option>
              </Select>
            </Box>

            {/* Tabela */}
            <Suspense fallback={<Spin />}>
              <FuncoesTable
                funcoes={funcoesPaginadas}
                loading={loading}
                onEdit={handleOpenEditFuncaoModal}
                onToggleStatus={handleToggleFuncaoStatus}
                currentPage={currentPageFuncao}
                pageSize={pageSizeFuncao}
              />
            </Suspense>

            {/* Paginação */}
            {funcoesFiltradas.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Pagination
                  current={currentPageFuncao}
                  pageSize={pageSizeFuncao}
                  total={funcoesFiltradas.length}
                  onChange={handlePageChangeFuncao}
                  onShowSizeChange={handleShowSizeChangeFuncao}
                  showSizeChanger={!isMobile}
                  showTotal={(total, range) =>
                    isMobile
                      ? `${range[0]}-${range[1]}/${total}`
                      : `${range[0]}-${range[1]} de ${total} funções`
                  }
                  pageSizeOptions={['10', '20', '50', '100']}
                />
              </Box>
            )}

            {/* Info de totais */}
            <Box sx={{ mt: 1, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Total: {funcoesFiltradas.length} {funcoesFiltradas.length === 1 ? "função" : "funções"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modais */}
      <Suspense fallback={<Spin size="large" />}>
        <AddEditCargoDialog
          open={cargoModalOpen}
          onClose={handleCloseCargoModal}
          onSave={handleSaveCargo}
          cargo={cargoEditando}
          loading={false}
        />
      </Suspense>

      <Suspense fallback={<Spin size="large" />}>
        <AddEditFuncaoDialog
          open={funcaoModalOpen}
          onClose={handleCloseFuncaoModal}
          onSave={handleSaveFuncao}
          funcao={funcaoEditando}
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

export default ArhCargosFuncoes;
