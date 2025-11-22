// src/components/arh/folha-pagamento/LancamentosTable.js

import React from "react";
import { Button, Space, Tag, Empty, Typography, Tooltip, Dropdown } from "antd";
import { EditOutlined, DollarOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import ResponsiveTable from "../../common/ResponsiveTable";
import { capitalizeName } from "../../../utils/formatters";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";

const { Text } = Typography;

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const LancamentosTable = React.memo(
  ({ lancamentos, loading, onEditLancamento, onEditPagamento, onRemoveFuncionario }) => {
    const [confirmModal, setConfirmModal] = React.useState({ open: false, record: null });

    // Função para criar o menu de ações
    const getMenuContent = (record) => {
      const menuItems = [
        {
          key: "edit",
          label: (
            <Space>
              <EditOutlined style={{ color: "#fa8c16" }} />
              <span style={{ color: "#333" }}>Calcular Lançamento</span>
            </Space>
          ),
          onClick: () => onEditLancamento(record),
        },
        {
          key: "payment",
          label: (
            <Space>
              <DollarOutlined style={{ color: "#059669" }} />
              <span style={{ color: "#333" }}>Atualizar Pagamento</span>
            </Space>
          ),
          onClick: () => onEditPagamento(record),
        },
        {
          type: "divider",
        },
        {
          key: "delete",
          label: (
            <Space>
              <DeleteOutlined style={{ color: "#ff4d4f" }} />
              <span style={{ color: "#333" }}>Remover da Folha</span>
            </Space>
          ),
          onClick: () => setConfirmModal({ open: true, record }),
        },
      ];

      return { items: menuItems };
    };

    const handleConfirmRemove = () => {
      if (confirmModal.record) {
        onRemoveFuncionario(confirmModal.record.id);
      }
      setConfirmModal({ open: false, record: null });
    };
    const columns = [
      {
        title: "Funcionário",
        dataIndex: ["funcionario", "nome"],
        key: "funcionario",
        width: 200,
        render: (_, record) => (
          <div>
            <Text strong style={{ color: "#059669", fontSize: "14px" }}>
              {record.funcionario?.nome ? capitalizeName(record.funcionario.nome) : "—"}
            </Text>
            <div style={{ fontSize: 12, color: "#666666" }}>
              {record.tipoContrato}
            </div>
          </div>
        ),
      },
      {
        title: "Dias",
        dataIndex: "diasTrabalhados",
        key: "diasTrabalhados",
        width: 70,
        align: "center",
        render: (value) => (
          <Text style={{ color: "#333333", fontSize: "12px" }}>{value}</Text>
        ),
      },
      {
        title: "Faltas",
        dataIndex: "faltas",
        key: "faltas",
        width: 70,
        align: "center",
        render: (value) => (
          <Text style={{ color: value > 0 ? "#ff4d4f" : "#333333", fontSize: "12px" }}>
            {value || 0}
          </Text>
        ),
      },
      {
        title: "H. Extras",
        dataIndex: "horasExtras",
        key: "horasExtras",
        width: 90,
        align: "center",
        render: (value) => (
          <Text style={{ color: "#333333", fontSize: "12px" }}>
            {Number(value || 0).toFixed(1)}h
          </Text>
        ),
      },
      {
        title: "Ajuda Custo",
        dataIndex: "ajudaCusto",
        key: "ajudaCusto",
        width: 110,
        align: "right",
        render: (value) => (
          <Text style={{ color: "#52c41a", fontSize: "12px" }}>
            {value > 0 ? currency(value) : "—"}
          </Text>
        ),
      },
      {
        title: "Descontos",
        dataIndex: "descontosExtras",
        key: "descontosExtras",
        width: 110,
        align: "right",
        render: (value) => (
          <Text style={{ color: "#ff4d4f", fontSize: "12px" }}>
            {value > 0 ? currency(value) : "—"}
          </Text>
        ),
      },
      {
        title: "Adiantamento",
        dataIndex: "adiantamento",
        key: "adiantamento",
        width: 120,
        align: "right",
        render: (value) => (
          <Text style={{ color: "#fa8c16", fontSize: "12px" }}>
            {value > 0 ? currency(value) : "—"}
          </Text>
        ),
      },
      {
        title: "Valor Bruto",
        dataIndex: "valorBruto",
        key: "valorBruto",
        width: 120,
        align: "right",
        render: (value) => (
          <Text strong style={{ color: "#333333", fontSize: "12px" }}>
            {currency(value)}
          </Text>
        ),
      },
      {
        title: "Valor Líquido",
        dataIndex: "valorLiquido",
        key: "valorLiquido",
        width: 120,
        align: "right",
        render: (value) => (
          <Text strong style={{ color: "#059669", fontSize: "13px" }}>
            {currency(value)}
          </Text>
        ),
      },
      {
        title: "Método Pag.",
        dataIndex: "meioPagamento",
        key: "meioPagamento",
        width: 100,
        render: (meio) => <Tag color="#1890ff">{meio}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "statusPagamento",
        key: "statusPagamento",
        width: 120,
        render: (status) => (
          <Tag color={status === "PAGO" ? "#52c41a" : "#faad14"}>{status}</Tag>
        ),
      },
      {
        title: "Ações",
        key: "acoes",
        width: 120,
        align: "center",
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Calcular Lançamento">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: "#fa8c16", fontSize: "16px" }} />}
                onClick={() => onEditLancamento(record)}
                style={{
                  border: "none",
                  boxShadow: "none",
                  padding: "4px",
                }}
              />
            </Tooltip>
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
          </Space>
        ),
      },
    ];

    return (
      <>
        <ResponsiveTable
          columns={columns}
          dataSource={lancamentos}
          rowKey="id"
          loading={loading}
          pagination={false}
          bordered={true}
          size="middle"
          showScrollHint={true}
          scroll={{ x: 1600 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhum lançamento encontrado"
              />
            ),
          }}
        />

        {/* Modal de Confirmação */}
        <ConfirmActionModal
          open={confirmModal.open}
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmModal({ open: false, record: null })}
          title="Remover Funcionário da Folha?"
          message={`Tem certeza que deseja remover ${confirmModal.record?.funcionario?.nome ? capitalizeName(confirmModal.record.funcionario.nome) : "este funcionário"} da folha de pagamento?`}
          confirmText="Sim, Remover"
          cancelText="Cancelar"
          confirmButtonDanger={true}
          icon={<DeleteOutlined />}
          iconColor="#ff4d4f"
        />
      </>
    );
  }
);

LancamentosTable.propTypes = {
  lancamentos: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEditLancamento: PropTypes.func.isRequired,
  onEditPagamento: PropTypes.func.isRequired,
  onRemoveFuncionario: PropTypes.func.isRequired,
};

export default LancamentosTable;

