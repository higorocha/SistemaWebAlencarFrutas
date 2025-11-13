# 📖 Como Será Implementado: Sistema de Pagamentos aos Fornecedores

## 🎯 Visão Geral - SIMPLES E DIRETO

**O que vamos fazer:**
1. ✅ Criar uma **NOVA TABELA** no banco chamada `fornecedor_pagamentos` (tabela completamente nova)
2. ✅ A tabela `fornecedores` existente **NÃO SERÁ ALTERADA** (nenhum campo novo, nenhuma mudança)
3. ✅ Criar código no backend para gerenciar essa nova tabela
4. ✅ Tudo será organizado dentro do módulo de fornecedores existente

**Resumo:**
- Nova tabela = `fornecedor_pagamentos` (será criada do zero)
- Tabela existente = `fornecedores` (não mexe em nada, só cria uma relação no código)
- Código = dentro do módulo `fornecedores` (organização)

---

## 📁 Onde Vai Ficar Tudo

### Estrutura de Arquivos no Módulo Fornecedores:

```
src/fornecedores/
├── fornecedores.module.ts          (será atualizado)
├── fornecedores.controller.ts      (será atualizado - adicionar endpoints de pagamentos)
├── fornecedores.service.ts         (não será alterado - mantém apenas CRUD de fornecedores)
├── fornecedor-pagamentos.service.ts (NOVO - service específico para pagamentos)
├── dto/
│   ├── index.ts                    (será atualizado)
│   ├── create-fornecedor.dto.ts    (não altera)
│   ├── update-fornecedor.dto.ts    (não altera)
│   ├── fornecedor-response.dto.ts  (não altera)
│   ├── create-fornecedor-pagamento.dto.ts      (NOVO)
│   ├── update-fornecedor-pagamento.dto.ts      (NOVO)
│   ├── processar-pagamentos-fornecedor.dto.ts  (NOVO)
│   └── fornecedor-pagamento-response.dto.ts    (NOVO)
```

---

## 🔧 O Que Será Feito - Passo a Passo

### 1. **Criar NOVA TABELA no Banco de Dados**

**O que será criado:**
- ✅ **NOVA TABELA** `fornecedor_pagamentos` (tabela completamente nova, criada do zero)
- ✅ **NOVO ENUM** `StatusPagamentoFornecedor` (PENDENTE, PROCESSANDO, PAGO)

**O que NÃO será feito:**
- ❌ **NÃO** vamos alterar a tabela `fornecedores` existente
- ❌ **NÃO** vamos adicionar campos na tabela `fornecedores`
- ❌ **NÃO** vamos modificar estrutura da tabela `fornecedores`

**O que será feito no código Prisma:**
- Adicionar o modelo `FornecedorPagamento` no `schema.prisma`
- Adicionar o enum `StatusPagamentoFornecedor` no `schema.prisma`
- Adicionar uma linha no modelo `Fornecedor` existente (apenas para o Prisma saber que existe relação, mas **NÃO altera a tabela no banco**)

**Campos da NOVA tabela `fornecedor_pagamentos`:**
- `id` - ID único do pagamento
- `fornecedor_id` - ID do fornecedor (foreign key, referencia a tabela `fornecedores`)
- `area_fornecedor_id` - ID da área do fornecedor (foreign key → `areas_fornecedores`)
- `pedido_id` - ID do pedido (foreign key → `pedidos`)
- `fruta_id` - ID da fruta (foreign key → `frutas`)
- `fruta_pedido_id` - ID da relação fruta-pedido (foreign key → `frutas_pedidos`)
- `fruta_pedido_area_id` - ID da relação área (foreign key → `frutas_pedidos_areas`) - **CRUCIAL: referencia exata à colheita**
- `quantidade` - Quantidade colhida (vem de `FrutasPedidosAreas.quantidadeColhidaUnidade1` ou `Unidade2`)
- `unidade_medida` - Unidade (KG, CX, TON, etc) - vem de `FrutasPedidos.unidadeMedida1` ou `unidadeMedida2`
- `valor_unitario` - Valor unitário (informado pelo usuário)
- `valor_total` - Valor total (informado pelo usuário ou calculado: quantidade * valor_unitario)
- `data_colheita` - Data da colheita (vem de `Pedido.dataColheita` ou específica)
- `status` - Status (PENDENTE, PROCESSANDO, PAGO) - **Padrão: PAGO** (pagamento criado já pago)
- `data_pagamento` - Data do pagamento (obrigatória, informada pelo usuário)
- `forma_pagamento` - Forma de pagamento (string, 50 caracteres, obrigatória)
- `observacoes` - Observações (opcional)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

**⚠️ IMPORTANTE SOBRE STATUS:**
- **PAGO** - Status padrão ao criar pagamento (usuário cria pagamento já pago)
- **PENDENTE** - Estado de transição que **nunca será usado** neste momento, mas fica no enum para futuro
- **PROCESSANDO** - Estado para lógica futura (integração com sistema de pagamento), **não usado agora**

**Como funciona na prática:**
- Usuário seleciona colheitas do fornecedor em pedidos (já existe no frontend)
- Frontend lista apenas frutas colhidas em áreas de fornecedores (não mostra áreas próprias)
- Usuário seleciona colheitas e informa: valor unitário, valor total, forma pagamento, data pagamento
- Pagamento é criado **já com status = PAGO** (não precisa processar depois)
- **Não há cálculo proporcional automático** - usuário informa os valores diretamente

**Importante:**
- A tabela `fornecedores` continua EXATAMENTE como está
- A tabela referencia `FrutasPedidosAreas` através de `fruta_pedido_area_id` para rastreabilidade exata
- É como se fosse uma tabela de pedidos que referencia clientes - a tabela de clientes não muda, só criamos a tabela de pedidos

---

### 2. **Criar Migration do Prisma (Criar NOVA TABELA)**

**O que será feito:**
- Executar `npx prisma migrate dev` para criar a migration
- A migration vai **APENAS CRIAR**:
  - ✅ Criar o enum `StatusPagamentoFornecedor` no banco
  - ✅ Criar a **NOVA TABELA** `fornecedor_pagamentos` com todos os campos
  - ✅ Criar os índices para performance
  - ✅ Adicionar as foreign keys (apenas referencias, não altera tabelas existentes)
  - ✅ Adicionar a constraint única (evitar pagamentos duplicados)

**O que NÃO será feito:**
- ❌ **NÃO** vai alterar a tabela `fornecedores`
- ❌ **NÃO** vai adicionar campos na tabela `fornecedores`
- ❌ **NÃO** vai modificar estrutura de nenhuma tabela existente

**Resultado:**
- Nova tabela `fornecedor_pagamentos` será criada
- Tabela `fornecedores` continua exatamente como está
- Apenas uma foreign key conecta as duas tabelas (como sempre foi feito no banco)

---

### 3. **Criar os DTOs** (dentro de `src/fornecedores/dto/`)

**O que serão os DTOs:**
- `CreateFornecedorPagamentoDto`: usado para criar um novo pagamento
- `UpdateFornecedorPagamentoDto`: usado para atualizar um pagamento existente
- `ProcessarPagamentosFornecedorDto`: usado para processar múltiplos pagamentos de uma vez
- `FornecedorPagamentoResponseDto`: formato de resposta quando buscamos um pagamento

**Por que:**
- Os DTOs validam os dados que chegam do frontend
- Garantem que os tipos estejam corretos
- Documentam a API automaticamente (Swagger)
- Protegem contra dados inválidos

**Exemplo do que o DTO de criação terá:**
- IDs necessários (fornecedor, área, pedido, fruta, etc.)
- Quantidade e unidade de medida
- Valores (opcionais - serão calculados se não informados)
- Data de colheita (opcional)
- Observações (opcional)

---

### 4. **Criar o Service de Pagamentos** (`fornecedor-pagamentos.service.ts`)

**O que o service fará:**
- Gerenciar toda a lógica de pagamentos
- Validar dados antes de criar/atualizar
- Calcular valores proporcionais automaticamente
- Processar pagamentos em lote (múltiplos de uma vez)
- Buscar pagamentos com filtros
- Garantir integridade dos dados (transações)

**Métodos principais que terá:**
1. `create()` - Criar um novo pagamento **já com status = PAGO**
2. `findAll()` - Listar pagamentos (com filtros por status, pedido, fruta, etc)
3. `findOne()` - Buscar um pagamento específico
4. `update()` - Atualizar um pagamento (limitado - não permite alterar pagamentos pagos)
5. `delete()` - Deletar um pagamento (praticamente não usado - manter histórico)
6. `getPagamentosEfetuados()` - Buscar pagamentos efetuados de um fornecedor (status = PAGO)
7. `getPagamentosPendentes()` - ⚠️ Não será usado agora (nunca haverá status PENDENTE)
8. `getPagamentosProcessando()` - ⚠️ Não será usado agora (lógica futura)
9. `createMany()` - Criar múltiplos pagamentos de uma vez (opcional)

**⚠️ IMPORTANTE:**
- **NÃO há cálculo proporcional automático** - usuário informa valores diretamente
- **Status padrão = PAGO** - pagamentos são criados já pago
- **PENDENTE nunca será usado** - fica no enum para futuro
- **PROCESSANDO não será usado agora** - fica no enum para lógica futura

**Validações que fará:**
- Verificar se o fornecedor existe
- Verificar se a área pertence ao fornecedor
- Verificar se a fruta está no pedido
- Verificar se `FrutasPedidosAreas` existe e tem `areaFornecedorId` não null
- Verificar se não há pagamento duplicado (mesma `frutaPedidoAreaId` + `pedidoId` + `frutaId`)
- Validar valores (valorUnitario e valorTotal obrigatórios)
- Validar data pagamento (obrigatória, não futura)
- Validar forma pagamento (obrigatória)
- Validar quantidade e unidadeMedida (vêm de `FrutasPedidosAreas` e `FrutasPedidos`)

---

### 5. **Atualizar o Controller de Fornecedores** (`fornecedores.controller.ts`)

**O que será adicionado:**
- Novos endpoints para pagamentos, mantendo tudo no mesmo controller
- Endpoints seguirão o padrão REST

**Endpoints que serão adicionados:**

1. **POST `/api/fornecedores/:fornecedorId/pagamentos`**
   - Criar um novo pagamento para um fornecedor
   - Recebe os dados do pagamento no body (valorUnitario, valorTotal, dataPagamento, formaPagamento, etc)
   - Valida e cria o registro **já com status = PAGO**
   - Retorna pagamento criado

2. **POST `/api/fornecedores/:fornecedorId/pagamentos/criar-multiplos`** (OPCIONAL)
   - Criar múltiplos pagamentos de uma vez
   - Recebe array de CreateFornecedorPagamentoDto
   - Cria todos em transação (garante que tudo ou nada)
   - Todos são criados com status = PAGO
   - Retorna array de pagamentos criados

3. **GET `/api/fornecedores/:fornecedorId/pagamentos`**
   - Listar todos os pagamentos de um fornecedor
   - Suporta filtros (status=PAGO, pedido, fruta)
   - Ordenar por data de pagamento (mais recentes primeiro)

4. **GET `/api/fornecedores/:fornecedorId/pagamentos/:id`**
   - Buscar um pagamento específico
   - Incluir todos os relacionamentos (fornecedor, área, pedido, fruta, etc)

5. **PATCH `/api/fornecedores/:fornecedorId/pagamentos/:id`**
   - Atualizar um pagamento
   - ⚠️ Limitado - não permite alterar valores ou status de pagamentos já pagos
   - Permite atualizar apenas observações ou campos específicos

6. **DELETE `/api/fornecedores/:fornecedorId/pagamentos/:id`**
   - Deletar um pagamento
   - ⚠️ Praticamente não será usado - manter histórico
   - Por enquanto, não permitir deletar pagamentos (ou apenas se criado recentemente)

7. **GET `/api/fornecedores/:fornecedorId/pagamentos/efetuados`**
   - Buscar apenas pagamentos efetuados (status = PAGO)
   - Agrupa por data de pagamento
   - Retorna dados formatados para o modal
   - **Este é o endpoint principal** - todos os pagamentos estarão como PAGO

8. **GET `/api/fornecedores/:fornecedorId/colheitas-pagamentos`**
   - Endpoint especial para o modal do frontend
   - Retorna dados do fornecedor + colheitas disponíveis para pagamento
   - Retorna pagamentos já efetuados (se houver)
   - Formato similar ao endpoint de turmas
   - **Usado pelo modal `FornecedorColheitaPagamentosModal`**

**⚠️ Endpoints que NÃO serão usados agora:**
- `GET /pagamentos/pendentes` - Não será usado (nunca haverá status PENDENTE)
- `PATCH /pagamentos/processar` - Não será usado (pagamentos são criados já como PAGO)
- `GET /pagamentos/processando` - Não será usado agora (lógica futura)

**Por que manter no mesmo controller:**
- Mantém tudo relacionado a fornecedores em um só lugar
- Facilita manutenção
- Endpoints ficam organizados (`/api/fornecedores/:id/pagamentos/...`)

---

### 6. **Atualizar o Módulo de Fornecedores** (`fornecedores.module.ts`)

**O que será adicionado:**
- Importar o novo service `FornecedorPagamentosService`
- Adicionar nos providers
- Exportar o service (caso outro módulo precise usar)

**Como ficará:**
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [FornecedoresController],
  providers: [
    FornecedoresService,           // Service existente (CRUD de fornecedores)
    FornecedorPagamentosService    // Novo service (pagamentos)
  ],
  exports: [
    FornecedoresService,
    FornecedorPagamentosService    // Exportar para uso em outros módulos se necessário
  ],
})
```

**Por que:**
- O módulo precisa conhecer o novo service
- O controller precisa poder usar o service
- Exportar permite que outros módulos (como dashboard) usem o service

---

### 7. **Integrar com o Dashboard** (`dashboard.service.ts`)

**O que será adicionado:**
- Novos métodos para buscar pagamentos de fornecedores
- Formato similar aos pagamentos de turmas

**Métodos que serão adicionados:**

1. **`getPagamentosFornecedoresEfetuados()`**
   - Busca todos os pagamentos efetuados (status = PAGO)
   - Agrupa por fornecedor e data de pagamento
   - Calcula totais por fornecedor
   - Retorna formato similar ao `PagamentoEfetuadoDto` de turmas
   - **Este é o método principal** - todos os pagamentos estarão como PAGO

2. **`getFornecedoresColheitas()`** (JÁ EXISTE)
   - Método atual que busca colheitas de fornecedores
   - Calcula valores proporcionais (para visualização)
   - Usado pelo frontend para listar colheitas disponíveis
   - **Manter como está** - pode ser usado para visualização antes de criar pagamento

**⚠️ Método que NÃO será usado agora:**
- `getPagamentosFornecedoresPendentes()` - Não será usado (nunca haverá status PENDENTE)

**Como será usado:**
- O dashboard chama esses métodos
- Retorna dados no mesmo formato dos pagamentos de turmas
- O frontend pode usar os mesmos componentes

**Por que:**
- Mantém consistência com o sistema de turmas
- Facilita a exibição no frontend
- Centraliza a lógica de agrupamento

---

### 8. **Atualizar o DTO de Resposta do Dashboard** (`dashboard-response.dto.ts`)

**O que será adicionado:**
- Novos DTOs para pagamentos de fornecedores
- Formato similar aos DTOs de turmas

**DTOs que serão criados:**
- `PagamentoFornecedorEfetuadoDto` - Formato de pagamentos efetuados (status = PAGO)
  - ID do fornecedor
  - Nome do fornecedor
  - Total pago
  - Quantidade de pedidos
  - Quantidade de frutas
  - Data de pagamento
  - Lista de detalhes (pedidos, frutas, valores)

**⚠️ DTO que NÃO será usado agora:**
- `PagamentoFornecedorPendenteDto` - Não será usado (nunca haverá status PENDENTE)

**Por que:**
- Mantém consistência com o sistema existente
- Facilita o consumo no frontend
- Documenta a API automaticamente

---

## 🔄 Como Funcionará na Prática

### Cenário 1: Criar um Pagamento

1. **Frontend**: Usuário visualiza colheitas do fornecedor (já existe - `getFornecedoresColheitas()`)
2. **Frontend**: Usuário seleciona colheitas que deseja pagar
3. **Frontend**: Usuário preenche: valor unitário, valor total, forma pagamento, data pagamento
4. **Frontend**: Envia `POST /api/fornecedores/:id/pagamentos` com os dados
5. **Backend**: Service valida os dados (fornecedor, área, pedido, fruta, valores, etc)
6. **Backend**: Verifica se não existe pagamento duplicado
7. **Backend**: Cria registro no banco **já com status = PAGO**
8. **Backend**: Retorna pagamento criado
9. **Frontend**: Atualiza a lista de pagamentos efetuados

### Cenário 2: Criar Múltiplos Pagamentos (OPCIONAL)

1. **Frontend**: Usuário seleciona múltiplas colheitas
2. **Frontend**: Preenche valores, forma de pagamento e data para cada uma
3. **Frontend**: Envia `POST /api/fornecedores/:id/pagamentos/criar-multiplos` (array de DTOs)
4. **Backend**: Service valida todos os dados
5. **Backend**: Cria todos em transação (garante que tudo ou nada)
6. **Backend**: Todos são criados com status = PAGO
7. **Backend**: Retorna array de pagamentos criados
8. **Frontend**: Atualiza a lista

**Nota:** Alternativamente, frontend pode fazer múltiplas chamadas ao endpoint de criar (uma por colheita).

### Cenário 3: Visualizar Pagamentos no Dashboard

1. **Frontend**: Carrega o dashboard
2. **Frontend**: Chama `GET /api/dashboard`
3. **Backend**: DashboardService busca pagamentos pendentes de fornecedores
4. **Backend**: Agrupa por fornecedor
5. **Backend**: Retorna lista formatada
6. **Frontend**: Exibe lista na seção de pagamentos
7. **Frontend**: Usuário clica em um fornecedor
8. **Frontend**: Chama `GET /api/fornecedores/:id/colheitas-pagamentos`
9. **Backend**: Retorna detalhes completos
10. **Frontend**: Abre modal com detalhes

---

## 🎨 Estrutura Final do Módulo

### Organização dos Arquivos:

```
src/fornecedores/
│
├── fornecedores.module.ts              (atualizado - adiciona FornecedorPagamentosService)
│
├── fornecedores.controller.ts          (atualizado - adiciona endpoints de pagamentos)
│   ├── Endpoints existentes (CRUD de fornecedores)
│   └── Novos endpoints:
│       ├── POST   /:id/pagamentos
│       ├── GET    /:id/pagamentos
│       ├── GET    /:id/pagamentos/:pagamentoId
│       ├── PATCH  /:id/pagamentos/:pagamentoId
│       ├── DELETE /:id/pagamentos/:pagamentoId
│       ├── PATCH  /:id/pagamentos/processar
│       ├── GET    /:id/pagamentos/pendentes
│       ├── GET    /:id/pagamentos/efetuados
│       └── GET    /:id/colheitas-pagamentos
│
├── fornecedores.service.ts             (não altera - mantém apenas CRUD)
│
├── fornecedor-pagamentos.service.ts    (NOVO - toda lógica de pagamentos)
│   ├── create()
│   ├── findAll()
│   ├── findOne()
│   ├── update()
│   ├── delete()
│   ├── processarPagamentosSeletivos()
│   ├── getPagamentosPendentes()
│   ├── getPagamentosEfetuados()
│   ├── getPagamentosProcessando()
│   └── calcularValorProporcional()
│
└── dto/
    ├── index.ts                        (atualizado - exporta novos DTOs)
    │
    ├── create-fornecedor.dto.ts        (não altera)
    ├── update-fornecedor.dto.ts        (não altera)
    ├── fornecedor-response.dto.ts      (não altera)
    │
    ├── create-fornecedor-pagamento.dto.ts      (NOVO)
    ├── update-fornecedor-pagamento.dto.ts      (NOVO)
    ├── processar-pagamentos-fornecedor.dto.ts  (NOVO)
    └── fornecedor-pagamento-response.dto.ts    (NOVO)
```

---

## 🔗 Como Será Integrado com o Dashboard

### No `dashboard.service.ts`:

**Será adicionado:**
- Import do `FornecedorPagamentosService`
- Novos métodos para buscar pagamentos

**Como funcionará:**
- O dashboard service injeta o `FornecedorPagamentosService`
- Usa os métodos do service para buscar dados
- Formata os dados no mesmo padrão dos pagamentos de turmas
- Retorna para o frontend

**Métodos que serão adicionados:**
```typescript
// Buscar pagamentos pendentes agrupados por fornecedor
async getPagamentosFornecedoresPendentes() {
  // Usa o FornecedorPagamentosService
  // Agrupa por fornecedor
  // Calcula totais
  // Retorna formato padronizado
}

// Buscar pagamentos efetuados agrupados por fornecedor
async getPagamentosFornecedoresEfetuados() {
  // Usa o FornecedorPagamentosService
  // Agrupa por fornecedor e data
  // Retorna formato padronizado
}
```

**No `dashboard-response.dto.ts`:**
- Adicionar `pagamentosFornecedoresPendentes: PagamentoFornecedorPendenteDto[]`
- Adicionar `pagamentosFornecedoresEfetuados: PagamentoFornecedorEfetuadoDto[]`

---

## 📊 Como Será o Modelo no Banco de Dados

### ⚠️ IMPORTANTE: Nova Tabela vs Tabela Existente

**Tabela EXISTENTE (`fornecedores`):**
- ✅ **NÃO SERÁ ALTERADA**
- ✅ Continua com os mesmos campos (id, nome, cnpj, cpf, telefone, email, endereco, observacoes, created_at, updated_at)
- ✅ Nenhum campo novo será adicionado
- ✅ Nenhuma estrutura será modificada
- ✅ Apenas o Prisma vai "saber" que existe uma relação (mas isso é só no código, não altera o banco)

**Nova TABELA (`fornecedor_pagamentos`):**
- ✅ **SERÁ CRIADA DO ZERO**
- ✅ Tabela completamente nova e independente
- ✅ Apenas referencia a tabela `fornecedores` através de foreign key
- ✅ É como criar uma tabela de pedidos que referencia clientes - a tabela de clientes não muda

### Estrutura da NOVA Tabela `fornecedor_pagamentos`:

**Colunas:**
- `id` - ID único do pagamento (primary key, auto incremento)
- `fornecedor_id` - ID do fornecedor (foreign key → tabela `fornecedores`, obrigatório)
- `area_fornecedor_id` - ID da área do fornecedor (foreign key → tabela `areas_fornecedores`, obrigatório)
- `pedido_id` - ID do pedido (foreign key → tabela `pedidos`, obrigatório)
- `fruta_id` - ID da fruta (foreign key → tabela `frutas`, obrigatório)
- `fruta_pedido_id` - ID da relação fruta-pedido (foreign key → tabela `frutas_pedidos`, obrigatório)
- `fruta_pedido_area_id` - ID da relação área (foreign key → tabela `frutas_pedidos_areas`, obrigatório) - **Referencia exata à colheita**
- `quantidade` - Quantidade colhida (float, obrigatório) - vem de `FrutasPedidosAreas`
- `unidade_medida` - Unidade (enum: KG, CX, TON, etc, obrigatório) - vem de `FrutasPedidos`
- `valor_unitario` - Valor unitário (float, obrigatório) - **informado pelo usuário**
- `valor_total` - Valor total (float, obrigatório) - **informado pelo usuário** (ou calculado: quantidade * valor_unitario)
- `data_colheita` - Data da colheita (datetime, opcional) - vem de `Pedido.dataColheita`
- `status` - Status (enum: PENDENTE, PROCESSANDO, PAGO) - **Padrão: PAGO** (pagamento criado já pago)
- `data_pagamento` - Data do pagamento (datetime, obrigatório) - **informada pelo usuário**
- `forma_pagamento` - Forma de pagamento (string, 50 caracteres, obrigatório) - **informada pelo usuário**
- `observacoes` - Observações (text, opcional)
- `created_at` - Data de criação (datetime, automático)
- `updated_at` - Data de atualização (datetime, automático)

**⚠️ STATUS EXPLICADO:**
- **PAGO** - Status padrão (`@default(PAGO)`). Pagamento é criado já pago. Usuário informa valor, forma pagamento e data pagamento ao criar.
- **PENDENTE** - Estado de transição que **NUNCA será usado** neste momento. Fica no enum para uso futuro (se necessário).
- **PROCESSANDO** - Estado para lógica futura (integração com sistema de pagamento automático). **Não será usado agora**.

**Como funciona o fluxo:**
1. Usuário visualiza colheitas do fornecedor em pedidos (frontend já faz isso)
2. Frontend lista apenas frutas colhidas em áreas de fornecedores (filtra `FrutasPedidosAreas` onde `areaFornecedorId` não é null)
3. Usuário seleciona colheitas que deseja pagar
4. Usuário informa: valor unitário, valor total, forma pagamento, data pagamento
5. Backend cria pagamento **já com status = PAGO**
6. Pagamento fica registrado como pago desde a criação

**Índices (para performance):**
- Índice em `fornecedor_id`
- Índice em `pedido_id`
- Índice em `fruta_id`
- Índice em `status`
- Índice em `data_pagamento`
- Índice composto em `fornecedor_id + status`
- Índice composto em `pedido_id + fruta_id`

**Constraints (regras):**
- Foreign key em `fornecedor_id` → tabela `fornecedores` (cascade delete)
- Foreign key em `area_fornecedor_id` → tabela `areas_fornecedores` (cascade delete)
- Foreign key em `pedido_id` → tabela `pedidos` (cascade delete)
- Foreign key em `fruta_id` → tabela `frutas`
- Foreign key em `fruta_pedido_id` → tabela `frutas_pedidos` (cascade delete)
- Foreign key em `fruta_pedido_area_id` → tabela `frutas_pedidos_areas` (cascade delete)
- Unique constraint: não permite pagamento duplicado (`fruta_pedido_area_id + pedido_id + fruta_id`)

**Resumo:**
- Nova tabela = criada do zero
- Tabela `fornecedores` = não mexe em nada
- Foreign keys = apenas referencias (como sempre foi feito)
- Tudo separado e organizado

---

## ✅ Validações que Serão Implementadas

### Ao Criar:
- Fornecedor existe
- Área existe e pertence ao fornecedor
- Pedido existe
- Fruta existe e está no pedido
- `FrutasPedidosAreas` existe e tem `areaFornecedorId` não null
- Área está relacionada à fruta do pedido (verificar `frutaPedidoAreaId`)
- Não existe pagamento duplicado (mesma `frutaPedidoAreaId` + `pedidoId` + `frutaId`)
- Valores informados (valorUnitario e valorTotal obrigatórios)
- Data pagamento informada (obrigatória, não futura)
- Forma pagamento informada (obrigatória)
- Quantidade e unidadeMedida válidas (vêm de `FrutasPedidosAreas` e `FrutasPedidos`)

### Ao Atualizar:
- Pagamento existe
- Não está pago (ou permite atualização apenas de campos específicos)
- Valores são válidos
- Status é válido

### Ao Deletar:
- Pagamento existe
- ⚠️ **Praticamente não será usado** - Pagamentos são criados já como PAGO
- Por enquanto, não permitir deletar pagamentos (manter histórico)
- Se necessário, permitir deletar apenas se criado recentemente (ex: últimos 5 minutos)

### Ao Processar:
- ⚠️ **NÃO SERÁ USADO AGORA** - Pagamentos são criados já como PAGO
- Método ficará para uso futuro quando implementarmos PROCESSANDO

---

## 🚀 Ordem de Implementação

1. **Atualizar schema.prisma**
   - ✅ Adicionar enum `StatusPagamentoFornecedor` (PENDENTE, PROCESSANDO, PAGO)
   - ✅ Adicionar modelo `FornecedorPagamento` (novo modelo = nova tabela)
   - ✅ **Status padrão = PAGO** (`@default(PAGO)`) - não PENDENTE
   - ✅ Campos obrigatórios: valorUnitario, valorTotal, dataPagamento, formaPagamento
   - ✅ Adicionar uma linha no modelo `Fornecedor` existente (apenas para o Prisma saber da relação, **NÃO altera a tabela no banco**)
   - ✅ Adicionar relacionamentos nos modelos existentes (AreaFornecedor, Pedido, Fruta, FrutasPedidos, FrutasPedidosAreas)

2. **Criar migration**
   - ✅ Executar `npx prisma migrate dev`
   - ✅ A migration vai **APENAS CRIAR** a nova tabela `fornecedor_pagamentos`
   - ✅ A migration **NÃO VAI ALTERAR** a tabela `fornecedores` existente
   - ✅ Verificar se a migration foi criada corretamente

3. **Criar DTOs**
   - Criar arquivos de DTO no diretório `dto/`
   - Atualizar `index.ts` para exportar novos DTOs

4. **Criar Service**
   - Criar `fornecedor-pagamentos.service.ts`
   - Implementar todos os métodos
   - Adicionar validações

5. **Atualizar Controller**
   - Adicionar endpoints de pagamentos
   - Adicionar validações nos endpoints
   - Adicionar documentação Swagger

6. **Atualizar Módulo**
   - Adicionar `FornecedorPagamentosService` nos providers
   - Exportar o service

7. **Integrar com Dashboard**
   - Adicionar métodos no `dashboard.service.ts`
   - Adicionar DTOs no `dashboard-response.dto.ts`
   - Atualizar método `getDashboardData()`

8. **Testar**
   - Testar criação de pagamentos (status = PAGO)
   - Testar validações (valores, datas, formas pagamento)
   - Testar busca de pagamentos efetuados
   - Testar endpoint de colheitas-pagamentos
   - Testar integração com dashboard
   - Testar que não permite criar pagamento duplicado

---

## 🎯 Resumo Final

**O que será CRIADO:**
- ✅ 1 nova tabela no banco (`fornecedor_pagamentos`)
- ✅ 1 novo enum no banco (`StatusPagamentoFornecedor` - PENDENTE, PROCESSANDO, PAGO)
- ✅ 1 novo modelo no Prisma (`FornecedorPagamento`)
- ✅ 1 migration (para criar a nova tabela)
- ✅ 3-4 novos DTOs (Create, Update, Response, opcionalmente ProcessarMany)
- ✅ 1 novo service (`FornecedorPagamentosService`)
- ✅ 6-7 novos endpoints no controller de fornecedores
- ✅ Integração com dashboard (método para buscar pagamentos efetuados)

**O que será ATUALIZADO (apenas código):**
- ✅ `schema.prisma` - Adicionar modelo e enum (e uma linha no modelo Fornecedor para relação)
- ✅ `fornecedores.module.ts` - Adicionar novo service
- ✅ `fornecedores.controller.ts` - Adicionar endpoints
- ✅ `dashboard.service.ts` - Adicionar métodos de pagamentos
- ✅ `dashboard-response.dto.ts` - Adicionar DTOs de pagamentos

**O que NÃO será alterado:**
- ✅ Tabela `fornecedores` no banco (nenhum campo novo, nenhuma alteração)
- ✅ `fornecedores.service.ts` - Mantém apenas CRUD de fornecedores
- ✅ Estrutura existente do módulo
- ✅ Funcionalidades existentes
- ✅ Nenhuma tabela existente será modificada

**Benefícios:**
- Tudo relacionado a fornecedores fica no mesmo módulo
- Fácil manutenção
- Reutilização de código
- Consistência com o sistema de turmas
- Organização clara

---

## ❓ Dúvidas Frequentes

**P: A tabela `fornecedores` será alterada?**
R: **NÃO!** A tabela `fornecedores` continua exatamente como está. Apenas criamos uma **NOVA TABELA** `fornecedor_pagamentos` que referencia a tabela `fornecedores` através de uma foreign key (como sempre foi feito).

**P: Vou perder dados da tabela `fornecedores`?**
R: **NÃO!** Nada será alterado na tabela `fornecedores`. É como criar uma tabela de pedidos que referencia clientes - a tabela de clientes não muda.

**P: Por que não criar um módulo separado?**
R: Para manter organização. Tudo relacionado a fornecedores (cadastro, áreas, pagamentos) fica junto, facilitando manutenção. Mas a tabela é separada!

**P: Como será diferente do sistema de turmas?**
R: 
- Estrutura similar, mas adaptada para fornecedores
- Status enum (PENDENTE, PROCESSANDO, PAGO) em vez de boolean
- Status padrão = PAGO (pagamentos são criados já pago)
- Relacionamento com área de fornecedor através de `FrutasPedidosAreas`
- Usuário informa valores diretamente (não há cálculo proporcional automático)
- Tabela é completamente nova e independente

**P: E se precisar de mais funcionalidades no futuro?**
R: A estrutura está preparada. O status PROCESSANDO já está pronto para uso futuro, e podemos adicionar mais campos na tabela `fornecedor_pagamentos` se necessário (sem afetar a tabela `fornecedores`).

**P: Como será a performance?**
R: Os índices criados garantem consultas rápidas. Usamos includes do Prisma para evitar N+1 queries. A nova tabela é otimizada para consultas frequentes.

**P: E se houver erro?**
R: Usamos transações para operações críticas. Se algo der errado, tudo é revertido automaticamente. A tabela `fornecedores` nunca será afetada.

---

## 🎉 Próximos Passos

Depois que o backend estiver pronto:
1. Frontend será atualizado para usar os novos endpoints
2. Modal será atualizado para criar/processar pagamentos
3. Dashboard será atualizado para exibir pagamentos de fornecedores
4. Testes serão realizados
5. Sistema estará pronto para uso!

