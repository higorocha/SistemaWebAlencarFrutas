import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Card, Space, Tag, Typography, Empty, Spin, Button, Row, Col, Tooltip, Statistic } from 'antd';
import { DollarOutlined, LinkOutlined, CalendarOutlined, EyeOutlined, FileSearchOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import { formatCurrency, formatarDataBR } from '../../utils/formatters';
import useResponsive from '../../hooks/useResponsive';
import ResponsiveTable from '../common/ResponsiveTable';
import ConfirmActionModal from '../common/modals/ConfirmActionModal';

const { Text, Title } = Typography;

const VisualizarVinculosLancamentoModal = ({ open, onClose, lancamento, onVisualizarPedido }) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [vinculos, setVinculos] = useState([]);
  const [confirmRemocaoOpen, setConfirmRemocaoOpen] = useState(false);
  const [vinculoParaRemover, setVinculoParaRemover] = useState(null);
  const [removendoVinculo, setRemovendoVinculo] = useState(false);

  const fetchVinculos = useCallback(async () => {
    if (!lancamento?.id) {
      setVinculos([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/lancamentos-extrato/${lancamento.id}/vinculos`);
      const data = Array.isArray(response?.data) ? response.data : [];
      setVinculos(data);
    } catch (error) {
      console.error('Erro ao carregar vínculos do lançamento:', error);
      const message = error.response?.data?.message || 'Não foi possível carregar os pedidos vinculados.';
      showNotification('error', 'Erro', message);
      setVinculos([]);
    } finally {
      setLoading(false);
    }
  }, [lancamento?.id]);

  useEffect(() => {
    if (open) {
      fetchVinculos();
    } else {
      setVinculos([]);
    }
  }, [open, fetchVinculos]);

  const vinculosTotais = Array.isArray(vinculos) ? vinculos.length : 0;

  const valorTotalVinculado = useMemo(() => {
    if (!Array.isArray(vinculos)) return 0;
    return vinculos.reduce((acc, vinculo) => acc + (Number(vinculo?.valorVinculado) || 0), 0);
  }, [vinculos]);

  const handleAbrirConfirmacaoRemocao = (vinculo) => {
    setVinculoParaRemover(vinculo);
    setConfirmRemocaoOpen(true);
  };

  const handleCancelarRemocao = () => {
    setConfirmRemocaoOpen(false);
    setVinculoParaRemover(null);
  };

  const handleRemoverVinculo = async () => {
    if (!vinculoParaRemover?.id || !lancamento?.id) return;

    try {
      setRemovendoVinculo(true);
      await axiosInstance.delete(`/api/pedidos/pagamentos/vinculo/${vinculoParaRemover.id}`, {
        params: { lancamentoExtratoId: lancamento.id },
      });
      showNotification('success', 'Sucesso', 'Vínculo removido com sucesso.');
      await fetchVinculos();
    } catch (error) {
      console.error('Erro ao remover vínculo:', error);
      const message = error.response?.data?.message || 'Não foi possível remover o vínculo.';
      showNotification('error', 'Erro', message);
    } finally {
      setRemovendoVinculo(false);
      setConfirmRemocaoOpen(false);
      setVinculoParaRemover(null);
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Pedido',
      dataIndex: 'pedidoNumero',
      key: 'pedidoNumero',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LinkOutlined style={{ color: '#059669' }} />
          <Text strong style={{ color: '#047857' }}>
            {record.pedidoNumero ? `#${record.pedidoNumero}` : `#${record.pedidoId}`}
          </Text>
        </div>
      ),
    },
    {
      title: 'Valor Vinculado',
      dataIndex: 'valorVinculado',
      key: 'valorVinculado',
      align: 'center',
      render: (valor) => (
        <Tag color="green" style={{ fontSize: 12, borderRadius: 999 }}>
          R$ {formatCurrency(valor || 0)}
        </Tag>
      ),
    },
    {
      title: 'Tipo de Vínculo',
      dataIndex: 'vinculacaoAutomatica',
      key: 'vinculacaoAutomatica',
      align: 'center',
      render: (automatica) => (
        <Tag color={automatica ? '#3b82f6' : '#f59e0b'} style={{ borderRadius: 999, fontSize: 12 }}>
          {automatica ? 'Automático' : 'Manual'}
        </Tag>
      ),
    },
    {
      title: 'Criado em',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: (data) => (
        <Space>
          <CalendarOutlined style={{ color: '#059669' }} />
          <Text>{data ? formatarDataBR(data) : '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Ações',
      key: 'acoes',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {onVisualizarPedido && (
            <Tooltip title="Abrir detalhes do pedido">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onVisualizarPedido(record.pedidoId);
                }}
                style={{ padding: 0 }}
              />
            </Tooltip>
          )}
          <Tooltip title="Remover vínculo do lançamento">
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleAbrirConfirmacaoRemocao(record);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [onVisualizarPedido]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '96vw' : 880}
      centered
      destroyOnClose
      styles={{
        header: {
          backgroundColor: '#059669',
          borderBottom: '0.125rem solid #047857',
          padding: 0,
        },
        body: {
          padding: isMobile ? 12 : 20,
        },
      }}
      title={
        <span
          style={{
            color: '#ffffff',
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '1rem',
            backgroundColor: '#059669',
            padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
            margin: '-1.25rem -1.5rem 0 -1.5rem',
            display: 'block',
            borderRadius: '0.5rem 0.5rem 0 0',
          }}
        >
          <FileSearchOutlined style={{ marginRight: 8 }} /> Pedidos vinculados a este lançamento
        </span>
      }
    >
      <Space direction="vertical" size={isMobile ? 12 : 16} style={{ width: '100%' }}>
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
                Resumo do vínculo
              </span>
            </Space>
          }
          styles={{
            header: {
              backgroundColor: '#059669',
              borderBottom: '0.125rem solid #047857',
              borderRadius: '0.5rem 0.5rem 0 0',
              padding: isMobile ? '6px 12px' : '8px 16px',
            },
            body: {
              padding: isMobile ? 12 : 16,
            },
          }}
          style={{
            borderRadius: '0.5rem',
            border: '0.0625rem solid #e5e7eb',
            backgroundColor: '#f9f9f9',
          }}
        >
          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
            <Col xs={24} md={8}>
              <Statistic
                title={isMobile ? 'Tot. vínculos' : 'Total de pedidos vinculados'}
                value={vinculosTotais}
                valueStyle={{ color: '#059669', fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                prefix={<span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#059669' }} />}
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic
                title="Valor total vinculado"
                value={formatCurrency(valorTotalVinculado)}
                valueStyle={{ color: '#047857', fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                prefix={<DollarOutlined style={{ color: '#047857' }} />}
              />
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                bodyStyle={{
                  padding: isMobile ? '12px' : '14px',
                  backgroundColor: '#ecfdf5',
                  borderRadius: 12,
                  border: '1px solid #bbf7d0',
                }}
                style={{ backgroundColor: 'transparent', border: 'none' }}
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '0.75rem', color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Lançamento selecionado
                  </Text>
                  <Space size={[6, 6]} wrap>
                    <Tag color="#059669" style={{ borderRadius: 999, fontSize: '0.75rem', padding: '4px 10px' }}>
                      {formatCurrency(lancamento?.valorLancamento || 0)}
                    </Tag>
                    {lancamento?.textoDescricaoHistorico && (
                      <Tag color="#1d4ed8" style={{ borderRadius: 999, fontSize: '0.75rem', padding: '4px 10px' }}>
                        {lancamento.textoDescricaoHistorico}
                      </Tag>
                    )}
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <LinkOutlined style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
                Pedidos vinculados
              </span>
            </Space>
          }
          styles={{
            header: {
              backgroundColor: '#059669',
              borderBottom: '0.125rem solid #047857',
              borderRadius: '0.5rem 0.5rem 0 0',
              padding: isMobile ? '6px 12px' : '8px 16px',
            },
            body: {
              padding: isMobile ? 0 : 0,
            },
          }}
          style={{
            borderRadius: '0.5rem',
            border: '0.0625rem solid #e5e7eb',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <Spin spinning={loading} tip="Carregando vínculos...">
            {vinculosTotais === 0 && !loading ? (
              <Empty
                description={<Text type="secondary">Nenhum pedido vinculado até o momento</Text>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: isMobile ? '24px 0' : '40px 0' }}
              />
            ) : (
              <ResponsiveTable
                rowKey={(record) => record.id ?? `${record.pedidoId}-${record.lancamentoExtratoId}`}
                columns={columns}
                dataSource={vinculos.map((item) => ({ ...item }))}
                pagination={false}
                size="middle"
                bordered
                loading={false}
                locale={{
                  emptyText: 'Nenhum pedido vinculado',
                }}
                minWidthMobile={700}
                showScrollHint
                scroll={{ x: 700 }}
              />
            )}
          </Spin>
        </Card>
      </Space>
      <ConfirmActionModal
        open={confirmRemocaoOpen}
        onConfirm={handleRemoverVinculo}
        onCancel={handleCancelarRemocao}
        title="Remover vínculo"
        message="Se houver pagamento associado a este vínculo, ele também será removido."
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        confirmDisabled={removendoVinculo}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
        customContent={vinculoParaRemover && (
          <div>
            <Text>
              Pedido {vinculoParaRemover.pedidoNumero ? `#${vinculoParaRemover.pedidoNumero}` : `#${vinculoParaRemover.pedidoId}`} • Valor vinculado: R$ {formatCurrency(vinculoParaRemover.valorVinculado || 0)}
            </Text>
          </div>
        )}
      />
    </Modal>
  );
};

VisualizarVinculosLancamentoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lancamento: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    valorLancamento: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    textoDescricaoHistorico: PropTypes.string,
  }),
  onVisualizarPedido: PropTypes.func,
};

VisualizarVinculosLancamentoModal.defaultProps = {
  lancamento: null,
  onVisualizarPedido: undefined,
};

export default VisualizarVinculosLancamentoModal;
