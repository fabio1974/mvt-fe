import { useState, useEffect, useCallback } from "react";
import { paymentService, type PaymentResponse } from "../../services/payment";
import { FiCopy, FiCheck, FiClock, FiRefreshCw } from "react-icons/fi";

interface PixPaymentProps {
  registrationId: number;
  amount: number;
  onPaymentComplete: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function PixPayment({
  registrationId,
  amount,
  onPaymentComplete,
  onPaymentError,
}: PixPaymentProps) {
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const createPixPayment = useCallback(async () => {
    setLoading(true);
    try {
      const paymentData = {
        registrationId: registrationId.toString(),
        amount,
        currency: "BRL",
        paymentMethod: "PIX",
        customerName: "Cliente MVT Events", // Pode ser melhorado pegando do contexto do usuário
        customerEmail: "cliente@mvtevents.com", // Pode ser melhorado pegando do contexto do usuário
        pixExpirationMinutes: 30,
      };

      const response = await paymentService.createPayment(paymentData);
      setPayment(response);
    } catch (err) {
      onPaymentError("Erro ao gerar PIX. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [registrationId, amount, onPaymentError]);

  useEffect(() => {
    createPixPayment();
  }, [createPixPayment]);

  useEffect(() => {
    if (payment?.expiresAt) {
      const expirationTime = new Date(payment.expiresAt).getTime();
      const now = new Date().getTime();
      const secondsLeft = Math.max(
        0,
        Math.floor((expirationTime - now) / 1000)
      );
      setTimeLeft(secondsLeft);

      if (secondsLeft > 0) {
        const timer = setInterval(() => {
          const currentTime = new Date().getTime();
          const remaining = Math.max(
            0,
            Math.floor((expirationTime - currentTime) / 1000)
          );
          setTimeLeft(remaining);

          if (remaining === 0) {
            clearInterval(timer);
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [payment?.expiresAt]);

  useEffect(() => {
    if (payment?.paymentId) {
      const checkPaymentStatus = setInterval(async () => {
        try {
          const status = await paymentService.getPaymentStatus(
            payment.paymentId
          );
          if (status.status === "COMPLETED") {
            clearInterval(checkPaymentStatus);
            onPaymentComplete(payment.paymentId);
          } else if (
            status.status === "FAILED" ||
            status.status === "CANCELLED"
          ) {
            clearInterval(checkPaymentStatus);
            onPaymentError("Pagamento não foi processado");
          }
        } catch (err) {
          console.error("Erro ao verificar status do pagamento:", err);
        }
      }, 3000);

      return () => clearInterval(checkPaymentStatus);
    }
  }, [payment?.paymentId, onPaymentComplete, onPaymentError]);

  const copyPixCode = async () => {
    if (payment?.pixCopyPaste) {
      try {
        await navigator.clipboard.writeText(payment.pixCopyPaste);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Erro ao copiar código PIX:", err);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <span className="text-xl text-gray-700 font-medium">
            Gerando PIX...
          </span>
        </div>
      </div>
    );
  }

  if (!payment || !payment.qrCodeBase64) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
          <div className="text-red-700 font-medium">
            Erro ao gerar PIX. Tente novamente.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Pagamento PIX</h2>
        <div className="text-3xl font-bold text-green-600 mb-2">
          {formatCurrency(amount)}
        </div>
        <div className="text-lg text-gray-600">via Mercado Pago</div>
      </div>

      {/* Timer */}
      {timeLeft > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-center">
              <div className="text-yellow-800 font-semibold text-lg">
                Tempo restante: {formatTime(timeLeft)}
              </div>
              <div className="text-yellow-600 text-sm">
                O QR Code expira automaticamente
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-6">
        <div className="text-center">
          <div className="bg-white rounded-2xl p-6 inline-block shadow-lg mb-6">
            <img
              src={`data:image/png;base64,${payment.qrCodeBase64}`}
              alt="QR Code PIX"
              className="mx-auto w-64 h-64"
            />
          </div>
          <p className="text-gray-700 font-medium mb-2">
            Escaneie o QR Code com o aplicativo do seu banco
          </p>
          <p className="text-sm text-gray-500">
            ou use o código copia e cola abaixo
          </p>
        </div>
      </div>

      {/* Código Copia e Cola */}
      <div className="bg-gray-50 rounded-xl p-6">
        <label className="block text-lg font-semibold text-gray-800 mb-4">
          Código PIX (Copia e Cola)
        </label>
        <div className="flex space-x-3">
          <input
            type="text"
            value={payment.pixCopyPaste || ""}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={copyPixCode}
            className={`
              px-4 py-2 rounded-md font-medium transition-colors
              ${
                copied
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }
            `}
          >
            {copied ? (
              <div className="flex items-center space-x-1">
                <FiCheck className="w-4 h-4" />
                <span>Copiado!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <FiCopy className="w-4 h-4" />
                <span>Copiar</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-4 text-lg">
          Como pagar com PIX:
        </h4>
        <ol className="list-decimal list-inside space-y-3 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Abra o aplicativo do seu banco ou carteira digital</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Escaneie o QR Code ou cole o código PIX</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Confirme os dados e finalize o pagamento</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>Aguarde a confirmação automática</span>
          </li>
        </ol>
      </div>

      {/* Status de verificação */}
      <div className="text-center bg-green-50 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <FiRefreshCw className="w-4 h-4 text-green-600 animate-spin" />
          </div>
          <span className="text-green-800 font-medium text-lg">
            Aguardando pagamento...
          </span>
        </div>
        <p className="text-sm text-green-600">
          Verificaremos seu pagamento automaticamente
        </p>
      </div>
    </div>
  );
}
