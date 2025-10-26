// src/hooks/useDashboardOptimized.js

import { useState, useCallback, useRef } from 'react';
import axiosInstance from '../api/axiosConfig';
import { showNotification } from '../config/notificationConfig';
import { validateDashboardResponse } from '../utils/validation';

/**
 * Hook otimizado para dashboard com debounce e cache inteligente
 */
export const useDashboardOptimized = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    aguardandoColheita: [],
    aguardandoPrecificacao: [],
    aguardandoPagamento: [],
    finalizados: [],
  });

  const [paginacaoFinalizados, setPaginacaoFinalizados] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [loading, setLoading] = useState(false);
  const [operacaoLoading, setOperacaoLoading] = useState(false);

  // Refs para controle de estado
  const lastUpdateRef = useRef(0); // Inicializar com 0 para forçar primeira chamada
  const abortControllerRef = useRef(null);

  // Cache para evitar atualizações desnecessárias
  const CACHE_DURATION = 30 * 1000; // 30 segundos

  const processarSecoesPorStatus = useCallback((pedidos) => {
    const aguardandoColheita = [];
    const aguardandoPrecificacao = [];
    const aguardandoPagamento = [];

    pedidos.forEach(pedido => {
      const { status } = pedido;

      if (["PEDIDO_CRIADO", "AGUARDANDO_COLHEITA", "COLHEITA_PARCIAL"].includes(status)) {
        aguardandoColheita.push(pedido);
      } else if (["COLHEITA_REALIZADA", "AGUARDANDO_PRECIFICACAO"].includes(status)) {
        aguardandoPrecificacao.push(pedido);
      } else if (["PRECIFICACAO_REALIZADA", "AGUARDANDO_PAGAMENTO", "PAGAMENTO_PARCIAL"].includes(status)) {
        aguardandoPagamento.push(pedido);
      }
    });

    return {
      aguardandoColheita,
      aguardandoPrecificacao,
      aguardandoPagamento,
    };
  }, []);

  const carregarDashboard = useCallback(async (paginaFinalizadosParam = 1, forceUpdate = false) => {
    // Verificar se precisa atualizar (cache ou force)
    if (!forceUpdate) {
      const now = Date.now();
      if (now - lastUpdateRef.current < CACHE_DURATION) {
        return; // Usar dados em cache
      }
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo controller para esta requisição
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);

      const response = await axiosInstance.get("/api/pedidos/dashboard", {
        params: {
          paginaFinalizados: paginaFinalizadosParam,
          limitFinalizados: paginacaoFinalizados.limit
        },
        signal: abortControllerRef.current.signal
      });

      const validatedData = validateDashboardResponse(response.data);
      const processedSections = processarSecoesPorStatus(validatedData.pedidos);

      setDashboardData({
        stats: validatedData.stats,
        ...processedSections,
        finalizados: validatedData.finalizados.data
      });

      setPaginacaoFinalizados(prev => ({
        ...prev,
        page: validatedData.finalizados.page,
        total: validatedData.finalizados.total,
        totalPages: validatedData.finalizados.totalPages
      }));

      lastUpdateRef.current = Date.now();

    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error("Erro ao carregar dashboard:", error);
        showNotification("error", "Erro", "Erro ao carregar dashboard de pedidos");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [paginacaoFinalizados.limit, processarSecoesPorStatus]);

  // Atualização otimizada que evita re-carregar stats desnecessariamente
  const atualizarDadosOtimizado = useCallback(async (pedidoAtualizado) => {
    try {
      setOperacaoLoading(true);

      // Buscar apenas os dados essenciais
      const response = await axiosInstance.get("/api/pedidos/dashboard", {
        params: {
          paginaFinalizados: paginacaoFinalizados.page,
          limitFinalizados: paginacaoFinalizados.limit,
          lightweight: true // Indicar que queremos resposta mais leve
        }
      });

      const validatedData = validateDashboardResponse(response.data);
      const processedSections = processarSecoesPorStatus(validatedData.pedidos);

      setDashboardData(prev => ({
        ...prev,
        stats: validatedData.stats,
        ...processedSections,
        finalizados: validatedData.finalizados.data
      }));

      lastUpdateRef.current = Date.now();

      return validatedData;
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error("Erro ao atualizar dados:", error);
        showNotification("error", "Erro", "Erro ao atualizar dados");
      }
      throw error;
    } finally {
      setOperacaoLoading(false);
    }
  }, [paginacaoFinalizados.page, paginacaoFinalizados.limit, processarSecoesPorStatus]);

  const handlePaginacaoFinalizados = useCallback(async (novaPagina, novoLimit) => {
    setPaginacaoFinalizados(prev => ({
      ...prev,
      page: novaPagina,
      limit: novoLimit || prev.limit
    }));

    await carregarDashboard(novaPagina, true);
  }, [carregarDashboard]);

  // Invalidar cache quando necessário
  const invalidateCache = useCallback(() => {
    lastUpdateRef.current = 0;
  }, []);

  // Cleanup ao desmontar
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    dashboardData: {
      ...dashboardData,
      lastUpdate: lastUpdateRef.current
    },
    paginacaoFinalizados,
    loading,
    operacaoLoading,
    carregarDashboard,
    atualizarDadosOtimizado,
    handlePaginacaoFinalizados,
    invalidateCache,
    cleanup,
    setOperacaoLoading,
    isCacheValid: (Date.now() - lastUpdateRef.current) < CACHE_DURATION
  };
};