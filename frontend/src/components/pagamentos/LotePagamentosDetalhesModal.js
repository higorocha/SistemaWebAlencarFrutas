// src/components/pagamentos/LotePagamentosDetalhesModal.js

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Empty,
  Tooltip,
} from "antd";
import {
  DollarOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UnlockOutlined,
  StopOutlined,
  AppleOutlined,
  MessageOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import ResponsiveTable from "../common/ResponsiveTable";
import { formatCurrency, capitalizeName, capitalizeNameShort } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import { PrimaryButton } from "../common/buttons";
import { getFruitIcon } from "../../utils/fruitIcons";
import { mapearEstadoRequisicao } from "../../utils/bbEstadoRequisicao";

const { Text } = Typography;

const LotePagamentosDetalhesModal = ({
  open,
  onClose,
  lote,
  onConfirmLiberacao,
  onConfirmCancelamento,
  loadingLiberacao = false,
  loadingCancelamento = false,
  mode = "liberacao", // "liberacao" ou "cancelamento"
}) => {
  const { isMobile } = useResponsive();
  const colheitas = useMemo(() => lote?.colheitas || [], [lote]);

  const statusLoteTag = () => {
    if (!lote) return null;
    
    // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
    const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
    
    if (estadoRequisicao !== null && estadoRequisicao !== undefined) {
      // Usar mapeamento do BB
      const mapeamento = mapearEstadoRequisicao(estadoRequisicao);
      return (
        <Tooltip title={mapeamento.tooltip}>
          <Tag color={mapeamento.color}>
            {estadoRequisicao ? `${estadoRequisicao} - ${mapeamento.label}` : mapeamento.label}
          </Tag>
        </Tooltip>
      );
    }
    
    // Fallback para status antigo se não tiver estadoRequisicao
    const s = (lote.status || "").toString().toUpperCase();
    let color = "default";
    let label = s;

    if (s === "PENDENTE") {
      color = "orange";
      label = "Pendente";
    } else if (s === "ENVIADO" || s === "PROCESSANDO") {
      color = "gold";
      label = "Processando";
    } else if (s === "CONCLUIDO" || s === "PARCIAL") {
      color = "green";
      label = s === "PARCIAL" ? "Parcial" : "Concluído";
    } else if (s === "REJEITADO" || s === "ERRO") {
      color = "red";
      label = s === "ERRO" ? "Erro" : "Rejeitado";
    }

    return <Tag color={color}>{label.toUpperCase()}</Tag>;
  };

  // Verificar se pode liberar o lote
  const podeLiberar = () => {
    if (!lote) return false;
    
    // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
    const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
    
    // Se não tem estadoRequisicao, não pode liberar
    if (!estadoRequisicao) return false;
    
    // Pode liberar quando:
    // - estadoRequisicao === 1 (dados consistentes, aguardando liberação)
    // - estadoRequisicao === 4 (aguardando liberação - pendente de ação pelo Conveniado)
    // Estados 1 e 4 são os únicos que permitem liberação
    return estadoRequisicao === 1 || estadoRequisicao === 4;
  };

  const colunasColheitas = [
    {
      title: "Pedido",
      dataIndex: "pedidoNumero",
      key: "pedidoNumero",
      width: 140,
      render: (numero) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {numero || '-'}
        </Tag>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "cliente",
      key: "cliente",
      width: 200,
      ellipsis: true,
      render: (cliente) => capitalizeNameShort(cliente || ''),
    },
    {
      title: "Placa",
      dataIndex: "placaPrimaria",
      key: "placaPrimaria",
      width: 140,
      render: (placa) => (
        placa ? placa.toUpperCase() : '-'
      ),
    },
    {
      title: "Fruta",
      dataIndex: "frutaNome",
      key: "frutaNome",
      width: 180,
      render: (nome) => (
        <Space>
          {getFruitIcon(nome, { width: 20, height: 20 })}
          <span style={{ fontWeight: '500' }}>{capitalizeName(nome || '')}</span>
        </Space>
      ),
    },
    {
      title: "Quantidade",
      key: "quantidade",
      width: 130,
      render: (_, record) => (
        <Text strong>
          {(record.quantidadeColhida || 0).toLocaleString('pt-BR')} {record.unidadeMedida || '-'}
        </Text>
      ),
    },
    {
      title: "Valor",
      dataIndex: "valorColheita",
      key: "valorColheita",
      width: 110,
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(valor || 0)}
        </Text>
      ),
    },
    {
      title: "Data Colheita",
      dataIndex: "dataColheita",
      key: "dataColheita",
      width: 140,
      render: (data) => (
        data ? new Date(data).toLocaleDateString('pt-BR') : '-'
      ),
    },
    {
      title: "Status",
      dataIndex: "statusPagamento",
      key: "statusPagamento",
      width: 110,
      render: (status) => {
        const s = (status || "").toString().toUpperCase();
        if (!s) return <Tag>-</Tag>;

        let color = "default";
        let label = s;

        if (s === "PENDENTE") {
          color = "orange";
          label = "Pendente";
        } else if (s === "PROCESSANDO") {
          color = "gold";
          label = "Processando";
        } else if (s === "PAGO") {
          color = "green";
          label = "Pago";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Método",
      dataIndex: "formaPagamento",
      key: "formaPagamento",
      width: 120,
      render: (forma) =>
        forma ? <Tag color="blue">{forma}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: "Observações",
      dataIndex: "observacoes",
      key: "observacoes",
      width: 120,
      render: (obs) => (
        obs ? (
          <Tooltip title={obs}>
            <MessageOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        ) : '-'
      ),
    },
  ];

  const handleOk = () => {
    if (mode === "cancelamento" && onConfirmCancelamento && lote) {
      onConfirmCancelamento(lote);
    } else if (mode === "liberacao" && onConfirmLiberacao && lote) {
      onConfirmLiberacao(lote);
    }
  };

  const isLoading = mode === "cancelamento" ? loadingCancelamento : loadingLiberacao;
  const okText = mode === "cancelamento" ? "Confirmar cancelamento" : "Confirmar liberação";
  const title = mode === "cancelamento" ? "Cancelar Lote de Pagamentos" : "Detalhes do Lote de Pagamentos";
  const titleIcon = mode === "cancelamento" ? <StopOutlined /> : <UnlockOutlined />;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          {titleIcon && <span style={{ marginRight: "0.5rem" }}>{titleIcon}</span>}
          {title}
        </span>
      }
      width={isMobile ? '95vw' : 1600}
      style={{ maxWidth: isMobile ? '95vw' : 1600 }}
      centered
      destroyOnClose
      maskClosable={!isLoading}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1200 },
        mask: { zIndex: 1200 }
      }}
    >
      {lote ? (
        <>
          {/* Card de Informações do Lote */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Informações do Lote
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "0.125rem solid #047857",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: {
                padding: isMobile ? "12px" : "16px"
              }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                  Lote / Requisição:
                </Text>
                <br />
                <Text style={{ fontSize: isMobile ? "0.875rem" : "1rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  #{lote.numeroRequisicao}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Criado em:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {lote.dataCriacao
                    ? new Date(lote.dataCriacao).toLocaleString("pt-BR")
                    : "-"}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  Status do lote:
                </Text>
                <br />
                <div style={{ marginTop: "4px" }}>
                  {statusLoteTag()}
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <BankOutlined style={{ marginRight: 4 }} />
                  Conta utilizada:
                </Text>
                <br />
                {lote.contaCorrente ? (
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    Ag. <Text strong>{lote.contaCorrente.agencia}</Text> / Cc.{" "}
                    <Text strong>{lote.contaCorrente.contaCorrente}</Text>
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: "0.875rem", marginTop: "4px" }}>-</Text>
                )}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  Valor total das colheitas:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  R$ {formatCurrency(lote.valorTotalColheitas || 0)}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  Valor enviado ao BB:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  R$ {formatCurrency(lote.valorTotalEnviado || 0)}
                </Text>
              </Col>
            </Row>
          </Card>

          {/* Card de Colheitas Vinculadas */}
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Colheitas Vinculadas
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "0.125rem solid #047857",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: {
                padding: isMobile ? "12px" : "16px"
              }
            }}
          >
            {colheitas && colheitas.length > 0 ? (
              <ResponsiveTable
                columns={colunasColheitas}
                dataSource={colheitas}
                rowKey="id"
                minWidthMobile={1200}
                showScrollHint={true}
                pagination={false}
              />
            ) : (
              <Empty
                description="Nenhuma colheita vinculada a este lote"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: "40px" }}
              />
            )}
          </Card>

          {/* Footer com botões */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}>
            <Button
              onClick={onClose}
              size={isMobile ? "middle" : "large"}
              disabled={isLoading}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
              }}
            >
              Fechar
            </Button>
            {mode === "cancelamento" ? (
              <Button
                danger
                size={isMobile ? "middle" : "large"}
                loading={isLoading}
                onClick={handleOk}
                icon={<StopOutlined />}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "#ffffff",
                  fontWeight: "500",
                  borderRadius: "6px",
                }}
              >
                {okText}
              </Button>
            ) : (
              <PrimaryButton
                size={isMobile ? "middle" : "large"}
                loading={isLoading}
                onClick={handleOk}
                icon={<UnlockOutlined />}
                disabled={!podeLiberar()}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                {okText}
              </PrimaryButton>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Empty
            description="Nenhum lote selecionado"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}
    </Modal>
  );
};

LotePagamentosDetalhesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lote: PropTypes.object,
  onConfirmLiberacao: PropTypes.func,
  onConfirmCancelamento: PropTypes.func,
  loadingLiberacao: PropTypes.bool,
  loadingCancelamento: PropTypes.bool,
  mode: PropTypes.oneOf(["liberacao", "cancelamento"]),
};

export default LotePagamentosDetalhesModal;


