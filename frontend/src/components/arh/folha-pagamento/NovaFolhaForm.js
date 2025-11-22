// src/components/arh/folha-pagamento/NovaFolhaForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Row, Col, Card, Space, Typography, DatePicker, Select } from "antd";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const NovaFolhaForm = ({ folhaAtual, setFolhaAtual, erros, setErros }) => {
  const handleChange = (field, value) => {
    setFolhaAtual((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleCompetenciaChange = (date) => {
    if (date) {
      setFolhaAtual((prev) => ({
        ...prev,
        competenciaMes: date.month() + 1, // dayjs usa 0-11 para meses
        competenciaAno: date.year(),
      }));
      // Limpar erros de competência
      if (erros.competenciaMes || erros.competenciaAno) {
        setErros((prev) => ({
          ...prev,
          competenciaMes: undefined,
          competenciaAno: undefined,
        }));
      }
    } else {
      setFolhaAtual((prev) => ({
        ...prev,
        competenciaMes: undefined,
        competenciaAno: undefined,
      }));
    }
  };

  // Converter competenciaMes e competenciaAno para dayjs
  const competenciaValue = folhaAtual.competenciaMes && folhaAtual.competenciaAno
    ? dayjs().month(folhaAtual.competenciaMes - 1).year(folhaAtual.competenciaAno)
    : null;

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção: Competência */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Competência da Folha
              </span>
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
            },
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Competência (Mês/Ano)</Text>
                  </Space>
                }
                validateStatus={erros.competenciaMes || erros.competenciaAno ? "error" : ""}
                help={erros.competenciaMes || erros.competenciaAno}
                required
              >
                <DatePicker
                  picker="month"
                  placeholder="Selecione o mês e ano"
                  value={competenciaValue}
                  onChange={handleCompetenciaChange}
                  format="MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Quinzena</Text>
                  </Space>
                }
                validateStatus={erros.periodo ? "error" : ""}
                help={erros.periodo}
                required
              >
                <Select
                  placeholder="Selecione a quinzena"
                  value={folhaAtual.periodo || undefined}
                  onChange={(value) => handleChange("periodo", value)}
                  size="large"
                >
                  <Select.Option value={1}>1ª Quinzena</Select.Option>
                  <Select.Option value={2}>2ª Quinzena</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <Text strong>Referência</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Ex.: Folha equipe campo"
                  value={folhaAtual.referencia || ""}
                  onChange={(e) => handleChange("referencia", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

NovaFolhaForm.propTypes = {
  folhaAtual: PropTypes.object.isRequired,
  setFolhaAtual: PropTypes.func.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func,
};

export default NovaFolhaForm;

