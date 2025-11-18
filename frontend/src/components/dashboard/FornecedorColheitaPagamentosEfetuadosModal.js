// src/components/dashboard/FornecedorColheitaPagamentosEfetuadosModal.js

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
import { formatCurrency, formatarDataBR } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import { PDFButton } from "../common/buttons";

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

const FornecedorColheitaPagamentosEfetuadosModal = ({
  open,
  onClose,
  fornecedorId,
  fornecedorNome,
  dataPagamento
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(null);

  useEffect(() => {
    if (open && fornecedorId) {
      fetchDados();
    }
  }, [open, fornecedorId, dataPagamento]);

  useEffect(() => {
    if (!open) {
      // Limpar dados quando modal fechar
      setDados(null);
    }
  }, [open]);

  // Função para normalizar data (remover hora, manter apenas dia/mês/ano no formato YYYY-MM-DD)
  const normalizarData = (dataInput) => {
    if (!dataInput) return null;
    
    let dataString = dataInput;
    
    // Se for um objeto Date, converter para ISO string
    if (dataInput instanceof Date) {
      dataString = dataInput.toISOString();
    }
    
    // Se for string, pode ser ISO (YYYY-MM-DDTHH:mm:ss.sssZ) ou formato de data (YYYY-MM-DD)
    // Extrair apenas a parte da data (YYYY-MM-DD)
    if (typeof dataString === 'string') {
      // Se tiver 'T', pegar a parte antes do T
      if (dataString.includes('T')) {
        return dataString.split('T')[0];
      }
      // Se tiver espaço, pegar a parte antes do espaço
      if (dataString.includes(' ')) {
        return dataString.split(' ')[0];
      }
      // Se já estiver no formato YYYY-MM-DD, retornar como está
      return dataString;
    }
    
    return null;
  };

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/fornecedores/${fornecedorId}/pagamentos-efetuados`);
      let dadosCompletos = response.data;

      // Se dataPagamento foi fornecido, filtrar apenas os pagamentos daquela data
      if (dataPagamento && dadosCompletos?.colheitas && Array.isArray(dadosCompletos.colheitas) && dadosCompletos.colheitas.length > 0) {
        const dataFiltro = normalizarData(dataPagamento);
        
        if (dataFiltro) {
          // Filtrar colheitas apenas daquela data
          // O backend retorna dataPagamento no formato "YYYY-MM-DD" no objeto agrupado
          const colheitasFiltradas = dadosCompletos.colheitas.filter((pagamento) => {
            // pagamento.dataPagamento já vem como "YYYY-MM-DD" do backend (linha 1168 do service)
            const dataPagamentoNormalizada = normalizarData(pagamento.dataPagamento);
            return dataPagamentoNormalizada === dataFiltro;
          });

          // Se encontrou colheitas filtradas, aplicar o filtro e recalcular resumo
          if (colheitasFiltradas.length > 0) {
            // Recalcular resumo apenas com os pagamentos filtrados
            const resumoFiltrado = {
              totalPago: colheitasFiltradas.reduce((acc, pag) => acc + (pag.totalPago || 0), 0),
              quantidadeColheitas: colheitasFiltradas.reduce((acc, pag) => acc + (pag.detalhes?.length || 0), 0),
              quantidadePedidos: new Set(colheitasFiltradas.flatMap(pag => pag.detalhes?.map(d => d.pedidoNumero) || [])).size,
              quantidadeFrutas: new Set(colheitasFiltradas.flatMap(pag => pag.detalhes?.map(d => d.fruta) || [])).size,
            };

            dadosCompletos = {
              ...dadosCompletos,
              colheitas: colheitasFiltradas,
              resumo: resumoFiltrado,
            };
          } else {
            // Se não encontrou nenhuma colheita, manter estrutura mas com array vazio
            dadosCompletos = {
              ...dadosCompletos,
              colheitas: [],
              resumo: {
                totalPago: 0,
                quantidadeColheitas: 0,
                quantidadePedidos: 0,
                quantidadeFrutas: 0,
              },
            };
          }
        }
      }

      setDados(dadosCompletos);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showNotification('error', 'Erro', 'Erro ao carregar pagamentos efetuados');
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com geração de PF (em desenvolvimento)
  const handleGerarPF = () => {
    showNotification('info', 'Em Desenvolvimento', 'A funcionalidade de gerar PF ainda está em desenvolvimento.');
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
      title: 'Área',
      dataIndex: 'areaNome',
      key: 'areaNome',
      width: 150,
      ellipsis: true,
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
      title: 'Valor Unitário',
      dataIndex: 'valorUnitario',
      key: 'valorUnitario',
      width: 130,
      render: (valor) => (
        valor ? (
          <Text strong style={{ color: '#1890ff' }}>
            R$ {formatCurrency(valor)}
          </Text>
        ) : '-'
      ),
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorColheita',
      key: 'valorColheita',
      width: 130,
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          R$ {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: 'Data Colheita',
      dataIndex: 'dataColheita',
      key: 'dataColheita',
      width: 140,
      render: (data) => (
        data ? formatarDataBR(data) : '-'
      ),
    },
    {
      title: 'Data Pagamento',
      dataIndex: 'dataPagamento',
      key: 'dataPagamento',
      width: 140,
      render: (data) => (
        data ? formatarDataBR(data) : '-'
      ),
    },
    {
      title: 'Forma Pagamento',
      dataIndex: 'formaPagamento',
      key: 'formaPagamento',
      width: 150,
      render: (forma) => (
        forma ? <Tag color="green">{forma}</Tag> : '-'
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
          Pagamentos Efetuados - {fornecedorNome}
        </span>
      }
      open={open}
      onCancel={onClose}
      width={isMobile ? '95vw' : 1800}
      footer={
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          gap: isMobile ? "8px" : "12px",
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <PDFButton
            onClick={handleGerarPF}
            size={isMobile ? "small" : "large"}
            tooltip="Gerar PF (Nota Fiscal)"
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
              fontSize: isMobile ? "0.75rem" : undefined,
            }}
          >
            Gerar PF
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
          {/* Informações do Fornecedor */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Fornecedor" : "Informações do Fornecedor"}
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
                  formatter={value => `R$ ${formatCurrency(value)}`}
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

            {dados.fornecedor.cnpj && (
              <div style={{ marginTop: '16px' }}>
                <Alert
                  message={
                    <Space>
                      <InfoCircleOutlined />
                      <strong>CNPJ:</strong>
                      <Text code>{dados.fornecedor.cnpj}</Text>
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                />
              </div>
            )}
            {dados.fornecedor.cpf && (
              <div style={{ marginTop: '16px' }}>
                <Alert
                  message={
                    <Space>
                      <InfoCircleOutlined />
                      <strong>CPF:</strong>
                      <Text code>{dados.fornecedor.cpf}</Text>
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
                                Pagamento em {formatarDataBR(pagamento.dataPagamento)}
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
                              R$ {formatCurrency(pagamento.totalPago)}
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
                      minWidthMobile={1600}
                      showScrollHint={true}
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

FornecedorColheitaPagamentosEfetuadosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fornecedorId: PropTypes.number,
  fornecedorNome: PropTypes.string,
  dataPagamento: PropTypes.string,
};

export default FornecedorColheitaPagamentosEfetuadosModal;

