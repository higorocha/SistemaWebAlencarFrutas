import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Spin, message } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import PrimaryButton from '../../components/common/buttons/PrimaryButton';
import RegistrarFitaModal from '../../components/producao/RegistrarFitaModal';
import GerenciarFitasModal from '../../components/producao/GerenciarFitasModal';
import MapaBanana from '../../components/producao/MapaBanana';
import DetalhamentoModal from '../../components/producao/DetalhamentoModal';
import StatusCardsBanana from '../../components/producao/StatusCardsBanana';
import CalendarioColheitaBanana from '../../components/producao/CalendarioColheitaBanana';
import './ControleBanana.css';
import '../../components/pedidos/dashboard/DashboardStyles.css';

const { Title } = Typography;

const ControleBanana = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [listagemFitas, setListagemFitas] = useState([]);
  const [registrarModalVisible, setRegistrarModalVisible] = useState(false);
  const [gerenciarModalVisible, setGerenciarModalVisible] = useState(false);
  
  // Estados para o modal de detalhamento
  const [modalDetalhamento, setModalDetalhamento] = useState({
    visible: false,
    tipo: 'fita', // 'area' ou 'fita'
    itemId: null,
    itemNome: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do dashboard (que já inclui informações de tempo das fitas)
      const dashboardResponse = await axiosInstance.get('/controle-banana/dashboard');
      setDashboardData(dashboardResponse.data);
      
      // Extrair fitas únicas com informações de tempo dos dados do dashboard
      const fitasComTempo = [];
      const fitasMap = new Map();
      
      dashboardResponse.data.areasComFitas.forEach(area => {
        area.fitas.forEach(fita => {
          if (!fitasMap.has(fita.id)) {
            fitasMap.set(fita.id, {
              id: fita.id,
              nome: fita.nome,
              corHex: fita.corHex,
              quantidadeFitas: fita.quantidadeFitas,
              tempoDesdeData: fita.tempoDesdeData,
              dataMaisAntiga: fita.dataMaisAntiga
            });
          } else {
            // Somar quantidades se a fita já existe
            const fitaExistente = fitasMap.get(fita.id);
            fitaExistente.quantidadeFitas += fita.quantidadeFitas;
          }
        });
      });
      
      setListagemFitas(Array.from(fitasMap.values()));
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification(
        'error',
        'Erro',
        'Falha ao carregar dados do sistema de controle de banana'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarFita = () => {
    setRegistrarModalVisible(true);
  };

  const handleGerenciarFitas = () => {
    setGerenciarModalVisible(true);
  };

  const abrirModalDetalhamento = (tipo, itemId, itemNome) => {
    setModalDetalhamento({
      visible: true,
      tipo,
      itemId,
      itemNome
    });
  };

  const fecharModalDetalhamento = () => {
    setModalDetalhamento({
      visible: false,
      tipo: 'fita',
      itemId: null,
      itemNome: ''
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="controle-banana-container">
      {/* Header com título e botões */}
      <Card className="header-card" size="small">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#059669' }}>
              🍌 Controle de Produção - Banana
            </Title>
          </Col>
          <Col>
            <PrimaryButton
              icon={<PlusOutlined />}
              onClick={handleRegistrarFita}
              style={{ marginRight: 8 }}
            >
              Registrar Fita
            </PrimaryButton>
            <PrimaryButton
              icon={<SettingOutlined />}
              onClick={handleGerenciarFitas}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Gerenciar Fitas
            </PrimaryButton>
          </Col>
        </Row>
      </Card>

      {/* Cards de Estatísticas */}
      {dashboardData && (
        <StatusCardsBanana stats={dashboardData.estatisticas} />
      )}

      {/* Área principal dividida */}
      <Row gutter={16} className="main-content">
        {/* Coluna do Mapa (70%) */}
        <Col span={17}>
          <MapaBanana dashboardData={dashboardData} />
        </Col>

        {/* Coluna da Listagem (30%) */}
        <Col span={7}>
          <Card 
            title="Fitas Cadastradas" 
            className="listagem-card"
            style={{ height: '600px' }}
          >
            <div className="listagem-container">
              {listagemFitas.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 0',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
                  <div>Nenhuma fita cadastrada</div>
                </div>
              ) : (
                <div className="fitas-lista">
                  {listagemFitas.map((fita) => (
                    <div 
                      key={fita.id} 
                      className="fita-item"
                      style={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={() => abrirModalDetalhamento('fita', fita.id, fita.nome)}
                    >
                      <div className="fita-info">
                        <div 
                          className="fita-cor"
                          style={{ backgroundColor: fita.corHex }}
                        />
                        <div className="fita-detalhes">
                          <div className="fita-nome">{fita.nome}</div>
                          <div className="fita-stats">
                            {fita.quantidadeFitas || 0} fitas totais
                          </div>
                          {fita.tempoDesdeData && (
                            <div className="fita-tempo" style={{ 
                              fontSize: '12px', 
                              color: '#059669', 
                              marginTop: '2px',
                              fontWeight: '500'
                            }}>
                              {fita.tempoDesdeData.semanas > 0 
                                ? `${fita.tempoDesdeData.semanas} semana${fita.tempoDesdeData.semanas !== 1 ? 's' : ''}`
                                : `${fita.tempoDesdeData.dias} dia${fita.tempoDesdeData.dias !== 1 ? 's' : ''}`
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Calendário de Colheita */}
      <CalendarioColheitaBanana />

      {/* Modais */}
      <RegistrarFitaModal
        visible={registrarModalVisible}
        onCancel={() => setRegistrarModalVisible(false)}
        onSuccess={carregarDados}
      />

      <GerenciarFitasModal
        visible={gerenciarModalVisible}
        onCancel={() => setGerenciarModalVisible(false)}
        onSuccess={carregarDados}
      />

      {/* Modal de Detalhamento */}
      <DetalhamentoModal
        visible={modalDetalhamento.visible}
        onClose={fecharModalDetalhamento}
        tipo={modalDetalhamento.tipo}
        itemId={modalDetalhamento.itemId}
        itemNome={modalDetalhamento.itemNome}
        areas={dashboardData?.areasComFitas || []}
        onSuccess={carregarDados}
      />
    </div>
  );
};

export default ControleBanana;