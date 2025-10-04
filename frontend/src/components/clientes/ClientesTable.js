// src/components/clientes/ClientesTable.js

import React from "react";
import { Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { showNotification } from "../../config/notificationConfig";
import ResponsiveTable from "../common/ResponsiveTable";

const { Text } = Typography;

// Função para capitalizar nome
function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Função para formatar status
const formatarStatus = (status) => {
  if (!status) return "-";

  const statusConfig = {
    ATIVO: { texto: "Ativo", cor: "#52c41a" },
    INATIVO: { texto: "Inativo", cor: "#ff4d4f" },
  };

  const config = statusConfig[status] || { texto: status, cor: "#d9d9d9" };
  return (
    <Tag
      color={config.cor}
      style={{
        borderRadius: "4px",
        fontWeight: "500",
        fontSize: "12px",
        border: "none",
      }}
    >
      {config.texto}
    </Tag>
  );
};

const ClientesTable = React.memo(({
  clientes,
  loading = false,
  onEdit,
  onDelete,
  onViewPedidos,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onShowSizeChange,
  onStatusFilter,
  currentStatusFilter,
}) => {
  // Função para criar o menu de ações
  const getMenuContent = (record) => {
    const menuItems = [
      {
        key: "pedidos",
        label: (
          <Space>
            <ShoppingCartOutlined style={{ color: "#059669" }} />
            <span style={{ color: "#333" }}>Pedidos</span>
          </Space>
        ),
        onClick: () => onViewPedidos(record),
      },
      {
        key: "view",
        label: (
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <span style={{ color: "#333" }}>Ver Detalhes</span>
          </Space>
        ),
        onClick: () => {
          // Alerta de funcionalidade em desenvolvimento
          showNotification("info", "Funcionalidade em Desenvolvimento", "Esta funcionalidade está sendo implementada e estará disponível em breve.");
        },
      },
      {
        key: "edit",
        label: (
          <Space>
            <EditOutlined style={{ color: "#fa8c16" }} />
            <span style={{ color: "#333" }}>Editar</span>
          </Space>
        ),
        onClick: () => onEdit(record),
      },
      {
        key: "delete",
        label: (
          <Space>
            <DeleteOutlined style={{ color: "#ff4d4f" }} />
            <span style={{ color: "#333" }}>Excluir</span>
          </Space>
        ),
        onClick: () => onDelete(record.id),
      },
    ];

    return { items: menuItems };
  };

  // Definição das colunas da tabela
  const columns = [
    {
      title: "Nome",
      dataIndex: "nome",
      key: "nome",
      sorter: (a, b) => a.nome.localeCompare(b.nome),
      render: (text, record) => (
        <div>
          <Text
            strong
            style={{
              color: "#059669",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {text ? capitalizeName(text) : "-"}
          </Text>
          {record.razaoSocial && (
            <div style={{ fontSize: "12px", color: "#666666", marginTop: "2px" }}>
              {record.razaoSocial}
            </div>
          )}
        </div>
      ),
      width: "25%",
    },
    {
      title: "CNPJ/CPF",
      key: "documento",
      render: (_, record) => (
        <div>
          {record.cnpj && (
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>
              <Text strong style={{ color: "#333333" }}></Text> {record.cnpj}
            </div>
          )}
          {record.cpf && (
            <div style={{ fontSize: "12px" }}>
              <Text strong style={{ color: "#333333" }}></Text> {record.cpf}
            </div>
          )}
        </div>
      ),
      width: "20%",
    },
    {
      title: "Contato",
      key: "contato",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.telefone1 && (
            <div style={{ fontSize: "12px" }}>
              <PhoneOutlined style={{ marginRight: "4px", color: "#059669" }} />
              <Text style={{ color: "#333333" }}>{record.telefone1}</Text>
            </div>
          )}
          {record.email1 && (
            <div style={{ fontSize: "12px" }}>
              <MailOutlined style={{ marginRight: "4px", color: "#059669" }} />
              <Text style={{ color: "#333333" }}>{record.email1}</Text>
            </div>
          )}
        </Space>
      ),
      width: "20%",
    },
    {
      title: "Localização",
      key: "localizacao",
      render: (_, record) => (
        <div>
          {record.cidade && record.estado && (
            <div style={{ fontSize: "12px" }}>
              <EnvironmentOutlined style={{ marginRight: "4px", color: "#059669" }} />
              <Text style={{ color: "#333333" }}>
                {record.cidade} - {record.estado}
              </Text>
            </div>
          )}
        </div>
      ),
      width: "15%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => formatarStatus(status),
      width: "10%",
    },
    {
      title: "Ações",
      key: "acoes",
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={getMenuContent(record)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#8c8c8c",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
            }}
          />
        </Dropdown>
      ),
    },
  ];

  // Paginação interna dos dados exibidos
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = clientes.slice(startIndex, endIndex);

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={paginatedData}
      loading={loading}
      rowKey="id"
      pagination={false}
      minWidthMobile={1200}
      showScrollHint={true}
      size="middle"
      bordered={true}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
                Nenhum cliente encontrado
              </span>
            }
          />
        ),
      }}
    />
  );
});

ClientesTable.propTypes = {
  clientes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewPedidos: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func,
  onShowSizeChange: PropTypes.func,
  onStatusFilter: PropTypes.func,
  currentStatusFilter: PropTypes.string,
};

ClientesTable.displayName = 'ClientesTable';

export default ClientesTable;
