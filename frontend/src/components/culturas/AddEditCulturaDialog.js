// src/components/culturas/AddEditCulturaDialog.js

import React from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { PrimaryButton } from "../common/buttons";
import CulturaForm from "./CulturaForm";
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";

const AddEditCulturaDialog = ({
  open,
  onClose,
  culturaAtual,
  setCulturaAtual,
  editando,
  erros,
  setErros,
  isSaving = false,
  handleSalvarCultura,
}) => {
  // Função customizada para verificar se há dados preenchidos no formulário de culturas
  const customHasDataChecker = (data) => {
    // Verifica campos básicos obrigatórios
    const hasBasicData = data.descricao?.trim() ||
                        data.periodicidade;

    // Verifica se permitirConsorcio foi alterado do padrão (false)
    const hasConsorcioData = data.permitirConsorcio === true;

    return hasBasicData || hasConsorcioData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(culturaAtual, onClose, customHasDataChecker);

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
          {editando ? "Editar Cultura" : "Adicionar Cultura"}
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
        }
      }}
      centered
      destroyOnClose
    >
      <CulturaForm
        culturaAtual={culturaAtual}
        setCulturaAtual={setCulturaAtual}
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
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Button
          onClick={handleCloseAttempt}
          size="large"
        >
          Cancelar
        </Button>
        <PrimaryButton
          onClick={handleSalvarCultura}
          loading={isSaving}
        >
          {editando ? "Salvar Alterações" : "Cadastrar Cultura"}
        </PrimaryButton>
      </div>
    </Modal>

    {/* Modal de confirmação para fechar sem salvar */}
    <ConfirmCloseModal
      open={confirmCloseModal}
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
      title="Descartar Dados da Cultura?"
      message="Você tem dados preenchidos no formulário de cultura que serão perdidos."
      confirmText="Sim, Descartar"
      cancelText="Continuar Editando"
    />
    </>
  );
};

AddEditCulturaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  culturaAtual: PropTypes.object.isRequired,
  setCulturaAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  handleSalvarCultura: PropTypes.func.isRequired,
};

export default AddEditCulturaDialog;
