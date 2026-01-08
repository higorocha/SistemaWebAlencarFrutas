// src/components/fornecedores/FornecedoresTable.js

import React, { useState } from "react";
import { Dropdown, Button, Space, Tag, Empty, Typography, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TagOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import ResponsiveTable from "../common/ResponsiveTable";
import { showNotification } from "../../config/notificationConfig";
import EstatisticasFornecedorModal from "./EstatisticasFornecedorModal";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";

const { Text } = Typography;

// Removido CSS específico de Table; usamos ResponsiveTable padronizado do sistema

// Função para capitalizar nome
function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Função para formatar status do fornecedor
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


const FornecedoresTable = React.memo(({
  fornecedores,
  loading = false,
  onEdit,
  onDelete,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onShowSizeChange,
}) => {
  const [modalEstatisticas, setModalEstatisticas] = useState({
    open: false,
    fornecedorId: null,
    fornecedorNome: "",
  });

  // Estados para controle do modal de confirmação de exclusão
  const [confirmExclusaoOpen, setConfirmExclusaoOpen] = useState(false);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState(null);

  // Função para abrir modal de estatísticas
  const handleVerEstatisticas = (fornecedor) => {
    setModalEstatisticas({
      open: true,
      fornecedorId: fornecedor.id,
      fornecedorNome: fornecedor.nome,
    });
  };

  // Função para fechar modal de estatísticas
  const handleFecharEstatisticas = () => {
    setModalEstatisticas({
      open: false,
      fornecedorId: null,
      fornecedorNome: "",
    });
  };

  // Função para abrir o modal de confirmação de exclusão
  const handleExcluirFornecedor = (fornecedor) => {
    setFornecedorParaExcluir(fornecedor);
    setConfirmExclusaoOpen(true);
  };

  // Função para confirmar a exclusão
  const handleConfirmarExclusao = async () => {
    if (!fornecedorParaExcluir) return;

    setConfirmExclusaoOpen(false);
    
    try {
      await onDelete(fornecedorParaExcluir.id);
      setFornecedorParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
    } finally {
      setFornecedorParaExcluir(null);
    }
  };

  // Função para cancelar a exclusão
  const handleCancelarExclusao = () => {
    setConfirmExclusaoOpen(false);
    setFornecedorParaExcluir(null);
  };

  // Função para criar o menu de ações
  const getMenuContent = (record) => {
    const menuItems = [
      {
        key: "estatisticas",
        label: (
          <Space>
            <BarChartOutlined style={{ color: "#059669" }} />
            <span style={{ color: "#333" }}>Colheitas</span>
          </Space>
        ),
        onClick: () => handleVerEstatisticas(record),
      },
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
        onClick: () => handleExcluirFornecedor(record),
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
          {!record.cnpj && !record.cpf && (
            <div style={{ fontSize: "12px", color: "#999999" }}>
              <Text style={{ color: "#999999" }}>-</Text>
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
          {record.telefone && (
            <div style={{ fontSize: "12px" }}>
              <PhoneOutlined style={{ marginRight: "4px", color: "#059669" }} />
              <Text style={{ color: "#333333" }}>{record.telefone}</Text>
            </div>
          )}
          {record.email && (
            <div style={{ fontSize: "12px" }}>
              <MailOutlined style={{ marginRight: "4px", color: "#059669" }} />
              <Text style={{ color: "#333333" }}>{record.email}</Text>
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
      title: "Áreas",
      key: "areas",
      render: (_, record) => {
        const areas = record.areas || [];
        const maxVisibleAreas = 2; // Reduzido para dar espaço para cultura
        const visibleAreas = areas.slice(0, maxVisibleAreas);
        const hiddenAreas = areas.slice(maxVisibleAreas);
        
        if (areas.length === 0) {
          return (
            <div style={{ fontSize: "12px", color: "#999999" }}>
              <TagOutlined style={{ marginRight: "4px", color: "#d9d9d9" }} />
              Nenhuma área
            </div>
          );
        }

        return (
          <div>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {visibleAreas.map((area, index) => (
                <div key={area.id || index} style={{ marginBottom: "4px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#059669", marginBottom: "2px" }}>
                    {area.nome}
                  </div>
                  {area.cultura && (
                    <div style={{ fontSize: "10px", color: "#666666", fontStyle: "italic" }}>
                      🥬 {area.cultura.descricao}
                    </div>
                  )}
                </div>
              ))}
              
              {hiddenAreas.length > 0 && (
                <Tooltip
                  title={
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                        Mais {hiddenAreas.length} área(s):
                      </div>
                      {hiddenAreas.map((area, index) => (
                        <div key={area.id || index} style={{ marginBottom: "4px" }}>
                          <div style={{ fontWeight: "500" }}>• {area.nome}</div>
                          {area.cultura && (
                            <div style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>
                              🥬 {area.cultura.descricao}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  }
                  placement="top"
                  color="#059669"
                >
                  <Tag
                    color="#059669"
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid #059669",
                      backgroundColor: "#059669",
                      color: "#ffffff",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    +{hiddenAreas.length}
                  </Tag>
                </Tooltip>
              )}
            </Space>
          </div>
        );
      },
      width: "25%",
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

  // Paginação interna dos dados exibidos
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = fornecedores.slice(startIndex, endIndex);

  return (
    <>
      <ResponsiveTable
        columns={columns}
        dataSource={paginatedData}
        rowKey="id"
        loading={loading}
        pagination={false}
        minWidthMobile={1200}
        showScrollHint={true}
        size="middle"
        bordered={true}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
                  Nenhum fornecedor encontrado
                </span>
              }
            />
          ),
        }}
      />

      {/* Modal de Estatísticas */}
      <EstatisticasFornecedorModal
        open={modalEstatisticas.open}
        onClose={handleFecharEstatisticas}
        fornecedorId={modalEstatisticas.fornecedorId}
        fornecedorNome={modalEstatisticas.fornecedorNome}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmActionModal
        open={confirmExclusaoOpen}
        onConfirm={handleConfirmarExclusao}
        onCancel={handleCancelarExclusao}
        title="Excluir Fornecedor"
        message={`Tem certeza que deseja excluir o fornecedor "${fornecedorParaExcluir?.nome ? capitalizeName(fornecedorParaExcluir.nome) : ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        confirmButtonDanger={true}
        icon={<DeleteOutlined />}
        iconColor="#ff4d4f"
      />
    </>
  );
});

FornecedoresTable.propTypes = {
  fornecedores: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func,
  onShowSizeChange: PropTypes.func,
};

FornecedoresTable.displayName = 'FornecedoresTable';

export default FornecedoresTable;
