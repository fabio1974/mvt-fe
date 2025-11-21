# ✅ Esconder Coluna "Cliente" para Usuários CLIENT

## 🎯 Requisito

Nas tabelas de delivery, quando o usuário logado for um CLIENT, não mostrar a coluna "Cliente" (pois ele já sabe que são dele).

---

## ✅ Solução Implementada

### 1. Nova Função: `isClient()`

Adicionada em `/src/utils/auth.ts`:

```typescript
// Função para verificar se o usuário é cliente
export function isClient(): boolean {
  const role = getUserRole();
  return role === 'ROLE_CLIENT' || role === 'CLIENT';
}
```

---

### 2. Nova Propriedade: `hideFields`

#### EntityTable.tsx

```typescript
interface EntityTableProps {
  // ... outras propriedades
  hideFields?: string[]; // Array de nomes de campos a serem escondidos
}

const EntityTable: React.FC<EntityTableProps> = ({
  // ... outras props
  hideFields = [],
}) => {
  // Filtra campos visíveis removendo os que estão em hideFields
  const visibleFields = (fieldsSource.filter((f) => f.visible) || [])
    .filter((f) => !hideFields.includes(f.name));
```

#### EntityCRUD.tsx

```typescript
interface EntityCRUDProps {
  // ... outras propriedades
  hideFields?: string[]; // Campos a serem escondidos na tabela
}

// Repassa para o EntityTable
<EntityTable
  // ... outras props
  hideFields={hideFields}
/>
```

---

## 📦 Implementação nas Páginas

### DeliveryCRUDPage (CRUD Principal)

```typescript
import { isClient } from "../../utils/auth";

<EntityCRUD
  entityName="delivery"
  hideFields={isClient() ? ["client"] : []}
  // ... outras props
/>
```

**Resultado:**
- **Se CLIENT:** Esconde coluna "Cliente" ❌
- **Se ADMIN/MOTOBOY:** Mostra coluna "Cliente" ✅

---

### DailyPaymentPage (Pagamento Diário)

```typescript
import { isClient } from "../../utils/auth";

<EntityTable
  entityName="delivery"
  hideFields={isClient() ? ["client"] : []}
  // ... outras props
/>
```

**Resultado:**
- **Se CLIENT:** Esconde coluna "Cliente" ❌
- **Outros:** Mostra coluna "Cliente" ✅

---

## 🎨 Comportamento Visual

### Para Usuário CLIENT

```
┌─────────────────────────────────────────────────┐
│ Motoboy │ Origem │ Destino │ Valor │ Status    │
├─────────┼────────┼─────────┼───────┼───────────┤
│ Moto1   │ End A  │ End B   │ R$50  │ Concluído │
│ Moto2   │ End C  │ End D   │ R$30  │ Em rota   │
└─────────────────────────────────────────────────┘
```
**Coluna "Cliente" não aparece** ✅

---

### Para Usuário ADMIN/MOTOBOY

```
┌──────────────────────────────────────────────────────────┐
│ Cliente │ Motoboy │ Origem │ Destino │ Valor │ Status  │
├─────────┼─────────┼────────┼─────────┼───────┼─────────┤
│ João    │ Moto1   │ End A  │ End B   │ R$50  │ Concluído│
│ Maria   │ Moto2   │ End C  │ End D   │ R$30  │ Em rota │
└──────────────────────────────────────────────────────────┘
```
**Coluna "Cliente" aparece** ✅

---

## 🔧 Como Funciona

### 1. Verificação do Role

```typescript
isClient() // retorna true se role = 'ROLE_CLIENT' ou 'CLIENT'
```

### 2. Array Condicional

```typescript
hideFields={isClient() ? ["client"] : []}

// Se CLIENT: ["client"] → esconde campo "client"
// Se outro: [] → não esconde nenhum campo
```

### 3. Filtragem no EntityTable

```typescript
const visibleFields = (fieldsSource.filter((f) => f.visible) || [])
  .filter((f) => !hideFields.includes(f.name));

// Remove campos que estão no array hideFields
```

---

## 📊 Fluxo de Dados

```
1. Usuario faz login
   ↓
2. Token contém role (ROLE_CLIENT, ROLE_ADMIN, etc)
   ↓
3. isClient() verifica role
   ↓
4. Se CLIENT: hideFields=["client"]
   ↓
5. EntityTable filtra campos visíveis
   ↓
6. Coluna "Cliente" não renderiza
```

---

## 🎯 Casos de Uso

### Caso 1: CLIENT vê suas entregas
```typescript
// DeliveryCRUDPage.tsx
hideFields={["client"]}  // Esconde coluna
initialFilters={{ client: userId }}  // Filtra apenas suas entregas
```

**Resultado:**
- ✅ Vê apenas suas entregas
- ❌ Coluna "Cliente" não aparece

---

### Caso 2: ADMIN vê todas as entregas
```typescript
// DeliveryCRUDPage.tsx
hideFields={[]}  // Não esconde nenhuma coluna
initialFilters={undefined}  // Sem filtros
```

**Resultado:**
- ✅ Vê todas as entregas
- ✅ Coluna "Cliente" aparece

---

### Caso 3: MOTOBOY vê suas entregas
```typescript
// Potencial futuro filtro
hideFields={[]}  // Mostra todas as colunas
initialFilters={{ motoboy: userId }}  // Filtra suas entregas
```

**Resultado:**
- ✅ Vê suas entregas
- ✅ Coluna "Cliente" aparece (precisa saber para quem está entregando)

---

## 🔐 Segurança

### Frontend (Interface)
- Esconde coluna "Cliente" para CLIENT ✅
- Melhora UX (remove informação redundante) ✅

### Backend (Dados)
- Ainda precisa filtrar por `client_id` no backend ✅
- Frontend apenas esconde visualmente ✅
- CLIENT não consegue ver entregas de outros ✅

---

## 📝 Campos Suportados

A propriedade `hideFields` aceita **qualquer nome de campo**:

```typescript
// Exemplos de uso
hideFields={["client"]}              // Esconde coluna Cliente
hideFields={["client", "motoboy"]}   // Esconde Cliente e Motoboy
hideFields={["shippingFee"]}         // Esconde valor do frete
hideFields={[]}                      // Não esconde nada
```

---

## 🧪 Como Testar

### 1. Login como CLIENT
```
1. Login → usar@client.com
2. Menu → Entregas
3. Verificar: ❌ Coluna "Cliente" não aparece
4. Menu → Pagamento Diário
5. Verificar: ❌ Coluna "Cliente" não aparece
```

### 2. Login como ADMIN
```
1. Login → admin@sistema.com
2. Menu → Entregas
3. Verificar: ✅ Coluna "Cliente" aparece
4. Menu → Pagamento Diário (se tiver acesso)
5. Verificar: ✅ Coluna "Cliente" aparece
```

### 3. Verificar Metadata
Se o campo "client" tiver `visible: false` no metadata, ele nunca aparece para ninguém.
O `hideFields` é uma camada adicional que esconde dinamicamente.

---

## ⚙️ Propriedades Relacionadas

| Propriedade | Escopo | Uso |
|------------|--------|-----|
| `hideFields` | Dinâmico | Esconde campos baseado em lógica (role, permissão) |
| `visible` (metadata) | Estático | Esconde campos sempre (configuração do backend) |
| `initialFilters` | Dados | Filtra registros (quais entregas mostrar) |
| `hideHeader` | Layout | Esconde título e descrição |
| `hideFilters` | Layout | Esconde campos de filtro |

---

## 🔄 Compatibilidade

### ✅ Código Existente
```typescript
// Sem hideFields = não esconde nada
<EntityTable entityName="user" />
<EntityCRUD entityName="event" />
```

### ✅ Código Novo
```typescript
// Com hideFields = esconde campos específicos
<EntityTable 
  entityName="delivery" 
  hideFields={["client"]} 
/>
```

---

## 📚 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `auth.ts` | + Função `isClient()` |
| `EntityTable.tsx` | + Propriedade `hideFields` |
| `EntityTable.tsx` | + Lógica de filtro de campos |
| `EntityCRUD.tsx` | + Propriedade `hideFields` |
| `EntityCRUD.tsx` | Repassa `hideFields` para `EntityTable` |
| `DeliveryCRUDPage.tsx` | Usa `hideFields={isClient() ? ["client"] : []}` |
| `DailyPaymentPage.tsx` | Usa `hideFields={isClient() ? ["client"] : []}` |

---

## ✅ Checklist de Implementação

- [x] Função `isClient()` criada em `auth.ts`
- [x] Propriedade `hideFields` em `EntityTable`
- [x] Propriedade `hideFields` em `EntityCRUD`
- [x] Lógica de filtro de campos visíveis
- [x] `DeliveryCRUDPage` usando `hideFields`
- [x] `DailyPaymentPage` usando `hideFields`
- [x] Valor padrão `[]` (não esconde nada)
- [x] Sem erros TypeScript
- [x] Retrocompatível

---

## 💡 Possíveis Extensões Futuras

### 1. Esconder para MOTOBOY
```typescript
hideFields={isMotoboy() ? ["motoboy"] : []}
// Motoboy não precisa ver sua própria coluna
```

### 2. Esconder Múltiplos Campos
```typescript
hideFields={
  isClient() 
    ? ["client", "organizationId"] 
    : []
}
```

### 3. Baseado em Permissões
```typescript
hideFields={
  !canViewPrices() 
    ? ["shippingFee", "totalValue"] 
    : []
}
```

---

**Status:** ✅ Implementado
**Data:** 21/11/2025
**Compatibilidade:** 100% retrocompatível
**Segurança:** Frontend apenas (backend deve filtrar dados também)
