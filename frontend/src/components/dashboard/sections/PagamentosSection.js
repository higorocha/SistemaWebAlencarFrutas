import React from 'react';
import { Typography, Button, List, Avatar, Tag } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SwapOutlined,
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

const { Title, Text } = Typography;

const CardStyled = styled.div`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.05);
  background: white;
  padding: ${(props) => (props.$isMobile ? '12px' : '16px')};
  height: 100%;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
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
}) => {
  const { isMobile } = useResponsive();
  const isModoPendentes = modoPagamentos === 'pendentes';
  const [activeTab, setActiveTab] = React.useState('turmas');
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
  });
  
  const [modalFornecedorEfetuados, setModalFornecedorEfetuados] = React.useState({
    open: false,
    fornecedorId: null,
    fornecedorNome: null,
  });

  const headerTitle = '💰 Pagamentos';

  const contentHeight = isMobile ? '380px' : '460px';

  const renderTurmasContent = React.useCallback(() => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: contentHeight,
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: '200px',
        }}
      >
        {dadosPagamentosAtuais.length === 0 && !loadingPagamentosEfetuados && !erroPagamentosEfetuados ? (
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
        ) : dadosPagamentosAtuais.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={dadosPagamentosAtuais}
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
                        handleAbrirModalPagamentosEfetuados(turmaId, item.nomeColhedor);
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
                        <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                          PIX:{' '}
                          {item.chavePix.length > 20
                            ? `${item.chavePix.substring(0, 20)}...`
                            : item.chavePix}
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
                        ? item.totalPendente > 1000
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
                      ? item.totalPendente > 1000
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
        ) : null}
      </div>

      {dadosPagamentosAtuais.length > 0 && (
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
              ? `${dadosPagamentosAtuais.length} colhedor${dadosPagamentosAtuais.length > 1 ? 'es' : ''} com ${'\u00A0'}pagamento${dadosPagamentosAtuais.length > 1 ? 's' : ''} pendente${dadosPagamentosAtuais.length > 1 ? 's' : ''}`
              : `${dadosPagamentosAtuais.length} pagamento${dadosPagamentosAtuais.length > 1 ? 's' : ''} realizado${dadosPagamentosAtuais.length > 1 ? 's' : ''}`}
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
  ), [
    contentHeight,
    dadosPagamentosAtuais,
    erroPagamentosEfetuados,
    isModoPendentes,
    isMobile,
    loadingPagamentosEfetuados,
    onTentarNovamente,
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
    // Notificar Dashboard para recarregar dados
    if (onPagamentosProcessados) {
      onPagamentosProcessados();
    }
    // Fechar modal após recarregar
    handleFecharFornecedor();
  }, [onPagamentosProcessados, handleFecharFornecedor]);

  const handleAbrirModalPagamentos = React.useCallback((turmaId, turmaNome) => {
    setModalPagamentos({
      open: true,
      turmaId,
      turmaNome,
    });
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

  const handleAbrirModalPagamentosEfetuados = React.useCallback((turmaId, turmaNome) => {
    setModalPagamentosEfetuados({
      open: true,
      turmaId,
      turmaNome,
    });
  }, []);

  const handleFecharModalPagamentosEfetuados = React.useCallback(() => {
    setModalPagamentosEfetuados({
      open: false,
      turmaId: null,
      turmaNome: null,
    });
  }, []);

  const handleAbrirModalFornecedorEfetuados = React.useCallback((fornecedorId, fornecedorNome) => {
    setModalFornecedorEfetuados({
      open: true,
      fornecedorId,
      fornecedorNome,
    });
  }, []);

  const handleFecharModalFornecedorEfetuados = React.useCallback(() => {
    setModalFornecedorEfetuados({
      open: false,
      fornecedorId: null,
      fornecedorNome: null,
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
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '200px',
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
          ) : isModoFornecedoresPendentes ? (
            // Modo Pendentes: Listar fornecedores agrupados
            <List
              itemLayout="horizontal"
              dataSource={fornecedoresPendentes}
              renderItem={(item) => {
                const areasResumo = Array.from(new Set(item.detalhes.map((det) => det.areaNome))).slice(0, 3);
                const restanteAreas = item.quantidadeAreas - areasResumo.length;

                // Calcular totalPendente: se houver pagamento pendente/processando, usar totalPendente, senão não mostrar valor
                const temPagamentoPendente = item.totalPendente > 0;
                const temColheitasPendentes = item.colheitasEmAberto > 0;

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
                  onClick={() => handleAbrirModalFornecedorEfetuados(item.fornecedorId, item.nomeFornecedor)}
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
  }, [contentHeight, dadosFornecedores, dadosFornecedoresEfetuados, modoFornecedores, handleAbrirFornecedor, handleAbrirModalFornecedorEfetuados, isMobile]);

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
        {activeTab === 'fornecedores' ? (
          // Toggle button para aba de fornecedores
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
            title={`Alternar para ${modoFornecedores === 'pendentes' ? 'Efetuados' : 'Pendentes'}`}
          />
        ) : (
          // Toggle button para aba de turmas
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
            title={
              loadingPagamentosEfetuados
                ? 'Carregando...'
                : `Alternar para ${isModoPendentes ? 'Efetuados' : 'Pendentes'}`
            }
          />
        )}
      </div>

      <PaymentTabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* Modais de Pagamentos - Todos renderizados condicionalmente */}
      {modalFornecedor.open && (
        <FornecedorColheitaPagamentosModal
          open={modalFornecedor.open}
          fornecedor={modalFornecedor.fornecedor}
          onClose={handleFecharFornecedor}
          onPagamentosCriados={handlePagamentosFornecedorCriados}
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
        />
      )}

      {modalFornecedorEfetuados.open && (
        <FornecedorColheitaPagamentosEfetuadosModal
          open={modalFornecedorEfetuados.open}
          onClose={handleFecharModalFornecedorEfetuados}
          fornecedorId={modalFornecedorEfetuados.fornecedorId}
          fornecedorNome={modalFornecedorEfetuados.fornecedorNome}
        />
      )}
    </CardStyled>
  );
};

export default PagamentosSection;
