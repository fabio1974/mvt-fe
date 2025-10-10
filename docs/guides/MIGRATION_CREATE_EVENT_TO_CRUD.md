# Migração: CreateEventPage → EventsCRUDPage

## 📋 Visão Geral

A página `CreateEventPage` foi **descontinuada** em favor do `EventsCRUDPage`, que usa o componente genérico `EntityCRUD` para fornecer uma experiência completa de CRUD (Create, Read, Update, Delete).

## ❌ Problema Antigo

**Antes:** Páginas separadas para cada operação

```
/criar-evento        → CreateEventPage (criar)
/editar-evento/:id   → CreateEventPage (editar)
/eventos             → EventsCRUDPage (listar/visualizar/editar/deletar)
```

**Problemas:**

- ❌ Código duplicado
- ❌ UX inconsistente
- ❌ Rotas confusas
- ❌ Difícil manutenção

## ✅ Solução Nova

**Depois:** Uma única página com tudo

```
/eventos → EventsCRUDPage (lista + criar + editar + visualizar + deletar)
```

**Vantagens:**

- ✅ Código único e centralizado
- ✅ UX consistente (breadcrumb, navegação)
- ✅ Rotas simples
- ✅ Fácil manutenção
- ✅ 100% configurável via metadata do backend

## 🔧 Mudanças Realizadas

### 1. App.tsx - Rotas

**Antes:**

```tsx
import CreateEventPage from "./components/Events/CreateEventPage";

<Routes>
  <Route path="/eventos" element={<EventsCRUDPage />} />
  <Route path="/criar-evento" element={<CreateEventPage />} />
  <Route path="/editar-evento/:id" element={<CreateEventPage />} />
</Routes>;
```

**Depois:**

```tsx
// CreateEventPage removido

<Routes>
  <Route path="/eventos" element={<EventsCRUDPage />} />
  {/* Criar/Editar agora é tudo em /eventos */}
</Routes>
```

### 2. Sidebar.tsx - Menu

**Antes:**

```tsx
{
  label: "Criar evento",
  icon: <FiPlus />,
  path: "/criar-evento",
}
```

**Depois:**

```tsx
{
  label: "Gerenciar Eventos",
  icon: <FiPlus />,
  path: "/eventos",
}
```

### 3. OrganizationForm.tsx - Botão

**Antes:**

```tsx
<FormButton onClick={() => navigate("/criar-evento")}>
  Cadastrar Evento
</FormButton>
```

**Depois:**

```tsx
<FormButton onClick={() => navigate("/eventos")}>Gerenciar Eventos</FormButton>
```

### 4. CreateEventPage.tsx - Arquivo

Movido para: `src/components/_deprecated/CreateEventPage.tsx`

## 🎯 Como Funciona Agora

### Fluxo de Uso

```
Usuário acessa /eventos
     ↓
┌────────────────────────────────────┐
│  📊 EventsCRUDPage                 │
│  (usa EntityCRUD)                  │
├────────────────────────────────────┤
│  Modo: TABLE (padrão)              │
│  [+ Criar Novo]  [Filtros...]      │
│  ┌──────────────────────────────┐  │
│  │ Lista de eventos             │  │
│  │ [Editar] [Visualizar] [Del]  │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
     ↓
Clica [+ Criar Novo]
     ↓
┌────────────────────────────────────┐
│  📝 Modo: CREATE                   │
│  Home > Eventos > Criar Novo       │
│  ┌──────────────────────────────┐  │
│  │ Formulário de criação        │  │
│  │ [Salvar] [Cancelar]          │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
     ↓
Clica [Editar] em um evento
     ↓
┌────────────────────────────────────┐
│  ✏️ Modo: EDIT                     │
│  Home > Eventos > Editar          │
│  ┌──────────────────────────────┐  │
│  │ Formulário de edição         │  │
│  │ [Salvar] [Cancelar]          │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## 🌟 Recursos do EventsCRUDPage

### 1. Listagem (TABLE mode)

- ✅ Tabela com paginação
- ✅ Filtros dinâmicos
- ✅ Ordenação por colunas
- ✅ Busca integrada
- ✅ Ações por linha (Editar, Visualizar, Deletar)
- ✅ Botão "Criar Novo" no breadcrumb

### 2. Criação (CREATE mode)

- ✅ Formulário dinâmico baseado em metadata
- ✅ Validações automáticas
- ✅ Suporte a campos especiais (city, array, entity)
- ✅ Auto-fill de organizationId
- ✅ Breadcrumb: Home > Eventos > Criar Novo
- ✅ Botões: [Salvar] [Cancelar]

### 3. Edição (EDIT mode)

- ✅ Carrega dados existentes
- ✅ Mesmos recursos do CREATE
- ✅ Breadcrumb: Home > Eventos > Editar
- ✅ Botões: [Salvar] [Cancelar]

### 4. Visualização (VIEW mode)

- ✅ Campos em modo readonly
- ✅ Layout otimizado para leitura
- ✅ Breadcrumb: Home > Eventos > Visualizar
- ✅ Botão: [Voltar]

## 📦 Estrutura de Arquivos

```
src/components/
├── Events/
│   ├── EventsCRUDPage.tsx           ✅ Usa EntityCRUD
│   ├── EventDetailPage.tsx          ✅ Página pública (slug)
│   ├── EventRegistrationPage.tsx   ✅ Inscrição em evento
│   └── MyEventsPage.tsx             ✅ Eventos do usuário
├── Generic/
│   ├── EntityCRUD.tsx               ✅ Componente genérico
│   ├── EntityForm.tsx               ✅ Formulário genérico
│   ├── EntityTable.tsx              ✅ Tabela genérica
│   └── EntityFilters.tsx            ✅ Filtros genéricos
└── _deprecated/
    └── CreateEventPage.tsx          ❌ Descontinuado
```

## 🔄 Retrocompatibilidade

### Links Antigos

Se algum lugar ainda tenta acessar:

- `/criar-evento` → Redirecionar para `/eventos`
- `/editar-evento/:id` → Redirecionar para `/eventos`

**Solução:** Adicionar redirects no App.tsx (se necessário)

```tsx
import { Navigate } from "react-router-dom";

<Routes>
  {/* Redirects para compatibilidade */}
  <Route path="/criar-evento" element={<Navigate to="/eventos" replace />} />
  <Route
    path="/editar-evento/:id"
    element={<Navigate to="/eventos" replace />}
  />

  {/* Rota principal */}
  <Route path="/eventos" element={<EventsCRUDPage />} />
</Routes>;
```

## 🧪 Testes

### Checklist de Validação

- [ ] Acessar `/eventos` mostra lista de eventos
- [ ] Clicar "Criar Novo" abre formulário de criação
- [ ] Preencher formulário e salvar cria evento
- [ ] Clicar "Editar" abre formulário de edição
- [ ] Editar e salvar atualiza evento
- [ ] Clicar "Visualizar" mostra dados readonly
- [ ] Clicar "Deletar" remove evento (com confirmação)
- [ ] Breadcrumb funciona em todos os modos
- [ ] Sidebar → "Gerenciar Eventos" navega para `/eventos`
- [ ] Campo `city` aparece no formulário (se configurado no backend)

## 📝 Benefícios da Migração

### Para Desenvolvedores

- ✅ **Menos código:** Uma página em vez de múltiplas
- ✅ **Mais consistência:** UX padronizada
- ✅ **Fácil manutenção:** Mudanças em um só lugar
- ✅ **Reusabilidade:** EntityCRUD funciona para qualquer entidade

### Para Usuários

- ✅ **Navegação intuitiva:** Tudo em um lugar
- ✅ **UX consistente:** Breadcrumbs, botões, layout
- ✅ **Menos cliques:** Não precisa voltar para criar outro
- ✅ **Feedback visual:** Toasts, loading states

### Para o Sistema

- ✅ **Escalável:** Adicionar nova entidade = criar 1 arquivo
- ✅ **Configurável:** Tudo vem do metadata do backend
- ✅ **Testável:** Componentes genéricos bem testados
- ✅ **Manutenível:** Centralização de lógica

## 🚀 Próximos Passos

1. ✅ **Remover CreateEventPage** (movido para \_deprecated)
2. ✅ **Atualizar rotas** (App.tsx)
3. ✅ **Atualizar menu** (Sidebar.tsx)
4. ✅ **Atualizar links** (OrganizationForm.tsx)
5. ⏳ **Adicionar redirects** (se necessário)
6. ⏳ **Testar fluxo completo**
7. ⏳ **Documentar para outros desenvolvedores**

## 💡 Lições Aprendidas

### Anti-patterns Evitados

- ❌ Criar página específica para cada operação
- ❌ Duplicar código de formulários
- ❌ Rotas desorganizadas
- ❌ UX inconsistente

### Best Practices Aplicados

- ✅ Componentes genéricos e reutilizáveis
- ✅ Single Source of Truth (metadata do backend)
- ✅ Navegação baseada em estado (modes)
- ✅ Breadcrumbs para orientação

## 📚 Referências

- [EntityCRUD Documentation](./ENTITY_CRUD.md)
- [EntityForm Guide](../frontend/ENTITY_FORM_GUIDE.md)
- [Metadata System](../../METADATA_SYSTEM.md)
- [Organization Auto-fill](./ORGANIZATION_AUTO_FILL.md)

---

**Data:** 2025-01-09  
**Autor:** GitHub Copilot  
**Status:** ✅ Migração Completa
