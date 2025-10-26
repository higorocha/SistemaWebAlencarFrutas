import React, { useState, useEffect } from 'react';
import { Typography, Spin, Button } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { styled } from 'styled-components';
import useResponsive from '../../../hooks/useResponsive';
import axiosInstance from '../../../api/axiosConfig';
import { calcularStatusMaturacao } from '../../../utils/dateUtils';

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

const SemanaCard = styled.div`
  padding: ${props => props.$isMobile ? '10px' : '12px'};
  background-color: ${props => props.$background};
  border: 2px solid ${props => props.$borderColor};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isAtual ? '0 6px 20px rgba(5, 150, 105, 0.4)' : 'none'};
  transform: ${props => props.$isAtual ? 'scale(1.02)' : 'scale(1)'};
  position: relative;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const PrevisaoBananaSection = ({ onSemanaClick }) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dadosSemana, setDadosSemana] = useState(null);
  const [offsetSemana, setOffsetSemana] = useState(0); // 0 = semana atual, -1 = anterior, +1 = próxima
  const [controlesBanana, setControlesBanana] = useState([]);

  // Cores por status (mesmo do calendário)
  const coresStatus = {
    maturacao: '#dbeafe',
    colheita: '#dcfce7',
    alerta: '#fef3c7',
    vencido: '#fecaca'
  };

  const coresBorda = {
    maturacao: '#3b82f6',
    colheita: '#16a34a',
    alerta: '#d97706',
    vencido: '#dc2626'
  };

  const coresTexto = {
    maturacao: '#1e40af',
    colheita: '#166534',
    alerta: '#92400e',
    vencido: '#991b1b'
  };

  const iconesStatus = {
    maturacao: '🌱',
    colheita: '🍌',
    alerta: '⚠️',
    vencido: '🚨'
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (controlesBanana.length > 0) {
      processarSemana();
    }
  }, [offsetSemana, controlesBanana]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/controle-banana/dashboard');
      const controles = response.data.areasComFitas.flatMap(area =>
        area.controlesBanana || []
      );
      setControlesBanana(controles);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarSemana = () => {
    const hoje = new Date();
    const semana = obterSemana(hoje, offsetSemana);
    const previsoes = processarPrevisoesParaSemana(controlesBanana, semana);

    setDadosSemana({
      semana: semana,
      dados: previsoes
    });
  };

  // Função auxiliar para calcular o número da semana sequencialmente (igual ao calendário)
  const calcularNumeroSemanaSequencial = (data) => {
    const ano = data.getFullYear();
    const primeiroDiaAno = new Date(ano, 0, 1);

    // Ajustar para começar na segunda-feira
    const diaSemana = primeiroDiaAno.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    const primeiroDiaSemana = new Date(primeiroDiaAno);
    primeiroDiaSemana.setDate(primeiroDiaSemana.getDate() + diasParaSegunda);
    primeiroDiaSemana.setHours(0, 0, 0, 0);

    // Ajustar data para segunda-feira da semana
    const dataSegunda = new Date(data);
    const diaSemanaData = dataSegunda.getDay();
    const diasParaSegundaData = diaSemanaData === 0 ? -6 : 1 - diaSemanaData;
    dataSegunda.setDate(dataSegunda.getDate() + diasParaSegundaData);
    dataSegunda.setHours(0, 0, 0, 0);

    // Calcular diferença em semanas
    const diferencaMilissegundos = dataSegunda.getTime() - primeiroDiaSemana.getTime();
    const diferencaDias = Math.floor(diferencaMilissegundos / (1000 * 60 * 60 * 24));
    const numeroSemana = Math.floor(diferencaDias / 7) + 1;

    return numeroSemana;
  };

  const obterSemana = (dataBase, offset) => {
    const data = new Date(dataBase);
    data.setDate(data.getDate() + (offset * 7));

    // Calcular início da semana (segunda-feira)
    const diaSemana = data.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    const inicioSemana = new Date(data);
    inicioSemana.setDate(inicioSemana.getDate() + diasParaSegunda);
    inicioSemana.setHours(0, 0, 0, 0);

    // Calcular fim da semana (domingo)
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    // Usar cálculo sequencial (igual ao calendário)
    const numeroSemana = calcularNumeroSemanaSequencial(data);

    return {
      numero: numeroSemana,
      inicio: inicioSemana,
      fim: fimSemana,
      ano: data.getFullYear(),
      isAtual: offset === 0
    };
  };

  const processarPrevisoesParaSemana = (controles, semana) => {
    const previsoes = [];

    controles.forEach(controle => {
      if (controle.quantidadeFitas > 0) {
        const dataRegistro = new Date(controle.dataRegistro);

        // Calcular status dinamicamente baseado no fim da semana
        const diasDesdeRegistro = Math.floor(
          (semana.fim.getTime() - dataRegistro.getTime()) / (1000 * 60 * 60 * 24)
        );
        const status = calcularStatusMaturacao(diasDesdeRegistro);

        // Verificar se a previsão está dentro do período relevante
        const dataInicio = dataRegistro;
        const dataFim = new Date(dataRegistro.getTime() + 365 * 24 * 60 * 60 * 1000);

        // Se sobrepõe com a semana
        if (dataInicio <= semana.fim && dataFim >= semana.inicio) {
          previsoes.push({
            id: controle.id,
            fitaBananaId: controle.fitaBananaId,
            fitaNome: controle.fitaBanana?.nome || 'Fita',
            fitaCor: controle.fitaBanana?.corHex || '#000000',
            quantidade: controle.quantidadeFitas,
            quantidadeFitas: controle.quantidadeFitas,
            dataRegistro: dataRegistro,
            status: status,
            areaNome: controle.areaAgricola?.nome || 'Área',
            diasDesdeRegistro: diasDesdeRegistro
          });
        }
      }
    });

    return previsoes;
  };

  const obterStatusPrincipal = (dados) => {
    if (dados.length === 0) return 'vazio';

    const statusPrioridade = { vencido: 4, alerta: 3, colheita: 2, maturacao: 1 };
    const statusPrincipal = dados.reduce((prev, atual) =>
      statusPrioridade[atual.status] > statusPrioridade[prev.status] ? atual : prev
    );

    return statusPrincipal.status;
  };

  const calcularTotais = (dados) => {
    const totalFitas = dados.reduce((sum, item) => sum + item.quantidade, 0);
    const totalAreas = new Set(dados.map(item => item.areaNome)).size;
    const quantidadeColheita = dados
      .filter(item => item.status === 'colheita')
      .reduce((total, item) => total + item.quantidade, 0);

    return { totalFitas, totalAreas, quantidadeColheita };
  };

  const handleCardClick = () => {
    if (dadosSemana && dadosSemana.dados.length > 0 && onSemanaClick) {
      onSemanaClick({
        numero: dadosSemana.semana.numero,
        inicio: dadosSemana.semana.inicio,
        fim: dadosSemana.semana.fim,
        dados: dadosSemana.dados
      });
    }
  };

  const navegarSemana = (direcao) => {
    setOffsetSemana(prev => prev + direcao);
  };

  const voltarParaSemanaAtual = () => {
    setOffsetSemana(0);
  };

  if (loading) {
    return (
      <CardStyled $isMobile={isMobile}>
        <Title
          level={4}
          style={{
            color: '#2E7D32',
            marginBottom: isMobile ? '8px' : '12px',
            fontSize: '1rem',
            marginTop: 0
          }}
        >
          🍌 Previsão Banana
        </Title>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 0'
        }}>
          <Spin size="large" />
        </div>
      </CardStyled>
    );
  }

  const temDados = dadosSemana && dadosSemana.dados.length > 0;
  const statusPrincipal = temDados ? obterStatusPrincipal(dadosSemana.dados) : 'vazio';
  const totais = temDados ? calcularTotais(dadosSemana.dados) : { totalFitas: 0, totalAreas: 0, quantidadeColheita: 0 };

  const corFundo = temDados ? coresStatus[statusPrincipal] : '#f8f9fa';
  const corBorda = temDados ? coresBorda[statusPrincipal] : '#dee2e6';
  const corTexto = temDados ? coresTexto[statusPrincipal] : '#6b7280';
  const icone = temDados ? iconesStatus[statusPrincipal] : '📅';

  const isAtual = dadosSemana?.semana?.isAtual;

  return (
    <CardStyled $isMobile={isMobile}>
      {/* Header com título e controles de navegação */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '8px' : '12px'
      }}>
        <Title
          level={4}
          style={{
            color: '#2E7D32',
            fontSize: '1rem',
            margin: 0
          }}
        >
          🍌 Previsão Banana
        </Title>

        {/* Controles de navegação */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Button
            icon={<LeftOutlined style={{ fontSize: isMobile ? '10px' : '12px' }} />}
            onClick={() => navegarSemana(-1)}
            size="small"
            style={{
              backgroundColor: '#f8f9fa',
              borderColor: '#dee2e6',
              color: '#495057',
              width: isMobile ? '24px' : '28px',
              height: isMobile ? '24px' : '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          <Button
            onClick={voltarParaSemanaAtual}
            size="small"
            disabled={isAtual}
            style={{
              backgroundColor: isAtual ? '#059669' : '#f8f9fa',
              borderColor: isAtual ? '#059669' : '#dee2e6',
              color: isAtual ? '#ffffff' : '#495057',
              fontWeight: '600',
              fontSize: isMobile ? '10px' : '11px',
              padding: '0 8px',
              height: isMobile ? '24px' : '28px',
              minWidth: isMobile ? '40px' : '50px'
            }}
          >
            {isAtual ? 'Atual' : `S${dadosSemana?.semana?.numero || '-'}`}
          </Button>
          <Button
            icon={<RightOutlined style={{ fontSize: isMobile ? '10px' : '12px' }} />}
            onClick={() => navegarSemana(1)}
            size="small"
            style={{
              backgroundColor: '#f8f9fa',
              borderColor: '#dee2e6',
              color: '#495057',
              width: isMobile ? '24px' : '28px',
              height: isMobile ? '24px' : '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </div>
      </div>

      <SemanaCard
        $isMobile={isMobile}
        $background={corFundo}
        $borderColor={corBorda}
        $isAtual={isAtual}
        onClick={handleCardClick}
        style={{
          minHeight: isMobile ? '200px' : '250px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Indicador de semana atual */}
        {isAtual && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            backgroundColor: '#059669',
            borderRadius: '50%',
            border: '3px solid #ffffff',
            animation: 'pulse 2s infinite',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.5)',
            zIndex: 11
          }} />
        )}

        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: isMobile ? '20px' : '24px' }}>{icone}</span>
            <span style={{
              fontWeight: '700',
              fontSize: isMobile ? '16px' : '18px',
              color: corTexto
            }}>
              Semana {dadosSemana?.semana.numero || '-'}
            </span>
          </div>
        </div>

        {/* Datas */}
        {dadosSemana && (
          <div style={{
            fontSize: isMobile ? '12px' : '13px',
            color: corTexto,
            marginBottom: '12px',
            opacity: 0.8
          }}>
            {dadosSemana.semana.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {dadosSemana.semana.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        )}

        {/* Conteúdo */}
        {!temDados ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            color: '#8c8c8c',
            textAlign: 'center'
          }}>
            <CalendarOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
            <Text style={{ fontSize: '0.875rem' }}>
              Nenhuma previsão para esta semana
            </Text>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Status da fase */}
            <div style={{
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: '700',
              color: corTexto,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              textAlign: 'center',
              border: `2px solid ${corBorda}`
            }}>
              {statusPrincipal === 'maturacao' && '🌱 MATURAÇÃO'}
              {statusPrincipal === 'colheita' && '🍌 PERÍODO DE COLHEITA'}
              {statusPrincipal === 'alerta' && '⚠️ ALERTA - COLHER LOGO'}
              {statusPrincipal === 'vencido' && '🚨 RISCO - COLHER URGENTE'}
            </div>

            {/* Estatísticas (sempre exibir) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
              gap: '8px'
            }}>
              <div style={{
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                border: `1px solid ${corBorda}`,
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '700',
                  color: corTexto
                }}>
                  {totais.totalFitas}
                </div>
                <div style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: '#666',
                  marginTop: '2px'
                }}>
                  📦 Fitas
                </div>
              </div>

              <div style={{
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                border: `1px solid ${corBorda}`,
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '700',
                  color: corTexto
                }}>
                  {totais.totalAreas}
                </div>
                <div style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: '#666',
                  marginTop: '2px'
                }}>
                  🏞️ Áreas
                </div>
              </div>

              {!isMobile && totais.quantidadeColheita > 0 && (
                <div style={{
                  padding: '8px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px',
                  border: '1px solid #16a34a',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#166534'
                  }}>
                    {totais.quantidadeColheita}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#166534',
                    marginTop: '2px'
                  }}>
                    🍌 P/ Colher
                  </div>
                </div>
              )}
            </div>

            {/* Lista de fitas que precisam atenção (colheita/alerta/vencido) */}
            {statusPrincipal !== 'maturacao' && dadosSemana.dados.filter(item => ['colheita', 'alerta', 'vencido'].includes(item.status)).length > 0 && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '8px',
                border: `2px solid ${corBorda}`
              }}>
                <div style={{
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: '700',
                  color: corTexto,
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>
                  ⚠️ Requer Atenção:
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: isMobile ? '120px' : '140px',
                  overflowY: 'auto'
                }}>
                  {dadosSemana.dados
                    .filter(item => ['colheita', 'alerta', 'vencido'].includes(item.status))
                    .map((item, index) => {
                      const itemCores = coresStatus[item.status];
                      const statusLabel = {
                        colheita: '🍌 Colheita',
                        alerta: '⚠️ Alerta',
                        vencido: '🚨 Vencido'
                      };

                      // Calcular previsão de colheita (100-115 dias)
                      const dataRegistro = new Date(item.dataRegistro);
                      const dataColheitaInicio = new Date(dataRegistro);
                      dataColheitaInicio.setDate(dataColheitaInicio.getDate() + 100);

                      // Calcular número da semana de previsão usando o mesmo método sequencial
                      const semanaPrevisao = calcularNumeroSemanaSequencial(dataColheitaInicio);
                      const anoPrevisao = dataColheitaInicio.getFullYear();

                      // Verificar se está atrasada
                      const semanaAtual = dadosSemana.semana.numero;
                      const anoAtual = dadosSemana.semana.inicio.getFullYear();
                      const semanaAtualAbsoluta = anoAtual * 52 + semanaAtual;
                      const semanaPrevisaoAbsoluta = anoPrevisao * 52 + semanaPrevisao;
                      const estaAtrasada = semanaAtualAbsoluta > semanaPrevisaoAbsoluta;

                      // Calcular dias desde a marcação até hoje
                      const hoje = new Date();
                      const diasDesdeRegistro = Math.floor((hoje.getTime() - dataRegistro.getTime()) / (1000 * 60 * 60 * 24));

                      // Formatar data de marcação
                      const dataFormatada = dataRegistro.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      });

                      return (
                        <div
                          key={index}
                          style={{
                            padding: isMobile ? '8px' : '6px',
                            backgroundColor: itemCores.bg,
                            borderRadius: '6px',
                            border: `2px solid ${itemCores.border}`,
                            fontSize: isMobile ? '10px' : '11px'
                          }}
                        >
                          {isMobile ? (
                            // Layout Mobile - Mais vertical e espaçado
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* Linha 1: Cor da fita + Nome */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: item.fitaCor,
                                  borderRadius: '4px',
                                  border: '2px solid rgba(0,0,0,0.2)',
                                  flexShrink: 0
                                }} />
                                <div style={{
                                  fontWeight: '700',
                                  color: itemCores.text,
                                  fontSize: '11px',
                                  flex: 1
                                }}>
                                  {item.fitaNome}
                                </div>
                                <div style={{
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  color: itemCores.text,
                                  flexShrink: 0
                                }}>
                                  {item.quantidade}
                                </div>
                              </div>

                              {/* Linha 2: Área + Marcação */}
                              <div style={{
                                fontSize: '9px',
                                color: '#666',
                                paddingLeft: '30px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px',
                                alignItems: 'center'
                              }}>
                                <span>{item.areaNome}</span>
                                <span>•</span>
                                <span>Marcado: {dataFormatada}</span>
                                {isAtual && (
                                  <>
                                    <span>•</span>
                                    <span>{diasDesdeRegistro} dias</span>
                                  </>
                                )}
                              </div>

                              {/* Linha 3: Badges */}
                              <div style={{
                                display: 'flex',
                                gap: '4px',
                                paddingLeft: '30px',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{
                                  padding: '2px 6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '4px',
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  color: itemCores.text,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {statusLabel[item.status]}
                                </div>
                                {estaAtrasada && (
                                  <div style={{
                                    padding: '2px 4px',
                                    backgroundColor: '#dc2626',
                                    borderRadius: '3px',
                                    fontSize: '8px',
                                    fontWeight: '600',
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                    lineHeight: '1',
                                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.3)'
                                  }}>
                                    ATRASO
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            // Layout Desktop - Horizontal
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {/* Cor da fita */}
                              <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: item.fitaCor,
                                borderRadius: '4px',
                                border: '2px solid rgba(0,0,0,0.2)',
                                flexShrink: 0
                              }} />

                              {/* Informações */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Nome da fita */}
                                <div style={{
                                  fontWeight: '700',
                                  color: itemCores.text,
                                  fontSize: '11px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginBottom: '2px'
                                }}>
                                  {item.fitaNome}
                                </div>
                                {/* Nome da área + info de marcação */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '10px',
                                  color: '#666'
                                }}>
                                  <span style={{ flexShrink: 0 }}>
                                    {item.areaNome}
                                  </span>
                                  <span style={{ flexShrink: 0 }}>•</span>
                                  <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    Marcado: {dataFormatada}
                                  </span>
                                  {/* Só mostra dias se estiver na semana atual */}
                                  {isAtual && (
                                    <>
                                      <span style={{ flexShrink: 0 }}>•</span>
                                      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {diasDesdeRegistro} dias
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Status + Atraso */}
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                alignItems: 'flex-end',
                                flexShrink: 0
                              }}>
                                <div style={{
                                  padding: '2px 6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  color: itemCores.text,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {statusLabel[item.status]}
                                </div>
                                {estaAtrasada && (
                                  <div style={{
                                    padding: '2px 4px',
                                    backgroundColor: '#dc2626',
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                    lineHeight: '1',
                                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.3)'
                                  }}>
                                    ATRASO
                                  </div>
                                )}
                              </div>

                              {/* Quantidade */}
                              <div style={{
                                fontWeight: '700',
                                fontSize: '14px',
                                color: itemCores.text,
                                flexShrink: 0,
                                minWidth: '28px',
                                textAlign: 'right'
                              }}>
                                {item.quantidade}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badge "ATUAL" */}
        {isAtual && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '9px',
            fontWeight: '700',
            color: '#ffffff',
            backgroundColor: '#059669',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '2px solid #ffffff',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            zIndex: 11
          }}>
            ⭐ ATUAL
          </div>
        )}
      </SemanaCard>

      {/* Legenda */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '10px',
        color: '#666',
        textAlign: 'center'
      }}>
        {isAtual ? 'Mostrando semana atual.' : `Mostrando semana ${dadosSemana?.semana?.numero || '-'}.`} Acesse "Produção → Banana" para o calendário completo.
      </div>
    </CardStyled>
  );
};

export default PrevisaoBananaSection;
