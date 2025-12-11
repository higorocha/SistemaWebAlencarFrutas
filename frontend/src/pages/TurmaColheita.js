// src/pages/TurmaColheita.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin, Select, DatePicker, Divider } from "antd";
import {
  OrderedListOutlined,
  PartitionOutlined,
  PlusCircleOutlined,
  UserOutlined,
  BarChartOutlined,
  FilterOutlined,
} from "@ant-design/icons";
// Importar ícones do Iconify para agricultura
import { Icon } from "@iconify/react";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { CentralizedLoader } from "components/common/loaders";
import { PrimaryButton, SecondaryButton } from "components/common/buttons";
import BackButton from "components/common/buttons/BackButton";
import { SearchInput } from "components/common/search";
import axiosInstance from "../api/axiosConfig";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import useResponsive from "../hooks/useResponsive";
import moment from "moment";
import { capitalizeName } from "../utils/formatters";

const { RangePicker } = DatePicker;
const { Option } = Select;

const TurmaColheitaTable = lazy(() => import("../components/turma-colheita/TurmaColheitaTable"));
const AddEditTurmaColheitaDialog = lazy(() =>
  import("../components/turma-colheita/AddEditTurmaColheitaDialog")
);
const ColheitasConsolidadasTable = lazy(() => 
  import("../components/turma-colheita/ColheitasConsolidadasTable")
);
const EstatisticasGeraisColheitas = lazy(() => 
  import("../components/turma-colheita/EstatisticasGeraisColheitas")
);

const TurmaColheita = () => {
  const { isMobile } = useResponsive();
  const [turmasColheita, setTurmasColheita] = useState([]);
  const [turmasColheitaFiltradas, setTurmasColheitaFiltradas] = useState([]);

  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados da aplicação
  const [loading, setLoading] = useState(false);
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");

  // Estados para busca
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState(null);

  // Estados para seção de dados consolidados
  const [colheitasConsolidadas, setColheitasConsolidadas] = useState([]);
  const [loadingConsolidadas, setLoadingConsolidadas] = useState(false);
  const [estatisticasGerais, setEstatisticasGerais] = useState(null);
  const [loadingEstatisticas, setLoadingEstatisticas] = useState(false);
  const [culturas, setCulturas] = useState([]);
  const [culturaFiltro, setCulturaFiltro] = useState(null);
  const [dateRangeConsolidadas, setDateRangeConsolidadas] = useState([]);
  const [searchTermConsolidadas, setSearchTermConsolidadas] = useState("");
  const [currentPageConsolidadas, setCurrentPageConsolidadas] = useState(1);
  const [pageSizeConsolidadas, setPageSizeConsolidadas] = useState(20);
  const [totalConsolidadas, setTotalConsolidadas] = useState(0);
  const [totalGeralQuantidade, setTotalGeralQuantidade] = useState(0);
  const [totalGeralValor, setTotalGeralValor] = useState(0);
  const [totalGeralUnidadeMedida, setTotalGeralUnidadeMedida] = useState(null);
  
  // Estado para turma selecionada
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [estatisticasTurmaSelecionada, setEstatisticasTurmaSelecionada] = useState(null);
  const [loadingEstatisticasTurma, setLoadingEstatisticasTurma] = useState(false);

  // Verificar se há filtros aplicados (usando useMemo para evitar recálculos)
  // Nota: turmaSelecionada não é considerado filtro, apenas os filtros adicionais (cultura, data, busca)
  const temFiltrosAplicados = React.useMemo(() => {
    return !!(
      culturaFiltro || 
      (dateRangeConsolidadas && dateRangeConsolidadas.length === 2) || 
      (searchTermConsolidadas && searchTermConsolidadas.trim())
    );
  }, [culturaFiltro, dateRangeConsolidadas, searchTermConsolidadas]);

  const { Title, Text } = Typography;

  // Função para buscar TODAS as turmas de colheita (sem paginação no backend)
  const fetchTurmasColheita = useCallback(async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando turmas de colheita...");
      setLoading(true);
      
      const response = await axiosInstance.get(`/api/turma-colheita`);
      const lista = response.data || [];
      setTurmasColheita(lista);
      setTurmasColheitaFiltradas(lista);
      setTotalTurmas(lista.length || 0);
      setCurrentPage(1);

    } catch (error) {
      console.error("Erro ao buscar turmas de colheita:", error);
      showNotification("error", "Erro", "Erro ao carregar turmas de colheita");
      setTurmasColheita([]);
      setTurmasColheitaFiltradas([]);
      setTotalTurmas(0);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, []);

  // Função para buscar culturas
  const fetchCulturas = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/culturas");
      setCulturas(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar culturas:", error);
    }
  }, []);

  // Função para buscar estatísticas gerais
  const fetchEstatisticasGerais = useCallback(async () => {
    try {
      setLoadingEstatisticas(true);
      const response = await axiosInstance.get('/api/turma-colheita/estatisticas-gerais');
      setEstatisticasGerais(response.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas gerais:", error);
      showNotification("error", "Erro", "Erro ao carregar estatísticas gerais");
      setEstatisticasGerais(null);
    } finally {
      setLoadingEstatisticas(false);
    }
  }, []);

  // Função para buscar estatísticas de uma turma específica
  const fetchEstatisticasTurma = useCallback(async (turmaId) => {
    try {
      setLoadingEstatisticasTurma(true);
      
      // Buscar estatísticas da turma
      const responseEstatisticas = await axiosInstance.get(`/api/turma-colheita/${turmaId}/estatisticas`);
      const dadosEstatisticas = responseEstatisticas.data;
      
      // Buscar todas as colheitas da turma para agrupar por cultura
      const responseColheitas = await axiosInstance.get(`/api/turma-colheita/colheita-pedido/turma/${turmaId}`);
      const colheitas = responseColheitas.data || [];
      
      // Agrupar por cultura
      const culturaMap = new Map();
      colheitas.forEach((colheita) => {
        const culturaId = colheita.fruta?.cultura?.id;
        const culturaDescricao = colheita.fruta?.cultura?.descricao || 'Desconhecida';
        
        if (!culturaMap.has(culturaId)) {
          culturaMap.set(culturaId, {
            culturaId,
            culturaDescricao,
            totalQuantidade: 0,
            totalValor: 0,
            totalColheitas: 0,
            unidadeMedida: colheita.unidadeMedida || 'UND', // Usar a primeira unidade encontrada
            unidadesMedida: {}, // Objeto para contar frequência de unidades
          });
        }
        
        const cultura = culturaMap.get(culturaId);
        cultura.totalQuantidade += colheita.quantidadeColhida || 0;
        cultura.totalValor += colheita.valorColheita || 0;
        cultura.totalColheitas += 1;
        
        // Contar frequência de unidades
        const unidade = colheita.unidadeMedida || 'UND';
        cultura.unidadesMedida[unidade] = (cultura.unidadesMedida[unidade] || 0) + 1;
      });
      
      // Determinar a unidade mais frequente para cada cultura
      culturaMap.forEach((cultura) => {
        let maxCount = 0;
        let unidadeMaisFrequente = cultura.unidadeMedida;
        Object.entries(cultura.unidadesMedida).forEach(([unidade, count]) => {
          if (count > maxCount) {
            maxCount = count;
            unidadeMaisFrequente = unidade;
          }
        });
        cultura.unidadeMedida = unidadeMaisFrequente;
        // Remover o objeto de unidades (não precisa manter)
        delete cultura.unidadesMedida;
      });
      
      const colheitasPorCultura = Array.from(culturaMap.values());
      
      // Calcular pagamentos dos detalhes
      const detalhes = dadosEstatisticas.detalhes || [];
      const pagamentosEfetuados = detalhes.filter(d => d.pagamentoEfetuado).length;
      const pagamentosPendentes = detalhes.filter(d => !d.pagamentoEfetuado).length;
      const valorPago = detalhes
        .filter(d => d.pagamentoEfetuado)
        .reduce((sum, d) => sum + (d.valorPago || 0), 0);
      const valorPendente = detalhes
        .filter(d => !d.pagamentoEfetuado)
        .reduce((sum, d) => sum + (d.valor || 0), 0);
      
      // Formatar dados no formato esperado
      const estatisticasFormatadas = {
        totalTurmas: 1, // Apenas a turma selecionada
        totalColheitas: detalhes.length,
        totalQuantidade: dadosEstatisticas.totalGeral?.quantidade || 0,
        totalValor: dadosEstatisticas.totalGeral?.valor || 0,
        colheitasPorCultura,
        pagamentos: {
          efetuados: pagamentosEfetuados,
          pendentes: pagamentosPendentes,
          valorPago,
          valorPendente,
        },
        detalhes, // Manter detalhes para quando clicar em cultura
        colheitas, // Manter colheitas completas para filtrar por cultura
      };
      
      setEstatisticasTurmaSelecionada(estatisticasFormatadas);
    } catch (error) {
      console.error("Erro ao buscar estatísticas da turma:", error);
      showNotification("error", "Erro", "Erro ao carregar estatísticas da turma");
      setEstatisticasTurmaSelecionada(null);
    } finally {
      setLoadingEstatisticasTurma(false);
    }
  }, []);

  // Função para buscar dados consolidados (só é chamada quando há filtros aplicados)
  const fetchColheitasConsolidadas = useCallback(async () => {
    try {
      setLoadingConsolidadas(true);
      
      // Se uma turma está selecionada E há filtros, filtrar suas colheitas
      if (turmaSelecionada && estatisticasTurmaSelecionada) {
        let colheitasFiltradas = estatisticasTurmaSelecionada.colheitas || [];
        
        // Filtrar por cultura se selecionada
        if (culturaFiltro) {
          colheitasFiltradas = colheitasFiltradas.filter(
            (c) => c.fruta?.cultura?.id === culturaFiltro
          );
        }
        
        // Filtrar por data se selecionada
        if (dateRangeConsolidadas && dateRangeConsolidadas.length === 2) {
          const dataInicio = moment(dateRangeConsolidadas[0]).startOf('day');
          const dataFim = moment(dateRangeConsolidadas[1]).endOf('day');
          colheitasFiltradas = colheitasFiltradas.filter((c) => {
            const dataColheita = moment(c.dataColheita);
            return dataColheita.isBetween(dataInicio, dataFim, null, '[]');
          });
        }
        
        // Formatar para o formato da tabela
        const dadosFormatados = colheitasFiltradas.map((colheita) => ({
          turmaId: turmaSelecionada.id,
          turmaNome: turmaSelecionada.nomeColhedor || 'Sem nome',
          dataColheita: colheita.dataColheita,
          totalQuantidade: colheita.quantidadeColhida || 0,
          totalValor: colheita.valorColheita || 0,
          unidadeMedida: colheita.unidadeMedida || 'UND',
        }));
        
        const totalGeralQuantidadeCalc = dadosFormatados.reduce((sum, d) => sum + d.totalQuantidade, 0);
        const totalGeralValorCalc = dadosFormatados.reduce((sum, d) => sum + d.totalValor, 0);
        
        // Calcular unidade mais frequente para o totalizador
        const unidadesFreq = {};
        dadosFormatados.forEach((d) => {
          const unidade = d.unidadeMedida || 'UND';
          unidadesFreq[unidade] = (unidadesFreq[unidade] || 0) + 1;
        });
        let maxCount = 0;
        let unidadeMaisFrequente = null;
        Object.entries(unidadesFreq).forEach(([unidade, count]) => {
          if (count > maxCount) {
            maxCount = count;
            unidadeMaisFrequente = unidade;
          }
        });
        
        // Paginação
        const total = dadosFormatados.length;
        const startIndex = (currentPageConsolidadas - 1) * pageSizeConsolidadas;
        const endIndex = startIndex + pageSizeConsolidadas;
        const dadosPaginados = dadosFormatados.slice(startIndex, endIndex);
        
        setColheitasConsolidadas(dadosPaginados);
        setTotalConsolidadas(total);
        setTotalGeralQuantidade(totalGeralQuantidadeCalc);
        setTotalGeralValor(totalGeralValorCalc);
        setTotalGeralUnidadeMedida(unidadeMaisFrequente);
      } else {
        // Comportamento normal (sem turma selecionada, com filtros gerais)
        const params = new URLSearchParams();
        
        if (culturaFiltro) {
          params.append('culturaId', culturaFiltro.toString());
        }
        
        if (dateRangeConsolidadas && dateRangeConsolidadas.length === 2) {
          params.append('dataInicio', dateRangeConsolidadas[0].toISOString());
          params.append('dataFim', dateRangeConsolidadas[1].toISOString());
        }
        
        if (searchTermConsolidadas && searchTermConsolidadas.trim()) {
          params.append('searchTerm', searchTermConsolidadas.trim());
        }
        
        params.append('page', currentPageConsolidadas.toString());
        params.append('limit', pageSizeConsolidadas.toString());

        const response = await axiosInstance.get(`/api/turma-colheita/colheitas-consolidadas?${params.toString()}`);
        
        const dados = response.data.data || [];
        setColheitasConsolidadas(dados);
        setTotalConsolidadas(response.data.total || 0);
        setTotalGeralQuantidade(response.data.totalGeralQuantidade || 0);
        setTotalGeralValor(response.data.totalGeralValor || 0);
        
        // Calcular unidade mais frequente para o totalizador
        const unidadesFreq = {};
        dados.forEach((d) => {
          const unidade = d.unidadeMedida || 'UND';
          unidadesFreq[unidade] = (unidadesFreq[unidade] || 0) + 1;
        });
        let maxCount = 0;
        let unidadeMaisFrequente = null;
        Object.entries(unidadesFreq).forEach(([unidade, count]) => {
          if (count > maxCount) {
            maxCount = count;
            unidadeMaisFrequente = unidade;
          }
        });
        setTotalGeralUnidadeMedida(unidadeMaisFrequente);
      }
    } catch (error) {
      console.error("Erro ao buscar colheitas consolidadas:", error);
      showNotification("error", "Erro", "Erro ao carregar dados consolidados");
      setColheitasConsolidadas([]);
      setTotalConsolidadas(0);
      setTotalGeralQuantidade(0);
      setTotalGeralValor(0);
      setTotalGeralUnidadeMedida(null);
    } finally {
      setLoadingConsolidadas(false);
    }
  }, [turmaSelecionada, estatisticasTurmaSelecionada, culturaFiltro, dateRangeConsolidadas, searchTermConsolidadas, currentPageConsolidadas, pageSizeConsolidadas]);

  // useEffect para carregar turmas na inicialização
  useEffect(() => {
    fetchTurmasColheita();
    fetchCulturas();
  }, [fetchTurmasColheita, fetchCulturas]);
  
  // useEffect para buscar estatísticas quando turma é selecionada ou removida
  useEffect(() => {
    if (turmaSelecionada) {
      fetchEstatisticasTurma(turmaSelecionada.id);
    } else {
      fetchEstatisticasGerais();
    }
  }, [turmaSelecionada, fetchEstatisticasTurma, fetchEstatisticasGerais]);

  // useEffect para buscar dados consolidados quando há filtros
  useEffect(() => {
    if (temFiltrosAplicados) {
      fetchColheitasConsolidadas();
    }
  }, [temFiltrosAplicados, fetchColheitasConsolidadas]);

  // Função para lidar com clique na turma
  const handleTurmaClick = useCallback((turma) => {
    setTurmaSelecionada(turma);
    setCulturaFiltro(null);
    setDateRangeConsolidadas([]);
    setSearchTermConsolidadas("");
    setCurrentPageConsolidadas(1);
  }, []);

  // Função para limpar seleção da turma
  const handleLimparSelecaoTurma = useCallback(() => {
    setTurmaSelecionada(null);
    setEstatisticasTurmaSelecionada(null);
    setCulturaFiltro(null);
    setDateRangeConsolidadas([]);
    setSearchTermConsolidadas("");
    setCurrentPageConsolidadas(1);
  }, []);

  // Função para lidar com clique no card de cultura
  const handleCulturaCardClick = useCallback((culturaId) => {
    setCulturaFiltro(culturaId);
    setCurrentPageConsolidadas(1);
    // Se uma turma está selecionada, já temos os dados, só aplicar o filtro
    // Se não, o useEffect vai buscar os dados consolidados
  }, []);

  // Função para limpar filtros (sem limpar seleção de turma)
  const handleClearConsolidatedFilters = useCallback(() => {
    setCulturaFiltro(null);
    setDateRangeConsolidadas([]);
    setSearchTermConsolidadas("");
    setCurrentPageConsolidadas(1);
  }, []);

  // Função para voltar às estatísticas da turma (remove filtros mas mantém turma selecionada)
  const handleVoltarEstatisticasTurma = useCallback(() => {
    setCulturaFiltro(null);
    setDateRangeConsolidadas([]);
    setSearchTermConsolidadas("");
    setCurrentPageConsolidadas(1);
  }, []);

  const handleVoltarEstatisticasGerais = useCallback(() => {
    setCulturaFiltro(null);
    setDateRangeConsolidadas([]);
    setSearchTermConsolidadas("");
    setCurrentPageConsolidadas(1);
  }, []);

  // Função para lidar com busca
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página ao buscar
  }, []);

  // Filtrar localmente por termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setTurmasColheitaFiltradas(turmasColheita);
      setTotalTurmas(turmasColheita.length || 0);
    } else {
      const termo = searchTerm.toLowerCase().trim();
      const filtrados = turmasColheita.filter((turma) => {
        return (
          (turma.nomeColhedor && turma.nomeColhedor.toLowerCase().includes(termo)) ||
          (turma.chavePix && turma.chavePix.toLowerCase().includes(termo)) ||
          (turma.responsavelChavePix && turma.responsavelChavePix.toLowerCase().includes(termo)) ||
          (turma.observacoes && turma.observacoes.toLowerCase().includes(termo))
        );
      });
      setTurmasColheitaFiltradas(filtrados);
      setTotalTurmas(filtrados.length || 0);
    }
    setCurrentPage(1); // Reset para primeira página quando busca
  }, [turmasColheita, searchTerm]);

  // Calcular dados paginados para exibição na tabela
  const dadosPaginados = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return turmasColheitaFiltradas.slice(startIndex, endIndex);
  }, [turmasColheitaFiltradas, currentPage, pageSize]);

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
    // FECHAR MODAL IMEDIATAMENTE ao clicar em salvar
    handleCloseModal();
    
    try {
      setCentralizedLoading(true);
      setLoadingMessage(turmaEditando ? "Atualizando turma..." : "Criando turma...");
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

      setLoadingMessage("Atualizando lista de turmas...");
      await fetchTurmasColheita();

    } catch (error) {
      console.error("Erro ao salvar turma de colheita:", error);
      const message = error.response?.data?.message || "Erro ao salvar turma de colheita";
      showNotification("error", "Erro", message);
      // REABRIR MODAL EM CASO DE ERRO
      setTurmaEditando(turmaEditando);
      setModalOpen(true);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
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
      okButtonProps: {
        loading: false, // Desabilitar loading interno do modal
      },
      onOk: () => {
        // Executar operação de exclusão de forma assíncrona
        const executarExclusao = async () => {
          try {
            setCentralizedLoading(true);
            setLoadingMessage("Removendo turma de colheita...");
            
            await axiosInstance.delete(`/api/turma-colheita/${turmaId}`);
            showNotification("success", "Sucesso", "Turma de colheita removida com sucesso!");

            setLoadingMessage("Atualizando lista de turmas...");
            await fetchTurmasColheita();

          } catch (error) {
            console.error("Erro ao deletar turma de colheita:", error);
            const message = error.response?.data?.message || "Erro ao remover turma de colheita";
            showNotification("error", "Erro", message);
          } finally {
            setCentralizedLoading(false);
          }
        };
        
        executarExclusao();
        return true; // Fecha modal imediatamente
      }
    });
  }, [fetchTurmasColheita, currentPage, pageSize, searchTerm]);

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
            icon="game-icons:farmer" 
            style={{ 
              marginRight: 12, 
              fontSize: isMobile ? '31px' : '31px',
              color: "#059669"
            }} 
          />
          {/* Fallback para o ícone antigo caso o Iconify falhe */}
          <UserOutlined style={{ marginRight: 8, display: 'none' }} />
          {isMobile ? "Turma de Colheita" : "Gestão de Turma de Colheita"}
        </Typography.Title>
      </Box>


      {/* Grid com duas colunas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Coluna 1: Listagem de Turmas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Botão Nova Turma de Colheita */}
          <Box sx={{ height: "40px", display: "flex", alignItems: "center", mb: 0 }}>
            <PrimaryButton
              onClick={handleOpenCreateModal}
              icon={<PlusCircleOutlined />}
            >
              Nova Turma de Colheita
            </PrimaryButton>
          </Box>
          {/* Card com busca e tabela */}
          <Box
            sx={{
              background: "#fff",
              borderRadius: 2,
              padding: 2,
              boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
              minHeight: "750px",
              display: "flex",
              flexDirection: "column",
              mt: 0,
            }}
          >
            <Typography.Title
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
              <Icon icon="game-icons:farmer" style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }} />
              Listagem de Turmas
            </Typography.Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

            {/* Busca */}
            <Box sx={{ mb: 2 }}>
              <SearchInput
                placeholder={isMobile ? "Buscar..." : "Buscar por nome do colhedor, PIX, responsável..."}
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                size={isMobile ? "small" : "middle"}
                style={{
                  width: "100%",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              />
            </Box>

            {/* Tabela */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <Suspense fallback={<LoadingFallback />}>
                <TurmaColheitaTable
                  turmasColheita={dadosPaginados}
                  loading={false}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTurma}
                  onRowClick={handleTurmaClick}
                />
              </Suspense>

              {/* Paginação */}
              {totalTurmas > 0 && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalTurmas}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger={!isMobile}
                    showTotal={(total, range) =>
                      isMobile
                        ? `${range[0]}-${range[1]}/${total}`
                        : `${range[0]}-${range[1]} de ${total} turmas`
                    }
                    pageSizeOptions={['10', '20', '50', '100']}
                    size={isMobile ? "small" : "default"}
                  />
                </Box>
              )}
            </Box>

            {/* Info de totais */}
            <Box sx={{ mt: 1, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Total: {totalTurmas} {totalTurmas === 1 ? "turma" : "turmas"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Coluna 2: Dados Consolidados / Estatísticas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Espaço vazio para alinhar com o botão da primeira coluna */}
          <Box sx={{ height: "40px", display: "flex", alignItems: "center", mb: 0 }} />

          {/* Card com filtros e conteúdo */}
          <Box
            sx={{
              background: "#fff",
              borderRadius: 2,
              padding: 2,
              boxShadow: "0 3px 12px rgba(15,118,110,0.08)",
              minHeight: "750px",
              display: "flex",
              flexDirection: "column",
              mt: 0,
            }}
          >
            <Typography.Title
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
              <BarChartOutlined style={{ marginRight: 8, color: "#059669", fontSize: 24, verticalAlign: "middle" }} />
              {turmaSelecionada 
                ? `Dados Consolidados - ${turmaSelecionada.nomeColhedor || 'Turma Selecionada'}`
                : 'Dados Consolidados'
              }
            </Typography.Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

            {/* Filtros */}
            <Box sx={{ 
              mb: 2, 
              display: "flex", 
              flexDirection: isMobile ? "column" : "row",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "flex-start",
              width: "100%"
            }}>
              <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 180px" }, minWidth: 0 }}>
                <Text style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                  fontSize: isMobile ? '0.8125rem' : '0.875rem'
                }}>
                  Cultura:
                </Text>
                <Select
                  placeholder="Selecione"
                  value={culturaFiltro}
                  onChange={(value) => {
                    setCulturaFiltro(value);
                    setCurrentPageConsolidadas(1);
                  }}
                  allowClear
                  showSearch
                  filterOption={(input, option) => {
                    const cultura = culturas.find(c => c.id === option.value);
                    const descricao = cultura?.descricao || '';
                    return descricao.toLowerCase().includes(input.toLowerCase());
                  }}
                  style={{ width: "100%" }}
                  size={isMobile ? "small" : "middle"}
                >
                  {culturas.map((cultura) => (
                    <Option key={cultura.id} value={cultura.id}>
                      {capitalizeName(cultura.descricao || '')}
                    </Option>
                  ))}
                </Select>
              </Box>

              <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 240px" }, minWidth: 0 }}>
                <Text style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                  fontSize: isMobile ? '0.8125rem' : '0.875rem'
                }}>
                  Período:
                </Text>
                <RangePicker
                  value={dateRangeConsolidadas}
                  onChange={(dates) => {
                    setDateRangeConsolidadas(dates || []);
                    setCurrentPageConsolidadas(1);
                  }}
                  placeholder={["Início", "Fim"]}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size={isMobile ? "small" : "middle"}
                />
              </Box>

              <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" }, minWidth: 0 }}>
                <Text style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                  fontSize: isMobile ? '0.8125rem' : '0.875rem'
                }}>
                  Buscar:
                </Text>
                <SearchInput
                  placeholder={isMobile ? "Buscar..." : "Buscar turma..."}
                  value={searchTermConsolidadas}
                  onChange={(value) => {
                    setSearchTermConsolidadas(value);
                    setCurrentPageConsolidadas(1);
                  }}
                  size={isMobile ? "small" : "middle"}
                  style={{
                    width: "100%",
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                />
              </Box>

              <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" }, minWidth: 0 }}>
                <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>
                <SecondaryButton
                  icon={<FilterOutlined />}
                  onClick={() => {
                    if (turmaSelecionada) {
                      handleLimparSelecaoTurma();
                    } else {
                      handleClearConsolidatedFilters();
                    }
                  }}
                  size={isMobile ? "small" : "middle"}
                  style={{
                    height: isMobile ? "32px" : "40px",
                    padding: isMobile ? '0 12px' : '0 16px',
                    fontSize: isMobile ? '0.75rem' : undefined
                  }}
                >
                  {turmaSelecionada ? "Limpar Seleção" : "Limpar"}
                </SecondaryButton>
              </Box>
            </Box>

            {/* Conteúdo: Estatísticas ou Listagem */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
              {temFiltrosAplicados ? (
                // Mostrar listagem quando há filtros
                <>
                  {/* Botão Voltar - aparece acima da tabela quando há filtros aplicados */}
                  <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-start" }}>
                    <BackButton
                      onClick={turmaSelecionada ? handleVoltarEstatisticasTurma : handleVoltarEstatisticasGerais}
                      title={turmaSelecionada ? "Voltar para estatísticas da turma" : "Voltar para estatísticas gerais"}
                    />
                  </Box>
                  <Suspense fallback={<LoadingFallback />}>
                    <ColheitasConsolidadasTable
                      dados={colheitasConsolidadas}
                      loading={loadingConsolidadas}
                      totalGeralQuantidade={totalGeralQuantidade}
                      totalGeralValor={totalGeralValor}
                      totalGeralUnidadeMedida={totalGeralUnidadeMedida}
                    />
                  </Suspense>

                  {/* Paginação */}
                  {totalConsolidadas > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                      <Pagination
                        current={currentPageConsolidadas}
                        pageSize={pageSizeConsolidadas}
                        total={totalConsolidadas}
                        onChange={(page, size) => {
                          setCurrentPageConsolidadas(page);
                          setPageSizeConsolidadas(size);
                        }}
                        onShowSizeChange={(current, size) => {
                          setCurrentPageConsolidadas(1);
                          setPageSizeConsolidadas(size);
                        }}
                        showSizeChanger={!isMobile}
                        showTotal={(total, range) =>
                          isMobile
                            ? `${range[0]}-${range[1]}/${total}`
                            : `${range[0]}-${range[1]} de ${total} turmas`
                        }
                        pageSizeOptions={['10', '20', '50', '100']}
                        size={isMobile ? "small" : "default"}
                      />
                    </Box>
                  )}
                </>
              ) : (
                // Mostrar estatísticas quando não há filtros
                <Suspense fallback={<LoadingFallback />}>
                  <EstatisticasGeraisColheitas
                    dados={turmaSelecionada ? estatisticasTurmaSelecionada : estatisticasGerais}
                    loading={turmaSelecionada ? loadingEstatisticasTurma : loadingEstatisticas}
                    onCulturaClick={handleCulturaCardClick}
                    turmaSelecionada={!!turmaSelecionada}
                  />
                </Suspense>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

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

      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />
    </Box>
  );
};

export default TurmaColheita;