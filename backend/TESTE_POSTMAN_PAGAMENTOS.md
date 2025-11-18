# Teste Manual - API de Pagamentos BB (Homologação)

## 1. Obter Token OAuth2

### Endpoint
```
POST https://oauth.hm.bb.com.br/oauth/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
gw-dev-app-key: {seu_developerAppKey}
```

### Body (x-www-form-urlencoded)
```
grant_type: client_credentials
scope: pagamentos-lote.transferencias-pix-requisicao pagamentos-lote.transferencias-pix-info pagamentos-lote.pix-info pagamentos-lote.boletos-requisicao pagamentos-lote.boletos-info pagamentos-lote.guias-codigo-barras-requisicao pagamentos-lote.guias-codigo-barras-info pagamentos-lote.lotes-info pagamentos-lote.pagamentos-info
```

### Autenticação
- **Type**: Basic Auth
- **Username**: `{seu_clienteId}` (da credencial de pagamentos)
- **Password**: `{seu_clienteSecret}` (da credencial de pagamentos)

### Observações
- **SIM**, enviar `gw-dev-app-key` como **header** na chamada de OAuth (corrigido após verificar padrão do PIX)
- A resposta deve conter `access_token` e `expires_in`

---

## 2. Verificar se `gw-dev-app-key` está sendo enviado

### Endpoint de Teste (Consultar Lote)
```
GET https://homologa-api-ip.bb.com.br:7144/pagamentos-lote/v1/lotes-transferencias-pix/{numeroRequisicao}/solicitacao?gw-dev-app-key={seu_developerAppKey}
```

### Headers
```
Authorization: Bearer {access_token_obtido_no_passo_1}
Content-Type: application/json
```

### Query Params
```
gw-dev-app-key: {seu_developerAppKey}
```

### Observações
- O `gw-dev-app-key` deve ser enviado como **query param**, não como header
- O token OAuth deve ser enviado no header `Authorization: Bearer {token}`

---

## 3. Verificação no Código

### OAuth (obter token)
- ✅ **SIM**, envia `gw-dev-app-key` como **header** (corrigido - seguindo padrão do PIX)
- ✅ Usa Basic Auth com `clienteId:clienteSecret`
- ✅ Envia `grant_type=client_credentials` e `scope` no body

### API de Pagamentos (chamadas após obter token)
- ✅ Envia `gw-dev-app-key` como **query param** (via interceptor)
- ✅ Envia `Authorization: Bearer {token}` no header

---

## 4. Checklist para Teste no Postman

### Passo 1: Obter Token
- [ ] URL: `https://oauth.hm.bb.com.br/oauth/token`
- [ ] Method: `POST`
- [ ] Auth: Basic Auth com `clienteId` e `clienteSecret`
- [ ] Headers:
  - `Content-Type: application/x-www-form-urlencoded`
  - `gw-dev-app-key: {seu_developerAppKey}` ⚠️ **IMPORTANTE: Incluir como header**
- [ ] Body (x-www-form-urlencoded):
  - `grant_type`: `client_credentials`
  - `scope`: `pagamentos-lote.transferencias-pix-requisicao pagamentos-lote.transferencias-pix-info ...`

### Passo 2: Testar Chamada à API
- [ ] URL: `https://homologa-api-ip.bb.com.br:7144/pagamentos-lote/v1/lotes-transferencias-pix/123456/solicitacao?gw-dev-app-key={developerAppKey}`
- [ ] Method: `GET`
- [ ] Headers:
  - `Authorization`: `Bearer {token_do_passo_1}`
  - `Content-Type`: `application/json`
- [ ] Query Params:
  - `gw-dev-app-key`: `{seu_developerAppKey}`

### Passo 3: Verificar Resposta
- [ ] Se retornar 200/201: token e `gw-dev-app-key` estão corretos
- [ ] Se retornar 401: problema com token OAuth
- [ ] Se retornar 400: verificar se `gw-dev-app-key` está correto
- [ ] Se retornar 404: verificar URL e se o endpoint está disponível

---

## 5. Valores para Teste (Homologação)

Substitua pelos valores reais da sua credencial de pagamentos:

```
clienteId: {valor_da_coluna_clienteId_da_tabela_credenciais_api}
clienteSecret: {valor_da_coluna_clienteSecret_da_tabela_credenciais_api}
developerAppKey: {valor_da_coluna_developerAppKey_da_tabela_credenciais_api}
numeroRequisicao: 123456 (exemplo para homologação)
```

---

## 6. Possíveis Problemas

### Erro 404 no OAuth
- Verificar se a URL está correta: `https://oauth.hm.bb.com.br/oauth/token`
- Verificar se o ambiente de homologação está disponível

### Erro 401 (Unauthorized)
- Verificar se `clienteId` e `clienteSecret` estão corretos
- Verificar se o Basic Auth está configurado corretamente no Postman

### Erro 400 (Bad Request)
- Verificar se o `scope` está completo e correto
- Verificar se `grant_type` está como `client_credentials`

### Erro ao chamar API de Pagamentos
- Verificar se o token está sendo enviado no header `Authorization`
- Verificar se `gw-dev-app-key` está sendo enviado como query param
- Verificar se o certificado mTLS está configurado (no Postman, pode ser necessário configurar certificados)

---

## 7. Logs do Backend para Comparar

Quando o backend faz a chamada, você verá logs como:

```
🔑 [PAGAMENTOS-SERVICE] Obtendo novo token para credencial {id}
🔍 [PAGAMENTOS-SERVICE] Config OAuth Pagamentos: { baseURL, tokenPath, scopes, ... }
```

Compare os valores que aparecem nos logs com os que você está usando no Postman.

