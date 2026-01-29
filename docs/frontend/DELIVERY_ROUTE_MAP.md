# Mapa de Rotas de Entrega - Modo Visualização

## 📋 Resumo

Implementação de um mapa do Google Maps no modo visualização (view) do CRUD de deliveries, exibindo a rota entre origem e destino com zoom automático, distância e posição do motoboy (se disponível).

## 🎯 Funcionalidades

### DeliveryRouteMap Component
**Arquivo:** `src/components/Delivery/DeliveryRouteMap.tsx`

Componente dedicado para exibição de rotas de entrega com:

- ✅ **Marcador Verde**: Indica o ponto de origem
- ✅ **Marcador Vermelho**: Indica o ponto de destino  
- ✅ **Marcador Azul**: Mostra posição GPS do motoboy (quando disponível)
- ✅ **Linha Azul**: Conecta origem e destino (Polyline)
- ✅ **Distância**: Exibe distância calculada em km
- ✅ **Zoom Automático**: Ajusta para mostrar todos os pontos com padding maior (80px)
- ✅ **Legenda Completa**: Mostra endereços, distância e nome do motoboy
- ✅ **Margens Harmoniosas**: Padding de 32px e border-radius de 12px
- ✅ **Responsivo**: Altura configurável (padrão: 450px)

### Integração com EntityCRUD
**Arquivo:** `src/components/Generic/EntityCRUD.tsx`

Novas props para renderizar conteúdo customizado:

```tsx
beforeFormComponent?: (
  entityId: number | string | undefined, 
  viewMode: ViewMode
) => React.ReactNode;

afterFormComponent?: (
  entityId: number | string | undefined, 
  viewMode: ViewMode
) => React.ReactNode;
```

- **`beforeFormComponent`**: Renderiza conteúdo antes do formulário (fora do wrapper)
- **`afterFormComponent`**: Renderiza conteúdo depois do formulário (dentro do wrapper)

### DeliveryCRUDPage
**Arquivo:** `src/components/Delivery/DeliveryCRUDPage.tsx`

Implementação do `DeliveryMapWrapper`:
- Carrega dados da entrega via API quando estiver no modo `view`
- Extrai dados do campo `courier` (entidade User) que representa o motoboy
- Busca coordenadas GPS do motoboy nos campos `gpsLatitude` e `gpsLongitude`
- Renderiza o mapa apenas quando todos os dados estão disponíveis
- Não renderiza em modos `create` ou `edit`

## 🗺️ Tecnologias Utilizadas

- **@react-google-maps/api**: Biblioteca React para Google Maps
  - `GoogleMap`: Componente principal do mapa
  - `LoadScript`: Gerencia carregamento da API do Google Maps
  - `Marker`: Marcadores de origem e destino
  - `Polyline`: Linha conectando os pontos

- **Google Maps API**: 
  - Geocoding (já existente)
  - Maps JavaScript API (novo)

## 📐 Estrutura Visual

```
┌─────────────────────────────────────────┐
│         Breadcrumb (Sticky)             │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   📋 Formulário (Readonly)        │ │
│  │   - Campos de visualização       │ │
│  │   - Dados da entrega             │ │
│  │                                   │ │
│  ├───────────────────────────────────┤ │
│  │          (margin-top: 2rem)       │ │
│  ├───────────────────────────────────┤ │
│  │                                   │ │
│  │     🗺️ Google Maps                │ │
│  │     - 🟢 Marcador verde (origem)  │ │
│  │     - 🔴 Marcador vermelho (dest) │ │
│  │     - 🔵 Marcador azul (motoboy)  │ │
│  │     - Linha azul conectando       │ │
│  │                                   │ │
│  ├───────────────────────────────────┤ │
│  │ 🟢 Origem: Endereço A            │ │
│  │ 🔴 Destino: Endereço B           │ │
│  ├───────────────────────────────────┤ │
│  │ 📏 Distância: 5.42 km            │ │
│  │ 🏍️ Motoboy: João Silva           │ │
│  │    🔵 Em rota                     │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Observação**: O mapa está dentro do `entity-crud-form-wrapper`, logo abaixo do formulário.

## 🎨 Estilos

**CSS Adicionado:** `EntityCRUD.css`

```css
/* Container para conteúdo antes do formulário */
.entity-crud-before-form {
  margin-bottom: 1.5rem;
}

/* Container para conteúdo depois do formulário */
.entity-crud-after-form {
  margin-top: 2rem;
}
```

- `.entity-crud-before-form`: Espaçamento de 1.5rem abaixo (para conteúdo antes do form)
- `.entity-crud-after-form`: Espaçamento de 2rem acima (para conteúdo dentro do wrapper, após o form)

## 🔧 Como Funciona

### 1. Modo View Ativado
Quando o usuário visualiza uma entrega existente:

```tsx
<EntityCRUD
  entityName="delivery"
  // ... outras props
  afterFormComponent={(entityId, viewMode) => (
    <DeliveryMapWrapper entityId={entityId} viewMode={viewMode} />
  )}
/>
```

**Importante**: Usando `afterFormComponent` o mapa aparece **dentro** do `entity-crud-form-wrapper`, logo **abaixo** do formulário.

### 2. Carregamento de Dados
`DeliveryMapWrapper` carrega os dados via API:

```tsx
const response = await api.get(`/api/deliveries/${entityId}`);
const data = response.data as {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  fromAddress?: string;
  toAddress?: string;
  distanceKm?: number;
  courier?: {
    id: number;
    name: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  };
};
```

### 3. Renderização do Mapa
Passa coordenadas para `DeliveryRouteMap`:

```tsx
<DeliveryRouteMap
  fromLatitude={data.fromLatitude}
  fromLongitude={data.fromLongitude}
  toLatitude={data.toLatitude}
  toLongitude={data.toLongitude}
  fromAddress={data.fromAddress}
  toAddress={data.toAddress}
  distance={data.distanceKm}
  deliveryManGpsLatitude={data.courier?.gpsLatitude}
  deliveryManGpsLongitude={data.courier?.gpsLongitude}
  deliveryManName={data.courier?.name}
  height="450px"
/>
```

### 4. Ajuste de Zoom
O mapa calcula bounds automaticamente:

```tsx
const bounds = new google.maps.LatLngBounds();
bounds.extend({ lat: fromLatitude, lng: fromLongitude });
bounds.extend({ lat: toLatitude, lng: toLongitude });

map.fitBounds(bounds, {
  top: 50, bottom: 50, left: 50, right: 50
});
```

## ✨ Benefícios

1. **Visualização Clara**: Usuários veem imediatamente a localização e distância
2. **Contexto Geográfico**: Mapa fornece contexto visual dos endereços
3. **Validação Visual**: Confirma que origem e destino estão corretos
4. **UX Profissional**: Interface moderna e intuitiva
5. **Reutilizável**: Padrão `beforeFormComponent` pode ser usado em outras entidades

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar rota real usando Directions API (ao invés de linha reta)
- [ ] Mostrar distância e tempo estimado na legenda
- [ ] Adicionar waypoints intermediários se houver
- [ ] Modo fullscreen para o mapa
- [ ] Exportar mapa como imagem/PDF

## 🐛 Tratamento de Erros

- Se API Key não estiver configurada: Mostra mensagem amigável
- Se coordenadas não existirem: Não renderiza o mapa
- Se carregar dados falhar: Log no console, mapa não é exibido
- Modos create/edit: Mapa não é renderizado

## 📝 Observações

- O mapa usa **linha reta** (Polyline) entre origem e destino
- Para rota real de estrada, seria necessário usar **Directions API**
- O componente é **otimizado** para evitar re-renders desnecessários
- Coordenadas continuam **ocultas** no formulário para todos os perfis
- Campo **`courier`** na entidade Delivery representa o motoboy (entidade User)
- Posição GPS do motoboy vem dos campos **`gpsLatitude`** e **`gpsLongitude`** do User
- Nome do motoboy é exibido no **tooltip** e na **legenda** do mapa

## ✅ Status

**Implementado e Funcional** ✨

Data: 23 de novembro de 2025
