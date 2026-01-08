// src/components/arh/folha-pagamento/EditarLancamentoForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Row, Col, Card, Space, Typography, InputNumber } from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const EditarLancamentoForm = ({
  lancamentoAtual,
  setLancamentoAtual,
  erros,
  setErros,
  lancamento,
  onGerenciarAdiantamento,
}) => {
  const handleChange = (field, value) => {
    setLancamentoAtual((prev) => ({
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

  return (
    <div>
      {/* Estilos específicos para o campo de adiantamento com visual disabled */}
      <style>
        {`
          .adiantamento-input-wrapper {
            cursor: pointer !important;
          }
          
          /* Visual disabled para o InputNumber - igual aos outros campos disabled */
          .adiantamento-input-wrapper .ant-input-number-disabled {
            background-color: #f8f9fa !important;
            border-color: #f8bbb4 !important;
            color: #6c757d !important;
            cursor: pointer !important;
            opacity: 0.8 !important;
            pointer-events: none !important;
          }
          
          .adiantamento-input-wrapper .ant-input-number-disabled:hover,
          .adiantamento-input-wrapper .ant-input-number-disabled:focus {
            background-color: #f8f9fa !important;
            border-color: #f8bbb4 !important;
            box-shadow: none !important;
          }
          
          /* Input interno também com visual disabled */
          .adiantamento-input-wrapper .ant-input-number-disabled .ant-input-number-input-wrap {
            cursor: pointer !important;
            pointer-events: none !important;
          }
          
          .adiantamento-input-wrapper .ant-input-number-disabled .ant-input-number-input-wrap input {
            background-color: transparent !important;
            color: #6c757d !important;
            cursor: pointer !important;
            pointer-events: none !important;
          }
        `}
      </style>
      <Form layout="vertical" size="large">
        {/* Informações do Funcionário */}
        <Card
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f0f9ff",
          }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text strong style={{ fontSize: "14px", color: "#059669" }}>
              Tipo: {lancamento?.tipoContrato || "—"}
            </Text>
            <Text strong style={{ fontSize: "14px", color: "#059669" }}>
              Cargo/Função: {lancamento?.referenciaNomeCargo || lancamento?.referenciaNomeFuncao || "—"}
            </Text>
            <Text style={{ fontSize: "13px", color: "#666" }}>
              Salário/Diária Base: {currency(lancamento?.salarioBaseReferencia || lancamento?.valorDiariaAplicada || 0)}
            </Text>
          </Space>
        </Card>

        {/* Seção: Dias e Faltas */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Dias Trabalhados e Faltas
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
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Dias Trabalhados</Text>
                  </Space>
                }
                validateStatus={erros.diasTrabalhados ? "error" : ""}
                help={erros.diasTrabalhados}
                required
              >
                <InputNumber
                  min={0}
                  placeholder="Ex: 15"
                  value={lancamentoAtual.diasTrabalhados}
                  onChange={(value) => handleChange("diasTrabalhados", value)}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <MinusCircleOutlined style={{ color: "#ff4d4f" }} />
                    <Text strong>Faltas</Text>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  placeholder="Ex: 0"
                  value={lancamentoAtual.faltas}
                  onChange={(value) => handleChange("faltas", value)}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção: Horas Extras */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Horas Extras
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
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <ClockCircleOutlined style={{ color: "#059669" }} />
                    <Text strong>Quantidade de Horas Extras</Text>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  precision={1}
                  placeholder="Ex: 10.5"
                  value={lancamentoAtual.horasExtras}
                  onChange={(value) => handleChange("horasExtras", value)}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong>Valor por Hora Extra (R$)</Text>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="Ex: 25.00"
                  value={lancamentoAtual.valorHoraExtra}
                  onChange={(value) => handleChange("valorHoraExtra", value)}
                  style={{ width: "100%" }}
                  size="large"
                  addonAfter="R$"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção: Acréscimos e Descontos */}
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Acréscimos e Descontos
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
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <PlusCircleOutlined style={{ color: "#52c41a" }} />
                    <Text strong>Ajuda de Custo (R$)</Text>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0,00"
                  value={lancamentoAtual.ajudaCusto}
                  onChange={(value) => handleChange("ajudaCusto", value)}
                  style={{ width: "100%" }}
                  size="large"
                  addonAfter="R$"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <PlusCircleOutlined style={{ color: "#52c41a" }} />
                    <Text strong>Extra (R$)</Text>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0,00"
                  value={lancamentoAtual.extras}
                  onChange={(value) => handleChange("extras", value)}
                  style={{ width: "100%" }}
                  size="large"
                  addonAfter="R$"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <MinusCircleOutlined style={{ color: "#fa8c16" }} />
                    <Text strong>Adiantamento (R$)</Text>
                  </Space>
                }
              >
                <div
                  className="adiantamento-input-wrapper"
                  style={{
                    width: "100%",
                    position: "relative",
                  }}
                  onClick={() => {
                    if (onGerenciarAdiantamento && lancamento) {
                      onGerenciarAdiantamento(lancamento);
                    }
                  }}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    placeholder="0,00"
                    value={lancamentoAtual.adiantamento}
                    onChange={(value) => handleChange("adiantamento", value)}
                    style={{ width: "100%" }}
                    size="large"
                    addonAfter="R$"
                    disabled
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

EditarLancamentoForm.propTypes = {
  lancamentoAtual: PropTypes.object.isRequired,
  setLancamentoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func,
  lancamento: PropTypes.object,
  onGerenciarAdiantamento: PropTypes.func,
};

export default EditarLancamentoForm;








