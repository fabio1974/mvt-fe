// Configuração do Stripe
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_...';

// URLs de retorno
export const PAYMENT_RETURN_URL = `${window.location.origin}/payment/success`;
export const PAYMENT_CANCEL_URL = `${window.location.origin}/payment/cancel`;

// Configuração de ambiente
export const isDevelopment = import.meta.env.DEV;