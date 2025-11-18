// src/components/pagamentos/ConsultaItemIndividualModal.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Card, Row, Col, Typography, Tag, Space, Spin, Alert, Divider, Button } from "antd";
import { 
  EyeOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  SafetyOutlined,
  KeyOutlined
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency } from "../../utils/formatters";
import { formatarCPF, formatarCNPJ, formatarTelefone } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";

const { Text, Title } = Typography;

const ConsultaItemIndividualModal = ({
  open,
  onClose,
  onAfterClose,
  identificadorPagamento,
  contaCorrenteId,
}) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dadosConsulta, setDadosConsulta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && identificadorPagamento) {
      buscarConsultaIndividual();
    } else {
      setDadosConsulta(null);
      setError(null);
    }
  }, [open, identificadorPagamento]);

  const buscarConsultaIndividual = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (contaCorrenteId) {
        params.append("contaCorrenteId", contaCorrenteId);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/api/pagamentos/pix/${identificadorPagamento}/individual?${queryString}`
        : `/api/pagamentos/pix/${identificadorPagamento}/individual`;

      const response = await axiosInstance.get(url);
      setDadosConsulta(response.data);
    } catch (err) {
      console.error("Erro ao consultar item individual:", err);
      const message =
        err.response?.data?.message ||
        "Erro ao consultar item individual. Verifique os logs para mais detalhes.";
      setError(message);
      // Não mostrar notificação se for erro de item não disponível (já será exibido no Alert)
      if (!message.includes("ainda não está disponível")) {
        showNotification("warning", "Aviso", message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper para verificar se um valor é válido
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
    if (dataStr.length === 8) {
      // Formato ddmmaaaa
      const dia = dataStr.substring(0, 2);
      const mes = dataStr.substring(2, 4);
      const ano = dataStr.substring(4, 8);
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  /**
   * Mapeia o estado do pagamento individual para cores e ícones
   * Usa cores consistentes com o mapeamento de estados do BB (bbEstadoRequisicao.js)
   * 
   * Cores mapeadas:
   * - green: Estados positivos (Consistente, Pago, Debitado)
   * - gold: Estados aguardando (Pendente, Agendado)
   * - blue: Estados em processamento (Aguardando débito)
   * - orange: Estados com problemas parciais (Inconsistente, Devolvido)
   * - red: Estados negativos (Rejeitado, Cancelado, Bloqueado, Vencido)
   * - default: Estados desconhecidos
   */
  const mapearEstadoPagamento = (estado) => {
    // Normalizar o estado para comparação (case-insensitive)
    const estadoNormalizado = estado ? String(estado).trim() : '';
    
    const estados = {
      // Estados positivos - verde (como estado 6, 9, 10 do BB)
      'Consistente': { color: 'green', icon: <CheckCircleOutlined /> },
      'Pago': { color: 'green', icon: <CheckCircleOutlined /> },
      'Debitado': { color: 'green', icon: <CheckCircleOutlined /> },
      
      // Estados aguardando - amarelo/ouro (como estado 1, 4 do BB)
      'Pendente': { color: 'gold', icon: <InfoCircleOutlined /> },
      'Agendado': { color: 'gold', icon: <CalendarOutlined /> },
      
      // Estados em processamento - azul (como estado 5, 8 do BB)
      'Aguardando débito': { color: 'blue', icon: <InfoCircleOutlined /> },
      
      // Estados com problemas parciais - laranja (como estado 2 do BB)
      'Inconsistente': { color: 'orange', icon: <CloseCircleOutlined /> },
      'Devolvido': { color: 'orange', icon: <CloseCircleOutlined /> },
      
      // Estados negativos - vermelho (como estado 3, 7 do BB)
      'Rejeitado': { color: 'red', icon: <CloseCircleOutlined /> },
      'CANCELADO': { color: 'red', icon: <CloseCircleOutlined /> },
      'Cancelado': { color: 'red', icon: <CloseCircleOutlined /> },
      'Bloqueado': { color: 'red', icon: <CloseCircleOutlined /> },
      'Vencido': { color: 'red', icon: <CloseCircleOutlined /> },
    };
    
    // Buscar estado exato ou case-insensitive
    const estadoInfo = estados[estadoNormalizado] || 
                       estados[Object.keys(estados).find(k => k.toLowerCase() === estadoNormalizado.toLowerCase())] ||
                       { color: 'default', icon: <InfoCircleOutlined /> };
    
    return estadoInfo;
  };

  const mapearFormaIdentificacao = (forma) => {
    // Pode vir como número ou string
    const formaNum = typeof forma === 'string' ? parseInt(forma, 10) : forma;
    const formas = {
      1: 'Telefone',
      2: 'Email',
      3: 'CPF/CNPJ',
      4: 'Chave Aleatória',
      5: 'Dados Bancários',
    };
    return formas[formaNum] || (typeof forma === 'string' ? forma : `Forma ${forma}`);
  };

  const mapearTipoConta = (tipo) => {
    const tipos = {
      1: 'Conta Corrente',
      2: 'Conta Pagamento',
      3: 'Conta Poupança',
    };
    return tipos[tipo] || `Tipo ${tipo}`;
  };

  const mapearTipoBeneficiario = (tipo) => {
    return tipo === 1 ? 'Pessoa Física' : tipo === 2 ? 'Pessoa Jurídica' : `Tipo ${tipo}`;
  };

  const handleClose = () => {
    onClose();
    // Chamar callback após fechar para atualizar dados
    if (onAfterClose) {
      setTimeout(() => {
        onAfterClose();
      }, 100);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: isMobile ? "8px" : "12px"
        }}>
          <Button 
            onClick={handleClose} 
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
          <EyeOutlined style={{ marginRight: "0.5rem" }} />
          Consulta Individual do Item de Pagamento
        </span>
      }
      width={isMobile ? '95vw' : 1200}
      style={{ maxWidth: isMobile ? '95vw' : 1200 }}
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
        mask: { zIndex: 1200 }
      }}
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Consultando item individual...</Text>
          </div>
        </div>
      )}

      {error && (
        <Alert
          message={error.includes("ainda não está disponível") ? "Aguarde o processamento" : "Erro na consulta"}
          description={error}
          type={error.includes("ainda não está disponível") ? "warning" : "error"}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && !error && dadosConsulta && (
        <>
          {/* Card de Informações Gerais */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Informações Gerais
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
                  <KeyOutlined style={{ marginRight: 4 }} />
                  Identificador do Pagamento:
                </Text>
                <br />
                <Text style={{ fontSize: isMobile ? "0.875rem" : "1rem", fontWeight: "600", color: "#059669", marginTop: "4px", fontFamily: 'monospace' }}>
                  {dadosConsulta.id || '-'}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  Estado do Pagamento:
                </Text>
                <br />
                <div style={{ marginTop: "4px" }}>
                  {dadosConsulta.estadoPagamento && (() => {
                    const estadoInfo = mapearEstadoPagamento(dadosConsulta.estadoPagamento);
                    return (
                      <Tag color={estadoInfo.color} icon={estadoInfo.icon}>
                        {dadosConsulta.estadoPagamento}
                      </Tag>
                    );
                  })()}
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  Valor do Pagamento:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  R$ {formatCurrency(dadosConsulta.valorPagamento || 0)}
                </Text>
              </Col>
              {temValor(dadosConsulta.dataPagamento) && (
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    Data do Pagamento:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    {formatarData(dadosConsulta.dataPagamento)}
                  </Text>
                </Col>
              )}
              {temValor(dadosConsulta.requisicaoPagamento) && (
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Requisição de Pagamento:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                    {dadosConsulta.requisicaoPagamento}
                  </Text>
                </Col>
              )}
              {temValor(dadosConsulta.numeroDocumentoDebito) && (
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Documento de Débito:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    {dadosConsulta.numeroDocumentoDebito}
                  </Text>
                </Col>
              )}
              {temValor(dadosConsulta.autenticacaoPagamento) && (
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Autenticação do Pagamento:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                    {dadosConsulta.autenticacaoPagamento}
                  </Text>
                </Col>
              )}
              {temValor(dadosConsulta.descricaoPagamento) && (
                <Col xs={24} sm={24}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Descrição do Pagamento:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    {dadosConsulta.descricaoPagamento}
                  </Text>
                </Col>
              )}
              {temValor(dadosConsulta.quantidadeOcorrenciaPix) && (
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Quantidade Ocorrência PIX:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px", color: "#059669", fontWeight: "600" }}>
                    {dadosConsulta.quantidadeOcorrenciaPix || 0} ocorrência(s)
                  </Text>
                </Col>
              )}
            </Row>
          </Card>

          {/* Card de Dados de Débito */}
          {(temValor(dadosConsulta.agenciaDebito) || temValor(dadosConsulta.contaDebito) || temValor(dadosConsulta.numeroCartaoInicio)) && (
            <Card
              title={
                <Space>
                  <BankOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Dados de Débito
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
                {temValor(dadosConsulta.agenciaDebito) && (
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                      Agência:
                    </Text>
                    <br />
                    <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                      {dadosConsulta.agenciaDebito}
                    </Text>
                  </Col>
                )}
                {temValor(dadosConsulta.contaDebito) && (
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                      Conta:
                    </Text>
                    <br />
                    <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                      {dadosConsulta.contaDebito}
                      {temValor(dadosConsulta.digitoContaDebito) && `-${dadosConsulta.digitoContaDebito}`}
                    </Text>
                  </Col>
                )}
                {temValor(dadosConsulta.numeroCartaoInicio) && (
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                      Cartão:
                    </Text>
                    <br />
                    <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                      {dadosConsulta.numeroCartaoInicio}****{dadosConsulta.numeroCartaoFim || '****'}
                    </Text>
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* Card de Detalhes PIX */}
          {dadosConsulta.listaPix && dadosConsulta.listaPix.length > 0 && dadosConsulta.listaPix.map((pix, index) => (
            <Card
              key={index}
              title={
                <Space>
                  <DollarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Detalhes PIX {dadosConsulta.listaPix.length > 1 ? `#${index + 1}` : ''}
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
                {/* Primeira linha: Beneficiário e Conta de Crédito lado a lado */}
                <Col xs={24} sm={24} md={12}>
                  {/* Beneficiário */}
                  <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: 0 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    Beneficiário
                  </Title>
                  <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                    {temValor(pix.nomeBeneficiario) && (
                      <Col xs={24}>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                          <UserOutlined style={{ marginRight: 4 }} />
                          Nome:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                          {pix.nomeBeneficiario}
                        </Text>
                      </Col>
                    )}
                    {temValor(pix.cpfCnpjBeneficiario) && (
                      <Col xs={24}>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                          <IdcardOutlined style={{ marginRight: 4 }} />
                          CPF/CNPJ:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                          {(() => {
                            const cpfCnpjStr = String(pix.cpfCnpjBeneficiario).replace(/\D/g, '');
                            return cpfCnpjStr.length === 11 
                              ? formatarCPF(cpfCnpjStr)
                              : formatarCNPJ(cpfCnpjStr);
                          })()}
                        </Text>
                      </Col>
                    )}
                    {temValor(pix.tipoBeneficiario) && (
                      <Col xs={24}>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                          Tipo:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                          {mapearTipoBeneficiario(pix.tipoBeneficiario)}
                        </Text>
                      </Col>
                    )}
                  </Row>
                </Col>

                {/* Conta de Crédito */}
                {(temValor(pix.agenciaCredito) || temValor(pix.contaCorrenteCredito) || temValor(pix.numeroContaPagamentoCredito)) && (
                  <Col xs={24} sm={24} md={12}>
                    <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: 0 }}>
                      <BankOutlined style={{ marginRight: 8 }} />
                      Conta de Crédito
                    </Title>
                    <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                      {temValor(pix.agenciaCredito) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Agência:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {pix.agenciaCredito}
                          </Text>
                        </Col>
                      )}
                      {temValor(pix.contaCorrenteCredito) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Conta Corrente:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                            {pix.contaCorrenteCredito}
                            {temValor(pix.digitoVerificadorContaCorrente) && `-${pix.digitoVerificadorContaCorrente}`}
                          </Text>
                        </Col>
                      )}
                      {temValor(pix.numeroContaPagamentoCredito) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Conta Pagamento:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                            {pix.numeroContaPagamentoCredito}
                          </Text>
                        </Col>
                      )}
                      {temValor(pix.tipoConta) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Tipo de Conta:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {mapearTipoConta(pix.tipoConta)}
                          </Text>
                        </Col>
                      )}
                    </Row>
                  </Col>
                )}

                {/* Segunda linha: Chave PIX e Outras Informações lado a lado */}
                {(temValor(pix.formaIdentificacao) || temValor(pix.telefone) || temValor(pix.email) || temValor(pix.identificacaoAleatoria)) && (
                  <Col xs={24} sm={24} md={12}>
                    <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "16px" }}>
                      <KeyOutlined style={{ marginRight: 8 }} />
                      Chave PIX
                    </Title>
                    <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                      {temValor(pix.formaIdentificacao) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            <KeyOutlined style={{ marginRight: 4 }} />
                            Forma de Identificação:
                          </Text>
                          <br />
                          <Tag color="blue" style={{ marginTop: "4px" }}>
                            {mapearFormaIdentificacao(pix.formaIdentificacao)}
                          </Tag>
                        </Col>
                      )}
                      {(pix.formaIdentificacao === 1 || pix.formaIdentificacao === '1') && temValor(pix.telefone) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />
                            Telefone:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                            {(() => {
                              // Converte DDD e telefone para string e concatena
                              const dddStr = temValor(pix.dddTelefone) ? String(pix.dddTelefone).replace(/\D/g, '') : '';
                              const telefoneStr = String(pix.telefone).replace(/\D/g, '');
                              const telefoneCompleto = dddStr + telefoneStr;
                              return formatarTelefone(telefoneCompleto);
                            })()}
                          </Text>
                        </Col>
                      )}
                      {(pix.formaIdentificacao === 2 || pix.formaIdentificacao === '2') && temValor(pix.email) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            <MailOutlined style={{ marginRight: 4 }} />
                            Email:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {pix.email}
                          </Text>
                        </Col>
                      )}
                      {(pix.formaIdentificacao === 4 || pix.formaIdentificacao === '4') && temValor(pix.identificacaoAleatoria) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            <SafetyOutlined style={{ marginRight: 4 }} />
                            Chave Aleatória:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px", fontFamily: 'monospace' }}>
                            {pix.identificacaoAleatoria}
                          </Text>
                        </Col>
                      )}
                    </Row>
                  </Col>
                )}

                {/* Outras Informações */}
                {(temValor(pix.documentoCredito) || temValor(pix.descricaoPagamentoInstantaneo) || temValor(pix.textoPix)) && (
                  <Col xs={24} sm={24} md={12}>
                    <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "16px" }}>
                      <InfoCircleOutlined style={{ marginRight: 8 }} />
                      Outras Informações
                    </Title>
                    <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                      {temValor(pix.documentoCredito) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Documento de Crédito:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {pix.documentoCredito}
                          </Text>
                        </Col>
                      )}
                      {temValor(pix.descricaoPagamentoInstantaneo) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Descrição Pagamento Instantâneo:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {pix.descricaoPagamentoInstantaneo}
                          </Text>
                        </Col>
                      )}
                      {temValor(pix.textoPix) && (
                        <Col xs={24}>
                          <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                            Texto PIX:
                          </Text>
                          <br />
                          <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {pix.textoPix}
                          </Text>
                        </Col>
                      )}
                    </Row>
                  </Col>
                )}
              </Row>
            </Card>
          ))}
        </>
      )}
    </Modal>
  );
};

ConsultaItemIndividualModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAfterClose: PropTypes.func,
  identificadorPagamento: PropTypes.string,
  contaCorrenteId: PropTypes.number,
};

export default ConsultaItemIndividualModal;

