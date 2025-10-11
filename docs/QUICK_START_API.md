# 🚀 Quick Start - Sistema CRUD Genérico

## TL;DR - O que mudou?

### ❌ ANTES (Problemas Corrigidos)
```javascript
// 1. City enviada como string
PUT /api/events/10
{
  "name": "Evento",
  "city": "Tunas"  // ❌ String - NÃO FUNCIONA
}

// 2. ENUMs em inglês nas tabelas
Status: PUBLISHED  // ❌ Não traduzido

// 3. Duplicate /api/api
GET /api/api/organizations  // ❌ URL duplicada
```

### ✅ AGORA (Funcionando)
```javascript
// 1. City enviada como objeto com ID
PUT /api/events/10
{
  "name": "Evento",
  "city": { "id": 964 }  // ✅ Objeto com ID
}

// 2. ENUMs traduzidos automaticamente
Status: Publicado  // ✅ Tradução do metadata

// 3. URLs normalizadas automaticamente
GET /api/organizations  // ✅ Interceptor corrige duplicação
```

---

## 📋 Guia de Implementação Frontend

### 🎯 Sistema CRUD Genérico

O frontend usa um sistema **metadata-driven** que renderiza automaticamente formulários, tabelas e filtros baseado no metadata do backend.

#### Estrutura de Componentes:
```
EntityCRUD (orquestrador)
  ├─ EntityTable (listagem)
  │   ├─ EntityFilters (filtros)
  │   └─ formatValue (traduz ENUMs, datas, etc)
  └─ EntityForm (create/edit/view)
      ├─ CityTypeahead (busca cidade)
      ├─ EntityTypeahead (busca entidade)
      └─ ArrayField (relacionamentos 1:N)
```

---

## 🔧 Correção: City ID

### Problema Identificado
O frontend estava enviando o **nome da cidade** ao invés do **ID**.

### Solução Implementada

```typescript
// EntityForm.tsx - Ao selecionar cidade
onCitySelect={(city) => {
  // ✅ Salva o ID (para o backend)
  handleChange("cityId", String(city.id));
  
  // ✅ Salva o nome (para exibição)
  handleChange("city", city.name);
  
  // ✅ Salva o estado (para exibição)
  setCityStates(prev => ({
    ...prev,
    city: city.stateCode || ""
  }));
}}
```

### Carregamento de Dados

```typescript
// Ao carregar evento do backend
useEffect(() => {
  const data = await api.get(`/events/${id}`);
  
  // Se backend retorna city como objeto
  if (typeof data.city === 'object') {
    data.cityId = data.city.id;
    data.city = data.city.name;
  }
  
  // Se backend retorna apenas cityId
  if (data.cityId && !data.city) {
    const cityData = await api.get(`/cities/${data.cityId}`);
    data.city = cityData.name;
  }
  
  setFormData(data);
}, [id]);
```

---

## 🌐 Tradução de ENUMs

### Como Funciona

1. **Backend envia traduções no metadata:**
```json
{
  "name": "eventType",
  "type": "select",
  "options": [
    { "value": "RUNNING", "label": "Corrida" },
    { "value": "CYCLING", "label": "Ciclismo" }
  ]
}
```

2. **Frontend traduz automaticamente:**
```typescript
// EntityTable.tsx - formatValue
case "enum":
case "select":
  if (field.options?.length > 0) {
    const option = field.options.find(opt => opt.value === value);
    return option ? option.label : value;
  }
  return value;
```

### Tipos Aceitos
- `type: "enum"` - tipo semântico
- `type: "select"` - tipo usado pelo backend ✅

**Zero requests adicionais!** A tradução usa dados já carregados no metadata.

---

## 🔗 Correção: Duplicate /api/api

### Problema
URLs duplicadas: `/api/api/organizations`

### Solução

```typescript
// api.ts - Request Interceptor
api.interceptors.request.use((config) => {
  let url = config.url || '';
  
  // Remove /api duplicado recursivamente
  while (url.startsWith('/api/')) {
    url = url.replace(/^\/api\/?/, '/');
  }
  
  config.url = url;
  return config;
});
```

**Funciona automaticamente** para todas as requests!

---

## 📋 Exemplos de Uso

### 1️⃣ Criar Evento

```typescript
// POST /api/events
const payload = {
  name: "Corrida de São Paulo",
  slug: "corrida-sp",
  eventType: "RUNNING",
  eventDate: "2025-12-15T07:00:00",
  city: { id: 123 },              // ✅ Objeto com ID
  location: "Ibirapuera",
  organization: { id: 6 },        // ✅ Auto-injetado do contexto
  price: 100,
  currency: "BRL",
  status: "DRAFT"
};

await api.post('/events', payload);
```

### 2️⃣ Atualizar Evento

```typescript
// PUT /api/events/10
const payload = {
  id: 10,
  name: "Maratona SP - ATUALIZADA",
  city: { id: 964 },              // ✅ Mudou a cidade
  price: 150,
  maxParticipants: 5000
};

await api.put(`/events/${id}`, payload);
```

### 3️⃣ Buscar com Filtros

```typescript
// GET /api/events?eventType=RUNNING&organization=5
const params = {
  eventType: "RUNNING",
  organization: 5,               // ✅ Usa nome do campo direto (não organizationId)
  page: 0,
  size: 10
};

const response = await api.get('/events', { params });
```

### 4️⃣ Autocomplete de Cidade

```typescript
// GET /api/cities/search?q=são paulo
const cities = await api.get('/cities/search', {
  params: { q: searchTerm }
});

// Response:
[
  { id: 123, name: "São Paulo", stateCode: "SP" },
  { id: 456, name: "São Paulo de Olivença", stateCode: "AM" }
]
```

---

## 🎯 Padrão de Relacionamentos

| Campo Backend | Como Enviar | Como Recebe | Exibição |
|---------------|-------------|-------------|----------|
| `organization` | `{id: 6}` | `{id: 6, name: "..."}` | Nome via `labelField` |
| `city` | `{id: 964}` | `{id: 964, name: "Tunas"}` | Nome + Estado |
| `event` | `{id: 10}` | `{id: 10, name: "..."}` | Nome via `labelField` |

### Auto-Injeção de Organization

```typescript
// OrganizationContext injeta automaticamente
const organizationId = useOrganization();

// No submit do formulário
const payload = {
  ...formData,
  organization: { id: organizationId }  // ✅ Auto-injetado
};
```

---

## 🎨 Metadata API

### Carregar Metadata

```typescript
// Carregado automaticamente no MetadataContext
const { metadata, getEntityMetadata } = useMetadata();

// Buscar metadata de uma entidade
const eventMetadata = getEntityMetadata('event');
```

### Estrutura do Metadata

```typescript
{
  name: "event",
  label: "Eventos",
  endpoint: "/events",
  
  tableFields: [
    {
      name: "name",
      label: "Nome",
      type: "string",
      visible: true,
      sortable: true
    },
    {
      name: "eventType",
      label: "Tipo",
      type: "select",
      options: [
        { value: "RUNNING", label: "Corrida" }
      ]
    }
  ],
  
  formFields: [
    {
      name: "city",
      label: "Cidade",
      type: "city",           // Tipo especial
      required: true
    }
  ],
  
  filters: [
    {
      name: "eventType",
      type: "select",
      options: [...]
    }
  ]
}
```

---

## 🔥 Helpers Úteis

### Converter FormData para Payload

```typescript
function preparePayload(formData: FormData): EventPayload {
  return {
    // Campos simples
    name: formData.name,
    slug: formData.slug,
    eventType: formData.eventType,
    eventDate: formData.eventDate,
    
    // Relacionamentos (converter ID para objeto)
    city: formData.cityId ? { id: parseInt(formData.cityId) } : null,
    organization: { id: parseInt(formData.organizationId) },
    
    // Conversões de tipo
    price: formData.price ? parseFloat(formData.price) : null,
    maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
    
    // Remover campos que não devem ser enviados
    createdAt: undefined,
    updatedAt: undefined,
    tenantId: undefined
  };
}
```

### Extrair ID de Relacionamento

```typescript
function extractId(value: any): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value.id) return value.id;
  return null;
}

// Uso
const cityId = extractId(event.city);  // Funciona com objeto ou número
```

---

## 🚨 Troubleshooting

### Problema: Cidade não está sendo salva

```typescript
// ❌ ERRADO
{ "city": "São Paulo" }          // String
{ "cityId": 123 }                 // Campo errado

// ✅ CORRETO
{ "city": { "id": 123 } }        // Objeto com ID
```

### Problema: ENUM aparece em inglês

**Verificar:**
1. Backend está enviando `options` no metadata?
2. Campo tem `type: "select"` ou `type: "enum"`?
3. Options têm formato `{ value, label }`?

```typescript
// Verificar no console
console.log(metadata.tableFields.find(f => f.name === 'eventType'));
// Deve ter: options: [{value: "RUNNING", label: "Corrida"}, ...]
```

### Problema: URL duplicada /api/api

**Já corrigido automaticamente!** O interceptor normaliza todas as URLs.

Se ainda ocorrer, verifique se não está concatenando `/api` manualmente:

```typescript
// ❌ ERRADO
api.get('/api/events')  // Já adiciona /api automaticamente

// ✅ CORRETO
api.get('/events')
```

### Problema: Organization não está sendo enviada

**Verificar OrganizationContext:**

```typescript
const organizationId = useOrganization();
console.log('Organization ID:', organizationId);  // Deve ter valor

// Se null/undefined, usuário não tem organization selecionada
```

---

## 📞 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **Metadata** |
| `GET` | `/metadata` | Todos os metadados |
| `GET` | `/metadata/{entity}` | Metadata de entidade específica |
| **Events** |
| `GET` | `/events` | Listar (com paginação e filtros) |
| `GET` | `/events/{id}` | Buscar por ID |
| `POST` | `/events` | Criar evento |
| `PUT` | `/events/{id}` | Atualizar evento |
| `DELETE` | `/events/{id}` | Deletar evento |
| **Cities** |
| `GET` | `/cities/search?q={query}` | Autocomplete de cidades |
| `GET` | `/cities/{id}` | Buscar cidade por ID |
| **Organizations** |
| `GET` | `/organizations` | Listar organizations |
| `GET` | `/organizations/{id}` | Buscar por ID |

---

## ✅ Checklist de Implementação

### Frontend
- [x] Sistema CRUD genérico funcionando
- [x] City enviada como objeto `{id}`
- [x] ENUMs traduzidos automaticamente
- [x] URLs normalizadas (sem /api/api)
- [x] Organization auto-injetada
- [x] Typeaheads com botão X para limpar
- [x] Formulários readonly em modo view
- [x] Relacionamentos 1:N (ArrayField)
- [x] Filtros com EntityTypeahead/EntitySelect
- [x] Breadcrumbs funcionando

### Backend (Checklist para validar)
- [ ] Endpoint `PUT /events/{id}` aceita `city: {id}`
- [ ] Metadata envia `options` para campos ENUM/SELECT
- [ ] Endpoint `/cities/search?q={query}` funcionando
- [ ] @EntityGraph configurado para evitar lazy loading
- [ ] Filtros aceitam nome do campo direto (ex: `organization=5`)

---

## 🎓 Conceitos Importantes

### 1. Metadata-Driven Architecture
O frontend não sabe nada sobre a estrutura dos dados. Tudo vem do backend via metadata.

### 2. Generic CRUD
Um único componente (`EntityCRUD`) funciona para qualquer entidade.

### 3. Type Safety
TypeScript garante type safety mesmo com sistema genérico.

### 4. Performance
- Metadata carregado 1 vez na inicialização
- Traduções via lookup local (sem requests)
- Debounce em autocompletes (300ms)

---

## 📚 Documentos Relacionados

- [ENUM_TRANSLATION.md](../ENUM_TRANSLATION.md) - Detalhes da tradução de ENUMs
- [CITY_FIELD_SUPPORT.md](./frontend/CITY_FIELD_SUPPORT.md) - Campo de cidade
- [ORGANIZATION_SYSTEM.md](./guides/ORGANIZATION_SYSTEM.md) - Sistema de organizações
- [ENTITY_CRUD_GUIDE.md](./frontend/ENTITY_CRUD_GUIDE.md) - Guia completo do CRUD

---

**Pronto para usar!** 🚀

Qualquer dúvida, consulte a documentação ou abra uma issue.
