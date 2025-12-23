// src/pages/ArhFuncionarios.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Spin, Pagination } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { CentralizedLoader } from "components/common/loaders";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { PrimaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";
import useResponsive from "../hooks/useResponsive";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const AddEditFuncionarioDialog = lazy(() =>
  import("../components/arh/funcionarios/AddEditFuncionarioDialog")
);
const FuncionariosTable = lazy(() =>
  import("../components/arh/funcionarios/FuncionariosTable")
);

const { Title } = Typography;

const ArhFuncionarios = () => {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState([]);

  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados da aplicação
  const [loading, setLoading] = useState(false);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);

  // Estado para loading centralizado
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");

  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState(null);
  const [dadosTemporarios, setDadosTemporarios] = useState(null);

  // Estados para cargos, funções e gerentes
  const [cargos, setCargos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [gerentes, setGerentes] = useState([]);

  const isGerenteCultura = user?.nivel === "GERENTE_CULTURA";
  const canCreate = !isGerenteCultura;

  // Função para buscar todos os funcionários (sem paginação no backend)
  const fetchFuncionarios = useCallback(async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando funcionários...");
      setLoading(true);

      // Buscar todos os registros de funcionários, cargos, funções e gerentes
      // Não enviar parâmetros de paginação para receber todos os dados
      const [funcRes, cargoRes, funcaoRes, gerentesRes] = await Promise.all([
        axiosInstance.get("/api/arh/funcionarios"),
        axiosInstance.get("/api/arh/cargos/ativos"),
        axiosInstance.get("/api/arh/funcoes/ativas"),
        axiosInstance.get("/api/arh/funcionarios/gerentes"),
      ]);

      const lista = funcRes.data?.data || funcRes.data || [];

      setFuncionarios(lista);
      setFuncionariosFiltrados(lista);
      setTotalFuncionarios(lista.length || 0);
      setCurrentPage(1);

      setCargos(cargoRes.data || []);
      setFuncoes(funcaoRes.data || []);
      setGerentes(gerentesRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      showNotification("error", "Erro", "Erro ao carregar funcionários");
      setFuncionarios([]);
      setFuncionariosFiltrados([]);
      setTotalFuncionarios(0);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, []);

  // Carregar funcionários na inicialização (uma vez)
  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  // Filtrar localmente por termo de busca, status e tipo
  useEffect(() => {
    let lista = [...funcionarios];

    const termo = (searchTerm || "").toLowerCase().trim();
    if (termo) {
      lista = lista.filter((func) => {
        const nome = func.nome?.toLowerCase() || "";
        const apelido = func.apelido?.toLowerCase() || "";
        const cpf = func.cpf?.toLowerCase() || "";
        const termoNumerico = termo.replace(/\D/g, "");
        const cpfNumerico = cpf.replace(/\D/g, "");
        return (
          nome.includes(termo) ||
          apelido.includes(termo) ||
          cpf.includes(termo) ||
          (termoNumerico && cpfNumerico.includes(termoNumerico))
        );
      });
    }

    if (statusFilter) {
      lista = lista.filter((func) => func.status === statusFilter);
    }

    if (tipoFilter) {
      lista = lista.filter((func) => func.tipoContrato === tipoFilter);
    }

    setFuncionariosFiltrados(lista);
    setTotalFuncionarios(lista.length || 0);
    // Ao alterar filtros, resetar para a primeira página
    setCurrentPage(1);
  }, [funcionarios, searchTerm, statusFilter, tipoFilter]);

  // Calcular dados paginados para exibição na tabela
  const dadosPaginados = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return funcionariosFiltrados.slice(startIndex, endIndex);
  }, [funcionariosFiltrados, currentPage, pageSize]);

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

  // Função para lidar com mudança de filtro de tipo
  const handleTipoFilter = useCallback((tipo) => {
    setTipoFilter(tipo);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  }, []);

  // Função para lidar com mudança de página
  const handlePageChange = useCallback((page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Função para abrir modal de criação
  const handleOpenCreateModal = useCallback(() => {
    setFuncionarioEditando(null);
    setModalOpen(true);
  }, []);

  // Função para abrir modal de edição
  const handleOpenEditModal = useCallback((funcionario) => {
    setFuncionarioEditando(funcionario);
    setModalOpen(true);
  }, []);

  // Função para fechar modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setFuncionarioEditando(null);
    setDadosTemporarios(null); // Limpar dados temporários
  }, []);

  // Função para salvar funcionário (criar ou editar)
  const handleSaveFuncionario = useCallback(
    async (funcionarioData) => {
      // Preservar o ID do funcionário antes de fechar o modal
      const funcionarioId = funcionarioEditando?.id;

      // Limpar campos vazios (strings vazias) antes de enviar,
      // preservando null explicitamente nos campos de PIX para forçar limpeza no backend
      const camposPix = new Set([
        "tipoChavePix",
        "modalidadeChave",
        "chavePix",
        "responsavelChavePix",
      ]);
      const cleanedData = { ...funcionarioData };
      Object.keys(cleanedData).forEach((key) => {
        const value = cleanedData[key];
        if (value === "") {
          cleanedData[key] = undefined;
          return;
        }
        if (value === null && !camposPix.has(key)) {
          cleanedData[key] = undefined;
        }
      });

      // FECHAR MODAL IMEDIATAMENTE ao clicar em salvar
      handleCloseModal();

      try {
        setCentralizedLoading(true);
        setLoadingMessage(
          funcionarioId
            ? "Atualizando funcionário..."
            : "Criando funcionário..."
        );
        setLoading(true);

        if (funcionarioId) {
          // Editando funcionário existente
          await axiosInstance.patch(
            `/api/arh/funcionarios/${funcionarioId}`,
            cleanedData
          );
          showNotification("success", "Sucesso", "Funcionário atualizado com sucesso!");
        } else {
          // Criando novo funcionário
          await axiosInstance.post("/api/arh/funcionarios", cleanedData);
          showNotification("success", "Sucesso", "Funcionário criado com sucesso!");
        }

        // Atualizar mensagem para recarregamento
        setLoadingMessage("Atualizando lista de funcionários...");

        // Recarregar lista completa de funcionários
        await fetchFuncionarios();

        // Limpar dados temporários após sucesso
        setDadosTemporarios(null);
      } catch (error) {
        console.error("Erro ao salvar funcionário:", error);
        const message =
          error.response?.data?.message || "Erro ao salvar funcionário";
        showNotification("error", "Erro", message);

        // MANTER OS DADOS PREENCHIDOS EM CASO DE ERRO
        setDadosTemporarios(cleanedData);

        // REABRIR MODAL EM CASO DE ERRO
        if (funcionarioId) {
          // Se estava editando, recriar o objeto funcionarioEditando com o ID
          setFuncionarioEditando({ id: funcionarioId, ...cleanedData });
        } else {
          // Se era novo funcionário, usar os dados preenchidos
          setFuncionarioEditando(funcionarioData);
        }
        setModalOpen(true);
      } finally {
        setLoading(false);
        setCentralizedLoading(false);
      }
    },
    [funcionarioEditando, fetchFuncionarios, handleCloseModal]
  );

  // Função para atualizar status do funcionário
  const handleToggleStatus = useCallback(
    async (funcionario) => {
      try {
        setCentralizedLoading(true);
        setLoadingMessage("Atualizando status do funcionário...");

        await axiosInstance.patch(`/api/arh/funcionarios/${funcionario.id}/status`, {
          status: funcionario.status === "ATIVO" ? "INATIVO" : "ATIVO",
        });

        showNotification(
          "success",
          "Sucesso",
          `Funcionário ${funcionario.status === "ATIVO" ? "inativado" : "ativado"} com sucesso!`
        );

        // Atualizar mensagem para recarregamento
        setLoadingMessage("Atualizando lista de funcionários...");

        // Recarregar lista completa de funcionários
        await fetchFuncionarios();
      } catch (error) {
        console.error("Erro ao atualizar status do funcionário:", error);
        const message =
          error.response?.data?.message ||
          "Erro ao atualizar status do funcionário";
        showNotification("error", "Erro", message);
      } finally {
        setCentralizedLoading(false);
      }
    },
    [fetchFuncionarios]
  );

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
            fontSize: "1.500rem", // 22px - um pouco menor que o padrão do level 2
          }}
        >
          {/* Ícone principal da página */}
          <Icon
            icon="mdi:account-group"
            style={{
              marginRight: 12,
              fontSize: isMobile ? "31px" : "31px",
              color: "#059669",
            }}
          />
          {isMobile ? "Funcionários" : "Gestão de Funcionários"}
        </Title>
      </Box>

      {/* Botão Novo Funcionário */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <PrimaryButton
          onClick={handleOpenCreateModal}
          icon={<PlusCircleOutlined />}
          disabled={!canCreate}
        >
          Novo Funcionário
        </PrimaryButton>
      </Box>

      {/* Busca */}
      <Box sx={{ mb: 2 }}>
        <SearchInput
          placeholder={
            isMobile ? "Buscar..." : "Buscar funcionários por nome, apelido ou CPF..."
          }
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          size={isMobile ? "small" : "middle"}
          style={{
            width: "100%",
            fontSize: isMobile ? "0.875rem" : "1rem",
          }}
        />
      </Box>

      {/* Tabela de Funcionários */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Suspense fallback={<LoadingFallback />}>
          <FuncionariosTable
            funcionarios={dadosPaginados}
            loading={false}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onStatusFilter={handleStatusFilter}
            onTipoFilter={handleTipoFilter}
            currentStatusFilter={statusFilter}
            currentTipoFilter={tipoFilter}
            currentPage={currentPage}
            pageSize={pageSize}
          />
        </Suspense>

        {/* Paginação */}
        {totalFuncionarios > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalFuncionarios}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              showSizeChanger={!isMobile}
              showTotal={(total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]}/${total}`
                  : `${range[0]}-${range[1]} de ${total} funcionários`
              }
              pageSizeOptions={["10", "20", "50", "100"]}
              size={isMobile ? "small" : "default"}
            />
          </Box>
        )}
      </Box>

      {/* Modais */}
      <Suspense fallback={<Spin size="large" />}>
        <AddEditFuncionarioDialog
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveFuncionario}
          funcionario={funcionarioEditando}
          cargos={cargos}
          funcoes={funcoes}
          gerentes={gerentes}
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

export default ArhFuncionarios;
