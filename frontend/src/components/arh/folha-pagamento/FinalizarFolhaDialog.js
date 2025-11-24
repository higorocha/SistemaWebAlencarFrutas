// src/components/arh/folha-pagamento/FinalizarFolhaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, LockOutlined } from "@ant-design/icons";
import FinalizarFolhaForm from "./FinalizarFolhaForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const FinalizarFolhaDialog = ({ open, onClose, onSave, folha }) => {
  const [finalizacaoAtual, setFinalizacaoAtual] = useState({
    meioPagamento: "PIX",
    dataPagamento: undefined,
    observacoes: "",
  });
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return data.meioPagamento || data.dataPagamento || data.observacoes?.trim();
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(finalizacaoAtual, onClose, customHasDataChecker);

  // Resetar formulário quando abrir
  useEffect(() => {
    if (open) {
      setFinalizacaoAtual({
        meioPagamento: "PIX",
        dataPagamento: undefined,
        observacoes: "",
      });
      setErros({});
    }
  }, [open]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!finalizacaoAtual.meioPagamento) {
      novosErros.meioPagamento = "Meio de pagamento é obrigatório";
    }

    if (!finalizacaoAtual.dataPagamento) {
      novosErros.dataPagamento = "Data de pagamento é obrigatória";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleFinalizar = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Preparar dados para envio
    const dadosEnvio = {
      meioPagamento: finalizacaoAtual.meioPagamento,
      dataPagamento: finalizacaoAtual.dataPagamento.toISOString(),
      observacoes: finalizacaoAtual.observacoes || undefined,
    };

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(dadosEnvio);
  };

  const handleConfirmarCancelar = () => {
    setFinalizacaoAtual({
      meioPagamento: "PIX",
      dataPagamento: undefined,
      observacoes: "",
    });
    setErros({});
    handleConfirmClose();
  };

  return (
    <>
      <Modal
        title={
          <span
            style={{
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "16px",
              backgroundColor: "#059669",
              padding: "12px 16px",
              margin: "-20px -24px 0 -24px",
              display: "block",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <LockOutlined style={{ marginRight: 8 }} />
            Finalizar Folha de Pagamento
          </span>
        }
        open={open}
        onCancel={handleCloseAttempt}
        footer={null}
        width="90%"
        style={{ maxWidth: 700 }}
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
          },
        }}
        centered
        destroyOnClose
      >
        <FinalizarFolhaForm
          finalizacaoAtual={finalizacaoAtual}
          setFinalizacaoAtual={setFinalizacaoAtual}
          erros={erros}
          setErros={setErros}
          folha={folha}
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
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleFinalizar}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            Finalizar Folha
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados?"
        message="Você tem dados preenchidos que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

FinalizarFolhaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  folha: PropTypes.object,
};

export default FinalizarFolhaDialog;


