// src/utils/validation.js

/**
 * Validação robusta para respostas da API
 */

/**
 * Valida e normaliza resposta de pedidos
 */
export const validatePedidosResponse = (data) => {
  if (!data || typeof data !== 'object') {
    console.warn('Resposta inválida da API:', data);
    return {
      pedidos: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }

  // Suporte para diferentes formatos de resposta
  const pedidos = Array.isArray(data.data) ? data.data :
                  Array.isArray(data) ? data : [];

  return {
    pedidos,
    total: data.total || pedidos.length,
    page: data.page || 1,
    totalPages: data.totalPages || Math.ceil((data.total || pedidos.length) / (data.limit || 20)),
    statusFiltrados: data.statusFiltrados
  };
};

/**
 * Valida resposta do dashboard
 */
export const validateDashboardResponse = (data) => {
  if (!data || typeof data !== 'object') {
    console.warn('Resposta inválida do dashboard:', data);
    return {
      stats: {},
      pedidos: [],
      finalizados: {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    };
  }

  return {
    stats: data.stats || {},
    pedidos: Array.isArray(data.pedidos) ? data.pedidos : [],
    finalizados: {
      data: Array.isArray(data.finalizados?.data) ? data.finalizados.data : [],
      total: data.finalizados?.total || 0,
      page: data.finalizados?.page || 1,
      totalPages: data.finalizados?.totalPages || 0
    }
  };
};

/**
 * Valida resposta de clientes
 */
export const validateClientesResponse = (data) => {
  if (!data || typeof data !== 'object') {
    console.warn('Resposta inválida de clientes:', data);
    return [];
  }

  return Array.isArray(data.data) ? data.data :
         Array.isArray(data) ? data : [];
};

/**
 * Valida estrutura de pedido individual
 */
export const validatePedido = (pedido) => {
  if (!pedido || typeof pedido !== 'object') {
    return null;
  }

  // Estrutura mínima necessária
  return {
    id: pedido.id,
    numeroPedido: pedido.numeroPedido || '',
    status: pedido.status || 'PEDIDO_CRIADO',
    valorFinal: parseFloat(pedido.valorFinal) || 0,
    valorRecebido: parseFloat(pedido.valorRecebido) || 0,
    dataPedido: pedido.dataPedido,
    cliente: pedido.cliente || {},
    frutasPedidos: Array.isArray(pedido.frutasPedidos) ? pedido.frutasPedidos : [],
    pagamentosPedidos: Array.isArray(pedido.pagamentosPedidos) ? pedido.pagamentosPedidos : [],
    ...pedido // Manter outros campos
  };
};

/**
 * Schema de validação para formulários
 */
export const validateFormData = (data, schema) => {
  const errors = {};

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = data[field];

    if (rules.required && (!value || value === '')) {
      errors[field] = `${field} é obrigatório`;
    }

    if (rules.type === 'number' && value && isNaN(parseFloat(value))) {
      errors[field] = `${field} deve ser um número válido`;
    }

    if (rules.min && parseFloat(value) < rules.min) {
      errors[field] = `${field} deve ser maior que ${rules.min}`;
    }

    if (rules.max && parseFloat(value) > rules.max) {
      errors[field] = `${field} deve ser menor que ${rules.max}`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};