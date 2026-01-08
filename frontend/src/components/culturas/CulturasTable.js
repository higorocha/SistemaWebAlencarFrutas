// src/components/culturas/CulturasTable.js

import React, { useState } from "react";
import { Dropdown, Button, Tag, Empty, Typography, Space } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import ResponsiveTable from "../common/ResponsiveTable";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";

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
  // Estados para controle do modal de confirmação de exclusão
  const [confirmExclusaoOpen, setConfirmExclusaoOpen] = useState(false);
  const [culturaParaExcluir, setCulturaParaExcluir] = useState(null);

  // Função para abrir o modal de confirmação de exclusão
  const handleExcluirCultura = (cultura) => {
    setCulturaParaExcluir(cultura);
    setConfirmExclusaoOpen(true);
  };

  // Função para confirmar a exclusão
  const handleConfirmarExclusao = async () => {
    if (!culturaParaExcluir) return;

    setConfirmExclusaoOpen(false);
    
    try {
      await onDelete(culturaParaExcluir.id);
      setCulturaParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir cultura:", error);
    } finally {
      setCulturaParaExcluir(null);
    }
  };

  // Função para cancelar a exclusão
  const handleCancelarExclusao = () => {
    setConfirmExclusaoOpen(false);
    setCulturaParaExcluir(null);
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
        key: "delete",
        label: (
          <Space>
            <DeleteOutlined style={{ color: "#ff4d4f" }} />
            <span style={{ color: "#333" }}>Excluir</span>
          </Space>
        ),
        danger: true,
        onClick: () => handleExcluirCultura(record),
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
  const paginatedData = culturas.slice(startIndex, endIndex);

  return (
    <>
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

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmActionModal
        open={confirmExclusaoOpen}
        onConfirm={handleConfirmarExclusao}
        onCancel={handleCancelarExclusao}
        title="Excluir Cultura"
        message={`Tem certeza que deseja excluir a cultura "${culturaParaExcluir?.descricao ? capitalizeName(culturaParaExcluir.descricao) : ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
      />
    </>
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
