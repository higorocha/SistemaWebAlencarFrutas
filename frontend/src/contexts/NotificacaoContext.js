// src/contexts/NotificacaoContext.js

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import axiosInstance from "../api/axiosConfig";
import { showNotification, showPedidoNotification } from "../config/notificationConfig";
import useSocket from "../hooks/useSocket";

const NotificacaoContext = createContext();

export const useNotificacao = () => useContext(NotificacaoContext);

export const NotificacaoProvider = ({ children }) => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);

  // Verificar autenticação baseado na presença do token no localStorage
  const isAuthenticated = !!localStorage.getItem("alencar_frutas_token");
  
  // Obter ID do usuário logado
  const getUserId = () => {
    try {
      const userData = localStorage.getItem("alencar_frutas_user");
      if (userData) {
        const user = JSON.parse(userData);
        return user?.id;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // NOVO: Configurar Socket.io
  const { on, off, isConnected } = useSocket();

  // Função para verificar se a notificação já foi exibida como toast
  const foiExibidaComoToast = (notificacaoId) => {
    const toastsExibidos = JSON.parse(
      localStorage.getItem("notificacoes_toast_exibidas") || "[]"
    );
    return toastsExibidos.includes(notificacaoId);
  };

  // Função para marcar notificação como exibida em toast
  const marcarComoExibidaEmToast = (notificacaoId) => {
    const toastsExibidos = JSON.parse(
      localStorage.getItem("notificacoes_toast_exibidas") || "[]"
    );
    toastsExibidos.push(notificacaoId);
    // Limitar o tamanho da lista para evitar que cresça indefinidamente
    if (toastsExibidos.length > 100) {
      toastsExibidos.shift(); // Remove o item mais antigo
    }
    localStorage.setItem(
      "notificacoes_toast_exibidas",
      JSON.stringify(toastsExibidos)
    );
  };

  // Função para formatar o texto do toast baseado na nova estrutura
  const formatarTextoToast = (notificacao) => {
    // Parsear dados_adicionais se for string
    let dadosAdicionais = notificacao.dados_adicionais || notificacao.dadosAdicionais;
    if (typeof dadosAdicionais === 'string') {
      try {
        dadosAdicionais = JSON.parse(dadosAdicionais || '{}');
      } catch (error) {
        console.error('Erro ao parsear dados_adicionais no toast:', error);
        dadosAdicionais = {};
      }
    }
    
    // Se tem estrutura de toast definida, usa ela
    if (dadosAdicionais?.toast) {
      return {
        titulo: dadosAdicionais.toast.titulo,
        conteudo: dadosAdicionais.toast.conteudo,
        tipo: dadosAdicionais.toast.tipo
      };
    }
    
    // Fallback padrão para notificações sem estrutura específica
    return {
      titulo: notificacao.titulo,
      conteudo: notificacao.conteudo,
      tipo: 'info'
    };
  };

  // Função de busca de notificações
  const buscarNotificacoes = async (silencioso = false) => {
    if (!isAuthenticated) return;

    try {
      if (!silencioso) setLoading(true);
      const response = await axiosInstance.get("/api/notificacoes");
      const { notificacoes: novasNotificacoes, nao_lidas: novasNaoLidas } = response.data;

      setNotificacoes(novasNotificacoes);
      setNaoLidas(novasNaoLidas);

      // Exibir toasts para notificações não lidas que ainda não foram exibidas
      // IMPORTANTE: Só exibir toasts na busca inicial (silencioso=false) para evitar duplicação
      if (!silencioso) {
        novasNotificacoes
          .filter(notificacao => {
            // Verificar status de diferentes formas (compatibilidade)
            const naoLida = notificacao.status === 'NAO_LIDA' || 
                           notificacao.status === 'nao_lida' || 
                           notificacao.status === 'NAO_LIDA' ||
                           (!notificacao.lida && !notificacao.status);
            return naoLida && !foiExibidaComoToast(notificacao.id);
          })
          .forEach(notificacao => {
            // Marcar como exibida ANTES de exibir para evitar duplicação
            marcarComoExibidaEmToast(notificacao.id);
            
            const toastInfo = formatarTextoToast(notificacao);
            const titulo = toastInfo.titulo || notificacao.titulo || 'Notificação';
            const tipo = toastInfo.tipo || 'info';
            
            // Verificar se é notificação de pedido ou boleto para usar layout customizado
            const dadosAdicionais = typeof notificacao.dadosAdicionais === 'string'
              ? JSON.parse(notificacao.dadosAdicionais || '{}')
              : notificacao.dadosAdicionais || {};
            
            // Verificar se é notificação de boleto pago
            const isNotificacaoBoleto = !!dadosAdicionais.tipoPagamentoBoleto || 
                                       (notificacao.tipo === 'BOLETO' && dadosAdicionais.boletoId);
            
            // Verificar se é notificação de pagamento via extrato bancário
            const isNotificacaoPagamentoExtrato = !!dadosAdicionais.tipoPagamento && !isNotificacaoBoleto;
            
            if (isNotificacaoBoleto || isNotificacaoPagamentoExtrato) {
              // Notificações de pagamento (boleto ou extrato): usar toast diretamente
              const conteudo = typeof toastInfo.conteudo === 'string' 
                ? toastInfo.conteudo 
                : (notificacao.conteudo || '');
              showNotification(tipo, titulo, conteudo);
            } else if (dadosAdicionais.pedidoId || dadosAdicionais.toast) {
              // Notificação de pedido: tentar extrair cliente e frutas para layout customizado
              const conteudoToast = dadosAdicionais.toast?.conteudo || notificacao.conteudo || '';
              const linhas = conteudoToast.split('\n').filter(l => l.trim());
              
              // Encontrar linha do cliente e extrair apenas o nome
              const linhaCliente = linhas.find(l => l.trim().startsWith('Cliente:'));
              let cliente = '';
              if (linhaCliente) {
                let clienteTexto = linhaCliente.trim().replace(/^Cliente:\s*/, '').trim();
                if (clienteTexto.includes(' - ')) {
                  cliente = clienteTexto.split(' - ')[0].trim();
                } else {
                  cliente = clienteTexto;
                }
              }
              
              // Encontrar frutas
              const frutas = linhas
                .filter(l => {
                  const linha = l.trim();
                  return linha.includes(' - ') && 
                         !linha.includes('Prev.') && 
                         !linha.startsWith('Cliente:');
                })
                .map(l => l.trim());
              
              // Se tem cliente e frutas, usar layout customizado
              if (cliente && frutas.length > 0) {
                const frutasComDados = dadosAdicionais.frutas || [];
                showPedidoNotification(tipo, titulo, cliente, frutas, frutasComDados);
              } else {
                // Fallback para notificação padrão
                const conteudo = typeof toastInfo.conteudo === 'string' 
                  ? toastInfo.conteudo 
                  : (notificacao.conteudo || '');
                showNotification(tipo, titulo, conteudo);
              }
            } else {
              // Notificação padrão
              const conteudo = typeof toastInfo.conteudo === 'string' 
                ? toastInfo.conteudo 
                : (notificacao.conteudo || '');
              showNotification(tipo, titulo, conteudo);
            }
          });
      }

    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      if (!silencioso) {
        message.error("Erro ao carregar notificações");
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // Função para marcar notificação como lida
  const marcarComoLida = async (id) => {
    try {
      await axiosInstance.patch(`/api/notificacoes/${id}/ler`);
      
      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
      
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      message.error("Erro ao marcar notificação como lida");
    }
  };

  // Função para marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    try {
      await axiosInstance.patch("/api/notificacoes/ler-todas");
      
      setNotificacoes(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );
      
      setNaoLidas(0);
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      message.error("Erro ao marcar todas as notificações como lidas");
    }
  };

  // Função para descartar notificação
  const descartarNotificacao = async (id) => {
    try {
      await axiosInstance.patch(`/api/notificacoes/${id}/descartar`);
      
      setNotificacoes(prev => prev.filter(notif => notif.id !== id));
      
      // Verificar se a notificação era não lida para ajustar o contador
      const notificacaoDescartada = notificacoes.find(notif => notif.id === id);
      if (notificacaoDescartada && !notificacaoDescartada.lida) {
        setNaoLidas(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erro ao descartar notificação:", error);
      message.error("Erro ao descartar notificação");
    }
  };

  // Callback para novas notificações via Socket.io
  const handleNovaNotificacao = useCallback((data) => {
    const novaNotificacao = data.notificacao;
    if (!novaNotificacao?.id) return;

    const notificacaoId = novaNotificacao.id;
    const naoLida = novaNotificacao.status === 'NAO_LIDA' ||
                    novaNotificacao.status === 'nao_lida' ||
                    (!novaNotificacao.lida && !novaNotificacao.status);
    const jaExibida = foiExibidaComoToast(notificacaoId);

    // Verificar se já existe na lista ANTES de atualizar
    let ehNovaNotificacao = false;
    setNotificacoes(prev => {
      const jaExiste = prev.some(notif => notif.id === notificacaoId);
      ehNovaNotificacao = !jaExiste;

      if (jaExiste) {
        return prev.map(notif => notif.id === notificacaoId ? novaNotificacao : notif);
      }
      return [novaNotificacao, ...prev];
    });

    // Incrementar contador se for nova notificação não lida
    if (ehNovaNotificacao && naoLida && !jaExibida) {
      setNaoLidas(count => (count || 0) + 1);
    }
    
    // Exibir toast
    if (!jaExibida) {
      marcarComoExibidaEmToast(notificacaoId);
      const toastInfo = formatarTextoToast(novaNotificacao);
      const titulo = toastInfo.titulo || novaNotificacao.titulo || 'Notificação';
      const tipo = toastInfo.tipo || 'info';
      
      // Verificar se é notificação de pedido ou boleto para usar layout customizado
      const dadosAdicionais = typeof novaNotificacao.dadosAdicionais === 'string'
        ? JSON.parse(novaNotificacao.dadosAdicionais || '{}')
        : novaNotificacao.dadosAdicionais || {};
      
      // Verificar se é notificação de boleto pago
      const isNotificacaoBoleto = !!dadosAdicionais.tipoPagamentoBoleto || 
                                   (novaNotificacao.tipo === 'BOLETO' && dadosAdicionais.boletoId);
      
      // Verificar se é notificação de pagamento via extrato bancário
      const isNotificacaoPagamentoExtrato = !!dadosAdicionais.tipoPagamento && !isNotificacaoBoleto;
      
      if (isNotificacaoBoleto || isNotificacaoPagamentoExtrato) {
        // Notificações de pagamento (boleto ou extrato): usar toast diretamente
        const conteudo = typeof toastInfo.conteudo === 'string' 
          ? toastInfo.conteudo 
          : (novaNotificacao.conteudo || '');
        showNotification(tipo, titulo, conteudo);
      } else if (dadosAdicionais.pedidoId || dadosAdicionais.toast) {
        // Notificação de pedido: tentar extrair cliente e frutas para layout customizado
        const conteudoToast = dadosAdicionais.toast?.conteudo || novaNotificacao.conteudo || '';
        const linhas = conteudoToast.split('\n').filter(l => l.trim());
        
        // Encontrar linha do cliente e extrair apenas o nome
        const linhaCliente = linhas.find(l => l.trim().startsWith('Cliente:'));
        let cliente = '';
        if (linhaCliente) {
          // Remover "Cliente:" e extrair apenas o nome (antes do primeiro " - " se houver)
          let clienteTexto = linhaCliente.trim().replace(/^Cliente:\s*/, '').trim();
          // Se contém " - ", pegar apenas a parte antes (nome do cliente)
          if (clienteTexto.includes(' - ')) {
            cliente = clienteTexto.split(' - ')[0].trim();
          } else {
            cliente = clienteTexto;
          }
        }
        
        // Encontrar frutas (linhas que contêm " - " mas não "Prev." e não começam com "Cliente:")
        const frutas = linhas
          .filter(l => {
            const linha = l.trim();
            return linha.includes(' - ') && 
                   !linha.includes('Prev.') && 
                   !linha.startsWith('Cliente:');
          })
          .map(l => l.trim());
        
        // Se tem cliente e frutas, usar layout customizado
        if (cliente && frutas.length > 0) {
          const frutasComDados = dadosAdicionais.frutas || [];
          showPedidoNotification(tipo, titulo, cliente, frutas, frutasComDados);
        } else {
          // Fallback para notificação padrão
          const conteudo = typeof toastInfo.conteudo === 'string' 
            ? toastInfo.conteudo 
            : (novaNotificacao.conteudo || '');
          showNotification(tipo, titulo, conteudo);
        }
      } else {
        // Notificação padrão
        const conteudo = typeof toastInfo.conteudo === 'string' 
          ? toastInfo.conteudo 
          : (novaNotificacao.conteudo || '');
        showNotification(tipo, titulo, conteudo);
      }
    }
  }, []);

  // Set para rastrear notificações já processadas via Socket.io (evitar duplicação)
  const notificacoesProcessadasRef = useRef(new Set());
  const handlerRef = useRef(null);
  const listenerRegistradoRef = useRef(false);
  
  // Criar handler estável que não muda entre renders
  if (!handlerRef.current) {
    handlerRef.current = (data) => {
      const notificacao = data?.notificacao;
      if (!notificacao?.id) return;

      // FILTRO CRÍTICO: Verificar se a notificação é para este usuário
      const userId = getUserId();
      const notificacaoUserId = notificacao.usuario_id || notificacao.usuarioId;

      // Se a notificação tem usuarioId, deve ser para o usuário logado
      // Se não tem usuarioId, é notificação global (processar)
      if (notificacaoUserId && userId && notificacaoUserId !== userId) {
        return;
      }

      const id = notificacao.id;

      // Verificar e marcar IMEDIATAMENTE para evitar processamento duplicado
      if (notificacoesProcessadasRef.current.has(id)) {
        return;
      }
      notificacoesProcessadasRef.current.add(id);

      // Limpar IDs antigos (manter últimos 50)
      if (notificacoesProcessadasRef.current.size > 100) {
        const ids = Array.from(notificacoesProcessadasRef.current);
        notificacoesProcessadasRef.current = new Set(ids.slice(-50));
      }

      handleNovaNotificacao(data);
    };
  }
  
  // Configurar Socket.io quando autenticado - APENAS UMA VEZ
  useEffect(() => {
    if (!isAuthenticated) return;
    if (listenerRegistradoRef.current) return;
    
    // Registrar listener apenas uma vez com handler estável
    listenerRegistradoRef.current = true;
    on('nova_notificacao', handlerRef.current);
    
    return () => {
      listenerRegistradoRef.current = false;
      off('nova_notificacao', handlerRef.current);
    };
  }, [isAuthenticated, on, off]);

  // Buscar notificações quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      buscarNotificacoes(true); // Busca silenciosa inicial
    }
  }, [isAuthenticated]);

  const value = {
    notificacoes,
    naoLidas,
    loading,
    buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    descartarNotificacao,
    isConnected
  };

  return (
    <NotificacaoContext.Provider value={value}>
      {children}
    </NotificacaoContext.Provider>
  );
};