# Problema: Filtros Null no Metadata

## Diagnóstico

O formulário de filtros não aparece quando o backend envia `filters: null` no metadata da entidade.

### Logs do Console

```javascript
metadata: {
  name: 'event',
  label: 'Eventos',
  endpoint: '/api/events',
  fields: null,
  tableFields: [...],
  formFields: [...],
  filters: null,  // ← PROBLEMA: Backend envia null
  pagination: {...}
}
```

## Causa Raiz

O backend está enviando `filters: null` quando não há filtros configurados para a entidade, mas o frontend esperava um **array vazio** `[]`.

## Solução Implementada

### 1. Normalização no Frontend

Adicionamos normalização para garantir que `filters` seja sempre um array:

```typescript
// EntityTable.tsx
const normalizedMetadata = {
  ...entityMetadata,
  filters: entityMetadata.filters || [], // null → []
};
```

### 2. Tipo Atualizado

Atualizamos o tipo `EntityMetadata` para aceitar `null`:

```typescript
// metadata.ts
export interface EntityMetadata {
  // ...
  filters?: FilterMetadata[] | null; // Aceita null do backend
  pagination?: PaginationConfig | null;
}
```

### 3. Renderização Condicional Simplificada

```typescript
{
  metadata.filters && metadata.filters.length > 0 && (
    <EntityFilters
      filters={metadata.filters}
      values={filters}
      onChange={handleFilterChange}
      onClear={clearFilters}
    />
  );
}
```

## Como Configurar Filtros no Backend

Para que os filtros apareçam, o backend precisa configurá-los no metadata da entidade.

### Exemplo Java (Spring Boot)

```java
@Service
public class EventMetadataService {

    public EntityMetadata getMetadata() {
        return EntityMetadata.builder()
            .name("event")
            .label("Eventos")
            .endpoint("/api/events")
            .tableFields(getTableFields())
            .formFields(getFormFields())
            .filters(getFilters())  // ← Adicionar filtros aqui
            .pagination(getPaginationConfig())
            .build();
    }

    private List<FilterMetadata> getFilters() {
        return Arrays.asList(
            // Filtro de texto
            FilterMetadata.builder()
                .name("name")
                .label("Nome")
                .type("text")
                .field("name")
                .placeholder("Buscar por nome...")
                .build(),

            // Filtro de select
            FilterMetadata.builder()
                .name("status")
                .label("Status")
                .type("select")
                .field("status")
                .options(Arrays.asList(
                    new FilterOption("DRAFT", "Rascunho"),
                    new FilterOption("PUBLISHED", "Publicado"),
                    new FilterOption("CANCELLED", "Cancelado")
                ))
                .build(),

            // Filtro de entidade relacionada
            FilterMetadata.builder()
                .name("city")
                .label("Cidade")
                .type("entity")
                .field("city.id")
                .entityConfig(EntityFilterConfig.builder()
                    .entity("city")
                    .endpoint("/api/cities")
                    .labelField("name")
                    .valueField("id")
                    .renderType("typeahead")
                    .searchable(true)
                    .build())
                .build()
        );
    }
}
```

### Tipos de Filtros Disponíveis

#### 1. **Filtro de Texto** (`type: "text"`)

```java
FilterMetadata.builder()
    .name("name")
    .label("Nome")
    .type("text")
    .field("name")
    .placeholder("Buscar por nome...")
    .build()
```

Gera:

```
┌─────────────────────────────────┐
│ Nome                            │
│ [Buscar por nome...          ] │
└─────────────────────────────────┘
```

#### 2. **Filtro de Select** (`type: "select"`)

```java
FilterMetadata.builder()
    .name("status")
    .label("Status")
    .type("select")
    .field("status")
    .options(Arrays.asList(
        new FilterOption("DRAFT", "Rascunho"),
        new FilterOption("PUBLISHED", "Publicado")
    ))
    .build()
```

Gera:

```
┌─────────────────────────────────┐
│ Status                          │
│ [Todos          ▼]              │
│   - Rascunho                    │
│   - Publicado                   │
└─────────────────────────────────┘
```

#### 3. **Filtro de Data** (`type: "date"`)

```java
FilterMetadata.builder()
    .name("eventDate")
    .label("Data do Evento")
    .type("date")
    .field("startDate")
    .build()
```

#### 4. **Filtro de Entidade** (`type: "entity"`)

```java
FilterMetadata.builder()
    .name("city")
    .label("Cidade")
    .type("entity")
    .field("city.id")
    .entityConfig(EntityFilterConfig.builder()
        .entity("city")
        .endpoint("/api/cities")
        .labelField("name")
        .valueField("id")
        .renderType("typeahead")  // ou "select"
        .searchable(true)
        .build())
    .build()
```

Gera (com typeahead):

```
┌─────────────────────────────────┐
│ Cidade                          │
│ [Digite para buscar...      🔍] │
│   Resultados:                   │
│   - São Paulo                   │
│   - Rio de Janeiro              │
└─────────────────────────────────┘
```

## Comportamento do Frontend

### Quando `filters: null` ou `[]`

- ❌ **Formulário de filtros NÃO aparece**
- ✅ Tabela funciona normalmente
- ✅ Não causa erros

### Quando `filters: [...]` com itens

- ✅ **Formulário de filtros APARECE**
- ✅ Layout responsivo com CSS Grid
- ✅ Campos se adaptam ao tamanho da tela

## Layout Responsivo dos Filtros

```css
display: grid;
gridtemplatecolumns: repeat(auto-fit, minmax(250px, 1fr));
gap: 16px;
```

- **Telas grandes**: 4-5 filtros por linha
- **Telas médias**: 2-3 filtros por linha
- **Telas pequenas**: 1 filtro por linha
- **Largura mínima**: 250px por campo

## Exemplo Visual

### Com Filtros Configurados

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Filtros                                          │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Nome     │ │ Status   │ │ Cidade   │ │ Data     ││
│ │ [____  ] │ │ [▼ Todos]│ │ [🔍___  ]│ │ [📅___  ]││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                     │
│ [🔄 Limpar Filtros]                                 │
└─────────────────────────────────────────────────────┘
```

### Sem Filtros (filters: null)

```
┌─────────────────────────────────────────────────────┐
│ 📊 Tabela de Eventos                                │
├─────────────────────────────────────────────────────┤
│ (filtros não aparecem)                              │
│                                                     │
│ Nome        │ Status     │ Data       │ Ações      │
│ ───────────────────────────────────────────────────│
│ Evento 1    │ Publicado  │ 10/10/2025 │ [👁️ ✏️ 🗑️] │
│ Evento 2    │ Rascunho   │ 15/10/2025 │ [👁️ ✏️ 🗑️] │
└─────────────────────────────────────────────────────┘
```

## Checklist Backend

Para adicionar filtros em uma entidade:

- [ ] Criar lista de `FilterMetadata` no método de metadata
- [ ] Definir `name`, `label`, `type`, `field` para cada filtro
- [ ] Adicionar `options` para filtros do tipo `select`
- [ ] Configurar `entityConfig` para filtros de entidade relacionada
- [ ] Retornar a lista no campo `filters` do metadata
- [ ] Implementar a lógica de filtragem no backend (query)

## Query no Backend

O backend deve aplicar os filtros recebidos na query:

```java
@GetMapping
public Page<Event> list(
    @RequestParam(required = false) String name,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) Long cityId,
    Pageable pageable
) {
    Specification<Event> spec = Specification.where(null);

    if (name != null && !name.isEmpty()) {
        spec = spec.and((root, query, cb) ->
            cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%")
        );
    }

    if (status != null && !status.isEmpty()) {
        spec = spec.and((root, query, cb) ->
            cb.equal(root.get("status"), EventStatus.valueOf(status))
        );
    }

    if (cityId != null) {
        spec = spec.and((root, query, cb) ->
            cb.equal(root.get("city").get("id"), cityId)
        );
    }

    return eventRepository.findAll(spec, pageable);
}
```

## Arquivos Modificados

- ✅ `src/components/Generic/EntityTable.tsx` - Normalização de filters null
- ✅ `src/types/metadata.ts` - Tipo aceita filters opcional/null
- ✅ `src/components/Generic/EntityFilters.tsx` - Layout responsivo

## Documentação Relacionada

- 📄 `METADATA_FORMAT_V2.md` - Formato completo do metadata
- 📄 `CSS_GRID_LAYOUT.md` - Sistema de layout responsivo
- 📄 `RESPONSIVE_FORM_LAYOUT.md` - Layout de formulários
