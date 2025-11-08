# Documentação do Mapeamento de Exclusões de Lançamentos

Este documento descreve como o serviço de lançamentos de extrato bloqueia transações irrelevantes ao vincular créditos a clientes ou pedidos. A configuração fica concentrada no `LancamentoExtratoService`, garantindo que qualquer ajuste ocorra em um único ponto e reflita imediatamente em rotinas manuais ou automáticas (como o monitoramento agendado).

## Objetivo

- Evitar salvar lançamentos que apenas informam saldo ou limites e não representam entradas financeiras reais.
- Manter o banco de dados limpo de registros que não agregam valor ao fluxo de conciliação de pagamentos.
- Facilitar auditorias, pois todas as descrições ignoradas ficam listadas e documentadas.

## Onde está implementado

Arquivo: `backend/src/extratos/lancamento-extrato.service.ts`

O conjunto `descricoesCreditoIgnorar` armazena todas as descrições em letras maiúsculas, correspondendo ao campo `textoDescricaoHistorico` da API do Banco do Brasil. Antes de validar CPF/CNPJ e tentar salvar o lançamento, o serviço compara a descrição com esse conjunto para decidir se o registro deve ser pulado.

```62:78:SistemaWebAlencarFrutas/backend/src/extratos/lancamento-extrato.service.ts
private readonly descricoesCreditoIgnorar = new Set<string>([
  'LIMITE DISPONIVEL',
  'LIMITE CONTRATADO',
  'SALDO DO DIA',
  'SALDO ANTERIOR',
  'SALDO DISPONIVEL',
  'SALDO ATUAL',
  'S A L D O',
  'INVEST. RESGATE AUTOM',
  'BB RENDE FÁCIL',
]);
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

> **Nota:** As descrições são armazenadas em maiúsculas e sem acentuação para evitar divergências. Caso a API retorne uma nova variação, inclua-a no mesmo array seguindo o padrão.

## Fluxo de Filtragem

1. Buscar extratos brutos na API do BB (`ExtratosService.consultarExtratosBrutos`).
2. Para cada lançamento:
   - Validar se `indicadorSinalLancamento` é crédito (`'C'`).
   - Normalizar a descrição (`textoDescricaoHistorico`) para maiúsculas.
   - Se a descrição estiver no conjunto `descricoesCreditoIgnorar`, a iteração avança para o próximo item (`continue`).
   - Caso contrário, o serviço tenta mapear o CPF/CNPJ e salvar o lançamento.

Trecho relevante:

```1128:1168:SistemaWebAlencarFrutas/backend/src/extratos/lancamento-extrato.service.ts
for (const extrato of extratosBrutos) {
  if (extrato.indicadorSinalLancamento !== 'C') {
    continue;
  }

  const descricaoUpper = (extrato.textoDescricaoHistorico || '').toUpperCase().trim();
  if (this.descricoesCreditoIgnorar.has(descricaoUpper)) {
    continue;
  }

  // processamento do lançamento elegível...
}
```

## Como adicionar novas exclusões

1. Identifique a descrição exata retornada pela API (sempre em maiúsculas para manter o padrão).
2. Abra `lancamento-extrato.service.ts`.
3. Adicione a descrição ao array do `Set`.
4. Registre a justificativa na tabela acima para manter a documentação alinhada.

## Boas práticas

- **Padronização**: converta sempre para maiúsculas sem acentos antes de comparar.
- **Auditoria**: mantenha este documento atualizado ao incluir ou remover descrições.
- **Reutilização**: qualquer rotina nova que processe extratos deve reaproveitar o `LancamentoExtratoService` para garantir consistência com o monitoramento automatizado.

---

Atualizado em: `08/11/2025`

