# Campos Boolean na Última Linha

## Visão Geral

Os campos do tipo `boolean` (checkboxes) agora são automaticamente posicionados na última linha do formulário, **após todos os campos de input regulares**. Isso cria uma organização visual mais clara e intuitiva.

## Comportamento

### Ordem de Renderização

1. **Campos Regulares** (text, select, date, number, etc.)

   - Organizados por largura em linhas balanceadas
   - Aplicação do algoritmo de balanceamento de grid
   - Largura total próxima de 12 colunas

2. **Campos Array** (listas de sub-itens)

   - Sempre ocupam linha inteira (12 colunas)
   - Intercalados na posição original entre campos regulares

3. **Campos Boolean** (checkboxes) ✨
   - **Sempre aparecem por último**
   - Podem ocupar múltiplas linhas se necessário
   - Última linha pode ter menos de 12 colunas

### Exemplo de Layout

```
┌─────────────────────────────────────┐
│ Nome                    │ CPF       │  ← 12 cols (6 + 6)
├─────────────────────────────────────┤
│ Email                   │ Telefone  │  ← 12 cols (6 + 6)
├─────────────────────────────────────┤
│ Endereço                            │  ← 12 cols (campo array)
├─────────────────────────────────────┤
│ ☑ Ativo │ ☑ Newsletter │ ☑ Admin   │  ← 9 cols (3 + 3 + 3) ÚLTIMA LINHA
└─────────────────────────────────────┘
```

## Implementação

### Função `organizeBooleanFields`

```typescript
const organizeBooleanFields = (
  booleanFields: FormFieldMetadata[]
): FormFieldMetadata[][] => {
  const rows: FormFieldMetadata[][] = [];
  let currentRow: FormFieldMetadata[] = [];
  let currentRowWidth = 0;
  const maxRowWidth = 12;

  booleanFields.forEach((field) => {
    const fieldWidth = convertPixelsToGridWidth(field.width, field.type);

    if (currentRowWidth + fieldWidth <= maxRowWidth) {
      currentRow.push(field);
      currentRowWidth += fieldWidth;
    } else {
      // Linha cheia, inicia nova linha
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [field];
      currentRowWidth = fieldWidth;
    }
  });

  // Adiciona última linha (pode ser menor que 12 colunas)
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};
```

### Algoritmo de Separação

```typescript
const organizeFieldsByWidth = (
  fields: FormFieldMetadata[]
): FormFieldMetadata[][] => {
  // 1. Separa campos por tipo
  const arrayFields: FormFieldMetadata[] = [];
  const booleanFields: FormFieldMetadata[] = [];
  const regularFields: FormFieldMetadata[] = [];

  fields.forEach((field) => {
    if (field.type === "array") {
      arrayFields.push(field);
    } else if (field.type === "boolean") {
      booleanFields.push(field); // ← Separados para última linha
    } else {
      regularFields.push(field);
    }
  });

  // 2. Organiza campos regulares (algoritmo de balanceamento)
  // ... processamento de regularFields ...

  // 3. Adiciona campos boolean ao final
  if (booleanFields.length > 0) {
    const booleanRows = organizeBooleanFields(booleanFields);
    finalRows.push(...booleanRows);
  }

  return finalRows;
};
```

## Vantagens

### ✅ Organização Visual Clara

- **Inputs agrupados no topo**: Campos de entrada de dados ficam juntos
- **Checkboxes agrupados no final**: Opções booleanas separadas visualmente
- **Hierarquia intuitiva**: Dados principais → configurações/opções

### ✅ Flexibilidade da Última Linha

- Última linha pode ter **menos de 12 colunas**
- Não força balanceamento artificial
- Checkboxes podem ocupar apenas o espaço necessário

### ✅ Consistência UX

- Padrão comum em formulários web
- Usuários esperam checkboxes no final
- Facilita escaneamento visual do formulário

## Casos Especiais

### Apenas Campos Boolean

Se o formulário tem **apenas campos boolean**:

```typescript
if (regularFields.length === 0) {
  const result: FormFieldMetadata[][] = arrayFields.map((field) => [field]);
  if (booleanFields.length > 0) {
    const booleanRows = organizeBooleanFields(booleanFields);
    result.push(...booleanRows);
  }
  return result;
}
```

### Múltiplas Linhas de Checkboxes

Se houver muitos campos boolean, eles se distribuem em múltiplas linhas:

```
┌─────────────────────────────────────┐
│ ... campos regulares ...            │
├─────────────────────────────────────┤
│ ☑ Campo 1 │ ☑ Campo 2 │ ☑ Campo 3   │  ← 12 cols
├─────────────────────────────────────┤
│ ☑ Campo 4 │ ☑ Campo 5               │  ← 6 cols (última linha menor)
└─────────────────────────────────────┘
```

## Comparação: Antes vs Depois

### ❌ Antes (Misturado)

```
┌─────────────────────────────────────┐
│ Nome        │ ☑ Ativo  │ CPF        │  ← Checkboxes misturados
├─────────────────────────────────────┤
│ Email       │ ☑ Admin  │ Telefone   │  ← Confuso visualmente
└─────────────────────────────────────┘
```

### ✅ Depois (Organizado)

```
┌─────────────────────────────────────┐
│ Nome                    │ CPF       │  ← Inputs agrupados
├─────────────────────────────────────┤
│ Email                   │ Telefone  │  ← Fácil de escanear
├─────────────────────────────────────┤
│ ☑ Ativo                │ ☑ Admin   │  ← Checkboxes no final
└─────────────────────────────────────┘
```

## Integração com Outros Recursos

### Campos Ocultos (visible: false)

Campos boolean ocultos são **ignorados** no layout:

```typescript
const booleanFields: FormFieldMetadata[] = [];

fields.forEach((field) => {
  if (field.type === "boolean" && field.visible !== false) {
    booleanFields.push(field);
  }
});
```

### Larguras Personalizadas

Campos boolean respeitam suas larguras configuradas:

- **200px** → 3 colunas (mínimo)
- **400px** → 6 colunas
- **800px** → 12 colunas

### Array Fields

Campos array **NÃO** são afetados - continuam intercalados na posição original:

```
┌─────────────────────────────────────┐
│ Nome                                │  ← Regular
├─────────────────────────────────────┤
│ Endereços                           │  ← Array (linha inteira)
├─────────────────────────────────────┤
│ Email                               │  ← Regular
├─────────────────────────────────────┤
│ ☑ Ativo                │ ☑ Admin   │  ← Booleans (última linha)
└─────────────────────────────────────┘
```

## Configuração no Backend

Não há configuração adicional necessária. O sistema automaticamente:

1. Identifica campos `type: "boolean"`
2. Separa-os durante organização
3. Posiciona-os ao final do formulário

### Exemplo de Metadata

```json
{
  "formFields": [
    { "name": "name", "type": "text", "width": 400 },
    { "name": "cpf", "type": "text", "width": 400 },
    { "name": "active", "type": "boolean", "width": 200 },  ← Vai pro final
    { "name": "admin", "type": "boolean", "width": 200 },   ← Vai pro final
    { "name": "email", "type": "text", "width": 400 }
  ]
}
```

**Resultado:**

1. name, cpf (linha 1)
2. email (linha 2)
3. active, admin (linha 3 - última)

## Benefícios para Usuário Final

- 📋 **Escaneamento mais rápido** do formulário
- 🎯 **Foco nos dados principais** primeiro
- ✅ **Checkboxes facilmente localizáveis** no final
- 🎨 **Visual mais limpo e profissional**
