# 🚀 Especificação Backend - Integração Iugu para Pagamentos Automáticos

**Data:** 2 de dezembro de 2025  
**Versão:** 1.0  
**Prioridade:** Alta 🔥

---

## 🎯 Objetivo

Implementar sistema de **pagamentos automáticos** usando **Iugu**, permitindo que motoboys recebam dinheiro **direto na conta bancária** em D+1, sem necessidade de acesso a painéis ou saques manuais.

---

## 📋 Contexto

### O Problema
Atualmente não temos sistema de pagamento integrado. Precisamos:
- Receber pagamentos de clientes via PIX
- Dividir automaticamente entre motoboy (87%), gerente (5%) e plataforma (8%)
- Transferir automaticamente para conta bancária do motoboy (D+1)

### A Solução
**Iugu com transferência automática (`auto_withdraw: true`)**

---

## 🔑 Requisitos Principais

### 1. Coleta de Dados Bancários

O **frontend** enviará para o backend:

```json
{
  "motoboyId": "cm123abc",
  "dadosBancarios": {
    "banco": "260",
    "bancoNome": "Nubank",
    "agencia": "0001",
    "conta": "12345678-9",
    "tipoConta": "checking"
  }
}
```

**Dados que já temos no sistema:**
- Nome completo do motoboy
- CPF
- Email (ou gerar temporário)
- Telefone

### 2. Criar/Atualizar Subconta Iugu

Quando receber dados bancários:
1. Verificar se motoboy já tem `iuguAccountId`
2. Se **NÃO**: Criar subconta com `auto_withdraw: true`
3. Se **SIM**: Atualizar dados bancários
4. Salvar `iuguAccountId` no banco de dados
5. Marcar `dadosBancariosCompletos: true`

### 3. Pagamentos com Split Automático

Quando cliente pagar entrega:

```json
{
  "amount": 10000,
  "splits": [
    { "receiverId": "motoboy_iugu_id", "cents": 8700 },
    { "receiverId": "manager_iugu_id", "cents": 500 }
  ]
}
```

### 4. Webhooks

Processar notificações do Iugu:
- `invoice.paid` → Atualizar status da entrega
- `withdrawal.completed` → Confirmar recebimento pelo motoboy
- Enviar notificações (WhatsApp/SMS) nos momentos certos

---

## 📊 Fluxo Completo

```
1. Motoboy preenche dados bancários no app/web
   ↓
2. Frontend envia para: POST /api/motoboy/dados-bancarios
   ↓
3. Backend cria subconta Iugu com auto_withdraw: true
   ↓
4. Salva iuguAccountId no banco de dados
   ↓
5. Cliente paga entrega via PIX
   ↓
6. Backend cria pagamento com split automático
   ↓
7. Iugu divide: 87% motoboy, 5% gerente, 8% plataforma
   ↓
8. D+1: Iugu transfere AUTOMATICAMENTE para conta do motoboy
   ↓
9. Webhook notifica: withdrawal.completed
   ↓
10. Backend notifica motoboy via WhatsApp: "R$ 87 depositados! 💰"
```

---

## 🗄️ Modelo de Dados

Adicionar ao modelo `Motoboy`:

```typescript
{
  // Campos existentes (nome, cpf, email, telefone...)
  
  // NOVOS CAMPOS:
  iuguAccountId: string | null,
  dadosBancarios: {
    banco: string,
    bancoNome: string,
    agencia: string,
    conta: string,
    tipoConta: 'checking' | 'savings'
  } | null,
  dadosBancariosCompletos: boolean,
  autoWithdrawAtivo: boolean
}
```

---

## 🔧 Endpoints Necessários

### 1. Salvar Dados Bancários

```
POST /api/motoboy/dados-bancarios
```

**Request Body:**
```json
{
  "motoboyId": "cm123abc",
  "dadosBancarios": {
    "banco": "260",
    "bancoNome": "Nubank",
    "agencia": "0001",
    "conta": "12345678-9",
    "tipoConta": "checking"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dados bancários salvos com sucesso",
  "iuguAccountId": "XXXXXXX",
  "autoWithdrawAtivo": true
}
```

**Responsabilidade:**
- Validar dados recebidos
- Criar/atualizar subconta Iugu com `auto_withdraw: true`
- Salvar no banco de dados
- Retornar sucesso ou erro

---

### 2. Criar Pagamento com Split

```
POST /api/payment/create-with-split
```

**Request Body:**
```json
{
  "deliveryId": "delivery_123",
  "amount": 10000,
  "customerId": "customer_456",
  "motoboyId": "motoboy_789",
  "managerId": "manager_012"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "invoice_xyz",
  "pixQrCode": "00020126580014br.gov.bcb.pix...",
  "pixQrCodeUrl": "https://api.iugu.com/qr/xyz.png",
  "amount": 10000,
  "expiresAt": "2025-12-02T23:59:59Z"
}
```

**Responsabilidade:**
- Calcular splits (87%, 5%, 8%)
- Criar invoice no Iugu com splits
- Retornar QR Code PIX
- Salvar referência do pagamento

---

### 3. Webhook Iugu

```
POST /api/webhooks/iugu
```

**Request Body (exemplo):**
```json
{
  "event": "invoice.paid",
  "data": {
    "id": "invoice_xyz",
    "status": "paid",
    "total": "100.00",
    "paid_at": "2025-12-02T14:30:00Z"
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Responsabilidade:**
- Validar assinatura do webhook
- Processar eventos (invoice.paid, withdrawal.completed, etc)
- Atualizar status no banco
- Enviar notificações

---

## 🔐 Variáveis de Ambiente

Adicionar no `.env`:

```bash
# Iugu API
IUGU_API_KEY=seu_token_aqui
IUGU_API_URL=https://api.iugu.com/v1
IUGU_ACCOUNT_ID=sua_conta_master

# Configurações de Split
IUGU_MOTOBOY_PERCENTAGE=87
IUGU_MANAGER_PERCENTAGE=5
IUGU_PLATFORM_PERCENTAGE=8
```

---

## 📝 Lista de Bancos

Frontend enviará **código de 3 dígitos**. Principais:

```
001 - Banco do Brasil
033 - Santander
104 - Caixa Econômica Federal
237 - Bradesco
341 - Itaú
077 - Inter
260 - Nubank
290 - PagSeguro
323 - Mercado Pago
380 - PicPay
212 - Banco Original
756 - Bancoob (Sicoob)
748 - Sicredi
336 - C6 Bank
655 - Neon
102 - XP Investimentos
```

---

## ✅ Validações Necessárias

### Dados Bancários
- **Banco:** Código de 3 dígitos
- **Agência:** Mínimo 3 dígitos, sem dígito verificador
- **Conta:** Formato "12345-6" (com hífen)
- **Tipo:** "checking" ou "savings"

### CPF
- 11 dígitos
- Validar algoritmo de dígitos verificadores
- Não aceitar CPFs com todos dígitos iguais

### Splits
- Soma dos splits deve ser ≤ valor total
- Cada receiver_id deve existir no Iugu
- Valores em centavos (inteiros)

---

## 🔔 Notificações

### Momentos para Notificar Motoboy

#### 1. Dados cadastrados
```
✅ Cadastro completo!
Seus pagamentos serão automáticos.
Dinheiro cai direto na sua conta em D+1! 💰
```

#### 2. Pagamento confirmado
```
💰 Novo pagamento: R$ 87,00
Cairá na sua conta amanhã (D+1)
Banco: Nubank - Conta: ***45-6
```

#### 3. Transferência realizada
```
✅ R$ 87,00 depositados!
Confira seu saldo na conta Nubank 🎉
```

---

## 💰 Custos

```
Taxa Iugu PIX: R$ 0,59 por transação
Transferência automática: R$ 0,00 (grátis)
Subconta: R$ 0,00 (grátis)

Exemplo (Cliente paga R$ 100):
─────────────────────────────────
Cliente paga: R$ 100,00
Taxa Iugu:    -R$   0,59
Motoboy:      -R$  87,00
Gerente:      -R$   5,00
─────────────────────────────────
Seu lucro:     R$   7,41
```

---

## 🚨 Pontos Importantes

1. **`auto_withdraw: true`** é ESSENCIAL - sem isso não é automático
2. **Validar assinatura** dos webhooks para segurança
3. **Idempotência** - evitar duplicação de subcontas/pagamentos
4. **Logs** de todas as chamadas à API Iugu
5. **Fallback** se API falhar (retry com backoff exponencial)
6. **Nunca expor** `IUGU_API_KEY` no frontend
7. **Rate limiting** - respeitar limites da API
8. **Criptografia** dos dados bancários no banco

---

## 📚 Documentação de Referência

- **API Iugu:** https://dev.iugu.com/reference
- **Marketplace (Subcontas):** https://dev.iugu.com/reference/criar-subconta
- **Split de Pagamentos:** https://dev.iugu.com/docs/split-de-pagamentos
- **Webhooks:** https://dev.iugu.com/docs/webhooks
- **Auto Withdraw:** https://dev.iugu.com/docs/saque-automatico

---

## 🎯 Resultado Esperado

Após implementação:

1. ✅ Motoboy cadastra dados bancários (1x)
2. ✅ Sistema cria subconta com auto_withdraw
3. ✅ Cliente paga → Split automático
4. ✅ D+1: Dinheiro CAI DIRETO na conta do motoboy
5. ✅ Zero trabalho manual para todos
6. ✅ Escalável para 1000+ motoboys
7. ✅ Notificações automáticas em cada etapa
8. ✅ Dashboard com métricas de pagamentos

---

## 📊 Exemplo de Chamada à API Iugu

### Criar Subconta com Auto Withdraw

```bash
curl -X POST https://api.iugu.com/v1/marketplace/create_account \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "commission_percent": 0,
    "auto_withdraw": true,
    "auto_advance": false,
    "configuration": {
      "cpf": "12345678900",
      "name": "João Silva",
      "email": "joao@example.com",
      "telephone": "11987654321"
    },
    "bank_verification": {
      "bank": "260",
      "agency": "0001",
      "account": "12345678-9",
      "account_type": "checking",
      "holder_name": "João Silva",
      "document_number": "12345678900"
    }
  }'
```

### Criar Pagamento com Split

```bash
curl -X POST https://api.iugu.com/v1/invoices \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "due_date": "2025-12-03",
    "items": [{
      "description": "Entrega #123",
      "quantity": 1,
      "price_cents": 10000
    }],
    "payer": {
      "cpf_cnpj": "98765432100",
      "name": "Cliente Nome",
      "phone": "11999887766"
    },
    "payable_with": "pix",
    "splits": [
      {
        "receiver_account_id": "MOTOBOY_ACCOUNT_ID",
        "cents": 8700
      },
      {
        "receiver_account_id": "MANAGER_ACCOUNT_ID",
        "cents": 500
      }
    ]
  }'
```

---

## 🧪 Checklist de Implementação

### Database
- [ ] Atualizar schema do modelo Motoboy
- [ ] Criar migration
- [ ] Adicionar índices necessários

### Services
- [ ] Criar/atualizar IuguService
- [ ] Implementar validações
- [ ] Implementar retry logic

### API Endpoints
- [ ] POST /api/motoboy/dados-bancarios
- [ ] POST /api/payment/create-with-split
- [ ] POST /api/webhooks/iugu
- [ ] GET /api/motoboy/:id/bank-info (opcional)

### Webhooks
- [ ] Configurar URL no painel Iugu
- [ ] Validar assinatura
- [ ] Processar eventos

### Notificações
- [ ] Integração WhatsApp/SMS
- [ ] Templates de mensagens
- [ ] Envio em cada evento

### Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] Testes de webhooks

### Segurança
- [ ] Validação de entrada
- [ ] Criptografia de dados sensíveis
- [ ] Rate limiting
- [ ] Logs de auditoria

### Monitoramento
- [ ] Logs estruturados
- [ ] Alertas de falhas
- [ ] Métricas de pagamentos
- [ ] Dashboard de acompanhamento

---

## 🎉 Benefícios

### Para o Motoboy
- 💰 Recebe automaticamente todo dia
- 🚀 Zero trabalho manual
- 📱 Notificações em tempo real
- ✅ Segurança e confiabilidade

### Para a Plataforma
- 🤖 100% automático
- 📈 Escalável infinitamente
- 💪 Profissional e competitivo
- 💵 Margens preservadas

### Para o Cliente
- ⚡ Pagamento rápido via PIX
- 🔒 Seguro e confiável
- 📊 Transparente

---

## ⏱️ Estimativa

**Prazo sugerido:** 3-5 dias de desenvolvimento

**Breakdown:**
- Dia 1: Setup + Model + Validações
- Dia 2: Endpoints + Service Iugu
- Dia 3: Webhooks + Notificações
- Dia 4: Testes + Ajustes
- Dia 5: Deploy + Monitoramento

---

## 📞 Contato

Para dúvidas sobre a especificação, entre em contato com a equipe de frontend.

---

**Status:** 📝 Especificação Completa  
**Última Atualização:** 2 de dezembro de 2025  
**Próximos Passos:** Iniciar desenvolvimento backend
