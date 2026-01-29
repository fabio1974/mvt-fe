# Implementação Completa de Máscaras (CPF, CNPJ, Telefone, CEP)

## Data

26 de outubro de 2025

## Visão Geral

Sistema completo de máscaras para formulários e tabelas, com remoção automática antes de enviar ao backend.

---

## Funcionalidades Implementadas

### ✅ 1. Máscaras em Inputs (Formulários)

- CPF: `123.456.789-00`
- CNPJ: `12.345.678/0001-90`
- Telefone Fixo: `(85) 3257-2919`
- Telefone Celular: `(85) 99757-2919`
- CEP: `12345-678`

### ✅ 2. Formatação em Tabelas

- Valores exibidos automaticamente formatados
- Mesma lógica de detecção por nome do campo

### ✅ 3. Unmask Automático ao Salvar

- Remove máscaras antes de enviar ao backend
- Backend recebe valores puros (apenas números)
- Facilita buscas e queries no banco de dados

---

## Arquivos Modificados

### 1. `/src/utils/masks.ts`

**Funções Principais:**

#### Detecção de Campos

```typescript
const isPhoneField = (fieldName: string): boolean
const isCEPField = (fieldName: string): boolean
```

#### Aplicação de Máscaras

```typescript
export const maskCPF = (value: string): string
export const maskCNPJ = (value: string): string
export const maskPhone = (value: string): string
export const maskCEP = (value: string): string
export const applyAutoMask = (value: string, fieldName: string): string
```

#### Remoção de Máscaras

```typescript
export const unmaskValue = (value: string): string
export const shouldUnmask = (fieldName: string): boolean
export const unmaskFormData = (data: Record<string, unknown>): Record<string, unknown>
```

#### Validações

```typescript
export const isValidCPF = (cpf: string): boolean
export const isValidCNPJ = (cnpj: string): boolean
export const isValidPhone = (phone: string): boolean
export const isValidCEP = (cep: string): boolean
```

---

### 2. `/src/components/Generic/EntityForm.tsx`

**Imports:**

```typescript
import { getAutoMask, unmaskFormData } from "../../utils/masks";
```

**Aplicação no Submit:**

```typescript
// ✅ Remove máscaras de CPF, CNPJ, telefone, CEP antes de enviar ao backend
const unmaskedData = unmaskFormData(finalData);

console.log("📤 [EntityForm Submit] Payload final:", unmaskedData);

const method = entityId ? "put" : "post";
const url = entityId ? `${metadata.endpoint}/${entityId}` : metadata.endpoint;

const response = await api[method](url, unmaskedData);
```

**Renderização de Campos com Máscara:**

```typescript
case "text":
case "email":
case "password":
  const autoMask = getAutoMask(field.name);

  if (autoMask) {
    fieldContent = (
      <MaskedInput
        mask={autoMask}
        value={stringValue}
        onChange={(e) => handleFieldChange(field.name, e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        readOnly={readonly}
      />
    );
  } else {
    fieldContent = (
      <FormInput
        type={field.type}
        // ...resto do código
      />
    );
  }
  break;
```

---

### 3. `/src/components/Generic/ArrayField.tsx`

**Imports:**

```typescript
import { MaskedInput } from "../Common/MaskedInput";
import { getAutoMask } from "../../utils/masks";
```

**Aplicação nos Campos do Array:**

```typescript
case "text":
case "email":
case "password":
  const autoMask = getAutoMask(field.name);

  if (autoMask) {
    return (
      <MaskedInput
        mask={autoMask}
        value={String(itemValue || "")}
        onChange={(e) =>
          updateItemField(index, field.name, e.target.value)
        }
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
      />
    );
  } else {
    return (
      <input
        type={field.type}
        // ...resto do código
      />
    );
  }
```

**Nota:** ArrayField não precisa fazer unmask, pois os dados são salvos via EntityForm que já faz o unmask completo.

---

### 4. `/src/components/Generic/EntityTable.tsx`

**Imports:**

```typescript
import { applyAutoMask } from "../../utils/masks";
```

**Formatação no método `formatValue()`:**

```typescript
const formatValue = (value: any, field: FieldMetadata): string => {
  // ... código existente ...

  // PRIORIDADE 2: Aplica máscaras para CPF, telefone, CEP, CNPJ
  const maskedValue = applyAutoMask(String(value), field.name);
  if (maskedValue !== String(value)) {
    return maskedValue;
  }

  // PRIORIDADE 3: Formatação por tipo
  switch (
    field.type.toLowerCase()
    // ...resto do código
  ) {
  }
};
```

---

### 5. `/src/components/Common/MaskedInput.tsx`

**Componente com Máscara Dinâmica:**

```typescript
import React from "react";
import IMask from "imask";
import {
  unmaskValue,
  getAutoMask as getAutoMaskUtil,
  applyAutoMask as applyAutoMaskUtil,
} from "../../utils/masks";

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = "",
  readOnly = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      const maskInstance = IMask(inputRef.current, { mask });
      return () => maskInstance.destroy();
    }
  }, [mask]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={onChange}
      disabled={disabled || readOnly}
      className={`form-input ${className}`}
      placeholder={placeholder}
      required={required}
    />
  );
};

// Re-exporta funções utilitárias
export const getAutoMask = getAutoMaskUtil;
export const applyAutoMask = applyAutoMaskUtil;
```

---

## Fluxo de Dados

### 1️⃣ **Entrada do Usuário (Input)**

```
Usuário digita: "12345678900"
↓
MaskedInput aplica: "123.456.789-00"
↓
Valor armazenado no formData: "123.456.789-00"
```

### 2️⃣ **Visualização em Tabela**

```
Valor do backend: "12345678900"
↓
EntityTable.formatValue() detecta campo "cpf"
↓
applyAutoMask() formata: "123.456.789-00"
↓
Exibido ao usuário: "123.456.789-00"
```

### 3️⃣ **Envio ao Backend (Submit)**

```
formData: { cpf: "123.456.789-00", phone: "(85) 99757-2919" }
↓
unmaskFormData() detecta campos
↓
Payload enviado: { cpf: "12345678900", phone: "85997572919" }
↓
Backend salva valores puros no banco
```

---

## Detecção Automática de Campos

### Telefone

Detecta campos com nomes contendo:

- `phone`, `telefone`, `fone`, `tel`
- `celular`, `cellphone`, `cellular`
- `móvel`, `movel`, `mobile`
- `whatsapp`, `whats`, `zap`

### CPF

Detecta campos com nomes contendo: `cpf`

### CNPJ

Detecta campos com nomes contendo: `cnpj`

### CEP

Detecta campos com nomes contendo:

- `cep`, `zipcode`, `zip`
- `postalcode`, `postal`

---

## Exemplos Práticos

### Exemplo 1: Campo de CPF

```typescript
// No metadata:
{
  name: "cpf",
  type: "text",
  label: "CPF"
}

// Comportamento:
// 1. Input: MaskedInput com máscara "999.999.999-99"
// 2. Tabela: Exibe "123.456.789-00"
// 3. Backend: Recebe "12345678900"
```

### Exemplo 2: Campo de Telefone Celular

```typescript
// No metadata:
{
  name: "cellphone",
  type: "text",
  label: "Celular"
}

// Comportamento:
// 1. Input: MaskedInput dinâmico (99) 99999-9999 ou (99) 9999-9999
// 2. Tabela: Exibe "(85) 99757-2919"
// 3. Backend: Recebe "85997572919"
```

### Exemplo 3: Campo de CNPJ

```typescript
// No metadata:
{
  name: "cnpj",
  type: "text",
  label: "CNPJ"
}

// Comportamento:
// 1. Input: MaskedInput com máscara "99.999.999/9999-99"
// 2. Tabela: Exibe "12.345.678/0001-90"
// 3. Backend: Recebe "12345678000190"
```

### Exemplo 4: ArrayField com Telefone

```typescript
// No metadata de contracts:
{
  name: "contacts",
  type: "array",
  fields: [
    { name: "phone", type: "text", label: "Telefone" }
  ]
}

// Comportamento:
// 1. Input no ArrayField: MaskedInput automático
// 2. Salvo no formData principal com máscara
// 3. EntityForm.handleSubmit() remove todas as máscaras recursivamente
// 4. Backend recebe array com valores puros
```

---

## Função `unmaskFormData()` - Detalhes

### Características

- **Recursiva**: Processa objetos aninhados
- **Arrays**: Processa cada item do array
- **Seletiva**: Remove máscaras apenas de campos identificados
- **Type-safe**: Usa `Record<string, unknown>` para compatibilidade TypeScript

### Exemplo de Processamento

```typescript
// Entrada:
{
  name: "João",
  cpf: "123.456.789-00",
  phones: [
    { type: "home", number: "(85) 3257-2919" },
    { type: "mobile", number: "(85) 99757-2919" }
  ],
  organization: {
    cnpj: "12.345.678/0001-90"
  }
}

// Saída após unmaskFormData():
{
  name: "João",
  cpf: "12345678900",
  phones: [
    { type: "home", number: "8532572919" },
    { type: "mobile", number: "85997572919" }
  ],
  organization: {
    cnpj: "12345678000190"
  }
}
```

---

## Benefícios da Implementação

### 1. **UX Aprimorada**

- ✅ Usuário vê valores formatados enquanto digita
- ✅ Validação visual imediata
- ✅ Consistência em toda aplicação

### 2. **Backend Otimizado**

- ✅ Valores salvos sem formatação
- ✅ Queries e buscas mais eficientes
- ✅ Menor uso de espaço no banco

### 3. **Manutenibilidade**

- ✅ Lógica centralizada em `masks.ts`
- ✅ Fácil adicionar novos tipos de máscara
- ✅ Detecção automática por nome do campo

### 4. **Flexibilidade**

- ✅ Funciona em formulários principais
- ✅ Funciona em ArrayFields (1:N)
- ✅ Funciona em tabelas de listagem
- ✅ Suporta objetos aninhados e arrays

---

## Validações Disponíveis

```typescript
// CPF
if (!isValidCPF(cpf)) {
  // CPF inválido
}

// CNPJ
if (!isValidCNPJ(cnpj)) {
  // CNPJ inválido
}

// Telefone
if (!isValidPhone(phone)) {
  // Telefone inválido
}

// CEP
if (!isValidCEP(cep)) {
  // CEP inválido (não é 8 dígitos)
}
```

---

## Como Adicionar Novo Tipo de Máscara

### 1. Criar função de máscara

```typescript
export const maskRG = (value: string): string => {
  const numbers = unmaskValue(value);
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{1})$/, "$1.$2.$3-$4");
};
```

### 2. Atualizar `getAutoMask()`

```typescript
export const getAutoMask = (fieldName: string): string | null => {
  const name = fieldName.toLowerCase();

  // ...código existente...

  if (name.includes("rg")) {
    return "99.999.999-9";
  }

  return null;
};
```

### 3. Atualizar `applyAutoMask()`

```typescript
export const applyAutoMask = (value: string, fieldName: string): string => {
  if (!value) return value;

  const name = fieldName.toLowerCase();

  // ...código existente...

  if (name.includes("rg")) {
    return maskRG(value);
  }

  return value;
};
```

### 4. Atualizar `shouldUnmask()`

```typescript
export const shouldUnmask = (fieldName: string): boolean => {
  const name = fieldName.toLowerCase();

  return (
    name.includes("cpf") ||
    name.includes("cnpj") ||
    name.includes("rg") || // ← Adicionar aqui
    isCEPField(fieldName) ||
    isPhoneField(fieldName)
  );
};
```

---

## Testes Recomendados

### 1. Teste de Input

- [ ] Digitar CPF e verificar formatação
- [ ] Digitar CNPJ e verificar formatação
- [ ] Digitar telefone fixo (10 dígitos)
- [ ] Digitar telefone celular (11 dígitos)
- [ ] Digitar CEP e verificar formatação

### 2. Teste de Visualização

- [ ] Abrir tabela e verificar valores formatados
- [ ] Verificar CPF formatado
- [ ] Verificar telefone formatado
- [ ] Verificar CNPJ formatado

### 3. Teste de Submissão

- [ ] Criar registro com CPF
- [ ] Verificar no backend que valor está sem máscara
- [ ] Criar registro com telefone
- [ ] Verificar no backend que valor está sem máscara
- [ ] Criar registro com ArrayField contendo telefones
- [ ] Verificar que array foi desmascado recursivamente

### 4. Teste de Edição

- [ ] Editar registro existente
- [ ] Verificar que valores carregam formatados
- [ ] Salvar sem alterar
- [ ] Verificar que backend recebe valores corretos

---

## Status

✅ **IMPLEMENTAÇÃO COMPLETA**

**Componentes:**

- ✅ Máscaras em inputs (EntityForm)
- ✅ Máscaras em inputs de arrays (ArrayField)
- ✅ Formatação em tabelas (EntityTable)
- ✅ Unmask automático no submit (EntityForm)
- ✅ Suporte a objetos aninhados e arrays
- ✅ Validações de CPF, CNPJ, telefone, CEP
- ✅ Detecção automática por nome do campo
- ✅ Máscara dinâmica de telefone (fixo/celular)

**Documentação:**

- ✅ Código comentado
- ✅ Exemplos práticos
- ✅ Guia de extensão

---

## Dependências

- `imask` - Biblioteca moderna de máscaras compatível com React 18+

**Instalação:**

```bash
npm install imask
```

**⚠️ Importante:** A biblioteca anterior `react-input-mask` foi substituída por `imask` devido a incompatibilidade com React 18. A `react-input-mask` usa `findDOMNode` que foi removido do React 18.

## Migração de react-input-mask para imask

Se você está migrando de uma versão anterior que usava `react-input-mask`, siga estes passos:

1. **Remover react-input-mask:**

```bash
npm uninstall react-input-mask @types/react-input-mask
```

2. **Instalar imask:**

```bash
npm install imask
```

3. **O componente MaskedInput já foi atualizado** para usar imask internamente, então não é necessário alterar o código que usa `<MaskedInput />`.

## Diferenças Técnicas

### react-input-mask (antiga)

- ❌ Incompatível com React 18
- ❌ Usa `findDOMNode` (deprecated)
- ✅ API simples

### imask (nova)

- ✅ Compatível com React 18+
- ✅ Usa refs modernos
- ✅ Mais poderosa e flexível
- ✅ Melhor performance
