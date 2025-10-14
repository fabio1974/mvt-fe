# ✅ FIX: Computed Fields em ArrayField (Nested Items)

## Problema Descoberto

O sistema de campos computados estava funcionando para **campos de primeiro nível** (no EntityForm principal), mas **NÃO funcionava para campos dentro de ArrayField** (itens relacionados 1:N como categorias dentro de eventos).

### Evidência nos Logs

```javascript
✅ [metadataConverter] Campo computado detectado: name -> função: categoryName
✅ [metadataConverter] Dependências: name -> [distance, gender, minAge, maxAge]
```

O campo computado **era detectado na conversão**, mas quando o usuário preenchia os campos de distância, gênero e idades **dentro de uma categoria** (ArrayField), o campo "Nome" **não recalculava**.

## Causa Raiz

O **ArrayField** renderiza seus próprios campos internos de forma manual, mas:

1. ❌ **Não tinha useEffect** para detectar e recalcular computed fields
2. ❌ **Não renderizava computed fields como readonly**
3. ❌ **Não importava** `executeComputedField` para executar as funções

Resultado: Campos computados eram ignorados dentro de itens do array.

## Solução Aplicada

### 1. Import do executeComputedField

**Arquivo:** `/src/components/Generic/ArrayField.tsx`

```typescript
import React, { useState, useEffect } from "react"; // ✅ Adicionado useEffect
import { executeComputedField } from "../../utils/computedFields"; // ✅ NOVO
```

### 2. useEffect para Recálculo Automático

Adicionado após os estados do componente:

```typescript
// 🧮 Recalcula campos computados para cada item do array
useEffect(() => {
  const computedFields = fields.filter(
    (f) => f.computed && f.computedDependencies
  );

  if (computedFields.length === 0 || !Array.isArray(value)) return;

  console.log(
    "🧮 [ArrayField] Computed fields detectados:",
    computedFields.map((f) => ({
      name: f.name,
      computed: f.computed,
      dependencies: f.computedDependencies,
    }))
  );

  let hasChanges = false;
  const newValue = value.map((item, index) => {
    if (typeof item !== "object" || item === null) return item;

    const itemObj = item as Record<string, unknown>;
    const updatedItem = { ...itemObj };

    computedFields.forEach((field) => {
      if (!field.computed) return;

      const computedValue = executeComputedField(field.computed, itemObj);

      if (computedValue !== null && computedValue !== itemObj[field.name]) {
        console.log(
          `🧮 [ArrayField] Item ${index}: ${field.name} = "${computedValue}"`
        );
        updatedItem[field.name] = computedValue;
        hasChanges = true;
      }
    });

    return updatedItem;
  });

  if (hasChanges) {
    onChange(newValue);
  }
}, [value, fields, onChange]);
```

**O que faz:**

- Observa mudanças em `value` (array de itens)
- Para cada item, executa funções computadas
- Atualiza apenas se houver mudanças (evita loops infinitos)
- Log para debug de cada recálculo

### 3. Renderização Readonly para Computed Fields

Modificado onde os campos são renderizados:

```typescript
{regularFields.map((field) => (
  <FormField key={field.name} label={field.label} required={field.required}>
    {/* 🧮 Campos computados são readonly */}
    {field.computed ? (
      <FormInput
        type="text"
        value={String(itemObj[field.name] || "")}
        onChange={() => {}} // No-op
        disabled={true}
        required={field.required}
        className="bg-gray-100 cursor-not-allowed"
      />
    ) : field.type === "select" ? (
      // ... select normal ...
    ) : (
      // ... input normal ...
    )}
  </FormField>
))}
```

**O que faz:**

- Verifica se campo tem `field.computed`
- Se sim, renderiza como input readonly com fundo cinza
- Se não, renderiza normalmente (select ou input editável)

## Como Testar Agora

### 1. Recarregue a Página

Faça um **hard refresh**: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

### 2. Acesse Formulário de Evento

Crie ou edite um evento.

### 3. Adicione uma Categoria

Clique em **"Adicionar Categoria"** no ArrayField.

### 4. Veja os Logs no Console

Você deve ver:

```javascript
🧮 [ArrayField] Computed fields detectados: [
  {
    name: "name",
    computed: "categoryName",
    dependencies: ["distance", "gender", "minAge", "maxAge"]
  }
]
```

### 5. Preencha os Campos

**Dentro da categoria:**

- **Distância:** 5
- **Gênero:** Masculino
- **Idade Mínima:** 30
- **Idade Máxima:** 39

### 6. Veja o Campo "Nome" Auto-Preencher

Você deve ver:

- Log: `🧮 [ArrayField] Item 0: name = "5KM - Masculino - 30 a 39 anos"`
- Campo **"Nome"** com fundo cinza (readonly)
- Valor: **"5KM - Masculino - 30 a 39 anos"**

### 7. Teste o Recálculo

Mude **Gênero** para **Feminino**:

- Log: `🧮 [ArrayField] Item 0: name = "5KM - Feminino - 30 a 39 anos"`
- Campo **"Nome"** recalcula automaticamente

## Diferença: EntityForm vs ArrayField

### EntityForm (Primeiro Nível)

```typescript
// Campos do próprio evento (nome do evento, data, cidade, etc.)
useEffect(() => {
  const computedFields = metadata.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.computed && field.computedDependencies);
  // ... recalcula ...
}, [formData, metadata.sections]);
```

### ArrayField (Itens Nested)

```typescript
// Campos dentro de cada categoria (nome da categoria, etc.)
useEffect(() => {
  const computedFields = fields.filter(
    (f) => f.computed && f.computedDependencies
  );
  const newValue = value.map((item, index) => {
    // ... recalcula para cada item ...
  });
}, [value, fields, onChange]);
```

## Arquivos Modificados

- ✅ `/src/components/Generic/ArrayField.tsx`
  - Import de `useEffect` e `executeComputedField`
  - useEffect para recálculo automático de cada item
  - Renderização condicional para campos computados (readonly)

## Status

✅ **IMPLEMENTADO** - Computed fields agora funcionam em:

1. ✅ Campos de primeiro nível (EntityForm)
2. ✅ Campos nested (ArrayField)

## Próximo Passo

**TESTE NO NAVEGADOR!**

1. Recarregue a página (hard refresh)
2. Adicione uma categoria em um evento
3. Preencha distância, gênero e idades
4. Veja o campo "Nome" recalcular automaticamente! 🎉
