// src/components/frutas/FrutasTable.js

import React from "react";
import { Table, Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import styled from "styled-components";
import { showNotification } from "../../config/notificationConfig";

const { Text } = Typography;

// Styled components para tabela com tema personalizado
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    border-bottom: 2px solid #047857;
    padding: 16px;
    font-size: 14px;
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
    cursor: pointer;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background-color: #d1fae5 !important;
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #e0e0e0;
    padding: 12px 16px;
    font-size: 14px;
  }

  .ant-table-container {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .ant-table-cell-fix-left,
  .ant-table-cell-fix-right {
    background-color: inherit !important;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }

  /* CORREÇÃO ESPECÍFICA: Esconder linha de medida */
  .ant-table-measure-row {
    display: none !important;
  }

  /* LAYOUT COMPACTO E PROFISSIONAL DA PAGINAÇÃO */
  .ant-pagination {
    margin-top: 8px !important;
    display: flex !important;
    justify-content: flex-end !important;
    align-items: center !important;
    padding: 8px 0 !important;
    border-top: 1px solid #f0f0f0 !important;
    gap: 8px !important;
  }

  .ant-pagination-total-text {
    color: #666 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    margin: 0 !important;
    margin-right: 16px !important;
  }

  /* Items de página - DESIGN LIMPO */
  .ant-pagination-item {
    min-width: 32px !important;
    height: 32px !important;
    line-height: 30px !important;
    border-radius: 6px !important;
    border: 1px solid #d9d9d9 !important;
    background-color: #ffffff !important;
    color: #333333 !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
  }

  .ant-pagination-prev .ant-pagination-item-link,
  .ant-pagination-next .ant-pagination-item-link {
    height: 32px !important;
    line-height: 30px !important;
    border-radius: 6px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .ant-pagination-prev.ant-pagination-disabled .ant-pagination-item-link,
  .ant-pagination-next.ant-pagination-disabled .ant-pagination-item-link {
    color: #bfbfbf !important;
    border-color: #f0f0f0 !important;
    background: #f5f5f5 !important;
    cursor: not-allowed !important;
  }

  /* Select de tamanho da página */
  .ant-pagination-options {
    margin-left: 16px !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
  }

  .ant-pagination-options-size-changer .ant-select-selector {
    height: 32px !important;
    border-radius: 6px !important;
    border: 1px solid #d9d9d9 !important;
  }

  .ant-pagination-options-size-changer .ant-select-selection-item {
    line-height: 30px !important;
  }

  /* Input de jump */
  .ant-pagination-options-quick-jumper {
    margin-left: 16px !important;
  }

  .ant-pagination-options-quick-jumper input {
    border-radius: 6px !important;
    border: 1px solid #d9d9d9 !important;
    background-color: #ffffff !important;
    width: 50px !important;
    text-align: center !important;
  }

  .ant-pagination-options-quick-jumper input:hover {
    border-color: #059669 !important;
  }

  .ant-pagination-options-quick-jumper input:focus {
    border-color: #059669 !important;
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1) !important;
  }
`;

function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const formatarCategoria = (categoria) => {
  if (!categoria) return "-";
  
  const categorias = {
    CITRICOS: { texto: "Cítricos", cor: "#fa8c16" },
    TROPICAIS: { texto: "Tropicais", cor: "#52c41a" },
    TEMPERADAS: { texto: "Temperadas", cor: "#1890ff" },
    SECAS: { texto: "Secas", cor: "#722ed1" },
    EXOTICAS: { texto: "Exóticas", cor: "#eb2f96" },
    VERMELHAS: { texto: "Vermelhas", cor: "#f5222d" },
    VERDES: { texto: "Verdes", cor: "#13c2c2" },
  };
  
  const config = categorias[categoria] || { texto: categoria, cor: "#d9d9d9" };
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
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (categoria) => formatarCategoria(categoria),
      filters: [
        { text: "Cítricos", value: "CITRICOS" },
        { text: "Tropicais", value: "TROPICAIS" },
        { text: "Temperadas", value: "TEMPERADAS" },
        { text: "Secas", value: "SECAS" },
        { text: "Exóticas", value: "EXOTICAS" },
        { text: "Vermelhas", value: "VERMELHAS" },
        { text: "Verdes", value: "VERDES" },
      ],
      onFilter: (value, record) => record.categoria === value,
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
      fixed: "right",
    },
  ];

  const assignRowClassName = (record, index) => {
    return index % 2 === 0 ? "even-row" : "odd-row";
  };

  const paginationConfig = {
    // Removido: vamos usar paginação externa nas páginas
  };

  return (
    <div>
      <StyledTable
        columns={columns}
        dataSource={frutas}
        rowKey="id"
        loading={loading}
        pagination={false}
        rowClassName={assignRowClassName}
        scroll={{ x: 800 }}
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
    </div>
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