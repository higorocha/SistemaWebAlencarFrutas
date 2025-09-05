# 🔐 Sistema de Autenticação - AlencarFrutas

## 📋 Visão Geral

Este documento descreve o sistema de autenticação implementado no backend do AlencarFrutas, incluindo **Rate Limiting** e **Tokens com Validação Variada**.

---

## 🚀 Rate Limiting

### **Como Funciona**

O Rate Limiting é uma técnica de segurança que limita o número de requisições que um usuário/IP pode fazer em um determinado período.

### **Configuração Implementada**

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    ttl: 60000, // 1 minuto
    limit: 10, // 10 requisições por minuto
  },
  {
    ttl: 3600000, // 1 hora
    limit: 100, // 100 requisições por hora
  },
])
```

### **Rate Limiting Específico**

| Endpoint | Limite | Período | Descrição |
|----------|--------|---------|-----------|
| `/auth/login` | 5 tentativas | 1 minuto | Previne força bruta |
| Outros endpoints | 10 requisições | 1 minuto | Proteção geral |
| Rotas administrativas | Sem limite | - | Acesso livre |

### **Decorators Utilizados**

- `@Throttle()` - Aplica rate limiting customizado
- `@SkipThrottle()` - Remove rate limiting do endpoint

---

## 🔐 Tokens com Validação Variada

### **Tipos de Login**

```typescript
export enum TipoLogin {
  WEB = 'web',      // Sistema web
  MOBILE = 'mobile' // Aplicativo mobile
}
```

### **Validação por Tipo**

| Tipo | Validade | Descrição |
|------|----------|-----------|
| **WEB** | Até 23:59 do dia atual | Para sistema web |
| **MOBILE** | 30 dias | Para aplicativo mobile |

### **Implementação**

```typescript
private calcularExpiracao(tipoLogin: TipoLogin): Date {
  const agora = new Date();
  
  switch (tipoLogin) {
    case TipoLogin.WEB:
      // Token válido até 23:59 do dia atual
      const fimDoDia = new Date(agora);
      fimDoDia.setHours(23, 59, 59, 999);
      return fimDoDia;
      
    case TipoLogin.MOBILE:
      // Token válido por 30 dias
      const trintaDias = new Date(agora);
      trintaDias.setDate(agora.getDate() + 30);
      return trintaDias;
  }
}
```

---

## 📡 Endpoints da API

### **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "senha": "minhasenha123",
  "tipoLogin": "web" // ou "mobile"
}
```

### **Resposta**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "nivel": "USUARIO"
  },
  "expiracao": "2024-01-15T23:59:59.999Z",
  "tipoLogin": "web"
}
```

---

## 🔒 Segurança

### **Proteções Implementadas**

1. **Rate Limiting**
   - 5 tentativas de login por minuto
   - 10 requisições gerais por minuto
   - 100 requisições por hora

2. **Validação de Token**
   - Verificação de expiração
   - Validação de assinatura JWT
   - Limpeza automática de tokens expirados

3. **Criptografia**
   - Senhas criptografadas com bcrypt (salt: 10)
   - Tokens JWT assinados com chave secreta

4. **Logs de Auditoria**
   - Logs detalhados de tentativas de login
   - Rastreamento de tipos de acesso
   - Monitoramento de expiração de tokens

---

## 📱 Frontend Integration

### **Context de Autenticação**

```javascript
const login = async (email, senha, tipoLogin = 'web') => {
  const response = await axiosInstance.post('/auth/login', {
    email,
    senha,
    tipoLogin
  });
  
  // Armazena informações do token
  localStorage.setItem('alencar_frutas_token_info', JSON.stringify({
    expiracao: response.data.expiracao,
    tipoLogin: response.data.tipoLogin
  }));
};
```

### **Validação de Token**

```javascript
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 >= Date.now();
  } catch {
    return false;
  }
};
```

---

## 🛠️ Configuração de Ambiente

### **Variáveis de Ambiente**

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Rate Limiting (opcional)
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

---

## 📊 Monitoramento

### **Logs de Sistema**

```
🔍 [AUTH] Tentativa de login para email: usuario@exemplo.com
✅ [AUTH] Usuário encontrado: João Silva
🔐 [AUTH] Senha válida: true
🚀 [AUTH] Iniciando login para: usuario@exemplo.com (web)
⏰ [AUTH] Token expira em: 15/01/2024 23:59:59
📱 [AUTH] Tipo de login: web
```

### **Métricas Recomendadas**

- Tentativas de login por hora
- Taxa de sucesso de autenticação
- Distribuição de tipos de login
- Tokens expirados vs válidos

---

## 🔄 Fluxo Completo

### **1. Login Web**
```
1. Usuário seleciona "Sistema Web"
2. Frontend envia tipoLogin: "web"
3. Backend gera token válido até 23:59
4. Token expira automaticamente no fim do dia
```

### **2. Login Mobile**
```
1. App mobile envia tipoLogin: "mobile"
2. Backend gera token válido por 30 dias
3. Token permite acesso prolongado
4. Ideal para aplicativos móveis
```

### **3. Rate Limiting**
```
1. Usuário faz tentativa de login
2. Sistema verifica limite (5/min)
3. Se exceder: retorna 429 (Too Many Requests)
4. Se OK: processa login normalmente
```

---

## 🚀 Próximos Passos

### **Melhorias Sugeridas**

1. **Refresh Tokens**
   - Implementar refresh tokens para maior segurança
   - Renovação automática de tokens

2. **2FA (Two-Factor Authentication)**
   - Autenticação em duas etapas
   - Códigos SMS/Email

3. **Logs Avançados**
   - Logs de auditoria mais detalhados
   - Alertas de segurança

4. **Monitoramento**
   - Dashboard de métricas
   - Alertas de tentativas suspeitas

---

## 📞 Suporte

Para dúvidas sobre o sistema de autenticação, consulte:
- Documentação do NestJS Throttler
- Especificações JWT (RFC 7519)
- Melhores práticas de segurança OWASP 