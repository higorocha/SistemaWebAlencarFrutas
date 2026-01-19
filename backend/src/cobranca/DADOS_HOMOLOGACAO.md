# Dados para Testes em Homologação - API de Cobrança BB

> **Ambiente:** Homologação (`NODE_ENV=development`)
> **Base URL:** `https://api.hm.bb.com.br/cobrancas/v2`
> **Auth URL:** `https://oauth.hm.bb.com.br`

---

## 🔑 Credenciais de Homologação

### gw-app-key (Developer Application Key)
```
95cad3f03fd9013a9d15005056825665
```

**Observação:** Este é o gw-app-key padrão para testes no ambiente de homologação. Utilize sempre este valor quando não houver um específico cadastrado no sistema.

---

## 📋 Dados do Convênio de Teste

### Convênio de Homologação
- **Número do Convênio:** `3128557`
- **Carteira:** `17`
- **Variação:** `35`
- **Modalidade:** `1` (Simples)
- **Código do Tipo de Título:** `2` (Boleto de Cobrança)

### Agência e Conta (Exemplos na Documentação)
- **Agência:** `452` (sem dígito, sem zeros à esquerda)
- **Conta:** `123873` (sem dígito, sem zeros à esquerda)

**⚠️ Atenção:** Os valores acima são apenas exemplos da documentação. Utilize os dados reais do seu convênio de homologação cadastrado no banco de dados.

---

## 👤 Dados de Pagadores para Testes

### CNPJs para Testes (Pessoa Jurídica)

| Nome da Empresa | CNPJ | Observações |
|----------------|------|-------------|
| TECIDOS FARIA DUARTE | `74910037000193` | |
| LIVRARIA CUNHA DA CUNHA | `98959112000179` | |
| DOCERIA BARBOSA DE ALMEIDA | `92862701000158` | |
| DEPOSITO ALVES BRAGA | `94491202000127` | |
| PAPELARIA FILARDES GARRIDO | `97257206000133` | |

**⚠️ Importante:** 
- Deve ser usado **apenas** em ambiente de homologação
- Para emissão de boletos via API, utilize um dos CNPJs acima no campo `pagador.numeroInscricao`
- O CNPJ deve ser informado **sem pontos, barras, hífens e sem zeros à esquerda**

### CPFs para Testes (Pessoa Física)

| Nome | CPF | Observações |
|------|-----|-------------|
| VALERIO DE AGUIAR ZORZATO | `96050176876` | |
| JOAO DA COSTA ANTUNES | `88398158808` | |
| VALERIO ALVES BARROS | `71943984190` | |
| JOÃO DA COSTA ANTUNES | `97965940132` | |
| JOÃO DA COSTA ANTUNES | `75069056123` | |

**⚠️ Importante:**
- Deve ser usado **apenas** em ambiente de homologação
- Para emissão de boletos via API, utilize um dos CPFs acima no campo `pagador.numeroInscricao`
- O CPF deve ser informado **sem pontos, barras, hífens e sem zeros à esquerda**
- A regra sobre "zeros à esquerda" **NÃO** se aplica ao `numeroInscricao` - use o CPF/CNPJ completo

---

## 🧪 Simulação de Pagamento em Homologação

### Endpoint de Simulação
```
POST https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1/boletos-cobranca/{linhaDigitavel}/pagar
```

### Parâmetros

#### Query Params
- **gw-app-key:** `95cad3f03fd9013a9d15005056825665`

#### Path Variable
- **linhaDigitavel:** O conteúdo do campo `linhaDigitavel` retornado pelo recurso `/boletos` da API

### Observações Importantes

1. **Vencimento futuro:** Caso o boleto tenha vencimento futuro, ele será pago no dia da requisição automaticamente.

2. **Tentativas múltiplas:** Caso não seja possível pagar na primeira tentativa, tentar novamente, pois o ambiente de homologação simula diversas contas e alguma delas pode estar indisponível.

3. **Exclusivo para homologação:** Este endpoint é **exclusivo do ambiente de homologação** e não existe em produção.

---

## 📝 Exemplos de Payload para Criação de Boleto

### Exemplo com CNPJ (Pessoa Jurídica)
```json
{
  "numeroConvenio": 3128557,
  "numeroCarteira": 17,
  "numeroVariacaoCarteira": 35,
  "codigoModalidade": 1,
  "dataEmissao": "15.01.2026",
  "dataVencimento": "31.01.2026",
  "valorOriginal": 123.45,
  "codigoAceite": "N",
  "codigoTipoTitulo": 2,
  "indicadorPermissaoRecebimentoParcial": "N",
  "numeroTituloBeneficiario": "TESTE-001",
  "indicadorPix": "N",
  "pagador": {
    "tipoInscricao": 2,
    "numeroInscricao": "74910037000193",
    "nome": "TECIDOS FARIA DUARTE",
    "endereco": "Rua Exemplo, 123",
    "cep": "01234567",
    "cidade": "São Paulo",
    "bairro": "Centro",
    "uf": "SP"
  }
}
```

### Exemplo com CPF (Pessoa Física)
```json
{
  "numeroConvenio": 3128557,
  "numeroCarteira": 17,
  "numeroVariacaoCarteira": 35,
  "codigoModalidade": 1,
  "dataEmissao": "15.01.2026",
  "dataVencimento": "31.01.2026",
  "valorOriginal": 123.45,
  "codigoAceite": "N",
  "codigoTipoTitulo": 2,
  "indicadorPermissaoRecebimentoParcial": "N",
  "numeroTituloBeneficiario": "TESTE-002",
  "indicadorPix": "N",
  "pagador": {
    "tipoInscricao": 1,
    "numeroInscricao": "97965940132",
    "nome": "JOÃO DA COSTA ANTUNES",
    "endereco": "Rua Exemplo, 456",
    "cep": "01234567",
    "cidade": "São Paulo",
    "bairro": "Centro",
    "uf": "SP"
  }
}
```

---

## ⚠️ Regras Importantes para Homologação

1. **Dados Fictícios:** Utilize apenas os CNPJs/CPFs listados acima para testes em homologação.

2. **Convênio Tipo 3:** 
   - **NÃO** enviar o campo `numeroTituloCliente` (Nosso Número)
   - O Banco do Brasil gerará automaticamente o Nosso Número

3. **Formato de Datas:**
   - Sempre no formato `dd.mm.aaaa`
   - Exemplo: `15.01.2026`

4. **Formato de Valores:**
   - Decimal separado por ponto
   - Exemplo: `123.45`

5. **CPF/CNPJ no numeroInscricao:**
   - **SEM** pontos, barras, hífens
   - **COM** zeros à esquerda (se houver)
   - A regra sobre "zeros à esquerda" **NÃO** se aplica ao `numeroInscricao`

6. **CEP:**
   - Numérico, **sem** pontos ou hífens
   - **Sem** zeros à esquerda

---

## 🔗 Referências

- Documentação completa: `DOCUMENTACAO_BB_COBRANCA.md`
- Endpoint de simulação: Seção 4.5 da documentação
- Dados fictícios: Seção 4.4 da documentação

---

**Última atualização:** 12/01/2026
**Ambiente:** Homologação
