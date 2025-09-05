# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sistema Web Alencar Frutas

## ⚙️ Configuração Claude Code
- **Idioma:** Português do Brasil (PT-BR)
- **Ambiente:** Windows 11 + IDE Cursor
- **Terminal:** Integrado no Cursor
- **Permissões de edição:** Arquivos .js, .css, .ts, .json
- **Arquivos sensíveis:** .env, .gitignore, etc. (requerem autorização específica)

## 💬 Como Interagir com Claude Code

### Iniciando uma Nova Sessão
1. **Abra o Cursor** no Windows 11
2. **Navegue até o diretório do projeto:**
   ```bash
   cd C:\AlencarFrutas\SistemaWebAlencarFrutas
   ```
3. **Inicie o Claude Code no terminal:**
   ```bash
   # Se já configurado o alias
   claude
   
   # Ou comando completo
   npx @anthropics/claude-code
   ```

### Histórico de Conversas
- ❌ **Não há persistência automática** entre sessões
- 🔄 **Cada reinicialização = nova conversa** 
- 📝 **Este CLAUDE.md serve como memória persistente**
- 💡 **Dica:** Sempre comece mencionando este arquivo para contexto

### Configurações de Idioma
- ✅ **Claude Code configurado para PT-BR** (via este arquivo)
- ⚙️ **Configurações internas:** Claude Code não tem configurações de idioma persistentes
- 📋 **Solução:** Use este CLAUDE.md para manter preferências de idioma

### Comandos Úteis de Inicialização
```bash
# Verificar se está no diretório correto
pwd

# Listar arquivos do projeto  
dir

# Verificar se o Claude.md existe
type CLAUDE.md

# Iniciar Claude Code usando o alias configurado
claude

# Ou comando completo (se necessário)
npx @anthropic-ai/claude-code --settings claude-config.json
```

### ⚙️ **Alias já Configurado**
- ✅ **Arquivo:** `claude-alias.ps1` (configurado)
- ✅ **Token:** Configurado no ambiente
- ✅ **Settings:** `claude-config.json` (PT-BR configurado)
- 🔧 **Como usar:** Simplesmente digite `claude` no terminal

## 📋 Resumo do Projeto

**Sistema Web Alencar Frutas** é um sistema completo de gestão agrícola especializado em comercialização de frutas, com funcionalidades específicas para controle de áreas próprias e de fornecedores, pedidos, clientes e gestão financeira.

### 🏗️ Estrutura do Projeto
```
SistemaWebAlencarFrutas/
├── frontend/                 # Aplicação React (porta 3002)
│   ├── src/
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── utils/           # Utilitários e helpers
│   │   ├── styles/          # Estilos globais
│   │   └── assets/          # Imagens e recursos
│   └── public/              # Arquivos estáticos
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Sistema de autenticação
│   │   ├── prisma/         # Configuração do Prisma ORM
│   │   └── ...
│   └── test/               # Testes
└── CLAUDE.md               # Este arquivo
```

### 🛠️ Stack Tecnológica

#### Frontend (React 18.2.0)
- **UI Framework:** Ant Design 5.22.4, Material-UI 5.16.14
- **Styling:** Styled Components, Emotion
- **Roteamento:** React Router DOM 6.28.0
- **Formulários:** React Hook Form 7.54.0, Zod 3.24.1
- **Gráficos:** ApexCharts, Chart.js, Recharts
- **Mapas:** React Google Maps API, Leaflet
- **Documentos:** jsPDF, ExcelJS, React PDF
- **Comunicação:** Axios 1.6.2, Socket.io Client 4.8.1
- **Utilitários:** Moment.js, QRCode, CPF/CNPJ Validator

#### Backend (NestJS 11.0.1)
- **ORM:** Prisma 6.12.0
- **Autenticação:** JWT, Passport
- **Validação:** Class Validator, Zod 4.0.5
- **WebSockets:** Socket.io 4.8.1
- **Documentação:** Swagger
- **Email:** Nodemailer
- **Segurança:** bcryptjs, crypto-js

### 🚀 Funcionalidades Implementadas
- ✅ **Sistema de Autenticação JWT** completo
- ✅ **Página de Login** moderna e responsiva
- ✅ **Sistema de Notificações** (REST + WebSocket)
- ✅ **Layout de Tabelas** com tema customizável
- ✅ **Proteção de Rotas** e contexto global
- ✅ **Tema Global** em `frontend/src/theme.js`
- ✅ **Componentes Reutilizáveis** (MiniComponents)
- ✅ **Utilitários** (formatters, Excel/PDF export, WhatsApp)

### 📁 Arquivos Importantes
- `frontend/src/theme.js` - Configuração de cores e tema global
- `frontend/src/pages/Hidrometros.js` - Exemplo de layout de tabela
- `backend/src/auth/jwt.strategy.ts` - Estratégia de autenticação
- `backend/src/prisma/prisma.service.ts` - Serviço do Prisma

### 🎨 Sistema de Cores (Tema Global)
O projeto usa um sistema de cores padronizado para tabelas:
- Header: Verde (#059669)
- Linhas alternadas: #fafafa / #fff
- Hover: #e6f7ff
- Seleção: #d1fae5
- Foco: #10b981

## 🛠️ Development Commands

### Frontend (React) - Port 3002
```bash
# Development
cd frontend
npm start                    # Start development server

# Build and test
npm run build               # Production build
npm test                    # Run tests
```

### Backend (NestJS)
```bash
# Development
cd backend
npm run start:dev           # Start with file watching
npm run start:debug         # Start with debugger

# Build and quality
npm run build               # Compile TypeScript
npm run lint                # Run ESLint
npm run lint --fix          # Fix ESLint issues
npm run test                # Run Jest tests
npm run test:watch          # Run tests in watch mode
npm run test:cov            # Run tests with coverage

# Production
npm run start:prod          # Start production server
```

### Database (Prisma)
```bash
# From backend directory
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema to database
npx prisma studio           # Open Prisma Studio
npx prisma migrate dev      # Create and apply migration
npx prisma migrate deploy   # Deploy migrations to production
```

## 🏗️ Architecture Overview

### Monorepo Structure
- **frontend/**: React 18.2.0 application (port 3002)
- **backend/**: NestJS 11.0.1 API with Prisma ORM
- **Shared configurations**: Claude Code setup in root

### Data Flow Architecture
1. **Frontend**: React SPA with Ant Design + Material-UI
2. **API Layer**: NestJS controllers with JWT authentication  
3. **Business Logic**: NestJS services with Prisma integration
4. **Database**: PostgreSQL with Prisma schema
5. **Real-time**: WebSocket notifications via Socket.io

### Key Architectural Patterns
- **Authentication**: JWT with Passport strategy
- **State Management**: React Context API for auth + local state
- **Forms**: React Hook Form + Zod validation
- **API Communication**: Axios with interceptors
- **Database**: Prisma ORM with complex relationships
- **Real-time**: WebSocket gateway for notifications
- **Styling**: Ant Design + Material-UI + Styled Components

---

## 🏢 Lógica de Negócio Específica - AlencarFrutas

### 📊 Modelos de Dados Implementados

#### 🌱 **Gestão Agrícola**
- **Culturas:** Cadastro de culturas (perenes/temporárias) com possibilidade de consórcio
- **Áreas Próprias:** Gestão de lotes agrícolas categorizados (COLONO, TECNICO, EMPRESARIAL, ADJACENTE)
- **Fornecedores:** Cadastro de fornecedores com suas respectivas áreas
- **Lotes-Culturas:** Relacionamento entre áreas e culturas plantadas

#### 🍎 **Frutas e Comercialização**
- **Frutas:** Catálogo com categorias (CITRICOS, TROPICAIS, TEMPERADAS, etc.)
- **Clientes:** Cadastro completo com dados fiscais e comunicação
- **Pedidos:** Sistema completo de pedidos com múltiplas frutas e status detalhado
- **Pagamentos:** Controle de múltiplos pagamentos por pedido (PIX, BOLETO, TRANSFERÊNCIA, etc.)

#### ⚙️ **Configurações do Sistema**
- **Dados da Empresa:** Configurações institucionais
- **Contas Bancárias:** Gestão de contas correntes
- **APIs Bancárias:** Credenciais para integração bancária
- **Email/WhatsApp:** Configurações de comunicação

### 🔄 **Fluxo de Trabalho dos Pedidos**

1. **PEDIDO_CRIADO** → Pedido criado no sistema
2. **AGUARDANDO_COLHEITA** → Aguardando data prevista de colheita
3. **COLHEITA_REALIZADA** → Colheita concluída com quantidades reais
4. **AGUARDANDO_PRECIFICACAO** → Aguardando definição de preços
5. **PRECIFICACAO_REALIZADA** → Preços definidos, valor total calculado
6. **AGUARDANDO_PAGAMENTO** → Aguardando pagamento do cliente
7. **PAGAMENTO_PARCIAL** → Pagamento parcial recebido
8. **PAGAMENTO_REALIZADO** → Pagamento completo
9. **PEDIDO_FINALIZADO** → Pedido totalmente concluído

### 🌐 **Rotas da API (Backend)**

#### Autenticação
- `POST /auth/login` - Login de usuário
- `GET /auth/profile` - Perfil do usuário autenticado

#### Módulos Principais
- `/config` - Configurações da empresa
- `/conta-corrente` - Gestão de contas bancárias
- `/credenciais-api` - Credenciais bancárias
- `/convenio-cobranca` - Convênios de cobrança
- `/config-email` - Configurações de email
- `/config-whatsapp` - Configurações do WhatsApp
- `/notificacoes` - Sistema de notificações
- `/culturas` - Gestão de culturas
- `/areas` - Áreas agrícolas próprias
- `/frutas` - Catálogo de frutas
- `/clientes` - Gestão de clientes
- `/fornecedores` - Cadastro de fornecedores
- `/areas-fornecedores` - Áreas dos fornecedores
- `/pedidos` - Sistema de pedidos

### 🖥️ **Páginas do Frontend**

#### Páginas Implementadas
- **Dashboard** (`/`) - Visão geral do sistema
- **Áreas Agrícolas** (`/areas-agricolas`) - Gestão de áreas próprias
- **Frutas** (`/frutas`) - Catálogo de frutas
- **Clientes** (`/clientes`) - Gestão de clientes
- **Pedidos** (`/pedidos`) - Sistema completo de pedidos
- **Fornecedores** (`/fornecedores`) - Gestão de fornecedores
- **Configurações** (`/configuracoes`) - Configurações do sistema
- **Login** (`/login`) - Autenticação

### 💾 **Características Técnicas Específicas**

#### Relacionamentos Complexos
- **Pedidos ↔ Frutas:** Relacionamento N:N com tabela intermediária `FrutasPedidos`
- **Áreas Duplas:** Frutas podem vir de áreas próprias OU de fornecedores
- **Múltiplos Pagamentos:** Um pedido pode ter vários pagamentos parciais
- **Dupla Unidade:** Produtos com duas unidades de medida (KG + CX)

#### Campos Específicos do Agronegócio
- **Fita de Colheita:** Identificação visual por cores
- **Pesagem de Frete:** Controle logístico
- **Múltiplas Placas:** Carro principal + reboque
- **Conta Destino:** ALENCAR, FRANCIALDA, GAVETA
- **Status Detalhado:** 10 status diferentes para pedidos

### 🎯 **Status Atual de Implementação**
- ✅ **Banco de Dados:** Schema Prisma completo e funcional
- ✅ **Backend:** Todos os módulos implementados
- ✅ **Frontend:** Páginas principais implementadas
- ✅ **Autenticação:** Sistema JWT funcional
- ✅ **Notificações:** Sistema real-time via WebSocket
- ⚠️ **Em Desenvolvimento:** Ajustes finos nas regras de negócio

---

## 🔍 **Preferências de Desenvolvimento**

### Verificação de Propriedades da API
- ✅ **SEMPRE consultar a API correspondente** antes de usar propriedades de objetos
- ✅ **NÃO assumir nomes de propriedades** sem verificar a estrutura real dos dados
- ✅ **Exemplo:** Pedido usa `numeroPedido` (não `numero` ou `id` para exibição)
- ⚠️ **Processo:** Ler DTOs, schemas ou fazer chamadas de teste para confirmar estrutura

### Verificação de Relacionamentos Prisma
- ✅ **SEMPRE consultar o schema.prisma** antes de usar relacionamentos
- ✅ **NÃO supor nomes de relacionamentos** - verificar antes de usar
- ✅ **Exemplo:** Relação é `frutasPedidos` (não `frutas`), relacionamento correto conforme schema
- ⚠️ **Processo:** `grep "model Pedido" prisma/schema.prisma` para confirmar relacionamentos disponíveis

### Sistema de Notificações
- ✅ **SEMPRE usar showNotification** para alerts/mensagens no sistema
- ✅ **Import:** `import { showNotification } from "../../config/notificationConfig";`
- ✅ **Localização:** `frontend/src/config/notificationConfig.js`
- ✅ **Tipos:** `"success"`, `"error"`, `"warning"`, `"info"`
- ✅ **Padrão:** `showNotification("error", "Título", "Mensagem detalhada")`

### Padrão de Paginação no Sistema
- ✅ **Estados obrigatórios:**
  - `const [currentPage, setCurrentPage] = useState(1);`
  - `const [pageSize, setPageSize] = useState(20);` // Padrão: 20 itens
  - `const [total, setTotal] = useState(0);` // Total de registros

- ✅ **Componente Pagination padronizado:**
  ```jsx
  <Pagination
    current={currentPage}
    pageSize={pageSize}
    total={total}
    onChange={handlePageChange} // Função que atualiza página e size
    onShowSizeChange={handlePageChange} // Mesma função para mudança de tamanho
    showSizeChanger
    showQuickJumper
    showTotal={(total, range) => `${range[0]}-${range[1]} de ${total} [entidade]`}
    pageSizeOptions={['10', '20', '50', '100']} // Opções padrão
    style={{ justifyContent: "flex-end" }} // Alinhamento à direita
  />
  ```

- ✅ **Função handlePageChange padrão:**
  ```jsx
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size || pageSize);
    // Chamar API com novos parâmetros
  };
  ```

- ⚠️ **Processo:** Sempre seguir este padrão para consistência visual e funcional

---

## 🔧 **Correções e Melhorias Implementadas**

### 📋 Dashboard de Pedidos (Implementado em 05/09/2025)
- ✅ **Dashboard completa** com seções por status lado a lado
- ✅ **Cards de estatísticas** com 6 indicadores em linha única
- ✅ **Seções com scroll interno** e altura fixa (500px)
- ✅ **Integração backend** com endpoint `/api/pedidos/dashboard`
- ✅ **Modais funcionais** para todas as operações (colheita, precificação, pagamento)
- ✅ **Padronização visual** entre dashboard e página principal

### 🚨 Problemas Críticos Resolvidos

#### Thread-Safety na Geração de Números
- ❌ **Problema:** Duplicação de `numeroPedido` por lógica inadequada usando `count()`
- ✅ **Solução:** Implementada busca por maior número existente + incremento
- 📍 **Arquivo:** `backend/src/pedidos/pedidos.service.ts:83-108`

#### Validação de Unidades de Medida
- ❌ **Problema:** Frontend permitia unidades iguais (unidadeMedida1 = unidadeMedida2)
- ✅ **Solução:** Validação adicionada com notificação de "warning" em vez de "error"
- 📍 **Arquivo:** `frontend/src/components/pedidos/NovoPedidoModal.js:98-101`

#### Gestão de Pagamentos na Dashboard
- ❌ **Problema:** Props `onNovoPagamento` e `onRemoverPagamento` ausentes
- ❌ **Problema:** Inconsistência HTTP (PUT vs PATCH)
- ❌ **Problema:** UI "piscando" durante operações
- ✅ **Soluções:** 
  - Handlers implementados com carregamento otimizado
  - Padronizado uso de PATCH para atualizações
  - Loading separado (`operacaoLoading`) para evitar "flickering"
- 📍 **Arquivos:** `frontend/src/pages/PedidosDashboard.js:168-248`

#### Padronização Visual
- ✅ **Ícones padronizados** entre Dashboard e PedidosTable:
  - Colheita: `ShoppingOutlined` + azul (#1890ff)
  - Precificação: `DollarOutlined` + roxo (#722ed1)
  - Pagamento: `CreditCardOutlined` + amarelo (#faad14)
- 📍 **Arquivos:** StatusSection.js, PedidoCard.js

### 🎯 Arquivos Principais Modificados
- `frontend/src/pages/PedidosDashboard.js` - Dashboard principal
- `frontend/src/components/pedidos/dashboard/StatusSection.js` - Seções por status
- `frontend/src/components/pedidos/dashboard/PedidoCard.js` - Cards de pedidos
- `frontend/src/components/pedidos/NovoPedidoModal.js` - Validação unidades
- `backend/src/pedidos/pedidos.service.ts` - Geração thread-safe de números

---

> **Nota:** Este sistema passou da fase de template para implementação específica do negócio AlencarFrutas, com modelos e lógicas adaptadas para gestão agrícola e comercialização de frutas.