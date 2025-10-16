import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Spin, 
  Tag, 
  Divider,
  Row,
  Col,
  Statistic,
  Timeline
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  BellOutlined
} from '@ant-design/icons';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import CentralizedLoader from '../common/loaders/CentralizedLoader';

const { Title, Text, Paragraph } = Typography;

const Certificados = () => {
  const [loading, setLoading] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [status, setStatus] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState(null);

  // Buscar status do monitoramento
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/certificate-monitor/status');
      setStatus(response.data);
    } catch (error) {
      showNotification('error', 'Erro', 'Erro ao buscar status do monitoramento');
    } finally {
      setLoading(false);
    }
  };

  // Verificar certificados manualmente
  const checkCertificates = async (showNotifications = true) => {
    try {
      setCertificateLoading(true);
      const response = await axiosInstance.post('/api/certificate-monitor/check');
      setCertificateStatus(response.data);
      
      // Mostrar resultado da verificação apenas se solicitado
      if (showNotifications) {
        if (response.data.hasExpired) {
          showNotification(
            'error', 
            'Certificados Vencidos', 
            `${response.data.expiredCerts.length} certificado(s) vencido(s) encontrado(s)`
          );
        } else if (response.data.hasExpiringSoon) {
          showNotification(
            'warning', 
            'Certificados Vencendo', 
            `${response.data.expiringSoonCerts.length} certificado(s) vencendo em breve`
          );
        } else {
          showNotification(
            'success', 
            'Certificados OK', 
            'Todos os certificados estão válidos'
          );
        }
      }
    } catch (error) {
      if (showNotifications) {
        showNotification('error', 'Erro', 'Erro ao verificar certificados');
      }
    } finally {
      setCertificateLoading(false);
    }
  };

  // Simular cron job (executa exatamente o que o cron faz)
  const simulateCronJob = async () => {
    try {
      setTestingNotification(true);
      
      // Executa exatamente o que o cron job faz
      const response = await axiosInstance.post('/api/certificate-monitor/simulate-cron');
      setCertificateStatus(response.data);
      
      // Sem alertas - executa silenciosamente como o cron job real
      
    } catch (error) {
      showNotification('error', 'Erro', 'Erro ao simular cron job');
    } finally {
      setTestingNotification(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    checkCertificates(false); // Carregar status dos certificados automaticamente (sem notificações)
  }, []);

  const getStatusColor = (hasExpired, hasExpiringSoon) => {
    if (hasExpired) return 'error';
    if (hasExpiringSoon) return 'warning';
    return 'success';
  };

  const getStatusIcon = (hasExpired, hasExpiringSoon) => {
    if (hasExpired) return <CloseCircleOutlined />;
    if (hasExpiringSoon) return <ExclamationCircleOutlined />;
    return <CheckCircleOutlined />;
  };

  const getStatusText = (hasExpired, hasExpiringSoon) => {
    if (hasExpired) return 'Certificados Vencidos';
    if (hasExpiringSoon) return 'Certificados Vencendo';
    return 'Todos Válidos';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ color: '#059669', marginBottom: '24px' }}>
        <SafetyCertificateOutlined style={{ marginRight: '8px' }} />
        Monitoramento de Certificados
      </Title>

      {/* Status do Monitoramento */}
      <Card title="Status do Monitoramento" style={{ marginBottom: '24px' }}>
        {loading ? (
          <CentralizedLoader 
            visible={true} 
            message="Carregando status do monitoramento..." 
            size="large"
          />
        ) : status ? (
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="Status"
                value={status.isActive ? 'Ativo' : 'Inativo'}
                prefix={status.isActive ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: status.isActive ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Próxima Verificação"
                value={status.nextCheck}
                prefix={<BellOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Fuso Horário"
                value={status.timeZone}
              />
            </Col>
          </Row>
        ) : (
          <Alert message="Erro ao carregar status" type="error" />
        )}
      </Card>

      {/* Status dos Certificados */}
      <Card 
        title="Status dos Certificados" 
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => checkCertificates(true)}
              loading={certificateLoading}
            >
              Verificar Agora
            </Button>
            <Button 
              type="primary"
              icon={<BellOutlined />} 
              onClick={simulateCronJob}
              loading={testingNotification}
            >
              Simular Cron Job
            </Button>
          </Space>
        }
      >
        {certificateStatus ? (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Statistic
                  title="Status Geral"
                  value={getStatusText(certificateStatus.hasExpired, certificateStatus.hasExpiringSoon)}
                  prefix={getStatusIcon(certificateStatus.hasExpired, certificateStatus.hasExpiringSoon)}
                  valueStyle={{ 
                    color: getStatusColor(certificateStatus.hasExpired, certificateStatus.hasExpiringSoon) === 'error' ? '#ff4d4f' :
                           getStatusColor(certificateStatus.hasExpired, certificateStatus.hasExpiringSoon) === 'warning' ? '#faad14' : '#52c41a'
                  }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Vencidos"
                  value={certificateStatus.expiredCerts?.length || 0}
                  valueStyle={{ color: certificateStatus.expiredCerts?.length > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Vencendo em Breve"
                  value={certificateStatus.expiringSoonCerts?.length || 0}
                  valueStyle={{ color: certificateStatus.expiringSoonCerts?.length > 0 ? '#faad14' : '#52c41a' }}
                />
              </Col>
            </Row>

            <Divider />

            {/* Detalhes dos Certificados */}
            <Timeline>
              {certificateStatus.expiredCerts?.length > 0 && (
                <Timeline.Item color="red" dot={<CloseCircleOutlined />}>
                  <div>
                    <Text strong style={{ color: '#ff4d4f' }}>Certificados Vencidos:</Text>
                    <ul style={{ marginTop: '8px' }}>
                      {certificateStatus.expiredCerts.map((cert, index) => (
                        <li key={index}>
                          <Text code>{cert}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Timeline.Item>
              )}

              {certificateStatus.expiringSoonCerts?.length > 0 && (
                <Timeline.Item color="orange" dot={<ExclamationCircleOutlined />}>
                  <div>
                    <Text strong style={{ color: '#faad14' }}>Certificados Vencendo em Breve:</Text>
                    <ul style={{ marginTop: '8px' }}>
                      {certificateStatus.expiringSoonCerts.map((cert, index) => (
                        <li key={index}>
                          <Text code>{cert}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Timeline.Item>
              )}

              {(!certificateStatus.hasExpired && !certificateStatus.hasExpiringSoon) && (
                <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                  <Text strong style={{ color: '#52c41a' }}>
                    Todos os certificados estão válidos e dentro do prazo!
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        ) : certificateLoading ? (
          <CentralizedLoader 
            visible={true} 
            message="Verificando certificados..." 
            size="large"
          />
        ) : (
          <Alert 
            message="Nenhuma verificação realizada" 
            description="Clique em 'Verificar Agora' para verificar o status dos certificados."
            type="info" 
            showIcon 
          />
        )}
      </Card>

      {/* Informações Adicionais */}
      <Card title="Informações">
        <Paragraph>
          <Text strong>Monitoramento Automático:</Text> O sistema verifica automaticamente os certificados 
          todos os dias às 06:00 (horário de Brasília) e envia notificações quando necessário.
        </Paragraph>
        <Paragraph>
          <Text strong>Verificação Manual:</Text> Use o botão "Verificar Agora" para executar uma 
          verificação imediata dos certificados.
        </Paragraph>
        <Paragraph>
          <Text strong>Simulação do Cron Job:</Text> Use o botão "Simular Cron Job" para executar 
          exatamente o mesmo processo que o cron job diário executa, incluindo o envio das notificações 
          reais para o sistema. Isso permite testar o layout e comportamento das notificações.
        </Paragraph>
      </Card>
    </div>
  );
};

export default Certificados;
