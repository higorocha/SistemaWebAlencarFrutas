// src/components/arh/folha-pagamento/AtualizarPagamentoDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, DollarOutlined } from "@ant-design/icons";
import AtualizarPagamentoForm from "./AtualizarPagamentoForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";
import dayjs from "dayjs";

const AtualizarPagamentoDialog = ({ open, onClose, onSave, lancamento }) => {
  const [pagamentoAtual, setPagamentoAtual] = useState({
    meioPagamento: undefined,
    statusPagamento: undefined,
    pagamentoEfetuado: false,
    dataPagamento: undefined,
  });
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return (
      data.meioPagamento ||
      data.statusPagamento ||
      data.pagamentoEfetuado ||
      data.dataPagamento
    );
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(pagamentoAtual, onClose, customHasDataChecker);

  // Resetar/carregar formulário quando abrir ou mudar o lançamento
  useEffect(() => {
    if (open && lancamento) {
      setPagamentoAtual({
        meioPagamento: lancamento.meioPagamento,
        statusPagamento: lancamento.statusPagamento,
        pagamentoEfetuado: lancamento.pagamentoEfetuado,
        dataPagamento: lancamento.dataPagamento
          ? dayjs(lancamento.dataPagamento)
          : undefined,
      });
      setErros({});
    }
  }, [open, lancamento]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!pagamentoAtual.meioPagamento) {
      novosErros.meioPagamento = "Meio de pagamento é obrigatório";
    }

    if (!pagamentoAtual.statusPagamento) {
      novosErros.statusPagamento = "Status do pagamento é obrigatório";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Preparar dados para envio
    const dadosEnvio = {
      ...pagamentoAtual,
      dataPagamento: pagamentoAtual.dataPagamento
        ? pagamentoAtual.dataPagamento.toISOString()
        : undefined,
    };

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(dadosEnvio);
  };

  const handleConfirmarCancelar = () => {
    setPagamentoAtual({
      meioPagamento: undefined,
      statusPagamento: undefined,
      pagamentoEfetuado: false,
      dataPagamento: undefined,
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
            <DollarOutlined style={{ marginRight: 8 }} />
            Atualizar Pagamento - {funcionarioNome}
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
        <AtualizarPagamentoForm
          pagamentoAtual={pagamentoAtual}
          setPagamentoAtual={setPagamentoAtual}
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
            Atualizar
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

AtualizarPagamentoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  lancamento: PropTypes.object,
};

export default AtualizarPagamentoDialog;

