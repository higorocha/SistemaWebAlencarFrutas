#!/bin/bash
# Script para instalar Chrome do Puppeteer no Render.com

echo "🔧 Instalando Chrome para Puppeteer..."

# Instalar Chrome via puppeteer browsers install
npx puppeteer browsers install chrome

# Verificar se o Chrome foi instalado
if [ -d "$HOME/.cache/puppeteer" ]; then
  echo "✅ Chrome instalado com sucesso"
  # Encontrar o caminho do Chrome instalado
  CHROME_PATH=$(find $HOME/.cache/puppeteer -name "chrome" -type f | head -n 1)
  if [ -n "$CHROME_PATH" ]; then
    echo "📍 Chrome encontrado em: $CHROME_PATH"
    # Exportar variável de ambiente (será usado pelo código)
    export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
  fi
else
  echo "⚠️  Chrome não foi encontrado após instalação"
fi

echo "✅ Instalação do Chrome concluída"

