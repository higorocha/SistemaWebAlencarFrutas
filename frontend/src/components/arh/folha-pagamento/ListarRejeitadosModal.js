// src/components/arh/folha-pagamento/ListarRejeitadosModal.js

import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, Typography, Space, Button, Card, Row, Col, Statistic, Empty, Spin, Tooltip } from "antd";
import {
  CloseOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  QrcodeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { capitalizeName, formatarValorMonetario } from "../../../utils/formatters";
import useResponsive from "../../../hooks/useResponsive";
import ResponsiveTable from "../../common/ResponsiveTable";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";

const { Text } = Typography;

const ListarRejeitadosModal = ({ open, onClose, folhaId }) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [rejeitados, setRejeitados] = useState([]);

  // Buscar dados dos rejeitados com informações do PagamentoApiItem
  useEffect(() => {
    if (open && folhaId) {
      buscarRejeitados();
    } else {
      setRejeitados([]);
    }
  }, [open, folhaId]);

  const buscarRejeitados = async () => {
    if (!folhaId) return;

    setLoading(true);
    try {
      // Buscar lançamentos rejeitados com dados do PagamentoApiItem
      const response = await axiosInstance.get(
        `/api/arh/folhas/${folhaId}/lancamentos`,
        {
          params: {
            statusPagamento: "REJEITADO",
            includePagamentoApiItem: true,
          },
        }
      );

      let lancamentosData = [];
      
      if (response?.data) {
        if (Array.isArray(response.data)) {
          lancamentosData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          lancamentosData = response.data.data;
        } else if (response.data.lancamentos && Array.isArray(response.data.lancamentos)) {
          lancamentosData = response.data.lancamentos;
        }
      }

      // Filtrar apenas os rejeitados (caso o filtro do backend não funcione)
      const rejeitadosFiltrados = lancamentosData.filter(
        (l) => l.statusPagamento === "REJEITADO"
      );

      setRejeitados(rejeitadosFiltrados);
    } catch (error) {
      console.error("Erro ao buscar lançamentos rejeitados:", error);
      showNotification("error", "Erro", "Erro ao carregar lançamentos rejeitados");
      setRejeitados([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const valorTotalRejeitado = rejeitados.reduce(
    (sum, l) => sum + Number(l.valorLiquido || 0),
    0
  );

  // Função para obter chave PIX do item
  const obterChavePix = (lancamento) => {
    // Tentar obter do PagamentoApiItem
    if (lancamento?.pagamentoApiItem?.chavePixEnviada) {
      return lancamento.pagamentoApiItem.chavePixEnviada;
    }
    
    // Fallback para outros campos possíveis
    if (lancamento?.pagamentoApiItem?.payloadItemEnviado) {
      const payload = lancamento.pagamentoApiItem.payloadItemEnviado;
      
      // Verificar diferentes formatos de chave PIX
      if (payload.chave) return payload.chave;
      if (payload.cpf) return payload.cpf;
      if (payload.cnpj) return payload.cnpj;
      if (payload.email) return payload.email;
      if (payload.telefone) return payload.telefone;
      if (payload.evp) return payload.evp;
      if (payload.identificacaoAleatoria) return payload.identificacaoAleatoria;
    }
    
    return null;
  };

  // Função para obter responsável da chave PIX
  const obterResponsavelChavePix = (lancamento) => {
    if (lancamento?.pagamentoApiItem?.responsavelChavePixEnviado) {
      return lancamento.pagamentoApiItem.responsavelChavePixEnviado;
    }
    
    // Tentar obter do payload
    if (lancamento?.pagamentoApiItem?.payloadItemEnviado?._responsavelChavePix) {
      return lancamento.pagamentoApiItem.payloadItemEnviado._responsavelChavePix;
    }
    
    return null;
  };

  // Função para formatar chave PIX (mascarar se necessário)
  const formatarChavePix = (chave) => {
    if (!chave) return "—";
    
    // Se for CPF ou CNPJ, mascarar
    const apenasDigitos = chave.replace(/\D/g, "");
    if (apenasDigitos.length === 11) {
      // CPF: 000.000.000-00
      return chave.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (apenasDigitos.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return chave.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    
    // Email, telefone ou EVP - mostrar completo
    return chave;
  };

  const columns = [
    {
      title: "Funcionário",
      dataIndex: ["funcionario", "nome"],
      key: "funcionario",
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#059669", fontSize: "0.75rem" }} />
          <Text strong style={{ color: "#059669", fontSize: "0.875rem" }}>
            {capitalizeName(text || "—")}
          </Text>
        </Space>
      ),
      width: "20%",
    },
    {
      title: "CPF",
      dataIndex: ["funcionario", "cpf"],
      key: "cpf",
      render: (text) => (
        <Text style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          {text || "—"}
        </Text>
      ),
      width: "12%",
    },
    {
      title: "Valor Líquido",
      dataIndex: "valorLiquido",
      key: "valorLiquido",
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#ff4d4f", fontSize: "0.875rem" }}>
          {formatarValorMonetario(value || 0)}
        </Text>
      ),
      width: "12%",
      sorter: (a, b) => (Number(a.valorLiquido) || 0) - (Number(b.valorLiquido) || 0),
    },
    {
      title: "Chave PIX",
      key: "chavePix",
      render: (_, record) => {
        const chavePix = obterChavePix(record);
        const chaveFormatada = formatarChavePix(chavePix);
        
        if (!chavePix) {
          return (
            <Text type="secondary" style={{ fontSize: "0.75rem" }}>
              —
            </Text>
          );
        }

        return (
          <Tooltip title={chavePix} placement="topLeft">
            <Space>
              <QrcodeOutlined style={{ color: "#059669", fontSize: "0.75rem" }} />
              <Text
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  maxWidth: isMobile ? "150px" : "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {chaveFormatada}
              </Text>
            </Space>
          </Tooltip>
        );
      },
      width: "18%",
    },
    {
      title: "Responsável Chave",
      key: "responsavelChavePix",
      render: (_, record) => {
        const responsavel = obterResponsavelChavePix(record);
        
        if (!responsavel) {
          return (
            <Text type="secondary" style={{ fontSize: "0.75rem" }}>
              —
            </Text>
          );
        }

        return (
          <Tooltip title={responsavel} placement="topLeft">
            <Text
              style={{
                fontSize: "0.75rem",
                maxWidth: isMobile ? "120px" : "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {capitalizeName(responsavel)}
            </Text>
          </Tooltip>
        );
      },
      width: "15%",
    },
    {
      title: "Meio de Pagamento",
      dataIndex: "meioPagamento",
      key: "meioPagamento",
      render: (meio) => {
        const colors = {
          PIX_API: "blue",
          PIX: "green",
          ESPECIE: "orange",
        };
        const labels = {
          PIX_API: "PIX - API",
          PIX: "PIX Manual",
          ESPECIE: "Espécie",
        };
        return (
          <Tag
            color={colors[meio] || "default"}
            style={{
              borderRadius: "4px",
              fontWeight: "500",
              fontSize: "0.75rem",
              border: "none",
            }}
          >
            {labels[meio] || meio || "—"}
          </Tag>
        );
      },
      width: "13%",
    },
    {
      title: "Status",
      dataIndex: "statusPagamento",
      key: "statusPagamento",
      render: (status) => (
        <Tag
          color="red"
          icon={<ExclamationCircleOutlined />}
          style={{
            borderRadius: "4px",
            fontWeight: "500",
            fontSize: "0.75rem",
            border: "none",
          }}
        >
          REJEITADO
        </Tag>
      ),
      width: "10%",
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
          <ExclamationCircleOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? "Rejeitados" : "Lançamentos Rejeitados"}
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
      style={{ maxWidth: isMobile ? "95vw" : "90rem" }}
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
      <Spin spinning={loading}>
        {!loading && rejeitados.length === 0 ? (
          <div
            style={{
              padding: isMobile ? 24 : 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: isMobile ? 200 : 260,
            }}
          >
            <Empty
              description="Nenhum lançamento rejeitado encontrado"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            <Card
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: "#ffffff" }} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Resumo de Rejeitados
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
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={12} sm={12} md={12}>
                  <Statistic
                    title={isMobile ? "Quantidade" : "Total de Rejeitados"}
                    value={rejeitados.length}
                    valueStyle={{
                      color: "#ff4d4f",
                      fontSize: isMobile ? "1.125rem" : "1.5rem",
                    }}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} sm={12} md={12}>
                  <Statistic
                    title={isMobile ? "Valor Total" : "Valor Total Rejeitado"}
                    value={formatarValorMonetario(valorTotalRejeitado)}
                    valueStyle={{
                      color: "#ff4d4f",
                      fontSize: isMobile ? "1rem" : "1.25rem",
                    }}
                    prefix={<DollarOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Tabela de Rejeitados */}
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
                    {isMobile ? "Rejeitados" : "Lista de Lançamentos Rejeitados"}
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
              <ResponsiveTable
                columns={columns}
                dataSource={rejeitados}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: isMobile ? 5 : 10,
                  showSizeChanger: !isMobile,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} de ${total} lançamento(s)`,
                  pageSizeOptions: ["10", "20", "50"],
                }}
                minWidthMobile={1200}
                showScrollHint={true}
                size="small"
                bordered={true}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span
                          style={{ color: "#8c8c8c", fontSize: "0.875rem" }}
                        >
                          Nenhum lançamento rejeitado encontrado
                        </span>
                      }
                    />
                  ),
                }}
              />
            </Card>
          </>
        )}
      </Spin>
    </Modal>
  );
};

ListarRejeitadosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  folhaId: PropTypes.number,
};

ListarRejeitadosModal.defaultProps = {
  folhaId: null,
};

export default ListarRejeitadosModal;
