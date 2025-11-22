# API de Pagamentos - Banco do Brasil

Este módulo contém a integração com a API de Pagamentos do Banco do Brasil.

## 📁 Estrutura

```
pagamentos/
├── DOCUMENTACAO_CONSOLIDADA.md  # 📚 Documentação completa do sistema (LER ESTE ARQUIVO)
├── PLANO_IMPLEMENTACAO.md       # 📋 Plano de implementação detalhado
├── README.md                    # Esta documentação (resumo)
├── pagamentos.service.ts        # Service principal
├── pagamentos.controller.ts     # Controller com endpoints
├── dto/pagamentos.dto.ts        # DTOs para requisições e respostas
└── test-pagamentos.ts           # Script de teste "hardcore" com credenciais de homologação
```

## 🚀 Status Atual

**✅ 95% Concluído** - Sistema completo de controle de pagamentos

O módulo está **praticamente completo** com:
- ✅ Persistência completa de lotes e itens
- ✅ Consultas de lote e individuais
- ✅ Pagamento consolidado (1 transferência para múltiplas colheitas)
- ✅ Relacionamento N:N com tabelas de origem
- ✅ Rastreabilidade completa
- ✅ Auditoria completa

**⚠️ Pendente:**
- Jobs para consultar status automaticamente
- Webhook para receber atualizações do BB

## 🧾 Integração com ARH

O novo módulo de **ARH** (cargos, funções, funcionários e folha própria) já está preparado para conversar com os pagamentos automatizados:

- Os registros de folha vivem em `arh_folhas_pagamento` e os lançamentos em `arh_funcionarios_pagamento`.
- Cada lançamento possui os campos `meioPagamento` (`PIX`, `PIX_API`, `ESPECIE`), `statusPagamento` (mesmo enum de `PagamentoApiItem`) e a flag `pagamentoEfetuado`.
- Quando a folha utilizar a automação bancária, basta preencher `pagamentoApiItemId` no lançamento e o relacionamento `PagamentoApiItem.funcionarioPagamentoId` garantirá rastreabilidade completa.
- Enquanto a integração PIX-API não é disparada, o backend permite marcar pagamentos manuais (PIX comum ou espécie) mantendo histórico e recalculando totais da folha.
- As APIs REST estão em `src/arh/**` e seguem o padrão NestJS (controllers com prefixo `api/arh/...`). O frontend consome tudo via `@axiosConfig.js`.
- Fluxo de status: `RASCUNHO` → `PENDENTE_LIBERACAO` → `FECHADA`. Qualquer usuário autenticado (exceto `GERENTE_CULTURA`) pode criar/finalizar folhas; apenas `ADMINISTRADOR` pode liberá-las.
- Cada folha registra `usuarioCriacaoId`, `usuarioLiberacaoId` e `dataLiberacao`, permitindo auditoria completa.

> **Importante:** nenhuma alteração foi feita no `PagamentosService` agora. O link com os lançamentos da folha será habilitado somente quando os meios `PIX_API` forem validados em produção – o esquema e os serviços já estão preparados para isso.

## 📚 Documentação

**👉 Leia a documentação completa em:** [`DOCUMENTACAO_CONSOLIDADA.md`](./DOCUMENTACAO_CONSOLIDADA.md)

A documentação consolidada inclui:
- 🗄️ Modelo de banco de dados completo
- 🔄 Lógica de funcionamento detalhada
- 🎯 Funcionalidades implementadas
- 📝 Fluxos de pagamento
- 🔗 Relacionamentos N:N
- 🚀 Comandos de migration
- 🎨 Instruções para frontend

## 🔧 Configuração

A API de Pagamentos está configurada em:
- **Configuração centralizada**: `src/config/bb-api.config.ts`
- **Cliente HTTP**: `src/utils/bb-pagamentos-client.ts`

### Endpoints de Homologação

**Autenticação:**
- `https://oauth.hm.bb.com.br/oauth/token`

**API Base (com mTLS):**
- `https://homologa-api-ip.bb.com.br:7144/pagamentos-lote/v1`

**API Base (sem mTLS - para testes sem certificados):**
- `https://api.hm.bb.com.br/pagamentos-lote/v1`

**Produção (com mTLS):**
- `https://api-ip.bb.com.br/pagamentos-lote/v1`

### Certificados

Utiliza certificados mTLS específicos para Pagamentos (diferentes de PIX e Extratos):
- `certs/alencar_final.cer` (certificado cliente)
- `certs/alencar_final_key.pem` (chave privada)
- Certificados CA (GeoTrust, DigiCert, api-pix_bb_com_br)

**Nota:** A API de Pagamentos usa certificados com prefixo `alencar`, enquanto as APIs PIX e Extratos usam certificados com prefixo `bestnet`.

## 🔐 Scopes OAuth2

A API de Pagamentos utiliza scopes específicos para controlar as permissões. Todos os scopes disponíveis:

### Scopes de Requisição (Efetuar Pagamentos)

| Scope | Descrição |
|-------|-----------|
| `pagamentos-lote.lotes-requisicao` | Permite registrar liberação dos lotes de pagamentos |
| `pagamentos-lote.transferencias-requisicao` | Permite efetuar lote de pagamentos realizados via transferência |
| `pagamentos-lote.transferencias-pix-requisicao` | Permite efetuar pagamentos em lote via transferência Pix |
| `pagamentos-lote.boletos-requisicao` | Permite efetuar pagamentos em lote de Boletos |
| `pagamentos-lote.guias-codigo-barras-requisicao` | Permite pagamento em lote de guias de recolhimento com código de barras |
| `pagamentos-lote.pagamentos-guias-sem-codigo-barras-requisicao` | Permite efetuar pagamentos de guias sem código de barras (GPS, GRU e Darf Preto) em lote |

### Scopes de Consulta (Informações)

| Scope | Descrição |
|-------|-----------|
| `pagamentos-lote.lotes-info` | Permite consultar informações de um Lote de Pagamentos |
| `pagamentos-lote.transferencias-info` | Permite consultar lote de pagamentos realizados via transferência |
| `pagamentos-lote.transferencias-pix-info` | Permite consultar solicitação de transferências Pix |
| `pagamentos-lote.pix-info` | Permite consultar um pagamento específico de um lote de Pix |
| `pagamentos-lote.boletos-info` | Permite consultar a solicitação de um lote de pagamentos via boletos |
| `pagamentos-lote.guias-codigo-barras-info` | Permite consultar a solicitação de um lote de pagamentos via guias com código de barras |
| `pagamentos-lote.pagamentos-guias-sem-codigo-barras-info` | Permite consultar informações de pagamentos de guias sem código de barras (GPS, GRU e Darf Preto) |
| `pagamentos-lote.pagamentos-info` | Permite consultar informações sobre um Pagamento específico em um Lote de Pagamentos |
| `pagamentos-lote.pagamentos-codigo-barras-info` | Permite consultar pagamentos vinculados a um código de barras em um lote de pagamentos |
| `pagamentos-lote.lancamentos-info` | Permite consultar pagamentos em um determinado período |

### Scopes de Operações

| Scope | Descrição |
|-------|-----------|
| `pagamentos-lote.cancelar-requisicao` | Permite cancelar lotes de pagamentos |
| `pagamentos-lote.devolvidos-info` | Permite consultar pagamentos devolvidos em um lote de pagamentos |

**⚠️ IMPORTANTE:** Os scopes devem ser autorizados na sandbox do Banco do Brasil para as credenciais de homologação antes de usar a API.

## 📝 Transferências PIX

### 1. Solicitação de Transferências PIX

**Recurso:** `POST /lotes-transferencias-pix`

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes` (homologação)
- `gw-dev-app-key=suaAppKeyProducao` (produção)

**Body (Payload):**

| Campo | Obrigatório | Tipo | Descrição |
|-------|-------------|------|-----------|
| `numeroRequisicao` | ✅ Sim | Number | Número de 1 a 9999999, controlado pelo cliente. Não precisa ser sequencial. De uso único. |
| `numeroContrato` | ❌ Não | Number | Contrato de pagamento. Opcional - se não informado, usa o contrato vinculado ao cliente. |
| `agenciaDebito` | ✅ Sim | String | Agência da conta corrente (4 dígitos, sem dígito verificador). |
| `contaCorrenteDebito` | ✅ Sim | String | Número da conta corrente. |
| `digitoVerificadorContaCorrente` | ✅ Sim | String | Dígito verificador da conta (string). |
| `tipoPagamento` | ✅ Sim | Number | 126 = Pagamento de fornecedores, 128 = Pagamentos diversos |
| `listaTransferencias` | ✅ Sim | Array | Lista de transferências (máximo 320 registros) |

**Campos de cada item em `listaTransferencias`:**

| Campo | Obrigatório | Tipo | Descrição |
|-------|-------------|------|-----------|
| `data` | ✅ Sim | String | Data do pagamento em formato `ddmmaaaa` (sem zero à esquerda no dia). Ex: `9012022` |
| `valor` | ✅ Sim | String | Valor do pagamento em reais. Ex: `123.45` |
| `documentoDebito` | ❌ Não | String | Número exibido no extrato do pagador. |
| `documentoCredito` | ❌ Não | String | Número exibido no extrato do favorecido (uso exclusivo para crédito em conta corrente no BB). |
| `descricaoPagamento` | ❌ Não | String | Campo de uso livre pelo cliente. |
| `descricaoPagamentoInstantaneo` | ❌ Não | String | Descrição para fins de conciliação. |
| `formaIdentificacao` | ✅ Sim | Number | 1=Telefone, 2=Email, 3=CPF/CNPJ, 4=Chave Aleatória, 5=Dados Bancários |

**Campos condicionais por `formaIdentificacao`:**

- **Tipo 1 (Telefone):**
  - `dddTelefone` (✅ obrigatório): DDD com dois dígitos
  - `telefone` (✅ obrigatório): Telefone com nove dígitos
  - `cpf` ou `cnpj` (❌ opcional): Para validação

- **Tipo 2 (Email):**
  - `email` (✅ obrigatório): Email do favorecido
  - `cpf` ou `cnpj` (❌ opcional): Para validação

- **Tipo 3 (CPF/CNPJ):**
  - `cpf` ou `cnpj` (✅ obrigatório): CPF ou CNPJ do favorecido

- **Tipo 4 (Chave Aleatória):**
  - `identificacaoAleatoria` (✅ obrigatório): Código UUID da chave aleatória

- **Tipo 5 (Dados Bancários):**
  - `numeroCOMPE` ou `numeroISPB` (✅ obrigatório): Código da instituição
  - `tipoConta` (✅ obrigatório): 1=Conta Corrente, 2=Conta Pagamento, 3=Conta Poupança
  - `agencia`, `conta`, `digitoVerificadorConta` (✅ obrigatório se `contaPagamento` não informado)
  - `contaPagamento` (✅ obrigatório se agência/conta não informados)

### 2. Consulta uma Solicitação de Transferências

**Recurso:** `GET /lotes-transferencias-pix/:id/solicitacao`

**Path Variable:**
- `id`: Número da requisição (1 a 999999)

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes`

**Resposta - Estados da Requisição:**

| Código | Estado | Descrição |
|--------|--------|-----------|
| 1 | Consistente | Todos os lançamentos com dados consistentes |
| 2 | Parcialmente Inconsistente | Ao menos um lançamento com dados inconsistentes |
| 3 | Inconsistente | Todos os lançamentos com dados inconsistentes |
| 4 | Pendente | Falta autorizar o pagamento |
| 5 | Em Processamento | Requisição em processamento pelo Banco |
| 6 | Processada | Requisição Processada |
| 7 | Rejeitada | Requisição Rejeitada |
| 8 | Preparando Remessa (não liberada) | Preparando remessa não liberada |
| 9 | Liberada via API | Requisição liberada via API |
| 10 | Preparando Remessa (liberada) | Preparando remessa liberada |

**Campos de resposta:**
- `numeroRequisicao`: Identificador da requisição
- `estadoRequisicao`: Código do estado (1-10)
- `quantidadeTransferencias`: Total de lançamentos enviados
- `valorTransferencias`: Valor total enviado
- `quantidadeTransferenciasValidas`: Total de lançamentos válidos
- `valorTransferenciasValidas`: Valor total válido
- `listaTransferencias`: Array com detalhes de cada transferência
  - `identificadorPagamento`: Número único gerado pelo Banco (usar para consultas posteriores)
  - `indicadorMovimentoAceito`: "S" (Sim) ou "N" (Não)
  - `erros`: Array com códigos de erro (até 10 códigos)

### 3. Consulta uma Transferência Específica

**Recurso:** `GET /pix/:id`

**Path Variable:**
- `id`: Identificador do pagamento (retornado na solicitação)

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes`

**Resposta - Estados do Pagamento:**

| Estado | Descrição |
|--------|-----------|
| `Consistente` | Dados recebidos sem ocorrências. Aguardando validação. |
| `Inconsistente` | Dados com ocorrências de formato. Será alterado para rejeitado. |
| `Pendente` | Falta autorização/liberação para débito. |
| `Agendado` | Aguardando data para efetivação do crédito. |
| `Rejeitado` | Dados não passaram nas validações. |
| `Cancelado` | Pagamento cancelado antes da data do crédito. |
| `Devolvido` | Pagamento efetuado e posteriormente recusado pelo recebedor. |
| `Bloqueado` | Débito não efetivado por ocorrência no convênio ou falta de saldo. |
| `Aguardando débito` | Débito em processamento ou verificação de saldo. |
| `Debitado` | Pagamento debitado e pendente de crédito. |
| `Vencido` | Não efetuado na data por falta de saldo ou autorização. |
| `Pago` | Pagamento efetuado. |

## 📋 Dados de Homologação Disponíveis

O Banco do Brasil disponibiliza os seguintes dados para testes:

### Cliente Pagador

**Dados da conta que será debitada:**

| Campo | Valor |
|-------|-------|
| Agência | 1607 |
| Conta Corrente | 99738672-X |
| Convênio PGT | 731030 |

**⚠️ IMPORTANTE:** Estes são os dados que devem ser usados em `agenciaDebito`, `contaCorrenteDebito` e `digitoVerificadorContaCorrente` nas requisições.

### Transferências PIX - Utilizando Chave Pix

**Chaves PIX disponíveis para recebimento:**

| Tipo | Chave Pix | CPF/CNPJ |
|------|-----------|----------|
| 1 (Telefone) | (11)985732102 | 95127446000198 |
| 2 (Email) | hmtestes2@bb.com.br | 95127446000198 |
| 3 (CPF/CNPJ) | 92037500000116 | 92037500000116 |
| 4 (Chave Aleatória) | 9e881f18-cc66-4fc7-8f2c-a795dbb2bfc1 | - |
| 2 (Email) | testqrcode01@bb.com.br | 28779295827 |
| 3 (CPF/CNPJ) | 28779295827 | 28779295827 |
| 4 (Chave Aleatória) | d14d32de-b3b9-4c31-9f89-8df2cec92c50 | - |

**Atualmente o script usa a primeira chave (Telefone):**
- Tipo: 1
- DDD: 11
- Telefone: 985732102
- CNPJ: 95127446000198

### Transferências PIX - Utilizando Dados da Conta

**Contas disponíveis para recebimento via dados bancários:**

| Tipo | Nº Compe | Tipo da Conta | Agência | Conta | Dígito | CPF/CNPJ |
|------|----------|---------------|---------|-------|--------|----------|
| 5 | 1 | 1 (Conta Corrente) | 4267 | 1704959 | 8 | 28779295827 |
| 5 | 1 | 1 (Conta Corrente) | 551 | 43814 | 6 | 95127446000198 |

### Pagamento de Guias com Código de Barras

**Códigos de barras disponíveis para teste:**

| Código de Barras | Valor |
|------------------|-------|
| 83630000000641400052836100812355200812351310 | R$ 64,14 |
| 83690000001057200052858120735518020735512003 | R$ 105,72 |
| 83600000003021500052847119156147419156142102 | R$ 302,15 |
| 84670000001800500470011027860709101194190210 | R$ 180,05 |
| 89610000000250000010111707200000000000057461 | R$ 25,00 |
| 89620000000658100010111838900000220203000022 | R$ 65,81 |
| 84640000001498403132010955706087413535200100 | R$ 149,84 |
| 82860000000781400181111071029270101202200003 | R$ 78,14 |
| 84870000000449901602022012514009408900826123 | R$ 44,99 |
| 85660000000876699122102222230173633469013581 | R$ 87,66 |

**Recursos disponíveis:**
- Pagamento de boletos
- Pagamento de guias com código de barras

### Pagamento de GRU

**Códigos de barras de GRU disponíveis para teste:**

| Código de Barras | N° Referência | Competência | Data Vencimento | CPF/CNPJ | Valor |
|------------------|---------------|-------------|-----------------|----------|-------|
| 85880000001380003631130002185001233122022557 | - | - | - | - | R$ 138,00 |
| 85850000000200003631130002185002174122025678 | - | - | - | - | R$ 20,00 |
| 85800000002660004352882721486900675550002022 | - | - | - | - | R$ 266,00 |
| 85830000002660004352882721486900431695002022 | - | - | - | - | R$ 266,00 |
| 85800000002713002801874000096214200166000166 | - | - | - | - | R$ 271,30 |
| 85860000010000002801874000100210557524000131 | - | - | - | - | R$ 1.000,00 |
| 85890000000167402541111200216100039360992860 | - | - | - | - | R$ 16,74 |
| 85880000000055802541111100216100023586755805 | - | - | - | - | R$ 5,58 |
| 89970000000800000010109552316288320117811508 | 50103006 | 11/2022 | 04/11/2022 | 442.140.732-15 | R$ 80,00 |
| 89900000001200000010109552316288320117811755 | 2016021990 | 10/2022 | 04/11/2022 | 435.529.512-53 | R$ 120,00 |

**Recurso disponível:**
- Pagamento de GRU

## 📝 Pagamento de Boletos

### 1. Solicitação de Pagamento de Boletos

**Recurso:** `POST /lotes-boletos`

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes` (homologação)
- `gw-dev-app-key=suaAppKeyProducao` (produção)

**Body (Payload):**

| Campo | Obrigatório | Tipo | Descrição |
|-------|-------------|------|-----------|
| `numeroRequisicao` | ✅ Sim | Number | Número de 1 a 9999999, controlado pelo cliente. Não precisa ser sequencial. De uso único. |
| `codigoContrato` | ❌ Não | Number | Contrato de pagamento. Opcional - se não informado, usa o contrato vinculado ao cliente. |
| `numeroAgenciaDebito` | ✅ Sim | String | Agência da conta corrente (4 dígitos, sem dígito verificador). |
| `numeroContaCorrenteDebito` | ✅ Sim | String | Número da conta corrente. |
| `digitoVerificadorContaCorrenteDebito` | ✅ Sim | String | Dígito verificador da conta (string). |
| `lancamentos` | ✅ Sim | Array | Lista de pagamentos de boletos (máximo 150 registros) |

**Campos de cada item em `lancamentos`:**

| Campo | Obrigatório | Tipo | Descrição |
|-------|-------------|------|-----------|
| `numeroDocumentoDebito` | ❌ Não | String | Número exibido no extrato do pagador. |
| `numeroCodigoBarras` | ✅ Sim | String | Código de barras do boleto (44 dígitos). **Não aceita linha digitável.** |
| `dataPagamento` | ✅ Sim | String | Data do pagamento em formato `ddmmaaaa` (sem zero à esquerda no dia). |
| `valorPagamento` | ✅ Sim | String | Valor do pagamento total do boleto em reais. |
| `descricaoPagamento` | ❌ Não | String | Campo de uso livre pelo cliente. |
| `codigoSeuDocumento` | ❌ Não | String | Seu número na solicitação (equivalente ao Seu Número do boleto). |
| `codigoNossoDocumento` | ❌ Não | String | Nº do boleto (equivalente ao Nosso Número). |
| `valorNominal` | ✅ Sim | String | Valor original registrado pelo beneficiário do boleto. |
| `valorDesconto` | ❌ Não | String | Valor do desconto e/ou abatimento. |
| `valorMoraMulta` | ❌ Não | String | Valor dos juros de mora e/ou multa. |
| `codigoTipoPagador` | ❌ Não | Number | 1=CPF, 2=CNPJ |
| `documentoPagador` | ❌ Não | String | CPF ou CNPJ do pagador. |
| `codigoTipoBeneficiario` | ✅ Sim | Number | 1=CPF, 2=CNPJ |
| `documentoBeneficiario` | ✅ Sim | String | CPF ou CNPJ do beneficiário. |
| `codigoTipoAvalista` | ❌ Não | Number | 1=CPF, 2=CNPJ |
| `documentoAvalista` | ❌ Não | String | CPF ou CNPJ do avalista. |

### 2. Consulta uma Solicitação de Pagamento de Boletos

**Recurso:** `GET /lotes-boletos/:id/solicitacao`

**Path Variable:**
- `id`: Número da requisição (1 a 999999)

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes`

**Resposta - Estados da Requisição:**
Mesmos estados das transferências PIX (1-10).

**Campos de resposta:**
- `estadoRequisicao`: Código do estado (1-10)
- `quantidadeLancamentos`: Total de lançamentos enviados
- `valorLancamentos`: Valor total enviado
- `quantidadeLancamentosValidos`: Total de lançamentos válidos
- `valorLancamentosValidos`: Valor total válido
- `lancamentos`: Array com detalhes de cada pagamento
  - `codigoIdentificadorPagamento`: Número único gerado pelo Banco
  - `indicadorAceite`: "S" (Sim) ou "N" (Não)
  - `erros`: Array com códigos de erro (até 10 códigos)
  - `nomePagador`, `nomeBeneficiario`, `nomeAvalista`: Nomes conforme Receita Federal

### 3. Consulta um Pagamento Específico de Boleto

**Recurso:** `GET /boletos/:id`

**Path Variable:**
- `id`: Identificador do pagamento (retornado na solicitação)

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes`

**Resposta - Estados do Pagamento:**
Mesmos estados das transferências PIX, com adição de:
- `tipoCredito`: 30 = Boleto Banco do Brasil, 31 = Boleto outros bancos

**Campos de resposta:**
- `id`: Identificador do pagamento
- `estadoPagamento`: Estado atual do pagamento
- `tipoCredito`: Tipo de boleto (30 ou 31)
- `dataVencimento`: Data de vencimento conforme CIP
- `dataAgendamento`: Data de pagamento informada
- `listaPagamentos`: Array com detalhes do pagamento
- `listaDevolucao`: Array com códigos de erro/devolução
  - `codigoMotivo`: Motivos da rejeição ou devolução
  - `dataDevolucao`: Data da devolução (se aplicável)
  - `valorDevolucao`: Valor devolvido (pode ser parcial)

## 📝 Pagamento de Guias com Código de Barras

### 1. Solicitação de Pagamento de Guias

**Recurso:** `POST /lotes-guias-codigo-barras`

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes` (homologação)
- `gw-dev-app-key=suaAppKeyProducao` (produção)

**⚠️ ATENÇÃO:** Esta modalidade permite o pagamento repetido da mesma guia. Caso não receba confirmação do recebimento, **NÃO REENVIE**. Utilize o recurso `GET /lotes-guias-codigo-barras/:id/solicitacao` para verificar se a solicitação foi recebida.

**Body (Payload):**

| Campo | Obrigatório | Tipo | Descrição |
|-------|-------------|------|-----------|
| `numeroRequisicao` | ✅ Sim | Number | Número de 1 a 9999999, controlado pelo cliente. Não precisa ser sequencial. De uso único. |
| `codigoContrato` | ❌ Não | Number | Contrato de pagamento. Opcional - se não informado, usa o contrato vinculado ao cliente. |
| `numeroAgenciaDebito` | ✅ Sim | String | Agência da conta corrente (4 dígitos, sem dígito verificador). |
| `numeroContaCorrenteDebito` | ✅ Sim | String | Número da conta corrente. |
| `digitoVerificadorContaCorrenteDebito` | ✅ Sim | String | Dígito verificador da conta (string). |
| `lancamentos` | ✅ Sim | Array | Lista de pagamentos de guias (máximo 200 registros) |

**Campos de cada item em `lancamentos`:**

| Campo | Obrigatório | Tipo | Descrição |
|-------|-------------|------|-----------|
| `codigoBarras` | ✅ Sim | String | Código de barras ou linha digitável da guia (44 dígitos, **excluir os dígitos verificadores**). |
| `dataPagamento` | ✅ Sim | String | Data do pagamento em formato `ddmmaaaa` (sem zero à esquerda no dia). |
| `valorPagamento` | ✅ Sim | String | Valor do pagamento em reais. |
| `numeroDocumentoDebito` | ❌ Não | String | Número exibido no extrato do pagador. |
| `descricaoPagamento` | ❌ Não | String | Campo de uso livre pelo cliente. |
| `codigoSeuDocumento` | ❌ Não | String | Número de uso livre (até 20 caracteres). |

### 2. Consulta uma Solicitação de Pagamento de Guias

**Recurso:** `GET /lotes-guias-codigo-barras/:id/solicitacao`

**Path Variable:**
- `id`: Número da requisição (1 a 999999)

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes`

**Resposta - Estados da Requisição:**
Mesmos estados das transferências PIX (1-10).

**Campos de resposta:**
- `numeroRequisicao`: Identificação da solicitação
- `estadoRequisicao`: Código do estado (1-10)
- `quantidadePagamentos`: Total de lançamentos enviados
- `valorPagamentos`: Valor total enviado
- `quantidadePagamentosValidos`: Total de lançamentos válidos
- `valorPagamentosValidos`: Valor total válido
- `pagamentos`: Array com detalhes de cada pagamento
  - `codigoPagamento`: Número único gerado pelo Banco
  - `nomeBeneficiario`: Nome do conveniado beneficiário
  - `indicadorAceite`: "S" (Sim) ou "N" (Não)
  - `erros`: Array com códigos de erro (até 10 códigos)

### 3. Consulta um Pagamento Específico de Guia

**Recurso:** `GET /guias-codigo-barras/:id`

**Path Variable:**
- `id`: Identificador do pagamento (retornado na solicitação)

**Query Params (obrigatório):**
- `gw-dev-app-key=suaAppKeyTestes`

**Resposta - Estados do Pagamento:**
Mesmos estados das transferências PIX (exceto "Devolvido").

**Campos de resposta:**
- `id`: Identificador do pagamento
- `estadoPagamento`: Estado atual do pagamento
- `codigoAutenticacaoPagamento`: Código de autenticação
- `listaPagamentos`: Array com detalhes do pagamento
  - `codigo`: Código de barras da guia
  - `nomeRecebedor`: Nome do conveniado que receberá o valor
  - `seuNumero`: Seu número na solicitação
- `listaDevolucao`: Array com códigos de erro
  - `codigoMotivo`: Motivos da rejeição do lançamento

## 🔑 Credenciais de Homologação

**IMPORTANTE**: As credenciais no script são placeholders. Substitua com as credenciais reais de homologação:

```typescript
const HOMOLOGACAO_CREDENTIALS = {
  clienteId: 'SUA_CLIENT_ID_AQUI',
  clienteSecret: 'SUA_CLIENT_SECRET_AQUI',
  developerAppKey: 'SUA_DEVELOPER_APP_KEY_AQUI'
};

const CONTA_TESTE = {
  agencia: 'SUA_AGENCIA_AQUI',
  conta: 'SUA_CONTA_AQUI',
  digito: 'X'
};
```

## 📝 Script de Teste

O arquivo `test-pagamentos.ts` contém um script de teste completo que:

1. **Obtém token OAuth2** com os scopes necessários para os testes:
   - `pagamentos-lote.transferencias-pix-requisicao` - Efetuar transferências PIX
   - `pagamentos-lote.transferencias-pix-info` - Consultar solicitação de transferências PIX
   - `pagamentos-lote.pix-info` - Consultar pagamento específico de PIX
   - `pagamentos-lote.boletos-requisicao` - Efetuar pagamentos de boletos
   - `pagamentos-lote.boletos-info` - Consultar solicitação de boletos
   - `pagamentos-lote.guias-codigo-barras-requisicao` - Efetuar pagamentos de guias
   - `pagamentos-lote.guias-codigo-barras-info` - Consultar solicitação de guias
   - `pagamentos-lote.lotes-info` - Consultar informações de lotes
   - `pagamentos-lote.pagamentos-info` - Consultar informações de pagamentos específicos

2. **Testa Transferência PIX**:
   - Cria uma transferência PIX de teste
   - Utiliza dados de homologação do BB (Tipo 1 - Telefone)

3. **Consulta Status da Solicitação**:
   - Verifica o estado de uma solicitação de transferência

4. **Consulta Transferência Específica**:
   - Verifica detalhes de uma transferência específica

## 🎯 Funcionalidades Prioritárias

Conforme solicitado, o foco inicial é em:

1. ✅ **Transferências PIX** - Implementado no script de teste
2. ✅ **Pagamento de Boletos** - Documentado e pronto para implementação
3. ✅ **Pagamento de Guias com Código de Barras** - Documentado e pronto para implementação

## 🔍 Como Executar o Teste

```bash
# Compilar TypeScript
npm run build

# Executar o script de teste
node dist/src/pagamentos/test-pagamentos.js
```

Ou usando ts-node:

```bash
npx ts-node src/pagamentos/test-pagamentos.ts
```

## 📋 Próximos Passos

Após validação do script de teste:

1. Organizar para ser escalável por credencial/conta (seguindo padrão de Extratos)
2. Criar service (`pagamentos.service.ts`)
3. Criar controller (`pagamentos.controller.ts`)
4. Criar DTOs para requisições e respostas
5. Integrar com o sistema de credenciais do banco de dados
6. Implementar tratamento de erros robusto
7. Adicionar logs estruturados
8. Implementar pagamento de boletos

## ⚠️ Observações Importantes

### Gerais
- **Formato de Data**: Use formato `ddmmaaaa` sem zero à esquerda no dia (ex: `9012022` para 9 de janeiro de 2022)
- **Query Params**: O `gw-dev-app-key` deve ser passado como query param, não como header
- **mTLS**: O endpoint de homologação com mTLS é obrigatório para produção
- **Número de Requisição**: Deve ser único por contrato de pagamento (1 a 9999999)

### Liberação e Cancelamento

Além da solicitação e consulta de pagamentos, o módulo implementa:

- **Liberação de Requisição/Remessa** (`POST /liberar-pagamentos` BB)  
  - Exposto internamente via `POST /api/pagamentos/liberar` (apenas ADMIN).  
  - Usa `numeroRequisicao` do lote e `indicadorFloat`:
    - `'N'` → não dispensa prazos de float (sem tarifa de antecipação).
    - `'S'` → dispensa prazos de float (tarifa de antecipação poderá ser cobrada conforme contrato).
  - Comportamento:
    - O sistema sempre envia o `numeroRequisicao` real do lote e `indicadorFloat = 'S'` (produção).

- **Cancelamento de Pagamentos** (`POST /cancelar-pagamentos` BB)  
  - Exposto internamente via `POST /api/pagamentos/cancelar` (apenas ADMIN).  
  - **⚠️ IMPORTANTE:** O cancelamento é feito por **ITEM (lançamento individual)**, não por lote. Cada item possui um `codigoPagamento` único.
  - Um lançamento somente poderá ser cancelado **até a liberação do lote** que o contém.
  - Usa `contaCorrenteId` para recuperar `numeroContratoPagamento`, agência, conta/dígito.
  - Envia `listaPagamentos` com `codigoPagamento` de cada item a ser cancelado (pode cancelar múltiplos itens de uma vez).
  - Campos `codigoPagamento` por tipo:
    - **PIX:** `identificadorPagamento`
    - **Boleto:** `codigoIdentificadorPagamento`
    - **Guia:** `codigoPagamento`
  - O BB retorna para cada item se foi aceito ou rejeitado.
  - Se aceito, o sistema reverte automaticamente o status das colheitas/funcionários vinculados para `PENDENTE`.
  - Está implementado e funcional; o fluxo principal atual não depende dele, mas está pronto para uso.

### Transferências PIX
- **Limite de Registros**: Máximo de 320 transferências por lote
- **Valor Máximo**: Transações acima de R$ 500 milhões podem ser invalidadas fora do horário comercial

### Pagamento de Boletos
- **Limite de Registros**: Máximo de 150 boletos por lote
- **Código de Barras**: Use código de barras (44 dígitos), **não aceita linha digitável**
- **Valor Nominal**: Obrigatório informar o valor original do boleto

### Pagamento de Guias
- **Limite de Registros**: Máximo de 200 guias por lote
- **Código de Barras**: Aceita código de barras ou linha digitável (44 dígitos, **excluir dígitos verificadores**)
- **⚠️ Pagamento Repetido**: Esta modalidade permite pagamento repetido da mesma guia. Se não receber confirmação, **NÃO REENVIE**. Consulte o status primeiro.

## 📚 Referências

- Documentação oficial do Banco do Brasil
- Códigos COMPE e ISPB disponíveis no site do Banco Central
- Limites e restrições conforme contrato de pagamento
