# Sistema de Notificações - Backend

Este documento descreve o sistema completo de notificações implementado no backend, incluindo API REST, WebSockets e integração com o frontend.

## 📋 Visão Geral

O sistema de notificações permite:
- **Notificações em tempo real** via WebSocket (Socket.io)
- **Notificações globais** (para todos os usuários) e **específicas** (para usuário específico)
- **Diferentes tipos** de notificação (Sistema, PIX, Cobrança, Fatura, Boleto, Alerta)
- **Controle de status** (Não lida, Lida, Descartada)
- **Expiração automática** de notificações
- **Integração completa** com o frontend existente

## 🗄️ Modelo de Dados

### Tabela: `notificacoes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `INTEGER` | Chave primária |
| `titulo` | `VARCHAR(100)` | Título da notificação |
| `conteudo` | `TEXT` | Conteúdo da notificação |
| `tipo` | `ENUM` | Tipo: SISTEMA, PIX, COBRANCA, FATURA, BOLETO, ALERTA |
| `status` | `ENUM` | Status: NAO_LIDA, LIDA, DESCARTADA |
| `prioridade` | `ENUM` | Prioridade: BAIXA, MEDIA, ALTA |
| `usuario_id` | `INTEGER` | ID do usuário destinatário (NULL = global) |
| `dados_adicionais` | `JSONB` | Dados extras em formato JSON |
| `link` | `VARCHAR(255)` | Link relacionado à notificação |
| `expirar_em` | `DATETIME` | Data de expiração (NULL = não expira) |
| `created_at` | `DATETIME` | Data de criação |
| `updated_at` | `DATETIME` | Data da última atualização |

## 🔌 API REST

### Base URL: `/api/notificacoes`

### Autenticação
Todas as rotas requerem autenticação JWT via header `Authorization: Bearer <token>`

### Rotas Disponíveis

#### 1. **GET** `/api/notificacoes`
**Buscar todas as notificações do usuário**

**Resposta:**
```json
{
  "notificacoes": [
    {
      "id": 1,
      "titulo": "Novo pagamento recebido",
      "conteudo": "O cliente João Silva realizou um pagamento de R$ 150,00",
      "tipo": "BOLETO",
      "status": "NAO_LIDA",
      "prioridade": "MEDIA",
      "usuarioId": 1,
      "dadosAdicionais": {
        "cliente": "João Silva",
        "valor": 150.00
      },
      "link": null,
      "expirarEm": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "nao_lidas": 5
}
```

#### 2. **GET** `/api/notificacoes/:id`
**Buscar notificação específica**

#### 3. **POST** `/api/notificacoes`
**Criar nova notificação**

**Body:**
```json
{
  "titulo": "Novo pagamento recebido",
  "conteudo": "O cliente João Silva realizou um pagamento de R$ 150,00",
  "tipo": "BOLETO",
  "prioridade": "MEDIA",
  "usuarioId": 1,
  "dadosAdicionais": {
    "cliente": "João Silva",
    "valor": 150.00
  },
  "link": "https://exemplo.com/detalhes",
  "expirarEm": "2024-12-31T23:59:59.000Z"
}
```

#### 4. **PATCH** `/api/notificacoes/:id`
**Atualizar notificação**

#### 5. **DELETE** `/api/notificacoes/:id`
**Excluir notificação**

#### 6. **PATCH** `/api/notificacoes/:id/ler`
**Marcar notificação como lida**

#### 7. **PATCH** `/api/notificacoes/ler-todas`
**Marcar todas as notificações como lidas**

#### 8. **PATCH** `/api/notificacoes/:id/descartar`
**Descartar notificação**

#### 9. **POST** `/api/notificacoes/sistema`
**Criar notificação do sistema (uso interno)**

**Body:**
```json
{
  "titulo": "Manutenção programada",
  "conteudo": "O sistema ficará indisponível das 02:00 às 04:00",
  "dadosAdicionais": {
    "tipo_manutencao": "atualizacao",
    "duracao": "2 horas"
  }
}
```

#### 10. **POST** `/api/notificacoes/pagamento`
**Criar notificação de pagamento (uso interno)**

**Body:**
```json
{
  "nomeCliente": "João Silva",
  "valor": 150.00,
  "tipo": "PIX"
}
```

## 🔌 WebSocket Events

### Eventos Emitidos pelo Servidor

#### 1. `nova_notificacao`
Emitido quando uma nova notificação é criada.

**Payload:**
```json
{
  "notificacao": {
    "id": 1,
    "titulo": "Novo pagamento recebido",
    "conteudo": "O cliente João Silva realizou um pagamento de R$ 150,00",
    "tipo": "BOLETO",
    "status": "NAO_LIDA",
    "prioridade": "MEDIA",
    "usuarioId": 1,
    "dadosAdicionais": {
      "cliente": "João Silva",
      "valor": 150.00
    },
    "link": null,
    "expirarEm": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. `notificacao_lida`
Emitido quando uma notificação é marcada como lida.

**Payload:**
```json
{
  "notificacaoId": 1
}
```

#### 3. `todas_notificacoes_lidas`
Emitido quando todas as notificações são marcadas como lidas.

**Payload:**
```json
{}
```

#### 4. `notificacao_descartada`
Emitido quando uma notificação é descartada.

**Payload:**
```json
{
  "notificacaoId": 1,
  "eraNaoLida": true
}
```

## 🎯 Tipos de Notificação

### 1. **SISTEMA**
- Notificações geradas pelo sistema
- Ex: Manutenção, atualizações, avisos gerais

### 2. **PIX**
- Notificações de pagamentos PIX recebidos
- Inclui dados do cliente e valor

### 3. **BOLETO**
- Notificações de pagamentos via boleto
- Inclui dados do cliente e valor

### 4. **COBRANCA**
- Notificações relacionadas a cobranças
- Ex: Vencimentos, multas, juros

### 5. **FATURA**
- Notificações de faturas
- Ex: Fatura gerada, fatura vencida

### 6. **ALERTA**
- Notificações de alertas importantes
- Ex: Problemas críticos, avisos urgentes

## 🔧 Funcionalidades Avançadas

### 1. **Notificações Globais vs Específicas**
- **Globais**: `usuarioId = null` (visível para todos)
- **Específicas**: `usuarioId = <id>` (visível apenas para o usuário)

### 2. **Expiração Automática**
- Notificações com `expirarEm` são automaticamente removidas após a data
- Job automático limpa notificações expiradas

### 3. **Filtros Automáticos**
- Notificações descartadas não aparecem na listagem
- Notificações expiradas são automaticamente filtradas

### 4. **Contagem de Não Lidas**
- Endpoint retorna contagem em tempo real
- Atualizada via WebSocket

## 🚀 Integração com Frontend

### 1. **NotificacaoContext.js**
- Gerencia estado das notificações
- Escuta eventos WebSocket
- Atualiza contador em tempo real

### 2. **NotificacaoMenu.js**
- Exibe notificações em popover
- Permite marcar como lida/descartar
- Mostra badge com contagem

### 3. **Layout.js**
- Integra menu de notificações
- Gerencia provider do contexto

## 📝 Exemplos de Uso

### Criar notificação de pagamento PIX:
```javascript
// No frontend
await axiosInstance.post('/api/notificacoes/pagamento', {
  nomeCliente: 'João Silva',
  valor: 150.00,
  tipo: 'PIX'
});
```

### Criar notificação do sistema:
```javascript
// No frontend
await axiosInstance.post('/api/notificacoes/sistema', {
  titulo: 'Manutenção programada',
  conteudo: 'O sistema ficará indisponível das 02:00 às 04:00',
  dadosAdicionais: {
    tipo_manutencao: 'atualizacao',
    duracao: '2 horas'
  }
});
```

### Marcar como lida:
```javascript
// No frontend
await axiosInstance.patch(`/api/notificacoes/${id}/ler`);
```

## 🔒 Segurança

- **Autenticação JWT** obrigatória em todas as rotas
- **Validação de propriedade**: usuários só podem acessar suas próprias notificações
- **Notificações globais**: acessíveis por todos os usuários autenticados
- **Rate limiting** aplicado via ThrottlerModule

## 🧪 Testes

Para testar o sistema:

1. **Criar notificação de teste:**
```bash
curl -X POST http://localhost:5002/api/notificacoes \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste de notificação",
    "conteudo": "Esta é uma notificação de teste",
    "tipo": "SISTEMA"
  }'
```

2. **Verificar notificações:**
```bash
curl -X GET http://localhost:5002/api/notificacoes \
  -H "Authorization: Bearer <seu_token>"
```

## 📚 Próximos Passos

- [ ] Implementar notificações push para dispositivos móveis
- [ ] Adicionar templates de notificação
- [ ] Implementar agendamento de notificações
- [ ] Adicionar notificações por email/SMS
- [ ] Criar dashboard de notificações para administradores 