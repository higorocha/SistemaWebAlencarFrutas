# Sistema de Geração de PDF

Sistema centralizado para geração de PDFs no backend NestJS usando **Handlebars** para templates HTML e **Puppeteer** para renderização.

## ⚡ Resumo Rápido

- **Endpoint:** `GET /api/pdf/pedido/:id` (protegido por JWT)
- **Templates:** Arquivos `.hbs` em `templates/`
- **Partials:** Cabeçalho e rodapé reutilizáveis em `templates/partials/`
- **Produção:** Configurar Build Command no Render: `npm run render:build`

## 📋 Índice

- [Arquitetura](#arquitetura)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Como Usar](#como-usar)
- [Templates e Partials](#templates-e-partials)
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
│   │   ├── header.hbs      # Cabeçalho reutilizável
│   │   └── footer.hbs      # Rodapé reutilizável
│   └── relatorio-pedidos.hbs  # Template de pedido
├── pdf.module.ts           # Módulo NestJS
├── pdf.service.ts          # Serviço de geração
├── pdf.controller.ts       # Controller HTTP
└── README.md               # Esta documentação
```

## 🚀 Como Usar

### 1. Endpoint HTTP (Web/Mobile)

```typescript
// GET /api/pdf/pedido/:id
// Retorna PDF como stream para download
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
  
  const pdfBuffer = await this.pdfService.gerarPdf('relatorio-pedidos', dadosTemplate);
  
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

No painel do Render.com (Settings > Build & Deploy), configure:

1. **Build Command:**
   ```
   npm run render:build
   ```
   Este comando:
   - Executa `ensure-chrome.js` para garantir que o Chrome está instalado
   - Compila o projeto TypeScript com `npm run build:prod`

2. **Start Command:**
   ```
   npm run render:start
   ```
   Este comando:
   - Aplica migrations do Prisma (`prisma migrate deploy`)
   - Inicia o servidor em produção (`npm run start:prod`)

**Importante:** Certifique-se de que o Build Command está configurado corretamente no Render.com!

### Variável de Ambiente (Opcional)

Se necessário, você pode definir no Render.com:

- **Nome:** `PUPPETEER_EXECUTABLE_PATH`
- **Valor:** Caminho completo do Chrome (geralmente não necessário)

**Como encontrar o caminho:**
```bash
find ~/.cache/puppeteer -name "chrome" -type f
```

### Troubleshooting no Render

#### Erro: "Could not find Chrome"

**Solução 1:** Verificar se o Build Command está correto
- Deve ser: `npm run render:build`
- Não use apenas `npm run build:prod`

**Solução 2:** Adicionar script de instalação manual
- No Render, adicione um script de build que instala o Chrome:
  ```bash
  npx puppeteer browsers install chrome && npm run build:prod
  ```

**Solução 3:** Usar Buildpack (Alternativa)
- No Render, adicione o buildpack: `heroku-buildpack-google-chrome`
- Isso instala o Chrome do sistema

#### Verificar Instalação

Para verificar se o Chrome foi instalado (via SSH no Render):
```bash
ls -la ~/.cache/puppeteer/chrome/
```

### Scripts Disponíveis

```json
{
  "scripts": {
    "puppeteer:install": "npx puppeteer browsers install chrome",
    "render:build": "npm run puppeteer:install && npm run build:prod",
    "render:start": "npm run prisma:deploy && npm run start:prod"
  }
}
```

## ➕ Adicionando Novos Templates

### Passo 1: Criar o Template

Crie um novo arquivo `.hbs` em `templates/`:

```handlebars
<!-- templates/relatorio-frutas.hbs -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Seus estilos */
  </style>
</head>
<body>
  {{> header titulo="Relatório de Frutas"}}
  
  <!-- Seu conteúdo -->
  
  {{> footer}}
</body>
</html>
```

### Passo 2: Criar Endpoint (Opcional)

Se quiser expor via HTTP:

```typescript
// pdf.controller.ts
@Get('frutas/:id')
async downloadFrutasPdf(@Param('id') id: string, @Res() res: Response) {
  const dados = await this.frutasService.findOne(+id);
  const dadosTemplate = this.prepararDadosFrutas(dados);
  const buffer = await this.pdfService.gerarPdf('relatorio-frutas', dadosTemplate);
  
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=frutas-${id}.pdf`,
  });
  res.end(buffer);
}
```

### Passo 3: Usar Internamente

```typescript
const buffer = await this.pdfService.gerarPdf('relatorio-frutas', dadosFormatados);
```

## 📧 Integração com Email

O `PdfService` retorna um `Buffer` que pode ser usado diretamente no Nodemailer:

```typescript
// Exemplo em um service de notificações
const pdfBuffer = await this.pdfService.gerarPdf('relatorio-pedidos', dadosPedido);

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

Cada template recebe dados específicos preparados no controller. Para o template `relatorio-pedidos`:

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

Antes de fazer deploy, verifique:

- [ ] Build Command configurado: `npm run render:build`
- [ ] Start Command configurado: `npm run render:start`
- [ ] Dependências `puppeteer` e `handlebars` estão em `dependencies` (não `devDependencies`)
- [ ] Script `ensure-chrome.js` existe em `scripts/`
- [ ] Dados da empresa configurados no sistema (para aparecer no header/footer)

### Teste Pós-Deploy

1. Acesse: `https://seu-backend.onrender.com/api/pdf/pedido/1` (com autenticação)
2. Deve retornar um PDF para download
3. Verifique os logs no Render para erros

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
│   │   ├── header.hbs      ✅ Cabeçalho reutilizável
│   │   └── footer.hbs      ✅ Rodapé reutilizável
│   └── relatorio-pedidos.hbs ✅ Template de pedido
├── pdf.module.ts           ✅ Módulo NestJS
├── pdf.service.ts          ✅ Serviço de geração
├── pdf.controller.ts       ✅ Controller HTTP
└── README.md               ✅ Documentação completa

backend/scripts/
└── ensure-chrome.js        ✅ Script de instalação do Chrome
```

## 📚 Referências

- [Puppeteer Documentation](https://pptr.dev/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Render.com Deployment](https://render.com/docs)
- [Puppeteer Chrome Installation](https://pptr.dev/guides/configuration#chrome-executable-path)

---

**Última atualização:** Novembro 2025
**Versão:** 1.0.0

