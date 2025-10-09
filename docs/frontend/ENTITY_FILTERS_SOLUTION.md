# 🎯 Solução: Filtros de Relacionamento sem IDs

## 📋 Resumo Executivo

**Problema:** Filtros pedem IDs numéricos (ex: "ID do evento"), usuário não sabe qual ID usar.

**Solução:** Sistema automático que:

1. Detecta relacionamentos (campos terminados em "Id")
2. Carrega opções da entidade relacionada
3. Exibe nomes legíveis ao invés de IDs
4. Envia IDs corretos na query

---

## ✅ Status de Implementação

### **Frontend: ✅ COMPLETO**

- [x] Novo tipo `FilterType = "entity"`
- [x] Componente `EntitySelect` criado
- [x] `EntityFilters` atualizado para detectar tipo "entity"
- [x] Tipos TypeScript atualizados (`EntityFilterConfig`)
- [x] Documentação completa (`ENTITY_FILTERS_GUIDE.md`)

### **Backend: ⏳ PENDENTE**

- [ ] Annotation `@DisplayLabel` (ver `BACKEND_EXAMPLE_DisplayLabel.java`)
- [ ] DTO `EntityFilterConfig` (ver `BACKEND_EXAMPLE_EntityFilterConfig.java`)
- [ ] Enum `FilterType.ENTITY` (ver `BACKEND_EXAMPLE_FilterType.java`)
- [ ] Lógica de detecção no `MetadataController` (ver `BACKEND_EXAMPLE_MetadataController.java`)
- [ ] Anotar entidades com `@DisplayLabel`:
  - [ ] Event (`@DisplayLabel` no campo `name`)
  - [ ] User (`@DisplayLabel` no campo `name`)
  - [ ] Organization (`@DisplayLabel` no campo `name`)

---

## 🎨 Como Funciona

### **1. Backend Detecta Automaticamente**

```java
// Entidade anotada
@Entity
public class Event {
    @Id
    private Long id;

    @DisplayLabel  // ← Marca este campo como label
    private String name;
}

// Controller detecta:
if (filterName.endsWith("Id")) {
    // É um relacionamento!
    entityConfig = EntityFilterConfig.builder()
        .entityName("event")
        .endpoint("/api/events")
        .labelField("name")  // ← Vem do @DisplayLabel
        .valueField("id")
        .build();
}
```

### **2. Metadata Gerado**

```json
{
  "filters": [
    {
      "name": "eventId",
      "type": "entity",
      "entityConfig": {
        "entityName": "event",
        "endpoint": "/api/events",
        "labelField": "name",
        "valueField": "id",
        "searchable": true
      }
    }
  ]
}
```

### **3. Frontend Renderiza**

```tsx
// EntityFilters detecta type="entity" e renderiza:
<EntitySelect
  config={entityConfig}
  value={selectedValue}
  onChange={handleChange}
/>

// EntitySelect faz:
GET /api/events?page=0&size=1000&sort=name,asc

// Renderiza:
<select>
  <option value="1">Corrida da Maria</option>
  <option value="2">Maratona de SP</option>
</select>
```

### **4. Usuário Seleciona e Filtra**

```
Usuário vê: "Corrida da Maria"
Sistema envia: eventId=1
Query final: GET /api/registrations?eventId=1&page=0&size=10
```

---

## 📝 Checklist de Implementação Backend

### **Passo 1: Criar Annotation**

Copie o arquivo `BACKEND_EXAMPLE_DisplayLabel.java` para:

```
src/main/java/com/mvt/metadata/DisplayLabel.java
```

### **Passo 2: Criar DTOs**

Copie os arquivos:

- `BACKEND_EXAMPLE_EntityFilterConfig.java` → `src/main/java/com/mvt/dto/metadata/`
- `BACKEND_EXAMPLE_FilterType.java` → `src/main/java/com/mvt/dto/metadata/`

Atualize `FilterMetadata.java`:

```java
@Data
public class FilterMetadata {
    private String name;
    private String label;
    private FilterType type;
    private String field;
    private String placeholder;
    private List<FilterOption> options;
    private EntityFilterConfig entityConfig; // ← ADICIONAR!
}
```

### **Passo 3: Anotar Entidades**

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
```

### **Passo 4: Atualizar MetadataController**

Use o código de `BACKEND_EXAMPLE_MetadataController.java` como referência.

Principais métodos a implementar:

- `createEntityFilterConfig()` - Detecta relacionamentos
- `findDisplayLabelField()` - Busca campo anotado
- `createFilterMetadata()` - Cria filtro com tipo correto

### **Passo 5: Testar**

```bash
# Verificar metadata gerado
curl http://localhost:8080/api/metadata | jq '.registration.filters'

# Deve retornar:
{
  "name": "eventId",
  "type": "entity",
  "entityConfig": {
    "entityName": "event",
    "endpoint": "/api/events",
    "labelField": "name",
    "valueField": "id"
  }
}
```

---

## 🎯 Resultado Esperado

### **Antes:**

```
┌─────────────────────────────┐
│ Evento                      │
│ ┌─────────────────────────┐ │
│ │ 123                     │ │  ← Ruim: Usuário não sabe
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### **Depois:**

```
┌─────────────────────────────┐
│ Evento                      │
│ ┌─────────────────────────┐ │
│ │ Corrida da Maria      ▼ │ │  ← Bom: Nome legível
│ └─────────────────────────┘ │
│   Corrida da Maria          │
│   Maratona de SP            │
│   Trail da Serra            │
└─────────────────────────────┘
```

---

## 📚 Arquivos de Referência

### **Documentação:**

- `ENTITY_FILTERS_GUIDE.md` - Guia completo com exemplos

### **Exemplos de Código Backend:**

- `BACKEND_EXAMPLE_DisplayLabel.java` - Annotation
- `BACKEND_EXAMPLE_EntityFilterConfig.java` - DTO de configuração
- `BACKEND_EXAMPLE_FilterType.java` - Enum com novo tipo
- `BACKEND_EXAMPLE_MetadataController.java` - Lógica de detecção

### **Código Frontend (já implementado):**

- `src/components/Common/EntitySelect.tsx` - Componente de select
- `src/components/Generic/EntityFilters.tsx` - Renderização de filtros
- `src/types/metadata.ts` - Tipos TypeScript

---

## 🚀 Próximos Passos

1. **Implementar no Backend:**

   - Copiar arquivos de exemplo
   - Anotar entidades com `@DisplayLabel`
   - Atualizar `MetadataController`
   - Testar endpoint `/api/metadata`

2. **Testar no Frontend:**

   - Abrir página de Inscrições
   - Verificar se filtros mostram nomes
   - Testar seleção e filtragem

3. **Expandir para outras entidades:**
   - Category
   - Organization
   - Qualquer outra com relacionamentos

---

## 💡 Convenções

### **Nomes de Campos:**

- Relacionamentos terminam com `Id`: `eventId`, `userId`, `organizationId`
- Backend detecta automaticamente pelo sufixo

### **Label Field:**

- Usar `@DisplayLabel` para marcar campo principal
- Geralmente é `name`, mas pode ser qualquer campo String

### **Endpoints:**

- Seguir padrão REST: `/api/{plural}`
- Ex: `/api/events`, `/api/users`

---

## ✅ Vantagens

1. **Zero Configuração Manual:**

   - Backend detecta relacionamentos automaticamente
   - Frontend renderiza select automaticamente

2. **UX Melhorada:**

   - Usuário vê nomes, não IDs
   - Busca integrada no select

3. **Manutenção Fácil:**

   - Adicionar novo relacionamento = apenas anotar entidade
   - Sem código repetido

4. **Type-Safe:**
   - TypeScript no frontend
   - Generics no backend

---

**Status:** Frontend completo ✅ | Backend pendente ⏳  
**Próxima ação:** Implementar no backend conforme exemplos fornecidos

**Data:** 06/10/2025  
**Versão:** 1.0
