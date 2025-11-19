#!/bin/bash
# Script para gerar favicon a partir do logo.png

LOGO_PATH="src/assets/logo.png"
OUTPUT_DIR="public"

echo "🎨 Gerando favicon a partir do logo..."

# Verifica se o logo existe
if [ ! -f "$LOGO_PATH" ]; then
  echo "❌ Logo não encontrado em $LOGO_PATH"
  exit 1
fi

# Copia o logo como favicon.png (32x32 é um tamanho comum)
if command -v convert &> /dev/null; then
  echo "✅ ImageMagick encontrado, gerando favicons otimizados..."
  
  # Favicon.ico com múltiplos tamanhos
  convert "$LOGO_PATH" -resize 16x16 "${OUTPUT_DIR}/favicon-16x16.png"
  convert "$LOGO_PATH" -resize 32x32 "${OUTPUT_DIR}/favicon-32x32.png"
  convert "$LOGO_PATH" -resize 48x48 "${OUTPUT_DIR}/favicon-48x48.png"
  convert "$LOGO_PATH" -resize 192x192 "${OUTPUT_DIR}/android-chrome-192x192.png"
  convert "$LOGO_PATH" -resize 512x512 "${OUTPUT_DIR}/android-chrome-512x512.png"
  convert "$LOGO_PATH" -resize 180x180 "${OUTPUT_DIR}/apple-touch-icon.png"
  
  # Gera favicon.ico com múltiplos tamanhos
  convert "${OUTPUT_DIR}/favicon-16x16.png" "${OUTPUT_DIR}/favicon-32x32.png" "${OUTPUT_DIR}/favicon-48x48.png" "${OUTPUT_DIR}/favicon.ico"
  
  echo "✅ Favicons gerados com sucesso!"
  
elif command -v magick &> /dev/null; then
  echo "✅ ImageMagick (magick) encontrado, gerando favicons otimizados..."
  
  magick "$LOGO_PATH" -resize 16x16 "${OUTPUT_DIR}/favicon-16x16.png"
  magick "$LOGO_PATH" -resize 32x32 "${OUTPUT_DIR}/favicon-32x32.png"
  magick "$LOGO_PATH" -resize 48x48 "${OUTPUT_DIR}/favicon-48x48.png"
  magick "$LOGO_PATH" -resize 192x192 "${OUTPUT_DIR}/android-chrome-192x192.png"
  magick "$LOGO_PATH" -resize 512x512 "${OUTPUT_DIR}/android-chrome-512x512.png"
  magick "$LOGO_PATH" -resize 180x180 "${OUTPUT_DIR}/apple-touch-icon.png"
  
  magick "${OUTPUT_DIR}/favicon-16x16.png" "${OUTPUT_DIR}/favicon-32x32.png" "${OUTPUT_DIR}/favicon-48x48.png" "${OUTPUT_DIR}/favicon.ico"
  
  echo "✅ Favicons gerados com sucesso!"
  
else
  echo "⚠️ ImageMagick não encontrado, copiando logo diretamente..."
  cp "$LOGO_PATH" "${OUTPUT_DIR}/favicon.png"
  echo "ℹ️ Instale ImageMagick para gerar favicons otimizados:"
  echo "   Ubuntu/Debian: sudo apt install imagemagick"
  echo "   Mac: brew install imagemagick"
fi

echo ""
echo "📋 Próximo passo: Atualize o index.html com os novos favicons"
