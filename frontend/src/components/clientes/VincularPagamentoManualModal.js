// src/components/clientes/VincularPagamentoManualModal.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Card,
  Row,
  Col,
  Radio,
  Space,
  Button,
  Input,
  Tag,
  Alert,
  Typography,
  Empty,
  Divider,
  DatePicker,
} from 'antd';
import {
  LinkOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import { formatCurrency, formatarDataBR, capitalizeName } from '../../utils/formatters';
import useResponsive from '../../hooks/useResponsive';
import moment from 'moment';

const { Text } = Typography;

// Styled component para o card do melhor match (destaque)
const BestMatchCard = styled(Card)`
  border: 2px solid #52c41a !important;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%) !important;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.15) !important;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    background: rgba(82, 196, 26, 0.1);
    border-radius: 0 0 0 100%;
  }

  .ant-card-body {
    padding: 16px !important;
  }
`;

// Styled component para os cards de outros pedidos
const PedidoCard = styled(Card)`
  border: 1px solid #e8e8e8 !important;
  background-color: #ffffff !important;
  transition: all 0.3s ease !important;
  cursor: pointer;

  &:hover {
    border-color: #059669 !important;
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.1) !important;
  }

  &.selected {
    border: 2px solid #059669 !important;
    background-color: #f0fdf4 !important;
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15) !important;
  }

  .ant-card-body {
    padding: 16px !important;
  }
`;

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

const VincularPagamentoManualModal = ({
  open,
  onClose,
  lancamento,
  cliente,
  onVincular,
}) => {
  const { isMobile } = useResponsive();
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState([]);
  const [buscaPedido, setBuscaPedido] = useState('');
  const [dataColheitaFiltro, setDataColheitaFiltro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vinculando, setVinculando] = useState(false);

  // Buscar pedidos do cliente com pagamento pendente
  useEffect(() => {
    if (open && cliente?.id && lancamento?.id) {
      fetchPedidosDisponiveis();
    }
  }, [open, cliente?.id, lancamento?.id]);

  const fetchPedidosDisponiveis = async () => {
    try {
      setLoading(true);

      console.log('🔍 [VINCULAR] Iniciando busca de pedidos...');
      console.log('🔍 [VINCULAR] Cliente ID:', cliente?.id);
      console.log('🔍 [VINCULAR] Lançamento:', lancamento);

      // 🔍 DEBUG: Buscar TODOS os pedidos primeiro para ver os status reais
      const responseDebug = await axiosInstance.get(`/api/pedidos/cliente/${cliente.id}`);
      const todosPedidos = Array.isArray(responseDebug.data) ? responseDebug.data : (responseDebug.data?.data || []);
      console.log('🔍 [DEBUG] TODOS os pedidos do cliente:', todosPedidos);
      console.log('🔍 [DEBUG] Status dos pedidos:', todosPedidos.map(p => ({ numero: p.numeroPedido, status: p.status, valorFinal: p.valorFinal, valorRecebido: p.valorRecebido })));

      // Buscar pedidos com status que permitem pagamento
      const response = await axiosInstance.get(
        `/api/pedidos/cliente/${cliente.id}`,
        {
          params: {
            status: 'PRECIFICACAO_REALIZADA,AGUARDANDO_PAGAMENTO,PAGAMENTO_PARCIAL'
          }
        }
      );

      console.log('✅ [VINCULAR] Resposta da API com filtro:', response.data);

      // Garantir que seja um array
      const pedidosArray = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);

      console.log('📋 [VINCULAR] Pedidos extraídos:', pedidosArray);
      console.log('📋 [VINCULAR] Quantidade de pedidos:', pedidosArray.length);

      // Calcular match de valor para cada pedido
      const pedidosComMatch = pedidosArray.map(pedido => {
        const valorRestante = (pedido.valorFinal || 0) - (pedido.valorRecebido || 0);
        const diferencaAbsoluta = Math.abs(lancamento.valorLancamento - valorRestante);
        const diferencaPercentual = (diferencaAbsoluta / lancamento.valorLancamento) * 100;
        const matchPercentual = Math.max(0, 100 - diferencaPercentual);

        console.log(`💰 [VINCULAR] Pedido ${pedido.numeroPedido}:`, {
          valorFinal: pedido.valorFinal,
          valorRecebido: pedido.valorRecebido,
          valorRestante,
          matchPercentual: matchPercentual.toFixed(2) + '%'
        });

        return {
          ...pedido,
          valorRestante,
          matchPercentual,
          diferencaAbsoluta,
          isExactMatch: diferencaAbsoluta < 0.01
        };
      });

      // Ordenar por match (exatos primeiro, depois por proximidade)
      pedidosComMatch.sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;
        return b.matchPercentual - a.matchPercentual;
      });

      console.log('✅ [VINCULAR] Pedidos ordenados:', pedidosComMatch);

      setPedidosDisponiveis(pedidosComMatch);

      // Se houver pedidos, selecionar automaticamente o melhor (independente do match %)
      if (pedidosComMatch.length > 0) {
        console.log('✅ [VINCULAR] Auto-selecionando melhor match:', pedidosComMatch[0].numeroPedido);
        setPedidoSelecionado(pedidosComMatch[0]);
      } else {
        console.warn('⚠️ [VINCULAR] Nenhum pedido encontrado para vincular');
      }
    } catch (error) {
      console.error('❌ [VINCULAR] Erro ao buscar pedidos:', error);
      console.error('❌ [VINCULAR] Detalhes do erro:', error.response?.data || error.message);
      showNotification('error', 'Erro', 'Erro ao buscar pedidos disponíveis');
      setPedidosDisponiveis([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVincular = async () => {
    if (!pedidoSelecionado) {
      showNotification('warning', 'Atenção', 'Selecione um pedido para vincular');
      return;
    }

    // Validar se o valor do lançamento não excede o saldo devedor
    if (lancamento.valorLancamento > pedidoSelecionado.valorRestante) {
      showNotification(
        'error',
        'Valor Excede Saldo Devedor',
        `O lançamento de ${formatCurrency(lancamento.valorLancamento)} excede o saldo devedor de ${formatCurrency(pedidoSelecionado.valorRestante)}. Não é possível vincular este pagamento.`
      );
      return;
    }

    try {
      setVinculando(true);
      await onVincular(lancamento, pedidoSelecionado);
      // Fechar modal após sucesso
      onClose();
    } catch (error) {
      console.error('Erro ao vincular:', error);
      // Erro já tratado no componente pai
    } finally {
      setVinculando(false);
    }
  };

  // Filtrar pedidos pela busca (número do pedido OU valor OU data)
  const pedidosFiltrados = pedidosDisponiveis.filter(p => {
    // Filtro de texto (número ou valor)
    const buscaLower = buscaPedido.toLowerCase();
    const numeroPedidoMatch = p.numeroPedido?.toLowerCase().includes(buscaLower);
    const valorFinalMatch = p.valorFinal?.toString().includes(buscaPedido);
    const valorRestanteMatch = p.valorRestante?.toString().includes(buscaPedido);
    const textoMatch = !buscaPedido || numeroPedidoMatch || valorFinalMatch || valorRestanteMatch;

    // Filtro de data de colheita
    const dataMatch = !dataColheitaFiltro ||
      (p.dataColheita && moment(p.dataColheita).isSame(dataColheitaFiltro, 'day'));

    return textoMatch && dataMatch;
  });

  // Separar melhor match dos demais
  const melhorMatch = pedidosFiltrados.length > 0 ? pedidosFiltrados[0] : null;
  const outrosPedidos = pedidosFiltrados.slice(1);

  // Função para renderizar badge de match
  const renderMatchBadge = (pedido) => {
    if (pedido.isExactMatch) {
      return (
        <Tag
          color="success"
          icon={<CheckCircleOutlined />}
          style={{ fontSize: '11px', fontWeight: '600', borderRadius: '4px' }}
        >
          MATCH 100%
        </Tag>
      );
    }

    const matchPercentual = pedido.matchPercentual;
    let color = '#52c41a'; // Verde para >= 90%
    if (matchPercentual < 90 && matchPercentual >= 70) {
      color = '#faad14'; // Amarelo para 70-89%
    } else if (matchPercentual < 70) {
      color = '#ff4d4f'; // Vermelho para < 70%
    }

    return (
      <Tag
        style={{
          backgroundColor: color,
          color: '#ffffff',
          border: 'none',
          fontSize: '11px',
          fontWeight: '600',
          borderRadius: '4px'
        }}
      >
        MATCH {matchPercentual.toFixed(0)}%
      </Tag>
    );
  };

  // Função para renderizar card de pedido (LAYOUT VISUAL MELHORADO)
  const renderPedidoCard = (pedido, isBestMatch = false) => {
    const CardComponent = isBestMatch ? BestMatchCard : PedidoCard;
    const isSelected = pedidoSelecionado?.id === pedido.id;

    // Verificar se o valor do lançamento excede o saldo devedor
    const valorExcedeSaldo = lancamento?.valorLancamento > pedido.valorRestante;

    return (
      <CardComponent
        key={pedido.id}
        size="small"
        className={isSelected ? 'selected' : ''}
        onClick={() => setPedidoSelecionado(pedido)}
        style={{
          opacity: valorExcedeSaldo ? 0.6 : 1,
          pointerEvents: valorExcedeSaldo ? 'none' : 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
          {/* Radio Button Fixo */}
          <Radio
            value={pedido.id}
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: '4px', flexShrink: 0 }}
          />

          {/* Conteúdo com Largura Total */}
          <div style={{ flex: 1, width: '100%' }}>
            <Row gutter={[16, 12]} align="middle">
              {/* Coluna 1: Número do Pedido com Troféu */}
              <Col xs={24} md={7}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingRight: '12px',
                  borderRight: '2px solid #e8e8e8'
                }}>
                  {isBestMatch && (
                    <TrophyOutlined
                      style={{
                        fontSize: '22px',
                        color: '#52c41a'
                      }}
                    />
                  )}
                  <div>
                    <Text strong style={{ fontSize: '18px', display: 'block', color: '#262626' }}>
                      {pedido.numeroPedido}
                    </Text>
                    {isBestMatch && (
                      <Tag
                        color="success"
                        style={{
                          marginTop: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        MELHOR OPÇÃO
                      </Tag>
                    )}
                  </div>
                </div>
              </Col>

              {/* Coluna 2: Data da Colheita */}
              <Col xs={8} md={5}>
                <div style={{
                  backgroundColor: '#fafafa',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #f0f0f0'
                }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    <CalendarOutlined style={{ marginRight: '4px', color: '#059669' }} />
                    Data Colheita
                  </Text>
                  <Text strong style={{ fontSize: '15px', color: '#262626' }}>
                    {pedido.dataColheita ? formatarDataBR(pedido.dataColheita) : '-'}
                  </Text>
                </div>
              </Col>

              {/* Coluna 3: Valor Total */}
              <Col xs={8} md={5}>
                <div style={{
                  backgroundColor: '#e6f7ff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #bae7ff'
                }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    <DollarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                    Valor Total
                  </Text>
                  <Text strong style={{ fontSize: '15px', color: '#0050b3' }}>
                    {formatCurrency(pedido.valorFinal)}
                  </Text>
                </div>
              </Col>

              {/* Coluna 4: Saldo Devedor */}
              <Col xs={8} md={4}>
                <div style={{
                  backgroundColor: pedido.isExactMatch ? '#f6ffed' : '#fffbe6',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${pedido.isExactMatch ? '#b7eb8f' : '#ffe58f'}`
                }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    <DollarOutlined style={{
                      marginRight: '4px',
                      color: pedido.isExactMatch ? '#52c41a' : '#faad14'
                    }} />
                    Saldo Devedor
                  </Text>
                  <Text
                    strong
                    style={{
                      fontSize: '15px',
                      color: pedido.isExactMatch ? '#389e0d' : '#d48806'
                    }}
                  >
                    {formatCurrency(pedido.valorRestante)}
                  </Text>
                </div>
              </Col>

              {/* Coluna 5: Badge de Match ou Aviso */}
              <Col xs={24} md={3} style={{ textAlign: isMobile ? 'left' : 'center' }}>
                {valorExcedeSaldo ? (
                  <Tag color="error" style={{ fontSize: '11px', fontWeight: '600' }}>
                    VALOR EXCEDE SALDO
                  </Tag>
                ) : (
                  renderMatchBadge(pedido)
                )}
              </Col>
            </Row>
          </div>
        </div>

        {/* Alerta de Valor Excedente */}
        {valorExcedeSaldo && (
          <Alert
            message="Valor do lançamento maior que o saldo devedor"
            description={`O lançamento de ${formatCurrency(lancamento.valorLancamento)} excede o saldo devedor de ${formatCurrency(pedido.valorRestante)}. Este pedido não pode ser selecionado.`}
            type="error"
            showIcon
            style={{ marginTop: '8px', fontSize: '12px' }}
          />
        )}
      </CardComponent>
    );
  };

  return (
    <>
      <Modal
        title={
          <span
            style={{
              color: '#ffffff',
              fontWeight: '600',
              fontSize: isMobile ? '0.875rem' : '1rem',
              backgroundColor: '#059669',
              padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
              margin: '-1.25rem -1.5rem 0 -1.5rem',
              display: 'block',
              borderRadius: '0.5rem 0.5rem 0 0',
            }}
          >
            <LinkOutlined style={{ marginRight: '0.5rem' }} />
            Vincular Pagamento ao Pedido
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={isMobile ? '95vw' : '90%'}
        style={{ maxWidth: isMobile ? '95vw' : '75rem' }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 12.5rem)',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? 12 : 20,
          },
          header: {
            backgroundColor: '#059669',
            borderBottom: '0.125rem solid #047857',
            padding: 0,
          },
          wrapper: { zIndex: 1200 },
        }}
        centered
        destroyOnClose
      >
        {/* Overlay de Loading para Vinculação */}
        {vinculando && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000,
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '32px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e8e8e8',
              }}
            >
              <SpinnerContainer />
              <div
                style={{
                  color: '#059669',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                Vinculando pagamento...
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 1: Informações do Lançamento */}
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.875rem' }}>
                Lançamento Selecionado
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: '0.0625rem solid #e8e8e8',
            borderRadius: '0.5rem',
            backgroundColor: '#f9f9f9',
          }}
          styles={{
            header: {
              backgroundColor: '#059669',
              borderBottom: '0.125rem solid #047857',
              color: '#ffffff',
              borderRadius: '0.5rem 0.5rem 0 0',
              padding: isMobile ? '6px 12px' : '8px 16px',
            },
            body: { padding: isMobile ? '12px' : '16px' },
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={8}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  <CalendarOutlined style={{ marginRight: 4, color: '#059669' }} />
                  Data
                </Text>
                <Text style={{ fontSize: '14px' }}>
                  {formatarDataBR(lancamento?.dataLancamento)}
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  <DollarOutlined style={{ marginRight: 4, color: '#059669' }} />
                  Valor
                </Text>
                <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                  {formatCurrency(lancamento?.valorLancamento)}
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  <FileTextOutlined style={{ marginRight: 4, color: '#059669' }} />
                  Categoria
                </Text>
                <Tag
                  color={lancamento?.categoriaOperacao === 'PIX_RECEBIDO' ? '#059669' : '#3b82f6'}
                  style={{
                    borderRadius: '4px',
                    fontWeight: '500',
                    fontSize: '12px',
                    border: 'none',
                  }}
                >
                  {lancamento?.categoriaOperacao?.replace('_', ' ')}
                </Tag>
              </Space>
            </Col>
          </Row>
          {lancamento?.nomeContrapartida && (
            <>
              <Divider style={{ margin: isMobile ? '8px 0' : '12px 0' }} />
              <Row>
                <Col span={24}>
                  <Text strong style={{ fontSize: '12px', color: '#666' }}>Origem: </Text>
                  <Text style={{ fontSize: '13px' }}>{lancamento.nomeContrapartida}</Text>
                </Col>
              </Row>
            </>
          )}
          {lancamento?.textoDescricaoHistorico && (
            <Row style={{ marginTop: 8 }}>
              <Col span={24}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>Descrição: </Text>
                <Text style={{ fontSize: '13px' }}>{lancamento.textoDescricaoHistorico}</Text>
              </Col>
            </Row>
          )}
        </Card>

        {/* SEÇÃO 2: Busca e Seleção de Pedido */}
        <Card
          title={
            <Space>
              <SearchOutlined style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.875rem' }}>
                Selecionar Pedido
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: '0.0625rem solid #e8e8e8',
            borderRadius: '0.5rem',
            backgroundColor: '#f9f9f9',
          }}
          styles={{
            header: {
              backgroundColor: '#059669',
              borderBottom: '0.125rem solid #047857',
              color: '#ffffff',
              borderRadius: '0.5rem 0.5rem 0 0',
              padding: isMobile ? '6px 12px' : '8px 16px',
            },
            body: { padding: isMobile ? '12px' : '16px' },
          }}
        >
          {/* Campos de Busca */}
          <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 12 : 16 }}>
            <Col xs={24} md={16}>
              <Input
                placeholder="Buscar por número do pedido ou valor (ex: PED-2024-0123 ou 1500)"
                prefix={<SearchOutlined />}
                value={buscaPedido}
                onChange={(e) => setBuscaPedido(e.target.value)}
                size={isMobile ? 'middle' : 'large'}
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <DatePicker
                placeholder="Filtrar por data de colheita"
                value={dataColheitaFiltro}
                onChange={(date) => setDataColheitaFiltro(date)}
                format="DD/MM/YYYY"
                size={isMobile ? 'middle' : 'large'}
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
          </Row>

          {/* Alerta Informativo sobre a Operação */}
          <Alert
            message="O que acontecerá ao clicar em 'Vincular e Criar Pagamento'?"
            description={
              <div>
                <p style={{ marginBottom: '8px', fontSize: '13px' }}>
                  Ao confirmar, o sistema realizará automaticamente <strong>duas operações</strong>:
                </p>
                <ol style={{ marginLeft: '16px', fontSize: '13px', marginBottom: 0 }}>
                  <li style={{ marginBottom: '4px' }}>
                    <strong>Vinculação do Lançamento:</strong> O lançamento bancário de{' '}
                    <Text strong style={{ color: '#059669' }}>
                      {formatCurrency(lancamento?.valorLancamento)}
                    </Text>{' '}
                    será vinculado ao pedido selecionado na tabela de extratos.
                  </li>
                  <li>
                    <strong>Criação de Pagamento:</strong> Um novo pagamento será criado automaticamente
                    na aba de pagamentos do pedido, atualizando o status financeiro do pedido.
                  </li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: isMobile ? 12 : 16 }}
          />

          {/* Lista de Pedidos com Radio */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <SpinnerContainer style={{ margin: '0 auto' }} />
              <Text style={{ display: 'block', marginTop: '16px', color: '#666' }}>
                Carregando pedidos...
              </Text>
            </div>
          ) : (
            <Radio.Group
              value={pedidoSelecionado?.id}
              onChange={(e) => {
                const pedido = pedidosFiltrados.find((p) => p.id === e.target.value);
                setPedidoSelecionado(pedido);
              }}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {pedidosFiltrados.length === 0 ? (
                  <Empty
                    description="Nenhum pedido disponível para vinculação"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: '40px 0' }}
                  />
                ) : (
                  <>
                    {/* MELHOR MATCH (Destaque) */}
                    {melhorMatch && (
                      <>
                        <div style={{ marginBottom: 8 }}>
                          <Text
                            strong
                            style={{
                              fontSize: '13px',
                              color: '#52c41a',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <TrophyOutlined />
                            MELHOR CORRESPONDÊNCIA
                          </Text>
                        </div>
                        {renderPedidoCard(melhorMatch, true)}
                      </>
                    )}

                    {/* OUTROS PEDIDOS */}
                    {outrosPedidos.length > 0 && (
                      <>
                        <Divider style={{ margin: isMobile ? '12px 0 8px 0' : '16px 0 12px 0' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Outros Pedidos Disponíveis
                          </Text>
                        </Divider>
                        {outrosPedidos.map((pedido) => renderPedidoCard(pedido, false))}
                      </>
                    )}
                  </>
                )}
              </Space>
            </Radio.Group>
          )}
        </Card>

        {/* Botões de Ação */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: isMobile ? '8px' : '12px',
            marginTop: isMobile ? '1rem' : '1.5rem',
            paddingTop: isMobile ? '12px' : '16px',
            borderTop: '0.0625rem solid #e8e8e8',
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? 'small' : 'large'}
            disabled={vinculando}
            style={{
              height: isMobile ? '32px' : '40px',
              padding: isMobile ? '0 12px' : '0 16px',
            }}
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={handleVincular}
            loading={vinculando}
            disabled={!pedidoSelecionado || loading}
            size={isMobile ? 'small' : 'large'}
            style={{
              backgroundColor: '#059669',
              borderColor: '#059669',
              height: isMobile ? '32px' : '40px',
              padding: isMobile ? '0 12px' : '0 16px',
            }}
          >
            {vinculando ? 'Vinculando...' : 'Vincular e Criar Pagamento'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

VincularPagamentoManualModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lancamento: PropTypes.object,
  cliente: PropTypes.object,
  onVincular: PropTypes.func.isRequired,
};

export default VincularPagamentoManualModal;
