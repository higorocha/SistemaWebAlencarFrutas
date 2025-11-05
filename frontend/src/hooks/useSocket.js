import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Configuração de URLs igual ao axiosConfig
const socketConfig = {
  development: 'http://localhost:5002',
  production: 'https://sistemawebalencarfrutas.onrender.com',
  test: 'http://localhost:5002'
};

// Singleton para evitar múltiplas conexões
let globalSocket = null;
let globalListeners = new Map();
let connectionCount = 0;
let processedEvents = new Map(); // CORRIGIDO: Usar Map para suportar contadores de eventos

const useSocket = (options = {}) => {
  const isInitializedRef = useRef(false);
  const localListenersRef = useRef(new Map());

  useEffect(() => {
    if (isInitializedRef.current) return;
    
    connectionCount++;
    
    // Só criar conexão se não existir
    if (!globalSocket) {
      // Pegar ambiente atual e URL correspondente
      const environment = process.env.NODE_ENV || 'development';
      const serverURL = socketConfig[environment];

      // Pegar token de autenticação
      const token = localStorage.getItem('alencar_frutas_token');

      // Configurações padrão do Socket.io
      const defaultOptions = {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false, // MUDANÇA: Reutilizar conexão quando possível
        auth: {
          token: token
        },
        ...options
      };

      // Conectar ao socket
      globalSocket = io(serverURL, defaultOptions);

      // Event listeners para debug
      globalSocket.on('connect', () => {
        console.log('[SOCKET] Conectado ao Socket.io');
      });

      globalSocket.on('disconnect', (reason) => {
        // Tentar reconectar em casos específicos
        if (reason === 'io server disconnect') {
          globalSocket.connect();
        }
      });

      globalSocket.on('connect_error', (error) => {
        console.error('Erro de conexão Socket.io:', error.message);
      });

      globalSocket.on('reconnect', (attemptNumber) => {
        // Reconectado ao Socket.io
      });

      globalSocket.on('reconnect_attempt', (attemptNumber) => {
        // Tentativa de reconexão
      });

      globalSocket.on('reconnect_failed', () => {
        console.error('Falha ao reconectar ao Socket.io');
      });
    }

    isInitializedRef.current = true;

    // Cleanup na desmontagem
    return () => {
      connectionCount--;
      
      // Remover todos os listeners locais
      localListenersRef.current.forEach((callback, event) => {
        if (globalSocket) {
          globalSocket.off(event, callback);
        }
        globalListeners.delete(`${event}_${callback}`);
      });
      localListenersRef.current.clear();
      
      // Só desconectar se não houver mais componentes usando
      if (connectionCount <= 0 && globalSocket) {
        // Remover todos os listeners globais
        globalListeners.clear();
        
        // Desconectar
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, []); // IMPORTANTE: Array vazio para evitar re-execução

  // Função para se inscrever em eventos
  const on = useCallback((event, callback) => {
    if (!globalSocket) {
      console.warn(`⚠️ [SOCKET] Tentativa de registrar listener para '${event}' sem conexão`);
      return;
    }
    
    // Para eventos críticos, remover TODOS os listeners anteriores antes de registrar
    if (event === 'nova_notificacao') {
      globalSocket.removeAllListeners(event);
      globalListeners.forEach((listener, key) => {
        if (key.startsWith(`${event}_`)) {
          globalListeners.delete(key);
        }
      });
      localListenersRef.current.delete(event);
    }
    
    // Wrapper para adicionar logs apenas para eventos importantes
    const wrappedCallback = (data) => {
      // CORRIGIDO: Verificar se data existe antes de acessar propriedades
      if (data && data.eventId && (event === 'mensagem_enviada' || event === 'nova_mensagem')) {
        // CORREÇÃO: Só verificar duplicação se o evento já foi processado MUITAS vezes
        const eventKey = `${data.eventId}_${event}`;
        const currentCount = processedEvents.has(eventKey) ? processedEvents.get(eventKey) : 0;
        
        if (currentCount > 3) { // Permitir até 3 processamentos do mesmo evento
          console.log(`🔄 [SOCKET] Evento duplicado ignorado (muitas vezes): ${data.eventId}`);
          return;
        }
        
        // Incrementar contador
        processedEvents.set(eventKey, currentCount + 1);
        
        // Limpar eventos antigos (manter apenas últimos 100)
        if (processedEvents.size > 100) {
          const entries = Array.from(processedEvents.entries());
          processedEvents = new Map(entries.slice(-50));
        }
      }
      
      // Log apenas para eventos importantes ou PDFs
      if (event === 'mensagem_enviada' && data && data.mensagem?.tipo_mensagem === 'document') {
        console.log(`🔔 [SOCKET] Evento '${event}' recebido (PDF):`, data.mensagem.midia_nome);
      }
      callback(data);
    };
    
    // Chave única para identificar listener (usar timestamp para garantir unicidade)
    const listenerKey = `${event}_${Date.now()}_${Math.random()}`;
    
    // Adicionar novo listener
    globalSocket.on(event, wrappedCallback);
    globalListeners.set(listenerKey, wrappedCallback);
    localListenersRef.current.set(event, wrappedCallback);
    
    // Log para eventos de notificação
    if (event === 'nova_notificacao') {
      console.log(`📡 [SOCKET] Listener registrado para evento '${event}'`);
    }
  }, []);

  // Função para remover listeners
  const off = useCallback((event, callback) => {
    if (globalSocket) {
      globalSocket.off(event, callback);
      
      const listenerKey = `${event}_${callback}`;
      globalListeners.delete(listenerKey);
      
      // Remover da lista local se for o mesmo callback
      if (localListenersRef.current.get(event) === callback) {
        localListenersRef.current.delete(event);
      }
    }
  }, []);

  // Função para emitir eventos
  const emit = useCallback((event, data) => {
    if (globalSocket && globalSocket.connected) {
      globalSocket.emit(event, data);
    }
  }, []);

  // Função para verificar se está conectado
  const isConnected = useCallback(() => {
    return globalSocket?.connected || false;
  }, []);

  // Função para forçar reconexão
  const reconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket.connect();
    }
  }, []);

  // Função para obter informações de status
  const getStatus = useCallback(() => {
    if (!globalSocket) {
      return { connected: false, id: null, transport: null };
    }
    
    return {
      connected: globalSocket.connected,
      id: globalSocket.id || null,
      transport: globalSocket.io.engine?.transport?.name || null
    };
  }, []);

  return {
    socket: globalSocket,
    on,
    off,
    emit,
    isConnected,
    reconnect,
    getStatus
  };
};

export default useSocket;