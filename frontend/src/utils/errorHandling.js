// src/utils/errorHandling.js

import { showNotification } from '../config/notificationConfig';

/**
 * Tratamento padronizado de erros
 */

/**
 * Extrai mensagem de erro da resposta da API
 */
export const extractErrorMessage = (error, defaultMessage = "Erro inesperado") => {
  if (!error) return defaultMessage;

  // Mensagem da resposta da API
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Mensagem do axios
  if (error.message) {
    return error.message;
  }

  // String direta
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
};

/**
 * Handler padronizado para erros de API
 */
export const handleApiError = (error, context = "Operação", silent = false) => {
  const message = extractErrorMessage(error, `Erro ao realizar ${context.toLowerCase()}`);

  if (!silent) {
    showNotification("error", "Erro", message);
  }

  console.error(`${context} Error:`, error);

  return {
    success: false,
    message,
    error
  };
};

/**
 * Handler para erros de rede
 */
export const handleNetworkError = (error, context = "Operação") => {
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    showNotification(
      "error",
      "Erro de Conexão",
      "Verifique sua conexão com a internet e tente novamente"
    );
    return;
  }

  handleApiError(error, context);
};

/**
 * Handler para erros de validação
 */
export const handleValidationError = (errors, title = "Erro de Validação") => {
  if (Array.isArray(errors)) {
    const message = errors.join(', ');
    showNotification("warning", title, message);
    return;
  }

  if (typeof errors === 'object') {
    const messages = Object.values(errors).flat();
    const message = messages.join(', ');
    showNotification("warning", title, message);
    return;
  }

  showNotification("warning", title, errors || "Dados inválidos");
};

/**
 * Wrapper para requisições com tratamento de erro
 */
export const safeApiCall = async (apiCall, options = {}) => {
  const {
    context = "Operação",
    silent = false,
    throwOnError = false,
    onError = null
  } = options;

  try {
    const result = await apiCall();
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    const errorResult = handleApiError(error, context, silent);

    if (onError) {
      onError(error);
    }

    if (throwOnError) {
      throw error;
    }

    return errorResult;
  }
};

/**
 * Classes de erro customizadas
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Erro de rede') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class BusinessError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
  }
}