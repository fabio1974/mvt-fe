# Funcionalidades Avançadas - Zonas Especiais

## 🎯 Recursos Implementados

### 1. **Edição de Raio com Zoom Automático**
- **Comportamento:** Quando você arrasta a borda do círculo para aumentar/diminuir o raio, o zoom do mapa se ajusta automaticamente
- **Regra:** O diâmetro do círculo sempre ocupará **50% da altura do mapa**
- **Cálculo:** Usa fórmula logarítmica baseada na relação metros/pixel em cada nível de zoom
- **Resultado:** Visão sempre otimizada da zona durante a edição

**Como usar:**
1. Clique na borda do círculo
2. Arraste para aumentar ou diminuir
3. O zoom ajusta automaticamente para manter o círculo visível e proporcional

### 2. **Arraste de Zona com Centralização Dinâmica**
- **Comportamento:** Quando você arrasta o ponto central da zona, o mapa se move junto
- **Regra:** O centro da zona tenta sempre ficar no centro do mapa durante o arraste
- **Resultado:** Navegação fluida e intuitiva

**Como usar:**
1. Clique no ponto central (marcador) da zona
2. Arraste para nova posição
3. O mapa se move junto, mantendo o marcador sempre visível
4. Ao soltar, o endereço é atualizado automaticamente via geocoding reverso

### 3. **Preservação de Zoom Manual**
- **Comportamento:** Se você usar os controles de zoom (+/-) ou scroll do mouse, o zoom **não será mais ajustado automaticamente**
- **Regra:** O sistema detecta zoom manual e respeita sua escolha
- **Reset:** Ao iniciar nova edição de raio ou arrastar outra zona, o zoom automático é reativado

**Detecção:**
- Listener `zoom_changed` no Google Maps
- Flag `userControlledZoom` controla o estado
- Reset automático ao começar nova edição

### 4. **Bloqueio de Arraste do Mapa**
- **Comportamento:** Durante o arraste de uma zona, o mapa **não se move** com gestos do mouse
- **Regra:** `gestureHandling: 'none'` quando `draggingZoneId` está ativo
- **Resultado:** Evita conflito entre arrastar zona e arrastar mapa

## 🔧 Estados de Controle

```typescript
const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
const [mapZoom, setMapZoom] = useState(13);
const [userControlledZoom, setUserControlledZoom] = useState(false);
const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null);
```

### `editingZoneId`
- **Quando ativa:** Durante edição de raio (mouseDown no círculo) ou arraste de marcador
- **Uso:** Controla se zoom automático deve ser aplicado

### `userControlledZoom`
- **Quando ativa:** Após usuário usar controles de zoom manualmente
- **Uso:** Desabilita ajuste automático de zoom

### `mapInstance`
- **Valor:** Instância do Google Maps
- **Uso:** Permite controlar zoom programaticamente via `setZoom()`

### `draggingZoneId`
- **Quando ativa:** Durante arraste de marcador
- **Uso:** Bloqueia arraste do mapa (`gestureHandling: 'none'`)

## 📐 Cálculo de Zoom Ideal

```typescript
const calculateIdealZoom = useCallback((radiusMeters: number, mapHeight: number = 600): number => {
  const targetHeightFraction = 0.5; // 50% da altura
  const metersPerPixelAtZoom20 = 0.5; // Aproximado para latitude -23
  const targetPixels = mapHeight * targetHeightFraction;
  const diameterMeters = radiusMeters * 2;
  const requiredMetersPerPixel = diameterMeters / targetPixels;
  
  const zoom = 20 - Math.log2(requiredMetersPerPixel / metersPerPixelAtZoom20);
  return Math.max(1, Math.min(20, Math.round(zoom)));
}, []);
```

### Parâmetros:
- `radiusMeters`: Raio atual do círculo em metros
- `mapHeight`: Altura do mapa em pixels (padrão: 600px)

### Lógica:
1. Diâmetro = 2 × raio
2. Pixels desejados = 50% da altura do mapa
3. Metros por pixel necessário = diâmetro / pixels desejados
4. Zoom = 20 - log₂(metros_por_pixel / referência_zoom_20)
5. Limita entre 1 e 20

## 🎨 Experiência do Usuário

### Cenário 1: Editar Raio
1. Usuário clica na borda do círculo
2. `editingZoneId` → ID da zona
3. `userControlledZoom` → false (reset)
4. Usuário arrasta a borda
5. `onRadiusChanged` dispara a cada mudança
6. Zoom recalculado e aplicado automaticamente
7. Backend atualizado com novo raio
8. Ao soltar: `editingZoneId` → null

### Cenário 2: Mover Zona
1. Usuário clica no ponto central
2. `draggingZoneId` → ID da zona
3. `editingZoneId` → ID da zona
4. Mapa bloqueado (`gestureHandling: 'none'`)
5. `onDrag` atualiza `mapCenter` em tempo real
6. Zona se move, mapa acompanha
7. Ao soltar: geocoding reverso + update backend
8. `draggingZoneId` e `editingZoneId` → null

### Cenário 3: Zoom Manual
1. Usuário clica em +/- ou usa scroll
2. Listener `zoom_changed` detecta mudança
3. Se `!editingZoneId`: `userControlledZoom` → true
4. Zoom automático **desabilitado**
5. Próxima edição: reset e volta ao automático

## 🚀 Benefícios

✅ **Visibilidade constante:** Círculo sempre visível durante edição  
✅ **Navegação intuitiva:** Mapa segue o marcador durante arraste  
✅ **Controle do usuário:** Zoom manual preservado  
✅ **Sem conflitos:** Bloqueio de gestos durante operações  
✅ **Feedback automático:** Geocoding e toasts informativos  

## 📝 Notas Técnicas

- Zoom calculado para latitude ~-23° (Brasil)
- Altura do mapa padrão: 600px (altura do viewport menos header)
- Zoom limitado entre 1 (mundo) e 20 (rua)
- Geocoding reverso ao mover zona (atualiza endereço)
- Toast de feedback em todas as operações
