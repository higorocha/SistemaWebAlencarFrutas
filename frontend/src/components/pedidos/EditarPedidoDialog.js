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
    dataPedido: null,
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
    nomeMotorista: "",
    numeroNf: undefined
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

  const parseDecimalValue = (valor) => {
    if (valor === null || valor === undefined || valor === '') {
      return undefined;
    }

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : undefined;
    }

    if (typeof valor === 'string') {
      // Valores vindos do MonetaryInput já vêm no formato "1234.56"
      // ou "1234" (ponto como separador decimal). Só precisamos
      // tratar vírgula para compatibilidade.
      const sanitized = valor.replace(',', '.');
      const parsed = parseFloat(sanitized);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  };

  const normalizarListaMaoObra = (lista = []) => {
    return lista.map(item => ({
      ...item,
      quantidadeColhida: parseDecimalValue(item?.quantidadeColhida),
      valorColheita: parseDecimalValue(item?.valorColheita),
      valorUnitario: parseDecimalValue(item?.valorUnitario),
    }));
  };

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
      // Usar quantidadePrecificada se disponível, senão usar lógica anterior
      const quantidadeParaCalculo = fruta.quantidadePrecificada || (() => {
        if (fruta.unidadePrecificada === fruta.unidadeMedida1) {
          return fruta.quantidadeReal || 0;
        } else if (fruta.unidadePrecificada === fruta.unidadeMedida2) {
          return fruta.quantidadeReal2 || 0;
        } else {
          // Fallback para primeira unidade se não houver unidade selecionada
          return fruta.quantidadeReal || 0;
        }
      })();

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
        const dePrimeira = fruta.fruta?.dePrimeira ?? false;
        const culturaId = fruta.fruta?.cultura?.id ?? null;
        return {
        frutaPedidoId: fruta.id,
        frutaId: fruta.frutaId,
        frutaNome: fruta.fruta?.nome, // ✅ ADICIONADO: Nome da fruta para VincularFitasModal
        fruta: fruta.fruta, // ✅ ADICIONADO: Objeto fruta completo (para MaoObraRow)
        quantidadePrevista: fruta.quantidadePrevista,
        unidadeMedida1: fruta.unidadeMedida1,
        unidadeMedida2: fruta.unidadeMedida2,
        dePrimeira,
        culturaId,
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
            observacoes: area.observacoes || '',
            quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
            quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
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
        quantidadePrecificada: fruta.quantidadePrecificada || fruta.quantidadeReal || 0,
        valorTotal: fruta.valorTotal || 0,
      };
    }) || [];
      
      const pedidoAtualData = {
        clienteId: pedido.clienteId || "",
        dataPedido: pedido.dataPedido
          ? new Date(pedido.dataPedido.split('T')[0] + 'T12:00:00')
          : null,
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
        numeroNf: pedido.numeroNf || undefined,
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
        dataPedido: null,
        dataPrevistaColheita: null,
        observacoes: "",
        frutas: [],
        dataColheita: null,
        observacoesColheita: "",
        pesagem: "",
        placaPrimaria: "",
        placaSecundaria: "",
        nomeMotorista: "",
        numeroNf: undefined
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
      // Verificar se pode editar colheita inline (apenas COLHEITA_REALIZADA em diante)
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
          const maoObraFormatada = maoObraExistente.map(item => {
            // ✅ NOVO: Determinar se deve usar unidade secundária baseado na unidadeMedida do backend
            const frutaPedido = pedido.frutasPedidos?.find(fp => fp.frutaId === item.frutaId);
            const unidadeMedidaBackend = item.unidadeMedida;
            const unidadeMedida1 = frutaPedido?.unidadeMedida1 || '';
            const unidadeMedida2 = frutaPedido?.unidadeMedida2 || '';
            
            // Extrair apenas a sigla das unidades para comparação
            const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
            const unidadeBackendSigla = unidadesValidas.find(u => unidadeMedidaBackend?.includes(u));
            const unidade1Sigla = unidadesValidas.find(u => unidadeMedida1?.includes(u));
            const unidade2Sigla = unidadesValidas.find(u => unidadeMedida2?.includes(u));
            
            // Se a unidade do backend corresponde à unidade secundária, marcar toggle como true
            const usarUnidadeSecundaria = unidadeBackendSigla && unidade2Sigla && unidadeBackendSigla === unidade2Sigla;
            
            // ✅ IMPORTANTE: Garantir que unidadeMedida está no formato correto (apenas sigla)
            const unidadeMedidaFormatada = unidadeBackendSigla || 'KG';
            
            return {
              id: item.id,
              turmaColheitaId: item.turmaColheitaId,
              frutaId: item.frutaId, // ✅ PRESERVAR frutaId original do banco
              quantidadeColhida: item.quantidadeColhida,
              unidadeMedida: unidadeMedidaFormatada, // ✅ Campo direto no form (igual ao valorColheita)
              valorColheita: item.valorColheita,
              // ✅ Calcular valorUnitario e arredondar para 4 casas decimais (igual ao decimalScale do input)
              valorUnitario: item.quantidadeColhida > 0 
                ? Number((item.valorColheita / item.quantidadeColhida).toFixed(4)) 
                : undefined,
              observacoes: item.observacoes || '',
              pagamentoEfetuado: item.pagamentoEfetuado || false,
              // ✅ NOVO: Incluir estado do toggle baseado na unidadeMedida do backend
              usarUnidadeSecundaria: usarUnidadeSecundaria
            };
          });

          // ✅ CORREÇÃO: Se não há dados, inicializar com array vazio (não criar objeto inválido)
          // A ColheitaTab criará o primeiro item vazio quando o usuário clicar em "Adicionar"
          const maoObraFinal = maoObraFormatada.length > 0 ? maoObraFormatada : [];

          // Atualizar apenas o maoObra sem afetar outros campos
          setPedidoAtual(prev => ({ ...prev, maoObra: maoObraFinal }));

        } catch (error) {
          console.error("Erro ao carregar mão de obra:", error);
          // ✅ CORREÇÃO: Em caso de erro, inicializar com array vazio
          setPedidoAtual(prev => ({ ...prev, maoObra: [] }));
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
      
      case "2": // Colheita - editável apenas se colheita foi realizada
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
      
      case "2": // Colheita - disponível apenas se colheita foi realizada
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

  // ========================================
  // 🆕 VALIDAÇÃO: Novas frutas por fase do pedido
  // ========================================
  const validarNovasFrutasPorFase = (frutas, statusPedido) => {
    const novosErros = {};
    const frutasNovas = frutas.filter(f => !f.frutaPedidoId);

    if (frutasNovas.length === 0) return { valido: true, erros: {}, quantidadeNovasFrutas: 0 };

    // Determinar quais dados são obrigatórios baseado na fase
    const requereColheita = [
      'COLHEITA_REALIZADA',
      'AGUARDANDO_PRECIFICACAO',
      'PRECIFICACAO_REALIZADA',
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_PARCIAL',
      'PAGAMENTO_REALIZADO'
    ].includes(statusPedido);

    const requerePrecificacao = [
      'PRECIFICACAO_REALIZADA',
      'AGUARDANDO_PAGAMENTO',
      'PAGAMENTO_PARCIAL',
      'PAGAMENTO_REALIZADO'
    ].includes(statusPedido);

    for (let i = 0; i < frutas.length; i++) {
      const fruta = frutas[i];

      // Pular frutas existentes
      if (fruta.frutaPedidoId) continue;

      const frutaInfo = frutas.find(f => f.id === fruta.frutaId);
      const nomeFruta = frutaInfo?.nome || `Nova Fruta ${i + 1}`;

      // ✅ Validar dados de colheita se fase requer
      if (requereColheita) {
        if (!fruta.quantidadeReal || fruta.quantidadeReal <= 0) {
          novosErros[`nova_fruta_colheita_${i}`] =
            `"${nomeFruta}" é uma nova fruta e o pedido está em fase ${statusPedido}. ` +
            `Informe a quantidade real colhida antes de salvar.`;
        }

        // Validar áreas
        const areasValidas = fruta.areas?.filter(a =>
          a.areaPropriaId || a.areaFornecedorId
        ) || [];

        if (areasValidas.length === 0) {
          novosErros[`nova_fruta_areas_${i}`] =
            `"${nomeFruta}" é uma nova fruta e deve ter pelo menos uma área de origem vinculada.`;
        }

        // Validar fitas se for banana
        const isBanana = nomeFruta.toLowerCase().includes('banana');
        if (isBanana) {
          const fitasValidas = fruta.fitas?.filter(f =>
            f.fitaBananaId && f.quantidadeFita > 0
          ) || [];

          if (fitasValidas.length === 0) {
            novosErros[`nova_fruta_fitas_${i}`] =
              `"${nomeFruta}" é uma banana e deve ter pelo menos uma fita vinculada.`;
          }
        }
      }

      // ✅ Validar dados de precificação se fase requer
      if (requerePrecificacao) {
        if (!fruta.valorUnitario || fruta.valorUnitario <= 0) {
          novosErros[`nova_fruta_preco_${i}`] =
            `"${nomeFruta}" é uma nova fruta e o pedido está em fase ${statusPedido}. ` +
            `Informe o valor unitário antes de salvar.`;
        }

        if (!fruta.unidadePrecificada) {
          novosErros[`nova_fruta_unidade_prec_${i}`] =
            `"${nomeFruta}" é uma nova fruta e deve ter unidade de precificação definida.`;
        }

        if (!fruta.quantidadePrecificada || fruta.quantidadePrecificada <= 0) {
          novosErros[`nova_fruta_qtd_prec_${i}`] =
            `"${nomeFruta}" é uma nova fruta e deve ter quantidade precificada definida.`;
        }
      }
    }

    const resultado = {
      valido: Object.keys(novosErros).length === 0,
      erros: novosErros,
      quantidadeNovasFrutas: frutasNovas.length,
      requereColheita,
      requerePrecificacao
    };

    return resultado;
  };

  const validarFormulario = () => {
    const novosErros = {};
    let temInconsistenciaUnidades = false;
    let temErroData = false;

    // Validações obrigatórias - Dados Básicos
    if (!pedidoAtual.clienteId) {
      novosErros.clienteId = "Cliente é obrigatório";
    }

    if (!pedidoAtual.dataPedido) {
      novosErros.dataPedido = "Data do pedido é obrigatória";
    }

    if (!pedidoAtual.dataPrevistaColheita) {
      novosErros.dataPrevistaColheita = "Data prevista para colheita é obrigatória";
    }

    // Validar se data prevista para colheita é posterior à data do pedido
    if (pedidoAtual.dataPedido && pedidoAtual.dataPrevistaColheita) {
      const dataPedido = moment(pedidoAtual.dataPedido);
      const dataPrevistaColheita = moment(pedidoAtual.dataPrevistaColheita);

      if (dataPrevistaColheita.isBefore(dataPedido, 'day')) {
        novosErros.dataPrevistaColheita = "Data prevista para colheita não pode ser anterior à data do pedido";
        temErroData = true;
      }
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

    // ========================================
    // ✅ NOVA VALIDAÇÃO: Validar novas frutas baseado na fase do pedido
    // ========================================
    if (pedidoAtual.frutas && pedidoAtual.frutas.length > 0) {
      const validacaoNovasFrutas = validarNovasFrutasPorFase(
        pedidoAtual.frutas,
        pedido.status
      );

      if (!validacaoNovasFrutas.valido) {
        Object.assign(novosErros, validacaoNovasFrutas.erros);

        // Notificação específica para novas frutas
        if (validacaoNovasFrutas.quantidadeNovasFrutas > 0) {
          const mensagemDetalhada =
            `Você adicionou ${validacaoNovasFrutas.quantidadeNovasFrutas} nova(s) fruta(s) em um pedido na fase "${pedido.status}". ` +
            (validacaoNovasFrutas.requerePrecificacao
              ? `Complete os dados de colheita e precificação antes de salvar.`
              : validacaoNovasFrutas.requereColheita
              ? `Complete os dados de colheita antes de salvar.`
              : `Complete os dados básicos antes de salvar.`);

          showNotification(
            "warning",
            "Novas Frutas Requerem Dados Adicionais",
            mensagemDetalhada
          );
        }
      }
    }

    // Validações de Colheita (se a aba estiver ativa e editável)
    if (activeTab === "2" && canEditTab("2")) {
      if (!pedidoAtual.dataColheita) {
        novosErros.dataColheita = "Data da colheita é obrigatória";
      }

      // ✅ NOVA LÓGICA: Validar apenas frutas que estão sendo colhidas (colheita parcial)
      if (pedidoAtual.frutas) {
        const frutasSendoColhidas = pedidoAtual.frutas.filter(fruta =>
          fruta.quantidadeReal && fruta.quantidadeReal > 0
        );

        const infoCultura = {};
        pedidoAtual.frutas.forEach((fruta) => {
          const culturaId = fruta.culturaId ?? fruta.fruta?.cultura?.id ?? null;
          if (culturaId === null) {
            return;
          }
          if (!infoCultura[culturaId]) {
            infoCultura[culturaId] = {
              hasPrimeira: false,
              possuiSegundas: false,
            };
          }
          if (fruta.dePrimeira) {
            infoCultura[culturaId].hasPrimeira = true;
          } else {
            infoCultura[culturaId].possuiSegundas = true;
          }
        });

        if (frutasSendoColhidas.length === 0) {
          novosErros.colheita_geral = "Informe a quantidade colhida de pelo menos uma fruta";
        }

        for (let i = 0; i < pedidoAtual.frutas.length; i++) {
          const fruta = pedidoAtual.frutas[i];
          const nomeFruta = frutas.find(f => f.id === fruta.frutaId)?.nome || `Fruta ${i + 1}`;

          if (fruta.quantidadeReal && fruta.quantidadeReal > 0) {
            const culturaId = fruta.culturaId ?? fruta.fruta?.cultura?.id ?? null;
            const culturaMeta = culturaId !== null ? infoCultura[culturaId] : undefined;
            const herdaDaPrimeira = culturaMeta?.hasPrimeira && culturaMeta?.possuiSegundas && !fruta.dePrimeira;

            const isFrutaBanana = nomeFruta.toLowerCase().includes('banana');

            if (!herdaDaPrimeira && isFrutaBanana) {
              const fitasVinculadas = fruta.fitas?.filter(fita =>
                fita.fitaBananaId && fita.quantidadeFita && fita.quantidadeFita > 0
              ) || [];

              if (fitasVinculadas.length === 0) {
                novosErros[`colheita_fruta_${i}_fitas`] = `"${nomeFruta}" é uma banana e deve ter pelo menos uma fita vinculada`;
              }
            }

            if (!herdaDaPrimeira) {
              const areasReais = fruta.areas?.filter(area =>
                area.areaPropriaId || area.areaFornecedorId
              ) || [];

              if (areasReais.length === 0) {
                novosErros[`colheita_fruta_${i}_areas`] = `Adicione pelo menos uma área de origem para "${nomeFruta}"`;
              }
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
      temInconsistenciaUnidades,
      erroData: temErroData
    };
  };

  // Função auxiliar para salvar mão de obra via API
  // ✅ Aceita dados opcionais de maoObra para usar dados atualizados diretamente do ColheitaTab
  const handleSalvarPedido = async (maoObraAtualizada = null) => {
    const validacao = validarFormulario();
    if (!validacao.valido) {
      // Se o erro é só inconsistência de unidades, não mostrar mensagem genérica
      // pois já foi mostrada a notificação específica
      if (!validacao.temInconsistenciaUnidades) {
        // Verificar se há erro específico de data (após validarFormulario ter sido executado)
        if (validacao.erroData) {
          showNotification('error', 'Data Inválida', 'A data prevista para colheita não pode ser anterior à data do pedido');
        } else {
          showNotification('error', 'Erro no Formulário', 'Por favor, corrija os erros no formulário antes de continuar');
        }
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

      // Lógica para detectar se a precificação foi alterada
      let precificacaoAlterada = false;
      const frutasOriginais = pedido.frutasPedidos || [];
      const frutasAtuais = pedidoAtual.frutas || [];

      if (frutasOriginais.length !== frutasAtuais.length) {
        precificacaoAlterada = true;
      } else {
        for (const frutaAtual of frutasAtuais) {
          const frutaOriginal = frutasOriginais.find(f => f.id === frutaAtual.frutaPedidoId);
          if (!frutaOriginal) {
            precificacaoAlterada = true;
            break;
          }
          if (
            toNumber(frutaOriginal.quantidadePrecificada) !== toNumber(frutaAtual.quantidadePrecificada) ||
            toNumber(frutaOriginal.valorUnitario) !== toNumber(frutaAtual.valorUnitario)
          ) {
            precificacaoAlterada = true;
            break;
          }
        }
      }

      // Construir formData apenas com campos apropriados para a fase atual
      const formData = {
        // Dados básicos sempre enviados
        clienteId: pedidoAtual.clienteId,
        dataPedido: pedidoAtual.dataPedido
          ? moment(pedidoAtual.dataPedido).toISOString()
          : undefined,
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
          numeroNf: pedidoAtual.numeroNf,
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
        const dadosPrecificacao = {
          frete: valoresCalculados.frete,
          icms: valoresCalculados.icms,
          desconto: valoresCalculados.desconto,
          avaria: valoresCalculados.avaria,
          // Campos específicos para clientes indústria
          indDataEntrada: pedidoAtual.indDataEntrada ? moment(pedidoAtual.indDataEntrada).format('YYYY-MM-DD') : undefined,
          indDataDescarga: pedidoAtual.indDataDescarga ? moment(pedidoAtual.indDataDescarga).format('YYYY-MM-DD') : undefined,
          // ✅ CORREÇÃO: Converter valores de string para número antes de enviar ao backend
          indPesoMedio: parseDecimalValue(pedidoAtual.indPesoMedio),
          indMediaMililitro: parseDecimalValue(pedidoAtual.indMediaMililitro),
          indNumeroNf: pedidoAtual.indNumeroNf || undefined,
        };

        if (precificacaoAlterada) {
          dadosPrecificacao.dataPrecificacaoRealizada = new Date().toISOString();
        }

        Object.assign(formData, dadosPrecificacao);
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
                observacoes: area.observacoes || '',
                quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
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

          // ✅ CORREÇÃO: Sempre enviar unidadePrecificada quando existir no estado
          // (mesmo que o pedido não esteja em fase de precificação, para manter sincronização)
          if (fruta.unidadePrecificada) {
            Object.assign(frutaData, {
              unidadePrecificada: fruta.unidadePrecificada,
            });
          }

          // Adicionar dados de precificação completos apenas nas fases apropriadas
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
              quantidadePrecificada: fruta.quantidadePrecificada,
              valorTotal: fruta.valorTotal,
            });
          }

          return frutaData;
        });
      }

      // ✅ NOVO: Processar mão de obra (custos de colheita) APENAS se a aba 2 estiver disponível
      // ✅ CORREÇÃO: Para pedidos PEDIDO_CRIADO, não processar mão de obra (não faz sentido)
      if (canEditTab("2")) {
        // ✅ CRÍTICO: Usar maoObraAtualizada se fornecida (dados diretos do ColheitaTab), senão usar pedidoAtual.maoObra
        // ✅ CORREÇÃO: Garantir que sempre seja um array
        const maoObraFonte = maoObraAtualizada || pedidoAtual.maoObra || [];
        const maoObraPadronizada = Array.isArray(maoObraFonte)
          ? normalizarListaMaoObra(maoObraFonte)
          : [];

        if (maoObraPadronizada && maoObraPadronizada.length > 0) {
          // Filtrar apenas itens válidos com dados obrigatórios preenchidos
          const maoObraValida = maoObraPadronizada.filter((item) =>
            item.turmaColheitaId &&
            item.frutaId &&
            item.quantidadeColhida &&
            item.quantidadeColhida > 0 &&
            // valorColheita pode ser recalculado a partir de valorUnitario; validar após cálculo
            (item.valorColheita || item.valorUnitario)
          );

          // Só incluir maoObra no formData se houver itens válidos
          if (maoObraValida.length > 0) {
            // ✅ CORREÇÃO: Recalcular valorColheita APENAS se não foi informado diretamente
            // Se o usuário informou valorColheita diretamente, usar esse valor (como no ColheitaModal)
            // Só recalcular se não houver valorColheita mas houver valorUnitario e quantidadeColhida
            const maoObraCalculada = maoObraValida
              .map((item) => {
                let valorColheita = item.valorColheita;

                // ✅ Só recalcular se NÃO houver valorColheita válido informado diretamente
                // mas houver valorUnitario e quantidadeColhida para calcular
                if (
                  (!valorColheita || valorColheita <= 0) &&
                  item.quantidadeColhida &&
                  item.quantidadeColhida > 0 &&
                  item.valorUnitario &&
                  item.valorUnitario > 0
                ) {
                  const total =
                    Number(item.quantidadeColhida) * Number(item.valorUnitario);
                  valorColheita = Number(total.toFixed(2));
                }

                // Se depois do cálculo ainda não houver valorColheita válido, descartar item
                if (!valorColheita || valorColheita <= 0) {
                  return null;
                }

                return {
                  ...item,
                  valorColheita,
                };
              })
              .filter(Boolean);

            if (maoObraCalculada.length > 0) {
              // ✅ SIMPLIFICADO: Usar unidadeMedida diretamente (igual ao valorColheita)
              // Se veio do ColheitaTab, já está correto. Se não, usar do item com fallback
              formData.maoObra = maoObraCalculada.map((item) => {
                // Usar unidadeMedida do item (já está correto se veio do ColheitaTab)
                let unidadeMedida = item.unidadeMedida;

                // Fallback: calcular se não tiver (não deveria acontecer)
                if (
                  !unidadeMedida ||
                  !['KG', 'CX', 'TON', 'UND', 'ML', 'LT'].includes(unidadeMedida)
                ) {
                  const frutaPedido = pedido.frutasPedidos?.find(
                    (fp) => fp.frutaId === item.frutaId,
                  );
                  const usarUnidadeSecundaria =
                    item.usarUnidadeSecundaria === true;
                  const unidadeBase =
                    usarUnidadeSecundaria && frutaPedido?.unidadeMedida2
                      ? frutaPedido.unidadeMedida2
                      : frutaPedido?.unidadeMedida1 || 'KG';
                  const unidadesValidas = [
                    'KG',
                    'CX',
                    'TON',
                    'UND',
                    'ML',
                    'LT',
                  ];
                  const unidadeEncontrada = unidadesValidas.find((u) =>
                    unidadeBase.includes(u),
                  );
                  unidadeMedida = unidadeEncontrada || 'KG';
                }

                return {
                  id: item.id || undefined,
                  turmaColheitaId: item.turmaColheitaId,
                  frutaId: item.frutaId,
                  quantidadeColhida: item.quantidadeColhida,
                  unidadeMedida,
                  valorColheita: item.valorColheita,
                  observacoes: item.observacoes || undefined,
                  dataColheita: pedidoAtual.dataColheita
                    ? moment(pedidoAtual.dataColheita)
                        .startOf('day')
                        .add(12, 'hours')
                        .toISOString()
                    : undefined,
                };
              });
            }
          }
        }
      }

      // 1️⃣ Salvar dados completos do pedido (incluindo mão de obra integrada)
      await onSave(formData);

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
      dataPedido: null,
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