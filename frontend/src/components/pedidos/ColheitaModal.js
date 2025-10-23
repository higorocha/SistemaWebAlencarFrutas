// src/components/pedidos/ColheitaModal.js

import React, { useState, useEffect } from "react";
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

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Componente de Resumo com atualização em tempo real
const ResumoMaoObra = ({ form, isMobile }) => {
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
    const unidade = item.unidadeMedida || 'N/A';
    const quantidade = parseInt(item.quantidadeColhida) || 0; // ✅ Inteiro, não decimal
    const valor = parseFloat(item.valorColheita) || 0;

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
              {resumo.valorTotal > 0 ? (
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
            observacoes: area.observacoes || ''
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
         // Inicializar mão de obra com um item vazio
         maoObra: pedido.maoObra || [{
           turmaColheitaId: undefined,
           quantidadeColhida: undefined,
           unidadeMedida: undefined,
           valorColheita: undefined,
           observacoes: ''
         }]
       });
    } else if (open) {
      form.resetFields();
    }
  }, [open, pedido, form]);

  const unidadesMedida = [
    { value: 'KG', label: 'Quilogramas (KG)' },
    { value: 'TON', label: 'Toneladas (TON)' },
    { value: 'CX', label: 'Caixas (CX)' },
    { value: 'UND', label: 'Unidades (UND)' },
  ];

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
    
    const frutaCompleta = {
      ...fruta,
      index: frutaIndex,
      // ✅ Incluir valores atuais do formulário
      quantidadeReal: frutaAtual?.quantidadeReal,
      quantidadeReal2: frutaAtual?.quantidadeReal2,
      unidadeMedida1: fruta.unidadeMedida1,
      unidadeMedida2: fruta.unidadeMedida2
    };
    
    
    setFrutaSelecionada(frutaCompleta);
    setVincularAreasModalOpen(true);
  };

  const handleVincularFitas = (fruta, frutaIndex) => {
    // Verificar se a fruta tem áreas vinculadas antes de abrir o modal
    if (!hasLinkedAreas(fruta)) {
      warning("Áreas Necessárias", "Você deve vincular áreas à fruta antes de vincular fitas. As fitas são específicas para cada área.");
      return;
    }
    
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setVincularFitasModalOpen(true);
  };


  // Verificar se fruta é banana para mostrar botão de fitas
  const isBanana = (frutaNome) => {
    return frutaNome && frutaNome.toLowerCase().includes('banana');
  };

  // Verificar se fruta tem áreas vinculadas (não placeholders)
  const hasLinkedAreas = (fruta) => {
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

  // ✅ NOVA FUNÇÃO: Validar inconsistências entre quantidades informadas e áreas
  const validarInconsistenciasQuantidades = (frutas) => {
    const inconsistencias = [];

    frutas.forEach((fruta, index) => {
      const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${index + 1}`;

      // Obter quantidades informadas no formulário
      const quantidadeReal = typeof fruta.quantidadeReal === 'string'
        ? parseFloat(fruta.quantidadeReal) || 0
        : (fruta.quantidadeReal || 0);

      const quantidadeReal2 = typeof fruta.quantidadeReal2 === 'string'
        ? parseFloat(fruta.quantidadeReal2) || 0
        : (fruta.quantidadeReal2 || 0);

      // Calcular soma das quantidades das áreas
      const areasReais = fruta.areas?.filter(area =>
        area.areaPropriaId || area.areaFornecedorId
      ) || [];

      const somaUnidade1 = areasReais.reduce((sum, area) =>
        sum + (Number(area.quantidadeColhidaUnidade1) || 0), 0);

      const somaUnidade2 = areasReais.reduce((sum, area) =>
        sum + (Number(area.quantidadeColhidaUnidade2) || 0), 0);

      // Verificar inconsistências
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
          temInconsistenciaUnd2
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

  // Função para salvar áreas vinculadas
  const handleSalvarAreas = (areas) => {
    if (!frutaSelecionada) return;
    
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
    const frutasAtualizadas = frutasAtuais.map((fruta, index) => {
      if (index === indexToUpdate) {
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
        
        // Se há áreas selecionadas, usar apenas elas
        const frutaAtualizada = {
          ...fruta,
          areas: areas.map(area => ({
            ...area,
            areaPropriaId: area.areaPropriaId || undefined,
            areaFornecedorId: area.areaFornecedorId || undefined,
            observacoes: area.observacoes || ''
          })),
          // ✅ SEMPRE SETAR A SOMA
          // Se somaUnidade2 for 0, enviar null para evitar erro de validação @IsPositive no backend
          quantidadeReal: somaUnidade1,
          quantidadeReal2: somaUnidade2 > 0 ? somaUnidade2 : null
        };

        return frutaAtualizada;
      }
      return fruta;
    });

    form.setFieldsValue({ frutas: frutasAtualizadas });

    // ✅ APLICAR SINCRONIZAÇÃO nos campos do formulário
    // Se somaUnidade2 for 0, enviar null para evitar erro de validação @IsPositive no backend
    const updates = {};
    updates[['frutas', indexToUpdate, 'quantidadeReal']] = somaUnidade1;
    updates[['frutas', indexToUpdate, 'quantidadeReal2']] = somaUnidade2 > 0 ? somaUnidade2 : null;
    form.setFieldsValue(updates);
    
    success("Sucesso", "Áreas vinculadas e quantidades sincronizadas com sucesso!");
  };


  // Função para salvar fitas vinculadas
  const handleSalvarFitas = (fitas) => {
    if (!frutaSelecionada) return;
    
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
          if (item.turmaColheitaId && item.quantidadeColhida && item.valorColheita) {
            maoObraValida.push({
              turmaColheitaId: item.turmaColheitaId,
              quantidadeColhida: Number(item.quantidadeColhida),
              valorColheita: Number(item.valorColheita),
              observacoes: item.observacoes || ''
            });
          }
        }
      }

      // Preparar dados para envio
      const formData = {
        dataColheita: values.dataColheita ? values.dataColheita.startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss') : null,
        frutas: values.frutas.map(fruta => ({
          frutaPedidoId: fruta.frutaPedidoId,
          frutaId: fruta.frutaId,
          quantidadeReal: fruta.quantidadeReal ? Number(fruta.quantidadeReal) : null,
          quantidadeReal2: fruta.quantidadeReal2 && Number(fruta.quantidadeReal2) > 0 ? Number(fruta.quantidadeReal2) : null,
          unidadeMedida1: fruta.unidadeMedida1,
          unidadeMedida2: fruta.unidadeMedida2 || null,
          areas: fruta.areas?.filter(area => area.areaPropriaId || area.areaFornecedorId).map(area => ({
            areaPropriaId: area.areaPropriaId || undefined,
            areaFornecedorId: area.areaFornecedorId || undefined,
            quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 ? Number(area.quantidadeColhidaUnidade1) : null,
            quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 ? Number(area.quantidadeColhidaUnidade2) : null,
            observacoes: area.observacoes || ''
          })) || [],
          fitas: fruta.fitas?.map(fita => ({
            fitaBananaId: fita.fitaBananaId,
            quantidadeFita: fita.quantidadeFita || undefined,
            observacoes: fita.observacoes || '',
            detalhesAreas: fita.detalhesAreas || []
          })) || []
        })),
        pesagem: values.pesagem ? String(values.pesagem) : values.pesagem,
        placaPrimaria: values.placaPrimaria,
        placaSecundaria: values.placaSecundaria,
        nomeMotorista: values.nomeMotorista
      };

      // Fechar modal e iniciar loading
      form.resetFields();
      onClose();

      if (onLoadingChange) {
        onLoadingChange(true, "Registrando colheita...");
      }

      // Salvar colheita
      await onSave(formData);

      // Salvar mão de obra se existir
      if (maoObraValida.length > 0 && pedido?.id) {
        try {
          if (onLoadingChange) {
            onLoadingChange(true, "Salvando dados de mão de obra...");
          }

          const promises = maoObraValida.map(custoColheita =>
            axiosInstance.post('/api/turma-colheita/custo-colheita', {
              pedidoId: pedido.id,
              turmaColheitaId: custoColheita.turmaColheitaId,
              quantidadeColhida: custoColheita.quantidadeColhida,
              valorColheita: custoColheita.valorColheita,
              observacoes: custoColheita.observacoes
            })
          );

          await Promise.all(promises);
        } catch (maoObraError) {
          console.error('Erro ao salvar mão de obra:', maoObraError);
        }
      }

      if (onLoadingChange) {
        onLoadingChange(false);
      }

      // Limpar estados
      setValoresPendentes(null);
      setInconsistenciasData(null);

    } catch (err) {
      console.error('Erro ao salvar colheita:', err);
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      setIsSaving(false);
    }
  };

  const handleSalvarColheita = async (values) => {
    try {
      setIsSaving(true);

      // Validar se pelo menos uma fruta tem dados de colheita
      if (!values.frutas || values.frutas.length === 0) {
        error("Erro", "Nenhuma fruta encontrada para colheita");
        return;
      }

      // ✅ NOVA VALIDAÇÃO: Validar dados de mão de obra com lógica mais rigorosa
      const maoObraValida = values.maoObra?.filter(item => {
        // Verificar se pelo menos um campo não-obrigatório foi preenchido (exceto observações)
        const temAlgumCampo = item.turmaColheitaId ||
                              item.quantidadeColhida ||
                              item.unidadeMedida ||
                              item.valorColheita;
        return temAlgumCampo;
      }) || [];

      // ✅ NOVA VALIDAÇÃO: Verificar duplicação de colheitadores
      const turmasUtilizadas = new Set();
      const turmasDuplicadas = [];

      for (let i = 0; i < maoObraValida.length; i++) {
        const item = maoObraValida[i];

        if (item.turmaColheitaId) {
          if (turmasUtilizadas.has(item.turmaColheitaId)) {
            const turmaNome = turmasColheita.find(t => t.id === item.turmaColheitaId)?.nomeColhedor || `Turma ${item.turmaColheitaId}`;
            turmasDuplicadas.push(turmaNome);
          } else {
            turmasUtilizadas.add(item.turmaColheitaId);
          }
        }
      }

      if (turmasDuplicadas.length > 0) {
        error("Erro", `Colheitador(es) duplicado(s) detectado(s): ${turmasDuplicadas.join(', ')}. Cada colheitador pode aparecer apenas uma vez por pedido.`);
        return;
      }

      for (let i = 0; i < maoObraValida.length; i++) {
        const item = maoObraValida[i];

        // ✅ NOVA VALIDAÇÃO: Se qualquer campo foi preenchido, todos os obrigatórios devem estar preenchidos
        const camposObrigatorios = ['turmaColheitaId', 'quantidadeColhida', 'unidadeMedida', 'valorColheita'];
        const camposFaltando = camposObrigatorios.filter(campo => !item[campo]);

        if (camposFaltando.length > 0) {
          const nomesCampos = {
            'turmaColheitaId': 'Turma de Colheita',
            'quantidadeColhida': 'Quantidade Colhida',
            'unidadeMedida': 'Unidade de Medida',
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
      }

                               // Validar se todas as frutas têm dados obrigatórios
          for (let i = 0; i < values.frutas.length; i++) {
            const fruta = values.frutas[i];
            
            // Converter quantidade real para número se necessário
            const quantidadeReal = typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal;
            
            if (!quantidadeReal || quantidadeReal <= 0) {
               const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
               error("Erro", `Informe a quantidade real colhida de "${nomeFruta}"`);
               return;
             }
           
                        // NOVA VALIDAÇÃO: Verificar se pelo menos uma área REAL foi selecionada (não placeholder)
             const areasReais = fruta.areas?.filter(area => 
               area.areaPropriaId || area.areaFornecedorId
             ) || [];
             
             if (areasReais.length === 0) {
               const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
               error("Erro", `Adicione pelo menos uma área de origem para "${nomeFruta}"`);
               return;
             }

             // Validar cada área real individualmente
             for (let j = 0; j < areasReais.length; j++) {
               const area = areasReais[j];
               const hasAreaPropria = area.areaPropriaId !== undefined && area.areaPropriaId !== null;
               const hasAreaFornecedor = area.areaFornecedorId !== undefined && area.areaFornecedorId !== null;
               
               if (!hasAreaPropria && !hasAreaFornecedor) {
                 const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
                 error("Erro", `Fruta "${nomeFruta}", área ${j + 1}: Selecione uma área válida`);
                 return;
               }
               
               if (hasAreaPropria && hasAreaFornecedor) {
                 const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
                 error("Erro", `Fruta "${nomeFruta}", área ${j + 1}: Não é possível selecionar área própria e de fornecedor simultaneamente`);
                 return;
               }
             }

             // NOVA VALIDAÇÃO: Verificar se fruta é banana e tem fitas vinculadas
             const frutaNome = fruta.frutaNome || fruta.fruta?.nome || '';
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

      const formData = {
        dataColheita: values.dataColheita.startOf('day').add(12, 'hours').toISOString(),
        observacoesColheita: values.observacoesColheita,
        frutas: values.frutas.map(fruta => ({
          frutaPedidoId: fruta.frutaPedidoId,
          // Garantir que quantidades sejam números
          quantidadeReal: typeof fruta.quantidadeReal === 'string' ? parseFloat(fruta.quantidadeReal) : fruta.quantidadeReal,
          quantidadeReal2: typeof fruta.quantidadeReal2 === 'string' ? parseFloat(fruta.quantidadeReal2) : fruta.quantidadeReal2,
          // NOVA ESTRUTURA: Arrays de áreas e fitas
          // IMPORTANTE: Filtrar apenas áreas reais (com IDs), removendo placeholders
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
        })),
        // Campos de frete
        pesagem: values.pesagem ? String(values.pesagem) : values.pesagem, // Converte para string conforme schema
        placaPrimaria: values.placaPrimaria,
        placaSecundaria: values.placaSecundaria,
        nomeMotorista: values.nomeMotorista
      };

      // PADRÃO "FECHAR-ENTÃO-LOADING": Fechar modal ANTES de iniciar loading
      form.resetFields();
      onClose();

      // Notificar parent component para iniciar CentralizedLoader
      if (onLoadingChange) {
        onLoadingChange(true, "Registrando colheita...");
      }

      // 1️⃣ Primeiro: Salvar a colheita
      await onSave(formData);

      // 2️⃣ Segundo: Salvar mão de obra se existir (não depende do retorno de onSave)
      if (maoObraValida.length > 0 && pedido?.id) {
        try {
          // Atualizar mensagem do loading para mão de obra
          if (onLoadingChange) {
            onLoadingChange(true, "Registrando mão de obra...");
          }

          // Usar o ID do pedido original (já existe)
          const pedidoId = pedido.id;

          // Salvar cada item de mão de obra individualmente
          for (const item of maoObraValida) {
            // ✅ CORREÇÃO: Usar apenas a PRIMEIRA fruta do pedido para criar UM registro por turma
            const primeiraFruta = values.frutas[0]; // Pegar primeira fruta

            if (primeiraFruta) {
              const custoData = {
                turmaColheitaId: item.turmaColheitaId,
                pedidoId: pedidoId,
                frutaId: primeiraFruta.frutaId, // ✅ Sempre usar primeira fruta
                quantidadeColhida: parseFloat(item.quantidadeColhida),
                unidadeMedida: item.unidadeMedida,
                valorColheita: item.valorColheita ? parseFloat(item.valorColheita) : undefined,
                dataColheita: values.dataColheita.startOf('day').add(12, 'hours').toISOString(),
                pagamentoEfetuado: false,
                observacoes: item.observacoes || ''
              };

              await axiosInstance.post('/api/turma-colheita/custo-colheita', custoData);
            }
          }

        } catch (error) {
          console.error('Erro ao salvar mão de obra:', error);
          warning("Aviso", "Colheita salva, mas houve erro ao registrar mão de obra. Verifique na seção de Turmas de Colheita.");
        }
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
            {(fields) => (
              <>
                                 {/* Cabeçalho das colunas */}
                 {(() => {
                   // Verificar se há pelo menos uma fruta banana no pedido
                   const temBanana = fields.some((_, index) => {
                     const fruta = form.getFieldValue('frutas')?.[index];
                     return (fruta?.frutaNome || fruta?.fruta?.nome || '').toLowerCase().includes('banana');
                   });
                   
                   return (
                     !isMobile && (
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
                     )
                   );
                 })()}

                {fields.map(({ key, name, ...restField }, index) => {
                  const fruta = form.getFieldValue('frutas')?.[index];
                  const isFrutaBanana = (fruta?.frutaNome || fruta?.fruta?.nome || '').toLowerCase().includes('banana');
                  
                  // Verificar se há pelo menos uma fruta banana no pedido
                  const temBanana = fields.some((_, idx) => {
                    const frutaCheck = form.getFieldValue('frutas')?.[idx];
                    return (frutaCheck?.frutaNome || frutaCheck?.fruta?.nome || '').toLowerCase().includes('banana');
                  });
                  
                  return (
                    <div key={key}>
                      {isMobile && index > 0 && (
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
                              Fruta {index + 1}
                            </Text>
                          </div>
                          <div style={{
                            flex: 1,
                            height: "1px",
                            backgroundColor: "#e8e8e8"
                          }} />
                        </div>
                      )}
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
                            <Input
                              disabled
                              size={isMobile ? "small" : "middle"}
                              value={capitalizeName(fruta?.frutaNome || fruta?.fruta?.nome || '')}
                              style={{
                                borderRadius: "6px",
                                borderColor: "#d9d9d9",
                                backgroundColor: "#f5f5f5",
                                fontSize: isMobile ? "0.875rem" : "1rem"
                              }}
                            />
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
                                  <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Colhida *</span>
                                </Space>
                              ) : undefined}
                              rules={[
                                { required: true, message: "Quantidade real é obrigatória" },
                                {
                                  validator: (_, value) => {
                                    // Converter string para número se necessário
                                    const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                    
                                    if (!numValue || numValue <= 0) {
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
                                    // Se não tem valor, é válido (campo opcional)
                                    if (!value) return Promise.resolve();
                                    
                                    // Converter string para número se necessário
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
                            {hasLinkedAreas(fruta) ? (
                              <>
                                  {/* Botão com apenas ícone */}
                                  <Tooltip title="Gerenciar áreas">
                                    <FormButton
                                      icon={<LinkOutlined />}
                                      onClick={() => handleVincularAreas(fruta, index)}
                                      size={isMobile ? "small" : "middle"}
                                      style={{ 
                                        minWidth: isMobile ? '28px' : '32px',
                                        width: isMobile ? '28px' : '32px',
                                        height: isMobile ? '28px' : '32px',
                                        padding: '0'
                                      }}
                                    />
                                  </Tooltip>
                                
                                {/* Badges das áreas */}
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
                                
                                {/* Badge "+X" se houver mais áreas */}
                                {getLinkedAreasNames(fruta).length > (isMobile ? 1 : 2) && (
                                  <Tag size="small" color="blue" style={{ fontSize: isMobile ? '10px' : '11px' }}>
                                    +{getLinkedAreasNames(fruta).length - (isMobile ? 1 : 2)}
                                  </Tag>
                                )}
                              </>
                            ) : (
                              <FormButton
                                icon={<LinkOutlined />}
                                onClick={() => handleVincularAreas(fruta, index)}
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
                              {hasLinkedFitas(fruta) ? (
                                <>
                                    {/* Botão com apenas ícone */}
                                    <Tooltip title="Gerenciar fitas">
                                      <FormButton
                                        icon={<LinkOutlined />}
                                        onClick={() => handleVincularFitas(fruta, index)}
                                        size={isMobile ? "small" : "middle"}
                                        style={{ 
                                          minWidth: isMobile ? '28px' : '32px',
                                          width: isMobile ? '28px' : '32px',
                                          height: isMobile ? '28px' : '32px',
                                          padding: '0'
                                        }}
                                      />
                                    </Tooltip>
                                  
                                  {/* Badges das fitas */}
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
                                  
                                  {/* Badge "+X" se houver mais fitas */}
                                  {getLinkedFitasNames(fruta).length > 1 && (
                                    <Tag size="small" color="purple" style={{ fontSize: isMobile ? '10px' : '11px' }}>
                                      +{getLinkedFitasNames(fruta).length - 1}
                                    </Tag>
                                  )}
                                </>
                              ) : (
                                <FormButton
                                  icon={<LinkOutlined />}
                                  onClick={() => handleVincularFitas(fruta, index)}
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
                  );
                })}
              </>
            )}
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
             <Col xs={24} md={5}>
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

             <Col xs={24} md={5}>
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

             <Col xs={24} md={5}>
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

             <Col xs={24} md={9}>
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
                        <Col xs={24} md={6}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <TeamOutlined style={{ marginRight: "0.5rem" }} />
                            Turma de Colheita
                          </span>
                        </Col>
                        <Col xs={24} md={4}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                            Quantidade
                          </span>
                        </Col>
                        <Col xs={24} md={3}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                            Unidade
                          </span>
                        </Col>
                        <Col xs={24} md={4}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                            Valor (R$)
                          </span>
                        </Col>
                        <Col xs={24} md={5}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            <FileTextOutlined style={{ marginRight: "0.5rem" }} />
                            Observações
                          </span>
                        </Col>
                        <Col xs={24} md={2}>
                          <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                            Ações
                          </span>
                        </Col>
                      </Row>
                    )}

                    {fields.map(({ key, name, ...restField }, index) => {
                  // Obter dados da turma selecionada para exibir no identificador
                  const maoObraItem = form.getFieldValue('maoObra')?.[index];
                  const turmaSelecionada = turmasColheita.find(t => t.id === maoObraItem?.turmaColheitaId);
                  const identificador = turmaSelecionada ? turmaSelecionada.nomeColhedor : `Colheitador ${index + 1}`;
                  
                  return (
                    <div key={key}>
                      {isMobile && index > 0 && (
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
                              {identificador}
                            </Text>
                          </div>
                          <div style={{
                            flex: 1,
                            height: "1px",
                            backgroundColor: "#e8e8e8"
                          }} />
                        </div>
                      )}
                      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="baseline">
                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'turmaColheitaId']}
                          label={isMobile ? (
                            <Space size="small">
                              <TeamOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Turma de Colheita</span>
                            </Space>
                          ) : undefined}
                          rules={[
                            {
                              validator: (_, value) => {
                                // Verificar se outros campos foram preenchidos
                                const formValues = form.getFieldsValue();
                                const maoObraItem = formValues.maoObra?.[name] || {};
                                const temOutrosCampos = maoObraItem.quantidadeColhida ||
                                                        maoObraItem.unidadeMedida ||
                                                        maoObraItem.valorColheita;

                                // Se outros campos foram preenchidos, turma é obrigatória
                                if (temOutrosCampos && !value) {
                                  return Promise.reject(new Error("Turma é obrigatória quando outros campos são preenchidos"));
                                }

                                // ✅ NOVA VALIDAÇÃO: Verificar duplicação de turma
                                if (value) {
                                  const todasTurmas = formValues.maoObra || [];
                                  const turmasComValor = todasTurmas
                                    .map((item, idx) => ({ turmaId: item?.turmaColheitaId, index: idx }))
                                    .filter(item => item.turmaId && item.turmaId === value);

                                  if (turmasComValor.length > 1) {
                                    const turmaNome = turmasColheita.find(t => t.id === value)?.nomeColhedor || `Turma ${value}`;
                                    return Promise.reject(new Error(`${turmaNome} já foi selecionado(a) em outro registro`));
                                  }
                                }

                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <Select
                            placeholder="Selecione uma turma"
                            size={isMobile ? "small" : "middle"}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              option.children.toLowerCase().includes(input.toLowerCase())
                            }
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "0.875rem" : "1rem"
                            }}
                          >
                            {turmasColheita.map((turma) => (
                              <Option 
                                key={turma.id} 
                                value={turma.id}
                              >
                                <Tooltip title={capitalizeName(turma.nomeColhedor)} placement="top">
                                  <span>{capitalizeName(turma.nomeColhedor)}</span>
                                </Tooltip>
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantidadeColhida']}
                          label={isMobile ? (
                            <Space size="small">
                              <CalculatorOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Quantidade</span>
                            </Space>
                          ) : undefined}
                          rules={[
                            {
                              validator: (_, value) => {
                                // Verificar se outros campos foram preenchidos
                                const formValues = form.getFieldsValue();
                                const maoObraItem = formValues.maoObra?.[name] || {};
                                const temOutrosCampos = maoObraItem.turmaColheitaId || 
                                                        maoObraItem.unidadeMedida || 
                                                        maoObraItem.valorColheita;
                                
                                // Se outros campos foram preenchidos, quantidade é obrigatória
                                if (temOutrosCampos && !value) {
                                  return Promise.reject(new Error("Quantidade é obrigatória quando outros campos são preenchidos"));
                                }
                                
                                // Se tem valor, deve ser maior que zero
                                if (value) {
                                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                  if (numValue && numValue <= 0) {
                                    return Promise.reject(new Error("Quantidade deve ser maior que zero"));
                                  }
                                }
                                
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <MonetaryInput
                            placeholder="Ex: 1.234,56"
                            size={isMobile ? "small" : "large"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "0.875rem" : "1rem"
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unidadeMedida']}
                          label={isMobile ? (
                            <Space size="small">
                              <CalculatorOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Unidade</span>
                            </Space>
                          ) : undefined}
                          rules={[
                            {
                              validator: (_, value) => {
                                // Verificar se outros campos foram preenchidos
                                const formValues = form.getFieldsValue();
                                const maoObraItem = formValues.maoObra?.[name] || {};
                                const temOutrosCampos = maoObraItem.turmaColheitaId || 
                                                        maoObraItem.quantidadeColhida || 
                                                        maoObraItem.valorColheita;
                                
                                // Se outros campos foram preenchidos, unidade é obrigatória
                                if (temOutrosCampos && !value) {
                                  return Promise.reject(new Error("Unidade de medida é obrigatória quando outros campos são preenchidos"));
                                }
                                
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <Select
                            placeholder="Unidade"
                            size={isMobile ? "small" : "middle"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "0.875rem" : "1rem"
                            }}
                          >
                            {unidadesMedida.map((unidade) => (
                              <Option key={unidade.value} value={unidade.value}>
                                {unidade.value}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'valorColheita']}
                          label={isMobile ? (
                            <Space size="small">
                              <CalculatorOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Valor (R$)</span>
                            </Space>
                          ) : undefined}
                          rules={[
                            {
                              validator: (_, value) => {
                                // Verificar se outros campos foram preenchidos
                                const formValues = form.getFieldsValue();
                                const maoObraItem = formValues.maoObra?.[name] || {};
                                const temOutrosCampos = maoObraItem.turmaColheitaId || 
                                                        maoObraItem.quantidadeColhida || 
                                                        maoObraItem.unidadeMedida;
                                
                                // Se outros campos foram preenchidos, valor é obrigatório
                                if (temOutrosCampos && !value) {
                                  return Promise.reject(new Error("Valor é obrigatório quando outros campos são preenchidos"));
                                }
                                
                                // Se tem valor, deve ser maior que zero
                                if (value && value <= 0) {
                                  return Promise.reject(new Error("Valor deve ser maior que zero"));
                                }
                                
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <MonetaryInput
                            placeholder="Ex: 150,00"
                            addonBefore="R$"
                            size={isMobile ? "small" : "large"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "0.875rem" : "1rem"
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'observacoes']}
                          label={isMobile ? (
                            <Space size="small">
                              <FileTextOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Observações</span>
                            </Space>
                          ) : undefined}
                        >
                          <Input
                            placeholder="Observações (opcional)"
                            size={isMobile ? "small" : "middle"}
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                              fontSize: isMobile ? "0.875rem" : "1rem"
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={2}>
                        <div style={{ 
                          display: "flex", 
                          gap: isMobile ? "8px" : "8px", 
                          justifyContent: isMobile ? "center" : "center",
                          flexDirection: isMobile ? "row" : "row",
                          marginTop: isMobile ? "8px" : "0",
                          paddingTop: isMobile ? "8px" : "0",
                          borderTop: isMobile ? "1px solid #f0f0f0" : "none"
                        }}>
                          {/* Botão de remover */}
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              if (fields.length > 1) {
                                remove(name);
                              }
                            }}
                            disabled={fields.length <= 1}
                            size={isMobile ? "small" : "large"}
                            style={{
                              borderRadius: "3.125rem",
                              height: isMobile ? "32px" : "40px",
                              width: isMobile ? "32px" : "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              border: "0.125rem solid #ff4d4f",
                              color: "#ff4d4f",
                              backgroundColor: "#ffffff",
                            }}
                          />

                          {/* Botão de adicionar apenas no último item */}
                          {index === fields.length - 1 && (
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                add({
                                  turmaColheitaId: undefined,
                                  quantidadeColhida: undefined,
                                  unidadeMedida: undefined,
                                  valorColheita: undefined,
                                  observacoes: ''
                                });
                              }}
                              size={isMobile ? "small" : "large"}
                              style={{
                                borderRadius: "3.125rem",
                                borderColor: "#10b981",
                                color: "#10b981",
                                borderWidth: "0.125rem",
                                height: isMobile ? "32px" : "40px",
                                width: isMobile ? "32px" : "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                backgroundColor: "#ffffff",
                              }}
                            />
                          )}
                        </div>
                      </Col>
                    </Row>
                    {index < fields.length - 1 && <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />}
                  </div>
                  );
                })}
                  </div>

                  {/* 📊 RESUMO FIXO DA MÃO DE OBRA */}
                  <ResumoMaoObra form={form} isMobile={isMobile} />
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
            loading={loading || isSaving}
            size={isMobile ? "small" : "middle"}
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            {isSaving ? "Registrando..." : "Registrar Colheita"}
          </Button>
                 </div>
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
         todasFrutasPedido={open ? (form.getFieldValue('frutas') || []) : []}
         fitasOriginaisTodasFrutas={[]} // ColheitaModal não tem dados originais
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


     </Modal>
    </>
   );
 };

ColheitaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
  onLoadingChange: PropTypes.func, // Callback para controlar CentralizedLoader
};

export default ColheitaModal;
