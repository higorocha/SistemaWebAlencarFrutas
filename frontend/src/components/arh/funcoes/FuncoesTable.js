// src/components/arh/funcoes/FuncoesTable.js

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Tag, Button, Space, Empty, Typography, Dropdown } from "antd";
import { EditOutlined, MoreOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import ResponsiveTable from "../../common/ResponsiveTable";
import useResponsive from "../../../hooks/useResponsive";

const { Text } = Typography;

const FuncoesTable = ({
  funcoes,
  loading,
  onEdit,
  onToggleStatus,
  currentPage,
  pageSize,
}) => {
  const { isMobile } = useResponsive();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const getMenuContent = (record) => {
    const items = [
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
        key: "toggle",
        label: (
          <Space>
            {record.ativo ? (
              <StopOutlined style={{ color: "#ff4d4f" }} />
            ) : (
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
            )}
            <span style={{ color: "#333" }}>
              {record.ativo ? "Inativar" : "Ativar"}
            </span>
          </Space>
        ),
        onClick: () => onToggleStatus(record),
      },
    ];

    return items;
  };

  const columns = useMemo(
    () => [
      {
        title: "Função",
        dataIndex: "nome",
        key: "nome",
        render: (text) => (
          <Text strong style={{ color: "#059669", fontSize: "14px", fontWeight: "600" }}>
            {text}
          </Text>
        ),
        sorter: (a, b) => (a.nome || "").localeCompare(b.nome || ""),
      },
      {
        title: "Valor da Diária",
        dataIndex: "valorDiariaBase",
        key: "valorDiariaBase",
        render: (value) => (
          <Text style={{ color: "#333333" }}>{formatCurrency(value)}</Text>
        ),
        sorter: (a, b) => (a.valorDiariaBase || 0) - (b.valorDiariaBase || 0),
      },
      {
        title: "Duração Padrão",
        dataIndex: "duracaoPadraoHoras",
        key: "duracaoPadraoHoras",
        render: (value) => (
          <Text style={{ color: "#666666" }}>{value ? `${value}h` : "—"}</Text>
        ),
        sorter: (a, b) => (a.duracaoPadraoHoras || 0) - (b.duracaoPadraoHoras || 0),
      },
      {
        title: "EPI",
        dataIndex: "exigeEpi",
        key: "exigeEpi",
        render: (value) => (
          <Tag
            color={value ? "#d946ef" : "#d9d9d9"}
            style={{
              borderRadius: "4px",
              fontWeight: "500",
              fontSize: "12px",
              border: "none",
            }}
          >
            {value ? "Exige" : "Livre"}
          </Tag>
        ),
        filters: [
          { text: "Exige EPI", value: true },
          { text: "Não exige", value: false },
        ],
        onFilter: (value, record) => record.exigeEpi === value,
      },
      {
        title: "Status",
        dataIndex: "ativo",
        key: "ativo",
        render: (ativo) => (
          <Tag
            color={ativo ? "#52c41a" : "#ff4d4f"}
            style={{
              borderRadius: "4px",
              fontWeight: "500",
              fontSize: "12px",
              border: "none",
            }}
          >
            {ativo ? "Ativa" : "Inativa"}
          </Tag>
        ),
        filters: [
          { text: "Ativa", value: true },
          { text: "Inativa", value: false },
        ],
        onFilter: (value, record) => record.ativo === value,
      },
      {
        title: "Ações",
        key: "acoes",
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
    ],
    [isMobile, onEdit, onToggleStatus]
  );

  // Paginação interna dos dados exibidos
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = funcoes.slice(startIndex, endIndex);

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={paginatedData}
      loading={loading}
      rowKey="id"
      pagination={false}
      minWidthMobile={900}
      showScrollHint={true}
      size="middle"
      bordered={true}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
                Nenhuma função cadastrada
              </span>
            }
          />
        ),
      }}
    />
  );
};

FuncoesTable.propTypes = {
  funcoes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
};

FuncoesTable.defaultProps = {
  loading: false,
  currentPage: 1,
  pageSize: 10,
};

export default FuncoesTable;

