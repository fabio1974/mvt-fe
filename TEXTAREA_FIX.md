# Fix: Textarea não Aparecia no Formulário

## Problema Identificado

Campos com `type: "textarea"` no backend estavam sendo renderizados como `<input>` comum ao invés de `<textarea>`.

### Sintomas

- Campo `description` (evento) aparecia como input text
- Campo `observations` (categoria) aparecia como input text
- Largura dupla não era aplicada

## Causa Raiz

O conversor de metadata (`metadataConverter.ts`) não estava mapeando corretamente o tipo `"textarea"` do backend.

### Código Problemático

```typescript
function mapFieldType(backendType: string): FormFieldMetadata["type"] {
  const typeMap: Record<string, FormFieldMetadata["type"]> = {
    string: "text",
    integer: "number",
    // ... outros tipos
    // ❌ FALTAVA: 'textarea': 'textarea'
  };

  return typeMap[backendType] || "text"; // ← Convertia para 'text'!
}
```

### Fluxo do Problema

```
Backend                  metadataConverter            EntityForm
─────────               ─────────────────            ──────────
type: "textarea"   →    mapFieldType()        →     case "text"
                        return 'text' ❌             <input /> ❌
```

## Solução Implementada

### 1. Atualizado `metadataConverter.ts`

```typescript
function mapFieldType(backendType: string): FormFieldMetadata["type"] {
  const typeMap: Record<string, FormFieldMetadata["type"]> = {
    string: "text",
    text: "text",
    textarea: "textarea", // ✅ Preserva textarea!
    integer: "number",
    long: "number",
    double: "number",
    number: "number",
    currency: "number", // ✅ Adiciona currency
    boolean: "boolean",
    date: "date",
    datetime: "date",
    enum: "select",
    select: "select",
    city: "city",
    entity: "entity", // ✅ Adiciona entity
    nested: "array", // ✅ Adiciona nested
  };

  return typeMap[backendType] || "text";
}
```

### 2. Fluxo Correto Agora

```
Backend                  metadataConverter            EntityForm
─────────               ─────────────────            ──────────
type: "textarea"   →    mapFieldType()        →     case "textarea"
                        return 'textarea' ✅         <FormTextarea /> ✅
                                                     + grid-column: span 2 ✅
```

## Metadata do Backend (Exemplo)

### Campo `description` (Evento)

```json
{
  "name": "description",
  "label": "Descrição",
  "type": "textarea", // ← Backend envia "textarea"
  "hiddenFromForm": false, // ← Deve aparecer no form
  "hiddenFromTable": true, // ← Não aparece na tabela
  "required": false
}
```

### Campo `observations` (Categoria - nested)

```json
{
  "name": "observations",
  "label": "Observações",
  "type": "textarea", // ← Backend envia "textarea"
  "hiddenFromForm": false,
  "hiddenFromTable": true,
  "required": false
}
```

## Componentes Afetados

### ✅ EntityForm.tsx

- **Case `"textarea"`:** Já existia, funcionando
- **Renderiza:** `<FormTextarea />`
- **Largura dupla:** Aplicada via `.form-field-wide`

### ✅ ArrayField.tsx

- **Case `field.type === "textarea"`:** Já existia, funcionando
- **Renderiza:** `<FormTextarea />`
- **Grid responsivo:** `minmax(200px, 1fr)`

### ✅ FormComponents.tsx

- **`FormTextarea`:** Implementado corretamente
- **Renderiza:** `<textarea className="form-textarea" />`

### ✅ FormComponents.css

- **`.form-textarea`:** Estilizado corretamente
  - `min-height: 80px`
  - `resize: vertical`
  - `font-family: inherit`

### ✅ metadataConverter.ts (CORRIGIDO)

- **`mapFieldType()`:** Agora preserva `"textarea"`
- **Também adicionado:**
  - `currency` → `number`
  - `entity` → `entity`
  - `nested` → `array`

## Verificação

### Backend deve enviar:

```json
{
  "formFields": [
    {
      "name": "description",
      "type": "textarea", // ← "textarea" literal
      "hiddenFromForm": false // ← false para aparecer
    }
  ]
}
```

### Frontend renderiza:

```tsx
<div className="form-field-wide">  {/* Largura dupla */}
  <FormField label="Descrição">
    <FormTextarea              {/* Textarea real */}
      value={formData.description}
      onChange={...}
    />
  </FormField>
</div>
```

### CSS aplicado:

```css
.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-field-wide {
  grid-column: span 2; /* Ocupa 2 colunas */
}
```

## Resultado Final

### Desktop

```
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Nome      │ │ Tipo      │ │ Data      │
└───────────┘ └───────────┘ └───────────┘

┌─────────────────────────────────────┐
│ Descrição (textarea, largura dupla) │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Categorias (ArrayField)

```
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Nome      │ │ Idade Min │ │ Idade Max │
└───────────┘ └───────────┘ └───────────┘

┌───────────┐ ┌───────────┐
│ Preço     │ │ Max Part. │
└───────────┘ └───────────┘

┌─────────────────────────────────────┐
│ Observações (textarea)              │
│                                     │
└─────────────────────────────────────┘
```

## Tipos Agora Mapeados Corretamente

| Backend Type   | Frontend Type  | Componente                 |
| -------------- | -------------- | -------------------------- |
| `string`       | `text`         | FormInput                  |
| `text`         | `text`         | FormInput                  |
| **`textarea`** | **`textarea`** | **FormTextarea** ✅        |
| `number`       | `number`       | FormInput type="number"    |
| `currency`     | `number`       | FormInput type="number"    |
| `boolean`      | `boolean`      | Checkbox                   |
| `date`         | `date`         | FormDatePicker             |
| `datetime`     | `date`         | FormDatePicker showTime    |
| `select`       | `select`       | FormSelect                 |
| `entity`       | `entity`       | CityTypeahead/EntitySelect |
| `nested`       | `array`        | ArrayField                 |

## Resumo

✅ **Causa:** `mapFieldType()` não tinha mapeamento para `"textarea"`  
✅ **Solução:** Adicionado `'textarea': 'textarea'` no typeMap  
✅ **Resultado:** Textareas agora renderizam corretamente  
✅ **Bonus:** Adicionados outros tipos faltantes (`currency`, `entity`, `nested`)  
✅ **Largura dupla:** Funcionando via `.form-field-wide`  
✅ **ArrayField:** Funcionando com textareas nos campos filhos

**Agora os campos textarea aparecem corretamente em todos os formulários!** 📝✨
