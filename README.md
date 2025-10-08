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

**🎨 Sistema de Cores de Status Centralizado:**
- **PEDIDO_CRIADO** → `#1890ff` (Azul) - Pedidos recém-criados
- **AGUARDANDO_COLHEITA** → `#1890ff` (Azul) - Aguardando colheita
- **COLHEITA_REALIZADA** → `#722ed1` (Roxo) - Colheita concluída
- **AGUARDANDO_PRECIFICACAO** → `#722ed1` (Roxo) - Aguardando precificação
- **PRECIFICACAO_REALIZADA** → `#722ed1` (Roxo) - Precificação concluída
- **AGUARDANDO_PAGAMENTO** → `#faad14` (Amarelo) - Aguardando pagamento
- **PAGAMENTO_PARCIAL** → `#faad14` (Amarelo) - Pagamento parcial
- **PAGAMENTO_REALIZADO** → `#52c41a` (Verde) - Pagamento completo
- **PEDIDO_FINALIZADO** → `#52c41a` (Verde) - Processo finalizado
- **CANCELADO** → `#ff4d4f` (Vermelho) - Pedido cancelado

**🎯 Implementação Centralizada:**
- **Tema Global**: Cores definidas em `theme.js` para modo claro e escuro
- **Hook Personalizado**: `usePedidoStatusColors` para acesso fácil às cores
- **Consistência Total**: Mesmas cores em dashboard, tabelas, modais e relatórios
- **Manutenção Simplificada**: Alteração centralizada reflete em toda a aplicação
- **Suporte a Temas**: Cores adaptadas automaticamente para modo claro/escuro

**📚 Como Usar:**
```javascript
import usePedidoStatusColors from '../../hooks/usePedidoStatusColors';

const { getStatusColor, getStatusConfig } = usePedidoStatusColors();

// Obter cor específica
const cor = getStatusColor('PEDIDO_CRIADO'); // "#1890ff"

// Obter configuração completa
const config = getStatusConfig('AGUARDANDO_COLHEITA'); 
// { color: "#1890ff", text: "Aguardando Colheita" }
```

**🎯 Características Avançadas:**
- **Dupla Unidade de Medida**: Por fruta (ex: 1000 KG + 50 CX)
- **Múltiplas Áreas de Origem**: Próprias + fornecedores por fruta
- **Múltiplas Fitas**: Sistema especial para banana com cores hexadecimais
- **Precificação Flexível**: Pode usar qualquer unidade de medida da fruta
- **Quantidade Precificada**: Campo específico para relatórios (independente da unidade usada)
- **Lógica Inteligente de Quantidade Colhida**: Mostra quantidade na unidade de precificação escolhida com detecção automática de unidade
- **Interface de Precificação Completa**: 6 colunas organizadas (Fruta, Prevista, Colhida, Quant. Precificada, Valor Unit., Total)
- **Toggle de Unidade de Medida**: Alternância dinâmica entre unidades de medida com recálculo automático
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

#### **🎨 Sistema de Cores por Categoria de Área**
As cores das categorias de área estão centralizadas no `theme.js` e devem ser alteradas lá se necessário:
- **COLONO** → Verde - Áreas de colonos
- **TECNICO** → Azul - Áreas técnicas  
- **EMPRESARIAL** → Roxo - Áreas empresariais
- **ADJACENTE** → Laranja - Áreas adjacentes

### 🔗 **Sistema de Relacionamentos Cultura-Fruta-Área**

**🎯 Nova Arquitetura de Relacionamentos:**
- **Fruta → Cultura**: Relação obrigatória (substitui sistema de categorias)
- **Área Fornecedor → Cultura**: Relação opcional para controle de plantio
- **Filtragem Inteligente**: Áreas de fornecedores filtradas pela cultura da fruta selecionada

**📊 Funcionalidades Implementadas:**
- **Cadastro de Frutas**: Select de culturas obrigatório
- **Vinculação de Áreas**: Áreas de fornecedores podem ser vinculadas a culturas específicas
- **Controle de Qualidade**: Sistema filtra automaticamente áreas compatíveis
- **Integração com Pedidos**: Vincular áreas baseadas na cultura da fruta do pedido

**🔄 Fluxo de Funcionamento:**
1. **Cadastro de Cultura**: Criar cultura (ex: "Banana", "Coco")
2. **Cadastro de Fruta**: Vincular fruta à cultura obrigatoriamente
3. **Cadastro de Área**: Área de fornecedor pode ser vinculada à cultura
4. **Pedido**: Sistema filtra áreas baseadas na cultura da fruta selecionada

### 🍎 **Catálogo de Frutas**
- **Vinculação com Culturas**: Frutas obrigatoriamente vinculadas a culturas (substitui categorias)
- **Unidades Duplas**: Suporte a duas unidades por fruta
- **Integração**: Direto com sistema de pedidos e controle de áreas
- **Filtragem Inteligente**: Áreas de fornecedores filtradas pela cultura da fruta

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

**💰 Sistema de Pagamentos de Turmas:**
- **Modal PagamentosPendentesModal**: Visualização e processamento de pagamentos pendentes por turma
- **Modal PagamentosEfetuadosModal**: Visualização completa de todos os pagamentos efetuados de uma turma específica
- **Integração com Dashboard**: Acesso direto aos modais via cards de pagamentos no dashboard principal
- **Responsividade Completa**: Layout otimizado para mobile e desktop com scroll horizontal em tabelas
- **Cores Consistentes**: Headers verdes (#059669) e elementos de sucesso (#52c41a) seguindo padrão do sistema
- **Dados Agregados**: Estatísticas de total pago, quantidade de colheitas, pedidos e frutas por turma
- **Tabela Detalhada**: Listagem completa de pagamentos com informações de pedido, cliente, fruta, quantidade e valores
- **Agrupamento por Data**: Pagamentos organizados por data de pagamento com resumos consolidados
- **Endpoint Específico**: `/api/turma-colheita/:id/pagamentos-efetuados` para buscar todos os pagamentos de uma turma

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

### **📅 Sistema de Datas e Fuso Horário**

**🎯 Configuração Atual:**
- **Plugin Oficial**: `@ant-design/moment-webpack-plugin` para reverter do Day.js para Moment.js
- **Biblioteca de Datas**: Moment.js para parsing, validação e formatação de datas
- **Componente Customizado**: `MaskedDatePicker` - adiciona barras automaticamente durante digitação
- **Formatação Padrão**: `YYYY-MM-DD HH:mm:ss` (com horário de meio-dia para evitar problemas de fuso)

**🔧 Padrão de Formatação Implementado:**
```javascript
// ✅ Formato correto para salvar no banco (evita problemas de fuso horário)
date.startOf('day').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss')
// Resultado: "2025-08-06 12:00:00" (meio-dia)

// ❌ Formato antigo que causava problemas
date.format('YYYY-MM-DD')
// Resultado: "2025-08-06 00:00:00" (meia-noite UTC - problema de fuso)
```

**⚠️ Problema de Fuso Horário Resolvido:**
- **Sintoma**: Data salva como 06/08/2025 aparecia como 05/08/2025 ao editar
- **Causa**: Salvamento em meia-noite UTC causava diferença de 1 dia no fuso brasileiro
- **Solução**: Salvamento em meio-dia (12:00) evita problemas de fuso horário
- **Componentes Corrigidos**: Todos os DatePickers do sistema (pedidos, pagamentos, precificação)

**📋 Validação de Datas:**
```javascript
// ✅ Validação correta com Moment.js
if (!value.isValid || !value.isValid()) {
  return Promise.reject(new Error("Data inválida"));
}

// ❌ Validação antiga que não funcionava
if (!moment(value).isValid()) {
  return Promise.reject(new Error("Data inválida"));
}
```

**📦 Componente MaskedDatePicker:**
```javascript
// Localização: frontend/src/components/common/inputs/MaskedDatePicker.js
import { MaskedDatePicker } from "../../components/common/inputs";

// Uso básico
<MaskedDatePicker
  value={dataColheita}
  onChange={(date) => setDataColheita(date)}
  placeholder="Selecione a data"
/>

// Com validação
<Form.Item name="dataColheita" rules={[{ required: true }]}>
  <MaskedDatePicker
    disabledDate={(current) => current && current > moment().endOf('day')}
    showToday
  />
</Form.Item>
```

**Funcionalidade:**
- Digite: `06122025` → Resultado automático: `06/12/2025`
- Funciona em formulários de criação e edição
- Mantém todas as funcionalidades do DatePicker padrão

**🎨 Componentes com DatePicker Corrigidos:**
- **ColheitaModal.js**: `dataColheita` (usa MaskedDatePicker)
- **NovoPedidoModal.js**: `dataPedido`, `dataPrevistaColheita`
- **ColheitaTab.js**: `dataColheita`
- **DadosBasicosTab.js**: `dataPedido`, `dataPrevistaColheita`
- **PrecificacaoTab.js**: `indDataEntrada`, `indDataDescarga`
- **PrecificacaoModal.js**: `indDataEntrada`, `indDataDescarga`
- **LancarPagamentosModal.js**: `dataPagamento`
- **NovoPagamentoModal.js**: `dataPagamento`
- **RegistrarFitaModal.js**: `dataRegistro`
- **DetalhamentoModal.js**: `dataRegistro`

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
│   │   │   │   ├── search/             # Componentes de busca
│   │   │   │   ├── modals/             # Modais reutilizáveis
│   │   │   │   │   └── ConfirmCloseModal.js # Modal de confirmação de fechamento
│   │   │   │   ├── loaders/            # Componentes de loading
│   │   │   │   │   └── CentralizedLoader.js # Loading global com z-index 99999
│   │   │   │   ├── ResponsiveTable.js  # Tabela responsiva com scroll horizontal
│   │   │   │   └── tables/             # Componentes de tabela reutilizáveis
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
│   │   │   ├── useDebounce.js          # Hook genérico de debounce
│   │   │   ├── useNotificationWithContext.js # Notificações com z-index correto
│   │   │   └── useConfirmClose.js      # Hook para validação de fechamento de modais
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
- **FrutasPedidos** - Relacionamento N:N com dupla unidade + quantidade precificada para relatórios
- **FrutasPedidosAreas** - Múltiplas áreas por fruta
- **FrutasPedidosFitas** - Múltiplas fitas por fruta
- **PagamentosPedidos** - Múltiplos pagamentos por pedido
- **AreaAgricola** - Áreas próprias categorizadas
- **AreaFornecedor** - Áreas de fornecedores com vinculação a culturas
- **Cliente** - Dados fiscais e comerciais + classificação indústria
- **Fruta** - Catálogo vinculado a culturas (substitui categorias)
- **Cultura** - Gestão de culturas com relacionamento com frutas e áreas de fornecedores
- **FitaBanana** - Fitas com cores hexadecimais e nomes únicos
- **ControleBanana** - Lotes de fitas por área (controle por lote específico)
- **HistoricoFitas** - Auditoria completa de operações
- **FrutasPedidosFitas** - Vinculação de lotes específicos a pedidos
- **TurmaColheita** - Cadastro de turmas de colheita (nome, PIX, observações)
- **TurmaColheitaPedidoCusto** - Vinculação de turmas a pedidos com custos específicos

### **Relacionamentos Complexos**
- **N:N Avançado**: Pedidos ↔ Frutas com múltiplas áreas e fitas
- **Dupla Referência**: Áreas podem ser próprias OU de fornecedores
- **Hierarquia**: Culturas → Frutas → Pedidos → Pagamentos
- **Relação Cultura-Fruta**: Frutas vinculadas obrigatoriamente a culturas (substitui categorias)
- **Relação Cultura-Área**: Áreas de fornecedores podem ser vinculadas a culturas específicas
- **Controle de Qualidade**: Filtragem de áreas baseada na cultura da fruta selecionada

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
GET    /api/areas-fornecedores         # Áreas de fornecedores (com culturas)
POST   /api/areas-fornecedores         # Criar área de fornecedor (com culturaId opcional)
PATCH  /api/areas-fornecedores/:id     # Atualizar área de fornecedor
GET    /api/areas-fornecedores/fornecedor/:id  # Áreas por fornecedor

# Culturas e Frutas
GET    /api/culturas                   # Listar culturas
GET    /api/frutas                     # Catálogo de frutas (com culturas)
POST   /api/frutas                     # Criar fruta (culturaId obrigatório)
PATCH  /api/frutas/:id                 # Atualizar fruta

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

# Pagamentos de Turmas
GET    /api/turma-colheita/:id/pagamentos-pendentes    # Pagamentos pendentes de uma turma
GET    /api/turma-colheita/:id/pagamentos-efetuados    # Todos os pagamentos efetuados de uma turma
# Retorna: turma, resumo (totalPago, quantidadeColheitas, quantidadePedidos, quantidadeFrutas), colheitas agrupadas por data

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

### **Sistema de Precificação Avançado**

**🎯 Interface de Precificação Completa:**
- **6 Colunas Organizadas**: Fruta, Prevista, Colhida, Quant. Precificada, Valor Unit., Total
- **Lógica Inteligente de Colhida**: Mostra quantidade na unidade de precificação escolhida automaticamente
- **Toggle de Unidade**: Alternância dinâmica entre unidades de medida com recálculo automático
- **Validação em Tempo Real**: Campos obrigatórios com validação de valores positivos
- **Cálculo Automático**: Valor total calculado automaticamente (quantidade × valor unitário)

**🔄 Funcionalidades Avançadas:**
- **Detecção Automática de Unidade**: Sistema identifica qual unidade usar baseado na precificação
- **Recálculo Inteligente**: Valores consolidados atualizados automaticamente
- **Campos Condicionais**: Quantidade colhida só aparece quando há unidade de precificação definida
- **Formatação Monetária**: Valores formatados em padrão brasileiro (R$ 1.234,56)
- **Integração com Dados Complementares**: Campos específicos para clientes indústria

**📊 Estrutura das Colunas:**
1. **Fruta** (md=7): Nome da fruta (somente leitura)
2. **Prevista** (md=3): Quantidade prevista na unidade padrão (somente leitura)
3. **Colhida** (md=3): Quantidade colhida na unidade de precificação (somente leitura, lógica inteligente)
4. **Quant. Precificada** (md=4): Campo editável para quantidade específica de precificação
5. **Valor Unit.** (md=4): Campo editável para valor unitário com toggle de unidade
6. **Total** (md=3): Valor total calculado automaticamente (somente leitura)

**🎨 Componentes Implementados:**
- **PrecificacaoTab.js**: Aba de precificação no sistema de edição de pedidos
- **PrecificacaoModal.js**: Modal standalone para definição de precificação
- **Validação Robusta**: Campos obrigatórios e validação de valores positivos
- **Estados de Loading**: Feedback visual durante operações de salvamento

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
- **useNotificationWithContext**: Notificações com z-index correto que respeitam ConfigProvider

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

### **📱 Sistema de Responsividade Avançado**

**🔧 Componente ResponsiveTable Implementado:**
- **Localização**: `src/components/common/ResponsiveTable.js`
- **Scroll Horizontal Automático**: No mobile (largura < 576px)
- **Headers Padronizados**: Verde #059669 em todas as tabelas
- **Scrollbar Estilizada**: Cores do sistema com efeito hover
- **Indicador Visual**: Dica "Deslize para ver mais →" temporária
- **Compatibilidade Total**: Aceita todas as props do Ant Design Table
- **Correção de Bug**: Fix para linha branca no topo ao usar scroll horizontal

**🎨 Características Técnicas:**
- **Largura Mínima Configurável**: Default 1000px, personalizável via `minWidthMobile`
- **Responsive Design**: Padding e font-size reduzidos no mobile
- **Sticky Headers**: Headers fixos durante scroll vertical
- **Overflow Otimizado**: Controle preciso de scroll horizontal/vertical
- **Z-index Inteligente**: Headers sempre visíveis (z-index 10)

**📋 Como Usar:**
```jsx
import ResponsiveTable from '../common/ResponsiveTable';

<ResponsiveTable
  columns={colunas}
  dataSource={dados}
  rowKey="id"
  minWidthMobile={1200} // Largura mínima no mobile
  showScrollHint={true} // Dica visual de scroll
  // ... todas as outras props do Table funcionam normalmente
/>
```

**🔄 Migração Simples:**
- **Antes**: `<Table columns={...} dataSource={...} />`
- **Depois**: `<ResponsiveTable columns={...} dataSource={...} />`
- **Zero Breaking Changes**: Mantém todas as props existentes

**🔧 Configurações Técnicas para Correção da Linha Branca:**

O ResponsiveTable já inclui todas as correções necessárias para evitar a linha branca que aparecia entre o header e a primeira linha de dados. As principais correções implementadas são:

```css
/* Correções principais aplicadas automaticamente */
.ant-table {
  border-spacing: 0 !important;
  border-collapse: separate !important;
}

.ant-table-thead, .ant-table-tbody {
  margin: 0 !important;
  border-spacing: 0 !important;
}

.ant-table-tbody > tr:first-child > td {
  border-top: none !important;
  margin: 0 !important;
}

.ant-table-container, .ant-table-content {
  line-height: 1 !important;
}
```

**📋 Para Tabelas com Componentes Customizados:**

Se você precisar usar componentes customizados (como `LinhaComAnimacao`), use a prop `components`:

```jsx
<ResponsiveTable
  columns={colunas}
  dataSource={dados}
  rowKey="id"
  minWidthMobile={1200}
  components={{
    body: {
      row: ({ children, record, ...props }) => (
        <SeuComponenteCustomizado
          {...props}
          $propriedade={condicao}
        >
          {children}
        </SeuComponenteCustomizado>
      ),
    },
  }}
/>
```

**⚠️ Importante:**
- Todas as correções de linha branca são aplicadas automaticamente
- Não é necessário adicionar CSS adicional
- O componente funciona como drop-in replacement do Table do Ant Design

**🔧 Correção da Sombra "Grudada" no Scroll Horizontal:**

O ResponsiveTable também corrige um bug específico do Ant Design onde sombras de ping ficam "grudadas" nas colunas durante o scroll horizontal:

```css
/* Remove sombras de ping que ficam grudadas nas colunas */
.ant-table.ant-table-ping-left:not(.ant-table-has-fix-left) > .ant-table-container::before,
.ant-table.ant-table-ping-right:not(.ant-table-has-fix-right) > .ant-table-container::after {
  box-shadow: none !important;
}

.ant-table-ping-right .ant-table-container::after {
  box-shadow: none !important;
  display: none !important;
}

.ant-table-ping-left .ant-table-container::before {
  box-shadow: none !important;
  display: none !important;
}
```

**🎯 Resultado:**
- Sombra não fica mais "grudada" na coluna Cliente
- Scroll horizontal limpo sem sombras indesejadas
- Comportamento consistente em mobile e desktop

**🎨 Exemplo de Componente Customizado de Linha:**

Para criar linhas com animações ou estilos especiais (como no PagamentosPendentesModal):

```jsx
// 1. Criar o styled component da linha
const LinhaComAnimacao = styled.tr`
  ${props => props.$sendoPago && `
    animation: fadeOutPayment 0.8s ease-in-out;
    background-color: #f6ffed !important;
    
    @keyframes fadeOutPayment {
      0% { background-color: #ffffff; opacity: 1; transform: scale(1); }
      50% { background-color: #52c41a; opacity: 0.8; transform: scale(1.02); }
      100% { background-color: #f6ffed; opacity: 0.6; transform: scale(0.98); }
    }
  `}
  
  ${props => props.$itemPago && `
    background-color: #f6ffed !important;
    border-left: 4px solid #52c41a !important;
    opacity: 0.85;
  `}
`;

// 2. Usar no ResponsiveTable
<ResponsiveTable
  columns={colunas}
  dataSource={dados}
  rowKey="id"
  components={{
    body: {
      row: ({ children, record, ...props }) => (
        <LinhaComAnimacao
          {...props}
          $sendoPago={itensSendoPagos.includes(record?.id)}
          $itemPago={record?.status === 'PAGO'}
        >
          {children}
        </LinhaComAnimacao>
      ),
    },
  }}
/>
```

**🔑 Pontos Importantes:**
- Use `styled.tr` para criar o componente de linha
- Props customizadas devem começar com `$` (convenção do styled-components)
- O componente recebe `children`, `record` e outras props do Ant Design
- As correções de linha branca são mantidas automaticamente

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

### **🔔 Sistema de Notificações Avançado com Z-index Correto**

**🎯 Problema Identificado:**
- **Static Methods Limitados**: `notification.*` e `message.*` não acessam ConfigProvider
- **Z-index Conflitante**: Notificações apareciam atrás de modais (z-index 1000 vs 100000)
- **Contexto Perdido**: Methods estáticos renderizam em DOM nodes independentes

**✅ Solução Hook-based:**
- **useNotificationWithContext**: Hook personalizado que respeita ConfigProvider
- **Z-index Configurado**: `zIndexPopupBase: 100001` no App.js para todas notificações
- **API Familiar**: Mantém sintaxe idêntica ao `showNotification` existente
- **Context-Aware**: Renderização dentro da árvore React com `contextHolder`

**🔧 Implementação:**
```javascript
// Hook com API familiar
const { success, error, info, warning, contextHolder } = useNotificationWithContext();

// Uso idêntico ao showNotification
success('Sucesso', 'Operação realizada!');
error('Erro', 'Algo deu errado!');

// OBRIGATÓRIO: contextHolder no JSX
return (
  <>
    {contextHolder}
    <Modal>...</Modal>
  </>
);
```

**📋 Configuração Global:**
- **ConfigProvider** (App.js): `zIndexPopupBase: 100001` para Message e Notification
- **CSS Existente**: Utiliza `globalNotifications.css` para estilo consistente
- **Migração Opcional**: Use apenas onde `showNotification` tem problema de z-index

**🎨 Benefícios:**
- **Z-index Definitivo**: Sempre aparece sobre modais (z-index 100001)
- **Estilo Consistente**: Visual idêntico ao sistema atual
- **API Compatível**: Sem necessidade de mudança de código significativa
- **Documentação Completa**: README-useNotificationWithContext.md com exemplos

### **🛡️ Sistema de Validação de Fechamento de Modais**

**🎯 Prevenção de Perda Acidental de Dados:**
- **Detecção Automática**: Verifica se há dados preenchidos no formulário
- **Modal de Confirmação**: Pergunta se usuário realmente quer descartar alterações
- **Componente Reutilizável**: `ConfirmCloseModal` para uso em qualquer modal
- **Hook Customizado**: `useConfirmClose` para lógica reutilizável
- **Validação Inteligente**: Detecta campos básicos, coordenadas, arrays e dados customizados

**🔧 Componentes Implementados:**
- **ConfirmCloseModal**: Modal de confirmação totalmente customizável
- **useConfirmClose**: Hook com lógica de validação e controle de estado
- **Validação Padrão**: Detecta nome, área, categoria, coordenadas, culturas, itens, produtos
- **Validação Customizada**: Suporte a funções de validação específicas por modal

**📋 Uso Simples (3 linhas):**
```javascript
import ConfirmCloseModal from "../common/modals/ConfirmCloseModal";
import useConfirmClose from "../../hooks/useConfirmClose";

const MeuModal = ({ open, onClose, formData }) => {
  const { confirmCloseModal, handleCloseAttempt, handleConfirmClose, handleCancelClose } = 
    useConfirmClose(formData, onClose);

  return (
    <>
      <Modal open={open} onCancel={handleCloseAttempt}>
        {/* Seu formulário */}
        <Button onClick={handleCloseAttempt}>Cancelar</Button>
      </Modal>
      <ConfirmCloseModal
        open={confirmCloseModal}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
};
```

**🎨 Funcionalidades:**
- **Detecção Automática**: Verifica campos comuns automaticamente
- **Validação Customizada**: Função personalizada quando necessário
- **Modal Personalizável**: Título, mensagem e textos dos botões configuráveis
- **Design Consistente**: Cabeçalho verde (padrão do sistema) e botão vermelho para confirmação
- **UX Otimizada**: Botões intuitivos ("Continuar Editando" vs "Sim, Descartar")
- **Validação Específica**: Implementada em 5 formulários principais (Áreas, Clientes, Frutas, Fornecedores, Turma de Colheita)

**🔄 Pontos de Validação:**
- **Botão 'X' do modal**: `onCancel={handleCloseAttempt}`
- **Botão "Cancelar"**: `onClick={handleCloseAttempt}`
- **ESC do teclado**: Funciona automaticamente via onCancel

**📊 Benefícios:**
- **🛡️ Prevenção**: Evita perda acidental de dados preenchidos
- **🔄 Reutilização**: Use em qualquer modal do sistema
- **⚡ Rapidez**: Implementação em 3 linhas de código
- **🎯 Flexibilidade**: Validação customizável quando necessário
- **📚 Documentação**: Integrado ao README principal

**🏆 Formulários Implementados:**
1. **✅ Áreas Agrícolas** - `AddEditAreaDialog.js`
   - Validação: nome, área, categoria, coordenadas, culturas
2. **✅ Clientes** - `AddEditClienteDialog.js`
   - Validação: dados básicos, endereço, contato, observações
3. **✅ Frutas** - `AddEditFrutaDialog.js`
   - Validação: nome, código, categoria, unidades de medida, descrição
4. **✅ Fornecedores** - `AddEditFornecedorDialog.js`
   - Validação: nome, documento, contato, endereço, observações
5. **✅ Turma de Colheita** - `AddEditTurmaColheitaDialog.js`
   - Validação: nome do colhedor, chave PIX, observações

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
- **Dupla Unidade** de medida com precificação flexível + quantidade específica para relatórios
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
- **CentralizedLoader** - Loading global que cobre toda a tela com backdrop blur e z-index 99999
- **ConfirmCloseModal** - Modal de confirmação reutilizável para fechamento com dados preenchidos
- **useConfirmClose** - Hook customizado para gerenciar validação de fechamento de modais

### **5. Sistema de Interface Avançado**
- **Tema Global** com CSS Variables automáticas
- **Paleta de Cores** padronizada (Verde #059669 como cor principal)
- **Modais Inteligentes** com headers coloridos e sistema de cards
- **Loading States** otimizados sem "flickering"
- **Sistema de Notificações** centralizado com tipos variados
- **Hook useNotificationWithContext** - Notificações que respeitam ConfigProvider e z-index correto
- **Sistema de Validação de Fechamento de Modais** - Prevenção de perda acidental de dados

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
- **Lógica de Quantidade Colhida**: Validação de unidade de precificação antes de exibir quantidade colhida
- **Toggle de Unidade**: Validação de disponibilidade de segunda unidade antes de permitir alternância
- **Cálculo de Valores**: Validação de valores positivos e recálculo automático de totais
- **Status de Pagamento Automático**: Baseado em valor recebido vs. valor final

### **Sistema de Datas e Fuso Horário**
- **Formatação Padronizada**: Todas as datas salvas como `YYYY-MM-DD HH:mm:ss` com horário 12:00:00
- **Validação Moment.js**: Uso de `value.isValid()` para validação correta de objetos Moment
- **Prevenção de Fuso Horário**: Salvamento em meio-dia evita diferenças de 1 dia ao editar
- **Consistência de Exibição**: Datas carregadas corretamente nos DatePickers sem diferenças visuais
- **Plugin Oficial**: `@ant-design/moment-webpack-plugin` para compatibilidade com Ant Design
- **Remoção de Hacks**: Eliminação de eventos `onFocus`/`onBlur` e `useRef` para controle de datas

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
- [x] Sistema avançado de pedidos (10 fases) com campo quantidadePrecificada para relatórios
- [x] Lógica inteligente de "Quantidade Colhida" que mostra quantidade na unidade de precificação escolhida
- [x] Interface de precificação com 6 colunas: Fruta, Prevista, Colhida, Quant. Precificada, Valor Unit., Total
- [x] Modal de visualização com colunas "Qtd. Colhida" e "Quant. Precificada"
- [x] Interface de precificação com campo obrigatório para quantidade específica
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
- [x] Hook useNotificationWithContext para notificações com z-index correto
- [x] Sistema de notificações que respeitam ConfigProvider
- [x] Correção de z-index conflitante entre modais e notificações
- [x] CentralizedLoader com backdrop blur e z-index global otimizado
- [x] Sistema de validação de fechamento de modais com prevenção de perda de dados
- [x] Componente ConfirmCloseModal reutilizável para confirmação de fechamento
- [x] Hook useConfirmClose para lógica de validação reutilizável
- [x] Detecção automática de dados preenchidos em formulários
- [x] Validação customizável para diferentes tipos de modais
- [x] Implementação completa em 5 formulários principais (Áreas, Clientes, Frutas, Fornecedores, Turma de Colheita)
- [x] Validação específica por tipo de formulário (dados básicos, contato, pagamento, unidades, etc.)
- [x] Sistema de responsividade avançado com componente ResponsiveTable reutilizável
- [x] Scroll horizontal automático para tabelas no mobile com scrollbar estilizada
- [x] Correção de bug da linha branca em tabelas com scroll horizontal
- [x] Headers padronizados verde #059669 para todas as tabelas do sistema
- [x] Indicador visual de scroll "Deslize para ver mais →" com animação temporária
- [x] Sticky headers para melhor experiência de usuário em tabelas longas
- [x] Sistema de datas e fuso horário padronizado com `@ant-design/moment-webpack-plugin`
- [x] Correção de problema de fuso horário em todos os DatePickers do sistema
- [x] Formatação padronizada de datas como `YYYY-MM-DD HH:mm:ss` (meio-dia)
- [x] Validação correta de datas com Moment.js usando `value.isValid()`
- [x] Remoção de hacks antigos (`onFocus`/`onBlur`/`useRef`) nos componentes de data
- [x] Modal PagamentosPendentesModal totalmente responsivo com layout otimizado
- [x] Modal PagamentosEfetuadosModal com visualização completa de pagamentos efetuados por turma
- [x] Endpoint específico para buscar todos os pagamentos efetuados de uma turma
- [x] Integração completa entre Dashboard e modais de pagamentos de turmas
- [x] Cards de estatísticas responsivos com títulos abreviados no mobile
- [x] Área de pagamento reorganizada com botões em linha separada no mobile
- [x] Área de observações otimizada com TextArea reduzido para mobile
- [x] Modal com largura responsiva (95vw no mobile vs 1400px no desktop)
- [x] Padding e margens otimizados para diferentes tamanhos de tela
- [x] Cores consistentes seguindo padrão do sistema (#059669 para headers, #52c41a para elementos de sucesso)

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

## 🎨 Padrão de Interface - Modals

### **Estrutura Padrão de Modals**

**⚠️ IMPORTANTE: Todos os modals do sistema DEVEM seguir este padrão exato para manter consistência visual.**

Todos os modals do sistema seguem um padrão consistente para garantir uniformidade visual e experiência do usuário. Este padrão é **OBRIGATÓRIO** e deve ser seguido em todos os novos modals criados.

#### **🎯 Configuração Base do Modal (OBRIGATÓRIO)**

**🔴 CORES FIXAS DO SISTEMA:**
- **Header Background**: `#059669` (verde principal)
- **Header Border**: `#047857` (verde escuro)
- **Texto Header**: `#ffffff` (branco)

```jsx
<Modal
  title={
    <span style={{
      color: "#ffffff",                    // ✅ SEMPRE branco
      fontWeight: "600",                   // ✅ SEMPRE 600
      fontSize: "16px",                    // ✅ SEMPRE 16px
      backgroundColor: "#059669",          // ✅ SEMPRE verde principal
      padding: "12px 16px",                // ✅ SEMPRE este padding
      margin: "-20px -24px 0 -24px",      // ✅ SEMPRE esta margem
      display: "block",                    // ✅ SEMPRE block
      borderRadius: "8px 8px 0 0",        // ✅ SEMPRE este border-radius
    }}>
      <IconeModal style={{ marginRight: 8 }} />
      Título do Modal
    </span>
  }
  open={open}
  onCancel={onClose}
  footer={null} // ✅ SEMPRE null - footer customizado
  width={1000} // Ajustar conforme necessidade
  styles={{
    body: {
      maxHeight: "calc(100vh - 200px)",    // ✅ SEMPRE esta altura
      overflowY: "auto",                   // ✅ SEMPRE auto
      overflowX: "hidden",                 // ✅ SEMPRE hidden
      padding: 20                          // ✅ SEMPRE 20px
    },
    header: {
      backgroundColor: "#059669",          // ✅ SEMPRE verde principal
      borderBottom: "2px solid #047857",  // ✅ SEMPRE verde escuro
      padding: 0                           // ✅ SEMPRE 0
    },
    wrapper: { zIndex: 1000 }              // Ajustar se necessário
  }}
  centered                                  // ✅ SEMPRE true
  destroyOnClose                           // ✅ SEMPRE true
>
```

#### **🎨 Cards Internos Padrão (OBRIGATÓRIO)**

**🔴 CORES FIXAS PARA CARDS:**
- **Header Background**: `#059669` (verde principal)
- **Header Border**: `#047857` (verde escuro)
- **Texto Header**: `#ffffff` (branco)
- **Fundo Card**: `#f9f9f9` (cinza claro)

```jsx
<Card
  title={
    <Space>
      <IconeCard style={{ color: "#ffffff" }} />  {/* ✅ SEMPRE branco */}
      <span style={{ color: "#ffffff", fontWeight: "600" }}>Título da Seção</span>
    </Space>
  }
  style={{
    marginBottom: 16,                              // ✅ SEMPRE 16px
    border: "1px solid #e8e8e8",                  // ✅ SEMPRE esta borda
    borderRadius: "8px",                          // ✅ SEMPRE 8px
    backgroundColor: "#f9f9f9",                   // ✅ SEMPRE cinza claro
  }}
  styles={{
    header: {
      backgroundColor: "#059669",                 // ✅ SEMPRE verde principal
      borderBottom: "2px solid #047857",         // ✅ SEMPRE verde escuro
      color: "#ffffff",                          // ✅ SEMPRE branco
      borderRadius: "8px 8px 0 0",              // ✅ SEMPRE este border-radius
      padding: "8px 16px"                        // ✅ SEMPRE este padding
    },
    body: { padding: "16px" }                     // ✅ SEMPRE 16px
  }}
>
  {/* Conteúdo do card */}
</Card>
```

#### **📊 Tabelas Padronizadas**
```jsx
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: 16px;
    font-size: 14px;
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background-color: #d1fae5 !important;
  }

  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
  }
`;
```

#### **🔴 Footer Padrão**
```jsx
<div style={{
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: "1px solid #e8e8e8",
}}>
  <Button onClick={onClose} size="large">
    Fechar
  </Button>
  <Button
    type="primary"
    onClick={handleSalvar}
    loading={loading}
    size="large"
    style={{
      backgroundColor: "#059669",
      borderColor: "#059669",
    }}
  >
    Ação Principal
  </Button>
</div>
```

#### **✨ Estados de Loading**
```jsx
{operacaoLoading && (
  <div style={{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: '8px'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '32px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e8e8e8'
    }}>
      <SpinnerContainer />
      <div style={{
        color: '#059669',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        Mensagem de Loading...
      </div>
    </div>
  </div>
)}
```

#### **🎨 Cores do Sistema (OBRIGATÓRIAS)**

**🔴 CORES PRINCIPAIS (NUNCA MUDAR):**
- **Verde Principal**: `#059669` - Headers de modals, headers de cards, botões primários
- **Verde Escuro**: `#047857` - Bordas de headers, sombras
- **Verde de Sucesso**: `#52c41a` - Elementos de sucesso, linhas de pagamentos efetuados
- **Verde Muito Claro**: `#f6ffed` - Fundos de elementos de sucesso
- **Verde Claro**: `#b7eb8f` - Bordas de elementos de sucesso

**🔵 CORES SECUNDÁRIAS:**
- **Fundo Cards**: `#f9f9f9` - Fundo padrão de cards
- **Bordas**: `#e8e8e8` - Bordas padrão
- **Hover Tabelas**: `#e6f7ff` - Hover em linhas de tabela
- **Seleção Tabelas**: `#d1fae5` - Linhas selecionadas
- **Texto Header**: `#ffffff` - Texto em headers (sempre branco)

**⚠️ REGRA IMPORTANTE:**
- **TODOS os headers de modals e cards DEVEM usar `#059669`**
- **TODAS as bordas de headers DEVEM usar `#047857`**
- **TODOS os textos de headers DEVEM usar `#ffffff`**
- **Elementos de sucesso DEVEM usar `#52c41a`**

#### **📱 Responsividade**
- **Mobile**: `xs={24}` (largura total)
- **Tablet**: `md={12}` (metade da linha)
- **Desktop**: `lg={8}` ou `lg={6}` (divisões específicas)

#### **🔧 Props Obrigatórias**
```jsx
ModalComponent.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // Props específicas do modal...
};
```

#### **💡 Boas Práticas**
1. **Sempre usar `destroyOnClose`** para limpar estado
2. **Footer sempre `null`** - criar footer customizado
3. **zIndex consistente** - usar hierarquia clara
4. **Loading states** - overlay interno para operações
5. **Notificações** - usar `showNotification` do sistema
6. **Validações** - usar hooks customizados quando aplicável
7. **Styled Components** - para tabelas e elementos customizados

### **📁 Exemplos de Implementação**

**🎯 Modals de Pedidos:**
- `frontend/src/components/pedidos/NovoPedidoModal.js`
- `frontend/src/components/pedidos/LancarPagamentosModal.js`
- `frontend/src/components/pedidos/PagamentoModal.js`

**💰 Modals de Pagamentos de Turmas:**
- `frontend/src/components/dashboard/PagamentosPendentesModal.js` - **Modal de pagamentos pendentes com processamento**
- `frontend/src/components/dashboard/PagamentosEfetuadosModal.js` - **Modal de pagamentos efetuados com visualização completa**

**📊 Modals de Estatísticas:**
- `frontend/src/components/turma-colheita/EstatisticasTurmaModal.js`

**📝 Modals de Formulários (com validação de fechamento):**
- `frontend/src/components/areas/AddEditAreaDialog.js` - **Implementação com validação de fechamento**
- `frontend/src/components/clientes/AddEditClienteDialog.js` - **Implementação com validação de fechamento**
- `frontend/src/components/frutas/AddEditFrutaDialog.js` - **Implementação com validação de fechamento**
- `frontend/src/components/fornecedores/AddEditFornecedorDialog.js` - **Implementação com validação de fechamento**
- `frontend/src/components/turma-colheita/AddEditTurmaColheitaDialog.js` - **Implementação com validação de fechamento**

**🔧 Componentes Reutilizáveis:**
- `frontend/src/components/common/modals/ConfirmCloseModal.js` - **Modal de confirmação reutilizável**
- `frontend/src/hooks/useConfirmClose.js` - **Hook para validação de fechamento**

---

## 📱 Plano de Responsividade para Modais

### **🎯 Padrão de Responsividade Implementado**

Baseado na análise dos modais já otimizados (`PagamentosEfetuadosModal.js`, `PagamentosPendentesModal.js` e `NovoPedidoModal.js`), foi criado um padrão consistente de responsividade que deve ser aplicado a todos os modais do sistema.

**📚 Lições Aprendidas do NovoPedidoModal.js:**
- **Conversão px → rem**: Aplicada gradualmente, mantendo layout estável
- **Labels Mobile**: Configuração específica para mobile com ícones e espaçamento
- **Botões de Ação**: Posicionamento e operação correta em mobile
- **Form.List**: Funcionalidade nativa para adicionar/remover itens
- **Espaçamentos**: Balanceamento entre responsividade e estabilidade visual

### **📋 Estrutura Padrão do Modal Responsivo**

#### **🔧 Configuração Base do Modal (OBRIGATÓRIO)**
```jsx
import useResponsive from '../hooks/useResponsive';

const MeuModal = ({ open, onClose, ... }) => {
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "1rem",  // ✅ Responsivo em rem
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",  // ✅ Responsivo em rem
          margin: "-1.25rem -1.5rem 0 -1.5rem",  // ✅ Convertido para rem
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",  // ✅ Convertido para rem
        }}>
          <IconeModal style={{ marginRight: "0.5rem" }} />  {/* ✅ Convertido para rem */}
          {isMobile ? 'Título Mobile' : 'Título Completo Desktop'}  // ✅ Responsivo
        </span>
      }
      open={open}
      onCancel={onClose}
      width={isMobile ? '95vw' : '90%'}  // ✅ Largura responsiva otimizada
      style={{ maxWidth: isMobile ? '95vw' : "75rem" }}  // ✅ MaxWidth em rem
      footer={null}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",  // ✅ Convertido para rem
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20  // ✅ Manter px para layout estável
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",  // ✅ Convertido para rem
          padding: 0
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
```

#### **🎨 Cards Internos Responsivos**
```jsx
<Card
  title={
    <Space>
      <IconeCard style={{ color: "#ffffff" }} />
      <span style={{ 
        color: "#ffffff", 
        fontWeight: "600",
        fontSize: "0.875rem"  // ✅ Tamanho único para consistência
      }}>
        Título do Card
      </span>
    </Space>
  }
  style={{
    marginBottom: isMobile ? 12 : 16,  // ✅ Margem responsiva (px para estabilidade)
    border: "0.0625rem solid #e8e8e8",  // ✅ Convertido para rem
    borderRadius: "0.5rem",  // ✅ Convertido para rem
    backgroundColor: "#f9f9f9",
  }}
  styles={{
    header: {
      backgroundColor: "#059669",
      borderBottom: "0.125rem solid #047857",  // ✅ Convertido para rem
      color: "#ffffff",
      borderRadius: "0.5rem 0.5rem 0 0",  // ✅ Convertido para rem
      padding: isMobile ? "6px 12px" : "8px 16px"  // ✅ Padding responsivo (px para estabilidade)
    },
    body: { 
      padding: isMobile ? "12px" : "16px"  // ✅ Padding responsivo (px para estabilidade)
    }
  }}
>
```

#### **📊 Grid System Responsivo**
```jsx
<Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>  // ✅ Gutter responsivo (px para estabilidade)
  <Col xs={24} sm={12} md={8} lg={6}>  // ✅ Sempre usar xs={24} para mobile
    {/* Conteúdo */}
  </Col>
</Row>
```

#### **📝 Labels Mobile Específicos**
```jsx
// ✅ Padrão para labels de inputs em mobile (baseado em NovoPedidoModal.js)
<Form.Item
  label={isMobile ? (
    <Space size="small">  {/* ✅ size="small" para espaçamento compacto */}
      <AppleOutlined style={{ color: "#059669" }} />  {/* ✅ Ícone com cor do sistema */}
      <span style={{ 
        fontWeight: "700", 
        color: "#059669",  // ✅ Cor do sistema
        fontSize: "14px"   // ✅ Tamanho consistente
      }}>
        Fruta  {/* ✅ Texto do label */}
      </span>
    </Space>
  ) : undefined}  {/* ✅ Desktop usa label padrão do Ant Design */}
  required  // ✅ Asterisco obrigatório para mobile
>
  <Select />
</Form.Item>
```

#### **🔘 Botões de Ação Mobile (Form.List)**
```jsx
// ✅ Padrão para botões adicionar/remover em mobile
<Col xs={24} md={2}>
  <div style={{
    display: "flex",
    gap: isMobile ? "8px" : "8px",
    justifyContent: isMobile ? "center" : "center",  // ✅ Centralizado
    flexDirection: isMobile ? "row" : "row",
    marginTop: isMobile ? "8px" : "0",  // ✅ Espaçamento superior no mobile
    paddingTop: isMobile ? "8px" : "0",
    borderTop: isMobile ? "1px solid #f0f0f0" : "none"  // ✅ Separador visual
  }}>
    <Button
      size={isMobile ? "small" : "large"}
      style={{
        borderRadius: "3.125rem",  // ✅ Convertido para rem (50px)
        height: isMobile ? "32px" : "40px",  // ✅ Altura responsiva (px para estabilidade)
        width: isMobile ? "32px" : "40px",
        border: "0.125rem solid #ff4d4f",  // ✅ Convertido para rem (2px)
        boxShadow: "0 0.125rem 0.5rem rgba(16, 185, 129, 0.15)",  // ✅ Convertido para rem
      }}
      onClick={() => {
        if (fields.length > 1) {  // ✅ Validação para manter mínimo 1 item
          remove(name);
        }
      }}
      disabled={fields.length <= 1}  // ✅ Desabilitar quando só 1 item
    >
      <DeleteOutlined />
    </Button>
    
    <Button
      size={isMobile ? "small" : "large"}
      onClick={() => {
        add({
          // ✅ Valores iniciais para novo item
          campo1: undefined,
          campo2: undefined,
          campo3: undefined
        });
      }}
      style={{
        borderRadius: "3.125rem",
        height: isMobile ? "32px" : "40px",
        width: isMobile ? "32px" : "40px",
        border: "0.125rem solid #52c41a",
        boxShadow: "0 0.125rem 0.5rem rgba(82, 196, 26, 0.15)",
      }}
    >
      <PlusOutlined />
    </Button>
  </div>
</Col>
```

#### **🔘 Botões Responsivos (Footer)**
```jsx
<Button
  size={isMobile ? "small" : "middle"}  // ✅ Tamanho responsivo
  style={{
    height: isMobile ? "32px" : "40px",  // ✅ Altura responsiva (px para estabilidade)
    padding: isMobile ? "0 12px" : "0 16px",  // ✅ Padding responsivo (px para estabilidade)
    fontSize: isMobile ? "0.75rem" : undefined,  // ✅ Fonte responsiva em rem
    minWidth: isMobile ? "80px" : "100px"  // ✅ Largura mínima responsiva
  }}
>
  Texto do Botão
</Button>
```

#### **📝 Inputs e Formulários Responsivos**
```jsx
<Form.Item
  label={
    <span style={{
      fontSize: isMobile ? "0.8125rem" : "0.875rem",  // ✅ Label responsivo em rem
      fontWeight: "500"
    }}>
      Label do Campo
    </span>
  }
>
  <Input
    size={isMobile ? "small" : "middle"}  // ✅ Tamanho responsivo
    style={{
      fontSize: isMobile ? "0.875rem" : "1rem"  // ✅ Fonte responsiva em rem
    }}
  />
</Form.Item>

// ✅ Para campos específicos (Select, DatePicker, etc.)
<Select
  size={isMobile ? "small" : "middle"}
  style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
/>

<DatePicker
  size={isMobile ? "small" : "middle"}
  style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
/>

<TextArea
  size={isMobile ? "small" : "middle"}
  style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
/>
```

#### **📊 Tabelas Responsivas**
```jsx
import ResponsiveTable from '../common/ResponsiveTable';

<ResponsiveTable
  columns={colunas}
  dataSource={dados}
  rowKey="id"
  minWidthMobile={1200}  // ✅ Largura mínima no mobile
  showScrollHint={true}  // ✅ Dica visual de scroll
  pagination={{
    pageSize: isMobile ? 5 : 10,  // ✅ Paginação responsiva
    showSizeChanger: !isMobile,   // ✅ Ocultar em mobile
    showQuickJumper: !isMobile    // ✅ Ocultar em mobile
  }}
/>
```

#### **📏 Regras de Conversão px → rem (Lições Aprendidas)**
```javascript
// ✅ CONVERSÕES APLICADAS (base: 16px = 1rem)
const conversaoAplicada = {
  // Fontes - SEMPRE converter para rem
  '14px': '0.875rem',    // ✅ FontSize de inputs, labels
  '16px': '1rem',        // ✅ FontSize principal
  '13px': '0.8125rem',   // ✅ FontSize de labels menores
  
  // Bordas - SEMPRE converter para rem
  '1px': '0.0625rem',    // ✅ Bordas de cards
  '2px': '0.125rem',     // ✅ Bordas de headers
  
  // Border-radius - SEMPRE converter para rem
  '8px': '0.5rem',       // ✅ Border-radius padrão
  '50px': '3.125rem',    // ✅ Border-radius circular
  
  // Box-shadow - SEMPRE converter para rem
  '0 2px 8px': '0 0.125rem 0.5rem',
  '0 8px 32px': '0 0.5rem 2rem',
  
  // Max-width - SEMPRE converter para rem
  '1200px': '75rem',     // ✅ Max-width de modais
  
  // Max-height - SEMPRE converter para rem
  '200px': '12.5rem',    // ✅ Max-height de modal body
  
  // Margens negativas - SEMPRE converter para rem
  '-20px -24px 0 -24px': '-1.25rem -1.5rem 0 -1.5rem'
};

// ⚠️ NÃO CONVERTER (manter px para estabilidade de layout)
const manterPx = {
  // Padding/Margin de componentes Ant Design
  'padding: 12': 'padding: 12',        // ✅ styles.body.padding
  'padding: 20': 'padding: 20',        // ✅ styles.body.padding
  'marginBottom: 12': 'marginBottom: 12',  // ✅ Card marginBottom
  'marginBottom: 16': 'marginBottom: 16',
  
  // Gutter de Row
  'gutter={[8, 8]}': 'gutter={[8, 8]}',  // ✅ Row gutter
  
  // Altura/Largura de botões
  'height: "32px"': 'height: "32px"',     // ✅ Button height
  'width: "32px"': 'width: "32px"',       // ✅ Button width
  
  // Gap e espaçamentos de flexbox
  'gap: "8px"': 'gap: "8px"',            // ✅ Flex gap
  'gap: "12px"': 'gap: "12px"'
};

// 🎯 REGRA PRINCIPAL: 
// - Converta rem: fontSize, borderWidth, borderRadius, boxShadow, maxWidth, maxHeight
// - Mantenha px: padding, margin, height, width, gap, gutter (estabilidade de layout)
```

#### **🎨 Footer Responsivo**
```jsx
// ✅ Padrão de footer responsivo (baseado em NovoPedidoModal.js)
<div style={{
  display: "flex",
  justifyContent: "flex-end",
  gap: isMobile ? "8px" : "12px",  // ✅ Gap responsivo (px para estabilidade)
  marginTop: isMobile ? "1rem" : "1.5rem",  // ✅ MarginTop em rem
  paddingTop: isMobile ? "12px" : "16px",  // ✅ PaddingTop (px para estabilidade)
  borderTop: "1px solid #e8e8e8",  // ✅ BorderTop (px para estabilidade)
}}>
  <Button 
    onClick={onClose} 
    size={isMobile ? "small" : "middle"}
    style={{
      height: isMobile ? "32px" : "40px",  // ✅ Altura (px para estabilidade)
      padding: isMobile ? "0 12px" : "0 16px",  // ✅ Padding (px para estabilidade)
    }}
  >
    Cancelar
  </Button>
  <Button
    type="primary"
    size={isMobile ? "small" : "middle"}
    style={{
      backgroundColor: "#059669",
      borderColor: "#059669",
      height: isMobile ? "32px" : "40px",  // ✅ Altura (px para estabilidade)
      padding: isMobile ? "0 12px" : "0 16px",  // ✅ Padding (px para estabilidade)
    }}
  >
    Salvar
  </Button>
</div>
```

#### **🎨 Espaçamentos Responsivos (usando rem)**
```jsx
const stylesResponsivos = {
  // ✅ Espaçamentos em rem (conversão aplicada)
  marginSmall: isMobile ? "0.5rem" : "0.75rem",    // 8px → 12px
  marginMedium: isMobile ? "0.75rem" : "1rem",     // 12px → 16px
  marginLarge: isMobile ? "1rem" : "1.5rem",       // 16px → 24px
  marginXLarge: isMobile ? "1.25rem" : "2rem",     // 20px → 32px
  
  // ✅ Padding em rem (quando aplicável)
  paddingSmall: isMobile ? "0.5rem" : "0.75rem",   // 8px → 12px
  paddingMedium: isMobile ? "0.75rem" : "1rem",    // 12px → 16px
  paddingLarge: isMobile ? "1rem" : "1.25rem",     // 16px → 20px
  
  // ✅ Fontes em rem (SEMPRE aplicar)
  fontSizeSmall: isMobile ? "0.75rem" : "0.875rem", // 12px → 14px
  fontSizeMedium: isMobile ? "0.875rem" : "1rem",   // 14px → 16px
  fontSizeLarge: isMobile ? "1rem" : "1.125rem",    // 16px → 18px
  fontSizeXLarge: isMobile ? "1.125rem" : "1.25rem" // 18px → 20px
};
```

### **📋 Checklist de Responsividade (Atualizado)**

#### **✅ Configuração Base**
- [ ] Importar `useResponsive` hook
- [ ] Configurar largura do modal: `width={isMobile ? '95vw' : '90%'}`
- [ ] Configurar `style={{ maxWidth: isMobile ? '95vw' : "75rem" }}`
- [ ] Configurar padding do body: `padding: isMobile ? 12 : 20` (manter px)
- [ ] Configurar título responsivo com fonte em rem
- [ ] Configurar `maxHeight: "calc(100vh - 12.5rem)"` (converter para rem)

#### **✅ Componentes Internos**
- [ ] Cards com padding responsivo (manter px para estabilidade)
- [ ] Títulos de cards com `fontSize: "0.875rem"` (tamanho único)
- [ ] Botões com tamanho e altura responsivos (manter px para estabilidade)
- [ ] Inputs com `size={isMobile ? "small" : "middle"}`
- [ ] Labels com fonte responsiva em rem
- [ ] Grid system com `xs={24}` para mobile
- [ ] Gutter responsivo: `gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}` (manter px)

#### **✅ Labels Mobile Específicos**
- [ ] Labels mobile com `<Space size="small">`
- [ ] Ícones com `color: "#059669"`
- [ ] Texto com `fontSize: "14px"` e `color: "#059669"`
- [ ] Asterisco obrigatório para mobile (`required`)

#### **✅ Botões de Ação (Form.List)**
- [ ] Posicionamento centralizado: `justifyContent: "center"`
- [ ] Espaçamento superior: `marginTop: "8px"` no mobile
- [ ] Separador visual: `borderTop: "1px solid #f0f0f0"` no mobile
- [ ] Validação de mínimo 1 item: `if (fields.length > 1)`
- [ ] Botão desabilitado: `disabled={fields.length <= 1}`
- [ ] Usar funções nativas: `add()` e `remove()` do Form.List

#### **✅ Tabelas**
- [ ] Usar `ResponsiveTable` em vez de `Table` comum
- [ ] Configurar `minWidthMobile` apropriado
- [ ] Paginação responsiva (ocultar controles em mobile)

#### **✅ Conversão px → rem**
- [ ] Converter para rem: `fontSize`, `borderWidth`, `borderRadius`, `boxShadow`, `maxWidth`, `maxHeight`
- [ ] Manter px: `padding`, `margin`, `height`, `width`, `gap`, `gutter` (estabilidade)
- [ ] Aplicar conversões de acordo com tabela de conversão

#### **✅ Footer Responsivo**
- [ ] Gap responsivo: `gap: isMobile ? "8px" : "12px"`
- [ ] MarginTop em rem: `marginTop: isMobile ? "1rem" : "1.5rem"`
- [ ] PaddingTop em px: `paddingTop: isMobile ? "12px" : "16px"`
- [ ] Botões com altura responsiva: `height: isMobile ? "32px" : "40px"`

#### **✅ Estados de Loading**
- [ ] Loading states responsivos
- [ ] Overlays com padding responsivo
- [ ] Mensagens com fonte responsiva

### **🎯 Modais Prioritários para Atualização**

#### **✅ Concluído**
1. **✅ NovoPedidoModal.js** - Modal principal de criação (CONCLUÍDO)

#### **🔴 Alta Prioridade (Sistema de Pedidos)**
2. **ColheitaModal.js** - Modal complexo com múltiplas seções
3. **PrecificacaoModal.js** - Modal com tabelas e cálculos
4. **PagamentoModal.js** - Modal de gestão de pagamentos
5. **VisualizarPedidoModal.js** - Modal de visualização completa

#### **🟡 Média Prioridade**
6. **LancarPagamentosModal.js** - Modal de pagamentos em lote
7. **VincularAreasModal.js** - Modal de vinculação de áreas
8. **VincularFitasModal.js** - Modal de vinculação de fitas
9. **VisualizarAreasFitasModal.js** - Modal de visualização
10. **FrutasPedidoModal.js** - Modal de frutas

#### **🟢 Baixa Prioridade (Outros Módulos)**
11. Modais de áreas agrícolas
12. Modais de clientes
13. Modais de fornecedores
14. Modais de turmas de colheita
15. Modais de configurações

### **📊 Padrões de Conversão px → rem**

```javascript
// ✅ Tabela de conversão (base: 16px = 1rem)
const conversaoRem = {
  // Pequenos
  '8px': '0.5rem',
  '10px': '0.625rem',
  '12px': '0.75rem',
  
  // Médios
  '14px': '0.875rem',
  '16px': '1rem',
  '18px': '1.125rem',
  
  // Grandes
  '20px': '1.25rem',
  '24px': '1.5rem',
  '32px': '2rem',
  
  // Extra grandes
  '40px': '2.5rem',
  '48px': '3rem'
};
```

### **🔧 Hook useResponsive (Já Implementado)**

```javascript
import useResponsive from '../hooks/useResponsive';

const { isMobile, isTablet, isDesktop } = useResponsive();

// Breakpoints:
// isMobile: < 576px
// isTablet: 576px - 992px  
// isDesktop: > 992px
```

### **📝 Exemplo Completo de Implementação**

```jsx
import React from 'react';
import { Modal, Button, Card, Row, Col, Space } from 'antd';
import useResponsive from '../hooks/useResponsive';
import ResponsiveTable from '../common/ResponsiveTable';

const ExemploModalResponsivo = ({ open, onClose }) => {
  const { isMobile } = useResponsive();
  
  return (
    <Modal
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "14px" : "16px",
          backgroundColor: "#059669",
          padding: isMobile ? "10px 12px" : "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          <IconOutlined style={{ marginRight: 8 }} />
          {isMobile ? 'Título Mobile' : 'Título Completo Desktop'}
        </span>
      }
      open={open}
      onCancel={onClose}
      width={isMobile ? '95vw' : 1400}
      footer={null}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0
        },
        wrapper: { zIndex: 1000 }
      }}
      centered
      destroyOnClose
    >
      <Card
        title={
          <Space>
            <IconCard style={{ color: "#ffffff" }} />
            <span style={{ 
              color: "#ffffff", 
              fontWeight: "600",
              fontSize: isMobile ? "13px" : "14px"
            }}>
              Seção do Modal
            </span>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            borderBottom: "2px solid #047857",
            color: "#ffffff",
            borderRadius: "8px 8px 0 0",
            padding: isMobile ? "6px 12px" : "8px 16px"
          },
          body: { 
            padding: isMobile ? "12px" : "16px"
          }
        }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={24} sm={12} md={8}>
            <Button
              size={isMobile ? "small" : "middle"}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
                fontSize: isMobile ? "0.75rem" : undefined,
                width: "100%"
              }}
            >
              Botão Responsivo
            </Button>
          </Col>
        </Row>
        
        <ResponsiveTable
          columns={colunas}
          dataSource={dados}
          rowKey="id"
          minWidthMobile={1200}
          showScrollHint={true}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile
          }}
        />
      </Card>
      
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: isMobile ? "8px" : "12px",
        marginTop: isMobile ? "1rem" : "1.5rem",
        paddingTop: isMobile ? "12px" : "16px",
        borderTop: "1px solid #e8e8e8",
      }}>
        <Button 
          onClick={onClose} 
          size={isMobile ? "small" : "middle"}
          style={{
            height: isMobile ? "32px" : "40px",
            padding: isMobile ? "0 12px" : "0 16px",
          }}
        >
          Fechar
        </Button>
        <Button
          type="primary"
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
            height: isMobile ? "32px" : "40px",
            padding: isMobile ? "0 12px" : "0 16px",
          }}
        >
          Salvar
        </Button>
      </div>
    </Modal>
  );
};
```

### **⚠️ Regras Importantes (Atualizadas)**

1. **SEMPRE importar `useResponsive`** antes de implementar responsividade
2. **SEMPRE usar `width={isMobile ? '95vw' : '90%'}`** e `maxWidth: "75rem"` para modais
3. **SEMPRE usar `xs={24}`** no grid system para mobile
4. **SEMPRE usar `ResponsiveTable`** em vez de `Table` comum
5. **SEMPRE aplicar padding/margin responsivos** em cards e seções (manter px para estabilidade)
6. **CONVERTER rem seletivamente**: fontSize, borderWidth, borderRadius, boxShadow, maxWidth, maxHeight
7. **MANTER px para**: padding, margin, height, width, gap, gutter (estabilidade de layout)
8. **SEMPRE testar em mobile** após implementação
9. **MANTER consistência** com padrões já estabelecidos
10. **USAR Form.List nativo** para botões adicionar/remover (não criar funções customizadas)
11. **CENTRALIZAR botões de ação** no mobile com separador visual
12. **VALIDAR mínimo 1 item** em listas dinâmicas
13. **APLICAR labels mobile específicos** com ícones e espaçamento compacto

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