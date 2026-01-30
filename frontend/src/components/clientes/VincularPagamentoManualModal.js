// src/components/clientes/VincularPagamentoManualModal.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Card,
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
import { SearchOutlined, LinkOutlined, DollarOutlined, CalendarOutlined, UserOutlined, InfoCircleOutlined, BulbOutlined, CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { formatCurrency, formatarDataBR, formatarDataSemTimezone, formatarValorMonetario, capitalizeName } from '../../utils/formatters';
import useResponsive from '../../hooks/useResponsive';
import ResponsiveTable from '../common/ResponsiveTable';
import StyledTabs from '../common/StyledTabs';
import usePedidoStatusColors from '../../hooks/usePedidoStatusColors';
import SearchInputInteligente from '../common/search/SearchInputInteligente';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';

const { Text } = Typography;
const TOLERANCIA = 0.009;
const STATUS_PEDIDOS_ABERTOS = ['PEDIDO_CRIADO','AGUARDANDO_COLHEITA','COLHEITA_PARCIAL','COLHEITA_REALIZADA','AGUARDANDO_PRECIFICACAO','PRECIFICACAO_REALIZADA','AGUARDANDO_PAGAMENTO','PAGAMENTO_PARCIAL'];
const STATUS_PEDIDOS_FINALIZADOS = ['PAGAMENTO_REALIZADO','PEDIDO_FINALIZADO'];
const STATUS_VINCULACAO = Array.from(new Set([...STATUS_PEDIDOS_ABERTOS, ...STATUS_PEDIDOS_FINALIZADOS]));
const TOLERANCIA_PERCENTUAL_SUGESTOES = 0.1; // 10%
const MAX_SUGESTOES = 5;
const MAX_ITENS_COMBINACAO = 4;
const MAX_PEDIDOS_ANALISADOS = 30;

const gerarCombinacoesInteligentes = (pedidos = [], valorAlvo = 0) => {
  if (!Array.isArray(pedidos) || pedidos.length === 0 || valorAlvo <= 0) {
    return { perfeitas: [], parciais: [] };
  }

  const tolerance = valorAlvo * TOLERANCIA_PERCENTUAL_SUGESTOES;
  const resultados = [];
  const combinacoesRegistradas = new Set();
  const pedidosOrdenados = [...pedidos]
    .filter((pedido) => (Number(pedido.valorParaVinculo) || 0) > TOLERANCIA)
    .sort((a, b) => (a.valorParaVinculo || 0) - (b.valorParaVinculo || 0))
    .slice(0, MAX_PEDIDOS_ANALISADOS);

  const explorar = (indiceInicial, combinacaoAtual, somaAtual) => {
    if (combinacaoAtual.length > MAX_ITENS_COMBINACAO) {
      return;
    }

    const diferenca = valorAlvo - somaAtual;
    const diferencaAbsoluta = Math.abs(diferenca);

    if (
      combinacaoAtual.length > 0 &&
      diferencaAbsoluta <= tolerance
    ) {
      const chave = combinacaoAtual
        .map((pedido) => pedido.id)
        .sort((a, b) => a - b)
        .join('-');

      if (!combinacoesRegistradas.has(chave)) {
        combinacoesRegistradas.add(chave);

        const matchPercentual = valorAlvo === 0
          ? 0
          : Math.max(0, 100 - (diferencaAbsoluta / valorAlvo) * 100);

        resultados.push({
          tipo: diferencaAbsoluta <= TOLERANCIA ? 'perfeito' : 'parcial',
          pedidos: [...combinacaoAtual],
          valorTotal: Number(somaAtual.toFixed(2)),
          diferenca: Number(diferenca.toFixed(2)),
          matchPercentual: Number(matchPercentual.toFixed(2)),
        });
      }
    }

    if (
      combinacaoAtual.length === MAX_ITENS_COMBINACAO ||
      indiceInicial >= pedidosOrdenados.length
    ) {
      return;
    }

    for (let i = indiceInicial; i < pedidosOrdenados.length; i += 1) {
      const pedido = pedidosOrdenados[i];
      const valorPedido = Number(pedido.valorParaVinculo) || 0;
      const novaSoma = somaAtual + valorPedido;

      if (novaSoma > valorAlvo + tolerance) {
        break;
      }

      combinacaoAtual.push(pedido);
      explorar(i + 1, combinacaoAtual, novaSoma);
      combinacaoAtual.pop();
    }
  };

  explorar(0, [], 0);

  const resultadosOrdenados = resultados.sort((a, b) => {
    if (b.matchPercentual !== a.matchPercentual) {
      return b.matchPercentual - a.matchPercentual;
    }
    if (a.pedidos.length !== b.pedidos.length) {
      return a.pedidos.length - b.pedidos.length;
    }
    return a.valorTotal - b.valorTotal;
  });

  const perfeitas = resultadosOrdenados
    .filter((resultado) => resultado.tipo === 'perfeito')
    .slice(0, MAX_SUGESTOES);

  const parciais = resultadosOrdenados
    .filter((resultado) => resultado.tipo === 'parcial')
    .slice(0, MAX_SUGESTOES);

  return { perfeitas, parciais };
};
export const preparePedidosParaVinculo = (pedidos = [], { lancamento, clientePadrao } = {}) => {
  const valorTotalLancamento = Number(lancamento?.valorDisponivel ?? lancamento?.valorLancamento ?? 0);

  return pedidos
    .map((pedido) => {
      const valorFinal = Number(pedido.valorFinal || 0);
      const valorRecebido = Number(pedido.valorRecebido || 0);
      const valorRestante = Number((valorFinal - valorRecebido).toFixed(2));
      const vinculosExtrato = Array.isArray(pedido.lancamentosExtratoVinculos)
        ? pedido.lancamentosExtratoVinculos
        : [];
      const valorVinculadoLancamentos = Number(
        vinculosExtrato.reduce(
          (acc, vinculo) => acc + (Number(vinculo?.valorVinculado) || 0),
          0,
        ).toFixed(2),
      );
      const clienteInfo = pedido.cliente || clientePadrao || {};
      const clienteNome = pedido.clienteNome || clienteInfo.nome || 'Cliente não identificado';
      const doc = pedido.clienteDocumento || clienteInfo.cnpj || clienteInfo.cpf || '';
      const documentoLimpo = doc ? doc.replace(/\D/g, '') : '';

      let valorBaseVinculo;
      if (STATUS_PEDIDOS_FINALIZADOS.includes(pedido.status)) {
        const baseFinalizado = valorFinal > 0 ? valorFinal - valorVinculadoLancamentos : 0;
        valorBaseVinculo = Number(Math.max(baseFinalizado, 0).toFixed(2));
      } else {
        valorBaseVinculo = Number(Math.max(valorRestante, 0).toFixed(2));
      }

      const valorParaVinculo = valorBaseVinculo;
      const diferenca = Math.abs(valorParaVinculo - valorTotalLancamento);
      const matchPercentual = valorTotalLancamento > 0
        ? Math.max(0, 100 - (diferenca / valorTotalLancamento) * 100)
        : 0;

      return {
        ...pedido,
        valorFinal,
        valorRecebido,
        valorRestante,
        valorParaVinculo,
        valorVinculadoLancamentos,
        clienteId: pedido.clienteId ?? clienteInfo.id ?? null,
        clienteNome,
        clienteDocumento: doc,
        clienteDocumentoLimpo: documentoLimpo,
        matchPercentual: Number(matchPercentual.toFixed(2)),
        raw: pedido,
      };
    })
    .filter((pedido) => {
      if (STATUS_PEDIDOS_FINALIZADOS.includes(pedido.status)) {
        return pedido.valorParaVinculo > TOLERANCIA;
      }
      return pedido.valorRestante > TOLERANCIA;
    });
};

const formatarCategoria = (categoria) => {
  if (!categoria) {
    return (
      <Tag color="#6b7280" style={{ borderRadius: 4, fontWeight: 500, border: 'none', width: 'fit-content' }}>
        -
      </Tag>
    );
  }

  const categoriaConfig = {
    PIX_RECEBIDO: { texto: 'PIX Recebido', cor: '#059669' },
    PIX_ENVIADO: { texto: 'PIX Enviado', cor: '#ef4444' },
    TRANSFERENCIA: { texto: 'Transferência', cor: '#3b82f6' },
  };

  const config = categoriaConfig[categoria] || { texto: categoria.replace(/_/g, ' '), cor: '#6b7280' };

  return (
    <Tag
      color={config.cor}
      style={{ borderRadius: 4, fontWeight: 500, border: 'none', width: 'fit-content' }}
    >
      {config.texto}
    </Tag>
  );
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
  const valorTotalLancamento = Number(lancamento?.valorLancamento ?? 0);
  const saldoRestanteLancamento = Number(
    lancamento?.saldoRestante ??
    lancamento?.saldo_restante ??
    lancamento?.valorDisponivel ??
    lancamento?.valorLancamento ??
    0,
  );
  const valorDisponivel = Number(
    lancamento?.valorDisponivel ??
    lancamento?.saldoRestante ??
    lancamento?.saldo_restante ??
    lancamento?.valorLancamento ??
    0,
  );

  const [busca, setBusca] = useState('');
  const [buscaDigitada, setBuscaDigitada] = useState('');
  const [pedidosFonte, setPedidosFonte] = useState(pedidosDisponiveis);
  const [usarBuscaPersonalizada, setUsarBuscaPersonalizada] = useState(false);
  const [buscandoPedidos, setBuscandoPedidos] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [resumo, setResumo] = useState({ totalSelecionado: 0, restante: valorDisponivel });
  const [vinculando, setVinculando] = useState(false);
  const [activeTab, setActiveTab] = useState('abertos');

  const resetSelecao = useCallback(() => {
    setSelectedSequence([]);
    setSelectedRowKeys([]);
    setAllocations({});
    setResumo({ totalSelecionado: 0, restante: valorDisponivel });
  }, [valorDisponivel]);

  useEffect(() => {
    if (!open) {
      setBusca('');
      setBuscaDigitada('');
      setPedidosFonte([]);
      setUsarBuscaPersonalizada(false);
      resetSelecao();
      setActiveTab('abertos');
    } else {
      resetSelecao();
      setPedidosFonte(pedidosDisponiveis);
      setUsarBuscaPersonalizada(false);
      setBuscaDigitada('');
    }
  }, [open, valorDisponivel, lancamento?.id, pedidosDisponiveis, resetSelecao]);

  useEffect(() => {
    if (!usarBuscaPersonalizada && open) {
      setPedidosFonte(pedidosDisponiveis);
    }
  }, [pedidosDisponiveis, usarBuscaPersonalizada, open]);

  const buscarPedidosPorSugestao = useCallback(async ({ clienteId = null, termo = '', tipo = null } = {}) => {
    setBuscandoPedidos(true);
    try {
      const params = {
        page: 1,
        limit: 200,
        status: STATUS_VINCULACAO.join(','),
      };

      if (clienteId) {
        params.clienteId = clienteId;
      }

      const termoLimpo = termo?.trim();
      if (termoLimpo) {
        params.search = termoLimpo;
      }

      if (tipo) {
        params.searchType = tipo;
      }

      const response = await axiosInstance.get('/api/pedidos', { params });
      let pedidosData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      if (!Array.isArray(pedidosData)) {
        pedidosData = [];
      }

      if (pedidosData.length === 0) {
        showNotification('info', 'Nenhum pedido encontrado', 'Não localizamos pedidos para o critério selecionado.');
      }

      setPedidosFonte(pedidosData);
      setUsarBuscaPersonalizada(true);
      resetSelecao();
      setActiveTab('abertos');
    } catch (error) {
      console.error('Erro ao buscar pedidos por sugestão:', error);
      showNotification('error', 'Erro', 'Não foi possível carregar pedidos para o critério selecionado.');
    } finally {
      setBuscandoPedidos(false);
    }
  }, [resetSelecao]);

  const buscarPedidosPorTermo = useCallback((termo) => {
    if (!termo || termo.trim().length < 2) {
      showNotification('warning', 'Busca curta demais', 'Informe ao menos 2 caracteres para buscar pedidos.');
      return;
    }

    const termoLimpo = termo.trim();
    setBusca(termoLimpo);
    setBuscaDigitada(termoLimpo);

    buscarPedidosPorSugestao({ termo: termoLimpo, tipo: null });
  }, [buscarPedidosPorSugestao]);

  const pedidosNormalizados = useMemo(
    () => preparePedidosParaVinculo(pedidosFonte, { lancamento, clientePadrao: cliente }),
    [pedidosFonte, lancamento, cliente],
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
        ? pedido.valorFinal?.toString().includes(termoBusca)
          || pedido.valorRestante?.toString().includes(termoBusca)
          || pedido.valorParaVinculo?.toString().includes(termoBusca)
        : false;
      const docMatch = termoDocumento ? pedido.clienteDocumentoLimpo?.includes(termoDocumento) : false;

      return (
        numeroMatch || clienteMatch || statusMatch || valorMatch || docMatch
      );
    });
  }, [pedidosNormalizados, termoBusca, termoDocumento]);

  const pedidosPorTipo = useMemo(() => {
    const abertos = [];
    const finalizados = [];

    pedidosFiltrados.forEach((pedido) => {
      if (STATUS_PEDIDOS_FINALIZADOS.includes(pedido.status)) {
        finalizados.push(pedido);
        return;
      }

      if (STATUS_PEDIDOS_ABERTOS.includes(pedido.status)) {
        abertos.push(pedido);
        return;
      }

      abertos.push(pedido);
    });

    return { abertos, finalizados };
  }, [pedidosFiltrados]);

  const sugestoesInteligentes = useMemo(
    () => gerarCombinacoesInteligentes(pedidosPorTipo.abertos, valorDisponivel),
    [pedidosPorTipo.abertos, valorDisponivel],
  );

  useEffect(() => {
    if (activeTab === 'abertos' && pedidosPorTipo.abertos.length === 0 && pedidosPorTipo.finalizados.length > 0) {
      setActiveTab('finalizados');
    } else if (activeTab === 'finalizados' && pedidosPorTipo.finalizados.length === 0 && pedidosPorTipo.abertos.length > 0) {
      setActiveTab('abertos');
    }
  }, [activeTab, pedidosPorTipo]);

  const calcularAlocacoes = useCallback((sequencia) => {
    let restante = valorDisponivel;
    const alocacoes = {};
    const sequenciaValida = [];

    sequencia.forEach((id) => {
      const pedido = pedidosMap.get(id);
      if (!pedido) {
        return;
      }

    const saldo = Number(
      (pedido.valorParaVinculo ?? pedido.valorRestante ?? 0)
    );
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

  const handleSugestaoPedidoClick = useCallback((pedidoId) => {
    if (!pedidosMap.has(pedidoId)) {
      return;
    }

    const jaSelecionado = selectedSequence.includes(pedidoId);
    const novaSequencia = jaSelecionado
      ? selectedSequence.filter((id) => id !== pedidoId)
      : [...selectedSequence, pedidoId];

    const { sequenciaValida } = atualizarSelecao(novaSequencia);

    if (!jaSelecionado && !sequenciaValida.includes(pedidoId)) {
      message.warning('Esse pedido excede o valor disponível do lançamento.');
    }
  }, [atualizarSelecao, pedidosMap, selectedSequence]);

  const handleBuscaInteligenteSelect = useCallback((suggestion) => {
    if (!suggestion || suggestion.type === 'no-results' || suggestion.type === 'error') {
      return;
    }

    let termoBusca = '';
    let tipoBusca = null;
    let clienteId = null;
    let displayTerm = suggestion.value || '';

    switch (suggestion.type) {
      case 'cliente':
        if (suggestion.metadata?.id) {
          clienteId = suggestion.metadata.id;
        }
        if (suggestion.metadata?.nome) {
          displayTerm = capitalizeName(suggestion.metadata.nome);
        } else if (suggestion.value) {
          displayTerm = capitalizeName(suggestion.value);
        }
        termoBusca = '';
        tipoBusca = null;
        break;
      case 'numero':
      case 'pedido':
        termoBusca = String(suggestion.metadata?.numeroPedido ?? suggestion.metadata?.id ?? suggestion.value ?? '').trim();
        displayTerm = termoBusca;
        tipoBusca = 'numero';
        break;
      case 'documento':
      case 'cliente_documento':
      case 'cpf':
      case 'cnpj':
        termoBusca = String(suggestion.metadata?.documentoLimpo ?? suggestion.value ?? '').replace(/\D/g, '');
        displayTerm = termoBusca;
        tipoBusca = termoBusca.length > 0 ? 'documento' : null;
        break;
      default:
        termoBusca = suggestion.value || '';
        displayTerm = suggestion.value || '';
        break;
    }

    setBusca(displayTerm);
    setBuscaDigitada(displayTerm);

    buscarPedidosPorSugestao({ clienteId, termo: termoBusca, tipo: tipoBusca });
  }, [buscarPedidosPorSugestao]);

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
      width: 140,
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
      title: 'Dt. Pedido',
      dataIndex: 'dataPedido',
      key: 'dataPedido',
      width: 95,
      align: 'center',
      render: (_, record) => {
        const raw = record.dataPedido;
        if (raw == null) return '-';
        const str = typeof raw === 'string' ? raw : (typeof raw?.toISOString === 'function' ? raw.toISOString() : String(raw));
        return formatarDataSemTimezone(str);
      },
    },
    {
      title: 'Cliente',
      dataIndex: 'clienteNome',
      key: 'clienteNome',
      width: 170,
      align: 'left',
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (nome, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserOutlined />
            <Text>{capitalizeName(nome)}</Text>
          </div>
          {record.clienteDocumento && (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.clienteDocumento}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Nota Fiscal',
      dataIndex: 'numeroNf',
      key: 'numeroNf',
      width: 100,
      align: 'center',
      render: (value) => value ? `#${value}` : '-',
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorFinal',
      key: 'valorFinal',
      width: 100,
      align: 'center',
      render: (value) => formatarValorMonetario(value),
    },
    {
      title: 'Recebido',
      dataIndex: 'valorRecebido',
      key: 'valorRecebido',
      width: 100,
      align: 'center',
      render: (value) => formatarValorMonetario(value),
    },
    {
      title: 'Base p/ vínculo',
      key: 'valorReferencia',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const isFinalizado = STATUS_PEDIDOS_FINALIZADOS.includes(record.status);
        const valorReferencia = Number(
          isFinalizado
            ? (record.valorParaVinculo ?? 0)
            : (record.valorRestante ?? 0)
        );
        const tagColor = isFinalizado
          ? '#0ea5e9'
          : valorReferencia <= valorDisponivel
            ? 'green'
            : 'orange';
        const tooltipLabel = isFinalizado
          ? `Valor final: ${formatarValorMonetario(record.valorFinal || 0)}\n` +
            `Vínculos existentes: ${formatarValorMonetario(record.valorVinculadoLancamentos || 0)}\n` +
            `Disponível para novo vínculo: ${formatarValorMonetario(valorReferencia)}`
          : `Saldo devedor atual: ${formatarValorMonetario(valorReferencia)}`;

        return (
          <Tooltip title={<pre style={{ margin: 0 }}>{tooltipLabel}</pre>}>
            <Tag color={tagColor} style={{ fontSize: 12 }}>
              {formatarValorMonetario(valorReferencia)}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Valor a Vincular',
      key: 'valorVincular',
      width: 110,
      align: 'center',
      render: (_, record) => allocations[record.id]
        ? <Text strong style={{ color: '#059669' }}>{formatarValorMonetario(allocations[record.id])}</Text>
        : <Text type="secondary">-</Text>,
    },
    {
      title: 'Match',
      dataIndex: 'matchPercentual',
      key: 'matchPercentual',
      width: 90,
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

  const tabelaLoading = loadingPedidos || vinculando || buscandoPedidos;

  const renderTabelaPedidos = useCallback(
    (dataSource, options = {}) => {
      const { exibirSugestoes = false } = options;
      const combinacoes = sugestoesInteligentes;
      const possuiSugestoes =
        (combinacoes?.perfeitas?.length || 0) > 0 ||
        (combinacoes?.parciais?.length || 0) > 0;

      return (
        <>
          {exibirSugestoes && (
            <Card
              size="small"
              style={{
                marginBottom: 12,
                border: '1px dashed #bae6fd',
                backgroundColor: '#f0f9ff',
              }}
              bodyStyle={{ padding: 12 }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space align="center" size={8}>
                  <BulbOutlined style={{ color: '#0369a1' }} />
                  <Text strong style={{ color: '#03506d' }}>
                    Sugestões inteligentes para {formatarValorMonetario(valorDisponivel)}
                  </Text>
                </Space>
                {possuiSugestoes ? (
                  <>
                    {combinacoes.perfeitas.length > 0 && (
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Text strong style={{ color: '#006d32' }}>Match perfeito</Text>
                        {combinacoes.perfeitas.map((combo, index) => (
                          <Card
                            key={`combo-perfeito-${index}`}
                            size="small"
                            style={{ borderColor: '#34d399', backgroundColor: '#ecfdf5' }}
                            bodyStyle={{ padding: 10 }}
                          >
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Space wrap size={[4, 6]}>
                                {combo.pedidos.map((pedido) => {
                                  const selecionado = selectedRowKeys.includes(pedido.id);
                                  return (
                                    <Tag
                                      key={`combo-perfeito-${index}-${pedido.id}`}
                                      color="success"
                                      onClick={() => handleSugestaoPedidoClick(pedido.id)}
                                      style={{
                                        borderRadius: 999,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        border: selecionado ? '1px solid #047857' : '1px dashed #34d399',
                                        backgroundColor: selecionado ? '#16a34a' : '#ecfdf5',
                                        color: selecionado ? '#f0fdf4' : '#047857',
                                        transition: 'all 0.2s ease',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <LinkOutlined style={{ fontSize: 12 }} />
                                      {selecionado && <CheckOutlined style={{ fontSize: 12 }} />}
                                      #{pedido.numeroPedido || pedido.id} • {formatarValorMonetario(pedido.valorRestante)}
                                    </Tag>
                                  );
                                })}
                              </Space>
                              <Text style={{ fontSize: 12, color: '#065f46' }}>
                                Total: {formatarValorMonetario(combo.valorTotal)} • Match 100%
                              </Text>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )}
                    {combinacoes.parciais.length > 0 && (
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Text strong style={{ color: '#92400e' }}>Match parcial (±10%)</Text>
                        {combinacoes.parciais.map((combo, index) => (
                          <Card
                            key={`combo-parcial-${index}`}
                            size="small"
                            style={{ borderColor: '#fcd34d', backgroundColor: '#fffbeb' }}
                            bodyStyle={{ padding: 10 }}
                          >
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Space wrap size={[4, 6]}>
                                {combo.pedidos.map((pedido) => {
                                  const selecionado = selectedRowKeys.includes(pedido.id);
                                  return (
                                    <Tag
                                      key={`combo-parcial-${index}-${pedido.id}`}
                                      color="gold"
                                      onClick={() => handleSugestaoPedidoClick(pedido.id)}
                                      style={{
                                        borderRadius: 999,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        border: selecionado ? '1px solid #047857' : '1px dashed #fcd34d',
                                        backgroundColor: selecionado ? '#16a34a' : '#fffbeb',
                                        color: selecionado ? '#f0fdf4' : '#92400e',
                                        transition: 'all 0.2s ease',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <LinkOutlined style={{ fontSize: 12 }} />
                                      {selecionado && <CheckOutlined style={{ fontSize: 12 }} />}
                                      #{pedido.numeroPedido || pedido.id} • {formatarValorMonetario(pedido.valorRestante)}
                                    </Tag>
                                  );
                                })}
                              </Space>
                              <Text style={{ fontSize: 12, color: '#92400e' }}>
                                Total: {formatarValorMonetario(combo.valorTotal)} • Match {combo.matchPercentual.toFixed(2)}%
                                {combo.diferenca !== 0 && (
                                  <> • Diferença de {formatarValorMonetario(Math.abs(combo.diferenca))} {combo.diferenca > 0 ? 'abaixo' : 'acima'}</>
                                )}
                              </Text>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    O filtro inteligente não encontrou combinações ideais para este lançamento.
                  </Text>
                )}
              </Space>
            </Card>
          )}

          <ResponsiveTable
            rowKey="id"
            columns={columns}
            dataSource={[...dataSource].sort((a, b) => (b.matchPercentual || 0) - (a.matchPercentual || 0))}
            loading={tabelaLoading}
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
        </>
      );
    },
    [
      columns,
      handleSelect,
      handleSelectAll,
      loadingPedidos,
      selectedRowKeys,
      tabelaLoading,
      tabelaPaginacao,
      tableComponents,
      sugestoesInteligentes,
      valorDisponivel,
      handleSugestaoPedidoClick,
    ],
  );

  const tabItems = useMemo(
    () => [
      {
        key: 'abertos',
        label: (
          <Space size={6}>
            <Text strong style={{ fontSize: '0.85rem', color: '#047857' }}>Pedidos abertos</Text>
            <Tag color="#bbf7d0" style={{ color: '#047857', border: 'none', borderRadius: 999 }}>
              {pedidosPorTipo.abertos.length}
            </Tag>
          </Space>
        ),
        children: renderTabelaPedidos(pedidosPorTipo.abertos, { exibirSugestoes: true }),
      },
      {
        key: 'finalizados',
        label: (
          <Space size={6}>
            <Text strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Finalizados / Pagos</Text>
            <Tag color="#dbeafe" style={{ color: '#1e3a8a', border: 'none', borderRadius: 999 }}>
              {pedidosPorTipo.finalizados.length}
            </Tag>
          </Space>
        ),
        children: renderTabelaPedidos(pedidosPorTipo.finalizados),
      },
    ],
    [pedidosPorTipo, renderTabelaPedidos],
  );

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
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? 'Valor total' : 'Valor total do lançamento'}
              value={formatCurrency(valorTotalLancamento)}
              valueStyle={{ color: '#059669', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#059669' }} />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? 'Saldo no sistema' : 'Saldo restante no sistema'}
              value={formatCurrency(saldoRestanteLancamento)}
              valueStyle={{ color: '#0ea5e9', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#0ea5e9' }} />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="Data"
              value={lancamento?.dataLancamento ? formatarDataBR(lancamento.dataLancamento) : '-'}
              valueStyle={{ color: '#1f2937', fontSize: isMobile ? '0.95rem' : '1.1rem' }}
              prefix={<CalendarOutlined style={{ color: '#059669' }} />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="Categoria"
              value={lancamento?.categoriaOperacao || '-'}
              valueRender={() => formatarCategoria(lancamento?.categoriaOperacao)}
            />
          </Col>
        </Row>
        <Row gutter={[12, 12]} style={{ marginTop: isMobile ? 12 : 16 }}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: '#666666' }}>
                <UserOutlined style={{ marginRight: 4, color: '#059669' }} /> Origem
              </Text>
              <Text style={{ fontSize: 14 }}>
                {lancamento?.nomeContrapartida || '-'}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: '#666666' }}>
                <InfoCircleOutlined style={{ marginRight: 4, color: '#059669' }} /> Descrição
              </Text>
              <Text style={{ fontSize: 14 }}>
                {lancamento?.textoDescricaoHistorico || '-'}
              </Text>
            </Space>
          </Col>
        </Row>
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
        <SearchInputInteligente
          placeholder="Buscar por número do pedido, cliente ou documento (CPF/CNPJ)"
          value={buscaDigitada}
          onChange={setBuscaDigitada}
          onSuggestionSelect={handleBuscaInteligenteSelect}
          onSearch={buscarPedidosPorTermo}
          loading={buscandoPedidos}
          allowedTypes={['cliente', 'numero', 'pedido', 'documento', 'cliente_documento', 'cpf', 'cnpj']}
          style={{ marginBottom: isMobile ? 12 : 16 }}
        />

        <Spin
          spinning={tabelaLoading}
          tip={
            vinculando
              ? 'Vinculando pagamentos...'
              : buscandoPedidos
                ? 'Buscando pedidos...'
                : undefined
          }
        >
          <StyledTabs
            type="card"
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </Spin>
      </Card>

      <Card
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}>
              Estatísticas da seleção
            </span>
          </Space>
        }
        style={{
          marginTop: isMobile ? 12 : 16,
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
          body: {
            padding: isMobile ? '12px' : '16px',
          },
        }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={isMobile ? 'Disponível' : 'Disponível para vincular'}
              value={formatarValorMonetario(valorDisponivel)}
              valueStyle={{ color: '#22c55e', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#22c55e' }} />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="Selecionado"
              value={formatarValorMonetario(resumo.totalSelecionado)}
              valueStyle={{ color: '#0ea5e9', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: '#0ea5e9' }} />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="Saldo após seleção"
              value={formatarValorMonetario(Math.max(resumo.restante, 0))}
              valueStyle={{ color: resumo.restante <= TOLERANCIA ? '#84cc16' : '#f59e0b', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<DollarOutlined style={{ color: resumo.restante <= TOLERANCIA ? '#84cc16' : '#f59e0b' }} />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="Pedidos selecionados"
              value={selectedSequence.length}
              valueStyle={{ color: '#6366f1', fontSize: isMobile ? '1rem' : '1.25rem' }}
              prefix={<LinkOutlined style={{ color: '#6366f1' }} />}
            />
          </Col>
        </Row>
        {resumo.totalSelecionado > valorDisponivel && (
          <Alert
            message="Seleção excede o valor disponível deste lançamento."
            type="warning"
            showIcon
            style={{ marginTop: isMobile ? 12 : 16 }}
          />
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: isMobile ? 8 : 12,
            marginTop: isMobile ? 12 : 16,
            flexWrap: 'wrap',
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
      </Card>
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










