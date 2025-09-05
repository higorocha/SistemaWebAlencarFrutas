// src/components/areas/AreaForm.js

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Select,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Table,
  Tooltip,
} from "antd";
import {
  EnvironmentOutlined,
  TagOutlined,
  BarChartOutlined,
  AimOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTheme } from "@mui/material/styles";
import VincularCulturasModal from "./VincularCulturasModal";
import { HeaderButton } from "../common/buttons";
import { HectaresInput } from "../common/inputs";

const { Option } = Select;
const { Title, Text } = Typography;

const AreaForm = ({
  areaAtual,
  setAreaAtual,
  editando,
  culturas,
  erros,
  setErros,
  abrirMapa,
}) => {
  const [gerenciarCulturasOpen, setGerenciarCulturasOpen] = useState(false);
  const theme = useTheme();

  // Função para manipular mudanças nos campos
  const handleChange = (field, value) => {
    console.log("DEBUG_FORM: handleChange chamado:", field, value?.length ? `${value.length} items` : value);
    setAreaAtual(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Configuração das colunas da tabela de culturas
  const colunasCulturas = [
    {
      title: "Cultura",
      key: "cultura",
      render: (_, record) => {
        const cultura = culturas.find(c => c.id === record.culturaId);
        return (
          <Space>
            <Tag color={theme.palette.forms.fieldSuccess} style={{ borderRadius: "4px", fontWeight: "500" }}>
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
        <Text style={{ fontWeight: "500", color: theme.palette.forms.fieldGroupHeader }}>
          {Number(area || 0).toFixed(2)} ha
        </Text>
      ),
    },
    {
      title: "Área Produzindo (ha)",
      dataIndex: "areaProduzindo",
      key: "areaProduzindo",
      render: (area) => (
        <Text style={{ fontWeight: "500", color: theme.palette.forms.fieldSuccess }}>
          {Number(area || 0).toFixed(2)} ha
        </Text>
      ),
    },
    {
      title: "Ações",
      key: "acoes",
      width: 100,
      render: (_, record, index) => (
        <Space>
          <Tooltip title="Gerenciar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setGerenciarCulturasOpen(true)}
              style={{ color: theme.palette.forms.fieldGroupHeader }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Dados Básicos */}
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados Básicos</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: `1px solid ${theme.palette.forms.sectionBorder}`,
            borderRadius: "8px",
            backgroundColor: theme.palette.forms.sectionBackground,
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: `2px solid #047857`,
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: theme.palette.forms.sectionHeader }} />
                    <span style={{ fontWeight: "600", color: theme.palette.forms.labelText }}>Nome da Área</span>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Digite o nome da área agrícola"
                  value={areaAtual.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nome ? theme.palette.forms.fieldError : theme.palette.forms.fieldGroupBorder,
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
                          <HectaresInput
              label={
                <Space>
                  <BarChartOutlined style={{ color: theme.palette.forms.sectionHeader }} />
                  <span style={{ fontWeight: "600", color: theme.palette.forms.labelText }}>Área Total</span>
                </Space>
              }
              value={areaAtual.areaTotal && parseFloat(areaAtual.areaTotal) > 0 ? areaAtual.areaTotal.toString() : ""}
              onChange={(value) => handleChange("areaTotal", value)}
              error={erros.areaTotal}
              required
              placeholder="0,00 ha"
            />
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <TagOutlined style={{ color: theme.palette.forms.sectionHeader }} />
                    <span style={{ fontWeight: "600", color: theme.palette.forms.labelText }}>Categoria</span>
                  </Space>
                }
                validateStatus={erros.categoria ? "error" : ""}
                help={erros.categoria}
                required
              >
                <Select
                  placeholder="Selecione a categoria"
                  value={areaAtual.categoria}
                  onChange={(value) => handleChange("categoria", value)}
                  style={{
                    borderRadius: "6px",
                  }}
                >
                  <Option value="COLONO">
                    <Space>
                      <Tag color="#52c41a" style={{ borderRadius: "4px" }}>Colono</Tag>
                    </Space>
                  </Option>
                  <Option value="TECNICO">
                    <Space>
                      <Tag color="#1890ff" style={{ borderRadius: "4px" }}>Técnico</Tag>
                    </Space>
                  </Option>
                  <Option value="EMPRESARIAL">
                    <Space>
                      <Tag color="#722ed1" style={{ borderRadius: "4px" }}>Empresarial</Tag>
                    </Space>
                  </Option>
                  <Option value="ADJACENTE">
                    <Space>
                      <Tag color="#fa8c16" style={{ borderRadius: "4px" }}>Adjacente</Tag>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Coordenadas Geográficas */}
        <Card
          title={
            <Space>
              <AimOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Coordenadas Geográficas</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: `1px solid ${theme.palette.forms.sectionBorder}`,
            borderRadius: "8px",
            backgroundColor: theme.palette.forms.sectionBackground,
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: `2px solid #047857`,
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
          extra={
            <HeaderButton
              icon={<AimOutlined />}
              onClick={() => {
                // Se já tem coordenadas, sempre entrar em modo de edição
                if (areaAtual.coordenadas && areaAtual.coordenadas.length > 0) {
                  console.log("DEBUG_FORM: Editando coordenadas existentes:", areaAtual.coordenadas.length);
                  abrirMapa(areaAtual, "edit");
                } else {
                  console.log("DEBUG_FORM: Criando novas coordenadas");
                  abrirMapa(areaAtual, "create");
                }
              }}
            >
              {areaAtual.coordenadas && areaAtual.coordenadas.length > 0 ? "Editar Coordenadas" : "Capturar Coordenadas"}
            </HeaderButton>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              {areaAtual.coordenadas && areaAtual.coordenadas.length > 0 ? (
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: theme.palette.forms.fieldGroupBackground, 
                  borderRadius: "6px", 
                  border: `1px solid ${theme.palette.forms.fieldGroupBorder}` 
                }}>
                  <Text style={{ color: theme.palette.forms.fieldSuccess, fontWeight: "600" }}>
                    ✓ Polígono capturado com {areaAtual.coordenadas.length} pontos
                  </Text>
                  <br />
                  <Text style={{ color: theme.palette.forms.helperText }}>
                    Clique em "Editar Coordenadas" para modificar ou visualizar no mapa
                  </Text>
                </div>
              ) : (
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "#fff7e6", 
                  borderRadius: "6px", 
                  border: "1px solid #ffd591" 
                }}>
                  <Text style={{ color: "#fa8c16", fontWeight: "600" }}>
                    ⚠ Nenhuma coordenada capturada
                  </Text>
                  <br />
                  <Text type="secondary">
                    Use o botão "Capturar Coordenadas" para definir a localização da área
                  </Text>
                </div>
              )}
            </Col>
          </Row>
        </Card>

        {/* Seção 3: Culturas */}
        <Card
          title={
            <Space>
              <FieldTimeOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Culturas</span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: `1px solid ${theme.palette.forms.sectionBorder}`,
            borderRadius: "8px",
            backgroundColor: theme.palette.forms.sectionBackground,
          }}
          headStyle={{
            backgroundColor: "#059669",
            borderBottom: `2px solid #047857`,
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          }}
          extra={
            <HeaderButton
              icon={<PlusOutlined />}
              onClick={() => setGerenciarCulturasOpen(true)}
            >
              Gerenciar Culturas
            </HeaderButton>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              {areaAtual.culturas && areaAtual.culturas.length > 0 ? (
                <Table
                  dataSource={areaAtual.culturas}
                  columns={colunasCulturas}
                  rowKey={(record, index) => index}
                  pagination={false}
                  size="small"
                  locale={{
                    emptyText: "Nenhuma cultura cadastrada",
                  }}
                  style={{
                    border: `1px solid ${theme.palette.forms.fieldGroupBorder}`,
                    borderRadius: "8px",
                  }}
                  components={{
                    header: {
                      cell: (props) => (
                        <th
                          {...props}
                          style={{
                            ...props.style,
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            fontWeight: 600,
                            padding: '8px 12px',
                            fontSize: '14px',
                            borderBottom: 'none',
                          }}
                        />
                      ),
                    },
                  }}
                />
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px 0",
                  backgroundColor: theme.palette.forms.fieldGroupBackground,
                  borderRadius: "6px",
                  border: `1px solid ${theme.palette.forms.fieldGroupBorder}`,
                }}>
                  <FieldTimeOutlined style={{ fontSize: 48, color: theme.palette.forms.fieldDisabled }} />
                  <br />
                  <Text style={{ color: theme.palette.forms.helperText, display: "block", marginTop: "8px" }}>
                    Nenhuma cultura cadastrada para esta área
                  </Text>
                  <br />
                  <Text style={{ color: theme.palette.forms.helperText }}>
                    Clique em "Gerenciar Culturas" para adicionar culturas
                  </Text>
                </div>
              )}
            </Col>
          </Row>

          {/* Resumo das culturas */}
          {areaAtual.culturas && areaAtual.culturas.length > 0 && (
            <Row gutter={[16, 16]} style={{ 
              marginTop: 16, 
              padding: "16px 0", 
              borderTop: `1px solid ${theme.palette.forms.fieldGroupBorder}`,
              backgroundColor: theme.palette.forms.fieldGroupBackground,
              borderRadius: "6px",
              margin: "16px 0 0 0",
            }}>
              <Col span={24}>
                <Space wrap size="middle">
                  <Text strong style={{ color: theme.palette.forms.sectionHeader }}>Resumo:</Text>
                  <Tag color={theme.palette.forms.fieldSuccess} style={{ borderRadius: "4px", fontWeight: "500" }}>
                    {areaAtual.culturas.length} cultura(s)
                  </Tag>
                  <Tag color={theme.palette.forms.fieldSuccess} style={{ borderRadius: "4px", fontWeight: "500" }}>
                    {areaAtual.culturas
                      .reduce((total, cultura) => total + (parseFloat(cultura.areaPlantada) || 0), 0)
                      .toFixed(2)} ha plantada
                  </Tag>
                  <Tag color="#fa8c16" style={{ borderRadius: "4px", fontWeight: "500" }}>
                    {areaAtual.culturas
                      .reduce((total, cultura) => total + (parseFloat(cultura.areaProduzindo) || 0), 0)
                      .toFixed(2)} ha produzindo
                  </Tag>
                </Space>
              </Col>
            </Row>
          )}
        </Card>
      </Form>

      {/* Modal de Vinculação de Culturas */}
      <VincularCulturasModal
        open={gerenciarCulturasOpen}
        onClose={() => setGerenciarCulturasOpen(false)}
        culturas={culturas}
        culturasArea={areaAtual.culturas || []}
        onUpdateCulturas={(novasCulturas) => handleChange("culturas", novasCulturas)}
      />
    </div>
  );
};

AreaForm.propTypes = {
  areaAtual: PropTypes.object.isRequired,
  setAreaAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  culturas: PropTypes.array.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  abrirMapa: PropTypes.func.isRequired,
};

export default AreaForm; 