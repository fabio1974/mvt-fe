# 🔍 Debug: Endereço de Origem não Carrega no Formulário de Delivery

## 🎯 Problema

Ao abrir o formulário de "Criar Nova Entrega", o endereço de origem com os dados do cliente não está sendo pré-preenchido.

## 📋 Checklist de Diagnóstico

### 1️⃣ **Verificar Dados do Token/LocalStorage**

Abra o console do navegador (F12) e execute:

```javascript
// Verificar localStorage
console.log("userId:", localStorage.getItem("userId"));
console.log("userName:", localStorage.getItem("userName"));
console.log("latitude:", localStorage.getItem("latitude"));
console.log("longitude:", localStorage.getItem("longitude"));
console.log("userAddress:", localStorage.getItem("userAddress"));

// Verificar token JWT
const token = localStorage.getItem("authToken");
if (token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  const decoded = JSON.parse(jsonPayload);
  console.log("Token decodificado:", decoded);
  console.log("Token tem latitude?", decoded.latitude);
  console.log("Token tem longitude?", decoded.longitude);
  console.log("Token tem address?", decoded.address);
}
```

**✅ Esperado:**
- `latitude` e `longitude` devem existir (números)
- `userAddress` deve existir (string com endereço completo)
- Token JWT deve conter `latitude`, `longitude` e `address`

**❌ Se não existir:**
- Backend ainda não adicionou esses campos ao token
- Fazer login novamente após backend atualizar

---

### 2️⃣ **Verificar Logs do DeliveryCRUDPage**

Ao abrir o formulário de "Criar Nova Entrega", o console deve mostrar:

```
🔍 [DeliveryCRUDPage] Dados do usuário: {
  userRole: "ROLE_CLIENT",
  userId: "189c7d79-...",
  userName: "Padaria1",
  userAddress: "R. Padre Moacir Melo, 384 - ...",
  userLatitude: -3.853066...,
  userLongitude: -40.917643...,
  coordinates: { latitude: -3.853066..., longitude: -40.917643... }
}

🔄 [DeliveryCRUDPage] useEffect executado

✅ [DeliveryCRUDPage] Usuário é CLIENT, preparando defaultValues

📍 [DeliveryCRUDPage] Coordenadas disponíveis: -3.853066..., -40.917643...

📍 [DeliveryCRUDPage] Endereço de origem pré-preenchido: R. Padre Moacir Melo, 384 - ...

🗺️ [DeliveryCRUDPage] Coordenadas pré-preenchidas no values: {
  originLatitude: -3.853066...,
  originLongitude: -40.917643...,
  originAddress: "R. Padre Moacir Melo, 384 - ..."
}

📦 [DeliveryCRUDPage] setDefaultValues sendo chamado com: { client: {...}, originLatitude: ..., originLongitude: ..., originAddress: "..." }
```

**⚠️ Se aparecer:**
- `⚠️ Coordenadas NÃO disponíveis` → Problema no token/localStorage
- `⚠️ Usuário não é CLIENT` → Verificar role do usuário
- `⚠️ Geocoding não retornou endereço` → API do Google Maps

---

### 3️⃣ **Verificar Logs do EntityForm**

Logo após os logs do DeliveryCRUDPage, deve aparecer:

```
🔍 [EntityForm] useEffect initialValues: {
  entityId: undefined,
  initialValuesApplied: false,
  initialValuesKeys: ["client", "originLatitude", "originLongitude", "originAddress"],
  initialValues: { client: "189c7d79-...", originLatitude: -3.853..., ... }
}

✅ [EntityForm] Atualizando formData com initialValues: {
  client: "189c7d79-...",
  originLatitude: -3.853066...,
  originLongitude: -40.917643...,
  originAddress: "R. Padre Moacir Melo, 384 - ..."
}
```

**⚠️ Se não aparecer ou initialValuesKeys estiver vazio:**
- `defaultValues` não está chegando no EntityForm
- Verificar se EntityCRUD está passando corretamente

---

### 4️⃣ **Verificar Nomes dos Campos no Metadata**

Os nomes dos campos devem corresponder **exatamente** aos nomes no metadata do backend:

**DeliveryCRUDPage envia:**
- `originAddress`
- `originLatitude`
- `originLongitude`

**Metadata do backend deve ter:**
```json
{
  "fields": [
    { "name": "originAddress", "type": "textarea" },
    { "name": "originLatitude", "type": "number" },
    { "name": "originLongitude", "type": "number" }
  ]
}
```

**❌ Se os nomes forem diferentes** (ex: `origin_address`, `sourceAddress`, etc.):
- Atualizar `DeliveryCRUDPage.tsx` com os nomes corretos
- OU atualizar metadata do backend

---

## 🔧 Possíveis Causas e Soluções

### ❌ Causa 1: Backend não retorna latitude/longitude no login

**Sintoma:** localStorage não tem `latitude`, `longitude`, `userAddress`

**Solução:** 
- Verificar resposta do `/auth/login` no Network tab
- Backend deve incluir esses campos no response e no token JWT
- Fazer logout e login novamente após backend atualizar

---

### ❌ Causa 2: Nomes dos campos não correspondem ao metadata

**Sintoma:** Logs mostram valores sendo setados, mas campos ficam vazios

**Solução:**
```bash
# Ver metadata de delivery no backend
curl http://localhost:8080/api/metadata/delivery \
  -H "Authorization: Bearer SEU_TOKEN"
```

Verificar nomes exatos dos campos e ajustar em `DeliveryCRUDPage.tsx`:

```typescript
// Exemplo: se o backend usa "sourceAddress" em vez de "originAddress"
values.sourceAddress = userAddress;
values.sourceLatitude = userLatitude;
values.sourceLongitude = userLongitude;
```

---

### ❌ Causa 3: initialValuesApplied já está true

**Sintoma:** `[EntityForm] useEffect initialValues` não executa a parte do `if`

**Solução:**
- Fechar e reabrir o formulário de delivery
- Flag é resetada quando muda de página

---

### ❌ Causa 4: Campos não estão visíveis no metadata

**Sintoma:** Campos estão no formData mas não aparecem no formulário

**Solução:**
```json
// Metadata do backend deve ter visible: true
{
  "name": "originLatitude",
  "type": "number",
  "visible": true,  // ← Importante!
  "readonly": true  // ← Opcional (se quiser readonly)
}
```

---

## 📊 Fluxo Esperado

```
1. Usuário clica em "Criar Nova Entrega"
   ↓
2. DeliveryCRUDPage busca dados do token/localStorage
   ↓
3. Se latitude/longitude disponíveis:
   - Adiciona originLatitude
   - Adiciona originLongitude
   - Adiciona originAddress (do token ou via geocoding)
   ↓
4. Chama setDefaultValues(values)
   ↓
5. EntityCRUD passa defaultValues como initialValues para EntityForm
   ↓
6. EntityForm.useEffect detecta initialValues
   ↓
7. Atualiza formData com os valores
   ↓
8. Campos são renderizados com valores pré-preenchidos
```

---

## 🧪 Teste Rápido

Execute no console após abrir "Criar Nova Entrega":

```javascript
// Ver todos os logs de uma vez
console.log("=== DIAGNÓSTICO COMPLETO ===");
console.log("1. LocalStorage:", {
  userId: localStorage.getItem("userId"),
  latitude: localStorage.getItem("latitude"),
  longitude: localStorage.getItem("longitude"),
  userAddress: localStorage.getItem("userAddress")
});

// Pegar o formulário atual (se React DevTools instalado)
// Procurar por EntityForm nos componentes e verificar props.initialValues
```

---

## 📝 Próximos Passos

1. ✅ Adicione os logs rodando a aplicação
2. ✅ Abra "Criar Nova Entrega"
3. ✅ Copie TODOS os logs do console aqui
4. ✅ Identifique em qual passo o fluxo está falhando
5. ✅ Aplique a solução correspondente

**Status:** 🔍 Aguardando logs do console para diagnóstico preciso

---

**Última atualização:** 21/11/2025
