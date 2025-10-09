# Sistema de Metadata-Driven UI

## 📋 Visão Geral

Este sistema permite criar interfaces de listagem e filtragem de dados **completamente dinâmicas**, baseadas em metadados fornecidos pelo backend. Não é mais necessário criar componentes específicos para cada entidade - basta usar o `EntityTable` genérico!

## 🏗️ Arquitetura

### Backend (Spring Boot)

O backend fornece metadados através do endpoint `/api/metadata` com a seguinte estrutura:

```json
{
  "Event": {
    "entityName": "Event",
    "displayName": "Eventos",
    "fields": [
      {
        "name": "name",
        "label": "Nome do Evento",
        "type": "STRING",
        "alignment": "LEFT",
        "sortable": true,
        "searchable": true,
        "visible": true
      },
      {
        "name": "eventDate",
        "label": "Data",
        "type": "DATE",
        "alignment": "CENTER",
        "sortable": true,
        "visible": true
      }
    ],
    "filters": [
      {
        "name": "search",
        "label": "Buscar",
        "type": "TEXT",
        "placeholder": "Nome do evento..."
      },
      {
        "name": "status",
        "label": "Status",
        "type": "SELECT",
        "options": [
          { "value": "PUBLISHED", "label": "Publicado" },
          { "value": "DRAFT", "label": "Pendente" }
        ]
      }
    ],
    "pagination": {
      "defaultPageSize": 5,
      "pageSizeOptions": [5, 10, 20, 50]
    }
  }
}
```

### Frontend (React + TypeScript)

#### 1. **Tipos** (`src/types/metadata.ts`)

Define interfaces TypeScript para os metadados:

- `FieldMetadata`: Configuração de campos/colunas
- `FilterMetadata`: Configuração de filtros
- `PaginationConfig`: Configuração de paginação
- `EntityMetadata`: Container completo de metadata

#### 2. **Serviço de Metadata** (`src/services/metadata.ts`)

Singleton que:

- Carrega metadados na inicialização do app
- Cacheia os metadados em memória
- Fornece acesso aos metadados por entidade

#### 3. **Componente EntityTable** (`src/components/Generic/EntityTable.tsx`)

Componente genérico que:

- Renderiza tabela baseada em metadados
- Gera filtros automaticamente
- Implementa paginação configurável
- Suporta renderizadores customizados
- Fornece ações (visualizar, editar, excluir)

#### 4. **Componente EntityFilters** (`src/components/Generic/EntityFilters.tsx`)

Renderiza filtros dinamicamente:

- TEXT → Input de texto
- SELECT → Dropdown com opções
- DATE → Date picker
- NUMBER → Input numérico

## 🚀 Como Usar

### Passo 1: Carregar Metadata na Inicialização

No `App.tsx`, carregue os metadados quando o app iniciar:

```typescript
import { useEffect } from 'react';
import { metadataService } from './services/metadata';

function App() {
  useEffect(() => {
    metadataService.loadMetadata().catch(console.error);
  }, []);

  return (
    // ... rotas
  );
}
```

### Passo 2: Criar Página com EntityTable

```typescript
import EntityTable from "../Generic/EntityTable";
import { useNavigate } from "react-router-dom";

const MyEventsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <EntityTable
      entityName="Event" // Nome da entidade no backend
      apiEndpoint="/events" // Endpoint da API
      onView={(id) => navigate(`/eventos/${id}`)}
      onEdit={(id) => navigate(`/eventos/${id}/editar`)}
      onDelete={(id) => console.log("Delete:", id)}
      showActions={true}
    />
  );
};
```

### Passo 3: Customizar Renderização (Opcional)

Use `customRenderers` para customizar como campos específicos são exibidos:

```typescript
<EntityTable
  entityName="Event"
  apiEndpoint="/events"
  customRenderers={{
    // Traduzir valores
    eventType: (value) => {
      const sports = { RUNNING: "Corrida", FOOTBALL: "Futebol" };
      return sports[value] || value;
    },

    // Renderizar badges customizados
    status: (value) => (
      <span
        className="status-badge"
        style={{ backgroundColor: getColor(value) }}
      >
        {getStatusText(value)}
      </span>
    ),

    // Formatar valores
    price: (value) => `R$ ${value.toFixed(2)}`,
  }}
/>
```

## 🎨 Recursos

### ✅ Funcionalidades Implementadas

- ✅ Renderização dinâmica de tabelas
- ✅ Filtros dinâmicos (TEXT, SELECT, DATE, NUMBER)
- ✅ Paginação configurável
- ✅ Ordenação de colunas
- ✅ Alinhamento de células (LEFT, CENTER, RIGHT)
- ✅ Formatação automática de tipos (DATE, DATETIME, BOOLEAN, DOUBLE)
- ✅ Campos aninhados (ex: `organization.name`)
- ✅ Renderizadores customizados
- ✅ Ações padrão (visualizar, editar, excluir)
- ✅ Linhas alternadas com cores
- ✅ Loading states
- ✅ Mensagens de erro
- ✅ Responsivo

### 🎯 Benefícios

1. **Zero Código Repetido**: Um único componente para todas as entidades
2. **Manutenção Centralizada**: Mudanças em uma única classe afetam todas as tabelas
3. **Configuração no Backend**: Adicionar/remover campos não requer deploy do frontend
4. **Consistência**: UI uniforme em toda aplicação
5. **Rapidez**: Criar nova tela de listagem leva minutos, não horas

## 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── metadata.ts              # Tipos TypeScript
├── services/
│   ├── api.ts                   # Cliente Axios
│   └── metadata.ts              # Serviço de metadata
└── components/
    ├── Generic/
    │   ├── EntityTable.tsx      # Componente principal
    │   ├── EntityTable.css      # Estilos
    │   └── EntityFilters.tsx    # Filtros dinâmicos
    └── Admin/
        └── AdminEventsPageNew.tsx  # Exemplo de uso
```

## 🔄 Fluxo de Dados

```
1. App inicia → metadataService.loadMetadata()
2. GET /api/metadata → Cache local
3. Componente usa EntityTable → metadataService.getEntityMetadata('Event')
4. EntityTable renderiza baseado em metadata
5. Filtros alteram → GET /api/events?filter1=value1&page=0&size=10
6. Resposta paginada → Atualiza tabela
```

## 🛠️ Customização Avançada

### Adicionar Novo Tipo de Campo

1. Adicione em `FieldType` (`metadata.ts`)
2. Implemente formatação em `formatValue()` (`EntityTable.tsx`)

### Adicionar Novo Tipo de Filtro

1. Adicione em `FilterType` (`metadata.ts`)
2. Implemente renderização em `renderFilter()` (`EntityFilters.tsx`)

### Customizar Estilo

Edite `EntityTable.css` ou sobrescreva classes CSS no componente pai.

## 📝 Exemplo Completo

```typescript
// AdminEventsPageNew.tsx
import EntityTable from "../Generic/EntityTable";

const AdminEventsPageNew: React.FC = () => {
  return (
    <EntityTable
      entityName="Event"
      apiEndpoint="/events"
      onView={(id) => console.log("View", id)}
      onEdit={(id) => console.log("Edit", id)}
      onDelete={(id) => console.log("Delete", id)}
      customRenderers={{
        eventType: (value) => getSportText(value),
        status: (value, row) => <StatusBadge status={value} />,
      }}
    />
  );
};
```

## 🚦 Próximos Passos

1. ✅ Implementar backend metadata service
2. ✅ Criar componentes genéricos frontend
3. ⏳ Adicionar suporte a ordenação clicável em headers
4. ⏳ Implementar cache inteligente de queries
5. ⏳ Adicionar suporte a filtros avançados (range, multi-select)
6. ⏳ Criar builder visual de metadados (admin panel)

## 📚 Referências

- Backend: `MetadataService.java`, `EntityMetadata.java`, `FieldMetadata.java`
- Frontend: `EntityTable.tsx`, `metadata.ts`, `AdminEventsPageNew.tsx`

---

**Desenvolvido para o projeto MVT-FE** 🏃‍♂️⚽🏀
