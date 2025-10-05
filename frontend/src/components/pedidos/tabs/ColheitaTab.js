// src/components/pedidos/tabs/ColheitaTab.js

import React, { useState, useEffect } from "react";
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
  CheckCircleOutlined
} from "@ant-design/icons";
import { MonetaryInput, MaskedDatePicker } from "../../../components/common/inputs";
import { FormButton } from "../../common/buttons";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";
import moment from "moment";
import VincularAreasModal from "../VincularAreasModal";
import VincularFitasModal from "../VincularFitasModal";
import { validarFitasCompleto } from "../../../utils/fitasValidation";

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

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
  
  // Estados para os modais de vinculação
  const [vincularAreasModalOpen, setVincularAreasModalOpen] = useState(false);
  const [vincularFitasModalOpen, setVincularFitasModalOpen] = useState(false);
  const [frutaSelecionada, setFrutaSelecionada] = useState(null);
  const [fitasBanana, setFitasBanana] = useState([]);

  // Estados para mão de obra
  const [turmasColheita, setTurmasColheita] = useState([]);

  // ✅ NOVOS ESTADOS: Para validação global de fitas
  const [fitasComAreasDisponiveis, setFitasComAreasDisponiveis] = useState([]);

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
        quantidadeColhida: undefined,
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

        // Buscar turmas de colheita
        const responseTurmas = await axiosInstance.get("/api/turma-colheita");
        setTurmasColheita(responseTurmas.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        showNotification("error", "Erro", "Erro ao carregar dados necessários");
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
    // ✅ PROCESSAR fruta para incluir dados completos (igual ao ColheitaModal.js)
    const frutaProcessada = {
      ...fruta,
      index: frutaIndex,
      // ✅ ADICIONAR: Nome da fruta para VincularAreasModal
      frutaNome: frutas.find(f => f.id === fruta.frutaId)?.nome || '',
      // ✅ ADICIONAR: Objeto fruta completo (com cultura) para filtragem por cultura
      fruta: frutas.find(f => f.id === fruta.frutaId) || null
    };
    
    setFrutaSelecionada(frutaProcessada);
    setVincularAreasModalOpen(true);
  };

  const handleVincularFitas = (fruta, frutaIndex) => {
    // ✅ BUSCAR dados originais IMUTÁVEIS do banco para esta fruta
    const frutaOriginal = dadosOriginaisBanco?.frutas?.find(f => f.frutaId === fruta.frutaId) || null;
    
    // ✅ PROCESSAR fitas para incluir detalhesAreas (igual ao ColheitaModal.js)
    const frutaProcessada = {
      ...fruta,
      index: frutaIndex,
      // ✅ ADICIONAR: Nome da fruta para VincularFitasModal
      frutaNome: frutas.find(f => f.id === fruta.frutaId)?.nome || '',
      // Processar fitas ATUAIS para o VincularFitasModal
      fitas: fruta.fitas?.length > 0 ? fruta.fitas.map(fita => ({
        id: fita.id,
        fitaBananaId: fita.fitaBananaId,
        quantidadeFita: fita.quantidadeFita || undefined,
        observacoes: fita.observacoes || '',
        // ✅ MANTER detalhesAreas para reconstrução no VincularFitasModal
        detalhesAreas: fita.detalhesAreas || []
      })) : [],
      // ✅ NOVO: Incluir dados originais IMUTÁVEIS do banco para validações
      fitasOriginaisBanco: frutaOriginal?.fitas || []
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
        quantidadeColhida: undefined,
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
        if (['quantidadeColhida', 'valorColheita'].includes(field)) {
          if (value === null || value === '' || value === undefined) {
            processedValue = undefined;
          } else {
            processedValue = Number(value);
          }
        }
        return { ...item, [field]: processedValue };
      }
      return item;
    });
    setPedidoAtual(prev => ({ ...prev, maoObra: novaMaoObra }));
  };

  // ✅ NOVA FUNÇÃO: Validar mão de obra em tempo real
  const validarMaoObraItem = (item, index) => {
    // Verificar se pelo menos um campo foi preenchido (exceto observações)
    const temAlgumCampo = item.turmaColheitaId ||
                          item.quantidadeColhida ||
                          item.unidadeMedida ||
                          item.valorColheita;

    if (!temAlgumCampo) {
      return null; // Item vazio, sem erro
    }

    // Se qualquer campo foi preenchido, verificar campos obrigatórios
    const camposObrigatorios = ['turmaColheitaId', 'quantidadeColhida', 'unidadeMedida', 'valorColheita'];
    const camposFaltando = camposObrigatorios.filter(campo => !item[campo]);

    if (camposFaltando.length > 0) {
      const nomesCampos = {
        'turmaColheitaId': 'Turma de Colheita',
        'quantidadeColhida': 'Quantidade Colhida',
        'unidadeMedida': 'Unidade de Medida',
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

  const unidadesMedida = [
    { value: 'KG', label: 'Quilogramas (KG)' },
    { value: 'TON', label: 'Toneladas (TON)' },
    { value: 'CX', label: 'Caixas (CX)' },
    { value: 'UND', label: 'Unidades (UND)' },
  ];


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
    const frutasAtuais = pedidoAtual.frutas;
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

    setPedidoAtual(prev => ({ ...prev, frutas: frutasAtualizadas }));
    showNotification("success", "Sucesso", "Áreas vinculadas com sucesso!");
  };

  // Função para salvar fitas vinculadas
  const handleSalvarFitas = (fitas) => {
    if (!frutaSelecionada) return;
    
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
        layout="vertical"
        size="large"
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
          const temBanana = pedidoAtual.frutas?.some(fruta => {
            const frutaNome = frutas.find(f => f.id === fruta.frutaId)?.nome || '';
            return frutaNome.toLowerCase().includes('banana');
          });
          
          return (
            <Row gutter={[8, 8]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
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
              <Col xs={24} md={temBanana ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Colhida
                </span>
              </Col>
              <Col xs={24} md={temBanana ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Colhida 2
                </span>
              </Col>
              <Col xs={24} md={temBanana ? 5 : 4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  Áreas
                </span>
              </Col>
              {temBanana && (
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

        {pedidoAtual.frutas.map((fruta, index) => {
          const frutaNome = frutas.find(f => f.id === fruta.frutaId)?.nome || '';
          const isFrutaBanana = frutaNome.toLowerCase().includes('banana');
          
          // Verificar se há pelo menos uma fruta banana no pedido
          const temBanana = pedidoAtual.frutas?.some(frutaCheck => {
            const frutaNomeCheck = frutas.find(f => f.id === frutaCheck.frutaId)?.nome || '';
            return frutaNomeCheck.toLowerCase().includes('banana');
          });
          
          return (
          <div key={index}>
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
            <Row gutter={[8, 8]} align="baseline">
              {/* Nome da Fruta */}
              <Col xs={24} md={temBanana ? 5 : 6}>
                <Form.Item>
                  <Input
                    disabled
                    value={frutas.find(f => f.id === fruta.frutaId)?.nome || ''}
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
              <Col xs={24} md={temBanana ? 4 : 5}>
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
                    onChange={(value) => handleFrutaChange(index, 'quantidadeReal', value)}
                    disabled={!canEditTab("2")}
                  />
                </Form.Item>
              </Col>

              {/* Quantidade Real 2 */}
                <Col xs={24} md={temBanana ? 4 : 5}>
                  <Form.Item
                >
                  <MonetaryInput
                    placeholder="Ex: 50,00"
                    addonAfter={fruta.unidadeMedida2 || ''}
                    disabled={!fruta.unidadeMedida2 || !canEditTab("2")}
                    className={!fruta.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                    size="large"
                    value={fruta.quantidadeReal2}
                    onChange={(value) => handleFrutaChange(index, 'quantidadeReal2', value)}
                  />
                </Form.Item>
              </Col>

              {/* Coluna de Áreas */}
              <Col xs={24} md={temBanana ? 5 : 4}>
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
                          disabled={!canEditTab("2")}
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
                            maxWidth: '70px',
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
                        minWidth: '110px'
                      }}
                      disabled={!canEditTab("2")}
                    >
                      Vincular Áreas
                    </FormButton>
                  )}
                </div>
              </Col>

              {/* Coluna de Fitas - Só aparece para bananas */}
              {isFrutaBanana && (
                <Col xs={24} md={3}>
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
                            disabled={!canEditTab("2")}
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
                              maxWidth: '50px',
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
                          minWidth: '100px'
                        }}
                        disabled={!canEditTab("2")}
                      >
                        Vincular Fitas
                      </FormButton>
                    )}
                  </div>
                </Col>
              )}
            </Row>

            {index < pedidoAtual.frutas.length - 1 && <Divider style={{ margin: "8px 0" }} />}
          </div>
          );
        })}
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

        {pedidoAtual.maoObra && pedidoAtual.maoObra.map((item, index) => {
          const pagamentoEfetuado = item.pagamentoEfetuado === true;
          
          return (
          <div key={index}>
            {/* ✅ INDICADOR DE PAGAMENTO EFETUADO */}
            {pagamentoEfetuado && (
              <Row style={{ marginBottom: '8px' }}>
                <Col span={24}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    backgroundColor: '#f6ffed', 
                    border: '1px solid #b7eb8f', 
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px', fontSize: '16px' }} />
                    <span style={{ color: '#52c41a', fontWeight: '600', fontSize: '14px' }}>
                      Pagamento já efetuado - Campos bloqueados para edição
                    </span>
                  </div>
                </Col>
              </Row>
            )}
            
            <Row gutter={[16, 16]} align="baseline">
              <Col xs={24} md={6}>
                <Form.Item
                  validateStatus={(() => {
                    const erro = validarMaoObraItem(item, index);
                    const duplicacao = validarDuplicacao(item.turmaColheitaId, index);
                    return (erro && !item.turmaColheitaId) || !duplicacao.valido ? "error" : "";
                  })()}
                  help={(() => {
                    const erro = validarMaoObraItem(item, index);
                    const duplicacao = validarDuplicacao(item.turmaColheitaId, index);
                    if (!duplicacao.valido) return duplicacao.mensagem;
                    if (erro && !item.turmaColheitaId) return "Campo obrigatório";
                    return "";
                  })()}
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
                      borderColor: (() => {
                        const erro = validarMaoObraItem(item, index);
                        const duplicacao = validarDuplicacao(item.turmaColheitaId, index);
                        return (erro && !item.turmaColheitaId) || !duplicacao.valido ? "#ff4d4f" : "#d9d9d9";
                      })(),
                    }}
                    value={item.turmaColheitaId}
                    onChange={(value) => {
                      // Validar duplicação antes de permitir a mudança
                      const validacao = validarDuplicacao(value, index);
                      if (!validacao.valido) {
                        showNotification("error", "Colhedor Duplicado", validacao.mensagem);
                        return;
                      }
                      handleMaoObraChange(index, 'turmaColheitaId', value);
                    }}
                    disabled={!canEditTab("2") || pagamentoEfetuado}
                  >
                    {turmasColheita.map((turma) => (
                      <Option
                        key={turma.id}
                        value={turma.id}
                        disabled={(() => {
                          // Desabilitar opção se já foi selecionada em outro item
                          const maoObraAtual = pedidoAtual.maoObra || [];
                          return maoObraAtual.some((maoObraItem, maoObraIndex) =>
                            maoObraIndex !== index && maoObraItem.turmaColheitaId === turma.id
                          );
                        })()}
                      >
                        {turma.nomeColhedor}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item
                  validateStatus={validarMaoObraItem(item, index) && !item.quantidadeColhida ? "error" : ""}
                  help={validarMaoObraItem(item, index) && !item.quantidadeColhida ? "Campo obrigatório" : ""}
                >
                  <MonetaryInput
                    placeholder="Ex: 1.234,56"
                    size="large"
                    style={{
                      borderRadius: "6px",
                      borderColor: validarMaoObraItem(item, index) && !item.quantidadeColhida ? "#ff4d4f" : "#d9d9d9",
                    }}
                    value={item.quantidadeColhida}
                    onChange={(value) => handleMaoObraChange(index, 'quantidadeColhida', value)}
                    disabled={!canEditTab("2") || pagamentoEfetuado}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={3}>
                <Form.Item
                  validateStatus={validarMaoObraItem(item, index) && !item.unidadeMedida ? "error" : ""}
                  help={validarMaoObraItem(item, index) && !item.unidadeMedida ? "Campo obrigatório" : ""}
                >
                  <Select
                    placeholder="Unidade"
                    style={{
                      borderRadius: "6px",
                      borderColor: validarMaoObraItem(item, index) && !item.unidadeMedida ? "#ff4d4f" : "#d9d9d9",
                    }}
                    value={item.unidadeMedida}
                    onChange={(value) => handleMaoObraChange(index, 'unidadeMedida', value)}
                    disabled={!canEditTab("2") || pagamentoEfetuado}
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
                  validateStatus={validarMaoObraItem(item, index) && !item.valorColheita ? "error" : ""}
                  help={validarMaoObraItem(item, index) && !item.valorColheita ? "Campo obrigatório" : ""}
                >
                  <MonetaryInput
                    placeholder="Ex: 150,00"
                    addonBefore="R$"
                    size="large"
                    style={{
                      borderRadius: "6px",
                      borderColor: validarMaoObraItem(item, index) && !item.valorColheita ? "#ff4d4f" : "#d9d9d9",
                    }}
                    value={item.valorColheita}
                    onChange={(value) => handleMaoObraChange(index, 'valorColheita', value)}
                    disabled={!canEditTab("2") || pagamentoEfetuado}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={5}>
                <Form.Item>
                  <Input
                    placeholder="Observações (opcional)"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    value={item.observacoes}
                    onChange={(e) => handleMaoObraChange(index, 'observacoes', e.target.value)}
                    disabled={!canEditTab("2") || pagamentoEfetuado}
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
                    onClick={() => removerMaoObra(index)}
                    size="large"
                    disabled={!canEditTab("2") || (pedidoAtual.maoObra && pedidoAtual.maoObra.length <= 1) || pagamentoEfetuado}
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
                  {index === (pedidoAtual.maoObra?.length - 1) && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={adicionarMaoObra}
                      size="large"
                      disabled={!canEditTab("2") || pagamentoEfetuado}
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
            {index < (pedidoAtual.maoObra?.length - 1) && <Divider style={{ margin: "16px 0" }} />}
          </div>
          );
        })}
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
              // ✅ NOVA VALIDAÇÃO: Validar mão de obra antes de salvar
              const maoObraValida = pedidoAtual.maoObra?.filter(item => {
                // Verificar se pelo menos um campo não-obrigatório foi preenchido (exceto observações)
                const temAlgumCampo = item.turmaColheitaId ||
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
              }

              // ✅ VALIDAÇÃO GLOBAL de fitas antes de salvar
              try {
                const resultadoValidacao = validarFitasCompleto(
                  pedidoAtual.frutas || [],
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
                
                // Se passou na validação, chamar o onSave original
                onSave();
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
