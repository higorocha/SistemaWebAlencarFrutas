// src/components/fornecedores/FornecedorForm.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Button,
  Divider,
  message,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  TagOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { IMaskInput } from "react-imask";
import { validarDocumento } from "../../utils/documentValidation";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const FornecedorForm = ({
  fornecedorAtual,
  setFornecedorAtual,
  editando,
  erros,
  setErros,
}) => {
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Carregar áreas do fornecedor quando estiver editando
  useEffect(() => {
    if (editando && fornecedorAtual.id) {
      fetchAreasFornecedor(fornecedorAtual.id);
    }
  }, [editando, fornecedorAtual.id]);

  // Buscar áreas do fornecedor
  const fetchAreasFornecedor = async (fornecedorId) => {
    try {
      setLoadingAreas(true);
      const response = await axiosInstance.get(`/api/areas-fornecedores/fornecedor/${fornecedorId}`);
      setAreas(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar áreas:", error);
      showNotification("error", "Erro", "Erro ao carregar áreas do fornecedor");
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleChange = (field, value) => {
    setFornecedorAtual(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Validação em tempo real para o campo documento
    if (field === 'documento' && value) {
      const validacao = validarDocumento(value);
      if (!validacao.valido) {
        setErros(prev => ({
          ...prev,
          documento: validacao.mensagem,
        }));
      }
    }
  };

  // Adicionar nova área
  const adicionarArea = () => {
    const novaArea = {
      id: `temp-${Date.now()}`, // ID temporário para controle local
      nome: "",
      isNew: true,
    };
    setAreas(prev => [...prev, novaArea]);
  };

  // Remover área
  const removerArea = (index) => {
    const area = areas[index];
    if (area.isNew) {
      // Se é uma área nova, apenas remove da lista
      setAreas(prev => prev.filter((_, i) => i !== index));
    } else {
      // Se é uma área existente, pergunta se quer excluir
      if (window.confirm(`Deseja excluir a área "${area.nome}"?`)) {
        excluirArea(area.id, index);
      }
    }
  };

  // Excluir área do backend
  const excluirArea = async (areaId, index) => {
    try {
      await axiosInstance.delete(`/api/areas-fornecedores/${areaId}`);
      setAreas(prev => prev.filter((_, i) => i !== index));
      showNotification("success", "Sucesso", "Área excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir área:", error);
      showNotification("error", "Erro", "Erro ao excluir área");
    }
  };

  // Atualizar nome da área
  const atualizarNomeArea = (index, nome) => {
    setAreas(prev => prev.map((area, i) => 
      i === index ? { ...area, nome } : area
    ));
  };

  // Salvar áreas (será chamado pelo modal principal)
  const salvarAreas = async () => {
    console.log('Função salvarAreas chamada');
    console.log('editando:', editando);
    console.log('fornecedorAtual.id:', fornecedorAtual.id);
    console.log('areas:', areas);
    
    if (!editando || !fornecedorAtual.id) {
      console.log('Retornando - não está editando ou não tem ID');
      return;
    }

    try {
      console.log('Iniciando salvamento das áreas...');
      // Salvar novas áreas
      for (const area of areas) {
        if (area.isNew && area.nome.trim()) {
          console.log('Salvando área:', area);
          const response = await axiosInstance.post("/api/areas-fornecedores", {
            fornecedorId: fornecedorAtual.id,
            nome: area.nome.trim(),
          });
          console.log('Área salva com sucesso:', response.data);
        }
      }

      console.log('Atualizando lista de áreas...');
      // Atualizar lista de áreas
      await fetchAreasFornecedor(fornecedorAtual.id);
      showNotification("success", "Sucesso", "Áreas salvas com sucesso!");
      console.log('Processo concluído com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar áreas:", error);
      showNotification("error", "Erro", "Erro ao salvar áreas");
    }
  };

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Informações Básicas */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações Básicas</span>
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
            }
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Nome do Fornecedor</span>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Ex: Distribuidora ABC Ltda"
                  value={fornecedorAtual.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.nome ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>CPF/CNPJ</span>
                  </Space>
                }
                validateStatus={erros.documento ? "error" : ""}
                help={
                  erros.documento || 
                  (fornecedorAtual.documento && (
                    <span style={{ color: "#52c41a", fontSize: "12px" }}>
                      {validarDocumento(fornecedorAtual.documento).tipo} válido
                    </span>
                  ))
                }
              >
                <IMaskInput
                  mask={[
                    { mask: '000.000.000-00' },
                    { mask: '00.000.000/0000-00' },
                  ]}
                  placeholder="Digite o CPF ou CNPJ"
                  onAccept={(value) => handleChange("documento", value)}
                  value={fornecedorAtual.documento || ''}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.documento ? "#ff4d4f" : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: '1px solid',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Contato */}
        <Card
          title={
            <Space>
              <PhoneOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Contato</span>
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
            }
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <PhoneOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Telefone</span>
                  </Space>
                }
                validateStatus={erros.telefone ? "error" : ""}
                help={erros.telefone}
              >
                <IMaskInput
                  mask="(00) 00000-0000"
                  placeholder="(88) 99966-1299"
                  onAccept={(value) => handleChange("telefone", value)}
                  value={fornecedorAtual.telefone || ''}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.telefone ? "#ff4d4f" : "#d9d9d9",
                    width: '100%',
                    height: '40px',
                    padding: '4px 11px',
                    fontSize: '14px',
                    border: '1px solid',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <MailOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Email</span>
                  </Space>
                }
                validateStatus={erros.email ? "error" : ""}
                help={erros.email}
              >
                <Input
                  placeholder="Ex: contato@empresa.com"
                  value={fornecedorAtual.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.email ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Endereço</span>
                  </Space>
                }
                validateStatus={erros.endereco ? "error" : ""}
                help={erros.endereco}
              >
                <Input
                  placeholder="Ex: Lote A1 / Marco-CE"
                  value={fornecedorAtual.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.endereco ? "#ff4d4f" : "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 3: Áreas do Fornecedor */}
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Áreas do Fornecedor</span>
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
            }
          }}
        >
          {editando ? (
            <>
              {/* Cabeçalho das colunas */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
                <Col xs={24} md={20}>
                  <Text strong style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    Nome da Área
                  </Text>
                </Col>
                <Col xs={24} md={4}>
                  {/* Coluna de ações sem texto - apenas para alinhamento */}
                </Col>
              </Row>

              {/* Lista de áreas */}
              {areas.map((area, index) => (
                <div key={area.id}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={20}>
                      <Input
                        placeholder="Nome da área"
                        value={area.nome}
                        onChange={(e) => atualizarNomeArea(index, e.target.value)}
                        style={{
                          borderRadius: "6px",
                          borderColor: "#d9d9d9",
                        }}
                      />
                    </Col>

                    <Col xs={24} md={4}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        {/* Botão de remover */}
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removerArea(index)}
                          size="large"
                          style={{
                            borderRadius: "50px",
                            height: "40px",
                            width: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            border: "2px solid #ff4d4f",
                            color: "#ff4d4f",
                            backgroundColor: "#ffffff",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#fff2f0";
                            e.target.style.transform = "scale(1.05)";
                            e.target.style.transition = "all 0.2s ease";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#ffffff";
                            e.target.style.transform = "scale(1)";
                          }}
                        />

                        {/* Botão de adicionar apenas na última área */}
                        {index === areas.length - 1 && (
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={adicionarArea}
                            size="large"
                            style={{
                              borderRadius: "50px",
                              borderColor: "#10b981",
                              color: "#10b981",
                              borderWidth: "2px",
                              height: "40px",
                              width: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              backgroundColor: "#ffffff",
                              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#f0fdf4";
                              e.target.style.borderColor = "#059669";
                              e.target.style.color = "#059669";
                              e.target.style.transform = "scale(1.05)";
                              e.target.style.transition = "all 0.2s ease";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#ffffff";
                              e.target.style.borderColor = "#10b981";
                              e.target.style.color = "#10b981";
                              e.target.style.transform = "scale(1)";
                            }}
                          />
                        )}
                      </div>
                    </Col>
                  </Row>
                  {index < areas.length - 1 && <Divider style={{ margin: "16px 0" }} />}
                </div>
              ))}

              {/* Botão para adicionar primeira área se não houver nenhuma */}
              {areas.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={adicionarArea}
                    size="large"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#10b981",
                      color: "#10b981",
                      borderWidth: "2px",
                      height: "48px",
                      padding: "0 24px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    Adicionar Primeira Área
                  </Button>
                </div>
              )}

              {/* Botão para salvar áreas */}
              {areas.length > 0 && (
                <div style={{ textAlign: "right", marginTop: "16px" }}>
                  <Button
                    type="primary"
                    onClick={salvarAreas}
                    loading={loadingAreas}
                    disabled={loadingAreas || areas.every(area => !area.nome.trim())}
                    icon={loadingAreas ? undefined : <SaveOutlined />}
                    style={{
                      backgroundColor: loadingAreas ? "#10b981" : "#059669",
                      borderColor: loadingAreas ? "#10b981" : "#059669",
                      borderRadius: "6px",
                      minWidth: "140px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {loadingAreas ? (
                      <span>
                        Salvando... <span style={{ fontSize: "12px", opacity: 0.8 }}>({areas.filter(area => area.isNew && area.nome.trim()).length} nova{areas.filter(area => area.isNew && area.nome.trim()).length > 1 ? 's' : ''})</span>
                      </span>
                    ) : (
                      `Salvar Áreas`
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              <Text>As áreas poderão ser cadastradas após criar o fornecedor</Text>
            </div>
          )}
        </Card>

        {/* Seção 4: Observações */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Observações</span>
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
            }
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações sobre o Fornecedor</span>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Observações sobre o fornecedor (opcional)"
                  value={fornecedorAtual.observacoes || ""}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

FornecedorForm.propTypes = {
  fornecedorAtual: PropTypes.object.isRequired,
  setFornecedorAtual: PropTypes.func.isRequired,
  editando: PropTypes.bool.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
};

export default FornecedorForm;
