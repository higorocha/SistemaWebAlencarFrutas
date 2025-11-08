// src/components/clientes/VincularPagamentoManualModal.js


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Card,
  Input,
  Space,
  Button,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Spin,
  Statistic,
  message,
  Tooltip,
} from 'antd';
import { SearchOutlined, LinkOutlined, DollarOutlined, CalendarOutlined, FileTextOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatCurrency, formatarDataBR, formatarValorMonetario } from '../../utils/formatters';
import useResponsive from '../../hooks/useResponsive';
import ResponsiveTable from '../common/ResponsiveTable';
import usePedidoStatusColors from '../../hooks/usePedidoStatusColors';

const { Text } = Typography;
const TOLERANCIA = 0.009;

export const preparePedidosParaVinculo = (pedidos = [], { lancamento, clientePadrao } = {}) => {
  const valorTotalLancamento = Number(lancamento?.valorDisponivel ?? lancamento?.valorLancamento ?? 0);

  return pedidos
    .map((pedido) => {
      const valorFinal = Number(pedido.valorFinal || 0);
      const valorRecebido = Number(pedido.valorRecebido || 0);
      const valorRestante = Number((valorFinal - valorRecebido).toFixed(2));
      const clienteInfo = pedido.cliente || clientePadrao || {};
      const clienteNome = pedido.clienteNome || clienteInfo.nome || 'Cliente não identificado';
      const doc = pedido.clienteDocumento || clienteInfo.cnpj || clienteInfo.cpf || '';
      const documentoLimpo = doc ? doc.replace(/\D/g, '') : '';
      const diferenca = Math.abs(valorRestante - valorTotalLancamento);
      const matchPercentual = valorTotalLancamento > 0
        ? Math.max(0, 100 - (diferenca / valorTotalLancamento) * 100)
        : 0;

      return {
        ...pedido,
        valorFinal,
        valorRecebido,
        valorRestante,
        clienteId: pedido.clienteId ?? clienteInfo.id ?? null,
        clienteNome,
        clienteDocumento: doc,
        clienteDocumentoLimpo: documentoLimpo,
        matchPercentual: Number(matchPercentual.toFixed(2)),
        raw: pedido,
      };
    })
    .filter((pedido) => pedido.valorRestante > TOLERANCIA);
};

const VincularPagamentoManualModal = ({
  open,
  onClose,
  lancamento,
  cliente,
  pedidosDisponiveis = [],
  loadingPedidos = false,
  onVincular,
}) => {
  const { isMobile } = useResponsive();
  const { getStatusConfig } = usePedidoStatusColors();
  const valorDisponivel = Number(lancamento?.valorDisponivel ?? lancamento?.valorLancamento ?? 0);

  const [busca, setBusca] = useState('');
  const [selectedSequence, setSelectedSequence] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [resumo, setResumo] = useState({ totalSelecionado: 0, restante: valorDisponivel });
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    if (!open) {
      setBusca('');
      setSelectedSequence([]);
      setSelectedRowKeys([]);
      setAllocations({});
      setResumo({ totalSelecionado: 0, restante: valorDisponivel });
    } else {
      setResumo({ totalSelecionado: 0, restante: valorDisponivel });
    }
  }, [open, valorDisponivel, lancamento?.id]);

  const pedidosNormalizados = useMemo(
    () => preparePedidosParaVinculo(pedidosDisponiveis, { lancamento, clientePadrao: cliente }),
    [pedidosDisponiveis, lancamento, cliente],
  );

  const pedidosMap = useMemo(() => {
    const map = new Map();
    pedidosNormalizados.forEach((pedido) => {
      map.set(pedido.id, pedido);
    });
    return map;
  }, [pedidosNormalizados]);

  const termoBusca = busca.trim().toLowerCase();
  const termoDocumento = busca.replace(/\D/g, '');

  const pedidosFiltrados = useMemo(() => {
    if (!termoBusca && !termoDocumento) {
      return pedidosNormalizados;
    }

    return pedidosNormalizados.filter((pedido) => {
      const numeroMatch = pedido.numeroPedido?.toLowerCase().includes(termoBusca);
      const clienteMatch = pedido.clienteNome?.toLowerCase().includes(termoBusca);
      const statusMatch = pedido.status?.toLowerCase().includes(termoBusca);
      const valorMatch = termoBusca
        ? pedido.valorFinal?.toString().includes(termoBusca) || pedido.valorRestante?.toString().includes(termoBusca)
        : false;
      const docMatch = termoDocumento ? pedido.clienteDocumentoLimpo?.includes(termoDocumento) : false;

      return (
        numeroMatch || clienteMatch || statusMatch || valorMatch || docMatch
      );
    });
  }, [pedidosNormalizados, termoBusca, termoDocumento]);

  const calcularAlocacoes = useCallback((sequencia) => {
    let restante = valorDisponivel;
    const alocacoes = {};
    const sequenciaValida = [];

    sequencia.forEach((id) => {
      const pedido = pedidosMap.get(id);
      if (!pedido) {
        return;
      }

      const saldo = Number(pedido.valorRestante ?? 0);
      if (saldo <= TOLERANCIA) {
        return;
      }

      const valor = Number(Math.min(saldo, restante).toFixed(2));
      if (valor <= TOLERANCIA && sequenciaValida.length > 0) {
        return;
      }

      if (valor <= TOLERANCIA && sequenciaValida.length === 0) {
        return;
      }

      alocacoes[id] = valor;
      sequenciaValida.push(id);
      restante = Number((restante - valor).toFixed(2));
      if (restante <= TOLERANCIA) {
        restante = 0;
      }
    });

    const totalSelecionado = Number(Object.values(alocacoes).reduce((acc, valor) => acc + valor, 0).toFixed(2));
    return { alocacoes, sequenciaValida, restante, totalSelecionado };
  }, [valorDisponivel, pedidosMap]);

  const atualizarSelecao = useCallback((sequencia) => {
    const { alocacoes, sequenciaValida, restante, totalSelecionado } = calcularAlocacoes(sequencia);

    setSelectedSequence(sequenciaValida);
    setSelectedRowKeys(sequenciaValida);
    setAllocations(alocacoes);
    setResumo({ totalSelecionado, restante });

    return { alocacoes, sequenciaValida };
  }, [calcularAlocacoes]);

  const handleSelect = useCallback((record, selected) => {
    const sequenciaAtual = [...selectedSequence];
    if (selected) {
      if (!sequenciaAtual.includes(record.id)) {
        sequenciaAtual.push(record.id);
      }
      const { alocacoes } = atualizarSelecao(sequenciaAtual);
      if (!alocacoes[record.id]) {
        message.warning('Esse pedido excede o valor disponível do lançamento.');
        const index = sequenciaAtual.indexOf(record.id);
        if (index >= 0) {
          sequenciaAtual.splice(index, 1);
          atualizarSelecao(sequenciaAtual);
        }
      }
    } else {
      const novaSequencia = sequenciaAtual.filter((id) => id !== record.id);
      atualizarSelecao(novaSequencia);
    }
  }, [selectedSequence, atualizarSelecao]);

  const handleSelectAll = useCallback((selected, selectedRows) => {
    if (!selected) {
      atualizarSelecao([]);
      return;
    }

    const ids = selectedRows.map((row) => row.id);
    const { alocacoes, sequenciaValida } = atualizarSelecao(ids);
    if (sequenciaValida.length !== ids.length) {
      message.warning('Alguns pedidos foram ignorados porque excederiam o valor disponível do lançamento.');
    }
    if (Object.keys(alocacoes).length === 0) {
      message.warning('Nenhum dos pedidos selecionados possui saldo disponível.');
    }
  }, [atualizarSelecao]);

  const rowSelection = {
    selectedRowKeys,
    onSelect: handleSelect,
    onSelectAll: handleSelectAll,
    preserveSelectedRowKeys: false,
  };

  const tabelaPaginacao = useMemo(
    () => ({
      pageSize: 10,
      showSizeChanger: true,
      showTotal: (total) => `Total: ${total} pedidos elegíveis`,
      size: 'small',
    }),
    []
  );

  const tableComponents = useMemo(
    () => ({
      body: {
        wrapper: ({ children, ...rest }) => {
          const validChildren = React.Children.toArray(children).filter(
            (child) => child?.props?.['data-row-key'] !== '__ANT_TABLE_MEASURE_ROW__'
          );
          return <tbody {...rest}>{validChildren}</tbody>;
        },
      },
    }),
    []
  );

  const columns = useMemo(() => [
    {
      title: 'Pedido',
      dataIndex: 'numeroPedido',
      key: 'numeroPedido',
      width: 160,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (numero, record) => {
        const statusConfig = getStatusConfig(record.status);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong>{numero}</Text>
            <Tooltip title={statusConfig.text}>
              <InfoCircleOutlined style={{ color: statusConfig.color, fontSize: 14 }} />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: 'Cliente',
      dataIndex: 'clienteNome',
      key: 'clienteNome',
      width: 200,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (nome, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserOutlined />
            <Text>{nome}</Text>
          </div>
          {record.clienteDocumento && (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.clienteDocumento}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Data Colheita',
      dataIndex: 'dataColheita',
      key: 'dataColheita',
      width: 110,
      align: 'center',
      render: (value) => value ? formatarDataBR(value) : '-',
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorFinal',
      key: 'valorFinal',
      width: 110,
      align: 'center',
      render: (value) => formatarValorMonetario(value),
    },
    {
      title: 'Recebido',
      dataIndex: 'valorRecebido',
      key: 'valorRecebido',
      width: 110,
      align: 'center',
      render: (value) => formatarValorMonetario(value),
    },
    {
      title: 'Saldo Devedor',
      dataIndex: 'valorRestante',
      key: 'valorRestante',
      width: 120,
      align: 'center',
      render: (value) => (
        <Tag color={value <= valorDisponivel ? 'green' : 'orange'} style={{ fontSize: 12 }}>
          {formatarValorMonetario(value)}
        </Tag>
      ),
    },
    {
      title: 'Valor a Vincular',
      key: 'valorVincular',
      width: 120,
      align: 'center',
      render: (_, record) => allocations[record.id]
        ? <Text strong style={{ color: '#059669' }}>{formatarValorMonetario(allocations[record.id])}</Text>
        : <Text type="secondary">-</Text>,
    },
    {
      title: 'Match',
      dataIndex: 'matchPercentual',
      key: 'matchPercentual',
      width: 100,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (value) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Tag color={value >= 90 ? 'green' : value >= 70 ? 'gold' : 'red'} style={{ fontSize: 12 }}>
            {`${value.toFixed(0)}%`}
          </Tag>
        </div>
      ),
    },
  ], [allocations, valorDisponivel]);

  const handleConfirmarVinculacao = async () => {
    const itensSelecionados = selectedSequence
      .map((id) => {
        const pedido = pedidosMap.get(id);
        if (!pedido || !allocations[id]) {
          return null;
        }
        return {
          pedidoId: pedido.id,
          valorVinculado: allocations[id],
          pedido,
        };
      })
      .filter(Boolean);

    if (itensSelecionados.length === 0) {
      message.warning('Selecione ao menos um pedido com valor disponível para vincular.');
      return;
    }

    setVinculando(true);
    try {
      await onVincular(lancamento, itensSelecionados);
    } finally {
      setVinculando(false);
    }
  };

  const remainingAlert = resumo.restante > TOLERANCIA
    ? `Restarão ${formatCurrency(resumo.restante)} deste lançamento após a vinculação.`
    : null;

  return (
    <Modal
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
          <LinkOutlined style={{ marginRight: '0.5rem' }} /> Vincular pagamento a pedidos
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '98vw' : '96vw'}
      style={{ maxWidth: isMobile ? '98vw' : '92rem' }}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: isMobile ? 12 : 24,
          maxHeight: 'calc(100vh - 8rem)',
          overflowY: 'auto',
        },
        header: {
          backgroundColor: '#059669',
          borderBottom: '0.125rem solid #047857',
          padding: 0,
        },
        wrapper: { zIndex: 1200 },
      }}
    >
      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
              Resumo do lançamento
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: '1px solid #e8e8e8',
          borderRadius: '0.5rem',
          backgroundColor: '#f9f9f9',
        }}
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
      >
        <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Disponível"
              value={formatCurrency(valorDisponivel)}
              valueStyle={{ color: '#1890ff', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Selecionado"
              value={formatCurrency(resumo.totalSelecionado)}
              valueStyle={{ color: '#52c41a', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Saldo restante"
              value={formatCurrency(resumo.restante)}
              valueStyle={{ color: '#faad14', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
        </Row>
        <Row gutter={[12, 12]} style={{ marginTop: isMobile ? 12 : 16 }}>
          <Col xs={24} sm={8}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: '#666666' }}>
                <CalendarOutlined style={{ marginRight: 4, color: '#059669' }} /> Data
              </Text>
              <Text style={{ fontSize: 14 }}>{lancamento?.dataLancamento ? formatarDataBR(lancamento.dataLancamento) : '-'}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: '#666666' }}>
                <DollarOutlined style={{ marginRight: 4, color: '#059669' }} /> Valor total
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 600, color: '#059669' }}>{formatCurrency(lancamento?.valorLancamento)}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: '#666666' }}>
                <FileTextOutlined style={{ marginRight: 4, color: '#059669' }} /> Categoria
              </Text>
              <Tag color={lancamento?.categoriaOperacao === 'PIX_RECEBIDO' ? '#059669' : '#3b82f6'} style={{ borderRadius: 4, fontWeight: 500, border: 'none', width: 'fit-content' }}>
                {lancamento?.categoriaOperacao?.replace('_', ' ') || '-'}
              </Tag>
            </Space>
          </Col>
        </Row>
        {(lancamento?.nomeContrapartida || lancamento?.textoDescricaoHistorico) && (
          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            {lancamento?.nomeContrapartida && (
              <Col xs={24} sm={12}>
                <Text strong style={{ fontSize: 12, color: '#666666' }}>Origem:</Text>
                <Text style={{ fontSize: 13, marginLeft: 6 }}>{lancamento.nomeContrapartida}</Text>
              </Col>
            )}
            {lancamento?.textoDescricaoHistorico && (
              <Col xs={24} sm={12}>
                <Text strong style={{ fontSize: 12, color: '#666666' }}>Descrição:</Text>
                <Text style={{ fontSize: 13, marginLeft: 6 }}>{lancamento.textoDescricaoHistorico}</Text>
              </Col>
            )}
          </Row>
        )}
      </Card>

      <Card
        title={
          <Space>
            <SearchOutlined style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
              Selecionar pedidos
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: '1px solid #e8e8e8',
          borderRadius: '0.5rem',
          backgroundColor: '#f9f9f9',
        }}
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
      >
        <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 12 : 16 }}>
          <Col xs={24}>
            <Input
              placeholder="Buscar por número do pedido, cliente, CPF/CNPJ ou valor"
              allowClear
              prefix={<SearchOutlined style={{ color: '#059669' }} />}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: '100%' }}
              size={isMobile ? 'middle' : 'large'}
            />
          </Col>
        </Row>

        {remainingAlert && (
          <Alert
            message="Saldo restante"
            description={remainingAlert}
            type="info"
            showIcon
            style={{ marginBottom: isMobile ? 12 : 16 }}
          />
        )}

        <Spin
          spinning={loadingPedidos || vinculando}
          tip={vinculando ? 'Vinculando pagamentos...' : undefined}
        >
          <ResponsiveTable
            rowKey="id"
            columns={columns}
            dataSource={pedidosFiltrados}
            loading={loadingPedidos || vinculando}
            components={tableComponents}
            rowSelection={{
              type: 'checkbox',
              columnWidth: 48,
              onSelect: handleSelect,
              onSelectAll: handleSelectAll,
              selectedRowKeys,
              preserveSelectedRowKeys: false,
            }}
            pagination={tabelaPaginacao}
            size="middle"
            bordered
            locale={{
              emptyText: loadingPedidos
                ? 'Carregando pedidos...'
                : 'Nenhum pedido elegível encontrado',
            }}
            scroll={{ x: 1200 }}
            minWidthMobile={1200}
            showScrollHint
          />
        </Spin>
      </Card>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: isMobile ? 8 : 12,
          marginTop: isMobile ? 12 : 16,
          paddingTop: isMobile ? 12 : 16,
          borderTop: '1px solid #e8e8e8',
        }}
      >
        <Button
          onClick={onClose}
          size={isMobile ? 'small' : 'large'}
          disabled={vinculando}
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          icon={<LinkOutlined />}
          onClick={handleConfirmarVinculacao}
          loading={vinculando}
          disabled={resumo.totalSelecionado <= TOLERANCIA}
          size={isMobile ? 'small' : 'large'}
          style={{
            backgroundColor: '#059669',
            borderColor: '#059669',
          }}
        >
          {vinculando ? 'Vinculando...' : 'Vincular pagamento(s)'}
        </Button>
      </div>
    </Modal>
  );
};

VincularPagamentoManualModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lancamento: PropTypes.object,
  cliente: PropTypes.object,
  pedidosDisponiveis: PropTypes.array,
  loadingPedidos: PropTypes.bool,
  onVincular: PropTypes.func.isRequired,
};

VincularPagamentoManualModal.defaultProps = {
  pedidosDisponiveis: [],
  loadingPedidos: false,
};

export default VincularPagamentoManualModal;
