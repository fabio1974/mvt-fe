# 🎯 IMPLEMENTAÇÃO BACKEND - Filtros de Relacionamento

**Para:** Equipe Backend  
**De:** Frontend Team  
**Assunto:** Nova funcionalidade - Filtros com seleção de entidades relacionadas  
**Prioridade:** Média  
**Impacto:** Melhoria significativa de UX

---

## 📋 **O QUE PRECISA SER FEITO**

### **Problema Atual:**

Filtros de relacionamento pedem IDs numéricos:

```
❌ Ruim:
Evento: [ ID do evento _____ ]  ← Usuário não sabe qual ID usar
```

### **Solução Proposta:**

Filtros mostram nomes das entidades:

```
✅ Bom:
Evento: [ Corrida da Maria ▼ ]  ← Usuário vê o nome e seleciona
        [ Maratona de SP     ]
        [ Trail da Serra     ]
```

---

## 🔧 **IMPLEMENTAÇÃO (4 passos)**

### **Passo 1: Criar Annotation `@DisplayLabel`**

**Arquivo:** `src/main/java/com/mvt/metadata/DisplayLabel.java`

```java
package com.mvt.metadata;

import java.lang.annotation.*;

/**
 * Marca o campo principal de uma entidade para exibição em selects
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DisplayLabel {
    boolean value() default true;
}
```

---

### **Passo 2: Criar DTOs**

#### **A) EntityFilterConfig.java**

**Arquivo:** `src/main/java/com/mvt/dto/metadata/EntityFilterConfig.java`

```java
package com.mvt.dto.metadata;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityFilterConfig {
    private String entityName;      // "event"
    private String endpoint;         // "/api/events"
    private String labelField;       // "name"
    private String valueField;       // "id"
    private String renderAs;         // "select" ou "typeahead"
    private Boolean searchable;      // true
    private String searchPlaceholder;
    private Integer estimatedCount;  // Número estimado de registros
}
```

**Valores para `renderAs`:**

- `"select"` - Select tradicional (recomendado para < 50 registros)
- `"typeahead"` - Busca com autocomplete (recomendado para 50+ registros)

#### **B) Atualizar FilterType.java**

**Adicionar novo valor ao enum:**

```java
public enum FilterType {
    TEXT,
    SELECT,
    NUMBER,
    DATE,
    BOOLEAN,
    ENTITY  // ← ADICIONAR este
}
```

#### **C) Atualizar FilterMetadata.java**

**Adicionar campo:**

```java
@Data
public class FilterMetadata {
    private String name;
    private String label;
    private FilterType type;
    private String field;
    private String placeholder;
    private List<FilterOption> options;
    private EntityFilterConfig entityConfig; // ← ADICIONAR este
}
```

---

### **Passo 3: Anotar Entidades**

**Marcar o campo principal de cada entidade:**

```java
@Entity
public class Event {
    @Id
    private Long id;

    @DisplayLabel  // ← ADICIONAR
    private String name;

    // ... outros campos
}

@Entity
public class User {
    @Id
    private UUID id;

    @DisplayLabel  // ← ADICIONAR
    private String name;

    // ... outros campos
}

@Entity
public class Organization {
    @Id
    private Long id;

    @DisplayLabel  // ← ADICIONAR
    private String name;

    // ... outros campos
}
```

---

### **Passo 4: Atualizar MetadataController**

**Adicionar métodos de detecção automática:**

```java
@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    /**
     * Detecta relacionamentos e cria EntityFilterConfig
     */
    private EntityFilterConfig createEntityFilterConfig(String filterName, Class<?> filterType) {
        // Verifica se termina com "Id"
        if (!filterName.endsWith("Id")) {
            return null;
        }

        // Verifica se é tipo de ID (Long, UUID, Integer)
        if (!isIdType(filterType)) {
            return null;
        }

        // Remove "Id" do final para obter nome da entidade
        String entityName = filterName.substring(0, filterName.length() - 2);

        // Encontra a classe da entidade
        Class<?> entityClass = findEntityClass(entityName);
        if (entityClass == null) {
            return null;
        }

        // Busca campo com @DisplayLabel
        String labelField = findDisplayLabelField(entityClass);
        if (labelField == null) {
            labelField = "name"; // Fallback
        }

        // Conta registros para decidir tipo de renderização
        Long entityCount = countEntities(entityClass);
        String renderAs = decideRenderType(entityCount);

        return EntityFilterConfig.builder()
            .entityName(entityName)
            .endpoint("/api/" + pluralize(entityName))
            .labelField(labelField)
            .valueField("id")
            .renderAs(renderAs)
            .searchable(true)
            .searchPlaceholder("Buscar " + humanize(entityName) + "...")
            .estimatedCount(entityCount != null ? entityCount.intValue() : null)
            .build();
    }

    /**
     * Decide tipo de renderização baseado na quantidade de registros
     */
    private String decideRenderType(Long count) {
        if (count == null) {
            return "select"; // Default
        }

        // Typeahead para entidades com muitos registros
        if (count > 50) {
            return "typeahead";
        }

        return "select";
    }

    /**
     * Conta número de registros de uma entidade
     */
    private Long countEntities(Class<?> entityClass) {
        try {
            // Exemplo usando JPA Repository
            // Você precisará adaptar para sua arquitetura
            String repositoryName = entityClass.getSimpleName() + "Repository";
            // Use seu método de contar entidades aqui
            // return repository.count();

            return null; // Implementar baseado na sua arquitetura
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Verifica se é tipo de ID
     */
    private boolean isIdType(Class<?> type) {
        return type == Long.class ||
               type == Integer.class ||
               type.getName().equals("java.util.UUID");
    }

    /**
     * Encontra classe da entidade pelo nome
     */
    private Class<?> findEntityClass(String entityName) {
        try {
            String className = entityName.substring(0, 1).toUpperCase() +
                             entityName.substring(1);

            String[] packages = {
                "com.mvt.model",
                "com.mvt.entity",
                "com.mvt.domain"
            };

            for (String pkg : packages) {
                try {
                    return Class.forName(pkg + "." + className);
                } catch (ClassNotFoundException e) {
                    // Tenta próximo
                }
            }
        } catch (Exception e) {
            // Log error
        }
        return null;
    }

    /**
     * Encontra campo anotado com @DisplayLabel
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
     * Pluraliza nome (simples)
     */
    private String pluralize(String word) {
        if (word.endsWith("y")) {
            return word.substring(0, word.length() - 1) + "ies";
        }
        return word + "s";
    }

    /**
     * Converte camelCase para legível
     */
    private String humanize(String camelCase) {
        String result = camelCase.replaceAll("([A-Z])", " $1");
        return result.substring(0, 1).toUpperCase() + result.substring(1).toLowerCase();
    }

    /**
     * Cria FilterMetadata com detecção automática de tipo
     */
    public FilterMetadata createFilterMetadata(String fieldName, Class<?> fieldType) {
        FilterMetadata filter = new FilterMetadata();
        filter.setName(fieldName);
        filter.setField(fieldName);
        filter.setLabel(humanize(fieldName));

        // DETECÇÃO AUTOMÁTICA
        if (fieldName.endsWith("Id")) {
            // É relacionamento!
            filter.setType(FilterType.ENTITY);
            filter.setEntityConfig(createEntityFilterConfig(fieldName, fieldType));
        } else if (fieldType == String.class) {
            filter.setType(FilterType.TEXT);
        } else if (Number.class.isAssignableFrom(fieldType)) {
            filter.setType(FilterType.NUMBER);
        }

        return filter;
    }
}
```

---

## 📊 **EXEMPLO DE METADATA GERADO**

### **Antes:**

```json
{
  "registration": {
    "filters": [
      {
        "name": "eventId",
        "type": "number",
        "placeholder": "ID do evento"
      }
    ]
  }
}
```

### **Depois (esperado):**

```json
{
  "registration": {
    "filters": [
      {
        "name": "eventId",
        "type": "entity",
        "label": "Evento",
        "field": "event.id",
        "entityConfig": {
          "entityName": "event",
          "endpoint": "/api/events",
          "labelField": "name",
          "valueField": "id",
          "renderAs": "select",
          "searchable": true,
          "searchPlaceholder": "Buscar evento...",
          "estimatedCount": 15
        }
      },
      {
        "name": "userId",
        "type": "entity",
        "label": "Usuário",
        "field": "user.id",
        "entityConfig": {
          "entityName": "user",
          "endpoint": "/api/users",
          "labelField": "name",
          "valueField": "id",
          "renderAs": "typeahead",
          "searchable": true,
          "searchPlaceholder": "Buscar usuário...",
          "estimatedCount": 250
        }
      }
    ]
  }
}
```

**Diferenças no frontend:**

- `renderAs: "select"` → Renderiza dropdown tradicional (Event - 15 registros)
- `renderAs: "typeahead"` → Renderiza busca com autocomplete (User - 250 registros)

---

## ✅ **CHECKLIST**

- [ ] Criar `@DisplayLabel` annotation
- [ ] Criar `EntityFilterConfig` DTO
- [ ] Adicionar `ENTITY` ao enum `FilterType`
- [ ] Adicionar campo `entityConfig` em `FilterMetadata`
- [ ] Anotar entidades:
  - [ ] Event (`@DisplayLabel` em `name`)
  - [ ] User (`@DisplayLabel` em `name`)
  - [ ] Organization (`@DisplayLabel` em `name`)
  - [ ] Outras entidades conforme necessário
- [ ] Implementar métodos no `MetadataController`:
  - [ ] `createEntityFilterConfig()`
  - [ ] `findDisplayLabelField()`
  - [ ] `findEntityClass()`
  - [ ] Atualizar `createFilterMetadata()`
- [ ] Testar endpoint: `GET /api/metadata`
- [ ] Verificar JSON gerado contém `entityConfig`

---

## 🧪 **COMO TESTAR**

### **1. Verificar metadata gerado:**

```bash
curl http://localhost:8080/api/metadata | jq '.registration.filters'
```

**Deve conter:**

```json
{
  "name": "eventId",
  "type": "entity",
  "entityConfig": {
    "entityName": "event",
    "endpoint": "/api/events",
    "labelField": "name"
  }
}
```

### **2. Testar no frontend:**

- Abrir página de Inscrições
- Verificar se filtro "Evento" mostra um select
- Verificar se aparecem nomes dos eventos
- Selecionar um evento e filtrar
- Verificar se query tem `eventId=123`

---

## 📝 **CONVENÇÕES**

1. **Nomes de campos:**
   - Relacionamentos terminam com `Id`: `eventId`, `userId`, `organizationId`
2. **Annotation @DisplayLabel:**
   - Marcar o campo principal da entidade (geralmente `name`)
   - Usado para popular selects
3. **Endpoints:**
   - Seguir padrão REST: `/api/{plural}`
   - Ex: `/api/events`, `/api/users`
4. **Tipo de Renderização (renderAs):**
   - `"select"` - Automático para < 50 registros
   - `"typeahead"` - Automático para >= 50 registros
   - Pode ser sobrescrito manualmente se necessário

---

## 🎨 **OVERRIDE MANUAL (Opcional)**

Se quiser forçar um tipo específico independente da contagem:

```java
// Exemplo: Forçar typeahead para User mesmo com poucos registros
if ("user".equals(entityName)) {
    renderAs = "typeahead"; // Override manual
}

// Exemplo: Forçar select para Category mesmo com muitos registros
if ("category".equals(entityName)) {
    renderAs = "select"; // Override manual
}
```

Ou criar um método de configuração:

```java
/**
 * Configurações manuais de renderização por entidade
 */
private String getRenderTypeForEntity(String entityName, Long count) {
    // Configurações manuais (override)
    Map<String, String> manualConfig = Map.of(
        "user", "typeahead",      // Sempre typeahead
        "event", "select",         // Sempre select
        "organization", "select"   // Sempre select
    );

    if (manualConfig.containsKey(entityName)) {
        return manualConfig.get(entityName);
    }

    // Automático baseado em contagem
    return decideRenderType(count);
}
```

---

## 🎯 **BENEFÍCIOS**

✅ **UX Melhorada:** Usuário vê nomes, não IDs  
✅ **Automático:** Backend detecta relacionamentos por convenção  
✅ **Zero Config:** Apenas anotar entidades com `@DisplayLabel`  
✅ **Type-Safe:** Usa generics e reflection  
✅ **Escalável:** Funciona para qualquer nova entidade

---

## 📞 **DÚVIDAS?**

Entre em contato com o frontend team ou consulte:

- `ENTITY_FILTERS_GUIDE.md` - Documentação completa
- `ENTITY_FILTERS_SOLUTION.md` - Resumo executivo

---

**Última atualização:** 06/10/2025  
**Estimativa de implementação:** 2-4 horas  
**Impacto:** Alto (melhora significativamente UX dos filtros)
