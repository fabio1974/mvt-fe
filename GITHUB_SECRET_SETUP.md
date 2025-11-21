# 🔐 Como Adicionar Secret no GitHub

## 🎯 Problema Identificado

Os logs mostraram que o **GitHub Actions** está fazendo o build do Docker, mas **não está passando as variáveis de ambiente** como build-args.

**Resultado:** Vite não consegue embutir a chave do Google Maps no bundle.

---

## ✅ Solução Aplicada

### 1. Corrigido o GitHub Actions Workflow

**Arquivo:** `.github/workflows/deploy.yml`

**Mudança:**
```yaml
# ANTES (❌ Sem build-args)
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/fabio1974/mvt-fe:latest

# DEPOIS (✅ Com build-args)
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/fabio1974/mvt-fe:latest
    build-args: |
      VITE_API_URL=https://mvt-events-api.onrender.com/api
      VITE_GOOGLE_MAPS_API_KEY=${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
      VITE_DEBUG_MODE=false
      VITE_ENVIRONMENT=production
```

---

## 🔐 Passo 2: Adicionar Secret no GitHub

**VOCÊ PRECISA FAZER AGORA:**

### Passo a Passo Detalhado:

#### 1. Acesse o Repositório
```
https://github.com/fabio1974/mvt-fe
```

#### 2. Clique em "Settings" (⚙️)
No menu superior do repositório

#### 3. Menu Lateral → "Secrets and variables"
Procure no lado esquerdo, expanda se necessário

#### 4. Clique em "Actions"
Subitem de "Secrets and variables"

#### 5. Clique em "New repository secret"
Botão verde no canto superior direito

#### 6. Preencha o Formulário:

```
┌─────────────────────────────────────────────┐
│ Name *                                      │
│ ┌─────────────────────────────────────────┐│
│ │ VITE_GOOGLE_MAPS_API_KEY                ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Secret *                                    │
│ ┌─────────────────────────────────────────┐│
│ │ AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU││
│ └─────────────────────────────────────────┘│
│                                             │
│        [Add secret]                         │
└─────────────────────────────────────────────┘
```

**IMPORTANTE:**
- **Name:** Exatamente `VITE_GOOGLE_MAPS_API_KEY` (case-sensitive!)
- **Secret:** Sua chave completa: `AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU`

#### 7. Clique em "Add secret"

---

## 📸 Screenshots de Referência

### Tela 1: Settings
```
┌──────────────────────────────────────────┐
│  fabio1974/mvt-fe                        │
├──────────────────────────────────────────┤
│  [Code] [Issues] [Pull requests] ...    │
│                         [Settings] ← AQUI│
└──────────────────────────────────────────┘
```

### Tela 2: Menu Lateral
```
┌─────────────────────────────────┐
│  Settings                       │
├─────────────────────────────────┤
│  General                        │
│  Collaborators                  │
│  Moderation                     │
│  Code security                  │
│  ▼ Secrets and variables  ← AQUI│
│    • Actions            ← DEPOIS│
│    • Codespaces               │
│    • Dependabot               │
│  Branches                       │
└─────────────────────────────────┘
```

### Tela 3: Actions Secrets
```
┌──────────────────────────────────────────┐
│  Actions secrets and variables           │
├──────────────────────────────────────────┤
│  [Secrets] [Variables]                   │
│                                          │
│  Repository secrets                      │
│                                          │
│  Secrets are environment variables that  │
│  are encrypted. Anyone with collabor...  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ GHCR_TOKEN                   [...]  │  │
│  │ RENDER_DEPLOY_HOOK           [...]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│     [New repository secret]  ← CLIQUE    │
└──────────────────────────────────────────┘
```

### Tela 4: Novo Secret
```
┌──────────────────────────────────────────┐
│  Actions secrets / New secret            │
├──────────────────────────────────────────┤
│                                          │
│  Name *                                  │
│  ┌────────────────────────────────────┐  │
│  │ VITE_GOOGLE_MAPS_API_KEY          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Secret *                                │
│  ┌────────────────────────────────────┐  │
│  │ AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q6...│  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Note (optional)                         │
│  ┌────────────────────────────────────┐  │
│  │ Google Maps API Key para frontend  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Add secret]  ← CLIQUE                  │
└──────────────────────────────────────────┘
```

---

## 🚀 Passo 3: Fazer Deploy

**DEPOIS** de adicionar o secret no GitHub:

```bash
git push origin main
```

Isso vai:
1. ✅ Acionar GitHub Actions
2. ✅ Build com as variáveis corretas
3. ✅ Push da imagem para GHCR
4. ✅ Render faz pull da nova imagem
5. ✅ Deploy automático

---

## ⏱️ Timeline Esperada

```
Agora (00:00):     🔐 Adicionar secret no GitHub
↓
+1 minuto:         🚀 git push origin main
↓
+2 minutos:        📦 GitHub Actions fazendo build
↓
+3 minutos:        ✅ GitHub Actions completo
↓
+4 minutos:        🐳 Render fazendo pull da imagem
↓
+5 minutos:        ✅ Deploy completo
↓
+6 minutos:        🧪 Testar mapa em produção
```

**Total:** ~5-6 minutos

---

## 🔍 Como Verificar se Funcionou

### 1. GitHub Actions (Build)

```
https://github.com/fabio1974/mvt-fe/actions
```

Procure por:
```
✓ build-and-push succeeded in 48s
```

Abra os logs e verifique:
```
#14 [builder 6/6] RUN npm run build
...
VITE_GOOGLE_MAPS_API_KEY=AIza... ← Deve aparecer!
...
✓ built in 6.27s
```

### 2. Console do Navegador (Produção)

```
https://zapi10.com.br
```

Abra F12 → Console:
```javascript
✅ Esperado: 🗺️ Google Maps API Key: AIzaSyBpJ-...
❌ Antes:    🗺️ Google Maps API Key: ❌ NÃO ENCONTRADA
```

### 3. Mapa Funciona

- ✅ Mapa carrega (sem erro)
- ✅ Controles de satélite aparecem (canto superior direito)
- ✅ Sem erro "ApiProjectMapError"
- ✅ Sem warning "NoApiKeys"

---

## 🐛 Se Ainda Não Funcionar

### Caso 1: Secret não foi adicionado corretamente

**Verificar:**
```
GitHub → Settings → Secrets and variables → Actions
```

Deve aparecer:
```
VITE_GOOGLE_MAPS_API_KEY  [Update] [Remove]
```

Se não aparecer, adicione novamente.

---

### Caso 2: GitHub Actions ainda com erro

**Logs mostram:**
```
⚠️ SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions
```

**Isso é apenas um WARNING**, não impede o build. Se o valor aparecer nos logs, está funcionando.

---

### Caso 3: Mapa carrega mas com erro

**Erro:** `ApiProjectMapError` (ainda)

**Causa:** Propagação da API do Google (pode demorar 10-30 min)

**Solução:** Aguardar mais um pouco

---

## ✅ Checklist Final

- [ ] Secret `VITE_GOOGLE_MAPS_API_KEY` adicionado no GitHub
- [ ] `git push origin main` executado
- [ ] GitHub Actions completou com sucesso
- [ ] Render fez deploy da nova imagem
- [ ] Console mostra chave: `🗺️ Google Maps API Key: AIza...`
- [ ] Mapa carrega sem erros
- [ ] Controles de satélite aparecem

---

## 📋 Resumo Visual do Fluxo

### ANTES (❌ Não funcionava)

```
GitHub Actions
  ↓
Docker build (SEM variáveis)
  ↓
Vite build (import.meta.env.VITE_GOOGLE_MAPS_API_KEY = undefined)
  ↓
Bundle (SEM chave)
  ↓
Produção (❌ NÃO ENCONTRADA)
```

### DEPOIS (✅ Funciona)

```
GitHub Secrets
  ↓
GitHub Actions (lê secrets)
  ↓
Docker build (--build-arg VITE_GOOGLE_MAPS_API_KEY=...)
  ↓
Vite build (import.meta.env.VITE_GOOGLE_MAPS_API_KEY = "AIza...")
  ↓
Bundle (COM chave embedada)
  ↓
Produção (✅ Chave encontrada, mapa funciona!)
```

---

## 🔐 Segurança

### Por que usar GitHub Secrets?

✅ **Seguro:**
- Não fica visível no código
- Não fica nos logs públicos
- Acesso restrito a colaboradores

❌ **Não seguro (evitar):**
- Colocar chave direto no código
- Colocar no render.yaml commitado
- Expor em logs públicos

### VITE_ é público?

⚠️ **SIM!** Variáveis `VITE_*` são **embedadas no JavaScript** do frontend.

Qualquer pessoa pode ver no código-fonte do bundle.

**Por isso:**
- ✅ OK usar para API keys públicas (com restrições no GCP)
- ❌ NUNCA usar para secrets reais (database passwords, etc)

**Proteção:**
- Google Maps API Key deve ter **restrições de HTTP referrers** no GCP
- Limitar uso apenas aos seus domínios

---

## 🎯 Próximos Passos

1. **AGORA:** Adicionar secret no GitHub
2. **DEPOIS:** `git push origin main`
3. **AGUARDAR:** 5-6 minutos
4. **TESTAR:** Abrir produção e verificar console
5. **COMEMORAR:** 🎉

---

**Status:** 🔧 Correção aplicada, aguardando secret  
**Commit:** `cbd9e93`  
**Ação requerida:** Adicionar `VITE_GOOGLE_MAPS_API_KEY` nos GitHub Secrets  
**URL do secret:** https://github.com/fabio1974/mvt-fe/settings/secrets/actions
