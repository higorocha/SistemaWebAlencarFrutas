# Script de configuração do Claude Code para o projeto Alencar Frutas
# Execute este script uma vez para configurar o ambiente

param(
    [switch]$Install,
    [switch]$Uninstall
)

function Install-ClaudeAlias {
    Write-Host "Instalando alias 'claude' no perfil do PowerShell..." -ForegroundColor Green
    
    # Caminho do perfil do PowerShell
    $profilePath = $PROFILE
    
    # Verificar se o perfil existe
    if (-not (Test-Path $profilePath)) {
        Write-Host "Criando perfil do PowerShell..." -ForegroundColor Yellow
        New-Item -Path $profilePath -ItemType File -Force | Out-Null
    }
    
    # Conteúdo a ser adicionado ao perfil
    $aliasContent = @"

# Claude Code Alias - Projeto Alencar Frutas
function claude {
    param([string]`$Prompt = "")
    
    # Configurar token se necessário
    if (-not `$env:CLAUDE_CODE_OAUTH_TOKEN) {
        `$env:CLAUDE_CODE_OAUTH_TOKEN = "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"
    }
    
    # Navegar para o diretório do projeto
    `$projectPath = "$PWD"
    Set-Location `$projectPath
    
    if (`$Prompt) {
        npx @anthropic-ai/claude-code --settings claude-config.json --print `$Prompt
    } else {
        npx @anthropic-ai/claude-code --settings claude-config.json
    }
}

Write-Host "Claude Code disponível! Use: claude 'sua pergunta'" -ForegroundColor Cyan
"@

    # Verificar se o alias já existe
    $profileContent = Get-Content $profilePath -Raw
    if ($profileContent -notmatch "Claude Code Alias") {
        Add-Content -Path $profilePath -Value $aliasContent
        Write-Host "Alias 'claude' instalado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Alias 'claude' já está instalado!" -ForegroundColor Yellow
    }
    
    Write-Host "Reinicie o PowerShell ou execute: . `$PROFILE" -ForegroundColor Cyan
}

function Uninstall-ClaudeAlias {
    Write-Host "Removendo alias 'claude' do perfil do PowerShell..." -ForegroundColor Yellow
    
    $profilePath = $PROFILE
    if (Test-Path $profilePath) {
        $profileContent = Get-Content $profilePath -Raw
        $newContent = $profileContent -replace "(?s)# Claude Code Alias.*?Write-Host.*?Cyan\s*", ""
        Set-Content -Path $profilePath -Value $newContent
        Write-Host "Alias 'claude' removido com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Perfil do PowerShell não encontrado!" -ForegroundColor Red
    }
}

# Executar comando baseado no parâmetro
if ($Install) {
    Install-ClaudeAlias
} elseif ($Uninstall) {
    Uninstall-ClaudeAlias
} else {
    Write-Host "Claude Code Setup - Projeto Alencar Frutas" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Opções disponíveis:" -ForegroundColor Yellow
    Write-Host "  -Install    : Instala o alias 'claude' no perfil do PowerShell" -ForegroundColor White
    Write-Host "  -Uninstall  : Remove o alias 'claude' do perfil do PowerShell" -ForegroundColor White
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\claude-setup.ps1 -Install" -ForegroundColor White
    Write-Host "  .\claude-setup.ps1 -Uninstall" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternativa rápida (sem instalação permanente):" -ForegroundColor Yellow
    Write-Host "  . .\claude-alias.ps1" -ForegroundColor White
}
