// src/components/arh/folha-pagamento/NovaFolhaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Typography, Divider } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, FileAddOutlined, CalendarOutlined } from "@ant-design/icons";
import moment from "moment";
import NovaFolhaForm from "./NovaFolhaForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const { Text } = Typography;

const NovaFolhaDialog = ({ open, onClose, onSave }) => {
  const [folhaAtual, setFolhaAtual] = useState({
    competenciaMes: undefined,
    competenciaAno: undefined,
    periodo: undefined,
    dataInicial: null,
    dataFinal: null,
    referencia: "",
  });
  const [erros, setErros] = useState({});
  const [confirmCreateModal, setConfirmCreateModal] = useState(false);

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    return data.competenciaMes || data.competenciaAno || data.periodo || data.dataInicial || data.dataFinal || data.referencia?.trim();
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(folhaAtual, onClose, customHasDataChecker);

  // Resetar formulário quando abrir
  useEffect(() => {
    if (open) {
      setFolhaAtual({
        competenciaMes: undefined,
        competenciaAno: undefined,
        periodo: undefined,
        dataInicial: null,
        dataFinal: null,
        referencia: "",
      });
      setErros({});
    }
  }, [open]);

  const validarFormulario = () => {
    const novosErros = {};

    if (!folhaAtual.competenciaMes) {
      novosErros.competenciaMes = "Mês é obrigatório";
    }

    if (!folhaAtual.competenciaAno) {
      novosErros.competenciaAno = "Ano é obrigatório";
    }

    if (!folhaAtual.periodo) {
      novosErros.periodo = "Quinzena é obrigatória";
    }

    if (!folhaAtual.dataInicial) {
      novosErros.dataInicial = "Data inicial é obrigatória";
    }

    if (!folhaAtual.dataFinal) {
      novosErros.dataFinal = "Data final é obrigatória";
    }

    // Validar se data final é posterior à data inicial
    if (folhaAtual.dataInicial && folhaAtual.dataFinal) {
      const dataInicial = moment(folhaAtual.dataInicial);
      const dataFinal = moment(folhaAtual.dataFinal);
      if (dataFinal.isBefore(dataInicial) || dataFinal.isSame(dataInicial)) {
        novosErros.dataFinal = "Data final deve ser posterior à data inicial";
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarFolha = () => {
    if (!validarFormulario()) {
      return;
    }

    // Abrir modal de confirmação antes de criar
    setConfirmCreateModal(true);
  };

  const handleConfirmarCriacao = async () => {
    setConfirmCreateModal(false);

    // Preparar dados para envio, convertendo datas moment para ISO string (YYYY-MM-DD)
    const dadosParaEnvio = {
      competenciaMes: folhaAtual.competenciaMes,
      competenciaAno: folhaAtual.competenciaAno,
      periodo: folhaAtual.periodo,
      dataInicial: folhaAtual.dataInicial ? moment(folhaAtual.dataInicial).format('YYYY-MM-DD') : null,
      dataFinal: folhaAtual.dataFinal ? moment(folhaAtual.dataFinal).format('YYYY-MM-DD') : null,
      referencia: folhaAtual.referencia || undefined,
    };

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(dadosParaEnvio);
  };

  const formatarCompetencia = () => {
    if (!folhaAtual.competenciaMes || !folhaAtual.competenciaAno) return "-";
    const mes = String(folhaAtual.competenciaMes).padStart(2, "0");
    return `${mes}/${folhaAtual.competenciaAno}`;
  };

  const formatarQuinzena = () => {
    if (!folhaAtual.periodo) return "-";
    return folhaAtual.periodo === 1 ? "1ª Quinzena" : "2ª Quinzena";
  };

  const formatarData = (data) => {
    if (!data) return "-";
    return moment(data).format("DD/MM/YYYY");
  };

  const handleCancelar = () => {
    handleCloseAttempt();
  };

  const handleConfirmarCancelar = () => {
    setFolhaAtual({
      competenciaMes: undefined,
      competenciaAno: undefined,
      periodo: undefined,
      dataInicial: null,
      dataFinal: null,
      referencia: "",
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
            <FileAddOutlined style={{ marginRight: 8 }} />
            Nova Folha de Pagamento
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
        <NovaFolhaForm
          folhaAtual={folhaAtual}
          setFolhaAtual={setFolhaAtual}
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
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSalvarFolha}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            Criar Folha
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados da Folha?"
        message="Você tem dados preenchidos no formulário de folha que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />

      {/* Modal de confirmação para criar folha */}
      <ConfirmActionModal
        open={confirmCreateModal}
        onConfirm={handleConfirmarCriacao}
        onCancel={() => setConfirmCreateModal(false)}
        title="Confirmar Criação da Folha"
        confirmText="Sim, Criar Folha"
        cancelText="Cancelar"
        confirmButtonDanger={false}
        icon={<FileAddOutlined />}
        iconColor="#059669"
        customContent={
          <div style={{ padding: "16px 0" }}>
            <Typography.Title level={5} style={{ marginBottom: 16, color: "#059669" }}>
              Resumo da Folha
            </Typography.Title>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarOutlined style={{ color: "#059669" }} />
                  Competência:
                </Text>
                <Text>{formatarCompetencia()}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarOutlined style={{ color: "#059669" }} />
                  Quinzena:
                </Text>
                <Text>{formatarQuinzena()}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarOutlined style={{ color: "#059669" }} />
                  Data Inicial:
                </Text>
                <Text style={{ color: "#059669", fontWeight: "600" }}>
                  {formatarData(folhaAtual.dataInicial)}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarOutlined style={{ color: "#059669" }} />
                  Data Final:
                </Text>
                <Text style={{ color: "#059669", fontWeight: "600" }}>
                  {formatarData(folhaAtual.dataFinal)}
                </Text>
              </div>
              {folhaAtual.referencia && (
                <>
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>Referência:</Text>
                    <Text>{folhaAtual.referencia}</Text>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />
    </>
  );
};

NovaFolhaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default NovaFolhaDialog;

