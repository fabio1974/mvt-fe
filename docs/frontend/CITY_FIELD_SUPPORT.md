# Suporte ao Campo City no EntityForm

## 📋 Visão Geral

O sistema agora suporta campos do tipo `city` automaticamente em formulários genéricos. Quando o backend envia um campo com `type: 'city'`, o EntityForm renderiza automaticamente um `CityTypeahead` para busca de cidades.

## 🎯 Problema Resolvido

**Antes:**

```
Backend envia: { type: 'city', name: 'city', label: 'Cidade' }
EntityForm: ❌ Campo não aparece (tipo não mapeado)
```

**Depois:**

```
Backend envia: { type: 'city', name: 'city', label: 'Cidade' }
EntityForm: ✅ Renderiza CityTypeahead automaticamente
```

## 🔧 Como Funciona

### 1. Backend envia metadata

```json
{
  "name": "event",
  "formFields": [
    {
      "name": "city",
      "label": "Cidade",
      "type": "city",
      "required": true,
      "placeholder": "Digite o nome da cidade"
    }
  ]
}
```

### 2. MetadataConverter mapeia o tipo

```typescript
// src/utils/metadataConverter.ts
function mapFieldType(backendType: string): FormFieldMetadata["type"] {
  const typeMap: Record<string, FormFieldMetadata["type"]> = {
    string: "text",
    number: "number",
    city: "city", // ← Novo mapeamento
    // ...
  };
  return typeMap[backendType] || "text";
}
```

### 3. EntityForm renderiza o CityTypeahead

```tsx
// src/components/Generic/EntityForm.tsx
case "city":
  return (
    <FormField
      key={field.name}
      label={field.label}
      required={field.required}
      error={error}
    >
      <CityTypeahead
        value={stringValue}
        onCitySelect={(city) => {
          // Salva apenas o nome da cidade
          handleChange(field.name, city.name);
        }}
        placeholder={field.placeholder || "Digite o nome da cidade"}
      />
    </FormField>
  );
```

## 📦 Resultado Visual

```
┌─────────────────────────────────────────┐
│  📝 Criar Evento                         │
├─────────────────────────────────────────┤
│  Nome do Evento:                        │
│  [___________________________________]  │
│                                         │
│  Cidade: *                              │
│  [Digite o nome da cidade          ▼]  │  ← CityTypeahead
│     São Paulo - SP                      │
│     São Paulo de Olivença - AM          │
│     São Paulo do Potengi - RN           │
│                                         │
│  Data:                                  │
│  [___________________________________]  │
└─────────────────────────────────────────┘
```

## 🔧 Alterações Técnicas

### 1. Tipo `FieldType` (metadata.ts)

```typescript
export type FieldType =
  | "string"
  | "integer"
  | "city" // ← Já existia
  | "nested"
  | "actions";
```

### 2. Tipo `FormFieldType` (metadata.ts)

```typescript
export type FormFieldType =
  | "text"
  | "city" // ← Já existia
  | "array";
```

### 3. MetadataConverter (metadataConverter.ts)

```typescript
function mapFieldType(backendType: string): FormFieldMetadata["type"] {
  const typeMap: Record<string, FormFieldMetadata["type"]> = {
    // ... tipos existentes
    city: "city", // ← NOVO
  };
  return typeMap[backendType] || "text";
}
```

### 4. EntityForm (EntityForm.tsx)

```typescript
import { CityTypeahead } from "../Common/CityTypeahead";

// No switch do renderField:
case "city":
  return (
    <FormField>
      <CityTypeahead
        value={stringValue}
        onCitySelect={(city) => handleChange(field.name, city.name)}
      />
    </FormField>
  );
```

## 🌍 Componente CityTypeahead

O `CityTypeahead` já existe e fornece:

- ✅ Busca por cidade em API do Brasil
- ✅ Autocomplete inteligente
- ✅ Formato: "Cidade - UF"
- ✅ Validação automática
- ✅ Cache de resultados

### Props do CityTypeahead

```typescript
interface CityTypeaheadProps {
  value: string;
  onCitySelect: (city: City) => void;
  placeholder?: string;
}

interface City {
  name: string;
  state: string;
  // ... outros campos
}
```

## ✅ Compatibilidade

### Backend Java

```java
@Entity
public class Event {
    @Id
    private Long id;

    private String name;

    @Column(name = "city")
    private String city; // ← Salva apenas o nome da cidade

    // ...
}

// No EventMetadataProvider:
FieldMetadata cityField = FieldMetadata.builder()
    .name("city")
    .label("Cidade")
    .type(FieldType.CITY) // ← Tipo especial
    .required(true)
    .placeholder("Digite o nome da cidade")
    .build();
```

## 🧪 Testes

### Validação Manual

1. ✅ Criar evento com campo city
2. ✅ Buscar por "São Paulo"
3. ✅ Selecionar cidade da lista
4. ✅ Verificar que salva apenas o nome
5. ✅ Editar evento existente
6. ✅ Verificar que carrega o valor correto

### Cenários de Teste

- ✅ Campo obrigatório (required: true)
- ✅ Campo opcional (required: false)
- ✅ Placeholder customizado
- ✅ Busca com acento
- ✅ Busca parcial
- ✅ Seleção de cidade

## 🔄 Retrocompatibilidade

A mudança é **100% retrocompatível**:

- ✅ Campos existentes continuam funcionando
- ✅ Se backend não envia `type: 'city'`, usa fallback para 'text'
- ✅ Formulários antigos não são afetados
- ✅ CityTypeahead já existia, apenas adicionamos integração

## 📝 Exemplo Completo

### Backend Response

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "formFields": [
    {
      "name": "name",
      "label": "Nome do Evento",
      "type": "string",
      "required": true
    },
    {
      "name": "city",
      "label": "Cidade",
      "type": "city",
      "required": true,
      "placeholder": "Ex: São Paulo"
    },
    {
      "name": "date",
      "label": "Data",
      "type": "date",
      "required": true
    }
  ]
}
```

### Frontend Renderiza

```tsx
<FormContainer>
  <FormField label="Nome do Evento" required>
    <FormInput value={name} onChange={...} />
  </FormField>

  <FormField label="Cidade" required>
    <CityTypeahead
      value={city}
      onCitySelect={(c) => setCity(c.name)}
    />
  </FormField>

  <FormField label="Data" required>
    <FormDatePicker value={date} onChange={...} />
  </FormField>
</FormContainer>
```

### Payload de Criação

```json
{
  "name": "Corrida de Montanha XYZ",
  "city": "Campos do Jordão",
  "date": "2025-03-15"
}
```

## 🎯 Conclusão

Agora o sistema suporta campos `city` automaticamente:

- ✅ Zero configuração no frontend
- ✅ Backend controla tudo via metadata
- ✅ UX consistente com CityTypeahead
- ✅ Validação automática
- ✅ Retrocompatível

---

**Data:** 2025-01-09  
**Autor:** GitHub Copilot  
**Status:** ✅ Implementado e Documentado
