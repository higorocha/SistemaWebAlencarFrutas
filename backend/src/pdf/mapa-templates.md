# Mapa de Templates PDF

Documentação simples dos templates de PDF disponíveis no sistema.

## 📋 Índice

- [pedido-criado.hbs](#pedido-criadohbs)
- [partials/header.hbs](#partialsheaderhbs)
- [partials/footer.hbs](#partialsfooterhbs)

---

## pedido-criado.hbs

### O que é?
Template de **resumo básico do pedido**, emitido na criação do pedido com informações essenciais.

### De onde vem a chamada?
- **Atualmente:** `VisualizarPedidoModal.js` (linha ~95) - apenas para testes
- **Futuro:** Será chamado automaticamente na criação do pedido (a implementar)

### Endpoint
```
GET /api/pdf/pedido/:id
```

### Controller
`PdfController.downloadPedidoPdf()` (linha ~56)

### Dados utilizados
Preparados pelo método `PdfController.prepararDadosTemplate()`:

**Dados do Pedido:**
- `numeroPedido` - Número do pedido
- `cliente` - Objeto com dados do cliente (nome, etc.)
- `statusFormatado` - Status formatado para exibição
- `statusLower` - Status em minúsculas para classes CSS
- `dataPedidoFormatada` - Data do pedido formatada (DD/MM/YYYY)
- `dataPrevistaColheitaFormatada` - Data prevista de colheita formatada
- `dataColheitaFormatada` - Data da colheita formatada (se houver)
- `observacoes` - Observações gerais do pedido
- `observacoesColheita` - Observações da colheita (se houver)

**Dados das Frutas:**
- `frutasPedidos` - Array de frutas do pedido com:
  - `fruta.nome` - Nome da fruta
  - `fruta.dePrimeira` - Se é de primeira
  - `fruta.cultura.descricao` - Descrição da cultura
  - `quantidadePrevistaFormatada` - Quantidade prevista formatada
  - `quantidadeRealFormatada` - Quantidade real formatada (se houver)
  - `valorUnitarioFormatado` - Valor unitário formatado (se houver)
  - `valorTotalFormatado` - Valor total formatado (se houver)
  - `unidadeMedida1` - Unidade de medida principal
  - `unidadeMedida2` - Unidade de medida secundária (se houver)

**Dados Financeiros:**
- `freteFormatado` - Frete formatado (se houver)
- `icmsFormatado` - ICMS formatado (se houver)
- `descontoFormatado` - Desconto formatado (se houver)
- `avariaFormatada` - Avaria formatada (se houver)
- `valorFinalFormatado` - Valor final formatado (se houver)
- `valorRecebidoFormatado` - Valor recebido formatado (se houver)
- `temValores` - Flag indicando se há valores para exibir
- `temQuantidadeReal` - Flag indicando se há quantidades reais
- `temValorUnitario` - Flag indicando se há valores unitários

**Dados da Empresa:**
- `empresa` - Objeto com dados da empresa:
  - `nome_fantasia` - Nome fantasia
  - `razao_social` - Razão social
  - `cnpj` - CNPJ formatado
  - `telefone` - Telefone formatado
  - `logradouro` - Logradouro
  - `bairro` - Bairro
  - `cidade` - Cidade
  - `estado` - Estado
  - `cep` - CEP

**Dados do Documento:**
- `logoPath` - Logo em base64 (carregada de `src/pdf/assets/img/logoEstendido.png`)
- `titulo` - Título do documento ("Pedido Criado")
- `subtitulo` - Subtítulo do documento ("Pedido #XXX")
- `dataGeracaoFormatada` - Data de geração formatada (para o rodapé)
- `anoAtual` - Ano atual (para o rodapé)

### Estrutura do PDF gerado
1. **Cabeçalho** (via `{{> header}}`)
2. **Informações do Pedido** (cliente, datas, status)
3. **Tabela de Frutas** (quantidades e valores)
4. **Totais** (frete, ICMS, desconto, avaria, valor final, valor recebido)
5. **Observações** (gerais e da colheita)
6. **Rodapé** (via Puppeteer `displayHeaderFooter`)

---

## partials/header.hbs

### O que é?
Partial reutilizável que define o **cabeçalho padrão** de todos os PDFs.

### De onde vem a chamada?
Incluído em templates usando:
```handlebars
{{> header}}
```

### Dados utilizados
- `logoPath` - Logo em base64 (string) ou `null`
- `empresa.nome_fantasia` - Nome fantasia da empresa
- `empresa.razao_social` - Razão social da empresa
- `empresa.cnpj` - CNPJ formatado
- `empresa.telefone` - Telefone formatado
- `empresa.logradouro` - Logradouro
- `empresa.bairro` - Bairro
- `empresa.cidade` - Cidade
- `empresa.estado` - Estado
- `empresa.cep` - CEP
- `titulo` - Título do documento (opcional)
- `subtitulo` - Subtítulo do documento (opcional)

### Estrutura
- **Esquerda:** Logo da empresa (ou placeholder se não houver logo)
- **Centro:** Nome fantasia (verde, uppercase) e razão social (cinza, itálico)
- **Direita:** Qualificação da empresa (CNPJ, telefone, endereço completo) - cinza
- **Título:** Título e subtítulo do documento (se fornecido)

---

## partials/footer.hbs

### O que é?
Partial de rodapé (atualmente **não utilizado**).

### Status
⚠️ **Não está sendo usado** - O rodapé é gerado via `displayHeaderFooter` do Puppeteer no `pdf.service.ts` para permitir:
- Numeração automática de páginas
- Posicionamento fixo no final de cada página
- Injeção dinâmica de dados (razão social, CNPJ, data de geração)

### Por que existe?
Mantido para referência futura, caso seja necessário usar partials para o rodapé em vez do método atual do Puppeteer.

---

## 📝 Notas Gerais

### Formatação de Dados
Todos os dados são formatados no `PdfController.prepararDadosTemplate()` usando utilitários:
- `formatCurrencyBR()` - Valores monetários
- `formatDateBR()` - Datas
- `formatNumber()` - Números
- `formatCNPJ()` - CNPJ
- `formatTelefone()` - Telefone

### Carregamento da Logo
A logo é carregada automaticamente pelo método `PdfController.carregarLogoBase64()`:
- **Caminho:** `src/pdf/assets/img/logoEstendido.png`
- **Formato:** Base64 (data URI)
- **Fallback:** Se não encontrar, `logoPath` será `null` e o template exibirá um placeholder

### Rodapé Dinâmico
O rodapé é injetado diretamente no `pdf.service.ts` usando `footerTemplate` do Puppeteer:
- Dados dinâmicos: `razaoSocial`, `cnpj`, `dataGeracao`
- Numeração automática: `<span class="pageNumber"></span>` e `<span class="totalPages"></span>`
- Estilos forçados com `!important` e `-webkit-print-color-adjust: exact`

---

**Última atualização:** Novembro 2025

