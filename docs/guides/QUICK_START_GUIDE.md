# 🚀 Guia Rápido - Sistema Metadata-Driven

Este guia mostra como criar páginas completas com listagem, filtros e paginação em **minutos**.

---

## 📋 **Sumário**

1. [Criar Página Simples](#1-criar-página-simples)
2. [Adicionar Filtros Automáticos](#2-adicionar-filtros-automáticos)
3. [Customizar Renderização](#3-customizar-renderização)
4. [Adicionar Ações](#4-adicionar-ações)
5. [Exemplos Práticos](#5-exemplos-práticos)
6. [Troubleshooting](#6-troubleshooting)

---

## 1️⃣ **Criar Página Simples**

### Cenário: Listar todos os eventos

**1 arquivo, 10 linhas de código:**

```tsx
// src/components/Events/EventsListPage.tsx

import EntityTable from "../Generic/EntityTable";

const EventsListPage = () => {
  return <EntityTable entityName="event" />;
};

export default EventsListPage;
```

**Resultado:**

- ✅ Tabela com todas as colunas configuradas no backend
- ✅ Filtros automáticos (status, organização, categoria, cidade, estado)
- ✅ Paginação configurável (5, 10, 20, 50 itens por página)
- ✅ Formatação automática de datas, valores, booleanos
- ✅ Loading states e mensagens de erro

---

## 2️⃣ **Adicionar Filtros Automáticos**

### Os filtros JÁ estão inclusos!

O `EntityTable` renderiza automaticamente todos os filtros configurados no backend:

```tsx
// Não precisa fazer nada!
// Os filtros aparecem automaticamente baseado no metadata
<EntityTable entityName="event" />
```

**Filtros disponíveis para "event":**

- 🔍 Status (select: DRAFT, PUBLISHED, CANCELLED, COMPLETED)
- 🏢 Organização (number: ID)
- 🏷️ Categoria (number: ID)
- 🌆 Cidade (text: busca parcial)
- 📍 Estado (select: SP, RJ, MG, BA, PR, SC, RS)

---

## 3️⃣ **Customizar Renderização**

### Cenário: Traduzir enums e adicionar badges

```tsx
import EntityTable from "../Generic/EntityTable";

const EventsListPage = () => {
  // Traduções
  const getSportText = (eventType: string) =>
    ({
      RUNNING: "Corrida",
      FOOTBALL: "Futebol",
      BASKETBALL: "Basquete",
      VOLLEYBALL: "Vôlei",
    }[eventType] || eventType);

  const getStatusText = (status: string) =>
    ({
      DRAFT: "Rascunho",
      PUBLISHED: "Publicado",
      CANCELLED: "Cancelado",
      COMPLETED: "Finalizado",
    }[status] || status);

  const getStatusColor = (status: string) =>
    ({
      DRAFT: "#6b7280",
      PUBLISHED: "#10b981",
      CANCELLED: "#ef4444",
      COMPLETED: "#3b82f6",
    }[status] || "#6b7280");

  return (
    <EntityTable
      entityName="event"
      customRenderers={{
        // Traduzir esporte
        eventType: (value) => getSportText(value),

        // Badge de status customizado
        status: (value) => (
          <span
            style={{
              backgroundColor: getStatusColor(value),
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {getStatusText(value)}
          </span>
        ),

        // Formatar nome da organização
        "organization.name": (value, row) => (
          <strong>{value || "Sem organização"}</strong>
        ),
      }}
    />
  );
};

export default EventsListPage;
```

---

## 4️⃣ **Adicionar Ações**

### Cenário: Visualizar, editar e excluir eventos

```tsx
import { useNavigate } from "react-router-dom";
import EntityTable from "../Generic/EntityTable";
import { showToast } from "../../utils/toast";
import { api } from "../../services/api";

const EventsListPage = () => {
  const navigate = useNavigate();

  const handleView = (eventId: number) => {
    navigate(`/eventos/${eventId}`);
  };

  const handleEdit = (eventId: number) => {
    navigate(`/eventos/${eventId}/editar`);
  };

  const handleDelete = async (eventId: number) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este evento?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/events/${eventId}`);
      showToast("Evento excluído com sucesso!", "success");
      // EntityTable recarrega automaticamente
      window.location.reload();
    } catch (error) {
      showToast("Erro ao excluir evento.", "error");
      console.error(error);
    }
  };

  return (
    <EntityTable
      entityName="event"
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      showActions={true} // Mostra coluna de ações
    />
  );
};

export default EventsListPage;
```

---

## 5️⃣ **Exemplos Práticos**

### Exemplo 1: Página de Inscrições da Organização

```tsx
import { useNavigate } from "react-router-dom";
import EntityTable from "../Generic/EntityTable";

const OrganizationRegistrationsPage = () => {
  const navigate = useNavigate();

  const getStatusText = (status: string) =>
    ({
      PENDING: "Pendente",
      ACTIVE: "Ativa",
      CANCELLED: "Cancelada",
    }[status] || status);

  const getStatusColor = (status: string) =>
    ({
      PENDING: "#f59e0b",
      ACTIVE: "#10b981",
      CANCELLED: "#ef4444",
    }[status] || "#6b7280");

  return (
    <EntityTable
      entityName="registration"
      onView={(id) => navigate(`/inscricoes/${id}`)}
      showActions={true}
      customRenderers={{
        status: (value) => (
          <span
            style={{
              backgroundColor: getStatusColor(value),
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "white",
            }}
          >
            {getStatusText(value)}
          </span>
        ),
        "user.name": (value) => value || "Sem nome",
        "event.name": (value) => value || "Sem evento",
      }}
    />
  );
};

export default OrganizationRegistrationsPage;
```

---

### Exemplo 2: Página de Pagamentos

```tsx
import EntityTable from "../Generic/EntityTable";

const PaymentsPage = () => {
  const getStatusText = (status: string) =>
    ({
      PENDING: "Pendente",
      PROCESSING: "Processando",
      COMPLETED: "Completo",
      FAILED: "Falhou",
      REFUNDED: "Reembolsado",
    }[status] || status);

  return (
    <EntityTable
      entityName="payment"
      customRenderers={{
        status: (value) => (
          <span className={`payment-status-${value.toLowerCase()}`}>
            {getStatusText(value)}
          </span>
        ),
        amount: (value) =>
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(value),
        gatewayProvider: (value) => value?.toUpperCase() || "-",
      }}
    />
  );
};

export default PaymentsPage;
```

---

### Exemplo 3: Página de Usuários (Admin)

```tsx
import EntityTable from "../Generic/EntityTable";

const UsersAdminPage = () => {
  const getRoleText = (role: string) =>
    ({
      ADMIN: "Administrador",
      ORGANIZER: "Organizador",
      USER: "Usuário/Atleta",
    }[role] || role);

  return (
    <EntityTable
      entityName="user"
      customRenderers={{
        role: (value) => (
          <span className={`role-badge role-${value.toLowerCase()}`}>
            {getRoleText(value)}
          </span>
        ),
        enabled: (value) => (
          <span style={{ color: value ? "#10b981" : "#ef4444" }}>
            {value ? "✓ Ativo" : "✗ Inativo"}
          </span>
        ),
      }}
    />
  );
};

export default UsersAdminPage;
```

---

## 6️⃣ **Troubleshooting**

### ❌ Problema: "Metadata não encontrada para entidade: xyz"

**Causa:** Nome da entidade incorreto ou metadata não carregado.

**Solução:**

```tsx
// ❌ Errado
<EntityTable entityName="events" /> // Plural

// ✅ Correto
<EntityTable entityName="event" /> // Singular, como definido no backend
```

**Verificar entidades disponíveis:**

```bash
# No terminal
curl http://localhost:8080/api/metadata | jq 'keys'

# Resultado: ["event", "registration", "payment", "user", "eventCategory", "organization"]
```

---

### ❌ Problema: Filtros não aparecem

**Causa:** Metadata não tem filtros configurados.

**Solução:** Verificar se o backend retorna filtros:

```bash
curl http://localhost:8080/api/metadata | jq '.event.filters'
```

Se retornar `[]` vazio, o backend precisa adicionar filtros.

---

### ❌ Problema: Dados não carregam

**Causa:** Endpoint incorreto ou backend offline.

**Verificar:**

1. Backend está rodando? `curl http://localhost:8080/api/events`
2. Token JWT válido? Verificar localStorage
3. Endpoint correto no metadata? `metadata.endpoint`

**Debug:**

```tsx
// Adicionar logs temporários
<EntityTable
  entityName="event"
  apiEndpoint="/events" // Override para testar
/>
```

---

### ❌ Problema: Página em branco após atualizar

**Causa:** Erro no MetadataProvider.

**Solução:** Verificar console do navegador:

- Erro de CORS? Configurar backend
- Erro 401? Token expirado
- Erro 500? Backend com problema

---

## 📚 **Recursos Adicionais**

### Documentação:

- `METADATA_SYSTEM.md` - Visão geral do sistema
- `METADATA_FRONTEND_BACKEND_MAPPING.md` - Mapeamento completo
- `FILTERS_DOCUMENTATION.md` - Filtros disponíveis no backend

### Arquivos Importantes:

- `src/components/Generic/EntityTable.tsx` - Componente principal
- `src/components/Generic/EntityFilters.tsx` - Renderização de filtros
- `src/types/metadata.ts` - Tipos TypeScript
- `src/services/metadata.ts` - Service de metadados

### Exemplos no Código:

- `src/components/Admin/AdminEventsPage.tsx`
- `src/components/Organization/OrganizationRegistrationsPage.tsx`

---

## 🎯 **Checklist para Nova Página**

- [ ] Criar arquivo da página em `src/components/[Módulo]/`
- [ ] Importar `EntityTable` e `useNavigate`
- [ ] Definir `entityName` correto
- [ ] Adicionar handlers de ações (onView, onEdit, onDelete)
- [ ] Criar `customRenderers` se necessário
- [ ] Adicionar rota em `App.tsx`
- [ ] Testar filtros
- [ ] Testar paginação
- [ ] Testar responsividade

---

## 💡 **Dicas Pro**

### 1. Reutilizar Renderizadores

Crie um arquivo `src/utils/renderers.ts`:

```typescript
export const statusRenderers = {
  event: {
    getStatusText: (status: string) => ({...}),
    getStatusColor: (status: string) => ({...}),
  },
  registration: {
    getStatusText: (status: string) => ({...}),
    getStatusColor: (status: string) => ({...}),
  },
};
```

### 2. Criar Componentes de Badge Reutilizáveis

```tsx
// src/components/Common/StatusBadge.tsx
export const StatusBadge = ({ status, getText, getColor }) => (
  <span
    style={{
      backgroundColor: getColor(status),
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "white",
      textTransform: "uppercase",
    }}
  >
    {getText(status)}
  </span>
);
```

### 3. Adicionar Loading Customizado

```tsx
<EntityTable
  entityName="event"
  // Loading é automático, mas pode customizar via CSS:
  // .entity-table-loading { ... }
/>
```

---

**Última atualização:** 06/10/2025  
**Mantido por:** Equipe MVT Events
