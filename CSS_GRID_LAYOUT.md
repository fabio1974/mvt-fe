# Sistema de Layout com CSS Grid

## Visão Geral

O formulário agora utiliza **CSS Grid moderno** para criar um layout responsivo e flexível baseado em 12 colunas.

## Arquitetura

### Sistema de 12 Colunas

Cada linha do formulário é um **grid de 12 colunas**:

```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 12px;
```

### Larguras dos Campos

Cada campo ocupa um número específico de colunas baseado na conversão de pixels:

| Backend (pixels) | Grid (colunas) | Porcentagem | Uso Típico          |
| ---------------- | -------------- | ----------- | ------------------- |
| 200px            | 3 cols         | 25%         | Boolean, CPF        |
| 400px            | 6 cols         | 50%         | Nome, Email         |
| 800px            | 12 cols        | 100%        | Descrição, Textarea |

### Implementação

```tsx
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: "12px",
    marginBottom: "12px",
  }}
>
  {row.map((field) => {
    const gridWidth = convertPixelsToGridWidth(field.width, field.type);
    return (
      <div key={field.name} style={{ gridColumn: `span ${gridWidth}` }}>
        {renderField(field)}
      </div>
    );
  })}
</div>
```

## Comportamento Responsivo

### Grid Template Columns

`repeat(12, 1fr)` cria 12 colunas de tamanho igual:

- `1fr` = 1 fração do espaço disponível
- Todas as colunas têm a mesma largura
- Se ajusta automaticamente ao tamanho do container

### Grid Column Span

`gridColumn: 'span X'` faz o elemento ocupar X colunas:

- `span 3` = ocupa 3 colunas (25%)
- `span 6` = ocupa 6 colunas (50%)
- `span 12` = ocupa 12 colunas (100%)

### Gap

`gap: 12px` adiciona espaçamento entre campos:

- Horizontal: 12px entre colunas
- Vertical: 12px entre linhas (quando quebra)
- Mais limpo que `padding-right` manual

## Exemplos Visuais

### Linha Completa (12 colunas)

```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│                  Nome (span 6)                │    CPF    │
│                                               │ (span 3)  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
  1    2    3    4    5    6    7    8    9   10   11   12
```

### Múltiplos Campos por Linha

```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│         Campo 1        │         Campo 2        │  Campo 3  │
│       (span 4)         │       (span 4)         │ (span 4)  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

### Campos Boolean na Última Linha

```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│                  Nome (span 6)                │  Email    │
│                                               │ (span 6)  │
├────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┤
│   ☑ Ativo   │ ☑ Newsletter │  ☑ Admin   │                 │
│  (span 3)   │   (span 3)   │  (span 3)  │                 │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

## Vantagens do CSS Grid

### ✅ Responsividade Nativa

- Colunas se ajustam automaticamente ao container
- Não precisa calcular porcentagens manualmente
- Funciona em qualquer tamanho de tela

### ✅ Gap Automático

- `gap` é mais semântico que `padding-right`
- Espaçamento consistente entre todos os campos
- Não precisa condicional para último campo da linha

### ✅ Alinhamento Preciso

- Campos alinhados perfeitamente em colunas verticais
- Grid garante consistência visual
- Fácil criar layouts complexos

### ✅ Código Limpo

```tsx
// ❌ Antes (cálculo manual de largura)
<div style={{
  width: `${(gridWidth / 12) * 100}%`,
  paddingRight: gridWidth === 12 ? "0" : "12px",
  boxSizing: "border-box"
}}>

// ✅ Depois (CSS Grid)
<div style={{ gridColumn: `span ${gridWidth}` }}>
```

## Casos Especiais

### Campos Array (Linha Inteira)

Campos array ignoram o grid e ocupam a linha completa:

```tsx
case "array":
  return (
    <div style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
      <ArrayField ... />
    </div>
  );
```

- `gridColumn: "1 / -1"` = da coluna 1 até a última
- Equivalente a `span 12` mas mais explícito

### Campos Ocultos

Campos com `visible: false` não são renderizados:

```tsx
if (field.visible === false) return null;
```

## Comparação: Antes vs Depois

### ❌ Antes (Width Percentage)

```tsx
// Cálculo manual de largura
const widthPercentage = (gridWidth / 12) * 100;

// Wrapper com largura fixa
<div style={{
  width: `${widthPercentage}%`,
  paddingRight: gridWidth === 12 ? "0" : "12px",
  boxSizing: "border-box"
}}>
  {fieldContent}
</div>

// FormRow com columns (não usado efetivamente)
<FormRow columns={12}>
  {row.map(renderField)}
</FormRow>
```

**Problemas:**

- Cálculo de porcentagem manual
- Padding condicional complexo
- FormRow não aplicava grid real
- Campos não ficavam alinhados verticalmente

### ✅ Depois (CSS Grid)

```tsx
// Container com grid de 12 colunas
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: "12px",
    marginBottom: "12px",
  }}
>
  {row.map((field) => {
    const gridWidth = convertPixelsToGridWidth(field.width, field.type);
    return (
      <div style={{ gridColumn: `span ${gridWidth}` }}>
        {renderField(field)}
      </div>
    );
  })}
</div>
```

**Vantagens:**

- CSS Grid nativo do navegador
- Gap automático e consistente
- Alinhamento perfeito de colunas
- Código mais limpo e semântico
- Melhor responsividade

## Estrutura de Renderização

```
FormContainer (section wrapper)
  └─ Grid Container (12 columns)
      ├─ Grid Item (span 6)
      │   └─ FormField (Nome)
      ├─ Grid Item (span 6)
      │   └─ FormField (Email)
      └─ Grid Item (span 12)
          └─ ArrayField (Endereços)
  └─ Grid Container (12 columns) ← Linha de booleans
      ├─ Grid Item (span 3)
      │   └─ FormField (Ativo)
      └─ Grid Item (span 3)
          └─ FormField (Newsletter)
```

## Compatibilidade

CSS Grid é suportado em todos os navegadores modernos:

- ✅ Chrome 57+ (2017)
- ✅ Firefox 52+ (2017)
- ✅ Safari 10.1+ (2017)
- ✅ Edge 16+ (2017)

## Performance

CSS Grid é **otimizado pelo navegador**:

- Cálculos de layout feitos pela engine CSS
- Melhor performance que JavaScript manual
- Re-renders mais eficientes
- Menos recálculos de estilo

## Conclusão

O uso de CSS Grid moderno traz:

- 🎯 **Layout mais preciso**
- 🚀 **Melhor performance**
- 🧹 **Código mais limpo**
- 📱 **Responsividade nativa**
- 🎨 **Alinhamento perfeito**
