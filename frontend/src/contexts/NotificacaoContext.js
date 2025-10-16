// src/contexts/NotificacaoContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { message } from "antd";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
import useSocket from "../hooks/useSocket";

const NotificacaoContext = createContext();

export const useNotificacao = () => useContext(NotificacaoContext);

export const NotificacaoProvider = ({ children }) => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);

  // Verificar autenticação baseado na presença do token no localStorage
  const isAuthenticated = !!localStorage.getItem("alencar_frutas_token");

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
    // Se tem estrutura de toast definida, usa ela
    if (notificacao.dados_adicionais?.toast) {
      return {
        titulo: notificacao.dados_adicionais.toast.titulo,
        conteudo: notificacao.dados_adicionais.toast.conteudo,
        tipo: notificacao.dados_adicionais.toast.tipo
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
      novasNotificacoes
        .filter(notificacao => !notificacao.lida && !foiExibidaComoToast(notificacao.id))
        .forEach(notificacao => {
          const toastInfo = formatarTextoToast(notificacao);
          
          // Se formatarTextoToast retorna um objeto, extrair as propriedades
          let titulo = notificacao.titulo;
          let conteudoToast = toastInfo;
          
          if (typeof toastInfo === 'object' && toastInfo.titulo) {
            titulo = toastInfo.titulo;
            conteudoToast = toastInfo.conteudo;
          }

          showNotification(
            toastInfo.tipo || 'info',
            titulo,
            conteudoToast
          );

          // Marcar como exibida em toast
          marcarComoExibidaEmToast(notificacao.id);
        });

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
    
    // Adicionar à lista de notificações
    setNotificacoes(prev => [novaNotificacao, ...prev]);
    
    // Incrementar contador de não lidas
    setNaoLidas(prev => prev + 1);
    
    // Exibir toast se não foi exibida antes
    if (!foiExibidaComoToast(novaNotificacao.id)) {
      const toastInfo = formatarTextoToast(novaNotificacao);
      
      // Se formatarTextoToast retorna um objeto, extrair as propriedades
      let titulo = novaNotificacao.titulo;
      let conteudoToast = toastInfo;
      
      if (typeof toastInfo === 'object' && toastInfo.titulo) {
        titulo = toastInfo.titulo;
        conteudoToast = toastInfo.conteudo;
      }

      showNotification(
        toastInfo.tipo || 'info',
        titulo,
        conteudoToast
      );

      // Marcar como exibida em toast
      marcarComoExibidaEmToast(novaNotificacao.id);
    }
  }, []);

  // Configurar Socket.io quando autenticado
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      on('nova_notificacao', handleNovaNotificacao);
      
      return () => {
        off('nova_notificacao', handleNovaNotificacao);
      };
    }
  }, [isAuthenticated, isConnected, on, off, handleNovaNotificacao]);

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