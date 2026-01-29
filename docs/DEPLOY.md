# 🚀 Guia de Deploy - MVT Events Frontend

Este guia detalha o processo de deploy do frontend MVT Events para produção.

## 📋 Pré-requisitos

- ✅ Node.js 20.19+ ou 22.12+ instalado
- ✅ Build do projeto funcionando (`npm run build`)
- ✅ Backend já deployado em: https://mvt-events-api.onrender.com
- ✅ Conta no [Render.com](https://render.com) (ou plataforma similar)
- ✅ Chaves de API do Stripe e Google Maps

## 🔐 Segurança - Variáveis de Ambiente

### ⚠️ IMPORTANTE: Antes de fazer commit

O arquivo `.env` contém **chaves sensíveis** e já foi adicionado ao `.gitignore`. Se você acidentalmente commitou esse arquivo:

```bash
# Remover do histórico do Git
git rm --cached .env
git commit -m "Remove .env from repository"

# Regenerar suas chaves:
# 1. Stripe: https://dashboard.stripe.com/apikeys
# 2. Google Maps: https://console.cloud.google.com/apis/credentials
```

### Configurar Variáveis de Ambiente

Use o arquivo `.env.example` como template:

```bash
cp .env.example .env
# Edite .env com suas chaves reais
```

## 🐳 Deploy com Docker (Recomendado)

### Opção 1: Docker + Render.com

1. **Faça push para o GitHub**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Configure no Render.com**
   - Acesse: https://dashboard.render.com/
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub: `fabio1974/mvt-fe`
   - Use as configurações do `render.yaml`

3. **Configure as Variáveis de Ambiente no Render**
   
   No Dashboard do Render, adicione:
   
   ```
   VITE_API_URL=https://mvt-events-api.onrender.com/api
   VITE_STRIPE_PUBLIC_KEY=pk_test_seu_token_aqui
   VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
   VITE_DEBUG_MODE=false
   VITE_ENVIRONMENT=production
   ```

4. **Deploy Automático**
   - O Render detecta o `Dockerfile` automaticamente
   - Cada push na branch `main` gera um novo deploy
   - GitHub Actions também pode ser usado (veja `.github/workflows/deploy.yml`)

### Opção 2: Build Local + Docker

```bash
# Build da imagem
docker build -t mvt-fe:latest .

# Testar localmente
docker run -p 8080:80 mvt-fe:latest

# Acesse: http://localhost:8080
```

## 🌐 Deploy em Outras Plataformas

### Netlify

```bash
# Instalar CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

Configurar variáveis de ambiente no Netlify:
```
Site Settings → Build & Deploy → Environment → Environment Variables
```

### Vercel

```bash
# Instalar CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configurar variáveis no dashboard da Vercel.

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync com S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidar CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔧 Configuração do Backend

Certifique-se de que o backend aceita requisições do seu domínio frontend:

```java
// CorsConfig.java no backend
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",
        "http://localhost:3000",
        "https://mvt-fe.onrender.com", // Adicione seu domínio aqui
        "https://seu-dominio-custom.com"
    ));
    // ...
}
```

## 📊 Monitoramento

### Health Checks

- **Frontend**: `https://mvt-fe.onrender.com/`
- **Backend**: `https://mvt-events-api.onrender.com/actuator/health`

### Logs no Render

```bash
# Via CLI
render logs -s mvt-fe

# Via Dashboard
https://dashboard.render.com/web/[seu-service-id]/logs
```

## 🔄 Processo de Deploy (GitHub Actions)

O arquivo `.github/workflows/deploy.yml` automatiza:

1. ✅ Build da imagem Docker
2. ✅ Push para GitHub Container Registry (GHCR)
3. ✅ Trigger deploy no Render via webhook

### Configurar Secrets no GitHub

Em `Settings → Secrets and variables → Actions`, adicione:

- `GHCR_TOKEN`: Token do GitHub com permissão `write:packages`
- `RENDER_DEPLOY_HOOK`: URL do deploy hook do Render

## 🎯 Checklist Pré-Deploy

- [ ] Build local funcionando (`npm run build`)
- [ ] Testes passando (`npm run test`)
- [ ] Variáveis de ambiente configuradas
- [ ] `.env` no `.gitignore`
- [ ] CORS configurado no backend
- [ ] Chaves do Stripe válidas
- [ ] Chave do Google Maps com restrições apropriadas
- [ ] URL do backend atualizada para produção

## 🐛 Troubleshooting

### Erro: "crypto.hash is not a function"
```bash
# Atualizar Node.js
nvm install 22
nvm use 22
```

### Build falhando no Render
- Verifique se todas as variáveis de ambiente estão configuradas
- Confira os logs no dashboard do Render
- Teste o build localmente primeiro

### CORS Error
- Adicione o domínio do frontend no `CorsConfig` do backend
- Redeploy do backend após mudanças

### Google Maps não funciona
- Verifique se a chave de API está correta
- Habilite as APIs necessárias no Google Cloud Console:
  - Maps JavaScript API
  - Geocoding API
  - Places API

## 📱 URLs de Produção

- **Frontend**: https://mvt-fe.onrender.com
- **Backend**: https://mvt-events-api.onrender.com
- **API Health**: https://mvt-events-api.onrender.com/actuator/health

## 📞 Suporte

Para problemas com o deploy, verifique:
1. Logs do Render Dashboard
2. GitHub Actions (se configurado)
3. Console do navegador (F12)
4. Network tab para erros de API

## 🔐 Rotação de Chaves

### Stripe
1. Acesse: https://dashboard.stripe.com/apikeys
2. Gere nova chave
3. Atualize no Render Dashboard
4. Redeploy do serviço

### Google Maps
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie nova chave ou regenere
3. Configure restrições (domínios permitidos)
4. Atualize no Render Dashboard

---

**Última atualização**: 17 de Novembro de 2025
