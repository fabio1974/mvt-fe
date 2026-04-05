#!/bin/bash

# Script para detectar e usar a melhor versão do Node
# e iniciar a aplicação React

set -e

echo "🔍 Detectando a melhor versão do Node..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se existe .nvmrc
if [ -f ".nvmrc" ]; then
    NODE_VERSION=$(cat .nvmrc)
    echo -e "${GREEN}✓${NC} Encontrado .nvmrc com Node v${NODE_VERSION}"
else
    echo -e "${YELLOW}⚠${NC} Arquivo .nvmrc não encontrado, usando versão atual do Node"
    NODE_VERSION=$(node -v | sed 's/v//')
fi

# Verificar se nvm está instalado
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo -e "${GREEN}✓${NC} NVM encontrado, carregando..."
    
    # Carregar nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Usar a versão especificada
    echo "📦 Configurando Node v${NODE_VERSION}..."
    nvm use ${NODE_VERSION} 2>/dev/null || {
        echo -e "${YELLOW}⚠${NC} Node v${NODE_VERSION} não está instalado"
        echo "📥 Instalando Node v${NODE_VERSION}..."
        nvm install ${NODE_VERSION}
        nvm use ${NODE_VERSION}
    }
    
    echo -e "${GREEN}✓${NC} Usando Node $(node -v)"
else
    echo -e "${YELLOW}⚠${NC} NVM não encontrado"
    echo "📍 Usando Node instalado no sistema: $(node -v)"
    
    # Verificar se a versão atual é compatível
    CURRENT_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    REQUIRED_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$CURRENT_VERSION" != "$REQUIRED_VERSION" ]; then
        echo -e "${RED}✗${NC} Versão atual (v${CURRENT_VERSION}) é diferente da requerida (v${REQUIRED_VERSION})"
        echo -e "${YELLOW}💡 Dica:${NC} Instale o NVM para gerenciar versões do Node automaticamente"
        echo "   Visite: https://github.com/nvm-sh/nvm"
        exit 1
    fi
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC} node_modules não encontrado"
    echo "📦 Instalando dependências..."
    npm install
fi

# Limpar portas ocupadas pelo Vite
echo "🧹 Limpando portas ocupadas..."
for port in 5173 5174 5175 5176 5177; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo "  Liberando porta $port (PID: $PID)..."
        kill -9 $PID 2>/dev/null || true
    fi
done
sleep 1

echo ""
echo "🚀 Iniciando aplicação React..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓${NC} Configuração completa!"
echo ""
echo "📍 A aplicação estará disponível em:"
echo -e "   ${GREEN}➜${NC} Local:   ${GREEN}http://localhost:5173/${NC}"
echo -e "   ${GREEN}➜${NC} Network: Use o link que aparecerá abaixo"
echo ""
echo -e "${YELLOW}⚠${NC}  Nota: Hot Reload está desabilitado. Recarregue manualmente após mudanças."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar a aplicação
npm run dev
