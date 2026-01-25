// src/components/pedidos/PagamentosAutomaticosModal.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Table, Space, Typography, Tag, Button, Row, Col, Card, Statistic, Empty, Spin, DatePicker, Select, Divider, Tooltip } from "antd";
import {
  DollarOutlined,
  FilterOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  BankOutlined,
  UpOutlined,
  DownOutlined,
  LinkOutlined,
  UserOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import SearchInputLocalChips from "../common/search/SearchInputLocalChips";
import { formatCurrency, capitalizeName, formatarDataBR, formatarCPF, formatarCNPJ } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import VincularPagamentoManualModal from "../clientes/VincularPagamentoManualModal";
import VisualizarPedidoModal from "./VisualizarPedidoModal";
import VisualizarVinculosLancamentoModal from "./VisualizarVinculosLancamentoModal";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import InfoAlertModal from "../common/modals/InfoAlertModal";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_VINCULACAO = [
  "PRECIFICACAO_REALIZADA",
  "AGUARDANDO_PAGAMENTO",
  "PAGAMENTO_PARCIAL",
  "PAGAMENTO_REALIZADO",
  "PEDIDO_FINALIZADO",
];

const STATUS_PEDIDOS_FINALIZADOS = ["PAGAMENTO_REALIZADO", "PEDIDO_FINALIZADO"];

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const onlyDigits = (value) => (value ? value.toString().replace(/\D/g, "") : "");

const PagamentosAutomaticosModal = ({ open, onClose, loading = false }) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();
  const [pagamentos, setPagamentos] = useState([]);
  const [pagamentosFiltrados, setPagamentosFiltrados] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [vinculadoFilter, setVinculadoFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [contaCorrenteFilter, setContaCorrenteFilter] = useState(null);
  
  // ✅ Busca local com chips (sem chamadas extras)
  const [buscaValue, setBuscaValue] = useState("");
  // filtrosBusca: [{ type: 'cliente', clienteId, label }, { type: 'origem', origemKey, label }]
  const [filtrosBusca, setFiltrosBusca] = useState([]);

  // Estados para busca na API
  const [contasDisponiveis, setContasDisponiveis] = useState([]);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [rangeBuscaAPI, setRangeBuscaAPI] = useState(null);
  const [buscandoAPI, setBuscandoAPI] = useState(false);
  const [loadingContas, setLoadingContas] = useState(false);
  const [buscaAPIVisivel, setBuscaAPIVisivel] = useState(false);

  // Estados para vinculação manual
  const [vinculacaoModalOpen, setVinculacaoModalOpen] = useState(false);
  const [lancamentoParaVincular, setLancamentoParaVincular] = useState(null);
  const [pedidosVinculacao, setPedidosVinculacao] = useState([]);
  const [loadingPedidosVinculacao, setLoadingPedidosVinculacao] = useState(false);

  // Estados para visualização de pedido
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [loadingPedido, setLoadingPedido] = useState(false);

  // Modal de vínculos
  const [vinculosModalOpen, setVinculosModalOpen] = useState(false);
  const [lancamentoVinculos, setLancamentoVinculos] = useState(null);

  // Modal de confirmação de exclusão
  const [confirmExclusaoOpen, setConfirmExclusaoOpen] = useState(false);
  const [lancamentoParaExcluir, setLancamentoParaExcluir] = useState(null);

  // Modal de resultado da busca na API
  const [resultadoBuscaModalOpen, setResultadoBuscaModalOpen] = useState(false);
  const [resultadoBuscaSummary, setResultadoBuscaSummary] = useState(null);

  const TOLERANCIA_SALDO = 0.009;

  // Estatísticas gerais
  const [estatisticas, setEstatisticas] = useState({
    totalPagamentos: 0,
    valorTotal: 0,
    vinculados: 0,
    naoVinculados: 0,
    valorVinculado: 0,
    valorNaoVinculado: 0,
  });

  // Carregar TODOS os pagamentos (sem filtro de cliente inicial)
  const fetchPagamentos = useCallback(async (clienteId = null) => {
    setLoadingPagamentos(true);
    try {
      const params = new URLSearchParams();
      if (clienteId) {
        params.append('clienteId', clienteId);
      }

      const response = await axiosInstance.get(`/api/lancamentos-extrato?${params.toString()}`);
      
      let pagamentosData = [];
      
      try {
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            pagamentosData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            pagamentosData = response.data.data;
          } else {
            pagamentosData = [];
          }
        }
      } catch (parseError) {
        console.warn("Erro ao processar resposta da API:", parseError);
        pagamentosData = [];
      }
      
      if (!Array.isArray(pagamentosData)) {
        pagamentosData = [];
      }

      setPagamentos(pagamentosData);
      setPagamentosFiltrados(pagamentosData);

      // Calcular estatísticas
      const stats = calcularEstatisticas(pagamentosData);
      setEstatisticas(stats);
      
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      showNotification("error", "Erro", "Erro ao carregar pagamentos");
      setPagamentos([]);
      setPagamentosFiltrados([]);
      setEstatisticas({
        totalPagamentos: 0,
        valorTotal: 0,
        vinculados: 0,
        naoVinculados: 0,
        valorVinculado: 0,
        valorNaoVinculado: 0,
      });
    } finally {
      setLoadingPagamentos(false);
    }
  }, []);

  // Index local de clientes (id -> dados) derivado dos lançamentos já carregados
  const clientesById = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(pagamentos)) return map;
    pagamentos.forEach((p) => {
      const c = p?.cliente;
      if (c?.id) {
        if (!map.has(c.id)) {
          map.set(c.id, {
            id: c.id,
            nome: c.nome || "",
            cpf: c.cpf || "",
            cnpj: c.cnpj || "",
          });
        }
      }
    });
    return map;
  }, [pagamentos]);

  const clienteSuggestionItems = useMemo(() => {
    const items = Array.from(clientesById.values()).map((c) => {
      const cpfDigits = onlyDigits(c.cpf);
      const cnpjDigits = onlyDigits(c.cnpj);
      const documentoLabel = cnpjDigits
        ? `CNPJ: ${formatarCNPJ(cnpjDigits)}`
        : cpfDigits
          ? `CPF: ${formatarCPF(cpfDigits)}`
          : "";

      return {
        key: `cliente-${c.id}`,
        type: "cliente",
        value: capitalizeName(c.nome || "Cliente"),
        icon: "👤",
        description: documentoLabel || "Sem CPF/CNPJ",
        metadata: {
          clienteId: c.id,
          cpf: cpfDigits,
          cnpj: cnpjDigits,
          nome: c.nome || "",
        },
        searchText: `${c.nome || ""} ${cpfDigits} ${cnpjDigits}`,
      };
    });

    items.sort((a, b) => (a.value || "").localeCompare(b.value || "", "pt-BR"));
    return items;
  }, [clientesById]);

  const origemSuggestionItems = useMemo(() => {
    if (!Array.isArray(pagamentos)) return [];
    const map = new Map(); // origemKey -> { label, count }

    pagamentos.forEach((p) => {
      const origem = (p?.nomeContrapartida || "").toString().trim();
      if (!origem) return;
      const origemKey = normalizeText(origem);
      if (!origemKey) return;

      if (!map.has(origemKey)) {
        map.set(origemKey, { origemKey, label: origem, count: 1 });
      } else {
        const current = map.get(origemKey);
        current.count += 1;
      }
    });

    const items = Array.from(map.values()).map((o) => ({
      key: `origem-${o.origemKey}`,
      type: "origem",
      value: capitalizeName(o.label),
      icon: "🏢",
      description: `${o.count} lançamento${o.count > 1 ? "s" : ""}`,
      metadata: { origemKey: o.origemKey, origem: o.label, count: o.count },
      searchText: o.label,
    }));

    // Mais frequentes primeiro
    items.sort((a, b) => (b.metadata?.count || 0) - (a.metadata?.count || 0));
    return items;
  }, [pagamentos]);

  const handleSelectClienteLocal = useCallback((item) => {
    const clienteId = item?.metadata?.clienteId;
    if (!clienteId) return;

    setFiltrosBusca((prev) => {
      const exists = prev.some((f) => f.type === "cliente" && f.clienteId === clienteId);
      if (exists) {
        showNotification("info", "Cliente já selecionado", "Este cliente já está nos filtros.");
        return prev;
      }
      const novo = {
        type: "cliente",
        clienteId,
        label: item?.value || "Cliente",
      };
      return [...prev, novo];
    });

    setBuscaValue("");
  }, []);

  const handleSelectOrigemLocal = useCallback((item) => {
    const origemKey = item?.metadata?.origemKey || normalizeText(item?.value);
    const label = item?.value || item?.metadata?.origem || "";
    if (!origemKey || !label) return;

    setFiltrosBusca((prev) => {
      const exists = prev.some((f) => f.type === "origem" && f.origemKey === origemKey);
      if (exists) {
        showNotification("info", "Origem já selecionada", "Esta origem já está nos filtros.");
        return prev;
      }
      const novo = {
        type: "origem",
        origemKey,
        label,
      };
      return [...prev, novo];
    });

    setBuscaValue("");
  }, []);

  const buscaSuggestionItems = useMemo(() => {
    // Unificar sugestões: cliente + origem (mesmo input)
    const clientes = Array.isArray(clienteSuggestionItems) ? clienteSuggestionItems : [];
    const origens = Array.isArray(origemSuggestionItems) ? origemSuggestionItems : [];

    const clientesComDescricao = clientes.map((c) => ({
      ...c,
      description: c?.description ? `Cliente • ${c.description}` : "Cliente",
    }));

    const origensComDescricao = origens.map((o) => ({
      ...o,
      description: o?.description ? `Origem • ${o.description}` : "Origem",
    }));

    return [...clientesComDescricao, ...origensComDescricao];
  }, [clienteSuggestionItems, origemSuggestionItems]);

  const handleSelectBuscaLocal = useCallback((item) => {
    if (!item?.type) return;
    if (item.type === "cliente") return handleSelectClienteLocal(item);
    if (item.type === "origem") return handleSelectOrigemLocal(item);
  }, [handleSelectClienteLocal, handleSelectOrigemLocal]);

  const handleRemoverFiltroBusca = useCallback((index) => {
    setFiltrosBusca((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Calcular estatísticas dos pagamentos
  const calcularEstatisticas = (pagamentos) => {
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return {
        totalPagamentos: 0,
        valorTotal: 0,
        vinculados: 0,
        naoVinculados: 0,
        valorVinculado: 0,
        valorNaoVinculado: 0,
      };
    }

    const totalPagamentos = pagamentos.length;
    const valorTotal = pagamentos.reduce((total, p) => total + (Number(p.valorLancamento) || 0), 0);
    const vinculados = pagamentos.filter(p => p.vinculadoPedido === true).length;
    const naoVinculados = pagamentos.filter(p => p.vinculadoPedido === false).length;
    const valorVinculado = pagamentos
      .filter(p => p.vinculadoPedido === true)
      .reduce((total, p) => total + (Number(p.valorLancamento) || 0), 0);
    const valorNaoVinculado = pagamentos
      .filter(p => p.vinculadoPedido === false)
      .reduce((total, p) => total + (Number(p.valorLancamento) || 0), 0);

    return {
      totalPagamentos,
      valorTotal,
      vinculados,
      naoVinculados,
      valorVinculado,
      valorNaoVinculado,
    };
  };

  // Filtrar pagamentos
  const filtrarPagamentos = useCallback(() => {
    if (!Array.isArray(pagamentos)) {
      setPagamentosFiltrados([]);
      return;
    }
    
    if (pagamentos.length === 0) {
      setPagamentosFiltrados([]);
      return;
    }
    
    let pagamentosFiltrados = [...pagamentos];

    const clientesSelecionados = filtrosBusca.filter((f) => f.type === "cliente").map((f) => f.clienteId);
    const origensSelecionadas = filtrosBusca.filter((f) => f.type === "origem").map((f) => f.origemKey);

    // Aplicar filtro de cliente (OR lógico entre clientes)
    if (clientesSelecionados.length > 0) {
      const clientesSet = new Set(clientesSelecionados);
      pagamentosFiltrados = pagamentosFiltrados.filter((p) => {
        const clienteIdPagamento =
          p?.clienteId ||
          p?.cliente?.id ||
          p?.pedido?.clienteId ||
          null;
        if (!clienteIdPagamento) return false;
        return clientesSet.has(clienteIdPagamento);
      });
    }

    // Aplicar filtro de origem (OR lógico entre origens)
    if (origensSelecionadas.length > 0) {
      const origensSet = new Set(origensSelecionadas);
      pagamentosFiltrados = pagamentosFiltrados.filter((p) => {
        const origemKey = normalizeText((p?.nomeContrapartida || "").toString().trim());
        if (!origemKey) return false;
        return origensSet.has(origemKey);
      });
    }


    // Aplicar filtro de categoria
    if (categoriaFilter) {
      pagamentosFiltrados = pagamentosFiltrados.filter(p => p.categoriaOperacao === categoriaFilter);
    }

    // Aplicar filtro de vinculado
    if (vinculadoFilter !== "") {
      const isVinculado = vinculadoFilter === "true";
      pagamentosFiltrados = pagamentosFiltrados.filter(p => p.vinculadoPedido === isVinculado);
    }

    // Aplicar filtro de conta-corrente
    if (contaCorrenteFilter) {
      pagamentosFiltrados = pagamentosFiltrados.filter(p => {
        // Converter ambos para número para garantir comparação correta
        const pContaId = p.contaCorrenteId ? Number(p.contaCorrenteId) : null;
        const filterContaId = Number(contaCorrenteFilter);
        return pContaId === filterContaId;
      });
    }

    // Aplicar filtro de data
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      
      pagamentosFiltrados = pagamentosFiltrados.filter(pagamento => {
        const dataLancamento = moment(pagamento.dataLancamento);
        const dataLancamentoOnly = dataLancamento.format('YYYY-MM-DD');
        const startDateOnly = startDate.format('YYYY-MM-DD');
        const endDateOnly = endDate.format('YYYY-MM-DD');
        
        return dataLancamentoOnly >= startDateOnly && dataLancamentoOnly <= endDateOnly;
      });
    }

    setPagamentosFiltrados(pagamentosFiltrados);
  }, [pagamentos, filtrosBusca, categoriaFilter, vinculadoFilter, contaCorrenteFilter, dateRange]);

  // Carregar contas disponíveis
  const fetchContasDisponiveis = useCallback(async () => {
    setLoadingContas(true);
    try {
      const response = await axiosInstance.get('/api/lancamentos-extrato/contas-disponiveis');
      setContasDisponiveis(response.data || []);
      if (response.data && response.data.length > 0) {
        setContaSelecionada(response.data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar contas disponíveis:', error);
      showNotification('error', 'Erro', 'Erro ao carregar contas correntes disponíveis');
    } finally {
      setLoadingContas(false);
    }
  }, []);

  // Carregar contas para filtro (mesmas contas disponíveis)
  useEffect(() => {
    if (open && contasDisponiveis.length === 0) {
      fetchContasDisponiveis();
    }
  }, [open, fetchContasDisponiveis, contasDisponiveis.length]);

  // Buscar e processar extratos na API para TODOS os clientes com CPF/CNPJ
  const buscarNaAPI = useCallback(async () => {
    if (!rangeBuscaAPI || !rangeBuscaAPI[0] || !rangeBuscaAPI[1]) {
      showNotification('warning', 'Atenção', 'Selecione o período de busca');
      return;
    }

    if (!contaSelecionada) {
      showNotification('warning', 'Atenção', 'Selecione uma conta corrente');
      return;
    }

    setBuscandoAPI(true);
    try {
      const dataInicio = rangeBuscaAPI[0].format('DDMMYYYY');
      const dataFim = rangeBuscaAPI[1].format('DDMMYYYY');

      // Usar o novo endpoint que busca para TODOS os clientes com CPF/CNPJ
      const payload = {
        dataInicio,
        dataFim,
        contaCorrenteId: contaSelecionada,
      };

      const response = await axiosInstance.post('/api/lancamentos-extrato/buscar-processar-todos-clientes', payload);

      const {
        totalSalvos = 0,
        totalDuplicados = 0,
        totalFiltrados = 0,
        totalComClienteIdentificado = 0,
        totalSemClienteIdentificado = 0,
        totalSalvosComClienteIdentificado = 0,
        totalSalvosSemClienteIdentificado = 0,
        clientes: clientesComLancamentos = [],
        periodo = null,
        contaCorrente: contaCorrenteInfo = null,
      } = response.data || {};

      const totalClientes = Array.isArray(clientesComLancamentos) ? clientesComLancamentos.length : 0;

      // Preparar summary para o modal de resultado
      // Formatar período se existir (backend retorna DDMMYYYY)
      let periodoFormatado = null;
      if (periodo && periodo.inicio && periodo.fim) {
        try {
          const inicioMoment = moment(periodo.inicio, 'DDMMYYYY');
          const fimMoment = moment(periodo.fim, 'DDMMYYYY');
          if (inicioMoment.isValid() && fimMoment.isValid()) {
            periodoFormatado = {
              inicio: inicioMoment.format('DD/MM/YYYY'),
              fim: fimMoment.format('DD/MM/YYYY'),
            };
          }
        } catch (error) {
          console.warn('Erro ao formatar período:', error);
        }
      }

      const summary = {
        totalFiltrados,
        totalSalvos,
        totalSalvosComClienteIdentificado,
        totalSalvosSemClienteIdentificado,
        totalDuplicados,
        totalSemClienteIdentificado,
        totalClientes,
        clientes: clientesComLancamentos,
        periodo: periodoFormatado,
        contaCorrente: contaCorrenteInfo ? {
          agencia: contaCorrenteInfo.agencia || '',
          conta: contaCorrenteInfo.conta || '',
        } : null,
      };

      // Abrir modal de resultado
      setResultadoBuscaSummary(summary);
      setResultadoBuscaModalOpen(true);

      // Recarregar pagamentos após buscar (buscar todos, o filtro será aplicado no frontend)
      await fetchPagamentos();

      // Limpar range de busca
      setRangeBuscaAPI(null);
    } catch (error) {
      console.error('Erro ao buscar extratos na API:', error);
      const mensagem = error.response?.data?.message || 'Erro ao buscar extratos na API';
      showNotification('error', 'Erro', mensagem);
    } finally {
      setBuscandoAPI(false);
    }
  }, [rangeBuscaAPI, contaSelecionada, fetchPagamentos]);

  // ✅ Busca/seleção de cliente/origem agora é local (sem SearchInputInteligente)

  // Função para buscar pedido atualizado do banco
  const buscarPedidoAtualizado = async (pedidoId) => {
    try {
      const response = await axiosInstance.get(`/api/pedidos/${pedidoId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      showNotification("error", "Erro", "Erro ao carregar dados atualizados do pedido");
      return null;
    }
  };

  // Função auxiliar para carregar pedidos elegíveis para vinculação
  const carregarPedidosParaLancamento = useCallback(async (lancamento, clienteRelacionado) => {
    setLoadingPedidosVinculacao(true);
    try {
      const statusCliente = STATUS_VINCULACAO.join(",");
      const paramsBase = { status: statusCliente };
      const clienteId = clienteRelacionado?.id
        || lancamento?.cliente?.id
        || lancamento?.clienteId
        || lancamento?.pedido?.clienteId
        || null;

      let response;
      if (clienteId) {
        response = await axiosInstance.get(`/api/pedidos/cliente/${clienteId}`, {
          params: paramsBase,
        });
      } else {
        response = await axiosInstance.get(`/api/pedidos`, {
          params: {
            status: STATUS_VINCULACAO.join(","),
            page: 1,
            limit: 1000,
          },
        });
      }

      const pedidosResposta = response?.data;
      let pedidosArray = Array.isArray(pedidosResposta)
        ? pedidosResposta
        : Array.isArray(pedidosResposta?.data)
          ? pedidosResposta.data
          : [];

      if (!Array.isArray(pedidosArray)) {
        pedidosArray = [];
      }

      const clienteDefault = clienteRelacionado || lancamento?.cliente || lancamento?.pedido?.cliente || null;

      const pedidosNormalizados = pedidosArray
        .map((pedido) => ({
          ...pedido,
          cliente: pedido.cliente || clienteDefault,
        }))
        .filter(Boolean);

      setPedidosVinculacao(pedidosNormalizados);
    } catch (error) {
      console.error('Erro ao carregar pedidos para vinculação:', error);
      setPedidosVinculacao([]);
      showNotification('error', 'Erro', 'Não foi possível carregar pedidos para vinculação');
    } finally {
      setLoadingPedidosVinculacao(false);
    }
  }, [showNotification]);

  // Função para abrir modal de visualização de pedido
  const handleOpenVisualizarPedido = async (pedido) => {
    setVisualizarModalOpen(true);
    setPedidoSelecionado(null);
    setLoadingPedido(true);
    try {
      const pedidoAtualizado = await buscarPedidoAtualizado(pedido.id);
      if (pedidoAtualizado) {
        setPedidoSelecionado(pedidoAtualizado);
      } else {
        setVisualizarModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao abrir visualização de pedido:", error);
      setVisualizarModalOpen(false);
    } finally {
      setLoadingPedido(false);
    }
  };

  const handleAbrirModalVinculos = (lancamento) => {
    if (!lancamento?.id) {
      showNotification('info', 'Sem vínculos', 'Este lançamento ainda não possui pedidos vinculados.');
      return;
    }
    setLancamentoVinculos(lancamento);
    setVinculosModalOpen(true);
  };

  // Handler para abrir modal de vinculação manual
  const handleAbrirVinculacaoManual = (lancamento) => {
    let clienteDoLancamento = null;

    if (lancamento.cliente) {
      clienteDoLancamento = lancamento.cliente;
    } else if (lancamento.clienteId) {
      const clienteLocal = clientesById.get(lancamento.clienteId);
      if (clienteLocal) clienteDoLancamento = clienteLocal;
    } else if (lancamento.pedido?.cliente) {
      clienteDoLancamento = lancamento.pedido.cliente;
    }

    setLancamentoParaVincular(lancamento);
    setPedidosVinculacao([]);
    setVinculacaoModalOpen(true);
    carregarPedidosParaLancamento(lancamento, clienteDoLancamento);
  };

  // Handler para abrir modal de confirmação de exclusão
  const handleAbrirConfirmExclusao = (lancamento) => {
    setLancamentoParaExcluir(lancamento);
    setConfirmExclusaoOpen(true);
  };

  // Handler para confirmar e excluir lançamento
  const handleConfirmarExclusao = async () => {
    if (!lancamentoParaExcluir?.id) return;

    try {
      setLoadingPagamentos(true);
      await axiosInstance.delete(`/api/lancamentos-extrato/${lancamentoParaExcluir.id}`);
      showNotification('success', 'Sucesso', 'Lançamento excluído com sucesso');
      // Recarregar lista de lançamentos
      await fetchPagamentos();
      setConfirmExclusaoOpen(false);
      setLancamentoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      const message = error.response?.data?.message || 'Erro ao excluir lançamento';
      showNotification('error', 'Erro', message);
    } finally {
      setLoadingPagamentos(false);
    }
  };

  // Handler para executar vinculação
  const handleVincularPagamento = async (lancamento, itensSelecionados) => {
    if (!Array.isArray(itensSelecionados) || itensSelecionados.length === 0) {
      showNotification('warning', 'Atenção', 'Selecione pelo menos um pedido para vincular');
      return;
    }

    try {
      setLoadingPagamentos(true);

      // 1. Vincular lançamento aos pedidos selecionados
      const payload = {
        itens: itensSelecionados.map((item) => ({
          pedidoId: item.pedidoId,
          valorVinculado: item.valorVinculado,
        })),
      };

      const vinculacaoResponse = await axiosInstance.post(
        `/api/lancamentos-extrato/${lancamento.id}/vinculos`,
        payload
      );

      const vinculosCriados = vinculacaoResponse?.data?.vinculosCriados || [];
      const vinculosPorPedido = new Map(
        vinculosCriados.map((vinculo) => [vinculo.pedidoId, vinculo.id])
      );

      // 2. Criar pagamentos na tabela PagamentosPedidos para cada vínculo
      const metodoPagamento = lancamento.categoriaOperacao === 'PIX_RECEBIDO'
        ? 'PIX'
        : lancamento.categoriaOperacao === 'PIX_ENVIADO'
          ? 'PIX'
          : 'TRANSFERENCIA';

      const dataPagamentoBase = moment(lancamento.dataLancamento)
        .startOf('day')
        .add(12, 'hours')
        .format('YYYY-MM-DD HH:mm:ss');

      const pedidosSomenteVinculo = [];

      // Criar um pagamento para cada pedido selecionado que não esteja finalizado
      for (const item of itensSelecionados) {
        const pedidoReferencia = item.pedido;
        const statusPedido = (pedidoReferencia?.status || '').toUpperCase();
        const deveCriarPagamento = !STATUS_PEDIDOS_FINALIZADOS.includes(statusPedido);

        if (deveCriarPagamento) {
          const pagamentoData = {
            pedidoId: item.pedidoId,
            dataPagamento: dataPagamentoBase,
            valorRecebido: item.valorVinculado,
            metodoPagamento,
            contaDestino: 'ALENCAR',
            observacoesPagamento: `Vinculado do extrato bancário - ${lancamento.textoDescricaoHistorico || 'Sem descrição'}`,
          };

          const vinculoId = vinculosPorPedido.get(item.pedidoId);
          if (vinculoId) {
            pagamentoData.lancamentoExtratoPedidoId = vinculoId;
          }

          await axiosInstance.post('/api/pedidos/pagamentos', pagamentoData);

          showNotification(
            'success',
            'Pagamento vinculado',
            `Pagamento de ${formatCurrency(item.valorVinculado)} vinculado ao pedido ${pedidoReferencia?.numeroPedido || item.pedidoId}`
          );
        } else {
          pedidosSomenteVinculo.push(`#${pedidoReferencia?.numeroPedido || item.pedidoId}`);
        }
      }

      if (pedidosSomenteVinculo.length > 0) {
        const descricao = pedidosSomenteVinculo.join(', ');
        showNotification(
          'info',
          'Vínculo registrado',
          `Os pedidos ${descricao} já estão quitados; registramos apenas o vínculo ao lançamento.`
        );
      }

      // Recarregar lista de lançamentos (buscar todos, o filtro será aplicado no frontend)
      await fetchPagamentos();

      setVinculacaoModalOpen(false);
      setLancamentoParaVincular(null);
      setPedidosVinculacao([]);
    } catch (error) {
      console.error('Erro ao vincular pagamento:', error);
      const message = error.response?.data?.message || 'Erro ao vincular pagamento ao pedido';
      showNotification('error', 'Erro', message);
      throw error;
    } finally {
      setLoadingPagamentos(false);
    }
  };

  // Efeito para carregar pagamentos quando o modal abrir
  useEffect(() => {
    if (open) {
      fetchPagamentos();
      fetchContasDisponiveis();
    }
  }, [open, fetchPagamentos, fetchContasDisponiveis]);

  // Efeito para limpar estados quando o modal fechar
  useEffect(() => {
    if (!open) {
      setCategoriaFilter("");
      setVinculadoFilter("");
      setDateRange(null);
      setContaCorrenteFilter(null);
      setBuscaValue("");
      setFiltrosBusca([]);
      setPagamentos([]);
      setPagamentosFiltrados([]);
      setEstatisticas({
        totalPagamentos: 0,
        valorTotal: 0,
        vinculados: 0,
        naoVinculados: 0,
        valorVinculado: 0,
        valorNaoVinculado: 0,
      });
      setRangeBuscaAPI(null);
      setContaSelecionada(null);
      setContasDisponiveis([]);
      setBuscaAPIVisivel(false);
      setVisualizarModalOpen(false);
      setPedidoSelecionado(null);
      setLoadingPedido(false);
      setPedidosVinculacao([]);
      setLoadingPedidosVinculacao(false);
      setVinculosModalOpen(false);
      setLancamentoVinculos(null);
      setConfirmExclusaoOpen(false);
      setLancamentoParaExcluir(null);
      setResultadoBuscaModalOpen(false);
      setResultadoBuscaSummary(null);
    }
  }, [open]);

  // Efeito para filtrar quando os filtros mudarem
  useEffect(() => {
    filtrarPagamentos();
  }, [filtrarPagamentos]);

  // Função para formatar valor
  const formatarValor = (valor) => {
    return `R$ ${formatCurrency(valor || 0)}`;
  };

  // Função para formatar status de vinculação
  const formatarStatusVinculacao = (vinculado, automatico) => {
    if (vinculado) {
      return (
        <Tag
          color={automatico ? "#52c41a" : "#1890ff"}
          style={{
            borderRadius: "4px",
            fontWeight: "500",
            fontSize: "12px",
            border: "none",
          }}
        >
          {automatico ? "Vinculado (Auto)" : "Vinculado (Manual)"}
        </Tag>
      );
    }
    return (
      <Tag
        color="#ff9800"
        style={{
          borderRadius: "4px",
          fontWeight: "500",
          fontSize: "12px",
          border: "none",
        }}
      >
        Não Vinculado
      </Tag>
    );
  };

  // Função para formatar categoria
  const formatarCategoria = (categoria) => {
    if (!categoria) return "-";
    
    const categoriaConfig = {
      PIX_RECEBIDO: { texto: "PIX Recebido", cor: "#059669" },
      PIX_ENVIADO: { texto: "PIX Enviado", cor: "#ef4444" },
      TRANSFERENCIA: { texto: "Transferência", cor: "#3b82f6" },
    };

    const config = categoriaConfig[categoria] || { texto: categoria, cor: "#6b7280" };
    return (
      <Tag
        color={config.cor}
        style={{
          borderRadius: "4px",
          fontWeight: "500",
          fontSize: "12px",
          border: "none",
        }}
      >
        {config.texto}
      </Tag>
    );
  };

  const obterSaldoRestante = (lancamento) => {
    const saldoDireto = lancamento?.valorDisponivel ?? lancamento?.saldoRestante ?? lancamento?.saldo_restante;
    if (saldoDireto !== undefined && saldoDireto !== null) {
      return Number(saldoDireto);
    }

    const valorLancamento = Number(lancamento?.valorLancamento || 0);
    const valorVinculadoTotal = Number(
      lancamento?.valorVinculadoTotal ??
      (Array.isArray(lancamento?.lancamentosExtratoVinculos)
        ? lancamento.lancamentosExtratoVinculos.reduce((acc, vinculo) => acc + (Number(vinculo?.valorVinculado) || 0), 0)
        : 0)
    );

    return Number((valorLancamento - valorVinculadoTotal).toFixed(2));
  };

  // Obter categorias únicas para o filtro
  const categoriasUnicas = Array.from(
    new Set(pagamentos.map(p => p.categoriaOperacao).filter(Boolean))
  );

  // Definição das colunas da tabela
  const columns = [
    {
      title: "Data",
      dataIndex: "dataLancamento",
      key: "dataLancamento",
      render: (data) => (
        <Space>
          <CalendarOutlined style={{ color: "#059669", fontSize: "0.75rem" }} />
          <Text style={{ fontSize: "0.75rem" }}>{formatarDataBR(data)}</Text>
        </Space>
      ),
      width: "10%",
      sorter: (a, b) => new Date(a.dataLancamento) - new Date(b.dataLancamento),
    },
    {
      title: "Valor",
      dataIndex: "valorLancamento",
      key: "valorLancamento",
      render: (valor) => (
        <Space>
          <DollarOutlined style={{ color: "#059669", fontSize: "0.75rem" }} />
          <Text strong style={{ color: "#333", fontSize: "0.875rem" }}>
            {formatarValor(valor)}
          </Text>
        </Space>
      ),
      width: "12%",
      sorter: (a, b) => (Number(a.valorLancamento) || 0) - (Number(b.valorLancamento) || 0),
    },
    {
      title: "Categoria",
      dataIndex: "categoriaOperacao",
      key: "categoriaOperacao",
      render: (categoria) => formatarCategoria(categoria),
      width: "10%",
    },
    {
      title: "Descrição",
      dataIndex: "textoDescricaoHistorico",
      key: "textoDescricaoHistorico",
      render: (text) => (
        <Text 
          style={{ fontSize: "0.75rem", color: "#666" }}
          ellipsis={{ tooltip: text || "-" }}
        >
          {text || "-"}
        </Text>
      ),
      width: "12%",
      ellipsis: true,
    },
    {
      title: "Origem",
      dataIndex: "nomeContrapartida",
      key: "nomeContrapartida",
      render: (nome) => (
        <Text 
          style={{ fontSize: "0.75rem", color: "#333" }}
          ellipsis={{ tooltip: nome ? capitalizeName(nome) : "-" }}
        >
          {nome ? capitalizeName(nome) : "-"}
        </Text>
      ),
      width: "11%",
      ellipsis: true,
    },
    {
      title: "Conta Corrente",
      key: "contaCorrente",
      render: (_, record) => (
        <Text style={{ fontSize: "0.75rem", color: "#333" }}>
          {record.agenciaConta && record.numeroConta
            ? `${record.agenciaConta}/${record.numeroConta}`
            : "-"}
        </Text>
      ),
      width: "9%",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => formatarStatusVinculacao(record.vinculadoPedido, record.vinculacaoAutomatica),
      width: "11%",
    },
    {
      title: "Pedido",
      key: "pedido",
      width: "9%",
      render: (_, record) => (
        (() => {
          const vinculosInformados = Array.isArray(record.lancamentosExtratoVinculos)
            ? record.lancamentosExtratoVinculos.length
            : 0;
          const possuiVinculos = Boolean(record.vinculadoPedido || vinculosInformados > 0);

          if (!possuiVinculos) {
            return (
              <Text style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>
                Sem vínculos
              </Text>
            );
          }

          return (
            <Space size={6}>
              <Tooltip title="Visualizar pedidos vinculados">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined style={{ color: "#059669" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAbrirModalVinculos(record);
                  }}
                  style={{ padding: 0, color: "#059669", fontSize: "0.75rem" }}
                >
                  Visualizar
                </Button>
              </Tooltip>
              {vinculosInformados > 0 && (
                <Tag color="green" style={{ borderRadius: 999, fontSize: "0.65rem", padding: "0 6px" }}>
                  {vinculosInformados}
                </Tag>
              )}
            </Space>
          );
        })()
      ),
    },
    {
      title: "Ação",
      key: "acao",
      width: "12%",
      render: (_, record) => {
        const saldoRestante = obterSaldoRestante(record);
        const podeVincularSaldo = saldoRestante > TOLERANCIA_SALDO;
        const possuiVinculos = Boolean(
          record.vinculadoPedido ||
          (Array.isArray(record.lancamentosExtratoVinculos) && record.lancamentosExtratoVinculos.length > 0)
        );

        if (podeVincularSaldo && !possuiVinculos) {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => handleAbrirVinculacaoManual(record)}
                style={{
                  backgroundColor: "#059669",
                  borderColor: "#047857",
                  fontSize: "0.75rem",
                  height: "28px",
                  padding: "0 8px",
                }}
              >
                Vincular
              </Button>
              <Tooltip title="Excluir lançamento">
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleAbrirConfirmExclusao(record)}
                  style={{
                    fontSize: "0.75rem",
                    height: "28px",
                    padding: "0 4px",
                  }}
                />
              </Tooltip>
            </Space>
          );
        }

        if (podeVincularSaldo && possuiVinculos) {
          return (
            <Space size={6}>
              <Tag
                color="success"
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                Vinculado
              </Tag>
              <Tooltip title="Vincular saldo restante">
                <Button
                  type="text"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => handleAbrirVinculacaoManual(record)}
                  style={{
                    color: "#059669",
                    fontSize: "0.75rem",
                    height: "28px",
                    padding: "0 4px",
                  }}
                />
              </Tooltip>
            </Space>
          );
        }

        if (possuiVinculos) {
          return (
            <Tag
              color="success"
              style={{
                fontSize: "0.65rem",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              Vinculado
            </Tag>
          );
        }

        return (
          <Text style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>
            Sem ação
          </Text>
        );
      },
    },
  ];
  return (
    <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          <DollarOutlined style={{ marginRight: "0.5rem" }} />
          Pagamentos Automáticos
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end",
          gap: isMobile ? "8px" : "12px"
        }}>
          <Button 
            onClick={onClose} 
            size={isMobile ? "small" : "large"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Fechar
          </Button>
        </div>
      }
      width={isMobile ? '95vw' : '95%'}
      style={{ maxWidth: isMobile ? '95vw' : "85rem" }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      {/* Estatísticas Gerais */}
      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
              Estatísticas de Pagamentos
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: {
            padding: isMobile ? "12px" : "16px"
          }
        }}
      >
        {/* Estatísticas */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Total" : "Total de Pagamentos"}
              value={estatisticas.totalPagamentos}
              valueStyle={{ color: "#1890ff", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Valor Total" : "Valor Total Recebido"}
              value={formatarValor(estatisticas.valorTotal)}
              valueStyle={{ color: "#52c41a", fontSize: isMobile ? "1rem" : "1.25rem" }}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Vinculados" : "Vinculados a Pedidos"}
              value={estatisticas.vinculados}
              valueStyle={{ color: "#52c41a", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? "Não Vinculados" : "Não Vinculados"}
              value={estatisticas.naoVinculados}
              valueStyle={{ color: "#ff9800", fontSize: isMobile ? "1.125rem" : "1.5rem" }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Filtros e Busca */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Space>
              <FilterOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                {isMobile ? "Filtros" : "Filtros e Busca"}
              </span>
            </Space>
            <Button
              type="text"
              icon={buscaAPIVisivel ? <UpOutlined /> : <DownOutlined />}
              onClick={() => {
                setBuscaAPIVisivel(!buscaAPIVisivel);
                if (!buscaAPIVisivel && contasDisponiveis.length === 0) {
                  fetchContasDisponiveis();
                }
              }}
              style={{ 
                color: "#ffffff",
                fontSize: "0.75rem",
                padding: "0 8px",
                height: "24px",
                display: "flex",
                alignItems: "center"
              }}
              size="small"
            >
              {buscaAPIVisivel ? "Ocultar" : "Buscar na API"}
            </Button>
          </div>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: {
            padding: isMobile ? "12px" : "16px"
          }
        }}
      >
        {/* Filtros Locais */}
        {/* Primeira linha: Busca (Cliente/Origem) */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 18 : 16]}>
          <Col xs={24}>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              <UserOutlined style={{ marginRight: 4 }} />
              Buscar (Cliente / Origem):
            </Text>
            <SearchInputLocalChips
              placeholder="Digite nome, CPF/CNPJ ou origem..."
              value={buscaValue}
              onChange={setBuscaValue}
              onSelect={handleSelectBuscaLocal}
              items={buscaSuggestionItems}
              minChars={2}
              maxSuggestions={10}
              size={isMobile ? "middle" : "large"}
              style={{ width: "100%" }}
              inputStyle={{ marginBottom: 0 }}
            />

            {/* Chips de filtros aplicados (unificados) */}
            {Array.isArray(filtrosBusca) && filtrosBusca.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {filtrosBusca.map((filtro, index) => (
                  <Tag
                    key={`${filtro.type}-${filtro.type === "cliente" ? filtro.clienteId : filtro.origemKey}-${index}`}
                    color={filtro.type === "cliente" ? "green" : "purple"}
                    closable
                    onClose={() => handleRemoverFiltroBusca(index)}
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                    }}
                  >
                    {filtro.type === "cliente" ? "👤 " : "🏢 "}
                    {filtro.label}
                  </Tag>
                ))}
              </div>
            )}
          </Col>
        </Row>

        {/* Segunda linha: Categoria, Status, Conta-Corrente, Range de Datas */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 18 : 16]} style={{ marginTop: isMobile ? 12 : 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Categoria:
            </Text>
            <Select
              placeholder="Categoria"
              value={categoriaFilter || undefined}
              onChange={(value) => setCategoriaFilter(value || "")}
              allowClear
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
            >
              {categoriasUnicas.map((cat) => (
                <Option key={cat} value={cat}>{cat.replace('_', ' ')}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Status:
            </Text>
            <Select
              placeholder="Status"
              value={vinculadoFilter || undefined}
              onChange={(value) => setVinculadoFilter(value || "")}
              allowClear
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
            >
              <Option value="true">Vinculados</Option>
              <Option value="false">Não Vinculados</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              <BankOutlined style={{ marginRight: 4 }} />
              Conta-Corrente:
            </Text>
            <Select
              placeholder="Selecione a conta"
              value={contaCorrenteFilter || undefined}
              onChange={(value) => setContaCorrenteFilter(value || null)}
              allowClear
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              loading={loadingContas}
              notFoundContent={loadingContas ? <Spin size="small" /> : "Nenhuma conta encontrada"}
            >
              {contasDisponiveis.map((conta) => (
                <Option key={conta.id} value={conta.id}>
                  {conta.agencia} / {conta.contaCorrente} - {conta.nomeBanco || 'Banco do Brasil'}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Período:
            </Text>
            <RangePicker
              placeholder={isMobile ? ["Início", "Fim"] : ["Data Início", "Data Fim"]}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
              }}
              style={{ width: "100%" }}
              size={isMobile ? "middle" : "large"}
              format="DD/MM/YYYY"
              allowClear
              showTime={false}
              disabledTime={() => null}
              inputReadOnly
            />
          </Col>
        </Row>

        {/* Subseção: Buscar Pagamentos na API */}
        {buscaAPIVisivel && (
          <>
            <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: isMobile ? "16px" : "24px" }}>
              <BankOutlined style={{ marginRight: 8 }} />
              Buscar Pagamentos na API
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 18 : 16]}>
              <Col xs={24} sm={12} md={6}>
                <RangePicker
                  placeholder={isMobile ? ["Início", "Fim"] : ["Data Início", "Data Fim"]}
                  value={rangeBuscaAPI}
                  onChange={(dates) => {
                    setRangeBuscaAPI(dates);
                  }}
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                  format="DD/MM/YYYY"
                  allowClear
                  showTime={false}
                  disabledTime={() => null}
                  inputReadOnly
                  disabledDate={(current) => {
                    // Bloquear datas futuras
                    return current && current > moment().endOf('day');
                  }}
                />
              </Col>
              <Col xs={24} sm={24} md={10}>
                <Select
                  placeholder="Selecione a conta corrente"
                  value={contaSelecionada}
                  onChange={(value) => setContaSelecionada(value)}
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                  loading={loadingContas}
                  notFoundContent={loadingContas ? <Spin size="small" /> : "Nenhuma conta encontrada"}
                >
                  {contasDisponiveis.map((conta) => (
                    <Option key={conta.id} value={conta.id}>
                      {conta.agencia} / {conta.contaCorrente} - {conta.nomeBanco || 'Banco do Brasil'}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8}>
                {(() => {
                  const isDisabled = !rangeBuscaAPI || !rangeBuscaAPI[0] || !rangeBuscaAPI[1] || !contaSelecionada;
                  
                  let tooltipMessage = "";
                  if (isDisabled) {
                    if (!rangeBuscaAPI || !rangeBuscaAPI[0] || !rangeBuscaAPI[1]) {
                      tooltipMessage = "Selecione o período de busca (data início e data fim)";
                    } else if (!contaSelecionada) {
                      tooltipMessage = "Selecione uma conta corrente";
                    }
                  }
                  
                  return (
                    <Tooltip title={isDisabled ? tooltipMessage : ""} placement="top">
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={isDisabled ? undefined : buscarNaAPI}
                        loading={buscandoAPI}
                        style={{
                          width: "100%",
                          backgroundColor: "#059669",
                          borderColor: "#047857",
                          height: isMobile ? "32px" : "40px",
                          cursor: isDisabled ? "not-allowed" : "pointer"
                        }}
                        size={isMobile ? "middle" : "large"}
                      >
                        {buscandoAPI ? "Buscando..." : "Buscar na API"}
                      </Button>
                    </Tooltip>
                  );
                })()}
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* Tabela de Pagamentos */}
      <Spin spinning={loadingPagamentos || loading}>
        <ResponsiveTable
          columns={columns}
          dataSource={pagamentosFiltrados}
          loading={loadingPagamentos || loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} pagamentos`,
          }}
          minWidthMobile={1400}
          showScrollHint={true}
          size="middle"
          bordered={true}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
                    Nenhum pagamento encontrado
                  </span>
                }
              />
            ),
          }}
        />
      </Spin>

      {/* Modal de Vinculação Manual */}
      {lancamentoParaVincular && (() => {
        let clienteParaModal = null;
        if (lancamentoParaVincular.cliente) {
          clienteParaModal = lancamentoParaVincular.cliente;
        } else if (lancamentoParaVincular.clienteId) {
          const clienteLocal = clientesById.get(lancamentoParaVincular.clienteId);
          if (clienteLocal) clienteParaModal = clienteLocal;
        } else if (lancamentoParaVincular.pedido?.cliente) {
          clienteParaModal = lancamentoParaVincular.pedido.cliente;
        }

        return (
          <VincularPagamentoManualModal
            open={vinculacaoModalOpen}
            onClose={() => {
              setVinculacaoModalOpen(false);
              setLancamentoParaVincular(null);
              setPedidosVinculacao([]);
            }}
            lancamento={lancamentoParaVincular}
            cliente={clienteParaModal}
            pedidosDisponiveis={pedidosVinculacao}
            loadingPedidos={loadingPedidosVinculacao}
            onVincular={handleVincularPagamento}
          />
        );
      })()}

      {/* Modal de Visualização de Pedido */}
      <VisualizarPedidoModal
        open={visualizarModalOpen}
        onClose={() => {
          setVisualizarModalOpen(false);
          setPedidoSelecionado(null);
          setLoadingPedido(false);
        }}
        pedido={pedidoSelecionado}
        loading={loadingPedido}
      />

      {/* Modal de vínculos */}
      <VisualizarVinculosLancamentoModal
        open={vinculosModalOpen}
        onClose={() => {
          setVinculosModalOpen(false);
          setLancamentoVinculos(null);
        }}
        lancamento={lancamentoVinculos}
        onVisualizarPedido={(pedidoId) => handleOpenVisualizarPedido({ id: pedidoId })}
      />

      {/* Modal de confirmação de exclusão */}
      {lancamentoParaExcluir && (
        <ConfirmActionModal
          open={confirmExclusaoOpen}
          onConfirm={handleConfirmarExclusao}
          onCancel={() => {
            setConfirmExclusaoOpen(false);
            setLancamentoParaExcluir(null);
          }}
          title="Excluir Lançamento"
          message="Tem certeza que deseja excluir este lançamento?"
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          confirmButtonDanger={true}
          icon={<DeleteOutlined />}
          iconColor="#ef4444"
          customContent={
            <div style={{ textAlign: "left", padding: isMobile ? "12px" : "16px" }}>
              <div 
                style={{ 
                  fontSize: isMobile ? "36px" : "48px", 
                  color: "#ef4444", 
                  marginBottom: isMobile ? "12px" : "16px",
                  display: "block",
                  textAlign: "center"
                }} 
              >
                <DeleteOutlined />
              </div>
              <Text style={{ 
                fontSize: isMobile ? "14px" : "16px", 
                fontWeight: "500", 
                color: "#333",
                lineHeight: isMobile ? "1.4" : "1.5",
                display: "block",
                marginBottom: "16px",
                textAlign: "center"
              }}>
                Tem certeza que deseja excluir este lançamento?
              </Text>
              <div style={{ 
                backgroundColor: "#f8f9fa", 
                padding: "12px", 
                borderRadius: "8px",
                border: "1px solid #e8e8e8",
                marginTop: "12px"
              }}>
                <Text strong style={{ display: "block", marginBottom: "8px", color: "#059669", fontSize: "14px" }}>
                  Detalhes do Lançamento:
                </Text>
                <Text style={{ display: "block", fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  <strong>Data:</strong> {formatarDataBR(lancamentoParaExcluir.dataLancamento)}
                </Text>
                <Text style={{ display: "block", fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  <strong>Valor:</strong> {formatarValor(lancamentoParaExcluir.valorLancamento)}
                </Text>
                <Text style={{ display: "block", fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  <strong>Descrição:</strong> {lancamentoParaExcluir.textoDescricaoHistorico || "-"}
                </Text>
                {lancamentoParaExcluir.nomeContrapartida && (
                  <Text style={{ display: "block", fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                    <strong>Origem:</strong> {capitalizeName(lancamentoParaExcluir.nomeContrapartida)}
                  </Text>
                )}
                {lancamentoParaExcluir.agenciaConta && lancamentoParaExcluir.numeroConta && (
                  <Text style={{ display: "block", fontSize: "13px", color: "#666" }}>
                    <strong>Conta:</strong> {lancamentoParaExcluir.agenciaConta}/{lancamentoParaExcluir.numeroConta}
                  </Text>
                )}
              </div>
            </div>
          }
        />
      )}

      {/* Modal de Resultado da Busca na API */}
      <InfoAlertModal
        open={resultadoBuscaModalOpen}
        onClose={() => {
          setResultadoBuscaModalOpen(false);
          setResultadoBuscaSummary(null);
        }}
        title="Busca Concluída"
        iconType="success"
        message="A busca foi concluída com sucesso!"
        customContent={
          resultadoBuscaSummary && (
            <div>
              {/* Informações do Período e Conta */}
              {(resultadoBuscaSummary.periodo || resultadoBuscaSummary.contaCorrente) && (
                <div style={{ 
                  marginBottom: isMobile ? "16px" : "20px", 
                  padding: isMobile ? "10px" : "12px",
                  backgroundColor: "#f0f2f5",
                  borderRadius: "6px",
                  border: "1px solid #d9d9d9"
                }}>
                  {resultadoBuscaSummary.periodo && (
                    <div style={{ marginBottom: resultadoBuscaSummary.periodo && resultadoBuscaSummary.contaCorrente ? "8px" : "0" }}>
                      <Space>
                        <CalendarOutlined style={{ color: "#1890ff", fontSize: isMobile ? "14px" : "16px" }} />
                        <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666" }}>
                          Período:
                        </Text>
                        <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                          {resultadoBuscaSummary.periodo.inicio} a {resultadoBuscaSummary.periodo.fim}
                        </Text>
                      </Space>
                    </div>
                  )}
                  {resultadoBuscaSummary.contaCorrente && (
                    <div>
                      <Space>
                        <BankOutlined style={{ color: "#059669", fontSize: isMobile ? "14px" : "16px" }} />
                        <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666" }}>
                          Conta:
                        </Text>
                        <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                          {resultadoBuscaSummary.contaCorrente.agencia} / {resultadoBuscaSummary.contaCorrente.conta}
                        </Text>
                      </Space>
                    </div>
                  )}
                </div>
              )}

              {/* Total Analisado */}
              {resultadoBuscaSummary.totalFiltrados > 0 && (
                <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
                  <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                    📊 Total de Lançamentos Analisados:
                  </Text>
                  <Tag color="blue" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px" }}>
                    {resultadoBuscaSummary.totalFiltrados} lançamento{resultadoBuscaSummary.totalFiltrados > 1 ? "s" : ""}
                  </Tag>
                </div>
              )}

              {/* Lançamentos Salvos */}
              <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
                <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                  ✅ Lançamentos Salvos:
                </Text>
                <Tag color="green" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px", marginBottom: "6px" }}>
                  {resultadoBuscaSummary.totalSalvos} {resultadoBuscaSummary.totalSalvos === 1 ? "salvo" : "salvos"}
                </Tag>
                {(resultadoBuscaSummary.totalSalvosComClienteIdentificado > 0 || resultadoBuscaSummary.totalSalvosSemClienteIdentificado > 0) && (
                  <div style={{ marginTop: "8px", paddingLeft: "12px" }}>
                    {resultadoBuscaSummary.totalSalvosComClienteIdentificado > 0 && (
                      <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#52c41a", display: "block", marginBottom: "4px" }}>
                        ✓ {resultadoBuscaSummary.totalSalvosComClienteIdentificado} com cliente identificado
                      </Text>
                    )}
                    {resultadoBuscaSummary.totalSalvosSemClienteIdentificado > 0 && (
                      <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#fa8c16", display: "block" }}>
                        ⚠ {resultadoBuscaSummary.totalSalvosSemClienteIdentificado} sem cliente identificado
                      </Text>
                    )}
                  </div>
                )}
              </div>

              {/* Duplicados */}
              {resultadoBuscaSummary.totalDuplicados > 0 && (
                <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
                  <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                    🔄 Duplicados Ignorados:
                  </Text>
                  <Tag color="orange" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px" }}>
                    {resultadoBuscaSummary.totalDuplicados} {resultadoBuscaSummary.totalDuplicados === 1 ? "duplicado" : "duplicados"} (já existiam no sistema)
                  </Tag>
                </div>
              )}

              {/* Clientes Afetados - Lista Detalhada */}
              {resultadoBuscaSummary.clientes && Array.isArray(resultadoBuscaSummary.clientes) && resultadoBuscaSummary.clientes.length > 0 && (
                <div style={{ 
                  marginTop: isMobile ? "16px" : "20px", 
                  paddingTop: isMobile ? "12px" : "16px", 
                  borderTop: "2px solid #e8e8e8" 
                }}>
                  <Space style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                    <UserOutlined style={{ color: "#059669", fontSize: isMobile ? "16px" : "18px" }} />
                    <Text strong style={{ fontSize: isMobile ? "14px" : "15px", color: "#333" }}>
                      Clientes Afetados ({resultadoBuscaSummary.clientes.length}):
                    </Text>
                  </Space>
                  <div style={{ 
                    maxHeight: isMobile ? "200px" : "280px", 
                    overflowY: "auto",
                    padding: "8px",
                    backgroundColor: "#fafafa",
                    borderRadius: "6px",
                    border: "1px solid #e8e8e8"
                  }}>
                    {resultadoBuscaSummary.clientes.map((cliente, index) => {
                      const quantidade = cliente?.quantidadeLancamentos || 0;
                      const valorTotal = cliente?.valorTotal || 0;
                      
                      return (
                        <div 
                          key={cliente?.id || index}
                          style={{ 
                            padding: isMobile ? "8px" : "10px",
                            marginBottom: index < resultadoBuscaSummary.clientes.length - 1 ? "6px" : "0",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #e8e8e8",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px"
                          }}
                        >
                          <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                            {cliente?.nome ? capitalizeName(cliente.nome) : `Cliente #${cliente?.id || index + 1}`}
                          </Text>
                          {quantidade > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                              <Tag color="blue" style={{ fontSize: isMobile ? "11px" : "12px", margin: 0 }}>
                                {quantidade} {quantidade === 1 ? "lançamento" : "lançamentos"}
                              </Tag>
                              {valorTotal > 0 && (
                                <Tag color="green" style={{ fontSize: isMobile ? "11px" : "12px", margin: 0 }}>
                                  <DollarOutlined style={{ marginRight: "4px", fontSize: "10px" }} />
                                  R$ {formatCurrency(valorTotal)}
                                </Tag>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensagem quando não há novos lançamentos */}
              {resultadoBuscaSummary.totalFiltrados === 0 && resultadoBuscaSummary.totalSalvos === 0 && (
                <Text style={{ fontSize: isMobile ? "14px" : "16px", color: "#666", fontStyle: "italic" }}>
                  Busca finalizada sem novos lançamentos.
                </Text>
              )}
            </div>
          )
        }
      />
    </Modal>
  );
};

PagamentosAutomaticosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

PagamentosAutomaticosModal.displayName = 'PagamentosAutomaticosModal';

export default PagamentosAutomaticosModal;









