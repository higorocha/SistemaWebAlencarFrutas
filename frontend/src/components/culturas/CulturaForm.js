// src/components/culturas/CulturaForm.js

import React from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Card,
  Space,
  Tag,
} from "antd";
import {
  TagOutlined,
  ClockCircleOutlined,
  PartitionOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const CulturaForm = ({
  culturaAtual,
  setCulturaAtual,
  editando,
  erros,
  setErros,
}) => {

  const handleChange = (field, value) => {
    setCulturaAtual((prevState) => ({
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
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações da Cultura</span>
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
                    <TagOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Descrição da Cultura</span>
                  </Space>
                }
                validateStatus={erros.descricao ? "error" : ""}
                help={erros.descricao}
                required
              >
                <Input
                  placeholder="Ex: Banana Prata"
                  value={culturaAtual.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.descricao ? "#ff4d4f" : "#d9d9d9",
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
                    <ClockCircleOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Periodicidade</span>
                  </Space>
                }
                validateStatus={erros.periodicidade ? "error" : ""}
                help={erros.periodicidade}
                required
              >
                <Select
                  placeholder="Selecione a periodicidade"
                  value={culturaAtual.periodicidade || undefined}
                  onChange={(value) => handleChange("periodicidade", value)}
                  style={{
                    borderRadius: "6px",
                  }}
                  allowClear={false}
                >
                  <Option value="PERENE">
                    <Space>
                      <Tag color="#52c41a" style={{ borderRadius: "4px" }}>Perene</Tag>
                      <span style={{ color: "#8c8c8c", fontSize: "12px" }}>
                        (Produz continuamente)
                      </span>
                    </Space>
                  </Option>
                  <Option value="TEMPORARIA">
                    <Space>
                      <Tag color="#1890ff" style={{ borderRadius: "4px" }}>Temporária</Tag>
                      <span style={{ color: "#8c8c8c", fontSize: "12px" }}>
                        (Ciclo único)
                      </span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <PartitionOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Permite Consórcio?</span>
                  </Space>
                }
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  height: "40px",
                  padding: "0 12px",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #d9d9d9",
                }}>
                  <Switch
                    checked={culturaAtual.permitirConsorcio}
                    onChange={(checked) => handleChange("permitirConsorcio", checked)}
                    style={{
                      backgroundColor: culturaAtual.permitirConsorcio ? "#52c41a" : "#d9d9d9"
                    }}
                  />
                  <span style={{
                    fontWeight: "500",
                    color: culturaAtual.permitirConsorcio ? "#52c41a" : "#8c8c8c"
                  }}>
                    {culturaAtual.permitirConsorcio ? "Sim, permite consórcio" : "Não permite consórcio"}
                  </span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#8c8c8c" }}>
                  Consórcio é o cultivo simultâneo de duas ou mais culturas na mesma área
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

CulturaForm.propTypes = {
  culturaAtual: PropTypes.object.isRequired,
  setCulturaAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
};

export default CulturaForm;
