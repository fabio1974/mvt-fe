# Resumo das Correções - API Duplicada e Validações

## 🔧 Problema: `/api/api` - URL Duplicada

### Causa Raiz

A URL base no `.env` já incluía `/api`:

```
VITE_API_URL=http://localhost:8080/api
```

Mas os endpoints nos metadatas e no código também incluíam `/api/`, resultando em:

```
http://localhost:8080/api/api/events ❌
```

### Solução Aplicada

#### 1. **Removido `/api/` dos Metadatas**

`src/metadata/eventFormMetadata.ts`:

```diff
- endpoint: "/api/events",
+ endpoint: "/events",
```

#### 2. **Removida Lógica de Remoção de `/api/`**

**EntityTypeahead.tsx** (2 lugares):

```diff
- if (endpoint.startsWith("/api/")) {
-   endpoint = endpoint.substring(4);
- }
+ // Garante que o endpoint começa com /
  if (!endpoint.startsWith("/")) {
    endpoint = `/${endpoint}`;
  }
```

**EntitySelect.tsx**:

```diff
- // Remove /api do início se existir (baseURL do axios já inclui /api)
- if (endpoint.startsWith("/api/")) {
-   endpoint = endpoint.substring(4);
- }
+ // Garante que o endpoint começa com /
  if (!endpoint.startsWith("/")) {
    endpoint = `/${endpoint}`;
  }
```

**EntityTable.tsx**:

```diff
- // Remove /api do início se existir (baseURL do axios já inclui /api)
- if (endpoint.startsWith("/api/")) {
-   endpoint = endpoint.substring(4);
-   console.log("⚠️ Removendo /api duplicado do endpoint:", endpoint);
- }
+ // Garante que o endpoint começa com /
  if (!endpoint.startsWith("/")) {
    endpoint = `/${endpoint}`;
  }
```

#### 3. **Removida Pasta `/src/metadata`**

```bash
rm -rf /Users/jose.barros.br/Documents/projects/mvt-fe/src/metadata
```

**Motivo**: A pasta `metadata` com `eventFormMetadata.ts` **ia contra a arquitetura** baseada em metadata do backend.

### Resultado

```
✅ http://localhost:8080/api/events
❌ http://localhost:8080/api/api/events (eliminado)
```

## 🎯 Problema: Validações Incorretas

### Causa

Validações sendo aplicadas em tipos de campos incorretos:

- `minLength`/`maxLength` em campos numéricos, selects, datas
- `min`/`max` em campos de texto
- Mensagens: "deve ter no mínimo null caracteres"

### Solução

Separação de validações por tipo de campo em `validateField()`:

```tsx
// Validações numéricas (min/max) - APENAS para number, date, datetime
const isNumericField =
  field.type === "number" || field.type === "date" || field.type === "datetime";

// Validações de comprimento (minLength/maxLength) - APENAS para text, textarea, email, password
const isTextField =
  field.type === "text" ||
  field.type === "textarea" ||
  field.type === "email" ||
  field.type === "password";
```

### Resultado

```
✅ Campos de texto: minLength/maxLength
✅ Campos numéricos: min/max
✅ Selects/Dates: sem validações de comprimento
✅ Mensagens de erro corretas
```

## 🧹 Problema: Erros Persistentes

### Causa

Erros de validação persistindo após submissão falhada, mesmo ao navegar para novo formulário.

### Solução

```tsx
// Limpa erros quando o formulário é montado ou quando muda de entidade
useEffect(() => {
  setErrors({});
}, [entityId, metadata.endpoint]);
```

## 📁 Arquivos Modificados

1. ✅ `src/metadata/eventFormMetadata.ts` - **DELETADO** (contra arquitetura)
2. ✅ `src/components/Common/EntityTypeahead.tsx` - Removida lógica `/api/`
3. ✅ `src/components/Common/EntitySelect.tsx` - Removida lógica `/api/`
4. ✅ `src/components/Generic/EntityTable.tsx` - Removida lógica `/api/`
5. ✅ `src/components/Generic/EntityForm.tsx`:
   - Validações separadas por tipo
   - Limpeza de erros no useEffect
6. ✅ `src/types/metadata.ts` - Adicionado campo `format`
7. ✅ `src/utils/metadataConverter.ts` - Passando `format` do backend

## 🎨 Benefícios Finais

### Arquitetura

- ✅ **100% baseada em metadata do backend**
- ✅ Sem duplicação de configuração (frontend vs backend)
- ✅ URLs corretas sem `/api/api`

### Validações

- ✅ Validações apropriadas por tipo de campo
- ✅ Mensagens de erro claras e contextuais
- ✅ UX melhorada (erros não persistem)

### Manutenibilidade

- ✅ Código mais limpo e consistente
- ✅ Menos lógica condicional desnecessária
- ✅ Fácil de entender e dar manutenção

## 📊 URLs Antes vs Depois

| Requisição     | Antes                        | Depois                      |
| -------------- | ---------------------------- | --------------------------- |
| Listar eventos | `GET /api/api/events` ❌     | `GET /api/events` ✅        |
| Criar evento   | `POST /api/api/events` ❌    | `POST /api/events` ✅       |
| Buscar cidades | `GET /api/cities/search` ✅  | `GET /api/cities/search` ✅ |
| Editar evento  | `PUT /api/api/events/123` ❌ | `PUT /api/events/123` ✅    |

## 🎯 Padrão Estabelecido

### Para TODOS os endpoints:

1. **Backend envia metadata** com endpoint SEM `/api/`:

   ```json
   {
     "endpoint": "/events"
   }
   ```

2. **Frontend usa direto** (baseURL já tem `/api`):

   ```tsx
   api.get(metadata.endpoint); // → http://localhost:8080/api/events ✅
   ```

3. **Garantir que começa com `/`**:
   ```tsx
   if (!endpoint.startsWith("/")) {
     endpoint = `/${endpoint}`;
   }
   ```

## ✨ Conclusão

Todas as chamadas à API agora funcionam corretamente:

- ✅ Sem duplicação de `/api`
- ✅ Validações apropriadas por tipo
- ✅ Erros limpos ao navegar
- ✅ 100% baseado em metadata do backend
