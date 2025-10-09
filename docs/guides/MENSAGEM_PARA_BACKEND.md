# 📧 Mensagem para o Backend

---

## ✉️ **VERSÃO CURTA (Slack/WhatsApp)**

```
Olá time! 👋

Preciso de um ajuste no metadata de filtros de entidades relacionadas.

**O que fazer:**
Adicionar campo `renderAs` no EntityFilterConfig para o frontend escolher
automaticamente entre Select (dropdown) e Typeahead (autocomplete).

**Configuração:**
- user → "typeahead" (muitos registros)
- event → "select" (poucos registros)
- organization → "select"
- eventCategory → "select"

**Onde está tudo:**
📄 BACKEND_RENDERAS_IMPLEMENTATION.md

Tem código pronto pra copiar. São 3 passos simples (~30 min).

Dúvidas? Chama! 🚀
```

---

## 📧 **VERSÃO FORMAL (Email)**

**Assunto:** Implementação de renderAs para Filtros de Entidade

---

Olá equipe,

Identificamos uma melhoria importante na UX dos filtros de entidades relacionadas.

### **Problema Atual**

Os filtros de entidades (userId, eventId) pedem IDs numéricos, mas o usuário não conhece esses valores. Exemplo: "UUID do usuário" como campo de texto livre.

### **Solução Proposta**

O frontend já tem componentes prontos para resolver isso:

- **EntitySelect**: Dropdown tradicional (para poucas opções)
- **EntityTypeahead**: Autocomplete com busca dinâmica (para muitas opções)

Mas precisamos que o backend informe qual componente usar através do campo `renderAs` no metadata.

### **O que precisa ser feito**

**1. Adicionar campos no EntityFilterConfig DTO:**

```java
private String renderAs;          // "select" ou "typeahead"
private Boolean searchable;       // true
private String searchPlaceholder; // "Buscar usuário..."
```

**2. Configurar mapa de renderização:**

```java
private static final Map<String, String> RENDER_TYPE_CONFIG = Map.of(
    "user", "typeahead",         // Muitos registros
    "event", "select",           // Poucos registros
    "organization", "select",
    "eventCategory", "select"
);
```

**3. Incluir no metadata gerado:**

```java
.renderAs(RENDER_TYPE_CONFIG.getOrDefault(entityName, "select"))
.searchable(true)
.searchPlaceholder("Buscar " + humanize(entityName) + "...")
```

### **Documentação Completa**

Criei o documento **BACKEND_RENDERAS_IMPLEMENTATION.md** com:

- ✅ Código completo e pronto para usar
- ✅ Exemplos de metadata esperado
- ✅ Testes para validar
- ✅ Checklist de implementação

### **Resultado Esperado**

**Antes:**

```json
{
  "userId": {
    "type": "entity",
    "entityConfig": {
      "entityName": "user"
    }
  }
}
```

**Depois:**

```json
{
  "userId": {
    "type": "entity",
    "entityConfig": {
      "entityName": "user",
      "renderAs": "typeahead" // ← NOVO
    }
  }
}
```

### **Impacto**

- ⏱️ **Tempo:** 30-45 minutos
- 🎯 **Complexidade:** Baixa
- 📈 **UX:** Alto impacto (usuários vão adorar!)
- 🔄 **Breaking changes:** Nenhum (é só adicionar campos)

### **Próximos Passos**

1. Revisar documento BACKEND_RENDERAS_IMPLEMENTATION.md
2. Implementar conforme checklist
3. Testar metadata gerado
4. Avisar frontend para validar integração

Qualquer dúvida, estou à disposição!

Abraço,
[Seu nome]

---

**Anexos:**

- 📄 BACKEND_RENDERAS_IMPLEMENTATION.md (implementação detalhada)
- 📄 SELECT_VS_TYPEAHEAD_GUIDE.md (contexto e alternativas)

---

## 💬 **VERSÃO TÉCNICA (Issue/Task)**

**Título:** Adicionar campo renderAs no metadata de filtros de entidade

**Descrição:**

Implementar campo `renderAs` no `EntityFilterConfig` para permitir que o frontend escolha automaticamente entre componentes Select e Typeahead.

**Acceptance Criteria:**

- [ ] DTO `EntityFilterConfig` possui campos `renderAs`, `searchable`, `searchPlaceholder`
- [ ] Mapa `RENDER_TYPE_CONFIG` define tipo de renderização por entidade
- [ ] Método `createEntityFilterConfig()` preenche novos campos
- [ ] Metadata de `registration` contém `renderAs: "typeahead"` para `userId`
- [ ] Metadata de `registration` contém `renderAs: "select"` para `eventId`
- [ ] Frontend renderiza typeahead para usuários
- [ ] Frontend renderiza select para eventos

**Configuração:**

```java
"user" → "typeahead"
"event" → "select"
"organization" → "select"
"eventCategory" → "select"
```

**Documentação:**

- [x] BACKEND_RENDERAS_IMPLEMENTATION.md

**Estimativa:** 30-45 min

**Prioridade:** Alta (bloqueador de UX)

---

## 🎯 **PONTOS-CHAVE PARA DESTACAR**

1. ✅ **Código pronto:** Só copiar e colar do documento
2. ✅ **Zero breaking changes:** Campos novos são opcionais
3. ✅ **Alto impacto:** Melhora muito a experiência do usuário
4. ✅ **Baixa complexidade:** 3 passos simples
5. ✅ **Rápido:** 30-45 minutos de implementação

---

**Escolha a versão que fizer mais sentido para sua equipe!** 🚀
