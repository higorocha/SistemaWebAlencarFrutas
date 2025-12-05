// src/components/arh/folha-pagamento/FinalizarFolhaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, LockOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import FinalizarFolhaForm from "./FinalizarFolhaForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";
import useRestricaoDataPagamentoLoteBB from "../../../hooks/useRestricaoDataPagamentoLoteBB";
import moment from "moment";

const FinalizarFolhaDialog = ({ open, onClose, onSave, folha, modoReprocessamento = false, resumoRejeitados = null }) => {
  const [finalizacaoAtual, setFinalizacaoAtual] = useState({
    meioPagamento: modoReprocessamento ? "PIX_API" : "PIX",
    dataPagamento: undefined,
    contaCorrenteId: null,
    observacoes: "",
  });
  const [erros, setErros] = useState({});
  
  // Hook de validação de data para pagamentos via API de Lote BB
  const {
    validarEMostrarErro,
    mostrarAlertaLiberacao,
  } = useRestricaoDataPagamentoLoteBB();

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return data.meioPagamento || data.dataPagamento || data.contaCorrenteId || data.observacoes?.trim();
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(finalizacaoAtual, onClose, customHasDataChecker);

  // Resetar formulário quando abrir
  useEffect(() => {
    if (open) {
      setFinalizacaoAtual({
        meioPagamento: modoReprocessamento ? "PIX_API" : "PIX",
        dataPagamento: moment(), // Inicializar com data atual
        contaCorrenteId: null,
        observacoes: "",
      });
      setErros({});
    }
  }, [open, modoReprocessamento]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!finalizacaoAtual.meioPagamento) {
      novosErros.meioPagamento = "Meio de pagamento é obrigatório";
    }

    if (!finalizacaoAtual.dataPagamento) {
      novosErros.dataPagamento = "Data de pagamento é obrigatória";
    }

    // Validar conta corrente para PIX_API
    if (finalizacaoAtual.meioPagamento === "PIX_API" && !finalizacaoAtual.contaCorrenteId) {
      novosErros.contaCorrenteId = "Conta corrente é obrigatória para pagamento via PIX-API";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleFinalizar = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Validar data se for PIX_API
    if (finalizacaoAtual.meioPagamento === "PIX_API") {
      if (!validarEMostrarErro(finalizacaoAtual.dataPagamento)) {
        return; // Interrompe se validação falhar
      }
    }

    // Preparar dados para envio
    const dadosEnvio = {
      meioPagamento: finalizacaoAtual.meioPagamento,
      dataPagamento: finalizacaoAtual.dataPagamento.toISOString(),
      observacoes: finalizacaoAtual.observacoes || undefined,
    };

    // Incluir contaCorrenteId para PIX_API (garantir que seja número)
    if (finalizacaoAtual.meioPagamento === "PIX_API") {
      if (!finalizacaoAtual.contaCorrenteId) {
        setErros((prev) => ({
          ...prev,
          contaCorrenteId: "Conta corrente é obrigatória para pagamento via PIX-API",
        }));
        return;
      }
      // Garantir que seja número
      dadosEnvio.contaCorrenteId = Number(finalizacaoAtual.contaCorrenteId);
    }

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(dadosEnvio);
  };

  const handleConfirmarCancelar = () => {
    setFinalizacaoAtual({
      meioPagamento: modoReprocessamento ? "PIX_API" : "PIX",
      dataPagamento: undefined,
      contaCorrenteId: null,
      observacoes: "",
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
            {modoReprocessamento ? <WarningOutlined style={{ marginRight: 8 }} /> : <LockOutlined style={{ marginRight: 8 }} />}
            {modoReprocessamento ? "Reprocessar Pagamentos Rejeitados" : "Finalizar Folha de Pagamento"}
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
        <FinalizarFolhaForm
          finalizacaoAtual={finalizacaoAtual}
          setFinalizacaoAtual={setFinalizacaoAtual}
          erros={erros}
          setErros={setErros}
          folha={folha}
          modoReprocessamento={modoReprocessamento}
          resumoRejeitados={resumoRejeitados}
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
            icon={modoReprocessamento ? <ReloadOutlined /> : <SaveOutlined />}
            onClick={handleFinalizar}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {modoReprocessamento ? "Reprocessar" : "Finalizar Folha"}
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados?"
        message="Você tem dados preenchidos que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

FinalizarFolhaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  folha: PropTypes.object,
  modoReprocessamento: PropTypes.bool,
  resumoRejeitados: PropTypes.shape({
    quantidadeTotal: PropTypes.number,
    quantidadeRejeitados: PropTypes.number,
    quantidadeSucesso: PropTypes.number,
    valorTotal: PropTypes.number,
  }),
};

export default FinalizarFolhaDialog;




