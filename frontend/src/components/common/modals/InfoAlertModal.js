// src/components/common/modals/InfoAlertModal.js

import React from "react";
import { Modal, Button, Card, Typography, Space, Divider, Tag, List } from "antd";
import { 
  WarningOutlined, 
  CloseOutlined, 
  InfoCircleOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  UserOutlined
} from "@ant-design/icons";
import PropTypes from "prop-types";
import useResponsive from "../../../hooks/useResponsive";
import { capitalizeName, formatCurrency } from "../../../utils/formatters";

const { Text, Title } = Typography;

/**
 * Modal reutilizável para exibir alertas e informações importantes no sistema
 * Componente altamente configurável que segue o padrão de layout do sistema
 */
const InfoAlertModal = ({
  open,
  onClose,
  title = "Atenção",
  iconType = "warning", // warning, info, error, success
  message = "",
  description = "",
  customContent = null, // Conteúdo customizado (substitui a mensagem padrão)
  items = [], // Lista de itens para exibir
  showIcon = true,
  primaryButtonText = "Fechar",
  showSecondaryButton = false,
  secondaryButtonText = "",
  onSecondaryAction = null,
  icon = null, // Ícone customizado (sobrescreve o iconType)
}) => {
  const { isMobile } = useResponsive();

  // Mapear tipo de ícone para componente
  const getIconByType = () => {
    if (icon) return icon; // Usar ícone customizado se fornecido
    
    switch (iconType) {
      case "warning":
        return <WarningOutlined style={{ color: "#fa8c16", fontSize: isMobile ? "36px" : "48px" }} />;
      case "info":
        return <InfoCircleOutlined style={{ color: "#1890ff", fontSize: isMobile ? "36px" : "48px" }} />;
      case "error":
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: isMobile ? "36px" : "48px" }} />;
      case "success":
        return <CheckCircleOutlined style={{ color: "#52c41a", fontSize: isMobile ? "36px" : "48px" }} />;
      default:
        return <WarningOutlined style={{ color: "#fa8c16", fontSize: isMobile ? "36px" : "48px" }} />;
    }
  };

  // Mapear cor baseada no tipo
  const getColorByType = () => {
    switch (iconType) {
      case "warning":
        return { bg: "#fff7e6", border: "#ffe7ba", icon: "#fa8c16" };
      case "info":
        return { bg: "#e6f7ff", border: "#bae7ff", icon: "#1890ff" };
      case "error":
        return { bg: "#fff2f0", border: "#ffccc7", icon: "#ff4d4f" };
      case "success":
        return { bg: "#f6ffed", border: "#d9f7d0", icon: "#52c41a" };
      default:
        return { bg: "#fff7e6", border: "#ffe7ba", icon: "#fa8c16" };
    }
  };

  const colors = getColorByType();

  // Renderizar lista de itens
  const renderItemsList = () => {
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
      <div style={{ marginTop: isMobile ? "16px" : "20px" }}>
        <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "8px" }}>
          <UserOutlined style={{ marginRight: 6 }} />
          {items.length} {items.length === 1 ? "funcionário afetado" : "funcionários afetados"}:
        </Text>
        <div style={{ 
          maxHeight: isMobile ? "250px" : "320px", 
          overflowY: "auto",
          padding: "8px",
          backgroundColor: "#fafafa",
          borderRadius: "6px",
          border: "1px solid #e8e8e8"
        }}>
          {items.map((item, index) => (
            <div 
              key={item.id || index}
              style={{ 
                padding: isMobile ? "8px" : "10px",
                marginBottom: index < items.length - 1 ? "6px" : "0",
                backgroundColor: "#fff",
                borderRadius: "6px",
                border: "1px solid #e8e8e8",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                {capitalizeName(item.nome || "Funcionário")}
              </Text>
              {item.detalhes && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  {item.adiantamento && (
                    <Tag color="orange" style={{ fontSize: isMobile ? "11px" : "12px", margin: 0 }}>
                      <DollarOutlined style={{ marginRight: "4px", fontSize: "10px" }} />
                      Adiantamento: R$ {formatCurrency(item.adiantamento)}
                    </Tag>
                  )}
                  {item.valorBruto && (
                    <Tag color="green" style={{ fontSize: isMobile ? "11px" : "12px", margin: 0 }}>
                      Valor Bruto: R$ {formatCurrency(item.valorBruto)}
                    </Tag>
                  )}
                </div>
              )}
              {item.motivo && (
                <Text style={{ fontSize: isMobile ? "11px" : "12px", color: "#ff4d4f", fontStyle: "italic" }}>
                  {item.motivo}
                </Text>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          {getIconByType()}
          <span style={{ marginLeft: "8px" }}>{title}</span>
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "95vw" : 650}
      style={{ maxWidth: isMobile ? "95vw" : 650 }}
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
      {/* Card de Alerta */}
      <Card
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          backgroundColor: colors.bg,
          borderColor: colors.icon
        }}
      >
        <div style={{ padding: isMobile ? "12px" : "16px" }}>
          {/* Ícone e Mensagem Principal */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? "16px" : "20px" }}>
            {showIcon && (
              <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
                {getIconByType()}
              </div>
            )}
            {message && (
              <Text style={{ 
                fontSize: isMobile ? "14px" : "16px", 
                fontWeight: "500", 
                color: "#333",
                lineHeight: isMobile ? "1.4" : "1.5"
              }}>
                {message}
              </Text>
            )}
          </div>

          {/* Descrição ou Conteúdo Customizado */}
          {(description || customContent) && (
            <>
              <Divider style={{ margin: isMobile ? "12px 0" : "16px 0", borderColor: "#e8e8e8" }} />
              
              {customContent || (
                <Text style={{ 
                  fontSize: isMobile ? "13px" : "14px", 
                  color: "#666", 
                  lineHeight: isMobile ? "1.5" : "1.6"
                }}>
                  {description}
                </Text>
              )}
            </>
          )}

          {/* Lista de Itens */}
          {renderItemsList()}
        </div>
      </Card>

      {/* Footer com Botões */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: isMobile ? "8px" : "12px",
        marginTop: isMobile ? "16px" : "24px",
        paddingTop: isMobile ? "12px" : "16px",
        borderTop: "1px solid #e8e8e8"
      }}>
        {showSecondaryButton && (
          <Button 
            onClick={onSecondaryAction}
            size={isMobile ? "small" : "large"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            {secondaryButtonText}
          </Button>
        )}
        <Button
          type="primary"
          icon={<CloseOutlined />}
          onClick={onClose}
          size={isMobile ? "small" : "large"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#047857",
            height: isMobile ? "32px" : "40px",
            padding: isMobile ? "0 12px" : "0 16px",
          }}
        >
          {primaryButtonText}
        </Button>
      </div>
    </Modal>
  );
};

InfoAlertModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  iconType: PropTypes.oneOf(["warning", "info", "error", "success"]),
  message: PropTypes.string,
  description: PropTypes.string,
  customContent: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      nome: PropTypes.string,
      adiantamento: PropTypes.number,
      valorBruto: PropTypes.number,
      motivo: PropTypes.string,
    })
  ),
  showIcon: PropTypes.bool,
  primaryButtonText: PropTypes.string,
  showSecondaryButton: PropTypes.bool,
  secondaryButtonText: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  icon: PropTypes.node,
};

InfoAlertModal.displayName = 'InfoAlertModal';

export default InfoAlertModal;
