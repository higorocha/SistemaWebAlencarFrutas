# Alias para facilitar o uso do Claude Code
# Adicione este arquivo ao seu perfil do PowerShell para usar 'claude' como comando

function claude {
    param(
        [string]$Prompt = ""
    )
    
    # Configurar token se necessário
    if (-not $env:CLAUDE_CODE_OAUTH_TOKEN) {
        $env:CLAUDE_CODE_OAUTH_TOKEN = "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"
    }
    
    if ($Prompt) {
        npx @anthropic-ai/claude-code --settings claude-config.json --print $Prompt
    } else {
        npx @anthropic-ai/claude-code --settings claude-config.json
    }
}

# Exportar a função para uso global
Export-ModuleMember -Function claude

Write-Host "Alias 'claude' configurado com sucesso!" -ForegroundColor Green
Write-Host "Use: claude 'sua pergunta aqui'" -ForegroundColor Yellow
Write-Host "Ou: claude (para modo interativo)" -ForegroundColor Yellow
