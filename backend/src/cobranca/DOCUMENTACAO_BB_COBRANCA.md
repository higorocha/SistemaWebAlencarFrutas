# Documentação Consolidada - API de Cobrança Bancária - Banco do Brasil

> **Data de consolidação:** 12/01/2026
> **Status:** Documentação técnica completa consolidada
> **Convênio Alencar Frutas:** Tipo 3, Modalidade Simples, Espécie: Boleto de Cobrança
>
> **⚙️ Gerenciamento de Ambiente:**
> - **Produção:** `NODE_ENV=production` (use endpoints de produção)
> - **Homologação/Desenvolvimento:** `NODE_ENV=development` ou não definido (use endpoints de homologação)
> - **Diferença entre ambientes:** Apenas os endpoints (URLs) mudam. Certificados, gw-app-key e demais dados vêm das tabelas do banco de dados.

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Requisitos para Operacionalização](#2-requisitos-para-operacionalização)
3. [Segurança](#3-segurança)
4. [Homologação e Testes](#4-homologação-e-testes)
5. [Formatação de Dados](#5-formatação-de-dados)
6. [Recursos Disponíveis](#6-recursos-disponíveis)
7. [Endpoints da API](#7-endpoints-da-api)
8. [Diferenciação de Ambientes](#8-diferenciação-de-ambientes)
9. [Webhooks](#9-webhooks)

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

### 1.4 Informações Obrigatórias

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

### 1.5 Modalidades de Cobrança

#### Simples
- Destinada à cobrança de duplicatas, notas promissórias, recibos e outros documentos
- Permite o rateio do resultado liquidado por percentuais determinados legal ou negocialmente

#### Compartilhada
- Destinada à cobrança de duplicatas, notas promissórias, recibos e outros documentos
- Permite o rateio do resultado liquidado por percentuais determinados legal ou negocialmente

### 1.6 Tipos de Boletos Disponíveis

| Tipo | Descrição | Uso Típico |
|------|------------|--------------|
| **Boleto de Cobrança** | Destinada à cobrança de duplicatas, notas promissórias, recibos e outros documentos | Padronizado para cobrança geral |
| **Boleto de Aporte** | Solução perfeita para Instituições de pagamento e Fintechs sem rede de agências físicas | Captar depósitos |
| **Proposta** | Utilizado para oferta de produto ou serviço, proposta de contrato civil, como doações ou convite para associação | Propostas e convites |
| **Fatura (Cartão)** | Boleto com características especiais para recebimento de faturas de cartão de crédito | Faturas de cartão |
| **Moeda Estrangeira** | Boleto cujo valor é atualizado diariamente, conforme variação cambial do Dólar ou Euro | Pagamentos internacionais |
| **Prêmio de Seguro** | Boleto para recebimento de prêmio de seguro. Recolhimento automatizado de IOF | Seguros |

### 1.7 Tipos de Convênios Disponíveis

O tipo de convênio determina a forma como os boletos serão numerados, emitidos e expedidos.

#### Para Integrações via API

Para negócios que envolvem API, é necessário um convênio do tipo:

- **Tipo 3:** Banco numera, cliente emite e expede
- **Tipo 4:** Cliente numera, emite e expede

> **Recomendação:** Escolha a parametrização do convênio com envio do boleto por e-mail para melhor experiência do cliente.

#### ✅ Convênio Alencar Frutas

- **Tipo:** 3 (Banco numera, cliente emite e expede)
- **Modalidade:** Simples
- **Espécie:** Boleto de Cobrança
- **Status:** ✅ Já contratado com o Banco do Brasil

---

## 2. Requisitos para Operacionalização

### 2.1 Requisitos para que o convênio de Cobrança Bancária possa ser operacionalizado por APIs

- ✅ **Convênio de cobrança ativo** (7 dígitos)
- ✅ **Tipos de convênio para registro:** 3 (Banco Numera e Cliente Emite e Expede) ou 4 (Cliente Numera, Emite e Expede)
- ✅ **Modalidades:** 1 - Simples ou 4 - Vinculada
- ✅ **Carteira:** 17

> **Observação:** Embora não permitam registro via API, os demais tipos de convênios permitem listagem, baixa e detalhamento. As alterações podem apresentar particularidades em virtude do tipo.

---

## 3. Segurança

### 3.1 Autenticação e Autorização

O Banco do Brasil utiliza:

- **Fluxo de acesso:** Client Credentials do padrão OAuth 2.0 de autorização, conforme descrito na RFC6749
- **Protocolo:** REST (porém não Restfull)
- **Autenticação mútua:** Para webhooks, é exigida autenticação mútua por meio de certificado digital SSL/TLS emitido por uma CA válida
- **TLS:** Deve ser utilizado a partir da versão 1.2 (versões anteriores não serão aceitas)

### 3.2 Certificados

- Os parceiros precisam disponibilizar a sua chave pública no padrão x.509 ao Banco do Brasil previamente à utilização dos serviços
- Mais informações sobre autenticação mútua de certificados, certificados aceitos pelo BB e envio dos certificados pelo Portal

---

## 4. Homologação e Testes

### 4.1 Recomendações

- Recomendamos que você já tenha lido nossa página Primeiros Passos
- Recomendamos que você mantenha aberta a Especificação OpenAPI da API

### 4.2 Guia Rápido - Instalação Descomplicada

#### Opção 1 - Instalação Automática no Insomnia
- Descrição: Baixa e instala automaticamente a collection no aplicativo Insomnia em seu Windows
- Requisito: Ter o aplicativo Insomnia instalado e estar logado

#### Opção 2 - Instalação Personalizada no Postman
- Descrição: Baixa o arquivo Json no formato ZIP para você descompactar e realizar a importação manual em seu aplicativo preferido

### 4.3 Collection no Postman

Para auxiliar os testes, preparamos uma Collection no Postman (faça download clicando aqui - clique com o botão direito, depois em Salvar link como e salve o arquivo da Collection).

Basta você importar para o Postman e fazer as substituições necessárias.

> **Importante:** Essa Collection deverá ser utilizado somente para ajudar a realizar seus testes e entender o comportamento da API.

### 4.4 Dados Fictícios para Testes

Para geração do boleto em ambiente de homologação (recurso/boletos), deverão ser utilizados um dos CNPJs ou CPFs abaixo:

#### CNPJs para Testes

| Nome da Empresa | CNPJ |
|----------------|------|
| TECIDOS FARIA DUARTE | 74910037000193 |
| LIVRARIA CUNHA DA CUNHA | 98959112000179 |
| DOCERIA BARBOSA DE ALMEIDA | 92862701000158 |
| DEPOSITO ALVES BRAGA | 94491202000127 |
| PAPELARIA FILARDES GARRIDO | 97257206000133 |

#### CPFs para Testes

| Nome | CPF |
|------|-----|
| VALERIO DE AGUIAR ZORZATO | 96050176876 |
| JOAO DA COSTA ANTUNES | 88398158808 |
| VALERIO ALVES BARROS | 71943984190 |
| JOÃO DA COSTA ANTUNES | 97965940132 |
| JOÃO DA COSTA ANTUNES | 75069056123 |

### 4.5 Simulação de Pagamento em Homologação

#### Serviço
Este endpoint efetua a simulação do pagamento, no ambiente de testes, de um boleto gerado em homologação através da API.

**Recurso exclusivo do ambiente de homologação.**

#### Endpoint de Homologação

**Base URL:** `https://api.hm.bb.com.br`

**Caminho completo:** `https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1`

#### Endpoint de Simulação de Pagamento

```
POST /boletos-cobranca/{linhaDigitavel}/pagar
```

**Parâmetros:**
- `linhaDigitavel`: Conteúdo do campo `linhaDigitavel`, retornado pelo recurso `/boletos` da API

#### Query Params

| Parâmetro | Valor |
|-----------|--------|
| **gw-app-key** | `95cad3f03fd9013a9d15005056825665` |

#### Observações da Simulação

1. **Vencimento futuro:** Caso o boleto tenha vencimento futuro, ele será pago no dia da requisição automaticamente.
2. **Tentativas múltiplas:** Caso não seja possível pagar na primeira tentativa, tentar novamente, pois o ambiente de homologação simula diversas contas e alguma delas pode estar indisponível.
3. **gw-app-key:** Para execução da requisição utilizar sempre o gw-app-key `95cad3f03fd9013a9d15005056825665`

---

## 5. Formatação de Dados

### 5.1 Valores Monetários ou Percentuais

Os valores devem ser representados por decimal e separados por ponto.

**Exemplo:** `123.45`

### 5.2 Valores Numéricos

Campos numéricos nunca devem iniciar com 0, pois inválida o Json.

**Exemplo:** O CPF `075.113.750-22`, deverá ser informado como `7511375022`.

### 5.3 Datas

Datas sempre devem estar no formato `dd.mm.aaaa`.

**Exemplo:** `05.12.2020`

### 5.4 Atenção ao Preenchimento

Verifique os seguintes campos:

#### numeroTituloCliente
- Número de identificação do boleto (correspondente ao NOSSO NÚMERO), no formato STRING, com 20 dígitos
- Deve ser formatado da seguinte forma: `"000" + (número do convênio com 7 dígitos) + (número de controle com 10 dígitos - se necessário, completar com zeros à esquerda)`
- **No caso de convênio tipo 3, não enviar este campo**

#### campoUtilizacaoBeneficiario
- Deve ser informado uma String com 30 caracteres maiúsculos

#### mensagemBloquetoOcorrencia
- Mensagem definida pelo beneficiário para ser impressa no boleto
- Pode ter no máximo 165 caracteres, sendo que cada 55 caracteres equivalem a uma linha de mensagem

### 5.5 Confecção do Boleto de Cobrança

As características principais do leiaute de Bloqueto de Cobrança podem ser encontradas no manual de Especificações Técnicas, disponível no link abaixo:

**Link:** https://www.bb.com.br/docs/pub/emp/empl/dwn/Doc5175Bloqueto.pdf

---

## 6. Recursos Disponíveis

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

## 7. Endpoints da API

### 7.1 Geração de um Boleto

#### Serviço
Cria um boleto bancário, com ou sem PIX. Retorna um JSON contendo as informações necessárias para gerar um boleto de cobrança bancária.

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Produção** | `https://api.bb.com.br/cobrancas/v2` |

#### Recurso
```
POST /boletos
```

#### Headers
- `Authorization`: `Bearer {seuToken}`
- `Content-Type`: `application/json`

> **Observação:** Caso o header da chamada de uso da API cobrança estiver configurada como `Content-Type=application/x-www-form-urlencoded`, orientamos a alterar para `Content-Type=application/json`.

#### Query Params (obrigatório)

| Parâmetro | Ambiente | Valor |
|-----------|----------|-------|
| **gw-dev-app-key** | Homologação | `suaAppKey` |
| **gw-dev-app-key** | Produção | `suaAppKey` |

#### Body (Payload)

| Nº | Campo | Obrigatório | Exemplo para HOMOLOGAÇÃO | Observações |
|----|-------|-------------|--------------------------|-------------|
| 1 | numeroConvenio | S | 3128557 | Em produção, informar o número do convênio de cobrança, com 7 dígitos. |
| 2 | numeroCarteira | S | 17 | Em produção, informar o número da carteira de cobrança. |
| 3 | numeroVariacaoCarteira | S | 35 | Em produção, informar o número da variação da carteira de cobrança. |
| 4 | codigoModalidade | S | 1 ou 4 | Código que identifica a característica dos boletos dentro das modalidades de cobrança existentes no BB. Domínio: 1 - Simples; 4 - Vinculada. |
| 5 | dataEmissao | S | "15.12.2020" | Qualquer data, a partir da data atual, no formato "dd.mm.aaaa". |
| 6 | dataVencimento | S | "31.03.2021" | Qualquer data maior ou igual que a data de emissão, no formato "dd.mm.aaaa". |
| 7 | valorOriginal | S | 123.45 | Valor do boleto no registro, em reais. Deve ser maior que a soma dos campos "valorDesconto" e "valorAbatimento", se informados. Deve ser maior do que zero. No caso de emissão com valor equivocado, sugerimos cancelar o boleto e emitir um novo. |
| 8 | valorAbatimento | | 12.34 | Valor de dedução do boleto. Se informado, deve ser maior que zero. |
| 9 | quantidadeDiasProtesto | | 0 ou maior que zero | Quantidade de dias após a data de vencimento do boleto para iniciar o processo de cobrança através de protesto. (3 a 5 dias úteis ou 6 a 29, 35, 40 ou 45 dias corridos) |
| 10 | indicadorAceiteTituloVencido | S | S ou N | Indicador de que o boleto pode ou não ser recebido após o vencimento. Se não informado, será assumida a informação de limite de recebimento parametrizada no convênio. Quando informado "S", em conjunto com o campo "numeroDiasLimiteRecebimento", será definida a quantidade de dias corridos após o vencimento que este boleto ficará disponível para pagamento. Atenção: neste caso, se o campo "numeroDiasLimiteRecebimento" ficar com valor zero, também será assumida a informação de limite de recebimento parametrizada no convênio. Quando informado "N", está definindo que o boleto NÃO permite pagamento em atraso. |
| 11 | numeroDiasLimiteRecebimento | | 0 ou maior que zero | Quantidade de dias corridos para recebimento após o vencimento. |
| 12 | codigoAceite | S | A ou N | Código para identificar se o boleto de cobrança foi aceito (reconhecimento da dívida pelo Pagador). Domínio: A - Aceito; N - Não aceito |
| 13 | codigoTipoTitulo | S | 2 | Código para identificar o tipo de boleto de cobrança. Mais informações acesse aqui. |
| 14 | descricaoTipoTitulo | | "DM" | Descrição do tipo de boleto. Se houver dúvidas com relação ao tipo, consultar as regras da Febraban. |
| 15 | indicadorPermissaoRecebimentoParcial | S | S ou N | Código para identificação da autorização de pagamento parcial do boleto. |
| 16 | numeroTituloBeneficiario | S | "123456" | Número de identificação do boleto (equivalente ao SEU NÚMERO), no formato String, limitado a 15 caracteres, podendo aceitar letras (maiúsculas). São aceitos como caracteres válidos: caracteres alfanuméricos: A a Z, 0 a 9; caracteres especiais de conjunção: hifen (-),apostrofo ('); exemplos: D'EL-REI, D'ALCORTIVO, SANT'ANA separador de palavras: branco ( ); |
| 17 | campoUtilizacaoBeneficiario | | "Alfanumérico" | Informações adicionais sobre o beneficiário. Pode ter até 25 caracteres, em maiúsculas. |
| 18 | numeroTituloCliente | S | "00031285570000030000" | Número de identificação do boleto para o BB (correspondente ao NOSSO NÚMERO), no formato String, com 20 dígitos. Deve ser montado da seguinte forma: 000 + número do convênio (7 dígitos) + número de controle (10 dígitos). **No caso de convênio tipo 3, não enviar este campo** |
| 19 | mensagemBloquetoOcorrencia | | "Outro texto" | Mensagem definida pelo beneficiário para ser impressa no boleto. Pode ter até 165 caracteres, sendo que cada 55 caracteres equivalem a uma linha de mensagem. Atenção: não são permitidos caracteres de escape ( \r ou \n ). |
| 20 | desconto | | | Define a ausência ou a forma como será concedido o desconto para o boleto. |
| 20.1 | tipo | | 0 ou 1 ou 2 | Define como o desconto será concedido. Domínio: 0 - Sem desconto; 1 - Valor fixo até a data informada; 2 - percentual até a data informada. |
| 20.2 | dataExpiracao | | "30.01.2021" | Define a data de expiração do desconto (somente se tipo > 0), no formato "dd.mm.aaaa". |
| 20.3 | porcentagem | | 5.00 | Define a porcentagem do desconto (somente se tipo = 2). |
| 20.4 | valor | | 12.34 | Define o valor do desconto (somente se tipo = 1). |
| 21 | segundoDesconto | | | Define a forma como será concedido um segundo desconto para o boleto. Só pode ser usado se for definido um primeiro desconto. O tipo do segundo desconto será igual ao do primeiro desconto. |
| 21.1 | dataExpiracao | | "10.02.2021" | Define a data de expiração do desconto, no formato "dd.mm.aaaa". Deve ser posterior a data de expiração do primeiro desconto. |
| 21.2 | porcentagem | | 5.00 | Define a porcentagem do desconto (somente se o tipo = 2). |
| 21.3 | valor | | 12.34 | Define o valor do desconto (somente se tipo = 1). |
| 22 | terceiroDesconto | | | Define a forma como será concedido um terceiro desconto para o boleto. Só pode ser usado se for definido um segundo desconto. O tipo do terceiro desconto será igual ao do primeiro desconto. |
| 22.1 | dataExpiracao | | "20.02.2021" | Define a data de expiração do desconto, no formato "dd.mm.aaaa". Deve ser posterior a data de expiração do segundo desconto. |
| 22.2 | porcentagem | | 5.00 | Define a porcentagem do desconto (somente se tipo = 2). |
| 22.3 | valor | | 12.34 | Define o valor do desconto (somente se tipo = 1). |
| 23 | jurosMora | | | Define a forma que serão cobrados (ou não) os juros por atraso no pagamento. |
| 23.1 | tipo | | 0 ou 1 ou 2 ou 3 | Código utilizado pela FEBRABAN para identificar o tipo da taxa de juros. Domínio: 0 - Dispensar; 1 - Valor fixo por dia de atraso; 2 - Taxa mensal; 3 - Isento. |
| 23.2 | porcentagem | | 1.00 | Define a taxa mensal de juros (somente informar se tipo = 2). A taxa incide sobre o valor atual do boleto (valorOriginal - valorAbatimento). |
| 23.3 | valor | | 0.33 | Define o valor fixo por dia de atraso (somente informar se tipo = 1). |
| 24 | multa | | | Define a forma que será cobrada (ou não) a multa por atraso no pagamento. |
| 24.1 | tipo | | 0 ou 1 ou 2 | Código utilizado pela FEBRABAN para identificar o tipo da multa. Domínio: 0 - Dispensar; 1 - Valor fixo (a partir da data estipulada no registro); 2 - Percentual (a partir da data estipulada no registro). |
| 24.2 | data | | "01.04.2021" | Define a data a partir da qual será cobrada a multa (somente informar se tipo = 1 ou 2). Deve ser posterior a data de vencimento do boleto, e anterior a data limite de pagamento (data de vencimento + prazo limite para recebimento de boleto vencido). |
| 24.3 | porcentagem | | 2.00 | Define a porcentagem da multa (somente informar se tipo = 2). A porcentagem incide sobre o valor atual do boleto (valorOriginal - valorAbatimento). |
| 24.4 | valor | | 10.00 | Define o valor da multa (somente informar se tipo = 1). |
| 25 | pagador | S | | Identifica o pagador do boleto. |
| 25.1 | tipoInscricao | S | 1 ou 2 | Define o tipo do inscrição do pagador. Domínio: 1 - Pessoa física; 2 - Pessoa Jurídica. |
| 25.2 | numeroInscricao | S | 97965940132 (PF) ou 74910037000193 (PJ) | Define o número de inscrição do pagador; se pessoa física, CPF; se pessoa jurídica, CNPJ. Numérico, deve ser preenchido sem ponto, hífen, barra, e sem zeros à esquerda. |
| 25.3 | nome | | "Odorico Paraguassu" | Identifica o nome do pagador. Pode ter até 60 caracteres. |
| 25.4 | endereco | | "Avenida Dias Gomes 1970" | Identifica o endereço do pagador. Pode ter até 60 caracteres. |
| 25.5 | cep | | 77458000 | Identifica o CEP do pagador. Numérico, deve ser preenchido sem ponto ou hífen, e sem zeros à esquerda. |
| 25.6 | cidade | | "Sucupira" | Identifica a cidade do pagador. Pode ter até 30 caracteres. |
| 25.7 | bairro | | "Centro" | Identifica o bairro do pagador. Pode ter até 30 caracteres. |
| 25.8 | uf | | "TO" | Identifica o estado (UF) do pagador. Deve ter 2 caracteres e ser um estado válido. |
| 25.9 | telefone | | "63987654321" | Define o número de telefone do pagador. Pode ter até 30 caracteres. |
| 25.10 | e-mail | | testes@bb.com.br | Define o endereço de e-mail do pagador |
| 26 | beneficiarioFinal | | | Identifica o beneficiário final (antigo avalista) do boleto, se houver. **ATENÇÃO:** se o codigoTipoTitulo = 32 (boleto proposta), não é permitido incluir beneficiário final. |
| 26.1 | tipoInscricao | | 1 ou 2 | Define o tipo do inscrição do beneficiário final (antigo avalista). Domínio: 1 - Pessoa física; 2 - Pessoa Jurídica. |
| 26.2 | numeroInscricao | | 66779051870 (PF) ou 98959112000179 (PJ) | Define o número de inscrição do beneficiário final (antigo avalista); se pessoa física, CPF; se pessoa jurídica, CNPJ. Numérico, deve ser preenchido sem ponto, hífen, barra, e sem zeros à esquerda. |
| 26.3 | nome | | "Dirceu Borboleta" | Identifica o nome do beneficiário final (antigo avalista). Pode ter até 30 caracteres. |
| 27 | quantidadeDiasNegativacao | | 0 ou maior que zero | Quantidade de dias corridos depois do vencimento do boleto para a negativação automática. Não confundir com protesto. |
| 28 | orgaoNegativador | | 10 ou 11 | Código do órgão negativador selecionado. Domínio: 10 - SERASA; 11 - QUOD. |
| 29 | indicadorPix | S | S ou N | Código para informar se o boleto terá um QRCode Pix vinculado. Caso não informado, ou utilizado caractere inválido, o sistema assumirá "N". Disponível para as modalidades simples e vinculada. Domínio: S - QRCode dinâmico; N - sem Pix. |

---

### 7.2 Alteração de um Boleto

#### Serviço
Altera um dado de um boleto já registrado, em ser (não pode estar baixado, liquidado ou protestado).

**Atenção:** 
- Só pode ser enviada uma alteração por chamada
- A alteração só será aceita se enviada a partir de 30 minutos após a geração do boleto
- Se enviada antes desse prazo, o sistema retorna erro

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Produção** | `https://api.bb.com.br/cobrancas/v2` |

#### Recurso
```
PATCH /boletos/:id
```

#### Headers
- `Authorization`: `Bearer {seuToken}`
- `Content-Type`: `application/json`

#### Query Params (obrigatório)

| Parâmetro | Ambiente | Valor |
|-----------|----------|-------|
| **gw-dev-app-key** | Homologação | `suaAppKey` |
| **gw-dev-app-key** | Produção | `suaAppKey` |

#### Path Variable (obrigatória)

| Campo | Exemplo para HOMOLOGAÇÃO | Observação |
|-------|--------------------------|------------|
| **id** | 00031285570000003000 | Identifica o número do boleto que se deseja alterar. É o equivalente ao numeroTituloCliente na Geração de Boletos. |

#### Body (Payload)

| Nº | Campo | Obrigatório | Exemplo para HOMOLOGAÇÃO | Observações |
|----|-------|-------------|--------------------------|-------------|
| 1 | numeroConvenio | S | 3128557 | Identifica o número do convênio de cobrança. |
| 2 | indicadorAlterarAbatimento | S | S ou N | Indica a intenção (ou não) de cancelar o abatimento concedido a um boleto. |
| 3 | alteracaoAbatimento | | 2.00 | |
| 4 | indicadorAlterarDataDesconto | S | S ou N | Indica a intenção (ou não) de alterar a data de desconto(s) concedido(s) em um boleto. Se sim, deve ser usado em conjunto com o campo alteracaoDataDesconto. |
| 5 | alteracaoDataDesconto | | | Observar as regras para datas de desconto no campo desconto da Geração de Boletos. |
| 5.1 | novaDataLimitePrimeiroDesconto | | "01.01.2021" | |
| 5.2 | novaDataLimiteSegundoDesconto | | "10.01.2021" | |
| 5.3 | novaDataLimiteTerceiroDesconto | | "20.01.2021" | |
| 6 | indicadorAlterarDesconto | S | S ou N | Indica a intenção (ou não) de alterar o desconto concedido em um boleto. Se sim, deve ser usado em conjunto com o campo alteracaoDesconto. |
| 7 | alteracaoDesconto | | | Observar as instruções sobre o campo desconto na Geração de Boletos. |
| 8 | indicadorAlterarEnderecoPagador | S | S ou N | Indica a intenção (ou não) de alterar o endereço do pagador no boleto. Se sim, deve ser usado em conjunto com o campo alteracaoEndereco. Atenção: a alteração do endereço não implica em nova geração ou envio de boleto. Isso é responsabilidade do beneficiário. |
| 9 | alteracaoEndereco | | | Observar as instruções sobre o campo pagador na Geração de Boletos. |
| 10 | indicadorAlterarPrazoBoletoVencido | S | S ou N | Indica a intenção (ou não) de alterar o prazo para recebimento de boleto vencido. Se sim, deve ser usado em conjunto com o campo alteracaoPrazo. |
| 11 | alteracaoPrazo | | | |
| 11.1 | quantidadeDiasAceite | | 0 ou maior que zero | Define a quantidade de dias corridos após o vencimento em que o boleto poderá ser recebido. Equivalente ao campo numeroDiasLimiteRecebimento na Geração de Boletos. |
| 12 | indicadorAlterarSeuNumero | S | S ou N | Indica a intenção (ou não) de alterar o campo numeroTituloBeneficiario (equivalente ao SEU NÚMERO) no boleto. Se sim, deve ser usado em conjunto com o campo alteracaoSeuNumero. |
| 13 | alteracaoSeuNumero | | | Observar as instruções sobre o campo numeroTituloBeneficiario na Geração de Boletos. |
| 14 | indicadorAtribuirDesconto | S | S ou N | Indica a intenção (ou não) de atribuir desconto ao boleto. Se sim, deve ser usado em conjunto com o campo desconto. |
| 15 | desconto | | | Observar as instruções sobre o campo desconto na Geração de Boletos. Lembrete: o tipo definido para o primeiro desconto será replicado no segundo e no terceiro desconto (se informados). |
| 16 | indicadorCancelarProtesto | S | S ou N | Indica a intenção (ou não) de cancelar uma instrução de protesto enviada ao BB na mesma data ou que ainda não tenha sido processada pelo BB. |
| 17 | indicadorCobrarJuros | S | S ou N | Indica a intenção (ou não) de cobrar juros no boleto. Se sim, deve ser usado em conjunto com o campo juros. |
| 18 | juros | | | Observar as instruções sobre o campo juros na Geração de Boletos. |
| 19 | indicadorCobrarMulta | S | S ou N | Indica a intenção (ou não) de cobrar multa no boleto. Se sim, deve ser usado em conjunto com o campo multa. |
| 20 | multa | | | Observar as instruções sobre o campo multa na Geração de Boletos. |
| 21 | indicadorDispensarJuros | S | S ou N | Indica a intenção (ou não) de dispensar os juros sobre o boleto. |
| 22 | indicadorDispensarMulta | S | S ou N | Indica a intenção (ou não) de dispensar a multa sobre o boleto. |
| 23 | indicadorIncluirAbatimento | S | S ou N | Indica a intenção (ou não) de incluir abatimento em um boleto. Se sim, deve ser usado em conjunto com o campo abatimento. |
| 24 | abatimento | | | |
| 24.1 | valorAbatimento | | 10.00 | Define o valor a ser concedido como abatimento. |
| 25 | indicadorNegativar | S | S ou N | Indica a intenção (ou não) de negativar ou cancelar a negativação do boleto. Se sim, deve ser usado em conjunto com o campo negativacao. Não confundir com protesto. |
| 26 | negativacao | | | |
| 26.1 | quantidadeDiasNegativacao | | qualquer inteiro | Quantidade de dias, após o vencimento do boleto, em que o boleto será negativado. |
| 26.2 | tipoNegativacao | | 1 ou 2 ou 3 ou 4 | Código para identificação do tipo de negativação que deverá ser aplicada ao boleto. Domínio: 1 - incluir; 2 - alterar prazo; 3 - cancelar (cancela a instrução antes da data de negativação); 4 - excluir (exclusão do cliente já negativado no Serasa/Quod). |
| 26.3 | orgãoNegativador | S | 10 ou 11 | Código do órgão negativador selecionado. Domínio: 10 - SERASA; 11 - QUOD. |
| 27 | alteracaoData | | | |
| 27.1 | novaDataVencimento | | "30.04.2021" | Define a nova data de vencimento, formato "dd.mm.aaaa". |
| 27.2 | indicadorNovaDataVencimento | S | S ou N | Indica a intenção (ou não) de atribuir nova data de vencimento ao boleto. Se sim, deve ser usado em conjunto com o campo alteracaoData. |
| 28 | indicadorProtestar | S | S ou N | Indica a intenção (ou não) de protestar o boleto. Não confundir com negativação. |
| 29 | protesto | | | Observe as instruções sobre o campo quantidadeDiasProtesto na Geração de Boletos. |
| 29.1 | quantidadeDiasProtesto | | | |
| 29.2 | indicadorSustacaoProtesto | S | S ou N | Indica a intenção (ou não) de sustar/cancelar um comando de protesto que já tenha sido processado pelo BB. |
| 30 | indicadorNovoValorNominal | S | S ou N | Indica a intenção (ou não) de alterar o valor nominal (original) de um boleto. Se sim, deve ser usado em conjunto com o campo" novoValorNominal". |
| 30.1 | novoValorNominal | S | 123.45 | É o novo valor que será atribuído ao boleto. |

---

### 7.3 Listagem de Boletos

#### Serviço
Retorna um JSON contendo os boletos de cobrança - em ser, baixados, liquidados e/ou com protesto - por beneficiário que foram registrados para o convênio vinculado a API, independentemente do canal (de acordo com os parâmetros informados).

**Atenção:** 
- Os parâmetros montam a URL que fará a chamada via GET
- Se for fornecido algum parâmetro inexistente, ou a combinação dos parâmetros não encontra resultado (lista vazia), o retorno será 404 - not found
- Os dados fornecidos pelos parâmetros serão pesquisados no formato "E" (parâmetro1 E parâmetro2 E…); assim, algumas combinações podem não retornar dados (lista vazia)
- Exemplo: `cpfPagador E cnpjPagador` (ou o pagador é pessoa física ou é pessoa jurídica); `indicadorSituacao = "A"` (boletos em ser) E `codigoEstadoTituloCobranca = 7` (baixado)

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Produção** | `https://api.bb.com.br/cobrancas/v2` |

#### Recurso
```
GET /boletos
```

#### Headers
- `Authorization`: `Bearer {seuToken}`
- `Content-Type`: `application/json`

#### Query Params

| Nº | Campo | Obrigatório | Exemplo para HOMOLOGAÇÃO | Observações |
|----|-------|-------------|--------------------------|-------------|
| 1 | gw-dev-app-key | S | Conforme credenciamento | Em homologação, use `gw-dev-app-key=suaAppKey`; em produção, use `gw-dev-app-key=suaAppKey`. |
| 2 | indicadorSituacao | S | A ou B | Define a faixa de boletos a ser pesquisada. Sempre em MAIÚSCULA. Domínio: A - boletos em ser; B - boletos baixados, liquidados ou protestados |
| 3 | agenciaBeneficiario | S | 452 | Indica o número da agência cadastrada como beneficiária do convênio, sem o dígito e sem zeros a esquerda. |
| 4 | contaBeneficiario | S | 123873 | Indica o número da conta cadastrada como beneficiária do convênio, sem o dígito e sem zeros a esquerda. |
| 5 | carteiraConvenio | | 17 | Indica o número da carteira do convênio de cobrança. |
| 6 | variacaoCarteiraConvenio | | 35 | Indica o número da variação do convênio de cobrança. |
| 7 | modalidadeCobranca | | 1 ou 4 | Indica a modalidade de cobrança na qual o boleto está cadastrado no BB. Domínio: 1 - Simples; 4 - Vinculada. |
| 8 | cnpjPagador | | 543483490001 | Indica o CNPJ do pagador a ser pesquisado, sem o dígito e sem zeros a esquerda. Informar em conjunto com digitoCnpjPagador. |
| 9 | digitoCNPJPagador | | 48 | Indica o dígito do CNPJ do pagador a ser pesquisado, sem zeros a esquerda. Informar em conjunto com cnpjPagador. |
| 10 | cpfPagador | | 979659401 | Indica o CPF do pagador a ser pesquisado, sem o dígito e sem zeros a esquerda. Informar em conjunto com digitoCpfPagador. |
| 11 | digitoCPFPagador | | 32 | Indica o dígito do CPF do pagador a ser pesquisado, sem zeros a esquerda. Informar em conjunto com cpfPagador. |
| 12 | dataInicioVencimento | | 01.01.2021 | Data inicial de vencimento que delimita o período da consulta, formato dd.mm.aaaa. Se informada data posterior a atual, o campo dataFimVencimento deve ser preenchido com data posterior ou igual a dataInicioVencimento. Se informada data anterior ou igual a data atual e o campo dataFimVencimento não for informado, o sistema assume a data atual como dataFimVencimento. |
| 13 | dataFimVencimento | | 30.01.2021 | Data final de vencimento que delimita o período da consulta, formato dd.mm.aaaa. Se informada, deve ser uma data posterior ou igual a dataInicioVencimento. |
| 14 | dataInicioRegistro | | 01.11.2020 | Data inicial de registro que delimita o período da consulta, formato dd.mm.aaaa. Deve ser anterior ou igual a data atual. |
| 15 | dataFimRegistro | | 30.11.2020 | Data fim de registro que delimita o período da consulta, formato dd.mm.aaaa. Se informada, deve ser posterior ou igual a dataInicioRegistro, e igual ou anterior à data atual. Se não informada, o sistema assume a data atual. |
| 16 | dataInicioMovimento | | 01.12.2020 | Data início de movimento que delimita o período de consulta de boletos baixados, liquidados ou protestados, formato dd.mm.aaaa. Deve ser anterior ou igual à data atual. |
| 17 | dataFimMovimento | | 15.12.2020 | Data fim de movimento que delimita o período de consulta de boletos baixados, liquidados ou protestados, formato dd.mm.aaaa. Se informada, deve ser posterior ou igual a dataInicioMovimento, e igual ou anterior à data atual. Se não informada, o sistema assume a data atual. |
| 18 | codigoEstadoTituloCobranca | | entre 1 e 21 | Código da situação atual do boleto. Para esclarecer dúvidas sobre o significado dos Estados, clique aqui. Domínios: 1 - NORMAL, 2 - MOVIMENTO CARTORIO, 3 - EM CARTORIO, 4 - TITULO COM OCORRENCIA DE CARTORIO, 5 - PROTESTADO ELETRONICO, 6 - LIQUIDADO, 7 - BAIXADO, 8 - TITULO COM PENDENCIA DE CARTORIO, 9 - TITULO PROTESTADO MANUAL, 10 - TITULO BAIXADO/PAGO EM CARTORIO, 11 - TITULO LIQUIDADO/PROTESTADO, 12 - TITULO LIQUID/PGCRTO, 13 - TITULO PROTESTADO AGUARDANDO BAIXA, 18 - PAGO PARCIALMENTE |
| 19 | boletoVencido | S | S ou N | Define se a pesquisa trará apenas boletos vencidos ou não. Sempre MAIÚSCULA. |
| 20 | indice | | qualquer inteiro | Representa o índice da listagem pelo qual sua pesquisa se iniciará, podendo retornar até 300 registros por chamada. O default é 0, o que trará os resultados de 0 a 299 (se houver). Quando o resultado da pesquisa tiver mais que 300 registros, na resposta, o campo indicadorContinuidade retornará com "S". Recomendamos utilizar o valor do campo proximoIndice (informado na resposta), no campo indice da próxima chamada, para retornar com os próximos registros. |

---

### 7.4 Detalhamento de um Boleto

#### Serviço
Retorna um JSON contendo os dados de um boleto de cobrança específico.

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Produção** | `https://api.bb.com.br/cobrancas/v2` |

#### Recurso
```
GET /boletos/:id
```

#### Headers
- `Authorization`: `Bearer {seuToken}`
- `Content-Type`: `application/json`

#### Query Params (obrigatório)

| Campo | Exemplo para HOMOLOGAÇÃO | Observações |
|-------|--------------------------|-------------|
| **gw-dev-app-key** | Conforme credenciamento | |
| **numeroConvenio** | 3128557 | Informe o número do convênio de cobrança. |

#### Path Variable (obrigatória)

| Campo | Exemplo para HOMOLOGAÇÃO | Observação |
|-------|--------------------------|------------|
| **id** | 00031285570000030000 | Informe o número do boleto desejado. Deve seguir as regras do campo numeroTituloCliente (formato STRING, com 20 dígitos, que deverá ser formatado da seguinte forma: "000" + (número do convênio com 7 dígitos) + (10 algarismos - se necessário, completar com zeros à esquerda) |

**Observação:** Ao consultar o mesmo boleto mais de uma vez em um intervalo de até 30 segundos, a resposta fornecida será com as mesmas informações da consulta anterior. Isso garante mais velocidade e estabilidade para todos os clientes.

---

### 7.5 Baixa/Cancelamento de um Boleto

#### Serviço
Executa a baixa (cancelamento) de um boleto já registrado e ainda em ser (não pode estar liquidado, protestado ou já baixado).

**Atenção:** Um pedido de baixa só será aceito a partir de 30 minutos da geração do mesmo boleto. Se solicitado antes desse prazo, o sistema retornará erro.

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Produção** | `https://api.bb.com.br/cobrancas/v2` |

#### Recurso
```
POST /boletos/:id/baixar
```

#### Headers
- `Authorization`: `Bearer {seuToken}`
- `Content-Type`: `application/json`

#### Query Params (obrigatório)

| Parâmetro | Ambiente | Valor |
|-----------|----------|-------|
| **gw-dev-app-key** | Homologação | `suaAppKey` |
| **gw-dev-app-key** | Produção | `suaAppKey` |

#### Path Variable (obrigatória)

| Campo | Exemplo para HOMOLOGAÇÃO | Observação |
|-------|--------------------------|------------|
| **id** | 00031285570000030000 | Informe o número do boleto que deseja baixar/cancelar. Deve seguir as regras do campo numeroTituloCliente. |

#### Body (Payload)

| Nº | Campo | Obrigatório | Exemplo para HOMOLOGAÇÃO | Observação |
|----|-------|-------------|--------------------------|-------------|
| 1 | numeroConvenio | S | 3128557 | Informe o número do convênio de cobrança. Deve ser o convênio ao qual pertence o boleto que se deseja baixar/cancelar. |

---

### 7.6 Baixa Operacional

#### Serviço
Lista baixa operacional. Retorna um JSON contendo os títulos de cobrança pagos (baixa operacional) naquele período pesquisado.

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br` |
| **Produção** | `https://api.bb.com.br` |

#### API
`/cobrancas/v2`

#### Recurso
```
GET /boletos-baixa-operacional
```

#### Headers
- `Authorization`: `Bearer {access_token}`

#### Query Params

| Nº | Campo | Obrigatório | Exemplo para HOMOLOGAÇÃO | Observação |
|----|-------|-------------|--------------------------|-------------|
| 1 | gw-dev-app-key | S | Conforme credenciamento | Chave da aplicação. É a developer_application_key que pode ser encontrada acessando o item Credenciais dentro da sua aplicação no Portal Developers BB. |
| 2 | agencia | S | 452 | Indica o número da agência cadastrada como beneficiária do convênio, sem o dígito e sem zeros a esquerda. |
| 3 | conta | S | 123873 | Indica o número da conta cadastrada como beneficiária do convênio, sem o dígito e sem zeros a esquerda. |
| 4 | carteira | S | 17 | Indica o número da carteira do convênio de cobrança. |
| 5 | variacao | S | 35 | Indica o número da variação do convênio de cobrança. |
| 6 | estadoBaixaTitulo | | 2 | Indica o estado de baixa a ser pesquisado. Domínio: 1 - Baixa Operacional BB; 2 - Baixa Operacional outros Bancos; 10 - Cancelamento de Baixa Operacional. |
| 7 | modalidadeTitulo | | 1 | Indica a modalidade de cobrança na qual o boleto está cadastrado no BB. Domínio: 1 - Simples; 4 - Vinculada. |
| 8 | dataInicioVencimentoTitulo | | 01.05.2021 | Data inicial de vencimento que delimita o período da consulta, formato dd.mm.aaaa. Se informada data posterior a atual, o campo dataFimVencimentoTitulo deve ser preenchido com data posterior ou igual a dataInicioVencimentoTitulo. Se informada data anterior ou igual a data atual e o campo dataFimVencimentoTitulo não for informado, o sistema assume a data atual como dataFimVencimentoTitulo. |
| 9 | dataFimVencimentoTitulo | | 31.05.2021 | Data final de vencimento que delimita o período da consulta, formato dd.mm.aaaa. Se informada, deve ser uma data posterior ou igual a dataInicioVencimentoTitulo. |
| 10 | dataInicioRegistroTitulo | | 01.05.2021 | Data inicial de registro que delimita o período da consulta, formato dd.mm.aaaa. Deve ser anterior ou igual a data atual. |
| 11 | dataFimRegistroTitulo | | 31.05.2021 | Data fim de registro que delimita o período da consulta, formato dd.mm.aaaa. Se informada, deve ser posterior ou igual a dataInicioRegistroTitulo, e igual ou anterior à data atual. Se não informada, o sistema assume a data atual. |
| 12 | dataInicioAgendamentoTitulo | S | 01.05.2021 | Data inicial de agendamento/pagamento que delimita o período da consulta, formato dd.mm.aaaa. Deve ser anterior ou igual a data atual. |
| 13 | dataFimAgendamentoTitulo | S | 31.05.2021 | Data fim de agendamento/pagamento que delimita o período da consulta, formato dd.mm.aaaa. Se informada, deve ser posterior ou igual a dataInicioAgendamentoTitulo, e igual ou anterior à data atual. Se não informada, o sistema assume a data atual. |
| 14 | horarioInicioAgendamentoTitulo | | 07:00:00 | Horário inicial de agendamento/pagamento que delimita o período da consulta, formato hh:mm:ss. Se informado, deve ser anterior ao horário atual. |
| 15 | horarioFimAgendamentoTitulo | | 17:00:00 | Horário final de agendamento/pagamento que delimita o período da consulta, formato hh:mm:ss. Se informada, deve ser posterior ou igual a combinação dataInicioAgendamentoTitulo e horarioInicioAgendamentoTitulo, e igual ou anterior ao horário atual. Se não informada, o sistema assume o horário atual. |
| 16 | idProximoTitulo | | 00012345670000000003 | Representa o índice da listagem pelo qual sua pesquisa se iniciará, podendo retornar até 300 registros por chamada. O default é vazio. Quando o resultado da pesquisa tiver mais que 300 registros, na resposta, o campo possuiMaisTitulos retornará com "S". Recomendamos utilizar o valor do campo proximoTitulo (informado na resposta), no campo idProximoTitulo da próxima chamada, para retornar com os próximos registros. |

#### Resposta (modelo)

```json
{
  "possuiMaisTitulos": "S",
  "proximoTitulo": "00012345670000000003",
  "lista": [
    {
      "carteira": 17,
      "variacao": 19,
      "convenio": 1234567,
      "titulo": {
        "id": "00012345670000000001",
        "estadoBaixaOperacional": 2,
        "modalidade": 1,
        "dataRegistro": "2021-06-08",
        "dataVencimento": "2021-06-14",
        "valorOriginal": 37.18,
        "agendamentoPagamento": {
          "momento": "2021-09-10 07:47:00",
          "instituicaoFinanceira": 1,
          "canal": 4
        }
      }
    },
    {
      "carteira": 17,
      "variacao": 19,
      "convenio": 1234567,
      "titulo": {
        "id": "00012345670000000002",
        "estadoBaixaOperacional": 1,
        "modalidade": 4,
        "dataRegistro": "2021-06-07",
        "dataVencimento": "2021-06-14",
        "valorOriginal": 199.44,
        "agendamentoPagamento": {
          "momento": "2021-09-10 09:34:13",
          "instituicaoFinanceira": 237,
          "canal": 3
        }
      }
    }
  ]
}
```

#### Campos da Resposta

| Nº | Campo | Observação |
|----|-------|------------|
| 1 | possuiMaisTitulos | Indica se existem mais títulos a serem listados dentro do período pesquisado. Se "N", indica que não existem mais títulos dentro do período pesquisado; se "S", indica que existem mais títulos, que podem ser consultados inserindo o valor de proximoTitulo no campo idProximoTitulo em uma nova consulta. |
| 2 | proximoTitulo | Indica o início de uma nova consulta, quando o campo possuiMaisTitulos vier com "S". |
| 3 | lista | Contém os títulos com indicador de baixa operacional no período pesquisado. |
| 3.1 | carteira | Indica a carteira de cobrança a qual o título pertence. |
| 3.2 | variacao | Indica a variação de cobrança a qual o título pertence. |
| 3.3 | convenio | Indica o convênio de cobrança ao qual o título pertence. |
| 3.4 | titulo | Traz os dados do título de cobrança. |
| 3.4.1 | id | Equivalente ao Nosso Número, identifica o título. |
| 3.4.2 | estadoBaixaOperacional | Indica o estado de baixa operacional do título. Domínio: 1 - Baixa Operacional BB; 2 - Baixa Operacional outros Bancos; 10 - Cancelamento de Baixa Operacional. |
| 3.4.3 | modalidade | Indica a modalidade de cobrança na qual o boleto está cadastrado no BB. Domínio: 1 - Simples; 4 - Vinculada. |
| 3.4.4 | dataRegistro | Indica a data de registro do título, formato aaaa-mm-dd. |
| 3.4.5 | dataVencimento | Indica a data de vencimento do título, formato aaaa-mm-dd. |
| 3.4.6 | valorOriginal | Indica o valor original do título. |
| 3.4.7 | agendamentoPagamento | Traz os dados de agendamento/pagamento do título. |
| 3.4.7.1 | momento | Indica o momento em que a informação de baixa operacional é processada no BB, formato aaaa-mm-dd hh:mm:ss. |
| 3.4.7.2 | instituicaoFinanceira | Indica o banco em que o agendamento/pagamento foi efetuado. Equivale ao código COMPE da instituição financeira. |
| 3.4.7.3 | canal | Indica o canal em que foi efetuado o agendamento/pagamento. Domínio: 01 - Agencias - Postos tradicionais, 02 - Terminal de Auto-atendimento, 03 - Internet (home / office banking), 04 - Pix, 05 - Correspondente bancário, 06 - Central de atendimento (Call Center), 07 - Arquivo Eletrônico, 08 - DDA, 09 - Correspondente bancário digital |

---

### 7.7 Listar Retorno do Movimento

#### Serviço
Esse recurso permite consultar os movimentos de retorno vinculados aos boletos registrados. Possibilita recuperar informações detalhadas sobre eventos ocorridos ao longo do ciclo de vida dos boletos, como pagamentos, baixas, alterações e outras movimentações relevantes.

**Observação:** O recurso será ativado no próximo dia útil após a solicitação de acesso, que deve ser feita ao Gerente de Relacionamento ou ao Gerente de Cash. Os dados disponibilizados pelo retorno serão referentes às datas posteriores à ativação e permanece disponível para consumo durante o prazo de 30 dias.

#### Endpoints

| Ambiente | URL |
|----------|-----|
| **Homologação** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Produção** | `https://api.bb.com.br/cobrancas/v2` |

#### Recurso
```
POST /convenios/:id/listar-retorno-movimento
```

#### Headers
- `Authorization`: `Bearer {seuToken}`
- `Content-Type`: `application/json`

#### Query Params (obrigatório)

| Parâmetro | Ambiente | Valor |
|-----------|----------|-------|
| **gw-dev-app-key** | Homologação | `suaAppKey` |
| **gw-dev-app-key** | Produção | `suaAppKey` |

#### Path Variable (obrigatória)

| Campo | Exemplo para HOMOLOGAÇÃO | Observação |
|-------|--------------------------|------------|
| **id** | Convênio | Identifica o número do convênio de cobrança. |

#### Body (Payload)

| Nº | Campo | Obrigatório | Exemplo para HOMOLOGAÇÃO | Observação |
|----|-------|-------------|--------------------------|-------------|
| 1 | dataMovimentoRetornoInicial | S | 13/02/2025 | Data inicial do processamento do movimento de retorno de cobrança de Boleto. |
| 2 | dataMovimentoRetornoFinal | S | 18/02/2025 | Data final do processamento do movimento de retorno de cobrança de Boleto. |
| 3 | codigoPrefixoAgencia | N | 3478 | Código do prefixo identificador de uma dependência do Banco. |
| 4 | numeroContaCorrente | N | 54160 | Número identificador de uma Conta Corrente contratada pelo cliente junto ao Banco do Brasil. |
| 5 | numeroCarteiraCobranca | N | 17 | Número identificador da carteira de Cobrança. Indica o tipo de serviço de cobrança, para o qual são aplicadas regras específicas. |
| 6 | numeroVariacaoCarteiraCobranca | N | 19 | Número identificador da variação da Carteira de Cobrança. Identifica cada grupo de condições específicas (variação) para um mesmo tipo de serviço de cobrança contratado pelo cliente (carteira), visando separar os títulos de cobrança de acordo com os interesses do próprio cliente e previamente negociados com o Banco. |
| 7 | numeroRegistroPretendido | N | 001 | Número do registro ou da página que deseja buscar na consulta. Quando primeira chamada, informar "001". |
| 8 | quantidadeRegistroPretendido | N | 1000 | Quantidade de registros ou páginas que desejar buscar na consulta. Quantidade máxima de 10000 boletos por chamada. |

---

## 8. Diferenciação de Ambientes

### 8.1 Ambientes Disponíveis

| Ambiente | `NODE_ENV` | Uso |
|----------|-----------|------|
| **Produção** | `production` | Sistema em produção, clientes reais |
| **Homologação** | `development` ou não definido | Testes e desenvolvimento, simulações |

### 8.2 Como Definir o Ambiente

A variável de ambiente `NODE_ENV` deve ser definida no arquivo `.env`:

```bash
# .env
NODE_ENV=production        # Produção
# OU
NODE_ENV=development      # Homologação/Desenvolvimento
```

### 8.3 Diferença entre Ambientes

**IMPORTANTE:** A **única diferença** entre homologação e produção são as **URLs dos endpoints** (authUrl, baseUrl).

Todo o resto deve ser **exatamente igual**:
- Certificados: Usar os mesmos certificados (vêm das tabelas do banco)
- gw-app-key: Buscar da tabela `CredenciaisAPI` (campo `developerAppKey`)
- Dados do convênio: Buscar da tabela `ConvenioCobranca`
- Funcionalidades: Todas iguais

### 8.4 gw-app-key (Chave de Aplicação do Banco do Brasil)

#### Como Funciona

A chave `gw-app-key` (ou `gw-dev-app-key`) é um identificador único fornecido pelo Banco do Brasil ao contratar um convênio.

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
   - `banco = "001"` (Código BB)
   - `contaCorrenteId = {ID da conta escolhida}`
   - `modalidadeApi = "001 - Cobrança"`
3. Extrair e usar o `developerAppKey` da credencial encontrada

#### Exemplo de Consulta

```typescript
// Buscar credenciais de COBRANÇA para uma conta específica
const credenciais = await prisma.credenciaisAPI.findFirst({
  where: {
    banco: "001",  // Código BB
    contaCorrenteId: contaCorrenteId,  // ID da conta corrente
    modalidadeApi: "001 - Cobrança",  // Tipo de API
  }
});

// Usar o gw-app-key da credencial encontrada
const gwAppKey = credenciais.developerAppKey;
```

### 8.5 Endpoints por Ambiente

#### Produção (`NODE_ENV=production`)

| Componente | URL |
|-----------|-----|
| **Autenticação** | `https://oauth.bb.com.br` |
| **API Base** | `https://api.bb.com.br/cobrancas/v2` |

#### Homologação (`NODE_ENV=development`)

| Componente | URL |
|-----------|-----|
| **Autenticação** | `https://oauth.hm.bb.com.br` |
| **API Base** | `https://api.hm.bb.com.br/cobrancas/v2` |
| **Testes** | `https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1` |

### 8.6 Lógica de Seleção de Ambiente

Na implementação do Service e do Cliente HTTP, usar a lógica:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

// Autenticação OAuth2
const authUrl = isProduction
  ? 'https://oauth.bb.com.br'        // Produção
  : 'https://oauth.hm.bb.com.br';    // Homologação

// API de Cobrança
const baseUrl = isProduction
  ? 'https://api.bb.com.br/cobrancas/v2'      // Produção
  : 'https://api.hm.bb.com.br/cobrancas/v2';  // Homologação
```

**Observação importante:** O gw-app-key sempre vem da tabela `CredenciaisAPI` (campo `developerAppKey`), independentemente do ambiente.

---

## 9. Webhooks

### 9.1 Notificações Webhook

O evento que aciona o Webhook da API Cobrança é o recebimento pelo Banco do Brasil de uma Baixa Operacional de um boleto.

Para maiores informações acesse a documentação específica de webhooks.

### 9.2 Autenticação Mútua

Para o uso do webhook de Cobrança, também é exigida autenticação mútua por meio de certificado digital SSL/TLS emitido por uma CA válida.

---

## 📚 Recursos Complementares

- Especificações técnicas para confecção de boleto de pagamento do BB: https://www.bb.com.br/docs/pub/emp/empl/dwn/Doc5175Bloqueto.pdf
- Instruções para validar o Layout do boleto
- Glossário de termos técnicos pertinentes à Cobrança Bancária
- Folder varejo e folder atacado (Bolepix)
- Especificação OpenAPI da API

---

## 🔜 Próximos Passos

### Para Implementação

1. ✅ **Documentação técnica completa consolidada**
2. ✅ **Endpoints mapeados** (registro, consulta, baixa, alteração, baixa operacional, retorno movimento)
3. 🔄 **Definir estrutura de DTOs** (requisição e resposta)
4. 🔄 **Configurar cliente HTTP** (mTLS, OAuth2, URLs por ambiente)
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
│   ├── criar-boleto.dto.ts
│   ├── alterar-boleto.dto.ts
│   ├── listar-boletos.dto.ts
│   ├── consultar-boleto.dto.ts
│   ├── baixar-boleto.dto.ts
│   ├── baixa-operacional.dto.ts
│   ├── retorno-movimento.dto.ts
│   └── response.dto.ts
└── utils/
    ├── calculadora-juros.ts
    └── validador-boletos.ts
```

---

**Última atualização:** 12/01/2026
**Status:** ✅ Documentação técnica completa consolidada - Pronto para implementação
