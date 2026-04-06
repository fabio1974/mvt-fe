#!/bin/bash

# 🧪 Roda testes E2E (Playwright) — requer BE + FE rodando
# Usar antes de fazer push/deploy para garantir que os fluxos funcionam

set -e
cd "$(dirname "$0")/.."

echo "🧪 Testes E2E (Playwright)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verifica se o BE está rodando
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "❌ Backend não está rodando na porta 8080"
    echo "   Suba o BE antes de rodar os testes E2E"
    exit 1
fi
echo "✅ Backend rodando (porta 8080)"

# Verifica se o FE está rodando
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "❌ Frontend não está rodando na porta 5173"
    echo "   Suba o FE antes de rodar os testes E2E"
    exit 1
fi
echo "✅ Frontend rodando (porta 5173)"
echo ""

# Roda os testes
echo "📋 Suites disponíveis:"
echo "   • auth-flows (13 testes)"
echo "   • change-password (2 testes)"
echo "   • delivery-wizard (11 testes)"
echo "   • crud-payload (16 testes)"
echo ""

npx playwright test tests/e2e/ --reporter=line

echo ""
echo "✅ Todos os testes E2E passaram!"
