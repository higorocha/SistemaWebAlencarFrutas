// src/hooks/useClientesCache.js

import { useState, useCallback, useRef } from 'react';
import axiosInstance from '../api/axiosConfig';
import { showNotification } from '../config/notificationConfig';
import { validateClientesResponse } from '../utils/validation';

/**
 * Hook para cache de clientes com otimizações de performance
 */
export const useClientesCache = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const cacheTimeRef = useRef(null);

  // Cache válido por 5 minutos
  const CACHE_DURATION = 5 * 60 * 1000;

  const carregarClientes = useCallback(async (forceReload = false) => {
    // Verificar se já carregou e cache ainda é válido
    if (!forceReload && loadedRef.current && cacheTimeRef.current) {
      const now = Date.now();
      if (now - cacheTimeRef.current < CACHE_DURATION) {
        return clientes;
      }
    }

    try {
      setLoading(true);

      const response = await axiosInstance.get("/api/clientes/ativos");
      const clientesData = validateClientesResponse(response.data);

      setClientes(clientesData);
      loadedRef.current = true;
      cacheTimeRef.current = Date.now();

      return clientesData;
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showNotification("error", "Erro", "Erro ao carregar clientes");
      return [];
    } finally {
      setLoading(false);
    }
  }, [clientes]);

  const invalidateCache = useCallback(() => {
    loadedRef.current = false;
    cacheTimeRef.current = null;
    setClientes([]);
  }, []);

  const findClienteById = useCallback((id) => {
    return clientes.find(cliente => cliente.id === id);
  }, [clientes]);

  return {
    clientes,
    loading,
    carregarClientes,
    invalidateCache,
    findClienteById,
    isCacheValid: loadedRef.current && cacheTimeRef.current &&
                  (Date.now() - cacheTimeRef.current < CACHE_DURATION)
  };
};