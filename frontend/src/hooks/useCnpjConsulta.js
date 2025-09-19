import { useState, useCallback } from 'react';
import { useDebouncedCallback } from './useDebounce';
import axiosInstance from '../api/axiosConfig';

export const useCnpjConsulta = () => {
  const [cnpjData, setCnpjData] = useState({
    isLoading: false,
    data: null,
    error: null
  });

  const consultarCnpj = useCallback(async (cnpj) => {
    if (!cnpj) {
      setCnpjData({ isLoading: false, data: null, error: null });
      return;
    }

    // Remover caracteres não numéricos
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    // Verificar se tem 14 dígitos (CNPJ válido)
    if (cnpjLimpo.length !== 14) {
      setCnpjData({ isLoading: false, data: null, error: null });
      return;
    }

    setCnpjData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axiosInstance.get(`/api/cnpj/${cnpjLimpo}`);
      const data = response.data;

      // Mapear dados da API para nosso formato
      const dadosMapeados = {
        nome: data.fantasia || data.nome || '', // Nome fantasia ou razão social
        razaoSocial: data.nome || '', // Razão social
        documento: data.cnpj || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        estado: data.uf || '',
        cep: data.cep || '',
        email1: data.email || '',
        telefone1: data.telefone || '',
        // Manter campos que não são preenchidos pela API
        inscricaoEstadual: '',
        inscricaoMunicipal: '',
        telefone2: '',
        email2: '',
        observacoes: '',
        status: 'ATIVO',
        industria: false
      };

      setCnpjData({
        isLoading: false,
        data: dadosMapeados,
        error: null
      });

    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);

      let errorMessage = 'Erro ao consultar CNPJ';

      if (error.response?.status === 404) {
        errorMessage = 'CNPJ não encontrado';
      } else if (error.response?.status === 400) {
        errorMessage = 'CNPJ inválido';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setCnpjData({
        isLoading: false,
        data: null,
        error: errorMessage
      });
    }
  }, []);

  const debouncedConsultarCnpj = useDebouncedCallback(consultarCnpj, 300, []);

  const resetConsulta = useCallback(() => {
    setCnpjData({ isLoading: false, data: null, error: null });
  }, []);

  return {
    cnpjData,
    consultarCnpj: debouncedConsultarCnpj,
    resetConsulta
  };
};