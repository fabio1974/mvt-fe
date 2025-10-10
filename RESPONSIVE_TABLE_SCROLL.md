# Tabela Responsiva com Scroll Horizontal

## Visão Geral

Implementação de scroll horizontal na `EntityTable` para dispositivos móveis, similar ao comportamento das tabelas responsivas do Bootstrap (`table-responsive`).

## Como Funciona

### Estrutura HTML

```tsx
<div className="entity-table-container">
  <div className="entity-table-scroll">
    <table className="entity-table">{/* Conteúdo da tabela */}</table>
  </div>
  <div className="table-footer">{/* Paginação */}</div>
</div>
```

### Camadas de Wrappers

1. **`.entity-table-container`** - Container externo (sem scroll)
2. **`.entity-table-scroll`** - Wrapper com scroll horizontal
3. **`.entity-table`** - Tabela com largura mínima

## CSS Implementado

### Desktop (>900px)

```css
.entity-table-scroll {
  overflow-x: auto;
  border-radius: 16px 16px 0 0;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.entity-table {
  width: 100%;
  min-width: 600px; /* Largura mínima para garantir usabilidade */
}
```

### Mobile (≤900px)

```css
@media (max-width: 900px) {
  .entity-table-scroll {
    /* Scroll bar personalizado */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }

  /* Webkit (Chrome, Safari) */
  .entity-table-scroll::-webkit-scrollbar {
    height: 8px;
  }

  .entity-table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .entity-table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
}
```

## Comportamento

### Desktop (>900px)

- Tabela ocupa 100% da largura disponível
- Sem scroll horizontal (a menos que muitas colunas)
- Todas as colunas visíveis

### Tablet (641px - 900px)

- Tabela mantém largura mínima de 600px
- Scroll horizontal ativado se necessário
- Scroll bar customizado visível

### Mobile (≤640px)

- Tabela mantém largura mínima de 600px
- Scroll horizontal sempre ativado
- Scroll bar fino e discreto
- Smooth scrolling no iOS

## Recursos Implementados

### ✅ Scroll Horizontal

- Ativado automaticamente quando conteúdo excede largura
- `-webkit-overflow-scrolling: touch` para iOS

### ✅ Scroll Bar Customizado

- **Altura:** 8px (fino e discreto)
- **Track:** Cinza claro (#f1f5f9)
- **Thumb:** Cinza médio (#cbd5e1)
- **Hover:** Cinza escuro (#94a3b8)

### ✅ Largura Mínima

- `min-width: 600px` garante legibilidade
- Previne compressão excessiva das colunas

### ✅ Visual Profissional

- Bordas arredondadas mantidas
- Shadow movido para o wrapper
- Transições suaves

## Vantagens

### 📱 Mobile-First

- Mantém todas as colunas acessíveis
- Usuário decide o que ver (scroll)
- Não oculta informações

### 👆 UX Melhorada

- Scroll intuitivo (deslizar horizontalmente)
- Indicador visual claro (scroll bar)
- Smooth scrolling no iOS

### 🎨 Consistência Visual

- Mesma estrutura em todos os dispositivos
- Sem quebras de layout
- Design responsivo real

## Comparação com Bootstrap

### Bootstrap `table-responsive`

```html
<div class="table-responsive">
  <table class="table">
    ...
  </table>
</div>
```

### Nossa Implementação

```tsx
<div className="entity-table-scroll">
  <table className="entity-table">...</table>
</div>
```

### Diferenças

| Aspecto    | Bootstrap           | Nossa Implementação |
| ---------- | ------------------- | ------------------- |
| Scroll Bar | Padrão do navegador | Customizado         |
| Breakpoint | 768px               | 900px               |
| Min-width  | Nenhuma             | 600px               |
| iOS Smooth | Não                 | Sim                 |
| Visual     | Básico              | Profissional        |

## Ajustes Futuros (Opcional)

### 1. Largura Mínima Dinâmica

```css
.entity-table {
  min-width: max(600px, fit-content);
}
```

### 2. Sombra Lateral (Indicador de Scroll)

```css
.entity-table-scroll {
  background: linear-gradient(90deg, white 30%, transparent),
    linear-gradient(270deg, white 30%, transparent) 100% 0, linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.1),
      transparent
    ), linear-gradient(270deg, rgba(0, 0, 0, 0.1), transparent) 100% 0;
  background-repeat: no-repeat;
  background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
  background-attachment: local, local, scroll, scroll;
}
```

### 3. Sticky Primeira Coluna

```css
.entity-table th:first-child,
.entity-table td:first-child {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
}
```

## Resumo

✅ Scroll horizontal implementado  
✅ Scroll bar customizado para mobile  
✅ Largura mínima de 600px  
✅ Smooth scrolling no iOS  
✅ Visual profissional mantido  
✅ Compatível com todos os navegadores  
✅ UX similar ao Bootstrap table-responsive

**Resultado:** Tabelas totalmente usáveis em dispositivos móveis! 📱
