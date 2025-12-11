// src/components/arh/cargos/CargosTable.js

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Tag, Button, Space, Switch, Empty, Typography, Dropdown } from "antd";
import { EditOutlined, MoreOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import ResponsiveTable from "../../common/ResponsiveTable";
import useResponsive from "../../../hooks/useResponsive";
import { capitalizeName } from "../../../utils/formatters";

const { Text } = Typography;

const CargosTable = ({
  cargos,
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
        title: "Cargo",
        dataIndex: "nome",
        key: "nome",
        render: (text) => (
          <Text strong style={{ color: "#059669", fontSize: "14px", fontWeight: "600" }}>
            {text ? capitalizeName(text) : text}
          </Text>
        ),
        sorter: (a, b) => (a.nome || "").localeCompare(b.nome || ""),
      },
      {
        title: "Salário Mensal",
        dataIndex: "salarioMensal",
        key: "salarioMensal",
        render: (value) => (
          <Text style={{ color: "#333333" }}>{formatCurrency(value)}</Text>
        ),
        sorter: (a, b) => (a.salarioMensal || 0) - (b.salarioMensal || 0),
      },
      {
        title: "Carga Horária",
        dataIndex: "cargaHorariaMensal",
        key: "cargaHorariaMensal",
        render: (value) => (
          <Text style={{ color: "#666666" }}>{value ? `${value}h` : "—"}</Text>
        ),
        sorter: (a, b) => (a.cargaHorariaMensal || 0) - (b.cargaHorariaMensal || 0),
      },
      {
        title: "Periculosidade",
        dataIndex: "adicionalPericulosidade",
        key: "adicionalPericulosidade",
        render: (value) => (
          <Text style={{ color: "#666666" }}>{value ? `${value}%` : "—"}</Text>
        ),
        sorter: (a, b) => (a.adicionalPericulosidade || 0) - (b.adicionalPericulosidade || 0),
      },
      {
        title: "Gerencial",
        dataIndex: "isGerencial",
        key: "isGerencial",
        width: 110,
        render: (isGerencial) => (
          <Tag
            color={isGerencial ? "#722ed1" : "#d9d9d9"}
            style={{
              borderRadius: "4px",
              fontWeight: "500",
              fontSize: "12px",
              border: "none",
            }}
          >
            {isGerencial ? "Sim" : "Não"}
          </Tag>
        ),
        filters: [
          { text: "Gerencial", value: true },
          { text: "Não Gerencial", value: false },
        ],
        onFilter: (value, record) => record.isGerencial === value,
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
            {ativo ? "Ativo" : "Inativo"}
          </Tag>
        ),
        filters: [
          { text: "Ativo", value: true },
          { text: "Inativo", value: false },
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
  const paginatedData = cargos.slice(startIndex, endIndex);

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
                Nenhum cargo cadastrado
              </span>
            }
          />
        ),
      }}
    />
  );
};

CargosTable.propTypes = {
  cargos: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
};

CargosTable.defaultProps = {
  loading: false,
  currentPage: 1,
  pageSize: 10,
};

export default CargosTable;

