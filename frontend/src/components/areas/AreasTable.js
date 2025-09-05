// src/components/areas/AreasTable.js

import React from "react";
import { Table, Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
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
    border: 1px solid #d9d9d9 !important;
    border-radius: 6px !important;
    margin: 0 2px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    background: #ffffff !important;
    color: #333333 !important;
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

  /* Container dos controles à direita - COMPACTO */
  .ant-pagination-options {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin-left: 16px !important;
  }

  /* Select de tamanho da página - DESIGN CONSISTENTE */
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

  .ant-pagination-options-size-changer .ant-select-selection-item {
    line-height: 30px !important;
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

// Função para formatar categoria
const formatarCategoria = (categoria) => {
  const categorias = {
    COLONO: { texto: "Colono", cor: "#52c41a" },
    TECNICO: { texto: "Técnico", cor: "#1890ff" },
    EMPRESARIAL: { texto: "Empresarial", cor: "#722ed1" },
    ADJACENTE: { texto: "Adjacente", cor: "#fa8c16" },
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

// Função para formatar área total
const formatarArea = (area) => {
  if (!area && area !== 0) return "-";
  return `${Number(area).toFixed(2)} ha`;
};

// Função para calcular total de área plantada das culturas
const calcularAreaPlantadaTotal = (culturas) => {
  if (!culturas || culturas.length === 0) return 0;
  return culturas.reduce((total, cultura) => total + (cultura.areaPlantada || 0), 0);
};

const AreasTable = React.memo(({
  areas,
  loading = false,
  onEdit,
  onDelete,
  onOpenMap,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onShowSizeChange,
}) => {
  // Função para criar o menu de ações
  const getMenuContent = (record) => {
    const menuItems = [
      {
        key: "map",
        label: (
          <Space>
            <EnvironmentOutlined style={{ color: "#059669" }} />
            <span style={{ color: "#333" }}>Ver no Mapa</span>
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
      title: "Nome da Área",
      dataIndex: "nome",
      key: "nome",
      sorter: (a, b) => a.nome.localeCompare(b.nome),
      render: (text) => (
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
      ),
      width: "30%",
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      sorter: (a, b) => a.categoria.localeCompare(b.categoria),
      render: (categoria) => categoria ? formatarCategoria(categoria) : "-",
      width: "15%",
    },
    {
      title: "Área Total",
      dataIndex: "areaTotal",
      key: "areaTotal",
      sorter: (a, b) => (a.areaTotal || 0) - (b.areaTotal || 0),
      render: (area) => (
        <Text 
          style={{ 
            fontWeight: "500",
            color: "#1890ff",
            fontSize: "14px",
          }}
        >
          {area !== null && area !== undefined ? formatarArea(area) : "-"}
        </Text>
      ),
      width: "15%",
    },
    {
      title: "Área Plantada",
      key: "areaPlantada",
      render: (_, record) => {
        const totalPlantada = calcularAreaPlantadaTotal(record.culturas || record.culturasDetalhadas);
        return (
          <Text 
            style={{ 
              color: totalPlantada > 0 ? "#059669" : "#8c8c8c",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            {formatarArea(totalPlantada)}
          </Text>
        );
      },
      sorter: (a, b) => {
        const areaA = calcularAreaPlantadaTotal(a.culturas || a.culturasDetalhadas);
        const areaB = calcularAreaPlantadaTotal(b.culturas || b.culturasDetalhadas);
        return areaA - areaB;
      },
      width: "15%",
    },
    {
      title: "Culturas",
      key: "culturas",
      render: (_, record) => {
        const culturas = record.culturas || record.culturasDetalhadas || [];
        if (culturas.length === 0) {
          return (
            <Text type="secondary" style={{ fontSize: "12px", fontStyle: "italic" }}>
              Nenhuma cultura
            </Text>
          );
        }
        
        return (
          <Space wrap size="small">
            {culturas.slice(0, 2).map((cultura, index) => (
              <Tag 
                key={index} 
                color="#059669" 
                style={{ 
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500",
                  border: "none",
                }}
                             >
                 {cultura.descricao || `Cultura ${cultura.culturaId}`}
               </Tag>
            ))}
            {culturas.length > 2 && (
              <Tag 
                color="#d9d9d9" 
                style={{ 
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#666",
                  border: "none",
                }}
              >
                +{culturas.length - 2} mais
              </Tag>
            )}
          </Space>
        );
      },
      width: "20%",
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
      dataSource={areas}
      loading={loading}
      rowKey="id"
      pagination={false}
      scroll={{ x: 1000 }}
      rowClassName={assignRowClassName}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
                Nenhuma área agrícola encontrada
              </span>
            }
          />
        ),
      }}
      size="middle"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
});

AreasTable.propTypes = {
  areas: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onOpenMap: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func,
  onShowSizeChange: PropTypes.func,
};

AreasTable.displayName = 'AreasTable';

export default AreasTable;