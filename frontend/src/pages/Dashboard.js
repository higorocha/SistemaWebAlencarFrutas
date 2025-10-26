import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Statistic, Space, Badge, Button, Progress, List, Avatar, Tag, message } from "antd";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
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
  ScheduleOutlined,
  SwapOutlined
} from "@ant-design/icons";
import useResponsive from "../hooks/useResponsive";
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
import PagamentosPendentesModal from "../components/dashboard/PagamentosPendentesModal";
import PagamentosEfetuadosModal from "../components/dashboard/PagamentosEfetuadosModal";
import ModalDetalhesSemana from "../components/producao/ModalDetalhesSemana";
import ColheitaModal from "../components/pedidos/ColheitaModal";
import ProgramacaoColheitaGrid from "../components/dashboard/ProgramacaoColheitaGrid";
import { numberFormatter, capitalizeNameShort, capitalizeName } from "../utils/formatters";

const { Title } = Typography;

// Componente de ícone personalizado para Dashboard Geral
const DashboardGeralIcon = ({ isMobile }) => {
  const iconSize = isMobile ? '31px' : '31px';
  const smallIconSize = isMobile ? '17px' : '14px';
  
  return (
    <div style={{ 
      position: 'relative', 
      width: iconSize, 
      height: iconSize,
      marginRight: 8
    }}>
      {/* Ícone de fundo branco (borda) */}
      <Icon 
        icon="ant-design:dashboard-twotone" 
        style={{ 
          position: 'absolute',
          right: '-4px',
          bottom: '-3px',
          fontSize: `${parseInt(smallIconSize) + 4}px`,
          color: "#ffffff"
        }} 
      />
      {/* Ícone principal - Dashboard */}
      <Icon 
        icon="mdi:monitor-dashboard" 
        style={{ 
          fontSize: iconSize,
          color: "#2E7D32"
        }} 
      />
      {/* Ícone secundário - ant-design:dashboard-twotone (canto inferior direito) */}
      <Icon 
        icon="ant-design:dashboard-twotone" 
        style={{ 
          position: 'absolute',
          right: '-2px',
          bottom: '-1px',
          fontSize: smallIconSize,
          color: "#2E7D32"
        }} 
      />
    </div>
  );
};

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

// Constantes para o toggle de pagamentos
const PAGAMENTOS_MODOS = {
  PENDENTES: 'pendentes',
  EFETUADOS: 'efetuados'
};

const Dashboard = () => {
  const { isMobile, isTablet, screenSize, isSmallMobile } = useResponsive();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bananaPrevisoes, setBananaPrevisoes] = useState([]);
  const [modoPagamentos, setModoPagamentos] = useState(PAGAMENTOS_MODOS.PENDENTES);
  const [modalPagamentos, setModalPagamentos] = useState({
    open: false,
    turmaId: null,
    turmaNome: null
  });
  
  const [modalPagamentosEfetuados, setModalPagamentosEfetuados] = useState({
    open: false,
    turmaId: null,
    turmaNome: null
  });
  
  const [modalSemana, setModalSemana] = useState({
    visible: false,
    dados: [],
    semana: null
  });
  
  const [colheitaModal, setColheitaModal] = useState({
    open: false,
    pedido: null
  });
  
  const [loadingColheita, setLoadingColheita] = useState(false);
  
  // Estados para controle de loading específico do toggle de pagamentos
  const [loadingPagamentosEfetuados, setLoadingPagamentosEfetuados] = useState(false);
  const [pagamentosEfetuadosCarregados, setPagamentosEfetuadosCarregados] = useState(false);
  const [erroPagamentosEfetuados, setErroPagamentosEfetuados] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null); // Timestamp do último carregamento
  const [cacheCountdown, setCacheCountdown] = useState(0); // Contador regressivo do cache
  const [dashboardData, setDashboardData] = useState({
    // Cards principais
    faturamentoTotal: 0,
    faturamentoAberto: 0,
    totalClientes: 0,
    totalPedidos: 0,
    areasProdutivasHa: 0,
    frutasCadastradas: 0,
    pedidosAtivos: 0,

    // Dados para gráficos
    receitaMensal: [],

    // Programação de colheita
    programacaoColheita: [],

    // Pagamentos pendentes
    pagamentosPendentes: [],

    // Pagamentos efetuados
    pagamentosEfetuados: [],

    // Alertas - apenas esta seção mantém dados mock
    alertas: {
      pedidosParaColheita: 3,
      precificacoesPendentes: 2,
      pagamentosAtrasados: 1
    }
  });
  const theme = useTheme();

  // Funções de navegação para os cards
  const handleNavigateToClientes = () => {
    navigate('/clientes');
  };

  const handleNavigateToPedidos = () => {
    navigate('/pedidos/dashboard');
  };

  const handleNavigateToAreas = () => {
    navigate('/areas-agricolas');
  };

  const handleNavigateToFrutas = () => {
    navigate('/frutas');
  };

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
        pagamentosPendentes: backendData.pagamentosPendentes || [],
        pagamentosEfetuados: backendData.pagamentosEfetuados || [],

        // Alertas - apenas esta seção mantém dados mock
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
      
      // Em caso de erro, manter dados vazios exceto alertas
      setDashboardData(prev => ({
        ...prev,
        // Manter apenas alertas com dados mock
        alertas: {
          pedidosParaColheita: 3,
          precificacoesPendentes: 2,
          pagamentosAtrasados: 1
        }
      }));
    }
  };

  // Função para abrir modal de pagamentos
  const abrirModalPagamentos = (turmaId, turmaNome) => {
    setModalPagamentos({
      open: true,
      turmaId,
      turmaNome
    });
  };

  // Função para fechar modal de pagamentos
  const fecharModalPagamentos = (houvePagamentos = false) => {
    setModalPagamentos({
      open: false,
      turmaId: null,
      turmaNome: null
    });
    // Atualizar dashboard apenas se houve pagamentos processados
    if (houvePagamentos) {
      fetchDashboardData();
      // Resetar flag de carregamento dos pagamentos efetuados para forçar reload
      setPagamentosEfetuadosCarregados(false);
      setCacheTimestamp(null); // Resetar cache para forçar nova requisição
      setErroPagamentosEfetuados(null); // Limpar qualquer erro anterior
    }
  };

  // Função para abrir modal de pagamentos efetuados
  const abrirModalPagamentosEfetuados = (turmaId, turmaNome) => {
    setModalPagamentosEfetuados({
      open: true,
      turmaId,
      turmaNome
    });
  };

  // Função para fechar modal de pagamentos efetuados
  const fecharModalPagamentosEfetuados = () => {
    setModalPagamentosEfetuados({
      open: false,
      turmaId: null,
      turmaNome: null
    });
  };

  // Função para abrir modal de detalhes da semana
  const abrirModalSemana = (previsao) => {
    if (previsao.detalhes.length > 0) {
      // Transformar dados do Dashboard para o formato esperado pelo modal
      const dadosModal = previsao.detalhes.map(detalhe => ({
        id: detalhe.id,
        fitaNome: detalhe.fitaNome,
        fitaCor: detalhe.fitaCor,
        quantidade: detalhe.quantidadeFitas,
        dataRegistro: new Date(detalhe.dataRegistro),
        areaNome: detalhe.areaNome,
        status: previsao.status
      }));

      const semanaModal = {
        numero: previsao.numeroSemana,
        inicio: new Date(previsao.dataInicio),
        fim: new Date(previsao.dataFim)
      };

      setModalSemana({
        visible: true,
        dados: dadosModal,
        semana: semanaModal
      });
    }
  };

  // Função para fechar modal de detalhes da semana
  const fecharModalSemana = () => {
    setModalSemana({
      visible: false,
      dados: [],
      semana: null
    });
  };

  // Função para abrir modal de colheita
  const abrirModalColheita = async (item) => {
    try {
      setLoadingColheita(true);
      // Buscar o pedido completo pelo ID
      const response = await axiosInstance.get(`/api/pedidos/${item.pedidoId}`);
      setColheitaModal({
        open: true,
        pedido: response.data
      });
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      message.error("Erro ao carregar dados do pedido");
    } finally {
      setLoadingColheita(false);
    }
  };

  // Função para fechar modal de colheita
  const fecharModalColheita = () => {
    setColheitaModal({
      open: false,
      pedido: null
    });
  };

  // Função para salvar colheita
  const handleSalvarColheita = async (colheitaData) => {
    try {
      console.log("Salvando colheita...");
      await axiosInstance.patch(`/api/pedidos/${colheitaModal.pedido.id}/colheita`, colheitaData);
      console.log("Colheita salva com sucesso!");
      message.success("Colheita registrada com sucesso!");
      
      fecharModalColheita();
      
      // Recarregar dados do dashboard
      console.log("Atualizando dados do dashboard...");
      await fetchDashboardData();
      console.log("Dados do dashboard atualizados!");
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const errorMessage = error.response?.data?.message || "Erro ao registrar colheita";
      message.error(errorMessage);
      throw error; // Re-throw para o modal tratar
    }
  };

  // Função para alternar entre pagamentos pendentes e efetuados
  const toggleModoPagamentos = async () => {
    // Evitar cliques múltiplos durante carregamento
    if (loadingPagamentosEfetuados) {
      return;
    }
    
    const novoModo = modoPagamentos === PAGAMENTOS_MODOS.PENDENTES 
      ? PAGAMENTOS_MODOS.EFETUADOS 
      : PAGAMENTOS_MODOS.PENDENTES;
    
    // Verificar se cache ainda é válido (30 segundos)
    const agora = Date.now();
    const cacheValido = cacheTimestamp && (agora - cacheTimestamp) < 30000; // 30 segundos
    
    // Se mudando para efetuados e (não carregou OU cache expirou), buscar dados
    if (novoModo === PAGAMENTOS_MODOS.EFETUADOS && (!pagamentosEfetuadosCarregados || !cacheValido)) {
      setLoadingPagamentosEfetuados(true);
      setErroPagamentosEfetuados(null); // Limpar erro anterior
      
      try {
        const response = await axiosInstance.get('/api/turma-colheita/pagamentos-efetuados');
        
        setDashboardData(prev => ({
          ...prev,
          pagamentosEfetuados: response.data || []
        }));
        setPagamentosEfetuadosCarregados(true);
        setCacheTimestamp(agora); // Salvar timestamp do carregamento
      } catch (error) {
        console.error('Erro ao carregar pagamentos efetuados:', error);
        setErroPagamentosEfetuados('Erro ao carregar pagamentos efetuados. Tente novamente.');
        // Em caso de erro, não muda o modo
        setLoadingPagamentosEfetuados(false);
        return;
      }
      
      setLoadingPagamentosEfetuados(false);
    }
    
    // Mudar o modo APÓS a requisição (se necessário)
    setModoPagamentos(novoModo);
  };

  // Função auxiliar para verificar se está no modo pendentes
  const isModoPendentes = modoPagamentos === PAGAMENTOS_MODOS.PENDENTES;

  // Dados atuais baseados no modo selecionado
  const dadosPagamentosAtuais = isModoPendentes 
    ? dashboardData.pagamentosPendentes 
    : dashboardData.pagamentosEfetuados;


  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Timer para atualizar contador do cache
  useEffect(() => {
    if (!cacheTimestamp) {
      setCacheCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const agora = Date.now();
      const tempoRestante = Math.max(0, 30000 - (agora - cacheTimestamp));
      setCacheCountdown(Math.floor(tempoRestante / 1000));
    };

    // Atualizar imediatamente
    updateCountdown();

    // Atualizar a cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [cacheTimestamp]);

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
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <div
        className="dashboard-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'center' : 'flex-start',
          marginBottom: isMobile ? '16px' : '24px',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '0'
        }}
      >
        <div style={{ textAlign: 'left' }}> {/* ✅ Sempre alinhado à esquerda como desktop */}
          <Title
            level={isMobile ? 3 : 2} // ✅ level={3} no mobile para consistência
            style={{
              margin: 0,
              color: "#2E7D32",
              marginBottom: 8,
              textAlign: 'left', // ✅ Sempre alinhado à esquerda
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap' // ✅ Permite quebra de linha se necessário
            }}
          >
            <DashboardGeralIcon isMobile={isMobile} />
            Dashboard Geral {/* ✅ Exatamente igual ao desktop */}
          </Title>
          <Typography.Text
            type="secondary"
            style={{
              display: 'block',
              textAlign: 'left' // ✅ Sempre alinhado à esquerda
            }}
          >
          </Typography.Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchDashboardData();
          }}
          loading={loading}
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: '#f6ffed',
            borderColor: '#b7eb8f',
            color: '#52c41a',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderWidth: '2px',
            height: isMobile ? '32px' : '40px',
            padding: isMobile ? '0 12px' : '0 16px',
            fontSize: '0.875rem'
          }}
        >
          Atualizar
        </Button>
      </div>

      {/* Cards Principais - Responsivos */}
      {isMobile ? (
        /* Mobile: Grid Compacto 2x3 - Estilo consistente com desktop */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Card 1: Faturamento Total */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <DollarOutlined style={{ fontSize: '28px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#52c41a', lineHeight: 1.2, marginBottom: '6px' }}>
                {dashboardData.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Faturamento Total
              </div>
            </div>
          </CardStyled>

          {/* Card 2: Faturamento Aberto */}
          <CardStyled style={{ margin: 0 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <DollarOutlined style={{ fontSize: '28px', color: '#faad14', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#faad14', lineHeight: 1.2, marginBottom: '6px' }}>
                {dashboardData.faturamentoAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Faturamento Aberto
              </div>
            </div>
          </CardStyled>

          {/* Card 3: Clientes Ativos */}
          <CardStyled 
            style={{ margin: 0, cursor: 'pointer' }}
            onClick={handleNavigateToClientes}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <TeamOutlined style={{ fontSize: '28px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1890ff', lineHeight: 1.2, marginBottom: '6px' }}>
                {dashboardData.totalClientes}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Clientes Ativos
              </div>
            </div>
          </CardStyled>

          {/* Card 4: Pedidos Ativos */}
          <CardStyled 
            style={{ margin: 0, cursor: 'pointer' }}
            onClick={handleNavigateToPedidos}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <ShoppingCartOutlined style={{ fontSize: '28px', color: '#722ed1', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#722ed1', lineHeight: 1.2, marginBottom: '6px' }}>
                {dashboardData.pedidosAtivos}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Pedidos Ativos
              </div>
            </div>
          </CardStyled>

          {/* Card 5: Áreas Produtivas */}
          <CardStyled 
            style={{ margin: 0, cursor: 'pointer' }}
            onClick={handleNavigateToAreas}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <EnvironmentOutlined style={{ fontSize: '28px', color: '#059669', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#059669', lineHeight: 1.2, marginBottom: '6px' }}>
                {numberFormatter(dashboardData.areasProdutivasHa)} ha
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Áreas Produtivas
              </div>
            </div>
          </CardStyled>

          {/* Card 6: Frutas Cadastradas */}
          <CardStyled 
            style={{ margin: 0, cursor: 'pointer' }}
            onClick={handleNavigateToFrutas}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minHeight: '100px'
            }}>
              <img
                src="/icons/frutas_64x64.png"
                alt="Frutas"
                style={{
                  width: '28px',
                  height: '28px',
                  marginBottom: '8px'
                }}
              />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fa8c16', lineHeight: 1.2, marginBottom: '6px' }}>
                {dashboardData.frutasCadastradas}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400' }}>
                Frutas Cadastradas
              </div>
            </div>
          </CardStyled>
        </div>
      ) : (
        /* Desktop: Row tradicional */
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled>
              <Statistic
                title="Faturamento Total"
                value={dashboardData.faturamentoTotal}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                precision={2}
                valueStyle={{
                  color: '#52c41a',
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}
                formatter={value => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              />
              <Typography.Text type="secondary" style={{ fontSize: '0.6875rem' }}>
                Receita consolidada
              </Typography.Text>
            </CardStyled>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled>
              <Statistic
                title="Faturamento Aberto"
                value={dashboardData.faturamentoAberto}
                prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                precision={2}
                valueStyle={{
                  color: '#faad14',
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}
                formatter={value => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              />
              <Typography.Text type="secondary" style={{ fontSize: '0.6875rem' }}>
                Pedidos não pagos
              </Typography.Text>
            </CardStyled>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled 
              style={{ cursor: 'pointer' }}
              onClick={handleNavigateToClientes}
            >
              <Statistic
                title="Clientes Ativos"
                value={dashboardData.totalClientes}
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{
                  color: '#1890ff',
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}
              />
              <Typography.Text type="secondary" style={{ fontSize: '0.6875rem' }}>
                Base de clientes
              </Typography.Text>
            </CardStyled>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled 
              style={{ cursor: 'pointer' }}
              onClick={handleNavigateToPedidos}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Statistic
                  title="Pedidos Ativos"
                  value={dashboardData.pedidosAtivos}
                  prefix={<ShoppingCartOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{
                    color: '#722ed1',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}
                />
                <Badge
                  count={`${dashboardData.totalPedidos} total`}
                  style={{
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    fontSize: '0.625rem'
                  }}
                />
              </Space>
            </CardStyled>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled 
              style={{ cursor: 'pointer' }}
              onClick={handleNavigateToAreas}
            >
              <Statistic
                title="Áreas Produtivas"
                value={numberFormatter(dashboardData.areasProdutivasHa)}
                suffix={<span style={{ fontSize: '1.25rem' }}>ha</span>}
                prefix={<EnvironmentOutlined style={{ color: '#059669' }} />}
                valueStyle={{
                  color: '#059669',
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}
              />
              <Typography.Text type="secondary" style={{ fontSize: '0.6875rem' }}>
                Hectares produtivos
              </Typography.Text>
            </CardStyled>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled 
              style={{ cursor: 'pointer' }}
              onClick={handleNavigateToFrutas}
            >
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
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}
              />
              <Typography.Text type="secondary" style={{ fontSize: '0.6875rem' }}>
                Tipos de frutas
              </Typography.Text>
            </CardStyled>
          </Col>
        </Row>
      )}

      {/* Seção de Gráficos - Responsivos */}
      <Row gutter={isMobile ? [8, 8] : [24, 24]} style={{ marginBottom: isMobile ? '16px' : '32px' }}>
        <Col xs={24} lg={12}>
          <CardStyled
            bodyStyle={{
              padding: isMobile ? '12px' : '16px'
            }}
          >
            <Title
              level={4}
              style={{
                color: '#2E7D32',
                marginBottom: isMobile ? '8px' : '12px',
                fontSize: '1rem',
                marginTop: 0
              }}
            >
              📊 {isMobile ? 'Receita Mensal (6 Meses)' : 'Receita Mensal (Últimos 6 Meses)'}
            </Title>
{isMobile ? (
              // Mobile: Gráfico de Pizza compacto
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.receitaMensal}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="valor"
                    nameKey="mes"
                  >
                    {dashboardData.receitaMensal.map((entry, index) => {
                      const colors = ['#52c41a', '#1890ff', '#722ed1', '#faad14', '#fa8c16', '#f5222d'];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                    labelStyle={{ color: '#666', fontSize: '0.75rem' }}
                    contentStyle={{
                      fontSize: '0.75rem',
                      padding: '8px',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: '0.6875rem',
                      paddingTop: '10px'
                    }}
                    formatter={(value) => (
                      <span style={{ fontSize: '0.625rem', color: '#666' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              // Desktop: Gráfico de Barras original
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={dashboardData.receitaMensal} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Receita'
                    ]}
                    labelStyle={{ color: '#666', fontSize: '0.875rem' }}
                    contentStyle={{
                      fontSize: '0.875rem',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="valor" fill="#52c41a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardStyled>
        </Col>

        <Col xs={24} lg={12}>
          <CardStyled
            bodyStyle={{
              padding: isMobile ? '12px' : '16px'
            }}
          >
            <ProgramacaoColheitaGrid
              programacaoColheita={dashboardData.programacaoColheita || []}
              onColheitaClick={abrirModalColheita}
            />
          </CardStyled>
        </Col>
      </Row>

      {/* Seção de Produção e Turmas - 2 colunas */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* 🍌 Previsão de Colheita - Banana */}
        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#2E7D32', marginBottom: '1rem', fontSize: '1rem' }}>
              🍌 Previsão Banana
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
                    <CalendarOutlined style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                    <div>Nenhuma previsão de colheita encontrada</div>
                    <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
                      Aguardando dados do sistema de controle de banana
                    </Typography.Text>
                  </div>
                ) :
                  isMobile ? (
                    // Mobile: Layout vertical compacto
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {bananaPrevisoes.map((previsao, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '10px',
                            backgroundColor: previsao.status === 'colheita' ? '#f0fdf4' :
                                           previsao.status === 'alerta' ? '#fefce8' :
                                           previsao.status === 'vencido' ? '#fef2f2' : '#f8fafc',
                            border: `2px solid ${previsao.status === 'colheita' ? '#16a34a' :
                                                previsao.status === 'alerta' ? '#d97706' :
                                                previsao.status === 'vencido' ? '#dc2626' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => abrirModalSemana(previsao)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Header: Ícone + Semana + Dias */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '1rem' }}>
                                {previsao.status === 'colheita' ? '🍌' :
                                 previsao.status === 'alerta' ? '⚠️' :
                                 previsao.status === 'vencido' ? '🚨' : '🌱'}
                              </div>
                              <div style={{
                                fontWeight: '700',
                                fontSize: '0.75rem',
                                color: previsao.status === 'colheita' ? '#166534' :
                                       previsao.status === 'alerta' ? '#92400e' :
                                       previsao.status === 'vencido' ? '#991b1b' : '#475569'
                              }}>
                                Semana {previsao.numeroSemana}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '0.625rem',
                              fontWeight: '700',
                              color: previsao.status === 'colheita' ? '#166534' :
                                     previsao.status === 'alerta' ? '#92400e' :
                                     previsao.status === 'vencido' ? '#991b1b' : '#475569',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '6px',
                              border: `1px solid ${previsao.status === 'colheita' ? '#16a34a' :
                                                   previsao.status === 'alerta' ? '#d97706' :
                                                   previsao.status === 'vencido' ? '#dc2626' : '#e2e8f0'}`
                            }}>
                              {previsao.diasRestantes > 0 ?
                                `${previsao.diasRestantes}d` :
                                previsao.diasRestantes === 0 ? 'HOJE' :
                                `${Math.abs(previsao.diasRestantes)}d atrás`
                              }
                            </div>
                          </div>

                          {/* Body: Fitas + Áreas */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px'
                          }}>
                            <div style={{
                              fontSize: '0.625rem',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              📦 {previsao.totalFitas} fitas
                            </div>
                            <div style={{
                              fontSize: '0.625rem',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              🏞️ {previsao.detalhes.length} área{previsao.detalhes.length > 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Footer: Cores das fitas */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '6px'
                          }}>
                            {previsao.detalhes.slice(0, 4).map((detalhe, detIndex) => (
                              <div key={detIndex} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '8px',
                                fontSize: '0.5625rem'
                              }}>
                                <span style={{
                                  color: '#333',
                                  fontWeight: '500',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '50px'
                                }}>
                                  {detalhe.areaNome}
                                </span>
                                <span style={{
                                  color: '#666',
                                  fontWeight: '500',
                                  fontSize: '0.5rem',
                                  marginRight: '2px'
                                }}>
                                  →
                                </span>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: detalhe.fitaCor,
                                  borderRadius: '50%',
                                  border: '1px solid #fff',
                                  flexShrink: 0
                                }} />
                                <span style={{
                                  color: previsao.status === 'colheita' ? '#166534' : '#92400e',
                                  fontWeight: '700',
                                  fontSize: '0.5rem'
                                }}>
                                  {detalhe.quantidadeFitas} fitas
                                </span>
                              </div>
                            ))}
                            {previsao.detalhes.length > 4 && (
                              <div style={{
                                padding: '2px 6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '8px',
                                fontSize: '0.5625rem',
                                color: '#666',
                                fontWeight: '500'
                              }}>
                                +{previsao.detalhes.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Desktop: Layout horizontal original
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
                          onClick={() => abrirModalSemana(previsao)}
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
                              fontSize: '1.25rem',
                              filter: previsao.status === 'colheita' ? 'drop-shadow(0 0 4px rgba(22, 163, 74, 0.4))' : 'none'
                            }}>
                              {previsao.status === 'colheita' ? '🍌' :
                               previsao.status === 'alerta' ? '⚠️' :
                               previsao.status === 'vencido' ? '🚨' : '🌱'}
                            </div>
                            <div>
                              <div style={{
                                fontWeight: '700',
                                fontSize: '0.875rem',
                                color: previsao.status === 'colheita' ? '#166534' :
                                       previsao.status === 'alerta' ? '#92400e' :
                                       previsao.status === 'vencido' ? '#991b1b' : '#475569',
                                marginBottom: '2px'
                              }}>
                                Semana {previsao.numeroSemana} • {previsao.periodoSemana}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
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
                                fontSize: '0.6875rem'
                              }}>
                                <span style={{
                                  color: '#333',
                                  fontWeight: '500',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '60px'
                                }}>
                                  {detalhe.areaNome}
                                </span>
                                <span style={{
                                  color: '#666',
                                  fontWeight: '500',
                                  fontSize: '0.625rem',
                                  marginRight: '2px'
                                }}>
                                  →
                                </span>
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
                                  color: previsao.status === 'colheita' ? '#166534' : '#92400e',
                                  fontWeight: '700'
                                }}>
                                  {detalhe.quantidadeFitas} fitas
                                </span>
                              </div>
                            ))}
                            {previsao.detalhes.length > 3 && (
                              <div style={{
                                padding: '4px 8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                fontSize: '0.6875rem',
                                color: '#666',
                                fontWeight: '500'
                              }}>
                                +{previsao.detalhes.length - 3} mais
                              </div>
                            )}
                          </div>

                          {/* Lado direito: Dias restantes */}
                          <div style={{
                            fontSize: '0.75rem',
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
                  )
                }
              </div>
            </div>
          </CardStyled>
        </Col>

        <Col xs={24} lg={12}>
          <CardStyled>
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
                onClick={toggleModoPagamentos}
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
              >
              </Button>
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
              {dadosPagamentosAtuais && dadosPagamentosAtuais.length === 0 && !loadingPagamentosEfetuados && !erroPagamentosEfetuados ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#8c8c8c' }}>
                  <CheckCircleOutlined style={{ fontSize: '3rem', marginBottom: '1rem', color: '#52c41a' }} />
                  <div>{isModoPendentes ? 'Nenhum pagamento pendente' : 'Nenhum pagamento efetuado'}</div>
                  <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
                    {isModoPendentes 
                      ? 'Todos os colheitadores estão em dia'
                      : 'Ainda não há registros de pagamentos realizados'
                    }
                  </Typography.Text>
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
                    onClick={() => {
                      setErroPagamentosEfetuados(null);
                      setPagamentosEfetuadosCarregados(false);
                      toggleModoPagamentos();
                    }}
                    style={{ 
                      color: '#059669', 
                      borderColor: '#059669' 
                    }}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : dadosPagamentosAtuais && dadosPagamentosAtuais.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={dadosPagamentosAtuais}
                    renderItem={(item, index) => (
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
                        onClick={isModoPendentes ? () => abrirModalPagamentos(item.id, item.nomeColhedor) : () => {
                          // Extrair turmaId do ID do pagamento (formato: "turmaId-timestamp")
                          const turmaId = parseInt(item.id.split('-')[0]);
                          abrirModalPagamentosEfetuados(turmaId, item.nomeColhedor);
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
              {dadosPagamentosAtuais && dadosPagamentosAtuais.length > 0 && (
                <div style={{ 
                  marginTop: 'auto',
                  padding: '12px 0 0 0',
                  borderTop: '1px solid #f0f0f0',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <Typography.Text style={{ fontSize: '0.6875rem', color: '#999', maxWidth: '60%' }}>
                    {isModoPendentes
                      ? `${dadosPagamentosAtuais.length} colhedor${dadosPagamentosAtuais.length > 1 ? 'es' : ''} com ${'\u00A0'}pagamento${dadosPagamentosAtuais.length > 1 ? 's' : ''} pendente${dadosPagamentosAtuais.length > 1 ? 's' : ''}`
                      : `${dadosPagamentosAtuais.length} pagamento${dadosPagamentosAtuais.length > 1 ? 's' : ''} realizado${dadosPagamentosAtuais.length > 1 ? 's' : ''}`
                    }
                  </Typography.Text>
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
                          <Typography.Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                            {isMobile ? '>R$1k' : 'Alto'}
                          </Typography.Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#faad14', borderRadius: '50%' }}></div>
                          <Typography.Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                            {isMobile ? 'R$500+' : 'Médio'}
                          </Typography.Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                          <Typography.Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                            {isMobile ? '<R$500' : 'Baixo'}
                          </Typography.Text>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                        <Typography.Text style={{ fontSize: '0.5625rem', color: '#666' }}>
                          {isMobile ? 'Concluídos' : 'Pagamentos concluídos'}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardStyled>
        </Col>
      </Row>

      {/* Seção de Alertas e Ações Rápidas */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <CardStyled>
            <Title level={4} style={{ color: '#f5222d', marginBottom: '1rem', fontSize: '1rem' }}>
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
            <Title
              level={isMobile ? 5 : 4}
              style={{
                color: '#2E7D32',
                marginBottom: isMobile ? '12px' : '16px',
                fontSize: '0.875rem'
              }}
            >
              ⚡ {isMobile ? 'Ações' : 'Ações Rápidas'}
            </Title>
            {isMobile ? (
              // Layout em grid para mobile - 2x2 otimizado
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: isSmallMobile ? '6px' : '8px'
              }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    fontSize: '0.6875rem',
                    height: isSmallMobile ? '38px' : '42px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  {isSmallMobile ? '+ Pedido' : 'Pedido'}
                </Button>

                <Button
                  icon={<TeamOutlined />}
                  size="small"
                  style={{
                    fontSize: '0.6875rem',
                    height: isSmallMobile ? '38px' : '42px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  Cliente
                </Button>

                <Button
                  icon={<EnvironmentOutlined />}
                  size="small"
                  style={{
                    fontSize: '0.6875rem',
                    height: isSmallMobile ? '38px' : '42px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  Área
                </Button>

                <Button
                  icon={<GiftOutlined />}
                  size="small"
                  style={{
                    fontSize: '0.6875rem',
                    height: isSmallMobile ? '38px' : '42px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  🍌 Banana
                </Button>
              </div>
            ) : (
              // Layout vertical para desktop/tablet com melhorias
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  block
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Novo Pedido
                </Button>

                <Button
                  icon={<TeamOutlined />}
                  size="large"
                  block
                  style={{
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Novo Cliente
                </Button>

                <Button
                  icon={<EnvironmentOutlined />}
                  size="large"
                  block
                  style={{
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Nova Área Agrícola
                </Button>

                <Button
                  icon={<GiftOutlined />}
                  size="large"
                  block
                  style={{
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  🍌 Controle de Banana
                </Button>
              </Space>
            )}
          </CardStyled>
        </Col>
      </Row>

      {/* Modal de Pagamentos Pendentes */}
      <PagamentosPendentesModal
        open={modalPagamentos.open}
        onClose={fecharModalPagamentos}
        turmaId={modalPagamentos.turmaId}
        turmaNome={modalPagamentos.turmaNome}
        onPagamentosProcessados={() => fecharModalPagamentos(true)}
      />

      {/* Modal de Pagamentos Efetuados */}
      <PagamentosEfetuadosModal
        open={modalPagamentosEfetuados.open}
        onClose={fecharModalPagamentosEfetuados}
        turmaId={modalPagamentosEfetuados.turmaId}
        turmaNome={modalPagamentosEfetuados.turmaNome}
      />

      {/* Modal de Detalhes da Semana */}
      <ModalDetalhesSemana
        visible={modalSemana.visible}
        onClose={fecharModalSemana}
        semana={modalSemana.semana}
        dados={modalSemana.dados}
      />

      {/* Modal de Colheita */}
      <ColheitaModal
        open={colheitaModal.open}
        onClose={fecharModalColheita}
        onSave={handleSalvarColheita}
        pedido={colheitaModal.pedido}
        loading={false}
        onLoadingChange={(loading, message) => {
          setLoadingColheita(loading);
          // Aqui podemos usar o message se necessário para o CentralizedLoader
        }}
      />

      {/* CentralizedLoader para carregamento do modal de colheita */}
      <CentralizedLoader
        visible={loadingColheita}
        message="Carregando dados do pedido..."
        subMessage="Preparando informações para colheita"
      />
    </div>
  );
};

export default Dashboard;
