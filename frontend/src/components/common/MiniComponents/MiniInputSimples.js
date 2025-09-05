//frontend/src/components/common/MiniComponents/MiniInputSimples.js

import React, { useState, useEffect } from "react";
import {
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";

// Container estilizado para o input, adicionando suporte para validação
const InputContainer = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
    height: ${(props) => props.height || "40px"};
    padding: 8px 12px 8px 36px;
    padding-right: ${(props) => (props.isEditing ? "80px" : "36px")};
    font-size: ${(props) => props.fontSize || "14px"};
    border: 1px solid ${(props) => (props.isInvalid ? "#ff4d4f" : "#d9d9d9")};
    border-radius: 6px;
    transition: all 0.3s;

    &:hover,
    &:focus {
      border-color: ${(props) => (props.isInvalid ? "#ff4d4f" : "#40a9ff")};
      outline: none;
      box-shadow: 0 0 0 2px
        ${(props) =>
          props.isInvalid
            ? "rgba(255, 77, 79, 0.2)"
            : "rgba(24, 144, 255, 0.2)"};
    }
  }

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${(props) =>
      props.isInvalid ? "#ff4d4f" : props.iconColor || "#1890ff"};
    font-size: ${(props) => props.iconSize || "16px"};
    z-index: 1;
    pointer-events: none;
  }

  .validation-icon {
    position: absolute;
    right: ${(props) => (props.isEditing ? "84px" : "36px")};
    top: 50%;
    transform: translateY(-50%);
    color: #ff4d4f;
    font-size: 16px;
    z-index: 1;
  }

  .action-buttons {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 4px;
    z-index: 2;
  }

  .action-button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: #595959;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    &.save {
      color: #52c41a;
      &:hover {
        background-color: rgba(82, 196, 26, 0.1);
      }
    }

    &.cancel {
      color: #ff4d4f;
      &:hover {
        background-color: rgba(255, 77, 79, 0.1);
      }
    }
  }

  .clear-button {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0, 0, 0, 0.25);
    font-size: 12px;
    background: none;
    border: none;
    cursor: pointer;
    display: ${(props) =>
      props.hasValue && !props.isEditing ? "block" : "none"};
    padding: 0;
    height: 16px;
    width: 16px;
    line-height: 1;

    &:hover {
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .validation-message {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
  }
`;

const MiniInputSimples = ({
  value,
  onChange,
  placeholder = "Digite aqui...",
  height,
  fontSize,
  iconColor,
  iconSize,
  style = {},
  icon = <UserOutlined />,
  mask = null, // Nova prop para máscara
  validator = null, // Nova prop para validação
  errorMessage = "Valor inválido", // Mensagem de erro padrão
  showValidationMessage = true, // Exibir mensagem de validação
  ...restProps
}) => {
  // Estado local para o valor do input
  const [localValue, setLocalValue] = useState(value || "");
  // Estado para controlar se estamos em modo de edição local
  const [isEditing, setIsEditing] = useState(false);
  // Estado para controlar a validação
  const [isValid, setIsValid] = useState(true);

  // Atualiza o valor local quando a prop value muda
  useEffect(() => {
    setLocalValue(value || "");
    if (validator && value) {
      setIsValid(validator(value));
    } else {
      setIsValid(true);
    }
  }, [value, validator]);

  // Aplicar máscara ao valor
  const applyMask = (text) => {
    if (!mask) return text;

    let result = "";
    let textIndex = 0;

    for (let i = 0; i < mask.length && textIndex < text.length; i++) {
      if (mask[i] === "#") {
        result += text[textIndex];
        textIndex++;
      } else {
        result += mask[i];
        if (
          i + 1 < mask.length &&
          mask[i + 1] !== "#" &&
          textIndex < text.length &&
          text[textIndex] === mask[i]
        ) {
          textIndex++;
        }
      }
    }

    return result;
  };

  // Remover máscara para obter apenas os dados
  const removeMask = (text) => {
    if (!mask) return text;

    // Remove tudo que não é dígito ou letra (dependendo da máscara)
    return text.replace(/[^\w]/g, "");
  };

  // Manipula mudanças no input (apenas atualiza o estado local)
  const handleChange = (e) => {
    setIsEditing(true);

    let newValue = e.target.value;

    // Se tiver máscara, aplica-a
    if (mask) {
      // Remove caracteres não numéricos para CPF/CNPJ ou outro tipo de máscara
      const numericValue = newValue.replace(/\D/g, "");
      newValue = applyMask(numericValue);
    }

    setLocalValue(newValue);

    // Valida o valor
    if (validator) {
      setIsValid(validator(newValue));
    }
  };

  // Salva as alterações chamando o onChange do pai
  const handleSave = () => {
    if (onChange) {
      // Se tiver validador e valor for inválido, não salva
      if (validator && !validator(localValue)) {
        return;
      }
      onChange(localValue);
    }
    setIsEditing(false);
  };

  // Cancela as alterações locais
  const handleCancel = () => {
    setLocalValue(value || "");
    setIsEditing(false);
    if (validator && value) {
      setIsValid(validator(value));
    } else {
      setIsValid(true);
    }
  };

  // Limpa o campo
  const handleClear = () => {
    setLocalValue("");
    if (onChange) {
      onChange("");
    }
    setIsValid(true);
  };

  // Lida com o Enter e ESC
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <InputContainer
      hasValue={localValue.length > 0}
      height={height}
      fontSize={fontSize}
      iconColor={iconColor}
      iconSize={iconSize}
      style={style}
      isEditing={isEditing}
      isInvalid={!isValid}
    >
      <span className="input-icon">{icon}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus={restProps.autoFocus || isEditing}
        {...restProps}
      />

      {isEditing ? (
        <div className="action-buttons">
          {validator && !isValid ? (
            // Mostra o ícone de exclamação quando inválido
            <button
              className="action-button"
              title={errorMessage}
              type="button"
              disabled={true}
              style={{ color: "#ff4d4f" }}
            >
              <ExclamationCircleOutlined />
            </button>
          ) : (
            // Mostra o botão de salvar quando válido ou quando não há validador
            <button
              className="action-button save"
              onClick={handleSave}
              title="Salvar"
              type="button"
              disabled={validator && !isValid}
            >
              <CheckOutlined />
            </button>
          )}

          <button
            className="action-button cancel"
            onClick={handleCancel}
            title="Cancelar"
            type="button"
          >
            <CloseOutlined />
          </button>
        </div>
      ) : (
        localValue.length > 0 && (
          <button
            className="clear-button"
            onClick={handleClear}
            title="Limpar"
            type="button"
          >
            ×
          </button>
        )
      )}
    </InputContainer>
  );
};

export default MiniInputSimples;
