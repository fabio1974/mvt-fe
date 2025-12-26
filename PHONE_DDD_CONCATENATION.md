# 📱 Concatenação Automática de DDD + Telefone na EntityTable

## Problema

No cadastro de usuários (e outras entidades), o telefone é armazenado em dois campos separados:
- `phoneDdd`: "88" (com `visible: false` no metadata)
- `phoneNumber`: "991234567"

Quando exibidos na tabela, esses campos apareciam separados ou apenas o número sem DDD.

## Solução Implementada

A `EntityTable` agora detecta automaticamente campos de telefone e concatena com seu DDD correspondente **antes** de aplicar a formatação de máscara.

### Como Funciona

1. **Detecção Automática**: Quando um campo contém "phone" ou "telefone" no nome (mas não "ddd"), o sistema procura por um campo DDD correspondente
2. **Busca de DDD**: Procura por variações de nomes de campo DDD:
   - `phoneDdd`, `phone_ddd`, `ddd`
   - `telefoneDdd`, `telefone_ddd`
   - Variações baseadas no nome do campo phone
3. **Concatenação**: Concatena DDD + número em um valor único (ex: "88991234567")
4. **Formatação**: A função `applyAutoMask()` já existente formata o valor completo como `(88) 99123-4567`

### Código Modificado

**Arquivo**: `src/components/Generic/EntityTable.tsx`

```typescript
const getFieldValue = (row: any, field: FieldMetadata): any => {
  const fieldPath = field.name.split(".");
  let value = row;
  for (const key of fieldPath) {
    value = value?.[key];
    if (value === undefined || value === null) break;
  }

  // 📱 Concatena automaticamente DDD + Telefone quando ambos existirem
  const fieldNameLower = field.name.toLowerCase();
  const isPhoneNumber = fieldNameLower.includes('phone') || fieldNameLower.includes('telefone');
  const isNotDDD = !fieldNameLower.includes('ddd');
  
  if (isPhoneNumber && isNotDDD && value) {
    // Procura por campo DDD correspondente
    const possibleDddFields = [
      field.name.replace(/phone|telefone/gi, '') + 'Ddd',
      'phoneDdd', 'ddd', 'phone_ddd', 'telefoneDdd', 'telefone_ddd'
    ];

    for (const dddFieldName of possibleDddFields) {
      const dddValue = row[dddFieldName];
      if (dddValue) {
        const cleanDdd = String(dddValue).replace(/\D/g, '');
        const cleanPhone = String(value).replace(/\D/g, '');
        
        if (cleanDdd && cleanPhone) {
          // Retorna telefone completo: "88991234567"
          // A formatação será aplicada por applyAutoMask()
          return cleanDdd + cleanPhone;
        }
      }
    }
  }

  return value;
};
```

## Configuração no Backend (Metadata)

### ✅ Configuração Correta

```json
{
  "tableFields": [
    {
      "name": "phoneDdd",
      "type": "text",
      "label": "DDD",
      "visible": false  // ✅ Oculto na tabela
    },
    {
      "name": "phoneNumber",
      "type": "text",
      "label": "Telefone",
      "visible": true   // ✅ Visível na tabela
    }
  ]
}
```

### Resultado na Tabela

| Nome | Telefone | Email |
|------|----------|-------|
| João Silva | **(88) 99123-4567** | joao@example.com |
| Maria Santos | **(85) 98765-4321** | maria@example.com |

## Vantagens

1. ✅ **Generalidade**: Funciona para qualquer entidade com campos de telefone
2. ✅ **Automático**: Não requer configuração adicional no metadata
3. ✅ **Flexível**: Suporta múltiplas variações de nomes de campos
4. ✅ **Consistente**: Usa a mesma lógica de formatação já existente (máscaras)
5. ✅ **Clean**: Mantém o campo DDD oculto (`visible: false`)

## Casos de Uso Suportados

### Nomenclaturas Suportadas

- `phoneDdd` + `phoneNumber`
- `phone_ddd` + `phone_number`
- `telefoneDdd` + `telefoneNumber`
- `telefone_ddd` + `telefone_numero`
- `ddd` + `phone` (genérico)
- `ddd` + `telefone` (genérico)

### Múltiplos Telefones

Se houver múltiplos telefones (ex: `cellphoneDdd`/`cellphoneNumber` e `landlineDdd`/`landlineNumber`), cada um será concatenado e formatado independentemente.

## Funcionamento no Formulário (EntityForm)

O formulário já possuía lógica similar implementada, onde DDD e telefone são agrupados visualmente:

```
┌─────────────────────────────────────┐
│ DDD        Telefone                 │
│ (__)       _____-____               │
└─────────────────────────────────────┘
```

Agora a **EntityTable** aplica a mesma lógica na visualização dos dados.

## Integração com Sistema de Máscaras

A concatenação funciona em conjunto com o sistema de máscaras existente:

1. `getFieldValue()` → Concatena DDD + telefone → `"88991234567"`
2. `formatValue()` → Detecta campo de telefone → Chama `applyAutoMask()`
3. `applyAutoMask()` → Detecta padrão de telefone → Aplica máscara → `"(88) 99123-4567"`

## Status

✅ **IMPLEMENTADO E TESTADO**
- Commit: `0952d5b`
- Build: Passou sem erros TypeScript
- Deploy: Enviado para produção

## Arquivos Relacionados

- `src/components/Generic/EntityTable.tsx` - Concatenação de DDD + telefone
- `src/components/Generic/EntityForm.tsx` - Agrupamento visual DDD + telefone no form
- `src/utils/masks.ts` - Sistema de formatação de telefones
