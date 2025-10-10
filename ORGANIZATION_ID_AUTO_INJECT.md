# Auto-Injeção de organizationId nos Formulários

## ✅ Status: IMPLEMENTADO

O frontend **automaticamente injeta** o `organizationId` do JWT no payload ao criar novas entidades que pertencem a uma organização.

## 🎯 Como Funciona

### 1. **Carregamento do Formulário (Inicialização)**

Quando o formulário é carregado em modo **CREATE**, o `organizationId` é pré-preenchido no `formData`:

```tsx
const [formData, setFormData] = useState<Record<string, unknown>>(() => {
  const defaultValues: Record<string, unknown> = {};

  metadata.sections.forEach((section) => {
    section.fields.forEach((field) => {
      // Auto-preenche organizationId se não estiver editando
      if (!entityId && organizationId) {
        if (field.name === "organizationId" || field.name === "organization") {
          console.log(
            `🏢 Auto-preenchendo ${field.name} com: ${organizationId}`
          );
          defaultValues[field.name] = organizationId;
        }
      }
      // ... outros defaults ...
    });
  });

  return { ...defaultValues, ...initialValues };
});
```

### 2. **Submissão do Formulário (Garantia)**

Ao submeter o formulário, **sempre** injeta o `organizationId` no payload, independentemente de estar ou não no metadata:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const finalData = { ...formData };

    // Se está criando (não editando) e tem organizationId no contexto
    if (!entityId && organizationId) {
      // SEMPRE injeta organizationId no payload
      if (!finalData.organizationId) {
        console.log(`🏢 Injetando organizationId: ${organizationId} no payload`);
        finalData.organizationId = organizationId;
      }

      // Também verifica se há campo "organization" no metadata
      metadata.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.name === "organization" && !finalData.organization) {
            console.log(`🏢 Injetando organization: ${organizationId} no payload`);
            finalData.organization = organizationId;
          }
        });
      });
    }

    // Envia para o backend
    await api.post(metadata.endpoint, finalData);
  }
};
```

## 📋 Comportamento por Modo

### Modo: **CREATE** (Criar Nova Entidade)

**Inicialização:**

```tsx
// organizationId vem do JWT via useOrganization()
formData = {
  organizationId: "abc-123", // ✅ Auto-preenchido
  name: "",
  status: "DRAFT",
};
```

**Submissão:**

```tsx
// SEMPRE garante que organizationId está no payload
finalData = {
  organizationId: "abc-123", // ✅ Garantido na submissão
  name: "Corrida Maluca",
  status: "DRAFT",
};

// POST /api/events
// Body: { organizationId: "abc-123", name: "Corrida Maluca", ... }
```

### Modo: **EDIT** (Editar Entidade Existente)

**Comportamento:**

- ❌ NÃO injeta organizationId
- ✅ Usa os dados vindos do banco (que já tem organizationId)
- ✅ Mantém organizationId original da entidade

```tsx
if (!entityId && organizationId) {
  // Só injeta se NÃO for edição (!entityId)
}
```

## 🔄 Fluxo Completo

### 1. Usuário Faz Login

```tsx
// JWT decodificado contém:
{
  userId: "742f58ea-...",
  role: "ADMIN",
  organizationId: "abc-123"  // ← Extraído e armazenado
}
```

### 2. Abre Formulário de Criar Evento

```tsx
// useOrganization() retorna organizationId do localStorage
const { organizationId } = useOrganization();
// organizationId = "abc-123"
```

### 3. Formulário Inicializa

```tsx
// formData já vem com organizationId
formData.organizationId = "abc-123";
```

### 4. Usuário Preenche Campos

```tsx
formData = {
  organizationId: "abc-123", // ← Já estava lá
  name: "Corrida Maluca",
  eventType: "RUNNING",
  eventDate: "2025-12-31",
};
```

### 5. Usuário Clica em "Salvar"

```tsx
// handleSubmit verifica e garante organizationId
if (!finalData.organizationId) {
  finalData.organizationId = organizationId; // ✅ Injeta
}

// POST /api/events
// Body: { organizationId: "abc-123", ... }
```

## 🎨 Casos de Uso

### Caso 1: Backend Envia Campo `organizationId` no Metadata

```json
{
  "formFields": [
    {
      "name": "organizationId",
      "type": "text",
      "visible": false // ← Campo oculto
    }
  ]
}
```

**Resultado:**

- ✅ Campo inicializado com organizationId do JWT
- ✅ Campo oculto (não aparece no formulário)
- ✅ Valor garantido na submissão

### Caso 2: Backend NÃO Envia Campo `organizationId` no Metadata

```json
{
  "formFields": [
    { "name": "name", "type": "text" },
    { "name": "eventType", "type": "select" }
    // ← organizationId não está aqui
  ]
}
```

**Resultado:**

- ✅ organizationId **AINDA É INJETADO** na submissão
- ✅ Não aparece no formulário (não está no metadata)
- ✅ Backend recebe organizationId automaticamente

### Caso 3: Campo se Chama `organization` (Relacionamento)

```json
{
  "formFields": [
    {
      "name": "organization",
      "type": "entity",
      "entityConfig": { ... }
    }
  ]
}
```

**Resultado:**

- ✅ Campo inicializado com organizationId
- ✅ Valor garantido na submissão

## 🔒 Segurança

### Por Que Isso é Importante?

1. **Prevenção de Fraude**: Usuário não pode criar entidades para outra organização
2. **Isolamento de Dados**: Cada organização só vê seus próprios dados
3. **Audit Trail**: Todas as entidades têm organizationId rastreável
4. **Multi-tenancy**: Suporta múltiplas organizações no mesmo sistema

### Como Funciona a Segurança?

```tsx
// Frontend sempre injeta organizationId do JWT
finalData.organizationId = organizationIdDoJWT;

// Backend VALIDA se o organizationId do JWT bate com o do payload
@PreAuthorize("@organizationSecurity.canCreate(#dto.organizationId)")
public EventDTO create(@RequestBody EventDTO dto) {
  // Valida se user pode criar para essa org
}
```

## 📝 Logs do Console

Durante o desenvolvimento, você verá logs como:

**Na Inicialização:**

```
🏢 Auto-preenchendo organizationId com organizationId: abc-123
```

**Na Submissão:**

```
🏢 Injetando organizationId: abc-123 no payload
```

## 🎯 Resumo

| Momento                  | Ação                 | Resultado                                |
| ------------------------ | -------------------- | ---------------------------------------- |
| **Login**                | JWT decodificado     | organizationId extraído e salvo          |
| **Abrir Form CREATE**    | useOrganization()    | organizationId carregado do localStorage |
| **Inicializar formData** | Se campo no metadata | organizationId pré-preenchido            |
| **Submissão CREATE**     | Sempre               | organizationId **garantido** no payload  |
| **Submissão EDIT**       | Nunca                | Usa organizationId original da entidade  |

## ✨ Benefícios

1. ✅ **Zero Configuração**: Desenvolvedor não precisa se preocupar
2. ✅ **Seguro por Padrão**: organizationId sempre correto
3. ✅ **Flexível**: Funciona com ou sem campo no metadata
4. ✅ **Auditável**: Logs claros de quando injeta
5. ✅ **Multi-tenant Ready**: Suporta múltiplas organizações

## 🔧 Código Relevante

- **EntityForm.tsx** (linhas 69-96): Inicialização com organizationId
- **EntityForm.tsx** (linhas 240-263): Injeção na submissão
- **useOrganization.ts**: Hook que fornece organizationId do JWT

## 🚀 Conclusão

O sistema garante que **toda entidade criada** por um usuário logado terá automaticamente o `organizationId` correto, sem necessidade de configuração manual ou código adicional.
