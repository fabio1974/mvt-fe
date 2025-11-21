#!/bin/bash

# Script para simular o build do Render localmente
# Isso ajuda a verificar se as variáveis estão sendo passadas corretamente

echo "🔍 Simulando build do Render..."
echo ""

# Verificar se as variáveis estão definidas
if [ -z "$VITE_GOOGLE_MAPS_API_KEY" ]; then
  echo "❌ VITE_GOOGLE_MAPS_API_KEY não está definida!"
  echo ""
  echo "Definindo temporariamente para o build..."
  export VITE_GOOGLE_MAPS_API_KEY="AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU"
fi

echo "✅ Variáveis de ambiente:"
echo "   VITE_GOOGLE_MAPS_API_KEY: ${VITE_GOOGLE_MAPS_API_KEY:0:15}..."
echo ""

# Build
echo "📦 Executando build..."
npm run build

echo ""
echo "🔍 Verificando se a chave foi embedada no bundle..."
echo ""

# Procurar a chave no bundle gerado
if grep -r "AIzaSyBpJ-PEX" dist/assets/*.js > /dev/null 2>&1; then
  echo "✅ Chave encontrada no bundle!"
  echo "   A variável foi corretamente embedada durante o build."
else
  echo "❌ Chave NÃO encontrada no bundle!"
  echo "   A variável não foi embedada durante o build."
  echo ""
  echo "Possíveis causas:"
  echo "1. Variável não foi exportada antes do build"
  echo "2. Nome da variável incorreto (deve começar com VITE_)"
  echo "3. Cache do Vite precisa ser limpo"
fi

echo ""
echo "📊 Arquivos gerados em dist/:"
ls -lh dist/assets/*.js | head -5
