# Análise: Fechamento Automático de Folha com Itens Rejeitados

## 🔍 Problema Identificado

**Situação:** Folha com item rejeitado foi direto para status `FECHADA`, quando deveria ter ficado em `EM_PROCESSAMENTO`.

---

## 📋 Fluxo Atual de Liberação da Folha

### 1. **Método `liberarFolha()` (linha 540-562)**

```typescript
async liberarFolha(id: number, usuarioId: number) {
  // 1. Se PIX_API, processar lotes primeiro
  if (folha.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
    await this.processarPixApiSeNecessario(folha.id, usuarioId);
  }

  // 2. SEMPRE chama liberarFolhaInterna que FECHA a folha
  await this.liberarFolhaInterna(folha.id, usuarioId);
}
```

**Problema:** Sempre fecha a folha, mesmo para PIX_API com itens rejeitados.

---

### 2. **Método `processarPixApiSeNecessario()` (linha 572-691)**

- Busca lançamentos sem lote criado
- Chama `criarLotesParaLancamentos()`
- **NÃO** fecha a folha aqui (correto)

---

### 3. **Método `criarLotesParaLancamentos()` (linha 702-911)**

```typescript
// Cria lotes no BB
// Vincula itens aos lançamentos
// Atualiza status da folha para EM_PROCESSAMENTO (linha 896-906)
await this.prisma.$transaction(async (tx) => {
  await tx.folhaPagamento.update({
    where: { id: folha.id },
    data: {
      status: StatusFolhaPagamento.EM_PROCESSAMENTO,
    },
  });
  await this.recalcularFolha(tx, folha.id);
});
```

**Comportamento:** 
- ✅ Atualiza para `EM_PROCESSAMENTO` (correto)
- ⚠️ Mas depois `liberarFolhaInterna()` fecha imediatamente

**Quando um item é rejeitado na criação:**
- Item é marcado como `REJEITADO` na resposta inicial (linha 1842-1862 de `pagamentos.service.ts`)
- `FuncionarioPagamento` é atualizado para `REJEITADO` (linha 2642-2678)
- Isso acontece **ANTES** de `liberarFolhaInterna()` ser chamada

---

### 4. **Método `liberarFolhaInterna()` (linha 920-969)**

```typescript
private async liberarFolhaInterna(folhaId: number, usuarioId: number) {
  await this.prisma.$transaction(async (tx) => {
    // Processa lançamentos conforme meio de pagamento
    for (const lancamento of lancamentosPendentes) {
      if (lancamento.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
        // PIX_API: Manter ENVIADO (já foi atualizado no processamento)
        // ⚠️ MAS se o item foi rejeitado, o status já é REJEITADO!
      } else {
        // PIX Manual ou ESPÉCIE: Marcar como PAGO
      }
    }

    // Recalcular totais
    await this.recalcularFolha(tx, folhaId);

    // ⚠️ PROBLEMA: FECHA a folha SEMPRE, independente de PIX_API ter rejeitados
    await tx.folhaPagamento.update({
      where: { id: folhaId },
      data: {
        status: StatusFolhaPagamento.FECHADA,  // ❌ FECHA SEMPRE
        dataFechamento: new Date(),
        dataLiberacao: new Date(),
        usuarioLiberacaoId: usuarioId,
      },
    });
  });
}
```

**Problema crítico:**
- Fecha a folha **SEMPRE**, mesmo quando:
  - É PIX_API
  - Há itens rejeitados
  - A folha deveria ficar em `EM_PROCESSAMENTO` para aguardar reprocessamento

---

### 5. **Método `recalcularFolhaNoBanco()` (linha 1410-1470)**

```typescript
async recalcularFolhaNoBanco(folhaId: number) {
  // Recalcula totais
  
  // Verificar se deve fechar automaticamente
  if (
    folha.status === StatusFolhaPagamento.EM_PROCESSAMENTO &&
    folha.meioPagamento === MeioPagamentoFuncionario.PIX_API
  ) {
    const lancamentosRejeitados = await tx.funcionarioPagamento.count({
      where: {
        folhaId,
        statusPagamento: StatusFuncionarioPagamento.REJEITADO,
      },
    });

    // ✅ Fechar apenas se NÃO há rejeitados (linha 1454)
    if (
      totalLancamentos > 0 &&
      lancamentosPagos === totalLancamentos &&
      lancamentosRejeitados === 0  // ✅ Verifica rejeitados
    ) {
      // Fechar folha
    }
  }
}
```

**Comportamento:** 
- ✅ Verifica rejeitados antes de fechar
- ✅ Só fecha se `lancamentosRejeitados === 0`
- ⚠️ Mas nunca é executado porque a folha já foi fechada por `liberarFolhaInterna()`

---

## ❌ Problema Raiz

**`liberarFolhaInterna()` fecha a folha SEMPRE, mesmo para PIX_API com itens rejeitados.**

**Sequência do problema:**
1. `liberarFolha()` chama `processarPixApiSeNecessario()`
2. Cria lotes no BB
3. Item inconsistente é marcado como `REJEITADO`
4. `FuncionarioPagamento` é atualizado para `REJEITADO`
5. Folha é atualizada para `EM_PROCESSAMENTO`
6. **`liberarFolhaInterna()` fecha a folha imediatamente** ❌
7. `recalcularFolhaNoBanco()` nunca é chamado para verificar rejeitados

---

## ✅ Solução Proposta

### **Opção 1: Não fechar folha PIX_API em `liberarFolhaInterna()`**

**Lógica:**
- Se PIX_API: Deixar em `EM_PROCESSAMENTO` e aguardar fechamento automático
- Se PIX Manual/Espécie: Fechar imediatamente (como está)

**Vantagens:**
- Mantém consistência com fechamento automático
- Permite que `recalcularFolhaNoBanco()` verifique rejeitados
- Folha só fecha quando todos os pagamentos estiverem concluídos ou quando não houver rejeitados

**Desvantagens:**
- Requer ajuste na lógica de `liberarFolhaInterna()`

---

### **Opção 2: Verificar rejeitados ANTES de fechar em `liberarFolhaInterna()`**

**Lógica:**
- Para PIX_API: Verificar se há rejeitados antes de fechar
- Se houver rejeitados: Manter em `EM_PROCESSAMENTO`
- Se não houver: Fechar normalmente

**Vantagens:**
- Mantém controle centralizado
- Validação explícita antes de fechar

**Desvantagens:**
- Duplica lógica de verificação (já existe em `recalcularFolhaNoBanco()`)

---

## 🎯 Recomendação: **Opção 1**

**Motivo:** 
- Mais simples e consistente
- Usa a lógica de fechamento automático já implementada
- Mantém separação de responsabilidades

---

## 📝 Mudanças Necessárias

### **1. Modificar `liberarFolhaInterna()` para não fechar PIX_API**

```typescript
private async liberarFolhaInterna(
  folhaId: number,
  usuarioId: number,
): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // Buscar folha para verificar meio de pagamento
    const folha = await tx.folhaPagamento.findUnique({
      where: { id: folhaId },
      select: { meioPagamento: true, status: true },
    });

    if (!folha) {
      throw new NotFoundException('Folha não encontrada.');
    }

    // Buscar todos os lançamentos não pagos
    const lancamentosPendentes = await tx.funcionarioPagamento.findMany({
      where: {
        folhaId,
        pagamentoEfetuado: false,
      },
    });

    // Processar cada lançamento conforme o meio de pagamento
    for (const lancamento of lancamentosPendentes) {
      if (lancamento.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
        // PIX_API: Manter status atual (ENVIADO ou REJEITADO)
        // Não alterar, já foi atualizado durante criação dos lotes
        continue;
      } else {
        // PIX Manual ou ESPÉCIE: Marcar como PAGO imediatamente
        await tx.funcionarioPagamento.update({
          where: { id: lancamento.id },
          data: {
            statusPagamento: StatusFuncionarioPagamento.PAGO,
            pagamentoEfetuado: true,
          },
        });
      }
    }

    // Recalcular totais da folha
    await this.recalcularFolha(tx, folhaId);

    // ✅ Fechar folha apenas se NÃO for PIX_API
    // Para PIX_API, deixar em EM_PROCESSAMENTO para fechamento automático
    if (folha.meioPagamento !== MeioPagamentoFuncionario.PIX_API) {
      await tx.folhaPagamento.update({
        where: { id: folhaId },
        data: {
          status: StatusFolhaPagamento.FECHADA,
          dataFechamento: new Date(),
          dataLiberacao: new Date(),
          usuarioLiberacaoId: usuarioId,
        },
      });
    } else {
      // ✅ Para PIX_API, apenas registrar data de liberação
      // O status já está EM_PROCESSAMENTO (definido em criarLotesParaLancamentos)
      await tx.folhaPagamento.update({
        where: { id: folhaId },
        data: {
          dataLiberacao: new Date(),
          usuarioLiberacaoId: usuarioId,
        },
      });
    }
  });
}
```

---

### **2. Garantir que `recalcularFolhaNoBanco()` seja chamado após criação dos lotes**

**Onde chamar:**
- Após criar todos os lotes em `criarLotesParaLancamentos()`
- Quando itens são atualizados (já acontece via jobs/webhooks)

**Verificação adicional em `recalcularFolhaNoBanco()`:**

```typescript
// Se há rejeitados, NÃO fechar (já existe, linha 1454)
if (lancamentosRejeitados > 0) {
  console.log(
    `⚠️ [FOLHA-PAGAMENTO] Folha ${folhaId} tem ${lancamentosRejeitados} lançamento(s) rejeitado(s). Mantendo em EM_PROCESSAMENTO para reprocessamento.`,
  );
  return; // Não fechar
}
```

---

## 📊 Comparação: Comportamento Atual vs. Proposto

| Situação | Comportamento Atual | Comportamento Proposto |
|----------|---------------------|------------------------|
| **PIX_API com todos pagos** | Fecha imediatamente | Fecha automaticamente via `recalcularFolhaNoBanco()` |
| **PIX_API com rejeitados** | ❌ Fecha imediatamente (ERRADO) | ✅ Permanece em `EM_PROCESSAMENTO` |
| **PIX Manual/Espécie** | Fecha imediatamente | Fecha imediatamente (mantém) |
| **Fechamento automático** | Nunca acontece (já fechou) | ✅ Acontece quando todos pagos e sem rejeitados |

---

## ✅ Conclusão

**Problema:**
- Folha PIX_API com rejeitados é fechada imediatamente
- Deveria permanecer em `EM_PROCESSAMENTO` para permitir reprocessamento

**Solução:**
- **NÃO fechar folha PIX_API em `liberarFolhaInterna()`**
- Deixar fechamento automático via `recalcularFolhaNoBanco()` que já verifica rejeitados
- Manter fechamento imediato apenas para PIX Manual/Espécie

**Benefícios:**
- ✅ Folha com rejeitados permanece em `EM_PROCESSAMENTO`
- ✅ Permite reprocessamento via botão "Reprocessar Rejeitados"
- ✅ Fechamento automático quando todos pagos e sem rejeitados
- ✅ Mantém consistência com lógica de fechamento automático

---

**Data da Análise:** 2024-01-XX
**Status:** Aguardando implementação

