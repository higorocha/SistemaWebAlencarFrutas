// src/pages/PedidosDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { Typography, message, Button, Tooltip, Space, Badge, Card } from "antd";
import { Icon } from "@iconify/react";

const { Title, Text: AntText } = Typography;
import { ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import useResponsive from "../hooks/useResponsive";
import { showNotification } from "../config/notificationConfig";
import { validatePedido } from "../utils/validation";
import { formatMissingClienteBoletoFields } from "../utils/clienteBoletoValidation";
import { useClientesCache } from "../hooks/useClientesCache";
import { useDashboardOptimized } from "../hooks/useDashboardOptimized";
import { useSmartDashboardReload } from "../hooks/useSmartDashboardReload";
import { CentralizedLoader } from "components/common/loaders";
import moment from "moment";

const formatarErrosBB = (erros = []) =>
  erros
    .map((erro) => {
      const codigo = erro?.codigo ? `(${erro.codigo}) ` : "";
      const mensagem = erro?.mensagem || "Erro não identificado";
      const providencia = erro?.providencia ? ` — ${erro.providencia}` : "";
      return `${codigo}${mensagem}${providencia}`;
    })
    .join(" | ");

// Componente de ícone personalizado para Dashboard de Pedidos
const DashboardPedidosIcon = ({ isMobile }) => {
  const iconSize = isMobile ? '31px' : '31px';
  const smallIconSize = isMobile ? '17px' : '14px';
  
  return (
    <div style={{ 
      position: 'relative', 
      width: iconSize, 
      height: iconSize,
      marginRight: 8
    }}>
      {/* Ícone principal - Dashboard */}
      <Icon 
        icon="mdi:monitor-dashboard" 
        style={{ 
          fontSize: iconSize,
          color: "#2E7D32"
        }} 
      />
      {/* Ícone de fundo cinza (borda) */}
      <Icon 
        icon="mdi:cart" 
        style={{ 
          position: 'absolute',
          right: '-4px',
          bottom: '-3px',
          fontSize: `${parseInt(smallIconSize) + 4}px`,
          color: "#ffffff"
        }} 
      />
      {/* Ícone secundário - Cart (canto inferior direito) */}
      <Icon 
        icon="mdi:cart" 
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

// Componentes da dashboard
import StatusCards from "../components/pedidos/dashboard/StatusCards";
import ActionButtons from "../components/pedidos/dashboard/ActionButtons";
import StatusSectionsContainer from "../components/pedidos/dashboard/StatusSectionsContainer";
import FinalizadosSection from "../components/pedidos/dashboard/FinalizadosSection";

// Estilos específicos da dashboard
import "../components/pedidos/dashboard/DashboardStyles.css";

// Modais existentes
import NovoPedidoModal from "../components/pedidos/NovoPedidoModal";
import ColheitaModal from "../components/pedidos/ColheitaModal";
import PrecificacaoModal from "../components/pedidos/PrecificacaoModal";
import PagamentoModal from "../components/pedidos/PagamentoModal";
import VisualizarPedidoModal from "../components/pedidos/VisualizarPedidoModal";
import LancarPagamentosModal from "../components/pedidos/LancarPagamentosModal";
import { capitalizeName } from "../utils/formatters";


const PedidosDashboard = () => {
  // Hook de responsividade - importar todos os breakpoints necessários
  const { isMobile, isTablet, isSmallTablet, isLargeTablet } = useResponsive();

  // Estado para controlar loading inicial - será controlado pelos hooks
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingType, setLoadingType] = useState(null); // null, 'novo-pedido', 'colheita', 'precificacao', 'pagamento'
  const [carregamentoInicialCompleto, setCarregamentoInicialCompleto] = useState(false);

  // Hooks otimizados
  const {
    dashboardData,
    paginacaoFinalizados,
    loading,
    operacaoLoading,
    carregarDashboard,
    atualizarDadosOtimizado,
    handlePaginacaoFinalizados,
    setOperacaoLoading,
    cleanup
  } = useDashboardOptimized();

  const {
    clientes,
    carregarClientes,
    loading: clientesLoading
  } = useClientesCache();

  // Hook para reload inteligente - declarado após atualizarDadosOtimizado estar disponível
  const {
    reloadAfterNovoPedido,
    reloadAfterColheita,
    reloadAfterPrecificacao,
    reloadAfterPagamento,
    reloadAfterLancarPagamentos,
  } = useSmartDashboardReload(atualizarDadosOtimizado);

  // Função para verificar status do cache
  const getCacheStatus = useCallback(() => {
    const now = Date.now();
    const lastUpdate = dashboardData.lastUpdate || 0;
    const CACHE_DURATION = 30 * 1000; // 30 segundos
    const isCacheValid = (now - lastUpdate) < CACHE_DURATION;
    const timeSinceUpdate = now - lastUpdate;
    
    return {
      isCacheValid,
      timeSinceUpdate,
      lastUpdateTime: lastUpdate
    };
  }, [dashboardData.lastUpdate]);

  // Estados para modais
  const [novoPedidoModalOpen, setNovoPedidoModalOpen] = useState(false);
  const [colheitaModalOpen, setColheitaModalOpen] = useState(false);
  const [precificacaoModalOpen, setPrecificacaoModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [visualizarLoading, setVisualizarLoading] = useState(false);
  const [lancarPagamentosModalOpen, setLancarPagamentosModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  

  // Função para buscar pedido atualizado
  const buscarPedidoAtualizado = useCallback(async (pedidoId) => {
    try {
      const response = await axiosInstance.get(`/api/pedidos/${pedidoId}`);
      return validatePedido(response.data);
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      return null;
    }
  }, []);

  // Handler para salvar novo pedido
  const handleSalvarPedido = useCallback(async (pedidoData) => {
    try {
      setOperacaoLoading(true);
      setLoadingType('novo-pedido');
      
      await axiosInstance.post("/api/pedidos", pedidoData);
      showNotification("success", "Sucesso", "Pedido criado com sucesso!");
      setNovoPedidoModalOpen(false);
      setPedidoSelecionado(null);
      
      await reloadAfterNovoPedido();
    } catch (error) {
      // Verificar se é erro de pedido duplicado - relançar para o modal tratar
      const errorData = error?.response?.data;
      if (errorData?.code === 'PEDIDO_DUPLICADO') {
        // Relançar o erro para que o NovoPedidoModal possa tratá-lo
        throw error;
      }
      
      // Para outros erros, mostrar notificação
      const message = errorData?.message || "Erro ao salvar pedido";
      showNotification("error", "Erro", message);
    } finally {
      setOperacaoLoading(false);
      setLoadingType(null);
    }
  }, [setOperacaoLoading, reloadAfterNovoPedido]);


  // Handlers para ações dos cards
  const handleColheita = (pedido) => {
    setPedidoSelecionado(pedido);
    setColheitaModalOpen(true);
  };

  const handlePrecificacao = (pedido) => {
    setPedidoSelecionado(pedido);
    setPrecificacaoModalOpen(true);
  };

  const handlePagamento = (pedido) => {
    setPedidoSelecionado(pedido);
    setPagamentoModalOpen(true);
  };

  const handleVisualizar = async (pedido) => {
    setVisualizarModalOpen(true);
    setVisualizarLoading(true);
    setPedidoSelecionado(null);
    try {
      const pedidoAtualizado = await buscarPedidoAtualizado(pedido.id);
      if (pedidoAtualizado) {
        setPedidoSelecionado(pedidoAtualizado);
      } else {
        setVisualizarModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao visualizar pedido:", error);
      setVisualizarModalOpen(false);
    } finally {
      setVisualizarLoading(false);
    }
  };

  const handleNovoPedido = () => {
    setNovoPedidoModalOpen(true);
  };

  // Função para salvar colheita
  const handleSaveColheita = useCallback(async (colheitaData) => {
    try {
      setOperacaoLoading(true);
      setLoadingType('colheita');
      
      const pedidoId = pedidoSelecionado.id;
      const response = await axiosInstance.patch(`/api/pedidos/${pedidoId}/colheita`, colheitaData);
      // Apenas retorna os dados para o modal continuar o fluxo
      return response.data;

    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const message = error.response?.data?.message || "Erro ao registrar colheita";
      showNotification("error", "Erro", message);
      // Garante que o loading pare em caso de erro
      setOperacaoLoading(false);
      setLoadingType(null);
      throw error; // Re-throw para o modal tratar
    }
  }, [pedidoSelecionado, setOperacaoLoading, setLoadingType]);

  // ✅ NOVO: Callback para finalizar salvamento (chamado APÓS salvar mão de obra)
  const handleColheitaCompleta = useCallback(async () => {
    try {
      setLoadingType('colheita'); // Manter o tipo de loading para feedback visual
      
      await reloadAfterColheita();

      showNotification("success", "Sucesso", "Colheita registrada com sucesso!");
      setColheitaModalOpen(false);
      setPedidoSelecionado(null);
    } catch (error) {
      console.error("Erro ao atualizar lista de pedidos pós-colheita:", error);
    } finally {
      setOperacaoLoading(false);
      setLoadingType(null);
    }
  }, [reloadAfterColheita, setOperacaoLoading, setLoadingType]);

  // Função para salvar precificação
  const handleSavePrecificacao = useCallback(async (precificacaoData) => {
    try {
      setOperacaoLoading(true);
      setLoadingType('precificacao'); // ✅ Tipo específico para precificação
      
      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/precificacao`, precificacaoData);
      showNotification("success", "Sucesso", "Precificação realizada com sucesso!");

      setPrecificacaoModalOpen(false);
      setPedidoSelecionado(null);

      await reloadAfterPrecificacao();

    } catch (error) {
      console.error("Erro ao definir precificação:", error);
      const message = error.response?.data?.message || "Erro ao definir precificação";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
      setLoadingType(null); // ✅ Limpar tipo
    }
  }, [pedidoSelecionado, setOperacaoLoading, reloadAfterPrecificacao]);

  const handleLancarPagamento = () => {
    setLancarPagamentosModalOpen(true);
  };

  // Handler para novo/editar pagamento
  const handleNovoPagamento = useCallback(async (pagamentoData) => {
    try {
      setOperacaoLoading(true);
      setLoadingType('pagamento'); // ✅ Tipo específico para pagamento
      
      if (pagamentoData.id) {
        // Modo edição - usar PATCH
        const { id, ...dadosSemId } = pagamentoData;
        await axiosInstance.patch(`/api/pedidos/pagamentos/${id}`, dadosSemId);
        showNotification("success", "Sucesso", "Pagamento atualizado com sucesso!");
      } else {
        // Verificar se é boleto
        if (pagamentoData.metodoPagamento === 'BOLETO') {
          // Para boleto, chamar API de cobrança diretamente
          // TODO: Implementar busca/seleção de contaCorrenteId
          // Por enquanto, usar primeira conta disponível ou pedir ao usuário
          if (!pagamentoData.contaCorrenteId) {
            throw new Error("contaCorrenteId é obrigatório para criar boleto");
          }
          
          const boletoData = {
            pedidoId: pagamentoData.pedidoId,
            contaCorrenteId: pagamentoData.contaCorrenteId,
            valorOriginal: pagamentoData.valorRecebido,
            dataVencimento: pagamentoData.dataVencimento,
            mensagemBloquetoOcorrencia: pagamentoData.observacoesPagamento || `Pagamento referente ao pedido ${pedidoSelecionado?.numeroPedido || ''}`
          };
          
          const response = await axiosInstance.post("/api/cobranca/boletos", boletoData);
          showNotification("success", "Sucesso", "Boleto gerado com sucesso! O pagamento será registrado automaticamente quando o boleto for pago.");
        } else {
          // Para outros métodos, usar endpoint de pagamentos
          await axiosInstance.post("/api/pedidos/pagamentos", pagamentoData);
          showNotification("success", "Sucesso", "Pagamento registrado com sucesso!");
        }
      }

      await reloadAfterPagamento();

      // Atualizar pedido selecionado se necessário
      if (pedidoSelecionado) {
        const pedidoAtualizado = await buscarPedidoAtualizado(pedidoSelecionado.id);
        if (pedidoAtualizado) {
          setPedidoSelecionado(pedidoAtualizado);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error);
      const data = error.response?.data;

      // Caso especial: cliente incompleto para boleto (validação do backend)
      if (pagamentoData?.metodoPagamento === "BOLETO" && data?.code === "CLIENTE_INCOMPLETO_BOLETO") {
        const missingLabels = formatMissingClienteBoletoFields(data?.missingFields || []);
        const missingText = missingLabels.length ? missingLabels.join(", ") : "dados obrigatórios";

        showNotification(
          "warning",
          "Atualize o cadastro do cliente",
          `Não é possível gerar boleto sem os dados obrigatórios do cliente. Preencha: ${missingText}.`
        );
        throw error;
      }

      // Caso especial: erro retornado pelo BB ao registrar boleto
      if (
        pagamentoData?.metodoPagamento === "BOLETO" &&
        Array.isArray(data?.erros) &&
        data.erros.length > 0
      ) {
        showNotification(
          "error",
          "Erro ao registrar boleto",
          formatarErrosBB(data.erros)
        );
        throw error;
      }

      const message = data?.message || data?.error || error.message || "Erro ao salvar pagamento";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
      setLoadingType(null); // ✅ Limpar tipo
    }
  }, [setOperacaoLoading, reloadAfterPagamento, pedidoSelecionado, buscarPedidoAtualizado]);

  // Handler para remover pagamento
  const handleRemoverPagamento = useCallback(async (pagamentoId) => {
    try {
      setOperacaoLoading(true);
      await axiosInstance.delete(`/api/pedidos/pagamentos/${pagamentoId}`);
      showNotification("success", "Sucesso", "Pagamento removido com sucesso!");

      await reloadAfterPagamento();

      // Atualizar pedido selecionado se necessário
      if (pedidoSelecionado) {
        const pedidoAtualizado = await buscarPedidoAtualizado(pedidoSelecionado.id);
        if (pedidoAtualizado) {
          setPedidoSelecionado(pedidoAtualizado);
        }
      }
    } catch (error) {
      console.error("Erro ao remover pagamento:", error);
      const message = error.response?.data?.message || "Erro ao remover pagamento";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
    }
  }, [setOperacaoLoading, reloadAfterPagamento, pedidoSelecionado, buscarPedidoAtualizado]);

  // Handler para quando ajustes financeiros são salvos (frete, ICMS, desconto, avaria)
  const handleAjustesSalvos = useCallback(async () => {
    try {
      // Recarregar dashboard
      await reloadAfterPagamento();

      // Atualizar pedido selecionado se necessário
      if (pedidoSelecionado) {
        const pedidoAtualizado = await buscarPedidoAtualizado(pedidoSelecionado.id);
        if (pedidoAtualizado) {
          setPedidoSelecionado(pedidoAtualizado);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar após ajustes:", error);
      // Não mostrar notificação aqui pois o modal já mostrou
    }
  }, [reloadAfterPagamento, pedidoSelecionado, buscarPedidoAtualizado]);

  // Handler para salvar pagamentos em lote
  const handleSalvarPagamentosLote = useCallback(async (pagamentos) => {
    try {
      setOperacaoLoading(true);

      // Processar cada pagamento individualmente
      for (const pagamento of pagamentos) {
        await axiosInstance.post("/api/pedidos/pagamentos", pagamento);
      }

      showNotification("success", "Sucesso", `${pagamentos.length} pagamento${pagamentos.length !== 1 ? 's' : ''} registrado${pagamentos.length !== 1 ? 's' : ''} com sucesso!`);

      setLancarPagamentosModalOpen(false);

      await reloadAfterLancarPagamentos();

    } catch (error) {
      console.error("Erro ao processar pagamentos:", error);
      const message = error.response?.data?.message || "Erro ao processar pagamentos";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
    }
  }, [setOperacaoLoading, reloadAfterLancarPagamentos]);

  // Handler para fechar modais e recarregar dados
  const handleModalClose = () => {
    setNovoPedidoModalOpen(false);
    setColheitaModalOpen(false);
    setPrecificacaoModalOpen(false);
    setPagamentoModalOpen(false);
    setVisualizarModalOpen(false);
    setLancarPagamentosModalOpen(false);
    setPedidoSelecionado(null);
    setVisualizarLoading(false);
  };

  const handleModalSuccess = useCallback(() => {
    handleModalClose();
    // Não precisa mais chamar atualizarDadosOtimizado aqui - cada modal já gerencia seu reload específico
  }, []);

  // Função para carregar dados iniciais de forma assíncrona
  const carregarDadosIniciais = useCallback(async () => {
    try {
      setLoadingInicial(true);
      setCarregamentoInicialCompleto(false);
      
      // Aguardar ambos os carregamentos em paralelo
      await Promise.all([
        carregarDashboard(),
        carregarClientes()
      ]);
      
      setCarregamentoInicialCompleto(true);
    } catch (error) {
      console.error("Erro no carregamento inicial:", error);
      // Mesmo com erro, marcar como completo para não travar a interface
      setCarregamentoInicialCompleto(true);
    } finally {
      // Pequeno delay para suavizar a transição
      setTimeout(() => {
        setLoadingInicial(false);
      }, 300);
    }
  }, [carregarDashboard, carregarClientes]);

  // Carregar dados ao montar o componente e cleanup ao desmontar
  useEffect(() => {
    carregarDadosIniciais();

    // Cleanup ao desmontar
    return () => {
      cleanup();
    };
  }, [carregarDadosIniciais, cleanup]);

  // Verificar se dados essenciais foram carregados
  const dadosEssenciaisCarregados = dashboardData.lastUpdate > 0 && !loading;

  if (loadingInicial || !dadosEssenciaisCarregados) {
    return (
      <CentralizedLoader
        visible={true}
        message={
          carregamentoInicialCompleto 
            ? "Finalizando carregamento..." 
            : loading 
              ? "Carregando dados..." 
              : "Carregando dashboard..."
        }
        subMessage={
          carregamentoInicialCompleto 
            ? "Preparando interface..." 
            : loading
              ? "Processando informações dos pedidos..."
              : "Buscando dados dos pedidos e clientes..."
        }
      />
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header" style={{
        flexDirection: isMobile ? 'column' : (isTablet ? 'column' : 'row'),
        alignItems: isMobile ? 'stretch' : (isTablet ? 'stretch' : 'center'),
        textAlign: 'left', // ✅ Sempre alinhado à esquerda como desktop
        gap: isMobile ? '12px' : (isTablet ? '14px' : '16px')
      }}>
        <div style={{ textAlign: 'left' }}> {/* ✅ Força alinhamento à esquerda */}
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
            <DashboardPedidosIcon isMobile={isMobile} />
            Dashboard de Pedidos {/* ✅ Exatamente igual ao desktop */}
          </Title>
          <AntText
            type="secondary"
            style={{
              display: 'block',
              textAlign: 'left' // ✅ Sempre alinhado à esquerda
            }}
          >
            Acompanhe o fluxo dos pedidos em tempo real: colheita, precificação e pagamentos {/* ✅ Exatamente igual ao desktop */}
          </AntText>
        </div>
        
        {/* Botão Atualizar com Indicador de Cache */}
        <Space
          size="small"
          align="center"
          style={{
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}
        >
          {(() => {
            const cacheStatus = getCacheStatus();
            const formatTimeSinceUpdate = (timeSinceUpdate) => {
              if (timeSinceUpdate < 60000) return 'agora';
              const minutes = Math.floor(timeSinceUpdate / 60000);
              return `${minutes}min atrás`;
            };

            return (
              <Tooltip
                title={
                  !isMobile && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {cacheStatus.isCacheValid ? 'Dados Atualizados' : 'Dados Desatualizados'}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        Última atualização: {formatTimeSinceUpdate(cacheStatus.timeSinceUpdate)}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                        Clique para forçar atualização (ignora cache de 30s)
                      </div>
                    </div>
                  )
                }
                placement="bottomRight"
              >
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => carregarDashboard(paginacaoFinalizados.page, true)}
                  loading={loading || operacaoLoading}
                  size={isMobile ? "small" : (isTablet ? "small" : "middle")}
                  style={{
                    backgroundColor: '#f6ffed', // ✅ Verde fixo como Dashboard.js
                    borderColor: '#b7eb8f', // ✅ Verde fixo como Dashboard.js
                    color: '#52c41a', // ✅ Verde fixo como Dashboard.js
                    fontWeight: '500',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    borderWidth: '2px',
                    height: isMobile ? '32px' : (isTablet ? '36px' : '40px'),
                    padding: isMobile ? '0 12px' : (isTablet ? '0 14px' : '0 16px'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : (isTablet ? '6px' : '8px'),
                    fontSize: isMobile ? '0.75rem' : (isTablet ? '0.8125rem' : undefined)
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !operacaoLoading) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && !operacaoLoading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  Atualizar
                </Button>
              </Tooltip>
            );
          })()}

        </Space>
      </div>

      {/* Cards de Estatísticas */}
      <StatusCards stats={dashboardData.stats} />

      {/* Botões de Ações Rápidas */}
      <ActionButtons 
        onNovoPedido={handleNovoPedido}
        onLancarPagamento={handleLancarPagamento}
        loading={loading}
      />

      {/* Seções por Status - Layout Horizontal */}
      <StatusSectionsContainer
        dashboardData={dashboardData}
        onColheita={handleColheita}
        onPrecificacao={handlePrecificacao}
        onPagamento={handlePagamento}
        onVisualizar={handleVisualizar}
        loadingType={loadingType} // ✅ Novo prop com tipo de loading
      />

      <FinalizadosSection
        pedidos={dashboardData.finalizados}
        paginacao={paginacaoFinalizados}
        onPaginacaoChange={handlePaginacaoFinalizados}
        onAction={handleVisualizar}
      />

      {/* Modais - Renderização condicional para evitar erros de useForm */}
      {novoPedidoModalOpen && (
        <NovoPedidoModal
          open={novoPedidoModalOpen}
          onClose={handleModalClose}
          onSave={handleSalvarPedido}
          onReload={reloadAfterNovoPedido}
          loading={operacaoLoading || clientesLoading}
          clientes={clientes}
        />
      )}

      {colheitaModalOpen && (
        <ColheitaModal
          open={colheitaModalOpen}
          onClose={handleModalClose}
          onSave={handleSaveColheita}
          onSaveComplete={handleColheitaCompleta}
          pedido={pedidoSelecionado}
          loading={operacaoLoading}
          onLoadingChange={setOperacaoLoading}
        />
      )}

      {precificacaoModalOpen && (
        <PrecificacaoModal
          open={precificacaoModalOpen}
          onClose={handleModalClose}
          onSave={handleSavePrecificacao}
          pedido={pedidoSelecionado}
          loading={operacaoLoading}
        />
      )}

      {pagamentoModalOpen && (
        <PagamentoModal
          open={pagamentoModalOpen}
          onClose={handleModalClose}
          onNovoPagamento={handleNovoPagamento}
          onRemoverPagamento={handleRemoverPagamento}
          onAjustesSalvos={handleAjustesSalvos} // ✅ Handler que atualiza dashboard E pedido selecionado
          pedido={pedidoSelecionado}
          loading={operacaoLoading}
        />
      )}

      {visualizarModalOpen && (
        <VisualizarPedidoModal
          open={visualizarModalOpen}
          onClose={handleModalClose}
          pedido={pedidoSelecionado}
          loading={visualizarLoading}
        />
      )}

      {lancarPagamentosModalOpen && (
        <LancarPagamentosModal
          open={lancarPagamentosModalOpen}
          onClose={handleModalClose}
          onSave={handleSalvarPagamentosLote}
          onSuccess={reloadAfterLancarPagamentos}
          loading={operacaoLoading}
        />
      )}

    </div>
  );
};

export default PedidosDashboard;