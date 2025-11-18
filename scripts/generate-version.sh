#!/bin/bash
# Script para gerar informações de versão

COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION=$(node -p "require('./package.json').version")

cat > src/version.ts << EOF
// Auto-generated version info - DO NOT EDIT
export const VERSION = '${VERSION}';
export const COMMIT_HASH = '${COMMIT_HASH}';
export const BUILD_DATE = '${BUILD_DATE}';
EOF

echo "✅ Version info generated: v${VERSION} (${COMMIT_HASH})"
