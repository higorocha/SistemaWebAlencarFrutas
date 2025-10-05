import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Spin, message, Button, Tooltip } from 'antd';
import { PlusOutlined, SettingOutlined, SwapOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import { CentralizedLoader } from '../../components/common/loaders';
import PrimaryButton from '../../components/common/buttons/PrimaryButton';
import RegistrarFitaModal from '../../components/producao/RegistrarFitaModal';
import GerenciarFitasModal from '../../components/producao/GerenciarFitasModal';
import MapaBanana from '../../components/producao/MapaBanana';
import DetalhamentoModal from '../../components/producao/DetalhamentoModal';
import StatusCardsBanana from '../../components/producao/StatusCardsBanana';
import CalendarioColheitaBanana from '../../components/producao/CalendarioColheitaBanana';
import useResponsive from '../../hooks/useResponsive';
import './ControleBanana.css';
import '../../components/pedidos/dashboard/DashboardStyles.css';

const { Title } = Typography;

const ControleBanana = () => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");
  const [dashboardData, setDashboardData] = useState(null);
  const [listagemFitas, setListagemFitas] = useState([]);
  const [listagemAreas, setListagemAreas] = useState([]);
  const [registrarModalVisible, setRegistrarModalVisible] = useState(false);
  const [gerenciarModalVisible, setGerenciarModalVisible] = useState(false);
  const [modoExibicao, setModoExibicao] = useState('fitas'); // 'fitas' ou 'areas'

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


  const carregarDados = async (showCentralizedLoading = true) => {
    try {
      if (showCentralizedLoading) {
        setCentralizedLoading(true);
        setLoadingMessage("Carregando dados do controle de banana...");
      }
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
      
      // ✅ FILTRAR fitas com quantidade > 0 para ocultar lotes vazios
      const fitasComQuantidade = Array.from(fitasMap.values()).filter(fita => 
        fita.quantidadeFitas > 0
      );
      
      setListagemFitas(fitasComQuantidade);
      
      // Processar áreas com fitas para o modo áreas
      const areasComFitas = dashboardResponse.data.areasComFitas
        .filter(area => area.totalFitas > 0)
        .map(area => ({
          id: area.id,
          nome: area.nome,
          totalFitas: area.totalFitas,
          totalRegistros: area.totalRegistros,
          areaTotal: area.areaTotal,
          categoria: area.categoria,
          fitas: area.fitas
        }));
      
      setListagemAreas(areasComFitas);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification(
        'error',
        'Erro',
        'Falha ao carregar dados do sistema de controle de banana'
      );
    } finally {
      setLoading(false);
      if (showCentralizedLoading) {
        setCentralizedLoading(false);
      }
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

  const toggleModoExibicao = () => {
    setModoExibicao(prev => prev === 'fitas' ? 'areas' : 'fitas');
  };

  const fecharModalDetalhamento = () => {
    setModalDetalhamento({
      visible: false,
      tipo: 'fita',
      itemId: null,
      itemNome: ''
    });
  };

  // Callback para atualizar dados após operações nos modais
  const handleModalSuccess = () => {
    // Recarregar dados para atualizar mapa e listagem
    carregarDados(false); // Sem centralizedLoader, pois modal permanece aberto
  };

  // Callback para controlar loading dos modais (usado pelo GerenciarFitasModal)
  const handleModalLoading = (loading, message) => {
    setCentralizedLoading(loading);
    if (message) {
      setLoadingMessage(message);
    }
  };

  return (
    <div className="controle-banana-container">
      {/* Header com título e botões */}
      <Card className="header-card" size="small">
        <Row
          justify="space-between"
          align="middle"
          gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}
        >
          <Col xs={24} sm={12} md={14}>
            <Title
              level={2}
              style={{
                margin: 0,
                color: '#059669',
                fontSize: isMobile ? '1.25rem' : '1.5rem' // 20px vs 24px
              }}
            >
              {isMobile ? '🍌 Controle de Produção' : '🍌 Controle de Produção - Banana'}
            </Title>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <div style={{
              display: 'flex',
              gap: isMobile ? '8px' : '12px',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              flexWrap: 'wrap'
            }}>
              <PrimaryButton
                icon={<PlusOutlined />}
                onClick={handleRegistrarFita}
                size={isMobile ? 'small' : 'middle'}
                style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
              >
                {isMobile ? 'Marcar' : 'Marcar Fita'}
              </PrimaryButton>
              <PrimaryButton
                icon={<SettingOutlined />}
                onClick={handleGerenciarFitas}
                size={isMobile ? 'small' : 'middle'}
                style={{
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
              >
                {isMobile ? 'Gerenciar' : 'Gerenciar Fitas'}
              </PrimaryButton>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Cards de Estatísticas */}
      {dashboardData && (
        <StatusCardsBanana stats={dashboardData.estatisticas} />
      )}

      {/* Área principal dividida */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} className="main-content">
        {/* Coluna do Mapa (70% desktop, 100% mobile) */}
        <Col xs={24} lg={17}>
          <MapaBanana dashboardData={dashboardData} />
        </Col>

        {/* Coluna da Listagem (30% desktop, 100% mobile) */}
        <Col xs={24} lg={7}>
          <Card
            title={
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                paddingRight: isMobile ? '4px' : '8px'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  {modoExibicao === 'fitas' ? 'Fitas Cadastradas' : 'Áreas com Fitas'}
                </span>
                <Button
                  type="text"
                  icon={<SwapOutlined />}
                  onClick={toggleModoExibicao}
                  className="toggle-button"
                  size={isMobile ? 'small' : 'middle'}
                  style={{
                    color: '#059669',
                    border: '0.0625rem solid #059669',
                    borderRadius: '0.375rem',
                    padding: isMobile ? '2px 6px' : '4px 8px',
                    height: 'auto',
                    fontSize: isMobile ? '0.6875rem' : '0.75rem',
                    fontWeight: '500',
                    marginLeft: isMobile ? '8px' : '12px',
                    flexShrink: 0
                  }}
                  title={`Alternar para ${modoExibicao === 'fitas' ? 'Áreas' : 'Fitas'}`}
                >
                  {modoExibicao === 'fitas' ? 'Ver Áreas' : 'Ver Fitas'}
                </Button>
              </div>
            }
            className="listagem-card"
            style={{ height: isMobile ? '400px' : '600px' }}
          >
            <div className="listagem-container">
              {modoExibicao === 'fitas' ? (
                // Modo Fitas
                listagemFitas.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '24px 0' : '40px 0',
                    color: '#666'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      marginBottom: isMobile ? '8px' : '16px'
                    }}>📝</div>
                    <div style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      Nenhuma fita cadastrada
                    </div>
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
                          borderRadius: '0.5rem',
                          padding: isMobile ? '6px' : '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                          e.currentTarget.style.boxShadow = '0 0.125rem 0.5rem rgba(0,0,0,0.1)';
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
                            style={{
                              backgroundColor: fita.corHex,
                              width: isMobile ? '20px' : '24px',
                              height: isMobile ? '20px' : '24px'
                            }}
                          />
                          <div className="fita-detalhes">
                            <div className="fita-nome" style={{
                              fontSize: isMobile ? '0.8125rem' : '0.875rem'
                            }}>
                              {fita.nome}
                            </div>
                            <div className="fita-stats" style={{
                              fontSize: isMobile ? '0.6875rem' : '0.75rem'
                            }}>
                              {fita.quantidadeFitas || 0} fitas totais
                            </div>
                            {fita.tempoDesdeData && (
                              <Tooltip title={fita.tempoDesdeData.explicacao} placement="top">
                                <div className="fita-tempo" style={{
                                  fontSize: isMobile ? '0.6875rem' : '0.75rem',
                                  color: '#059669',
                                  marginTop: '2px',
                                  fontWeight: '500',
                                  cursor: 'help'
                                }}>
                                  {fita.tempoDesdeData.semanas > 0
                                    ? `${fita.tempoDesdeData.semanas} semana${fita.tempoDesdeData.semanas !== 1 ? 's' : ''}`
                                    : `${fita.tempoDesdeData.dias} dia${fita.tempoDesdeData.dias !== 1 ? 's' : ''}`
                                  }
                                </div>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Modo Áreas
                listagemAreas.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '24px 0' : '40px 0',
                    color: '#666'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      marginBottom: isMobile ? '8px' : '16px'
                    }}>🗺️</div>
                    <div style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      Nenhuma área com fitas
                    </div>
                  </div>
                ) : (
                  <div className="fitas-lista">
                    {listagemAreas.map((area) => (
                      <div
                        key={area.id}
                        className="fita-item"
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: '0.5rem',
                          padding: isMobile ? '6px' : '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                          e.currentTarget.style.boxShadow = '0 0.125rem 0.5rem rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => abrirModalDetalhamento('area', area.id, area.nome)}
                      >
                        <div className="fita-info">
                          <div
                            className="fita-cor"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              color: 'white',
                              fontWeight: 'bold',
                              width: isMobile ? '20px' : '24px',
                              height: isMobile ? '20px' : '24px'
                            }}
                          >
                            <img
                              src="/icons/icon_maps.png"
                              alt="Área"
                              style={{
                                width: isMobile ? '16px' : '20px',
                                height: isMobile ? '16px' : '20px'
                              }}
                            />
                          </div>
                          <div className="fita-detalhes">
                            <div className="fita-nome" style={{
                              fontSize: isMobile ? '0.8125rem' : '0.875rem'
                            }}>
                              {area.nome}
                            </div>
                            <div className="fita-stats" style={{
                              fontSize: isMobile ? '0.6875rem' : '0.75rem'
                            }}>
                              {area.totalFitas || 0} fitas totais
                            </div>
                            <div style={{
                              fontSize: isMobile ? '0.6875rem' : '0.75rem',
                              color: '#666',
                              marginTop: '2px'
                            }}>
                              {area.areaTotal} ha • {area.totalRegistros} registros
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Calendário de Colheita */}
      <CalendarioColheitaBanana dashboardData={dashboardData} />

      {/* Modais */}
      <RegistrarFitaModal
        visible={registrarModalVisible}
        onCancel={() => setRegistrarModalVisible(false)}
        onSuccess={handleModalSuccess}
      />

      <GerenciarFitasModal
        visible={gerenciarModalVisible}
        onCancel={() => setGerenciarModalVisible(false)}
        onSuccess={handleModalSuccess}
        onLoadingChange={handleModalLoading}
      />

      {/* Modal de Detalhamento */}
      <DetalhamentoModal
        visible={modalDetalhamento.visible}
        onClose={fecharModalDetalhamento}
        tipo={modalDetalhamento.tipo}
        itemId={modalDetalhamento.itemId}
        itemNome={modalDetalhamento.itemNome}
        areas={dashboardData?.areasComFitas || []}
        onSuccess={handleModalSuccess}
      />

      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />
    </div>
  );
};

export default ControleBanana;