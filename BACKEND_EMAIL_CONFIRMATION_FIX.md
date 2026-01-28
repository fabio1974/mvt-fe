# Correção do Link de Confirmação de Email no Backend

## Problema

O email de confirmação está enviando um link apontando diretamente para o backend:
```
http://localhost:8080/api/auth/confirm?token=xxx
```

Deveria apontar para o frontend:
```
https://zapi10.com.br/confirm-email?token=xxx
```

## Solução

### 1. Adicionar variável de ambiente

No arquivo `.env` ou `application.properties` (ou `application.yml`):

**Para `.env` ou `application.properties`:**
```properties
FRONTEND_URL=https://zapi10.com.br
```

**Para `application.yml`:**
```yaml
app:
  frontend-url: https://zapi10.com.br
```

### 2. Localizar o código que gera o link

Procure no projeto por arquivos que contenham:
- `confirm` + `token`
- `email` + `confirmation`
- Template de email HTML

Comandos úteis para buscar:
```bash
grep -r "confirm" --include="*.java" src/
grep -r "token" --include="*.html" src/
```

### 3. Alterar a construção do link

**Antes (exemplo):**
```java
String confirmationUrl = "http://localhost:8080/api/auth/confirm?token=" + token;
```

**Depois:**
```java
@Value("${FRONTEND_URL:http://localhost:5173}")
private String frontendUrl;

// ...

String confirmationUrl = frontendUrl + "/confirm-email?token=" + token;
```

### 4. Atualizar template de email (se houver)

Se o link estiver em um template HTML (ex: `confirmation-email.html`):

**Antes:**
```html
<a href="http://localhost:8080/api/auth/confirm?token=${token}">Confirmar meu email</a>
```

**Depois:**
```html
<a href="${frontendUrl}/confirm-email?token=${token}">Confirmar meu email</a>
```

### 5. Configurar ambientes

**Desenvolvimento (.env.local ou application-dev.properties):**
```properties
FRONTEND_URL=http://localhost:5173
```

**Produção (.env.production ou application-prod.properties):**
```properties
FRONTEND_URL=https://zapi10.com.br
```

## Fluxo Correto

1. ✅ Usuário se registra
2. ✅ Backend envia email com link para **frontend**: `https://zapi10.com.br/confirm-email?token=xxx`
3. ✅ Usuário clica no link → abre página do **frontend**
4. ✅ Frontend faz requisição para **backend**: `GET /api/auth/confirm?token=xxx`
5. ✅ Backend confirma o email e retorna sucesso
6. ✅ Frontend mostra mensagem de sucesso com link para login

## Verificação

Após as alterações:
1. Faça um novo registro de teste
2. Verifique o email recebido
3. O link deve apontar para `https://zapi10.com.br/confirm-email?token=...`
4. Ao clicar, deve abrir a página do frontend e confirmar automaticamente
