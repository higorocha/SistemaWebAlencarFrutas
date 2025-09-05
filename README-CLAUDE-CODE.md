# Claude Code - Configuração para Projeto Alencar Frutas

Este documento explica como usar o Claude Code no terminal do Cursor para desenvolvimento do projeto Alencar Frutas.

## 🚀 Configuração Inicial

### 1. Instalação
```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Autenticação
```bash
npx @anthropic-ai/claude-code setup-token
```

### 3. Configuração de Ambiente
Execute o arquivo de configuração:
```powershell
. .\claude-env.ps1
```

## 📋 Como Usar

### Modo Interativo
```bash
npx @anthropic-ai/claude-code --settings claude-config.json
```

### Comando Direto
```bash
npx @anthropic-ai/claude-code --settings claude-config.json --print "Sua pergunta aqui"
```

### Usando o Script PowerShell
```powershell
.\claude.ps1 "Sua pergunta aqui"
```

## 🛠️ Configurações

### Arquivo `claude-config.json`
- **Modelo**: Claude Sonnet 4 (mais recente)
- **Tema**: Dark
- **Modo de Permissão**: Aceitar edições automaticamente
- **Diretórios Permitidos**: `./backend` e `./frontend`
- **Prompt do Sistema**: Configurado para português brasileiro e melhores práticas

### Ferramentas Permitidas
- Bash (execução de comandos)
- Edit (edição de arquivos)
- Read (leitura de arquivos)
- Search (busca no código)
- Create (criação de arquivos)
- Delete (exclusão de arquivos)
- Move (movimentação de arquivos)
- Copy (cópia de arquivos)

## 💡 Exemplos de Uso

### Análise de Código
```bash
npx @anthropic-ai/claude-code --settings claude-config.json --print "Analise o arquivo PagamentosTab.js e sugira melhorias"
```

### Criação de Componente
```bash
npx @anthropic-ai/claude-code --settings claude-config.json --print "Crie um componente React para exibir estatísticas de vendas"
```

### Debugging
```bash
npx @anthropic-ai/claude-code --settings claude-config.json --print "Ajude-me a debugar o erro no backend relacionado aos pedidos"
```

### Refatoração
```bash
npx @anthropic-ai/claude-code --settings claude-config.json --print "Refatore o código do serviço de clientes para melhorar a performance"
```

## 🔧 Comandos Úteis

### Verificar Versão
```bash
npx @anthropic-ai/claude-code --version
```

### Atualizar Claude Code
```bash
npx @anthropic-ai/claude-code update
```

### Verificar Configuração
```bash
npx @anthropic-ai/claude-code config list
```

## 📁 Estrutura do Projeto

O Claude Code está configurado para trabalhar com:
- **Backend**: NestJS com TypeScript
- **Frontend**: React com Material-UI
- **Banco de Dados**: Prisma ORM
- **Autenticação**: JWT
- **API**: RESTful com Swagger

## 🎯 Dicas de Uso

1. **Seja Específico**: Quanto mais específica for sua pergunta, melhor será a resposta
2. **Use Contexto**: Mencione arquivos específicos ou funcionalidades quando necessário
3. **Iterativo**: Use o modo interativo para conversas mais longas
4. **Segurança**: O Claude Code só pode acessar os diretórios configurados

## 🚨 Importante

- Mantenha seu token de autenticação seguro
- O token tem validade de 1 ano
- Use apenas em diretórios confiáveis
- Sempre revise o código gerado antes de aplicar

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique se o token está configurado corretamente
2. Execute `npx @anthropic-ai/claude-code doctor` para diagnóstico
3. Consulte a documentação oficial: https://docs.anthropic.com/claude/code
