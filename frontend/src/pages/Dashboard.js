import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Statistic, Space, Badge, Button, Progress, List, Avatar, Tag } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  DollarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  TeamOutlined,
  PlusOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ScheduleOutlined
} from "@ant-design/icons";
import { styled } from "styled-components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import axiosInstance from "../api/axiosConfig";
import { useTheme } from '@mui/material/styles';
import  CentralizedLoader  from "../components/common/loaders/CentralizedLoader";

const { Title } = Typography;

// Função para detectar ícone da fruta baseado no nome
const getFruitIcon = (frutaNome) => {
  if (!frutaNome) return "/icons/frutas_64x64.png";

  const nome = frutaNome.toLowerCase().trim();

  // Mapeamento inteligente de frutas para ícones
  const fruitMap = {
    // Frutas específicas
    'banana': '/icons/banana.svg',
    'maçã': '/icons/apple.svg',
    'maca': '/icons/apple.svg',
    'apple': '/icons/apple.svg',
    'melancia': '/icons/melancia.svg',
    'uva': '/icons/uvas.svg',
    'uvas': '/icons/uvas.svg',
    'coco': '/icons/coconut1.svg',
    'côco': '/icons/coconut1.svg',
    'coconut': '/icons/coconut1.svg',
    'cacao': '/icons/cacao.svg',
    'cacau': '/icons/cacao.svg',
    'tomate': '/icons/tomate.svg',

    // Detecção por palavras-chave
    'prata': '/icons/banana.svg', // banana prata
    'nanica': '/icons/banana.svg', // banana nanica
    'maçan': '/icons/banana.svg', // banana maçã
  };

  // Busca por correspondência exata primeiro
  if (fruitMap[nome]) {
    return fruitMap[nome];
  }

  // Busca por palavras-chave dentro do nome
  for (const [key, icon] of Object.entries(fruitMap)) {
    if (nome.includes(key)) {
      return icon;
    }
  }

  // Fallback para ícone genérico
  return "/icons/frutas_64x64.png";
};

const CardStyled = styled(Card)`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  height: 100%;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [bananaPrevisoes, setBananaPrevisoes] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    // Cards principais
    faturamentoTotal: 1245780.50,
    faturamentoAberto: 89450.75,
    totalClientes: 125,
    totalPedidos: 847,
    areasProdutivasHa: 42.5,
    frutasCadastradas: 23,
    pedidosAtivos: 18,

    // Dados para gráficos
    receitaMensal: [
      { mes: 'Jan', valor: 145320.50 },
      { mes: 'Fev', valor: 189750.75 },
      { mes: 'Mar', valor: 156890.25 },
      { mes: 'Abr', valor: 201450.80 },
      { mes: 'Mai', valor: 178920.40 },
      { mes: 'Jun', valor: 195680.90 }
    ],

    // Programação de colheita - pedidos agrupados por cliente/fruta
    programacaoColheita: [
      {
        cliente: 'João Silva Ltda',
        fruta: 'Banana Prata',
        quantidadePrevista: 2500,
        unidade: 'KG',
        dataPrevistaColheita: '2024-01-25',
        status: 'AGUARDANDO_COLHEITA',
        diasRestantes: 3
      },
      {
        cliente: 'Mercado Central',
        fruta: 'Laranja Lima',
        quantidadePrevista: 1800,
        unidade: 'KG',
        dataPrevistaColheita: '2024-01-26',
        status: 'PEDIDO_CRIADO',
        diasRestantes: 4
      },
      {
        cliente: 'Distribuidora Norte',
        fruta: 'Banana Nanica',
        quantidadePrevista: 3200,
        unidade: 'KG',
        dataPrevistaColheita: '2024-01-27',
        status: 'AGUARDANDO_COLHEITA',
        diasRestantes: 5
      },
      {
        cliente: 'SuperFruits SA',
        fruta: 'Manga Tommy',
        quantidadePrevista: 950,
        unidade: 'KG',
        dataPrevistaColheita: '2024-01-28',
        status: 'PEDIDO_CRIADO',
        diasRestantes: 6
      },
      {
        cliente: 'João Silva Ltda',
        fruta: 'Limão Tahiti',
        quantidadePrevista: 1200,
        unidade: 'KG',
        dataPrevistaColheita: '2024-01-29',
        status: 'AGUARDANDO_COLHEITA',
        diasRestantes: 7
      }
    ],

    // Produção de banana
    producaoBanana: {
      totalFitas: 2450,
      areasAtivas: 15,
      proximasColheitas: 8,
      percentualColheita: 75
    },

    // Turmas mais ativas
    turmasAtivas: [
      { nome: 'João Silva', pedidos: 8, valor: 12500.50 },
      { nome: 'Maria Costa', pedidos: 5, valor: 8750.25 },
      { nome: 'Pedro Souza', pedidos: 3, valor: 6200.75 }
    ],

    // Alertas
    alertas: {
      pedidosParaColheita: 3,
      precificacoesPendentes: 2,
      pagamentosAtrasados: 1
    }
  });
  const theme = useTheme();

  // Função para buscar dados reais do backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get('/api/dashboard');

      // Mesclar dados reais do backend com mock data das seções não implementadas
      const backendData = response.data;


      setDashboardData({
        // Dados reais do backend
        faturamentoTotal: backendData.faturamentoTotal || 0,
        faturamentoAberto: backendData.faturamentoAberto || 0,
        totalClientes: backendData.totalClientes || 0,
        totalPedidos: backendData.totalPedidos || 0,
        areasProdutivasHa: backendData.areasProdutivasHa || 0,
        frutasCadastradas: backendData.frutasCadastradas || 0,
        pedidosAtivos: backendData.pedidosAtivos || 0,
        receitaMensal: backendData.receitaMensal || [],
        programacaoColheita: backendData.programacaoColheita || [],

        // Mock data para seções não implementadas (manter temporariamente)
        producaoBanana: {
          totalFitas: 2450,
          areasAtivas: 15,
          proximasColheitas: 8,
          percentualColheita: 75
        },
        turmasAtivas: [
          { nome: 'João Silva', pedidos: 8, valor: 12500.50 },
          { nome: 'Maria Costa', pedidos: 5, valor: 8750.25 },
          { nome: 'Pedro Souza', pedidos: 3, valor: 6200.75 }
        ],
        alertas: {
          pedidosParaColheita: 3,
          precificacoesPendentes: 2,
          pagamentosAtrasados: 1
        }
      });

      // Atualizar previsões de banana com dados do backend
      setBananaPrevisoes(backendData.previsoesBanana || []);

      setLoading(false);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setLoading(false);

      // Em caso de erro, manter dados mock para não quebrar a interface
      console.warn('Usando dados mock devido ao erro na API');
    }
  };

  // Removida a função fetchBananaPrevisoes - dados vêm agora do endpoint principal

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <CentralizedLoader
        visible={true}
        message="Carregando Dashboard Geral..."
        subMessage="Buscando dados financeiros e operacionais"
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#2E7D32", marginBottom: 8 }}>
            <DashboardOutlined style={{ marginRight: 8 }} />
            Dashboard Geral
          </Title>
          <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
            Visão geral do sistema AlencarFrutas - gestão agrícola completa
          </Typography.Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchDashboardData();
          }}
          loading={loading}
          size="middle"
          style={{
            backgroundColor: '#f6ffed',
            borderColor: '#b7eb8f',
            color: '#52c41a',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderWidth: '2px',
            height: '40px',
            padding: '0 16px'
          }}
        >
          Atualizar
        </Button>
      </div>

      {/* Cards Principais - 6 em linha */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={4}>
          <CardStyled>
            <Statistic
              title="Faturamento Total"
              value={dashboardData.faturamentoTotal}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              valueStyle={{
                color: '#52c41a',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              formatter={value => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
              Receita consolidada
            </Typography.Text>
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <CardStyled>
            <Statistic
              title="Faturamento Aberto"
              value={dashboardData.faturamentoAberto}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              precision={2}
              valueStyle={{
                color: '#faad14',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              formatter={value => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
              Pedidos não pagos
            </Typography.Text>
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <CardStyled>
            <Statistic
              title="Clientes Ativos"
              value={dashboardData.totalClientes}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{
                color: '#1890ff',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            />
            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
              Base de clientes
            </Typography.Text>
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <CardStyled>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Statistic
                title="Pedidos Ativos"
                value={dashboardData.pedidosAtivos}
                prefix={<ShoppingCartOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{
                  color: '#722ed1',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              />
              <Badge
                count={`${dashboardData.totalPedidos} total`}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontSize: '10px'
                }}
              />
            </Space>
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <CardStyled>
            <Statistic
              title="Áreas Produtivas"
              value={dashboardData.areasProdutivasHa}
              suffix="ha"
              prefix={<EnvironmentOutlined style={{ color: '#059669' }} />}
              precision={1}
              valueStyle={{
                color: '#059669',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            />
            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
              Hectares produtivos
            </Typography.Text>
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <CardStyled>
            <Statistic
              title="Frutas Cadastradas"
              value={dashboardData.frutasCadastradas}
              prefix={
                <img
                  src="/icons/frutas_64x64.png"
                  alt="Frutas"
                  style={{
                    width: '20px',
                    height: '20px',
                    verticalAlign: 'middle'
                  }}
                />
              }
              valueStyle={{
                color: '#fa8c16',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            />
            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
              Tipos de frutas
            </Typography.Text>
          </CardStyled>
        </Col>
      </Row>

      {/* Seção de Gráficos - 2 colunas */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              📊 Receita Mensal (Últimos 6 Meses)
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.receitaMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                  labelStyle={{ color: '#666' }}
                />
                <Bar dataKey="valor" fill="#52c41a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardStyled>
        </Col>

        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              📅 Programação de Colheita
            </Title>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={dashboardData.programacaoColheita}
                renderItem={(item) => (
                  <List.Item style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: item.status === 'ATRASADO' ? '#fff2f0' : 'transparent',
                    borderRadius: item.status === 'ATRASADO' ? '6px' : '0',
                    margin: item.status === 'ATRASADO' ? '4px 0' : '0',
                    paddingLeft: item.status === 'ATRASADO' ? '8px' : '0',
                    paddingRight: item.status === 'ATRASADO' ? '8px' : '0'
                  }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={40}
                          style={{
                            backgroundColor:
                              item.status === 'ATRASADO' ? '#f5222d' :
                              item.diasRestantes === 0 ? '#faad14' :
                              item.diasRestantes <= 3 ? '#fa8c16' :
                              item.diasRestantes <= 7 ? '#52c41a' : '#1890ff',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.diasRestantes < 0 ? `${Math.abs(item.diasRestantes)}!` :
                           item.diasRestantes === 0 ? 'HOJE' :
                           `${item.diasRestantes}d`}
                        </Avatar>
                      }
                      title={
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: item.status === 'ATRASADO' ? '#f5222d' : '#333',
                          lineHeight: '1.3',
                          marginBottom: '2px'
                        }}>
                          {item.cliente}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.4' }}>
                          <div style={{ marginBottom: '6px', fontWeight: '500' }}>
                            <img
                              src={getFruitIcon(item.fruta)}
                              alt={`Ícone ${item.fruta}`}
                              style={{
                                width: '16px',
                                height: '16px',
                                marginRight: '8px',
                                verticalAlign: 'middle'
                              }}
                              onError={(e) => {
                                e.target.src = "/icons/frutas_64x64.png";
                              }}
                            />
                            <span style={{ fontSize: '15px' }}>{item.fruta}</span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            📦 <span style={{ fontSize: '16px' }}>{item.quantidadePrevista.toLocaleString('pt-BR')}</span> <span style={{ fontSize: '14px' }}>{item.unidade}</span>
                          </div>
                        </div>
                      }
                    />
                    <div style={{ textAlign: 'right', fontSize: '13px' }}>
                      <div style={{
                        color:
                          item.status === 'ATRASADO' ? '#f5222d' :
                          item.diasRestantes === 0 ? '#faad14' :
                          item.diasRestantes <= 3 ? '#fa8c16' :
                          item.diasRestantes <= 7 ? '#52c41a' : '#1890ff',
                        fontWeight: '700',
                        marginBottom: '8px',
                        fontSize: '15px',
                        lineHeight: '1.2'
                      }}>
                        {item.dataPrevistaColheita ?
                          new Date(item.dataPrevistaColheita).toLocaleDateString('pt-BR') :
                          'Data não definida'
                        }
                      </div>
                      <Tag
                        color={
                          item.status === 'ATRASADO' ? 'red' :
                          item.diasRestantes === 0 ? 'gold' :
                          item.diasRestantes <= 3 ? 'orange' :
                          item.diasRestantes <= 7 ? 'green' : 'blue'
                        }
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.status === 'ATRASADO' ? `${Math.abs(item.diasRestantes)} dias atrás` :
                         item.diasRestantes === 0 ? 'HOJE' :
                         item.diasRestantes === 1 ? 'AMANHÃ' :
                         `${item.diasRestantes} dias`}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text style={{ fontSize: '11px', color: '#999' }}>
                {dashboardData.programacaoColheita.length} colheitas programadas
              </Typography.Text>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#f5222d', borderRadius: '50%' }}></div>
                  <Typography.Text style={{ fontSize: '10px', color: '#666' }}>Atrasados</Typography.Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#faad14', borderRadius: '50%' }}></div>
                  <Typography.Text style={{ fontSize: '10px', color: '#666' }}>Hoje</Typography.Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                  <Typography.Text style={{ fontSize: '10px', color: '#666' }}>Próximos</Typography.Text>
                </div>
              </div>
            </div>
          </CardStyled>
        </Col>
      </Row>

      {/* Seção de Produção e Turmas - 2 colunas */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* 🍌 Previsão de Colheita - Banana */}
        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              🍌 Previsão de Colheita - Banana
            </Title>
            <div style={{ position: 'relative' }}>
              {loading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10
                }}>
                  Carregando...
                </div>
              )}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {bananaPrevisoes.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#8c8c8c' }}>
                    <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>Nenhuma previsão de colheita encontrada</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bananaPrevisoes.map((previsao, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          backgroundColor: previsao.status === 'colheita' ? '#f0fdf4' :
                                         previsao.status === 'alerta' ? '#fefce8' :
                                         previsao.status === 'vencido' ? '#fef2f2' : '#f8fafc',
                          border: `2px solid ${previsao.status === 'colheita' ? '#16a34a' :
                                              previsao.status === 'alerta' ? '#d97706' :
                                              previsao.status === 'vencido' ? '#dc2626' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Lado esquerdo: Info da semana e ícone */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            fontSize: '20px',
                            filter: previsao.status === 'colheita' ? 'drop-shadow(0 0 4px rgba(22, 163, 74, 0.4))' : 'none'
                          }}>
                            {previsao.status === 'colheita' ? '🍌' :
                             previsao.status === 'alerta' ? '⚠️' :
                             previsao.status === 'vencido' ? '🚨' : '🌱'}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '700',
                              fontSize: '14px',
                              color: previsao.status === 'colheita' ? '#166534' :
                                     previsao.status === 'alerta' ? '#92400e' :
                                     previsao.status === 'vencido' ? '#991b1b' : '#475569',
                              marginBottom: '2px'
                            }}>
                              Semana {previsao.numeroSemana} • {previsao.periodoSemana}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              📦 {previsao.totalFitas} fitas • {previsao.detalhes.length} área{previsao.detalhes.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        {/* Centro: Detalhes das áreas/fitas */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          maxWidth: '300px',
                          overflow: 'hidden'
                        }}>
                          {previsao.detalhes.slice(0, 3).map((detalhe, detIndex) => (
                            <div key={detIndex} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: '12px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              fontSize: '11px'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: detalhe.fitaCor,
                                borderRadius: '50%',
                                border: '1px solid #fff',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                flexShrink: 0
                              }} />
                              <span style={{
                                color: '#333',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '80px'
                              }}>
                                {detalhe.areaNome}
                              </span>
                              <span style={{
                                color: previsao.status === 'colheita' ? '#166534' : '#92400e',
                                fontWeight: '700'
                              }}>
                                {detalhe.quantidadeFitas}
                              </span>
                            </div>
                          ))}
                          {previsao.detalhes.length > 3 && (
                            <div style={{
                              padding: '4px 8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: '12px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              fontSize: '11px',
                              color: '#666',
                              fontWeight: '500'
                            }}>
                              +{previsao.detalhes.length - 3} mais
                            </div>
                          )}
                        </div>

                        {/* Lado direito: Dias restantes */}
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: previsao.status === 'colheita' ? '#166534' :
                                 previsao.status === 'alerta' ? '#92400e' :
                                 previsao.status === 'vencido' ? '#991b1b' : '#475569',
                          textAlign: 'center',
                          padding: '6px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '6px',
                          border: `1px solid ${previsao.status === 'colheita' ? '#16a34a' :
                                               previsao.status === 'alerta' ? '#d97706' :
                                               previsao.status === 'vencido' ? '#dc2626' : '#e2e8f0'}`,
                          minWidth: '80px'
                        }}>
                          {previsao.diasRestantes > 0 ?
                            `${previsao.diasRestantes} dias` :
                            previsao.diasRestantes === 0 ? 'Hoje' :
                            `${Math.abs(previsao.diasRestantes)}d atrás`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardStyled>
        </Col>

        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              👥 Turmas de Colheita Mais Ativas
            </Title>
            <List
              itemLayout="horizontal"
              dataSource={dashboardData.turmasAtivas}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: ['#52c41a', '#1890ff', '#faad14'][index],
                          color: 'white'
                        }}
                      >
                        {item.nome.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    }
                    title={item.nome}
                    description={`${item.pedidos} pedidos ativos`}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Typography.Text strong style={{ color: '#52c41a' }}>
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography.Text>
                  </div>
                </List.Item>
              )}
            />
            <Button type="link" style={{ padding: 0, height: 'auto' }}>
              Ver todas as turmas (12) →
            </Button>
          </CardStyled>
        </Col>
      </Row>

      {/* Seção de Alertas e Ações Rápidas */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#f5222d', marginBottom: '16px' }}>
              ⚠️ Alertas e Pendências
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  <Typography.Text>Pedidos para colheita</Typography.Text>
                </Space>
                <Badge count={dashboardData.alertas.pedidosParaColheita} style={{ backgroundColor: '#faad14' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#722ed1' }} />
                  <Typography.Text>Precificações pendentes</Typography.Text>
                </Space>
                <Badge count={dashboardData.alertas.precificacoesPendentes} style={{ backgroundColor: '#722ed1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <SyncOutlined style={{ color: '#f5222d' }} />
                  <Typography.Text>Pagamentos atrasados</Typography.Text>
                </Space>
                <Badge count={dashboardData.alertas.pagamentosAtrasados} style={{ backgroundColor: '#f5222d' }} />
              </div>
            </Space>
          </CardStyled>
        </Col>

        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#2E7D32', marginBottom: '16px' }}>
              ⚡ Ações Rápidas
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                block
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Novo Pedido
              </Button>

              <Button
                icon={<TeamOutlined />}
                size="large"
                block
              >
                Novo Cliente
              </Button>

              <Button
                icon={<EnvironmentOutlined />}
                size="large"
                block
              >
                Nova Área Agrícola
              </Button>

              <Button
                icon={<GiftOutlined />}
                size="large"
                block
              >
                Controle de Banana
              </Button>
            </Space>
          </CardStyled>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
