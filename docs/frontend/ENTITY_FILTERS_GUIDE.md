# 🔗 Sistema de Filtros de Relacionamento (Entity Filters)

## 📋 Problema

Quando temos entidades com relacionamentos (ex: `Registration` tem `Event` e `User`), os filtros atuais pedem **IDs numéricos**, o que é ruim para UX:

```
❌ MAU:
┌─────────────────────────────┐
│ Evento                      │
│ ┌─────────────────────────┐ │
│ │ ID do evento            │ │  ← Usuário não sabe o ID!
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Queremos:**

```
✅ BOM:
┌─────────────────────────────┐
│ Evento                      │
│ ┌─────────────────────────┐ │
│ │ Corrida da Maria        │ │  ← Usuário vê o nome!
│ │ Maratona de SP          │ │
│ │ Trail da Serra          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## ✅ Solução Implementada

### **Frontend (Já Implementado):**

1. **Novo tipo de filtro:** `entity`
2. **Componente EntitySelect:** Carrega opções automaticamente de outras entidades
3. **EntityFilters atualizado:** Detecta filtros `type: "entity"` e renderiza EntitySelect

---

## 🔧 Como Configurar no Backend

### **Passo 1: Adicionar `@DisplayLabel` na Entidade**

Crie uma annotation para marcar qual campo é o "label" da entidade:

```java
// src/main/java/com/mvt/metadata/DisplayLabel.java
package com.mvt.metadata;

import java.lang.annotation.*;

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DisplayLabel {
    /**
     * Indica se este campo é o label principal da entidade
     * Usado para popular selects/dropdowns em filtros de relacionamento
     */
    boolean value() default true;
}
```

### **Passo 2: Anotar Entidades com `@DisplayLabel`**

```java
@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @DisplayLabel  // ← Marca "name" como label da entidade
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate eventDate;

    // ... outros campos
}
```

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue
    private UUID id;

    @DisplayLabel  // ← Marca "name" como label da entidade
    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String username;

    // ... outros campos
}
```

### **Passo 3: Atualizar MetadataController**

Adicione lógica para detectar relacionamentos e gerar `entityConfig`:

```java
@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    /**
     * Detecta se um filtro é de relacionamento e cria EntityFilterConfig
     */
    private EntityFilterConfig createEntityFilterConfig(Field field) {
        // Exemplo: field.name = "eventId", field.type = Long

        // Remove "Id" do final para descobrir nome da entidade
        String fieldName = field.getName();
        if (!fieldName.endsWith("Id")) {
            return null; // Não é um filtro de relacionamento
        }

        String entityName = fieldName.substring(0, fieldName.length() - 2); // "event"

        // Encontra a classe da entidade
        Class<?> entityClass = findEntityClass(entityName);
        if (entityClass == null) {
            return null;
        }

        // Encontra o campo anotado com @DisplayLabel
        String labelField = findDisplayLabelField(entityClass);
        if (labelField == null) {
            labelField = "name"; // Fallback para "name"
        }

        return EntityFilterConfig.builder()
            .entityName(entityName)
            .endpoint("/api/" + entityName + "s") // Pluraliza
            .labelField(labelField)
            .valueField("id")
            .searchable(true)
            .searchPlaceholder("Buscar " + entityName + "...")
            .build();
    }

    /**
     * Encontra o campo anotado com @DisplayLabel na entidade
     */
    private String findDisplayLabelField(Class<?> entityClass) {
        for (Field field : entityClass.getDeclaredFields()) {
            if (field.isAnnotationPresent(DisplayLabel.class)) {
                return field.getName();
            }
        }
        return null;
    }

    /**
     * Cria metadata de filtro detectando automaticamente tipo
     */
    private FilterMetadata createFilterMetadata(String fieldName, Class<?> fieldType) {
        FilterMetadata filter = new FilterMetadata();
        filter.setName(fieldName);
        filter.setField(fieldName);
        filter.setLabel(humanize(fieldName));

        // Detecta se é filtro de relacionamento (termina com "Id")
        if (fieldName.endsWith("Id") && (fieldType == Long.class || fieldType == UUID.class)) {
            filter.setType(FilterType.ENTITY); // Novo tipo!
            filter.setEntityConfig(createEntityFilterConfig(fieldName));
        } else if (fieldType == String.class) {
            filter.setType(FilterType.TEXT);
        } else if (Number.class.isAssignableFrom(fieldType)) {
            filter.setType(FilterType.NUMBER);
        }
        // ... outros tipos

        return filter;
    }
}
```

### **Passo 4: Adicionar Classes DTO**

```java
// EntityFilterConfig.java
@Data
@Builder
public class EntityFilterConfig {
    private String entityName;      // "event"
    private String endpoint;         // "/api/events"
    private String labelField;       // "name"
    private String valueField;       // "id"
    private Boolean searchable;      // true
    private String searchPlaceholder; // "Buscar evento..."
}

// FilterMetadata.java
@Data
public class FilterMetadata {
    private String name;
    private String label;
    private FilterType type;
    private String field;
    private String placeholder;
    private List<FilterOption> options;
    private EntityFilterConfig entityConfig; // ← NOVO!
}

// FilterType.java (enum)
public enum FilterType {
    TEXT,
    SELECT,
    NUMBER,
    DATE,
    BOOLEAN,
    ENTITY  // ← NOVO!
}
```

---

## 📊 Exemplo de Metadata Gerado

### **Antes (com ID):**

```json
{
  "registration": {
    "filters": [
      {
        "name": "eventId",
        "label": "Evento",
        "type": "number",
        "field": "event.id",
        "placeholder": "ID do evento"
      }
    ]
  }
}
```

### **Depois (com EntityConfig):**

```json
{
  "registration": {
    "filters": [
      {
        "name": "eventId",
        "label": "Evento",
        "type": "entity",
        "field": "event.id",
        "entityConfig": {
          "entityName": "event",
          "endpoint": "/api/events",
          "labelField": "name",
          "valueField": "id",
          "searchable": true,
          "searchPlaceholder": "Buscar evento..."
        }
      },
      {
        "name": "userId",
        "label": "Usuário",
        "type": "entity",
        "field": "user.id",
        "entityConfig": {
          "entityName": "user",
          "endpoint": "/api/users",
          "labelField": "name",
          "valueField": "id",
          "searchable": true,
          "searchPlaceholder": "Buscar usuário..."
        }
      }
    ]
  }
}
```

---

## 🎨 Renderização no Frontend

Com a configuração acima, o frontend automaticamente:

1. **Detecta** `type: "entity"`
2. **Renderiza** `<EntitySelect>` ao invés de `<input type="number">`
3. **Carrega** opções do endpoint configurado
4. **Exibe** labels ao invés de IDs
5. **Envia** IDs no filtro da query

### Fluxo:

```
1. Usuário abre filtros
   └─> EntitySelect faz GET /api/events?page=0&size=1000&sort=name,asc

2. Backend retorna:
   └─> [
         { id: 1, name: "Corrida da Maria" },
         { id: 2, name: "Maratona de SP" }
       ]

3. Frontend renderiza select:
   └─> <option value="1">Corrida da Maria</option>
       <option value="2">Maratona de SP</option>

4. Usuário seleciona "Corrida da Maria"
   └─> onChange envia value="1"

5. EntityTable faz request:
   └─> GET /api/registrations?eventId=1&page=0&size=10
```

---

## 🚀 Vantagens

### **UX Melhor:**

- ✅ Usuário vê nomes, não IDs
- ✅ Busca/filtro no próprio select
- ✅ Autocomplete implícito

### **Manutenção Zero:**

- ✅ Backend detecta automaticamente relacionamentos
- ✅ Annotation `@DisplayLabel` define o label
- ✅ Frontend renderiza automaticamente

### **Performance:**

- ✅ Carrega opções apenas uma vez
- ✅ Cache no cliente
- ✅ Paginação no backend

---

## 📝 Convenções

### **Nomes de Campos:**

- Filtros de relacionamento devem terminar com `Id` (ex: `eventId`, `userId`, `organizationId`)
- Backend detecta automaticamente baseado no sufixo

### **Endpoints:**

- Seguir padrão REST: `/api/{entity}s` (plural)
- Ex: `/api/events`, `/api/users`, `/api/organizations`

### **Label Field:**

- Usar `@DisplayLabel` para marcar o campo principal
- Fallback para `name` se não anotado

---

## 🔍 Exemplo Completo

### **1. Entidade Event:**

```java
@Entity
public class Event {
    @Id
    private Long id;

    @DisplayLabel
    private String name;  // ← Campo usado como label

    private LocalDate eventDate;
}
```

### **2. Entidade Registration:**

```java
@Entity
public class Registration {
    @Id
    private Long id;

    @ManyToOne
    private Event event;  // Relacionamento

    @ManyToOne
    private User user;    // Relacionamento
}
```

### **3. Metadata Gerado:**

```json
{
  "filters": [
    {
      "name": "eventId",
      "type": "entity",
      "entityConfig": {
        "entityName": "event",
        "endpoint": "/api/events",
        "labelField": "name", // ← Vem do @DisplayLabel
        "valueField": "id"
      }
    }
  ]
}
```

### **4. Frontend Renderiza:**

```tsx
<EntitySelect
  config={{
    entityName: "event",
    endpoint: "/api/events",
    labelField: "name",
    valueField: "id",
    searchable: true,
  }}
  value={selectedEventId}
  onChange={handleChange}
/>
```

---

## ✅ Checklist de Implementação

### Backend:

- [ ] Criar annotation `@DisplayLabel`
- [ ] Anotar entidades (Event, User, Organization, etc.)
- [ ] Criar `EntityFilterConfig` DTO
- [ ] Adicionar `FilterType.ENTITY`
- [ ] Atualizar `MetadataController`:
  - [ ] Detectar filtros que terminam com "Id"
  - [ ] Encontrar classe da entidade
  - [ ] Buscar campo com `@DisplayLabel`
  - [ ] Gerar `entityConfig`
- [ ] Testar endpoint `/api/metadata`

### Frontend:

- [x] Criar `EntitySelect` component
- [x] Atualizar tipos (`FilterType`, `FilterMetadata`)
- [x] Atualizar `EntityFilters` para suportar `type: "entity"`
- [ ] Testar filtros em páginas

---

## 🎯 Resultado Final

```tsx
// Antes (ruim):
<input type="number" placeholder="ID do evento" />

// Depois (bom):
<select>
  <option value="1">Corrida da Maria</option>
  <option value="2">Maratona de SP</option>
  <option value="3">Trail da Serra</option>
</select>
```

**O sistema detecta automaticamente relacionamentos e cria selects com nomes legíveis! 🚀**

---

**Última atualização:** 06/10/2025  
**Versão:** 1.0  
**Status:** Implementado no Frontend, Aguardando Backend
