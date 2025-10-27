# 📱 Módulo Mobile - API para Aplicativo

## 🎯 Visão Geral

Módulo específico para o aplicativo mobile do AlencarFrutas, implementado com arquitetura híbrida que **reutiliza a lógica de negócio existente** sem duplicação de código.

### **Arquitetura Híbrida**

```
┌─────────────────────────────────────────────────────────┐
│                    Sistema Web                           │
│  /api/pedidos/* → PedidosController → PedidosService    │
└─────────────────────────────────────────────────────────┘
                              ↑
                              │ (reutiliza)
                              │
┌─────────────────────────────────────────────────────────┐
│                  Aplicativo Mobile                       │
│  /api/mobile/pedidos/* → PedidosMobileController ────→  │
└─────────────────────────────────────────────────────────┘
```

### **✅ Vantagens**

- **Zero Duplicação**: Reutiliza `PedidosService` existente
- **Rotas Isoladas**: `/api/mobile/*` não afeta sistema web
- **DTOs Otimizados**: Respostas enxutas para mobile
- **Manutenção Simples**: Mudanças na lógica de negócio afetam ambos
- **Segurança**: Guards específicos para validação de cultura

---

## 📁 Estrutura do Módulo

```
mobile/
├── mobile.module.ts                      # Módulo principal
├── controllers/
│   └── pedidos-mobile.controller.ts      # Controller específico mobile
├── dto/
│   ├── mobile-pedido-filters.dto.ts      # Filtros mobile
│   ├── mobile-colheita.dto.ts            # DTO de colheita simplificado
│   ├── mobile-pedido-response.dto.ts     # Respostas otimizadas
│   └── index.ts                          # Exports
├── guards/
│   └── cultura.guard.ts                  # Validação de cultura
└── README.md                             # Esta documentação
```

---

## 🔐 Autenticação e Segurança

### **Guards Aplicados**

1. **JwtAuthGuard**: Valida token JWT
2. **NiveisGuard**: Valida níveis de acesso
3. **CulturaGuard**: Valida cultura vinculada (GERENTE_CULTURA)

### **Níveis com Acesso ao Mobile**

- ✅ `ADMINISTRADOR` - Acesso total
- ✅ `GERENTE_GERAL` - Acesso total
- ✅ `ESCRITORIO` - Acesso total
- ✅ `GERENTE_CULTURA` - Acesso filtrado por cultura

### **Lógica de Negócio para Gerente de Cultura**

O `GERENTE_CULTURA` possui uma lógica de filtragem especial para a listagem de pedidos, garantindo que ele veja apenas os pedidos que requerem sua atenção:

- **Aba "Pendentes"**: Exibe pedidos que contenham ao menos uma fruta da sua cultura que **ainda não foi colhida** (`quantidadeReal` é nula). Isso inclui pedidos com status `PEDIDO_CRIADO`, `AGUARDANDO_COLHEITA` e `COLHEITA_PARCIAL`.
- **Aba "Realizadas"**: Exibe pedidos onde ao menos uma fruta da sua cultura **já foi colhida** (`quantidadeReal` não é nula).

Essa lógica é aplicada diretamente no backend e ignora o status geral do pedido, focando no status individual das frutas de responsabilidade do gerente.

---

## 📡 Endpoints Disponíveis

### **Base URL**: `/api/mobile/pedidos`

### **1. Dashboard Simplificado**

```http
GET /api/mobile/pedidos/dashboard
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "aguardandoColheita": 5,
  "colheitaParcial": 2,
  "colheitasRealizadasHoje": 3,
  "colheitasRealizadasSemana": 8,
  "pedidosRecentes": [
    {
      "id": 123,
      "numeroPedido": "PED-2025-0123",
      "cliente": "João Silva",
      "status": "AGUARDANDO_COLHEITA",
      "dataPrevistaColheita": "2025-10-25",
      "frutas": [
        {
          "id": 1,
          "nome": "Limão Tahiti",
          "quantidadePrevista": 1000,
          "unidade": "KG",
          "cultura": "Limão"
        }
      ],
      "vencido": false,
      "diasDesdePrevisao": -3
    }
  ]
}
```

### **2. Listar Pedidos**

```http
GET /api/mobile/pedidos
Authorization: Bearer {token}

Query Params (opcionais):
  - aguardandoColheita: boolean
  - colheitasPendentes: boolean
  - status: StatusPedido[]
```

**Exemplo:**
```http
GET /api/mobile/pedidos?aguardandoColheita=true
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 123,
      "numeroPedido": "PED-2025-0123",
      "cliente": {
        "id": 1,
        "nome": "João Silva",
        "industria": false
      },
      "vencido": false
    }
  ],
  "total": 15,
  "filtrosAplicados": {
    "status": ["AGUARDANDO_COLHEITA"],
    "cultura": "Cultura ID 3"
  }
}
```

### **3. Buscar Pedido Específico**

```http
GET /api/mobile/pedidos/:id
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "id": 123,
  "numeroPedido": "PED-2025-0123",
  "cliente": "João Silva",
  "status": "AGUARDANDO_COLHEITA",
  "dataPrevistaColheita": "2025-10-25",
  "frutas": [
    {
      "id": 1,
      "nome": "Limão Tahiti",
      "quantidadePrevista": 1000,
      "unidade": "KG",
      "cultura": "Limão"
    }
  ],
  "vencido": false,
  "diasDesdePrevisao": -3
}
```

### **4. Registrar Colheita**

```http
PATCH /api/mobile/pedidos/:id/colheita
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "dataColheita": "2025-10-22",
  "frutas": [
    {
      "frutaPedidoId": 1,
      "quantidadeReal": 950.5,
      "areaAgricolaId": 5
    }
  ],
  "turmasIds": [1, 2],
  "observacoesColheita": "Colheita realizada pela manhã",
  "custoFrete": 150.00
}
```

**Resposta:**
```json
{
  "id": 123,
  "numeroPedido": "PED-2025-0123",
  "status": "COLHEITA_REALIZADA",
  "dataColheita": "2025-10-22",
  "message": "Colheita registrada com sucesso"
}
```

---

## 🔄 Diferenças entre Web e Mobile

| Aspecto | Web (`/api/pedidos`) | Mobile (`/api/mobile/pedidos`) |
|---------|----------------------|--------------------------------|
| **Filtros** | Complexos e flexíveis | Simplificados (aguardandoColheita, etc.) |
| **Resposta** | Completa com todos os dados | Otimizada (apenas dados essenciais) |
| **Dashboard** | Completo com estatísticas detalhadas | Simplificado (foco em colheita) |
| **Fitas** | Sistema completo de fitas | ❌ Não incluso no MVP mobile |
| **Validação** | Por nível de usuário | Por nível + cultura |
| **Limite Padrão** | 10-20 pedidos por página | Retorna todos os pedidos (limite: 1000) |

---

## 🧩 DTOs Específicos

### **MobilePedidoFiltersDto**

```typescript
{
  status?: StatusPedido[];           // Array de status
  aguardandoColheita?: boolean;      // Atalho para filtros comuns
  colheitasPendentes?: boolean;
}
```

### **MobileColheitaDto**

```typescript
{
  dataColheita: string;              // ISO date
  frutas: {
    frutaPedidoId: number;
    quantidadeReal: number;
    areaAgricolaId?: number;
    areaFornecedorId?: number;
  }[];
  turmasIds?: number[];
  observacoesColheita?: string;
  custoFrete?: number;
}
```

### **MobilePedidoSimplificadoDto**

```typescript
{
  id: number;
  numeroPedido: string;
  cliente: { id: number; nome: string; industria: boolean };
  status: StatusPedido;
  dataPrevistaColheita: string | null;
  dataColheita?: string | null;
  frutas: {
    id: number;
    nome: string;
    quantidadePrevista: number;
    quantidadeReal?: number;
    unidade: string;
    cultura?: string;
  }[];
  vencido: boolean;
  diasDesdePrevisao?: number;
}
```

---

## 🛡️ Validações Específicas

### **1. Validação de Cultura (CulturaGuard)**

```typescript
// GERENTE_CULTURA deve ter cultura vinculada
if (user.nivel === 'GERENTE_CULTURA' && !user.culturaId) {
  throw new ForbiddenException('Gerente de Cultura deve ter uma cultura vinculada');
}
```

### **2. Validação de Acesso a Pedidos**

```typescript
// Verifica se alguma fruta do pedido pertence à cultura do usuário
const temAcesso = pedido.frutasPedidos.some(
  (fp) => fp.fruta.culturaId === usuarioCulturaId
);
```

### **3. Filtros Automáticos**

```typescript
// Pedidos filtrados automaticamente para GERENTE_CULTURA
const pedidos = await pedidosService.findAll(
  page,
  limit,
  status,
  undefined,
  usuarioNivel,
  usuarioCulturaId // ← Filtro automático
);
```

---

## 🚀 Como Testar

### **1. Login Mobile**

```bash
POST http://localhost:5002/auth/login
Content-Type: application/json

{
  "email": "gerente@alencarfrutas.com",
  "senha": "senha123",
  "tipoLogin": "MOBILE"
}
```

### **2. Dashboard Mobile**

```bash
GET http://localhost:5002/api/mobile/pedidos/dashboard
Authorization: Bearer {token_obtido_no_login}
```

### **3. Listar Pedidos**

```bash
GET http://localhost:5002/api/mobile/pedidos?aguardandoColheita=true
Authorization: Bearer {token}
```

### **4. Registrar Colheita**

```bash
PATCH http://localhost:5002/api/mobile/pedidos/123/colheita
Authorization: Bearer {token}
Content-Type: application/json

{
  "dataColheita": "2025-10-22",
  "frutas": [
    {
      "frutaPedidoId": 1,
      "quantidadeReal": 950
    }
  ],
  "observacoesColheita": "Teste de colheita"
}
```

---

## 📝 Exemplos de Uso no Frontend (React Native)

### **1. Configuração do Axios**

```typescript
// src/services/api/client.ts
import axios from 'axios';
import { ENV } from '@/config/env';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### **2. Service de Pedidos**

```typescript
// src/services/api/pedidos.ts
import api from './client';

export const pedidosService = {
  // Dashboard
  getDashboard: async () => {
    const { data } = await api.get('/api/mobile/pedidos/dashboard');
    return data;
  },

  // Listar pedidos
  listar: async (filters?: { aguardandoColheita?: boolean }) => {
    const { data } = await api.get('/api/mobile/pedidos', { params: filters });
    return data;
  },

  // Buscar pedido específico
  buscar: async (id: number) => {
    const { data } = await api.get(`/api/mobile/pedidos/${id}`);
    return data;
  },

  // Registrar colheita
  registrarColheita: async (pedidoId: number, colheita: any) => {
    const { data } = await api.patch(
      `/api/mobile/pedidos/${pedidoId}/colheita`,
      colheita
    );
    return data;
  },
};
```

### **3. Hook React Query**

```typescript
// src/hooks/usePedidos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosService } from '@/services/api/pedidos';

export const usePedidos = (filtros?: any) => {
  return useQuery({
    queryKey: ['pedidos', filtros],
    queryFn: () => pedidosService.listar(filtros),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useRegistrarColheita = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pedidoId, colheita }: any) =>
      pedidosService.registrarColheita(pedidoId, colheita),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
};
```

---

## ⚠️ Limitações do MVP Mobile

1. **❌ Sistema de Fitas**: Não incluso no MVP (será adicionado em versões futuras)
2. **❌ Precificação**: Apenas visualização (edição no sistema web)
3. **❌ Pagamentos**: Apenas visualização (gestão no sistema web)
4. **✅ Colheita**: Funcionalidade completa (core do MVP)

---

## 🔧 Manutenção e Extensão

### **Adicionar Novo Endpoint**

1. Adicionar método no `PedidosMobileController`
2. Criar DTO específico se necessário (em `mobile/dto/`)
3. Adaptar resposta usando métodos auxiliares
4. Documentar com decorators do Swagger

### **Modificar Lógica de Negócio**

- **✅ Modificar `PedidosService`** → Afeta web e mobile automaticamente
- **❌ NÃO duplicar lógica** no controller mobile

### **Adicionar Validações**

- Criar guards específicos em `mobile/guards/`
- Aplicar com `@UseGuards()` nos controllers

---

## 📚 Documentação Swagger

Após iniciar o backend, acesse:

```
http://localhost:5002/api
```

Procure pela seção **"Mobile - Pedidos"** para ver todos os endpoints documentados.

---

## 🎯 Conclusão

Este módulo implementa uma **arquitetura híbrida inteligente** que:

- ✅ Reutiliza 100% da lógica de negócio
- ✅ Mantém rotas isoladas e seguras
- ✅ Otimiza respostas para mobile
- ✅ Facilita manutenção e evolução

**Desenvolvido com ❤️ para o AlencarFrutas Mobile**
