// src/hooks/usePedidoStatusColors.js
import { useTheme } from "@mui/material/styles";

/**
 * Hook para obter cores de status de pedidos do tema
 * Centraliza o acesso às cores padronizadas de status
 * 
 * @returns {Object} Objeto com cores de status e função helper
 */
const usePedidoStatusColors = () => {
  const theme = useTheme();
  
  // Obter cores do tema
  const statusColors = theme.palette.pedidoStatus || {};
  
  /**
   * Função para obter cor de um status específico
   * @param {string} status - Status do pedido
   * @returns {string} Cor hexadecimal do status
   */
  const getStatusColor = (status) => {
    return statusColors[status] || statusColors.DEFAULT || "#d9d9d9";
  };
  
  /**
   * Função para obter configuração completa de um status
   * @param {string} status - Status do pedido
   * @returns {Object} Objeto com cor e texto do status
   */
  const getStatusConfig = (status) => {
    const color = getStatusColor(status);
    
    // Mapeamento de textos para status
    const statusTexts = {
      PEDIDO_CRIADO: "Criado",
      AGUARDANDO_COLHEITA: "Aguardando Colheita",
      COLHEITA_PARCIAL: "Colheita Parcial",
      COLHEITA_REALIZADA: "Colheita Realizada",
      AGUARDANDO_PRECIFICACAO: "Aguardando Precificação",
      PRECIFICACAO_REALIZADA: "Precificação Realizada",
      AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
      PAGAMENTO_PARCIAL: "Pagamento Parcial",
      PAGAMENTO_REALIZADO: "Pagamento Realizado",
      PEDIDO_FINALIZADO: "Finalizado",
      CANCELADO: "Cancelado",
    };
    
    return {
      color,
      text: statusTexts[status] || status,
    };
  };
  
  return {
    // Cores individuais
    statusColors,
    
    // Funções helper
    getStatusColor,
    getStatusConfig,
    
    // Cores específicas para acesso direto
    PEDIDO_CRIADO: statusColors.PEDIDO_CRIADO,
    AGUARDANDO_COLHEITA: statusColors.AGUARDANDO_COLHEITA,
    COLHEITA_PARCIAL: statusColors.COLHEITA_PARCIAL,
    COLHEITA_REALIZADA: statusColors.COLHEITA_REALIZADA,
    AGUARDANDO_PRECIFICACAO: statusColors.AGUARDANDO_PRECIFICACAO,
    PRECIFICACAO_REALIZADA: statusColors.PRECIFICACAO_REALIZADA,
    AGUARDANDO_PAGAMENTO: statusColors.AGUARDANDO_PAGAMENTO,
    PAGAMENTO_PARCIAL: statusColors.PAGAMENTO_PARCIAL,
    PAGAMENTO_REALIZADO: statusColors.PAGAMENTO_REALIZADO,
    PEDIDO_FINALIZADO: statusColors.PEDIDO_FINALIZADO,
    CANCELADO: statusColors.CANCELADO,
    DEFAULT: statusColors.DEFAULT,
  };
};

export default usePedidoStatusColors;
