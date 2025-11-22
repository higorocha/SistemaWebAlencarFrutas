// src/components/arh/folha-pagamento/NovaFolhaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, FileAddOutlined } from "@ant-design/icons";
import NovaFolhaForm from "./NovaFolhaForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const NovaFolhaDialog = ({ open, onClose, onSave }) => {
  const [folhaAtual, setFolhaAtual] = useState({
    competenciaMes: undefined,
    competenciaAno: undefined,
    periodo: undefined,
    referencia: "",
  });
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return data.competenciaMes || data.competenciaAno || data.periodo || data.referencia?.trim();
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(folhaAtual, onClose, customHasDataChecker);

  // Resetar formulário quando abrir
  useEffect(() => {
    if (open) {
      setFolhaAtual({
        competenciaMes: undefined,
        competenciaAno: undefined,
        periodo: undefined,
        referencia: "",
      });
      setErros({});
    }
  }, [open]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!folhaAtual.competenciaMes) {
      novosErros.competenciaMes = "Mês é obrigatório";
    }

    if (!folhaAtual.competenciaAno) {
      novosErros.competenciaAno = "Ano é obrigatório";
    }

    if (!folhaAtual.periodo) {
      novosErros.periodo = "Quinzena é obrigatória";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarFolha = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(folhaAtual);
  };

  const handleCancelar = () => {
    handleCloseAttempt();
  };

  const handleConfirmarCancelar = () => {
    setFolhaAtual({
      competenciaMes: undefined,
      competenciaAno: undefined,
      periodo: undefined,
      referencia: "",
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
            <FileAddOutlined style={{ marginRight: 8 }} />
            Nova Folha de Pagamento
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
        <NovaFolhaForm
          folhaAtual={folhaAtual}
          setFolhaAtual={setFolhaAtual}
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
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSalvarFolha}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            Criar Folha
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados da Folha?"
        message="Você tem dados preenchidos no formulário de folha que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

NovaFolhaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default NovaFolhaDialog;

