# Sistema de Pagamentos - MVT Events Frontend

Este documento descreve a implementação do sistema de pagamentos integrado com **Stripe**, **Mercado Pago** e **PayPal** no frontend React.

## 📋 Funcionalidades Implementadas

### ✅ Componentes Criados

1. **PaymentMethodSelector** - Seleção de métodos de pagamento
2. **PixPayment** - Pagamento via PIX (MercadoPago)
3. **CardPayment** - Pagamento com cartão (Stripe)
4. **PaymentProcessor** - Orquestrador principal do fluxo de pagamento
5. **PaymentSuccessPage** - Página de sucesso do pagamento
6. **PaymentCancelPage** - Página de cancelamento do pagamento

### ✅ Serviços

1. **paymentService** - Comunicação com API de pagamentos
2. **stripe.ts** - Configuração do Stripe

### ✅ Métodos de Pagamento Suportados

- **PIX** - Via MercadoPago (QR Code + Copia e Cola)
- **Cartão de Crédito** - Via Stripe
- **Cartão de Débito** - Via Stripe
- **PayPal** - Estrutura preparada
- **Transferência Bancária** - Estrutura preparada

## 🚀 Como Usar

### 1. Configuração das Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Configuração do Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_seu_stripe_public_key

# URL da API Backend
VITE_API_URL=http://localhost:8080/api

# URLs de retorno do pagamento
VITE_PAYMENT_RETURN_URL=http://localhost:3000/payment/success
VITE_PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
```

### 2. Dependências Instaladas

As seguintes dependências foram adicionadas ao projeto:

```json
{
  "@stripe/stripe-js": "^2.4.0",
  "@stripe/react-stripe-js": "^2.4.0"
}
```

### 3. Fluxo de Pagamento Implementado

#### Na Página de Inscrição:

1. **Preenchimento dos Dados** - Usuário preenche formulário de inscrição
2. **Criação da Inscrição** - Sistema cria registro com status PENDING
3. **Seleção do Pagamento** - PaymentProcessor é exibido com métodos disponíveis
4. **Processamento** - Usuário escolhe método e realiza pagamento
5. **Confirmação** - Sistema confirma pagamento e atualiza status

#### Integração na EventRegistrationPage:

```tsx
{
  /* Após o formulário de dados */
}
{
  showPayment && registrationId && (
    <PaymentProcessor
      registrationId={registrationId}
      amount={50.0} // Valor do evento
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentCancel={handlePaymentCancel}
    />
  );
}
```

### 4. Componentes de Pagamento

#### PaymentMethodSelector

- Lista métodos disponíveis
- Calcula taxas para cada método
- Exibe comparativo de custos

#### PixPayment

- Gera QR Code via MercadoPago
- Código copia e cola
- Timer de expiração
- Verificação automática de status

#### CardPayment

- Integração com Stripe Elements
- Validação de cartão em tempo real
- Processamento seguro via Stripe

### 5. Páginas de Retorno

#### /payment/success

- Confirmação de pagamento bem-sucedido
- Verificação do status via API
- Redirecionamento automático

#### /payment/cancel

- Informações sobre cancelamento
- Opção de tentar novamente
- Links de navegação

## 🔧 API Integration

### Endpoints Utilizados

```typescript
// Buscar métodos de pagamento
GET /api/payments/methods

// Calcular taxa
GET /api/payments/calculate-fee?amount=100&paymentMethod=PIX

// Criar pagamento
POST /api/payments
{
  "registrationId": 123,
  "amount": 50.00,
  "paymentMethod": "PIX",
  "pixExpirationMinutes": 30
}

// Status do pagamento
GET /api/payments/{paymentId}/status

// Confirmar pagamento
POST /api/payments/{paymentId}/confirm
```

### Tipos TypeScript Definidos

```typescript
interface PaymentMethod {
  id: string;
  name: string;
  type: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL_ACCOUNT";
  fee: number;
  description: string;
  provider: "STRIPE" | "MERCADOPAGO" | "PAYPAL";
  enabled: boolean;
}

interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  qrCode?: string; // PIX
  qrCodeBase64?: string; // PIX
  pixCopyPaste?: string; // PIX
  clientSecret?: string; // Stripe
  approvalUrl?: string; // PayPal
  expiresAt?: string;
}
```

## 🎨 UI/UX Features

### Design Responsivo

- Layout adaptável para mobile e desktop
- Componentes otimizados para touch
- Loading states e feedback visual

### Experiência do Usuário

- **PIX**: QR Code + timer + verificação automática
- **Cartão**: Validação em tempo real + feedback de erros
- **Fluxo Guiado**: Steps claros com navegação intuitiva

### Estados de Loading

- Carregamento de métodos de pagamento
- Processamento de pagamento
- Verificação de status

### Tratamento de Erros

- Mensagens de erro específicas por método
- Opções de recuperação
- Fallbacks para problemas de conexão

## 🔒 Segurança

### Práticas Implementadas

- **Stripe Elements** - Dados de cartão nunca passam pelo frontend
- **Tokens seguros** - Apenas tokens públicos no frontend
- **HTTPS** - Obrigatório em produção
- **Validação** - Inputs sanitizados e validados

### Configuração Segura

```typescript
// Apenas chaves públicas no frontend
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Headers automáticos para API
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🧪 Testes

### Cartões de Teste Stripe

```
Visa: 4242424242424242
Mastercard: 5555555555554444
Amex: 378282246310005
Declined: 4000000000000002
```

### PIX de Teste

- Use o ambiente sandbox do MercadoPago
- QR Codes de teste são gerados automaticamente
- Pagamentos podem ser simulados via dashboard

## 📱 Responsividade

### Breakpoints

- **Mobile**: <= 600px
- **Tablet**: 601px - 1024px
- **Desktop**: >= 1025px

### Componentes Adaptáveis

- PaymentMethodSelector com grid responsivo
- QR Code redimensionável
- Formulários com layout flexível

## 🚧 Próximos Passos

### Funcionalidades Pendentes

1. ✅ PIX via MercadoPago
2. ✅ Cartão via Stripe
3. ⏳ PayPal Account
4. ⏳ Transferência Bancária
5. ⏳ Boleto (Brasil)
6. ⏳ Parcelamento

### Melhorias Planejadas

1. **Cache** - Métodos de pagamento
2. **Retry Logic** - Falhas de rede
3. **Analytics** - Tracking de conversão
4. **A/B Testing** - Otimização de checkout
5. **Internacionalização** - Múltiplos idiomas

## 🛠️ Desenvolvimento

### Estrutura de Arquivos

```
src/
├── components/
│   └── Payment/
│       ├── PaymentMethodSelector.tsx
│       ├── PixPayment.tsx
│       ├── CardPayment.tsx
│       ├── PaymentProcessor.tsx
│       ├── PaymentSuccessPage.tsx
│       └── PaymentCancelPage.tsx
├── services/
│   └── payment.ts
├── config/
│   └── stripe.ts
└── types/
    └── payment.ts
```

### Scripts de Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Testar pagamentos
# Configure .env e execute testes com cartões/PIX de teste
```

## ❓ FAQ

### Como adicionar novo método de pagamento?

1. Adicione o tipo em `PaymentMethod`
2. Implemente componente específico
3. Integre no `PaymentProcessor`
4. Teste com dados de sandbox

### Como personalizar taxas?

As taxas são calculadas pelo backend baseado no provedor e método selecionado.

### Como tratar falhas de pagamento?

Cada componente tem handlers específicos de erro que permitem retry ou mudança de método.

### Como integrar com outros provedores?

1. Adicione configuração em `config/`
2. Implemente serviços específicos
3. Crie componentes de UI
4. Registre no `PaymentProcessor`

---

## 📞 Suporte

Para dúvidas sobre implementação:

- **Email**: suporte@mvtevents.com
- **Documentação Backend**: [Ver documentação do backend]
- **Stripe Docs**: https://stripe.com/docs
- **MercadoPago Docs**: https://www.mercadopago.com.br/developers
