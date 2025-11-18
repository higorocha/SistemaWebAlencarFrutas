# 📬 Plano de Implementação – Webhook Pagamentos BB

> **Status:** planejamento – nenhum código aplicado

## 1. Objetivo
- Receber notificações de **pagamentos efetivados** enviadas pelo Banco do Brasil (PIX, transferências, boletos, guias).
- Sincronizar automaticamente os estados dos lotes/itens sem depender apenas de consultas manuais.
- Criar um **framework de webhook reutilizável** (estruturas compartilhadas) para outras APIs do BB (ex.: cobrança bancária), reaproveitando infraestrutura, logs, e padrões de validação.

## 2. Referências
- Projeto `@exemploWebhook`: já implementa webhook BB (estrutura de servidor, mTLS, validação de certificados, logs).
- Documentação oficial BB (trecho fornecido pelo usuário – payload/estados).

## 3. Escopo de MVP
1. **Endpoint dedicado** (ex.: `POST /api/webhooks/bb/pagamentos`) reutilizando núcleo genérico de webhook.
2. **Autenticação mTLS** + validação de origem (igual `@exemploWebhook`), com possibilidade de compartilhar certificados/configurações entre webhooks BB.
3. **Persistência total do payload** (JSON bruto + metadados) em estrutura genérica (`bb_webhook_events`) para auditoria e reprocessamento.
4. **Idempotência**: ignorar mensagens repetidas (chave: `codigoIdentificadorPagamento` + `textoEstado` + `numeroRequisicaoPagamento`).
5. **Atualização de banco**:
   - `pagamento_api_lote` → `ultimaAtualizacaoWebhook`, `payloadRespostaAtual`, `estadoRequisicaoAtual`.
   - `pagamento_api_item` → `estadoPagamentoIndividual`, `payloadItemRespostaAtual`, `status`, `indicador...Atual`, `dataPagamentoEfetivo`, `valorPagoEfetivo`.
   - **Atualização de colheitas (condicional - APENAS para pagamentos de colheitas):**
     - Verificar se existe `pagamento_api_item_colheita` vinculado ao item
     - Se existir: atualizar `turma_colheita_pedido_custo.statusPagamento = 'PAGO'` (mesma lógica já usada em consultas individuais/web)
     - Se não existir: item é de outro tipo (funcionários, fornecedores, etc.) e não precisa atualizar colheitas
     - **IMPORTANTE:** Outros tipos de pagamento não possuem `pagamento_api_item_colheita`, todos os dados ficam diretamente em `pagamento_api_item`
6. **Logs completos**: registrar evento bruto, decisão (processado/descartado), resultado das atualizações e erros.

## 4. Fluxo do Webhook
1. BB envia POST (array de pagamentos) → API recebe via endpoint genérico BB Webhooks.
2. Middleware genérico valida mTLS, cabeçalhos (`gw-event`), IPs permitidos.
3. Evento bruto é persistido em `bb_webhook_events` (payload, headers, tipo, data).
4. Roteador interno identifica o **tipo** (pagamentos, cobrança, etc.) e aciona o handler específico.
5. Handler de Pagamentos processa cada item:
   - Log detalhado `[PAGAMENTOS-WEBHOOK] Recebido item ...`.
   - Buscar `pagamento_api_lote` por `numeroRequisicaoPagamento`.
     - Se não existir, logar **descartado** (motivo: lote não encontrado – ambiente local) e marcar evento como descartado.
   - Buscar `pagamento_api_item` por `codigoIdentificadorPagamento` (Pix/Boleto/Guia).
     - Se não existir, logar e descartar o item (motivo: item inexistente/local).
   - Caso encontrado:
     - Atualizar campos de item (estado, data, valor, payloadAtual).
     - Atualizar `pagamento_api_item_colheita` e `turma_colheita_pedido_custo`:
       - Para cada `api_item_colheita`, marcar colheita como paga (seguir mesma lógica usada após resposta do BB).
       - Atualizar status/agregados em `turma_colheita_pedido_custo` (pagamento concluído, data, valor, etc.).
     - Atualizar lote (estado atual, datas, payload, contadores).
     - Logar `[PAGAMENTOS-WEBHOOK] Item atualizado com sucesso`.
6. No final, registrar status do evento (processado, parcialmente processado, descartado) e possíveis erros.
7. **Descartar com log**: quando `numeroRequisicao` ou `codigoIdentificadorPagamento` não existirem (comum em ambiente local).
8. (Futuro) Notificar frontend/mobile via websockets ou fila (fora do MVP).

## 5. Estrutura Técnica
### 5.1 Endpoint e Núcleo Reutilizável
- Criar **módulo genérico** `BbWebhooksModule` com:
  - `BbWebhooksController` (único endpoint `/api/webhooks/bb/:recurso`).
  - Guard genérico de mTLS + verificação de IP/origem.
  - Registry de handlers (`pagamentos`, `cobranca`, etc.) configuráveis.
- `PagamentosModule` registra seu handler no registry (injeção via provider).

### 5.2 Services
- `BbWebhooksService`:
  - `registrarEvento(payload, headers, tipo)`
  - `dispararHandler(tipo, eventoId)`
- `PagamentosWebhookService` (handler):
  - `processarEvento(evento: BbWebhookEvent)`
  - `atualizarLoteEItem(eventoPagamento)`
  - `atualizarColheitas(itemId)`
  - `logarResultado(itemId, status)`

### 5.3 Configuração
- Reutilizar certificados do `@exemploWebhook` (ou apontar para os específicos da API de pagamentos se necessário).
- Variáveis `.env` centralizadas para webhooks BB:
  - `BB_WEBHOOK_CERT_PATH`, `BB_WEBHOOK_KEY_PATH`
  - `BB_WEBHOOK_ALLOWED_IPS` ou lista por recurso.
  - `BB_WEBHOOK_VALIDATE_HEADERS` (flag).

## 6. Mapeamento de Campos
| Payload BB | Tabela/Coluna | Observações |
|------------|---------------|-------------|
| `numeroRequisicaoPagamento` | `pagamento_api_lote.numeroRequisicao` | Int |
| `codigoIdentificadorPagamento` | `pagamento_api_item.identificadorPagamento` / `codigoIdentificadorPagamento` | string |
| `nomeDoFavorecido` | `pagamento_api_item.nomeBeneficiario` | Apenas se válido |
| `numeroCPFouCNPJ` | `pagamento_api_item.documentoFavorecido` (novo campo) | opcional |
| `dataPagamento` | `pagamento_api_item.dataPagamentoEfetivo` (novo campo) | Date |
| `valorPagamento` | `pagamento_api_item.valorPagoEfetivo` (novo campo) | Decimal |
| `codigoTextoEstado` + `textoEstado` | `pagamento_api_item.estadoPagamentoIndividual` / `status` | mapear 1=Pago |
| `codigoIdentificadorInformadoCliente` | `pagamento_api_item.descricaoEnviada` (já salvo) | usada p/ conciliação |
| `codigoDescricaoTipoPagamento` + `descricaoTipoPagamento` | `pagamento_api_item.tipoPagamentoDetalhe` (novo campo) | string |

> Campos novos podem ser adicionados em migration após validação.

## 7. Tratamento de Estados
- `codigoTextoEstado = 1` → marcar item como **Pago**.
- `codigoTextoEstado = 2` → manter como **Não pago** (log e investigar).
- Atualizar `estadoRequisicaoAtual` do lote para `9 - Liberado/Pago` quando todos os itens chegarem como "Pago".

### 7.1 Atualização Condicional por Tipo de Pagamento
- **Pagamentos de Colheitas:**
  - Possuem relacionamento N:N via `pagamento_api_item_colheita`
  - Ao receber webhook com status "Pago", atualizar também `turma_colheita_pedido_custo.statusPagamento = 'PAGO'`
- **Outros Pagamentos (Funcionários, Fornecedores, etc.):**
  - **NÃO** possuem `pagamento_api_item_colheita`
  - Todos os dados ficam diretamente em `pagamento_api_item`
  - Apenas atualizar o item, sem processar colheitas
- Atualizar `turma_colheita_pedido_custo.statusPagamento` e campos relacionados:
  - Para cada `pagamento_api_item_colheita`, definir colheita como paga (mesmo fluxo usado em `listarLotesTurmaColheita`/consultas).
  - Se todas as colheitas de uma turma estiverem pagas, atualizar indicadores agregados (valorPago, dataPagamento).
- Garantir que atualizações sejam transacionais para manter consistência entre `pagamento_api_item` e `pagamento_api_item_colheita`.

## 8. Auditoria & Monitoramento
- Salvar todos os eventos em `bb_webhook_events`:
  - `id`, `tipoRecurso` (pagamentos/cobranca/etc.), `payload`, `headers`, `receivedAt`, `processedAt`, `statusProcessamento`, `motivoDescarta`.
- Logs:
  - `[BB-WEBHOOK]` para núcleo genérico (recepção, validação).
  - `[PAGAMENTOS-WEBHOOK]` para processamento específico (por item).
- Alarmes para falhas consecutivas por tipo de webhook.
- Guardar referência cruzada para o lote/item atualizado (ex.: `eventId` no item).

## 9. Roadmap (etapas sugeridas)
1. Criar módulo genérico (`BbWebhooksModule`) com endpoint único + validação mTLS.
2. Criar tabela `bb_webhook_events` e infraestrutura de logging/monitoramento.
3. Implementar handler de pagamentos:
   - Parser do payload → DTO.
   - Atualização de `pagamento_api_lote`, `pagamento_api_item`, `pagamento_api_item_colheita`, `turma_colheita_pedido_custo`.
   - Lógica de descarte com log detalhado.
4. Adicionar testes unitários/integrados simulando payload real do BB.
5. Configurar alarmes/observabilidade.
6. (Futuro) Registrar outros handlers (ex.: cobrança bancária) reaproveitando o núcleo.

---

> Assim que o plano for aprovado, aplicar as migrations/ajustes seguindo as etapas acima.


