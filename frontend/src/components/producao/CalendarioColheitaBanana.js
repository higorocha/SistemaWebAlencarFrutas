import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Row, Col, Tooltip, Badge, Spin, Alert, Button, Modal } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTheme } from '@mui/material/styles';
import axiosInstance from '../../api/axiosConfig';
import './CalendarioColheitaBanana.css';

const { Text, Title } = Typography;

const CalendarioColheitaBanana = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [dadosColheita, setDadosColheita] = useState([]);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [modalSemana, setModalSemana] = useState({
    visible: false,
    dados: [],
    semana: null
  });

  // Cores melhoradas para os diferentes status
  const coresStatus = {
    maturacao: '#f0f9ff', // Azul muito claro - ainda em maturação
    colheita: '#f0fdf4', // Verde muito claro - período ideal de colheita
    alerta: '#fefce8', // Amarelo claro - período de alerta
    vencido: '#fef2f2' // Vermelho muito claro - fruta pode apodrecer
  };

  const coresBorda = {
    maturacao: '#0ea5e9', // Azul mais vibrante
    colheita: '#22c55e', // Verde mais vibrante
    alerta: '#eab308', // Amarelo mais vibrante
    vencido: '#ef4444' // Vermelho mais vibrante
  };

  const coresTexto = {
    maturacao: '#0369a1', // Azul escuro
    colheita: '#15803d', // Verde escuro
    alerta: '#a16207', // Amarelo escuro
    vencido: '#dc2626' // Vermelho escuro
  };

  // Função para verificar se deve mostrar a previsão (filtro de 120 dias para datas futuras)
  const deveMostrarPrevisao = (dataRegistro, dataSemana) => {
    const hoje = new Date();
    const dataReg = new Date(dataRegistro);
    const dataSem = new Date(dataSemana);
    
    // Até a data atual, sempre continue calculando, mesmo que ultrapasse 120 dias
    if (dataSem <= hoje) {
      return true;
    }
    
    // Para datas futuras, só mostrar até 120 dias da data atual
    const diasDesdeHoje = Math.floor((dataSem.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasDesdeHoje <= 120;
  };

  const calcularTempoDesdeCadastro = (dataRegistro, dataSemana) => {
    const dataInicio = new Date(dataRegistro);
    const dataFim = new Date(dataSemana);
    
    // Calcular diferença em dias
    const diferencaMs = dataFim.getTime() - dataInicio.getTime();
    const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(dias / 7);
    
    // Se dias for negativo, retornar 0 semanas
    const semanasCorrigidas = Math.max(0, semanas);
    
    return { dias, semanas: semanasCorrigidas };
  };

  useEffect(() => {
    carregarDadosColheita();
  }, [anoAtual]);

  const carregarDadosColheita = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/controle-banana/dashboard');
      const controlesBanana = response.data.areasComFitas.flatMap(area => 
        area.controlesBanana || []
      );
      
      // Processar dados para calcular previsões de colheita
      const previsoes = processarPrevisoesColheita(controlesBanana);
      setDadosColheita(previsoes);
    } catch (error) {
      console.error('Erro ao carregar dados de colheita:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarPrevisoesColheita = (controles) => {
    const previsoes = [];
    
    controles.forEach(controle => {
      if (controle.quantidadeFitas > 0) {
        const dataRegistro = new Date(controle.dataRegistro);
        
        // Criar apenas uma previsão por controle, que será exibida em todas as semanas
        // O status será calculado dinamicamente baseado na data da semana
        previsoes.push({
          id: controle.id,
          fitaId: controle.fitaBananaId,
          fitaNome: controle.fitaBanana?.nome || 'Fita',
          fitaCor: controle.fitaBanana?.corHex || '#000000',
          quantidade: controle.quantidadeFitas,
          dataRegistro: dataRegistro,
          dataInicio: dataRegistro,
          dataFim: new Date(dataRegistro.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 ano para cobrir todas as semanas
          status: 'ativo', // Status será calculado dinamicamente
          areaNome: controle.areaAgricola?.nome || 'Área'
        });
      }
    });
    
    return previsoes;
  };

  // Gerar semanas do ano
  const semanasDoAno = useMemo(() => {
    const semanas = [];
    const primeiroDiaAno = new Date(anoAtual, 0, 1);
    const ultimoDiaAno = new Date(anoAtual, 11, 31);
    
    // Ajustar para começar na segunda-feira
    const primeiroDiaSemana = new Date(primeiroDiaAno);
    const diaSemana = primeiroDiaAno.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    primeiroDiaSemana.setDate(primeiroDiaSemana.getDate() + diasParaSegunda);
    
    let dataAtual = new Date(primeiroDiaSemana);
    let numeroSemana = 1;
    
    while (dataAtual <= ultimoDiaAno) {
      const fimSemana = new Date(dataAtual);
      fimSemana.setDate(fimSemana.getDate() + 6);
      
      semanas.push({
        numero: numeroSemana,
        inicio: new Date(dataAtual),
        fim: fimSemana,
        dados: []
      });
      
      dataAtual.setDate(dataAtual.getDate() + 7);
      numeroSemana++;
    }
    
    return semanas;
  }, [anoAtual]);

  // Associar dados de colheita às semanas
  const semanasComDados = useMemo(() => {
    return semanasDoAno.map(semana => {
      const dadosSemana = dadosColheita.filter(previsao => {
        const inicioSemana = semana.inicio;
        const fimSemana = semana.fim;
        
        // Verificar se a previsão se sobrepõe com a semana
        const sobrepoe = (previsao.dataInicio <= fimSemana && previsao.dataFim >= inicioSemana);
        
        // Aplicar filtro de 120 dias para datas futuras
        const deveMostrar = deveMostrarPrevisao(previsao.dataRegistro, fimSemana);
        
        return sobrepoe && deveMostrar;
      }).map(previsao => {
        // Calcular status dinamicamente baseado na data da semana
        const diasDesdeRegistro = Math.floor((semana.fim.getTime() - previsao.dataRegistro.getTime()) / (1000 * 60 * 60 * 24));
        
        let status;
        if (diasDesdeRegistro < 100) {
          status = 'maturacao';
        } else if (diasDesdeRegistro <= 115) {
          status = 'colheita';
        } else if (diasDesdeRegistro <= 120) {
          status = 'alerta';
        } else {
          status = 'vencido';
        }
        
        return {
          ...previsao,
          status: status
        };
      });
      
      return {
        ...semana,
        dados: dadosSemana
      };
    });
  }, [semanasDoAno, dadosColheita]);

  const obterCorSemana = (dados) => {
    if (dados.length === 0) return { background: '#fafafa', border: '#d9d9d9' };
    
    const statusPrioridade = { vencido: 4, alerta: 3, colheita: 2, maturacao: 1 };
    const statusSemana = dados.reduce((prev, atual) => 
      statusPrioridade[atual.status] > statusPrioridade[prev.status] ? atual : prev
    );
    
    return {
      background: coresStatus[statusSemana.status],
      border: coresBorda[statusSemana.status]
    };
  };

  const formatarData = (data) => {
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const navegarAno = (direcao) => {
    if (direcao === 'anterior') {
      setAnoAtual(prev => prev - 1);
    } else {
      setAnoAtual(prev => prev + 1);
    }
  };

  const irParaAnoAtual = () => {
    setAnoAtual(new Date().getFullYear());
  };

  const abrirModalSemana = (semana) => {
    if (semana.dados.length > 0) {
      setModalSemana({
        visible: true,
        dados: semana.dados,
        semana: semana
      });
    }
  };

  const fecharModalSemana = () => {
    setModalSemana({
      visible: false,
      dados: [],
      semana: null
    });
  };

  const formatarDataCadastro = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const obterTooltipContent = (dados, dataSemana) => {
    if (dados.length === 0) return 'Sem previsões para esta semana';
    
    return (
      <div style={{ 
        backgroundColor: '#ffffff', 
        color: '#333333',
        padding: '8px',
        borderRadius: '6px',
        maxWidth: '280px'
      }}>
        <div style={{ 
          fontWeight: '600', 
          marginBottom: '8px', 
          color: '#059669',
          fontSize: '13px'
        }}>
          Previsões da Semana
        </div>
        {dados.map((item, index) => {
          const tempoDesdeCadastro = calcularTempoDesdeCadastro(item.dataRegistro, dataSemana);
          const tempoTexto = tempoDesdeCadastro.semanas > 0 
            ? `${tempoDesdeCadastro.semanas} semana${tempoDesdeCadastro.semanas !== 1 ? 's' : ''}`
            : `${tempoDesdeCadastro.dias} dia${tempoDesdeCadastro.dias !== 1 ? 's' : ''}`;
          
          return (
            <div key={index} style={{ 
              marginBottom: '6px', 
              padding: '10px 12px',
              backgroundColor: coresStatus[item.status],
              border: `1px solid ${coresBorda[item.status]}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '40px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1' }}>
                <div style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: item.fitaCor, 
                  borderRadius: '50%', 
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  flexShrink: 0
                }} />
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '13px',
                    color: coresTexto[item.status],
                    lineHeight: '1.2'
                  }}>
                    {item.fitaNome}
                  </div>
                  <div style={{ 
                    fontSize: '10px',
                    color: coresTexto[item.status],
                    opacity: 0.8,
                    marginTop: '2px'
                  }}>
                    {formatarDataCadastro(item.dataRegistro)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontWeight: '700',
                    fontSize: '14px',
                    color: coresTexto[item.status],
                    lineHeight: '1.2'
                  }}>
                    {item.quantidade}
                  </div>
                  <div style={{ 
                    fontSize: '10px',
                    color: coresTexto[item.status],
                    opacity: 0.8
                  }}>
                    fitas
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontWeight: '600',
                    fontSize: '12px',
                    color: coresTexto[item.status],
                    lineHeight: '1.2'
                  }}>
                    {tempoTexto}
                  </div>
                  <div style={{ 
                    fontSize: '10px',
                    color: coresTexto[item.status],
                    opacity: 0.8
                  }}>
                    desde cadastro
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarOutlined style={{ color: '#059669', fontSize: '20px' }} />
            <span>Calendário de Colheita</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              icon={<LeftOutlined />}
              onClick={() => navegarAno('anterior')}
              size="small"
              style={{ 
                backgroundColor: '#f8f9fa',
                borderColor: '#dee2e6',
                color: '#495057'
              }}
            />
            <Button
              onClick={irParaAnoAtual}
              size="small"
              style={{ 
                backgroundColor: anoAtual === new Date().getFullYear() ? '#059669' : '#f8f9fa',
                borderColor: anoAtual === new Date().getFullYear() ? '#059669' : '#dee2e6',
                color: anoAtual === new Date().getFullYear() ? '#ffffff' : '#495057',
                fontWeight: '600',
                minWidth: '60px'
              }}
            >
              {anoAtual}
            </Button>
            <Button
              icon={<RightOutlined />}
              onClick={() => navegarAno('proximo')}
              size="small"
              style={{ 
                backgroundColor: '#f8f9fa',
                borderColor: '#dee2e6',
                color: '#495057'
              }}
            />
          </div>
        </div>
      }
      style={{ marginTop: '24px' }}
      headStyle={{
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #e9ecef',
        borderRadius: '8px 8px 0 0'
      }}
    >
      {/* Legenda */}
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <Title level={5} style={{ margin: '0 0 12px 0' }}>Legenda:</Title>
        <Row gutter={[16, 8]}>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: coresStatus.maturacao, 
                border: `2px solid ${coresBorda.maturacao}`,
                borderRadius: '4px'
              }} />
              <Text style={{ color: coresTexto.maturacao, fontWeight: '500' }}>
                🌱 Maturação (0-99 dias)
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: coresStatus.colheita, 
                border: `2px solid ${coresBorda.colheita}`,
                borderRadius: '4px'
              }} />
              <Text style={{ color: coresTexto.colheita, fontWeight: '500' }}>
                🍌 Colheita (100-115 dias)
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: coresStatus.alerta, 
                border: `2px solid ${coresBorda.alerta}`,
                borderRadius: '4px'
              }} />
              <Text style={{ color: coresTexto.alerta, fontWeight: '500' }}>
                ⚠️ Alerta (116-120 dias)
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: coresStatus.vencido, 
                border: `2px solid ${coresBorda.vencido}`,
                borderRadius: '4px'
              }} />
              <Text style={{ color: coresTexto.vencido, fontWeight: '500' }}>
                🚨 Risco (+120 dias)
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Calendário de Semanas */}
      <div style={{ position: 'relative' }}>
        {/* Overlay de Loading */}
        {loading && (
          <div 
            className="loading-overlay"
            style={{
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
              gap: '16px',
              backgroundColor: '#ffffff',
              padding: '24px 32px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <Spin size="large" />
              <div style={{
                color: '#059669',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Carregando previsões para {anoAtual}...
              </div>
            </div>
          </div>
        )}

        <div className="calendario-semanas">
          {semanasComDados.map((semana, index) => {
            const corSemana = obterCorSemana(semana.dados);
            const temDados = semana.dados.length > 0;
            
            return (
              <Tooltip
                key={index}
                title={obterTooltipContent(semana.dados, semana.fim)}
                placement="top"
              >
                <div
                  className={`semana-item ${temDados ? 'com-dados' : 'sem-dados'}`}
                  style={{
                    backgroundColor: corSemana.background,
                    borderColor: corSemana.border,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    cursor: temDados ? 'pointer' : 'default',
                    opacity: loading ? 0.6 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                  onClick={() => temDados && abrirModalSemana(semana)}
                >
                  <div className="semana-numero">
                    {semana.numero}
                  </div>
                  <div className="semana-datas">
                    {formatarData(semana.inicio)} - {formatarData(semana.fim)}
                  </div>
                  {temDados && (
                    <div className="semana-indicador">
                      <Badge count={semana.dados.length} size="small" />
                    </div>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Informações adicionais */}
      <Alert
        message="Informações sobre o Calendário"
        description={
          <div>
            <p>• Cada semana mostra as previsões de colheita baseadas nas fitas cadastradas</p>
            <p>• As cores indicam o status de maturação das bananas</p>
            <p>• Passe o mouse sobre as semanas para ver detalhes</p>
            <p>• O cálculo é baseado em 100-115 dias após o cadastro da fita</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: '20px' }}
      />
      </Card>

      {/* Modal de Detalhes da Semana */}
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
            <CalendarOutlined style={{ marginRight: 8 }} />
            Detalhes da Semana {modalSemana.semana?.numero}
          </span>
        }
        open={modalSemana.visible}
        onCancel={fecharModalSemana}
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
      >
        {modalSemana.semana && (
          <div>
            {/* Resumo da Semana */}
            <Card
              title={
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px",
                  color: "#ffffff"
                }}>
                  <CalendarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo da Semana</span>
                </div>
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
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                      {formatarData(modalSemana.semana.inicio)}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      Data Início
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                      {formatarData(modalSemana.semana.fim)}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      Data Fim
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                    <div>
                      <Text strong style={{ color: '#059669', fontSize: '18px' }}>
                        {modalSemana.dados
                          .filter(item => ['colheita', 'alerta', 'vencido'].includes(item.status))
                          .reduce((total, item) => total + item.quantidade, 0)
                        }
                      </Text>
                      <Text style={{ color: '#999', fontSize: '12px', fontWeight: '400', marginLeft: '4px' }}>
                        Fitas
                      </Text>
                    </div>
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      Previsão de Colheita
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Lista de Fitas */}
            <Card
              title={
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px",
                  width: "100%",
                  padding: "0 4px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#ffffff" }}>
                    <InfoCircleOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600" }}>
                      Fitas da Semana
                    </span>
                  </div>
                  <Badge
                    count={modalSemana.dados.length}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      color: "#059669",
                      fontWeight: "600",
                    }}
                  />
                </div>
              }
              headStyle={{
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                color: "#ffffff",
                borderRadius: "8px 8px 0 0",
              }}
              bodyStyle={{
                padding: "16px",
                height: "400px",
                overflowY: "auto",
                overflowX: "hidden",
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
                  <div style={{ flex: "2 1 0", minWidth: "0", textAlign: "left" }}>
                    <strong>Fita</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Área</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Quantidade</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Status</strong>
                  </div>
                  <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                    <strong>Tempo</strong>
                  </div>
                </div>

                {/* Lista de fitas */}
                {modalSemana.dados.map((item, index) => {
                  const tempoDesdeCadastro = calcularTempoDesdeCadastro(item.dataRegistro, modalSemana.semana.fim);
                  const tempoTexto = tempoDesdeCadastro.semanas > 0 
                    ? `${tempoDesdeCadastro.semanas} semana${tempoDesdeCadastro.semanas !== 1 ? 's' : ''}`
                    : `${tempoDesdeCadastro.dias} dia${tempoDesdeCadastro.dias !== 1 ? 's' : ''}`;
                  
                  return (
                    <div 
                      key={index}
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
                        <div style={{ flex: "2 1 0", minWidth: "0", textAlign: "left" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div 
                              style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: item.fitaCor,
                                borderRadius: '50%',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <Text strong style={{ color: "#333", fontSize: "14px", display: "block" }}>
                                {item.fitaNome}
                              </Text>
                              <Text style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                📅 {formatarDataCadastro(item.dataRegistro)}
                              </Text>
                            </div>
                          </div>
                        </div>

                        {/* Área */}
                        <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                          <Text style={{ fontSize: '12px', color: '#666' }}>
                            {item.areaNome}
                          </Text>
                        </div>

                        {/* Quantidade */}
                        <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                          <Text strong style={{ 
                            fontSize: '16px', 
                            color: '#059669' 
                          }}>
                            {item.quantidade}
                          </Text>
                          <br />
                          <Text style={{ fontSize: '11px', color: '#666' }}>
                            fitas
                          </Text>
                        </div>

                        {/* Status */}
                        <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: coresStatus[item.status],
                            border: `1px solid ${coresBorda[item.status]}`,
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            <Text style={{ 
                              fontSize: '11px', 
                              color: coresTexto[item.status],
                              fontWeight: '500'
                            }}>
                              {item.status === 'maturacao' && '🌱 Maturação'}
                              {item.status === 'colheita' && '🍌 Colheita'}
                              {item.status === 'alerta' && '⚠️ Alerta'}
                              {item.status === 'vencido' && '🚨 Risco'}
                            </Text>
                          </div>
                        </div>

                        {/* Tempo */}
                        <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                          <Text style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                            {tempoTexto}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                icon={<InfoCircleOutlined />}
                onClick={fecharModalSemana}
                size="large"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CalendarioColheitaBanana;
