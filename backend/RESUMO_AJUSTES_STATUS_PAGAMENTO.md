# 📝 Resumo dos Ajustes: Status de Pagamento

## ⚠️ IMPORTANTE: Status Padrão = PAGO

### O Que Mudou:
1. **Status padrão ao criar = PAGO** (não PENDENTE)
2. **PENDENTE nunca será usado** neste momento (fica no enum para futuro)
3. **PROCESSANDO não será usado agora** (fica no enum para lógica futura)
4. **Não há cálculo proporcional automático** - usuário informa valores diretamente
5. **Valores obrigatórios**: valorUnitario, valorTotal, dataPagamento, formaPagamento

### Como Funciona:
1. Usuário visualiza colheitas do fornecedor (frontend já faz isso)
2. Frontend lista apenas frutas colhidas em áreas de fornecedores
3. Usuário seleciona colheitas que deseja pagar
4. Usuário informa: valor unitário, valor total, forma pagamento, data pagamento
5. Backend cria pagamento **já com status = PAGO**
6. Pagamento fica registrado como pago desde a criação

### Campos Obrigatórios ao Criar:
- `fornecedorId` - ID do fornecedor
- `areaFornecedorId` - ID da área do fornecedor
- `pedidoId` - ID do pedido
- `frutaId` - ID da fruta
- `frutaPedidoId` - ID da relação fruta-pedido
- `frutaPedidoAreaId` - ID da relação área (referencia exata à colheita)
- `quantidade` - Quantidade colhida (vem de `FrutasPedidosAreas`)
- `unidadeMedida` - Unidade (vem de `FrutasPedidos`)
- `valorUnitario` - Valor unitário (**informado pelo usuário**)
- `valorTotal` - Valor total (**informado pelo usuário** ou calculado: quantidade * valorUnitario)
- `dataPagamento` - Data do pagamento (**obrigatória, informada pelo usuário**)
- `formaPagamento` - Forma de pagamento (**obrigatória, informada pelo usuário**)

### Campos Opcionais:
- `dataColheita` - Data da colheita (vem de `Pedido.dataColheita`)
- `observacoes` - Observações

### Enum StatusPagamentoFornecedor:
```prisma
enum StatusPagamentoFornecedor {
  PENDENTE      // NUNCA será usado agora (fica para futuro)
  PROCESSANDO   // Não será usado agora (lógica futura)
  PAGO          // Status padrão (@default(PAGO))
}
```

### Schema Prisma:
```prisma
model FornecedorPagamento {
  // ... outros campos
  status                StatusPagamentoFornecedor @default(PAGO)  // ⚠️ PAGO, não PENDENTE
  dataPagamento         DateTime                  // ⚠️ Obrigatório (não opcional)
  formaPagamento        String                    @db.VarChar(50)  // ⚠️ Obrigatório (não opcional)
  valorUnitario         Float                     // ⚠️ Obrigatório
  valorTotal            Float                     // ⚠️ Obrigatório
  // ... outros campos
}
```

### Endpoints Principais:
1. **POST `/api/fornecedores/:id/pagamentos`** - Criar pagamento (status = PAGO)
2. **GET `/api/fornecedores/:id/pagamentos/efetuados`** - Buscar pagamentos efetuados (status = PAGO)
3. **GET `/api/fornecedores/:id/colheitas-pagamentos`** - Endpoint para o modal (colheitas + pagamentos)

### Endpoints que NÃO serão usados agora:
- `GET /pagamentos/pendentes` - Não será usado (nunca haverá status PENDENTE)
- `PATCH /pagamentos/processar` - Não será usado (pagamentos são criados já como PAGO)
- `GET /pagamentos/processando` - Não será usado agora (lógica futura)

### Validações:
- Valores obrigatórios (valorUnitario, valorTotal, dataPagamento, formaPagamento)
- Data pagamento não pode ser futura
- Não permite criar pagamento duplicado (mesma `frutaPedidoAreaId` + `pedidoId` + `frutaId`)
- Validar que `FrutasPedidosAreas` existe e tem `areaFornecedorId` não null
- Validar que área pertence ao fornecedor
- Validar que fruta está no pedido

### Dashboard:
- Método principal: `getPagamentosFornecedoresEfetuados()` - busca pagamentos com status = PAGO
- Método existente: `getFornecedoresColheitas()` - mantém como está (para visualização)

### Resumo:
- ✅ Status padrão = PAGO
- ✅ PENDENTE nunca será usado (fica no enum)
- ✅ PROCESSANDO não será usado agora (fica no enum)
- ✅ Valores informados pelo usuário (não há cálculo automático)
- ✅ Todos os campos obrigatórios devem ser informados
- ✅ Pagamento é criado já como pago

