# Backend Metadata - Suporte a Relacionamentos 1:N

## Problema Atual

O metadata atual do backend não inclui informações sobre:

1. Relacionamentos 1:N (Ex: Event → Categories)
2. Campos das entidades relacionadas
3. Como renderizar arrays de objetos em formulários

## Solução Proposta

### 1. Estender FieldMetadata para Suportar Relacionamentos

```java
// Em FieldMetadata.java
public class FieldMetadata {
    private String name;
    private String label;
    private FieldType type;
    private Alignment align;
    private boolean sortable;
    private boolean searchable;
    private boolean visible;

    // NOVO: Informações sobre relacionamento
    private RelationshipMetadata relationship;
}

public class RelationshipMetadata {
    private RelationshipType type; // ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE
    private String targetEntity;    // Nome da entidade relacionada
    private String targetEndpoint;  // Endpoint para buscar a entidade
    private boolean cascade;        // Se deve salvar em cascata
    private List<FieldMetadata> fields; // Campos da entidade relacionada
}

public enum RelationshipType {
    ONE_TO_ONE,
    ONE_TO_MANY,
    MANY_TO_ONE,
    MANY_TO_MANY
}
```

### 2. Exemplo de Metadata para Event com Categories (1:N)

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/api/events",
    "fields": [
      {
        "name": "id",
        "label": "ID",
        "type": "long",
        "align": "left",
        "sortable": true,
        "searchable": false,
        "visible": false
      },
      {
        "name": "name",
        "label": "Nome",
        "type": "string",
        "align": "left",
        "sortable": true,
        "searchable": true,
        "visible": true
      },
      {
        "name": "description",
        "label": "Descrição",
        "type": "string",
        "align": "left",
        "sortable": false,
        "searchable": true,
        "visible": true
      },
      {
        "name": "categories",
        "label": "Categorias",
        "type": "nested",
        "align": "left",
        "sortable": false,
        "searchable": false,
        "visible": true,
        "relationship": {
          "type": "ONE_TO_MANY",
          "targetEntity": "eventCategory",
          "targetEndpoint": "/api/event-categories",
          "cascade": true,
          "fields": [
            {
              "name": "name",
              "label": "Nome da Categoria",
              "type": "string",
              "required": true,
              "placeholder": "Ex: 5km Masculino"
            },
            {
              "name": "distance",
              "label": "Distância (km)",
              "type": "double",
              "required": true,
              "min": 0.1,
              "max": 500
            },
            {
              "name": "price",
              "label": "Preço (R$)",
              "type": "double",
              "required": true,
              "min": 0
            },
            {
              "name": "maxParticipants",
              "label": "Máximo de Participantes",
              "type": "integer",
              "required": false,
              "min": 1
            },
            {
              "name": "gender",
              "label": "Gênero",
              "type": "enum",
              "required": true,
              "options": [
                { "value": "M", "label": "Masculino" },
                { "value": "F", "label": "Feminino" },
                { "value": "BOTH", "label": "Ambos" }
              ]
            }
          ]
        }
      }
    ],
    "filters": [],
    "pagination": {
      "defaultPageSize": 10,
      "pageSizeOptions": [10, 25, 50, 100],
      "showSizeSelector": true
    }
  }
}
```

### 3. Implementação Java (Spring Boot)

#### EventMetadataProvider.java

```java
@Component
public class EventMetadataProvider implements EntityMetadataProvider {

    @Override
    public String getEntityName() {
        return "event";
    }

    @Override
    public EntityMetadata getMetadata() {
        EntityMetadata metadata = new EntityMetadata();
        metadata.setName("event");
        metadata.setLabel("Eventos");
        metadata.setEndpoint("/api/events");

        List<FieldMetadata> fields = new ArrayList<>();

        // Campos básicos
        fields.add(createField("id", "ID", FieldType.LONG, false, false));
        fields.add(createField("name", "Nome", FieldType.STRING, true, true));
        fields.add(createField("description", "Descrição", FieldType.STRING, true, true));
        fields.add(createField("eventDate", "Data", FieldType.DATE, true, false));

        // Campo de relacionamento 1:N
        FieldMetadata categoriesField = new FieldMetadata();
        categoriesField.setName("categories");
        categoriesField.setLabel("Categorias");
        categoriesField.setType(FieldType.NESTED);
        categoriesField.setVisible(true);
        categoriesField.setRelationship(createCategoriesRelationship());
        fields.add(categoriesField);

        metadata.setFields(fields);
        return metadata;
    }

    private RelationshipMetadata createCategoriesRelationship() {
        RelationshipMetadata rel = new RelationshipMetadata();
        rel.setType(RelationshipType.ONE_TO_MANY);
        rel.setTargetEntity("eventCategory");
        rel.setTargetEndpoint("/api/event-categories");
        rel.setCascade(true);

        List<FieldMetadata> categoryFields = new ArrayList<>();

        // Campo nome
        FieldMetadata nameField = new FieldMetadata();
        nameField.setName("name");
        nameField.setLabel("Nome da Categoria");
        nameField.setType(FieldType.STRING);
        nameField.setRequired(true);
        nameField.setPlaceholder("Ex: 5km Masculino");
        categoryFields.add(nameField);

        // Campo distância
        FieldMetadata distanceField = new FieldMetadata();
        distanceField.setName("distance");
        distanceField.setLabel("Distância (km)");
        distanceField.setType(FieldType.DOUBLE);
        distanceField.setRequired(true);
        distanceField.setMin(0.1);
        distanceField.setMax(500.0);
        categoryFields.add(distanceField);

        // Campo preço
        FieldMetadata priceField = new FieldMetadata();
        priceField.setName("price");
        priceField.setLabel("Preço (R$)");
        priceField.setType(FieldType.DOUBLE);
        priceField.setRequired(true);
        priceField.setMin(0.0);
        categoryFields.add(priceField);

        // Campo vagas
        FieldMetadata maxParticipantsField = new FieldMetadata();
        maxParticipantsField.setName("maxParticipants");
        maxParticipantsField.setLabel("Máximo de Participantes");
        maxParticipantsField.setType(FieldType.INTEGER);
        maxParticipantsField.setMin(1);
        categoryFields.add(maxParticipantsField);

        // Campo gênero (enum)
        FieldMetadata genderField = new FieldMetadata();
        genderField.setName("gender");
        genderField.setLabel("Gênero");
        genderField.setType(FieldType.ENUM);
        genderField.setRequired(true);
        genderField.setOptions(Arrays.asList(
            new FilterOption("M", "Masculino"),
            new FilterOption("F", "Feminino"),
            new FilterOption("BOTH", "Ambos")
        ));
        categoryFields.add(genderField);

        rel.setFields(categoryFields);
        return rel;
    }

    private FieldMetadata createField(String name, String label, FieldType type,
                                     boolean searchable, boolean sortable) {
        FieldMetadata field = new FieldMetadata();
        field.setName(name);
        field.setLabel(label);
        field.setType(type);
        field.setSearchable(searchable);
        field.setSortable(sortable);
        field.setVisible(true);
        field.setAlign(Alignment.LEFT);
        return field;
    }
}
```

### 4. Classes Java Necessárias

#### RelationshipMetadata.java

```java
package br.com.mvt.metadata;

import java.util.List;

public class RelationshipMetadata {
    private RelationshipType type;
    private String targetEntity;
    private String targetEndpoint;
    private boolean cascade;
    private List<FieldMetadata> fields;

    // Getters and setters
}
```

#### RelationshipType.java

```java
package br.com.mvt.metadata;

public enum RelationshipType {
    ONE_TO_ONE,
    ONE_TO_MANY,
    MANY_TO_ONE,
    MANY_TO_MANY
}
```

#### FieldMetadata.java (estendido)

```java
package br.com.mvt.metadata;

import java.util.List;

public class FieldMetadata {
    private String name;
    private String label;
    private FieldType type;
    private Integer width;
    private Alignment align;
    private boolean sortable;
    private boolean searchable;
    private boolean visible;
    private String format;

    // NOVOS campos para formulários
    private boolean required;
    private String placeholder;
    private Object defaultValue;
    private Double min;
    private Double max;
    private Integer minLength;
    private Integer maxLength;
    private String pattern;
    private List<FilterOption> options;
    private RelationshipMetadata relationship;

    // Getters and setters
}
```

## Como o Frontend Usa Isso

O frontend irá:

1. Detectar campos com `type: "nested"` e `relationship` não-nulo
2. Identificar `relationship.type === "ONE_TO_MANY"`
3. Criar um campo `array` no formulário
4. Usar `relationship.fields` para definir os campos de cada item do array

```typescript
// Em metadataConverter.ts
function detectOneToManyRelationships(
  entityMetadata: EntityMetadata
): FormFieldMetadata[] {
  const relationships: FormFieldMetadata[] = [];

  entityMetadata.fields.forEach((field) => {
    if (field.type === "nested" && field.relationship) {
      if (field.relationship.type === "ONE_TO_MANY") {
        relationships.push({
          name: field.name,
          label: field.label,
          type: "array",
          required: false,
          arrayConfig: {
            itemType: "object",
            addLabel: `Adicionar ${field.label}`,
            itemLabel: `${field.label} {index}`,
            minItems: 0,
            maxItems: 100,
            // USA OS CAMPOS VINDOS DO BACKEND!
            fields: field.relationship.fields.map(
              convertBackendFieldToFormField
            ),
          },
        });
      }
    }
  });

  return relationships;
}
```

## Benefícios

✅ **Backend é a fonte única da verdade**  
✅ **Zero duplicação de código** - campos definidos uma vez  
✅ **Validação consistente** - mesmas regras no FE e BE  
✅ **Fácil manutenção** - mudar apenas no backend  
✅ **Type-safe** - TypeScript infere tipos do metadata  
✅ **Suporte automático a relacionamentos**
