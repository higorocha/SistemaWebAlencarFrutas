# Módulo de Cobrança - Banco do Brasil

## 📋 Status
🚧 **Em desenvolvimento** - Documentação consolidada e parcialmente analisada

## ℹ️ Informações do Convênio

| Parâmetro | Valor |
|-----------|-------|
| **Tipo de Convênio** | 3 (Banco numera, cliente emite e expede) |
| **Modalidade** | Simples |
| **Espécie** | Boleto de Cobrança |
| **Status da Contratação** | ✅ Já contratado com o Banco do Brasil |

## 📁 Estrutura do Módulo

```
cobranca/
├── cobranca.service.ts       # Lógica de negócio principal
├── cobranca.controller.ts    # Endpoints REST
├── cobranca.module.ts       # Configuração NestJS
├── cobranca-sync.service.ts # Sincronização de status de boletos
├── dto/                     # DTOs de validação
│   ├── cobranca.dto.ts     # DTOs principais
│   ├── registrar-boleto.dto.ts
│   ├── consultar-boleto.dto.ts
│   └── response.dto.ts
├── utils/                   # Utilitários
│   ├── calculadora-juros.ts   # Cálculo de juros/multa
│   └── validador-boletos.ts # Validações específicas
└── README.md                # Este arquivo
```

## 🔗 Integrações

### Módulos Externos
- **ConvenioCobranca**: Dados do convênio (juros, dias, carteira)
- **ContaCorrente**: Dados bancários para emissão
- **CredenciaisAPI**: Credenciais "001 - Cobrança"
- **Notificacoes**: Notificações sobre boletos

### Clientes HTTP
- **bb-cobranca-client.ts**: Cliente HTTP com mTLS para API de cobrança BB

## 📊 Fluxo Principal (Planejado)

```
1. Frontend envia dados do boleto
2. Controller valida com DTO
3. Service:
   - Busca convênio pela conta corrente
   - Calcula juros/multa se necessário
   - Obtém credenciais "001 - Cobrança"
   - Chama API BB para registrar boleto
   - Salva registro no banco
4. Retorna dados do boleto ao frontend
```

## 🔧 Recursos da API de Cobrança

### Recursos Disponíveis (Mapeados)

1. **Registro de Boletos** - Registro de boletos (Tipo 3 ou 4, Simples ou Vinculada)
2. **Lista de Boletos** - Listagem com filtros (Todos os tipos e modalidades)
3. **Consulta/Detalhamento de Boletos** - Consulta individual com situação (Todos os tipos e modalidades)
4. **Baixa de Boletos** - Cancelamento por beneficiário (Todos os tipos, apenas carteira simples)
5. **Alteração de Boletos** - Alteração de vencimento, descontos, multa, etc.
6. **Consultar Pix de Boletos** - URL, TxID, EMV e Tipo de QRCode
7. **Gerar Pix de Boletos** - Vincular Pix a boleto "Em Ser" (sem Pix anterior)
8. **Cancelar Pix de Boletos** - Cancelar Pix vinculado a boleto "Em Ser"
9. **Baixa Operacional** - Instituição Recebedora informa pagamento à PCR
10. **Listar Retorno do Movimento** - Consultar movimentos de retorno (pagamentos, baixas, alterações)
11. **Notificações Webhook** - Recebimento de Baixa Operacional (evento de webhook)

### Endpoint de Simulação (Homologação)

- **URL Base:** `https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1`
- **Endpoint:** `POST /boletos-cobranca/{linhaDigitavel}/pagar`
- **gw-app-key:** `95cad3f03fd9013a9d15005056825665`

### Observações

- Para acesso a "Listar Retorno do Movimento", contatar Gerente de Cash ou Relacionamento
- Ambiente de homologação simula diversas contas (tentar novamente se falhar)

## 🔄 Webhooks (Planejado)

A API de cobrança do BB provavelmente possui webhooks para notificar:
- Pagamento de boletos
- Baixa de boletos
- Vencimento de boletos

Este módulo precisará integrar com:
- `bb-webhooks` (existente)
- Tratadores específicos para eventos de cobrança

## ⚙️ Gerenciamento de Ambiente

### Variável NODE_ENV

O módulo usa a variável de ambiente `NODE_ENV` do arquivo `.env` para diferenciar entre produção e homologação:

| NODE_ENV | Ambiente | Uso |
|----------|-----------|------|
| `production` | **Produção** | Sistema em produção, clientes reais, certificados de produção |
| `development` ou não definido | **Homologação/Desenvolvimento** | Testes, desenvolvimento, simulações, certificados de homologação |

### Endpoints por Ambiente

```typescript
const isProduction = process.env.NODE_ENV === 'production';

// Autenticação OAuth2
const authUrl = isProduction
  ? 'https://oauth.bb.com.br'        // Produção
  : 'https://oauth.hm.bb.com.br';       // Homologação

// API de Cobrança
const baseUrl = isProduction
  ? 'https://api.boletobb.com.br'      // Produção
  : 'https://api.hm.bb.com.br';         // Homologação
```

### Observações Importantes

1. **Nunca misturar ambientes:**
   - Homologação: Dados fictícios fornecidos pelo BB, certificados de teste, gw-app-key de testes
   - Produção: Dados reais do convênio Alencar Frutas, certificados reais, chaves de produção

2. **Cadastro por Ambiente:**
   - Homologação: Usar dados cadastrados para homologação na tabela `ConvenioCobranca` e `CredenciaisAPI`
   - Produção: Usar dados cadastrados para produção na tabela `ConvenioCobranca` e `CredenciaisAPI`
   - A seleção de ambiente (NODE_ENV) determina qual registro das tabelas usar

3. **Validação obrigatória:**
   - Validar layout em homologação antes de ir para produção
   - Usar Validador de Layout BB do Portal Developers

4. **gw-app-key:**
   - Chaves diferentes para cada ambiente
   - Homologação: `95cad3f03fd9013a9d15005056825665`
   - Produção: Chave real do convênio (configurada no BB Digital PJ)

## 📝 Documentação Pendente

Aguardando documentação oficial do Banco do Brasil para:
- ✅ Mapear todos os endpoints
- ✅ Definir estrutura de requisições
- ✅ Definir estrutura de respostas
- ✅ Identificar certificados necessários
- ✅ Identificar webhooks disponíveis
- ✅ Definir escopos OAuth2
- ✅ Implementar cliente HTTP
- ✅ URLs de produção (authUrl, baseUrl)

## 🔐 Segurança

- mTLS (Mutual TLS) para autenticação
- OAuth2 para autorização
- Validação de certificados
- Tratamento de erros e exceções

---

**Última atualização:** 12/01/2026
**Status:** Aguardando documentação oficial do BB (endpoints técnicos, estrutura JSON, webhooks)
