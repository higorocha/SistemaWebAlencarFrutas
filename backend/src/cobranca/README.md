# Módulo de Cobrança - Integração com API de Boletos do Banco do Brasil

Este módulo fornece integração completa com a API de Cobrança do Banco do Brasil, permitindo gerenciar boletos de cobrança bancária de forma automatizada.

## 🚀 Funcionalidades

- ✅ **Criação de Boletos**: Gera boletos vinculados a pedidos
- ✅ **Consulta Individual**: Consulta dados completos de um boleto específico
- ✅ **Listagem com Filtros**: Lista boletos com múltiplos filtros (data, status, pagador, etc.)
- ✅ **Alteração de Boletos**: Altera dados de boletos já registrados (após 30 minutos)
- ✅ **Baixa/Cancelamento**: Baixa ou cancela boletos (após 30 minutos)
- ✅ **Baixa Operacional**: Consulta boletos pagos (baixa operacional)
- ✅ **Retorno de Movimento**: Consulta movimentos de retorno vinculados aos boletos
- ✅ **Webhooks**: Recebe notificações de pagamento em tempo real
- ✅ **Autenticação OAuth2**: Gerenciamento automático de tokens com cache inteligente
- ✅ **Auditoria Completa**: Logs de todas as operações realizadas
- ✅ **Validação Robusta**: Validação de payloads antes de enviar ao BB

## 📁 Estrutura do Módulo

```
src/cobranca/
├── dto/                          # DTOs para validação e tipagem
│   ├── criar-boleto.dto.ts
│   ├── alterar-boleto.dto.ts
│   ├── listar-boletos.dto.ts
│   ├── consultar-boleto.dto.ts
│   ├── baixar-boleto.dto.ts
│   ├── baixa-operacional.dto.ts
│   ├── retorno-movimento.dto.ts
│   ├── boleto-response.dto.ts
│   └── index.ts
├── utils/                        # Utilitários
│   ├── bb-cobranca-client.ts    # Cliente HTTP específico
│   ├── formatadores-bb.ts      # Formatadores de dados
│   ├── gerador-numero-titulo.ts  # Geração de numeroTituloBeneficiario
│   ├── gerador-nosso-numero.ts  # Geração de nosso número (dev)
│   └── validador-payload.ts     # Validação de payloads
├── services/                     # Services
│   ├── cobranca.service.ts       # Service principal
│   ├── cobranca-auth.service.ts  # Service de autenticação
│   └── boleto-log.service.ts    # Service de logs
├── cobranca.controller.ts        # Controller REST
├── webhook.controller.ts         # Controller de webhooks
├── cobranca.module.ts           # Módulo NestJS
└── README.md                     # Esta documentação
```

## 🔧 Configuração

### 1. Credenciais no Banco de Dados

Antes de usar o módulo, você deve cadastrar as credenciais de Cobrança na tabela `CredenciaisAPI`:

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
  '001 - Cobrança',         -- Modalidade Cobrança
  'sua_developer_app_key',  -- Developer Application Key
  'seu_cliente_id',         -- Cliente ID
  'seu_cliente_secret'      -- Cliente Secret
);
```

### 2. Convênio de Cobrança

O convênio de cobrança deve estar cadastrado na tabela `ConvenioCobranca`:

```sql
INSERT INTO convenio_cobranca (
  conta_corrente_id,
  convenio,
  carteira,
  variacao,
  juros,
  dias_aberto,
  multa_ativa,
  valor_multa,
  carencia_multa,
  boleto_pix
) VALUES (
  1,                        -- ID da conta corrente
  '3128557',                -- Número do convênio (7 dígitos)
  '17',                     -- Número da carteira
  '35',                     -- Número da variação
  1.00,                     -- Taxa de juros mensal (%)
  30,                       -- Dias para recebimento após vencimento
  true,                     -- Multa ativa
  2.00,                     -- Valor da multa (%)
  0,                        -- Carência da multa (dias)
  true                      -- Boleto com PIX
);
```

### 3. Ambiente

O sistema diferencia automaticamente entre homologação e produção usando `NODE_ENV`:

- **Produção**: `NODE_ENV=production` → Endpoints de produção
- **Homologação**: `NODE_ENV=development` ou não definido → Endpoints de homologação

**IMPORTANTE**: A única diferença entre ambientes são as URLs dos endpoints. Certificados, gw-app-key e demais dados vêm das tabelas do banco de dados.

## 📡 Endpoints Disponíveis

### 1. Criar Boleto

```http
POST /api/cobranca/boletos
```

**Body:**
```json
{
  "pedidoId": 1,
  "contaCorrenteId": 1,
  "valorOriginal": 123.45,
  "dataVencimento": "2026-12-31",
  "mensagemBloquetoOcorrencia": "Pagamento referente ao pedido PED-2026-0001"
}
```

**Resposta:**
```json
{
  "id": 1,
  "pedidoId": 1,
  "valorOriginal": 123.45,
  "dataVencimento": "2026-12-31T00:00:00.000Z",
  "statusBoleto": "ABERTO",
  "nossoNumero": "00031285570000030000",
  "numeroTituloBeneficiario": "PED-2026-0001",
  "linhaDigitavel": "00190.00009 01234.567890 12345.678901 2 98760000012345",
  "codigoBarras": "00198760000012345000000012345678901234567890",
  "qrCodePix": "https://...",
  "txidPix": "...",
  "urlPix": "..."
}
```

### 2. Consultar Boleto

```http
GET /api/cobranca/boletos/:nossoNumero?numeroConvenio=3128557&contaCorrenteId=1
```

### 3. Listar Boletos

```http
GET /api/cobranca/boletos?indicadorSituacao=A&agenciaBeneficiario=452&contaBeneficiario=123873&boletoVencido=N&contaCorrenteId=1
```

### 4. Alterar Boleto

```http
PATCH /api/cobranca/boletos/:nossoNumero
```

**Body:**
```json
{
  "novaDataVencimento": "2026-12-31",
  "novoValorNominal": 150.00,
  "cobrarJuros": true,
  "cobrarMulta": true
}
```

**⚠️ Restrições:**
- Boleto deve estar "em ser" (ABERTO ou PROCESSANDO)
- Deve ter passado pelo menos 30 minutos desde a criação

### 5. Baixar/Cancelar Boleto

```http
POST /api/cobranca/boletos/:nossoNumero/baixar
```

**Body:**
```json
{
  "numeroConvenio": "3128557"
}
```

**⚠️ Restrições:**
- Boleto deve estar "em ser"
- Deve ter passado pelo menos 30 minutos desde a criação

### 6. Consultar Baixa Operacional

```http
GET /api/cobranca/boletos-baixa-operacional?agencia=452&conta=123873&carteira=17&variacao=35&dataInicioAgendamentoTitulo=01.05.2026&dataFimAgendamentoTitulo=31.05.2026&contaCorrenteId=1
```

### 7. Consultar Retorno de Movimento

```http
POST /api/cobranca/convenios/:convenioId/listar-retorno-movimento?contaCorrenteId=1
```

**Body:**
```json
{
  "dataMovimentoRetornoInicial": "13/02/2026",
  "dataMovimentoRetornoFinal": "18/02/2026",
  "numeroRegistroPretendido": "001",
  "quantidadeRegistroPretendido": 1000
}
```

### 8. Webhook de Pagamento

```http
POST /api/cobranca/webhook
```

**⚠️ Este endpoint é chamado pelo Banco do Brasil, não pelo frontend.**

## 🔐 Segurança

### Autenticação

- Todos os endpoints (exceto webhook) requerem autenticação JWT via `@UseGuards(JwtAuthGuard)`
- O webhook usa autenticação mútua via certificado TLS (validado pelo servidor)

### Auditoria

Todas as operações são registradas em `BoletoLog` com:
- Tipo de operação
- Dados antes e depois
- Usuário que executou
- IP do usuário
- Timestamp

## 📊 Geração de Números

### numeroTituloBeneficiario (Seu Número)

- Baseado em `numeroPedido` (formato: `PED-{ANO}-{SEQUENCIAL}`)
- Primeiro boleto: `PED-2026-0001`
- Boletos subsequentes: `PED-2026-0001-1`, `PED-2026-0001-2`, etc.
- Máximo 15 caracteres

### numeroTituloCliente (Nosso Número)

- **Desenvolvimento**: Gerado localmente usando `ControleSequencialBoleto`
- **Produção**: Omitido (BB gera automaticamente para convênio tipo 3)
- Formato: `000{convenio7digitos}{sequencial10digitos}`

## 🔄 Fluxo de Criação de Boleto

1. Validar DTO de entrada
2. Buscar `ConvenioCobranca` e `CredenciaisAPI`
3. Buscar `Pedido` e `Cliente` (pagador)
4. Gerar `numeroTituloBeneficiario` baseado no pedido
5. Gerar `numeroTituloCliente` (apenas em dev)
6. Preparar payload do BB (formatar datas, valores, CPF/CNPJ)
7. Obter token OAuth2
8. Registrar boleto no BB
9. Salvar no banco local com status `PROCESSANDO`
10. Atualizar com resposta do BB
11. Criar log de auditoria
12. Retornar boleto criado

## 📝 Formatação de Dados

### Datas
- Formato BB: `dd.mm.aaaa` (ex: `31.12.2026`)
- Formato interno: `YYYY-MM-DD` (ex: `2026-12-31`)

### Valores
- Formato BB: `123.45` (decimal com ponto)
- Formato interno: `number` (ex: `123.45`)

### CPF/CNPJ
- **IMPORTANTE**: Mantém zeros à esquerda (regra específica para `numeroInscricao`)
- Remove apenas caracteres não numéricos
- Exemplo: `075.113.750-22` → `07511375022` (mantém zeros)

## ⚠️ Regras Importantes

### Convênio Tipo 3

- BB gera o nosso número automaticamente
- Não enviar `numeroTituloCliente` em produção
- Enviar apenas em desenvolvimento para testes

### Juros e Multa

- Valores obtidos de `ConvenioCobranca`
- Não hardcodar
- Permitir configuração por conta

### Restrições de Tempo

- Alteração: Mínimo 30 minutos após criação
- Baixa: Mínimo 30 minutos após criação

### Status do Boleto

- `PROCESSANDO`: Boleto sendo registrado no BB
- `ABERTO`: Boleto registrado e aguardando pagamento
- `PAGO`: Boleto pago (atualizado via webhook ou consulta)
- `BAIXADO`: Boleto cancelado/baixado manualmente
- `VENCIDO`: Boleto vencido (atualizado por job ou consulta)
- `ERRO`: Erro ao registrar no BB

## 🐛 Troubleshooting

### Erro: "Credenciais de API não encontradas"

Verifique se as credenciais estão cadastradas na tabela `CredenciaisAPI` com:
- `banco = '001'`
- `modalidadeApi = '001 - Cobrança'`
- `contaCorrenteId` correto

### Erro: "Convênio de cobrança não encontrado"

Verifique se o convênio está cadastrado na tabela `ConvenioCobranca` para a conta corrente especificada.

### Erro: "Token expirado"

O sistema renova automaticamente o token. Se o erro persistir, verifique as credenciais OAuth2.

### Erro: "Boleto não pode ser alterado/baixado"

- Verifique se o boleto está "em ser" (status `ABERTO` ou `PROCESSANDO`)
- Verifique se passaram pelo menos 30 minutos desde a criação

## 📚 Referências

- [Documentação Consolidada BB Cobrança](./DOCUMENTACAO_BB_COBRANCA.md)
- [Especificações Técnicas BB](https://www.bb.com.br/docs/pub/emp/empl/dwn/Doc5175Bloqueto.pdf)
- [Portal BB for Developers](https://developers.bb.com.br/)

## 🔜 Próximos Passos

1. Testar em homologação com dados fictícios
2. Validar layout do boleto
3. Configurar webhook no Portal BB
4. Testar webhook de pagamento
5. Implementar notificações de pagamento (se necessário)
6. Implementar job para atualizar status de boletos vencidos

---

**Última atualização:** 12/01/2026  
**Status:** ✅ Implementação completa - Pronto para testes
