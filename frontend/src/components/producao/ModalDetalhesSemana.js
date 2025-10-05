import React from 'react';
import { Modal, Card, Typography, Row, Col, Badge, Space, Button, Tooltip } from 'antd';
import { CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatarData, obterNumeroSemana, calcularDiferencaSemanas, calcularDiferencaDias } from '../../utils/dateUtils';
import useResponsive from '../../hooks/useResponsive';

const { Text, Title } = Typography;

const ModalDetalhesSemana = ({
  visible,
  onClose,
  semana,
  dados = []
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

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
    // Período ideal de colheita: 100-115 dias (usar início do período)
    const dataColheitaInicio = new Date(dataRegistro);
    dataColheitaInicio.setDate(dataColheitaInicio.getDate() + 100);

    const dataColheitaFim = new Date(dataRegistro);
    dataColheitaFim.setDate(dataColheitaFim.getDate() + 115);

    const semanaColheitaInicio = obterNumeroSemana(dataColheitaInicio);
    const semanaColheitaFim = obterNumeroSemana(dataColheitaFim);
    const anoColheita = dataColheitaInicio.getFullYear();

    return {
      semana: semanaColheitaInicio, // Usar início do período para consistência
      semanaFim: semanaColheitaFim,
      ano: anoColheita,
      dataInicio: dataColheitaInicio,
      dataFim: dataColheitaFim
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
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          <CalendarOutlined style={{ marginRight: "0.5rem" }} />
          {isMobile ? `Sem ${semana.numero}` : `Detalhes da Semana ${semana.numero}`}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '95vw' : '90%'}
      style={{ maxWidth: isMobile ? '95vw' : "75rem" }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      <div>
        {/* Resumo da Semana */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Resumo da Semana
              </span>
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
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
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={24} sm={8}>
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '8px' : '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '0.375rem',
                border: '1px solid #e9ecef'
              }}>
                <Text strong style={{
                  color: '#059669',
                  fontSize: isMobile ? '1rem' : '1.125rem'
                }}>
                  {formatarData(semana.inicio)}
                </Text>
                <br />
                <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                  Data Início
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '8px' : '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '0.375rem',
                border: '1px solid #e9ecef'
              }}>
                <Text strong style={{
                  color: '#059669',
                  fontSize: isMobile ? '1rem' : '1.125rem'
                }}>
                  {formatarData(semana.fim)}
                </Text>
                <br />
                <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                  Data Fim
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '8px' : '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '0.375rem',
                border: '1px solid #e9ecef'
              }}>
                <div>
                  <Text strong style={{
                    color: '#059669',
                    fontSize: isMobile ? '1rem' : '1.125rem'
                  }}>
                    {dados
                      .filter(item => ['colheita', 'alerta', 'vencido'].includes(item.status))
                      .reduce((total, item) => total + item.quantidade, 0)
                    }
                  </Text>
                  <Text style={{
                    color: '#999',
                    fontSize: '0.75rem',
                    fontWeight: '400',
                    marginLeft: '4px'
                  }}>
                    Fitas
                  </Text>
                </div>
                <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                  Previsão de Colheita
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Lista de Fitas */}
        <Card
          title={
            <Space style={{ width: "100%" }}>
              <InfoCircleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                {isMobile ? "Fitas" : "Fitas da Semana"}
              </span>
              <Badge
                count={dados.length}
                style={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "#059669",
                  fontWeight: "600",
                }}
              />
            </Space>
          }
          style={{
            marginBottom: isMobile ? 12 : 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
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
              padding: isMobile ? "12px" : "16px",
              height: isMobile ? "60vh" : "400px",
              overflowY: "auto",
              overflowX: "hidden"
            }
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "6px" : "8px",
            width: "100%",
            paddingRight: isMobile ? "0" : "4px"
          }}>
            {/* Cabeçalho da tabela - oculto no mobile */}
            {!isMobile && (
              <div style={{
                padding: "8px 12px",
                backgroundColor: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: "0.25rem",
                marginBottom: "4px",
                fontSize: "0.8125rem",
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
            )}

            {/* Lista de fitas */}
            {dados.map((item, index) => {
              const tempoDesdeCadastro = calcularTempoDesdeCadastro(item.dataRegistro, semana.fim);
              const tempoTexto = tempoDesdeCadastro.semanas > 0
                ? `${tempoDesdeCadastro.semanas} semana${tempoDesdeCadastro.semanas !== 1 ? 's' : ''}`
                : `${tempoDesdeCadastro.dias} dia${tempoDesdeCadastro.dias !== 1 ? 's' : ''}`;

              const previsaoColheita = calcularPrevisaoColheita(item.dataRegistro);
              const exibirAno = previsaoColheita.ano !== new Date().getFullYear();

              // Usar a data de início do período de colheita diretamente
              const inicioSemanaColheita = previsaoColheita.dataInicio;

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
                    padding: isMobile ? "10px" : "12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "0.375rem",
                    marginBottom: isMobile ? "6px" : "4px",
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
                  <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center",
                    gap: isMobile ? "8px" : "0"
                  }}>
                    {/* Fita */}
                    <div style={{
                      flex: isMobile ? "1 1 100%" : "2.5 1 0",
                      minWidth: "0",
                      textAlign: "left",
                      borderBottom: isMobile ? "1px solid #f0f0f0" : "none",
                      paddingBottom: isMobile ? "8px" : "0"
                    }}>
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
                          <Text strong style={{
                            color: "#333",
                            fontSize: isMobile ? "0.875rem" : "0.875rem",
                            display: "block"
                          }}>
                            {item.fitaNome}
                          </Text>
                          <Text style={{
                            fontSize: isMobile ? "0.6875rem" : "0.6875rem",
                            color: '#666',
                            marginTop: '2px'
                          }}>
                            Marcado: {formatarDataCadastro(item.dataRegistro)} | Semana {obterNumeroSemana(item.dataRegistro)}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Área */}
                    <div style={{
                      flex: isMobile ? "1 1 100%" : "1 1 0",
                      minWidth: "0",
                      textAlign: isMobile ? "left" : "center",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "4px" : "0",
                      justifyContent: isMobile ? "flex-start" : "center"
                    }}>
                      {isMobile && (
                        <Text strong style={{ fontSize: "0.75rem", color: "#666" }}>
                          Área:
                        </Text>
                      )}
                      <Text style={{ fontSize: "0.75rem", color: '#666' }}>
                        {item.areaNome}
                      </Text>
                    </div>

                    {/* Quantidade */}
                    <div style={{
                      flex: isMobile ? "1 1 100%" : "1 1 0",
                      minWidth: "0",
                      textAlign: isMobile ? "left" : "center",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "4px" : "0",
                      justifyContent: isMobile ? "flex-start" : "center"
                    }}>
                      {isMobile && (
                        <Text strong style={{ fontSize: "0.75rem", color: "#666" }}>
                          Quantidade:
                        </Text>
                      )}
                      <Text strong style={{
                        fontSize: isMobile ? "0.875rem" : "1rem",
                        color: '#059669'
                      }}>
                        {item.quantidade}
                      </Text>
                      <Text style={{ fontSize: "0.6875rem", color: '#666', marginLeft: "4px" }}>
                        fitas
                      </Text>
                    </div>

                    {/* Status */}
                    <div style={{
                      flex: isMobile ? "1 1 100%" : "1 1 0",
                      minWidth: "0",
                      textAlign: isMobile ? "left" : "center",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "4px" : "0",
                      justifyContent: isMobile ? "flex-start" : "center"
                    }}>
                      {isMobile && (
                        <Text strong style={{ fontSize: "0.75rem", color: "#666" }}>
                          Status:
                        </Text>
                      )}
                      {item.status === 'colheita' ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: isMobile ? "row" : "column",
                          alignItems: 'center',
                          gap: isMobile ? "8px" : "2px"
                        }}>
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
                                fontSize: "0.6875rem",
                                color: coresStatus[item.status].text,
                                fontWeight: '500'
                              }}>
                                {iconesStatus[item.status]} Colheita
                              </Text>
                            </div>
                          </Tooltip>
                          <Tooltip title="Dias desde a marcação até a data atual">
                            <Text style={{
                              fontSize: "0.75rem",
                              color: '#059669',
                              fontWeight: '500',
                              cursor: 'help'
                            }}>
                              {diasDesdeRegistro} dias hoje
                            </Text>
                          </Tooltip>
                        </div>
                      ) : (
                        <Tooltip title={`Status calculado com base na semana ${semana.numero}, que é a semana que você selecionado para abertura dessa janela`}>
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: coresStatus[item.status].bg,
                            border: `1px solid ${coresStatus[item.status].border}`,
                            borderRadius: '4px',
                            display: 'inline-block',
                            cursor: 'help'
                          }}>
                            <Text style={{
                              fontSize: "0.6875rem",
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
                    <div style={{
                      flex: isMobile ? "1 1 100%" : "1 1 0",
                      minWidth: "0",
                      textAlign: isMobile ? "left" : "center",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "4px" : "0",
                      justifyContent: isMobile ? "flex-start" : "center"
                    }}>
                      {isMobile && (
                        <Text strong style={{ fontSize: "0.75rem", color: "#666" }}>
                          Prev. Colheita:
                        </Text>
                      )}
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: '2px'
                      }}>
                        <Text strong style={{
                          fontSize: "0.875rem",
                          color: estaAtrasada ? '#dc2626' : '#059669'
                        }}>
                          {previsaoColheita.semana === previsaoColheita.semanaFim ? (
                            `Sem ${previsaoColheita.semana}`
                          ) : (
                            `Sem ${previsaoColheita.semana}-${previsaoColheita.semanaFim}`
                          )}
                          {exibirAno && (
                            <span style={{
                              fontSize: "0.625rem",
                              color: estaAtrasada ? '#dc2626' : '#666',
                              marginLeft: '4px'
                            }}>
                              {previsaoColheita.ano}
                            </span>
                          )}
                        </Text>
                        <Text style={{
                          fontSize: "0.6875rem",
                          color: estaAtrasada ? '#dc2626' : '#666',
                          opacity: 0.8
                        }}>
                          {previsaoColheita.dataInicio.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                          })} - {previsaoColheita.dataFim.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </Text>
                        {estaAtrasada && (
                          <div style={{
                            position: isMobile ? "static" : "absolute",
                            top: '-8px',
                            right: '-12px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            fontSize: "0.5625rem",
                            fontWeight: '600',
                            padding: '2px 4px',
                            borderRadius: '8px',
                            lineHeight: '1',
                            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                            marginTop: isMobile ? "4px" : "0"
                          }}>
                            ATRASO
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tempo */}
                    <div style={{
                      flex: isMobile ? "1 1 100%" : "1 1 0",
                      minWidth: "0",
                      textAlign: isMobile ? "left" : "center",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "4px" : "0",
                      justifyContent: isMobile ? "flex-start" : "center"
                    }}>
                      {isMobile && (
                        <Text strong style={{ fontSize: "0.75rem", color: "#666" }}>
                          Tempo:
                        </Text>
                      )}
                      <Text style={{ fontSize: "0.75rem", color: '#059669', fontWeight: '500' }}>
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
            gap: isMobile ? "8px" : "12px",
            marginTop: isMobile ? "1rem" : "1.5rem",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? "small" : "middle"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDetalhesSemana;
