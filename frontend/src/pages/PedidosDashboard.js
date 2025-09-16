// src/pages/PedidosDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { Typography, Spin, message, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
import { validatePedido } from "../utils/validation";
import { useClientesCache } from "../hooks/useClientesCache";
import { useDashboardOptimized } from "../hooks/useDashboardOptimized";
import { useSmartDashboardReload } from "../hooks/useSmartDashboardReload";
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

const { Title } = Typography;

const PedidosDashboard = () => {
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
    }
  }, [pedidoSelecionado, setOperacaoLoading, reloadAfterColheita]);

  // Função para salvar precificação
  const handleSavePrecificacao = useCallback(async (precificacaoData) => {
    try {
      setOperacaoLoading(true);
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
    }
  }, [pedidoSelecionado, setOperacaoLoading, reloadAfterPrecificacao]);

  const handleLancarPagamento = () => {
    setLancarPagamentosModalOpen(true);
  };

  // Handler para novo/editar pagamento
  const handleNovoPagamento = useCallback(async (pagamentoData) => {
    try {
      setOperacaoLoading(true);
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

  // Carregar dados ao montar o componente e cleanup ao desmontar
  useEffect(() => {
    carregarDashboard();
    carregarClientes();

    // Cleanup ao desmontar
    return () => {
      cleanup();
    };
  }, [carregarDashboard, carregarClientes, cleanup]);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "60vh" 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <Title level={2} style={{ margin: 0 }}>
          Dashboard de Pedidos
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => carregarDashboard(paginacaoFinalizados.page, true)}
          loading={loading || operacaoLoading}
          size="middle"
        >
          Atualizar
        </Button>
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