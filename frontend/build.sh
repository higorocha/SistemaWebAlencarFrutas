#!/bin/bash
# Script simplificado para build no Render
set -e

echo "Iniciando build do frontend..."

# Instala pacotes (incluindo o Babel, se estiver no devDependencies)
echo "Instalando dependências..."
npm install

# Rodando build
echo "Executando build..."
DISABLE_ESLINT_PLUGIN=true SKIP_PREFLIGHT_CHECK=true CI=false npm run build

echo "Verificando se a pasta 'build' foi gerada..."
if [ -d "build" ]; then
  echo "Build concluído com sucesso!"
  exit 0
else
  echo "ERRO: Build falhou. A pasta 'build' não foi criada."
  exit 1
fi
