// src/pages/PedidosDashboard.js

import React, { useState, useEffect } from "react";
import { Typography, Spin, message, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { showNotification } from "../config/notificationConfig";
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

const { Title } = Typography;

const PedidosDashboard = () => {
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [operacaoLoading, setOperacaoLoading] = useState(false); // Novo loading para operações
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    aguardandoColheita: [],
    aguardandoPrecificacao: [],
    aguardandoPagamento: [],
    finalizados: [],
  });

  // Estados para paginação dos pedidos finalizados
  const [paginacaoFinalizados, setPaginacaoFinalizados] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Estados para modais
  const [novoPedidoModalOpen, setNovoPedidoModalOpen] = useState(false);
  const [colheitaModalOpen, setColheitaModalOpen] = useState(false);
  const [precificacaoModalOpen, setPrecificacaoModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  
  // Dados auxiliares
  const [clientes, setClientes] = useState([]);

  // Função para carregar dados da dashboard
  const carregarDashboard = async (paginaFinalizadosParam = 1) => {
    try {
      setLoading(true);
      
      // Carregar dados do endpoint dashboard que retorna pedidos ativos e finalizados paginados
      const dashboardResponse = await axiosInstance.get("/api/pedidos/dashboard", {
        params: {
          paginaFinalizados: paginaFinalizadosParam,
          limitFinalizados: paginacaoFinalizados.limit
        }
      });
      
      const { stats, pedidos, finalizados } = dashboardResponse.data;

      // Processar dados das seções por status
      const processedSections = processarSecoesPorStatus(pedidos);
      
      setDashboardData({
        stats,
        ...processedSections,
        finalizados: finalizados.data || []
      });

      // Atualizar estados de paginação
      setPaginacaoFinalizados(prev => ({
        ...prev,
        page: finalizados.page || 1,
        total: finalizados.total || 0,
        totalPages: finalizados.totalPages || 0
      }));

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      showNotification("error", "Erro", "Erro ao carregar dashboard de pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Função para mudar página dos pedidos finalizados
  const handlePaginacaoFinalizados = async (novaPagina, novoLimit) => {
    setPaginacaoFinalizados(prev => ({ 
      ...prev, 
      page: novaPagina,
      limit: novoLimit || prev.limit
    }));
    await carregarDashboard(novaPagina);
  };

  // Função para processar seções por status dos pedidos ativos
  const processarSecoesPorStatus = (pedidos) => {
    const aguardandoColheita = [];
    const aguardandoPrecificacao = [];
    const aguardandoPagamento = [];

    pedidos.forEach(pedido => {
      const { status } = pedido;

      // Agrupar por seções - apenas pedidos ativos
      if (["PEDIDO_CRIADO", "AGUARDANDO_COLHEITA"].includes(status)) {
        aguardandoColheita.push(pedido);
      } else if (["COLHEITA_REALIZADA", "AGUARDANDO_PRECIFICACAO"].includes(status)) {
        aguardandoPrecificacao.push(pedido);
      } else if (["PRECIFICACAO_REALIZADA", "AGUARDANDO_PAGAMENTO", "PAGAMENTO_PARCIAL"].includes(status)) {
        aguardandoPagamento.push(pedido);
      }
    });

    return {
      aguardandoColheita,
      aguardandoPrecificacao,
      aguardandoPagamento,
    };
  };

  // Função para carregar clientes ativos
  const carregarClientes = async () => {
    try {
      const response = await axiosInstance.get("/api/clientes/ativos");
      setClientes(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  // Handler para salvar novo pedido
  const handleSalvarPedido = async (pedidoData) => {
    try {
      setLoading(true);
      await axiosInstance.post("/api/pedidos", pedidoData);
      showNotification("success", "Sucesso", "Pedido criado com sucesso!");
      handleModalSuccess();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      const message = error.response?.data?.message || "Erro ao salvar pedido";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  };

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
  const handleSaveColheita = async (colheitaData) => {
    try {
      setOperacaoLoading(true);
      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/colheita`, colheitaData);
      showNotification("success", "Sucesso", "Colheita registrada com sucesso!");
      
      setColheitaModalOpen(false);
      setPedidoSelecionado(null);
      
      // Recarregar dados da dashboard
      await carregarDashboard();
      
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
      const message = error.response?.data?.message || "Erro ao registrar colheita";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
    }
  };

  // Função para salvar precificação
  const handleSavePrecificacao = async (precificacaoData) => {
    try {
      setOperacaoLoading(true);
      await axiosInstance.patch(`/api/pedidos/${pedidoSelecionado.id}/precificacao`, precificacaoData);
      showNotification("success", "Sucesso", "Precificação realizada com sucesso!");
      
      setPrecificacaoModalOpen(false);
      setPedidoSelecionado(null);
      
      // Recarregar dados da dashboard
      await carregarDashboard();
      
    } catch (error) {
      console.error("Erro ao definir precificação:", error);
      const message = error.response?.data?.message || "Erro ao definir precificação";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
    }
  };

  const handleLancarPagamento = () => {
    // Por enquanto só mostra uma notificação, pode ser expandido futuramente
    showNotification("info", "Em Desenvolvimento", "Funcionalidade de lançar pagamento será implementada em breve");
  };

  // Handler para novo/editar pagamento
  const handleNovoPagamento = async (pagamentoData) => {
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
      
      // Atualizar apenas os dados necessários (otimizado - evita piscar)
      const [statsResponse, pedidosResponse] = await Promise.all([
        axiosInstance.get("/api/pedidos/dashboard"),
        axiosInstance.get("/api/pedidos")
      ]);

      const stats = statsResponse.data;
      const pedidos = pedidosResponse.data.data || pedidosResponse.data;
      const processedSections = processarSecoesPorStatus(pedidos);
      
      // Atualizar estado sem recarregar loading
      setDashboardData({
        stats,
        ...processedSections
      });
      
      // Atualizar pedido selecionado com os dados mais recentes
      if (pedidoSelecionado) {
        const response = await axiosInstance.get(`/api/pedidos/${pedidoSelecionado.id}`);
        setPedidoSelecionado(response.data);
      }
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error);
      const message = error.response?.data?.message || "Erro ao salvar pagamento";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
    }
  };

  // Handler para remover pagamento
  const handleRemoverPagamento = async (pagamentoId) => {
    try {
      setOperacaoLoading(true);
      await axiosInstance.delete(`/api/pedidos/pagamentos/${pagamentoId}`);
      showNotification("success", "Sucesso", "Pagamento removido com sucesso!");
      
      // Atualizar apenas os dados necessários (otimizado - evita piscar)
      const [statsResponse, pedidosResponse] = await Promise.all([
        axiosInstance.get("/api/pedidos/dashboard"),
        axiosInstance.get("/api/pedidos")
      ]);

      const stats = statsResponse.data;
      const pedidos = pedidosResponse.data.data || pedidosResponse.data;
      const processedSections = processarSecoesPorStatus(pedidos);
      
      // Atualizar estado sem recarregar loading
      setDashboardData({
        stats,
        ...processedSections
      });
      
      // Atualizar pedido selecionado com os dados mais recentes
      if (pedidoSelecionado) {
        const response = await axiosInstance.get(`/api/pedidos/${pedidoSelecionado.id}`);
        setPedidoSelecionado(response.data);
      }
    } catch (error) {
      console.error("Erro ao remover pagamento:", error);
      const message = error.response?.data?.message || "Erro ao remover pagamento";
      showNotification("error", "Erro", message);
      throw error; // Re-throw para o modal tratar
    } finally {
      setOperacaoLoading(false);
    }
  };

  // Handler para fechar modais e recarregar dados
  const handleModalClose = () => {
    setNovoPedidoModalOpen(false);
    setColheitaModalOpen(false);
    setPrecificacaoModalOpen(false);
    setPagamentoModalOpen(false);
    setVisualizarModalOpen(false);
    setPedidoSelecionado(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    carregarDashboard(); // Recarregar dados após ação
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDashboard();
    carregarClientes();
  }, []);

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
          onClick={carregarDashboard}
          loading={loading}
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

      {/* Modais */}
      <NovoPedidoModal
        open={novoPedidoModalOpen}
        onClose={handleModalClose}
        onSave={handleSalvarPedido}
        loading={loading}
        clientes={clientes}
      />

      <ColheitaModal
        open={colheitaModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveColheita}
        pedido={pedidoSelecionado}
        loading={operacaoLoading}
      />

      <PrecificacaoModal
        open={precificacaoModalOpen}
        onClose={handleModalClose}
        onSave={handleSavePrecificacao}
        pedido={pedidoSelecionado}
        loading={operacaoLoading}
      />

      <PagamentoModal
        open={pagamentoModalOpen}
        onClose={handleModalClose}
        onNovoPagamento={handleNovoPagamento}
        onRemoverPagamento={handleRemoverPagamento}
        pedido={pedidoSelecionado}
        loading={operacaoLoading}
      />

      <VisualizarPedidoModal
        open={visualizarModalOpen}
        onClose={handleModalClose}
        pedido={pedidoSelecionado}
      />
    </div>
  );
};

export default PedidosDashboard;