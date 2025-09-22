// src/components/common/modals/ConfirmCloseModal.js

import React from "react";
import { Modal, Button, Card, Typography, Space } from "antd";
import { ExclamationCircleOutlined, CloseOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const { Text } = Typography;

/**
 * Modal de confirmação para fechar formulários sem salvar
 * Componente reutilizável que pode ser usado em qualquer modal de formulário
 * Segue o padrão de layout do sistema conforme documentado no README.md
 */
const ConfirmCloseModal = ({
  open,
  onConfirm,
  onCancel,
  title = "Descartar Alterações?",
  message = "Você tem dados preenchidos no formulário que serão perdidos.",
  confirmText = "Sim, Descartar",
  cancelText = "Continuar Editando",
  confirmButtonType = "primary",
  confirmButtonDanger = true,
}) => {
  return (
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
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          {title}
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      centered
      destroyOnClose
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: 20
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0
        },
        wrapper: { zIndex: 1200 },
        mask: { zIndex: 1150 }
      }}
    >
      {/* Card de Aviso */}
      <Card
        style={{
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#fff7e6",
          borderColor: "#fa8c16"
        }}
      >
        <div style={{ textAlign: "center", padding: "16px" }}>
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: "48px", 
              color: "#fa8c16", 
              marginBottom: "16px",
              display: "block"
            }} 
          />
          <Text style={{ fontSize: "16px", fontWeight: "500", color: "#333" }}>
            {message}
          </Text>
          <br />
          <Text style={{ fontSize: "14px", color: "#666", marginTop: "8px", display: "block" }}>
            Tem certeza que deseja fechar sem salvar?
          </Text>
        </div>
      </Card>

      {/* Footer Padrão do Sistema */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid #e8e8e8"
      }}>
        <Button
          icon={<CloseOutlined />}
          onClick={onCancel}
          size="large"
        >
          {cancelText}
        </Button>
        <Button
          type="primary"
          danger={confirmButtonDanger}
          onClick={onConfirm}
          size="large"
          style={{
            backgroundColor: confirmButtonDanger ? "#ff4d4f" : "#059669",
            borderColor: confirmButtonDanger ? "#ff4d4f" : "#059669"
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

ConfirmCloseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmButtonType: PropTypes.string,
  confirmButtonDanger: PropTypes.bool,
};

export default ConfirmCloseModal;
