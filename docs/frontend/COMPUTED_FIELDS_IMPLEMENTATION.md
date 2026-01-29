    # ✅ COMPUTED FIELDS - Implementação Completa

## O Que Foi Implementado

Sistema genérico de **campos computados** - campos cujo valor é calculado automaticamente com base em outros campos do formulário.

## Caso de Uso: Nome de Categoria

**Problema:** Campo `name` da categoria precisa ser combinação de:

- `distance` (distância em KM)
- `gender` (gênero: MALE, FEMALE, MIXED, OTHER)
- `minAge` (idade mínima)
- `maxAge` (idade máxima)

**Formato esperado:** `"5KM - Masculino - 30 a 39 anos"`

**Solução:** Campo computado que recalcula automaticamente quando qualquer dependência muda.

## Arquivos Modificados

### 1. `/src/types/metadata.ts`

Adicionadas propriedades à interface `FormFieldMetadata`:

```typescript
export interface FormFieldMetadata {
  name: string;
  type: FieldType;
  label: string;
  // ... outras propriedades ...
  computed?: string; // ✅ NOVO: Nome da função de cálculo
  computedDependencies?: string[]; // ✅ NOVO: Campos que disparam recálculo
}
```

### 2. `/src/utils/computedFields.ts` (NOVO)

Criado sistema de registry de funções computadas:

```typescript
// Tipo para funções computadas
export type ComputedFieldFunction = (
  formData: Record<string, unknown>
) => string | null;

// Função para calcular nome de categoria
export function categoryName(formData: Record<string, unknown>): string {
  // Lógica: distância + gênero + faixa etária
  // Exemplo: "5KM - Masculino - 30 a 39 anos"
}

// Registry de todas as funções
export const computedFieldFunctions: Record<string, ComputedFieldFunction> = {
  categoryName,
  // Adicionar novas funções aqui
};

// Executor seguro
export function executeComputedField(
  functionName: string,
  formData: Record<string, unknown>
): string | null {
  const func = computedFieldFunctions[functionName];
  if (!func) return null;
  try {
    return func(formData);
  } catch (error) {
    console.error(`Erro ao executar computed field "${functionName}":`, error);
    return null;
  }
}
```

### 3. `/src/components/Generic/EntityForm.tsx`

**3.1. Import:**

```typescript
import { executeComputedField } from "../../utils/computedFields";
```

**3.2. useEffect para Recálculo (linhas ~195-220):**

```typescript
// 🧮 Recalcula campos computados quando suas dependências mudam
useEffect(() => {
  const computedFields = metadata.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.computed && field.computedDependencies);

  if (computedFields.length === 0) return;

  computedFields.forEach((field) => {
    if (!field.computed || !field.computedDependencies) return;

    const result = executeComputedField(field.computed, formData);

    if (result !== null && result !== formData[field.name]) {
      setFormData((prev) => ({
        ...prev,
        [field.name]: result,
      }));
    }
  });
}, [formData, metadata.sections]);
```

**3.3. Renderização Readonly (linhas ~460-480):**

```typescript
// 🧮 Campos computados são sempre readonly
if (field.computed) {
  return (
    <FormField label={field.label} required={field.required} error={error}>
      <FormInput
        type="text"
        placeholder={field.placeholder}
        value={stringValue}
        onChange={() => {}} // No-op
        disabled={true}
        required={field.required}
        className="bg-gray-100 cursor-not-allowed"
      />
    </FormField>
  );
}
```

## Como Usar

### Backend: Configurar Metadata

```json
{
  "name": "name",
  "type": "text",
  "label": "Nome da Categoria",
  "required": true,
  "computed": "categoryName",
  "computedDependencies": ["distance", "gender", "minAge", "maxAge"]
}
```

### Frontend: Automático!

1. **Detecção:** EntityForm detecta campo com `computed`
2. **Observação:** Monitora mudanças nos campos de `computedDependencies`
3. **Recálculo:** Executa função quando dependência muda
4. **Atualização:** Atualiza formData automaticamente
5. **Renderização:** Campo aparece readonly com fundo cinza

## Exemplos de Saída

| Inputs                | Output                           |
| --------------------- | -------------------------------- |
| 5KM, MALE, 30-39      | `5KM - Masculino - 30 a 39 anos` |
| 10KM, FEMALE, 60-null | `10KM - Feminino - 60+`          |
| 21KM, MIXED, null-25  | `21KM - Misto - até 25 anos`     |
| 5KM, MALE, null-null  | `5KM - Masculino`                |
| null, FEMALE, 30-39   | `Feminino - 30 a 39 anos`        |
| null, null, null-null | `Nova Categoria`                 |

## Vantagens

✅ **Genérico:** Não desmantela o CRUD genérico  
✅ **Metadata-driven:** Tudo configurável pelo backend  
✅ **Reativo:** Recalcula automaticamente  
✅ **Consistente:** Sempre usa a mesma lógica  
✅ **Extensível:** Fácil adicionar novas funções  
✅ **Type-safe:** TypeScript garante tipos corretos  
✅ **Error handling:** Tratamento de erros integrado

## Documentação

- **Frontend completo:** `/docs/frontend/COMPUTED_FIELDS_GUIDE.md`
- **Backend config:** `/docs/backend/COMPUTED_FIELDS_BACKEND.md`
- **Implementação:** `/src/utils/computedFields.ts`

## Próximas Funções Computadas

Para adicionar novas funções:

1. Criar função em `computedFields.ts`
2. Adicionar ao registry `computedFieldFunctions`
3. Documentar lógica e exemplos
4. Backend configura no metadata

**Exemplos futuros:**

- `fullAddress` - Combina rua, número, cidade, estado
- `fullName` - Combina nome + sobrenome
- `slug` - Gera slug a partir de título
- `sku` - Gera código baseado em categoria + tipo + tamanho

## Status: ✅ PRONTO PARA USO

O sistema está implementado, testado e documentado. Backend pode começar a configurar campos computados no metadata! 🚀
