// src/components/arh/funcionarios/AdiantamentosFuncionarioModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Table,
  Input,
  Card,
  Tag,
  Typography,
  Space,
  Divider,
  Form,
  Row,
  Col,
  Empty,
} from "antd";
import {
  DollarOutlined,
  CloseOutlined,
  PlusOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import axiosInstance from "../../../api/axiosConfig";
import { showNotification } from "../../../config/notificationConfig";
import { formatCurrency, formatarCPF, capitalizeName } from "../../../utils/formatters";
import moment from "../../../config/momentConfig";
import useResponsive from "../../../hooks/useResponsive";
import ResponsiveTable from "../../common/ResponsiveTable";
import MonetaryInput from "../../common/inputs/MonetaryInput";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";

const { Text, Title } = Typography;
const { TextArea } = Input;

const AdiantamentosFuncionarioModal = ({
  open,
  onClose,
  funcionario,
}) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [adiantamentos, setAdiantamentos] = useState([]);
  const [form] = Form.useForm();
  const [detalhesModal, setDetalhesModal] = useState({
    open: false,
    adiantamento: null,
  });
  const [adiantamentoEditando, setAdiantamentoEditando] = useState(null);
  const [confirmExclusaoOpen, setConfirmExclusaoOpen] = useState(false);
  const [adiantamentoParaExcluir, setAdiantamentoParaExcluir] = useState(null);

  // Carregar adiantamentos quando o modal abrir
  useEffect(() => {
    if (open && funcionario?.id) {
      carregarAdiantamentos();
    } else {
      setAdiantamentos([]);
      form.resetFields();
    }
  }, [open, funcionario?.id]);

  const carregarAdiantamentos = async () => {
    if (!funcionario?.id) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/arh/funcionarios/${funcionario.id}/adiantamentos`
      );
      setAdiantamentos(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar adiantamentos:", error);
      showNotification(
        "error",
        "Erro",
        "Não foi possível carregar os adiantamentos."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCriarAdiantamento = async (values) => {
    if (!funcionario?.id) return;

    try {
      setLoading(true);
      
      if (adiantamentoEditando) {
        // Modo edição
        await axiosInstance.put(
          `/api/arh/funcionarios/${funcionario.id}/adiantamentos/${adiantamentoEditando.id}`,
          {
            valorTotal: values.valorTotal,
            quantidadeParcelas: values.quantidadeParcelas,
            observacoes: values.observacoes || undefined,
          }
        );

        showNotification(
          "success",
          "Sucesso",
          "Adiantamento atualizado com sucesso!"
        );
        setAdiantamentoEditando(null);
      } else {
        // Modo criação
        await axiosInstance.post(
          `/api/arh/funcionarios/${funcionario.id}/adiantamentos`,
          {
            valorTotal: values.valorTotal,
            quantidadeParcelas: values.quantidadeParcelas,
            observacoes: values.observacoes || undefined,
          }
        );

        showNotification(
          "success",
          "Sucesso",
          "Adiantamento criado com sucesso!"
        );
      }

      form.resetFields();
      await carregarAdiantamentos();
    } catch (error) {
      console.error("Erro ao salvar adiantamento:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Não foi possível salvar o adiantamento.";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarAdiantamento = (adiantamento) => {
    setAdiantamentoEditando(adiantamento);
    form.setFieldsValue({
      valorTotal: adiantamento.valorTotal,
      quantidadeParcelas: adiantamento.quantidadeParcelas,
      observacoes: adiantamento.observacoes || "",
    });
    // Scroll para o formulário
    const formElement = document.getElementById("form-adiantamento");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCancelarEdicao = () => {
    setAdiantamentoEditando(null);
    form.resetFields();
  };

  const handleExcluirAdiantamento = (adiantamento) => {
    setAdiantamentoParaExcluir(adiantamento);
    setConfirmExclusaoOpen(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!adiantamentoParaExcluir) return;

    setConfirmExclusaoOpen(false);
    
    try {
      await axiosInstance.delete(
        `/api/arh/funcionarios/${funcionario.id}/adiantamentos/${adiantamentoParaExcluir.id}`
      );

      showNotification(
        "success",
        "Sucesso",
        "Adiantamento excluído com sucesso!"
      );
      await carregarAdiantamentos();
    } catch (error) {
      console.error("Erro ao excluir adiantamento:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Não foi possível excluir o adiantamento.";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setAdiantamentoParaExcluir(null);
    }
  };

  const handleCancelarExclusao = () => {
    setConfirmExclusaoOpen(false);
    setAdiantamentoParaExcluir(null);
  };

  const formatarStatus = (adiantamento) => {
    if (adiantamento.saldoDevedor <= 0) {
      return { texto: "Quitado", cor: "green" };
    }
    return { texto: "Ativo", cor: "orange" };
  };

  const calcularValorParcela = (valorTotal, quantidadeParcelas) => {
    if (!valorTotal || !quantidadeParcelas || quantidadeParcelas <= 0) {
      return 0;
    }
    return valorTotal / quantidadeParcelas;
  };

  const colunasAdiantamentos = [
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      align: "center",
      render: (date) => (
        <Text style={{ fontSize: "0.75rem" }}>
          <CalendarOutlined style={{ marginRight: 4, color: "#059669" }} />
          {moment(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Valor Total",
      dataIndex: "valorTotal",
      key: "valorTotal",
      width: 130,
      align: "center",
      render: (valor) => (
        <Text strong style={{ color: "#059669", fontSize: "0.875rem" }}>
          R$ {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: "Parcelas",
      key: "parcelas",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Tag
          color="blue"
          style={{
            fontSize: "0.75rem",
            padding: "4px 10px",
            fontWeight: "500",
          }}
        >
          {record.quantidadeParcelasRemanescentes} / {record.quantidadeParcelas}
        </Tag>
      ),
    },
    {
      title: "Valor Parcela",
      key: "valorParcela",
      width: 130,
      align: "center",
      render: (_, record) => {
        const valorParcela = calcularValorParcela(
          record.valorTotal,
          record.quantidadeParcelas
        );
        return (
          <Text style={{ fontSize: "0.75rem", color: "#666" }}>
            R$ {formatCurrency(valorParcela)}
          </Text>
        );
      },
    },
    {
      title: "Saldo Devedor",
      dataIndex: "saldoDevedor",
      key: "saldoDevedor",
      width: 130,
      align: "center",
      render: (valor) => (
        <Text
          strong
          style={{
            fontSize: "0.875rem",
            color: valor > 0 ? "#ff4d4f" : "#52c41a",
          }}
        >
          R$ {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      align: "center",
      render: (_, record) => {
        const status = formatarStatus(record);
        return (
          <Tag
            color={status.cor}
            style={{
              fontWeight: "500",
              fontSize: "0.75rem",
              padding: "4px 10px",
            }}
          >
            {status.texto}
          </Tag>
        );
      },
    },
    {
      title: "Ações",
      key: "acoes",
      width: 120,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => setDetalhesModal({ open: true, adiantamento: record })}
            style={{
              color: "#1890ff",
              padding: "4px 8px",
            }}
            size="small"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditarAdiantamento(record)}
            style={{
              color: "#fa8c16",
              padding: "4px 8px",
            }}
            size="small"
          />
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleExcluirAdiantamento(record)}
            disabled={record.lancamentosAdiantamento?.length > 0}
            style={{
              color: record.lancamentosAdiantamento?.length > 0 ? "#d9d9d9" : "#ff4d4f",
              padding: "4px 8px",
            }}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const colunasDetalhes = [
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      align: "center",
      render: (date) => (
        <Text style={{ fontSize: "0.75rem" }}>
          <CalendarOutlined style={{ marginRight: 4, color: "#059669" }} />
          {moment(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Folha (Competência)",
      key: "folha",
      width: 150,
      align: "center",
      render: (_, record) => {
        if (!record.competenciaFolha) return "-";
        return (
          <Tag
            color="cyan"
            style={{
              fontSize: "0.75rem",
              padding: "4px 10px",
              fontWeight: "500",
            }}
          >
            {record.competenciaFolha}
          </Tag>
        );
      },
    },
    {
      title: "Valor Deduzido",
      dataIndex: "valorDeduzido",
      key: "valorDeduzido",
      width: 130,
      align: "center",
      render: (valor) => (
        <Text strong style={{ color: "#059669", fontSize: "0.875rem" }}>
          R$ {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: "Parcela Nº",
      dataIndex: "parcelaNumero",
      key: "parcelaNumero",
      width: 100,
      align: "center",
      render: (numero) => (
        <Tag
          color="purple"
          style={{
            fontSize: "0.75rem",
            padding: "4px 10px",
            fontWeight: "600",
          }}
        >
          #{numero}
        </Tag>
      ),
    },
  ];

  // Observar valores do formulário para calcular valor da parcela
  const valorTotalWatch = Form.useWatch("valorTotal", form);
  const quantidadeParcelasWatch = Form.useWatch("quantidadeParcelas", form);
  
  const valorParcela = valorTotalWatch && quantidadeParcelasWatch
    ? calcularValorParcela(valorTotalWatch, quantidadeParcelasWatch)
    : 0;

  return (
    <>
      <Modal
        title={
          <span
            style={{
              color: "#ffffff",
              fontWeight: "600",
              fontSize: isMobile ? "0.875rem" : "1rem",
              backgroundColor: "#059669",
              padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
              margin: "-1.25rem -1.5rem 0 -1.5rem",
              display: "block",
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          >
            <DollarOutlined style={{ marginRight: "0.5rem" }} />
            {isMobile
              ? `Adiantamentos - ${funcionario?.nome ? capitalizeName(funcionario.nome).split(" ")[0] : ""}`
              : `Adiantamentos - ${funcionario?.nome ? capitalizeName(funcionario.nome) : ""}`}
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <Button
              onClick={onClose}
              size={isMobile ? "middle" : "large"}
              icon={<CloseOutlined />}
              style={{
                height: isMobile ? "36px" : "40px",
              }}
            >
              Fechar
            </Button>
          </div>
        }
        width={isMobile ? "95vw" : "90%"}
        style={{ maxWidth: isMobile ? "95vw" : "75rem" }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 12.5rem)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? 12 : 20,
          },
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            padding: 0,
          },
        }}
        zIndex={1050}
        centered
        destroyOnClose
      >
        {/* Seção 1: Informações do Funcionário */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Informações do Funcionário
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                <UserOutlined style={{ marginRight: 4 }} />
                Nome:
              </Text>
              <br />
              <Text
                style={{
                  fontSize: isMobile ? "0.875rem" : "0.9375rem",
                  fontWeight: "500",
                  color: "#333",
                  marginTop: "4px",
                }}
              >
                {funcionario?.nome ? capitalizeName(funcionario.nome) : "-"}
              </Text>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                <IdcardOutlined style={{ marginRight: 4 }} />
                CPF:
              </Text>
              <br />
              <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                {funcionario?.cpf ? formatarCPF(funcionario.cpf) : "-"}
              </Text>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                <BankOutlined style={{ marginRight: 4 }} />
                Tipo de Contrato:
              </Text>
              <br />
              <Tag
                color="blue"
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  fontWeight: "500",
                  marginTop: "4px",
                }}
              >
                {funcionario?.tipoContrato === "MENSALISTA"
                  ? "Mensalista"
                  : funcionario?.tipoContrato === "DIARISTA"
                  ? "Diarista"
                  : funcionario?.tipoContrato || "-"}
              </Tag>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Histórico de Adiantamentos */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Histórico de Adiantamentos
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          {adiantamentos && adiantamentos.length > 0 ? (
            <ResponsiveTable
              columns={colunasAdiantamentos}
              dataSource={adiantamentos}
              rowKey="id"
              loading={loading}
              pagination={false}
              minWidthMobile={900}
              showScrollHint={true}
              style={{
                marginBottom: isMobile ? "16px" : "0px",
              }}
            />
          ) : (
            <Empty
              description="Nenhum adiantamento encontrado"
              image={<DollarOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
            />
          )}
        </Card>

        {/* Seção 3: Novo/Editar Adiantamento */}
        <Card
          id="form-adiantamento"
          title={
            <Space>
              {adiantamentoEditando ? <EditOutlined style={{ color: "#ffffff" }} /> : <PlusOutlined style={{ color: "#ffffff" }} />}
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                {adiantamentoEditando ? "Editar Adiantamento" : "Novo Adiantamento"}
              </span>
            </Space>
          }
          style={{
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
            },
          }}
        >
          <Form form={form} layout="vertical" size="large" onFinish={handleCriarAdiantamento}>
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <DollarOutlined style={{ color: "#059669" }} />
                      <span
                        style={{
                          fontWeight: "700",
                          color: "#333",
                          fontSize: isMobile ? "0.8125rem" : "0.875rem",
                        }}
                      >
                        Valor Total
                      </span>
                    </Space>
                  }
                  name="valorTotal"
                  rules={[
                    { required: true, message: "O valor total é obrigatório" },
                    {
                      validator: (_, value) => {
                        const numValue =
                          typeof value === "string" ? parseFloat(value) : value;
                        if (!numValue || numValue <= 0) {
                          return Promise.reject(
                            new Error("O valor deve ser maior que zero")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <MonetaryInput
                    placeholder="Ex: 500,00"
                    addonAfter="R$"
                    size={isMobile ? "middle" : "large"}
                    style={{
                      borderRadius: "0.375rem",
                      borderColor: "#d9d9d9",
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <span
                        style={{
                          fontWeight: "700",
                          color: "#333",
                          fontSize: isMobile ? "0.8125rem" : "0.875rem",
                        }}
                      >
                        Quantidade de Parcelas
                      </span>
                    </Space>
                  }
                  name="quantidadeParcelas"
                  rules={[
                    {
                      required: true,
                      message: "A quantidade de parcelas é obrigatória",
                    },
                    {
                      validator: (_, value) => {
                        if (!value || value < 1) {
                          return Promise.reject(
                            new Error("A quantidade deve ser maior que zero")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    type="number"
                    style={{
                      width: "100%",
                      borderRadius: "0.375rem",
                      borderColor: "#d9d9d9",
                    }}
                    min={1}
                    placeholder="Ex: 3"
                    size={isMobile ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
            </Row>

            {valorParcela > 0 && (
              <div
                style={{
                  marginBottom: isMobile ? "12px" : "16px",
                  padding: "12px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                }}
              >
                <Text strong style={{ color: "#059669", fontSize: "14px" }}>
                  <DollarOutlined style={{ marginRight: 8 }} />
                  Valor da Parcela: R$ {formatCurrency(valorParcela)}
                </Text>
              </div>
            )}

            <Form.Item
              label={
                <Space>
                  <FileTextOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>
                    Observações sobre o Adiantamento
                  </span>
                </Space>
              }
              name="observacoes"
            >
              <TextArea
                rows={isMobile ? 2 : 3}
                placeholder="Observações sobre o adiantamento (opcional)"
                style={{ borderRadius: "0.375rem", borderColor: "#d9d9d9" }}
              />
            </Form.Item>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: isMobile ? "8px" : "12px",
                marginTop: isMobile ? "12px" : "16px",
                paddingTop: isMobile ? "12px" : "16px",
                borderTop: "0.0625rem solid #e8e8e8",
              }}
            >
              {adiantamentoEditando && (
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelarEdicao}
                  disabled={loading}
                  size={isMobile ? "middle" : "large"}
                  style={{
                    height: isMobile ? "36px" : "40px",
                    padding: isMobile ? "0 12px" : "0 16px",
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="primary"
                icon={adiantamentoEditando ? <EditOutlined /> : <PlusOutlined />}
                htmlType="submit"
                loading={loading}
                size={isMobile ? "middle" : "large"}
                style={{
                  backgroundColor: "#059669",
                  borderColor: "#059669",
                  height: isMobile ? "36px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
                block={isMobile && !adiantamentoEditando}
              >
                {adiantamentoEditando ? "Atualizar Adiantamento" : "Adicionar Adiantamento"}
              </Button>
            </div>
          </Form>
        </Card>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        title={
          <span
            style={{
              color: "#ffffff",
              fontWeight: "600",
              fontSize: isMobile ? "0.875rem" : "1rem",
              backgroundColor: "#059669",
              padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
              margin: "-1.25rem -1.5rem 0 -1.5rem",
              display: "block",
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          >
            <EyeOutlined style={{ marginRight: "0.5rem" }} />
            Detalhes do Adiantamento
          </span>
        }
        open={detalhesModal.open}
        onCancel={() => setDetalhesModal({ open: false, adiantamento: null })}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <Button
              onClick={() => setDetalhesModal({ open: false, adiantamento: null })}
              type="primary"
              size={isMobile ? "middle" : "large"}
              style={{
                backgroundColor: "#059669",
                borderColor: "#059669",
                height: isMobile ? "36px" : "40px",
              }}
            >
              Fechar
            </Button>
          </div>
        }
        width={isMobile ? "95vw" : "90%"}
        style={{ maxWidth: isMobile ? "95vw" : "62.5rem" }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 12.5rem)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? 12 : 20,
          },
          header: {
            backgroundColor: "#059669",
            borderBottom: "0.125rem solid #047857",
            padding: 0,
          },
          wrapper: { zIndex: 1300 },
          mask: { zIndex: 1300 },
        }}
        centered
        destroyOnClose
      >
        {detalhesModal.adiantamento && (
          <>
            {/* Seção 1: Resumo do Adiantamento */}
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Resumo do Adiantamento
                  </span>
                </Space>
              }
              style={{
                marginBottom: isMobile ? 12 : 16,
                border: "0.0625rem solid #e8e8e8",
                borderRadius: "0.5rem",
              }}
              styles={{
                header: {
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  borderBottom: "0.125rem solid #047857",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                },
                body: {
                  padding: isMobile ? "12px" : "16px",
                },
              }}
            >
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Valor Total:
                  </Text>
                  <br />
                  <Text
                    style={{
                      fontSize: isMobile ? "1rem" : "1.125rem",
                      fontWeight: "600",
                      color: "#059669",
                      marginTop: "4px",
                    }}
                  >
                    R$ {formatCurrency(detalhesModal.adiantamento.valorTotal)}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Parcelas:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    {detalhesModal.adiantamento.quantidadeParcelasRemanescentes} /{" "}
                    {detalhesModal.adiantamento.quantidadeParcelas}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Saldo Devedor:
                  </Text>
                  <br />
                  <Text
                    style={{
                      fontSize: isMobile ? "1rem" : "1.125rem",
                      fontWeight: "600",
                      color:
                        detalhesModal.adiantamento.saldoDevedor > 0
                          ? "#ff4d4f"
                          : "#52c41a",
                      marginTop: "4px",
                    }}
                  >
                    R$ {formatCurrency(detalhesModal.adiantamento.saldoDevedor)}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Status:
                  </Text>
                  <br />
                  <Tag
                    color={formatarStatus(detalhesModal.adiantamento).cor}
                    style={{
                      fontSize: "0.75rem",
                      padding: "4px 10px",
                      fontWeight: "500",
                      marginTop: "4px",
                    }}
                  >
                    {formatarStatus(detalhesModal.adiantamento).texto}
                  </Tag>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Criado por:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    <UserOutlined style={{ marginRight: 4, color: "#059669" }} />
                    {capitalizeName(detalhesModal.adiantamento.usuarioCriacao?.nome || "N/A")}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    Data de Criação:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    <CalendarOutlined style={{ marginRight: 4, color: "#059669" }} />
                    {moment(detalhesModal.adiantamento.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Col>
              </Row>
              {detalhesModal.adiantamento.observacoes && (
                <>
                  <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
                  <div>
                    <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                      <FileTextOutlined style={{ marginRight: 4 }} />
                      Observações:
                    </Text>
                    <br />
                    <Text style={{ fontSize: "0.875rem", color: "#666", marginTop: "4px" }}>
                      {detalhesModal.adiantamento.observacoes}
                    </Text>
                  </div>
                </>
              )}
            </Card>

            {/* Seção 2: Histórico de Deduções */}
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Histórico de Deduções
                  </span>
                </Space>
              }
              style={{
                border: "0.0625rem solid #e8e8e8",
                borderRadius: "0.5rem",
              }}
              styles={{
                header: {
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  borderBottom: "0.125rem solid #047857",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                },
                body: {
                  padding: isMobile ? "12px" : "16px",
                },
              }}
            >
              {detalhesModal.adiantamento.lancamentosAdiantamento &&
              detalhesModal.adiantamento.lancamentosAdiantamento.length > 0 ? (
                <ResponsiveTable
                  columns={colunasDetalhes}
                  dataSource={detalhesModal.adiantamento.lancamentosAdiantamento || []}
                  rowKey="id"
                  pagination={false}
                  minWidthMobile={600}
                  showScrollHint={true}
                />
              ) : (
                <Empty
                  description="Nenhuma dedução registrada ainda"
                  image={<FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
                />
              )}
            </Card>
          </>
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmActionModal
        open={confirmExclusaoOpen}
        onConfirm={handleConfirmarExclusao}
        onCancel={handleCancelarExclusao}
        title="Excluir Adiantamento"
        message={
          adiantamentoParaExcluir?.lancamentosAdiantamento?.length > 0
            ? "Este adiantamento possui parcelas já deduzidas e não pode ser excluído."
            : `Tem certeza que deseja excluir este adiantamento? Valor: R$ ${formatCurrency(adiantamentoParaExcluir?.valorTotal || 0)} - Parcelas: ${adiantamentoParaExcluir?.quantidadeParcelas || 0}. Esta ação não pode ser desfeita.`
        }
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        confirmDisabled={adiantamentoParaExcluir?.lancamentosAdiantamento?.length > 0}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
      />
    </>
  );
};

AdiantamentosFuncionarioModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  funcionario: PropTypes.object,
};

export default AdiantamentosFuncionarioModal;
