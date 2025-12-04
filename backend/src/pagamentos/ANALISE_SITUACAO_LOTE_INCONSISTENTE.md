# Análise: Situação de Lote com Itens Inconsistentes na Criação

## 📋 Situação Analisada

**Cenário:** Lote criado com 3 itens:
- 2 itens: `indicadorMovimentoAceito = "S"` (CONSISTENTE)
- 1 item: `indicadorMovimentoAceito = "N"` (INCONSISTENTE)

**Resposta inicial do BB:**
- `estadoRequisicao = 2` (Dados com inconsistência parcial)
- 2 transferências válidas (de 3)

**Status dos itens após consultas individuais:**
- Item 1: `estadoPagamento = "CONSISTENTE"` → Item marcado como aceito
- Item 2: `estadoPagamento = "CONSISTENTE"` → Item marcado como aceito
- Item 3: `estadoPagamento = "INCONSISTENTE"` → Item marcado como `REJEITADO`

---

## 🔍 Análise do Comportamento Atual

### 1. **Status do Lote na Criação**

**O que acontece:**
1. Lote é criado no banco com `status = PENDENTE`
2. BB retorna `estadoRequisicao = 2` (Inconsistência parcial)
3. Lote é atualizado com:
   - `estadoRequisicao = 2`
   - `estadoRequisicaoAtual = 2` (ainda não existe na criação inicial)
   - `status = PROCESSANDO` (mapeado do estado 2)

**Mapeamento de Estados (linha 800 da documentação):**
- Estado 2 → Status `PROCESSANDO`
- Estado 2 = "Requisição com ao menos um dos lançamentos com dados inconsistentes"

**Problema identificado:**
- O lote **NÃO é marcado como rejeitado** na criação
- Permanece com estado 2 (`PROCESSANDO`), permitindo tecnicamente a liberação

---

### 2. **Status dos Itens na Criação**

**O que acontece (linhas 1842-1862 do código):**

Quando um item retorna `indicadorMovimentoAceito = "N"`:
1. `mapearStatusItem()` retorna `StatusPagamentoItem.REJEITADO` (linha 801-807)
2. Item é atualizado com `status = REJEITADO`
3. Se o item está vinculado a `FuncionarioPagamento`:
   - `statusPagamento = REJEITADO` é aplicado (linhas 2624-2678)
   - `pagamentoEfetuado = false`

**Resultado:**
- Item inconsistente é corretamente marcado como `REJEITADO`
- `FuncionarioPagamento` também é marcado como `REJEITADO`
- Isso faz com que o lançamento apareça como rejeitado no frontend

---

### 3. **Botão de Reprocessar Rejeitados**

**Condição de exibição (linha 264-266 do frontend):**
```javascript
const mostrarBotaoReprocessarRejeitados = useMemo(() => {
  return folhaUsaPixApi && resumoRejeitados.quantidadeRejeitados > 0;
}, [folhaUsaPixApi, resumoRejeitados]);
```

**Cálculo de rejeitados (linha 252):**
```javascript
const rejeitados = lancamentos.filter(l => l.statusPagamento === "REJEITADO");
```

**Por que o botão aparece:**
- Mesmo sem o lote estar marcado como rejeitado (estado 7)
- O item inconsistente já marca o `FuncionarioPagamento` como `REJEITADO`
- Isso faz `resumoRejeitados.quantidadeRejeitados > 0`
- Botão é habilitado corretamente

**✅ Comportamento correto:** O botão aparece porque há lançamentos rejeitados na folha, independente do status do lote.

---

### 4. **Botão de Liberar Folha**

**Condição de exibição (linha 786-789 do frontend):**
```javascript
const canLiberate =
  selectedFolha &&
  isAdmin &&
  selectedFolha.status === "PENDENTE_LIBERACAO";
```

**Por que o botão não aparece no caso analisado:**
- A folha só muda para `PENDENTE_LIBERACAO` quando é **finalizada** pelo usuário
- No momento da criação do lote (durante liberação da folha), a folha ainda está em `EM_PROCESSAMENTO`
- **Após a liberação**, a folha muda para `FECHADA` ou permanece em `EM_PROCESSAMENTO` até todos os pagamentos serem processados
- Se houver itens rejeitados, a folha não muda para `FECHADA` automaticamente (linha 1454 do backend)

**Proteção atual:**
- A folha **não pode ser liberada novamente** se já foi liberada (status diferente de `PENDENTE_LIBERACAO`)
- Mas se o lote tem inconsistências, ele não deveria ser criado ou deveria ser marcado como rejeitado

---

## ⚠️ Problemas Identificados

### Problema 1: Lote com Inconsistências Permanece Processável

**Situação:**
- Lote criado com `estadoRequisicao = 2` (inconsistência parcial)
- Item inconsistente é marcado como `REJEITADO`
- Mas o **lote não é marcado como rejeitado**
- Lote permanece com status `PROCESSANDO`

**Risco:**
- Tecnicamente, o lote poderia ser liberado (se o código não validar)
- Mesmo que não possa ser liberado, o lote não está claramente marcado como problemático

---

### Problema 2: Ausência de Validação na Liberação

**Situação:**
- O método `liberarPagamentos()` não valida se há itens rejeitados/inconsistentes
- Não valida se o lote tem estado 2 ou 3 (inconsistência)

**Risco:**
- Se houver algum caminho de código que permita liberar um lote inconsistente, não há bloqueio explícito

---

### Problema 3: Inconsistência com Comportamento de Itens Bloqueados

**Comportamento para itens bloqueados (documentação linha 1416-1420):**
- Quando há itens bloqueados, o sistema marca o lote como rejeitado (estado 7)
- Impede a liberação automaticamente

**Comportamento para itens inconsistentes:**
- Lote permanece com estado 2 (`PROCESSANDO`)
- Não há marcação automática como rejeitado

**Inconsistência:**
- Ambos os casos representam dados inconsistentes que impedem o processamento
- Deveriam ter tratamento similar

---

## ✅ Solução Proposta

### 1. **Marcar Lote como Rejeitado na Criação se Houver Inconsistências**

**Localização:** `pagamentos.service.ts`, método `solicitarTransferenciaPixOnline()`, após atualizar itens (linha ~1896)

**Lógica:**
```typescript
// Após atualizar todos os itens com resposta do BB
// Verificar se há itens rejeitados/inconsistentes
const itensRejeitados = respostaData.listaTransferencias.filter(
  (t, index) => {
    const item = itens[index];
    if (!item) return false;
    const indicador = t.indicadorMovimentoAceito;
    const erros = t.erros || [];
    const statusItem = this.mapearStatusItem(indicador, erros);
    return statusItem === StatusPagamentoItem.REJEITADO;
  }
);

const temItensRejeitados = itensRejeitados.length > 0;
const todosItensRejeitados = itensRejeitados.length === respostaData.listaTransferencias.length;

// Se há itens rejeitados, marcar lote como rejeitado
if (temItensRejeitados) {
  // Determinar estado final do lote:
  // - Se todos os itens são rejeitados: estado 3 (todos inconsistentes)
  // - Se apenas alguns são rejeitados: estado 7 (rejeitado para permitir reprocessamento)
  const estadoFinal = todosItensRejeitados ? 3 : 7;
  const statusFinal = StatusPagamentoLote.REJEITADO;
  
  await this.prisma.pagamentoApiLote.update({
    where: { id: loteAtualizado.id },
    data: {
      estadoRequisicaoAtual: estadoFinal,
      status: statusFinal,
      observacoes: `Lote marcado como rejeitado devido a ${itensRejeitados.length} item(ns) inconsistente(s) na criação.`,
    },
  });
  
  console.log(`🚫 [PAGAMENTOS-SERVICE] Lote ${numeroRequisicao} marcado como rejeitado: ${itensRejeitados.length} item(ns) inconsistente(s)`);
}
```

**Benefícios:**
- Lote fica claramente marcado como rejeitado desde a criação
- Impede qualquer tentativa de liberação
- Consistente com o comportamento de itens bloqueados
- Permite reprocessamento via botão "Reprocessar Rejeitados"

---

### 2. **Adicionar Validação na Liberação de Lote**

**Localização:** `pagamentos.service.ts`, método `liberarPagamentos()`

**Validação:**
```typescript
// Verificar se o lote tem itens rejeitados ou estado inconsistente
const itensRejeitados = await this.prisma.pagamentoApiItem.count({
  where: {
    loteId: lote.id,
    status: StatusPagamentoItem.REJEITADO,
  },
});

if (itensRejeitados > 0) {
  throw new BadRequestException(
    `Não é possível liberar o lote ${numeroRequisicao}: há ${itensRejeitados} item(ns) rejeitado(s) ou inconsistente(s). ` +
    `Reprocesse os pagamentos rejeitados antes de tentar liberar novamente.`
  );
}

// Verificar se o lote tem estado de inconsistência (2 ou 3)
if (lote.estadoRequisicaoAtual === 2 || lote.estadoRequisicaoAtual === 3) {
  throw new BadRequestException(
    `Não é possível liberar o lote ${numeroRequisicao}: o lote contém dados inconsistentes (estado ${lote.estadoRequisicaoAtual}). ` +
    `Reprocesse os pagamentos rejeitados antes de tentar liberar novamente.`
  );
}
```

**Benefícios:**
- Proteção explícita contra liberação de lotes inconsistentes
- Mensagem de erro clara para o usuário
- Direcionamento para reprocessamento

---

### 3. **Criar Modal para Listar Rejeitados**

**Localização:** `frontend/src/pages/ArhFolhaPagamento.js`

**Componente novo:** `ListarRejeitadosModal.js`

**Características:**
- Listar todos os lançamentos com `statusPagamento === "REJEITADO"`
- Mostrar informações: Funcionário, Valor, Motivo (se disponível)
- Botão ao lado de "Reprocessar Pagamentos Rejeitados"
- Modal informativo (read-only)

**Integração:**
```javascript
// Botão para abrir modal
<PrimaryButton
  icon={<InfoCircleOutlined />}
  onClick={() => setListarRejeitadosModalOpen(true)}
  style={{
    backgroundColor: "#1890ff",
    borderColor: "#1890ff",
  }}
>
  Ver Rejeitados ({resumoRejeitados.quantidadeRejeitados})
</PrimaryButton>
```

**Benefícios:**
- Usuário pode ver quais lançamentos foram rejeitados
- Facilita a tomada de decisão sobre reprocessamento
- Melhora a transparência do sistema

---

## 📊 Comparação: Comportamento Atual vs. Proposto

| Aspecto | Comportamento Atual | Comportamento Proposto |
|---------|---------------------|------------------------|
| **Lote com itens inconsistentes** | Estado 2 (`PROCESSANDO`) | Estado 7 (`REJEITADO`) |
| **Marcação automática** | Apenas itens são marcados | Lote também é marcado como rejeitado |
| **Liberação** | Tecnicamente possível (sem validação) | Bloqueada explicitamente |
| **Reprocessamento** | Botão aparece (correto) | Botão aparece (mantém) |
| **Visibilidade** | Dificil saber quais são rejeitados | Modal lista todos os rejeitados |
| **Consistência** | Diferente de itens bloqueados | Mesmo comportamento |

---

## 🎯 Plano de Implementação

### Fase 1: Backend - Marcação Automática de Lote Rejeitado
1. ✅ Adicionar lógica para verificar itens rejeitados após criação
2. ✅ Marcar lote como rejeitado (estado 7) se houver itens inconsistentes
3. ✅ Atualizar `estadoRequisicaoAtual` e `status`
4. ✅ Adicionar observação explicativa

### Fase 2: Backend - Validação na Liberação
1. ✅ Adicionar validação no método `liberarPagamentos()`
2. ✅ Verificar itens rejeitados
3. ✅ Verificar estados de inconsistência (2 ou 3)
4. ✅ Retornar erro claro se inválido

### Fase 3: Frontend - Modal de Rejeitados
1. ✅ Criar componente `ListarRejeitadosModal.js`
2. ✅ Adicionar botão ao lado de "Reprocessar Rejeitados"
3. ✅ Buscar e exibir lançamentos rejeitados
4. ✅ Mostrar informações relevantes (funcionário, valor, motivo)

---

## ✅ Conclusões

### Situação Atual:
- ✅ **Botão de reprocessar aparece corretamente** quando há lançamentos rejeitados
- ⚠️ **Lote não é marcado como rejeitado** quando há inconsistências na criação
- ⚠️ **Não há validação explícita** na liberação contra lotes inconsistentes
- ⚠️ **Falta visibilidade** sobre quais lançamentos foram rejeitados

### Solução Recomendada:
1. ✅ Marcar lote como rejeitado na criação se houver itens inconsistentes
2. ✅ Adicionar validação explícita na liberação
3. ✅ Criar modal para listar rejeitados
4. ✅ Alinhar comportamento com itens bloqueados

### Próximos Passos:
1. Implementar Fase 1 (Backend - Marcação automática)
2. Implementar Fase 2 (Backend - Validação)
3. Implementar Fase 3 (Frontend - Modal)
4. Testar cenário completo

---

**Data da Análise:** 2024-01-XX
**Analista:** Sistema de Análise Automatizada

