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
- **Gestão de Turmas de Colheita** com controle de custos por pedido
- **Gestão Financeira** com múltiplos pagamentos e métodos
- **Clientes e Fornecedores** com dados fiscais completos

---

## 🚀 Funcionalidades Principais

### 📋 **Sistema de Pedidos (Core do Sistema)**

**🔄 Fluxo de 10 Fases Sequenciais:**
1. **🆕 PEDIDO_CRIADO** → Dados básicos (cliente, frutas, quantidades previstas)
2. **⏳ AGUARDANDO_COLHEITA** → Aguarda data prevista de colheita  
3. **🚜 COLHEITA_REALIZADA** → Quantidades reais + áreas + fitas + dados de frete + **mão de obra**
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
- **Visualização por Cliente**: Modal detalhado com estatísticas e filtros avançados
- **Integração com Mão de Obra**: Vinculação automática de turmas de colheita aos pedidos
- **Dados Complementares**: Campos específicos para clientes indústria (datas, peso, NF)

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
- **Classificação**: Tipo de cliente (Comum/Indústria) com campos específicos
- **Histórico**: Integração com pedidos

### 👥 **Sistema de Turmas de Colheita**

**🎯 Gestão de Equipes de Colheita:**
- **Cadastro de Turmas**: Nome do colhedor/turma, chave PIX, observações, data de cadastro automática
- **Controle de Custos**: Vinculação de turmas a pedidos com custos específicos por fruta
- **Validação Inteligente**: Chaves PIX com validação automática (e-mail, CPF, CNPJ, telefone)
- **Formatação Visual**: Exibição formatada na tabela com detecção automática de tipo
- **Separação de Responsabilidades**: Cadastro de turmas separado da vinculação com pedidos
- **Estatísticas Avançadas**: Dashboard completo com gráficos temporais e análises detalhadas

**🔄 Arquitetura de Dados:**
- **TurmaColheita**: Cadastro básico da turma (nome, PIX, observações, data de cadastro)
- **TurmaColheitaPedidoCusto**: Vinculação com pedidos (turma + pedido + fruta + quantidade + valor + status de pagamento)
- **Relacionamento 1:N**: Uma turma pode ter múltiplas custos de colheita
- **Controle de Custos**: Valor pago pela custo de colheita por pedido específico
- **Agregação de Dados**: Cálculo automático de totais por turma

**📊 Funcionalidades Principais:**
- **CRUD Completo**: Criar, editar, visualizar e excluir turmas
- **Validação de Chave PIX**: E-mail rigoroso, documentos numéricos (10-14 dígitos)
- **Formatação Automática**: Máscaras visuais para telefone, CPF, CNPJ na tabela
- **Limpeza de Dados**: Envio de dados padronizados ao backend
- **Interface Intuitiva**: Formulários limpos e tabelas organizadas com separadores visuais
- **Ordenação Inteligente**: Tabela com sorting por nome, quantidades e valores
- **Padrão Visual Consistente**: Headers verdes, bordas e espaçamentos padronizados

**📈 Sistema de Estatísticas Avançado:**
- **Modal de Estatísticas**: Visualização detalhada por turma com gráficos interativos
- **Gráfico de Linhas Temporal**: Evolução de quantidades e valores ao longo do tempo
- **Seletor de Período**: 3, 6, 9, 12 meses com componente personalizado
- **Panning e Zoom**: Navegação interativa nos gráficos com ferramentas padrão
- **Múltiplas Séries**: Quantidade colhida, valor total e valor pago em um único gráfico
- **Eixos Duplos**: Quantidade (esquerda) e valores monetários (direita)
- **Tooltips Informativos**: Formatação brasileira para valores e quantidades
- **Animações Suaves**: Transições fluidas e efeitos visuais profissionais
- **Tabela de Detalhes Completa**: Colunas para pedido, data, fruta, quantidade, valor, status e observações
- **Coluna de Observações**: Ícone de balão com tooltip para visualizar observações completas
- **Coluna de Data**: Data de colheita formatada em português brasileiro

**📊 Dados Agregados na Tabela:**
- **Total Colhido**: Quantidade total com breakdown por unidade de medida
- **Valor Total**: Valor total da turma com valor pago como informação secundária
- **Valor Pago**: Total pago pela turma (diferenciação visual em verde)
- **Resumo por Unidade**: Detalhamento de quantidades por unidade de medida
- **Contadores**: Total de pedidos e frutas trabalhadas pela turma
- **Status de Pagamento**: Controle de quais custos foram efetivamente pagos

**🎨 Interface e Experiência:**
- **Cards Padronizados**: Headers verdes com ícones temáticos
- **Gráficos Responsivos**: Altura fixa (350px) com scroll interno quando necessário
- **Cores do Sistema**: Paleta consistente (#059669, #1890ff, #52c41a, #fa8c16)
- **Componentes Personalizados**: MiniSelectPersonalizavel para seletor de período
- **Loading States**: Estados de carregamento com spinners e mensagens informativas
- **Empty States**: Mensagens quando não há dados disponíveis

### 🍌 **Sistema de Controle de Banana (Sistema Avançado de Fitas)**

**🎯 Sistema de Controle por Lote Específico:**
- **Fitas Coloridas**: Cadastro com cores hexadecimais (#FF0000) e nomes únicos
- **Controle por Lote**: Cada registro de fitas é um lote específico com data de registro
- **Seleção Direta**: Usuário escolhe exatamente qual lote usar via `controleBananaId`
- **Controle Preciso**: Operações trabalham com lotes específicos identificados
- **Mapa Interativo**: Google Maps mostrando distribuição geográfica das áreas
- **Calendário de Colheita**: Visualização semanal com fases de maturação e previsões
- **Sistema de Fases Inteligente**: 4 fases com intervalos otimizados para melhor visibilidade
- **Modal de Detalhes Avançado**: Previsão de colheita por fita com indicador de atraso
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
- **Calendário Visual**: Grid responsivo com semanas coloridas por fase de maturação
- **Destaque da Semana Atual**: Visual diferenciado com escala, sombra e animações
- **Contador de Fitas por Status**: Exibição da quantidade de fitas prontas para colheita
- **Tooltips Informativos**: Detalhes por área com agrupamento inteligente de status
- **Previsão de Colheita**: Sistema de previsão com datas e semanas de colheita
- **Modal de Detalhes por Semana**: Visualização completa com previsões individuais e indicadores de atraso

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
- **Gráficos:** ReactApexChart, ApexCharts, Chart.js, Recharts
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
│   │   │   ├── PedidosDashboard.js     # Dashboard de pedidos (OTIMIZADO)
│   │   │   ├── AreasAgricolas.js       # Gestão de áreas próprias
│   │   │   ├── Frutas.js               # Catálogo de frutas
│   │   │   ├── Clientes.js             # Gestão de clientes
│   │   │   ├── FornecedoresPage.js     # Gestão de fornecedores
│   │   │   ├── Configuracoes.js        # Configurações do sistema
│   │   │   ├── Login/                  # Página de login
│   │   │   ├── TurmaColheita.js        # Gestão de turmas de colheita
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
│   │   │   │   ├── LancarPagamentosModal.js # Modal de pagamentos (OTIMIZADO)
│   │   │   │   └── tabs/               # Sistema de tabs
│   │   │   ├── common/                 # Componentes reutilizáveis
│   │   │   │   ├── buttons/            # Botões personalizados
│   │   │   │   ├── inputs/             # Inputs especializados
│   │   │   │   └── search/             # Componentes de busca
│   │   │   ├── producao/               # Componentes de produção
│   │   │   ├── turma-colheita/         # Componentes de turmas de colheita
│   │   │   │   ├── TurmaColheitaForm.js        # Formulário de turma
│   │   │   │   ├── TurmaColheitaTable.js       # Tabela de turmas
│   │   │   │   └── AddEditTurmaColheitaDialog.js # Modal de edição
│   │   │   └── areas/                  # Componentes de áreas
│   │   ├── contexts/                   # Contextos React
│   │   ├── hooks/                      # Custom hooks (NOVOS HOOKS OTIMIZADOS)
│   │   │   ├── useClientesCache.js     # Cache otimizado de clientes
│   │   │   ├── useDashboardOptimized.js # Dashboard com performance otimizada
│   │   │   ├── useSmartDashboardReload.js # Sistema de reload inteligente por operação
│   │   │   ├── useFormValidation.js    # Validação de formulários memoizada
│   │   │   └── useDebounce.js          # Hook genérico de debounce
│   │   ├── utils/                      # Utilitários (OTIMIZADOS)
│   │   │   ├── validation.js           # Sistema de validação robusto
│   │   │   ├── errorHandling.js        # Tratamento padronizado de erros
│   │   │   ├── formatters.js           # Formatadores existentes
│   │   │   └── dateUtils.js            # Utilitários de data
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
│   │   ├── turma-colheita/             # Sistema de turmas de colheita
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
- **Pedido** - Core do sistema com 10 status + campos específicos para indústria
- **FrutasPedidos** - Relacionamento N:N com dupla unidade
- **FrutasPedidosAreas** - Múltiplas áreas por fruta
- **FrutasPedidosFitas** - Múltiplas fitas por fruta
- **PagamentosPedidos** - Múltiplos pagamentos por pedido
- **AreaAgricola** - Áreas próprias categorizadas
- **AreaFornecedor** - Áreas de fornecedores
- **Cliente** - Dados fiscais e comerciais + classificação indústria
- **Fruta** - Catálogo com categorias
- **FitaBanana** - Fitas com cores hexadecimais e nomes únicos
- **ControleBanana** - Lotes de fitas por área (controle por lote específico)
- **HistoricoFitas** - Auditoria completa de operações
- **FrutasPedidosFitas** - Vinculação de lotes específicos a pedidos
- **TurmaColheita** - Cadastro de turmas de colheita (nome, PIX, observações)
- **TurmaColheitaPedidoCusto** - Vinculação de turmas a pedidos com custos específicos

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
GET    /api/pedidos/cliente/:clienteId # Buscar pedidos por cliente
GET    /api/pedidos/:id                # Buscar pedido específico
PATCH  /api/pedidos/:id                # Atualizar pedido completo
DELETE /api/pedidos/:id                # Excluir pedido

# Busca Inteligente
GET    /api/pedidos/busca-inteligente  # Busca inteligente com 9 categorias

# Operações por fase
PATCH  /api/pedidos/:id/colheita       # Registrar colheita (inclui mão de obra)
PATCH  /api/pedidos/:id/precificacao   # Definir precificação (inclui dados indústria)
POST   /api/pedidos/:id/pagamentos     # Adicionar pagamento

# Integração com Mão de Obra (Colheita)
GET    /api/turma-colheita/colheita-pedido/pedido/:pedidoId  # Buscar mão de obra do pedido
POST   /api/turma-colheita/custo-colheita                    # Criar custo de colheita
PATCH  /api/turma-colheita/custo-colheita/:id                # Atualizar custo de colheita
DELETE /api/turma-colheita/custo-colheita/:id                # Excluir custo de colheita
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

# Gestão de Clientes
GET    /api/clientes                   # Listar clientes
GET    /api/clientes/ativos            # Listar apenas clientes ativos
POST   /api/clientes                   # Criar cliente
GET    /api/clientes/:id               # Buscar cliente específico
PATCH  /api/clientes/:id               # Atualizar cliente (inclui classificação indústria)
DELETE /api/clientes/:id               # Excluir cliente

# Pedidos por Cliente (ATUALIZADO)
GET    /api/pedidos/cliente/:clienteId # Buscar pedidos por cliente com filtros por status
# Query params: ?status=AGUARDANDO_PAGAMENTO,PAGAMENTO_PARCIAL
# Retorna: { data: PedidoResponseDto[], total: number, statusFiltrados?: string[] }
```

### **Sistema de Turmas de Colheita**
```
# Turmas de Colheita
GET    /api/turma-colheita             # Listar turmas de colheita com estatísticas agregadas
POST   /api/turma-colheita             # Criar turma de colheita
GET    /api/turma-colheita/:id         # Buscar turma específica
PATCH  /api/turma-colheita/:id         # Atualizar turma
DELETE /api/turma-colheita/:id         # Excluir turma

# Estatísticas Avançadas
GET    /api/turma-colheita/:id/estatisticas     # Estatísticas detalhadas da turma
# Retorna: totalGeral, totaisPorUnidade, detalhes (dados para gráficos)
# Inclui: observacoes, dataColheita, pedido, fruta, quantidade, valor, status

# Colheitas de Pedidos
POST   /api/turma-colheita/custo-colheita        # Criar colheita de pedido
GET    /api/turma-colheita/custo-colheita        # Listar colheitas
GET    /api/turma-colheita/custo-colheita/:id    # Buscar colheita específica
PATCH  /api/turma-colheita/custo-colheita/:id    # Atualizar colheita
DELETE /api/turma-colheita/custo-colheita/:id    # Excluir colheita
GET    /api/turma-colheita/custo-colheita/pedido/:pedidoId  # Colheitas por pedido
GET    /api/turma-colheita/custo-colheita/turma/:turmaId    # Colheitas por turma
```

### **Integração de Componentes de Colheita**

**🔄 Componentes Frontend Integrados:**
- **ColheitaModal.js**: Modal para registro de colheita com integração automática de mão de obra
- **ColheitaTab.js**: Aba de colheita no sistema de edição de pedidos com carregamento dinâmico
- **EditarPedidoDialog.js**: Dialog principal com carregamento e salvamento de dados de mão de obra

**📊 Funcionalidades de Integração:**
- **Carregamento Automático**: Dados de mão de obra carregados automaticamente na edição
- **Salvamento Inteligente**: Criação/atualização/remoção automática de custos de colheita
- **Validação Global**: Validação de fitas considerando todas as frutas do pedido
- **Sincronização de Dados**: Atualização em tempo real entre componentes
- **Gestão de Estados**: Controle de loading, erros e sucessos integrado

### **Sistema de Busca Inteligente Avançado**

**🔍 Busca em Tempo Real com 9 Categorias:**
- **API Integrada**: `/api/pedidos/busca-inteligente` com debounce de 300ms
- **Endpoint Atualizado**: `/api/pedidos/cliente/:id` com suporte a filtros por status
- **Mínimo 2 Caracteres**: Inicia busca automática com validação
- **Sugestões Categorizadas**: Dropdown inteligente com ícones temáticos
- **Navegação por Teclado**: Setas, Enter, Escape para controle total

**📋 Tipos de Busca Suportados:**
1. **📋 Número do Pedido** - Busca por `numeroPedido` com status e cliente
2. **👤 Cliente** - Nome, razão social, CPF, CNPJ com contador de pedidos
3. **🚛 Motorista** - Campo `nomeMotorista` com frequência de uso
4. **🚗 Placas** - Primária e secundária com contador de pedidos
5. **💳 Vale/Referência** - Campo `referenciaExterna` com método de pagamento
6. **🏭 Fornecedor** - Nome com documento e contador de áreas
7. **🌾 Áreas** - Próprias e de fornecedores com metadados completos
8. **🍎 Frutas** - Nome e código com categoria e contador de pedidos
9. **⚖️ Pesagem** - Campo `pesagem` com contexto do pedido

**🎨 Interface Visual Avançada:**
- **Ícones Dinâmicos**: Específicos por método de pagamento (PIX, Boleto, Transferência, Dinheiro, Cheque)
- **Estados Visuais**: Loading spinner, sucesso (✓), erro (⚠️), sem resultados (🔍)
- **Metadata Rica**: IDs, contadores, informações contextuais para cada sugestão
- **Deduplicação Inteligente**: Remove sugestões duplicadas automaticamente
- **Limite Otimizado**: Máximo 10 sugestões por busca para performance

**🔄 Sistema de Filtros Integrado:**
- **Filtros Ativos**: Tags removíveis com resumo visual em tempo real
- **Múltiplos Filtros**: Combinação de busca + status + período
- **Limpeza Inteligente**: Botão para resetar todos os filtros
- **Persistência**: Filtros mantidos durante navegação entre páginas

### **Sistema de Visualização de Pedidos por Cliente**

**📊 Modal PedidosClienteModal.js:**
- **Estatísticas Completas**: Total de pedidos, ativos, finalizados e valores
- **Tabela Detalhada**: Lista completa de pedidos com informações essenciais
- **Filtros Avançados**: Busca por número, observações e status
- **Ordenação Inteligente**: Por data, valor, status ou número do pedido
- **Paginação Otimizada**: Controle de itens por página com navegação rápida

**🎯 Funcionalidades Específicas:**
- **Resumo Global**: Cards com estatísticas do cliente
- **Busca Inteligente**: Filtro por número do pedido ou observações
- **Filtro por Status**: Seleção específica de status dos pedidos
- **Ordenação Flexível**: Crescente/decrescente por qualquer campo
- **Formatação de Dados**: Valores monetários e datas em português brasileiro
- **Status Visuais**: Tags coloridas com ícones para identificação rápida

### **Sistema de Dados Complementares para Clientes Indústria**

**🏭 Funcionalidades Específicas para Indústria:**
- **Classificação de Cliente**: Campo `industria` (boolean) na tabela de clientes
- **Interface Visual**: Switch "Comum/Indústria" no formulário de clientes
- **Tabela de Clientes**: Coluna "Tipo" com tags visuais (Verde: Indústria, Cinza: Comum)
- **Renderização Condicional**: Seções específicas aparecem apenas para clientes indústria

**📋 Campos Complementares nos Pedidos:**
- **Data de Entrada** (`indDataEntrada`): Data de entrada do produto (sem horário)
- **Data de Descarga** (`indDataDescarga`): Data de descarga do produto (sem horário)
- **Peso Médio** (`indPesoMedio`): Peso médio em decimal (ex: 1250.50 KG)
- **Média em Mililitros** (`indMediaMililitro`): Média em mililitros (ex: 500.75 ML)
- **Número da Nota Fiscal** (`indNumeroNf`): Número inteiro da nota fiscal (ex: 123456)

**🎨 Interface de Dados Complementares:**
- **Seção "Dados Complementares"**: Aparece em modais de precificação e visualização
- **Layout Responsivo**: Campos organizados em linha única com prioridade para datas
- **Validação Específica**: Campos opcionais com validações apropriadas (datas, números)
- **Formatação Visual**: Cards coloridos com ícones temáticos e formatação brasileira
- **Integração Completa**: Funciona em PrecificacaoModal.js, PrecificacaoTab.js e VisualizarPedidoModal.js

**🔄 Fluxo de Dados:**
- **Criação**: Campos preenchidos durante a precificação para clientes indústria
- **Edição**: Atualização via sistema de tabs ou modal de precificação
- **Visualização**: Exibição organizada em modal de visualização com cards temáticos
- **Backend**: DTOs específicos (UpdatePrecificacaoDto, UpdatePedidoCompletoDto) com validações

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
GET    /controle-banana/dashboard      # Dados para mapa interativo e calendário
GET    /controle-banana/areas-com-fitas # Áreas que possuem fitas
GET    /controle-banana/fitas-com-areas # Fitas agrupadas por áreas (para vinculação)

# Operações de Estoque
POST   /controle-banana/subtrair-estoque # Consumir fitas por lote específico
GET    /controle-banana/detalhes-area/:id # Detalhes de área específica
GET    /controle-banana/detalhes-fita/:id # Detalhes de fita específica

# Calendário de Colheita
GET    /controle-banana/calendario     # Dados para calendário semanal
GET    /controle-banana/previsoes      # Previsões de colheita por semana

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

## ⚡ Otimizações de Performance Implementadas

### **🚀 Sistema Otimizado de Dashboard**

**📊 Hooks Customizados para Performance:**
- **useDashboardOptimized**: Hook com cache inteligente, debounce e cancelamento de requisições
- **useClientesCache**: Cache de clientes com TTL de 5 minutos e invalidação automática
- **useSmartDashboardReload**: Sistema de reload inteligente por tipo de operação
- **useFormValidation**: Validação memoizada para formulários complexos
- **useDebounce**: Hook genérico para debounce de valores e callbacks

**🔧 Otimizações Técnicas:**
- **Cache Inteligente**: TTL de 30 segundos para dados do dashboard
- **Cancelamento de Requisições**: AbortController para evitar race conditions com tratamento correto de CanceledError
- **Validação Robusta**: Schema validation com tratamento de erros padronizado
- **Estados Otimizados**: Redução de re-renderizações desnecessárias
- **Cleanup Automático**: Limpeza de recursos ao desmontar componentes
- **Reload Inteligente**: Atualização específica baseada no tipo de operação realizada

### **💡 Sistema de Validação Avançado**

**📋 Validação de Dados:**
- **validatePedidosResponse**: Normalização robusta de respostas da API
- **validateDashboardResponse**: Validação específica para dados do dashboard
- **validateClientesResponse**: Tratamento consistente de dados de clientes
- **validateFormData**: Schema validation genérico para formulários

**🛡️ Tratamento de Erros Padronizado:**
- **handleApiError**: Handler centralizado para erros de API
- **handleNetworkError**: Tratamento específico para erros de rede
- **handleValidationError**: Exibição user-friendly de erros de validação
- **safeApiCall**: Wrapper para requisições com tratamento automático

### **🎯 Melhorias no Modal de Pagamentos**

**🔄 Otimizações Implementadas:**
- **Remoção do Anti-pattern**: Eliminação do `forceUpdate`
- **Hooks de Validação**: Validação em tempo real com memoização
- **Endpoints Atualizados**: Uso correto de filtros por status
- **Performance**: Redução de cálculos desnecessários
- **UX Melhorada**: Feedback visual mais responsivo
- **Sistema de Reload Inteligente**: Atualização específica por tipo de operação

### **🎯 Sistema de Reload Inteligente**

**📋 Hook useSmartDashboardReload:**
- **Reload Específico por Modal**: Cada operação atualiza apenas seções relevantes
- **Mapeamento de Seções**: Novo pedido → AGUARDANDO_COLHEITA, Colheita → COLHEITA_REALIZADA + AGUARDANDO_PRECIFICACAO
- **Otimização de Performance**: Evita reload completo desnecessário do dashboard
- **Integração Transparente**: Funciona automaticamente com todos os modais existentes
- **Tratamento de Erros**: Funciona mesmo quando `atualizarDadosOtimizado` não está disponível

**🔄 Regras de Reload Inteligente:**
- **NovoPedidoModal** → atualizar seção AGUARDANDO_COLHEITA
- **ColheitaModal** → atualizar seções COLHEITA_REALIZADA e AGUARDANDO_PRECIFICACAO
- **PrecificacaoModal** → atualizar seções PRECIFICACAO_REALIZADA e AGUARDANDO_PAGAMENTO
- **PagamentoModal** → atualizar seções AGUARDANDO_PAGAMENTO, PAGAMENTO_PARCIAL e PEDIDO_FINALIZADO
- **LancarPagamentosModal** → atualizar seções de pagamentos e finalizados

**🛡️ Tratamento de Cancelamento de Requisições:**
- **AbortController Otimizado**: Cancelamento correto de requisições anteriores
- **Tratamento de CanceledError**: Supressão de logs de erro para cancelamentos normais
- **Validação de Função**: Verificação de disponibilidade antes de executar reload
- **Logging Inteligente**: Console logs informativos para debugging

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

**📅 Sistema de Fases de Colheita:**

Sistema inteligente de previsão com 4 fases otimizadas:
```typescript
// Fases de maturação com intervalos ajustados
const fasesColheita = {
  maturacao: { dias: '0-99', cor: '#dbeafe', icone: '🌱' },
  colheita: { dias: '100-115', cor: '#dcfce7', icone: '🍌' },
  alerta: { dias: '116-125', cor: '#fef3c7', icone: '⚠️' },
  risco: { dias: '+125', cor: '#fecaca', icone: '🚨' }
};
```

**🎨 Calendário Visual:**
- **Grid Responsivo**: Semanas organizadas em grid adaptável
- **Cores por Fase**: Cada semana colorida conforme status de maturação
- **Semana Atual Destacada**: Fundo verde suave, borda 4px, escala 1.02x com animações
- **Contador de Fitas**: Badge mostrando quantidade de fitas prontas para colheita
- **Efeitos Visuais**: Animações shimmer, bounce e pulse para status de colheita
- **Tooltips Informativos**: Detalhes agrupados por área e status
- **Previsão Inteligente**: Cálculo automático de datas de colheita
- **Modal de Detalhamento**: Clique nas semanas para ver detalhes completos
- **Indicadores de Atraso**: Tags vermelhas "ATRASO" quando semana atual > previsão
- **Navegação por Ano**: Controles para visualizar diferentes anos

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
- **Calendário de Colheita** com visualização semanal e fases de maturação
- **Sistema de Fases Otimizado** com intervalos ajustados para melhor visibilidade
- **Previsão de Colheita** com datas e semanas específicas (100-125 dias)
- **Modal Detalhado por Semana** com previsões individuais e alertas de atraso
- **Tooltips Inteligentes** com agrupamento por área e status
- **Auditoria Completa** com histórico detalhado de operações
- **Interface Inteligente** que filtra áreas irrelevantes automaticamente
- **Validação Dinâmica** de estoque considerando pedidos em edição

### **4. Componentes Reutilizáveis Personalizados**
- **MaskedDecimalInput** - Input decimal com máscara brasileira (1.234,56)
- **HectaresInput** - Input específico para áreas com sufixo "ha" automático
- **FormButton** - Botões para formulários (48px altura, alinhado com inputs)
- **PrimaryButton** - Botões de ação principais (40px altura)
- **MonetaryInput** - Input monetário com validações específicas
- **MiniSelectPersonalizavel** - Select customizado com ícones, loading states e estilização flexível

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
- **Fases de Maturação**: Validação de intervalos de dias (0-99, 100-115, 116-125, +125)
- **Previsão de Colheita**: Cálculo preciso de datas baseado em 100-125 dias
- **Consistência de Status**: Sincronização entre calendário e detalhamento

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
- [x] Sistema de turmas de colheita com controle de custos
- [x] Validação inteligente de chaves PIX (e-mail, CPF, CNPJ, telefone)
- [x] Formatação automática e limpeza de dados para backend
- [x] Sistema de estatísticas avançado com gráficos temporais
- [x] Modal de estatísticas com ReactApexChart e panning/zoom
- [x] Dados agregados na tabela (total colhido, valor total, valor pago)
- [x] Seletor de período personalizado com MiniSelectPersonalizavel
- [x] Ordenação inteligente na tabela de turmas
- [x] Padrão visual consistente com headers verdes e separadores
- [x] Tabela de detalhes completa com colunas de data e observações
- [x] Sistema de tooltips para observações com ícone de balão
- [x] Formatação de data em português brasileiro
- [x] Backend otimizado com campo observações no mapeamento de detalhes
- [x] Integração completa entre ColheitaModal.js e backend de turmas
- [x] Integração completa entre ColheitaTab.js e sistema de edição de pedidos
- [x] Integração completa entre EditarPedidoDialog.js e carregamento de mão de obra
- [x] Sistema de salvamento inteligente de custos de colheita (CRUD automático)
- [x] Validação global de fitas integrada nos componentes de colheita
- [x] Calendário de colheita com visualização semanal
- [x] Sistema de fases de maturação otimizado (0-99, 100-115, 116-125, +125 dias)
- [x] Previsão de colheita com datas e semanas específicas
- [x] Modal detalhado por semana com previsões individuais
- [x] Sistema de indicadores de atraso (tags vermelhas quando semana atual > previsão)
- [x] Interface visual aprimorada com animações e contador de fitas por semana
- [x] Tooltips informativos com agrupamento inteligente
- [x] Múltiplos pagamentos por pedido
- [x] Sistema de notificações em tempo real
- [x] Configurações completas do sistema
- [x] Componentes reutilizáveis
- [x] Tema global com CSS variables
- [x] Sistema de classificação de clientes (Comum/Indústria)
- [x] Campos complementares para clientes indústria (datas, peso, NF)
- [x] Interface visual para dados complementares em modais de precificação
- [x] Integração completa entre frontend e backend para campos de indústria
- [x] Visualização organizada de dados complementares em modal de visualização
- [x] Sistema de busca inteligente avançado com 9 categorias
- [x] Interface visual com dropdown categorizado e ícones dinâmicos
- [x] Sistema de filtros integrado com tags removíveis e persistência
- [x] API de busca inteligente com debounce e otimizações de performance
- [x] Sistema otimizado de dashboard com hooks customizados e cache inteligente
- [x] Validação robusta de dados com schema validation
- [x] Tratamento padronizado de erros com handlers centralizados
- [x] Modal de pagamentos otimizado com validação em tempo real
- [x] Endpoints atualizados com suporte a filtros avançados
- [x] Sistema de reload inteligente com hook useSmartDashboardReload
- [x] Tratamento correto de cancelamento de requisições (CanceledError)
- [x] Otimização de performance com atualizações específicas por tipo de operação
- [x] Integração transparente com todos os modais do sistema de pedidos

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