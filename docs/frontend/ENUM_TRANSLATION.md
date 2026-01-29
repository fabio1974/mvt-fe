# Tradução de ENUMs nas Tabelas

## 🎯 Problema

Os valores de ENUM aparecem sem tradução nas tabelas (ex: "RUNNING", "PUBLISHED" ao invés de "Em Andamento", "Publicado").

## ✅ Solução Implementada (Mais Performática)

### Estratégia

Aproveitar o campo `options` que já vem no metadata do backend - **sem fazer requests adicionais**.

### Como Funciona

1. **Backend envia as traduções** no metadata:

```json
{
  "name": "eventType",
  "label": "Tipo de Evento",
  "type": "select",
  "options": [
    { "value": "RUNNING", "label": "Corrida" },
    { "value": "CYCLING", "label": "Ciclismo" },
    { "value": "TRAIL_RUNNING", "label": "Trail Running" },
    { "value": "TRIATHLON", "label": "Triatlo" }
  ]
}
```

2. **Frontend faz lookup local** na função `formatValue`:

```typescript
case "enum":
case "select":
  if (field.options && field.options.length > 0) {
    const option = field.options.find(opt => opt.value === String(value));
    return option ? option.label : String(value);
  }
  return String(value);
```

### ⚠️ Importante: Tipos Aceitos

O código aceita **ambos** os tipos:

- `type: "enum"` - tipo semântico tradicional
- `type: "select"` - tipo usado pelo backend atual

Ambos funcionam da mesma forma se tiverem o campo `options` populado.

### Vantagens

✅ **Zero requests adicionais** - usa dados já carregados no metadata  
✅ **Performance ótima** - lookup em array pequeno (O(n) onde n é número de opções do ENUM)  
✅ **Centralizado** - tradução vem do backend (single source of truth)  
✅ **Fallback seguro** - se não encontrar tradução, exibe o valor original  
✅ **Reutilizável** - mesmas `options` usadas em filtros e formulários

### Performance

- **Metadata carregado**: 1 vez na inicialização da aplicação
- **Tradução de ENUM**: Lookup local em array (tipicamente 3-10 itens)
- **Custo por célula da tabela**: ~0.001ms (insignificante)
- **Sem cache necessário**: operação já é extremamente rápida

### Comparação com Outras Abordagens

| Abordagem                  | Performance | Complexidade | Manutenibilidade   |
| -------------------------- | ----------- | ------------ | ------------------ |
| **Options do Metadata** ✅ | Ótima       | Baixa        | Alta               |
| Dicionário no Frontend     | Boa         | Média        | Baixa (duplicação) |
| Request por valor          | Péssima     | Alta         | Média              |
| Cache de traduções         | Boa         | Alta         | Média              |

## 📋 Checklist de Implementação

- [x] Adicionar case "enum" na função `formatValue`
- [x] Fazer lookup nas `field.options`
- [x] Retornar `option.label` quando encontrado
- [x] Fallback para valor original se não encontrar
- [ ] **Backend**: Garantir que todos ENUMs enviam `options` no metadata

## 🔧 Modificações Realizadas

### EntityTable.tsx

- Adicionado case `"enum"` no switch de `formatValue`
- Implementado lookup nas `field.options` do metadata
- Fallback para valor original quando option não encontrada

## 🎨 Exemplo de Uso

**Antes:**

```
Status: PUBLISHED
Tipo: RUNNING
```

**Depois:**

```
Status: Publicado
Tipo: Em Andamento
```

## 📝 Notas para o Backend

O backend já deve estar enviando as `options` nos metadados dos campos ENUM. Exemplo:

```java
@Enumerated(EnumType.STRING)
@Column(name = "status")
private EventStatus status;

// No metadata builder:
FieldMetadata.builder()
    .name("status")
    .type("enum")
    .options(Arrays.asList(
        new FilterOption("DRAFT", "Rascunho"),
        new FilterOption("PUBLISHED", "Publicado"),
        new FilterOption("RUNNING", "Em Andamento"),
        new FilterOption("FINISHED", "Finalizado")
    ))
    .build()
```

## 🚀 Próximos Passos

1. Testar com todos os ENUMs da aplicação
2. Verificar se backend está enviando `options` para todos os campos ENUM
3. Aplicar mesma lógica em outros componentes se necessário (ex: EntityCard)
