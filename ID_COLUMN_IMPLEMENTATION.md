# ✅ Coluna ID Automática em EntityTable

## 🎯 Requisito

A EntityTable deve mostrar uma coluna **ID** como primeira coluna em todas as tabelas, **exceto** para a entidade `user`.

### Formatação do ID
- **8 dígitos** com zeros à esquerda (leading zeros)
- Exemplo: `1` → `00000001`, `123` → `00000123`, `12345678` → `12345678`

---

## ✅ Implementação

### 1. Verificação da Entidade

```typescript
// Determina se deve mostrar coluna ID (todas entidades exceto 'user')
const showIdColumn = entityName.toLowerCase() !== "user";
```

**Lógica:**
- `entityName !== "user"` → Mostra coluna ID
- `entityName === "user"` → Não mostra coluna ID

---

### 2. Formatação do ID

```typescript
// Função para formatar ID com zeros à esquerda (8 dígitos)
const formatId = (id: number | string): string => {
  const idStr = String(id);
  return idStr.padStart(8, '0');
};
```

**Exemplos:**
```typescript
formatId(1)        // "00000001"
formatId(42)       // "00000042"
formatId(999)      // "00000999"
formatId(12345)    // "00012345"
formatId(12345678) // "12345678"
formatId(999999999) // "999999999" (mantém se > 8 dígitos)
```

---

### 3. Cabeçalho da Tabela

```tsx
<thead>
  <tr>
    {showIdColumn && (
      <th style={{ textAlign: "center", width: "100px" }}>
        ID
      </th>
    )}
    {visibleFields.map((field) => (
      <th key={field.name}>
        {field.label}
      </th>
    ))}
    {showActions && <th>Ações</th>}
  </tr>
</thead>
```

**Estilo da Coluna ID:**
- `textAlign: "center"` - Centralizado
- `width: "100px"` - Largura fixa de 100px

---

### 4. Corpo da Tabela

```tsx
<tbody>
  {data.map((row) => (
    <tr key={row.id}>
      {showIdColumn && (
        <td style={{
          textAlign: "center",
          fontFamily: "monospace",
          fontWeight: "600",
          color: "#6b7280"
        }}>
          {formatId(row?.id)}
        </td>
      )}
      {/* Demais campos... */}
    </tr>
  ))}
</tbody>
```

**Estilo da Célula ID:**
- `textAlign: "center"` - Centralizado
- `fontFamily: "monospace"` - Fonte monoespaçada (alinhamento visual)
- `fontWeight: "600"` - Semi-negrito
- `color: "#6b7280"` - Cinza médio (não muito destacado)

---

## 📊 Resultado Visual

### Entidades Normais (delivery, event, organization, etc.)

```
┌────────────┬──────────┬──────────┬─────────┬─────────┐
│     ID     │ Cliente  │  Origem  │ Destino │  Ações  │
├────────────┼──────────┼──────────┼─────────┼─────────┤
│ 00000001   │ João     │ End A    │ End B   │ [👁 ✏️] │
│ 00000042   │ Maria    │ End C    │ End D   │ [👁 ✏️] │
│ 00000123   │ Pedro    │ End E    │ End F   │ [👁 ✏️] │
│ 00012345   │ Ana      │ End G    │ End H   │ [👁 ✏️] │
└────────────┴──────────┴──────────┴─────────┴─────────┘
```

**Características:**
- ✅ Coluna ID como primeira coluna
- ✅ IDs formatados com 8 dígitos
- ✅ Fonte monoespaçada
- ✅ Alinhamento centralizado

---

### Entidade User (SEM coluna ID)

```
┌──────────┬─────────────────────┬──────────┬─────────┐
│  Nome    │       Email         │   Role   │  Ações  │
├──────────┼─────────────────────┼──────────┼─────────┤
│ João     │ joao@example.com    │ ADMIN    │ [👁 ✏️] │
│ Maria    │ maria@example.com   │ CLIENT   │ [👁 ✏️] │
│ Pedro    │ pedro@example.com   │ MOTOBOY  │ [👁 ✏️] │
└──────────┴─────────────────────┴──────────┴─────────┘
```

**Características:**
- ❌ Sem coluna ID
- ✅ Primeira coluna é o primeiro campo visível do metadata

---

## 🎨 Estilo da Coluna ID

### CSS Inline (no componente)

```typescript
// Header
style={{
  textAlign: "center",
  width: "100px"
}}

// Cell
style={{
  textAlign: "center",
  fontFamily: "monospace",
  fontWeight: "600",
  color: "#6b7280"  // gray-500
}}
```

### Fonte Monoespaçada

**Por quê?**
- Dígitos têm largura fixa
- Alinhamento vertical perfeito
- Facilita leitura de IDs

**Exemplo visual:**
```
Sem monospace:    Com monospace:
00000001          00000001
00000123          00000123
00012345          00012345
↑ desalinhado     ↑ alinhado
```

---

## 🔧 Ajuste do ColSpan

### Mensagem "Nenhum registro encontrado"

```tsx
<td
  colSpan={
    (showIdColumn ? 1 : 0) +
    visibleFields.length +
    (showActions ? 1 : 0)
  }
  className="no-data"
>
  Nenhum registro encontrado
</td>
```

**Cálculo:**
- `showIdColumn ? 1 : 0` - Adiciona 1 se tiver coluna ID
- `visibleFields.length` - Número de campos visíveis
- `showActions ? 1 : 0` - Adiciona 1 se tiver coluna de ações

**Exemplo:**
- Delivery com ID + 5 campos + ações = colspan 7
- User sem ID + 4 campos + ações = colspan 5

---

## 📋 Casos de Uso

### Caso 1: Delivery (COM ID)

```
EntityName: "delivery"
showIdColumn: true

Colunas:
1. ID (00000001)
2. Cliente
3. Motoboy
4. Origem
5. Destino
6. Valor
7. Status
8. Ações
```

---

### Caso 2: User (SEM ID)

```
EntityName: "user"
showIdColumn: false

Colunas:
1. Nome         ← Primeiro campo do metadata
2. Email
3. Role
4. Ações
```

---

### Caso 3: Event (COM ID)

```
EntityName: "event"
showIdColumn: true

Colunas:
1. ID (00000042)
2. Nome
3. Data
4. Local
5. Vagas
6. Status
7. Ações
```

---

### Caso 4: Organization (COM ID)

```
EntityName: "organization"
showIdColumn: true

Colunas:
1. ID (00000123)
2. Nome
3. CNPJ
4. Email
5. Telefone
6. Ações
```

---

## 🔍 Detalhes Técnicos

### padStart()

```typescript
String.prototype.padStart(targetLength, padString)

// Exemplos:
"1".padStart(8, '0')      // "00000001"
"123".padStart(8, '0')    // "00000123"
"12345678".padStart(8, '0') // "12345678" (já tem 8)
"999999999".padStart(8, '0') // "999999999" (mantém 9)
```

### Conversão para String

```typescript
const idStr = String(id);

// Funciona com number ou string:
String(123)      // "123"
String("456")    // "456"
String(null)     // "null" (cuidado!)
String(undefined) // "undefined" (cuidado!)
```

### Proteção contra null/undefined

```typescript
{formatId(row?.id)}

// Se row ou id for null/undefined:
formatId(null)      // "00000000null" ❌
formatId(undefined) // "undefined" ❌

// Melhor adicionar validação:
{row?.id ? formatId(row.id) : "-"}
```

---

## ⚠️ Casos Extremos

### 1. ID null ou undefined

**Problema:**
```typescript
formatId(null) // "00000000null" ❌
```

**Solução:**
```tsx
{showIdColumn && (
  <td style={{...}}>
    {row?.id ? formatId(row.id) : "-"}
  </td>
)}
```

---

### 2. ID maior que 8 dígitos

**Comportamento:**
```typescript
formatId(123456789) // "123456789" (mantém 9 dígitos)
```

**OK:** `padStart` não trunca, apenas adiciona zeros se necessário.

---

### 3. ID com letras (UUID)

**Problema:**
```typescript
formatId("189c7d79-cb21-40c1-9b7c-006ebaa3289a")
// "00189c7d79-cb21-40c1-9b7c-006ebaa3289a" ❌ (adiciona zeros!)
```

**Solução:**
Se a entidade usa UUID em vez de número, não mostrar coluna ID ou não aplicar padStart:

```typescript
const formatId = (id: number | string): string => {
  const idStr = String(id);
  // Se contém letras ou hífens, retorna como está
  if (/[a-zA-Z-]/.test(idStr)) {
    return idStr;
  }
  // Senão, aplica padding
  return idStr.padStart(8, '0');
};
```

---

### 4. Entidade "User" (case-insensitive)

```typescript
entityName.toLowerCase() !== "user"

// Funciona com:
"user" → false (não mostra)
"User" → false (não mostra)
"USER" → false (não mostra)
"users" → true (mostra) ← cuidado!
```

**Atenção:** Se a entidade for "users" (plural), a coluna ID **será mostrada**.

---

## 🎯 Por Entidade

| Entidade | Mostra ID? | Motivo |
|----------|-----------|--------|
| **delivery** | ✅ Sim | Identificar entregas por número |
| **event** | ✅ Sim | Identificar eventos por número |
| **organization** | ✅ Sim | Identificar organizações |
| **registration** | ✅ Sim | Identificar inscrições |
| **user** | ❌ Não | IDs de usuário são UUIDs (muito longos) |

---

## 🧪 Como Testar

### Teste 1: Delivery (com ID)
```
1. Abrir página de Entregas
2. Verificar:
   ✅ Primeira coluna é "ID"
   ✅ IDs formatados (00000001, 00000042, etc)
   ✅ Fonte monoespaçada
   ✅ Centralizado
```

### Teste 2: User (sem ID)
```
1. Abrir página de Usuários
2. Verificar:
   ❌ Não tem coluna "ID"
   ✅ Primeira coluna é "Nome" ou primeiro campo
```

### Teste 3: Event (com ID)
```
1. Abrir página de Eventos
2. Verificar:
   ✅ Primeira coluna é "ID"
   ✅ IDs formatados
```

### Teste 4: Tabela Vazia
```
1. Aplicar filtro que não retorna resultados
2. Verificar:
   ✅ Mensagem "Nenhum registro encontrado"
   ✅ Mensagem ocupa todas as colunas (incluindo ID)
```

---

## 📊 Largura Recomendada

### Coluna ID: 100px

```typescript
style={{ width: "100px" }}
```

**Por quê 100px?**
- 8 dígitos + padding lateral
- Fonte monoespaçada tem largura previsível
- Não ocupa muito espaço
- Não quebra em telas menores

**Alternativas:**
- `80px` - Mais compacto (pode ser apertado)
- `120px` - Mais espaçoso (recomendado para IDs maiores)

---

## 📚 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `EntityTable.tsx` | + Variável `showIdColumn` |
| `EntityTable.tsx` | + Função `formatId()` |
| `EntityTable.tsx` | + Coluna ID no `<thead>` |
| `EntityTable.tsx` | + Célula ID no `<tbody>` |
| `EntityTable.tsx` | Ajuste `colSpan` para incluir ID |

---

## ✅ Checklist de Implementação

- [x] Variável `showIdColumn` baseada em `entityName`
- [x] Função `formatId()` com `padStart(8, '0')`
- [x] Coluna ID no header (condicional)
- [x] Célula ID no body (condicional)
- [x] Estilo da coluna ID (center, monospace, 600)
- [x] Ajuste de `colSpan` em "Nenhum registro"
- [x] Excluir entidade "user"
- [x] Sem erros TypeScript

---

## 💡 Melhorias Futuras

### 1. Customizar por Entidade

```typescript
const ID_CONFIG = {
  delivery: { show: true, digits: 8 },
  event: { show: true, digits: 6 },
  user: { show: false },
  organization: { show: true, digits: 10 },
};
```

### 2. ID Clicável

```tsx
<td onClick={() => onView(row.id)} style={{ cursor: "pointer" }}>
  {formatId(row.id)}
</td>
```

### 3. Tooltip com ID Original

```tsx
<td title={`ID original: ${row.id}`}>
  {formatId(row.id)}
</td>
```

---

**Status:** ✅ Implementado
**Data:** 21/11/2025
**Entidades com ID:** Todas exceto `user`
**Formato ID:** 8 dígitos com zeros à esquerda
**Estilo:** Centralizado, monospace, semi-negrito, cinza
