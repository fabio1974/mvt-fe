# 📚 Documentação MVT-FE

**Sistema de Gestão de Eventos Esportivos - Frontend**

> **Última atualização:** Outubro 2025  
> **Versão:** 2.0  
> **Status:** ✅ Atualizado com o código atual

---

## 🎯 Acesso Rápido

- **[📑 Índice Completo](INDEX.md)** - Todos os documentos organizados por categoria
- **[🚀 Quick Start API](QUICK_START_API.md)** - Guia rápido de uso da API
- **[📋 Resumo de Correções](RESUMO_CORRECOES.md)** - Últimas mudanças implementadas

---

## 🚀 Quick Start

**Novo aqui?** Comece por:

1. **[guides/QUICK_START_GUIDE.md](./guides/QUICK_START_GUIDE.md)** - Setup inicial do projeto ⚙️
2. **[QUICK_START_API.md](./QUICK_START_API.md)** - Guia rápido de uso da API ⚡
3. **[guides/ARCHITECTURE.md](./guides/ARCHITECTURE.md)** - Entenda a arquitetura 🏗️
4. **[frontend/ENTITY_CRUD_GUIDE.md](./frontend/ENTITY_CRUD_GUIDE.md)** - Sistema CRUD genérico 📝

---

## 📂 Estrutura da Documentação

```
docs/
├── INDEX.md                          # 📑 Índice completo (COMECE AQUI!)
├── README.md                         # 📚 Este arquivo
├── QUICK_START_API.md               # 🚀 Guia rápido da API
├── ORGANIZATION_SUMMARY.md          # 🏢 Resumo do sistema de organizações
├── RESUMO_CORRECOES.md              # 📋 Histórico de correções
│
├── backend/                         # 🔧 Documentação Backend
│   ├── BACKEND_FORM_METADATA_SPEC.md          # Especificação completa de metadata
│   ├── BACKEND_IMPLEMENTATION_GUIDE.md        # Guia de implementação
│   ├── BACKEND_ENUM_METADATA.md               # Enums no metadata
│   ├── BACKEND_RELATIONSHIP_METADATA.md       # Relacionamentos
│   ├── COMPUTED_FIELDS_BACKEND.md             # Campos computados
│   ├── PAGINATION_CONFIG.md                   # Configuração de paginação
│   └── examples/                              # Exemplos de metadata
│
├── frontend/                        # 💻 Documentação Frontend
│   ├── ENTITY_CRUD_GUIDE.md                   # Sistema CRUD genérico
│   ├── ENTITY_FORM_GUIDE.md                   # Formulários dinâmicos
│   ├── ENTITY_FILTERS_GUIDE.md                # Filtros de busca
│   ├── ARRAY_FIELD_GUIDE.md                   # Relacionamentos 1:N
│   ├── COMPUTED_FIELDS_GUIDE.md               # Campos computados
│   ├── CITY_FIELD_SUPPORT.md                  # Campo de cidade
│   ├── FORM_GRID_SYSTEM.md                    # Sistema de grid responsivo
│   └── SELECT_VS_TYPEAHEAD_GUIDE.md           # Select vs Typeahead
│
└── guides/                          # 📖 Guias Gerais
    ├── QUICK_START_GUIDE.md                   # Setup inicial
    ├── ARCHITECTURE.md                        # Arquitetura do sistema
    ├── ORGANIZATION_SYSTEM.md                 # Sistema multi-tenant
    ├── PAYMENT_INTEGRATION.md                 # Integração de pagamentos
    └── MY_REGISTRATIONS_PAGE.md               # Página de inscrições
```

---

## 🎯 Por Categoria

### 🔧 Backend Developers

| Prioridade | Documento                                                                          | Descrição                              |
| ---------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| 🔴 Alta    | [backend/BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md)     | **Especificação completa de metadata** |
| 🔴 Alta    | [backend/BACKEND_IMPLEMENTATION_GUIDE.md](backend/BACKEND_IMPLEMENTATION_GUIDE.md) | Guia de implementação passo a passo    |
| 🟡 Média   | [backend/COMPUTED_FIELDS_BACKEND.md](backend/COMPUTED_FIELDS_BACKEND.md)           | Como configurar campos computados      |
| 🟡 Média   | [backend/BACKEND_ENUM_METADATA.md](backend/BACKEND_ENUM_METADATA.md)               | Especificação de enums                 |
| 🟢 Baixa   | [backend/PAGINATION_CONFIG.md](backend/PAGINATION_CONFIG.md)                       | Configuração de paginação              |

### 💻 Frontend Developers

| Prioridade | Documento                                                              | Descrição                         |
| ---------- | ---------------------------------------------------------------------- | --------------------------------- |
| 🔴 Alta    | [frontend/ENTITY_CRUD_GUIDE.md](frontend/ENTITY_CRUD_GUIDE.md)         | **Como criar CRUDs genéricos**    |
| 🔴 Alta    | [frontend/ENTITY_FORM_GUIDE.md](frontend/ENTITY_FORM_GUIDE.md)         | Como usar EntityForm              |
| 🟡 Média   | [frontend/ARRAY_FIELD_GUIDE.md](frontend/ARRAY_FIELD_GUIDE.md)         | Trabalhar com relacionamentos 1:N |
| 🟡 Média   | [frontend/COMPUTED_FIELDS_GUIDE.md](frontend/COMPUTED_FIELDS_GUIDE.md) | Implementar campos computados     |
| 🟢 Baixa   | [frontend/FORM_GRID_SYSTEM.md](frontend/FORM_GRID_SYSTEM.md)           | Sistema de grid responsivo        |

### 🏗️ Arquitetura e Conceitos

| Documento                                                                                  | Descrição                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------- |
| [guides/ARCHITECTURE.md](guides/ARCHITECTURE.md)                                           | Arquitetura geral do sistema          |
| [guides/ORGANIZATION_SYSTEM.md](guides/ORGANIZATION_SYSTEM.md)                             | Sistema multi-tenant com organizações |
| [guides/METADATA_FRONTEND_BACKEND_MAPPING.md](guides/METADATA_FRONTEND_BACKEND_MAPPING.md) | Mapeamento entre frontend e backend   |

---

## 🔍 Busca por Funcionalidade

### Campos Computados ⚙️

- Frontend: [frontend/COMPUTED_FIELDS_GUIDE.md](frontend/COMPUTED_FIELDS_GUIDE.md)
- Backend: [backend/COMPUTED_FIELDS_BACKEND.md](backend/COMPUTED_FIELDS_BACKEND.md)
- Implementação: [../COMPUTED_FIELDS_IMPLEMENTATION.md](../COMPUTED_FIELDS_IMPLEMENTATION.md)

### ArrayField (Relacionamentos 1:N) 🔗

- Guia Completo: [frontend/ARRAY_FIELD_GUIDE.md](frontend/ARRAY_FIELD_GUIDE.md)
- Labels Inteligentes: [frontend/ARRAY_FIELD_SMART_LABELS.md](frontend/ARRAY_FIELD_SMART_LABELS.md)
- Tradução: [backend/ARRAY_FIELD_TRANSLATION_FIX.md](backend/ARRAY_FIELD_TRANSLATION_FIX.md)

### Sistema de Metadata 📋

- Especificação: [backend/BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md)
- Enums: [backend/BACKEND_ENUM_METADATA.md](backend/BACKEND_ENUM_METADATA.md)
- Relacionamentos: [backend/BACKEND_RELATIONSHIP_METADATA.md](backend/BACKEND_RELATIONSHIP_METADATA.md)

### Organizações (Multi-tenant) 🏢

- Sistema: [guides/ORGANIZATION_SYSTEM.md](guides/ORGANIZATION_SYSTEM.md)
- Resumo: [ORGANIZATION_SUMMARY.md](ORGANIZATION_SUMMARY.md)
- Auto-fill: [guides/ORGANIZATION_AUTO_FILL.md](guides/ORGANIZATION_AUTO_FILL.md)

---

## 📋 Status do Projeto

### ✅ Implementado

- ✅ Sistema de metadata centralizado
- ✅ Componentes genéricos (EntityCRUD, EntityForm, EntityFilters, EntityTable, ArrayField)
- ✅ Campos computados (computed fields)
- ✅ Sistema multi-tenant com organizações
- ✅ Autenticação e autorização
- ✅ Integração com pagamentos (Stripe/Pix)
- ✅ Layout responsivo com grid inteligente
- ✅ Typeahead para cidades
- ✅ Suporte a enums traduzidos
- ✅ Relacionamentos 1:N com ArrayField
- ✅ Labels inteligentes em arrays

### 🔄 Features Recentes (Outubro 2025)

- ✅ **Campos computados com destaque visual**
- ✅ **Botões de ação com cor azul padronizada**
- ✅ **Label field destacado em ArrayField**
- ✅ **Melhoria no CSS dos botões Criar/Voltar**
- ✅ **Importação do CSS de campos computados**

### ⏳ Planejado

- Internacionalização (i18n)
- Modo offline
- PWA features
- Testes automatizados end-to-end

---

## 🔗 Links Úteis

- **Stack**: React 19 + TypeScript + Vite
- **UI**: TailwindCSS + CSS Modules
- **Backend**: Spring Boot + JPA
- **API**: REST

---

## 📝 Convenções de Nomenclatura

- **`BACKEND_*.md`** - Documentação específica para backend
- **`frontend/*.md`** - Documentação de componentes e features frontend
- **`guides/*.md`** - Documentação geral e arquitetura
- **`*_GUIDE.md`** - Guias de uso prático
- **`*_SPEC.md`** - Especificações técnicas detalhadas

---

## 🆘 Suporte

**Não encontrou o que procura?**

1. Confira o [INDEX.md](INDEX.md) completo
2. Veja os [exemplos no backend/examples/](backend/examples/)
3. Consulte o [QUICK_START_API.md](QUICK_START_API.md)

---

**Mantido por:** Equipe de Desenvolvimento MVT  
**Última revisão:** Outubro 2025
