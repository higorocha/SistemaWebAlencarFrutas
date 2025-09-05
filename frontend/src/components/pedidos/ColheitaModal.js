// src/components/pedidos/ColheitaModal.js

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Space, message, Form, Input, Select, DatePicker, InputNumber, Row, Col, Typography, Card, Divider } from "antd";
import PropTypes from "prop-types";
import { 
  SaveOutlined, 
  CloseOutlined, 
  ShoppingOutlined,
  AppleOutlined,
  CalendarOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined
} from "@ant-design/icons";
import { showNotification } from "../../config/notificationConfig";
import moment from "moment";
import axiosInstance from "../../api/axiosConfig";
import { MaskedDecimalInput } from "../../components/common/inputs";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;



const ColheitaModal = ({
  open,
  onClose,
  onSave,
  pedido,
  loading,
}) => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [areasProprias, setAreasProprias] = useState([]);
  const [areasFornecedores, setAreasFornecedores] = useState([]);
  const [modoAreaFruta, setModoAreaFruta] = useState({});
  const [selectAberto, setSelectAberto] = useState({});
  
  // Ref para controlar o valor original da data de colheita
  const dataColheitaOriginalRef = useRef(null);

  // Carregar áreas próprias e de fornecedores
  useEffect(() => {
    const fetchAreas = async () => {
      try {
                 // Buscar áreas próprias
         const responseAreas = await axiosInstance.get("/api/areas-agricolas");
         setAreasProprias(responseAreas.data || []);

                 // Buscar áreas de fornecedores
         const responseAreasFornecedores = await axiosInstance.get("/api/areas-fornecedores");
         setAreasFornecedores(responseAreasFornecedores.data || []);
      } catch (error) {
        console.error("Erro ao buscar áreas:", error);
        showNotification("error", "Erro", "Erro ao carregar áreas");
      }
    };

    if (open) {
      fetchAreas();
    }
  }, [open]);

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (open && pedido) {
      // Preparar dados das frutas para o formulário
      const frutasForm = pedido.frutasPedidos?.map(fruta => ({
        frutaPedidoId: fruta.id,
        frutaId: fruta.frutaId,
        frutaNome: fruta.fruta?.nome,
        quantidadePrevista: fruta.quantidadePrevista,
        unidadeMedida1: fruta.unidadeMedida1,
        unidadeMedida2: fruta.unidadeMedida2,
        quantidadeReal: fruta.quantidadeReal || undefined,
        quantidadeReal2: fruta.quantidadeReal2 || undefined,
        areaPropriaId: fruta.areaPropriaId || undefined,
        areaFornecedorId: fruta.areaFornecedorId || undefined,
        fitaColheita: fruta.fitaColheita || undefined
      })) || [];

             // Armazenar o valor original da data de colheita
       const dataColheita = pedido.dataColheita ? moment(pedido.dataColheita) : moment();
       dataColheitaOriginalRef.current = dataColheita;
       
       form.setFieldsValue({
         dataColheita: dataColheita,
         observacoesColheita: pedido.observacoesColheita || '',
         frutas: frutasForm,
         // Campos de frete
         pesagem: pedido.pesagem || '',
         placaPrimaria: pedido.placaPrimaria || '',
         placaSecundaria: pedido.placaSecundaria || '',
         nomeMotorista: pedido.nomeMotorista || ''
       });
    } else if (open) {
      form.resetFields();
    }
  }, [open, pedido, form]);

  const unidadesMedida = [
    { value: 'KG', label: 'Quilogramas (KG)' },
    { value: 'TON', label: 'Toneladas (TON)' },
    { value: 'CX', label: 'Caixas (CX)' },
    { value: 'UND', label: 'Unidades (UND)' },
  ];

  const coresFita = [
    { value: 'Verde', label: 'Verde', color: '#52c41a' },
    { value: 'Azul', label: 'Azul', color: '#1890ff' },
    { value: 'Vermelho', label: 'Vermelho', color: '#ff4d4f' },
    { value: 'Amarelo', label: 'Amarelo', color: '#faad14' },
    { value: 'Laranja', label: 'Laranja', color: '#fa8c16' },
    { value: 'Rosa', label: 'Rosa', color: '#eb2f96' },
    { value: 'Roxo', label: 'Roxo', color: '#722ed1' },
    { value: 'Marrom', label: 'Marrom', color: '#8c8c8c' },
    { value: 'Preto', label: 'Preto', color: '#262626' },
    { value: 'Branco', label: 'Branco', color: '#f0f0f0' },
  ];

  const handleSalvarColheita = async (values) => {
    try {
      setIsSaving(true);

      // Validar se pelo menos uma fruta tem dados de colheita
      if (!values.frutas || values.frutas.length === 0) {
        showNotification("error", "Erro", "Nenhuma fruta encontrada para colheita");
        return;
      }

                               // Validar se todas as frutas têm dados obrigatórios
          for (let i = 0; i < values.frutas.length; i++) {
            const fruta = values.frutas[i];
                        if (!fruta.quantidadeReal || fruta.quantidadeReal <= 0) {
               showNotification("error", "Erro", `Informe a quantidade real colhida da fruta ${i + 1}`);
               return;
             }
           
                        // VALIDAÇÃO: Verificar se exatamente uma área foi selecionada
             const hasAreaPropria = fruta.areaPropriaId !== undefined && fruta.areaPropriaId !== null;
             const hasAreaFornecedor = fruta.areaFornecedorId !== undefined && fruta.areaFornecedorId !== null;
             
             if (!hasAreaPropria && !hasAreaFornecedor) {
               showNotification("error", "Erro", `Selecione uma área de origem para a fruta ${i + 1}`);
               return;
             }
             
             if (hasAreaPropria && hasAreaFornecedor) {
               showNotification("error", "Erro", `Fruta ${i + 1}: Não é possível selecionar área própria e de fornecedor simultaneamente`);
               return;
             }
          }

      const formData = {
        dataColheita: values.dataColheita.toISOString(),
        observacoesColheita: values.observacoesColheita,
        frutas: values.frutas.map(fruta => ({
          frutaPedidoId: fruta.frutaPedidoId,
          quantidadeReal: fruta.quantidadeReal,
          quantidadeReal2: fruta.quantidadeReal2,
          areaPropriaId: fruta.areaPropriaId,
          areaFornecedorId: fruta.areaFornecedorId,
          fitaColheita: fruta.fitaColheita
        })),
        // Campos de frete
        pesagem: values.pesagem,
        placaPrimaria: values.placaPrimaria,
        placaSecundaria: values.placaSecundaria,
        nomeMotorista: values.nomeMotorista
      };

      await onSave(formData);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Erro ao registrar colheita:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    form.resetFields();
    onClose();
  };

  // Função para gerenciar o foco do campo de data
  const handleDataColheitaFocus = () => {
    // Limpa o campo quando recebe foco
    form.setFieldValue('dataColheita', null);
  };

  // Função para gerenciar a perda de foco do campo de data
  const handleDataColheitaBlur = () => {
    const valorAtual = form.getFieldValue('dataColheita');
    
    // Se não há valor selecionado, restaura o valor original
    if (!valorAtual) {
      form.setFieldValue('dataColheita', dataColheitaOriginalRef.current);
    }
  };

  return (
    <>
      {/* CSS local para sobrescrever estilos do Ant Design */}
      <style>
        {`
          /* Estilo para campos desabilitados */
          .custom-disabled-visual.ant-input-disabled {
            background-color: #e8e8e8 !important;
            color: rgba(0, 0, 0, 0.25) !important; 
          }

          /* Ocultar mensagens de erro */
          .ant-form-item-has-error .ant-form-item-explain,
          .ant-form-item-has-error .ant-form-item-split,
          .ant-form-item-explain,
          .ant-form-item-split {
            display: none !important;
          }

          /* Estilo para o campo mascarado */
          .ant-input {
            border-radius: 6px;
            border-color: #d9d9d9;
          }

          .ant-input:focus {
            border-color: #059669;
            box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
          }
        `}
      </style>
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
          <ShoppingOutlined style={{ marginRight: 8 }} />
          Registrar Colheita
        </span>
      }
      open={open}
      onCancel={handleCancelar}
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
      {pedido && (
        <>
          {/* Informações do Pedido */}
          <Card
            title={
              <Space>
                <ShoppingOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Pedido</span>
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
              <Col xs={24} md={6}>
                <Text strong>Pedido:</Text>
                <br />
                <Text style={{ color: "#059669", fontWeight: "600" }}>{pedido.numeroPedido}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Cliente:</Text>
                <br />
                <Text>{pedido.cliente?.nome}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Data Prevista:</Text>
                <br />
                <Text>{pedido.dataPrevistaColheita ? moment(pedido.dataPrevistaColheita).format('DD/MM/YYYY') : '-'}</Text>
              </Col>
              <Col xs={24} md={6}>
                <Text strong>Status:</Text>
                <br />
                <Text style={{ color: "#faad14", fontWeight: "600" }}>Aguardando Colheita</Text>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSalvarColheita}
      >
        {/* Seção 1: Dados da Colheita */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados da Colheita</span>
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
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Data da Colheita</span>
                  </Space>
                }
                name="dataColheita"
                rules={[
                  { required: true, message: "Data da colheita é obrigatória" },
                ]}
              >
                                 <DatePicker
                   style={{ 
                     width: "100%",
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
                   format="DD/MM/YYYY"
                   placeholder="Selecione a data"
                   disabledDate={(current) => current && current > moment().endOf('day')}
                   onFocus={handleDataColheitaFocus}
                   onBlur={handleDataColheitaBlur}
                 />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <span style={{ fontWeight: "700", color: "#333" }}>Observações da Colheita</span>
                  </Space>
                }
                name="observacoesColheita"
              >
                <TextArea
                  rows={3}
                  placeholder="Observações sobre a colheita (opcional)"
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Frutas da Colheita */}
        <Card
          title={
            <Space>
              <AppleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas da Colheita</span>
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
          <Form.List name="frutas">
            {(fields) => (
              <>
                                 {/* Cabeçalho das colunas */}
                 <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
                   <Col xs={24} md={5}>
                     <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <AppleOutlined style={{ marginRight: 8 }} />
                       Fruta
                     </span>
                   </Col>
                   <Col xs={24} md={3}>
                     <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <CalculatorOutlined style={{ marginRight: 8 }} />
                       Prevista
                     </span>
                   </Col>
                   <Col xs={24} md={3}>
                     <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <CalculatorOutlined style={{ marginRight: 8 }} />
                       Real
                     </span>
                   </Col>
                   <Col xs={24} md={3}>
                     <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <CalculatorOutlined style={{ marginRight: 8 }} />
                       Real 2
                     </span>
                   </Col>
                   <Col xs={24} md={6}>
                     <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <EnvironmentOutlined style={{ marginRight: 8 }} />
                       Área
                     </span>
                   </Col>
                   <Col xs={24} md={4}>
                     <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                       <FileTextOutlined style={{ marginRight: 8 }} />
                       Fita
                     </span>
                   </Col>
                 </Row>

                {fields.map(({ key, name, ...restField }, index) => {
                  const fruta = form.getFieldValue('frutas')?.[index];
                  
                  return (
                    <div key={key}>
                                             <Row gutter={[16, 16]} align="baseline">
                                                 {/* Nome da Fruta */}
                         <Col xs={24} md={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'frutaNome']}
                          >
                            <Input
                              disabled
                              value={fruta?.frutaNome || fruta?.fruta?.nome || ''}
                              style={{
                                borderRadius: "6px",
                                borderColor: "#d9d9d9",
                                backgroundColor: "#f5f5f5",
                              }}
                            />
                          </Form.Item>
                        </Col>

                                                 {/* Quantidade Prevista */}
                         <Col xs={24} md={3}>
                           <Form.Item
                             {...restField}
                           >
                             <Input
                               disabled
                               value={`${fruta?.quantidadePrevista || ''} ${fruta?.unidadeMedida1 || ''}`.trim()}
                               style={{
                                 borderRadius: "6px",
                                 borderColor: "#d9d9d9",
                                 backgroundColor: "#f5f5f5",
                               }}
                             />
                           </Form.Item>
                         </Col>

                                                {/* Quantidade Real */}
                         <Col xs={24} md={3}>
                                                       <Form.Item
                              {...restField}
                              name={[name, 'quantidadeReal']}
                              rules={[
                                { required: true },
                                { type: 'number', min: 0.01, message: 'Quantidade deve ser maior que 0' }
                              ]}
                              // NORMALIZADOR: Converte o valor de texto para número puro
                              normalize={(value) => {
                                if (!value) return null;
                                const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                                return isNaN(numero) ? null : numero;
                              }}
                            >
                             <MaskedDecimalInput
                               placeholder="Ex: 985,50"
                               addonAfter={fruta?.unidadeMedida1 || ''}
                               size="large"
                             />
                          </Form.Item>
                        </Col>

                                                 {/* Quantidade Real 2 */}
                         <Col xs={24} md={3}>
                                                       <Form.Item
                              {...restField}
                              name={[name, 'quantidadeReal2']}
                              // NORMALIZADOR: Converte o valor de texto para número puro
                              normalize={(value) => {
                                if (!value) return null;
                                const numero = parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
                                return isNaN(numero) ? null : numero;
                              }}
                            >
                             <MaskedDecimalInput
                                placeholder={!fruta?.unidadeMedida2 ? "-" : "Ex: 50,00"}
                                addonAfter={fruta?.unidadeMedida2 || ''}
                                disabled={!fruta?.unidadeMedida2}
                                className={!fruta?.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                                size="large"
                              />
                           </Form.Item>
                         </Col>

                                                                                                   {/* Área de Origem */}
                          <Col xs={24} md={6}>
                            <Form.Item
                              {...restField}
                              rules={[
                                { required: true, message: "Selecione uma área de origem" }
                              ]}
                            >
                                                            <Select
                                 key={`area-select-${name}-${modoAreaFruta[name] || 'propria'}`}
                                 placeholder="Selecione a área"
                                 style={{
                                   borderRadius: "6px",
                                   borderColor: "#d9d9d9",
                                 }}
                                 open={selectAberto[name]}
                                 onDropdownVisibleChange={(open) => {
                                   setSelectAberto(prev => ({ ...prev, [name]: open }));
                                 }}
                                                                onChange={(value, option) => {
                                   if (value === 'terceiros') {
                                     // Usuário quer ver áreas de terceiros
                                     form.setFieldValue(['frutas', name, 'areaPropriaId'], undefined);
                                     form.setFieldValue(['frutas', name, 'areaFornecedorId'], undefined);
                                     setModoAreaFruta(prev => ({ ...prev, [name]: 'terceiros' }));
                                     // Manter select aberto após troca de modo
                                     setTimeout(() => {
                                       setSelectAberto(prev => ({ ...prev, [name]: true }));
                                     }, 100);
                                   } else if (value === 'propria') {
                                     // Usuário quer voltar para áreas próprias
                                     form.setFieldValue(['frutas', name, 'areaPropriaId'], undefined);
                                     form.setFieldValue(['frutas', name, 'areaFornecedorId'], undefined);
                                     setModoAreaFruta(prev => ({ ...prev, [name]: 'propria' }));
                                     // Manter select aberto após troca de modo
                                     setTimeout(() => {
                                       setSelectAberto(prev => ({ ...prev, [name]: true }));
                                     }, 100);
                                   } else if (option?.data) {
                                     // Usuário selecionou uma área específica
                                     const areaData = option.data;
                                     if (areaData.tipo === 'propria') {
                                       form.setFieldValue(['frutas', name, 'areaPropriaId'], areaData.id);
                                       form.setFieldValue(['frutas', name, 'areaFornecedorId'], undefined);
                                     } else {
                                       form.setFieldValue(['frutas', name, 'areaFornecedorId'], areaData.id);
                                       form.setFieldValue(['frutas', name, 'areaPropriaId'], undefined);
                                     }
                                     // Fechar select quando uma área real é selecionada
                                     setSelectAberto(prev => ({ ...prev, [name]: false }));
                                   }
                                 }}
                              >
                                                               {/* Renderizar baseado no modo atual */}
                                {(!modoAreaFruta[name] || modoAreaFruta[name] === 'propria') ? (
                                 <>
                                   {/* Áreas Próprias */}
                                   {areasProprias.map((area) => (
                                     <Option 
                                       key={`propria-${area.id}`} 
                                       value={`propria-${area.id}`}
                                       data={{ tipo: 'propria', id: area.id }}
                                     >
                                       {area.nome}
                                     </Option>
                                   ))}
                                   
                                   {/* Opção para ir para terceiros */}
                                   <Option value="terceiros">
                                     <span style={{ color: '#1890ff', fontWeight: '500' }}>
                                       🔄 Ver áreas de terceiros
                                     </span>
                                   </Option>
                                 </>
                               ) : (
                                 <>
                                   {/* Opção para voltar para próprias */}
                                   <Option value="propria">
                                     <span style={{ color: '#52c41a', fontWeight: '500' }}>
                                       🔄 Voltar para áreas próprias
                                     </span>
                                   </Option>
                                   
                                   {/* Áreas de Fornecedores */}
                                   {areasFornecedores.map((area) => (
                                     <Option 
                                       key={`fornecedor-${area.id}`} 
                                       value={`fornecedor-${area.id}`}
                                       data={{ tipo: 'fornecedor', id: area.id }}
                                     >
                                       {area.nome} - {area.fornecedor?.nome || 'Fornecedor não informado'}
                                     </Option>
                                   ))}
                                 </>
                               )}
                             </Select>
                           </Form.Item>
                         </Col>

                                                 {/* Fita de Colheita */}
                         <Col xs={24} md={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'fitaColheita']}
                          >
                            <Select
                              placeholder="Cor da fita"
                              allowClear
                              style={{
                                borderRadius: "6px",
                                borderColor: "#d9d9d9",
                              }}
                            >
                              {coresFita.map((cor) => (
                                <Option key={cor.value} value={cor.value}>
                                  <Space>
                                    <div style={{
                                      width: 16,
                                      height: 16,
                                      backgroundColor: cor.color,
                                      borderRadius: '50%',
                                      border: '1px solid #d9d9d9'
                                    }} />
                                    {cor.label}
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      

                                             {index < fields.length - 1 && <Divider style={{ margin: "8px 0" }} />}
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>
        </Card>

        {/* Seção 3: Informações de Frete */}
        <Card
          title={
            <Space>
              <CarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações de Frete</span>
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
                     <Row gutter={[16, 16]}>
             <Col xs={24} md={5}>
               <Form.Item
                 label={
                   <Space>
                     <CalculatorOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333" }}>Pesagem</span>
                   </Space>
                 }
                 name="pesagem"
               >
                                  <Input
                    placeholder="Ex: 2500"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                  />
               </Form.Item>
             </Col>

             <Col xs={24} md={5}>
               <Form.Item
                 label={
                   <Space>
                     <CarOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333" }}>Placa Principal</span>
                   </Space>
                 }
                 name="placaPrimaria"
               >
                 <Input
                   placeholder="Ex: ABC-1234"
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
                 />
               </Form.Item>
             </Col>

             <Col xs={24} md={5}>
               <Form.Item
                 label={
                   <Space>
                     <CarOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333" }}>Placa Secundária</span>
                   </Space>
                 }
                 name="placaSecundaria"
               >
                 <Input
                   placeholder="Ex: XYZ-5678 (reboque)"
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
                 />
               </Form.Item>
             </Col>

             <Col xs={24} md={9}>
               <Form.Item
                 label={
                   <Space>
                     <UserOutlined style={{ color: "#059669" }} />
                     <span style={{ fontWeight: "700", color: "#333" }}>Motorista</span>
                   </Space>
                 }
                 name="nomeMotorista"
               >
                 <Input
                   placeholder="Nome do motorista"
                   style={{
                     borderRadius: "6px",
                     borderColor: "#d9d9d9",
                   }}
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
            onClick={handleCancelar}
            disabled={loading || isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading || isSaving}
            size="large"
            style={{
              backgroundColor: "#059669",
              borderColor: "#059669",
            }}
          >
            {isSaving ? "Registrando..." : "Registrar Colheita"}
          </Button>
                 </div>
       </Form>
     </Modal>
     </>
   );
 };

ColheitaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
};

export default ColheitaModal;
