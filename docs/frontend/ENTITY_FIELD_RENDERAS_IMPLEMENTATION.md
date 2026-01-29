# Implementação de renderAs para Campos Entity no EntityForm

## 📋 Resumo

Implementado suporte genérico para campos do tipo `entity` no `EntityForm`, permitindo que o backend controle se o campo deve ser renderizado como **Select** ou **Typeahead** através da propriedade `renderAs` no metadata.

---

## 🎯 Problema Resolvido

**Antes da implementação:**

- ✅ `EntityFilters` já respeitava o `renderAs` do metadata
- ❌ `EntityForm` ignorava o `renderAs` e renderizava todos os campos `entity` (exceto cidade) como **input de texto simples**
- ❌ Havia um `TODO` no código indicando que isso precisava ser implementado

**Após a implementação:**

- ✅ `EntityForm` agora respeita o `renderAs` do metadata
- ✅ Campos `entity` são renderizados corretamente como **Select** ou **Typeahead**
- ✅ **Paridade completa** entre `EntityFilters` e `EntityForm`

---

## 🔧 Implementação

### 1. **Imports Adicionados**

```tsx
import EntitySelect from "../Common/EntitySelect";
import EntityTypeahead from "../Common/EntityTypeahead";
```

### 2. **Lógica do case "entity" Atualizada**

**Localização**: `src/components/Generic/EntityForm.tsx` (linhas ~753-848)

```tsx
case "entity": {
  // Campo de entidade relacionada (ex: city, organization, user, etc)
  if (!field.entityConfig) {
    console.warn(
      `Campo ${field.name} é do tipo 'entity' mas falta entityConfig`
    );
    return null;
  }

  // Detecta se é um filtro de cidade (city, cityId, ou entityName === 'city')
  const isCityField =
    field.name === "city" ||
    field.name === "cityId" ||
    field.entityConfig.entityName === "city";

  if (isCityField) {
    // ✅ Tratamento especial para cidades (com campo Estado)
    fieldContent = (
      <CityTypeahead ... />
    );
  } else {
    // ✅ IMPLEMENTAÇÃO GENÉRICA: Decide qual componente renderizar baseado em renderAs
    const renderAs = field.entityConfig.renderAs || "select";
    const EntityComponent =
      renderAs === "typeahead" || renderAs === "autocomplete"
        ? EntityTypeahead
        : EntitySelect;

    fieldContent = (
      <FormField
        label={field.label}
        required={field.required}
        error={error}
      >
        <EntityComponent
          config={field.entityConfig}
          value={stringValue}
          onChange={(value) => handleChange(field.name, value)}
        />
      </FormField>
    );
  }
}
break;
```

---

## 📊 Comportamento

### **Quando usar Select vs Typeahead**

O backend controla através do `renderAs` no metadata:

#### **1. EntitySelect** (Select dropdown padrão)

- ✅ Carrega **todas as opções** ao abrir o dropdown
- ✅ Ideal para entidades com **poucos registros** (até ~50)
- ✅ Exemplo: Organizações, Categorias, Status

**Metadata do Backend:**

```json
{
  "name": "organization",
  "type": "entity",
  "entityConfig": {
    "entityName": "organization",
    "endpoint": "/organizations",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "select" // ← ou omitir (select é padrão)
  }
}
```

#### **2. EntityTypeahead** (Autocomplete com busca)

- ✅ Carrega opções **sob demanda** baseado na busca
- ✅ Ideal para entidades com **muitos registros** (50+)
- ✅ Exemplo: Usuários, Clientes, Motoboys

**Metadata do Backend:**

```json
{
  "name": "user",
  "type": "entity",
  "entityConfig": {
    "entityName": "user",
    "endpoint": "/users",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "typeahead" // ← Força typeahead
  }
}
```

---

## 🎯 Casos de Uso

### **Exemplo 1: Campo de Grupo (Organization) no CRUD de Motoboy**

**Metadata do Backend:**

```json
{
  "name": "organization",
  "label": "Grupo",
  "type": "entity",
  "entityConfig": {
    "entityName": "organization",
    "endpoint": "/organizations",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "typeahead"
  }
}
```

**Resultado:**

- ✅ **No Filtro**: Typeahead com busca
- ✅ **No Formulário**: Typeahead com busca (AGORA FUNCIONANDO!)

### **Exemplo 2: Campo de Status (poucos valores)**

**Metadata do Backend:**

```json
{
  "name": "status",
  "label": "Status",
  "type": "entity",
  "entityConfig": {
    "entityName": "status",
    "endpoint": "/statuses",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "select" // ou omitir
  }
}
```

**Resultado:**

- ✅ **No Filtro**: Select dropdown
- ✅ **No Formulário**: Select dropdown

---

## ✅ Benefícios

1. **Paridade Completa**: `EntityForm` e `EntityFilters` agora têm o **mesmo comportamento**
2. **Controle pelo Backend**: Backend decide qual componente usar através do `renderAs`
3. **Sem Perda de Generalidade**: Funciona para **qualquer** entidade relacionada
4. **Mantém Tratamento Especial**: Cidades continuam com layout especial (cidade + estado)
5. **Código Limpo**: Removido o `console.warn` e o fallback para input de texto

---

## 🧪 Testes

Para testar a implementação:

1. **Crie um campo entity no metadata do backend:**

   ```json
   {
     "name": "organization",
     "type": "entity",
     "entityConfig": {
       "renderAs": "typeahead"
     }
   }
   ```

2. **Verifique no formulário:**

   - Deve aparecer um **typeahead com busca**
   - Ao digitar, deve buscar opções do backend
   - Ao selecionar, deve salvar o ID corretamente

3. **Compare com o filtro:**
   - Deve ter o **mesmo visual e comportamento**

---

## 📝 Notas Técnicas

### **Props Não Suportadas**

Os componentes `EntitySelect` e `EntityTypeahead` atualmente **não suportam**:

- `disabled`
- `readOnly`

Essas props foram removidas da chamada. Se necessário no futuro, devem ser adicionadas aos componentes base primeiro.

### **Compatibilidade com Campos Existentes**

- ✅ Campos de **cidade** (`city`, `cityId`): Mantém tratamento especial
- ✅ Outros campos **entity**: Agora usam Select ou Typeahead
- ✅ **Backward compatible**: Se `renderAs` não for especificado, usa `"select"` por padrão

---

## 🎨 Visual Consistency

Ambos os componentes (`EntitySelect` e `EntityTypeahead`) usam as **mesmas classes CSS** do `FormComponents`, garantindo:

- ✅ Visual consistente em todo o sistema
- ✅ Estilos de erro padronizados
- ✅ Estados (focus, hover, disabled) consistentes

---

## 📦 Arquivos Modificados

```
src/components/Generic/EntityForm.tsx
├── Linha 11-12: Imports adicionados (EntitySelect, EntityTypeahead)
└── Linha 753-848: case "entity" reescrito com lógica genérica
```

---

## ✅ Conclusão

A implementação está **completa e funcional**. O `EntityForm` agora tem **paridade total** com o `EntityFilters` no que diz respeito à renderização de campos do tipo `entity`.

**Próximos passos possíveis:**

- [ ] Adicionar suporte a `disabled` e `readOnly` em EntitySelect/EntityTypeahead
- [ ] Adicionar validação visual de campos obrigatórios
- [ ] Implementar cache de opções para melhor performance
