import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Divider,
  Space,
  Empty
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  AppleOutlined,
  NumberOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import useResponsive from '../../hooks/useResponsive';
import usePedidoStatusColors from '../../hooks/usePedidoStatusColors';
import { capitalizeName, capitalizeNameShort, intFormatter } from '../../utils/formatters';
import { getFruitIcon } from '../../utils/fruitIcons';
import { formatarData } from '../../utils/dateUtils';

const { Text } = Typography;

const ColheitasDiaModal = ({ open, onClose, diaSelecionado }) => {
  const { isMobile } = useResponsive();
  const { getStatusConfig } = usePedidoStatusColors();

  const colheitasPendentesPayload = diaSelecionado?.colheitasPendentes ?? diaSelecionado?.colheitas ?? [];
  const colheitasConcluidasPayload = diaSelecionado?.colheitasConcluidas ?? [];
  const dataFormatada = diaSelecionado?.dataFormatada ?? '';
  const diaSemana = diaSelecionado?.diaSemana ?? '';
  const totalPendentesDia = diaSelecionado?.totais?.pendentes ?? colheitasPendentesPayload.length;
  const totalConcluidasDia = diaSelecionado?.totais?.concluidas ?? colheitasConcluidasPayload.length;
  const statusConfig = diaSelecionado?.statusConfig;
  const label = diaSelecionado?.label ?? '';

  const colheitasPendentes = useMemo(
    () => colheitasPendentesPayload,
    [colheitasPendentesPayload]
  );

  const colheitasConcluidas = useMemo(
    () => colheitasConcluidasPayload,
    [colheitasConcluidasPayload]
  );

  const resumoPendentesPorUnidade = useMemo(() => {
    const mapa = {};
    colheitasPendentes.forEach(item => {
      const unidade = item.unidade || 'UN';
      mapa[unidade] = (mapa[unidade] || 0) + (item.quantidadePrevista || 0);
    });
    return mapa;
  }, [colheitasPendentes]);

  const resumoConcluidasPorUnidade = useMemo(() => {
    const mapa = {};
    colheitasConcluidas.forEach(item => {
      const unidade = item.unidade || 'UN';
      mapa[unidade] = (mapa[unidade] || 0) + (item.quantidadeReal || 0);
    });
    return mapa;
  }, [colheitasConcluidas]);

  const resumoPendentesTexto = useMemo(() => {
    const partes = Object.entries(resumoPendentesPorUnidade).map(([unidade, quantidade]) => `${intFormatter(quantidade)} ${unidade}`);
    return partes.length ? partes.join(' • ') : '0';
  }, [resumoPendentesPorUnidade]);

  const resumoConcluidasTexto = useMemo(() => {
    const partes = Object.entries(resumoConcluidasPorUnidade).map(([unidade, quantidade]) => `${intFormatter(quantidade)} ${unidade}`);
    return partes.length ? partes.join(' • ') : '0';
  }, [resumoConcluidasPorUnidade]);

  const possuiColheitasRealizadas = colheitasConcluidas.length > 0;
  const possuiPendentes = resumoPendentesTexto !== '0';
  const possuiDados = totalPendentesDia > 0 || totalConcluidasDia > 0;

  const renderColheitaCard = (colheita, variante) => {
    const statusPedidoConfig = getStatusConfig(colheita.statusPedido);
    const isConcluida = variante === 'concluida';

    const cardColors = isConcluida
      ? {
          border: '#bbf7d0',
          background: '#ecfdf5',
          shadow: '0 8px 16px rgba(5, 150, 105, 0.12)',
          tagColor: '#047857',
          tagBackground: '#d1fae5'
        }
      : {
          border: '#fde68a',
          background: '#fefce8',
          shadow: '0 8px 16px rgba(217, 119, 6, 0.12)',
          tagColor: '#b45309',
          tagBackground: '#fef3c7'
        };

    return (
      <Card
        key={`${variante}-${colheita.pedidoId}-${colheita.fruta}`}
        style={{
          borderRadius: '12px',
          border: `1px solid ${cardColors.border}`,
          backgroundColor: cardColors.background,
          boxShadow: cardColors.shadow
        }}
        bodyStyle={{
          padding: isMobile ? '14px' : '18px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: isMobile ? 12 : 16
          }}
        >
          <Space direction="vertical" size={4}>
            <Text style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600 }}>
              <UserOutlined style={{ marginRight: 6 }} />
              Cliente
            </Text>
            <Text style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937' }}>
              {capitalizeNameShort(colheita.cliente)}
            </Text>
            <Text style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Pedido #{colheita.numeroPedido || colheita.pedidoId}
            </Text>
          </Space>

          <Tag
            color={statusPedidoConfig?.color || (isConcluida ? '#047857' : '#f59e0b')}
            style={{
              alignSelf: isMobile ? 'flex-start' : 'center',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: '999px',
              padding: '6px 16px',
              backgroundColor: statusPedidoConfig?.color ? undefined : cardColors.tagBackground,
              color: statusPedidoConfig?.color ? undefined : cardColors.tagColor,
              borderColor: statusPedidoConfig?.color ? undefined : cardColors.tagBackground
            }}
          >
            {statusPedidoConfig?.text || 'Status não informado'}
          </Tag>
        </div>

        <Divider style={{ margin: '12px 0', borderColor: '#e2e8f0' }} />

        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Space size={10}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {getFruitIcon(colheita.fruta, { width: 22, height: 22 })}
              </span>
              <div>
                <Text style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                  FRUTA
                </Text>
                <Text style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669' }}>
                  {capitalizeName(colheita.fruta)}
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <div>
              <Text style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                PREVISTO
              </Text>
              <Text style={{ fontSize: '0.875rem', fontWeight: 600, color: '#036146' }}>
                <NumberOutlined style={{ marginRight: 6 }} />
                {intFormatter(colheita.quantidadePrevista)} {colheita.unidade}
              </Text>
            </div>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <div>
              <Text style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                COLHIDO
              </Text>
              <Text
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isConcluida ? '#047857' : '#9ca3af'
                }}
              >
                {intFormatter(colheita.quantidadeReal || 0)} {colheita.unidade}
              </Text>
            </div>
          </Col>

          <Col xs={24} sm={12} md={10}>
            <Space size={10} align="start">
              <AppleOutlined style={{ color: '#fb923c', marginTop: 4 }} />
              <div>
                <Text style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                  STATUS DA COLHEITA
                </Text>
                {(() => {
                  if (isConcluida) {
                    return (
                      <Tag color="green" style={{ fontWeight: 600, borderRadius: '999px' }}>
                        Colheita concluída
                      </Tag>
                    );
                  }

                  if (colheita.status) {
                    return (
                      <Text style={{ fontSize: '0.8125rem', color: '#475569' }}>
                        {capitalizeName(colheita.status.replace(/_/g, ' ').toLowerCase())}
                      </Text>
                    );
                  }

                  return <Text style={{ fontSize: '0.8125rem', color: '#475569' }}>Status não informado</Text>;
                })()}
              </div>
            </Space>
          </Col>
        </Row>

        {isConcluida ? (
          colheita.dataColheita && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#e0f2f1',
                border: '1px solid #99f6e4',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <CalendarOutlined style={{ color: '#0f766e' }} />
              <Text style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                Colhido em {formatarData(colheita.dataColheita)}
              </Text>
            </div>
          )
        ) : (
          colheita.diasRestantes !== undefined && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#fff7ed',
                border: '1px dashed #fdba74',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <InfoCircleOutlined style={{ color: '#d97706' }} />
              <Text style={{ fontSize: '0.75rem', color: '#7c2d12' }}>
                {colheita.diasRestantes === 0
                  ? 'Colheita prevista para hoje.'
                  : colheita.diasRestantes > 0
                    ? `Faltam ${colheita.diasRestantes} dia${colheita.diasRestantes === 1 ? '' : 's'} para a colheita.`
                    : `Colheita atrasada em ${Math.abs(colheita.diasRestantes)} dia${Math.abs(colheita.diasRestantes) === 1 ? '' : 's'}.`}
              </Text>
            </div>
          )
        )}
      </Card>
    );
  };

  if (!diaSelecionado) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={isMobile ? '95vw' : '70vw'}
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
            borderRadius: '0.5rem 0.5rem 0 0'
          }}
        >
          <CalendarOutlined style={{ marginRight: '0.5rem' }} />
          {`Colheitas de ${diaSemana} (${dataFormatada})`}
        </span>
      }
      styles={{
        body: {
          maxHeight: 'calc(100vh - 12.5rem)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isMobile ? 12 : 20,
          backgroundColor: '#f9fafb'
        },
        header: {
          backgroundColor: '#059669',
          borderBottom: '0.125rem solid #047857',
          padding: 0
        }
      }}
      destroyOnClose
    >
      <Card
        style={{
          border: '1px solid #10b981',
          borderRadius: '12px',
          marginBottom: isMobile ? 12 : 16,
          backgroundColor: '#f0fdf4',
          boxShadow: '0 8px 18px rgba(5, 150, 105, 0.15)'
        }}
        bodyStyle={{
          padding: isMobile ? '14px' : '20px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 20,
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Tag
            color={statusConfig?.border || '#047857'}
            style={{
              backgroundColor: statusConfig?.border || '#047857',
              color: '#ffffff',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              padding: '4px 12px',
              alignSelf: 'flex-start'
            }}
          >
            {statusConfig?.label
              ? `${statusConfig.label} • ${diaSemana}`
              : (label === dataFormatada ? diaSemana : `${diaSemana} • ${label}`)}
          </Tag>
          <Text style={{ fontSize: isMobile ? '0.75rem' : '0.8125rem', color: '#047857', fontWeight: 600 }}>
            {totalPendentesDia} pendente{totalPendentesDia === 1 ? '' : 's'} • {totalConcluidasDia} realizada{totalConcluidasDia === 1 ? '' : 's'}
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 8 : 16,
            alignItems: isMobile ? 'flex-start' : 'center'
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <Text style={{ fontSize: '0.6875rem', color: '#0f766e', display: 'block', fontWeight: 600 }}>
                Previstas
              </Text>
              <Text
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: possuiPendentes ? '#047857' : '#9ca3af'
                }}
              >
                {resumoPendentesTexto}
              </Text>
            </div>
            <Divider type="vertical" style={{ height: '100%' }} />
            <div>
              <Text style={{ fontSize: '0.6875rem', color: '#0f766e', display: 'block', fontWeight: 600 }}>
                Realizadas
              </Text>
              <Text
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: possuiColheitasRealizadas ? '#059669' : '#9ca3af'
                }}
              >
                {resumoConcluidasTexto}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {!possuiDados ? (
        <Empty
          description="Nenhuma colheita registrada para este dia"
          image={<CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <Space direction="vertical" size={isMobile ? 12 : 16} style={{ width: '100%' }}>
          {colheitasPendentes.length > 0 && (
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#ffffff' }} />
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
                    Colheitas Pendentes
                  </span>
                </Space>
              }
              style={{
                border: '1px solid #fde68a',
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0 10px 18px rgba(217, 119, 6, 0.12)'
              }}
              styles={{
                header: {
                  backgroundColor: '#f59e0b',
                  borderRadius: '12px 12px 0 0',
                  borderBottom: '1px solid #fb923c',
                  padding: isMobile ? '6px 12px' : '8px 16px'
                },
                body: {
                  padding: isMobile ? '12px' : '16px',
                  backgroundColor: '#fff'
                }
              }}
            >
              <Space direction="vertical" size={isMobile ? 10 : 12} style={{ width: '100%' }}>
                {colheitasPendentes.map((colheita) => renderColheitaCard(colheita, 'pendente'))}
              </Space>
            </Card>
          )}

          {colheitasConcluidas.length > 0 && (
            <Card
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#ffffff' }} />
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
                    Colheitas Realizadas
                  </span>
                </Space>
              }
              style={{
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0 10px 18px rgba(5, 150, 105, 0.12)'
              }}
              styles={{
                header: {
                  backgroundColor: '#059669',
                  borderRadius: '12px 12px 0 0',
                  borderBottom: '1px solid #047857',
                  padding: isMobile ? '6px 12px' : '8px 16px'
                },
                body: {
                  padding: isMobile ? '12px' : '16px',
                  backgroundColor: '#fff'
                }
              }}
            >
              <Space direction="vertical" size={isMobile ? 10 : 12} style={{ width: '100%' }}>
                {colheitasConcluidas.map((colheita) => renderColheitaCard(colheita, 'concluida'))}
              </Space>
            </Card>
          )}
        </Space>
      )}
    </Modal>
  );
};

ColheitasDiaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  diaSelecionado: PropTypes.shape({
    data: PropTypes.instanceOf(Date),
    dataFormatada: PropTypes.string,
    diaSemana: PropTypes.string,
    colheitasPendentes: PropTypes.arrayOf(
      PropTypes.shape({
        pedidoId: PropTypes.number,
        numeroPedido: PropTypes.string,
        cliente: PropTypes.string,
        fruta: PropTypes.string,
        quantidadePrevista: PropTypes.number,
        quantidadeReal: PropTypes.number,
        unidade: PropTypes.string,
        status: PropTypes.string,
        statusPedido: PropTypes.string,
        diasRestantes: PropTypes.number
      })
    ),
    colheitasConcluidas: PropTypes.arrayOf(
      PropTypes.shape({
        pedidoId: PropTypes.number,
        numeroPedido: PropTypes.string,
        cliente: PropTypes.string,
        fruta: PropTypes.string,
        quantidadePrevista: PropTypes.number,
        quantidadeReal: PropTypes.number,
        unidade: PropTypes.string,
        status: PropTypes.string,
        statusPedido: PropTypes.string,
        diasRestantes: PropTypes.number
      })
    ),
    totais: PropTypes.shape({
      pendentes: PropTypes.number,
      concluidas: PropTypes.number
    }),
    statusConfig: PropTypes.object,
    label: PropTypes.string,
    diasRestantes: PropTypes.number
  })
};

export default ColheitasDiaModal;

