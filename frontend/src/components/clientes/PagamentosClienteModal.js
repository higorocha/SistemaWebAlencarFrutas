// src/components/clientes/PagamentosClienteModal.js

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Table, Space, Typography, Tag, Button, Row, Col, Card, Statistic, Empty, Spin, DatePicker, Select, Divider, Tooltip } from "antd";
import {
  DollarOutlined,
  FilterOutlined,
  CloseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  SearchOutlined,
  BankOutlined,
  UpOutlined,
  DownOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { SearchInput } from "../common/search";
import { formatCurrency, capitalizeName, formatarDataBR } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import VincularPagamentoManualModal from "./VincularPagamentoManualModal";
import moment from "moment";

const { RangePicker } = DatePicker;

const { Title, Text } = Typography;
const { Option } = Select;

const PagamentosClienteModal = ({ open, onClose, cliente, loading = false }) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();
  const [pagamentos, setPagamentos] = useState([]);
  const [pagamentosFiltrados, setPagamentosFiltrados] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [vinculadoFilter, setVinculadoFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

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

  // Estatísticas do cliente
  const [estatisticas, setEstatisticas] = useState({
    totalPagamentos: 0,
    valorTotal: 0,
    vinculados: 0,
    naoVinculados: 0,
    valorVinculado: 0,
    valorNaoVinculado: 0,
  });

  // Carregar pagamentos do cliente
  const fetchPagamentosCliente = useCallback(async () => {
    if (!cliente?.id) return;

    setLoadingPagamentos(true);
    try {
      // Buscar TODOS os pagamentos do cliente (sem filtro de data no backend)
      // O filtro de data será aplicado no frontend
      const params = new URLSearchParams();
      params.append('clienteId', cliente.id);

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
      console.error("Erro ao buscar pagamentos do cliente:", error);
      showNotification("error", "Erro", "Erro ao carregar pagamentos do cliente");
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
  }, [cliente?.id]);

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

    // Aplicar filtro de busca
    if (searchTerm) {
      pagamentosFiltrados = pagamentosFiltrados.filter(pagamento => {
        const searchLower = searchTerm.toLowerCase();
        const searchTrimmed = searchTerm.trim();
        
        const categoriaMatch = pagamento.categoriaOperacao?.toLowerCase().includes(searchLower);
        const descricaoMatch = pagamento.textoDescricaoHistorico?.toLowerCase().includes(searchLower);
        const nomeMatch = pagamento.nomeContrapartida?.toLowerCase().includes(searchLower);
        const documentoMatch = pagamento.numeroDocumento?.toLowerCase().includes(searchLower);
        
        // Detectar se é busca de data (contém "/")
        const isDataSearch = searchTrimmed.includes('/');
        
        // Busca por data
        let dataMatch = false;
        if (isDataSearch) {
          // Padrão: "31", "31/", "31/1", "31/10", "31/10/2024", etc
          const dataParts = searchTrimmed.split('/').map(p => p.trim()).filter(p => p);
          
          if (dataParts.length > 0) {
            const dataLancamento = moment(pagamento.dataLancamento);
            
            // Dia
            if (dataParts[0]) {
              const diaBuscado = parseInt(dataParts[0], 10);
              const diaPagamento = dataLancamento.date();
              
              if (!isNaN(diaBuscado) && diaBuscado === diaPagamento) {
                dataMatch = true;
                
                // Mês (pode ser parcial, ex: "1" para meses 10, 11, 12)
                if (dataParts[1]) {
                  const mesBuscado = dataParts[1];
                  const mesPagamento = dataLancamento.month() + 1; // moment retorna 0-11
                  const mesPagamentoStr = mesPagamento.toString();
                  
                  // Se buscar por "1", encontra meses 10, 11, 12
                  if (mesBuscado.length === 1) {
                    dataMatch = mesPagamentoStr.startsWith(mesBuscado);
                  } else {
                    // Busca exata por mês
                    const mesBuscadoInt = parseInt(mesBuscado, 10);
                    dataMatch = !isNaN(mesBuscadoInt) && mesBuscadoInt === mesPagamento;
                  }
                  
                  // Ano (opcional)
                  if (dataMatch && dataParts[2]) {
                    const anoBuscado = parseInt(dataParts[2], 10);
                    const anoPagamento = dataLancamento.year();
                    
                    if (!isNaN(anoBuscado)) {
                      // Se ano com 2 dígitos, assume 20xx
                      if (anoBuscado < 100) {
                        dataMatch = anoPagamento.toString().endsWith(anoBuscado.toString().padStart(2, '0'));
                      } else {
                        dataMatch = anoBuscado === anoPagamento;
                      }
                    }
                  }
                }
              } else {
                dataMatch = false;
              }
            }
          }
        } else {
          // Se não é busca de data, verifica se o número pode ser uma data
          // Ex: "31" pode ser dia 31 OU parte do valor
          const searchDigits = searchTrimmed.replace(/\D/g, '');
          
          if (searchDigits && searchDigits.length > 0) {
            // Verifica se é um dia válido (1-31)
            const diaBuscado = parseInt(searchDigits, 10);
            if (!isNaN(diaBuscado) && diaBuscado >= 1 && diaBuscado <= 31) {
              const dataLancamento = moment(pagamento.dataLancamento);
              const diaPagamento = dataLancamento.date();
              dataMatch = diaBuscado === diaPagamento;
            }
          }
        }
        
        // Busca por valor numérico (apenas se não for busca exclusiva de data)
        let valorMatch = false;
        if (!isDataSearch && searchTrimmed) {
          // Extrai TODOS os dígitos do termo de busca (remove tudo exceto números)
          const searchDigits = searchTrimmed.replace(/\D/g, '');
          
          // Verifica se o termo contém números
          if (searchDigits && searchDigits.length > 0) {
            // Obtém o valor do pagamento como número
            const valorPagamento = Number(pagamento.valorLancamento) || 0;
            
            // Converte o valor do pagamento para string sem formatação (apenas dígitos)
            // Ex: 8717.20 → "871720"
            const valorPagamentoDigits = Math.abs(valorPagamento).toFixed(2).replace(/[^\d]/g, '');
            
            // Verifica se os dígitos buscados estão contidos nos dígitos do valor
            valorMatch = valorPagamentoDigits.includes(searchDigits);
          }
        }
        
        // Se for busca de data (contém "/"), retorna apenas dataMatch
        // Se não for, retorna dataMatch OU valorMatch OU outros matches
        if (isDataSearch) {
          return categoriaMatch || descricaoMatch || nomeMatch || documentoMatch || dataMatch;
        } else {
          return categoriaMatch || descricaoMatch || nomeMatch || documentoMatch || valorMatch || dataMatch;
        }
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

    // Aplicar filtro de data
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      
      pagamentosFiltrados = pagamentosFiltrados.filter(pagamento => {
        const dataLancamento = moment(pagamento.dataLancamento);
        
        // Comparar apenas as datas (ignorar horário)
        const dataLancamentoOnly = dataLancamento.format('YYYY-MM-DD');
        const startDateOnly = startDate.format('YYYY-MM-DD');
        const endDateOnly = endDate.format('YYYY-MM-DD');
        
        return dataLancamentoOnly >= startDateOnly && dataLancamentoOnly <= endDateOnly;
      });
    }

    setPagamentosFiltrados(pagamentosFiltrados);
  }, [pagamentos, searchTerm, categoriaFilter, vinculadoFilter, dateRange]);

  // Carregar contas disponíveis quando o modal abrir
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

  // Buscar e processar extratos na API
  const buscarNaAPI = useCallback(async () => {
    if (!cliente?.id) {
      showNotification('warning', 'Atenção', 'Cliente não selecionado');
      return;
    }

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
      // Formatar datas para DDMMYYYY
      const dataInicio = rangeBuscaAPI[0].format('DDMMYYYY');
      const dataFim = rangeBuscaAPI[1].format('DDMMYYYY');

      const response = await axiosInstance.post('/api/lancamentos-extrato/buscar-processar', {
        dataInicio,
        dataFim,
        clienteId: cliente.id,
        contaCorrenteId: contaSelecionada,
      });

      const totalSalvos = response.data.totalSalvos || 0;
      showNotification(
        'success',
        'Busca Concluída',
        `${totalSalvos} ${totalSalvos === 1 ? 'novo lançamento encontrado' : 'novos lançamentos encontrados'}`
      );

      // Recarregar pagamentos após buscar
      await fetchPagamentosCliente();

      // Limpar range de busca
      setRangeBuscaAPI(null);
    } catch (error) {
      console.error('Erro ao buscar extratos na API:', error);
      const mensagem = error.response?.data?.message || 'Erro ao buscar extratos na API';
      showNotification('error', 'Erro', mensagem);
    } finally {
      setBuscandoAPI(false);
    }
  }, [cliente?.id, rangeBuscaAPI, contaSelecionada, fetchPagamentosCliente]);

  // Handler para abrir modal de vinculação manual
  const handleAbrirVinculacaoManual = (lancamento) => {
    setLancamentoParaVincular(lancamento);
    setVinculacaoModalOpen(true);
  };

  // Handler para executar vinculação (dupla operação)
  const handleVincularPagamento = async (lancamento, pedido) => {
    try {
      setLoadingPagamentos(true);

      // 1. Vincular lançamento ao pedido na tabela LancamentoExtrato
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
        contaDestino: 'ALENCAR', // Pode ser configurável no futuro
        observacoesPagamento: `Vinculado do extrato bancário - ${lancamento.textoDescricaoHistorico || 'Sem descrição'}`,
      };

      await axiosInstance.post(
        `/api/pedidos/${pedido.id}/pagamentos`,
        pagamentoData
      );

      showNotification(
        'success',
        'Sucesso',
        `Pagamento de ${formatCurrency(lancamento.valorLancamento)} vinculado ao pedido ${pedido.numeroPedido} com sucesso!`
      );

      // Recarregar lista de lançamentos
      await fetchPagamentosCliente();

      // Fechar modal (o modal filho já faz isso)
      setVinculacaoModalOpen(false);
      setLancamentoParaVincular(null);
    } catch (error) {
      console.error('Erro ao vincular pagamento:', error);
      const message = error.response?.data?.message || 'Erro ao vincular pagamento ao pedido';
      showNotification('error', 'Erro', message);
      throw error; // Re-throw para o modal filho tratar
    } finally {
      setLoadingPagamentos(false);
    }
  };

  // Efeito para carregar pagamentos quando o modal abrir
  useEffect(() => {
    if (open && cliente?.id) {
      fetchPagamentosCliente();
      fetchContasDisponiveis();
    }
  }, [open, cliente?.id, fetchPagamentosCliente, fetchContasDisponiveis]);

  // Efeito para limpar estados quando o modal fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setCategoriaFilter("");
      setVinculadoFilter("");
      setDateRange(null);
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
      width: "12%",
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
      width: "20%",
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
          <Text strong style={{ color: "#059669", fontSize: "0.75rem" }}>
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
      render: (_, record) => (
        !record.vinculadoPedido ? (
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
        ) : (
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
        )
      ),
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
          {isMobile ? `Pagamentos - ${capitalizeName(cliente?.nome || "Cliente")}` : `Pagamentos Recebidos de ${capitalizeName(cliente?.nome || "Cliente")}`}
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
      {/* Estatísticas do Cliente */}
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
        {/* Primeira linha: Nome e CNPJ do Cliente */}
        <div style={{
          marginBottom: isMobile ? "16px" : "20px",
          paddingBottom: isMobile ? "12px" : "16px",
          borderBottom: "1px solid #e8e8e8"
        }}>
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={2}>
                <Text strong style={{ fontSize: isMobile ? "11px" : "12px", color: "#666" }}>
                  Cliente
                </Text>
                <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "600", color: "#333" }}>
                  {capitalizeName(cliente?.nome || "Cliente")}
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={2}>
                <Text strong style={{ fontSize: isMobile ? "11px" : "12px", color: "#666" }}>
                  {cliente?.cpf ? "CPF" : "CNPJ"}
                </Text>
                <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "600", color: "#333" }}>
                  {cliente?.cpf || cliente?.cnpj || "-"}
                </Text>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Segunda linha: Estatísticas */}
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
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 18 : 16]}>
          <Col xs={24} sm={24} md={8}>
            <SearchInput
              placeholder="Buscar por categoria, descrição, origem..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              allowClear
              style={{ width: "100%", marginBottom: 0 }}
              size={isMobile ? "middle" : "large"}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
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
          <Col xs={24} sm={12} md={5}>
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
      <VincularPagamentoManualModal
        open={vinculacaoModalOpen}
        onClose={() => {
          setVinculacaoModalOpen(false);
          setLancamentoParaVincular(null);
        }}
        lancamento={lancamentoParaVincular}
        cliente={cliente}
        onVincular={handleVincularPagamento}
      />
    </Modal>
  );
};

PagamentosClienteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cliente: PropTypes.object,
  loading: PropTypes.bool,
};

PagamentosClienteModal.displayName = 'PagamentosClienteModal';

export default PagamentosClienteModal;

