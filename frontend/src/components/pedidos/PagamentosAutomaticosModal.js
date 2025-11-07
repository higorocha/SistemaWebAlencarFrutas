// src/components/pedidos/PagamentosAutomaticosModal.js

import React, { useState, useEffect, useCallback } from "react";
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
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import SearchInputInteligente from "../common/search/SearchInputInteligente";
import { formatCurrency, capitalizeName, formatarDataBR } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import VincularPagamentoManualModal from "../clientes/VincularPagamentoManualModal";
import VisualizarPedidoModal from "./VisualizarPedidoModal";
import CentralizedLoader from "../common/loaders/CentralizedLoader";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

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
  
  // Estados para filtro de cliente (agora suporta múltiplos clientes)
  const [clientesFiltros, setClientesFiltros] = useState([]); // Array de objetos {id, nome, cpf, cnpj}
  const [clientesFiltrosAplicados, setClientesFiltrosAplicados] = useState([]); // Array de sugestões para exibição

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

  // Estados para visualização de pedido
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [loadingPedido, setLoadingPedido] = useState(false);

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

    // Aplicar filtro de cliente (suporta múltiplos clientes - OR lógico)
    if (clientesFiltros.length > 0) {
      const clientesIds = clientesFiltros.map(c => c.id);
      pagamentosFiltrados = pagamentosFiltrados.filter(p => {
        // Verificar se o pagamento pertence a QUALQUER um dos clientes selecionados
        let clienteIdPagamento = null;
        
        // Verificar se o pagamento tem cliente associado diretamente
        if (p.clienteId) {
          clienteIdPagamento = p.clienteId;
        } else if (p.cliente?.id) {
          clienteIdPagamento = p.cliente.id;
        } else if (p.pedido?.clienteId) {
          clienteIdPagamento = p.pedido.clienteId;
        }
        
        // Se encontrou um clienteId, verificar se está na lista de clientes filtrados
        if (clienteIdPagamento) {
          return clientesIds.includes(clienteIdPagamento);
        }
        
        return false;
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
        if (p.contaCorrenteId) {
          return p.contaCorrenteId === contaCorrenteFilter;
        }
        return false;
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
  }, [pagamentos, clientesFiltros, categoriaFilter, vinculadoFilter, contaCorrenteFilter, dateRange]);

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

      const totalSalvos = response.data.totalSalvos || 0;
      const totalFiltrados = response.data.totalFiltrados || 0;
      const totalClientes = response.data.clientes?.length || 0;
      
      let mensagem = `${totalSalvos} ${totalSalvos === 1 ? 'novo lançamento encontrado' : 'novos lançamentos encontrados'}`;
      if (totalClientes > 0) {
        mensagem += ` para ${totalClientes} ${totalClientes === 1 ? 'cliente' : 'clientes'}`;
      }
      
      showNotification(
        'success',
        'Busca Concluída',
        mensagem
      );

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

  // Handler para seleção de cliente via SearchInputInteligente (adiciona à lista, não substitui)
  const handleClienteSelect = useCallback((suggestion) => {
    if (suggestion.type === 'cliente' && suggestion.metadata?.id) {
      const clienteId = suggestion.metadata.id;
      
      // Verificar se o cliente já está na lista
      const clienteJaExiste = clientesFiltros.some(c => c.id === clienteId);
      
      if (!clienteJaExiste) {
        const novoCliente = {
          id: clienteId,
          nome: suggestion.value,
          cpf: suggestion.metadata.cpf,
          cnpj: suggestion.metadata.cnpj,
        };
        
        // Adicionar à lista de clientes
        setClientesFiltros(prev => [...prev, novoCliente]);
        
        // Adicionar à lista de sugestões para exibição
        setClientesFiltrosAplicados(prev => [...prev, {
          ...suggestion,
          displayValue: capitalizeName(suggestion.value),
        }]);
        
        // Recarregar pagamentos com todos os clientes selecionados
        // Como a API aceita apenas um clienteId, vamos buscar todos e filtrar no frontend
        // ou buscar sem filtro e filtrar aqui
        fetchPagamentos(); // Buscar todos, o filtro será aplicado no frontend
      } else {
        showNotification('info', 'Cliente já selecionado', 'Este cliente já está na lista de filtros');
      }
    }
  }, [clientesFiltros, fetchPagamentos]);

  // Handler para remover um cliente específico da lista
  const handleRemoverFiltroCliente = useCallback((index) => {
    setClientesFiltros(prev => {
      const novoArray = prev.filter((_, i) => i !== index);
      // Se não houver mais clientes, recarregar todos os pagamentos
      if (novoArray.length === 0) {
        fetchPagamentos();
      }
      return novoArray;
    });
    setClientesFiltrosAplicados(prev => prev.filter((_, i) => i !== index));
  }, [fetchPagamentos]);

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

  // Função para abrir modal de visualização de pedido
  const handleOpenVisualizarPedido = async (pedido) => {
    setLoadingPedido(true);
    try {
      // Buscar pedido atualizado do banco para garantir que todos os dados estejam presentes
      const pedidoAtualizado = await buscarPedidoAtualizado(pedido.id);
      if (pedidoAtualizado) {
        setPedidoSelecionado(pedidoAtualizado);
        setVisualizarModalOpen(true);
      }
    } catch (error) {
      console.error("Erro ao abrir visualização de pedido:", error);
    } finally {
      setLoadingPedido(false);
    }
  };

  // Handler para abrir modal de vinculação manual
  const handleAbrirVinculacaoManual = (lancamento) => {
    // Precisamos identificar o cliente do lançamento
    // Priorizar cliente direto, depois via objeto cliente, depois via pedido
    let clienteDoLancamento = null;
    
    if (lancamento.cliente) {
      clienteDoLancamento = lancamento.cliente;
    } else if (lancamento.clienteId) {
      // Tentar encontrar o cliente na lista de clientes filtrados
      const clienteFiltrado = clientesFiltros.find(c => c.id === lancamento.clienteId);
      if (clienteFiltrado) {
        clienteDoLancamento = clienteFiltrado;
      }
    } else if (lancamento.pedido?.cliente) {
      clienteDoLancamento = lancamento.pedido.cliente;
    }
    
    if (!clienteDoLancamento) {
      showNotification('warning', 'Atenção', 'Não foi possível identificar o cliente deste pagamento. Selecione o cliente no filtro primeiro.');
      return;
    }
    
    setLancamentoParaVincular(lancamento);
    setVinculacaoModalOpen(true);
  };

  // Handler para executar vinculação
  const handleVincularPagamento = async (lancamento, pedido) => {
    try {
      setLoadingPagamentos(true);

      // 1. Vincular lançamento ao pedido
      await axiosInstance.post(
        `/api/lancamentos-extrato/${lancamento.id}/vincular-pedido`,
        {
          pedidoId: pedido.id,
          observacoes: 'Vinculação manual pelo usuário'
        }
      );

      // 2. Criar pagamento na tabela PagamentosPedidos
      const metodoPagamento = lancamento.categoriaOperacao === 'PIX_RECEBIDO'
        ? 'PIX'
        : lancamento.categoriaOperacao === 'PIX_ENVIADO'
          ? 'PIX'
          : 'TRANSFERENCIA';

      const pagamentoData = {
        pedidoId: pedido.id,
        dataPagamento: moment(lancamento.dataLancamento).startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        valorRecebido: lancamento.valorLancamento,
        metodoPagamento: metodoPagamento,
        contaDestino: 'ALENCAR',
        observacoesPagamento: `Vinculado do extrato bancário - ${lancamento.textoDescricaoHistorico || 'Sem descrição'}`,
      };

      await axiosInstance.post(
        `/api/pedidos/pagamentos`,
        pagamentoData
      );

      showNotification(
        'success',
        'Sucesso',
        `Pagamento de ${formatCurrency(lancamento.valorLancamento)} vinculado ao pedido ${pedido.numeroPedido} com sucesso!`
      );

      // Recarregar lista de lançamentos (buscar todos, o filtro será aplicado no frontend)
      await fetchPagamentos();

      setVinculacaoModalOpen(false);
      setLancamentoParaVincular(null);
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
      setClientesFiltros([]);
      setClientesFiltrosAplicados([]);
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
          <Text style={{ fontSize: "0.75rem" }}>
            {formatarDataBR(data)}
          </Text>
        </Space>
      ),
      width: "12%",
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
      width: "16%",
      sorter: (a, b) => (Number(a.valorLancamento) || 0) - (Number(b.valorLancamento) || 0),
    },
    {
      title: "Categoria",
      dataIndex: "categoriaOperacao",
      key: "categoriaOperacao",
      render: (categoria) => formatarCategoria(categoria),
      width: "15%",
    },
    {
      title: "Descrição",
      dataIndex: "textoDescricaoHistorico",
      key: "textoDescricaoHistorico",
      render: (text) => (
        <Text style={{ fontSize: "0.75rem", color: "#666" }}>
          {text || "-"}
        </Text>
      ),
      width: "14%",
    },
    {
      title: "Origem",
      dataIndex: "nomeContrapartida",
      key: "nomeContrapartida",
      render: (nome) => (
        <Text style={{ fontSize: "0.75rem", color: "#333" }}>
          {nome || "-"}
        </Text>
      ),
      width: "18%",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => formatarStatusVinculacao(record.vinculadoPedido, record.vinculacaoAutomatica),
      width: "15%",
    },
    {
      title: "Pedido",
      key: "pedido",
      render: (_, record) => (
        record.pedido ? (
          <Text 
            strong 
            style={{ 
              color: "#059669", 
              fontSize: "0.75rem",
              cursor: "pointer",
              textDecoration: "underline"
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenVisualizarPedido(record.pedido);
            }}
          >
            #{record.pedido.numeroPedido}
          </Text>
        ) : (
          <Text style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>
            Não vinculado
          </Text>
        )
      ),
      width: "12%",
    },
    {
      title: "Ação",
      key: "acao",
      width: "10%",
      render: (_, record) => {
        // Verificar se tem cliente associado
        const clienteDoLancamento = record.cliente || record.pedido?.cliente;
        
        if (!record.vinculadoPedido && clienteDoLancamento) {
          return (
            <Button
              type="primary"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleAbrirVinculacaoManual(record)}
              style={{
                backgroundColor: '#059669',
                borderColor: '#047857',
                fontSize: '0.75rem',
                height: '28px',
                padding: '0 8px'
              }}
            >
              Vincular
            </Button>
          );
        } else if (record.vinculadoPedido) {
          return (
            <Tag
              color="success"
              style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Vinculado
            </Tag>
          );
        } else {
          return (
            <Tag
              color="default"
              style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Sem cliente
            </Tag>
          );
        }
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
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "75rem" }}
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
        {/* Primeira linha: Cliente */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 18 : 16]}>
          <Col xs={24}>
            <Text strong style={{ display: "block", marginBottom: 8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              <UserOutlined style={{ marginRight: 4 }} />
              Cliente:
            </Text>
            <SearchInputInteligente
              placeholder="Buscar cliente..."
              value=""
              onChange={() => {}}
              onSuggestionSelect={handleClienteSelect}
              size={isMobile ? "middle" : "large"}
              style={{ width: "100%", marginBottom: 0 }}
            />
            {/* Chips de filtros aplicados */}
            {clientesFiltrosAplicados.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {clientesFiltrosAplicados.map((filtro, index) => (
                  <Tag
                    key={`${filtro.type}-${filtro.value}-${index}`}
                    color="blue"
                    closable
                    onClose={() => handleRemoverFiltroCliente(index)}
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px"
                    }}
                  >
                    {filtro.displayValue || filtro.value}
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
          minWidthMobile={1200}
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
        // Identificar cliente do lançamento
        let clienteParaModal = null;
        if (lancamentoParaVincular.cliente) {
          clienteParaModal = lancamentoParaVincular.cliente;
        } else if (lancamentoParaVincular.clienteId) {
          // Tentar encontrar o cliente na lista de clientes filtrados
          const clienteFiltrado = clientesFiltros.find(c => c.id === lancamentoParaVincular.clienteId);
          if (clienteFiltrado) {
            clienteParaModal = clienteFiltrado;
          }
        } else if (lancamentoParaVincular.pedido?.cliente) {
          clienteParaModal = lancamentoParaVincular.pedido.cliente;
        }
        
        if (!clienteParaModal) {
          return null;
        }
        
        return (
          <VincularPagamentoManualModal
            open={vinculacaoModalOpen}
            onClose={() => {
              setVinculacaoModalOpen(false);
              setLancamentoParaVincular(null);
            }}
            lancamento={lancamentoParaVincular}
            cliente={clienteParaModal}
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
        }}
        pedido={pedidoSelecionado}
      />

      {/* Loader centralizado para busca de pedido */}
      <CentralizedLoader
        visible={loadingPedido}
        message="Carregando pedido..."
        subMessage="Buscando dados atualizados do pedido"
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

