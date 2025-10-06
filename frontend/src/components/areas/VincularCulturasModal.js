// src/components/areas/VincularCulturasModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Select,
  Table,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Tooltip,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  FieldTimeOutlined,
  TagOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { SecondaryButton } from "../common/buttons";
import { HectaresInput } from "../common/inputs";
import ResponsiveTable from "../common/ResponsiveTable";
import GerenciarCulturasSistemaModal from "./GerenciarCulturasSistemaModal";
import { showNotification } from "../../config/notificationConfig";
import useResponsive from "../../hooks/useResponsive";

const { Option } = Select;
const { Text } = Typography;

const VincularCulturasModal = ({
  open,
  onClose,
  culturas,
  culturasArea = [],
  onUpdateCulturas,
  onCulturasReload,
}) => {
  const [form] = Form.useForm();
  const { isMobile } = useResponsive();
  const [culturasAreaState, setCulturasAreaState] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [novaCultura, setNovaCultura] = useState({
    culturaId: "",
    areaPlantada: "",
    areaProduzindo: "",
  });
  const [openGerenciarCulturasSistema, setOpenGerenciarCulturasSistema] = useState(false);

  useEffect(() => {
    setCulturasAreaState(culturasArea);
  }, [culturasArea]);

  // Limpar estados quando o modal fechar
  useEffect(() => {
    if (!open) {
      setEditandoIndex(null);
      setNovaCultura({
        culturaId: "",
        areaPlantada: "",
        areaProduzindo: "",
      });
      // Não resetar form quando modal não está aberto para evitar warning
    }
  }, [open]);

  // Função para adicionar nova cultura
  const handleAdicionarCultura = () => {
    if (!novaCultura.culturaId) {
      showNotification("error", "Erro", "Selecione uma cultura");
      return;
    }

    if (!novaCultura.areaPlantada || parseFloat(novaCultura.areaPlantada) <= 0) {
      showNotification("error", "Erro", "Informe uma área plantada válida");
      return;
    }

    // Verificar se a cultura já existe
    const culturaExistente = culturasAreaState.find(
      (c) => c.culturaId === novaCultura.culturaId
    );

    if (culturaExistente) {
      showNotification("error", "Erro", "Esta cultura já foi adicionada");
      return;
    }

    const culturaSelecionada = culturas.find((c) => c.id === novaCultura.culturaId);
    
    const novaCulturaCompleta = {
      ...novaCultura,
      descricao: culturaSelecionada?.descricao || "Cultura não encontrada",
      periodicidade: culturaSelecionada?.periodicidade,
      areaPlantada: parseFloat(novaCultura.areaPlantada),
      areaProduzindo: parseFloat(novaCultura.areaProduzindo) || 0,
    };

    setCulturasAreaState([...culturasAreaState, novaCulturaCompleta]);
    setNovaCultura({
      culturaId: "",
      areaPlantada: "",
      areaProduzindo: "",
    });
    form.resetFields();
    showNotification("success", "Sucesso", "Cultura adicionada com sucesso");
  };

  // Função para editar cultura
  const handleEditarCultura = (index) => {
    const cultura = culturasAreaState[index];
    setEditandoIndex(index);
    setNovaCultura({
      culturaId: cultura.culturaId,
      areaPlantada: cultura.areaPlantada ? cultura.areaPlantada.toString() : "",
      areaProduzindo: cultura.areaProduzindo ? cultura.areaProduzindo.toString() : "",
    });
    form.setFieldsValue({
      culturaId: cultura.culturaId,
      areaPlantada: cultura.areaPlantada,
      areaProduzindo: cultura.areaProduzindo,
    });
  };

  // Função para salvar edição
  const handleSalvarEdicao = () => {
    if (!novaCultura.culturaId) {
      showNotification("error", "Erro", "Selecione uma cultura");
      return;
    }

    if (!novaCultura.areaPlantada || parseFloat(novaCultura.areaPlantada) <= 0) {
      showNotification("error", "Erro", "Informe uma área plantada válida");
      return;
    }

    const culturaSelecionada = culturas.find((c) => c.id === novaCultura.culturaId);
    
    const culturaAtualizada = {
      ...novaCultura,
      descricao: culturaSelecionada?.descricao || "Cultura não encontrada",
      periodicidade: culturaSelecionada?.periodicidade,
      areaPlantada: parseFloat(novaCultura.areaPlantada),
      areaProduzindo: parseFloat(novaCultura.areaProduzindo) || 0,
    };

    const novasCulturas = [...culturasAreaState];
    novasCulturas[editandoIndex] = culturaAtualizada;
    setCulturasAreaState(novasCulturas);
    
    setEditandoIndex(null);
    setNovaCultura({
      culturaId: "",
      areaPlantada: "",
      areaProduzindo: "",
    });
    form.resetFields();
    showNotification("success", "Sucesso", "Cultura atualizada com sucesso");
  };

  // Função para cancelar edição
  const handleCancelarEdicao = () => {
    setEditandoIndex(null);
    setNovaCultura({
      culturaId: "",
      areaPlantada: "",
      areaProduzindo: "",
    });
    form.resetFields();
  };

  // Função para remover cultura
  const handleRemoverCultura = (index) => {
    const novasCulturas = culturasAreaState.filter((_, i) => i !== index);
    setCulturasAreaState(novasCulturas);
    showNotification("success", "Sucesso", "Cultura removida com sucesso");
  };

  // Função para cancelar e fechar
  const handleCancelar = () => {
    form.resetFields(); // Limpar form antes de fechar
    onClose();
  };

  // Função para salvar e fechar
  const handleSalvarFechar = () => {
    onUpdateCulturas(culturasAreaState);
    form.resetFields(); // Limpar form antes de fechar
    onClose();
    showNotification("success", "Sucesso", "Culturas salvas com sucesso");
  };

  // Função para recarregar culturas após atualização
  const handleCulturasSistemaUpdated = () => {
    // Recarregar a lista de culturas do sistema
    // Isso será chamado quando o modal de culturas do sistema for fechado
    // O componente pai deve recarregar as culturas
    if (onCulturasReload) {
      onCulturasReload();
    }
    if (onUpdateCulturas) {
      onUpdateCulturas(culturasAreaState);
    }
  };

  // Configuração das colunas da tabela
  const colunas = [
    {
      title: "Cultura",
      key: "cultura",
      render: (_, record, index) => {
        const cultura = culturas.find((c) => c.id === record.culturaId);
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: "#059669", fontSize: "14px" }}>
              {cultura ? cultura.descricao : "Cultura não encontrada"}
            </Text>
            {cultura && cultura.periodicidade && (
              <Tag 
                color={cultura.periodicidade === "PERENE" ? "#059669" : "#fa8c16"}
                style={{ 
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500",
                  border: "none",
                }}
              >
                {cultura.periodicidade}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Área Plantada (ha)",
      dataIndex: "areaPlantada",
      key: "areaPlantada",
      render: (area) => (
        <Text style={{ fontWeight: "500", color: "#059669", fontSize: "14px" }}>
          {Number(area || 0).toFixed(2)} ha
        </Text>
      ),
    },
    {
      title: "Área Produzindo (ha)",
      dataIndex: "areaProduzindo",
      key: "areaProduzindo",
      render: (area) => (
        <Text style={{ fontWeight: "500", color: "#10b981", fontSize: "14px" }}>
          {Number(area || 0).toFixed(2)} ha
        </Text>
      ),
    },
    {
      title: "Ações",
      key: "acoes",
      width: 120,
      render: (_, record, index) => (
        <Space>
          {editandoIndex === index ? (
            <>
              <Tooltip title="Salvar">
                <Button
                  type="text"
                  icon={<SaveOutlined />}
                  onClick={handleSalvarEdicao}
                  style={{ color: "#059669" }}
                />
              </Tooltip>
              <Tooltip title="Cancelar">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={handleCancelarEdicao}
                  style={{ color: "#fa8c16" }}
                />
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Editar">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditarCultura(index)}
                  style={{ color: "#059669" }}
                />
              </Tooltip>
              <Tooltip title="Remover">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoverCultura(index)}
                  style={{ color: "#ff4d4f" }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          {isMobile ? "Vincular Culturas" : "Vincular Culturas da Área"}
        </span>
      }
      open={open}
      onCancel={handleCancelar}
      width={isMobile ? '95vw' : 800}
      style={{ maxWidth: isMobile ? '95vw' : 800 }}
      footer={[
        <Button
          key="cancel"
          onClick={handleCancelar}
          size={isMobile ? "small" : "middle"}
          style={{
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          Cancelar
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSalvarFechar}
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          {isMobile ? "Salvar" : "Salvar e Fechar"}
        </Button>,
      ]}
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        }
      }}
      centered
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }} size={isMobile ? "middle" : "large"}>
        {/* Formulário para adicionar/editar cultura */}
        <Card
          title={
            <Space>
              <PlusOutlined style={{ color: "#ffffff" }} />
              <span style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: isMobile ? "0.8125rem" : "0.875rem"
              }}>
                {editandoIndex !== null ? "Editar Cultura" : (isMobile ? "Adicionar" : "Adicionar Nova Cultura")}
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: {
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            size={isMobile ? "middle" : "large"}
            onFinish={editandoIndex !== null ? handleSalvarEdicao : handleAdicionarCultura}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
              <Col xs={24} md={10}>
                <Form.Item
                  label={
                    <Space>
                      <TagOutlined style={{ color: "#059669" }} />
                      <span style={{
                        fontWeight: "600",
                        color: "#262626",
                        fontSize: isMobile ? "0.8125rem" : "0.875rem"
                      }}>
                        Cultura
                      </span>
                    </Space>
                  }
                  name="culturaId"
                  rules={[{ required: true, message: "Selecione uma cultura" }]}
                >
                  <Select
                    placeholder="Selecione uma cultura"
                    value={novaCultura.culturaId}
                    onChange={(value) => setNovaCultura({ ...novaCultura, culturaId: value })}
                    disabled={editandoIndex !== null}
                    showSearch
                    size={isMobile ? "middle" : "large"}
                    filterOption={(input, option) =>
                      option.children.props.children[0].props.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    style={{
                      borderRadius: "6px",
                    }}
                                           suffixIcon={
                        <Tooltip title="Gerenciar culturas do sistema">
                          <Button
                            type="text"
                            icon={<SettingOutlined style={{ fontSize: "18px" }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenGerenciarCulturasSistema(true);
                            }}
                            style={{
                              color: "#059669",
                              padding: "0",
                              height: "30px",
                              width: "30px",
                              marginTop: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                              border: "none",
                              backgroundColor: "transparent",
                              transition: "all 0.2s ease",
                            }}
                            size="small"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f0f9f0";
                              e.currentTarget.style.color = "#047857";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "#059669";
                            }}
                          />
                        </Tooltip>
                      }
                   >
                     {culturas.map((cultura) => (
                       <Option key={cultura.id} value={cultura.id}>
                         <Space>
                           <span>{cultura.descricao}</span>
                           {cultura.periodicidade && (
                             <Tag 
                               color={cultura.periodicidade === "PERENE" ? "#059669" : "#fa8c16"}
                               style={{ borderRadius: "4px", fontSize: "11px" }}
                             >
                               {cultura.periodicidade}
                             </Tag>
                           )}
                         </Space>
                       </Option>
                     ))}
                   </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={7}>
                <HectaresInput
                  label={
                    <Space>
                      <TagOutlined style={{ color: "#059669" }} />
                      <span style={{
                        fontWeight: "600",
                        color: "#262626",
                        fontSize: isMobile ? "0.8125rem" : "0.875rem"
                      }}>
                        Área Plantada
                      </span>
                    </Space>
                  }
                  value={novaCultura.areaPlantada || ""}
                  onChange={(value) => setNovaCultura({ ...novaCultura, areaPlantada: value })}
                  required
                  placeholder="0,00 ha"
                />
              </Col>

              <Col xs={24} md={7}>
                <HectaresInput
                  label={
                    <Space>
                      <TagOutlined style={{ color: "#059669" }} />
                      <span style={{
                        fontWeight: "600",
                        color: "#262626",
                        fontSize: isMobile ? "0.8125rem" : "0.875rem"
                      }}>
                        Área Produzindo
                      </span>
                    </Space>
                  }
                  value={novaCultura.areaProduzindo || ""}
                  onChange={(value) => setNovaCultura({ ...novaCultura, areaProduzindo: value })}
                  placeholder="0,00 ha"
                />
              </Col>
            </Row>

            <div style={{ textAlign: "right", marginTop: isMobile ? "12px" : "16px" }}>
              {editandoIndex !== null ? (
                <Space size={isMobile ? "small" : "middle"}>
                  <Button
                    onClick={handleCancelarEdicao}
                    size={isMobile ? "small" : "middle"}
                    style={{
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    }}
                  >
                    Cancelar
                  </Button>
                  <SecondaryButton
                    icon={<SaveOutlined />}
                    onClick={handleSalvarEdicao}
                    style={{
                      height: isMobile ? "32px" : undefined,
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    }}
                  >
                    Salvar
                  </SecondaryButton>
                </Space>
              ) : (
                <SecondaryButton
                  icon={<PlusOutlined />}
                  onClick={handleAdicionarCultura}
                  style={{
                    height: isMobile ? "32px" : undefined,
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  {isMobile ? "Adicionar" : "Adicionar Cultura"}
                </SecondaryButton>
              )}
            </div>
          </Form>
        </Card>

        {/* Tabela de culturas */}
        <Card
          title={
            <Space>
              <FieldTimeOutlined style={{ color: "#ffffff" }} />
              <span style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: isMobile ? "0.8125rem" : "0.875rem"
              }}>
                Culturas da Área
              </span>
            </Space>
          }
          style={{
            marginBottom: 0,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px"
            },
            body: {
              padding: isMobile ? "12px" : "16px"
            }
          }}
        >
          {culturasAreaState.length > 0 ? (
            <ResponsiveTable
              dataSource={culturasAreaState}
              columns={colunas}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
              minWidthMobile={800}
              showScrollHint={true}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Nenhuma cultura cadastrada"
                  />
                ),
              }}
            />
          ) : (
            <div style={{
              textAlign: "center",
              padding: isMobile ? "24px 0" : "40px 0",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              border: "1px solid #d9d9d9",
            }}>
              <FieldTimeOutlined style={{
                fontSize: isMobile ? 36 : 48,
                color: "#bfbfbf"
              }} />
              <br />
              <Text style={{
                color: "#8c8c8c",
                display: "block",
                marginTop: "8px",
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}>
                Nenhuma cultura cadastrada para esta área
              </Text>
              <br />
              <Text style={{
                color: "#8c8c8c",
                fontSize: isMobile ? "0.75rem" : "0.875rem"
              }}>
                Use o formulário acima para adicionar culturas
              </Text>
            </div>
          )}
        </Card>
      </Space>

      {/* Modal de Gerenciamento de Culturas do Sistema */}
      <GerenciarCulturasSistemaModal
        open={openGerenciarCulturasSistema}
        onClose={() => setOpenGerenciarCulturasSistema(false)}
        onCulturasUpdated={handleCulturasSistemaUpdated}
      />
    </Modal>
  );
};

VincularCulturasModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  culturas: PropTypes.array.isRequired,
  culturasArea: PropTypes.array,
  onUpdateCulturas: PropTypes.func.isRequired,
  onCulturasReload: PropTypes.func,
};

export default VincularCulturasModal; 