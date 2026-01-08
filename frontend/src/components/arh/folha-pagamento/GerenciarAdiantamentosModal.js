// src/components/arh/folha-pagamento/GerenciarAdiantamentosModal.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  Empty,
  Checkbox,
  Spin,
  Alert,
  Tooltip,
  Tag,
} from "antd";
import {
  DollarOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  DeleteOutlined,
  WarningOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";
import { formatCurrency, capitalizeName } from "../../../utils/formatters";
import useResponsive from "../../../hooks/useResponsive";
import ResponsiveTable from "../../common/ResponsiveTable";
import MonetaryInput from "../../common/inputs/MonetaryInput";

const { Text, Title } = Typography;

const GerenciarAdiantamentosModal = ({
  open,
  onClose,
  lancamento,
  folhaId,
  onAdiantamentoAtualizado,
}) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  
  // Dados carregados
  const [parcelasVinculadas, setParcelasVinculadas] = useState([]);
  const [adiantamentosDisponiveis, setAdiantamentosDisponiveis] = useState([]);
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(new Set());
  const [adiantamentoAvulso, setAdiantamentoAvulso] = useState(0);
  const [adiantamentoAvulsoTemp, setAdiantamentoAvulsoTemp] = useState(0);
  const [adiantamentoAvulsoOriginal, setAdiantamentoAvulsoOriginal] = useState(0);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && lancamento?.id && folhaId) {
      carregarDados();
    } else {
      // Limpar dados ao fechar
      setParcelasVinculadas([]);
      setAdiantamentosDisponiveis([]);
      setParcelasSelecionadas(new Set());
      setAdiantamentoAvulso(0);
    }
  }, [open, lancamento?.id, folhaId]);

  const carregarDados = async () => {
    if (!lancamento?.id || !folhaId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/arh/folhas/${folhaId}/lancamentos/${lancamento.id}/adiantamentos-disponiveis`
      );
      
      const { vinculadas, disponiveis, avulso } = response.data || {};
      
      setParcelasVinculadas(vinculadas || []);
      setAdiantamentosDisponiveis(disponiveis || []);
      
      // Marcar parcelas já vinculadas como selecionadas
      const idsVinculadas = new Set((vinculadas || []).map(p => p.id));
      setParcelasSelecionadas(idsVinculadas);
      
      // Usar valor avulso retornado pelo backend (ou calcular se não vier)
      const valorAvulsoFinal = avulso !== undefined && avulso !== null 
        ? Number(avulso || 0) 
        : (() => {
            // Fallback: calcular diferença entre total de adiantamento e soma das parcelas
            const totalParcelas = (vinculadas || []).reduce(
              (sum, p) => sum + Number(p.valorDeduzido || 0),
              0
            );
            const valorAvulsoCalculado = Number(lancamento.adiantamento || 0) - totalParcelas;
            return valorAvulsoCalculado > 0 ? valorAvulsoCalculado : 0;
          })();
      
      setAdiantamentoAvulso(valorAvulsoFinal);
      setAdiantamentoAvulsoTemp(valorAvulsoFinal);
      setAdiantamentoAvulsoOriginal(valorAvulsoFinal);
    } catch (error) {
      console.error("Erro ao carregar adiantamentos:", error);
      showNotification(
        "error",
        "Erro",
        "Não foi possível carregar os dados de adiantamentos."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calcular total do adiantamento
  const totalAdiantamento = useMemo(() => {
    const totalParcelas = parcelasVinculadas.reduce(
      (sum, p) => sum + Number(p.valorDeduzido || 0),
      0
    );
    const totalSelecionados = Array.from(parcelasSelecionadas).reduce(
      (sum, id) => {
        // Encontrar parcela diretamente no useMemo
        let parcela = null;
        for (const adiantamento of adiantamentosDisponiveis) {
          const encontrada = adiantamento.parcelasDisponiveis?.find(p => p.id === id);
          if (encontrada) {
            parcela = encontrada;
            break;
          }
        }
        return sum + (parcela ? Number(parcela.valorParcela || 0) : 0);
      },
      0
    );
    return totalSelecionados + Number(adiantamentoAvulsoTemp || 0);
  }, [parcelasVinculadas, parcelasSelecionadas, adiantamentoAvulsoTemp, adiantamentosDisponiveis]);

  // Função auxiliar para encontrar uma parcela disponível
  const encontrarParcelaDisponivel = useCallback((id) => {
    for (const adiantamento of adiantamentosDisponiveis) {
      const parcela = adiantamento.parcelasDisponiveis?.find(p => p.id === id);
      if (parcela) return parcela;
    }
    return null;
  }, [adiantamentosDisponiveis]);

  // Vincular/desvincular parcela
  const handleToggleParcela = async (parcelaId, vincular) => {
    try {
      setAtualizando(true);

      const novasSelecionadas = new Set(parcelasSelecionadas);
      if (vincular) {
        novasSelecionadas.add(parcelaId);
      } else {
        novasSelecionadas.delete(parcelaId);
      }

      // Calcular novo total de adiantamento
      const totalSelecionados = Array.from(novasSelecionadas).reduce(
        (sum, id) => {
          const parcela = encontrarParcelaDisponivel(id);
          return sum + (parcela ? Number(parcela.valorParcela || 0) : 0);
        },
        0
      );
      const novoTotal = totalSelecionados + Number(adiantamentoAvulso || 0);

      // Chamar endpoint para atualizar
      await axiosInstance.patch(
        `/api/arh/folhas/${folhaId}/lancamentos/${lancamento.id}/adiantamento`,
        {
          lancamentosAdiantamento: Array.from(novasSelecionadas),
          adiantamentoAvulso: Number(adiantamentoAvulso || 0) > 0 ? Number(adiantamentoAvulso) : null,
        }
      );

      setParcelasSelecionadas(novasSelecionadas);

      showNotification("success", "Sucesso", vincular ? "Parcela vinculada!" : "Parcela desvinculada!");

      // Recarregar dados para atualizar
      await carregarDados();

      // Notificar componente pai
      if (onAdiantamentoAtualizado) {
        onAdiantamentoAtualizado();
      }
    } catch (error) {
      console.error("Erro ao atualizar parcela:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Não foi possível atualizar a parcela.";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setAtualizando(false);
    }
  };

  // Excluir parcela vinculada
  const handleExcluirParcela = async (parcela) => {
    try {
      setAtualizando(true);

      // Calcular novo total sem essa parcela
      const totalRestante = parcelasVinculadas.reduce(
        (sum, p) => sum + Number(p.valorDeduzido || 0),
        0
      ) - Number(parcela.valorDeduzido || 0);
      const novoTotal = totalRestante + Number(adiantamentoAvulso || 0);

      // Chamar endpoint para atualizar
      await axiosInstance.patch(
        `/api/arh/folhas/${folhaId}/lancamentos/${lancamento.id}/adiantamento`,
        {
          lancamentosAdiantamento: parcelasVinculadas
            .filter(p => p.id !== parcela.id)
            .map(p => p.id),
          adiantamentoAvulso: Number(adiantamentoAvulso || 0) > 0 ? Number(adiantamentoAvulso) : null,
        }
      );

      showNotification("success", "Sucesso", "Parcela excluída!");
      
      // Recarregar dados para atualizar
      await carregarDados();
      
      // Notificar componente pai
      if (onAdiantamentoAtualizado) {
        onAdiantamentoAtualizado();
      }
    } catch (error) {
      console.error("Erro ao excluir parcela:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Não foi possível excluir a parcela.";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setAtualizando(false);
    }
  };

  // Atualizar valor avulso temporariamente (apenas no estado local)
  const handleMudarAvulso = (novoValor) => {
    setAdiantamentoAvulsoTemp(Number(novoValor || 0));
  };

  // Aplicar o valor avulso no backend
  const handleAplicarAvulso = async () => {
    try {
      setAtualizando(true);

      const valorAvulso = Number(adiantamentoAvulsoTemp || 0);

      // Chamar endpoint para atualizar
      await axiosInstance.patch(
        `/api/arh/folhas/${folhaId}/lancamentos/${lancamento.id}/adiantamento`,
        {
          lancamentosAdiantamento: Array.from(parcelasSelecionadas),
          adiantamentoAvulso: valorAvulso > 0 ? valorAvulso : null,
        }
      );

      // Atualizar estados locais diretamente (sem chamar API novamente)
      setAdiantamentoAvulso(valorAvulso);
      setAdiantamentoAvulsoOriginal(valorAvulso);

      showNotification("success", "Sucesso", "Adiantamento avulso atualizado!");

      // Notificar componente pai para atualizar o lançamento na lista
      if (onAdiantamentoAtualizado) {
        onAdiantamentoAtualizado();
      }
    } catch (error) {
      console.error("Erro ao atualizar adiantamento avulso:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Não foi possível atualizar o adiantamento avulso.";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setAtualizando(false);
    }
  };

  // Colunas da tabela de parcelas vinculadas
  const colunasVinculadas = [
    {
      title: "Adiantamento",
      key: "adiantamento",
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
            Criado em: {new Date(record.adiantamento.createdAt).toLocaleDateString("pt-BR")}
          </Text>
          <br />
          <Text style={{ fontSize: "0.75rem", color: "#666" }}>
            Total: R$ {formatCurrency(record.adiantamento.valorTotal)}
          </Text>
        </div>
      ),
    },
    {
      title: "Parcela Nº",
      dataIndex: "parcelaNumero",
      key: "parcelaNumero",
      width: 100,
      align: "center",
      render: (numero) => (
        <Tag
          color="purple"
          style={{
            fontSize: "0.75rem",
            padding: "4px 10px",
            fontWeight: "600",
          }}
        >
          #{numero}
        </Tag>
      ),
    },
    {
      title: "Valor Deduzido",
      dataIndex: "valorDeduzido",
      key: "valorDeduzido",
      width: 130,
      align: "center",
      render: (valor) => (
        <Text strong style={{ color: "#059669", fontSize: "0.875rem" }}>
          R$ {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: "Ações",
      key: "acoes",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          icon={<DeleteOutlined />}
          onClick={() => handleExcluirParcela(record)}
          disabled={atualizando}
          style={{
            color: "#ff4d4f",
            padding: "4px 8px",
          }}
          size="small"
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <span
          style={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}
        >
          <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
          Gerenciar Adiantamentos - {lancamento?.funcionario?.nome ? capitalizeName(lancamento.funcionario.nome) : ""}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? "middle" : "large"}
            icon={<CloseOutlined />}
            style={{
              height: isMobile ? "36px" : "40px",
            }}
          >
            Fechar
          </Button>
        </div>
      }
      width={isMobile ? "95vw" : "90%"}
      style={{ maxWidth: isMobile ? "95vw" : "80rem" }}
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
      }}
      zIndex={1050}
      centered
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Alert informativo sobre salvamento automático */}
          <Alert
            message="Salvamento Automático"
            description="As alterações são salvas automaticamente assim que você vincula/desvincula parcelas ou altera o adiantamento avulso."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{
              marginBottom: isMobile ? 12 : 16,
              backgroundColor: "#e6f7ff",
              borderColor: "#91d5ff",
            }}
            closable={false}
          />

          {/* Resumo do Adiantamento Atual */}
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Resumo do Adiantamento
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "0.125rem solid #047857",
                padding: isMobile ? "6px 12px" : "8px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "16px",
              },
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Total de Adiantamento:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: isMobile ? "1rem" : "1.125rem",
                    fontWeight: "600",
                    color: "#059669",
                    marginTop: "4px",
                  }}
                >
                  R$ {formatCurrency(totalAdiantamento)}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Parcelas Vinculadas:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {parcelasVinculadas.length}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Adiantamento Avulso:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  R$ {formatCurrency(adiantamentoAvulsoTemp)}
                </Text>
              </Col>
            </Row>
          </Card>

          {/* Seção 1: Parcelas Vinculadas à Folha */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Parcelas Vinculadas à Folha
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "0.125rem solid #047857",
                padding: isMobile ? "6px 12px" : "8px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "16px",
              },
            }}
          >
            {parcelasVinculadas && parcelasVinculadas.length > 0 ? (
              <ResponsiveTable
                columns={colunasVinculadas}
                dataSource={parcelasVinculadas}
                rowKey="id"
                loading={atualizando}
                pagination={false}
                minWidthMobile={600}
                showScrollHint={true}
              />
            ) : (
              <Empty
                description="Nenhuma parcela vinculada a esta folha"
                image={<FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
              />
            )}
          </Card>

          {/* Seção 2: Adiantamentos Vigentes para Vincular */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Adiantamentos Disponíveis para Vincular
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "0.125rem solid #047857",
                padding: isMobile ? "6px 12px" : "8px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "16px",
              },
            }}
          >
            {adiantamentosDisponiveis && adiantamentosDisponiveis.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {adiantamentosDisponiveis.map((adiantamento) => (
                  <div
                    key={adiantamento.id}
                    style={{
                      padding: 12,
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: "#059669", fontSize: "0.875rem" }}>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        Adiantamento de {new Date(adiantamento.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Tag
                          color="green"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                        >
                          Valor adiantado: R$ {formatCurrency(adiantamento.valorTotal)}
                        </Tag>
                        <Tag
                          color="blue"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                        >
                          Saldo Devedor: R$ {formatCurrency(adiantamento.saldoDevedor)}
                        </Tag>
                      </div>
                    </div>
                    {adiantamento.parcelasDisponiveis && adiantamento.parcelasDisponiveis.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {adiantamento.parcelasDisponiveis.map((parcela) => (
                          <div
                            key={parcela.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 6,
                            }}
                          >
                            <Space size="small">
                              <Checkbox
                                checked={parcelasSelecionadas.has(parcela.id)}
                                onChange={(e) =>
                                  handleToggleParcela(parcela.id, e.target.checked)
                                }
                                disabled={atualizando}
                              />
                              <Tag
                                color="purple"
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "4px 10px",
                                  fontWeight: "600",
                                }}
                              >
                                Parcela #{parcela.numeroParcela}
                              </Tag>
                              <Text style={{ fontSize: "0.875rem" }}>
                                Valor: R$ {formatCurrency(parcela.valorParcela)}
                              </Text>
                            </Space>
                            {parcelasSelecionadas.has(parcela.id) && (
                              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text style={{ color: "#999", fontSize: "0.875rem" }}>
                        Nenhuma parcela disponível
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="Nenhum adiantamento disponível para vincular"
                image={<UserOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
              />
            )}
          </Card>

          {/* Seção 3: Adiantamento Avulso */}
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Adiantamento Avulso Adicional
                </span>
              </Space>
            }
            style={{
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "0.125rem solid #047857",
                padding: isMobile ? "6px 12px" : "8px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "16px",
              },
            }}
          >
              <div style={{ maxWidth: 400 }}>
              <Tooltip
                title={
                  <div style={{ maxWidth: 300 }}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>Adiantamento Avulso</div>
                    <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                      Valor adicional de adiantamento não vinculado a parcelas.
                      <br />
                      <br />
                      Será somado ao valor das parcelas vinculadas para obter o total do adiantamento.
                      <br />
                      <br />
                      <strong>Exemplo:</strong>
                      <br />
                      Parcelas: R$ 500,00
                      <br />
                      Avulso: R$ 100,00
                      <br />
                      Total: R$ 600,00
                    </div>
                  </div>
                }
                placement="top"
              >
                <InfoCircleOutlined style={{ color: "#1890ff", marginRight: 8, cursor: "help" }} />
              </Tooltip>
              <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                Valor do Adiantamento Avulso:
              </Text>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "stretch", flex: 0.35 }}>
                    <MonetaryInput
                      value={adiantamentoAvulsoTemp}
                      onChange={handleMudarAvulso}
                      onPressEnter={handleAplicarAvulso}
                      onPressEsc={() => setAdiantamentoAvulsoTemp(adiantamentoAvulso)}
                      disabled={atualizando}
                      size={isMobile ? "middle" : "large"}
                      style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      placeholder="0,00"
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 11px",
                        fontSize: "14px",
                        color: "rgba(0, 0, 0, 0.88)",
                        fontWeight: 400,
                        lineHeight: 1,
                        textAlign: "center",
                        backgroundColor: "#fafafa",
                        border: "1px solid #d9d9d9",
                        borderLeft: "none",
                        borderTopRightRadius: "6px",
                        borderBottomRightRadius: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      R$
                    </span>
                  </div>
                  {adiantamentoAvulsoTemp !== adiantamentoAvulsoOriginal && (
                    <Tooltip title="Salvar alteração">
                      <Button
                        type="text"
                        size="small"
                        icon={<SaveOutlined style={{ color: "#059669", fontSize: "16px" }} />}
                        onClick={handleAplicarAvulso}
                        loading={atualizando}
                        style={{
                          border: "none",
                          boxShadow: "none",
                          padding: "4px",
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </Modal>
  );
};

GerenciarAdiantamentosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lancamento: PropTypes.object,
  folhaId: PropTypes.number,
  onAdiantamentoAtualizado: PropTypes.func,
};

export default GerenciarAdiantamentosModal;
