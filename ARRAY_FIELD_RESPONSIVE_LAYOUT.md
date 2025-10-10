# Layout Responsivo em Formulários de Entidades Relacionadas (1:N)

## Visão Geral

Os formulários de **entidades relacionadas 1:N** (ArrayField) agora utilizam o mesmo sistema de **layout responsivo moderno** do formulário principal.

## Problema Anterior

Antes, o ArrayField usava grid fixo que não se adaptava:

```css
/* ❌ ANTES: Grid fixo de 3 colunas */
gridtemplatecolumns: "repeat(3, 1fr)";
```

**Problemas:**

- Sempre 3 colunas, independente do tamanho da tela
- Campos muito estreitos em telas pequenas
- Não responsivo em mobile
- Não se adapta à quantidade de campos

## Solução Implementada

Agora usa **CSS Grid com auto-fit** e **largura mínima**:

```css
/* ✅ DEPOIS: Grid responsivo */
gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
gap: "16px"
```

## Como Funciona

### Auto-fit

O `auto-fit` faz o grid **se adaptar automaticamente** ao espaço disponível:

- **Telas grandes**: Mostra múltiplas colunas (3-5 campos)
- **Telas médias**: Reduz para 2-3 colunas
- **Telas pequenas**: 1 coluna (mobile)

### Minmax(200px, 1fr)

Define largura mínima e máxima dos campos:

- **200px**: Largura mínima (campos nunca ficam menores)
- **1fr**: Largura máxima (expande para preencher espaço)

## Exemplo Visual

### ArrayField: Categorias do Evento

```json
{
  "name": "categories",
  "label": "Categorias",
  "type": "nested",
  "relationship": {
    "type": "ONE_TO_MANY",
    "fields": [
      { "name": "name", "label": "Nome", "width": 200 },
      { "name": "minAge", "label": "Idade Mínima", "width": 100 },
      { "name": "maxAge", "label": "Idade Máxima", "width": 100 },
      { "name": "gender", "label": "Gênero", "width": 120 },
      { "name": "distance", "label": "Distância", "width": 100 },
      { "name": "price", "label": "Preço", "width": 120 }
    ]
  }
}
```

### Renderização em Tela Grande (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Categoria 1                                    [Remover] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Nome     │ │ Idade Mín│ │ Idade Máx│ │ Gênero   │        │
│ │ [______] │ │ [_____]  │ │ [_____]  │ │ [▼ ___]  │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│ │ Distância│ │ Unidade  │ │ Preço    │                     │
│ │ [_____]  │ │ [▼ ___]  │ │ [R$ __]  │                     │
│ └──────────┘ └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

4 campos na primeira linha, 3 na segunda (auto-fit)

### Renderização em Tablet

```
┌───────────────────────────────────────────┐
│ 📋 Categoria 1              [Remover]     │
├───────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐          │
│ │ Nome        │ │ Idade Mín   │          │
│ │ [_________] │ │ [_________] │          │
│ └─────────────┘ └─────────────┘          │
│                                            │
│ ┌─────────────┐ ┌─────────────┐          │
│ │ Idade Máx   │ │ Gênero      │          │
│ │ [_________] │ │ [▼ _______] │          │
│ └─────────────┘ └─────────────┘          │
│                                            │
│ ┌─────────────┐ ┌─────────────┐          │
│ │ Distância   │ │ Preço       │          │
│ │ [_________] │ │ [R$ _____]  │          │
│ └─────────────┘ └─────────────┘          │
└───────────────────────────────────────────┘
```

2 campos por linha

### Renderização em Mobile

```
┌─────────────────────────┐
│ 📋 Categoria 1          │
│               [Remover] │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Nome                │ │
│ │ [_________________] │ │
│ └─────────────────────┘ │
│                          │
│ ┌─────────────────────┐ │
│ │ Idade Mínima        │ │
│ │ [_________________] │ │
│ └─────────────────────┘ │
│                          │
│ ┌─────────────────────┐ │
│ │ Idade Máxima        │ │
│ │ [_________________] │ │
│ └─────────────────────┘ │
│                          │
│ ┌─────────────────────┐ │
│ │ Gênero              │ │
│ │ [▼ _______________] │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

1 campo por linha (largura total)

## Código Atualizado

### ArrayField.tsx

```tsx
{
  !isItemCollapsed && (
    <div style={{ padding: "20px" }}>
      <div
        data-component="array-field-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {fields.map((field) => (
          <FormField
            key={field.name}
            label={field.label}
            required={field.required}
          >
            {/* Renderização do campo */}
          </FormField>
        ))}
      </div>
    </div>
  );
}
```

## Breakpoints Automáticos

O CSS Grid calcula automaticamente quando quebrar linha baseado em:

### Container de 1200px (Desktop)

- 200px mínimo × 6 campos = 1200px → **6 colunas**

### Container de 800px (Tablet)

- 200px mínimo × 4 campos = 800px → **4 colunas**

### Container de 400px (Mobile)

- 200px mínimo × 2 campos = 400px → **2 colunas**

### Container de 300px (Mobile pequeno)

- 200px mínimo × 1 campo = 200px → **1 coluna**

## Vantagens

### ✅ Responsividade Total

- Se adapta automaticamente a qualquer tamanho de tela
- Não precisa definir breakpoints manualmente
- Funciona em qualquer dispositivo

### ✅ Largura Mínima Garantida

- Campos nunca ficam menores que 200px
- Mantém legibilidade em todas as telas
- Previne campos muito comprimidos

### ✅ Aproveitamento de Espaço

- Expande campos para preencher espaço disponível
- Distribui uniformemente em telas grandes
- Maximiza uso do espaço

### ✅ Consistência com Formulário Principal

- Mesmo sistema de layout em todo o app
- Experiência uniforme para o usuário
- Fácil manutenção

## Comparação: Antes vs Depois

### ❌ Antes (Grid Fixo)

```css
gridtemplatecolumns: "repeat(3, 1fr)";
```

**Em tela de 300px:**

- 3 colunas forçadas = 100px por campo
- Campos muito estreitos
- Difícil de usar
- Não responsivo

### ✅ Depois (Grid Responsivo)

```css
gridtemplatecolumns: "repeat(auto-fit, minmax(200px, 1fr))";
```

**Em tela de 300px:**

- 1 coluna automática = 300px por campo
- Campos largos e confortáveis
- Fácil de usar
- Totalmente responsivo

## Aplicação em Outros Componentes

Este mesmo padrão pode ser aplicado em:

### EntityFilters (Filtros)

```css
gridtemplatecolumns: "repeat(auto-fit, minmax(250px, 1fr))";
```

### EntityForm (Formulário Principal)

```css
gridtemplatecolumns: "repeat(auto-fit, minmax(250px, 1fr))";
```

### ArrayField (1:N)

```css
gridtemplatecolumns: "repeat(auto-fit, minmax(200px, 1fr))";
```

**Nota:** ArrayField usa 200px mínimo (menor) porque os campos costumam ser menores (idade, preço, etc.)

## Customização por Backend

O backend pode influenciar o layout através do `width`:

```json
{
  "fields": [
    { "name": "description", "width": 800 }, // Campo maior
    { "name": "age", "width": 100 } // Campo menor
  ]
}
```

**Nota:** Com auto-fit, todos os campos expandem igualmente. O width é usado mais para ordenação/prioridade.

## Teste de Responsividade

Para testar, redimensione o navegador e observe:

1. **1200px+**: Múltiplos campos por linha (5-6)
2. **992px-1199px**: 4-5 campos por linha
3. **768px-991px**: 3-4 campos por linha
4. **576px-767px**: 2-3 campos por linha
5. **<576px**: 1-2 campos por linha
6. **<400px**: 1 campo por linha

## CSS Grid Properties

### display: grid

Ativa o layout de grid

### gridTemplateColumns

Define a estrutura das colunas

### repeat()

Repete o padrão de colunas

### auto-fit

Ajusta automaticamente o número de colunas

### minmax()

Define tamanho mínimo e máximo

### 1fr

"1 fração" do espaço disponível

### gap

Espaçamento entre itens (linhas e colunas)

## Recursos Relacionados

- 📄 `RESPONSIVE_FORM_LAYOUT.md` - Layout responsivo do formulário principal
- 📄 `CSS_GRID_LAYOUT.md` - Sistema de grid CSS
- 📄 `FILTERS_OBJECT_FORMAT.md` - Layout de filtros responsivo

## Resultado Final

✅ **ArrayField agora é totalmente responsivo**  
✅ **Mesma experiência do formulário principal**  
✅ **Funciona perfeitamente em qualquer dispositivo**  
✅ **Campos sempre legíveis (min 200px)**  
✅ **Auto-adapta ao espaço disponível**
