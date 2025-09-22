import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Button, Row, Col, Card, Space } from 'antd';
import axiosInstance from '../../api/axiosConfig';
import dayjs from 'dayjs';
import { showNotification } from '../../config/notificationConfig';
import { CentralizedLoader } from '../common/loaders';
import { SaveOutlined, CloseOutlined, TagOutlined, CalendarOutlined, UserOutlined, EnvironmentOutlined, NumberOutlined, FileTextOutlined } from '@ant-design/icons';
import './RegistrarFitaModal.css';

const { TextArea } = Input;
const { Option } = Select;

const RegistrarFitaModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [fitas, setFitas] = useState([]);

  useEffect(() => {
    if (visible) {
      carregarDados();
      form.resetFields();
    }
  }, [visible, form]);

  const carregarDados = async () => {
    try {
      const [areasResponse, fitasResponse] = await Promise.all([
        axiosInstance.get('/api/areas-agricolas'),
        axiosInstance.get('/fitas-banana')
      ]);
      
      setAreas(areasResponse.data);
      setFitas(fitasResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('error', 'Erro', 'Falha ao carregar dados necessários');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Ativar loading no próprio modal
      setLoading(true);

      // Marcar controle com fita existente
      const controleData = {
        fitaBananaId: values.fitaBananaId,
        areaAgricolaId: values.areaAgricolaId,
        quantidadeFitas: values.quantidadeFitas,
        dataRegistro: values.dataRegistro?.format('YYYY-MM-DD'),
        observacoes: values.observacoes || null
      };

      await axiosInstance.post('/controle-banana', controleData);

      // Limpar apenas os campos do formulário, mantendo o modal aberto
      form.resetFields();
      form.setFieldsValue({
        dataRegistro: dayjs(),
        quantidadeFitas: 1
      });

      // Atualizar dados na página pai
      onSuccess();

      // Mostrar notificação de sucesso
      showNotification('success', 'Sucesso', 'Fita marcada com sucesso! O modal permanece aberto para novos registros.');
    } catch (error) {
      // Extrair mensagem de erro mais detalhada
      let mensagem = 'Erro ao criar controle de banana';

      if (error.response?.data?.message) {
        mensagem = error.response.data.message;
      } else if (error.response?.data?.error) {
        mensagem = error.response.data.error;
      } else if (error.message) {
        mensagem = error.message;
      }

      showNotification('error', 'Erro', mensagem);
    } finally {
      // Desativar loading no modal
      setLoading(false);
    }
  };

  // Função para cancelar
  const handleCancel = () => {
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
          <TagOutlined style={{ marginRight: 8 }} />
          Marcar Fita de Banana
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width="90%"
      style={{ maxWidth: 1200 }}
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
      zIndex={1050}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          dataRegistro: dayjs(),
          quantidadeFitas: 1
        }}
      >
        {/* Selecionar Fita Existente */}
        <Card
          title={
            <Space>
              <TagOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Selecionar Fita</span>
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
          <Form.Item
            name="fitaBananaId"
            label={
              <Space>
                <TagOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#333" }}>Fita Cadastrada</span>
              </Space>
            }
            rules={[{ required: true, message: 'Selecione uma fita' }]}
          >
            <Select 
              placeholder="Escolha uma fita cadastrada"
              size="large"
              style={{
                borderRadius: "6px",
                borderColor: "#d9d9d9",
              }}
            >
              {fitas.map(fita => (
                <Option key={fita.id} value={fita.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: fita.corHex,
                        borderRadius: '50%',
                        border: '1px solid #ccc'
                      }}
                    />
                    {fita.nome}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card
          title={
            <Space>
              <SaveOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Registro</span>
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
            <Col span={12}>
              <Form.Item
                name="areaAgricolaId"
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Área Agrícola</span>
                  </Space>
                }
                rules={[{ required: true, message: 'Selecione uma área' }]}
              >
                <Select placeholder="Escolha a área">
                  {areas.map(area => (
                    <Option key={area.id} value={area.id}>
                      {area.nome}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantidadeFitas"
                label={
                  <Space>
                    <NumberOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Quantidade de Fitas</span>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Quantidade é obrigatória' },
                  { type: 'number', min: 1, message: 'Mínimo 1 fita' }
                ]}
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }}
                  placeholder="Quantidade"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="dataRegistro"
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Data da Marcação</span>
                  </Space>
                }
                rules={[{ required: true, message: 'Data é obrigatória' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="observacoes"
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações (Opcional)</span>
                  </Space>
                }
              >
                <TextArea 
                  rows={2}
                  placeholder="Observações sobre o registro..."
                />
              </Form.Item>
            </Col>
          </Row>
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
            onClick={handleCancel}
            disabled={loading}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading}
            disabled={loading}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {loading ? "Marcando..." : "Marcar Fita"}
          </Button>
        </div>
      </Form>

    </Modal>
  );
};

export default RegistrarFitaModal;