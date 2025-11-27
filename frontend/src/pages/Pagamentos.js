// src/pages/Pagamentos.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Tag, Space, Typography, Tooltip, Select, DatePicker, Button, Modal, Popconfirm, Dropdown, Statistic, Row, Col, Pagination } from "antd";
import { DollarOutlined, BankOutlined, ClockCircleOutlined, CheckCircleOutlined, FilterOutlined, CloseCircleOutlined, UnlockOutlined, StopOutlined, UpOutlined, DownOutlined, EyeOutlined, KeyOutlined, PhoneOutlined, MailOutlined, IdcardOutlined, SafetyOutlined, MoreOutlined, InfoCircleOutlined, FileTextOutlined, TeamOutlined, ShoppingOutlined, RightOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import ResponsiveTable from "../components/common/ResponsiveTable";
import { showNotification } from "../config/notificationConfig";
import { formatCurrency, formatarCPF, formatarCNPJ, formatarTelefone } from "../utils/formatters";
import { mapearEstadoRequisicao } from "../utils/bbEstadoRequisicao";
import useResponsive from "../hooks/useResponsive";
import moment from "moment";
import { Box } from "@mui/material";
import { SearchInput } from "components/common/search";
import LotePagamentosDetalhesModal from "../components/pagamentos/LotePagamentosDetalhesModal";
import ConsultaOnlineModal from "../components/pagamentos/ConsultaOnlineModal";
import ConsultaItemIndividualModal from "../components/pagamentos/ConsultaItemIndividualModal";
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
  const [tipoOrigem, setTipoOrigem] = useState("TODOS");
  const [dateRange, setDateRange] = useState([]);
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

  const fetchLotesTurmaColheita = useCallback(async (dataInicio = null, dataFim = null, page = 1, limit = 10) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
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

  const fetchLotesFolhaPagamento = useCallback(async (dataInicio = null, dataFim = null, page = 1, limit = 10) => {
    try {
      setLoadingFolha(true);

      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
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

  useEffect(() => {
    // Se tiver range selecionado, enviar datas normalizadas (início/fim do dia)
    if (dateRange && dateRange.length === 2) {
      const inicio = dateRange[0]
        ? moment(dateRange[0]).startOf("day").toISOString()
        : null;
      const fim = dateRange[1]
        ? moment(dateRange[1]).endOf("day").toISOString()
        : null;
      fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
      fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
    } else {
      // Sem filtro de data, buscar todos
      fetchLotesTurmaColheita(null, null, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
      fetchLotesFolhaPagamento(null, null, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
    }
  }, [fetchLotesTurmaColheita, fetchLotesFolhaPagamento, dateRange, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit]);

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
      if (dateRange && dateRange.length === 2) {
        const inicio = dateRange[0]
          ? moment(dateRange[0]).startOf("day").toISOString()
          : null;
        const fim = dateRange[1]
          ? moment(dateRange[1]).endOf("day").toISOString()
          : null;
        fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
        fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
      } else {
        fetchLotesTurmaColheita(null, null, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
        fetchLotesFolhaPagamento(null, null, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
      }
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
      if (dateRange && dateRange.length === 2) {
        const inicio = dateRange[0]
          ? moment(dateRange[0]).startOf("day").toISOString()
          : null;
        const fim = dateRange[1]
          ? moment(dateRange[1]).endOf("day").toISOString()
          : null;
        fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
        fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
      } else {
        fetchLotesTurmaColheita(null, null, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
        fetchLotesFolhaPagamento(null, null, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
      }
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

    // Aplicar filtros
    if (termo) {
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
  }, [lotesTurmaColheita, searchTerm, tipoOrigem]);

  // Processar lotes para exibição na tabela (Folha Pagamento)
  const lotesFiltradosOrdenadosFolhaPagamento = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();

    // Garantir que lotesFolhaPagamento é um array
    if (!Array.isArray(lotesFolhaPagamento)) {
      return [];
    }

    // Trabalhar diretamente com lotes (não fazer flatMap)
    let lotes = lotesFolhaPagamento.map((lote) => ({
      ...lote,
      loteId: lote.id,
    }));

    // Aplicar filtros
    if (termo) {
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
  }, [lotesFolhaPagamento, searchTerm, tipoOrigem]);

  // Calcular estatísticas para Turma de Colheita
  const estatisticasTurmaColheita = useMemo(() => {
    const lotes = lotesFiltradosOrdenadosTurmaColheita;
    
    const totalLotes = lotes.length;
    const totalItens = lotes.reduce((acc, lote) => acc + (lote.quantidadeItens || 0), 0);
    const totalColheitas = lotes.reduce((acc, lote) => acc + (lote.quantidadeColheitas || 0), 0);
    const totalPedidos = lotes.reduce((acc, lote) => acc + (lote.quantidadePedidos || 0), 0);
    
    const lotesLiberados = lotes.filter(lote => lote.dataLiberacao).length;
    const itensLiberados = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const liberados = itens.filter(item => {
        const estado = item.estadoPagamentoIndividual || item.status;
        return estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado';
      }).length;
      return acc + liberados;
    }, 0);
    
    const valorTotalEnviado = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalEnviado || 0), 0);
    const valorTotalValidado = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalValidado || lote.valorTotalEnviado || 0), 0);
    const valorTotalColheitas = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalColheitas || 0), 0);
    
    return {
      totalLotes,
      totalItens,
      totalColheitas,
      totalPedidos,
      lotesLiberados,
      itensLiberados,
      valorTotalEnviado,
      valorTotalValidado,
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
    const itensLiberados = lotes.reduce((acc, lote) => {
      const itens = lote.itensPagamento || [];
      const liberados = itens.filter(item => {
        const estado = item.estadoPagamentoIndividual || item.status;
        return estado === 'PAGO' || estado === 'Pago' || estado === 'PROCESSADO' || estado === 'Debitado';
      }).length;
      return acc + liberados;
    }, 0);
    
    const valorTotalEnviado = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalEnviado || 0), 0);
    const valorTotalValidado = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalValidado || lote.valorTotalEnviado || 0), 0);
    const valorTotalFuncionarios = lotes.reduce((acc, lote) => acc + Number(lote.valorTotalFuncionarios || 0), 0);
    
    return {
      totalLotes,
      totalItens,
      totalFuncionarios,
      lotesLiberados,
      itensLiberados,
      valorTotalEnviado,
      valorTotalValidado,
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
        if (dateRange && dateRange.length === 2) {
          const inicio = dateRange[0]
            ? moment(dateRange[0]).startOf("day").toISOString()
            : null;
          const fim = dateRange[1]
            ? moment(dateRange[1]).endOf("day").toISOString()
            : null;
          await fetchLotesTurmaColheita(inicio, fim, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
          await fetchLotesFolhaPagamento(inicio, fim, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
        } else {
          await fetchLotesTurmaColheita(null, null, paginacaoTurmaColheita.page, paginacaoTurmaColheita.limit);
          await fetchLotesFolhaPagamento(null, null, paginacaoFolhaPagamento.page, paginacaoFolhaPagamento.limit);
        }
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
            <SearchInput
              placeholder={
                isMobile
                  ? "Buscar..."
                  : "Buscar por lote, beneficiário ou conta..."
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
              <Option value="FUNCIONARIO">Funcionários</Option>
              <Option value="TURMA_COLHEITA">Turma de Colheita</Option>
              <Option value="FOLHA_PAGAMENTO">Folha de Pagamento</Option>
              <Option value="FORNECEDOR">Fornecedores</Option>
            </Select>
          </Box>

          {/* Filtro por data de criação (RangePicker) */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 260px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Data de criação do lote:
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
        </Box>
      </Box>

      {/* Seção: Turmas de Colheita */}
      {(tipoOrigem === "TODOS" || tipoOrigem === "TURMA_COLHEITA") && (
        <div style={{ marginBottom: 24 }}>
          <Card
            style={{
              margin: 0,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            headStyle={{
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
            }}
            title={
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  width: "100%",
                }}
                onClick={() => {
                  setActiveKeys(prev => 
                    prev.includes('turma-colheita') 
                      ? prev.filter(k => k !== 'turma-colheita')
                      : [...prev, 'turma-colheita']
                  );
                }}
              >
                <Space>
                  <DollarOutlined style={{ color: "#ffffff", fontSize: "18px" }} />
                  <Text strong style={{ fontSize: isMobile ? "14px" : "16px", color: "#ffffff" }}>
                    Lotes de Pagamentos - Turmas de Colheita
                  </Text>
                </Space>
                <Space>
                  <Text style={{ fontSize: "11px", color: "#ffffff", opacity: 0.9 }}>
                    Clique para expandir/colapsar
                  </Text>
                  <RightOutlined 
                    rotate={activeKeys.includes('turma-colheita') ? 90 : 0} 
                    style={{ 
                      color: "#ffffff", 
                      fontSize: "14px",
                      transition: "transform 0.3s",
                      marginLeft: "8px"
                    }} 
                  />
                </Space>
              </div>
            }
            bodyStyle={{ padding: "16px" }}
          >
            {/* Cards de Estatísticas */}
            <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Lotes</Text>}
                            value={estatisticasTurmaColheita.totalLotes}
                            prefix={<FileTextOutlined style={{ color: "#059669", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Itens</Text>}
                            value={estatisticasTurmaColheita.totalItens}
                            prefix={<ShoppingOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Colheitas</Text>}
                            value={estatisticasTurmaColheita.totalColheitas}
                            prefix={<TeamOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Lotes Liberados</Text>}
                            value={estatisticasTurmaColheita.lotesLiberados}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Itens Liberados</Text>}
                            value={estatisticasTurmaColheita.itensLiberados}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Enviado</Text>}
                            value={formatCurrency(estatisticasTurmaColheita.valorTotalEnviado)}
                            prefix={<DollarOutlined style={{ color: "#059669", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Validado</Text>}
                            value={formatCurrency(estatisticasTurmaColheita.valorTotalValidado)}
                            prefix={<DollarOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Colheitas</Text>}
                            value={formatCurrency(estatisticasTurmaColheita.valorTotalColheitas)}
                            prefix={<DollarOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                    </Row>
            
            {/* Tabela - Visível apenas quando expandido */}
            {activeKeys.includes('turma-colheita') && (
              <>
                <div style={{ marginTop: 16, borderTop: "1px solid #e8e8e8", paddingTop: 16 }}>
                  <style>
                    {`
                      .ant-table-expanded-row > td {
                        padding: 0 !important;
                        background-color: #f9f9f9 !important;
                      }
                      .ant-table-expanded-row > td > div {
                        margin: 0 !important;
                      }
                    `}
                  </style>
                  <ResponsiveTable
                    columns={getColumns('TURMA_COLHEITA')}
                    dataSource={lotesFiltradosOrdenadosTurmaColheita}
                    loading={loading}
                    rowKey="loteId"
                    minWidthMobile={1400}
                    showScrollHint={true}
                    expandable={{
                    expandIcon: ({ expanded, onExpand, record }) => {
                      const itens = record.itensPagamento || [];
                      if (itens.length === 0) return null;
                      
                      return (
                        <Button
                          type="text"
                          size="small"
                          icon={expanded ? <UpOutlined /> : <DownOutlined />}
                          onClick={(e) => onExpand(record, e)}
                          style={{
                            padding: "4px 8px",
                            height: "auto",
                            color: "#059669",
                          }}
                        />
                      );
                    },
                    expandedRowRender: (record) => {
                      const itens = record.itensPagamento || [];
                      
                      if (itens.length === 0) {
                        return (
                          <div style={{ 
                            padding: "12px 0", 
                            backgroundColor: "#f9f9f9"
                          }}>
                            <Text type="secondary">Nenhum item neste lote.</Text>
                          </div>
                        );
                      }

                      return (
                        <div style={{ 
                          padding: "12px 0", 
                          backgroundColor: "#f9f9f9"
                        }}>
                          <Text strong style={{ fontSize: "13px", color: "#059669", marginBottom: "10px", display: "block" }}>
                            Itens do Lote ({itens.length}):
                          </Text>
                          <div style={{ display: "grid", gap: "8px" }}>
                            {itens.map((item, index) => {
                              const colheitas = item.colheitas || [];
                              const funcionarioPagamento = item.funcionarioPagamento;
                              
                              return (
                                <Card
                                  key={item.id || index}
                                  size="small"
                                  style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "4px",
                                    boxShadow: "none",
                                  }}
                                  bodyStyle={{ padding: "10px" }}
                                >
                                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                      <Space size="middle" wrap>
                                        <div>
                                          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                            Código Pagamento
                                          </Text>
                                          <Tag color="blue" style={{ fontFamily: 'monospace', marginTop: "4px" }}>
                                            {item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento || '-'}
                                          </Tag>
                                        </div>
                                        <div>
                                          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                            Valor
                                          </Text>
                                          <Text strong style={{ display: "block", marginTop: "4px", color: "#059669" }}>
                                            R$ {formatCurrency(Number(item.valorEnviado || 0))}
                                          </Text>
                                        </div>
                                        {item.chavePixEnviada && (
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Chave PIX
                                            </Text>
                                            <Text style={{ display: "block", marginTop: "4px", fontSize: "11px" }}>
                                              {item.chavePixEnviada}
                                            </Text>
                                          </div>
                                        )}
                                      </Space>
                                    </div>
                                    
                                    {/* Para turma de colheita: mostrar colheitas */}
                                    {colheitas.length > 0 && (
                                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e8e8e8" }}>
                                        <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>
                                          Colheitas ({colheitas.length}):
                                        </Text>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                          {colheitas.map((c, idx) => (
                                            <Tag key={idx} color="cyan">
                                              {c.pedidoNumero} - {c.frutaNome} - R$ {formatCurrency(c.valorColheita || 0)}
                                            </Tag>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Para folha de pagamento: mostrar funcionário */}
                                    {funcionarioPagamento && (
                                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e8e8e8" }}>
                                        <Space size="middle" wrap>
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Funcionário
                                            </Text>
                                            <Text strong style={{ display: "block", marginTop: "4px" }}>
                                              {funcionarioPagamento.funcionario?.nome || '-'}
                                            </Text>
                                          </div>
                                          {funcionarioPagamento.funcionario?.cpf && (
                                            <div>
                                              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                                CPF
                                              </Text>
                                              <Text style={{ display: "block", marginTop: "4px" }}>
                                                {formatarCPF(funcionarioPagamento.funcionario.cpf)}
                                              </Text>
                                            </div>
                                          )}
                                          {funcionarioPagamento.folha && (
                                            <div>
                                              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                                Folha
                                              </Text>
                                              <Text style={{ display: "block", marginTop: "4px" }}>
                                                {String(funcionarioPagamento.folha.competenciaMes).padStart(2, '0')}/{funcionarioPagamento.folha.competenciaAno} - {funcionarioPagamento.folha.periodo}ª Quinzena
                                              </Text>
                                            </div>
                                          )}
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Valor Líquido
                                            </Text>
                                            <Text strong style={{ display: "block", marginTop: "4px", color: "#059669" }}>
                                              R$ {formatCurrency(Number(funcionarioPagamento.valorLiquido || 0))}
                                            </Text>
                                          </div>
                                        </Space>
                                      </div>
                                    )}
                                  </Space>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    },
                  }}
                    />
                  {/* Paginação */}
                  {paginacaoTurmaColheita.total > 0 && (
                    <div style={{
                      padding: isMobile ? "0.75rem" : "1rem",
                      borderTop: "1px solid #f0f0f0",
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 16
                    }}>
                      <Pagination
                        current={paginacaoTurmaColheita.page}
                        pageSize={paginacaoTurmaColheita.limit}
                        total={paginacaoTurmaColheita.total}
                        onChange={handlePageChangeTurmaColheita}
                        onShowSizeChange={handlePageChangeTurmaColheita}
                        showSizeChanger={!isMobile}
                        showTotal={(total, range) =>
                          isMobile
                            ? `${range[0]}-${range[1]}/${total}`
                            : `${range[0]}-${range[1]} de ${total} lotes`
                        }
                        pageSizeOptions={['10', '20', '50', '100']}
                        size={isMobile ? "small" : "default"}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Seção: Folha de Pagamento */}
      {(tipoOrigem === "TODOS" || tipoOrigem === "FOLHA_PAGAMENTO") && (
        <div style={{ marginBottom: 24 }}>
          <Card
            style={{
              margin: 0,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            headStyle={{
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
            }}
            title={
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  width: "100%",
                }}
                onClick={() => {
                  setActiveKeys(prev => 
                    prev.includes('folha-pagamento') 
                      ? prev.filter(k => k !== 'folha-pagamento')
                      : [...prev, 'folha-pagamento']
                  );
                }}
              >
                <Space>
                  <DollarOutlined style={{ color: "#ffffff", fontSize: "18px" }} />
                  <Text strong style={{ fontSize: isMobile ? "14px" : "16px", color: "#ffffff" }}>
                    Lotes de Pagamentos - Folha de Pagamento
                  </Text>
                </Space>
                <Space>
                  <Text style={{ fontSize: "11px", color: "#ffffff", opacity: 0.9 }}>
                    Clique para expandir/colapsar
                  </Text>
                  <RightOutlined 
                    rotate={activeKeys.includes('folha-pagamento') ? 90 : 0} 
                    style={{ 
                      color: "#ffffff", 
                      fontSize: "14px",
                      transition: "transform 0.3s",
                      marginLeft: "8px"
                    }} 
                  />
                </Space>
              </div>
            }
            bodyStyle={{ padding: "16px" }}
          >
            {/* Cards de Estatísticas */}
            <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Lotes</Text>}
                            value={estatisticasFolhaPagamento.totalLotes}
                            prefix={<FileTextOutlined style={{ color: "#059669", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Itens</Text>}
                            value={estatisticasFolhaPagamento.totalItens}
                            prefix={<ShoppingOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Funcionários</Text>}
                            value={estatisticasFolhaPagamento.totalFuncionarios}
                            prefix={<TeamOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Lotes Liberados</Text>}
                            value={estatisticasFolhaPagamento.lotesLiberados}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Itens Liberados</Text>}
                            value={estatisticasFolhaPagamento.itensLiberados}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Enviado</Text>}
                            value={formatCurrency(estatisticasFolhaPagamento.valorTotalEnviado)}
                            prefix={<DollarOutlined style={{ color: "#059669", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Validado</Text>}
                            value={formatCurrency(estatisticasFolhaPagamento.valorTotalValidado)}
                            prefix={<DollarOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card
                          style={{
                            borderRadius: "0.75rem",
                            boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                          }}
                          bodyStyle={{ padding: "0.75rem" }}
                        >
                          <Statistic
                            title={<Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Funcionários</Text>}
                            value={formatCurrency(estatisticasFolhaPagamento.valorTotalFuncionarios)}
                            prefix={<DollarOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                            valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
                          />
                        </Card>
                      </Col>
                    </Row>
            
            {/* Tabela - Visível apenas quando expandido */}
            {activeKeys.includes('folha-pagamento') && (
              <>
                <div style={{ marginTop: 16, borderTop: "1px solid #e8e8e8", paddingTop: 16 }}>
                  <style>
                    {`
                      .ant-table-expanded-row > td {
                        padding: 0 !important;
                        background-color: #f9f9f9 !important;
                      }
                      .ant-table-expanded-row > td > div {
                        margin: 0 !important;
                      }
                    `}
                  </style>
                  <ResponsiveTable
                    columns={getColumns('FOLHA_PAGAMENTO')}
                    dataSource={lotesFiltradosOrdenadosFolhaPagamento}
                    loading={loadingFolha}
                    rowKey="loteId"
                    minWidthMobile={1400}
                    showScrollHint={true}
                    expandable={{
                    expandIcon: ({ expanded, onExpand, record }) => {
                      const itens = record.itensPagamento || [];
                      if (itens.length === 0) return null;
                      
                      return (
                        <Button
                          type="text"
                          size="small"
                          icon={expanded ? <UpOutlined /> : <DownOutlined />}
                          onClick={(e) => onExpand(record, e)}
                          style={{
                            padding: "4px 8px",
                            height: "auto",
                            color: "#059669",
                          }}
                        />
                      );
                    },
                    expandedRowRender: (record) => {
                      const itens = record.itensPagamento || [];
                      
                      if (itens.length === 0) {
                        return (
                          <div style={{ 
                            padding: "12px 16px", 
                            backgroundColor: "#f9f9f9", 
                            margin: "0 -16px",
                            borderTop: "1px solid #e8e8e8"
                          }}>
                            <Text type="secondary">Nenhum item neste lote.</Text>
                          </div>
                        );
                      }

                      return (
                        <div style={{ 
                          padding: "12px 16px", 
                          backgroundColor: "#f9f9f9", 
                          margin: "0 -16px",
                          borderTop: "1px solid #e8e8e8"
                        }}>
                          <Text strong style={{ fontSize: "13px", color: "#059669", marginBottom: "10px", display: "block" }}>
                            Itens do Lote ({itens.length}):
                          </Text>
                          <div style={{ display: "grid", gap: "8px" }}>
                            {itens.map((item, index) => {
                              const funcionarioPagamento = item.funcionarioPagamento;
                              
                              return (
                                <Card
                                  key={item.id || index}
                                  size="small"
                                  style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "4px",
                                    boxShadow: "none",
                                  }}
                                  bodyStyle={{ padding: "10px" }}
                                >
                                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                      <Space size="middle" wrap>
                                        <div>
                                          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                            Código Pagamento
                                          </Text>
                                          <Tag color="blue" style={{ fontFamily: 'monospace', marginTop: "4px" }}>
                                            {item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento || '-'}
                                          </Tag>
                                        </div>
                                        <div>
                                          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                            Valor
                                          </Text>
                                          <Text strong style={{ display: "block", marginTop: "4px", color: "#059669" }}>
                                            R$ {formatCurrency(Number(item.valorEnviado || 0))}
                                          </Text>
                                        </div>
                                        {item.chavePixEnviada && (
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Chave PIX
                                            </Text>
                                            <Text style={{ display: "block", marginTop: "4px", fontSize: "11px" }}>
                                              {item.chavePixEnviada}
                                            </Text>
                                          </div>
                                        )}
                                      </Space>
                                    </div>
                                    
                                    {/* Mostrar funcionário */}
                                    {funcionarioPagamento && (
                                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e8e8e8" }}>
                                        <Space size="middle" wrap>
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Funcionário
                                            </Text>
                                            <Text strong style={{ display: "block", marginTop: "4px" }}>
                                              {funcionarioPagamento.funcionario?.nome || '-'}
                                            </Text>
                                          </div>
                                          {funcionarioPagamento.funcionario?.cpf && (
                                            <div>
                                              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                                CPF
                                              </Text>
                                              <Text style={{ display: "block", marginTop: "4px" }}>
                                                {formatarCPF(funcionarioPagamento.funcionario.cpf)}
                                              </Text>
                                            </div>
                                          )}
                                          {funcionarioPagamento.folha && (
                                            <div>
                                              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                                Folha
                                              </Text>
                                              <Text style={{ display: "block", marginTop: "4px" }}>
                                                {String(funcionarioPagamento.folha.competenciaMes).padStart(2, '0')}/{funcionarioPagamento.folha.competenciaAno} - {funcionarioPagamento.folha.periodo}ª Quinzena
                                              </Text>
                                            </div>
                                          )}
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Valor Líquido
                                            </Text>
                                            <Text strong style={{ display: "block", marginTop: "4px", color: "#059669" }}>
                                              R$ {formatCurrency(Number(funcionarioPagamento.valorLiquido || 0))}
                                            </Text>
                                          </div>
                                          {funcionarioPagamento.statusPagamento && (
                                            <div>
                                              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                                Status
                                              </Text>
                                              <Tag 
                                                color={funcionarioPagamento.statusPagamento === 'PAGO' ? 'green' : funcionarioPagamento.statusPagamento === 'REJEITADO' ? 'red' : 'gold'}
                                                style={{ marginTop: "4px" }}
                                              >
                                                {funcionarioPagamento.statusPagamento}
                                              </Tag>
                                            </div>
                                          )}
                                        </Space>
                                      </div>
                                    )}
                                  </Space>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    },
                    }}
                  />
                  {/* Paginação */}
                  {paginacaoFolhaPagamento.total > 0 && (
                    <div style={{
                      padding: isMobile ? "0.75rem" : "1rem",
                      borderTop: "1px solid #f0f0f0",
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 16
                    }}>
                      <Pagination
                        current={paginacaoFolhaPagamento.page}
                        pageSize={paginacaoFolhaPagamento.limit}
                        total={paginacaoFolhaPagamento.total}
                        onChange={handlePageChangeFolhaPagamento}
                        onShowSizeChange={handlePageChangeFolhaPagamento}
                        showSizeChanger={!isMobile}
                        showTotal={(total, range) =>
                          isMobile
                            ? `${range[0]}-${range[1]}/${total}`
                            : `${range[0]}-${range[1]} de ${total} lotes`
                        }
                        pageSizeOptions={['10', '20', '50', '100']}
                        size={isMobile ? "small" : "default"}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
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
          if (dateRange && dateRange.length === 2) {
            const inicio = dateRange[0]
              ? moment(dateRange[0]).startOf("day").toISOString()
              : null;
            const fim = dateRange[1]
              ? moment(dateRange[1]).endOf("day").toISOString()
              : null;
            fetchLotesTurmaColheita(inicio, fim);
            fetchLotesFolhaPagamento(inicio, fim);
          } else {
            fetchLotesTurmaColheita();
            fetchLotesFolhaPagamento();
          }
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
          if (dateRange && dateRange.length === 2) {
            const inicio = dateRange[0]
              ? moment(dateRange[0]).startOf("day").toISOString()
              : null;
            const fim = dateRange[1]
              ? moment(dateRange[1]).endOf("day").toISOString()
              : null;
            fetchLotesTurmaColheita(inicio, fim);
            fetchLotesFolhaPagamento(inicio, fim);
          } else {
            fetchLotesTurmaColheita();
            fetchLotesFolhaPagamento();
          }
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
          if (dateRange && dateRange.length === 2) {
            const inicio = dateRange[0]
              ? moment(dateRange[0]).startOf("day").toISOString()
              : null;
            const fim = dateRange[1]
              ? moment(dateRange[1]).endOf("day").toISOString()
              : null;
            fetchLotesTurmaColheita(inicio, fim);
            fetchLotesFolhaPagamento(inicio, fim);
          } else {
            fetchLotesTurmaColheita();
            fetchLotesFolhaPagamento();
          }
        }}
        identificadorPagamento={itemSelecionado?.identificadorPagamento}
        contaCorrenteId={itemSelecionado?.contaCorrenteId}
      />
    </Box>
  );
};

export default Pagamentos;


