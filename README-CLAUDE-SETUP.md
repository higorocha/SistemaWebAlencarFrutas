# Configuração do Claude Code - Projeto Alencar Frutas

## Problema Resolvido

O erro `Export-ModuleMember : O cmdlet Export-ModuleMember pode ser chamado apenas de dentro de um módulo` ocorria porque o script `claude-alias.ps1` estava tentando usar um comando específico para módulos PowerShell em um script comum.

## Soluções Disponíveis

### 1. **Solução Rápida (Recomendada)**
Execute o script corrigido com o operador de dot-sourcing:

```powershell
. .\claude-alias.ps1
```

**Importante:** Note o ponto (.) antes do caminho do arquivo. Isso carrega a função no escopo atual.

### 2. **Instalação Permanente**
Para ter o comando `claude` sempre disponível:

```powershell
# Instalar o alias permanentemente
.\claude-setup.ps1 -Install

# Reiniciar o PowerShell ou recarregar o perfil
. $PROFILE
```

### 3. **Uso Direto**
Use o script principal sem problemas:

```powershell
.\claude.ps1 "sua pergunta aqui"
```

## Arquivos do Sistema

- **`claude-alias.ps1`** - Script corrigido para carregar a função claude
- **`claude-setup.ps1`** - Script para instalação permanente do alias
- **`claude.ps1`** - Script principal para execução direta
- **`claude-env.ps1`** - Configuração de variáveis de ambiente
- **`claude-config.json`** - Configurações do Claude Code

## Como Usar Após a Correção

### Método 1: Dot-sourcing (Temporário)
```powershell
. .\claude-alias.ps1
claude "analise este código"
```

### Método 2: Instalação Permanente
```powershell
.\claude-setup.ps1 -Install
# Reiniciar PowerShell
claude "analise este código"
```

### Método 3: Execução Direta
```powershell
.\claude.ps1 "analise este código"
```

## Configurações

O sistema está configurado para:
- **Modelo:** Sonnet
- **Tema:** Dark
- **Modo:** Verbose
- **Permissões:** AcceptEdits
- **Diretórios:** ./backend, ./frontend
- **Idioma:** Português brasileiro

## Troubleshooting

### Se ainda houver problemas:

1. **Verifique se o Node.js está instalado:**
   ```powershell
   node --version
   npx --version
   ```

2. **Verifique se o Claude Code está instalado:**
   ```powershell
   npx @anthropic-ai/claude-code --version
   ```

3. **Execute o script de ambiente:**
   ```powershell
   . .\claude-env.ps1
   ```

4. **Teste com execução direta:**
   ```powershell
   .\claude.ps1 "teste"
   ```

## Explicação Técnica

O erro ocorria porque:
- `Export-ModuleMember` só funciona em módulos PowerShell (.psm1)
- Scripts .ps1 são executados em um contexto diferente
- A solução usa dot-sourcing (`. .\script.ps1`) para carregar funções no escopo atual
- Alternativamente, instala a função diretamente no perfil do PowerShell

Agora o sistema funciona corretamente sem erros!
