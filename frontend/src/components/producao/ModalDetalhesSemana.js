import React from 'react';
import { Modal, Card, Typography, Row, Col, Badge, Space, Button, Tooltip } from 'antd';
import { CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatarData, obterNumeroSemana, calcularDiferencaSemanas, calcularDiferencaDias } from '../../utils/dateUtils';

const { Text, Title } = Typography;

const ModalDetalhesSemana = ({ 
  visible, 
  onClose, 
  semana, 
  dados = [] 
}) => {
  if (!semana) return null;

  // Cores para os diferentes status
  const coresStatus = {
    maturacao: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    colheita: { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
    alerta: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
    vencido: { bg: '#fecaca', border: '#dc2626', text: '#991b1b' }
  };

  const iconesStatus = {
    maturacao: '🌱',
    colheita: '🍌',
    alerta: '⚠️',
    vencido: '🚨'
  };

  const formatarDataCadastro = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calcularTempoDesdeCadastro = (dataRegistro, dataSemana) => {
    const dias = calcularDiferencaDias(dataRegistro, dataSemana);
    const semanas = calcularDiferencaSemanas(dataRegistro, dataSemana);

    return {
      dias: Math.max(0, dias),
      semanas: Math.max(0, semanas)
    };
  };

  const calcularPrevisaoColheita = (dataRegistro) => {
    // Período ideal de colheita: 100-115 dias (usando 107 dias como média)
    const dataPrevisao = new Date(dataRegistro);
    dataPrevisao.setDate(dataPrevisao.getDate() + 107);

    const semanaColheita = obterNumeroSemana(dataPrevisao);
    const anoColheita = dataPrevisao.getFullYear();

    return {
      semana: semanaColheita,
      ano: anoColheita,
      data: dataPrevisao
    };
  };

  const calcularInicioSemanaColheita = (dataRegistro, anoColheita, semanaColheita) => {
    // Calcular a data de início da semana de colheita prevista
    const primeiroDiaAno = new Date(anoColheita, 0, 1);

    // Ajustar para começar na segunda-feira (mesmo cálculo do calendário)
    const diaSemana = primeiroDiaAno.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    const primeiroDiaSemana = new Date(primeiroDiaAno);
    primeiroDiaSemana.setDate(primeiroDiaAno.getDate() + diasParaSegunda);

    // Adicionar semanas para chegar na semana desejada
    const inicioSemanaDesejada = new Date(primeiroDiaSemana);
    inicioSemanaDesejada.setDate(primeiroDiaSemana.getDate() + ((semanaColheita - 1) * 7));

    return inicioSemanaDesejada;
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
          <CalendarOutlined style={{ marginRight: 8 }} />
          Detalhes da Semana {semana.numero}
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
    >
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
                  {formatarData(semana.inicio)}
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
                  {formatarData(semana.fim)}
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
                    {dados
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
                count={dados.length}
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
              height: "400px",
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
              <div style={{ flex: "2.5 1 0", minWidth: "0", textAlign: "left" }}>
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
                <strong>Prev. Colheita</strong>
              </div>
              <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                <strong>Tempo</strong>
              </div>
            </div>

            {/* Lista de fitas */}
            {dados.map((item, index) => {
              const tempoDesdeCadastro = calcularTempoDesdeCadastro(item.dataRegistro, semana.fim);
              const tempoTexto = tempoDesdeCadastro.semanas > 0
                ? `${tempoDesdeCadastro.semanas} semana${tempoDesdeCadastro.semanas !== 1 ? 's' : ''}`
                : `${tempoDesdeCadastro.dias} dia${tempoDesdeCadastro.dias !== 1 ? 's' : ''}`;

              const previsaoColheita = calcularPrevisaoColheita(item.dataRegistro);
              const exibirAno = previsaoColheita.ano !== new Date().getFullYear();

              // Calcular data de início da semana de colheita prevista
              const inicioSemanaColheita = calcularInicioSemanaColheita(
                item.dataRegistro,
                previsaoColheita.ano,
                previsaoColheita.semana
              );

              // Verificar se a semana atual está atrasada em relação à previsão
              const semanaAtual = semana.numero;
              const anoAtual = semana.inicio.getFullYear();
              const semanaPrevisao = previsaoColheita.semana;
              const anoPrevisao = previsaoColheita.ano;

              // Considerar diferentes anos na comparação
              const semanaAtualAbsoluta = anoAtual * 52 + semanaAtual;
              const semanaPrevisaoAbsoluta = anoPrevisao * 52 + semanaPrevisao;
              const estaAtrasada = semanaAtualAbsoluta > semanaPrevisaoAbsoluta;

              // Calcular dias desde o registro até hoje (para exibição)
              const hoje = new Date();
              const dataRegistro = new Date(item.dataRegistro);

              // Normalizar datas para evitar problemas de fuso horário
              const dataRegistroNormalizada = new Date(dataRegistro.getFullYear(), dataRegistro.getMonth(), dataRegistro.getDate());
              const hojeNormalizada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

              const diasDesdeRegistro = Math.ceil((hojeNormalizada - dataRegistroNormalizada) / (1000 * 60 * 60 * 24));

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
                    <div style={{ flex: "2.5 1 0", minWidth: "0", textAlign: "left" }}>
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
                            Marcado: {formatarDataCadastro(item.dataRegistro)} | Semana {obterNumeroSemana(item.dataRegistro)}
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
                      {item.status === 'colheita' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <Tooltip title={`Status calculado com base na semana ${semana.numero}, que é a semana que você selecionou para abertura dessa janela`}>
                            <div style={{
                              padding: '4px 8px',
                              backgroundColor: coresStatus[item.status].bg,
                              border: `1px solid ${coresStatus[item.status].border}`,
                              borderRadius: '4px',
                              display: 'inline-block',
                              cursor: 'help'
                            }}>
                              <Text style={{
                                fontSize: '11px',
                                color: coresStatus[item.status].text,
                                fontWeight: '500'
                              }}>
                                {iconesStatus[item.status]} Colheita
                              </Text>
                            </div>
                          </Tooltip>
                          <Tooltip title="Dias desde a marcação até a data atual">
                            <Text style={{
                              fontSize: '12px',
                              color: '#059669',
                              fontWeight: '500',
                              cursor: 'help'
                            }}>
                              {diasDesdeRegistro} dias hoje
                            </Text>
                          </Tooltip>
                        </div>
                      ) : (
                        <Tooltip title={`Status calculado com base na semana ${semana.numero}, que é a semana que você selecionou para abertura dessa janela`}>
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: coresStatus[item.status].bg,
                            border: `1px solid ${coresStatus[item.status].border}`,
                            borderRadius: '4px',
                            display: 'inline-block',
                            cursor: 'help'
                          }}>
                            <Text style={{
                              fontSize: '11px',
                              color: coresStatus[item.status].text,
                              fontWeight: '500'
                            }}>
                              {iconesStatus[item.status]} {item.status === 'maturacao' && 'Maturação'}
                              {item.status === 'alerta' && 'Alerta'}
                              {item.status === 'vencido' && 'Risco'}
                            </Text>
                          </div>
                        </Tooltip>
                      )}
                    </div>

                    {/* Previsão de Colheita */}
                    <div style={{ flex: "1 1 0", minWidth: "0", textAlign: "center" }}>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Text strong style={{
                          fontSize: '14px',
                          color: estaAtrasada ? '#dc2626' : '#059669'
                        }}>
                          Sem {previsaoColheita.semana}
                          {exibirAno && (
                            <span style={{
                              fontSize: '10px',
                              color: estaAtrasada ? '#dc2626' : '#666',
                              marginLeft: '4px'
                            }}>
                              {previsaoColheita.ano}
                            </span>
                          )}
                        </Text>
                        <Text style={{
                          fontSize: '11px',
                          color: estaAtrasada ? '#dc2626' : '#666',
                          opacity: 0.8
                        }}>
                          {inicioSemanaColheita.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </Text>
                        {estaAtrasada && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-12px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: '600',
                            padding: '2px 4px',
                            borderRadius: '8px',
                            lineHeight: '1',
                            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                          }}>
                            ATRASO
                          </div>
                        )}
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
            onClick={onClose}
            size="large"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDetalhesSemana;
