# 🔄 Mapeamento Frontend ↔ Backend - Sistema de Metadata

Este documento mostra o mapeamento completo entre os filtros do backend e como eles são consumidos no frontend.

---

## ✅ **Status Geral**

🟢 **TODOS OS FILTROS DO BACKEND ESTÃO IMPLEMENTADOS NO METADATA**  
🟢 **Frontend consume automaticamente via EntityTable**  
🟢 **Sistema 100% funcional e sincronizado**

---

## 📊 **Comparação por Entidade**

### 1️⃣ **Events (Eventos)**

#### Backend (Documentação API):

| Parâmetro        | Tipo          | Descrição                 |
| ---------------- | ------------- | ------------------------- |
| `status`         | `EventStatus` | Status do evento          |
| `organizationId` | `Long`        | ID da organização         |
| `categoryId`     | `Long`        | ID da categoria do evento |
| `city`           | `String`      | Cidade (busca parcial)    |
| `state`          | `String`      | Estado (UF)               |

#### Frontend (Metadata Atual):

```json
{
  "filters": [
    {
      "name": "status",
      "type": "select",
      "options": ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]
    },
    {
      "name": "organizationId",
      "type": "number",
      "placeholder": "ID da organização"
    },
    {
      "name": "categoryId",
      "type": "number",
      "placeholder": "ID da categoria"
    },
    {
      "name": "city",
      "type": "text",
      "placeholder": "Nome da cidade"
    },
    {
      "name": "state",
      "type": "select",
      "options": ["SP", "RJ", "MG", "BA", "PR", "SC", "RS"]
    }
  ]
}
```

**Status:** ✅ **100% Sincronizado** - Todos os 5 filtros implementados

---

### 2️⃣ **Registrations (Inscrições)**

#### Backend (Documentação API):

| Parâmetro | Tipo                 | Descrição           |
| --------- | -------------------- | ------------------- |
| `status`  | `RegistrationStatus` | Status da inscrição |
| `eventId` | `Long`               | ID do evento        |
| `userId`  | `UUID`               | UUID do usuário     |

#### Frontend (Metadata Atual):

```json
{
  "filters": [
    {
      "name": "status",
      "type": "select",
      "options": ["PENDING", "ACTIVE", "CANCELLED"]
    },
    {
      "name": "eventId",
      "type": "number",
      "placeholder": "ID do evento"
    },
    {
      "name": "userId",
      "type": "text",
      "placeholder": "UUID do usuário"
    }
  ]
}
```

**Status:** ✅ **100% Sincronizado** - Todos os 3 filtros implementados

---

### 3️⃣ **Users (Usuários)**

#### Backend (Documentação API):

| Parâmetro        | Tipo      | Descrição            |
| ---------------- | --------- | -------------------- |
| `role`           | `Role`    | Papel do usuário     |
| `organizationId` | `Long`    | ID da organização    |
| `enabled`        | `Boolean` | Status ativo/inativo |

#### Frontend (Metadata Atual):

```json
{
  "filters": [
    {
      "name": "role",
      "type": "select",
      "options": ["ADMIN", "ORGANIZER", "USER"]
    },
    {
      "name": "organizationId",
      "type": "number",
      "placeholder": "ID da organização"
    },
    {
      "name": "enabled",
      "type": "select",
      "options": ["true", "false"]
    }
  ]
}
```

**Status:** ✅ **100% Sincronizado** - Todos os 3 filtros implementados

---

### 4️⃣ **Payments (Pagamentos)**

#### Backend (Documentação API):

| Parâmetro        | Tipo            | Descrição            |
| ---------------- | --------------- | -------------------- |
| `status`         | `PaymentStatus` | Status do pagamento  |
| `registrationId` | `Long`          | ID da inscrição      |
| `provider`       | `String`        | Gateway de pagamento |

#### Frontend (Metadata Atual):

```json
{
  "filters": [
    {
      "name": "status",
      "type": "select",
      "options": ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]
    },
    {
      "name": "registrationId",
      "type": "number",
      "placeholder": "ID da inscrição"
    },
    {
      "name": "provider",
      "type": "select",
      "options": ["stripe", "mercadopago", "paypal"]
    }
  ]
}
```

**Status:** ✅ **100% Sincronizado** - Todos os 3 filtros implementados

---

### 5️⃣ **Event Categories (Categorias de Evento)**

#### Backend (Documentação API):

| Parâmetro | Tipo   | Descrição    |
| --------- | ------ | ------------ |
| `eventId` | `Long` | ID do evento |

#### Frontend (Metadata Atual):

```json
{
  "filters": [
    {
      "name": "eventId",
      "type": "number",
      "placeholder": "ID do evento"
    }
  ]
}
```

**Status:** ✅ **100% Sincronizado** - Único filtro implementado

---

## 🎯 **Como o Frontend Consome os Filtros**

### Fluxo Automático:

1. **App inicializa** → `MetadataProvider` carrega `/api/metadata`
2. **MetadataService** cacheia todos os metadados em memória
3. **EntityTable** recebe `entityName="event"`
4. **EntityTable** busca metadata correspondente via `useMetadata()`
5. **EntityFilters** renderiza filtros automaticamente baseado em `metadata.filters[]`
6. **Usuário interage** com filtros → debounce 300ms
7. **EntityTable** faz request com query params: `/api/events?status=PUBLISHED&city=São Paulo`

### Tipos de Filtro Renderizados:

```typescript
// EntityFilters.tsx renderiza automaticamente:

"text"   → <input type="text" />
"number" → <input type="number" />
"date"   → <input type="date" />
"select" → <select><option>...</option></select>
```

---

## 📝 **Exemplo de Uso no Frontend**

### Página com Filtros (AdminEventsPage.tsx):

```tsx
import EntityTable from "../Generic/EntityTable";

const AdminEventsPage = () => {
  return (
    <EntityTable
      entityName="event" // ← Busca metadata de "event"
      // Filtros são renderizados automaticamente!
      // Usuário pode filtrar por: status, organizationId, categoryId, city, state
    />
  );
};
```

### Request Gerado Automaticamente:

```bash
# Usuário seleciona: Status=PUBLISHED, Estado=SP, Cidade=São Paulo

GET /api/events?status=PUBLISHED&state=SP&city=São Paulo&page=0&size=5
```

---

## 🔍 **Validação dos Tipos de Dados**

| Filtro Backend   | Tipo Backend | Tipo Frontend | Conversão        |
| ---------------- | ------------ | ------------- | ---------------- |
| `status`         | Enum         | `select`      | String → Enum    |
| `organizationId` | Long         | `number`      | String → Long    |
| `categoryId`     | Long         | `number`      | String → Long    |
| `city`           | String       | `text`        | String (direto)  |
| `state`          | String (UF)  | `select`      | String (direto)  |
| `eventId`        | Long         | `number`      | String → Long    |
| `userId`         | UUID         | `text`        | String → UUID    |
| `enabled`        | Boolean      | `select`      | "true" → Boolean |
| `provider`       | String       | `select`      | String (direto)  |
| `registrationId` | Long         | `number`      | String → Long    |

**Conversão:** Feita automaticamente pelo Spring Boot ao receber os query params.

---

## 🎨 **Customizações de Renderização**

### Renderizadores Customizados (customRenderers):

```tsx
<EntityTable
  entityName="event"
  customRenderers={{
    // Traduzir valores de enums
    eventType: (value) =>
      ({
        RUNNING: "Corrida",
        FOOTBALL: "Futebol",
      }[value]),

    // Renderizar badges customizados
    status: (value) => (
      <span className="badge" style={{ backgroundColor: getColor(value) }}>
        {getStatusText(value)}
      </span>
    ),

    // Formatar moeda
    price: (value) => `R$ ${value.toFixed(2)}`,
  }}
/>
```

---

## 📊 **Paginação**

### Backend:

```java
// Spring Data Pageable
?page=0&size=20&sort=eventDate,asc
```

### Frontend (Configurado no Metadata):

```json
{
  "pagination": {
    "defaultPageSize": 5,
    "pageSizeOptions": [5, 10, 20, 50],
    "showSizeSelector": true
  }
}
```

### Componente Gera Automaticamente:

- Controles de navegação (‹ › « »)
- Seletor de itens por página
- Indicador de página atual
- Total de registros

---

## ✅ **Checklist de Compatibilidade**

- [x] Events - 5/5 filtros implementados
- [x] Registrations - 3/3 filtros implementados
- [x] Users - 3/3 filtros implementados
- [x] Payments - 3/3 filtros implementados
- [x] EventCategories - 1/1 filtro implementado
- [x] Paginação configurada em todas as entidades
- [x] Tipos de dados compatíveis
- [x] Enums mapeados corretamente
- [x] Query params gerados automaticamente
- [x] Debounce implementado (300ms)
- [x] Loading states
- [x] Error handling
- [x] Responsivo

---

## 🚀 **Performance e Otimizações**

### Frontend:

- ✅ Metadata carregado uma vez na inicialização
- ✅ Cache em memória (MetadataService)
- ✅ Debounce em filtros de texto (300ms)
- ✅ Paginação evita carregar muitos dados
- ✅ Lazy loading de imagens

### Backend:

- ✅ JPA Specifications para queries otimizadas
- ✅ @EntityGraph para evitar N+1
- ✅ Índices no banco de dados
- ✅ Multi-tenancy com Hibernate Filters
- ✅ Cache de segundo nível (se configurado)

---

## 📚 **Documentação de Referência**

### Frontend:

- `METADATA_SYSTEM.md` - Documentação completa do sistema
- `src/types/metadata.ts` - Tipos TypeScript
- `src/components/Generic/EntityTable.tsx` - Implementação
- `src/components/Generic/EntityFilters.tsx` - Filtros

### Backend:

- `FILTERS_DOCUMENTATION.md` - Documentação dos filtros da API
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`

---

## 🎯 **Conclusão**

✅ **Sistema 100% sincronizado**  
✅ **Todos os filtros do backend estão no metadata**  
✅ **Frontend consome automaticamente**  
✅ **Zero configuração manual necessária**

**Basta usar `<EntityTable entityName="..." />` e tudo funciona!** 🚀

---

**Última atualização:** 06/10/2025  
**Versão Frontend:** 0.0.0  
**Versão Backend:** 0.0.1-SNAPSHOT
