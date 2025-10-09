# 🎯 Implementação: renderAs para Filtros de Entidade

## 📋 **O QUE PRECISA SER FEITO**

Adicionar campo `renderAs` no metadata de filtros de entidades relacionadas para que o frontend escolha automaticamente entre Select (dropdown) e Typeahead (autocomplete).

---

## 🎯 **OBJETIVO**

**Antes (problema atual):**

```json
{
  "userId": {
    "type": "entity",
    "entityConfig": {
      "entityName": "user",
      "endpoint": "/api/users",
      "labelField": "name"
      // ❌ Frontend não sabe qual componente usar
    }
  }
}
```

**Depois (solução):**

```json
{
  "userId": {
    "type": "entity",
    "entityConfig": {
      "entityName": "user",
      "endpoint": "/api/users",
      "labelField": "name",
      "renderAs": "typeahead" // ✅ Frontend usa autocomplete
    }
  }
}
```

---

## 📦 **PASSO 1: Atualizar EntityFilterConfig DTO**

**Arquivo:** `EntityFilterConfig.java` (ou onde está definido)

### **Adicionar campos:**

```java
@Data
@Builder
public class EntityFilterConfig {
    private String entityName;
    private String endpoint;
    private String labelField;
    private String valueField;

    // ⬇️ NOVOS CAMPOS
    private String renderAs;        // "select" ou "typeahead"
    private Boolean searchable;     // Sempre true
    private String searchPlaceholder; // "Buscar usuário..."
}
```

---

## 🔧 **PASSO 2: Configuração Manual de Renderização**

**Arquivo:** `MetadataController.java` (ou onde está a lógica de metadata)

### **Adicionar mapa de configurações:**

```java
@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    /**
     * Configuração de tipo de renderização por entidade.
     * - "select": Dropdown tradicional (para poucas opções)
     * - "typeahead": Autocomplete com busca (para muitas opções)
     */
    private static final Map<String, String> RENDER_TYPE_CONFIG = Map.of(
        "user", "typeahead",         // Usuários: muitos registros
        "event", "select",            // Eventos: poucos registros
        "organization", "select",     // Organizações: poucos registros
        "eventCategory", "select"     // Categorias: poucos registros
    );

    // ... resto do código ...
}
```

---

## 🛠️ **PASSO 3: Atualizar Lógica de Criação**

**Localizar método:** `createEntityFilterConfig()` ou similar

### **Código completo:**

```java
private EntityFilterConfig createEntityFilterConfig(String filterName, Class<?> filterType) {
    // Verifica se é um filtro de entidade (termina com "Id" e é tipo ID)
    if (!filterName.endsWith("Id") || !isIdType(filterType)) {
        return null;
    }

    // Remove "Id" para obter nome da entidade
    String entityName = filterName.substring(0, filterName.length() - 2);

    // Encontra a classe da entidade
    Class<?> entityClass = findEntityClass(entityName);
    if (entityClass == null) {
        return null;
    }

    // Encontra campo com @DisplayLabel
    String labelField = findDisplayLabelField(entityClass);
    if (labelField == null) {
        labelField = "name"; // Fallback padrão
    }

    // ⬇️ NOVA LÓGICA: Determina tipo de renderização
    String renderAs = RENDER_TYPE_CONFIG.getOrDefault(entityName, "select");

    // ⬇️ NOVA LÓGICA: Define placeholder de busca
    String searchPlaceholder = "Buscar " + humanize(entityName) + "...";

    return EntityFilterConfig.builder()
        .entityName(entityName)
        .endpoint("/api/" + pluralize(entityName))
        .labelField(labelField)
        .valueField("id")
        .renderAs(renderAs)                    // ✅ NOVO
        .searchable(true)                      // ✅ NOVO
        .searchPlaceholder(searchPlaceholder)  // ✅ NOVO
        .build();
}
```

---

## 🔍 **PASSO 4: Método Auxiliar humanize() (opcional)**

Para gerar placeholders bonitos ("Buscar usuário...", "Buscar evento..."):

```java
/**
 * Converte nome da entidade para formato humanizado.
 * Exemplo: "eventCategory" → "categoria de evento"
 */
private String humanize(String entityName) {
    Map<String, String> humanNames = Map.of(
        "user", "usuário",
        "event", "evento",
        "organization", "organização",
        "eventCategory", "categoria de evento",
        "payment", "pagamento",
        "registration", "inscrição"
    );

    return humanNames.getOrDefault(entityName, entityName);
}
```

---

## ✅ **RESULTADO ESPERADO**

### **Exemplo 1: Filtro de User (muitos registros)**

```json
{
  "name": "userId",
  "label": "Usuário",
  "type": "entity",
  "entityConfig": {
    "entityName": "user",
    "endpoint": "/api/users",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "typeahead", // ← Usa autocomplete
    "searchable": true,
    "searchPlaceholder": "Buscar usuário..."
  }
}
```

**Frontend renderiza:** Input com busca dinâmica (digita 2 caracteres → busca no backend)

---

### **Exemplo 2: Filtro de Event (poucos registros)**

```json
{
  "name": "eventId",
  "label": "Evento",
  "type": "entity",
  "entityConfig": {
    "entityName": "event",
    "endpoint": "/api/events",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "select", // ← Usa dropdown
    "searchable": true,
    "searchPlaceholder": "Buscar evento..."
  }
}
```

**Frontend renderiza:** Dropdown tradicional (carrega todas opções de uma vez)

---

## 🧪 **TESTES**

### **1. Testar metadata gerado:**

```bash
curl http://localhost:8080/api/metadata/registration | jq '.filters[] | select(.type == "entity")'
```

**Esperado:**

- `userId` → `"renderAs": "typeahead"`
- `eventId` → `"renderAs": "select"`

### **2. Testar busca no frontend:**

1. Abrir filtro de Usuário → deve mostrar input de busca
2. Digitar "mar" → deve buscar em `/api/users?search=mar`
3. Selecionar usuário → deve preencher UUID automaticamente

### **3. Testar select no frontend:**

1. Abrir filtro de Evento → deve mostrar dropdown
2. Buscar "corrida" → deve filtrar localmente
3. Selecionar evento → deve preencher ID automaticamente

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] **Passo 1:** Adicionar campos `renderAs`, `searchable`, `searchPlaceholder` no DTO
- [ ] **Passo 2:** Criar mapa `RENDER_TYPE_CONFIG` com configurações
- [ ] **Passo 3:** Atualizar `createEntityFilterConfig()` para incluir novos campos
- [ ] **Passo 4:** (Opcional) Adicionar método `humanize()` para placeholders
- [ ] **Teste 1:** Verificar metadata de `registration` contém `renderAs`
- [ ] **Teste 2:** Testar typeahead de usuário no frontend
- [ ] **Teste 3:** Testar select de evento no frontend

---

## 🎯 **CONFIGURAÇÕES RECOMENDADAS**

```java
private static final Map<String, String> RENDER_TYPE_CONFIG = Map.of(
    "user", "typeahead",         // ✅ Usuários: 100+ registros
    "event", "select",            // ✅ Eventos: ~20 registros
    "organization", "select",     // ✅ Organizações: ~10 registros
    "eventCategory", "select",    // ✅ Categorias: ~5 registros
    "payment", "select",          // ✅ Pagamentos: poucos registros
    "registration", "select"      // ✅ Inscrições: contexto específico
);
```

**Regra geral:**

- **< 50 registros:** `"select"` (carrega tudo de uma vez)
- **>= 50 registros:** `"typeahead"` (busca sob demanda)

---

## 🔄 **AJUSTE FUTURO (opcional)**

Se quiser automatizar a decisão no futuro:

```java
private String getRenderType(Class<?> entityClass, String entityName) {
    // Verifica configuração manual primeiro
    if (RENDER_TYPE_CONFIG.containsKey(entityName)) {
        return RENDER_TYPE_CONFIG.get(entityName);
    }

    // Fallback: conta registros e decide automaticamente
    Long count = countEntities(entityClass);
    return (count != null && count >= 50) ? "typeahead" : "select";
}
```

Mas por enquanto, **configuração manual é suficiente e mais performática**.

---

## ❓ **DÚVIDAS COMUNS**

### **1. E se quiser mudar evento para typeahead no futuro?**

```java
"event", "typeahead"  // Muda só isso no mapa
```

### **2. Preciso alterar os endpoints de listagem?**

Não! Os endpoints `/api/users`, `/api/events` já funcionam. O frontend usa o parâmetro `search` para filtrar.

### **3. E se não tiver @DisplayLabel na entidade?**

O código já faz fallback para `"name"` automaticamente.

### **4. Precisa migração de banco?**

Não! É só mudança no metadata (resposta JSON).

---

## 📞 **SUPORTE**

**Dúvidas?** Chame o time de frontend. Já temos os componentes prontos:

- ✅ `EntitySelect.tsx` (select tradicional)
- ✅ `EntityTypeahead.tsx` (autocomplete)
- ✅ `EntityFilters.tsx` (renderiza automaticamente)

**Documentação frontend:**

- `ENTITY_FILTERS_GUIDE.md`
- `ENTITY_FILTERS_SOLUTION.md`

---

**Tempo estimado:** 30-45 minutos  
**Complexidade:** Baixa  
**Impacto:** Alto (melhora muito a UX)

**Última atualização:** 06/10/2025
