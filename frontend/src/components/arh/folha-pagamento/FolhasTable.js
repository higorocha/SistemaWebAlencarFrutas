// src/components/arh/folha-pagamento/FolhasTable.js

import React from "react";
import { Tag, Empty, Typography } from "antd";
import PropTypes from "prop-types";
import ResponsiveTable from "../../common/ResponsiveTable";

const { Text } = Typography;

// Estilos para sobrescrever hover padrão do Ant Design
const tableStyles = `
  /* Folha selecionada - sempre destaque laranja */
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
  .ant-table-tbody > tr.folha-selecionada {
    box-shadow: 0 3px 10px rgba(250, 140, 22, 0.25) !important;
  }

  /* RASCUNHO - Cinza claro */
  .folha-status-rascunho:hover > td {
    background-color: #f0f0f0 !important;
  }
  .folha-status-rascunho > td {
    background-color: #fafafa !important;
  }
  .ant-table-tbody > tr.folha-status-rascunho {
    border-left: 4px solid #d9d9d9 !important;
  }

  /* PENDENTE_LIBERACAO - Laranja claro */
  .folha-status-pendente-liberacao:hover > td {
    background-color: #ffe7ba !important;
  }
  .folha-status-pendente-liberacao > td {
    background-color: #fff7e6 !important;
  }
  .ant-table-tbody > tr.folha-status-pendente-liberacao {
    border-left: 4px solid #faad14 !important;
  }

  /* EM_PROCESSAMENTO - Azul claro */
  .folha-status-em-processamento:hover > td {
    background-color: #bae7ff !important;
  }
  .folha-status-em-processamento > td {
    background-color: #e6f7ff !important;
  }
  .ant-table-tbody > tr.folha-status-em-processamento {
    border-left: 4px solid #1890ff !important;
  }

  /* FECHADA - Verde claro */
  .folha-status-fechada:hover > td {
    background-color: #b7eb8f !important;
  }
  .folha-status-fechada > td {
    background-color: #f6ffed !important;
  }
  .ant-table-tbody > tr.folha-status-fechada {
    border-left: 4px solid #52c41a !important;
  }

  /* CANCELADA - Vermelho claro */
  .folha-status-cancelada:hover > td {
    background-color: #ffccc7 !important;
  }
  .folha-status-cancelada > td {
    background-color: #fff2f0 !important;
  }
  .ant-table-tbody > tr.folha-status-cancelada {
    border-left: 4px solid #ff4d4f !important;
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
          rowClassName={(record) => {
            // Se estiver selecionada, sempre retorna classe de selecionada
            if (record.id === selectedFolhaId) {
              return "folha-selecionada";
            }
            // Caso contrário, retorna classe baseada no status
            const statusClass = `folha-status-${record.status?.toLowerCase().replace(/_/g, "-") || "rascunho"}`;
            return statusClass;
          }}
          onRow={(record) => {
            const isSelected = record.id === selectedFolhaId;
            return {
              onClick: () => onSelectFolha(record.id),
              style: {
                cursor: "pointer",
                backgroundColor: isSelected ? "#fa8c16" : "transparent",
                transition: "transform 0.2s ease",
                fontWeight: isSelected ? "700" : "400",
              },
              onMouseEnter: (e) => {
                if (!isSelected) {
                  // Hover para linhas não selecionadas: movimento suave
                  e.currentTarget.style.transform = "translateX(4px)";
                } else {
                  // Hover para linha selecionada: apenas movimento (SEM mudança de cor)
                  e.currentTarget.style.transform = "translateX(3px)";
                }
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.transform = "translateX(0)";
              },
            };
          }}
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
  selectedFolhaId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default FolhasTable;

