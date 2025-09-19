import { useState, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useDebouncedCallback } from './useDebounce';

export const useClienteValidation = () => {
  const [nomeValidation, setNomeValidation] = useState({
    isChecking: false,
    isValid: null,
    message: null
  });

  const debouncedValidateNome = useDebouncedCallback(async (nome, clienteId = null) => {
    if (!nome || nome.trim().length < 2) {
      setNomeValidation({
        isChecking: false,
        isValid: null,
        message: null
      });
      return;
    }

    setNomeValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await axiosInstance.get('/api/clientes', {
        params: {
          search: nome.trim(),
          page: 1,
          limit: 100
        }
      });

      const clientes = response.data.data || [];

      // Verificar se existe um cliente com o mesmo nome (case insensitive)
      const nomeExistente = clientes.find(cliente =>
        cliente.nome.toLowerCase() === nome.trim().toLowerCase() &&
        (!clienteId || cliente.id !== clienteId)
      );

      if (nomeExistente) {
        setNomeValidation({
          isChecking: false,
          isValid: false,
          message: 'Já existe um cliente com este nome'
        });
      } else {
        setNomeValidation({
          isChecking: false,
          isValid: true,
          message: 'Nome disponível'
        });
      }
    } catch (error) {
      console.error('Erro ao validar nome:', error);
      setNomeValidation({
        isChecking: false,
        isValid: null,
        message: null
      });
    }
  }, 800, []);

  const validateNome = useCallback((nome, clienteId = null) => {
    debouncedValidateNome(nome, clienteId);
  }, [debouncedValidateNome]);

  const resetValidation = useCallback(() => {
    setNomeValidation({
      isChecking: false,
      isValid: null,
      message: null
    });
  }, []);

  return {
    nomeValidation,
    validateNome,
    resetValidation
  };
};