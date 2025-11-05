# ✅ Correção: Breadcrumb usando pageTitle customizado

**Data:** 26 de Outubro de 2025  
**Status:** ✅ **CONCLUÍDO**

## 📋 Problema Identificado

O breadcrumb do EntityCRUD estava sempre mostrando o nome genérico da entidade do metadata (ex: "Usuários") ao invés do título customizado usado no sidebar (ex: "Estabelecimentos", "Motoboy").

### Sintomas:

- ❌ Breadcrumb mostrava "Usuários" para Estabelecimentos
- ❌ Breadcrumb mostrava "Usuários" para Motoboys
- ❌ Não refletia a nomenclatura do sidebar
- ❌ Causava confusão quando a mesma entidade tinha múltiplos CRUDs

### Exemplo:

**Sidebar:** "Estabelecimentos"  
**Breadcrumb (antes):** Início > **Usuários** > Visualizar ❌  
**Breadcrumb (esperado):** Início > **Estabelecimentos** > Visualizar ✅

---

## 🎯 Solução Implementada

### Arquivo: `src/components/Generic/EntityCRUD.tsx`

**Modificação 1: Adicionar pageTitle nas props desestruturadas (linha ~82):**

```typescript
const EntityCRUD: React.FC<EntityCRUDProps> = ({
  entityName,
  apiEndpoint,
  customRenderers,
  onSuccess,
  entityId: propEntityId,
  initialMode = "view",
  hideTable = false,
  showEditButton = false,
  hideArrayFields = false,
  initialFilters,
  transformData,
  pageTitle, // ✅ Adicionado
}) => {
```

**Modificação 2: Usar pageTitle no breadcrumb (linha ~232):**

```typescript
// ❌ ANTES:
<span>{metadata.label || entityName}</span>

// ✅ DEPOIS:
<span>{pageTitle || metadata.label || entityName}</span>
```

---

## ✅ Hierarquia de Fallback

O breadcrumb agora usa a seguinte ordem de prioridade:

1. **`pageTitle`** (passado como prop) - ✅ Prioridade máxima
2. **`metadata.label`** (do backend) - Fallback 1
3. **`entityName`** (nome técnico) - Fallback 2

### Exemplo de uso:

```typescript
<EntityCRUD
  entityName="user" // ← Nome técnico
  pageTitle="Estabelecimentos" // ← Exibido no breadcrumb ✅
  initialFilters={{ role: "CLIENT" }}
/>
```

---

## 📊 Páginas Afetadas

Todas as páginas já estavam usando `pageTitle`, então a correção funciona imediatamente:

### 1. **Estabelecimentos** (`ClientCRUDPage.tsx`)

```typescript
<EntityCRUD
  entityName="user"
  pageTitle="Estabelecimentos" // ✅ Já configurado
  initialFilters={{ role: "CLIENT" }}
/>
```

**Breadcrumb:** Início > **Estabelecimentos** > Gerenciar ✅

---

### 2. **Motoboys** (`CourierCRUDPage.tsx`)

```typescript
<EntityCRUD
  entityName="user"
  pageTitle="Motoboys" // ✅ Já configurado
  initialFilters={{ role: "COURIER" }}
/>
```

**Breadcrumb:** Início > **Motoboys** > Gerenciar ✅

---

### 3. **Grupos** (`OrganizationCRUDPage.tsx`)

```typescript
<EntityCRUD
  entityName="organization"
  pageTitle="Organização" // ✅ Já configurado (singular)
/>
```

**Breadcrumb:** Início > **Organização** > Gerenciar ✅

---

## 🎨 Consistência com Sidebar

Agora o breadcrumb reflete exatamente o que está no sidebar:

| Sidebar          | EntityName     | PageTitle          | Breadcrumb                             |
| ---------------- | -------------- | ------------------ | -------------------------------------- |
| Estabelecimentos | `user`         | "Estabelecimentos" | Início > **Estabelecimentos** > ... ✅ |
| Motoboy          | `user`         | "Motoboys"         | Início > **Motoboys** > ... ✅         |
| Grupos           | `organization` | "Organização"      | Início > **Organização** > ... ✅      |

---

## ✅ Benefícios

1. **Clareza:** Usuário sabe exatamente onde está baseado no sidebar
2. **Consistência:** Mesma nomenclatura em sidebar e breadcrumb
3. **Flexibilidade:** Mesmo entityName pode ter múltiplos CRUDs com nomes diferentes
4. **UX melhorada:** Navegação mais intuitiva e previsível

---

## 📝 Notas Técnicas

### Por que não usar apenas metadata.label?

O `metadata.label` vem do backend e é genérico para a entidade:

- `user` → "Usuários" (plural genérico)
- `organization` → "Organizações" (plural genérico)

Mas no frontend queremos nomenclatura específica:

- Estabelecimentos (role=CLIENT)
- Motoboys (role=COURIER)
- Organização (gerenciamento)

### Retrocompatibilidade

Se `pageTitle` não for fornecido, usa o fallback normal:

```typescript
pageTitle || metadata.label || entityName;
```

Então páginas antigas continuam funcionando sem mudanças.

---

## ✅ Checklist de Validação

- [x] `pageTitle` adicionado nas props desestruturadas
- [x] Breadcrumb usa `pageTitle` com fallback
- [x] ClientCRUDPage já usa `pageTitle="Estabelecimentos"`
- [x] CourierCRUDPage já usa `pageTitle="Motoboys"`
- [x] OrganizationCRUDPage já usa `pageTitle="Organização"`
- [x] Hierarquia de fallback implementada
- [x] Sem erros de compilação
- [x] Compatível com código existente

---

## 🚀 Status Final

**PROBLEMA RESOLVIDO**: Breadcrumb agora exibe o nome customizado do sidebar ao invés do nome genérico da entidade.

**SOLUÇÃO**: Simples e eficaz - usa `pageTitle` como prioridade no breadcrumb.

**RESULTADO**: Interface consistente e intuitiva com nomenclatura alinhada entre sidebar e breadcrumb.
