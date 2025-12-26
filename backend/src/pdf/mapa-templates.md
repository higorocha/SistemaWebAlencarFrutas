# Mapa de Templates PDF

Documentação simples dos templates de PDF disponíveis no sistema.

## 📋 Índice

- [pedido-criado.hbs](#pedido-criadohbs)
- [pedidos-cliente.hbs](#pedidos-clientehbs)
- [folha-pagamento.hbs](#folha-pagamentohbs)
- [partials/header.hbs](#partialsheaderhbs)
- [partials/footer.hbs](#partialsfooterhbs)

---

## 🔗 Mapeamento Rápido: Método → Template

| Método no Controller | Template Handlebars | Endpoint |
|---------------------|---------------------|----------|
| `downloadPedidoPdf()` | `pedido-criado.hbs` | `GET /api/pdf/pedido/:id` |
| `prepararDadosTemplate()` | `pedido-criado.hbs` | Auxiliar |
| `downloadFolhaPagamentoPdf()` | `folha-pagamento.hbs` | `GET /api/pdf/folha-pagamento/:id` |
| `prepararDadosTemplateFolha()` | `folha-pagamento.hbs` | Auxiliar |
| `downloadPedidosClientePdf()` | `pedidos-cliente.hbs` | `POST /api/pdf/pedidos-cliente/:clienteId` |
| `prepararDadosTemplatePedidosCliente()` | `pedidos-cliente.hbs` | Auxiliar |
| `downloadFornecedorColheitasPdf()` | `fornecedor-colheitas.hbs` | `POST /api/pdf/fornecedor-colheitas/:fornecedorId` |

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

## pedidos-cliente.hbs

### O que é?
Template de **lista de pedidos do cliente**, gerando um PDF com todos os pedidos selecionados/filtrados do cliente, incluindo as frutas e quantidades colhidas de cada pedido.

### De onde vem a chamada?
- **Frontend:** `PedidosClienteModal.js` - botão "Exportar PDF"
- **Endpoint:** `POST /api/pdf/pedidos-cliente/:clienteId`

### Controller
`PdfController.downloadPedidosClientePdf()` - linha ~1301

### Endpoint
```
POST /api/pdf/pedidos-cliente/:clienteId
Body: { pedidosIds?: number[] } // Opcional - IDs dos pedidos a incluir
```

### Dados utilizados
Preparados pelo método `PdfController.prepararDadosTemplatePedidosCliente()`:

**Dados do Cliente:**
- `cliente.nome` - Nome fantasia do cliente
- `cliente.razaoSocial` - Razão social (se houver)
- `cliente.cnpj` - CNPJ formatado (se houver)
- `cliente.cpf` - CPF formatado (se houver)
- `cliente.telefone1` - Telefone formatado (se houver)
- `cliente.email1` - E-mail (se houver)
- `cliente.logradouro` - Endereço completo (se houver)
- `cliente.numero` - Número do endereço (se houver)
- `cliente.complemento` - Complemento (se houver)
- `cliente.bairro` - Bairro (se houver)
- `cliente.cidade` - Cidade (se houver)
- `cliente.estado` - Estado (se houver)
- `cliente.cep` - CEP (se houver)

**Dados dos Pedidos:**
- `pedidos[]` - Array de pedidos com:
  - `id` - ID do pedido
  - `numeroPedido` - Número do pedido
  - `numeroPedidoFormatado` - Número formatado (apenas última parte)
  - `numeroNf` - Número da nota fiscal nossa (se houver)
  - `indNumeroNf` - Número da nota fiscal da indústria (se houver e cliente for indústria)
  - `dataPedidoFormatada` - Data do pedido formatada (DD/MM/YYYY)
  - `dataColheitaFormatada` - Data da colheita formatada (DD/MM/YYYY) (se houver)
  - `valorFinal` - Valor final do pedido
  - `valorFinalFormatado` - Valor final formatado em R$ (se houver valor)
  - `clienteIndustria` - Flag indicando se o cliente é indústria (para exibir NF Indústria)
  - `frutasPedidos[]` - Array de frutas do pedido com:
    - `fruta.nome` - Nome da fruta
    - `fruta.cultura.descricao` - Descrição da cultura (se houver)
    - `quantidadeFormatada` - Quantidade formatada (quantidadePrecificada ou quantidadeReal)
    - `unidadeFormatada` - Unidade formatada (unidadePrecificada ou unidadeMedida1)

**Dados da Empresa:**
- `empresa` - Objeto com dados da empresa (do ConfigService)
- `logoPath` - Logo em base64 (carregada de `src/pdf/assets/img/logoEstendido.png`)
- `dataGeracaoFormatada` - Data de geração formatada
- `anoAtual` - Ano atual
- `titulo` - Título do documento ("Pedidos do Cliente")
- `subtitulo` - Subtítulo (nome do cliente)

**Totalização:**
- `valorTotalFormatado` - Valor total formatado (soma de todos os pedidos)

### Lógica de Seleção de Pedidos

1. **Pedidos Selecionados:** Se o array `pedidosIds` for fornecido e não estiver vazio, apenas os pedidos com esses IDs serão incluídos no PDF
2. **Todos os Pedidos Filtrados:** Se `pedidosIds` for vazio ou não fornecido, todos os pedidos do cliente (respeitando filtros aplicados no frontend) serão incluídos

### Lógica de Quantidades

Para cada fruta do pedido, o sistema prioriza:
1. **Primeira opção:** `quantidadePrecificada` e `unidadePrecificada` (se disponível e > 0)
2. **Segunda opção:** `quantidadeReal` e `unidadeMedida1` (se quantidadePrecificada não disponível)

### Estrutura do PDF gerado
1. **Cabeçalho** (via `{{> header}}`)
2. **Card: Dados do Cliente** - Qualificação completa do cliente
3. **Lista de Pedidos:**
   - Para cada pedido:
     - Cabeçalho do pedido com informações:
       - Número do pedido
       - Data do pedido
       - Data da colheita (se houver)
       - NF Nossa (`numeroNf`) - se houver
       - NF Indústria (`indNumeroNf`) - se cliente for indústria e houver
       - Valor total do pedido (se houver valor)
     - Tabela de frutas com quantidades colhidas
4. **Card: Totalização** - Valor total de todos os pedidos
5. **Rodapé** (via Puppeteer `displayHeaderFooter`)

### Campos Exibidos na Tabela de Frutas
- **#** - Número sequencial da fruta
- **Fruta** - Nome da fruta e cultura (se houver)
- **Quantidade** - Quantidade formatada (precificada ou real)
- **Unidade** - Unidade de medida (precificada ou unidadeMedida1)

### Nota sobre Numeração de Nota Fiscal
O template exibe:
- **NF Nossa:** `numeroNf` (nosso número de nota fiscal) - sempre que houver
- **NF Indústria:** `indNumeroNf` (nota fiscal da indústria) - apenas se o cliente for indústria (`cliente.industria === true`) e houver valor

---

## fornecedor-colheitas.hbs

### O que é?
Template de **relatório global de colheitas do fornecedor**, com:
- Cabeçalho interno com fornecedor e áreas presentes no PDF (nome + ha)
- Gráfico semanal (segunda→domingo) com **últimas 6 semanas**
- Resumo por cultura/fruta (quantidades, compra paga vs precificada, venda)
- Duas listagens: colheitas **precificadas (compra)** e **não precificadas (compra)**, agrupadas por fruta

### De onde vem a chamada?
- **Frontend:** `EstatisticasFornecedorModal.js` - botão **Gerar PDF**
- **Endpoint:** `POST /api/pdf/fornecedor-colheitas/:fornecedorId`

### Endpoint
```
POST /api/pdf/fornecedor-colheitas/:fornecedorId
```

### Body (opcional)
```json
{
  "aplicarFiltros": true,
  "filtroBusca": "banana",
  "dataInicio": "2025-12-01",
  "dataFim": "2025-12-20"
}
```

### Observações
- O gráfico é limitado a **6 semanas** por espaço; sem filtros ele mostra as últimas 6 do conjunto completo e informa o total de semanas.
- As áreas exibidas no cabeçalho são apenas as **presentes nas colheitas incluídas no PDF** (respeita filtros).

## folha-pagamento.hbs

### O que é?
Template de **folha de pagamento completa**, incluindo lançamentos agrupados por gerente, gráfico histórico e resumo detalhado.

### De onde vem a chamada?
- **Frontend:** Módulo ARH - Folha de Pagamento - botão de exportar PDF
- **Endpoint:** `GET /api/pdf/folha-pagamento/:id`

### Controller
`PdfController.downloadFolhaPagamentoPdf()` - linha ~689

### Endpoint
```
GET /api/pdf/folha-pagamento/:id
```

### Dados utilizados
Preparados pelo método `PdfController.prepararDadosTemplateFolha()` e métodos auxiliares:

**Dados da Folha:**
- `folha.competenciaCompleta` - Competência formatada (mês/ano + período)
- `folha.statusFormatado` - Status formatado
- `folha.dataInicialFormatada` / `folha.dataFinalFormatada` - Período da folha
- `folha.dataPagamentoFormatada` - Data de pagamento (se houver)
- `folha.totalBrutoFormatado` / `folha.totalLiquidoFormatado` - Valores formatados
- `folha.meioPagamentoFormatado` - Meio de pagamento formatado

**Lançamentos:**
- `abas[]` - Array de abas com lançamentos agrupados por gerente
  - Cada aba contém `titulo` e `lancamentos[]` formatados

**Resumo Detalhado:**
- `resumoDetalhado` - Totais de horas extras, valores, descontos, quantidades

**Gráfico Histórico:**
- `graficoHistorico` - Dados serializados para Chart.js (últimas 6 folhas)

### Métodos Auxiliares
- `agruparLancamentosPorGerente()` - Separa lançamentos em grupos
- `formatarAbasLancamentos()` - Organiza em abas formatadas
- `formatarLancamentos()` - Formata valores de cada lançamento
- `calcularResumoDetalhado()` - Calcula totais e resumos
- `prepararDadosGraficoHistorico()` - Prepara dados do gráfico Chart.js

### Estrutura do PDF gerado
1. **Cabeçalho** (via `{{> header}}`)
2. **Informações da Folha** (competência, período, status, valores)
3. **Resumo Detalhado** (totais e quantidades)
4. **Gráfico Histórico** (Chart.js renderizado)
5. **Abas de Lançamentos** (agrupados por gerente)
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

