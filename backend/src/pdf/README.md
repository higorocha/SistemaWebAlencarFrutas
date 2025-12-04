# Sistema de Geração de PDF

Sistema centralizado para geração de PDFs no backend NestJS usando **Handlebars** para templates HTML e **Puppeteer** para renderização.

## ⚡ Resumo Rápido

- **Endpoints:** 
  - `GET /api/pdf/pedido/:id` - PDF de pedido individual
  - `POST /api/pdf/pedidos-cliente/:clienteId` - PDF de pedidos do cliente
- **Templates:** Arquivos `.hbs` em `templates/`
  - `pedido-criado.hbs` - PDF de pedido individual
  - `pedidos-cliente.hbs` - PDF de lista de pedidos do cliente
- **Partials:** Cabeçalho reutilizável em `templates/partials/header.hbs`
- **Rodapé:** Gerado via `displayHeaderFooter` do Puppeteer (não usa partial)
- **Chrome:** Instalação **automática** na primeira execução (sem configuração extra)
- **Render.com:** Funciona com suas configurações atuais, sem mudanças necessárias

## 📋 Índice

- [Arquitetura](#arquitetura)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Como Usar](#como-usar)
- [Templates e Partials](#templates-e-partials)
- [Mapa de Templates](#-mapa-de-templates)
- [Configuração para Produção (Render.com)](#configuração-para-produção-rendercom)
- [Adicionando Novos Templates](#adicionando-novos-templates)
- [Integração com Email](#integração-com-email)

## 🏗️ Arquitetura

O sistema foi projetado para ser **escalável** e **reutilizável**:

```
┌─────────────────┐
│  Frontend/Mobile│
│  ou Email       │
└────────┬────────┘
         │
         │ GET /api/pdf/pedido/:id
         ▼
┌─────────────────┐
│  PdfController  │
│  - Busca dados   │
│  - Formata dados│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PdfService    │
│  - Carrega .hbs  │
│  - Compila HTML  │
│  - Gera PDF      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Puppeteer      │
│  (Chrome Headless)│
└─────────────────┘
```

### Componentes Principais

1. **PdfService**: Serviço central que gerencia a geração de PDFs
2. **PdfController**: Endpoints HTTP para acesso via Web/Mobile
3. **Templates Handlebars**: Arquivos `.hbs` com HTML/CSS
4. **Partials**: Componentes reutilizáveis (header/footer)

## 📁 Estrutura de Arquivos

```
backend/src/pdf/
├── templates/
│   ├── partials/
│   │   ├── header.hbs      # Cabeçalho reutilizável (logo, nome empresa, qualificação)
│   │   └── footer.hbs      # Rodapé reutilizável (não usado atualmente - footer via Puppeteer)
│   ├── pedido-criado.hbs   # Template de PDF para pedidos criados
│   └── assets/
│       └── img/
│           └── logoEstendido.png  # Logo da empresa
├── pdf.module.ts           # Módulo NestJS
├── pdf.service.ts          # Serviço de geração (Handlebars + Puppeteer)
├── pdf.controller.ts       # Controller HTTP (endpoints de PDF)
└── README.md               # Esta documentação
```

## 🚀 Como Usar

### 1. Endpoints HTTP (Web/Mobile)

```typescript
// GET /api/pdf/pedido/:id
// Retorna PDF como stream para download de pedido individual

// POST /api/pdf/pedidos-cliente/:clienteId
// Body: { pedidosIds?: number[] } // Opcional - IDs dos pedidos a incluir
// Retorna PDF como stream para download de pedidos do cliente
```

**Exemplo no Frontend:**
```javascript
const response = await axiosInstance.get(`/api/pdf/pedido/${pedidoId}`, {
  responseType: 'blob',
});

const blob = new Blob([response.data], { type: 'application/pdf' });
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `pedido-${numeroPedido}.pdf`;
link.click();
```

### 2. Uso Interno (Email, etc.)

```typescript
// Em qualquer service do NestJS
constructor(private pdfService: PdfService) {}

async enviarEmailComPdf() {
  const dadosTemplate = {
    // ... dados formatados
  };
  
  const pdfBuffer = await this.pdfService.gerarPdf('pedido-criado', dadosTemplate);
  
  await this.mailerService.sendMail({
    to: cliente.email,
    subject: 'Detalhes do Pedido',
    attachments: [{
      filename: 'pedido.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  });
}
```

## 🎨 Templates e Partials

### Partials Reutilizáveis

O sistema usa **Handlebars Partials** para componentes reutilizáveis:

#### Header (`partials/header.hbs`)

Cabeçalho padrão com dados da empresa:
- Nome fantasia e razão social
- CNPJ
- Contato e endereço
- Título e subtítulo do documento

**Dados disponíveis:**
- `empresa`: Objeto com dados da empresa (do ConfigService)
- `titulo`: Título principal
- `subtitulo`: Subtítulo (ex: número do pedido)

#### Footer (`partials/footer.hbs`)

Rodapé padrão:
- Nome da empresa e CNPJ
- Data de geração
- Numeração de páginas (quando implementado)

**Dados disponíveis:**
- `empresa`: Dados da empresa
- `dataGeracaoFormatada`: Data formatada
- `paginaAtual` / `totalPaginas`: Para numeração

### Usando Partials em Templates

```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Seus estilos CSS aqui */
  </style>
</head>
<body>
  {{!-- Cabeçalho reutilizável --}}
  {{> header}}
  
  {{!-- Seu conteúdo específico --}}
  <div class="conteudo">
    <!-- ... -->
  </div>
  
  {{!-- Rodapé reutilizável --}}
  {{> footer}}
</body>
</html>
```

## 🌐 Configuração para Produção (Render.com)

### Problema

No Render.com, o Puppeteer precisa encontrar o Chrome instalado. Por padrão, o Chrome não vem instalado no ambiente.

### Solução Implementada

O sistema foi configurado para funcionar automaticamente no Render.com:

1. **Script de Build Customizado**
   - O script `render:build` instala o Chrome antes de compilar
   - Comando: `npm run puppeteer:install` (instala Chrome via Puppeteer)

2. **Configuração Automática do Executável**
   - O `PdfService` detecta automaticamente o Chrome instalado
   - Suporta variável `PUPPETEER_EXECUTABLE_PATH` se necessário

### Configuração no Render.com

**✅ Boa notícia:** O sistema agora instala o Chrome **automaticamente** quando necessário! Não é preciso configurar nada especial no Render.

No painel do Render.com (Settings > Build & Deploy), use suas configurações normais:

1. **Build Command:** (seu comando atual, ex: `npm run build:prod`)
2. **Start Command:** (seu comando atual, ex: `npm run render:start`)

**Como funciona:**
- Na primeira execução que precisar gerar PDF, se o Chrome não for encontrado, o sistema tenta instalar automaticamente
- A instalação acontece **durante a execução** (não no build)
- Após instalado, o Chrome fica disponível para todas as próximas requisições

## 🔧 Como Funciona a Instalação do Chrome

### Instalação Automática (Solução Atual)

O sistema usa **instalação automática sob demanda** - você não precisa fazer nada!

#### Fluxo Completo:

```
1. Usuário solicita PDF
   ↓
2. PdfService.gerarPdf() é chamado
   ↓
3. Puppeteer tenta iniciar Chrome
   ↓
4. Chrome encontrado? 
   ├─ SIM → Gera PDF normalmente (segundos)
   └─ NÃO → Instala Chrome automaticamente
              ↓
              Executa: npx puppeteer browsers install chrome
              ↓
              Aguarda instalação (2-5 minutos na primeira vez)
              ↓
              Tenta iniciar Chrome novamente
              ↓
              Gera PDF
```

#### Detalhes Técnicos:

1. **Primeira requisição de PDF (quando Chrome não existe):**
   ```typescript
   // PdfService detecta erro "Could not find Chrome"
   // Define flag: chromeInstallAttempted = true
   // Executa: execSync('npx puppeteer browsers install chrome')
   // Timeout: 5 minutos (instalação pode ser lenta)
   // Após instalação: tenta iniciar Chrome novamente
   ```

2. **Próximas requisições:**
   - Chrome já está em `/opt/render/.cache/puppeteer/chrome/`
   - Puppeteer encontra automaticamente
   - Geração de PDF é rápida (2-10 segundos)

3. **Proteção contra loops:**
   - Flag `chromeInstallAttempted` evita tentativas repetidas
   - Se instalação falhar, retorna erro claro

### Onde o Chrome Fica Armazenado?

No Render.com, o Chrome é instalado em:
```
/opt/render/.cache/puppeteer/chrome/
```

Este diretório:
- ✅ **Persiste entre reinicializações** do serviço
- ✅ **Não é apagado** quando você faz novo deploy
- ✅ **Fica disponível** para todas as instâncias do serviço

### Comportamento do Render.com

#### ✅ O que PERSISTE (não é apagado):
- Arquivos em `/opt/render/.cache/` (cache do Puppeteer)
- Arquivos em `node_modules/` (após `npm install`)
- Banco de dados e dados persistentes

#### ❌ O que é APAGADO em cada deploy:
- Arquivos compilados em `dist/` (são recriados no build)
- Arquivos temporários

**Conclusão:** O Chrome instalado em `/opt/render/.cache/puppeteer/` **permanece** entre deploys! Você só precisa instalar uma vez.

### Quando o Chrome Precisa Ser Reinstalado?

#### ✅ Chrome NÃO precisa ser reinstalado quando:
- Você faz **novo deploy** (push no git)
- O serviço **reinicia** (restart manual ou automático)
- Você **atualiza dependências** (`npm install`)
- Você **compila novamente** (`npm run build`)

**Por quê?** O diretório `/opt/render/.cache/puppeteer/` **persiste** entre esses eventos.

#### ❌ Chrome PRECISA ser reinstalado quando:
1. **Serviço é criado pela primeira vez** (serviço novo no Render)
2. **Cache foi limpo manualmente** (ação rara, via SSH)
3. **Serviço foi deletado e recriado** (não apenas redeploy)
4. **Render limpa o cache** (ação automática rara do Render)

**Na prática:** 
- Primeira requisição de PDF em um serviço novo → Instala automaticamente (2-5 min)
- Todas as próximas requisições → Rápido (segundos)
- Após a primeira instalação, o Chrome fica disponível **permanentemente**

### Performance

| Situação | Tempo de Resposta |
|----------|-------------------|
| Primeira requisição (instalando Chrome) | 2-5 minutos |
| Requisições subsequentes | 2-10 segundos |
| Após reinicialização do serviço | 2-10 segundos (Chrome já instalado) |

### Variável de Ambiente (Opcional)

Se necessário, você pode definir no Render.com:

- **Nome:** `PUPPETEER_EXECUTABLE_PATH`
- **Valor:** Caminho completo do Chrome (geralmente **não necessário**)

**Quando usar:** Apenas se quiser usar uma versão específica do Chrome ou se o caminho padrão não funcionar.

### Troubleshooting no Render

#### Erro: "Chrome não encontrado" (mesmo após instalação automática)

**Possíveis causas:**
1. Instalação falhou (verifique logs do servidor)
2. Permissões insuficientes (improvável no Render)
3. Cache foi limpo manualmente

**Solução:**
- Verifique os logs do servidor para ver a mensagem de erro completa
- A primeira requisição pode demorar 2-5 minutos (instalação do Chrome)
- Se persistir, verifique se o serviço tem permissões de escrita em `/opt/render/.cache/`

#### Verificar Instalação (via SSH no Render)

Se tiver acesso SSH:
```bash
ls -la /opt/render/.cache/puppeteer/chrome/
```

### Scripts Disponíveis

```json
{
  "scripts": {
    "puppeteer:install": "npx puppeteer browsers install chrome",
    "ensure-chrome": "node scripts/ensure-chrome.js",
    "render:build": "npm run ensure-chrome && npm run build:prod",
    "render:start": "npm run prisma:deploy && npm run start:prod"
  }
}
```

**Nota:** Os scripts `puppeteer:install` e `ensure-chrome` são opcionais. O sistema instala automaticamente quando necessário.

## 🗺️ Mapa de Templates

Para uma documentação detalhada de cada template, incluindo de onde vem as chamadas, quais dados utiliza e sua estrutura, consulte:

📄 **[mapa-templates.md](./mapa-templates.md)**

---

## 📋 Mapeamento de Métodos e Templates

Abaixo está o mapeamento completo de cada método do `PdfController` e seu template correspondente:

### Template: `pedido-criado.hbs`

**Endpoint:** `GET /api/pdf/pedido/:id`

**Métodos relacionados:**
- `downloadPedidoPdf()` - Método principal que gera o PDF
  - Usa template: `pedido-criado.hbs`
  - Chamado de: `VisualizarPedidoModal.js`
- `prepararDadosTemplate()` - Prepara dados formatados para o template
  - Formata valores, datas, status e frutas do pedido

### Template: `folha-pagamento.hbs`

**Endpoint:** `GET /api/pdf/folha-pagamento/:id`

**Métodos relacionados:**
- `downloadFolhaPagamentoPdf()` - Método principal que gera o PDF
  - Usa template: `folha-pagamento.hbs`
  - Chamado de: Módulo ARH - Folha de Pagamento
- `prepararDadosTemplateFolha()` - Prepara dados formatados para o template
  - Formata valores, datas e agrupa lançamentos
- `prepararDadosGraficoHistorico()` - Prepara dados do gráfico Chart.js
  - Método auxiliar usado dentro do template
- `agruparLancamentosPorGerente()` - Agrupa lançamentos por gerente
  - Método auxiliar usado por `prepararDadosTemplateFolha()`
- `formatarAbasLancamentos()` - Formata abas de lançamentos
  - Método auxiliar usado por `prepararDadosTemplateFolha()`
- `formatarLancamentos()` - Formata lista de lançamentos
  - Método auxiliar usado por `formatarAbasLancamentos()`
- `calcularResumoDetalhado()` - Calcula resumo da folha
  - Método auxiliar usado por `prepararDadosTemplateFolha()`

### Template: `pedidos-cliente.hbs`

**Endpoint:** `POST /api/pdf/pedidos-cliente/:clienteId`

**Métodos relacionados:**
- `downloadPedidosClientePdf()` - Método principal que gera o PDF
  - Usa template: `pedidos-cliente.hbs`
  - Chamado de: `PedidosClienteModal.js` - botão "Exportar PDF"
  - Aceita body: `{ pedidosIds?: number[] }` para seleção de pedidos
- `prepararDadosTemplatePedidosCliente()` - Prepara dados formatados para o template
  - Formata dados do cliente, pedidos e frutas
  - Prioriza `quantidadePrecificada`/`unidadePrecificada`, com fallback para `quantidadeReal`/`unidadeMedida1`

### Métodos Auxiliares (Compartilhados)

**Métodos utilizados por múltiplos templates:**
- `gerarNomeArquivo()` - Gera nome sanitizado para o arquivo PDF
  - Usado por todos os endpoints
- `carregarLogoBase64()` - Carrega logo da empresa em base64
  - Usado por todos os templates que exibem header

---

## 📄 Templates Disponíveis

### Arquivos `.hbs` - O que são?

Os arquivos `.hbs` (Handlebars) são **templates HTML** que definem a estrutura e o layout dos PDFs gerados. Cada template representa um tipo diferente de documento que o sistema pode gerar.

**Estrutura básica:**
- **HTML/CSS padrão:** Você pode usar todo o poder do HTML e CSS para criar layouts complexos
- **Handlebars:** Sistema de templating que permite injetar dados dinâmicos usando `{{variável}}`
- **Partials:** Componentes reutilizáveis (como `header.hbs`) que podem ser incluídos em múltiplos templates

### `pedido-criado.hbs`

**Propósito:** Template para geração de PDF de **resumo básico do pedido**, emitido na criação do pedido com informações essenciais.

**Status atual:** 
- ⚠️ Atualmente sendo chamado no `VisualizarPedidoModal.js` para testes
- 🔄 Será ajustado futuramente para ser chamado automaticamente na criação do pedido
- 📝 Por enquanto, serve como base para desenvolvimento e testes

**Endpoint:** `GET /api/pdf/pedido/:id`

### `folha-pagamento.hbs`

**Propósito:** Template para geração de PDF de **folha de pagamento completa**, incluindo lançamentos agrupados por gerente, gráfico histórico e resumo detalhado.

**Chamada:**
- **Frontend:** Módulo ARH - Folha de Pagamento - botão de exportar PDF

**Endpoint:** `GET /api/pdf/folha-pagamento/:id`

**Características:**
- Informações completas da folha (competência, período, valores)
- Resumo detalhado com totais
- Gráfico histórico das últimas 6 folhas (Chart.js)
- Lançamentos agrupados por gerente em abas
- Formatação completa de valores e datas

### `pedidos-cliente.hbs`

**Propósito:** Template para geração de PDF de **lista de pedidos do cliente**, incluindo todas as frutas e quantidades colhidas de cada pedido.

**Chamada:**
- **Frontend:** `PedidosClienteModal.js` - botão "Exportar PDF"
- Permite seleção de pedidos específicos via checkboxes ou incluir todos os pedidos filtrados

**Endpoint:** `POST /api/pdf/pedidos-cliente/:clienteId`

**Características:**
- Qualificação completa do cliente
- Lista de pedidos selecionados/filtrados
- Para cada pedido: número do pedido, NF, data, tabela de frutas com quantidades
- Totalização dos valores dos pedidos
- Respeita filtros aplicados no frontend
- Permite seleção manual de pedidos via checkboxes

**Conteúdo do Documento:**
1. **Cabeçalho (Partial `header.hbs`):**
   - Logo da empresa (esquerda) - carregada de `src/pdf/assets/img/logoEstendido.png`
   - Nome fantasia da empresa (centro) - verde, uppercase
   - Qualificação da empresa (direita): CNPJ, telefone, endereço completo - cinza
   - Título do documento: "Pedido Criado - Pedido #XXX"

2. **Informações Básicas do Pedido:**
   - Cliente
   - Data do Pedido
   - Data Prevista Colheita
   - Data da Colheita (se houver)
   - Status (com badge colorido)

3. **Frutas do Pedido:**
   - Tabela com: Fruta, Quantidade Prevista, Quantidade Real (se houver), Valor Unitário e Total (se houver)
   - Exibe cultura e indicação de "1ª" quando aplicável

4. **Totais (se houver valores):**
   - Frete, ICMS, Desconto, Avaria
   - Total Geral
   - Valor Recebido

5. **Observações:**
   - Observações gerais do pedido
   - Observações da colheita (se houver)

6. **Rodapé (via Puppeteer `displayHeaderFooter`):**
   - Esquerda: Razão Social (verde, bold) e CNPJ (cinza)
   - Centro: "Sistemas de Informações - AlencarFrutas" (cinza)
   - Direita: Número da página e data de geração (cinza)

**Dados necessários:** Pedido completo com relacionamentos preparados pelo `PdfController.prepararDadosTemplate()`

### `partials/header.hbs`

**Propósito:** Partial reutilizável que define o cabeçalho padrão de todos os PDFs.

**Características:**
- Layout profissional com logo, nome da empresa e qualificação
- Pode ser incluído em qualquer template usando `{{> header}}`
- Recebe dados da empresa via objeto `empresa` no contexto do template
- Suporta logo em base64 (carregada automaticamente pelo controller)

### `partials/footer.hbs`

**Propósito:** Partial de rodapé (atualmente não utilizado).

**Nota:** O rodapé é gerado via `displayHeaderFooter` do Puppeteer no `pdf.service.ts`, permitindo numeração automática de páginas e posicionamento fixo no final de cada página. O arquivo `footer.hbs` existe para referência futura, caso seja necessário usar partials para o rodapé.

## ➕ Adicionando Novos Templates

### Passo 1: Criar o Template

Crie um novo arquivo `.hbs` em `templates/`:

```handlebars
<!-- templates/novo-template.hbs -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Seus estilos */
  </style>
</head>
<body>
  {{> header titulo="Título do Documento"}}
  
  <!-- Seu conteúdo -->
  
  <!-- Nota: Rodapé é gerado automaticamente via Puppeteer displayHeaderFooter -->
</body>
</html>
```

### Passo 2: Criar Endpoint (Opcional)

Se quiser expor via HTTP:

```typescript
// pdf.controller.ts
@Get('novo-endpoint/:id')
async downloadNovoPdf(@Param('id') id: string, @Res() res: Response) {
  const dados = await this.service.findOne(+id);
  const dadosTemplate = this.prepararDados(dados);
  const buffer = await this.pdfService.gerarPdf('novo-template', dadosTemplate);
  
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=frutas-${id}.pdf`,
  });
  res.end(buffer);
}
```

### Passo 3: Usar Internamente

```typescript
const buffer = await this.pdfService.gerarPdf('novo-template', dadosFormatados);
```

## 📧 Integração com Email

O `PdfService` retorna um `Buffer` que pode ser usado diretamente no Nodemailer:

```typescript
// Exemplo em um service de notificações
  const pdfBuffer = await this.pdfService.gerarPdf('pedido-criado', dadosPedido);

await this.mailerService.sendMail({
  to: cliente.email,
  subject: 'Detalhes do Pedido',
  html: '<p>Segue em anexo o PDF do seu pedido.</p>',
  attachments: [{
    filename: `pedido-${pedido.numeroPedido}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]
});
```

## 🎯 Dados Disponíveis nos Templates

### Dados Globais (sempre disponíveis)

- `empresa`: Dados da empresa (do ConfigService)
- `dataGeracaoFormatada`: Data/hora de geração formatada

### Dados Específicos por Template

Cada template recebe dados específicos preparados no controller. Para o template `pedido-criado`:

- `numeroPedido`: Número do pedido
- `cliente`: Dados do cliente
- `statusFormatado`: Status formatado
- `frutasPedidos`: Array de frutas com formatação
- `valorFinalFormatado`: Valor final formatado
- E outros campos do pedido...

## 🔧 Formatação de Dados

O `PdfController` possui métodos privados para formatar dados:

- `formatCurrencyBR()`: Valores monetários (R$ 1.234,56)
- `formatDateBR()`: Datas (DD/MM/YYYY)
- `formatNumber()`: Números com separadores

Esses formatadores são aplicados automaticamente antes de passar os dados para o template.

## 📝 Helpers do Handlebars

O sistema usa Handlebars padrão. Helpers úteis disponíveis:

- `{{#if}}` / `{{#unless}}`: Condicionais
- `{{#each}}`: Loops
- `{{> partial}}`: Incluir partials
- `{{variable}}`: Interpolação

## ⚠️ Observações Importantes

1. **CSS Inline**: Use CSS inline nos templates, pois o Puppeteer renderiza melhor
2. **Cores de Fundo**: Use `printBackground: true` no `page.pdf()` para imprimir cores
3. **Timeouts**: Configurados para 30 segundos (ajustável se necessário)
4. **Performance**: Cada geração de PDF inicia um novo browser (considerar pool de browsers para alta demanda)

## 🐛 Troubleshooting

### Erro: "Could not find Chrome"

**Solução:** Execute `npm run puppeteer:install` ou defina `PUPPETEER_EXECUTABLE_PATH`

### Erro: "ECONNRESET"

**Solução:** Aumentar timeout ou verificar recursos do servidor

### PDF sem cores

**Solução:** Verificar se `printBackground: true` está configurado

### Template não encontrado

**Solução:** Verificar se o arquivo `.hbs` existe em `templates/` e o nome está correto

## ✅ Checklist de Deploy no Render.com

**✅ Boa notícia:** Não precisa configurar nada especial! O sistema instala o Chrome automaticamente.

Antes de fazer deploy, verifique apenas:

- [ ] Dependências `puppeteer` e `handlebars` estão em `dependencies` (não `devDependencies`)
- [ ] Dados da empresa configurados no sistema (para aparecer no header/footer)
- [ ] Build e Start Commands do Render estão funcionando normalmente (seus comandos atuais)

**Não precisa:**
- ❌ Adicionar scripts de instalação do Chrome no Build Command
- ❌ Configurar variáveis de ambiente especiais
- ❌ Usar buildpacks adicionais

### Teste Pós-Deploy

1. **Primeira requisição** (pode demorar 2-5 minutos):
   - Acesse: `https://seu-backend.onrender.com/api/pdf/pedido/1` (com autenticação)
   - O sistema vai instalar o Chrome automaticamente
   - Aguarde a conclusão (verifique os logs)

2. **Próximas requisições** (rápido, 2-10 segundos):
   - Deve retornar o PDF imediatamente
   - Chrome já está instalado e pronto

3. **Verifique os logs** no Render para confirmar:
   - Primeira vez: `"Chrome não encontrado. Tentando instalar automaticamente..."`
   - Depois: `"✅ Chrome instalado com sucesso"`
   - Próximas: `"PDF gerado com sucesso"`

## 📊 Resumo da Implementação

### O que foi criado:

1. ✅ **PdfService**: Serviço centralizado para geração de PDFs
2. ✅ **PdfController**: Endpoint HTTP `/api/pdf/pedido/:id`
3. ✅ **Templates Handlebars**: Sistema de templates HTML/CSS
4. ✅ **Partials Reutilizáveis**: Header e Footer para todos os templates
5. ✅ **Integração com ConfigService**: Dados da empresa no header/footer
6. ✅ **Scripts de Build**: Instalação automática do Chrome
7. ✅ **Documentação Completa**: Este README.md

### Estrutura Final:

```
backend/src/pdf/
├── templates/
│   ├── partials/
│   │   ├── header.hbs      ✅ Cabeçalho reutilizável (logo, empresa, qualificação)
│   │   └── footer.hbs      ✅ Rodapé reutilizável (não usado - footer via Puppeteer)
│   ├── pedido-criado.hbs   ✅ Template de PDF para pedidos
│   └── assets/
│       └── img/
│           └── logoEstendido.png  ✅ Logo da empresa
├── pdf.module.ts           ✅ Módulo NestJS
├── pdf.service.ts          ✅ Serviço de geração (Handlebars + Puppeteer)
├── pdf.controller.ts       ✅ Controller HTTP (endpoints de PDF)
└── README.md               ✅ Documentação completa

backend/scripts/
└── ensure-chrome.js        ✅ Script de instalação do Chrome (não usado - instalação automática)
```

## 📚 Referências

- [Puppeteer Documentation](https://pptr.dev/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Render.com Deployment](https://render.com/docs)
- [Puppeteer Chrome Installation](https://pptr.dev/guides/configuration#chrome-executable-path)

---

**Última atualização:** Novembro 2025
**Versão:** 1.0.0

