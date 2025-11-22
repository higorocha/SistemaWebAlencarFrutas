// src/components/arh/cargos/AddEditCargoDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, message } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, IdcardOutlined } from "@ant-design/icons";
import CargoForm from "./CargoForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const AddEditCargoDialog = ({
  open,
  onClose,
  onSave,
  cargo,
  loading,
}) => {
  const [cargoAtual, setCargoAtual] = useState({
    nome: "",
    descricao: "",
    salarioMensal: 0,
    cargaHorariaMensal: undefined,
    adicionalPericulosidade: undefined,
    ativo: true,
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    const hasBasicData = data.nome?.trim() || 
                        data.descricao?.trim() ||
                        (data.salarioMensal && data.salarioMensal > 0);
    
    const hasOtherData = data.cargaHorariaMensal || 
                        data.adicionalPericulosidade;
    
    return hasBasicData || hasOtherData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(cargoAtual, onClose, customHasDataChecker);

  // Preencher formulário quando cargo for selecionado para edição
  useEffect(() => {
    if (open && cargo) {
      setCargoAtual({
        nome: cargo.nome || "",
        descricao: cargo.descricao || "",
        salarioMensal: Number(cargo.salarioMensal || 0),
        cargaHorariaMensal: cargo.cargaHorariaMensal || undefined,
        adicionalPericulosidade: cargo.adicionalPericulosidade || undefined,
        ativo: cargo.ativo !== false,
      });
      setEditando(true);
    } else if (open) {
      setCargoAtual({
        nome: "",
        descricao: "",
        salarioMensal: 0,
        cargaHorariaMensal: undefined,
        adicionalPericulosidade: undefined,
        ativo: true,
      });
      setEditando(false);
    }
    setErros({});
  }, [open, cargo]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!cargoAtual.nome?.trim()) {
      novosErros.nome = "Nome do cargo é obrigatório";
    }

    if (!cargoAtual.salarioMensal || cargoAtual.salarioMensal <= 0) {
      novosErros.salarioMensal = "Salário mensal é obrigatório e deve ser maior que zero";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarCargo = async () => {
    if (!validarFormulario()) {
      message.error("Por favor, corrija os erros no formulário");
      return;
    }

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(cargoAtual);
  };

  const handleCancelar = () => {
    handleCloseAttempt();
  };

  const handleConfirmarCancelar = () => {
    setCargoAtual({
      nome: "",
      descricao: "",
      salarioMensal: 0,
      cargaHorariaMensal: undefined,
      adicionalPericulosidade: undefined,
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
            {editando ? "Editar Cargo" : "Novo Cargo"}
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
        <CargoForm
          cargoAtual={cargoAtual}
          setCargoAtual={setCargoAtual}
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
            onClick={handleSalvarCargo}
            disabled={loading}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {editando ? "Atualizar" : "Criar"} Cargo
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados do Cargo?"
        message="Você tem dados preenchidos no formulário de cargo que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

AddEditCargoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  cargo: PropTypes.object,
  loading: PropTypes.bool,
};

export default AddEditCargoDialog;

