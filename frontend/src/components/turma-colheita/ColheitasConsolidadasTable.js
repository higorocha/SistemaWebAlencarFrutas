// src/components/turma-colheita/ColheitasConsolidadasTable.js

import React from "react";
import { Typography, Empty } from "antd";
import { UserOutlined, CalendarOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { formatCurrency, capitalizeName } from "../../utils/formatters";
import ResponsiveTable from "../common/ResponsiveTable";
import useResponsive from "../../hooks/useResponsive";
import { Box } from "@mui/material";

const { Text } = Typography;

// Função para formatar data
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
};

const ColheitasConsolidadasTable = ({ 
  dados, 
  loading = false,
  totalGeralQuantidade = 0,
  totalGeralValor = 0
}) => {
  const { isMobile } = useResponsive();

  const columns = [
    {
      title: "Colhedor",
      dataIndex: "turmaNome",
      key: "turmaNome",
      align: "center",
      sorter: (a, b) => {
        const nomeA = a.turmaNome || "";
        const nomeB = b.turmaNome || "";
        return nomeA.localeCompare(nomeB);
      },
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <UserOutlined style={{ color: "#059669" }} />
          <Text strong>{text ? capitalizeName(text) : "Não informado"}</Text>
        </div>
      ),
    },
    {
      title: "Data Colheita",
      dataIndex: "dataColheita",
      key: "dataColheita",
      align: "center",
      sorter: (a, b) => {
        const dataA = a.dataColheita ? new Date(a.dataColheita).getTime() : 0;
        const dataB = b.dataColheita ? new Date(b.dataColheita).getTime() : 0;
        return dataA - dataB;
      },
      render: (date) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <CalendarOutlined style={{ color: "#059669" }} />
          <Text>{formatDate(date)}</Text>
        </div>
      ),
    },
    {
      title: "Quantidade",
      dataIndex: "totalQuantidade",
      key: "totalQuantidade",
      align: "right",
      sorter: (a, b) => (a.totalQuantidade || 0) - (b.totalQuantidade || 0),
      render: (value) => (
        <Text strong style={{ color: "#059669" }}>
          {value ? Math.round(value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
        </Text>
      ),
    },
    {
      title: "Valor Total",
      dataIndex: "totalValor",
      key: "totalValor",
      align: "right",
      sorter: (a, b) => (a.totalValor || 0) - (b.totalValor || 0),
      render: (value) => (
        <Text strong style={{ color: "#059669", fontSize: "14px" }}>
          R$ {formatCurrency(value || 0)}
        </Text>
      ),
    },
  ];

  const dataSource = dados || [];

  return (
    <>
      <ResponsiveTable
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        rowKey={(record) => record.turmaId || Math.random()}
        minWidthMobile={1200}
        showScrollHint={true}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary">
                  {loading ? "Carregando dados..." : "Nenhum dado encontrado para os filtros selecionados"}
                </Text>
              }
            />
          ),
        }}
        onRow={(record) => ({
          onClick: () => {
            // Pode adicionar ação de clique na linha se necessário
          },
        })}
      />
      
      {/* Totalizador fora da tabela */}
      {dataSource.length > 0 && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: "#f0f9f4",
            borderRadius: 2,
            border: "1px solid #b7eb8f",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Text strong style={{ fontSize: "16px", color: "#059669" }}>
            TOTAL GERAL:
          </Text>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            <Box>
              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                Quantidade
              </Text>
              <Text strong style={{ fontSize: "16px", color: "#059669" }}>
                {Math.round(totalGeralQuantidade).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </Box>
            <Box>
              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                Valor Total
              </Text>
              <Text strong style={{ fontSize: "16px", color: "#059669" }}>
                R$ {formatCurrency(totalGeralValor)}
              </Text>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

ColheitasConsolidadasTable.propTypes = {
  dados: PropTypes.arrayOf(
    PropTypes.shape({
      turmaId: PropTypes.number.isRequired,
      turmaNome: PropTypes.string.isRequired,
      dataColheita: PropTypes.string,
      totalQuantidade: PropTypes.number.isRequired,
      totalValor: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
  totalGeralQuantidade: PropTypes.number,
  totalGeralValor: PropTypes.number,
};

export default ColheitasConsolidadasTable;

