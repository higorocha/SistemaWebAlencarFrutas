// src/components/arh/funcoes/AddEditFuncaoDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, message } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, IdcardOutlined } from "@ant-design/icons";
import FuncaoForm from "./FuncaoForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const AddEditFuncaoDialog = ({
  open,
  onClose,
  onSave,
  funcao,
  loading,
}) => {
  const [funcaoAtual, setFuncaoAtual] = useState({
    nome: "",
    descricao: "",
    valorDiariaBase: 0,
    duracaoPadraoHoras: undefined,
    exigeEpi: false,
    ativo: true,
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    const hasBasicData = data.nome?.trim() || 
                        data.descricao?.trim() ||
                        (data.valorDiariaBase && data.valorDiariaBase > 0);
    
    const hasOtherData = data.duracaoPadraoHoras || 
                        data.exigeEpi === true;
    
    return hasBasicData || hasOtherData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(funcaoAtual, onClose, customHasDataChecker);

  // Preencher formulário quando função for selecionada para edição
  useEffect(() => {
    if (open && funcao) {
      setFuncaoAtual({
        nome: funcao.nome || "",
        descricao: funcao.descricao || "",
        valorDiariaBase: Number(funcao.valorDiariaBase || 0),
        duracaoPadraoHoras: funcao.duracaoPadraoHoras || undefined,
        exigeEpi: funcao.exigeEpi || false,
        ativo: funcao.ativo !== false,
      });
      setEditando(true);
    } else if (open) {
      setFuncaoAtual({
        nome: "",
        descricao: "",
        valorDiariaBase: 0,
        duracaoPadraoHoras: undefined,
        exigeEpi: false,
        ativo: true,
      });
      setEditando(false);
    }
    setErros({});
  }, [open, funcao]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!funcaoAtual.nome?.trim()) {
      novosErros.nome = "Nome da função é obrigatório";
    }

    if (!funcaoAtual.valorDiariaBase || funcaoAtual.valorDiariaBase <= 0) {
      novosErros.valorDiariaBase = "Valor da diária é obrigatório e deve ser maior que zero";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarFuncao = async () => {
    if (!validarFormulario()) {
      message.error("Por favor, corrija os erros no formulário");
      return;
    }

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(funcaoAtual);
  };

  const handleCancelar = () => {
    handleCloseAttempt();
  };

  const handleConfirmarCancelar = () => {
    setFuncaoAtual({
      nome: "",
      descricao: "",
      valorDiariaBase: 0,
      duracaoPadraoHoras: undefined,
      exigeEpi: false,
      ativo: true,
    });
    setErros({});
    handleConfirmClose();
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
            <IdcardOutlined style={{ marginRight: 8 }} />
            {editando ? "Editar Função" : "Nova Função"}
          </span>
        }
        open={open}
        onCancel={handleCloseAttempt}
        footer={null}
        width="90%"
        style={{ maxWidth: 900 }}
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
        <FuncaoForm
          funcaoAtual={funcaoAtual}
          setFuncaoAtual={setFuncaoAtual}
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
            disabled={loading}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSalvarFuncao}
            disabled={loading}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {editando ? "Atualizar" : "Criar"} Função
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados da Função?"
        message="Você tem dados preenchidos no formulário de função que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

AddEditFuncaoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  funcao: PropTypes.object,
  loading: PropTypes.bool,
};

export default AddEditFuncaoDialog;

