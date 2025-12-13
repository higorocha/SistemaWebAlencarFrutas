// src/components/arh/folha-pagamento/EditarLancamentoDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, CalculatorOutlined } from "@ant-design/icons";
import EditarLancamentoForm from "./EditarLancamentoForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const EditarLancamentoDialog = ({ open, onClose, onSave, lancamento }) => {
  const [lancamentoAtual, setLancamentoAtual] = useState({
    diasTrabalhados: undefined,
    faltas: undefined,
    horasExtras: undefined,
    valorHoraExtra: undefined,
    ajudaCusto: undefined,
    extras: undefined,
    adiantamento: undefined,
  });
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return (
      data.diasTrabalhados ||
      data.faltas ||
      data.horasExtras ||
      data.valorHoraExtra ||
      data.ajudaCusto ||
      data.extras ||
      data.adiantamento
    );
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(lancamentoAtual, onClose, customHasDataChecker);

  // Resetar/carregar formulário quando abrir ou mudar o lançamento
  useEffect(() => {
    if (open && lancamento) {
      setLancamentoAtual({
        diasTrabalhados: lancamento.diasTrabalhados,
        faltas: lancamento.faltas,
        horasExtras: Number(lancamento.horasExtras || 0),
        valorHoraExtra: Number(lancamento.valorHoraExtra || 0),
        ajudaCusto: Number(lancamento.ajudaCusto || 0),
        extras: Number(lancamento.extras || 0),
        adiantamento: Number(lancamento.adiantamento || 0),
      });
      setErros({});
    }
  }, [open, lancamento]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!lancamentoAtual.diasTrabalhados && lancamentoAtual.diasTrabalhados !== 0) {
      novosErros.diasTrabalhados = "Dias trabalhados é obrigatório";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(lancamentoAtual);
  };

  const handleConfirmarCancelar = () => {
    setLancamentoAtual({
      diasTrabalhados: undefined,
      faltas: undefined,
      horasExtras: undefined,
      valorHoraExtra: undefined,
      ajudaCusto: undefined,
      extras: undefined,
      adiantamento: undefined,
    });
    setErros({});
    handleConfirmClose();
  };

  const funcionarioNome = lancamento?.funcionario?.nome || "Funcionário";

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
            <CalculatorOutlined style={{ marginRight: 8 }} />
            Calcular Lançamento - {funcionarioNome}
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
          },
        }}
        centered
        destroyOnClose
      >
        <EditarLancamentoForm
          lancamentoAtual={lancamentoAtual}
          setLancamentoAtual={setLancamentoAtual}
          erros={erros}
          setErros={setErros}
          lancamento={lancamento}
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
            onClick={handleSalvar}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            Recalcular
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Alterações?"
        message="Você tem alterações não salvas que serão perdidas."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

EditarLancamentoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  lancamento: PropTypes.object,
};

export default EditarLancamentoDialog;








