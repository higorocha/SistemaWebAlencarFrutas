// src/hooks/useConfirmClose.js

import { useState } from "react";

/**
 * Hook customizado para gerenciar confirmação de fechamento de modais
 * Fornece lógica reutilizável para detectar dados preenchidos e mostrar confirmação
 */
const useConfirmClose = (formData, onClose, customHasDataChecker = null) => {
  const [confirmCloseModal, setConfirmCloseModal] = useState(false);

  // Função padrão para verificar se há dados preenchidos
  const defaultHasDataChecker = (data) => {
    // Verifica campos básicos comuns
    const hasBasicData = data.nome?.trim() || 
                        data.areaTotal || 
                        data.categoria !== "COLONO" ||
                        data.descricao?.trim() ||
                        data.quantidade ||
                        data.valor;
    
    // Verifica se há coordenadas capturadas
    const hasCoordinates = data.coordenadas && data.coordenadas.length > 0;
    
    // Verifica se há arrays com dados
    const hasArrayData = (data.culturas && data.culturas.length > 0) ||
                        (data.itens && data.itens.length > 0) ||
                        (data.produtos && data.produtos.length > 0);
    
    return hasBasicData || hasCoordinates || hasArrayData;
  };

  // Função para verificar se há dados preenchidos
  const hasFormData = () => {
    if (customHasDataChecker) {
      return customHasDataChecker(formData);
    }
    return defaultHasDataChecker(formData);
  };

  // Função para lidar com o fechamento do modal
  const handleCloseAttempt = () => {
    if (hasFormData()) {
      // Se há dados preenchidos, mostrar modal de confirmação
      setConfirmCloseModal(true);
    } else {
      // Se não há dados, fechar diretamente
      onClose();
    }
  };

  // Função para confirmar o fechamento (descartar dados)
  const handleConfirmClose = () => {
    setConfirmCloseModal(false);
    onClose();
  };

  // Função para cancelar o fechamento (voltar ao formulário)
  const handleCancelClose = () => {
    setConfirmCloseModal(false);
  };

  return {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
    hasFormData,
  };
};

export default useConfirmClose;
