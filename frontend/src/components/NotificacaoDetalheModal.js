// src/components/NotificacaoDetalheModal.js
import React from 'react';
import { Modal, Typography, Tag, Space, Row, Col, Button, Card, Divider, Alert } from 'antd';
import {
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseOutlined,
  ExclamationCircleFilled,
  UserOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  EyeOutlined,
  AppleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from '../config/momentConfig';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { getFruitIcon } from '../utils/fruitIcons';
import useResponsive from '../hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

const NotificacaoDetalheModal = ({ notificacao, open, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile } = useResponsive();

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

  // Verificar se é notificação de pedido
  const isNotificacaoPedido = () => {
    if (!notificacao) return false;
    let dadosAdicionais = notificacao?.dadosAdicionais;
    if (typeof dadosAdicionais === 'string') {
      try {
        dadosAdicionais = JSON.parse(dadosAdicionais);
      } catch (error) {
        return false;
      }
    }
    return !!dadosAdicionais?.pedidoId || notificacao.titulo === 'Novo pedido adicionado';
  };

  // Função para renderizar notificação de pedido com layout customizado
  const renderizarNotificacaoPedido = () => {
    const dados = getDadosAdicionais();
    const pedidoId = dados?.pedidoId;
    const numeroPedido = dados?.numeroPedido;
    const cliente = dados?.cliente || 'Cliente não informado';
    const dataColheita = dados?.dataPrevistaColheita;
    const usuarioCriador = dados?.usuarioCriador;
    const conteudoModal = dados?.modal?.conteudo || '';
    
    // Extrair informações detalhadas do conteúdo do modal
    let frutasDetalhadas = [];
    let observacoes = '';
    let dataCriacao = '';
    
    if (conteudoModal) {
      const linhas = conteudoModal.split('\n').filter(l => l.trim());
      
      // Extrair data de criação
      const dataCriacaoMatch = linhas.find(l => l.includes('Data de Criação:'));
      if (dataCriacaoMatch) {
        dataCriacao = dataCriacaoMatch.split('Data de Criação:')[1]?.trim() || '';
      }
      
      // Extrair frutas (linhas numeradas)
      let dentroSecaoFrutas = false;
      let frutaAtual = null;
      
      linhas.forEach((linha, index) => {
        // Detectar início da seção de frutas
        if (linha.includes('Frutas do Pedido') || linha.includes('='.repeat(50))) {
          dentroSecaoFrutas = true;
          return;
        }
        
        // Detectar observações
        if (linha.includes('Observações:')) {
          dentroSecaoFrutas = false;
          observacoes = linhas.slice(index + 1).join('\n').trim();
          return;
        }
        
        if (dentroSecaoFrutas) {
          // Linha numerada = nova fruta
          const matchNumero = linha.match(/^(\d+)\.\s*(.+)$/);
          if (matchNumero) {
            // Salvar fruta anterior se existir
            if (frutaAtual) {
              frutasDetalhadas.push(frutaAtual);
            }
            frutaAtual = {
              nome: matchNumero[2].trim(),
              numero: matchNumero[1],
              cultura: null,
              quantidade: null
            };
          } else if (frutaAtual) {
            // Linhas de detalhes da fruta atual
            if (linha.includes('Cultura:')) {
              frutaAtual.cultura = linha.split('Cultura:')[1]?.trim() || null;
            } else if (linha.includes('Quantidade Prevista:')) {
              const qtdStr = linha.split('Quantidade Prevista:')[1]?.trim() || '';
              frutaAtual.quantidade = qtdStr;
            }
          }
        }
      });
      
      // Adicionar última fruta
      if (frutaAtual) {
        frutasDetalhadas.push(frutaAtual);
      }
    }
    
    // Se não encontrou frutas no conteúdo, usar as do dadosAdicionais
    if (frutasDetalhadas.length === 0 && dados?.frutas) {
      frutasDetalhadas = dados.frutas.map((f, idx) => ({
        nome: f.nome,
        numero: (idx + 1).toString(),
        cultura: f.cultura || null,
        quantidade: f.quantidade || f.quantidadePrevista || null
      }));
    }
    
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Informações do Pedido */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Dados Básicos do Pedido
              </span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem"
          }}
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              color: "#ffffff", 
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: "8px 16px"
            },
            body: { 
              padding: "16px" 
            }
          }}
        >
          <Row gutter={[16, 12]}>
            {numeroPedido && (
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>Número do Pedido:</Text>
                <br />
                <Text style={{ fontSize: "1rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  #{numeroPedido}
                </Text>
              </Col>
            )}
            {dataColheita && (
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  Data Prevista Colheita:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>{dataColheita}</Text>
              </Col>
            )}
            {(dataCriacao || notificacao?.createdAt) && (
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  Data de Criação:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {dataCriacao || formatarData(notificacao.createdAt || notificacao.created_at)}
                </Text>
              </Col>
            )}
            {usuarioCriador && (
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  Criado por:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", fontWeight: "500", color: "#059669", marginTop: "4px" }}>
                  {usuarioCriador.nome}
                </Text>
              </Col>
            )}
          </Row>
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={24} md={8}>
              <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                <UserOutlined style={{ marginRight: 4 }} />
                Cliente:
              </Text>
              <br />
              <Text style={{ fontSize: "0.9375rem", fontWeight: "500", color: "#333", marginTop: "4px" }}>
                {cliente}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Frutas do Pedido */}
        <Card
          title={
            <Space>
              <AppleOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                Frutas do Pedido
              </span>
            </Space>
          }
          style={{ 
            marginBottom: 16,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem"
          }}
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              color: "#ffffff", 
              borderRadius: "0.5rem 0.5rem 0 0",
              borderBottom: "0.125rem solid #047857",
              padding: "8px 16px"
            },
            body: { 
              padding: "16px" 
            }
          }}
        >
          {frutasDetalhadas.length > 0 ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {frutasDetalhadas.map((fruta, index) => {
                const FruitIcon = fruta?.nome ? getFruitIcon(fruta.nome, { width: 24, height: 24 }) : null;
                
                return (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {FruitIcon && (
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}>
                        {FruitIcon}
                      </Box>
                    )}
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', color: '#059669', marginBottom: '8px' }}>
                        {fruta.numero || (index + 1)}. {fruta.nome || 'Fruta não identificada'}
                      </Text>
                      
                      {fruta.cultura && (
                        <div style={{ marginBottom: '6px' }}>
                          <Text type="secondary" style={{ fontSize: '13px', color: '#666' }}>
                            Cultura: <Text strong style={{ color: '#333' }}>{fruta.cultura}</Text>
                          </Text>
                        </div>
                      )}
                      
                      {fruta.quantidade && (
                        <div>
                          <Text type="secondary" style={{ fontSize: '13px', color: '#666' }}>
                            Quantidade Prevista: <Text strong style={{ color: '#333' }}>{fruta.quantidade}</Text>
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Space>
          ) : (
            <Text type="secondary">Nenhuma fruta cadastrada</Text>
          )}
        </Card>

        {/* Observações */}
        {observacoes && (
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Observações
                </span>
              </Space>
            }
            style={{ 
              marginBottom: 16,
              border: "0.0625rem solid #e8e8e8",
              borderRadius: "0.5rem"
            }}
            styles={{ 
              header: { 
                backgroundColor: "#059669", 
                color: "#ffffff", 
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "0.125rem solid #047857",
                padding: "8px 16px"
              },
              body: { 
                padding: "16px" 
              }
            }}
          >
            <Text style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-line' }}>
              {observacoes}
            </Text>
          </Card>
        )}
      </Space>
    );
  };

  // Função para renderizar o conteúdo formatado com tratamento especial para mensagens informativas
  const renderizarConteudoFormatado = () => {
    // Se for notificação de pedido, usar renderização customizada
    if (isNotificacaoPedido()) {
      return renderizarNotificacaoPedido();
    }
    
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

  // Obter dados adicionais parseados
  const getDadosAdicionais = () => {
    if (!notificacao?.dadosAdicionais) return {};
    if (typeof notificacao.dadosAdicionais === 'string') {
      try {
        return JSON.parse(notificacao.dadosAdicionais);
      } catch (error) {
        return {};
      }
    }
    return notificacao.dadosAdicionais;
  };

  const dadosAdicionais = getDadosAdicionais();
  const numeroPedido = dadosAdicionais?.numeroPedido;
  const isPedido = isNotificacaoPedido();

  return (
    <Modal
      title={
        isPedido && numeroPedido ? (
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
            <EyeOutlined style={{ marginRight: "0.5rem" }} />
            {isMobile ? `Pedido #${numeroPedido}` : `Visualizar Pedido #${numeroPedido}`}
          </span>
        ) : (
          <Space align="center">
            <Tag color={cores[notificacao?.tipo] || cores.sistema}>
              {notificacao?.tipo?.toUpperCase() || 'SISTEMA'}
            </Tag>
            <span>
              {dadosAdicionais?.modal?.titulo || notificacao?.titulo || 'Detalhes da notificação'}
            </span>
          </Space>
        )
      }
      open={open}
      onCancel={onClose}
      width={isPedido ? (isMobile ? '95vw' : '90%') : (isMobile ? '95vw' : 600)}
      style={{ maxWidth: isPedido ? (isMobile ? '95vw' : "75rem") : (isMobile ? '95vw' : "600px") }}
      centered
      footer={
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end",
          alignItems: "center",
          gap: isMobile ? "8px" : "12px"
        }}>
          <Button 
            onClick={onClose} 
            size={isMobile ? "small" : "large"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
            }}
          >
            Fechar
          </Button>
        </div>
      }
      closeIcon={<CloseOutlined />}
      styles={{
        header: isPedido ? { 
          backgroundColor: "#059669", 
          borderBottom: "0.125rem solid #047857", 
          padding: 0 
        } : undefined,
        body: { 
          maxHeight: "calc(100vh - 12.5rem)", 
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? "12px" : "20px"
        },
        wrapper: { zIndex: 1200 },
        mask: { zIndex: 1200 }
      }}
      destroyOnClose
    >
      {notificacao ? (
        <>
          {/* Cabeçalho com data e prioridade - apenas para notificações não-pedido */}
          {!isNotificacaoPedido() && (
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
          )}
          
          {/* Substituí o parágrafo original pela função de renderização formatada */}
          {renderizarConteudoFormatado()}
          
          {/* Renderizar dados adicionais apenas se não for notificação de pedido */}
          {!isNotificacaoPedido() && renderizarDadosAdicionais()}
          
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