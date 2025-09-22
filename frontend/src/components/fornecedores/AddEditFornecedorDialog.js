// src/components/fornecedores/AddEditFornecedorDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Space, message } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { validarDocumento } from "../../utils/documentValidation";
import FornecedorForm from "./FornecedorForm";
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";

const AddEditFornecedorDialog = ({
  open,
  onClose,
  onSave,
  fornecedor,
  loading,
}) => {
  const [fornecedorAtual, setFornecedorAtual] = useState({
    nome: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
    observacoes: "",
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Função customizada para verificar se há dados preenchidos no formulário de fornecedores
  const customHasDataChecker = (data) => {
    // Verifica campos básicos obrigatórios
    const hasBasicData = data.nome?.trim() || 
                        data.documento?.trim();
    
    // Verifica dados de contato
    const hasContactData = data.telefone?.trim() || 
                          data.email?.trim();
    
    // Verifica outros campos
    const hasOtherData = data.endereco?.trim() || 
                        data.observacoes?.trim();
    
    return hasBasicData || hasContactData || hasOtherData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(fornecedorAtual, onClose, customHasDataChecker);

  // Preencher formulário quando fornecedor for selecionado para edição
  useEffect(() => {
    if (open && fornecedor) {
      setFornecedorAtual({
        id: fornecedor.id, // ADICIONANDO O ID!
        nome: fornecedor.nome || "",
        documento: fornecedor.cnpj || fornecedor.cpf || "",
        telefone: fornecedor.telefone || "",
        email: fornecedor.email || "",
        endereco: fornecedor.endereco || "",
        observacoes: fornecedor.observacoes || "",
      });
      setEditando(true);
    } else if (open) {
      setFornecedorAtual({
        nome: "",
        documento: "",
        telefone: "",
        email: "",
        endereco: "",
        observacoes: "",
      });
      setEditando(false);
    }
    setErros({});
  }, [open, fornecedor]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!fornecedorAtual.nome?.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }

    // Validação robusta do documento (CPF ou CNPJ)
    if (fornecedorAtual.documento) {
      const validacao = validarDocumento(fornecedorAtual.documento);
      if (!validacao.valido) {
        novosErros.documento = validacao.mensagem;
      }
    }

    // Validação de telefone removida - a máscara garante o formato correto

    if (fornecedorAtual.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fornecedorAtual.email)) {
      novosErros.email = "Email inválido";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarFornecedor = async () => {
    if (!validarFormulario()) {
      message.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setIsSaving(true);
      
      // Remover campos que não devem ser enviados na atualização
      const dadosParaEnviar = { ...fornecedorAtual };
      delete dadosParaEnviar.id; // Remove o ID
      delete dadosParaEnviar.createdAt; // Remove campos de auditoria
      delete dadosParaEnviar.updatedAt;
      
      await onSave(dadosParaEnviar);
      handleCancelar();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    setFornecedorAtual({
      nome: "",
      documento: "",
      telefone: "",
      email: "",
      endereco: "",
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
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <UserOutlined style={{ marginRight: 8 }} />
          {editando ? "Editar Fornecedor" : "Novo Fornecedor"}
        </span>
      }
      open={open}
      onCancel={handleCloseAttempt}
      footer={null}
      width="90%"
      style={{ maxWidth: 1200 }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px",
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
      <FornecedorForm
        fornecedorAtual={fornecedorAtual}
        setFornecedorAtual={setFornecedorAtual}
        editando={editando}
        erros={erros}
        setErros={setErros}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid #e8e8e8",
        }}
      >
        <Button
          icon={<CloseOutlined />}
          onClick={handleCloseAttempt}
          disabled={loading || isSaving}
          size="large"
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSalvarFornecedor}
          loading={loading || isSaving}
          size="large"
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
          }}
        >
          {isSaving ? "Salvando..." : (editando ? "Atualizar" : "Criar")} Fornecedor
        </Button>
      </div>
    </Modal>

    {/* Modal de confirmação para fechar sem salvar */}
    <ConfirmCloseModal
      open={confirmCloseModal}
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
      title="Descartar Dados do Fornecedor?"
      message="Você tem dados preenchidos no formulário de fornecedor que serão perdidos."
      confirmText="Sim, Descartar"
      cancelText="Continuar Editando"
    />
    </>
  );
};

AddEditFornecedorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  fornecedor: PropTypes.object,
  loading: PropTypes.bool,
};

export default AddEditFornecedorDialog;
