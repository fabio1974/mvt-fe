import { api } from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL_ACCOUNT' | 'BANK_TRANSFER';
  fee: number;
  feeType: 'PERCENTAGE' | 'FIXED' | 'PERCENTAGE_PLUS_FIXED';
  fixedFee?: number;
  description: string;
  icon?: string;
  provider: 'STRIPE' | 'MERCADOPAGO' | 'PAYPAL';
  enabled: boolean;
}

export interface PaymentRequest {
  registrationId: number | string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  customerName?: string;
  customerEmail?: string;
  returnUrl?: string;
  cancelUrl?: string;
  pixExpirationMinutes?: number;
  cardToken?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: 'PENDING' | 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  fee?: number;
  
  // PIX specific
  qrCode?: string;
  qrCodeBase64?: string;
  pixCopyPaste?: string;
  
  // Card/PayPal specific
  paymentUrl?: string;
  approvalUrl?: string;
  clientSecret?: string;
  
  // Provider specific response data
  providerResponse?: {
    client_secret?: string;
    payment_intent_id?: string;
    preference_id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    [key: string]: unknown;
  };
  
  expiresAt?: string;
}

export interface FeeCalculation {
  amount: number;
  fee: number;
  total: number;
  provider: string;
  method: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}

export const paymentService = {
  // Buscar métodos de pagamento disponíveis
  async getPaymentMethods(): Promise<Record<string, { name: string; supported: boolean }>> {
    const response = await api.get('/api/payments/methods');
    return response.data as Record<string, { name: string; supported: boolean }>;
  },

  // Calcular taxa do pagamento
  async calculateFee(amount: number, paymentMethod: string): Promise<FeeCalculation> {
    const response = await api.get(`/api/payments/calculate-fee`, {
      params: { amount, paymentMethod }
    });
    return response.data as FeeCalculation;
  },

  // Criar pagamento
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const response = await api.post('/api/payments/create', paymentData);
    return response.data as PaymentResponse;
  },

  // Confirmar pagamento
  async confirmPayment(paymentId: string, confirmationData?: Record<string, unknown>): Promise<PaymentResponse> {
    const response = await api.post(`/api/payments/${paymentId}/confirm`, confirmationData);
    return response.data as PaymentResponse;
  },

  // Verificar status do pagamento
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    const response = await api.get(`/api/payments/${paymentId}/status`);
    return response.data as PaymentResponse;
  },

  // Solicitar reembolso
  async requestRefund(paymentId: string, amount?: number, reason?: string): Promise<RefundResponse> {
    const response = await api.post(`/api/payments/${paymentId}/refund`, {
      amount,
      reason
    });
    return response.data as RefundResponse;
  }
};