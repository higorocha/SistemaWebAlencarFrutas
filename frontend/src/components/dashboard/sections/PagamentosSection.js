import React from 'react';
import { Typography, Button, List, Avatar, Tag, Input, DatePicker, Tooltip, Row, Col } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SwapOutlined,
  FilterOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import { Icon } from '@iconify/react';
import { styled } from 'styled-components';
import useResponsive from '../../../hooks/useResponsive';
import { capitalizeName, intFormatter, formatarDataBR } from '../../../utils/formatters';
import StyledTabs from '../../common/StyledTabs';
import FornecedorColheitaPagamentosModal from '../FornecedorColheitaPagamentosModal';
import FornecedorColheitaPagamentosEfetuadosModal from '../FornecedorColheitaPagamentosEfetuadosModal';
import TurmaColheitaPagamentosModal from '../TurmaColheitaPagamentosModal';
import TurmaColheitaPagamentosEfetuadosModal from '../TurmaColheitaPagamentosEfetuadosModal';

import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CardStyled = styled.div`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.05);
  background: white;
  padding: ${(props) => (props.$isMobile ? '12px' : '16px')};
  height: 100%;
  transition: transform 0.2s ease-in-out, width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
  }
`;

// Animação global para cards
const GlobalCardAnimations = styled.div`
  @keyframes fadeInScale {
    from {
      opacity: 0.8;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const PaymentTabs = styled(StyledTabs)`
  .ant-tabs-tab {
    .tab-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #047857;
      font-weight: 600;
      font-size: 14px;
      transition: color 0.2s ease;
    }

    .tab-icon {
      font-size: 20px;
    }
  }

  .ant-tabs-tab-active {
    .tab-label {
      color: #065f46;
      font-weight: 700;
    }
  }
`;

const PagamentosSection = ({
  modoPagamentos,
  dadosPagamentosAtuais = [],
  dadosFornecedores = [],
  dadosFornecedoresEfetuados = [],
  loadingPagamentosEfetuados,
  erroPagamentosEfetuados,
  onToggleModo,
  onTentarNovamente,
  onPagamentosProcessados,
  isExpandido = false,
  onToggleExpandir,
}) => {
  const { isMobile } = useResponsive();
  const isModoPendentes = modoPagamentos === 'pendentes';
  const [activeTab, setActiveTab] = React.useState('turmas');
  const [mostrarFiltrosTurma, setMostrarFiltrosTurma] = React.useState(false);
  const [buscaTurmas, setBuscaTurmas] = React.useState('');
  const [rangeDatasTurmas, setRangeDatasTurmas] = React.useState(null);
  // Estado interno para controlar modo de fornecedores (pendentes/efetuados)
  const [modoFornecedores, setModoFornecedores] = React.useState('pendentes');
  
  // Estados dos modais - todos gerenciados internamente
  const [modalFornecedor, setModalFornecedor] = React.useState({
    open: false,
    fornecedor: null,
  });
  
  const [modalPagamentos, setModalPagamentos] = React.useState({
    open: false,
    turmaId: null,
    turmaNome: null,
  });
  
  const [modalPagamentosEfetuados, setModalPagamentosEfetuados] = React.useState({
    open: false,
    turmaId: null,
    turmaNome: null,
    dataPagamento: null,
  });
  
  const [modalFornecedorEfetuados, setModalFornecedorEfetuados] = React.useState({
    open: false,
    fornecedorId: null,
    fornecedorNome: null,
    dataPagamento: null,
  });

  const headerTitle = '💰 Pagamentos';

  const contentHeight = isMobile ? '380px' : '460px';

  const filtrosAplicadosTurmas = React.useMemo(() => {
    const termoAtivo = Boolean(buscaTurmas.trim());
    const rangeAtivo =
      Array.isArray(rangeDatasTurmas) &&
      rangeDatasTurmas.length === 2 &&
      rangeDatasTurmas[0] &&
      rangeDatasTurmas[1];

    return termoAtivo || rangeAtivo;
  }, [buscaTurmas, rangeDatasTurmas]);

  const handleLimparFiltrosTurmas = React.useCallback(() => {
    setBuscaTurmas('');
    setRangeDatasTurmas(null);
  }, []);

  const getDataReferenciaTurma = React.useCallback(
    (registro) => {
      if (!registro) {
        return null;
      }

      if (isModoPendentes) {
        if (registro.dataCadastro) {
          return registro.dataCadastro;
        }
        const detalheComData = registro.detalhes?.find((detalhe) => detalhe?.dataColheita);
        return detalheComData?.dataColheita || null;
      }

      return registro.dataPagamento || registro.dataCadastro || null;
    },
    [isModoPendentes]
  );

  const dadosFiltradosTurmas = React.useMemo(() => {
    if (!Array.isArray(dadosPagamentosAtuais) || dadosPagamentosAtuais.length === 0) {
      return Array.isArray(dadosPagamentosAtuais) ? dadosPagamentosAtuais : [];
    }

    const termo = buscaTurmas.trim().toLowerCase();
    const rangeAtivo =
      Array.isArray(rangeDatasTurmas) &&
      rangeDatasTurmas.length === 2 &&
      rangeDatasTurmas[0] &&
      rangeDatasTurmas[1];

    const inicio = rangeAtivo ? rangeDatasTurmas[0].clone().startOf('day') : null;
    const fim = rangeAtivo ? rangeDatasTurmas[1].clone().endOf('day') : null;

    return dadosPagamentosAtuais.filter((item) => {
      if (termo) {
        const nomeMatch = item.nomeColhedor?.toLowerCase().includes(termo);
        const chavePixMatch = item.chavePix?.toLowerCase().includes(termo);
        const detalhesMatch = item.detalhes?.some((detalhe) => {
          if (!detalhe) {
            return false;
          }
          const campos = [
            detalhe.pedidoNumero,
            detalhe.cliente,
            detalhe.fruta,
            detalhe.areaNome,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return campos.includes(termo);
        });

        if (!nomeMatch && !chavePixMatch && !detalhesMatch) {
          return false;
        }
      }

      if (rangeAtivo) {
        const dataReferencia = getDataReferenciaTurma(item);
        if (!dataReferencia) {
          return false;
        }
        const dataMoment = moment(dataReferencia);
        if (!dataMoment.isValid()) {
          return false;
        }
        if (!dataMoment.isBetween(inicio, fim, undefined, '[]')) {
          return false;
        }
      }

      return true;
    });
  }, [dadosPagamentosAtuais, buscaTurmas, rangeDatasTurmas, getDataReferenciaTurma]);

  // Handlers para modais de turmas - movidos para antes do renderTurmasContent
  const handleAbrirModalPagamentos = React.useCallback((turmaId, turmaNome) => {
    setModalPagamentos({
      open: true,
      turmaId,
      turmaNome,
    });
  }, []);

  const handleAbrirModalPagamentosEfetuados = React.useCallback((turmaId, turmaNome, dataPagamento) => {
    setModalPagamentosEfetuados({
      open: true,
      turmaId,
      turmaNome,
      dataPagamento,
    });
  }, []);

  const renderTurmasContent = React.useCallback(() => {
    const totalOriginal = Array.isArray(dadosPagamentosAtuais) ? dadosPagamentosAtuais.length : 0;
    const totalFiltrado = dadosFiltradosTurmas.length;
    const semResultadosFiltrados = totalOriginal > 0 && totalFiltrado === 0 && filtrosAplicadosTurmas;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: contentHeight,
          position: 'relative',
        }}
      >
        {mostrarFiltrosTurma && (
          <div
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: isMobile ? '10px' : '14px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '8px' : '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '4px' : '0',
              }}
            >
              <Text style={{ fontWeight: 600, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FilterOutlined />
                Filtros de turmas
              </Text>
              {filtrosAplicadosTurmas && (
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={handleLimparFiltrosTurmas}
                  style={{ color: '#d46b08', padding: 0 }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '10px' : '12px',
              }}
            >
              <div style={{ flex: isMobile ? 1 : 1.6, minWidth: 0 }}>
                <Text style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: '#555' }}>
                  Buscar colhedor / pedido
                </Text>
                <Input
                  placeholder="Digite nome, pedido, cliente ou fruta"
                  value={buscaTurmas}
                  onChange={(e) => setBuscaTurmas(e.target.value)}
                  allowClear
                  size={isMobile ? 'middle' : 'large'}
                  prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                />
              </div>

              <div style={{ flex: isMobile ? 1 : 1, minWidth: isMobile ? 0 : '180px', maxWidth: isMobile ? '100%' : '260px' }}>
                <Text style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: '#555' }}>
                  Período de referência
                </Text>
                <RangePicker
                  value={rangeDatasTurmas}
                  onChange={(values) => {
                    if (!values || values.length < 2 || !values[0] || !values[1]) {
                      setRangeDatasTurmas(null);
                    } else {
                      setRangeDatasTurmas([values[0].clone(), values[1].clone()]);
                    }
                  }}
                  allowClear
                  size={isMobile ? 'middle' : 'large'}
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  getPopupContainer={(trigger) => trigger?.parentNode || undefined}
                />
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '200px',
          }}
        >
          {totalOriginal === 0 && !loadingPagamentosEfetuados && !erroPagamentosEfetuados ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8c8c8c' }}>
            <CheckCircleOutlined style={{ fontSize: '3rem', marginBottom: '1rem', color: '#52c41a' }} />
            <div>{isModoPendentes ? 'Nenhum pagamento pendente' : 'Nenhum pagamento efetuado'}</div>
            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
              {isModoPendentes
                ? 'Todos os colheitadores estão em dia'
                : 'Ainda não há registros de pagamentos realizados'}
            </Text>
          </div>
        ) : loadingPagamentosEfetuados ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              zIndex: 1000,
              borderRadius: '8px',
              padding: '32px',
              height: '100%',
            }}
          >
            <SyncOutlined spin style={{ fontSize: '2rem', color: '#059669' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#059669', fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Carregando pagamentos efetuados...
              </div>
            </div>
          </div>
        ) : erroPagamentosEfetuados ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 20px',
              color: '#ff4d4f',
              textAlign: 'center',
            }}
          >
            <WarningOutlined style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }} />
            <span style={{ marginBottom: '12px' }}>{erroPagamentosEfetuados}</span>
            <Button
              size="small"
              onClick={onTentarNovamente}
              style={{
                color: '#059669',
                borderColor: '#059669',
              }}
            >
              Tentar Novamente
            </Button>
          </div>
        ) : semResultadosFiltrados ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#8c8c8c',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <SearchOutlined style={{ fontSize: '2rem', color: '#9ca3af' }} />
            <div style={{ fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>
              Nenhum resultado encontrado para os filtros aplicados
            </div>
            <Text style={{ fontSize: '0.75rem' }}>
              Ajuste os critérios de busca ou limpe os filtros para visualizar todas as turmas.
            </Text>
            <Button
              type="primary"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={handleLimparFiltrosTurmas}
              style={{
                backgroundColor: '#059669',
                borderColor: '#047857',
                borderRadius: '6px',
              }}
            >
              Limpar filtros
            </Button>
          </div>
        ) : dadosFiltradosTurmas.length > 0 ? (
          isExpandido ? (
            // Layout expandido: 4 colunas
            <Row gutter={[16, 16]} style={{ margin: 0, width: '100%' }}>
              {dadosFiltradosTurmas.map((item, index) => (
                <Col xs={24} sm={12} lg={6} key={item.id} style={{ maxWidth: '100%' }}>
                  <div
                    style={{
                      padding: isMobile ? '12px' : '16px',
                      border: '1px solid #f0f0f0',
                      backgroundColor: isModoPendentes
                        ? item.totalPendente > 1000
                          ? '#fff7e6'
                          : 'transparent'
                        : '#f6ffed',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      boxSizing: 'border-box',
                      animation: `fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
                    }}
                    onClick={
                      isModoPendentes
                        ? () => handleAbrirModalPagamentos(item.id, item.nomeColhedor)
                        : () => {
                            const turmaId = parseInt(item.id.split('-')[0], 10);
                            handleAbrirModalPagamentosEfetuados(turmaId, item.nomeColhedor, item.dataPagamento);
                          }
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <Avatar
                        style={{
                          backgroundColor: isModoPendentes
                            ? item.totalPendente > 1000
                              ? '#fa8c16'
                              : item.totalPendente > 500
                              ? '#faad14'
                              : '#52c41a'
                            : '#52c41a',
                          color: 'white',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 'bold',
                          marginRight: '12px',
                        }}
                        size={isMobile ? 40 : 48}
                      >
                        {item.nomeColhedor
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            fontWeight: '700',
                            color: isModoPendentes
                              ? item.totalPendente > 1000
                                ? '#d46b08'
                                : '#333'
                              : '#333',
                            lineHeight: '1.3',
                            marginBottom: '4px',
                          }}
                        >
                          {capitalizeName(item.nomeColhedor)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>
                          📦 {item.quantidadePedidos} pedido{item.quantidadePedidos > 1 ? 's' : ''} • {item.quantidadeFrutas} fruta{item.quantidadeFrutas > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    {!isModoPendentes && (
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginBottom: '8px' }}>
                        💰 Pago em: {formatarDataBR(item.dataPagamento)}
                      </div>
                    )}
                    {item.chavePix && (
                      <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace', marginBottom: '12px', wordBreak: 'break-all' }}>
                        PIX: {item.chavePix.length > 30 ? `${item.chavePix.substring(0, 30)}...` : item.chavePix}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        style={{
                          color: isModoPendentes
                            ? item.totalPendente > 1000
                              ? '#d46b08'
                              : item.totalPendente > 500
                              ? '#faad14'
                              : '#52c41a'
                            : '#52c41a',
                          fontWeight: '700',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          lineHeight: '1.2',
                        }}
                      >
                        R${' '}
                        {(isModoPendentes ? item.totalPendente : item.totalPago).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <Tag
                        color={
                          isModoPendentes
                            ? item.detalhes?.some(det => det.statusPagamento === 'PROCESSANDO')
                              ? 'gold'
                              : item.totalPendente > 1000
                              ? 'orange'
                              : item.totalPendente > 500
                              ? 'gold'
                              : 'green'
                            : 'green'
                        }
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {isModoPendentes
                          ? item.detalhes?.some(det => det.statusPagamento === 'PROCESSANDO')
                            ? 'PROCESSANDO'
                            : item.totalPendente > 1000
                            ? 'ALTO'
                            : item.totalPendente > 500
                            ? 'MÉDIO'
                            : 'BAIXO'
                          : 'PAGO'}
                      </Tag>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            // Layout normal: List vertical
            <List
              itemLayout="horizontal"
              dataSource={dadosFiltradosTurmas}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: isMobile ? '8px 6px' : '12px 8px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: isModoPendentes
                      ? item.totalPendente > 1000
                        ? '#fff7e6'
                        : 'transparent'
                      : '#f6ffed',
                    borderRadius: '6px',
                    margin: isMobile ? '2px 0' : '4px 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '56px' : '72px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={
                    isModoPendentes
                      ? () => handleAbrirModalPagamentos(item.id, item.nomeColhedor)
                      : () => {
                          const turmaId = parseInt(item.id.split('-')[0], 10);
                          handleAbrirModalPagamentosEfetuados(turmaId, item.nomeColhedor, item.dataPagamento);
                        }
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: isModoPendentes
                            ? item.totalPendente > 1000
                              ? '#fa8c16'
                              : item.totalPendente > 500
                              ? '#faad14'
                              : '#52c41a'
                            : '#52c41a',
                          color: 'white',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 'bold',
                        }}
                        size={isMobile ? 32 : 40}
                      >
                        {item.nomeColhedor
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </Avatar>
                    }
                    title={
                      <div
                        style={{
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          fontWeight: '700',
                          color: isModoPendentes
                            ? item.totalPendente > 1000
                              ? '#d46b08'
                              : '#333'
                            : '#333',
                          lineHeight: '1.3',
                          marginBottom: '2px',
                        }}
                      >
                        {capitalizeName(item.nomeColhedor)}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#555', lineHeight: '1.4' }}>
                        <div style={{ marginBottom: isMobile ? '2px' : '4px', fontWeight: '500' }}>
                          📦 {item.quantidadePedidos} pedido{item.quantidadePedidos > 1 ? 's' : ''} •
                          {item.quantidadeFrutas} fruta{item.quantidadeFrutas > 1 ? 's' : ''}
                        </div>
                        {!isModoPendentes && (
                          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                            💰 Pago em: {formatarDataBR(item.dataPagamento)}
                          </div>
                        )}
                        {!isMobile && item.chavePix && (
                          <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            PIX: {item.chavePix}
                          </div>
                        )}
                      </div>
                    }
                  />
                  <div style={{ textAlign: 'right', fontSize: isMobile ? '0.6875rem' : '0.8125rem' }}>
                    <div
                      style={{
                        color: isModoPendentes
                          ? item.totalPendente > 1000
                            ? '#d46b08'
                            : item.totalPendente > 500
                            ? '#faad14'
                            : '#52c41a'
                          : '#52c41a',
                        fontWeight: '700',
                        marginBottom: isMobile ? '4px' : '8px',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        lineHeight: '1.2',
                      }}
                    >
                      R${' '}
                      {(isModoPendentes ? item.totalPendente : item.totalPago).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <Tag
                      color={
                        isModoPendentes
                          ? item.detalhes?.some(det => det.statusPagamento === 'PROCESSANDO')
                            ? 'gold'
                            : item.totalPendente > 1000
                            ? 'orange'
                            : item.totalPendente > 500
                            ? 'gold'
                            : 'green'
                          : 'green'
                      }
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {isModoPendentes
                        ? item.detalhes?.some(det => det.statusPagamento === 'PROCESSANDO')
                          ? 'PROCESSANDO'
                          : item.totalPendente > 1000
                          ? 'ALTO'
                          : item.totalPendente > 500
                          ? 'MÉDIO'
                          : 'BAIXO'
                        : 'PAGO'}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          )
        ) : null}
        </div>

        {dadosFiltradosTurmas.length > 0 && (
        <div
          style={{
            marginTop: 'auto',
            padding: '12px 0 0 0',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
            <Text style={{ fontSize: '0.6875rem', color: '#999', maxWidth: '60%' }}>
              {isModoPendentes
                ? `${dadosFiltradosTurmas.length} colhedor${dadosFiltradosTurmas.length > 1 ? 'es' : ''} com ${'\u00A0'}pagamento${dadosFiltradosTurmas.length > 1 ? 's' : ''} pendente${dadosFiltradosTurmas.length > 1 ? 's' : ''}`
                : `${dadosFiltradosTurmas.length} pagamento${dadosFiltradosTurmas.length > 1 ? 's' : ''} realizado${dadosFiltradosTurmas.length > 1 ? 's' : ''}`}
            </Text>
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '4px' : '8px',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}
          >
            {isModoPendentes ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#fa8c16', borderRadius: '50%' }} />
                  <Text style={{ fontSize: '0.5625rem', color: '#666' }}>{isMobile ? '>R$1k' : 'Alto'}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#faad14', borderRadius: '50%' }} />
                  <Text style={{ fontSize: '0.5625rem', color: '#666' }}>{isMobile ? 'R$500+' : 'Médio'}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }} />
                  <Text style={{ fontSize: '0.5625rem', color: '#666' }}>{isMobile ? '<R$500' : 'Baixo'}</Text>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }} />
                <Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                  {isMobile ? 'Concluídos' : 'Pagamentos concluídos'}
                </Text>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    );
  }, [
    contentHeight,
    dadosPagamentosAtuais,
    dadosFiltradosTurmas,
    erroPagamentosEfetuados,
    filtrosAplicadosTurmas,
    handleLimparFiltrosTurmas,
    rangeDatasTurmas,
    buscaTurmas,
    isModoPendentes,
    isMobile,
    loadingPagamentosEfetuados,
    mostrarFiltrosTurma,
    onTentarNovamente,
    isExpandido,
    handleAbrirModalPagamentos,
    handleAbrirModalPagamentosEfetuados,
  ]);

  // Handlers para modais - todos padronizados com renderização condicional
  const handleAbrirFornecedor = React.useCallback((fornecedor) => {
    setModalFornecedor({
      open: true,
      fornecedor,
    });
  }, []);

  const handleFecharFornecedor = React.useCallback(() => {
    setModalFornecedor({
      open: false,
      fornecedor: null,
    });
  }, []);

  const handlePagamentosFornecedorCriados = React.useCallback(() => {
    // IMPORTANTE: Não recarregar dados do Dashboard imediatamente
    // O modal já atualiza seus próprios dados internamente
    // Recarregar o Dashboard pode causar re-render que fecha o modal
    // 
    // Se necessário atualizar o Dashboard, fazer de forma assíncrona/atrasada
    // ou apenas quando o modal for fechado manualmente
    // 
    // Por enquanto, não chamar onPagamentosProcessados para manter modal aberto
    // if (onPagamentosProcessados) {
    //   onPagamentosProcessados();
    // }
    
    // NÃO fechar o modal - manter aberto para continuar trabalhando
    // handleFecharFornecedor(); // Removido para manter modal aberto
  }, []);

  const handleFecharModalPagamentos = React.useCallback((houvePagamentos = false) => {
    setModalPagamentos({
      open: false,
      turmaId: null,
      turmaNome: null,
    });
    // Notificar Dashboard se houve pagamentos processados
    if (houvePagamentos && onPagamentosProcessados) {
      onPagamentosProcessados();
    }
  }, [onPagamentosProcessados]);

  const handleFecharModalPagamentosEfetuados = React.useCallback(() => {
    setModalPagamentosEfetuados({
      open: false,
      turmaId: null,
      turmaNome: null,
      dataPagamento: null,
    });
  }, []);

  const handleAbrirModalFornecedorEfetuados = React.useCallback((fornecedorId, fornecedorNome, dataPagamento) => {
    setModalFornecedorEfetuados({
      open: true,
      fornecedorId,
      fornecedorNome,
      dataPagamento,
    });
  }, []);

  const handleFecharModalFornecedorEfetuados = React.useCallback(() => {
    setModalFornecedorEfetuados({
      open: false,
      fornecedorId: null,
      fornecedorNome: null,
      dataPagamento: null,
    });
  }, []);

  const renderFornecedoresContent = React.useCallback(() => {
    const isModoFornecedoresPendentes = modoFornecedores === 'pendentes';

    // Modo Pendentes: Filtrar apenas fornecedores com colheitas pendentes
    const fornecedoresPendentes = isModoFornecedoresPendentes
      ? dadosFornecedores.filter((item) => item.colheitasEmAberto > 0)
      : [];

    // Modo Efetuados: Desagrupar pagamentos e criar lista individual de colheitas pagas
    // Manter referência ao item agrupado original para poder abrir o modal
    const pagamentosIndividuais = !isModoFornecedoresPendentes
      ? dadosFornecedoresEfetuados.flatMap((pagamentoAgrupado) =>
          pagamentoAgrupado.detalhes.map((detalhe) => ({
            id: `${pagamentoAgrupado.id}-${detalhe.pedidoNumero}-${detalhe.fruta}`,
            nomeFornecedor: pagamentoAgrupado.nomeFornecedor,
            fornecedorId: pagamentoAgrupado.fornecedorId || parseInt(pagamentoAgrupado.id.split('-')[0], 10),
            pedidoNumero: detalhe.pedidoNumero,
            cliente: detalhe.cliente,
            fruta: detalhe.fruta,
            areaNome: detalhe.areaNome,
            quantidadeColhida: detalhe.quantidadeColhida,
            unidadeMedida: detalhe.unidadeMedida,
            valorUnitario: detalhe.valorUnitario,
            valorTotal: detalhe.valorTotal,
            dataColheita: detalhe.dataColheita,
            dataPagamento: detalhe.dataPagamento,
            formaPagamento: detalhe.formaPagamento,
            observacoes: detalhe.observacoes,
          }))
        )
      : [];

    const dadosExibidos = isModoFornecedoresPendentes ? fornecedoresPendentes : pagamentosIndividuais;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: contentHeight,
          position: 'relative',
          overflowX: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: '200px',
            width: '100%',
          }}
        >
          {dadosExibidos.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: '#8c8c8c',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon icon="mdi:truck-outline" style={{ fontSize: '36px', color: '#9ca3af' }} />
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                {isModoFornecedoresPendentes
                  ? 'Nenhuma colheita pendente de pagamento'
                  : 'Nenhum pagamento efetuado'}
              </Text>
            </div>
          ) : isExpandido ? (
            // Layout expandido: 4 colunas
            isModoFornecedoresPendentes ? (
              <Row gutter={[16, 16]} style={{ margin: 0, width: '100%' }}>
                {fornecedoresPendentes.map((item, index) => {
                  const areasResumo = Array.from(new Set(item.detalhes.map((det) => det.areaNome))).slice(0, 3);
                  const restanteAreas = item.quantidadeAreas - areasResumo.length;
                  const temPagamentoPendente = item.totalPendente > 0;

                  return (
                    <Col xs={24} sm={12} lg={6} key={item.id}>
                      <div
                        style={{
                          padding: isMobile ? '12px' : '16px',
                          border: '1px solid #f0f0f0',
                          backgroundColor: temPagamentoPendente ? '#fff7e6' : '#fffbf0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                          boxSizing: 'border-box',
                          animation: `fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
                        }}
                        onClick={() => handleAbrirFornecedor(item)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <Avatar
                            style={{
                              backgroundColor: '#059669',
                              color: 'white',
                              fontSize: isMobile ? '0.75rem' : '0.875rem',
                              fontWeight: 'bold',
                              marginRight: '12px',
                            }}
                            size={isMobile ? 40 : 48}
                          >
                            {item.nomeFornecedor
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: isMobile ? '0.875rem' : '1rem',
                                fontWeight: '700',
                                color: '#065f46',
                                lineHeight: '1.3',
                                marginBottom: '4px',
                              }}
                            >
                              {capitalizeName(item.nomeFornecedor)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>
                              📦 {item.quantidadePedidos} pedido{item.quantidadePedidos !== 1 ? 's' : ''} • {item.quantidadeFrutas} fruta{item.quantidadeFrutas !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#047857', marginBottom: '8px', fontWeight: '500' }}>
                          🌱 {areasResumo.join(', ')}{restanteAreas > 0 ? ` +${restanteAreas}` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '12px' }}>
                          {item.colheitasEmAberto} colheita{item.colheitasEmAberto !== 1 ? 's' : ''} pendente{item.colheitasEmAberto !== 1 ? 's' : ''}
                        </div>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {temPagamentoPendente && (
                            <div
                              style={{
                                color: '#d46b08',
                                fontWeight: '700',
                                fontSize: isMobile ? '0.875rem' : '1rem',
                                lineHeight: '1.2',
                              }}
                            >
                              R$ {item.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          <Tag
                            color="gold"
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            AGUARDANDO
                          </Tag>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Row gutter={[16, 16]} style={{ margin: 0, width: '100%' }}>
                {pagamentosIndividuais.map((item, index) => (
                  <Col xs={24} sm={12} lg={6} key={item.id} style={{ maxWidth: '100%' }}>
                    <div
                      style={{
                        padding: isMobile ? '12px' : '16px',
                        border: '1px solid #f0f0f0',
                        backgroundColor: '#f6ffed',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        boxSizing: 'border-box',
                        animation: `fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
                      }}
                      onClick={() => handleAbrirModalFornecedorEfetuados(item.fornecedorId, item.nomeFornecedor, item.dataPagamento)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <Avatar
                          style={{
                            backgroundColor: '#52c41a',
                            color: 'white',
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            fontWeight: 'bold',
                            marginRight: '12px',
                          }}
                          size={isMobile ? 40 : 48}
                        >
                          {item.nomeFornecedor
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: isMobile ? '0.875rem' : '1rem',
                              fontWeight: '700',
                              color: '#333',
                              lineHeight: '1.3',
                              marginBottom: '4px',
                            }}
                          >
                            {capitalizeName(item.nomeFornecedor)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>
                            📦 {item.pedidoNumero} • {item.fruta}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                        🌱 {item.areaNome}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                        ⚖️ {intFormatter(item.quantidadeColhida)} {item.unidadeMedida}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginBottom: '12px' }}>
                        💰 {formatarDataBR(item.dataPagamento)} • {item.formaPagamento}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          style={{
                            color: '#52c41a',
                            fontWeight: '700',
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            lineHeight: '1.2',
                          }}
                        >
                          R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <Tag
                          color="green"
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          PAGO
                        </Tag>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )
          ) : isModoFornecedoresPendentes ? (
            // Modo Pendentes: Listar fornecedores agrupados (layout normal)
            <List
              itemLayout="horizontal"
              dataSource={fornecedoresPendentes}
              renderItem={(item) => {
                const areasResumo = Array.from(new Set(item.detalhes.map((det) => det.areaNome))).slice(0, 3);
                const restanteAreas = item.quantidadeAreas - areasResumo.length;
                const temPagamentoPendente = item.totalPendente > 0;

                return (
                  <List.Item
                    style={{
                      padding: isMobile ? '8px 6px' : '12px 8px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: temPagamentoPendente ? '#fff7e6' : '#fffbf0',
                      borderRadius: '6px',
                      margin: isMobile ? '2px 0' : '4px 0',
                      transition: 'all 0.2s ease',
                      minHeight: isMobile ? '56px' : '72px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleAbrirFornecedor(item)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: '#059669',
                            color: 'white',
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            fontWeight: 'bold',
                          }}
                          size={isMobile ? 32 : 40}
                        >
                          {item.nomeFornecedor
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)}
                        </Avatar>
                      }
                      title={
                        <div
                          style={{
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            fontWeight: '700',
                            color: '#065f46',
                            lineHeight: '1.3',
                            marginBottom: '2px',
                          }}
                        >
                          {capitalizeName(item.nomeFornecedor)}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#555', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontWeight: '500' }}>
                            📦 {item.quantidadePedidos} pedido{item.quantidadePedidos !== 1 ? 's' : ''} •
                            {item.quantidadeFrutas} fruta{item.quantidadeFrutas !== 1 ? 's' : ''} •
                            {item.colheitasEmAberto} colheita{item.colheitasEmAberto !== 1 ? 's' : ''} pendente{item.colheitasEmAberto !== 1 ? 's' : ''}
                          </div>
                          <div style={{ color: '#047857' }}>
                            🌱 {areasResumo.join(', ')}{restanteAreas > 0 ? ` +${restanteAreas}` : ''}
                          </div>
                        </div>
                      }
                    />
                    <div style={{ textAlign: 'right', fontSize: isMobile ? '0.6875rem' : '0.8125rem' }}>
                      {temPagamentoPendente && (
                        <div
                          style={{
                            color: '#d46b08',
                            fontWeight: '700',
                            marginBottom: isMobile ? '4px' : '8px',
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            lineHeight: '1.2',
                          }}
                        >
                          R$ {item.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      <Tag
                        color="gold"
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        AGUARDANDO PAGAMENTO
                      </Tag>
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : (
            // Modo Efetuados: Listar pagamentos individuais (desagrupados)
            <List
              itemLayout="horizontal"
              dataSource={pagamentosIndividuais}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: isMobile ? '8px 6px' : '12px 8px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: '#f6ffed',
                    borderRadius: '6px',
                    margin: isMobile ? '2px 0' : '4px 0',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '56px' : '72px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleAbrirModalFornecedorEfetuados(item.fornecedorId, item.nomeFornecedor, item.dataPagamento)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: '#52c41a',
                          color: 'white',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 'bold',
                        }}
                        size={isMobile ? 32 : 40}
                      >
                        {item.nomeFornecedor
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </Avatar>
                    }
                    title={
                      <div
                        style={{
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          fontWeight: '700',
                          color: '#333',
                          lineHeight: '1.3',
                          marginBottom: '2px',
                        }}
                      >
                        {capitalizeName(item.nomeFornecedor)}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#555', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '500' }}>
                          📦 {item.pedidoNumero} • {item.fruta} • {item.areaNome}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          ⚖️ {intFormatter(item.quantidadeColhida)} {item.unidadeMedida}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                          💰 Pago em: {formatarDataBR(item.dataPagamento)} • {item.formaPagamento}
                        </div>
                      </div>
                    }
                  />
                  <div style={{ textAlign: 'right', fontSize: isMobile ? '0.6875rem' : '0.8125rem' }}>
                    <div
                      style={{
                        color: '#52c41a',
                        fontWeight: '700',
                        marginBottom: isMobile ? '4px' : '8px',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        lineHeight: '1.2',
                      }}
                    >
                      R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Tag
                      color="green"
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      PAGO
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>

        {dadosExibidos.length > 0 && (
          <div
            style={{
              marginTop: 'auto',
              padding: '12px 0 0 0',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Text style={{ fontSize: '0.6875rem', color: '#999', maxWidth: '65%' }}>
              {isModoFornecedoresPendentes
                ? `${fornecedoresPendentes.length} fornecedor${fornecedoresPendentes.length !== 1 ? 'es' : ''} com colheita${fornecedoresPendentes.length !== 1 ? 's' : ''} pendente${fornecedoresPendentes.length !== 1 ? 's' : ''}`
                : `${pagamentosIndividuais.length} pagamento${pagamentosIndividuais.length !== 1 ? 's' : ''} efetuado${pagamentosIndividuais.length !== 1 ? 's' : ''}`}
            </Text>
            {isModoFornecedoresPendentes && (
              <Text style={{ fontSize: '0.6875rem', color: '#d46b08', fontWeight: 600 }}>
                Total pendente: R$ {fornecedoresPendentes.reduce((acc, item) => acc + (item.totalPendente || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            )}
            {!isModoFornecedoresPendentes && (
              <Text style={{ fontSize: '0.6875rem', color: '#52c41a', fontWeight: 600 }}>
                Total pago: R$ {pagamentosIndividuais.reduce((acc, item) => acc + (item.valorTotal || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </div>
        )}
      </div>
    );
  }, [contentHeight, dadosFornecedores, dadosFornecedoresEfetuados, modoFornecedores, handleAbrirFornecedor, handleAbrirModalFornecedorEfetuados, isMobile, isExpandido]);

  const tabItems = React.useMemo(
    () => [
      {
        key: 'turmas',
        label: (
          <span className="tab-label">
            <Icon icon="game-icons:farmer" className="tab-icon" />
            Turmas de Colheita
          </span>
        ),
        children: renderTurmasContent(),
      },
      {
        key: 'fornecedores',
        label: (
          <span className="tab-label">
            <Icon icon="mdi:truck-delivery" className="tab-icon" />
            Fornecedores
          </span>
        ),
        children: renderFornecedoresContent(),
      },
    ],
    [renderTurmasContent, renderFornecedoresContent]
  );

  return (
    <>
      <GlobalCardAnimations />
      <CardStyled $isMobile={isMobile}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <Title level={4} style={{ color: '#2E7D32', margin: 0, fontSize: '1rem' }}>
          {headerTitle}
        </Title>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {activeTab === 'turmas' && (
            <>
              <Tooltip title={mostrarFiltrosTurma ? 'Ocultar filtros' : 'Mostrar filtros'}>
                <Button
                  type="text"
                  icon={<FilterOutlined />}
                  onClick={() => setMostrarFiltrosTurma((prev) => !prev)}
                  style={{
                    color: mostrarFiltrosTurma ? '#ffffff' : '#059669',
                    border: `1px solid ${mostrarFiltrosTurma ? '#047857' : '#059669'}`,
                    backgroundColor: mostrarFiltrosTurma ? '#059669' : 'transparent',
                    borderRadius: '6px',
                    padding: '6px',
                    height: 'auto',
                    minWidth: 'auto',
                  }}
                />
              </Tooltip>
              {onToggleExpandir && (
                <Tooltip title={isExpandido ? 'Recolher área' : 'Expandir área'}>
                  <Button
                    type="text"
                    icon={isExpandido ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={onToggleExpandir}
                    style={{
                      color: isExpandido ? '#ffffff' : '#059669',
                      border: `1px solid ${isExpandido ? '#047857' : '#059669'}`,
                      backgroundColor: isExpandido ? '#059669' : 'transparent',
                      borderRadius: '6px',
                      padding: '6px',
                      height: 'auto',
                      minWidth: 'auto',
                    }}
                  />
                </Tooltip>
              )}
            </>
          )}

          {activeTab === 'fornecedores' ? (
            <>
              {onToggleExpandir && (
                <Tooltip title={isExpandido ? 'Recolher área' : 'Expandir área'}>
                  <Button
                    type="text"
                    icon={isExpandido ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={onToggleExpandir}
                    style={{
                      color: isExpandido ? '#ffffff' : '#059669',
                      border: `1px solid ${isExpandido ? '#047857' : '#059669'}`,
                      backgroundColor: isExpandido ? '#059669' : 'transparent',
                      borderRadius: '6px',
                      padding: '6px',
                      height: 'auto',
                      minWidth: 'auto',
                    }}
                  />
                </Tooltip>
              )}
              {/* Toggle button para aba de fornecedores */}
              <Tooltip title={`Alternar para ${modoFornecedores === 'pendentes' ? 'Efetuados' : 'Pendentes'}`}>
                <Button
                  type="text"
                  icon={<SwapOutlined />}
                  onClick={() => setModoFornecedores(modoFornecedores === 'pendentes' ? 'efetuados' : 'pendentes')}
                  style={{
                    color: '#059669',
                    border: '1px solid #059669',
                    borderRadius: '6px',
                    padding: '6px',
                    height: 'auto',
                    minWidth: 'auto',
                  }}
                />
              </Tooltip>
            </>
          ) : (
            // Toggle button para aba de turmas
            <Tooltip title={
              loadingPagamentosEfetuados
                ? 'Carregando...'
                : `Alternar para ${isModoPendentes ? 'Efetuados' : 'Pendentes'}`
            }>
              <Button
                type="text"
                icon={
                  loadingPagamentosEfetuados
                    ? <SyncOutlined spin />
                    : <SwapOutlined />
                }
                onClick={onToggleModo}
                loading={loadingPagamentosEfetuados}
                disabled={loadingPagamentosEfetuados}
                style={{
                  color: loadingPagamentosEfetuados
                    ? '#8b8b8b'
                    : '#059669',
                  border: '1px solid ' + (
                    loadingPagamentosEfetuados
                      ? '#d9d9d9'
                      : '#059669'
                  ),
                  borderRadius: '6px',
                  padding: '6px',
                  height: 'auto',
                  minWidth: 'auto',
                  opacity: loadingPagamentosEfetuados ? 0.6 : 1,
                }}
              />
            </Tooltip>
          )}
        </div>
      </div>

      <PaymentTabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* Modais de Pagamentos - Todos renderizados condicionalmente */}
      {modalFornecedor.open && modalFornecedor.fornecedor && (
        <FornecedorColheitaPagamentosModal
          open={modalFornecedor.open}
          fornecedor={modalFornecedor.fornecedor}
          onClose={handleFecharFornecedor}
          onPagamentosCriados={handlePagamentosFornecedorCriados}
          key={`fornecedor-${modalFornecedor.fornecedor?.id || 'new'}`}
        />
      )}

      {modalPagamentos.open && (
        <TurmaColheitaPagamentosModal
          open={modalPagamentos.open}
          onClose={handleFecharModalPagamentos}
          turmaId={modalPagamentos.turmaId}
          turmaNome={modalPagamentos.turmaNome}
          onPagamentosProcessados={() => handleFecharModalPagamentos(true)}
        />
      )}

      {modalPagamentosEfetuados.open && (
        <TurmaColheitaPagamentosEfetuadosModal
          open={modalPagamentosEfetuados.open}
          onClose={handleFecharModalPagamentosEfetuados}
          turmaId={modalPagamentosEfetuados.turmaId}
          turmaNome={modalPagamentosEfetuados.turmaNome}
          dataPagamento={modalPagamentosEfetuados.dataPagamento}
        />
      )}

      {modalFornecedorEfetuados.open && (
        <FornecedorColheitaPagamentosEfetuadosModal
          open={modalFornecedorEfetuados.open}
          onClose={handleFecharModalFornecedorEfetuados}
          fornecedorId={modalFornecedorEfetuados.fornecedorId}
          fornecedorNome={modalFornecedorEfetuados.fornecedorNome}
          dataPagamento={modalFornecedorEfetuados.dataPagamento}
        />
      )}
      </CardStyled>
    </>
  );
};

export default PagamentosSection;
