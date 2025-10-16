# Módulo PIX - Integração com API do Banco do Brasil

Este módulo fornece integração completa com a API PIX do Banco do Brasil, permitindo consultar transações PIX recebidas no sistema.

## 🚀 Funcionalidades

- ✅ **Consulta de Transações PIX**: Busca transações PIX recebidas em período específico
- ✅ **Autenticação OAuth2**: Gerenciamento automático de tokens com cache inteligente
- ✅ **Paginação Automática**: Consulta todas as páginas automaticamente (até 100 transações por página)
- ✅ **Validação de Dados**: Validação robusta de parâmetros e respostas
- ✅ **Health Check**: Endpoint para verificar se o serviço está operacional
- ✅ **Documentação Swagger**: API totalmente documentada
- ✅ **Logs Detalhados**: Logging completo para monitoramento e debug

## 📁 Estrutura do Módulo

```
src/pix/
├── dto/
│   └── pix.dto.ts          # DTOs para validação e tipagem
├── pix.controller.ts       # Controller com endpoints REST
├── pix.service.ts          # Service com lógica de negócio
├── pix.module.ts          # Módulo NestJS
└── README.md              # Esta documentação
```

## 🔧 Configuração

### 1. Formato de Datas (Documentação Oficial BB)

A API PIX do Banco do Brasil utiliza formato RFC 3339 com fuso horário. **IMPORTANTE**: O sistema considera o fuso horário de Brasília (UTC-3).

#### Formato Aceito:
- **UTC**: `2023-04-19T03:00:00.000Z`
- **UTC-3**: `2023-04-19T00:00:00.000-03:00`

#### Exemplo Prático:
Para consultar o período 19/04/2023, das 00h00min00seg até 23h59min59seg, horário Brasília:

**Formato UTC (recomendado):**
- Início: `2023-04-19T03:00:00.000Z`
- Fim: `2023-04-20T02:59:59.999Z`

**Formato UTC-3 (alternativo):**
- Início: `2023-04-19T00:00:00.000-03:00`
- Fim: `2023-04-19T23:59:59.999-03:00`

### 2. Credenciais no Banco de Dados

Antes de usar o módulo, você deve cadastrar as credenciais PIX na tabela `CredenciaisAPI`:

```sql
INSERT INTO credenciais_api (
  banco,
  conta_corrente_id,
  modalidade_api,
  developer_app_key,
  cliente_id,
  cliente_secret
) VALUES (
  '001',                    -- Código do Banco do Brasil
  1,                        -- ID da conta corrente
  '002 - Pix',              -- Modalidade PIX
  'sua_developer_app_key',  -- Developer Application Key
  'seu_cliente_id',         -- Cliente ID
  'seu_cliente_secret'      -- Cliente Secret
);
```

### 2. Campos Obrigatórios

- **banco**: `"001"` (código do Banco do Brasil)
- **modalidadeApi**: `"002 - Pix"` (identificador da modalidade PIX)
- **developerAppKey**: Chave de desenvolvedor fornecida pelo BB
- **clienteId**: ID do cliente OAuth2
- **clienteSecret**: Secret do cliente OAuth2

## 📡 Endpoints Disponíveis

### 1. Consultar Transações PIX

```http
GET /api/pix/transacoes?inicio=2024-01-01&fim=2024-01-01
```

**Parâmetros:**
- `inicio` (obrigatório): Data de início no formato `YYYY-MM-DD`
- `fim` (obrigatório): Data de fim no formato `YYYY-MM-DD`

**⚠️ Limitação:** Período máximo de **5 dias** (limitação da API do Banco do Brasil)

**Formato Interno:** O sistema converte automaticamente para RFC 3339 com fuso UTC-3:
- Entrada: `2024-01-01` 
- Enviado para API: `2024-01-01T00:00:00.000-03:00` até `2024-01-01T23:59:59.999-03:00`

**Resposta:**
```json
{
  "transacoes": [
    {
      "endToEndId": "E12345678202401151234567890",
      "txid": "12345678-1234-1234-1234-123456789012",
      "valor": "100.50",
      "horario": "2024-01-15T10:30:00.000Z",
      "pagador": {
        "cpf": "12345678901",
        "nome": "João Silva"
      },
      "recebedor": {
        "cnpj": "12345678000195",
        "nome": "Empresa XYZ"
      },
      "chave": "12345678901",
      "descricao": "Pagamento de serviços"
    }
  ],
  "total": 1,
  "periodoInicio": "2024-01-01T00:00:00.000-03:00",
  "periodoFim": "2024-01-01T23:59:59.999-03:00",
  "consultadoEm": "2024-01-15T15:30:00.000Z"
}
```

### 2. Health Check

```http
GET /api/pix/health
```

**Resposta (Sucesso):**
```json
{
  "status": "healthy",
  "message": "Serviço PIX operacional",
  "timestamp": "2024-01-15T15:30:00.000Z",
  "configurado": true,
  "credenciaisEncontradas": 1
}
```

**Resposta (Erro):**
```json
{
  "status": "unhealthy",
  "message": "Credenciais PIX não configuradas no sistema",
  "timestamp": "2024-01-15T15:30:00.000Z",
  "configurado": false
}
```

## 🔒 Segurança e Limitações

### Limitações de Consulta
- **Período máximo**: 5 dias por consulta (limitação da API do BB)
- **Paginação**: Máximo de 100 transações por página
- **Rate limiting**: Configurado no nível do módulo (10 req/min, 100 req/hora)

### Validações
- Datas devem estar no formato `YYYY-MM-DD`
- Data de início não pode ser posterior à data de fim
- Credenciais devem estar cadastradas e válidas
- Token OAuth2 é cacheado por segurança e performance

## 🛠️ Como Usar

### 1. Verificar Configuração

Primeiro, verifique se o serviço está configurado:

```bash
curl -X GET "http://localhost:3000/api/pix/health"
```

### 2. Consultar Transações

**Exemplo - Consultar transações de hoje:**
```bash
curl -X GET "http://localhost:5002/api/pix/transacoes?inicio=2025-01-16&fim=2025-01-16"
```

**Exemplo - Consultar transações dos últimos 3 dias:**
```bash
curl -X GET "http://localhost:5002/api/pix/transacoes?inicio=2025-01-13&fim=2025-01-16"
```

### 3. Usar no Frontend

```javascript
// Exemplo usando axios
const consultarPix = async (inicio, fim) => {
  try {
    const response = await axios.get('/api/pix/transacoes', {
      params: { inicio, fim }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar PIX:', error.response.data);
    throw error;
  }
};

// Uso
const transacoes = await consultarPix('2024-01-01', '2024-01-31');
console.log(`${transacoes.total} transações encontradas`);
```

## 🐛 Tratamento de Erros

### Códigos de Erro Comuns

- **400 Bad Request**: Parâmetros inválidos (datas malformadas, período muito longo)
- **404 Not Found**: Credenciais PIX não encontradas
- **500 Internal Server Error**: Erro na API do BB ou problema interno

### Exemplo de Resposta de Erro

```json
{
  "error": "Data de início não pode ser posterior à data de fim",
  "code": "BAD_REQUEST"
}
```

## 📊 Monitoramento

### Logs Importantes

O módulo gera logs detalhados para monitoramento:

```
🚀 [PIX-CONTROLLER] Recebida requisição de consulta de transações PIX
🔐 [PIX-SERVICE] Obtendo novo token de acesso...
✅ [PIX-SERVICE] Token obtido com sucesso
🔍 [PIX-SERVICE] Consultando transações PIX de 2024-01-01 até 2024-01-31
📄 [PIX-SERVICE] Consultando página 1
✅ [PIX-SERVICE] Consulta finalizada: 15 transações encontradas
✅ [PIX-CONTROLLER] Consulta realizada com sucesso
```

### Métricas Recomendadas

- Número de consultas por dia
- Tempo médio de resposta
- Taxa de erro nas consultas
- Uso de cache de token

## 🔮 Próximos Passos

### Funcionalidades Futuras

1. **Webhook PIX**: Receber notificações automáticas de novos PIX
2. **Integração com Pedidos**: Associar transações PIX automaticamente aos pedidos
3. **Relatórios**: Gerar relatórios consolidados de PIX recebidos
4. **Filtros Avançados**: Filtrar por valor, pagador, descrição, etc.
5. **Exportação**: Exportar dados para Excel/PDF

### Integração com Sistema de Pagamentos

```typescript
// Futuro: Associar PIX automaticamente aos pagamentos
async associarPixAPedido(endToEndId: string, pedidoId: number) {
  // Buscar transação PIX
  // Associar ao pagamento do pedido
  // Atualizar status do pedido
}
```

## 📝 Notas Técnicas

### Tecnologias Utilizadas

- **NestJS**: Framework principal
- **Prisma**: ORM para acesso ao banco de dados
- **Axios**: Cliente HTTP para comunicação com API BB
- **Class Validator**: Validação de DTOs
- **Swagger**: Documentação da API

### Arquitetura

- **Controller**: Gerencia requisições HTTP e validações
- **Service**: Contém lógica de negócio e integração com API BB
- **DTOs**: Validação e tipagem de dados
- **Utils**: Cliente HTTP reutilizável para APIs do BB

### Cache de Token

O token OAuth2 é cacheado em memória para otimizar performance:
- Expiração automática (60 segundos antes do tempo real)
- Renovação transparente quando necessário
- Logs detalhados para monitoramento

---

## 🤝 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do sistema
2. Teste o endpoint de health check
3. Confirme se as credenciais estão cadastradas corretamente
4. Verifique a documentação da API do Banco do Brasil

**Desenvolvido com ❤️ para o Sistema Alencar Frutas**
