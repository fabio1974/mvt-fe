# Layout Inteligente de Formulários por Largura

## Visão Geral

O sistema de formulários agora organiza automaticamente os campos em linhas de forma inteligente, baseado nas larguras definidas pelo backend. Isso cria um layout mais harmônico e otimizado.

## Como Funciona

### 1. Backend Envia Larguras em Pixels

```json
{
  "formFields": [
    { "name": "name", "label": "Nome", "width": 400 },
    { "name": "slug", "label": "URL", "width": 300 },
    { "name": "eventType", "label": "Tipo", "width": 200 },
    { "name": "eventDate", "label": "Data", "width": 200 },
    { "name": "description", "label": "Descrição", "width": 800 }
  ]
}
```

### 2. Frontend Converte para Grid 12 Colunas

| Pixels | Grid | Percentual | Uso Típico                       |
| ------ | ---- | ---------- | -------------------------------- |
| ≤ 80   | 1    | ~8%        | Ícones, switches muito pequenos  |
| ≤ 140  | 2    | ~16%       | Números pequenos, códigos        |
| ≤ 210  | 3    | 25%        | Datas, horários                  |
| ≤ 280  | 4    | 33%        | Valores monetários, percentuais  |
| ≤ 350  | 5    | 42%        | Selects médios                   |
| ≤ 420  | 6    | 50%        | **Padrão** - Campos médios       |
| ≤ 490  | 7    | 58%        | Campos maiores                   |
| ≤ 560  | 8    | 67%        | Campos grandes                   |
| ≤ 630  | 9    | 75%        | Campos muito grandes             |
| ≤ 700  | 10   | 83%        | Quase linha inteira              |
| ≤ 770  | 11   | 92%        | Quase linha inteira              |
| > 770  | 12   | 100%       | Linha inteira (textarea, arrays) |

### 3. Algoritmo de Organização Automática

```typescript
const organizeFieldsByWidth = (
  fields: FormFieldMetadata[]
): FormFieldMetadata[][] => {
  const rows: FormFieldMetadata[][] = [];
  let currentRow: FormFieldMetadata[] = [];
  let currentRowWidth = 0;
  const maxRowWidth = 12;

  fields.forEach((field) => {
    // ArrayFields sempre ocupam linha inteira
    if (field.type === "array") {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
      rows.push([field]);
      return;
    }

    const fieldWidth = convertPixelsToGridWidth(field.width);

    // Se exceder largura máxima, inicia nova linha
    if (currentRowWidth + fieldWidth > maxRowWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }

    currentRow.push(field);
    currentRowWidth += fieldWidth;
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};
```

## Exemplo Prático

### Backend Envia (pixels):

```
Nome: 400px
URL: 300px
Tipo: 200px
Data: 200px
Horário: 200px
Local: 300px
Descrição: 800px
```

### Frontend Organiza Automaticamente:

**Linha 1:**

```
┌─────────────────────┬──────────────┐
│  Nome (400px = 6)   │  URL (300px = 5)  │
│       50%           │      42%          │
└─────────────────────┴──────────────┘
Total: 11/12 colunas (~92%)
```

**Linha 2:**

```
┌───────────┬───────────┬───────────┐
│  Tipo     │  Data     │  Horário  │
│  (200=3)  │  (200=3)  │  (200=3)  │
│   25%     │   25%     │   25%     │
└───────────┴───────────┴───────────┘
Total: 9/12 colunas (75%)
```

**Linha 3:**

```
┌──────────────────────┐
│  Local (300px = 5)   │
│        42%           │
└──────────────────────┘
Total: 5/12 colunas (42%)
```

**Linha 4:**

```
┌─────────────────────────────────────┐
│      Descrição (800px = 12)         │
│              100%                   │
└─────────────────────────────────────┘
Total: 12/12 colunas (100%)
```

## Regras de Layout

### 1. ArrayFields = Linha Inteira

```typescript
if (field.type === "array") {
  rows.push([field]); // Sempre sozinho na linha
}
```

**Exemplo:**

```
┌─────────────────────────────────────┐
│        Categorias (Array)           │
│  ┌──────────┬──────────┬──────────┐ │
│  │ Categoria 1         │ Preço     │ │
│  └──────────┴──────────┴──────────┘ │
└─────────────────────────────────────┘
```

### 2. Campos Combinam até 12 Colunas

```typescript
if (currentRowWidth + fieldWidth > 12) {
  // Inicia nova linha
}
```

**Exemplo:**

```
Nome (6) + URL (5) = 11 ✅ (cabe na linha)
Nome (6) + URL (5) + Tipo (3) = 14 ❌ (não cabe, Tipo vai para próxima linha)
```

### 3. Largura Padrão = 6 (50%)

```typescript
const gridWidth = convertPixelsToGridWidth(field.width);
// Se width === undefined → gridWidth = 6
```

## Benefícios do Layout Inteligente

### ✅ Antes (Layout Manual)

```tsx
// Desenvolvedor tinha que definir manualmente
<FormRow columns={2}>
  <FormField>Nome</FormField>
  <FormField>URL</FormField>
</FormRow>
<FormRow columns={3}>
  <FormField>Tipo</FormField>
  <FormField>Data</FormField>
  <FormField>Horário</FormField>
</FormRow>
```

### ✅ Agora (Layout Automático)

```tsx
// Organiza automaticamente baseado nas larguras do backend
{
  organizedFields.map((row, rowIndex) => (
    <FormRow key={rowIndex} columns={12}>
      {row.map(renderField)}
    </FormRow>
  ));
}
```

### Vantagens:

1. **Harmonia Visual**: Campos se organizam naturalmente
2. **Otimização de Espaço**: Máximo aproveitamento da linha
3. **Flexibilidade**: Backend controla completamente o layout
4. **Responsividade**: Sistema baseado em percentuais
5. **Manutenção Zero**: Não precisa ajustar código frontend

## Backend - Como Definir Larguras

### Regra Geral

```java
// Campos pequenos (datas, números, selects pequenos)
field.setWidth(200); // 3 colunas (25%)

// Campos médios (nomes, emails, selects médios)
field.setWidth(400); // 6 colunas (50%)

// Campos grandes (descrições curtas, URLs)
field.setWidth(500); // 8 colunas (67%)

// Campos muito grandes (textarea, observações)
field.setWidth(800); // 12 colunas (100%)
```

### Exemplo Completo - Java

```java
public List<FieldMetadata> createEventFormFields() {
    List<FieldMetadata> fields = new ArrayList<>();

    // Linha 1: Nome (50%) + URL (42%)
    fields.add(createField("name", "Nome", "string", 400));
    fields.add(createField("slug", "URL Amigável", "string", 300));

    // Linha 2: Tipo (25%) + Data (25%) + Horário (25%)
    fields.add(createField("eventType", "Tipo", "select", 200));
    fields.add(createField("eventDate", "Data", "date", 200));
    fields.add(createField("eventTime", "Horário", "string", 200));

    // Linha 3: Local (42%)
    fields.add(createField("location", "Local", "string", 300));

    // Linha 4: Descrição (100%)
    fields.add(createField("description", "Descrição", "textarea", 800));

    // Linha 5: Categorias (100% - array sempre ocupa linha inteira)
    fields.add(createArrayField("categories", "Categorias"));

    return fields;
}
```

## Casos Especiais

### Caso 1: Campos Não Cabem na Linha

```
Campo1 (8 cols) + Campo2 (6 cols) = 14 cols > 12
Resultado:
  Linha 1: Campo1 (8 cols)
  Linha 2: Campo2 (6 cols)
```

### Caso 2: ArrayField Quebra Linha

```
Campo1 (6) + Campo2 (4) + ArrayField
Resultado:
  Linha 1: Campo1 (6) + Campo2 (4) = 10 cols
  Linha 2: ArrayField (12 cols)
```

### Caso 3: Múltiplos Campos Pequenos

```
5 campos de 200px (3 cols cada) = 15 cols total
Resultado:
  Linha 1: Campo1 (3) + Campo2 (3) + Campo3 (3) + Campo4 (3) = 12 cols
  Linha 2: Campo5 (3)
```

## Customização no Frontend

### Forçar Campo em Linha Própria

```java
// Backend: Use largura 800+ para forçar 100%
field.setWidth(800); // 12 colunas = linha inteira
```

### Agrupar Campos Relacionados

```java
// Backend: Use mesma faixa de largura
field1.setWidth(400); // 6 colunas
field2.setWidth(400); // 6 colunas
// Resultado: field1 + field2 na mesma linha (6+6=12)
```

## Responsividade Futura

```css
/* Mobile: Força todos os campos para 100% */
@media (max-width: 768px) {
  .form-field-wrapper {
    width: 100% !important;
  }
}
```

## Debugging

### Ver Layout no Console

```typescript
console.log(
  "Organized Fields:",
  organizedFields.map((row, i) => ({
    row: i + 1,
    fields: row.map(
      (f) => `${f.name} (${convertPixelsToGridWidth(f.width)} cols)`
    ),
    totalWidth: row.reduce(
      (sum, f) => sum + convertPixelsToGridWidth(f.width),
      0
    ),
  }))
);
```

### Exemplo de Output:

```javascript
[
  { row: 1, fields: ["name (6)", "slug (5)"], totalWidth: 11 },
  {
    row: 2,
    fields: ["eventType (3)", "eventDate (3)", "eventTime (3)"],
    totalWidth: 9,
  },
  { row: 3, fields: ["description (12)"], totalWidth: 12 },
  { row: 4, fields: ["categories (12)"], totalWidth: 12 },
];
```

## Referências

- Conversão Pixels → Grid: `src/components/Generic/EntityForm.tsx` (convertPixelsToGridWidth)
- Organização de Linhas: `src/components/Generic/EntityForm.tsx` (organizeFieldsByWidth)
- Renderização: `src/components/Generic/EntityForm.tsx` (renderSection)
- Grid System: `docs/frontend/FORM_GRID_SYSTEM.md`
