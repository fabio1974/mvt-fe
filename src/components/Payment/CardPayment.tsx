import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { paymentService } from "../../services/payment";
import { FiCreditCard, FiAlertCircle } from "react-icons/fi";

interface CardPaymentProps {
  registrationId: number;
  amount: number;
  paymentMethod: string;
  onPaymentComplete: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

const CardPaymentForm = ({
  registrationId,
  amount,
  paymentMethod,
  onPaymentComplete,
  onPaymentError,
}: CardPaymentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("=== CARD PAYMENT SUBMIT STARTED ===");

    if (!stripe || !elements) {
      console.error("Stripe not loaded");
      setError("Sistema de pagamento não carregado");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error("Card element not found");
      setError("Elemento do cartão não encontrado");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // 1. Criar Payment Intent no backend
      const paymentData = {
        registrationId: registrationId.toString(),
        amount,
        currency: "BRL",
        paymentMethod,
        customerName: "Cliente MVT Events",
        customerEmail: "cliente@mvtevents.com",
      };

      const response = await paymentService.createPayment(paymentData);
      console.log("Payment response:", response);

      // Extract client_secret from the correct location
      const clientSecret = response.providerResponse?.client_secret || response.clientSecret;
      console.log("Extracted client_secret:", clientSecret);

      if (!response.success || !clientSecret) {
        throw new Error("Falha na criação do pagamento no backend");
      }

      // 2. Confirmar pagamento com Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Cliente MVT Events",
          },
        },
      });

      if (stripeError) {
        console.error("Stripe error:", stripeError);
        const errorMsg = getStripeErrorMessage(stripeError.message || "Erro no pagamento");
        setError(errorMsg);
        onPaymentError(errorMsg);
      } else if (paymentIntent?.status === "succeeded") {
        console.log("Payment succeeded:", paymentIntent);
        onPaymentComplete(response.paymentId);
      } else {
        const errorMsg = "Pagamento não foi processado corretamente";
        setError(errorMsg);
        onPaymentError(errorMsg);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao processar pagamento. Tente novamente.";
      setError(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const getStripeErrorMessage = (message: string) => {
    const errorMessages: Record<string, string> = {
      "Your card number is incorrect.": "Número do cartão incorreto.",
      "Your card has expired.": "Cartão expirado.",
      "Your card's security code is incorrect.": "Código de segurança incorreto.",
      "Your card has insufficient funds.": "Cartão sem saldo suficiente.",
      "Your card was denied.": "Cartão foi recusado.",
    };
    return errorMessages[message] || message;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white">
      {/* Test Environment Warning */}
      {(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "").startsWith("pk_test_") && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              <strong>Modo de Teste:</strong> Este é um ambiente de desenvolvimento. Nenhuma cobrança real será feita.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Pagamento com Cartão</h2>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <p className="text-lg text-gray-700 mb-2">Valor total a pagar:</p>
          <p className="text-3xl font-bold text-blue-700">{formatCurrency(amount)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card Input */}
        <div className="bg-gray-50 rounded-xl p-6">
          <label className="block text-lg font-semibold text-gray-800 mb-4">Dados do Cartão</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <FiCreditCard className="h-6 w-6 text-gray-400" />
            </div>
            <div className="pl-14 pr-4 py-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#374151",
                      fontFamily: '"Inter", sans-serif',
                      "::placeholder": { color: "#9CA3AF" },
                    },
                    invalid: {
                      iconColor: "#EF4444",
                      color: "#EF4444",
                    },
                  },
                  hidePostalCode: true,
                }}
                onChange={(event) => {
                  setCardComplete(event.complete);
                  if (event.error) {
                    setError(getStripeErrorMessage(event.error.message));
                  } else {
                    setError("");
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || !cardComplete || processing}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg"
        >
          {processing ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Processando pagamento...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3">
              <FiCreditCard className="h-6 w-6" />
              <span>Pagar {formatCurrency(amount)}</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default CardPaymentForm;
