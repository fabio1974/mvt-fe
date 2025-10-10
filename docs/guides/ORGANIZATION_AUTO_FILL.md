# 🏢 Regra de Auto-preenchimento de Organization

## 📋 Visão Geral

Sistema automático de preenchimento do `organizationId` para garantir **isolamento multi-tenant** e **melhor UX**.

> **Regra Geral:** Quando um usuário cria uma entidade que possui relação com `Organization`, o sistema automaticamente preenche o campo com o `organizationId` do token JWT do usuário logado.

## 🎯 Como Funciona

### 1. **Extração do Token**

```typescript
// Hook: useOrganization()
const { organizationId } = useOrganization();
// organizationId = 123 (extraído do JWT)
```

O hook decodifica o token JWT armazenado no `localStorage` e extrai o `organizationId`.

### 2. **Detecção Automática de Campos**

O sistema detecta campos relacionados com Organization automaticamente:

```typescript
// Detecta por nome do campo
field.name === "organizationId";
field.name === "organization";
```

### 3. **Auto-preenchimento**

**No modo CREATE (novo registro):**

- ✅ Preenche automaticamente o campo com `organizationId` do token
- ✅ Oculta o campo do formulário (melhor UX)
- ✅ Logs no console para debug
- ✅ Garante o valor antes de enviar ao backend

**No modo EDIT/VIEW (edição/visualização):**

- ✅ Mostra o campo normalmente
- ✅ Campo fica read-only no modo edit
- ✅ Usuário pode ver qual organização

## 💡 Exemplos Práticos

### Exemplo 1: Criar Evento

```typescript
// Usuário logado: organizationId = 123

// Formulário de criação de evento:
<EntityForm
  metadata={eventMetadata}
  mode="create"
/>

// Console output:
// 🏢 Auto-preenchendo organizationId com organizationId: 123
// 🔒 Ocultando campo organizationId (auto-preenchido)

// Dados enviados ao backend:
{
  name: "Corrida da Serra",
  eventDate: "2024-12-01",
  organizationId: 123  // ✅ Automaticamente preenchido!
}
```

### Exemplo 2: Criar Categoria de Evento

```typescript
// Metadata da categoria:
{
  "sections": [
    {
      "fields": [
        {
          "name": "name",
          "label": "Nome da Categoria",
          "type": "text"
        },
        {
          "name": "organizationId",  // ✅ Será auto-preenchido
          "label": "Organização",
          "type": "number"
        }
      ]
    }
  ]
}

// Ao criar:
// - organizationId = 123 (automático)
// - Campo não aparece no formulário
// - Usuário só preenche o nome
```

### Exemplo 3: Editar Evento

```typescript
// Modo edição
<EntityForm metadata={eventMetadata} entityId={456} mode="edit" />

// Comportamento:
// - Campo organizationId APARECE (mas read-only)
// - Usuário vê: "Organização: Corridas da Serra Ltda"
// - Não pode alterar a organização
```

## 🔒 Segurança

### ⚠️ IMPORTANTE: Validação no Backend

**O backend SEMPRE deve validar e sobrescrever o `organizationId`:**

```java
@PostMapping
public Event create(@RequestBody Event event, @AuthenticationPrincipal User user) {
    // ✅ Validação obrigatória
    if (event.getOrganizationId() != null &&
        event.getOrganizationId() != user.getOrganizationId()) {
        throw new ForbiddenException(
            "Não é possível criar evento para outra organização"
        );
    }

    // ✅ SEMPRE sobrescreve com o valor do token (nunca confia no frontend)
    event.setOrganizationId(user.getOrganizationId());

    return eventService.save(event);
}
```

### Por que isso é crítico?

```
❌ SEM validação backend:
   - Hacker altera request no DevTools
   - Muda organizationId: 123 → 456
   - Cria dados na organização de outra pessoa
   - FALHA DE SEGURANÇA!

✅ COM validação backend:
   - Hacker altera request
   - Backend detecta inconsistência
   - Retorna 403 Forbidden
   - Dados ficam isolados ✅
```

## 📊 Fluxo Completo

```
1. Usuário faz login
   ↓
2. Backend retorna JWT com organizationId
   {
     "sub": "user@email.com",
     "organizationId": 123,
     "role": "ORGANIZER"
   }
   ↓
3. Frontend armazena token no localStorage
   ↓
4. Usuário acessa "Criar Evento"
   ↓
5. EntityForm é renderizado
   ↓
6. useOrganization() extrai organizationId = 123 do token
   ↓
7. EntityForm detecta campo "organizationId"
   ↓
8. Auto-preenche formData.organizationId = 123
   ↓
9. Campo organizationId é ocultado do form
   ↓
10. Usuário preenche apenas: nome, data, etc.
    ↓
11. Usuário clica em "Salvar"
    ↓
12. handleSubmit garante organizationId = 123
    ↓
13. POST /api/events { name: "...", organizationId: 123 }
    ↓
14. Backend valida: req.organizationId === user.organizationId ✅
    ↓
15. Evento criado com isolamento garantido!
```

## 🎨 Interface do Usuário

### Modo CREATE (criar)

```
┌─────────────────────────────────────┐
│ Criar Novo Evento                   │
├─────────────────────────────────────┤
│                                     │
│ Nome do Evento: [_______________]  │
│                                     │
│ Data: [__________]                 │
│                                     │
│ Descrição: [________________]      │
│                                     │
│ (organizationId oculto = 123)      │
│                                     │
│ [Cancelar]          [Salvar] ✅    │
└─────────────────────────────────────┘
```

### Modo EDIT (editar)

```
┌─────────────────────────────────────┐
│ Editar Evento                       │
├─────────────────────────────────────┤
│                                     │
│ Nome do Evento: [Corrida da Serra] │
│                                     │
│ Data: [2024-12-01]                 │
│                                     │
│ Organização: [Corridas Serra Ltda]│
│              (read-only, desabilitado) │
│                                     │
│ [Cancelar]          [Salvar] ✅    │
└─────────────────────────────────────┘
```

## 🛠️ Arquivos Modificados

### 1. `/src/hooks/useOrganization.ts` (NOVO)

```typescript
export const useOrganization = () => {
  const getOrganizationId = (): number | null => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    try {
      // Decodifica JWT manualmente
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const decoded = JSON.parse(jsonPayload);
      return decoded.organizationId || null;
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  };

  return {
    organizationId: getOrganizationId(),
  };
};
```

### 2. `/src/components/Generic/EntityForm.tsx` (MODIFICADO)

**Adições:**

1. Import do hook:

```typescript
import { useOrganization } from "../../hooks/useOrganization";
```

2. Uso do hook:

```typescript
const { organizationId } = useOrganization();
```

3. Auto-preenchimento na inicialização:

```typescript
// No useState inicial
if (!entityId && organizationId) {
  if (field.name === "organizationId" || field.name === "organization") {
    console.log(`🏢 Auto-preenchendo ${field.name}`);
    defaultValues[field.name] = organizationId;
  }
}
```

4. Garantia no submit:

```typescript
// No handleSubmit
if (!entityId && organizationId) {
  if (!finalData[field.name]) {
    console.log(`🏢 Garantindo ${field.name} antes de salvar`);
    finalData[field.name] = organizationId;
  }
}
```

5. Ocultação do campo:

```typescript
// No renderField
if (
  !entityId &&
  organizationId &&
  (field.name === "organizationId" || field.name === "organization")
) {
  console.log(`🔒 Ocultando campo ${field.name}`);
  return null;
}
```

## 🧪 Como Testar

### Teste 1: Auto-preenchimento

1. Faça login como organizador
2. Abra DevTools Console
3. Vá em "Criar Evento"
4. Verifique logs:
   ```
   🏢 Auto-preenchendo organizationId com organizationId: 123
   🔒 Ocultando campo organizationId (auto-preenchido)
   ```
5. Campo organizationId NÃO aparece no formulário ✅
6. Preencha os demais campos
7. Clique em "Salvar"
8. Verifique log:
   ```
   🏢 Garantindo organizationId com organizationId: 123 antes de salvar
   ```
9. Abra Network tab e veja payload:
   ```json
   {
     "name": "Corrida Teste",
     "organizationId": 123 // ✅
   }
   ```

### Teste 2: Isolamento entre organizações

1. Login como Org A (organizationId: 1)
2. Crie um evento
3. Logout
4. Login como Org B (organizationId: 2)
5. Liste eventos
6. ✅ Evento da Org A NÃO deve aparecer
7. Crie outro evento
8. ✅ Deve ter organizationId: 2

### Teste 3: Tentativa de hack

1. Login como Org A (organizationId: 1)
2. Vá em "Criar Evento"
3. Abra DevTools → Network
4. Preencha formulário
5. Antes de enviar, pause na aba Network
6. Clique em "Salvar"
7. No DevTools, edite o request payload:
   ```json
   {
     "name": "Evento Teste",
     "organizationId": 999 // ❌ Tentando criar para outra org
   }
   ```
8. Continue o request
9. ✅ Backend deve retornar **403 Forbidden**

## 📊 Entidades Afetadas

Todas as entidades com relação com Organization:

- ✅ **Event** - Eventos pertencem a uma organização
- ✅ **EventCategory** - Categorias pertencem a uma organização
- ✅ **Registration** - Inscrições são de eventos de uma organização
- ✅ **Payment** - Pagamentos são de inscrições de uma organização

## 🎓 Benefícios

### Para Usuários

- ✨ **Melhor UX**: Não precisa selecionar organização (óbvio que é a dele)
- ⚡ **Mais rápido**: Um campo a menos para preencher
- 🛡️ **Seguro**: Impossível criar dados para organização errada

### Para Desenvolvedores

- 🧹 **Código limpo**: Regra única aplicada em todo sistema
- 🔧 **Manutenível**: Mudança em um lugar afeta todas as entidades
- 🐛 **Menos bugs**: Impossível esquecer de preencher organizationId

### Para o Negócio

- 🔒 **Multi-tenant seguro**: Isolamento garantido entre organizações
- 📈 **Escalável**: Pronto para adicionar novas entidades
- ✅ **Confiável**: Validação dupla (frontend + backend)

## ⚠️ Cuidados

1. **JWT deve ter organizationId**

   - Backend deve incluir `organizationId` no token
   - Formato: `{ "sub": "email", "organizationId": 123 }`

2. **Backend SEMPRE valida**

   - Nunca confiar apenas no frontend
   - Sempre sobrescrever com valor do token

3. **Campos detectados**

   - Apenas `organizationId` e `organization`
   - Se usar outro nome, adicionar no código

4. **Multi-org users**
   - Se usuário pertence a várias orgs
   - Precisa trocar de contexto (logout/login)
   - Ou implementar seletor de organização

## 🔄 Próximos Passos

- [ ] Adicionar testes automatizados
- [ ] Documentar no Swagger do backend
- [ ] Criar auditoria de tentativas de acesso cross-org
- [ ] Implementar seletor de organização para multi-org users

---

**Implementado em:** Outubro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Produção
