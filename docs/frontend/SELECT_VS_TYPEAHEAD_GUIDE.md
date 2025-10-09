# 🎯 Select vs Typeahead - Guia de Decisão

## 📋 **A Questão**

**Pergunta:** Como escolher entre Select (dropdown) e Typeahead (autocomplete) para filtros de entidades relacionadas?

**Resposta:** Três opções disponíveis, da mais automática para a mais manual.

---

## ✅ **OPÇÃO 1: Automática (Recomendada)**

### **Como funciona:**

Backend conta registros e decide automaticamente:

- **< 50 registros** → `renderAs: "select"` (dropdown tradicional)
- **>= 50 registros** → `renderAs: "typeahead"` (busca com autocomplete)

### **Implementação:**

```java
private EntityFilterConfig createEntityFilterConfig(String filterName, Class<?> filterType) {
    // ... código de detecção ...

    // Conta registros
    Long entityCount = countEntities(entityClass);

    // Decide automaticamente
    String renderAs = entityCount != null && entityCount >= 50
        ? "typeahead"
        : "select";

    return EntityFilterConfig.builder()
        .renderAs(renderAs)
        .estimatedCount(entityCount)
        .build();
}
```

### **Vantagens:**

- ✅ Zero configuração manual
- ✅ Adapta-se automaticamente ao crescimento de dados
- ✅ Performático para qualquer quantidade

### **Desvantagens:**

- ⚠️ Requer contar registros (pode ter impacto de performance)

---

## ⚙️ **OPÇÃO 2: Configuração Manual (Flexível)**

### **Como funciona:**

Backend tem mapa de configurações por entidade, com fallback para automático.

### **Implementação:**

```java
// Mapa de configurações manuais
private static final Map<String, String> RENDER_TYPE_CONFIG = Map.of(
    "user", "typeahead",        // Usuários: sempre typeahead
    "event", "select",           // Eventos: sempre select
    "organization", "select",    // Organizações: sempre select
    "category", "select"         // Categorias: sempre select
);

private EntityFilterConfig createEntityFilterConfig(String filterName, Class<?> filterType) {
    // ... código de detecção ...

    // Verifica configuração manual primeiro
    String renderAs = RENDER_TYPE_CONFIG.getOrDefault(
        entityName,
        decideAutomatically(entityClass) // Fallback para automático
    );

    return EntityFilterConfig.builder()
        .renderAs(renderAs)
        .build();
}
```

### **Vantagens:**

- ✅ Controle total sobre cada entidade
- ✅ Sem necessidade de contar registros
- ✅ Fácil de ajustar

### **Desvantagens:**

- ⚠️ Requer manutenção manual
- ⚠️ Pode ficar desatualizado com crescimento de dados

---

## 🔧 **OPÇÃO 3: Annotation Customizada (Mais Elegante)**

### **Como funciona:**

Criar annotation `@FilterRenderType` para marcar na entidade.

### **Implementação:**

#### **1. Criar Annotation:**

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface FilterRenderType {
    String value() default "select"; // "select" ou "typeahead"
}
```

#### **2. Anotar Entidades:**

```java
@Entity
@FilterRenderType("select")  // ← Forçar select
public class Event {
    @Id
    private Long id;

    @DisplayLabel
    private String name;
}

@Entity
@FilterRenderType("typeahead")  // ← Forçar typeahead
public class User {
    @Id
    private UUID id;

    @DisplayLabel
    private String name;
}
```

#### **3. Ler Annotation no Controller:**

```java
private String getRenderType(Class<?> entityClass, Long count) {
    // Verifica annotation primeiro
    if (entityClass.isAnnotationPresent(FilterRenderType.class)) {
        FilterRenderType annotation = entityClass.getAnnotation(FilterRenderType.class);
        return annotation.value();
    }

    // Fallback para automático
    return count >= 50 ? "typeahead" : "select";
}
```

### **Vantagens:**

- ✅ Configuração próxima à entidade (coesão)
- ✅ Type-safe
- ✅ Autodocumentado
- ✅ Fácil de encontrar e manter

### **Desvantagens:**

- ⚠️ Mais complexo de implementar inicialmente

---

## 🎯 **RECOMENDAÇÃO**

### **Para seu caso (User + Event):**

**Opção 2 (Configuração Manual)** é a mais adequada:

```java
private static final Map<String, String> RENDER_TYPE_CONFIG = Map.of(
    "user", "typeahead",    // ← Typeahead para usuários (muitos registros)
    "event", "select"       // ← Select para eventos (poucos registros)
);
```

**Motivos:**

1. ✅ Simples de implementar (5 minhas de código)
2. ✅ Não precisa contar registros
3. ✅ Você já sabe qual tipo quer para cada entidade
4. ✅ Fácil de ajustar no futuro

---

## 📊 **Comparação Visual**

### **Select (Eventos - ~15 registros):**

```
┌─────────────────────────────┐
│ Evento                    ▼ │
├─────────────────────────────┤
│ Corrida da Maria            │ ← Todas opções visíveis
│ Maratona de SP              │    Scroll se necessário
│ Trail da Serra              │
│ ...                         │
└─────────────────────────────┘
```

### **Typeahead (Usuários - ~250 registros):**

```
┌─────────────────────────────┐
│ Usuário                     │
│ Digite para buscar...       │ ← Busca dinâmica
├─────────────────────────────┤
│ [Digite "mar"]              │
├─────────────────────────────┤
│ Maria Organizadora          │ ← Resultados filtrados
│ Maria Silva                 │    Apenas 3-5 opções
│ Marcos Santos               │
└─────────────────────────────┘
```

---

## 💻 **CÓDIGO COMPLETO (Opção 2)**

```java
@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    // Configurações manuais de renderização
    private static final Map<String, String> RENDER_TYPE_CONFIG = Map.of(
        "user", "typeahead",
        "event", "select",
        "organization", "select",
        "category", "select"
    );

    private EntityFilterConfig createEntityFilterConfig(String filterName, Class<?> filterType) {
        if (!filterName.endsWith("Id") || !isIdType(filterType)) {
            return null;
        }

        String entityName = filterName.substring(0, filterName.length() - 2);
        Class<?> entityClass = findEntityClass(entityName);

        if (entityClass == null) {
            return null;
        }

        String labelField = findDisplayLabelField(entityClass);
        if (labelField == null) {
            labelField = "name";
        }

        // Usa configuração manual ou fallback para "select"
        String renderAs = RENDER_TYPE_CONFIG.getOrDefault(entityName, "select");

        return EntityFilterConfig.builder()
            .entityName(entityName)
            .endpoint("/api/" + pluralize(entityName))
            .labelField(labelField)
            .valueField("id")
            .renderAs(renderAs)  // ← Define tipo de renderização
            .searchable(true)
            .searchPlaceholder("Buscar " + humanize(entityName) + "...")
            .build();
    }
}
```

---

## ✅ **RESULTADO ESPERADO**

### **Metadata gerado:**

```json
{
  "registration": {
    "filters": [
      {
        "name": "eventId",
        "entityConfig": {
          "entityName": "event",
          "renderAs": "select" // ← Select tradicional
        }
      },
      {
        "name": "userId",
        "entityConfig": {
          "entityName": "user",
          "renderAs": "typeahead" // ← Typeahead com busca
        }
      }
    ]
  }
}
```

### **Frontend renderiza:**

- **Event:** `<EntitySelect>` - Dropdown com todas opções
- **User:** `<EntityTypeahead>` - Input com busca dinâmica

---

## 🎨 **CUSTOMIZAÇÃO NO FRONTEND (Alternativa)**

Se preferir **não** fazer no backend, pode customizar no componente `EntityTable`:

```tsx
<EntityTable
  entityName="registration"
  customFilterConfig={{
    userId: { renderAs: "typeahead" }, // Override só para userId
    eventId: { renderAs: "select" }, // Override só para eventId
  }}
/>
```

**Mas isso quebra a arquitetura metadata-driven! ❌**

Melhor deixar no backend para manter a consistência.

---

## 🎯 **CONCLUSÃO**

**Para seu caso específico:**

1. ✅ Use **Opção 2 (Configuração Manual)**
2. ✅ Adicione mapa com `user: "typeahead"` e `event: "select"`
3. ✅ Backend já define isso no metadata
4. ✅ Frontend renderiza automaticamente

**Tempo de implementação:** 10-15 minutos

**Código necessário:** ~15 linhas

---

**Última atualização:** 06/10/2025  
**Recomendação:** Opção 2 (Configuração Manual no Backend)
