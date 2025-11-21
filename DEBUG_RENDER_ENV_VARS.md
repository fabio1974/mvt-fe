# 🐛 Como Debugar Variáveis de Ambiente no Render

## 🎯 Objetivo

Verificar se o Render está lendo e passando corretamente a variável `VITE_GOOGLE_MAPS_API_KEY` durante o build.

---

## 📋 Método 1: Logs do Build (Render Dashboard)

### Passo a Passo:

1. **Acesse o Render Dashboard:**
   ```
   https://dashboard.render.com
   ```

2. **Selecione o serviço `mvt-fe`**

3. **Clique em "Events" (menu lateral esquerdo)**

4. **Selecione o último deploy** (o mais recente no topo)

5. **Procure por estas seções nos logs:**

   ```bash
   ==> Building Docker image...
   ==> Setting build arguments:
       VITE_API_URL=https://mvt-events-api.onrender.com/api
       VITE_GOOGLE_MAPS_API_KEY=AIzaSy...  ← Deve aparecer aqui!
       VITE_DEBUG_MODE=false
       VITE_ENVIRONMENT=production
   ```

6. **Verifique também:**
   ```bash
   ==> Running: npm run build
   
   > mvt-fe@1.0.0 build
   > tsc -b && vite build
   
   vite v7.1.5 building for production...
   
   # Se aparecer erros aqui relacionados a variáveis, é problema
   ```

---

## 📋 Método 2: Console do Navegador (Produção)

### Implementamos um Debug Log:

No código, adicionamos:
```typescript
React.useEffect(() => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log("🗺️ Google Maps API Key:", 
    apiKey ? `${apiKey.substring(0, 10)}...` : "❌ NÃO ENCONTRADA"
  );
}, []);
```

### Como Verificar:

1. **Acesse a aplicação em produção:**
   ```
   https://mvt-fe.onrender.com
   ```

2. **Abra o Console do Navegador (F12)**

3. **Vá em "Console" tab**

4. **Faça login e acesse uma página com mapa** (ex: Cadastrar Delivery)

5. **Procure pela mensagem:**

   **✅ Se aparecer:**
   ```javascript
   🗺️ Google Maps API Key: AIzaSyBpJ-...
   ```
   ↑ Chave está sendo lida corretamente!

   **❌ Se aparecer:**
   ```javascript
   🗺️ Google Maps API Key: ❌ NÃO ENCONTRADA
   ```
   ↑ Chave NÃO está sendo lida (problema no build)

---

## 📋 Método 3: Verificar Bundle (Avançado)

### O que fazer:

1. **Acesse:**
   ```
   https://mvt-fe.onrender.com
   ```

2. **Abra DevTools (F12)**

3. **Vá em "Network" tab**

4. **Recarregue a página (Ctrl+R)**

5. **Procure por `index-*.js` (bundle principal)**

6. **Clique com botão direito → "Open in new tab"**

7. **Procure no código (Ctrl+F):**
   ```
   AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU
   ```

   **✅ Se encontrar:** Chave está embedada no bundle (correto!)
   
   **❌ Se NÃO encontrar:** Chave não foi passada durante build

---

## 📋 Método 4: Shell do Render (Runtime)

### Como Acessar:

1. **Render Dashboard → mvt-fe**

2. **Clique em "Shell" (menu lateral)**

3. **No terminal, digite:**
   ```bash
   echo $VITE_GOOGLE_MAPS_API_KEY
   ```

**⚠️ IMPORTANTE:**
- Isso mostra a variável **no runtime** (depois do build)
- **NÃO** garante que foi passada durante o build
- Útil apenas para confirmar que a variável existe no ambiente

---

## 🔍 Sintomas e Diagnósticos

### Sintoma 1: Mapa cinza com erro "ApiProjectMapError"

**Possíveis causas:**
1. ❌ API não habilitada no Google Cloud
2. ❌ Chave não foi passada no build
3. ⏱️ Propagação ainda em andamento (10-30 min)

**Como verificar:**
- Método 2 (Console do navegador)
- Se aparecer "NÃO ENCONTRADA" → Problema no build

---

### Sintoma 2: Warning "NoApiKeys"

**Causa definitiva:**
- ❌ Chave não está sendo lida pelo componente

**Como verificar:**
- Método 2 (Console do navegador)
- Método 3 (Verificar bundle)

---

### Sintoma 3: Build falha com erro

**Exemplo de erro:**
```
Error: Environment variable VITE_GOOGLE_MAPS_API_KEY is not defined
```

**Causa:**
- ❌ Variável não está no render.yaml ou Dashboard

**Como resolver:**
- Verificar render.yaml tem `value:` definido
- Verificar Dashboard → Environment tem a chave

---

## ✅ Checklist de Verificação

- [ ] **render.yaml:** Variável definida com `value: AIza...`
- [ ] **Dashboard Environment:** Variável configurada
- [ ] **Logs do Build:** Variável aparece em "Setting build arguments"
- [ ] **Console do navegador:** Aparece "🗺️ Google Maps API Key: AIza..."
- [ ] **Sem erros no console:** Não aparece "ApiProjectMapError" ou "NoApiKeys"
- [ ] **Google Cloud:** APIs habilitadas (Maps JavaScript API + Geocoding API)
- [ ] **Google Cloud:** Billing ativo

---

## 🎯 Exemplo de Logs Corretos

### Build Logs (Render):

```bash
==> Cloning from GitHub
==> Checking out commit 7a1c402

==> Building Docker image...
==> Setting build arguments:
    ARG VITE_API_URL=https://mvt-events-api.onrender.com/api
    ARG VITE_GOOGLE_MAPS_API_KEY=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU  ✅
    ARG VITE_DEBUG_MODE=false
    ARG VITE_ENVIRONMENT=production

==> Running: npm run build
✓ 2628 modules transformed.
dist/index.html                    0.87 kB
dist/assets/index-*.css           80.18 kB
dist/assets/index-*.js           878.22 kB
✓ built in 7.49s

==> Build successful!
==> Deploying...
==> Deploy live at: https://mvt-fe.onrender.com
```

### Console do Navegador (Produção):

```javascript
🗺️ Google Maps API Key: AIzaSyBpJ-...  ✅
📍 Localização do usuário obtida: {lat: -3.7327, lng: -38.5267}
```

### Sem Erros:

```
✅ Sem "ApiProjectMapError"
✅ Sem "NoApiKeys"
✅ Mapa carrega normalmente
```

---

## 🐛 Troubleshooting por Erro

### Erro: "NÃO ENCONTRADA" no console

**Problema:** Chave não foi embedada no build

**Solução:**
```yaml
# render.yaml - DEVE ter value, não sync: false
- key: VITE_GOOGLE_MAPS_API_KEY
  value: AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU  ← IMPORTANTE!
```

**Após corrigir:**
1. Commit e push
2. Aguarde novo build (3-5 min)
3. Verifique novamente

---

### Erro: Chave aparece mas mapa não carrega

**Problema:** API não habilitada no Google Cloud

**Solução:**
1. https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
2. Click "Enable"
3. Aguardar 10-15 minutos

---

### Erro: Tudo correto mas ainda não funciona

**Problema:** Propagação da API

**Solução:**
- ⏱️ Aguarde 10-30 minutos após habilitar API
- ☕ Pegue um café
- 🔄 Teste novamente

---

## 💡 Dicas Importantes

### 1. Variáveis VITE_ são PUBLIC

```typescript
// ⚠️ ATENÇÃO: Variáveis com prefixo VITE_ são PÚBLICAS!
// Elas são embedadas no JavaScript do frontend
// Qualquer pessoa pode ver no código-fonte

// ✅ OK para API keys públicas:
VITE_GOOGLE_MAPS_API_KEY  // Tem restrições no Google Cloud
VITE_STRIPE_PUBLIC_KEY    // Tem prefixo "pk_" (pública)

// ❌ NUNCA coloque secrets:
VITE_DATABASE_PASSWORD    // ❌ NÃO FAÇA ISSO!
VITE_STRIPE_SECRET_KEY    // ❌ NÃO FAÇA ISSO!
```

### 2. Build vs Runtime

```
BUILD TIME:
- npm run build
- Vite processa variáveis VITE_*
- Embeda valores no JavaScript
- Gera bundle final

RUNTIME:
- Nginx serve arquivos estáticos
- Variáveis JÁ ESTÃO no JavaScript
- Não tem acesso a ENV vars do servidor
```

**Por isso:** Variáveis precisam estar disponíveis **durante o build**!

### 3. Render + Docker + Vite

```
Render (Dashboard) → render.yaml → Dockerfile ARG → ENV → Vite build → Bundle
    ↓                    ↓              ↓            ↓         ↓          ↓
  Config           sync:false     --build-arg    ENV VAR   embeda    index.js
                   ou value:
```

**Fluxo correto:**
1. Definir no render.yaml com `value:`
2. Render passa como `--build-arg` para Docker
3. Dockerfile recebe como `ARG`
4. Dockerfile seta como `ENV`
5. npm run build acessa via `import.meta.env.VITE_*`
6. Vite embeda no bundle final

---

## 🔗 Links Úteis

### Render Docs:
- **Environment Variables:** https://render.com/docs/environment-variables
- **Docker Builds:** https://render.com/docs/docker
- **Build & Deploy:** https://render.com/docs/deploys

### Vite Docs:
- **Env Variables:** https://vitejs.dev/guide/env-and-mode.html

### Google Cloud:
- **API Dashboard:** https://console.cloud.google.com/apis/dashboard
- **Credentials:** https://console.cloud.google.com/apis/credentials

---

## ✅ Resumo Rápido

**Para debugar:**

1. **Console do navegador (F12):**
   - Procure: `🗺️ Google Maps API Key: AIza...`
   
2. **Logs do Render:**
   - Deploy → Events → Último build
   - Procure: `Setting build arguments`
   
3. **Verificar bundle:**
   - Network tab → index-*.js
   - Ctrl+F: `AIzaSyBpJ`

**Se chave NÃO aparecer:**
- Problema no build
- Corrigir render.yaml com `value:`

**Se chave aparecer mas mapa não funciona:**
- Problema no Google Cloud
- Habilitar APIs
- Aguardar propagação

---

**Status:** 🐛 Debug implementado  
**Commit:** `7a1c402`  
**Console Log:** `🗺️ Google Maps API Key: ...`  
**Próximo passo:** Verificar logs do próximo deploy
