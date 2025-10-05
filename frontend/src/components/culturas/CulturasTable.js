// src/components/culturas/CulturasTable.js

import React from "react";
import { Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import ResponsiveTable from "../common/ResponsiveTable";

const { Text } = Typography;

function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const formatarPeriodicidade = (periodicidade) => {
  if (!periodicidade) return "-";

  const periodicidades = {
    PERENE: { texto: "Perene", cor: "#52c41a" },
    TEMPORARIA: { texto: "Temporária", cor: "#1890ff" },
  };

  const config = periodicidades[periodicidade] || { texto: periodicidade, cor: "#d9d9d9" };
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

const formatarConsorcio = (permitirConsorcio) => {
  if (permitirConsorcio === undefined || permitirConsorcio === null) return "-";

  const config = permitirConsorcio
    ? { texto: "Sim", cor: "#52c41a", icon: <CheckCircleOutlined /> }
    : { texto: "Não", cor: "#d9d9d9", icon: <CloseCircleOutlined /> };

  return (
    <Tag
      icon={config.icon}
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

const CulturasTable = ({
  culturas,
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
      title: "Descrição",
      dataIndex: "descricao",
      key: "descricao",
      render: (descricao) => (
        <Text strong style={{ color: "#059669" }}>
          {capitalizeName(descricao)}
        </Text>
      ),
      sorter: (a, b) => a.descricao.localeCompare(b.descricao),
    },
    {
      title: "Periodicidade",
      dataIndex: "periodicidade",
      key: "periodicidade",
      render: (periodicidade) => formatarPeriodicidade(periodicidade),
      filters: [
        { text: "Perene", value: "PERENE" },
        { text: "Temporária", value: "TEMPORARIA" },
      ],
      onFilter: (value, record) => record.periodicidade === value,
    },
    {
      title: "Permite Consórcio",
      dataIndex: "permitirConsorcio",
      key: "permitirConsorcio",
      render: (permitirConsorcio) => formatarConsorcio(permitirConsorcio),
      filters: [
        { text: "Sim", value: true },
        { text: "Não", value: false },
      ],
      onFilter: (value, record) => record.permitirConsorcio === value,
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
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
        </Space>
      ),
      width: 80,
    },
  ];

  // Paginação interna dos dados exibidos
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = culturas.slice(startIndex, endIndex);

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={paginatedData}
      rowKey="id"
      loading={loading}
      pagination={false}
      minWidthMobile={800}
      showScrollHint={true}
      size="middle"
      bordered={true}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "#8c8c8c" }}>
                Nenhuma cultura encontrada
              </span>
            }
          />
        ),
      }}
    />
  );
};

CulturasTable.propTypes = {
  culturas: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onShowSizeChange: PropTypes.func.isRequired,
};

export default CulturasTable;
