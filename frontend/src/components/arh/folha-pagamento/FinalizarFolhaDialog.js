// src/components/arh/folha-pagamento/FinalizarFolhaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Alert } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, LockOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import FinalizarFolhaForm from "./FinalizarFolhaForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import InfoAlertModal from "../../common/modals/InfoAlertModal";
import useConfirmClose from "../../../hooks/useConfirmClose";
import useRestricaoDataPagamentoLoteBB from "../../../hooks/useRestricaoDataPagamentoLoteBB";
import moment from "moment";

const FinalizarFolhaDialog = ({ open, onClose, onSave, folha, lancamentos = [], modoReprocessamento = false, resumoRejeitados = null }) => {
  const [finalizacaoAtual, setFinalizacaoAtual] = useState({
    meioPagamento: modoReprocessamento ? "PIX_API" : "PIX",
    dataPagamento: undefined,
    contaCorrenteId: null,
    observacoes: "",
  });
  const [erros, setErros] = useState({});
  const [validacaoDiasZeroModal, setValidacaoDiasZeroModal] = useState({ open: false, itens: [] });
  const [validacaoAdiantamentoModal, setValidacaoAdiantamentoModal] = useState({ open: false, itens: [] });

  // Hook de validação de data para pagamentos via API de Lote BB
  const {
    validarEMostrarErro,
    mostrarAlertaLiberacao,
  } = useRestricaoDataPagamentoLoteBB();

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return data.meioPagamento || data.dataPagamento || data.contaCorrenteId || data.observacoes?.trim();
  };

  // Validar se há funcionários com dias = 0
  const validarDiasZero = () => {
    if (!Array.isArray(lancamentos) || lancamentos.length === 0) {
      return true; // Nenhum lançamento, sem problema
    }

    const funcionariosComDiasZero = [];

    lancamentos.forEach((lancamento) => {
      const dias = Number(lancamento.diasTrabalhados || 0);

      // Se dias = 0, não permite finalizar
      if (dias === 0) {
        funcionariosComDiasZero.push({
          id: lancamento.id,
          nome: lancamento.funcionario?.nome || "Funcionário",
          dias,
          motivo: "Funcionário com 0 dias trabalhados",
        });
      }
    });

    if (funcionariosComDiasZero.length > 0) {
      // Abrir modal informativo
      setValidacaoDiasZeroModal({ open: true, itens: funcionariosComDiasZero });
      return false;
    }

    return true;
  };

  // Validar se há funcionários com adiantamento maior que o valor bruto
  const validarAdiantamentos = () => {
    if (!Array.isArray(lancamentos) || lancamentos.length === 0) {
      return true; // Nenhum lançamento, sem problema
    }

    const funcionariosComProblema = [];

    lancamentos.forEach((lancamento) => {
      const adiantamento = Number(lancamento.adiantamento || 0);
      const valorBruto = Number(lancamento.valorBruto || 0);

      // Se adiantamento > valorBruto, não permite finalizar
      if (adiantamento > valorBruto) {
        funcionariosComProblema.push({
          id: lancamento.id,
          nome: lancamento.funcionario?.nome || "Funcionário",
          adiantamento,
          valorBruto,
          motivo: `Adiantamento (R$ ${adiantamento.toFixed(2)}) maior que Valor Bruto (R$ ${valorBruto.toFixed(2)})`,
        });
      }
    });

    if (funcionariosComProblema.length > 0) {
      // Abrir modal informativo
      setValidacaoAdiantamentoModal({ open: true, itens: funcionariosComProblema });
      return false;
    }

    return true;
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

    // Validar dias = 0 antes de finalizar (validação prioritária)
    if (!validarDiasZero()) {
      return; // Bloquear finalização se houver funcionários com dias = 0
    }

    // Validar adiantamentos antes de finalizar
    if (!validarAdiantamentos()) {
      return; // Bloquear finalização se houver adiantamento > valor bruto
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
        {finalizacaoAtual.meioPagamento &&
          finalizacaoAtual.meioPagamento !== "ESPECIE" && (
            <Alert
              type="info"
              showIcon
              message="Chaves PIX atualizadas diretamente do cadastro"
              description="Para finalizar usando PIX, todos os funcionários com lançamentos pendentes precisam ter chave PIX cadastrada. Caso contrário, utilize pagamento em espécie ou atualize o cadastro antes de continuar."
              style={{ marginBottom: 16 }}
            />
          )}

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

      {/* Modal de validação de dias = 0 */}
      <InfoAlertModal
        open={validacaoDiasZeroModal.open}
        onClose={() => setValidacaoDiasZeroModal({ open: false, itens: [] })}
        title="Não é possível finalizar a folha"
        iconType="warning"
        message="Existem funcionários com 0 dias trabalhados."
        description={
          <span style={{ display: "block" }}>
            Funcionários com 0 dias não podem receber pagamento, pois não houve trabalho no período.
            <br /><br />
            <strong>Ações necessárias:</strong>
            <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "4px" }}>Corrija o número de dias trabalhados no lançamento do funcionário</li>
              <li style={{ marginBottom: "4px" }}>Exclua o funcionário da folha se realmente não houve trabalho no período</li>
            </ul>
          </span>
        }
        items={validacaoDiasZeroModal.itens}
        primaryButtonText="Entendido"
      />

      {/* Modal de validação de adiantamento */}
      <InfoAlertModal
        open={validacaoAdiantamentoModal.open}
        onClose={() => setValidacaoAdiantamentoModal({ open: false, itens: [] })}
        title="Não é possível finalizar a folha"
        iconType="warning"
        message="Existem funcionários com adiantamento superior ao valor bruto da quinzena."
        description={
          <span style={{ display: "block" }}>
            Para estes funcionários, o valor líquido ficaria negativo, o que não é permitido pelo sistema.
            <br /><br />
            <strong>Soluções possíveis:</strong>
            <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "4px" }}>Ajuste o valor do adiantamento no lançamento do funcionário</li>
              <li style={{ marginBottom: "4px" }}>Aumente o valor bruto adicionando dias trabalhados, horas extras ou ajuda de custo</li>
              <li style={{ marginBottom: "4px" }}>Remova o funcionário da folha se não houve trabalho no período</li>
            </ul>
          </span>
        }
        items={validacaoAdiantamentoModal.itens}
        primaryButtonText="Entendido"
      />
    </>
  );
};

FinalizarFolhaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  folha: PropTypes.object,
  lancamentos: PropTypes.array,
  modoReprocessamento: PropTypes.bool,
  resumoRejeitados: PropTypes.shape({
    quantidadeTotal: PropTypes.number,
    quantidadeRejeitados: PropTypes.number,
    quantidadeSucesso: PropTypes.number,
    valorTotal: PropTypes.number,
  }),
};

export default FinalizarFolhaDialog;




