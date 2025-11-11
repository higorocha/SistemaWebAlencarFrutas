import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Typography,
  Input,
  DatePicker,
  Select,
  Divider,
  Empty,
  Tag,
  Tooltip,
  Badge,
  Button,
} from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  AppleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  HeatMapOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import styled from "styled-components";
import moment from "moment";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import {
  formatCurrency,
  capitalizeName,
  capitalizeNameShort,
  intFormatter,
} from "../../utils/formatters";
import { MonetaryInput } from "../common/inputs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SummaryCard = styled(Card)`
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.05);
`;

const FiltersCard = styled(Card)`
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
`;

const FruitSectionCard = styled(Card)`
  border-radius: 10px;
  border: 1px solid #d1fae5;
  background: #ecfdf5;
  margin-bottom: ${(props) => (props.$isMobile ? "12px" : "16px")};
`;

const QuantitiesBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #047857;
  font-size: 0.75rem;
  font-weight: 600;
`;

const STATUS_DISPLAY = {
  PEDIDO_CRIADO: { label: "Criado", color: "#2563eb" },
  AGUARDANDO_COLHEITA: { label: "Aguardando Colheita", color: "#f59e0b" },
  COLHEITA_PARCIAL: { label: "Colheita Parcial", color: "#f97316" },
  COLHEITA_REALIZADA: { label: "Colheita Realizada", color: "#16a34a" },
  AGUARDANDO_PRECIFICACAO: { label: "Aguardando Precificação", color: "#8b5cf6" },
  PRECIFICACAO_REALIZADA: { label: "Precificação Realizada", color: "#0f766e" },
  AGUARDANDO_PAGAMENTO: { label: "Aguardando Pagamento", color: "#d97706" },
  PAGAMENTO_PARCIAL: { label: "Pagamento Parcial", color: "#059669" },
  PAGAMENTO_REALIZADO: { label: "Pagamento Realizado", color: "#047857" },
  PEDIDO_FINALIZADO: { label: "Finalizado", color: "#047857" },
  CANCELADO: { label: "Cancelado", color: "#dc2626" },
};

const getStatusDisplay = (status) => {
  if (!status) {
    return { label: "Sem Status", color: "#9ca3af" };
  }
  return STATUS_DISPLAY[status] || {
    label: capitalizeNameShort(status),
    color: "#0f172a",
  };
};

const formatQuantidade = (quantidade) =>
  Number(quantidade || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseLocaleNumber = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  const stringValor = String(valor).trim();
  if (!stringValor) return null;

  let normalized;
  if (stringValor.includes(",")) {
    normalized = stringValor.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(stringValor)) {
    normalized = stringValor.replace(/\./g, "");
  } else {
    normalized = stringValor;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const FornecedorColheitaModal = ({ open, fornecedor, onClose }) => {
  const { isMobile } = useResponsive();
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroData, setFiltroData] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(undefined);
  const [filtroFruta, setFiltroFruta] = useState(undefined);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [valoresFornecedor, setValoresFornecedor] = useState({});

  const detalhes = fornecedor?.detalhes || [];

  useEffect(() => {
    if (!open) {
      setFiltroBusca("");
      setFiltroData(null);
      setFiltroStatus(undefined);
      setFiltroFruta(undefined);
    }
  }, [open, fornecedor?.id]);

  const totaisPorUnidade = useMemo(() => {
    if (!detalhes.length) return [];

    const unidadesAgrupadas = detalhes.reduce((acc, item) => {
      const unidade = (item.unidade || "UN").toUpperCase();
      const quantidade = Number(item.quantidade || 0);
      acc.set(unidade, (acc.get(unidade) || 0) + quantidade);
      return acc;
    }, new Map());

    return Array.from(unidadesAgrupadas.entries()).map(([unidade, total]) => ({
      unidade,
      total,
    }));
  }, [detalhes]);

  const valoresResumo = useMemo(() => {
    const totalValor = detalhes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    const totalQuantidade = detalhes.reduce(
      (acc, item) => acc + (Number(item.quantidade) || 0),
      0
    );
    return {
      totalValor,
      totalQuantidade,
    };
  }, [detalhes]);

  const statusDisponiveis = useMemo(() => {
    const set = new Set(detalhes.map((item) => item.statusPedido).filter(Boolean));
    return Array.from(set.values());
  }, [detalhes]);

  const frutasDisponiveis = useMemo(() => {
    const set = new Set(detalhes.map((item) => item.fruta).filter(Boolean));
    return Array.from(set.values());
  }, [detalhes]);

  const detalhesFiltrados = useMemo(() => {
    const termoBusca = filtroBusca.trim().toLowerCase();

    return detalhes
      .filter((item) => {
        if (termoBusca) {
          const pedido = (item.pedidoNumero || "").toLowerCase();
          const cliente = (item.cliente || "").toLowerCase();
          const area = (item.areaNome || "").toLowerCase();
          if (
            !pedido.includes(termoBusca) &&
            !cliente.includes(termoBusca) &&
            !area.includes(termoBusca)
          ) {
            return false;
          }
        }

        if (filtroStatus && item.statusPedido !== filtroStatus) {
          return false;
        }

        if (filtroFruta && item.fruta !== filtroFruta) {
          return false;
        }

        if (
          filtroData &&
          filtroData.length === 2 &&
          filtroData[0] &&
          filtroData[1] &&
          item.dataColheita
        ) {
          const data = moment(item.dataColheita);
          if (!data.isBetween(filtroData[0], filtroData[1], "day", "[]")) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dataA = a.dataColheita ? moment(a.dataColheita).valueOf() : 0;
        const dataB = b.dataColheita ? moment(b.dataColheita).valueOf() : 0;
        return dataB - dataA;
      });
  }, [detalhes, filtroBusca, filtroStatus, filtroFruta, filtroData]);

  const getRowKey = useMemo(
    () => (item) =>
      `${item.pedidoId}-${item.frutaId}-${item.areaNome || "area"}`,
    []
  );

  const detalhesPorKey = useMemo(() => {
    const mapa = new Map();
    detalhesFiltrados.forEach((item) => {
      mapa.set(getRowKey(item), item);
    });
    return mapa;
  }, [detalhesFiltrados, getRowKey]);

  const gruposPorFruta = useMemo(() => {
    const mapa = new Map();

    detalhesFiltrados.forEach((item) => {
      const fruta = item.fruta || "Fruta não identificada";
      if (!mapa.has(fruta)) {
        mapa.set(fruta, {
          fruta,
          detalhes: [],
          totalValor: 0,
          totalPorUnidade: new Map(),
        });
      }

      const grupo = mapa.get(fruta);
      grupo.detalhes.push(item);
      grupo.totalValor += Number(item.valor) || 0;
      const unidade = (item.unidade || "UN").toUpperCase();
      const quantidadeAtual = grupo.totalPorUnidade.get(unidade) || 0;
      grupo.totalPorUnidade.set(unidade, quantidadeAtual + (Number(item.quantidade) || 0));
    });

    return Array.from(mapa.values()).map((grupo) => ({
      ...grupo,
      totalPorUnidade: Array.from(grupo.totalPorUnidade.entries()).map(([unidade, total]) => ({
        unidade,
        total,
      })),
    }));
  }, [detalhesFiltrados]);

  const colunasPedidos = useMemo(
    () => [
      {
        title: "Pedido",
        dataIndex: "pedidoNumero",
        key: "pedidoNumero",
        width: 140,
        render: (numero) => (
          <Tag color="green" style={{ fontFamily: "monospace" }}>
            #{numero}
          </Tag>
        ),
      },
      {
        title: "Cliente",
        dataIndex: "cliente",
        key: "cliente",
        width: 200,
        ellipsis: true,
        render: (cliente) => {
          const clienteNome = cliente || "-";
          return (
            <Tooltip title={cliente ? capitalizeName(clienteNome) : undefined}>
              <Text>{capitalizeNameShort(clienteNome)}</Text>
            </Tooltip>
          );
        },
      },
      {
        title: "Área",
        dataIndex: "areaNome",
        key: "areaNome",
        width: 120,
        ellipsis: true,
        render: (area) => (
          <Tooltip title={capitalizeName(area || "")}>
            <Text strong style={{ color: "#065f46" }}>
              {capitalizeNameShort(area || "-")}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: "Data Colheita",
        dataIndex: "dataColheita",
        key: "dataColheita",
        width: 160,
        render: (data) =>
          data ? (
            <Space size={4}>
              <CalendarOutlined style={{ color: "#0f766e" }} />
              <Text>{moment(data).format("DD/MM/YYYY")}</Text>
            </Space>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: "Quantidade",
        key: "quantidade",
        width: 130,
        render: (_, record) => (
          <Text strong>
            {intFormatter(record.quantidade)} {record.unidade || ""}
          </Text>
        ),
      },
      {
        title: "Valor Vendido",
        dataIndex: "valorTotalFruta",
        key: "valorTotalFruta",
        width: 140,
        render: (valor) => (
          <Text style={{ color: "#1f2937", fontWeight: 500 }}>
            {valor > 0 ? `R$ ${formatCurrency(valor)}` : "-"}
          </Text>
        ),
      },
      {
        title: "Valor Compra",
        key: "valorCompra",
        width: 150,
        render: () => (
          <Tag
            color="#facc15"
            style={{
              borderRadius: 999,
              fontWeight: 600,
              color: "#92400e",
              border: "1px solid #facc15",
              backgroundColor: "#fef9c3",
            }}
          >
            -
          </Tag>
        ),
      },
    ],
    []
  );

  useEffect(() => {
    const chavesValidas = new Set(detalhesFiltrados.map((item) => getRowKey(item)));
    setItensSelecionados((prev) => prev.filter((key) => chavesValidas.has(key)));
    setValoresFornecedor((prev) => {
      const atualizado = {};
      Object.entries(prev).forEach(([key, valor]) => {
        if (chavesValidas.has(key)) {
          atualizado[key] = valor;
        }
      });
      return atualizado;
    });
  }, [detalhesFiltrados, getRowKey]);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: itensSelecionados,
      onChange: (selectedKeys) => {
        setItensSelecionados(selectedKeys);
        setValoresFornecedor((prev) => {
          const atualizado = {};
          selectedKeys.forEach((key) => {
            atualizado[key] = prev[key] ?? null;
          });
          return atualizado;
        });
      },
    }),
    [itensSelecionados]
  );

  return (
    <Modal
      title={
        <span
          style={{
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "16px",
            backgroundColor: "#059669",
            padding: "12px 16px",
            margin: "-20px -24px 0 -24px",
            display: "block",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Icon icon="mdi:truck-delivery" style={{ marginRight: 8 }} />
          Detalhes do Fornecedor - {capitalizeName(fornecedor?.nomeFornecedor || "")}
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
            flexWrap: isMobile ? "wrap" : "nowrap",
            marginTop: isMobile ? "12px" : "16px",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? "small" : "middle"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
              borderRadius: "6px",
              borderColor: "#d9d9d9",
            }}
          >
            Fechar
          </Button>
        </div>
      }
      width={isMobile ? "96vw" : 1480}
      centered
      destroyOnClose
      styles={{
        body: {
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1100 },
      }}
    >
      {!fornecedor ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Empty description="Selecione um fornecedor para visualizar os detalhes" />
        </div>
      ) : (
        <div>
          <SummaryCard
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: 600 }}>Resumo Consolidado</span>
              </Space>
            }
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                borderRadius: "10px 10px 0 0",
                padding: isMobile ? "6px 12px" : "10px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "20px",
              },
            }}
          >
            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Pedidos Atendidos"
                  value={fornecedor.quantidadePedidos || 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#047857", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Frutas Diferentes"
                  value={fornecedor.quantidadeFrutas || 0}
                  prefix={<AppleOutlined />}
                  valueStyle={{ color: "#f97316", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Áreas Utilizadas"
                  value={fornecedor.quantidadeAreas || 0}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: "#0ea5e9", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Valor Proporcional"
                  value={fornecedor.totalValor || valoresResumo.totalValor}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCurrency(value || 0)}
                  valueStyle={{ color: "#047857", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
            </Row>

            <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ color: "#047857", marginBottom: 8 }}>
                  <HeatMapOutlined style={{ marginRight: 8 }} />
                  Distribuição por Unidade
                </Title>
                {totaisPorUnidade.length > 0 ? (
                  <Space wrap size={[8, 8]}>
                    {totaisPorUnidade.map(({ unidade, total }) => (
                      <QuantitiesBadge key={unidade}>
                        <Icon icon="mdi:scale-balance" />
                        {formatQuantidade(total)} {unidade}
                      </QuantitiesBadge>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">Nenhuma quantidade registrada.</Text>
                )}
              </Col>
              <Col xs={24} sm={12}>
                <Title level={5} style={{ color: "#047857", marginBottom: 8 }}>
                  <DollarOutlined style={{ marginRight: 8 }} />
                  Indicadores Financeiros
                </Title>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Badge
                    status="processing"
                    color="#047857"
                    text={
                      <Text strong style={{ color: "#047857" }}>
                        Total proporcional atribuído: {formatCurrency(valoresResumo.totalValor)}
                      </Text>
                    }
                  />
                  <Badge
                    status="processing"
                    color="#0f766e"
                    text={
                      <Text style={{ color: "#0f172a" }}>
                        Quantidade acumulada: {intFormatter(valoresResumo.totalQuantidade || 0)}
                      </Text>
                    }
                  />
                </Space>
              </Col>
            </Row>
          </SummaryCard>

          <FiltersCard
            title={
              <Space>
                <FilterOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: 600 }}>Busca e Filtros</span>
              </Space>
            }
            style={{ marginTop: isMobile ? 12 : 16 }}
            styles={{
              header: {
                backgroundColor: "#047857",
                borderBottom: "2px solid #065f46",
                borderRadius: "10px 10px 0 0",
                padding: isMobile ? "6px 12px" : "10px 16px",
              },
              body: { padding: isMobile ? "12px" : "18px" },
            }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} md={10}>
                <Input
                  value={filtroBusca}
                  onChange={(event) => setFiltroBusca(event.target.value)}
                  placeholder="Buscar por pedido, cliente ou área"
                  allowClear
                  size={isMobile ? "middle" : "large"}
                  prefix={<Icon icon="mdi:magnify" style={{ color: "#047857" }} />}
                />
              </Col>
              <Col xs={24} sm={12} md={5}>
                <Select
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                  allowClear
                  placeholder="Status do pedido"
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                >
                  {statusDisponiveis.map((status) => {
                    const config = getStatusDisplay(status);
                    return (
                      <Option value={status} key={status}>
                        <Space>
                          <CheckCircleOutlined style={{ color: config.color }} />
                          {config.label}
                        </Space>
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={5}>
                <Select
                  value={filtroFruta}
                  onChange={setFiltroFruta}
                  allowClear
                  placeholder="Filtrar por fruta"
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                >
                  {frutasDisponiveis.map((fruta) => (
                    <Option key={fruta} value={fruta}>
                      <Space>
                        <Icon icon="mdi:fruit-watermelon" style={{ color: "#10b981" }} />
                        {capitalizeName(fruta)}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={4}>
                <RangePicker
                  value={filtroData}
                  onChange={setFiltroData}
                  allowClear
                  format="DD/MM/YYYY"
                  size={isMobile ? "middle" : "large"}
                  style={{ width: "100%" }}
                  placeholder={["Data início", "Data fim"]}
                  disabledDate={(current) => current && current > moment().endOf("day")}
                />
              </Col>
            </Row>
          </FiltersCard>

          <div style={{ marginTop: isMobile ? 12 : 20 }}>
            {gruposPorFruta.length === 0 ? (
              <Empty
                description={
                  filtroBusca || filtroStatus || filtroFruta || filtroData
                    ? "Nenhum registro encontrado com os filtros aplicados."
                    : "Nenhum registro de colheita para este fornecedor."
                }
                style={{ padding: "40px 0" }}
              />
            ) : (
              gruposPorFruta.map((grupo) => (
                <FruitSectionCard
                  key={grupo.fruta}
                  $isMobile={isMobile}
                  title={
                    <Space
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <Space>
                        <AppleOutlined style={{ color: "#ffffff" }} />
                        <span style={{ color: "#ffffff", fontWeight: 600 }}>
                          {capitalizeName(grupo.fruta)}
                        </span>
                      </Space>
                      <Space>
                        {grupo.totalPorUnidade.map(({ unidade, total }) => (
                          <Tag
                            key={unidade}
                            color="#10b981"
                            style={{
                              borderRadius: 999,
                              fontWeight: 600,
                              letterSpacing: 0.3,
                            }}
                          >
                            {formatQuantidade(total)} {unidade}
                          </Tag>
                        ))}
                        <Tag
                          color="#047857"
                          style={{
                            borderRadius: 999,
                            fontWeight: 600,
                            letterSpacing: 0.3,
                          }}
                        >
                          {formatCurrency(grupo.totalValor)}
                        </Tag>
                      </Space>
                    </Space>
                  }
                  styles={{
                    header: {
                      backgroundColor: "#059669",
                      borderBottom: "2px solid #047857",
                      borderRadius: "10px 10px 0 0",
                      padding: isMobile ? "6px 12px" : "10px 16px",
                    },
                    body: { padding: isMobile ? "12px" : "18px" },
                  }}
                >
                  <ResponsiveTable
                    columns={colunasPedidos}
                    dataSource={grupo.detalhes.map((detalhe) => ({
                      ...detalhe,
                      __rowKey: getRowKey(detalhe),
                    }))}
                    rowKey="__rowKey"
                    pagination={{
                      pageSize: isMobile ? 5 : 8,
                      hideOnSinglePage: true,
                    }}
                    minWidthMobile={isMobile ? 900 : 1100}
                    showScrollHint
                    rowSelection={rowSelection}
                  />
                </FruitSectionCard>
              ))
            )}
          </div>
        </div>
      )}

      {itensSelecionados.length > 0 && (
        <Card
          title={
            <Space>
              <Icon icon="mdi:truck-check" style={{ color: "#ffffff", fontSize: 20 }} />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Dados da Compra</span>
            </Space>
          }
          style={{
            marginTop: isMobile ? 12 : 20,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
              backgroundColor: "#f9f9f9",
            },
          }}
        >
          {itensSelecionados.map((key, index) => {
            const item = detalhesPorKey.get(key);
            if (!item) return null;

            const quantidadeNumero =
              typeof item.quantidade === "number"
                ? item.quantidade
                : parseLocaleNumber(String(item.quantidade ?? "")) ?? 0;
            const quantidadeTexto = `${intFormatter(quantidadeNumero || 0)} ${item.unidade || ""}`.trim();

            const valorUnitarioRaw = valoresFornecedor[key] ?? "";
            const valorUnitarioNumero = parseLocaleNumber(valorUnitarioRaw);
            const valorTotal =
              valorUnitarioNumero !== null && quantidadeNumero
                ? valorUnitarioNumero * quantidadeNumero
                : null;

            return (
              <div key={key} style={{ marginBottom: index < itensSelecionados.length - 1 ? (isMobile ? 12 : 16) : 0 }}>
                <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="middle">
                  <Col xs={24} md={6}>
                    <Space direction="vertical" size={4}>
                      <Text strong style={{ color: "#059669", fontSize: isMobile ? "0.95rem" : "1rem" }}>
                        {capitalizeName(item.fruta)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                        Pedido #{item.pedidoNumero} • {capitalizeNameShort(item.areaNome)}
                      </Text>
                    </Space>
                  </Col>

                  <Col xs={12} md={4}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                        Quantidade
                      </Text>
                      <Tag color="#10b981" style={{ borderRadius: 999, fontWeight: 600 }}>
                        {quantidadeTexto || "-"}
                      </Tag>
                    </Space>
                  </Col>

                  <Col xs={24} md={5}>
                    <Space direction="vertical" size={2} style={{ width: "100%" }}>
                      <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                        Valor unitário (R$)
                      </Text>
                      <MonetaryInput
                        decimalScale={4}
                        placeholder="0,0000"
                        addonBefore="R$"
                        size={isMobile ? "small" : "large"}
                        value={valorUnitarioRaw}
                        onChange={(value) =>
                          setValoresFornecedor((prev) => ({
                            ...prev,
                            [key]: value,
                          }))
                        }
                        style={{
                          fontSize: isMobile ? "0.875rem" : "1rem",
                        }}
                      />
                    </Space>
                  </Col>

                  <Col xs={12} md={4}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                        Valor total (R$)
                      </Text>
                      <Tag color="#047857" style={{ borderRadius: 999, fontWeight: 600 }}>
                        {valorTotal !== null ? `R$ ${formatCurrency(valorTotal)}` : "-"}
                      </Tag>
                    </Space>
                  </Col>

                  <Col xs={12} md={5}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                        Pagamento
                      </Text>
                      <Tag
                        color="gold"
                        style={{
                          borderRadius: 999,
                          fontWeight: 600,
                          padding: "0 12px",
                          textTransform: "uppercase",
                        }}
                      >
                        Pendente
                      </Tag>
                    </Space>
                  </Col>
                </Row>

                {index < itensSelecionados.length - 1 && (
                  <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />
                )}
              </div>
            );
          })}
        </Card>
      )}
    </Modal>
  );
};

FornecedorColheitaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  fornecedor: PropTypes.shape({
    id: PropTypes.number,
    nomeFornecedor: PropTypes.string,
    quantidadePedidos: PropTypes.number,
    quantidadeFrutas: PropTypes.number,
    quantidadeAreas: PropTypes.number,
    totalValor: PropTypes.number,
    totalQuantidade: PropTypes.number,
    detalhes: PropTypes.arrayOf(
      PropTypes.shape({
        pedidoId: PropTypes.number,
        pedidoNumero: PropTypes.string,
        cliente: PropTypes.string,
        frutaId: PropTypes.number,
        fruta: PropTypes.string,
        quantidade: PropTypes.number,
        unidade: PropTypes.string,
        valor: PropTypes.number,
        valorTotalFruta: PropTypes.number,
        areaNome: PropTypes.string,
        statusPedido: PropTypes.string,
        dataColheita: PropTypes.string,
      })
    ),
  }),
  onClose: PropTypes.func.isRequired,
};

FornecedorColheitaModal.defaultProps = {
  fornecedor: null,
};

export default FornecedorColheitaModal;

