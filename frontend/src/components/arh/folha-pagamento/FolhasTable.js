// src/components/arh/folha-pagamento/FolhasTable.js

import React from "react";
import { Tag, Empty, Typography } from "antd";
import PropTypes from "prop-types";
import ResponsiveTable from "../../common/ResponsiveTable";

const { Text } = Typography;

// Estilos para sobrescrever hover padrão do Ant Design
const tableStyles = `
  .folha-selecionada:hover > td {
    background-color: #fa8c16 !important;
  }
  .folha-selecionada > td {
    background-color: #fa8c16 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    padding-left: 20px !important;
  }
  .folha-selecionada > td:first-child {
    padding-left: 16px !important;
  }
  .folha-normal:hover > td {
    background-color: #fff7e6 !important;
  }
  .ant-table-tbody > tr.folha-selecionada {
    box-shadow: 0 3px 10px rgba(250, 140, 22, 0.25) !important;
  }
`;

const STATUS_FOLHA = {
  RASCUNHO: { label: "Rascunho", color: "default" },
  PENDENTE_LIBERACAO: { label: "Pendente Liberação", color: "orange" },
  EM_PROCESSAMENTO: { label: "Em processamento", color: "blue" },
  FECHADA: { label: "Fechada", color: "green" },
  CANCELADA: { label: "Cancelada", color: "red" },
};

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const competenciaLabel = (folha) => {
  const mesAno = `${String(folha.competenciaMes).padStart(2, "0")}/${folha.competenciaAno}`;
  const quinzena = folha.periodo ? ` - ${folha.periodo}ª Quinzena` : "";
  return `${mesAno}${quinzena}`;
};

const FolhasTable = React.memo(
  ({ folhas, loading, onSelectFolha, selectedFolhaId }) => {
    const columns = [
      {
        title: "Competência",
        dataIndex: "competenciaMes",
        key: "competencia",
        render: (_, record) => {
          const isSelected = record.id === selectedFolhaId;
          return (
            <Text 
              strong 
              style={{ 
                color: isSelected ? "#ffffff" : "#059669", 
                fontSize: "14px",
                fontWeight: isSelected ? "700" : "600",
              }}
            >
              {competenciaLabel(record)}
            </Text>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status, record) => {
          const meta = STATUS_FOLHA[status] || {};
          const isSelected = record.id === selectedFolhaId;
          return (
            <Tag 
              color={isSelected ? "default" : (meta.color || "default")}
              style={isSelected ? { 
                backgroundColor: "#ffffff", 
                color: "#fa8c16",
                borderColor: "#ffffff",
                fontWeight: "700",
              } : {}}
            >
              {meta.label || status}
            </Tag>
          );
        },
      },
      {
        title: "Total Líquido",
        dataIndex: "totalLiquido",
        key: "totalLiquido",
        render: (value, record) => {
          const isSelected = record.id === selectedFolhaId;
          return (
            <Text 
              style={{ 
                color: isSelected ? "#ffffff" : "#333333", 
                fontSize: "12px",
                fontWeight: isSelected ? "700" : "400",
              }}
            >
              {currency(value)}
            </Text>
          );
        },
      },
      {
        title: "Pago",
        dataIndex: "totalPago",
        key: "totalPago",
        render: (value, record) => {
          const isSelected = record.id === selectedFolhaId;
          return (
            <Text 
              style={{ 
                color: isSelected ? "#ffffff" : "#333333", 
                fontSize: "12px",
                fontWeight: isSelected ? "700" : "400",
              }}
            >
              {currency(value)}
            </Text>
          );
        },
      },
    ];

    return (
      <>
        <style>{tableStyles}</style>
        <ResponsiveTable
          columns={columns}
          dataSource={folhas}
          rowKey="id"
          loading={loading}
          pagination={false}
          bordered={true}
          size="middle"
          showScrollHint={true}
          rowClassName={(record) => 
            record.id === selectedFolhaId ? "folha-selecionada" : "folha-normal"
          }
          onRow={(record) => ({
            onClick: () => onSelectFolha(record.id),
            style: {
              cursor: "pointer",
              backgroundColor:
                record.id === selectedFolhaId ? "#fa8c16" : "transparent",
              transition: "transform 0.2s ease, border-left 0.2s ease",
              borderLeft: record.id === selectedFolhaId ? "4px solid #d46b08" : "4px solid transparent",
              fontWeight: record.id === selectedFolhaId ? "700" : "400",
            },
            onMouseEnter: (e) => {
              if (record.id !== selectedFolhaId) {
                // Hover para linhas não selecionadas: laranja claro + movimento
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.borderLeft = "4px solid #ffc069";
              } else {
                // Hover para linha selecionada: apenas movimento (SEM mudança de cor)
                e.currentTarget.style.transform = "translateX(3px)";
              }
            },
            onMouseLeave: (e) => {
              if (record.id !== selectedFolhaId) {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderLeft = "4px solid transparent";
              } else {
                e.currentTarget.style.transform = "translateX(0)";
              }
            },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhuma folha encontrada"
              />
            ),
          }}
        />
      </>
    );
  }
);

FolhasTable.propTypes = {
  folhas: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onSelectFolha: PropTypes.func.isRequired,
  selectedFolhaId: PropTypes.string,
};

export default FolhasTable;

