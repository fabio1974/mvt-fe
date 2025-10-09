# 🎯 EntityForm - Componente Genérico de Formulário

## 📋 **RESUMO**

Componente genérico para criar/editar entidades baseado em metadata, seguindo o mesmo padrão do `EntityTable` e `EntityFilters`.

---

## 🏗️ **ARQUITETURA**

### **Metadata → Form → API**

```
Backend (metadata)  →  EntityForm  →  Submit  →  Backend (save)
     ↓                      ↓                        ↓
  FormMetadata         Renderiza              POST/PUT/PATCH
  - sections            campos                  /api/events
  - fields              automaticamente
  - validation
```

---

## 📦 **ESTRUTURA DE METADATA**

### **FormMetadata**

```typescript
interface FormMetadata {
  entityName: string; // "event"
  title: string; // "Criar Evento"
  description?: string; // Subtítulo opcional
  endpoint: string; // "/api/events"
  method?: "POST" | "PUT"; // Padrão: POST
  sections: FormSectionMetadata[];
  submitLabel?: string; // "Salvar Evento"
  cancelLabel?: string; // "Cancelar"
  successRedirect?: string; // "/eventos"
}
```

### **FormSectionMetadata**

```typescript
interface FormSectionMetadata {
  id: string; // "basic-info"
  title: string; // "Informações Básicas"
  icon?: ReactNode; // <FiInfo />
  fields: FormFieldMetadata[];
  collapsible?: boolean; // Se pode colapsar
  defaultCollapsed?: boolean; // Inicia colapsado
  columns?: 1 | 2 | 3 | 4; // Grid de colunas
}
```

### **FormFieldMetadata**

```typescript
interface FormFieldMetadata {
  name: string; // "name" (key no objeto)
  label: string; // "Nome do Evento"
  type: FormFieldType; // "text", "date", "select", etc
  required?: boolean; // Campo obrigatório
  placeholder?: string; // Placeholder
  defaultValue?: any; // Valor padrão
  options?: FilterOption[]; // Para selects
  entityConfig?: EntityFilterConfig; // Para campos entity
  validation?: {
    // Validações
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  disabled?: boolean; // Campo desabilitado
  showIf?: string; // Condição para mostrar
}
```

### **Tipos de Campo (FormFieldType)**

```typescript
type FormFieldType =
  | "text" // Input texto
  | "textarea" // Textarea
  | "number" // Input numérico
  | "email" // Input email
  | "password" // Input senha
  | "date" // DatePicker
  | "datetime" // DateTimePicker
  | "daterange" // DateRangePicker
  | "select" // Select dropdown
  | "boolean" // Checkbox
  | "entity" // EntitySelect ou EntityTypeahead
  | "city"; // CityTypeahead
```

---

## 💡 **EXEMPLO: Criar Evento**

```typescript
import { FiCalendar, FiMapPin, FiDollarSign } from "react-icons/fi";

const eventFormMetadata: FormMetadata = {
  entityName: "event",
  title: "Criar Novo Evento",
  description: "Preencha as informações básicas do evento",
  endpoint: "/api/events",
  method: "POST",
  submitLabel: "Criar Evento",
  cancelLabel: "Cancelar",
  successRedirect: "/eventos",

  sections: [
    {
      id: "basic",
      title: "Informações Básicas",
      icon: <FiCalendar />,
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Nome do Evento",
          type: "text",
          required: true,
          placeholder: "Ex: Corrida da Maria",
          validation: {
            minLength: 3,
            maxLength: 100,
            message: "Nome deve ter entre 3 e 100 caracteres",
          },
        },
        {
          name: "eventType",
          label: "Tipo de Evento",
          type: "select",
          required: true,
          defaultValue: "RUNNING",
          options: [
            { value: "RUNNING", label: "Corrida" },
            { value: "CYCLING", label: "Ciclismo" },
            { value: "TRIATHLON", label: "Triatlo" },
          ],
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Descreva o evento...",
          validation: {
            maxLength: 500,
          },
        },
        {
          name: "eventDate",
          label: "Data do Evento",
          type: "date",
          required: true,
        },
      ],
    },

    {
      id: "location",
      title: "Localização",
      icon: <FiMapPin />,
      columns: 2,
      fields: [
        {
          name: "city",
          label: "Cidade",
          type: "city",
          required: true,
        },
        {
          name: "location",
          label: "Local",
          type: "text",
          placeholder: "Ex: Parque do Ibirapuera",
          required: true,
        },
      ],
    },

    {
      id: "registration",
      title: "Inscrições",
      icon: <FiDollarSign />,
      columns: 3,
      fields: [
        {
          name: "registrationPeriod",
          label: "Período de Inscrição",
          type: "daterange",
          required: true,
        },
        {
          name: "price",
          label: "Preço (R$)",
          type: "number",
          defaultValue: 0,
          validation: {
            min: 0,
            max: 10000,
          },
        },
        {
          name: "maxParticipants",
          label: "Máx. Participantes",
          type: "number",
          validation: {
            min: 1,
          },
        },
      ],
    },
  ],
};
```

---

## 🎨 **USO DO COMPONENTE**

### **1. Criar Novo Evento**

```tsx
import EntityForm from "../Generic/EntityForm";
import { eventFormMetadata } from "./eventFormMetadata";

export default function CreateEventPage() {
  const navigate = useNavigate();

  return (
    <EntityForm
      metadata={eventFormMetadata}
      onSuccess={(event) => {
        console.log("Evento criado:", event);
        navigate(`/eventos/${event.id}`);
      }}
      onCancel={() => navigate("/eventos")}
    />
  );
}
```

### **2. Editar Evento Existente**

```tsx
export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <EntityForm
      metadata={eventFormMetadata}
      entityId={id} // ← Carrega dados automaticamente
      onSuccess={(event) => {
        navigate(`/eventos/${event.id}`);
      }}
    />
  );
}
```

### **3. Com Valores Iniciais**

```tsx
<EntityForm
  metadata={eventFormMetadata}
  initialValues={{
    eventType: "RUNNING",
    price: 50,
    status: "DRAFT",
  }}
  onSuccess={handleSuccess}
/>
```

---

## 🔧 **FUNCIONALIDADES**

### **1. Validação Automática**

- ✅ Campos obrigatórios (`required`)
- ✅ Min/Max valores e comprimento
- ✅ Padrões regex (`pattern`)
- ✅ Mensagens customizadas
- ✅ Validação do backend

### **2. Renderização Condicional**

```typescript
{
  name: "distance",
  label: "Distância",
  type: "number",
  showIf: "eventType === 'RUNNING'"  // ← Só mostra para corrida
}
```

### **3. Integração com EntitySelect/Typeahead**

```typescript
{
  name: "organizationId",
  label: "Organização",
  type: "entity",
  required: true,
  entityConfig: {
    entityName: "organization",
    endpoint: "/api/organizations",
    labelField: "name",
    valueField: "id",
    renderAs: "select"  // ← Backend define
  }
}
```

### **4. Tratamento de Erros**

- ✅ Erros de validação do frontend
- ✅ Erros de validação do backend
- ✅ Mensagens de erro por campo
- ✅ Toast notifications

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Fase 1: Tipos e Estrutura** ✅

- [x] Criar interfaces em `metadata.ts`
- [x] Definir FormFieldType
- [x] Definir FormMetadata

### **Fase 2: Componente Base** (em andamento)

- [ ] Implementar EntityForm.tsx
- [ ] Renderização de campos
- [ ] Validação de formulário
- [ ] Submissão (POST/PUT)

### **Fase 3: Exemplo Prático**

- [ ] Converter CreateEventForm para usar EntityForm
- [ ] Criar eventFormMetadata.ts
- [ ] Testar criação de evento
- [ ] Testar edição de evento

### **Fase 4: Documentação**

- [ ] Guia de uso
- [ ] Exemplos práticos
- [ ] Boas práticas

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Finalizar EntityForm.tsx**

   - Corrigir erros de tipos TypeScript
   - Implementar todos os tipos de campo
   - Adicionar validações

2. **Criar eventFormMetadata.ts**

   - Metadata completo do formulário de eventos
   - Incluir todas as seções
   - Definir validações

3. **Refatorar CreateEventForm**

   - Usar EntityForm em vez do código atual
   - Simplificar CreateEventPage
   - Manter funcionalidade de categorias

4. **Testes e Validação**
   - Testar criação de eventos
   - Testar edição de eventos
   - Validar com backend

---

**Status:** 🟡 Em desenvolvimento  
**Progresso:** 40%  
**Próximo:** Finalizar tipos e corrigir erros do TypeScript

---

## 💡 **BENEFÍCIOS**

1. ✅ **DRY (Don't Repeat Yourself)**

   - Um componente para todos os formulários
   - Metadata reutilizável

2. ✅ **Manutenção Centralizada**

   - Mudanças em um lugar
   - Validações consistentes

3. ✅ **Rapidez no Desenvolvimento**

   - Novo formulário = novo metadata
   - Sem código repetido

4. ✅ **Consistência Visual**

   - Usa FormComponents
   - Layout padronizado

5. ✅ **Validação Robusta**
   - Frontend + Backend
   - Mensagens claras
