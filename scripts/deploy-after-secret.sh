#!/bin/bash
# Script para deploy após configurar GitHub Secret

echo "🔐 Verificação de GitHub Secret"
echo "================================"
echo ""
echo "⚠️  ANTES DE EXECUTAR ESTE SCRIPT:"
echo ""
echo "1. Acesse: https://github.com/fabio1974/mvt-fe/settings/secrets/actions"
echo "2. Clique em 'New repository secret'"
echo "3. Name: VITE_GOOGLE_MAPS_API_KEY"
echo "4. Secret: AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU"
echo "5. Clique em 'Add secret'"
echo ""
read -p "✅ Você JÁ adicionou o secret no GitHub? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Por favor, adicione o secret primeiro e execute este script novamente."
    echo ""
    echo "URL direta: https://github.com/fabio1974/mvt-fe/settings/secrets/actions/new"
    exit 1
fi

echo ""
echo "🚀 Fazendo push para main..."
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "📊 Acompanhe o build:"
    echo "   https://github.com/fabio1974/mvt-fe/actions"
    echo ""
    echo "⏱️  Timeline esperada:"
    echo "   +1 min: GitHub Actions iniciando"
    echo "   +2 min: Build em andamento"
    echo "   +3 min: GitHub Actions completo"
    echo "   +4 min: Render fazendo pull"
    echo "   +5 min: Deploy completo"
    echo ""
    echo "🧪 Depois de 5-6 minutos, teste em:"
    echo "   https://zapi10.com.br"
    echo ""
    echo "🔍 Verifique o console (F12):"
    echo "   Deve aparecer: 🗺️ Google Maps API Key: AIzaSyBpJ-..."
    echo ""
else
    echo ""
    echo "❌ Erro ao fazer push!"
    echo "Verifique sua conexão e tente novamente."
    exit 1
fi
