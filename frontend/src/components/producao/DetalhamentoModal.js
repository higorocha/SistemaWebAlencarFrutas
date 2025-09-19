import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Row, Col, Spin, Empty, Tag, Space, Divider, Button, Badge, Select, Input, DatePicker, Form, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { 
  EnvironmentOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useTheme } from '@mui/material/styles';
import axiosInstance from '../../api/axiosConfig';
import useNotificationWithContext from '../../hooks/useNotificationWithContext';
import { CentralizedLoader } from '../common/loaders';
import { obterNumeroSemana, formatarData, calcularStatusMaturacao } from '../../utils/dateUtils';

const { Title, Text } = Typography;

const DetalhamentoModal = ({
  visible,
  onClose,
  tipo, // 'area' ou 'fita'
  itemId,
  itemNome,
  areas = [], // Receber áreas como prop para evitar chamada desnecessária à API
  onSuccess // Callback para atualizar a UI do componente pai
}) => {
  const theme = useTheme();
  const { success, error, contextHolder } = useNotificationWithContext();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(null);
  const [editandoControle, setEditandoControle] = useState(null);
  const [fitas, setFitas] = useState([]);
  const [operacaoLoading, setOperacaoLoading] = useState(false);

  useEffect(() => {
    if (visible && itemId) {
      carregarDetalhes();
      // Carregar fitas quando estiver no modo 'area' (para o seletor de fitas)
      if (tipo === 'area') {
        carregarFitas();
      }
    } else if (!visible) {
      // Limpar dados quando o modal for fechado
      setDados(null);
      setEditandoControle(null);
      setFitas([]);
    }
  }, [visible, itemId, tipo]);

  const carregarDetalhes = async () => {
    try {
      setLoading(true);
      const endpoint = tipo === 'area' 
        ? `/controle-banana/detalhes-area/${itemId}`
        : `/controle-banana/detalhes-fita/${itemId}`;
      
      const response = await axiosInstance.get(endpoint);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      error('Erro', 'Falha ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const carregarFitas = async () => {
    try {
      const response = await axiosInstance.get('/fitas-banana');
      setFitas(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fitas:', error);
      error('Erro', 'Falha ao carregar lista de fitas');
    }
  };

  const iniciarEdicao = (controle) => {
    if (!controle || !controle.id) {
      error('Erro', 'Dados do controle não encontrados');
      return;
    }

    // Sempre editamos um lote de fitas (controleBanana)
    // Independente do modo, precisa de areaId e fitaId para a atualização
    let editData = {
      id: controle.id,
      quantidade: controle.quantidadeFitas || 0,
      dataRegistro: dayjs(controle.dataRegistro)
    };

    if (tipo === 'area') {
      // Modo área: controle tem fita, área é o itemId atual
      if (!controle.fita || !controle.fita.id) {
        error('Erro', 'Fita do controle não encontrada');
        return;
      }
      editData.fitaId = controle.fita.id;
      editData.areaId = itemId; // ID da área atual (fixa)
    } else {
      // Modo fita: controle tem área, fita é o itemId atual
      if (!controle.area || !controle.area.id) {
        error('Erro', 'Área do controle não encontrada');
        return;
      }
      editData.areaId = controle.area.id;
      editData.fitaId = itemId; // ID da fita atual (fixa)
    }

    console.log('Iniciando edição:', editData);
    setEditandoControle(editData);
  };

  const cancelarEdicao = () => {
    setEditandoControle(null);
  };

  const salvarEdicao = async () => {
    try {
      setOperacaoLoading(true);
      
      const dadosAtualizacao = {
        areaAgricolaId: editandoControle.areaId,
        fitaBananaId: editandoControle.fitaId,
        quantidadeFitas: editandoControle.quantidade,
        dataRegistro: editandoControle.dataRegistro.toISOString()
      };

      console.log('Dados para atualização:', dadosAtualizacao);

      await axiosInstance.patch(`/controle-banana/${editandoControle.id}`, dadosAtualizacao);
      
      setEditandoControle(null);
      await carregarDetalhes(); // Recarregar dados do modal
      onSuccess && onSuccess(); // Atualizar UI do componente pai

      // Mostrar notificação após o loading
      success('Sucesso', 'Lote atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      error('Erro', 'Falha ao salvar alterações');
    } finally {
      setOperacaoLoading(false);
    }
  };

  const confirmarExclusao = (controleId) => {
    Modal.confirm({
      title: 'Excluir lote',
      content: 'Tem certeza que deseja excluir este lote de fitas?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: () => {
        // Executar exclusão após o modal fechar
        setTimeout(() => excluirControle(controleId), 100);
        // Não retornar Promise para evitar loading no botão
      },
      okButtonProps: {
        danger: true
      },
      zIndex: 1200 // Maior que DetalhamentoModal (1050)
    });
  };

  const excluirControle = async (controleId) => {
    try {
      setOperacaoLoading(true);

      await axiosInstance.delete(`/controle-banana/${controleId}`);

      await carregarDetalhes(); // Recarregar dados do modal
      onSuccess && onSuccess(); // Atualizar UI do componente pai

      // Mostrar notificação após o loading
      success('Sucesso', 'Lote excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir controle:', error);
      error('Erro', 'Falha ao excluir lote');
    } finally {
      setOperacaoLoading(false);
    }
  };


  const formatarTempo = (tempoDesdeData) => {
    if (!tempoDesdeData) return '';
    
    if (tempoDesdeData.semanas > 0) {
      return `${tempoDesdeData.semanas} semana${tempoDesdeData.semanas !== 1 ? 's' : ''}`;
    } else {
      return `${tempoDesdeData.dias} dia${tempoDesdeData.dias !== 1 ? 's' : ''}`;
    }
  };


  // Função para calcular previsões de colheita
  const calcularPrevisoesColheita = () => {
    if (!dados || !dados.controles) return [];

    const previsoes = [];
    const hoje = new Date();

    dados.controles.forEach(controle => {
      if (controle.quantidadeFitas > 0) {
        const dataRegistro = new Date(controle.dataRegistro);
        
        // Calcular datas de colheita (100-115 dias)
        const dataColheitaInicio = new Date(dataRegistro);
        dataColheitaInicio.setDate(dataColheitaInicio.getDate() + 100);
        
        const dataColheitaFim = new Date(dataRegistro);
        dataColheitaFim.setDate(dataColheitaFim.getDate() + 115);

        // Calcular status baseado na data atual
        const diasDesdeRegistro = Math.floor((hoje - dataRegistro) / (1000 * 60 * 60 * 24));
        const status = calcularStatusMaturacao(diasDesdeRegistro);

        // Só incluir se ainda não passou do período de colheita
        if (dataColheitaFim >= hoje) {
          previsoes.push({
            id: controle.id,
            fitaNome: tipo === 'area' ? controle.fita?.nome : dados.nome,
            fitaCor: tipo === 'area' ? controle.fita?.corHex : dados.corHex,
            quantidade: controle.quantidadeFitas,
            dataRegistro: dataRegistro,
            semanaRegistro: obterNumeroSemana(dataRegistro),
            dataColheitaInicio: dataColheitaInicio,
            dataColheitaFim: dataColheitaFim,
            semanaColheitaInicio: obterNumeroSemana(dataColheitaInicio),
            semanaColheitaFim: obterNumeroSemana(dataColheitaFim),
            status: status,
            areaNome: tipo === 'area' ? dados?.nome : controle.area?.nome
          });
        }
      }
    });

    // Ordenar por data de colheita (mais próximas primeiro)
    return previsoes.sort((a, b) => a.dataColheitaInicio - b.dataColheitaInicio);
  };

  // Cores para os status de colheita
  const coresStatusColheita = {
    maturacao: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' },
    colheita: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    alerta: { bg: '#fefce8', border: '#eab308', text: '#a16207' },
    vencido: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' }
  };

  const renderControles = () => {
    if (!dados || !dados.controles || !Array.isArray(dados.controles) || dados.controles.length === 0) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}>
          <Empty
            image={<InfoCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
            description={
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Nenhum registro encontrado
              </Text>
            }
          />
        </div>
      );
    }

    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "0px",
        width: "100%",
        paddingRight: "4px"
      }}>
        {/* Cabeçalho da tabela */}
        <div style={{
          padding: "8px 12px",
          backgroundColor: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: "4px",
          marginBottom: "4px",
          fontSize: "13px",
          fontWeight: "700",
          color: "#333",
          display: "flex",
          alignItems: "center"
        }}>
          <div style={{ flex: "2 1 0", minWidth: "0", textAlign: "left" }}>
            <strong>{tipo === 'area' ? 'Fita' : 'Área'}</strong>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
            <strong>Quantidade</strong>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
            <strong>Data</strong>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
            <strong>Tempo</strong>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
            <strong>Usuário</strong>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
            <strong>Ações</strong>
          </div>
        </div>

        {/* Lista de controles */}
        {dados.controles
          .filter(controle => controle && controle.id && controle.quantidadeFitas !== undefined)
          .map((controle, index) => (
          <div 
            key={controle.id}
            style={{
              padding: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e8e8e8",
              borderRadius: "6px",
              marginBottom: "4px",
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
            {editandoControle && editandoControle.id === controle.id ? (
              // Modo de Edição - Formulário estruturado
              <div style={{ padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
                <Form layout="vertical" size="large">
                  <Row gutter={[16, 16]}>
                    {tipo === 'fita' ? (
                      // Modo fita: mostrar seletor de área (fita é fixa)
                      <Col xs={24} md={8}>
                        <Form.Item
                          label={
                            <Space>
                              <EnvironmentOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "600", color: "#333" }}>Área</span>
                            </Space>
                          }
                          required
                        >
                          <Select
                            value={editandoControle.areaId}
                            onChange={(value) => setEditandoControle({...editandoControle, areaId: value})}
                            placeholder="Selecione a área"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          >
                            {areas.map(area => (
                              <Select.Option key={area.id} value={area.id}>
                                {area.nome}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    ) : (
                      // Modo área: mostrar seletor de fita (área é fixa)
                      <Col xs={24} md={8}>
                        <Form.Item
                          label={
                            <Space>
                              <TagOutlined style={{ color: "#059669" }} />
                              <span style={{ fontWeight: "600", color: "#333" }}>Fita</span>
                            </Space>
                          }
                          required
                        >
                          <Select
                            value={editandoControle.fitaId}
                            onChange={(value) => setEditandoControle({...editandoControle, fitaId: value})}
                            placeholder="Selecione a fita"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#d9d9d9",
                            }}
                          >
                            {fitas.map(fita => (
                              <Select.Option key={fita.id} value={fita.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: fita.corHex,
                                      borderRadius: '50%',
                                      border: '1px solid #ddd'
                                    }}
                                  />
                                  {fita.nome}
                                </div>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}

                    <Col xs={24} md={8}>
                      <Form.Item
                        label={
                          <Space>
                            <TagOutlined style={{ color: "#059669" }} />
                            <span style={{ fontWeight: "600", color: "#333" }}>Quantidade</span>
                          </Space>
                        }
                        required
                      >
                        <Input
                          type="number"
                          value={editandoControle.quantidade}
                          onChange={(e) => setEditandoControle({...editandoControle, quantidade: parseInt(e.target.value) || 0})}
                          placeholder="Quantidade de fitas"
                          min={0}
                          style={{
                            borderRadius: "6px",
                            borderColor: "#d9d9d9",
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        label={
                          <Space>
                            <CalendarOutlined style={{ color: "#059669" }} />
                            <span style={{ fontWeight: "600", color: "#333" }}>Data do Registro</span>
                          </Space>
                        }
                        required
                      >
                        <DatePicker
                          value={editandoControle.dataRegistro}
                          onChange={(date) => setEditandoControle({...editandoControle, dataRegistro: date})}
                          format="DD/MM/YYYY"
                          placeholder="Selecione a data"
                          style={{
                            width: '100%',
                            borderRadius: "6px",
                            borderColor: "#d9d9d9",
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                        <Button
                          onClick={cancelarEdicao}
                          size="large"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={salvarEdicao}
                          size="large"
                          style={{
                            backgroundColor: "#059669",
                            borderColor: "#059669",
                          }}
                        >
                          Salvar Alterações
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </div>
            ) : (
              // Modo de Visualização - Layout original
              <div style={{ display: "flex", alignItems: "center" }}>
                {/* Fita/Área */}
                <div style={{ flex: "2 1 0", minWidth: "0", textAlign: "left" }}>
                  {tipo === 'area' ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: controle.fita?.corHex || '#059669',
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <Text strong style={{ color: "#333", fontSize: "14px", display: "block" }}>
                          {controle.fita?.nome || 'Fita não encontrada'}
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Text strong style={{ color: "#333", fontSize: "14px", display: "block" }}>
                        {controle.area?.nome || 'Área não encontrada'}
                      </Text>
                      <Text style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                        {controle.area?.areaTotal || 0} ha
                      </Text>
                    </div>
                  )}
                </div>

                {/* Quantidade */}
                <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                  <Text strong style={{ 
                    fontSize: '16px', 
                    color: '#059669' 
                  }}>
                    {controle.quantidadeFitas}
                  </Text>
                </div>

                {/* Data */}
                <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                  <CalendarOutlined style={{ color: "#666", marginRight: '4px', fontSize: '12px' }} />
                  <Text style={{ fontSize: '12px', color: '#666' }}>
                    {formatarData(controle.dataRegistro)}
                  </Text>
                </div>

                {/* Tempo */}
                <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                  <ClockCircleOutlined style={{ color: '#059669', marginRight: '4px', fontSize: '12px' }} />
                  <Text style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                    {formatarTempo(controle.tempoDesdeData)}
                  </Text>
                </div>

                {/* Usuário */}
                <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                  <UserOutlined style={{ color: "#666", marginRight: '4px', fontSize: '12px' }} />
                  <Text style={{ fontSize: '12px', color: '#666' }}>
                    {controle.usuario?.nome || 'Usuário não encontrado'}
                  </Text>
                </div>

                {/* Ações */}
                <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                  <Space size="small">
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => iniciarEdicao(controle)}
                      title="Editar lote"
                    />
                    <Button
                      type="default"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      title="Excluir lote"
                      onClick={() => confirmarExclusao(controle.id)}
                      disabled={operacaoLoading}
                    />
                  </Space>
                </div>
              </div>
            )}

            {/* Observações (se houver) */}
            {controle.observacoes && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <Text style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                  {controle.observacoes}
                </Text>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getModalTitle = () => {
    if (!dados || !dados.nome) return '';
    
    if (tipo === 'area') {
      return `🗺️ Detalhes da Área: ${dados.nome}`;
    } else {
      return `🍌 Detalhes da Fita: ${dados.nome}`;
    }
  };

  const getResumo = () => {
    if (!dados || !dados.controles) return null;

    if (tipo === 'area') {
      return (
        <Card
          title={
            <Space>
              <EnvironmentOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo da Área</span>
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
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                  {dados.totalControles}
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Registros
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                  {dados.totalFitas}
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Total de Fitas
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                  {dados.areaTotal} ha
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Área Total
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      );
    } else {
      return (
        <Card
          title={
            <Space>
              <InfoCircleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo da Fita</span>
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
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: dados.corHex,
                    borderRadius: '50%',
                    border: '3px solid #fff',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    margin: '0 auto 8px auto'
                  }}
                />
                <Text style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                  Cor da Fita
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                  {dados.totalControles}
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Registros
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                  {dados.totalFitas}
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Total de Fitas
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                  {dados.totalAreas}
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  Áreas
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      );
    }
  };

  return (
    <>
      {contextHolder}
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
          {tipo === 'area' ? (
            <>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              Detalhes da Área: {itemNome}
            </>
          ) : (
            <>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Detalhes da Fita: {itemNome}
            </>
          )}
        </span>
      }
      open={visible}
      onCancel={onClose}
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
      destroyOnClose
      zIndex={1050}
    >
      <div style={{ position: 'relative' }}>
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
            zIndex: 1060,
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>
            Carregando detalhes...
          </div>
        </div>
      ) : (
        <div>
          {/* Resumo */}
          {getResumo()}

          {/* Lista de Controles */}
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
                  <InfoCircleOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>
                    {tipo === 'area' ? 'Fitas da Área' : 'Áreas da Fita'}
                  </span>
                </Space>
                <Badge
                  count={dados?.controles?.length || 0}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    color: "#059669",
                    fontWeight: "600",
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
                maxHeight: "350px",
                overflowY: "auto",
                overflowX: "hidden"
              }
            }}
          >
            {renderControles()}
          </Card>

          {/* Previsão de Colheita */}
          {calcularPrevisoesColheita().length > 0 && (
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
                    <CalendarOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600" }}>
                      Previsão de Colheita
                    </span>
                  </Space>
                  <Badge
                    count={calcularPrevisoesColheita().length}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      color: "#059669",
                      fontWeight: "600",
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
                  maxHeight: "350px",
                  overflowY: "auto",
                  overflowX: "hidden"
                }
              }}
            >
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "8px",
                width: "100%",
                paddingRight: "4px"
              }}>
                {/* Cabeçalho da tabela */}
                <div style={{
                  padding: "8px 12px",
                  backgroundColor: "#fafafa",
                  border: "1px solid #f0f0f0",
                  borderRadius: "4px",
                  marginBottom: "4px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#333",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <div style={{ flex: "1.5 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Fita</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Quantidade</strong>
                  </div>
                  <div style={{ flex: "1.2 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Data Marcação</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Semana</strong>
                  </div>
                  <div style={{ flex: "1.2 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Previsão Colheita</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Período de Colheita</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Status</strong>
                  </div>
                </div>

                {/* Lista de previsões */}
                {calcularPrevisoesColheita().map((previsao, index) => (
                  <div 
                    key={previsao.id}
                    style={{
                      padding: "12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e8e8e8",
                      borderRadius: "6px",
                      marginBottom: "4px",
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
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {/* Fita */}
                      <div style={{ flex: "1.5 1 0", minWidth: "0", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div 
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: previsao.fitaCor,
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }}
                          />
                          <div>
                            <Text strong style={{ color: "#333", fontSize: "14px", display: "block" }}>
                              {previsao.fitaNome}
                            </Text>
                            <Text style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              {tipo === 'area' ? dados.nome : previsao.areaNome}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Quantidade */}
                      <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                        <Text strong style={{ 
                          fontSize: '16px', 
                          color: '#059669' 
                        }}>
                          {previsao.quantidade}
                        </Text>
                        <br />
                        <Text style={{ fontSize: '11px', color: '#666' }}>
                          fitas
                        </Text>
                      </div>

                      {/* Data Marcação */}
                      <div style={{ flex: "1.2 1 0", minWidth: "0", textAlign: "center" }}>
                        <CalendarOutlined style={{ color: "#666", marginRight: '4px', fontSize: '12px' }} />
                        <Text style={{ fontSize: '12px', color: '#666' }}>
                          {formatarData(previsao.dataRegistro)}
                        </Text>
                      </div>

                      {/* Semana Marcação */}
                      <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                        <Text style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                          Sem {previsao.semanaRegistro}
                        </Text>
                      </div>

                      {/* Previsão Colheita */}
                      <div style={{ flex: "1.2 1 0", minWidth: "0", textAlign: "center" }}>
                        <CalendarOutlined style={{ color: "#059669", marginRight: '4px', fontSize: '12px' }} />
                        <Text style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                          {formatarData(previsao.dataColheitaInicio)}
                        </Text>
                        <br />
                        <Text style={{ fontSize: '10px', color: '#666' }}>
                          até {formatarData(previsao.dataColheitaFim)}
                        </Text>
                      </div>

                      {/* Semana Colheita */}
                      <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                        <Tooltip
                          title={
                            <div style={{ maxWidth: '300px' }}>
                              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                                📅 Período de Colheita
                              </div>
                              <div style={{ marginBottom: '6px' }}>
                                <span style={{ color: '#22c55e', fontWeight: '500' }}>🟢 Início:</span> Semana {previsao.semanaColheitaInicio} ({formatarData(previsao.dataColheitaInicio)})
                              </div>
                              <div style={{ marginBottom: '6px' }}>
                                <span style={{ color: '#ef4444', fontWeight: '500' }}>🔴 Fim:</span> Semana {previsao.semanaColheitaFim} ({formatarData(previsao.dataColheitaFim)})
                              </div>
                              <div style={{ fontSize: '12px', color: '#1f2937', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #d1d5db' }}>
                                <strong style={{ color: '#1f2937' }}>💡 Dica:</strong> Este é o período ideal para colher as bananas. 
                                {previsao.semanaColheitaInicio === previsao.semanaColheitaFim 
                                  ? ' A colheita deve ser feita nesta semana específica.'
                                  : ` Você tem ${previsao.semanaColheitaFim - previsao.semanaColheitaInicio + 1} semanas para realizar a colheita.`
                                }
                              </div>
                            </div>
                          }
                          placement="top"
                        >
                          {previsao.semanaColheitaInicio === previsao.semanaColheitaFim ? (
                            <div style={{
                              padding: '6px 12px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              display: 'inline-block',
                              cursor: 'help'
                            }}>
                              <Text style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                                Sem {previsao.semanaColheitaInicio}
                              </Text>
                            </div>
                          ) : (
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              display: 'inline-block',
                              minWidth: '90px',
                              cursor: 'help'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: '#22c55e',
                                  borderRadius: '50%',
                                  marginRight: '6px',
                                  flexShrink: 0
                                }} />
                                <Text style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                                  Sem {previsao.semanaColheitaInicio}
                                </Text>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: '#ef4444',
                                  borderRadius: '50%',
                                  marginRight: '6px',
                                  flexShrink: 0
                                }} />
                                <Text style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                                  Sem {previsao.semanaColheitaFim}
                                </Text>
                              </div>
                            </div>
                          )}
                        </Tooltip>
                      </div>

                      {/* Status */}
                      <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: coresStatusColheita[previsao.status].bg,
                          border: `1px solid ${coresStatusColheita[previsao.status].border}`,
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          <Text style={{ 
                            fontSize: '11px', 
                            color: coresStatusColheita[previsao.status].text,
                            fontWeight: '500'
                          }}>
                            {previsao.status === 'maturacao' && '🌱 Maturação'}
                            {previsao.status === 'colheita' && '🍌 Colheita'}
                            {previsao.status === 'alerta' && '⚠️ Alerta'}
                            {previsao.status === 'vencido' && '🚨 Risco'}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
              onClick={onClose}
              size="large"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
      </div>

    </Modal>
    </>
  );
};

export default DetalhamentoModal;
