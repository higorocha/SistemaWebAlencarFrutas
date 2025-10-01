// src/components/dashboard/PagamentosEfetuadosModal.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Spin,
  Alert,
  Divider,
  Tooltip,
  Empty
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  AppleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  HistoryOutlined
} from "@ant-design/icons";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";

const { Title, Text } = Typography;

// Styled component para o spinner com animação
const SpinnerContainer = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Styled component removido - usando cor padrão igual ao PagamentosPendentesModal

const PagamentosEfetuadosModal = ({
  open,
  onClose,
  turmaId,
  turmaNome
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(null);

  useEffect(() => {
    if (open && turmaId) {
      fetchDados();
    }
  }, [open, turmaId]);

  useEffect(() => {
    if (!open) {
      // Limpar dados quando modal fechar
      setDados(null);
    }
  }, [open]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/turma-colheita/${turmaId}/pagamentos-efetuados`);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showNotification('error', 'Erro', 'Erro ao carregar pagamentos efetuados');
    } finally {
      setLoading(false);
    }
  };

  // Função para mapear nomes de frutas aos ícones disponíveis
  const getFrutaIcon = (nomeFruta) => {
    if (!nomeFruta) return <AppleOutlined style={{ color: '#fa8c16' }} />;
    
    const nome = nomeFruta.toLowerCase();
    
    // Mapeamento de frutas para ícones
    const iconMap = {
      'banana': '/icons/banana.svg',
      'maçã': '/icons/apple.svg',
      'maca': '/icons/apple.svg',
      'melancia': '/icons/melancia.svg',
      'tomate': '/icons/tomate.svg',
      'coco': '/icons/coconut1.svg',
      'coco1': '/icons/coconut1.svg',
      'coco2': '/icons/coconut2.svg',
      'uva': '/icons/uvas.svg',
      'uvas': '/icons/uvas.svg',
      'cacau': '/icons/cacao.svg',
      'cacau': '/icons/cacao.svg',
      'cenoura': '/icons/cenoura.svg',
      'milho': '/icons/milho.svg'
    };

    // Busca por correspondência exata ou parcial
    for (const [fruta, iconPath] of Object.entries(iconMap)) {
      if (nome.includes(fruta) || fruta.includes(nome)) {
        return <img src={iconPath} alt={nomeFruta} style={{ width: '20px', height: '20px' }} />;
      }
    }

    // Ícone padrão se não encontrar correspondência
    return <AppleOutlined style={{ color: '#fa8c16' }} />;
  };

  const colunas = [
    {
      title: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      key: 'status',
      width: 60,
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
        </div>
      ),
    },
    {
      title: 'Pedido',
      dataIndex: 'pedidoNumero',
      key: 'pedidoNumero',
      width: 140,
      render: (numero) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {numero}
        </Tag>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Fruta',
      dataIndex: 'fruta',
      key: 'fruta',
      width: 180,
      render: (nome) => (
        <Space>
          {getFrutaIcon(nome)}
          <span style={{ fontWeight: '500' }}>{nome}</span>
        </Space>
      ),
    },
    {
      title: 'Quantidade',
      key: 'quantidade',
      width: 130,
      render: (_, record) => (
        <Text strong>
          {record.quantidadeColhida.toLocaleString('pt-BR')} {record.unidadeMedida}
        </Text>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valorColheita',
      key: 'valorColheita',
      width: 130,
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: 'Data Colheita',
      dataIndex: 'dataColheita',
      key: 'dataColheita',
      width: 140,
      render: (data) => (
        data ? new Date(data).toLocaleDateString('pt-BR') : '-'
      ),
    },
    {
      title: 'Data Pagamento',
      dataIndex: 'dataPagamento',
      key: 'dataPagamento',
      width: 140,
      render: (data) => (
        data ? new Date(data).toLocaleDateString('pt-BR') : '-'
      ),
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      key: 'observacoes',
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
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          Pagamentos Efetuados - {turmaNome}
        </span>
      }
      open={open}
      onCancel={onClose}
      width={isMobile ? '95vw' : 1400}
      footer={null}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      <div style={{ 
        position: 'relative',
        minHeight: loading ? '400px' : 'auto'
      }}>
        {/* Overlay de Loading */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: '8px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <SpinnerContainer />
              <div style={{
                color: '#059669',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Carregando pagamentos efetuados...
              </div>
            </div>
          </div>
        )}

        {dados ? (
        <div>
          {/* Informações da Turma */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Turma" : "Informações da Turma"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                color: "#ffffff",
                borderRadius: "8px 8px 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >
            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Total Pago" : "Total Pago"}
                  value={dados.resumo.totalPago}
                  prefix={<DollarOutlined />}
                  formatter={value => formatCurrency(value)}
                  valueStyle={{
                    color: '#059669',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Colheitas" : "Colheitas Pagas"}
                  value={dados.resumo.quantidadeColheitas}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{
                    color: '#059669',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Pedidos"
                  value={dados.resumo.quantidadePedidos}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{
                    color: '#1890ff',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Frutas"
                  value={dados.resumo.quantidadeFrutas}
                  prefix={<AppleOutlined style={{ color: '#059669' }} />}
                  valueStyle={{
                    color: '#059669',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
            </Row>

            {dados.turma.chavePix && (
              <div style={{ marginTop: '16px' }}>
                <Alert
                  message={
                    <Space>
                      <CreditCardOutlined />
                      <strong>Chave PIX:</strong>
                      <Text code>{dados.turma.chavePix}</Text>
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                />
              </div>
            )}
          </Card>

          {/* Tabela de Colheitas Pagas */}
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Colheitas Pagas" : "Detalhes das Colheitas Pagas"}
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                color: "#ffffff",
                borderRadius: "8px 8px 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { padding: isMobile ? "12px" : "16px" }
            }}
          >
            {dados.colheitas && dados.colheitas.length > 0 ? (
              <>
                {dados.colheitas.map((pagamento, index) => (
                  <div key={index} style={{ marginBottom: index < dados.colheitas.length - 1 ? '24px' : '0' }}>
                    {/* Header do Pagamento */}
                    <div style={{
                      backgroundColor: '#f6ffed',
                      padding: isMobile ? '12px' : '16px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      border: '1px solid #b7eb8f'
                    }}>
                      <Row gutter={isMobile ? [8, 8] : [16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HistoryOutlined style={{ color: '#059669', fontSize: '16px' }} />
                            <div>
                              <Text strong style={{ color: '#059669', fontSize: isMobile ? '14px' : '16px' }}>
                                Pagamento em {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                              </Text>
                              <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#666' }}>
                                {pagamento.quantidadePedidos} pedido{pagamento.quantidadePedidos > 1 ? 's' : ''} • {pagamento.quantidadeFrutas} fruta{pagamento.quantidadeFrutas > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                            <Text strong style={{ color: '#059669', fontSize: isMobile ? '16px' : '20px' }}>
                              <DollarOutlined style={{ marginRight: '4px' }} />
                              {formatCurrency(pagamento.totalPago)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={24} md={8}>
                          <Tag style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            padding: isMobile ? '4px 8px' : '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#f6ffed',
                            borderColor: '#059669',
                            color: '#059669'
                          }}>
                            ✓ PAGO
                          </Tag>
                        </Col>
                      </Row>
                    </div>

                    {/* Tabela de Detalhes */}
                    <ResponsiveTable
                      columns={colunas}
                      dataSource={pagamento.detalhes}
                      rowKey="id"
                      minWidthMobile={1200}
                      showScrollHint={true}
                      // Sem styled component - usando cor padrão igual ao PagamentosPendentesModal
                    />
                  </div>
                ))}
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhuma colheita paga encontrada"
                style={{ padding: '40px' }}
              />
            )}
          </Card>

          {/* Footer customizado */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}>
            <Button onClick={onClose} size="large">
              Fechar
            </Button>
          </div>
        </div>
        ) : !loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Empty
              description="Nenhum pagamento efetuado encontrado"
              style={{ color: '#8c8c8c' }}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

PagamentosEfetuadosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turmaId: PropTypes.number,
  turmaNome: PropTypes.string,
};

export default PagamentosEfetuadosModal;