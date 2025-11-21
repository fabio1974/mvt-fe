# 🗺️ Configurar Google Maps API no Render (Produção)

## 🎯 Objetivo

Configurar a variável de ambiente `VITE_GOOGLE_MAPS_API_KEY` no Render para que o Google Maps funcione em produção.

---

## 📋 Passo a Passo

### 1. Acesse o Dashboard do Render

```
https://dashboard.render.com
```

### 2. Selecione o Serviço `mvt-fe`

- No dashboard, clique no serviço **mvt-fe** (frontend)
- Você verá a página de detalhes do serviço

### 3. Acesse as Variáveis de Ambiente

- No menu lateral esquerdo, clique em **"Environment"**
- Ou vá diretamente para: Settings → Environment

### 4. Adicione/Edite a Variável

Localize a variável `VITE_GOOGLE_MAPS_API_KEY` e clique em **"Edit"** ou **"Add Environment Variable"**

**Nome da Variável:**
```
VITE_GOOGLE_MAPS_API_KEY
```

**Valor (sua chave):**
```
AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU
```

### 5. Salve as Alterações

- Clique em **"Save Changes"**
- O Render irá automaticamente **reiniciar o serviço** para aplicar a nova variável

---

## 🔄 Processo de Deploy

### O que acontece após salvar:

1. ✅ Render detecta mudança nas variáveis de ambiente
2. 🔄 Inicia um novo deploy automático
3. 🏗️ Build da aplicação com a nova variável
4. 🚀 Deploy da nova versão
5. ⏱️ **Tempo estimado:** 2-5 minutos

### Acompanhamento:

- Vá em **"Logs"** no menu lateral
- Você verá o progresso do deploy em tempo real

---

## 📸 Screenshots (Referência Visual)

### Passo 1: Dashboard do Render
```
┌─────────────────────────────────────────┐
│  Render Dashboard                       │
├─────────────────────────────────────────┤
│  Services:                              │
│  ┌───────────────────────────────────┐  │
│  │ 📦 mvt-fe (Web Service)          │  │
│  │    Status: ✅ Live                │  │
│  │    [View Service →]               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Passo 2: Menu do Serviço
```
┌─────────────────────────────────────────┐
│  mvt-fe                                 │
├─────────────────────────────────────────┤
│  ◉ Events                               │
│  ⚙️ Settings                            │
│  🌍 Environment    ← CLIQUE AQUI        │
│  📊 Metrics                             │
│  📝 Logs                                │
│  🔧 Shell                               │
└─────────────────────────────────────────┘
```

### Passo 3: Página de Environment Variables
```
┌─────────────────────────────────────────────────────────┐
│  Environment Variables                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ VITE_API_URL                                    │   │
│  │ https://mvt-events-api.onrender.com/api         │   │
│  │ [Edit]                                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ VITE_GOOGLE_MAPS_API_KEY                        │   │
│  │ ****************************************        │   │
│  │ [Edit]  ← CLIQUE AQUI                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Add Environment Variable]                          │
└─────────────────────────────────────────────────────────┘
```

### Passo 4: Editar Variável
```
┌─────────────────────────────────────────────────────────┐
│  Edit Environment Variable                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key:                                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ VITE_GOOGLE_MAPS_API_KEY                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Value:                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Cancel]  [Save Changes] ← CLIQUE AQUI                │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Verificação

### 1. Verificar nos Logs

Após o deploy, nos logs você verá:

```bash
==> Building...
==> Setting environment variables...
    ✓ VITE_API_URL
    ✓ VITE_GOOGLE_MAPS_API_KEY    ← Deve aparecer
    ✓ VITE_ENVIRONMENT
==> Running: npm run build
...
✓ built in 7.49s
==> Deploy successful!
```

### 2. Testar no Frontend

Acesse a aplicação:
```
https://mvt-fe.onrender.com
```

Faça login e vá para uma tela com endereço:
- **Cadastro de Delivery**
- **Cadastro de User**

Verifique se:
- ✅ O mapa aparece
- ✅ Busca de endereços funciona
- ✅ Marcador do mapa move corretamente

### 3. Verificar no Console do Navegador

Abra o console (F12) e execute:

```javascript
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
```

**❌ Não deve mostrar a chave** (por segurança, o Vite não expõe)

Mas o mapa deve funcionar normalmente.

---

## 🔐 Segurança

### ⚠️ Restrições da API Key

Para proteger sua chave Google Maps, configure restrições no Google Cloud Console:

#### 1. Acesse o Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

#### 2. Selecione sua API Key

#### 3. Configure "Application restrictions"

**Opção 1: HTTP referrers (websites)**
```
https://mvt-fe.onrender.com/*
http://localhost:5173/*
http://localhost:3000/*
```

**Opção 2: IP addresses (mais seguro para backend)**
- Não aplicável para frontend

#### 4. Configure "API restrictions"

Restrinja para apenas as APIs necessárias:
- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Places API (se usar)
- ❌ Todas as outras (desabilitar)

---

## 🛠️ Alternativas de Configuração

### Método 1: Via Dashboard (Recomendado)

✅ **Vantagens:**
- Interface visual
- Fácil de editar
- Não precisa commit
- Seguro (não expõe no código)

❌ **Desvantagens:**
- Manual para cada serviço

---

### Método 2: Via Render CLI

```bash
# Instalar Render CLI
npm install -g @render/cli

# Login
render login

# Listar serviços
render services list

# Setar variável
render env:set VITE_GOOGLE_MAPS_API_KEY=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU -s mvt-fe
```

✅ **Vantagens:**
- Automação
- Scriptável
- CI/CD friendly

❌ **Desvantagens:**
- Requer CLI instalado
- Menos visual

---

### Método 3: Via render.yaml (NÃO RECOMENDADO)

❌ **Não faça isso:**

```yaml
envVars:
  - key: VITE_GOOGLE_MAPS_API_KEY
    value: AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU  # ❌ NUNCA!
```

**Por quê não?**
- 🚨 Chave exposta no repositório GitHub
- 🚨 Qualquer pessoa pode ver
- 🚨 Risco de uso indevido
- 🚨 Violação de segurança

---

## 📊 Configuração Atual

### render.yaml (Correto)
```yaml
envVars:
  - key: VITE_GOOGLE_MAPS_API_KEY
    sync: false  # ✅ Não sincroniza do arquivo
```

**Significado:**
- `sync: false` = Render **não** busca o valor do `render.yaml`
- Valor deve ser configurado **manualmente no dashboard**
- ✅ Seguro: chave não fica no código

---

## 🧪 Teste Local vs Produção

### Local (.env)
```bash
# .env (não commitado)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU
```

### Produção (Render Dashboard)
```
Environment Variables → VITE_GOOGLE_MAPS_API_KEY
```

### Build Local com Env de Produção

```bash
# Testar build com env de produção
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU npm run build
```

---

## 🐛 Troubleshooting

### Problema 1: Mapa não carrega

**Sintomas:**
- Tela cinza onde deveria estar o mapa
- Erro no console: "Google Maps API key not found"

**Solução:**
```
1. Verificar se variável está no Render
2. Verificar se o nome está correto: VITE_GOOGLE_MAPS_API_KEY
3. Verificar se o deploy foi feito após adicionar a variável
4. Fazer um "Manual Deploy" se necessário
```

---

### Problema 2: API Key inválida

**Sintomas:**
- Erro: "InvalidKeyMapError"
- Console: "The provided API key is not valid"

**Solução:**
```
1. Verificar se a chave está correta (sem espaços)
2. Verificar se a API está habilitada no Google Cloud
3. Verificar restrições da chave (HTTP referrers)
```

---

### Problema 3: Quota excedida

**Sintomas:**
- Erro: "You have exceeded your request quota"
- Mapa funciona depois para

**Solução:**
```
1. Verificar uso no Google Cloud Console
2. Aumentar quota ou habilitar billing
3. Otimizar número de requisições
```

---

### Problema 4: Variável não está sendo lida

**Sintomas:**
- `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` é `undefined`

**Solução:**
```bash
# 1. Verificar se a variável começa com VITE_
✅ VITE_GOOGLE_MAPS_API_KEY
❌ GOOGLE_MAPS_API_KEY

# 2. Reiniciar dev server local
npm run dev

# 3. No Render, fazer redeploy manual
```

---

## 📝 Checklist de Deploy

- [ ] Chave Google Maps obtida no Google Cloud Console
- [ ] APIs habilitadas (Maps JavaScript API, Geocoding API)
- [ ] Restrições configuradas (HTTP referrers)
- [ ] Variável adicionada no Render Dashboard
- [ ] Nome correto: `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Deploy automático iniciado
- [ ] Logs verificados (sem erros)
- [ ] Aplicação testada (mapa carrega)
- [ ] Console do navegador verificado (sem erros)

---

## 🔗 Links Úteis

### Render
- Dashboard: https://dashboard.render.com
- Serviço mvt-fe: https://dashboard.render.com/web/[seu-service-id]
- Docs: https://render.com/docs/environment-variables

### Google Cloud
- Console: https://console.cloud.google.com
- API Key: https://console.cloud.google.com/apis/credentials
- Billing: https://console.cloud.google.com/billing

### Documentação
- Vite Env Vars: https://vitejs.dev/guide/env-and-mode.html
- Google Maps JS API: https://developers.google.com/maps/documentation/javascript

---

## 🎯 Resumo Rápido

```bash
1. Acesse: https://dashboard.render.com
2. Selecione: mvt-fe
3. Clique: Environment (menu lateral)
4. Edite: VITE_GOOGLE_MAPS_API_KEY
5. Cole: AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU
6. Salve: Save Changes
7. Aguarde: 2-5 minutos (deploy automático)
8. Teste: https://mvt-fe.onrender.com
```

**Pronto! 🎉**

---

**Última atualização:** 21/11/2025  
**Status:** ✅ Configuração documentada  
**Chave atual:** `AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU`
