// src/components/arh/folha-pagamento/LancamentosTable.js

import React from "react";
import { Button, Space, Tag, Empty, Typography, Tooltip, Dropdown, InputNumber } from "antd";
import { EditOutlined, DollarOutlined, DeleteOutlined, MoreOutlined, CalculatorOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import styled from "styled-components";
import ResponsiveTable from "../../common/ResponsiveTable";
import { capitalizeName } from "../../../utils/formatters";
import ConfirmActionModal from "../../common/modals/ConfirmActionModal";
import MonetaryInput from "../../common/inputs/MonetaryInput";
import HourInput from "../../common/inputs/HourInput";
import PDFButton from "../../common/buttons/PDFButton";

const { Text } = Typography;

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

// Wrapper styled para adicionar estilos de destaque
const TableWrapper = styled.div`
  /* Destaque visual para linhas com dias preenchidos (concluído) */
  .ant-table-tbody > tr.lancamento-completo {
    background-color: #f0fdf4 !important;
    position: relative;
  }

  /* Borda lateral esquerda arredondada verde para concluído */
  .ant-table-tbody > tr.lancamento-completo > td:first-child {
    border-left: 4px solid #059669 !important;
    border-top-left-radius: 8px !important;
    border-bottom-left-radius: 8px !important;
    padding-left: calc(16px - 4px) !important;
  }

  /* Destaque visual para linhas sem dias preenchidos (não concluído) */
  .ant-table-tbody > tr.lancamento-incompleto {
    position: relative;
  }

  /* Borda lateral esquerda arredondada amarela/laranja para não concluído */
  .ant-table-tbody > tr.lancamento-incompleto > td:first-child {
    border-left: 4px solid #faad14 !important;
    border-top-left-radius: 8px !important;
    border-bottom-left-radius: 8px !important;
    padding-left: calc(16px - 4px) !important;
  }

  /* Hover com fundo na cor da borda - verde para concluído */
  /* Aplicar em todas as células para garantir que sobrescreva o hover padrão do ResponsiveTable */
  .ant-table-tbody > tr.lancamento-completo:hover > td,
  .ant-table-tbody > tr.lancamento-completo:hover {
    background-color: rgba(5, 150, 105, 0.08) !important;
  }

  /* Hover com fundo na cor da borda - amarelo para não concluído */
  /* Aplicar em todas as células para garantir que sobrescreva o hover padrão do ResponsiveTable */
  .ant-table-tbody > tr.lancamento-incompleto:hover > td,
  .ant-table-tbody > tr.lancamento-incompleto:hover {
    background-color: rgba(250, 173, 20, 0.08) !important;
  }
`;

const LancamentosTable = React.memo(
  ({ lancamentos, loading, onEditLancamento, onEditPagamento, onRemoveFuncionario, folhaStatus, isProgramador = false, onGerarRecibo }) => {
    const [confirmModal, setConfirmModal] = React.useState({ open: false, record: null });
    const [editingId, setEditingId] = React.useState(null);
    const [editingValues, setEditingValues] = React.useState({});
    const [saving, setSaving] = React.useState(false);

    // Função para criar o menu de ações
    const getMenuContent = (record) => {
      // Programador ignora restrições de status
      const isRascunho = isProgramador || folhaStatus === "RASCUNHO";
      
      const menuItems = [
        {
          key: "edit",
          disabled: !isRascunho,
          label: (
            <Tooltip
              title={!isRascunho ? "A folha precisa estar em edição (status Rascunho) para permitir calcular o lançamento" : undefined}
              placement="left"
            >
              <Space>
                <CalculatorOutlined style={{ color: isRascunho ? "#fa8c16" : "#d9d9d9" }} />
                <span style={{ color: isRascunho ? "#333" : "#bfbfbf" }}>Calcular Lançamento</span>
              </Space>
            </Tooltip>
          ),
          onClick: isRascunho ? () => onEditLancamento(record) : undefined,
        },
        {
          key: "payment",
          disabled: !isRascunho,
          label: (
            <Tooltip
              title={!isRascunho ? "A folha precisa estar em edição (status Rascunho) para permitir atualizar o pagamento" : undefined}
              placement="left"
            >
              <Space>
                <DollarOutlined style={{ color: isRascunho ? "#059669" : "#d9d9d9" }} />
                <span style={{ color: isRascunho ? "#333" : "#bfbfbf" }}>Atualizar Pagamento</span>
              </Space>
            </Tooltip>
          ),
          onClick: isRascunho ? () => onEditPagamento(record) : undefined,
        },
        {
          type: "divider",
        },
        {
          key: "delete",
          disabled: !isRascunho,
          label: (
            <Tooltip
              title={!isRascunho ? "A folha precisa estar em edição (status Rascunho) para permitir a remoção do funcionário" : undefined}
              placement="left"
            >
              <Space>
                <DeleteOutlined style={{ color: isRascunho ? "#ff4d4f" : "#d9d9d9" }} />
                <span style={{ color: isRascunho ? "#333" : "#bfbfbf" }}>Remover da Folha</span>
              </Space>
            </Tooltip>
          ),
          onClick: isRascunho ? () => setConfirmModal({ open: true, record }) : undefined,
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
        extras: Number(record.extras || 0),
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
          extras: editingValues.extras || 0,
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
      const extras = valores.extras || 0;
      const adiantamento = valores.adiantamento || 0;

      // Mensalistas recebem salário / 2 (quinzenal)
      // Diaristas recebem diária * dias trabalhados
      const valorBase =
        tipoContrato === "DIARISTA"
          ? valorDiariaAplicada * diasTrabalhados
          : salarioBaseReferencia / 2; // Mensalistas recebem metade do salário (quinzenal)

      const valorHorasExtras = horasExtras * valorHoraExtra;
      const valorBruto = Math.max(valorBase + ajudaCusto + valorHorasExtras + extras, 0);
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
        render: (_, record) => {
          const tipoContrato = record.tipoContrato;
          const cargoNome = record.cargo?.nome || record.referenciaNomeCargo;
          const funcaoNome = record.funcao?.nome || record.referenciaNomeFuncao;
          
          // Determinar o que exibir: cargo para mensalista, função para diarista
          const cargoOuFuncao = tipoContrato === "MENSALISTA" 
            ? cargoNome 
            : tipoContrato === "DIARISTA" 
            ? funcaoNome 
            : null;
          
          return (
            <div>
              <Text strong style={{ color: "#059669", fontSize: "14px", display: "block" }}>
                {record.funcionario?.nome ? capitalizeName(record.funcionario.nome) : "—"}
              </Text>
              {record.funcionario?.apelido && (
                <Text style={{ color: "#999999", fontSize: "12px", fontWeight: "400", display: "block", marginTop: "2px" }}>
                  {capitalizeName(record.funcionario.apelido)}
                </Text>
              )}
              <div style={{ fontSize: 12, color: "#666666", marginTop: "2px" }}>
                {tipoContrato}
                {cargoOuFuncao && (
                  <span style={{ marginLeft: "6px", color: "#8c8c8c" }}>
                    • {capitalizeName(cargoOuFuncao)}
                  </span>
                )}
              </div>
            </div>
          );
        },
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
                onPressEnter={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelEdit();
                  }
                }}
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
              <HourInput
                value={editingValues.faltas}
                onChange={(val) => handleFieldChange("faltas", val ? parseFloat(val) : 0)}
                onPressEnter={handleSaveEdit}
                onPressEsc={handleCancelEdit}
                size="small"
                style={{ width: "100%" }}
                placeholder="0,00"
              />
            );
          }
          return (
            <Text style={{ color: Number(value || 0) > 0 ? "#ff4d4f" : "#333333", fontSize: "12px" }}>
              {Number(value || 0).toFixed(2)}
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
              <HourInput
                value={editingValues.horasExtras}
                onChange={(val) => handleFieldChange("horasExtras", val ? parseFloat(val) : 0)}
                onPressEnter={handleSaveEdit}
                onPressEsc={handleCancelEdit}
                size="small"
                style={{ width: "100%" }}
                placeholder="0,00"
              />
            );
          }
          return (
            <Text style={{ color: "#333333", fontSize: "12px" }}>
              {Number(value || 0).toFixed(2)}h
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
                  onPressEnter={handleSaveEdit}
                  onPressEsc={handleCancelEdit}
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
                  onPressEnter={handleSaveEdit}
                  onPressEsc={handleCancelEdit}
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
        title: "Extra",
        dataIndex: "extras",
        key: "extras",
        width: 110,
        align: "right",
        render: (value, record) => {
          const isEditing = editingId === record.id;
          if (isEditing) {
            return (
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <MonetaryInput
                  value={editingValues.extras}
                  onChange={(val) => handleFieldChange("extras", val ? parseFloat(val) : 0)}
                  onPressEnter={handleSaveEdit}
                  onPressEsc={handleCancelEdit}
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
                  onPressEnter={handleSaveEdit}
                  onPressEsc={handleCancelEdit}
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
        title: "Salário Base / Diária",
        dataIndex: "salarioBaseReferencia",
        key: "salarioBaseDiaria",
        width: 140,
        align: "right",
        render: (_, record) => {
          const tipoContrato = record.tipoContrato;
          let valorExibir = null;
          let label = "";

          if (tipoContrato === "MENSALISTA") {
            // Mensalista: exibir salário base mensal
            valorExibir = record.salarioBaseReferencia;
            label = "Salário Base";
          } else if (tipoContrato === "DIARISTA") {
            // Diarista: exibir valor da diária
            valorExibir = record.valorDiariaAplicada;
            label = "Diária";
          }

          if (!valorExibir || Number(valorExibir) === 0) {
            return <Text style={{ color: "#999", fontSize: "12px" }}>—</Text>;
          }

          return (
            <div>
              <Text style={{ color: "#666", fontSize: "11px", display: "block" }}>
                {label}
              </Text>
              <Text style={{ color: "#333", fontSize: "12px", fontWeight: 500 }}>
                {currency(valorExibir)}
              </Text>
            </div>
          );
        },
      },
      {
        title: (
          <Space size="small">
            <span>Valor Bruto</span>
            <Tooltip
              title={
                <div style={{ maxWidth: 300 }}>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>Valor Bruto</div>
                  <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                    Valor total a receber antes de descontar adiantamentos.
                    <br />
                    <br />
                    <strong>Cálculo:</strong>
                    <br />
                    Valor Base + Ajuda de Custo + Horas Extras + Extra
                    <br />
                    <br />
                    <strong>Onde:</strong>
                    <br />
                    • Mensalista: Salário Mensal ÷ 2 (quinzenal)
                    <br />
                    • Diarista: Valor da Diária × Dias Trabalhados
                  </div>
                </div>
              }
              placement="top"
            >
              <InfoCircleOutlined style={{ color: "#d9d9d9", cursor: "help", fontSize: "14px" }} />
            </Tooltip>
          </Space>
        ),
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
        title: (
          <Space size="small">
            <span>Valor Líquido</span>
            <Tooltip
              title={
                <div style={{ maxWidth: 300 }}>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>Valor Líquido</div>
                  <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                    Valor final a pagar ao funcionário após descontar adiantamentos.
                    <br />
                    <br />
                    <strong>Cálculo:</strong>
                    <br />
                    Valor Bruto - Adiantamento
                    <br />
                    <br />
                    <strong>Exemplo:</strong>
                    <br />
                    Se o Valor Bruto é R$ 1.950,00 e o Adiantamento é R$ 500,00,
                    <br />
                    o Valor Líquido será R$ 1.450,00 (valor que será pago).
                  </div>
                </div>
              }
              placement="top"
            >
              <InfoCircleOutlined style={{ color: "#d9d9d9", cursor: "help", fontSize: "14px" }} />
            </Tooltip>
          </Space>
        ),
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
        width: 140,
        render: (meio) => {
          if (!meio) {
            return <Text type="secondary">-</Text>;
          }
          // Formatar o método de pagamento
          let metodoFormatado = meio;
          if (meio === "PIX_API") {
            metodoFormatado = "PIX - API";
          } else if (meio === "PIX") {
            metodoFormatado = "PIX";
          } else if (meio === "ESPECIE") {
            metodoFormatado = "Espécie";
          }
          return <Tag color="#059669">{metodoFormatado}</Tag>;
        },
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
                  {record.statusPagamento === 'PAGO' && onGerarRecibo ? (
                    <PDFButton
                      onClick={() => onGerarRecibo(record)}
                      size="small"
                      tooltip="Gerar Recibo"
                    >
                      Recibo
                    </PDFButton>
                  ) : (
                    <>
                      <Tooltip 
                        title={
                          (isProgramador || folhaStatus === "RASCUNHO")
                            ? "Editar Lançamento" 
                            : "A folha precisa estar em edição (status Rascunho) para permitir editar o lançamento"
                        }
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: (isProgramador || folhaStatus === "RASCUNHO") ? "#fa8c16" : "#d9d9d9", fontSize: "16px" }} />}
                          onClick={() => handleStartEdit(record)}
                          disabled={!isProgramador && folhaStatus !== "RASCUNHO"}
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
                </>
              )}
            </Space>
          );
        },
      },
    ];

    // Função para determinar a classe da linha baseada se dias está preenchido
    const getRowClassName = (record) => {
      // Verifica se diasTrabalhados está preenchido (não é null, undefined, ou 0)
      const temDiasPreenchido = record.diasTrabalhados !== null && 
                                record.diasTrabalhados !== undefined && 
                                Number(record.diasTrabalhados) > 0;
      
      // Retorna classe diferente para concluído e não concluído
      return temDiasPreenchido ? 'lancamento-completo' : 'lancamento-incompleto';
    };

    return (
      <>
        <TableWrapper>
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
            rowClassName={getRowClassName}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhum lançamento encontrado"
                />
              ),
            }}
          />
        </TableWrapper>

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
  folhaStatus: PropTypes.string,
  isProgramador: PropTypes.bool,
  onGerarRecibo: PropTypes.func,
};

export default LancamentosTable;

