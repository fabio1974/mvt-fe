# 🐛 Correção Urgente: Labels de ArrayField com Tradução Incorreta

## Problema Identificado

No metadata de formulários, os campos do tipo `array` (relacionamentos 1:N) estão com labels de tradução incorretos.

### Exemplo do Erro

**Metadata atual (ERRADO):**

```json
{
  "name": "categories",
  "type": "array",
  "arrayConfig": {
    "itemLabel": "Categoria {index}",
    "addLabel": "Adicionar categorie" // ❌ ERRADO: "categorie" não existe em português
  }
}
```

**Visual no frontend:**

```
┌──────────────────────────────────────┐
│ Categorias                           │
│ 1 item adicionado                    │
│                                      │
│         [+ Adicionar categorie] ❌   │  ← Tradução errada!
└──────────────────────────────────────┘
```

## ✅ Correção Necessária

**Metadata correto (como deve ser):**

```json
{
  "name": "categories",
  "type": "array",
  "arrayConfig": {
    "itemLabel": "Categoria {index}",
    "addLabel": "Adicionar Categoria" // ✅ CORRETO
  }
}
```

**Visual correto no frontend:**

```
┌──────────────────────────────────────┐
│ Categorias                           │
│ 1 categoria adicionada               │
│                                      │
│         [+ Adicionar Categoria] ✅   │  ← Tradução correta!
└──────────────────────────────────────┘
```

## 📋 Regra Geral para Labels

### Para todos os campos `array`, siga este padrão:

```java
// Padrão correto
ArrayFieldConfig.builder()
    .itemLabel("Categoria {index}")      // Singular + {index}
    .addLabel("Adicionar Categoria")     // "Adicionar" + Singular
    .build();
```

### Exemplos Corretos:

```java
// Evento → Categorias
.itemLabel("Categoria {index}")
.addLabel("Adicionar Categoria")

// Evento → Distâncias
.itemLabel("Distância {index}")
.addLabel("Adicionar Distância")

// Evento → Lotes de Inscrição
.itemLabel("Lote {index}")
.addLabel("Adicionar Lote")

// Registro → Participantes
.itemLabel("Participante {index}")
.addLabel("Adicionar Participante")

// Organização → Membros
.itemLabel("Membro {index}")
.addLabel("Adicionar Membro")
```

## 🔍 Como Identificar Todos os Erros

Execute este comando no backend para encontrar todos os campos array:

```bash
# Busca por arrayConfig no código
grep -r "arrayConfig" src/main/java/
grep -r "addLabel" src/main/java/
```

## ✅ Checklist de Correção

Para cada entidade com relacionamento 1:N:

- [ ] **Event**

  - [ ] `categories` → "Adicionar Categoria"
  - [ ] `distances` → "Adicionar Distância"
  - [ ] `registrationBatches` → "Adicionar Lote"

- [ ] **Organization**

  - [ ] `members` → "Adicionar Membro"
  - [ ] `events` → "Adicionar Evento"

- [ ] **Registration**

  - [ ] `participants` → "Adicionar Participante"

- [ ] Outras entidades (verifique todas!)

## 🧪 Como Testar

1. Após corrigir o metadata no backend
2. Reinicie o servidor
3. No frontend, limpe o cache: `localStorage.clear()`
4. Acesse uma tela com relacionamento 1:N
5. Verifique se o botão mostra: "Adicionar [Entidade]" corretamente

## 📝 Exemplo de Código Backend

**Antes (ERRADO):**

```java
@GetMapping("/metadata/event/form")
public FormMetadata getEventFormMetadata() {
    return FormMetadata.builder()
        .sections(Arrays.asList(
            FormSection.builder()
                .fields(Arrays.asList(
                    FormField.builder()
                        .name("categories")
                        .type("array")
                        .arrayConfig(ArrayFieldConfig.builder()
                            .itemLabel("Categoria {index}")
                            .addLabel("Adicionar categorie")  // ❌ ERRADO
                            .build())
                        .build()
                ))
                .build()
        ))
        .build();
}
```

**Depois (CORRETO):**

```java
@GetMapping("/metadata/event/form")
public FormMetadata getEventFormMetadata() {
    return FormMetadata.builder()
        .sections(Arrays.asList(
            FormSection.builder()
                .fields(Arrays.asList(
                    FormField.builder()
                        .name("categories")
                        .type("array")
                        .arrayConfig(ArrayFieldConfig.builder()
                            .itemLabel("Categoria {index}")
                            .addLabel("Adicionar Categoria")  // ✅ CORRETO
                            .build())
                        .build()
                ))
                .build()
        ))
        .build();
}
```

## ⚠️ Impacto

- **UX**: Usuários veem texto errado/estranho
- **Profissionalismo**: Sistema parece mal traduzido
- **Consistência**: Quebra padrão de todo o resto do sistema

## 🚀 Prioridade

**ALTA** - Correção simples mas muito visível para o usuário final.

---

**Reportado por:** Frontend Team  
**Data:** Outubro 2025  
**Status:** ⏳ Aguardando correção no backend
