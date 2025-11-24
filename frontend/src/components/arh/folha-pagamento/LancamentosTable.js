// src/components/arh/folha-pagamento/LancamentosTable.js

import React from "react";
import { Button, Space, Tag, Empty, Typography, Tooltip, Dropdown, InputNumber } from "antd";
import { EditOutlined, DollarOutlined, DeleteOutlined, MoreOutlined, CalculatorOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import ResponsiveTable from "../../common/ResponsiveTable";
import { capitalizeName } from "../../../utils/formatters";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";
import MonetaryInput from "../../common/inputs/MonetaryInput";

const { Text } = Typography;

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const LancamentosTable = React.memo(
  ({ lancamentos, loading, onEditLancamento, onEditPagamento, onRemoveFuncionario }) => {
    const [confirmModal, setConfirmModal] = React.useState({ open: false, record: null });
    const [editingId, setEditingId] = React.useState(null);
    const [editingValues, setEditingValues] = React.useState({});
    const [saving, setSaving] = React.useState(false);

    // Função para criar o menu de ações
    const getMenuContent = (record) => {
      const menuItems = [
        {
          key: "edit",
          label: (
            <Space>
              <CalculatorOutlined style={{ color: "#fa8c16" }} />
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

    const handleStartEdit = (record) => {
      setEditingId(record.id);
      setEditingValues({
        diasTrabalhados: record.diasTrabalhados,
        faltas: record.faltas || 0,
        horasExtras: Number(record.horasExtras || 0),
        valorHoraExtra: Number(record.valorHoraExtra || 0),
        ajudaCusto: Number(record.ajudaCusto || 0),
        descontosExtras: Number(record.descontosExtras || 0),
        adiantamento: Number(record.adiantamento || 0),
      });
    };

    const handleCancelEdit = () => {
      setEditingId(null);
      setEditingValues({});
    };

    const handleSaveEdit = async () => {
      if (!editingId) return;

      // Validação: diasTrabalhados é obrigatório
      if (editingValues.diasTrabalhados === undefined || editingValues.diasTrabalhados === null) {
        return;
      }

      setSaving(true);
      try {
        // Criar objeto com os valores editados
        const valuesToSave = {
          diasTrabalhados: editingValues.diasTrabalhados,
          faltas: editingValues.faltas || 0,
          horasExtras: editingValues.horasExtras || 0,
          valorHoraExtra: editingValues.valorHoraExtra || 0,
          ajudaCusto: editingValues.ajudaCusto || 0,
          descontosExtras: editingValues.descontosExtras || 0,
          adiantamento: editingValues.adiantamento || 0,
        };

        // Encontrar o record original
        const record = lancamentos.find(l => l.id === editingId);
        if (record) {
          await onEditLancamento(valuesToSave, record);
        }

        setEditingId(null);
        setEditingValues({});
      } catch (error) {
        console.error("Erro ao salvar:", error);
      } finally {
        setSaving(false);
      }
    };

    const handleFieldChange = (field, value) => {
      setEditingValues(prev => ({
        ...prev,
        [field]: value,
      }));
    };

    // Função para calcular valores bruto e líquido (mesma lógica do backend)
    const calcularValores = React.useCallback((record, valores) => {
      if (!record) return { valorBruto: 0, valorLiquido: 0 };

      const tipoContrato = record.tipoContrato;
      const salarioBaseReferencia = Number(record.salarioBaseReferencia || 0);
      const valorDiariaAplicada = Number(record.valorDiariaAplicada || 0);
      const diasTrabalhados = valores.diasTrabalhados || 0;
      const horasExtras = valores.horasExtras || 0;
      const valorHoraExtra = valores.valorHoraExtra || 0;
      const ajudaCusto = valores.ajudaCusto || 0;
      const descontosExtras = valores.descontosExtras || 0;
      const adiantamento = valores.adiantamento || 0;

      // Mensalistas recebem salário / 2 (quinzenal)
      // Diaristas recebem diária * dias trabalhados
      const valorBase =
        tipoContrato === "DIARISTA"
          ? valorDiariaAplicada * diasTrabalhados
          : salarioBaseReferencia / 2; // Mensalistas recebem metade do salário (quinzenal)

      const valorHorasExtras = horasExtras * valorHoraExtra;
      const valorBruto = Math.max(valorBase + ajudaCusto + valorHorasExtras - descontosExtras, 0);
      const valorLiquido = Math.max(valorBruto - adiantamento, 0);

      return { valorBruto, valorLiquido };
    }, []);

    // Calcular valores temporários quando estiver editando
    const valoresCalculados = React.useMemo(() => {
      if (!editingId) return null;
      const record = lancamentos.find(l => l.id === editingId);
      if (!record) return null;
      return calcularValores(record, editingValues);
    }, [editingId, editingValues, lancamentos, calcularValores]);
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
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <InputNumber
                min={0}
                value={editingValues.diasTrabalhados}
                onChange={(val) => handleFieldChange("diasTrabalhados", val)}
                size="small"
                style={{ width: "100%" }}
                autoFocus
              />
            );
          }
          return <Text style={{ color: "#333333", fontSize: "12px" }}>{value}</Text>;
        },
      },
      {
        title: "Faltas",
        dataIndex: "faltas",
        key: "faltas",
        width: 70,
        align: "center",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <InputNumber
                min={0}
                value={editingValues.faltas}
                onChange={(val) => handleFieldChange("faltas", val)}
                size="small"
                style={{ width: "100%" }}
              />
            );
          }
          return (
            <Text style={{ color: value > 0 ? "#ff4d4f" : "#333333", fontSize: "12px" }}>
              {value || 0}
            </Text>
          );
        },
      },
      {
        title: "H. Extras",
        dataIndex: "horasExtras",
        key: "horasExtras",
        width: 90,
        align: "center",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <InputNumber
                min={0}
                precision={1}
                value={editingValues.horasExtras}
                onChange={(val) => handleFieldChange("horasExtras", val)}
                size="small"
                style={{ width: "100%" }}
              />
            );
          }
          return (
            <Text style={{ color: "#333333", fontSize: "12px" }}>
              {Number(value || 0).toFixed(1)}h
            </Text>
          );
        },
      },
      {
        title: "Valor H. Extra",
        dataIndex: "valorHoraExtra",
        key: "valorHoraExtra",
        width: 110,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <MonetaryInput
                  value={editingValues.valorHoraExtra}
                  onChange={(val) => handleFieldChange("valorHoraExtra", val ? parseFloat(val) : 0)}
                  size="small"
                  style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  placeholder="0,00"
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 11px",
                    fontSize: "14px",
                    color: "rgba(0, 0, 0, 0.88)",
                    fontWeight: 400,
                    lineHeight: 1,
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    border: "1px solid #d9d9d9",
                    borderLeft: "none",
                    borderTopRightRadius: "6px",
                    borderBottomRightRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  R$
                </span>
              </div>
            );
          }
          return (
            <Text style={{ color: "#666", fontSize: "12px" }}>
              {value > 0 ? currency(value) : "—"}
            </Text>
          );
        },
      },
      {
        title: "Ajuda Custo",
        dataIndex: "ajudaCusto",
        key: "ajudaCusto",
        width: 110,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <MonetaryInput
                  value={editingValues.ajudaCusto}
                  onChange={(val) => handleFieldChange("ajudaCusto", val ? parseFloat(val) : 0)}
                  size="small"
                  style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  placeholder="0,00"
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 11px",
                    fontSize: "14px",
                    color: "rgba(0, 0, 0, 0.88)",
                    fontWeight: 400,
                    lineHeight: 1,
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    border: "1px solid #d9d9d9",
                    borderLeft: "none",
                    borderTopRightRadius: "6px",
                    borderBottomRightRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  R$
                </span>
              </div>
            );
          }
          return (
            <Text style={{ color: "#52c41a", fontSize: "12px" }}>
              {value > 0 ? currency(value) : "—"}
            </Text>
          );
        },
      },
      {
        title: "Descontos",
        dataIndex: "descontosExtras",
        key: "descontosExtras",
        width: 110,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <MonetaryInput
                  value={editingValues.descontosExtras}
                  onChange={(val) => handleFieldChange("descontosExtras", val ? parseFloat(val) : 0)}
                  size="small"
                  style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  placeholder="0,00"
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 11px",
                    fontSize: "14px",
                    color: "rgba(0, 0, 0, 0.88)",
                    fontWeight: 400,
                    lineHeight: 1,
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    border: "1px solid #d9d9d9",
                    borderLeft: "none",
                    borderTopRightRadius: "6px",
                    borderBottomRightRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  R$
                </span>
              </div>
            );
          }
          return (
            <Text style={{ color: "#ff4d4f", fontSize: "12px" }}>
              {value > 0 ? currency(value) : "—"}
            </Text>
          );
        },
      },
      {
        title: "Adiantamento",
        dataIndex: "adiantamento",
        key: "adiantamento",
        width: 120,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <MonetaryInput
                  value={editingValues.adiantamento}
                  onChange={(val) => handleFieldChange("adiantamento", val ? parseFloat(val) : 0)}
                  size="small"
                  style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  placeholder="0,00"
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 11px",
                    fontSize: "14px",
                    color: "rgba(0, 0, 0, 0.88)",
                    fontWeight: 400,
                    lineHeight: 1,
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    border: "1px solid #d9d9d9",
                    borderLeft: "none",
                    borderTopRightRadius: "6px",
                    borderBottomRightRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  R$
                </span>
              </div>
            );
          }
          return (
            <Text style={{ color: "#fa8c16", fontSize: "12px" }}>
              {value > 0 ? currency(value) : "—"}
            </Text>
          );
        },
      },
      {
        title: "Valor Bruto",
        dataIndex: "valorBruto",
        key: "valorBruto",
        width: 120,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          const valorExibir = isEditing && valoresCalculados 
            ? valoresCalculados.valorBruto 
            : value;
          
          return (
            <Text 
              strong 
              style={{ 
                color: "#333333", 
                fontSize: "12px",
                opacity: isEditing && valoresCalculados ? 0.7 : 1,
                fontStyle: isEditing && valoresCalculados ? "italic" : "normal"
              }}
            >
              {currency(valorExibir)}
            </Text>
          );
        },
      },
      {
        title: "Valor Líquido",
        dataIndex: "valorLiquido",
        key: "valorLiquido",
        width: 120,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          const valorExibir = isEditing && valoresCalculados 
            ? valoresCalculados.valorLiquido 
            : value;
          
          return (
            <Text 
              strong 
              style={{ 
                color: "#059669", 
                fontSize: "13px",
                opacity: isEditing && valoresCalculados ? 0.7 : 1,
                fontStyle: isEditing && valoresCalculados ? "italic" : "normal"
              }}
            >
              {currency(valorExibir)}
            </Text>
          );
        },
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
        render: (_, record) => {
          const isEditing = editingId === record.id;
          
          return (
            <Space size="small">
              {isEditing ? (
                <>
                  <Tooltip title="Salvar">
                    <Button
                      type="text"
                      size="small"
                      icon={<SaveOutlined style={{ color: "#52c41a", fontSize: "16px" }} />}
                      onClick={handleSaveEdit}
                      loading={saving}
                      style={{
                        border: "none",
                        boxShadow: "none",
                        padding: "4px",
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Cancelar">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ color: "#ff4d4f", fontSize: "16px" }} />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                      style={{
                        border: "none",
                        boxShadow: "none",
                        padding: "4px",
                      }}
                    />
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="Editar Lançamento">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: "#fa8c16", fontSize: "16px" }} />}
                      onClick={() => handleStartEdit(record)}
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
                </>
              )}
            </Space>
          );
        },
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

