// src/components/pedidos/EditarPedidoDialog.js

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Space, message, Tabs, Typography, Spin } from "antd";
import PropTypes from "prop-types";
import { 
  ShoppingCartOutlined,
  CalculatorOutlined,
  DollarOutlined,
  CreditCardOutlined
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import moment from "moment";

// Importar as abas separadas
import { DadosBasicosTab, ColheitaTab, PrecificacaoTab, PagamentosTab } from './tabs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EditarPedidoDialog = ({
  open,
  onClose,
  onSave,
  pedido,
  loading,
  clientes,
}) => {
  const [pedidoAtual, setPedidoAtual] = useState({
    clienteId: "",
    dataPrevistaColheita: null,
    observacoes: "",
    frutas: [],
    // Dados de colheita
    dataColheita: null,
    observacoesColheita: "",
    // Dados de frete
    pesagem: "",
    placaPrimaria: "",
    placaSecundaria: "",
    nomeMotorista: ""
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [frutas, setFrutas] = useState([]);
  const [areasAgricolas, setAreasAgricolas] = useState([]);
  const [areasProprias, setAreasProprias] = useState([]);
  const [areasFornecedores, setAreasFornecedores] = useState([]);
  const [activeTab, setActiveTab] = useState("1"); // Sempre inicia na primeira aba
  const [valoresCalculados, setValoresCalculados] = useState({
    valorTotalFrutas: 0,
    frete: 0,
    icms: 0,
    desconto: 0,
    avaria: 0,
    valorFinal: 0,
  });
  const [loadingData, setLoadingData] = useState(false);

  // Helper para garantir número
  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  };

  // Carregar todos os dados necessários quando o modal abre
  useEffect(() => {
    const fetchAllData = async () => {
      if (!open) return;
      
      try {
        setLoadingData(true);
        
        // Fazer todas as chamadas em paralelo para otimizar performance
        const [responseFrutas, responseAreas, responseAreasFornecedores] = await Promise.all([
          axiosInstance.get("/api/frutas"),
          axiosInstance.get("/api/areas-agricolas"),
          axiosInstance.get("/api/areas-fornecedores")
        ]);
        
        // Carregar frutas ativas
        const frutasAtivas = responseFrutas.data.data?.filter(fruta => fruta.status === 'ATIVA') || [];
        setFrutas(frutasAtivas);

        // Carregar áreas agrícolas próprias
        const areasAtivas = responseAreas.data || [];
        setAreasAgricolas(areasAtivas);
        setAreasProprias(areasAtivas);

        // Carregar áreas de fornecedores
        setAreasFornecedores(responseAreasFornecedores.data || []);
        
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        showNotification("error", "Erro", "Erro ao carregar dados do modal");
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [open]);

  // Função para calcular valores automaticamente
  const calcularValores = (frete = 0, icms = 0, desconto = 0, avaria = 0) => {
    const valorTotalFrutas = pedidoAtual.frutas.reduce((total, fruta) => {
      // Determinar qual quantidade usar baseado na unidade de precificação selecionada
      let quantidadeParaCalculo = 0;
      
      if (fruta.unidadePrecificada === fruta.unidadeMedida1) {
        quantidadeParaCalculo = fruta.quantidadeReal || 0;
      } else if (fruta.unidadePrecificada === fruta.unidadeMedida2) {
        quantidadeParaCalculo = fruta.quantidadeReal2 || 0;
      } else {
        // Fallback para primeira unidade se não houver unidade selecionada
        quantidadeParaCalculo = fruta.quantidadeReal || 0;
      }
      
      const valorUnit = fruta.valorUnitario || 0;
      const valorTotalFruta = quantidadeParaCalculo * valorUnit;
      
      return total + valorTotalFruta;
    }, 0);

    const valorFinal = valorTotalFrutas + frete + icms - desconto - avaria;

    setValoresCalculados({
      valorTotalFrutas,
      frete,
      icms,
      desconto,
      avaria,
      valorFinal: Math.max(0, valorFinal),
    });
  };

  // Preencher formulário quando pedido for selecionado para edição
  useEffect(() => {
    if (open && pedido) {
      // Resetar sempre para a primeira aba quando abrir modal com novo pedido
      setActiveTab("1");
      
      // Preparar dados das frutas para o formulário
      const frutasForm = pedido.frutasPedidos?.map(fruta => ({
        frutaPedidoId: fruta.id,
        frutaId: fruta.frutaId,
        quantidadePrevista: fruta.quantidadePrevista,
        unidadeMedida1: fruta.unidadeMedida1,
        unidadeMedida2: fruta.unidadeMedida2,
        // Dados de colheita
        quantidadeReal: fruta.quantidadeReal || null,
        quantidadeReal2: fruta.quantidadeReal2 || null,
        areaPropriaId: fruta.areaPropriaId || undefined,
        areaFornecedorId: fruta.areaFornecedorId || undefined,
        fitaColheita: fruta.fitaColheita || undefined,
        // Dados de precificação
        valorUnitario: fruta.valorUnitario || 0,
        unidadePrecificada: fruta.unidadePrecificada || fruta.unidadeMedida1,
        valorTotal: fruta.valorTotal || 0,
      })) || [];
      
      const pedidoAtualData = {
        clienteId: pedido.clienteId || "",
        dataPrevistaColheita: pedido.dataPrevistaColheita 
          ? new Date(pedido.dataPrevistaColheita.split('T')[0] + 'T12:00:00') 
          : null,
        observacoes: pedido.observacoes || "",
        frutas: frutasForm,
        // Dados de colheita
        dataColheita: pedido.dataColheita 
          ? new Date(pedido.dataColheita.split('T')[0] + 'T12:00:00') 
          : null,
        observacoesColheita: pedido.observacoesColheita || "",
        // Dados de frete
        pesagem: pedido.pesagem || "",
        placaPrimaria: pedido.placaPrimaria || "",
        placaSecundaria: pedido.placaSecundaria || "",
        nomeMotorista: pedido.nomeMotorista || ""
      };
      
      setPedidoAtual(pedidoAtualData);
      
      // Inicializar valores calculados garantindo tipos numéricos (backend pode retornar string)
      const valoresIniciais = {
        valorTotalFrutas: 0, // Será calculado automaticamente
        frete: toNumber(pedido.frete),
        icms: toNumber(pedido.icms),
        desconto: toNumber(pedido.desconto),
        avaria: toNumber(pedido.avaria),
        valorFinal: 0, // Será calculado automaticamente
      };

      setValoresCalculados(valoresIniciais);
      
      // Calcular valores após um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        calcularValores(
          valoresIniciais.frete,
          valoresIniciais.icms,
          valoresIniciais.desconto,
          valoresIniciais.avaria
        );
      }, 100);
      
      setEditando(true);
    } else if (open) {
      // Resetar para primeira aba quando abrir modal para novo pedido
      setActiveTab("1");
      
      setPedidoAtual({
        clienteId: "",
        dataPrevistaColheita: null,
        observacoes: "",
        frutas: [],
        dataColheita: null,
        observacoesColheita: "",
        pesagem: "",
        placaPrimaria: "",
        placaSecundaria: "",
        nomeMotorista: ""
      });
      setValoresCalculados({
        valorTotalFrutas: 0,
        frete: 0,
        icms: 0,
        desconto: 0,
        avaria: 0,
        valorFinal: 0,
      });
      setEditando(false);
    }
    setErros({});
  }, [open, pedido]);

  /**
   * Função para verificar se uma aba pode ser editada
   */
  const canEditTab = (tabKey) => {
    if (!pedido) return false;
    
    // Pedidos finalizados ou cancelados não podem ser editados
    if (pedido.status === 'PEDIDO_FINALIZADO' || pedido.status === 'CANCELADO') {
      return false;
    }
    
    switch (tabKey) {
      case "1": // Dados Básicos - sempre editável para pedidos ativos
        return true;
      
      case "2": // Colheita - editável APENAS se colheita foi finalizada
        return pedido.status === 'COLHEITA_REALIZADA' || 
               pedido.status === 'AGUARDANDO_PRECIFICACAO' || 
               pedido.status === 'PRECIFICACAO_REALIZADA' || 
               pedido.status === 'AGUARDANDO_PAGAMENTO' || 
               pedido.status === 'PAGAMENTO_REALIZADO' ||
               pedido.status === 'PAGAMENTO_PARCIAL';
      
      case "3": // Precificação - editável APENAS se precificação foi finalizada
        return pedido.status === 'PRECIFICACAO_REALIZADA' || 
               pedido.status === 'AGUARDANDO_PAGAMENTO' || 
               pedido.status === 'PAGAMENTO_REALIZADO' ||
               pedido.status === 'PAGAMENTO_PARCIAL';
      
      case "4": // Pagamento - editável se pagamento foi finalizado OU parcial
        return pedido.status === 'PAGAMENTO_REALIZADO' || pedido.status === 'PAGAMENTO_PARCIAL';
      
      default:
        return false;
    }
  };

  /**
   * Função para verificar se uma aba está disponível para visualização
   */
  const isTabAvailable = (tabKey) => {
    if (!pedido) return tabKey === "1"; // Apenas dados básicos para novo pedido
    
    // Pedidos finalizados ou cancelados só mostram dados básicos
    if (pedido.status === 'PEDIDO_FINALIZADO' || pedido.status === 'CANCELADO') {
      return tabKey === "1";
    }
    
    switch (tabKey) {
      case "1": // Dados Básicos - sempre disponível
        return true;
      
      case "2": // Colheita - disponível APENAS se colheita foi realizada
        return pedido.status === 'COLHEITA_REALIZADA' || 
               pedido.status === 'AGUARDANDO_PRECIFICACAO' || 
               pedido.status === 'PRECIFICACAO_REALIZADA' || 
               pedido.status === 'AGUARDANDO_PAGAMENTO' || 
               pedido.status === 'PAGAMENTO_REALIZADO' ||
               pedido.status === 'PAGAMENTO_PARCIAL';
      
      case "3": // Precificação - disponível APENAS se precificação foi realizada
        return pedido.status === 'PRECIFICACAO_REALIZADA' || 
               pedido.status === 'AGUARDANDO_PAGAMENTO' || 
               pedido.status === 'PAGAMENTO_REALIZADO' ||
               pedido.status === 'PAGAMENTO_PARCIAL';
      
      case "4": // Pagamento - disponível se pagamento foi realizado OU parcial
        return pedido.status === 'PAGAMENTO_REALIZADO' || pedido.status === 'PAGAMENTO_PARCIAL';
      
      default:
        return false;
    }
  };

  const validarFormulario = () => {
    const novosErros = {};
    let temInconsistenciaUnidades = false;

    // Validações obrigatórias - Dados Básicos
    if (!pedidoAtual.clienteId) {
      novosErros.clienteId = "Cliente é obrigatório";
    }

    if (!pedidoAtual.dataPrevistaColheita) {
      novosErros.dataPrevistaColheita = "Data prevista para colheita é obrigatória";
    }

    // Validar frutas
    if (!pedidoAtual.frutas || pedidoAtual.frutas.length === 0) {
      novosErros.frutas = "Adicione pelo menos uma fruta ao pedido";
    } else {
      // Validar cada fruta
      for (let i = 0; i < pedidoAtual.frutas.length; i++) {
        const fruta = pedidoAtual.frutas[i];
        if (!fruta.frutaId || !fruta.quantidadePrevista || !fruta.unidadeMedida1) {
          novosErros[`fruta_${i}`] = `Complete todos os campos obrigatórios da fruta ${i + 1}`;
        }
        
        // Validar se as unidades de medida não são iguais
        if (fruta.unidadeMedida1 && fruta.unidadeMedida2 && fruta.unidadeMedida1 === fruta.unidadeMedida2) {
          const nomeFruta = frutas.find(f => f.id === fruta.frutaId)?.nome || `Fruta ${i + 1}`;
          
          showNotification(
            "warning",
            "Unidades de Medida Duplicadas",
            `A ${nomeFruta} não pode ter a mesma unidade de medida (${fruta.unidadeMedida1}) para ambas as unidades. Por favor, selecione unidades diferentes ou remova a segunda unidade.`
          );
          
          novosErros[`unidades_duplicadas_${i}`] = `Unidades duplicadas para ${nomeFruta}`;
          temInconsistenciaUnidades = true;
        }
      }
    }

    // Validações de Colheita (se a aba estiver ativa e editável)
    if (activeTab === "2" && canEditTab("2")) {
      if (!pedidoAtual.dataColheita) {
        novosErros.dataColheita = "Data da colheita é obrigatória";
      }
      
      // Validar se todas as frutas têm dados de colheita
      if (pedidoAtual.frutas) {
        for (let i = 0; i < pedidoAtual.frutas.length; i++) {
          const fruta = pedidoAtual.frutas[i];
          if (!fruta.quantidadeReal || fruta.quantidadeReal <= 0) {
            novosErros[`colheita_fruta_${i}`] = `Informe a quantidade real colhida da fruta ${i + 1}`;
          }
        }
      }
    }

    // Validação de consistência entre unidades dos dados básicos e precificação
    if (pedidoAtual.frutas && pedidoAtual.frutas.length > 0) {
      for (let i = 0; i < pedidoAtual.frutas.length; i++) {
        const fruta = pedidoAtual.frutas[i];
        
        // Se existe unidade de precificação definida
        if (fruta.unidadePrecificada) {
          // Verificar se a unidade de precificação coincide com alguma das unidades disponíveis
          const unidadeDisponivel1 = fruta.unidadeMedida1;
          const unidadeDisponivel2 = fruta.unidadeMedida2;
          const unidadePrecificada = fruta.unidadePrecificada;
          
          if (unidadePrecificada !== unidadeDisponivel1 && unidadePrecificada !== unidadeDisponivel2) {
            // Se chegou aqui, a unidade de precificação não coincide com as unidades disponíveis
            const nomefruta = frutas.find(f => f.id === fruta.frutaId)?.nome || `Fruta ${i + 1}`;
            
            showNotification(
              "warning",
              "Inconsistência nas Unidades de Medida",
              `A unidade de precificação da ${nomefruta} (${unidadePrecificada}) é diferente das unidades disponíveis (${unidadeDisponivel1}${unidadeDisponivel2 ? ` e ${unidadeDisponivel2}` : ''}). Por favor, ajuste as unidades na aba de Dados Básicos ou na aba de Precificação para que sejam consistentes.`
            );
            
            novosErros[`unidade_inconsistente_${i}`] = `Unidades inconsistentes para ${nomefruta}`;
            temInconsistenciaUnidades = true;
          }
        }
      }
    }

    setErros(novosErros);
    
    return {
      valido: Object.keys(novosErros).length === 0,
      temInconsistenciaUnidades
    };
  };

  const handleSalvarPedido = async () => {
    const validacao = validarFormulario();
    if (!validacao.valido) {
      // Se o erro é só inconsistência de unidades, não mostrar mensagem genérica
      // pois já foi mostrada a notificação específica
      if (!validacao.temInconsistenciaUnidades) {
        message.error("Por favor, corrija os erros no formulário");
      }
      return;
    }

    try {
      setIsSaving(true);

      // Construir formData apenas com campos apropriados para a fase atual
      const formData = {
        // Dados básicos sempre enviados
        clienteId: pedidoAtual.clienteId,
        dataPrevistaColheita: pedidoAtual.dataPrevistaColheita
          ? moment(pedidoAtual.dataPrevistaColheita).toISOString()
          : undefined,
        observacoes: pedidoAtual.observacoes,
      };

      // Adicionar dados de colheita se a aba 2 estiver disponível
      if (canEditTab("2")) {
        Object.assign(formData, {
          dataColheita: pedidoAtual.dataColheita
            ? moment(pedidoAtual.dataColheita).toISOString()
            : undefined,
          observacoesColheita: pedidoAtual.observacoesColheita,
          pesagem: pedidoAtual.pesagem,
          placaPrimaria: pedidoAtual.placaPrimaria,
          placaSecundaria: pedidoAtual.placaSecundaria,
          nomeMotorista: pedidoAtual.nomeMotorista,
        });
      }

      // Adicionar dados de precificação APENAS se o pedido já passou dessa fase
      if (
        pedido.status === 'PRECIFICACAO_REALIZADA' ||
        pedido.status === 'AGUARDANDO_PAGAMENTO' ||
        pedido.status === 'PAGAMENTO_REALIZADO' ||
        pedido.status === 'PAGAMENTO_PARCIAL' ||
        pedido.status === 'PEDIDO_FINALIZADO'
      ) {
        Object.assign(formData, {
          frete: valoresCalculados.frete,
          icms: valoresCalculados.icms,
          desconto: valoresCalculados.desconto,
          avaria: valoresCalculados.avaria,
        });
      }

      // Processar frutas conforme a fase do pedido
      if (pedidoAtual.frutas && pedidoAtual.frutas.length > 0) {
        formData.frutas = pedidoAtual.frutas.map(fruta => {
          // Dados básicos sempre enviados
          const frutaData = {
            frutaPedidoId: fruta.frutaPedidoId,
            frutaId: fruta.frutaId,
            quantidadePrevista: fruta.quantidadePrevista,
            unidadeMedida1: fruta.unidadeMedida1,
            unidadeMedida2: fruta.unidadeMedida2,
          };

          // Adicionar dados de colheita se a aba 2 estiver disponível
          if (canEditTab("2")) {
            Object.assign(frutaData, {
              quantidadeReal: fruta.quantidadeReal,
              quantidadeReal2: fruta.quantidadeReal2,
              areaPropriaId: fruta.areaPropriaId,
              areaFornecedorId: fruta.areaFornecedorId,
              fitaColheita: fruta.fitaColheita,
            });
          }

          // Adicionar dados de precificação apenas nas fases apropriadas
          if (
            pedido.status === 'AGUARDANDO_PRECIFICACAO' ||
            pedido.status === 'PRECIFICACAO_REALIZADA' ||
            pedido.status === 'AGUARDANDO_PAGAMENTO' ||
            pedido.status === 'PAGAMENTO_REALIZADO' ||
            pedido.status === 'PAGAMENTO_PARCIAL' ||
            pedido.status === 'PEDIDO_FINALIZADO'
          ) {
            Object.assign(frutaData, {
              valorUnitario: fruta.valorUnitario,
              unidadePrecificada: fruta.unidadePrecificada,
              valorTotal: fruta.valorTotal,
            });
          }

          return frutaData;
        });
      }

      await onSave(formData);
      handleCancelar();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    setPedidoAtual({
      clienteId: "",
      dataPrevistaColheita: null,
      observacoes: "",
      frutas: [],
      dataColheita: null,
      observacoesColheita: "",
      pesagem: "",
      placaPrimaria: "",
      placaSecundaria: "",
      nomeMotorista: ""
    });
    setErros({});
    setActiveTab("1"); // Resetar para primeira aba ao cancelar
    onClose();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <Modal
      title={
        <span style={{ 
          color: "#ffffff", 
          fontWeight: "600", 
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Editar Pedido - #{pedido?.numeroPedido || 'N/A'} - {clientes?.find(c => c.id === pedido?.clienteId)?.nome || 'Cliente não encontrado'}
        </span>
      }
      open={open}
      onCancel={handleCancelar}
      footer={null}
      width="95%"
      style={{ maxWidth: 1200 }}
      styles={{
        body: {
          minHeight: "830px",
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px",
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        }
      }}
      centered
      destroyOnClose
      zIndex={1000}
    >
      {/* Spinner de carregamento */}
      {loadingData ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px"
        }}>
          <Spin size="large" tip="Carregando dados..." />
        </div>
      ) : (
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        size="large"
        tabBarStyle={{ marginBottom: 24 }}
        style={{ minHeight: "830px" }}
      >
        <TabPane
          tab={
            <span>
              <ShoppingCartOutlined style={{ fontSize: "18px", marginRight: 8 }} />
              Dados Básicos
            </span>
          }
          key="1"
        >
          <DadosBasicosTab
            pedidoAtual={pedidoAtual}
            setPedidoAtual={setPedidoAtual}
            erros={erros}
            setErros={setErros}
            canEditTab={canEditTab}
            clientes={clientes}
            onSave={handleSalvarPedido}
            onCancel={handleCancelar}
            loading={loading}
            isSaving={isSaving}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <CalculatorOutlined style={{ fontSize: "18px", marginRight: 8 }} />
              Colheita
            </span>
          }
          key="2"
          disabled={!isTabAvailable("2")}
        >
          <ColheitaTab
            pedidoAtual={pedidoAtual}
            setPedidoAtual={setPedidoAtual}
            erros={erros}
            setErros={setErros}
            canEditTab={canEditTab}
            frutas={frutas}
            areasProprias={areasProprias}
            areasFornecedores={areasFornecedores}
            onSave={handleSalvarPedido}
            onCancel={handleCancelar}
            loading={loading}
            isSaving={isSaving}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <DollarOutlined style={{ fontSize: "18px", marginRight: 8 }} />
              Precificação
            </span>
          }
          key="3"
          disabled={!isTabAvailable("3")}
        >
          <PrecificacaoTab
            pedidoAtual={pedidoAtual}
            setPedidoAtual={setPedidoAtual}
            erros={erros}
            setErros={setErros}
            canEditTab={canEditTab}
            frutas={frutas}
            areasProprias={areasProprias}
            areasFornecedores={areasFornecedores}
            valoresCalculados={valoresCalculados}
            setValoresCalculados={setValoresCalculados}
            onSave={handleSalvarPedido}
            onCancel={handleCancelar}
            loading={loading}
            isSaving={isSaving}
            calcularValores={calcularValores}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <CreditCardOutlined style={{ fontSize: "18px", marginRight: 8 }} />
              Pagamento
            </span>
          }
          key="4"
          disabled={!isTabAvailable("4")}
        >
          <PagamentosTab
            pedido={pedido}
            canEditTab={canEditTab}
            onSave={handleSalvarPedido}
            onCancel={handleCancelar}
            loading={loading}
            isSaving={isSaving}
          />
        </TabPane>
      </Tabs>
      )}
    </Modal>
  );
};

EditarPedidoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
  clientes: PropTypes.array.isRequired,
};

export default EditarPedidoDialog;