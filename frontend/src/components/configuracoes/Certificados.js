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
  Timeline,
  Table,
  Modal,
  Collapse
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  CodeOutlined,
  ToolOutlined
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
  const [tutorialModalVisible, setTutorialModalVisible] = useState(false);

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

  // Conteúdo do tutorial
  const tutorialContent = [
    {
      key: '1',
      label: '1. Ferramenta usada',
      children: (
        <div>
          <Paragraph>
            Usamos o <Text code>KeyStore Explorer</Text> (interface gráfica). Ele permite abrir um arquivo .pfx e exportar certificado, chave e cadeia em formatos PEM/DER.
          </Paragraph>
        </div>
      ),
    },
    {
      key: '2',
      label: '2. Abrir o arquivo PFX',
      children: (
        <div>
          <Paragraph>
            Abra o KeyStore Explorer → <Text strong>File → Open</Text> e selecione seu .pfx.
          </Paragraph>
          <Paragraph>
            Informe a senha do PFX quando solicitada.
          </Paragraph>
          <Paragraph>
            Você verá o item correspondente ao par certificado + chave na lista.
          </Paragraph>
        </div>
      ),
    },
    {
      key: '3',
      label: '3. Exportar o certificado público (final.cer)',
      children: (
        <div>
          <Paragraph>
            Clique com o botão direito no certificado → <Text strong>Export → Export Certificate Chain</Text>.
          </Paragraph>
          <Paragraph>
            Na janela de exportação, selecione:
          </Paragraph>
          <ul>
            <li><Text code>Export Length: Head Only</Text></li>
            <li><Text code>Export Format: X.509</Text></li>
            <li>Marque <Text code>PEM</Text></li>
          </ul>
          <Paragraph>
            Escolha o nome, por exemplo <Text code>final.cer</Text>, e clique em <Text strong>Export</Text>.
          </Paragraph>
        </div>
      ),
    },
    {
      key: '4',
      label: '4. Exportar a chave privada (final_key.pem)',
      children: (
        <div>
          <Paragraph>
            Clique com o botão direito no mesmo item → <Text strong>Export → Export Private Key</Text>.
          </Paragraph>
          <Paragraph>
            Selecione o tipo de exportação: escolha <Text code>OpenSSL</Text> para obter a chave no formato PEM padrão (compatível com OpenSSL e servidores).
          </Paragraph>
          <Paragraph>
            Após escolher OpenSSL, aparecerá a próxima tela onde você decide se a chave será encrypt (com senha) ou sem senha.
          </Paragraph>
          <Paragraph>
            Se quiser o mesmo formato que usamos antes (sem senha): <Text strong>desmarque Encrypt</Text> e salve como <Text code>final_key.pem</Text>.
          </Paragraph>
        </div>
      ),
    },
    {
      key: '5',
      label: '5. Exportar a cadeia de certificados (cadeia.pem)',
      children: (
        <div>
          <Paragraph>
            Repita <Text strong>Export → Export Certificate Chain</Text>.
          </Paragraph>
          <Paragraph>
            Selecione:
          </Paragraph>
          <ul>
            <li><Text code>Export Length: Entire Chain</Text></li>
            <li><Text code>Export Format: X.509</Text></li>
            <li>Marque <Text code>PEM</Text></li>
          </ul>
          <Paragraph>
            Salve como <Text code>cadeia.pem</Text>. Ele conterá as intermediárias (e, às vezes, a raiz).
          </Paragraph>
        </div>
      ),
    },
    {
      key: '6',
      label: '6. Comandos alternativos (usando OpenSSL)',
      children: (
        <div>
          <Paragraph>
            Se preferir fazer por linha de comando, estes são os comandos equivalentes com openssl:
          </Paragraph>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '6px', margin: '16px 0' }}>
            <Text code>
              # Extrair chave privada (sem senha)<br/>
              openssl pkcs12 -in novo_certificado.pfx -nocerts -out final_key.pem -nodes<br/><br/>
              # Extrair certificado do usuário<br/>
              openssl pkcs12 -in novo_certificado.pfx -clcerts -nokeys -out final.cer<br/><br/>
              # Extrair cadeia de certificados (intermediárias)<br/>
              openssl pkcs12 -in novo_certificado.pfx -cacerts -nokeys -out cadeia.pem<br/><br/>
              # Verificar certificado<br/>
              openssl x509 -in final.cer -noout -subject -issuer -dates<br/><br/>
              # Calcular fingerprint SHA256<br/>
              openssl x509 -in final.cer -noout -fingerprint -sha256
            </Text>
          </div>
        </div>
      ),
    },
    {
      key: '7',
      label: '7. Boas práticas e observações',
      children: (
        <div>
          <ul>
            <li><Text strong>Proteja a chave privada:</Text> se exportar sem senha, mantenha o arquivo com permissões restritas (ex: chmod 600 final_key.pem).</li>
            <li>Se a cadeia estiver incompleta, baixe os certificados intermediários da Autoridade Certificadora (site da CA).</li>
            <li><Text strong>Para servidores web:</Text>
              <ul>
                <li><Text code>NGINX:</Text> ssl_certificate = fullchain.pem (certificado + cadeia); ssl_certificate_key = final_key.pem.</li>
                <li><Text code>Apache:</Text> use SSLCertificateFile, SSLCertificateKeyFile e SSLCertificateChainFile conforme sua distro.</li>
              </ul>
            </li>
            <li><Text strong>Backup:</Text> guarde os arquivos em local seguro e documente a data de expiração do certificado.</li>
          </ul>
        </div>
      ),
    },
  ];

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

            {/* Tabela de Certificados */}
            {certificateStatus.certificates && (
              <div style={{ marginBottom: '16px' }}>
                <Title level={4}>Certificados e Suas Validades</Title>
                <Table
                  dataSource={Object.entries(certificateStatus.certificates).map(([apiName, certInfo]) => ({
                    key: apiName,
                    nome: certInfo.apiName,
                    validade: certInfo.expiryInfo?.isExpired ? 'Vencido' :
                             certInfo.expiryInfo?.isExpiringSoon ? 'Vence em Breve' : 'Válido',
                    status: certInfo.status,
                    dataVencimento: certInfo.expiryInfo?.expiryDate ? 
                      new Date(certInfo.expiryInfo.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
                    diasRestantes: certInfo.expiryInfo?.daysUntilExpiry || 0
                  }))}
                  columns={[
                    {
                      title: 'Nome',
                      dataIndex: 'nome',
                      key: 'nome',
                      render: (text) => (
                        <Space>
                          <SafetyCertificateOutlined />
                          <Text strong>{text}</Text>
                        </Space>
                      )
                    },
                    {
                      title: 'Validade',
                      dataIndex: 'validade',
                      key: 'validade',
                      render: (validade, record) => {
                        let color = 'green';
                        let icon = <CheckCircleOutlined />;
                        
                        if (validade === 'Vencido') {
                          color = 'red';
                          icon = <CloseCircleOutlined />;
                        } else if (validade === 'Vence em Breve') {
                          color = 'orange';
                          icon = <ExclamationCircleOutlined />;
                        }
                        
                        return (
                          <Space>
                            {icon}
                            <Tag color={color}>{validade}</Tag>
                          </Space>
                        );
                      }
                    },
                    {
                      title: 'Data de Vencimento',
                      dataIndex: 'dataVencimento',
                      key: 'dataVencimento',
                      render: (data) => <Text>{data}</Text>
                    },
                    {
                      title: 'Dias Restantes',
                      dataIndex: 'diasRestantes',
                      key: 'diasRestantes',
                      render: (dias) => {
                        if (dias < 0) {
                          return <Text style={{ color: '#ff4d4f' }}>Vencido há {Math.abs(dias)} dias</Text>;
                        } else if (dias <= 30) {
                          return <Text style={{ color: '#faad14' }}>{dias} dias</Text>;
                        } else {
                          return <Text style={{ color: '#52c41a' }}>{dias} dias</Text>;
                        }
                      }
                    }
                  ]}
                  pagination={false}
                  size="small"
                />
                <Divider />
              </div>
            )}

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
      <Card 
        title="Informações"
        extra={
          <Button 
            type="link" 
            icon={<BookOutlined />}
            onClick={() => setTutorialModalVisible(true)}
            style={{ color: '#059669' }}
          >
            Tutorial: Como Extrair Certificados
          </Button>
        }
      >
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
        <Paragraph>
          <Text strong>Tutorial:</Text> Clique em "Tutorial: Como Extrair Certificados" para ver o 
          passo a passo completo de como extrair certificados, chave privada e cadeia a partir de um arquivo .pfx.
        </Paragraph>
      </Card>

      {/* Modal do Tutorial */}
      <Modal
        title={
          <Space>
            <BookOutlined style={{ color: '#059669' }} />
            <span>Tutorial: Extrair Certificado, Chave Privada e Cadeia a partir de um arquivo .pfx</span>
          </Space>
        }
        open={tutorialModalVisible}
        onCancel={() => setTutorialModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTutorialModalVisible(false)}>
            Fechar
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Alert
            message="Tutorial Completo"
            description="Este documento descreve o passo a passo visual e os comandos para extrair os arquivos nos mesmos formatos que usamos anteriormente (final.cer, final_key.pem e cadeia.pem)."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Collapse 
            items={tutorialContent}
            defaultActiveKey={['1']}
            size="small"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Certificados;
