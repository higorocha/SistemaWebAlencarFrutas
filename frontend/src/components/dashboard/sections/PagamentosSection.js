import React from 'react';
import { Typography, Button, List, Avatar, Tag } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { styled } from 'styled-components';
import useResponsive from '../../../hooks/useResponsive';
import { capitalizeName } from '../../../utils/formatters';

const { Title, Text } = Typography;

const CardStyled = styled.div`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  background: white;
  padding: ${props => props.$isMobile ? '12px' : '16px'};
  height: 100%;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
`;

const PagamentosSection = ({
  modoPagamentos,
  dadosPagamentosAtuais = [],
  loadingPagamentosEfetuados,
  erroPagamentosEfetuados,
  onToggleModo,
  onAbrirModalPagamentos,
  onAbrirModalPagamentosEfetuados,
  onTentarNovamente
}) => {
  const { isMobile } = useResponsive();
  const isModoPendentes = modoPagamentos === 'pendentes';

  return (
    <CardStyled $isMobile={isMobile}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Title level={4} style={{ color: '#2E7D32', margin: 0, fontSize: '1rem' }}>
            {isModoPendentes ? '💰 Pagamentos Pendentes' : '✅ Pagamentos Efetuados'}
          </Title>
        </div>
        <Button
          type="text"
          icon={loadingPagamentosEfetuados ? <SyncOutlined spin /> : <SwapOutlined />}
          onClick={onToggleModo}
          loading={loadingPagamentosEfetuados}
          disabled={loadingPagamentosEfetuados}
          style={{
            color: loadingPagamentosEfetuados ? '#8b8b8b' : '#059669',
            border: '1px solid ' + (loadingPagamentosEfetuados ? '#d9d9d9' : '#059669'),
            borderRadius: '6px',
            padding: '6px',
            height: 'auto',
            minWidth: 'auto',
            opacity: loadingPagamentosEfetuados ? 0.6 : 1
          }}
          title={loadingPagamentosEfetuados ? 'Carregando...' : `Alternar para ${isModoPendentes ? 'Efetuados' : 'Pendentes'}`}
        />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '396px',
        position: 'relative'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: '200px'
        }}>
          {dadosPagamentosAtuais.length === 0 && !loadingPagamentosEfetuados && !erroPagamentosEfetuados ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#8c8c8c' }}>
              <CheckCircleOutlined style={{ fontSize: '3rem', marginBottom: '1rem', color: '#52c41a' }} />
              <div>{isModoPendentes ? 'Nenhum pagamento pendente' : 'Nenhum pagamento efetuado'}</div>
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                {isModoPendentes
                  ? 'Todos os colheitadores estão em dia'
                  : 'Ainda não há registros de pagamentos realizados'
                }
              </Text>
            </div>
          ) : loadingPagamentosEfetuados ? (
            <div style={{
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
              height: '100%'
            }}>
              <SyncOutlined spin style={{ fontSize: '2rem', color: '#059669' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#059669', fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Carregando pagamentos efetuados...
                </div>
              </div>
            </div>
          ) : erroPagamentosEfetuados ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 20px',
              color: '#ff4d4f',
              textAlign: 'center'
            }}>
              <WarningOutlined style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }} />
              <span style={{ marginBottom: '12px' }}>{erroPagamentosEfetuados}</span>
              <Button
                size="small"
                onClick={onTentarNovamente}
                style={{
                  color: '#059669',
                  borderColor: '#059669'
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
                      ? (item.totalPendente > 1000 ? '#fff7e6' : 'transparent')
                      : '#f6ffed',
                    borderRadius: '6px',
                    margin: isMobile ? '2px 0' : '4px 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '56px' : '72px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={isModoPendentes ? () => onAbrirModalPagamentos(item.id, item.nomeColhedor) : () => {
                    const turmaId = parseInt(item.id.split('-')[0]);
                    onAbrirModalPagamentosEfetuados(turmaId, item.nomeColhedor);
                  }}
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
                          backgroundColor: isModoPendentes
                            ? (item.totalPendente > 1000 ? '#fa8c16' :
                               item.totalPendente > 500 ? '#faad14' : '#52c41a')
                            : '#52c41a',
                          color: 'white',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 'bold'
                        }}
                        size={isMobile ? 32 : 40}
                      >
                        {item.nomeColhedor.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </Avatar>
                    }
                    title={
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '700',
                        color: isModoPendentes
                          ? (item.totalPendente > 1000 ? '#d46b08' : '#333')
                          : '#333',
                        lineHeight: '1.3',
                        marginBottom: '2px'
                      }}>
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
                            💰 Pago em: {new Date(item.dataPagamento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {!isMobile && item.chavePix && (
                          <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                            PIX: {item.chavePix.length > 20 ?
                              `${item.chavePix.substring(0, 20)}...` :
                              item.chavePix
                            }
                          </div>
                        )}
                      </div>
                    }
                  />
                  <div style={{ textAlign: 'right', fontSize: isMobile ? '0.6875rem' : '0.8125rem' }}>
                    <div style={{
                      color: isModoPendentes
                        ? (item.totalPendente > 1000 ? '#d46b08' :
                           item.totalPendente > 500 ? '#faad14' : '#52c41a')
                        : '#52c41a',
                      fontWeight: '700',
                      marginBottom: isMobile ? '4px' : '8px',
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      lineHeight: '1.2'
                    }}>
                      R$ {(isModoPendentes ? item.totalPendente : item.totalPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Tag
                      color={isModoPendentes
                        ? (item.totalPendente > 1000 ? 'orange' :
                           item.totalPendente > 500 ? 'gold' : 'green')
                        : 'green'
                      }
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {isModoPendentes
                        ? (item.totalPendente > 1000 ? 'ALTO' :
                           item.totalPendente > 500 ? 'MÉDIO' : 'BAIXO')
                        : 'PAGO'
                      }
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          ) : null}
        </div>

        {/* Footer fixo na base - sempre visível */}
        {dadosPagamentosAtuais.length > 0 && (
          <div style={{
            marginTop: 'auto',
            padding: '12px 0 0 0',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <Text style={{ fontSize: '0.6875rem', color: '#999', maxWidth: '60%' }}>
              {isModoPendentes
                ? `${dadosPagamentosAtuais.length} colhedor${dadosPagamentosAtuais.length > 1 ? 'es' : ''} com ${'\u00A0'}pagamento${dadosPagamentosAtuais.length > 1 ? 's' : ''} pendente${dadosPagamentosAtuais.length > 1 ? 's' : ''}`
                : `${dadosPagamentosAtuais.length} pagamento${dadosPagamentosAtuais.length > 1 ? 's' : ''} realizado${dadosPagamentosAtuais.length > 1 ? 's' : ''}`
              }
            </Text>
            <div style={{
              display: 'flex',
              gap: isMobile ? '4px' : '8px',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              {isModoPendentes ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#fa8c16', borderRadius: '50%' }}></div>
                    <Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                      {isMobile ? '>R$1k' : 'Alto'}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#faad14', borderRadius: '50%' }}></div>
                    <Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                      {isMobile ? 'R$500+' : 'Médio'}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                    <Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                      {isMobile ? '<R$500' : 'Baixo'}
                    </Text>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                  <Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                    {isMobile ? 'Concluídos' : 'Pagamentos concluídos'}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CardStyled>
  );
};

export default PagamentosSection;
