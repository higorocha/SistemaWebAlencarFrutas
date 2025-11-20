// src/components/pedidos/tabs/ColheitaTab.js

import React, { useState, useEffect, useMemo } from "react";
import { Button, Space, Form, Input, Select, DatePicker, Row, Col, Typography, Card, Divider, Tag, Tooltip, Modal, Alert } from "antd";
import PropTypes from "prop-types";
import {
  SaveOutlined,
  CloseOutlined,
  CalendarOutlined,
  AppleOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined,
  LinkOutlined,
  TagOutlined,
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { MonetaryInput, MaskedDatePicker } from "../../../components/common/inputs";
import { FormButton } from "../../common/buttons";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";
import { capitalizeName } from "../../../utils/formatters";
import moment from "moment";
import VincularAreasModal from "../VincularAreasModal";
import VincularFitasModal from "../VincularFitasModal";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";
import { validarFitasCompleto } from "../../../utils/fitasValidation";
import useResponsive from "../../../hooks/useResponsive";
import { MaoObraRow } from '../componentesColheita';

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

// Componente de Resumo com atualização em tempo real - Usando Form.useWatch
const ResumoMaoObra = ({ form, isMobile, pedido }) => {
  // ✅ Monitorar mudanças em tempo real usando Form.useWatch
  const maoObraAtual = Form.useWatch('maoObra', form) || [];

  // Filtrar apenas itens válidos (com todos os campos preenchidos)
  const maoObraValida = maoObraAtual.filter(item =>
    item && item.turmaColheitaId && item.frutaId && item.quantidadeColhida && item.valorColheita
  );

  // Calcular resumo
  const resumo = {
    totalColheitadores: maoObraValida.length,
    quantidadePorUnidade: {},
    valorTotal: 0
  };

  maoObraValida.forEach(item => {
    // ✅ Buscar a unidade da fruta selecionada (usando toggle se disponível)
    const frutaSelecionada = pedido?.frutasPedidos?.find(fp => fp.frutaId === item.frutaId);
    const usarUnidadeSecundaria = item.usarUnidadeSecundaria === true;
    const unidadeBase = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
      ? frutaSelecionada.unidadeMedida2
      : (frutaSelecionada?.unidadeMedida1 || 'N/A');
    
    // ✅ Extrair apenas a sigla
    const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
    const unidadeEncontrada = unidadesValidas.find(u => unidadeBase.includes(u));
    const unidade = unidadeEncontrada || unidadeBase;
    
    // ✅ Converter valores (tratando vírgula)
    const qtdStr = String(item.quantidadeColhida || '0').replace(',', '.');
    const valorStr = String(item.valorColheita || '0').replace(',', '.');
    const quantidade = parseFloat(qtdStr) || 0;
    const valor = parseFloat(valorStr) || 0;

    if (!resumo.quantidadePorUnidade[unidade]) {
      resumo.quantidadePorUnidade[unidade] = 0;
    }

    resumo.quantidadePorUnidade[unidade] += quantidade;
    resumo.valorTotal += valor;
  });

  // ✅ Sempre exibir (não condicional)
  return (
    <div style={{ marginTop: isMobile ? "12px" : "16px" }}>
      <Row gutter={[isMobile ? 8 : 20, isMobile ? 8 : 16]} align="middle">
        {/* Card 1: Colheitadores */}
        <Col xs={24} sm={8}>
          <div style={{
            backgroundColor: "#f0f9ff",
            border: "2px solid #0ea5e9",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)",
            minHeight: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <TeamOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} />
            </div>
            <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              COLHEITADORES
            </Text>
            <Text style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "block" }}>
              {resumo.totalColheitadores}
            </Text>
          </div>
        </Col>

        {/* Card 2: Quantidade Total */}
        <Col xs={24} sm={8}>
          <div style={{
            backgroundColor: "#f0fdf4",
            border: "2px solid #22c55e",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)",
            minHeight: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <CalculatorOutlined style={{ fontSize: "24px", color: "#22c55e" }} />
            </div>
            <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              QUANTIDADE TOTAL
            </Text>
            <div style={{ 
              fontSize: "20px", 
              fontWeight: "700", 
              color: "#15803d",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: isMobile ? "4px" : "8px",
              lineHeight: "1.2"
            }}>
              {Object.keys(resumo.quantidadePorUnidade).length > 0 ? (
                Object.entries(resumo.quantidadePorUnidade).map(([unidade, qtd], idx) => (
                  <React.Fragment key={idx}>
                    <span style={{ 
                      fontSize: "16px",
                      display: "inline-block",
                      whiteSpace: "nowrap"
                    }}>
                      {qtd.toLocaleString('pt-BR')} {unidade}
                    </span>
                    {idx < Object.entries(resumo.quantidadePorUnidade).length - 1 && (
                      <span style={{
                        fontSize: "12px",
                        color: "#22c55e",
                        margin: "0 4px",
                        display: "inline-block"
                      }}>
                        •
                      </span>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "16px" }}>-</span>
              )}
            </div>
          </div>
        </Col>

        {/* Card 3: Valor Total */}
        <Col xs={24} sm={8}>
          <div style={{
            backgroundColor: "#fffbeb",
            border: "2px solid #f59e0b",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)",
            minHeight: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <DollarOutlined style={{ fontSize: "24px", color: "#f59e0b" }} />
            </div>
            <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              VALOR TOTAL
            </Text>
            <Text style={{ fontSize: "20px", fontWeight: "700", color: "#d97706", display: "block" }}>
              {isFinite(resumo.valorTotal) && resumo.valorTotal > 0 ? (
                `R$ ${resumo.valorTotal.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              ) : (
                <span style={{ color: "#94a3b8" }}>R$ 0,00</span>
              )}
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

const ColheitaTab = ({
  pedidoAtual,
  setPedidoAtual,
  erros,
  setErros,
  canEditTab,
  frutas,
  areasProprias,
  areasFornecedores,
  onSave,
  onCancel,
  loading,
  isSaving,
  dadosOriginaisBanco, // ✅ NOVO: Dados originais imutáveis do banco
}) => {
  // ✅ ADICIONAR: Form do Ant Design
  const [form] = Form.useForm();

  // Hook de responsividade
  const { isMobile } = useResponsive();

  // Estados para os modais de vinculação
  const [vincularAreasModalOpen, setVincularAreasModalOpen] = useState(false);
  const [vincularFitasModalOpen, setVincularFitasModalOpen] = useState(false);
  const [frutaSelecionada, setFrutaSelecionada] = useState(null);
  const [fitasBanana, setFitasBanana] = useState([]);

  // Estados para mão de obra
  const [turmasColheita, setTurmasColheita] = useState([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true); // ✅ NOVO: Estado de loading para turmas
  
  // ✅ ADICIONAR: Refs para controlar cálculos automáticos (usando objeto para indexar por item)
  const editingRefs = React.useRef({});

  // ✅ NOVOS ESTADOS: Para validação de inconsistências de quantidades
  const [confirmInconsistenciaOpen, setConfirmInconsistenciaOpen] = useState(false);
  const [inconsistenciasData, setInconsistenciasData] = useState(null);

  // ✅ NOVOS ESTADOS: Para validação global de fitas
  const [fitasComAreasDisponiveis, setFitasComAreasDisponiveis] = useState([]);

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

  const frutasPedidoMeta = useMemo(() => {
    const porFrutaPedidoId = {};
    const culturaInfo = {};

    (pedidoAtual?.frutas || []).forEach((frutaPedido) => {
      const culturaId = frutaPedido.fruta?.cultura?.id ?? null;
      const culturaDescricao = frutaPedido.fruta?.cultura?.descricao ?? "";
      const dePrimeira = frutaPedido.fruta?.dePrimeira ?? false;
      const nome = frutaPedido.fruta?.nome ?? "";

      porFrutaPedidoId[frutaPedido.frutaPedidoId || frutaPedido.id] = {
        culturaId,
        culturaDescricao,
        dePrimeira,
        nome: capitalizeName(nome),
      };

      if (culturaId !== null) {
        if (!culturaInfo[culturaId]) {
          culturaInfo[culturaId] = {
            hasPrimeira: false,
            frutaPrimeiraNome: "",
          };
        }

        if (dePrimeira) {
          culturaInfo[culturaId].hasPrimeira = true;
          culturaInfo[culturaId].frutaPrimeiraNome = capitalizeName(nome);
        }
      }
    });

    return { porFrutaPedidoId, culturaInfo };
  }, [pedidoAtual?.frutas]);

  const frutasPedidoInfo = frutasPedidoMeta.porFrutaPedidoId;
  const culturaInfoPorId = frutasPedidoMeta.culturaInfo;
  const obterChaveFruta = (fruta) => fruta?.frutaPedidoId ?? fruta?.id ?? null;

  const frutasOrdenadas = useMemo(() => {
    return (pedidoAtual?.frutas || []).map((fruta, index) => {
      const chave = obterChaveFruta(fruta);
      const meta = chave ? frutasPedidoInfo[chave] : undefined;
      const culturaId = meta?.culturaId ?? Number.MAX_SAFE_INTEGER;
      const dePrimeiraOrdem = meta?.dePrimeira === true ? 0 : 1;
      const nomeCatalogo = frutas.find(f => f.id === fruta.frutaId)?.nome || meta?.nome || '';

      return {
        fruta,
        indexOriginal: index,
        meta,
        culturaId,
        dePrimeiraOrdem,
        nomeExibicao: capitalizeName(nomeCatalogo),
      };
    }).sort((a, b) => {
      if (a.culturaId !== b.culturaId) {
        return a.culturaId - b.culturaId;
      }
      if (a.dePrimeiraOrdem !== b.dePrimeiraOrdem) {
        return a.dePrimeiraOrdem - b.dePrimeiraOrdem;
      }
      return a.nomeExibicao.localeCompare(b.nomeExibicao);
    });
  }, [pedidoAtual?.frutas, frutasPedidoInfo, frutas]);

  const temBananaGlobal = frutasOrdenadas.some(item =>
    item.nomeExibicao.toLowerCase().includes('banana')
  );

  // ✅ SINCRONIZAR form com pedidoAtual (bidirecional)
  useEffect(() => {
    if (pedidoAtual) {
      form.setFieldsValue({
        dataColheita: pedidoAtual.dataColheita ? moment(pedidoAtual.dataColheita) : null,
        observacoesColheita: pedidoAtual.observacoesColheita || '',
        frutas: pedidoAtual.frutas || [],
        maoObra: pedidoAtual.maoObra || [],
        pesagem: pedidoAtual.pesagem || '',
        placaPrimaria: pedidoAtual.placaPrimaria || '',
        placaSecundaria: pedidoAtual.placaSecundaria || '',
        nomeMotorista: pedidoAtual.nomeMotorista || ''
      });
    }
  }, [form, pedidoAtual]);

  // Garantir que todas as frutas tenham arrays de áreas e fitas inicializados, e inicializar mão de obra
  useEffect(() => {
    let needsUpdate = false;
    let updatedPedido = { ...pedidoAtual };

    // Inicializar arrays de frutas
    if (pedidoAtual?.frutas && pedidoAtual.frutas.length > 0) {
      const frutasInicializadas = pedidoAtual.frutas.map(fruta => ({
        ...fruta,
        areas: fruta.areas || [],
        fitas: fruta.fitas || []
      }));

      const needsFrutasInit = pedidoAtual.frutas.some(fruta =>
        !fruta.areas || !fruta.fitas
      );

      if (needsFrutasInit) {
        updatedPedido.frutas = frutasInicializadas;
        needsUpdate = true;
      }
    }

    // Inicializar mão de obra se não existir
    if (!pedidoAtual?.maoObra || pedidoAtual.maoObra.length === 0) {
      updatedPedido.maoObra = [{
        turmaColheitaId: undefined,
        frutaId: undefined,
        quantidadeColhida: undefined,
        valorUnitario: undefined,
        unidadeMedida: undefined,
        valorColheita: undefined,
        observacoes: '',
        pagamentoEfetuado: false
      }];
      needsUpdate = true;
    }

    if (needsUpdate) {
      setPedidoAtual(updatedPedido);
    }
  }, [pedidoAtual?.frutas, pedidoAtual?.maoObra, setPedidoAtual]);

  // ✅ CALCULAR valorUnitario para dados carregados do backend
  useEffect(() => {
    if (!pedidoAtual?.maoObra || pedidoAtual.maoObra.length === 0) return;
    
    let needsUpdate = false;
    const maoObraAtualizada = pedidoAtual.maoObra.map(item => {
      // Se já tem valorUnitario, não recalcular
      if (item.valorUnitario !== undefined && item.valorUnitario !== null) {
        return item;
      }
      
      // Se tem valorColheita e quantidadeColhida, calcular valorUnitario
      if (item.valorColheita && item.quantidadeColhida) {
        const qtdStr = String(item.quantidadeColhida).replace(',', '.');
        const valTotalStr = String(item.valorColheita).replace(',', '.');
        const quantidade = parseFloat(qtdStr) || 0;
        const valTotal = parseFloat(valTotalStr) || 0;
        
        if (quantidade > 0 && valTotal > 0) {
          needsUpdate = true;
          return {
            ...item,
            valorUnitario: valTotal / quantidade
          };
        }
      }
      
      return item;
    });
    
    if (needsUpdate) {
      console.log('✅ Calculando valorUnitario inicial para mão de obra carregada do backend');
      setPedidoAtual(prev => ({ ...prev, maoObra: maoObraAtualizada }));
    }
  }, [pedidoAtual?.maoObra?.length]); // Executar apenas quando o comprimento mudar (dados carregados)

  // Carregar fitas de banana, turmas de colheita e dados para validação global
  useEffect(() => {
    const fetchDados = async () => {
      try {
        // Buscar fitas de banana
        const responseFitas = await axiosInstance.get("/fitas-banana");
        setFitasBanana(responseFitas.data || []);

        // ✅ NOVO: Buscar fitas com áreas para validação global
        const responseFitasComAreas = await axiosInstance.get("/controle-banana/fitas-com-areas");
        setFitasComAreasDisponiveis(responseFitasComAreas.data || []);

        // ✅ Buscar turmas de colheita com loading
        setLoadingTurmas(true);
        const responseTurmas = await axiosInstance.get("/api/turma-colheita");
        setTurmasColheita(responseTurmas.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        showNotification("error", "Erro", "Erro ao carregar dados necessários");
      } finally {
        // ✅ Garantir que o loading seja desabilitado mesmo em caso de erro
        setLoadingTurmas(false);
      }
    };

    fetchDados();
  }, []);


  const handleChange = (field, value) => {
    setPedidoAtual(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Atualizar fruta específica
  const handleFrutaChange = (index, field, value) => {
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((fruta, i) => {
        if (i === index) {
          // Para campos numéricos, garantir que seja um número válido ou undefined
          let processedValue = value;
          if (['quantidadeReal', 'quantidadeReal2'].includes(field)) {
            if (value === null || value === '' || value === undefined) {
              processedValue = undefined;
            } else {
              processedValue = Number(value);
            }
          }
          
          return { ...fruta, [field]: processedValue };
        }
        return fruta;
      });
      
      return { ...prev, frutas: novasFrutas };
    });
  };

  // Funções para abrir modais de vinculação
  const handleVincularAreas = (fruta, frutaIndex) => {
    const valoresAtuais = form.getFieldsValue();
    const frutaAtual = valoresAtuais.frutas?.[frutaIndex] || pedidoAtual?.frutas?.[frutaIndex] || fruta;
    const chaveFruta = obterChaveFruta(frutaAtual) ?? obterChaveFruta(fruta);
    const frutaMeta = chaveFruta ? frutasPedidoInfo[chaveFruta] : undefined;
    const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
      ? culturaInfoPorId[frutaMeta.culturaId]
      : undefined;
    const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

    const frutasDisponiveis = valoresAtuais.frutas || pedidoAtual?.frutas || [];
    const frutasDoGrupo = frutasDisponiveis
      .map((frutaItem) => {
        const chaveItem = obterChaveFruta(frutaItem);
        if (!chaveItem) {
          return null;
        }
        const metaItem = frutasPedidoInfo[chaveItem];
        if (!metaItem || metaItem.culturaId !== frutaMeta?.culturaId) {
          return null;
        }

        return {
          frutaPedidoId: chaveItem,
          quantidadeReal: frutaItem.quantidadeReal,
          quantidadeReal2: frutaItem.quantidadeReal2,
          unidadeMedida1: frutaItem.unidadeMedida1,
          unidadeMedida2: frutaItem.unidadeMedida2,
          dePrimeira: metaItem.dePrimeira ?? false,
          nome: capitalizeName(frutaItem.frutaNome || frutaItem.fruta?.nome || metaItem?.nome || ''),
        };
      })
      .filter(Boolean);

    if (herdaVinculosDaPrimeira) {
      const frutaPrimeiraNome = culturaInfo?.frutaPrimeiraNome || "fruta de primeira";
      showNotification(
        "warning",
        "Vinculação bloqueada",
        `As áreas de "${frutaMeta?.nome || frutaAtual?.frutaNome || 'esta fruta'}" são herdadas da ${frutaPrimeiraNome} desta cultura.`
      );
      return;
    }

    const frutaCatalogo = frutas.find(f => f.id === fruta.frutaId) || frutaAtual.fruta || null;

    const frutaProcessada = {
      ...frutaAtual,
      index: frutaIndex,
      frutaNome: capitalizeName(frutaCatalogo?.nome || frutaMeta?.nome || ''),
      fruta: frutaCatalogo,
      dePrimeira: frutaMeta?.dePrimeira ?? false,
      culturaId: frutaMeta?.culturaId ?? null,
      culturaDescricao: frutaMeta?.culturaDescricao ?? '',
      herdaVinculos: false,
      frutasDoGrupo,
    };
    
    setFrutaSelecionada(frutaProcessada);
    setVincularAreasModalOpen(true);
  };

  // ✅ NOVO: Função para calcular estoque consumido por outras frutas do pedido
  const calcularEstoqueConsumidoPorOutrasFrutas = (frutaIndexAtual) => {
    // ✅ CORREÇÃO: Usar dados ORIGINAIS do banco para calcular o consumo real
    // porque o estoque no backend JÁ foi decrementado pelas fitas originais
    const frutasOriginais = dadosOriginaisBanco?.frutas || [];

    const estoqueConsumido = {};

    // Percorrer todas as frutas EXCETO a atual
    frutasOriginais.forEach((fruta, index) => {
      if (index === frutaIndexAtual) return; // Pular a fruta atual

      // Se a fruta tem fitas vinculadas
      if (fruta.fitas && Array.isArray(fruta.fitas)) {
        fruta.fitas.forEach(fita => {
          // Se tem detalhesAreas (nova estrutura)
          if (fita.detalhesAreas && Array.isArray(fita.detalhesAreas)) {
            fita.detalhesAreas.forEach(detalhe => {
              if (detalhe.controleBananaId && detalhe.quantidade) {
                const chave = `${fita.fitaBananaId}_${detalhe.controleBananaId}`;
                estoqueConsumido[chave] = (estoqueConsumido[chave] || 0) + detalhe.quantidade;
              }
            });
          }
        });
      }
    });

    console.log('🎯 [ColheitaTab] Estoque consumido por outras frutas (ORIGINAIS DO BANCO):', estoqueConsumido);
    return estoqueConsumido;
  };

  const handleVincularFitas = (fruta, frutaIndex) => {
    const valoresAtuais = form.getFieldsValue();
    const frutaAtual = valoresAtuais.frutas?.[frutaIndex] || pedidoAtual?.frutas?.[frutaIndex] || fruta;
    const chaveFruta = obterChaveFruta(frutaAtual) ?? obterChaveFruta(fruta);
    const frutaMeta = chaveFruta ? frutasPedidoInfo[chaveFruta] : undefined;
    const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
      ? culturaInfoPorId[frutaMeta.culturaId]
      : undefined;
    const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

    if (herdaVinculosDaPrimeira) {
      const frutaPrimeiraNome = culturaInfo?.frutaPrimeiraNome || "fruta de primeira";
      showNotification(
        "warning",
        "Vinculação bloqueada",
        `As fitas de "${frutaMeta?.nome || frutaAtual?.frutaNome || 'esta fruta'}" são herdadas da ${frutaPrimeiraNome} desta cultura.`
      );
      return;
    }

    if (!hasLinkedAreas(frutaAtual, false)) {
      showNotification("warning", "Áreas necessárias", "Vincule áreas antes de gerenciar as fitas desta fruta.");
      return;
    }

    const frutaOriginal = dadosOriginaisBanco?.frutas?.find(f => f.frutaId === fruta.frutaId) || null;
    const estoqueConsumido = calcularEstoqueConsumidoPorOutrasFrutas(frutaIndex);
    const todasFrutas = pedidoAtual.frutas || [];
    const frutaCatalogo = frutas.find(f => f.id === fruta.frutaId) || frutaAtual.fruta || null;

    const frutaProcessada = {
      ...frutaAtual,
      index: frutaIndex,
      frutaNome: capitalizeName(frutaCatalogo?.nome || frutaMeta?.nome || ''),
      fitas: frutaAtual.fitas?.length > 0 ? frutaAtual.fitas.map(fita => ({
        id: fita.id,
        fitaBananaId: fita.fitaBananaId,
        quantidadeFita: fita.quantidadeFita || undefined,
        observacoes: fita.observacoes || '',
        detalhesAreas: fita.detalhesAreas || []
      })) : [],
      fitasOriginaisBanco: frutaOriginal?.fitas || [],
      estoqueConsumidoPorOutrasFrutas: estoqueConsumido,
      todasFrutasPedido: todasFrutas,
      dePrimeira: frutaMeta?.dePrimeira ?? false,
      culturaId: frutaMeta?.culturaId ?? null,
      culturaDescricao: frutaMeta?.culturaDescricao ?? '',
      herdaVinculos: false,
    };

    setFrutaSelecionada(frutaProcessada);
    setVincularFitasModalOpen(true);
  };

  // Funções para gerenciar mão de obra
  const adicionarMaoObra = () => {
    const maoObraAtual = pedidoAtual.maoObra || [];
    setPedidoAtual(prev => ({
      ...prev,
      maoObra: [...maoObraAtual, {
        turmaColheitaId: undefined,
        frutaId: undefined,
        quantidadeColhida: undefined,
        valorUnitario: undefined,
        unidadeMedida: undefined,
        valorColheita: undefined,
        observacoes: '',
        pagamentoEfetuado: false
      }]
    }));
  };

  const removerMaoObra = (index) => {
    const maoObraAtual = pedidoAtual.maoObra || [];
    if (maoObraAtual.length > 1) {
      const novaMaoObra = maoObraAtual.filter((_, i) => i !== index);
      setPedidoAtual(prev => ({ ...prev, maoObra: novaMaoObra }));
    }
  };

  const handleMaoObraChange = (index, field, value) => {
    const maoObraAtual = pedidoAtual.maoObra || [];
    const novaMaoObra = maoObraAtual.map((item, i) => {
      if (i === index) {
        let processedValue = value;
        if (['quantidadeColhida', 'valorColheita', 'valorUnitario'].includes(field)) {
          processedValue = parseDecimalValue(value);
        }
        return { ...item, [field]: processedValue };
      }
      return item;
    });
    setPedidoAtual(prev => ({ ...prev, maoObra: novaMaoObra }));
  };
  
  // ✅ ADICIONAR: Handlers para cálculos automáticos (evita loops)
  const handleValorUnitarioChange = (index, novoValorUnitario, quantidadeColhida) => {
    if (!quantidadeColhida || !novoValorUnitario) return;
    if (editingRefs.current[`total_${index}`]) return; // Evitar loop
    
    editingRefs.current[`unit_${index}`] = true;
    
    const qtdStr = String(quantidadeColhida).replace(',', '.');
    const valUnitStr = String(novoValorUnitario).replace(',', '.');
    const quantidade = parseFloat(qtdStr) || 0;
    const valUnit = parseFloat(valUnitStr) || 0;
    
    if (quantidade > 0 && valUnit > 0) {
      const total = quantidade * valUnit;
      handleMaoObraChange(index, 'valorColheita', total);
    }
    
    setTimeout(() => {
      editingRefs.current[`unit_${index}`] = false;
    }, 100);
  };
  
  const handleValorTotalChange = (index, novoValorTotal, quantidadeColhida) => {
    if (!quantidadeColhida || !novoValorTotal) return;
    if (editingRefs.current[`unit_${index}`]) return; // Evitar loop
    
    editingRefs.current[`total_${index}`] = true;
    
    const qtdStr = String(quantidadeColhida).replace(',', '.');
    const valTotalStr = String(novoValorTotal).replace(',', '.');
    const quantidade = parseFloat(qtdStr) || 0;
    const valTotal = parseFloat(valTotalStr) || 0;
    
    if (quantidade > 0 && valTotal > 0) {
      const valUnit = valTotal / quantidade;
      handleMaoObraChange(index, 'valorUnitario', valUnit);
    }
    
    setTimeout(() => {
      editingRefs.current[`total_${index}`] = false;
    }, 100);
  };

  // ✅ NOVA FUNÇÃO: Validar mão de obra em tempo real
  const validarMaoObraItem = (item, index) => {
    // Verificar se pelo menos um campo foi preenchido (exceto observações)
    const temAlgumCampo = item.turmaColheitaId ||
                          item.frutaId ||
                          item.quantidadeColhida ||
                          item.unidadeMedida ||
                          item.valorColheita;

    if (!temAlgumCampo) {
      return null; // Item vazio, sem erro
    }

    // Se qualquer campo foi preenchido, verificar campos obrigatórios
    // Nota: unidadeMedida será derivada da fruta, então não é mais obrigatória
    const camposObrigatorios = ['turmaColheitaId', 'frutaId', 'quantidadeColhida', 'valorColheita'];
    const camposFaltando = camposObrigatorios.filter(campo => !item[campo]);

    if (camposFaltando.length > 0) {
      const nomesCampos = {
        'turmaColheitaId': 'Turma de Colheita',
        'frutaId': 'Fruta',
        'quantidadeColhida': 'Quantidade Colhida',
        'valorColheita': 'Valor da Colheita'
      };
      return `Mão de obra ${index + 1}: Campos obrigatórios não preenchidos: ${camposFaltando.map(campo => nomesCampos[campo]).join(', ')}`;
    }

    // Validar valores numéricos
    if (item.quantidadeColhida && item.quantidadeColhida <= 0) {
      return `Mão de obra ${index + 1}: Quantidade deve ser maior que zero`;
    }

    if (item.valorColheita && item.valorColheita <= 0) {
      return `Mão de obra ${index + 1}: Valor deve ser maior que zero`;
    }

    return null; // Sem erros
  };

  // ✅ NOVA FUNÇÃO: Validar duplicação de colheitadores
  const validarDuplicacao = (turmaColheitaId, indexAtual) => {
    if (!turmaColheitaId) return { valido: true };

    const maoObraAtual = pedidoAtual.maoObra || [];
    const duplicata = maoObraAtual.find((item, index) =>
      index !== indexAtual && item.turmaColheitaId === turmaColheitaId
    );

    if (duplicata) {
      const nomeColhedor = turmasColheita.find(t => t.id === turmaColheitaId)?.nomeColhedor || 'Colhedor';
      return {
        valido: false,
        mensagem: `${nomeColhedor} já foi selecionado neste pedido`
      };
    }

    return { valido: true };
  };

  // Verificar se fruta é banana para mostrar botão de fitas
  const isBanana = (frutaNome) => {
    return frutaNome && frutaNome.toLowerCase().includes('banana');
  };

  // Verificar se fruta tem áreas vinculadas (não placeholders)
  const hasLinkedAreas = (fruta, herdaDaPrimeira = false) => {
    if (herdaDaPrimeira) {
      return true;
    }
    return fruta?.areas && fruta.areas.some(area => 
      area.areaPropriaId || area.areaFornecedorId
    );
  };

  // Verificar se fruta tem fitas vinculadas
  const hasLinkedFitas = (fruta) => {
    return fruta?.fitas && fruta.fitas.length > 0;
  };

  // Obter nomes das áreas vinculadas
  const getLinkedAreasNames = (fruta) => {
    if (!fruta?.areas) return [];
    
    const realAreas = fruta.areas.filter(area => 
      area.areaPropriaId || area.areaFornecedorId
    );

    return realAreas.map(area => {
      if (area.areaPropriaId) {
        const areaPropria = areasProprias.find(a => a.id === area.areaPropriaId);
        return {
          nome: areaPropria?.nome?.toUpperCase() || `ÁREA ${area.areaPropriaId}`,
          tipo: 'propria'
        };
      } else {
        const areaFornecedor = areasFornecedores.find(a => a.id === area.areaFornecedorId);
        return {
          nome: areaFornecedor?.nome?.toUpperCase() || `ÁREA FORNECEDOR ${area.areaFornecedorId}`,
          tipo: 'fornecedor'
        };
      }
    });
  };

  // Obter nomes das fitas vinculadas
  const getLinkedFitasNames = (fruta) => {
    if (!fruta?.fitas) return [];

    return fruta.fitas.map(fita => {
      const fitaBanana = fitasBanana.find(f => f.id === fita.fitaBananaId);
      return {
        nome: fitaBanana?.nome || `Fita ${fita.fitaBananaId}`,
        cor: fitaBanana?.corHex || '#52c41a',
        quantidade: fita.quantidadeFita
      };
    });
  };

  const normalizarNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') {
      return 0;
    }

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : 0;
    }

    if (typeof valor === 'string') {
      const parsed = parseFloat(valor.replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  // ✅ NOVA FUNÇÃO: Validar inconsistências entre quantidades informadas e áreas (considerando agrupamentos por cultura)
  const validarInconsistenciasQuantidades = (listaFrutas) => {
    const inconsistencias = [];
    const gruposPorCultura = {};

    listaFrutas.forEach((fruta, index) => {
      const chaveFruta = obterChaveFruta(fruta);
      const frutaMeta = chaveFruta ? frutasPedidoInfo[chaveFruta] : undefined;
      const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
        ? culturaInfoPorId[frutaMeta.culturaId]
        : undefined;
      const hasPrimeiraNaCultura = !!culturaInfo?.hasPrimeira;
      const herdaVinculosDaPrimeira = hasPrimeiraNaCultura && frutaMeta && !frutaMeta.dePrimeira;
      const nomeFruta = capitalizeName(fruta.frutaNome || fruta.fruta?.nome || (frutas.find(f => f.id === fruta.frutaId)?.nome) || `Fruta ${index + 1}`);

      const quantidadeReal = normalizarNumero(fruta.quantidadeReal);
      const quantidadeReal2 = normalizarNumero(fruta.quantidadeReal2);

      if (hasPrimeiraNaCultura) {
        const grupoKey = `cultura-${frutaMeta.culturaId}`;
        if (!gruposPorCultura[grupoKey]) {
          gruposPorCultura[grupoKey] = {
            nomeGrupo: culturaInfo?.frutaPrimeiraNome || nomeFruta,
            unidadeMedida1: fruta.unidadeMedida1,
            unidadeMedida2: fruta.unidadeMedida2,
            quantidadeReal: 0,
            quantidadeReal2: 0,
            somaUnidade1: 0,
            somaUnidade2: 0,
          };
        }

        const grupo = gruposPorCultura[grupoKey];
        grupo.quantidadeReal += quantidadeReal;
        grupo.quantidadeReal2 += quantidadeReal2;

        if (!grupo.unidadeMedida1) {
          grupo.unidadeMedida1 = fruta.unidadeMedida1;
        }
        if (!grupo.unidadeMedida2 && fruta.unidadeMedida2) {
          grupo.unidadeMedida2 = fruta.unidadeMedida2;
        }

        if (!herdaVinculosDaPrimeira) {
          const areasReais = fruta.areas?.filter(area =>
            area.areaPropriaId || area.areaFornecedorId
          ) || [];

          const somaUnidade1 = areasReais.reduce((sum, area) =>
            sum + (Number(area.quantidadeColhidaUnidade1) || 0), 0);

          const somaUnidade2 = areasReais.reduce((sum, area) =>
            sum + (Number(area.quantidadeColhidaUnidade2) || 0), 0);

          grupo.somaUnidade1 += somaUnidade1;
          grupo.somaUnidade2 += somaUnidade2;
        }
      } else {
        const areasReais = fruta.areas?.filter(area =>
          area.areaPropriaId || area.areaFornecedorId
        ) || [];

        const somaUnidade1 = areasReais.reduce((sum, area) =>
          sum + (Number(area.quantidadeColhidaUnidade1) || 0), 0);

        const somaUnidade2 = areasReais.reduce((sum, area) =>
          sum + (Number(area.quantidadeColhidaUnidade2) || 0), 0);

        const temInconsistenciaUnd1 = Math.abs(quantidadeReal - somaUnidade1) > 0.01;
        const temInconsistenciaUnd2 = fruta.unidadeMedida2 && Math.abs(quantidadeReal2 - somaUnidade2) > 0.01;

        if (temInconsistenciaUnd1 || temInconsistenciaUnd2) {
          inconsistencias.push({
            nomeFruta,
            unidadeMedida1: fruta.unidadeMedida1,
            unidadeMedida2: fruta.unidadeMedida2,
            quantidadeReal,
            quantidadeReal2,
            somaUnidade1,
            somaUnidade2,
            temInconsistenciaUnd1,
            temInconsistenciaUnd2,
            isAgrupamento: false,
          });
        }
      }
    });

    Object.values(gruposPorCultura).forEach((grupo) => {
      const temInconsistenciaUnd1 = Math.abs((grupo.quantidadeReal || 0) - (grupo.somaUnidade1 || 0)) > 0.01;
      const temInconsistenciaUnd2 = grupo.unidadeMedida2 && Math.abs((grupo.quantidadeReal2 || 0) - (grupo.somaUnidade2 || 0)) > 0.01;

      if (temInconsistenciaUnd1 || temInconsistenciaUnd2) {
        inconsistencias.push({
          nomeFruta: grupo.nomeGrupo,
          unidadeMedida1: grupo.unidadeMedida1,
          unidadeMedida2: grupo.unidadeMedida2,
          quantidadeReal: grupo.quantidadeReal,
          quantidadeReal2: grupo.quantidadeReal2,
          somaUnidade1: grupo.somaUnidade1,
          somaUnidade2: grupo.somaUnidade2,
          temInconsistenciaUnd1,
          temInconsistenciaUnd2,
          isAgrupamento: true,
        });
      }
    });

    return inconsistencias;
  };

  // ✅ HELPER: Normalizar dados antes de enviar ao backend (converter Decimals em números INTEIROS)
  const normalizarDadosParaBackend = (pedido) => {
    // Helper interno para converter valores para inteiro
    const converterValor = (valor) => {
      if (!valor) return valor;

      // Se já for número, arredondar para inteiro
      if (typeof valor === 'number') {
        const resultado = Math.round(valor);
        console.log('🔢 Convertendo número para inteiro:', { original: valor, resultado });
        return resultado;
      }

      // Se for string, converter para inteiro
      if (typeof valor === 'string') {
        const resultado = Math.round(parseFloat(valor) || 0);
        console.log('🔢 Convertendo string para inteiro:', { original: valor, resultado });
        return resultado;
      }

      // Se for objeto Decimal do Prisma
      if (typeof valor === 'object' && 'd' in valor) {
        try {
          let numero;
          if (typeof valor.toNumber === 'function') {
            numero = valor.toNumber();
          } else {
            const digitos = valor.d.join('');
            numero = parseFloat(digitos) * Math.pow(10, valor.e - digitos.length + 1) * valor.s;
          }
          const resultado = Math.round(numero);
          console.log('🔢 Convertendo Decimal para inteiro:', { original: valor, numero, resultado });
          return resultado;
        } catch (error) {
          console.error('❌ Erro ao converter Decimal:', error);
          return valor;
        }
      }

      return valor;
    };

    // Criar cópia do pedido para não modificar o original
    const pedidoNormalizado = { ...pedido };

    // Normalizar frutas
    if (pedidoNormalizado.frutas) {
      pedidoNormalizado.frutas = pedidoNormalizado.frutas.map(fruta => {
        const frutaNormalizada = {
          ...fruta,
          quantidadeReal: converterValor(fruta.quantidadeReal),
          quantidadeReal2: converterValor(fruta.quantidadeReal2)
        };

        // Normalizar áreas
        if (fruta.areas) {
          frutaNormalizada.areas = fruta.areas.map(area => ({
            ...area,
            quantidadeColhidaUnidade1: converterValor(area.quantidadeColhidaUnidade1),
            quantidadeColhidaUnidade2: converterValor(area.quantidadeColhidaUnidade2)
          }));
        }

        const chaveFruta = obterChaveFruta(fruta);
        const metaFruta = chaveFruta ? frutasPedidoInfo[chaveFruta] : undefined;
        const culturaInfo = metaFruta?.culturaId !== null && metaFruta?.culturaId !== undefined
          ? culturaInfoPorId[metaFruta.culturaId]
          : undefined;
        const herdaVinculosDaPrimeira = !!(metaFruta && culturaInfo?.hasPrimeira && !metaFruta.dePrimeira);

        if (herdaVinculosDaPrimeira) {
          frutaNormalizada.areas = [];
          frutaNormalizada.fitas = [];
        }

        return frutaNormalizada;
      });
    }

    console.log('📤 PEDIDO NORMALIZADO FINAL:', JSON.stringify(pedidoNormalizado, null, 2));

    return pedidoNormalizado;
  };

  // ✅ FUNÇÃO: Continuar salvamento após confirmação de inconsistências
  const handleConfirmarInconsistencias = async () => {
    try {
      // Fechar modal de confirmação
      setConfirmInconsistenciaOpen(false);

      // ✅ Sincronizar dados do form com pedidoAtual antes de normalizar
      const formValues = form.getFieldsValue();
      const maoObraPadronizada = normalizarListaMaoObra(formValues.maoObra || []);
      let maoObraComUnidade = maoObraPadronizada;

      if (maoObraPadronizada.length > 0) {
        // Processar mão de obra do form e atualizar unidadeMedida baseada no toggle
        maoObraComUnidade = maoObraPadronizada.map(item => {
          if (!item.frutaId) return item;
          
          const frutaSelecionada = pedidoAtual.frutas?.find(f => f.frutaId === item.frutaId);
          if (!frutaSelecionada) return item;
          
          const usarUnidadeSecundaria = item.usarUnidadeSecundaria === true;
          const unidadeBase = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
            ? frutaSelecionada.unidadeMedida2
            : (frutaSelecionada?.unidadeMedida1 || 'KG');
          
          const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
          const unidadeEncontrada = unidadesValidas.find(u => unidadeBase.includes(u));
          const unidadeMedida = unidadeEncontrada || 'KG';
          
          return { ...item, unidadeMedida };
        });
        
        // Atualizar pedidoAtual com mão de obra processada antes de normalizar
        setPedidoAtual(prev => ({ ...prev, maoObra: maoObraComUnidade }));
      }

      // ✅ NORMALIZAR dados antes de validar e salvar
      const pedidoComMaoObraAtualizada = { ...pedidoAtual, maoObra: maoObraComUnidade };
      const pedidoNormalizado = normalizarDadosParaBackend(pedidoComMaoObraAtualizada);

      // ✅ VALIDAÇÃO GLOBAL de fitas antes de salvar
      try {
        const resultadoValidacao = validarFitasCompleto(
          pedidoNormalizado.frutas || [],
          fitasComAreasDisponiveis,
          dadosOriginaisBanco?.frutas || [], // Dados originais do banco para modo edição
          true // ColheitaTab sempre é modo edição
        );

        if (!resultadoValidacao.valido) {
          // Mostrar primeira mensagem de erro
          const primeiroErro = resultadoValidacao.mensagensErro?.[0] || "Conflito de estoque detectado";
          showNotification("error", "Conflito de Estoque de Fitas", primeiroErro);

          // Limpar estados
          setInconsistenciasData(null);
          return;
        }

        // ✅ Atualizar pedidoAtual com dados normalizados antes de salvar
        setPedidoAtual(pedidoNormalizado);

        // Aguardar um tick para garantir que o estado foi atualizado
        setTimeout(() => {
          // Se passou na validação, chamar o onSave original (sem parâmetro, usa pedidoAtual.maoObra)
          onSave();
        }, 0);

        // Limpar estados após salvamento bem-sucedido
        setInconsistenciasData(null);
      } catch (error) {
        console.error('Erro na validação global de fitas:', error);
        showNotification("error", "Erro", "Erro interno na validação de estoque. Tente novamente.");

        // Limpar estados
        setInconsistenciasData(null);
      }
    } catch (error) {
      console.error('Erro ao confirmar inconsistências:', error);
      showNotification("error", "Erro", "Erro ao processar confirmação. Tente novamente.");

      // Limpar estados
      setConfirmInconsistenciaOpen(false);
      setInconsistenciasData(null);
    }
  };

  // Função para salvar áreas vinculadas
  const handleSalvarAreas = (areas) => {
    if (!frutaSelecionada) return;
    if (frutaSelecionada?.herdaVinculos) {
      showNotification("warning", "Ação não permitida", "Esta fruta herda as áreas da fruta de primeira da cultura. Ajuste as áreas diretamente na fruta de primeira.");
      return;
    }
    
    // ✅ SINCRONIZAÇÃO: Calcular somas das quantidades das áreas
    const somaUnidade1 = areas?.reduce((sum, area) => 
      sum + (area.quantidadeColhidaUnidade1 || 0), 0) || 0;
    const somaUnidade2 = areas?.reduce((sum, area) => 
      sum + (area.quantidadeColhidaUnidade2 || 0), 0) || 0;
    
    
    // Atualizar formulário com novas áreas e quantidades sincronizadas
    const frutasAtuais = pedidoAtual.frutas;
    let deveAtualizarQuantidades = true;
    const frutasAtualizadas = frutasAtuais.map((fruta, index) => {
      if (index === frutaSelecionada.index) {
        // Se não há áreas selecionadas, criar área placeholder
        if (!areas || areas.length === 0) {
          return {
            ...fruta,
            areas: [{
              areaPropriaId: undefined,
              areaFornecedorId: undefined,
              observacoes: 'Área a ser definida durante a colheita'
            }]
          };
        }

        const chaveFruta = obterChaveFruta(fruta);
        const frutaMeta = chaveFruta ? frutasPedidoInfo[chaveFruta] : undefined;
        const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
          ? culturaInfoPorId[frutaMeta.culturaId]
          : undefined;
        const possuiSegundas = frutasAtuais.some((item, idxItem) => {
          if (idxItem === index) {
            return false;
          }
          const chaveItem = obterChaveFruta(item);
          const metaItem = chaveItem ? frutasPedidoInfo[chaveItem] : undefined;
          return metaItem && metaItem.culturaId === frutaMeta?.culturaId && !metaItem.dePrimeira;
        });
        const estaAgrupado = frutaMeta?.dePrimeira && possuiSegundas;

        const quantidadeRealAtualizada = estaAgrupado ? fruta.quantidadeReal : somaUnidade1;
        const quantidadeReal2Atualizada = estaAgrupado ? fruta.quantidadeReal2 : (somaUnidade2 > 0 ? somaUnidade2 : null);

        if (estaAgrupado) {
          deveAtualizarQuantidades = false;
        }

        return {
          ...fruta,
          areas: areas.map(area => ({
            ...area,
            areaPropriaId: area.areaPropriaId || undefined,
            areaFornecedorId: area.areaFornecedorId || undefined,
            observacoes: area.observacoes || ''
          })),
          quantidadeReal: quantidadeRealAtualizada,
          quantidadeReal2: quantidadeReal2Atualizada
        };
      }
      return fruta;
    });

    setPedidoAtual(prev => ({ ...prev, frutas: frutasAtualizadas }));
    if (!deveAtualizarQuantidades) {
      showNotification("success", "Sucesso", "Áreas vinculadas com sucesso!" );
      return;
    }
    showNotification("success", "Sucesso", "Áreas vinculadas e quantidades sincronizadas com sucesso!" );
  };

  // Função para salvar fitas vinculadas
  const handleSalvarFitas = (fitas) => {
    if (!frutaSelecionada) return;
    if (frutaSelecionada?.herdaVinculos) {
      showNotification("warning", "Ação não permitida", "Esta fruta herda as fitas da fruta de primeira da cultura. Ajuste as fitas diretamente na fruta de primeira.");
      return;
    }
    
    // Atualizar formulário com novas fitas
    const frutasAtuais = pedidoAtual.frutas;
    const frutasAtualizadas = frutasAtuais.map((fruta, index) => {
      if (index === frutaSelecionada.index) {
        return {
          ...fruta,
          fitas: fitas
        };
      }
      return fruta;
    });

    setPedidoAtual(prev => ({ ...prev, frutas: frutasAtualizadas }));
    showNotification("success", "Sucesso", "Fitas vinculadas com sucesso!");
  };



  return (
    <div style={{ minHeight: "830px", position: "relative", paddingBottom: "80px" }}>
      <Form
        form={form}
        layout="vertical"
        size="large"
        onValuesChange={(changedValues, allValues) => {
          // ✅ SINCRONIZAR mudanças do form com pedidoAtual
          setPedidoAtual(prev => ({
            ...prev,
            ...allValues
          }));
        }}
      >
      {/* Dados da Colheita */}
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados da Colheita</span>
          </Space>
        }
        style={{ 
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <CalendarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Data da Colheita</span>
                </Space>
              }
              validateStatus={erros.dataColheita ? "error" : ""}
              help={erros.dataColheita}
              required
            >
              <MaskedDatePicker
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                placeholder="Selecione a data"
                disabledDate={(current) => current && current > moment().endOf('day')}
                value={pedidoAtual.dataColheita ? moment(pedidoAtual.dataColheita) : null}
                onChange={(date) => {
                  handleChange("dataColheita", date ? date.startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss') : null);
                }}
                showToday
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <FileTextOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Observações da Colheita</span>
                </Space>
              }
            >
              <TextArea
                rows={3}
                placeholder="Observações sobre a colheita (opcional)"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.observacoesColheita || ""}
                onChange={(e) => handleChange("observacoesColheita", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Frutas da Colheita */}
      <Card
        title={
          <Space>
            <AppleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas da Colheita</span>
          </Space>
        }
        style={{ 
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }
        }}
      >
        {/* Cabeçalho das colunas */}
        {(() => {
          // Verificar se há pelo menos uma fruta banana no pedido
          return (
            <Row gutter={[8, 8]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
              <Col xs={24} md={temBananaGlobal ? 5 : 6}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <AppleOutlined style={{ marginRight: 8 }} />
                  Fruta
                </span>
              </Col>
              <Col xs={24} md={temBananaGlobal ? 3 : 4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Prevista
                </span>
              </Col>
              <Col xs={24} md={temBananaGlobal ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Colhida
                </span>
              </Col>
              <Col xs={24} md={temBananaGlobal ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Colhida 2
                </span>
              </Col>
              <Col xs={24} md={temBananaGlobal ? 5 : 4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  Áreas
                </span>
              </Col>
              {temBananaGlobal && (
                <Col xs={24} md={3}>
                  <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    Fitas
                  </span>
                </Col>
              )}
            </Row>
          );
        })()}

        {frutasOrdenadas.map(({ fruta, indexOriginal, meta, nomeExibicao }, ordemIndex) => {
          const culturaInfo = meta?.culturaId !== null && meta?.culturaId !== undefined
            ? culturaInfoPorId[meta.culturaId]
            : undefined;
          const herdaVinculosDaPrimeira = !!(meta && culturaInfo?.hasPrimeira && !meta.dePrimeira);
          const isFrutaBanana = nomeExibicao.toLowerCase().includes('banana');

          const wrapperStyle = herdaVinculosDaPrimeira
            ? {
                position: 'relative',
                marginLeft: isMobile ? 16 : 24,
                padding: isMobile ? 12 : 16,
                borderLeft: '3px solid #059669',
                backgroundColor: '#f0fdf4',
                borderRadius: 8,
                marginBottom: isMobile ? 12 : 16,
              }
            : {
                marginBottom: isMobile ? 12 : 16,
              };

          return (
          <div key={indexOriginal} style={{ marginBottom: isMobile ? 12 : 16 }}>
            {/* 🆕 ALERTA: Nova fruta adicionada durante edição */}
            {!fruta.frutaPedidoId && (
              <Alert
                message="Nova Fruta Adicionada"
                description={
                  `Esta fruta foi adicionada durante a edição. ` +
                  `Complete os dados de colheita obrigatórios (quantidade real, áreas${isFrutaBanana ? ' e fitas' : ''}).`
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={wrapperStyle}>
            <Row gutter={[8, 8]} align="baseline">
              {/* Nome da Fruta */}
              <Col xs={24} md={temBananaGlobal ? 5 : 6}>
                <Form.Item>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: isMobile ? 6 : 8,
                    }}
                  >
                    <Input
                      disabled
                      value={capitalizeName(frutas.find(f => f.id === fruta.frutaId)?.nome || '')}
                      style={{
                        borderRadius: "6px",
                        borderColor: "#d9d9d9",
                        backgroundColor: "#f5f5f5",
                      }}
                    />
                  </div>
                </Form.Item>
              </Col>

              {/* Quantidade Prevista */}
              <Col xs={24} md={temBananaGlobal ? 3 : 4}>
                <Form.Item>
                  <Input
                    disabled
                    value={`${fruta.quantidadePrevista || ''} ${fruta.unidadeMedida1 || ''}`.trim()}
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Quantidade Real */}
              <Col xs={24} md={temBananaGlobal ? 4 : 5}>
                <Form.Item
                    rules={[
                      { required: true },
                      { type: 'number', min: 0.01, message: 'Quantidade deve ser maior que 0' }
                    ]}
                >
                  <MonetaryInput
                    placeholder="Ex: 985,50"
                    addonAfter={fruta.unidadeMedida1 || ''}
                    size="large"
                    value={fruta.quantidadeReal}
                    onChange={(value) => handleFrutaChange(indexOriginal, 'quantidadeReal', value)}
                    disabled={!canEditTab("2")}
                  />
                </Form.Item>
              </Col>

              {/* Quantidade Real 2 */}
                <Col xs={24} md={temBananaGlobal ? 4 : 5}>
                  <Form.Item
                >
                  <MonetaryInput
                    placeholder="Ex: 50,00"
                    addonAfter={fruta.unidadeMedida2 || ''}
                    disabled={!fruta.unidadeMedida2 || !canEditTab("2")}
                    className={!fruta.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                    size="large"
                    value={fruta.quantidadeReal2}
                    onChange={(value) => handleFrutaChange(indexOriginal, 'quantidadeReal2', value)}
                  />
                </Form.Item>
              </Col>

              {/* Coluna de Áreas */}
              <Col xs={24} md={temBananaGlobal ? 5 : 4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {herdaVinculosDaPrimeira ? (
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '13px' }}>
                      Áreas serão vinculadas à fruta de primeira.
                    </Text>
                  ) : hasLinkedAreas(fruta, herdaVinculosDaPrimeira) ? (
                    <>
                      <Tooltip title="Gerenciar áreas">
                        <FormButton
                          icon={<LinkOutlined />}
                          onClick={() => handleVincularAreas(fruta, indexOriginal)}
                          style={{
                            minWidth: '32px',
                            width: '32px',
                            padding: '0'
                          }}
                          disabled={!canEditTab("2")}
                        />
                      </Tooltip>

                      {getLinkedAreasNames(fruta).slice(0, 2).map((area, idx) => (
                        <Tag
                          key={idx}
                          size="small"
                          color={area.tipo === 'propria' ? 'green' : 'blue'}
                          style={{
                            fontSize: '11px',
                            maxWidth: '70px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {area.nome}
                        </Tag>
                      ))}

                      {getLinkedAreasNames(fruta).length > 2 && (
                        <Tag size="small" color="blue" style={{ fontSize: '11px' }}>
                          +{getLinkedAreasNames(fruta).length - 2}
                        </Tag>
                      )}
                    </>
                  ) : (
                    <FormButton
                      icon={<LinkOutlined />}
                      onClick={() => handleVincularAreas(fruta, indexOriginal)}
                      style={{
                        minWidth: '120px',
                        width: '120px'
                      }}
                      disabled={!canEditTab("2")}
                    >
                      {canEditTab("2") ? 'Vincular Áreas' : 'Visualizar Áreas'}
                    </FormButton>
                  )}
                </div>
              </Col>

              {/* Coluna de Fitas - Só aparece para bananas */}
              {isFrutaBanana && (
                <Col xs={24} md={3}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {herdaVinculosDaPrimeira ? (
                      <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '13px' }}>
                        Fitas serão vinculadas à fruta de primeira.
                      </Text>
                    ) : hasLinkedFitas(fruta) ? (
                      <>
                        <Tooltip title="Gerenciar fitas">
                          <FormButton
                            icon={<LinkOutlined />}
                            onClick={() => handleVincularFitas(fruta, indexOriginal)}
                            style={{
                              minWidth: '32px',
                              width: '32px',
                              padding: '0'
                            }}
                            disabled={!canEditTab("2")}
                          />
                        </Tooltip>

                        {getLinkedFitasNames(fruta).slice(0, 1).map((fita, idx) => (
                          <Tag
                            key={idx}
                            size="small"
                            style={{
                              fontSize: '11px',
                              backgroundColor: fita.cor + '20',
                              borderColor: fita.cor,
                              color: '#333',
                              maxWidth: '60px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {fita.nome}
                          </Tag>
                        ))}

                        {getLinkedFitasNames(fruta).length > 1 && (
                          <Tag size="small" color="purple" style={{ fontSize: '11px' }}>
                            +{getLinkedFitasNames(fruta).length - 1}
                          </Tag>
                        )}
                      </>
                    ) : (
                      <FormButton
                        icon={<LinkOutlined />}
                        onClick={() => handleVincularFitas(fruta, indexOriginal)}
                        style={{
                          minWidth: '120px',
                          width: '120px'
                        }}
                        disabled={!canEditTab("2")}
                      >
                        {canEditTab("2") ? 'Vincular Fitas' : 'Visualizar Fitas'}
                      </FormButton>
                    )}
                  </div>
                </Col>
              )}
            </Row>
            </div>

            {ordemIndex < frutasOrdenadas.length - 1 && <Divider style={{ margin: "8px 0" }} />}
          </div>
          );
        })}
        {temBananaGlobal && <Divider style={{ margin: "16px 0" }} />}
      </Card>

      {/* Informações de Frete */}
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações de Frete</span>
          </Space>
        }
        style={{ 
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={5}>
            <Form.Item
              label={
                <Space>
                  <CalculatorOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Pesagem</span>
                </Space>
              }
            >
              <Input
                placeholder="Ex: 2500"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.pesagem}
                onChange={(e) => handleChange("pesagem", e.target.value)}
                disabled={!canEditTab("2")}
                onKeyPress={(e) => {
                  // Permitir apenas números inteiros
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={5}>
            <Form.Item
              label={
                <Space>
                  <CarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Placa Principal</span>
                </Space>
              }
            >
              <Input
                placeholder="Ex: ABC-1234"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.placaPrimaria}
                onChange={(e) => handleChange("placaPrimaria", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={5}>
            <Form.Item
              label={
                <Space>
                  <CarOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Placa Secundária</span>
                </Space>
              }
            >
              <Input
                placeholder="Ex: XYZ-5678 (reboque)"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.placaSecundaria}
                onChange={(e) => handleChange("placaSecundaria", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={9}>
            <Form.Item
              label={
                <Space>
                  <UserOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Motorista</span>
                </Space>
              }
            >
              <Input
                placeholder="Nome do motorista"
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                value={pedidoAtual.nomeMotorista}
                onChange={(e) => handleChange("nomeMotorista", e.target.value)}
                disabled={!canEditTab("2")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Seção: Mão de Obra */}
      <Card
        title={
          <Space>
            <TeamOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Mão de Obra</span>
            {/* ✅ INDICADOR DE PAGAMENTOS EFETUADOS */}
            {pedidoAtual.maoObra?.some(item => item.pagamentoEfetuado === true) && (
              <Tooltip title="Alguns registros já tiveram pagamento efetuado e estão bloqueados para edição">
                <CheckCircleOutlined style={{ color: "#ffffff", fontSize: "16px" }} />
              </Tooltip>
            )}
          </Space>
        }
        style={{
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }
        }}
      >
        <Form.List name="maoObra">
          {(fields, { add, remove }) => (
            <>
        {/* ✅ ÁREA DE SCROLL COM ALTURA MÁXIMA PARA 5 LINHAS */}
        <div style={{
          maxHeight: isMobile ? 'auto' : '480px', // ~96px por linha × 5 linhas
          overflowY: fields.length > 5 ? 'auto' : 'visible',
          marginBottom: isMobile ? '12px' : '16px',
          paddingRight: fields.length > 5 ? '8px' : '0'
        }}>
          {/* Cabeçalho das colunas - Apenas desktop */}
          {!isMobile && (
            <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
              <Col xs={24} md={4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  Turma de Colheita
                </span>
              </Col>
              <Col xs={24} md={4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <AppleOutlined style={{ marginRight: 8 }} />
                  Fruta Colhida
                </span>
              </Col>
              <Col xs={24} md={3}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Quantidade
                </span>
              </Col>
              <Col xs={24} md={3}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <DollarOutlined style={{ marginRight: 8 }} />
                  Valor Unit.
                </span>
              </Col>
              <Col xs={24} md={3}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Valor Total
                </span>
              </Col>
              <Col xs={24} md={4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Observações
                </span>
              </Col>
              <Col xs={24} md={3}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  Ações
                </span>
              </Col>
            </Row>
          )}

          {fields.map((field, index) => {
            const item = form.getFieldValue('maoObra')?.[index];
            const pagamentoEfetuado = item?.pagamentoEfetuado === true;
            return (
              <MaoObraRow
                key={field.key}
                field={field}
                index={index}
                form={form}
                isMobile={isMobile}
                turmasColheita={turmasColheita}
                loadingTurmas={loadingTurmas} // ✅ NOVO: Passar estado de loading
                pedido={{ frutasPedidos: pedidoAtual.frutas }}
                fieldsLength={fields.length}
                onRemove={(name) => remove(name)}
                onAdd={(initialValue) => add(initialValue)}
                capitalizeName={capitalizeName}
              />
            );
          })}
        </div>

        {/* 📊 RESUMO FIXO DA MÃO DE OBRA */}
        <ResumoMaoObra form={form} isMobile={isMobile} pedido={{ frutasPedidos: pedidoAtual.frutas }} />
        </>
        )}
        </Form.List>
      </Card>
      
      {canEditTab("2") && (
        <div style={{ 
          position: "absolute", 
          bottom: "-14px", 
          left: 0, 
          right: 0,
          display: "flex", 
          justifyContent: "flex-end", 
          gap: 12, 
          padding: "16px 0", 
          borderTop: "1px solid #e8e8e8",
          backgroundColor: "#ffffff",
          zIndex: 1
        }}>
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            disabled={loading || isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => {
              const formValues = form.getFieldsValue();
              const maoObraPadronizada = normalizarListaMaoObra(formValues.maoObra || []);

              // ✅ NOVA VALIDAÇÃO: Validar mão de obra antes de salvar
              const maoObraValida = maoObraPadronizada.filter(item => {
                // Verificar se pelo menos um campo não-obrigatório foi preenchido (exceto observações)
                const temAlgumCampo = item.turmaColheitaId ||
                                      item.frutaId ||
                                      item.quantidadeColhida ||
                                      item.unidadeMedida ||
                                      item.valorColheita;
                return temAlgumCampo;
              }) || [];

              // ✅ VALIDAR DUPLICAÇÃO DE COLHEITADORES
              const turmasColheitaIds = maoObraValida.map(item => item.turmaColheitaId).filter(Boolean);
              const turmasUnicas = new Set(turmasColheitaIds);
              if (turmasColheitaIds.length !== turmasUnicas.size) {
                const duplicatas = [];
                turmasColheitaIds.forEach(id => {
                  const ocorrencias = turmasColheitaIds.filter(tid => tid === id).length;
                  if (ocorrencias > 1) {
                    const nomeColhedor = turmasColheita.find(t => t.id === id)?.nomeColhedor || 'Colhedor';
                    if (!duplicatas.includes(nomeColhedor)) {
                      duplicatas.push(nomeColhedor);
                    }
                  }
                });
                showNotification("error", "Colheitadores Duplicados", `Os seguintes colheitadores estão duplicados: ${duplicatas.join(', ')}`);
                return;
              }

              for (let i = 0; i < maoObraValida.length; i++) {
                const item = maoObraValida[i];

                // Se qualquer campo foi preenchido, todos os obrigatórios devem estar preenchidos
                // Nota: unidadeMedida será derivada da fruta, então não é mais obrigatória
                const camposObrigatorios = ['turmaColheitaId', 'frutaId', 'quantidadeColhida', 'valorColheita'];
                const camposFaltando = camposObrigatorios.filter(campo => !item[campo]);

                if (camposFaltando.length > 0) {
                  const nomesCampos = {
                    'turmaColheitaId': 'Turma de Colheita',
                    'frutaId': 'Fruta',
                    'quantidadeColhida': 'Quantidade Colhida',
                    'valorColheita': 'Valor da Colheita'
                  };
                  const camposFaltandoNomes = camposFaltando.map(campo => nomesCampos[campo]).join(', ');
                  showNotification("error", "Erro", `Mão de obra ${i + 1}: Campos obrigatórios não preenchidos: ${camposFaltandoNomes}`);
                  return;
                }

                // Validar se quantidade é maior que zero
                if (item.quantidadeColhida && item.quantidadeColhida <= 0) {
                  showNotification("error", "Erro", `Mão de obra ${i + 1}: Quantidade deve ser maior que zero`);
                  return;
                }

                // Validar se valor é positivo (se preenchido)
                if (item.valorColheita && item.valorColheita <= 0) {
                  showNotification("error", "Erro", `Mão de obra ${i + 1}: Valor deve ser maior que zero`);
                  return;
                }
                if (item.valorColheita === undefined || item.valorColheita === null) {
                  showNotification("error", "Erro", `Mão de obra ${i + 1}: Informe o valor da colheita`);
                  return;
                }
              }

              // ✅ VALIDAÇÃO DE INCONSISTÊNCIAS: Comparar quantidades informadas com soma das áreas
              const inconsistencias = validarInconsistenciasQuantidades(pedidoAtual.frutas || []);

              if (inconsistencias.length > 0) {
                // Armazenar dados para confirmação
                setInconsistenciasData(inconsistencias);
                setConfirmInconsistenciaOpen(true);
                return; // Parar execução e aguardar confirmação do usuário
              }

              // ✅ NORMALIZAR dados antes de validar e salvar
              const pedidoComMaoObraNormalizada = {
                ...pedidoAtual,
                maoObra: maoObraPadronizada
              };
              const pedidoNormalizado = normalizarDadosParaBackend(pedidoComMaoObraNormalizada);

              // ✅ VALIDAÇÃO GLOBAL de fitas antes de salvar
              try {
                const resultadoValidacao = validarFitasCompleto(
                  pedidoNormalizado.frutas || [],
                  fitasComAreasDisponiveis,
                  dadosOriginaisBanco?.frutas || [], // Dados originais do banco para modo edição
                  true // ColheitaTab sempre é modo edição
                );

                if (!resultadoValidacao.valido) {
                  // Mostrar primeira mensagem de erro
                  const primeiroErro = resultadoValidacao.mensagensErro?.[0] || "Conflito de estoque detectado";
                  showNotification("error", "Conflito de Estoque de Fitas", primeiroErro);
                  return;
                }

              const maoObraAtualizada = maoObraPadronizada
                .filter(item =>
                  item.quantidadeColhida && item.quantidadeColhida > 0 &&
                  item.valorColheita && item.valorColheita > 0
                )
                .map(item => {
                  let unidadeMedida = item.unidadeMedida;
                  if (!unidadeMedida || !['KG', 'CX', 'TON', 'UND', 'ML', 'LT'].includes(unidadeMedida)) {
                    const frutaSelecionada = pedidoAtual.frutas?.find(f => f.frutaId === item.frutaId);
                    const usarUnidadeSecundaria = item.usarUnidadeSecundaria === true;
                    const unidadeBase = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
                      ? frutaSelecionada.unidadeMedida2
                      : (frutaSelecionada?.unidadeMedida1 || 'KG');
                    const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
                    const unidadeEncontrada = unidadesValidas.find(u => unidadeBase?.includes(u));
                    unidadeMedida = unidadeEncontrada || 'KG';
                  }

                  return {
                    ...item,
                    unidadeMedida
                  };
                });
                
                // Atualizar pedidoNormalizado com dados do form
                pedidoNormalizado.maoObra = maoObraAtualizada;
                
                // Atualizar pedidoAtual (para outros usos)
                setPedidoAtual({
                  ...pedidoNormalizado,
                  maoObra: maoObraAtualizada
                });
                
                // ✅ SIMPLIFICADO: Passar dados diretamente para onSave (não depender do estado React)
                setTimeout(() => {
                  onSave(maoObraAtualizada);
                }, 0);
              } catch (error) {
                console.error('Erro na validação global de fitas:', error);
                showNotification("error", "Erro", "Erro interno na validação de estoque. Tente novamente.");
              }
            }}
            loading={isSaving}
            size="large"
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
          >
            {isSaving ? "Salvando..." : "Atualizar Pedido"}
          </Button>
        </div>
        )}
      </Form>

      {/* Modal de Vincular Áreas */}
      <VincularAreasModal
        open={vincularAreasModalOpen}
        onClose={() => {
          setVincularAreasModalOpen(false);
          setFrutaSelecionada(null);
        }}
        fruta={frutaSelecionada}
        onSave={handleSalvarAreas}
        loading={false}
      />

      {/* Modal de Vincular Fitas */}
      <VincularFitasModal
        open={vincularFitasModalOpen}
        onClose={() => {
          setVincularFitasModalOpen(false);
          setFrutaSelecionada(null);
        }}
        fruta={frutaSelecionada}
        onSave={handleSalvarFitas}
        loading={false}
        todasFrutasPedido={pedidoAtual.frutas || []}
        fitasOriginaisTodasFrutas={dadosOriginaisBanco?.frutas || []}
      />

      {/* ✅ MODAL DE CONFIRMAÇÃO: Inconsistências de quantidades */}
      <ConfirmActionModal
        open={confirmInconsistenciaOpen}
        onConfirm={handleConfirmarInconsistencias}
        onCancel={() => {
          setConfirmInconsistenciaOpen(false);
          setInconsistenciasData(null);
        }}
        title="Inconsistências Detectadas"
        confirmText="Sim, Salvar Mesmo Assim"
        cancelText="Cancelar"
        confirmButtonDanger={false}
        icon={<ExclamationCircleOutlined />}
        iconColor="#fa8c16"
        customContent={
          inconsistenciasData && (
            <div style={{ padding: "12px" }}>
              <Text strong style={{ fontSize: "16px", color: "#fa8c16", display: "block", marginBottom: "16px" }}>
                As quantidades informadas não coincidem com as quantidades das áreas vinculadas:
              </Text>

              {inconsistenciasData.map((inconsistencia, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    marginBottom: "12px",
                    backgroundColor: "#fff7e6",
                    borderColor: "#ffa940"
                  }}
                >
                  <Text strong style={{ fontSize: "14px", color: "#333", display: "block", marginBottom: "8px" }}>
                    {inconsistencia.nomeFruta}
                  </Text>

                  {inconsistencia.temInconsistenciaUnd1 && (
                    <div style={{ marginBottom: "6px" }}>
                      <Text style={{ fontSize: "13px" }}>
                        <span style={{ color: "#666" }}>• {inconsistencia.unidadeMedida1}:</span>{" "}
                        <span style={{ color: "#1890ff", fontWeight: "600" }}>
                          {Math.round(inconsistencia.quantidadeReal).toLocaleString('pt-BR')}
                        </span>
                        {" → "}
                        <span style={{ color: "#52c41a", fontWeight: "600" }}>
                          {Math.round(inconsistencia.somaUnidade1).toLocaleString('pt-BR')}
                        </span>
                        {" (soma das áreas)"}
                      </Text>
                    </div>
                  )}

                  {inconsistencia.temInconsistenciaUnd2 && inconsistencia.unidadeMedida2 && (
                    <div>
                      <Text style={{ fontSize: "13px" }}>
                        <span style={{ color: "#666" }}>• {inconsistencia.unidadeMedida2}:</span>{" "}
                        <span style={{ color: "#1890ff", fontWeight: "600" }}>
                          {Math.round(inconsistencia.quantidadeReal2).toLocaleString('pt-BR')}
                        </span>
                        {" → "}
                        <span style={{ color: "#52c41a", fontWeight: "600" }}>
                          {Math.round(inconsistencia.somaUnidade2).toLocaleString('pt-BR')}
                        </span>
                        {" (soma das áreas)"}
                      </Text>
                    </div>
                  )}
                </Card>
              ))}

              <Text style={{ fontSize: "13px", color: "#666", display: "block", marginTop: "16px", fontStyle: "italic" }}>
                Deseja continuar e salvar mesmo com essas diferenças?
              </Text>
            </div>
          )
        }
      />

    </div>
  );
};

ColheitaTab.propTypes = {
  pedidoAtual: PropTypes.object.isRequired,
  setPedidoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  canEditTab: PropTypes.func.isRequired,
  frutas: PropTypes.array.isRequired,
  areasProprias: PropTypes.array.isRequired,
  areasFornecedores: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isSaving: PropTypes.bool,
  dadosOriginaisBanco: PropTypes.object, // ✅ NOVO: Dados originais imutáveis do banco
  todasFrutasPedido: PropTypes.array, // ✅ NOVA PROP: Para validação global
  fitasOriginaisTodasFrutas: PropTypes.array, // ✅ NOVA PROP: Para validação global
};

export default ColheitaTab;
