// src/components/NotificacaoDetalheModal.js
import React from 'react';
import { Modal, Typography, Tag, Space, Row, Col, Button, Card, Divider, Alert } from 'antd';
import { 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  LinkOutlined, 
  CloseOutlined,
  ExclamationCircleFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from '../config/momentConfig';
import { useTheme } from '@mui/material/styles';

const { Title, Text, Paragraph } = Typography;

const NotificacaoDetalheModal = ({ notificacao, open, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Função para formatar datas
  const formatarData = (dataString) => {
    if (!dataString) return 'Data não disponível';
    
    try {
      const data = moment(dataString);
      return data.isValid() ? data.format('DD/MM/YYYY HH:mm') : 'Data não disponível';
    } catch (error) {
      return 'Data não disponível';
    }
  };
  
  // Função para navegação quando clicar no botão "Abrir Link"
  const navegarParaLink = () => {
    if (notificacao?.link) {
      navigate(notificacao.link);
      onClose();
    }
  };
  
  // Cores para os diferentes tipos de notificação
  const cores = {
    sistema: theme.palette.notifications.sistema,
    pix: theme.palette.notifications.pix,
    cobranca: theme.palette.notifications.cobranca,
    fatura: theme.palette.notifications.fatura,
    boleto: theme.palette.notifications.boleto,
    alerta: theme.palette.notifications.alerta
  };
  
  // Cores para diferentes níveis de prioridade
  const coresPrioridade = {
    baixa: '#52c41a',
    media: '#faad14',
    alta: '#f5222d'
  };
  
  // Função para renderizar os dados adicionais em formato amigável
  const renderizarDadosAdicionais = () => {
    if (!notificacao?.dadosAdicionais) return null;
    
    try {
      const dados = typeof notificacao.dadosAdicionais === 'string' 
        ? JSON.parse(notificacao.dadosAdicionais) 
        : notificacao.dadosAdicionais;
      
      // Se for uma notificação de certificados, exibir informações específicas
      if (dados?.tipo_alerta === 'certificados_vencendo_breve' || dados?.tipo_alerta === 'certificados_vencidos') {
        return (
          <Card 
            size="small" 
            title="📋 Informações Técnicas" 
            style={{ marginTop: 16 }}
            styles={{ 
              body: {
                background: '#f8f9fa', 
                padding: 16
              }
            }}
          >
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Tipo de Alerta:</Text>
                <br />
                <Tag color={dados.tipo_alerta === 'certificados_vencidos' ? 'red' : 'orange'}>
                  {dados.tipo_alerta === 'certificados_vencidos' ? 'Certificados Vencidos' : 'Certificados Vencendo'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>Prioridade:</Text>
                <br />
                <Tag color={dados.prioridade === 'ALTA' ? 'red' : dados.prioridade === 'MEDIA' ? 'orange' : 'green'}>
                  {dados.prioridade}
                </Tag>
              </Col>
              <Col span={24}>
                <Text strong>Certificados Afetados:</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {(dados.certificados_vencendo_breve || dados.certificados_vencidos || []).map((cert, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>
                      <Text code style={{ fontSize: '12px' }}>{cert}</Text>
                    </li>
                  ))}
                </ul>
              </Col>
              <Col span={24}>
                <Text strong>Ação Necessária:</Text>
                <br />
                <Text type="secondary">{dados.acao_necessaria}</Text>
              </Col>
              {dados.timestamp && (
                <Col span={24}>
                  <Text strong>Data da Verificação:</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(dados.timestamp).toLocaleString('pt-BR')}
                  </Text>
                </Col>
              )}
            </Row>
          </Card>
        );
      }
      
      // Para outros tipos de notificação, exibir informações básicas
      return (
        <Card 
          size="small" 
          title="📋 Informações Adicionais" 
          style={{ marginTop: 16 }}
          styles={{ 
            body: {
              background: '#f8f9fa', 
              padding: 16
            }
          }}
        >
          <Row gutter={[16, 8]}>
            {dados.prioridade && (
              <Col span={12}>
                <Text strong>Prioridade:</Text>
                <br />
                <Tag color={dados.prioridade === 'ALTA' ? 'red' : dados.prioridade === 'MEDIA' ? 'orange' : 'green'}>
                  {dados.prioridade}
                </Tag>
              </Col>
            )}
            {dados.timestamp && (
              <Col span={12}>
                <Text strong>Data:</Text>
                <br />
                <Text type="secondary">
                  {new Date(dados.timestamp).toLocaleString('pt-BR')}
                </Text>
              </Col>
            )}
            {dados.acao_necessaria && (
              <Col span={24}>
                <Text strong>Ação:</Text>
                <br />
                <Text type="secondary">{dados.acao_necessaria}</Text>
              </Col>
            )}
          </Row>
        </Card>
      );
    } catch (error) {
      return (
        <Alert
          message="Erro ao processar informações adicionais"
          type="error"
          showIcon
        />
      );
    }
  };

  // Função para renderizar o conteúdo formatado com tratamento especial para mensagens informativas
  const renderizarConteudoFormatado = () => {
    // Parsear dadosAdicionais se for string
    let dadosAdicionais = notificacao?.dadosAdicionais;
    if (typeof dadosAdicionais === 'string') {
      try {
        dadosAdicionais = JSON.parse(dadosAdicionais);
      } catch (error) {
        // Erro silencioso ao parsear dados
      }
    }
    
    // Verificar se há conteúdo específico do modal nos dados adicionais
    let conteudoParaExibir = notificacao?.conteudo;
    
    if (dadosAdicionais?.modal?.conteudo) {
      conteudoParaExibir = dadosAdicionais.modal.conteudo;
    }
    
    if (!conteudoParaExibir) return null;
    
    // Dividir o conteúdo por quebras de linha para melhor formatação
    const linhas = conteudoParaExibir.split('\n');
    
    return (
      <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
        {linhas.map((linha, index) => {
          // Verificar se é um cabeçalho (contém emojis e está em maiúsculo)
          if (linha.match(/^[🚨⚠️📋⏰💡🔧📅].*[A-ZÁÉÍÓÚÂÊÔÇÃÕ]{3,}/)) {
            return (
              <div key={index} style={{ 
                fontWeight: 'bold', 
                fontSize: '16px', 
                marginTop: index > 0 ? '16px' : '0',
                marginBottom: '8px',
                color: '#1890ff'
              }}>
                {linha}
              </div>
            );
          }
          // Verificar se é um item de lista (começa com •)
          else if (linha.startsWith('•')) {
            return (
              <div key={index} style={{ 
                marginLeft: '16px', 
                marginBottom: '4px',
                fontSize: '14px'
              }}>
                {linha}
              </div>
            );
          }
          // Linha normal
          else if (linha.trim()) {
            return (
              <div key={index} style={{ 
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                {linha}
              </div>
            );
          }
          // Linha vazia
          else {
            return <div key={index} style={{ height: '8px' }} />;
          }
        })}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space align="center">
          <Tag color={cores[notificacao?.tipo] || cores.sistema}>
            {notificacao?.tipo?.toUpperCase() || 'SISTEMA'}
          </Tag>
          <span>
            {(() => {
              // Parsear dadosAdicionais se for string
              let dadosAdicionais = notificacao?.dadosAdicionais;
              if (typeof dadosAdicionais === 'string') {
                try {
                  dadosAdicionais = JSON.parse(dadosAdicionais);
                } catch (error) {
                  console.error('Erro ao parsear dados_adicionais no título:', error);
                }
              }
              return dadosAdicionais?.modal?.titulo || notificacao?.titulo || 'Detalhes da notificação';
            })()}
          </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>,
        // Ações customizadas do modal (ex: botão "Verificar Certificados")
        (() => {
          // Parsear dadosAdicionais se for string
          let dadosAdicionais = notificacao?.dadosAdicionais;
          if (typeof dadosAdicionais === 'string') {
            try {
              dadosAdicionais = JSON.parse(dadosAdicionais);
            } catch (error) {
              console.error('Erro ao parsear dados_adicionais nas ações:', error);
            }
          }
          return dadosAdicionais?.modal?.acoes?.map((acao, index) => (
            <Button 
              key={`acao-${index}`}
              type={acao.tipo === 'primary' ? 'primary' : 'default'}
              onClick={() => {
                if (acao.onClick === 'navigate_to_certificates') {
                  navigate('/configuracoes?tab=5'); // Navegar para aba de certificados
                  onClose();
                }
              }}
            >
              {acao.texto}
            </Button>
          ));
        })(),
        // Link tradicional (fallback)
        notificacao?.link && (
          <Button 
            key="link" 
            type="primary" 
            icon={<LinkOutlined />} 
            onClick={navegarParaLink}
          >
            Abrir link
          </Button>
        )
      ]}
      closeIcon={<CloseOutlined />}
    >
      {notificacao ? (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space>
                <ClockCircleOutlined />
                <Text type="secondary">
                  {formatarData(notificacao.createdAt || notificacao.created_at)}
                </Text>
              </Space>
            </Col>
            <Col>
              <Space>
                {(() => {
                  // Parsear dadosAdicionais se for string
                  let dadosAdicionais = notificacao?.dadosAdicionais;
                  if (typeof dadosAdicionais === 'string') {
                    try {
                      dadosAdicionais = JSON.parse(dadosAdicionais);
                    } catch (error) {
                      // Erro silencioso
                    }
                  }
                  
                  const prioridade = dadosAdicionais?.prioridade || notificacao.prioridade || 'média';
                  const corPrioridade = coresPrioridade[prioridade.toLowerCase()] || coresPrioridade.media;
                  
                  return (
                    <>
                      <ExclamationCircleFilled style={{ color: corPrioridade }} />
                      <Text strong style={{ color: corPrioridade }}>
                        Prioridade {prioridade}
                      </Text>
                    </>
                  );
                })()}
              </Space>
            </Col>
          </Row>
          
          {/* Substituí o parágrafo original pela função de renderização formatada */}
          {renderizarConteudoFormatado()}
          
          {renderizarDadosAdicionais()}
          
          {notificacao.expirar_em && (
            <div style={{ marginTop: 16 }}>
              <Space>
                <ClockCircleOutlined style={{ color: '#faad14' }} />
                <Text type="warning">
                  Expira em: {formatarData(notificacao.expirar_em)}
                </Text>
              </Space>
            </div>
          )}
          
          {notificacao.status === 'lida' && (
            <Divider plain>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Notificação marcada como lida
              </Text>
            </Divider>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">Carregando detalhes da notificação...</Text>
        </div>
      )}
    </Modal>
  );
};

export default NotificacaoDetalheModal;