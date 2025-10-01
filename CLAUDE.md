# CLAUDE.md

Documentação técnica e guia para desenvolvimento do Sistema Web Alencar Frutas.

## ⚙️ Configuração
- **Idioma:** Português do Brasil (PT-BR)
- **Ambiente:** Windows 11 + IDE Cursor
- **Terminal:** `claude` (alias configurado)
- **MCP Render:** Configurado para deploy e gerenciamento de serviços

## 📋 Sistema Web Alencar Frutas

Sistema completo de gestão agrícola especializado em comercialização de frutas, com funcionalidades específicas para controle de áreas próprias e de fornecedores, pedidos, clientes e gestão financeira.

### 🏗️ Arquitetura
```
SistemaWebAlencarFrutas/
├── frontend/          # React 18.2.0 (porta 3002)
│   ├── src/pages/     # Páginas da aplicação
│   ├── src/components/ # Componentes reutilizáveis
│   └── src/utils/     # Utilitários e helpers
├── backend/           # NestJS 11.0.1 API
│   ├── src/auth/      # Sistema de autenticação
│   ├── src/prisma/    # Configuração do Prisma ORM
│   └── src/[módulos]/ # Módulos de negócio
└── CLAUDE.md          # Este arquivo
```

### 🛠️ Stack Tecnológica

**Frontend:** React 18.2.0, Ant Design 5.22.4, Material-UI 5.16.14, React Router DOM, Axios, Socket.io Client

**Backend:** NestJS 11.0.1, Prisma 6.12.0, JWT/Passport, Socket.io, Swagger

**Database:** PostgreSQL com Prisma schema

**Comunicação:** REST APIs + WebSocket para notificações em tempo real

### 🎨 Sistema de Cores
- Cor principal: Verde (#059669)
- Header tabelas: Verde (#059669)
- Tema global configurado em `frontend/src/theme.js`

## 🚀 Comandos de Desenvolvimento

**Frontend (porta 3002):**
- `cd frontend && npm start` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- ⚠️ **IMPORTANTE:** Não executar builds automáticos - o usuário testa manualmente

**Backend:**
- `cd backend && npm run start:dev` - API com watch mode
- `npm run build` - Build de produção (verificar erros)
- `npm run lint` - ESLint check

⚠️ **IMPORTANTE:** NUNCA executar comandos `npm start` ou `npm run start:dev` automaticamente. O usuário gerencia a execução dos serviços.

**Database (Prisma):**
- `npx prisma generate` - Gerar cliente Prisma
- `npx prisma studio` - Interface visual do banco
- `npx prisma migrate dev` - Aplicar migrações

**Deploy & Infraestrutura:**
- **MCP Render:** `claude mcp list` - Verificar status da conexão
- **API Key:** Configurada para gerenciamento de serviços no Render
- **Deploy:** Acesso direto aos serviços através do Claude Code

---

## 🏢 Lógica de Negócio - AlencarFrutas

### 📊 Domínios do Sistema

**🌱 Gestão Agrícola:**
- Culturas (perenes/temporárias)
- Áreas próprias (COLONO, TECNICO, EMPRESARIAL, ADJACENTE)
- Fornecedores com áreas vinculadas
- Controle de produção (fitas de banana com cores)

**🍎 Comercialização:**
- Frutas por categorias (CITRICOS, TROPICAIS, TEMPERADAS)
- Clientes com dados fiscais
- Pedidos com fluxo sequencial de 10 status
- Múltiplos pagamentos (PIX, BOLETO, TRANSFERÊNCIA)

**⚙️ Configurações:**
- Dados da empresa e contas bancárias
- Credenciais de APIs e comunicação (Email/WhatsApp)
- Notificações em tempo real

### 🔄 Fluxo de Pedidos (10 Status Sequenciais)

**Ciclo de Vida do Pedido:**
1. **PEDIDO_CRIADO** → dados básicos (cliente, frutas, quantidades previstas)
2. **AGUARDANDO_COLHEITA** → aguarda data de colheita
3. **COLHEITA_REALIZADA** → quantidades reais + áreas + fitas + frete
4. **AGUARDANDO_PRECIFICACAO** → aguarda definição de preços
5. **PRECIFICACAO_REALIZADA** → valores + frete + ICMS - descontos
6. **AGUARDANDO_PAGAMENTO** → aguarda pagamento do cliente
7. **PAGAMENTO_PARCIAL** → pagamento parcial recebido
8. **PAGAMENTO_REALIZADO** → valor total recebido
9. **PEDIDO_FINALIZADO** → processo completo (estado final)
10. **CANCELADO** → cancelado em qualquer fase (estado final)

**Características:**
- Transições automáticas entre status
- Estados finais não editáveis (FINALIZADO/CANCELADO)
- Sistema de múltiplas áreas e fitas por fruta
- Dupla unidade de medida com precificação flexível
- Múltiplos pagamentos por pedido

### 🔧 Regras de Transição

**Estados Finais (Não Editáveis):**
- PEDIDO_FINALIZADO e CANCELADO

**Transições Automáticas:**
- Criação → AGUARDANDO_COLHEITA (automático)
- Colheita → COLHEITA_REALIZADA → AGUARDANDO_PRECIFICACAO (automático)
- Precificação → PRECIFICACAO_REALIZADA → AGUARDANDO_PAGAMENTO (automático)
- Pagamentos baseados em valor: PARCIAL (< total) ou REALIZADO (>= total)

**Sistema de Tabs com Controle de Acesso:**
- Aba 1 (Dados Básicos): sempre editável (exceto finalizados)
- Aba 2 (Colheita): após colheita realizada
- Aba 3 (Precificação): após precificação realizada
- Aba 4 (Pagamentos): após pagamentos iniciados

### 🌐 Estrutura da API

**Autenticação:** `/auth/login`, `/auth/profile`

**Módulos Principais:**
- `/api/pedidos` - Sistema completo de pedidos + dashboard
- `/api/frutas`, `/api/clientes`, `/api/areas-agricolas`  
- `/api/fornecedores`, `/api/areas-fornecedores`
- `/fitas-banana`, `/controle-banana` - Sistema de produção
- `/config`, `/notificacoes` - Configurações e notificações

### 🖥️ Páginas do Frontend

- **Dashboard** (`/`) - Visão geral
- **Pedidos** (`/pedidos`) - Gestão completa de pedidos
- **Áreas Agrícolas** (`/areas-agricolas`) - Gestão de áreas próprias  
- **Frutas, Clientes, Fornecedores** - CRUDs básicos
- **Produção > Banana** (`/producao/banana`) - Controle de fitas
- **Configurações** (`/configuracoes`) - Setup do sistema

### 💾 Características Técnicas

**Relacionamentos Complexos:**
- Pedidos N:N Frutas (tabela `FrutasPedidos`)
- Áreas exclusivas: próprias OU fornecedores
- Múltiplos pagamentos por pedido
- Dupla unidade de medida (ex: KG + CX)

**Específico do Agronegócio:**
- Fitas de colheita com cores hexadecimais
- Controle logístico (pesagem, placas)
- Contas destino (ALENCAR, FRANCIALDA, GAVETA)
- Thread-safety na geração de números

### 🎯 Status de Implementação
✅ **Completos:** Schema Prisma, Backend NestJS, Frontend React, Auth JWT, WebSocket
⚠️ **Em desenvolvimento:** Ajustes nas regras de negócio

---

## 🛒 Sistema de Pedidos - Núcleo do Sistema

Arquitetura complexa com 10 status sequenciais, relacionamentos N:N, dupla unidade de medida, múltiplas áreas/fitas por fruta, múltiplos pagamentos e thread-safety.

### 🗄️ Modelos Principais do Schema

**Pedido:** numeroPedido único, clienteId, datas, valores financeiros consolidados, status sequencial

**FrutasPedidos:** relacionamento N:N com dupla unidade de medida, precificação flexível, múltiplas áreas e fitas

**FrutasPedidosAreas:** áreas exclusivas (próprias OU fornecedores) por fruta

**FrutasPedidosFitas:** múltiplas fitas com cores por fruta (específico banana)

**PagamentosPedidos:** múltiplos pagamentos com diferentes métodos e contas destino

### 🖥️ Componentes Frontend por Fase

**1. NovoPedidoModal:** Cliente + múltiplas frutas + dupla unidade + validações

**2. ColheitaModal:** Quantidades reais + áreas múltiplas + fitas + frete + validações exclusivas

**3. PrecificacaoModal:** Valores unitários + unidade flexível + cálculos automáticos + resumo financeiro

**4. PagamentoModal:** Múltiplos pagamentos + métodos + contas destino + status automático

**5. EditarPedidoDialog:** 4 tabs com controle de acesso por status + validações dinâmicas

### 🔧 Backend - Serviços Principais

**PedidosService:**
- `gerarNumeroPedido()` - Thread-safe, formato PED-YYYY-0001
- `gerenciarAreasEFitas()` - CRUD granular de relacionamentos
- `calcularValoresConsolidados()` - Soma frutas + frete + impostos - descontos
- `atualizarStatusPagamento()` - Status automático baseado em valores

**APIs Principais:**
- CRUD pedidos `/api/pedidos` + dashboard
- Operações por fase: colheita, precificação, pagamentos

### 🎯 Inovações Técnicas

1. **Thread-Safety:** Geração única de números por busca de máximo + incremento
2. **Múltiplas Áreas:** Exclusividade (próprias OU fornecedores) + validações
3. **Dupla Unidade:** KG+CX com precificação flexível em qualquer unidade
4. **Fitas Coloridas:** Controle visual de produção com cores hex
5. **Cálculos Automáticos:** Valores e status recalculados em tempo real

---

## 🔍 Diretrizes de Desenvolvimento

### ⚠️ Verificações Obrigatórias
**Endpoints:** Consultar controllers `.controller.ts` antes de usar (alguns têm `/api/`, outros não)

**Propriedades:** Verificar DTOs/schemas reais (ex: `numeroPedido`, não `numero`)

**Relacionamentos:** Consultar `schema.prisma` (ex: `frutasPedidos`, não `frutas`)

**Models:** Verificar nomes exatos (ex: `Usuario` não `User`, enum `NivelUsuario.ADMINISTRADOR`)

### 🛠️ Ferramentas Padronizadas
**Notificações:** `showNotification(tipo, título, mensagem)` de `notificationConfig.js`

**HTTP:** `axiosInstance` (nunca axios direto) - JWT automático + baseURL

**Paginação:** `currentPage`, `pageSize=20`, `total` com Pagination padrão

**Inputs:** `MaskedDecimalInput`, `HectaresInput`, `FormButton` de `/common/`

---

## 🔧 Principais Implementações

### ✅ Funcionalidades Completas
- **Dashboard de Pedidos:** Seções por status + cards de estatísticas + modais funcionais
- **Sistema de Produção:** Google Maps + controle de fitas com cores + contagem correta
- **Thread-Safety:** Geração única de números de pedido por busca de máximo
- **Validações:** Unidades de medida + áreas exclusivas + pagamentos automáticos
- **UI Padronizada:** Ícones consistentes + loading otimizado + componentes reutilizáveis

---

## 🍌 Sistema de Controle de Banana

Módulo específico para produção de bananas com controle visual por fitas coloridas.

**Tabelas:** `fitas_banana`, `controle_banana`, `historico_fitas` com auditoria completa

**APIs:** `/fitas-banana`, `/controle-banana`, `/historico-fitas` (CRUD + dashboard)

**Frontend:** Página com Google Maps (70%) + listagem (30%) + modais + seletor de cores

---

## 🎨 Padrões de Interface

### 🔘 Componentes de Botões
**PrimaryButton:** Páginas principais (40px altura)
**FormButton:** Formulários e modais (48px altura, alinhado com inputs)
**Button padrão:** Footers de modais

### 🪟 Estrutura de Modais
- Header verde (#059669) com ícone e título
- Cards internos com headers verdes para agrupamento
- Labels com ícones coloridos
- Footer com botões de ação alinhados à direita

### 📋 Padrões de UI
**Cores:** Verde primário (#059669), headers de tabela padronizados
**Ícones:** Material-UI preferencial, consistência visual
**Loading:** States otimizados, sem "flickering"
**Notificações:** Sistema centralizado com tipos (success/error/warning/info)

### 🔧 Componentes de Input
**MaskedDecimalInput:** Valores decimais com padrão brasileiro (1.234,56)
**HectaresInput:** Específico para áreas com sufixo "ha" automático  
**FormButton:** Botões em formulários (48px altura)
**Importação:** `from "../common/inputs"` ou `from "../common/buttons"`

---

## 🎯 Implementações Recentes

### 🍌 Nova Lógica de Vinculação de Fitas (2024-12-15)

**Mudança Principal:** Sistema agora permite seleção de **lotes individuais** em vez de agregação automática por área.

**Antes:**
- Fitas eram agrupadas por cor/área 
- Sistema subtraía automaticamente do lote mais antigo
- Usuário não tinha controle sobre qual lote específico usar

**Depois:**
- **Seleção por lote específico** da tabela `controle_banana`
- Usuário vê todos os lotes disponíveis com:
  - Data de marcação ("Marcado: DD/MM/YY") 
  - Tempo decorrido (dias ou semanas arredondadas para cima)
  - Quantidade disponível no lote
  - Layout com cores da fita para melhor identificação

**Arquivos Modificados:**
- `frontend/src/components/pedidos/VincularFitasModal.js` - Nova interface por lotes
- Backend mantido (endpoint `/controle-banana/fitas-com-areas` já retornava lotes individuais)

**Vantagens:**
✅ **Controle preciso** - usuário escolhe exatamente qual lote usar
✅ **Transparência** - mostra data de colheita e idade de cada lote
✅ **Flexibilidade** - não força ordem automática de consumo
✅ **Rastreabilidade** - mantém histórico exato de qual lote foi usado
✅ **UI melhorada** - cards compactos com cores das fitas

**Compatibilidade:** Mantém integração com `ColheitaModal.js` e `ColheitaTab.js` sem alterações.

---

> **Sistema especializado em gestão agrícola para comercialização de frutas com foco em pedidos sequenciais, múltiplas áreas de produção e controle visual por fitas coloridas.**
- sempre atualize @README.md quando finalizar alterações que achar que a documentação precisa ser atualizada