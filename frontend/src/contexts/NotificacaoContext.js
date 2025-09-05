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

  // Função para formatar o texto do toast baseado no tipo de notificação
  const formatarTextoToast = (notificacao) => {
    switch (notificacao.tipo) {
      case "boleto": {
        // Extrair nome e valor dos dados adicionais ou do conteúdo
        let nome = "Cliente";
        let valor = "0,00";

        try {
          // Tentar extrair do conteúdo primeiro
          const conteudo = notificacao.conteudo;

          // Para boletos, vamos simplificar a mensagem
          // Formato esperado: "O Irrigante [NOME] pagou um boleto..."
          const match = conteudo.match(/O Irrigante (.*?) pagou um boleto/);
          if (match && match[1]) {
            nome = match[1];
          }

          // Extrair valor "no valor de R$ XX.XX"
          const valorMatch = conteudo.match(/no valor de R\$ ([\d,.]+)/);
          if (valorMatch && valorMatch[1]) {
            const valorOriginal = valorMatch[1];

            // Determinar formato e converter corretamente
            let valorNumerico;
            if (valorOriginal.includes(",")) {
              // Formato com vírgula decimal (brasileiro)
              valorNumerico = parseFloat(
                valorOriginal.replace(/\./g, "").replace(",", ".")
              );
            } else {
              // Formato com ponto decimal (americano) ou número simples
              valorNumerico = parseFloat(valorOriginal);
            }

            if (!isNaN(valorNumerico)) {
              // Formatar para padrão brasileiro
              valor = valorNumerico.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            } else {
              valor = valorOriginal;
            }
          }
        } catch (e) {
          // Erro silencioso ao extrair informações da notificação
        }

        return `${nome} pagou um boleto no valor de R$ ${valor}.`;
      }
      case "pix":
        return `Novo pagamento PIX recebido.`;

      case "sistema":
        // Para notificações de avisos enviados (detectar pelo título)
        if (notificacao.titulo?.includes('Notificação de')) {
          try {
            const dadosAdicionais = typeof notificacao.dados_adicionais === 'string' 
              ? JSON.parse(notificacao.dados_adicionais) 
              : notificacao.dados_adicionais;
            
            if (dadosAdicionais) {
              const tipoAviso = dadosAdicionais.tipo_aviso || 'avisos';
              const totalSucessos = dadosAdicionais.total_sucessos || 0;
              const emailEnviados = dadosAdicionais.email_enviados || 0;
              const whatsappEnviados = dadosAdicionais.whatsapp_enviados || 0;
              
              let textoCanais = '';
              if (emailEnviados > 0 && whatsappEnviados > 0) {
                textoCanais = `${emailEnviados} por email e ${whatsappEnviados} por WhatsApp`;
              } else if (emailEnviados > 0) {
                textoCanais = `${emailEnviados} por email`;
              } else if (whatsappEnviados > 0) {
                textoCanais = `${whatsappEnviados} por WhatsApp`;
              } else {
                textoCanais = 'enviados';
              }
              
              return `Processo de envio de avisos de ${tipoAviso} concluído. ${totalSucessos} notificações enviadas (${textoCanais}).`;
            }
          } catch (e) {
            // Erro silencioso ao extrair dados da notificação
          }
          return 'Processo de envio de avisos concluído com sucesso.';
        }
        // Para notificações de sistema sobre lotes sem telefone cadastrado
        else if (notificacao.titulo === 'Lote sem telefone cadastrado') {
          try {
            // Tentar extrair o nome do lote dos dados adicionais
            const dadosAdicionais = typeof notificacao.dados_adicionais === 'string' 
              ? JSON.parse(notificacao.dados_adicionais) 
              : notificacao.dados_adicionais;
              
            if (dadosAdicionais && dadosAdicionais.lote_nome) {
              return `Não foi possível notificar o pagamento realizado pelo Lote ${dadosAdicionais.lote_nome} pois ele não possui telefone cadastrado.`;
            } else {
              // Fallback: tentar extrair do conteúdo
              const matchLote = notificacao.conteudo.match(/O lote "(.*?)" do/);
              if (matchLote && matchLote[1]) {
                return `Não foi possível notificar o pagamento realizado pelo Lote ${matchLote[1]} pois ele não possui telefone cadastrado.`;
              }
            }
          } catch (e) {
            // Erro silencioso ao extrair dados da notificação
          }
          // Fallback genérico
          return 'Não foi possível notificar o pagamento pois o lote não possui telefone cadastrado.';
        }
        
        // MANTER compatibilidade com título antigo
        if (notificacao.titulo === 'Lote sem telefone') {
          try {
            // Tentar extrair o nome do lote do conteúdo
            const matchLote = notificacao.conteudo.match(/O lote "(.*?)" do/);
            if (matchLote && matchLote[1]) {
              return `Não foi possível notificar o irrigante sobre o pagamento, lote ${matchLote[1]} sem telefone cadastrado para envio de WhatsApp.`;
            }
            
            // Se não conseguir extrair do conteúdo, tentar dos dados adicionais
            const dadosAdicionais = typeof notificacao.dados_adicionais === 'string' 
              ? JSON.parse(notificacao.dados_adicionais) 
              : notificacao.dados_adicionais;
              
            if (dadosAdicionais && dadosAdicionais.lote_nome) {
              return `Não foi possível notificar o irrigante sobre o pagamento, lote ${dadosAdicionais.lote_nome} sem telefone cadastrado para envio de WhatsApp.`;
            }
          } catch (e) {
            // Erro silencioso ao extrair dados da notificação
          }
        }
        // Para outros tipos de sistema, retorna o título
        return notificacao.titulo;
      default:
        // Para outros tipos, retorna o título
        return notificacao.titulo;
    }
  };

  // Função de busca de notificações
  const buscarNotificacoes = async (silencioso = false) => {
    if (!isAuthenticated) {
      return;
    }

    if (!silencioso) setLoading(true);

    try {
      const response = await axiosInstance.get("/api/notificacoes");

      const notificacoesRecebidas = response.data.notificacoes || [];

      // Verificar notificações não lidas e não exibidas em toast
      if (notificacoesRecebidas.length > 0) {
        for (const notificacao of notificacoesRecebidas) {
          // Exibir toast apenas para notificações não lidas e ainda não exibidas como toast
          if (
            notificacao.status === "nao_lida" &&
            !foiExibidaComoToast(notificacao.id)
          ) {
            // Determinar o tipo de notificação para o toast
            let tipoNotificacao = "info";
            
            // Verificar se é notificação de aviso antes do switch
            if (notificacao.titulo?.includes('Notificação de')) {
              tipoNotificacao = "success";
            } else {
              switch (notificacao.tipo) {
                case "boleto":
                case "pix":
                  tipoNotificacao = "success";
                  break;
                case "alerta":
                  tipoNotificacao = "warning";
                  break;
                case "cobranca":
                  tipoNotificacao = "info";
                  break;
                default:
                  tipoNotificacao = "info";
              }
            }

            // Personalizar título e conteúdo para notificações de avisos (busca inicial)
            let titulo = notificacao.titulo;
            let conteudoToast = formatarTextoToast(notificacao);
            
            // Personalizar notificações de avisos enviados (detectar pelo título)
            if (notificacao.titulo?.includes('Notificação de')) {
              titulo = 'Envios Concluídos';
              
              // Extrair informações dos dados adicionais para criar um texto mais descritivo
              try {
                const dadosAdicionais = typeof notificacao.dados_adicionais === 'string' 
                  ? JSON.parse(notificacao.dados_adicionais) 
                  : notificacao.dados_adicionais;
                
                if (dadosAdicionais) {
                  const tipoAviso = dadosAdicionais.tipo_aviso || 'avisos';
                  const totalSucessos = dadosAdicionais.total_sucessos || 0;
                  const emailEnviados = dadosAdicionais.email_enviados || 0;
                  const whatsappEnviados = dadosAdicionais.whatsapp_enviados || 0;
                  
                  // Criar texto descritivo
                  let textoCanais = '';
                  if (emailEnviados > 0 && whatsappEnviados > 0) {
                    textoCanais = `${emailEnviados} por email e ${whatsappEnviados} por WhatsApp`;
                  } else if (emailEnviados > 0) {
                    textoCanais = `${emailEnviados} por email`;
                  } else if (whatsappEnviados > 0) {
                    textoCanais = `${whatsappEnviados} por WhatsApp`;
                  } else {
                    textoCanais = 'enviados';
                  }
                  
                  conteudoToast = `Processo de envio de avisos de ${tipoAviso} concluído. ${totalSucessos} notificações enviadas (${textoCanais}).`;
                }
              } catch (e) {
                // Se não conseguir extrair dados, usar texto padrão
                conteudoToast = 'Processo de envio de avisos concluído com sucesso.';
              }
            }
            // Para notificações sobre lotes sem telefone, personalizar o título
            else if (notificacao.titulo === 'Lote sem telefone' || notificacao.titulo === 'Lote sem telefone cadastrado') {
              titulo = 'Lote sem telefone cadastrado';
            }
            
            showNotification(
              tipoNotificacao,
              titulo,
              conteudoToast
            );

            // Marcar como exibida em toast
            marcarComoExibidaEmToast(notificacao.id);

            // Só exibir toast para a notificação mais recente não lida
            break;
          }
        }
      }

      setNotificacoes(notificacoesRecebidas);
      setNaoLidas(response.data.nao_lidas || 0);
    } catch (error) {
      if (!silencioso) {
        message.error("Não foi possível carregar as notificações");
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // NOVO: Handlers para eventos Socket.io
  const handleNovaNotificacao = useCallback((data) => {
    try {
      const novaNotificacao = data.notificacao;
      
      // Adicionar nova notificação ao estado
      setNotificacoes((prev) => [novaNotificacao, ...prev]);
      
      // Atualizar contador de não lidas
      setNaoLidas((prev) => prev + 1);
      
      // Exibir toast apenas se não foi exibida antes
      if (!foiExibidaComoToast(novaNotificacao.id)) {
        // Determinar o tipo de notificação para o toast
        let tipoNotificacao = "info";
        
        // Verificar se é notificação de aviso antes do switch
        if (novaNotificacao.titulo?.includes('Notificação de')) {
          tipoNotificacao = "success";
        } else {
          switch (novaNotificacao.tipo) {
            case "boleto":
            case "pix":
              tipoNotificacao = "success";
              break;
            case "alerta":
              tipoNotificacao = "warning";
              break;
            case "cobranca":
              tipoNotificacao = "info";
              break;
            default:
              tipoNotificacao = "info";
          }
        }

        // Personalizar título e conteúdo para notificações de avisos
        let titulo = novaNotificacao.titulo;
        let conteudoToast = formatarTextoToast(novaNotificacao);
        
        // Personalizar notificações de avisos enviados (detectar pelo título)
        if (novaNotificacao.titulo?.includes('Notificação de')) {
          titulo = 'Envios Concluídos';
          
          // Extrair informações dos dados adicionais para criar um texto mais descritivo
          try {
            const dadosAdicionais = typeof novaNotificacao.dados_adicionais === 'string' 
              ? JSON.parse(novaNotificacao.dados_adicionais) 
              : novaNotificacao.dados_adicionais;
            
            if (dadosAdicionais) {
              const tipoAviso = dadosAdicionais.tipo_aviso || 'avisos';
              const totalSucessos = dadosAdicionais.total_sucessos || 0;
              const emailEnviados = dadosAdicionais.email_enviados || 0;
              const whatsappEnviados = dadosAdicionais.whatsapp_enviados || 0;
              
              // Criar texto descritivo
              let textoCanais = '';
              if (emailEnviados > 0 && whatsappEnviados > 0) {
                textoCanais = `${emailEnviados} por email e ${whatsappEnviados} por WhatsApp`;
              } else if (emailEnviados > 0) {
                textoCanais = `${emailEnviados} por email`;
              } else if (whatsappEnviados > 0) {
                textoCanais = `${whatsappEnviados} por WhatsApp`;
              } else {
                textoCanais = 'enviados';
              }
              
              conteudoToast = `Processo de envio de avisos de ${tipoAviso} concluído. ${totalSucessos} notificações enviadas (${textoCanais}).`;
            }
          } catch (e) {
            // Se não conseguir extrair dados, usar texto padrão
            conteudoToast = 'Processo de envio de avisos concluído com sucesso.';
          }
        }
        // Para notificações de lotes sem telefone
        else if (novaNotificacao.titulo === 'Lote sem telefone' || novaNotificacao.titulo === 'Lote sem telefone cadastrado') {
          titulo = 'Lote sem telefone cadastrado';
        }
        
        showNotification(
          tipoNotificacao,
          titulo,
          conteudoToast
        );

        // Marcar como exibida em toast
        marcarComoExibidaEmToast(novaNotificacao.id);
      }
      
      console.log('🔔 Nova notificação recebida via Socket.io:', novaNotificacao.id);
    } catch (error) {
      console.error('Erro ao processar nova notificação:', error);
    }
  }, []);

  const handleNotificacaoLida = useCallback((data) => {
    try {
      const notificacaoId = data.notificacaoId;
      
      // Atualizar notificação no estado
      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.id === notificacaoId ? { ...notif, status: "lida" } : notif
        )
      );
      
      // Decrementar contador de não lidas
      setNaoLidas((prev) => Math.max(0, prev - 1));
      
      console.log('🔔 Notificação marcada como lida via Socket.io:', notificacaoId);
    } catch (error) {
      console.error('Erro ao processar notificação lida:', error);
    }
  }, []);

  const handleTodasNotificacoesLidas = useCallback((data) => {
    try {
      // Marcar todas as notificações como lidas
      setNotificacoes((prev) =>
        prev.map((notif) => ({ ...notif, status: "lida" }))
      );
      
      // Zerar contador de não lidas
      setNaoLidas(0);
      
      console.log('🔔 Todas as notificações marcadas como lidas via Socket.io');
    } catch (error) {
      console.error('Erro ao processar todas notificações lidas:', error);
    }
  }, []);

  const handleNotificacaoDescartada = useCallback((data) => {
    try {
      const { notificacaoId, eraNaoLida } = data;
      
      // Remover notificação do estado
      setNotificacoes((prev) => prev.filter((notif) => notif.id !== notificacaoId));
      
      // Decrementar contador se era não lida
      if (eraNaoLida) {
        setNaoLidas((prev) => Math.max(0, prev - 1));
      }
      
      console.log('🔔 Notificação descartada via Socket.io:', notificacaoId);
    } catch (error) {
      console.error('Erro ao processar notificação descartada:', error);
    }
  }, []);

  // NOVO: Configurar eventos Socket.io
  useEffect(() => {
    if (!isAuthenticated) return;

    const registrarEventos = () => {
      if (isConnected()) {
        on('nova_notificacao', handleNovaNotificacao);
        on('notificacao_lida', handleNotificacaoLida);
        on('todas_notificacoes_lidas', handleTodasNotificacoesLidas);
        on('notificacao_descartada', handleNotificacaoDescartada);
        
        return true;
      }
      return false;
    };

    // Tentar registrar eventos imediatamente
    if (registrarEventos()) {
      return () => {
        off('nova_notificacao', handleNovaNotificacao);
        off('notificacao_lida', handleNotificacaoLida);
        off('todas_notificacoes_lidas', handleTodasNotificacoesLidas);
        off('notificacao_descartada', handleNotificacaoDescartada);
      };
    } else {
      // Socket não conectado, tentar novamente em intervalos
      const interval = setInterval(() => {
        if (registrarEventos()) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, isConnected, on, off, handleNovaNotificacao, handleNotificacaoLida, handleTodasNotificacoesLidas, handleNotificacaoDescartada]);

  // Buscar notificações quando o componente for montado (apenas carregamento inicial)
  useEffect(() => {
    if (isAuthenticated) {
      buscarNotificacoes();
    }
  }, [isAuthenticated]);

  const marcarComoLida = async (id) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.patch(`/api/notificacoes/${id}/ler`, {});

      // Atualizar estado localmente
      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, status: "lida" } : notif
        )
      );

      // Recalcular não lidas
      setNaoLidas((prev) => Math.max(0, prev - 1));
    } catch (error) {
      message.error("Não foi possível marcar a notificação como lida");
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.patch("/api/notificacoes/ler-todas", {});

      // Atualizar estado localmente
      setNotificacoes((prev) =>
        prev.map((notif) => ({ ...notif, status: "lida" }))
      );

      // Zerar contador de não lidas
      setNaoLidas(0);
    } catch (error) {
      message.error("Não foi possível marcar todas as notificações como lidas");
    }
  };

  const descartarNotificacao = async (id) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.patch(`/api/notificacoes/${id}/descartar`, {});

      // Atualizar estado localmente removendo a notificação
      const notificacaoAtual = notificacoes.find((n) => n.id === id);
      const eraNaoLida = notificacaoAtual?.status === "nao_lida";

      setNotificacoes((prev) => prev.filter((notif) => notif.id !== id));

      // Atualizar contador se necessário
      if (eraNaoLida) {
        setNaoLidas((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      message.error("Não foi possível descartar a notificação");
    }
  };

  const value = {
    notificacoes,
    naoLidas,
    loading,
    buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    descartarNotificacao,
  };

  return (
    <NotificacaoContext.Provider value={value}>
      {children}
    </NotificacaoContext.Provider>
  );
};
