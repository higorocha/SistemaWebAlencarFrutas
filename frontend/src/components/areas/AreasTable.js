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
import ConfirmActionModal from "../common/modals/ConfirmActionModal";

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
  onFilterChange,
  onReload, // Nova prop para recarregar dados
  filtrosAplicados = {}, // Filtros atualmente aplicados
}) => {
  // Estado do modal de detalhes
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [dadosDetalhes, setDadosDetalhes] = useState(null);

  // Estado do modal de confirmação para desativar/reativar
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [areaParaToggle, setAreaParaToggle] = useState(null);

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

  // Calcular filtros de status usando TODOS os dados (useMemo garante cálculo único)
  const statusFilters = useMemo(() => {
    return [
      {
        text: "Ativa",
        value: false
      },
      {
        text: "Desativada", 
        value: true
      }
    ];
  }, []); // Filtros de status são fixos

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

  // Função para abrir modal de confirmação para desativar/reativar área
  const handleToggleDesativar = (area) => {
    setAreaParaToggle(area);
    setConfirmModalOpen(true);
  };

  // Função para executar a desativação/reativação após confirmação
  const handleConfirmToggleDesativar = async () => {
    if (!areaParaToggle) return;

    try {
      const response = await axiosInstance.patch(`/api/areas-agricolas/${areaParaToggle.id}/toggle-desativar`);
      
      if (response.data) {
        const statusText = response.data.desativar ? "desativada" : "reativada";
        showNotification("success", "Sucesso", `Área ${statusText} com sucesso!`);
        
        // Recarregar a lista de áreas
        if (onReload) {
          onReload();
        }
      }
    } catch (error) {
      console.error("Erro ao alterar status da área:", error);
      const errorMessage = error.response?.data?.message || "Erro ao alterar status da área";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setConfirmModalOpen(false);
      setAreaParaToggle(null);
    }
  };

  // Função para cancelar a confirmação
  const handleCancelToggleDesativar = () => {
    setConfirmModalOpen(false);
    setAreaParaToggle(null);
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
        key: "toggle-desativar",
        label: (
          <Space>
            <InfoCircleOutlined style={{ color: record.desativar ? "#10b981" : "#f59e0b" }} />
            <span style={{ color: "#333" }}>
              {record.desativar ? "Reativar Área" : "Desativar Área"}
            </span>
          </Space>
        ),
        onClick: () => handleToggleDesativar(record),
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
      title: "Status",
      dataIndex: "desativar",
      key: "status",
      width: 100,
      align: "center",
      filters: statusFilters,
      onFilter: (value, record) => {
        return record.desativar === value;
      },
      filterSearch: true,
      filteredValue: filtrosAplicados.status || null, // Sincronizar com filtros aplicados
      render: (desativar) => (
        <Tag
          color={desativar ? "red" : "green"}
          style={{
            borderRadius: "4px",
            fontWeight: "500",
            fontSize: "12px",
          }}
        >
          {desativar ? "Desativada" : "Ativa"}
        </Tag>
      ),
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
        // Este filtro não será usado, mas mantemos para compatibilidade
        const culturas = record.culturas || record.culturasDetalhadas || [];
        return culturas.some(cultura => {
          const descricao = cultura.descricao || `Cultura ${cultura.culturaId}`;
          return descricao === value;
        });
      },
      filterSearch: true,
      filteredValue: filtrosAplicados.culturas || null, // Sincronizar com filtros aplicados
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
        onChange={(pagination, filters, sorter) => {
          // Callback para mudanças de filtros
          if (onFilterChange) {
            onFilterChange(filters);
          }
        }}
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

      {/* Modal de confirmação para desativar/reativar área */}
      <ConfirmActionModal
        open={confirmModalOpen}
        onConfirm={handleConfirmToggleDesativar}
        onCancel={handleCancelToggleDesativar}
        title={areaParaToggle?.desativar ? "Reativar Área" : "Desativar Área"}
        message={`Tem certeza que deseja ${areaParaToggle?.desativar ? "reativar" : "desativar"} a área "${areaParaToggle?.nome}"?`}
        confirmText={areaParaToggle?.desativar ? "Sim, Reativar" : "Sim, Desativar"}
        cancelText="Cancelar"
        confirmButtonDanger={!areaParaToggle?.desativar}
        icon={<InfoCircleOutlined />}
        iconColor={areaParaToggle?.desativar ? "#10b981" : "#f59e0b"}
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
  onFilterChange: PropTypes.func, // Callback para mudanças de filtros
};

AreasTable.displayName = 'AreasTable';

export default AreasTable;