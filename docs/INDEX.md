# 📚 Índice Completo da Documentação MVT-FE

> **Última atualização:** Outubro 2025  
> **Status:** ✅ Atualizado com o código atual

---

## 🎯 Início Rápido

### Para Novos Desenvolvedores

1. **[README.md](README.md)** - Visão geral do projeto
2. **[guides/QUICK_START_GUIDE.md](guides/QUICK_START_GUIDE.md)** - Setup e primeiros passos
3. **[QUICK_START_API.md](QUICK_START_API.md)** - Guia rápido da API

### Para Backend Developers

1. **[backend/BACKEND_IMPLEMENTATION_GUIDE.md](backend/BACKEND_IMPLEMENTATION_GUIDE.md)** - Guia de implementação
2. **[backend/BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md)** - Especificação de metadata
3. **[backend/COMPUTED_FIELDS_BACKEND.md](backend/COMPUTED_FIELDS_BACKEND.md)** - Campos computados

### Para Frontend Developers

1. **[frontend/ENTITY_CRUD_GUIDE.md](frontend/ENTITY_CRUD_GUIDE.md)** - Sistema CRUD genérico
2. **[frontend/ENTITY_FORM_GUIDE.md](frontend/ENTITY_FORM_GUIDE.md)** - Formulários dinâmicos
3. **[frontend/COMPUTED_FIELDS_GUIDE.md](frontend/COMPUTED_FIELDS_GUIDE.md)** - Campos computados

---

## 📖 Documentação por Categoria

### 1️⃣ Arquitetura e Conceitos

| Documento                                                      | Descrição                         | Status   |
| -------------------------------------------------------------- | --------------------------------- | -------- |
| [guides/ARCHITECTURE.md](guides/ARCHITECTURE.md)               | Arquitetura geral do sistema      | ✅ Atual |
| [guides/ORGANIZATION_SYSTEM.md](guides/ORGANIZATION_SYSTEM.md) | Sistema multi-tenant              | ✅ Atual |
| [ORGANIZATION_SUMMARY.md](ORGANIZATION_SUMMARY.md)             | Resumo do sistema de organizações | ✅ Atual |

### 2️⃣ Backend - Especificações

| Documento                                                                            | Descrição                          | Status   |
| ------------------------------------------------------------------------------------ | ---------------------------------- | -------- |
| [backend/BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md)       | Especificação completa de metadata | ✅ Atual |
| [backend/BACKEND_ENUM_METADATA.md](backend/BACKEND_ENUM_METADATA.md)                 | Enums no metadata                  | ✅ Atual |
| [backend/BACKEND_RELATIONSHIP_METADATA.md](backend/BACKEND_RELATIONSHIP_METADATA.md) | Relacionamentos                    | ✅ Atual |
| [backend/COMPUTED_FIELDS_BACKEND.md](backend/COMPUTED_FIELDS_BACKEND.md)             | Campos computados                  | ✅ Atual |
| [backend/PAGINATION_CONFIG.md](backend/PAGINATION_CONFIG.md)                         | Configuração de paginação          | ✅ Atual |

### 3️⃣ Backend - Implementação

| Documento                                                                                | Descrição              | Status     |
| ---------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| [backend/BACKEND_IMPLEMENTATION_GUIDE.md](backend/BACKEND_IMPLEMENTATION_GUIDE.md)       | Guia de implementação  | ✅ Atual   |
| [backend/BACKEND_CHECKLIST.md](backend/BACKEND_CHECKLIST.md)                             | Checklist de tarefas   | ⚠️ Revisar |
| [backend/BACKEND_RENDERAS_IMPLEMENTATION.md](backend/BACKEND_RENDERAS_IMPLEMENTATION.md) | Implementação renderAs | ✅ Atual   |
| [backend/ENUM_OPTIONS_REQUIRED.md](backend/ENUM_OPTIONS_REQUIRED.md)                     | Requisitos de enums    | ✅ Atual   |

### 4️⃣ Frontend - Componentes Principais

| Documento                                                            | Descrição                          | Status   |
| -------------------------------------------------------------------- | ---------------------------------- | -------- |
| [frontend/ENTITY_CRUD_GUIDE.md](frontend/ENTITY_CRUD_GUIDE.md)       | EntityCRUD - Sistema CRUD completo | ✅ Atual |
| [frontend/ENTITY_FORM_GUIDE.md](frontend/ENTITY_FORM_GUIDE.md)       | EntityForm - Formulários dinâmicos | ✅ Atual |
| [frontend/ENTITY_FILTERS_GUIDE.md](frontend/ENTITY_FILTERS_GUIDE.md) | EntityFilters - Filtros de busca   | ✅ Atual |
| [frontend/ARRAY_FIELD_GUIDE.md](frontend/ARRAY_FIELD_GUIDE.md)       | ArrayField - Relacionamentos 1:N   | ✅ Atual |

### 5️⃣ Frontend - Features Especiais

| Documento                                                                      | Descrição                     | Status   |
| ------------------------------------------------------------------------------ | ----------------------------- | -------- |
| [frontend/COMPUTED_FIELDS_GUIDE.md](frontend/COMPUTED_FIELDS_GUIDE.md)         | Campos computados             | ✅ Atual |
| [frontend/CITY_FIELD_SUPPORT.md](frontend/CITY_FIELD_SUPPORT.md)               | Campo de cidade (typeahead)   | ✅ Atual |
| [frontend/ARRAY_FIELD_SMART_LABELS.md](frontend/ARRAY_FIELD_SMART_LABELS.md)   | Labels inteligentes em arrays | ✅ Atual |
| [frontend/SELECT_VS_TYPEAHEAD_GUIDE.md](frontend/SELECT_VS_TYPEAHEAD_GUIDE.md) | Select vs Typeahead           | ✅ Atual |

### 6️⃣ Frontend - Layout e UI

| Documento                                                                    | Descrição                         | Status   |
| ---------------------------------------------------------------------------- | --------------------------------- | -------- |
| [frontend/FORM_GRID_SYSTEM.md](frontend/FORM_GRID_SYSTEM.md)                 | Sistema de grid responsivo        | ✅ Atual |
| [frontend/INTELLIGENT_FORM_LAYOUT.md](frontend/INTELLIGENT_FORM_LAYOUT.md)   | Layout inteligente de formulários | ✅ Atual |
| [frontend/GRID_BALANCING_ALGORITHM.md](frontend/GRID_BALANCING_ALGORITHM.md) | Algoritmo de balanceamento        | ✅ Atual |
| [frontend/MINIMUM_FIELD_WIDTHS.md](frontend/MINIMUM_FIELD_WIDTHS.md)         | Larguras mínimas de campos        | ✅ Atual |
| [frontend/HIDING_FORM_FIELDS.md](frontend/HIDING_FORM_FIELDS.md)             | Ocultação de campos               | ✅ Atual |

### 7️⃣ Guias Específicos

| Documento                                                                  | Descrição                 | Status   |
| -------------------------------------------------------------------------- | ------------------------- | -------- |
| [frontend/ENTITY_FORM_USAGE.md](frontend/ENTITY_FORM_USAGE.md)             | Uso prático do EntityForm | ✅ Atual |
| [frontend/ENTITY_FILTERS_SOLUTION.md](frontend/ENTITY_FILTERS_SOLUTION.md) | Soluções para filtros     | ✅ Atual |
| [guides/ORGANIZATION_AUTO_FILL.md](guides/ORGANIZATION_AUTO_FILL.md)       | Auto-preenchimento de org | ✅ Atual |
| [guides/PAYMENT_INTEGRATION.md](guides/PAYMENT_INTEGRATION.md)             | Integração de pagamentos  | ✅ Atual |
| [guides/MY_REGISTRATIONS_PAGE.md](guides/MY_REGISTRATIONS_PAGE.md)         | Página de inscrições      | ✅ Atual |

### 8️⃣ Análise e Correções

| Documento                                                          | Descrição                    | Status     |
| ------------------------------------------------------------------ | ---------------------------- | ---------- |
| [RESUMO_CORRECOES.md](RESUMO_CORRECOES.md)                         | Resumo de todas as correções | ✅ Atual   |
| [backend/METADATA_ANALYSIS.md](backend/METADATA_ANALYSIS.md)       | Análise de metadata          | ⚠️ Revisar |
| [backend/BACKEND_FIXES_NEEDED.md](backend/BACKEND_FIXES_NEEDED.md) | Correções necessárias        | ⚠️ Revisar |
| [guides/ACTIONS_SUMMARY.md](guides/ACTIONS_SUMMARY.md)             | Resumo de ações              | ✅ Atual   |

### 9️⃣ Migrações e Mudanças

| Documento                                                                                  | Descrição                   | Status   |
| ------------------------------------------------------------------------------------------ | --------------------------- | -------- |
| [guides/MIGRATION_CREATE_EVENT_TO_CRUD.md](guides/MIGRATION_CREATE_EVENT_TO_CRUD.md)       | Migração para CRUD genérico | ✅ Atual |
| [guides/METADATA_FRONTEND_BACKEND_MAPPING.md](guides/METADATA_FRONTEND_BACKEND_MAPPING.md) | Mapeamento frontend-backend | ✅ Atual |

---

## 🔍 Busca Rápida por Tópico

### Campos Computados

- [frontend/COMPUTED_FIELDS_GUIDE.md](frontend/COMPUTED_FIELDS_GUIDE.md) - Guia frontend
- [backend/COMPUTED_FIELDS_BACKEND.md](backend/COMPUTED_FIELDS_BACKEND.md) - Especificação backend
- [COMPUTED_FIELDS_IMPLEMENTATION.md](../COMPUTED_FIELDS_IMPLEMENTATION.md) - Implementação completa

### ArrayField (Relacionamentos 1:N)

- [frontend/ARRAY_FIELD_GUIDE.md](frontend/ARRAY_FIELD_GUIDE.md) - Guia completo
- [frontend/ARRAY_FIELD_SMART_LABELS.md](frontend/ARRAY_FIELD_SMART_LABELS.md) - Labels inteligentes
- [backend/ARRAY_FIELD_TRANSLATION_FIX.md](backend/ARRAY_FIELD_TRANSLATION_FIX.md) - Tradução de labels

### Sistema de Metadata

- [backend/BACKEND_FORM_METADATA_SPEC.md](backend/BACKEND_FORM_METADATA_SPEC.md) - Especificação completa
- [backend/METADATA_FORMAT_V2.md](backend/METADATA_FORMAT_V2.md) - Formato v2
- [backend/METADATA_SYSTEM.md](backend/METADATA_SYSTEM.md) - Sistema geral

### Organizações (Multi-tenant)

- [guides/ORGANIZATION_SYSTEM.md](guides/ORGANIZATION_SYSTEM.md) - Sistema completo
- [ORGANIZATION_SUMMARY.md](ORGANIZATION_SUMMARY.md) - Resumo
- [guides/ORGANIZATION_AUTO_FILL.md](guides/ORGANIZATION_AUTO_FILL.md) - Auto-preenchimento

### Enums

- [backend/BACKEND_ENUM_METADATA.md](backend/BACKEND_ENUM_METADATA.md) - Especificação
- [backend/ENUM_OPTIONS_REQUIRED.md](backend/ENUM_OPTIONS_REQUIRED.md) - Requisitos

---

## 📌 Legenda de Status

- ✅ **Atual** - Documentação atualizada com o código
- ⚠️ **Revisar** - Precisa de revisão ou atualização
- 🚧 **Em desenvolvimento** - Ainda sendo escrito
- 📦 **Arquivado** - Mantido para histórico, mas obsoleto

---

## 🆘 Suporte

Se você não encontrou o que procura:

1. Verifique o [README.md](README.md) principal
2. Consulte [QUICK_START_API.md](QUICK_START_API.md)
3. Veja os exemplos em [backend/examples/](backend/examples/)

---

**Última revisão:** Outubro 2025  
**Mantido por:** Equipe de Desenvolvimento MVT
