# 🚀 Configuração do Render.com - AlencarFrutas Backend

## 📋 Variáveis de Ambiente para Produção

Acesse o **Dashboard do Render.com** → Seu serviço → **Environment** e configure:

### ✅ Variáveis Obrigatórias

```
NODE_ENV=production
PORT=5002
DATABASE_URL=<sua_url_postgresql_do_render>
JWT_SECRET=alencar_frutas_2025@SecretKey
JWT_EXPIRES_IN=7d
CRYPTO_SECRET_KEY=82e7cc04ca0c5391b007be07d72d4d07f2381f8f1f92f810fce4703c9b8054fc
```

### 🔒 CORS - CONFIGURAÇÃO CRÍTICA DE SEGURANÇA

**⚠️ ATENÇÃO**: Esta é a configuração mais importante para segurança!

```
CORS_ORIGIN=https://alencarfrutas.com.br,https://www.alencarfrutas.com.br
```

**❌ NUNCA USE:**
```
CORS_ORIGIN=*  # ⛔ PROIBIDO EM PRODUÇÃO!
```

### 📡 Socket.IO (opcional - usa mesmo valor do CORS)

```
SOCKET_CORS_ORIGIN=https://alencarfrutas.com.br,https://www.alencarfrutas.com.br
```

---

## 🔧 Passo a Passo de Configuração

### 1. Acessar Dashboard

1. Vá para https://dashboard.render.com
2. Clique no serviço **sistemawebalencarfrutas**
3. Clique na aba **Environment**

### 2. Adicionar/Editar Variáveis

Para cada variável acima:

1. Clique em **Add Environment Variable**
2. **Key**: Nome da variável (ex: `NODE_ENV`)
3. **Value**: Valor da variável (ex: `production`)
4. Clique em **Save Changes**

### 3. Verificar Variáveis Críticas

Confira se estas variáveis estão corretas:

- [x] `NODE_ENV` = `production`
- [x] `CORS_ORIGIN` = `https://alencarfrutas.com.br,https://www.alencarfrutas.com.br`
- [x] `DATABASE_URL` = URL do PostgreSQL do Render
- [x] `JWT_SECRET` = Sua chave secreta

### 4. Redeploy

Após salvar as variáveis:

1. Clique em **Manual Deploy** → **Deploy latest commit**
2. Aguarde o build completar (~5-10 minutos)
3. Verifique os logs para confirmar CORS configurado corretamente

---

## ✅ Como Verificar se CORS Está Correto

### Nos Logs do Render.com

Após o deploy, você deve ver nos logs:

```
🌐 [CORS] Ambiente: production
🌐 [CORS] Total de origens permitidas: 2
🌐 [CORS] Modo produção: Lista de origens restrita
```

**✅ BOM**: Se aparecer "Modo produção: Lista de origens restrita"

**❌ RUIM**: Se aparecer alerta de wildcard:
```
🚨🚨🚨 ALERTA DE SEGURANÇA CRÍTICA 🚨🚨🚨
🚨 CORS wildcard (*) detectado em PRODUÇÃO!
```

### Teste Manual com cURL

```bash
# ✅ Teste com origem válida (deve funcionar)
curl -H "Origin: https://alencarfrutas.com.br" \
     -H "Content-Type: application/json" \
     https://sistemawebalencarfrutas.onrender.com/health

# Deve retornar:
# Access-Control-Allow-Origin: https://alencarfrutas.com.br

# ❌ Teste com origem inválida (deve bloquear)
curl -H "Origin: https://site-malicioso.com" \
     -H "Content-Type: application/json" \
     https://sistemawebalencarfrutas.onrender.com/health

# Deve retornar: CORS error (bloqueado)
```

---

## 🆘 Resolução de Problemas

### Problema 1: Frontend não consegue acessar API

**Sintoma**: Erro no console do navegador:
```
Access to fetch at 'https://sistemawebalencarfrutas.onrender.com'
from origin 'https://alencarfrutas.com.br' has been blocked by CORS policy
```

**Solução**:
1. Verifique se `CORS_ORIGIN` contém `https://alencarfrutas.com.br`
2. Verifique se não tem espaços extras na variável
3. Faça redeploy após corrigir

### Problema 2: App Mobile não funciona

**Sintoma**: App mobile não consegue fazer requisições

**Solução**:
- Apps mobile nativos **não enviam** header `Origin`
- O código já permite requisições sem `Origin`
- Verifique se o token JWT está sendo enviado corretamente

### Problema 3: Alerta de wildcard nos logs

**Sintoma**: Logs mostram alerta de segurança crítica

**Solução**:
1. Edite variável `CORS_ORIGIN` no Render.com
2. Mude de `*` para `https://alencarfrutas.com.br,https://www.alencarfrutas.com.br`
3. Salve e faça redeploy

---

## 📊 Checklist Final

Antes de considerar a configuração completa:

- [ ] Variável `NODE_ENV=production` configurada
- [ ] Variável `CORS_ORIGIN` com lista branca (sem wildcard)
- [ ] Logs mostram "Modo produção: Lista de origens restrita"
- [ ] Frontend produção consegue acessar API
- [ ] App mobile consegue acessar API
- [ ] Teste com origem inválida bloqueia corretamente
- [ ] Sem alertas de segurança nos logs

---

## 🔐 Segurança

**✅ Configuração Segura:**
```
CORS_ORIGIN=https://alencarfrutas.com.br,https://www.alencarfrutas.com.br
```

**❌ Configurações Perigosas (NUNCA USAR):**
```
CORS_ORIGIN=*                    # ⛔ Aceita qualquer origem
CORS_ORIGIN=http://              # ⛔ Permite qualquer HTTP
# (variável não definida)         # ⚠️ Usa fallback do código
```

---

## 📞 Suporte

Se precisar adicionar uma nova origem (ex: novo domínio):

1. Edite `backend/src/main.ts` (linha ~76)
2. Adicione a nova URL no array `production`
3. Faça commit e push
4. Render.com fará deploy automático

**Exemplo:**
```typescript
production: [
  'https://alencarfrutas.com.br',
  'https://www.alencarfrutas.com.br',
  'https://app.alencarfrutas.com.br',  // ← Nova origem
],
```

---

**Última Atualização**: 04/11/2025
**URL Backend**: https://sistemawebalencarfrutas.onrender.com
**URL Frontend**: https://alencarfrutas.com.br
