# Documentação do Mapeamento de Exclusões de Lançamentos

Este documento descreve como o serviço de lançamentos de extrato bloqueia transações irrelevantes ao vincular créditos a clientes ou pedidos. A configuração fica concentrada no `LancamentoExtratoService`, garantindo que qualquer ajuste ocorra em um único ponto e reflita imediatamente em rotinas manuais ou automáticas (como o monitoramento agendado).

## Objetivo

- Evitar salvar lançamentos que apenas informam saldo ou limites e não representam entradas financeiras reais.
- Manter o banco de dados limpo de registros que não agregam valor ao fluxo de conciliação de pagamentos.
- Facilitar auditorias, pois todas as descrições ignoradas ficam listadas e documentadas.

## Onde está implementado

Arquivo: `backend/src/extratos/lancamento-extrato.service.ts`

O serviço utiliza duas estruturas para filtrar descrições:
1. **Verificação exata**: `descricoesCreditoIgnorarExatas` - compara a descrição completa
2. **Verificação parcial**: `termosCreditoIgnorarParciais` - verifica se a descrição contém o termo

A função `deveIgnorarDescricao()` centraliza a lógica de verificação, aplicando ambas as regras antes de validar CPF/CNPJ e tentar salvar o lançamento.

```typescript
// Termos que devem ser verificados exatamente (descrição completa)
private readonly descricoesCreditoIgnorarExatas = new Set<string>([
  'LIMITE DISPONIVEL',
  'LIMITE CONTRATADO',
  'SALDO DO DIA',
  'SALDO ANTERIOR',
  'SALDO DISPONIVEL',
  'SALDO ATUAL',
  'S A L D O',
  'INVEST. RESGATE AUTOM',
  'BB RENDE FÁCIL',
  'PIX - REJEITADO',
]);

// Termos que devem ser verificados parcialmente (descrição contém o termo)
private readonly termosCreditoIgnorarParciais = ['COBRANCA', 'COBRANÇA'];
```

## Descrições Ignoradas

| Descrição            | Justificativa                                                                 |
|----------------------|-------------------------------------------------------------------------------|
| `LIMITE DISPONIVEL`  | Informação de limite, não representa transação financeira.                   |
| `LIMITE CONTRATADO`  | Registro de contratação de limite, sem crédito real.                         |
| `SALDO DO DIA`       | Apenas resumo de saldo diário.                                               |
| `SALDO ANTERIOR`     | Informativo do saldo anterior.                                               |
| `SALDO DISPONIVEL`   | Indicação de saldo disponível.                                               |
| `SALDO ATUAL`        | Resumo diário de posição; adicionado para evitar duplicidade de saldos.      |
| `S A L D O`          | Variação de escrita do saldo informativo.                                    |
| `INVEST. RESGATE AUTOM` | Movimento automático de investimento, não é receita operacional direta. | 
| `BB RENDE FÁCIL`     | Produto financeiro do banco, não é pagamento de cliente.                     |
| `PIX - REJEITADO`    | Transação PIX que foi rejeitada, não representa recebimento efetivo.        |
| `COBRANCA` / `COBRANÇA` | Qualquer lançamento que contenha a palavra "COBRANCA" ou "COBRANÇA" na descrição será ignorado (ex: "Cobranca Adiantamento", "Cobrança QR Code", etc). Verificação **parcial** (contém). |

> **Nota:** 
> - As descrições são armazenadas em maiúsculas e sem acentuação para evitar divergências.
> - **Verificação Exata**: Termos que devem corresponder exatamente à descrição completa (ex: "SALDO DO DIA")
> - **Verificação Parcial**: Termos que são verificados se a descrição contém o termo (ex: qualquer descrição que contenha "COBRANCA" ou "COBRANÇA")

## Fluxo de Filtragem

1. Buscar extratos brutos na API do BB (`ExtratosService.consultarExtratosBrutos`).
2. Para cada lançamento:
   - Validar se `indicadorSinalLancamento` é crédito (`'C'`).
   - Normalizar a descrição (`textoDescricaoHistorico`) para maiúsculas.
   - Chamar `deveIgnorarDescricao()` que verifica:
     - **Verificação exata**: Se a descrição completa está em `descricoesCreditoIgnorarExatas`
     - **Verificação parcial**: Se a descrição contém algum termo de `termosCreditoIgnorarParciais`
   - Se a descrição deve ser ignorada, a iteração avança para o próximo item (`continue`).
   - Caso contrário, o serviço tenta mapear o CPF/CNPJ e salvar o lançamento.

Trecho relevante:

```typescript
for (const extrato of extratosBrutos) {
  if (extrato.indicadorSinalLancamento !== 'C') {
    continue;
  }

  const descricaoUpper = (extrato.textoDescricaoHistorico || '').toUpperCase().trim();
  if (this.deveIgnorarDescricao(descricaoUpper)) {
    continue;
  }

  // processamento do lançamento elegível...
}
```

A função `deveIgnorarDescricao()` implementa a lógica de verificação:

```typescript
private deveIgnorarDescricao(descricaoNormalizada: string): boolean {
  // Verificação exata
  if (this.descricoesCreditoIgnorarExatas.has(descricaoNormalizada)) {
    return true;
  }

  // Verificação parcial (contém)
  for (const termo of this.termosCreditoIgnorarParciais) {
    if (descricaoNormalizada.includes(termo)) {
      return true;
    }
  }

  return false;
}
```

## Como adicionar novas exclusões

### Para exclusão exata (descrição completa):
1. Identifique a descrição exata retornada pela API (sempre em maiúsculas para manter o padrão).
2. Abra `lancamento-extrato.service.ts`.
3. Adicione a descrição ao `Set` `descricoesCreditoIgnorarExatas`.
4. Registre a justificativa na tabela acima para manter a documentação alinhada.

### Para exclusão parcial (contém termo):
1. Identifique o termo que deve ser verificado parcialmente (ex: "COBRANCA" para ignorar "Cobranca Adiantamento", "Cobrança QR Code", etc).
2. Abra `lancamento-extrato.service.ts`.
3. Adicione o termo ao array `termosCreditoIgnorarParciais`.
4. Registre a justificativa na tabela acima indicando que é verificação **parcial**.

## Boas práticas

- **Padronização**: converta sempre para maiúsculas sem acentos antes de comparar.
- **Auditoria**: mantenha este documento atualizado ao incluir ou remover descrições.
- **Reutilização**: qualquer rotina nova que processe extratos deve reaproveitar o `LancamentoExtratoService` para garantir consistência com o monitoramento automatizado.

---

Atualizado em: `08/11/2025` (última atualização: adicionado verificação parcial para COBRANCA e COBRANÇA)

