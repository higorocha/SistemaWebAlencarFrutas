// src/pages/PedidosDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { Typography, message, Button, Tooltip, Space, Badge } from "antd";

const { Title, Text: AntText } = Typography;
import { ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import useResponsive from "../hooks/useResponsive";
import { showNotification } from "../config/notificationConfig";
import { validatePedido } from "../utils/validation";
import { useClientesCache } from "../hooks/useClientesCache";
import { useDashboardOptimized } from "../hooks/useDashboardOptimized";
import { useSmartDashboardReload } from "../hooks/useSmartDashboardReload";
import { CentralizedLoader } from "components/common/loaders";
import moment from "moment";

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


const PedidosDashboard = () => {
  // Hook de responsividade
  const { isMobile, isTablet } = useResponsive();

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
      setLoadingType('novo-pedido'); // ✅ Tipo específico para novo pedido
      
      await axiosInstance.post("/api/pedidos", pedidoData);
      showNotification("success", "Sucesso", "Pedido criado com sucesso!");
      setNovoPedidoModalOpen(false);
      setPedidoSelecionado(null);
      
      await reloadAfterNovoPedido();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      const message = error.response?.data?.message || "Erro ao salvar pedido";
      showNotification("error", "Erro", message);
    } finally {
      setOperacaoLoading(false);
      setLoadingType(null); // ✅ Limpar tipo
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

  const handleVisualizar = (pedido) => {
    setPedidoSelecionado(pedido);
    setVisualizarModalOpen(true);
  };

  const handleNovoPedido = () => {
    setNovoPedidoModalOpen(true);
  };

  // Função para salvar colheita
  const handleSaveColheita = useCallback(async (colheitaData) => {
    try {
      setOperacaoLoading(true);
      setLoadingType('colheita'); // ✅ Tipo específico para colheita
      
      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/colheita`, colheitaData);
      showNotification("success", "Sucesso", "Colheita registrada com sucesso!");

      setColheitaModalOpen(false);
      setPedidoSelecionado(null);

      await reloadAfterColheita();

    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const message = error.response?.data?.message || "Erro ao registrar colheita";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
      setLoadingType(null); // ✅ Limpar tipo
    }
  }, [pedidoSelecionado, setOperacaoLoading, reloadAfterColheita]);

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
        // Modo criação - usar POST
        await axiosInstance.post("/api/pedidos/pagamentos", pagamentoData);
        showNotification("success", "Sucesso", "Pagamento registrado com sucesso!");
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
      const message = error.response?.data?.message || "Erro ao salvar pagamento";
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
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        textAlign: isMobile ? 'center' : 'left',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <Title
            level={isMobile ? 3 : 2}
            style={{
              margin: 0,
              color: "#2E7D32",
              marginBottom: 8,
              fontSize: isMobile ? '1.25rem' : undefined
            }}
          >
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            {isMobile ? 'Pedidos' : 'Dashboard de Pedidos'}
          </Title>
          <AntText
            type="secondary"
            style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              display: 'block',
              textAlign: isMobile ? 'center' : 'left'
            }}
          >
            {isMobile
              ? 'Acompanhe o fluxo dos pedidos'
              : 'Acompanhe o fluxo dos pedidos em tempo real: colheita, precificação e pagamentos'
            }
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
                  size={isMobile ? "small" : "middle"}
                  style={{
                    backgroundColor: cacheStatus.isCacheValid ? '#f6ffed' : '#fff2e8',
                    borderColor: cacheStatus.isCacheValid ? '#b7eb8f' : '#ffbb96',
                    color: cacheStatus.isCacheValid ? '#52c41a' : '#fa8c16',
                    fontWeight: '500',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    opacity: cacheStatus.isCacheValid ? 0.8 : 1,
                    borderWidth: '2px',
                    height: isMobile ? '32px' : '40px',
                    padding: isMobile ? '0 12px' : '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '8px',
                    fontSize: isMobile ? '0.75rem' : undefined
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

          {/* Indicador de Status do Cache - Oculto em mobile */}
          {!isMobile && (() => {
            const cacheStatus = getCacheStatus();
            return (
              <Badge
                status={cacheStatus.isCacheValid ? 'success' : 'warning'}
                text={
                  <AntText style={{
                    fontSize: '12px',
                    color: cacheStatus.isCacheValid ? '#52c41a' : '#fa8c16',
                    fontWeight: '500'
                  }}>
                    {cacheStatus.isCacheValid ? 'Atualizado' : 'Desatualizado'}
                  </AntText>
                }
              />
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
          loading={operacaoLoading || clientesLoading}
          clientes={clientes}
        />
      )}

      {colheitaModalOpen && (
        <ColheitaModal
          open={colheitaModalOpen}
          onClose={handleModalClose}
          onSave={handleSaveColheita}
          pedido={pedidoSelecionado}
          loading={operacaoLoading}
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
          pedido={pedidoSelecionado}
          loading={operacaoLoading}
        />
      )}

      {visualizarModalOpen && (
        <VisualizarPedidoModal
          open={visualizarModalOpen}
          onClose={handleModalClose}
          pedido={pedidoSelecionado}
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