# 📖 Narrativa Completa: Fluxo de Pagamentos PIX-API

## 🎯 Visão Geral

Este documento descreve o fluxo completo do sistema de pagamentos PIX-API, desde a criação do lote até a atualização via jobs e webhooks, explicando como os estados de **ITENS** e **LOTES** são tratados de forma diferente.

---

## 📊 Diferença Fundamental: Estados de ITENS vs LOTES

### Estados de ITENS (`pagamento_api_item`)

**Campos de Estado:**
- `estadoPagamentoIndividual` (String, do BB): Estado retornado pela API do BB
  - Valores possíveis: `"BLOQUEADO"`, `"PAGO"`, `"REJEITADO"`, `"CANCELADO"`, `"PENDENTE"`, `"AGENDADO"`, etc.
  - **Preservado exatamente como retornado pelo BB** (para rastreabilidade)
  
- `status` (Enum interno): Status interno do sistema
  - Valores: `PENDENTE`, `ENVIADO`, `ACEITO`, `REJEITADO`, `BLOQUEADO`, `PROCESSADO`, `ERRO`
  - **Mapeado pelo sistema** baseado no `estadoPagamentoIndividual` ou resposta inicial do BB

**Regra Importante:**
- Quando o BB retorna `estadoPagamento = "BLOQUEADO"` (via consulta individual):
  - ✅ `estadoPagamentoIndividual = "BLOQUEADO"` (preservado do BB)
  - ✅ `status = REJEITADO` (status interno - item não pode ser processado)
- Quando o lote é rejeitado na criação e o item foi aceito pelo BB:
  - ✅ `status = BLOQUEADO` (item aceito mas lote rejeitado)
  - ✅ `estadoPagamentoIndividual = 'BLOQUEADO'`
  - ✅ `FuncionarioPagamento.statusPagamento = REPROCESSAR`

### Estados de LOTES (`pagamento_api_lote`)

**Campos de Estado:**
- `estadoRequisicaoAtual` (Int, do BB): Estado numérico retornado pela API do BB
  - Valores: `1` (Consistente), `2` (Inconsistente parcial), `3` (Inconsistente total), `4` (Pendente ação), `5` (Processamento interno), `6` (Processada), `7` (Rejeitada), `8` (Preparando remessa não liberada), `9` (Liberada), `10` (Preparando remessa liberada)
  - **Pode ser sobrescrito pelo sistema** quando há itens bloqueados
  
- `status` (Enum interno): Status interno do sistema
  - Valores: `PENDENTE`, `ENVIADO`, `PROCESSANDO`, `CONCLUIDO`, `PARCIAL`, `REJEITADO`, `ERRO`
  - **Mapeado pelo sistema** baseado no `estadoRequisicaoAtual`

**Regra Importante:**
- Quando há itens bloqueados no lote:
  - ✅ `estadoRequisicaoAtual = 7` (forçado pelo sistema, mesmo que BB retorne outro estado)
  - ✅ `status = REJEITADO` (status interno)

---

## 🔄 Fluxo Completo: Da Criação à Finalização

### FASE 1: Criação do Lote

**Quando ocorre:**
- Usuário cria uma folha de pagamento e seleciona `meioPagamento = PIX_API`
- Sistema chama `PATCH /api/arh/folhas/:id/liberar` ⭐ **RECOMENDADO**
  - Este endpoint **orquestra tudo automaticamente**: cria lotes PIX-API (se necessário) e libera a folha em uma única operação
  - ⚠️ **Nota**: Existe também `POST /api/arh/folhas/:id/processar-pix-api`, mas este é **DEPRECATED** (legado) e mantido apenas para compatibilidade. O endpoint `liberar` já faz tudo que o `processar-pix-api` fazia, de forma mais robusta e idempotente.

**O que acontece:**

1. **Validação e Preparação:**
   - Sistema busca todos os funcionários com `meioPagamento = PIX_API` e `pagamentoEfetuado = false`
   - Valida que todos têm chave PIX cadastrada (`Funcionario.chavePix`)
   - Busca chave PIX **atual** do cadastro do funcionário (não usa dados antigos)

2. **Criação do Lote no Banco:**
   - Gera `numeroRequisicao` sequencial automaticamente
   - Cria registro em `pagamento_api_lote`:
     - `status = PENDENTE`
     - `estadoRequisicaoAtual = null` (ainda não consultado)
     - `usuarioCriacaoId = ID do usuário autenticado`

3. **Criação dos Itens:**
   - Divide funcionários em chunks de 320 (limite do BB)
   - Para cada chunk, cria itens em `pagamento_api_item`:
     - `status = PENDENTE`
     - `estadoPagamentoIndividual = null` (ainda não consultado)
     - `chavePixEnviada = chave PIX atual do funcionário` (para consistência histórica)
     - `responsavelChavePixEnviado = responsável atual do funcionário` (para consistência histórica)
     - `loteId = ID do lote criado`
     - `funcionarioPagamentoId = ID do lançamento na folha`

4. **Envio ao Banco do Brasil:**
   - Monta payload com até 320 transferências PIX
   - Envia `POST /lotes-transferencias-pix` ao BB
   - BB retorna resposta inicial com:
     - `estadoRequisicao` (1-10)
     - `listaTransferencias` com `identificadorPagamento` para cada item

5. **Atualização com Resposta Inicial:**
   - Atualiza `pagamento_api_lote`:
     - `estadoRequisicao = estadoRequisicao retornado pelo BB`
     - `estadoRequisicaoAtual = estadoRequisicao` (primeira vez)
     - `status = mapearStatusLote(estadoRequisicao)`
     - `payloadResposta = resposta completa do BB`
   - Atualiza `pagamento_api_item`:
     - `identificadorPagamento = identificador retornado pelo BB`
     - `indicadorMovimentoAceito = "S" ou "N"` (resposta inicial)
     - `payloadItemResposta = resposta completa do item`
     - `status = mapearStatusItem(indicadorMovimentoAceito, erros)`
       - `"N"` → `REJEITADO` (item realmente inconsistente)
       - `"S"` → `ACEITO` (item aceito pelo BB)

6. **Tratamento de Itens Rejeitados na Criação:**
   - ✅ Se houver itens rejeitados (`indicadorMovimentoAceito = "N"`):
     - **Itens rejeitados:**
       - `status = REJEITADO`
       - `FuncionarioPagamento.statusPagamento = REJEITADO`
       - `FuncionarioPagamento.pagamentoEfetuado = false`
     - **Itens aceitos mas em lote rejeitado:**
       - `status = BLOQUEADO`
       - `estadoPagamentoIndividual = 'BLOQUEADO'`
       - `FuncionarioPagamento.statusPagamento = REPROCESSAR`
       - `FuncionarioPagamento.pagamentoEfetuado = false`
     - **Lote marcado como rejeitado:**
       - `estadoRequisicao = 3` (se todos rejeitados) ou `7` (se apenas alguns)
       - `estadoRequisicaoAtual = estadoRequisicao`
       - `status = REJEITADO`
     - **Não são criados jobs de sincronização** para nenhum item
     - **Não são criadas notificações** de liberação
   - ✅ Se não houver itens rejeitados:
     - Cria notificações de liberação para administradores
     - Agenda jobs de sincronização (apenas para itens aceitos)

7. **Agendamento de Jobs (apenas se lote não foi rejeitado):**
   - ✅ Cria job `LOTE` em `pagamento_api_sync_job`:
     - `tipo = LOTE`
     - `numeroRequisicao = numeroRequisicao do lote`
     - `runAfter = now + 15 minutos` (delay padrão)
     - `status = PENDING`
   - ✅ Cria job `ITEM` para cada item aceito com `identificadorPagamento`:
     - `tipo = ITEM`
     - `identificadorPagamento = identificador do item`
     - `loteId = ID do lote`
     - `runAfter = now + 0 minutos` (sem delay - agendamento imediato)
     - `status = PENDING`

**Estado Final da Fase 1:**
- **Se lote não foi rejeitado:**
  - Lote: `status = PENDENTE` ou `PROCESSANDO`, `estadoRequisicaoAtual = 1-10`
  - Itens: `status = ACEITO`, `estadoPagamentoIndividual = null`
  - Jobs: `LOTE` agendado para +15min, `ITEM` agendado imediatamente
- **Se lote foi rejeitado:**
  - Lote: `status = REJEITADO`, `estadoRequisicaoAtual = 3 ou 7`
  - Itens rejeitados: `status = REJEITADO`, `FuncionarioPagamento.statusPagamento = REJEITADO`
  - Itens bloqueados: `status = BLOQUEADO`, `FuncionarioPagamento.statusPagamento = REPROCESSAR`
  - Jobs: Nenhum criado

---

### FASE 2: Processamento via Jobs (Polling)

**Quando ocorre:**
- Worker (`PagamentosSyncWorkerService`) executa a cada 1 minuto
- Processa jobs com `runAfter <= now` e `status = PENDING`

#### 2.1. Processamento de Job de ITEM

**O que acontece:**

1. **Consulta Individual no BB:**
   - Worker chama `consultarStatusTransferenciaIndividual(identificadorPagamento)`
   - BB retorna resposta com `estadoPagamento` (ex: `"PAGO"`, `"BLOQUEADO"`, `"PENDENTE"`)

2. **Sincronização do Item (`sincronizarItemPixComResposta`):**
   - Normaliza estado: `"BLOQUEADO"` → `"BLOQUEADO"` (preservado)
   - Classifica categoria: `"BLOQUEADO"` → `BLOQUEADO`, `"PAGO"` → `SUCESSO`, etc.
   - **Atualiza `estadoPagamentoIndividual`**: Preserva exatamente como retornado pelo BB
     - Exemplo: `estadoPagamentoIndividual = "BLOQUEADO"` (preservado do BB)
   
3. **Atualização do Status Interno:**
   - **Se categoria = `SUCESSO`** (`"PAGO"`):
     - ✅ `status = PROCESSADO` (se não estava pago)
       - **Por que "se não estava pago"?** Esta é uma **proteção contra atualizações redundantes**:
         - Se o item **já estava** `status = PROCESSADO` (pago), não precisa atualizar novamente
         - Isso evita processamento desnecessário e garante idempotência (pode receber múltiplas notificações de "PAGO" sem problemas)
         - **Exemplo**: Se o webhook ou job já marcou o item como pago, e depois recebe outra notificação de "PAGO", o sistema não faz nada (já está pago)
     - ✅ `processadoComSucesso = true`
     - ✅ Atualiza `FuncionarioPagamento.statusPagamento = PAGO`
     - ✅ Atualiza `FuncionarioPagamento.pagamentoEfetuado = true`
     - ✅ Atualiza colheitas vinculadas (se aplicável)
   
   - **Se categoria = `BLOQUEADO`** (`"BLOQUEADO"`):
     - ✅ `estadoPagamentoIndividual = "BLOQUEADO"` (preservado do BB)
     - ✅ `status = REJEITADO` (status interno - item não pode ser processado)
     - ✅ Reverte `FuncionarioPagamento.statusPagamento = REJEITADO` (se não estava pago)
     - ✅ Reverte colheitas para `PENDENTE` (se não estavam pagas)
     - ⚠️ **PROTEÇÃO**: Se item já estava `PROCESSADO` (pago), preserva status
   
   - **Se categoria = `REJEITADO` ou `CANCELADO`**:
     - ✅ `estadoPagamentoIndividual = "REJEITADO"` ou `"CANCELADO"` (preservado do BB)
     - ✅ `status = REJEITADO` (status interno)
     - ✅ Reverte funcionário e colheitas (se não estavam pagos)

4. **Verificação do Lote:**
   - **Se item está `BLOQUEADO` e não estava pago:**
     - Chama `verificarEAtualizarLoteComItensBloqueados(loteId)`
     - Verifica se **todos os itens têm estados definitivos**
     - Verifica se **ao menos um item é rejeitado/bloqueado**
     - **Se ambas condições verdadeiras:**
       - ✅ `lote.estadoRequisicaoAtual = 7` (forçado pelo sistema)
       - ✅ `lote.status = REJEITADO`
       - ✅ Marca todos os itens pendentes como `REJEITADO` (preserva itens pagos)
       - ✅ Marca todos os jobs de ITEM do lote como `DONE`
   
   - **Se item está `REJEITADO` ou `CANCELADO` e não estava pago:**
     - Chama `verificarEAtualizarLoteAposItemRejeitado(loteId)`
     - Mesma lógica: só marca lote como rejeitado quando todos os itens têm estados definitivos

5. **Decisão de Reagendamento:**
   - **Se categoria = `PENDENTE` ou `DESCONHECIDO`:**
     - ✅ Reagenda job: `runAfter = now + 15 minutos`
     - ✅ `status = PENDING` (continua monitorando)
   
   - **Se categoria = `SUCESSO`, `CANCELADO`, `REJEITADO`, `BLOQUEADO`:**
     - ✅ Marca job como `DONE` (estado final alcançado)
     - ✅ `status = DONE` (não reagenda mais)

**Estado Final do Item após Job:**
- `estadoPagamentoIndividual = "BLOQUEADO"` (preservado do BB)
- `status = REJEITADO` (status interno)
- Job: `status = DONE` (se estado final) ou `PENDING` (se ainda pendente)

#### 2.2. Processamento de Job de LOTE

**O que acontece:**

1. **Consulta de Lote Completo no BB:**
   - Worker chama `consultarSolicitacaoTransferenciaPixOnline(numeroRequisicao)`
   - BB retorna resposta com:
     - `estadoRequisicao` (1-10)
     - `listaTransferencias` (mas **não retorna `estadoPagamento` individual**)

2. **Atualização dos Itens com Dados do Lote:**
   - Atualiza `indicadorMovimentoAceitoAtual` de cada item
   - **Verifica se algum item já tem `estadoPagamentoIndividual = "BLOQUEADO"`** (de consulta individual anterior)
   - ⚠️ **IMPORTANTE**: Se um item já tem `estadoPagamentoIndividual = "BLOQUEADO"`, isso significa que ele **já foi consultado individualmente antes** e **já deve estar com `status = REJEITADO`** (marcado na consulta individual)
   - Se encontrar item bloqueado:
     - ✅ Preserva `estadoPagamentoIndividual = "BLOQUEADO"` (não sobrescreve - a consulta de lote não retorna estado individual)
     - ✅ **Garante** que o item continue com `status = REJEITADO` (não marca pela primeira vez, apenas garante que não seja sobrescrito)
       - **Por que garantir?** A consulta de lote retorna `indicadorMovimentoAceito = "S"` que normalmente mapearia para `ACEITO`, mas se o item já está bloqueado, ele deve permanecer `REJEITADO`
       - **Proteção adicional**: Se o item já está `PROCESSADO` (pago), preserva esse status mesmo que tenha `estadoPagamentoIndividual = "BLOQUEADO"`
         - ⚠️ **Nota**: Esta é uma **proteção defensiva rara**. Na prática, um item pago não deveria estar bloqueado, mas pode acontecer em casos de:
           - Inconsistência temporária do BB (item foi pago, mas consulta retorna bloqueado)
           - Race condition entre consulta individual e webhook
           - Dados desatualizados no BB
         - **Comportamento**: O sistema prioriza o status `PROCESSADO` (pago) sobre o estado bloqueado para evitar reverter pagamentos já efetivados

3. **Verificação de Itens Bloqueados:**
   - Chama `verificarEAtualizarLoteComItensBloqueados(loteId)`
   - **Se há itens bloqueados E todos os itens têm estados definitivos:**
     - ✅ `lote.estadoRequisicaoAtual = 7` (forçado pelo sistema)
     - ✅ `lote.status = REJEITADO`
     - ⚠️ **IMPORTANTE**: Mesmo que BB retorne `estadoRequisicao = 5` (PROCESSANDO), o sistema força `7` (REJEITADO) se houver itens bloqueados

4. **Atualização do Lote:**
   - **Se não há itens bloqueados:**
     - ✅ `lote.estadoRequisicaoAtual = estadoRequisicao retornado pelo BB`
     - ✅ `lote.status = mapearStatusLote(estadoRequisicao)`
   - **Se há itens bloqueados:**
     - ✅ `lote.estadoRequisicaoAtual = 7` (forçado)
     - ✅ `lote.status = REJEITADO`

5. **Verificação de Conclusão:**
   - Se todos os itens estão `PROCESSADO`:
     - ✅ `lote.estadoRequisicaoAtual = 6` (Processada)
     - ✅ `lote.status = CONCLUIDO`
     - ✅ `lote.processadoComSucesso = true`

6. **Decisão de Reagendamento:**
   - **Se `estadoRequisicao` é final (6 ou 7):**
     - ✅ Marca job como `DONE`
     - ✅ `status = DONE` (não reagenda mais)
   
   - **Se `estadoRequisicao` é pendente (1, 2, 4, 5, 8, 9, 10):**
     - ✅ Reagenda job: `runAfter = now + 15 minutos`
     - ✅ `status = PENDING` (continua monitorando)

**Estado Final do Lote após Job:**
- `estadoRequisicaoAtual = 7` (se há itens bloqueados) ou estado retornado pelo BB
- `status = REJEITADO` (se há itens bloqueados) ou mapeado do estado do BB
- Job: `status = DONE` (se estado final) ou `PENDING` (se ainda pendente)

---

### FASE 3: Processamento via Webhook

**Quando ocorre:**
- BB envia webhook quando há mudanças de estado
- Endpoint: `POST /api/webhooks/bb/pagamentos`
- Autenticação: mTLS (mutual TLS)

**O que acontece:**

1. **Recebimento do Webhook:**
   - BB envia array de eventos, cada um representando um item
   - Cada evento contém:
     - `numeroRequisicaoPagamento` (lote)
     - `codigoIdentificadorPagamento` (item)
     - `codigoTextoEstado` (1=Pago, 2=Não pago, outros)
     - `textoEstado` (`"Pago"`, `"Bloqueado"`, `"Rejeitado"`, etc.)

2. **Normalização do Estado:**
   - Converte `textoEstado` para formato do sistema
   - Exemplo: `"Bloqueado"` → `"BLOQUEADO"`

3. **Busca do Item:**
   - Busca `pagamento_api_item` pelo `codigoIdentificadorPagamento`
   - Busca `pagamento_api_lote` pelo `numeroRequisicaoPagamento`

4. **Sincronização (mesma lógica dos jobs):**
   - Chama `sincronizarItemPixComResposta(item, respostaData)`
   - **Mesma lógica da Fase 2.1** (processamento de job de item)
   - ✅ `estadoPagamentoIndividual = "BLOQUEADO"` (preservado)
   - ✅ `status = REJEITADO` (status interno)
   - ✅ Verifica lote e atualiza se necessário

5. **Preservação de Itens Pagos:**
   - ⚠️ **PROTEÇÃO**: Se item já está `PROCESSADO` (pago), preserva status
   - Não reverte funcionário nem colheitas já pagos

**Estado Final após Webhook:**
- Mesmo comportamento dos jobs (consistência garantida)

---

## 🔑 Pontos Críticos da Lógica

### 1. Preservação de Estados do BB vs Status Interno

**ITENS:**
- ✅ `estadoPagamentoIndividual` sempre preserva o estado exato retornado pelo BB
- ✅ `status` é mapeado pelo sistema para uso interno
- ✅ Quando BB retorna `"BLOQUEADO"`:
  - `estadoPagamentoIndividual = "BLOQUEADO"` (preservado)
  - `status = REJEITADO` (mapeado pelo sistema)

**LOTES:**
- ✅ `estadoRequisicaoAtual` pode ser sobrescrito pelo sistema quando há itens bloqueados
- ✅ `status` é mapeado pelo sistema baseado no `estadoRequisicaoAtual`
- ✅ Quando há itens bloqueados:
  - `estadoRequisicaoAtual = 7` (forçado pelo sistema)
  - `status = REJEITADO` (mapeado)

### 2. Proteção contra Pagamentos Duplicados

**Regra Fundamental:**
- ✅ Itens já pagos (`status = PROCESSADO`) **NUNCA** são revertidos
- ✅ Mesmo que BB retorne `"BLOQUEADO"` ou `"REJEITADO"` para um item já pago, o status é preservado
- ✅ Funcionários e colheitas já pagos não são revertidos

**Implementação:**
```typescript
const itemJaPago = item.status === StatusPagamentoItem.PROCESSADO;

if (categoriaEstado === 'BLOQUEADO') {
  if (!itemJaPago && item.status !== StatusPagamentoItem.REJEITADO) {
    dadosAtualizacao.status = StatusPagamentoItem.REJEITADO;
  }
  // Se itemJaPago = true, não atualiza status (preserva PROCESSADO)
}
```

### 3. Regra para Marcar Lote como Rejeitado

**Condições Necessárias:**
1. ✅ **Todos os itens têm estados definitivos** (não pendentes)
   - Item tem `estadoPagamentoIndividual` consultado OU
   - Item já está `PROCESSADO` ou `REJEITADO`

2. ✅ **Ao menos um item é rejeitado/bloqueado**
   - Item tem `status = REJEITADO` OU
   - Item tem `estadoPagamentoIndividual = "BLOQUEADO"` ou `"REJEITADO"`

**Implementação:**
```typescript
private podeMarcarLoteComoRejeitado(itens): boolean {
  // 1. Verificar se todos têm estados definitivos
  const todosDefinitivos = itens.every(item => this.isItemEstadoDefinitivo(item));
  if (!todosDefinitivos) return false;
  
  // 2. Verificar se ao menos um é rejeitado/bloqueado
  const temRejeitadoOuBloqueado = itens.some(item => {
    if (item.status === StatusPagamentoItem.REJEITADO) return true;
    if (item.estadoPagamentoIndividual) {
      const classificacao = this.classificarEstadoPagamentoPix(item.estadoPagamentoIndividual);
      return classificacao === 'REJEITADO' || classificacao === 'BLOQUEADO';
    }
    return false;
  });
  
  return temRejeitadoOuBloqueado;
}
```

### 4. Atualização Individual vs Em Massa

**Atualização Individual (Jobs de ITEM):**
- ✅ Cada item é consultado individualmente
- ✅ Cada item é atualizado individualmente
- ✅ Um item não afeta outros itens diretamente
- ✅ Lote só é atualizado quando **todos os itens têm estados definitivos**

**Atualização em Massa (Jobs de LOTE):**
- ✅ Consulta lote completo no BB
- ✅ Atualiza todos os itens com dados do lote
- ✅ Verifica itens bloqueados (de consultas individuais anteriores)
- ✅ Marca lote como rejeitado se necessário

### 5. Agendamento de Jobs

**Criação do Lote:**
- ✅ **Se lote não foi rejeitado:**
  - Job `LOTE`: Agendado para +15 minutos
  - Job `ITEM`: Agendado imediatamente (sem delay) - apenas para itens aceitos
- ✅ **Se lote foi rejeitado:**
  - **Nenhum job é criado** (lote descartado, não será processado)

**Reagendamento:**
- ✅ Job `LOTE`: Reagendado enquanto `estadoRequisicao` não é final (6 ou 7)
- ✅ Job `ITEM`: Reagendado enquanto categoria não é final (`PENDENTE` ou `DESCONHECIDO`)

**Finalização:**
- ✅ Job `LOTE`: Marcado como `DONE` quando `estadoRequisicao = 6` ou `7`
- ✅ Job `ITEM`: Marcado como `DONE` quando categoria é final (`SUCESSO`, `CANCELADO`, `REJEITADO`, `BLOQUEADO`)
- ✅ Todos os jobs de ITEM de um lote são marcados como `DONE` quando o lote é marcado como rejeitado

---

## 📋 Resumo dos Estados

### Estados de ITENS

| Estado do BB (`estadoPagamentoIndividual`) | Status Interno (`status`) | Significado |
|---------------------------------------------|----------------------------|-------------|
| `"PAGO"` | `PROCESSADO` | Pagamento efetivado |
| `"BLOQUEADO"` (via consulta individual) | `REJEITADO` | Item bloqueado após criação (não pode ser processado) |
| `"BLOQUEADO"` (na criação do lote) | `BLOQUEADO` | Item aceito mas lote rejeitado (precisa reprocessar) |
| `"REJEITADO"` | `REJEITADO` | Item rejeitado pelo BB |
| `"CANCELADO"` | `REJEITADO` | Item cancelado |
| `"PENDENTE"` | `PENDENTE` | Aguardando processamento |
| `"AGENDADO"` | `PENDENTE` | Agendado para processamento |

### Estados de LOTES

| Estado do BB (`estadoRequisicaoAtual`) | Status Interno (`status`) | Significado |
|----------------------------------------|---------------------------|-------------|
| `1` | `PENDENTE` | Dados consistentes, aguardando liberação |
| `4` | `PENDENTE` | Pendente de ação pelo Conveniado |
| `5` | `PROCESSANDO` | Processamento interno BB |
| `6` | `CONCLUIDO` | Requisição processada |
| `7` | `REJEITADO` | Requisição rejeitada (ou forçado por itens bloqueados) |
| `9` | `PROCESSANDO` | Liberada via API |

---

## 🔄 Reprocessamento de Pagamentos Rejeitados

### Quando um Lote é Rejeitado na Criação

**Cenário:** Um lote é criado e a resposta inicial do BB indica que alguns itens foram rejeitados (`indicadorMovimentoAceito = "N"`).

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
   - `estadoRequisicao = 3` (se todos os itens são rejeitados) ou `7` (se apenas alguns são rejeitados)
   - `status = REJEITADO`
   - **Não são criados jobs de sincronização** para nenhum item
   - **Não são criadas notificações** de liberação

### Reprocessamento via Botão

**Endpoint:** `PATCH /api/arh/folhas/:id/reprocessar-pagamentos-rejeitados`

**Funcionários Incluídos:**
- Funcionários com `statusPagamento = REJEITADO` (item realmente rejeitado)
- Funcionários com `statusPagamento = REPROCESSAR` (item bloqueado em lote rejeitado)

**Lógica:**
1. Busca todos os funcionários com `statusPagamento = REJEITADO` ou `REPROCESSAR`
2. Limpa vínculos antigos: `pagamentoApiItemId = null`, `statusPagamento = PENDENTE`
3. Se `meioPagamento = PIX_API`:
   - Cria novos lotes apenas para esses funcionários
   - Usa chave PIX atual do cadastro do funcionário
   - Mantém folha em `EM_PROCESSAMENTO`

**Resultado:**
- Funcionários rejeitados e bloqueados são reprocessados juntos
- Novos lotes são criados com dados atualizados
- Folha permanece em `EM_PROCESSAMENTO` até todos serem pagos

---

## ✅ Conclusão

O sistema trata **ITENS** e **LOTES** de forma diferente:

- **ITENS**: Preservam `estadoPagamentoIndividual` exato do BB, mas usam `status` interno mapeado
- **LOTES**: Podem ter `estadoRequisicaoAtual` sobrescrito pelo sistema quando há itens bloqueados

A lógica garante:
1. ✅ Rastreabilidade completa (preserva estados do BB)
2. ✅ Proteção contra pagamentos duplicados (preserva itens pagos)
3. ✅ Atualização individual de itens (sem afetar outros)
4. ✅ Marcação correta de lotes (só quando todos os itens têm estados definitivos)
5. ✅ Consistência entre jobs e webhooks (mesma lógica)
6. ✅ Tratamento correto de itens rejeitados na criação (marca lote como rejeitado imediatamente)
7. ✅ Status diferenciado para funcionários (REJEITADO vs REPROCESSAR) permite reprocessamento seletivo

