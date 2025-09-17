// src/components/pedidos/ColheitaModal.js

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Space, message, Form, Input, Select, DatePicker, InputNumber, Row, Col, Typography, Card, Divider, Tag, Tooltip } from "antd";
import PropTypes from "prop-types";
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
  DeleteOutlined
} from "@ant-design/icons";
import { showNotification } from "../../config/notificationConfig";
import moment from "moment";
import axiosInstance from "../../api/axiosConfig";
import { MonetaryInput } from "../../components/common/inputs";
import { FormButton } from "../common/buttons";
import VincularAreasModal from "./VincularAreasModal";
import VincularFitasModal from "./VincularFitasModal";
import { validarFitasCompleto } from "../../utils/fitasValidation";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;



const ColheitaModal = ({
  open,
  onClose,
  onSave,
  pedido,
  loading,
}) => {
  const [form] = Form.useForm();
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

  // ✅ NOVOS ESTADOS: Para validação global de fitas
  const [fitasComAreasDisponiveis, setFitasComAreasDisponiveis] = useState([]);

  // Estados para mão de obra
  const [turmasColheita, setTurmasColheita] = useState([]);

  // Ref para controlar o valor original da data de colheita
  const dataColheitaOriginalRef = useRef(null);

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
        showNotification("error", "Erro", "Erro ao carregar dados necessários");
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
        frutaNome: fruta.fruta?.nome,
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

             // Armazenar o valor original da data de colheita
       const dataColheita = pedido.dataColheita ? moment(pedido.dataColheita) : moment();
       dataColheitaOriginalRef.current = dataColheita;
       
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
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setVincularAreasModalOpen(true);
  };

  const handleVincularFitas = (fruta, frutaIndex) => {
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setVincularFitasModalOpen(true);
  };

  // Funções para gerenciar mão de obra
  const adicionarMaoObra = () => {
    const maoObraAtual = form.getFieldValue('maoObra') || [];
    form.setFieldsValue({
      maoObra: [...maoObraAtual, {
        turmaColheitaId: undefined,
        quantidadeColhida: undefined,
        unidadeMedida: undefined,
        valorColheita: undefined,
        observacoes: ''
      }]
    });
  };

  const removerMaoObra = (index) => {
    const maoObraAtual = form.getFieldValue('maoObra') || [];
    if (maoObraAtual.length > 1) {
      const novaMaoObra = maoObraAtual.filter((_, i) => i !== index);
      form.setFieldsValue({ maoObra: novaMaoObra });
    }
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
    
    // Atualizar formulário com novas áreas
    const frutasAtuais = form.getFieldValue('frutas') || [];
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
        
        // Se há áreas selecionadas, usar apenas elas
        return {
          ...fruta,
          areas: areas.map(area => ({
            ...area,
            areaPropriaId: area.areaPropriaId || undefined,
            areaFornecedorId: area.areaFornecedorId || undefined,
            observacoes: area.observacoes || ''
          }))
        };
      }
      return fruta;
    });

    form.setFieldsValue({ frutas: frutasAtualizadas });
    showNotification("success", "Sucesso", "Áreas vinculadas com sucesso!");
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
    showNotification("success", "Sucesso", "Fitas vinculadas com sucesso!");
  };


  const handleSalvarColheita = async (values) => {
    try {
      setIsSaving(true);

      // Validar se pelo menos uma fruta tem dados de colheita
      if (!values.frutas || values.frutas.length === 0) {
        showNotification("error", "Erro", "Nenhuma fruta encontrada para colheita");
        return;
      }

      // Validar dados de mão de obra se existirem
      const maoObraValida = values.maoObra?.filter(item => 
        item.turmaColheitaId || item.quantidadeColhida || item.unidadeMedida
      ) || [];

      for (let i = 0; i < maoObraValida.length; i++) {
        const item = maoObraValida[i];
        
        // Se tem quantidade, deve ser maior que zero
        if (item.quantidadeColhida && item.quantidadeColhida <= 0) {
          showNotification("error", "Erro", `Mão de obra ${i + 1}: Quantidade deve ser maior que zero`);
          return;
        }
        
        // Se tem quantidade, deve ter unidade de medida
        if (item.quantidadeColhida && !item.unidadeMedida) {
          showNotification("error", "Erro", `Mão de obra ${i + 1}: Unidade de medida é obrigatória quando há quantidade`);
          return;
        }
        
        // Se tem unidade de medida, deve ter quantidade
        if (item.unidadeMedida && !item.quantidadeColhida) {
          showNotification("error", "Erro", `Mão de obra ${i + 1}: Quantidade é obrigatória quando há unidade de medida`);
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
               showNotification("error", "Erro", `Informe a quantidade real colhida de "${nomeFruta}"`);
               return;
             }
           
                        // NOVA VALIDAÇÃO: Verificar se pelo menos uma área REAL foi selecionada (não placeholder)
             const areasReais = fruta.areas?.filter(area => 
               area.areaPropriaId || area.areaFornecedorId
             ) || [];
             
             if (areasReais.length === 0) {
               const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
               showNotification("error", "Erro", `Adicione pelo menos uma área de origem para "${nomeFruta}"`);
               return;
             }

             // Validar cada área real individualmente
             for (let j = 0; j < areasReais.length; j++) {
               const area = areasReais[j];
               const hasAreaPropria = area.areaPropriaId !== undefined && area.areaPropriaId !== null;
               const hasAreaFornecedor = area.areaFornecedorId !== undefined && area.areaFornecedorId !== null;
               
               if (!hasAreaPropria && !hasAreaFornecedor) {
                 const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
                 showNotification("error", "Erro", `Fruta "${nomeFruta}", área ${j + 1}: Selecione uma área válida`);
                 return;
               }
               
               if (hasAreaPropria && hasAreaFornecedor) {
                 const nomeFruta = fruta.frutaNome || fruta.fruta?.nome || `Fruta ${i + 1}`;
                 showNotification("error", "Erro", `Fruta "${nomeFruta}", área ${j + 1}: Não é possível selecionar área própria e de fornecedor simultaneamente`);
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
                 showNotification("error", "Erro", `A fruta "${frutaNome}" é uma banana e deve ter pelo menos uma fita vinculada`);
                 return;
               }
             }
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
          showNotification("error", "Conflito de Estoque de Fitas", primeiroErro);
          return;
        }
      } catch (error) {
        console.error('Erro na validação global de fitas:', error);
        showNotification("error", "Erro", "Erro interno na validação de estoque. Tente novamente.");
        return;
      }

      const formData = {
        dataColheita: values.dataColheita.toISOString(),
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
        })),
        // Campos de frete
        pesagem: values.pesagem ? String(values.pesagem) : values.pesagem, // Converte para string conforme schema
        placaPrimaria: values.placaPrimaria,
        placaSecundaria: values.placaSecundaria,
        nomeMotorista: values.nomeMotorista
      };

      // 1️⃣ Primeiro: Salvar a colheita
      await onSave(formData);

      // 2️⃣ Segundo: Salvar mão de obra se existir (não depende do retorno de onSave)
      if (maoObraValida.length > 0 && pedido?.id) {
        try {
          // Usar o ID do pedido original (já existe)
          const pedidoId = pedido.id;

          // Salvar cada item de mão de obra individualmente
          for (const item of maoObraValida) {
            // Para cada fruta no pedido, criar um registro de mão de obra
            for (const fruta of values.frutas) {
              const custoData = {
                turmaColheitaId: item.turmaColheitaId,
                pedidoId: pedidoId,
                frutaId: fruta.frutaId, // frutaId já está disponível na estrutura de frutas
                quantidadeColhida: parseFloat(item.quantidadeColhida),
                unidadeMedida: item.unidadeMedida,
                valorColheita: item.valorColheita ? parseFloat(item.valorColheita) : undefined,
                dataColheita: values.dataColheita.toISOString(),
                pagamentoEfetuado: false,
                observacoes: item.observacoes || ''
              };

              await axiosInstance.post('/api/turma-colheita/custo-colheita', custoData);
            }
          }

        } catch (error) {
          console.error('Erro ao salvar mão de obra:', error);
          showNotification("warning", "Aviso", "Colheita salva, mas houve erro ao registrar mão de obra. Verifique na seção de Turmas de Colheita.");
        }
      }

      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    form.resetFields();
    onClose();
  };

  // Função para gerenciar o foco do campo de data
  const handleDataColheitaFocus = () => {
    // Limpa o campo quando recebe foco
    form.setFieldValue('dataColheita', null);
  };

  // Função para gerenciar a perda de foco do campo de data
  const handleDataColheitaBlur = () => {
    const valorAtual = form.getFieldValue('dataColheita');
    
    // Se não há valor selecionado, restaura o valor original
    if (!valorAtual) {
      form.setFieldValue('dataColheita', dataColheitaOriginalRef.current);
    }
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
          <ShoppingOutlined style={{ marginRight: 8 }} />
          Registrar Colheita
        </span>
      }
      open={open}
      onCancel={handleCancelar}
      footer={null}
      width="95%"
      style={{ maxWidth: 1400 }}
      styles={{
        body: {
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
      zIndex={99999}
    >
      {pedido && (
        <>
          {/* Informações do Pedido */}
          <Card
            title={
              <Space>
                <ShoppingOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Pedido</span>
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
              <Col xs={24} md={6}>
                <Text strong>Pedido:</Text>
                <br />
                <Text style={{ color: "#059669", fontWeight: "600" }}>{pedido.numeroPedido}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Cliente:</Text>
                <br />
                <Text>{pedido.cliente?.nome}</Text>
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
        size="large"
        onFinish={handleSalvarColheita}
      >
        {/* Seção 1: Dados da Colheita */}
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
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
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
                name="dataColheita"
                rules={[
                  { required: true, message: "Data da colheita é obrigatória" },
                ]}
              >
                                 <DatePicker
                   style={{ 
                     width: "100%",
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
                   format="DD/MM/YYYY"
                   placeholder="Selecione a data"
                   disabledDate={(current) => current && current > moment().endOf('day')}
                   onFocus={handleDataColheitaFocus}
                   onBlur={handleDataColheitaBlur}
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
                name="observacoesColheita"
              >
                <TextArea
                  rows={3}
                  placeholder="Observações sobre a colheita (opcional)"
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas da Colheita</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
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
                     <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
                       <Col xs={24} md={temBanana ? 5 : 6}>
                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                           <AppleOutlined style={{ marginRight: 8 }} />
                           Fruta
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 3 : 4}>
                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                           <CalculatorOutlined style={{ marginRight: 8 }} />
                           Prevista
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 3 : 4}>
                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                           <CalculatorOutlined style={{ marginRight: 8 }} />
                           Real
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 3 : 4}>
                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                           <CalculatorOutlined style={{ marginRight: 8 }} />
                           Real 2
                         </span>
                       </Col>
                       <Col xs={24} md={temBanana ? 6 : 6}>
                         <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                           <EnvironmentOutlined style={{ marginRight: 8 }} />
                           Áreas
                         </span>
                       </Col>
                       {temBanana && (
                         <Col xs={24} md={4}>
                           <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                             <TagOutlined style={{ marginRight: 8 }} />
                             Fitas
                           </span>
                         </Col>
                       )}
                     </Row>
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
                                             <Row gutter={[16, 16]} align="baseline">
                                                 {/* Nome da Fruta */}
                         <Col xs={24} md={temBanana ? 5 : 6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'frutaNome']}
                          >
                            <Input
                              disabled
                              value={fruta?.frutaNome || fruta?.fruta?.nome || ''}
                              style={{
                                borderRadius: "6px",
                                borderColor: "#d9d9d9",
                                backgroundColor: "#f5f5f5",
                              }}
                            />
                          </Form.Item>
                        </Col>

                                                 {/* Quantidade Prevista */}
                         <Col xs={24} md={temBanana ? 3 : 4}>
                           <Form.Item
                             {...restField}
                           >
                             <Input
                               disabled
                               value={`${fruta?.quantidadePrevista || ''} ${fruta?.unidadeMedida1 || ''}`.trim()}
                               style={{
                                 borderRadius: "6px",
                                 borderColor: "#d9d9d9",
                                 backgroundColor: "#f5f5f5",
                               }}
                             />
                           </Form.Item>
                         </Col>

                                                {/* Quantidade Real */}
                         <Col xs={24} md={temBanana ? 3 : 4}>
                                                       <Form.Item
                              {...restField}
                              name={[name, 'quantidadeReal']}
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
                               size="large"
                             />
                          </Form.Item>
                        </Col>

                                                 {/* Quantidade Real 2 */}
                         <Col xs={24} md={temBanana ? 3 : 4}>
                                                       <Form.Item
                              {...restField}
                              name={[name, 'quantidadeReal2']}
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
                                size="large"
                              />
                           </Form.Item>
                         </Col>

                        {/* Coluna de Áreas */}
                        <Col xs={24} md={temBanana ? 6 : 6}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {hasLinkedAreas(fruta) ? (
                              <>
                                  {/* Botão com apenas ícone */}
                                  <Tooltip title="Gerenciar áreas">
                                    <FormButton
                                      icon={<LinkOutlined />}
                                      onClick={() => handleVincularAreas(fruta, index)}
                                      style={{ 
                                        minWidth: '32px',
                                        width: '32px',
                                        padding: '0'
                                      }}
                                    />
                                  </Tooltip>
                                
                                {/* Badges das áreas */}
                                {getLinkedAreasNames(fruta).slice(0, 2).map((area, idx) => (
                                  <Tag 
                                    key={idx} 
                                    size="small" 
                                    color={area.tipo === 'propria' ? 'green' : 'blue'}
                                    style={{ 
                                      fontSize: '11px',
                                      maxWidth: '80px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {area.nome}
                                  </Tag>
                                ))}
                                
                                {/* Badge "+X" se houver mais áreas */}
                                {getLinkedAreasNames(fruta).length > 2 && (
                                  <Tag size="small" color="blue" style={{ fontSize: '11px' }}>
                                    +{getLinkedAreasNames(fruta).length - 2}
                                  </Tag>
                                )}
                              </>
                            ) : (
                              <FormButton
                                icon={<LinkOutlined />}
                                onClick={() => handleVincularAreas(fruta, index)}
                                style={{ 
                                  minWidth: '130px'
                                }}
                              >
                                Vincular Áreas
                              </FormButton>
                            )}
                          </div>
                        </Col>

                        {/* Coluna de Fitas - Só aparece para bananas */}
                        {isFrutaBanana && (
                          <Col xs={24} md={4}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {hasLinkedFitas(fruta) ? (
                                <>
                                    {/* Botão com apenas ícone */}
                                    <Tooltip title="Gerenciar fitas">
                                      <FormButton
                                        icon={<LinkOutlined />}
                                        onClick={() => handleVincularFitas(fruta, index)}
                                        style={{ 
                                          minWidth: '32px',
                                          width: '32px',
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
                                  
                                  {/* Badge "+X" se houver mais fitas */}
                                  {getLinkedFitasNames(fruta).length > 1 && (
                                    <Tag size="small" color="purple" style={{ fontSize: '11px' }}>
                                      +{getLinkedFitasNames(fruta).length - 1}
                                    </Tag>
                                  )}
                                </>
                              ) : (
                                <FormButton
                                  icon={<LinkOutlined />}
                                  onClick={() => handleVincularFitas(fruta, index)}
                                  style={{ 
                                    minWidth: '120px'
                                  }}
                                >
                                  Vincular Fitas
                                </FormButton>
                              )}
                            </div>
                          </Col>
                        )}
                      </Row>

                      

                                             {index < fields.length - 1 && <Divider style={{ margin: "8px 0" }} />}
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações de Frete</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
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
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
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
                     <span style={{ fontWeight: "700", color: "#333" }}>Placa Principal</span>
                   </Space>
                 }
                 name="placaPrimaria"
               >
                 <Input
                   placeholder="Ex: ABC-1234"
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
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
                 name="placaSecundaria"
               >
                 <Input
                   placeholder="Ex: XYZ-5678 (reboque)"
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
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
                 name="nomeMotorista"
               >
                 <Input
                   placeholder="Nome do motorista"
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Mão de Obra</span>
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
                {/* Cabeçalho das colunas */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
                  <Col xs={24} md={6}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <TeamOutlined style={{ marginRight: 8 }} />
                      Turma de Colheita
                    </span>
                  </Col>
                  <Col xs={24} md={4}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <CalculatorOutlined style={{ marginRight: 8 }} />
                      Quantidade
                    </span>
                  </Col>
                  <Col xs={24} md={3}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <CalculatorOutlined style={{ marginRight: 8 }} />
                      Unidade
                    </span>
                  </Col>
                  <Col xs={24} md={4}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <CalculatorOutlined style={{ marginRight: 8 }} />
                      Valor (R$)
                    </span>
                  </Col>
                  <Col xs={24} md={5}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      Observações
                    </span>
                  </Col>
                  <Col xs={24} md={2}>
                    <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                      Ações
                    </span>
                  </Col>
                </Row>

                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    <Row gutter={[16, 16]} align="baseline">
                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'turmaColheitaId']}
                        >
                          <Select
                            placeholder="Selecione uma turma"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              option.children.toLowerCase().includes(input.toLowerCase())
                            }
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          >
                            {turmasColheita.map((turma) => (
                              <Option key={turma.id} value={turma.id}>
                                {turma.nomeColhedor}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantidadeColhida']}
                          rules={[
                            {
                              validator: (_, value) => {
                                // Se não tem valor, é válido (campo opcional)
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
                            placeholder="Ex: 1.234,56"
                            size="large"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unidadeMedida']}
                        >
                          <Select
                            placeholder="Unidade"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
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
                        >
                          <MonetaryInput
                            placeholder="Ex: 150,00"
                            addonBefore="R$"
                            size="large"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'observacoes']}
                        >
                          <Input
                            placeholder="Observações (opcional)"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={2}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          {/* Botão de remover */}
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              remove(name);
                              removerMaoObra(index);
                            }}
                            size="large"
                            style={{
                              borderRadius: "50px",
                              height: "40px",
                              width: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              border: "2px solid #ff4d4f",
                              color: "#ff4d4f",
                              backgroundColor: "#ffffff",
                            }}
                          />

                          {/* Botão de adicionar apenas no último item */}
                          {index === fields.length - 1 && (
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={adicionarMaoObra}
                              size="large"
                              style={{
                                borderRadius: "50px",
                                borderColor: "#10b981",
                                color: "#10b981",
                                borderWidth: "2px",
                                height: "40px",
                                width: "40px",
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
                    {index < fields.length - 1 && <Divider style={{ margin: "16px 0" }} />}
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Card>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <Button
            icon={<CloseOutlined />}
            onClick={handleCancelar}
            disabled={loading || isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading || isSaving}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
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

     </Modal>
   );
 };

ColheitaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
};

export default ColheitaModal;
