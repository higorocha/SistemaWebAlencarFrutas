# Sistema Web AlencarFrutas

Sistema completo de gestão agrícola especializado na comercialização de frutas, desenvolvido com React 18 + NestJS + PostgreSQL. O sistema oferece controle total do processo desde o plantio até a venda, incluindo múltiplas áreas de produção, controle de qualidade por fitas, gestão de fornecedores e sistema avançado de pedidos com múltiplas fases.

---

## 🏢 Sobre o AlencarFrutas

Sistema de gestão agrícola completo que gerencia:
- **Áreas Agrícolas Próprias** com categorização (COLONO, TECNICO, EMPRESARIAL, ADJACENTE)
- **Fornecedores e suas Áreas** para complementar a produção
- **Culturas Diversas** (perenes, temporárias, consórcio)
- **Catálogo de Frutas** por categoria (CITRICOS, TROPICAIS, TEMPERADAS, etc.)
- **Sistema de Pedidos Avançado** com 10 fases sequenciais
- **Controle de Produção de Banana** com sistema de fitas coloridas
- **Gestão Financeira** com múltiplos pagamentos e métodos
- **Clientes e Fornecedores** com dados fiscais completos

---

## 🚀 Funcionalidades Principais

### 📋 **Sistema de Pedidos (Core do Sistema)**

**🔄 Fluxo de 10 Fases Sequenciais:**
1. **🆕 PEDIDO_CRIADO** → Dados básicos (cliente, frutas, quantidades previstas)
2. **⏳ AGUARDANDO_COLHEITA** → Aguarda data prevista de colheita  
3. **🚜 COLHEITA_REALIZADA** → Quantidades reais + áreas + fitas + dados de frete
4. **💰 AGUARDANDO_PRECIFICACAO** → Aguarda definição de preços
5. **📊 PRECIFICACAO_REALIZADA** → Valores unitários + frete + ICMS - descontos
6. **💳 AGUARDANDO_PAGAMENTO** → Aguarda pagamento do cliente
7. **💵 PAGAMENTO_PARCIAL** → Pagamento parcial recebido
8. **✅ PAGAMENTO_REALIZADO** → Valor total recebido
9. **🎯 PEDIDO_FINALIZADO** → Processo completo (estado final)
10. **❌ CANCELADO** → Cancelado em qualquer fase (estado final)

**🎯 Características Avançadas:**
- **Dupla Unidade de Medida**: Por fruta (ex: 1000 KG + 50 CX)
- **Múltiplas Áreas de Origem**: Próprias + fornecedores por fruta
- **Múltiplas Fitas**: Sistema especial para banana com cores hexadecimais
- **Precificação Flexível**: Pode usar qualquer unidade de medida da fruta
- **Múltiplos Pagamentos**: PIX, Boleto, Transferência, Dinheiro, Cheque
- **Dashboard Avançado**: Cards por status com paginação e filtros
- **Thread-Safety**: Numeração única automática (PED-2024-0001)
- **Sistema de Tabs Inteligente**: Acesso controlado baseado no status atual

### 🌱 **Gestão Agrícola**
- **Áreas Próprias**: Cadastro com localização GPS e categorização
- **Culturas**: Gestão de plantios (perenes, temporárias, consórcio)
- **Fornecedores**: Cadastro completo com áreas associadas
- **Relacionamentos**: Lotes-culturas para controle de plantio

### 🍎 **Catálogo de Frutas**
- **Categorização**: CITRICOS, TROPICAIS, TEMPERADAS, EXOTICAS, OLEAGINOSAS
- **Unidades Duplas**: Suporte a duas unidades por fruta
- **Integração**: Direto com sistema de pedidos

### 👥 **Gestão de Clientes**
- **Dados Fiscais**: CPF/CNPJ, inscrições, endereços
- **Comunicação**: Email, telefone, WhatsApp
- **Histórico**: Integração com pedidos

### 🍌 **Sistema de Controle de Banana (Sistema Avançado de Fitas)**

**🎯 Sistema de Controle por Lote Específico:**
- **Fitas Coloridas**: Cadastro com cores hexadecimais (#FF0000) e nomes únicos
- **Controle por Lote**: Cada registro de fitas é um lote específico com data de registro
- **Seleção Direta**: Usuário escolhe exatamente qual lote usar via `controleBananaId`
- **Controle Preciso**: Operações trabalham com lotes específicos identificados
- **Mapa Interativo**: Google Maps mostrando distribuição geográfica das áreas
- **Auditoria Completa**: Histórico detalhado de todas as operações com dados antes/depois

**🔄 Fluxo de Operações:**
1. **Registro de Lotes**: Fitas são registradas por área com quantidade e data
2. **Vinculação a Pedidos**: Usuário seleciona lotes específicos via `controleBananaId`
3. **Edição Inteligente**: Atualiza quantidades existentes, adiciona novas, remove obsoletas
4. **Controle de Estoque**: Validação em tempo real de disponibilidade
5. **Histórico Automático**: Registro de todas as operações para auditoria

**📊 Estrutura de Dados:**
- **FitaBanana**: Nome, cor hexadecimal, usuário criador
- **ControleBanana**: Lote específico (fita + área + quantidade + data)
- **HistoricoFitas**: Auditoria completa (ação, dados anteriores/novos, usuário)
- **FrutasPedidosFitas**: Vinculação de lotes específicos a pedidos

**🎨 Interface Inteligente:**
- **Modal de Vinculação**: Mostra apenas áreas relevantes (com estoque OU vinculadas)
- **Indicadores Visuais**: Cores diferenciadas por status (estoque, vinculada, zerada)
- **Validação Dinâmica**: Estoque real = disponível + já vinculado ao pedido
- **Filtros Automáticos**: Remove áreas irrelevantes da listagem
- **Edição Preservativa**: Mantém vinculações existentes durante edições

### ⚙️ **Configurações do Sistema**
- **Dados da Empresa**: Informações institucionais
- **Contas Bancárias**: Gestão de contas correntes
- **APIs Bancárias**: Credenciais para integração
- **Email/WhatsApp**: Configurações de comunicação

### 🔔 **Sistema de Notificações**
- **Tempo Real**: WebSocket para notificações instantâneas
- **Tipos Variados**: Sucesso, erro, warning, informação
- **Integração**: Em todo o sistema

---

## 🛠️ Tecnologias Utilizadas

### **Frontend (React 18.2.0)**
- **UI Framework:** Ant Design 5.22.4, Material-UI 5.16.14
- **Styling:** Styled Components 6.1.13, Emotion
- **Roteamento:** React Router DOM 6.28.0
- **Formulários:** React Hook Form 7.54.0, Zod 3.24.1
- **Gráficos:** ApexCharts, Chart.js, Recharts
- **Mapas:** Google Maps API, Leaflet 1.9.4
- **Documentos:** jsPDF, ExcelJS, React PDF
- **Comunicação:** Axios 1.6.2, Socket.io Client 4.8.1
- **Utilitários:** Moment.js, QRCode, CPF/CNPJ Validator
- **Animações:** Framer Motion 11.13.1

### **Backend (NestJS 11.0.1)**
- **ORM:** Prisma 6.12.0 com PostgreSQL
- **Autenticação:** JWT, Passport, bcryptjs
- **Validação:** Class Validator, Zod 4.0.5
- **WebSockets:** Socket.io 4.8.1
- **Documentação:** Swagger
- **Email:** Nodemailer
- **Segurança:** Rate Limiting (Throttler), crypto-js
- **Testes:** Jest, Supertest

---

## 📁 Estrutura do Projeto

```
SistemaWebAlencarFrutas/
├── frontend/                           # React Application (porta 3002)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js            # Dashboard principal
│   │   │   ├── Pedidos.js              # Listagem de pedidos
│   │   │   ├── PedidosDashboard.js     # Dashboard de pedidos
│   │   │   ├── AreasAgricolas.js       # Gestão de áreas próprias
│   │   │   ├── Frutas.js               # Catálogo de frutas
│   │   │   ├── Clientes.js             # Gestão de clientes
│   │   │   ├── FornecedoresPage.js     # Gestão de fornecedores
│   │   │   ├── Configuracoes.js        # Configurações do sistema
│   │   │   ├── Login/                  # Página de login
│   │   │   └── producao/
│   │   │       └── ControleBanana.js   # Controle de produção de banana
│   │   ├── components/
│   │   │   ├── pedidos/                # Componentes do sistema de pedidos
│   │   │   │   ├── NovoPedidoModal.js  # Criação de pedidos
│   │   │   │   ├── EditarPedidoDialog.js # Edição completa
│   │   │   │   ├── ColheitaModal.js    # Registro de colheita
│   │   │   │   ├── PrecificacaoModal.js # Definição de preços
│   │   │   │   ├── PagamentoModal.js   # Gestão de pagamentos
│   │   │   │   ├── VincularAreasModal.js # Vinculação de áreas
│   │   │   │   ├── VincularFitasModal.js # Vinculação de fitas
│   │   │   │   └── tabs/               # Sistema de tabs
│   │   │   ├── common/                 # Componentes reutilizáveis
│   │   │   │   ├── buttons/            # Botões personalizados
│   │   │   │   ├── inputs/             # Inputs especializados
│   │   │   │   └── search/             # Componentes de busca
│   │   │   ├── producao/               # Componentes de produção
│   │   │   └── areas/                  # Componentes de áreas
│   │   ├── contexts/                   # Contextos React
│   │   ├── hooks/                      # Custom hooks
│   │   ├── utils/                      # Utilitários
│   │   ├── api/                        # Configuração de API
│   │   ├── config/                     # Configurações
│   │   └── theme.js                    # Tema global
│   └── public/
├── backend/                            # NestJS API
│   ├── src/
│   │   ├── auth/                       # Sistema de autenticação
│   │   ├── pedidos/                    # Sistema de pedidos
│   │   ├── areas/                      # Áreas agrícolas próprias
│   │   ├── areas-fornecedores/         # Áreas de fornecedores
│   │   ├── frutas/                     # Catálogo de frutas
│   │   ├── culturas/                   # Gestão de culturas
│   │   ├── clientes/                   # Gestão de clientes
│   │   ├── fornecedores/               # Gestão de fornecedores
│   │   ├── fitas-banana/               # Sistema de fitas
│   │   ├── controle-banana/            # Controle de produção
│   │   ├── historico-fitas/            # Auditoria de fitas
│   │   ├── notificacoes/               # Sistema de notificações
│   │   ├── config/                     # Configurações da empresa
│   │   ├── config-email/               # Configurações de email
│   │   ├── config-whatsapp/            # Configurações do WhatsApp
│   │   ├── conta-corrente/             # Contas bancárias
│   │   ├── credenciais-api/            # Credenciais bancárias
│   │   ├── convenio-cobranca/          # Convênios de cobrança
│   │   └── prisma/                     # Configuração do Prisma
│   ├── prisma/
│   │   ├── schema.prisma               # Schema do banco de dados
│   │   └── migrations/                 # Migrações
│   └── test/
├── CLAUDE.md                           # Documentação técnica completa
└── README.md                           # Este arquivo
```

---

## 🗄️ Banco de Dados (PostgreSQL + Prisma)

### **Principais Modelos**
- **Usuario** - Sistema de autenticação
- **Pedido** - Core do sistema com 10 status
- **FrutasPedidos** - Relacionamento N:N com dupla unidade
- **FrutasPedidosAreas** - Múltiplas áreas por fruta
- **FrutasPedidosFitas** - Múltiplas fitas por fruta
- **PagamentosPedidos** - Múltiplos pagamentos por pedido
- **AreaAgricola** - Áreas próprias categorizadas
- **AreaFornecedor** - Áreas de fornecedores
- **Cliente** - Dados fiscais e comerciais
- **Fruta** - Catálogo com categorias
- **FitaBanana** - Fitas com cores hexadecimais e nomes únicos
- **ControleBanana** - Lotes de fitas por área (controle por lote específico)
- **HistoricoFitas** - Auditoria completa de operações
- **FrutasPedidosFitas** - Vinculação de lotes específicos a pedidos

### **Relacionamentos Complexos**
- **N:N Avançado**: Pedidos ↔ Frutas com múltiplas áreas e fitas
- **Dupla Referência**: Áreas podem ser próprias OU de fornecedores
- **Hierarquia**: Culturas → Áreas → Pedidos → Pagamentos

---

## 🌐 APIs Disponíveis

### **Sistema de Pedidos**
```
GET    /api/pedidos                    # Listar com paginação e filtros
POST   /api/pedidos                    # Criar novo pedido
GET    /api/pedidos/dashboard          # Dashboard com estatísticas
GET    /api/pedidos/:id                # Buscar pedido específico
PATCH  /api/pedidos/:id                # Atualizar pedido completo
DELETE /api/pedidos/:id                # Excluir pedido

# Operações por fase
PATCH  /api/pedidos/:id/colheita       # Registrar colheita
PATCH  /api/pedidos/:id/precificacao   # Definir precificação
POST   /api/pedidos/:id/pagamentos     # Adicionar pagamento
```

### **Gestão Agrícola**
```
# Áreas Próprias
GET    /api/areas-agricolas            # Listar áreas próprias
POST   /api/areas-agricolas            # Criar área
PATCH  /api/areas-agricolas/:id        # Atualizar área

# Fornecedores e Áreas
GET    /api/fornecedores               # Listar fornecedores
GET    /api/areas-fornecedores         # Áreas de fornecedores

# Culturas e Frutas
GET    /api/culturas                   # Listar culturas
GET    /api/frutas                     # Catálogo de frutas
```

### **Sistema de Produção de Banana**
```
# Fitas de Banana
GET    /fitas-banana                   # Listar fitas com cores
POST   /fitas-banana                   # Criar fita (nome + cor hex)
PATCH  /fitas-banana/:id               # Atualizar fita
DELETE /fitas-banana/:id               # Excluir fita (se não em uso)

# Controle de Lotes por Área
GET    /controle-banana                # Listar todos os lotes
POST   /controle-banana                # Registrar novo lote
PATCH  /controle-banana/:id            # Atualizar lote
GET    /controle-banana/dashboard      # Dados para mapa interativo
GET    /controle-banana/areas-com-fitas # Áreas que possuem fitas
GET    /controle-banana/fitas-com-areas # Fitas agrupadas por áreas (para vinculação)

# Operações de Estoque
POST   /controle-banana/subtrair-estoque # Consumir fitas por lote específico
GET    /controle-banana/detalhes-area/:id # Detalhes de área específica
GET    /controle-banana/detalhes-fita/:id # Detalhes de fita específica

# Histórico e Auditoria
GET    /historico-fitas                # Histórico completo de operações
GET    /historico-fitas/controle/:id   # Histórico de lote específico
```

### **Configurações**
```
GET    /api/config                     # Dados da empresa
GET    /api/conta-corrente             # Contas bancárias
GET    /api/credenciais-api            # Credenciais bancárias
GET    /api/config-email               # Configurações de email
GET    /api/config-whatsapp            # Configurações do WhatsApp
```

---

## 🍌 Sistema de Fitas de Banana - Documentação Técnica

### **Arquitetura do Sistema**

O sistema de fitas implementa um controle avançado de lotes com seleção específica para garantir qualidade e rastreabilidade:

**📋 Modelos de Dados:**
- **FitaBanana**: Identificação única (nome + cor hexadecimal)
- **ControleBanana**: Lote específico (fita + área + quantidade + data)
- **HistoricoFitas**: Auditoria completa de operações
- **FrutasPedidosFitas**: Vinculação de lotes específicos a pedidos

**🔄 Lógica de Controle por Lote Específico:**
- **Seleção Direta**: Usuário escolhe exatamente qual lote usar via `controleBananaId`
- **Controle Preciso**: Cada operação trabalha com lotes específicos identificados
- **Validação de Estoque**: Estoque real = disponível + já vinculado ao pedido

**🎯 Fluxo de Operações:**

1. **Registro de Lotes**:
   ```typescript
   // Cada registro é um lote específico
   ControleBanana {
     fitaBananaId: 1,
     areaAgricolaId: 5,
     quantidadeFitas: 200,
     dataRegistro: "2024-01-15"
   }
   ```

2. **Vinculação a Pedidos**:
   ```typescript
   // Usuário seleciona lote específico via controleBananaId
   await subtrairEstoquePorControle(controleBananaId, quantidade, usuarioId);
   // Controle direto e preciso do lote escolhido
   ```

3. **Edição de Pedidos**:
   ```typescript
   // 1. Libera fitas antigas do lote específico
   await adicionarEstoquePorControle(controleBananaIdAntigo, quantidadeAntiga, usuarioId);
   // 2. Vincula fitas novas do lote específico selecionado
   await subtrairEstoquePorControle(controleBananaIdNovo, quantidadeNova, usuarioId);
   ```

**🎨 Interface Inteligente:**

- **Filtro Automático**: Remove áreas irrelevantes (zeradas e não vinculadas)
- **Indicadores Visuais**: 
  - 🟢 Verde: Área com estoque disponível
  - 🔵 Azul: Área vinculada ao pedido (mesmo sem estoque)
  - 🔴 Vermelho: Área sem estoque e não vinculada
- **Validação Dinâmica**: Considera estoque já vinculado ao pedido atual

**📊 APIs Principais:**

```typescript
// Buscar fitas agrupadas por áreas (para vinculação)
GET /controle-banana/fitas-com-areas
// Retorna todas as áreas (com e sem estoque) para permitir edição

// Consumir fitas por lote específico
POST /controle-banana/subtrair-estoque
Body: { detalhesAreas: [{fitaBananaId, areaId, quantidade, controleBananaId}] }

// Atualização inteligente de fitas (sem deletar/recriar)
await atualizarFitasInteligentemente(frutaPedidoId, fitasNovas, fitasAntigas, usuarioId, prisma);
// - Compara fitas atuais vs novas
// - Atualiza apenas quantidades que mudaram
// - Adiciona apenas fitas novas
// - Remove apenas fitas obsoletas
// - Processa estoque apenas para mudanças reais
```

**🔄 Atualização Inteligente de Fitas:**

Sistema implementa lógica avançada para edição de pedidos:
```typescript
// Comparação eficiente entre fitas antigas vs novas
const operacoes = calcularOperacoesFitas(fitasAntigas, fitasNovas);

// Operações identificadas:
// - paraAtualizar: Quantidades que mudaram
// - paraAdicionar: Fitas novas
// - paraRemover: Fitas obsoletas
// - paraLiberar: Estoque a ser liberado
// - paraSubtrair: Estoque a ser consumido

// Processamento otimizado:
// 1. Validação prévia (considera fitas já vinculadas)
// 2. Comparação inteligente (Mapas O(1))
// 3. Processamento de estoque (apenas mudanças reais)
// 4. Operações no banco (UPDATE/CREATE/DELETE específicos)
```

**🔍 Auditoria Completa:**

Cada operação gera registro no histórico:
```typescript
HistoricoFitas {
  acao: "USADO_PEDIDO" | "LIBERACAO",
  dadosAnteriores: { quantidadeFitas: 200 },
  dadosNovos: { quantidadeFitas: 150 },
  usuarioId: 1,
  createdAt: "2024-01-15T10:30:00Z"
}
```

---

## 🎯 Principais Inovações

### **1. Sistema de Pedidos Avançado**
- **10 Fases Sequenciais** com validações específicas
- **Thread-Safety** na geração de números únicos
- **Múltiplas Áreas** (próprias + fornecedores) por fruta
- **Dupla Unidade** de medida com precificação flexível
- **Múltiplos Pagamentos** com cálculo automático de status

### **2. Sistema de Tabs Inteligente**
- **Controle de Acesso** baseado no status do pedido
- **Validações Dinâmicas** por fase
- **Persistência de Dados** entre abas

### **3. Sistema de Produção de Banana Avançado**
- **Fitas Coloridas** com seletor hexadecimal e validação de formato
- **Sistema de Controle por Lote Específico** para controle inteligente de lotes
- **Mapa Interativo** Google Maps com distribuição geográfica
- **Auditoria Completa** com histórico detalhado de operações
- **Interface Inteligente** que filtra áreas irrelevantes automaticamente
- **Validação Dinâmica** de estoque considerando pedidos em edição

### **4. Componentes Reutilizáveis Personalizados**
- **MaskedDecimalInput** - Input decimal com máscara brasileira (1.234,56)
- **HectaresInput** - Input específico para áreas com sufixo "ha" automático
- **FormButton** - Botões para formulários (48px altura, alinhado com inputs)
- **PrimaryButton** - Botões de ação principais (40px altura)
- **MonetaryInput** - Input monetário com validações específicas

### **5. Sistema de Interface Avançado**
- **Tema Global** com CSS Variables automáticas
- **Paleta de Cores** padronizada (Verde #059669 como cor principal)
- **Modais Inteligentes** com headers coloridos e sistema de cards
- **Loading States** otimizados sem "flickering"
- **Sistema de Notificações** centralizado com tipos variados

---

## 🚦 Como Executar

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL 14+
- Git

### **Backend (NestJS)**
```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npx prisma generate
npx prisma db push
npx prisma db seed

# Executar em desenvolvimento
npm run start:dev
```

### **Frontend (React)**
```bash
cd frontend

# Instalar dependências
npm install

# Executar em desenvolvimento (porta 3002)
npm start
```

### **Scripts Úteis**
```bash
# Backend
npm run build                # Build de produção
npm run lint                 # Linting
npm run test                 # Testes
npm run start:prod           # Produção

# Frontend
npm run build                # Build de produção
npm test                     # Testes

# Banco de dados
npx prisma studio            # Interface visual
npx prisma migrate dev       # Nova migração
npx prisma db seed           # Popular com dados
```

---

## 🔐 Autenticação e Segurança

- **JWT Authentication** com refresh tokens
- **Rate Limiting** (10 req/min, 100 req/hora)  
- **Validação de Dados** em frontend e backend com Zod + Class Validator
- **Proteção de Rotas** com guards e interceptors
- **Senhas Criptografadas** com bcryptjs
- **Validação de Permissões** por módulo
- **Thread-Safety** em operações críticas (geração de números de pedido)

## ⚠️ Validações Críticas Específicas

### **Sistema de Pedidos**
- **Unidades de Medida**: Validação de unidades diferentes na dupla unidade
- **Áreas Exclusivas**: Uma fruta não pode vir de área própria E de fornecedor simultaneamente
- **Placeholders vs. Dados Reais**: Sistema diferencia áreas temporárias de definitivas
- **Consistência entre Tabs**: Validação de unidades de precificação vs. unidades de medida
- **Status de Pagamento Automático**: Baseado em valor recebido vs. valor final

### **Sistema de Produção de Banana**  
- **Cores Hexadecimais**: Validação de formato correto (#FF0000) para fitas de banana
- **Unicidade de Fitas**: Nomes de fitas devem ser únicos globalmente
- **Proteção contra Exclusão**: Fitas em uso não podem ser removidas
- **Seleção Direta**: Usuário escolhe exatamente qual lote usar na vinculação
- **Controle Preciso**: Operações trabalham com lotes específicos identificados
- **Validação de Estoque**: Verificação de disponibilidade antes de operações
- **Atualização Inteligente**: Preserva vinculações existentes durante edições
- **Auditoria Automática**: Registro de todas as operações com dados antes/depois

### **Controle de Qualidade**
- **Relacionamentos N:N Complexos**: Validação de integridade em múltiplas tabelas
- **Auditoria Automática**: Registro de todas as operações críticas
- **Cálculos Monetários**: Precisão decimal em valores financeiros

---

## 📊 Status do Projeto

### **✅ Implementado**
- [x] Sistema completo de autenticação
- [x] Sistema avançado de pedidos (10 fases)
- [x] Dashboard de pedidos com cards por status
- [x] Gestão de áreas agrícolas próprias
- [x] Gestão de fornecedores e suas áreas
- [x] Catálogo completo de frutas
- [x] Sistema de múltiplas áreas por fruta
- [x] Sistema de múltiplas fitas por fruta com controle de lotes
- [x] Controle de produção de banana com sistema de lote específico
- [x] Sistema de auditoria completo para fitas
- [x] Interface inteligente de vinculação de fitas
- [x] Múltiplos pagamentos por pedido
- [x] Sistema de notificações em tempo real
- [x] Configurações completas do sistema
- [x] Componentes reutilizáveis
- [x] Tema global com CSS variables

### **🔄 Em Desenvolvimento**
- [ ] Relatórios avançados
- [ ] Integração bancária automática
- [ ] Aplicativo mobile

### **📅 Roadmap**
- [ ] Sistema de estoque
- [ ] Integração com marketplace
- [ ] BI e Analytics avançado
- [ ] API pública

---

## 📝 Documentação

- **CLAUDE.md**: Documentação técnica completa
- **Prisma Schema**: Documentação do banco de dados
- **Swagger**: Documentação da API (disponível em /api)
- **Comentários no Código**: Documentação inline

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 Contato

Sistema desenvolvido especificamente para gestão agrícola de frutas, com foco na produtividade e controle de qualidade do processo completo.

**Tecnologias:** React 18 + NestJS + PostgreSQL + Prisma
**Versão:** 1.0.0
**Última Atualização:** Setembro 2025