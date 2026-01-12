# Documentação Consolidada - API de Cobrança Bancária - Banco do Brasil

> **Data de consolidação:** 12/01/2026
> **Status:** Análise em andamento
> **Convênio Alencar Frutas:** Tipo 3, Modalidade Simples, Espécie: Boleto de Cobrança
>
> **⚙️ Gerenciamento de Ambiente:**
> - **Produção:** `NODE_ENV=production` (use endpoints de produção)
> - **Homologação/Desenvolvimento:** `NODE_ENV=development` ou não definido (use endpoints de homologação)
> - Certificados: Usar certificados apropriados para cada ambiente

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Informações Obrigatórias](#2-informações-obrigatórias)
3. [Modalidades de Cobrança](#3-modalidades-de-cobrança)
4. [Tipos de Boletos](#4-tipos-de-boletos-disponíveis)
5. [Tipos de Convênios](#5-tipos-de-convênios-disponíveis)
6. [Contratação do Serviço](#6-contrate-o-serviço-de-cobrança-bancária)
7. [Opere em Produção](#7-opere-em-produção)
8. [Recursos Disponíveis](#8-recursos-disponíveis)
9. [Simulação de Pagamento em Homologação](#9-simulação-de-pagamento-em-homologação)
10. [Diferenciação de Ambientes](#10-diferenciação-de-ambientes)

---

## 1. Visão Geral

### 1.1 Sobre a Cobrança Bancária

A **Cobrança Bancária** é uma solução que permite receber valores referentes a:

- Bens adquiridos
- Serviços prestados
- Propostas de contrato civil
- Convites para associação

Tudo por meio da apresentação de **boletos de pagamento**, emitidos pelo beneficiário ao pagador/devedor.

### 1.2 Público-alvo

#### Pessoa Jurídica
- Indústria
- Comércio
- Prestação de serviço
- Agronegócio
- Governo (municipais, estaduais ou federais)
- Administração direta ou indireta

#### Pessoa Física
- Profissional liberal
- Produtor rural
- Autônomo

### 1.3 Por que usar?

| Benefício | Descrição |
|-----------|-----------|
| **Versatilidade** | Pagamento por diversos canais: guichê de caixa, terminais de autoatendimento, internet banking e aplicativos móveis |
| **Controle** | Recebimento de dados instantaneamente no ato do pagamento. Conciliação e relatórios facilitados |
| **Agilidade** | Integração por API - eventos e dados em tempo real. Saiba na hora quando clientes pagaram |
| **Mais dinheiro** | Utilização de boletos como garantia de operações de crédito (Antecipação de Recebíveis). Sujeito a análise de crédito |

---

## 2. Informações Obrigatórias

Para emissão de um boleto de Cobrança Bancária são necessários **5 (cinco)** conjuntos de informações básicas:

1. ✅ **Identificação do banco emissor**
2. ✅ **Beneficiário:**
   - Razão social/nome
   - CNPJ/CPF
   - Endereço completo
3. ✅ **Pagador:**
   - Razão social/nome
   - CNPJ/CPF
   - Endereço completo
4. ✅ **Valor do boleto**
5. ✅ **Data de vencimento do boleto**

### 🔍 Observações Importantes

1. **Dados reais:** Os dados informados para validação devem ser os dados reais do convênio do beneficiário, **NÃO** os dados fictícios sugeridos na documentação da API para testes em homologação.

2. **Bolepix:** A confecção do QR Code é de responsabilidade do beneficiário e poderá ficar acima ou em qualquer outro lugar, **MENOS** dentro do boleto.

---

## 3. Modalidades de Cobrança

Conforme opção a ser determinada no ato da contratação do convênio de Cobrança Bancária.

### 3.1 Simples

- Destinada à cobrança de duplicatas, notas promissórias, recibos e outros documentos
- Permite o rateio do resultado liquidado por percentuais determinados legal ou negocialmente

### 3.2 Compartilhada

- **TODO:** Documentação detalhada pendente

---

## 4. Tipos de Boletos Disponíveis

Conforme opção no momento da contratação do convênio de Cobrança Bancária.

| Tipo | Descrição | Uso Típico |
|------|------------|--------------|
| **Boleto de Cobrança** | Destinada à cobrança de duplicatas, notas promissórias, recibos e outros documentos | Padronizado para cobrança geral |
| **Boleto de Aporte** | Solução perfeita para Instituições de pagamento e Fintechs sem rede de agências físicas | Captar depósitos |
| **Proposta** | Utilizado para oferta de produto ou serviço, proposta de contrato civil, como doações ou convite para associação | Propostas e convites |
| **Fatura (Cartão)** | Boleto com características especiais para recebimento de faturas de cartão de crédito | Faturas de cartão |
| **Moeda Estrangeira** | Boleto cujo valor é atualizado diariamente, conforme variação cambial do Dólar ou Euro | Pagamentos internacionais |
| **Prêmio de Seguro** | Boleto para recebimento de prêmio de seguro. Recolhimento automatizado de IOF | Seguros |

---

## 5. Tipos de Convênios Disponíveis

O tipo de convênio determina a forma como os boletos serão numerados, emitidos e expedidos.

### Para Integrações via API

Para negócios que envolvem API, é necessário um convênio do tipo:

- **Tipo 3:** Banco numera, cliente emite e expede
- **Tipo 4:** Cliente numera, emite e expede

> **Recomendação:** Escolha a parametrização do convênio com envio do boleto por e-mail para melhor experiência do cliente.

### ✅ Convênio Alencar Frutas

- **Tipo:** 3 (Banco numera, cliente emite e expede)
- **Modalidade:** Simples
- **Espécie:** Boleto de Cobrança
- **Status:** ✅ Já contratado com o Banco do Brasil

---

## 6. Contrate o Serviço de Cobrança Bancária

### 6.1 Como Contratar

O convênio pode ser contratado através do **BB Digital PJ**:

1. Acesse BB Digital PJ
2. Navegue para: **Contratação de Serviço > Cobrança e Pagamentos > Contratar serviço**
3. Assista ao vídeo com o passo a passo

### 6.2 Parâmetros do Convênio

Será necessário escolher os seguintes parâmetros:

- **Tipo (espécie)** de boleto
- **Envio de boleto por e-mail**
- **Conta para crédito**
- **Prazo de baixa do boleto vencido**
- **Pagamento parcial**
- **Compartilhamento**
- **Condições de aceitação do pagamento**
- **Percentuais de juros e multa**
- Outras possibilidades de customização

> 💡 **Dica:** Caso seja necessário, conte com a consultoria do seu Gerente de Relacionamento ou Gerente de Cash.

---

## 7. Opere em Produção

### ⚠️ Importante!

Antes de emitir os boletos em produção é **IMPRESSÍNDÍVEL** ter validado o layout da ficha de compensação.

### Validação

Esta ação evitará transtornos com relação à:
- Despadronização dos campos do boleto
- Dados ausentes
- Dados equivocadamente apresentados no documento

### Passos para Validação

1. Assista ao tutorial sobre o processo de validação
2. Acesse o Validador de Layout BB no Portal BB for Developers
3. Procurar pelo item **"Validador de Layout BB"**
4. Siga as orientações em tela

---

## 8. Recursos Disponíveis

Com a API de Cobranças você poderá utilizar os seguintes recursos/serviços:

| Recurso | Descrição | Convênios | Modalidades |
|---------|-------------|-------------|--------------|
| **Registro de Boletos** | Registro de boletos | Tipo 3 ou 4 | Simples ou Vinculada |
| **Lista de Boletos** | Disponibiliza uma listagem dos boletos do cliente (informações básicas, filtros) | Todos os tipos | Todas as modalidades |
| **Consulta/Detalhamento** | Consulta individual de um boleto específico, todos os dados inclusive situação | Todos os tipos | Todas as modalidades |
| **Baixa de Boletos** | Baixa (cancelamento) de boletos por solicitação do beneficiário | Todos os tipos | Apenas carteira simples |
| **Alteração de Boletos** | Registro de instruções para boleto (alteração de vencimento, descontos, multa, etc.) | - | - |
| **Consultar Pix de Boletos** | Retorna URL, TxID, EMV e Tipo de QRCode de Pix vinculado | - | - |
| **Gerar Pix de Boletos** | Permite vincular Pix em boleto "Em Ser" (sem Pix anterior) | - | - |
| **Cancelar Pix de Boletos** | Cancelamento de Pix vinculado à boleto "Em Ser" | - | - |
| **Baixa Operacional** | Instituição Recebedora informa pagamento à PCR | - | - |
| **Listar Retorno do Movimento** | Consulta movimentos de retorno vinculados aos boletos (pagamentos, baixas, alterações) | - | - |
| **Notificações Webhook** | Recebimento de Baixa Operacional (evento de webhook) | - | - |

### ⚠️ Observação Importante

Para obter acesso ao recurso **"Listar Retorno do Movimento"**, entre em contato com seu Gerente de Cash ou Gerente de Relacionamento.

---

## 9. Simulação de Pagamento em Homologação

### 9.1 Serviço

Este endpoint efetua a simulação do pagamento, no ambiente de testes, de um boleto gerado em homologação através da API.

**Recurso exclusivo do ambiente de homologação.**

### 9.2 Endpoint de Homologação

**Base URL:** `https://api.hm.bb.com.br`

**Caminho completo:** `https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1`

### 9.3 Endpoint de Simulação de Pagamento

```
POST /boletos-cobranca/{linhaDigitavel}/pagar
```

**Parâmetros:**
- `linhaDigitavel`: Conteúdo do campo `linhaDigitavel`, retornado pelo recurso `/boletos` da API

### 9.4 Query Params

| Parâmetro | Valor |
|-----------|--------|
| **gw-app-key** | `95cad3f03fd9013a9d15005056825665` |

### 9.5 Observações da Simulação

1. **Vencimento futuro:** Caso o boleto tenha vencimento futuro, ele será pago no dia da requisição automaticamente.

2. **Tentativas múltiplas:** Caso não seja possível pagar na primeira tentativa, tentar novamente, pois o ambiente de homologação simula diversas contas e alguma delas pode estar indisponível.

3. **gw-app-key:** Para execução da requisição utilizar sempre o gw-app-key `95cad3f03fd9013a9d15005056825665`

---

## 10. Diferenciação de Ambientes

### 10.1 Ambientes Disponíveis

| Ambiente | `NODE_ENV` | Uso |
|----------|-----------|------|
| **Produção** | `production` | Sistema em produção, clientes reais, certificados de produção |
| **Homologação** | `development` ou não definido | Testes e desenvolvimento, simulações, certificados de homologação |

### 10.2 Como Definir o Ambiente

A variável de ambiente `NODE_ENV` deve ser definida no arquivo `.env`:

```bash
# .env
NODE_ENV=production        # Produção
# OU
NODE_ENV=development      # Homologação/Desenvolvimento
```

### 10.3 gw-app-key (Chave de Aplicação do Banco do Brasil)

#### Como Funciona

A chave `gw-app-key` (ou `X-Developer-Application-Key`, dependendo da API) é um identificador único fornecido pelo Banco do Brasil ao contratar um convênio.

**Fluxo completo:**

```
1. Contratação no BB Digital PJ → Recebe gw-app-key
2. Cadastro no sistema → Salvar gw-app-key em CredenciaisAPI
3. Uso na aplicação → Buscar credencial + usar gw-app-key nas requisições
```

#### Localização no Banco de Dados

- **Tabela:** `CredenciaisAPI`
- **Campo correspondente:** `developerAppKey`
- **Campos complementares:** 
  - `banco`: Código do banco (ex: "001")
  - `contaCorrenteId`: ID da conta corrente
  - `modalidadeApi`: Tipo da API (ex: "001 - Cobrança")
  - `clienteId`, `clienteSecret`: Credenciais OAuth2 (para token)

#### Lógica de Busca

Para emitir boletos, o sistema deve:

1. Identificar a conta corrente escolhida
2. Buscar credenciais de API filtrando por:
   - `modalidadeApi = "001 - Cobrança"`
   - `contaCorrenteId = {ID da conta escolhida}`
3. Extrair e usar o `developerAppKey` da credencial encontrada

#### Exemplo de Consulta

```typescript
// Buscar credenciais de COBRANÇA para uma conta específica
const credenciais = await prisma.credenciaisAPI.findMany({
  where: {
    banco: "001",  // Código BB para cobrança
    contaCorrenteId: contaCorrenteId,  // ID da conta corrente
    modalidadeApi: "001 - Cobrança",  // Tipo de API
  }
});

// Usar o gw-app-key da credencial encontrada
const gwAppKey = credenciais[0].developerAppKey;
```

### 10.4 Endpoints por Ambiente

#### Produção (`NODE_ENV=production`)

| Componente | URL | gw-app-key |
|-----------|-----|-------------|
| **Autenticação** | `TBD` (a definir) | Chave de produção do convênio Alencar Frutas |
| **API Base** | `TBD` (a definir) | Chave de produção do convênio Alencar Frutas |

#### Homologação (`NODE_ENV=development`)

| Componente | URL | gw-app-key |
|-----------|-----|-------------|
| **Autenticação** | `TBD` (a definir) | `95cad3f03fd9013a9d15005056825665` |
| **API Base** | `https://api.hm.bb.com.br` | `95cad3f03fd9013a9d15005056825665` |
| **Testes** | `https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1` | `95cad3f03fd9013a9d15005056825665` |

### 10.5 Observações Importantes

1. **Diferença entre ambientes:**
   - A **única diferença** entre homologação e produção são as **URLs dos endpoints** (authUrl, baseUrl)
   - Todo o resto deve ser **exatamente igual**: certificados, chaves, dados, funcionalidades
   - Não há diferença em dados de cadastro, certificados ou chaves

2. **Cadastro por ambiente:**
   - Homologação: Usar dados cadastrados para homologação na tabela `ConvenioCobranca` e `CredenciaisAPI`
   - Produção: Usar dados cadastrados para produção na tabela `ConvenioCobranca` e `CredenciaisAPI`
   - A seleção de ambiente (NODE_ENV) determina qual registro das tabelas usar

3. **Validação obrigatória:**
   - Validar layout em homologação antes de ir para produção
   - Usar Validador de Layout BB do Portal Developers
   - Testar boleto emitido em homologação primeiro

4. **gw-app-key:**
   - Chaves diferentes para cada ambiente
   - Homologação: `95cad3f03fd9013a9d15005056825665`
   - Produção: Chave real do convênio (configurada no BB Digital PJ)

### 10.6 Lógica de Seleção de Ambiente

Na implementação do Service e do Cliente HTTP, usar a lógica:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

// Autenticação OAuth2
const authUrl = isProduction
  ? 'https://oauth.bb.com.br'        // Produção
  : 'https://oauth.hm.bb.com.br';       // Homologação

// API de Cobrança
const baseUrl = isProduction
  ? 'https://api.boletobb.com.br'      // Produção
  : 'https://api.hm.bb.com.br';         // Homologação
```

**Observação importante:** O gw-app-key sempre vem da tabela `CredenciaisAPI` (campo `developerAppKey`), independentemente do ambiente.

---

## 📚 Recursos Complementares

- Especificações técnicas para confecção de boleto de pagamento do BB
- Instruções para validar o Layout do boleto
- Glossário de termos técnicos pertinentes à Cobrança Bancária
- Folder varejo e folder atacado (Bolepix)

---

## 🔜 Próximos Passos

### Para Implementação

1. ✅ **Obter documentação técnica completa** (endpoints, requisições, respostas)
2. ✅ **Mapear endpoints da API** (registro, consulta, baixa, PDF, webhooks)
3. 🔄 **Definir estrutura de DTOs** (requisição e resposta)
4. 🔄 **Configurar cliente HTTP** (mTLS, OAuth2, URLs de produção)
5. 🔄 **Implementar Service** (lógica de negócio)
6. 🔄 **Implementar Controller** (endpoints REST)
7. 🔄 **Integrar com webhooks** (notificações de pagamento)
8. 🔄 **Validar em produção** (layout, testes)

### Arquitetura Planejada

```
src/cobranca/
├── cobranca.service.ts           # Lógica principal
├── cobranca.controller.ts        # Endpoints REST
├── cobranca.module.ts           # Configuração NestJS
├── cobranca-sync.service.ts      # Sincronização de status
├── dto/
│   ├── cobranca.dto.ts
│   ├── registrar-boleto.dto.ts
│   ├── consultar-boleto.dto.ts
│   └── response.dto.ts
└── utils/
    ├── calculadora-juros.ts
    └── validador-boletos.ts
```

---

**Última atualização:** 12/01/2026
**Status:** Aguardando documentação técnica (endpoints, estrutura de requisições/respostas, webhooks)
