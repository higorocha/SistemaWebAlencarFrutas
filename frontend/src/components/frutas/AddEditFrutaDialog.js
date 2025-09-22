// src/components/frutas/AddEditFrutaDialog.js

import React from "react";
import { Modal, Button, Space } from "antd";
import PropTypes from "prop-types";
import LoadingFallback from "../common/loaders/LoadingFallback";
import { PrimaryButton } from "../common/buttons";
import FrutaForm from "./FrutaForm";
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";

const AddEditFrutaDialog = ({
  open,
  onClose,
  frutaAtual,
  setFrutaAtual,
  editando,
  erros,
  setErros,
  isSaving = false,
  handleSalvarFruta,
}) => {
  // Função customizada para verificar se há dados preenchidos no formulário de frutas
  const customHasDataChecker = (data) => {
    // Verifica campos básicos obrigatórios
    const hasBasicData = data.nome?.trim() || 
                        data.codigo?.trim() || 
                        data.categoria;
    
    // Verifica dados de unidades de medida
    const hasUnitData = data.unidadeMedida1?.trim() || 
                       data.unidadeMedida2?.trim();
    
    // Verifica outros campos
    const hasOtherData = data.descricao?.trim() || 
                        data.observacoes?.trim();
    
    return hasBasicData || hasUnitData || hasOtherData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(frutaAtual, onClose, customHasDataChecker);

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
          {editando ? "Editar Fruta" : "Adicionar Fruta"}
        </span>
      }
      open={open}
      onCancel={handleCloseAttempt}
      footer={null}
      width="90%"
      style={{ maxWidth: 800 }}
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
      <FrutaForm
        frutaAtual={frutaAtual}
        setFrutaAtual={setFrutaAtual}
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
          onClick={handleSalvarFruta}
          loading={isSaving}
        >
          {editando ? "Salvar Alterações" : "Cadastrar Fruta"}
        </PrimaryButton>
      </div>
    </Modal>

    {/* Modal de confirmação para fechar sem salvar */}
    <ConfirmCloseModal
      open={confirmCloseModal}
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
      title="Descartar Dados da Fruta?"
      message="Você tem dados preenchidos no formulário de fruta que serão perdidos."
      confirmText="Sim, Descartar"
      cancelText="Continuar Editando"
    />
    </>
  );
};

AddEditFrutaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  frutaAtual: PropTypes.object.isRequired,
  setFrutaAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  handleSalvarFruta: PropTypes.func.isRequired,
};

export default AddEditFrutaDialog; 