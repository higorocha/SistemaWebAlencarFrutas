// src/components/frutas/FrutasTable.js

import React from "react";
import { Dropdown, Button, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { showNotification } from "../../config/notificationConfig";
import ResponsiveTable from "../common/ResponsiveTable";

const { Text } = Typography;

function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const formatarCultura = (cultura) => {
  if (!cultura || !cultura.descricao) return "-";
  
  return (
    <Tag 
      color="#059669" 
      style={{ 
        borderRadius: "4px", 
        fontWeight: "500",
        fontSize: "12px",
        border: "none",
      }}
    >
      {cultura.descricao}
    </Tag>
  );
};

const formatarStatus = (status) => {
  if (!status) return "-";
  
  const statusConfig = {
    ATIVA: { texto: "Ativa", cor: "#52c41a" },
    INATIVA: { texto: "Inativa", cor: "#ff4d4f" },
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

const formatarClassificacao = (dePrimeira) => {
  const config = dePrimeira
    ? { texto: "De primeira", cor: "#389e0d" }
    : { texto: "De segunda", cor: "#faad14" };

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

const FrutasTable = ({
  frutas,
  loading,
  onEdit,
  onDelete,
  currentPage,
  pageSize,
  onPageChange,
  onShowSizeChange,
}) => {
  const getMenuContent = (record) => {
    const items = [
      {
        key: "edit",
        label: "Editar",
        icon: <EditOutlined />,
        onClick: () => onEdit(record),
      },
      {
        key: "delete",
        label: "Excluir",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDelete(record.id),
      },
    ];

    return items;
  };

  const columns = [
    {
      title: "Nome",
      dataIndex: "nome",
      key: "nome",
      render: (nome) => (
        <Text strong style={{ color: "#059669" }}>
          {capitalizeName(nome)}
        </Text>
      ),
      sorter: (a, b) => a.nome.localeCompare(b.nome),
    },
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      render: (codigo) => (
        <Text style={{ color: "#666666", fontFamily: "monospace" }}>
          {codigo || "-"}
        </Text>
      ),
    },
    {
      title: "Cultura",
      dataIndex: "cultura",
      key: "cultura",
      render: (cultura) => formatarCultura(cultura),
      sorter: (a, b) => {
        const culturaA = a.cultura?.descricao || "";
        const culturaB = b.cultura?.descricao || "";
        return culturaA.localeCompare(culturaB);
      },
    },
    {
      title: "Classificação",
      dataIndex: "dePrimeira",
      key: "classificacao",
      render: (dePrimeira) => formatarClassificacao(dePrimeira),
      filters: [
        { text: "De primeira", value: true },
        { text: "De segunda", value: false },
      ],
      onFilter: (value, record) => record.dePrimeira === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => formatarStatus(status),
      filters: [
        { text: "Ativa", value: "ATIVA" },
        { text: "Inativa", value: "INATIVA" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Descrição",
      dataIndex: "descricao",
      key: "descricao",
      render: (descricao) => (
        <Text style={{ color: "#666666" }}>
          {descricao ? (descricao.length > 50 ? `${descricao.substring(0, 50)}...` : descricao) : "-"}
        </Text>
      ),
      ellipsis: true,
    },
    {
      title: "Ações",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{ items: getMenuContent(record) }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            style={{
              color: "#666666",
              border: "none",
              boxShadow: "none",
            }}
          />
        </Dropdown>
      ),
    },
  ];

  // Paginação interna dos dados exibidos
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = frutas.slice(startIndex, endIndex);

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={paginatedData}
      rowKey="id"
      loading={loading}
      pagination={false}
      minWidthMobile={1000}
      showScrollHint={true}
      size="middle"
      bordered={true}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "#8c8c8c" }}>
                Nenhuma fruta encontrada
              </span>
            }
          />
        ),
      }}
    />
  );
};

FrutasTable.propTypes = {
  frutas: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onShowSizeChange: PropTypes.func.isRequired,
};

export default FrutasTable; 