import React, { useState, useCallback, useEffect } from "react";
import { paymentService } from "../../services/payment";

export interface PaymentMethod {
  id: string;
  name: string;
  provider: string;
  supported: boolean;
}

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: PaymentMethod) => void;
  amount: number;
}

// Map backend provider names to frontend display names
const providerMap = {
  PIX: "MERCADOPAGO",
  CREDIT_CARD: "PIX",
  DEBIT_CARD: "PIX",
  PAYPAL_ACCOUNT: "PAYPAL",
  BANK_TRANSFER: "BANK_TRANSFER",
};

// Component for payment method icons
const PaymentMethodIcon = ({ methodId }: { methodId: string }) => {
  const getIcon = () => {
    switch (methodId) {
      case "PIX":
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
        );
      case "CREDIT_CARD":
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,18H4V12H20V18M20,8H4V6H20V8Z" />
            </svg>
          </div>
        );
      case "DEBIT_CARD":
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,18H4V12H20V18M20,8H4V6H20V8Z" />
              <circle cx="6" cy="15" r="1" />
            </svg>
          </div>
        );
      case "PAYPAL_ACCOUNT":
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.486c-.01.04-.018.079-.03.118-.991 4.99-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9L7.82 21.337h3.81c.458 0 .848-.334.922-.788l.038-.242.722-4.578.046-.253c.074-.454.464-.788.922-.788h.58c3.76 0 6.705-1.528 7.56-5.95.356-1.85.173-3.398-.676-4.52z" />
            </svg>
          </div>
        );
      case "BANK_TRANSFER":
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9M9,8A2,2 0 0,1 7,10V14A2,2 0 0,1 9,16H19A2,2 0 0,1 21,14V10A2,2 0 0,1 19,8H9Z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
        );
    }
  };

  return getIcon();
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodSelect,
  amount,
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [fees, setFees] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateFees = useCallback(
    async (methods: PaymentMethod[]) => {
      // Validate amount before making API calls
      if (!amount || amount <= 0) {
        console.warn("Invalid amount for fee calculation:", amount);
        setLoading(false);
        return;
      }

      const feeMap: Record<string, number> = {};

      for (const method of methods) {
        try {
          const feeResponse = await paymentService.calculateFee(
            amount,
            method.id // Usar method.id em vez de method.provider
          );
          feeMap[method.id] = feeResponse.fee;
        } catch (error) {
          console.warn(`Failed to calculate fee for ${method.id}:`, error);
          feeMap[method.id] = 0; // Fallback para taxa zero em caso de erro
        }
      }

      setFees(feeMap);
      setLoading(false);
    },
    [amount]
  );

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentService.getPaymentMethods();

      // Convert backend object format to array format
      const methodsArray: PaymentMethod[] = Object.entries(response).map(
        ([key, value]) => ({
          id: key,
          name: value.name,
          provider: providerMap[key as keyof typeof providerMap] || key,
          supported: value.supported,
        })
      );

      // Filter only supported methods
      const supportedMethods = methodsArray.filter(
        (method) => method.supported
      );
      setMethods(supportedMethods);
      setLoading(false); // Always stop loading after methods are loaded

      // Only calculate fees if we have a valid amount (skip for now while amount is in DB)
      if (supportedMethods.length > 0 && amount && amount > 0) {
        await calculateFees(supportedMethods);
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
      setError("Erro ao carregar métodos de pagamento");
      setLoading(false);
    }
  }, [calculateFees, amount]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  // Separate effect to calculate fees when amount becomes valid
  useEffect(() => {
    if (
      methods.length > 0 &&
      amount &&
      amount > 0 &&
      Object.keys(fees).length === 0
    ) {
      calculateFees(methods);
    }
  }, [amount, methods, fees, calculateFees]);

  const handleMethodClick = (method: PaymentMethod) => {
    onMethodSelect(method);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">
            Carregando métodos de pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={loadPaymentMethods}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors font-medium shadow-md hover:shadow-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">
            Nenhum método de pagamento disponível no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Finalizar Pagamento
        </h2>
        <p className="text-lg text-gray-600">
          Valor da inscrição:{" "}
          <span className="font-semibold text-green-600">
            R$ {amount.toFixed(2)}
          </span>
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Escolha o método de pagamento
        </h3>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleMethodClick(method)}
            className="group border-2 border-gray-200 rounded-xl p-5 cursor-pointer 
                     hover:border-blue-500 hover:shadow-lg transition-all duration-200 
                     bg-white hover:bg-blue-50/50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <PaymentMethodIcon methodId={method.id} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700">
                    {method.name}
                  </h4>
                  <p className="text-sm text-gray-500">via {method.provider}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 group-hover:text-blue-700">
                  R$ {(amount + (fees[method.id] || 0)).toFixed(2)}
                </p>
                {fees[method.id] > 0 && (
                  <p className="text-sm text-gray-500">
                    + R$ {fees[method.id].toFixed(2)} taxa
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-green-50 rounded-lg">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-green-700 font-medium">
            Pagamento 100% seguro
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
