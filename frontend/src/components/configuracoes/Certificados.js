import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Alert, 
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
  BookOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import CentralizedLoader from '../common/loaders/CentralizedLoader';
import { PrimaryButton } from '../common/buttons';

const { Title, Text, Paragraph } = Typography;

// Styled components para aplicar o estilo do sistema
const PageContainer = styled.div`
  padding: 24px;
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8f5e8;
  overflow: hidden;
  margin-bottom: 24px;
  
  .ant-card-body {
    padding: 24px;
  }
`;

const SectionContainer = styled.div`
  border: 1px solid #e8f5e8;
  padding: 24px;
  border-radius: 16px;
  margin-top: 16px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(5, 150, 105, 0.1);
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #f0fdf4 !important;
    color: #059669 !important;
    font-weight: 600 !important;
    border-bottom: 2px solid #e8f5e8 !important;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: #f0fdf4 !important;
  }
  
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #e8f5e8 !important;
  }
`;

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
    <PageContainer>
      <Title level={2} style={{ color: '#059669', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <SafetyCertificateOutlined />
        Monitoramento de Certificados
      </Title>

      {/* Status do Monitoramento */}
      <StyledCard
        title={
          <Space>
            <BellOutlined style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: '600' }}>Status do Monitoramento</span>
          </Space>
        }
        loading={loading}
        styles={{ 
          header: { 
            backgroundColor: '#059669', 
            color: '#ffffff', 
            borderRadius: '8px 8px 0 0' 
          }
        }}
      >
        {status ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Status"
                value={status.isActive ? 'Ativo' : 'Inativo'}
                prefix={status.isActive ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: status.isActive ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Próxima Verificação"
                value={status.nextCheck}
                prefix={<BellOutlined style={{ color: '#059669' }} />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Fuso Horário"
                value={status.timeZone}
                prefix={<GlobalOutlined style={{ color: '#059669' }} />}
              />
            </Col>
          </Row>
        ) : (
          <Alert message="Erro ao carregar status" type="error" />
        )}
      </StyledCard>

      {/* Status dos Certificados */}
      <StyledCard
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: '600' }}>Status dos Certificados</span>
          </Space>
        }
        extra={
          <Space>
            <PrimaryButton
              icon={<ReloadOutlined />}
              onClick={() => checkCertificates(true)}
              loading={certificateLoading}
              size="large"
            >
              Verificar Agora
            </PrimaryButton>
            <PrimaryButton
              icon={<BellOutlined />}
              onClick={simulateCronJob}
              loading={testingNotification}
              size="large"
              style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
            >
              Simular Cron Job
            </PrimaryButton>
          </Space>
        }
        styles={{ 
          header: { 
            backgroundColor: '#059669', 
            color: '#ffffff', 
            borderRadius: '8px 8px 0 0' 
          }
        }}
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
              <SectionContainer>
                <Title level={5} style={{ color: '#059669', marginBottom: '8px', marginTop: '0' }}>
                  <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                  Certificados e Suas Validades
                </Title>
                <Divider style={{ margin: '0 0 16px 0', borderColor: '#e8e8e8' }} />
                
                {/* Processar dados para a tabela */}
                {(() => {
                  const tableData = [];
                  
                  // Adicionar certificado da empresa
                  if (certificateStatus.certificates.EMPRESA) {
                    const empresa = certificateStatus.certificates.EMPRESA;
                    const cert = empresa.certificado;
                    tableData.push({
                      key: 'EMPRESA',
                      nome: empresa.nome || 'Empresa',
                      tipo: 'Certificado da Empresa',
                      usadoPor: empresa.usadoPor?.join(', ') || 'PIX, EXTRATOS',
                      validade: cert.expiryInfo?.isExpired ? 'Vencido' :
                               cert.expiryInfo?.isExpiringSoon ? 'Vence em Breve' : 'Válido',
                      dataVencimento: cert.expiryInfo?.expiryDate ? 
                        new Date(cert.expiryInfo.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
                      diasRestantes: cert.expiryInfo?.daysUntilExpiry || 0
                    });
                  }
                  
                  // Adicionar certificados CA do BB (compartilhados entre PIX e EXTRATOS)
                  if (certificateStatus.certificates.CA_BB) {
                    const caBB = certificateStatus.certificates.CA_BB;
                    if (caBB.certificadosCA && caBB.certificadosCA.length > 0) {
                      caBB.certificadosCA.forEach((caCert, index) => {
                        tableData.push({
                          key: `CA_BB-${index}`,
                          nome: caCert.nome,
                          tipo: 'CA do BB',
                          usadoPor: caBB.usadoPor?.join(', ') || 'PIX, EXTRATOS',
                          validade: caCert.expiryInfo?.isExpired ? 'Vencido' :
                                   caCert.expiryInfo?.isExpiringSoon ? 'Vence em Breve' : 'Válido',
                          dataVencimento: caCert.expiryInfo?.expiryDate ? 
                            new Date(caCert.expiryInfo.expiryDate).toLocaleDateString('pt-BR') : 'N/A',
                          diasRestantes: caCert.expiryInfo?.daysUntilExpiry || 0
                        });
                      });
                    }
                  }
                  
                  return (
                    <StyledTable
                      dataSource={tableData}
                      columns={[
                        {
                          title: 'Nome',
                          dataIndex: 'nome',
                          key: 'nome',
                          render: (text, record) => (
                            <Space>
                              <SafetyCertificateOutlined style={{ color: '#059669' }} />
                              <Text strong style={{ color: '#059669' }}>{text}</Text>
                            </Space>
                          )
                        },
                        {
                          title: 'Tipo',
                          dataIndex: 'tipo',
                          key: 'tipo',
                          render: (tipo) => <Text>{tipo}</Text>
                        },
                        {
                          title: 'Usado Por',
                          dataIndex: 'usadoPor',
                          key: 'usadoPor',
                          render: (usadoPor) => <Text>{usadoPor}</Text>
                        },
                        {
                          title: 'Validade',
                          dataIndex: 'validade',
                          key: 'validade',
                          render: (validade) => {
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
                  );
                })()}
              </SectionContainer>
            )}

            {/* Detalhes dos Certificados */}
            <SectionContainer>
              <Title level={5} style={{ color: '#059669', marginBottom: '8px', marginTop: '0' }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                Detalhes dos Certificados
              </Title>
              <Divider style={{ margin: '0 0 16px 0', borderColor: '#e8e8e8' }} />
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
            </SectionContainer>
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
      </StyledCard>

      {/* Informações Adicionais */}
      <StyledCard
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: '600' }}>Informações</span>
          </Space>
        }
        extra={
          <PrimaryButton
            type="link"
            icon={<BookOutlined />}
            onClick={() => setTutorialModalVisible(true)}
            style={{ color: '#ffffff', padding: 0 }}
          >
            Tutorial: Como Extrair Certificados
          </PrimaryButton>
        }
        styles={{ 
          header: { 
            backgroundColor: '#059669', 
            color: '#ffffff', 
            borderRadius: '8px 8px 0 0' 
          }
        }}
      >
        <Paragraph>
          <Text strong style={{ color: '#059669' }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            Monitoramento Automático:
          </Text> O sistema verifica automaticamente os certificados 
          todos os dias às 06:00 (horário de Brasília) e envia notificações quando necessário.
        </Paragraph>
        <Paragraph>
          <Text strong style={{ color: '#059669' }}>
            <ReloadOutlined style={{ marginRight: 8 }} />
            Verificação Manual:
          </Text> Use o botão "Verificar Agora" para executar uma 
          verificação imediata dos certificados.
        </Paragraph>
        <Paragraph>
          <Text strong style={{ color: '#059669' }}>
            <BellOutlined style={{ marginRight: 8 }} />
            Simulação do Cron Job:
          </Text> Use o botão "Simular Cron Job" para executar 
          exatamente o mesmo processo que o cron job diário executa, incluindo o envio das notificações 
          reais para o sistema. Isso permite testar o layout e comportamento das notificações.
        </Paragraph>
        <Paragraph>
          <Text strong style={{ color: '#059669' }}>
            <BookOutlined style={{ marginRight: 8 }} />
            Tutorial:
          </Text> Clique em "Tutorial: Como Extrair Certificados" para ver o 
          passo a passo completo de como extrair certificados, chave privada e cadeia a partir de um arquivo .pfx.
        </Paragraph>
      </StyledCard>

      {/* Modal do Tutorial */}
      <Modal
        title={
          <span style={{ 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: '16px',
            backgroundColor: '#059669',
            padding: '12px 16px',
            margin: '-20px -24px 0 -24px',
            display: 'block',
            borderRadius: '8px 8px 0 0',
          }}>
            <BookOutlined style={{ marginRight: 8 }} />
            Tutorial: Extrair Certificado, Chave Privada e Cadeia a partir de um arquivo .pfx
          </span>
        }
        open={tutorialModalVisible}
        onCancel={() => setTutorialModalVisible(false)}
        footer={[
          <PrimaryButton 
            key="close" 
            onClick={() => setTutorialModalVisible(false)}
            size="large"
          >
            Fechar
          </PrimaryButton>
        ]}
        width={800}
        styles={{
          body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'hidden', padding: 20 },
          header: { backgroundColor: '#059669', borderBottom: '2px solid #047857', padding: 0 },
          wrapper: { zIndex: 1100 }
        }}
        centered
        destroyOnClose
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
    </PageContainer>
  );
};

export default Certificados;
