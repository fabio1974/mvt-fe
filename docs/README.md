# 📚 Documentação do Projeto MVT-FE

Documentação completa do projeto Mountain Valley Trails - Frontend.

## 📁 Estrutura da Documentação

### 🎯 Guias Principais (`/guides`)

- **[ARCHITECTURE.md](guides/ARCHITECTURE.md)** - Arquitetura geral do projeto
- **[QUICK_START_GUIDE.md](guides/QUICK_START_GUIDE.md)** - Guia rápido de início
- **[ORGANIZATION_SYSTEM.md](guides/ORGANIZATION_SYSTEM.md)** - Sistema de organizações
- **[PAYMENT_INTEGRATION.md](guides/PAYMENT_INTEGRATION.md)** - Integração com pagamentos
- **[MY_REGISTRATIONS_PAGE.md](guides/MY_REGISTRATIONS_PAGE.md)** - Página de inscrições do usuário

### 🔧 Backend (`/backend`)

#### Especificações de Metadata

- **[BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md)** - Especificação completa do metadata de formulários
- **[BACKEND_ENUM_METADATA.md](backend/BACKEND_ENUM_METADATA.md)** - Especificação de enums no metadata
- **[BACKEND_RELATIONSHIP_METADATA.md](backend/BACKEND_RELATIONSHIP_METADATA.md)** - Especificação de relacionamentos
- **[BACKEND_RENDERAS_IMPLEMENTATION.md](backend/BACKEND_RENDERAS_IMPLEMENTATION.md)** - Implementação do renderAs

#### Análise e Correções

- **[BACKEND_FIXES_NEEDED.md](backend/BACKEND_FIXES_NEEDED.md)** - ⚠️ Lista crítica de correções necessárias
- **[METADATA_ANALYSIS.md](backend/METADATA_ANALYSIS.md)** - Análise detalhada do metadata atual
- **[METADATA_SYSTEM.md](backend/METADATA_SYSTEM.md)** - Sistema de metadata

#### Guias de Implementação

- **[BACKEND_IMPLEMENTATION_GUIDE.md](backend/BACKEND_IMPLEMENTATION_GUIDE.md)** - Guia de implementação backend
- **[BACKEND_CHECKLIST.md](backend/BACKEND_CHECKLIST.md)** - Checklist de implementação

### 💻 Frontend (`/frontend`)

#### Componentes Genéricos

- **[ENTITY_CRUD_GUIDE.md](frontend/ENTITY_CRUD_GUIDE.md)** - Guia do componente EntityCRUD
- **[ENTITY_FORM_GUIDE.md](frontend/ENTITY_FORM_GUIDE.md)** - Guia do componente EntityForm
- **[ENTITY_FILTERS_GUIDE.md](frontend/ENTITY_FILTERS_GUIDE.md)** - Guia do componente EntityFilters
- **[ARRAY_FIELD_GUIDE.md](frontend/ARRAY_FIELD_GUIDE.md)** - Guia do componente ArrayField
- **[SELECT_VS_TYPEAHEAD_GUIDE.md](frontend/SELECT_VS_TYPEAHEAD_GUIDE.md)** - Diferenças entre Select e Typeahead

#### Soluções e Melhorias

- **[ENTITY_FILTERS_SOLUTION.md](frontend/ENTITY_FILTERS_SOLUTION.md)** - Soluções para EntityFilters
- **[ENTITY_FORM_USAGE.md](frontend/ENTITY_FORM_USAGE.md)** - Uso do EntityForm
- **[ARRAYFIELD_IMPROVEMENTS.md](frontend/ARRAYFIELD_IMPROVEMENTS.md)** - Melhorias no ArrayField
- **[MELHORIAS_LAYOUT_ENTITY_COMPONENTS.md](frontend/MELHORIAS_LAYOUT_ENTITY_COMPONENTS.md)** - Melhorias de layout

#### Correções e Resumos

- **[CORRECAO_ENTITY_SELECT.md](frontend/CORRECAO_ENTITY_SELECT.md)** - Correções no EntitySelect
- **[RESUMO_CORRECAO.md](frontend/RESUMO_CORRECAO.md)** - Resumo de correções
- **[ACTIONS_SUMMARY.md](frontend/ACTIONS_SUMMARY.md)** - Resumo de ações
- **[METADATA_FRONTEND_BACKEND_MAPPING.md](frontend/METADATA_FRONTEND_BACKEND_MAPPING.md)** - Mapeamento frontend-backend
- **[MENSAGEM_PARA_BACKEND.md](frontend/MENSAGEM_PARA_BACKEND.md)** - Mensagens para o backend

## 🚀 Por Onde Começar?

### Para Desenvolvedores Novos no Projeto:

1. Leia **[QUICK_START_GUIDE.md](guides/QUICK_START_GUIDE.md)**
2. Entenda a **[ARCHITECTURE.md](guides/ARCHITECTURE.md)**
3. Veja **[ENTITY_CRUD_GUIDE.md](frontend/ENTITY_CRUD_GUIDE.md)** para componentes genéricos

### Para Backend:

1. **⚠️ PRIORIDADE**: Leia **[BACKEND_FIXES_NEEDED.md](backend/BACKEND_FIXES_NEEDED.md)**
2. Consulte **[BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md)**
3. Implemente seguindo **[BACKEND_IMPLEMENTATION_GUIDE.md](backend/BACKEND_IMPLEMENTATION_GUIDE.md)**

### Para Frontend:

1. Use **[ENTITY_CRUD_GUIDE.md](frontend/ENTITY_CRUD_GUIDE.md)** para criar CRUDs
2. Consulte **[ENTITY_FORM_GUIDE.md](frontend/ENTITY_FORM_GUIDE.md)** para formulários
3. Veja **[SELECT_VS_TYPEAHEAD_GUIDE.md](frontend/SELECT_VS_TYPEAHEAD_GUIDE.md)** para selects

## 📋 Status do Projeto

### ✅ Implementado

- Sistema de metadata centralizado
- Componentes genéricos (EntityCRUD, EntityForm, EntityFilters, EntityTable)
- ArrayField para relacionamentos 1:N
- Sistema de autenticação
- Integração com pagamentos (Stripe/Pix)

### 🔄 Em Desenvolvimento

- Correções de metadata do backend (ver BACKEND_FIXES_NEEDED.md)
- Otimizações de performance
- Testes automatizados

### ⏳ Planejado

- Internacionalização (i18n)
- Modo offline
- PWA features

## 🔗 Links Úteis

- **Repositório**: [fabio1974/mvt-fe](https://github.com/fabio1974/mvt-fe)
- **Stack**: React 19 + TypeScript + Vite
- **UI**: TailwindCSS + CSS Modules
- **API**: REST (Spring Boot backend)

## 📝 Convenções

- **Backend**: Documentos começando com `BACKEND_`
- **Frontend**: Documentos sobre componentes e features
- **Guides**: Documentação geral e arquitetura
- **\_GUIDE.md**: Guias de uso
- **\_SPEC.md**: Especificações técnicas

---

**Última atualização**: Outubro 2025
