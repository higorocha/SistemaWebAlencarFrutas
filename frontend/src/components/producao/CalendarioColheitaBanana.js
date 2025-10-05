import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Row, Col, Tooltip, Badge, Spin, Alert, Button } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTheme } from '@mui/material/styles';
import axiosInstance from '../../api/axiosConfig';
import { obterNumeroSemana, formatarDataCurta, calcularStatusMaturacao } from '../../utils/dateUtils';
import ModalDetalhesSemana from './ModalDetalhesSemana';
import useResponsive from '../../hooks/useResponsive';
import './CalendarioColheitaBanana.css';

const { Text, Title } = Typography;

const CalendarioColheitaBanana = ({ dashboardData }) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dadosColheita, setDadosColheita] = useState([]);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [modalSemana, setModalSemana] = useState({
    visible: false,
    dados: [],
    semana: null
  });



  // Cores melhoradas para os diferentes status - mais visíveis e contrastantes
  const coresStatus = {
    maturacao: '#dbeafe', // Azul mais saturado - ainda em maturação
    colheita: '#dcfce7', // Verde mais saturado - período ideal de colheita
    alerta: '#fef3c7', // Amarelo mais saturado - período de alerta
    vencido: '#fecaca' // Vermelho mais saturado - fruta pode apodrecer
  };

  const coresBorda = {
    maturacao: '#3b82f6', // Azul mais vibrante
    colheita: '#16a34a', // Verde mais vibrante
    alerta: '#d97706', // Amarelo mais vibrante
    vencido: '#dc2626' // Vermelho mais vibrante
  };

  const coresTexto = {
    maturacao: '#1e40af', // Azul mais escuro
    colheita: '#166534', // Verde mais escuro
    alerta: '#92400e', // Amarelo mais escuro
    vencido: '#991b1b' // Vermelho mais escuro
  };

  // Função para verificar se deve mostrar a previsão (filtro de 120 dias para datas futuras)
  const deveMostrarPrevisao = (dataRegistro, dataSemana) => {
    const hoje = new Date();
    const dataReg = new Date(dataRegistro);
    const dataSem = new Date(dataSemana);
    
    // Até a data atual, sempre continue calculando, mesmo que ultrapasse 120 dias
    if (dataSem <= hoje) {
      return true;
    }
    
    // Para datas futuras, só mostrar até 120 dias da data atual
    const diasDesdeHoje = Math.floor((dataSem.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasDesdeHoje <= 120;
  };


  useEffect(() => {
    carregarDadosColheita();
  }, [anoAtual]);

  // ✅ REAGIR às mudanças no dashboardData (quando nova fita é cadastrada)
  useEffect(() => {
    if (dashboardData) {
      carregarDadosColheita();
    }
  }, [dashboardData]);

  const carregarDadosColheita = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/controle-banana/dashboard');
      const controlesBanana = response.data.areasComFitas.flatMap(area => 
        area.controlesBanana || []
      );
      
      // Processar dados para calcular previsões de colheita
      const previsoes = processarPrevisoesColheita(controlesBanana);
      setDadosColheita(previsoes);
    } catch (error) {
      console.error('Erro ao carregar dados de colheita:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarPrevisoesColheita = (controles) => {
    const previsoes = [];
    
    controles.forEach(controle => {
      if (controle.quantidadeFitas > 0) {
        const dataRegistro = new Date(controle.dataRegistro);
        
        // Criar apenas uma previsão por controle, que será exibida em todas as semanas
        // O status será calculado dinamicamente baseado na data da semana
        previsoes.push({
          id: controle.id,
          fitaId: controle.fitaBananaId,
          fitaNome: controle.fitaBanana?.nome || 'Fita',
          fitaCor: controle.fitaBanana?.corHex || '#000000',
          quantidade: controle.quantidadeFitas,
          dataRegistro: dataRegistro,
          dataInicio: dataRegistro,
          dataFim: new Date(dataRegistro.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 ano para cobrir todas as semanas
          status: 'ativo', // Status será calculado dinamicamente
          areaNome: controle.areaAgricola?.nome || 'Área'
        });
      }
    });
    
    return previsoes;
  };

  // Gerar semanas do ano
  const semanasDoAno = useMemo(() => {
    const semanas = [];
    const primeiroDiaAno = new Date(anoAtual, 0, 1);
    const ultimoDiaAno = new Date(anoAtual, 11, 31);
    
    // Ajustar para começar na segunda-feira
    const primeiroDiaSemana = new Date(primeiroDiaAno);
    const diaSemana = primeiroDiaAno.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    primeiroDiaSemana.setDate(primeiroDiaSemana.getDate() + diasParaSegunda);
    
    let dataAtual = new Date(primeiroDiaSemana);
    let numeroSemana = 1;
    
    while (dataAtual <= ultimoDiaAno) {
      const fimSemana = new Date(dataAtual);
      fimSemana.setDate(fimSemana.getDate() + 6);
      
      semanas.push({
        numero: numeroSemana,
        inicio: new Date(dataAtual),
        fim: fimSemana,
        dados: []
      });
      
      dataAtual.setDate(dataAtual.getDate() + 7);
      numeroSemana++;
    }
    
    return semanas;
  }, [anoAtual]);

  // Associar dados de colheita às semanas
  const semanasComDados = useMemo(() => {
    return semanasDoAno.map(semana => {
      const dadosSemana = dadosColheita.filter(previsao => {
        const inicioSemana = semana.inicio;
        const fimSemana = semana.fim;
        
        // Verificar se a previsão se sobrepõe com a semana
        const sobrepoe = (previsao.dataInicio <= fimSemana && previsao.dataFim >= inicioSemana);
        
        // Aplicar filtro de 120 dias para datas futuras
        const deveMostrar = deveMostrarPrevisao(previsao.dataRegistro, fimSemana);
        
        return sobrepoe && deveMostrar;
      }).map(previsao => {
        // Calcular status dinamicamente baseado na data da semana
        const diasDesdeRegistro = Math.floor((semana.fim.getTime() - previsao.dataRegistro.getTime()) / (1000 * 60 * 60 * 24));
        const status = calcularStatusMaturacao(diasDesdeRegistro);
        
        return {
          ...previsao,
          status: status
        };
      });
      
      return {
        ...semana,
        dados: dadosSemana
      };
    });
  }, [semanasDoAno, dadosColheita]);

  const obterCorSemana = (dados) => {
    if (dados.length === 0) return {
      background: '#f8f9fa',
      border: '#dee2e6',
      status: 'vazio',
      icon: '📅',
      quantidadeColheita: 0
    };

    const statusPrioridade = { vencido: 4, alerta: 3, colheita: 2, maturacao: 1 };
    const statusSemana = dados.reduce((prev, atual) =>
      statusPrioridade[atual.status] > statusPrioridade[prev.status] ? atual : prev
    );

    // Calcular quantidade total de fitas com status de colheita
    const quantidadeColheita = dados
      .filter(item => item.status === 'colheita')
      .reduce((total, item) => total + item.quantidade, 0);

    const iconesStatus = {
      maturacao: '🌱',
      colheita: '🍌',
      alerta: '⚠️',
      vencido: '🚨'
    };

    return {
      background: coresStatus[statusSemana.status],
      border: coresBorda[statusSemana.status],
      status: statusSemana.status,
      icon: iconesStatus[statusSemana.status],
      quantidadeColheita: quantidadeColheita
    };
  };


  // Função para verificar se é a semana atual
  const isSemanaAtual = (semana) => {
    const hoje = new Date();
    const inicioSemana = new Date(semana.inicio);
    const fimSemana = new Date(semana.fim);
    
    // Normalizar datas para comparar apenas o dia (ignorar horário)
    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const inicioNormalizado = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
    const fimNormalizado = new Date(fimSemana.getFullYear(), fimSemana.getMonth(), fimSemana.getDate());
    
    const ehAtual = hojeNormalizado >= inicioNormalizado && hojeNormalizado <= fimNormalizado;
    
    
    return ehAtual;
  };

  const navegarAno = (direcao) => {
    if (direcao === 'anterior') {
      setAnoAtual(prev => prev - 1);
    } else {
      setAnoAtual(prev => prev + 1);
    }
  };

  const irParaAnoAtual = () => {
    setAnoAtual(new Date().getFullYear());
  };

  const abrirModalSemana = (semana) => {
    if (semana.dados.length > 0) {
      setModalSemana({
        visible: true,
        dados: semana.dados,
        semana: semana
      });
    }
  };

  const fecharModalSemana = () => {
    setModalSemana({
      visible: false,
      dados: [],
      semana: null
    });
  };


  const obterTooltipContent = (dados, dataSemana) => {
    if (dados.length === 0) return 'Sem previsões para esta semana';

    // Agrupar dados apenas por área
    const dadosAgrupados = dados.reduce((acc, item) => {
      if (!acc[item.areaNome]) {
        acc[item.areaNome] = {
          areaNome: item.areaNome,
          fitas: []
        };
      }
      acc[item.areaNome].fitas.push(item);
      return acc;
    }, {});

    const iconesStatus = {
      maturacao: '🌱',
      colheita: '🍌',
      alerta: '⚠️',
      vencido: '🚨'
    };

    // Prioridade dos status (maior número = maior prioridade)
    const prioridadeStatus = { vencido: 4, alerta: 3, colheita: 2, maturacao: 1 };

    return (
      <div style={{
        backgroundColor: '#ffffff',
        color: '#333333',
        padding: 0,  // ✅ Removido padding externo para não afetar scroll
        borderRadius: '8px',
        maxWidth: '300px',
        maxHeight: window.innerWidth < 576 ? '60vh' : '400px',  // ✅ Responsivo: mobile usa vh, desktop usa px
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'  // ✅ Oculta overflow externo
      }}>
        {/* ✅ Header fixo (não scrollável) */}
        <div style={{
          fontWeight: '700',
          padding: '10px',
          color: '#059669',
          fontSize: '13px',
          textAlign: 'center',
          borderBottom: '2px solid #f0f0f0',
          backgroundColor: '#ffffff',
          borderRadius: '8px 8px 0 0',
          flexShrink: 0  // ✅ Não encolhe
        }}>
          📅 Semana {dataSemana ? obterNumeroSemana(dataSemana) : ''}
        </div>

        {/* ✅ Container scrollável para o conteúdo */}
        <div
          className="tooltip-scroll-container"
          style={{
            overflowY: 'auto',  // ✅ Scroll vertical
            overflowX: 'hidden',  // ✅ Sem scroll horizontal
            padding: '10px',
            flexGrow: 1,  // ✅ Ocupa espaço disponível
            // ✅ Estilização do scrollbar (Firefox)
            scrollbarWidth: 'thin',
            scrollbarColor: '#059669 #f0f0f0',
            WebkitOverflowScrolling: 'touch'  // ✅ Scroll suave no iOS
          }}
        >
          <style>{`
            /* ✅ Scrollbar customizado para Chrome/Safari/Edge */
            .tooltip-scroll-container::-webkit-scrollbar {
              width: 6px;
            }
            .tooltip-scroll-container::-webkit-scrollbar-track {
              background: #f0f0f0;
              border-radius: 3px;
            }
            .tooltip-scroll-container::-webkit-scrollbar-thumb {
              background: #059669;
              border-radius: 3px;
            }
            .tooltip-scroll-container::-webkit-scrollbar-thumb:hover {
              background: #047857;
            }

            /* ✅ Garantir scroll suave em todos os navegadores */
            .tooltip-scroll-container {
              scroll-behavior: smooth;
            }
          `}</style>

          {Object.values(dadosAgrupados).map((grupo, index, array) => {
          // Agrupar fitas por status dentro da área
          const fitasPorStatus = grupo.fitas.reduce((acc, fita) => {
            if (!acc[fita.status]) {
              acc[fita.status] = [];
            }
            acc[fita.status].push(fita);
            return acc;
          }, {});

          // Determinar o status de maior prioridade para a cor de fundo
          const statusPrincipal = grupo.fitas.reduce((prev, atual) =>
            prioridadeStatus[atual.status] > prioridadeStatus[prev.status] ? atual : prev
          );

          const totalFitas = grupo.fitas.reduce((sum, fita) => sum + fita.quantidade, 0);

          // ✅ Último item não tem margem inferior
          const isUltimo = index === array.length - 1;

          return (
            <div key={index} style={{
              marginBottom: isUltimo ? 0 : '10px',  // ✅ Último sem margem
              padding: '12px',
              backgroundColor: coresStatus[statusPrincipal.status],
              border: `2px solid ${coresBorda[statusPrincipal.status]}`,
              borderRadius: '8px'
            }}>
              {/* Nome da área com ícone do status principal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>
                  {iconesStatus[statusPrincipal.status]}
                </span>
                <span style={{
                  fontWeight: '700',
                  fontSize: '14px',
                  color: coresTexto[statusPrincipal.status]
                }}>
                  {grupo.areaNome}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: coresTexto[statusPrincipal.status],
                  opacity: 0.8,
                  marginLeft: 'auto'
                }}>
                  {totalFitas} fitas
                </span>
              </div>
              
              {/* Lista de status com fitas */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginLeft: '26px'
              }}>
                {Object.entries(fitasPorStatus).map(([status, fitas]) => {
                  const quantidadeStatus = fitas.reduce((sum, fita) => sum + fita.quantidade, 0);
                  return (
                    <div key={status} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${coresBorda[status]}`,
                      fontSize: '11px'
                    }}>
                      <span style={{ fontSize: '12px' }}>
                        {iconesStatus[status]}
                      </span>
                      <span style={{
                        fontWeight: '600',
                        color: coresTexto[status]
                      }}>
                        {quantidadeStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  return (
    <>
    <Card
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '8px' : '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '12px',
            flex: isMobile ? '1 1 100%' : 'auto'
          }}>
            <CalendarOutlined style={{
              color: '#059669',
              fontSize: isMobile ? '1rem' : '1.25rem'  // ✅ 16px → 20px em rem
            }} />
            <span style={{
              fontSize: isMobile ? '0.875rem' : '1rem',  // ✅ 14px → 16px em rem
              fontWeight: '600'
            }}>
              {isMobile ? 'Calendário de Colheita' : 'Calendário de Colheita'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '8px',
            flex: isMobile ? '1 1 100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-end'
          }}>
            <Button
              icon={<LeftOutlined style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }} />}
              onClick={() => navegarAno('anterior')}
              size="small"
              style={{
                backgroundColor: '#f8f9fa',
                borderColor: '#dee2e6',
                color: '#495057',
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Button
              onClick={irParaAnoAtual}
              size="small"
              style={{
                backgroundColor: anoAtual === new Date().getFullYear() ? '#059669' : '#f8f9fa',
                borderColor: anoAtual === new Date().getFullYear() ? '#059669' : '#dee2e6',
                color: anoAtual === new Date().getFullYear() ? '#ffffff' : '#495057',
                fontWeight: '600',
                minWidth: isMobile ? '50px' : '60px',
                height: isMobile ? '28px' : '32px',
                fontSize: isMobile ? '0.75rem' : '0.875rem'  // ✅ 12px → 14px em rem
              }}
            >
              {anoAtual}
            </Button>
            <Button
              icon={<RightOutlined style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }} />}
              onClick={() => navegarAno('proximo')}
              size="small"
              style={{
                backgroundColor: '#f8f9fa',
                borderColor: '#dee2e6',
                color: '#495057',
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        </div>
      }
      style={{ marginTop: isMobile ? '12px' : '24px' }}
      styles={{
        header: {
          backgroundColor: '#f8f9fa',
          borderBottom: '0.125rem solid #e9ecef',  // ✅ 2px → rem
          borderRadius: '0.5rem 0.5rem 0 0',  // ✅ 8px → rem
          padding: isMobile ? '8px 12px' : '12px 16px'
        }
      }}
    >
      {/* Legenda */}
      <div style={{
        marginBottom: isMobile ? '12px' : '20px',
        padding: isMobile ? '12px' : '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '0.5rem'  // ✅ 8px → rem
      }}>
        <Title level={5} style={{
          margin: '0 0 12px 0',
          fontSize: isMobile ? '0.875rem' : '1rem'  // ✅ 14px → 16px em rem
        }}>
          Legenda:
        </Title>
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 8]}>
          <Col xs={24} sm={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
              <div style={{
                width: isMobile ? '12px' : '16px',
                height: isMobile ? '12px' : '16px',
                backgroundColor: coresStatus.maturacao,
                border: `0.125rem solid ${coresBorda.maturacao}`,  // ✅ 2px → rem
                borderRadius: '0.25rem',  // ✅ 4px → rem
                flexShrink: 0
              }} />
              <Text style={{
                color: coresTexto.maturacao,
                fontWeight: '500',
                fontSize: isMobile ? '0.6875rem' : '0.875rem',  // ✅ 11px → 14px em rem
                lineHeight: isMobile ? '1.2' : '1.5'
              }}>
                {isMobile ? '🌱 Maturação 0-99d' : '🌱 Maturação (0-99 dias)'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
              <div style={{
                width: isMobile ? '12px' : '16px',
                height: isMobile ? '12px' : '16px',
                backgroundColor: coresStatus.colheita,
                border: `0.125rem solid ${coresBorda.colheita}`,  // ✅ 2px → rem
                borderRadius: '0.25rem',  // ✅ 4px → rem
                flexShrink: 0
              }} />
              <Text style={{
                color: coresTexto.colheita,
                fontWeight: '500',
                fontSize: isMobile ? '0.6875rem' : '0.875rem',  // ✅ 11px → 14px em rem
                lineHeight: isMobile ? '1.2' : '1.5'
              }}>
                {isMobile ? '🍌 Colheita 100-115d' : '🍌 Colheita (100-115 dias)'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
              <div style={{
                width: isMobile ? '12px' : '16px',
                height: isMobile ? '12px' : '16px',
                backgroundColor: coresStatus.alerta,
                border: `0.125rem solid ${coresBorda.alerta}`,  // ✅ 2px → rem
                borderRadius: '0.25rem',  // ✅ 4px → rem
                flexShrink: 0
              }} />
              <Text style={{
                color: coresTexto.alerta,
                fontWeight: '500',
                fontSize: isMobile ? '0.6875rem' : '0.875rem',  // ✅ 11px → 14px em rem
                lineHeight: isMobile ? '1.2' : '1.5'
              }}>
                {isMobile ? '⚠️ Alerta 116-125d' : '⚠️ Alerta (116-125 dias)'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
              <div style={{
                width: isMobile ? '12px' : '16px',
                height: isMobile ? '12px' : '16px',
                backgroundColor: coresStatus.vencido,
                border: `0.125rem solid ${coresBorda.vencido}`,  // ✅ 2px → rem
                borderRadius: '0.25rem',  // ✅ 4px → rem
                flexShrink: 0
              }} />
              <Text style={{
                color: coresTexto.vencido,
                fontWeight: '500',
                fontSize: isMobile ? '0.6875rem' : '0.875rem',  // ✅ 11px → 14px em rem
                lineHeight: isMobile ? '1.2' : '1.5'
              }}>
                {isMobile ? '🚨 Risco +125d' : '🚨 Risco (+125 dias)'}
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Calendário de Semanas */}
      <div style={{ position: 'relative' }}>
        {/* Overlay de Loading */}
        {loading && (
          <div 
            className="loading-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              borderRadius: '8px'
            }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              backgroundColor: '#ffffff',
              padding: '24px 32px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <Spin size="large" />
              <div style={{
                color: '#059669',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Carregando previsões para {anoAtual}...
              </div>
            </div>
          </div>
        )}

        <div className="calendario-semanas">
          {semanasComDados.map((semana, index) => {
            const corSemana = obterCorSemana(semana.dados);
            const temDados = semana.dados.length > 0;
            const ehSemanaAtual = isSemanaAtual(semana);
            
            return (
              <Tooltip
                key={index}
                title={obterTooltipContent(semana.dados, semana.fim)}
                placement="top"
              >
                <div
                  className={`semana-item ${temDados ? 'com-dados' : 'sem-dados'} ${ehSemanaAtual ? 'semana-atual' : ''}`}
                  style={{
                    backgroundColor: ehSemanaAtual ? '#f0fdf4' : corSemana.background,
                    borderColor: ehSemanaAtual ? '#059669' : corSemana.border,
                    borderWidth: ehSemanaAtual ? '4px' : '2px',
                    borderStyle: 'solid',
                    cursor: temDados ? 'pointer' : 'default',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: ehSemanaAtual ? '0 6px 20px rgba(5, 150, 105, 0.4)' : 'none',
                    transform: ehSemanaAtual ? 'scale(1.02)' : 'scale(1)',
                    zIndex: ehSemanaAtual ? 10 : 1
                  }}
                  onClick={() => temDados && abrirModalSemana(semana)}
                >
                  {/* Indicador de semana atual */}
                  {ehSemanaAtual && (
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
                  
                  {/* Cabeçalho com ícone e número */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {corSemana.icon}
                      </span>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: corSemana.status !== 'vazio' ? coresTexto[corSemana.status] : '#6b7280'
                      }}>
                        Sem {semana.numero}
                      </span>
                    </div>
                    {temDados && (
                      <div className="semana-indicador">
                        <Badge count={semana.dados.length} size="small" />
                      </div>
                    )}
                  </div>
                  
                  {/* Datas */}
                  <div style={{
                    fontSize: '11px',
                    color: corSemana.status !== 'vazio' ? coresTexto[corSemana.status] : '#6b7280',
                    marginBottom: '4px',
                    opacity: 0.8
                  }}>
                    {formatarDataCurta(semana.inicio)} - {formatarDataCurta(semana.fim)}
                  </div>
                  
                  {/* Status da fase */}
                  {corSemana.status !== 'vazio' && (
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: coresTexto[corSemana.status],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginTop: '4px'
                    }}>
                      {corSemana.status === 'maturacao' && 'Maturação'}
                      {corSemana.status === 'colheita' && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: '6px',
                          position: 'relative',
                          justifyContent: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {/* Efeito de brilho animado */}
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            background: 'linear-gradient(45deg, #16a34a, #22c55e, #16a34a)',
                            borderRadius: '8px',
                            opacity: 0.3,
                            animation: 'shimmer 2s ease-in-out infinite alternate'
                          }} />
                          
                          {/* Container principal com efeito de sombra */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '12px',
                            border: '2px solid #16a34a',
                            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                            position: 'relative',
                            zIndex: 1
                          }}>
                            {/* Ícone de banana com animação */}
                            <span style={{ 
                              fontSize: '12px',
                              animation: 'bounce 1.5s ease-in-out infinite'
                            }}>
                              🍌
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#16a34a',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}>
                              Colheita
                            </span>
                          </div>
                          
                          {/* Badge com quantidade de fitas */}
                          {corSemana.quantidadeColheita > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              backgroundColor: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                              borderRadius: '10px',
                              border: '1px solid #16a34a',
                              boxShadow: '0 1px 4px rgba(22, 163, 74, 0.2)',
                              position: 'relative',
                              zIndex: 1
                            }}>
                              <span style={{
                                fontSize: '8px',
                                fontWeight: '600',
                                color: '#166534'
                              }}>
                                {corSemana.quantidadeColheita}
                              </span>
                              <span style={{
                                fontSize: '8px',
                                fontWeight: '500',
                                color: '#166534',
                                opacity: 0.8
                              }}>
                                Fitas
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {corSemana.status === 'alerta' && 'Alerta'}
                      {corSemana.status === 'vencido' && 'Risco'}
                    </div>
                  )}
                  
                  {/* Indicador de semana atual */}
                  {ehSemanaAtual && (
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#ffffff',
                      backgroundColor: '#059669',
                      padding: '3px 8px',
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
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Informações adicionais */}
      <Alert
        message={
          <span style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Informações sobre o Calendário
          </span>
        }
        description={
          <div style={{ fontSize: isMobile ? '0.6875rem' : '0.8125rem' }}>
            <p style={{ margin: isMobile ? '4px 0' : '8px 0' }}>
              • Cada semana mostra as previsões de colheita baseadas nas fitas cadastradas
            </p>
            <p style={{ margin: isMobile ? '4px 0' : '8px 0' }}>
              • As cores indicam o status de maturação das bananas
            </p>
            <p style={{ margin: isMobile ? '4px 0' : '8px 0' }}>
              • Passe o mouse sobre as semanas para ver detalhes
            </p>
            <p style={{ margin: isMobile ? '4px 0' : '8px 0' }}>
              • O cálculo é baseado em 100-125 dias após o cadastro da fita
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{
          marginTop: isMobile ? '12px' : '20px',
          fontSize: isMobile ? '0.75rem' : '0.875rem'
        }}
      />
      </Card>

      {/* Modal de Detalhes da Semana */}
      <ModalDetalhesSemana
        visible={modalSemana.visible}
        onClose={fecharModalSemana}
        semana={modalSemana.semana}
        dados={modalSemana.dados}
      />
    </>
  );
};

export default CalendarioColheitaBanana;
