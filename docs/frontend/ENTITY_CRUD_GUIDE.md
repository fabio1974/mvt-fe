# EntityCRUD - Componente CRUD Genérico

## 🎯 Visão Geral

O `EntityCRUD` é um componente React genérico que combina **EntityFilters**, **EntityTable** e **EntityForm** em uma interface CRUD completa. Ele elimina a necessidade de criar páginas separadas para listagem, criação, edição e visualização de entidades.

## 🏗️ Arquitetura: Metadata do Backend

### ✅ Princípio Fundamental

**TODO o comportamento e dados vêm do backend via metadata carregado no início da aplicação.**

```
┌──────────────────────────────────────────────────────────────┐
│  1. Aplicação Inicia                                         │
│     └─> MetadataContext carrega /api/metadata               │
│         └─> Traz TUDO de todas as entidades:                │
│             - Campos da tabela                               │
│             - Filtros                                        │
│             - Campos do formulário                           │
│             - Validações                                     │
│             - Opções de enums (JÁ TRADUZIDAS!)              │
│             - Relacionamentos (1:N, N:1, etc)               │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  2. EntityCRUD usa o metadata                                │
│     - EntityFilters: usa metadata.filters                    │
│     - EntityTable: usa metadata.tableFields                  │
│     - EntityForm: usa metadata.formFields (convertido)       │
└──────────────────────────────────────────────────────────────┘
```

### 🔑 Implicações

✅ **Traduções de enums já vêm do backend**

- Não precisa mapear `RUNNING -> "Corrida"` no frontend
- Backend envia `options: [{value: "RUNNING", label: "Corrida"}]`

✅ **FormMetadata vem do EntityMetadata**

- `useFormMetadata("event")` converte automaticamente
- Não há endpoint separado para formulários

✅ **Uma única fonte de verdade**

- Backend controla tudo
- Frontend apenas renderiza

## Estrutura

```
┌─────────────────────────────────────────┐
│         EntityCRUD                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Header (Título + Botão Criar)    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  EntityFilters (com filtros)      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  EntityTable                      │  │
│  │  ┌─────┬─────┬─────┬─────────┐   │  │
│  │  │ Col │ Col │ Col │ Actions │   │  │
│  │  ├─────┼─────┼─────┼─────────┤   │  │
│  │  │  👁️  │  ✏️  │  🗑️  │         │   │  │
│  │  └─────┴─────┴─────┴─────────┘   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  OU                                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  EntityForm (Criar/Editar/View)   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ Campo 1                     │  │  │
│  │  │ Campo 2                     │  │  │
│  │  │ ...                         │  │  │
│  │  │ [Salvar] [Cancelar/Voltar] │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Modos de Visualização

O componente alterna entre 4 modos:

1. **`table`** (padrão): Exibe filtros + tabela com ações
2. **`view`**: Visualização de detalhes (readonly)
3. **`create`**: Formulário de criação
4. **`edit`**: Formulário de edição

## 📝 Uso Básico (Recomendado)

### 1. Criar uma Página CRUD Simples

**99% dos casos você só precisa disso:**

```tsx
import EntityCRUD from "../Generic/EntityCRUD";

const EventsCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="event"
      pageTitle="Eventos"
      pageDescription="Gerencie todos os eventos da plataforma"
    />
  );
};

export default EventsCRUDPage;
```

**Pronto! Isso já traz:**

- ✅ Filtros com labels traduzidos
- ✅ Tabela com colunas configuradas
- ✅ Formulário com validações
- ✅ Enums com opções traduzidas
- ✅ Relacionamentos (ex: Evento → Categorias)
- ✅ Botões de ações (Visualizar, Editar, Excluir)

### 2. Adicionar Rota

```tsx
// App.tsx
import EventsCRUDPage from "./components/Events/EventsCRUDPage";

// Dentro de Routes:
<Route path="/eventos" element={<EventsCRUDPage />} />;
```

### 3. Adicionar ao Menu (Sidebar)

```tsx
{
  label: "Eventos",
  icon: <FiCalendar size={22} color="#0099ff" />,
  path: "/eventos",
}
```

## 🎨 Uso Avançado (Customizações Visuais)

**Só use `customRenderers` se precisar de formatação visual especial:**

### Exemplo: Badge Colorido para Status

```tsx
const EventsCRUDPage: React.FC = () => {
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      DRAFT: "#6b7280",
      PUBLISHED: "#8b5cf6",
      ACTIVE: "#10b981",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <EntityCRUD
      entityName="event"
      pageTitle="Eventos"
      customRenderers={{
        // Customiza APENAS a aparência visual
        // O valor já vem traduzido do backend!
        status: (value) => (
          <span
            style={{
              backgroundColor: getStatusColor(String(value)),
              padding: "3px 6px",
              borderRadius: "12px",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {String(value)}
          </span>
        ),
      }}
    />
  );
};
```

### ⚠️ IMPORTANTE: Não Traduzir Enums no Frontend

**❌ ERRADO:**

```tsx
// NÃO FAÇA ISSO - tradução já vem do backend!
customRenderers={{
  eventType: (value) => {
    const types = { RUNNING: "Corrida", FOOTBALL: "Futebol" };
    return types[value] || value;
  }
}}
```

**✅ CORRETO:**

```tsx
// Backend já envia: options: [{value: "RUNNING", label: "Corrida"}]
// Apenas renderize o valor direto:
<EntityCRUD entityName="event" />
```

      }}
    />

);
};

````

### Com Callback de Sucesso

```tsx
const EventsCRUDPage: React.FC = () => {
  const handleSuccess = (data: unknown) => {
    console.log("Evento salvo:", data);
    // Enviar analytics, atualizar estado global, etc.
  };

  return <EntityCRUD entityName="event" onSuccess={handleSuccess} />;
};
````

## Fluxo de Navegação

```
┌─────────────┐
│   /eventos  │ ← Modo: table
└──────┬──────┘
       │
       ├─→ [Criar Novo] ──→ Modo: create ──→ [Salvar] ──→ Volta para table
       │
       ├─→ [👁️ View] ──────→ Modo: view ────→ [Voltar] ─→ Volta para table
       │
       ├─→ [✏️ Edit] ──────→ Modo: edit ────→ [Salvar] ──→ Volta para table
       │
       └─→ [🗑️ Delete] ────→ Confirma ──────→ Refresh table
```

## Requisitos do Metadata

Para funcionar corretamente, o backend deve fornecer metadata com:

### Metadata da Entidade (para tabela)

```json
{
  "label": "Eventos",
  "endpoint": "/events",
  "fields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "text",
      "visible": true
    }
  ],
  "filters": [
    {
      "name": "status",
      "label": "Status",
      "type": "select",
      "options": [...]
    }
  ]
}
```

### Metadata de Formulário (para criar/editar)

```json
{
  "endpoint": "/events",
  "sections": [
    {
      "title": "Informações Básicas",
      "fields": [
        {
          "name": "name",
          "label": "Nome",
          "type": "text",
          "required": true
        }
      ]
    }
  ]
}
```

## Funcionalidades Incluídas

✅ **Listagem com paginação**

- Tabela responsiva
- Filtros dinâmicos
- Paginação automática
- Renderizadores customizados

✅ **Criação**

- Formulário baseado em metadata
- Validação de campos
- Relacionamentos 1:N (ArrayField)
- Toast de sucesso/erro

✅ **Visualização**

- Formulário readonly
- Todos os campos visíveis
- Botão "Voltar" apenas

✅ **Edição**

- Carregamento automático dos dados
- Mesmas validações da criação
- Atualização otimista

✅ **Exclusão**

- Confirmação de exclusão
- Refresh automático da tabela
- Tratamento de erros

## Benefícios

1. **DRY (Don't Repeat Yourself)**

   - Elimina código duplicado
   - Uma única fonte de verdade

2. **Consistência**

   - UX uniforme em todas as entidades
   - Padrões de validação consistentes

3. **Manutenibilidade**

   - Mudanças em um único lugar
   - Fácil adicionar novas entidades

4. **Produtividade**
   - Nova entidade CRUD em < 5 minutos
   - Foco na lógica de negócio

## Próximos Passos

Para adicionar uma nova entidade CRUD:

1. Garantir que o backend tem metadata configurado
2. Criar uma página simples:
   ```tsx
   const MyEntityCRUDPage: React.FC = () => (
     <EntityCRUD entityName="myEntity" />
   );
   ```
3. Adicionar rota no App.tsx
4. Adicionar item no menu Sidebar
5. Pronto! 🎉

## Exemplos de Uso

- ✅ `/eventos` - Gerenciar eventos
- ✅ `/organizacoes` - Gerenciar organizações (futuro)
- ✅ `/categorias` - Gerenciar categorias (futuro)
- ✅ `/usuarios` - Gerenciar usuários (futuro)
