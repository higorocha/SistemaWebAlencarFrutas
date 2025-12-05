# 📚 Documentação Consolidada: Sistema de Controle de Pagamentos API BB

## 🎯 Visão Geral

Sistema completo de controle e rastreabilidade de pagamentos via API do Banco do Brasil, incluindo **PIX**, **Boletos** e **Guias**, com persistência no banco de dados, consultas individuais, pagamento consolidado e preparação para webhook.

### Status Atual: 98% Concluído

**✅ Implementado:**
- Persistência completa de lotes e itens
- Consultas de lote e individuais
- Pagamento consolidado para colheitas (1 transferência para múltiplas colheitas)
- Pagamento individual para funcionários (1 transferência por funcionário, até 320/lote)
- Relacionamento N:N (colheitas) e 1:1 (funcionários) com tabelas de origem
- Rastreabilidade completa
- Auditoria completa
- **Jobs automáticos de sincronização** (fila + worker) com delay configurado
- **Integração completa com ARH (Folha de Pagamento)**

**✅ Implementado:**
- Webhook para receber atualizações do BB (vide seção 🔔 Webhook de Pagamentos)

---

## 📊 Modelo de Banco de Dados

### Estrutura Geral

O sistema utiliza **5 tabelas principais** para controlar todos os pagamentos:

1. **`sequencia_numero_requisicao`** - Controle de números sequenciais
2. **`pagamento_api_lote`** - Controle de lotes de pagamento
3. **`pagamento_api_item`** - Controle de itens individuais
4. **`pagamento_api_item_colheita`** - Relacionamento N:N (Pagamento ↔ Colheitas)
5. **`pagamento_api_sync_job`** - Fila de jobs para sincronização automática

---

## 🗄️ Tabelas Detalhadas

### 1. `sequencia_numero_requisicao`

**Propósito:** Controlar números sequenciais de requisição compartilhados por contrato de pagamento

**Campos:**
- `id` (Int, PK) - Identificador único
- `numeroContratoPagamento` (Int, UNIQUE) - Número do contrato de pagamentos (chave única)
- `ultimoNumero` (Int) - Último número usado para este contrato
- `createdAt` (DateTime) - Data de criação
- `updatedAt` (DateTime) - Data de atualização

**Lógica:**
- **Sequência compartilhada por contrato**: Contas correntes com o mesmo `numeroContratoPagamento` compartilham a mesma sequência
- A tabela é **inicializada automaticamente** na primeira requisição de pagamento para cada contrato
- Não é necessário executar script manual de seed
- Usa **transação** para garantir atomicidade e evitar race conditions
- Cada nova requisição incrementa `ultimoNumero` em 1
- **Valor inicial automático**:
  - **Produção** (`NODE_ENV=production`): 1000
  - **Desenvolvimento** (`NODE_ENV=development` ou não definido): 110
  - Pode ser sobrescrito pela variável de ambiente `BB_ULTIMO_NUMERO_REQUISICAO_INICIAL`

**Exemplo:**
```sql
-- Contas 19222 e 8249 compartilham contrato 731030
-- Primeira requisição (Conta 19222): ultimoNumero = 1000 → numeroRequisicao = 1001
-- Segunda requisição (Conta 8249): ultimoNumero = 1001 → numeroRequisicao = 1002
-- Terceira requisição (Conta 19222): ultimoNumero = 1002 → numeroRequisicao = 1003
```

**Configuração:**
- Variável de ambiente opcional: `BB_ULTIMO_NUMERO_REQUISICAO_INICIAL` (sobrescreve valor automático)
- Se não configurada, usa valor baseado em `NODE_ENV` (100 em dev, 1000 em produção)

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
- `dataPagamentoEnviada` (String) - **Data agendada de pagamento** no formato `ddmmaaaa` (ex: `"8122025"` = 08/12/2025). Esta é a data informada pelo usuário ao criar o lote e que será enviada ao Banco do Brasil. **Sempre salva no momento da criação do item**, independente do status do pagamento.
- `descricaoEnviada` (String?) - Descrição do pagamento
- `payloadItemEnviado` (Json) - Dados completos do item enviado

#### Dados Específicos de PIX
- `descricaoInstantaneoEnviada` (String?) - Descrição para conciliação
- `chavePixEnviada` (String?) - Chave PIX **salva no momento da criação do item** (para consistência histórica)
- `tipoChavePixEnviado` (Int?) - 1=Telefone, 2=Email, 3=CPF/CNPJ, 4=Chave Aleatória **salvo no momento da criação do item**
- `responsavelChavePixEnviado` (String?) - Responsável pela chave PIX **salvo no momento da criação do item** (para consistência histórica)
- `identificadorPagamento` (String?) - Identificador PIX retornado pelo BB
- `indicadorMovimentoAceito` (String?) - "S" ou "N" (resposta inicial)
- `indicadorMovimentoAceitoAtual` (String?) - "S" ou "N" (status atual)

**⚠️ IMPORTANTE - Comportamento da Chave PIX:**
- **Sempre atualizada na criação**: A chave PIX sempre vem do cadastro do funcionário (`Funcionario.chavePix`) no momento da criação do lote
- **Armazenada para consistência histórica**: A chave PIX é salva em `chavePixEnviada`, `tipoChavePixEnviado` e `responsavelChavePixEnviado` quando o item é criado
- **Mudanças futuras não afetam pagamentos anteriores**: Se o funcionário mudar a chave PIX ou responsável no cadastro após um pagamento ser criado, o pagamento anterior mantém os dados antigos salvos
- **Novos lotes usam dados atualizados**: Toda vez que um novo lote é criado (criação original ou reprocessamento), a chave PIX e responsável usados são sempre os atuais do cadastro do funcionário
- **Não armazenada em `arh_funcionario_pagamento`**: A tabela `arh_funcionario_pagamento` não armazena chave PIX nem responsável, sempre consulta do cadastro do funcionário

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
- `status` (Enum) - PENDENTE, ENVIADO, ACEITO, REJEITADO, BLOQUEADO, PROCESSADO, ERRO
  - **BLOQUEADO**: Item bloqueado porque o lote foi rejeitado (não será processado nem liberado)
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

### 5. `pagamento_api_sync_job`

**Propósito:** Fila persistida que controla quando cada lote/ item será ressincronizado com a API BB.

**Campos principais:**
- `tipo`: `LOTE` ou `ITEM`
- `status`: `PENDING`, `RUNNING`, `DONE`, `FAILED`
- `contaCorrenteId`: usada para buscar credenciais/token corretos
- `numeroRequisicao`, `identificadorPagamento`, `loteId`: referências do que será consultado
- `runAfter`: horário mínimo de execução (delay padrão 15 minutos)
- `tentativas`, `ultimaExecucao`, `erro`: controle de retries (até 5 tentativas com backoff)

**Lógica resumida**
1. Remessa criada → agenda `LOTE` (15 min).
2. Liberação ok → reagenda `LOTE` (0 min) + adiciona `ITEM` para cada identificador PIX.
3. Worker executa jobs com `runAfter <= now`, um por vez.
4. Erros entram em backoff (15 → 30 → 60 → 180 min); após 5 falhas, `FAILED`.
5. Se o BB ainda devolver estado pendente (lote=1, item=PENDENTE/CONSISTENTE), reagenda automaticamente +15 min.

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

## 🔁 Jobs Automáticos

- **Criação/liberação** → agenda registros em `pagamento_api_sync_job` (lotes: +15 min; itens liberados: imediato).
- **Worker** (`PagamentosSyncWorkerService`) desperta a cada minuto e processa toda a fila disponível, sempre em série.
- **Logs** mostram hora local (`America/Sao_Paulo`), início de cada job e o resumo final (sucessos/falhas). Reagendamentos também geram log.
- **Reagendamento automático (lotes)**: repete enquanto o BB responder estados intermediários (`1`, `2`, `4`, `5`, `8`, `9`, `10`). Só encerra quando chega em `6` (processado) ou `7` (rejeitado). **IMPORTANTE**: O sistema aceita sempre o estado retornado pelo BB, pois os estados não seguem sequência numérica crescente (ver seção "Sequência Real dos Estados do BB").
- **Reagendamento automático (itens)**: repete quando o estado do PIX = `PENDENTE`, `CONSISTENTE`, `AGENDADO`, `AGUARDANDO DÉBITO` ou `DEBITADO`. Estados finais (`PAGO`, `CANCELADO`, `REJEITADO`, `DEVOLVIDO`, `VENCIDO`, `BLOQUEADO`) encerram o job.
- **Tratamento de itens bloqueados**: 
  - **Na criação do lote**: Se a resposta inicial do BB indica itens rejeitados, o lote é marcado como rejeitado imediatamente. Itens rejeitados ficam com `status = REJEITADO` e funcionários com `statusPagamento = REJEITADO`. Itens aceitos mas em lote rejeitado ficam com `status = BLOQUEADO` e funcionários com `statusPagamento = REPROCESSAR`. Não são criados jobs de sincronização.
  - **Após criação**: Quando um item está bloqueado (via consulta individual ou job), o sistema marca o lote inteiro como rejeitado (estado 7) para impedir a liberação, pois itens bloqueados impedem o processamento dos créditos. Itens já pagos são preservados e não são alterados. Ver seção detalhada em "4.1.1. Tratamento de Itens Bloqueados".
- **Propagação Turma Colheita**: quando o item chega em `PAGO`, tanto o job quanto o webhook marcam as colheitas vinculadas como pagas e, se todos os itens do lote estiverem `PROCESSADOS`, atualiza o lote para `estadoRequisicao=6`/`CONCLUIDO`.
- **Tratamento de itens bloqueados**: Quando um item está bloqueado, tanto o job quanto o webhook marcam o lote inteiro como rejeitado (estado 7) e revertem colheitas/funcionários para pendente (apenas se não estão pagos).
- **Backoff de erros**: 15 → 30 → 60 → 180 min; após 5 tentativas falhas, status `FAILED` + mensagem registrada.

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

## 🔔 Webhook de Pagamentos (Implementado ✅)

### Visão Geral
- A API do Banco do Brasil envia **webhooks** sempre que um pagamento em lote é efetivado ou quando há mudanças de estado.
- Evento disponível para: **Transferências**, **PIX**, **Boletos** e **Guias**.
- O payload vem em formato **JSON Array** onde cada objeto representa um pagamento individual dentro do lote.
- **Endpoint:** `POST /api/webhooks/bb/pagamentos`
- **Autenticação:** mTLS (mutual TLS) com validação de certificados do Banco do Brasil

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
| `codigoTextoEstado` | Código do estado (1=Pago, 2=Não pago, outros estados possíveis). |
| `textoEstado` | Texto do estado (`Pago`, `Não pago`, `Bloqueado`, `Rejeitado`, `Cancelado`, etc.). |
| `codigoIdentificadorInformadoCliente` | Descrição enviada por nós (ex: número do pedido). |
| `codigoDescricaoTipoPagamento` | Código interno de modalidade (ex: `12845`). |
| `descricaoTipoPagamento` | Texto da modalidade (ex: `Pagamentos Diversos Pix Transferência`). |

### Tipos de Pagamento Cobertos (Estado = Pago)
| Código | Descrição |
|--------|-----------|
| **Transferências / Fornecedores** | 1261 Crédito em Conta, 1263 TED, 12613 Guia c/ código barras, 12621 Guia arrecadação, 12630 Títulos BB, 12631 Títulos outros bancos, 12645 Pix Transferência, 12647 Pix QR Code |
| **Pagamentos Diversos** | 1281 Crédito em Conta, 1283 TED, 12813 Guia c/ código barras, 12821 Guia arrecadação, 12830 Títulos BB, 12831 Títulos outros bancos, 12845 Pix Transferência, 12847 Pix QR Code |

### Comportamento Implementado

O webhook segue o **mesmo comportamento dos jobs de sincronização**, garantindo consistência entre atualizações via webhook e via polling:

#### 1. Tratamento de Todos os Estados
- **PAGO** (`codigoTextoEstado = 1`): Marca item como `PROCESSADO`, atualiza colheitas/funcionários como pagos
- **BLOQUEADO**: Marca item como `REJEITADO`, reverte colheitas para `PENDENTE`, marca lote como rejeitado (estado 7)
- **REJEITADO**: Marca item como `REJEITADO`, reverte colheitas para `PENDENTE`
- **CANCELADO**: Marca item como `REJEITADO`, reverte colheitas para `PENDENTE`
- **PENDENTE** (`codigoTextoEstado = 2`): Atualiza apenas payload, mantém status atual

#### 2. Preservação de Itens Já Pagos
- Se o item já está como `PROCESSADO` (pago), o status é **preservado** mesmo se o webhook indicar outro estado
- Colheitas e funcionários já pagos não são revertidos

#### 3. Detecção e Tratamento de Itens Bloqueados
- Quando recebe estado **BLOQUEADO**:
  - Marca item como `REJEITADO` (se não está pago)
  - Reverte colheitas para `PENDENTE` (se não estão pagas)
  - Atualiza `FuncionarioPagamento` para `REJEITADO` (se não está pago)
  - Chama `verificarEAtualizarLoteComItensBloqueados()` para marcar o lote como rejeitado (estado 7)

#### 4. Atualização de Lote
- Verifica itens bloqueados antes de atualizar o lote
- Se houver itens bloqueados, o lote é marcado como rejeitado (estado 7), mesmo que a API retorne outro estado
- Se todos os itens foram pagos e não há itens bloqueados, marca lote como `CONCLUIDO`

#### 5. Atualização Condicional por Tipo
- **Pagamentos de Colheitas**: Atualiza `turma_colheita_pedido_custo` quando item é pago ou revertido
- **Pagamentos de Funcionários**: Atualiza `arh_funcionarios_pagamento` quando item é pago ou revertido
- **Outros tipos**: Apenas atualiza `pagamento_api_item`

### Fluxo de Processamento
1. BB envia webhook → Endpoint recebe via mTLS
2. Validação de certificado e origem (BbWebhookMtlsGuard)
3. Evento é persistido em `bb_webhook_events` para auditoria
4. Handler processa cada item do payload:
   - Normaliza estado do webhook para formato do sistema
   - Busca lote e item no banco de dados
   - Verifica se item já está pago (preserva se estiver)
   - Atualiza item conforme estado recebido
   - Atualiza colheitas/funcionários (se aplicável)
   - Verifica itens bloqueados e atualiza lote se necessário
5. Logs detalhados em cada etapa: `[PAGAMENTOS-WEBHOOK]`

### Campos Atualizados
- `pagamento_api_lote.ultimaAtualizacaoWebhook` / `payloadRespostaAtual` / `estadoRequisicaoAtual` / `status`
- `pagamento_api_item.estadoPagamentoIndividual` / `payloadItemRespostaAtual` / `status` / `ultimaAtualizacaoStatus`
- `turma_colheita_pedido_custo.statusPagamento` / `pagamentoEfetuado` / `dataPagamento` (apenas para pagamentos de colheitas)
- `arh_funcionarios_pagamento.statusPagamento` / `pagamentoEfetuado` / `dataPagamento` (apenas para pagamentos de funcionários)

> Consulte `PLANO_WEBHOOK_PAGAMENTOS.md` para detalhes técnicos da implementação.

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

#### Função: `obterProximoNumeroRequisicao(contaCorrenteId)`

**Lógica:**
1. Recebe `contaCorrenteId` como parâmetro
2. Busca a conta corrente para obter `numeroContratoPagamento`
3. Inicia **transação** no banco de dados
4. Busca sequência por `numeroContratoPagamento` (compartilhada entre contas com mesmo contrato)
5. Se não existe sequência:
   - Busca maior `numeroRequisicao` no banco onde `numeroContrato = numeroContratoPagamento`
   - Se encontrar, usa esse valor como base
   - Se não encontrar, inicializa com valor baseado no ambiente:
     - **Produção**: 1000
     - **Desenvolvimento**: 100
     - Pode ser sobrescrito por `BB_ULTIMO_NUMERO_REQUISICAO_INICIAL`
   - Cria sequência com `numeroContratoPagamento` e `ultimoNumero` inicial
6. Incrementa `ultimoNumero` em 1
7. Verifica se o número já existe globalmente (evita duplicação)
8. Se já existe, incrementa até encontrar número disponível
9. Atualiza sequência com novo número
10. Retorna o novo número
11. Commit da transação

**Vantagens:**
- ✅ Inicialização automática (não precisa de script manual)
- ✅ Thread-safe (usa transação)
- ✅ Sequencial compartilhado por contrato (contas com mesmo contrato compartilham sequência)
- ✅ Sem risco de duplicação (verifica globalmente)
- ✅ Valor inicial automático baseado em ambiente (100 em dev, 1000 em produção)

**Exemplo:**
```typescript
// Conta 19222 e 8249 compartilham contrato 731030

// Primeira requisição (Conta 19222)
const numeroRequisicao = await obterProximoNumeroRequisicao(19222); // Retorna: 1001 (inicia em 1000)

// Segunda requisição (Conta 8249 - mesmo contrato)
const numeroRequisicao = await obterProximoNumeroRequisicao(8249); // Retorna: 1002 (continua sequência)

// Terceira requisição (Conta 19222 - mesmo contrato)
const numeroRequisicao = await obterProximoNumeroRequisicao(19222); // Retorna: 1003 (continua sequência)
```

**Configuração de Ambiente:**
- **Desenvolvimento**: Valor inicial automático = 100
- **Produção**: Valor inicial automático = 1000
- **Sobrescrita**: Configure `BB_ULTIMO_NUMERO_REQUISICAO_INICIAL` no `.env` para usar valor customizado

---

### 3. Mapeamento de Status

#### ⚠️ IMPORTANTE: Sequência Real dos Estados do BB

**Os estados do Banco do Brasil NÃO seguem sequência numérica crescente!**

A sequência real é:
1. **Estados iniciais (validação)**: `1`, `2`, `3`
2. **Estado 8**: "Preparando remessa não liberada"
3. **Estado 4**: "Requisição pendente de ação pelo Conveniado" (aguarda autorização)
4. **Estados 9 ou 10**: "Requisição liberada via API" / "Preparando remessa liberada"
5. **Estados finais**: `6` (Processada) ou `7` (Rejeitada)

**Exemplo prático**: Um lote pode estar em estado `8` e depois ir para estado `4`, o que é uma transição válida (não é "retrocesso"). O sistema aceita sempre o estado retornado pelo BB, que é a fonte da verdade.

#### Função: `mapearStatusLote(estadoRequisicao)`

**Mapeamento de Estados do BB para Status Interno:**

| Estado BB | Descrição | Status Interno |
|-----------|-----------|----------------|
| 1 | Requisição com todos os lançamentos com dados consistentes | PENDENTE |
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
   - `estadoRequisicaoAtual` (estado atual retornado pelo BB)
   - `payloadRespostaAtual` (resposta mais recente)
   - `status` (atualizado)
   - **IMPORTANTE**: O sistema aceita sempre o estado retornado pelo BB, sem proteção contra "retrocesso numérico", pois os estados não seguem sequência numérica crescente (ver seção "Sequência Real dos Estados do BB").
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
   - `StatusPagamentoItem` (PENDENTE, ENVIADO, ACEITO, REJEITADO, BLOQUEADO, PROCESSADO, ERRO)
   - `StatusFuncionarioPagamento` (PENDENTE, ENVIADO, ACEITO, PROCESSANDO, PAGO, REJEITADO, REPROCESSAR, CANCELADO, ERRO)

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
  // descricaoPagamento: nome do colhedor (limitado a 40 caracteres)
  descricaoPagamento: limitarString(turmaNome || '', 40),
  // descricaoPagamentoInstantaneo: número do pedido (limitado a 26 caracteres)
  descricaoPagamentoInstantaneo: limitarString(numeroPedido, 26),
  // documentoDebito: não está sendo enviado (opcional - não implementado)
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

### 4. Campos de Descrição e Documento de Débito

#### 4.1. `documentoDebito` (Não Implementado)

**Status:** ❌ Não está sendo enviado no payload

**Comportamento Atual:**
- Quando `documentoDebito` não é informado (ou todos os lançamentos de uma mesma requisição têm o mesmo número), o Banco do Brasil consolida todos os débitos em um único registro no extrato da conta do pagador, exibindo o valor total dos lançamentos validados.
- O número de documento do débito é consolidado a partir do dia seguinte da efetivação dos lançamentos.

**Observação:** Este campo pode ser implementado no futuro para individualizar os débitos no extrato, permitindo que cada lançamento apareça separadamente.

---

#### 4.2. `descricaoPagamento` (Implementado)

**Status:** ✅ Implementado

**Limite:** 40 caracteres

**Valores por Tipo de Origem:**

**Turmas de Colheita:**
- **Fonte:** Frontend (`TurmaColheitaPagamentosModal.js`)
- **Valor:** Nome do colhedor (limitado a 40 caracteres)
- **Exemplo:** `"João Silva"`

**Folha de Pagamento:**
- **Fonte:** Backend (`folha-pagamento.service.ts`)
- **Valor:** Nome do funcionário (limitado a 40 caracteres)
- **Exemplo:** `"Maria Santos"`

**Observação:** Campo de uso livre pelo cliente conveniado, sem tratamento pelo Banco do Brasil.

---

#### 4.3. `descricaoPagamentoInstantaneo` (Implementado)

**Status:** ✅ Implementado

**Limite:** 26 caracteres

**Valores por Tipo de Origem:**

**Turmas de Colheita:**
- **Fonte:** Frontend (`TurmaColheitaPagamentosModal.js`)
- **Valor:** Número do pedido (limitado a 26 caracteres)
- **Exemplo:** `"PED-2025-001"`

**Folha de Pagamento:**
- **Fonte:** Backend (`folha-pagamento.service.ts`)
- **Valor:** Formato `"FOLHA MM/YYYY Q"` (limitado a 26 caracteres)
- **Exemplo:** `"FOLHA 11/2025 1Q"` (Folha de novembro/2025, 1ª quinzena)
- **Exemplo:** `"FOLHA 11/2025 2Q"` (Folha de novembro/2025, 2ª quinzena)

**Observação:** Descrição do pagamento instantâneo para fins de conciliação do próprio cliente.

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

#### 4.1.1. Tratamento de Itens Bloqueados

**Comportamento Especial:** O sistema detecta automaticamente quando itens de pagamento estão bloqueados e marca o lote inteiro como rejeitado para impedir a liberação, pois itens bloqueados impedem o processamento dos créditos.

**Cenários:**

1. **Na Criação do Lote (Resposta Inicial do BB):**
   - Um lote é criado e enviado ao BB
   - A resposta inicial indica que alguns itens foram rejeitados (`indicadorMovimentoAceito = "N"`)
   - O sistema marca o lote como rejeitado imediatamente
   - Itens rejeitados: `status = REJEITADO`, `FuncionarioPagamento.statusPagamento = REJEITADO`
   - Itens aceitos mas em lote rejeitado: `status = BLOQUEADO`, `FuncionarioPagamento.statusPagamento = REPROCESSAR`
   - **Não são criados jobs de sincronização** para nenhum item do lote rejeitado

2. **Após Criação (Consulta Individual ou Job):**
   - Um lote é criado no dia **25** com `dataPagamento` configurada para o dia **25**.
   - O lote não é liberado imediatamente e permanece pendente.
   - Quando a data de pagamento passa e o lote ainda não foi liberado, o BB retorna o estado `BLOQUEADO` para os itens afetados.

**O que acontece:**

1. **Detecção de Itens Bloqueados:**
   - Os jobs de sincronização (`PagamentosSyncWorkerService`) consultam periodicamente o status dos itens no BB.
   - Quando um item é consultado individualmente e retorna `estadoPagamento = "BLOQUEADO"`, o sistema:
     - Atualiza `estadoPagamentoIndividual = "BLOQUEADO"` no item
     - Marca o item como `status = REJEITADO` (status interno)
     - Verifica se há outros itens bloqueados no mesmo lote

2. **Marcação Automática do Lote como Rejeitado:**
   - Quando **qualquer item** do lote está bloqueado, o sistema automaticamente:
     - Marca o lote como `estadoRequisicaoAtual = 7` (Rejeitado)
     - Atualiza `status = REJEITADO` no lote
     - Adiciona observação explicando que itens bloqueados foram detectados
   - **IMPORTANTE:** O estado do lote é marcado como rejeitado **independente** do estado retornado pela API do BB para o lote (ex: mesmo que a API retorne estado 5 = PROCESSANDO, o sistema força estado 7 se houver itens bloqueados)

3. **Preservação de Itens Já Pagos:**
   - **Itens já pagos são preservados:** Se um item já está com `status = PROCESSADO` (pago), ele **não é alterado** mesmo que outros itens do lote estejam bloqueados
   - **FuncionarioPagamento:** Se o item já está pago, o status do funcionário permanece como `PAGO` na tabela `arh_funcionarios_pagamento`
   - **Colheitas:** Se o item já está pago, as colheitas vinculadas permanecem como pagas
   - Apenas itens bloqueados que **não estão pagos** são marcados como rejeitados

4. **Atualização de Status na Criação do Lote:**
   - **Item rejeitado pelo BB (`indicadorMovimentoAceito = "N"`):**
     - `status = REJEITADO` (item realmente inconsistente)
     - `FuncionarioPagamento.statusPagamento = REJEITADO`
     - `FuncionarioPagamento.pagamentoEfetuado = false`
   - **Item aceito pelo BB mas em lote rejeitado (`indicadorMovimentoAceito = "S"` mas lote rejeitado):**
     - `status = BLOQUEADO` (item aceito mas lote rejeitado)
     - `estadoPagamentoIndividual = 'BLOQUEADO'`
     - `FuncionarioPagamento.statusPagamento = REPROCESSAR`
     - `FuncionarioPagamento.pagamentoEfetuado = false`
   - **Lote marcado como rejeitado:**
     - `estadoRequisicao = 3` (se todos os itens são rejeitados) ou `7` (se apenas alguns são rejeitados)
     - `status = REJEITADO`
     - **Não são criados jobs de sincronização** para nenhum item
     - **Não são criadas notificações** de liberação

5. **Atualização de Status Após Criação (Consulta Individual ou Job):**
   - **Item bloqueado (não pago):**
     - `estadoPagamentoIndividual = "BLOQUEADO"` (preservado da API)
     - `status = REJEITADO` (status interno)
     - `FuncionarioPagamento.statusPagamento = REJEITADO`
     - Colheitas revertidas para pendente
   - **Item bloqueado (já pago):**
     - `estadoPagamentoIndividual = "BLOQUEADO"` (preservado da API)
     - `status = PROCESSADO` (preservado - não alterado)
     - `FuncionarioPagamento.statusPagamento = PAGO` (preservado - não alterado)
     - Colheitas permanecem como pagas

5. **Comportamento na Consulta de Lote Completo:**
   - A consulta de lote completo (`consultarSolicitacaoTransferenciaPixOnline`) **não retorna** `estadoPagamento` individual dos itens
   - O sistema verifica se algum item já tem `estadoPagamentoIndividual = 'BLOQUEADO'` (de consulta individual anterior)
   - Se encontrar itens bloqueados, marca o lote como rejeitado mesmo que a API retorne outro estado
   - Itens já pagos são preservados durante a atualização

6. **Comportamento na Consulta Individual:**
   - A consulta individual (`consultarStatusTransferenciaIndividual`) retorna `estadoPagamento = "BLOQUEADO"` quando aplicável
   - O sistema atualiza o item e verifica o lote automaticamente
   - Se houver itens bloqueados, o lote é marcado como rejeitado

**Fluxo Completo:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Job consulta ITEM INDIVIDUAL                             │
│    - API retorna: estadoPagamento = "BLOQUEADO"            │
│    - Sistema atualiza:                                      │
│      → estadoPagamentoIndividual = 'BLOQUEADO'             │
│      → status = REJEITADO (se não está pago)               │
│      → FuncionarioPagamento = REJEITADO (se não está pago) │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Sistema verifica lote                                    │
│    - Busca todos os itens do lote                           │
│    - Verifica se algum tem estadoPagamentoIndividual =      │
│      'BLOQUEADO'                                            │
│    - Se encontrar → Marca lote como REJEITADO (estado 7)   │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Job consulta LOTE COMPLETO                               │
│    - API retorna: estadoRequisicao = 5 (PROCESSANDO)       │
│    - Sistema verifica itens bloqueados                      │
│    - Se houver itens bloqueados:                            │
│      → Força estadoRequisicaoAtual = 7 (ignora estado 5)   │
│      → status = REJEITADO                                   │
│    - Preserva itens já pagos (não altera status)            │
└─────────────────────────────────────────────────────────────┘
```

**Observações Importantes:**
- Itens bloqueados impedem a liberação do lote, pois o crédito não poderá ser efetuado
- Quando um lote está rejeitado por itens bloqueados, os funcionários têm seus status atualizados:
  - Funcionários com item `REJEITADO` → `statusPagamento = REJEITADO`
  - Funcionários com item `BLOQUEADO` → `statusPagamento = REPROCESSAR`
- Funcionários com status `REPROCESSAR` podem ser incluídos no reprocessamento via botão "Reprocessar Pagamentos Rejeitados"
- Itens já pagos são sempre preservados, mesmo em lotes rejeitados
- O sistema garante consistência entre consulta individual e consulta de lote completo
- Lotes rejeitados na criação **não geram jobs de sincronização** nem notificações de liberação

**Implementação Técnica:**

O método `verificarEAtualizarLoteComItensBloqueados()` é chamado em dois momentos:

1. **Após consulta individual de item** (`consultarStatusTransferenciaIndividual`):
   - Quando um item retorna `estadoPagamento = "BLOQUEADO"`
   - O método verifica todos os itens do lote
   - Se encontrar itens bloqueados, marca o lote como rejeitado (estado 7)

2. **Após consulta de lote completo** (`consultarSolicitacaoTransferenciaPixOnline`):
   - Após atualizar todos os itens com dados do lote
   - Verifica se algum item tem `estadoPagamentoIndividual = 'BLOQUEADO'` (de consulta individual anterior)
   - Se encontrar, marca o lote como rejeitado mesmo que a API retorne outro estado

**Lógica de Preservação de Itens Pagos:**

```typescript
// Na consulta de lote completo
const itemJaPago = item.status === StatusPagamentoItem.PROCESSADO || 
                   statusFinal === StatusPagamentoItem.PROCESSADO;

// Na consulta individual
const itemJaPago = itemAtualizado.status === StatusPagamentoItem.PROCESSADO;

// Só atualiza se NÃO está pago
if (!itemJaPago) {
  // Marcar como rejeitado
} else {
  // Preservar status de pago
}
```

**Campos Atualizados no Lote quando há itens bloqueados:**
- `estadoRequisicaoAtual = 7` (Rejeitado)
- `status = REJEITADO`
- `observacoes`: Adiciona observação explicando que itens bloqueados foram detectados e o motivo da rejeição

**Campos Atualizados no Item quando está bloqueado na criação do lote:**
- **Item rejeitado pelo BB:**
  - `status = REJEITADO`
  - `FuncionarioPagamento.statusPagamento = REJEITADO`
  - `FuncionarioPagamento.pagamentoEfetuado = false`
- **Item aceito mas em lote rejeitado:**
  - `status = BLOQUEADO`
  - `estadoPagamentoIndividual = 'BLOQUEADO'`
  - `FuncionarioPagamento.statusPagamento = REPROCESSAR`
  - `FuncionarioPagamento.pagamentoEfetuado = false`

**Campos Atualizados no Item quando está bloqueado após criação (se não está pago):**
- `estadoPagamentoIndividual = "BLOQUEADO"` (preservado da API)
- `status = REJEITADO` (status interno)
- `FuncionarioPagamento.statusPagamento = REJEITADO` (se vinculado)
- Colheitas revertidas para pendente (se vinculadas)

**Campos Preservados no Item quando está bloqueado mas já está pago:**
- `estadoPagamentoIndividual = "BLOQUEADO"` (preservado da API)
- `status = PROCESSADO` (preservado - não alterado)
- `FuncionarioPagamento.statusPagamento = PAGO` (preservado - não alterado)
- Colheitas permanecem como pagas (não revertidas)

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

#### 4.3. Lógica do Botão "Liberar" no Frontend

**Arquivo:** `frontend/src/pages/Pagamentos.js`

**Lógica de exibição do botão "Liberar":**

O botão "Liberar" aparece quando **TODAS** as condições abaixo são verdadeiras:

1. `estadoRequisicao === 1` (dados consistentes, aguardando liberação) **OU** `estadoRequisicao === 4` (pendente de ação pelo Conveniado)
2. `estadoRequisicao !== 9` (não está liberado via API)
3. `estadoRequisicao !== 6` (não está processado)
4. **`!record.dataLiberacao`** (não foi liberado anteriormente) ⚠️ **IMPORTANTE**

**Por que verificar `dataLiberacao`?**

Devido à sequência real dos estados do BB (1,2,3 → 8 → 4 → 9/10 → 6/7), um lote pode:
- Estar em estado `8` (Preparando remessa não liberada)
- Ser liberado pelo administrador (preenche `dataLiberacao`)
- O BB retornar estado `4` (Pendente de ação pelo Conveniado) na próxima consulta

Sem a verificação de `dataLiberacao`, o frontend mostraria o botão "Liberar" novamente, mesmo que o lote já tenha sido liberado. A verificação de `dataLiberacao` garante que o botão só apareça para lotes que ainda não foram liberados.

**Código:**
```javascript
const podeLiberar =
  estadoRequisicao &&
  (estadoRequisicao === 1 || estadoRequisicao === 4) &&
  estadoRequisicao !== 9 &&
  estadoRequisicao !== 6 &&
  !record.dataLiberacao; // ✅ Não mostrar se já foi liberado anteriormente
```

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
      // descricaoPagamento: nome do colhedor (limitado a 40 caracteres)
      descricaoPagamento: "João Silva",
      // descricaoPagamentoInstantaneo: número do pedido (limitado a 26 caracteres)
      descricaoPagamentoInstantaneo: "PED-2025-001",
      // documentoDebito: não está sendo enviado (opcional - não implementado)
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
- ✅ **Validação de data de pagamento agendada** (via hook `useRestricaoDataPagamentoLoteBB` no frontend):
  - Não permite selecionar domingos
  - Não permite selecionar data atual após 20:00 (deve selecionar próximo dia útil)
  - Alerta para liberar remessa até 21:00 do dia atual
  - Aplicada em todas as funcionalidades que criam pagamentos via API de lotes do BB (Turma Colheita e Folha de Pagamento)

### Compatibilidade
- ✅ Compatível com lotes criados antes da persistência
- ✅ Consultas funcionam mesmo sem lote no banco (consulta BB diretamente)
- ✅ Frontend atualizado para pagamento consolidado

---

## 🚧 Próximos Passos

### Fase 7: Jobs e Processamento Assíncrono (Concluído)
- ✅ Fila `pagamento_api_sync_job` (delay 15 min, controle por conta)
- ✅ Worker cron serial + logs narrativos
- ✅ Backoff, reagendamento automático e resumo por execução

### Fase 8: Webhook (Concluído ✅)
- ✅ Endpoint implementado: `POST /api/webhooks/bb/pagamentos`
- ✅ Autenticação mTLS com validação de certificados do BB
- ✅ Tratamento de todos os estados (PAGO, BLOQUEADO, REJEITADO, CANCELADO, PENDENTE)
- ✅ Preservação de itens já pagos
- ✅ Detecção e tratamento de itens bloqueados (marca lote como rejeitado)
- ✅ Atualização condicional de colheitas e funcionários
- ✅ Persistência de eventos em `bb_webhook_events` para auditoria
- ✅ Logs detalhados em cada etapa do processamento

### Futuro: Integração com Fornecedores
- ⚠️ Integrar com `FornecedorPagamento`

### Integração com Funcionários (Concluído ✅)
- ✅ Integração com `FuncionarioPagamento` (folha ARH)
- ✅ Suporte a múltiplos itens por lote (até 320 transferências por lote)
- ✅ Divisão automática em múltiplos lotes se > 320 funcionários
- ✅ Sincronização automática de status via jobs

### 📅 Data de Pagamento Agendada

#### Armazenamento da Data Agendada

A **data de pagamento agendada** (informada pelo usuário ao criar o lote) é sempre salva no campo `dataPagamentoEnviada` da tabela `pagamento_api_item`:

- **Tabela:** `pagamento_api_item`
- **Campo:** `dataPagamentoEnviada` (tipo `String`)
- **Formato:** `ddmmaaaa` (ex: `"8122025"` = 08/12/2025)
- **Quando é salva:** No momento da criação do item, antes de enviar ao BB
- **Onde é usada:** Enviada ao Banco do Brasil no campo `data` de cada transferência

**Exemplo:**
```typescript
// Frontend envia: dataPagamento = "2025-12-08T15:00:00.000Z"
// Backend formata: "8122025" (ddmmaaaa)
// Salvo em: PagamentoApiItem.dataPagamentoEnviada = "8122025"
// Enviado ao BB: { data: "8122025", ... }
```

#### Exibição no Frontend

A data agendada é exibida de forma diferente dependendo da origem do pagamento:

**1. Folha de Pagamento (`ArhFolhaPagamento.js`):**
- **Fonte:** `FolhaPagamento.dataPagamento` (tabela `folha_pagamento`)
- **Obtida via:** Relação `funcionarioPagamento.folha.dataPagamento`
- **Exibida em:** Coluna "Data Agendamento" na tabela de lotes (`Pagamentos.js`)
- **Lógica:** Um lote de folha pode ter múltiplos funcionários, todos da mesma folha, então usa `folhaPrincipal.dataPagamento`

**2. Turma de Colheita (`TurmaColheitaPagamentosModal.js`):**
- **Fonte:** `TurmaColheitaPedidoCusto.dataPagamento` (tabela `turma_colheita_pedido_custo`)
- **Obtida via:** Relação `PagamentoApiItemColheita.turmaColheitaCusto.dataPagamento`
- **Exibida em:** Coluna "Data Agendamento" na tabela de lotes (`Pagamentos.js`)
- **Lógica:** Um lote de colheita tem exatamente 1 item que pode pagar múltiplas colheitas, então usa `todasColheitas[0].dataPagamento` (primeiro item de colheita)

**Diferença fundamental:**
- **Folha:** Data vem da folha (1 folha → N funcionários → 1 lote)
- **Colheita:** Data vem do item de colheita (1 item → N colheitas → 1 lote)

#### Validação de Data Agendada (Frontend)

O sistema utiliza o hook `useRestricaoDataPagamentoLoteBB` para validar a data de pagamento agendada em todas as funcionalidades que criam pagamentos via API de lotes do BB:

**Validações implementadas:**
1. **Não permite domingos:** Se o usuário tentar selecionar um domingo, o sistema bloqueia a seleção e sugere o próximo dia útil
2. **Horário limite (20:00):** Se a hora atual for superior a 20:00, não permite selecionar o dia atual e sugere o próximo dia útil
3. **Alerta de liberação:** Sempre alerta o usuário para liberar a remessa criada em "Relatórios → Pagamentos" até as 21:00 do dia atual, independente da data selecionada para pagamento

**Onde é aplicado:**
- ✅ `TurmaColheitaPagamentosModal.js` - Modal de pagamentos de colheitas
- ✅ `FinalizarFolhaDialog.js` - Modal de finalização de folha de pagamento
- ✅ `ArhFolhaPagamento.js` - Reprocessamento de pagamentos rejeitados

**Comportamento:**
- Para **PIX-API:** Aplica todas as validações (domingos, horário 20:00, alerta 21:00)
- Para **outros métodos** (PIX, Espécie): Apenas bloqueia datas futuras (permite data atual e anteriores)

#### Uso da Data no Backend

**Folha de Pagamento:**
- A data informada pelo usuário é salva em `FolhaPagamento.dataPagamento` ao finalizar a folha
- Quando o lote é criado (ao liberar a folha), o backend usa `folha.dataPagamento` se disponível, senão usa data atual
- A data é formatada para `ddmmaaaa` e salva em `PagamentoApiItem.dataPagamentoEnviada`

**Turma de Colheita:**
- A data informada pelo usuário é enviada no payload ao criar o lote
- O backend salva a data formatada em `PagamentoApiItem.dataPagamentoEnviada`
- A data também é salva em `TurmaColheitaPedidoCusto.dataPagamento` quando o status é `PAGO` (não quando é `PROCESSANDO`)

**⚠️ IMPORTANTE:**
- `PagamentoApiItem.dataPagamentoEnviada`: Sempre preenchido (data agendada enviada ao BB)
- `TurmaColheitaPedidoCusto.dataPagamento`: Só preenchido quando status = `PAGO` (data real do pagamento)
- `FolhaPagamento.dataPagamento`: Sempre preenchido ao finalizar (data agendada informada pelo usuário)

### Integração com ARH (Implementado ✅)

#### Estrutura de Dados
- Tabelas `arh_folhas_pagamento` e `arh_funcionarios_pagamento` mantêm o cálculo da folha internamente.
- Cada lançamento possui `meioPagamento` (`PIX`, `PIX_API`, `ESPECIE`), `pagamentoEfetuado` e `statusPagamento`.
- Relacionamento **1:1**: `FuncionarioPagamento.pagamentoApiItemId` ↔ `PagamentoApiItem.funcionarioPagamentoId`.

#### Fluxo de Pagamento PIX-API
```
RASCUNHO → PENDENTE_LIBERACAO → EM_PROCESSAMENTO → FECHADA
                    │                   │
              Finalizar folha    Liberar folha (orquestra tudo)
              (selecionar        (detecta PIX_API automaticamente,
               PIX_API)          cria lotes se necessário,
                                 e libera em uma única operação)
```

#### Endpoint Principal: `PATCH /api/arh/folhas/:id/liberar` ⭐ RECOMENDADO
- **Permissões:** `ADMINISTRADOR`
- **Payload:** Nenhum (usa dados já salvos na folha)
- **Lógica Orquestrada:**
  1. Valida folha (status `PENDENTE_LIBERACAO` ou `EM_PROCESSAMENTO`)
  2. **Se `meioPagamento = PIX_API`:**
     - Verifica se já existem lotes criados (idempotência)
     - Se não existem, cria lotes no BB automaticamente
     - Se já existem, pula criação (não duplica)
  3. **Se `meioPagamento = PIX` ou `ESPECIE`:**
     - Pula processamento PIX-API
  4. Atualiza `statusPagamento` dos lançamentos:
     - PIX_API: `ENVIADO` (aguarda processamento BB)
     - PIX/ESPECIE: `PAGO` + `pagamentoEfetuado = true`
  5. Recalcula totais da folha
  6. Fecha folha (status `FECHADA`)

**Vantagens:**
- ✅ **Idempotência**: Não cria lotes duplicados se chamado múltiplas vezes
- ✅ **Orquestração**: Tudo em uma única operação
- ✅ **Recuperação Automática**: Trata estados inconsistentes automaticamente
- ✅ **Simplicidade**: Frontend faz apenas uma chamada

#### Endpoint Legado: `POST /api/arh/folhas/:id/processar-pix-api` ⚠️ DEPRECATED
- **Status:** ⚠️ **DEPRECATED** - Mantido apenas para compatibilidade e uso manual
- **Recomendação:** Use `PATCH /api/arh/folhas/:id/liberar` que orquestra automaticamente
- **Permissões:** `ADMINISTRADOR`, `GERENTE_GERAL`, `ESCRITORIO`
- **Payload:** `{ contaCorrenteId, dataPagamento, observacoes }`
- **Lógica:**
  1. Valida folha (status `PENDENTE_LIBERACAO`)
  2. Busca lançamentos com `meioPagamento = PIX_API`, `pagamentoEfetuado = false` e `pagamentoApiItemId = null`
  3. Valida chave PIX de todos os funcionários (busca do cadastro `Funcionario.chavePix`)
  4. Monta 1 transferência por funcionário usando a chave PIX atual do cadastro
  5. Salva a chave PIX em `pagamento_api_item.chavePixEnviada` quando o item é criado
  5. **Divide em chunks de 320** (limite do BB)
  6. Para cada chunk, cria 1 lote com até 320 transferências em `listaTransferencias`
  7. Vincula cada `PagamentoApiItem` ao respectivo `FuncionarioPagamento`
  8. Atualiza `statusPagamento` para cada funcionário:
     - Se item foi rejeitado: `statusPagamento = REJEITADO`
     - Se item está bloqueado (lote rejeitado): `statusPagamento = REPROCESSAR`
     - Caso contrário: `statusPagamento = ENVIADO`
  9. Atualiza status da folha para `EM_PROCESSAMENTO`

#### Tratamento de Itens Rejeitados na Criação do Lote
Quando um lote é criado e a resposta inicial do BB indica itens rejeitados (`indicadorMovimentoAceito = "N"`):

**Comportamento:**
1. **Itens Rejeitados pelo BB:**
   - `status = REJEITADO` (item realmente inconsistente)
   - `FuncionarioPagamento.statusPagamento = REJEITADO`
   - `FuncionarioPagamento.pagamentoEfetuado = false`

2. **Itens Aceitos pelo BB mas em Lote Rejeitado:**
   - `status = BLOQUEADO` (item aceito mas lote rejeitado)
   - `estadoPagamentoIndividual = 'BLOQUEADO'`
   - `FuncionarioPagamento.statusPagamento = REPROCESSAR`
   - `FuncionarioPagamento.pagamentoEfetuado = false`

3. **Lote Marcado como Rejeitado:**
   - Se houver **qualquer item rejeitado**, o lote inteiro é marcado como rejeitado:
     - `estadoRequisicao = 3` (se todos os itens são rejeitados)
     - `estadoRequisicao = 7` (se apenas alguns são rejeitados)
     - `status = REJEITADO`
   - **Não são criados jobs de sincronização** para nenhum item do lote rejeitado
   - **Não são criadas notificações** de liberação

**Motivo:**
- Itens bloqueados não serão processados nem liberados, mesmo que tenham sido aceitos pelo BB
- Funcionários com status `REPROCESSAR` podem ser incluídos no reprocessamento via botão específico

#### Sincronização Automática de Status
Quando o job de sincronização (`PagamentosSyncWorkerService`) ou webhook atualiza um `PagamentoApiItem` que tem `funcionarioPagamentoId`:
- `estadoPagamento = "PAGO"` → `FuncionarioPagamento.statusPagamento = 'PAGO'`, `pagamentoEfetuado = true`
- `estadoPagamento = "REJEITADO"` → `FuncionarioPagamento.statusPagamento = 'REJEITADO'`, `pagamentoEfetuado = false`
- `estadoPagamento = "BLOQUEADO"` → `FuncionarioPagamento.statusPagamento = 'REJEITADO'`, `pagamentoEfetuado = false` (apenas se o item não está pago)
  - **IMPORTANTE:** Se o item já está como `PROCESSADO` (pago), o status do funcionário permanece como `PAGO` e não é alterado

#### Recálculo Automático de Folhas
Após cada atualização de `FuncionarioPagamento` via jobs ou webhook, o sistema automaticamente:
1. **Recalcula os totais da folha** (`totalBruto`, `totalLiquido`, `totalPago`, `totalPendente`)
2. **Atualiza a coluna "Pago"** na listagem de folhas, considerando apenas `pagamentoEfetuado = true`
3. **Garante sincronização** entre `statusPagamento` e `pagamentoEfetuado`:
   - `statusPagamento = PAGO` → sempre `pagamentoEfetuado = true`
   - `statusPagamento = REJEITADO` → sempre `pagamentoEfetuado = false`
   - `statusPagamento = REPROCESSAR` → sempre `pagamentoEfetuado = false`

**Pontos de Recálculo:**
- ✅ Após atualização via `atualizarFuncionarioPagamentoDoItem` (jobs e webhook)
- ✅ Após atualização em lote via `consultarSolicitacaoTransferenciaPixOnline` (consulta de lote completo)
- ✅ Método público `recalcularFolhaNoBanco` disponível para uso externo

#### Fechamento Automático de Folhas PIX-API
Quando uma folha está em `EM_PROCESSAMENTO` com `meioPagamento = PIX_API`, o sistema verifica automaticamente após cada recálculo:

**Condições para Fechamento Automático:**
1. Folha está em status `EM_PROCESSAMENTO`
2. Meio de pagamento é `PIX_API`
3. **Todos** os lançamentos têm `pagamentoEfetuado = true` (todos foram pagos)
4. **Nenhum** lançamento está com `statusPagamento = REJEITADO` ou `statusPagamento = REPROCESSAR`

**Comportamento:**
- ✅ **Fechamento Automático**: Quando todas as condições são atendidas, a folha é fechada automaticamente (status `FECHADA`)
- ⚠️ **Mantém EM_PROCESSAMENTO**: Se houver lançamentos rejeitados, a folha permanece em `EM_PROCESSAMENTO` para permitir reprocessamento
- ✅ **Após Reprocessamento**: Se todos os rejeitados forem reprocessados e pagos, a folha será fechada automaticamente na próxima atualização

**Diferença entre Meios de Pagamento:**
- **PIX Manual ou Espécie**: Folha é fechada imediatamente ao clicar em "Finalizar Folha" (pagamentos são marcados como PAGO instantaneamente)
- **PIX-API**: Folha vai para `EM_PROCESSAMENTO` e é fechada automaticamente quando todos os pagamentos são concluídos

#### Diferença: Colheitas vs Funcionários
| Aspecto | Colheitas | Funcionários |
|---------|-----------|--------------|
| Relacionamento | N:N (`PagamentoApiItemColheita`) | 1:1 (`funcionarioPagamentoId`) |
| Transferências/lote | 1 única (consolidada) | Até 320 (1 por funcionário) |
| Payload montado | Frontend | Backend |

#### Idempotência e Recuperação Automática

O endpoint `PATCH /api/arh/folhas/:id/liberar` implementa idempotência:

- **Verificação de Lotes Existentes**: Antes de criar lotes, verifica se já existem através do campo `pagamentoApiItemId` nos lançamentos
- **Não Duplica Lotes**: Se todos os lançamentos já têm `pagamentoApiItemId`, pula a criação de lotes
- **Recuperação Automática**: Se alguns lançamentos têm lote e outros não (estado inconsistente), cria lotes apenas para os faltantes
- **Chamadas Múltiplas**: Pode ser chamado múltiplas vezes sem criar lotes duplicados

**Cenários de Uso:**
- ✅ Primeira vez: Cria lotes e libera folha
- ✅ Segunda vez (após falha): Detecta lotes existentes, não duplica, apenas libera
- ✅ Estado inconsistente: Recupera automaticamente criando lotes apenas para os faltantes

#### Reprocessamento de Pagamentos Rejeitados
Quando uma folha PIX-API tem pagamentos rejeitados, o sistema oferece funcionalidade de reprocessamento:

**Endpoint:** `PATCH /api/arh/folhas/:id/reprocessar-pagamentos-rejeitados`
- **Permissões:** `ADMINISTRADOR`
- **Payload:** `{ meioPagamento, dataPagamento, contaCorrenteId?, observacoes? }`

**Lógica:**
1. Busca todos os lançamentos com `statusPagamento = REJEITADO` ou `statusPagamento = REPROCESSAR` na folha
   - **REJEITADO**: Item realmente rejeitado pelo BB (dados inconsistentes)
   - **REPROCESSAR**: Item bloqueado em lote rejeitado (precisa ser reprocessado)
2. Limpa o vínculo anterior: `pagamentoApiItemId = null`, `statusPagamento = PENDENTE`
3. **Se `meioPagamento = PIX_API`:**
   - Solicita conta corrente novamente
   - **Busca chave PIX atualizada do cadastro do funcionário** (`Funcionario.chavePix`)
   - Cria novos lotes apenas para os funcionários rejeitados/bloqueados usando a chave PIX atual do cadastro
   - Salva a chave PIX atual em `pagamento_api_item.chavePixEnviada` para consistência histórica
   - Mantém folha em `EM_PROCESSAMENTO`
4. **Se `meioPagamento = PIX` ou `ESPECIE`:**
   - Marca lançamentos como `PAGO` e `pagamentoEfetuado = true` imediatamente
   - Não cria novos lotes

**Frontend:**
- Botão "Reprocessar Pagamentos Rejeitados" aparece na seção "Resumo" quando:
  - Folha tem `meioPagamento = PIX_API`
  - Folha tem `quantidadeRejeitados > 0`
- Alerta visual (ícone ⚠️) na coluna "Status" da tabela de folhas para folhas `FECHADA` ou `EM_PROCESSAMENTO` com rejeitados

#### Comportamento da Chave PIX em Folhas de Pagamento

**Fonte da Chave PIX:**
- ✅ **Sempre do cadastro do funcionário**: A chave PIX sempre vem da tabela `Funcionario.chavePix` no momento da criação do lote
- ✅ **Não armazenada em `arh_funcionario_pagamento`**: A tabela `arh_funcionario_pagamento` não armazena chave PIX, sempre consulta do cadastro do funcionário

**Armazenamento para Consistência Histórica:**
- ✅ **Salva em `pagamento_api_item`**: Quando um item de pagamento é criado, a chave PIX e o responsável são salvos em `chavePixEnviada`, `tipoChavePixEnviado` e `responsavelChavePixEnviado`
- ✅ **Preserva histórico**: Se o funcionário mudar a chave PIX ou responsável no cadastro após um pagamento ser criado, o pagamento anterior mantém os dados antigos salvos para rastreabilidade

**Criação Original de Lotes:**
- ✅ **Busca dados atuais**: O método `criarLotesParaLancamentos` busca `funcionario.chavePix`, `funcionario.tipoChavePix` e `funcionario.responsavelChavePix` do cadastro
- ✅ **Validação**: Valida se todos os funcionários têm chave PIX cadastrada antes de criar o lote
- ✅ **Salva no item**: A chave PIX e o responsável são extraídos do objeto `transferencia` e salvos em `pagamento_api_item.chavePixEnviada`, `tipoChavePixEnviado` e `responsavelChavePixEnviado`

**Reprocessamento de Pagamentos Rejeitados:**
- ✅ **Usa dados atualizados**: O método `reprocessarPagamentosRejeitados` busca `funcionario.chavePix`, `funcionario.tipoChavePix` e `funcionario.responsavelChavePix` do cadastro novamente
- ✅ **Dados atuais do cadastro**: Se o funcionário mudou a chave PIX ou responsável após o primeiro lote, o reprocessamento usa os dados atualizados
- ✅ **Novo item com dados atuais**: Um novo `PagamentoApiItem` é criado com a chave PIX e responsável atuais do cadastro salvos em `chavePixEnviada`, `tipoChavePixEnviado` e `responsavelChavePixEnviado`

**Exemplo de Fluxo:**
1. **Dia 01/01**: Funcionário tem chave PIX `12345678900` (CPF) e responsável `João Silva` no cadastro
2. **Dia 01/01**: Folha é liberada → Lote criado com `chavePixEnviada = "12345678900"` e `responsavelChavePixEnviado = "João Silva"`
3. **Dia 05/01**: Funcionário atualiza chave PIX para `chave-aleatoria-xyz` e responsável para `Maria Santos` no cadastro
4. **Dia 10/01**: Pagamento é rejeitado → Reprocessamento usa `chave-aleatoria-xyz` e `Maria Santos` (dados atuais)
5. **Resultado**: 
   - Item original mantém `chavePixEnviada = "12345678900"` e `responsavelChavePixEnviado = "João Silva"` (histórico preservado)
   - Novo item tem `chavePixEnviada = "chave-aleatoria-xyz"` e `responsavelChavePixEnviado = "Maria Santos"` (dados atuais)

**Benefícios:**
- ✅ **Rastreabilidade**: Histórico completo de qual chave PIX e responsável foram usados em cada pagamento
- ✅ **Atualização automática**: Novos lotes sempre usam a chave PIX e responsável mais atuais do cadastro
- ✅ **Consistência**: Não há risco de usar chave PIX ou responsável desatualizados em novos pagamentos
- ✅ **Auditoria**: Possibilidade de verificar qual chave PIX e responsável foram usados em cada pagamento histórico

#### Outros Detalhes
- Fluxo manual (PIX comum ou espécie) permanece independente e simples.
- Endpoints REST para cargos, funções, funcionários e folha estão sob `api/arh/...`.
- Campos `usuarioCriacaoId`, `usuarioLiberacaoId` e `dataLiberacao` registram auditoria.
- Endpoint `POST /api/arh/folhas/:id/processar-pix-api` está **deprecated** mas mantido para compatibilidade.
- **Garantia de Consistência**: `pagamentoEfetuado` sempre está sincronizado com `statusPagamento` em todos os pontos do sistema (jobs, webhook, processamento manual)

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

**Última atualização:** 2025-01-XX

**Versão:** 1.1.0

**Status:** 98% Concluído

**Mudanças Recentes (v1.1.0):**
- ✅ Recálculo automático de folhas após atualizações de pagamento (jobs/webhook)
- ✅ Fechamento automático de folhas PIX-API quando todos os pagamentos estão PAGO
- ✅ Sincronização garantida de `pagamentoEfetuado` com `statusPagamento` em todos os pontos
- ✅ Alerta visual para folhas com pagamentos rejeitados (FECHADA ou EM_PROCESSAMENTO)
- ✅ Reprocessamento de pagamentos rejeitados com suporte a mudança de meio de pagamento
- ✅ Documentação completa do comportamento da chave PIX: sempre atualizada do cadastro do funcionário, armazenada para consistência histórica em `pagamento_api_item.chavePixEnviada`, `tipoChavePixEnviado` e `responsavelChavePixEnviado`
- ✅ Campo `responsavelChavePixEnviado` adicionado em `pagamento_api_item` para rastreabilidade do responsável pela chave PIX
- ✅ **Hook de validação de data de pagamento** (`useRestricaoDataPagamentoLoteBB`): valida domingos, horário 20:00 e alerta de liberação até 21:00
- ✅ **Data de pagamento agendada**: documentação completa sobre onde é salva (`PagamentoApiItem.dataPagamentoEnviada`) e como é exibida no frontend (diferença entre folha e turma colheita)
- ✅ **Backend usa data informada pelo usuário**: ajustado para usar `FolhaPagamento.dataPagamento` ao criar lotes, em vez de sempre usar data atual


