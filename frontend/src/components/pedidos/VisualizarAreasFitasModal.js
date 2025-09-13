// src/components/pedidos/VisualizarAreasFitasModal.js

import React from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Tag,
  Empty,
} from "antd";
import {
  LinkOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const VisualizarAreasFitasModal = ({
  open,
  onClose,
  fruta,
  tipo = 'areas', // 'areas' ou 'fitas'
  areasProprias = [],
  areasFornecedores = [],
  fitasBanana = [],
}) => {
  // Função para obter dados das áreas vinculadas
  const getAreasData = () => {
    if (!fruta?.areas) return [];
    
    const realAreas = fruta.areas.filter(area => 
      area.areaPropriaId || area.areaFornecedorId
    );

    return realAreas.map(area => {
      if (area.areaPropriaId) {
        const areaPropria = areasProprias.find(a => a.id === area.areaPropriaId);
        return {
          id: area.id,
          nome: areaPropria?.nome?.toUpperCase() || `ÁREA ${area.areaPropriaId}`,
          tipo: 'propria',
          observacoes: area.observacoes || '',
          detalhes: areaPropria ? {
            areaTotal: areaPropria.areaTotal,
            culturas: areaPropria.culturas || []
          } : null
        };
      } else {
        const areaFornecedor = areasFornecedores.find(a => a.id === area.areaFornecedorId);
        return {
          id: area.id,
          nome: areaFornecedor?.nome?.toUpperCase() || `ÁREA FORNECEDOR ${area.areaFornecedorId}`,
          tipo: 'fornecedor',
          observacoes: area.observacoes || '',
          detalhes: areaFornecedor ? {
            fornecedor: areaFornecedor.fornecedor?.nome
          } : null
        };
      }
    });
  };

  // Função para obter dados das fitas vinculadas
  const getFitasData = () => {
    if (!fruta?.fitas) return [];
    
    return fruta.fitas.map(fita => {
      const fitaBanana = fitasBanana.find(f => f.id === fita.fitaBananaId);
      return {
        id: fita.id,
        nome: fitaBanana?.nome?.toUpperCase() || `FITA ${fita.fitaBananaId}`,
        cor: fitaBanana?.corHex || '#52c41a',
        quantidade: fita.quantidadeFita,
        observacoes: fita.observacoes || ''
      };
    });
  };

  const dados = tipo === 'areas' ? getAreasData() : getFitasData();
  const titulo = tipo === 'areas' ? 'Áreas Vinculadas' : 'Fitas Vinculadas';
  const icone = tipo === 'areas' ? <EnvironmentOutlined /> : <TagOutlined />;

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
          {icone}
          <span style={{ marginLeft: 8 }}>{titulo} - {fruta?.frutaNome || 'Fruta'}</span>
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" icon={<CloseOutlined />} onClick={onClose} size="large">
          Fechar
        </Button>
      ]}
      width={800}
      styles={{
        body: { 
          maxHeight: "calc(100vh - 200px)", 
          overflowY: "auto", 
          overflowX: "hidden", 
          padding: 20 
        },
        header: { 
          backgroundColor: "#059669", 
          borderBottom: "2px solid #047857", 
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
            <LinkOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações da Fruta</span>
          </Space>
        }
        style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Fruta:</Text>
            <br />
            <Text>{fruta?.frutaNome}</Text>
          </Col>
          <Col span={8}>
            <Text strong>Quantidade Real:</Text>
            <br />
            <Text>{fruta?.quantidadeReal} {fruta?.unidadeMedida1}</Text>
          </Col>
          <Col span={8}>
            <Text strong>{tipo === 'areas' ? 'Áreas' : 'Fitas'} Vinculadas:</Text>
            <br />
            <Tag color={tipo === 'areas' ? 'green' : 'purple'}>{dados.length} {tipo === 'areas' ? 'área(s)' : 'fita(s)'}</Tag>
          </Col>
        </Row>
      </Card>

      {/* Lista de Áreas ou Fitas */}
      <Card
        title={
          <Space>
            {icone}
            <span style={{ color: "#ffffff", fontWeight: "600" }}>{titulo}</span>
          </Space>
        }
        style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
      >
        {dados.length > 0 ? (
          <Row gutter={[16, 16]}>
            {dados.map((item, index) => (
              <Col xs={24} sm={12} lg={8} key={item.id || index}>
                <Card 
                  size="small"
                  style={{ 
                    border: '1px solid #d9d9d9',
                    backgroundColor: '#fff'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {/* Nome */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {tipo === 'fitas' && (
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: item.cor,
                            borderRadius: '50%',
                            border: '1px solid #d9d9d9',
                            display: 'inline-block'
                          }}
                        />
                      )}
                      <Text strong>{item.nome}</Text>
                    </div>

                    {/* Tipo da área */}
                    {tipo === 'areas' && (
                      <Tag 
                        size="small" 
                        color={item.tipo === 'propria' ? 'green' : 'blue'}
                        style={{ fontSize: '10px' }}
                      >
                        {item.tipo === 'propria' ? '🏠 PRÓPRIA' : '👤 FORNECEDOR'}
                      </Tag>
                    )}

                    {/* Quantidade para fitas */}
                    {tipo === 'fitas' && item.quantidade && (
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                        📊 {item.quantidade} fitas
                      </Text>
                    )}

                    {/* Detalhes das áreas */}
                    {tipo === 'areas' && item.detalhes && (
                      <>
                        {item.detalhes.areaTotal && (
                          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                            📏 {item.detalhes.areaTotal} hectares
                          </Text>
                        )}
                        
                        {item.detalhes.fornecedor && (
                          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                            👤 {item.detalhes.fornecedor}
                          </Text>
                        )}

                        {item.detalhes.culturas && item.detalhes.culturas.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {item.detalhes.culturas.slice(0, 2).map((cultura, idx) => (
                              <Tag key={idx} size="small" color="green" style={{ fontSize: '10px', margin: 0 }}>
                                🌱 {(cultura.descricao || `Cultura ${cultura.culturaId}`).toUpperCase()}
                              </Tag>
                            ))}
                            {item.detalhes.culturas.length > 2 && (
                              <Tag size="small" color="blue" style={{ fontSize: '10px', margin: 0 }}>
                                +{item.detalhes.culturas.length - 2}
                              </Tag>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Observações */}
                    {item.observacoes && (
                      <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                        💬 {item.observacoes}
                      </Text>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description={`Nenhuma ${tipo === 'areas' ? 'área' : 'fita'} vinculada`} />
        )}
      </Card>
    </Modal>
  );
};

export default VisualizarAreasFitasModal;