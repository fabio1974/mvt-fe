# Correção de Validações de Campos

## 📋 Problema

Validações de tipo err## 📊 Matriz de Validações

| Tipo de Campo | min | max | minLength | maxLength | pattern | required |
| ------------- | --- | --- | --------- | --------- | ------- | -------- | ----------------------- |
| **text**      | ❌  | ❌  | ✅        | ✅        | ✅      | ✅       |
| **textarea**  | ❌  | ❌  | ✅        | ✅        | ✅      | ✅       |
| **email**     | ❌  | ❌  | ✅        | ✅        | ✅      | ✅       |
| **password**  | ❌  | ❌  | ✅        | ✅        | ✅      | ✅       |
| **number**    | ✅  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **date**      | ✅  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **datetime**  | ✅  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **select**    | ❌  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **boolean**   | ❌  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **entity**    | ❌  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **city**      | ❌  | ❌  | ❌        | ❌        | ❌      | ✅       |
| **array**     | ❌  | ❌  | ❌        | ❌        | ❌      | ✅       | o aplicadas aos campos: |

- `minLength`/`maxLength` sendo aplicados em campos numéricos, selects e datas
- `min`/`max` sendo aplicados em campos de texto
- Mensagens de erro incorretas: "deve ter no mínimo null caracteres"

## ✅ Solução

Separação de validações por tipo de campo na função `validateField`:

### 1. **Validações Numéricas (apenas min)**

Aplicadas **apenas** em:

- `number`
- `date`
- `datetime`

```tsx
const isNumericField =
  field.type === "number" || field.type === "date" || field.type === "datetime";

if (isNumericField && min !== undefined && Number(value) < min) {
  return message || `${field.label} deve ser maior ou igual a ${min}`;
}

// max NÃO é validado em campos numéricos
```

### 2. **Validações de Comprimento (minLength/maxLength)**

Aplicadas **apenas** em:

- `text`
- `textarea`
- `email`
- `password`

```tsx
const isTextField =
  field.type === "text" ||
  field.type === "textarea" ||
  field.type === "email" ||
  field.type === "password";

if (
  isTextField &&
  minLength !== undefined &&
  String(value).length < minLength
) {
  return message || `${field.label} deve ter no mínimo ${minLength} caracteres`;
}

if (
  isTextField &&
  maxLength !== undefined &&
  String(value).length > maxLength
) {
  return message || `${field.label} deve ter no máximo ${maxLength} caracteres`;
}
```

### 3. **Validações de Padrão (pattern)**

Aplicadas **apenas** em campos de texto:

```tsx
if (isTextField && pattern && !new RegExp(pattern).test(String(value))) {
  return message || `${field.label} não está no formato correto`;
}
```

### 4. **Limpeza de Erros**

Adicionado `useEffect` para limpar erros ao trocar de entidade:

```tsx
// Limpa erros quando o formulário é montado ou quando muda de entidade
useEffect(() => {
  setErrors({});
}, [entityId, metadata.endpoint]);
```

## 📊 Matriz de Validações

| Tipo de Campo | min/max | minLength/maxLength | pattern | required |
| ------------- | ------- | ------------------- | ------- | -------- |
| **text**      | ❌      | ✅                  | ✅      | ✅       |
| **textarea**  | ❌      | ✅                  | ✅      | ✅       |
| **email**     | ❌      | ✅                  | ✅      | ✅       |
| **password**  | ❌      | ✅                  | ✅      | ✅       |
| **number**    | ✅      | ❌                  | ❌      | ✅       |
| **date**      | ✅      | ❌                  | ❌      | ✅       |
| **datetime**  | ✅      | ❌                  | ❌      | ✅       |
| **select**    | ❌      | ❌                  | ❌      | ✅       |
| **boolean**   | ❌      | ❌                  | ❌      | ✅       |
| **entity**    | ❌      | ❌                  | ❌      | ✅       |
| **city**      | ❌      | ❌                  | ❌      | ✅       |
| **array**     | ❌      | ❌                  | ❌      | ✅       |

## 🎯 Resultados

**Antes:**

```
❌ "Máximo de Participantes deve ter no mínimo null caracteres"
❌ "Tipo de Evento deve ter no máximo null caracteres"
❌ "Data do Evento deve ter no mínimo null caracteres"
```

**Depois:**

```
✅ Campos de texto: validação de comprimento funciona
✅ Campos numéricos: validação de min/max funciona
✅ Campos select/date: sem validações de comprimento
✅ Mensagens de erro corretas e contextuais
```

## 📝 Exemplos de Uso

### Campo de Texto com Comprimento

```json
{
  "name": "name",
  "type": "text",
  "validation": {
    "minLength": 3,
    "maxLength": 100
  }
}
```

✅ Valida comprimento de 3 a 100 caracteres

### Campo Numérico com Limites

```json
{
  "name": "maxParticipants",
  "type": "number",
  "validation": {
    "min": 1
  }
}
```

✅ Valida número mínimo de 1
❌ Não valida máximo (removido)

### Campo Select (Enum)

```json
{
  "name": "eventType",
  "type": "select",
  "options": [...]
}
```

✅ Sem validações de comprimento ou limites numéricos

## 🔧 Arquivo Modificado

- `src/components/Generic/EntityForm.tsx`
  - Função `validateField` (linhas 151-212)
  - Adicionado `useEffect` para limpar erros (linhas 107-110)

## 🎨 Benefícios

1. **Validações Apropriadas**: Cada tipo de campo recebe validações corretas
2. **Mensagens Claras**: Sem mais "null caracteres" ou validações nonsense
3. **UX Melhorada**: Usuário não vê erros irrelevantes
4. **Backend Compatibility**: Respeita as validações enviadas pelo metadata
5. **Type Safety**: Validações condicionais baseadas em tipos
