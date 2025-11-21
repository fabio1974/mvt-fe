# ✅ FIX: Reset para Página 1 ao Mudar Filtros

## 🐛 Problema Identificado

### Erro no Backend

```json
{
  "path": "/api/deliveries",
  "error": "Internal Server Error",
  "message": "fromIndex(20) > toIndex(7)",
  "timestamp": "2025-11-21T02:58:22.374309",
  "status": 500
}
```

### Cenário do Erro

1. Usuário está na **página 3** da listagem (por exemplo, items 21-30)
2. Usuário aplica um **filtro** que reduz os resultados para apenas **7 registros**
3. Backend tenta buscar página 3 (fromIndex=20), mas só existem 7 registros (toIndex=7)
4. **Erro:** `fromIndex(20) > toIndex(7)`

### Exemplo Concreto

```
Estado inicial:
- Total: 100 entregas
- Página atual: 3 (mostrando items 21-30)
- Size: 10

Usuário filtra por status=COMPLETED:
- Total após filtro: 7 entregas
- Página solicitada: 3 (fromIndex=20)
- ❌ ERRO: Não existem 20 registros para pular!
```

---

## ✅ Solução Implementada

### Reset Automático para Página 1

Adicionado `useEffect` que observa mudanças nos filtros e automaticamente reseta para a página 1:

```typescript
// Reseta para página 1 quando os filtros mudarem
useEffect(() => {
  setCurrentPage(1);
}, [filters]);
```

### Fluxo Corrigido

```
1. Usuário muda filtro
   ↓
2. useEffect detecta mudança em [filters]
   ↓
3. setCurrentPage(1) → volta para primeira página
   ↓
4. useEffect de fetchData detecta mudança em currentPage
   ↓
5. Busca dados: page=0, size=10 (primeira página)
   ↓
6. ✅ Backend retorna dados corretamente
```

---

## 🔧 Onde Aplicado

### EntityTable.tsx

```typescript
const EntityTable: React.FC<EntityTableProps> = ({
  // ... props
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  // Busca dados quando metadata, página, size ou filtros mudam
  useEffect(() => {
    if (metadata) {
      fetchData(filters);
    }
  }, [metadata, currentPage, itemsPerPage, fetchData, filters]);

  // ✅ NOVO: Reseta para página 1 quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
```

---

## 📊 Comportamento Antes vs Depois

### ANTES (Com Erro)

```
Estado: página 3, 100 registros
  ↓
Usuário filtra
  ↓
Filtros mudam → fetchData é chamado
  ↓
Request: page=2 (3ª página), status=COMPLETED
  ↓
Backend: "fromIndex(20) > toIndex(7)"
  ❌ ERRO
```

### DEPOIS (Corrigido)

```
Estado: página 3, 100 registros
  ↓
Usuário filtra
  ↓
Filtros mudam → useEffect detecta
  ↓
setCurrentPage(1) → reseta página
  ↓
fetchData é chamado
  ↓
Request: page=0, status=COMPLETED
  ↓
Backend retorna 7 registros da página 1
  ✅ SUCESSO
```

---

## 🎯 Casos de Uso Corrigidos

### Caso 1: Filtro Reduz Resultados

**Cenário:**
- 100 entregas no total, usuário na página 5
- Aplica filtro: `status=COMPLETED`
- Resultado: 7 entregas

**Comportamento:**
- ✅ Volta automaticamente para página 1
- ✅ Mostra os 7 resultados
- ✅ Paginação ajustada (1 página apenas)

---

### Caso 2: Busca por Cliente Específico

**Cenário:**
- ADMIN vendo todas as entregas (página 3 de 10)
- Filtra por `client=189c7d79-...`
- Resultado: 15 entregas desse cliente

**Comportamento:**
- ✅ Volta para página 1
- ✅ Mostra primeiras 10 entregas do cliente
- ✅ Pode navegar para página 2 (mais 5 entregas)

---

### Caso 3: Limpar Filtros

**Cenário:**
- Usuário com filtros aplicados (página 1, 5 resultados)
- Clica em "Limpar Filtros"
- Resultado: 100 entregas no total

**Comportamento:**
- ✅ Permanece na página 1
- ✅ Mostra primeiras 10 entregas
- ✅ Paginação ajustada (10 páginas)

---

## 🔍 Detalhes Técnicos

### Por que useEffect Separado?

```typescript
// ❌ NÃO funciona bem junto
useEffect(() => {
  setCurrentPage(1);
  fetchData(filters);
}, [filters]);

// ✅ Funciona corretamente separado
useEffect(() => {
  setCurrentPage(1);
}, [filters]);

useEffect(() => {
  fetchData(filters);
}, [currentPage, filters]);
```

**Motivo:**
- Quando filtros mudam, precisamos garantir que `currentPage` seja atualizado **antes** de `fetchData` ser chamado
- Com `useEffect` separado, React garante a ordem de execução
- `setCurrentPage(1)` dispara o segundo `useEffect` que chama `fetchData`

---

## 📝 Outras Proteções Existentes

### 1. handleFilterChange

Já tinha proteção, mas agora com dupla garantia:

```typescript
const handleFilterChange = useCallback((field: string, value: string) => {
  const newFilters = { ...filtersRef.current, [field]: value };
  setFilters(newFilters);
  setCurrentPage(1); // ← Já existia
  filtersRef.current = newFilters;

  // Debounce para não fazer muitas requisições
  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }

  debounceRef.current = window.setTimeout(() => {
    fetchData(newFilters);
  }, 300);
}, [fetchData]);
```

### 2. clearFilters

Também já resetava:

```typescript
const clearFilters = useCallback(() => {
  const emptyFilters: Record<string, string> = {};
  setFilters(emptyFilters);
  filtersRef.current = emptyFilters;
  setCurrentPage(1); // ← Já existia
  fetchData(emptyFilters);
}, [fetchData]);
```

### 3. NOVO: useEffect para initialFilters

Agora, mesmo `initialFilters` passados via props disparam o reset:

```typescript
useEffect(() => {
  setCurrentPage(1);
}, [filters]); // ← Observa QUALQUER mudança em filters
```

---

## 🧪 Como Testar

### Teste 1: Filtro de Status
```
1. Abrir página de Entregas
2. Navegar para página 3 ou superior
3. Aplicar filtro: Status = "Concluída"
4. Verificar:
   ✅ Página reseta para 1
   ✅ Resultados filtrados aparecem
   ✅ Sem erro 500
```

### Teste 2: Busca por Cliente (ADMIN)
```
1. Login como ADMIN
2. Abrir Entregas (todas as entregas)
3. Navegar para página 5
4. Filtrar por cliente específico
5. Verificar:
   ✅ Volta para página 1
   ✅ Mostra apenas entregas do cliente
   ✅ Paginação ajustada corretamente
```

### Teste 3: Pagamento Diário (CLIENT)
```
1. Login como CLIENT
2. Abrir "Pagamento Diário"
3. Tabela carrega com filtros iniciais:
   - status=COMPLETED
   - hasPayment=false
   - data de hoje
4. Verificar:
   ✅ Começa na página 1
   ✅ Dados corretos aparecem
   ✅ Sem erro de índice
```

### Teste 4: Limpar Filtros
```
1. Aplicar vários filtros
2. Navegar para página alta
3. Clicar "Limpar Filtros"
4. Verificar:
   ✅ Volta para página 1
   ✅ Mostra todos os registros
   ✅ Paginação completa
```

---

## ⚠️ Casos Extremos Cobertos

### 1. Página muito alta
```
- Usuário na página 100
- Aplica filtro com 1 resultado
- ✅ Vai para página 1, mostra o resultado
```

### 2. Zero resultados
```
- Aplica filtro que não retorna nada
- ✅ Vai para página 1
- ✅ Mostra "Nenhum registro encontrado"
```

### 3. Troca rápida de filtros
```
- Usuário muda filtros rapidamente
- Debounce de 300ms previne múltiplas requisições
- ✅ Sempre reseta para página 1 no final
```

### 4. initialFilters via Props
```
<EntityTable initialFilters={{ status: "COMPLETED" }} />
- ✅ Monta na página 1
- ✅ Filtros já aplicados
```

---

## 📊 Impacto da Mudança

### ✅ Positivo
- Elimina erro 500 de índice
- Melhora UX (usuário sempre vê resultados)
- Comportamento intuitivo (novos filtros = nova busca)

### ⚠️ Atenção
- Usuário sempre volta para página 1 ao filtrar
- Não mantém posição na paginação ao mudar filtro
- **Isso é esperado e correto!**

---

## 🔄 Fluxo Completo

```
1. Componente monta
   ↓
2. initialFilters aplicados
   ↓
3. currentPage = 1 (inicial)
   ↓
4. fetchData busca primeira página
   ↓
5. Usuário navega → currentPage = 3
   ↓
6. fetchData busca página 3
   ↓
7. Usuário muda filtro
   ↓
8. setFilters(newFilters)
   ↓
9. useEffect detecta mudança em filters
   ↓
10. setCurrentPage(1) → reseta página
   ↓
11. useEffect detecta mudança em currentPage
   ↓
12. fetchData busca página 1 com novos filtros
   ↓
13. ✅ Sucesso!
```

---

## 📚 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `EntityTable.tsx` | + `useEffect` para resetar página ao mudar filtros |

---

## ✅ Checklist

- [x] `useEffect` adicionado observando `filters`
- [x] `setCurrentPage(1)` ao mudar filtros
- [x] Mantém proteções existentes em `handleFilterChange` e `clearFilters`
- [x] Funciona com `initialFilters` via props
- [x] Sem erros TypeScript
- [x] Testado com diferentes cenários

---

## 💡 Explicação do Erro Backend

### fromIndex e toIndex

```java
// Backend (Spring Boot)
List<Delivery> subList = allResults.subList(fromIndex, toIndex);

// Parâmetros:
fromIndex = page * size  // Ex: página 3, size 10 → 2 * 10 = 20
toIndex = min(fromIndex + size, totalResults)  // Ex: min(30, 7) = 7

// ❌ Erro: fromIndex(20) > toIndex(7)
// Não dá para começar no índice 20 se só existem 7 elementos!
```

### Solução Frontend
Garantir que sempre começamos da página 1 ao mudar filtros!

---

**Status:** ✅ Corrigido
**Data:** 21/11/2025
**Erro Eliminado:** `fromIndex > toIndex`
**Comportamento:** Reset automático para página 1 ao filtrar
