# FIX: Computed Fields não Apareciam no Formulário

## Problema

Backend já estava enviando `computed` e `computedDependencies` no metadata:

```json
{
  "name": "name",
  "label": "Nome",
  "type": "string",
  "computed": "categoryName",
  "computedDependencies": ["distance", "gender", "minAge", "maxAge"]
}
```

Mas o frontend não estava aplicando a lógica de campos computados.

## Causa Raiz

O `metadataConverter.ts` estava convertendo os campos do backend (`FieldMetadata`) para campos de formulário (`FormFieldMetadata`), mas **não estava copiando** as propriedades `computed` e `computedDependencies`.

### Fluxo do Metadata

1. **Backend** → envia metadata com `computed` e `computedDependencies`
2. **useMetadata hook** → armazena no estado
3. **useFormMetadata hook** → chama `convertEntityMetadataToFormMetadata`
4. **metadataConverter** → converte FieldMetadata → FormFieldMetadata
   - ❌ **PROBLEMA ESTAVA AQUI**: não copiava `computed` e `computedDependencies`
5. **EntityForm** → usa FormFieldMetadata
   - useEffect não detectava campos computados porque propriedades estavam faltando

## Solução

### 1. Atualizar `FieldMetadata` (Backend Type)

Arquivo: `/src/types/metadata.ts`

```typescript
export interface FieldMetadata {
  // ... outras propriedades ...
  relationship?: RelationshipMetadata;
  // 🧮 Campos computados (ADICIONADO)
  computed?: string | null;
  computedDependencies?: string[] | null;
}
```

### 2. Copiar Propriedades no Converter

Arquivo: `/src/utils/metadataConverter.ts`

```typescript
function convertFieldToFormField(
  field: FieldMetadata
): FormFieldMetadata | null {
  // ... conversão normal ...

  // 🧮 Adiciona campos computados (ADICIONADO)
  if (field.computed) {
    formField.computed = field.computed;
    console.log(
      `✅ [metadataConverter] Campo computado detectado: ${field.name} -> função: ${field.computed}`
    );
  }

  if (field.computedDependencies && field.computedDependencies.length > 0) {
    formField.computedDependencies = field.computedDependencies;
    console.log(
      `✅ [metadataConverter] Dependências: ${
        field.name
      } -> [${field.computedDependencies.join(", ")}]`
    );
  }

  return formField;
}
```

### 3. Adicionar Debug no EntityForm

Arquivo: `/src/components/Generic/EntityForm.tsx`

```typescript
useEffect(() => {
  const computedFields = metadata.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.computed && field.computedDependencies);

  if (computedFields.length === 0) return;

  // Log para debug (ADICIONADO)
  console.log(
    "🧮 [EntityForm] Campos computados detectados:",
    computedFields.map((f) => ({
      name: f.name,
      computed: f.computed,
      dependencies: f.computedDependencies,
    }))
  );

  // ... resto do código de recálculo ...
}, [formData, metadata.sections]);
```

## Como Testar

1. **Abra o console do navegador** (F12)
2. **Acesse o formulário de categoria**
3. **Verifique os logs:**

```
✅ [metadataConverter] Campo computado detectado: name -> função: categoryName
✅ [metadataConverter] Dependências: name -> [distance, gender, minAge, maxAge]
🧮 [EntityForm] Campos computados detectados: [{name: "name", computed: "categoryName", dependencies: [...]}]
```

4. **Teste o comportamento:**
   - Campo `name` deve estar readonly (fundo cinza)
   - Preencha `distance`, `gender`, `minAge`, `maxAge`
   - Campo `name` deve auto-preencher com "5KM - Masculino - 30 a 39 anos"
   - Mude qualquer dependência → `name` recalcula automaticamente

## Arquivos Modificados

1. ✅ `/src/types/metadata.ts` - Adicionado `computed` e `computedDependencies` em `FieldMetadata`
2. ✅ `/src/utils/metadataConverter.ts` - Copiar propriedades no converter + logs
3. ✅ `/src/components/Generic/EntityForm.tsx` - Log de debug no useEffect

## Status

✅ **RESOLVIDO!** O metadata do backend agora é corretamente convertido para o formato do formulário, preservando as propriedades de campos computados.

## Lições Aprendidas

- **Dois tipos de metadata:** `FieldMetadata` (backend) vs `FormFieldMetadata` (frontend)
- **Converter precisa ser sincronizado:** Quando adicionar propriedade nova, atualizar:
  1. Tipo do backend (`FieldMetadata`)
  2. Tipo do frontend (`FormFieldMetadata`)
  3. Lógica de conversão (`metadataConverter.ts`)
- **Debug logs são essenciais:** Ajudam a identificar onde o metadata está sendo perdido

## Próximos Passos

Agora que o fix está aplicado:

1. Backend não precisa mudar nada - já está enviando corretamente
2. Frontend vai detectar e processar campos computados automaticamente
3. Testar com diferentes combinações de valores
4. Considerar remover logs após validação (ou manter para debugging)
