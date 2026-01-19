// src/components/pedidos/VisualizarBoletoModal.js

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Tag,
  Table,
  Divider,
  Empty,
  Tooltip,
  Input,
  message,
} from "antd";
import styled from "styled-components";
import {
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  BarcodeOutlined,
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { formatarValorMonetario, formatarCPF, formatarCNPJ } from "../../utils/formatters";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import useResponsive from "../../hooks/useResponsive";
import QRCode from "qrcode";
import moment from "moment";
import { PDFButton } from "../common/buttons";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Styled components para tabela com tema personalizado - SEGUINDO PADRÃO DO SISTEMA
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: 16px;
    font-size: 14px;
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
    cursor: pointer;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background-color: #d1fae5 !important;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    font-size: 14px;
  }

  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .ant-table-cell-fix-left,
  .ant-table-cell-fix-right {
    background-color: inherit !important;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }

  /* LAYOUT FIXO PARA RESOLVER SCROLL HORIZONTAL */
  .ant-table-wrapper {
    width: 100%;
  }

  .ant-table {
    width: 100% !important;
    table-layout: fixed;
  }

  .ant-table-container {
    width: 100% !important;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-table-tbody > tr > td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* CORREÇÃO ESPECÍFICA: Esconder linha de medida */
  .ant-table-measure-row {
    display: none !important;
  }
`;

// Função para obter a cor do status do boleto
const getStatusColor = (status) => {
  const statusColors = {
    ABERTO: "#52c41a",
    PROCESSANDO: "#faad14",
    PAGO: "#10b981",
    VENCIDO: "#ef4444",
    BAIXADO: "#8c8c8c",
    ERRO: "#f5222d",
  };
  return statusColors[status] || "#8c8c8c";
};

// Função para obter o texto do status em português
const getStatusText = (status) => {
  const statusTexts = {
    ABERTO: "Aberto",
    PROCESSANDO: "Processando",
    PAGO: "Pago",
    VENCIDO: "Vencido",
    BAIXADO: "Baixado",
    ERRO: "Erro",
  };
  return statusTexts[status] || status;
};

// Função para obter o texto do tipo de operação do log
const getTipoOperacaoText = (tipo) => {
  const tipos = {
    CRIACAO: "Criação",
    ALTERACAO: "Alteração",
    BAIXA: "Baixa",
    PAGAMENTO_WEBHOOK: "Pagamento via Webhook",
    PAGAMENTO_MANUAL: "Pagamento Manual",
    ERRO_BB: "Erro Banco do Brasil",
  };
  return tipos[tipo] || tipo;
};

const VisualizarBoletoModal = ({ open, onClose, boleto }) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  // Estados
  const [boletoCompleto, setBoletoCompleto] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [loadingQRCode, setLoadingQRCode] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const qrCodeCanvasRef = useRef(null);

  // Usar dados do boleto passado via prop (já vem completo do backend)
  useEffect(() => {
    if (open && boleto) {
      // O boleto já vem completo do endpoint listarBoletosPorPedido
      console.log('🔍 [VisualizarBoletoModal] Dados do boleto recebidos:', {
        id: boleto.id,
        usuarioCriacao: boleto.usuarioCriacao,
        usuarioAlteracao: boleto.usuarioAlteracao,
        usuarioBaixa: boleto.usuarioBaixa,
        usuarioPagamento: boleto.usuarioPagamento,
        completo: JSON.stringify(boleto).substring(0, 200) + '...'
      });
      setBoletoCompleto(boleto);
    } else {
      setBoletoCompleto(null);
      setQrCodeDataUrl(null);
    }
  }, [open, boleto]);

  // Gerar QR Code quando urlPix estiver disponível
  useEffect(() => {
    if (boletoCompleto?.urlPix) {
      generateQRCode(boletoCompleto.urlPix);
    } else {
      setQrCodeDataUrl(null);
    }
  }, [boletoCompleto?.urlPix]);

  const generateQRCode = async (urlPix) => {
    if (!urlPix) return;

    try {
      setLoadingQRCode(true);
      const dataUrl = await QRCode.toDataURL(urlPix, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      showNotification("error", "Erro", "Erro ao gerar QR Code");
    } finally {
      setLoadingQRCode(false);
    }
  };

  const handleCopiarUrlPix = () => {
    if (!boletoCompleto?.urlPix) return;

    navigator.clipboard.writeText(boletoCompleto.urlPix).then(() => {
      message.success("URL PIX copiada para área de transferência!");
    });
  };

  // Função para formatar datas
  const formatarData = (data) => {
    if (!data) return "-";
    return moment(data).format("DD/MM/YYYY");
  };

  // Função para formatar data e hora
  const formatarDataHora = (data) => {
    if (!data) return "-";
    return moment(data).format("DD/MM/YYYY HH:mm");
  };

  // Função para formatar CPF/CNPJ automaticamente baseado no tamanho
  const formatarCPFCNPJ = (numeroInscricao) => {
    if (!numeroInscricao) return "-";
    
    // Remove todos os caracteres não numéricos para verificar o tamanho
    const numeros = numeroInscricao.replace(/\D/g, '');
    
    // CPF tem 11 dígitos, CNPJ tem 14 dígitos
    if (numeros.length === 11) {
      return formatarCPF(numeros);
    } else if (numeros.length === 14) {
      return formatarCNPJ(numeros);
    }
    
    // Se não for CPF nem CNPJ, retorna o valor original
    return numeroInscricao;
  };

  // Função para gerar PDF do boleto
  const handleGerarPdf = async () => {
    if (!boletoCompleto?.id) {
      showNotification("error", "Erro", "Boleto não encontrado para gerar PDF.");
      return;
    }

    try {
      setLoadingPDF(true);
      
      // Fazer requisição para o endpoint de PDF
      const response = await axiosInstance.get(`/api/pdf/boleto/${boletoCompleto.id}`, {
        responseType: 'blob',
        transformResponse: [(data) => data], // Não transforma a resposta
      });

      // Extrair nome do arquivo do header Content-Disposition do backend
      let nomeArquivo = `boleto-${boletoCompleto.id}-${boletoCompleto.nossoNumero}.pdf`; // Fallback
      
      // Tentar diferentes formas de acessar o header
      const contentDisposition = 
        response.headers['content-disposition'] || 
        response.headers['Content-Disposition'];
      
      if (contentDisposition) {
        // Primeiro tenta o formato RFC 5987 (filename*=UTF-8''...)
        let match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (match && match[1]) {
          nomeArquivo = decodeURIComponent(match[1]);
        } else {
          // Fallback para o formato padrão (filename="...")
          match = contentDisposition.match(/filename="([^"]+)"/);
          if (!match) {
            match = contentDisposition.match(/filename=([^;]+)/);
          }
          if (match && match[1]) {
            nomeArquivo = match[1].replace(/['"]/g, '').trim();
          }
        }
      }

      // Criar blob do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento <a> para download
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
      
      showNotification("success", "PDF Gerado", "O PDF do boleto foi gerado e baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      
      // Tentar extrair mensagem de erro do response
      let errorMessage = "Erro ao gerar PDF do boleto.";
      
      if (error.response?.status === 404) {
        errorMessage = "Boleto não encontrado.";
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Por favor, faça login novamente.";
      } else if (error.response?.data) {
        // Se o erro vier como blob, tentar converter para texto
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir parsear, usar mensagem padrão
        }
      }
      
      showNotification("error", "Erro ao Gerar PDF", errorMessage);
    } finally {
      setLoadingPDF(false);
    }
  };

  // Colunas da tabela de histórico
  const historicoColumns = [
    {
      title: "Data/Hora",
      key: "createdAt",
      width: 150,
      render: (_, record) => (
        <Text style={{ fontSize: "0.875rem" }}>
          {formatarDataHora(record.createdAt)}
        </Text>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "tipoOperacao",
      key: "tipoOperacao",
      width: 150,
      render: (tipo) => (
        <Tag color={tipo === "ERRO_BB" ? "red" : "blue"}>
          {getTipoOperacaoText(tipo)}
        </Tag>
      ),
    },
    {
      title: "Descrição",
      dataIndex: "descricaoOperacao",
      key: "descricaoOperacao",
      width: 250,
      ellipsis: true,
      render: (descricao) => (
        <Tooltip title={descricao}>
          <Text style={{ fontSize: "0.875rem" }}>{descricao}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Usuário",
      key: "usuario",
      width: 150,
      render: (_, record) => (
        <Text style={{ fontSize: "0.875rem" }}>
          {record.usuario?.nome || "-"}
        </Text>
      ),
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 120,
      render: (ip) => (
        <Text style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          {ip || "-"}
        </Text>
      ),
    },
    {
      title: "Detalhes",
      key: "detalhes",
      width: 100,
      render: (_, record) => {
        const temDetalhes =
          record.dadosAntes ||
          record.dadosDepois ||
          record.mensagemErro;
        if (!temDetalhes) return <Text type="secondary">-</Text>;

        return (
          <Tooltip
            title={
              <div style={{ maxWidth: 400 }}>
                {record.mensagemErro && (
                  <div>
                    <strong>Erro:</strong> {record.mensagemErro}
                  </div>
                )}
                {record.dadosAntes && (
                  <div>
                    <strong>Antes:</strong>
                    <pre style={{ fontSize: "0.75rem", marginTop: 4 }}>
                      {JSON.stringify(record.dadosAntes, null, 2)}
                    </pre>
                  </div>
                )}
                {record.dadosDepois && (
                  <div>
                    <strong>Depois:</strong>
                    <pre style={{ fontSize: "0.75rem", marginTop: 4 }}>
                      {JSON.stringify(record.dadosDepois, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            }
            placement="left"
          >
            <Button type="link" icon={<InfoCircleOutlined />} size="small">
              Ver
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  if (!open) return null;

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
          <BarcodeOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? "Boleto" : "Visualizar Boleto"}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            flexWrap: isMobile ? "wrap" : "nowrap",
          }}
        >
          <PDFButton
            onClick={handleGerarPdf}
            loading={loadingPDF}
            disabled={loadingPDF || !boletoCompleto?.id}
            size={isMobile ? "small" : "large"}
            tooltip="Exportar boleto para PDF"
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
              fontSize: isMobile ? "0.75rem" : undefined,
            }}
          >
            Gerar PDF
          </PDFButton>
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
      width={isMobile ? "95vw" : "90%"}
      style={{ maxWidth: isMobile ? "95vw" : "75rem" }}
      centered
      destroyOnClose
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
      {!boletoCompleto ? (
        <Empty description="Dados do boleto não disponíveis" />
      ) : (
        <>
          {/* Dados Básicos do Boleto */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#ffffff" }} />
                <span
                  style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                  }}
                >
                  Dados Básicos do Boleto
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
              body: { padding: isMobile ? "12px" : "16px" },
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Nosso Número:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    fontWeight: "600",
                    fontFamily: "monospace",
                    color: "#059669",
                    marginTop: "4px",
                  }}
                >
                  {boletoCompleto.nossoNumero}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Status:
                </Text>
                <br />
                <Tag
                  color={getStatusColor(boletoCompleto.statusBoleto)}
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 10px",
                    fontWeight: "500",
                    marginTop: "4px",
                  }}
                >
                  {getStatusText(boletoCompleto.statusBoleto)}
                </Tag>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Valor:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    fontWeight: "700",
                    color: "#059669",
                    marginTop: "4px",
                  }}
                >
                  {formatarValorMonetario(boletoCompleto.valorOriginal)}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Vencimento:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {formatarData(boletoCompleto.dataVencimento)}
                </Text>
              </Col>
            </Row>
            <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Emissão:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {formatarData(boletoCompleto.dataEmissao)}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Pagamento:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {boletoCompleto.dataPagamento
                    ? formatarData(boletoCompleto.dataPagamento)
                    : "-"}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Baixa:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {boletoCompleto.dataBaixa
                    ? formatarData(boletoCompleto.dataBaixa)
                    : "-"}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Seu Número:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    marginTop: "4px",
                  }}
                >
                  {boletoCompleto.numeroTituloBeneficiario}
                </Text>
              </Col>
            </Row>
          </Card>

          {/* Informações do Pagador */}
          {boletoCompleto.pagadorNome && (
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: "#ffffff" }} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Informações do Pagador
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
                body: { padding: isMobile ? "12px" : "16px" },
              }}
            >
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Nome:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    {boletoCompleto.pagadorNome}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    CPF/CNPJ:
                  </Text>
                  <br />
                  <Text
                    style={{
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                      marginTop: "4px",
                    }}
                  >
                    {formatarCPFCNPJ(boletoCompleto.pagadorNumeroInscricao)}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Telefone:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    {boletoCompleto.pagadorTelefone || "-"}
                  </Text>
                </Col>
              </Row>
              {boletoCompleto.pagadorEndereco && (
                <>
                  <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                    <Col xs={24}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                        Endereço:
                      </Text>
                      <br />
                      <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                        {boletoCompleto.pagadorEndereco}
                        {boletoCompleto.pagadorBairro &&
                          `, ${boletoCompleto.pagadorBairro}`}
                        {boletoCompleto.pagadorCidade &&
                          ` - ${boletoCompleto.pagadorCidade}/${boletoCompleto.pagadorUf}`}
                        {boletoCompleto.pagadorCep && ` - CEP: ${boletoCompleto.pagadorCep}`}
                      </Text>
                    </Col>
                    {boletoCompleto.pagadorEmail && (
                      <Col xs={24}>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                          Email:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                          {boletoCompleto.pagadorEmail}
                        </Text>
                      </Col>
                    )}
                  </Row>
                </>
              )}
            </Card>
          )}

          {/* Dados Bancários */}
          <Card
            title={
              <Space>
                <BankOutlined style={{ color: "#ffffff" }} />
                <span
                  style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                  }}
                >
                  Dados Bancários
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
              body: { padding: isMobile ? "12px" : "16px" },
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Convênio:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    marginTop: "4px",
                  }}
                >
                  {boletoCompleto.numeroConvenio}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Carteira:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {boletoCompleto.numeroCarteira}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Variação:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {boletoCompleto.numeroVariacaoCarteira}
                </Text>
              </Col>
            </Row>
            <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Linha Digitável:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    fontFamily: "monospace",
                    fontWeight: "600",
                    marginTop: "4px",
                    letterSpacing: "2px",
                  }}
                >
                  {boletoCompleto.linhaDigitavel}
                </Text>
              </Col>
              <Col xs={24}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  Código de Barras:
                </Text>
                <br />
                <Text
                  style={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    fontFamily: "monospace",
                    fontWeight: "600",
                    marginTop: "4px",
                    letterSpacing: "1px",
                  }}
                >
                  {boletoCompleto.codigoBarras}
                </Text>
              </Col>
            </Row>
          </Card>

          {/* PIX - QR Code */}
          {boletoCompleto.urlPix && (
            <Card
              title={
                <Space>
                  <QrcodeOutlined style={{ color: "#ffffff" }} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    PIX - QR Code
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
                body: { padding: isMobile ? "12px" : "16px" },
              }}
            >
              <Row gutter={[isMobile ? 16 : 24, 16]} align="top">
                {/* QR Code - Lado Esquerdo */}
                <Col xs={24} sm={24} md={10} style={{ textAlign: "center" }}>
                  {loadingQRCode ? (
                    <div
                      style={{
                        padding: "40px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text type="secondary">Gerando QR Code...</Text>
                    </div>
                  ) : qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code PIX"
                      style={{
                        width: "100%",
                        maxWidth: isMobile ? "250px" : "300px",
                        height: "auto",
                        border: "1px solid #e8e8e8",
                        borderRadius: "8px",
                        padding: "12px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  ) : (
                    <Empty description="QR Code não disponível" />
                  )}
                </Col>
                
                {/* Informações PIX - Lado Direito */}
                <Col xs={24} sm={24} md={14}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {/* URL PIX */}
                    <div>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block", marginBottom: "8px" }}>
                        URL PIX (Copia e Cola):
                      </Text>
                      <div style={{ display: "flex", gap: "0px", width: "100%" }}>
                        <TextArea
                          value={boletoCompleto.urlPix || ""}
                          readOnly
                          autoSize={{ minRows: 4, maxRows: 7 }}
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            resize: "none",
                            flex: 1,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        />
                        <Button
                          type="primary"
                          icon={<CopyOutlined />}
                          onClick={handleCopiarUrlPix}
                          style={{
                            backgroundColor: "#059669",
                            borderColor: "#059669",
                            height: "auto",
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isMobile ? "" : "Copiar"}
                        </Button>
                      </div>
                    </div>

                    {/* TxID */}
                    {boletoCompleto.txidPix && (
                      <div>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block", marginBottom: "4px" }}>
                          TxID:
                        </Text>
                        <Text
                          style={{
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
                            backgroundColor: "#f5f5f5",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            display: "block",
                            wordBreak: "break-all",
                          }}
                        >
                          {boletoCompleto.txidPix}
                        </Text>
                      </div>
                    )}

                    {/* QR Code URL (se diferente de urlPix) */}
                    {boletoCompleto.qrCodePix && boletoCompleto.qrCodePix !== boletoCompleto.urlPix && (
                      <div>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block", marginBottom: "4px" }}>
                          QR Code URL (JSON):
                        </Text>
                        <Text
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            backgroundColor: "#f5f5f5",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            display: "block",
                            wordBreak: "break-all",
                            maxHeight: "100px",
                            overflowY: "auto",
                          }}
                        >
                          {typeof boletoCompleto.qrCodePix === 'string' 
                            ? boletoCompleto.qrCodePix 
                            : JSON.stringify(boletoCompleto.qrCodePix, null, 2)}
                        </Text>
                      </div>
                    )}

                    {/* Informações de Webhook */}
                    {boletoCompleto.atualizadoPorWebhook && (
                      <div>
                        <Tag color="blue" style={{ marginBottom: "4px" }}>
                          <InfoCircleOutlined style={{ marginRight: 4 }} />
                          Atualizado via Webhook
                        </Tag>
                        {boletoCompleto.dataWebhookPagamento && (
                          <div style={{ marginTop: "4px" }}>
                            <Text style={{ fontSize: "0.75rem", color: "#666" }}>
                              Data: {formatarDataHora(boletoCompleto.dataWebhookPagamento)}
                            </Text>
                          </div>
                        )}
                        {boletoCompleto.ipAddressWebhook && (
                          <div style={{ marginTop: "2px" }}>
                            <Text style={{ fontSize: "0.75rem", color: "#666", fontFamily: "monospace" }}>
                              IP: {boletoCompleto.ipAddressWebhook}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          {/* Histórico de Alterações */}
          {boletoCompleto.logs && boletoCompleto.logs.length > 0 && (
            <Card
              title={
                <Space>
                  <HistoryOutlined style={{ color: "#ffffff" }} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Histórico de Alterações
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
                body: { padding: isMobile ? "8px" : "12px 16px" },
              }}
            >
              <StyledTable
                columns={historicoColumns}
                dataSource={boletoCompleto.logs.sort(
                  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )}
                rowKey="id"
                pagination={false}
                size="middle"
                bordered={true}
                scroll={{ x: isMobile ? 800 : undefined }}
              />
            </Card>
          )}

          {/* Informações de Usuários - Sempre exibir se houver usuarioCriacao (obrigatório) */}
          {boletoCompleto.usuarioCriacao && (
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: "#ffffff" }} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Usuários Responsáveis
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
                body: { padding: isMobile ? "12px" : "16px" },
              }}
            >
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                <Col xs={24} sm={12} md={6}>
                  <div style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "12px",
                  }}>
                    <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block" }}>
                      <UserOutlined style={{ marginRight: 4 }} />
                      Criado por:
                    </Text>
                    <Text style={{ fontSize: "0.875rem", marginTop: "4px", display: "block", fontWeight: "600" }}>
                      {boletoCompleto.usuarioCriacao?.nome || "-"}
                    </Text>
                    {boletoCompleto.usuarioCriacao?.email && (
                      <Text style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>
                        {boletoCompleto.usuarioCriacao.email}
                      </Text>
                    )}
                  </div>
                </Col>
                {boletoCompleto.usuarioAlteracao && (
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "12px",
                    }}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block" }}>
                        <EditOutlined style={{ marginRight: 4 }} />
                        Alterado por:
                      </Text>
                      <Text style={{ fontSize: "0.875rem", marginTop: "4px", display: "block", fontWeight: "600" }}>
                        {boletoCompleto.usuarioAlteracao.nome}
                      </Text>
                      {boletoCompleto.usuarioAlteracao.email && (
                        <Text style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>
                          {boletoCompleto.usuarioAlteracao.email}
                        </Text>
                      )}
                    </div>
                  </Col>
                )}
                {boletoCompleto.usuarioBaixa && (
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "12px",
                    }}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block" }}>
                        <DeleteOutlined style={{ marginRight: 4 }} />
                        Baixado por:
                      </Text>
                      <Text style={{ fontSize: "0.875rem", marginTop: "4px", display: "block", fontWeight: "600" }}>
                        {boletoCompleto.usuarioBaixa.nome}
                      </Text>
                      {boletoCompleto.usuarioBaixa.email && (
                        <Text style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>
                          {boletoCompleto.usuarioBaixa.email}
                        </Text>
                      )}
                    </div>
                  </Col>
                )}
                {boletoCompleto.usuarioPagamento && (
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "12px",
                    }}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem", display: "block" }}>
                        <CheckCircleOutlined style={{ marginRight: 4 }} />
                        Pagamento por:
                      </Text>
                      <Text style={{ fontSize: "0.875rem", marginTop: "4px", display: "block", fontWeight: "600" }}>
                        {boletoCompleto.usuarioPagamento.nome}
                      </Text>
                      {boletoCompleto.usuarioPagamento.email && (
                        <Text style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>
                          {boletoCompleto.usuarioPagamento.email}
                        </Text>
                      )}
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          )}
        </>
      )}
    </Modal>
  );
};

export default VisualizarBoletoModal;
