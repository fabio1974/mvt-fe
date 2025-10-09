# ✅ Checklist: Backend Metadata para EntityCRUD

## 📋 O que o Backend Precisa Enviar

Para que o `EntityCRUD` funcione 100% sem código customizado no frontend, o backend precisa retornar um metadata completo em `/api/metadata`.

## 🎯 Estrutura Mínima Necessária

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",

    // Para EntityTable e EntityFilters
    "tableFields": [...],
    "filters": [...],

    // Para EntityForm
    "formFields": [...]
  }
}
```

---

## 1️⃣ tableFields (para EntityTable)

### ✅ Deve incluir:

- [x] `name`: nome do campo
- [x] `label`: texto traduzido
- [x] `type`: tipo do dado (string, date, number, boolean)
- [x] `visible`: true/false (se aparece na tabela)
- [x] `sortable`: true/false (opcional)
- [x] `searchable`: true/false (opcional)

### Exemplo:

```json
"tableFields": [
  {
    "name": "id",
    "label": "ID",
    "type": "number",
    "visible": true,
    "sortable": true
  },
  {
    "name": "name",
    "label": "Nome do Evento",
    "type": "string",
    "visible": true,
    "sortable": true,
    "searchable": true
  },
  {
    "name": "eventType",
    "label": "Esporte",
    "type": "string",
    "visible": true
  },
  {
    "name": "status",
    "label": "Status",
    "type": "string",
    "visible": true
  },
  {
    "name": "startDate",
    "label": "Data de Início",
    "type": "date",
    "visible": true,
    "sortable": true
  }
]
```

---

## 2️⃣ filters (para EntityFilters)

### ✅ Deve incluir:

- [x] `name`: nome do filtro (mesmo nome do campo)
- [x] `label`: texto traduzido
- [x] `type`: "text", "select", "date", "number", "entity"
- [x] `options`: array com value/label (para type="select")
- [x] `entityConfig`: config para filtros de entidade relacionada (opcional)

### Exemplo:

```json
"filters": [
  {
    "name": "name",
    "label": "Nome",
    "type": "text",
    "placeholder": "Buscar por nome..."
  },
  {
    "name": "eventType",
    "label": "Esporte",
    "type": "select",
    "options": [
      {"value": "RUNNING", "label": "Corrida"},
      {"value": "CYCLING", "label": "Ciclismo"},
      {"value": "SWIMMING", "label": "Natação"}
    ]
  },
  {
    "name": "status",
    "label": "Status",
    "type": "select",
    "options": [
      {"value": "DRAFT", "label": "Rascunho"},
      {"value": "PUBLISHED", "label": "Publicado"},
      {"value": "ACTIVE", "label": "Ativo"}
    ]
  },
  {
    "name": "organizationId",
    "label": "Organização",
    "type": "entity",
    "entityConfig": {
      "entityName": "organization",
      "endpoint": "/api/organizations",
      "displayField": "name",
      "valueField": "id",
      "renderAs": "select"
    }
  }
]
```

---

## 3️⃣ formFields (para EntityForm) - CRÍTICO! ⚠️

### ✅ Deve incluir:

- [x] `name`: nome do campo
- [x] `label`: texto traduzido
- [x] `type`: "text", "number", "select", "date", "textarea", "nested"
- [x] `required`: true/false
- [x] `options`: array com value/label (para type="select") **← TRADUZIDO!**
- [x] `validation`: regras de validação (min, max, pattern, etc)
- [x] `relationship`: config para relacionamentos (para type="nested")

### Exemplo Básico:

```json
"formFields": [
  {
    "name": "name",
    "label": "Nome do Evento",
    "type": "text",
    "required": true,
    "validation": {
      "minLength": 3,
      "maxLength": 100
    }
  },
  {
    "name": "eventType",
    "label": "Esporte",
    "type": "select",
    "required": true,
    "options": [
      {"value": "RUNNING", "label": "Corrida"},
      {"value": "CYCLING", "label": "Ciclismo"},
      {"value": "SWIMMING", "label": "Natação"},
      {"value": "TRIATHLON", "label": "Triathlon"}
    ]
  },
  {
    "name": "maxParticipants",
    "label": "Máximo de Participantes",
    "type": "number",
    "required": false,
    "validation": {
      "min": 1,
      "max": 10000
    }
  },
  {
    "name": "description",
    "label": "Descrição",
    "type": "textarea",
    "required": true,
    "validation": {
      "minLength": 10,
      "maxLength": 5000
    }
  },
  {
    "name": "startDate",
    "label": "Data de Início",
    "type": "date",
    "required": true
  }
]
```

### Exemplo com Relacionamento 1:N (Evento → Categorias):

```json
"formFields": [
  {
    "name": "name",
    "label": "Nome do Evento",
    "type": "text",
    "required": true
  },
  {
    "name": "categories",
    "label": "Categorias",
    "type": "nested",
    "required": false,
    "relationship": {
      "type": "ONE_TO_MANY",
      "fields": [
        {
          "name": "name",
          "label": "Nome da Categoria",
          "type": "text",
          "required": true
        },
        {
          "name": "distance",
          "label": "Distância (km)",
          "type": "number",
          "required": true,
          "validation": {
            "min": 0.1,
            "max": 500
          }
        },
        {
          "name": "registrationFee",
          "label": "Taxa de Inscrição",
          "type": "number",
          "required": true,
          "validation": {
            "min": 0
          }
        },
        {
          "name": "ageGroup",
          "label": "Faixa Etária",
          "type": "select",
          "required": true,
          "options": [
            {"value": "INFANTIL", "label": "Infantil (até 12 anos)"},
            {"value": "JUVENIL", "label": "Juvenil (13-17 anos)"},
            {"value": "ADULTO", "label": "Adulto (18-59 anos)"},
            {"value": "SENIOR", "label": "Senior (60+ anos)"}
          ]
        }
      ]
    }
  }
]
```

---

## 🎯 Regras Importantes

### 1. **Enums DEVEM vir traduzidos no backend**

❌ **ERRADO:**

```json
"options": [
  {"value": "RUNNING", "label": "RUNNING"}
]
```

✅ **CORRETO:**

```json
"options": [
  {"value": "RUNNING", "label": "Corrida"}
]
```

**Como fazer no backend:**

```java
// messages.properties
EventType.RUNNING=Corrida
EventType.CYCLING=Ciclismo
EventType.SWIMMING=Natação

// Java
List<OptionDTO> options = Arrays.stream(EventType.values())
    .map(type -> new OptionDTO(
        type.name(),
        messageSource.getMessage("EventType." + type.name(), null, locale)
    ))
    .collect(Collectors.toList());
```

### 2. **Relacionamentos 1:N devem usar `type: "nested"`**

✅ **CORRETO:**

```json
{
  "name": "categories",
  "type": "nested",
  "relationship": {
    "type": "ONE_TO_MANY",
    "fields": [...]  // ← Campos da entidade filha
  }
}
```

### 3. **Validações devem vir do backend**

✅ **CORRETO:**

```json
{
  "name": "email",
  "type": "text",
  "required": true,
  "validation": {
    "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    "message": "Email inválido"
  }
}
```

---

## 📝 Exemplo Completo: EventMetadataBuilder.java

```java
@Component
public class EventMetadataBuilder {

    @Autowired
    private MessageSource messageSource;

    public EntityMetadata build(Locale locale) {
        return EntityMetadata.builder()
            .name("event")
            .label(getMessage("entity.event.label", locale))
            .endpoint("/api/events")
            .tableFields(buildTableFields(locale))
            .filters(buildFilters(locale))
            .formFields(buildFormFields(locale))
            .pagination(PaginationConfig.builder()
                .defaultPageSize(10)
                .pageSizeOptions(Arrays.asList(5, 10, 20, 50))
                .build())
            .build();
    }

    private List<FieldMetadata> buildTableFields(Locale locale) {
        return Arrays.asList(
            field("id", "ID", "number", true),
            field("name", getMessage("event.name", locale), "string", true),
            field("eventType", getMessage("event.eventType", locale), "string", true),
            field("status", getMessage("event.status", locale), "string", true),
            field("startDate", getMessage("event.startDate", locale), "date", true)
        );
    }

    private List<FilterMetadata> buildFilters(Locale locale) {
        return Arrays.asList(
            textFilter("name", getMessage("event.name", locale)),
            selectFilter("eventType", getMessage("event.eventType", locale), getEventTypeOptions(locale)),
            selectFilter("status", getMessage("event.status", locale), getStatusOptions(locale))
        );
    }

    private List<FormFieldMetadata> buildFormFields(Locale locale) {
        List<FormFieldMetadata> fields = new ArrayList<>();

        // Campos básicos
        fields.add(textField("name", getMessage("event.name", locale), true, 3, 100));
        fields.add(selectField("eventType", getMessage("event.eventType", locale), true, getEventTypeOptions(locale)));
        fields.add(numberField("maxParticipants", getMessage("event.maxParticipants", locale), false, 1, 10000));
        fields.add(textareaField("description", getMessage("event.description", locale), true, 10, 5000));
        fields.add(dateField("startDate", getMessage("event.startDate", locale), true));

        // Relacionamento 1:N
        fields.add(nestedField("categories", getMessage("event.categories", locale), buildCategoryFields(locale)));

        return fields;
    }

    private List<FormFieldMetadata> buildCategoryFields(Locale locale) {
        return Arrays.asList(
            textField("name", getMessage("category.name", locale), true, 3, 50),
            numberField("distance", getMessage("category.distance", locale), true, 0.1, 500),
            numberField("registrationFee", getMessage("category.registrationFee", locale), true, 0, null),
            selectField("ageGroup", getMessage("category.ageGroup", locale), true, getAgeGroupOptions(locale))
        );
    }

    private List<OptionDTO> getEventTypeOptions(Locale locale) {
        return Arrays.stream(EventType.values())
            .map(type -> new OptionDTO(
                type.name(),
                getMessage("EventType." + type.name(), locale)
            ))
            .collect(Collectors.toList());
    }

    private List<OptionDTO> getStatusOptions(Locale locale) {
        return Arrays.stream(EventStatus.values())
            .map(status -> new OptionDTO(
                status.name(),
                getMessage("EventStatus." + status.name(), locale)
            ))
            .collect(Collectors.toList());
    }

    private String getMessage(String key, Locale locale) {
        return messageSource.getMessage(key, null, locale);
    }
}
```

---

## ✅ Checklist de Implementação

### Backend deve implementar:

- [ ] Endpoint `/api/metadata` retornando todas as entidades
- [ ] `tableFields` com campos visíveis na tabela
- [ ] `filters` com tipos corretos (text, select, date, entity)
- [ ] `formFields` com todos os campos do formulário
- [ ] Enums traduzidos em `options: [{value, label}]`
- [ ] Relacionamentos 1:N com `type: "nested"` e `relationship.fields`
- [ ] Validações em `validation: {min, max, pattern, etc}`
- [ ] Locale/i18n para todas as labels

### Frontend já tem pronto:

- [x] `MetadataContext` carrega `/api/metadata`
- [x] `useMetadata()` hook para acessar metadata
- [x] `useFormMetadata()` converte para formulário
- [x] `EntityCRUD` componente completo
- [x] `EntityTable` renderiza tabela
- [x] `EntityFilters` renderiza filtros
- [x] `EntityForm` renderiza formulário
- [x] `ArrayField` renderiza relacionamentos 1:N

---

## 🚀 Próximos Passos

1. **Backend**: Implementar MetadataBuilder para cada entidade
2. **Backend**: Garantir traduções em messages.properties
3. **Frontend**: Criar página com `<EntityCRUD entityName="..." />`
4. **Testar**: Verificar se tudo funciona sem código customizado
5. **Iterar**: Adicionar customizações visuais se necessário (badges, cores, etc)
