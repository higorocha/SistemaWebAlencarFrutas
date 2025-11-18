import React, { useMemo } from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { getFruitIcon } from '../../utils/fruitIcons';
import { intFormatter, capitalizeName } from '../../utils/formatters';
import useResponsive from '../../hooks/useResponsive';

const { Text, Title } = Typography;

// Card estilizado para cada fruta
const FruitCard = styled.div`
  padding: 16px;
  background: ${props => props.$background};
  border: 1px solid ${props => props.$borderColor};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const EstatisticasFrutasColheita = ({ programacaoColheita = [], activeTab, selectedWeek, isFullscreen = false, cardHeight = null }) => {
  const { isMobile } = useResponsive();

  // Agrupar frutas por status (Pendente, Colhido e Atrasado)
  const { frutasPendentes, frutasColhidas, frutasAtrasadas } = useMemo(() => {
    const pendentes = {};
    const colhidas = {};
    const atrasadas = {};

    const getWeekRange = () => {
      if (selectedWeek?.inicio && selectedWeek?.fim) {
        const inicio = new Date(selectedWeek.inicio.getFullYear(), selectedWeek.inicio.getMonth(), selectedWeek.inicio.getDate(), 0, 0, 0, 0);
        const fim = new Date(selectedWeek.fim.getFullYear(), selectedWeek.fim.getMonth(), selectedWeek.fim.getDate(), 23, 59, 59, 999);
        return { inicio, fim };
      }

      const hoje = new Date();
      const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

      // Calcular a segunda-feira anterior (ou o próprio dia se for segunda)
      const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      const segundaFeira = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasParaSegunda, 0, 0, 0, 0);

      const diasParaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
      const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasParaDomingo, 23, 59, 59, 999);

      return { inicio: segundaFeira, fim: domingo };
    };

    const semana = getWeekRange();

    // Status que consideram frutas pendentes
    const statusPendentes = ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL'];

    // Status que consideram frutas colhidas (parcial ou completo)
    const statusColhidos = [
      'COLHEITA_PARCIAL',
      'COLHEITA_REALIZADA',
      'AGUARDANDO_PRECIFICACAO',
      'PRECIFICACAO_REALIZADA',
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_PARCIAL',
      'PAGAMENTO_REALIZADO',
      'PEDIDO_FINALIZADO'
    ];

    programacaoColheita.forEach(item => {
      const frutaNome = item.fruta;
      const unidade = item.unidade || 'UN';
      const dataColheita = new Date(item.dataPrevistaColheita);

      // ✅ Normalizar data da colheita para início do dia para comparação precisa
      const dataColheitaNormalizada = new Date(dataColheita.getFullYear(), dataColheita.getMonth(), dataColheita.getDate(), 0, 0, 0, 0);

      // ✅ Verificar se está na semana atual (segunda até domingo)
      const estaNaSemana = dataColheitaNormalizada >= semana.inicio && dataColheitaNormalizada <= semana.fim;

      // ✅ Verificar se a colheita está atrasada (antes da semana atual)
      const isAtrasada = dataColheitaNormalizada < semana.inicio;

      // ✅ Frutas pendentes de colheita (APENAS da semana atual)
      if (statusPendentes.includes(item.statusPedido)) {
        const isItemColhido = item.statusPedido === 'COLHEITA_PARCIAL' && item.quantidadeReal && item.quantidadeReal > 0;

        if (!isItemColhido && item.quantidadePrevista !== 1) {
          // ✅ Adicionar às pendentes SOMENTE se estiver na semana atual
          if (estaNaSemana) {
            if (!pendentes[frutaNome]) {
              pendentes[frutaNome] = { nome: frutaNome, quantidade: 0, unidade: unidade };
            }
            pendentes[frutaNome].quantidade += item.quantidadePrevista || 0;
          }

          // ✅ Adicionar às atrasadas se estiver antes da semana atual
          if (isAtrasada) {
            if (!atrasadas[frutaNome]) {
              atrasadas[frutaNome] = { nome: frutaNome, quantidade: 0, unidade: unidade };
            }
            atrasadas[frutaNome].quantidade += item.quantidadePrevista || 0;
          }
        }
      }

      // ✅ Frutas colhidas (APENAS da semana atual)
      if (statusColhidos.includes(item.statusPedido)) {
        const quantidadeColhida = item.quantidadeReal || 0;

        // ✅ Adicionar às colhidas SOMENTE se estiver na semana atual E tiver quantidade
        if (quantidadeColhida > 0 && estaNaSemana) {
          if (!colhidas[frutaNome]) {
            colhidas[frutaNome] = { nome: frutaNome, quantidade: 0, unidade: unidade };
          }
          colhidas[frutaNome].quantidade += quantidadeColhida;
        }
      }
    });

    return {
      frutasPendentes: Object.values(pendentes).sort((a, b) => b.quantidade - a.quantidade),
      frutasColhidas: Object.values(colhidas).sort((a, b) => b.quantidade - a.quantidade),
      frutasAtrasadas: Object.values(atrasadas).sort((a, b) => b.quantidade - a.quantidade),
    };
  }, [programacaoColheita, selectedWeek]);

  // Renderizar card de fruta
  const renderFruitCard = (fruta, isPendente = true) => {
    const IconComponent = getFruitIcon(fruta.nome, {
      width: isMobile ? '28' : '32',
      height: isMobile ? '28' : '32',
      style: { flexShrink: 0 }
    });

    return (
      <FruitCard
        key={fruta.nome}
        $background={isPendente ? '#fff7e6' : '#f6ffed'}
        $borderColor={isPendente ? '#ffa940' : '#b7eb8f'}
      >
        {IconComponent}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: '#333',
            }}
          >
            {capitalizeName(fruta.nome)}
          </Text>
        </div>
        <Tag
          color={isPendente ? 'orange' : 'green'}
          style={{
            margin: 0,
            fontWeight: '700',
            fontSize: isMobile ? '12px' : '13px'
          }}
        >
          {intFormatter(fruta.quantidade)} {fruta.unidade}
        </Tag>
      </FruitCard>
    );
  };

  if (activeTab === '2') {
    // Renderizar visualização para a aba "Colheitas Atrasadas"
    return (
      <div style={{
        padding: isMobile ? '12px' : '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        height: isFullscreen ? (cardHeight || '100%') : (isMobile ? 'auto' : '520px'),
        minHeight: isFullscreen ? (cardHeight || '100%') : undefined,
        maxHeight: isFullscreen ? (cardHeight || '100%') : undefined,
        marginTop: isFullscreen ? (isMobile ? '48px' : '64px') : 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Title
          level={4}
          style={{
            color: '#2E7D32',
            marginBottom: '16px',
            fontSize: isMobile ? '0.875rem' : '1rem',
            marginTop: 0,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <WarningOutlined style={{ marginRight: '8px', color: '#d46b08' }} />
          Resumo de Pendências
        </Title>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            {frutasAtrasadas.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#999',
                fontSize: isMobile ? '11px' : '12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px dashed #e8e8e8',
                marginTop: '20px'
              }}>
                Nenhuma pendência atrasada
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                {frutasAtrasadas.map(fruta => renderFruitCard(fruta, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderização padrão para a aba "Semana Atual"
  return (
    <div style={{
      padding: isMobile ? '12px' : '16px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #e8e8e8',
      height: isFullscreen ? (cardHeight || '100%') : (isMobile ? 'auto' : '520px'),
      minHeight: isFullscreen ? (cardHeight || '100%') : undefined,
      maxHeight: isFullscreen ? (cardHeight || '100%') : undefined,
      marginTop: isFullscreen ? (isMobile ? '48px' : '64px') : 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Title
        level={4}
        style={{
          color: '#2E7D32',
          marginBottom: '16px',
          fontSize: isMobile ? '0.875rem' : '1rem',
          marginTop: 0,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <BarChartOutlined style={{ marginRight: '8px' }} />
        Estatísticas de Colheitas
      </Title>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Seção: Frutas Pendentes */}
        <div>
          <Space
            style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
            <Text
              style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '700',
                color: '#fa8c16'
              }}
            >
              Pendentes de Colheita
            </Text>
            {frutasPendentes.length > 0 && (
              <Tag color="orange" style={{ margin: 0 }}>
                {frutasPendentes.length}
              </Tag>
            )}
          </Space>

          {frutasPendentes.length === 0 ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#999',
              fontSize: isMobile ? '11px' : '12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px dashed #e8e8e8'
            }}>
              Nenhuma fruta pendente
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {frutasPendentes.map(fruta => renderFruitCard(fruta, true))}
            </div>
          )}
        </div>

        {/* Seção: Frutas Colhidas */}
        <div>
          <Space
            style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            <Text
              style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '700',
                color: '#52c41a'
              }}
            >
              Já Colhidas
            </Text>
            {frutasColhidas.length > 0 && (
              <Tag color="green" style={{ margin: 0 }}>
                {frutasColhidas.length}
              </Tag>
            )}
          </Space>

          {frutasColhidas.length === 0 ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#999',
              fontSize: isMobile ? '11px' : '12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px dashed #e8e8e8'
            }}>
              Nenhuma fruta colhida
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {frutasColhidas.map(fruta => renderFruitCard(fruta, false))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstatisticasFrutasColheita;
