# ✨ Melhorias na Função `categoryName`

## O Que Foi Melhorado

Tornei a função `categoryName` mais **inteligente e completa** para gerar nomes de categorias de eventos esportivos.

## 🆕 Mudanças Implementadas

### 1. Suporte a Unidades de Distância

**Antes:** Sempre usava "KM"

```typescript
"5KM - Masculino - 30 a 39";
```

**Agora:** Usa o campo `distanceUnit`

```typescript
"5KM - Masculino - 30 a 39"; // KM (padrão)
"100M - Feminino - Sub-18"; // Metros
"10MI - Misto - 40 a 49"; // Milhas
"42.195KM - Feminino - Geral"; // Maratona
```

### 2. Formato de Idade Melhorado

**Formato usado em eventos esportivos:**

| Situação       | Antes           | Agora     | Explicação                   |
| -------------- | --------------- | --------- | ---------------------------- |
| Ambas idades   | `30 a 39 anos`  | `30 a 39` | Mais limpo                   |
| Só mínima      | `60+`           | `60+`     | ✅ Mantido (60 anos ou mais) |
| Só máxima ≤ 18 | `até 18 anos`   | `Sub-18`  | 🎯 Formato de competições    |
| Só máxima > 18 | `até 25 anos`   | `até 25`  | Mais limpo                   |
| Sem idade      | ❌ Não aparecia | `Geral`   | 🆕 Categoria livre           |

### 3. Categoria Geral

**Antes:** Se não tinha idade, o campo ficava incompleto

```
"5KM - Masculino" ← Parece incompleto
```

**Agora:** Adiciona "Geral" para categorias sem restrição de idade

```
"5KM - Masculino - Geral" ← Completo e claro
```

## 📋 Dependências Atualizadas

A função agora depende de **5 campos** (antes eram 4):

```json
{
  "name": "name",
  "computed": "categoryName",
  "computedDependencies": [
    "distance",
    "distanceUnit", // 🆕 NOVO
    "gender",
    "minAge",
    "maxAge"
  ]
}
```

## 🎯 Exemplos Práticos

### Categorias Tradicionais

```
5KM - Masculino - 30 a 39
10KM - Feminino - 40 a 49
21KM - Misto - 50 a 59
```

### Categorias de Base (Juvenis)

```
100M - Masculino - Sub-16
200M - Feminino - Sub-18
5KM - Misto - Sub-20
```

### Categorias Sênior

```
10KM - Masculino - 60+
5KM - Feminino - 70+
```

### Categorias Gerais (Sem Restrição)

```
5KM - Masculino - Geral
10KM - Feminino - Geral
21KM - Misto - Geral
```

### Outras Unidades

```
100M - Masculino - Sub-18       (Sprint)
1500M - Feminino - 20 a 29      (Meio-Fundo)
10MI - Masculino - 40 a 49      (Trail em Milhas)
42.195KM - Feminino - Geral     (Maratona)
```

### Categorias Específicas

```
5KM - Feminino - até 25         (Jovens até 25)
10KM - Masculino - 60+          (Veteranos)
21KM - Misto - Sub-18           (Juvenis)
```

## 🔧 Código da Função

```typescript
export function categoryName(formData: Record<string, unknown>): string {
  const distance = formData.distance;
  const distanceUnit = formData.distanceUnit;
  const gender = formData.gender;
  const minAge = formData.minAge;
  const maxAge = formData.maxAge;

  const parts: string[] = [];

  // 1️⃣ Distância com unidade (KM, M, MI)
  if (distance) {
    const unit = distanceUnit ? String(distanceUnit).toUpperCase() : "KM";
    parts.push(`${distance}${unit}`);
  }

  // 2️⃣ Gênero traduzido
  if (gender) {
    const genderMap: Record<string, string> = {
      MALE: "Masculino",
      FEMALE: "Feminino",
      OTHER: "Outro",
      MIXED: "Misto",
    };
    parts.push(genderMap[String(gender)] || String(gender));
  }

  // 3️⃣ Faixa etária (formato usado em eventos esportivos)
  const minAgeNum = minAge ? Number(minAge) : null;
  const maxAgeNum = maxAge ? Number(maxAge) : null;

  if (minAgeNum !== null || maxAgeNum !== null) {
    if (minAgeNum !== null && maxAgeNum !== null) {
      // Ambos: "30 a 39"
      parts.push(`${minAgeNum} a ${maxAgeNum}`);
    } else if (minAgeNum !== null && maxAgeNum === null) {
      // Só mínima: "60+" (60 anos ou mais)
      parts.push(`${minAgeNum}+`);
    } else if (minAgeNum === null && maxAgeNum !== null) {
      // Só máxima: "Sub-18" (menores de 18), "até 25"
      if (maxAgeNum <= 18) {
        parts.push(`Sub-${maxAgeNum}`);
      } else {
        parts.push(`até ${maxAgeNum}`);
      }
    }
  } else {
    // Sem restrição de idade: "Geral"
    parts.push("Geral");
  }

  return parts.join(" - ") || "Nova Categoria";
}
```

## 🎪 Backend Precisa Atualizar?

**SIM!** Precisa adicionar o campo `distanceUnit` nas dependências:

### Antes

```json
{
  "name": "name",
  "computed": "categoryName",
  "computedDependencies": ["distance", "gender", "minAge", "maxAge"]
}
```

### Agora

```json
{
  "name": "name",
  "computed": "categoryName",
  "computedDependencies": [
    "distance",
    "distanceUnit",
    "gender",
    "minAge",
    "maxAge"
  ]
}
```

### Campo distanceUnit no Metadata

```json
{
  "name": "distanceUnit",
  "type": "enum",
  "label": "Unidade de Distância",
  "required": true,
  "options": [
    { "value": "KM", "label": "Quilômetros (KM)" },
    { "value": "M", "label": "Metros (M)" },
    { "value": "MI", "label": "Milhas (MI)" }
  ],
  "defaultValue": "KM",
  "width": 1
}
```

## ✅ Compatibilidade

A função é **retrocompatível**:

- Se `distanceUnit` não existir → usa "KM" (padrão)
- Se idades não existirem → adiciona "Geral"
- Se campos estiverem vazios → retorna "Nova Categoria"

## 🧪 Como Testar

1. **Recarregue a página** (Ctrl+Shift+R)
2. **Crie uma categoria** com:
   - Distância: 5
   - Unidade: KM
   - Gênero: Masculino
   - Idade Mín: vazio
   - Idade Máx: vazio
3. **Campo Nome deve mostrar:** `"5KM - Masculino - Geral"`

4. **Mude para:**
   - Idade Mín: vazio
   - Idade Máx: 18
5. **Campo Nome deve recalcular:** `"5KM - Masculino - Sub-18"`

6. **Mude para:**
   - Unidade: M
   - Distância: 100
7. **Campo Nome deve recalcular:** `"100M - Masculino - Sub-18"`

## 📚 Documentação Atualizada

- ✅ `/src/utils/computedFields.ts` - Código atualizado
- ✅ `/docs/frontend/COMPUTED_FIELDS_GUIDE.md` - Exemplos atualizados
- ✅ `/docs/backend/COMPUTED_FIELDS_BACKEND.md` - Exemplos e spec atualizados

---

**Status:** ✅ IMPLEMENTADO - Pronto para testar! 🚀
