// src/components/areas/AreaDetalhesDialog.js

import React from "react";
import {
  Modal,
  Button,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Table,
  Descriptions,
  Divider,
} from "antd";
import {
  EnvironmentOutlined,
  TagOutlined,
  BarChartOutlined,
  FieldTimeOutlined,
  AimOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";

const { Title, Text } = Typography;

const AreaDetalhesDialog = ({
  open,
  onClose,
  areaDetalhes = null,
  mapCenter = { lat: -3.7899, lng: -40.4588 },
}) => {
  if (!areaDetalhes) return null;

  // Função para formatar categoria
  const formatarCategoria = (categoria) => {
    const categorias = {
      COLONO: { texto: "Colono", cor: "#52c41a" },
      TECNICO: { texto: "Técnico", cor: "#1890ff" },
      EMPRESARIAL: { texto: "Empresarial", cor: "#722ed1" },
      ADJACENTE: { texto: "Adjacente", cor: "#fa8c16" },
    };
    
    const config = categorias[categoria] || { texto: categoria, cor: "#d9d9d9" };
    return (
      <Tag 
        color={config.cor} 
        style={{ 
          borderRadius: "4px", 
          fontWeight: "500",
          fontSize: "13px",
          border: "none",
        }}
      >
        {config.texto}
      </Tag>
    );
  };

  // Função para formatar área
  const formatarArea = (area) => {
    if (!area && area !== 0) return "-";
    return `${Number(area).toFixed(2)} ha`;
  };

  // Função para calcular totais das culturas
  const calcularTotais = (culturas) => {
    if (!culturas || culturas.length === 0) {
      return { totalPlantada: 0, totalProduzindo: 0 };
    }
    
    return culturas.reduce(
      (acc, cultura) => ({
        totalPlantada: acc.totalPlantada + (parseFloat(cultura.areaPlantada) || 0),
        totalProduzindo: acc.totalProduzindo + (parseFloat(cultura.areaProduzindo) || 0),
      }),
      { totalPlantada: 0, totalProduzindo: 0 }
    );
  };

  // Função para formatar coordenadas
  const formatarCoordenadas = (coordenadas) => {
    if (!coordenadas || coordenadas.length === 0) {
      return "Nenhuma coordenada cadastrada";
    }
    
    return coordenadas.map((coord, index) => 
      `${index + 1}. ${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`
    ).join("\n");
  };

  // Configuração das colunas da tabela de culturas
  const colunasCulturas = [
    {
      title: "Cultura",
      key: "cultura",
      render: (_, record) => {
        const cultura = areaDetalhes.culturas?.find(c => c.id === record.culturaId);
        return (
          <Space>
            <Tag color="#059669" style={{ borderRadius: "4px", fontWeight: "500" }}>
              {cultura ? cultura.descricao : "Cultura não encontrada"}
            </Tag>
            {cultura && cultura.periodicidade && (
              <Tag color={cultura.periodicidade === "PERENE" ? "#10b981" : "#fa8c16"} style={{ borderRadius: "4px" }}>
                {cultura.periodicidade}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Área Plantada (ha)",
      dataIndex: "areaPlantada",
      key: "areaPlantada",
      render: (area) => (
        <Text style={{ fontWeight: "500", color: "#059669" }}>
          {Number(area || 0).toFixed(2)} ha
        </Text>
      ),
    },
    {
      title: "Área Produzindo (ha)",
      dataIndex: "areaProduzindo",
      key: "areaProduzindo",
      render: (area) => (
        <Text style={{ fontWeight: "500", color: "#10b981" }}>
          {Number(area || 0).toFixed(2)} ha
        </Text>
      ),
    },
  ];

  const totais = calcularTotais(areaDetalhes.culturas);

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
          Detalhes da Área Agrícola
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button 
          key="close" 
          onClick={onClose}
          size="large"
          style={{
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          Fechar
        </Button>,
      ]}
      width={900}
      styles={{
        body: { 
          maxHeight: "80vh", 
          overflowY: "auto",
          padding: "20px",
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        }
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Seção 1: Informações Gerais */}
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações Gerais</span>
            </Space>
          }
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Descriptions column={2} size="middle">
            <Descriptions.Item label="Nome da Área" span={2}>
              <Text strong style={{ color: "#059669" }}>
                {areaDetalhes.nome}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Categoria">
              {formatarCategoria(areaDetalhes.categoria)}
            </Descriptions.Item>
            <Descriptions.Item label="Área Total">
              <Text strong style={{ color: "#1890ff" }}>
                {formatarArea(areaDetalhes.areaTotal)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Seção 2: Coordenadas Geográficas */}
        <Card
          title={
            <Space>
              <AimOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Coordenadas Geográficas</span>
            </Space>
          }
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <div style={{ 
            padding: "12px", 
            backgroundColor: "#f7fafc", 
            borderRadius: "6px", 
            border: "1px solid #d1fae5",
            fontFamily: "monospace",
            fontSize: "12px",
            whiteSpace: "pre-line",
            maxHeight: "200px",
            overflowY: "auto"
          }}>
            {formatarCoordenadas(areaDetalhes.coordenadas)}
          </div>
        </Card>

        {/* Seção 3: Culturas */}
        <Card
          title={
            <Space>
              <FieldTimeOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Culturas</span>
            </Space>
          }
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
        >
          {areaDetalhes.culturas && areaDetalhes.culturas.length > 0 ? (
            <>
              <Table
                dataSource={areaDetalhes.culturas}
                columns={colunasCulturas}
                rowKey={(record, index) => index}
                pagination={false}
                size="small"
                style={{
                  border: "1px solid #d1fae5",
                  borderRadius: "8px",
                }}
              />
              
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Space wrap size="middle">
                    <Text strong style={{ color: "#059669" }}>Resumo:</Text>
                    <Tag color="#059669" style={{ borderRadius: "4px", fontWeight: "500" }}>
                      {areaDetalhes.culturas.length} cultura(s)
                    </Tag>
                    <Tag color="#059669" style={{ borderRadius: "4px", fontWeight: "500" }}>
                      {totais.totalPlantada.toFixed(2)} ha plantada
                    </Tag>
                    <Tag color="#fa8c16" style={{ borderRadius: "4px", fontWeight: "500" }}>
                      {totais.totalProduzindo.toFixed(2)} ha produzindo
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </>
          ) : (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 0",
              backgroundColor: "#f7fafc",
              borderRadius: "6px",
              border: "1px solid #d1fae5",
            }}>
              <FieldTimeOutlined style={{ fontSize: 48, color: "#9ca3af" }} />
              <br />
              <Text style={{ color: "#059669", display: "block", marginTop: "8px" }}>
                Nenhuma cultura cadastrada para esta área
              </Text>
            </div>
          )}
        </Card>
      </Space>
    </Modal>
  );
};

AreaDetalhesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  areaDetalhes: PropTypes.object,
  mapCenter: PropTypes.object,
};

export default AreaDetalhesDialog; 