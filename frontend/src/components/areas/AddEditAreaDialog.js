// src/components/areas/AddEditAreaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Space } from "antd";
import PropTypes from "prop-types";
import LoadingFallback from "../common/loaders/LoadingFallback";
import { PrimaryButton } from "../common/buttons";
import AreaForm from "./AreaForm";
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";
import useResponsive from "../../hooks/useResponsive";
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
  const { isMobile } = useResponsive();

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(areaAtual, onClose);

  return (
    <>
      <Modal
        title={
          <span style={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}>
            {editando ? "Editar Área Agrícola" : "Adicionar Área Agrícola"}
          </span>
        }
        open={open}
        onCancel={handleCloseAttempt}
        footer={null}
        width={isMobile ? '95vw' : '90%'}
        style={{ maxWidth: isMobile ? '95vw' : "75rem" }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 12.5rem)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? 12 : 20,
          },
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
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
            gap: isMobile ? "8px" : "12px",
            marginTop: isMobile ? "1rem" : "1.5rem",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Button
            onClick={handleCloseAttempt}
            size={isMobile ? "small" : "middle"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Cancelar
          </Button>
          <PrimaryButton
            onClick={handleSalvarArea}
            disabled={isSaving}
            style={{
              height: isMobile ? "32px" : undefined,
              padding: isMobile ? "0 12px" : undefined,
            }}
          >
            {editando ? "Salvar Alterações" : "Cadastrar Área"}
          </PrimaryButton>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
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