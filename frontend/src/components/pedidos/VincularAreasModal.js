// src/components/pedidos/VincularAreasModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Checkbox,
  Input,
  Divider,
  Empty,
  Tag,
} from "antd";
import {
  LinkOutlined,
  EnvironmentOutlined,
  UserOutlined,
  SaveOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import useNotificationWithContext from "../../hooks/useNotificationWithContext";
import useResponsive from "../../hooks/useResponsive";
import MiniInputSearchPersonalizavel from "../common/MiniComponents/MiniInputSearchPersonalizavel";
import { MonetaryInput } from "../common/inputs";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import { Table } from "antd";
import { intFormatter } from "../../utils/formatters";

const { Title, Text } = Typography;
const { TextArea } = Input;

const VincularAreasModal = ({
  open,
  onClose,
  fruta,
  onSave,
  loading = false,
}) => {
  const [areasProprias, setAreasProprias] = useState([]);
  const [areasFornecedores, setAreasFornecedores] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [observacoes, setObservacoes] = useState("");
  const [culturaIdFruta, setCulturaIdFruta] = useState(null);
  const [searchTermAreasProprias, setSearchTermAreasProprias] = useState("");
  const [searchTermAreasFornecedores, setSearchTermAreasFornecedores] = useState("");
  const [quantidadesPorArea, setQuantidadesPorArea] = useState({});

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

  // Estados para modal de confirmação
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // Hook para notificações com z-index correto
  const { error, warning, contextHolder } = useNotificationWithContext();

  // Hook para responsividade
  const { isMobile } = useResponsive();

  // ✅ Buscar dados quando modal abrir (sempre buscar via API)
  useEffect(() => {
    if (open && fruta) {
      fetchDados();
    }
  }, [open, fruta?.frutaId]);

  // Inicializar áreas selecionadas quando fruta mudar
  useEffect(() => {
    if (open && fruta) {
      initializeSelectedAreas();
    }
  }, [open, fruta]);

  // Limpar busca quando modal fechar
  useEffect(() => {
    if (!open) {
      setSearchTermAreasProprias("");
      setSearchTermAreasFornecedores("");
    }
  }, [open]);

  const fetchDados = async () => {
    try {
      setLoadingDados(true);
      
      // Obter culturaId diretamente da fruta (vem como fruta.cultura.id do backend)
      const culturaId = fruta?.fruta?.cultura?.id || null;
      setCulturaIdFruta(culturaId);
      
      
      // Buscar áreas próprias (já inclui culturas via lotes)
      const responseAreasProprias = await axiosInstance.get("/api/areas-agricolas");
      const todasAreasProprias = responseAreasProprias.data || [];
      
      
      // Filtrar áreas próprias que possuem lotes com a mesma cultura da fruta
      const areasPropriasFiltradas = culturaId 
        ? todasAreasProprias.filter(area => {
            // Verificar se a área tem lotes com a cultura da fruta
            const temCultura = area.culturas && area.culturas.some(cultura => {
              return cultura.culturaId === culturaId;
            });
            return temCultura;
          })
        : todasAreasProprias; // Se não tem culturaId, mostra todas
      
      setAreasProprias(areasPropriasFiltradas);

      // Buscar áreas de fornecedores
      const responseAreasFornecedores = await axiosInstance.get("/api/areas-fornecedores");
      const todasAreasFornecedores = responseAreasFornecedores.data || [];
      
      // Filtrar áreas de fornecedores que possuem a mesma cultura da fruta
      const areasFornecedoresFiltradas = culturaId
        ? todasAreasFornecedores.filter(area => {
            // Verificar se a área tem a cultura da fruta
            return area.cultura && area.cultura.id === culturaId;
          })
        : todasAreasFornecedores; // Se não tem culturaId, mostra todas
      
      setAreasFornecedores(areasFornecedoresFiltradas);
      
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      error("Erro", "Erro ao carregar áreas disponíveis");
    } finally {
      setLoadingDados(false);
    }
  };

  const initializeSelectedAreas = () => {
    
    if (fruta?.areas && Array.isArray(fruta.areas)) {
      // Filtrar áreas que não são placeholders (que têm areaPropriaId ou areaFornecedorId)
      const realAreas = fruta.areas.filter(area => 
        area.areaPropriaId || area.areaFornecedorId
      );
      
      
      const areasInicializadas = realAreas.map(area => ({
        id: area.id,
        type: area.areaPropriaId ? 'propria' : 'fornecedor',
        areaId: area.areaPropriaId || area.areaFornecedorId,
        observacoes: area.observacoes || ''
      }));
      
      setSelectedAreas(areasInicializadas);
      setObservacoes(realAreas[0]?.observacoes || '');
      
      // Inicializar quantidades por área
      const quantidadesIniciais = {};
      realAreas.forEach(area => {
        const key = `${area.areaPropriaId || area.areaFornecedorId}_${area.areaPropriaId ? 'propria' : 'fornecedor'}`;

        // ✅ Valores agora são inteiros diretos (não mais Decimal)
        quantidadesIniciais[key] = {
          quantidade1: area.quantidadeColhidaUnidade1 ? String(area.quantidadeColhidaUnidade1) : '',
          quantidade2: area.quantidadeColhidaUnidade2 ? String(area.quantidadeColhidaUnidade2) : ''
        };

      });
      
      setQuantidadesPorArea(quantidadesIniciais);
    } else {
      setSelectedAreas([]);
      setObservacoes('');
      setQuantidadesPorArea({});
    }
  };

  const handleAreaSelection = (checked, areaId, type) => {
    if (checked) {
      // Adicionar área
      setSelectedAreas(prev => [...prev, {
        type,
        areaId,
        observacoes: ''
      }]);
      
      // Inicializar quantidades para a nova área
      const key = `${areaId}_${type}`;
      setQuantidadesPorArea(prev => ({
        ...prev,
        [key]: {
          quantidade1: '',
          quantidade2: ''
        }
      }));
    } else {
      // Remover área
      setSelectedAreas(prev => prev.filter(
        area => !(area.areaId === areaId && area.type === type)
      ));
      
      // Remover quantidades da área removida
      const key = `${areaId}_${type}`;
      setQuantidadesPorArea(prev => {
        const novasQuantidades = { ...prev };
        delete novasQuantidades[key];
        return novasQuantidades;
      });
    }
  };

  const isAreaSelected = (areaId, type) => {
    return selectedAreas.some(area => area.areaId === areaId && area.type === type);
  };

  const handleQuantidadeChange = (areaId, type, campo, value) => {
    const key = `${areaId}_${type}`;
    setQuantidadesPorArea(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [campo]: value
      }
    }));
  };

  // Função para validar e sincronizar quantidades
  const validarESincronizarQuantidades = (areasFormatted) => {
    // Calcular somas
    const somaUnidade1 = areasFormatted.reduce((sum, area) =>
      sum + (area.quantidadeColhidaUnidade1 || 0), 0);
    const somaUnidade2 = areasFormatted.reduce((sum, area) =>
      sum + (area.quantidadeColhidaUnidade2 || 0), 0);

    const usarReferenciaGrupo = Array.isArray(fruta?.frutasDoGrupo) && fruta?.frutasDoGrupo.length > 0 && fruta?.dePrimeira;

    const referenciaUnidade1 = usarReferenciaGrupo
      ? fruta.frutasDoGrupo.reduce((sum, item) => sum + normalizarNumero(item.quantidadeReal), 0)
      : normalizarNumero(fruta.quantidadeReal);
    const referenciaUnidade2 = usarReferenciaGrupo
      ? fruta.frutasDoGrupo.reduce((sum, item) => sum + normalizarNumero(item.quantidadeReal2), 0)
      : normalizarNumero(fruta.quantidadeReal2);

    const possuiReferenciaUnidade1 = referenciaUnidade1 > 0;
    const possuiReferenciaUnidade2 = referenciaUnidade2 > 0;

    const diferencaUnidade1 = somaUnidade1 - referenciaUnidade1;
    const diferencaUnidade2 = somaUnidade2 - referenciaUnidade2;

    const temDiferencaUnidade1 = possuiReferenciaUnidade1 && Math.abs(diferencaUnidade1) > 0.01;
    const temDiferencaUnidade2 = possuiReferenciaUnidade2 && Math.abs(diferencaUnidade2) > 0.01;

    if (temDiferencaUnidade1 || temDiferencaUnidade2) {
      const labelTotalColheita = usarReferenciaGrupo ? "Total da colheita da cultura" : "Total da colheita";
      const mensagemIntro = usarReferenciaGrupo
        ? "As quantidades das áreas selecionadas diferem do total registrado para esta cultura."
        : "As quantidades das áreas selecionadas diferem do total da colheita.";

      const dadosTabela = [];
      if (temDiferencaUnidade1) {
        dadosTabela.push({
          key: 'unidade1',
          unidade: fruta.unidadeMedida1,
          areasSelecionadas: somaUnidade1,
          totalColheita: referenciaUnidade1,
          diferenca: diferencaUnidade1
        });
      }
      if (temDiferencaUnidade2) {
        dadosTabela.push({
          key: 'unidade2',
          unidade: fruta.unidadeMedida2,
          areasSelecionadas: somaUnidade2,
          totalColheita: referenciaUnidade2,
          diferenca: diferencaUnidade2
        });
      }

      const colunasTabela = [
        {
          title: 'Unidade',
          dataIndex: 'unidade',
          key: 'unidade',
          width: 80,
          render: (text) => <Text strong style={{ color: "#059669" }}>{text}</Text>
        },
        {
          title: 'Áreas Selecionadas',
          dataIndex: 'areasSelecionadas',
          key: 'areasSelecionadas',
          width: 120,
          align: 'center'
        },
        {
          title: labelTotalColheita,
          dataIndex: 'totalColheita',
          key: 'totalColheita',
          width: 150,
          align: 'center'
        },
        {
          title: 'Diferença',
          dataIndex: 'diferenca',
          key: 'diferenca',
          width: 120,
          align: 'center',
          render: (value) => (
            <Text style={{
              color: value > 0 ? "#52c41a" : value < 0 ? "#ff4d4f" : "#333",
              fontWeight: "bold"
            }}>
              {value > 0 ? '+' : ''}{value}
            </Text>
          )
        }
      ];

      const customContent = (
        <div style={{ padding: isMobile ? "12px" : "16px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: isMobile ? "36px" : "48px", color: "#fa8c16", marginBottom: "12px" }}>
              ⚠️
            </div>
            <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "500", color: "#333" }}>
              {mensagemIntro}
            </Text>
          </div>

          <Table
            dataSource={dadosTabela}
            columns={colunasTabela}
            pagination={false}
            size="small"
            style={{ marginBottom: "16px" }}
            bordered
          />

          <div style={{
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: "6px",
            padding: "12px",
            marginTop: "12px"
          }}>
            <Text style={{ color: "#389e0d", fontSize: isMobile ? "12px" : "14px" }}>
              💡 As quantidades serão atualizadas automaticamente com a soma das áreas selecionadas.
            </Text>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Text style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "500" }}>
              Deseja continuar mesmo assim?
            </Text>
          </div>
        </div>
      );

      setConfirmData({
        mensagem: "",
        customContent,
        onConfirm: () => {
          setConfirmModalOpen(false);
          return true;
        }
      });
      setConfirmModalOpen(true);
      return 'pending';
    }

    if (!possuiReferenciaUnidade1 && somaUnidade1 > 0) {
      fruta.quantidadeReal = somaUnidade1;
    }

    if (!possuiReferenciaUnidade2 && somaUnidade2 > 0) {
      fruta.quantidadeReal2 = somaUnidade2;
    }

    return true;
  };

  const handleSave = () => {
    if (selectedAreas.length === 0) {
      warning("Atenção", "Selecione pelo menos uma área");
      return;
    }

    // Validar quantidades
    let temErro = false;
    let mensagemErro = "";

    for (const area of selectedAreas) {
      const key = `${area.areaId}_${area.type}`;
      const quantidades = quantidadesPorArea[key];
      
      // Validar quantidade 1 (obrigatória)
      if (!quantidades?.quantidade1 || quantidades.quantidade1 <= 0) {
        const nomeArea = getAreaName(
          area.type === 'propria' 
            ? areasProprias.find(a => a.id === area.areaId)
            : areasFornecedores.find(a => a.id === area.areaId),
          area.type
        );
        mensagemErro = `Informe a quantidade colhida para "${nomeArea}"`;
        temErro = true;
        break;
      }

      // Quantidade 2 é opcional - não validar obrigatoriedade
    }

    if (temErro) {
      error("Erro", mensagemErro);
      return;
    }

    // Converter para formato esperado pelo backend
    const areasFormatted = selectedAreas.map(area => {
      const key = `${area.areaId}_${area.type}`;
      const quantidades = quantidadesPorArea[key];
      
      return {
        areaPropriaId: area.type === 'propria' ? area.areaId : undefined,
        areaFornecedorId: area.type === 'fornecedor' ? area.areaId : undefined,
        observacoes: observacoes || '',
        quantidadeColhidaUnidade1: quantidades?.quantidade1 ? Number(quantidades.quantidade1) : null,
        quantidadeColhidaUnidade2: quantidades?.quantidade2 ? Number(quantidades.quantidade2) : null
      };
    });

    // NOVA VALIDAÇÃO: Sincronizar quantidades
    const validacaoResult = validarESincronizarQuantidades(areasFormatted);
    
    if (validacaoResult === false) {
      return; // Parar se houver erro
    }
    
    if (validacaoResult === 'pending') {
      return; // Aguardando confirmação do usuário
    }

    // Continuar com salvamento
    onSave(areasFormatted);
    onClose();
  };

  // Função para confirmar ação do modal
  const handleConfirmAction = () => {
    if (confirmData?.onConfirm) {
      const result = confirmData.onConfirm();
      if (result === true) {
        // Continuar com salvamento
        const areasFormatted = selectedAreas.map(area => {
          const key = `${area.areaId}_${area.type}`;
          const quantidades = quantidadesPorArea[key];
          
          return {
            areaPropriaId: area.type === 'propria' ? area.areaId : undefined,
            areaFornecedorId: area.type === 'fornecedor' ? area.areaId : undefined,
            observacoes: observacoes || '',
            quantidadeColhidaUnidade1: quantidades?.quantidade1 ? Number(quantidades.quantidade1) : null,
            quantidadeColhidaUnidade2: quantidades?.quantidade2 ? Number(quantidades.quantidade2) : null
          };
        });

        onSave(areasFormatted);
        onClose();
      }
    }
  };

  const getAreaName = (area, type) => {
    if (!area) {
      return 'Área não encontrada';
    }
    
    if (type === 'propria') {
      return area.nome;
    } else {
      return `${area.nome} - ${area.fornecedor?.nome || 'Fornecedor'}`;
    }
  };

  // Função para filtrar áreas próprias
  const filteredAreasProprias = areasProprias.filter((area) =>
    area.nome.toLowerCase().includes(searchTermAreasProprias.toLowerCase())
  );

  // Função para filtrar áreas de fornecedores
  const filteredAreasFornecedores = areasFornecedores.filter((area) =>
    area.nome.toLowerCase().includes(searchTermAreasFornecedores.toLowerCase()) ||
    (area.fornecedor?.nome && area.fornecedor.nome.toLowerCase().includes(searchTermAreasFornecedores.toLowerCase()))
  );

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
            <LinkOutlined style={{ marginRight: "0.5rem" }} />
            {isMobile ? 'Vincular Áreas' : `Vincular Áreas - ${fruta?.frutaNome || 'Fruta'}`}
          </span>
        }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "50rem" }}
      styles={{
        body: { 
          maxHeight: "calc(100vh - 12.5rem)", 
          overflowY: "auto", 
          overflowX: "hidden", 
          padding: isMobile ? 12 : 20 
        },
        header: { 
          backgroundColor: "#059669", 
          borderBottom: "0.125rem solid #047857", 
          padding: 0 
        },
      }}
      centered
      destroyOnClose
    >
      {/* Informações da Fruta */}
      <Card
        title={
          <Space>
            <EnvironmentOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Informações da Fruta</span>
          </Space>
        }
        style={{ 
          marginBottom: isMobile ? 12 : 16, 
          border: "0.0625rem solid #e8e8e8", 
          borderRadius: "0.5rem", 
          backgroundColor: "#f9f9f9" 
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
          <Col span={8}>
            <Text strong>Fruta:</Text>
            <br />
            <Text>{fruta?.frutaNome}</Text>
          </Col>
          <Col span={8}>
            <Text strong>Quantidade Prevista:</Text>
            <br />
            <Text>{intFormatter(fruta?.quantidadePrevista)} {fruta?.unidadeMedida1}</Text>
          </Col>
          <Col span={8}>
            <Text strong>Áreas Selecionadas:</Text>
            <br />
            <Tag color="blue">{selectedAreas.length} área(s)</Tag>
          </Col>
        </Row>
      </Card>

      {/* Mensagem Informativa */}
      {(!fruta?.areas || fruta.areas.length === 0) && (
        <Card
          style={{ 
            marginBottom: isMobile ? 12 : 16, 
            border: "0.0625rem solid #f59e0b", 
            borderRadius: "0.5rem", 
            backgroundColor: "#fef3c7" 
          }}
          styles={{
            body: {
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          <Text style={{ color: "#92400e", fontSize: isMobile ? "0.8125rem" : "0.875rem" }}>
            <strong>ℹ️ Status:</strong> Esta fruta possui uma área pendente de definição. 
            Selecione uma ou mais áreas abaixo para substituir a área pendente. 
            Se não selecionar nenhuma área, a área pendente será mantida.
          </Text>
        </Card>
      )}

      {/* Áreas Próprias */}
      <Card
        title={
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            width: "100%",
            padding: "0 4px",
            flexDirection: isMobile ? "column" : "row",
          }}>
            <Space>
              <EnvironmentOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Áreas Próprias</span>
            </Space>
            <MiniInputSearchPersonalizavel
              placeholder="Buscar áreas próprias..."
              value={searchTermAreasProprias}
              onChange={setSearchTermAreasProprias}
              height={isMobile ? "28px" : "32px"}
              fontSize={isMobile ? "12px" : "13px"}
              iconColor="#10b981"
              iconSize={isMobile ? "12px" : "14px"}
              textColor="#10b981"
              style={{
                marginBottom: 0,
                flex: "1",
                width: isMobile ? "100%" : "auto",
              }}
            />
          </div>
        }
        style={{ 
          marginBottom: isMobile ? 12 : 16, 
          border: "0.0625rem solid #e8e8e8", 
          borderRadius: "0.5rem", 
          backgroundColor: "#f9f9f9" 
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
        loading={loadingDados}
      >
        <div style={{
          height: isMobile ? "250px" : "300px",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "0 4px"
        }}>
          {filteredAreasProprias.length > 0 ? (
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              {filteredAreasProprias.map((area) => (
              <Col xs={24} sm={12} md={8} key={`propria-${area.id}`}>
                <Card 
                  size="small"
                  style={{ 
                    border: isAreaSelected(area.id, 'propria') ? '2px solid #52c41a' : '1px solid #d9d9d9',
                    backgroundColor: isAreaSelected(area.id, 'propria') ? '#f6ffed' : '#fff'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Checkbox
                      checked={isAreaSelected(area.id, 'propria')}
                      onChange={(e) => handleAreaSelection(e.target.checked, area.id, 'propria')}
                    >
                      <Text strong>{area.nome?.toUpperCase()}</Text>
                    </Checkbox>
                    
                    {/* Tamanho da área */}
                    {area.areaTotal && (
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                        📏 {area.areaTotal} hectares
                      </Text>
                    )}
                    
                    {/* Culturas da área */}
                    {area.culturas && area.culturas.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {area.culturas.slice(0, 3).map((cultura, idx) => (
                          <Tag key={idx} size="small" color="green" style={{ fontSize: '10px', margin: 0 }}>
                            🌱 {(cultura.descricao || `Cultura ${cultura.culturaId}`).toUpperCase()}
                          </Tag>
                        ))}
                        {area.culturas.length > 3 && (
                          <Tag size="small" color="blue" style={{ fontSize: '10px', margin: 0 }}>
                            +{area.culturas.length - 3}
                          </Tag>
                        )}
                      </div>
                    )}
                    
                    {/* Caso não tenha culturas */}
                    {(!area.culturas || area.culturas.length === 0) && (
                      <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                        Sem culturas cadastradas
                      </Text>
                    )}
                  </Space>
                </Card>
              </Col>
              ))}
            </Row>
          ) : searchTermAreasProprias ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 0",
            backgroundColor: "#f7fafc",
            borderRadius: "6px",
            border: "1px solid #d1fae5",
          }}>
            <EnvironmentOutlined style={{ fontSize: 48, color: "#9ca3af" }} />
            <br />
            <Text style={{ color: "#059669", display: "block", marginTop: "8px" }}>
              Nenhuma área própria encontrada para "{searchTermAreasProprias}"
            </Text>
            <br />
            <Text style={{ color: "#059669" }}>
              Tente ajustar os termos de busca
            </Text>
          </div>
          ) : (
            <Empty description="Nenhuma área própria cadastrada" />
          )}
        </div>
      </Card>

      {/* Áreas de Fornecedores */}
      <Card
        title={
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            width: "100%",
            padding: "0 4px",
            flexDirection: isMobile ? "column" : "row",
          }}>
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Áreas de Fornecedores</span>
            </Space>
            <MiniInputSearchPersonalizavel
              placeholder="Buscar áreas de fornecedores..."
              value={searchTermAreasFornecedores}
              onChange={setSearchTermAreasFornecedores}
              height={isMobile ? "28px" : "32px"}
              fontSize={isMobile ? "12px" : "13px"}
              iconColor="#10b981"
              iconSize={isMobile ? "12px" : "14px"}
              textColor="#10b981"
              style={{
                marginBottom: 0,
                flex: "1",
                width: isMobile ? "100%" : "auto",
              }}
            />
          </div>
        }
        style={{ 
          marginBottom: isMobile ? 12 : 16, 
          border: "0.0625rem solid #e8e8e8", 
          borderRadius: "0.5rem", 
          backgroundColor: "#f9f9f9" 
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
        loading={loadingDados}
      >
        <div style={{
          height: isMobile ? "250px" : "300px",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "0 4px"
        }}>
          {filteredAreasFornecedores.length > 0 ? (
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              {filteredAreasFornecedores.map((area) => (
              <Col xs={24} sm={12} md={8} key={`fornecedor-${area.id}`}>
                <Card 
                  size="small"
                  style={{ 
                    border: isAreaSelected(area.id, 'fornecedor') ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    backgroundColor: isAreaSelected(area.id, 'fornecedor') ? '#f0f9ff' : '#fff'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Checkbox
                      checked={isAreaSelected(area.id, 'fornecedor')}
                      onChange={(e) => handleAreaSelection(e.target.checked, area.id, 'fornecedor')}
                    >
                      <Text strong>{area.nome?.toUpperCase()}</Text>
                    </Checkbox>
                    
                    {/* Fornecedor */}
                    <Tag size="small" color="blue" style={{ fontSize: '10px' }}>
                      👤 {area.fornecedor?.nome || 'Fornecedor'}
                    </Tag>
                    
                    {/* Cultura da área */}
                    {area.cultura && (
                      <Tag size="small" color="green" style={{ fontSize: '10px', margin: 0 }}>
                        🌱 {area.cultura.descricao?.toUpperCase() || 'Cultura'}
                      </Tag>
                    )}
                    
                    {/* Caso não tenha cultura */}
                    {!area.cultura && (
                      <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                        Sem cultura cadastrada
                      </Text>
                    )}
                  </Space>
                </Card>
              </Col>
              ))}
            </Row>
          ) : searchTermAreasFornecedores ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 0",
            backgroundColor: "#f7fafc",
            borderRadius: "6px",
            border: "1px solid #d1fae5",
          }}>
            <UserOutlined style={{ fontSize: 48, color: "#9ca3af" }} />
            <br />
            <Text style={{ color: "#059669", display: "block", marginTop: "8px" }}>
              Nenhuma área de fornecedor encontrada para "{searchTermAreasFornecedores}"
            </Text>
            <br />
            <Text style={{ color: "#059669" }}>
              Tente ajustar os termos de busca
            </Text>
          </div>
          ) : (
            <Empty description="Nenhuma área de fornecedor cadastrada" />
          )}
        </div>
      </Card>

      {/* Quantidades Colhidas por Área */}
      {selectedAreas.length > 0 && (
        <Card
          title={
            <Space>
              <EnvironmentOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Quantidades Colhidas por Área</span>
            </Space>
          }
          style={{ 
            marginBottom: isMobile ? 12 : 16, 
            border: "0.0625rem solid #e8e8e8", 
            borderRadius: "0.5rem", 
            backgroundColor: "#f9f9f9" 
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
          {selectedAreas.map((area, index) => {
            // ✅ CORREÇÃO: Buscar área nos dados carregados via API
            const areaData = area.type === 'propria'
              ? areasProprias.find(a => a.id === area.areaId)
              : areasFornecedores.find(a => a.id === area.areaId);

            // Se não encontrar nos dados da API, tentar em fruta.areas (modo edição)
            const areaOriginal = !areaData && fruta?.areas?.find(frutaArea =>
              (frutaArea.areaPropriaId === area.areaId && area.type === 'propria') ||
              (frutaArea.areaFornecedorId === area.areaId && area.type === 'fornecedor')
            );

            // Determinar nome da área
            const nomeArea = areaData
              ? getAreaName(areaData, area.type)
              : areaOriginal?.areaPropria?.nome || areaOriginal?.areaFornecedor?.nome ||
                (area.type === 'propria' ? `Área Própria ${area.areaId}` : `Área Fornecedor ${area.areaId}`);

            const key = `${area.areaId}_${area.type}`;
            const quantidades = quantidadesPorArea[key] || { quantidade1: '', quantidade2: '' };

            return (
              <div key={`${area.areaId}_${area.type}`} style={{ 
                marginBottom: index < selectedAreas.length - 1 ? "16px" : "0",
                padding: "12px",
                backgroundColor: "#ffffff",
                borderRadius: "6px",
                border: "1px solid #e8e8e8"
              }}>
                <Text strong style={{ color: "#059669", fontSize: isMobile ? "0.875rem" : "1rem", display: "block", marginBottom: "8px" }}>
                  {nomeArea}
                </Text>
                
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12}>
                    <MonetaryInput
                      placeholder="Ex: 500"
                      addonAfter={fruta?.unidadeMedida1 || ''}
                      size={isMobile ? "small" : "default"}
                      value={quantidades.quantidade1}
                      onChange={(value) => handleQuantidadeChange(area.areaId, area.type, 'quantidade1', value)}
                      style={{
                        borderRadius: "0.375rem",
                        borderColor: "#d9d9d9",
                        fontSize: isMobile ? "0.875rem" : "1rem"
                      }}
                    />
                  </Col>
                  
                  {fruta?.unidadeMedida2 && (
                    <Col xs={24} sm={12}>
                      <MonetaryInput
                        placeholder="Ex: 25"
                        addonAfter={fruta.unidadeMedida2}
                        size={isMobile ? "small" : "default"}
                        value={quantidades.quantidade2}
                        onChange={(value) => handleQuantidadeChange(area.areaId, area.type, 'quantidade2', value)}
                        style={{
                          borderRadius: "0.375rem",
                          borderColor: "#d9d9d9",
                          fontSize: isMobile ? "0.875rem" : "1rem"
                        }}
                      />
                    </Col>
                  )}
                </Row>
              </div>
            );
          })}
        </Card>
      )}

      {/* Observações */}
      <Card
        title={
          <Space>
            <EnvironmentOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Observações</span>
          </Space>
        }
        style={{ 
          marginBottom: isMobile ? 12 : 16, 
          border: "0.0625rem solid #e8e8e8", 
          borderRadius: "0.5rem", 
          backgroundColor: "#f9f9f9" 
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
        <TextArea
          rows={isMobile ? 2 : 3}
          size={isMobile ? "small" : "default"}
          placeholder="Observações sobre as áreas selecionadas (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          style={{
            borderRadius: "0.375rem",
            borderColor: "#d9d9d9",
            fontSize: isMobile ? "0.875rem" : "1rem"
          }}
        />
      </Card>

      {/* Botões de Ação */}
      <div style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        gap: isMobile ? "8px" : "12px", 
        marginTop: isMobile ? "1rem" : "1.5rem", 
        paddingTop: isMobile ? "12px" : "16px", 
        borderTop: "1px solid #e8e8e8" 
      }}>
        <Button 
          icon={<CloseOutlined />}
          onClick={onClose} 
          disabled={loading}
          size={isMobile ? "small" : "default"}
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
          onClick={handleSave}
          loading={loading}
          size={isMobile ? "small" : "default"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
            height: isMobile ? "32px" : "40px",
            padding: isMobile ? "0 12px" : "0 16px",
          }}
        >
          {isMobile ? 'Confirmar' : 'Confirmar Vinculação'}
        </Button>
      </div>
      </Modal>

        {/* Modal de Confirmação */}
        <ConfirmActionModal
          open={confirmModalOpen}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModalOpen(false)}
          title="Atenção - Quantidade Menor"
          message={confirmData?.mensagem || ""}
          confirmText="Sim, Continuar"
          cancelText="Cancelar"
          confirmButtonDanger={false}
          icon={<ExclamationCircleOutlined />}
          iconColor="#fa8c16"
          customContent={confirmData?.customContent || null}
        />
    </>
  );
};

export default VincularAreasModal;