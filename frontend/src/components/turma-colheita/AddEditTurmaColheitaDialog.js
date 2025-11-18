// src/components/turma-colheita/AddEditTurmaColheitaDialog.js

import React, { useState, useEffect } from "react";
import { Modal, Button, Space } from "antd";
import PropTypes from "prop-types";
import { SaveOutlined, CloseOutlined, GroupOutlined } from "@ant-design/icons";
import useResponsive from "../../hooks/useResponsive";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import TurmaColheitaForm from "./TurmaColheitaForm";
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";
import { validarCPF, validarCNPJ } from "../../utils/documentValidation";

const AddEditTurmaColheitaDialog = ({
  open,
  onClose,
  onSave,
  turmaColheita = null,
  loading = false,
}) => {
  const { isMobile } = useResponsive();
  const [turmaAtual, setTurmaAtual] = useState({
    nomeColhedor: "",
    chavePix: "",
    responsavelChavePix: "",
    tipoChavePix: undefined,
    modalidadeChave: "",
    observacoes: "",
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Função customizada para verificar se há dados preenchidos no formulário de turma de colheita
  const customHasDataChecker = (data) => {
    // Verifica campos básicos obrigatórios
    const hasBasicData = data.nomeColhedor?.trim();
    
    // Verifica dados de pagamento
    const hasPaymentData = data.chavePix?.trim();
    
    // Verifica responsável pela chave PIX
    const hasResponsavelData = data.responsavelChavePix?.trim();
    
    // Verifica tipo de chave PIX
    const hasTipoChavePix = data.tipoChavePix;
    
    // Verifica outros campos
    const hasOtherData = data.observacoes?.trim();
    
    return hasBasicData || hasPaymentData || hasResponsavelData || hasTipoChavePix || hasOtherData;
  };

  // Hook customizado para gerenciar confirmação de fechamento
  const {
    confirmCloseModal,
    handleCloseAttempt,
    handleConfirmClose,
    handleCancelClose,
  } = useConfirmClose(turmaAtual, onClose, customHasDataChecker);

  // Funções auxiliares para validação de tipos de chave PIX
  
  /**
   * Valida se um email é válido
   */
  const validarEmail = (email) => {
    if (!email) return { valido: false, mensagem: null };
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return {
      valido: emailRegex.test(email.trim()),
      mensagem: emailRegex.test(email.trim()) ? null : "E-mail inválido. Use o formato: usuario@dominio.com"
    };
  };

  /**
   * Valida se um telefone é válido (10-11 dígitos, formato brasileiro)
   */
  const validarTelefone = (telefone) => {
    if (!telefone) return { valido: false, mensagem: null };
    const numeros = telefone.replace(/\D/g, '');
    
    // Telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular com DDD)
    if (numeros.length === 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return {
        valido: true,
        mensagem: null
      };
    } else if (numeros.length === 11) {
      // Celular: (XX) 9XXXX-XXXX
      // Verificar se começa com 9 no terceiro dígito (formato de celular)
      return {
        valido: true,
        mensagem: null
      };
    } else {
      return {
        valido: false,
        mensagem: "Telefone deve conter 10 dígitos (fixo) ou 11 dígitos (celular)"
      };
    }
  };

  /**
   * Valida se é CPF ou CNPJ válido
   */
  const validarCpfCnpj = (documento) => {
    if (!documento) return { valido: false, mensagem: null };
    const numeros = documento.replace(/\D/g, '');
    
    if (numeros.length === 11) {
      const cpfValido = validarCPF(documento);
      return {
        valido: cpfValido,
        mensagem: cpfValido ? null : "CPF inválido. Verifique os dígitos verificadores."
      };
    } else if (numeros.length === 14) {
      const cnpjValido = validarCNPJ(documento);
      return {
        valido: cnpjValido,
        mensagem: cnpjValido ? null : "CNPJ inválido. Verifique os dígitos verificadores."
      };
    } else {
      return {
        valido: false,
        mensagem: "CPF deve conter 11 dígitos ou CNPJ deve conter 14 dígitos"
      };
    }
  };

  /**
   * Valida se é uma chave aleatória (UUID ou string alfanumérica)
   */
  const validarChaveAleatoria = (chave) => {
    if (!chave) return { valido: false, mensagem: null };
    const chaveLimpa = chave.trim();
    
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres com hífens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Chave aleatória alfanumérica: pelo menos 32 caracteres
    if (uuidRegex.test(chaveLimpa)) {
      return {
        valido: true,
        mensagem: null
      };
    } else if (chaveLimpa.length >= 32 && /^[0-9a-zA-Z-]+$/.test(chaveLimpa)) {
      return {
        valido: true,
        mensagem: null
      };
    } else {
      return {
        valido: false,
        mensagem: "Chave aleatória deve ser um UUID (36 caracteres) ou string alfanumérica com pelo menos 32 caracteres"
      };
    }
  };

  /**
   * Detecta automaticamente o tipo de chave PIX baseado no formato
   * Retorna: 1 (Telefone), 2 (Email), 3 (CPF/CNPJ), 4 (Chave Aleatória) ou null
   */
  const detectarTipoChavePix = (chave) => {
    if (!chave || !chave.trim()) return null;
    
    const chaveLimpa = chave.trim();
    
    // Verifica se é email
    if (chaveLimpa.includes('@')) {
      const emailValido = validarEmail(chaveLimpa);
      if (emailValido.valido) return 2; // Email
    }
    
    // Verifica se é apenas números (telefone ou CPF/CNPJ)
    const numeros = chaveLimpa.replace(/\D/g, '');
    
    if (numeros.length === chaveLimpa.replace(/[^0-9]/g, '').length) {
      // Contém apenas números (possivelmente com formatação)
      if (numeros.length === 11) {
        // Pode ser CPF ou telefone com DDD (formato antigo)
        const cpfValido = validarCPF(chaveLimpa);
        if (cpfValido) return 3; // CPF
        // Se não for CPF válido, pode ser telefone
        if (validarTelefone(chaveLimpa).valido) return 1; // Telefone
      } else if (numeros.length === 14) {
        const cnpjValido = validarCNPJ(chaveLimpa);
        if (cnpjValido) return 3; // CNPJ
      } else if (numeros.length === 10 || numeros.length === 11) {
        // Provavelmente telefone
        if (validarTelefone(chaveLimpa).valido) return 1; // Telefone
      }
    }
    
    // Verifica se é chave aleatória (UUID ou string longa alfanumérica)
    if (validarChaveAleatoria(chaveLimpa).valido) {
      return 4; // Chave Aleatória
    }
    
    return null; // Não foi possível detectar
  };

  // Função para limpar a chave PIX antes de enviar ao backend
  const limparChavePixParaBackend = (chavePix) => {
    if (!chavePix) return "";
    
    const chave = chavePix.trim();
    
    // Se for e-mail, retornar como está
    if (chave.includes('@')) {
      return chave;
    }
    
    // Para outros tipos, remover formatação e retornar apenas números (ou manter formato se for chave aleatória)
    // Se contém letras, provavelmente é chave aleatória, então manter como está
    if (/[a-zA-Z]/.test(chave)) {
      return chave;
    }
    
    // Para telefone e CPF/CNPJ, remover formatação
    return chave.replace(/\D/g, '');
  };

  // Preencher formulário quando turma for selecionada para edição
  useEffect(() => {
    if (open && turmaColheita) {
      setTurmaAtual({
        nomeColhedor: turmaColheita.nomeColhedor || "",
        chavePix: turmaColheita.chavePix || "",
        responsavelChavePix: turmaColheita.responsavelChavePix || "",
        tipoChavePix: turmaColheita.tipoChavePix || undefined,
        modalidadeChave: turmaColheita.modalidadeChave || "",
        observacoes: turmaColheita.observacoes || "",
      });
      setEditando(true);
    } else if (open) {
      setTurmaAtual({
        nomeColhedor: "",
        chavePix: "",
        responsavelChavePix: "",
        tipoChavePix: undefined,
        modalidadeChave: "",
        observacoes: "",
      });
      setEditando(false);
    }
    setErros({});
  }, [open, turmaColheita]);

  const validarFormulario = () => {
    const novosErros = {};

    // Validações obrigatórias
    if (!turmaAtual.nomeColhedor?.trim()) {
      novosErros.nomeColhedor = "Nome do colhedor é obrigatório";
    }

    // Validação robusta da chave PIX e tipo
    if (turmaAtual.chavePix?.trim()) {
      const chave = turmaAtual.chavePix.trim();
      const tipoSelecionado = turmaAtual.tipoChavePix;
      
      // Detectar automaticamente o tipo se não foi selecionado
      const tipoDetectado = detectarTipoChavePix(chave);
      
      // Se tipo foi selecionado, validar correspondência
      if (tipoSelecionado) {
        let validacao = null;
        let tipoEsperado = null;
        
        switch (tipoSelecionado) {
          case 1: // Telefone
            validacao = validarTelefone(chave);
            tipoEsperado = "Telefone";
            break;
          case 2: // Email
            validacao = validarEmail(chave);
            tipoEsperado = "Email";
            break;
          case 3: // CPF/CNPJ
            validacao = validarCpfCnpj(chave);
            tipoEsperado = "CPF/CNPJ";
            break;
          case 4: // Chave Aleatória
            validacao = validarChaveAleatoria(chave);
            tipoEsperado = "Chave Aleatória";
            break;
        }
        
        if (validacao && !validacao.valido) {
          novosErros.chavePix = `Tipo selecionado: ${tipoEsperado}. ${validacao.mensagem}`;
        } else if (tipoDetectado && tipoDetectado !== tipoSelecionado) {
          // Tipo detectado não corresponde ao selecionado
          const tipos = { 1: "Telefone", 2: "Email", 3: "CPF/CNPJ", 4: "Chave Aleatória" };
          novosErros.chavePix = `O formato da chave PIX corresponde a "${tipos[tipoDetectado]}", mas o tipo selecionado é "${tipos[tipoSelecionado]}". Verifique o tipo selecionado.`;
          novosErros.tipoChavePix = `O formato da chave corresponde a "${tipos[tipoDetectado]}", não a "${tipos[tipoSelecionado]}"`;
        }
      } else {
        // Tipo não foi selecionado - validar formato e sugerir tipo
        if (tipoDetectado) {
          const tipos = { 1: "Telefone", 2: "Email", 3: "CPF/CNPJ", 4: "Chave Aleatória" };
          novosErros.tipoChavePix = `Por favor, selecione o tipo de chave PIX. O formato corresponde a "${tipos[tipoDetectado]}"`;
          
          // Validar o formato detectado
          let validacao = null;
          switch (tipoDetectado) {
            case 1:
              validacao = validarTelefone(chave);
              break;
            case 2:
              validacao = validarEmail(chave);
              break;
            case 3:
              validacao = validarCpfCnpj(chave);
              break;
            case 4:
              validacao = validarChaveAleatoria(chave);
              break;
          }
          
          if (validacao && !validacao.valido) {
            novosErros.chavePix = validacao.mensagem;
          }
        } else {
          // Não foi possível detectar o tipo
          novosErros.chavePix = "Formato de chave PIX inválido ou não reconhecido. Por favor, verifique e selecione o tipo correspondente.";
          novosErros.tipoChavePix = "Por favor, selecione o tipo de chave PIX";
        }
      }
    } else if (turmaAtual.tipoChavePix) {
      // Tipo foi selecionado mas chave PIX não foi informada
      novosErros.chavePix = "Por favor, informe a chave PIX correspondente ao tipo selecionado";
    }

    // Validação do responsável pela chave PIX
    if (turmaAtual.responsavelChavePix?.trim()) {
      const responsavel = turmaAtual.responsavelChavePix.trim();
      
      if (responsavel.length < 2) {
        novosErros.responsavelChavePix = "Nome do responsável deve ter pelo menos 2 caracteres";
      } else if (responsavel.length > 100) {
        novosErros.responsavelChavePix = "Nome do responsável muito longo (máximo 100 caracteres)";
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvarTurma = async () => {
    if (!validarFormulario()) {
      // Verificar se há erro específico na chave PIX
      if (erros.chavePix) {
        showNotification("error", "Erro na Chave PIX", erros.chavePix);
      } else {
        showNotification("error", "Erro", "Por favor, corrija os erros no formulário");
      }
      return;
    }

    try {
      setIsSaving(true);

      // Preparar dados para envio
      const dadosEnvio = {
        ...turmaAtual,
        chavePix: limparChavePixParaBackend(turmaAtual.chavePix), // Limpar chave PIX antes de enviar
        // Incluir tipoChavePix e modalidadeChave se preenchidos
        ...(turmaAtual.tipoChavePix && { tipoChavePix: turmaAtual.tipoChavePix }),
        ...(turmaAtual.modalidadeChave && { modalidadeChave: turmaAtual.modalidadeChave }),
        // Adicionar data atual automaticamente
        dataCadastro: new Date().toISOString(),
      };

      await onSave(dadosEnvio);
      handleCancelar();
    } catch (error) {
      console.error("Erro ao salvar turma de colheita:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    setTurmaAtual({
      nomeColhedor: "",
      chavePix: "",
      responsavelChavePix: "",
      tipoChavePix: undefined,
      modalidadeChave: "",
      observacoes: "",
    });
    setErros({});
    onClose();
  };

  return (
    <>
      <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "16px",
          backgroundColor: "#059669",
          padding: isMobile ? "10px 12px" : "12px 16px",
          margin: isMobile ? "-20px -24px 0 -24px" : "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <GroupOutlined style={{ marginRight: 8 }} />
          {editando ? "Editar Turma de Colheita" : "Nova Turma de Colheita"}
        </span>
      }
      open={open}
      onCancel={handleCloseAttempt}
      footer={null}
      width={isMobile ? "96vw" : 800}
      style={{ maxWidth: isMobile ? "96vw" : 800 }}
      styles={{
        body: {
          maxHeight: isMobile ? "calc(100vh - 160px)" : "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
          minWidth: 0,
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
      <TurmaColheitaForm
        turmaAtual={turmaAtual}
        setTurmaAtual={setTurmaAtual}
        erros={erros}
        setErros={setErros}
        loadingData={false}
        onChavePixChange={(value) => {
          // Atualizar chave PIX
          setTurmaAtual(prev => ({ ...prev, chavePix: value }));
          
          // Limpar erro do campo
          if (erros.chavePix) {
            setErros(prev => ({ ...prev, chavePix: undefined }));
          }
          
          // Se chave PIX foi informada e tipo não foi selecionado, tentar detectar automaticamente
          if (value && value.trim() && !turmaAtual.tipoChavePix) {
            const tipoDetectado = detectarTipoChavePix(value);
            if (tipoDetectado) {
              const TIPOS_CHAVE_PIX = {
                1: "Telefone",
                2: "Email",
                3: "CPF/CNPJ",
                4: "Chave Aleatória"
              };
              setTurmaAtual(prev => ({
                ...prev,
                tipoChavePix: tipoDetectado,
                modalidadeChave: TIPOS_CHAVE_PIX[tipoDetectado]
              }));
              
              // Limpar erro do tipo se foi detectado automaticamente
              if (erros.tipoChavePix) {
                setErros(prev => ({ ...prev, tipoChavePix: undefined }));
              }
            }
          }
        }}
      />

      {/* Footer com botões */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: isMobile ? "8px" : "12px",
        marginTop: isMobile ? "1rem" : "24px",
        paddingTop: isMobile ? "12px" : "16px",
        borderTop: "1px solid #e8e8e8"
      }}>
        <Button
          onClick={handleCloseAttempt}
          disabled={isSaving}
          icon={<CloseOutlined />}
          size={isMobile ? "small" : "large"}
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          onClick={handleSalvarTurma}
          loading={isSaving}
          disabled={loading}
          icon={<SaveOutlined />}
          size={isMobile ? "small" : "large"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
          }}
        >
          {editando ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </Modal>

    {/* Modal de confirmação para fechar sem salvar */}
    <ConfirmCloseModal
      open={confirmCloseModal}
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
      title="Descartar Dados da Turma de Colheita?"
      message="Você tem dados preenchidos no formulário de turma de colheita que serão perdidos."
      confirmText="Sim, Descartar"
      cancelText="Continuar Editando"
    />
    </>
  );
};

AddEditTurmaColheitaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  turmaColheita: PropTypes.object,
  loading: PropTypes.bool,
};


export default AddEditTurmaColheitaDialog;