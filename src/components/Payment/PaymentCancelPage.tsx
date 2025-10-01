import { useNavigate, useSearchParams } from "react-router-dom";
import { FiX, FiArrowLeft } from "react-icons/fi";

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const eventSlug = searchParams.get("event_slug");
  const registrationId = searchParams.get("registration_id");

  const handleBackToEvent = () => {
    if (eventSlug) {
      navigate(`/evento/${eventSlug}/inscricao`);
    } else {
      navigate("/");
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

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
        <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <FiX className="w-10 h-10 text-red-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-red-900 mb-4">
              Pagamento Cancelado
            </h1>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi cancelado e nenhuma cobrança foi realizada.
            </p>
            {registrationId && (
              <p className="text-sm text-gray-500 mb-4">
                Sua inscrição não foi confirmada. Você pode tentar novamente a
                qualquer momento.
              </p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Se você cancelou por engano ou teve problemas durante o pagamento,
              pode tentar realizar a inscrição novamente.
            </p>
          </div>

          <div className="space-y-3">
            {eventSlug && (
              <button
                onClick={handleBackToEvent}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Tentar Inscrição Novamente</span>
              </button>
            )}

            <button
              onClick={handleGoHome}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>

          <div className="text-xs text-gray-500">
            <p>
              Precisa de ajuda? Entre em contato conosco pelo e-mail:{" "}
              <a
                href="mailto:suporte@mvtevents.com"
                className="text-blue-600 hover:underline"
              >
                suporte@mvtevents.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
