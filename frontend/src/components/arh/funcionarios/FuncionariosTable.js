// src/components/arh/funcionarios/FuncionariosTable.js

import React, { useState } from "react";
import { Dropdown, Button, Space, Tag, Empty, Typography } from "antd";
import { EditOutlined, MoreOutlined, InfoCircleOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { showNotification } from "../../../config/notificationConfig";
import ResponsiveTable from "../../common/ResponsiveTable";
import { capitalizeName, formatarCPF, formatarChavePixPorTipo } from "../../../utils/formatters";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";

const { Text } = Typography;

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

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

// Função para formatar tipo de contrato
const formatarTipoContrato = (tipo) => {
  if (!tipo) return "-";

  const tipoConfig = {
    MENSALISTA: { texto: "Mensalista", cor: "#10b981" },
    DIARISTA: { texto: "Diarista", cor: "#06b6d4" },
    EVENTUAL: { texto: "Eventual", cor: "#f59e0b" },
  };

  const config = tipoConfig[tipo] || { texto: tipo, cor: "#d9d9d9" };
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

const FuncionariosTable = React.memo(
  ({
    funcionarios,
    loading = false,
    onEdit,
    onToggleStatus,
    currentPage = 1,
    pageSize = 20,
    onStatusFilter,
    onTipoFilter,
    currentStatusFilter,
    currentTipoFilter,
  }) => {
    // Estado para controlar o modal de confirmação
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [funcionarioParaToggle, setFuncionarioParaToggle] = useState(null);

    // Função para abrir modal de confirmação
    const handleOpenConfirmModal = (funcionario) => {
      setFuncionarioParaToggle(funcionario);
      setConfirmModalOpen(true);
    };

    // Função para fechar modal de confirmação
    const handleCloseConfirmModal = () => {
      setConfirmModalOpen(false);
      setFuncionarioParaToggle(null);
    };

    // Função para confirmar toggle de status
    const handleConfirmToggle = () => {
      if (funcionarioParaToggle) {
        onToggleStatus(funcionarioParaToggle);
      }
      handleCloseConfirmModal();
    };

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
            showNotification(
              "info",
              "Funcionalidade em Desenvolvimento",
              "Esta funcionalidade está sendo implementada e estará disponível em breve."
            );
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
          key: "status",
          label: (
            <Space>
              {record.status === "ATIVO" ? (
                <StopOutlined style={{ color: "#ff4d4f" }} />
              ) : (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              )}
              <span style={{ color: "#333" }}>
                {record.status === "ATIVO" ? "Inativar" : "Ativar"}
              </span>
            </Space>
          ),
          onClick: () => handleOpenConfirmModal(record),
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
        width: 160,
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
        title: "CPF",
        dataIndex: "cpf",
        key: "cpf",
        width: 130,
        render: (cpf) => (
          <Text style={{ color: "#333333", fontSize: "12px" }}>
            {cpf ? formatarCPF(cpf) : "—"}
          </Text>
        ),
      },
      {
        title: "Chave PIX",
        dataIndex: "chavePix",
        key: "chavePix",
        width: 200,
        render: (chavePix, record) => (
          <div>
            <Text style={{ color: "#333333", fontSize: "12px" }}>
              {chavePix ? formatarChavePixPorTipo(chavePix, record.tipoChavePix) : "—"}
            </Text>
            {record.modalidadeChave && (
              <div style={{ fontSize: "11px", color: "#999999", marginTop: "2px" }}>
                {record.modalidadeChave}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Contrato",
        dataIndex: "tipoContrato",
        key: "tipoContrato",
        width: 110,
        render: (tipo) => formatarTipoContrato(tipo),
      },
      {
        title: "Cargo / Função",
        key: "vinculo",
        width: 150,
        render: (_, record) => {
          const nomeCargoFuncao = record.cargo?.nome || record.funcao?.nome;
          return (
            <Text style={{ color: "#333333", fontSize: "12px" }}>
              {nomeCargoFuncao ? capitalizeName(nomeCargoFuncao) : "—"}
            </Text>
          );
        },
      },
      {
        title: "Gerente",
        key: "gerente",
        width: 150,
        render: (_, record) => (
          <Text style={{ color: "#333333", fontSize: "12px" }}>
            {record.gerente?.nome ? capitalizeName(record.gerente.nome) : "—"}
          </Text>
        ),
      },
      {
        title: "Salário / Diária",
        key: "valor",
        width: 130,
        render: (_, record) => {
          if (record.tipoContrato === "DIARISTA") {
            const valor =
              record.valorDiariaCustomizada ||
              record.funcao?.valorDiariaBase ||
              0;
            return (
              <Text style={{ color: "#333333", fontSize: "12px" }}>
                {formatCurrency(valor)} / dia
              </Text>
            );
          }
          const valor =
            record.salarioCustomizado || record.cargo?.salarioMensal || 0;
          return (
            <Text style={{ color: "#333333", fontSize: "12px" }}>
              {formatCurrency(valor)}
            </Text>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status) => formatarStatus(status),
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

    // Paginação interna dos dados exibidos
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = funcionarios.slice(startIndex, endIndex);

    return (
      <>
        <ResponsiveTable
          columns={columns}
          dataSource={paginatedData}
          rowKey="id"
          loading={loading}
          pagination={false}
          bordered={true}
          size="middle"
          showScrollHint={true}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhum funcionário encontrado"
              />
            ),
          }}
        />

        {/* Modal de Confirmação */}
        <ConfirmActionModal
          open={confirmModalOpen}
          onConfirm={handleConfirmToggle}
          onCancel={handleCloseConfirmModal}
          title={
            funcionarioParaToggle?.status === "ATIVO"
              ? "Confirmar Inativação"
              : "Confirmar Ativação"
          }
          message={
            funcionarioParaToggle?.status === "ATIVO"
              ? `Tem certeza que deseja inativar o funcionário ${funcionarioParaToggle?.nome ? capitalizeName(funcionarioParaToggle.nome) : ""}?`
              : `Tem certeza que deseja ativar o funcionário ${funcionarioParaToggle?.nome ? capitalizeName(funcionarioParaToggle.nome) : ""}?`
          }
          confirmText={
            funcionarioParaToggle?.status === "ATIVO" ? "Sim, Inativar" : "Sim, Ativar"
          }
          cancelText="Cancelar"
          confirmButtonDanger={funcionarioParaToggle?.status === "ATIVO"}
          icon={
            funcionarioParaToggle?.status === "ATIVO" ? (
              <StopOutlined />
            ) : (
              <CheckCircleOutlined />
            )
          }
          iconColor={funcionarioParaToggle?.status === "ATIVO" ? "#ff4d4f" : "#52c41a"}
        />
      </>
    );
  }
);

FuncionariosTable.propTypes = {
  funcionarios: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  onStatusFilter: PropTypes.func,
  onTipoFilter: PropTypes.func,
  currentStatusFilter: PropTypes.string,
  currentTipoFilter: PropTypes.string,
};

export default FuncionariosTable;
