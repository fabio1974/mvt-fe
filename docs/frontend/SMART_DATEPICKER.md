# DatePicker Inteligente - Detecção Automática de Hora/Minuto

## Visão Geral

O `FormDatePicker` agora detecta **automaticamente** se deve mostrar seletor de hora/minuto baseado no **nome do campo**.

## Problema Anterior

### ❌ ANTES

Todos os campos de data mostravam hora/minuto, mesmo quando não era necessário:

```tsx
<FormDatePicker
  showTimeSelect={true} // ← SEMPRE true!
  dateFormat="dd/MM/yyyy HH:mm" // ← SEMPRE com hora!
/>
```

**Resultado:**

- `registrationStartDate` mostrava: `09/10/2025 17:45` ❌
- `eventDate` mostrava: `09/10/2025 18:00` ❌
- `createdAt` mostrava: `09/10/2025 18:15` ✅ (correto)

### Problema

- Campos que só precisam da data (sem hora) mostravam seletor de hora desnecessário
- Confundia o usuário
- Poluía a interface

## Solução Implementada

### ✅ AGORA - Detecção Automática

```tsx
case "date": {
  // Detecta automaticamente se deve mostrar hora/minuto
  const shouldShowTime =
    field.name.toLowerCase().includes("time") ||
    field.name.toLowerCase().includes("datetime") ||
    field.name.toLowerCase().includes("hora") ||
    field.name.toLowerCase().endsWith("at");

  const dateFormat = shouldShowTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";

  fieldContent = (
    <FormDatePicker
      showTimeSelect={shouldShowTime}  // ← AUTOMÁTICO!
      dateFormat={dateFormat}          // ← AUTOMÁTICO!
    />
  );
}
```

## Regras de Detecção

### Mostra Hora/Minuto (showTimeSelect = true)

Campo mostra seletor de hora SE o nome contém:

| Padrão           | Exemplo                                 | Formato            |
| ---------------- | --------------------------------------- | ------------------ |
| `time`           | `eventTime`, `startTime`, `endTime`     | `dd/MM/yyyy HH:mm` |
| `datetime`       | `eventDateTime`, `registrationDateTime` | `dd/MM/yyyy HH:mm` |
| `hora`           | `horaInicio`, `horaFim`                 | `dd/MM/yyyy HH:mm` |
| termina com `at` | `createdAt`, `updatedAt`                | `dd/MM/yyyy HH:mm` |

### NÃO Mostra Hora/Minuto (showTimeSelect = false)

Campo mostra APENAS data SE o nome contém:

| Padrão             | Exemplo                  | Formato      |
| ------------------ | ------------------------ | ------------ |
| `date` (sem time)  | `eventDate`, `birthDate` | `dd/MM/yyyy` |
| `start` (sem time) | `registrationStartDate`  | `dd/MM/yyyy` |
| `end` (sem time)   | `registrationEndDate`    | `dd/MM/yyyy` |
| qualquer outro     | `nascimento`, `validade` | `dd/MM/yyyy` |

## Exemplos Práticos

### Backend Metadata

```json
{
  "formFields": [
    {
      "name": "eventDate",
      "label": "Data do Evento",
      "type": "date"
    },
    {
      "name": "eventTime",
      "label": "Horário do Evento",
      "type": "date"
    },
    {
      "name": "registrationStartDate",
      "label": "Início das Inscrições",
      "type": "date"
    },
    {
      "name": "registrationEndDate",
      "label": "Fim das Inscrições",
      "type": "date"
    },
    {
      "name": "createdAt",
      "label": "Criado em",
      "type": "date"
    }
  ]
}
```

### Frontend Renderizado

```
┌─────────────────────────────────────┐
│ Data do Evento                      │
│ [📅 09/10/2025            ]         │  ← SEM hora
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Horário do Evento                   │
│ [📅 09/10/2025  🕐 17:45  ]         │  ← COM hora
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Início das Inscrições               │
│ [📅 09/10/2025            ]         │  ← SEM hora
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Fim das Inscrições                  │
│ [📅 09/10/2025            ]         │  ← SEM hora
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Criado em                           │
│ [📅 09/10/2025  🕐 18:30  ]         │  ← COM hora (termina com 'at')
└─────────────────────────────────────┘
```

## Tabela de Decisão

| Nome do Campo           | shouldShowTime | dateFormat         | Componente Visual |
| ----------------------- | -------------- | ------------------ | ----------------- |
| `eventDate`             | `false`        | `dd/MM/yyyy`       | Só calendário     |
| `eventTime`             | `true`         | `dd/MM/yyyy HH:mm` | Calendário + hora |
| `eventDateTime`         | `true`         | `dd/MM/yyyy HH:mm` | Calendário + hora |
| `registrationStartDate` | `false`        | `dd/MM/yyyy`       | Só calendário     |
| `registrationEndDate`   | `false`        | `dd/MM/yyyy`       | Só calendário     |
| `horaInicio`            | `true`         | `dd/MM/yyyy HH:mm` | Calendário + hora |
| `createdAt`             | `true`         | `dd/MM/yyyy HH:mm` | Calendário + hora |
| `updatedAt`             | `true`         | `dd/MM/yyyy HH:mm` | Calendário + hora |
| `birthDate`             | `false`        | `dd/MM/yyyy`       | Só calendário     |
| `startDate`             | `false`        | `dd/MM/yyyy`       | Só calendário     |

## Lógica de Detecção - Código

```tsx
const shouldShowTime =
  field.name.toLowerCase().includes("time") || // eventTime ✅
  field.name.toLowerCase().includes("datetime") || // eventDateTime ✅
  field.name.toLowerCase().includes("hora") || // horaInicio ✅
  field.name.toLowerCase().endsWith("at"); // createdAt, updatedAt ✅
```

### Por que funciona?

```javascript
// Testes
"eventTime".toLowerCase().includes("time"); // true ✅
"eventDateTime".toLowerCase().includes("datetime"); // true ✅
"horaInicio".toLowerCase().includes("hora"); // true ✅
"createdAt".toLowerCase().endsWith("at"); // true ✅

"eventDate".toLowerCase().includes("time"); // false ✅
"registrationStartDate".toLowerCase().includes("time"); // false ✅
"birthDate".toLowerCase().endsWith("at"); // false ✅
```

## Valor Enviado ao Backend

Independente do formato visual, **SEMPRE** envia ISO 8601 completo:

```tsx
onChange={(date) =>
  handleChange(field.name, date?.toISOString() || "")
}
```

### Exemplos

| Campo       | Visual             | Valor Enviado              |
| ----------- | ------------------ | -------------------------- |
| `eventDate` | `09/10/2025`       | `2025-10-09T00:00:00.000Z` |
| `eventTime` | `09/10/2025 17:45` | `2025-10-09T17:45:00.000Z` |
| `createdAt` | `09/10/2025 18:30` | `2025-10-09T18:30:00.000Z` |

**Backend recebe formato padrão ISO!** ✅

## Convenções de Nomenclatura

### Recomendações para o Backend

#### Para Campos SEM Hora

```java
// ✅ BOM - Claramente só data
private LocalDate eventDate;
private LocalDate birthDate;
private LocalDate startDate;
private LocalDate endDate;
private LocalDate registrationStartDate;
```

#### Para Campos COM Hora

```java
// ✅ BOM - Claramente com hora
private LocalDateTime eventTime;
private LocalDateTime eventDateTime;
private LocalDateTime startTime;
private LocalDateTime endTime;
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
```

#### ❌ Evitar Nomes Ambíguos

```java
// ❌ RUIM - Não fica claro se tem hora ou não
private LocalDateTime event;      // Ambíguo!
private LocalDate registration;   // Ambíguo!
```

## Casos Especiais

### 1. Sobrescrever Comportamento

Se precisar forçar um comportamento específico:

```tsx
// Forçar mostrar hora mesmo sem padrão no nome
<FormDatePicker
  showTimeSelect={true}  // ← Sobrescreve detecção
  dateFormat="dd/MM/yyyy HH:mm"
/>

// Forçar esconder hora mesmo com padrão no nome
<FormDatePicker
  showTimeSelect={false}  // ← Sobrescreve detecção
  dateFormat="dd/MM/yyyy"
/>
```

### 2. Backend Envia Tipo Específico

Se o backend enviar `type: "datetime"` explicitamente:

```typescript
// metadataConverter.ts
function mapFieldType(backendType: string): FormFieldType {
  const typeMap: Record<string, FormFieldType> = {
    date: "date",
    datetime: "datetime", // ← Tipo específico
    // ...
  };
  return typeMap[backendType] || "text";
}
```

Então podemos adicionar:

```tsx
case "datetime": {
  // SEMPRE mostra hora para tipo explícito "datetime"
  fieldContent = (
    <FormDatePicker
      showTimeSelect={true}
      dateFormat="dd/MM/yyyy HH:mm"
    />
  );
  break;
}
```

## Benefícios

### ✅ UX Melhorada

- Campos de data simples não mostram hora desnecessária
- Interface mais limpa e intuitiva
- Menos confusão para o usuário

### ✅ Automático

- Não precisa configurar manualmente cada campo
- Backend só precisa nomear corretamente
- Funciona out-of-the-box

### ✅ Flexível

- Segue convenções de nomenclatura
- Pode ser sobrescrito se necessário
- Suporta português e inglês

### ✅ Consistente

- Mesmo comportamento em todo o sistema
- Formato visual adaptado ao contexto
- Valor enviado sempre padronizado (ISO)

## Resumo

### Detecção Automática

```
Nome do Campo          →  Contém padrão?  →  showTimeSelect
─────────────────────     ─────────────     ───────────────
eventDate             →   ❌ Não          →   false (só data)
eventTime             →   ✅ "time"       →   true (com hora)
eventDateTime         →   ✅ "datetime"   →   true (com hora)
registrationStartDate →   ❌ Não          →   false (só data)
createdAt             →   ✅ ends "at"    →   true (com hora)
horaInicio            →   ✅ "hora"       →   true (com hora)
```

### Formato Visual

- **COM hora:** `dd/MM/yyyy HH:mm` (ex: `09/10/2025 17:45`)
- **SEM hora:** `dd/MM/yyyy` (ex: `09/10/2025`)

### Valor ao Backend

- **SEMPRE:** ISO 8601 (`2025-10-09T17:45:00.000Z`)

**DatePicker agora é inteligente e adapta-se automaticamente!** 📅✨
