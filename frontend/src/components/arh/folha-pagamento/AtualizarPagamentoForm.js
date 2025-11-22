// src/components/arh/folha-pagamento/AtualizarPagamentoForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Select, Switch, Row, Col, Card, Space, Typography, DatePicker } from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const STATUS_PAGAMENTO = [
  "PENDENTE",
  "ENVIADO",
  "ACEITO",
  "PROCESSANDO",
  "PAGO",
  "REJEITADO",
  "CANCELADO",
  "ERRO",
];

const MEIOS_PAGAMENTO = [
  { label: "PIX", value: "PIX" },
  { label: "PIX - API", value: "PIX_API" },
  { label: "Espécie", value: "ESPECIE" },
];

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const AtualizarPagamentoForm = ({
  pagamentoAtual,
  setPagamentoAtual,
  erros,
  setErros,
  lancamento,
}) => {
  const handleChange = (field, value) => {
    setPagamentoAtual((prev) => ({
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
      <Form layout="vertical" size="large">
        {/* Informações do Lançamento */}
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
              Funcionário: {lancamento?.funcionario?.nome || "—"}
            </Text>
            <Text style={{ fontSize: "13px", color: "#666" }}>
              Tipo: {lancamento?.tipoContrato || "—"}
            </Text>
            <Text style={{ fontSize: "13px", color: "#666" }}>
              Valor Bruto: {currency(lancamento?.valorBruto || 0)}
            </Text>
            <Text strong style={{ fontSize: "14px", color: "#059669" }}>
              Valor Líquido: {currency(lancamento?.valorLiquido || 0)}
            </Text>
          </Space>
        </Card>

        {/* Seção: Meio de Pagamento */}
        <Card
          title={
            <Space>
              <BankOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Meio de Pagamento
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
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <BankOutlined style={{ color: "#059669" }} />
                    <Text strong>Forma de Pagamento</Text>
                  </Space>
                }
                validateStatus={erros.meioPagamento ? "error" : ""}
                help={erros.meioPagamento}
                required
              >
                <Select
                  placeholder="Selecione o meio de pagamento"
                  value={pagamentoAtual.meioPagamento}
                  onChange={(value) => handleChange("meioPagamento", value)}
                  options={MEIOS_PAGAMENTO}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção: Status do Pagamento */}
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Status do Pagamento
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
                    <CheckCircleOutlined style={{ color: "#059669" }} />
                    <Text strong>Status</Text>
                  </Space>
                }
                validateStatus={erros.statusPagamento ? "error" : ""}
                help={erros.statusPagamento}
                required
              >
                <Select
                  placeholder="Selecione o status"
                  value={pagamentoAtual.statusPagamento}
                  onChange={(value) => handleChange("statusPagamento", value)}
                  size="large"
                >
                  {STATUS_PAGAMENTO.map((status) => (
                    <Select.Option value={status} key={status}>
                      {status}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong>Pagamento Efetuado?</Text>
                  </Space>
                }
              >
                <Space>
                  <Switch
                    checked={pagamentoAtual.pagamentoEfetuado}
                    onChange={(checked) => handleChange("pagamentoEfetuado", checked)}
                    checkedChildren="Sim"
                    unCheckedChildren="Não"
                    style={{
                      backgroundColor: pagamentoAtual.pagamentoEfetuado ? "#059669" : "#d9d9d9",
                    }}
                  />
                  <Text
                    style={{
                      color: pagamentoAtual.pagamentoEfetuado ? "#059669" : "#666",
                      fontWeight: pagamentoAtual.pagamentoEfetuado ? "600" : "400",
                    }}
                  >
                    {pagamentoAtual.pagamentoEfetuado ? "Pago" : "Não Pago"}
                  </Text>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção: Data de Pagamento */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Data de Pagamento
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
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Data do Pagamento</Text>
                  </Space>
                }
              >
                <DatePicker
                  placeholder="Selecione a data"
                  value={pagamentoAtual.dataPagamento}
                  onChange={(date) => handleChange("dataPagamento", date)}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

AtualizarPagamentoForm.propTypes = {
  pagamentoAtual: PropTypes.object.isRequired,
  setPagamentoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func,
  lancamento: PropTypes.object,
};

export default AtualizarPagamentoForm;

