#!/bin/bash
# Script para preparar e fazer deploy
# Last Updated: 2024-12-24
# Version: 1.1.0
#
# Recent Changes:
# - Payment Report Modal with detailed split breakdown
# - QR Code PIX display with copy functionality
# - Enhanced payment management with custom actions
# - Disabled view/edit actions for payments (delete only)
# - Improved error handling and user feedback
#
# New Features in v1.1.0:
# - Payment Report: Consolidated splits and delivery breakdown
# - QR Code Modal: Visual QR + PIX copy-and-paste code
# - Gateway Response: Translated error messages
# - Custom Actions: 4 action buttons (QR, Report, Gateway, Delete)

echo "🚀 MVT Events - Deploy Script v1.1.0"
echo "===================================="
echo ""
echo "📦 New in this version:"
echo "  ✓ Payment Report with split details"
echo "  ✓ QR Code PIX display modal"
echo "  ✓ Enhanced payment management"
echo "  ✓ Improved error handling"
echo ""

# Verificar se está na branch main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Você não está na branch main (atual: $BRANCH)"
    read -p "Continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Há mudanças não commitadas:"
    git status -s
    read -p "Fazer commit agora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Mensagem do commit: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
    fi
fi

# Build local para verificar erros
echo ""
echo "📦 Fazendo build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falhou! Corrija os erros antes de fazer deploy."
    exit 1
fi

echo "✅ Build local bem-sucedido!"

# Verificar se .env está no .gitignore
if git check-ignore .env > /dev/null 2>&1; then
    echo "✅ .env está no .gitignore"
else
    echo "⚠️  .env NÃO está no .gitignore!"
    echo "   Adicione-o antes de continuar!"
    exit 1
fi

# Push para GitHub
echo ""
read -p "🚀 Fazer push para GitHub e deploy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin $BRANCH
    echo ""
    echo "✅ Push realizado!"
    echo ""
    echo "📊 Acompanhe o deploy em:"
    echo "   - GitHub Actions: https://github.com/fabio1974/mvt-fe/actions"
    echo "   - Render Dashboard: https://dashboard.render.com"
    echo ""
    echo "🌐 URLs de Produção:"
    echo "   - Frontend: https://mvt-fe.onrender.com"
    echo "   - Backend: https://mvt-events-api.onrender.com"
    echo "   - API Health: https://mvt-events-api.onrender.com/actuator/health"
else
    echo "Deploy cancelado."
fi
