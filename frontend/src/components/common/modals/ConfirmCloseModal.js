// src/components/common/modals/ConfirmCloseModal.js

import React from "react";
import { Modal, Button, Card, Typography, Space } from "antd";
import { ExclamationCircleOutlined, CloseOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import useResponsive from "../../../hooks/useResponsive";

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
  const { isMobile } = useResponsive();
  return (
    <Modal
      title={
        <span style={{ 
          color: "#ffffff", 
          fontWeight: "600", 
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "10px 12px" : "12px 16px",
          margin: isMobile ? "-20px -24px 0 -24px" : "-20px -24px 0 -24px",
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
      width={isMobile ? "95vw" : 600}
      style={{ maxWidth: isMobile ? "95vw" : 600 }}
      centered
      destroyOnClose
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
          padding: 0
        },
        wrapper: { zIndex: 1200 },
        mask: { zIndex: 1150 }
      }}
    >
      {/* Card de Aviso */}
      <Card
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#fff7e6",
          borderColor: "#fa8c16"
        }}
      >
        <div style={{ textAlign: "center", padding: isMobile ? "12px" : "16px" }}>
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: isMobile ? "36px" : "48px", 
              color: "#fa8c16", 
              marginBottom: isMobile ? "12px" : "16px",
              display: "block"
            }} 
          />
          <Text style={{ 
            fontSize: isMobile ? "14px" : "16px", 
            fontWeight: "500", 
            color: "#333",
            lineHeight: isMobile ? "1.4" : "1.5"
          }}>
            {message}
          </Text>
          <br />
          <Text style={{ 
            fontSize: isMobile ? "12px" : "14px", 
            color: "#666", 
            marginTop: "8px", 
            display: "block",
            lineHeight: isMobile ? "1.4" : "1.5"
          }}>
            Tem certeza que deseja fechar sem salvar?
          </Text>
        </div>
      </Card>

      {/* Footer Padrão do Sistema */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: isMobile ? "8px" : "12px",
        marginTop: isMobile ? "16px" : "24px",
        paddingTop: isMobile ? "12px" : "16px",
        borderTop: "1px solid #e8e8e8"
      }}>
        <Button
          icon={<CloseOutlined />}
          onClick={onCancel}
          size={isMobile ? "small" : "large"}
          style={{
            height: isMobile ? "32px" : "40px",
            padding: isMobile ? "0 12px" : "0 16px",
          }}
        >
          {cancelText}
        </Button>
        <Button
          type="primary"
          danger={confirmButtonDanger}
          onClick={onConfirm}
          size={isMobile ? "small" : "large"}
          style={{
            backgroundColor: confirmButtonDanger ? "#ff4d4f" : "#059669",
            borderColor: confirmButtonDanger ? "#ff4d4f" : "#059669",
            height: isMobile ? "32px" : "40px",
            padding: isMobile ? "0 12px" : "0 16px",
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
