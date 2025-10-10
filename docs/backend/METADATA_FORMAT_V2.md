# Metadata Format V2 - Separação de Campos de Tabela e Formulário

## Visão Geral

O backend agora envia metadata em um novo formato que separa os campos usados em tabelas dos campos usados em formulários.

## Estrutura Antiga (V1)

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "fields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      ...
    }
  ],
  "filters": [...],
  "pagination": {...}
}
```

## Estrutura Nova (V2)

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "fields": null,              // ← Deprecated, usar tableFields
  "tableFields": [             // ← Campos para exibição em tabelas
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "width": 200,
      "sortable": true,
      "visible": true,
      ...
    }
  ],
  "formFields": [              // ← Campos para formulários (com nested, validações)
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "width": 200,
      "required": true,
      ...
    },
    {
      "name": "categories",    // ← Campos nested só aparecem em formFields
      "label": "Categorias",
      "type": "nested",
      "relationship": {
        "type": "ONE_TO_MANY",
        "targetEntity": "eventCategory",
        "fields": [...]
      }
    }
  ],
  "filters": [...],
  "pagination": {...}
}
```

## Diferenças Entre `tableFields` e `formFields`

### `tableFields`

- Usados em **EntityTable** para renderizar colunas
- Contém apenas campos primitivos (string, number, date, boolean, select)
- **NÃO** contém campos de relacionamento (nested)
- Foco em `sortable`, `searchable`, `visible`, `align`, `width`

### `formFields`

- Usados em **EntityForm** para renderizar formulários
- Contém todos os campos, incluindo **relacionamentos** (type: "nested")
- Foco em validações: `required`, `min`, `max`, `pattern`, `placeholder`
- Pode ter campos com `relationship` para arrays (ONE_TO_MANY)

## Compatibilidade Retroativa

O frontend suporta ambos os formatos:

### EntityTable

```typescript
const fieldsSource =
  metadata.tableFields && Array.isArray(metadata.tableFields)
    ? metadata.tableFields // Usa novo formato
    : metadata.fields; // Fallback para formato antigo
```

### EntityForm / metadataConverter

```typescript
const sourceFields =
  entityMetadata.formFields && entityMetadata.formFields.length > 0
    ? entityMetadata.formFields // Usa novo formato
    : entityMetadata.fields || []; // Fallback para formato antigo
```

## Exemplo Completo: Event Entity

### Backend Response

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "fields": null,

  "tableFields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "width": 200,
      "sortable": true,
      "visible": true
    },
    {
      "name": "eventType",
      "label": "Tipo",
      "type": "select",
      "width": 120,
      "options": [...]
    }
  ],

  "formFields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "width": 200,
      "required": true,
      "maxLength": 255
    },
    {
      "name": "eventType",
      "label": "Tipo",
      "type": "select",
      "width": 120,
      "required": true,
      "options": [...]
    },
    {
      "name": "categories",
      "label": "Categorias",
      "type": "nested",
      "relationship": {
        "type": "ONE_TO_MANY",
        "targetEntity": "eventCategory",
        "cascade": true,
        "fields": [
          {
            "name": "name",
            "label": "Nome",
            "type": "string",
            "required": true
          },
          {
            "name": "price",
            "label": "Preço",
            "type": "currency",
            "required": true
          }
        ]
      }
    }
  ]
}
```

### Como o Frontend Usa

**EntityTable (Tabela de Eventos):**

- Lê `tableFields` → Renderiza colunas: "Nome", "Tipo"
- Ignora "categories" (não está em tableFields)

**EntityForm (Formulário de Evento):**

- Lê `formFields` → Renderiza campos: "Nome", "Tipo", "Categorias"
- "Categorias" é renderizado como ArrayField com subcampos

## Benefícios da Separação

1. **Performance**: Tabelas não carregam estrutura de nested fields desnecessariamente
2. **Clareza**: Cada componente sabe exatamente quais campos usar
3. **Flexibilidade**: Pode mostrar campo na tabela mas não no form, ou vice-versa
4. **Validações**: Campos de form têm validações completas sem poluir metadata de tabela

## Migração Backend → Frontend

### Passo 1: Backend envia novo formato

```java
// EventMetadata.java
public EntityMetadata getEventMetadata() {
    EntityMetadata metadata = new EntityMetadata();
    metadata.setName("event");
    metadata.setLabel("Eventos");
    metadata.setFields(null); // Deprecated

    // Campos para tabelas
    List<FieldMetadata> tableFields = createTableFields();
    metadata.setTableFields(tableFields);

    // Campos para formulários (inclui nested)
    List<FieldMetadata> formFields = createFormFields();
    metadata.setFormFields(formFields);

    return metadata;
}
```

### Passo 2: Frontend adapta automaticamente

- EntityTable usa `tableFields` (ou fallback para `fields`)
- EntityForm usa `formFields` (ou fallback para `fields`)
- Sem mudanças necessárias em componentes existentes

## Troubleshooting

### Erro: "Metadata inválida para entidade X"

**Antes da correção:**

```
Erro: Metadata inválida para entidade event. Estrutura esperada não encontrada.
{
  "fields": null,
  "tableFields": [...],
  "formFields": [...]
}
```

**Causa**: EntityTable verificava `metadata.fields`, que agora é `null`

**Solução**: Atualizado para verificar `metadata.tableFields` primeiro

### Campos de relacionamento não aparecem no formulário

**Verificar:**

1. Campo está em `formFields`? (não em `tableFields`)
2. Campo tem `type: "nested"`?
3. Campo tem `relationship` com `type: "ONE_TO_MANY"`?
4. `relationship.fields` está preenchido?

## Arquivos Modificados

1. **src/types/metadata.ts**

   - Adicionado `tableFields?: FieldMetadata[]`
   - Adicionado `formFields?: FieldMetadata[]`
   - `fields` marcado como deprecated

2. **src/components/Generic/EntityTable.tsx**

   - Usa `tableFields` com fallback para `fields`

3. **src/utils/metadataConverter.ts**
   - Usa `formFields` com fallback para `fields`

## Referências

- [ARRAY_FIELD_SMART_LABELS.md](../frontend/ARRAY_FIELD_SMART_LABELS.md)
- [FORM_GRID_SYSTEM.md](../frontend/FORM_GRID_SYSTEM.md)
