// src/components/clientes/AddEditClienteDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Space, message } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { validarDocumento } from "../../utils/documentValidation";
import ClienteForm from "./ClienteForm";

const AddEditClienteDialog = ({
  open,
  onClose,
  onSave,
  cliente,
  loading,
}) => {
  const [clienteAtual, setClienteAtual] = useState({
    nome: "",
    razaoSocial: "",
    documento: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    logradouro: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone1: "",
    telefone2: "",
    email1: "",
    email2: "",
    observacoes: "",
    status: "ATIVO",
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Preencher formulário quando cliente for selecionado para edição
  useEffect(() => {
    if (open && cliente) {
      setClienteAtual({
        nome: cliente.nome || "",
        razaoSocial: cliente.razaoSocial || "",
        documento: cliente.cnpj || cliente.cpf || "",
        inscricaoEstadual: cliente.inscricaoEstadual || "",
        inscricaoMunicipal: cliente.inscricaoMunicipal || "",
        logradouro: cliente.logradouro || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
        cep: cliente.cep || "",
        telefone1: cliente.telefone1 || "",
        telefone2: cliente.telefone2 || "",
        email1: cliente.email1 || "",
        email2: cliente.email2 || "",
        observacoes: cliente.observacoes || "",
        status: cliente.status || "ATIVO",
      });
      setEditando(true);
    } else if (open) {
      setClienteAtual({
        nome: "",
        razaoSocial: "",
        documento: "",
        inscricaoEstadual: "",
        inscricaoMunicipal: "",
        logradouro: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        telefone1: "",
        telefone2: "",
        email1: "",
        email2: "",
        observacoes: "",
        status: "ATIVO",
      });
      setEditando(false);
    }
    setErros({});
  }, [open, cliente]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!clienteAtual.nome?.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }

    // Validação de documento (CPF/CNPJ) - a máscara garante o formato correto
    if (clienteAtual.documento) {
      const validacao = validarDocumento(clienteAtual.documento);
      if (!validacao.valido) {
        novosErros.documento = validacao.mensagem;
      }
    }

    // Validações de formato removidas - as máscaras garantem o formato correto

    if (clienteAtual.email1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteAtual.email1)) {
      novosErros.email1 = "Email inválido";
    }

    if (clienteAtual.email2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteAtual.email2)) {
      novosErros.email2 = "Email inválido";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarCliente = async () => {
    if (!validarFormulario()) {
      message.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setIsSaving(true);
      await onSave(clienteAtual);
      handleCancelar();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    setClienteAtual({
      nome: "",
      razaoSocial: "",
      documento: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      logradouro: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      telefone1: "",
      telefone2: "",
      email1: "",
      email2: "",
      observacoes: "",
      status: "ATIVO",
    });
    setErros({});
    onClose();
  };

  return (
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
          {editando ? "Editar Cliente" : "Novo Cliente"}
        </span>
      }
      open={open}
      onCancel={handleCancelar}
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
      <ClienteForm
        clienteAtual={clienteAtual}
        setClienteAtual={setClienteAtual}
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
          onClick={handleCancelar}
          disabled={loading || isSaving}
          size="large"
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSalvarCliente}
          loading={loading || isSaving}
          size="large"
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
          }}
        >
          {isSaving ? "Salvando..." : (editando ? "Atualizar" : "Criar")} Cliente
        </Button>
      </div>
    </Modal>
  );
};

AddEditClienteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  cliente: PropTypes.object,
  loading: PropTypes.bool,
};

export default AddEditClienteDialog; 