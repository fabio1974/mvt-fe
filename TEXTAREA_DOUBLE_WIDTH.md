# Campo Textarea com Largura Dupla

## Visão Geral

Campos do tipo `textarea` são renderizados com **largura dupla** no formulário, ocupando 2 colunas no grid responsivo.

## Configuração Backend

### Exemplo de FormField para Textarea

```json
{
  "name": "description",
  "label": "Descrição",
  "type": "textarea",
  "sortable": false,
  "searchable": true,
  "visible": false,
  "format": null,
  "width": 150,
  "align": "left",
  "required": false,
  "placeholder": "Digite a descrição...",
  "minLength": null,
  "maxLength": null,
  "hiddenFromTable": true,
  "hiddenFromForm": false,
  "hiddenFromFilter": true
}
```

### Campos Importantes

| Campo             | Valor        | Descrição                                             |
| ----------------- | ------------ | ----------------------------------------------------- |
| `type`            | `"textarea"` | Define que será renderizado como textarea             |
| `hiddenFromForm`  | `false`      | Deve ser `false` para aparecer no formulário          |
| `hiddenFromTable` | `true`       | Normalmente `true` (textarea não cabe bem em tabelas) |
| `placeholder`     | string       | Texto de placeholder opcional                         |
| `required`        | boolean      | Se é obrigatório ou não                               |
| `maxLength`       | number       | Limite de caracteres (opcional)                       |

## Implementação Frontend

### 1. CSS - Classe `.form-field-wide`

```css
/* Form Field Wide - Para campos que ocupam largura dupla (textarea, etc) */
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

### 2. EntityForm.tsx - Aplicação da Classe

```tsx
{
  regularFields.map((field) => (
    <div
      key={field.name}
      className={field.type === "textarea" ? "form-field-wide" : ""}
    >
      {renderField(field)}
    </div>
  ));
}
```

### 3. Renderização do Campo

```tsx
case "textarea":
  fieldContent = (
    <FormField
      label={field.label}
      required={field.required}
      error={error}
    >
      <FormTextarea
        placeholder={field.placeholder}
        value={stringValue}
        onChange={(e) => handleChange(field.name, e.target.value)}
        disabled={field.disabled || loading || readonly}
        required={field.required}
      />
    </FormField>
  );
  break;
```

## Layout Visual

### Desktop (>640px)

```
┌─────────────────────────────────────────────────────┐
│ Formulário de Evento                                │
├─────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│ │ Nome        │  │ Slug        │  │ Cidade      │  │
│ └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ Descrição (largura dupla)                     │  │
│ │                                               │  │
│ │                                               │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌─────────────┐  ┌─────────────┐                  │
│ │ Data Início │  │ Data Fim    │                  │
│ └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### Mobile (≤640px)

```
┌─────────────────────┐
│ Formulário de Evento│
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Nome            │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Slug            │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Cidade          │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Descrição       │ │
│ │ (1 coluna)      │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Data Início     │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## Comportamento Responsivo

### Desktop/Tablet (>640px)

- **Grid:** `repeat(auto-fit, minmax(250px, 1fr))`
- **Textarea:** `grid-column: span 2` - Ocupa 2 colunas
- **Largura:** Aproximadamente o dobro dos campos normais

### Mobile (≤640px)

- **Grid:** 1 coluna (auto-colapso)
- **Textarea:** `grid-column: span 1` - Ocupa mesma largura dos outros
- **Motivo:** Tela estreita, todos os campos já ocupam largura total

## Exemplo Completo - Event FormFields

```json
{
  "sections": [
    {
      "id": "basic-info",
      "title": "Informações Básicas",
      "fields": [
        {
          "name": "name",
          "label": "Nome do Evento",
          "type": "text",
          "required": true
        },
        {
          "name": "slug",
          "label": "URL Amigável",
          "type": "text",
          "required": true
        },
        {
          "name": "cityId",
          "label": "Cidade",
          "type": "entity",
          "required": true
        },
        {
          "name": "description",
          "label": "Descrição",
          "type": "textarea",
          "required": false,
          "placeholder": "Descreva o evento...",
          "hiddenFromTable": true,
          "hiddenFromForm": false
        },
        {
          "name": "startDate",
          "label": "Data de Início",
          "type": "datetime",
          "required": true
        },
        {
          "name": "endDate",
          "label": "Data de Término",
          "type": "datetime",
          "required": true
        }
      ]
    }
  ]
}
```

### Renderização Esperada

1. **Linha 1:** Nome, Slug, Cidade (3 campos)
2. **Linha 2:** Descrição (largura dupla = 2 colunas)
3. **Linha 3:** Data Início, Data Fim (2 campos)

## Outros Campos que Podem Usar Largura Dupla

Futuramente, podemos aplicar `.form-field-wide` para:

- **Rich Text Editors** - Editores WYSIWYG
- **Code Editors** - Campos de código
- **Long Text** - Textos longos
- **Address** - Endereços completos
- **JSON Editors** - Editores JSON

### Como Aplicar

Basta adicionar a condição no EntityForm.tsx:

```tsx
className={
  field.type === "textarea" ||
  field.type === "richtext" ||
  field.type === "code"
    ? "form-field-wide"
    : ""
}
```

## Vantagens

✅ **Melhor UX:** Mais espaço para textos longos  
✅ **Visual Limpo:** Campos grandes não espremem outros  
✅ **Responsivo:** Adapta-se automaticamente ao tamanho da tela  
✅ **Consistente:** Mesmo padrão em todos os formulários  
✅ **Fácil Manutenção:** Apenas mudar `type: "textarea"` no backend

## Resumo

- ✅ `type: "textarea"` no backend
- ✅ `hiddenFromForm: false` para aparecer no formulário
- ✅ Frontend aplica automaticamente `grid-column: span 2`
- ✅ Largura dupla em desktop/tablet
- ✅ Largura normal em mobile
- ✅ CSS: `.form-field-wide` em `FormComponents.css`
- ✅ Lógica: EntityForm.tsx verifica `field.type === "textarea"`

**Textareas agora ocupam o dobro da largura! 📝**
