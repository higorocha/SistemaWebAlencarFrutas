// src/pages/Frutas.js

import React, { useEffect, useState, useCallback, lazy } from "react";
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
import { CentralizedLoader } from "components/common/loaders";
import { PrimaryButton } from "components/common/buttons";
import { SearchInput } from "components/common/search";

const FrutasTable = lazy(() => import("../components/frutas/FrutasTable"));
const AddEditFrutaDialog = lazy(() =>
  import("../components/frutas/AddEditFrutaDialog")
);

const Frutas = () => {
  const [frutas, setFrutas] = useState([]);
  const [frutasFiltradas, setFrutasFiltradas] = useState([]);
  
  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [openDialog, setOpenDialog] = useState(false);
  const [frutaAtual, setFrutaAtual] = useState({
    id: null,
    nome: "",
    codigo: "",
    categoria: "",
    descricao: "",
    status: "ATIVA",
    nomeCientifico: "",
    corPredominante: "",
    epocaColheita: "",
    observacoes: "",
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para CentralizedLoader
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");

  const API_URL = {
    frutas: "/api/frutas",
  };

  useEffect(() => {
    buscarFrutas();
  }, []);

  const buscarFrutas = useCallback(async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando frutas...");
      setIsLoading(true);
      
      const response = await axiosInstance.get(API_URL.frutas);
      console.log("Dados recebidos da API:", response.data);

      setFrutas(response.data.data || response.data);
      setFrutasFiltradas(response.data.data || response.data);
      console.log("Frutas carregadas:", response.data.data || response.data);
    } catch (error) {
      console.error("Erro ao buscar frutas:", error);
      showNotification("error", "Erro", "Erro ao buscar frutas.");
    } finally {
      setIsLoading(false);
      setCentralizedLoading(false);
    }
  }, [API_URL.frutas]);

  const handleOpenDialog = useCallback(() => {
    setFrutaAtual({
      id: null,
      nome: "",
      codigo: "",
      categoria: "",
      descricao: "",
      status: "ATIVA",
      nomeCientifico: "",
      corPredominante: "",
      epocaColheita: "",
      observacoes: "",
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

  const handleSalvarFruta = useCallback(async () => {
    if (isSaving) return;

    const novosErros = {};

    if (!frutaAtual.nome || frutaAtual.nome.trim() === "") {
      novosErros.nome = "Nome da fruta é obrigatório";
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
      setLoadingMessage(editando ? "Atualizando fruta..." : "Criando fruta...");
      setIsSaving(true);
      
      // Garantir que apenas as propriedades necessárias sejam enviadas
      const dadosParaEnvio = {
        nome: frutaAtual.nome,
        codigo: frutaAtual.codigo || null,
        categoria: frutaAtual.categoria || null,
        descricao: frutaAtual.descricao || null,
        status: frutaAtual.status || "ATIVA",
        nomeCientifico: frutaAtual.nomeCientifico || null,
        corPredominante: frutaAtual.corPredominante || null,
        epocaColheita: frutaAtual.epocaColheita || null,
        observacoes: frutaAtual.observacoes || null,
      };
      
      // Remover propriedades undefined/null para evitar problemas de validação
      Object.keys(dadosParaEnvio).forEach(key => {
        if (dadosParaEnvio[key] === undefined || dadosParaEnvio[key] === null) {
          delete dadosParaEnvio[key];
        }
      });
      
      console.log("DEBUG_SAVE: Dados enviados para o backend:", dadosParaEnvio);
      
      if (editando) {
        // Para edição, remover o id do payload se existir
        const { id, ...dadosParaUpdate } = dadosParaEnvio;
        await axiosInstance.patch(`${API_URL.frutas}/${frutaAtual.id}`, dadosParaUpdate);
        showNotification("success", "Sucesso", "Fruta atualizada com sucesso!");
      } else {
        await axiosInstance.post(API_URL.frutas, dadosParaEnvio);
        showNotification("success", "Sucesso", "Fruta cadastrada com sucesso!");
      }
      
      setLoadingMessage("Atualizando lista de frutas...");
      await buscarFrutas();
    } catch (error) {
      console.error("Erro ao salvar fruta:", error.response?.data || error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erro desconhecido ao salvar.";
      showNotification("error", "Erro", errorMessage);
      
      // REABRIR MODAL EM CASO DE ERRO
      setFrutaAtual(editando ? frutaAtual : {
        id: null,
        nome: "",
        codigo: "",
        categoria: "",
        descricao: "",
        status: "ATIVA",
        nomeCientifico: "",
        corPredominante: "",
        epocaColheita: "",
        observacoes: "",
      });
      setEditando(editando);
      setOpenDialog(true);
    } finally {
      setIsSaving(false);
      setCentralizedLoading(false);
    }
  }, [frutaAtual, editando, isSaving, API_URL.frutas, buscarFrutas, handleCloseDialog]);

  const handleEditarFruta = useCallback(
    (fruta) => {
      console.log("Fruta recebida para edição:", fruta);

      setFrutaAtual({
        id: fruta.id,
        nome: fruta.nome,
        codigo: fruta.codigo || "",
        categoria: fruta.categoria || "",
        descricao: fruta.descricao || "",
        status: fruta.status || "ATIVA",
        nomeCientifico: fruta.nomeCientifico || "",
        corPredominante: fruta.corPredominante || "",
        epocaColheita: fruta.epocaColheita || "",
        observacoes: fruta.observacoes || "",
      });

      setEditando(true);
      setOpenDialog(true);
    },
    []
  );

  const handleExcluirFruta = useCallback(
    async (id) => {
      Modal.confirm({
        title: "Confirmar exclusão",
        content:
          "Tem certeza de que deseja excluir esta fruta? Essa ação não pode ser desfeita.",
        okText: "Sim",
        okType: "danger",
        cancelText: "Não",
        onOk: () => {
          // Executar operação de exclusão de forma assíncrona
          const executarExclusao = async () => {
            try {
            setCentralizedLoading(true);
            setLoadingMessage("Removendo fruta...");
            
            await axiosInstance.delete(`${API_URL.frutas}/${id}`);
              showNotification(
                "success",
                "Sucesso",
                "Fruta excluída com sucesso!"
              );
              
              setLoadingMessage("Atualizando lista de frutas...");
              await buscarFrutas();
            } catch (error) {
              console.error("Erro ao excluir fruta:", error);

              const errorMessage =
                error.response?.data?.error ||
                "Ocorreu um erro ao excluir a fruta.";
              const errorDetails = error.response?.data?.detalhes || "";

              Modal.error({
                title: "Não é possível excluir a fruta",
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
    [API_URL.frutas, buscarFrutas]
  );

  const handleChange = useCallback((fieldName, value) => {
    console.log(`Mudança no campo ${fieldName}:`, value);
    setFrutaAtual((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFrutasFiltradas(frutas);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtrados = frutas.filter((fruta) => {
        return fruta.nome.toLowerCase().includes(query) ||
               (fruta.codigo && fruta.codigo.toLowerCase().includes(query)) ||
               (fruta.categoria && fruta.categoria.toLowerCase().includes(query)) ||
               (fruta.descricao && fruta.descricao.toLowerCase().includes(query));
      });
      setFrutasFiltradas(filtrados);
      setCurrentPage(1); // Reset para primeira página quando busca
    }
  }, [frutas, searchQuery]);

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={1} style={{ marginBottom: 16, color: "#059669" }}>
        Frutas
      </Typography.Title>

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <PrimaryButton
          onClick={handleOpenDialog}
          icon={<PlusCircleOutlined />}
        >
          Adicionar Fruta
        </PrimaryButton>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <SearchInput
          placeholder="Buscar frutas por nome, código ou categoria..."
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          style={{ marginTop: "8px" }}
        />
      </div>
      <FrutasTable
        frutas={frutasFiltradas}
        loading={false}
        onEdit={handleEditarFruta}
        onDelete={handleExcluirFruta}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onShowSizeChange={handleShowSizeChange}
      />
      {frutasFiltradas.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={frutasFiltradas.length}
            onChange={handlePageChange}
            onShowSizeChange={handleShowSizeChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `${range[0]}-${range[1]} de ${total} frutas`}
            pageSizeOptions={["10", "20", "50", "100"]}
          />
        </div>
      )}
      <AddEditFrutaDialog
        open={openDialog}
        onClose={handleCloseDialog}
        frutaAtual={frutaAtual}
        setFrutaAtual={setFrutaAtual}
        editando={editando}
        erros={erros}
        setErros={setErros}
        isSaving={isSaving}
        handleSalvarFruta={handleSalvarFruta}
      />
      
      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />
    </div>
  );
};

export default Frutas; 