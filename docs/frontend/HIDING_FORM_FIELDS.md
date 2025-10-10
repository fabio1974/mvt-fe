# Como Ocultar Campos no Formulário

## Visão Geral

Existem várias formas de ocultar campos no formulário, cada uma com um propósito específico.

## 1. Propriedade `visible` (Recomendado)

### Backend - Marcando Campo como Não Visível

```java
FieldMetadata field = new FieldMetadata();
field.setName("internalId");
field.setLabel("ID Interno");
field.setType("string");
field.setVisible(false); // ← Campo não aparecerá no formulário
```

### JSON Response

```json
{
  "formFields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "visible": true
    },
    {
      "name": "internalId",
      "label": "ID Interno",
      "type": "string",
      "visible": false // ← Campo oculto no formulário
    }
  ]
}
```

### Quando Usar

- ✅ Campos que nunca devem aparecer em formulários
- ✅ Campos calculados ou somente leitura do backend
- ✅ Campos internos do sistema (IDs, timestamps)
- ✅ Campos que aparecem apenas na tabela

### Exemplo Prático

```java
// Campo visível apenas na tabela, oculto no formulário
public List<FieldMetadata> createEventMetadata() {
    List<FieldMetadata> tableFields = new ArrayList<>();
    List<FieldMetadata> formFields = new ArrayList<>();

    // Campo ID: visível na tabela, oculto no formulário
    FieldMetadata idField = new FieldMetadata();
    idField.setName("id");
    idField.setLabel("ID");
    idField.setType("number");
    idField.setVisible(true); // Visível na tabela
    tableFields.add(idField);

    FieldMetadata idFieldForm = new FieldMetadata();
    idFieldForm.setName("id");
    idFieldForm.setLabel("ID");
    idFieldForm.setType("number");
    idFieldForm.setVisible(false); // Oculto no formulário
    formFields.add(idFieldForm);

    // Ou simplesmente não incluir o campo em formFields

    return formFields;
}
```

## 2. Propriedade `showIf` (Condicional)

### Backend - Exibição Condicional

```java
FieldMetadata field = new FieldMetadata();
field.setName("registrationPrice");
field.setLabel("Preço da Inscrição");
field.setType("currency");
field.setShowIf("data.registrationOpen === true"); // ← Exibe apenas se inscrições abertas
```

### JSON Response

```json
{
  "formFields": [
    {
      "name": "registrationOpen",
      "label": "Inscrições Abertas",
      "type": "boolean"
    },
    {
      "name": "registrationPrice",
      "label": "Preço da Inscrição",
      "type": "currency",
      "showIf": "data.registrationOpen === true" // ← Condicional
    }
  ]
}
```

### Quando Usar

- ✅ Campos dependentes de outros campos
- ✅ Lógica de exibição baseada em valores do formulário
- ✅ Campos opcionais que aparecem sob certas condições

### Exemplos de Expressões

```javascript
// Exibe se campo booleano é true
"data.registrationOpen === true";

// Exibe se valor específico foi selecionado
"data.eventType === 'MARATHON'";

// Exibe se campo tem valor
"data.organizationId !== null && data.organizationId !== undefined";

// Múltiplas condições
"data.registrationOpen === true && data.price > 0";

// Verifica se campo existe no array
"data.categories && data.categories.length > 0";
```

## 3. Não Incluir em `formFields`

### Backend - Exclusão Total

```java
public EntityMetadata getEventMetadata() {
    EntityMetadata metadata = new EntityMetadata();

    // tableFields: campos visíveis na tabela
    List<FieldMetadata> tableFields = Arrays.asList(
        createField("id", "ID", "number"),          // Aparece na tabela
        createField("name", "Nome", "string"),
        createField("createdAt", "Criado em", "datetime")  // Aparece na tabela
    );

    // formFields: campos visíveis no formulário
    List<FieldMetadata> formFields = Arrays.asList(
        createField("name", "Nome", "string")
        // id e createdAt NÃO estão aqui = não aparecem no formulário
    );

    metadata.setTableFields(tableFields);
    metadata.setFormFields(formFields);

    return metadata;
}
```

### Quando Usar

- ✅ Campos somente leitura (ID, timestamps)
- ✅ Campos calculados automaticamente
- ✅ Separação clara entre tabela e formulário

## 4. Comparação dos Métodos

| Método           | Uso                  | Vantagem                  | Exemplo                        |
| ---------------- | -------------------- | ------------------------- | ------------------------------ |
| `visible: false` | Campo nunca aparece  | Explícito no metadata     | IDs, campos internos           |
| `showIf`         | Exibição condicional | Dinâmico baseado em dados | Preço só se inscrições abertas |
| Não incluir      | Exclusão total       | Simplifica metadata       | Timestamps automáticos         |

## 5. Casos de Uso Comuns

### Caso 1: Campo ID (Auto-incremento)

```java
// Backend
FieldMetadata id = new FieldMetadata();
id.setName("id");
id.setLabel("ID");
id.setType("number");
id.setVisible(false); // Não edita ID no formulário

// OU simplesmente não incluir em formFields
```

### Caso 2: Timestamps Automáticos

```java
// Aparecem na tabela, mas não no formulário
List<FieldMetadata> tableFields = Arrays.asList(
    createField("createdAt", "Criado em", "datetime"),
    createField("updatedAt", "Atualizado em", "datetime")
);

List<FieldMetadata> formFields = Arrays.asList(
    // createdAt e updatedAt não estão aqui
    createField("name", "Nome", "string")
);
```

### Caso 3: Campos Dependentes

```java
// Preço só aparece se tem inscrição
FieldMetadata price = new FieldMetadata();
price.setName("price");
price.setLabel("Preço");
price.setType("currency");
price.setShowIf("data.registrationOpen === true");

// Data de término só aparece se tem data de início
FieldMetadata endDate = new FieldMetadata();
endDate.setName("registrationEndDate");
endDate.setLabel("Fim das Inscrições");
endDate.setType("datetime");
endDate.setShowIf("data.registrationStartDate !== null");
```

### Caso 4: Campos por Tipo de Evento

```java
// Distância só para corridas
FieldMetadata distance = new FieldMetadata();
distance.setName("distance");
distance.setLabel("Distância");
distance.setType("number");
distance.setShowIf("data.eventType === 'RUNNING' || data.eventType === 'MARATHON'");

// Número de voltas só para ciclismo
FieldMetadata laps = new FieldMetadata();
laps.setName("laps");
laps.setLabel("Número de Voltas");
laps.setType("number");
laps.setShowIf("data.eventType === 'CYCLING'");
```

### Caso 5: Campos de Organização (Auto-preenchidos)

```java
// O frontend já trata automaticamente organizationId quando usuário é organizador
// Mas você pode adicionar segurança extra:
FieldMetadata orgId = new FieldMetadata();
orgId.setName("organizationId");
orgId.setLabel("Organização");
orgId.setType("number");
orgId.setVisible(false); // Sempre oculto, auto-preenchido pelo frontend
```

## 6. Implementação Frontend

### EntityForm.tsx - Ordem de Verificação

```typescript
const renderField = (field: FormFieldMetadata) => {
  // 1. Verifica visible
  if (field.visible === false) {
    return null; // Campo oculto
  }

  // 2. Verifica auto-preenchimento de organização
  if (!entityId && organizationId && field.name === "organizationId") {
    return null; // Oculta campo auto-preenchido
  }

  // 3. Verifica showIf (condicional)
  if (field.showIf) {
    const shouldShow = new Function("data", `return ${field.showIf}`)(formData);
    if (!shouldShow) {
      return null; // Condição não atendida
    }
  }

  // 4. Renderiza o campo
  return <FormField>...</FormField>;
};
```

## 7. Exemplo Completo - Event Form

### Backend

```java
public List<FieldMetadata> createEventFormFields() {
    List<FieldMetadata> fields = new ArrayList<>();

    // Campos sempre visíveis
    fields.add(createField("name", "Nome", "string", 400, true));
    fields.add(createField("eventType", "Tipo", "select", 200, true));

    // Campos ocultos (nunca aparecem)
    FieldMetadata id = createField("id", "ID", "number", 100);
    id.setVisible(false);
    fields.add(id);

    FieldMetadata createdAt = createField("createdAt", "Criado em", "datetime", 200);
    createdAt.setVisible(false);
    fields.add(createdAt);

    // Campos condicionais
    FieldMetadata price = createField("price", "Preço", "currency", 200);
    price.setShowIf("data.registrationOpen === true");
    fields.add(price);

    FieldMetadata maxParticipants = createField("maxParticipants", "Máximo Participantes", "number", 200);
    maxParticipants.setShowIf("data.registrationOpen === true");
    fields.add(maxParticipants);

    return fields;
}
```

### Resultado Visual

**Quando `registrationOpen = false`:**

```
┌────────────────────┬──────────────┐
│ Nome               │ Tipo         │
└────────────────────┴──────────────┘
```

**Quando `registrationOpen = true`:**

```
┌────────────────────┬──────────────┐
│ Nome               │ Tipo         │
├────────────────────┴──────────────┤
│ Preço              │ Máx. Partic. │
└────────────────────┴──────────────┘
```

## 8. Boas Práticas

### ✅ DO (Faça)

- Use `visible: false` para campos que nunca devem aparecer
- Use `showIf` para lógica condicional
- Não inclua campos auto-gerados (ID, timestamps) em `formFields`
- Documente a razão de campos ocultos no código

### ❌ DON'T (Não Faça)

- Não use `visible: false` para lógica condicional (use `showIf`)
- Não oculte campos obrigatórios sem lógica clara
- Não confie apenas no frontend para segurança (valide no backend)
- Não use expressões `showIf` muito complexas

## 9. Debugging

### Ver Campos Ocultos no Console

```typescript
// Adicione no EntityForm.tsx para debug
console.log(
  "Campos ocultos:",
  metadata.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.visible === false)
    .map((f) => f.name)
);

console.log(
  "Campos com showIf:",
  metadata.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.showIf)
    .map((f) => ({ name: f.name, condition: f.showIf }))
);
```

## 10. Testes

### Verificar Campo Oculto

```typescript
// O campo não aparece no DOM
const field = screen.queryByLabelText("ID Interno");
expect(field).toBeNull();

// Mas o valor pode estar presente no formData
expect(formData.internalId).toBeDefined();
```

### Verificar Campo Condicional

```typescript
// Campo oculto inicialmente
expect(screen.queryByLabelText("Preço")).toBeNull();

// Habilitar condição
fireEvent.click(screen.getByLabelText("Inscrições Abertas"));

// Campo aparece
expect(screen.getByLabelText("Preço")).toBeInTheDocument();
```

## Referências

- Tipo TypeScript: `src/types/metadata.ts` (FormFieldMetadata.visible)
- Implementação: `src/components/Generic/EntityForm.tsx` (renderField)
- Documentação de Metadata: `docs/backend/METADATA_FORMAT_V2.md`
- Layout Inteligente: `docs/frontend/INTELLIGENT_FORM_LAYOUT.md`
