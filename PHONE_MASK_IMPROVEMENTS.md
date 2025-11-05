# Melhorias nas Máscaras (CPF, CNPJ, Telefone, CEP)

## Data

26 de outubro de 2025

## Problema

As máscaras de dados sensíveis precisavam de melhorias em:

1. **Detecção limitada**: Apenas detectava alguns campos
2. **Formato fixo**: Telefone usava formato fixo `(99) 99999-9999`
3. **Sem formatação em tabelas**: Valores não eram formatados na visualização
4. **Máscaras enviadas ao backend**: Backend recebia valores com máscara, dificultando buscas

## Solução Implementada

### 1. Detecção Genérica Expandida

**Arquivo:** `src/utils/masks.ts`

#### A) Telefones

Criada função `isPhoneField()` que detecta múltiplas variações:

- phone, telefone, fone, tel
- celular, cellphone, cellular
- móvel, movel, mobile
- whatsapp, whats, zap

```typescript
const isPhoneField = (fieldName: string): boolean => {
  const name = fieldName.toLowerCase();
  const phoneKeywords = [
    "phone",
    "telefone",
    "fone",
    "tel",
    "celular",
    "cellphone",
    "cellular",
    "móvel",
    "movel",
    "mobile",
    "whatsapp",
    "whats",
    "zap",
  ];

  return phoneKeywords.some((keyword) => name.includes(keyword));
};
```

#### B) CEP

Criada função `isCEPField()` que detecta:

- cep, zipcode, zip, postalcode, postal

```typescript
const isCEPField = (fieldName: string): boolean => {
  const name = fieldName.toLowerCase();
  const cepKeywords = ["cep", "zipcode", "zip", "postalcode", "postal"];

  return cepKeywords.some((keyword) => name.includes(keyword));
};
```

#### C) CPF e CNPJ

Detectados por `includes("cpf")` e `includes("cnpj")`

### 2. Máscara Dinâmica de Telefone

**Formato adaptativo:**

- Telefone fixo (10 dígitos): `(85) 3257-2919`
- Celular (11 dígitos): `(85) 99757-2919`

**Implementações:**

#### A) Função de Aplicação de Máscara (`masks.ts`)

```typescript
export const maskPhone = (value: string): string => {
  const numbers = unmaskValue(value);

  if (numbers.length <= 10) {
    // Telefone fixo: (85) 3257-2919
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // Celular: (85) 99757-2919
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
};
```

#### B) Componente MaskedInput (`MaskedInput.tsx`)

```typescript
const getDynamicMask = (): string => {
  if (mask === "(99) 99999-9999") {
    const numbers = unmaskValue(value);
    // Se tem 11 dígitos ou 9 no início, usa máscara de celular
    if (
      numbers.length >= 11 ||
      (numbers.length === 3 && parseInt(numbers[2]) === 9)
    ) {
      return "(99) 99999-9999";
    }
    // Caso contrário, usa máscara de telefone fixo
    return "(99) 9999-9999";
  }
  return mask;
};
```

### 3. Formatação em Tabelas

**Arquivo:** `src/components/Generic/EntityTable.tsx`

Adicionada aplicação automática de máscaras no método `formatValue()`:

```typescript
// PRIORIDADE 2: Aplica máscaras para CPF, telefone, CEP, CNPJ
const maskedValue = applyAutoMask(String(value), field.name);
if (maskedValue !== String(value)) {
  return maskedValue;
}
```

Agora telefones e CPFs são automaticamente formatados na exibição das tabelas.

### 4. Novas Funções Utilitárias

**Arquivo:** `src/utils/masks.ts`

#### Funções de Máscara Individual:

- `maskCPF(value)` - Formata CPF: `123.456.789-00`
- `maskPhone(value)` - Formata telefone: `(85) 99757-2919`
- `maskCEP(value)` - Formata CEP: `12345-678`
- `maskCNPJ(value)` - Formata CNPJ: `12.345.678/0001-90`

#### Função de Aplicação Automática:

```typescript
export const applyAutoMask = (value: string, fieldName: string): string => {
  if (!value) return value;

  const name = fieldName.toLowerCase();

  if (name.includes("cpf")) return maskCPF(value);
  if (isPhoneField(fieldName)) return maskPhone(value);
  if (name.includes("cep") || name.includes("zipcode")) return maskCEP(value);
  if (name.includes("cnpj")) return maskCNPJ(value);

  return value;
};
```

## Arquivos Modificados

### 1. `/src/utils/masks.ts`

- ✅ Criada função `isPhoneField()` para detecção genérica
- ✅ Atualizada `getAutoMask()` para usar `isPhoneField()`
- ✅ Criadas funções `maskCPF()`, `maskPhone()`, `maskCEP()`, `maskCNPJ()`
- ✅ Criada função `applyAutoMask()` para aplicar máscaras automaticamente

### 2. `/src/components/Common/MaskedInput.tsx`

- ✅ Implementada máscara dinâmica em `getDynamicMask()`
- ✅ Máscara muda de `(99) 9999-9999` para `(99) 99999-9999` conforme digitação

### 3. `/src/components/Generic/EntityTable.tsx`

- ✅ Adicionado import de `applyAutoMask`
- ✅ Modificado `formatValue()` para aplicar máscaras antes da formatação por tipo

## Comportamento

### Em Formulários (Input):

1. Usuário digita número de telefone
2. Se o terceiro dígito for "9", assume celular (11 dígitos)
3. Caso contrário, assume fixo (10 dígitos)
4. Máscara se ajusta dinamicamente durante digitação

### Em Tabelas (Visualização):

1. Sistema detecta automaticamente campos de telefone/CPF/CEP/CNPJ pelo nome
2. Aplica formatação correspondente na exibição
3. Valores aparecem formatados sem necessidade de configuração extra

## Exemplos de Uso

### Telefone Fixo

- **Input:** `8532572919`
- **Output:** `(85) 3257-2919`

### Telefone Celular

- **Input:** `85997572919`
- **Output:** `(85) 99757-2919`

### CPF

- **Input:** `12345678900`
- **Output:** `123.456.789-00`

### CEP

- **Input:** `12345678`
- **Output:** `12345-678`

### CNPJ

- **Input:** `12345678000190`
- **Output:** `12.345.678/0001-90`

## Campos Detectados

A detecção funciona para qualquer campo que contenha (case-insensitive):

### Telefone:

- phone, telefone, fone, tel
- celular, cellphone, cellular
- móvel, movel, mobile
- whatsapp, whats, zap

### CPF:

- cpf

### CEP:

- cep, zipcode

### CNPJ:

- cnpj

## Validações

As validações existentes (`isValidCPF` e `isValidPhone`) continuam funcionando normalmente.

## Benefícios

1. ✅ **UX Melhorada**: Usuário vê formatação em tempo real
2. ✅ **Flexibilidade**: Detecta múltiplas variações de nomes de campos
3. ✅ **Consistência**: Mesma formatação em formulários e tabelas
4. ✅ **Manutenibilidade**: Lógica centralizada em `masks.ts`
5. ✅ **Extensibilidade**: Fácil adicionar novos tipos de máscara

## Status

✅ **CONCLUÍDO**
