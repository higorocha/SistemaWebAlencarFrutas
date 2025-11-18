# Teste Postman - PIX vs Pagamentos (OAuth com/sem gw-dev-app-key)

## Sobre o "Basic" (Authorization Basic)

O **"basic"** que você mencionou é o **Authorization Basic** usado na autenticação OAuth2.

### Como funciona:
1. O BB espera `Authorization: Basic {base64(client_id:client_secret)}`
2. O Postman/Axios faz isso automaticamente quando você configura "Basic Auth"
3. O valor que você viu (`ZXlKcFpDSTZJamNpTENKamIyUnBaMjlRZFdKc2FXTmhaRzl5SWpvd0xDSmpiMlJwWjI5VGIyWjBkMkZ5WlNJNk1UWXdOVGczTENKelpYRjFaVzVqYVdGc1NXNXpkR0ZzWVdOaGJ5STZNWDA6ZXlKcFpDSTZJakZsWlRabU1UUXRaRGt4TmkwME5tSXlMVGxsWm1FdFltSmlZVEUyTm1FNU1tUWlMQ0pqYjJScFoyOVFkV0pzYVdOaFpHOXlJam93TENKamIyUnBaMjlUYjJaMGQyRnlaU0k2TVRZd05UZzNMQ0p6WlhGMVpXNWphV0ZzU1c1emRHRnNZV05oYnlJNk1Td2ljMlZ4ZFdWdVkybGhiRU55WldSbGJtTnBZV3dpT2pFc0ltRnRZbWxsYm5SbElqb2lhRzl0YjJ4dloyRmpZVzhpTENKcFlYUWlPakUzTmpNd05qTXlNemcxTnpKOQ==`) é o Base64 de `client_id:client_secret`

### No Postman:
- **Auth Type**: Basic Auth
- **Username**: `{client_id}`
- **Password**: `{client_secret}`
- O Postman automaticamente cria o header: `Authorization: Basic {base64}`

---

## Teste 1: PIX OAuth (SEM gw-dev-app-key) - Seguindo Documentação

### Endpoint
```
POST https://oauth.bb.com.br/oauth/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
```
⚠️ **NÃO enviar `gw-dev-app-key` no header** (seguindo documentação oficial)

### Body (x-www-form-urlencoded)
```
grant_type: client_credentials
scope: pix.read cob.read
```

### Autenticação
- **Type**: Basic Auth
- **Username**: `eyJpZCI6ImM5OWIzZTAtMTU5OS00NDkzLTljNzIiLCJjb2RpZ29QdWJsaWNhZG9yIjowLCJjb2RpZ29Tb2Z0d2FyZSI6MTM0NzIxLCJzZXF1ZW5jaWFsSW5zdGFsYWNhbyI6MX0`
- **Password**: `eyJpZCI6IjBjMGQ4ZGEtOWY2MC00MjdlLWI2ODctZDQ2NzU2ZGFiNmVkOWEiLCJjb2RpZ29QdWJsaWNhZG9yIjowLCJjb2RpZ29Tb2Z0d2FyZSI6MTM0NzIxLCJzZXF1ZW5jaWFsSW5zdGFsYWNhbyI6MSwic2VxdWVuY2lhbENyZWRlbmNpYWwiOjEsImFtYmllbnRlIjoicHJvZHVjYW8iLCJpYXQiOjE3NjI0NTkxMTQ2MzJ9`

### Resultado Esperado
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Teste 2: PIX OAuth (COM gw-dev-app-key) - Como está no código atual

### Endpoint
```
POST https://oauth.bb.com.br/oauth/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
gw-dev-app-key: 8500502ed72549049ddea960d6c5452f
```
⚠️ **ENVIAR `gw-dev-app-key` no header** (como está no código atual)

### Body (x-www-form-urlencoded)
```
grant_type: client_credentials
scope: pix.read cob.read
```

### Autenticação
- **Type**: Basic Auth
- **Username**: `eyJpZCI6ImM5OWIzZTAtMTU5OS00NDkzLTljNzIiLCJjb2RpZ29QdWJsaWNhZG9yIjowLCJjb2RpZ29Tb2Z0d2FyZSI6MTM0NzIxLCJzZXF1ZW5jaWFsSW5zdGFsYWNhbyI6MX0`
- **Password**: `eyJpZCI6IjBjMGQ4ZGEtOWY2MC00MjdlLWI2ODctZDQ2NzU2ZGFiNmVkOWEiLCJjb2RpZ29QdWJsaWNhZG9yIjowLCJjb2RpZ29Tb2Z0d2FyZSI6MTM0NzIxLCJzZXF1ZW5jaWFsSW5zdGFsYWNhbyI6MSwic2VxdWVuY2lhbENyZWRlbmNpYWwiOjEsImFtYmllbnRlIjoicHJvZHVjYW8iLCJpYXQiOjE3NjI0NTkxMTQ2MzJ9`

### Resultado Esperado
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Teste 3: Pagamentos OAuth (COM gw-dev-app-key) - Como está no código

### Endpoint
```
POST https://oauth.hm.bb.com.br/oauth/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
gw-dev-app-key: {seu_developerAppKey_pagamentos}
```
⚠️ **ENVIAR `gw-dev-app-key` no header** (como está no código atual)

### Body (x-www-form-urlencoded)
```
grant_type: client_credentials
scope: pagamentos-lote.transferencias-pix-requisicao pagamentos-lote.transferencias-pix-info pagamentos-lote.pix-info pagamentos-lote.boletos-requisicao pagamentos-lote.boletos-info pagamentos-lote.guias-codigo-barras-requisicao pagamentos-lote.guias-codigo-barras-info pagamentos-lote.lotes-info pagamentos-lote.pagamentos-info
```

### Autenticação
- **Type**: Basic Auth
- **Username**: `{seu_clienteId_pagamentos}`
- **Password**: `{seu_clienteSecret_pagamentos}`

### Resultado Esperado
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Teste 4: Pagamentos OAuth (SEM gw-dev-app-key) - Teste alternativo

### Endpoint
```
POST https://oauth.hm.bb.com.br/oauth/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
```
⚠️ **NÃO enviar `gw-dev-app-key` no header** (teste alternativo)

### Body (x-www-form-urlencoded)
```
grant_type: client_credentials
scope: pagamentos-lote.transferencias-pix-requisicao pagamentos-lote.transferencias-pix-info pagamentos-lote.pix-info pagamentos-lote.boletos-requisicao pagamentos-lote.boletos-info pagamentos-lote.guias-codigo-barras-requisicao pagamentos-lote.guias-codigo-barras-info pagamentos-lote.lotes-info pagamentos-lote.pagamentos-info
```

### Autenticação
- **Type**: Basic Auth
- **Username**: `{seu_clienteId_pagamentos}`
- **Password**: `{seu_clienteSecret_pagamentos}`

### Resultado Esperado
- Se funcionar: token retornado
- Se não funcionar: erro 400/401 indicando que `gw-dev-app-key` é obrigatório

---

## Comparação: Por que PIX funciona e Pagamentos não?

### Diferenças Identificadas:

1. **Ambiente**:
   - PIX: Produção (`oauth.bb.com.br`)
   - Pagamentos: Homologação (`oauth.hm.bb.com.br`)

2. **Certificados mTLS**:
   - PIX: Certificados `bestnet`
   - Pagamentos: Certificados `alencar`

3. **Endpoints**:
   - PIX: `https://oauth.bb.com.br/oauth/token`
   - Pagamentos: `https://oauth.hm.bb.com.br/oauth/token`

4. **Scopes**:
   - PIX: `pix.read cob.read`
   - Pagamentos: `pagamentos-lote.transferencias-pix-requisicao ...` (múltiplos scopes)

### Possíveis Problemas:

1. **Ambiente de Homologação Indisponível**: O BB pode estar com problemas no ambiente de homologação
2. **Certificados mTLS**: Os certificados `alencar` podem não estar configurados corretamente no Postman
3. **Credenciais**: As credenciais de Pagamentos podem estar incorretas ou expiradas
4. **gw-dev-app-key**: Pode ser obrigatório para Pagamentos mas não para PIX

---

## Checklist para Teste no Postman

### Para PIX:
- [ ] Teste 1: OAuth SEM `gw-dev-app-key` → Funciona?
- [ ] Teste 2: OAuth COM `gw-dev-app-key` → Funciona?
- [ ] Comparar: Qual funciona melhor?

### Para Pagamentos:
- [ ] Teste 3: OAuth COM `gw-dev-app-key` → Funciona?
- [ ] Teste 4: OAuth SEM `gw-dev-app-key` → Funciona?
- [ ] Comparar: Qual funciona?

### Análise:
- [ ] Se PIX funciona SEM `gw-dev-app-key`: PIX não precisa
- [ ] Se PIX funciona COM `gw-dev-app-key`: PIX aceita mas não precisa
- [ ] Se Pagamentos funciona COM `gw-dev-app-key`: Pagamentos precisa
- [ ] Se Pagamentos funciona SEM `gw-dev-app-key`: Pagamentos não precisa

---

## Próximos Passos

1. **Testar no Postman** seguindo os 4 testes acima
2. **Comparar resultados** entre PIX e Pagamentos
3. **Ajustar código** baseado nos resultados:
   - Se Pagamentos precisa de `gw-dev-app-key` no OAuth: manter como está
   - Se Pagamentos não precisa: remover do OAuth (como fizemos no PIX)
4. **Verificar certificados mTLS** se o problema persistir

---

## Notas Importantes

- **mTLS no Postman**: Para testar no Postman, você precisa configurar os certificados mTLS. Isso pode ser complicado. Uma alternativa é testar via código mesmo.
- **Ambiente de Homologação**: O BB pode estar instável. Se der 404, pode ser indisponibilidade temporária.
- **Logs do Backend**: Compare os logs do backend com o que você está testando no Postman para garantir que estão iguais.

