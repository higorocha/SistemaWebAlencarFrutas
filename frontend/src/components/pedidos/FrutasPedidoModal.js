// src/components/pedidos/FrutasPedidoModal.js

import React from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  Divider,
  Table,
} from "antd";
import {
  AppleOutlined,
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario } from "../../utils/formatters";

const { Title, Text } = Typography;

const FrutasPedidoModal = ({ open, onClose, pedido }) => {
  if (!pedido) return null;

  // Colunas da tabela de frutas
  const columns = [
    {
      title: "Fruta",
      dataIndex: ["fruta", "nome"],
      key: "fruta",
      width: 120,
      render: (text) => (
        <Text strong style={{ color: "#059669" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Área",
      key: "area",
      width: 150,
      render: (_, record) => {
        if (record.areaPropria) {
          return (
            <Tag color="blue">
              <Text style={{ fontSize: 12 }}>Própria: {record.areaPropria.nome}</Text>
            </Tag>
          );
        }
        if (record.areaFornecedor) {
          return (
            <Tag color="green">
              <Text style={{ fontSize: 12 }}>
                {record.areaFornecedor.fornecedor?.nome} - {record.areaFornecedor.nome}
              </Text>
            </Tag>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Quant. Prevista",
      key: "quantidadePrevista",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Text>
          {record.quantidadePrevista?.toFixed(2)} {record.unidadeMedida1}
        </Text>
      ),
    },
    {
      title: "Quant. Real",
      key: "quantidadeReal",
      width: 140,
      align: "center",
      render: (_, record) => {
        // Determinar qual quantidade real mostrar baseado na unidade precificada
        const unidadePrec = record.unidadePrecificada?.toString().trim().toUpperCase();
        const um1 = record.unidadeMedida1?.toString().trim().toUpperCase();
        const um2 = record.unidadeMedida2?.toString().trim().toUpperCase();
        
        let quantidade = 0;
        let unidade = '';
        
        if (unidadePrec === um2 && record.quantidadeReal2) {
          quantidade = record.quantidadeReal2;
          unidade = record.unidadeMedida2;
        } else if (record.quantidadeReal) {
          quantidade = record.quantidadeReal;
          unidade = record.unidadeMedida1;
        }
        
        if (quantidade > 0) {
          return (
            <Text strong style={{ color: "#059669" }}>
              {quantidade.toFixed(2)} {unidade}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Valor Unitário",
      key: "valorUnitario",
      width: 120,
      align: "center",
      render: (_, record) => {
        if (record.valorUnitario) {
          return (
            <Text strong style={{ color: "#1890ff" }}>
              {formatarValorMonetario(record.valorUnitario)}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Valor Total",
      key: "valorTotal",
      width: 120,
      align: "center",
      render: (_, record) => {
        if (record.valorTotal) {
          return (
            <Text strong style={{ color: "#059669" }}>
              {formatarValorMonetario(record.valorTotal)}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
  ];

  return (
    <Modal
      title={
        <span style={{ 
          color: "#ffffff", 
          fontWeight: "600", 
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <AppleOutlined style={{ marginRight: 8 }} />
          Frutas do Pedido
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      styles={{
        body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto", overflowX: "hidden", padding: 20 },
        header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", padding: 0 },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      {/* Informações do Pedido */}
      <Card
        title={
          <Space>
            <EyeOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Pedido</span>
          </Space>
        }
        style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>Pedido:</Text>
            <br />
            <Text style={{ color: "#059669", fontWeight: 600 }}>{pedido.numeroPedido}</Text>
          </Col>
          <Col span={6}>
            <Text strong>Cliente:</Text>
            <br />
            <Text>{pedido.cliente?.nome}</Text>
          </Col>
          <Col span={6}>
            <Text strong>Data do Pedido:</Text>
            <br />
            <Text>{moment(pedido.dataPedido).format("DD/MM/YYYY")}</Text>
          </Col>
          <Col span={6}>
            <Text strong>Valor Final:</Text>
            <br />
            <Text strong style={{ color: "#059669", fontSize: 16 }}>
              {formatarValorMonetario(pedido.valorFinal)}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Lista de Frutas */}
      <Card
        title={
          <Space>
            <AppleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>
              Frutas ({pedido.frutasPedidos?.length || 0})
            </span>
          </Space>
        }
        style={{ border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            borderBottom: "2px solid #047857", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0",
            padding: "8px 16px"
          },
          body: { padding: "12px 16px" }
        }}
      >
        <Table
          columns={columns}
          dataSource={pedido.frutasPedidos || []}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
          tableLayout="fixed"
        />
      </Card>
    </Modal>
  );
};

export default FrutasPedidoModal;
