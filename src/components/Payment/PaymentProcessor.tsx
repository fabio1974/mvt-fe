import { useState } from "react";
import { type FeeCalculation } from "../../services/payment";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "./PaymentMethodSelector";
import PixPayment from "./PixPayment";
import CardPayment from "./CardPayment";
import { FiCheck, FiX } from "react-icons/fi";

interface PaymentProcessorProps {
  registrationId: number;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

export default function PaymentProcessor({
  registrationId,
  amount,
  onPaymentSuccess,
  onPaymentCancel,
}: PaymentProcessorProps) {

  const [step, setStep] = useState<"method" | "payment" | "success" | "error">(
    "method"
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [selectedFee, setSelectedFee] = useState<FeeCalculation | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    // Create a proper FeeCalculation object
    setSelectedFee({
      amount: amount,
      fee: 0,
      total: amount,
      provider: method.provider,
      method: method.id,
    });
    setStep("payment");
  };

  const handlePaymentComplete = (completedPaymentId: string) => {
    setPaymentId(completedPaymentId);
    setStep("success");
    setTimeout(() => {
      onPaymentSuccess();
    }, 3000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep("error");
  };

  const handleBackToMethods = () => {
    setStep("method");
    setSelectedMethod(null);
    setSelectedFee(null);
    setError("");
  };

  const handleTryAgain = () => {
    setError("");
    setStep("payment");
  };

  const renderPaymentMethod = () => {
    if (!selectedMethod || !selectedFee) return null;

    const commonProps = {
      registrationId,
      amount: selectedFee.total,
      onPaymentComplete: handlePaymentComplete,
      onPaymentError: handlePaymentError,
    };

    // Use method ID to determine payment type
    switch (selectedMethod.id) {
      case "PIX":
        return <PixPayment {...commonProps} />;

      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return (
          <CardPayment {...commonProps} paymentMethod={selectedMethod.id} />
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-red-600">
              Método de pagamento não implementado: {selectedMethod.id}
            </div>
            <button
              onClick={handleBackToMethods}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Voltar aos métodos
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {step === "method" && (
          <PaymentMethodSelector
            amount={amount}
            onMethodSelect={handleMethodSelect}
          />
        )}

        {step === "payment" && selectedMethod && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header with back button */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToMethods}
                  className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="font-medium">Voltar aos métodos</span>
                </button>
                <div className="text-white font-semibold">
                  {selectedMethod.name}
                </div>
              </div>
            </div>

            {/* Payment form */}
            <div className="p-6">{renderPaymentMethod()}</div>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-green-900 mb-3">
                  Pagamento Realizado!
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  Sua inscrição foi confirmada com sucesso.
                </p>
                <div className="text-sm text-gray-500">
                  ID do pagamento: {paymentId}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <p className="text-green-800">
                  Você receberá um e-mail de confirmação em breve.
                  Redirecionando automaticamente...
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <FiX className="w-10 h-10 text-red-600" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-red-900 mb-3">
                  Erro no Pagamento
                </h2>
                <p className="text-lg text-gray-600 mb-4">{error}</p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleTryAgain}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 
                           font-medium transition-colors"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={handleBackToMethods}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 
                           hover:bg-gray-50 font-medium transition-colors"
                >
                  Escolher Outro Método
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button for method selection */}
        {step === "method" && (
          <div className="text-center mt-8">
            <button
              onClick={onPaymentCancel}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
