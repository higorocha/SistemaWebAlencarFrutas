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
  Tooltip,
  Empty,
} from "antd";
import {
  EnvironmentOutlined,
  TagOutlined,
  BarChartOutlined,
  AimOutlined,
  FieldTimeOutlined,
  PlusCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import VincularCulturasModal from "./VincularCulturasModal";
import { PrimaryButton } from "../common/buttons";
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
  onCulturasReload,
}) => {
  const { isMobile } = useResponsive();
  const [gerenciarCulturasOpen, setGerenciarCulturasOpen] = useState(false);

  // Função para manipular mudanças nos campos
  const handleChange = (field, value) => {
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
        <Text style={{ fontWeight: "500", color: "#059669" }}>
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
              style={{ color: "#059669" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Form layout="vertical" size={isMobile ? "middle" : "large"}>
        {/* Seção 1: Dados Básicos */}
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados Básicos</span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
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
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: {
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "600", color: "#262626" }}>Nome da Área</span>
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
                  size={isMobile ? "middle" : "large"}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nome ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <HectaresInput
                label={
                  <Space>
                    <BarChartOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "600", color: "#262626" }}>Área Total</span>
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
                    <TagOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "600", color: "#262626" }}>Categoria</span>
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
                  size={isMobile ? "middle" : "large"}
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
            marginBottom: isMobile ? 12 : 16,
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
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: {
              padding: isMobile ? "12px" : "16px"
            }
          }}
          extra={
            <PrimaryButton
              icon={<AimOutlined />}
              onClick={() => {
                // Se já tem coordenadas, sempre entrar em modo de edição
                if (areaAtual.coordenadas && areaAtual.coordenadas.length > 0) {
                  abrirMapa(areaAtual, "edit");
                } else {
                  abrirMapa(areaAtual, "create");
                }
              }}
              size={isMobile ? "small" : "middle"}
              style={{
                height: isMobile ? "32px" : undefined,
                padding: isMobile ? "0 8px" : undefined,
              }}
            >
              {isMobile ? null : (areaAtual.coordenadas && areaAtual.coordenadas.length > 0 ? "Editar Coordenadas" : "Capturar Coordenadas")}
            </PrimaryButton>
          }
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col span={24}>
              {areaAtual.coordenadas && areaAtual.coordenadas.length > 0 ? (
                <div style={{
                  padding: isMobile ? "10px" : "12px",
                  backgroundColor: "#f6ffed",
                  borderRadius: "6px",
                  border: "1px solid #b7eb8f"
                }}>
                  <Text style={{ color: "#52c41a", fontWeight: "600", fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    ✓ Polígono capturado com {areaAtual.coordenadas.length} pontos
                  </Text>
                  <br />
                  <Text style={{ color: "#8c8c8c", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                    {isMobile ? "Toque no ícone acima para editar" : "Clique em \"Editar Coordenadas\" para modificar ou visualizar no mapa"}
                  </Text>
                </div>
              ) : (
                <div style={{
                  padding: isMobile ? "10px" : "12px",
                  backgroundColor: "#fff7e6",
                  borderRadius: "6px",
                  border: "1px solid #ffd591"
                }}>
                  <Text style={{ color: "#fa8c16", fontWeight: "600", fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    ⚠ Nenhuma coordenada capturada
                  </Text>
                  <br />
                  <Text style={{ color: "#8c8c8c", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                    {isMobile ? "Use o ícone acima para capturar" : "Use o botão \"Capturar Coordenadas\" para definir a localização da área"}
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
            marginBottom: isMobile ? 12 : 16,
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
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: {
              padding: isMobile ? "12px" : "16px"
            }
          }}
          extra={
            <PrimaryButton
              icon={<PlusCircleOutlined />}
              onClick={() => setGerenciarCulturasOpen(true)}
              size={isMobile ? "small" : "middle"}
              style={{
                height: isMobile ? "32px" : undefined,
                padding: isMobile ? "0 8px" : undefined,
              }}
            >
              {isMobile ? null : "Gerenciar Culturas"}
            </PrimaryButton>
          }
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col span={24}>
              {areaAtual.culturas && areaAtual.culturas.length > 0 ? (
                <ResponsiveTable
                  dataSource={areaAtual.culturas}
                  columns={colunasCulturas}
                  rowKey={(record, index) => index}
                  minWidthMobile={800}
                  showScrollHint={true}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Nenhuma cultura cadastrada"
                      />
                    ),
                  }}
                />
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: isMobile ? "24px 0" : "40px 0",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #d9d9d9",
                }}>
                  <FieldTimeOutlined style={{ fontSize: isMobile ? 36 : 48, color: "#bfbfbf" }} />
                  <br />
                  <Text style={{ color: "#8c8c8c", display: "block", marginTop: "8px", fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Nenhuma cultura cadastrada para esta área
                  </Text>
                  <br />
                  <Text style={{ color: "#8c8c8c", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                    Clique em "Gerenciar Culturas" para adicionar culturas
                  </Text>
                </div>
              )}
            </Col>
          </Row>

          {/* Resumo das culturas */}
          {areaAtual.culturas && areaAtual.culturas.length > 0 && (
            <Row gutter={[16, 16]} style={{
              marginTop: isMobile ? 12 : 16,
              padding: isMobile ? "12px 0" : "16px 0",
              borderTop: "1px solid #e8e8e8",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              margin: isMobile ? "12px 0 0 0" : "16px 0 0 0",
            }}>
              <Col span={24}>
                <Space wrap size={isMobile ? "small" : "middle"}>
                  <Text strong style={{ color: "#059669", fontSize: isMobile ? "0.875rem" : "1rem" }}>Resumo:</Text>
                  <Tag color="#059669" style={{ borderRadius: "4px", fontWeight: "500", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                    {areaAtual.culturas.length} cultura(s)
                  </Tag>
                  <Tag color="#059669" style={{ borderRadius: "4px", fontWeight: "500", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                    {areaAtual.culturas
                      .reduce((total, cultura) => total + (parseFloat(cultura.areaPlantada) || 0), 0)
                      .toFixed(2)} ha plantada
                  </Tag>
                  <Tag color="#fa8c16" style={{ borderRadius: "4px", fontWeight: "500", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
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
        onCulturasReload={onCulturasReload}
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
  onCulturasReload: PropTypes.func,
};

export default AreaForm; 