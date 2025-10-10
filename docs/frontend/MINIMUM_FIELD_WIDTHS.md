# Larguras Mínimas para Tipos de Campo

## Visão Geral

Alguns tipos de campo têm larguras mínimas para garantir que o layout fique correto, especialmente quando o label precisa aparecer na mesma linha do controle.

## Campos Boolean (Checkbox)

### Problema

Checkboxes com labels precisam de espaço suficiente para exibir:

- ☑️ Checkbox (18px)
- 📏 Gap (8px)
- 📝 Label (texto variável)

### Solução Implementada

**Largura Mínima: 3 colunas (25%)**

```typescript
// Frontend ajusta automaticamente
const convertPixelsToGridWidth = (
  pixels?: number,
  fieldType?: string
): number => {
  if (fieldType === "boolean") {
    if (!pixels || pixels < 210) {
      return 3; // Mínimo 3 colunas (25%) para boolean
    }
  }
  // ... resto da conversão
};
```

### Backend - Como Definir

#### ❌ Problema (Largura Muito Pequena)

```java
FieldMetadata field = new FieldMetadata();
field.setName("isActive");
field.setLabel("Ativo");
field.setType("boolean");
field.setWidth(100); // ← Muito pequeno!

// Resultado: Frontend ajusta automaticamente para 210px (3 colunas)
```

#### ✅ Solução 1 - Largura Adequada

```java
FieldMetadata field = new FieldMetadata();
field.setName("isActive");
field.setLabel("Ativo");
field.setType("boolean");
field.setWidth(200); // ← 3 colunas (25%)
```

#### ✅ Solução 2 - Sem Largura (Usa Mínimo Automaticamente)

```java
FieldMetadata field = new FieldMetadata();
field.setName("isActive");
field.setLabel("Ativo");
field.setType("boolean");
// Sem setWidth() → Frontend usa mínimo 3 colunas
```

#### ✅ Solução 3 - Largura Maior

```java
FieldMetadata field = new FieldMetadata();
field.setName("registrationOpen");
field.setLabel("Inscrições Abertas");
field.setType("boolean");
field.setWidth(300); // ← 5 colunas (42%) - para labels longos
```

## Larguras Recomendadas por Tipo de Campo

| Tipo               | Largura Mínima | Largura Recomendada | Pixels | Colunas | %    |
| ------------------ | -------------- | ------------------- | ------ | ------- | ---- |
| **boolean**        | 210px          | 200-300px           | 200    | 3       | 25%  |
| **number**         | 140px          | 140-200px           | 150    | 2       | 16%  |
| **date**           | 210px          | 200px               | 200    | 3       | 25%  |
| **time**           | 140px          | 150px               | 150    | 2       | 16%  |
| **select (curto)** | 210px          | 200px               | 200    | 3       | 25%  |
| **select (médio)** | 280px          | 300px               | 300    | 5       | 42%  |
| **text (curto)**   | 210px          | 300px               | 300    | 5       | 42%  |
| **text (médio)**   | 350px          | 400px               | 400    | 6       | 50%  |
| **text (longo)**   | 560px          | 600px               | 600    | 9       | 75%  |
| **email/url**      | 420px          | 500px               | 500    | 8       | 67%  |
| **textarea**       | 800px          | 800px               | 800    | 12      | 100% |
| **array**          | 800px          | 800px               | 800    | 12      | 100% |

## Exemplos Práticos

### Exemplo 1: Múltiplos Booleans na Mesma Linha

```java
public List<FieldMetadata> createEventFormFields() {
    List<FieldMetadata> fields = new ArrayList<>();

    // 3 booleans na mesma linha (3 + 3 + 3 = 9 colunas)
    fields.add(createBooleanField("isActive", "Ativo", 200));           // 3 cols
    fields.add(createBooleanField("isFeatured", "Destaque", 200));     // 3 cols
    fields.add(createBooleanField("isPublic", "Público", 200));        // 3 cols

    return fields;
}

private FieldMetadata createBooleanField(String name, String label, Integer width) {
    FieldMetadata field = new FieldMetadata();
    field.setName(name);
    field.setLabel(label);
    field.setType("boolean");
    field.setWidth(width);
    return field;
}
```

**Resultado Visual:**

```
┌──────────┬──────────┬──────────┐
│ ☑ Ativo  │☑ Destaque│ ☑ Público│
└──────────┴──────────┴──────────┘
```

### Exemplo 2: Boolean com Label Longo

```java
FieldMetadata field = new FieldMetadata();
field.setName("registrationOpen");
field.setLabel("Inscrições Abertas para Participantes");
field.setType("boolean");
field.setWidth(400); // ← 6 colunas (50%) para label longo
```

**Resultado Visual:**

```
┌─────────────────────────────────────────┐
│ ☑ Inscrições Abertas para Participantes │
└─────────────────────────────────────────┘
```

### Exemplo 3: Mix de Campos com Boolean

```java
public List<FieldMetadata> createEventFormFields() {
    List<FieldMetadata> fields = new ArrayList<>();

    // Linha 1: Nome (6) + Status (3) + Ativo (3) = 12 cols
    fields.add(createField("name", "Nome", "string", 400));           // 6 cols
    fields.add(createField("status", "Status", "select", 200));       // 3 cols
    fields.add(createBooleanField("isActive", "Ativo", 200));         // 3 cols

    // Linha 2: Data (3) + Horário (3) + Público (3) + Destaque (3) = 12 cols
    fields.add(createField("eventDate", "Data", "date", 200));        // 3 cols
    fields.add(createField("eventTime", "Horário", "string", 200));   // 3 cols
    fields.add(createBooleanField("isPublic", "Público", 200));       // 3 cols
    fields.add(createBooleanField("isFeatured", "Destaque", 200));    // 3 cols

    return fields;
}
```

**Resultado Visual:**

```
Linha 1:
┌────────────────────┬──────────┬──────────┐
│ Nome               │ Status   │ ☑ Ativo  │
└────────────────────┴──────────┴──────────┘

Linha 2:
┌──────────┬──────────┬──────────┬──────────┐
│ Data     │ Horário  │ ☑ Público│☑ Destaque│
└──────────┴──────────┴──────────┴──────────┘
```

## Layout do Checkbox

### Estrutura HTML/CSS

```tsx
<div style={{ display: "flex", alignItems: "center", minHeight: "40px" }}>
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      userSelect: "none",
    }}
  >
    <input
      type="checkbox"
      style={{
        width: "18px",
        height: "18px",
        cursor: "pointer",
      }}
    />
    <span style={{ fontSize: "14px", color: "#374151" }}>Label do Campo</span>
  </label>
</div>
```

### Cálculo de Espaço

```
┌─────────────────────────────────┐
│ [18px] [8px gap] [Texto variável]│
│   ☑     espaço    Label          │
└─────────────────────────────────┘

Espaço mínimo necessário:
- Checkbox: 18px
- Gap: 8px
- Label curto (ex: "Ativo"): ~50px
- Total: ~76px

Largura mínima segura: 200px (3 colunas = 25%)
```

## Casos Especiais

### Caso 1: Boolean em FormRow com 1 Coluna (Mobile)

```typescript
// Em telas pequenas, force 100% de largura
@media (max-width: 768px) {
  .form-field-wrapper {
    width: 100% !important;
  }
}
```

### Caso 2: Boolean com Tooltip/Help Text

```java
FieldMetadata field = new FieldMetadata();
field.setName("acceptTerms");
field.setLabel("Aceito os Termos e Condições");
field.setType("boolean");
field.setWidth(500); // ← 8 colunas (67%) para label longo
field.setHelpText("Ao marcar, você concorda com nossos termos");
```

### Caso 3: Boolean Obrigatório

```java
FieldMetadata field = new FieldMetadata();
field.setName("acceptTerms");
field.setLabel("Aceito os Termos");
field.setType("boolean");
field.setWidth(300);
field.setRequired(true); // ← Backend valida que deve ser true
```

## Validações Recomendadas

### Backend - Validação de Largura Mínima

```java
public void validateFieldMetadata(FieldMetadata field) {
    if ("boolean".equals(field.getType())) {
        if (field.getWidth() != null && field.getWidth() < 200) {
            // Aviso: largura muito pequena será ajustada
            logger.warn("Campo boolean '{}' com largura {} será ajustado para mínimo 200px",
                field.getName(), field.getWidth());
        }
    }
}
```

### Frontend - Ajuste Automático (Já Implementado)

```typescript
const convertPixelsToGridWidth = (
  pixels?: number,
  fieldType?: string
): number => {
  // Ajuste automático para boolean
  if (fieldType === "boolean") {
    if (!pixels || pixels < 210) {
      return 3; // Força mínimo 3 colunas
    }
  }
  // ... resto da conversão
};
```

## Benefícios

### ✅ Antes (Sem Largura Mínima)

```
┌──┬────────────────────────────────┐
│☑ Ativo                            │ ← Checkbox e label amontoados
└──┴────────────────────────────────┘
```

### ✅ Agora (Com Largura Mínima)

```
┌──────────┬───────────────────────┐
│ ☑ Ativo  │                       │ ← Layout balanceado
└──────────┴───────────────────────┘
```

### Vantagens:

1. ✅ **Legibilidade**: Label sempre tem espaço adequado
2. ✅ **Consistência**: Todos os booleans têm largura mínima uniforme
3. ✅ **UX**: Área clicável maior (todo o label é clicável)
4. ✅ **Automático**: Backend não precisa se preocupar com larguras pequenas
5. ✅ **Responsivo**: Funciona bem em diferentes tamanhos de tela

## Debugging

### Ver Larguras Calculadas

```typescript
// No EntityForm.tsx
console.log("Boolean field width:", {
  name: field.name,
  backendWidth: field.width,
  calculatedGrid: convertPixelsToGridWidth(field.width, field.type),
  percentage:
    (convertPixelsToGridWidth(field.width, field.type) / 12) * 100 + "%",
});
```

### Exemplo de Output

```javascript
{
  name: 'isActive',
  backendWidth: 100,
  calculatedGrid: 3,  // ← Ajustado de 1 para 3
  percentage: '25%'
}
```

## Referências

- Implementação: `src/components/Generic/EntityForm.tsx` (convertPixelsToGridWidth)
- Tipos: `src/types/metadata.ts` (FormFieldMetadata)
- Grid System: `docs/frontend/FORM_GRID_SYSTEM.md`
- Layout Inteligente: `docs/frontend/INTELLIGENT_FORM_LAYOUT.md`
