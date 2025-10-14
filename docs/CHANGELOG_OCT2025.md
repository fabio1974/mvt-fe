# 📋 Changelog - Atualizações Outubro 2025

> **Última atualização:** 14 de Outubro de 2025  
> **Versão:** 2.0.0

---

## 🎨 UI/UX Improvements

### Campos Computados com Destaque Visual

**Data:** 14/out/2025  
**Tipo:** Enhancement  
**Impacto:** Médio

#### O que mudou

- Campos computados agora têm destaque visual em azul (borda, fundo e texto)
- Label fields em ArrayField também destacados quando o item está colapsado
- CSS específico: `highlighted-computed-field.css`

#### Arquivos Modificados

- `/src/components/Generic/EntityForm.tsx` - Import CSS e classe `highlighted-computed-field`
- `/src/components/Generic/ArrayField.tsx` - Estilo inline para label field
- `/src/highlighted-computed-field.css` - Novo arquivo

#### Como usar

Campos configurados com `computed` no metadata automaticamente recebem o destaque visual.

**Documentação:** [UI_IMPROVEMENTS_OCT2025.md](frontend/UI_IMPROVEMENTS_OCT2025.md)

---

### Padronização de Cores dos Botões

**Data:** 14/out/2025  
**Tipo:** Enhancement  
**Impacto:** Baixo

#### O que mudou

- Botões "Criar Novo" e "Voltar" agora usam a mesma cor azul (#3b82f6)
- Texto mais evidente (branco sem transparência)
- Efeitos hover melhorados

#### Arquivos Modificados

- `/src/components/Generic/EntityCRUD.css` - Classes `.btn-create` e `.btn-back`

#### Antes vs Depois

- **Antes:** Criar Novo (verde), Voltar (roxo)
- **Depois:** Ambos azuis (#3b82f6), consistente com "Adicionar Categoria"

**Documentação:** [UI_IMPROVEMENTS_OCT2025.md](frontend/UI_IMPROVEMENTS_OCT2025.md)

---

## 🔧 Features Implementadas

### Sistema de Campos Computados

**Data:** Outubro 2025  
**Tipo:** Feature  
**Impacto:** Alto

#### Descrição

Sistema genérico para campos calculados automaticamente baseado em outros campos.

#### Caso de Uso Principal

- **Nome de Categoria:** Combina distância, gênero e faixa etária
- Exemplo: "10KM - Masculino - 30 a 39"
- Recalcula em tempo real quando dependências mudam

#### Implementação

- **Backend:** Metadata com `computed` e `computedDependencies`
- **Frontend:** Registry de funções em `/src/utils/computedFields.ts`
- **Form:** useEffect que monitora mudanças e recalcula

#### Arquivos Principais

- `/src/utils/computedFields.ts` - Registry e funções
- `/src/components/Generic/EntityForm.tsx` - Auto-recálculo
- `/src/components/Generic/ArrayField.tsx` - Suporte em arrays

**Documentação Completa:**

- [COMPUTED_FIELDS_IMPLEMENTATION.md](../COMPUTED_FIELDS_IMPLEMENTATION.md)
- [frontend/COMPUTED_FIELDS_GUIDE.md](frontend/COMPUTED_FIELDS_GUIDE.md)
- [backend/COMPUTED_FIELDS_BACKEND.md](backend/COMPUTED_FIELDS_BACKEND.md)

---

### Labels Inteligentes em ArrayField

**Data:** Outubro 2025  
**Tipo:** Enhancement  
**Impacto:** Médio

#### Descrição

Sistema que gera automaticamente labels singulares/plurais para ArrayField.

#### Funcionamento

- Backend envia `label` no plural (ex: "Categorias")
- Frontend converte para singular (ex: "Categoria")
- Gera automaticamente "Adicionar Categoria" e "Categoria {index}"

#### Arquivos Modificados

- `/src/components/Generic/ArrayField.tsx` - Função `generateSmartLabels()`

**Documentação:** [frontend/ARRAY_FIELD_SMART_LABELS.md](frontend/ARRAY_FIELD_SMART_LABELS.md)

---

## 🐛 Bug Fixes

### Auto-preenchimento de Organization ID

**Data:** Outubro 2025  
**Tipo:** Bug Fix  
**Impacto:** Alto

#### Problema

- Campo `organizationId` não era preenchido automaticamente
- Causava erro ao salvar eventos e outras entidades

#### Solução

- EntityForm detecta campos `organizationId` ou `organization`
- Preenche automaticamente com o ID da organização do contexto
- Oculta o campo do formulário (não precisa aparecer)

#### Arquivos Modificados

- `/src/components/Generic/EntityForm.tsx` - Inicialização do formData

**Documentação:** [guides/ORGANIZATION_AUTO_FILL.md](guides/ORGANIZATION_AUTO_FILL.md)

---

### Conversão de IDs para Objetos no Submit

**Data:** Outubro 2025  
**Tipo:** Bug Fix  
**Impacto:** Alto

#### Problema

- Frontend enviava `cityId: 964` (número)
- Backend esperava `city: { id: 964 }` (objeto)

#### Solução

- EntityForm converte automaticamente antes do submit:
  - `cityId` → `city: { id: cityId }`
  - `organizationId` → `organization: { id: organizationId }`

#### Arquivos Modificados

- `/src/components/Generic/EntityForm.tsx` - Função `handleSubmit`

---

### Formulário de Edição Resetava Dados

**Data:** Outubro 2025  
**Tipo:** Bug Fix  
**Impacto:** Alto

#### Problema

- useEffect resetava formData toda vez que metadata mudava
- Perda de dados digitados pelo usuário

#### Solução

- Removido useEffect problemático
- formData inicializado apenas uma vez com useState(() => {...})

#### Arquivos Modificados

- `/src/components/Generic/EntityForm.tsx` - Removido useEffect desnecessário

---

## 📚 Documentação

### Nova Estrutura

**Data:** 14/out/2025

#### Criados

- `/docs/INDEX.md` - Índice completo de toda documentação
- `/docs/README.md` - Reestruturado com categorias e busca rápida
- `/docs/frontend/UI_IMPROVEMENTS_OCT2025.md` - Melhorias de UI

#### Atualizados

- `/docs/frontend/COMPUTED_FIELDS_GUIDE.md` - Adicionado destaque visual
- `/docs/RESUMO_CORRECOES.md` - Consolidado com todas as correções

---

## 🎯 Arquivos do Projeto Root

### Documentação em Markdown (/)

- `COMPUTED_FIELDS_IMPLEMENTATION.md` - Implementação completa de campos computados
- `COMPUTED_FIELDS_FIX.md` - Correções em campos computados
- `ORGANIZATION_ID_AUTO_INJECT.md` - Auto-injeção de organization ID
- `DEFAULT_VALUES_SYSTEM.md` - Sistema de valores padrão
- `ENUM_TRANSLATION.md` - Tradução de enums
- `FILTERS_OBJECT_FORMAT.md` - Formato de objetos em filtros
- Outros arquivos `.md` com correções específicas

---

## 🔄 Próximas Melhorias Sugeridas

### Curto Prazo

- [ ] Criar sistema de design tokens
- [ ] Documentar padrões de cores e espaçamentos
- [ ] Adicionar mais funções computadas (fullAddress, slug, etc)

### Médio Prazo

- [ ] Implementar modo escuro (dark mode)
- [ ] Internacionalização (i18n)
- [ ] Testes automatizados E2E

### Longo Prazo

- [ ] PWA features
- [ ] Modo offline
- [ ] Performance optimization

---

## 📊 Estatísticas

### Documentação

- **Total de arquivos:** ~40 documentos
- **Categorias:** Backend (14), Frontend (15), Guides (14)
- **Novos em Out/2025:** 3 documentos

### Código

- **Componentes principais:** EntityCRUD, EntityForm, EntityFilters, EntityTable, ArrayField
- **Utils:** computedFields, toast, metadata
- **Features:** Computed fields, Smart labels, Organization auto-fill

---

**Mantido por:** Equipe de Desenvolvimento MVT  
**Revisão:** v2.0.0
