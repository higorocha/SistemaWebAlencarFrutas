// src/components/pedidos/tabs/ColheitaTab.js

import React, { useState, useEffect, useRef } from "react";
import { Button, Space, Form, Input, Select, DatePicker, Row, Col, Typography, Card, Divider, Tag, Tooltip, Modal } from "antd";
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
  DeleteOutlined
} from "@ant-design/icons";
import { MonetaryInput } from "../../../components/common/inputs";
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
  
  // Ref para controlar o valor original da data de colheita
  const dataColheitaOriginalRef = useRef(null);

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
        observacoes: ''
      }];
      needsUpdate = true;
    }

    if (needsUpdate) {
      setPedidoAtual(updatedPedido);
    }
  }, [pedidoAtual?.frutas, pedidoAtual?.maoObra, setPedidoAtual]);


  // Inicializar data de colheita original
  useEffect(() => {
    if (pedidoAtual.dataColheita) {
      dataColheitaOriginalRef.current = moment(pedidoAtual.dataColheita);
    }
  }, [pedidoAtual.dataColheita]);

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

  // Função para gerenciar o foco do campo de data
  const handleDataColheitaFocus = () => {
    // Limpa o campo quando recebe foco
    setPedidoAtual(prev => ({
      ...prev,
      dataColheita: null
    }));
  };

  // Função para gerenciar a perda de foco do campo de data
  const handleDataColheitaBlur = () => {
    const valorAtual = pedidoAtual.dataColheita;
    
    // Se não há valor selecionado, restaura o valor original
    if (!valorAtual && dataColheitaOriginalRef.current) {
      setPedidoAtual(prev => ({
        ...prev,
        dataColheita: dataColheitaOriginalRef.current.toDate()
      }));
    }
  };

  // Funções para abrir modais de vinculação
  const handleVincularAreas = (fruta, frutaIndex) => {
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
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
        observacoes: ''
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
              <DatePicker
                style={{ 
                  width: "100%",
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
                format="DD/MM/YYYY"
                placeholder="Selecione a data"
                disabledDate={(current) => current && current > moment().endOf('day')}
                value={pedidoAtual.dataColheita ? moment(pedidoAtual.dataColheita) : undefined}
                onChange={(date) => {
                  handleChange("dataColheita", date ? date.format('YYYY-MM-DD') : null);
                }}
                onFocus={handleDataColheitaFocus}
                onBlur={handleDataColheitaBlur}
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
                  Real
                </span>
              </Col>
              <Col xs={24} md={temBanana ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Real 2
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

        {pedidoAtual.maoObra && pedidoAtual.maoObra.map((item, index) => (
          <div key={index}>
            <Row gutter={[16, 16]} align="baseline">
              <Col xs={24} md={6}>
                <Form.Item>
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
                    value={item.turmaColheitaId}
                    onChange={(value) => handleMaoObraChange(index, 'turmaColheitaId', value)}
                    disabled={!canEditTab("2")}
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
                <Form.Item>
                  <MonetaryInput
                    placeholder="Ex: 1.234,56"
                    size="large"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    value={item.quantidadeColhida}
                    onChange={(value) => handleMaoObraChange(index, 'quantidadeColhida', value)}
                    disabled={!canEditTab("2")}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={3}>
                <Form.Item>
                  <Select
                    placeholder="Unidade"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    value={item.unidadeMedida}
                    onChange={(value) => handleMaoObraChange(index, 'unidadeMedida', value)}
                    disabled={!canEditTab("2")}
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
                <Form.Item>
                  <MonetaryInput
                    placeholder="Ex: 150,00"
                    addonBefore="R$"
                    size="large"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    value={item.valorColheita}
                    onChange={(value) => handleMaoObraChange(index, 'valorColheita', value)}
                    disabled={!canEditTab("2")}
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
                    disabled={!canEditTab("2")}
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
                    disabled={!canEditTab("2") || (pedidoAtual.maoObra && pedidoAtual.maoObra.length <= 1)}
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
                      disabled={!canEditTab("2")}
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
        ))}
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
              // ✅ NOVA VALIDAÇÃO GLOBAL antes de salvar
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
