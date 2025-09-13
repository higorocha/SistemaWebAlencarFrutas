import React, { useState, useEffect } from 'react';
import { Modal, Button, Popconfirm, Form, Input, Space, Tag, Card, Typography, Row, Col, Empty, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, SaveOutlined, CloseOutlined, TagOutlined, BgColorsOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { SketchPicker } from 'react-color';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import { PrimaryButton } from '../common/buttons';
import './GerenciarFitasModal.css';

const { Text, Title } = Typography;

const GerenciarFitasModal = ({ visible, onCancel, onSuccess }) => {
  const [fitas, setFitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operacaoLoading, setOperacaoLoading] = useState(false);
  const [editandoFita, setEditandoFita] = useState(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [novaFitaVisible, setNovaFitaVisible] = useState(false);
  const [corSelecionada, setCorSelecionada] = useState('#FF0000');
  const [mostrarSeletorCor, setMostrarSeletorCor] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      carregarFitas();
    }
  }, [visible]);

  const carregarFitas = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fitas-banana');
      setFitas(response.data);
    } catch (error) {
      console.error('Erro ao carregar fitas:', error);
      showNotification('error', 'Erro', 'Falha ao carregar fitas');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarFita = async (values) => {
    try {
      setOperacaoLoading(true);
      const novaFita = {
        nome: values.nome,
        corHex: corSelecionada
      };

      await axiosInstance.post('/fitas-banana', novaFita);
      showNotification('success', 'Sucesso', 'Fita criada com sucesso!');
      
      setNovaFitaVisible(false);
      form.resetFields();
      setCorSelecionada('#FF0000');
      setMostrarSeletorCor(false);
      
      // Recarregar apenas a lista de fitas
      await carregarFitas();
      
      // Não chamar onSuccess aqui para evitar reload da página pai
      // O onSuccess será chamado apenas quando o modal for fechado
    } catch (error) {
      console.error('Erro ao criar fita:', error);
      const mensagem = error.response?.data?.message || 'Falha ao criar fita';
      showNotification('error', 'Erro', mensagem);
    } finally {
      setOperacaoLoading(false);
    }
  };

  const handleEditarFita = async (id, values) => {
    try {
      setOperacaoLoading(true);
      const fitaAtualizada = {
        nome: values.nome,
        corHex: values.corHex
      };

      await axiosInstance.patch(`/fitas-banana/${id}`, fitaAtualizada);
      showNotification('success', 'Sucesso', 'Fita atualizada com sucesso!');
      
      setEditandoFita(null);
      await carregarFitas();
      
      // Não chamar onSuccess aqui para evitar reload da página pai
    } catch (error) {
      console.error('Erro ao editar fita:', error);
      const mensagem = error.response?.data?.message || 'Falha ao atualizar fita';
      showNotification('error', 'Erro', mensagem);
    } finally {
      setOperacaoLoading(false);
    }
  };

  const handleIniciarEdicao = (fita) => {
    setEditandoFita(fita.id);
    setNomeEditando(fita.nome);
  };

  const handleCancelarEdicao = () => {
    setEditandoFita(null);
    setNomeEditando('');
  };

  const handleSalvarEdicao = async (id) => {
    try {
      if (!nomeEditando.trim()) {
        showNotification('error', 'Erro', 'Nome da fita não pode estar vazio');
        return;
      }

      setOperacaoLoading(true);
      const fitaAtualizada = {
        nome: nomeEditando.trim()
      };

      await axiosInstance.patch(`/fitas-banana/${id}`, fitaAtualizada);
      showNotification('success', 'Sucesso', 'Fita atualizada com sucesso!');
      
      setEditandoFita(null);
      setNomeEditando('');
      await carregarFitas();
      
      // Não chamar onSuccess aqui para evitar reload da página pai
    } catch (error) {
      console.error('Erro ao editar fita:', error);
      const mensagem = error.response?.data?.message || 'Falha ao atualizar fita';
      showNotification('error', 'Erro', mensagem);
    } finally {
      setOperacaoLoading(false);
    }
  };

  const handleExcluirFita = async (id) => {
    try {
      setOperacaoLoading(true);
      await axiosInstance.delete(`/fitas-banana/${id}`);
      showNotification('success', 'Sucesso', 'Fita excluída com sucesso!');
      
      await carregarFitas();
      
      // Não chamar onSuccess aqui para evitar reload da página pai
    } catch (error) {
      console.error('Erro ao excluir fita:', error);
      const mensagem = error.response?.data?.message || 'Falha ao excluir fita';
      showNotification('error', 'Erro', mensagem);
    } finally {
      setOperacaoLoading(false);
    }
  };

  const handleCorChange = (color) => {
    setCorSelecionada(color.hex);
  };

  const handleCloseModal = () => {
    // Chamar onSuccess apenas quando o modal for fechado
    // Isso garante que a página pai seja atualizada apenas uma vez
    if (onSuccess) onSuccess();
    onCancel();
  };

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
          <SettingOutlined style={{ marginRight: 8 }} />
          Gerenciar Fitas de Banana
        </span>
      }
      open={visible}
      onCancel={handleCloseModal}
      footer={null}
      width="95%"
      style={{ maxWidth: 1400 }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px",
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        }
      }}
      centered
      destroyOnClose
    >
      <div className="gerenciar-fitas-container" style={{ position: 'relative' }}>
        {/* Overlay de Loading para Operações */}
        {operacaoLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #059669',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{
                color: '#059669',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Processando...
              </div>
            </div>
          </div>
        )}

        {/* Listagem de Fitas com Cards */}
        <div style={{
          height: "400px",
          maxHeight: "400px", 
          display: "flex",
          flexDirection: "column",
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
        }}>
          {/* Header da listagem */}
          <div style={{
            backgroundColor: "#059669",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "8px 8px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <SettingOutlined style={{ fontSize: "24px", marginRight: "12px" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                    Fitas Cadastradas
                  </Title>
                  <Badge
                    count={fitas.length}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      color: "#059669",
                      fontWeight: "600",
                    }}
                  />
                </div>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
                  Gerencie as fitas disponíveis no sistema
                </Text>
              </div>
            </div>
            <PrimaryButton
              icon={<PlusCircleOutlined />}
              onClick={() => setNovaFitaVisible(true)}
              size="middle"
            >
              Nova Fita
            </PrimaryButton>
          </div>

          {/* Conteúdo da listagem */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "16px",
            minHeight: 0,
          }}>
            {loading ? (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px"
              }}>
                <div>Carregando fitas...</div>
              </div>
            ) : fitas.length === 0 ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%"
              }}>
                <Empty
                  image={<SettingOutlined style={{ fontSize: "48px", color: "#d9d9d9" }} />}
                  description={
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                      Nenhuma fita cadastrada
                    </Text>
                  }
                />
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                paddingRight: "4px"
              }}>
                {fitas.map((fita) => (
                  <div key={fita.id} style={{
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9f9f9";
                    e.currentTarget.style.borderColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#e8e8e8";
                  }}
                  >
                    <Row align="middle" gutter={[16, 0]}>
                      <Col flex="none">
                        <div 
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: fita.corHex,
                            borderRadius: "6px",
                            border: "2px solid #d9d9d9",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                          }}
                        />
                      </Col>
                      <Col flex="auto">
                        {editandoFita === fita.id ? (
                          <Input 
                            value={nomeEditando}
                            onChange={(e) => setNomeEditando(e.target.value)}
                            onPressEnter={() => handleSalvarEdicao(fita.id)}
                            style={{
                              borderColor: "#059669",
                              borderWidth: "2px"
                            }}
                            autoFocus
                            placeholder="Digite o novo nome da fita"
                          />
                        ) : (
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#333" }}>
                              {fita.nome}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                              Criado em {new Date(fita.dataCriacao).toLocaleDateString('pt-BR')} por {fita.usuario?.nome || 'N/A'}
                            </div>
                          </div>
                        )}
                      </Col>
                      <Col flex="none">
                        <Tag color={fita._sum?.quantidadeFitas > 0 ? 'green' : 'default'} style={{ margin: 0 }}>
                          {fita._sum?.quantidadeFitas || 0} fitas
                        </Tag>
                      </Col>
                      <Col flex="none">
                        <Space size={4}>
                          {editandoFita === fita.id ? (
                            <>
                              <Button
                                type="text"
                                icon={<SaveOutlined />}
                                onClick={() => handleSalvarEdicao(fita.id)}
                                size="small"
                                style={{ color: "#059669" }}
                                title="Salvar alterações"
                              />
                              <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={handleCancelarEdicao}
                                size="small"
                                style={{ color: "#666" }}
                                title="Cancelar edição"
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleIniciarEdicao(fita)}
                                size="small"
                                style={{ color: "#1890ff" }}
                                title="Editar nome da fita"
                              />
                              <Popconfirm
                                title="Excluir fita"
                                description="Tem certeza? Esta ação não pode ser desfeita."
                                onConfirm={() => handleExcluirFita(fita.id)}
                                okText="Sim"
                                cancelText="Não"
                              >
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  size="small"
                                  title="Excluir fita"
                                />
                              </Popconfirm>
                            </>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <Button
            icon={<CloseOutlined />}
            onClick={handleCloseModal}
            size="large"
          >
            Fechar
          </Button>
        </div>
      </div>

      {/* Modal Nova Fita */}
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
            <PlusOutlined style={{ marginRight: 8 }} />
            Criar Nova Fita
          </span>
        }
        open={novaFitaVisible}
        onCancel={() => {
          setNovaFitaVisible(false);
          form.resetFields();
          setCorSelecionada('#FF0000');
          setMostrarSeletorCor(false);
        }}
        footer={null}
        width={700}
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
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleCriarFita}
        >
          <Card
            title={
              <Space>
                <TagOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações da Fita</span>
              </Space>
            }
            style={{ 
              marginBottom: 16,
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            headStyle={{
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Form.Item
              name="nome"
              label={
                <Space>
                  <TagOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Nome da Fita</span>
                </Space>
              }
              rules={[{ required: true, message: 'Nome é obrigatório' }]}
            >
              <Input 
                placeholder="Ex: Vermelha" 
                style={{
                  borderRadius: "6px",
                  borderColor: "#d9d9d9",
                }}
              />
            </Form.Item>

            <Form.Item 
              label={
                <Space>
                  <BgColorsOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Cor da Fita</span>
                </Space>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{ 
                      width: '50px',
                      height: '50px',
                      backgroundColor: corSelecionada,
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => setMostrarSeletorCor(!mostrarSeletorCor)}
                  />
                  <Input 
                    value={corSelecionada}
                    onChange={(e) => setCorSelecionada(e.target.value)}
                    placeholder="#FF0000"
                    style={{ 
                      flex: 1,
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                  />
                </div>
                {mostrarSeletorCor && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <SketchPicker
                      color={corSelecionada}
                      onChange={handleCorChange}
                      disableAlpha
                      width="300px"
                    />
                  </div>
                )}
              </div>
            </Form.Item>
          </Card>

          {/* Botões de Ação */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #e8e8e8",
            }}
          >
            <Button
              icon={<CloseOutlined />}
              onClick={() => setNovaFitaVisible(false)}
              size="large"
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              size="large"
              style={{
                backgroundColor: "#059669",
                borderColor: "#059669",
              }}
            >
              Criar Fita
            </Button>
          </div>
        </Form>
      </Modal>
    </Modal>
  );
};

export default GerenciarFitasModal;