import React, { useState, useEffect } from "react";
import { InputNumber, Tooltip } from "antd";
import { CheckCircleOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import styled from "styled-components";

// Container estilizado para o input
const InputContainer = styled.div`
  position: relative;
  width: 100%;

  .ant-input-number {
    width: 100%;
    height: ${(props) => props.height || "32px"}; // Altura padrão
    padding: 8px 12px; // Sem padding extra para ícone
    font-size: ${(props) => props.fontSize || "14px"};
    border: 1px solid ${(props) => (props.isInvalid ? "#ff4d4f" : props.borderColor || "#d9d9d9")};
    border-width: ${(props) => props.borderWidth || "1px"};
    border-radius: 6px;
    transition: all 0.3s;
    background-color: ${(props) => props.backgroundColor || "white"};

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

  .validation-icon {
    position: absolute;
    right: ${(props) => (props.showConfirmButton ? "84px" : "36px")};
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

  .confirm-button {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    background-color: rgba(82, 196, 26, 0.1);
    color: #52c41a;
    border: none;
    border-radius: 0 6px 6px 0;
    cursor: pointer;
    transition: all 0.3s;
    z-index: 2;

    &:hover {
      background-color: rgba(82, 196, 26, 0.2);
      color: #389e0d;
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

/**
 * Componente personalizado de InputNumber com botão de confirmação opcional
 */
const MiniInputNumberSimples = ({
  value,
  onChange,
  onConfirm,
  onSave,
  onCancel,
  onPressEnter,
  onKeyDown,
  placeholder = "Digite o valor...",
  showConfirmButton = false,
  height = "32px", // Altura padrão ajustada
  fontSize,
  iconColor,
  iconSize,
  style = {},
  formatter,
  parser,
  min = 0,
  max,
  step = 0.01,
  precision,
  disabled = false,
  autoFocus = false,
  borderColor,
  borderWidth,
  backgroundColor,
  className,
  errorMessage,
  isFaturaFechada = false,
  ...restProps
}) => {
  // Estado local para o valor do input
  const [localValue, setLocalValue] = useState(value !== undefined ? value : null);
  // Estado para controlar validação
  const [isValid, setIsValid] = useState(true);
  // Estado para controlar se está no modo de edição
  const [isEditing, setIsEditing] = useState(false);

  // Atualiza o valor local quando a prop value muda
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  // Função para tratar mudanças no input
  const handleChange = (newValue) => {
    setLocalValue(newValue);
    setIsEditing(true);

    if (onChange) {
      onChange(newValue);
    }
  };

  // Função para confirmar valor (botão verde)
  const handleConfirm = () => {
    if (onConfirm && isValid) {
      onConfirm(localValue);
    }
  };

  // Função para salvar o valor (também pode ser usado pelo Enter)
  const handleSave = () => {
    if (onSave && isValid) {
      onSave(localValue);
      setIsEditing(false);
    }
  };

  // Função para cancelar a edição
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  // Função para limpar o valor
  const handleClear = () => {
    setLocalValue(null);
    if (onChange) {
      onChange(null);
    }
  };

  // Função para capturar Enter e Tab
  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    } 
    else if (e.key === "Enter") {
      if (onPressEnter) {
        onPressEnter();
      } else {
        handleSave();
      }
    }
    else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <InputContainer
      hasValue={localValue !== null && localValue !== undefined}
      isEditing={isEditing}
      showConfirmButton={showConfirmButton}
      isInvalid={!isValid}
      height={height}
      fontSize={fontSize}
      iconColor={iconColor}
      iconSize={iconSize}
      borderColor={isFaturaFechada ? "#faad14" : borderColor}
      borderWidth={isFaturaFechada ? "2px" : borderWidth}
      backgroundColor={isFaturaFechada ? "#fffbe6" : backgroundColor}
      className={className}
      style={style}
    >
      {/* Ícone removido */}
      
      <InputNumber
        value={localValue}
        onChange={handleChange}
        onStep={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        formatter={formatter}
        parser={parser}
        min={min}
        max={max}
        step={step}
        precision={precision}
        disabled={disabled}
        autoFocus={autoFocus}
        style={{ 
          width: "100%",
          paddingRight: showConfirmButton || isFaturaFechada ? "40px" : undefined
        }}
        {...restProps}
      />

      {/* Botão de confirmação para faturas fechadas */}
      {isFaturaFechada && (
        <Tooltip title="Confirmar alteração e recalcular">
          <button 
            className="confirm-button"
            onClick={handleConfirm}
            type="button"
          >
            <CheckCircleOutlined style={{ fontSize: "18px" }} />
          </button>
        </Tooltip>
      )}

      {/* Botões de ação padrão (se necessário) */}
      {showConfirmButton && !isFaturaFechada && (
        <div className="action-buttons">
          <button
            className="action-button save"
            onClick={handleSave}
            title="Salvar"
            type="button"
          >
            <CheckOutlined />
          </button>
          <button
            className="action-button cancel"
            onClick={handleCancel}
            title="Cancelar"
            type="button"
          >
            <CloseOutlined />
          </button>
        </div>
      )}

      {/* Botão de limpar (apenas quando não estiver editando) */}
      {!isEditing && !disabled && localValue !== null && localValue !== undefined && (
        <button
          className="clear-button"
          onClick={handleClear}
          title="Limpar"
          type="button"
        >
          ×
        </button>
      )}

      {/* Mensagem de erro (se existir) */}
      {!isValid && errorMessage && (
        <div className="validation-message">{errorMessage}</div>
      )}
    </InputContainer>
  );
};

export default MiniInputNumberSimples;