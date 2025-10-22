# 🎨 Guia: Como Adicionar o Logo da Zapi10

## 📍 Localização

Adicione o arquivo do logo na pasta:

```
src/assets/
```

## 📝 Formatos Aceitos

- PNG (recomendado para transparência)
- SVG (recomendado para escalabilidade)
- JPG/JPEG
- WebP

## 🔧 Como Configurar

### Passo 1: Adicionar o arquivo

Coloque seu arquivo de logo na pasta `src/assets/`. Exemplo:

- `src/assets/logo.png`
- `src/assets/logo.svg`
- `src/assets/zapi10-logo.png`

### Passo 2: Atualizar o arquivo de configuração

Abra o arquivo `src/config/logo.ts` e:

1. **Remova a linha comentada** que importa o react.svg
2. **Adicione o import do seu logo**
3. **Atualize a exportação**

#### Exemplo para logo.png:

```typescript
// ANTES:
import viteLogo from "../assets/react.svg";
export const LOGO_PATH = viteLogo;

// DEPOIS:
import logo from "../assets/logo.png";
export const LOGO_PATH = logo;
```

#### Exemplo para logo.svg:

```typescript
import logo from "../assets/logo.svg";
export const LOGO_PATH = logo;
```

### Passo 3: Salvar e testar

O logo será automaticamente atualizado em:

- ✅ Header (cabeçalho)
- ✅ Sidebar (menu lateral)
- ✅ Footer (rodapé)

## 📐 Recomendações de Tamanho

- **Sidebar**: 48x48px
- **Header**: 46x46px
- **Footer**: 32x32px

O logo será redimensionado automaticamente, mas recomenda-se:

- **Mínimo**: 128x128px
- **Ideal**: 256x256px ou maior (para SVG, não há limite)
- **Proporção**: Quadrada (1:1) ou próxima

## 🎯 Dica Pro

Use formato SVG sempre que possível - ele escala perfeitamente em qualquer tamanho e dispositivo!

## ✨ Melhorias Implementadas no Layout

### Página de Login

- ✅ Tema dark moderno com gradientes azul/laranja
- ✅ Painel de informações com cards glassmorphism
- ✅ Layout responsivo e centralizado
- ✅ Footer fixo na parte inferior

### Footer

- ✅ Posição fixed no bottom (para páginas de login)
- ✅ Tema dark harmonizado
- ✅ Logo substituível centralizadamente
- ✅ Versão compacta para usuários logados

### Componentes Atualizados

- Header, Sidebar e Footer agora usam o mesmo arquivo de logo
- Basta atualizar em um lugar (`src/config/logo.ts`) para mudar em todos
