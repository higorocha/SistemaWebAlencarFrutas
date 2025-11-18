# Plano de Implementação - Rastreamento por Usuário no Sistema de Pagamentos

## Objetivo
Rastrear qual usuário do sistema realizou cada operação (criar, liberar, cancelar) nos pagamentos via API do Banco do Brasil.

## Estrutura Atual

### Modelos do Banco de Dados
- **PagamentoApiLote**: Representa um lote de pagamentos enviado ao BB
- **PagamentoApiItem**: Representa um item individual dentro de um lote

### Operações Identificadas
1. **Criação**: `solicitarTransferenciaPix()` - Cria lote e itens
2. **Liberação**: `liberarPagamentos()` - Libera um lote existente
3. **Cancelamento**: `cancelarPagamentos()` - Cancela itens específicos

## Mudanças Necessárias

### 1. Schema Prisma (pagamento_api_lote)
Adicionar campos de rastreamento:
- `usuarioCriacaoId` (Int, nullable, FK para Usuario) - Usuário que criou o lote
- `usuarioLiberacaoId` (Int, nullable, FK para Usuario) - Usuário que liberou o lote
- `dataLiberacao` (DateTime, nullable) - Data/hora da liberação

### 2. Schema Prisma (pagamento_api_item)
Adicionar campos de rastreamento:
- `usuarioCancelamentoId` (Int, nullable, FK para Usuario) - Usuário que cancelou o item
- `dataCancelamento` (DateTime, nullable) - Data/hora do cancelamento

### 3. Service (pagamentos.service.ts)

#### 3.1. Método `solicitarTransferenciaPix()`
- Receber `usuarioId` como parâmetro
- Salvar `usuarioCriacaoId` ao criar o lote

#### 3.2. Método `liberarPagamentos()`
- Receber `usuarioId` como parâmetro
- Atualizar `usuarioLiberacaoId` e `dataLiberacao` ao liberar o lote

#### 3.3. Método `cancelarPagamentos()`
- Receber `usuarioId` como parâmetro
- Atualizar `usuarioCancelamentoId` e `dataCancelamento` nos itens cancelados

#### 3.4. Método `listarLotesTurmaColheita()`
- Incluir relacionamentos com Usuario (criacao, liberacao)
- Incluir relacionamentos com Usuario nos itens (cancelamento)
- Retornar dados dos usuários na resposta

### 4. Controller (pagamentos.controller.ts)

#### 4.1. Método `solicitarTransferenciaPix()`
- Extrair `userId` de `request.user` (JWT)
- Passar `userId` para o service

#### 4.2. Método `liberarPagamentos()`
- Extrair `userId` de `request.user` (JWT)
- Passar `userId` para o service

#### 4.3. Método `cancelarPagamentos()`
- Extrair `userId` de `request.user` (JWT)
- Passar `userId` para o service

### 5. Frontend (Pagamentos.js)

#### 5.1. Nova Coluna na Tabela
Adicionar coluna "Operações" que exibe:
- **Criado por**: Nome do usuário que criou o lote
- **Liberado por**: Nome do usuário que liberou (se aplicável)
- **Cancelado por**: Nome do usuário que cancelou (se aplicável, por item)

#### 5.2. Formato de Exibição
- Usar Tooltip para mostrar detalhes completos
- Exibir data/hora de cada operação
- Usar ícones para diferenciar operações

## Ordem de Implementação

1. ✅ Atualizar schema Prisma
2. ✅ Criar e executar migration
3. ✅ Atualizar service para receber e salvar userId
4. ✅ Atualizar controller para extrair userId da requisição
5. ✅ Atualizar query de listagem para incluir dados dos usuários
6. ✅ Atualizar frontend para exibir informações de rastreamento

## Considerações Importantes

- **Backward Compatibility**: Campos são nullable para não quebrar registros existentes
- **Segurança**: Apenas usuários autenticados podem realizar operações (JwtAuthGuard já garante isso)
- **Auditoria**: Manter histórico completo de quem fez o quê e quando
- **Performance**: Incluir índices nos campos de FK para otimizar queries

## Exemplo de Resposta da API

```json
{
  "id": 1,
  "numeroRequisicao": 123,
  "usuarioCriacao": {
    "id": 5,
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "usuarioLiberacao": {
    "id": 3,
    "nome": "Maria Santos",
    "email": "maria@example.com"
  },
  "dataLiberacao": "2024-01-15T10:30:00Z",
  "itensPagamento": [
    {
      "id": 1,
      "usuarioCancelamento": {
        "id": 2,
        "nome": "Pedro Costa",
        "email": "pedro@example.com"
      },
      "dataCancelamento": "2024-01-16T14:20:00Z"
    }
  ]
}
```

