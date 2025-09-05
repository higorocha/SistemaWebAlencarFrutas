// src/components/frutas/AddEditFrutaDialog.js

import React from "react";
import { Modal, Button, Space } from "antd";
import PropTypes from "prop-types";
import LoadingFallback from "../common/loaders/LoadingFallback";
import { PrimaryButton } from "../common/buttons";
import FrutaForm from "./FrutaForm";

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
          {editando ? "Editar Fruta" : "Adicionar Fruta"}
        </span>
      }
      open={open}
      onCancel={onClose}
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
          onClick={onClose}
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