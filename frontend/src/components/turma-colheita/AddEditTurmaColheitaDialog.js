// src/components/turma-colheita/AddEditTurmaColheitaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Space } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, GroupOutlined } from "@ant-design/icons";
import useResponsive from "../../hooks/useResponsive";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import TurmaColheitaForm from "./TurmaColheitaForm";
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";

const AddEditTurmaColheitaDialog = ({
  open,
  onClose,
  onSave,
  turmaColheita = null,
  loading = false,
}) => {
  const { isMobile } = useResponsive();
  const [turmaAtual, setTurmaAtual] = useState({
    nomeColhedor: "",
    chavePix: "",
    responsavelChavePix: "",
    observacoes: "",
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Função customizada para verificar se há dados preenchidos no formulário de turma de colheita
  const customHasDataChecker = (data) => {
    // Verifica campos básicos obrigatórios
    const hasBasicData = data.nomeColhedor?.trim();
    
    // Verifica dados de pagamento
    const hasPaymentData = data.chavePix?.trim();
    
    // Verifica responsável pela chave PIX
    const hasResponsavelData = data.responsavelChavePix?.trim();
    
    // Verifica outros campos
    const hasOtherData = data.observacoes?.trim();
    
    return hasBasicData || hasPaymentData || hasResponsavelData || hasOtherData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(turmaAtual, onClose, customHasDataChecker);

  // Função para limpar a chave PIX antes de enviar ao backend
  const limparChavePixParaBackend = (chavePix) => {
    if (!chavePix) return "";
    
    const chave = chavePix.trim();
    
    // Se for e-mail, retornar como está
    if (chave.includes('@')) {
      return chave;
    }
    
    // Para outros tipos, remover formatação e retornar apenas números
    return chave.replace(/\D/g, '');
  };

  // Preencher formulário quando turma for selecionada para edição
  useEffect(() => {
    if (open && turmaColheita) {
      setTurmaAtual({
        nomeColhedor: turmaColheita.nomeColhedor || "",
        chavePix: turmaColheita.chavePix || "",
        responsavelChavePix: turmaColheita.responsavelChavePix || "",
        observacoes: turmaColheita.observacoes || "",
      });
      setEditando(true);
    } else if (open) {
      setTurmaAtual({
        nomeColhedor: "",
        chavePix: "",
        responsavelChavePix: "",
        observacoes: "",
      });
      setEditando(false);
    }
    setErros({});
  }, [open, turmaColheita]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!turmaAtual.nomeColhedor?.trim()) {
      novosErros.nomeColhedor = "Nome do colhedor é obrigatório";
    }

    // Validação da chave PIX
    if (turmaAtual.chavePix?.trim()) {
      const chave = turmaAtual.chavePix.trim();
      
      // Verificar se é e-mail
      if (chave.includes('@')) {
        // Validação mais rigorosa de e-mail
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(chave)) {
          novosErros.chavePix = "E-mail inválido. Use o formato: usuario@dominio.com";
        }
      } else {
        // Para outros tipos, verificar se contém apenas números
        const numeros = chave.replace(/\D/g, '');
        
        if (numeros.length === 0) {
          novosErros.chavePix = "Chave PIX deve conter apenas números ou ser um e-mail válido";
        } else if (numeros.length < 10) {
          novosErros.chavePix = "Chave PIX muito curta (mínimo 10 dígitos)";
        } else if (numeros.length > 14) {
          novosErros.chavePix = "Chave PIX muito longa (máximo 14 dígitos)";
        }
      }
    }

    // Validação do responsável pela chave PIX
    if (turmaAtual.responsavelChavePix?.trim()) {
      const responsavel = turmaAtual.responsavelChavePix.trim();
      
      if (responsavel.length < 2) {
        novosErros.responsavelChavePix = "Nome do responsável deve ter pelo menos 2 caracteres";
      } else if (responsavel.length > 100) {
        novosErros.responsavelChavePix = "Nome do responsável muito longo (máximo 100 caracteres)";
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarTurma = async () => {
    if (!validarFormulario()) {
      // Verificar se há erro específico na chave PIX
      if (erros.chavePix) {
        showNotification("error", "Erro na Chave PIX", erros.chavePix);
      } else {
        showNotification("error", "Erro", "Por favor, corrija os erros no formulário");
      }
      return;
    }

    try {
      setIsSaving(true);

      // Preparar dados para envio
      const dadosEnvio = {
        ...turmaAtual,
        chavePix: limparChavePixParaBackend(turmaAtual.chavePix), // Limpar chave PIX antes de enviar
        // Adicionar data atual automaticamente
        dataCadastro: new Date().toISOString(),
      };

      await onSave(dadosEnvio);
      handleCancelar();
    } catch (error) {
      console.error("Erro ao salvar turma de colheita:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    setTurmaAtual({
      nomeColhedor: "",
      chavePix: "",
      responsavelChavePix: "",
      observacoes: "",
    });
    setErros({});
    onClose();
  };

  return (
    <>
      <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "16px",
          backgroundColor: "#059669",
          padding: isMobile ? "10px 12px" : "12px 16px",
          margin: isMobile ? "-20px -24px 0 -24px" : "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <GroupOutlined style={{ marginRight: 8 }} />
          {editando ? "Editar Turma de Colheita" : "Nova Turma de Colheita"}
        </span>
      }
      open={open}
      onCancel={handleCloseAttempt}
      footer={null}
      width={isMobile ? "96vw" : 800}
      style={{ maxWidth: isMobile ? "96vw" : 800 }}
      styles={{
        body: {
          maxHeight: isMobile ? "calc(100vh - 160px)" : "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
          minWidth: 0,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        }
      }}
      centered
      destroyOnClose
    >
      <TurmaColheitaForm
        turmaAtual={turmaAtual}
        setTurmaAtual={setTurmaAtual}
        erros={erros}
        setErros={setErros}
        loadingData={false}
      />

      {/* Footer com botões */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: isMobile ? "8px" : "12px",
        marginTop: isMobile ? "1rem" : "24px",
        paddingTop: isMobile ? "12px" : "16px",
        borderTop: "1px solid #e8e8e8"
      }}>
        <Button
          onClick={handleCloseAttempt}
          disabled={isSaving}
          icon={<CloseOutlined />}
          size={isMobile ? "small" : "large"}
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          onClick={handleSalvarTurma}
          loading={isSaving}
          disabled={loading}
          icon={<SaveOutlined />}
          size={isMobile ? "small" : "large"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
          }}
        >
          {editando ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </Modal>

    {/* Modal de confirmação para fechar sem salvar */}
    <ConfirmCloseModal
      open={confirmCloseModal}
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
      title="Descartar Dados da Turma de Colheita?"
      message="Você tem dados preenchidos no formulário de turma de colheita que serão perdidos."
      confirmText="Sim, Descartar"
      cancelText="Continuar Editando"
    />
    </>
  );
};

AddEditTurmaColheitaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  turmaColheita: PropTypes.object,
  loading: PropTypes.bool,
};


export default AddEditTurmaColheitaDialog;