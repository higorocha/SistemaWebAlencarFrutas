import React, { useCallback, useMemo, useState } from 'react';
import { Card, Typography, Row, Col, Space, Tag, Tooltip, Tabs, Button } from 'antd';
import { CalendarOutlined, UserOutlined, NumberOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined, FullscreenOutlined, FullscreenExitOutlined, SwapOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useResponsive from '../../hooks/useResponsive';
import { formatarData } from '../../utils/dateUtils';
import { intFormatter, capitalizeName, capitalizeNameShort } from '../../utils/formatters';
import { getFruitIcon } from '../../utils/fruitIcons';
import './ProgramacaoColheitaGrid.css';
import ColheitasDiaModal from './ColheitasDiaModal';
import StyledTabs from '../common/StyledTabs';

const { Text, Title } = Typography;

const STATUS_COLHEITAS_CONCLUIDAS = [
  'COLHEITA_PARCIAL',
  'COLHEITA_REALIZADA',
  'AGUARDANDO_PRECIFICACAO',
  'PRECIFICACAO_REALIZADA',
  'AGUARDANDO_PAGAMENTO',
  'PAGAMENTO_PARCIAL',
  'PAGAMENTO_REALIZADO',
  'PEDIDO_FINALIZADO'
];

// Bolinha pulsante vermelha - MAIOR
const PulsingBadge = styled.div`
  width: 12px;
  height: 12px;
  background-color: #dc2626;
  border-radius: 50%;
  border: 2px solid #ffffff;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.6);
  margin-left: 8px;
  display: inline-block;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
      transform: scale(1.1);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
      transform: scale(1);
    }
  }
`;

const ProgramacaoColheitaGrid = ({
  programacaoColheita = [],
  onColheitaClick,
  activeTab,
  onTabChange,
  selectedWeek,
  onNavigateWeek,
  onResetWeek,
  isFullscreen = false,
  onToggleFullscreen,
  modoColheitas = 'programacao',
  onToggleModoColheitas,
}) => {
  const { isMobile } = useResponsive();
  const [modalDiaAberto, setModalDiaAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const handleToggleFullscreen = useCallback(() => {
    if (typeof onToggleFullscreen === 'function') {
      onToggleFullscreen();
    }
  }, [onToggleFullscreen]);

  const handleAbrirModalDia = useCallback((dadosDia) => {
    setDiaSelecionado(dadosDia);
    setModalDiaAberto(true);
  }, []);

  const handleFecharModalDia = useCallback(() => {
    setModalDiaAberto(false);
    setDiaSelecionado(null);
  }, []);

  // Função para calcular a semana atual (segunda anterior ao dia atual até domingo próximo)
  const semanaReferencia = useMemo(() => {
    if (selectedWeek?.inicio && selectedWeek?.fim) {
      return {
        inicio: new Date(selectedWeek.inicio.getFullYear(), selectedWeek.inicio.getMonth(), selectedWeek.inicio.getDate(), 0, 0, 0, 0),
        fim: new Date(selectedWeek.fim.getFullYear(), selectedWeek.fim.getMonth(), selectedWeek.fim.getDate(), 23, 59, 59, 999),
        numero: selectedWeek.numero,
        label: selectedWeek.label,
        isAtual: selectedWeek.isAtual,
      };
    }

    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segundaFeira = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasParaSegunda, 0, 0, 0, 0);
    const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + (diaSemana === 0 ? 0 : 7 - diaSemana), 23, 59, 59, 999);

    const format = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

    return {
      inicio: segundaFeira,
      fim: domingo,
      numero: undefined,
      label: `${format.format(segundaFeira)} - ${format.format(domingo)}`,
      isAtual: true,
    };
  }, [selectedWeek]);

  // Função para obter ícone da fruta (agora usando SVG)
  const getFruitIconComponent = (frutaNome) => {
    return getFruitIcon(frutaNome, {
      width: isMobile ? '16' : '20',
      height: isMobile ? '16' : '20',
      style: { 
        flexShrink: 0,
        marginRight: '4px'
      }
    });
  };

  // Função para formatar quantidade
  const formatarQuantidade = (quantidade, unidade) => {
    // ✅ FORMATAR: Números com separador de milhar
    const quantidadeFormatada = intFormatter(quantidade);
    return `${quantidadeFormatada} ${unidade}`;
  };

  // Função para obter cores e status por dias restantes
  const getStatusConfig = (diasRestantes) => {
    if (diasRestantes < 0) {
      return {
        cor: '#fef2f2',
        border: '#f5222d',
        label: null, // Usar data para dias passados
        textColor: '#991b1b'
      };
    } else if (diasRestantes === 0) {
      return {
        cor: '#fff7e6',
        border: '#faad14',
        label: 'HOJE', // Apenas "HOJE" para hoje
        textColor: '#d46b08'
      };
    } else if (diasRestantes === 1) {
      return {
        cor: '#fef3c7',
        border: '#fa8c16',
        label: null, // Usar data para amanhã
        textColor: '#92400e'
      };
    } else {
      return {
        cor: '#f6ffed',
        border: '#52c41a',
        label: null, // Usar data para dias futuros
        textColor: '#166534'
      };
    }
  };

  // Determinar se estamos no modo "Colheitas Realizadas"
  const isModoRealizadas = modoColheitas === 'realizadas';

  // Agrupar colheitas por categoria (semana atual e atrasadas)
  const { colheitasSemanaAtual, colheitasAtrasadas } = useMemo(() => {
    const semanaAtual = {};
    const atrasadas = {};

    // Buscar todas as datas únicas das colheitas
    const datasUnicasSemana = new Set();
    const datasUnicasAtrasadas = new Set();

    // Status visíveis dependem do modo
    const statusVisiveisNaGrade = isModoRealizadas
      ? ['COLHEITA_PARCIAL', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO']
      : ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL'];

    // Filtrar colheitas por categoria
    programacaoColheita.forEach(item => {
      // No modo "Colheitas Realizadas", só mostrar pedidos que foram colhidos (têm dataColheita)
      if (isModoRealizadas && !item.dataColheita) {
        return;
      }

      // No modo "Programação", ocultar itens de pedidos que não devem aparecer na grade (ex: já precificados)
      if (!isModoRealizadas && !statusVisiveisNaGrade.includes(item.statusPedido)) {
        return;
      }

      // No modo "Programação", se o pedido é de colheita parcial, ocultar apenas a fruta que já foi colhida
      if (!isModoRealizadas && item.statusPedido === 'COLHEITA_PARCIAL' && item.quantidadeReal && item.quantidadeReal > 0) {
        return;
      }

      // No modo "Colheitas Realizadas", só mostrar pedidos com status de colheita realizada ou superior
      if (isModoRealizadas && !statusVisiveisNaGrade.includes(item.statusPedido)) {
        return;
      }

      // 3. Ocultar colheitas com quantidade exatamente igual a 1 (regra de negócio existente)
      if (item.quantidadePrevista === 1) {
        return;
      }

      // Usar dataColheita no modo "Realizadas", dataPrevistaColheita no modo "Programação"
      const dataReferencia = isModoRealizadas && item.dataColheita
        ? new Date(item.dataColheita)
        : new Date(item.dataPrevistaColheita);
      
      const dataColheitaNormalizada = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), dataReferencia.getDate(), 0, 0, 0, 0);
      const dataStr = dataColheitaNormalizada.toISOString().split('T')[0];

      // Verificar se está dentro da semana atual
      if (dataColheitaNormalizada >= semanaReferencia.inicio && dataColheitaNormalizada <= semanaReferencia.fim) {
        datasUnicasSemana.add(dataStr);
      } else if (dataColheitaNormalizada < semanaReferencia.inicio) {
        // Colheitas atrasadas (antes da semana atual)
        datasUnicasAtrasadas.add(dataStr);
      }
    });

    // Adicionar todos os dias da semana atual (segunda a domingo)
    for (let i = 0; i < 7; i++) {
      const data = new Date(semanaReferencia.inicio);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      datasUnicasSemana.add(dataStr);
    }

    // Criar colunas para semana atual
    datasUnicasSemana.forEach(dataStr => {
      const [ano, mes, dia] = dataStr.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
      semanaAtual[dataStr] = {
        data: data,
        colheitas: [],
        totalColheitas: 0
      };
    });

    // Criar colunas para colheitas atrasadas
    datasUnicasAtrasadas.forEach(dataStr => {
      const [ano, mes, dia] = dataStr.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
      atrasadas[dataStr] = {
        data: data,
        colheitas: [],
        totalColheitas: 0
      };
    });

    // Distribuir colheitas nas colunas
    programacaoColheita.forEach(item => {
      // No modo "Colheitas Realizadas", só mostrar pedidos que foram colhidos (têm dataColheita)
      if (isModoRealizadas && !item.dataColheita) {
        return;
      }

      // No modo "Programação", ocultar itens de pedidos que não devem aparecer na grade (ex: já precificados)
      if (!isModoRealizadas && !statusVisiveisNaGrade.includes(item.statusPedido)) {
        return;
      }

      // No modo "Programação", se o pedido é de colheita parcial, ocultar apenas a fruta que já foi colhida
      if (!isModoRealizadas && item.statusPedido === 'COLHEITA_PARCIAL' && item.quantidadeReal && item.quantidadeReal > 0) {
        return;
      }

      // No modo "Colheitas Realizadas", só mostrar pedidos com status de colheita realizada ou superior
      if (isModoRealizadas && !statusVisiveisNaGrade.includes(item.statusPedido)) {
        return;
      }

      // 3. Ocultar colheitas com quantidade exatamente igual a 1 (regra de negócio existente)
      if (item.quantidadePrevista === 1) {
        return;
      }

      // Usar dataColheita no modo "Realizadas", dataPrevistaColheita no modo "Programação"
      const dataReferencia = isModoRealizadas && item.dataColheita
        ? new Date(item.dataColheita)
        : new Date(item.dataPrevistaColheita);
      
      const dataStr = dataReferencia.toISOString().split('T')[0];

      if (semanaAtual[dataStr]) {
        semanaAtual[dataStr].colheitas.push(item);
        semanaAtual[dataStr].totalColheitas++;
      } else if (atrasadas[dataStr]) {
        atrasadas[dataStr].colheitas.push(item);
        atrasadas[dataStr].totalColheitas++;
      }
    });

    return {
      colheitasSemanaAtual: semanaAtual,
      colheitasAtrasadas: atrasadas
    };
  }, [programacaoColheita, semanaReferencia, isModoRealizadas]);

  // Obter colunas ordenadas para semana atual
  const colunasSemanaOrdenadas = useMemo(() => {
    return Object.entries(colheitasSemanaAtual).sort(([dataA], [dataB]) => {
      return new Date(dataA) - new Date(dataB);
    });
  }, [colheitasSemanaAtual]);

  // Obter colunas ordenadas para atrasadas
  const colunasAtrasadasOrdenadas = useMemo(() => {
    return Object.entries(colheitasAtrasadas).sort(([dataA], [dataB]) => {
      return new Date(dataA) - new Date(dataB);
    });
  }, [colheitasAtrasadas]);

  // Verificar se há colheitas atrasadas
  const temColheitasAtrasadas = useMemo(() => {
    return Object.values(colheitasAtrasadas).some(coluna => coluna.totalColheitas > 0);
  }, [colheitasAtrasadas]);

  const totalColheitasAtrasadas = useMemo(() => {
    return Object.values(colheitasAtrasadas).reduce((acc, col) => acc + col.totalColheitas, 0);
  }, [colheitasAtrasadas]);

  // Calcular o total de colheitas pendentes (que serão exibidas na grade)
  const totalColheitasPendentes = useMemo(() => {
    const totalSemana = Object.values(colheitasSemanaAtual).reduce((acc, col) => acc + col.totalColheitas, 0);
    const totalAtrasadas = Object.values(colheitasAtrasadas).reduce((acc, col) => acc + col.totalColheitas, 0);
    return totalSemana + totalAtrasadas;
  }, [colheitasSemanaAtual, colheitasAtrasadas]);

  // Renderizar item de colheita
  const renderItemColheita = (item, index) => {
    const statusConfig = getStatusConfig(item.diasRestantes);
    
    return (
      <div
        key={index}
        className="item-colheita"
        onClick={(event) => {
          event.stopPropagation();
          onColheitaClick && onColheitaClick(item);
        }}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div className="cliente-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined className="cliente-icon" />
            <Text 
              className="cliente-nome"
              style={{ 
                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                fontWeight: '600',
                color: '#333'
              }}
            >
              {capitalizeNameShort(item.cliente)}
            </Text>
          </div>
          {item.numeroPedido && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '2px', gap: 2 }}>
              <Text style={{ fontSize: '11px', color: '#8c8c8c', fontWeight: 500 }}>
                #{item.numeroPedido}
              </Text>
              {item.placaPrimaria && (
                <Text style={{ fontSize: '11px', color: '#8c8c8c', fontWeight: 500 }}>
                  🚚 {item.placaPrimaria}
                </Text>
              )}
            </div>
          )}
        </div>
        
        <div className="fruta-quantidade">
          <div className="fruta-info">
            {getFruitIconComponent(item.fruta)}
            <Text
              className="fruta-nome"
              style={{
                fontSize: isMobile ? '0.6875rem' : '0.75rem',
                color: '#666'
              }}
            >
              {capitalizeName(item.fruta)}
            </Text>
          </div>

          <div className="quantidade-info">
            <NumberOutlined className="quantidade-icon" />
            <Text
              className="quantidade"
              style={{
                fontSize: isMobile ? '0.6875rem' : '0.75rem',
                fontWeight: '600',
                color: '#333'
              }}
            >
              {formatarQuantidade(item.quantidadePrevista, item.unidade)}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar coluna de dia
  const renderColunaDia = ([dataStr, colunaData]) => {
    // ✅ CORREÇÃO: Normalizar datas para início do dia (00:00:00) para evitar problemas de fuso
    const hoje = new Date();
    const dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
    
    // Normalizar a data da coluna também para início do dia
    const dataColuna = new Date(colunaData.data);
    const dataColunaNormalizada = new Date(dataColuna.getFullYear(), dataColuna.getMonth(), dataColuna.getDate(), 0, 0, 0, 0);
    
    // No modo "Colheitas Realizadas", calcular dias desde a colheita (negativo = passado)
    // No modo "Programação", calcular dias restantes (positivo = futuro)
    const diferencaMs = isModoRealizadas
      ? dataAtual.getTime() - dataColunaNormalizada.getTime() // Dias desde a colheita
      : dataColunaNormalizada.getTime() - dataAtual.getTime(); // Dias restantes
    
    const diasRestantes = Math.round(diferencaMs / (1000 * 60 * 60 * 24));
    
    // No modo "Colheitas Realizadas", usar cores diferentes (azul/verde para colheitas realizadas)
    const statusConfig = isModoRealizadas
      ? (diasRestantes === 0
          ? { cor: '#e0f2fe', border: '#0284c7', label: 'HOJE', textColor: '#0c4a6e' }
          : diasRestantes < 0
          ? { cor: '#dbeafe', border: '#3b82f6', label: null, textColor: '#1e40af' }
          : { cor: '#f0fdf4', border: '#22c55e', label: null, textColor: '#166534' })
      : getStatusConfig(diasRestantes);
    const dataFormatada = formatarData(colunaData.data);
    const diaSemana = capitalizeName(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(dataColunaNormalizada));

    const normalizarData = (data) => new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);

    // No modo "Colheitas Realizadas", não precisamos calcular colheitas concluídas separadamente
    // pois todas as colheitas já são realizadas
    const colheitasConcluidas = isModoRealizadas
      ? [] // No modo "Colheitas Realizadas", todas as colheitas já estão em colunaData.colheitas
      : programacaoColheita.filter(item => {
          const quantidadeReal = item.quantidadeReal || 0;
          const statusEhConcluido = STATUS_COLHEITAS_CONCLUIDAS.includes(item.statusPedido);
          const possuiQuantidade = quantidadeReal > 0;

          if (!statusEhConcluido && !possuiQuantidade) {
            return false;
          }

          const dataPrevista = item.dataPrevistaColheita ? normalizarData(new Date(item.dataPrevistaColheita)) : null;
          const dataReal = item.dataColheita ? normalizarData(new Date(item.dataColheita)) : null;

          if (dataReal && dataReal.getTime() === dataColunaNormalizada.getTime()) {
            return true;
          }

          if (!dataReal && dataPrevista && dataPrevista.getTime() === dataColunaNormalizada.getTime()) {
            return true;
          }

          return false;
        });

    const totalPendentesDia = colunaData.colheitas.length;
    const totalConcluidasDia = colheitasConcluidas.length;
    const totalColheitasDia = totalPendentesDia + totalConcluidasDia;

    const modalPayload = {
      data: dataColunaNormalizada,
      dataFormatada,
      diaSemana,
      totalColheitas: totalColheitasDia,
      colheitasPendentes: colunaData.colheitas,
      colheitasConcluidas,
      totais: {
        pendentes: totalPendentesDia,
        concluidas: totalConcluidasDia
      },
      statusConfig,
      diasRestantes,
      label: statusConfig.label || dataFormatada
    };
    
    // Calcular altura dinâmica baseada no espaço disponível em fullscreen
    const cardHeight = isFullscreen 
      ? (isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 180px)')
      : (isMobile ? 350 : 400);

    return (
      <Col
        key={dataStr}
        span={24}
        style={{
          minWidth: '230px',
          maxWidth: '322px',
          flex: '1 1 230px',
          marginBottom: isMobile ? '16px' : '0'
        }}
      >
        <Card
          className="coluna-dia"
          style={{
            backgroundColor: statusConfig.cor,
            borderColor: statusConfig.border,
            borderWidth: '2px',
            height: typeof cardHeight === 'string' ? cardHeight : `${cardHeight}px`,
            minHeight: typeof cardHeight === 'string' ? cardHeight : `${cardHeight}px`,
            maxHeight: typeof cardHeight === 'string' ? cardHeight : `${cardHeight}px`,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease'
          }}
          styles={{
            body: {
              padding: isMobile ? '6px' : '8px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
          onClick={() => handleAbrirModalDia(modalPayload)}
          onMouseEnter={(event) => {
            event.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            event.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.boxShadow = 'none';
            event.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Header da coluna */}
          <div className="header-coluna" style={{ marginBottom: '4px' }}>
            {/* Mostrar "HOJE" como badge ou data como badge */}
            <div className="dia-label" style={{ textAlign: 'center', marginBottom: '1px' }}>
              <Tag
                color={statusConfig.border}
                style={{
                  fontSize: isMobile ? '0.625rem' : '0.6875rem',
                  fontWeight: '700',
                  padding: isMobile ? '2px 6px' : '4px 8px',
                  borderRadius: '4px',
                  margin: 0
                }}
              >
                {statusConfig.label || dataFormatada}
              </Tag>
            </div>
            
            {colunaData.totalColheitas > 0 && (
              <div className="contador-colheitas" style={{ textAlign: 'center', marginTop: '1px' }}>
                <Text 
                  style={{ 
                    fontSize: isMobile ? '0.625rem' : '0.6875rem',
                    color: '#666',
                    fontWeight: '500'
                  }}
                >
                  {colunaData.totalColheitas} colheita{colunaData.totalColheitas > 1 ? 's' : ''}
                </Text>
              </div>
            )}
          </div>

          {/* Lista de colheitas */}
          <div className="colheitas-lista" style={{ flex: 1, overflowY: 'auto' }}>
            {colunaData.colheitas.length === 0 ? (
              <div 
                className="sem-colheitas"
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '12px 0' : '20px 0',
                  color: '#999'
                }}
              >
                <CalendarOutlined style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '4px' }} />
                <div style={{ fontSize: isMobile ? '0.625rem' : '0.6875rem' }}>
                  Nenhuma colheita
                </div>
              </div>
            ) : (
              <div className="lista-items">
                {colunaData.colheitas.map((item, index) => renderItemColheita(item, index))}
              </div>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  // Renderizar conteúdo de uma aba
  const renderConteudoAba = (colunas) => {
    if (colunas.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            color: '#8c8c8c'
          }}
        >
          <CalendarOutlined style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '16px' }} />
          <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>
            Nenhuma colheita nesta categoria
          </div>
          <Text type="secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            {activeTab === '1' ? 'Nenhuma colheita programada para esta semana' : 'Nenhuma colheita atrasada'}
          </Text>
        </div>
      );
    }

    return (
      <Row
        gutter={isMobile ? [8, 8] : [12, 12]}
        style={{
          margin: 0,
          overflowX: 'auto',
          flexWrap: 'nowrap',
          display: 'flex'
        }}
        className="programacao-colheita-grid"
      >
        {colunas.map(renderColunaDia)}
      </Row>
    );
  };

  // Configurar itens das abas
  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarOutlined style={{ fontSize: isMobile ? '14px' : '15px' }} />
          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>Semana Atual</span>
        </span>
      ),
      children: renderConteudoAba(colunasSemanaOrdenadas)
    }
  ];

  // Adicionar aba de colheitas atrasadas apenas se houver dados
  if (temColheitasAtrasadas) {
    tabItems.push({
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ClockCircleOutlined style={{ fontSize: isMobile ? '14px' : '15px' }} />
          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>Colheitas Atrasadas</span>
          <PulsingBadge />
        </span>
      ),
      children: renderConteudoAba(colunasAtrasadasOrdenadas)
    });
  }

  const gridWrapperStyle = isFullscreen
    ? { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }
    : {};

  return (
    <div className={`programacao-colheita-grid${isFullscreen ? ' fullscreen' : ''}`} style={gridWrapperStyle}>
      <div
        className="grid-header"
        style={{
          marginBottom: isMobile ? '12px' : '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '8px' : '12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Title
              level={4}
              style={{
                color: '#2E7D32',
                margin: 0,
                fontSize: isMobile ? '0.875rem' : '1rem',
                textAlign: 'left'
              }}
            >
              📅 {isModoRealizadas ? 'Colheitas Realizadas' : 'Programação de Colheita'}
            </Title>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#34d399',
                display: 'inline-block'
              }}
            />
            <Text
              style={{
                fontSize: isMobile ? '0.6875rem' : '0.75rem',
                color: '#0f766e',
                fontWeight: 600,
              }}
            >
              {(semanaReferencia.numero ? `Semana ${semanaReferencia.numero}` : 'Semana')} • {semanaReferencia.label}
            </Text>
          </div>
          <Text
            style={{
              fontSize: isMobile ? '0.6875rem' : '0.75rem',
              color: '#047857',
              fontWeight: 500,
              textAlign: 'left'
            }}
          >
            {totalColheitasPendentes > 0
              ? (
                <>
                  {totalColheitasPendentes} colheita{totalColheitasPendentes > 1 ? 's' : ''} {isModoRealizadas ? 'realizada' : 'programada'}{totalColheitasPendentes > 1 ? 's' : ''}
                  {totalColheitasAtrasadas > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      {' • '}{totalColheitasAtrasadas} atrasada{totalColheitasAtrasadas > 1 ? 's' : ''}
                    </span>
                  )}
                </>
              )
              : `Nenhuma colheita ${isModoRealizadas ? 'realizada' : 'programada'} nesta semana`}
          </Text>
        </div>

        <Space size={isMobile ? 4 : 6}>
            <Button
              icon={<LeftOutlined style={{ fontSize: isMobile ? '10px' : '12px' }} />}
              onClick={() => onNavigateWeek && onNavigateWeek(-1)}
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
                justifyContent: 'center',
              }}
            />
            <Tooltip
              title={
                semanaReferencia.isAtual
                  ? 'Você já está na semana atual'
                  : 'Clique aqui para voltar para a semana atual'
              }
            >
              <Button
                onClick={() => onResetWeek && onResetWeek()}
                size="small"
                disabled={semanaReferencia.isAtual}
                style={{
                  backgroundColor: semanaReferencia.isAtual ? '#059669' : '#f8f9fa',
                  borderColor: semanaReferencia.isAtual ? '#059669' : '#dee2e6',
                  color: semanaReferencia.isAtual ? '#ffffff' : '#495057',
                  fontWeight: '600',
                  fontSize: isMobile ? '10px' : '11px',
                  padding: '0 8px',
                  height: isMobile ? '24px' : '28px',
                  minWidth: isMobile ? '48px' : '60px',
                }}
              >
                {semanaReferencia.isAtual ? 'Atual' : (semanaReferencia.numero ? `S${semanaReferencia.numero}` : 'Semana')}
              </Button>
            </Tooltip>
            <Button
              icon={<RightOutlined style={{ fontSize: isMobile ? '10px' : '12px' }} />}
              onClick={() => onNavigateWeek && onNavigateWeek(1)}
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
                justifyContent: 'center',
              }}
            />
            <Tooltip
              title={isFullscreen ? 'Fechar tela cheia' : 'Expandir para tela cheia'}
            >
              <Button
                onClick={handleToggleFullscreen}
                size="small"
                style={{
                  backgroundColor: isFullscreen ? '#047857' : '#f8f9fa',
                  borderColor: isFullscreen ? '#047857' : '#dee2e6',
                  color: isFullscreen ? '#ffffff' : '#495057',
                  width: isMobile ? '26px' : '30px',
                  height: isMobile ? '24px' : '28px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                icon={isFullscreen ? (
                  <FullscreenExitOutlined style={{ fontSize: isMobile ? '12px' : '14px' }} />
                ) : (
                  <FullscreenOutlined style={{ fontSize: isMobile ? '12px' : '14px' }} />
                )}
              />
            </Tooltip>
            <Tooltip
              title={isModoRealizadas ? 'Alternar para Programação de Colheita' : 'Alternar para Colheitas Realizadas'}
            >
              <Button
                type="text"
                icon={<SwapOutlined />}
                onClick={onToggleModoColheitas}
                size="small"
                style={{
                  color: '#059669',
                  border: '1px solid #059669',
                  borderRadius: '6px',
                  padding: '6px',
                  height: 'auto',
                  minWidth: 'auto',
                  width: isMobile ? '26px' : '30px',
                  height: isMobile ? '24px' : '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
        </Space>
      </div>

      {programacaoColheita.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            color: '#8c8c8c'
          }}
        >
          <CalendarOutlined style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '16px' }} />
          <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>
            Nenhuma colheita programada
          </div>
          <Text type="secondary" style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Aguardando pedidos para colheita
          </Text>
        </div>
      ) : (
        <StyledTabs
          type="card"
          activeKey={activeTab}
          onChange={onTabChange}
          items={tabItems}
        />
      )}

      <ColheitasDiaModal
        open={modalDiaAberto}
        onClose={handleFecharModalDia}
        diaSelecionado={diaSelecionado}
      />
    </div>
  );
};

export default ProgramacaoColheitaGrid;
