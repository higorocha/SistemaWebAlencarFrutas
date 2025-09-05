# Arquivo de configuração de ambiente para Claude Code
# Execute este arquivo antes de usar o Claude Code: . .\claude-env.ps1

Write-Host "Configurando ambiente Claude Code..." -ForegroundColor Green

# Configurar token de autenticação
$env:CLAUDE_CODE_OAUTH_TOKEN = "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"

# Configurações adicionais
$env:CLAUDE_CODE_MODEL = "sonnet"
$env:CLAUDE_CODE_THEME = "dark"
$env:CLAUDE_CODE_VERBOSE = "true"

Write-Host "Ambiente configurado com sucesso!" -ForegroundColor Green
Write-Host "Agora você pode usar: npx @anthropic-ai/claude-code --settings claude-config.json" -ForegroundColor Yellow
