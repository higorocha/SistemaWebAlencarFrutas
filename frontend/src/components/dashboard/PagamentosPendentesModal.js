// src/components/dashboard/PagamentosPendentesModal.js

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
  Checkbox,
  Input,
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
  MessageOutlined
} from "@ant-design/icons";
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import { formatCurrency, capitalizeNameShort, capitalizeName } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import { getFruitIcon } from "../../utils/fruitIcons";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Styled components seguindo padrão do sistema - removido, usando ResponsiveTable

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

// Container removido - usando ResponsiveTable component

// Styled component para linha sendo paga (animação de saída)
const LinhaComAnimacao = styled.tr`
  ${props => props.$sendoPago && `
    animation: fadeOutPayment 0.8s ease-in-out;
    background-color: #f6ffed !important;

    @keyframes fadeOutPayment {
      0% { background-color: #ffffff; opacity: 1; transform: scale(1); }
      50% { background-color: #52c41a; opacity: 0.8; transform: scale(1.02); }
      100% { background-color: #f6ffed; opacity: 0.6; transform: scale(0.98); }
    }
  `}

  ${props => props.$comCheckmark && `
    background-color: #f6ffed !important;

    .checkmark-container {
      animation: checkmarkAppear 0.6s ease-in-out;

      @keyframes checkmarkAppear {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
    }
  `}

  ${props => props.$itemPago && `
    background-color: #f6ffed !important;
    border-left: 4px solid #52c41a !important;
    opacity: 0.85;

    td {
      color: #52c41a !important;
      font-weight: 500;
    }

    .ant-tag {
      background-color: #f6ffed !important;
      border-color: #52c41a !important;
      color: #52c41a !important;
    }
  `}
`;

const PagamentosPendentesModal = ({
  open,
  onClose,
  turmaId,
  turmaNome,
  onPagamentosProcessados
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [dados, setDados] = useState(null);
  const [colheitasSelecionadas, setColheitasSelecionadas] = useState([]);
  const [observacoesPagamento, setObservacoesPagamento] = useState('');
  const [itensSendoPagos, setItensSendoPagos] = useState([]);
  const [itensComCheckmark, setItensComCheckmark] = useState([]);
  const [pagamentosProcessados, setPagamentosProcessados] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

  useEffect(() => {
    if (open && turmaId) {
      fetchDados();
    }
  }, [open, turmaId]);

  useEffect(() => {
    if (!open) {
      // Limpar dados quando modal fechar
      setDados(null);
      setColheitasSelecionadas([]);
      setObservacoesPagamento('');
      setItensSendoPagos([]);
      setItensComCheckmark([]);
      setPagamentosProcessados(false);
      setModalConfirmacaoAberto(false);
    }
  }, [open]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/turma-colheita/${turmaId}/pagamentos-pendentes`);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showNotification('error', 'Erro', 'Erro ao carregar dados da turma');
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar modal informando se houve pagamentos processados
  const fecharModal = () => {
    onClose(pagamentosProcessados);
  };

  const handleSelecaoColheita = (colheitaId, selecionada) => {
    // Verificar se o item já foi pago (não deve ser selecionável)
    const item = dados?.colheitas.find(c => c.id === colheitaId);
    if (item?.status === 'PAGO') {
      return; // Não permitir seleção de itens já pagos
    }

    if (selecionada) {
      setColheitasSelecionadas(prev => [...prev, colheitaId]);
    } else {
      setColheitasSelecionadas(prev => prev.filter(id => id !== colheitaId));
    }
  };


  const calcularTotalSelecionado = () => {
    if (!dados) return 0;
    return dados.colheitas
      .filter(c => colheitasSelecionadas.includes(c.id) && c.status !== 'PAGO')
      .reduce((acc, c) => acc + c.valorColheita, 0);
  };

  // Função para calcular total colhido agrupado por unidade de medida
  const calcularTotalColhido = () => {
    if (!dados) return [];
    
    const totaisPorUnidade = {};
    
    dados.colheitas.forEach(colheita => {
      const unidade = colheita.unidadeMedida || 'un';
      if (!totaisPorUnidade[unidade]) {
        totaisPorUnidade[unidade] = 0;
      }
      totaisPorUnidade[unidade] += colheita.quantidadeColhida || 0;
    });
    
    return Object.entries(totaisPorUnidade).map(([unidade, total]) => ({
      unidade,
      total
    }));
  };



  // Função para abrir modal de confirmação
  const abrirModalConfirmacao = () => {
    setModalConfirmacaoAberto(true);
  };

  // Função para processar pagamentos (após confirmação)
  const processarPagamentos = async () => {
    try {
      // Fechar modal de confirmação
      setModalConfirmacaoAberto(false);

      setLoadingPagamento(true);

      // Se nenhuma seleção, pagar todas as colheitas PENDENTES
      const itensDisponiveis = dados.colheitas.filter(c => c.status !== 'PAGO');
      const idsParaPagar = colheitasSelecionadas.length > 0
        ? colheitasSelecionadas
        : itensDisponiveis.map(c => c.id);

      // Marcar itens como sendo pagos (animação de saída)
      setItensSendoPagos(idsParaPagar);

      // Aguardar animação de saída
      await new Promise(resolve => setTimeout(resolve, 200));

      const dadosPagamento = {
        colheitaIds: idsParaPagar,
        observacoes: observacoesPagamento.trim() || undefined
      };

      const response = await axiosInstance.patch(
        `/api/turma-colheita/${turmaId}/processar-pagamentos`,
        dadosPagamento
      );

      // Mostrar checkmark nos itens pagos
      setItensComCheckmark(idsParaPagar);
      setItensSendoPagos([]);

      // Aguardar animação do checkmark
      await new Promise(resolve => setTimeout(resolve, 300));

      // ATUALIZAR DADOS LOCALMENTE - marcar itens como PAGOS em vez de remover
      const colheitasAtualizadas = dados.colheitas.map(colheita => {
        if (idsParaPagar.includes(colheita.id)) {
          return { ...colheita, status: 'PAGO' };
        }
        return { ...colheita, status: colheita.status || 'PENDENTE' };
      });

      // Recalcular totais considerando apenas itens PENDENTES
      const colheitasPendentes = colheitasAtualizadas.filter(colheita => colheita.status === 'PENDENTE');
      const novoValorTotal = colheitasPendentes.reduce((acc, colheita) => acc + (colheita.valorColheita || 0), 0);

      // Atualizar estado local
      setDados(prevDados => ({
        ...prevDados,
        colheitas: colheitasAtualizadas,
        resumo: {
          ...prevDados.resumo,
          valorTotalPendente: novoValorTotal,
          quantidadeColheitas: colheitasPendentes.length
        }
      }));

      const tipoOperacao = colheitasSelecionadas.length > 0 ? 'selecionados' : 'todos';
      showNotification(
        'success',
        'Pagamentos Processados',
        `${response.data.quantidadePagamentos} pagamento(s) ${tipoOperacao} processado(s). Total: ${formatCurrency(response.data.totalPago)}`
      );

      // Marcar que houve pagamentos processados
      setPagamentosProcessados(true);

      // Limpar seleções e estados de animação
      setColheitasSelecionadas([]);
      setObservacoesPagamento('');
      setItensComCheckmark([]);

      // Chamar callback para atualizar dados no componente pai
      if (onPagamentosProcessados) {
        onPagamentosProcessados();
      }

      // Verificar se ainda há pendências após atualização local
      const aindaTemPendencias = colheitasPendentes.length > 0;

      if (!aindaTemPendencias) {
        // Fechar modal automaticamente se não há mais pendências
        setTimeout(() => {
          fecharModal();
          showNotification(
            'success',
            'Todos os Pagamentos Concluídos',
            `Não há mais pendências para ${turmaNome}.`
          );
        }, 400);
      }
      // NÃO chamar callback NUNCA durante o processamento para evitar "piscar"
      // O modal é autossuficiente e gerencia seus próprios dados

    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      // Limpar estados de animação em caso de erro
      setItensSendoPagos([]);
      setItensComCheckmark([]);

      showNotification(
        'error',
        'Erro',
        error.response?.data?.message || 'Erro ao processar pagamentos'
      );
    } finally {
      setLoadingPagamento(false);
    }
  };

  const colunas = [
    {
      title: <CheckCircleOutlined style={{ color: '#059669' }} />,
      key: 'selecao',
      width: 60,
      render: (_, record) => {
        const sendoPago = itensSendoPagos.includes(record.id);
        const comCheckmark = itensComCheckmark.includes(record.id);
        const isPago = record.status === 'PAGO';

        // Se item já foi pago, mostrar checkmark permanente
        if (isPago) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            </div>
          );
        }

        // Se está sendo processado, mostrar checkmark animado
        if (comCheckmark) {
          return (
            <div className="checkmark-container">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            </div>
          );
        }

        // Se está sendo pago, mostrar spinner
        if (sendoPago) {
          return (
            <SpinnerContainer style={{
              width: '18px',
              height: '18px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #059669'
            }} />
          );
        }

        // Se está pendente, mostrar checkbox
        return (
          <Checkbox
            checked={colheitasSelecionadas.includes(record.id)}
            onChange={(e) => handleSelecaoColheita(record.id, e.target.checked)}
            disabled={loadingPagamento}
          />
        );
      },
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
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 200,
      ellipsis: true,
      render: (nome) => capitalizeNameShort(nome || ''),
    },
    {
      title: 'Fruta',
      dataIndex: ['fruta', 'nome'],
      key: 'fruta',
      width: 180,
      render: (nome) => (
        <Space>
                    {getFruitIcon(nome, { width: 20, height: 20 })}
          <span style={{ fontWeight: '500' }}>{capitalizeName(nome || '')}</span>
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        if (status === 'PAGO') {
          return (
            <Tag color="success" style={{ fontWeight: '600', borderRadius: '12px' }}>
              ✓ PAGO
            </Tag>
          );
        }
        return (
          <Tag color="warning" style={{ fontWeight: '600', borderRadius: '12px' }}>
            ⏳ PENDENTE
          </Tag>
        );
      },
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
          <DollarOutlined style={{ marginRight: 8 }} />
          Pagamentos Pendentes - {capitalizeName(turmaNome || '')}
        </span>
      }
      open={open}
      onCancel={fecharModal}
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
        {(loading || loadingPagamento) && (
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
                {loading ? 'Carregando pagamentos pendentes...' : 'Processando pagamentos...'}
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

            {/* Nome da Turma */}
            <div style={{
              marginBottom: isMobile ? '16px' : '20px',
              padding: isMobile ? '8px 0' : '12px 0'
            }}>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                color: '#8c8c8c',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Nome da Turma
              </div>
              <div style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: '8px'
              }}>
                🏢 {capitalizeName(turmaNome || '')}
              </div>
              <Divider style={{ margin: '8px 0' }} />
            </div>

            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Pendente" : "Total Pendente"}
                  value={dados.resumo.totalPendente}
                  prefix={<DollarOutlined />}
                  formatter={value => formatCurrency(value)}
                  valueStyle={{
                    color: '#fa8c16',
                    fontSize: isMobile ? '1rem' : '1.5rem'
                  }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title={isMobile ? "Colheitas" : "Colheitas Pendentes"}
                  value={dados.resumo.quantidadeColheitas}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{
                    color: '#722ed1',
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
                  prefix={<AppleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{
                    color: '#52c41a',
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

          {/* Tabela de Colheitas */}
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#ffffff" }} />
                <span style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px"
                }}>
                  {isMobile ? "Colheitas" : "Colheitas Pendentes"}
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

            {dados.colheitas.length > 0 ? (
              <>
                <ResponsiveTable
                  columns={colunas}
                  dataSource={dados.colheitas}
                  rowKey="id"
                  minWidthMobile={1200}
                  showScrollHint={true}
                  components={{
                    body: {
                      row: ({ children, record, ...props }) => (
                        <LinhaComAnimacao
                          {...props}
                          $sendoPago={itensSendoPagos.includes(record?.id)}
                          $comCheckmark={itensComCheckmark.includes(record?.id)}
                          $itemPago={record?.status === 'PAGO'}
                        >
                          {children}
                        </LinhaComAnimacao>
                      ),
                    },
                  }}
                />

                {/* Área de Pagamento - Sempre visível */}
                <Divider />
                <div style={{
                  backgroundColor: '#f6ffed',
                  padding: isMobile ? '12px' : '16px',
                  borderRadius: '8px'
                }}>
                  <Row gutter={isMobile ? [8, 12] : [16, 16]} align="middle">
                    <Col xs={12} md={6}>
                      <Statistic
                        title={
                          isMobile
                            ? (colheitasSelecionadas.length > 0 ? "Selecionados" : "Total")
                            : (colheitasSelecionadas.length > 0 ? "Itens Selecionados" : "Total de Itens")
                        }
                        value={colheitasSelecionadas.length > 0 ? colheitasSelecionadas.length : dados.colheitas.length}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{
                          color: '#52c41a',
                          fontSize: isMobile ? '1rem' : '1.5rem'
                        }}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title={isMobile ? "Colhido" : "Total Colhido"}
                        value={calcularTotalColhido().map(item => `${item.total.toLocaleString('pt-BR')} ${item.unidade}`).join(', ')}
                        prefix={<AppleOutlined />}
                        valueStyle={{
                          color: '#0ea5e9',
                          fontSize: isMobile ? '1rem' : '1.5rem'
                        }}
                        formatter={(value) => (
                          <div style={{ 
                            fontSize: isMobile ? '1rem' : '1.5rem',
                            color: '#0ea5e9',
                            fontWeight: '600'
                          }}>
                            {calcularTotalColhido().map((item, index) => (
                              <span key={index} style={{ marginRight: '8px' }}>
                                <span style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
                                  {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span style={{ 
                                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                                  color: '#8c8c8c',
                                  marginLeft: '4px',
                                  textTransform: 'uppercase',
                                  fontWeight: 'normal'
                                }}>
                                  {item.unidade}
                                </span>
                                {index < calcularTotalColhido().length - 1 && !isMobile && (
                                  <span style={{ 
                                    color: '#000000',
                                    margin: '0 15px',
                                    fontSize: '1.5rem',
                                    verticalAlign: 'middle',
                                    display: 'inline-block',
                                    lineHeight: '1',
                                    transform: 'translateY(-4px)'
                                  }}>
                                    •
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title={isMobile ? "A Pagar" : "Total a Pagar"}
                        value={colheitasSelecionadas.length > 0 ? calcularTotalSelecionado() : dados.resumo.totalPendente}
                        prefix={<DollarOutlined />}
                        formatter={value => formatCurrency(value)}
                        valueStyle={{
                          color: '#059669',
                          fontSize: isMobile ? '1rem' : '1.25rem'
                        }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <Button
                        type="primary"
                        size={isMobile ? "middle" : "large"}
                        icon={<DollarOutlined />}
                        onClick={abrirModalConfirmacao}
                        loading={loadingPagamento}
                        style={{
                          backgroundColor: '#059669',
                          borderColor: '#059669',
                          width: '100%',
                          marginTop: isMobile ? '8px' : '0'
                        }}
                      >
                        {isMobile
                          ? (colheitasSelecionadas.length > 0 ? 'Pagar Selecionados' : 'Pagar Todos')
                          : (colheitasSelecionadas.length > 0 ? 'Pagar Selecionados' : 'Pagar Todos')
                        }
                      </Button>
                    </Col>
                  </Row>

                  <Row style={{ marginTop: isMobile ? '12px' : '16px' }}>
                    <Col span={24}>
                      <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                        <Space>
                          <MessageOutlined style={{ color: '#059669' }} />
                          <span style={{
                            fontWeight: '700',
                            color: '#333',
                            fontSize: isMobile ? '12px' : '14px'
                          }}>
                            {isMobile ? 'Observações' : 'Observações do Pagamento'}
                          </span>
                        </Space>
                      </div>
                      <TextArea
                        rows={isMobile ? 2 : 3}
                        placeholder={isMobile ? "Observações (opcional)" : "Observações sobre o pagamento (opcional)"}
                        value={observacoesPagamento}
                        onChange={(e) => setObservacoesPagamento(e.target.value)}
                        style={{
                          borderRadius: 6,
                          borderColor: "#d9d9d9",
                          fontSize: isMobile ? '14px' : '16px'
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhuma colheita pendente"
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
            <Button onClick={fecharModal} size="large">
              Fechar
            </Button>
          </div>
        </div>
        ) : !loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Empty
              description="Nenhum dado encontrado"
              style={{ color: '#8c8c8c' }}
            />
          </div>
        ) : null}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmActionModal
        open={modalConfirmacaoAberto}
        onCancel={() => setModalConfirmacaoAberto(false)}
        onConfirm={processarPagamentos}
        title="Confirmar Pagamento"
        confirmText="Confirmar Pagamento"
        cancelText="Cancelar"
        icon={<DollarOutlined />}
        iconColor="#059669"
        customContent={
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ 
              fontSize: "48px", 
              color: "#059669", 
              marginBottom: "16px",
              display: "block"
            }}>
              <DollarOutlined />
            </div>
            <Text style={{ 
              fontSize: "16px", 
              fontWeight: "500", 
              color: "#333",
              lineHeight: "1.5",
              marginBottom: "20px",
              display: "block"
            }}>
              Você está prestes a processar os pagamentos das colheitas selecionadas.
            </Text>
            
            {/* Detalhes da operação */}
            <div style={{
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "16px",
              textAlign: "left"
            }}>
              <Text style={{ fontSize: "14px", fontWeight: "600", color: "#059669", display: "block", marginBottom: "8px" }}>
                📋 Detalhes da Operação:
              </Text>
              <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.6" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>👤 Colhedor:</strong> {turmaNome}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>📦 Total de itens:</strong> {itensComCheckmark.length > 0 ? itensComCheckmark.length : dados?.colheitas?.length || 0}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>💰 Valor total:</strong> R$ {(itensComCheckmark.length > 0 ? calcularTotalSelecionado() : dados?.resumo?.totalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ marginBottom: "0" }}>
                  <strong>ℹ️ Observação:</strong> {itensComCheckmark.length > 0 ? "Apenas itens selecionados serão pagos" : "Todos os itens pendentes serão pagos"}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </Modal>
  );
};

PagamentosPendentesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turmaId: PropTypes.number,
  turmaNome: PropTypes.string,
  onPagamentosProcessados: PropTypes.func,
};

export default PagamentosPendentesModal;