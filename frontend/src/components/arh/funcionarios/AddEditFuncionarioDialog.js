// src/components/arh/funcionarios/AddEditFuncionarioDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";
import FuncionarioForm from "./FuncionarioForm";
import ConfirmCloseModal from "../../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../../hooks/useConfirmClose";

const AddEditFuncionarioDialog = ({
  open,
  onClose,
  onSave,
  funcionario,
  cargos,
  funcoes,
  gerentes,
}) => {
  const [funcionarioAtual, setFuncionarioAtual] = useState({
    nome: "",
    apelido: "",
    cpf: "",
    rg: "",
    pis: "",
    telefone: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    tipoContrato: "MENSALISTA",
    cargoId: undefined,
    funcaoId: undefined,
    gerenteId: undefined,
    tipoChavePix: undefined,
    modalidadeChave: "",
    chavePix: "",
    responsavelChavePix: "",
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});

  // Função customizada para verificar se há dados preenchidos
  const customHasDataChecker = (data) => {
    const hasBasicData =
      data.nome?.trim() ||
      data.cpf?.trim() ||
      data.cargoId ||
      data.funcaoId;
    return hasBasicData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(funcionarioAtual, onClose, customHasDataChecker);

  // Preencher formulário quando funcionário for selecionado para edição
  useEffect(() => {
    if (open && funcionario) {
      setFuncionarioAtual({
        nome: funcionario.nome || "",
        apelido: funcionario.apelido || "",
        cpf: funcionario.cpf || "",
        rg: funcionario.rg || "",
        pis: funcionario.pis || "",
        telefone: funcionario.telefone || "",
        email: funcionario.email || "",
        cep: funcionario.cep || "",
        logradouro: funcionario.logradouro || "",
        numero: funcionario.numero || "",
        complemento: funcionario.complemento || "",
        bairro: funcionario.bairro || "",
        cidade: funcionario.cidade || "",
        estado: funcionario.estado || "",
        tipoContrato: funcionario.tipoContrato || "MENSALISTA",
        cargoId: funcionario.cargoId ?? undefined,
        funcaoId: funcionario.funcaoId ?? undefined,
        gerenteId: funcionario.gerenteId ?? undefined,
        tipoChavePix: funcionario.tipoChavePix ?? undefined,
        modalidadeChave: funcionario.modalidadeChave || "",
        chavePix: funcionario.chavePix || "",
        responsavelChavePix: funcionario.responsavelChavePix || "",
      });
      setEditando(true);
    } else if (open) {
      setFuncionarioAtual({
        nome: "",
        apelido: "",
        cpf: "",
        rg: "",
        pis: "",
        telefone: "",
        email: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        tipoContrato: "MENSALISTA",
        cargoId: undefined,
        funcaoId: undefined,
        gerenteId: undefined,
        tipoChavePix: undefined,
        chavePix: "",
        responsavelChavePix: "",
      });
      setEditando(false);
    }
    setErros({});
  }, [open, funcionario]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!funcionarioAtual.nome?.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }

    if (!funcionarioAtual.cpf?.trim()) {
      novosErros.cpf = "CPF é obrigatório";
    }

    if (!funcionarioAtual.tipoContrato) {
      novosErros.tipoContrato = "Tipo de contrato é obrigatório";
    }

    // Validação específica para mensalista
    if (
      funcionarioAtual.tipoContrato === "MENSALISTA" &&
      !funcionarioAtual.cargoId
    ) {
      novosErros.cargoId = "Cargo é obrigatório para mensalistas";
    }

    // Validação específica para diarista
    if (
      funcionarioAtual.tipoContrato === "DIARISTA" &&
      !funcionarioAtual.funcaoId
    ) {
      novosErros.funcaoId = "Função é obrigatória para diaristas";
    }

    // Validação para Tipo da Chave PIX
    if (!funcionarioAtual.tipoChavePix) {
      novosErros.tipoChavePix = "Tipo da Chave PIX é obrigatório";
    }

    // Validação para Chave PIX
    if (!funcionarioAtual.chavePix?.trim()) {
      novosErros.chavePix = "Chave PIX é obrigatória";
    }

    // Validação para Responsável Chave PIX
    if (!funcionarioAtual.responsavelChavePix?.trim()) {
      novosErros.responsavelChavePix = "Responsável pela Chave PIX é obrigatório";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarFuncionario = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Preparar payload
    const payload = {
      ...funcionarioAtual,
      cargoId: funcionarioAtual.cargoId || undefined,
      funcaoId: funcionarioAtual.funcaoId || undefined,
      gerenteId: funcionarioAtual.gerenteId || undefined,
    };

    // Chamar onSave e deixar o componente pai controlar o fechamento
    await onSave(payload);
  };

  const handleCancelar = () => {
    handleCloseAttempt();
  };

  const handleConfirmarCancelar = () => {
    setFuncionarioAtual({
      nome: "",
      apelido: "",
      cpf: "",
      rg: "",
      pis: "",
      telefone: "",
      email: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      tipoContrato: "MENSALISTA",
      cargoId: undefined,
      funcaoId: undefined,
      tipoChavePix: undefined,
      chavePix: "",
      responsavelChavePix: "",
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
            <UserOutlined style={{ marginRight: 8 }} />
            {editando ? "Editar Funcionário" : "Novo Funcionário"}
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
        <FuncionarioForm
          funcionarioAtual={funcionarioAtual}
          setFuncionarioAtual={setFuncionarioAtual}
          cargos={cargos}
          funcoes={funcoes}
          gerentes={gerentes}
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
            onClick={handleSalvarFuncionario}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {editando ? "Atualizar" : "Criar"} Funcionário
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmação para fechar sem salvar */}
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmarCancelar}
        onCancel={handleCancelClose}
        title="Descartar Dados do Funcionário?"
        message="Você tem dados preenchidos no formulário de funcionário que serão perdidos."
        confirmText="Sim, Descartar"
        cancelText="Continuar Editando"
      />
    </>
  );
};

AddEditFuncionarioDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  funcionario: PropTypes.object,
  cargos: PropTypes.array.isRequired,
  funcoes: PropTypes.array.isRequired,
  gerentes: PropTypes.array.isRequired,
};

export default AddEditFuncionarioDialog;
