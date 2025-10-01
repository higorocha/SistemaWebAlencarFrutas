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
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import useNotificationWithContext from "../../hooks/useNotificationWithContext";
import useResponsive from "../../hooks/useResponsive";

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

  // Hook para notificações com z-index correto
  const { error, warning, contextHolder } = useNotificationWithContext();
  
  // Hook para responsividade
  const { isMobile } = useResponsive();

  // Buscar dados quando modal abrir
  useEffect(() => {
    if (open) {
      fetchDados();
    }
  }, [open]);

  // Inicializar áreas selecionadas quando fruta mudar
  useEffect(() => {
    if (open && fruta) {
      initializeSelectedAreas();
    }
  }, [open, fruta]);

  const fetchDados = async () => {
    try {
      setLoadingDados(true);
      
      // Buscar áreas próprias (já inclui culturas)
      const responseAreasProprias = await axiosInstance.get("/api/areas-agricolas");
      setAreasProprias(responseAreasProprias.data || []);

      // Buscar áreas de fornecedores
      const responseAreasFornecedores = await axiosInstance.get("/api/areas-fornecedores");
      setAreasFornecedores(responseAreasFornecedores.data || []);
      
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
      
      setSelectedAreas(realAreas.map(area => ({
        id: area.id,
        type: area.areaPropriaId ? 'propria' : 'fornecedor',
        areaId: area.areaPropriaId || area.areaFornecedorId,
        observacoes: area.observacoes || ''
      })));
      setObservacoes(realAreas[0]?.observacoes || '');
    } else {
      setSelectedAreas([]);
      setObservacoes('');
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
    } else {
      // Remover área
      setSelectedAreas(prev => prev.filter(
        area => !(area.areaId === areaId && area.type === type)
      ));
    }
  };

  const isAreaSelected = (areaId, type) => {
    return selectedAreas.some(area => area.areaId === areaId && area.type === type);
  };

  const handleSave = () => {
    if (selectedAreas.length === 0) {
      warning("Atenção", "Selecione pelo menos uma área");
      return;
    }

    // Converter para formato esperado pelo backend
    const areasFormatted = selectedAreas.map(area => ({
      areaPropriaId: area.type === 'propria' ? area.areaId : undefined,
      areaFornecedorId: area.type === 'fornecedor' ? area.areaId : undefined,
      observacoes: observacoes || ''
    }));

    onSave(areasFormatted);
    onClose();
  };

  const getAreaName = (area, type) => {
    if (type === 'propria') {
      return area.nome;
    } else {
      return `${area.nome} - ${area.fornecedor?.nome || 'Fornecedor'}`;
    }
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
            <Text>{fruta?.quantidadePrevista} {fruta?.unidadeMedida1}</Text>
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
          <Space>
            <EnvironmentOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Áreas Próprias</span>
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
        loading={loadingDados}
      >
        {areasProprias.length > 0 ? (
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            {areasProprias.map((area) => (
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
        ) : (
          <Empty description="Nenhuma área própria cadastrada" />
        )}
      </Card>

      {/* Áreas de Fornecedores */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>Áreas de Fornecedores</span>
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
        loading={loadingDados}
      >
        {areasFornecedores.length > 0 ? (
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            {areasFornecedores.map((area) => (
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
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Nenhuma área de fornecedor cadastrada" />
        )}
      </Card>

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
          size={isMobile ? "small" : "middle"}
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
          onClick={handleSave}
          loading={loading}
          size={isMobile ? "small" : "middle"}
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
    </>
  );
};

export default VincularAreasModal;