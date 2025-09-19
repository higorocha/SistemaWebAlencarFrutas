// src/components/areas/GerenciarCulturasSistemaModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import { PrimaryButton, SecondaryButton } from "../common/buttons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import MiniInputSearchPersonalizavel from "../common/MiniComponents/MiniInputSearchPersonalizavel";

const { Option } = Select;
const { Text } = Typography;

const GerenciarCulturasSistemaModal = ({
  open,
  onClose,
  onCulturasUpdated,
}) => {
  const [form] = Form.useForm();
  const theme = useTheme();
  const [culturas, setCulturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [novaCultura, setNovaCultura] = useState({
    descricao: "",
    periodicidade: "TEMPORARIA",
    permitirConsorcio: false,
  });

  // Carregar culturas do sistema
  const carregarCulturas = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/culturas");
      setCulturas(response.data);
    } catch (error) {
      console.error("Erro ao carregar culturas:", error);
      showNotification("error", "Erro", "Erro ao carregar culturas do sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      carregarCulturas();
    }
  }, [open]);

  // Função para adicionar nova cultura
  const handleAdicionarCultura = async () => {
    try {
      if (!novaCultura.descricao.trim()) {
        showNotification("error", "Erro", "Descrição da cultura é obrigatória");
        return;
      }

      setLoading(true);
      const response = await axiosInstance.post("/api/culturas", novaCultura);
      
      setCulturas([...culturas, response.data]);
      setNovaCultura({
        descricao: "",
        periodicidade: "TEMPORARIA",
        permitirConsorcio: false,
      });
      form.resetFields();
      showNotification("success", "Sucesso", "Cultura adicionada com sucesso");
      
      if (onCulturasUpdated) {
        onCulturasUpdated();
      }
    } catch (error) {
      console.error("Erro ao adicionar cultura:", error);
      if (error.response?.data?.message) {
        showNotification("error", "Erro", error.response.data.message);
      } else {
        showNotification("error", "Erro", "Erro ao adicionar cultura");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para iniciar edição
  const handleIniciarEdicao = (cultura) => {
    setEditandoId(cultura.id);
    setNovaCultura({
      descricao: cultura.descricao,
      periodicidade: cultura.periodicidade,
      permitirConsorcio: cultura.permitirConsorcio,
    });
    form.setFieldsValue({
      descricao: cultura.descricao,
      periodicidade: cultura.periodicidade,
      permitirConsorcio: cultura.permitirConsorcio,
    });
  };

  // Função para salvar edição
  const handleSalvarEdicao = async () => {
    try {
      if (!novaCultura.descricao.trim()) {
        showNotification("error", "Erro", "Descrição da cultura é obrigatória");
        return;
      }

      setLoading(true);
      const response = await axiosInstance.patch(`/api/culturas/${editandoId}`, novaCultura);
      
      setCulturas(culturas.map(c => c.id === editandoId ? response.data : c));
      setEditandoId(null);
      setNovaCultura({
        descricao: "",
        periodicidade: "TEMPORARIA",
        permitirConsorcio: false,
      });
      form.resetFields();
      showNotification("success", "Sucesso", "Cultura atualizada com sucesso");
      
      if (onCulturasUpdated) {
        onCulturasUpdated();
      }
    } catch (error) {
      console.error("Erro ao atualizar cultura:", error);
      if (error.response?.data?.message) {
        showNotification("error", "Erro", error.response.data.message);
      } else {
        showNotification("error", "Erro", "Erro ao atualizar cultura");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar edição
  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setNovaCultura({
      descricao: "",
      periodicidade: "TEMPORARIA",
      permitirConsorcio: false,
    });
    form.resetFields();
  };

  // Função para excluir cultura
  const handleExcluirCultura = async (culturaId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/culturas/${culturaId}`);
      
      setCulturas(culturas.filter(c => c.id !== culturaId));
      showNotification("success", "Sucesso", "Cultura excluída com sucesso");
      
      if (onCulturasUpdated) {
        onCulturasUpdated();
      }
    } catch (error) {
      console.error("Erro ao excluir cultura:", error);
      if (error.response?.data?.message) {
        showNotification("error", "Erro", error.response.data.message);
      } else {
        showNotification("error", "Erro", "Erro ao excluir cultura");
      }
    } finally {
      setLoading(false);
    }
  };

     // Função para salvar e fechar
   const handleSalvarFechar = () => {
     setSearchTerm(""); // Limpar busca ao fechar
     setEditandoId(null); // Limpar estado de edição
     setNovaCultura({
       descricao: "",
       periodicidade: "TEMPORARIA",
       permitirConsorcio: false,
     });
     form.resetFields();
     onClose();
   };

  // Função para filtrar culturas
  const filteredCulturas = culturas.filter((cultura) =>
    cultura.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      title={
        <span style={{ 
          color: "#ffffff", 
          fontWeight: "600", 
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          Gerenciar Culturas do Sistema
        </span>
      }
      open={open}
                    onCancel={() => {
          setSearchTerm(""); // Limpar busca ao cancelar
          setEditandoId(null); // Limpar estado de edição
          setNovaCultura({
            descricao: "",
            periodicidade: "TEMPORARIA",
            permitirConsorcio: false,
          });
          form.resetFields();
          onClose();
        }}
             width={900}
       footer={[
         <Button key="cancel" onClick={onClose}>
           Cancelar
         </Button>,
         <PrimaryButton
           key="save"
           onClick={handleSalvarFechar}
         >
           Fechar
         </PrimaryButton>,
       ]}
                                               styles={{
           body: {
             padding: "20px",
           },
           header: {
             backgroundColor: "#059669",
             borderBottom: "2px solid #047857",
             padding: 0,
           }
         }}
       centered
    >
             <Space direction="vertical" style={{ width: "100%" }} size="large">
                 {/* Formulário para adicionar/editar cultura */}
         <Card
           title={
             <Space>
               <PlusOutlined style={{ color: "#ffffff" }} />
               <span style={{ color: "#ffffff", fontWeight: "600" }}>
                 {editandoId !== null ? "Editar Cultura" : "Adicionar Nova Cultura"}
               </span>
             </Space>
           }
           styles={{
             header: {
               backgroundColor: "#059669",
               borderBottom: "2px solid #047857",
               color: "#ffffff",
               borderRadius: "8px 8px 0 0",
             }
           }}
           style={{ flex: "0 0 auto", marginBottom: 0 }}
         >
          <Form
            form={form}
            layout="vertical"
            onFinish={editandoId !== null ? handleSalvarEdicao : handleAdicionarCultura}
          >
            <Row gutter={[16, 16]}>
                             <Col xs={24} md={10}>
                 <Form.Item
                   label={
                     <Space>
                       <TagOutlined style={{ color: theme.palette.forms.sectionHeader }} />
                       <span style={{ fontWeight: "600", color: theme.palette.forms.labelText }}>Descrição</span>
                     </Space>
                   }
                   name="descricao"
                   rules={[{ required: true, message: "Descrição é obrigatória" }]}
                 >
                   <Input
                     placeholder="Digite a descrição da cultura"
                     value={novaCultura.descricao}
                     onChange={(e) => setNovaCultura({ ...novaCultura, descricao: e.target.value })}
                     style={{
                       borderRadius: "6px",
                     }}
                   />
                 </Form.Item>
               </Col>

                              <Col xs={24} md={8}>
                 <Form.Item
                   label={
                     <Space>
                       <TagOutlined style={{ color: theme.palette.forms.sectionHeader }} />
                       <span style={{ fontWeight: "600", color: theme.palette.forms.labelText }}>Periodicidade</span>
                     </Space>
                   }
                   name="periodicidade"
                   rules={[{ required: true, message: "Periodicidade é obrigatória" }]}
                 >
                   <Select
                     placeholder="Selecione a periodicidade"
                     value={novaCultura.periodicidade}
                     onChange={(value) => setNovaCultura({ ...novaCultura, periodicidade: value })}
                     style={{
                       borderRadius: "6px",
                     }}
                   >
                     <Option value="PERENE">
                       <Space>
                         <CheckCircleOutlined style={{ color: "#059669" }} />
                         <span>Perene</span>
                       </Space>
                     </Option>
                     <Option value="TEMPORARIA">
                       <Space>
                         <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />
                         <span>Temporária</span>
                       </Space>
                     </Option>
                   </Select>
                 </Form.Item>
               </Col>

               <Col xs={24} md={6}>
                <Form.Item
                  label={
                    <Space>
                      <TagOutlined style={{ color: theme.palette.forms.sectionHeader }} />
                      <span style={{ fontWeight: "600", color: theme.palette.forms.labelText }}>Consórcio</span>
                    </Space>
                  }
                  name="permitirConsorcio"
                >
                  <Select
                    placeholder="Consórcio"
                    value={novaCultura.permitirConsorcio}
                    onChange={(value) => setNovaCultura({ ...novaCultura, permitirConsorcio: value })}
                    style={{
                      borderRadius: "6px",
                    }}
                  >
                    <Option value={true}>Permitir</Option>
                    <Option value={false}>Não Permitir</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div style={{ textAlign: "right", marginTop: "16px" }}>
              {editandoId !== null ? (
                <Space>
                  <Button onClick={handleCancelarEdicao}>
                    Cancelar
                  </Button>
                  <SecondaryButton
                    icon={<SaveOutlined />}
                    onClick={handleSalvarEdicao}
                    loading={loading}
                  >
                    Salvar
                  </SecondaryButton>
                </Space>
              ) : (
                <SecondaryButton
                  icon={<PlusOutlined />}
                  onClick={handleAdicionarCultura}
                  loading={loading}
                >
                  Adicionar Cultura
                </SecondaryButton>
              )}
            </div>
          </Form>
        </Card>

                                                                                                                                                                                                 

         {/* Lista de culturas */}
         <Card
           title={
             <div style={{ 
               display: "flex", 
               alignItems: "center", 
               gap: "12px",
               width: "100%",
               padding: "0 4px"
             }}>
               <Space>
                 <TagOutlined style={{ color: "#ffffff" }} />
                 <span style={{ color: "#ffffff", fontWeight: "600" }}>Culturas do Sistema</span>
               </Space>
               <MiniInputSearchPersonalizavel
                 placeholder="Buscar culturas..."
                 value={searchTerm}
                 onChange={setSearchTerm}
                 height="32px"
                 fontSize="13px"
                 iconColor="#10b981"
                 iconSize="14px"
                 textColor="#10b981"
                 style={{
                   marginBottom: 0,
                   flex: "1",
                 }}
               />
             </div>
           }
           styles={{
             header: {
               backgroundColor: "#059669",
               borderBottom: "2px solid #047857",
               color: "#ffffff",
               borderRadius: "8px 8px 0 0",
             },
             body: {
               padding: "16px",
               height: "300px",
               overflowY: "auto",
               overflowX: "hidden"
             }
           }}
          >
                         {/* Cabeçalho da lista */}
             <div style={{
               padding: "8px 16px",
               backgroundColor: "#f8fafc",
               border: "1px solid #e0e0e0",
               borderRadius: "8px",
               marginBottom: "12px",
               margin: "0 0 12px 0",
             }}>
                                             <div style={{ 
                  display: "flex", 
                  alignItems: "center",
                  width: "100%"
                }}>
                  {/* Nome da Cultura */}
                  <div style={{ flex: "2", minWidth: "0" }}>
                    <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                      Nome da Cultura
                    </Text>
                  </div>

                  {/* Periodicidade */}
                  <div style={{ width: "145px", textAlign: "left" }}>
                    <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                      Periodicidade
                    </Text>
                  </div>

                  {/* Consórcio */}
                  <div style={{ width: "120px", textAlign: "center" }}>
                    <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                      Consórcio
                    </Text>
                  </div>

                  {/* Ações */}
                  <div style={{ width: "80px", textAlign: "center" }}>
                    <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                      
                    </Text>
                  </div>
                </div>
            </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text>Carregando culturas...</Text>
            </div>
                     ) : filteredCulturas.length > 0 ? (
             <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
               {filteredCulturas.map((cultura) => (
                 <div
                   key={cultura.id}
                   style={{
                     display: "flex",
                     alignItems: "center",
                     padding: "12px 16px",
                     border: "1px solid #e0e0e0",
                     borderRadius: "8px",
                     backgroundColor: "#ffffff",
                     transition: "all 0.2s ease",
                     cursor: "pointer",
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = "#f8f9fa";
                     e.currentTarget.style.borderColor = "#059669";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = "#ffffff";
                     e.currentTarget.style.borderColor = "#e0e0e0";
                   }}
                 >
                   {/* Nome da Cultura */}
                   <div style={{ flex: "2", minWidth: "0" }}>
                     <Text strong style={{ color: "#059669", fontSize: "14px", display: "block" }}>
                       {cultura.descricao}
                     </Text>
                   </div>

                   {/* Periodicidade */}
                   <div style={{ flex: "1", textAlign: "center" }}>
                     <div style={{
                       display: "inline-flex",
                       alignItems: "center",
                       gap: "4px",
                       padding: "4px 8px",
                       borderRadius: "12px",
                       backgroundColor: cultura.periodicidade === "PERENE" ? "#f0f9f0" : "#fff7ed",
                       border: `1px solid ${cultura.periodicidade === "PERENE" ? "#059669" : "#fa8c16"}`,
                     }}>
                       {cultura.periodicidade === "PERENE" ? (
                         <CheckCircleOutlined style={{ color: "#059669", fontSize: "10px" }} />
                       ) : (
                         <ExclamationCircleOutlined style={{ color: "#fa8c16", fontSize: "10px" }} />
                       )}
                       <Text style={{ 
                         fontSize: "11px", 
                         color: cultura.periodicidade === "PERENE" ? "#059669" : "#fa8c16",
                         fontWeight: "500"
                       }}>
                         {cultura.periodicidade === "PERENE" ? "Perene" : "Temporária"}
                       </Text>
                     </div>
                   </div>

                   {/* Consórcio */}
                   <div style={{ flex: "1", textAlign: "center" }}>
                     <div style={{
                       display: "inline-flex",
                       alignItems: "center",
                       gap: "4px",
                       padding: "4px 8px",
                       borderRadius: "12px",
                       backgroundColor: cultura.permitirConsorcio ? "#f0f9f0" : "#fef2f2",
                       border: `1px solid ${cultura.permitirConsorcio ? "#059669" : "#dc2626"}`,
                     }}>
                       <div style={{
                         width: "4px",
                         height: "4px",
                         borderRadius: "50%",
                         backgroundColor: cultura.permitirConsorcio ? "#059669" : "#dc2626",
                       }} />
                       <Text style={{ 
                         fontSize: "11px", 
                         color: cultura.permitirConsorcio ? "#059669" : "#dc2626",
                         fontWeight: "500"
                       }}>
                         {cultura.permitirConsorcio ? "Permitido" : "Não Permitido"}
                       </Text>
                     </div>
                   </div>

                   {/* Ações */}
                   <div style={{ flex: "0 0 auto", display: "flex", gap: "8px" }}>
                     <Button
                       type="text"
                       icon={<EditOutlined />}
                       onClick={() => handleIniciarEdicao(cultura)}
                       style={{ 
                         color: "#059669",
                         padding: "4px 8px",
                         height: "auto",
                         borderRadius: "6px",
                       }}
                       size="small"
                     />
                     <Popconfirm
                       title="Excluir cultura"
                       description="Tem certeza que deseja excluir esta cultura?"
                       onConfirm={() => handleExcluirCultura(cultura.id)}
                       okText="Sim"
                       cancelText="Não"
                     >
                       <Button
                         type="text"
                         icon={<DeleteOutlined />}
                         style={{ 
                           color: "#ff4d4f",
                           padding: "4px 8px",
                           height: "auto",
                           borderRadius: "6px",
                         }}
                         size="small"
                       />
                     </Popconfirm>
                   </div>
                 </div>
               ))}
             </div>
                     ) : searchTerm ? (
             <div style={{ 
               textAlign: "center", 
               padding: "40px 0",
               backgroundColor: "#f7fafc",
               borderRadius: "6px",
               border: "1px solid #d1fae5",
             }}>
               <TagOutlined style={{ fontSize: 48, color: "#9ca3af" }} />
               <br />
               <Text style={{ color: "#059669", display: "block", marginTop: "8px" }}>
                 Nenhuma cultura encontrada para "{searchTerm}"
               </Text>
               <br />
               <Text style={{ color: "#059669" }}>
                 Tente ajustar os termos de busca
               </Text>
             </div>
           ) : (
             <div style={{ 
               textAlign: "center", 
               padding: "40px 0",
               backgroundColor: "#f7fafc",
               borderRadius: "6px",
               border: "1px solid #d1fae5",
             }}>
               <TagOutlined style={{ fontSize: 48, color: "#9ca3af" }} />
               <br />
               <Text style={{ color: "#059669", display: "block", marginTop: "8px" }}>
                 Nenhuma cultura cadastrada no sistema
               </Text>
               <br />
               <Text style={{ color: "#059669" }}>
                 Use o formulário acima para adicionar culturas
               </Text>
             </div>
           )}
        </Card>
      </Space>
    </Modal>
  );
};

GerenciarCulturasSistemaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCulturasUpdated: PropTypes.func,
};

export default GerenciarCulturasSistemaModal; 