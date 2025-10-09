# 🏗️ Arquitetura: Metadata-Driven Frontend

## 📐 Princípio Fundamental

**Backend controla 100% do comportamento. Frontend apenas renderiza.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Java/Spring)                        │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/metadata                                              │
│  ↓                                                               │
│  {                                                               │
│    "event": {                                                    │
│      "name": "event",                                            │
│      "label": "Eventos",                                         │
│      "endpoint": "/api/events",                                  │
│                                                                  │
│      "tableFields": [...],    // Colunas da tabela              │
│      "filters": [...],         // Filtros                       │
│                                                                  │
│      "formFields": [           // Campos do formulário          │
│        {                                                         │
│          "name": "eventType",                                    │
│          "label": "Esporte",                                     │
│          "type": "select",                                       │
│          "required": true,                                       │
│          "options": [          // ✅ JÁ TRADUZIDAS!             │
│            {"value": "RUNNING", "label": "Corrida"},            │
│            {"value": "CYCLING", "label": "Ciclismo"}            │
│          ]                                                       │
│        },                                                        │
│        {                                                         │
│          "name": "categories",                                   │
│          "label": "Categorias",                                  │
│          "type": "nested",     // ✅ Relacionamento 1:N         │
│          "relationship": {                                       │
│            "type": "ONE_TO_MANY",                                │
│            "fields": [...]     // Campos da categoria            │
│          }                                                       │
│        }                                                         │
│      ]                                                           │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Carregamento Inicial (App.tsx)                              │
│     └─> <MetadataProvider>                                      │
│         └─> MetadataContext.tsx                                 │
│             └─> Faz GET /api/metadata uma vez                   │
│             └─> Armazena tudo em memória                        │
│                                                                  │
│  2. Componentes Consomem Metadata                               │
│                                                                  │
│     ┌─────────────────────────────────────────┐                 │
│     │ EntityCRUD                              │                 │
│     │  entityName="event"                     │                 │
│     └─────────────────────────────────────────┘                 │
│                    ↓                                             │
│     ┌─────────────────────────────────────────┐                 │
│     │ useMetadata()                           │                 │
│     │  → getEntityMetadata("event")           │                 │
│     │  → Retorna metadata.get("event")        │                 │
│     └─────────────────────────────────────────┘                 │
│                    ↓                                             │
│     ┌─────────────────────────────────────────┐                 │
│     │ EntityTable                             │                 │
│     │  → Usa tableFields                      │                 │
│     │  → Usa filters                          │                 │
│     └─────────────────────────────────────────┘                 │
│                    ↓                                             │
│     ┌─────────────────────────────────────────┐                 │
│     │ useFormMetadata("event")                │                 │
│     │  → Converte formFields                  │                 │
│     │  → Detecta relacionamentos              │                 │
│     │  → Cria ArrayField para 1:N             │                 │
│     └─────────────────────────────────────────┘                 │
│                    ↓                                             │
│     ┌─────────────────────────────────────────┐                 │
│     │ EntityForm                              │                 │
│     │  → Renderiza campos dinamicamente       │                 │
│     │  → Select com options do backend        │                 │
│     │  → ArrayField para nested               │                 │
│     │  → Validações do backend                │                 │
│     └─────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

### 1️⃣ Carregamento Inicial (uma vez)

```tsx
// App.tsx
<MetadataProvider>
  <MetadataLoader>
    {/* Carrega /api/metadata antes de renderizar app */}
    <App />
  </MetadataLoader>
</MetadataProvider>
```

### 2️⃣ Componente Usa Metadata

```tsx
// EventsCRUDPage.tsx
const EventsCRUDPage = () => {
  return <EntityCRUD entityName="event" />;
};
```

### 3️⃣ EntityCRUD Busca Metadata

```tsx
// EntityCRUD.tsx
const { getEntityMetadata } = useMetadata();
const metadata = getEntityMetadata("event");
const formMetadata = useFormMetadata("event");

// Renderiza baseado no metadata:
<EntityTable metadata={metadata} />
<EntityForm metadata={formMetadata} />
```

## ✅ Vantagens da Arquitetura

### 1. **Uma Única Fonte de Verdade**

- Backend define tudo
- Frontend não tem lógica de negócio
- Mudanças no backend refletem automaticamente no frontend

### 2. **Zero Duplicação de Código**

```tsx
// ❌ ANTES: Uma página para cada entidade
const EventsListPage = () => {
  /* custom logic */
};
const EventsCreatePage = () => {
  /* custom logic */
};
const EventsEditPage = () => {
  /* custom logic */
};

// ✅ AGORA: Uma linha
const EventsCRUDPage = () => <EntityCRUD entityName="event" />;
```

### 3. **Traduções Centralizadas**

```json
// Backend: messages.properties
EventType.RUNNING=Corrida
EventType.CYCLING=Ciclismo

// Frontend: apenas renderiza
<option value="RUNNING">Corrida</option>
```

### 4. **Relacionamentos Automáticos**

```json
// Backend define relacionamento 1:N
{
  "name": "categories",
  "type": "nested",
  "relationship": {"type": "ONE_TO_MANY", "fields": [...]}
}

// Frontend detecta e renderiza ArrayField automaticamente
```

## 📦 Componentes Genéricos

### EntityCRUD

**Usa:** EntityTable + EntityForm + Navegação entre modos

```tsx
<EntityCRUD entityName="event" />
```

### EntityTable

**Usa:** metadata.tableFields + metadata.filters

```tsx
<EntityTable
  entityName="event"
  onView={(id) => {}}
  onEdit={(id) => {}}
  onDelete={(id) => {}}
/>
```

### EntityForm

**Usa:** formMetadata (convertido de metadata.formFields)

```tsx
<EntityForm metadata={formMetadata} entityId={123} onSuccess={(data) => {}} />
```

### ArrayField

**Auto-renderizado** para campos com `type: "nested"`

```tsx
// Automático quando formFields contém:
{
  "name": "categories",
  "type": "nested",
  "relationship": {"type": "ONE_TO_MANY"}
}
```

## 🎯 Quando Usar EntityCRUD

### ✅ Use EntityCRUD quando:

- Precisa de tela de listagem + criar/editar/visualizar
- Entidade tem metadata completo no backend
- Não precisa de comportamento muito customizado

### ⚠️ Use componentes separados quando:

- Precisa de fluxo customizado (ex: wizard multi-step)
- Precisa de validações complexas no frontend
- Precisa de layout muito diferente

## 📝 Exemplo Completo

### Backend: EventMetadataBuilder.java

```java
public EntityMetadata buildEventMetadata() {
    return EntityMetadata.builder()
        .name("event")
        .label("Eventos")
        .endpoint("/api/events")
        .tableFields(buildTableFields())
        .filters(buildFilters())
        .formFields(buildFormFields()) // ← Inclui relacionamentos!
        .build();
}

private List<FormField> buildFormFields() {
    List<FormField> fields = new ArrayList<>();

    // Campo enum com options traduzidas
    fields.add(FormField.builder()
        .name("eventType")
        .label("Esporte")
        .type("select")
        .required(true)
        .options(getEventTypeOptions()) // ← Traduzido!
        .build());

    // Relacionamento 1:N
    fields.add(FormField.builder()
        .name("categories")
        .label("Categorias")
        .type("nested")
        .relationship(Relationship.builder()
            .type("ONE_TO_MANY")
            .fields(getCategoryFields())
            .build())
        .build());

    return fields;
}
```

### Frontend: EventsCRUDPage.tsx

```tsx
import EntityCRUD from "../Generic/EntityCRUD";

const EventsCRUDPage: React.FC = () => {
  return <EntityCRUD entityName="event" />;
};

export default EventsCRUDPage;
```

**Pronto! Isso já traz:**

- ✅ Tabela com filtros
- ✅ Formulário com validações
- ✅ Enums traduzidos
- ✅ Relacionamentos (Evento → Categorias)
- ✅ Ações (visualizar, editar, excluir)

## 🚀 Próximos Passos

1. **Backend**: Implementar metadata completo para cada entidade
2. **Frontend**: Criar páginas CRUD com uma linha cada
3. **Testar**: Verificar se metadata está correto
4. **Iterar**: Adicionar customizações visuais se necessário
