// src/components/pagamentos/SecaoLotesPagamentos.js

import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Statistic,
  Row,
  Col,
  Pagination,
  Tooltip,
} from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TeamOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import ResponsiveTable from "../common/ResponsiveTable";
import { formatCurrency, formatarCPF, capitalizeName, formatarChavePixPorTipo } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";

const { Text } = Typography;

// Função para obter cor e tooltip do Status do Item (status do pagamento_api_item)
const getStatusItemConfig = (statusItem) => {
  const statusUpper = (statusItem || '').toUpperCase();
  
  const configs = {
    'PENDENTE': {
      color: '#d9d9d9',
      tooltip: 'Item criado, aguardando envio ao Banco do Brasil'
    },
    'ENVIADO': {
      color: '#1890ff',
      tooltip: 'Item enviado ao Banco do Brasil, aguardando validação'
    },
    'ACEITO': {
      color: '#52c41a',
      tooltip: 'Banco do Brasil validou os dados do item. Item aceito e pronto para processamento'
    },
    'REJEITADO': {
      color: '#ff4d4f',
      tooltip: 'Item rejeitado pelo Banco do Brasil devido a dados inconsistentes'
    },
    'BLOQUEADO': {
      color: '#fa8c16',
      tooltip: 'Item bloqueado porque o lote foi rejeitado. Não será processado nem liberado'
    },
    'PROCESSADO': {
      color: '#52c41a',
      tooltip: 'Item processado com sucesso. Pagamento efetivado'
    },
    'PAGO': {
      color: '#52c41a',
      tooltip: 'Item pago. Pagamento efetivado'
    },
    'ERRO': {
      color: '#ff4d4f',
      tooltip: 'Erro no processamento do item'
    }
  };
  
  return configs[statusUpper] || {
    color: '#d9d9d9',
    tooltip: `Status: ${statusItem || 'N/A'}`
  };
};

// Função para obter cor e tooltip do Status do Funcionário (status do funcionarioPagamento)
const getStatusFuncionarioConfig = (statusFuncionario) => {
  const statusUpper = (statusFuncionario || '').toUpperCase();
  
  const configs = {
    'PENDENTE': {
      color: '#d9d9d9',
      tooltip: 'Pagamento pendente. Aguardando processamento'
    },
    'ENVIADO': {
      color: '#1890ff',
      tooltip: 'Pagamento enviado ao Banco do Brasil'
    },
    'ACEITO': {
      color: '#52c41a',
      tooltip: 'Pagamento aceito pelo Banco do Brasil'
    },
    'PROCESSANDO': {
      color: '#1890ff',
      tooltip: 'Pagamento em processamento'
    },
    'PAGO': {
      color: '#52c41a',
      tooltip: 'Pagamento efetivado com sucesso'
    },
    'REJEITADO': {
      color: '#ff4d4f',
      tooltip: 'Pagamento rejeitado. Dados inconsistentes detectados pelo Banco do Brasil'
    },
    'REPROCESSAR': {
      color: '#fa8c16',
      tooltip: 'Pagamento bloqueado em lote rejeitado. Aguardando reprocessamento'
    },
    'BLOQUEADO': {
      color: '#fa8c16',
      tooltip: 'Pagamento bloqueado. Não será processado'
    },
    'CANCELADO': {
      color: '#8c8c8c',
      tooltip: 'Pagamento cancelado'
    },
    'ERRO': {
      color: '#ff4d4f',
      tooltip: 'Erro no processamento do pagamento'
    }
  };
  
  return configs[statusUpper] || {
    color: '#d9d9d9',
    tooltip: `Status: ${statusFuncionario || 'N/A'}`
  };
};

const SecaoLotesPagamentos = ({
  titulo,
  icone,
  lotes,
  loading,
  estatisticas,
  paginacao,
  onPageChange,
  activeKey,
  onToggleActive,
  columns,
  rowKey = "loteId",
  onConsultarItemIndividual,
}) => {
  const { isMobile } = useResponsive();
  const isExpanded = activeKey;
  
  // Determinar o contexto baseado no título
  const isFolhaPagamento = titulo.includes("Folha de Pagamento");
  const contextoTexto = isFolhaPagamento ? "de folha de pagamento" : "de turma de colheita";

  return (
    <Card
      style={{
        margin: 0,
        border: "1px solid #e8e8e8",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        marginBottom: 24,
      }}
      headStyle={{
        backgroundColor: "#059669",
        borderBottom: "2px solid #047857",
        color: "#ffffff",
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
      }}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
          onClick={onToggleActive}
        >
          <Space>
            {icone || <DollarOutlined style={{ color: "#ffffff", fontSize: "18px" }} />}
            <Text strong style={{ fontSize: isMobile ? "14px" : "16px", color: "#ffffff" }}>
              {titulo}
            </Text>
            {titulo.includes("Folha de Pagamento") && (
              <Tooltip
                title={
                  <div style={{ maxWidth: "400px" }}>
                    <div style={{ marginBottom: "8px", fontWeight: "500" }}>
                      Como funciona o processamento de pagamentos bloqueados:
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                      • Quando um pagamento está <strong>bloqueado</strong>, todo o lote é marcado como <strong>rejeitado</strong> para impedir a liberação, pois o crédito não poderá ser efetuado.
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                      • Quando um lote está <strong>rejeitado</strong>, os funcionários e colheitas têm seus status revertidos para que o pagamento possa ser feito novamente em um novo lote.
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "11px", opacity: 0.9, fontStyle: "italic" }}>
                      Nota: Se algum item já estiver como "pago" no lote rejeitado, ele permanece como pago. Apenas os itens bloqueados são marcados como rejeitados.
                    </div>
                  </div>
                }
                placement="bottomLeft"
              >
                <InfoCircleOutlined
                  style={{
                    color: "#ffffff",
                    fontSize: "16px",
                    cursor: "help",
                    opacity: 0.9,
                    marginLeft: "4px",
                  }}
                />
              </Tooltip>
            )}
          </Space>
          <Space>
            <Text style={{ fontSize: "11px", color: "#ffffff", opacity: 0.9 }}>
              Clique para expandir/colapsar
            </Text>
            <RightOutlined
              rotate={isExpanded ? 90 : 0}
              style={{
                color: "#ffffff",
                fontSize: "14px",
                transition: "transform 0.3s",
                marginLeft: "8px",
              }}
            />
          </Space>
        </div>
      }
      bodyStyle={{ padding: "16px" }}
    >
      {/* Cards de Estatísticas */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "0.75rem" }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Lotes</Text>
                  <Tooltip title="Quantidade total de lotes de pagamento criados nesta seção.">
                    <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                  </Tooltip>
                </Space>
              }
              value={estatisticas.totalLotes}
              prefix={<FileTextOutlined style={{ color: "#059669", fontSize: "1rem" }} />}
              valueStyle={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "0.75rem" }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Itens</Text>
                  <Tooltip title="Quantidade total de itens (transferências individuais) em todos os lotes desta seção.">
                    <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                  </Tooltip>
                </Space>
              }
              value={estatisticas.totalItens}
              prefix={<ShoppingOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        {estatisticas.totalColheitas !== undefined && (
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              bodyStyle={{ padding: "0.75rem" }}
            >
              <Statistic
                title={
                  <Space size={4}>
                    <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Colheitas</Text>
                    <Tooltip title="Quantidade total de colheitas vinculadas aos lotes de pagamento de turmas.">
                      <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                    </Tooltip>
                  </Space>
                }
                value={estatisticas.totalColheitas}
                prefix={<TeamOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </Col>
        )}
        {estatisticas.totalFuncionarios !== undefined && (
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              bodyStyle={{ padding: "0.75rem" }}
            >
              <Statistic
                title={
                  <Space size={4}>
                    <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Funcionários</Text>
                    <Tooltip title="Quantidade total de funcionários vinculados aos lotes de pagamento da folha.">
                      <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                    </Tooltip>
                  </Space>
                }
                value={estatisticas.totalFuncionarios}
                prefix={<TeamOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "0.75rem" }}
          >
            <div>
              <Space size={4} style={{ marginBottom: "8px" }}>
                <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Lotes Liberados / Rejeitados</Text>
                <Tooltip
                  title={
                    <div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Lotes Liberados:</strong> Quantidade de lotes que já foram liberados para processamento no Banco do Brasil.
                      </div>
                      <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Lotes Rejeitados:</strong> Quantidade de lotes que foram rejeitados pelo Banco do Brasil ou que contêm itens bloqueados.
                      </div>
                    </div>
                  }
                >
                  <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                </Tooltip>
              </Space>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Tooltip title={`Lotes ${contextoTexto} liberados: ${estatisticas.lotesLiberados || 0}`}>
                  <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem", cursor: "help" }} />
                </Tooltip>
                <span style={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}>
                  {estatisticas.lotesLiberados || 0}
                </span>
                <span style={{ color: "#d9d9d9", fontSize: "1rem" }}>/</span>
                <span style={{ color: "#ff4d4f", fontSize: "1.125rem", fontWeight: "600" }}>
                  {estatisticas.lotesRejeitados || 0}
                </span>
                <Tooltip title={`Lotes ${contextoTexto} rejeitados: ${estatisticas.lotesRejeitados || 0}`}>
                  <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "1rem", marginLeft: "4px", cursor: "help" }} />
                </Tooltip>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "0.75rem" }}
          >
            <div>
              <Space size={4} style={{ marginBottom: "8px" }}>
                <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Itens Liberados / Rejeitados</Text>
                <Tooltip
                  title={
                    <div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Itens Liberados:</strong> Quantidade de itens (transferências) que já foram processados e pagos pelo Banco do Brasil.
                      </div>
                      <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Itens Rejeitados:</strong> Quantidade de itens (transferências) que foram rejeitados ou bloqueados pelo Banco do Brasil.
                      </div>
                    </div>
                  }
                >
                  <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                </Tooltip>
              </Space>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Tooltip title={`Itens ${contextoTexto} liberados: ${estatisticas.itensLiberados || 0}`}>
                  <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem", cursor: "help" }} />
                </Tooltip>
                <span style={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}>
                  {estatisticas.itensLiberados || 0}
                </span>
                <span style={{ color: "#d9d9d9", fontSize: "1rem" }}>/</span>
                <span style={{ color: "#ff4d4f", fontSize: "1.125rem", fontWeight: "600" }}>
                  {estatisticas.itensRejeitados || 0}
                </span>
                <Tooltip title={`Itens ${contextoTexto} rejeitados: ${estatisticas.itensRejeitados || 0}`}>
                  <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "1rem", marginLeft: "4px", cursor: "help" }} />
                </Tooltip>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "0.75rem" }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Liberado</Text>
                  <Tooltip
                    title={
                      <div>
                        <div style={{ marginBottom: "4px" }}>
                          <strong>Valor já pago pelo Banco do Brasil:</strong>
                        </div>
                        <div>• Soma dos valores dos itens (transferências) que já foram processados e pagos</div>
                        <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.9 }}>
                          Este valor representa pagamentos efetivados pelo banco, independente de o lote ter sido liberado ou não.
                        </div>
                      </div>
                    }
                  >
                    <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                  </Tooltip>
                </Space>
              }
              value={formatCurrency(estatisticas.valorTotalLiberado || 0)}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "0.75rem" }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Pendente</Text>
                  <Tooltip
                    title={
                      <div>
                        <div style={{ marginBottom: "4px" }}>
                          <strong>Valor das colheitas que ainda não foi pago:</strong>
                        </div>
                        <div>• Diferença entre o valor total das colheitas e o valor já pago</div>
                        <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.9 }}>
                          <strong>Fórmula:</strong> Valor Total Colheitas - Valor Total Liberado
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.9 }}>
                          Este valor representa colheitas que ainda estão aguardando processamento pelo banco.
                        </div>
                      </div>
                    }
                  >
                    <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                  </Tooltip>
                </Space>
              }
              value={formatCurrency(estatisticas.valorTotalPendente || 0)}
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16", fontSize: "1rem" }} />}
              valueStyle={{ color: "#fa8c16", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        {estatisticas.valorTotalColheitas !== undefined && (
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              bodyStyle={{ padding: "0.75rem" }}
            >
              <Statistic
                title={
                  <Space size={4}>
                    <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Colheitas</Text>
                    <Tooltip
                      title={
                        <div>
                          <div style={{ marginBottom: "4px" }}>
                            <strong>Valor total de todas as colheitas vinculadas:</strong>
                          </div>
                          <div>• Soma dos valores individuais de todas as colheitas vinculadas aos lotes</div>
                          <div style={{ marginTop: "8px", fontSize: "11px", opacity: 0.9 }}>
                            <strong>Importante:</strong> Este valor sempre deve bater com a soma de "Valor Total Liberado" + "Valor Total Pendente".
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.9 }}>
                            <strong>Fórmula:</strong> Valor Total Colheitas = Valor Total Liberado + Valor Total Pendente
                          </div>
                        </div>
                      }
                    >
                      <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                    </Tooltip>
                  </Space>
                }
                value={formatCurrency(estatisticas.valorTotalColheitas)}
                prefix={<DollarOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </Col>
        )}
        {estatisticas.valorTotalFuncionarios !== undefined && (
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: "0.75rem",
                boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
              bodyStyle={{ padding: "0.75rem" }}
            >
              <Statistic
                title={
                  <Space size={4}>
                    <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Funcionários</Text>
                    <Tooltip title="Soma total dos valores líquidos de todos os funcionários vinculados aos lotes de pagamento. Representa o valor total a ser pago aos funcionários.">
                      <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                    </Tooltip>
                  </Space>
                }
                value={formatCurrency(estatisticas.valorTotalFuncionarios)}
                prefix={<DollarOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
                valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Tabela - Visível apenas quando expandido */}
      {isExpanded && (
        <>
          <div style={{ marginTop: 16, borderTop: "1px solid #e8e8e8", paddingTop: 16 }}>
            <style>
              {`
                .ant-table-expanded-row > td {
                  padding: 0 !important;
                  background-color: #f9f9f9 !important;
                }
                .ant-table-expanded-row > td > div {
                  margin: 0 !important;
                }
              `}
            </style>
            <ResponsiveTable
              columns={columns}
              dataSource={lotes}
              loading={loading}
              rowKey={rowKey}
              minWidthMobile={1400}
              showScrollHint={true}
              expandable={{
                expandIcon: ({ expanded, onExpand, record }) => {
                  const itens = record.itensPagamento || [];
                  if (itens.length === 0) return null;

                  return (
                    <Button
                      type="text"
                      size="small"
                      icon={expanded ? <UpOutlined /> : <DownOutlined />}
                      onClick={(e) => onExpand(record, e)}
                      style={{
                        padding: "4px 8px",
                        height: "auto",
                        color: "#059669",
                      }}
                    />
                  );
                },
                expandedRowRender: (record) => {
                  const itens = record.itensPagamento || [];

                  if (itens.length === 0) {
                    return (
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "#f9f9f9",
                          margin: "0 -16px",
                          borderTop: "1px solid #e8e8e8",
                        }}
                      >
                        <Text type="secondary">Nenhum item neste lote.</Text>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f9f9f9",
                        margin: "0 -16px",
                        borderTop: "1px solid #e8e8e8",
                      }}
                    >
                      <Text
                        strong
                        style={{
                          fontSize: "13px",
                          color: "#059669",
                          marginBottom: "10px",
                          display: "block",
                        }}
                      >
                        Itens do Lote ({itens.length}):
                      </Text>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {itens.map((item, index) => {
                          const colheitas = item.colheitas || [];
                          const funcionarioPagamento = item.funcionarioPagamento;

                          return (
                            <Card
                              key={item.id || index}
                              size="small"
                              style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #d9d9d9",
                                borderRadius: "4px",
                                boxShadow: "none",
                              }}
                              bodyStyle={{ padding: "10px" }}
                            >
                              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                  }}
                                >
                                  <Space size="middle" wrap>
                                    <div>
                                      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                        Código Pagamento
                                      </Text>
                                      <Tag
                                        color="blue"
                                        style={{ fontFamily: "monospace", marginTop: "4px" }}
                                      >
                                        {item.identificadorPagamento ||
                                          item.codigoIdentificadorPagamento ||
                                          item.codigoPagamento ||
                                          "-"}
                                      </Tag>
                                    </div>
                                    <div>
                                      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                        Valor
                                      </Text>
                                      <Text
                                        strong
                                        style={{
                                          display: "block",
                                          marginTop: "4px",
                                          color: "#059669",
                                        }}
                                      >
                                        R$ {formatCurrency(Number(item.valorEnviado || 0))}
                                      </Text>
                                    </div>
                                    {item.chavePixEnviada && (
                                      <div>
                                        <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                          Chave PIX
                                        </Text>
                                        <Text 
                                          style={{ 
                                            display: "block", 
                                            marginTop: "4px", 
                                            fontSize: "11px"
                                          }}
                                        >
                                          {formatarChavePixPorTipo(item.chavePixEnviada, item.tipoChavePixEnviado)}
                                        </Text>
                                      </div>
                                    )}
                                    {item.responsavelChavePixEnviado && (
                                      <div>
                                        <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                          Responsável Chave PIX
                                        </Text>
                                        <Text 
                                          style={{ 
                                            display: "block", 
                                            marginTop: "4px", 
                                            fontSize: "11px"
                                          }}
                                        >
                                          {capitalizeName(item.responsavelChavePixEnviado)}
                                        </Text>
                                      </div>
                                    )}
                                    {/* Status do Item */}
                                    <div>
                                      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                        Status do Item
                                      </Text>
                                      {(() => {
                                        // Verificar se o item está bloqueado (lote rejeitado)
                                        // Pode ser bloqueado via status ou estadoPagamentoIndividual
                                        const itemBloqueado = item.status === 'BLOQUEADO' || item.estadoPagamentoIndividual === 'BLOQUEADO';
                                        const statusItem = itemBloqueado 
                                          ? 'BLOQUEADO' 
                                          : (item.status || item.estadoPagamentoIndividual || 'N/A');
                                        
                                        const config = getStatusItemConfig(statusItem);
                                        
                                        return (
                                          <Tooltip title={config.tooltip}>
                                            <Tag 
                                              color={config.color} 
                                              style={{ 
                                                marginTop: "4px",
                                                cursor: "help"
                                              }}
                                            >
                                              {statusItem}
                                            </Tag>
                                          </Tooltip>
                                        );
                                      })()}
                                    </div>
                                  </Space>
                                  {/* Botão para consultar item individual */}
                                  {(item.identificadorPagamento ||
                                    item.codigoIdentificadorPagamento ||
                                    item.codigoPagamento) && (
                                    <div
                                      style={{
                                        marginTop: "8px",
                                        display: "flex",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                          onConsultarItemIndividual({
                                            identificadorPagamento:
                                              item.identificadorPagamento ||
                                              item.codigoIdentificadorPagamento ||
                                              item.codigoPagamento,
                                            contaCorrenteId: record.contaCorrente?.id,
                                          });
                                        }}
                                        style={{ padding: "0 4px", fontSize: "12px" }}
                                      >
                                        Consultar Online
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Para turma de colheita: mostrar colheitas */}
                                {colheitas.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: "8px",
                                      paddingTop: "8px",
                                      borderTop: "1px solid #e8e8e8",
                                    }}
                                  >
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}
                                    >
                                      Colheitas ({colheitas.length}):
                                    </Text>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                      {colheitas.map((c, idx) => (
                                        <Tag key={idx} color="cyan">
                                          {c.pedidoNumero} - {c.frutaNome} - R${" "}
                                          {formatCurrency(c.valorColheita || 0)}
                                        </Tag>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Para folha de pagamento: mostrar funcionário */}
                                {funcionarioPagamento && (
                                  <div
                                    style={{
                                      marginTop: "8px",
                                      paddingTop: "8px",
                                      borderTop: "1px solid #e8e8e8",
                                    }}
                                  >
                                    <Space size="middle" wrap>
                                      <div>
                                        <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                          Funcionário
                                        </Text>
                                        <Text strong style={{ display: "block", marginTop: "4px" }}>
                                          {funcionarioPagamento.funcionario?.nome || "-"}
                                        </Text>
                                      </div>
                                      {funcionarioPagamento.funcionario?.cpf && (
                                        <div>
                                          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                            CPF
                                          </Text>
                                          <Text style={{ display: "block", marginTop: "4px" }}>
                                            {formatarCPF(funcionarioPagamento.funcionario.cpf)}
                                          </Text>
                                        </div>
                                      )}
                                      {funcionarioPagamento.folha && (
                                        <div>
                                          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                            Folha
                                          </Text>
                                          <Text style={{ display: "block", marginTop: "4px" }}>
                                            {String(funcionarioPagamento.folha.competenciaMes).padStart(
                                              2,
                                              "0"
                                            )}
                                            /{funcionarioPagamento.folha.competenciaAno} -{" "}
                                            {funcionarioPagamento.folha.periodo}ª Quinzena
                                          </Text>
                                        </div>
                                      )}
                                      <div>
                                        <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                          Valor Líquido
                                        </Text>
                                        <Text
                                          strong
                                          style={{
                                            display: "block",
                                            marginTop: "4px",
                                            color: "#059669",
                                          }}
                                        >
                                          R$ {formatCurrency(Number(funcionarioPagamento.valorLiquido || 0))}
                                        </Text>
                                      </div>
                                      {(() => {
                                        // Verificar se o item está bloqueado (lote rejeitado)
                                        const itemBloqueado = item.estadoPagamentoIndividual === 'BLOQUEADO';
                                        const statusExibir = itemBloqueado 
                                          ? 'BLOQUEADO' 
                                          : funcionarioPagamento.statusPagamento;
                                        
                                        if (!statusExibir) return null;
                                        
                                        const config = getStatusFuncionarioConfig(statusExibir);
                                        
                                        return (
                                          <div>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                              Status
                                            </Text>
                                            <Tooltip title={config.tooltip}>
                                              <Tag
                                                color={config.color}
                                                style={{ 
                                                  marginTop: "4px",
                                                  cursor: "help"
                                                }}
                                              >
                                                {statusExibir}
                                              </Tag>
                                            </Tooltip>
                                          </div>
                                        );
                                      })()}
                                    </Space>
                                  </div>
                                )}
                              </Space>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              }}
            />
            {/* Paginação */}
            {paginacao.total > 0 && (
              <div
                style={{
                  padding: isMobile ? "0.75rem" : "1rem",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <Pagination
                  current={paginacao.page}
                  pageSize={paginacao.limit}
                  total={paginacao.total}
                  onChange={onPageChange}
                  onShowSizeChange={onPageChange}
                  showSizeChanger={!isMobile}
                  showTotal={(total, range) =>
                    isMobile
                      ? `${range[0]}-${range[1]}/${total}`
                      : `${range[0]}-${range[1]} de ${total} lotes`
                  }
                  pageSizeOptions={["10", "20", "50", "100"]}
                  size={isMobile ? "small" : "default"}
                />
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

SecaoLotesPagamentos.propTypes = {
  titulo: PropTypes.string.isRequired,
  icone: PropTypes.node,
  lotes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  estatisticas: PropTypes.object.isRequired,
  paginacao: PropTypes.object.isRequired,
  onPageChange: PropTypes.func.isRequired,
  activeKey: PropTypes.bool.isRequired,
  onToggleActive: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  rowKey: PropTypes.string,
  onConsultarItemIndividual: PropTypes.func.isRequired,
};

export default SecaoLotesPagamentos;

