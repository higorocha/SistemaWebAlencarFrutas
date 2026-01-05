// src/components/common/modals/BuscaAPIResultModal.js

import React from "react";
import { Modal, Button, Card, Typography, Space, Divider, Tag } from "antd";
import { CheckCircleOutlined, CloseOutlined, CalendarOutlined, BankOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import useResponsive from "../../../hooks/useResponsive";
import { capitalizeName, formatCurrency } from "../../../utils/formatters";

const { Text, Title } = Typography;

/**
 * Modal para exibir resultados detalhados da busca na API
 * Componente reutilizável que segue o padrão de layout do sistema
 * Exibe resumo estruturado da operação de busca
 */
const BuscaAPIResultModal = ({
  open,
  onClose,
  title = "Busca Concluída",
  summary = null, // Objeto com os dados do resumo
  customContent = null, // Conteúdo customizado (opcional)
}) => {
  const { isMobile } = useResponsive();

  // Renderizar conteúdo padrão baseado no summary
  const renderDefaultContent = () => {
    if (!summary) return null;

    // Formato para PagamentosAutomaticosModal (todos os clientes)
    if (summary.totalFiltrados !== undefined) {
      const {
        totalFiltrados = 0,
        totalSalvos = 0,
        totalSalvosComClienteIdentificado = 0,
        totalSalvosSemClienteIdentificado = 0,
        totalDuplicados = 0,
        totalSemClienteIdentificado = 0,
        totalClientes = 0,
        clientes = [],
        periodo = null,
        contaCorrente = null,
      } = summary;

      const clientesArray = Array.isArray(clientes) ? clientes : [];

      return (
        <div style={{ padding: isMobile ? "8px 0" : "12px 0" }}>
          {/* Informações do Período e Conta */}
          {(periodo || contaCorrente) && (
            <div style={{ 
              marginBottom: isMobile ? "16px" : "20px", 
              padding: isMobile ? "10px" : "12px",
              backgroundColor: "#f0f2f5",
              borderRadius: "6px",
              border: "1px solid #d9d9d9"
            }}>
              {periodo && (
                <div style={{ marginBottom: periodo && contaCorrente ? "8px" : "0" }}>
                  <Space>
                    <CalendarOutlined style={{ color: "#1890ff", fontSize: isMobile ? "14px" : "16px" }} />
                    <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666" }}>
                      Período:
                    </Text>
                    <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                      {periodo.inicio} a {periodo.fim}
                    </Text>
                  </Space>
                </div>
              )}
              {contaCorrente && (
                <div>
                  <Space>
                    <BankOutlined style={{ color: "#059669", fontSize: isMobile ? "14px" : "16px" }} />
                    <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666" }}>
                      Conta:
                    </Text>
                    <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                      {contaCorrente.agencia} / {contaCorrente.conta}
                    </Text>
                  </Space>
                </div>
              )}
            </div>
          )}

          {/* Total Analisado */}
          {totalFiltrados > 0 && (
            <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
              <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                📊 Total de Lançamentos Analisados:
              </Text>
              <Tag color="blue" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px" }}>
                {totalFiltrados} lançamento{totalFiltrados > 1 ? "s" : ""}
              </Tag>
            </div>
          )}

          {/* Lançamentos Salvos */}
          <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
            <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
              ✅ Lançamentos Salvos:
            </Text>
            <Tag color="green" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px", marginBottom: "6px" }}>
              {totalSalvos} {totalSalvos === 1 ? "salvo" : "salvos"}
            </Tag>
            {(totalSalvosComClienteIdentificado > 0 || totalSalvosSemClienteIdentificado > 0) && (
              <div style={{ marginTop: "8px", paddingLeft: "12px" }}>
                {totalSalvosComClienteIdentificado > 0 && (
                  <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#52c41a", display: "block", marginBottom: "4px" }}>
                    ✓ {totalSalvosComClienteIdentificado} com cliente identificado
                  </Text>
                )}
                {totalSalvosSemClienteIdentificado > 0 && (
                  <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#fa8c16", display: "block" }}>
                    ⚠ {totalSalvosSemClienteIdentificado} sem cliente identificado
                  </Text>
                )}
              </div>
            )}
          </div>

          {/* Duplicados */}
          {totalDuplicados > 0 && (
            <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
              <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                🔄 Duplicados Ignorados:
              </Text>
              <Tag color="orange" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px" }}>
                {totalDuplicados} {totalDuplicados === 1 ? "duplicado" : "duplicados"} (já existiam no sistema)
              </Tag>
            </div>
          )}


          {/* Clientes Afetados - Lista Detalhada */}
          {clientesArray.length > 0 && (
            <div style={{ 
              marginTop: isMobile ? "16px" : "20px", 
              paddingTop: isMobile ? "12px" : "16px", 
              borderTop: "2px solid #e8e8e8" 
            }}>
              <Space style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ color: "#059669", fontSize: isMobile ? "16px" : "18px" }} />
                <Text strong style={{ fontSize: isMobile ? "14px" : "15px", color: "#333" }}>
                  Clientes Afetados ({clientesArray.length}):
                </Text>
              </Space>
              <div style={{ 
                maxHeight: isMobile ? "200px" : "280px", 
                overflowY: "auto",
                padding: "8px",
                backgroundColor: "#fafafa",
                borderRadius: "6px",
                border: "1px solid #e8e8e8"
              }}>
                {clientesArray.map((cliente, index) => {
                  const quantidade = cliente?.quantidadeLancamentos || 0;
                  const valorTotal = cliente?.valorTotal || 0;
                  
                  return (
                    <div 
                      key={cliente?.id || index}
                      style={{ 
                        padding: isMobile ? "8px" : "10px",
                        marginBottom: index < clientesArray.length - 1 ? "6px" : "0",
                        backgroundColor: "#fff",
                        borderRadius: "6px",
                        border: "1px solid #e8e8e8",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                        {cliente?.nome ? capitalizeName(cliente.nome) : `Cliente #${cliente?.id || index + 1}`}
                      </Text>
                      {quantidade > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                          <Tag color="blue" style={{ fontSize: isMobile ? "11px" : "12px", margin: 0 }}>
                            {quantidade} {quantidade === 1 ? "lançamento" : "lançamentos"}
                          </Tag>
                          {valorTotal > 0 && (
                            <Tag color="green" style={{ fontSize: isMobile ? "11px" : "12px", margin: 0 }}>
                              <DollarOutlined style={{ marginRight: "4px", fontSize: "10px" }} />
                              R$ {formatCurrency(valorTotal)}
                            </Tag>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mensagem quando não há novos lançamentos */}
          {totalFiltrados === 0 && totalSalvos === 0 && (
            <Text style={{ fontSize: isMobile ? "14px" : "16px", color: "#666", fontStyle: "italic" }}>
              Busca finalizada sem novos lançamentos.
            </Text>
          )}
        </div>
      );
    }

    // Formato para PagamentosClienteModal (cliente específico)
    if (summary.totalSalvos !== undefined && summary.totalVinculosClienteAtualizados !== undefined) {
      const { 
        totalSalvos = 0, 
        totalVinculosClienteAtualizados = 0,
        periodo = null,
        contaCorrente = null,
        cliente = null,
      } = summary;

      return (
        <div style={{ padding: isMobile ? "8px 0" : "12px 0" }}>
          {/* Informações do Cliente */}
          {cliente && (
            <div style={{ 
              marginBottom: isMobile ? "16px" : "20px", 
              padding: isMobile ? "10px" : "12px",
              backgroundColor: "#e6f7ff",
              borderRadius: "6px",
              border: "1px solid #91d5ff"
            }}>
              <Space>
                <UserOutlined style={{ color: "#1890ff", fontSize: isMobile ? "16px" : "18px" }} />
                <div>
                  <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666", display: "block" }}>
                    Cliente:
                  </Text>
                  <Text style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", fontWeight: "500" }}>
                    {cliente?.nome ? capitalizeName(cliente.nome) : "Cliente"}
                  </Text>
                </div>
              </Space>
            </div>
          )}

          {/* Informações do Período e Conta */}
          {(periodo || contaCorrente) && (
            <div style={{ 
              marginBottom: isMobile ? "16px" : "20px", 
              padding: isMobile ? "10px" : "12px",
              backgroundColor: "#f0f2f5",
              borderRadius: "6px",
              border: "1px solid #d9d9d9"
            }}>
              {periodo && (
                <div style={{ marginBottom: periodo && contaCorrente ? "8px" : "0" }}>
                  <Space>
                    <CalendarOutlined style={{ color: "#1890ff", fontSize: isMobile ? "14px" : "16px" }} />
                    <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666" }}>
                      Período:
                    </Text>
                    <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                      {periodo.inicio} a {periodo.fim}
                    </Text>
                  </Space>
                </div>
              )}
              {contaCorrente && (
                <div>
                  <Space>
                    <BankOutlined style={{ color: "#059669", fontSize: isMobile ? "14px" : "16px" }} />
                    <Text strong style={{ fontSize: isMobile ? "12px" : "13px", color: "#666" }}>
                      Conta:
                    </Text>
                    <Text style={{ fontSize: isMobile ? "12px" : "13px", color: "#333" }}>
                      {contaCorrente.agencia} / {contaCorrente.conta}
                    </Text>
                  </Space>
                </div>
              )}
            </div>
          )}

          {/* Novos Lançamentos */}
          {totalSalvos > 0 && (
            <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
              <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                ✅ Novos Lançamentos:
              </Text>
              <Tag color="green" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px" }}>
                {totalSalvos} {totalSalvos === 1 ? "novo lançamento encontrado" : "novos lançamentos encontrados"}
              </Tag>
            </div>
          )}

          {/* Vínculos Atualizados */}
          {totalVinculosClienteAtualizados > 0 && (
            <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
              <Text strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#333", display: "block", marginBottom: "6px" }}>
                🔗 Vínculos Atualizados:
              </Text>
              <Tag color="blue" style={{ fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "4px 8px" : "6px 12px" }}>
                {totalVinculosClienteAtualizados} {totalVinculosClienteAtualizados === 1 ? "vínculo de cliente atualizado" : "vínculos de cliente atualizados"}
              </Tag>
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {totalSalvos === 0 && totalVinculosClienteAtualizados === 0 && (
            <Text style={{ fontSize: isMobile ? "14px" : "16px", color: "#666", fontStyle: "italic" }}>
              Nenhum novo lançamento encontrado para este período.
            </Text>
          )}
        </div>
      );
    }

    // Fallback: exibir summary como texto simples
    if (typeof summary === "string") {
      return (
        <Text style={{ fontSize: isMobile ? "14px" : "16px", color: "#333", lineHeight: isMobile ? "1.5" : "1.6" }}>
          {summary}
        </Text>
      );
    }

    return null;
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
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          {title}
        </span>
      }
      open={open}
      onCancel={onClose}
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
      {/* Card de Resultado */}
      <Card
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f6ffed",
          borderColor: "#52c41a"
        }}
      >
        <div style={{ padding: isMobile ? "12px" : "16px" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "16px" : "20px" }}>
            <CheckCircleOutlined 
              style={{ 
                fontSize: isMobile ? "36px" : "48px", 
                color: "#52c41a", 
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
              A busca foi concluída com sucesso!
            </Text>
          </div>

          <Divider style={{ margin: isMobile ? "12px 0" : "16px 0", borderColor: "#e8e8e8" }} />

          {/* Conteúdo do resumo */}
          {customContent || renderDefaultContent()}
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
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

BuscaAPIResultModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  summary: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  customContent: PropTypes.node,
};

export default BuscaAPIResultModal;
