# Backend: Especificação Completa do Metadata (Tabelas + Formulários)

## Problema Atual

O backend está retornando apenas metadata para **tabelas/listagem**:

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",
    "fields": [...],  // Campos para exibição em tabela
    "filters": [...], // Filtros da tabela
    "pagination": {...}
  }
}
```

Mas para **formulários**, precisamos de metadata com estrutura de **relacionamentos**.

## ✅ Solução Recomendada: Metadata Unificado

### Enviar tudo no mesmo endpoint `/api/metadata`

**Vantagens:**

- ✅ Uma única requisição carrega tudo
- ✅ Melhor performance (menos chamadas HTTP)
- ✅ Frontend mais simples (um único hook `useMetadata`)
- ✅ Dados sempre sincronizados (tabela e formulário usam o mesmo metadata)
- ✅ Cache mais eficiente

### Estrutura Completa do Metadata (Tabelas + Formulários)

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",

    // ===== METADATA PARA TABELAS (já existe) =====
    "tableFields": [
      {
        "name": "name",
        "label": "Nome do Evento",
        "type": "string",
        "sortable": true,
        "searchable": true,
        "visible": true,
        "width": 200,
        "align": "left"
      },
      {
        "name": "eventDate",
        "label": "Data",
        "type": "date",
        "sortable": true,
        "visible": true,
        "format": "dd/MM/yyyy"
      }
      // ... outros campos da tabela
    ],
    "filters": [...],  // Filtros da tabela
    "pagination": {...},

    // ===== METADATA PARA FORMULÁRIOS (adicionar) =====
    "formFields": [
      {
        "name": "name",
        "label": "Nome do Evento",
        "type": "string",
        "required": true,
        "placeholder": "Digite o nome do evento",
        "minLength": 3,
        "maxLength": 200
      },
      {
        "name": "eventDate",
        "label": "Data do Evento",
        "type": "date",
        "required": true
      },
      {
        "name": "eventType",
        "label": "Esporte",
        "type": "select",
        "required": true,
        "options": [
          {"value": "RUNNING", "label": "Corrida"},
          {"value": "CYCLING", "label": "Ciclismo"},
          {"value": "TRIATHLON", "label": "Triatlo"}
        ]
      },
      {
        "name": "categories",
        "label": "Categorias do Evento",
        "type": "nested",
        "required": false,
        "relationship": {
          "type": "ONE_TO_MANY",
          "targetEntity": "eventCategory",
          "fields": [
            {
              "name": "name",
              "label": "Nome da Categoria",
              "type": "string",
              "required": true
            },
            {
              "name": "gender",
              "label": "Gênero",
              "type": "select",
              "required": true,
              "options": [
                {"value": "MALE", "label": "Masculino"},
                {"value": "FEMALE", "label": "Feminino"},
                {"value": "MIXED", "label": "Misto"},
                {"value": "OTHER", "label": "Outro"}
              ]
            },
            {
              "name": "minAge",
              "label": "Idade Mínima",
              "type": "number",
              "required": true,
              "min": 0,
              "max": 120
            },
            {
              "name": "maxAge",
              "label": "Idade Máxima",
              "type": "number",
              "required": false,
              "min": 0,
              "max": 120
            },
            {
              "name": "price",
              "label": "Preço (R$)",
              "type": "number",
              "required": true,
              "min": 0
            },
            {
              "name": "maxParticipants",
              "label": "Máximo de Participantes",
              "type": "number",
              "required": false,
              "min": 1
            },
            {
              "name": "distance",
              "label": "Distância",
              "type": "number",
              "required": false
            },
            {
              "name": "distanceUnit",
              "label": "Unidade",
              "type": "select",
              "required": false,
              "options": [
                {"value": "KM", "label": "Quilômetros"},
                {"value": "MILES", "label": "Milhas"},
                {"value": "METERS", "label": "Metros"}
              ]
            },
            {
              "name": "description",
              "label": "Descrição",
              "type": "text",
              "required": false
            }
          ]
        }
      }
    ]
  }
}
```

## Diferenças Entre tableFields e formFields

### `tableFields` (para EntityTable - já existe)

- Foco em **exibição** de dados em listagem
- Propriedades: `sortable`, `searchable`, `visible`, `width`, `align`, `format`
- **Não precisa** de validações
- **Não precisa** de relacionamentos detalhados
- Campos simplificados (ex: `event.name` em vez de objeto completo)

### `formFields` (para EntityForm - adicionar)

- Foco em **criação/edição** de dados
- Propriedades: `required`, `placeholder`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `defaultValue`
- **TEM** validações completas
- **TEM** relacionamentos detalhados (`type: "nested"` + `relationship`)
- **TEM** `options` para todos os selects/enums
- Campos completos com todas as informações necessárias

## Como Implementar no Backend

### 1. Criar `FormMetadataExtractor`

Similar ao extrator atual, mas focado em formulários:

```java
@Component
public class FormMetadataExtractor {

    public Map<String, FormEntityMetadata> extractAll() {
        Map<String, FormEntityMetadata> metadata = new HashMap<>();

        // Para cada entidade
        metadata.put("event", extractEventFormMetadata());
        metadata.put("eventCategory", extractEventCategoryFormMetadata());
        // ... outras entidades

        return metadata;
    }

    private FormEntityMetadata extractEventFormMetadata() {
        FormEntityMetadata meta = new FormEntityMetadata();
        meta.setName("event");
        meta.setLabel("Eventos");
        meta.setEndpoint("/api/events");

        List<FormFieldMetadata> fields = new ArrayList<>();

        // Campos simples
        fields.add(createTextField("name", "Nome do Evento", true, 3, 200));
        fields.add(createDateField("eventDate", "Data do Evento", true));
        fields.add(createSelectField("eventType", "Esporte", true, getEventTypeOptions()));

        // Campo com relacionamento 1:N
        fields.add(createNestedField("categories", "Categorias do Evento",
                                     "ONE_TO_MANY", extractCategoryFields()));

        meta.setFields(fields);
        return meta;
    }

    private FormFieldMetadata createNestedField(String name, String label,
                                                String relType, List<FormFieldMetadata> nestedFields) {
        FormFieldMetadata field = new FormFieldMetadata();
        field.setName(name);
        field.setLabel(label);
        field.setType("nested");
        field.setRequired(false);

        RelationshipMetadata relationship = new RelationshipMetadata();
        relationship.setType(relType);
        relationship.setFields(nestedFields);

        field.setRelationship(relationship);
        return field;
    }

    private List<FormFieldMetadata> extractCategoryFields() {
        List<FormFieldMetadata> fields = new ArrayList<>();

        fields.add(createTextField("name", "Nome da Categoria", true, 1, 100));
        fields.add(createSelectField("gender", "Gênero", true, getGenderOptions()));
        fields.add(createNumberField("minAge", "Idade Mínima", true, 0, 120));
        fields.add(createNumberField("maxAge", "Idade Máxima", false, 0, 120));
        fields.add(createNumberField("price", "Preço (R$)", true, 0, null));
        fields.add(createNumberField("maxParticipants", "Máximo de Participantes", false, 1, null));
        fields.add(createNumberField("distance", "Distância", false, null, null));
        fields.add(createSelectField("distanceUnit", "Unidade", false, getDistanceUnitOptions()));
        fields.add(createTextField("description", "Descrição", false, null, null));

        return fields;
    }

    private List<OptionMetadata> getGenderOptions() {
        return Arrays.asList(
            new OptionMetadata("MALE", "Masculino"),
            new OptionMetadata("FEMALE", "Feminino"),
            new OptionMetadata("MIXED", "Misto"),
            new OptionMetadata("OTHER", "Outro")
        );
    }
}
```

### 2. Criar Controller

```java
@RestController
@RequestMapping("/api/metadata")
public class FormMetadataController {

    @Autowired
    private FormMetadataExtractor extractor;

    @GetMapping("/forms")
    public Map<String, FormEntityMetadata> getAllFormMetadata() {
        return extractor.extractAll();
    }

    @GetMapping("/forms/{entityName}")
    public FormEntityMetadata getFormMetadata(@PathVariable String entityName) {
        return extractor.extractAll().get(entityName);
    }
}
```

## No Frontend

### O que precisa mudar

#### 1. Atualizar type `EntityMetadata`

```typescript
// src/types/metadata.ts
export interface EntityMetadata {
  name: string;
  label: string;
  endpoint: string;

  // Para tabelas (já existe)
  tableFields?: FieldMetadata[]; // Renomear 'fields' para 'tableFields'
  filters?: FilterMetadata[];
  pagination?: PaginationConfig;

  // Para formulários (adicionar)
  formFields?: FormFieldMetadata[];
}
```

#### 2. Atualizar `useFormMetadata` para usar `formFields`

```typescript
export function useFormMetadata(entityName: string) {
  const { metadata, isLoading, error } = useMetadata();

  const formMetadata = useMemo(() => {
    if (isLoading || error) return null;

    const entityMetadata = metadata.get(entityName);
    if (!entityMetadata || !entityMetadata.formFields) {
      return null;
    }

    // Usar formFields diretamente do backend
    return convertFormFieldsToFormMetadata(entityMetadata);
  }, [metadata, entityName, isLoading, error]);

  return { formMetadata, isLoading, error };
}
```

#### 3. Atualizar `EntityTable` para usar `tableFields`

```typescript
// Mudar de entityMetadata.fields para entityMetadata.tableFields
const columns = entityMetadata.tableFields || [];
```

## Resumo

### O que o backend precisa fazer:

1. **Adicionar campo `formFields` ao metadata existente** (no mesmo endpoint `/api/metadata`)
2. **Manter `tableFields`** (renomear o atual `fields` para `tableFields`)
3. **Em `formFields`, incluir:**
   - ✅ Todos os campos editáveis da entidade
   - ✅ Propriedades de validação (`required`, `min`, `max`, `minLength`, `maxLength`, `pattern`)
   - ✅ `options` para todos os campos enum/select
   - ✅ Campos `type: "nested"` com `relationship` para relacionamentos 1:N
   - ✅ Dentro de `relationship.fields`, incluir todos os campos da entidade relacionada

### Exemplo de resposta completa:

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",

    "tableFields": [
      // Campos para exibição em tabela (já existe)
    ],

    "formFields": [
      // Campos simples
      {"name": "name", "type": "string", "required": true},
      {"name": "eventType", "type": "select", "options": [...]},

      // Campo nested (relacionamento 1:N)
      {
        "name": "categories",
        "type": "nested",
        "relationship": {
          "type": "ONE_TO_MANY",
          "fields": [
            {"name": "name", "type": "string", "required": true},
            {"name": "gender", "type": "select", "options": [...]},
            // ... outros campos da categoria
          ]
        }
      }
    ],

    "filters": [...],
    "pagination": {...}
  }
}
```

### O frontend já está pronto para:

- ✅ Detectar campos `type: "nested"` com `relationship`
- ✅ Converter `relationship.fields` em formulários ArrayField
- ✅ Renderizar selects com `options`
- ✅ Suportar múltiplos formulários filhos (1:N)
- ✅ Validações de campos

### Próximos passos:

1. **Backend:** Adicionar `formFields` ao metadata (manter `tableFields`)
2. **Frontend:** Atualizar types e usar `formFields` em vez de converter `tableFields`
3. **Testar:** Criação/edição de eventos com categorias
