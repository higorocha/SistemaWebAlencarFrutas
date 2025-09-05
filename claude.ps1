# Script para executar Claude Code no projeto Alencar Frutas
# Uso: .\claude.ps1 [comando ou pergunta]

param(
    [string]$Prompt = ""
)

# Configurar variável de ambiente se não estiver definida
if (-not $env:CLAUDE_CODE_OAUTH_TOKEN) {
    Write-Host "Configurando token de autenticação..." -ForegroundColor Yellow
    $env:CLAUDE_CODE_OAUTH_TOKEN = "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"
}

# Verificar se o prompt foi fornecido
if ($Prompt) {
    Write-Host "Executando Claude Code com prompt: $Prompt" -ForegroundColor Green
    npx @anthropic-ai/claude-code --settings claude-config.json $Prompt
} else {
    Write-Host "Iniciando sessão interativa do Claude Code..." -ForegroundColor Green
    Write-Host "Use Ctrl+C para sair" -ForegroundColor Yellow
    npx @anthropic-ai/claude-code --settings claude-config.json
}
