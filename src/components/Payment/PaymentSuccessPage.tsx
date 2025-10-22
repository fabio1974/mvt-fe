import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentService } from "../../services/payment";
import { FiCheck, FiLoader } from "react-icons/fi";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState("");

  const paymentId = searchParams.get("payment_id");
  const registrationId = searchParams.get("registration_id");

  const confirmPayment = async () => {
    if (!paymentId) return;

    try {
      const status = await paymentService.getPaymentStatus(paymentId);

      if (status.status === "COMPLETED") {
        setPaymentConfirmed(true);
      } else if (status.status === "PROCESSING") {
        // Check again in a few seconds
        setTimeout(confirmPayment, 3000);
        return;
      } else {
        setError("Pagamento não foi confirmado. Entre em contato conosco.");
      }
    } catch (err) {
      console.error("Erro ao confirmar pagamento:", err);
      setError("Erro ao verificar pagamento. Entre em contato conosco.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      confirmPayment();
    } else {
      setLoading(false);
      setPaymentConfirmed(true); // Assume success if no payment_id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const handleContinue = () => {
    if (registrationId) {
      navigate(`/eventos`);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="text-center space-y-4">
          <FiLoader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <div className="text-xl text-gray-700">Confirmando pagamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        padding: "20px",
      }}
    >
      <div className="max-w-md w-full">
        {paymentConfirmed ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="w-10 h-10 text-green-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-green-900 mb-4">
                Pagamento Confirmado!
              </h1>
              <p className="text-gray-600 mb-4">
                Sua inscrição foi realizada com sucesso. Você receberá um e-mail
                de confirmação em breve.
              </p>
              {paymentId && (
                <div className="text-sm text-gray-500 mb-4">
                  ID do pagamento: {paymentId}
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                Guarde este comprovante para seus registros. Você pode acessar
                seus eventos inscritos na área "Meus Eventos".
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              {registrationId ? "Ver Meus Eventos" : "Voltar ao Início"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiLoader className="w-10 h-10 text-yellow-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-yellow-900 mb-4">
                Processando Pagamento
              </h1>
              <p className="text-gray-600 mb-4">
                Seu pagamento está sendo processado. Isso pode levar alguns
                minutos.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmPayment}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Verificar Novamente
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
