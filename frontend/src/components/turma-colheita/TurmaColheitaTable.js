// src/components/turma-colheita/TurmaColheitaTable.js

import React, { useState } from "react";
import { Dropdown, Button, Space, Tag, Empty, Typography, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  UserOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { showNotification } from "../../config/notificationConfig";
import { formatarChavePixPorTipo, formatCurrency, capitalizeName } from "../../utils/formatters";
import EstatisticasTurmaModal from "./EstatisticasTurmaModal";
import ResponsiveTable from "../common/ResponsiveTable";

const { Text } = Typography;

// Componente para formatação de data
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
};

const TurmaColheitaTable = ({ turmasColheita, loading = false, onEdit = null, onDelete = null }) => {
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
      align: "center",
      sorter: (a, b) => {
        const nomeA = a.nomeColhedor || "";
        const nomeB = b.nomeColhedor || "";
        return nomeA.localeCompare(nomeB);
      },
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#059669" }} />
          <Text strong>{text ? capitalizeName(text) : "Não informado"}</Text>
        </Space>
      ),
    },
    {
      title: "Chave PIX",
      dataIndex: "chavePix",
      key: "chavePix",
      align: "center",
      render: (text, record) => (
        <Text style={{ fontSize: "13px" }}>
          {formatarChavePixPorTipo(text, record.tipoChavePix)}
        </Text>
      ),
    },
    {
      title: "Responsável PIX",
      dataIndex: "responsavelChavePix",
      key: "responsavelChavePix",
      align: "center",
      render: (text) => (
        <Text style={{ fontSize: "13px" }}>
          {text ? capitalizeName(text) : "Não informado"}
        </Text>
      ),
    },
    {
      title: "Data Cadastro",
      dataIndex: "dataCadastro",
      key: "dataCadastro",
      width: 120,
      align: "center",
      render: (date) => (
        <Text type="secondary">{formatDate(date)}</Text>
      ),
    },
    {
      title: "Observações",
      dataIndex: "observacoes",
      key: "observacoes",
      align: "center",
      render: (text) => (
        <Text ellipsis={{ tooltip: text }}>
          {text || "Nenhuma observação"}
        </Text>
      ),
    },
    {
      title: "Total Colhido",
      key: "totalColhido",
      width: 140,
      align: "center",
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
      width: 120,
      align: "center",
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

        if (valor === 0) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Text strong style={{ fontSize: "12px", color: "#059669" }}>
            R$ {formatCurrency(valor)}
          </Text>
        );
      },
    },
    {
      title: "Valor Pago",
      key: "valorPago",
      width: 120,
      align: "center",
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
          return <Text type="secondary">-</Text>;
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
      width: 80,
      align: "center",
      render: (_, record) => {
        const menuItems = [
          {
            key: "colheitas",
            label: (
              <Space>
                <BarChartOutlined style={{ color: "#059669" }} />
                <span style={{ color: "#333" }}>Colheitas</span>
              </Space>
            ),
            onClick: () => handleVerEstatisticas(record),
          },
          {
            key: "edit",
            label: (
              <Space>
                <EditOutlined style={{ color: "#fa8c16" }} />
                <span style={{ color: "#333" }}>Editar</span>
              </Space>
            ),
            onClick: () => handleEdit(record),
          },
          {
            key: "delete",
            label: (
              <Space>
                <DeleteOutlined style={{ color: "#ff4d4f" }} />
                <span style={{ color: "#333" }}>Excluir</span>
              </Space>
            ),
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
              style={{
                color: "#666666",
                border: "none",
                boxShadow: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <ResponsiveTable
        columns={columns}
        dataSource={turmasColheita}
        loading={loading}
        rowKey="id"
        minWidthMobile={1200}
        showScrollHint={true}
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


export default TurmaColheitaTable;