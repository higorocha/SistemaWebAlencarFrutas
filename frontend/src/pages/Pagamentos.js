// src/pages/Pagamentos.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Tag, Space, Typography, Tooltip, Select, DatePicker, Button, Modal, Popconfirm, Dropdown, Divider, Segmented } from "antd";
import { DollarOutlined, BankOutlined, ClockCircleOutlined, CheckCircleOutlined, FilterOutlined, CloseCircleOutlined, UnlockOutlined, StopOutlined, EyeOutlined, MoreOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { SecondaryButton } from "components/common/buttons";
import axiosInstance from "../api/axiosConfig";
import ResponsiveTable from "../components/common/ResponsiveTable";
import { showNotification } from "../config/notificationConfig";
import { formatCurrency, formatarCPF, formatarCNPJ, formatarTelefone } from "../utils/formatters";
import { mapearEstadoRequisicao } from "../utils/bbEstadoRequisicao";
import useResponsive from "../hooks/useResponsive";
import moment from "moment";
import { Box } from "@mui/material";
import SearchInputPagamentos from "../components/pagamentos/SearchInputPagamentos";
import LotePagamentosDetalhesModal from "../components/pagamentos/LotePagamentosDetalhesModal";
import ConsultaOnlineModal from "../components/pagamentos/ConsultaOnlineModal";
import ConsultaItemIndividualModal from "../components/pagamentos/ConsultaItemIndividualModal";
import SecaoLotesPagamentos from "../components/pagamentos/SecaoLotesPagamentos";
import { useLocation } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Pagamentos = () => {
  const { isMobile } = useResponsive();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [loadingFolha, setLoadingFolha] = useState(false);
  const [lotesTurmaColheita, setLotesTurmaColheita] = useState([]);
  const [lotesFolhaPagamento, setLotesFolhaPagamento] = useState([]);
  const [paginacaoTurmaColheita, setPaginacaoTurmaColheita] = useState({ page: 1, limit: 10, total: 0 });
  const [paginacaoFolhaPagamento, setPaginacaoFolhaPagamento] = useState({ page: 1, limit: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState([]); // Filtros aplicados via sugestão
  const [searchTermAplicado, setSearchTermAplicado] = useState(""); // Termo de busca aplicado (após Enter ou seleção)
  const [tipoOrigem, setTipoOrigem] = useState("TODOS");
  const [dateRange, setDateRange] = useState([]);
  const [dateFilterType, setDateFilterType] = useState("criacao"); // 'criacao' ou 'liberacao'
  const [contaCorrenteId, setContaCorrenteId] = useState(null);
  const [liberandoLoteId, setLiberandoLoteId] = useState(null);
  const [cancelandoLoteId, setCancelandoLoteId] = useState(null);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [modalCancelamentoOpen, setModalCancelamentoOpen] = useState(false);
  const [modalConsultaOnlineOpen, setModalConsultaOnlineOpen] = useState(false);
  const [modalConsultaItemIndividualOpen, setModalConsultaItemIndividualOpen] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [activeKeys, setActiveKeys] = useState([]);

  // Guardar, ao carregar a tela via notificação, qual número de requisição devemos abrir automaticamente
  const [numeroRequisicaoParaAbrir, setNumeroRequisicaoParaAbrir] = useState(() => {
    const state = location?.state || {};
    return state.loteNumeroRequisicao || null;
  });

  const fetchLotesTurmaColheita = useCallback(async (dataInicio = null, dataFim = null, page = 1, limit = 10, tipoData = 'criacao', contaId = null) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      if (tipoData) params.append("tipoData", tipoData);
      if (contaId) params.append("contaCorrenteId", contaId.toString());
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const url = `/api/pagamentos/lotes-turma-colheita?${params.toString()}`;

      const response = await axiosInstance.get(url);
      const { data, total, page: currentPage, limit: currentLimit } = response.data || {};
      setLotesTurmaColheita(data || []);
      setPaginacaoTurmaColheita({ page: currentPage || page, limit: currentLimit || limit, total: total || 0 });
    } catch (error) {
      console.error("Erro ao buscar lotes de pagamentos de turma de colheita:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao carregar lotes de pagamentos da turma de colheita";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLotesFolhaPagamento = useCallback(async (dataInicio = null, dataFim = null, page = 1, limit = 10, tipoData = 'criacao', contaId = null) => {
    try {
      setLoadingFolha(true);

      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      if (tipoData) params.append("tipoData", tipoData);
      if (contaId) params.append("contaCorrenteId", contaId.toString());
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const url = `/api/pagamentos/lotes-folha-pagamento?${params.toString()}`;

      const response = await axiosInstance.get(url);
      const { data, total, page: currentPage, limit: currentLimit } = response.data || {};
      setLotesFolhaPagamento(data || []);
      setPaginacaoFolhaPagamento({ page: currentPage || page, limit: currentLimit || limit, total: total || 0 });
    } catch (error) {
      console.error("Erro ao buscar lotes de pagamentos de folha de pagamento:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao carregar lotes de pagamentos de folha de pagamento";
      showNotification("error", "Erro", message);
    } finally {
      setLoadingFolha(false);
    }
  }, []);

  // Extrair contas correntes únicas dos lotes já carregados
  const contasCorrentes = useMemo(() => {
    const contasSet = new Map();
    
    // Adicionar contas de lotes de turma de colheita
    lotesTurmaColheita.forEach(lote => {
      if (lote.contaCorrente && lote.contaCorrente.id) {
        contasSet.set(lote.contaCorrente.id, lote.contaCorrente);
      }
    });
    
    // Adicionar contas de lotes de folha de pagamento
    lotesFolhaPagamento.forEach(lote => {
      if (lote.contaCorrente && lote.contaCorrente.id) {
        contasSet.set(lote.contaCorrente.id, lote.contaCorrente);
      }
    });
    
    // Converter Map para array e ordenar por agência/conta
    return Array.from(contasSet.values()).sort((a, b) => {
      const agenciaA = a.agencia || '';
      const agenciaB = b.agencia || '';
      if (agenciaA !== agenciaB) {
        return agenciaA.localeCompare(agenciaB);
      }
      const contaA = a.contaCorrente || '';
      const contaB = b.contaCorrente || '';
      return contaA.localeCompare(contaB);
    });
  }, [lotesTurmaColheita, lotesFolhaPagamento]);

  // Handler para seleção de sugestão
  const handleSuggestionSelect = useCallback((suggestion) => {
    // Adicionar filtro aplicado
    const novoFiltro = {
      type: suggestion.type,
      value: suggestion.value,
      label: suggestion.label,
      displayValue: suggestion.type === 'funcionario' && suggestion.metadata?.cpf
        ? `${suggestion.metadata.nome} (${formatarCPF(suggestion.metadata.cpf)})`
        : suggestion.value,
      icon: suggestion.icon,
      metadata: suggestion.metadata,
    };
    
    setAppliedFilters(prev => [...prev, novoFiltro]);
    setSearchTerm(""); // Limpar input
    setSearchTermAplicado(""); // Limpar termo aplicado
  }, []);

  useEffect(() => {
    // Se tiver range selecionado, enviar datas normalizadas (início/fim do dia)
    let inicio = null;
    let fim = null;
    
    if (dateRange && dateRange.length === 2) {
      inicio = dateRange[0]
        ? moment(dateRange[0]).startOf("day").toISOString()
        : null;
      fim = dateRange[1]
        ? moment(dateRange[1]).endOf("day").toISOString()
        : null;
    }
    
    fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType, contaCorrenteId);
    fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType, contaCorrenteId);
  }, [fetchLotesTurmaColheita, fetchLotesFolhaPagamento, dateRange, dateFilterType, contaCorrenteId, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit]);

  // Após lotes carregados, se vier um numeroRequisicao da navegação (ex: clique na notificação),
  // localizar o lote correspondente e abrir o modal de detalhes automaticamente.
  useEffect(() => {
    if (!numeroRequisicaoParaAbrir) return;

    // Buscar em ambos os tipos de lotes
    const alvoTurma = lotesTurmaColheita.find(
      (lote) => lote.numeroRequisicao === numeroRequisicaoParaAbrir
    );
    const alvoFolha = lotesFolhaPagamento.find(
      (lote) => lote.numeroRequisicao === numeroRequisicaoParaAbrir
    );

    const alvo = alvoTurma || alvoFolha;

    if (alvo) {
      setLoteSelecionado(alvo);
      setModalDetalhesOpen(true);
      // Usar uma vez apenas
      setNumeroRequisicaoParaAbrir(null);
    }
  }, [numeroRequisicaoParaAbrir, lotesTurmaColheita, lotesFolhaPagamento]);

  // Handlers de paginação
  const handlePageChangeTurmaColheita = useCallback((page, pageSize) => {
    setPaginacaoTurmaColheita(prev => ({ ...prev, page, limit: pageSize }));
  }, []);

  const handlePageChangeFolhaPagamento = useCallback((page, pageSize) => {
    setPaginacaoFolhaPagamento(prev => ({ ...prev, page, limit: pageSize }));
  }, []);

  // Função para liberar pagamento (chamada do modal)
  const handleLiberarPagamento = async (numeroRequisicao, indicadorFloat) => {
    try {
      setLiberandoLoteId(numeroRequisicao);
      await axiosInstance.post("/api/pagamentos/liberar", {
        numeroRequisicao,
        indicadorFloat,
      });
      showNotification("success", "Sucesso", "Pagamento liberado com sucesso!");
      setModalDetalhesOpen(false);
      setLoteSelecionado(null);
      // Recarregar lotes
      let inicio = null;
      let fim = null;
      if (dateRange && dateRange.length === 2) {
        inicio = dateRange[0]
          ? moment(dateRange[0]).startOf("day").toISOString()
          : null;
        fim = dateRange[1]
          ? moment(dateRange[1]).endOf("day").toISOString()
          : null;
      }
      fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType, contaCorrenteId);
      fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType, contaCorrenteId);
    } catch (error) {
      console.error("Erro ao liberar pagamento:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao liberar pagamento. Verifique os logs para mais detalhes.";
      showNotification("error", "Erro", message);
    } finally {
      setLiberandoLoteId(null);
    }
  };

  // Função para cancelar item (lançamento individual)
  const handleCancelarItem = async (itemRecord) => {
    if (!itemRecord || !itemRecord.item) {
      showNotification("error", "Erro", "Item não encontrado.");
      return;
    }
    
    try {
      setCancelandoLoteId(itemRecord.item.id);

      // Buscar conta corrente do lote
      const contaCorrenteId = itemRecord.contaCorrente?.id;
      if (!contaCorrenteId) {
        showNotification(
          "error",
          "Erro",
          "Conta corrente não encontrada para este item."
        );
        return;
      }

      // Extrair código de pagamento do item
      // Para PIX: usar identificadorPagamento
      // Para Boleto: usar codigoIdentificadorPagamento
      // Para Guia: usar codigoPagamento
      const item = itemRecord.item;
      const tipoPagamento = itemRecord.tipoPagamentoApi || itemRecord.tipoPagamento;
      
      let codigoPagamento = null;
      if (tipoPagamento === 'PIX' || tipoPagamento === 'pix') {
        codigoPagamento = item.identificadorPagamento;
      } else if (tipoPagamento === 'BOLETO' || tipoPagamento === 'boleto') {
        codigoPagamento = item.codigoIdentificadorPagamento;
      } else if (tipoPagamento === 'GUIA' || tipoPagamento === 'guia') {
        codigoPagamento = item.codigoPagamento;
      } else {
        // Fallback: tentar todos os campos na ordem correta
        codigoPagamento = item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento;
      }

      if (!codigoPagamento || codigoPagamento.toString().trim() === "") {
        showNotification(
          "warning",
          "Atenção",
          "Este item não possui código de pagamento para cancelamento. O pagamento pode ainda não ter sido processado pelo BB."
        );
        return;
      }

      await axiosInstance.post("/api/pagamentos/cancelar", {
        contaCorrenteId,
        listaCodigosPagamento: [codigoPagamento.toString()],
      });

      showNotification("success", "Sucesso", "Item cancelado com sucesso!");
      setModalCancelamentoOpen(false);
      setLoteSelecionado(null);
      
      // Recarregar lotes
      let inicio = null;
      let fim = null;
      if (dateRange && dateRange.length === 2) {
        inicio = dateRange[0]
          ? moment(dateRange[0]).startOf("day").toISOString()
          : null;
        fim = dateRange[1]
          ? moment(dateRange[1]).endOf("day").toISOString()
          : null;
      }
      fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType, contaCorrenteId);
      fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType, contaCorrenteId);
    } catch (error) {
      console.error("Erro ao cancelar item:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao cancelar item. Verifique os logs para mais detalhes.";
      showNotification("error", "Erro", message);
    } finally {
      setCancelandoLoteId(null);
    }
  };

  // Processar lotes para exibição na tabela (Turma Colheita)
  const lotesFiltradosOrdenadosTurmaColheita = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();

    // Garantir que lotesTurmaColheita é um array
    if (!Array.isArray(lotesTurmaColheita)) {
      return [];
    }

    // Trabalhar diretamente com lotes (não fazer flatMap)
    let lotes = lotesTurmaColheita.map((lote) => ({
      ...lote,
      loteId: lote.id,
    }));

    // Aplicar filtros de busca inteligente (chips)
    if (appliedFilters.length > 0) {
      lotes = lotes.filter((lote) => {
        return appliedFilters.some((filtro) => {
          if (filtro.type === 'colhedor') {
            const nomeColhedor = (lote.origemNome || lote.turmaResumo?.nomeColhedor || "").trim();
            return nomeColhedor.toLowerCase() === filtro.value.toLowerCase();
          }
          // Funcionário não se aplica a lotes de turma de colheita
          return false;
        });
      });
    }

    // Aplicar filtro de busca por texto (fallback)
    if (termo && appliedFilters.length === 0) {
      lotes = lotes.filter((lote) => {
        const numero = (lote.numeroRequisicao || "").toString();
        const origemNome = (lote.origemNome || "").toLowerCase();
        const conta = `${lote.contaCorrente?.agencia || ""} ${lote.contaCorrente?.contaCorrente || ""}`.toLowerCase();

        return (
          numero.includes(termo) ||
          origemNome.includes(termo) ||
          conta.includes(termo)
        );
      });
    }

    if (tipoOrigem !== "TODOS") {
      lotes = lotes.filter(
        (lote) => (lote.origemTipo || "").toUpperCase() === tipoOrigem,
      );
    }

    // Ordenar por tipo de origem e depois por dataCriacao (mais recente primeiro)
    const tipoPrioridade = {
      FUNCIONARIO: 1,
      TURMA_COLHEITA: 2,
      FORNECEDOR: 3,
      DESCONHECIDO: 4,
    };

    lotes.sort((a, b) => {
      const pa = tipoPrioridade[(a.origemTipo || "DESCONHECIDO")] || 99;
      const pb = tipoPrioridade[(b.origemTipo || "DESCONHECIDO")] || 99;

      if (pa !== pb) {
        return pa - pb;
      }

      const da = new Date(a.dataCriacao).getTime();
      const db = new Date(b.dataCriacao).getTime();

      return db - da;
    });

    return lotes;
  }, [lotesTurmaColheita, searchTermAplicado, tipoOrigem, appliedFilters]);

  // Processar lotes para exibição na tabela (Folha Pagamento)
  const lotesFiltradosOrdenadosFolhaPagamento = useMemo(() => {
    // Usar searchTermAplicado ao invés de searchTerm para não filtrar durante digitação
    const termo = searchTermAplicado.trim().toLowerCase();

    // Garantir que lotesFolhaPagamento é um array
    if (!Array.isArray(lotesFolhaPagamento)) {
      return [];
    }

    // Trabalhar diretamente com lotes (não fazer flatMap)
    let lotes = lotesFolhaPagamento.map((lote) => ({
      ...lote,
      loteId: lote.id,
    }));

    // Aplicar filtros de busca inteligente (chips)
    if (appliedFilters.length > 0) {
      lotes = lotes.filter((lote) => {
        return appliedFilters.some((filtro) => {
          if (filtro.type === 'funcionario') {
            const itens = lote.itensPagamento || [];
            return itens.some(item => {
              const funcionario = item.funcionarioPagamento?.funcionario;
              if (!funcionario) return false;
              
              // Se filtro tem CPF, comparar por CPF
              if (filtro.metadata?.cpf && funcionario.cpf) {
                const cpfFiltro = filtro.metadata.cpf.replace(/\D/g, '');
                const cpfFuncionario = funcionario.cpf.replace(/\D/g, '');
                if (cpfFiltro === cpfFuncionario) return true;
              }
              
              // Comparar por nome
              const nomeFuncionario = (funcionario.nome || "").trim().toLowerCase();
              const nomeFiltro = filtro.metadata?.nome?.toLowerCase() || filtro.value.toLowerCase();
              if (nomeFuncionario === nomeFiltro) return true;
              
              // Comparar por chavePix
              if (filtro.metadata?.chavePix && funcionario.chavePix) {
                const chavePixFiltro = filtro.metadata.chavePix.toLowerCase();
                const chavePixFuncionario = funcionario.chavePix.toLowerCase();
                if (chavePixFiltro === chavePixFuncionario) return true;
              }
              
              // Comparar por responsavelChavePix
              if (filtro.metadata?.responsavelChavePix && funcionario.responsavelChavePix) {
                const responsavelFiltro = filtro.metadata.responsavelChavePix.toLowerCase();
                const responsavelFuncionario = funcionario.responsavelChavePix.toLowerCase();
                if (responsavelFiltro === responsavelFuncionario) return true;
              }
              
              // Comparar por apelido
              if (filtro.metadata?.apelido && funcionario.apelido) {
                const apelidoFiltro = filtro.metadata.apelido.toLowerCase();
                const apelidoFuncionario = funcionario.apelido.toLowerCase();
                if (apelidoFiltro === apelidoFuncionario) return true;
              }
              
              // Comparar pelo valor do filtro diretamente (caso seja chavePix, responsavel ou apelido)
              const valorFiltro = filtro.value.toLowerCase();
              if (funcionario.chavePix && funcionario.chavePix.toLowerCase() === valorFiltro) return true;
              if (funcionario.responsavelChavePix && funcionario.responsavelChavePix.toLowerCase() === valorFiltro) return true;
              if (funcionario.apelido && funcionario.apelido.toLowerCase() === valorFiltro) return true;
              
              return false;
            });
          }
          // Colhedor não se aplica a lotes de folha de pagamento
          return false;
        });
      });
    }

    // Aplicar filtro de busca por texto (fallback - apenas se não houver filtros aplicados)
    // IMPORTANTE: Usar searchTermAplicado, não searchTerm, para não filtrar durante digitação
    if (termo && appliedFilters.length === 0) {
      lotes = lotes.filter((lote) => {
        const numero = (lote.numeroRequisicao || "").toString();
        const origemNome = (lote.origemNome || "").toLowerCase();
        const conta = `${lote.contaCorrente?.agencia || ""} ${lote.contaCorrente?.contaCorrente || ""}`.toLowerCase();

        return (
          numero.includes(termo) ||
          origemNome.includes(termo) ||
          conta.includes(termo)
        );
      });
    }

    if (tipoOrigem !== "TODOS") {
      lotes = lotes.filter(
        (lote) => (lote.origemTipo || "").toUpperCase() === tipoOrigem,
      );
    }

    // Ordenar por tipo de origem e depois por dataCriacao (mais recente primeiro)
    const tipoPrioridade = {
      FUNCIONARIO: 1,
      TURMA_COLHEITA: 2,
      FORNECEDOR: 3,
      FOLHA_PAGAMENTO: 1, // Mesma prioridade de FUNCIONARIO
      DESCONHECIDO: 4,
    };

    lotes.sort((a, b) => {
      const pa = tipoPrioridade[(a.origemTipo || "DESCONHECIDO")] || 99;
      const pb = tipoPrioridade[(b.origemTipo || "DESCONHECIDO")] || 99;

      if (pa !== pb) {
        return pa - pb;
      }

      const da = new Date(a.dataCriacao).getTime();
      const db = new Date(b.dataCriacao).getTime();

      return db - da;
    });

    return lotes;
  }, [lotesFolhaPagamento, searchTermAplicado, tipoOrigem, appliedFilters]);

  // Efeito para gerenciar expansão automática das seções baseado nos dados filtrados
  // IMPORTANTE: Só aplicar quando há filtros aplicados (chips), não durante digitação
  useEffect(() => {
    // Se não há filtros aplicados, não fazer nada (manter estado atual)
    if (appliedFilters.length === 0) {
      return;
    }

    const temDadosTurma = lotesFiltradosOrdenadosTurmaColheita.length > 0;
    const temDadosFolha = lotesFiltradosOrdenadosFolhaPagamento.length > 0;
    
    // Se ambas têm dados, deixar ambas colapsadas (não expandir automaticamente)
    if (temDadosTurma && temDadosFolha) {
      // Se ambas estão expandidas, manter; senão, colapsar ambas
      setActiveKeys((prev) => {
        const ambasExpandidas = prev.includes("turma-colheita") && prev.includes("folha-pagamento");
        if (!ambasExpandidas) {
          return [];
        }
        return prev;
      });
      return;
    }
    
    // Se só uma tem dados, expandir ela automaticamente
    if (temDadosTurma && !temDadosFolha) {
      setActiveKeys((prev) => {
        if (prev.includes("turma-colheita")) return prev;
        return ["turma-colheita"];
      });
    } else if (!temDadosTurma && temDadosFolha) {
      setActiveKeys((prev) => {
        if (prev.includes("folha-pagamento")) return prev;
        return ["folha-pagamento"];
      });
    } else {
      // Nenhuma tem dados, ocultar ambas
      setActiveKeys([]);
    }
  }, [lotesFiltradosOrdenadosTurmaColheita.length, lotesFiltradosOrdenadosFolhaPagamento.length, appliedFilters.length]);

  // Calcular estatísticas para Turma de Colheita
  const estatisticasTurmaColheita = useMemo(() => {
    const lotes = lotesFiltradosOrdenadosTurmaColheita;
    
    const totalLotes = lotes.length;
    const totalItens = lotes.reduce((acc, lote) => acc + (lote.quantidadeItens || 0), 0);
    const totalColheitas = lotes.reduce((acc, lote) => acc + (lote.quantidadeColheitas || 0), 0);
    const totalPedidos = lotes.reduce((acc, lote) => acc + (lote.quantidadePedidos || 0), 0);
    
    const lotesLiberados = lotes.filter(lote => lote.dataLiberacao).length;
    const lotesRejeitados = lotes.filter(lote => 
      lote.status === 'REJEITADO' || lote.estadoRequisicaoAtual === 7
    ).length;
    const itensLiberados = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const liberados = itens.filter(item => {
        const estado = item.estadoPagamentoIndividual || item.status;
        return estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado';
      }).length;
      return acc + liberados;
    }, 0);
    const itensRejeitados = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const rejeitados = itens.filter(item => {
        const status = item.status;
        return status === 'REJEITADO';
      }).length;
      return acc + rejeitados;
    }, 0);
    
    // Calcular valores liberados vs pendentes
    // IMPORTANTE: Filtrar apenas lotes com colheitas vinculadas (origemTipo === 'TURMA_COLHEITA' e valorTotalColheitas > 0)
    // Isso exclui lotes de teste sem colheitas vinculadas
    
    // Filtrar lotes com colheitas vinculadas
    const lotesComColheitas = lotes.filter(lote => 
      lote.origemTipo === 'TURMA_COLHEITA' && 
      Number(lote.valorTotalColheitas || 0) > 0
    );
    
    // Valor Total Colheitas: soma dos valores das colheitas vinculadas
    const valorTotalColheitas = lotesComColheitas.reduce((acc, lote) => 
      acc + Number(lote.valorTotalColheitas || 0), 0
    );
    
    // Valor Liberado: soma dos valores dos itens que já foram pagos (apenas de lotes com colheitas)
    const valorTotalLiberado = lotesComColheitas.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const valorItensPagos = itens.reduce((sum, item) => {
        const estado = item.estadoPagamentoIndividual || item.status;
        if (estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado') {
          return sum + Number(item.valorEnviado || 0);
        }
        return sum;
      }, 0);
      return acc + valorItensPagos;
    }, 0);
    
    // Valor Pendente: diferença entre valor total das colheitas e valor já pago
    // Para colheitas, sempre deve bater: valorTotalColheitas = valorTotalLiberado + valorTotalPendente
    const valorTotalPendente = valorTotalColheitas - valorTotalLiberado;
    
    return {
      totalLotes,
      totalItens,
      totalColheitas,
      totalPedidos,
      lotesLiberados,
      lotesRejeitados,
      itensLiberados,
      itensRejeitados,
      valorTotalLiberado,
      valorTotalPendente,
      valorTotalColheitas,
    };
  }, [lotesFiltradosOrdenadosTurmaColheita]);

  // Calcular estatísticas para Folha de Pagamento
  const estatisticasFolhaPagamento = useMemo(() => {
    const lotes = lotesFiltradosOrdenadosFolhaPagamento;
    
    const totalLotes = lotes.length;
    const totalItens = lotes.reduce((acc, lote) => acc + (lote.quantidadeItens || 0), 0);
    const totalFuncionarios = lotes.reduce((acc, lote) => acc + (lote.quantidadeFuncionarios || 0), 0);
    
    const lotesLiberados = lotes.filter(lote => lote.dataLiberacao).length;
    const lotesRejeitados = lotes.filter(lote => 
      lote.status === 'REJEITADO' || lote.estadoRequisicaoAtual === 7
    ).length;
    const itensLiberados = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const liberados = itens.filter(item => {
        const estado = item.estadoPagamentoIndividual || item.status;
        return estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado';
      }).length;
      return acc + liberados;
    }, 0);
    const itensRejeitados = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const rejeitados = itens.filter(item => {
        const status = item.status;
        return status === 'REJEITADO';
      }).length;
      return acc + rejeitados;
    }, 0);
    
    // Calcular valores liberados vs pendentes
    // Valor Liberado: soma dos valores dos itens que já foram pagos
    const valorTotalLiberado = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const valorItensPagos = itens.reduce((sum, item) => {
        const estado = item.estadoPagamentoIndividual || item.status;
        if (estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado') {
          return sum + Number(item.valorEnviado || 0);
        }
        return sum;
      }, 0);
      return acc + valorItensPagos;
    }, 0);
    
    // Valor Pendente: soma dos valores enviados ao BB que ainda não foram pagos
    // Usar valorTotalEnviado (valor real enviado ao BB)
    const valorTotalPendente = lotes.reduce((acc, lote) => {
      // Para funcionários, usar valorTotalFuncionarios ou valorTotalEnviado
      const valorTotalLote = Number(lote.valorTotalFuncionarios || lote.valorTotalEnviado || 0);
      const itens = lote.itensPagamento || [];
      const valorItensPagos = itens.reduce((sum, item) => {
        const estado = item.estadoPagamentoIndividual || item.status;
        if (estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado') {
          return sum + Number(item.valorEnviado || 0);
        }
        return sum;
      }, 0);
      
      if (itens.length === 0) {
        // Se não tem itens, todo o valor enviado está pendente
        return acc + valorTotalLote;
      }
      // Valor pendente = valor total enviado - valor pago
      return acc + Math.max(0, valorTotalLote - valorItensPagos);
    }, 0);
    
    const valorTotalFuncionarios = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalFuncionarios || 0), 0);
    
    return {
      totalLotes,
      totalItens,
      totalFuncionarios,
      lotesLiberados,
      lotesRejeitados,
      itensLiberados,
      itensRejeitados,
      valorTotalLiberado,
      valorTotalPendente,
      valorTotalFuncionarios,
    };
  }, [lotesFiltradosOrdenadosFolhaPagamento]);

  const handleLiberarLote = useCallback(
    async (record) => {
      try {
        setLiberandoLoteId(record.id);
        showNotification(
          "info",
          "Liberação de pagamento",
          `Enviando solicitação de liberação para o lote ${record.numeroRequisicao}...`
        );

        await axiosInstance.post("/api/pagamentos/liberar", {
          numeroRequisicao: record.numeroRequisicao,
          indicadorFloat: "S", // Produção
        });

        showNotification(
          "success",
          "Liberação enviada",
          `Lote ${record.numeroRequisicao} enviado para liberação no Banco do Brasil.`
        );

        // Recarregar lista respeitando o filtro de data atual
        let inicio = null;
        let fim = null;
        if (dateRange && dateRange.length === 2) {
          inicio = dateRange[0]
            ? moment(dateRange[0]).startOf("day").toISOString()
            : null;
          fim = dateRange[1]
            ? moment(dateRange[1]).endOf("day").toISOString()
            : null;
        }
        await fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType);
        await fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType);
      } catch (error) {
        console.error("Erro ao liberar lote de pagamentos:", error);
        const message =
          error.response?.data?.message ||
          "Erro ao enviar liberação de pagamentos para o Banco do Brasil";
        showNotification("error", "Erro ao liberar pagamento", message);
      } finally {
        setLiberandoLoteId(null);
      }
    },
    [dateRange, fetchLotesTurmaColheita, fetchLotesFolhaPagamento]
  );

  // Função para gerar colunas reutilizáveis (funciona para ambos os tipos)
  const getColumns = (tipoOrigem = 'TURMA_COLHEITA') => {
    const isFolhaPagamento = tipoOrigem === 'FOLHA_PAGAMENTO';
    
    return [
      {
        title: "Lote",
        dataIndex: "numeroRequisicao",
        key: "numeroRequisicao",
        width: 80,
        render: (numero) => (
          <Text code style={{ fontSize: "0.85rem" }}>
            {numero}
          </Text>
        ),
        sorter: (a, b) => a.numeroRequisicao - b.numeroRequisicao,
      },
      {
        title: isFolhaPagamento ? "Folha" : "Colhedor",
        key: isFolhaPagamento ? "folha" : "colhedor",
        width: 200,
        render: (_, record) => {
          if (isFolhaPagamento) {
            return record.origemNome ? (
              <Text strong>{record.origemNome}</Text>
            ) : (
              <Text type="secondary">Não identificado</Text>
            );
          } else {
            return record.origemNome ? (
              <Text strong>{record.origemNome}</Text>
            ) : record.turmaResumo?.nomeColhedor ? (
              <Text strong>{record.turmaResumo.nomeColhedor}</Text>
            ) : (
              <Text type="secondary">Não identificado</Text>
            );
          }
        },
      },
      {
        title: "Conta",
        key: "contaCorrente",
        width: 140,
        render: (_, record) => {
          const conta = record.contaCorrente;
          if (!conta) {
            return <Text type="secondary">-</Text>;
          }
          return (
            <Space size="small">
              <BankOutlined style={{ color: "#059669" }} />
              <Text style={{ fontSize: "0.85rem" }}>
                {conta.agencia} / {conta.contaCorrente}
              </Text>
            </Space>
          );
        },
      },
      {
        title: isFolhaPagamento ? "Qtd Itens" : "Qtd Itens",
        key: "quantidadeItens",
        width: 100,
        render: (_, record) => {
          const qtd = record.quantidadeItens || record.itensPagamento?.length || 0;
          return (
            <Text strong>{qtd}</Text>
          );
        },
        sorter: (a, b) => {
          const qtdA = a.quantidadeItens || a.itensPagamento?.length || 0;
          const qtdB = b.quantidadeItens || b.itensPagamento?.length || 0;
          return qtdA - qtdB;
        },
      },
      {
        title: "Valor Total",
        key: "valorTotal",
        width: 140,
        render: (_, record) => {
          const valor = isFolhaPagamento
            ? Number(record.valorTotalFuncionarios || record.valorTotalEnviado || 0)
            : Number(record.valorTotalColheitas || record.valorTotalEnviado || 0);
          return (
            <Text strong style={{ color: "#059669" }}>
              R$ {formatCurrency(valor)}
            </Text>
          );
        },
        sorter: (a, b) => {
          const valA = isFolhaPagamento
            ? Number(a.valorTotalFuncionarios || a.valorTotalEnviado || 0)
            : Number(a.valorTotalColheitas || a.valorTotalEnviado || 0);
          const valB = isFolhaPagamento
            ? Number(b.valorTotalFuncionarios || b.valorTotalEnviado || 0)
            : Number(b.valorTotalColheitas || b.valorTotalEnviado || 0);
          return valA - valB;
        },
      },
      {
        title: (
          <Space size="small">
            <span>Data Agendamento</span>
            <Tooltip title="Data prevista para o pagamento ser processado pelo Banco do Brasil. Esta é a data informada pelo usuário ao criar o lote de pagamento.">
              <InfoCircleOutlined style={{ color: "#ffffff", cursor: "help" }} />
            </Tooltip>
          </Space>
        ),
        key: "dataPagamentoAgendada",
        width: 160,
        render: (_, record) => {
          const dataPagamento = record.dataPagamentoAgendada;
          if (!dataPagamento) {
            return <Text type="secondary">-</Text>;
          }
          return (
            <Text>
              {moment(dataPagamento).format("DD/MM/YYYY")}
            </Text>
          );
        },
        sorter: (a, b) => {
          const dataA = a.dataPagamentoAgendada ? new Date(a.dataPagamentoAgendada).getTime() : 0;
          const dataB = b.dataPagamentoAgendada ? new Date(b.dataPagamentoAgendada).getTime() : 0;
          return dataA - dataB;
        },
      },
    {
      title: "Estado BB",
      key: "estadoRequisicao",
      width: 140,
      render: (_, record) => {
        // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
        const estadoRequisicao = record.estadoRequisicaoAtual || record.estadoRequisicao;
        const mapeamento = mapearEstadoRequisicao(estadoRequisicao);

        return (
          <Tooltip title={mapeamento.tooltip}>
            <Tag color={mapeamento.color}>
              {estadoRequisicao ? `${estadoRequisicao} - ${mapeamento.label}` : mapeamento.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Criado em",
      dataIndex: "dataCriacao",
      key: "dataCriacao",
      width: 160,
      render: (data) =>
        data ? new Date(data).toLocaleString("pt-BR") : "-",
      sorter: (a, b) =>
        new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime(),
    },
    {
      title: "Operações",
      key: "operacoes",
      width: 200,
      render: (_, record) => {
        const usuarioCriacao = record.usuarioCriacao;
        const usuarioLiberacao = record.usuarioLiberacao;
        const dataLiberacao = record.dataLiberacao;

        const operacoes = [];

        if (usuarioCriacao) {
          operacoes.push({
            tipo: "Criado",
            usuario: usuarioCriacao.nome,
            data: record.dataCriacao,
            cor: "#1890ff",
          });
        }

        if (usuarioLiberacao && dataLiberacao) {
          operacoes.push({
            tipo: "Liberado",
            usuario: usuarioLiberacao.nome,
            data: dataLiberacao,
            cor: "#52c41a",
          });
        }

        if (operacoes.length === 0) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Tooltip
            title={
              <div>
                {operacoes.map((op, index) => (
                  <div key={index} style={{ marginBottom: "4px" }}>
                    <strong style={{ color: op.cor }}>{op.tipo}:</strong>{" "}
                    {op.usuario}
                    <br />
                    <span style={{ fontSize: "11px", color: "#8c8c8c" }}>
                      {new Date(op.data).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            }
          >
            <Space direction="vertical" size="small" style={{ fontSize: "12px" }}>
              {operacoes.map((op, index) => (
                <Tag key={index} color={op.cor} style={{ margin: 0 }}>
                  {op.tipo}: {op.usuario}
                </Tag>
              ))}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Ações",
      key: "acoes",
      width: 140,
      render: (_, record) => {
        // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
        const estadoRequisicao = record.estadoRequisicaoAtual || record.estadoRequisicao;
        
        // Botão "Liberar" aparece quando:
        // - estadoRequisicao === 1 (dados consistentes, aguardando liberação)
        // - estadoRequisicao === 4 (aguardando liberação - pendente de ação pelo Conveniado)
        // - NÃO está liberado (estadoRequisicao !== 9) e NÃO está processado (estadoRequisicao !== 6)
        // - NÃO foi liberado anteriormente (!record.dataLiberacao)
        // Estados 1 e 4 são "aguardando", então podem ser liberados
        // IMPORTANTE: Verificar dataLiberacao para evitar mostrar botão em lotes já liberados
        // que voltaram para estado 4 após passar por estado 8 (sequência real do BB: 1,2,3 → 8 → 4 → 9/10 → 6/7)
        const podeLiberar =
          estadoRequisicao &&
          (estadoRequisicao === 1 || estadoRequisicao === 4) &&
          estadoRequisicao !== 9 &&
          estadoRequisicao !== 6 &&
          !record.dataLiberacao; // Não mostrar se já foi liberado anteriormente
        
        // Cancelamento é feito no nível de item, não no nível de lote
        // Será implementado quando expandir o lote e mostrar os itens

        // Função para criar o menu de ações de visualização
        const getMenuContent = (record) => {
          const menuItems = [];
          
          // Opção: Consultar lote online
          menuItems.push({
            key: "consulta-online",
            label: (
              <Space>
                <EyeOutlined style={{ color: "#1890ff" }} />
                <span style={{ color: "#333" }}>Consultar Lote Online</span>
              </Space>
            ),
            onClick: () => {
              setLoteSelecionado(record);
              setModalConsultaOnlineOpen(true);
            },
          });

          // Consulta de item individual será feita ao expandir o lote

          return { items: menuItems };
        };

        return (
          <Space size="small">
            {/* Botões de ação diretos */}
            {podeLiberar && (
              <Tooltip title="Liberar pagamento">
                <Button
                  type="primary"
                  size="small"
                  loading={liberandoLoteId === record.numeroRequisicao}
                  onClick={() => {
                    setLoteSelecionado(record);
                    setModalDetalhesOpen(true);
                  }}
                  icon={<UnlockOutlined />}
                  style={{
                    backgroundColor: "#059669",
                    borderColor: "#059669",
                    minWidth: "32px",
                    height: "32px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </Tooltip>
            )}
            {/* Cancelar não está disponível no nível de lote, apenas no nível de item */}
            
            {/* Menu dropdown para opções de visualização */}
            <Dropdown
              menu={getMenuContent(record)}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                size="small"
                style={{
                  color: "#666666",
                  border: "none",
                  boxShadow: "none",
                }}
              />
            </Dropdown>
          </Space>
        );
      },
    },
    ];
  };

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
      <Box sx={{ mb: 3 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "1.500rem",
          }}
        >
          <DollarOutlined style={{ marginRight: 12, color: "#059669" }} />
          {isMobile ? "Pagamentos" : "Relatórios de Pagamentos"}
        </Title>
        <Text
          type="secondary"
          style={{
            fontSize: "14px",
            display: "block",
            textAlign: "left",
          }}
        >
          Visualize e analise os lotes de pagamentos enviados (turmas de colheita, funcionários, fornecedores), com filtros por origem, período e status.
        </Text>
      </Box>

      {/* Filtros - layout inspirado em Pedidos.js */}
      <Box
        sx={{
          p: isMobile ? 2 : 3,
          bgcolor: "#f9f9f9",
          borderRadius: 2,
          border: "1px solid #e8e8e8",
          mb: 0,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Text
            strong
            style={{
              color: "#2E7D32",
              fontSize: isMobile ? "0.875rem" : "1rem",
            }}
          >
            <FilterOutlined style={{ marginRight: 8 }} />
            Filtros de Busca
          </Text>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: isMobile ? 1 : 2,
            mb: 0,
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* Busca texto */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 250px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Buscar por lote, beneficiário ou conta:
            </Text>
            <SearchInputPagamentos
              placeholder={
                isMobile
                  ? "Buscar..."
                  : "Buscar por colhedor, funcionário, CPF, lote ou conta..."
              }
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              onSuggestionSelect={handleSuggestionSelect}
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                fontSize: isMobile ? "0.875rem" : "1rem",
                marginBottom: 0,
              }}
            />
          </Box>

          {/* Tipo de origem */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 220px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Tipo de origem:
            </Text>
            <Select
              value={tipoOrigem}
              onChange={setTipoOrigem}
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                marginBottom: 0,
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              <Option value="TODOS">Todos</Option>
              <Option value="TURMA_COLHEITA">Turma de Colheita</Option>
              <Option value="FOLHA_PAGAMENTO">Folha de Pagamento</Option>
            </Select>
          </Box>

          {/* Conta Corrente */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 220px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Conta Corrente:
            </Text>
            <Select
              value={contaCorrenteId}
              onChange={(value) => setContaCorrenteId(value)}
              allowClear
              placeholder="Todas as contas"
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                marginBottom: 0,
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              {contasCorrentes.map((conta) => (
                <Option key={conta.id} value={conta.id}>
                  {conta.agencia} / {conta.contaCorrente}-{(conta.contaCorrenteDigito || 'X').toUpperCase()} {conta.nomeBanco ? `(${conta.nomeBanco})` : ''}
                </Option>
              ))}
            </Select>
          </Box>

          {/* Divider entre tipo de origem e toggle de data */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>
            <Divider 
              type="vertical" 
              style={{ 
                height: isMobile ? "32px" : "48px",
                margin: 0,
                borderColor: "#d9d9d9",
                borderWidth: "1px"
              }} 
            />
          </Box>

          {/* Toggle de Tipo de Data */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <Text style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 500,
              fontSize: isMobile ? '0.8125rem' : '0.875rem'
            }}>
              Data:
            </Text>
            <Segmented
              options={[
                { label: 'Criação', value: 'criacao' },
                { label: 'Liberação', value: 'liberacao' }
              ]}
              value={dateFilterType}
              onChange={setDateFilterType}
              size={isMobile ? "small" : "middle"}
              style={{
                fontWeight: "500"
              }}
            />
          </Box>

          {/* Filtro por data (RangePicker) */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 260px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              {dateFilterType === 'criacao' ? 'Data de Criação:' : 'Data de Liberação:'}
            </Text>
            <RangePicker
              value={dateRange}
              onChange={(values) => setDateRange(values || [])}
              placeholder={["Início", "Fim"]}
              format="DD/MM/YYYY"
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                height: isMobile ? "32px" : "40px",
                marginBottom: 0,
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            />
          </Box>

          {/* Botão Limpar */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <Text style={{ display: "block", marginBottom: 8 }}>&nbsp;</Text>
            <SecondaryButton
              icon={<FilterOutlined />}
              onClick={() => {
                setTipoOrigem("TODOS");
                setContaCorrenteId(null);
                setDateRange([]);
                setDateFilterType("criacao");
                setSearchTerm("");
                setSearchTermAplicado("");
                setAppliedFilters([]);
              }}
              size={isMobile ? "small" : "middle"}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? '0 12px' : '0 16px',
                fontSize: isMobile ? '0.75rem' : undefined
              }}
            >
              Limpar
            </SecondaryButton>
          </Box>
        </Box>

        {/* Resumo dos filtros ativos (chips) */}
        {(tipoOrigem !== "TODOS" || contaCorrenteId || dateRange.length > 0 || appliedFilters.length > 0) && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px solid #e8e8e8",
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 0.5 : 1,
              alignItems: "center",
            }}
          >
            <Text strong style={{
              fontSize: isMobile ? "0.6875rem" : "0.75rem",
              color: "#666"
            }}>
              Filtros ativos:
            </Text>
            
            {tipoOrigem !== "TODOS" && (
              <Tag
                color="blue"
                closable
                onClose={() => setTipoOrigem("TODOS")}
                style={{
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                Tipo: {tipoOrigem === "TURMA_COLHEITA" ? "Turma de Colheita" : "Folha de Pagamento"}
              </Tag>
            )}
            
            {contaCorrenteId && (() => {
              const contaSelecionada = contasCorrentes.find(c => c.id === contaCorrenteId);
              return contaSelecionada ? (
                <Tag
                  color="cyan"
                  closable
                  onClose={() => setContaCorrenteId(null)}
                  style={{
                    fontSize: isMobile ? "0.6875rem" : "0.75rem",
                    padding: isMobile ? "2px 6px" : "4px 8px"
                  }}
                >
                  Conta: {contaSelecionada.agencia} / {contaSelecionada.contaCorrente}-{(contaSelecionada.contaCorrenteDigito || 'X').toUpperCase()}
                </Tag>
              ) : null;
            })()}
            
            {dateRange.length > 0 && (
              <Tag
                color="orange"
                closable
                onClose={() => setDateRange([])}
                style={{
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                {dateFilterType === 'criacao' ? '📅 Criação' : '📅 Liberação'}: {dateRange[0]?.format('DD/MM/YYYY')} - {dateRange[1]?.format('DD/MM/YYYY')}
              </Tag>
            )}

            {/* Chips de filtros aplicados via busca inteligente */}
            {appliedFilters.map((filter, index) => (
              <Tag
                key={`${filter.type}-${filter.value}-${index}`}
                color={filter.type === 'colhedor' ? 'green' : 'blue'}
                closable
                onClose={() => {
                  setAppliedFilters(prev => prev.filter((_, i) => i !== index));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "2px" : "4px",
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  fontWeight: "500",
                  padding: isMobile ? "2px 6px" : "4px 8px"
                }}
              >
                <span style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>{filter.icon}</span>
                {filter.label}: {filter.displayValue || filter.value}
              </Tag>
            ))}
          </Box>
        )}
      </Box>

      {/* Seção: Turmas de Colheita */}
      {(tipoOrigem === "TODOS" || tipoOrigem === "TURMA_COLHEITA") && lotesFiltradosOrdenadosTurmaColheita.length > 0 && (
        <SecaoLotesPagamentos
          titulo="Lotes de Pagamentos - Turmas de Colheita"
          icone={<DollarOutlined style={{ color: "#ffffff", fontSize: "18px" }} />}
          lotes={lotesFiltradosOrdenadosTurmaColheita}
          loading={loading}
          estatisticas={estatisticasTurmaColheita}
          paginacao={paginacaoTurmaColheita}
          onPageChange={handlePageChangeTurmaColheita}
          activeKey={activeKeys.includes("turma-colheita")}
          onToggleActive={() => {
            setActiveKeys((prev) =>
              prev.includes("turma-colheita")
                ? prev.filter((k) => k !== "turma-colheita")
                : [...prev, "turma-colheita"]
            );
          }}
          columns={getColumns("TURMA_COLHEITA")}
          rowKey="loteId"
          onConsultarItemIndividual={(itemData) => {
            setItemSelecionado(itemData);
            setModalConsultaItemIndividualOpen(true);
          }}
        />
      )}

      {/* Divider entre seções */}
      {(tipoOrigem === "TODOS") && 
       lotesFiltradosOrdenadosTurmaColheita.length > 0 && 
       lotesFiltradosOrdenadosFolhaPagamento.length > 0 && (
        <Divider style={{ margin: "24px 0", borderColor: "#d9d9d9" }} />
      )}

      {/* Seção: Folha de Pagamento */}
      {(tipoOrigem === "TODOS" || tipoOrigem === "FOLHA_PAGAMENTO") && lotesFiltradosOrdenadosFolhaPagamento.length > 0 && (
        <SecaoLotesPagamentos
          titulo="Lotes de Pagamentos - Folha de Pagamento"
          icone={<DollarOutlined style={{ color: "#ffffff", fontSize: "18px" }} />}
          lotes={lotesFiltradosOrdenadosFolhaPagamento}
          loading={loadingFolha}
          estatisticas={estatisticasFolhaPagamento}
          paginacao={paginacaoFolhaPagamento}
          onPageChange={handlePageChangeFolhaPagamento}
          activeKey={activeKeys.includes("folha-pagamento")}
          onToggleActive={() => {
            setActiveKeys((prev) =>
              prev.includes("folha-pagamento")
                ? prev.filter((k) => k !== "folha-pagamento")
                : [...prev, "folha-pagamento"]
            );
          }}
          columns={getColumns("FOLHA_PAGAMENTO")}
          rowKey="loteId"
          onConsultarItemIndividual={(itemData) => {
            setItemSelecionado(itemData);
            setModalConsultaItemIndividualOpen(true);
          }}
        />
      )}

      {/* Modal de detalhes do lote e confirmação de liberação */}
      <LotePagamentosDetalhesModal
        open={modalDetalhesOpen}
        onClose={() => {
          if (!liberandoLoteId) {
            setModalDetalhesOpen(false);
            setLoteSelecionado(null);
          }
        }}
        lote={loteSelecionado}
        loadingLiberacao={!!liberandoLoteId}
        onConfirmLiberacao={async (lote) => {
          // Usar indicadorFloat 'S' (produção)
          await handleLiberarPagamento(lote.numeroRequisicao, 'S');
        }}
      />

      {/* Modal de detalhes do lote e confirmação de cancelamento */}
      <LotePagamentosDetalhesModal
        open={modalCancelamentoOpen}
        onClose={() => {
          if (!cancelandoLoteId) {
            setModalCancelamentoOpen(false);
            setLoteSelecionado(null);
          }
        }}
        onAfterClose={() => {
          // Atualizar dados após fechar o modal de cancelamento
          let inicio = null;
          let fim = null;
          if (dateRange && dateRange.length === 2) {
            inicio = dateRange[0]
              ? moment(dateRange[0]).startOf("day").toISOString()
              : null;
            fim = dateRange[1]
              ? moment(dateRange[1]).endOf("day").toISOString()
              : null;
          }
          fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType);
          fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType);
        }}
        lote={loteSelecionado}
        onConfirmCancelamento={handleCancelarItem}
        loadingCancelamento={!!cancelandoLoteId}
        mode="cancelamento"
      />

      {/* Modal de consulta online */}
      <ConsultaOnlineModal
        open={modalConsultaOnlineOpen}
        onClose={() => {
          setModalConsultaOnlineOpen(false);
          setLoteSelecionado(null);
        }}
        onAfterClose={() => {
          // Atualizar dados após fechar o modal, pois a consulta online atualiza o status no banco
          let inicio = null;
          let fim = null;
          if (dateRange && dateRange.length === 2) {
            inicio = dateRange[0]
              ? moment(dateRange[0]).startOf("day").toISOString()
              : null;
            fim = dateRange[1]
              ? moment(dateRange[1]).endOf("day").toISOString()
              : null;
          }
          fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType);
          fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType);
        }}
        numeroRequisicao={loteSelecionado?.numeroRequisicao}
        contaCorrenteId={loteSelecionado?.contaCorrente?.id}
      />

      {/* Modal de consulta item individual */}
      <ConsultaItemIndividualModal
        open={modalConsultaItemIndividualOpen}
        onClose={() => {
          setModalConsultaItemIndividualOpen(false);
          setItemSelecionado(null);
        }}
        onAfterClose={() => {
          // Atualizar dados após fechar o modal de consulta individual
          let inicio = null;
          let fim = null;
          if (dateRange && dateRange.length === 2) {
            inicio = dateRange[0]
              ? moment(dateRange[0]).startOf("day").toISOString()
              : null;
            fim = dateRange[1]
              ? moment(dateRange[1]).endOf("day").toISOString()
              : null;
          }
          fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, dateFilterType);
          fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit, dateFilterType);
        }}
        identificadorPagamento={itemSelecionado?.identificadorPagamento}
        contaCorrenteId={itemSelecionado?.contaCorrenteId}
      />
    </Box>
  );
};

export default Pagamentos;


