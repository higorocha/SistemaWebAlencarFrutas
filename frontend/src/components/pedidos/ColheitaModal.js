// src/components/pedidos/ColheitaModal.js

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Space, message, Form, Input, Select, DatePicker, InputNumber, Row, Col, Typography, Card, Divider, Tag, Tooltip } from "antd";
import PropTypes from "prop-types";
import useResponsive from "../../hooks/useResponsive";
import {
  SaveOutlined,
  CloseOutlined,
  ShoppingOutlined,
  AppleOutlined,
  CalendarOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined,
  LinkOutlined,
  TagOutlined,
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { showNotification } from "../../config/notificationConfig";
import useNotificationWithContext from "../../hooks/useNotificationWithContext";
import { capitalizeName } from "../../utils/formatters";
import moment from "moment";
import axiosInstance from "../../api/axiosConfig";
import { MonetaryInput, MaskedDatePicker } from "../../components/common/inputs";
import { FormButton } from "../common/buttons";
import VincularAreasModal from "./VincularAreasModal";
import VincularFitasModal from "./VincularFitasModal";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import { validarFitasCompleto } from "../../utils/fitasValidation";
import { MaoObraRow } from './componentesColheita';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Componente de Resumo com atualização em tempo real
const ResumoMaoObra = ({ form, isMobile, pedido }) => {
  // ✅ Monitorar mudanças em tempo real
  const maoObraAtual = Form.useWatch('maoObra', form) || [];

  // Filtrar apenas itens válidos (com todos os campos preenchidos)
  const maoObraValida = maoObraAtual.filter(item =>
    item && item.turmaColheitaId && item.quantidadeColhida && item.valorColheita
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

const ColheitaModal = ({
  open,
  onClose,
  onSave,
  onSaveComplete, // ✅ Callback chamado APÓS salvar colheita + mão de obra
  pedido,
  loading,
  onLoadingChange, // Callback para controlar CentralizedLoader
}) => {
  const [form] = Form.useForm();
  const { isMobile } = useResponsive();

  // Hook para notificações com z-index correto
  const { error, warning, success, contextHolder } = useNotificationWithContext();
  const [isSaving, setIsSaving] = useState(false);
  const [areasProprias, setAreasProprias] = useState([]);
  const [areasFornecedores, setAreasFornecedores] = useState([]);
  const [fitasBanana, setFitasBanana] = useState([]);
  const [modoAreaFruta, setModoAreaFruta] = useState({});
  const [selectAberto, setSelectAberto] = useState({});
  
  // Estados para os modais de vinculação
  const [vincularAreasModalOpen, setVincularAreasModalOpen] = useState(false);
  const [vincularFitasModalOpen, setVincularFitasModalOpen] = useState(false);
  const [frutaSelecionada, setFrutaSelecionada] = useState(null);

  // ✅ NOVOS ESTADOS: Para validação de inconsistências de quantidades
  const [confirmInconsistenciaOpen, setConfirmInconsistenciaOpen] = useState(false);
  const [inconsistenciasData, setInconsistenciasData] = useState(null);
  const [valoresPendentes, setValoresPendentes] = useState(null);

  // ✅ NOVOS ESTADOS: Para validação global de fitas
  const [fitasComAreasDisponiveis, setFitasComAreasDisponiveis] = useState([]);

  // Estados para mão de obra
  const [turmasColheita, setTurmasColheita] = useState([]);

  // ✅ Preparar estrutura de áreas disponíveis para os modais
  const areasDisponiveis = React.useMemo(() => {
    return {
      areasProprias: areasProprias || [],
      areasFornecedores: areasFornecedores || []
    };
  }, [areasProprias, areasFornecedores]);

  // ✅ Preparar mapa de fornecedores com suas áreas para os modais
  const fornecedoresAreasMap = React.useMemo(() => {
    const map = {};
    (areasFornecedores || []).forEach(area => {
      if (area.fornecedorId) {
        if (!map[area.fornecedorId]) {
          map[area.fornecedorId] = {
            fornecedor: area.fornecedor,
            areas: []
          };
        }
        map[area.fornecedorId].areas.push(area);
      }
    });
    return map;
  }, [areasFornecedores]);

  const frutasPedidoMeta = useMemo(() => {
    const porFrutaPedidoId = {};
    const culturaInfo = {};

    (pedido?.frutasPedidos || []).forEach((frutaPedido) => {
      const culturaId = frutaPedido.fruta?.cultura?.id ?? null;
      const culturaDescricao = frutaPedido.fruta?.cultura?.descricao ?? "";
      const dePrimeira = frutaPedido.fruta?.dePrimeira ?? false;
      const nome = frutaPedido.fruta?.nome ?? "";

      porFrutaPedidoId[frutaPedido.id] = {
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
  }, [pedido?.frutasPedidos]);

  const frutasPedidoInfo = frutasPedidoMeta.porFrutaPedidoId;
  const culturaInfoPorId = frutasPedidoMeta.culturaInfo;

  // Carregar áreas próprias, de fornecedores e fitas de banana
  useEffect(() => {
    const fetchDados = async () => {
      try {
                 // Buscar áreas próprias
         const responseAreas = await axiosInstance.get("/api/areas-agricolas");
         setAreasProprias(responseAreas.data || []);

                 // Buscar áreas de fornecedores
         const responseAreasFornecedores = await axiosInstance.get("/api/areas-fornecedores");
         setAreasFornecedores(responseAreasFornecedores.data || []);

         // Buscar fitas de banana
         const responseFitas = await axiosInstance.get("/fitas-banana");
         setFitasBanana(responseFitas.data || []);

         // ✅ NOVO: Buscar fitas com áreas para validação global
         const responseFitasComAreas = await axiosInstance.get("/controle-banana/fitas-com-areas");
         setFitasComAreasDisponiveis(responseFitasComAreas.data || []);

         // Buscar turmas de colheita
         const responseTurmas = await axiosInstance.get("/api/turma-colheita");
         setTurmasColheita(responseTurmas.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        error("Erro", "Erro ao carregar dados necessários");
      }
    };

    if (open) {
      fetchDados();
    }
  }, [open]);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {

      // Preparar dados das frutas para o formulário
      const frutasForm = pedido.frutasPedidos?.map(fruta => ({
        frutaPedidoId: fruta.id,
        frutaId: fruta.frutaId,
        frutaNome: capitalizeName(fruta.fruta?.nome),
        fruta: fruta.fruta, // ✅ Incluir objeto fruta completo (com cultura)
        quantidadePrevista: fruta.quantidadePrevista,
        unidadeMedida1: fruta.unidadeMedida1,
        unidadeMedida2: fruta.unidadeMedida2,
        quantidadeReal: fruta.quantidadeReal || undefined,
        quantidadeReal2: fruta.quantidadeReal2 || undefined,
        // NOVA ESTRUTURA: Arrays de áreas e fitas
        // Filtrar apenas áreas reais (com IDs), removendo placeholders
        areas: fruta.areas?.length > 0 ? fruta.areas
          .filter(area => area.areaPropriaId || area.areaFornecedorId) // Remove placeholders
          .map(area => ({
            id: area.id,
            areaPropriaId: area.areaPropriaId || undefined,
            areaFornecedorId: area.areaFornecedorId || undefined,
            observacoes: area.observacoes || '',
            // ✅ CORREÇÃO: Incluir quantidades colhidas das áreas
            quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || undefined,
            quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || undefined
          })) : [], // Array vazio se não há áreas reais
        fitas: fruta.fitas?.length > 0 ? fruta.fitas.map(fita => ({
          id: fita.id,
          fitaBananaId: fita.fitaBananaId,
          quantidadeFita: fita.quantidadeFita || undefined,
          observacoes: fita.observacoes || '',
          // ✅ MANTER detalhesAreas para reconstrução
          detalhesAreas: fita.detalhesAreas || []
        })) : []
      })) || [];

       // Garantir que a data seja um objeto moment válido
       const dataColheita = pedido.dataColheita ? moment(pedido.dataColheita) : null;

       form.setFieldsValue({
         dataColheita: dataColheita,
         observacoesColheita: pedido.observacoesColheita || '',
         frutas: frutasForm,
        // Campos de frete
        pesagem: pedido.pesagem || '',
        placaPrimaria: pedido.placaPrimaria || '',
        placaSecundaria: pedido.placaSecundaria || '',
        nomeMotorista: pedido.nomeMotorista || '',
        numeroNf: pedido.numeroNf || undefined,
        // ✅ Mão de obra: carregar dados existentes ou inicializar vazio
        maoObra: pedido.maoObra && pedido.maoObra.length > 0
          ? pedido.maoObra.map(item => {
              // ✅ CORREÇÃO: Calcular valorUnitario a partir de valorColheita / quantidadeColhida
              // ✅ Arredondar para 4 casas decimais (igual ao decimalScale do input)
              const quantidadeColhida = parseFloat(item.quantidadeColhida) || 0;
              const valorColheita = parseFloat(item.valorColheita) || 0;
              const valorUnitario = quantidadeColhida > 0 
                ? Number((valorColheita / quantidadeColhida).toFixed(4)) 
                : undefined;
              
              return {
                id: item.id,
                turmaColheitaId: item.turmaColheitaId,
                frutaId: item.frutaPedidoId || item.frutaId,
                quantidadeColhida: item.quantidadeColhida,
                valorUnitario: valorUnitario, // ✅ Valor calculado
                valorColheita: item.valorColheita,
                observacoes: item.observacoes || ''
              };
            })
          : [{
              turmaColheitaId: undefined,
              frutaId: undefined,
              quantidadeColhida: undefined,
              valorUnitario: undefined,
              valorColheita: undefined,
              observacoes: ''
            }]
       });
    } else if (open) {
      form.resetFields();
    }
  }, [open, pedido, form]);

  const coresFita = [
    { value: 'Verde', label: 'Verde', color: '#52c41a' },
    { value: 'Azul', label: 'Azul', color: '#1890ff' },
    { value: 'Vermelho', label: 'Vermelho', color: '#ff4d4f' },
    { value: 'Amarelo', label: 'Amarelo', color: '#faad14' },
    { value: 'Laranja', label: 'Laranja', color: '#fa8c16' },
    { value: 'Rosa', label: 'Rosa', color: '#eb2f96' },
    { value: 'Roxo', label: 'Roxo', color: '#722ed1' },
    { value: 'Marrom', label: 'Marrom', color: '#8c8c8c' },
    { value: 'Preto', label: 'Preto', color: '#262626' },
    { value: 'Branco', label: 'Branco', color: '#f0f0f0' },
  ];

  // Funções para abrir modais de vinculação
  const handleVincularAreas = (fruta, frutaIndex) => {
    // ✅ CORREÇÃO: Pegar valores atuais do formulário para passar para o modal
    const valoresAtuais = form.getFieldsValue();
    const frutaAtual = valoresAtuais.frutas?.[frutaIndex];
    const frutaMeta = frutaAtual?.frutaPedidoId ? frutasPedidoInfo[frutaAtual.frutaPedidoId] : undefined;
    const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
      ? culturaInfoPorId[frutaMeta.culturaId]
      : undefined;
    const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

    const frutasAtuais = valoresAtuais.frutas || [];
    const frutasDoGrupo = frutasAtuais
      .map((frutaItem) => {
        const metaItem = frutaItem?.frutaPedidoId ? frutasPedidoInfo[frutaItem.frutaPedidoId] : undefined;
        if (!metaItem || metaItem.culturaId !== frutaMeta?.culturaId) {
          return null;
        }

        return {
          frutaPedidoId: frutaItem.frutaPedidoId,
          quantidadeReal: frutaItem.quantidadeReal,
          quantidadeReal2: frutaItem.quantidadeReal2,
          unidadeMedida1: frutaItem.unidadeMedida1,
          unidadeMedida2: frutaItem.unidadeMedida2,
          dePrimeira: metaItem.dePrimeira ?? false,
          nome: capitalizeName(frutaItem.frutaNome || frutaItem.fruta?.nome || metaItem?.nome || ""),
        };
      })
      .filter(Boolean);

    if (herdaVinculosDaPrimeira) {
      const frutaPrimeiraNome = culturaInfo?.frutaPrimeiraNome || "fruta de primeira";
      warning(
        "Vinculação bloqueada",
        `As áreas de "${frutaMeta?.nome || frutaAtual?.frutaNome || "esta fruta"}" são herdadas da ${frutaPrimeiraNome} desta cultura. Ajuste as áreas diretamente na fruta de primeira.`,
      );
      return;
    }

    const frutaCompleta = {
      ...frutaAtual,
      index: frutaIndex,
      // ✅ Incluir valores atuais do formulário
      quantidadeReal: frutaAtual?.quantidadeReal,
      quantidadeReal2: frutaAtual?.quantidadeReal2,
      unidadeMedida1: fruta.unidadeMedida1,
      unidadeMedida2: fruta.unidadeMedida2,
      dePrimeira: frutaMeta?.dePrimeira ?? false,
      culturaId: frutaMeta?.culturaId ?? null,
      culturaDescricao: frutaMeta?.culturaDescricao ?? "",
      herdaVinculos: herdaVinculosDaPrimeira,
      frutasDoGrupo,
    };
    
    
    setFrutaSelecionada(frutaCompleta);
    setVincularAreasModalOpen(true);
  };

  // ✅ NOVO: Função para calcular estoque consumido por outras frutas do pedido
  const calcularEstoqueConsumidoPorOutrasFrutas = (frutaIndexAtual) => {
    const valoresAtuais = form.getFieldsValue();
    const frutasAtuais = valoresAtuais.frutas || [];

    const estoqueConsumido = {};

    // Percorrer todas as frutas EXCETO a atual
    frutasAtuais.forEach((fruta, index) => {
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

    console.log('🎯 Estoque consumido por outras frutas:', estoqueConsumido);
    return estoqueConsumido;
  };

  const handleVincularFitas = (fruta, frutaIndex) => {
    const valoresAtuais = form.getFieldsValue();
    const frutaAtual = valoresAtuais.frutas?.[frutaIndex];
    const frutaMeta = frutaAtual?.frutaPedidoId ? frutasPedidoInfo[frutaAtual.frutaPedidoId] : undefined;
    const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
      ? culturaInfoPorId[frutaMeta.culturaId]
      : undefined;
    const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

    if (herdaVinculosDaPrimeira) {
      const frutaPrimeiraNome = culturaInfo?.frutaPrimeiraNome || "fruta de primeira";
      warning(
        "Vinculação bloqueada",
        `As fitas de "${frutaMeta?.nome || frutaAtual?.frutaNome || "esta fruta"}" são herdadas da ${frutaPrimeiraNome} desta cultura. Vincule fitas diretamente na fruta de primeira.`,
      );
      return;
    }

    // Verificar se a fruta tem áreas vinculadas antes de abrir o modal
    if (!hasLinkedAreas(frutaAtual, herdaVinculosDaPrimeira)) {
      warning("Áreas Necessárias", "Você deve vincular áreas à fruta antes de vincular fitas. As fitas são específicas para cada área.");
      return;
    }

    // ✅ NOVO: Calcular estoque consumido por outras frutas
    const estoqueConsumido = calcularEstoqueConsumidoPorOutrasFrutas(frutaIndex);

    // ✅ NOVO: Pegar todas as frutas do formulário para validação global
    const todasFrutas = valoresAtuais.frutas || [];

    setFrutaSelecionada({
      ...frutaAtual,
      index: frutaIndex,
      dePrimeira: frutaMeta?.dePrimeira ?? false,
      culturaId: frutaMeta?.culturaId ?? null,
      culturaDescricao: frutaMeta?.culturaDescricao ?? "",
      herdaVinculos: false,
      // ✅ NOVO: Adicionar dados para controle de estoque virtual
      estoqueConsumidoPorOutrasFrutas: estoqueConsumido,
      todasFrutasPedido: todasFrutas,
      // ✅ CORREÇÃO: No ColheitaModal (nova colheita), fitas originais do banco são VAZIAS
      // Isso garante que o estoque virtual use array vazio em vez de fruta.fitas (state atual)
      fitasOriginaisBanco: []
    });
    setVincularFitasModalOpen(true);
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

  // ✅ NOVA FUNÇÃO: Validar inconsistências entre quantidades informadas e áreas considerando agrupamentos por cultura
  const validarInconsistenciasQuantidades = (frutas) => {
    const inconsistencias = [];
    const gruposPorCultura = {};

    frutas.forEach((fruta, index) => {
      const frutaMeta = fruta?.frutaPedidoId ? frutasPedidoInfo[fruta.frutaPedidoId] : undefined;
      const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
        ? culturaInfoPorId[frutaMeta.culturaId]
        : undefined;
      const hasPrimeiraNaCultura = !!culturaInfo?.hasPrimeira;
      const herdaVinculosDaPrimeira = hasPrimeiraNaCultura && frutaMeta && !frutaMeta.dePrimeira;
      const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${index + 1}`;

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

  // Função para fechar modal de áreas
  const handleFecharVincularAreas = () => {
    setVincularAreasModalOpen(false);
    setFrutaSelecionada(null);
  };

  // Função para fechar modal de fitas
  const handleFecharVincularFitas = () => {
    setVincularFitasModalOpen(false);
    setFrutaSelecionada(null);
  };

  // Função para salvar áreas vinculadas
  const handleSalvarAreas = (areas) => {
    if (!frutaSelecionada) return;
    if (frutaSelecionada?.herdaVinculos) {
      warning(
        "Ação não permitida",
        "Esta fruta herda as áreas da fruta de primeira da cultura. Ajuste as áreas diretamente na fruta de primeira.",
      );
      return;
    }
    
    // ✅ NOVA FUNCIONALIDADE: Calcular soma das quantidades por área
    const somaUnidade1 = areas?.reduce((sum, area) => 
      sum + (area.quantidadeColhidaUnidade1 || 0), 0) || 0;
    const somaUnidade2 = areas?.reduce((sum, area) => 
      sum + (area.quantidadeColhidaUnidade2 || 0), 0) || 0;
    
    // ✅ REMOVIDA VALIDAÇÃO DUPLICADA: VincularAreasModal já faz a validação
    // Aplicar sincronização diretamente
    aplicarSincronizacao(areas, somaUnidade1, somaUnidade2);
  };

  // ✅ FUNÇÃO PARA APLICAR SINCRONIZAÇÃO
  const aplicarSincronizacao = (areas, somaUnidade1, somaUnidade2, frutaIndex = null) => {
    // Usar o índice fornecido ou o índice da fruta selecionada
    const indexToUpdate = frutaIndex !== null ? frutaIndex : frutaSelecionada?.index;
    
    if (indexToUpdate === null || indexToUpdate === undefined) {
      console.error('Erro: Índice da fruta não encontrado');
      return;
    }
    
    // Atualizar formulário com novas áreas
    const frutasAtuais = form.getFieldValue('frutas') || [];
    let deveAtualizarQuantidades = true;
    const frutasAtualizadas = frutasAtuais.map((fruta, index) => {
      if (index === indexToUpdate) {
        const frutaMeta = fruta?.frutaPedidoId ? frutasPedidoInfo[fruta.frutaPedidoId] : undefined;
        const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
          ? culturaInfoPorId[frutaMeta.culturaId]
          : undefined;
        const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

        const possuiSegundas = frutasAtuais.some((item, idxItem) => {
          if (idxItem === index) {
            return false;
          }
          const metaItem = item?.frutaPedidoId ? frutasPedidoInfo[item.frutaPedidoId] : undefined;
          return metaItem && metaItem.culturaId === frutaMeta?.culturaId && !metaItem.dePrimeira;
        });
        const estaAgrupado = frutaMeta?.dePrimeira && possuiSegundas;

        if (herdaVinculosDaPrimeira) {
          return {
            ...fruta,
            areas: [],
          };
        }
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

        const quantidadeRealAtualizada = estaAgrupado ? fruta.quantidadeReal : somaUnidade1;
        const quantidadeReal2Atualizada = estaAgrupado ? fruta.quantidadeReal2 : (somaUnidade2 > 0 ? somaUnidade2 : null);

        const frutaAtualizada = {
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

        if (estaAgrupado) {
          deveAtualizarQuantidades = false;
        }

        return frutaAtualizada;
      }
      return fruta;
    });

    form.setFieldsValue({ frutas: frutasAtualizadas });

    if (deveAtualizarQuantidades) {
      const updates = {};
      updates[['frutas', indexToUpdate, 'quantidadeReal']] = somaUnidade1;
      updates[['frutas', indexToUpdate, 'quantidadeReal2']] = somaUnidade2 > 0 ? somaUnidade2 : null;
      form.setFieldsValue(updates);
    }

    success("Sucesso", "Áreas vinculadas e quantidades sincronizadas com sucesso!");
  };


  // Função para salvar fitas vinculadas
  const handleSalvarFitas = (fitas) => {
    if (!frutaSelecionada) return;
    if (frutaSelecionada?.herdaVinculos) {
      warning(
        "Ação não permitida",
        "Esta fruta herda as fitas da fruta de primeira da cultura. Ajuste as fitas diretamente na fruta de primeira.",
      );
      return;
    }
    
    // Atualizar formulário com novas fitas
    const frutasAtuais = form.getFieldValue('frutas') || [];
    const frutasAtualizadas = frutasAtuais.map((fruta, index) => {
      if (index === frutaSelecionada.index) {
        return {
          ...fruta,
          fitas: fitas
        };
      }
      return fruta;
    });

    form.setFieldsValue({ frutas: frutasAtualizadas });
    success("Sucesso", "Fitas vinculadas com sucesso!");
  };

  // ✅ FUNÇÃO para processar salvamento após confirmação de inconsistências
  const handleConfirmarInconsistencias = async () => {
    setConfirmInconsistenciaOpen(false);

    if (!valoresPendentes) return;

    // Continuar o fluxo de salvamento a partir do ponto onde parou
    try {
      setIsSaving(true);

      const values = valoresPendentes;

      // ✅ CONTINUAR com validação de fitas (pulando a validação de inconsistências)
      try {
        const resultadoValidacao = validarFitasCompleto(
          values.frutas,
          fitasComAreasDisponiveis,
          [], // ColheitaModal não tem dados originais do banco
          false // ColheitaModal sempre é modo criação
        );

        if (!resultadoValidacao.valido) {
          // Mostrar primeira mensagem de erro
          const primeiroErro = resultadoValidacao.mensagensErro?.[0] || "Conflito de estoque detectado";
          error("Conflito de Estoque de Fitas", primeiroErro);
          setIsSaving(false);
          return;
        }
      } catch (err) {
        console.error('Erro ao validar fitas:', err);
        error("Erro", "Erro ao validar estoque de fitas. Tente novamente.");
        setIsSaving(false);
        return;
      }

      // Processar mão de obra
      const maoObraValida = [];
      if (values.maoObra && Array.isArray(values.maoObra)) {
        for (let i = 0; i < values.maoObra.length; i++) {
          const item = values.maoObra[i];
          if (item.turmaColheitaId && item.frutaId && item.quantidadeColhida && item.valorColheita) {
            // Obter a unidade da fruta selecionada (usando toggle se disponível)
            const frutaSelecionada = pedido?.frutasPedidos?.find(fp => fp.frutaId === item.frutaId);
            const usarUnidadeSecundaria = item.usarUnidadeSecundaria === true;
            const unidadeBase = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
              ? frutaSelecionada.unidadeMedida2
              : (frutaSelecionada?.unidadeMedida1 || 'KG');
            
            // ✅ GARANTIR que a unidade é um valor válido do enum (KG, CX, TON, UND, ML, LT)
            // Se vier com texto adicional, extrair apenas a sigla
            const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
            const unidadeEncontrada = unidadesValidas.find(u => unidadeBase.includes(u));
            const unidadeMedida = unidadeEncontrada || 'KG'; // Default para KG se não encontrar
            
            maoObraValida.push({
              turmaColheitaId: item.turmaColheitaId,
              frutaId: item.frutaId,
              quantidadeColhida: Number(item.quantidadeColhida),
              unidadeMedida: unidadeMedida,
              valorColheita: Number(item.valorColheita),
              observacoes: item.observacoes || ''
            });
          }
        }
      }

      // ✅ FILTRAR: Enviar apenas frutas que estão sendo colhidas (com quantidadeReal > 0)
      const frutasSendoColhidas = values.frutas.filter(fruta => {
        const quantidadeReal = typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal;
        return quantidadeReal && quantidadeReal > 0;
      });

      // Preparar dados para envio (MESMO FORMATO do handleSalvarColheita)
      const formData = {
        dataColheita: values.dataColheita.startOf('day').add(12, 'hours').toISOString(),
        observacoesColheita: values.observacoesColheita,
        frutas: frutasSendoColhidas.map(fruta => {
          const frutaMeta = fruta?.frutaPedidoId ? frutasPedidoInfo[fruta.frutaPedidoId] : undefined;
          const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
            ? culturaInfoPorId[frutaMeta.culturaId]
            : undefined;
          const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

          const areasProcessadas = herdaVinculosDaPrimeira
            ? []
            : (fruta.areas?.filter(area => area.areaPropriaId || area.areaFornecedorId).map(area => ({
                id: area.id,
                areaPropriaId: area.areaPropriaId || undefined,
                areaFornecedorId: area.areaFornecedorId || undefined,
                observacoes: area.observacoes || '',
                quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
              })) || []);

          const fitasProcessadas = herdaVinculosDaPrimeira
            ? []
            : (fruta.fitas?.filter(fita => fita.fitaBananaId).map(fita => ({
                id: fita.id,
                fitaBananaId: fita.fitaBananaId,
                quantidadeFita: fita.quantidadeFita || undefined,
                observacoes: fita.observacoes || '',
                detalhesAreas: fita.detalhesAreas || []
              })) || []);

          return {
            frutaPedidoId: fruta.frutaPedidoId,
            // ✅ CORREÇÃO: Remover frutaId, unidadeMedida1, unidadeMedida2 (não aceitos pelo DTO)
            quantidadeReal: typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal,
            quantidadeReal2: typeof fruta.quantidadeReal2 === 'string' ? parseFloat(fruta.quantidadeReal2) : fruta.quantidadeReal2,
            areas: areasProcessadas,
            fitas: fitasProcessadas,
          };
        }),
        pesagem: values.pesagem ? String(values.pesagem) : values.pesagem,
        placaPrimaria: values.placaPrimaria,
        placaSecundaria: values.placaSecundaria,
        nomeMotorista: values.nomeMotorista,
        numeroNf: values.numeroNf,
        // ✅ NOVO: Mão de obra agora salva junto com colheita (já formatada)
        maoObra: maoObraValida.length > 0 ? maoObraValida.map(item => {
          // Buscar unidadeMedida da fruta se não estiver formatado
          let unidadeMedida = item.unidadeMedida;
          if (!unidadeMedida || !['KG', 'TON', 'CX', 'UND', 'ML', 'LT'].includes(unidadeMedida)) {
            const frutaSelecionada = pedido?.frutasPedidos?.find(fp => fp.frutaId === item.frutaId);
            let unidadeCompleta = frutaSelecionada?.unidadeMedida1 || 'KG';
            const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
            const unidadeEncontrada = unidadesValidas.find(u => unidadeCompleta.includes(u));
            unidadeMedida = unidadeEncontrada || 'KG';
          }

          // Garantir que valores sejam números
          const quantidadeColhida = typeof item.quantidadeColhida === 'string' 
            ? parseFloat(item.quantidadeColhida) 
            : Number(item.quantidadeColhida) || 0;
          const valorColheita = typeof item.valorColheita === 'string'
            ? parseFloat(item.valorColheita)
            : Number(item.valorColheita) || 0;

          return {
            turmaColheitaId: Number(item.turmaColheitaId),
            frutaId: Number(item.frutaId),
            quantidadeColhida: quantidadeColhida,
            unidadeMedida: unidadeMedida,
            valorColheita: valorColheita,
            dataColheita: values.dataColheita.startOf('day').add(12, 'hours').toISOString(),
            pagamentoEfetuado: false,
            observacoes: item.observacoes || undefined,
          };
        }) : undefined
      };

      // Fechar modal e iniciar loading
      form.resetFields();
      onClose();

      if (onLoadingChange) {
        onLoadingChange(true, "Registrando colheita...");
      }

      // ✅ AGORA: Salvar colheita e mão de obra juntos em uma única chamada
      await onSave(formData);

      // Chamar callback para finalizar (recarregar lista, etc)
      if (onSaveComplete) {
        await onSaveComplete();
      }

      // Limpar estados
      setValoresPendentes(null);
      setInconsistenciasData(null);

    } catch (err) {
      console.error('Erro ao salvar colheita:', err);
      // Em caso de erro, reabrir o modal
      onClose(false);
    } finally {
      setIsSaving(false);
      // ✅ CORREÇÃO: Garantir que loading sempre seja desligado
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  };

  const handleSalvarColheita = async (values) => {
    console.log('DEBUG: Dados da mão de obra recebidos para validação:', JSON.stringify(values.maoObra, null, 2));
    try {
      setIsSaving(true);

      // Validar se pelo menos uma fruta tem dados de colheita
      if (!values.frutas || values.frutas.length === 0) {
        error("Erro", "Nenhuma fruta encontrada para colheita");
        return;
      }

      // ✅ NOVA LÓGICA: Identificar frutas que estão sendo colhidas (têm quantidadeReal preenchida)
      const frutasSendoColhidas = values.frutas.filter(fruta => {
        const quantidadeReal = typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal;
        return quantidadeReal && quantidadeReal > 0;
      });

      // ✅ VALIDAÇÃO: Pelo menos UMA fruta deve ter quantidade colhida
      if (frutasSendoColhidas.length === 0) {
        error("Erro", "Informe a quantidade colhida de pelo menos uma fruta");
        return;
      }

      // ✅ NOVA VALIDAÇÃO: Validar dados de mão de obra com lógica mais rigorosa
      const maoObraValida = values.maoObra?.filter(item => {
        // Verificar se pelo menos um campo não-obrigatório foi preenchido (exceto observações)
        const temAlgumCampo = item.turmaColheitaId ||
                              item.frutaId ||
                              item.quantidadeColhida ||
                              item.valorColheita;
        return temAlgumCampo;
      }) || [];

      // ✅ VALIDAÇÃO CORRIGIDA: Verificar duplicação de colheitadores por turma+fruta
      // Uma mesma turma pode colher diferentes frutas no mesmo pedido
      const combinacoesUtilizadas = new Set();
      const combinacoesDuplicadas = [];

      for (let i = 0; i < maoObraValida.length; i++) {
        const item = maoObraValida[i];

        if (item.turmaColheitaId && item.frutaId) {
          // Criar chave única: turmaId + frutaId
          const chave = `${item.turmaColheitaId}-${item.frutaId}`;
          
          if (combinacoesUtilizadas.has(chave)) {
            const turmaNome = turmasColheita.find(t => t.id === item.turmaColheitaId)?.nomeColhedor || `Turma ${item.turmaColheitaId}`;
            const frutaNome = values.frutas.find(f => f.frutaId === item.frutaId)?.frutaNome || `Fruta ${item.frutaId}`;
            combinacoesDuplicadas.push(`${turmaNome} colhendo ${frutaNome}`);
          } else {
            combinacoesUtilizadas.add(chave);
          }
        }
      }

      if (combinacoesDuplicadas.length > 0) {
        error("Erro", `Combinação duplicada detectada: ${combinacoesDuplicadas.join(', ')}. Cada colheitador pode colher a mesma fruta apenas uma vez por pedido.`);
        return;
      }

      for (let i = 0; i < maoObraValida.length; i++) {
        const item = maoObraValida[i];

        // ✅ NOVA VALIDAÇÃO: Se qualquer campo foi preenchido, todos os obrigatórios devem estar preenchidos
        const camposObrigatorios = ['turmaColheitaId', 'frutaId', 'quantidadeColhida', 'valorColheita'];
        const camposFaltando = camposObrigatorios.filter(campo => !item[campo]);

        if (camposFaltando.length > 0) {
          const nomesCampos = {
            'turmaColheitaId': 'Turma de Colheita',
            'frutaId': 'Fruta Colhida',
            'quantidadeColhida': 'Quantidade Colhida',
            'valorColheita': 'Valor da Colheita'
          };
          const camposFaltandoNomes = camposFaltando.map(campo => nomesCampos[campo]).join(', ');
          error("Erro", `Mão de obra ${i + 1}: Campos obrigatórios não preenchidos: ${camposFaltandoNomes}`);
          return;
        }

        // Validar se quantidade é maior que zero
        if (item.quantidadeColhida && item.quantidadeColhida <= 0) {
          error("Erro", `Mão de obra ${i + 1}: Quantidade deve ser maior que zero`);
          return;
        }

        // Validar se valor é positivo (se preenchido)
        if (item.valorColheita && item.valorColheita <= 0) {
          error("Erro", `Mão de obra ${i + 1}: Valor deve ser maior que zero`);
          return;
        }

        // ✅ NOVA VALIDAÇÃO: Verificar se a fruta selecionada na mão de obra está sendo colhida
        const frutaDaMaoObra = frutasSendoColhidas.find(f => f.frutaId === item.frutaId);
        if (!frutaDaMaoObra) {
          const nomeFruta = values.frutas.find(f => f.frutaId === item.frutaId)?.frutaNome || 'Desconhecida';
          error("Erro", `Mão de obra ${i + 1}: A fruta "${nomeFruta}" não está sendo colhida neste momento. Só é possível registrar mão de obra para frutas que estão sendo colhidas.`);
          return;
        }
      }

      // ✅ NOVA VALIDAÇÃO: Validar apenas as frutas que estão sendo colhidas
      for (let i = 0; i < frutasSendoColhidas.length; i++) {
        const fruta = frutasSendoColhidas[i];
        const frutaMeta = fruta?.frutaPedidoId ? frutasPedidoInfo[fruta.frutaPedidoId] : undefined;
        const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
          ? culturaInfoPorId[frutaMeta.culturaId]
          : undefined;
        const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);
        const nomeFruta = frutaMeta?.nome || fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;

        if (herdaVinculosDaPrimeira) {
          const possuiAreasProprias = fruta.areas?.some(area => area.areaPropriaId || area.areaFornecedorId);
          const possuiFitas = fruta.fitas && fruta.fitas.length > 0;

          if (possuiAreasProprias) {
            error("Erro", `A fruta "${nomeFruta}" herda as áreas da fruta de primeira da cultura e não deve possuir áreas próprias vinculadas.`);
            return;
          }

          if (possuiFitas) {
            error("Erro", `A fruta "${nomeFruta}" herda as fitas da fruta de primeira da cultura e não deve possuir fitas vinculadas.`);
            return;
          }

          continue;
        }

        // NOVA VALIDAÇÃO: Verificar se pelo menos uma área REAL foi selecionada (não placeholder)
        const areasReais = fruta.areas?.filter(area =>
          area.areaPropriaId || area.areaFornecedorId
        ) || [];

        if (areasReais.length === 0) {
          error("Erro", `Adicione pelo menos uma área de origem para "${nomeFruta}"`);
          return;
        }

        // Validar cada área real individualmente
        for (let j = 0; j < areasReais.length; j++) {
          const area = areasReais[j];
          const hasAreaPropria = area.areaPropriaId !== undefined && area.areaPropriaId !== null;
          const hasAreaFornecedor = area.areaFornecedorId !== undefined && area.areaFornecedorId !== null;

          if (!hasAreaPropria && !hasAreaFornecedor) {
            error("Erro", `Fruta "${nomeFruta}", área ${j + 1}: Selecione uma área válida`);
            return;
          }

          if (hasAreaPropria && hasAreaFornecedor) {
            error("Erro", `Fruta "${nomeFruta}", área ${j + 1}: Não é possível selecionar área própria e de fornecedor simultaneamente`);
            return;
          }
        }

        // NOVA VALIDAÇÃO: Verificar se fruta é banana e tem fitas vinculadas
        const frutaNome = frutaMeta?.nome || fruta.frutaNome || fruta.fruta?.nome || '';
        const isFrutaBanana = frutaNome.toLowerCase().includes('banana');

        if (isFrutaBanana) {
          const fitasVinculadas = fruta.fitas?.filter(fita =>
            fita.fitaBananaId && fita.quantidadeFita && fita.quantidadeFita > 0
          ) || [];

          if (fitasVinculadas.length === 0) {
            error("Erro", `A fruta "${frutaNome}" é uma banana e deve ter pelo menos uma fita vinculada`);
            return;
          }
        }
      }

      // ✅ VALIDAÇÃO DE INCONSISTÊNCIAS: Comparar quantidades informadas com soma das áreas
      const inconsistencias = validarInconsistenciasQuantidades(values.frutas);

      if (inconsistencias.length > 0) {
        // Armazenar dados para confirmação
        setInconsistenciasData(inconsistencias);
        setValoresPendentes(values);
        setConfirmInconsistenciaOpen(true);
        return; // Parar execução e aguardar confirmação do usuário
      }

      // ✅ NOVA VALIDAÇÃO GLOBAL: Validar fitas considerando todas as frutas do pedido
      try {
        const resultadoValidacao = validarFitasCompleto(
          values.frutas,
          fitasComAreasDisponiveis,
          [], // ColheitaModal não tem dados originais do banco
          false // ColheitaModal sempre é modo criação
        );

        if (!resultadoValidacao.valido) {
          // Mostrar primeira mensagem de erro
          const primeiroErro = resultadoValidacao.mensagensErro?.[0] || "Conflito de estoque detectado";
          error("Conflito de Estoque de Fitas", primeiroErro);
          return;
        }
      } catch (error) {
        console.error('Erro na validação global de fitas:', error);
        error("Erro", "Erro interno na validação de estoque. Tente novamente.");
        return;
      }

      // ✅ FILTRAR: Enviar apenas frutas que estão sendo colhidas (com quantidadeReal > 0)
      const frutasParaEnviar = frutasSendoColhidas.filter(fruta => {
        const quantidadeReal = typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal;
        return quantidadeReal && quantidadeReal > 0;
      });

      // ✅ FORMATAR: Mão de obra com valores corretos (números e unidadeMedida válida)
      const maoObraFormatada = maoObraValida.map(item => {
        // Buscar unidadeMedida da fruta se não estiver formatado (usando toggle se disponível)
        let unidadeMedida = item.unidadeMedida;
        if (!unidadeMedida || !['KG', 'TON', 'CX', 'UND', 'ML', 'LT'].includes(unidadeMedida)) {
          const frutaSelecionada = pedido?.frutasPedidos?.find(fp => fp.frutaId === item.frutaId);
          const usarUnidadeSecundaria = item.usarUnidadeSecundaria === true;
          const unidadeBase = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
            ? frutaSelecionada.unidadeMedida2
            : (frutaSelecionada?.unidadeMedida1 || 'KG');
          const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
          const unidadeEncontrada = unidadesValidas.find(u => unidadeBase.includes(u));
          unidadeMedida = unidadeEncontrada || 'KG';
        }

        // Garantir que valores sejam números
        const quantidadeColhida = typeof item.quantidadeColhida === 'string' 
          ? parseFloat(item.quantidadeColhida) 
          : Number(item.quantidadeColhida) || 0;
        const valorColheita = typeof item.valorColheita === 'string'
          ? parseFloat(item.valorColheita)
          : Number(item.valorColheita) || 0;

        return {
          turmaColheitaId: Number(item.turmaColheitaId),
          frutaId: Number(item.frutaId),
          quantidadeColhida: quantidadeColhida,
          unidadeMedida: unidadeMedida,
          valorColheita: valorColheita,
          dataColheita: values.dataColheita.startOf('day').add(12, 'hours').toISOString(),
          pagamentoEfetuado: false,
          observacoes: item.observacoes || undefined,
        };
      });

      const formData = {
        dataColheita: values.dataColheita.startOf('day').add(12, 'hours').toISOString(),
        observacoesColheita: values.observacoesColheita,
        frutas: frutasParaEnviar.map(fruta => {
          const frutaMeta = fruta?.frutaPedidoId ? frutasPedidoInfo[fruta.frutaPedidoId] : undefined;
          const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
            ? culturaInfoPorId[frutaMeta.culturaId]
            : undefined;
          const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);

          const areasProcessadas = herdaVinculosDaPrimeira
            ? []
            : (fruta.areas?.filter(area =>
                area.areaPropriaId || area.areaFornecedorId
              ).map(area => ({
                id: area.id,
                areaPropriaId: area.areaPropriaId || undefined,
                areaFornecedorId: area.areaFornecedorId || undefined,
                observacoes: area.observacoes || '',
                quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
              })) || []);

          const fitasProcessadas = herdaVinculosDaPrimeira
            ? []
            : (fruta.fitas?.filter(fita =>
                fita.fitaBananaId
              ).map(fita => ({
                id: fita.id,
                fitaBananaId: fita.fitaBananaId,
                quantidadeFita: fita.quantidadeFita || undefined,
                observacoes: fita.observacoes || '',
                // ✅ MANTER detalhesAreas para o backend processar
                detalhesAreas: fita.detalhesAreas || []
              })) || []);

          return {
            frutaPedidoId: fruta.frutaPedidoId,
            // Garantir que quantidades sejam números
            quantidadeReal: typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal,
            quantidadeReal2: typeof fruta.quantidadeReal2 === 'string' ? parseFloat(fruta.quantidadeReal2) : fruta.quantidadeReal2,
            areas: areasProcessadas,
            fitas: fitasProcessadas,
          };
        }),
        // Campos de frete
        pesagem: values.pesagem ? String(values.pesagem) : values.pesagem, // Converte para string conforme schema
        placaPrimaria: values.placaPrimaria,
        placaSecundaria: values.placaSecundaria,
        nomeMotorista: values.nomeMotorista,
        numeroNf: values.numeroNf,
        // ✅ NOVO: Mão de obra agora salva junto com colheita (já formatada)
        maoObra: maoObraFormatada.length > 0 ? maoObraFormatada : undefined
      };

      // PADRÃO "FECHAR-ENTÃO-LOADING": Fechar modal ANTES de iniciar loading
      form.resetFields();
      onClose();

      // Notificar parent component para iniciar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(true, "Registrando colheita...");
      }

      // ✅ AGORA: Salvar colheita e mão de obra juntos em uma única chamada
      await onSave(formData);

      // Chamar callback para finalizar (recarregar lista, etc)
      if (onSaveComplete) {
        await onSaveComplete();
      }
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
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
    form.resetFields();
    onClose();
  };


  return (
    <>
      {contextHolder}
      <Modal
      title={
        <span style={{ 
          color: "#ffffff", 
          fontWeight: "600", 
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          <ShoppingOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? 'Colheita' : 'Registrar Colheita'}
        </span>
      }
      open={open}
      onCancel={handleCancelar}
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "85rem" }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        }
      }}
      centered
      destroyOnClose
      zIndex={1050}
    >
      {pedido && (
        <>
          {/* Informações do Pedido */}
          <Card
            title={
              <Space>
                <ShoppingOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Informações do Pedido</span>
              </Space>
            }
            style={{ 
              marginBottom: isMobile ? 12 : 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem",
              backgroundColor: "#f9f9f9",
            }}
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "0.125rem solid #047857",
                color: "#ffffff",
                borderRadius: "0.5rem 0.5rem 0 0",
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: { 
                padding: isMobile ? "12px" : "16px"
              }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              <Col xs={24} md={6}>
                <Text strong>Pedido:</Text>
                <br />
                <Text style={{ color: "#059669", fontWeight: "600" }}>{pedido.numeroPedido}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Cliente:</Text>
                <br />
                <Text>{capitalizeName(pedido.cliente?.nome)}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Data Prevista:</Text>
                <br />
                <Text>{pedido.dataPrevistaColheita ? moment(pedido.dataPrevistaColheita).format('DD/MM/YYYY') : '-'}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Status:</Text>
                <br />
                <Text style={{ color: "#faad14", fontWeight: "600" }}>Aguardando Colheita</Text>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        size={isMobile ? "small" : "large"}
        onFinish={handleSalvarColheita}
      >
        {/* Seção 1: Dados da Colheita */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Dados da Colheita</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: { 
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Data da Colheita</span>
                  </Space>
                }
                name="dataColheita"
                rules={[
                  { required: true, message: "Data da colheita é obrigatória" },
                ]}
              >
                <MaskedDatePicker
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? "0.875rem" : "1rem"
                  }}
                  size={isMobile ? "small" : "middle"}
                  disabledDate={(current) => current && current > moment().endOf('day')}
                  showToday
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Observações da Colheita</span>
                  </Space>
                }
                name="observacoesColheita"
              >
                <TextArea
                  rows={isMobile ? 2 : 3}
                  size={isMobile ? "small" : "middle"}
                  placeholder="Observações sobre a colheita (opcional)"
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    fontSize: isMobile ? "0.875rem" : "1rem"
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Frutas da Colheita */}
        <Card
          title={
            <Space>
              <AppleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Frutas da Colheita</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: { 
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          <Form.List name="frutas">
            {(fields) => {
              const frutasForm = form.getFieldValue('frutas') || [];
              const sortedFields = [...fields].sort((fieldA, fieldB) => {
                const frutaA = frutasForm?.[fieldA.name];
                const frutaB = frutasForm?.[fieldB.name];
                const metaA = frutaA?.frutaPedidoId ? frutasPedidoInfo[frutaA.frutaPedidoId] : undefined;
                const metaB = frutaB?.frutaPedidoId ? frutasPedidoInfo[frutaB.frutaPedidoId] : undefined;
                const culturaIdA = metaA?.culturaId ?? Number.MAX_SAFE_INTEGER;
                const culturaIdB = metaB?.culturaId ?? Number.MAX_SAFE_INTEGER;

                if (culturaIdA !== culturaIdB) {
                  return culturaIdA - culturaIdB;
                }

                const dePrimeiraA = metaA?.dePrimeira === true ? 0 : 1;
                const dePrimeiraB = metaB?.dePrimeira === true ? 0 : 1;
                if (dePrimeiraA !== dePrimeiraB) {
                  return dePrimeiraA - dePrimeiraB;
                }

                const nomeA = metaA?.nome || frutaA?.frutaNome || frutaA?.fruta?.nome || '';
                const nomeB = metaB?.nome || frutaB?.frutaNome || frutaB?.fruta?.nome || '';
                return nomeA.localeCompare(nomeB);
              });

              const temBanana = sortedFields.some(({ name }) => {
                const fruta = frutasForm?.[name];
                return (fruta?.frutaNome || fruta?.fruta?.nome || '').toLowerCase().includes('banana');
              });

              return (
                <>
                  {/* Cabeçalho das colunas */}
                  {!isMobile && (
                    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 16, padding: isMobile ? "6px 0" : "8px 0", borderBottom: "0.125rem solid #e8e8e8" }}>
                       <Col xs={24} md={temBanana ? 5 : 6}>
                         <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                           <AppleOutlined style={{ marginRight: "0.5rem" }} />
                           Fruta
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 3 : 4}>
                         <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                           <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                           Prevista
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 4 : 5}>
                         <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                           <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                           Colhida
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 4 : 5}>
                         <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                           <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                           Colhida 2
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 4 : 4}>
                         <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                           <EnvironmentOutlined style={{ marginRight: "0.5rem" }} />
                           Áreas
                         </span>
                       </Col>
                       {temBanana && (
                         <Col xs={24} md={4}>
                           <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                             <TagOutlined style={{ marginRight: "0.5rem" }} />
                             Fitas
                           </span>
                         </Col>
                       )}
                    </Row>
                  )}

                  {sortedFields.map(({ key, name, ...restField }, orderIndex) => {
                    const fieldIndex = name;
                    const fruta = frutasForm?.[fieldIndex] || {};
                    const frutaMeta = fruta?.frutaPedidoId ? frutasPedidoInfo[fruta.frutaPedidoId] : undefined;
                    const culturaInfo = frutaMeta?.culturaId !== null && frutaMeta?.culturaId !== undefined
                      ? culturaInfoPorId[frutaMeta.culturaId]
                      : undefined;
                    const herdaVinculosDaPrimeira = !!(frutaMeta && culturaInfo?.hasPrimeira && !frutaMeta.dePrimeira);
                    const frutaNomeFormatado = capitalizeName(fruta?.frutaNome || fruta?.fruta?.nome || '');
                    const isFrutaBanana = frutaNomeFormatado.toLowerCase().includes('banana');

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
                      <div key={key} style={{ marginBottom: isMobile ? 12 : 16 }}>
                        {isMobile && orderIndex > 0 && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: isMobile ? "12px" : "16px",
                            padding: "8px 0"
                          }}>
                            <div style={{
                              flex: 1,
                              height: "1px",
                              backgroundColor: "#e8e8e8"
                            }} />
                            <div style={{
                              margin: "0 12px",
                              padding: "4px 12px",
                              backgroundColor: "#f0f9ff",
                              borderRadius: "12px",
                              border: "1px solid #bae6fd"
                            }}>
                              <Text style={{
                                color: "#059669",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}>
                                Fruta {orderIndex + 1}
                              </Text>
                            </div>
                            <div style={{
                              flex: 1,
                              height: "1px",
                              backgroundColor: "#e8e8e8"
                            }} />
                          </div>
                        )}
                        <div style={wrapperStyle}>
                          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="baseline">
                            {/* Nome da Fruta */}
                            <Col xs={24} md={temBanana ? 5 : 6}>
                              <Form.Item
                                {...restField}
                                name={[name, 'frutaNome']}
                                label={isMobile ? (
                                  <Space size="small">
                                    <AppleOutlined style={{ color: "#059669" }} />
                                    <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Fruta</span>
                                  </Space>
                                ) : undefined}
                              >
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
                                    size={isMobile ? "small" : "middle"}
                                    value={frutaNomeFormatado}
                                    style={{
                                      borderRadius: "6px",
                                      borderColor: "#d9d9d9",
                                      backgroundColor: "#f5f5f5",
                                      fontSize: isMobile ? "0.875rem" : "1rem"
                                    }}
                                  />
                                </div>
                              </Form.Item>
                            </Col>

                            {/* Quantidade Prevista */}
                            <Col xs={24} md={temBanana ? 3 : 4}>
                              <Form.Item
                                {...restField}
                                label={isMobile ? (
                                  <Space size="small">
                                    <CalculatorOutlined style={{ color: "#059669" }} />
                                    <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Prevista</span>
                                  </Space>
                                ) : undefined}
                              >
                                <Input
                                  disabled
                                  size={isMobile ? "small" : "middle"}
                                  value={`${fruta?.quantidadePrevista || ''} ${fruta?.unidadeMedida1 || ''}`.trim()}
                                  style={{
                                    borderRadius: "6px",
                                    borderColor: "#d9d9d9",
                                    backgroundColor: "#f5f5f5",
                                    fontSize: isMobile ? "0.875rem" : "1rem"
                                  }}
                                />
                              </Form.Item>
                            </Col>

                            {/* Quantidade Real */}
                            <Col xs={24} md={temBanana ? 4 : 5}>
                              <Form.Item
                                {...restField}
                                name={[name, 'quantidadeReal']}
                                label={isMobile ? (
                                  <Space size="small">
                                    <CalculatorOutlined style={{ color: "#059669" }} />
                                    <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Colhida</span>
                                  </Space>
                                ) : undefined}
                                rules={[
                                  {
                                    validator: (_, value) => {
                                      if (!value) return Promise.resolve();
                                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                      if (numValue && numValue <= 0) {
                                        return Promise.reject(new Error("Quantidade deve ser maior que zero"));
                                      }
                                      return Promise.resolve();
                                    }
                                  }
                                ]}
                              >
                                <MonetaryInput
                                  placeholder="Ex: 985,50"
                                  addonAfter={fruta?.unidadeMedida1 || ''}
                                  size={isMobile ? "small" : "large"}
                                  style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                                />
                              </Form.Item>
                            </Col>

                            {/* Quantidade Real 2 */}
                            <Col xs={24} md={temBanana ? 4 : 5}>
                              <Form.Item
                                {...restField}
                                name={[name, 'quantidadeReal2']}
                                label={isMobile ? (
                                  <Space size="small">
                                    <CalculatorOutlined style={{ color: "#059669" }} />
                                    <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Colhida 2</span>
                                  </Space>
                                ) : undefined}
                                rules={[
                                  {
                                    validator: (_, value) => {
                                      if (!value) return Promise.resolve();
                                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                      if (numValue && numValue <= 0) {
                                        return Promise.reject(new Error("Quantidade deve ser maior que zero"));
                                      }
                                      return Promise.resolve();
                                    }
                                  }
                                ]}
                              >
                                <MonetaryInput
                                  placeholder={!fruta?.unidadeMedida2 ? "-" : "Ex: 50,00"}
                                  addonAfter={fruta?.unidadeMedida2 || ''}
                                  disabled={!fruta?.unidadeMedida2}
                                  className={!fruta?.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                                  size={isMobile ? "small" : "large"}
                                  style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                                />
                              </Form.Item>
                            </Col>

                            {/* Coluna de Áreas */}
                            <Col xs={24} md={temBanana ? 4 : 4}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                                justifyContent: isMobile ? 'center' : 'flex-start'
                              }}>
                                {herdaVinculosDaPrimeira ? (
                                  <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '13px' }}>
                                    Áreas serão vinculadas à fruta de primeira.
                                  </Text>
                                ) : hasLinkedAreas(fruta, herdaVinculosDaPrimeira) ? (
                                  <>
                                    <Tooltip title="Gerenciar áreas">
                                      <FormButton
                                        icon={<LinkOutlined />}
                                        onClick={() => handleVincularAreas(fruta, fieldIndex)}
                                        size={isMobile ? "small" : "middle"}
                                        style={{
                                          minWidth: isMobile ? '28px' : '32px',
                                          width: isMobile ? '28px' : '32px',
                                          height: isMobile ? '28px' : '32px',
                                          padding: '0'
                                        }}
                                      />
                                    </Tooltip>
                                    {getLinkedAreasNames(fruta).slice(0, isMobile ? 1 : 2).map((area, idx) => (
                                      <Tag
                                        key={idx}
                                        size="small"
                                        color={area.tipo === 'propria' ? 'green' : 'blue'}
                                        style={{
                                          fontSize: isMobile ? '10px' : '11px',
                                          maxWidth: isMobile ? '60px' : '80px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {area.nome}
                                      </Tag>
                                    ))}
                                    {getLinkedAreasNames(fruta).length > (isMobile ? 1 : 2) && (
                                      <Tag size="small" color="blue" style={{ fontSize: isMobile ? '10px' : '11px' }}>
                                        +{getLinkedAreasNames(fruta).length - (isMobile ? 1 : 2)}
                                      </Tag>
                                    )}
                                  </>
                                ) : (
                                  <FormButton
                                    icon={<LinkOutlined />}
                                    onClick={() => handleVincularAreas(fruta, fieldIndex)}
                                    size={isMobile ? "small" : "middle"}
                                    style={{
                                      minWidth: isMobile ? '120px' : '130px',
                                      width: isMobile ? '120px' : 'auto'
                                    }}
                                  >
                                    {isMobile ? 'Vincular Áreas' : 'Vincular Áreas'}
                                  </FormButton>
                                )}
                              </div>
                            </Col>

                            {/* Coluna de Fitas - Só aparece para bananas */}
                            {isFrutaBanana && (
                              <Col xs={24} md={4}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  justifyContent: isMobile ? 'center' : 'flex-start'
                                }}>
                                  {herdaVinculosDaPrimeira ? (
                                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '13px' }}>
                                      Fitas serão vinculadas à fruta de primeira.
                                    </Text>
                                  ) : hasLinkedFitas(fruta) ? (
                                    <>
                                      <Tooltip title="Gerenciar fitas">
                                        <FormButton
                                          icon={<LinkOutlined />}
                                          onClick={() => handleVincularFitas(fruta, fieldIndex)}
                                          size={isMobile ? "small" : "middle"}
                                          style={{
                                            minWidth: isMobile ? '28px' : '32px',
                                            width: isMobile ? '28px' : '32px',
                                            height: isMobile ? '28px' : '32px',
                                            padding: '0'
                                          }}
                                        />
                                      </Tooltip>
                                      {getLinkedFitasNames(fruta).slice(0, 1).map((fita, idx) => (
                                        <Tag
                                          key={idx}
                                          size="small"
                                          style={{
                                            fontSize: isMobile ? '10px' : '11px',
                                            backgroundColor: fita.cor + '20',
                                            borderColor: fita.cor,
                                            color: '#333',
                                            maxWidth: isMobile ? '50px' : '60px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {fita.nome}
                                        </Tag>
                                      ))}
                                      {getLinkedFitasNames(fruta).length > 1 && (
                                        <Tag size="small" color="purple" style={{ fontSize: isMobile ? '10px' : '11px' }}>
                                          +{getLinkedFitasNames(fruta).length - 1}
                                        </Tag>
                                      )}
                                    </>
                                  ) : (
                                    <FormButton
                                      icon={<LinkOutlined />}
                                      onClick={() => handleVincularFitas(fruta, fieldIndex)}
                                      size={isMobile ? "small" : "middle"}
                                      style={{
                                        minWidth: isMobile ? '120px' : '120px',
                                        width: isMobile ? '120px' : 'auto'
                                      }}
                                    >
                                      {isMobile ? 'Vincular Fitas' : 'Vincular Fitas'}
                                    </FormButton>
                                  )}
                                </div>
                              </Col>
                            )}
                          </Row>
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            }}
          </Form.List>
        </Card>

        {/* Seção 3: Informações de Frete */}
        <Card
          title={
            <Space>
              <CarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Informações de Frete</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: { 
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
                     <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
             <Col xs={24} md={4}>
               <Form.Item
                 label={
                   <Space>
                     <CalculatorOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Pesagem</span>
                   </Space>
                 }
                 name="pesagem"
                 rules={[
                   {
                     validator: (_, value) => {
                       // Se não tem valor, é válido (campo opcional)
                       if (!value) return Promise.resolve();
                       
                       // InputNumber já garante que é número, só validar se é positivo
                       if (value <= 0) {
                         return Promise.reject(new Error("Pesagem deve ser maior que zero"));
                       }
                       
                       return Promise.resolve();
                     }
                   }
                 ]}
               >
                                  <InputNumber
                    placeholder="Ex: 2500"
                    size={isMobile ? "small" : "middle"}
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                      fontSize: isMobile ? "0.875rem" : "1rem"
                    }}
                    min={1}
                    max={999999}
                    controls={false}
                    formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
                    parser={(value) => value.replace(/[^0-9]/g, '')}
                  />
               </Form.Item>
             </Col>

             <Col xs={24} md={4}>
               <Form.Item
                 label={
                   <Space>
                     <FileTextOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Número NF</span>
                   </Space>
                 }
                 name="numeroNf"
                 rules={[
                   {
                     validator: (_, value) => {
                       // Se não tem valor, é válido (campo opcional)
                       if (!value) return Promise.resolve();
                       
                       // Validar se é número positivo
                       if (value <= 0) {
                         return Promise.reject(new Error("Número NF deve ser maior que zero"));
                       }
                       
                       return Promise.resolve();
                     }
                   }
                 ]}
               >
                 <InputNumber
                   placeholder="Ex: 123456"
                   size={isMobile ? "small" : "middle"}
                   style={{
                     width: "100%",
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                     fontSize: isMobile ? "0.875rem" : "1rem"
                   }}
                   min={1}
                   max={999999999}
                   controls={false}
                   formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
                   parser={(value) => value.replace(/[^0-9]/g, '')}
                 />
               </Form.Item>
             </Col>

             <Col xs={24} md={4}>
               <Form.Item
                 label={
                   <Space>
                     <CarOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Placa Principal</span>
                   </Space>
                 }
                 name="placaPrimaria"
               >
                 <Input
                   placeholder="Ex: ABC-1234"
                   size={isMobile ? "small" : "middle"}
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                     fontSize: isMobile ? "0.875rem" : "1rem"
                   }}
                 />
               </Form.Item>
             </Col>

             <Col xs={24} md={4}>
               <Form.Item
                 label={
                   <Space>
                     <CarOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Placa Secundária</span>
                   </Space>
                 }
                 name="placaSecundaria"
               >
                 <Input
                   placeholder="Ex: XYZ-5678 (reboque)"
                   size={isMobile ? "small" : "middle"}
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                     fontSize: isMobile ? "0.875rem" : "1rem"
                   }}
                 />
               </Form.Item>
             </Col>

             <Col xs={24} md={8}>
               <Form.Item
                 label={
                   <Space>
                     <UserOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>Motorista</span>
                   </Space>
                 }
                 name="nomeMotorista"
               >
                 <Input
                   placeholder="Nome do motorista"
                   size={isMobile ? "small" : "middle"}
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                     fontSize: isMobile ? "0.875rem" : "1rem"
                   }}
                 />
               </Form.Item>
             </Col>
           </Row>
        </Card>

        {/* Seção 4: Mão de Obra */}
        <Card
          title={
            <Space>
              <TeamOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Mão de Obra</span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: { 
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          <Form.List name="maoObra">
            {(fields, { add, remove }) => (
              <>
                  {/* Área de scroll com altura máxima para 5 linhas */}
                  <div style={{
                    maxHeight: isMobile ? 'auto' : '480px', // ~96px por linha × 5 linhas
                    overflowY: fields.length > 5 ? 'auto' : 'visible',
                    marginBottom: isMobile ? '12px' : '16px',
                    paddingRight: fields.length > 5 ? '8px' : '0'
                  }}>
                    {/* Cabeçalho das colunas */}
                    {!isMobile && (
                      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 16, padding: isMobile ? "6px 0" : "8px 0", borderBottom: "0.125rem solid #e8e8e8" }}>
                        <Col xs={24} md={4}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <TeamOutlined style={{ marginRight: "0.5rem" }} />
                            Turma de Colheita
                          </span>
                        </Col>
                        <Col xs={24} md={4}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <AppleOutlined style={{ marginRight: "0.5rem" }} />
                            Fruta Colhida
                          </span>
                        </Col>
                        <Col xs={24} md={3}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                            Quantidade
                          </span>
                        </Col>
                        <Col xs={24} md={3}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <DollarOutlined style={{ marginRight: "0.25rem" }} />
                            Valor Unit.
                          </span>
                        </Col>
                        <Col xs={24} md={3}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                            Valor Total
                          </span>
                        </Col>
                        <Col xs={24} md={4}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <FileTextOutlined style={{ marginRight: "0.5rem" }} />
                            Observações
                          </span>
                        </Col>
                        <Col xs={24} md={3}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            Ações
                          </span>
                        </Col>
                      </Row>
                    )}

                    {fields.map((field, index) => (
                      <MaoObraRow
                        key={field.key}
                        field={field}
                        index={index}
                        form={form}
                        isMobile={isMobile}
                        turmasColheita={turmasColheita}
                        pedido={pedido}
                        fieldsLength={fields.length}
                        onRemove={remove}
                        onAdd={add}
                        capitalizeName={capitalizeName}
                      />
                    ))}
                  </div>

                  {/* 📊 RESUMO FIXO DA MÃO DE OBRA */}
                  <ResumoMaoObra form={form} isMobile={isMobile} pedido={pedido} />
                </>
              )}
          </Form.List>
        </Card>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: isMobile ? "8px" : "12px",
            marginTop: isMobile ? "1rem" : "1.5rem",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancelar}
            disabled={loading || isSaving}
            size={isMobile ? "small" : "middle"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={isSaving}
            disabled={loading}
            size={isMobile ? "small" : "large"}
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Salvar Colheita
          </Button>
                 </div>
       </Form>

       {/* Modal de Vincular Áreas */}
       <VincularAreasModal
         open={vincularAreasModalOpen}
         fruta={frutaSelecionada}
        onClose={handleFecharVincularAreas}
         onSave={handleSalvarAreas}
        areasDisponiveis={areasDisponiveis}
        fornecedoresAreasMap={fornecedoresAreasMap}
       />

       {/* Modal de Vincular Fitas */}
       <VincularFitasModal
         open={vincularFitasModalOpen}
         fruta={frutaSelecionada}
        onClose={handleFecharVincularFitas}
         onSave={handleSalvarFitas}
        fitasDisponiveis={fitasComAreasDisponiveis}
        coresFita={coresFita}
       />

       {/* Modal de Confirmação de Inconsistências */}
       <ConfirmActionModal
         open={confirmInconsistenciaOpen}
         onConfirm={handleConfirmarInconsistencias}
         onCancel={() => {
           setConfirmInconsistenciaOpen(false);
           setValoresPendentes(null);
           setInconsistenciasData(null);
           setIsSaving(false);
         }}
         title="Inconsistências Detectadas"
         confirmText="Sim, Salvar Mesmo Assim"
         cancelText="Cancelar"
         message="Foram detectadas inconsistências entre as quantidades informadas e as quantidades das áreas vinculadas."
         customContent={
           <div>
             <Text strong>As seguintes inconsistências foram detectadas:</Text>
             <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
               {inconsistenciasData?.map((item, index) => (
                 <li key={index}>
                   <Text>
                     <strong>{item.nomeFruta}</strong>:
                     {item.temInconsistenciaUnd1 && ` ${item.unidadeMedida1} informado: ${item.quantidadeReal}, soma das áreas: ${item.somaUnidade1}`}
                     {item.temInconsistenciaUnd2 && ` | ${item.unidadeMedida2} informado: ${item.quantidadeReal2}, soma das áreas: ${item.somaUnidade2}`}
                   </Text>
                 </li>
               ))}
             </ul>
             <Text type="warning" style={{ display: 'block', marginTop: '12px' }}>
               Deseja continuar mesmo assim?
             </Text>
           </div>
         }
       />
     </Modal>
    </>
   );
 };

ColheitaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
  onLoadingChange: PropTypes.func
};

export default ColheitaModal;
