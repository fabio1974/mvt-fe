# Textarea: Ordenação e Largura Dupla

## Melhorias Implementadas

### 1️⃣ Textarea Sempre Renderizado Por Último

### 2️⃣ Largura Dupla em ArrayField (Entidades Filhas)

---

## 1. Textarea Como Último Campo

### Problema Anterior

Textareas apareciam misturados com outros campos, quebrando o layout visual.

### Solução Implementada

#### EntityForm.tsx - Separação de Campos

```tsx
// Separa campos por tipo para organização
const regularFields = section.fields.filter(
  (f) => f.type !== "array" && f.type !== "textarea"
);
const textareaFields = section.fields.filter((f) => f.type === "textarea");
const arrayFields = section.fields.filter((f) => f.type === "array");
```

#### Ordem de Renderização

```tsx
return (
  <FormContainer>
    {/* 1. Campos normais (text, number, select, etc) */}
    <div className="grid">
      {regularFields.map(...)}
    </div>

    {/* 2. Campos textarea (largura dupla) */}
    <div className="grid">
      {textareaFields.map((field) => (
        <div className="form-field-wide">
          {renderField(field)}
        </div>
      ))}
    </div>

    {/* 3. Campos array (largura completa) */}
    {arrayFields.map(...)}
  </FormContainer>
);
```

### Layout Visual Resultante

```
┌─────────────────────────────────────────────┐
│ Formulário de Evento                        │
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │ Nome │ │ Tipo │ │ Data │  ← Campos normais│
│ └──────┘ └──────┘ └──────┘                  │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ Descrição (textarea, largura dupla) │    │
│ │                                     │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ Categorias (array, largura completa)│    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 2. Largura Dupla no ArrayField

### Problema Anterior

Textareas em entidades filhas (ex: `observations` em `eventCategory`) **não** dobravam de largura.

### Causa

ArrayField renderizava todos os campos no mesmo grid, sem separação por tipo.

### Solução Implementada

#### ArrayField.tsx - Separação e Renderização

```tsx
{!isItemCollapsed && (
  <div style={{ padding: "20px" }}>
    {(() => {
      // Separa campos normais dos textareas
      const regularFields = fields.filter(f => f.type !== "textarea");
      const textareaFields = fields.filter(f => f.type === "textarea");

      return (
        <>
          {/* Grid 1: Campos normais */}
          {regularFields.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px"
            }}>
              {regularFields.map(field => (
                <FormField>{/* ... */}</FormField>
              ))}
            </div>
          )}

          {/* Grid 2: Textareas com largura dupla */}
          {textareaFields.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px"
            }}>
              {textareaFields.map(field => (
                <div className="form-field-wide">  {/* ← Largura dupla! */}
                  <FormField>
                    <FormTextarea {...} />
                  </FormField>
                </div>
              ))}
            </div>
          )}
        </>
      );
    })()}
  </div>
)}
```

### Layout Visual - Categoria de Evento

```
┌─────────────────────────────────────────────┐
│ Categoria 1                            [−] ✕│
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │ Nome │ │ Idade│ │ Idade│  ← Campos normais│
│ │      │ │ Min  │ │ Max  │                  │
│ └──────┘ └──────┘ └──────┘                  │
│                                             │
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │Gênero│ │Dist. │ │Un.   │                  │
│ └──────┘ └──────┘ └──────┘                  │
│                                             │
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │Preço │ │ Max  │ │Atual │                  │
│ └──────┘ └──────┘ └──────┘                  │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ Observações (textarea, 2x largura)  │    │
│ │                                     │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## Comparação: Antes vs Depois

### ❌ ANTES

#### EntityForm

```
Nome  Descrição  Tipo     ← Misturado!
Data  Cidade     Status
```

#### ArrayField (Categoria)

```
Nome  Idade  Gênero  Observações  ← Mesma largura!
```

### ✅ DEPOIS

#### EntityForm

```
Nome  Tipo  Data  Cidade  Status    ← Campos normais

Descrição (largura dupla)         ← Textarea separado

Categorias                         ← Array por último
```

#### ArrayField (Categoria)

```
Nome  Idade  Gênero                ← Campos normais

Preço  Max  Atual

Observações (largura dupla)       ← Textarea separado
```

---

## Ordem de Renderização Completa

### EntityForm (Formulário Principal)

1. **Campos Normais** (`text`, `number`, `select`, `date`, `entity`)

   - Grid: `repeat(auto-fit, minmax(250px, 1fr))`
   - Largura: 1 coluna cada

2. **Campos Textarea** (`textarea`)

   - Grid separado: `repeat(auto-fit, minmax(250px, 1fr))`
   - Largura: **2 colunas** (`.form-field-wide`)
   - Sempre após campos normais

3. **Campos Array** (`array` / relacionamentos 1:N)
   - Sem grid (largura completa)
   - Sempre por último

### ArrayField (Formulário de Entidade Filha)

1. **Campos Normais** (`text`, `number`, `select`, etc)

   - Grid: `repeat(auto-fit, minmax(200px, 1fr))`
   - Largura: 1 coluna cada

2. **Campos Textarea** (`textarea`)
   - Grid separado: `repeat(auto-fit, minmax(200px, 1fr))`
   - Largura: **2 colunas** (`.form-field-wide`)
   - Sempre após campos normais

---

## CSS Utilizado

### Classe `.form-field-wide`

```css
/* Form Field Wide - Para campos que ocupam largura dupla */
.form-field-wide {
  grid-column: span 2; /* Ocupa 2 colunas no grid */
}

/* Em mobile, volta para 1 coluna */
@media (max-width: 640px) {
  .form-field-wide {
    grid-column: span 1;
  }
}
```

### Grids Responsivos

#### EntityForm

```css
/* Desktop: minmax(250px, 1fr) */
gridtemplatecolumns: "repeat(auto-fit, minmax(250px, 1fr))";
```

#### ArrayField

```css
/* Desktop: minmax(200px, 1fr) - menor para caber mais */
gridtemplatecolumns: "repeat(auto-fit, minmax(200px, 1fr))";
```

---

## Benefícios

### ✅ UX Melhorada

- Campos de texto longos sempre no final
- Não quebram o alinhamento dos campos normais
- Visualmente mais organizado

### ✅ Consistência

- Mesma lógica em EntityForm e ArrayField
- Mesmo comportamento em formulários principais e filhos
- Largura dupla funciona em todos os contextos

### ✅ Responsividade

- Largura dupla em desktop/tablet
- Largura normal em mobile
- Adapta-se automaticamente ao espaço disponível

### ✅ Escalabilidade

- Fácil adicionar mais tipos especiais
- Lógica de separação reutilizável
- Manutenção simplificada

---

## Exemplo Completo: Evento com Categorias

### Backend Metadata

```json
{
  "formFields": [
    { "name": "name", "type": "text" },
    { "name": "eventType", "type": "select" },
    { "name": "eventDate", "type": "date" },
    { "name": "description", "type": "textarea" }, // ← Última linha
    {
      "name": "categories",
      "type": "nested",
      "relationship": {
        "fields": [
          { "name": "name", "type": "text" },
          { "name": "price", "type": "number" },
          { "name": "observations", "type": "textarea" } // ← Última linha
        ]
      }
    }
  ]
}
```

### Frontend Renderizado

```
Evento
├─ Nome, Tipo, Data           (linha 1 - campos normais)
├─ Descrição                  (linha 2 - textarea, 2x largura)
└─ Categorias                 (array)
   └─ Categoria 1
      ├─ Nome, Preço          (linha 1 - campos normais)
      └─ Observações          (linha 2 - textarea, 2x largura)
```

---

## Tipos de Campos Suportados

### Campos Normais (1 coluna)

- `text` / `string`
- `number` / `integer` / `currency`
- `select` / `enum`
- `date` / `datetime`
- `boolean`
- `entity` / `city`

### Campos Especiais

#### Textarea (2 colunas, último)

- `textarea`
- Sempre renderizado após campos normais
- Largura dupla em desktop
- Largura normal em mobile

#### Array (largura completa, último de todos)

- `array` / `nested`
- Sempre renderizado por último
- Ocupa 100% da largura

---

## Resumo das Mudanças

### EntityForm.tsx

✅ Separação de campos: `regularFields`, `textareaFields`, `arrayFields`  
✅ Três grids distintos em vez de um único  
✅ Textareas sempre após campos normais  
✅ Arrays sempre por último  
✅ Classe `.form-field-wide` aplicada aos textareas

### ArrayField.tsx

✅ Separação de campos: `regularFields`, `textareaFields`  
✅ Dois grids distintos dentro do item expandido  
✅ Textareas sempre após campos normais  
✅ Classe `.form-field-wide` aplicada aos textareas  
✅ Mesmo comportamento do formulário principal

### FormComponents.css

✅ Classe `.form-field-wide` já existente  
✅ `grid-column: span 2` em desktop  
✅ `grid-column: span 1` em mobile

---

## Resultado Final

**Textareas agora:**

1. ✅ Sempre aparecem por último (após campos normais)
2. ✅ Ocupam largura dupla no desktop
3. ✅ Funcionam tanto no formulário principal quanto em entidades filhas
4. ✅ Adaptam-se responsivamente ao mobile (largura normal)

**Layout organizado, consistente e profissional em todos os formulários!** 📝✨
