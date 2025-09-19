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
  
  // Função para renderizar os dados adicionais em formato JSON
  const renderizarDadosAdicionais = () => {
    if (!notificacao?.dados_adicionais) return null;
    
    try {
      const dados = typeof notificacao.dados_adicionais === 'string' 
        ? JSON.parse(notificacao.dados_adicionais) 
        : notificacao.dados_adicionais;
      
      return (
        <Card 
          size="small" 
          title="Dados adicionais" 
          style={{ marginTop: 16 }}
          styles={{ 
            body: {
              background: '#fafafa', 
              padding: 16,
              maxHeight: '200px',
              overflow: 'auto'
            }
          }}
        >
          <pre style={{ 
            margin: 0, 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '13px'
          }}>
            {JSON.stringify(dados, null, 2)}
          </pre>
        </Card>
      );
    } catch (error) {
      return (
        <Alert
          message="Erro ao processar dados adicionais"
          type="error"
          showIcon
        />
      );
    }
  };

  // Função para renderizar o conteúdo formatado com tratamento especial para mensagens informativas
  const renderizarConteudoFormatado = () => {
    if (!notificacao?.conteudo) return null;
    
    // Dividir o conteúdo pelo marcador \n\n que separa a mensagem principal da informativa
    const partes = notificacao.conteudo.split('\n\n');
    
    return (
      <>
        <Paragraph style={{ fontSize: '16px', marginBottom: 4 }}>
          {partes[0]}
        </Paragraph>
        
        {partes.length > 1 && partes.slice(1).map((parte, index) => {
          // Verificar se é uma parte informativa (começa com *)
          if (parte.startsWith('*')) {
            return (
              <Paragraph 
                key={index}
                style={{ 
                  color: '#8c8c8c', 
                  fontSize: '13px', 
                  marginTop: 12,
                  fontStyle: 'italic'
                }}
              >
                {parte}
              </Paragraph>
            );
          } else {
            return (
              <Paragraph key={index} style={{ fontSize: '16px', marginTop: 8 }}>
                {parte}
              </Paragraph>
            );
          }
        })}
      </>
    );
  };

  return (
    <Modal
      title={
        <Space align="center">
          <Tag color={cores[notificacao?.tipo] || cores.sistema}>
            {notificacao?.tipo?.toUpperCase() || 'SISTEMA'}
          </Tag>
          <span>{notificacao?.titulo || 'Detalhes da notificação'}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>,
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
                <ExclamationCircleFilled style={{ color: coresPrioridade[notificacao.prioridade] || coresPrioridade.media }} />
                <Text strong style={{ color: coresPrioridade[notificacao.prioridade] || coresPrioridade.media }}>
                  Prioridade {notificacao.prioridade || 'média'}
                </Text>
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