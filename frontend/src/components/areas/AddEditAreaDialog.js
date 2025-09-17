// src/components/areas/AddEditAreaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Space } from "antd";
import PropTypes from "prop-types";
import LoadingFallback from "../common/loaders/LoadingFallback";
import { PrimaryButton } from "../common/buttons";
import AreaForm from "./AreaForm";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";

const AddEditAreaDialog = ({
  open,
  onClose,
  areaAtual,
  setAreaAtual,
  editando,
  culturas,
  erros,
  setErros,
  isSaving = false,
  handleSalvarArea,
  abrirMapa,
  onCulturasReload,
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
          {editando ? "Editar Área Agrícola" : "Adicionar Área Agrícola"}
        </span>
      }
      open={open}
      onCancel={onClose}
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
      <AreaForm
        areaAtual={areaAtual}
        setAreaAtual={setAreaAtual}
        editando={editando}
        culturas={culturas}
        erros={erros}
        setErros={setErros}
        abrirMapa={abrirMapa}
        onCulturasReload={onCulturasReload}
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
          onClick={handleSalvarArea}
          disabled={isSaving}
        >
          {editando ? "Salvar Alterações" : "Cadastrar Área"}
        </PrimaryButton>
      </div>
    </Modal>
  );
};

AddEditAreaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  areaAtual: PropTypes.object.isRequired,
  setAreaAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  culturas: PropTypes.array.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  handleSalvarArea: PropTypes.func.isRequired,
  abrirMapa: PropTypes.func.isRequired,
  onCulturasReload: PropTypes.func,
};

export default AddEditAreaDialog; 