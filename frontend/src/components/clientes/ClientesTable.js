// src/components/clientes/ClientesTable.js

import React from "react";
import { Table, Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
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
    padding: 12px 16px;
    font-size: 14px;
  }

  .ant-table-container {
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

  /* LAYOUT FIXO PARA RESOLVER SCROLL HORIZONTAL */
  .ant-table-wrapper {
    width: 100%;
  }

  .ant-table {
    width: 100% !important;
    table-layout: fixed;
  }

  .ant-table-container {
    width: 100% !important;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-table-tbody > tr > td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* CORREÇÃO ESPECÍFICA: Esconder linha de medida */
  .ant-table-measure-row {
    display: none !important;
  }

  /* LAYOUT COMPACTO E PROFISSIONAL DA PAGINAÇÃO */
  .ant-pagination {
    margin-top: 16px !important;
    display: flex !important;
    justify-content: flex-end !important;
    align-items: center !important;
    padding: 12px 0 !important;
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
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    margin: 0 2px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    background: #ffffff !important;
    color: #333333 !important;
    transition: all 0.2s ease !important;
  }

  .ant-pagination-item:hover {
    border-color: #059669 !important;
    color: #059669 !important;
    background: #ffffff !important;
  }

  .ant-pagination-item-active {
    background: #ffffff !important;
    border-color: #059669 !important;
    color: #059669 !important;
    font-weight: 600 !important;
  }

  .ant-pagination-item-active:hover {
    background: #ffffff !important;
    border-color: #047857 !important;
    color: #047857 !important;
  }

  /* Botões de navegação */
  .ant-pagination-prev,
  .ant-pagination-next {
    min-width: 32px !important;
    height: 32px !important;
    line-height: 30px !important;
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    margin: 0 2px !important;
    color: #666666 !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }

  .ant-pagination-prev:hover,
  .ant-pagination-next:hover {
    border-color: #059669 !important;
    color: #059669 !important;
    background: #ffffff !important;
  }

  .ant-pagination-disabled {
    border-color: #f0f0f0 !important;
    color: #bfbfbf !important;
    background: #f5f5f5 !important;
    cursor: not-allowed !important;
  }

  .ant-pagination-disabled:hover {
    border-color: #f0f0f0 !important;
    color: #bfbfbf !important;
    background: #f5f5f5 !important;
  }

  /* Jump prev/next */
  .ant-pagination-jump-prev,
  .ant-pagination-jump-next {
    min-width: 32px !important;
    height: 32px !important;
    line-height: 30px !important;
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    margin: 0 2px !important;
    color: #666666 !important;
    background: #ffffff !important;
  }

  .ant-pagination-jump-prev:hover,
  .ant-pagination-jump-next:hover {
    border-color: #059669 !important;
    color: #059669 !important;
    background: #ffffff !important;
  }

  /* Container dos controles à direita - COMPACTO */
  .ant-pagination-options {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin-left: 16px !important;
  }

  /* Select de tamanho da página - DESIGN CONSISTENTE */
  .ant-pagination-options-size-changer {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
  }

  .ant-pagination-options-size-changer .ant-select {
    min-width: 80px !important;
  }

  .ant-pagination-options-size-changer .ant-select-selector {
    height: 32px !important;
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
  }

  .ant-pagination-options-size-changer .ant-select-selector:hover {
    border-color: #059669 !important;
  }

  .ant-pagination-options-size-changer .ant-select-focused .ant-select-selector {
    border-color: #059669 !important;
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1) !important;
    outline: none !important;
  }

  .ant-pagination-options-size-changer .ant-select-selection-item {
    color: #333333 !important;
    font-weight: 500 !important;
    line-height: 30px !important;
  }

  .ant-pagination-options-size-changer .ant-select-arrow {
    color: #666666 !important;
  }

  /* Quick jumper - INPUT COMPACTO */
  .ant-pagination-options-quick-jumper {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    color: #666666 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
  }

  .ant-pagination-options-quick-jumper input {
    width: 45px !important;
    height: 32px !important;
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    text-align: center !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    background: #ffffff !important;
    color: #333333 !important;
    transition: all 0.2s ease !important;
  }

  .ant-pagination-options-quick-jumper input:hover {
    border-color: #059669 !important;
  }

  .ant-pagination-options-quick-jumper input:focus {
    border-color: #059669 !important;
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1) !important;
    outline: none !important;
  }

  /* Responsividade */
  @media (max-width: 768px) {
    .ant-pagination {
      flex-direction: column !important;
      gap: 12px !important;
    }
    
    .ant-pagination-total-text {
      order: -1 !important;
      margin-right: 0 !important;
    }
    
    .ant-pagination-options {
      margin-left: 0 !important;
    }
  }
`;

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
      fixed: "right",
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

  // Função para determinar a classe CSS da linha
  const assignRowClassName = (record, index) => {
    return index % 2 === 0 ? "even-row" : "odd-row";
  };

  return (
    <StyledTable
      columns={columns}
      dataSource={clientes}
      loading={loading}
      rowKey="id"
      pagination={false}
      rowClassName={assignRowClassName}
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
      size="middle"
      bordered={true}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
});

ClientesTable.propTypes = {
  clientes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func,
  onShowSizeChange: PropTypes.func,
  onStatusFilter: PropTypes.func,
  currentStatusFilter: PropTypes.string,
};

ClientesTable.displayName = 'ClientesTable';

export default ClientesTable; 