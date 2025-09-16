// src/components/turma-colheita/TurmaColheitaTable.js

import React, { useState } from "react";
import { Table, Dropdown, Button, Space, Tag, Empty, Typography, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  UserOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import styled from "styled-components";
import { showNotification } from "../../config/notificationConfig";
import { formatarChavePix, formatCurrency } from "../../utils/formatters";
import EstatisticasTurmaModal from "./EstatisticasTurmaModal";

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
`;

// Componente para formatação de data
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
};

const TurmaColheitaTable = ({ turmasColheita, loading, onEdit, onDelete }) => {
  const [modalEstatisticas, setModalEstatisticas] = useState({
    open: false,
    turmaId: null,
    turmaNome: "",
  });

  // Função para lidar com exclusão
  const handleDelete = (turma) => {
    if (onDelete) {
      onDelete(turma.id);
    }
  };

  // Função para lidar com edição
  const handleEdit = (turma) => {
    if (onEdit) {
      onEdit(turma);
    }
  };

  // Função para abrir modal de estatísticas
  const handleVerEstatisticas = (turma) => {
    setModalEstatisticas({
      open: true,
      turmaId: turma.id,
      turmaNome: turma.nomeColhedor,
    });
  };

  // Função para fechar modal de estatísticas
  const handleFecharEstatisticas = () => {
    setModalEstatisticas({
      open: false,
      turmaId: null,
      turmaNome: "",
    });
  };

  const columns = [
    {
      title: "Colhedor",
      dataIndex: "nomeColhedor",
      key: "nomeColhedor",
      width: "25%",
      sorter: (a, b) => {
        const nomeA = a.nomeColhedor || "";
        const nomeB = b.nomeColhedor || "";
        return nomeA.localeCompare(nomeB);
      },
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#059669" }} />
          <Text strong>{text || "Não informado"}</Text>
        </Space>
      ),
    },
    {
      title: "Chave PIX",
      dataIndex: "chavePix",
      key: "chavePix",
      width: "25%",
      render: (text) => (
        <Text style={{ fontSize: "13px" }}>
          {formatarChavePix(text)}
        </Text>
      ),
    },
    {
      title: "Data Cadastro",
      dataIndex: "dataCadastro",
      key: "dataCadastro",
      width: "20%",
      render: (date) => (
        <Text type="secondary">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Observações",
      dataIndex: "observacoes",
      key: "observacoes",
      width: "15%",
      render: (text) => (
        <Text ellipsis={{ tooltip: text }}>
          {text || "Nenhuma observação"}
        </Text>
      ),
    },
    {
      title: "Total Colhido",
      key: "totalColhido",
      width: "15%",
      sorter: (a, b) => {
        const quantidadeA = a.estatisticas?.totalGeral?.quantidade || 0;
        const quantidadeB = b.estatisticas?.totalGeral?.quantidade || 0;
        return quantidadeA - quantidadeB;
      },
      render: (_, record) => {
        const estatisticas = record.estatisticas;
        if (!estatisticas || !estatisticas.totalGeral) {
          return <Text type="secondary">-</Text>;
        }
        
        const { quantidade, totalPedidos, totalFrutas } = estatisticas.totalGeral;
        const totaisPorUnidade = estatisticas.totaisPorUnidade || {};
        const unidades = Object.keys(totaisPorUnidade);
        
        return (
          <Space direction="vertical" size={3}>
            <Text strong style={{ fontSize: "11px", color: "#059669" }}>
              {totalPedidos} pedidos • {totalFrutas} frutas
            </Text>
            {unidades.length > 0 && (
              <Space direction="vertical" size={2}>
                {unidades.slice(0, 2).map(unidade => {
                  const total = totaisPorUnidade[unidade];
                  return (
                    <Text key={unidade} style={{ 
                      fontSize: "11px", 
                      color: "#1890ff",
                      fontWeight: "500"
                    }}>
                      {total.quantidade.toLocaleString('pt-BR')} {unidade}
                    </Text>
                  );
                })}
                {unidades.length > 2 && (
                  <Text style={{ 
                    fontSize: "10px", 
                    color: "#8c8c8c",
                    fontStyle: "italic"
                  }}>
                    +{unidades.length - 2} outras
                  </Text>
                )}
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: "Valor Total",
      key: "valorTotal",
      width: "12%",
      sorter: (a, b) => {
        const valorA = a.estatisticas?.totalGeral?.valor || 0;
        const valorB = b.estatisticas?.totalGeral?.valor || 0;
        return valorA - valorB;
      },
      render: (_, record) => {
        const estatisticas = record.estatisticas;
        if (!estatisticas || !estatisticas.totalGeral) {
          return <Text type="secondary">-</Text>;
        }
        
        const { valor, valorPago } = estatisticas.totalGeral;
        
        return (
          <Space direction="vertical" size={2}>
            <Text strong style={{ fontSize: "12px", color: "#059669" }}>
              R$ {formatCurrency(valor)}
            </Text>
            {valorPago > 0 && (
              <Text type="secondary" style={{ fontSize: "10px" }}>
                Pago: R$ {formatCurrency(valorPago)}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Valor Pago",
      key: "valorPago",
      width: "12%",
      sorter: (a, b) => {
        const valorPagoA = a.estatisticas?.totalGeral?.valorPago || 0;
        const valorPagoB = b.estatisticas?.totalGeral?.valorPago || 0;
        return valorPagoA - valorPagoB;
      },
      render: (_, record) => {
        const estatisticas = record.estatisticas;
        if (!estatisticas || !estatisticas.totalGeral) {
          return <Text type="secondary">-</Text>;
        }
        
        const { valorPago } = estatisticas.totalGeral;
        
        if (valorPago === 0) {
          return <Text type="secondary">Nenhum pago</Text>;
        }
        
        return (
          <Text strong style={{ fontSize: "12px", color: "#52c41a" }}>
            R$ {formatCurrency(valorPago)}
          </Text>
        );
      },
    },
    {
      title: "Ações",
      key: "acoes",
      width: "8%",
      fixed: "right",
      render: (_, record) => {
        const menuItems = [
          {
            key: "estatisticas",
            label: "Estatísticas",
            icon: <BarChartOutlined />,
            onClick: () => handleVerEstatisticas(record),
          },
          {
            key: "edit",
            label: "Editar",
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: "delete",
            label: "Excluir",
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record),
            danger: true,
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <StyledTable
        columns={columns}
        dataSource={turmasColheita}
        loading={loading}
        rowKey="id"
        size="middle"
        pagination={false}
        scroll={{ x: "100%" }}
        bordered={true}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary">
                  Nenhuma turma de colheita encontrada
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
      
      {/* Modal de Estatísticas */}
      <EstatisticasTurmaModal
        open={modalEstatisticas.open}
        onClose={handleFecharEstatisticas}
        turmaId={modalEstatisticas.turmaId}
        turmaNome={modalEstatisticas.turmaNome}
      />
    </>
  );
};

TurmaColheitaTable.propTypes = {
  turmasColheita: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

TurmaColheitaTable.defaultProps = {
  loading: false,
  onEdit: null,
  onDelete: null,
};

export default TurmaColheitaTable;