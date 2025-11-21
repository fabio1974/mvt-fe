# 🗺️ Correção: Coordenadas e Endereço do Usuário

## 📋 Problema Identificado

Os campos de latitude e longitude do usuário estavam sendo salvos com nomes incorretos (`addressLatitude`, `addressLongitude`) quando na verdade o backend usa `latitude` e `longitude`.

Além disso, esses dados já estão disponíveis no **token JWT** e não precisam necessariamente ser salvos no localStorage (embora mantemos como fallback).

## ✅ Mudanças Implementadas

### 1. **LoginForm.tsx** - Atualização de Tipos e Storage

**Antes:**
```typescript
addressLatitude?: number;
addressLongitude?: number;
```

**Depois:**
```typescript
latitude?: number;
longitude?: number;
address?: string;
```

**Ação:**
- Salva `latitude`, `longitude` e `address` no localStorage após login
- Atualiza interface TypeScript para refletir os nomes corretos

### 2. **auth.ts** - Novas Funções Helpers

Adicionadas funções para extrair dados do token JWT:

```typescript
// Obtém coordenadas do usuário (token ou localStorage como fallback)
export function getUserCoordinates(): { latitude: number; longitude: number } | null

// Obtém endereço completo do usuário (token ou localStorage como fallback)
export function getUserAddress(): string | null
```

**Benefícios:**
- ✅ Dados sempre atualizados do token
- ✅ Fallback para localStorage
- ✅ Código centralizado e reutilizável

### 3. **DeliveryCRUDPage.tsx** - Pré-preenchimento de Origem

**Antes:**
```typescript
const addressLatitude = localStorage.getItem("addressLatitude");
const addressLongitude = localStorage.getItem("addressLongitude");
```

**Depois:**
```typescript
const coordinates = getUserCoordinates();
const userAddress = getUserAddress();
```

**Fluxo Atualizado:**
1. Obtém coordenadas e endereço do token JWT
2. Pré-preenche `originLatitude`, `originLongitude` e `originAddress`
3. Se endereço não estiver disponível, usa geocoding reverso

### 4. **EntityForm.tsx** - useEffect para InitialValues Assíncronos

**Problema:**
O `formData` era inicializado apenas na primeira renderização, mas os `defaultValues` do DeliveryCRUDPage são carregados de forma assíncrona.

**Solução:**
Adicionado `useEffect` que atualiza o formData quando `initialValues` mudarem:

```typescript
useEffect(() => {
  if (!entityId && Object.keys(initialValues).length > 0) {
    // Normaliza e atualiza formData com initialValues
    setFormData((prev) => ({
      ...prev,
      ...normalizedValues,
    }));
  }
}, [initialValues, entityId]);
```

## 🎯 Token JWT - Dados Disponíveis

O token JWT contém os seguintes campos do usuário:

```json
{
  "role": "CLIENT",
  "address": "R. Padre Moacir Melo, 384 - Ubajara, CE, 62350-000, Brazil",
  "gender": "MALE",
  "phone": "85997572919",
  "name": "Padaria1",
  "cpf": "12345678909",
  "dateOfBirth": "2025-10-28",
  "userId": "189c7d79-cb21-40c1-9b7c-006ebaa3289a",
  "authorities": ["ROLE_CLIENT"],
  "email": "padaria1@gmail.com",
  "sub": "padaria1@gmail.com",
  "iat": 1763697283,
  "exp": 1763715283,
  "latitude": -3.8530660151938667,
  "longitude": -40.91764320673219
}
```

## 📍 Fluxo Completo - Criação de Delivery (CLIENT)

1. ✅ Usuário CLIENT clica em "Nova Entrega"
2. ✅ Sistema obtém coordenadas e endereço do token JWT
3. ✅ Campo `client` é pré-preenchido com usuário logado
4. ✅ Campo `originLatitude` é pré-preenchido
5. ✅ Campo `originLongitude` é pré-preenchido
6. ✅ Campo `originAddress` é pré-preenchido (texto completo)
7. ✅ Usuário preenche destino e outros dados
8. ✅ Submete formulário

## 🔧 Campos no Metadata (Backend)

Certifique-se que o metadata de `delivery` contenha:

```json
{
  "fields": [
    { "name": "originAddress", "type": "textarea" },
    { "name": "originLatitude", "type": "number", "visible": true },
    { "name": "originLongitude", "type": "number", "visible": true },
    { "name": "destinationAddress", "type": "textarea" },
    { "name": "destinationLatitude", "type": "number", "visible": true },
    { "name": "destinationLongitude", "type": "number", "visible": true }
  ]
}
```

## 🚀 Próximos Passos

1. ✅ Testar criação de delivery como CLIENT
2. ✅ Verificar se coordenadas estão sendo enviadas no payload
3. ✅ Confirmar que endereço de origem está sendo exibido corretamente
4. ⚠️ **Importante:** Backend deve incluir `latitude`, `longitude` e `address` no token JWT

## 📝 Notas Técnicas

### Por que não enviamos readonly fields?

Campos `readonly` ou `disabled` no HTML **não são enviados** em formulários tradicionais. No nosso caso, usamos JavaScript para construir o payload, então **todos os campos em `formData` são enviados**, independentemente de serem readonly na UI.

### Debugging

Para verificar o token JWT decodificado:

```typescript
import { decodeJWT } from './utils/auth';

const token = localStorage.getItem('authToken');
const decoded = decodeJWT(token);
console.log('Token decodificado:', decoded);
```

### Fallback para localStorage

Mantivemos o salvamento no localStorage como backup, caso:
- Token expire antes de criar a delivery
- Seja necessário acessar offline
- Fallback para ambientes sem token válido

---

**Data:** 21/11/2025
**Status:** ✅ Implementado e testado
