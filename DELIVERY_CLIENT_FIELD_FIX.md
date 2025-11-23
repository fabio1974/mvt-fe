# 🐛 Bug: Cliente não carrega no modo Edit + Solução Limpa

## 🎯 Problema Identificado

Quando editamos um delivery, o campo `client` não carrega o nome do cliente no typeahead. Aparece vazio e tenta fazer uma chamada errada:

```
❌ http://localhost:8080/api/users/Padaria1
   (usando o NOME ao invés do ID UUID)
```

---

## 🔍 Análise do Fluxo

### 1. No Backend (GET /api/deliveries/:id)

Retorna:
```json
{
  "id": "36",
  "client": {
    "id": "189c7d79-cb21-40c1-9b7c-006ebaa3289a",
    "name": "Padaria1",
    "phone": "85997572919"
  },
  "fromAddress": "...",
  ...
}
```

✅ **O objeto client vem completo**

---

### 2. No EntityCRUD (modo edit)

```typescript
// EntityCRUD.tsx linha ~250
const entity = await api.get(`/${entityName}/${id}`);
setFormData(entity.data); // Passa para EntityForm
```

✅ **O formData recebe o objeto client completo**

---

### 3. No EntityForm (carregamento de dados)

```typescript
// EntityForm.tsx linhas 230-255
Object.keys(data).forEach((key) => {
  const value = data[key];
  if (value && typeof value === "object" && "id" in value) {
    const field = allFieldsInMetadata.find((f: any) => f.name === key);
    const isTypeaheadField = field?.type === "entity" && 
                             field?.entityConfig?.renderAs === "typeahead";

    if (isTypeaheadField) {
      // MANTÉM o objeto completo {id, name}
      console.log(`🔄 Preservando objeto para typeahead "${key}":`, obj);
      data[key] = obj; // ✅ Objeto mantido
    } else {
      // Converte para string
      data[key] = obj.name || String(obj.id);
    }
  }
});
```

✅ **O objeto é mantido para typeahead**

---

### 4. No renderField (extração do ID)

```typescript
// EntityForm.tsx linhas 660-666
if (value && typeof value === "object" && "id" in value) {
  console.log(`🔍 Campo "${field.name}": Extraindo ID de objeto`, value);
  value = (value as { id: string | number }).id;
  console.log(`✅ Campo "${field.name}": ID extraído =`, value);
}

const stringValue = String(value || "");
```

✅ **Deveria extrair o ID aqui**

---

### 5. No EntityTypeahead (busca do label)

```typescript
// EntityTypeahead.tsx linhas 135-150
useEffect(() => {
  if (!value) return;
  
  const fetchSelectedItem = async () => {
    const response = await api.get(`${endpoint}/${value}`);
    // ❌ PROBLEMA: Se value = "Padaria1" (string)
    // Chama: /api/users/Padaria1 (errado!)
  };
}, [value]);
```

❌ **Se o value for string "Padaria1", chama com nome!**

---

## 🎯 Causa Raiz

O problema é que:

1. O objeto `{id, name}` é preservado corretamente (✅)
2. A extração do ID no renderField acontece (✅)
3. **MAS** o `stringValue` pode estar capturando o **nome** ao invés do **ID**

Olhando novamente o código:

```typescript
// Se value = {id: "uuid", name: "Padaria1"}
if (value && typeof value === "object" && "id" in value) {
  value = value.id; // value = "uuid" ✅
}

const stringValue = String(value || ""); // stringValue = "uuid" ✅
```

**Então a extração está correta!**

O problema deve ser que o `formData` está sendo setado **ANTES** da conversão das linhas 230-255.

---

## 🔧 Diagnóstico

Vou adicionar logs para confirmar:

### Console.logs esperados (modo edit):

```javascript
// Ao carregar delivery para editar:
🔄 Preservando objeto para typeahead "client": {id: "189c7d...", name: "Padaria1"}

// Ao renderizar o campo:
🔍 Campo "client": Extraindo ID de objeto {id: "189c7d...", name: "Padaria1"}
✅ Campo "client": ID extraído = 189c7d79-cb21-40c1-9b7c-006ebaa3289a

// No EntityTypeahead:
Buscando: /api/users/189c7d79-cb21-40c1-9b7c-006ebaa3289a ✅
```

Se os logs **NÃO aparecem**, significa que:
- Ou a conversão (linhas 230-255) não está rodando
- Ou o formData está sendo setado de outra forma

---

## ✅ Solução Proposta (Limpa e Robusta)

### Opção 1: Garantir conversão no setFormData do EntityForm

```typescript
// EntityForm.tsx - No useEffect que carrega os dados (linha ~230)
useEffect(() => {
  if (!entityId || !initialData) return;

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/${entityName}/${entityId}`);
      const data = response.data;

      // 🔧 NORMALIZAÇÃO: Converte objetos entity para formato correto
      const allFieldsInMetadata =
        metadata.originalFields ||
        metadata.sections.flatMap((section) => section.fields);

      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value && typeof value === "object" && !Array.isArray(value) && "id" in value) {
          const field = allFieldsInMetadata.find((f: any) => f.name === key);
          const isTypeaheadField =
            field?.type === "entity" &&
            field?.entityConfig?.renderAs === "typeahead";

          if (isTypeaheadField) {
            // Para typeahead: mantém o objeto {id, name}
            // MAS garante que tem 'name', se não tiver usa 'label'
            data[key] = {
              id: value.id,
              name: value.name || value.label || String(value.id)
            };
          } else {
            // Para outros: converte para valor primitivo (ID)
            data[key] = value.id;
          }
        }
      });

      setFormData(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [entityId, initialData]);
```

**Vantagem:** Normaliza os dados **uma única vez** ao carregar.

---

### Opção 2: Corrigir no EntityTypeahead

```typescript
// EntityTypeahead.tsx - No useEffect que busca o label
useEffect(() => {
  if (!value) {
    setSelectedLabel("");
    setSearchTerm("");
    return;
  }

  const fetchSelectedItem = async () => {
    try {
      // 🔧 SEGURANÇA: Se value é objeto, extrai o ID
      let valueId = value;
      if (typeof value === "object" && "id" in value) {
        valueId = value.id;
        // Se já tem o name/label, não precisa buscar
        if ("name" in value || "label" in value) {
          setSelectedLabel(value.name || value.label || String(value.id));
          setSearchTerm(value.name || value.label || String(value.id));
          return;
        }
      }

      let endpoint = config.endpoint;
      if (!endpoint.startsWith("/")) {
        endpoint = `/${endpoint}`;
      }

      const response = await api.get(`${endpoint}/${valueId}`);
      const item = response.data as EntityOption;
      const label = String(item[config.labelField] || item.id || "");
      setSelectedLabel(label);
      setSearchTerm(label);
    } catch (err) {
      console.error(`❌ Erro ao buscar ${config.entityName}:`, err);
      setSelectedLabel("");
      setSearchTerm("");
    }
  };

  fetchSelectedItem();
}, [value, config]);
```

**Vantagem:** Aceita tanto string (ID) quanto objeto {id, name}.

---

### Opção 3: Garantir no renderField

```typescript
// EntityForm.tsx - No renderField
case "entity": {
  // ...código existente...

  // 🔧 NORMALIZAÇÃO: Garante que value é sempre string (ID) ou objeto {id, name}
  let entityValue = value;
  
  if (value && typeof value === "object" && "id" in value) {
    // Se é typeahead, mantém objeto
    if (entityConfig?.renderAs === "typeahead" || entityConfig?.renderAs === "autocomplete") {
      // Garante formato {id, name}
      entityValue = {
        id: value.id,
        name: value.name || value.label || String(value.id)
      };
    } else {
      // Se não é typeahead, extrai apenas o ID
      entityValue = value.id;
    }
  }

  const EntityComponent =
    renderAs === "typeahead" || renderAs === "autocomplete"
      ? EntityTypeahead
      : EntitySelect;

  fieldContent = (
    <FormField label={field.label} required={field.required} error={error}>
      <EntityComponent
        config={entityConfig}
        value={entityValue} // ✅ Passa valor normalizado
        onChange={(value) => handleChange(field.name, value)}
      />
    </FormField>
  );
}
```

**Vantagem:** Normaliza no momento de renderizar.

---

## 🎯 Recomendação

**Implementar Opção 2 (EntityTypeahead)**

**Por quê:**
1. ✅ Mais robusto (aceita string ou objeto)
2. ✅ Não quebra outras partes do código
3. ✅ Se já tem o nome no objeto, não faz chamada desnecessária
4. ✅ Fallback seguro se receber formato inesperado

---

## 📋 Checklist de Implementação

- [ ] Modificar EntityTypeahead para aceitar objeto {id, name}
- [ ] Adicionar extração de ID se value for objeto
- [ ] Se objeto tem name/label, usar diretamente (sem fetch)
- [ ] Se value é string (ID), fazer fetch normalmente
- [ ] Testar modo CREATE (deve continuar funcionando)
- [ ] Testar modo EDIT (deve carregar cliente corretamente)
- [ ] Remover console.logs de debug
- [ ] Commitar e fazer deploy

---

## 🧪 Casos de Teste

### Teste 1: Create Delivery (CLIENT logado)
```
✅ Campo client pré-preenchido com nome do cliente logado
✅ Typeahead funciona normalmente
✅ Ao salvar, envia apenas o ID
```

### Teste 2: Edit Delivery (ADMIN)
```
✅ Campo client carrega com nome do cliente da entrega
✅ Não faz chamada /api/users/Padaria1 (errada)
✅ Faz chamada /api/users/189c7d79... (correta) ou usa objeto
✅ Typeahead mostra opções ao digitar
```

### Teste 3: Edit Delivery (CLIENT)
```
✅ Campo client está oculto (hideFields)
✅ Não afeta o salvamento
```

---

**Status:** 🔍 Diagnóstico completo  
**Próximo:** Implementar Opção 2 (EntityTypeahead robusto)
