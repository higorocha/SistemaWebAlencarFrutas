// src/components/arh/folha-pagamento/FinalizarFolhaForm.js

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Form, Input, Row, Col, Card, Space, Typography, DatePicker, Select, Alert, Spin } from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import api from "../../../api/axiosConfig";

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

// Função para formatar a referência da folha (quinzena e datas)
const formatarReferenciaFolha = (folha) => {
  if (!folha) return "—";
  
  // Se tiver referência customizada, usar ela
  if (folha.referencia && folha.referencia.trim()) {
    return folha.referencia;
  }
  
  // Caso contrário, formatar com quinzena e datas
  const mesAno = `${String(folha.competenciaMes || "").padStart(2, "0")}/${folha.competenciaAno || ""}`;
  const quinzena = folha.periodo ? `${folha.periodo}ª Quinzena` : "";
  
  let referencia = `${mesAno}${quinzena ? ` - ${quinzena}` : ""}`;
  
  // Adicionar datas se disponíveis
  if (folha.dataInicial && folha.dataFinal) {
    const dataInicial = new Date(folha.dataInicial).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const dataFinal = new Date(folha.dataFinal).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    referencia += ` (${dataInicial} a ${dataFinal})`;
  }
  
  return referencia || "—";
};

const FinalizarFolhaForm = ({
  finalizacaoAtual,
  setFinalizacaoAtual,
  erros,
  setErros,
  folha,
}) => {
  const [contasDisponiveis, setContasDisponiveis] = useState([]);
  const [loadingContas, setLoadingContas] = useState(false);

  // Carregar contas disponíveis quando PIX_API for selecionado
  useEffect(() => {
    if (finalizacaoAtual.meioPagamento === "PIX_API") {
      const carregarContas = async () => {
        setLoadingContas(true);
        try {
          const response = await api.get("/api/pagamentos/contas-disponiveis");
          setContasDisponiveis(response.data || []);
        } catch (error) {
          console.error("Erro ao carregar contas disponíveis:", error);
          setContasDisponiveis([]);
        } finally {
          setLoadingContas(false);
        }
      };
      carregarContas();
    }
  }, [finalizacaoAtual.meioPagamento]);

  const handleChange = (field, value) => {
    let newData = { ...finalizacaoAtual, [field]: value };

    // Converter contaCorrenteId para número se for esse campo
    if (field === "contaCorrenteId") {
      newData.contaCorrenteId = value ? Number(value) : null;
    }

    // Limpar conta corrente quando mudar de PIX_API para outro método
    if (field === "meioPagamento" && value !== "PIX_API") {
      newData.contaCorrenteId = null;
    }

    setFinalizacaoAtual(newData);

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
              Referência: {formatarReferenciaFolha(folha)}
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

            {/* Seleção de Conta Corrente - apenas para PIX_API */}
            {finalizacaoAtual.meioPagamento === "PIX_API" && (
              <Col xs={24}>
                <Form.Item
                  label={
                    <Space>
                      <ApiOutlined style={{ color: "#059669" }} />
                      <Text strong>Conta Corrente para Débito</Text>
                    </Space>
                  }
                  validateStatus={erros.contaCorrenteId ? "error" : ""}
                  help={erros.contaCorrenteId}
                  required
                >
                  <Spin spinning={loadingContas}>
                    <Select
                      placeholder="Selecione a conta corrente"
                      value={finalizacaoAtual.contaCorrenteId ? Number(finalizacaoAtual.contaCorrenteId) : undefined}
                      onChange={(value) => handleChange("contaCorrenteId", value)}
                      options={contasDisponiveis.map((conta) => ({
                        label: `${conta.agencia} / ${conta.contaCorrente}-${(conta.contaCorrenteDigito || 'X').toUpperCase()} (${conta.nomeBanco || conta.bancoNome || 'Banco do Brasil'})`,
                        value: Number(conta.id), // Garantir que o value seja número
                      }))}
                      size="large"
                      notFoundContent={
                        loadingContas ? (
                          <span>Carregando contas...</span>
                        ) : (
                          <span style={{ color: "#ff4d4f" }}>
                            Nenhuma conta com credenciais de pagamento configurada
                          </span>
                        )
                      }
                    />
                  </Spin>
                </Form.Item>

                {/* Alerta informativo sobre PIX_API */}
                <Alert
                  message="Integração PIX - Banco do Brasil"
                  description={
                    <div style={{ fontSize: "13px" }}>
                      <p style={{ marginBottom: 8 }}>
                        Este método utiliza a API do Banco do Brasil para processamento automático dos pagamentos.
                      </p>
                      <p style={{ marginBottom: 8 }}>
                        <strong>Importante:</strong> O lote de transferências será criado apenas ao <strong>liberar a folha</strong>.
                      </p>
                      <p style={{ marginBottom: 0 }}>
                        Será criada <strong>1 transferência por funcionário</strong>, utilizando as chaves PIX cadastradas.
                      </p>
                    </div>
                  }
                  type="info"
                  icon={<WarningOutlined />}
                  showIcon
                  style={{ marginBottom: 0 }}
                />
              </Col>
            )}
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




