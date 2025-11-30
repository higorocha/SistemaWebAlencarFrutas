import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Statistic, Space, Badge, Button, Progress, List, Avatar, Tag, message, Tooltip as AntdTooltip } from "antd";
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
import usePedidoStatusColors from "../hooks/usePedidoStatusColors";
import CentralizedLoader from "../components/common/loaders/CentralizedLoader";
import { useAuth } from "../contexts/AuthContext";
import ModalDetalhesSemana from "../components/producao/ModalDetalhesSemana";
import ColheitaModal from "../components/pedidos/ColheitaModal";
import ProgramacaoColheitaGrid from "../components/dashboard/ProgramacaoColheitaGrid";
import { numberFormatter, capitalizeNameShort, capitalizeName } from "../utils/formatters";
import {
  ProgramacaoColheitaSection,
  ReceitaMensalSection,
  PagamentosSection,
  PrevisaoBananaSection,
  AcoesRapidasSection
} from "../components/dashboard/sections";
import StyledTabs from "../components/common/StyledTabs";
import PainelFrutas from "../components/dashboard/painel-frutas/PainelFrutas";

const { Title } = Typography;

// Estilos globais para animações de transição
const GlobalAnimations = styled.div`
  @keyframes fadeInSlide {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

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
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

// Constantes para o toggle de pagamentos
const PAGAMENTOS_MODOS = {
  PENDENTES: 'pendentes',
  EFETUADOS: 'efetuados'
};

const FATURAMENTO_VISIBILIDADE_KEY = 'dashboard.faturamento.visibilidade';

const getInitialFaturamentoVisibilidade = () => {
  if (typeof window === 'undefined') {
    return { total: false, aberto: false };
  }

  try {
    const stored = window.localStorage.getItem(FATURAMENTO_VISIBILIDADE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        total: typeof parsed.total === 'boolean' ? parsed.total : false,
        aberto: typeof parsed.aberto === 'boolean' ? parsed.aberto : false,
      };
    }
  } catch (error) {
    console.error('Erro ao recuperar visibilidade do faturamento:', error);
  }

  return { total: false, aberto: false };
};

const persistFaturamentoVisibilidade = (valor) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FATURAMENTO_VISIBILIDADE_KEY, JSON.stringify(valor));
  } catch (error) {
    console.error('Erro ao salvar visibilidade do faturamento:', error);
  }
};

const Dashboard = () => {
  const { isMobile, isTablet, screenSize, isSmallMobile } = useResponsive();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProgramador = user?.nivel === 'PROGRAMADOR';
  const [loading, setLoading] = useState(true);
  const [bananaPrevisoes, setBananaPrevisoes] = useState([]);
  const [modoPagamentos, setModoPagamentos] = useState(PAGAMENTOS_MODOS.PENDENTES);
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
  const [isPagamentosExpandido, setIsPagamentosExpandido] = useState(false); // Estado para controlar expansão da seção de pagamentos
  const [activeTab, setActiveTab] = useState('dashboard'); // Estado para controlar a aba ativa
  const [painelFrutasCarregado, setPainelFrutasCarregado] = useState(false); // Estado para controlar se o painel de frutas já foi carregado
  const [loadingPainelFrutas, setLoadingPainelFrutas] = useState(false); // Estado para controlar loading do painel de frutas
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
    pagamentosFornecedores: [],
    pagamentosFornecedoresEfetuados: [],

    // Alertas - apenas esta seção mantém dados mock
    alertas: {
      pedidosParaColheita: 3,
      precificacoesPendentes: 2,
      pagamentosAtrasados: 1
    }
  });
  const theme = useTheme();
  const { getStatusConfig } = usePedidoStatusColors();
  const colorColheita = getStatusConfig('AGUARDANDO_COLHEITA')?.color || theme.palette.warning.main;
  const colorPrecificacao = getStatusConfig('AGUARDANDO_PRECIFICACAO')?.color || theme.palette.secondary.main;
  const colorPagamento = getStatusConfig('AGUARDANDO_PAGAMENTO')?.color || theme.palette.warning.dark;
  const [mostrarFaturamento, setMostrarFaturamento] = useState(getInitialFaturamentoVisibilidade);

  // Placeholder para futuros estilos locais

  const toggleMostrarFaturamento = (campo) => {
    setMostrarFaturamento((prev) => {
      const atualizado = {
        ...prev,
        [campo]: !prev[campo],
      };
      persistFaturamentoVisibilidade(atualizado);
      return atualizado;
    });
  };

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
        pedidosNaoFinalizadosResumo: backendData.pedidosNaoFinalizadosResumo || {
          aguardandoColheita: 0,
          aguardandoPrecificacao: 0,
          aguardandoPagamento: 0
        },
        receitaMensal: backendData.receitaMensal || [],
        programacaoColheita: backendData.programacaoColheita || [],
        pagamentosPendentes: backendData.pagamentosPendentes || [],
        pagamentosEfetuados: backendData.pagamentosEfetuados || [],
        pagamentosFornecedores: backendData.pagamentosFornecedores || [],
        pagamentosFornecedoresEfetuados: backendData.pagamentosFornecedoresEfetuados || [],

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

  // Callback para quando pagamentos são processados na seção de pagamentos
  const handlePagamentosProcessados = () => {
    fetchDashboardData();
    // Resetar flag de carregamento dos pagamentos efetuados para forçar reload
    setPagamentosEfetuadosCarregados(false);
    setCacheTimestamp(null); // Resetar cache para forçar nova requisição
    setErroPagamentosEfetuados(null); // Limpar qualquer erro anterior
  };

  // Função para abrir modal de detalhes da semana
  const abrirModalSemana = (previsao) => {
    // Verificar se vem do PrevisaoBananaSection (novo formato) ou do calendário antigo
    const isNovoFormato = previsao.dados !== undefined;

    if (isNovoFormato) {
      // Formato novo do PrevisaoBananaSection: { numero, inicio, fim, dados }
      if (previsao.dados && previsao.dados.length > 0) {
        setModalSemana({
          visible: true,
          dados: previsao.dados, // Já está no formato correto
          semana: {
            numero: previsao.numero,
            inicio: previsao.inicio,
            fim: previsao.fim
          }
        });
      }
    } else {
      // Formato antigo do calendário: { detalhes, status, numeroSemana, dataInicio, dataFim }
      if (previsao.detalhes && previsao.detalhes.length > 0) {
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

        setModalSemana({
          visible: true,
          dados: dadosModal,
          semana: {
            numero: previsao.numeroSemana,
            inicio: new Date(previsao.dataInicio),
            fim: new Date(previsao.dataFim)
          }
        });
      }
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
  const dadosFornecedores = dashboardData.pagamentosFornecedores || [];
  const dadosFornecedoresEfetuados = dashboardData.pagamentosFornecedoresEfetuados || [];


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
    <>
      <GlobalAnimations />
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
              <div style={{ position: 'relative', width: '100%', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                <DollarOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
                <Button
                  type="text"
                  icon={<Icon icon={mostrarFaturamento.total ? "mdi:eye-off-outline" : "mdi:eye-outline"} />}
                  onClick={() => toggleMostrarFaturamento('total')}
                  style={{ position: 'absolute', right: 0, top: -6, color: '#52c41a' }}
                />
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#52c41a', lineHeight: 1.2, marginBottom: '6px' }}>
                {mostrarFaturamento.total
                  ? dashboardData.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '••••••••'}
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
              <div style={{ position: 'relative', width: '100%', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                <DollarOutlined style={{ fontSize: '28px', color: '#faad14' }} />
                <Button
                  type="text"
                  icon={<Icon icon={mostrarFaturamento.aberto ? "mdi:eye-off-outline" : "mdi:eye-outline"} />}
                  onClick={() => toggleMostrarFaturamento('aberto')}
                  style={{ position: 'absolute', right: 0, top: -6, color: '#faad14' }}
                />
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#faad14', lineHeight: 1.2, marginBottom: '6px' }}>
                {mostrarFaturamento.aberto
                  ? dashboardData.faturamentoAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '••••••••'}
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
              minHeight: '100px',
              width: '100%'
            }}>
              <ShoppingCartOutlined style={{ fontSize: '28px', color: '#722ed1', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#722ed1', lineHeight: 1.2, marginBottom: '6px' }}>
                {dashboardData.pedidosAtivos}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#8c8c8c', textAlign: 'center', fontWeight: '400', marginBottom: '6px' }}>
                Pedidos Ativos
              </div>
              {/* Apenas desktop exibirá detalhamento; oculto no mobile */}
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
              <Button
                type="text"
                icon={<Icon icon={mostrarFaturamento.total ? "mdi:eye-off-outline" : "mdi:eye-outline"} />}
                onClick={() => toggleMostrarFaturamento('total')}
                style={{ position: 'absolute', right: 8, top: 8, color: '#52c41a' }}
              />
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
                formatter={value =>
                  mostrarFaturamento.total
                    ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : '••••••••'
                }
              />
              <Typography.Text type="secondary" style={{ fontSize: '0.6875rem' }}>
                Receita consolidada
              </Typography.Text>
            </CardStyled>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <CardStyled>
              <Button
                type="text"
                icon={<Icon icon={mostrarFaturamento.aberto ? "mdi:eye-off-outline" : "mdi:eye-outline"} />}
                onClick={() => toggleMostrarFaturamento('aberto')}
                style={{ position: 'absolute', right: 8, top: 8, color: '#faad14' }}
              />
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
                formatter={value =>
                  mostrarFaturamento.aberto
                    ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : '••••••••'
                }
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
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
                </div>
                {dashboardData.pedidosNaoFinalizadosResumo && (() => {
                  const colh = dashboardData.pedidosNaoFinalizadosResumo.aguardandoColheita || 0;
                  const prec = dashboardData.pedidosNaoFinalizadosResumo.aguardandoPrecificacao || 0;
                  const pag = dashboardData.pedidosNaoFinalizadosResumo.aguardandoPagamento || 0;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <AntdTooltip title={`Colheita • ${colh}`}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          backgroundColor: colorColheita,
                          color: '#fff',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                          width: 122
                        }}>
                          <span>Colheita:</span>
                          <span style={{ fontWeight: 800 }}>{colh}</span>
                        </span>
                      </AntdTooltip>
                      <AntdTooltip title={`Precificação • ${prec}`}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          backgroundColor: colorPrecificacao,
                          color: '#fff',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                          width: 122
                        }}>
                          <span>Precificação:</span>
                          <span style={{ fontWeight: 800 }}>{prec}</span>
                        </span>
                      </AntdTooltip>
                      <AntdTooltip title={`Pagamento • ${pag}`}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          backgroundColor: colorPagamento,
                          color: '#fff',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                          width: 122
                        }}>
                          <span>Pagamento:</span>
                          <span style={{ fontWeight: 800 }}>{pag}</span>
                        </span>
                      </AntdTooltip>
                    </div>
                  );
                })()}
              </div>
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

      {/* Sistema de Abas */}
      <StyledTabs
        activeKey={activeTab}
        onChange={(key) => {
          // Verificar se está tentando acessar 'painel-frutas' e não é PROGRAMADOR
          if (key === 'painel-frutas' && !isProgramador) {
            message.warning({
              content: 'Esta funcionalidade está em desenvolvimento.',
              duration: 4,
              style: {
                marginTop: '20vh',
              },
            });
            return; // Não muda a aba
          }
          
          // Se está acessando o painel de frutas pela primeira vez, carregar dados
          if (key === 'painel-frutas' && !painelFrutasCarregado && isProgramador) {
            setLoadingPainelFrutas(true);
            // Simular carregamento inicial (será substituído pelo carregamento real dos dados)
            setTimeout(() => {
              setPainelFrutasCarregado(true);
              setLoadingPainelFrutas(false);
            }, 500);
          }
          
          setActiveTab(key);
        }}
        type="card"
        items={[
          {
            key: 'dashboard',
            label: (
              <span className="tab-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Icon icon="mdi:monitor-dashboard" className="tab-icon" style={{ fontSize: '18px' }} />
                Dashboard
              </span>
            ),
            children: (
              <div>
                {/* Seção de Programação de Colheita - Largura Total */}
                <ProgramacaoColheitaSection
                  programacaoColheita={dashboardData.programacaoColheita || []}
                  onColheitaClick={abrirModalColheita}
                />

                {/* Seção de Gráficos e Pagamentos - Responsivos */}
                {isPagamentosExpandido ? (
                  // Layout expandido: Pagamentos ocupa toda a largura, Receita Mensal vai para baixo
                  <>
          <Row 
            gutter={isMobile ? [8, 8] : [24, 24]} 
            style={{ 
              marginBottom: isMobile ? '16px' : '32px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'fadeInSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Col xs={24}>
              <PagamentosSection
                modoPagamentos={modoPagamentos}
                dadosPagamentosAtuais={dadosPagamentosAtuais}
                dadosFornecedores={dadosFornecedores}
                dadosFornecedoresEfetuados={dadosFornecedoresEfetuados}
                loadingPagamentosEfetuados={loadingPagamentosEfetuados}
                erroPagamentosEfetuados={erroPagamentosEfetuados}
                onToggleModo={toggleModoPagamentos}
                onTentarNovamente={() => {
                  setErroPagamentosEfetuados(null);
                  setPagamentosEfetuadosCarregados(false);
                  toggleModoPagamentos();
                }}
                onPagamentosProcessados={handlePagamentosProcessados}
                isExpandido={isPagamentosExpandido}
                onToggleExpandir={() => setIsPagamentosExpandido(false)}
              />
            </Col>
          </Row>
          {/* Seção: Receita Mensal (esquerda) + Previsão de Banana (direita) */}
          <Row 
            gutter={isMobile ? [8, 8] : [24, 24]} 
            style={{ 
              marginBottom: isMobile ? '16px' : '32px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'fadeInSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both'
            }}
          >
            <Col xs={24} lg={12}>
              <ReceitaMensalSection receitaMensal={dashboardData.receitaMensal || []} />
            </Col>
            <Col xs={24} lg={12}>
              <PrevisaoBananaSection onSemanaClick={abrirModalSemana} />
            </Col>
          </Row>
          {/* Seção: Ações Rápidas (sozinha na última linha) */}
          <Row 
            gutter={isMobile ? [8, 8] : [24, 24]} 
            style={{ 
              marginBottom: isMobile ? '16px' : '32px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'fadeInSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both'
            }}
          >
            <Col xs={24}>
              <AcoesRapidasSection />
            </Col>
          </Row>
        </>
      ) : (
        // Layout normal: Receita Mensal e Pagamentos lado a lado
        <Row 
          gutter={isMobile ? [8, 8] : [24, 24]} 
          style={{ 
            marginBottom: isMobile ? '16px' : '32px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Col xs={24} lg={12}>
            <ReceitaMensalSection receitaMensal={dashboardData.receitaMensal || []} />
          </Col>

          <Col xs={24} lg={12}>
            <PagamentosSection
              modoPagamentos={modoPagamentos}
              dadosPagamentosAtuais={dadosPagamentosAtuais}
              dadosFornecedores={dadosFornecedores}
              dadosFornecedoresEfetuados={dadosFornecedoresEfetuados}
              loadingPagamentosEfetuados={loadingPagamentosEfetuados}
              erroPagamentosEfetuados={erroPagamentosEfetuados}
              onToggleModo={toggleModoPagamentos}
              onTentarNovamente={() => {
                setErroPagamentosEfetuados(null);
                setPagamentosEfetuadosCarregados(false);
                toggleModoPagamentos();
              }}
              onPagamentosProcessados={handlePagamentosProcessados}
              isExpandido={isPagamentosExpandido}
              onToggleExpandir={() => setIsPagamentosExpandido(true)}
            />
          </Col>
        </Row>
                  )}

                  {/* Seção: Previsão de Banana (esquerda) + Ações Rápidas (direita) - Apenas quando não expandido */}
                {!isPagamentosExpandido && (
                  <Row gutter={isMobile ? [8, 8] : [24, 24]} style={{ marginBottom: isMobile ? '16px' : '32px' }}>
                    <Col xs={24} lg={12}>
                      <PrevisaoBananaSection onSemanaClick={abrirModalSemana} />
                    </Col>
                    <Col xs={24} lg={12}>
                      <AcoesRapidasSection />
                    </Col>
                  </Row>
                )}
              </div>
            )
          },
          {
            key: 'painel-frutas',
            label: (
              <span className="tab-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Icon icon="healthicons:fruits" className="tab-icon" style={{ fontSize: '18px' }} />
                Painel de Frutas
              </span>
            ),
            children: isProgramador ? (
              painelFrutasCarregado ? (
                <PainelFrutas />
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#8c8c8c', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon icon="healthicons:fruits" style={{ fontSize: '64px', marginBottom: '16px', color: '#d9d9d9' }} />
                  <Typography.Title level={4} type="secondary">
                    Painel de Frutas
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Clique na aba para carregar os dados.
                  </Typography.Text>
                </div>
              )
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8c8c8c' }}>
                <Icon icon="mdi:lock" style={{ fontSize: '64px', marginBottom: '16px', color: '#d9d9d9' }} />
                <Typography.Title level={4} type="secondary">
                  Acesso Restrito
                </Typography.Title>
                <Typography.Text type="secondary">
                  Esta funcionalidade está em desenvolvimento e disponível apenas para programadores.
                </Typography.Text>
              </div>
            )
          }
        ]}
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

      {/* CentralizedLoader para carregamento do Painel de Frutas */}
      <CentralizedLoader
        visible={loadingPainelFrutas}
        message="Carregando Painel de Frutas..."
        subMessage="Buscando dados de culturas, frutas e áreas"
      />

      {/* CentralizedLoader para carregamento do Painel de Frutas */}
      <CentralizedLoader
        visible={loadingPainelFrutas}
        message="Carregando Painel de Frutas..."
        subMessage="Buscando dados de culturas, frutas e áreas"
      />
      </div>
    </>
  );
};

export default Dashboard;
