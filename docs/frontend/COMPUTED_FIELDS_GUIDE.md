# Computed Fields Guide

## Overview

Campos computados (computed fields) são campos cujo valor é **calculado automaticamente** com base em outros campos do formulário. O usuário não pode editá-los diretamente - eles são sempre readonly e recalculados em tempo real quando os campos dependentes mudam.

## Como Funciona

### 1. Backend Configuration

O backend deve configurar o campo com as propriedades `computed` e `computedDependencies` no metadata:

```json
{
  "name": "name",
  "type": "text",
  "label": "Nome",
  "required": true,
  "computed": "categoryName",
  "computedDependencies": ["distance", "gender", "minAge", "maxAge"]
}
```

**Propriedades:**

- `computed`: Nome da função de cálculo a ser executada (deve existir no registry)
- `computedDependencies`: Array de nomes de campos que, quando mudarem, disparam o recálculo

### 2. Frontend Auto-Recalculation

O `EntityForm.tsx` possui um `useEffect` que:

1. Detecta todos os campos com `computed` na metadata
2. Observa mudanças no `formData`
3. Quando detecta mudança, executa a função computada
4. Atualiza o valor do campo automaticamente

```typescript
useEffect(() => {
  const computedFields = metadata.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.computed && field.computedDependencies);

  computedFields.forEach((field) => {
    const result = executeComputedField(field.computed, formData);
    if (result !== null && result !== formData[field.name]) {
      setFormData((prev) => ({ ...prev, [field.name]: result }));
    }
  });
}, [formData, metadata.sections]);
```

### 3. Readonly Rendering com Destaque Visual

Campos computados são sempre renderizados como **readonly** com destaque visual em azul:

```tsx
if (field.computed) {
  return (
    <FormField label={field.label} required={field.required} error={error}>
      <FormInput
        type="text"
        value={stringValue}
        disabled={true}
        className="bg-gray-100 cursor-not-allowed highlighted-computed-field"
      />
    </FormField>
  );
}
```

**Estilo Visual (`highlighted-computed-field.css`):**

```css
.highlighted-computed-field {
  border: 2px solid #3b82f6 !important; /* Borda azul */
  background-color: #dbeafe !important; /* Fundo azul claro */
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3) !important; /* Sombra azul */
  font-weight: 500 !important; /* Negrito */
  color: #1e40af !important; /* Texto azul escuro */
}
```

**Resultado:**

- 🔵 Campo facilmente identificável como "automático"
- 🔵 Borda e fundo azuis
- 🔵 Texto em negrito e azul escuro
- 🔵 Cursor "not-allowed" ao passar o mouse

````

## Funções Computadas Disponíveis

### `categoryName`

**Propósito:** Gera nome de categoria combinando distância, unidade, gênero e faixa etária.

**Dependências:**

- `distance` (number): Distância (ex: 5, 10, 42.195)
- `distanceUnit` (string): Unidade (KM, M, MI) - default: KM
- `gender` (string): MALE, FEMALE, MIXED, OTHER
- `minAge` (number): Idade mínima
- `maxAge` (number): Idade máxima

**Formato de Saída:**

- `"5KM - Masculino - 30 a 39"` (ambas idades)
- `"10KM - Feminino - 60+"` (só idade mínima = 60 anos ou mais)
- `"21KM - Misto - Sub-18"` (só idade máxima ≤ 18 = menores de 18)
- `"42.195KM - Feminino - até 25"` (só idade máxima > 18)
- `"100M - Masculino - Geral"` (sem restrição de idade)
- `"10MI - Feminino - 40 a 49"` (milhas)
- `"Nova Categoria"` (fallback quando campos estão vazios)

**Lógica:**

```typescript
export function categoryName(formData: Record<string, unknown>): string {
  const distance = formData.distance;
  const distanceUnit = formData.distanceUnit;
  const gender = formData.gender;
  const minAge = formData.minAge;
  const maxAge = formData.maxAge;

  const parts: string[] = [];

  // 1️⃣ Distância com unidade: "5KM", "100M", "10MI"
  if (distance) {
    const unit = distanceUnit ? String(distanceUnit).toUpperCase() : "KM";
    parts.push(`${distance}${unit}`);
  }

  // 2️⃣ Gênero: traduz para português
  const genderMap: Record<string, string> = {
    MALE: "Masculino",
    FEMALE: "Feminino",
    MIXED: "Misto",
    OTHER: "Outro",
  };
  if (gender && genderMap[String(gender)]) {
    parts.push(genderMap[String(gender)]);
  }

  // 3️⃣ Faixa etária (formato usado em eventos esportivos)
  const minAgeNum = minAge ? Number(minAge) : null;
  const maxAgeNum = maxAge ? Number(maxAge) : null;

  if (minAgeNum !== null || maxAgeNum !== null) {
    if (minAgeNum !== null && maxAgeNum !== null) {
      // Ambos: "30 a 39", "40 a 49"
      parts.push(`${minAgeNum} a ${maxAgeNum}`);
    } else if (minAgeNum !== null && maxAgeNum === null) {
      // Só mínima: "60+" (60 anos ou mais)
      parts.push(`${minAgeNum}+`);
    } else if (minAgeNum === null && maxAgeNum !== null) {
      // Só máxima: "Sub-18" (menores de 18), "até 25"
      if (maxAgeNum <= 18) {
        parts.push(`Sub-${maxAgeNum}`);
      } else {
        parts.push(`até ${maxAgeNum}`);
      }
    }
  } else {
    // Sem restrição: "Geral"
    parts.push("Geral");
  }

  return parts.join(" - ") || "Nova Categoria";
}
````

## Como Criar Novas Funções Computadas

### 1. Adicionar Função no Registry

Edite `/src/utils/computedFields.ts`:

```typescript
export function myCustomFunction(formData: Record<string, unknown>): string {
  const field1 = formData.field1 as string | undefined;
  const field2 = formData.field2 as number | undefined;

  // Lógica de cálculo
  if (!field1 || !field2) {
    return "Valor Padrão";
  }

  return `${field1} - ${field2}`;
}

// Adicionar no registry
export const computedFieldFunctions: Record<string, ComputedFieldFunction> = {
  categoryName,
  myCustomFunction, // ✅ Nova função
};
```

### 2. Configurar no Backend

```json
{
  "name": "computedField",
  "type": "text",
  "label": "Campo Calculado",
  "computed": "myCustomFunction",
  "computedDependencies": ["field1", "field2"]
}
```

### 3. Pronto!

O frontend detectará automaticamente o campo computado e:

- Executará `myCustomFunction` quando `field1` ou `field2` mudarem
- Renderizará o campo como readonly
- Atualizará o valor em tempo real

## Exemplo Completo: Categoria de Corrida

### Backend Metadata

```json
{
  "sections": [
    {
      "id": "basic-info",
      "title": "Informações Básicas",
      "fields": [
        {
          "name": "distance",
          "type": "number",
          "label": "Distância (KM)",
          "required": true,
          "width": 1
        },
        {
          "name": "gender",
          "type": "enum",
          "label": "Gênero",
          "required": true,
          "options": [
            { "value": "MALE", "label": "Masculino" },
            { "value": "FEMALE", "label": "Feminino" },
            { "value": "MIXED", "label": "Misto" },
            { "value": "OTHER", "label": "Outro" }
          ],
          "width": 1
        },
        {
          "name": "minAge",
          "type": "number",
          "label": "Idade Mínima",
          "validation": { "min": 0, "max": 120 },
          "width": 1
        },
        {
          "name": "maxAge",
          "type": "number",
          "label": "Idade Máxima",
          "validation": { "min": 0, "max": 120 },
          "width": 1
        },
        {
          "name": "name",
          "type": "text",
          "label": "Nome da Categoria",
          "required": true,
          "computed": "categoryName",
          "computedDependencies": ["distance", "gender", "minAge", "maxAge"],
          "width": 2
        }
      ]
    }
  ]
}
```

### Comportamento no Frontend

1. **Criação:**

   - Usuário preenche: `distance=5`, `gender=MALE`, `minAge=30`, `maxAge=39`
   - Campo `name` auto-preenche: `"5KM - Masculino - 30 a 39 anos"`
   - Campo `name` é readonly (fundo cinza, cursor not-allowed)

2. **Edição:**

   - Usuário muda `gender` para `FEMALE`
   - Campo `name` recalcula instantaneamente: `"5KM - Feminino - 30 a 39 anos"`

3. **Visualização:**
   - Campo `name` exibe o valor calculado em modo readonly

## Vantagens

✅ **Consistência:** Valores calculados sempre seguem a mesma lógica  
✅ **Sem duplicação:** Usuário não precisa digitar manualmente  
✅ **Validação:** Impossível ter valores inconsistentes  
✅ **Reatividade:** Recalcula automaticamente quando dependências mudam  
✅ **Genérico:** Sistema não precisa ser modificado para novos campos computados  
✅ **Metadata-driven:** Tudo configurável pelo backend

## Considerações de Performance

- O `useEffect` observa todo o `formData`, então é executado em **toda mudança de campo**
- Funções computadas devem ser **rápidas e síncronas**
- Para cálculos complexos, considere adicionar memoization ou debounce
- O sistema verifica se o valor mudou antes de atualizar (`result !== formData[field.name]`)

## Troubleshooting

### Campo não está recalculando

1. **Verifique o metadata:** Campo tem `computed` e `computedDependencies`?
2. **Verifique o registry:** Função existe em `computedFieldFunctions`?
3. **Console:** Olhe erros no console do navegador
4. **Debug:** Adicione `console.log` na função computada

### Valor está incorreto

1. **Tipos de dados:** Verifique se os campos dependentes têm os valores esperados
2. **Fallback:** Função deve ter valor padrão para casos incompletos
3. **Null/undefined:** Trate casos onde campos dependentes estão vazios

### Campo não está readonly

1. **Verifique renderField:** Campo com `field.computed` deve retornar early
2. **CSS:** Classe `bg-gray-100 cursor-not-allowed` está aplicada?
3. **Disabled:** Propriedade `disabled={true}` está configurada?

## Próximos Passos

1. **Async Computed Fields:** Suporte para cálculos que dependem de API calls
2. **Computed Arrays:** Campos computados que retornam arrays ou objetos
3. **Conditional Computed:** Campos que são computados apenas sob certas condições
4. **Computed in Tables:** Mostrar valores computados nas tabelas também
