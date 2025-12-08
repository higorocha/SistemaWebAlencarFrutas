// src/hooks/useClientesCache.js

import { useState, useCallback, useRef, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { showNotification } from '../config/notificationConfig';
import { validateClientesResponse } from '../utils/validation';

const STORAGE_KEY = 'clientes_cache';
const STORAGE_TIMESTAMP_KEY = 'clientes_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para cache de clientes com localStorage e otimizações de performance
 */
export const useClientesCache = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY);
      const cachedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        if (now - timestamp < CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData);
          setClientes(parsedData);
          loadedRef.current = true;
        } else {
          // Cache expirado, limpar
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cache de clientes:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    }
  }, []);

  const carregarClientes = useCallback(async (forceReload = false) => {
    // Verificar cache em memória
    if (!forceReload && loadedRef.current && clientes.length > 0) {
      // Verificar cache do localStorage
      try {
        const cachedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
        if (cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION) {
            return clientes;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar cache:', error);
      }
    }

    try {
      setLoading(true);

      const response = await axiosInstance.get("/api/clientes/ativos");
      const clientesData = validateClientesResponse(response.data);

      setClientes(clientesData);
      loadedRef.current = true;

      // Salvar no localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clientesData));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.error('Erro ao salvar cache de clientes:', error);
      }

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
    setClientes([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
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
    isCacheValid: loadedRef.current && clientes.length > 0
  };
};