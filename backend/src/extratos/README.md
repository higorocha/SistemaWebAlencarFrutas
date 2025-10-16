# Módulo Extratos - Integração com API do Banco do Brasil

Este módulo fornece integração completa com a API de extratos do Banco do Brasil, permitindo consultar extratos bancários da conta configurada no sistema.

## 🚀 Funcionalidades

- ✅ **Consulta de Extratos**: Busca extratos bancários em período específico
- ✅ **Extratos Mensais**: Consulta automática com cache inteligente
- ✅ **Consulta por Período**: Formato de data amigável (DD-MM-YYYY)
- ✅ **Autenticação OAuth2**: Gerenciamento automático de tokens com cache inteligente
- ✅ **Paginação Automática**: Consulta todas as páginas automaticamente (até 200 lançamentos por página)
- ✅ **Validação de Dados**: Validação robusta de parâmetros e respostas
- ✅ **Health Check**: Endpoint para verificar se o serviço está operacional
- ✅ **Documentação Swagger**: API totalmente documentada
- ✅ **Logs Detalhados**: Logging completo para monitoramento e debug
- ✅ **Cache Inteligente**: Cache de token e extratos mensais para otimização

## 📁 Estrutura do Módulo

```
src/extratos/
├── dto/
│   └── extratos.dto.ts          # DTOs para validação e tipagem
├── extratos.controller.ts       # Controller com endpoints REST
├── extratos.service.ts          # Service com lógica de negócio
├── extratos.module.ts          # Módulo NestJS
└── README.md                   # Esta documentação
```

## 🔧 Configuração

### 1. Formato de Datas (Documentação Oficial BB)

A API de extratos do Banco do Brasil utiliza formato específico para datas. **IMPORTANTE**: O sistema remove zeros à esquerda automaticamente.

#### Formatos Aceitos:

**Para consulta básica:**
- **Entrada**: `DDMMYYYY` (ex: `01122024`)
- **Processado**: `1122024` (zeros à esquerda removidos)

**Para consulta por período:**
- **Entrada**: `DD-MM-YYYY` (ex: `01-12-2024`)
- **Processado**: `1122024` (convertido para formato da API)

#### Exemplo Prático:
Para consultar o período 01/12/2024 até 31/12/2024:

**Formato básico:**
- Início: `01122024` → processado como `1122024`
- Fim: `31122024` → processado como `31122024`

**Formato período:**
- Início: `01-12-2024` → processado como `1122024`
- Fim: `31-12-2024` → processado como `31122024`

### 2. Credenciais no Banco de Dados

Antes de usar o módulo, você deve cadastrar as credenciais de extratos na tabela `CredenciaisAPI`:

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
  '003 - Extratos',         -- Modalidade Extratos
  'sua_developer_app_key',  -- Developer Application Key
  'seu_cliente_id',         -- Cliente ID
  'seu_cliente_secret'      -- Cliente Secret
);
```

### 3. Conta Corrente no Banco de Dados

Você também deve cadastrar a conta corrente na tabela `ContaCorrente`:

```sql
INSERT INTO conta_corrente (
  agencia,
  conta_corrente,
  banco,
  nome_banco
) VALUES (
  '2273',                   -- Agência
  '23087',                  -- Conta corrente
  '001',                    -- Código do Banco do Brasil
  'Banco do Brasil'         -- Nome do banco
);
```

### 4. Campos Obrigatórios

**Credenciais:**
- **banco**: `"001"` (código do Banco do Brasil)
- **modalidadeApi**: `"003 - Extratos"` (identificador da modalidade extratos)
- **developerAppKey**: Chave de desenvolvedor fornecida pelo BB
- **clienteId**: ID do cliente OAuth2
- **clienteSecret**: Secret do cliente OAuth2

**Conta Corrente:**
- **agencia**: Número da agência
- **contaCorrente**: Número da conta corrente
- **banco**: `"001"` (código do Banco do Brasil)

## 📡 Endpoints Disponíveis

### 1. Consultar Extratos

```http
GET /api/extratos?dataInicio=01122024&dataFim=31122024
```

**Parâmetros:**
- `dataInicio` (obrigatório): Data de início no formato `DDMMYYYY`
- `dataFim` (obrigatório): Data de fim no formato `DDMMYYYY`

**Resposta:**
```json
{
  "lancamentos": [
    {
      "dataLancamento": "2024-12-01",
      "dataEfetivaLancamento": "2024-12-01",
      "descricao": "PIX RECEBIDO",
      "numeroDocumento": "123456789",
      "valorLancamento": "100.50",
      "situacao": "EFETIVADO",
      "dadosBancarios": "PIX",
      "nomeFavorecido": "João Silva",
      "cpfCnpjFavorecido": "12345678901"
    }
  ],
  "total": 1,
  "periodoInicio": "1122024",
  "periodoFim": "31122024",
  "consultadoEm": "2024-12-15T15:30:00.000Z",
  "contaInfo": {
    "agencia": "2273",
    "conta": "23087",
    "banco": "001"
  }
}
```

### 2. Consultar Extratos Mensais

```http
GET /api/extratos/mensal
```

**Funcionalidades:**
- Consulta do início do mês até ontem
- No primeiro dia do mês, consulta o mês anterior inteiro
- Cache inteligente para evitar consultas repetidas no mesmo dia

**Resposta:**
```json
{
  "lancamentos": [...],
  "total": 15,
  "periodo": "112024 a 14122024",
  "consultadoEm": "2024-12-15T15:30:00.000Z",
  "origem": "api"
}
```

### 3. Consultar Extratos por Período

```http
GET /api/extratos/periodo?inicio=01-12-2024&fim=31-12-2024
```

**Parâmetros:**
- `inicio` (obrigatório): Data de início no formato `DD-MM-YYYY`
- `fim` (obrigatório): Data de fim no formato `DD-MM-YYYY`

**Validações:**
- Não permite consultar datas futuras
- Valida formato de data
- Verifica se data de início não é posterior à data de fim

### 4. Health Check

```http
GET /api/extratos/health
```

**Resposta (Sucesso):**
```json
{
  "status": "healthy",
  "message": "Serviço de extratos operacional",
  "timestamp": "2024-12-15T15:30:00.000Z",
  "configurado": true,
  "credenciaisEncontradas": 1,
  "contaInfo": {
    "agencia": "2273",
    "conta": "23087",
    "banco": "001"
  }
}
```

**Resposta (Erro):**
```json
{
  "status": "unhealthy",
  "message": "Credenciais de extratos não configuradas no sistema",
  "timestamp": "2024-12-15T15:30:00.000Z",
  "configurado": false
}
```

## 🔒 Segurança e Limitações

### Limitações de Consulta
- **Paginação**: Máximo de 200 lançamentos por página
- **Rate limiting**: Configurado no nível do módulo (10 req/min, 100 req/hora)
- **Timeout**: 30 segundos para requisições à API do BB

### Validações
- Datas devem estar nos formatos especificados
- Data de início não pode ser posterior à data de fim
- Não permite consultar datas futuras
- Credenciais e conta corrente devem estar cadastradas e válidas
- Token OAuth2 é cacheado por segurança e performance

## 🛠️ Como Usar

### 1. Verificar Configuração

Primeiro, verifique se o serviço está configurado:

```bash
curl -X GET "http://localhost:3000/api/extratos/health"
```

### 2. Consultar Extratos

**Exemplo - Consultar extratos de hoje:**
```bash
curl -X GET "http://localhost:5002/api/extratos?dataInicio=15122024&dataFim=15122024"
```

**Exemplo - Consultar extratos do mês:**
```bash
curl -X GET "http://localhost:5002/api/extratos?dataInicio=01122024&dataFim=31122024"
```

**Exemplo - Consultar extratos mensais:**
```bash
curl -X GET "http://localhost:5002/api/extratos/mensal"
```

**Exemplo - Consultar por período:**
```bash
curl -X GET "http://localhost:5002/api/extratos/periodo?inicio=01-12-2024&fim=31-12-2024"
```

### 3. Usar no Frontend

```javascript
// Exemplo usando axios
const consultarExtratos = async (dataInicio, dataFim) => {
  try {
    const response = await axios.get('/api/extratos', {
      params: { dataInicio, dataFim }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar extratos:', error.response.data);
    throw error;
  }
};

// Uso
const extratos = await consultarExtratos('01122024', '31122024');
console.log(`${extratos.total} lançamentos encontrados`);
```

## 🐛 Tratamento de Erros

### Códigos de Erro Comuns

- **400 Bad Request**: Parâmetros inválidos (datas malformadas, período inválido, datas futuras)
- **404 Not Found**: Credenciais de extratos ou conta corrente não encontradas
- **500 Internal Server Error**: Erro na API do BB ou problema interno
- **503 Service Unavailable**: Serviço indisponível (credenciais não configuradas)

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
🚀 [EXTRATOS-CONTROLLER] Recebida requisição de consulta de extratos
🔐 [EXTRATOS-SERVICE] Obtendo novo token de acesso...
✅ [EXTRATOS-SERVICE] Token obtido com sucesso
🔍 [EXTRATOS-SERVICE] Consultando extratos de 112024 até 31122024
📄 [EXTRATOS-SERVICE] Consultando página 1
✅ [EXTRATOS-SERVICE] Consulta finalizada: 15 lançamentos encontrados
✅ [EXTRATOS-CONTROLLER] Consulta realizada com sucesso
```

### Métricas Recomendadas

- Número de consultas por dia
- Tempo médio de resposta
- Taxa de erro nas consultas
- Uso de cache de token e extratos mensais
- Número de lançamentos consultados

## 🔮 Próximos Passos

### Funcionalidades Futuras

1. **Relatórios**: Gerar relatórios consolidados de extratos
2. **Filtros Avançados**: Filtrar por valor, descrição, tipo de lançamento, etc.
3. **Exportação**: Exportar dados para Excel/PDF
4. **Integração com Pedidos**: Associar lançamentos automaticamente aos pedidos
5. **Alertas**: Notificações para lançamentos específicos
6. **Dashboard**: Visualização gráfica dos extratos

### Integração com Sistema de Pagamentos

```typescript
// Futuro: Associar lançamentos automaticamente aos pagamentos
async associarLancamentoAPedido(numeroDocumento: string, pedidoId: number) {
  // Buscar lançamento
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

### Cache de Token e Dados

O token OAuth2 e extratos mensais são cacheados em memória para otimizar performance:
- **Token**: Expiração automática (60 segundos antes do tempo real)
- **Extratos Mensais**: Cache por dia para evitar consultas repetidas
- **Renovação**: Transparente quando necessário
- **Logs**: Detalhados para monitoramento

### Formato de Datas

O sistema lida com múltiplos formatos de data:
- **Entrada**: `DDMMYYYY` ou `DD-MM-YYYY`
- **Processamento**: Remove zeros à esquerda automaticamente
- **API**: Formato específico do Banco do Brasil
- **Validação**: Verifica datas futuras e períodos inválidos

---

## 🤝 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do sistema
2. Teste o endpoint de health check
3. Confirme se as credenciais e conta corrente estão cadastradas corretamente
4. Verifique a documentação da API do Banco do Brasil

**Desenvolvido com ❤️ para o Sistema Alencar Frutas**
