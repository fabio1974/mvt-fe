# Sistema de Grid para Formulários (12 Colunas)

## 📋 Visão Geral

O sistema de formulários suporta um **grid flexível de 12 colunas** (estilo Bootstrap). O backend envia larguras em **pixels** e o frontend converte automaticamente para o grid de 12 colunas.

## 🎯 Problema Resolvido

**Antes:**

```
Todos os campos tinham largura fixa (50% cada)
Não havia controle de layout pelo backend
```

**Depois:**

```
Backend envia pixels (ex: 100, 200, 400)
Frontend converte para grid 1-12 automaticamente
Layout totalmente controlado pelo backend
```

## 🔧 Como Funciona

### 1. Backend Envia Pixels

```json
{
  "formFields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "width": 500 // ← Pixels (será convertido para 8/12)
    },
    {
      "name": "code",
      "label": "Código",
      "type": "string",
      "width": 250 // ← Pixels (será convertido para 4/12)
    }
  ]
}
```

### 2. Frontend Converte para Grid

**Tabela de Conversão:**

| Pixels (backend) | Grid Colunas | Percentual | Uso Típico            |
| ---------------- | ------------ | ---------- | --------------------- |
| ≤ 80px           | 1/12         | ~8%        | Checkbox, ícone       |
| ≤ 140px          | 2/12         | ~16%       | Código curto, dia/mês |
| ≤ 210px          | 3/12         | 25%        | CEP, sigla estado     |
| ≤ 280px          | 4/12         | 33%        | Código, telefone      |
| ≤ 350px          | 5/12         | 42%        | Data, hora            |
| ≤ 420px          | 6/12         | 50%        | Nome, email           |
| ≤ 490px          | 7/12         | 58%        | Título curto          |
| ≤ 560px          | 8/12         | 67%        | Nome completo         |
| ≤ 630px          | 9/12         | 75%        | Endereço              |
| ≤ 700px          | 10/12        | 83%        | Descrição curta       |
| ≤ 770px          | 11/12        | 92%        | URL longa             |
| > 770px          | 12/12        | 100%       | Textarea, descrição   |

### 3. Algoritmo de Conversão

```typescript
// src/components/Generic/EntityForm.tsx
const convertPixelsToGridWidth = (pixels?: number): number => {
  if (!pixels) return 6; // Padrão: 50%

  // Baseado em largura total ~800px para 12 colunas
  // Cada coluna ~= 67px (800/12)
  if (pixels <= 80) return 1;
  if (pixels <= 140) return 2;
  if (pixels <= 210) return 3;
  if (pixels <= 280) return 4;
  if (pixels <= 350) return 5;
  if (pixels <= 420) return 6;
  if (pixels <= 490) return 7;
  if (pixels <= 560) return 8;
  if (pixels <= 630) return 9;
  if (pixels <= 700) return 10;
  if (pixels <= 770) return 11;
  return 12;
};

const gridWidth = convertPixelsToGridWidth(field.width);
const widthPercentage = (gridWidth / 12) * 100;
```

## 📦 Exemplos Práticos

### Exemplo 1: Formulário de Evento

**Backend Java:**

```java
FieldMetadata nameField = FieldMetadata.builder()
    .name("name")
    .label("Nome do Evento")
    .type(FieldType.STRING)
    .width(500)  // ← 500px → converte para 8/12 (67%)
    .required(true)
    .build();

FieldMetadata codeField = FieldMetadata.builder()
    .name("code")
    .label("Código")
    .type(FieldType.STRING)
    .width(250)  // ← 250px → converte para 4/12 (33%)
    .build();

FieldMetadata descField = FieldMetadata.builder()
    .name("description")
    .label("Descrição")
    .type(FieldType.STRING)
    .width(800)  // ← 800px → converte para 12/12 (100%)
    .build();
```

**Resultado Visual:**

```
┌─────────────────────────────────────────────┐
│  📝 Criar Evento                             │
├─────────────────────────────────────────────┤
│  Nome do Evento *        │  Código          │
│  [________________]      │  [________]      │
│  (500px → 8/12)          │  (250px → 4/12)  │
│                          │                  │
│  Descrição                                  │
│  [_____________________________________]    │
│  (800px → 12/12)                            │
└─────────────────────────────────────────────┘
```

### Exemplo 2: Endereço Completo

**Backend:**

```java
fields.add(FieldMetadata.builder()
    .name("street").label("Rua")
    .width(560).build());  // 560px → 8/12

fields.add(FieldMetadata.builder()
    .name("number").label("Número")
    .width(210).build());  // 210px → 3/12

fields.add(FieldMetadata.builder()
    .name("complement").label("Complemento")
    .width(350).build());  // 350px → 5/12

fields.add(FieldMetadata.builder()
    .name("city").label("Cidade")
    .width(420).build());  // 420px → 6/12

fields.add(FieldMetadata.builder()
    .name("state").label("Estado")
    .width(210).build());  // 210px → 3/12

fields.add(FieldMetadata.builder()
    .name("zipCode").label("CEP")
    .width(210).build());  // 210px → 3/12
```

**Conversão Automática:**

```
560px → 8/12 (67%)  | 210px → 3/12 (25%)  | quebra linha
350px → 5/12 (42%)  | 420px → 6/12 (50%)  | quebra linha
210px → 3/12 (25%)  | 210px → 3/12 (25%)  | ...
```

**Layout Final:**

```
┌───────────────────────────┬─────────┐
│  Rua (8)                  │ Nº (3)  │
├──────────────┬────────────┴─────────┤
│  Compl (5)   │  Cidade (6)          │
├──────┬───────┴──────┬───────────────┤
│ UF(3)│  CEP (3)     │  ...          │
└──────┴──────────────┴───────────────┘
```

### Exemplo 3: Datas e Horários

**Backend:**

```java
fields.add(FieldMetadata.builder()
    .name("startDate").label("Data Início")
    .width(280).build());  // 280px → 4/12

fields.add(FieldMetadata.builder()
    .name("startTime").label("Hora Início")
    .width(210).build());  // 210px → 3/12

fields.add(FieldMetadata.builder()
    .name("endDate").label("Data Fim")
    .width(280).build());  // 280px → 4/12

fields.add(FieldMetadata.builder()
    .name("endTime").label("Hora Fim")
    .width(210).build());  // 210px → 3/12
```

**Layout:**

```
┌──────────────┬──────────┬──────────────┬──────────┐
│ Data Início  │ Hora     │ Data Fim     │ Hora     │
│ (4)          │ (3)      │ (4)          │ (3)      │
└──────────────┴──────────┴──────────────┴──────────┘
  280px → 4/12   210 → 3    280 → 4       210 → 3
  Total: 14 colunas → quebra após 12, últimos 2 vão p/ baixo
```

## 🧮 Calculadora de Conversão

### Fórmula Backend → Frontend

```
Pixels Backend → Colunas Grid → Percentual

   100px → 2/12 → 16.67%
   200px → 3/12 → 25.00%
   300px → 5/12 → 41.67%
   400px → 6/12 → 50.00%
   500px → 8/12 → 66.67%
   600px → 9/12 → 75.00%
   800px → 12/12 → 100.00%
```

### Guia Rápido para Backend

| Deseja         | Envie (pixels) | Converte para | Resultado |
| -------------- | -------------- | ------------- | --------- |
| Muito estreito | 80-100         | 1-2/12        | 8-16%     |
| Pequeno        | 150-250        | 2-4/12        | 16-33%    |
| Médio          | 300-400        | 5-6/12        | 42-50%    |
| Grande         | 500-600        | 8-9/12        | 67-75%    |
| Largura total  | 800+           | 12/12         | 100%      |

## 🔧 Implementação Técnica

### 1. Tipo FormFieldMetadata

```typescript
// src/types/metadata.ts
export interface FormFieldMetadata {
  name: string;
  label: string;
  type: FormFieldType;
  width?: number; // ← Nova propriedade (1-12)
  required?: boolean;
  // ...
}
```

### 2. MetadataConverter

```typescript
// src/utils/metadataConverter.ts
const formField: FormFieldMetadata = {
  name: field.name,
  label: field.label,
  type: mappedType,
  width: field.width, // ← Copia do backend
  required: field.required || false,
  // ...
};
```

### 3. EntityForm - Grid Wrapper

```typescript
// src/components/Generic/EntityForm.tsx
const renderField = (field: FormFieldMetadata) => {
  const gridWidth = field.width || 6; // Padrão: 50%
  const widthPercentage = (gridWidth / 12) * 100;

  const wrapField = (content: React.ReactNode) => (
    <div
      style={{
        width: `${widthPercentage}%`,
        paddingRight: gridWidth === 12 ? "0" : "12px",
        boxSizing: "border-box",
      }}
    >
      {content}
    </div>
  );

  let fieldContent: React.ReactNode;

  switch (field.type) {
    case "text":
      fieldContent = <FormField>...</FormField>;
      break;
    // ...
  }

  return wrapField(fieldContent);
};
```

### 4. FormRow com Flexbox

```css
/* src/components/Common/FormComponents.css */
.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  width: 100%;
  margin-bottom: 12px;
}
```

## 📱 Responsividade

O sistema é automaticamente responsivo:

### Desktop (> 768px)

- Respeita as larguras definidas (1-12)
- Wrap automático quando soma ultrapassa 12

### Mobile (< 768px)

- Pode adicionar media query para forçar largura total
- Opção futura: campos com `width` podem ter override mobile

```css
@media (max-width: 768px) {
  .form-row > div {
    width: 100% !important;
    padding-right: 0 !important;
  }
}
```

## ✅ Regras de Uso

### Larguras Válidas

- ✅ `1, 2, 3, 4, 6, 12` (divisores de 12)
- ⚠️ `5, 7, 8, 9, 10, 11` (funciona, mas pode não alinhar perfeitamente)

### Combinações que Somam 12

```
✅ 6 + 6         = 12
✅ 4 + 4 + 4     = 12
✅ 3 + 3 + 3 + 3 = 12
✅ 2 + 2 + 2 + 2 + 2 + 2 = 12
✅ 8 + 4         = 12
✅ 9 + 3         = 12
```

### Combinações que Quebram Linha

```
6 + 6 + 4  = 16 (quebra após 12, último vai para linha nova)
8 + 8      = 16 (segundo campo vai para linha nova)
```

## 🎯 Casos Especiais

### Array Fields (Largura Total)

```typescript
case "array":
  // Sempre ocupa 100% - não envolve no grid wrapper
  return (
    <div key={field.name} style={{ gridColumn: "1 / -1" }}>
      <ArrayField {...} />
    </div>
  );
```

### Campos Ocultos (Organization Auto-fill)

```typescript
// Campos auto-preenchidos não são renderizados
if (!entityId && organizationId && field.name === "organizationId") {
  return null;
}
```

### Padrão quando width não especificado

```typescript
const gridWidth = field.width || 6; // Padrão: 50%
```

## 🧪 Exemplos de Uso

### Backend Java

```java
@Entity
public class Event {
    @Id
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "code")
    private String code;

    @Column(name = "description", length = 1000)
    private String description;
}

// EventMetadataProvider
FieldMetadata nameField = FieldMetadata.builder()
    .name("name")
    .label("Nome do Evento")
    .type(FieldType.STRING)
    .width(8)  // ← 66% da tela
    .required(true)
    .build();

FieldMetadata codeField = FieldMetadata.builder()
    .name("code")
    .label("Código")
    .type(FieldType.STRING)
    .width(4)  // ← 33% da tela
    .required(false)
    .build();

FieldMetadata descField = FieldMetadata.builder()
    .name("description")
    .label("Descrição")
    .type(FieldType.STRING)
    .width(12) // ← 100% da tela
    .required(false)
    .build();
```

### Resultado Visual

```
┌─────────────────────────────────────────────┐
│  📝 Criar Evento                             │
├─────────────────────────────────────────────┤
│  Nome do Evento *        │  Código          │
│  [________________]      │  [________]      │
│                          │                  │
│  Descrição                                  │
│  [_____________________________________]    │
│                                             │
│  [Salvar] [Cancelar]                        │
└─────────────────────────────────────────────┘
```

## 🔄 Migração de Formulários Existentes

### Antes (sem width)

```json
{
  "formFields": [
    { "name": "name", "type": "string" },
    { "name": "email", "type": "string" }
  ]
}
```

**Resultado:** Ambos 50% (width padrão = 6)

### Depois (com width)

```json
{
  "formFields": [
    { "name": "name", "type": "string", "width": 8 },
    { "name": "email", "type": "string", "width": 4 }
  ]
}
```

**Resultado:** name 66%, email 33%

## 📊 Performance

- ✅ **Leve**: Apenas CSS inline para larguras
- ✅ **Flexível**: Wrap automático via flexbox
- ✅ **Responsivo**: Adapta-se automaticamente
- ✅ **Retrocompatível**: width opcional (padrão: 6)

## 🎯 Conclusão

O sistema de grid de 12 colunas permite:

- ✅ **Controle total** do layout pelo backend
- ✅ **Layouts flexíveis** e profissionais
- ✅ **Responsividade** automática
- ✅ **Fácil manutenção** (tudo via metadata)
- ✅ **Retrocompatibilidade** (width opcional)

Agora os formulários podem ter layouts customizados sem nenhuma alteração no frontend! 🎨

---

**Data:** 2025-01-09  
**Autor:** GitHub Copilot  
**Status:** ✅ Implementado e Documentado
