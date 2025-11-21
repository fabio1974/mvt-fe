# 🗺️ Controle de Tipo de Mapa (Satélite) - Google Maps

## 🎯 Implementação

Adicionado controle para alternar entre diferentes visualizações do mapa no componente `AddressMapPicker`.

---

## 📋 Tipos de Mapa Disponíveis

### 1. 🗺️ Roadmap (Padrão)
- Visualização de mapa de ruas tradicional
- Mostra ruas, rodovias, nomes de lugares
- Melhor para navegação e endereços

### 2. 🛰️ Satellite
- Imagem de satélite pura
- Sem labels ou nomes
- Melhor para visualizar terreno real

### 3. 🌐 Hybrid
- Combina satélite + labels
- Imagem de satélite com nomes de ruas
- **Mais útil** para maioria dos casos

### 4. 🏔️ Terrain
- Mostra elevação e terreno
- Útil para áreas montanhosas
- Mostra topografia

---

## 🔧 Código Implementado

### Configuração do Controle

```tsx
options={{
  mapTypeControl: true,  // ← Habilita o controle
  mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
    position: google.maps.ControlPosition.TOP_RIGHT,
    mapTypeIds: [
      google.maps.MapTypeId.ROADMAP,    // Mapa
      google.maps.MapTypeId.SATELLITE,  // Satélite
      google.maps.MapTypeId.HYBRID,     // Híbrido
      google.maps.MapTypeId.TERRAIN,    // Terreno
    ],
  },
}}
```

---

## 🎨 Posicionamento do Controle

### Opções de Posição Disponíveis:

```typescript
google.maps.ControlPosition.TOP_LEFT      // ↖️ Canto superior esquerdo
google.maps.ControlPosition.TOP_CENTER    // ⬆️ Centro superior
google.maps.ControlPosition.TOP_RIGHT     // ↗️ Canto superior direito (atual)
google.maps.ControlPosition.LEFT_TOP      // ⬅️ Esquerda topo
google.maps.ControlPosition.RIGHT_TOP     // ➡️ Direita topo
google.maps.ControlPosition.BOTTOM_LEFT   // ↙️ Canto inferior esquerdo
google.maps.ControlPosition.BOTTOM_CENTER // ⬇️ Centro inferior
google.maps.ControlPosition.BOTTOM_RIGHT  // ↘️ Canto inferior direito
```

**Escolhido:** `TOP_RIGHT` - Não atrapalha o campo de busca e fica visível

---

## 🎯 Estilos de Controle

### 1. HORIZONTAL_BAR (Atual)
```
┌────────────────────────────────┐
│  [Mapa] [Satélite] [Terreno]  │
└────────────────────────────────┘
```
- Botões lado a lado
- Compacto e elegante
- **Recomendado** para web

### 2. DROPDOWN_MENU
```
┌─────────┐
│ Mapa ▼  │
└─────────┘
```
- Menu suspenso
- Mais compacto
- Bom para mobile

### 3. DEFAULT
```
┌─────────┐
│  Mapa   │
├─────────┤
│ Satélite│
├─────────┤
│ Terreno │
└─────────┘
```
- Botões empilhados
- Ocupa mais espaço

---

## 📸 Como Usar

### No Frontend (Usuário):

1. **Abra uma tela com mapa**
   - Cadastro de Delivery
   - Cadastro de User
   - Qualquer tela com `AddressMapPicker`

2. **Localize o controle no canto superior direito**
   ```
   ┌───────────────────────────────────┐
   │                [Mapa][Satélite]  │← Aqui
   │                                   │
   │          🗺️ MAPA                 │
   │                                   │
   │             📍                    │
   │                                   │
   └───────────────────────────────────┘
   ```

3. **Clique em "Satélite"**
   - Mapa muda para visualização de satélite
   - Imagem real do local

4. **Clique em "Híbrido"** (se disponível)
   - Satélite + nomes de ruas
   - Melhor dos dois mundos

---

## 🎨 Aparência Visual

### Mapa Normal (Roadmap)
```
┌─────────────────────────────────┐
│  [Mapa] Satélite  Híbrido       │
├─────────────────────────────────┤
│  Rua A                          │
│    ├──┐                         │
│    │  └─── Rua B                │
│  Av. Principal                  │
│    ══════════════               │
│         │                       │
│      📍 Marcador                │
│         │                       │
│    ┌────┴─────┐                 │
│    │  Praça   │                 │
└─────────────────────────────────┘
```

### Satélite
```
┌─────────────────────────────────┐
│  Mapa  [Satélite] Híbrido       │
├─────────────────────────────────┤
│  🌳🌳🌳                          │
│  🏠🏠🏠🏠                        │
│  🏢🏢  🏢🏢                      │
│    📍 Marcador                  │
│  🏪🏫🏬                          │
│  🛣️🛣️🛣️🛣️                    │
│  🌲🌲  🏞️                       │
└─────────────────────────────────┘
```

### Híbrido (Satélite + Labels)
```
┌─────────────────────────────────┐
│  Mapa  Satélite  [Híbrido]      │
├─────────────────────────────────┤
│  🌳🌳🌳  ← Parque Central        │
│  🏠🏠🏠🏠  ← Rua Residencial    │
│  🏢🏢  🏢🏢  ← Av. Comercial    │
│    📍 Marcador                  │
│       ↑ Seu Local               │
│  🏪🏫🏬  ← Centro                │
│  🛣️🛣️🛣️🛣️  ← Rodovia BR-116 │
└─────────────────────────────────┘
```

---

## ⚙️ Opções Adicionais Configuradas

### Outros Controles no Mapa:

```tsx
options={{
  disableDefaultUI: false,        // Mantém UI padrão
  zoomControl: true,              // ✅ Controle de zoom (+/-)
  streetViewControl: false,       // ❌ Boneco do Street View
  mapTypeControl: true,           // ✅ Controle de tipo (Mapa/Satélite)
  fullscreenControl: true,        // ✅ Botão de tela cheia
}}
```

**Layout dos controles:**
```
┌─────────────────────────────────────┐
│  [Mapa][Satélite][Terreno]    [🔲] │← Tipo de mapa + Tela cheia
│                                     │
│                                [+]  │← Zoom in
│          🗺️ MAPA              [-]  │← Zoom out
│                                     │
│             📍                      │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔍 MapTypeId - Valores Disponíveis

### Constantes do Google Maps API:

```typescript
google.maps.MapTypeId.ROADMAP    = "roadmap"    // Mapa de ruas
google.maps.MapTypeId.SATELLITE  = "satellite"  // Satélite puro
google.maps.MapTypeId.HYBRID     = "hybrid"     // Satélite + labels
google.maps.MapTypeId.TERRAIN    = "terrain"    // Terreno/topografia
```

### Uso Programático:

Se quiser definir tipo inicial do mapa:
```tsx
<GoogleMap
  mapTypeId={google.maps.MapTypeId.SATELLITE}  // Inicia em satélite
  // ...
/>
```

---

## 📱 Responsividade

### Desktop (>768px)
```
Controle: HORIZONTAL_BAR
┌──────────────────────────┐
│ [Mapa] [Satélite] [...]  │
└──────────────────────────┘
```

### Mobile (<768px)
```
Controle: Mesmo estilo, mas menor
┌────────────────┐
│ [M] [S] [T]    │
└────────────────┘
```

**Nota:** O Google Maps automaticamente ajusta o tamanho dos controles em telas menores.

---

## 🎯 Casos de Uso

### 1. Identificar Local Exato
**Use:** Satélite ou Híbrido
```
Exemplo: Encontrar entrada de condomínio
         Ver se local tem estacionamento
         Identificar pontos de referência
```

### 2. Navegação/Rota
**Use:** Roadmap (Mapa)
```
Exemplo: Ver nomes de ruas
         Identificar endereço completo
         Planejar rota
```

### 3. Área Rural/Fazenda
**Use:** Terrain ou Satélite
```
Exemplo: Ver topografia
         Identificar rios, morros
         Área sem ruas definidas
```

### 4. Delivery Urbano
**Use:** Híbrido
```
Exemplo: Ver prédio real + nome da rua
         Melhor para entregadores
         Combina visual + texto
```

---

## 🔧 Customização Adicional

### Desabilitar Tipos Específicos

Se quiser apenas Mapa e Satélite (sem Híbrido e Terreno):

```tsx
mapTypeIds: [
  google.maps.MapTypeId.ROADMAP,
  google.maps.MapTypeId.SATELLITE,
  // Removidos: HYBRID e TERRAIN
],
```

### Mudar Estilo do Controle

Para menu dropdown em vez de botões:

```tsx
mapTypeControlOptions: {
  style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,  // ← Mudar aqui
  // ...
},
```

### Mudar Posição

Para cantar inferior direito:

```tsx
mapTypeControlOptions: {
  position: google.maps.ControlPosition.BOTTOM_RIGHT,  // ← Mudar aqui
  // ...
},
```

---

## 🐛 Troubleshooting

### Problema 1: Controle não aparece

**Causa:** `mapTypeControl: false`

**Solução:**
```tsx
options={{
  mapTypeControl: true,  // ← Deve ser true
}}
```

---

### Problema 2: Apenas um tipo de mapa disponível

**Causa:** `mapTypeIds` array vazio ou com um item

**Solução:**
```tsx
mapTypeIds: [
  google.maps.MapTypeId.ROADMAP,
  google.maps.MapTypeId.SATELLITE,
  google.maps.MapTypeId.HYBRID,
  google.maps.MapTypeId.TERRAIN,
],
```

---

### Problema 3: Controle sobrepõe outros elementos

**Causa:** Posição inadequada

**Solução:** Mudar `position`:
```tsx
position: google.maps.ControlPosition.TOP_LEFT,  // Testar outras posições
```

---

### Problema 4: Imagem de satélite não carrega

**Causa:** 
- API key sem permissão
- Região sem cobertura de satélite

**Solução:**
1. Verificar se Maps JavaScript API está habilitada
2. Testar em área urbana conhecida (ex: Fortaleza)
3. Verificar console do navegador

---

## 📊 Comparação de Tipos

| Tipo | Usa Internet | Detalhes | Melhor Para |
|------|--------------|----------|-------------|
| **Roadmap** | Pouca | Baixo | Navegação urbana |
| **Satellite** | Muita | Alto | Identificar local visual |
| **Hybrid** | Muita | Muito Alto | Delivery, logística |
| **Terrain** | Média | Médio | Áreas rurais, topografia |

---

## ✅ Checklist de Implementação

- [x] `mapTypeControl: true` habilitado
- [x] `mapTypeControlOptions` configurado
- [x] Estilo: `HORIZONTAL_BAR`
- [x] Posição: `TOP_RIGHT`
- [x] 4 tipos de mapa disponíveis
- [x] Não conflita com outros controles
- [x] Responsivo (funciona em mobile)

---

## 🎯 Resultado Final

### Antes (Sem Controle):
```
┌────────────────────────┐
│                        │
│      🗺️ MAPA          │
│      (somente)         │
│                        │
│        📍             │
│                        │
└────────────────────────┘
```

### Depois (Com Controle):
```
┌────────────────────────────────┐
│            [Mapa][Satélite]   │← NOVO!
│                                │
│   🗺️ → 🛰️ (alternável)       │
│                                │
│            📍                 │
│                                │
└────────────────────────────────┘
```

---

## 📚 Referências

### Google Maps API Docs:
- **MapTypeControl:** https://developers.google.com/maps/documentation/javascript/controls#MapType
- **MapTypeId:** https://developers.google.com/maps/documentation/javascript/maptypes#MapTypeIds
- **ControlOptions:** https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeControlOptions

---

**Status:** ✅ Implementado  
**Data:** 21/11/2025  
**Componente:** `AddressMapPicker.tsx`  
**Tipos disponíveis:** Roadmap, Satellite, Hybrid, Terrain  
**Posição:** Canto superior direito  
**Estilo:** Horizontal Bar
