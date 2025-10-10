# Sistema de Valores Default nos Formulários

## ✅ Status: IMPLEMENTADO

O frontend está **100% preparado** para receber e aplicar valores default vindos do metadata do backend.

## 🎯 Como Funciona

### 1. **Inicialização do Estado do Formulário**

Quando o `EntityForm` é montado, ele inicializa o `formData` com valores default:

```tsx
const [formData, setFormData] = useState<Record<string, unknown>>(() => {
  const defaultValues: Record<string, unknown> = {};

  metadata.sections.forEach((section) => {
    section.fields.forEach((field) => {
      // 1. Auto-preenche organizationId (lógica especial)
      if (!entityId && organizationId) {
        if (field.name === "organizationId" || field.name === "organization") {
          defaultValues[field.name] = organizationId;
        }
      }

      // 2. Aplica defaultValue do metadata
      if (field.defaultValue !== undefined) {
        defaultValues[field.name] = field.defaultValue;
      }
      // 3. Inicializa arrays vazios
      else if (field.type === "array") {
        defaultValues[field.name] = [];
      }
    });
  });

  // 4. Mescla com initialValues passados como prop (se houver)
  return { ...defaultValues, ...initialValues };
});
```

### 2. **Ordem de Prioridade**

Os valores são aplicados na seguinte ordem (do menor para o maior precedência):

1. **Arrays vazios** - Se `type === "array"` e não tem defaultValue
2. **organizationId** - Auto-preenchimento de organização (modo create)
3. **field.defaultValue** - Valor default vindo do metadata do backend
4. **initialValues** - Valores passados como prop ao componente (sobrescreve tudo)

## 📋 Estrutura do Metadata

### Backend envia:

```json
{
  "name": "status",
  "label": "Status",
  "type": "select",
  "defaultValue": "DRAFT",
  "options": [
    { "value": "DRAFT", "label": "Rascunho" },
    { "value": "PUBLISHED", "label": "Publicado" }
  ]
}
```

### Frontend aplica:

```tsx
// Ao criar novo registro:
formData.status = "DRAFT"; // ✅ Aplicado automaticamente
```

## 🔄 Tipos de Valores Default Suportados

| Tipo de Campo | Exemplo de defaultValue  | Tipo no Frontend |
| ------------- | ------------------------ | ---------------- |
| `text`        | `"Novo Evento"`          | `string`         |
| `number`      | `100`                    | `number`         |
| `boolean`     | `true`                   | `boolean`        |
| `date`        | `"2025-01-01"`           | `string` (ISO)   |
| `datetime`    | `"2025-01-01T10:00:00Z"` | `string` (ISO)   |
| `select`      | `"DRAFT"`                | `string`         |
| `array`       | `[]`                     | `Array<any>`     |

## 📝 Exemplos de Uso

### 1. **Campo Select com Default**

```json
{
  "name": "eventType",
  "type": "select",
  "defaultValue": "RUNNING",
  "options": [
    { "value": "RUNNING", "label": "Corrida" },
    { "value": "CYCLING", "label": "Ciclismo" }
  ]
}
```

✅ Formulário abre com "RUNNING" selecionado

### 2. **Campo Numérico com Default**

```json
{
  "name": "maxParticipants",
  "type": "number",
  "defaultValue": 100,
  "validation": { "min": 1, "max": 1000 }
}
```

✅ Campo aparece com valor "100"

### 3. **Campo Boolean com Default**

```json
{
  "name": "isActive",
  "type": "boolean",
  "defaultValue": true
}
```

✅ Checkbox marcado por padrão

### 4. **Campo de Data com Default**

```json
{
  "name": "eventDate",
  "type": "date",
  "format": "dd/MM/yyyy",
  "defaultValue": "2025-12-31"
}
```

✅ Data pré-selecionada: 31/12/2025

### 5. **Array com Items Default**

```json
{
  "name": "categories",
  "type": "array",
  "arrayConfig": {
    "itemType": "object",
    "fields": [...]
  }
}
```

✅ Inicializa com array vazio `[]`

## 🎨 Comportamento por Modo

### Modo: **CREATE**

```tsx
// Aplica todos os defaultValues
formData = {
  status: "DRAFT", // do metadata
  maxParticipants: 100, // do metadata
  organizationId: "abc-123", // auto-preenchido
  categories: [], // array vazio
};
```

### Modo: **EDIT**

```tsx
// Carrega dados da entidade existente
// defaultValues são IGNORADOS
formData = {
  ...dadosDoBanco, // Dados reais da entidade
};
```

### Modo: **VIEW**

```tsx
// Carrega dados da entidade (readonly)
// defaultValues são IGNORADOS
formData = {
  ...dadosDoBanco, // Dados reais (somente leitura)
};
```

## 🔍 Código Relevante

### EntityForm.tsx (linhas 69-96)

```tsx
const [formData, setFormData] = useState<Record<string, unknown>>(() => {
  const defaultValues: Record<string, unknown> = {};

  metadata.sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (!entityId && organizationId) {
        if (field.name === "organizationId" || field.name === "organization") {
          defaultValues[field.name] = organizationId;
        }
      }

      if (field.defaultValue !== undefined) {
        defaultValues[field.name] = field.defaultValue;
      } else if (field.type === "array") {
        defaultValues[field.name] = [];
      }
    });
  });

  return { ...defaultValues, ...initialValues };
});
```

## 🎯 Interface TypeScript

```tsx
interface FormFieldMetadata {
  name: string;
  label: string;
  type: FormFieldType;
  // ... outros campos ...
  defaultValue?: string | number | boolean | Date | null; // ✅ Suportado
}
```

## ✨ Casos de Uso Reais

### 1. **Novo Evento**

Backend envia:

```json
{
  "formFields": [
    { "name": "status", "defaultValue": "DRAFT" },
    { "name": "maxParticipants", "defaultValue": 50 },
    { "name": "isActive", "defaultValue": true }
  ]
}
```

Formulário abre com:

- Status: "DRAFT"
- Máximo de Participantes: 50
- Ativo: Sim (checkbox marcado)

### 2. **Organização Automática**

```tsx
// Usuário logado em organização "org-123"
// Backend não precisa enviar defaultValue para organizationId
// Frontend detecta automaticamente e preenche
```

## 🚀 Benefícios

1. ✅ **Zero Configuração Frontend**: Tudo vem do backend
2. ✅ **UX Melhorada**: Campos pré-preenchidos com valores sensatos
3. ✅ **Menos Erros**: Valores default corretos desde o início
4. ✅ **Flexível**: Backend controla totalmente os defaults
5. ✅ **Type-Safe**: TypeScript valida os tipos

## 📊 Resumo

| Feature                   | Status          | Localização            |
| ------------------------- | --------------- | ---------------------- |
| Leitura de `defaultValue` | ✅ Implementado | `EntityForm.tsx:86`    |
| Aplicação no `formData`   | ✅ Implementado | `EntityForm.tsx:69-96` |
| Suporte a todos os tipos  | ✅ Implementado | -                      |
| Auto-fill organizationId  | ✅ Implementado | `EntityForm.tsx:76-83` |
| Arrays vazios automáticos | ✅ Implementado | `EntityForm.tsx:89-91` |
| Merge com initialValues   | ✅ Implementado | `EntityForm.tsx:95`    |

## 🎉 Conclusão

**O sistema está 100% funcional!**

Basta o backend enviar `defaultValue` no metadata e o frontend aplica automaticamente. Não precisa fazer nada adicional no FE.
