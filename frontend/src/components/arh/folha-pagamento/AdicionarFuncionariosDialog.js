// src/components/arh/folha-pagamento/AdicionarFuncionariosDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, UserAddOutlined } from "@ant-design/icons";
import AdicionarFuncionariosForm from "./AdicionarFuncionariosForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const AdicionarFuncionariosDialog = ({ 
  open, 
  onClose, 
  onSave, 
  funcionarios, 
  funcionariosNaFolha 
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return data && data.length > 0;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(selectedIds, onClose, customHasDataChecker);

  // Resetar quando abrir
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setErros({});
    }
  }, [open]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!selectedIds || selectedIds.length === 0) {
      novosErros.funcionarios = "Selecione pelo menos um funcionário";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(selectedIds);
  };

  const handleConfirmarCancelar = () => {
    setSelectedIds([]);
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
            <UserAddOutlined style={{ marginRight: 8 }} />
            Adicionar Funcionários à Folha
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
        <AdicionarFuncionariosForm
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          erros={erros}
          setErros={setErros}
          funcionarios={funcionarios}
          funcionariosNaFolha={funcionariosNaFolha}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "20px",
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
            onClick={handleSalvar}
            size="large"
            style={{ backgroundColor: "#059669" }}
          >
            Adicionar Selecionados
          </Button>
        </div>
      </Modal>

      {/* Modal de Confirmação de Fechamento */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
      />
    </>
  );
};

AdicionarFuncionariosDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  funcionarios: PropTypes.array.isRequired,
  funcionariosNaFolha: PropTypes.array,
};

export default AdicionarFuncionariosDialog;

