import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { FiHome, FiChevronRight } from "react-icons/fi";
import EntityTable from "../Generic/EntityTable";
import { isClient } from "../../utils/auth";
import "../Generic/EntityCRUD.css";

/**
 * Página de Pagamento Diário para Clientes
 * 
 * Mostra entregas concluídas e exibe o QR Code PIX do pagamento pendente
 * (se houver) gerado automaticamente pelo backend
 */

interface PaymentResponse {
  paymentId: number;
  pixQrCode: string;
  pixQrCodeUrl: string;
  secureUrl: string;
  amount: number;
  deliveryCount: number;
  splits: {
    couriersCount: number;
    managersCount: number;
    couriersAmount: number;
    managersAmount: number;
    platformAmount: number;
    recipients: { [key: string]: number };
  };
  status: string;
  expiresAt: string;
  statusMessage: string;
  expired: boolean;
}

const DailyPaymentPage: React.FC = () => {
  const [, setDeliveries] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  useEffect(() => {
    loadDailyDeliveries();
    loadPendingPayment();
  }, []);

  const loadDailyDeliveries = async () => {
    try {
      // Busca entregas concluídas
      const response = await api.get<{ content: any[] }>("/api/deliveries", {
        params: {
          status: "COMPLETED",
          size: 1000,
        },
      });

      const deliveriesData = response.data.content || [];
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error("Erro ao carregar entregas:", error);
      showToast("Erro ao carregar entregas", "error");
    }
  };

  const loadPendingPayment = async () => {
    try {
      setLoading(true);
      // Busca o pagamento pendente do cliente logado
      const response = await api.get<PaymentResponse>("/api/payment/pending");
      
      if (response.data) {
        setPayment(response.data);
      }
    } catch (error: any) {
      // Se retornar 404, não há pagamento pendente (isso é normal)
      if (error.response?.status !== 404) {
        console.error("Erro ao carregar pagamento pendente:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (!payment) return;
    
    navigator.clipboard.writeText(payment.pixQrCode);
    showToast("✅ Código PIX copiado para área de transferência!", "success");
  };

  const calculateTimeRemaining = () => {
    if (!payment) return "";
    
    const now = new Date();
    const expires = new Date(payment.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expirado";
    
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const displayHours = Math.floor(totalMinutes / 60);
    const displayMinutes = totalMinutes % 60;
    
    return `${displayHours}h ${displayMinutes}min`;
  };

  // Filtros para a tabela - entregas concluídas
  const tableFilters = {
    status: "COMPLETED",
  };

  return (
    <>
      {/* Breadcrumb com mesmo estilo do CRUD */}
      <div className="entity-crud-breadcrumb">
        <div className="breadcrumb-content">
          <div className="breadcrumb-item">
            <FiHome className="breadcrumb-icon" />
            <span>Início</span>
          </div>
          <FiChevronRight className="breadcrumb-separator" />
          <div className="breadcrumb-item">
            <span>Pagamento Diário</span>
            <span style={{ 
              marginLeft: "8px", 
              fontSize: "0.9em", 
              color: "#ffffff",
              fontWeight: "normal" 
            }}>
              (Entregas concluídas e pagamento pendente)
            </span>
          </div>
        </div>
      </div>

      {/* Container para o conteúdo */}
      <div className="entity-crud-container">
        {/* Tabela de Entregas */}
        <EntityTable
          entityName="delivery"
          showActions={false}
          hideHeader={true}
          hideFilters={true}
          noWrapper={true}
          hideFields={isClient() ? ["client", "createdAt", "status"] : ["createdAt", "status"]}
          initialFilters={tableFilters}
          customRenderers={{
            id: (value: any) => (
              <span className="font-medium text-gray-700">
                {String(value).padStart(8, '0')}
              </span>
            ),
            shippingFee: (value: number) => (
              <span className="font-medium text-green-600">
                R$ {(value || 0).toFixed(2)}
              </span>
            ),
            completedAt: (value: string) => (
              <span className="text-gray-700">
                {value ? new Date(value).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "-"}
              </span>
            ),
            payments: (_value: any, row: any) => {
              // Busca o pagamento ativo (PENDING ou COMPLETED)
              const activePayment = row?.payments?.find((p: any) => 
                p.status === 'PENDING' || p.status === 'COMPLETED'
              );
              
              if (!activePayment) {
                return <span className="text-gray-400">-</span>;
              }
              
              const isCompleted = activePayment.status === 'COMPLETED';
              const statusLabel = isCompleted ? 'Pago' : 'Pendente';
              const statusIcon = isCompleted ? '✅' : '⏳';
              
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                    #{activePayment.id}
                  </span>
                  <span 
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {statusIcon} {statusLabel}
                  </span>
                </div>
              );
            },
          }}
        />

        {/* Área de Pagamento */}
        <div className="entity-crud-form-wrapper mt-6">
          {payment ? (
            /* Pagamento pendente encontrado: QR Code e detalhes */
            <div className="payment-container">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                💳 Pagamento Pendente - {payment.deliveryCount} Entrega
                {payment.deliveryCount === 1 ? "" : "s"}
              </h2>
              <p className="text-4xl font-bold text-green-600 text-center mb-6">
                R$ {payment.amount.toFixed(2)}
              </p>

              {/* QR Code e Botões */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-md">
                    <img
                      src={payment.pixQrCodeUrl}
                      alt="QR Code PIX"
                      width={256}
                      height={256}
                      className="block"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <button
                    onClick={copyPixCode}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    📋 Copiar Código PIX
                  </button>
                  <a
                    href={payment.secureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-center shadow-sm"
                  >
                    🌐 Pagar no Navegador
                  </a>
                  <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      {payment.statusMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes dos Splits */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💸 Como o valor será distribuído:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Motoboys</p>
                    <p className="text-xl font-bold text-gray-900">
                      R$ {payment.splits.couriersAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.splits.couriersCount} pessoa
                      {payment.splits.couriersCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Gerentes</p>
                    <p className="text-xl font-bold text-gray-900">
                      R$ {payment.splits.managersAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.splits.managersCount} pessoa
                      {payment.splits.managersCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Plataforma</p>
                    <p className="text-xl font-bold text-gray-900">
                      R$ {payment.splits.platformAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">8% do total</p>
                  </div>
                </div>

                {/* Detalhamento por pessoa (opcional, pode ser colapsável) */}
                <details className="mt-4">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Ver detalhamento por pessoa
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {Object.entries(payment.splits.recipients).map(([name, amount]) => (
                      <li
                        key={name}
                        className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded border border-gray-200"
                      >
                        <span className="text-gray-700">{name}</span>
                        <span className="font-semibold text-gray-900">
                          R$ {amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              {/* Informações de Expiração */}
              <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 mb-1">
                  ⏰ Tempo restante: <strong>{calculateTimeRemaining()}</strong>
                </p>
                <p className="text-xs text-orange-600">
                  Expira em:{" "}
                  {new Date(payment.expiresAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ) : (
            /* Nenhum pagamento pendente */
            <div className="flex flex-col items-center py-8">
              <p className="text-xl text-gray-600 mb-2">
                ℹ️ Nenhum pagamento pendente
              </p>
              <p className="text-gray-500">
                O sistema gerará automaticamente pagamentos para entregas concluídas
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyPaymentPage;
