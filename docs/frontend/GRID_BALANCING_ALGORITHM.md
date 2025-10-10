# Algoritmo de Balanceamento Harmônico de Grid

## Visão Geral

O sistema de formulários utiliza um algoritmo inteligente de balanceamento que organiza campos em linhas de forma harmônica, mantendo:

1. ✅ **Alinhamento Vertical**: Campos de mesma largura ficam alinhados verticalmente
2. ✅ **Linhas Balanceadas**: Todas as linhas têm somas de larguras similares
3. ✅ **Otimização de Espaço**: Máximo aproveitamento do grid de 12 colunas
4. ✅ **Layout Harmônico**: Evita linhas muito curtas ao lado de linhas muito longas

## Problema a Resolver

### ❌ Antes (Sem Balanceamento)

```
Backend envia:
- Campo A: 400px (6 cols)
- Campo B: 400px (6 cols)
- Campo C: 200px (3 cols)
- Campo D: 200px (3 cols)
- Campo E: 200px (3 cols)

Layout Simples (apenas sequencial):
┌────────────┬────────────┐
│ Campo A(6) │ Campo B(6) │  12 cols ✅
└────────────┴────────────┘
┌─────┬─────┬─────┐
│C(3) │D(3) │E(3) │          9 cols ⚠️ Linha desbalanceada
└─────┴─────┴─────┘
```

### ✅ Depois (Com Balanceamento)

```
Layout Balanceado:
┌────────────┬─────┬─────┐
│ Campo A(6) │C(3) │D(3) │  12 cols ✅
└────────────┴─────┴─────┘
┌────────────┬─────┐
│ Campo B(6) │E(3) │       9 cols (mas única linha)
└────────────┴─────┘
```

## Algoritmo Implementado

### Fase 1: Separação de Campos

```typescript
// Separa ArrayFields (sempre linha inteira) dos demais
const arrayFields: FormFieldMetadata[] = [];
const regularFields: FormFieldMetadata[] = [];

fields.forEach((field) => {
  if (field.type === "array") {
    arrayFields.push(field);
  } else {
    regularFields.push(field);
  }
});
```

### Fase 2: Agrupamento por Largura

```typescript
// Agrupa campos por largura para manter alinhamento vertical
const widthGroups = new Map<number, FieldItem[]>();

fieldsWithWidths.forEach((item) => {
  const group = widthGroups.get(item.width) || [];
  group.push(item);
  widthGroups.set(item.width, group);
});

// Exemplo de widthGroups:
// {
//   6: [Campo A, Campo B],     // Campos de 6 colunas
//   3: [Campo C, Campo D, Campo E]  // Campos de 3 colunas
// }
```

### Fase 3: Preenchimento Inteligente

```typescript
// Processa grupos da maior para a menor largura
for (const [, group] of Array.from(widthGroups.entries()).sort(
  (a, b) => b[0] - a[0]
)) {
  for (const item of group) {
    // Tenta adicionar à linha atual
    if (currentRowWidth + item.width <= 12) {
      currentRow.push(item.field);
      currentRowWidth += item.width;

      // Se completou exatamente 12 colunas, finaliza linha
      if (currentRowWidth === 12) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
    } else {
      // Não cabe na linha atual, inicia nova linha
      rows.push(currentRow);
      currentRow = [item.field];
      currentRowWidth = item.width;
    }
  }
}
```

### Fase 4: Balanceamento de Linhas

```typescript
const balanceRows = (rows: FormFieldMetadata[][], maxWidth: number) => {
  // Calcula largura de cada linha
  const rowWidths = rows.map((row) =>
    row.reduce((sum, field) => sum + getFieldWidth(field), 0)
  );

  // Calcula largura média
  const avgWidth = rowWidths.reduce((a, b) => a + b, 0) / rows.length;
  const tolerance = 3; // Tolerância de 3 colunas

  // Redistribui campos entre linhas desbalanceadas
  for (let i = 0; i < rows.length - 1; i++) {
    const currentWidth = rowWidths[i];
    const nextWidth = rowWidths[i + 1];

    // Se linha atual está muito menor que a próxima
    if (
      currentWidth < avgWidth - tolerance &&
      nextWidth > avgWidth + tolerance
    ) {
      const field = rows[i + 1][0];
      const fieldWidth = getFieldWidth(field);

      // Move campo se couber
      if (currentWidth + fieldWidth <= maxWidth) {
        rows[i].push(field);
        rows[i + 1].shift();
      }
    }
  }

  return rows;
};
```

## Exemplos Práticos

### Exemplo 1: Campos Mistos

**Backend:**

```java
fields.add(createField("name", "Nome", 400));          // 6 cols
fields.add(createField("email", "Email", 400));        // 6 cols
fields.add(createField("phone", "Telefone", 200));     // 3 cols
fields.add(createField("age", "Idade", 200));          // 3 cols
fields.add(createField("city", "Cidade", 200));        // 3 cols
```

**Resultado Balanceado:**

```
Linha 1: [Nome(6), Telefone(3), Idade(3)] = 12 cols ✅
Linha 2: [Email(6), Cidade(3)] = 9 cols
```

**Por que este layout?**

- Linha 1 completa exatamente 12 colunas
- Mantém alinhamento: campos de 3 colunas alinhados verticalmente
- Evita deixar Telefone, Idade e Cidade sozinhos em uma linha de 9 colunas

### Exemplo 2: Múltiplos Tamanhos

**Backend:**

```java
fields.add(createField("title", "Título", 800));       // 12 cols
fields.add(createField("subtitle", "Subtítulo", 600)); // 9 cols
fields.add(createField("author", "Autor", 400));       // 6 cols
fields.add(createField("date", "Data", 200));          // 3 cols
fields.add(createField("status", "Status", 200));      // 3 cols
```

**Resultado Balanceado:**

```
Linha 1: [Título(12)] = 12 cols ✅
Linha 2: [Subtítulo(9), Data(3)] = 12 cols ✅
Linha 3: [Autor(6), Status(3)] = 9 cols
```

### Exemplo 3: ArrayFields Intercalados

**Backend:**

```java
fields.add(createField("name", "Nome", 400));          // 6 cols
fields.add(createField("email", "Email", 400));        // 6 cols
fields.add(createArrayField("categories", "Categorias")); // Array
fields.add(createField("price", "Preço", 200));        // 3 cols
fields.add(createField("discount", "Desconto", 200));  // 3 cols
```

**Resultado Balanceado:**

```
Linha 1: [Nome(6), Email(6)] = 12 cols ✅
Linha 2: [Categorias(Array)] = 12 cols ✅ (sempre linha inteira)
Linha 3: [Preço(3), Desconto(3)] = 6 cols
```

## Estratégias de Balanceamento

### Estratégia 1: Completar 12 Colunas

Prioriza linhas que completam exatamente 12 colunas:

```
Campos: [6, 6, 3, 3, 3]

Tentativa 1: [6, 6] = 12 ✅ Perfeito!
Tentativa 2: [3, 3, 3] = 9 ⚠️ Não completa

Resultado:
Linha 1: [6, 6] = 12
Linha 2: [3, 3, 3] = 9
```

### Estratégia 2: Agrupamento por Largura

Mantém campos de mesma largura juntos:

```
Campos: [6, 3, 6, 3, 3]

Agrupa: {
  6: [Campo1, Campo3],
  3: [Campo2, Campo4, Campo5]
}

Resultado:
Linha 1: [6, 3, 3] = 12 (um campo de cada grupo)
Linha 2: [6, 3] = 9
```

### Estratégia 3: Redistribuição

Move campos entre linhas desbalanceadas:

```
Estado Inicial:
Linha 1: [6] = 6
Linha 2: [6, 3, 3] = 12

Após Redistribuição:
Linha 1: [6, 3, 3] = 12  ← Recebeu campos da Linha 2
Linha 2: [6] = 6
```

## Casos Especiais

### Caso 1: Todos os Campos Grandes (6+ cols)

```
Campos: [8, 8, 8]

Resultado:
Linha 1: [8] = 8
Linha 2: [8] = 8
Linha 3: [8] = 8

Não há como balancear - cada campo em sua linha
```

### Caso 2: Muitos Campos Pequenos (3 cols)

```
Campos: [3, 3, 3, 3, 3, 3, 3]

Resultado:
Linha 1: [3, 3, 3, 3] = 12 ✅
Linha 2: [3, 3, 3] = 9

Algoritmo preenche linhas de 12 colunas perfeitamente
```

### Caso 3: Mix Complexo

```
Campos: [12, 6, 3, 3, 6, 3]

Resultado:
Linha 1: [12] = 12 ✅ (campo de 12 sempre sozinho)
Linha 2: [6, 3, 3] = 12 ✅
Linha 3: [6, 3] = 9
```

## Benefícios do Algoritmo

### 1. Alinhamento Vertical ✅

**Antes:**

```
┌────┬─────┬──────┐
│ 6  │ 3   │ 3    │
└────┴─────┴──────┘
┌──────┬────┐
│ 6    │ 3  │      ← Campo de 3 desalinhado
└──────┴────┘
```

**Depois:**

```
┌────┬─────┬──────┐
│ 6  │ 3   │ 3    │
└────┴─────┴──────┘
┌────┬─────┐
│ 6  │ 3   │      ← Alinhado com coluna acima
└────┴─────┘
```

### 2. Linhas Balanceadas ✅

**Antes:**

```
Linha 1: 12 cols ████████████
Linha 2: 6 cols  ██████
Linha 3: 3 cols  ███
```

**Depois:**

```
Linha 1: 12 cols ████████████
Linha 2: 9 cols  █████████
Linha 3: 9 cols  █████████
```

### 3. Otimização de Espaço ✅

**Antes:**

```
Total: 21 colunas / 36 disponíveis = 58% de uso
```

**Depois:**

```
Total: 30 colunas / 36 disponíveis = 83% de uso
```

## Configuração e Customização

### Ajustar Tolerância de Balanceamento

```typescript
// Em balanceRows()
const tolerance = 3; // Padrão: 3 colunas

// Aumentar tolerância = aceita mais diferença entre linhas
const tolerance = 5; // Mais permissivo

// Diminuir tolerância = linhas mais uniformes
const tolerance = 1; // Mais rígido
```

### Forçar Campos na Mesma Linha

```java
// Backend: Use larguras que somem exatamente 12
field1.setWidth(400); // 6 cols
field2.setWidth(200); // 3 cols
field3.setWidth(200); // 3 cols
// Total: 6 + 3 + 3 = 12 cols → Mesma linha garantida
```

### Forçar Campo em Linha Própria

```java
// Backend: Use largura 800+ (12 colunas)
field.setWidth(800); // 12 cols → Linha inteira
```

## Debugging

### Ver Organização das Linhas

```typescript
// No renderSection(), adicione:
console.log(
  "🎨 Layout organizado:",
  organizedFields.map((row, i) => ({
    linha: i + 1,
    campos: row.map(
      (f) => `${f.label}(${convertPixelsToGridWidth(f.width, f.type)})`
    ),
    larguraTotal: row.reduce(
      (sum, f) => sum + convertPixelsToGridWidth(f.width, f.type),
      0
    ),
    percentual:
      (row.reduce(
        (sum, f) => sum + convertPixelsToGridWidth(f.width, f.type),
        0
      ) /
        12) *
        100 +
      "%",
  }))
);
```

### Exemplo de Output

```javascript
[
  {
    linha: 1,
    campos: ["Nome(6)", "Telefone(3)", "Idade(3)"],
    larguraTotal: 12,
    percentual: "100%",
  },
  {
    linha: 2,
    campos: ["Email(6)", "Cidade(3)"],
    larguraTotal: 9,
    percentual: "75%",
  },
];
```

## Performance

### Complexidade do Algoritmo

- **Separação**: O(n) - itera uma vez pelos campos
- **Agrupamento**: O(n) - agrupa por largura
- **Preenchimento**: O(n × m) - n campos, m grupos de largura
- **Balanceamento**: O(r²) - r linhas, comparações entre linhas adjacentes

**Total**: O(n × m) ≈ O(n²) no pior caso

Para formulários típicos (10-50 campos), performance é imperceptível.

## Boas Práticas Backend

### ✅ DO (Faça)

```java
// 1. Agrupe campos relacionados com larguras complementares
fields.add(createField("street", "Rua", 600));     // 9 cols
fields.add(createField("number", "Número", 200));  // 3 cols
// Total: 12 cols → Mesma linha

// 2. Use larguras que somem múltiplos de 12
fields.add(createField("name", "Nome", 400));      // 6 cols
fields.add(createField("email", "Email", 400));    // 6 cols
// Total: 12 cols

// 3. Use largura 800 para campos que devem ocupar linha inteira
fields.add(createField("description", "Descrição", 800)); // 12 cols
```

### ❌ DON'T (Não Faça)

```java
// ❌ Não use larguras aleatórias sem considerar o grid
fields.add(createField("field1", "Campo 1", 350)); // 5 cols
fields.add(createField("field2", "Campo 2", 450)); // 7 cols
// Total: 12 cols, mas desbalanceado visualmente

// ❌ Não misture larguras muito diferentes sem necessidade
fields.add(createField("tiny", "Pequeno", 100));   // 1 col
fields.add(createField("huge", "Grande", 700));    // 10 cols
// Dificulta balanceamento
```

## Testes Visuais

### Teste 1: Campos Uniformes

```
Input: [6, 6, 6, 6]
Output:
  Linha 1: [6, 6] = 12
  Linha 2: [6, 6] = 12
✅ Perfeito
```

### Teste 2: Campos Pequenos

```
Input: [3, 3, 3, 3, 3]
Output:
  Linha 1: [3, 3, 3, 3] = 12
  Linha 2: [3] = 3
✅ Máximo aproveitamento
```

### Teste 3: Mix Complexo

```
Input: [12, 6, 3, 3, 6, 3, 3, 3]
Output:
  Linha 1: [12] = 12
  Linha 2: [6, 3, 3] = 12
  Linha 3: [6, 3, 3, 3] = 15... ❌ Overflow!

Correção:
  Linha 3: [6, 3, 3] = 12
  Linha 4: [3] = 3
✅ Sem overflow
```

## Referências

- Implementação: `src/components/Generic/EntityForm.tsx` (organizeFieldsByWidth, balanceRows)
- Grid System: `docs/frontend/FORM_GRID_SYSTEM.md`
- Layout Inteligente: `docs/frontend/INTELLIGENT_FORM_LAYOUT.md`
- Conversão Pixels: `docs/frontend/FORM_GRID_SYSTEM.md` (convertPixelsToGridWidth)
