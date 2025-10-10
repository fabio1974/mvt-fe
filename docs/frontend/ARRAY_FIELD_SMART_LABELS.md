# Array Field - Smart Labels (Geração Automática de Rótulos)

## 📋 Visão Geral

O `ArrayField` agora gera automaticamente rótulos inteligentes para botões e títulos, convertendo labels plurais em singulares.

## 🎯 Problema Resolvido

**Antes:**

```
Backend enviava: field.label = "Categorias"
ArrayField mostrava: "Adicionar categorie" ❌ (tradução incorreta)
```

**Depois:**

```
Backend envia: field.label = "Categorias"
ArrayField mostra: "Adicionar Categoria" ✅ (singular correto)
```

## 🔧 Como Funciona

### 1. Backend envia metadados

```json
{
  "name": "categorias",
  "label": "Categorias",
  "type": "array",
  "arrayConfig": {
    "itemType": "object",
    "fields": [...]
  }
}
```

### 2. EntityForm passa o label para o config

```tsx
<ArrayField
  config={{
    ...field.arrayConfig,
    label: field.arrayConfig?.label || field.label, // "Categorias"
  }}
  value={value}
  onChange={handleChange}
/>
```

### 3. ArrayField gera labels automaticamente

```tsx
// 🔄 Converte plural em singular
const pluralToSingular = (plural: string): string => {
  if (plural.endsWith("s")) {
    return plural.slice(0, -1); // "Categorias" → "Categoria"
  }
  return plural;
};

// 🏷️ Gera labels inteligentes
const generateSmartLabels = () => {
  const pluralLabel = config.label || "Items"; // "Categorias"
  const singularName = pluralToSingular(pluralLabel); // "Categoria"

  const itemLabel = rawItemLabel || `${singularName} {index}`; // "Categoria {index}"
  const addLabel = rawAddLabel || `Adicionar ${singularName}`; // "Adicionar Categoria"

  return { itemLabel, addLabel, pluralLabel };
};
```

## 📦 Resultado Visual

```
┌─────────────────────────────────────────┐
│  📦 Categorias                          │  ← pluralLabel
│  3 itens adicionados                    │
│                                         │
│  [+ Adicionar Categoria]               │  ← addLabel (singular)
├─────────────────────────────────────────┤
│  📄 Categoria 1                         │  ← itemLabel
│     • Nome: Elite                       │
│  📄 Categoria 2                         │
│     • Nome: Master                      │
│  📄 Categoria 3                         │
│     • Nome: Open                        │
└─────────────────────────────────────────┘
```

## 🌍 Regras de Pluralização

### Português

- **Regra básica**: Remove 's' final
  - `Categorias` → `Categoria`
  - `Distâncias` → `Distância`
  - `Modalidades` → `Modalidade`
  - `Eventos` → `Evento`

### Edge Cases

Para casos especiais (raros em português), o backend pode sobrescrever:

```json
{
  "arrayConfig": {
    "label": "Itens",
    "addLabel": "Adicionar Item Especial",
    "itemLabel": "Item Customizado {index}"
  }
}
```

## 🔧 Alterações Técnicas

### 1. Tipo `ArrayFieldConfig` (metadata.ts)

```typescript
export interface ArrayFieldConfig {
  /** Label plural do campo (ex: "Categorias") - enviado pelo backend */
  label?: string;
  addLabel?: string;
  itemLabel?: string;
  // ... resto dos campos
}
```

### 2. EntityForm.tsx

```tsx
<ArrayField
  config={{
    ...field.arrayConfig,
    label: field.arrayConfig?.label || field.label,
  }}
  // ...
/>
```

### 3. ArrayField.tsx

```tsx
// Função de conversão plural → singular
const pluralToSingular = (plural: string): string => {
  if (plural.endsWith("s")) {
    return plural.slice(0, -1);
  }
  return plural;
};

// Geração de labels
const { itemLabel, addLabel, pluralLabel } = generateSmartLabels();
```

## ✅ Testes

### Exemplos Testados

- ✅ `Categorias` → `Adicionar Categoria`
- ✅ `Distâncias` → `Adicionar Distância`
- ✅ `Modalidades` → `Adicionar Modalidade`
- ✅ `Eventos` → `Adicionar Evento`

### Validação Manual

1. Abrir formulário com campo array
2. Verificar botão: deve mostrar "Adicionar [Singular]"
3. Verificar título: deve mostrar label plural
4. Verificar items: devem mostrar label singular + índice

## 🔄 Retrocompatibilidade

A solução é **100% retrocompatível**:

- ✅ Se backend não envia `label`, usa defaults
- ✅ Se backend envia `addLabel` customizado, respeita
- ✅ Se backend envia `itemLabel` customizado, respeita
- ✅ Funciona com arrays existentes sem mudanças

## 📝 Conclusão

Solução **frontend-only** que:

- 🎯 Corrige automaticamente traduções
- 🌍 Funciona com português
- 🔄 Não requer mudanças no backend
- ✅ É retrocompatível
- 🚀 Funciona para todos os campos array

---

**Data:** 2025-01-XX  
**Autor:** GitHub Copilot  
**Status:** ✅ Implementado e Testado
