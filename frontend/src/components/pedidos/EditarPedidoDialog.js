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
import { validarFrutasDuplicadas } from "../../utils/pedidoValidation";
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
  onLoadingChange, // Callback para controlar CentralizedLoader
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
  // ✅ NOVO: Estado IMUTÁVEL para dados originais do banco (para validações)
  const [dadosOriginaisBanco, setDadosOriginaisBanco] = useState({
    frutas: [] // Contém as fitas originais do banco, nunca alterado
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
      
      // Preparar dados das frutas para o formulário com nova estrutura de múltiplas áreas/fitas
      const frutasForm = pedido.frutasPedidos?.map(fruta => {
        
        return {
        frutaPedidoId: fruta.id,
        frutaId: fruta.frutaId,
        frutaNome: fruta.fruta?.nome, // ✅ ADICIONADO: Nome da fruta para VincularFitasModal
        quantidadePrevista: fruta.quantidadePrevista,
        unidadeMedida1: fruta.unidadeMedida1,
        unidadeMedida2: fruta.unidadeMedida2,
        // Dados de colheita
        quantidadeReal: fruta.quantidadeReal || null,
        quantidadeReal2: fruta.quantidadeReal2 || null,
        
        // NOVA ESTRUTURA: Arrays de áreas e fitas
        // Filtrar apenas áreas reais (com IDs), removendo placeholders
        areas: fruta.areas?.length > 0 ? fruta.areas
          .filter(area => area.areaPropriaId || area.areaFornecedorId) // Remove placeholders
          .map(area => ({
            id: area.id,
            areaPropriaId: area.areaPropriaId || undefined,
            areaFornecedorId: area.areaFornecedorId || undefined,
            observacoes: area.observacoes || ''
          })) : [], // Array vazio se não há áreas reais
        
        fitas: fruta.fitas?.length > 0 ? fruta.fitas.map(fita => ({
          id: fita.id,
          fitaBananaId: fita.fitaBananaId,
          quantidadeFita: fita.quantidadeFita || undefined,
          observacoes: fita.observacoes || '',
          // ✅ MANTER detalhesAreas para reconstrução no VincularFitasModal
          detalhesAreas: fita.detalhesAreas || []
        })) : [],
        
        
        // Dados de precificação
        valorUnitario: fruta.valorUnitario || 0,
        unidadePrecificada: fruta.unidadePrecificada || fruta.unidadeMedida1,
        valorTotal: fruta.valorTotal || 0,
      };
    }) || [];
      
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
        nomeMotorista: pedido.nomeMotorista || "",
        // Campos específicos para clientes indústria
        indDataEntrada: pedido.indDataEntrada || null,
        indDataDescarga: pedido.indDataDescarga || null,
        indPesoMedio: pedido.indPesoMedio || null,
        indMediaMililitro: pedido.indMediaMililitro || null,
        indNumeroNf: pedido.indNumeroNf || null,
        // Inicializar mão de obra vazio (será carregado separadamente)
        maoObra: []
      };
      
      setPedidoAtual(pedidoAtualData);
      
      // ✅ CAPTURAR DADOS ORIGINAIS DO BANCO (IMUTÁVEIS) - apenas para validações
      setDadosOriginaisBanco({
        frutas: frutasForm // Cópia dos dados originais que nunca será alterada
      });
      
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

  // Carregar dados de mão de obra separadamente para pedidos em edição
  useEffect(() => {
    const carregarMaoObra = async () => {
      // Verificar se pode editar colheita inline (sem usar canEditTab antes da definição)
      const podeEditarColheita = pedido && (
        pedido.status === 'COLHEITA_REALIZADA' ||
        pedido.status === 'AGUARDANDO_PRECIFICACAO' ||
        pedido.status === 'PRECIFICACAO_REALIZADA' ||
        pedido.status === 'AGUARDANDO_PAGAMENTO' ||
        pedido.status === 'PAGAMENTO_REALIZADO' ||
        pedido.status === 'PAGAMENTO_PARCIAL'
      ) && pedido.status !== 'PEDIDO_FINALIZADO' && pedido.status !== 'CANCELADO';

      if (open && pedido && podeEditarColheita) {
        try {
          const response = await axiosInstance.get(`/api/turma-colheita/colheita-pedido/pedido/${pedido.id}`);
          const maoObraExistente = response.data || [];

          // Transformar dados da API para o formato do frontend
          const maoObraFormatada = maoObraExistente.map(item => ({
            id: item.id,
            turmaColheitaId: item.turmaColheitaId,
            quantidadeColhida: item.quantidadeColhida,
            unidadeMedida: item.unidadeMedida,
            valorColheita: item.valorColheita,
            observacoes: item.observacoes || ''
          }));

          // Se não há dados, inicializar com um item vazio
          const maoObraFinal = maoObraFormatada.length > 0
            ? maoObraFormatada
            : [{
                turmaColheitaId: undefined,
                quantidadeColhida: undefined,
                unidadeMedida: undefined,
                valorColheita: undefined,
                observacoes: ''
              }];

          // Atualizar apenas o maoObra sem afetar outros campos
          setPedidoAtual(prev => ({ ...prev, maoObra: maoObraFinal }));

          console.log('📋 Dados de mão de obra carregados:', maoObraFinal);
        } catch (error) {
          console.error("Erro ao carregar mão de obra:", error);
          // Em caso de erro, inicializar com item vazio
          setPedidoAtual(prev => ({
            ...prev,
            maoObra: [{
              turmaColheitaId: undefined,
              quantidadeColhida: undefined,
              unidadeMedida: undefined,
              valorColheita: undefined,
              observacoes: ''
            }]
          }));
        }
      } else if (open && pedido && !podeEditarColheita) {
        // Para pedidos que não podem editar colheita, deixar vazio
        setPedidoAtual(prev => ({ ...prev, maoObra: [] }));
      }
    };

    // Delay para garantir que pedidoAtual já foi inicializado
    if (open && pedido) {
      setTimeout(carregarMaoObra, 200);
    }
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
      // ✅ NOVA VALIDAÇÃO: Verificar frutas duplicadas
      const validacaoFrutasDuplicadas = validarFrutasDuplicadas(pedidoAtual.frutas, frutas);
      
      if (!validacaoFrutasDuplicadas.valido) {
        showNotification(
          "error",
          "Frutas Duplicadas Detectadas", 
          validacaoFrutasDuplicadas.mensagemErro
        );
        
        // Marcar erro para cada fruta duplicada
        validacaoFrutasDuplicadas.frutasDuplicadas.forEach(frutaDuplicada => {
          frutaDuplicada.indices.forEach(indice => {
            novosErros[`fruta_duplicada_${indice}`] = `Fruta duplicada: ${frutaDuplicada.nome}`;
          });
        });
        temInconsistenciaUnidades = true;
      }

      // Validar cada fruta
      for (let i = 0; i < pedidoAtual.frutas.length; i++) {
        const fruta = pedidoAtual.frutas[i];
        if (!fruta.frutaId || !fruta.quantidadePrevista || !fruta.unidadeMedida1) {
          const nomeFruta = frutas.find(f => f.id === fruta.frutaId)?.nome || `Fruta ${i + 1}`;
          novosErros[`fruta_${i}`] = `Complete todos os campos obrigatórios de "${nomeFruta}"`;
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
            const nomeFruta = frutas.find(f => f.id === fruta.frutaId)?.nome || `Fruta ${i + 1}`;
            novosErros[`colheita_fruta_${i}`] = `Informe a quantidade real colhida de "${nomeFruta}"`;
          }

          // NOVA VALIDAÇÃO: Verificar se fruta é banana e tem fitas vinculadas
          const nomeFruta = frutas.find(f => f.id === fruta.frutaId)?.nome || '';
          const isFrutaBanana = nomeFruta.toLowerCase().includes('banana');
          
          if (isFrutaBanana) {
            const fitasVinculadas = fruta.fitas?.filter(fita => 
              fita.fitaBananaId && fita.quantidadeFita && fita.quantidadeFita > 0
            ) || [];
            
            if (fitasVinculadas.length === 0) {
              novosErros[`colheita_fruta_${i}_fitas`] = `"${nomeFruta}" é uma banana e deve ter pelo menos uma fita vinculada`;
            }
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

  // Função auxiliar para salvar mão de obra via API
  const salvarMaoObraViaAPI = async () => {
    if (!pedido?.id || !pedidoAtual.maoObra || !canEditTab("2")) return true;

    try {
      const maoObraValida = pedidoAtual.maoObra.filter(item => item.turmaColheitaId);

      // Se não há mão de obra válida, não fazer nada
      if (maoObraValida.length === 0) return true;

      console.log('💼 Salvando mão de obra via API...', maoObraValida);

      // Primeiro: Buscar dados existentes para comparar
      const responseExistente = await axiosInstance.get(`/api/turma-colheita/colheita-pedido/pedido/${pedido.id}`);
      const dadosExistentes = responseExistente.data || [];

      // Deletar registros que não existem mais no frontend
      for (const existente of dadosExistentes) {
        const aindaExiste = maoObraValida.some(item => item.id === existente.id);
        if (!aindaExiste) {
          await axiosInstance.delete(`/api/turma-colheita/colheita-pedido/${existente.id}`);
          console.log(`🗑️ Removido registro ${existente.id}`);
        }
      }

      // Criar/atualizar registros
      for (const item of maoObraValida) {
        // Validar dados obrigatórios
        if (!item.quantidadeColhida || item.quantidadeColhida <= 0) continue;
        if (!item.unidadeMedida) continue;

        // Para cada fruta do pedido, criar/atualizar registro
        if (pedidoAtual.frutas && pedidoAtual.frutas.length > 0) {
          for (const fruta of pedidoAtual.frutas) {
            const custoData = {
              turmaColheitaId: item.turmaColheitaId,
              pedidoId: pedido.id,
              frutaId: fruta.frutaId,
              quantidadeColhida: parseFloat(item.quantidadeColhida),
              unidadeMedida: item.unidadeMedida,
              valorColheita: item.valorColheita ? parseFloat(item.valorColheita) : undefined,
              dataColheita: pedidoAtual.dataColheita || new Date().toISOString(),
              pagamentoEfetuado: false,
              observacoes: item.observacoes || ''
            };

            if (item.id) {
              // Atualizar existente
              await axiosInstance.patch(`/api/turma-colheita/colheita-pedido/${item.id}`, custoData);
              console.log(`✏️ Atualizado registro ${item.id}`);
            } else {
              // Criar novo
              const response = await axiosInstance.post('/api/turma-colheita/custo-colheita', custoData);
              console.log(`➕ Criado novo registro ${response.data.id}`);

              // Atualizar o item com o ID retornado
              item.id = response.data.id;
            }
          }
        }
      }

      console.log('✅ Mão de obra salva via API com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar mão de obra via API:', error);
      showNotification("error", "Erro", "Erro ao salvar dados de mão de obra");
      return false;
    }
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

      // PADRÃO "FECHAR-ENTÃO-LOADING": Fechar modal ANTES de iniciar loading
      handleCancelar();

      // Notificar parent component para iniciar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(true, "Salvando pedido...");
      }

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
          // Campos específicos para clientes indústria
          indDataEntrada: pedidoAtual.indDataEntrada ? moment(pedidoAtual.indDataEntrada).format('YYYY-MM-DD') : undefined,
          indDataDescarga: pedidoAtual.indDataDescarga ? moment(pedidoAtual.indDataDescarga).format('YYYY-MM-DD') : undefined,
          indPesoMedio: pedidoAtual.indPesoMedio || undefined,
          indMediaMililitro: pedidoAtual.indMediaMililitro || undefined,
          indNumeroNf: pedidoAtual.indNumeroNf || undefined,
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
              // NOVA ESTRUTURA: Arrays de áreas e fitas
              areas: fruta.areas?.filter(area => 
                area.areaPropriaId || area.areaFornecedorId
              ).map(area => ({
                id: area.id,
                areaPropriaId: area.areaPropriaId || undefined,
                areaFornecedorId: area.areaFornecedorId || undefined,
                observacoes: area.observacoes || ''
              })) || [],
              fitas: fruta.fitas?.filter(fita => 
                fita.fitaBananaId
              ).map(fita => ({
                id: fita.id,
                fitaBananaId: fita.fitaBananaId,
                quantidadeFita: fita.quantidadeFita || undefined,
                observacoes: fita.observacoes || '',
                // ✅ MANTER detalhesAreas para o backend processar
                detalhesAreas: fita.detalhesAreas || []
              })) || []
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

      // 1️⃣ Primeiro: Salvar dados principais do pedido
      await onSave(formData);

      // 2️⃣ Segundo: Salvar mão de obra se estivermos na aba de colheita
      if (activeTab === "2" && canEditTab("2")) {
        console.log('🔍 DEBUG EditarPedidoDialog - Tentando salvar mão de obra...', {
          activeTab,
          canEdit: canEditTab("2"),
          maoObra: pedidoAtual.maoObra
        });

        // Atualizar mensagem do loading para mão de obra
        if (onLoadingChange) {
          onLoadingChange(true, "Salvando mão de obra...");
        }

        const maoObraSalva = await salvarMaoObraViaAPI();

        if (!maoObraSalva) {
          showNotification("warning", "Aviso", "Pedido salvo, mas houve erro ao salvar mão de obra. Verifique na seção de Turmas de Colheita.");
        }
      } else {
        console.log('ℹ️ DEBUG EditarPedidoDialog - Não salvou mão de obra porque:', {
          activeTab,
          canEdit: canEditTab("2"),
          condicao: activeTab === "2" && canEditTab("2")
        });
      }

    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      // Em caso de erro, reabrir o modal
      onClose(false); // false indica que não deve fechar
    } finally {
      setIsSaving(false);
      // Notificar parent component para parar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(false);
      }
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
      style={{ maxWidth: 1400 }}
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
            dadosOriginaisBanco={dadosOriginaisBanco}
            todasFrutasPedido={pedidoAtual.frutas || []}
            fitasOriginaisTodasFrutas={dadosOriginaisBanco?.frutas || []}
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
            pedido={pedido}
            clientes={clientes}
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
  onLoadingChange: PropTypes.func, // Callback para controlar CentralizedLoader
};

export default EditarPedidoDialog;