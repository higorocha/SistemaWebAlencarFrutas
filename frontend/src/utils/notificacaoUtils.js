import { message } from 'antd';

// Exibir notificação no canto da tela
export const showNotification = (notificacao) => {
  const tipo = notificacao.prioridade === 'alta' ? 'error' : 
               notificacao.prioridade === 'media' ? 'info' : 'success';
  
  message[tipo]({
    content: (
      <div>
        <div style={{ fontWeight: 'bold' }}>{notificacao.titulo}</div>
        <div>{notificacao.conteudo}</div>
      </div>
    ),
    duration: 6,
    key: `notification-${notificacao.id}`
  });
};

// Função para lidar com webhooks
export const processarWebhookPix = async (dadosWebhook) => {
  try {
    // Aqui você adaptaria o código para processar webhooks do Banco do Brasil
    // e transformá-los em notificações
    const { e2eId, valor, horario, infoPagador } = dadosWebhook;
    
    // Criar uma notificação com os dados do webhook
    await fetch('/api/notificacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        titulo: 'Novo pagamento PIX recebido',
        conteudo: `Recebido PIX de R$ ${valor} de ${infoPagador || 'Cliente'}`,
        tipo: 'pix',
        prioridade: 'media',
        dados_adicionais: dadosWebhook,
        link: `/financeiro/pix/${e2eId}`
      })
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao processar webhook PIX:', error);
    return false;
  }
};