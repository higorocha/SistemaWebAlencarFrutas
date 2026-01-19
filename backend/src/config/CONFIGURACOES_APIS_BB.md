# Configurações Globais das APIs do Banco do Brasil

## Visão Geral

Este documento descreve a arquitetura centralizada de configuração e conexão com as APIs do Banco do Brasil no sistema. Todas as configurações estão centralizadas para facilitar manutenção, troca de certificados e adição de novas APIs.

## Estrutura de Arquivos

```
src/
├── config/
│   └── bb-api.config.ts          # ⭐ Configuração centralizada de todas as APIs
├── utils/
│   ├── bb-api-client-factory.ts  # Factory para criar clientes HTTP
│   ├── bb-api-client.ts          # Cliente específico PIX
│   ├── bb-extratos-client.ts     # Cliente específico Extratos
│   ├── bb-pagamentos-client.ts   # Cliente específico Pagamentos
│   └── bb-cobranca-client.ts     # Cliente específico Cobrança (planejado)
└── [serviços]/
    ├── pix/
    ├── extratos/
    ├── pagamentos/
    └── cobranca/
```

## APIs Configuradas

O sistema possui **4 APIs do Banco do Brasil** configuradas:

### 1. **PIX** (`PIX`)
- **Finalidade**: Consulta de transações PIX recebidas
- **URL Base**: `https://api-pix.bb.com.br/pix/v2/pix`
- **URL Auth**: `https://oauth.bb.com.br/oauth/token`
- **Certificados**: Bestnet
- **Header API Key**: `gw-dev-app-key`
- **Escopos OAuth**: `pix.read cob.read`

### 2. **Extratos** (`EXTRATOS`)
- **Finalidade**: Consulta de extratos bancários
- **URL Base**: `https://api-extratos.bb.com.br/extratos/v1`
- **URL Auth**: `https://oauth.bb.com.br/oauth/token`
- **Certificados**: Bestnet
- **Header API Key**: `X-Developer-Application-Key`
- **Escopos OAuth**: `extrato-info`

### 3. **Pagamentos** (`PAGAMENTOS`)
- **Finalidade**: Pagamentos em lote (PIX, Boletos, Guias)
- **URL Base**: `https://api-ip.bb.com.br/pagamentos-lote/v1`
- **URL Auth**: `https://oauth.bb.com.br/oauth/token`
- **Certificados**: Alencar
- **API Key**: Query param `gw-dev-app-key` (não header)
- **Escopos OAuth**: Variados por operação (ver seção de escopos)

### 4. **Cobrança** (`COBRANCA`)
- **Finalidade**: Emissão e gestão de boletos de cobrança
- **URL Base**: `https://api.bb.com.br/cobrancas/v2` (produção)
- **URL Auth**: `https://oauth.bb.com.br/oauth/token` (produção)
- **URL Base Homologação**: `https://api.hm.bb.com.br/cobrancas/v2`
- **URL Auth Homologação**: `https://oauth.hm.bb.com.br/oauth/token`
- **Certificados**: Alencar
- **API Key**: Query param `gw-dev-app-key` (não header)
- **Escopos OAuth**: `cobrancas.boletos-requisicao cobrancas.boletos-info`
- **Status**: ✅ Totalmente implementado

## Configuração Centralizada

### Arquivo Principal: `src/config/bb-api.config.ts`

Este arquivo concentra **todas as configurações** das APIs do BB:

```typescript
export const BB_APIS_CONFIG: Record<string, BBAPIConfig> = {
  PIX: { ... },
  EXTRATOS: { ... },
  PAGAMENTOS: { ... },
  COBRANCA: { ... }
}
```

#### Estrutura de Configuração

Cada API possui a seguinte estrutura:

```typescript
interface BBAPIConfig {
  name: string;                    // Nome da API
  authUrl: string;                  // URL para autenticação OAuth2
  baseUrl: string;                  // URL base da API
  certificates: BBCertificateConfig; // Configuração de certificados
  headers: {
    authKey: string;                // Header para autenticação
    apiKey: string;                 // Nome do header/param para API Key
  };
  timeout?: number;                 // Timeout em ms (padrão: 30000)
}
```

#### Certificados

Os certificados são organizados em dois grupos:

**Certificados Bestnet** (usados por PIX e EXTRATOS):
- `certs/bestnet_final.cer` - Certificado cliente
- `certs/bestnet_final_key.pem` - Chave privada
- CAs: GeoTrust_EV_RSA_CA_G2.cer, DigiCert_Global_Root_G2.cer, api-pix_bb_com_br.crt

**Certificados Alencar** (usados por PAGAMENTOS e COBRANCA):
- `certs/alencar_final.cer` - Certificado cliente
- `certs/alencar_final_key.pem` - Chave privada
- CAs: GeoTrust_EV_RSA_CA_G2.cer, DigiCert_Global_Root_G2.cer, api-pix_bb_com_br.crt

### Ambiente (Produção vs Homologação)

O sistema detecta automaticamente o ambiente através da variável `NODE_ENV`:

- **Produção**: `NODE_ENV=production` → Usa URLs de produção
- **Homologação/Desenvolvimento**: Qualquer outro valor → Usa URLs de homologação (quando disponíveis)

**Nota**: Atualmente apenas a API de COBRANCA possui URLs diferentes para homologação. As outras APIs usam as mesmas URLs em ambos os ambientes.

## Factory de Clientes HTTP

### Arquivo: `src/utils/bb-api-client-factory.ts`

A factory centraliza a criação de clientes HTTP com TLS mútuo (mTLS) para todas as APIs.

#### Funções Principais

**1. `createBBClient(options)`**
Factory principal que cria o cliente apropriado baseado no tipo:

```typescript
createBBClient({
  apiName: 'PIX' | 'EXTRATOS' | 'PAGAMENTOS' | 'COBRANCA',
  appKey: string,              // developerAppKey
  clientType: 'auth' | 'api'   // Tipo de cliente
})
```

**2. `createBBAuthClient(options)`**
Cria cliente Axios para autenticação OAuth2:
- Configura TLS mútuo com certificados
- Define `baseURL` como `authUrl` da API
- Header `Content-Type: application/x-www-form-urlencoded`
- **NÃO** adiciona `gw-dev-app-key` (apenas Basic Auth)

**3. `createBBAPIClient(options)`**
Cria cliente Axios para chamadas da API:
- Configura TLS mútuo com certificados
- Define `baseURL` como `baseUrl` da API
- Adiciona header `apiKey` com o `developerAppKey`
- Header `Content-Type: application/json`

#### Carregamento de Certificados

A factory carrega automaticamente os certificados do sistema de arquivos:

```typescript
function loadCertificates(config: BBAPIConfig): {
  clientCert: Buffer;
  clientKey: Buffer;
  caCerts: Buffer[];
}
```

Os certificados são resolvidos a partir do diretório raiz do projeto (`process.cwd()`).

#### Validação de Certificados

A factory oferece utilitários para validar certificados:

- `validateCertificates(apiName)`: Verifica se todos os arquivos de certificado existem
- `getCertificateInfo(apiName)`: Retorna informações sobre os certificados configurados

## Autenticação OAuth2

### Fluxo de Autenticação

Todas as APIs do BB usam **OAuth2 com grant type `client_credentials`**:

1. **Obtenção de Credenciais**: Cada serviço busca as credenciais do banco de dados através do `CredenciaisAPIService`
2. **Criação do Cliente Auth**: Usa `createBBClient` com `clientType: 'auth'`
3. **Requisição de Token**: POST para `authUrl` com:
   - Body: `grant_type=client_credentials&scope=[escopos]`
   - Auth: Basic Auth com `clienteId` e `clienteSecret`
   - Header: `Content-Type: application/x-www-form-urlencoded`
4. **Cache do Token**: Token é cacheado em memória com expiração
5. **Uso do Token**: Token é usado no header `Authorization: Bearer [token]`

### Cache de Tokens

Cada serviço implementa seu próprio cache de tokens:

#### PIX Service
- Cache simples: `cachedToken` e `tokenExpiry`
- Expiração: `expires_in - 60 segundos` (margem de segurança)

#### Extratos Service
- Cache por credencial: `Map<credencialId, { token, expiry }>`
- Permite múltiplas credenciais simultâneas

#### Pagamentos Service
- Cache por credencial + escopos: `Map<"credencialId:escopos", { token, expiry }>`
- **Importante**: Tokens têm escopos específicos, então são cacheados separadamente

#### Cobrança Service
- Cache por conta corrente: `Map<contaCorrenteId, { token, expiry }>`
- Implementado em `CobrancaAuthService` separado do serviço principal
- Permite múltiplas contas correntes simultâneas

### Escopos OAuth2

Cada API requer escopos específicos:

**PIX**:
- `pix.read` - Leitura de transações PIX
- `cob.read` - Leitura de cobranças

**Extratos**:
- `extrato-info` - Consulta de extratos

**Pagamentos** (variados por operação):
- `pagamentos-lote.transferencias-pix-requisicao` - Solicitar transferências PIX
- `pagamentos-lote.transferencias-pix-info` - Consultar transferências PIX
- `pagamentos-lote.pix-info` - Informações PIX
- `pagamentos-lote.boletos-requisicao` - Solicitar pagamentos de boletos
- `pagamentos-lote.boletos-info` - Consultar boletos
- `pagamentos-lote.guias-codigo-barras-requisicao` - Solicitar pagamentos de guias
- `pagamentos-lote.guias-codigo-barras-info` - Consultar guias
- `pagamentos-lote.lotes-info` - Informações de lotes
- `pagamentos-lote.lotes-requisicao` - Operações de lotes
- `pagamentos-lote.cancelar-requisicao` - Cancelar pagamentos

**Cobrança**:
- `cobrancas.boletos-requisicao` - Solicitar criação, alteração e baixa de boletos
- `cobrancas.boletos-info` - Consultar informações de boletos

## Clientes Específicos por API

Cada API possui um arquivo de cliente específico em `src/utils/` que simplifica o uso da factory:

### `bb-api-client.ts` (PIX)
```typescript
export function createApiClient(gwAppKey: string)
export const BB_API_URLS
```

### `bb-extratos-client.ts` (Extratos)
```typescript
export function createExtratosApiClient(developerAppKey: string)
export function createExtratosAuthClient()
export const BB_EXTRATOS_API_URLS
```

### `bb-pagamentos-client.ts` (Pagamentos)
```typescript
export function createPagamentosApiClient(developerAppKey: string)
export function createPagamentosAuthClient(developerAppKey: string)
export const BB_PAGAMENTOS_API_URLS
```

**Nota**: Para Pagamentos, o `gw-dev-app-key` é adicionado como **query param** através de um interceptor Axios, não como header.

### `bb-cobranca-client.ts` (Cobrança)
```typescript
export function createCobrancaApiClient(developerAppKey: string)
export function createCobrancaAuthClient()
```

**Nota**: Para Cobrança, o `gw-dev-app-key` é adicionado como **query param** nas requisições, não como header.

## Como Usar

### Exemplo: Obter Token e Fazer Requisição

```typescript
// 1. Buscar credenciais do banco
const credencial = await credenciaisAPIService.findByBancoAndModalidade('001', '002 - Pix');

// 2. Criar cliente de autenticação
const authClient = createBBClient({
  apiName: 'PIX',
  appKey: '', // Não usado para auth
  clientType: 'auth'
});

// 3. Obter token OAuth2
const response = await authClient.post('', 
  new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'pix.read cob.read'
  }).toString(),
  {
    auth: {
      username: credencial.clienteId,
      password: credencial.clienteSecret
    }
  }
);

const token = response.data.access_token;

// 4. Criar cliente da API
const apiClient = createBBClient({
  apiName: 'PIX',
  appKey: credencial.developerAppKey,
  clientType: 'api'
});

// 5. Fazer requisição com token
const resultado = await apiClient.get('/transacoes', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### Exemplo: Usando Cliente Específico (Recomendado)

```typescript
// Mais simples usando cliente específico
const authClient = createExtratosAuthClient();
const apiClient = createExtratosApiClient(credencial.developerAppKey);
```

## Manutenção

### Adicionar Nova API

1. **Adicionar configuração** em `bb-api.config.ts`:
```typescript
export const BB_APIS_CONFIG: Record<string, BBAPIConfig> = {
  // ... APIs existentes
  NOVA_API: {
    name: 'NOVA_API',
    authUrl: 'https://oauth.bb.com.br/oauth/token',
    baseUrl: 'https://api-nova.bb.com.br/v1',
    certificates: BB_CERTIFICATES_ALENCAR, // ou BESTNET
    headers: {
      authKey: 'Content-Type',
      apiKey: 'gw-dev-app-key'
    },
    timeout: 30000
  }
}
```

2. **Criar cliente específico** em `src/utils/bb-nova-api-client.ts`:
```typescript
export function createNovaApiClient(developerAppKey: string) {
  return createBBClient({
    apiName: 'NOVA_API',
    appKey: developerAppKey,
    clientType: 'api'
  });
}
```

3. **Criar serviço** em `src/nova-api/nova-api.service.ts` com método `obterTokenDeAcesso()`

### Trocar Certificados

1. Substituir arquivos na pasta `certs/`
2. Atualizar nomes dos arquivos em `bb-api.config.ts` se necessário
3. Reiniciar a aplicação

**Nota**: Não é necessário alterar código nos serviços, apenas os arquivos de certificado.

### Validar Certificados

```typescript
import { validateCertificates, getCertificateInfo } from './utils/bb-api-client-factory';

// Validar se certificados existem
const isValid = validateCertificates('PIX');
console.log('Certificados válidos:', isValid);

// Obter informações dos certificados
const info = getCertificateInfo('PIX');
console.log('Info certificados:', info);
```

## Estrutura de Credenciais no Banco

As credenciais são armazenadas na tabela `CredenciaisAPI` com os seguintes campos:

- `banco`: Código do banco (ex: '001' para BB)
- `modalidadeApi`: Modalidade da API (ex: '002 - Pix', '004 - Pagamentos')
- `contaCorrenteId`: ID da conta corrente vinculada
- `developerAppKey`: Chave da aplicação (usada como API Key)
- `clienteId`: Client ID para OAuth2
- `clienteSecret`: Client Secret para OAuth2

## Troubleshooting

### Erro: "Certificado não encontrado"
- Verificar se os arquivos de certificado existem na pasta `certs/`
- Verificar se os caminhos em `bb-api.config.ts` estão corretos
- Usar `validateCertificates()` para diagnosticar

### Erro: "Token inválido" ou "401 Unauthorized"
- Verificar se as credenciais estão corretas no banco
- Verificar se os escopos solicitados estão corretos
- Verificar se o token não expirou (cache pode estar desatualizado)
- Forçar refresh do token: `obterTokenDeAcesso(credencial, scopes, true)`

### Erro: "TLS handshake failed"
- Verificar se os certificados estão válidos e não expirados
- Verificar se os certificados CA estão corretos
- Em homologação, pode ser necessário ajustar `rejectUnauthorized` temporariamente

### Erro: "API Key inválida"
- Verificar se `developerAppKey` está correto
- Para Pagamentos, verificar se `gw-dev-app-key` está sendo enviado como query param
- Para outras APIs, verificar se está no header correto

## Referências

- Documentação específica de cada API:
  - `src/pix/README.md`
  - `src/extratos/README.md`
  - `src/pagamentos/README.md`
  - `src/cobranca/DOCUMENTACAO_BB_COBRANCA.md`

## Notas Importantes

1. **TLS Mútuo**: Todas as APIs requerem TLS mútuo (mTLS) com certificados específicos
2. **Ambiente**: O sistema detecta automaticamente produção vs homologação
3. **Cache**: Tokens são cacheados em memória para evitar requisições desnecessárias
4. **Escopos**: Cada operação pode requerer escopos específicos (especialmente Pagamentos)
5. **API Key**: Formato varia por API (header vs query param)
6. **Certificados**: Dois conjuntos de certificados (Bestnet e Alencar) são usados conforme a API
