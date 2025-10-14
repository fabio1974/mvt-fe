# ✅ FIX: Campos com visible:false Sendo Mostrados em ArrayField

## Problema

Campo `currentParticipants` com `visible: false` no metadata estava sendo mostrado no formulário (dentro do ArrayField de categorias).

```json
{
  "name": "currentParticipants",
  "label": "Participantes Atuais",
  "type": "number",
  "visible": false, // ← Deveria estar oculto
  "defaultValue": 0
}
```

**Resultado esperado:** Campo **NÃO** deve aparecer no formulário  
**Resultado real:** Campo **aparecia** no ArrayField

## Causa Raiz

O `metadataConverter.ts` tinha lógica para **ignorar campos com `visible: false`** em campos de primeiro nível, mas **NÃO aplicava** esse filtro para campos dentro de relacionamentos nested (ArrayField).

### Código Problemático (Antes)

```typescript
// Para campos normais - ✅ FUNCIONAVA
if (field.visible === false) {
  console.log(`Skipping hidden field: ${field.name}`);
  return;
}

// Para campos nested - ❌ NÃO FILTRAVA
const relatedFields: FormFieldMetadata[] = field.relationship.fields
  ? field.relationship.fields
      .map(convertFieldToFormField) // ← Convertia TODOS os campos
      .filter((f): f is FormFieldMetadata => f !== null)
  : [];
```

## Solução Aplicada

Adicionei filtro de `visible: false` **ANTES** de converter os campos nested:

```typescript
const relatedFields: FormFieldMetadata[] = field.relationship.fields
  ? field.relationship.fields
      .filter((f) => {
        if (f.visible === false) {
          console.log(
            `[convertFieldToFormField] Skipping hidden nested field: ${f.name} (inside ${field.name})`
          );
          return false;
        }
        return true;
      })
      .map(convertFieldToFormField) // Agora só converte campos visíveis
      .filter((f): f is FormFieldMetadata => f !== null)
  : [];
```

**Ordem importante:**

1. **Filtrar** `visible: false` primeiro
2. **Converter** campos visíveis
3. **Filtrar** nulls

## Como Funciona Agora

### Campos de Primeiro Nível

```
Backend → visible: false → Ignorado (já funcionava)
Backend → visible: true  → Convertido e mostrado
```

### Campos Nested (ArrayField)

```
Backend → visible: false → Ignorado (✅ AGORA FUNCIONA)
Backend → visible: true  → Convertido e mostrado
```

## Teste

### 1. Recarregue a Página

Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)

### 2. Veja o Log no Console

```javascript
[convertFieldToFormField] Skipping hidden nested field: currentParticipants (inside categories)
```

### 3. Verifique o Formulário

- Abra formulário de evento
- Adicione uma categoria
- Campo **"Participantes Atuais"** **NÃO** deve aparecer
- Outros campos com `visible: true` devem aparecer normalmente

## Campos Afetados

Esta correção se aplica a **qualquer campo** dentro de ArrayField com `visible: false`:

```json
// Exemplos de campos que agora serão ocultados corretamente:
{
  "name": "currentParticipants",
  "visible": false  // ← Agora oculto em ArrayField
}
{
  "name": "internalId",
  "visible": false  // ← Agora oculto em ArrayField
}
{
  "name": "createdAt",
  "visible": false  // ← Agora oculto em ArrayField
}
```

## Arquivos Modificados

- ✅ `/src/utils/metadataConverter.ts`
  - Adicionado filtro `visible !== false` antes do map
  - Log de debug para campos nested ignorados

## Comportamento Esperado

### Antes da Correção

```
Backend envia:
- distance (visible: true)   → ✅ Mostrado
- gender (visible: true)     → ✅ Mostrado
- currentParticipants (visible: false) → ❌ Mostrado (BUG)
```

### Depois da Correção

```
Backend envia:
- distance (visible: true)   → ✅ Mostrado
- gender (visible: true)     → ✅ Mostrado
- currentParticipants (visible: false) → ✅ Oculto (CORRETO)
```

## Casos de Uso

### 1. Campos Calculados pelo Backend

```json
{
  "name": "currentParticipants",
  "visible": false, // Calculado automaticamente
  "defaultValue": 0
}
```

### 2. Campos Internos/Técnicos

```json
{
  "name": "internalCode",
  "visible": false, // Só para uso interno
  "type": "string"
}
```

### 3. Timestamps Automáticos

```json
{
  "name": "createdAt",
  "visible": false, // Preenchido automaticamente
  "type": "datetime"
}
```

## Importante

- ✅ Campo com `visible: false` **não aparece** no formulário
- ✅ Campo ainda existe no `originalFields` do metadata
- ✅ Valor pode ser enviado no payload (se tiver defaultValue)
- ✅ Backend pode usar o campo normalmente

## Status

✅ **CORRIGIDO** - Campos com `visible: false` agora são ocultados corretamente em:

1. ✅ Campos de primeiro nível (já funcionava)
2. ✅ Campos nested em ArrayField (corrigido agora)

---

**Teste agora e confirme que o campo não aparece mais!** 🎉
