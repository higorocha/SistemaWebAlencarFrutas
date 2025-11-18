# 📚 Documentação Consolidada: Sistema de Controle de Pagamentos API BB

## 🎯 Visão Geral

Sistema completo de controle e rastreabilidade de pagamentos via API do Banco do Brasil, incluindo **PIX**, **Boletos** e **Guias**, com persistência no banco de dados, consultas individuais, pagamento consolidado e preparação para webhook.

### Status Atual: 95% Concluído

**✅ Implementado:**
- Persistência completa de lotes e itens
- Consultas de lote e individuais
- Pagamento consolidado (1 transferência para múltiplas colheitas)
- Relacionamento N:N com tabelas de origem
- Rastreabilidade completa
- Auditoria completa

**⚠️ Pendente:**
- Jobs para consultar status automaticamente
- Webhook para receber atualizações do BB (vide seção 🔔 Webhook de Pagamentos)

---

## 📊 Modelo de Banco de Dados

### Estrutura Geral

O sistema utiliza **4 tabelas principais** para controlar todos os pagamentos:

1. **`sequencia_numero_requisicao`** - Controle de números sequenciais
2. **`pagamento_api_lote`** - Controle de lotes de pagamento
3. **`pagamento_api_item`** - Controle de itens individuais
4. **`pagamento_api_item_colheita`** - Relacionamento N:N (Pagamento ↔ Colheitas)

---

## 🗄️ Tabelas Detalhadas

### 1. `sequencia_numero_requisicao`

**Propósito:** Controlar números sequenciais de requisição (1, 2, 3...)

**Campos:**
- `id` (Int, PK) - Identificador único
- `ultimoNumero` (Int) - Último número usado (inicia em 0)
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Lógica:**
- A tabela é **inicializada automaticamente** na primeira requisição de pagamento
- Não é necessário executar script manual de seed
- Usa **transação** para garantir atomicidade e evitar race conditions
- Cada nova requisição incrementa `ultimoNumero` em 1

**Exemplo:**
```sql
-- Primeira requisição: ultimoNumero = 0 → numeroRequisicao = 1
-- Segunda requisição: ultimoNumero = 1 → numeroRequisicao = 2
-- Terceira requisição: ultimoNumero = 2 → numeroRequisicao = 3
```

---

### 2. `pagamento_api_lote`

**Propósito:** Controlar lotes de pagamento enviados ao BB

**Campos Principais:**

#### Identificação
- `id` (Int, PK) - Identificador único
- `numeroRequisicao` (Int, UNIQUE) - Número sequencial único (1, 2, 3...)
- `numeroContrato` (Int) - Convênio PGT (ex: 731030)
- `tipoPagamento` (Int) - 126=Fornecedores, 128=Diversos
- `tipoPagamentoApi` (Enum) - PIX, BOLETO, GUIA

#### Conta Utilizada
- `contaCorrenteId` (Int, FK) - Relacionamento com `ContaCorrente`

#### Dados Enviados
- `payloadEnviado` (Json) - Payload completo enviado ao BB
- `quantidadeEnviada` (Int) - Quantidade de itens enviados
- `valorTotalEnviado` (Decimal) - Valor total enviado

#### Dados Recebidos (Resposta Inicial)
- `payloadResposta` (Json?) - Resposta completa do BB
- `estadoRequisicao` (Int?) - Estado retornado pelo BB (1-10)
- `quantidadeValida` (Int?) - Quantidade aceita pelo BB
- `valorTotalValido` (Decimal?) - Valor total aceito

#### Status do Processamento
- `status` (Enum) - PENDENTE, ENVIADO, PROCESSANDO, CONCLUIDO, PARCIAL, REJEITADO, ERRO
- `processadoComSucesso` (Boolean) - Se foi processado com sucesso
- `dataProcessamento` (DateTime?) - Data do processamento

#### Controle de Atualização
- `ultimaConsultaStatus` (DateTime?) - Última vez que consultamos o status no BB
- `ultimaAtualizacaoWebhook` (DateTime?) - Última atualização recebida via webhook
- `estadoRequisicaoAtual` (Int?) - Estado atual (pode mudar após consulta/webhook)
- `payloadRespostaAtual` (Json?) - Resposta mais recente (após consulta/webhook)

#### Auditoria
- `observacoes` (String?) - Observações sobre o lote
- `erroProcessamento` (String?) - Erro no processamento (se houver)
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

#### Rastreamento por Usuário
- `usuarioCriacaoId` (Int?, FK) - ID do usuário que criou o lote
- `usuarioCriacao` (Usuario?) - Relacionamento com usuário que criou
- `usuarioLiberacaoId` (Int?, FK) - ID do usuário que liberou o lote
- `usuarioLiberacao` (Usuario?) - Relacionamento com usuário que liberou
- `dataLiberacao` (DateTime?) - Data/hora da liberação

#### Relacionamentos
- `itensPagamento` (PagamentoApiItem[]) - Itens do lote (1:N)

**Lógica:**
- Cada lote representa **1 requisição** enviada ao BB
- O lote pode conter **1 ou N itens** (transferências, boletos, guias)
- O status do lote é atualizado automaticamente nas consultas
- Todos os payloads são salvos em JSON para rastreabilidade completa

---

### 3. `pagamento_api_item`

**Propósito:** Controlar itens individuais dentro de um lote

**Campos Principais:**

#### Relacionamento com Lote
- `id` (Int, PK) - Identificador único
- `loteId` (Int, FK) - Relacionamento com `PagamentoApiLote`
- `indiceLote` (Int) - Posição na lista (0, 1, 2...)

#### Dados Enviados (Campos Comuns)
- `valorEnviado` (Decimal) - Valor do item enviado
- `dataPagamentoEnviada` (String) - Data no formato ddmmaaaa
- `descricaoEnviada` (String?) - Descrição do pagamento
- `payloadItemEnviado` (Json) - Dados completos do item enviado

#### Dados Específicos de PIX
- `descricaoInstantaneoEnviada` (String?) - Descrição para conciliação
- `chavePixEnviada` (String?) - Chave PIX
- `tipoChavePixEnviado` (Int?) - 1=Telefone, 2=Email, 3=CPF/CNPJ, 4=Chave Aleatória
- `identificadorPagamento` (String?) - Identificador PIX retornado pelo BB
- `indicadorMovimentoAceito` (String?) - "S" ou "N" (resposta inicial)
- `indicadorMovimentoAceitoAtual` (String?) - "S" ou "N" (status atual)

#### Dados Específicos de BOLETO
- `numeroCodigoBarras` (String?) - Código de barras (44 dígitos)
- `codigoIdentificadorPagamento` (String?) - Identificador boleto retornado pelo BB
- `indicadorAceite` (String?) - "S" ou "N" (resposta inicial)
- `indicadorAceiteAtual` (String?) - "S" ou "N" (status atual)
- `valorNominal` (Decimal?) - Valor original do boleto
- `valorDesconto` (Decimal?) - Valor do desconto
- `valorMoraMulta` (Decimal?) - Valor de mora/multa

#### Dados Específicos de GUIA
- `codigoPagamento` (String?) - Identificador GUIA retornado pelo BB
- `codigoBarrasGuia` (String?) - Código de barras (44 dígitos, sem dígitos verificadores)
- `nomeBeneficiario` (String?) - Nome do beneficiário/convenente
- `indicadorAceiteGuia` (String?) - "S" ou "N" (resposta inicial)
- `indicadorAceiteGuiaAtual` (String?) - "S" ou "N" (status atual)

#### Dados da Resposta (Resposta Inicial)
- `erros` (Json?) - Array de erros retornados pelo BB
- `payloadItemResposta` (Json?) - Resposta completa do item (resposta inicial)

#### Dados Atualizados (Via Consulta ou Webhook)
- `payloadItemRespostaAtual` (Json?) - Resposta mais recente
- `ultimaAtualizacaoStatus` (DateTime?) - Última atualização de status

#### Dados da Consulta Individual
- `estadoPagamentoIndividual` (String?) - Estado do pagamento individual:
  - Consistente, Inconsistente, Pendente, Agendado, Rejeitado, Cancelado, Devolvido, Bloqueado, Aguardando débito, Debitado, Vencido, Pago
- `payloadConsultaIndividual` (Json?) - Resposta completa da consulta individual
- `ultimaConsultaIndividual` (DateTime?) - Última consulta individual realizada
- `listaDevolucao` (Json?) - Array de devoluções (BOLETO e GUIA)

#### Relacionamentos Polimórficos
- `fornecedorPagamentoId` (Int?, FK) - Se for pagamento de fornecedor
- `funcionarioPagamentoId` (Int?, FK) - Se for pagamento de funcionário (futuro)
- `colheitas` (PagamentoApiItemColheita[]) - Relacionamento N:N com `TurmaColheitaPedidoCusto`

#### Status do Item
- `status` (Enum) - PENDENTE, ENVIADO, ACEITO, REJEITADO, PROCESSADO, ERRO
- `processadoComSucesso` (Boolean) - Se foi processado com sucesso

#### Rastreamento por Usuário
- `usuarioCancelamentoId` (Int?, FK) - ID do usuário que cancelou o item
- `usuarioCancelamento` (Usuario?) - Relacionamento com usuário que cancelou
- `dataCancelamento` (DateTime?) - Data/hora do cancelamento

#### Auditoria
- `observacoes` (String?) - Observações sobre o item
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Lógica:**
- Cada item representa **1 pagamento individual** dentro de um lote
- Para **PIX**: 1 item = 1 transferência PIX
- Para **BOLETO**: 1 item = 1 boleto
- Para **GUIA**: 1 item = 1 guia
- Campos específicos são preenchidos apenas para o tipo correspondente (PIX, BOLETO ou GUIA)
- Status é atualizado automaticamente nas consultas

---

### 4. `pagamento_api_item_colheita`

**Propósito:** Relacionamento N:N entre `PagamentoApiItem` e `TurmaColheitaPedidoCusto`

**Campos:**
- `id` (Int, PK) - Identificador único
- `pagamentoApiItemId` (Int, FK) - Relacionamento com `PagamentoApiItem`
- `turmaColheitaCustoId` (Int, FK) - Relacionamento com `TurmaColheitaPedidoCusto`
- `valorColheita` (Decimal) - Valor individual da colheita (para rastreabilidade)
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Constraint:**
- `@@unique([pagamentoApiItemId, turmaColheitaCustoId])` - Evita relacionamentos duplicados

**Lógica:**
- Permite que **1 único `PagamentoApiItem`** (1 transferência PIX) pague **múltiplas colheitas**
- Cada registro relaciona 1 item de pagamento com 1 colheita
- Armazena o `valorColheita` individual para rastreabilidade
- Usado para **pagamento consolidado** (1 transferência para N colheitas)

**Exemplo:**
```
PagamentoApiItem (ID: 1, Valor: R$ 1.000,00)
  ├── PagamentoApiItemColheita (Colheita ID: 1, Valor: R$ 100,00)
  ├── PagamentoApiItemColheita (Colheita ID: 2, Valor: R$ 200,00)
  ├── PagamentoApiItemColheita (Colheita ID: 3, Valor: R$ 300,00)
  └── PagamentoApiItemColheita (Colheita ID: 4, Valor: R$ 400,00)
```

---

## 👤 Sistema de Rastreamento por Usuário

### 🎯 Objetivo

Rastrear **qual usuário do sistema** realizou cada operação crítica nos pagamentos (criar, liberar, cancelar), permitindo auditoria completa e responsabilização.

### 📋 Mecanismo de Funcionamento

#### 1. **Criação de Pagamento (Lote)**

**Quando ocorre:**
- Usuário cria um novo pagamento via `POST /api/pagamentos/transferencias-pix`

**Como funciona:**
1. O **JWT** do usuário autenticado é validado pelo `JwtAuthGuard`
2. O `userId` é extraído de `request.user.id` no controller
3. O `userId` é passado para `solicitarTransferenciaPix(dto, usuarioId)`
4. Ao criar o `PagamentoApiLote`, o campo `usuarioCriacaoId` é preenchido
5. O relacionamento com `Usuario` é estabelecido automaticamente

**Código:**
```typescript
// Controller
async solicitarTransferenciaPix(
  @Body() dto: SolicitarTransferenciaPixDto,
  @Request() req: any
) {
  const usuarioId = req.user?.id; // Extraído do JWT
  return this.pagamentosService.solicitarTransferenciaPix(dto, usuarioId);
}

// Service
const lote = await this.prisma.pagamentoApiLote.create({
  data: {
    // ... outros campos
    usuarioCriacaoId: usuarioId || null,
  },
});
```

**Resultado:**
- `PagamentoApiLote.usuarioCriacaoId` = ID do usuário que criou
- `PagamentoApiLote.usuarioCriacao` = Dados completos do usuário (nome, email)

---

#### 2. **Liberação de Pagamento (Lote)**

**Quando ocorre:**
- Administrador libera um lote de pagamentos via `POST /api/pagamentos/liberar`

**Como funciona:**
1. O **JWT** do usuário autenticado é validado (apenas ADMINISTRADOR)
2. O `userId` é extraído de `request.user.id` no controller
3. O `userId` é passado para `liberarPagamentos(dto, usuarioId)`
4. Ao atualizar o `PagamentoApiLote`, os campos `usuarioLiberacaoId` e `dataLiberacao` são preenchidos
5. O relacionamento com `Usuario` é estabelecido automaticamente

**Código:**
```typescript
// Controller
async liberarPagamentos(
  @Body() dto: LiberarPagamentosDto,
  @Request() req: any
) {
  const usuarioId = req.user?.id; // Extraído do JWT
  return this.pagamentosService.liberarPagamentos(dto, usuarioId);
}

// Service
const dataLiberacao = new Date();
await this.prisma.pagamentoApiLote.update({
  where: { id: lote.id },
  data: {
    usuarioLiberacaoId: usuarioId || null,
    dataLiberacao: usuarioId ? dataLiberacao : null,
    // ... outros campos
  },
});
```

**Resultado:**
- `PagamentoApiLote.usuarioLiberacaoId` = ID do usuário que liberou
- `PagamentoApiLote.usuarioLiberacao` = Dados completos do usuário (nome, email)
- `PagamentoApiLote.dataLiberacao` = Data/hora exata da liberação

---

#### 3. **Cancelamento de Pagamento (Item)**

**Quando ocorre:**
- Administrador cancela um item específico via `POST /api/pagamentos/cancelar`

**Como funciona:**
1. O **JWT** do usuário autenticado é validado (apenas ADMINISTRADOR)
2. O `userId` é extraído de `request.user.id` no controller
3. O `userId` é passado para `cancelarPagamentos(dto, usuarioId)`
4. Após confirmar que o cancelamento foi aceito pelo BB, os campos `usuarioCancelamentoId` e `dataCancelamento` são preenchidos no `PagamentoApiItem`
5. O relacionamento com `Usuario` é estabelecido automaticamente

**Código:**
```typescript
// Controller
async cancelarPagamentos(
  @Body() dto: CancelarPagamentosDto,
  @Request() req: any
) {
  const usuarioId = req.user?.id; // Extraído do JWT
  return this.pagamentosService.cancelarPagamentos(dto, usuarioId);
}

// Service
const dataCancelamento = new Date();
if (usuarioId && itensPagamento.length > 0) {
  const codigosCancelados = cancelamentosAceitos.map((p: any) => p.codigoPagamento?.toString());
  
  await Promise.all(
    itensPagamento.map(async (item) => {
      const itemCodigo = item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento;
      if (itemCodigo && codigosCancelados.includes(itemCodigo.toString())) {
        await this.prisma.pagamentoApiItem.update({
          where: { id: item.id },
          data: {
            usuarioCancelamentoId: usuarioId,
            dataCancelamento: dataCancelamento,
          },
        });
      }
    })
  );
}
```

**Resultado:**
- `PagamentoApiItem.usuarioCancelamentoId` = ID do usuário que cancelou
- `PagamentoApiItem.usuarioCancelamento` = Dados completos do usuário (nome, email)
- `PagamentoApiItem.dataCancelamento` = Data/hora exata do cancelamento

---

## 🔔 Webhook de Pagamentos (Planejado)

### Visão Geral
- A API do Banco do Brasil envia **webhooks** sempre que um pagamento em lote é efetivado.
- Evento disponível para: **Transferências**, **PIX**, **Boletos** e **Guias** (quando o estado for **Pago**).
- O payload vem em formato **JSON Array** onde cada objeto representa um pagamento individual dentro do lote.

### Payload Oficial (BB)
```json
[
  {
    "numeroRequisicaoPagamento": 147999,
    "codigoIdentificadorPagamento": "90147999731030001",
    "nomeDoFavorecido": "Nome de teste de favorecido",
    "numeroCPFouCNPJ": 99999999999999,
    "dataPagamento": "2024-05-10",
    "valorPagamento": 1.05,
    "codigoTextoEstado": 1,
    "textoEstado": "Pago",
    "codigoIdentificadorInformadoCliente": "Teste de Identificação",
    "codigoDescricaoTipoPagamento": 12845,
    "descricaoTipoPagamento": "Pagamentos Diversos Pix Transferência"
  }
]
```

### Campos e Significados
| Campo | Descrição |
|-------|-----------|
| `numeroRequisicaoPagamento` | Número sequencial enviado por nós (lote). |
| `codigoIdentificadorPagamento` | Identificador único retornado pelo BB (PIX/Boleto/Guia). |
| `nomeDoFavorecido` | Nome do favorecido. |
| `numeroCPFouCNPJ` | Documento do favorecido. |
| `dataPagamento` | Data em que o pagamento foi efetivado (formato `YYYY-MM-DD`). |
| `valorPagamento` | Valor efetivamente pago. |
| `codigoTextoEstado` | Código do estado (1=Pago, 2=Não pago). |
| `textoEstado` | Texto do estado (`Pago`, `Não pago`). |
| `codigoIdentificadorInformadoCliente` | Descrição enviada por nós (ex: número do pedido). |
| `codigoDescricaoTipoPagamento` | Código interno de modalidade (ex: `12845`). |
| `descricaoTipoPagamento` | Texto da modalidade (ex: `Pagamentos Diversos Pix Transferência`). |

### Tipos de Pagamento Cobertos (Estado = Pago)
| Código | Descrição |
|--------|-----------|
| **Transferências / Fornecedores** | 1261 Crédito em Conta, 1263 TED, 12613 Guia c/ código barras, 12621 Guia arrecadação, 12630 Títulos BB, 12631 Títulos outros bancos, 12645 Pix Transferência, 12647 Pix QR Code |
| **Pagamentos Diversos** | 1281 Crédito em Conta, 1283 TED, 12813 Guia c/ código barras, 12821 Guia arrecadação, 12830 Títulos BB, 12831 Títulos outros bancos, 12845 Pix Transferência, 12847 Pix QR Code |

### Próximos Passos
- Implementar endpoint dedicado (mTLS + autenticação BB) para receber o webhook.
- Validar certificados e assinatura semelhante ao projeto `@exemploWebhook`.
- Localizar lote/itens pelo `numeroRequisicaoPagamento` e `codigoIdentificadorPagamento`.
- Atualizar:
  - `pagamento_api_lote.ultimaAtualizacaoWebhook` / `payloadRespostaAtual`.
  - `pagamento_api_item.estadoPagamentoIndividual`, `payloadItemRespostaAtual`, `status`.
- Registrar auditoria e evitar reprocessamentos (idempotência por `codigoIdentificadorPagamento` + `textoEstado`).

> Consulte `PLANO_WEBHOOK_PAGAMENTOS.md` para a estratégia completa de implementação.

---

### 🔍 Consulta e Exibição

#### Backend - Listagem de Lotes

A query `listarLotesTurmaColheita()` inclui automaticamente os dados dos usuários:

```typescript
const lotes = await this.prisma.pagamentoApiLote.findMany({
  include: {
    usuarioCriacao: {
      select: { id: true, nome: true, email: true },
    },
    usuarioLiberacao: {
      select: { id: true, nome: true, email: true },
    },
    itensPagamento: {
      include: {
        usuarioCancelamento: {
          select: { id: true, nome: true, email: true },
        },
      },
    },
  },
});
```

**Resposta da API:**
```json
{
  "id": 1,
  "numeroRequisicao": 123,
  "usuarioCriacao": {
    "id": 5,
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "usuarioLiberacao": {
    "id": 3,
    "nome": "Maria Santos",
    "email": "maria@example.com"
  },
  "dataLiberacao": "2024-01-15T10:30:00Z",
  "itensPagamento": [
    {
      "id": 1,
      "usuarioCancelamento": {
        "id": 2,
        "nome": "Pedro Costa",
        "email": "pedro@example.com"
      },
      "dataCancelamento": "2024-01-16T14:20:00Z"
    }
  ]
}
```

#### Frontend - Exibição na Tabela

A coluna **"Operações"** na tela de Pagamentos exibe:

1. **Criado por**: Nome do usuário que criou o lote (tag azul)
2. **Liberado por**: Nome do usuário que liberou (tag verde) + data/hora
3. **Cancelado por**: Nome do usuário que cancelou (tag vermelha) + data/hora

**Tooltip detalhado:**
- Ao passar o mouse, mostra todas as operações com datas/horas completas
- Formato: `DD/MM/YYYY HH:mm:ss`

---

### 🛡️ Segurança e Validações

1. **Autenticação Obrigatória:**
   - Todas as rotas usam `@UseGuards(JwtAuthGuard)`
   - Sem autenticação, `request.user` será `undefined` e `usuarioId` será `null`

2. **Campos Nullable:**
   - Todos os campos de rastreamento são `nullable` para **backward compatibility**
   - Registros antigos (criados antes da implementação) terão `null` nos campos de usuário

3. **Integridade Referencial:**
   - `onDelete: SetNull` garante que se um usuário for deletado, os campos de rastreamento não quebram
   - Os registros de pagamento permanecem, apenas perdem a referência ao usuário

4. **Índices para Performance:**
   - Índices criados em `usuarioCriacaoId`, `usuarioLiberacaoId`, `usuarioCancelamentoId`
   - Otimiza queries que filtram por usuário

---

### 📊 Casos de Uso

#### 1. Auditoria de Criação
```sql
-- Buscar todos os pagamentos criados por um usuário específico
SELECT * FROM pagamento_api_lote 
WHERE usuario_criacao_id = 5;
```

#### 2. Auditoria de Liberação
```sql
-- Buscar todos os pagamentos liberados por um usuário específico
SELECT * FROM pagamento_api_lote 
WHERE usuario_liberacao_id = 3;
```

#### 3. Auditoria de Cancelamento
```sql
-- Buscar todos os itens cancelados por um usuário específico
SELECT * FROM pagamento_api_item 
WHERE usuario_cancelamento_id = 2;
```

#### 4. Histórico Completo de um Lote
```sql
-- Buscar histórico completo de operações de um lote
SELECT 
  l.id,
  l.numero_requisicao,
  uc.nome as criado_por,
  ul.nome as liberado_por,
  l.data_liberacao
FROM pagamento_api_lote l
LEFT JOIN usuarios uc ON l.usuario_criacao_id = uc.id
LEFT JOIN usuarios ul ON l.usuario_liberacao_id = ul.id
WHERE l.numero_requisicao = 123;
```

---

### ⚠️ Considerações Importantes

1. **Registros Antigos:**
   - Pagamentos criados antes da implementação terão `usuarioCriacaoId = null`
   - Isso é esperado e não causa problemas

2. **Usuários Deletados:**
   - Se um usuário for deletado, os campos de rastreamento ficam `null`
   - Os registros de pagamento permanecem intactos

3. **Performance:**
   - Os índices garantem que queries por usuário sejam rápidas
   - A inclusão de relacionamentos na query de listagem é otimizada pelo Prisma

4. **Privacidade:**
   - Apenas dados básicos do usuário são expostos (id, nome, email)
   - Senhas e dados sensíveis nunca são incluídos

---

## 🔄 Lógica de Funcionamento

### 1. Fluxo de Pagamento Consolidado (PIX)

#### Frontend
1. Usuário seleciona **múltiplas colheitas** no modal
2. Frontend **soma os valores** das colheitas selecionadas
3. Frontend cria **1 única transferência PIX** com valor total consolidado
4. Frontend envia `colheitaIds` (array de IDs das colheitas) no payload

#### Backend
1. Recebe payload com `listaTransferencias` (1 única transferência) e `colheitaIds` (array)
2. Valida que há **1 única transferência** quando `colheitaIds` é fornecido
3. Gera `numeroRequisicao` sequencial automaticamente
4. Cria `PagamentoApiLote` no banco de dados
5. Cria `PagamentoApiItem` (1 único item) no banco de dados
6. Cria registros em `PagamentoApiItemColheita` (N registros, 1 para cada colheita)
7. Envia requisição ao BB
8. Atualiza `PagamentoApiLote` e `PagamentoApiItem` com resposta do BB
9. Retorna resposta ao frontend

#### Banco de Dados
```
PagamentoApiLote (ID: 1, numeroRequisicao: 1, Valor: R$ 1.000,00)
  └── PagamentoApiItem (ID: 1, Valor: R$ 1.000,00)
        ├── PagamentoApiItemColheita (Colheita ID: 1, Valor: R$ 100,00)
        ├── PagamentoApiItemColheita (Colheita ID: 2, Valor: R$ 200,00)
        ├── PagamentoApiItemColheita (Colheita ID: 3, Valor: R$ 300,00)
        └── PagamentoApiItemColheita (Colheita ID: 4, Valor: R$ 400,00)
```

---

### 2. Geração de `numeroRequisicao`

#### Função: `obterProximoNumeroRequisicao()`

**Lógica:**
1. Inicia **transação** no banco de dados
2. Busca registro de sequência (deve ter apenas 1 registro)
3. Se não existe, **cria registro inicial** com `ultimoNumero = 0`
4. Incrementa `ultimoNumero` em 1
5. Atualiza registro com novo número
6. Retorna o novo número
7. Commit da transação

**Vantagens:**
- ✅ Inicialização automática (não precisa de script manual)
- ✅ Thread-safe (usa transação)
- ✅ Sequencial (1, 2, 3...)
- ✅ Sem risco de duplicação

**Exemplo:**
```typescript
// Primeira requisição
const numeroRequisicao = await obterProximoNumeroRequisicao(); // Retorna: 1

// Segunda requisição
const numeroRequisicao = await obterProximoNumeroRequisicao(); // Retorna: 2

// Terceira requisição
const numeroRequisicao = await obterProximoNumeroRequisicao(); // Retorna: 3
```

---

### 3. Mapeamento de Status

#### Função: `mapearStatusLote(estadoRequisicao)`

**Mapeamento de Estados do BB para Status Interno:**

| Estado BB | Descrição | Status Interno |
|-----------|-----------|----------------|
| 1 | Requisição com todos os lançamentos com dados consistentes | PROCESSANDO |
| 2 | Requisição com ao menos um dos lançamentos com dados inconsistentes | PROCESSANDO |
| 3 | Requisição com todos os lançamentos com dados inconsistentes | REJEITADO |
| 4 | Requisição pendente de ação pelo Conveniado | PENDENTE |
| 5 | Requisição em processamento pelo Banco | PROCESSANDO |
| 6 | Requisição Processada | CONCLUIDO |
| 7 | Requisição Rejeitada | REJEITADO |
| 8 | Preparando remessa não liberada | PROCESSANDO |
| 9 | Requisição liberada via API | PROCESSANDO |
| 10 | Preparando remessa liberada | PROCESSANDO |

#### Função: `mapearStatusItem(indicadorAceite, erros)`

**Mapeamento de Indicadores para Status Interno:**

| Indicador | Erros | Status Interno |
|-----------|-------|----------------|
| "S" | - | ACEITO |
| "N" | - | REJEITADO |
| null | - | PENDENTE |
| qualquer | [] (com erros) | REJEITADO |
| qualquer | - | ENVIADO |

---

### 4. Persistência de Dados

#### Antes de Enviar ao BB
1. Cria `PagamentoApiLote` com status `PENDENTE`
2. Cria `PagamentoApiItem`(s) com status `PENDENTE`
3. Cria relacionamentos N:N em `PagamentoApiItemColheita` (se aplicável)
4. Salva `payloadEnviado` e `payloadItemEnviado` em JSON

#### Após Receber Resposta do BB
1. Atualiza `PagamentoApiLote` com:
   - `payloadResposta` (JSON completo)
   - `estadoRequisicao` (1-10)
   - `quantidadeValida` e `valorTotalValido`
   - `status` (mapeado)
2. Atualiza `PagamentoApiItem`(s) com:
   - `payloadItemResposta` (JSON completo)
   - `identificadorPagamento` (PIX) ou `codigoIdentificadorPagamento` (BOLETO) ou `codigoPagamento` (GUIA)
   - `indicadorMovimentoAceito` / `indicadorAceite` / `indicadorAceiteGuia`
   - `erros` (se houver)
   - `status` (mapeado)

#### Após Consulta de Lote
1. Atualiza `PagamentoApiLote` com:
   - `ultimaConsultaStatus` (timestamp)
   - `estadoRequisicaoAtual` (estado atual)
   - `payloadRespostaAtual` (resposta mais recente)
   - `status` (atualizado)
2. Atualiza `PagamentoApiItem`(s) com:
   - `ultimaAtualizacaoStatus` (timestamp)
   - `indicadorMovimentoAceitoAtual` / `indicadorAceiteAtual` / `indicadorAceiteGuiaAtual`
   - `payloadItemRespostaAtual` (resposta mais recente)
   - `status` (atualizado)

#### Após Consulta Individual
1. Atualiza `PagamentoApiItem` com:
   - `ultimaConsultaIndividual` (timestamp)
   - `estadoPagamentoIndividual` (estado atual)
   - `payloadConsultaIndividual` (JSON completo)
   - `listaDevolucao` (se houver, para BOLETO e GUIA)

---

## 🎯 Funcionalidades Implementadas

### 1. Solicitação de Pagamentos

#### PIX - Transferências
- **Endpoint:** `POST /api/pagamentos/transferencias-pix`
- **Limite:** 320 registros por lote
- **Funcionalidades:**
  - ✅ Gera `numeroRequisicao` sequencial automaticamente
  - ✅ Persiste lote e itens no banco ANTES de enviar ao BB
  - ✅ Suporta pagamento consolidado (1 transferência para N colheitas)
  - ✅ Relaciona itens com colheitas via tabela N:N
  - ✅ Atualiza status após receber resposta do BB

#### BOLETO - Pagamento de Boletos
- **Endpoint:** `POST /api/pagamentos/boletos`
- **Limite:** 150 registros por lote
- **Funcionalidades:**
  - ✅ Gera `numeroRequisicao` sequencial automaticamente
  - ✅ Persiste lote e itens no banco ANTES de enviar ao BB
  - ✅ Suporta múltiplos boletos em um único lote
  - ✅ Atualiza status após receber resposta do BB

#### GUIA - Pagamento de Guias
- **Endpoint:** `POST /api/pagamentos/guias`
- **Limite:** 200 registros por lote
- **Funcionalidades:**
  - ✅ Gera `numeroRequisicao` sequencial automaticamente
  - ✅ Persiste lote e itens no banco ANTES de enviar ao BB
  - ✅ Suporta múltiplas guias em um único lote
  - ✅ Atualiza status após receber resposta do BB

---

### 2. Consulta de Lote

#### PIX - Consulta de Lote
- **Endpoint:** `GET /api/pagamentos/transferencias-pix/:numeroRequisicao`
- **Funcionalidades:**
  - ✅ Busca lote no banco de dados
  - ✅ Se não encontrado, consulta BB diretamente (compatibilidade)
  - ✅ Atualiza lote e itens com resposta mais recente
  - ✅ Atualiza `ultimaConsultaStatus` e `estadoRequisicaoAtual`

#### PIX - Consulta Online (Sem Atualizar Banco)
- **Endpoint:** `GET /api/pagamentos/transferencias-pix/:numeroRequisicao/consulta-online`
- **Descrição:** Consulta a solicitação de transferência PIX diretamente na API do BB sem atualizar o banco de dados. Útil para verificar o status atual sem modificar os dados persistidos.
- **Parâmetros:**
  - `numeroRequisicao` (path, obrigatório) - Número do lote de transferências
  - `contaCorrenteId` (query, opcional) - **Ignorado por segurança**. A consulta sempre usa a conta vinculada ao lote no banco de dados.
- **Funcionalidades:**
  - ✅ Busca o lote no banco de dados para obter a conta vinculada
  - ✅ Consulta diretamente na API do BB: `GET /lotes-transferencias-pix/{id}/solicitacao`
  - ✅ **Usa APENAS a conta vinculada ao lote** (não tenta múltiplas contas)
  - ✅ Retorna resposta completa da API sem atualizar o banco
  - ✅ Útil para recuperar resposta original quando não foi recebida confirmação
  - ✅ Permite confirmar se o número da requisição já foi utilizado
  - ✅ Não atualiza `ultimaConsultaStatus` nem `estadoRequisicaoAtual`
- **Segurança:** O parâmetro `contaCorrenteId` é ignorado para garantir que a consulta seja feita sempre na conta correta vinculada ao lote, evitando chamadas desnecessárias e uso de tokens incorretos.
- **Resposta:** Retorna o objeto completo da resposta da API BB com:
  - `numeroRequisicao` - Número da requisição
  - `estadoRequisicao` - Estado atual da requisição (1-10)
  - `quantidadeTransferencias` - Quantidade total de transferências
  - `valorTransferencias` - Valor total das transferências
  - `quantidadeTransferenciasValidas` - Quantidade de transferências válidas
  - `valorTransferenciasValidas` - Valor total das transferências válidas
  - `listaTransferencias` - Array com detalhes de cada transferência (identificadorPagamento, data, valor, erros, etc.)
- **Acesso:** Apenas usuários autenticados (via `@UseGuards(JwtAuthGuard)`)

#### BOLETO - Consulta de Lote
- **Endpoint:** `GET /api/pagamentos/boletos/:numeroRequisicao`
- **Funcionalidades:**
  - ✅ Busca lote no banco de dados
  - ✅ Se não encontrado, consulta BB diretamente (compatibilidade)
  - ✅ Atualiza lote e itens com resposta mais recente
  - ✅ Atualiza `ultimaConsultaStatus` e `estadoRequisicaoAtual`

#### GUIA - Consulta de Lote
- **Endpoint:** `GET /api/pagamentos/guias/:numeroRequisicao`
- **Funcionalidades:**
  - ✅ Busca lote no banco de dados
  - ✅ Se não encontrado, consulta BB diretamente (compatibilidade)
  - ✅ Atualiza lote e itens com resposta mais recente
  - ✅ Atualiza `ultimaConsultaStatus` e `estadoRequisicaoAtual`

---

### 3. Consulta Individual

#### PIX - Consulta Individual
- **Endpoint:** `GET /api/pagamentos/pix/:identificadorPagamento/individual`
- **Funcionalidades:**
  - ✅ Busca item no banco de dados pelo `identificadorPagamento`
  - ✅ Consulta BB para obter status mais recente
  - ✅ Atualiza item com `estadoPagamentoIndividual` e `payloadConsultaIndividual`
  - ✅ Atualiza `ultimaConsultaIndividual`

#### BOLETO - Consulta Individual
- **Endpoint:** `GET /api/pagamentos/boletos/:codigoIdentificadorPagamento/individual`
- **Funcionalidades:**
  - ✅ Busca item no banco de dados pelo `codigoIdentificadorPagamento`
  - ✅ Consulta BB para obter status mais recente
  - ✅ Atualiza item com `estadoPagamentoIndividual` e `payloadConsultaIndividual`
  - ✅ Atualiza `listaDevolucao` (se houver)
  - ✅ Atualiza `ultimaConsultaIndividual`

#### GUIA - Consulta Individual
- **Endpoint:** `GET /api/pagamentos/guias/:codigoPagamento/individual`
- **Funcionalidades:**
  - ✅ Busca item no banco de dados pelo `codigoPagamento`
  - ✅ Consulta BB para obter status mais recente
  - ✅ Atualiza item com `estadoPagamentoIndividual` e `payloadConsultaIndividual`
  - ✅ Atualiza `listaDevolucao` (se houver)
  - ✅ Atualiza `ultimaConsultaIndividual`

---

## 🔗 Relacionamentos

### Relacionamento N:N: PagamentoApiItem ↔ TurmaColheitaPedidoCusto

**Tabela Intermediária:** `PagamentoApiItemColheita`

**Propósito:** Permitir que 1 único `PagamentoApiItem` (1 transferência PIX) pague múltiplas colheitas

**Campos:**
- `pagamentoApiItemId` (Int, FK) - Relacionamento com `PagamentoApiItem`
- `turmaColheitaCustoId` (Int, FK) - Relacionamento com `TurmaColheitaPedidoCusto`
- `valorColheita` (Decimal) - Valor individual da colheita

**Constraint:**
- `@@unique([pagamentoApiItemId, turmaColheitaCustoId])` - Evita relacionamentos duplicados

**Exemplo de Uso:**
```typescript
// 1 único PagamentoApiItem paga 10 colheitas
const itemPagamento = await prisma.pagamentoApiItem.create({
  data: {
    loteId: lote.id,
    valorEnviado: 1000.00, // Valor total consolidado
    // ... outros campos ...
  },
});

// Criar relacionamentos N:N
await Promise.all(
  colheitaIds.map((colheitaId) => {
    return prisma.pagamentoApiItemColheita.create({
      data: {
        pagamentoApiItemId: itemPagamento.id,
        turmaColheitaCustoId: colheitaId,
        valorColheita: colheita.valorColheita, // Valor individual
      },
    });
  })
);
```

---

### Relacionamento 1:N: PagamentoApiLote ↔ PagamentoApiItem

**Propósito:** Um lote pode conter múltiplos itens

**Exemplo:**
- **Turma de Colheita:** 1 lote → 1 item (pagamento consolidado)
- **Funcionários (futuro):** 1 lote → 50 itens (50 funcionários)
- **Fornecedores (futuro):** 1 lote → 10 itens (10 fornecedores)

---

### Relacionamento 1:1: PagamentoApiItem ↔ FornecedorPagamento

**Propósito:** Relacionar itens de pagamento com fornecedores

**Campos:**
- `fornecedorPagamentoId` (Int?, FK) - Relacionamento com `FornecedorPagamento`

**Lógica:**
- Quando o pagamento for para fornecedor, preencher `fornecedorPagamentoId`
- Quando o pagamento for para colheita, usar tabela N:N `PagamentoApiItemColheita`

---

## 📝 Fluxos de Pagamento

### Fluxo 1: Pagamento Consolidado de Colheitas (PIX)

```
1. Usuário seleciona 10 colheitas no modal
   ↓
2. Frontend soma valores: R$ 100,00 + R$ 200,00 + ... = R$ 1.000,00
   ↓
3. Frontend cria 1 única transferência PIX com valor total (R$ 1.000,00)
   ↓
4. Frontend envia payload com:
   - listaTransferencias: [1 transferência consolidada]
   - colheitaIds: [1, 2, 3, ..., 10]
   ↓
5. Backend valida que há 1 única transferência
   ↓
6. Backend gera numeroRequisicao sequencial (ex: 1)
   ↓
7. Backend cria PagamentoApiLote (ID: 1, numeroRequisicao: 1)
   ↓
8. Backend cria PagamentoApiItem (ID: 1, Valor: R$ 1.000,00)
   ↓
9. Backend cria 10 registros em PagamentoApiItemColheita:
   - Item 1 → Colheita 1 (R$ 100,00)
   - Item 1 → Colheita 2 (R$ 200,00)
   - ...
   - Item 1 → Colheita 10 (R$ 100,00)
   ↓
10. Backend envia requisição ao BB
   ↓
11. BB retorna resposta com identificadorPagamento
   ↓
12. Backend atualiza PagamentoApiLote e PagamentoApiItem com resposta
   ↓
13. Backend retorna resposta ao frontend
   ↓
14. Frontend marca colheitas como pagas em turma_colheita_pedido_custo
```

---

### Fluxo 2: Consulta de Status de Lote

```
1. Usuário consulta status de um lote (numeroRequisicao: 1)
   ↓
2. Backend busca PagamentoApiLote no banco de dados
   ↓
3. Se encontrado:
   - Usa contaCorrenteId do lote
   - Consulta BB para obter status mais recente
   - Atualiza lote e itens com resposta
   ↓
4. Se não encontrado:
   - Consulta BB diretamente (compatibilidade com lotes antigos)
   - Retorna resposta sem atualizar banco
   ↓
5. Retorna status atualizado ao frontend
```

---

### Fluxo 3: Consulta Individual de Pagamento

```
1. Usuário consulta status de um pagamento individual (identificadorPagamento: 96494633731030000)
   ↓
2. Backend busca PagamentoApiItem no banco de dados pelo identificadorPagamento
   ↓
3. Se encontrado:
   - Usa contaCorrenteId do lote do item
   - Consulta BB para obter status mais recente
   - Atualiza item com estadoPagamentoIndividual e payloadConsultaIndividual
   ↓
4. Se não encontrado:
   - Requer contaCorrenteId como parâmetro
   - Consulta BB diretamente
   - Retorna resposta sem atualizar banco
   ↓
5. Retorna status atualizado ao frontend
```

---

## 🚀 Comandos de Migration

### Passo 1: Gerar Migration do Prisma

```bash
cd SistemaWebAlencarFrutas/backend
npx prisma migrate dev --name adicionar_relacionamento_nn_pagamento_colheita
```

Este comando irá:
- ✅ Criar a migration com a nova tabela N:N
- ✅ Criar a tabela `pagamento_api_item_colheita` (relacionamento N:N)
- ✅ Remover o campo `turmaColheitaCustoId` de `pagamento_api_item` (substituído por tabela N:N)
- ✅ Adicionar relacionamento N:N em `TurmaColheitaPedidoCusto`
- ✅ Aplicar a migration no banco de dados

### Passo 2: Regenerar Prisma Client

```bash
cd SistemaWebAlencarFrutas/backend
npx prisma generate
```

### Passo 3: Verificar Migration

```bash
cd SistemaWebAlencarFrutas/backend
npx prisma migrate status
```

---

## ✅ Verificação Final

Após executar todos os comandos, verifique se:

1. ✅ As tabelas foram criadas:
   - `sequencia_numero_requisicao`
   - `pagamento_api_lote`
   - `pagamento_api_item`
   - `pagamento_api_item_colheita` (N:N)

2. ✅ Os relacionamentos foram adicionados:
   - `ContaCorrente.lotesPagamentoApi`
   - `TurmaColheitaPedidoCusto.pagamentoApiItemColheitas` (N:N via tabela intermediária)
   - `PagamentoApiItem.colheitas` (N:N via tabela intermediária)
   - `FornecedorPagamento.itensPagamentoApi`

3. ✅ Os enums foram criados:
   - `TipoPagamentoApi` (PIX, BOLETO, GUIA)
   - `StatusPagamentoLote` (PENDENTE, ENVIADO, PROCESSANDO, CONCLUIDO, PARCIAL, REJEITADO, ERRO)
   - `StatusPagamentoItem` (PENDENTE, ENVIADO, ACEITO, REJEITADO, PROCESSADO, ERRO)

4. ✅ A tabela de sequência será inicializada automaticamente na primeira requisição de pagamento
   - Não é necessário executar script manual
   - A função `obterProximoNumeroRequisicao()` faz isso automaticamente
   - Funciona tanto em desenvolvimento quanto em produção (Render)

---

## 🎨 Frontend: Instruções de Uso

### 1. Remover `numeroRequisicao` do Frontend

**ANTES:**
```javascript
const numeroRequisicao = gerarNumeroRequisicao(); // ❌ Não é mais necessário
const payload = {
  contaCorrenteId: contaSelecionada,
  numeroRequisicao: numeroRequisicao, // ❌ Remover
  // ...
};
```

**DEPOIS:**
```javascript
// ✅ numeroRequisicao é gerado automaticamente pelo backend
const payload = {
  contaCorrenteId: contaSelecionada,
  // numeroRequisicao: removido - gerado automaticamente
  // ...
};
```

### 2. Criar 1 Única Transferência Consolidada

**IMPORTANTE:** Para pagamento consolidado, criar 1 única transferência com valor total.

**EXEMPLO:**
```javascript
// Calcular valor total consolidado
const valorTotalConsolidado = colheitasParaPagar.reduce((acc, colheita) => 
  acc + (colheita.valorColheita || 0), 0
);

// Criar 1 ÚNICA transferência consolidada
const transferenciaConsolidada = {
  data: dataFormatada,
  valor: valorTotalConsolidado.toFixed(2),
  descricaoPagamento: quantidadeColheitas === 1
    ? `Pagamento de colheita - ${colheitasParaPagar[0].fruta?.nome || 'Fruta'} - ${colheitasParaPagar[0].pedidoNumero || colheitasParaPagar[0].id}`
    : `Pagamento consolidado - ${quantidadeColheitas} colheita(s) - Turma ${turmaNome}`,
  descricaoPagamentoInstantaneo: quantidadeColheitas === 1
    ? `Colheita ${colheitasParaPagar[0].id} - ${colheitasParaPagar[0].cliente?.nome || 'Cliente'}`
    : `Pagamento consolidado - ${quantidadeColheitas} colheita(s) - Turma ${turmaNome}`,
  formaIdentificacao: chavePixInfo.tipo,
  // ... campos condicionais baseados no tipo de chave ...
};

// Lista com 1 única transferência consolidada
const listaTransferencias = [transferenciaConsolidada];
```

### 3. Adicionar `colheitaIds` para Relacionamento

**IMPORTANTE:** Para relacionar os itens de pagamento com as colheitas, envie o array `colheitaIds`.

**EXEMPLO:**
```javascript
// Preparar array de IDs das colheitas para relacionamento N:N
// 1 única transferência consolidada pagará todas essas colheitas
const colheitaIds = colheitasParaPagar.map(colheita => colheita.id);

// Montar payload completo
const payload = {
  contaCorrenteId: contaSelecionada,
  numeroContrato: numeroContrato,
  agenciaDebito: contaSelecionadaData.agencia,
  contaCorrenteDebito: contaSelecionadaData.contaCorrente,
  digitoVerificadorContaCorrente: digitoVerificador,
  tipoPagamento: 128, // Pagamentos diversos
  listaTransferencias: listaTransferencias, // 1 única transferência consolidada
  colheitaIds: colheitaIds, // ✅ Array de IDs para relacionamento N:N
};

// Enviar requisição
const response = await axiosInstance.post('/api/pagamentos/transferencias-pix', payload);

// ✅ numeroRequisicao agora vem na resposta (gerado pelo backend)
console.log('Número da requisição gerado:', response.data.numeroRequisicao);
```

---

## 📋 Endpoints Disponíveis

### Solicitação de Pagamentos

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| POST | `/api/pagamentos/transferencias-pix` | Solicitar transferência PIX | ✅ Implementado |
| POST | `/api/pagamentos/boletos` | Solicitar pagamento de boletos | ✅ Implementado |
| POST | `/api/pagamentos/guias` | Solicitar pagamento de guias | ✅ Implementado |

### Consulta de Lote

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| GET | `/api/pagamentos/transferencias-pix/:numeroRequisicao` | Consultar status de lote PIX | ✅ Implementado |
| GET | `/api/pagamentos/boletos/:numeroRequisicao` | Consultar status de lote de boletos | ✅ Implementado |
| GET | `/api/pagamentos/guias/:numeroRequisicao` | Consultar status de lote de guias | ✅ Implementado |

### Consulta Individual

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| GET | `/api/pagamentos/pix/:identificadorPagamento/individual` | Consulta individual PIX | ✅ Implementado |
| GET | `/api/pagamentos/boletos/:codigoIdentificadorPagamento/individual` | Consulta individual BOLETO | ✅ Implementado |
| GET | `/api/pagamentos/guias/:codigoPagamento/individual` | Consulta individual GUIA | ✅ Implementado |

### 4. Liberação e Cancelamento de Pagamentos

#### 4.1. Liberação de Pagamentos (Liberação de Requisição / Remessa)

- **Recurso BB:** `POST /liberar-pagamentos`
- **Endpoint interno:** `POST /api/pagamentos/liberar`
- **Controle de acesso:** Apenas usuários autenticados (via `@UseGuards(JwtAuthGuard)`)

**DTO interno:** `LiberarPagamentosDto`:

- `numeroRequisicao` (number) - Número da requisição (lote) a ser liberado.
- `indicadorFloat` (`'S' | 'N'`) - Indicador de float:
  - `'N'` → **Não dispensa prazos de float** (respeita o float contratado; não cobra tarifa de antecipação).
  - `'S'` → **Dispensa prazos de float** (pagamento é liberado na data informada; tarifa de antecipação de float poderá ser cobrada se aplicável).

**Comportamento:**

- O sistema sempre usa:
  - `numeroRequisicao` real do lote (campo `PagamentoApiLote.numeroRequisicao`).
  - `indicadorFloat = 'S'` (produção - sempre libera ignorando o float contratado, sujeito à tarifa de antecipação de float conforme contrato).

**Resumo da implementação:**

- A liberação **não é automática** após a criação do lote.
- O fluxo esperado é:
  1. Sistema cria e envia o lote (`numeroRequisicao` sequencial).
  2. Lote fica **pendente de liberação**.
    3. Administrador, via interface web, chama `POST /api/pagamentos/liberar` com `numeroRequisicao` do lote.
    4. O backend:
     - Localiza o lote.
     - Identifica conta e credencial de pagamentos.
     - Monta o payload com `numeroRequisicao` e `indicadorFloat = 'S'`.
     - Chama `POST /liberar-pagamentos` no BB.
     - Atualiza o lote com auditoria (`observacoes` e `payloadRespostaAtual`).

#### 4.2. Cancelamento de Pagamentos

- **Recurso BB:** `POST /cancelar-pagamentos`
- **Endpoint interno:** `POST /api/pagamentos/cancelar`
- **Controle de acesso:** Apenas `ADMINISTRADOR`.

**⚠️ IMPORTANTE:** O cancelamento é feito por **ITEM (lançamento individual)**, não por lote. Cada item de pagamento possui um `codigoPagamento` único retornado pelo BB. Um lançamento somente poderá ser cancelado **até a liberação do lote** que o contém.

**DTO interno:** `CancelarPagamentosDto`:

- `contaCorrenteId` (number) - Conta que será usada para cancelamento (serve para buscar contrato e credenciais).
- `listaCodigosPagamento` (`string[]`) - Lista de `codigoPagamento` retornados pelo BB para cada item/lançamento a ser cancelado.

**Payload enviado ao BB (`cancelar-pagamentos`):**

- `numeroContratoPagamento` (opcional) – Vem de `ContaCorrente.numeroContratoPagamento`. Opcional na documentação do BB, mas sempre enviado no nosso sistema.
- `agenciaDebito` (obrigatório) – Agência da conta (`ContaCorrente.agencia`). 4 algarismos sem o dígito verificador.
- `contaCorrenteDebito` (obrigatório) – Número da Conta Corrente (`ContaCorrente.contaCorrente`).
- `digitoVerificadorContaCorrente` (obrigatório) – Dígito verificador da conta (`ContaCorrente.contaCorrenteDigito`). Informado como string.
- `listaPagamentos` (obrigatório) – Array com itens `{ codigoPagamento: string }`. Cada `codigoPagamento` identifica um lançamento/item específico retornado pelo BB na solicitação de pagamentos ou transferências.

**Campos `codigoPagamento` por tipo de pagamento:**

- **PIX:** Usar `identificadorPagamento` retornado pelo BB
- **Boleto:** Usar `codigoIdentificadorPagamento` retornado pelo BB
- **Guia:** Usar `codigoPagamento` retornado pelo BB

**Comportamento:**

- O cancelamento pode ser feito para **múltiplos itens de uma vez** (enviando vários `codigoPagamento` na lista).
- O BB retorna para cada item se o cancelamento foi aceito (`indicadorCancelamento: 'S'`) ou rejeitado (`indicadorCancelamento: 'N'`).
- Se o cancelamento for aceito, o sistema reverte automaticamente o status das colheitas/funcionários vinculados àquele item para `PENDENTE`.

**Nota sobre a interface (Frontend):**

- Na interface web (`Pagamentos.js`), o botão "Cancelar pagamento" aparece na linha do **lote**.
- Quando clicado, o sistema extrai **todos os códigos de pagamento dos itens** daquele lote e cancela todos de uma vez.
- Isso está funcionalmente correto, pois permite cancelar múltiplos itens simultaneamente.
- **Cenário atual (Turma de Colheita):** Lote com 1 item → cancela 1 item.
- **Cenário futuro (Funcionários):** Lote com N itens → cancela todos os N itens de uma vez.

**Resposta do BB:**

- Retorna um JSON informando se o comando de cancelamento, para **cada pagamento**, foi aceito ou não.
- Cada item na resposta contém:
  - `codigoPagamento` - Código do pagamento
  - `indicadorCancelamento` - 'S' (aceito) ou 'N' (rejeitado)
  - `estadoCancelamento` - Estado/motivo do cancelamento (se rejeitado)

> Hoje o cancelamento está implementado e disponível, mas o fluxo principal do sistema **não depende dele**. Ele foi deixado pronto para uso futuro, se necessário.

### Outros

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| GET | `/api/pagamentos/contas-disponiveis` | Listar contas correntes disponíveis | ✅ Implementado |

---

## 🔍 Exemplos de Uso

### Exemplo 1: Pagamento Consolidado de 10 Colheitas

```typescript
// Frontend envia:
{
  contaCorrenteId: 1,
  numeroContrato: 731030,
  agenciaDebito: "1607",
  contaCorrenteDebito: "99738672",
  digitoVerificadorContaCorrente: "X",
  tipoPagamento: 128,
  listaTransferencias: [
    {
      data: "15122024",
      valor: "1000.00",
      descricaoPagamento: "Pagamento consolidado - 10 colheita(s) - Turma João Silva",
      descricaoPagamentoInstantaneo: "Pagamento consolidado - 10 colheita(s) - Turma João Silva",
      formaIdentificacao: 1,
      dddTelefone: "11",
      telefone: "985732102"
    }
  ],
  colheitaIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

// Backend processa:
// 1. Gera numeroRequisicao: 1
// 2. Cria PagamentoApiLote (ID: 1, numeroRequisicao: 1, Valor: R$ 1.000,00)
// 3. Cria PagamentoApiItem (ID: 1, Valor: R$ 1.000,00)
// 4. Cria 10 registros em PagamentoApiItemColheita:
//    - Item 1 → Colheita 1 (R$ 100,00)
//    - Item 1 → Colheita 2 (R$ 200,00)
//    - ...
//    - Item 1 → Colheita 10 (R$ 100,00)
// 5. Envia ao BB
// 6. Atualiza com resposta do BB
// 7. Retorna resposta

// Resposta:
{
  numeroRequisicao: 1,
  estadoRequisicao: 1,
  quantidadeTransferencias: 1,
  valorTransferencias: 1000.00,
  quantidadeTransferenciasValidas: 1,
  valorTransferenciasValidas: 1000.00,
  listaTransferencias: [
    {
      identificadorPagamento: "96494633731030000",
      indicadorMovimentoAceito: "S",
      erros: []
    }
  ]
}
```

### Exemplo 2: Consulta de Status de Lote

```typescript
// Frontend consulta:
GET /api/pagamentos/transferencias-pix/1

// Backend processa:
// 1. Busca PagamentoApiLote no banco (numeroRequisicao: 1)
// 2. Consulta BB para obter status mais recente
// 3. Atualiza lote e itens com resposta
// 4. Retorna status atualizado

// Resposta:
{
  numeroRequisicao: 1,
  estadoRequisicao: 6, // Processada
  quantidadeTransferencias: 1,
  valorTransferencias: 1000.00,
  quantidadeTransferenciasValidas: 1,
  valorTransferenciasValidas: 1000.00,
  listaTransferencias: [
    {
      identificadorPagamento: "96494633731030000",
      indicadorMovimentoAceito: "S",
      erros: []
    }
  ]
}
```

### Exemplo 3: Consulta Individual de Pagamento

```typescript
// Frontend consulta:
GET /api/pagamentos/pix/96494633731030000/individual

// Backend processa:
// 1. Busca PagamentoApiItem no banco (identificadorPagamento: 96494633731030000)
// 2. Consulta BB para obter status mais recente
// 3. Atualiza item com estadoPagamentoIndividual e payloadConsultaIndividual
// 4. Retorna status atualizado

// Resposta:
{
  id: "96494633731030000",
  estadoPagamento: "Pago",
  tipoCredito: null,
  dataPagamento: "15122024",
  valorPagamento: 1000.00,
  // ... outros campos ...
}
```

---

## 🎯 Benefícios da Implementação

### 1. Rastreabilidade Completa
- ✅ Todos os pagamentos são rastreados no banco de dados
- ✅ Histórico completo de todas as operações
- ✅ Payloads completos salvos em JSON
- ✅ Status atualizados automaticamente

### 2. Pagamento Consolidado
- ✅ 1 única transferência PIX para múltiplas colheitas
- ✅ Relacionamento N:N permite rastrear quais colheitas foram pagas
- ✅ Valor individual de cada colheita armazenado para rastreabilidade

### 3. Sequencialidade
- ✅ `numeroRequisicao` sequencial (1, 2, 3...)
- ✅ Inicialização automática (não precisa de script manual)
- ✅ Thread-safe (usa transação)

### 4. Auditoria
- ✅ Timestamps de criação e atualização
- ✅ Payloads completos salvos em JSON
- ✅ Status de processamento rastreado
- ✅ Erros de processamento registrados

### 5. Flexibilidade
- ✅ Suporta PIX, BOLETO e GUIA
- ✅ Suporta 1 ou N itens por lote
- ✅ Preparado para fornecedores e funcionários
- ✅ Relacionamentos polimórficos

---

## ⚠️ Limitações e Observações

### Limites do BB
- **PIX:** Máximo de 320 registros por lote
- **BOLETO:** Máximo de 150 registros por lote
- **GUIA:** Máximo de 200 registros por lote
- **numeroRequisicao:** Range de 1 a 9999999

### Validações Implementadas
- ✅ Validação de 1 única transferência quando `colheitaIds` é fornecido
- ✅ Validação de limites de registros (futuro)
- ✅ Validação de campos obrigatórios
- ✅ Validação de formato de dados

### Compatibilidade
- ✅ Compatível com lotes criados antes da persistência
- ✅ Consultas funcionam mesmo sem lote no banco (consulta BB diretamente)
- ✅ Frontend atualizado para pagamento consolidado

---

## 🚧 Próximos Passos

### Fase 7: Jobs e Processamento Assíncrono (Pendente)
- ⚠️ Implementar jobs para consultar status automaticamente
- ⚠️ Configurar intervalo de consulta
- ⚠️ Processar lotes pendentes

### Fase 8: Webhook (Pendente)
- ⚠️ Implementar endpoint para receber webhooks do BB
- ⚠️ Atualizar status automaticamente via webhook
- ⚠️ Validar assinatura do webhook

### Futuro: Integração com Fornecedores e Funcionários
- ⚠️ Integrar com `FornecedorPagamento`
- ⚠️ Integrar com `FuncionarioPagamento` (quando implementado)
- ⚠️ Suportar múltiplos itens por lote para funcionários

---

## 📚 Referências

- **Documentação BB:** API de Pagamentos do Banco do Brasil
- **Prisma Schema:** `backend/prisma/schema.prisma`
- **Service:** `backend/src/pagamentos/pagamentos.service.ts`
- **Controller:** `backend/src/pagamentos/pagamentos.controller.ts`
- **DTOs:** `backend/src/pagamentos/dto/pagamentos.dto.ts`

---

## 🔧 Troubleshooting

### Erro: "Table already exists"
Se a tabela já existe, você pode:
1. Verificar se a migration já foi aplicada: `npx prisma migrate status`
2. Se necessário, fazer reset do banco (CUIDADO: apaga todos os dados):
   ```bash
   npx prisma migrate reset
   ```

### Erro: "Unique constraint violation"
Se o registro na tabela de sequência já existe:
- O sistema detecta e não cria novamente
- Verifique se `ultimoNumero` está correto

### Erro: "Foreign key constraint"
Se houver erro de relacionamento:
- Verifique se as tabelas existentes (ContaCorrente, TurmaColheitaPedidoCusto, FornecedorPagamento) existem
- Verifique se os IDs das foreign keys estão corretos

### Erro: "Property 'pagamentoApiItemColheita' does not exist"
Se o Prisma Client não reconhece a nova tabela:
1. Execute: `npx prisma generate`
2. Reinicie o servidor TypeScript

---

**Última atualização:** 2024-12-15

**Versão:** 1.0.0

**Status:** 95% Concluído


