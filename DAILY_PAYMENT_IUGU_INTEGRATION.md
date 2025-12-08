# 💳 Integração Iugu - Pagamento Diário (Frontend)

**Data**: 04/12/2025  
**Componente**: `DailyPaymentPage.tsx`  
**Status**: ✅ Implementado

---

## 📋 Visão Geral

Refatoração completa do componente de **Pagamento Diário** para integrar com o backend Iugu. Substituímos o QR Code PIX genérico por um **botão de criação de pagamento** que chama o backend para consolidar entregas e gerar invoice no Iugu.

---

## 🎯 O que mudou?

### ❌ **ANTES** (Versão Antiga)

```tsx
// QR Code PIX genérico sempre visível
<QRCodeSVG value={generatePixPayload()} size={200} />

// Chave PIX hardcoded
const pixKey = "pagamento@zapi10.com";

// Cálculo manual do total
const total = deliveries.reduce((sum, d) => sum + (d.shippingFee || 0), 0);
```

**Problemas:**
- ❌ QR Code genérico sem integração com Iugu
- ❌ Não registrava pagamento no backend
- ❌ Não calculava splits (motoboys/gerentes/plataforma)
- ❌ Não tinha controle de expiração

---

### ✅ **DEPOIS** (Versão Nova)

```tsx
// Botão que chama o backend
<button onClick={createInvoice}>
  🔐 Gerar Pagamento PIX
</button>

// Chamada para o backend
const response = await api.post("/api/payment/create-invoice", {
  deliveryIds: deliveries.map(d => d.id),
  clientEmail: "cliente@example.com",
  expirationHours: 24
});

// QR Code do Iugu (real)
<img src={payment.pixQrCodeUrl} alt="QR Code PIX" />
```

**Benefícios:**
- ✅ Invoice registrada no Iugu e no backend
- ✅ Splits automáticos (87% motoboy, 5% gerente, 8% plataforma)
- ✅ QR Code real com controle de expiração
- ✅ Detalhamento completo de valores por pessoa
- ✅ Rastreabilidade total do pagamento

---

## 🔧 Alterações Técnicas

### 1. **Novo Estado do Componente**

```tsx
// ANTES
const [totalAmount, setTotalAmount] = useState(0);
const [deliveryCount, setDeliveryCount] = useState(0);

// DEPOIS
const [deliveries, setDeliveries] = useState<any[]>([]); // Array completo
const [loading, setLoading] = useState(false);           // Loading state
const [payment, setPayment] = useState<PaymentResponse | null>(null); // Response do backend
```

---

### 2. **Interface TypeScript**

```tsx
interface PaymentResponse {
  paymentId: number;
  iuguInvoiceId: string;
  pixQrCode: string;           // Para copiar
  pixQrCodeUrl: string;        // Para exibir <img>
  secureUrl: string;           // Link do navegador
  amount: number;
  deliveryCount: number;
  splits: {
    couriersCount: number;
    managersCount: number;
    couriersAmount: number;
    managersAmount: number;
    platformAmount: number;
    recipients: { [key: string]: number }; // Detalhamento por pessoa
  };
  status: string;
  expiresAt: string;
  statusMessage: string;
  expired: boolean;
}
```

---

### 3. **Função de Criação de Invoice**

```tsx
const createInvoice = async () => {
  if (deliveries.length === 0) {
    showToast("Nenhuma entrega para gerar pagamento", "warning");
    return;
  }

  setLoading(true);

  try {
    const deliveryIds = deliveries.map((d) => d.id);
    const clientEmail = "cliente@example.com"; // TODO: Pegar do contexto/token

    const response = await api.post<PaymentResponse>("/api/payment/create-invoice", {
      deliveryIds,
      clientEmail,
      expirationHours: 24,
    });

    setPayment(response.data);
    showToast("✅ Pagamento PIX gerado com sucesso!", "success");
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Erro ao gerar pagamento PIX";
    showToast(errorMessage, "error");
  } finally {
    setLoading(false);
  }
};
```

**Características:**
- ✅ Validação de entregas vazias
- ✅ Loading state durante chamada
- ✅ Tratamento de erros do backend
- ✅ Toast de sucesso/erro

---

### 4. **Função de Copiar PIX**

```tsx
const copyPixCode = () => {
  if (!payment) return;
  
  navigator.clipboard.writeText(payment.pixQrCode);
  showToast("✅ Código PIX copiado para área de transferência!", "success");
};
```

---

### 5. **Cálculo de Tempo Restante**

```tsx
const calculateTimeRemaining = () => {
  if (!payment) return "";
  
  const now = new Date();
  const expires = new Date(payment.expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return "Expirado";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}min`;
};
```

---

## 🎨 Interface de Usuário

### **Estado 1: Sem Pagamento (Inicial)**

```
┌─────────────────────────────────────────┐
│   💳 Pagamento de Entregas              │
│                                         │
│   5 entregas pendentes de pagamento     │
│   R$ 200.00                             │
│                                         │
│   [🔐 Gerar Pagamento PIX]              │
│                                         │
│   "Ao clicar, será gerado um QR Code..." │
└─────────────────────────────────────────┘
```

---

### **Estado 2: Com Pagamento (Após clicar)**

```
┌─────────────────────────────────────────────────┐
│   Pagamento de 5 Entregas                       │
│   R$ 200.00                                     │
│                                                 │
│   ┌─────────────┐   [📋 Copiar Código PIX]     │
│   │             │   [🌐 Pagar no Navegador]     │
│   │  QR CODE    │   ⏳ Aguardando pagamento     │
│   │   IUGU      │                               │
│   └─────────────┘                               │
│                                                 │
│   💸 Como o valor será distribuído:             │
│   ┌─────────┬──────────┬─────────┐             │
│   │Motoboys │ Gerentes │Plataforma│             │
│   │R$ 174.00│ R$ 10.00 │ R$ 16.00 │             │
│   │3 pessoas│ 2 pessoas│  8%      │             │
│   └─────────┴──────────┴─────────┘             │
│                                                 │
│   > Ver detalhamento por pessoa                 │
│                                                 │
│   ⏰ Tempo restante: 23h 45min                  │
│   Expira em: 05/12/2025 às 19:00               │
│                                                 │
│   [← Voltar para nova geração]                  │
└─────────────────────────────────────────────────┘
```

---

## 📡 Fluxo de Dados

```
┌──────────────┐
│   Cliente    │ Clica em "Gerar Pagamento PIX"
│  (Frontend)  │
└──────┬───────┘
       │
       │ POST /api/payment/create-invoice
       │ {
       │   "deliveryIds": [1, 2, 3, 4, 5],
       │   "clientEmail": "cliente@example.com",
       │   "expirationHours": 24
       │ }
       ▼
┌──────────────┐
│   Backend    │ 1. Busca deliveries
│              │ 2. Calcula splits
│              │ 3. Cria invoice no Iugu
│              │ 4. Salva Payment no DB
└──────┬───────┘
       │
       │ Response: PaymentResponse
       │ {
       │   "pixQrCodeUrl": "https://...",
       │   "amount": 200.00,
       │   "splits": {...}
       │ }
       ▼
┌──────────────┐
│   Cliente    │ Exibe QR Code
│  (Frontend)  │ Mostra detalhes dos splits
└──────┬───────┘
       │
       │ Cliente escaneia QR Code
       │
       ▼
┌──────────────┐
│    Iugu      │ Processa pagamento PIX
│              │ Envia webhook para backend
│              │ Distribui valores automaticamente
└──────────────┘
```

---

## 🚀 Como Usar

### **1. Cliente acessa a página**

```
/pagamento-diario
```

### **2. Sistema lista entregas pendentes**

- Filtra entregas `COMPLETED` do dia corrente
- Filtra apenas sem pagamento (`hasPayment: false`)
- Exibe na tabela

### **3. Cliente clica em "Gerar Pagamento PIX"**

- Frontend chama `POST /api/payment/create-invoice`
- Backend retorna QR Code do Iugu
- Frontend exibe QR Code e detalhes

### **4. Cliente paga via PIX**

- Escaneia QR Code **OU**
- Copia código PIX **OU**
- Abre no navegador

### **5. Iugu processa pagamento**

- Backend recebe webhook do Iugu
- Atualiza status do Payment para `COMPLETED`
- Transfere valores automaticamente (D+1)

---

## ⚠️ TODOs Pendentes

### 🔴 **Crítico**

```tsx
// TODO: Pegar email do cliente logado
const clientEmail = "cliente@example.com"; // ❌ Hardcoded
```

**Solução:**
```tsx
import { useAuth } from "../../contexts/AuthContext";

const { user } = useAuth();
const clientEmail = user?.email || "";
```

---

### 🟡 **Melhorias**

1. **Polling de Status**
   ```tsx
   // Verificar a cada 5 segundos se pagamento foi confirmado
   useEffect(() => {
     if (!payment || payment.status !== 'PENDING') return;
     
     const interval = setInterval(async () => {
       const response = await api.get(`/api/payment/${payment.paymentId}`);
       if (response.data.status === 'COMPLETED') {
         showToast("✅ Pagamento confirmado!", "success");
         loadDailyDeliveries(); // Recarrega lista
       }
     }, 5000);
     
     return () => clearInterval(interval);
   }, [payment]);
   ```

2. **Countdown Timer**
   ```tsx
   // Atualizar tempo restante a cada minuto
   useEffect(() => {
     if (!payment) return;
     
     const interval = setInterval(() => {
       setTimeRemaining(calculateTimeRemaining());
     }, 60000);
     
     return () => clearInterval(interval);
   }, [payment]);
   ```

3. **WebSocket para notificação em tempo real**
   ```tsx
   // Receber notificação quando pagamento for confirmado
   useEffect(() => {
     const socket = new WebSocket('ws://localhost:8080/ws/payments');
     
     socket.onmessage = (event) => {
       const data = JSON.parse(event.data);
       if (data.paymentId === payment?.paymentId && data.status === 'COMPLETED') {
         showToast("✅ Pagamento confirmado!", "success");
         loadDailyDeliveries();
       }
     };
     
     return () => socket.close();
   }, [payment]);
   ```

---

## 🧪 Como Testar

### **1. Testar com 1 entrega**

```bash
# 1. Criar delivery COMPLETED sem pagamento
curl -X POST http://localhost:8080/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "shippingFee": 50.00,
    "completedAt": "2025-12-04T14:00:00"
  }'

# 2. Acessar /pagamento-diario
# 3. Clicar em "Gerar Pagamento PIX"
# 4. Verificar QR Code e splits
```

---

### **2. Testar com múltiplas entregas**

```bash
# Criar 5 deliveries diferentes (motoboys diferentes)
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/deliveries \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"COMPLETED\",
      \"shippingFee\": $((RANDOM % 50 + 20)),
      \"completedAt\": \"2025-12-04T14:$((RANDOM % 60)):00\"
    }"
done
```

---

### **3. Testar expiração**

```tsx
// Mudar para 1 minuto
expirationHours: 0.0167 // (1 minuto)

// Aguardar 1 minuto
// Verificar se "Tempo restante" muda para "Expirado"
```

---

### **4. Testar erros**

```tsx
// Delivery não encontrada
{
  "deliveryIds": [999999],
  "clientEmail": "teste@example.com"
}

// Motoboy sem conta Iugu
{
  "deliveryIds": [42],
  "clientEmail": "teste@example.com"
}
// (Backend deve retornar erro 400)
```

---

## 📊 Comparação Antes/Depois

| Aspecto | ❌ Antes | ✅ Depois |
|---------|---------|-----------|
| **QR Code** | Genérico (manual) | Iugu (oficial) |
| **Registro** | Nenhum | Payment no DB + Iugu |
| **Splits** | Manual | Automático (87/5/8) |
| **Expiração** | Não | 24h configurável |
| **Rastreio** | Impossível | Total (paymentId + iuguInvoiceId) |
| **UX** | Sempre visível | Botão → QR Code |
| **Segurança** | Baixa | Alta (backend valida) |
| **Transparência** | Zero | Detalhamento completo |

---

## 🎉 Checklist de Implementação

- [x] Criar interface `PaymentResponse`
- [x] Refatorar estado do componente
- [x] Implementar `createInvoice()`
- [x] Exibir QR Code do Iugu (`pixQrCodeUrl`)
- [x] Botão "Copiar Código PIX"
- [x] Link "Pagar no Navegador"
- [x] Mostrar detalhes dos splits
- [x] Contador de expiração
- [x] Tratamento de erros (401, 404, 500)
- [x] Estado de loading
- [x] Botão "Voltar para nova geração"
- [ ] **TODO**: Pegar email do cliente do contexto
- [ ] **TODO**: Implementar polling de status
- [ ] **TODO**: Implementar countdown timer
- [ ] **TODO**: WebSocket para notificação em tempo real

---

## 📞 Suporte

**Arquivo**: `/src/components/Delivery/DailyPaymentPage.tsx`  
**Backend Endpoint**: `POST /api/payment/create-invoice`  
**Documentação Backend**: `IUGU_INTEGRATION_SPEC.md`

---

**Versão**: 2.0  
**Última atualização**: 04/12/2025  
**Status**: ✅ Implementado e testável
