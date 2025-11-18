// src/components/pagamentos/ConsultaOnlineModal.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Card, Row, Col, Typography, Tag, Space, Spin, Alert, Divider, Button, Empty } from "antd";
import { 
  EyeOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  SafetyOutlined,
  KeyOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency, formatarValorMonetario, formatarCPF, formatarCNPJ, formatarTelefone } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";

const { Text, Title } = Typography;

const ConsultaOnlineModal = ({
  open,
  onClose,
  numeroRequisicao,
  contaCorrenteId,
}) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dadosConsulta, setDadosConsulta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && numeroRequisicao) {
      buscarConsultaOnline();
    } else {
      setDadosConsulta(null);
      setError(null);
    }
  }, [open, numeroRequisicao]);

  const buscarConsultaOnline = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (contaCorrenteId) {
        params.append("contaCorrenteId", contaCorrenteId);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/api/pagamentos/transferencias-pix/${numeroRequisicao}/consulta-online?${queryString}`
        : `/api/pagamentos/transferencias-pix/${numeroRequisicao}/consulta-online`;

      const response = await axiosInstance.get(url);
      setDadosConsulta(response.data);
    } catch (err) {
      console.error("Erro ao consultar online:", err);
      const message =
        err.response?.data?.message ||
        "Erro ao consultar solicitação online. Verifique os logs para mais detalhes.";
      setError(message);
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const mapearEstadoRequisicao = (estado) => {
    const estados = {
      1: { label: "Dados Consistentes", color: "green" },
      2: { label: "Dados Inconsistentes", color: "orange" },
      3: { label: "Rejeitado", color: "red" },
      4: { label: "Pendente de Ação", color: "gold" },
      5: { label: "Em Processamento", color: "blue" },
      6: { label: "Processado", color: "green" },
      7: { label: "Rejeitado", color: "red" },
      8: { label: "Preparando Remessa (Não Liberada)", color: "blue" },
      9: { label: "Liberado", color: "green" },
      10: { label: "Preparando Remessa (Liberada)", color: "blue" },
    };
    return estados[estado] || { label: `Estado ${estado}`, color: "default" };
  };

  // Helper para verificar se um valor numérico é válido (não é 0, null, undefined, string vazia)
  const temValor = (valor) => {
    if (valor === null || valor === undefined) return false;
    if (typeof valor === 'number') return valor !== 0;
    if (typeof valor === 'string') {
      const trimmed = valor.trim();
      return trimmed !== '' && trimmed !== '0' && trimmed !== '000' && trimmed !== '000000';
    }
    return Boolean(valor);
  };

  const formatarData = (data) => {
    if (!data) return "-";
    const dataStr = data.toString();
    // Formato: DDMMYYYY (ex: 16112025)
    if (dataStr.length === 8) {
      const dia = dataStr.substring(0, 2);
      const mes = dataStr.substring(2, 4);
      const ano = dataStr.substring(4, 8);
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  const mapearFormaIdentificacao = (forma) => {
    const formas = {
      1: "Telefone",
      2: "Email",
      3: "CPF/CNPJ",
      4: "Chave Aleatória",
      5: "Dados Bancários",
    };
    return formas[forma] || `Forma ${forma}`;
  };

  const mapearIndicadorMovimento = (indicador) => {
    if (indicador === "S" || indicador === "s") {
      return { label: "Aceito", color: "green", icon: <CheckCircleOutlined /> };
    } else if (indicador === "N" || indicador === "n") {
      return { label: "Rejeitado", color: "red", icon: <CloseCircleOutlined /> };
    }
    return { label: indicador || "N/A", color: "default", icon: null };
  };

  // Acessa listaTransferencias ou listaPix (dependendo da estrutura retornada)
  const listaTransferencias = dadosConsulta?.listaTransferencias || dadosConsulta?.listaPix || [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: isMobile ? "8px" : "12px"
        }}>
          <Button 
            onClick={onClose} 
            size={isMobile ? "small" : "large"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Fechar
          </Button>
        </div>
      }
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
          <EyeOutlined style={{ marginRight: "0.5rem" }} />
          Consulta Online - Requisição #{numeroRequisicao}
        </span>
      }
      width={isMobile ? "95vw" : 1200}
      style={{ maxWidth: isMobile ? "95vw" : 1200 }}
      centered
      destroyOnClose
      maskClosable={!loading}
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
        mask: { zIndex: 1200 },
      }}
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Consultando solicitação online...</Text>
          </div>
        </div>
      )}

      {error && (
        <Alert
          message="Erro na Consulta"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && !error && dadosConsulta && (
        <>
          {/* Seção 1: Resumo Geral */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Resumo da Solicitação
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
                borderBottom: "0.125rem solid #047857",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "16px",
              },
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Número Requisição:
                </Text>
                <br />
                <Text style={{ fontSize: isMobile ? "0.875rem" : "1rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  #{dadosConsulta.numeroRequisicao}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Estado Requisição:
                </Text>
                <br />
                {(() => {
                  const estado = mapearEstadoRequisicao(dadosConsulta.estadoRequisicao);
                  return (
                    <Tag color={estado.color} style={{ fontSize: "0.75rem", padding: "4px 10px", fontWeight: "500", marginTop: "4px" }}>
                      {estado.label}
                    </Tag>
                  );
                })()}
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Quantidade Total:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {dadosConsulta.quantidadeTransferencias || 0} transferência(s)
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Quantidade Válidas:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px", color: "#059669", fontWeight: "600" }}>
                  {dadosConsulta.quantidadeTransferenciasValidas || 0} válida(s)
                </Text>
              </Col>
            </Row>
            <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={12}>
                <div style={{ 
                  backgroundColor: "#f0f9ff", 
                  border: "2px solid #0ea5e9", 
                  borderRadius: "12px", 
                  padding: "16px", 
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)"
                }}>
                  <div style={{ marginBottom: "8px" }}>
                    <DollarOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} />
                  </div>
                  <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                    VALOR TOTAL
                  </Text>
                  <Text style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "block" }}>
                    {formatarValorMonetario(dadosConsulta.valorTransferencias || 0)}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <div style={{ 
                  backgroundColor: "#f0fdf4", 
                  border: "2px solid #22c55e", 
                  borderRadius: "12px", 
                  padding: "16px", 
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
                }}>
                  <div style={{ marginBottom: "8px" }}>
                    <BankOutlined style={{ fontSize: "24px", color: "#22c55e" }} />
                  </div>
                  <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                    VALOR VÁLIDO
                  </Text>
                  <Text style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", display: "block" }}>
                    {formatarValorMonetario(dadosConsulta.valorTransferenciasValidas || 0)}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Seção 2: Detalhes das Transferências */}
          {listaTransferencias && listaTransferencias.length > 0 ? (
            <Card
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Detalhes das Transferências ({listaTransferencias.length})
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
                  borderBottom: "0.125rem solid #047857",
                  color: "#ffffff",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                },
                body: {
                  padding: isMobile ? "12px" : "16px",
                },
              }}
            >
              <div style={{ display: "grid", gap: isMobile ? "12px" : "16px" }}>
                {listaTransferencias.map((transferencia, index) => {
                  const movimento = mapearIndicadorMovimento(transferencia.indicadorMovimentoAceito);
                  const temFormaIdentificacao = temValor(transferencia.formaIdentificacao);
                  const formaIdentificacao = transferencia.formaIdentificacao;
                  const temCPF = temValor(transferencia.cpf) && formatarCPF(transferencia.cpf);
                  const temCNPJ = temValor(transferencia.cnpj) && formatarCNPJ(transferencia.cnpj);
                  const temIdentificacaoAleatoria = temValor(transferencia.identificacaoAleatoria) && 
                                                   transferencia.identificacaoAleatoria !== "000000";
                  const temTelefone = temValor(transferencia.dddTelefone) && temValor(transferencia.telefone);
                  const temEmail = temValor(transferencia.email);
                  
                  // Determina qual valor mostrar baseado na forma de identificação
                  const renderizarValorIdentificacao = () => {
                    if (formaIdentificacao === 1 && temTelefone) {
                      // Telefone
                      return (
                        <>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Telefone:
                          </Text>
                          <br />
                          <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem" }}>
                            {(() => {
                              const dddStr = temValor(transferencia.dddTelefone) ? String(transferencia.dddTelefone).replace(/\D/g, '') : '';
                              const telefoneStr = String(transferencia.telefone).replace(/\D/g, '');
                              const telefoneCompleto = dddStr + telefoneStr;
                              return formatarTelefone(telefoneCompleto);
                            })()}
                          </Text>
                        </>
                      );
                    } else if (formaIdentificacao === 2 && temEmail) {
                      // Email
                      return (
                        <>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Email:
                          </Text>
                          <br />
                          <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem" }}>
                            {transferencia.email}
                          </Text>
                        </>
                      );
                    } else if (formaIdentificacao === 3 && temCPF) {
                      // CPF
                      return (
                        <>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            CPF:
                          </Text>
                          <br />
                          <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem", fontFamily: "monospace" }}>
                            {formatarCPF(transferencia.cpf)}
                          </Text>
                        </>
                      );
                    } else if (formaIdentificacao === 3 && temCNPJ) {
                      // CNPJ
                      return (
                        <>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            CNPJ:
                          </Text>
                          <br />
                          <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem", fontFamily: "monospace" }}>
                            {formatarCNPJ(transferencia.cnpj)}
                          </Text>
                        </>
                      );
                    } else if (formaIdentificacao === 4 && temIdentificacaoAleatoria) {
                      // Chave Aleatória
                      return (
                        <>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Chave Aleatória:
                          </Text>
                          <br />
                          <Text code style={{ fontSize: "0.875rem", marginTop: "4px", display: "block", wordBreak: "break-all" }}>
                            {transferencia.identificacaoAleatoria}
                          </Text>
                        </>
                      );
                    }
                    return null;
                  };

                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: isMobile ? "12px" : "16px",
                      }}
                    >
                      {/* Subseção: Informações Principais */}
                      <Title level={5} style={{ 
                        color: "#059669", 
                        marginBottom: "12px", 
                        marginTop: 0,
                        fontSize: "0.875rem"
                      }}>
                        Transferência #{index + 1}
                      </Title>
                      <Divider style={{ margin: "0 0 12px 0", borderColor: "#e8e8e8" }} />
                      
                      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                        {/* Primeira linha - Informações principais em destaque */}
                        <Col xs={24} sm={12} md={8}>
                          <div style={{ 
                            padding: "12px", 
                            backgroundColor: "#f0f9ff", 
                            borderRadius: "8px",
                            border: "1px solid #bfdbfe",
                            minHeight: "80px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}>
                            <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>
                              CÓDIGO PAGAMENTO
                            </Text>
                            <div style={{ marginTop: "6px" }}>
                              {temValor(transferencia.identificadorPagamento) ? (
                                <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: "0.875rem", padding: "4px 8px", fontWeight: "600" }}>
                                  {transferencia.identificadorPagamento.toString()}
                                </Tag>
                              ) : (
                                <Text type="secondary">-</Text>
                              )}
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <div style={{ 
                            padding: "12px", 
                            backgroundColor: "#f0fdf4", 
                            borderRadius: "8px",
                            border: "1px solid #bbf7d0",
                            minHeight: "80px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}>
                            <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>
                              VALOR
                            </Text>
                            <Text strong style={{ fontSize: "16px", color: "#059669", marginTop: "6px", display: "block", fontWeight: "700" }}>
                              {formatarValorMonetario(transferencia.valor || 0)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <div style={{ 
                            padding: "12px", 
                            backgroundColor: "#fefce8", 
                            borderRadius: "8px",
                            border: "1px solid #fde68a",
                            minHeight: "80px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}>
                            <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>
                              STATUS MOVIMENTO
                            </Text>
                            <div style={{ marginTop: "6px" }}>
                              <Tag
                                color={movimento.color}
                                icon={movimento.icon}
                                style={{ fontSize: "0.875rem", padding: "4px 10px", fontWeight: "500" }}
                              >
                                {movimento.label}
                              </Tag>
                            </div>
                          </div>
                        </Col>
                        
                        {/* Segunda linha - Data e Descrições */}
                        {(() => {
                          const temData = temValor(transferencia.data);
                          const temDescricaoPagamento = temValor(transferencia.descricaoPagamento);
                          const temDescricaoPagamentoInstantaneo = temValor(transferencia.descricaoPagamentoInstantaneo);
                          
                          if (!temData && !temDescricaoPagamento && !temDescricaoPagamentoInstantaneo) {
                            return null;
                          }
                          
                          return (
                            <>
                              <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                              {temData && (
                                <Col xs={24} sm={12} md={6}>
                                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                    Data:
                                  </Text>
                                  <br />
                                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                                    {formatarData(transferencia.data)}
                                  </Text>
                                </Col>
                              )}
                              {temDescricaoPagamento && (
                                <Col xs={24} sm={12} md={temData ? 9 : 12}>
                                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                    Descrição Pagamento:
                                  </Text>
                                  <br />
                                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                                    {transferencia.descricaoPagamento}
                                  </Text>
                                </Col>
                              )}
                              {temDescricaoPagamentoInstantaneo && (
                                <Col xs={24} sm={12} md={temData && temDescricaoPagamento ? 9 : 12}>
                                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                    Descrição Pagamento Instantâneo:
                                  </Text>
                                  <br />
                                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                                    {transferencia.descricaoPagamentoInstantaneo}
                                  </Text>
                                </Col>
                              )}
                            </>
                          );
                        })()}

                        {/* Terceira linha - Forma de Identificação e Dados do Favorecido */}
                        {temFormaIdentificacao && (
                          <>
                            <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                            <Col xs={24} sm={12} md={6}>
                              <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                <KeyOutlined style={{ marginRight: 4 }} />
                                Forma Identificação:
                              </Text>
                              <br />
                              <Tag color="blue" style={{ marginTop: "4px", fontSize: "0.75rem", padding: "4px 10px", fontWeight: "500" }}>
                                {mapearFormaIdentificacao(transferencia.formaIdentificacao)}
                              </Tag>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              {renderizarValorIdentificacao()}
                            </Col>
                          </>
                        )}

                        {/* Quarta linha - Dados Bancários (se aplicável) */}
                        {(() => {
                          const temAgencia = temValor(transferencia.agencia);
                          const temConta = temValor(transferencia.conta);
                          const temContaPagamento = temValor(transferencia.contaPagamento);
                          
                          if (!temAgencia && !temConta && !temContaPagamento) {
                            return null;
                          }
                          
                          return (
                            <>
                              <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                              {temAgencia && (
                                <Col xs={24} sm={12} md={6}>
                                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                    <BankOutlined style={{ marginRight: 4 }} />
                                    Agência:
                                  </Text>
                                  <br />
                                  <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem" }}>
                                    {transferencia.agencia}
                                  </Text>
                                </Col>
                              )}
                              {temConta && (
                                <Col xs={24} sm={12} md={6}>
                                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                    Conta:
                                  </Text>
                                  <br />
                                  <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem", fontFamily: "monospace" }}>
                                    {transferencia.conta}
                                    {temValor(transferencia.digitoVerificadorConta) && 
                                     transferencia.digitoVerificadorConta !== "000" 
                                      ? `-${transferencia.digitoVerificadorConta}` 
                                      : ""}
                                  </Text>
                                </Col>
                              )}
                              {temContaPagamento && (
                                <Col xs={24} sm={12} md={6}>
                                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                    Conta Pagamento:
                                  </Text>
                                  <br />
                                  <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem" }}>
                                    {transferencia.contaPagamento}
                                  </Text>
                                </Col>
                              )}
                            </>
                          );
                        })()}

                        {/* Quinta linha - Documentos */}
                        {(temValor(transferencia.documentoDebito) || temValor(transferencia.documentoCredito)) && (
                          <>
                            <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                            {temValor(transferencia.documentoDebito) && (
                              <Col xs={24} sm={12} md={6}>
                                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                  <FileTextOutlined style={{ marginRight: 4 }} />
                                  Documento Débito:
                                </Text>
                                <br />
                                <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem", fontFamily: "monospace" }}>
                                  {transferencia.documentoDebito}
                                </Text>
                              </Col>
                            )}
                            {temValor(transferencia.documentoCredito) && (
                              <Col xs={24} sm={12} md={6}>
                                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                                  <FileTextOutlined style={{ marginRight: 4 }} />
                                  Documento Crédito:
                                </Text>
                                <br />
                                <Text style={{ marginTop: "4px", display: "block", fontSize: "0.875rem", fontFamily: "monospace" }}>
                                  {transferencia.documentoCredito}
                                </Text>
                              </Col>
                            )}
                          </>
                        )}

                        {/* Sexta linha - Erros */}
                        {transferencia.erros && transferencia.erros.length > 0 && (
                          <>
                            <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                            <Col xs={24}>
                              <div style={{ 
                                padding: "12px", 
                                backgroundColor: "#fef2f2", 
                                borderRadius: "8px",
                                border: "1px solid #fecaca"
                              }}>
                                <Text strong style={{ color: "#dc2626", fontSize: "0.8125rem", display: "block", marginBottom: "8px" }}>
                                  <CloseCircleOutlined style={{ marginRight: 4 }} />
                                  Erros:
                                </Text>
                                <div style={{ marginTop: "4px" }}>
                                  {transferencia.erros.map((erro, idx) => (
                                    <Tag key={idx} color="red" style={{ marginTop: "4px", marginRight: "4px", fontSize: "0.75rem", padding: "4px 8px" }}>
                                      {erro}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            </Col>
                          </>
                        )}
                      </Row>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card
              style={{
                border: "0.0625rem solid #e8e8e8",
                borderRadius: "0.5rem",
              }}
            >
              <Empty
                description="Nenhuma transferência encontrada"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </>
      )}
    </Modal>
  );
};

ConsultaOnlineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  numeroRequisicao: PropTypes.number,
  contaCorrenteId: PropTypes.number,
};

export default ConsultaOnlineModal;
