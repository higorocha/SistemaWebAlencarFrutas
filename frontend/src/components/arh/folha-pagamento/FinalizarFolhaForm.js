// src/components/arh/folha-pagamento/FinalizarFolhaForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Row, Col, Card, Space, Typography, DatePicker, Select, Alert } from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { TextArea } = Input;

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

const FinalizarFolhaForm = ({
  finalizacaoAtual,
  setFinalizacaoAtual,
  erros,
  setErros,
  folha,
}) => {
  const handleChange = (field, value) => {
    setFinalizacaoAtual((prev) => ({
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
        {/* Alerta informativo */}
        <Alert
          message="Atenção"
          description="Ao finalizar a folha, todos os lançamentos serão configurados com o meio de pagamento e data informados abaixo. A folha ficará travada para edições até que seja liberada pelo administrador ou reaberta para correções."
          type="warning"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Resumo da Folha */}
        <Card
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f0f9ff",
          }}
        >
          <Title level={5} style={{ marginTop: 0, color: "#059669" }}>
            Resumo da Folha
          </Title>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text strong style={{ fontSize: "14px" }}>
              Total Líquido: {currency(folha?.totalLiquido || 0)}
            </Text>
            <Text style={{ fontSize: "13px", color: "#666" }}>
              Lançamentos: {folha?.quantidadeLancamentos || 0}
            </Text>
            <Text style={{ fontSize: "13px", color: "#666" }}>
              Referência: {folha?.referencia || "—"}
            </Text>
          </Space>
        </Card>

        {/* Seção: Forma de Pagamento */}
        <Card
          title={
            <Space>
              <BankOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Forma de Pagamento
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
                    <Text strong>Meio de Pagamento</Text>
                  </Space>
                }
                validateStatus={erros.meioPagamento ? "error" : ""}
                help={erros.meioPagamento}
                required
              >
                <Select
                  placeholder="Selecione o meio de pagamento"
                  value={finalizacaoAtual.meioPagamento}
                  onChange={(value) => handleChange("meioPagamento", value)}
                  options={MEIOS_PAGAMENTO}
                  size="large"
                />
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
                    <Text strong>Data Prevista de Pagamento</Text>
                  </Space>
                }
                validateStatus={erros.dataPagamento ? "error" : ""}
                help={erros.dataPagamento}
                required
              >
                <DatePicker
                  placeholder="Selecione a data"
                  value={finalizacaoAtual.dataPagamento}
                  onChange={(date) => handleChange("dataPagamento", date)}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  allowClear={false}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção: Observações */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Observações
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
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <Text strong>Observações (opcional)</Text>
                  </Space>
                }
              >
                <TextArea
                  rows={3}
                  placeholder="Observações sobre o pagamento desta folha..."
                  value={finalizacaoAtual.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
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

FinalizarFolhaForm.propTypes = {
  finalizacaoAtual: PropTypes.object.isRequired,
  setFinalizacaoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func,
  folha: PropTypes.object,
};

export default FinalizarFolhaForm;


