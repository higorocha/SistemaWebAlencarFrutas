// src/components/pedidos/HistoricoPedidoModal.js

import React from "react";
import { Modal, Timeline, Typography, Tag, Space, Empty, Divider } from "antd";
import PropTypes from "prop-types";
import {
  HistoryOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Text, Paragraph } = Typography;

// Mapeamento de ações para ícones e cores
const getAcaoConfig = (acao) => {
  const configs = {
    CRIACAO_PEDIDO: {
      icon: <FileAddOutlined />,
      color: "#1890ff",
      label: "Pedido Criado"
    },
    EDICAO_GERAL: {
      icon: <EditOutlined />,
      color: "#722ed1",
      label: "Dados Editados"
    },
    ATUALIZACAO_COLHEITA: {
      icon: <CalendarOutlined />,
      color: "#52c41a",
      label: "Colheita Atualizada"
    },
    COLHEITA_COMPLETADA: {
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
      label: "Colheita Completada"
    },
    TRANSICAO_AGUARDANDO_PRECIFICACAO: {
      icon: <ClockCircleOutlined />,
      color: "#faad14",
      label: "Aguardando Precificação"
    },
    ATUALIZACAO_PRECIFICACAO: {
      icon: <DollarOutlined />,
      color: "#fa8c16",
      label: "Precificação Atualizada"
    },
    AJUSTE_PRECIFICACAO: {
      icon: <EditOutlined />,
      color: "#fa8c16",
      label: "Precificação Ajustada"
    },
    TRANSICAO_AGUARDANDO_PAGAMENTO: {
      icon: <ClockCircleOutlined />,
      color: "#faad14",
      label: "Aguardando Pagamento"
    },
    PAGAMENTO_ADICIONADO: {
      icon: <DollarOutlined />,
      color: "#52c41a",
      label: "Pagamento Adicionado"
    },
    PAGAMENTO_ATUALIZADO: {
      icon: <EditOutlined />,
      color: "#1890ff",
      label: "Pagamento Atualizado"
    },
    PAGAMENTO_REMOVIDO: {
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f",
      label: "Pagamento Removido"
    },
    FINALIZAR_PEDIDO: {
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
      label: "Pedido Finalizado"
    },
    CANCELAR_PEDIDO: {
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f",
      label: "Pedido Cancelado"
    },
    REMOVER_PEDIDO: {
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f",
      label: "Pedido Removido"
    },
  };

  return configs[acao] || {
    icon: <HistoryOutlined />,
    color: "#8c8c8c",
    label: acao
  };
};

const HistoricoPedidoModal = ({ open, onClose, historico, numeroPedido }) => {
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
          <HistoryOutlined style={{ marginRight: 8 }} />
          Histórico do Pedido {numeroPedido}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
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
        }
      }}
      centered
      destroyOnClose
    >
      {!historico || historico.length === 0 ? (
        <Empty
          description="Nenhum histórico disponível"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Timeline
          style={{ marginTop: 24 }}
          items={historico.map((item, index) => {
            const config = getAcaoConfig(item.acao);

            return {
              key: item.id,
              dot: (
                <div style={{
                  backgroundColor: "#ffffff",
                  border: `2px solid ${config.color}`,
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: config.color
                }}>
                  {config.icon}
                </div>
              ),
              children: (
                <div style={{
                  backgroundColor: index === 0 ? "#f6ffed" : "#fafafa",
                  border: `1px solid ${index === 0 ? "#b7eb8f" : "#e8e8e8"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  marginLeft: "8px"
                }}>
                  {/* Header da ação */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px"
                  }}>
                    <div>
                      <Tag
                        color={config.color}
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          marginBottom: "8px"
                        }}
                      >
                        {config.label}
                      </Tag>

                      {/* Usuário */}
                      {item.usuario && (
                        <div style={{ marginTop: "8px" }}>
                          <Space size="small">
                            <UserOutlined style={{ color: "#059669", fontSize: "12px" }} />
                            <Text style={{ fontSize: "13px", color: "#666" }}>
                              {item.usuario.nome}
                            </Text>
                          </Space>
                        </div>
                      )}
                    </div>

                    {/* Data/Hora */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                        {moment(item.createdAt).format("DD/MM/YYYY")}
                      </div>
                      <div style={{ fontSize: "11px", color: "#bfbfbf" }}>
                        {moment(item.createdAt).format("HH:mm:ss")}
                      </div>
                    </div>
                  </div>

                  {/* Status (se houver) */}
                  {(item.statusAnterior || item.statusNovo) && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px"
                    }}>
                      {item.statusAnterior && (
                        <Tag color="default" style={{ fontSize: "11px" }}>
                          {item.statusAnterior}
                        </Tag>
                      )}
                      {item.statusAnterior && item.statusNovo && (
                        <span style={{ color: "#8c8c8c" }}>→</span>
                      )}
                      {item.statusNovo && (
                        <Tag color="green" style={{ fontSize: "11px" }}>
                          {item.statusNovo}
                        </Tag>
                      )}
                    </div>
                  )}

                  {/* Mensagem/Detalhes */}
                  {item.detalhes?.mensagem && (
                    <Paragraph
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#595959",
                        fontStyle: "italic"
                      }}
                    >
                      {item.detalhes.mensagem}
                    </Paragraph>
                  )}

                  {/* Valor (se houver) */}
                  {item.detalhes?.valor && (
                    <div style={{ marginTop: "8px" }}>
                      <Text style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>
                        Valor: R$ {Number(item.detalhes.valor).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                    </div>
                  )}
                </div>
              )
            };
          })}
        />
      )}

      <Divider style={{ margin: "24px 0 16px" }} />

      {/* Footer */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: "8px"
      }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Total de {historico?.length || 0} registro{historico?.length !== 1 ? 's' : ''} no histórico
        </Text>
      </div>
    </Modal>
  );
};

HistoricoPedidoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  historico: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      acao: PropTypes.string.isRequired,
      statusAnterior: PropTypes.string,
      statusNovo: PropTypes.string,
      detalhes: PropTypes.object,
      createdAt: PropTypes.string.isRequired,
      usuario: PropTypes.shape({
        id: PropTypes.number.isRequired,
        nome: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
      }),
    })
  ),
  numeroPedido: PropTypes.string.isRequired,
};

export default HistoricoPedidoModal;
