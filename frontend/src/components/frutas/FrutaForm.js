// src/components/frutas/FrutaForm.js

import React from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Tag,
} from "antd";
import {
  TagOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const FrutaForm = ({
  frutaAtual,
  setFrutaAtual,
  editando,
  erros,
  setErros,
}) => {

  const handleChange = (field, value) => {
    setFrutaAtual((prevState) => ({
      ...prevState,
      [field]: value,
    }));

    // Limpar erro do campo quando o usuário começa a digitar
    if (erros[field]) {
      setErros((prevErros) => ({
        ...prevErros,
        [field]: undefined,
      }));
    }
  };

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Informações Básicas */}
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações Básicas</span>
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
                    <TagOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome da Fruta</span>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Ex: Maçã Gala"
                  value={frutaAtual.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nome ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <BarChartOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Código</span>
                  </Space>
                }
                validateStatus={erros.codigo ? "error" : ""}
                help={erros.codigo}
              >
                <Input
                  placeholder="Ex: MAC001"
                  value={frutaAtual.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.codigo ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <TagOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Categoria</span>
                  </Space>
                }
                validateStatus={erros.categoria ? "error" : ""}
                help={erros.categoria}
              >
                <Select
                  placeholder="Selecione a categoria"
                  value={frutaAtual.categoria || undefined}
                  onChange={(value) => handleChange("categoria", value)}
                  style={{
                    borderRadius: "6px",
                  }}
                  allowClear
                >
                  <Option value="CITRICOS">
                    <Space>
                      <Tag color="#fa8c16" style={{ borderRadius: "4px" }}>Cítricos</Tag>
                    </Space>
                  </Option>
                  <Option value="TROPICAIS">
                    <Space>
                      <Tag color="#52c41a" style={{ borderRadius: "4px" }}>Tropicais</Tag>
                    </Space>
                  </Option>
                  <Option value="TEMPERADAS">
                    <Space>
                      <Tag color="#1890ff" style={{ borderRadius: "4px" }}>Temperadas</Tag>
                    </Space>
                  </Option>
                  <Option value="SECAS">
                    <Space>
                      <Tag color="#722ed1" style={{ borderRadius: "4px" }}>Secas</Tag>
                    </Space>
                  </Option>
                  <Option value="EXOTICAS">
                    <Space>
                      <Tag color="#eb2f96" style={{ borderRadius: "4px" }}>Exóticas</Tag>
                    </Space>
                  </Option>
                  <Option value="VERMELHAS">
                    <Space>
                      <Tag color="#f5222d" style={{ borderRadius: "4px" }}>Vermelhas</Tag>
                    </Space>
                  </Option>
                  <Option value="VERDES">
                    <Space>
                      <Tag color="#13c2c2" style={{ borderRadius: "4px" }}>Verdes</Tag>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <InfoCircleOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Status</span>
                  </Space>
                }
                validateStatus={erros.status ? "error" : ""}
                help={erros.status}
              >
                <Select
                  placeholder="Selecione o status"
                  value={frutaAtual.status || undefined}
                  onChange={(value) => handleChange("status", value)}
                  style={{
                    borderRadius: "6px",
                  }}
                >
                  <Option value="ATIVA">
                    <Space>
                      <Tag color="#52c41a" style={{ borderRadius: "4px" }}>Ativa</Tag>
                    </Space>
                  </Option>
                  <Option value="INATIVA">
                    <Space>
                      <Tag color="#ff4d4f" style={{ borderRadius: "4px" }}>Inativa</Tag>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Informações Detalhadas */}
        <Card
          title={
            <Space>
              <InfoCircleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações Detalhadas</span>
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
                    <InfoCircleOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome Científico</span>
                  </Space>
                }
                validateStatus={erros.nomeCientifico ? "error" : ""}
                help={erros.nomeCientifico}
              >
                <Input
                  placeholder="Ex: Citrullus lanatus"
                  value={frutaAtual.nomeCientifico}
                  onChange={(e) => handleChange("nomeCientifico", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nomeCientifico ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <BarChartOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Cor Predominante</span>
                  </Space>
                }
                validateStatus={erros.corPredominante ? "error" : ""}
                help={erros.corPredominante}
              >
                <Input
                  placeholder="Ex: Vermelha"
                  value={frutaAtual.corPredominante}
                  onChange={(e) => handleChange("corPredominante", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.corPredominante ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <BarChartOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Época de Colheita</span>
                  </Space>
                }
                validateStatus={erros.epocaColheita ? "error" : ""}
                help={erros.epocaColheita}
              >
                <Input
                  placeholder="Ex: Março a Junho"
                  value={frutaAtual.epocaColheita}
                  onChange={(e) => handleChange("epocaColheita", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.epocaColheita ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 3: Descrição e Observações */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Descrição e Observações</span>
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
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Descrição</span>
                  </Space>
                }
                validateStatus={erros.descricao ? "error" : ""}
                help={erros.descricao}
              >
                <TextArea
                  placeholder="Descreva as características da fruta..."
                  value={frutaAtual.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  rows={3}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.descricao ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações</span>
                  </Space>
                }
                validateStatus={erros.observacoes ? "error" : ""}
                help={erros.observacoes}
              >
                <TextArea
                  placeholder="Observações adicionais sobre a fruta..."
                  value={frutaAtual.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  rows={3}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.observacoes ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

FrutaForm.propTypes = {
  frutaAtual: PropTypes.object.isRequired,
  setFrutaAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
};

export default FrutaForm; 