# 📋 Plano de Implementação: Sistema de Controle de Pagamentos API BB

## 🎯 Objetivo

Implementar sistema completo de controle e rastreabilidade de pagamentos via API do Banco do Brasil, incluindo PIX, Boletos e Guias, com persistência no banco de dados, consultas individuais e preparação para webhook.

---

## 📈 Resumo Executivo

### ✅ Status Geral: 95% Concluído

**Fases Concluídas:**
- ✅ **Fase 1:** Modelo de Banco de Dados - **100% CONCLUÍDA**
- ✅ **Fase 2:** Funções Auxiliares - **100% CONCLUÍDA**
- ✅ **Fase 3:** Persistência no Banco de Dados - **100% CONCLUÍDA**
- ✅ **Fase 4:** Consultas Individuais - **100% CONCLUÍDA**
- ✅ **Fase 5:** Validações e Ajustes - **100% CONCLUÍDA**
- ✅ **Fase 6:** Integração com Tabelas de Origem - **100% CONCLUÍDA**

**Fases Pendentes:**
- ⚠️ **Fase 7:** Jobs e Processamento Assíncrono - **0% CONCLUÍDA** (último passo)
- ⚠️ **Fase 8:** Webhook - **0% CONCLUÍDA** (último passo)

### 🎉 Funcionalidades Implementadas

1. **Persistência Completa:**
   - ✅ Lotes e itens são salvos no banco ANTES de enviar ao BB
   - ✅ Respostas do BB são salvas como JSON completo
   - ✅ Status são mapeados e atualizados automaticamente
   - ✅ Histórico completo de todas as operações

2. **Consultas Automáticas:**
   - ✅ Consultas de lote atualizam automaticamente o banco de dados
   - ✅ Consultas individuais atualizam automaticamente o banco de dados
   - ✅ Busca automática da conta corrente se não informada
   - ✅ Compatibilidade com lotes criados antes da persistência

3. **Rastreabilidade:**
   - ✅ `numeroRequisicao` sequencial (1, 2, 3...)
   - ✅ Relacionamento com `TurmaColheitaPedidoCusto`
   - ✅ Preparado para `FornecedorPagamento` e `FuncionarioPagamento`
   - ✅ Auditoria completa com timestamps

4. **Tipos de Pagamento:**
   - ✅ PIX - Completo (320 registros máximo)
   - ✅ BOLETO - Completo (150 registros máximo)
   - ✅ GUIA - Completo (200 registros máximo)

### 📝 Próximos Passos

1. ✅ **Frontend:** Atualizado `TurmaColheitaPagamentosModal.js` para pagamento consolidado
2. ✅ **Liberação/Cancelamento:** Implementados métodos de liberação e cancelamento de pagamentos, com endpoint mobile protegido para liberação (ADMIN)
3. ⚠️ **Jobs:** Implementar jobs para consultar status automaticamente (último passo)
4. ⚠️ **Webhook:** Implementar endpoint para receber webhooks do BB (último passo)

### 📚 Documentação

**👉 Leia a documentação completa em:** [`DOCUMENTACAO_CONSOLIDADA.md`](./DOCUMENTACAO_CONSOLIDADA.md)

A documentação consolidada inclui:
- 🗄️ Modelo de banco de dados completo com explicação detalhada de todas as tabelas
- 🔄 Lógica de funcionamento detalhada (fluxos, mapeamentos, persistência)
- 🎯 Funcionalidades implementadas (solicitação, consulta de lote, consulta individual)
- 📝 Fluxos de pagamento (pagamento consolidado, consulta de status, consulta individual)
- 🔗 Relacionamentos N:N (explicação detalhada da tabela intermediária)
- 🚀 Comandos de migration
- 🎨 Instruções para frontend (pagamento consolidado, remoção de numeroRequisicao)

---

## 📊 Status Atual

### ✅ Implementado e Concluído

#### Modelo de Banco de Dados
- ✅ Enum `TipoPagamentoApi` (PIX, BOLETO, GUIA)
- ✅ Enum `StatusPagamentoLote` (PENDENTE, ENVIADO, PROCESSANDO, CONCLUIDO, PARCIAL, REJEITADO, ERRO)
- ✅ Enum `StatusPagamentoItem` (PENDENTE, ENVIADO, ACEITO, REJEITADO, PROCESSADO, ERRO)
- ✅ Tabela `SequenciaNumeroRequisicao` (inicialização automática)
- ✅ Tabela `PagamentoApiLote` (controle de lotes)
- ✅ Tabela `PagamentoApiItem` (controle de itens)
- ✅ Relacionamentos com `TurmaColheitaPedidoCusto`, `FornecedorPagamento`, `ContaCorrente`
- ✅ Migration do Prisma aplicada

#### Funções Auxiliares
- ✅ `obterProximoNumeroRequisicao()` - Gera número sequencial (1, 2, 3...) com inicialização automática
- ✅ `mapearStatusLote()` - Mapeia estados do BB (1-10) para status interno
- ✅ `mapearStatusItem()` - Mapeia indicadores de aceite ("S"/"N") para status interno

#### Endpoints - Solicitação
- ✅ `POST /api/pagamentos/transferencias-pix` - Solicitar transferência PIX (com persistência)
- ✅ `POST /api/pagamentos/boletos` - Solicitar pagamento de boletos (com persistência)
- ✅ `POST /api/pagamentos/guias` - Solicitar pagamento de guias (com persistência)

#### Endpoints - Consulta de Lote
- ✅ `GET /api/pagamentos/transferencias-pix/:numeroRequisicao` - Consultar status de lote PIX (com persistência)
- ✅ `GET /api/pagamentos/boletos/:numeroRequisicao` - Consultar status de lote de boletos (com persistência)
- ✅ `GET /api/pagamentos/guias/:numeroRequisicao` - Consultar status de lote de guias (com persistência)

#### Endpoints - Consulta Individual
- ✅ `GET /api/pagamentos/pix/:identificadorPagamento/individual` - Consulta individual PIX (com persistência)
- ✅ `GET /api/pagamentos/boletos/:codigoIdentificadorPagamento/individual` - Consulta individual BOLETO (com persistência)
- ✅ `GET /api/pagamentos/guias/:codigoPagamento/individual` - Consulta individual GUIA (com persistência)

#### Services - Solicitação
- ✅ `solicitarTransferenciaPix()` - Persiste lote e itens, relaciona com `TurmaColheitaPedidoCusto`
- ✅ `solicitarPagamentoBoleto()` - Persiste lote e itens
- ✅ `solicitarPagamentoGuia()` - Persiste lote e itens

#### Services - Consulta de Lote
- ✅ `consultarStatusTransferenciaPix()` - Atualiza lote e itens com resposta mais recente
- ✅ `consultarStatusPagamentoBoleto()` - Atualiza lote e itens com resposta mais recente
- ✅ `consultarStatusPagamentoGuia()` - Atualiza lote e itens com resposta mais recente

#### Services - Consulta Individual
- ✅ `consultarStatusTransferenciaIndividual()` - Consulta e atualiza status individual PIX
- ✅ `consultarStatusBoletoIndividual()` - Consulta e atualiza status individual BOLETO
- ✅ `consultarStatusGuiaIndividual()` - Consulta e atualiza status individual GUIA

#### DTOs
- ✅ `SolicitarTransferenciaPixDto` - Completo (com `colheitaIds` opcional, `numeroRequisicao` opcional)
- ✅ `SolicitarPagamentoBoletoDto` - Completo (com validação de limite 150)
- ✅ `SolicitarPagamentoGuiaDto` - Completo (com validação de limite 200)
- ✅ `RespostaTransferenciaPixDto` - Completo
- ✅ `RespostaPagamentoBoletoDto` - Completo
- ✅ `RespostaPagamentoGuiaDto` - Completo

#### Validações
- ✅ Validação de limite de 320 registros para PIX no DTO
- ✅ Validação de limite de 150 registros para boletos no DTO
- ✅ Validação de limite de 200 registros para guias no DTO

#### Integração
- ✅ Integração com `TurmaColheitaPedidoCusto` - Relaciona itens com colheitas via `colheitaIds`
- ✅ Preparado para `FornecedorPagamento` - Campo e relacionamento criados
- ✅ Preparado para `FuncionarioPagamento` - Campo criado (relacionamento comentado)

#### Liberação e Cancelamento
- ✅ `liberarPagamentos()` - Liberação de requisições/remessas via `POST /liberar-pagamentos` (BB) e `POST /api/mobile/pagamentos/liberar` (mobile, apenas ADMIN)
- ✅ `cancelarPagamentos()` - Cancelamento de pagamentos via `POST /cancelar-pagamentos` (BB) e `POST /api/mobile/pagamentos/cancelar` (mobile, apenas ADMIN; uso opcional no fluxo atual)

### ⚠️ Pendente (Último Passo - Jobs e Webhook)

#### Jobs
- ⚠️ Job para consultar status de lotes pendentes automaticamente
- ⚠️ Job para consultar status de itens pendentes automaticamente

#### Webhook
- ⚠️ Endpoint para receber webhook do BB
- ⚠️ Atualizar status automaticamente quando webhook recebido
- ⚠️ Atualizar `ultimaAtualizacaoWebhook` no lote e itens

#### Testes
- ⚠️ Testes unitários
- ⚠️ Testes de integração

---

## 🗄️ Fase 1: Modelo de Banco de Dados

### 1.1. Ajustes no Schema Prisma

**Arquivo:** `backend/prisma/schema-pagamentos-api.proposta.prisma`

#### Tarefas:
1. ✅ Adicionar enum `TipoPagamentoApi` (PIX, BOLETO, GUIA) - **JÁ FEITO**
2. ✅ Adicionar campo `tipoPagamentoApi` em `PagamentoApiLote` - **JÁ FETO**
3. ✅ Adicionar campos específicos de BOLETO - **JÁ FEITO**
4. ⚠️ **ADICIONAR campos específicos de GUIA:**
   - `codigoPagamento` (String?) - Identificador único retornado pelo BB
   - `codigoBarrasGuia` (String?) - Código de barras da guia
   - `nomeBeneficiario` (String?) - Nome do beneficiário/convenente
   - `indicadorAceiteGuia` (String?) - "S" ou "N" (resposta inicial)
   - `indicadorAceiteGuiaAtual` (String?) - "S" ou "N" (status atual)
5. ⚠️ **AJUSTAR comentários e documentação:**
   - Atualizar limites (PIX: 320, BOLETO: 150, GUIA: 200)
   - Documentar endpoints de consulta individual para guias

### 1.2. Integração com Schema Principal

**Arquivo:** `backend/prisma/schema.prisma`

#### Tarefas:
1. Copiar modelos do arquivo `schema-pagamentos-api.proposta.prisma` para `schema.prisma`
2. Adicionar relacionamento em `TurmaColheitaPedidoCusto`:
   ```prisma
   itensPagamentoApi PagamentoApiItem[]
   ```
3. Adicionar relacionamento em `FornecedorPagamento`:
   ```prisma
   itensPagamentoApi PagamentoApiItem[]
   ```
4. Adicionar relacionamento em `ContaCorrente`:
   ```prisma
   lotesPagamentoApi PagamentoApiLote[]
   ```

### 1.3. Migration do Prisma

**Status:** ✅ **CONCLUÍDA**

**Comando executado:**
```bash
npx prisma migrate dev --name adicionar_controle_pagamentos_api
```

**Verificações:**
- ✅ Tabela `sequencia_numero_requisicao` criada
- ✅ Tabela `pagamento_api_lote` criada
- ✅ Tabela `pagamento_api_item` criada
- ✅ Índices criados corretamente
- ✅ Relacionamentos configurados
- ✅ Enums criados (StatusPagamentoLote, StatusPagamentoItem, TipoPagamentoApi)
- ✅ Prisma Client regenerado

### 1.4. Seed da Tabela de Sequência

**Arquivo:** `backend/src/pagamentos/seed-sequencia-numero-requisicao.ts` (opcional)

**Status:** ✅ **NÃO É MAIS NECESSÁRIO!**

A função `obterProximoNumeroRequisicao()` inicializa automaticamente na primeira chamada.

**Script mantido apenas para:**
- Inicialização manual (se desejado)
- Verificação do estado atual
- Debugging

**Para deploy no Render:** Não precisa fazer nada - funciona automaticamente!

---

## 🔧 Fase 2: Funções Auxiliares

### 2.1. Função para Gerar numeroRequisicao Sequencial

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Método:**
```typescript
private async obterProximoNumeroRequisicao(): Promise<number>
```

**Lógica:**
1. Usar transação para garantir atomicidade
2. Buscar registro da tabela `SequenciaNumeroRequisicao` (deve ter apenas 1)
3. **Se não existir, criar automaticamente** (inicialização automática)
4. Incrementar `ultimoNumero` em 1
5. Atualizar registro na tabela
6. Retornar o novo número

**Vantagens:**
- ✅ **Inicialização automática** - Não precisa de script manual
- ✅ **Funciona em qualquer ambiente** - Dev, produção (Render), etc.
- ✅ **Thread-safe** - Usa transação para evitar race conditions
- ✅ **Zero configuração** - Funciona automaticamente no deploy

**Status:** ✅ **IMPLEMENTADO**

### 2.2. Função para Mapear Status BB para Status Interno

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Métodos:**
```typescript
private mapearStatusLote(estadoRequisicao: number | null | undefined): StatusPagamentoLote
private mapearStatusItem(indicadorAceite: string | null | undefined, erros: any[] | null | undefined): StatusPagamentoItem
```

**Lógica:**
- Mapear estados da requisição (1-10) para status interno do lote
- Mapear indicadores de aceite ("S"/"N") para status do item
- Considerar erros para status REJEITADO

**Mapeamento de Estados do Lote:**
- Estados 1, 2, 5, 8, 9, 10 → `PROCESSANDO`
- Estados 3, 7 → `REJEITADO`
- Estado 4 → `PENDENTE`
- Estado 6 → `CONCLUIDO`
- Sem estado → `PENDENTE`
- Default → `ENVIADO`

**Mapeamento de Status do Item:**
- Indicador "S" → `ACEITO`
- Indicador "N" → `REJEITADO`
- Com erros → `REJEITADO`
- Sem indicador → `PENDENTE`
- Default → `ENVIADO`

**Status:** ✅ **IMPLEMENTADO**

---

## 💾 Fase 3: Persistência no Banco de Dados

### 3.1. Atualizar Método `solicitarTransferenciaPix`

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Implementação:**
1. ✅ Gera `numeroRequisicao` sequencial automaticamente (ignora valor do DTO)
2. ✅ Cria registro em `PagamentoApiLote` ANTES de enviar ao BB:
   - `tipoPagamentoApi = PIX`
   - `payloadEnviado` = payload completo (JSON)
   - `status = PENDENTE`
   - `quantidadeEnviada`, `valorTotalEnviado`
3. ✅ Cria registros em `PagamentoApiItem` ANTES de enviar ao BB:
   - Campos específicos de PIX (chavePixEnviada, tipoChavePixEnviado, etc.)
   - `payloadItemEnviado` = payload completo (JSON)
   - `turmaColheitaCustoId` = relacionamento (se `colheitaIds` fornecido)
   - `status = PENDENTE`
4. ✅ Envia requisição para BB
5. ✅ Atualiza `PagamentoApiLote` com resposta:
   - `payloadResposta` = resposta completa (JSON)
   - `estadoRequisicao` = estado retornado
   - `status` = status mapeado
   - `quantidadeValida`, `valorTotalValido`
   - `processadoComSucesso`, `dataProcessamento`
6. ✅ Atualiza `PagamentoApiItem` com resposta:
   - `identificadorPagamento`
   - `indicadorMovimentoAceito`, `indicadorMovimentoAceitoAtual`
   - `erros` (JSON)
   - `payloadItemResposta`, `payloadItemRespostaAtual`
   - `status` = status mapeado
   - `ultimaAtualizacaoStatus`
7. ✅ Trata erros e atualiza status em caso de falha

### 3.2. Atualizar Método `solicitarPagamentoBoleto`

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Implementação:**
1. ✅ Gera `numeroRequisicao` sequencial automaticamente
2. ✅ Cria registro em `PagamentoApiLote` ANTES de enviar ao BB:
   - `tipoPagamentoApi = BOLETO`
   - `payloadEnviado` = payload completo (JSON)
   - `status = PENDENTE`
   - `quantidadeEnviada`, `valorTotalEnviado`
3. ✅ Cria registros em `PagamentoApiItem` ANTES de enviar ao BB:
   - Campos específicos de BOLETO (numeroCodigoBarras, valorNominal, etc.)
   - `payloadItemEnviado` = payload completo (JSON)
   - `status = PENDENTE`
4. ✅ Envia requisição para BB
5. ✅ Atualiza `PagamentoApiLote` com resposta
6. ✅ Atualiza `PagamentoApiItem` com resposta:
   - `codigoIdentificadorPagamento`
   - `indicadorAceite`, `indicadorAceiteAtual`
   - `erros` (JSON)
   - `payloadItemResposta`, `payloadItemRespostaAtual`
   - `status` = status mapeado
7. ✅ Trata erros e atualiza status em caso de falha

### 3.3. Atualizar Método `solicitarPagamentoGuia`

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Implementação:**
1. ✅ Gera `numeroRequisicao` sequencial automaticamente
2. ✅ Cria registro em `PagamentoApiLote` ANTES de enviar ao BB:
   - `tipoPagamentoApi = GUIA`
   - `payloadEnviado` = payload completo (JSON)
   - `status = PENDENTE`
   - `quantidadeEnviada`, `valorTotalEnviado`
3. ✅ Cria registros em `PagamentoApiItem` ANTES de enviar ao BB:
   - Campos específicos de GUIA (codigoBarrasGuia)
   - `payloadItemEnviado` = payload completo (JSON)
   - `status = PENDENTE`
4. ✅ Envia requisição para BB
5. ✅ Atualiza `PagamentoApiLote` com resposta
6. ✅ Atualiza `PagamentoApiItem` com resposta:
   - `codigoPagamento`
   - `nomeBeneficiario`
   - `indicadorAceiteGuia`, `indicadorAceiteGuiaAtual`
   - `erros` (JSON)
   - `payloadItemResposta`, `payloadItemRespostaAtual`
   - `status` = status mapeado
7. ✅ Trata erros e atualiza status em caso de falha

### 3.4. Atualizar Métodos de Consulta de Lote

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Métodos atualizados:**
- ✅ `consultarStatusTransferenciaPix()` - Atualiza lote e itens com resposta mais recente
- ✅ `consultarStatusPagamentoBoleto()` - Atualiza lote e itens com resposta mais recente
- ✅ `consultarStatusPagamentoGuia()` - Atualiza lote e itens com resposta mais recente

**Implementação:**
1. ✅ Busca `PagamentoApiLote` por `numeroRequisicao` no banco de dados
2. ✅ Se não encontrado, busca em todas as contas (compatibilidade com lotes antigos)
3. ✅ Consulta status no BB
4. ✅ Atualiza `PagamentoApiLote`:
   - `payloadRespostaAtual` = resposta mais recente (JSON)
   - `estadoRequisicaoAtual` = estado mais recente
   - `quantidadeValida`, `valorTotalValido`
   - `status` = status mapeado
   - `processadoComSucesso`, `ultimaConsultaStatus`
5. ✅ Atualiza `PagamentoApiItem`:
   - `indicadorMovimentoAceitoAtual` / `indicadorAceiteAtual` / `indicadorAceiteGuiaAtual`
   - `payloadItemRespostaAtual` = resposta mais recente (JSON)
   - `erros` (se houver)
   - `status` = status mapeado
   - `ultimaAtualizacaoStatus`

---

## 🔍 Fase 4: Consultas Individuais

### 4.1. Consulta Individual PIX

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Método:**
```typescript
async consultarStatusTransferenciaIndividual(
  identificadorPagamento: string,
  contaCorrenteId?: number
): Promise<any>
```

**Implementação:**
1. ✅ Busca `PagamentoApiItem` por `identificadorPagamento` no banco de dados
2. ✅ Se encontrado, usa `contaCorrenteId` do lote; se não, busca em todas as contas
3. ✅ Faz requisição: `GET /pix/:identificadorPagamento`
4. ✅ Atualiza item no banco:
   - `estadoPagamentoIndividual` = estado do pagamento
   - `payloadConsultaIndividual` = resposta completa (JSON)
   - `ultimaConsultaIndividual` = data da consulta

**Endpoint:**
- ✅ `GET /api/pagamentos/pix/:identificadorPagamento/individual`

### 4.2. Consulta Individual BOLETO

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Método:**
```typescript
async consultarStatusBoletoIndividual(
  codigoIdentificadorPagamento: string,
  contaCorrenteId?: number
): Promise<any>
```

**Implementação:**
1. ✅ Busca `PagamentoApiItem` por `codigoIdentificadorPagamento` no banco de dados
2. ✅ Se encontrado, usa `contaCorrenteId` do lote; se não, busca em todas as contas
3. ✅ Faz requisição: `GET /boletos/:codigoIdentificadorPagamento`
4. ✅ Atualiza item no banco:
   - `estadoPagamentoIndividual` = estado do pagamento
   - `payloadConsultaIndividual` = resposta completa (JSON)
   - `listaDevolucao` = lista de devoluções (JSON)
   - `ultimaConsultaIndividual` = data da consulta

**Endpoint:**
- ✅ `GET /api/pagamentos/boletos/:codigoIdentificadorPagamento/individual`

### 4.3. Consulta Individual GUIA

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Método:**
```typescript
async consultarStatusGuiaIndividual(
  codigoPagamento: string,
  contaCorrenteId?: number
): Promise<any>
```

**Implementação:**
1. ✅ Busca `PagamentoApiItem` por `codigoPagamento` no banco de dados
2. ✅ Se encontrado, usa `contaCorrenteId` do lote; se não, busca em todas as contas
3. ✅ Faz requisição: `GET /guias-codigo-barras/:codigoPagamento`
4. ✅ Atualiza item no banco:
   - `estadoPagamentoIndividual` = estado do pagamento
   - `payloadConsultaIndividual` = resposta completa (JSON)
   - `listaDevolucao` = lista de devoluções (JSON)
   - `ultimaConsultaIndividual` = data da consulta

**Endpoint:**
- ✅ `GET /api/pagamentos/guias/:codigoPagamento/individual`

**Nota:** DTOs de resposta individual não foram criados porque as respostas são genéricas (any) e são salvas como JSON completo no banco de dados.

---

## ✅ Fase 5: Validações e Ajustes

### 5.1. Validação de Limites nos DTOs

**Arquivo:** `backend/src/pagamentos/dto/pagamentos.dto.ts`

#### Tarefas:
1. ✅ Adicionar validação de limite 150 para boletos - **JÁ FEITO**
2. ✅ Adicionar validação de limite 320 para PIX - **JÁ FEITO**
3. ✅ Adicionar validação de limite 200 para guias - **JÁ FEITO**

**Status:** ✅ Todas as validações de limite implementadas

### 5.2. Ajustes no Modelo de Banco para Guias

**Arquivo:** `backend/prisma/schema-pagamentos-api.proposta.prisma`

#### Tarefas:
1. ✅ Adicionar campos específicos de GUIA em `PagamentoApiItem` - **JÁ FEITO**
   - `codigoPagamento` - Identificador GUIA retornado pelo BB
   - `codigoBarrasGuia` - Código de barras da guia (44 dígitos)
   - `nomeBeneficiario` - Nome do beneficiário/convenente
   - `indicadorAceiteGuia` - "S" ou "N" (resposta inicial)
   - `indicadorAceiteGuiaAtual` - "S" ou "N" (status atual)
2. ✅ Adicionar índice para `codigoPagamento` - **JÁ FEITO**
3. ✅ Atualizar comentários sobre limites - **JÁ FEITO**
   - PIX: 320 registros
   - BOLETO: 150 registros
   - GUIA: 200 registros

---

## 🔗 Fase 6: Integração com Tabelas de Origem

### 6.1. Integração com TurmaColheitaPedidoCusto

**Arquivo:** `backend/src/pagamentos/pagamentos.service.ts`

**Status:** ✅ **IMPLEMENTADO**

**Implementação:**
1. ✅ DTO `SolicitarTransferenciaPixDto` aceita `colheitaIds` (opcional)
2. ✅ Ao criar `PagamentoApiItem`, relaciona com `TurmaColheitaPedidoCusto`:
   - `turmaColheitaCustoId` = ID da colheita (se `colheitaIds` fornecido)
   - Ordem dos itens corresponde à ordem de `colheitaIds`
3. ✅ Relacionamento criado no schema Prisma:
   - `TurmaColheitaPedidoCusto.itensPagamentoApi` (relação reversa)
   - `PagamentoApiItem.turmaColheitaCustoId` (chave estrangeira)
   - `onDelete: SetNull` (preserva histórico se colheita for deletada)

**Próximo Passo (quando implementar jobs):**
- Quando status do item for `PROCESSADO` ou `ACEITO`, atualizar `TurmaColheitaPedidoCusto`:
  - `pagamentoEfetuado = true`
  - `dataPagamento = data do pagamento`
  - `observacoes = observações do pagamento`

**Nota:** Atualmente, o relacionamento é criado, mas a atualização de `TurmaColheitaPedidoCusto` deve ser feita pelo método `processarPagamentosSeletivos()` no `turma-colheita.service.ts` ou por um job futuro.

### 6.2. Preparação para FornecedorPagamento

**Arquivo:** `backend/src/fornecedor/fornecedor.service.ts` (quando implementar)

**Tarefas:**
1. Similar à integração com `TurmaColheitaPedidoCusto`
2. Relacionar `fornecedorPagamentoId` com `PagamentoApiItem`
3. Atualizar status do pagamento quando confirmado

### 6.3. Preparação para FuncionarioPagamento

**Arquivo:** `backend/src/funcionario/funcionario.service.ts` (quando implementar)

**Tarefas:**
1. Similar à integração com `TurmaColheitaPedidoCusto`
2. Relacionar `funcionarioPagamentoId` com `PagamentoApiItem`
3. Atualizar status do pagamento quando confirmado

---

## 🔄 Fase 7: Jobs e Processamento Assíncrono (Opcional)

### 7.1. Job para Consultar Status de Lotes Pendentes

**Arquivo:** `backend/src/pagamentos/pagamentos-cron.service.ts` (criar novo)

**Tarefas:**
1. Criar job que roda periodicamente (ex: a cada 1 hora)
2. Buscar lotes com status `ENVIADO` ou `PROCESSANDO`
3. Consultar status no BB para cada lote
4. Atualizar status no banco de dados
5. Se status for `CONCLUIDO`, atualizar itens relacionados

### 7.2. Job para Consultar Status Individual

**Arquivo:** `backend/src/pagamentos/pagamentos-cron.service.ts`

**Tarefas:**
1. Buscar itens com status `ENVIADO` ou `ACEITO` que não foram consultados há mais de 24 horas
2. Consultar status individual no BB
3. Atualizar status no banco de dados
4. Se status for `Pago`, atualizar tabela de origem

---

## 📡 Fase 8: Webhook (Futuro)

### 8.1. Estrutura de Webhook

**Arquivo:** `backend/src/pagamentos/pagamentos-webhook.controller.ts` (criar novo)

**Tarefas:**
1. Criar endpoint para receber webhooks do BB
2. Validar autenticação do webhook
3. Processar atualização de status
4. Atualizar `PagamentoApiLote` e `PagamentoApiItem`
5. Atualizar tabelas de origem se necessário

---

## 📝 Fase 9: Documentação

### 9.1. Atualizar Documentação

**Arquivos:**
- `backend/src/pagamentos/MODELO_PAGAMENTOS_API.md`
- `backend/src/pagamentos/README.md`
- `backend/src/pagamentos/VERIFICACAO_BOLETOS.md`

**Tarefas:**
1. Adicionar seção sobre guias
2. Atualizar tabela comparativa (PIX, BOLETO, GUIA)
3. Documentar endpoints de consulta individual
4. Documentar fluxo completo de persistência
5. Documentar integração com tabelas de origem

---

## 🧪 Fase 10: Testes

### 10.1. Testes Unitários

**Arquivo:** `backend/src/pagamentos/pagamentos.service.spec.ts`

**Tarefas:**
1. Testar geração de `numeroRequisicao` sequencial
2. Testar mapeamento de status
3. Testar persistência de lotes e itens
4. Testar consultas individuais

### 10.2. Testes de Integração

**Arquivo:** `backend/src/pagamentos/pagamentos.integration.spec.ts`

**Tarefas:**
1. Testar fluxo completo de PIX
2. Testar fluxo completo de BOLETO
3. Testar fluxo completo de GUIA
4. Testar integração com `TurmaColheitaPedidoCusto`

---

## 📦 Resumo de Arquivos a Criar/Modificar

### Novos Arquivos
- `backend/prisma/migrations/XXXXXX_adicionar_controle_pagamentos_api/migration.sql`
- `backend/src/pagamentos/pagamentos-cron.service.ts` (opcional)
- `backend/src/pagamentos/pagamentos-webhook.controller.ts` (futuro)
- `backend/src/pagamentos/pagamentos.service.spec.ts` (testes)
- `backend/src/pagamentos/pagamentos.integration.spec.ts` (testes)

### Arquivos a Modificar
- `backend/prisma/schema.prisma` - Adicionar modelos de pagamentos
- `backend/src/pagamentos/pagamentos.service.ts` - Adicionar persistência e consultas individuais
- `backend/src/pagamentos/pagamentos.controller.ts` - Adicionar endpoints de consulta individual
- `backend/src/pagamentos/dto/pagamentos.dto.ts` - Adicionar DTOs de resposta individual e validações
- `backend/src/turma-colheita/turma-colheita.service.ts` - Integrar com novo modelo
- `backend/src/pagamentos/MODELO_PAGAMENTOS_API.md` - Atualizar documentação

---

## 🎯 Prioridades

### Prioridade ALTA (Implementar Primeiro)
1. ✅ Ajustar modelo de banco para guias - **CONCLUÍDO**
2. ✅ Criar migration do Prisma - **CONCLUÍDO**
3. ✅ Implementar função de gerar `numeroRequisicao` sequencial - **CONCLUÍDO** (com inicialização automática)
4. ✅ Implementar persistência de lotes e itens (PIX, BOLETO, GUIA) - **CONCLUÍDO**
5. ✅ Implementar consultas individuais (PIX, BOLETO, GUIA) - **CONCLUÍDO**
6. ✅ Integrar com `TurmaColheitaPedidoCusto` - **CONCLUÍDO** (relacionamento criado)

### Prioridade MÉDIA
7. ✅ Adicionar validações de limite nos DTOs - **CONCLUÍDO**
8. ✅ Atualizar métodos de consulta de lote para persistir - **CONCLUÍDO**
9. ⚠️ **Criar jobs para consultar status automaticamente** - **PENDENTE** (último passo)

### Prioridade BAIXA (Futuro - Último Passo)
10. ⚠️ **Implementar webhook** - **PENDENTE** (último passo)
11. ⚠️ **Integrar com `FornecedorPagamento`** - **PENDENTE** (futuro)
12. ⚠️ **Integrar com `FuncionarioPagamento`** - **PENDENTE** (futuro)
13. ⚠️ **Criar testes unitários e de integração** - **PENDENTE** (futuro)

---

## 📊 Métricas de Sucesso

- ✅ Todos os pagamentos são rastreáveis no banco de dados
- ✅ Status atualizado via consultas ou webhook
- ✅ Relacionamento com tabelas de origem funcionando
- ✅ Consultas individuais funcionando para todos os tipos
- ✅ Validações de limite funcionando
- ✅ Documentação completa e atualizada

---

## 📱 Instruções para Frontend

### Mudanças Necessárias

**Arquivo:** `SistemaWebAlencarFrutas/frontend/src/components/dashboard/TurmaColheitaPagamentosModal.js`

#### 1. Remover `numeroRequisicao` do Frontend

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

#### 2. Adicionar `colheitaIds` para Relacionamento

**IMPORTANTE:** Para relacionar os itens de pagamento com as colheitas (`TurmaColheitaPedidoCusto`), envie o array `colheitaIds` na mesma ordem das transferências.

**EXEMPLO:**
```javascript
// Preparar lista de transferências
const listaTransferencias = colheitasParaPagar.map((colheita, index) => {
  // ... montar transferência ...
});

// Preparar array de IDs na MESMA ordem
const colheitaIds = colheitasParaPagar.map(colheita => colheita.id);

// Montar payload
const payload = {
  contaCorrenteId: contaSelecionada,
  numeroContrato: numeroContrato,
  agenciaDebito: contaSelecionadaData.agencia,
  contaCorrenteDebito: contaSelecionadaData.contaCorrente,
  digitoVerificadorContaCorrente: digitoVerificador,
  tipoPagamento: 128,
  listaTransferencias: listaTransferencias,
  colheitaIds: colheitaIds, // ✅ Adicionar array de IDs
};

// Enviar requisição
const response = await axiosInstance.post('/api/pagamentos/transferencias-pix', payload);

// ✅ numeroRequisicao agora vem na resposta (gerado pelo backend)
console.log('Número da requisição:', response.data.numeroRequisicao);
```

#### 3. Remover Função `gerarNumeroRequisicao()`

**ANTES:**
```javascript
const gerarNumeroRequisicao = () => {
  const timestamp = Date.now();
  return parseInt(timestamp.toString().slice(-7), 10);
};

const numeroRequisicao = gerarNumeroRequisicao(); // ❌ Remover
```

**DEPOIS:**
```javascript
// ✅ Função removida - não é mais necessária
// O backend gera automaticamente de forma sequencial (1, 2, 3...)
```

### Benefícios

1. **Sequencialidade:** `numeroRequisicao` agora é sequencial (1, 2, 3...), não baseado em timestamp
2. **Rastreabilidade:** Itens de pagamento são automaticamente relacionados com as colheitas
3. **Simplicidade:** Frontend não precisa mais gerar `numeroRequisicao`
4. **Auditoria:** Todos os pagamentos são rastreados no banco de dados

### Documentação Completa

**Arquivo:** `INSTRUCOES_FRONTEND.md`

Consulte o arquivo `INSTRUCOES_FRONTEND.md` para instruções detalhadas sobre as mudanças necessárias no frontend.

---

## 🔄 Próximos Passos

### Backend (Concluído)
1. ✅ Modelo de Banco de Dados - **CONCLUÍDO**
2. ✅ Funções Auxiliares - **CONCLUÍDO**
3. ✅ Persistência de Lotes e Itens - **CONCLUÍDO**
4. ✅ Consultas Individuais - **CONCLUÍDO**
5. ✅ Integração com `TurmaColheitaPedidoCusto` - **CONCLUÍDO**

### Frontend (Pendente)
1. ⚠️ Remover `numeroRequisicao` do payload
2. ⚠️ Adicionar `colheitaIds` no payload
3. ⚠️ Remover função `gerarNumeroRequisicao()`
4. ⚠️ Atualizar para usar `response.data.numeroRequisicao`

### Último Passo (Jobs e Webhook)
1. ⚠️ Criar jobs para consultar status automaticamente
2. ⚠️ Implementar webhook
3. ⚠️ Atualizar `TurmaColheitaPedidoCusto` quando status for `PROCESSADO` ou `ACEITO`

---

## 📚 Documentação

### Arquivos de Documentação Mantidos

1. **`PLANO_IMPLEMENTACAO.md`** - Este arquivo (plano completo consolidado)
2. **`INSTRUCOES_FRONTEND.md`** - Instruções detalhadas para o frontend
3. **`MODELO_PAGAMENTOS_API.md`** - Documentação do modelo de banco de dados
4. **`VERIFICACAO_DOCUMENTACAO_BB.md`** - Verificação da documentação do BB
5. **`VERIFICACAO_BOLETOS.md`** - Verificação da implementação de boletos
6. **`COMANDOS_MIGRATION.md`** - Comandos de migration do Prisma

### Arquivos Removidos (Consolidados no PLANO_IMPLEMENTACAO.md)

1. ❌ `FASE1_CONCLUIDA.md` - Consolidado no PLANO_IMPLEMENTACAO.md
2. ❌ `FASE3_PERSISTENCIA_PIX.md` - Consolidado no PLANO_IMPLEMENTACAO.md
3. ❌ `RESUMO_IMPLEMENTACAO_FASE3.md` - Consolidado no PLANO_IMPLEMENTACAO.md

---

**Última atualização:** 2025-01-15
**Versão:** 2.0.0

