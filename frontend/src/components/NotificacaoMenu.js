import React, { useState, useCallback, useEffect } from "react";
import { Popover, Tooltip } from "antd";
import {
  Badge,
  IconButton,
  Box,
  Typography,
  Divider,
  CircularProgress,
  useTheme,
  Button,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNotificacao } from "../contexts/NotificacaoContext";
import NotificacaoDetalheModal from "./NotificacaoDetalheModal";
import VincularPagamentoManualModal from "./clientes/VincularPagamentoManualModal";
import LotePagamentosDetalhesModal from "./pagamentos/LotePagamentosDetalhesModal";
import VisualizarPedidoModal from "./pedidos/VisualizarPedidoModal";
import CentralizedLoader from "./common/loaders/CentralizedLoader";
import moment from "../config/momentConfig";
import { formatarValorMonetario } from "../utils/formatters";
import useResponsive from "../hooks/useResponsive";
import { getFruitIcon } from "../utils/fruitIcons";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";

const NotificacaoMenu = () => {
  const {
    notificacoes,
    naoLidas,
    loading,
    marcarComoLida,
    marcarTodasComoLidas,
    descartarNotificacao,
    buscarNotificacoes,
  } = useNotificacao();

  const theme = useTheme();
  const { isMobile } = useResponsive();

  // Estados para controlar o modal
  const [modalAberto, setModalAberto] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState(null);
  
  // Estados para modal de vinculação de pagamento
  const [vinculacaoModalOpen, setVinculacaoModalOpen] = useState(false);
  const [lancamentoParaVincular, setLancamentoParaVincular] = useState(null);
  const [clienteParaVinculacao, setClienteParaVinculacao] = useState(null);
  const [loadingDadosPagamento, setLoadingDadosPagamento] = useState(false);
  const [pedidosVinculacao, setPedidosVinculacao] = useState([]);
  const [loadingPedidosVinculacao, setLoadingPedidosVinculacao] = useState(false);

  // Estados para modal de liberação de pagamento
  const [modalLiberacaoOpen, setModalLiberacaoOpen] = useState(false);
  const [loteParaLiberacao, setLoteParaLiberacao] = useState(null);
  const [loadingLoteLiberacao, setLoadingLoteLiberacao] = useState(false);
  const [liberandoLoteId, setLiberandoLoteId] = useState(null);

  // Estados para modal de visualização de pedido
  const [visualizarPedidoModalOpen, setVisualizarPedidoModalOpen] = useState(false);
  const [pedidoParaVisualizar, setPedidoParaVisualizar] = useState(null);
  const [loadingPedidoVisualizar, setLoadingPedidoVisualizar] = useState(false);

  // Estado para controlar quantas notificações estão sendo exibidas
  const [limiteExibicao, setLimiteExibicao] = useState(50);
  const [popoverAberto, setPopoverAberto] = useState(false);

  // Resetar limite quando o popover fechar ou quando as notificações mudarem significativamente
  useEffect(() => {
    if (!popoverAberto) {
      setLimiteExibicao(50);
    }
  }, [popoverAberto]);

  // Função para carregar notificações ao clicar no ícone
  const handleIconClick = (e) => {
    e.stopPropagation();
    if (!popoverAberto) {
      buscarNotificacoes();
    }
  };

  const obterDadosAdicionais = (notificacao) => {
    if (!notificacao || !notificacao.dadosAdicionais) {
      return {};
    }

    try {
      return typeof notificacao.dadosAdicionais === "string"
        ? JSON.parse(notificacao.dadosAdicionais || "{}")
        : notificacao.dadosAdicionais || {};
    } catch (error) {
      console.error("Erro ao parsear dados adicionais da notificação:", error);
      return {};
    }
  };

  // Função para verificar se é notificação de pagamento
  const isNotificacaoPagamento = (notificacao) => {
    if (!notificacao) return false;

    const dadosAdicionais = obterDadosAdicionais(notificacao);

    return !!dadosAdicionais.tipoPagamento || notificacao.titulo === 'Novo pagamento recebido';
  };

  // Função para verificar se é notificação de liberação de lote de pagamentos
  const isNotificacaoLiberarPagamento = (notificacao) => {
    if (!notificacao) return false;

    const dadosAdicionais = obterDadosAdicionais(notificacao);
    return dadosAdicionais.tipoNegocio === 'liberar_pagamento';
  };

  // Função para buscar pedido completo do backend
  const buscarPedidoCompleto = useCallback(async (pedidoId) => {
    try {
      const response = await axiosInstance.get(`/api/pedidos/${pedidoId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pedido completo:", error);
      showNotification("error", "Erro", "Erro ao carregar dados do pedido");
      return null;
    }
  }, []);

  // Função para abrir modal de visualização de pedido
  const handleAbrirVisualizarPedido = useCallback(async (notificacao) => {
    const dadosAdicionais = obterDadosAdicionais(notificacao);
    const pedidoId = dadosAdicionais?.pedidoId;

    if (!pedidoId) {
      showNotification("warning", "Atenção", "Não foi possível identificar o pedido da notificação");
      return;
    }

    setLoadingPedidoVisualizar(true);
    setVisualizarPedidoModalOpen(true);
    setPedidoParaVisualizar(null);

    try {
      const pedidoCompleto = await buscarPedidoCompleto(pedidoId);
      if (pedidoCompleto) {
        setPedidoParaVisualizar(pedidoCompleto);
      } else {
        setVisualizarPedidoModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao abrir visualização de pedido:", error);
      setVisualizarPedidoModalOpen(false);
    } finally {
      setLoadingPedidoVisualizar(false);
    }
  }, [buscarPedidoCompleto]);

  // Função para lidar com o clique na notificação
  const handleNotificacaoClick = async (notificacao) => {
    if (!notificacao || !notificacao.id) return;

    // Marcar como lida
    marcarComoLida(notificacao.id);

    // Se for notificação de liberação de lote de pagamento, buscar dados do lote e abrir modal
    if (isNotificacaoLiberarPagamento(notificacao)) {
      await handleAbrirModalLiberacao(notificacao);
      return;
    }

    // Se for notificação de pagamento, abrir modal de vinculação
    if (isNotificacaoPagamento(notificacao)) {
      await handleAbrirVinculacaoPagamento(notificacao);
      return;
    }

    // Se for notificação de pedido (incluindo pedido finalizado automaticamente), abrir modal de visualização com dados completos
    if (isNotificacaoPedido(notificacao)) {
      await handleAbrirVisualizarPedido(notificacao);
      return;
    }

    // Para outras notificações, abrir modal normalmente
    setNotificacaoSelecionada(notificacao);
    setModalAberto(true);
  };

  const carregarPedidosParaVinculacao = useCallback(async (lancamento, clienteRelacionado) => {
    setLoadingPedidosVinculacao(true);
    try {
      // Status de pedidos elegíveis para vinculação (mesmos do PagamentosAutomaticosModal)
      const STATUS_VINCULACAO = [
        "PRECIFICACAO_REALIZADA",
        "AGUARDANDO_PAGAMENTO",
        "PAGAMENTO_PARCIAL",
        "PAGAMENTO_REALIZADO",
        "PEDIDO_FINALIZADO",
      ];
      
      const statusCliente = STATUS_VINCULACAO.join(",");
      const paramsBase = { status: statusCliente };
      
      // Tentar obter clienteId de múltiplas fontes (como no PagamentosAutomaticosModal)
      const clienteId = clienteRelacionado?.id
        || lancamento?.cliente?.id
        || lancamento?.clienteId
        || lancamento?.pedido?.clienteId
        || null;

      let response;
      if (clienteId) {
        // Se tiver cliente, busca apenas pedidos do cliente específico
        response = await axiosInstance.get(`/api/pedidos/cliente/${clienteId}`, {
          params: paramsBase,
        });
      } else {
        // Se não tiver cliente, busca TODOS os pedidos do sistema
        response = await axiosInstance.get(`/api/pedidos`, {
          params: {
            status: statusCliente,
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

      // Cliente padrão para normalização dos pedidos
      const clienteDefault = clienteRelacionado 
        || lancamento?.cliente 
        || lancamento?.pedido?.cliente 
        || null;

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

  // Função para abrir modal de liberação de pagamento
  const handleAbrirModalLiberacao = async (notificacao) => {
    try {
      setLoadingLoteLiberacao(true);
      
      const dadosAdicionais = obterDadosAdicionais(notificacao);
      const numeroRequisicao = dadosAdicionais.numeroRequisicao;
      const origemTipo = dadosAdicionais.origemTipo; // TURMA_COLHEITA ou FOLHA_PAGAMENTO
      
      if (!numeroRequisicao) {
        showNotification('warning', 'Atenção', 'Dados incompletos na notificação. Não foi possível abrir o modal de liberação.');
        return;
      }
      
      // Determinar endpoint baseado no tipo de origem
      const endpoint = origemTipo === 'FOLHA_PAGAMENTO'
        ? '/api/pagamentos/lotes-folha-pagamento'
        : '/api/pagamentos/lotes-turma-colheita';
      
      // Buscar dados do lote pelo numeroRequisicao
      // A API retorna um objeto com paginação: { data: [...], total, page, limit }
      const response = await axiosInstance.get(endpoint, {
        params: {
          page: 1,
          limit: 1000, // Buscar muitos lotes para garantir que encontremos o lote
        },
      });
      
      // Extrair array de lotes da resposta (pode ser direto ou dentro de data)
      let lotes = [];
      if (Array.isArray(response.data)) {
        lotes = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        lotes = response.data.data;
      } else {
        console.error('Formato de resposta inesperado:', response.data);
        showNotification('error', 'Erro', 'Formato de resposta inesperado da API.');
        return;
      }
      
      // Buscar o lote pelo numeroRequisicao
      const loteEncontrado = lotes.find(lote => lote.numeroRequisicao === numeroRequisicao);
      
      if (!loteEncontrado) {
        showNotification('error', 'Erro', `Lote de pagamento ${numeroRequisicao} não encontrado.`);
        return;
      }
      
      // Abrir modal com os dados do lote
      setLoteParaLiberacao(loteEncontrado);
      setModalLiberacaoOpen(true);
      
    } catch (error) {
      console.error('Erro ao abrir modal de liberação:', error);
      const message = error.response?.data?.message || 'Erro ao carregar dados do lote de pagamento.';
      showNotification('error', 'Erro', message);
    } finally {
      setLoadingLoteLiberacao(false);
    }
  };

  // Função para liberar pagamento (chamada do modal)
  const handleLiberarPagamento = async (numeroRequisicao, indicadorFloat) => {
    try {
      setLiberandoLoteId(numeroRequisicao);
      await axiosInstance.post("/api/pagamentos/liberar", {
        numeroRequisicao,
        indicadorFloat,
      });
      showNotification("success", "Sucesso", "Pagamento liberado com sucesso!");
      setModalLiberacaoOpen(false);
      setLoteParaLiberacao(null);
      // Atualizar notificações após liberação
      buscarNotificacoes();
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

  // Função para abrir modal de vinculação de pagamento
  const handleAbrirVinculacaoPagamento = async (notificacao) => {
    try {
      setLoadingDadosPagamento(true);
      
      const dadosAdicionais = obterDadosAdicionais(notificacao);
      const lancamentoId = dadosAdicionais.lancamentoId;
      
      if (!lancamentoId) {
        showNotification('warning', 'Atenção', 'Dados incompletos na notificação. Não foi possível abrir o modal de vinculação.');
        return;
      }
      
      // Buscar lançamento completo (já inclui cliente)
      const lancamentoResponse = await axiosInstance.get(`/api/lancamentos-extrato/${lancamentoId}`);
      const lancamento = lancamentoResponse.data;
      
      if (!lancamento) {
        showNotification('error', 'Erro', 'Não foi possível carregar os dados do pagamento.');
        return;
      }
      
      // Abrir modal de vinculação
      // Sempre carrega pedidos automaticamente:
      // - Se tiver cliente: carrega pedidos do cliente
      // - Se não tiver cliente: carrega TODOS os pedidos do sistema (limit 1000)
      
      // Identificar cliente do lançamento (de múltiplas fontes, como no PagamentosAutomaticosModal)
      let clienteDoLancamento = null;
      if (lancamento.cliente) {
        clienteDoLancamento = lancamento.cliente;
      } else if (lancamento.clienteId) {
        clienteDoLancamento = { id: lancamento.clienteId };
      } else if (lancamento.pedido?.cliente) {
        clienteDoLancamento = lancamento.pedido.cliente;
      }

      setLancamentoParaVincular(lancamento);
      setClienteParaVinculacao(clienteDoLancamento);
      setPedidosVinculacao([]);
      setVinculacaoModalOpen(true);
      
      // Sempre carrega pedidos automaticamente (comportamento igual ao PagamentosAutomaticosModal)
      carregarPedidosParaVinculacao(lancamento, clienteDoLancamento);
       
    } catch (error) {
      console.error('Erro ao abrir modal de vinculação:', error);
      const message = error.response?.data?.message || 'Erro ao carregar dados do pagamento.';
      showNotification('error', 'Erro', message);
    } finally {
      setLoadingDadosPagamento(false);
    }
  };

  // Handler para executar vinculação (dupla operação)
  const handleVincularPagamento = async (lancamento, itensSelecionados) => {
    if (!Array.isArray(itensSelecionados) || itensSelecionados.length === 0) {
      showNotification('warning', 'Atenção', 'Selecione pelo menos um pedido para vincular');
      return;
    }

    try {
      const payload = {
        itens: itensSelecionados.map((item) => ({
          pedidoId: item.pedidoId,
          valorVinculado: item.valorVinculado,
        })),
      };

      await axiosInstance.post(
        `/api/lancamentos-extrato/${lancamento.id}/vinculos`,
        payload
      );

      const metodoPagamento = lancamento.categoriaOperacao === 'PIX_RECEBIDO'
        ? 'PIX'
        : lancamento.categoriaOperacao === 'PIX_ENVIADO'
          ? 'PIX'
          : 'TRANSFERENCIA';

      const dataPagamentoBase = moment(lancamento.dataLancamento)
        .startOf('day')
        .add(12, 'hours')
        .format('YYYY-MM-DD HH:mm:ss');

      for (const item of itensSelecionados) {
        const pedidoReferencia = item.pedido;
        const pagamentoData = {
          pedidoId: item.pedidoId,
          dataPagamento: dataPagamentoBase,
          valorRecebido: item.valorVinculado,
          metodoPagamento,
          contaDestino: 'ALENCAR',
          observacoesPagamento: `Vinculado do extrato bancário - ${lancamento.textoDescricaoHistorico || 'Sem descrição'}`,
        };

        await axiosInstance.post('/api/pedidos/pagamentos', pagamentoData);

        showNotification(
          'success',
          'Pagamento vinculado',
          `Pagamento de ${formatarValorMonetario(item.valorVinculado)} vinculado ao pedido ${pedidoReferencia?.numeroPedido || item.pedidoId} com sucesso!`
        );
      }

      setVinculacaoModalOpen(false);
      setLancamentoParaVincular(null);
      setClienteParaVinculacao(null);
      setPedidosVinculacao([]);

      buscarNotificacoes();
    } catch (error) {
      console.error('Erro ao vincular pagamento:', error);
      const message = error.response?.data?.message || 'Erro ao vincular pagamento ao pedido';
      showNotification('error', 'Erro', message);
      throw error;
    }
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
  };

  // Função para formatar data
  const formatarData = (notificacao) => {
    // Primeiro verificar se deve usar createdAt ou created_at
    const dataString = notificacao?.createdAt || notificacao?.created_at || notificacao?.data_criacao;

    if (!dataString) {
      return "Data não disponível";
    }

    try {
      // Usar moment para formatação
      const data = moment(dataString);

      // Verificar se é válido
      if (!data.isValid()) {
        return "Data não disponível";
      }

      // Formatar no padrão brasileiro
      return data.format("DD/MM/YYYY HH:mm");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data não disponível";
    }
  };

  // Verificar se é uma notificação de pedido
  const isNotificacaoPedido = (notificacao) => {
    if (!notificacao) return false;

    const dadosAdicionais = obterDadosAdicionais(notificacao);

    return !!dadosAdicionais.pedidoId || notificacao.titulo === 'Novo pedido adicionado';
  };

  // Renderização do tipo da notificação com cores específicas
  const renderTipo = (tipo) => {
    if (!tipo) return null;

    return (
      <Box
        sx={{
          backgroundColor: theme.palette.notifications[tipo] || theme.palette.notifications.sistema,
          color: "white",
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "12px",
          fontWeight: "bold",
          display: "inline-block",
          marginRight: "8px",
        }}
      >
        {tipo.toUpperCase()}
      </Box>
    );
  };

  // Renderização específica para notificações de pedido
  const renderNotificacaoPedido = (item) => {
    const dadosAdicionais = obterDadosAdicionais(item);

    // Obter lista de frutas (para mapear ícones)
    const frutas = dadosAdicionais.frutas || [];

    // Usar conteúdo do menu se disponível, senão usar conteúdo padrão
    const conteudoMenu = dadosAdicionais.menu?.conteudo || item.conteudo || '';
    const linhas = conteudoMenu.split('\n');

    // Função auxiliar para encontrar o nome da fruta em uma linha
    const encontrarNomeFruta = (linha) => {
      if (!linha.includes(' - ')) return null;

      // Extrair o nome da fruta (parte antes do " - ")
      const partes = linha.split(' - ');
      if (partes.length > 0) {
        const nomeFrutaLinha = partes[0].trim();

        // Se não há frutas na lista, retornar o nome da linha mesmo
        if (!frutas || frutas.length === 0) {
          return nomeFrutaLinha;
        }

        // Verificar se existe na lista de frutas (comparação case-insensitive e flexível)
        const frutaEncontrada = frutas.find(f => {
          if (!f || !f.nome) return false;
          const nomeFrutaLista = f.nome.toLowerCase().trim();
          const nomeFrutaLinhaLower = nomeFrutaLinha.toLowerCase().trim();

          // Comparação exata ou por inclusão
          return nomeFrutaLista === nomeFrutaLinhaLower ||
                 nomeFrutaLinhaLower.includes(nomeFrutaLista) ||
                 nomeFrutaLista.includes(nomeFrutaLinhaLower);
        });

        // Retornar o nome original da lista de frutas se encontrado, senão usar o da linha
        return frutaEncontrada ? frutaEncontrada.nome : nomeFrutaLinha;
      }
      return null;
    };

    const isNaoLida = item?.status === "nao_lida" || item?.status === "NAO_LIDA" || (!item?.lida && !item?.status);

    return (
      <Box
        sx={{
          position: "relative",
          padding: "12px",
          paddingLeft: isNaoLida ? "16px" : "12px",
          marginBottom: "8px",
          borderRadius: "4px",
          backgroundColor: theme.palette.background.paper,
          cursor: "pointer",
          border: `1px solid ${theme.palette.ui.border}`,
          borderLeft: isNaoLida ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.ui.border}`,
          boxShadow: isNaoLida ? `0 1px 3px rgba(0, 0, 0, 0.08)` : "none",
          "&:hover": {
            backgroundColor: theme.palette.background.hover,
            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.12)`,
          },
        }}
        onClick={() => handleNotificacaoClick(item)}
      >
        {/* Título */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isNaoLida && (
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "700",
                fontSize: "15px",
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {item?.titulo || "Novo pedido adicionado"}
            </Typography>
          </Box>
          <Tooltip title="Remover notificação">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (item?.id) descartarNotificacao(item.id);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Conteúdo formatado */}
        <Box>
          {linhas.map((linha, index) => {
            const linhaTrim = linha.trim();

            // Linha vazia (espaçamento) - reduzido para 2px
            if (!linhaTrim) {
              return <Box key={index} sx={{ height: "2px" }} />;
            }

            // Linha de cliente - COM BOLD
            if (linhaTrim.startsWith('Cliente:')) {
              return (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    mb: 0.25,
                    fontSize: "13px",
                    color: theme.palette.text.primary,
                    fontWeight: "bold",
                  }}
                >
                  {linhaTrim}
                </Typography>
              );
            }

            // Linha de fruta e quantidade (contém " - " mas não "Prev.")
            if (linhaTrim.includes(' - ') && !linhaTrim.includes('Prev.')) {
              const nomeFruta = encontrarNomeFruta(linhaTrim);

              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 0.25,
                    gap: 0.5,
                  }}
                >
                  {/* Ícone pequeno da fruta */}
                  {nomeFruta && (
                    <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      {getFruitIcon(nomeFruta, { width: 16, height: 16 })}
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.primary,
                      fontWeight: "normal", // SEM BOLD
                    }}
                  >
                    {linhaTrim}
                  </Typography>
                </Box>
              );
            }

            // Linha de data prevista colheita - mais discreta
            if (linhaTrim.includes('Prev. Colheita:')) {
              return (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    mt: 0.75,
                    mb: 0,
                    fontSize: "11px",
                    color: theme.palette.text.muted || theme.palette.text.secondary,
                    fontStyle: "italic",
                  }}
                >
                  {linhaTrim}
                </Typography>
              );
            }

            // Outras linhas
            return (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  mb: 0.25,
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                }}
              >
                {linhaTrim}
              </Typography>
            );
          })}
        </Box>

        <Divider sx={{ my: 1, borderColor: theme.palette.ui.border }} />

        {/* Data da notificação */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: theme.palette.text.muted || theme.palette.text.secondary,
            fontSize: "11px",
          }}
        >
          {formatarData(item)}
        </Typography>
      </Box>
    );
  };

  // Renderização específica para notificações de liberação de lote de pagamentos
  const renderNotificacaoLiberarPagamento = (item) => {
    const dadosAdicionais = obterDadosAdicionais(item);
    const numeroRequisicao = dadosAdicionais.numeroRequisicao;
    const conta = dadosAdicionais.contaCorrente;
    const valorBase =
      (typeof dadosAdicionais.valorTotalValido === "number"
        ? dadosAdicionais.valorTotalValido
        : dadosAdicionais.valorTotalEnviado) || 0;

    const origemTipo = dadosAdicionais.origemTipo;
    const origemNome = dadosAdicionais.origemNome;

    const origemLabel = origemTipo && origemNome
      ? `Origem: ${origemTipo.replace(/_/g, " ").toUpperCase()} - ${origemNome}`
      : origemTipo
      ? `Origem: ${origemTipo.replace(/_/g, " ").toUpperCase()}`
      : origemNome
      ? `Origem: ${origemNome}`
      : null;

    const isNaoLida =
      item?.status === "nao_lida" ||
      item?.status === "NAO_LIDA" ||
      (!item?.lida && !item?.status);

    return (
      <Box
        sx={{
          position: "relative",
          padding: "12px",
          paddingLeft: isNaoLida ? "16px" : "12px",
          marginBottom: "8px",
          borderRadius: "4px",
          backgroundColor: theme.palette.background.paper,
          cursor: "pointer",
          border: `1px solid ${theme.palette.ui.border}`,
          borderLeft: isNaoLida
            ? `3px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.ui.border}`,
          boxShadow: isNaoLida ? `0 1px 3px rgba(0, 0, 0, 0.08)` : "none",
          "&:hover": {
            backgroundColor: theme.palette.background.hover,
            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.12)`,
          },
        }}
        onClick={() => handleNotificacaoClick(item)}
      >
        {/* Título */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isNaoLida && (
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
            )}
            {renderTipo(item?.tipo || "SISTEMA")}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "700",
                fontSize: "15px",
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {item?.titulo || "Lote de pagamentos criado para liberação"}
            </Typography>
          </Box>
          <Tooltip title="Remover notificação">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (item?.id) descartarNotificacao(item.id);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Conteúdo */}
        <Box>
          {numeroRequisicao != null && (
            <Typography
              variant="body2"
              sx={{
                mb: 0.25,
                fontSize: "13px",
                color: theme.palette.text.primary,
                fontWeight: "bold",
              }}
            >
              {`Lote: ${numeroRequisicao}`}
            </Typography>
          )}

          {conta && (
            <Typography
              variant="body2"
              sx={{
                mb: 0.25,
                fontSize: "13px",
                color: theme.palette.text.primary,
              }}
            >
              {`Conta: ${conta.agencia} / ${conta.contaCorrente}`}
            </Typography>
          )}

          {origemLabel && (
            <Typography
              variant="body2"
              sx={{
                mb: 0.25,
                fontSize: "13px",
                color: theme.palette.text.secondary,
              }}
            >
              {origemLabel}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              mb: 0.25,
              fontSize: "13px",
              color: theme.palette.text.primary,
            }}
          >
            {`Valor total: R$ ${formatarValorMonetario(valorBase)}`}
          </Typography>
        </Box>

        <Divider sx={{ my: 1, borderColor: theme.palette.ui.border }} />

        {/* Data da notificação */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: theme.palette.text.muted || theme.palette.text.secondary,
            fontSize: "11px",
          }}
        >
          {formatarData(item)}
        </Typography>
      </Box>
    );
  };
  const renderNotificacaoPagamento = (item) => {
    const dadosAdicionais = obterDadosAdicionais(item);
    const conteudoMenu = dadosAdicionais.menu?.conteudo || item.conteudo || '';
    const linhasConteudo = conteudoMenu.split('\n');

    const nomeCliente = dadosAdicionais.clienteNome
      || linhasConteudo.find((linha) => linha.toLowerCase().startsWith('cliente:'))?.split(':')[1]?.trim()
      || 'Cliente não identificado';

    let valorBruto = dadosAdicionais.valor;
    let valorFormatado = undefined;
    if (valorBruto !== undefined && valorBruto !== null && !Number.isNaN(Number(valorBruto))) {
      valorFormatado = formatarValorMonetario(Number(valorBruto));
    } else {
      const linhaValor = linhasConteudo.find((linha) => linha.toLowerCase().startsWith('valor:'));
      valorFormatado = linhaValor ? linhaValor.split(':')[1]?.trim() : undefined;
    }
    const valorTexto = valorFormatado || 'Valor não informado';

    const isNaoLida = item?.status === 'nao_lida' || item?.status === 'NAO_LIDA' || (!item?.lida && !item?.status);

    return (
      <Box
        sx={{
          position: 'relative',
          padding: '12px',
          paddingLeft: isNaoLida ? '16px' : '12px',
          marginBottom: '8px',
          borderRadius: '4px',
          backgroundColor: theme.palette.background.paper,
          cursor: 'pointer',
          border: `1px solid ${theme.palette.ui.border}`,
          borderLeft: isNaoLida ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.ui.border}`,
          boxShadow: isNaoLida ? `0 1px 3px rgba(0, 0, 0, 0.08)` : 'none',
          '&:hover': {
            backgroundColor: theme.palette.background.hover,
            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.12)`,
          },
        }}
        onClick={() => handleNotificacaoClick(item)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isNaoLida && (
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '15px',
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {item?.titulo || 'Novo pagamento recebido'}
            </Typography>
          </Box>
          <Tooltip title="Remover notificação">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (item?.id) descartarNotificacao(item.id);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontSize: '13px',
            color: theme.palette.text.primary,
            fontWeight: 'bold',
          }}
        >
          {`Cliente: ${nomeCliente}`}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              color: theme.palette.text.primary,
            }}
          >
            {`Valor: ${valorTexto}`}
          </Typography>
          {item?.tipo && renderTipo(item.tipo)}
        </Box>

        <Divider sx={{ my: 1, borderColor: theme.palette.ui.border }} />

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: theme.palette.text.muted || theme.palette.text.secondary,
            fontSize: '11px',
          }}
        >
          {formatarData(item)}
        </Typography>
      </Box>
    );
  };

  // Garantir que notificacoes seja um array e filtrar corretamente
  const notificacoesSeguras = Array.isArray(notificacoes) ? notificacoes : [];
  const notificacoesAtivas = notificacoesSeguras.filter(
    (n) => n && n.status !== "descartada"
  );

  // Notificações a serem exibidas (limitadas)
  const notificacoesExibidas = notificacoesAtivas.slice(0, limiteExibicao);
  const temMaisNotificacoes = notificacoesAtivas.length > limiteExibicao;

  // Função para carregar mais notificações
  const handleCarregarMais = () => {
    setLimiteExibicao((prev) => prev + 50);
  };

  const content = (
    <Box
      sx={{
        width: isMobile ? 280 : 350,
        maxHeight: isMobile ? 300 : 400,
        overflow: "auto",
        p: isMobile ? 1.5 : 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6">Notificações</Typography>
        <Tooltip title="Marcar todas como lidas" placement="left">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              marcarTodasComoLidas();
            }}
          >
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notificacoesAtivas.length > 0 ? (
        <>
          {notificacoesExibidas.map((item) => {
          // Renderizar notificação de liberação de lote de pagamentos (tipoNegocio = liberar_pagamento)
          if (isNotificacaoLiberarPagamento(item)) {
            return (
              <Box key={item?.id || Math.random()}>
                {renderNotificacaoLiberarPagamento(item)}
              </Box>
            );
          }

          // Renderizar notificação de pedido com layout customizado
          if (isNotificacaoPedido(item)) {
            return (
              <Box key={item?.id || Math.random()}>
                {renderNotificacaoPedido(item)}
              </Box>
            );
          }

          // Renderizar notificação de pagamento com layout customizado
          if (isNotificacaoPagamento(item)) {
            return (
              <Box key={item?.id || Math.random()}>
                {renderNotificacaoPagamento(item)}
              </Box>
            );
          }

          // Renderizar notificação padrão
          const isNaoLidaPadrao = item?.status === "nao_lida" || item?.status === "NAO_LIDA" || (!item?.lida && !item?.status);

          return (
            <Box
              key={item?.id || Math.random()}
              sx={{
                position: "relative",
                padding: "10px",
                paddingLeft: isNaoLidaPadrao ? "16px" : "10px",
                marginBottom: "8px",
                borderRadius: "4px",
                backgroundColor: theme.palette.background.paper,
                cursor: "pointer",
                border: `1px solid ${theme.palette.ui.border}`,
                borderLeft: isNaoLidaPadrao ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.ui.border}`,
                boxShadow: isNaoLidaPadrao ? `0 1px 3px rgba(0, 0, 0, 0.08)` : "none",
                "&:hover": {
                  backgroundColor: theme.palette.background.hover,
                  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.12)`,
                },
              }}
              onClick={() => handleNotificacaoClick(item)}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {isNaoLidaPadrao && (
                    <Box
                      sx={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {renderTipo(item?.tipo)}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "600",
                    }}
                  >
                    {item?.titulo || "Sem título"}
                  </Typography>
                </Box>
                <Tooltip title="Remover notificação">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item?.id) descartarNotificacao(item.id);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="body2" sx={{ mb: 1 }}>
                {item?.conteudo || "Sem conteúdo"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatarData(item)}
              </Typography>
            </Box>
          );
          })}
          
          {/* Botão "Carregar mais" */}
          {temMaisNotificacoes && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCarregarMais}
                sx={{
                  textTransform: "none",
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                  "&:hover": {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                Carregar mais ({notificacoesAtivas.length - limiteExibicao} restantes)
              </Button>
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 100,
          }}
        >
          <Typography color="textSecondary">
            Nenhuma notificação disponível
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Verificar se naoLidas é um número válido
  const badgeCount =
    typeof naoLidas === "number" && !isNaN(naoLidas) ? naoLidas : 0;

  return (
    <>
      <Popover
        content={content}
        trigger="click"
        placement="bottomRight"
        overlayStyle={{ width: isMobile ? 280 : 350 }}
        open={popoverAberto}
        onOpenChange={(open) => {
          setPopoverAberto(open);
          if (open) {
            buscarNotificacoes();
          }
        }}
      >
        <IconButton
          color="inherit"
          onClick={handleIconClick}
          size={isMobile ? "small" : "medium"}
          sx={{
            padding: { xs: "6px", sm: "8px" },
          }}
        >
          <Badge badgeContent={badgeCount} color="error">
            <NotificationsIcon fontSize={isMobile ? "small" : "medium"} />
          </Badge>
        </IconButton>
      </Popover>

      {/* Modal de detalhes da notificação */}
      <NotificacaoDetalheModal
        notificacao={notificacaoSelecionada}
        open={modalAberto}
        onClose={fecharModal}
      />

      {/* Modal de vinculação de pagamento */}
      {lancamentoParaVincular && (
        <VincularPagamentoManualModal
          open={vinculacaoModalOpen}
          onClose={() => {
            setVinculacaoModalOpen(false);
            setLancamentoParaVincular(null);
            setClienteParaVinculacao(null);
            setPedidosVinculacao([]);
          }}
          lancamento={lancamentoParaVincular}
          cliente={clienteParaVinculacao}
          pedidosDisponiveis={pedidosVinculacao}
          loadingPedidos={loadingPedidosVinculacao}
          onVincular={handleVincularPagamento}
        />
      )}

      {/* Loader centralizado para busca de dados do pagamento */}
      <CentralizedLoader
        visible={loadingDadosPagamento}
        message="Carregando dados do pagamento..."
        subMessage="Buscando lançamento e informações do cliente"
      />

      {/* Loader centralizado para busca de dados do lote de liberação */}
      <CentralizedLoader
        visible={loadingLoteLiberacao}
        message="Carregando dados do lote de pagamento..."
        subMessage="Buscando informações do lote para liberação"
      />

      {/* Modal de liberação de pagamento */}
      <LotePagamentosDetalhesModal
        open={modalLiberacaoOpen}
        onClose={() => {
          if (!liberandoLoteId) {
            setModalLiberacaoOpen(false);
            setLoteParaLiberacao(null);
          }
        }}
        lote={loteParaLiberacao}
        loadingLiberacao={!!liberandoLoteId}
        onConfirmLiberacao={async (lote) => {
          // Usar indicadorFloat 'S' (produção)
          await handleLiberarPagamento(lote.numeroRequisicao, 'S');
        }}
      />

      {/* Modal de visualização de pedido */}
      <VisualizarPedidoModal
        open={visualizarPedidoModalOpen}
        onClose={() => {
          setVisualizarPedidoModalOpen(false);
          setPedidoParaVisualizar(null);
        }}
        pedido={pedidoParaVisualizar}
        loading={loadingPedidoVisualizar}
      />
    </>
  );
};

export default NotificacaoMenu;
