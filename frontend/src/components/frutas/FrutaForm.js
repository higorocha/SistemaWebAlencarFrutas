// src/components/frutas/FrutaForm.js

import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
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
  Spin,
  Switch,
  Tooltip,
} from "antd";
import {
  TagOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { capitalizeName } from "../../utils/formatters";
import { showNotification } from "../../config/notificationConfig";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const ClassificationSwitchWrapper = styled.div`
  width: 100%;
  border: 2px solid #e8f5e8;
  border-radius: 12px;
  padding: 12px 16px;
  height: 48px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: #10b981;
    box-shadow: 0 4px 16px rgba(5, 150, 105, 0.1);
  }

  .ant-switch {
    transform: scale(1.12);
  }
`;

const ClassificationSwitch = styled(Switch)`
  &.ant-switch-checked {
    background-color: #059669 !important;
  }

  &:not(.ant-switch-disabled).ant-switch-checked:hover {
    background-color: #047857 !important;
  }
`;

const FrutaForm = ({
  frutaAtual,
  setFrutaAtual,
  editando,
  erros,
  setErros,
  todasFrutas = [],
}) => {
  const [culturas, setCulturas] = useState([]);
  const [loadingCulturas, setLoadingCulturas] = useState(false);

  // Buscar culturas ao montar o componente
  useEffect(() => {
    const buscarCulturas = async () => {
      try {
        setLoadingCulturas(true);
        const response = await axiosInstance.get("/api/culturas");
        
        // Extrair array de culturas (pode vir em data.data ou diretamente em data)
        let todasCulturas = [];
        if (Array.isArray(response.data)) {
          todasCulturas = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          todasCulturas = response.data.data;
        }
        
        // Não filtra por status pois o modelo Cultura não possui esse campo
        setCulturas(todasCulturas);
      } catch (error) {
        console.error("Erro ao buscar culturas:", error);
        showNotification("error", "Erro", "Erro ao carregar culturas.");
      } finally {
        setLoadingCulturas(false);
      }
    };

    buscarCulturas();
  }, []);

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

  const frutaSelecionadaId = frutaAtual?.id;
  const culturaSelecionada = frutaAtual?.culturaId;

  const outraFrutaDePrimeira = useMemo(() => {
    if (!culturaSelecionada) return undefined;

    return todasFrutas?.find(
      (fruta) =>
        fruta.culturaId === culturaSelecionada &&
        fruta.dePrimeira === true &&
        fruta.id !== frutaSelecionadaId
    );
  }, [todasFrutas, culturaSelecionada, frutaSelecionadaId]);

  const classificacaoBloqueada = Boolean(
    outraFrutaDePrimeira && !frutaAtual.dePrimeira
  );

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
                    <span style={{ fontWeight: "700", color: "#333" }}>Cultura</span>
                  </Space>
                }
                validateStatus={erros.culturaId ? "error" : ""}
                help={erros.culturaId}
                required
              >
                <Select
                  placeholder="Selecione a cultura"
                  value={frutaAtual.culturaId || undefined}
                  onChange={(value) => handleChange("culturaId", value)}
                  style={{
                    borderRadius: "6px",
                  }}
                  loading={loadingCulturas}
                  notFoundContent={loadingCulturas ? <Spin size="small" /> : "Nenhuma cultura encontrada"}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {culturas.map((cultura) => (
                    <Option key={cultura.id} value={cultura.id}>
                      {cultura.descricao}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={7}>
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

            <Col xs={24} md={5}>
              <Form.Item
                label={
                  <Space>
                    <Tooltip title='Marque como "de primeira" quando esta fruta for a principal da cultura.'>
                      <InfoCircleOutlined style={{ color: "#059669" }} />
                    </Tooltip>
                    <span style={{ fontWeight: "700", color: "#333" }}>
                      Classificação
                    </span>
                  </Space>
                }
                help={
                  classificacaoBloqueada
                    ? `Já existe uma fruta de primeira nesta cultura: ${capitalizeName(
                        outraFrutaDePrimeira?.nome || ""
                      )}.`
                    : undefined
                }
              >
                <ClassificationSwitchWrapper>
                  {classificacaoBloqueada ? (
                    <Tooltip
                      title={`Já existe uma fruta de primeira nesta cultura: ${capitalizeName(
                        outraFrutaDePrimeira?.nome || ""
                      )}.`}
                    >
                      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        <ClassificationSwitch
                          checked={Boolean(frutaAtual.dePrimeira)}
                          onChange={(value) => handleChange("dePrimeira", value)}
                          disabled
                          checkedChildren="Primeira"
                          unCheckedChildren="Segunda"
                        />
                      </div>
                    </Tooltip>
                  ) : (
                    <ClassificationSwitch
                      checked={Boolean(frutaAtual.dePrimeira)}
                      onChange={(value) => handleChange("dePrimeira", value)}
                      checkedChildren="Primeira"
                      unCheckedChildren="Segunda"
                    />
                  )}
                </ClassificationSwitchWrapper>
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
  todasFrutas: PropTypes.array,
};

FrutaForm.defaultProps = {
  todasFrutas: [],
};

export default FrutaForm; 