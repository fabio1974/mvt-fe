# 🔧 Google Maps - Troubleshooting "Can't load correctly"

## 🚨 Erro Atual

```
This page can't load Google Maps correctly.
Do you own this website?
```

**Screenshot:** Mapa cinza com erro modal

---

## ✅ Status da Configuração

- ✅ Chave configurada no Render: `VITE_GOOGLE_MAPS_API_KEY`
- ✅ Valor: `AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU`
- ✅ Sem restrições no Google Cloud Console
- ❌ Mapa não carrega (erro)

---

## 🔍 Possíveis Causas

### 1. APIs não habilitadas ⚠️ (MAIS COMUM)

**Solução:**

Acesse: https://console.cloud.google.com/apis/library

Busque e **habilite** as seguintes APIs:

#### Maps JavaScript API
```
https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
```
- Clique em **"Enable"** (Ativar)

#### Geocoding API
```
https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
```
- Clique em **"Enable"** (Ativar)

#### Places API (Opcional)
```
https://console.cloud.google.com/apis/library/places-backend.googleapis.com
```
- Clique em **"Enable"** (Ativar)

---

### 2. Billing não configurado 💳 (MUITO COMUM)

**Google Maps requer cartão de crédito mesmo no free tier!**

**Solução:**

Acesse: https://console.cloud.google.com/billing

1. Clique em **"Link a billing account"**
2. Adicione cartão de crédito
3. Não se preocupe: **$200 de crédito grátis/mês** (mais que suficiente para testes)

**Free Tier:**
- Primeiros **$200/mês** grátis
- ~28.000 map loads por mês grátis
- Só cobra se ultrapassar

---

### 3. Projeto GCP errado ⚠️

**Sintoma:** Chave funciona no console mas não na aplicação

**Solução:**

1. Acesse: https://console.cloud.google.com
2. No topo, verifique o **projeto selecionado**
3. Certifique-se de que é o projeto correto
4. A chave deve estar **no mesmo projeto** onde as APIs estão habilitadas

---

### 4. Chave expirada ou inválida 🔑

**Solução:**

Crie uma **nova chave**:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em **"+ CREATE CREDENTIALS"**
3. Selecione **"API key"**
4. Copie a nova chave
5. Atualize no Render

---

## 🎯 Checklist Completo

Verifique TODOS os itens:

- [ ] **Billing habilitado** (cartão de crédito cadastrado)
- [ ] **Maps JavaScript API** habilitada
- [ ] **Geocoding API** habilitada
- [ ] **Projeto correto** selecionado no GCP
- [ ] **Chave válida** e não expirada
- [ ] **Sem restrições** (ou restrições corretas)
- [ ] **Variável no Render** configurada
- [ ] **Deploy feito** após configurar variável

---

## 🧪 Como Testar

### Teste 1: Chave Diretamente no HTML

Crie um arquivo `test-maps.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Google Maps</title>
    <style>
        #map { height: 500px; width: 100%; }
    </style>
</head>
<body>
    <h1>Google Maps Test</h1>
    <div id="map"></div>
    
    <script>
        function initMap() {
            const map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: -3.7327, lng: -38.5270 },
                zoom: 13,
            });
        }
        
        window.initMap = initMap;
    </script>
    
    <!-- Substitua YOUR_API_KEY pela sua chave -->
    <script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU&callback=initMap"
        async
        defer
    ></script>
</body>
</html>
```

**Teste:**
1. Abra o arquivo no navegador
2. Se funcionar: problema está no frontend
3. Se não funcionar: problema está na chave/GCP

---

### Teste 2: Verificar Erro no Console

Abra o console do navegador (F12) e veja o erro exato:

#### Erro: "ApiNotActivatedMapError"
```
✅ Solução: Habilitar Maps JavaScript API
```

#### Erro: "ApiTargetBlockedMapError"
```
✅ Solução: Habilitar billing
```

#### Erro: "RefererNotAllowedMapError"
```
✅ Solução: Adicionar https://mvt-fe.onrender.com/* nas restrições
```

#### Erro: "InvalidKeyMapError"
```
✅ Solução: Chave inválida, gerar nova
```

---

### Teste 3: cURL Test

Teste a API diretamente:

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Fortaleza&key=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU"
```

**Resposta esperada:**
```json
{
  "results": [...],
  "status": "OK"
}
```

**Se retornar erro:**
```json
{
  "error_message": "...",
  "status": "REQUEST_DENIED"
}
```
↑ Isso indica problema com a chave ou APIs não habilitadas

---

## 🔄 Solução Passo a Passo

### Passo 1: Habilitar Billing

```
1. https://console.cloud.google.com/billing
2. Link a billing account
3. Adicionar cartão de crédito
4. Confirmar
```

### Passo 2: Habilitar APIs

```
1. https://console.cloud.google.com/apis/library
2. Buscar "Maps JavaScript API" → Enable
3. Buscar "Geocoding API" → Enable
4. Buscar "Places API" → Enable (opcional)
```

### Passo 3: Verificar Chave

```
1. https://console.cloud.google.com/apis/credentials
2. Localizar chave: AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU
3. Clicar na chave
4. Verificar se está "Enabled"
5. Verificar restrições (deve estar "None" ou com referrers corretos)
```

### Passo 4: Testar Localmente

```bash
# No seu .env local
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU

# Rodar dev server
npm run dev

# Testar no navegador
http://localhost:5173
```

### Passo 5: Deploy no Render

```
1. Render Dashboard → mvt-fe
2. Environment → VITE_GOOGLE_MAPS_API_KEY
3. Verificar valor (deve ser a mesma chave)
4. Manual Deploy (se necessário)
```

---

## 🆕 Criar Nova Chave (Se Necessário)

### Motivos para criar nova chave:
- Chave atual não funciona mesmo após habilitar tudo
- Suspeita de chave comprometida
- Quer separar chaves (dev/prod)

### Como criar:

```
1. https://console.cloud.google.com/apis/credentials
2. Clique em "+ CREATE CREDENTIALS"
3. Selecione "API key"
4. Chave criada: AIzaSy...
5. Clique no ícone de editar (✏️)
6. Renomeie: "MVT Frontend - Production"
7. Application restrictions:
   - Selecione "HTTP referrers"
   - Adicione: https://mvt-fe.onrender.com/*
   - Adicione: http://localhost:5173/* (para dev)
8. API restrictions:
   - Selecione "Restrict key"
   - Marque: Maps JavaScript API
   - Marque: Geocoding API
   - Marque: Places API
9. Save
10. Copie a nova chave
11. Atualize no Render
```

---

## 📊 Comparação: Restrições

### ✅ SEM Restrições (Atual)
```
Application restrictions: None
API restrictions: None
```

**Vantagens:**
- Funciona em qualquer domínio
- Fácil para desenvolvimento

**Desvantagens:**
- ⚠️ Qualquer pessoa pode usar sua chave
- ⚠️ Risco de uso indevido
- ⚠️ Pode gerar custos inesperados

---

### ✅ COM Restrições (Recomendado)
```
Application restrictions: HTTP referrers
  - https://mvt-fe.onrender.com/*
  - http://localhost:5173/*

API restrictions: 
  - Maps JavaScript API
  - Geocoding API
  - Places API
```

**Vantagens:**
- 🔒 Seguro (só funciona nos seus domínios)
- 🔒 Limita APIs usadas
- 🔒 Protege contra uso indevido

**Desvantagens:**
- Precisa adicionar novos domínios manualmente
- Mais configuração

---

## 🐛 Erros Comuns e Soluções

### Erro 1: "For development purposes only"

**Watermark no mapa com mensagem de desenvolvimento**

**Causa:** Billing não habilitado

**Solução:**
```
1. Habilitar billing no GCP
2. Adicionar cartão de crédito
3. Aguardar alguns minutos (pode demorar até 15min)
```

---

### Erro 2: Mapa cinza vazio

**Causa:** Chave inválida ou APIs não habilitadas

**Solução:**
```
1. Verificar console do navegador (F12)
2. Ler mensagem de erro específica
3. Habilitar APIs necessárias
4. Verificar se chave está correta
```

---

### Erro 3: "Google is not defined"

**Causa:** Script do Google Maps não carregou

**Solução:**
```javascript
// Verificar se o script está sendo carregado:
useJsApiLoader({
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  libraries: ["places", "geometry"],
});

// Verificar no Network tab (F12) se a requisição foi feita:
// https://maps.googleapis.com/maps/api/js?...
```

---

### Erro 4: Funciona local mas não em produção

**Causas possíveis:**
1. Variável não configurada no Render
2. Restrições de HTTP referrer muito restritivas
3. Deploy não foi feito após configurar variável

**Solução:**
```
1. Verificar Render Environment Variables
2. Adicionar https://mvt-fe.onrender.com/* nas restrições
3. Fazer manual deploy no Render
4. Limpar cache do navegador
```

---

## 🔗 Links Importantes

### Google Cloud Console
- **Dashboard:** https://console.cloud.google.com
- **API Library:** https://console.cloud.google.com/apis/library
- **Credentials:** https://console.cloud.google.com/apis/credentials
- **Billing:** https://console.cloud.google.com/billing
- **API Usage:** https://console.cloud.google.com/apis/dashboard

### Documentação
- **Maps JavaScript API:** https://developers.google.com/maps/documentation/javascript
- **Geocoding API:** https://developers.google.com/maps/documentation/geocoding
- **API Key Best Practices:** https://developers.google.com/maps/api-security-best-practices

---

## ✅ Ação Imediata

**Faça AGORA:**

1. **Habilitar Billing:**
   - https://console.cloud.google.com/billing
   - Link billing account
   - Adicionar cartão

2. **Habilitar APIs:**
   - https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
   - Click "Enable"
   - https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
   - Click "Enable"

3. **Aguardar 5-10 minutos**

4. **Testar novamente:**
   - https://mvt-fe.onrender.com
   - Fazer deploy manual se necessário

---

**99% dos erros "can't load Google Maps correctly" são resolvidos habilitando billing e as APIs!**

---

**Status:** 🔧 Troubleshooting em andamento  
**Última atualização:** 21/11/2025  
**Chave atual:** `AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU`
