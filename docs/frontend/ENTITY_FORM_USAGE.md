# EntityForm - Guia de Uso

## Visão Geral

O `EntityForm` é um componente genérico para criação e edição de formulários baseados em metadata. Ele funciona de forma similar ao `EntityTable` e `EntityFilters`, seguindo o padrão de metadata-driven UI.

## Características

- ✅ **Totalmente tipado** com TypeScript
- ✅ **Validação automática** (frontend + backend)
- ✅ **Múltiplos tipos de campos** (text, number, date, select, boolean, etc.)
- ✅ **Campos condicionais** com `showIf`
- ✅ **Modo criação e edição**
- ✅ **Integração com API**
- ✅ **Layout responsivo** com múltiplas colunas
- ✅ **Mensagens de erro** por campo
- ✅ **Loading states** durante operações

## Estrutura do Metadata

```typescript
interface FormMetadata {
  entityName: string; // Nome da entidade (ex: "event")
  title: string; // Título do formulário
  description?: string; // Descrição opcional
  endpoint: string; // Endpoint da API
  successRedirect?: string; // URL de redirecionamento após sucesso
  submitLabel?: string; // Label do botão de submit
  cancelLabel?: string; // Label do botão de cancelar
  sections: FormSectionMetadata[]; // Seções do formulário
}

interface FormSectionMetadata {
  id: string; // ID único da seção
  title: string; // Título da seção
  icon?: React.ReactNode; // Ícone da seção
  columns?: number; // Número de colunas (1-4)
  collapsible?: boolean; // Se pode ser colapsada
  fields: FormFieldMetadata[]; // Campos da seção
}

interface FormFieldMetadata {
  name: string; // Nome do campo (key no formData)
  label: string; // Label exibido
  type: FormFieldType; // Tipo do campo
  placeholder?: string; // Placeholder
  required?: boolean; // Se é obrigatório
  disabled?: boolean; // Se está desabilitado
  defaultValue?: unknown; // Valor padrão
  showIf?: string; // Condição para exibir (ex: "data.type === 'RUNNING'")
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  options?: FilterOption[]; // Opções para select
}

type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "date"
  | "select"
  | "boolean";
```

## Exemplo Básico: Formulário de Evento

```typescript
// src/metadata/eventFormMetadata.ts
import type { FormMetadata } from "../types/metadata";
import React from "react";
import { FiCalendar, FiMapPin } from "react-icons/fi";

export const eventFormMetadata: FormMetadata = {
  entityName: "event",
  title: "Evento",
  description: "Preencha os dados do evento esportivo",
  endpoint: "/api/events",
  successRedirect: "/eventos",
  submitLabel: "Criar Evento",
  cancelLabel: "Cancelar",

  sections: [
    {
      id: "basic-info",
      title: "Informações Básicas",
      icon: React.createElement(FiCalendar),
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Nome do Evento",
          type: "text",
          placeholder: "Ex: Corrida da Montanha 2024",
          required: true,
          validation: {
            minLength: 3,
            maxLength: 100,
          },
        },
        {
          name: "eventType",
          label: "Tipo de Evento",
          type: "select",
          required: true,
          options: [
            { value: "RUNNING", label: "Corrida" },
            { value: "CYCLING", label: "Ciclismo" },
            { value: "TRIATHLON", label: "Triatlo" },
          ],
        },
        {
          name: "date",
          label: "Data do Evento",
          type: "date",
          required: true,
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Descreva o evento",
          required: true,
        },
      ],
    },
    {
      id: "location",
      title: "Localização",
      icon: React.createElement(FiMapPin),
      columns: 2,
      fields: [
        {
          name: "location",
          label: "Local",
          type: "text",
          required: true,
        },
        {
          name: "city",
          label: "Cidade",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
```

## Uso no Component

### Modo Criação

```typescript
// src/components/Events/CreateEventPage.tsx
import { useNavigate } from "react-router-dom";
import EntityForm from "../Generic/EntityForm";
import { eventFormMetadata } from "../../metadata/eventFormMetadata";

export default function CreateEventPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <EntityForm
        metadata={eventFormMetadata}
        onSuccess={(data) => {
          navigate(`/eventos/${(data as { id: number }).id}`);
        }}
        onCancel={() => navigate("/eventos")}
      />
    </div>
  );
}
```

### Modo Edição

```typescript
// src/components/Events/EditEventPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import EntityForm from "../Generic/EntityForm";
import { eventFormMetadata } from "../../metadata/eventFormMetadata";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <EntityForm
        metadata={eventFormMetadata}
        entityId={id}
        onSuccess={() => {
          navigate(`/eventos/${id}`);
        }}
        onCancel={() => navigate(`/eventos/${id}`)}
      />
    </div>
  );
}
```

### Com Valores Iniciais

```typescript
<EntityForm
  metadata={eventFormMetadata}
  initialValues={{
    eventType: "RUNNING",
    acceptCard: true,
    acceptPix: true,
  }}
  onSuccess={(data) => console.log("Criado:", data)}
/>
```

## Campos Condicionais (showIf)

Use a propriedade `showIf` para mostrar campos apenas quando uma condição for verdadeira:

```typescript
{
  name: "allowTeamRegistration",
  label: "Permitir Inscrição em Equipe",
  type: "boolean",
  defaultValue: false,
},
{
  name: "teamSize",
  label: "Tamanho da Equipe",
  type: "number",
  // Só aparece se allowTeamRegistration for true
  showIf: "data.allowTeamRegistration === true",
  validation: {
    min: 2,
    max: 10,
  },
},
```

### Expressões showIf Avançadas

```typescript
// Múltiplas condições
showIf: "data.eventType === 'RUNNING' && data.distance > 10";

// Valores em array
showIf: "['RUNNING', 'TRAIL'].includes(data.eventType)";

// Comparações complexas
showIf: "data.registrationFee > 0 && data.acceptCard === true";
```

## Validação

### Validação Frontend

A validação é feita automaticamente antes do submit:

```typescript
{
  name: "registrationFee",
  label: "Taxa de Inscrição (R$)",
  type: "number",
  required: true,
  validation: {
    min: 0,
    message: "O valor não pode ser negativo",
  },
}
```

Tipos de validação disponíveis:

- `min` / `max` - Para números
- `minLength` / `maxLength` - Para strings
- `pattern` - Regex para validação customizada
- `message` - Mensagem de erro customizada

### Validação Backend

O componente também trata erros do backend:

```typescript
// Backend retorna (422 Unprocessable Entity):
{
  "errors": {
    "name": "Nome já existe",
    "date": "Data deve ser no futuro"
  },
  "message": "Erro de validação"
}
```

Os erros são automaticamente exibidos nos campos correspondentes.

## Tipos de Campos

### Text, Email, Password

```typescript
{
  name: "email",
  label: "E-mail",
  type: "email",
  placeholder: "seu@email.com",
  required: true,
}
```

### Number

```typescript
{
  name: "maxParticipants",
  label: "Máximo de Participantes",
  type: "number",
  placeholder: "Ex: 500",
  validation: {
    min: 1,
    max: 100000,
  },
}
```

### Textarea

```typescript
{
  name: "description",
  label: "Descrição",
  type: "textarea",
  placeholder: "Descreva o evento",
  validation: {
    minLength: 20,
    maxLength: 2000,
  },
}
```

### Select

```typescript
{
  name: "eventType",
  label: "Tipo de Evento",
  type: "select",
  required: true,
  options: [
    { value: "RUNNING", label: "Corrida" },
    { value: "CYCLING", label: "Ciclismo" },
  ],
}
```

### Date

```typescript
{
  name: "date",
  label: "Data do Evento",
  type: "date",
  required: true,
}
```

O valor é armazenado como ISO string: `"2024-12-31T00:00:00.000Z"`

### Boolean

```typescript
{
  name: "acceptCard",
  label: "Aceitar Cartão de Crédito",
  type: "boolean",
  defaultValue: true,
}
```

## Layout e Colunas

Configure o número de colunas por seção:

```typescript
{
  id: "basic-info",
  title: "Informações Básicas",
  columns: 2,  // 2 colunas (padrão)
  fields: [...],
}

{
  id: "full-width",
  title: "Descrição Completa",
  columns: 1,  // 1 coluna (largura total)
  fields: [...],
}
```

## Fluxo de Dados

### 1. Criação (POST)

```
User preenche formulário
  ↓
EntityForm valida campos
  ↓
POST /api/events com formData
  ↓
Sucesso → onSuccess(data) ou redirect
Erro → exibe mensagens nos campos
```

### 2. Edição (PUT)

```
EntityForm carrega dados (GET /api/events/:id)
  ↓
Preenche formulário com dados existentes
  ↓
User edita campos
  ↓
PUT /api/events/:id com formData
  ↓
Sucesso → onSuccess(data) ou redirect
```

## Boas Práticas

### 1. Organize por Seções Lógicas

```typescript
sections: [
  { id: "basic", title: "Dados Básicos", ... },
  { id: "location", title: "Localização", ... },
  { id: "payment", title: "Pagamento", ... },
]
```

### 2. Use Validação Adequada

```typescript
// ✅ BOM
{
  name: "email",
  type: "email",
  required: true,
  validation: {
    pattern: "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
    message: "E-mail inválido",
  },
}

// ❌ EVITE
{
  name: "email",
  type: "text",  // Sem validação
}
```

### 3. Defina Valores Padrão

```typescript
{
  name: "status",
  type: "select",
  defaultValue: "ACTIVE",  // Já vem selecionado
  options: [...]
}
```

### 4. Use Labels Claros

```typescript
// ✅ BOM
label: "Taxa de Inscrição (R$)";
placeholder: "Ex: 50.00";

// ❌ EVITE
label: "Valor";
placeholder: "Digite o valor";
```

## Troubleshooting

### Erros comuns

**1. "Property 'X' does not exist"**

- Verifique se o campo está no FormFieldMetadata
- Confira se o nome do campo está correto

**2. Validação não funciona**

- Certifique-se que `required: true` está definido
- Verifique se a validação está na estrutura correta

**3. showIf não funciona**

- Teste a expressão no console: `new Function("data", "return " + showIf)(formData)`
- Verifique se o nome do campo referenciado existe

**4. Dados não são salvos**

- Verifique o endpoint no metadata
- Confira se a API está retornando status 200/201
- Veja o Network tab do DevTools

## Próximos Passos

- [ ] Implementar campo `daterange` (com 2 DatePickers)
- [ ] Implementar campo `city` (com CityTypeahead)
- [ ] Implementar campo `entity` (com EntitySelect/EntityTypeahead)
- [ ] Adicionar suporte para upload de arquivos
- [ ] Adicionar máscaras de input (CPF, telefone, etc.)
- [ ] Implementar seções colapsáveis
