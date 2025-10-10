# Formato do Objeto Filters

## Visão Geral

O backend deve enviar um array de objetos `FilterMetadata` no campo `filters` do metadata da entidade.

## Estrutura Completa do Metadata

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",
    "tableFields": [...],
    "formFields": [...],
    "filters": [
      // ← AQUI VÃO OS FILTROS
      {
        "name": "name",
        "label": "Nome",
        "type": "text",
        "field": "name",
        "placeholder": "Buscar por nome..."
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "field": "status",
        "options": [
          { "value": "DRAFT", "label": "Rascunho" },
          { "value": "PUBLISHED", "label": "Publicado" },
          { "value": "CANCELLED", "label": "Cancelado" }
        ]
      }
    ],
    "pagination": {...}
  }
}
```

## Formato do Objeto FilterMetadata

### Interface TypeScript

```typescript
export interface FilterMetadata {
  name: string; // Nome do campo (usado como key nos filtros aplicados)
  label: string; // Label exibido no formulário
  type: FilterType; // Tipo do filtro: 'text' | 'select' | 'date' | 'number' | 'boolean' | 'entity'
  field: string; // Nome do campo no backend (pode ser nested: "city.name")
  placeholder?: string; // Placeholder para campos de texto
  options?: FilterOption[]; // Opções para select (obrigatório se type = 'select')
  entityConfig?: EntityFilterConfig; // Configuração para filtros de entidade
}

export interface FilterOption {
  value: string; // Valor enviado para o backend
  label: string; // Texto exibido no select
}

export interface EntityFilterConfig {
  entity: string; // Nome da entidade relacionada
  endpoint: string; // Endpoint para buscar dados
  labelField: string; // Campo usado como label
  valueField: string; // Campo usado como value
  renderType: "select" | "typeahead" | "autocomplete";
  searchable: boolean; // Se permite busca
  placeholder?: string;
}
```

## Exemplos por Tipo de Filtro

### 1️⃣ Filtro de Texto (type: "text")

```json
{
  "name": "name",
  "label": "Nome do Evento",
  "type": "text",
  "field": "name",
  "placeholder": "Digite o nome do evento..."
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Nome do Evento                  │
│ [Digite o nome do evento...  ] │
└─────────────────────────────────┘
```

**Filtro aplicado:**

```json
{
  "name": "Corrida"
}
```

**Query string enviada:**

```
GET /api/events?name=Corrida&page=0&size=10
```

---

### 2️⃣ Filtro de Select (type: "select")

```json
{
  "name": "status",
  "label": "Status",
  "type": "select",
  "field": "status",
  "placeholder": "Selecione o status",
  "options": [
    { "value": "DRAFT", "label": "Rascunho" },
    { "value": "PUBLISHED", "label": "Publicado" },
    { "value": "RUNNING", "label": "Em Andamento" },
    { "value": "FINISHED", "label": "Finalizado" },
    { "value": "CANCELLED", "label": "Cancelado" }
  ]
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Status                          │
│ [Selecione o status       ▼]   │
│   - Todos                       │
│   - Rascunho                    │
│   - Publicado                   │
│   - Em Andamento                │
│   - Finalizado                  │
│   - Cancelado                   │
└─────────────────────────────────┘
```

**Filtro aplicado:**

```json
{
  "status": "PUBLISHED"
}
```

**Query string enviada:**

```
GET /api/events?status=PUBLISHED&page=0&size=10
```

---

### 3️⃣ Filtro de Número (type: "number")

```json
{
  "name": "maxParticipants",
  "label": "Máximo de Participantes",
  "type": "number",
  "field": "maxParticipants",
  "placeholder": "Ex: 100"
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Máximo de Participantes         │
│ [Ex: 100                      ] │
└─────────────────────────────────┘
```

**Filtro aplicado:**

```json
{
  "maxParticipants": "100"
}
```

---

### 4️⃣ Filtro de Data (type: "date")

```json
{
  "name": "startDate",
  "label": "Data de Início",
  "type": "date",
  "field": "startDate",
  "placeholder": "Selecione a data"
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Data de Início                  │
│ [📅 01/11/2025              ] │
└─────────────────────────────────┘
```

**Filtro aplicado:**

```json
{
  "startDate": "2025-11-01"
}
```

---

### 5️⃣ Filtro de Boolean (type: "boolean")

```json
{
  "name": "active",
  "label": "Ativo",
  "type": "boolean",
  "field": "active"
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Ativo                           │
│ [Selecione            ▼]        │
│   - Todos                       │
│   - Sim                         │
│   - Não                         │
└─────────────────────────────────┘
```

**Filtro aplicado:**

```json
{
  "active": "true"
}
```

---

### 6️⃣ Filtro de Entidade com Select (type: "entity")

```json
{
  "name": "cityId",
  "label": "Cidade",
  "type": "entity",
  "field": "city.id",
  "entityConfig": {
    "entity": "city",
    "endpoint": "/api/cities",
    "labelField": "name",
    "valueField": "id",
    "renderType": "select",
    "searchable": false
  }
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Cidade                          │
│ [Selecione a cidade       ▼]   │
│   - Todas                       │
│   - São Paulo                   │
│   - Rio de Janeiro              │
│   - Belo Horizonte              │
└─────────────────────────────────┘
```

**Carrega dados de:**

```
GET /api/cities
```

**Resposta esperada:**

```json
[
  { "id": 1, "name": "São Paulo" },
  { "id": 2, "name": "Rio de Janeiro" },
  { "id": 3, "name": "Belo Horizonte" }
]
```

**Filtro aplicado:**

```json
{
  "cityId": "1"
}
```

**Query string enviada:**

```
GET /api/events?cityId=1&page=0&size=10
```

---

### 7️⃣ Filtro de Entidade com Typeahead (type: "entity")

```json
{
  "name": "organizerId",
  "label": "Organizador",
  "type": "entity",
  "field": "organizer.id",
  "entityConfig": {
    "entity": "organizer",
    "endpoint": "/api/organizers",
    "labelField": "name",
    "valueField": "id",
    "renderType": "typeahead",
    "searchable": true,
    "placeholder": "Digite para buscar..."
  }
}
```

**Renderiza:**

```
┌─────────────────────────────────┐
│ Organizador                     │
│ [Digite para buscar...      🔍] │
│                                 │
│ Resultados:                     │
│ ☑ Corridas da Serra             │
│ ☐ Eventos Esportivos SP         │
│ ☐ Maratonas Brasil              │
└─────────────────────────────────┘
```

**Busca com:**

```
GET /api/organizers?search=corrida
```

**Resposta esperada:**

```json
[
  { "id": 1, "name": "Corridas da Serra" },
  { "id": 5, "name": "Corrida Trail SP" }
]
```

**Filtro aplicado:**

```json
{
  "organizerId": "1"
}
```

## Exemplo Completo: Formulário de Filtros de Eventos

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",
    "filters": [
      {
        "name": "name",
        "label": "Nome",
        "type": "text",
        "field": "name",
        "placeholder": "Buscar por nome..."
      },
      {
        "name": "slug",
        "label": "URL Amigável",
        "type": "text",
        "field": "slug",
        "placeholder": "Buscar por URL..."
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "field": "status",
        "options": [
          { "value": "DRAFT", "label": "Rascunho" },
          { "value": "PUBLISHED", "label": "Publicado" },
          { "value": "RUNNING", "label": "Em Andamento" },
          { "value": "FINISHED", "label": "Finalizado" },
          { "value": "CANCELLED", "label": "Cancelado" }
        ]
      },
      {
        "name": "eventType",
        "label": "Tipo de Evento",
        "type": "select",
        "field": "eventType",
        "options": [
          { "value": "RUNNING", "label": "Corrida" },
          { "value": "WALKING", "label": "Caminhada" },
          { "value": "CYCLING", "label": "Ciclismo" },
          { "value": "TRIATHLON", "label": "Triathlon" }
        ]
      },
      {
        "name": "cityId",
        "label": "Cidade",
        "type": "entity",
        "field": "city.id",
        "entityConfig": {
          "entity": "city",
          "endpoint": "/api/cities",
          "labelField": "name",
          "valueField": "id",
          "renderType": "typeahead",
          "searchable": true,
          "placeholder": "Digite o nome da cidade..."
        }
      },
      {
        "name": "startDate",
        "label": "Data de Início",
        "type": "date",
        "field": "startDate"
      },
      {
        "name": "minPrice",
        "label": "Preço Mínimo",
        "type": "number",
        "field": "price",
        "placeholder": "R$ 0,00"
      },
      {
        "name": "hasVacancies",
        "label": "Com Vagas",
        "type": "boolean",
        "field": "hasVacancies"
      }
    ]
  }
}
```

## Como o Frontend Renderiza

Com o JSON acima, o frontend renderiza automaticamente:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Filtros                                                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│ │ Nome       │ │ URL Amigável│ │ Status     │ │ Tipo Evento│   │
│ │ [_______]  │ │ [_______]  │ │ [▼ Todos ] │ │ [▼ Todos ] │   │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                 │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│ │ Cidade     │ │ Data Início│ │ Preço Min  │ │ Com Vagas  │   │
│ │ [🔍______] │ │ [📅______] │ │ [R$ 0,00 ] │ │ [▼ Todos ] │   │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                 │
│ [🔄 Limpar Filtros]                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Estados de Filtro

### Sem Filtros Aplicados

```json
{}
```

### Com Filtros Aplicados

```json
{
  "name": "Corrida",
  "status": "PUBLISHED",
  "cityId": "1",
  "startDate": "2025-11-01",
  "hasVacancies": "true"
}
```

### Query String Gerada

```
GET /api/events?name=Corrida&status=PUBLISHED&cityId=1&startDate=2025-11-01&hasVacancies=true&page=0&size=10
```

## Implementação Backend (Java/Spring Boot)

### 1. DTO para FilterMetadata

```java
@Data
@Builder
public class FilterMetadata {
    private String name;
    private String label;
    private String type;  // "text", "select", "date", "number", "boolean", "entity"
    private String field;
    private String placeholder;
    private List<FilterOption> options;
    private EntityFilterConfig entityConfig;
}

@Data
@Builder
public class FilterOption {
    private String value;
    private String label;
}

@Data
@Builder
public class EntityFilterConfig {
    private String entity;
    private String endpoint;
    private String labelField;
    private String valueField;
    private String renderType;  // "select", "typeahead", "autocomplete"
    private Boolean searchable;
    private String placeholder;
}
```

### 2. Criação dos Filtros

```java
@Service
public class EventMetadataService {

    public EntityMetadata getEventMetadata() {
        return EntityMetadata.builder()
            .name("event")
            .label("Eventos")
            .endpoint("/api/events")
            .tableFields(getTableFields())
            .formFields(getFormFields())
            .filters(getFilters())  // ← Aqui!
            .pagination(getPaginationConfig())
            .build();
    }

    private List<FilterMetadata> getFilters() {
        return Arrays.asList(
            // Filtro de texto - Nome
            FilterMetadata.builder()
                .name("name")
                .label("Nome")
                .type("text")
                .field("name")
                .placeholder("Buscar por nome...")
                .build(),

            // Filtro de select - Status
            FilterMetadata.builder()
                .name("status")
                .label("Status")
                .type("select")
                .field("status")
                .options(Arrays.asList(
                    FilterOption.builder().value("DRAFT").label("Rascunho").build(),
                    FilterOption.builder().value("PUBLISHED").label("Publicado").build(),
                    FilterOption.builder().value("RUNNING").label("Em Andamento").build(),
                    FilterOption.builder().value("FINISHED").label("Finalizado").build(),
                    FilterOption.builder().value("CANCELLED").label("Cancelado").build()
                ))
                .build(),

            // Filtro de entidade - Cidade (typeahead)
            FilterMetadata.builder()
                .name("cityId")
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
                    .placeholder("Digite o nome da cidade...")
                    .build())
                .build(),

            // Filtro de data
            FilterMetadata.builder()
                .name("startDate")
                .label("Data de Início")
                .type("date")
                .field("startDate")
                .build(),

            // Filtro boolean
            FilterMetadata.builder()
                .name("hasVacancies")
                .label("Com Vagas")
                .type("boolean")
                .field("hasVacancies")
                .build()
        );
    }
}
```

### 3. Aplicar Filtros na Query

```java
@RestController
@RequestMapping("/api/events")
public class EventController {

    @GetMapping
    public Page<Event> list(
        @RequestParam(required = false) String name,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Long cityId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) Boolean hasVacancies,
        Pageable pageable
    ) {
        Specification<Event> spec = Specification.where(null);

        // Filtro de nome (LIKE)
        if (name != null && !name.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%")
            );
        }

        // Filtro de status (EQUAL)
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("status"), EventStatus.valueOf(status))
            );
        }

        // Filtro de cidade (EQUAL na FK)
        if (cityId != null) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("city").get("id"), cityId)
            );
        }

        // Filtro de data (GREATER_THAN_OR_EQUAL)
        if (startDate != null) {
            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("startDate"), startDate)
            );
        }

        // Filtro boolean
        if (hasVacancies != null) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("hasVacancies"), hasVacancies)
            );
        }

        return eventRepository.findAll(spec, pageable);
    }
}
```

## Validação do JSON

Para testar se o JSON está correto, você pode usar este exemplo mínimo:

```json
{
  "filters": [
    {
      "name": "name",
      "label": "Nome",
      "type": "text",
      "field": "name"
    }
  ]
}
```

Se isso funcionar, o formulário de filtros aparecerá com um único campo de texto!

## Resumo

- ✅ `filters` deve ser um **array de objetos**
- ✅ Cada objeto deve ter: `name`, `label`, `type`, `field`
- ✅ Campos opcionais: `placeholder`, `options`, `entityConfig`
- ✅ Tipos disponíveis: `text`, `select`, `date`, `number`, `boolean`, `entity`
- ✅ Frontend renderiza automaticamente baseado no tipo
- ✅ Layout responsivo com CSS Grid (`auto-fit`, `minmax(250px, 1fr)`)
