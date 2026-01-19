// src/components/arh/folha-pagamento/AdicionarFuncionariosForm.js

import React, { useMemo, useState } from "react";
import { Card, Typography, Empty, Tag, Space, Alert, Checkbox, Row, Col, Input } from "antd";
import { UserAddOutlined, InfoCircleOutlined, SearchOutlined, UserOutlined, IdcardOutlined, TeamOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { capitalizeName, formatarCPF } from "../../../utils/formatters";

const { Text } = Typography;

const AdicionarFuncionariosForm = ({
  selectedIds,
  setSelectedIds,
  erros,
  setErros,
  funcionarios,
  funcionariosNaFolha = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar funcionários que já estão na folha
  const funcionariosDisponiveis = useMemo(() => {
    if (!Array.isArray(funcionarios) || funcionarios.length === 0) {
      return [];
    }

    if (!Array.isArray(funcionariosNaFolha) || funcionariosNaFolha.length === 0) {
      return funcionarios;
    }

    // Extrair IDs dos funcionários que já estão na folha
    const idsNaFolha = new Set();
    
    funcionariosNaFolha.forEach((lancamento) => {
      if (lancamento.funcionarioId !== undefined && lancamento.funcionarioId !== null) {
        const id = Number(lancamento.funcionarioId);
        if (!isNaN(id)) {
          idsNaFolha.add(id);
        }
      }
    });
    
    // Filtrar funcionários que não estão na folha
    return funcionarios.filter(f => {
      const funcionarioId = Number(f.id);
      return !idsNaFolha.has(funcionarioId);
    });
  }, [funcionarios, funcionariosNaFolha]);

  // Filtrar por termo de busca
  const funcionariosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return funcionariosDisponiveis;
    }

    const termo = searchTerm.toLowerCase().trim();
    return funcionariosDisponiveis.filter(func => {
      const nomeMatch = func.nome?.toLowerCase().includes(termo);
      const cpfMatch = func.cpf?.toLowerCase().includes(termo);
      const cargoMatch = func.cargo?.nome?.toLowerCase().includes(termo);
      const funcaoMatch = func.funcao?.nome?.toLowerCase().includes(termo);
      const gerenteMatch = func.gerente?.nome?.toLowerCase().includes(termo);
      
      return nomeMatch || cpfMatch || cargoMatch || funcaoMatch || gerenteMatch;
    });
  }, [funcionariosDisponiveis, searchTerm]);

  const handleToggleFuncionario = (funcionarioId) => {
    const id = Number(funcionarioId);
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
    
    if (erros.funcionarios) {
      setErros({ ...erros, funcionarios: undefined });
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === funcionariosFiltrados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(funcionariosFiltrados.map(f => Number(f.id)));
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

      <Alert
        message="Atualização de Cargos"
        description="Se um funcionário teve alteração de cargo e a folha atual já estava em edição, o usuário precisa remover e adicionar o funcionário novamente para replicar a alteração."
        type="warning"
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
            {/* Barra de busca */}
            <Input
              placeholder="Buscar por nome, CPF, cargo, função ou gerente..."
              prefix={<SearchOutlined style={{ color: "#999" }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              style={{ marginBottom: "16px" }}
              allowClear
            />

            {/* Selecionar todos */}
            {funcionariosFiltrados.length > 0 && (
              <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e8e8e8" }}>
                <Checkbox
                  checked={selectedIds.length === funcionariosFiltrados.length && funcionariosFiltrados.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < funcionariosFiltrados.length}
                  onChange={handleSelectAll}
                >
                  <Text strong style={{ fontSize: "14px" }}>
                    Selecionar todos ({funcionariosFiltrados.length})
                  </Text>
                </Checkbox>
              </div>
            )}

            {/* Lista de cards */}
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "8px",
              }}
            >
              {funcionariosFiltrados.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhum funcionário encontrado com o termo de busca"
                  style={{ margin: "40px 0" }}
                />
              ) : (
                <Row gutter={[12, 12]}>
                  {funcionariosFiltrados.map((func) => {
                    const isSelected = selectedIds.includes(Number(func.id));
                    const tipoContrato = func.tipoContrato;
                    
                    return (
                      <Col xs={24} sm={12} md={12} key={func.id}>
                        <Card
                          hoverable
                          onClick={() => handleToggleFuncionario(func.id)}
                          style={{
                            cursor: "pointer",
                            border: isSelected ? "2px solid #059669" : "1px solid #e8e8e8",
                            backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                            transition: "all 0.2s ease",
                          }}
                          bodyStyle={{ padding: "12px" }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleFuncionario(func.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <UserOutlined style={{ color: "#059669", fontSize: "16px" }} />
                                <Text strong style={{ fontSize: "14px", color: "#333" }}>
                                  {capitalizeName(func.nome)}
                                </Text>
                    </div>
                              
                              <div style={{ marginBottom: "6px" }}>
                                <Space size="small">
                                  <Tag
                                    color={tipoContrato === "MENSALISTA" ? "#10b981" : tipoContrato === "DIARISTA" ? "#06b6d4" : "#f59e0b"}
                                    style={{ fontSize: "11px", fontWeight: "600" }}
                                  >
                                    {tipoContrato === "MENSALISTA" ? "Mensalista" : tipoContrato === "DIARISTA" ? "Diarista" : tipoContrato}
                                  </Tag>
                                  {func.cargo?.nome && (
                                    <Tag color="#722ed1" style={{ fontSize: "11px" }}>
                                      {func.cargo.nome}
                          </Tag>
                                  )}
                                  {func.funcao?.nome && (
                                    <Tag color="#13c2c2" style={{ fontSize: "11px" }}>
                                      {func.funcao.nome}
                          </Tag>
                                  )}
                                </Space>
                              </div>

                              {func.cpf && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                  <IdcardOutlined style={{ color: "#999", fontSize: "12px" }} />
                                  <Text style={{ fontSize: "12px", color: "#666" }}>
                                    {formatarCPF(func.cpf)}
                                  </Text>
                                </div>
                              )}

                              {func.gerente && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                  <TeamOutlined style={{ color: "#059669", fontSize: "12px" }} />
                                  <Text style={{ fontSize: "12px", color: "#666" }}>
                                    Gerente: <Text strong style={{ color: "#059669" }}>{capitalizeName(func.gerente.nome)}</Text>
                                  </Text>
                                </div>
                      )}
                    </div>
                  </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>

            {erros.funcionarios && (
              <Text type="danger" style={{ fontSize: "12px", marginTop: "12px", display: "block" }}>
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
                  {selectedIds.length} funcionário{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}
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

