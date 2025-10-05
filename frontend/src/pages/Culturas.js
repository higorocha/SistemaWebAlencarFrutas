// src/pages/Culturas.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Modal, Spin } from "antd";
import {
  PlusCircleOutlined,
  PartitionOutlined,
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

const CulturasTable = lazy(() => import("../components/culturas/CulturasTable"));
const AddEditCulturaDialog = lazy(() =>
  import("../components/culturas/AddEditCulturaDialog")
);

const { Title } = Typography;

const Culturas = () => {
  const { isMobile, isTablet } = useResponsive();
  const [culturas, setCulturas] = useState([]);
  const [culturasFiltradas, setCulturasFiltradas] = useState([]);

  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [openDialog, setOpenDialog] = useState(false);
  const [culturaAtual, setCulturaAtual] = useState({
    id: null,
    descricao: "",
    periodicidade: "",
    permitirConsorcio: false,
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para CentralizedLoader
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");

  const API_URL = {
    culturas: "/api/culturas",
  };

  useEffect(() => {
    buscarCulturas();
  }, []);

  const buscarCulturas = useCallback(async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando culturas...");
      setIsLoading(true);

      const response = await axiosInstance.get(API_URL.culturas);

      setCulturas(response.data || []);
      setCulturasFiltradas(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar culturas:", error);
      showNotification("error", "Erro", "Erro ao buscar culturas.");
    } finally {
      setIsLoading(false);
      setCentralizedLoading(false);
    }
  }, [API_URL.culturas]);

  const handleOpenDialog = useCallback(() => {
    setCulturaAtual({
      id: null,
      descricao: "",
      periodicidade: "",
      permitirConsorcio: false,
    });
    setEditando(false);
    setErros({});
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setErros({});
  }, []);

  // Funções para controle da paginação
  const handlePageChange = useCallback((page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Volta para primeira página quando muda o tamanho
    }
  }, [pageSize]);

  const handleShowSizeChange = useCallback((current, size) => {
    setPageSize(size);
    setCurrentPage(1); // Volta para primeira página quando muda o tamanho
  }, []);

  const handleSalvarCultura = useCallback(async () => {
    if (isSaving) return;

    const novosErros = {};

    if (!culturaAtual.descricao || culturaAtual.descricao.trim() === "") {
      novosErros.descricao = "Descrição da cultura é obrigatória";
    }

    if (!culturaAtual.periodicidade) {
      novosErros.periodicidade = "Periodicidade é obrigatória";
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      showNotification("error", "Erro ao salvar", "Preencha todos os campos obrigatórios.");
      return;
    }

    // FECHAR MODAL IMEDIATAMENTE ao clicar em salvar
    handleCloseDialog();

    try {
      setCentralizedLoading(true);
      setLoadingMessage(editando ? "Atualizando cultura..." : "Criando cultura...");
      setIsSaving(true);

      // Garantir que apenas as propriedades necessárias sejam enviadas
      const dadosParaEnvio = {
        descricao: culturaAtual.descricao,
        periodicidade: culturaAtual.periodicidade,
        permitirConsorcio: culturaAtual.permitirConsorcio || false,
      };

      console.log("DEBUG_SAVE: Dados enviados para o backend:", dadosParaEnvio);

      if (editando) {
        // Para edição, remover o id do payload se existir
        const { id, ...dadosParaUpdate } = dadosParaEnvio;
        await axiosInstance.patch(`${API_URL.culturas}/${culturaAtual.id}`, dadosParaUpdate);
        showNotification("success", "Sucesso", "Cultura atualizada com sucesso!");
      } else {
        await axiosInstance.post(API_URL.culturas, dadosParaEnvio);
        showNotification("success", "Sucesso", "Cultura cadastrada com sucesso!");
      }

      setLoadingMessage("Atualizando lista de culturas...");
      await buscarCulturas();
    } catch (error) {
      console.error("Erro ao salvar cultura:", error.response?.data || error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erro desconhecido ao salvar.";
      showNotification("error", "Erro", errorMessage);

      // REABRIR MODAL EM CASO DE ERRO
      setCulturaAtual(editando ? culturaAtual : {
        id: null,
        descricao: "",
        periodicidade: "",
        permitirConsorcio: false,
      });
      setEditando(editando);
      setOpenDialog(true);
    } finally {
      setIsSaving(false);
      setCentralizedLoading(false);
    }
  }, [culturaAtual, editando, isSaving, API_URL.culturas, buscarCulturas, handleCloseDialog]);

  const handleEditarCultura = useCallback(
    (cultura) => {
      console.log("Cultura recebida para edição:", cultura);

      setCulturaAtual({
        id: cultura.id,
        descricao: cultura.descricao,
        periodicidade: cultura.periodicidade,
        permitirConsorcio: cultura.permitirConsorcio || false,
      });

      setEditando(true);
      setOpenDialog(true);
    },
    []
  );

  const handleExcluirCultura = useCallback(
    async (id) => {
      Modal.confirm({
        title: "Confirmar exclusão",
        content:
          "Tem certeza de que deseja excluir esta cultura? Essa ação não pode ser desfeita.",
        okText: "Sim",
        okType: "danger",
        cancelText: "Não",
        onOk: () => {
          // Executar operação de exclusão de forma assíncrona
          const executarExclusao = async () => {
            try {
              setCentralizedLoading(true);
              setLoadingMessage("Removendo cultura...");

              await axiosInstance.delete(`${API_URL.culturas}/${id}`);
              showNotification(
                "success",
                "Sucesso",
                "Cultura excluída com sucesso!"
              );

              setLoadingMessage("Atualizando lista de culturas...");
              await buscarCulturas();
            } catch (error) {
              console.error("Erro ao excluir cultura:", error);

              const errorMessage =
                error.response?.data?.error ||
                "Ocorreu um erro ao excluir a cultura.";
              const errorDetails = error.response?.data?.detalhes || "";

              Modal.error({
                title: "Não é possível excluir a cultura",
                content: (
                  <>
                    <p>{errorMessage}</p>
                    {errorDetails && <p>{errorDetails}</p>}
                  </>
                ),
              });
            } finally {
              setCentralizedLoading(false);
            }
          };

          // Executar operação
          executarExclusao();

          // Retornar true para fechar o modal imediatamente
          return true;
        },
      });
    },
    [API_URL.culturas, buscarCulturas]
  );

  const handleChange = useCallback((fieldName, value) => {
    console.log(`Mudança no campo ${fieldName}:`, value);
    setCulturaAtual((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setCulturasFiltradas(culturas);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtrados = culturas.filter((cultura) => {
        return cultura.descricao.toLowerCase().includes(query) ||
               (cultura.periodicidade && cultura.periodicidade.toLowerCase().includes(query));
      });
      setCulturasFiltradas(filtrados);
      setCurrentPage(1); // Reset para primeira página quando busca
    }
  }, [culturas, searchQuery]);

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
            icon="mdi:seedling" 
            style={{ 
              marginRight: 12, 
              fontSize: isMobile ? '31px' : '31px',
              color: "#059669"
            }} 
          />
          {/* Fallback para o ícone antigo caso o Iconify falhe */}
          <PartitionOutlined style={{ marginRight: 8, display: 'none' }} />
          Cadastro de Culturas
        </Title>
      </Box>

      {/* Botão Adicionar Cultura */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <PrimaryButton
          onClick={handleOpenDialog}
          icon={<PlusCircleOutlined />}
        >
          Adicionar Cultura
        </PrimaryButton>
      </Box>

      {/* Busca */}
      <Box sx={{ mb: 2 }}>
        <SearchInput
          placeholder={isMobile ? "Buscar..." : "Buscar culturas por descrição ou periodicidade..."}
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          size={isMobile ? "small" : "middle"}
          style={{
            width: "100%",
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        />
      </Box>

      {/* Tabela de Culturas */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Suspense fallback={<LoadingFallback />}>
          <CulturasTable
            culturas={culturasFiltradas}
            loading={false}
            onEdit={handleEditarCultura}
            onDelete={handleExcluirCultura}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onShowSizeChange={handleShowSizeChange}
          />
        </Suspense>

        {/* Paginação */}
        {culturasFiltradas.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={culturasFiltradas.length}
              onChange={handlePageChange}
              onShowSizeChange={handleShowSizeChange}
              showSizeChanger={!isMobile}
              showQuickJumper={!isMobile}
              showTotal={(total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]}/${total}`
                  : `${range[0]}-${range[1]} de ${total} culturas`
              }
              pageSizeOptions={['10', '20', '50', '100']}
              size={isMobile ? "small" : "default"}
            />
          </Box>
        )}
      </Box>

      {/* Modais */}
      <Suspense fallback={<Spin size="large" />}>
        <AddEditCulturaDialog
          open={openDialog}
          onClose={handleCloseDialog}
          culturaAtual={culturaAtual}
          setCulturaAtual={setCulturaAtual}
          editando={editando}
          erros={erros}
          setErros={setErros}
          isSaving={isSaving}
          handleSalvarCultura={handleSalvarCultura}
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

export default Culturas;
