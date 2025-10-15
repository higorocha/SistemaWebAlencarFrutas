// src/components/areas/AreasTable.js

import React, { useState, useMemo } from "react";
import { Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import ResponsiveTable from "../common/ResponsiveTable";
import DetalhesAreaModal from "./DetalhesAreaModal";
import { CentralizedLoader } from "../common/loaders";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";

const { Text } = Typography;

// Função para capitalizar nome
function capitalizeName(name) {
  if (!name) return "";
  
  return name
    .split(" ")
    .map((word) => {
      // Se contém 'Lote' ou 'Setor', mantém capitalização normal
      if (word.toLowerCase().includes('lote') || word.toLowerCase().includes('setor')) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Caso contrário, aplica uppercase
      return word.toUpperCase();
    })
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
  allAreas = [], // Todos os dados para gerar filtros corretos
  loading = false,
  onEdit,
  onDelete,
  onOpenMap,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onShowSizeChange,
}) => {
  // Estado do modal de detalhes
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [dadosDetalhes, setDadosDetalhes] = useState(null);

  // Calcular filtros de culturas usando TODOS os dados (useMemo garante cálculo único)
  const culturasFilters = useMemo(() => {
    const culturasSet = new Set();
    
    // Usar allAreas se disponível, senão usar areas como fallback
    const dadosParaFiltro = allAreas.length > 0 ? allAreas : areas;
    
    dadosParaFiltro.forEach(area => {
      const culturas = area.culturas || area.culturasDetalhadas || [];
      culturas.forEach(cultura => {
        const descricao = cultura.descricao || `Cultura ${cultura.culturaId}`;
        culturasSet.add(descricao);
      });
    });
    
    return Array.from(culturasSet)
      .sort()
      .map(cultura => ({
        text: cultura,
        value: cultura
      }));
  }, [allAreas, areas]); // Recalcula apenas quando allAreas ou areas mudam

  // Função para buscar detalhes da área do backend
  const handleOpenDetalhesModal = async (area) => {
    try {
      setLoadingDetalhes(true);
      setDetalhesModalOpen(true);
      setAreaSelecionada(area);

      // Buscar detalhes completos do backend
      const response = await axiosInstance.get(`/api/areas-agricolas/${area.id}/detalhes`);
      setDadosDetalhes(response.data);

    } catch (error) {
      console.error("Erro ao buscar detalhes da área:", error);
      showNotification("error", "Erro", "Erro ao carregar detalhes da área");
      setDetalhesModalOpen(false);
      setAreaSelecionada(null);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  // Função para criar o menu de ações
  const getMenuContent = (record) => {
    const menuItems = [
      {
        key: "detalhes",
        label: (
          <Space>
            <BarChartOutlined style={{ color: "#059669" }} />
            <span style={{ color: "#333" }}>Ver Detalhes</span>
          </Space>
        ),
        onClick: () => handleOpenDetalhesModal(record),
      },
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
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      sorter: (a, b) => a.categoria.localeCompare(b.categoria),
      render: (categoria) => categoria ? formatarCategoria(categoria) : "-",
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
    },
    {
      title: "Culturas",
      key: "culturas",
      filters: culturasFilters,
      onFilter: (value, record) => {
        const culturas = record.culturas || record.culturasDetalhadas || [];
        return culturas.some(cultura => {
          const descricao = cultura.descricao || `Cultura ${cultura.culturaId}`;
          return descricao === value;
        });
      },
      filterSearch: true,
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
    },
    {
      title: "Ações",
      key: "acoes",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={getMenuContent(record)}
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

  // Função para determinar a classe CSS da linha
  const assignRowClassName = (record, index) => {
    return index % 2 === 0 ? "even-row" : "odd-row";
  };

  return (
    <>
      <ResponsiveTable
        columns={columns}
        dataSource={areas}
        loading={loading}
        rowKey="id"
        minWidthMobile={800}
        showScrollHint={true}
        rowClassName={assignRowClassName}
        size="middle"
        bordered={true}
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
      />

      {/* Modal de Detalhes da Área */}
      <DetalhesAreaModal
        open={detalhesModalOpen}
        onClose={() => {
          setDetalhesModalOpen(false);
          setAreaSelecionada(null);
          setDadosDetalhes(null);
        }}
        area={dadosDetalhes}
        loading={loadingDetalhes}
      />

      {/* Loading centralizado para buscar detalhes */}
      <CentralizedLoader
        visible={loadingDetalhes}
        message="Carregando detalhes da área..."
        subMessage="Buscando pedidos, estatísticas e KPIs..."
      />
    </>
  );
});

AreasTable.propTypes = {
  areas: PropTypes.array.isRequired,
  allAreas: PropTypes.array, // Todos os dados para gerar filtros corretos
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