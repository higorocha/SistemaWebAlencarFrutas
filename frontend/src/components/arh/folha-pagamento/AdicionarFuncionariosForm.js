// src/components/arh/folha-pagamento/AdicionarFuncionariosForm.js

import React, { useMemo } from "react";
import { Card, Select, Typography, Empty, Tag, Space, Alert } from "antd";
import { UserAddOutlined, InfoCircleOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { capitalizeName } from "../../../utils/formatters";

const { Text } = Typography;

const AdicionarFuncionariosForm = ({
  selectedIds,
  setSelectedIds,
  erros,
  setErros,
  funcionarios,
  funcionariosNaFolha = [],
}) => {
  // Filtrar funcionários que já estão na folha
  const funcionariosDisponiveis = useMemo(() => {
    const idsNaFolha = new Set(funcionariosNaFolha.map(f => f.funcionarioId || f.id));
    return funcionarios.filter(f => !idsNaFolha.has(f.id) && f.status === "ATIVO");
  }, [funcionarios, funcionariosNaFolha]);

  const handleChange = (value) => {
    setSelectedIds(value);
    if (erros.funcionarios && value.length > 0) {
      setErros({ ...erros, funcionarios: undefined });
    }
  };

  return (
    <>
      <Alert
        message="Informação"
        description="Selecione os funcionários ativos que deseja incluir nesta folha de pagamento. Apenas funcionários que ainda não foram adicionados aparecem na lista."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: "20px" }}
      />

      <Card
        title={
          <Space>
            <UserAddOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>
              Funcionários Disponíveis
            </span>
          </Space>
        }
        style={{
          marginBottom: 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
          },
          body: { padding: "16px" },
        }}
      >
        {funcionariosDisponiveis.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Todos os funcionários ativos já estão nesta folha ou não há funcionários disponíveis"
            style={{ margin: "40px 0" }}
          />
        ) : (
          <>
            <Select
              mode="multiple"
              placeholder="Selecione um ou mais funcionários"
              style={{ width: "100%" }}
              size="large"
              value={selectedIds}
              onChange={handleChange}
              status={erros.funcionarios ? "error" : ""}
              filterOption={(input, option) =>
                (option?.label || "").toLowerCase().includes(input.toLowerCase())
              }
              showSearch
              maxTagCount="responsive"
            >
              {funcionariosDisponiveis.map((func) => (
                <Select.Option key={func.id} value={func.id} label={capitalizeName(func.nome)}>
                  <div>
                    <div>
                      <Text strong>{capitalizeName(func.nome)}</Text>
                    </div>
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                      {func.tipoContrato === "CLT" ? (
                        <>
                          <Tag color="green" style={{ marginRight: 4, fontSize: "11px" }}>
                            CLT
                          </Tag>
                          {func.cargo?.nome && <span>{func.cargo.nome}</span>}
                        </>
                      ) : (
                        <>
                          <Tag color="blue" style={{ marginRight: 4, fontSize: "11px" }}>
                            DIARISTA
                          </Tag>
                          {func.funcao?.nome && <span>{func.funcao.nome}</span>}
                        </>
                      )}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>

            {erros.funcionarios && (
              <Text type="danger" style={{ fontSize: "12px", marginTop: "8px", display: "block" }}>
                {erros.funcionarios}
              </Text>
            )}

            {selectedIds.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#ecfdf5",
                  borderRadius: "8px",
                  border: "1px solid #a7f3d0",
                }}
              >
                <Text strong style={{ color: "#059669" }}>
                  {selectedIds.length} funcionário{selectedIds.length > 1 ? "s" : ""} selecionado
                  {selectedIds.length > 1 ? "s" : ""}
                </Text>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
};

AdicionarFuncionariosForm.propTypes = {
  selectedIds: PropTypes.array.isRequired,
  setSelectedIds: PropTypes.func.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func.isRequired,
  funcionarios: PropTypes.array.isRequired,
  funcionariosNaFolha: PropTypes.array,
};

export default AdicionarFuncionariosForm;

