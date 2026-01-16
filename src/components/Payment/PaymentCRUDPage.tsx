import React, { useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserRole } from "../../utils/auth";
import { FiInfo, FiFileText, FiImage } from "react-icons/fi";
import { api } from "../../services/api";
import PaymentReportModal from "./PaymentReportModal";

/**
 * Página CRUD de Pagamentos
 * 
 * @version 1.1.0
 * @lastUpdate 2024-12-24
 * 
 * Exibe lista de pagamentos com filtros
 * Roles permitidas: ADMIN, ORGANIZER, COURIER
 * Modos: LIST e DELETE (view/edit desabilitados)
 * 
 * Recent Updates (v1.1.0):
 * - Added Payment Report Modal with detailed split breakdown
 * - Added QR Code PIX display with copy functionality
 * - Enhanced Gateway Response viewer with translations
 * - Implemented 4 custom actions (QR Code, Report, Gateway, Delete)
 * - Disabled view and edit actions for payments
 * - Improved error handling and loading states
 * 
 * Custom Actions:
 * 1. QR Code Button (Blue) - Display payment QR Code and PIX code
 * 2. Report Button (Purple) - Show detailed payment report
 * 3. Gateway Response (Green/Red) - Display gateway status/errors
 * 4. Delete Button (Red) - Remove payment (inherited from EntityTable)
 */
const PaymentCRUDPage: React.FC = () => {
  const userRole = getUserRole();
  const [showGatewayResponse, setShowGatewayResponse] = useState(false);
  const [gatewayResponseData, setGatewayResponseData] = useState<string>("");
  const [hasError, setHasError] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [loadingQrCode, setLoadingQrCode] = useState(false);
  
  // Verifica se um pagamento tem erro no gateway
  const checkIfHasError = (payment: any): boolean => {
    if (!payment.gatewayResponse) return false;
    
    try {
      const parsed = typeof payment.gatewayResponse === "string" 
        ? JSON.parse(payment.gatewayResponse)
        : payment.gatewayResponse;
      
      return parsed.errors && parsed.errors.length > 0;
    } catch (e) {
      return false;
    }
  };
  
  // Verifica se o usuário tem permissão
  const allowedRoles = ["ROLE_ADMIN", "ROLE_ORGANIZER", "ROLE_COURIER", "ROLE_CLIENT", "CLIENT"];
  const hasAccess = allowedRoles.includes(userRole || "");

  if (!hasAccess) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Acesso negado. Você não tem permissão para visualizar pagamentos.</p>
      </div>
    );
  }

  const handleShowGatewayResponse = (payment: any) => {
    let response = "Nenhuma resposta disponível";
    let isError = true;
    
    if (payment.gatewayResponse) {
      try {
        // Se for string JSON, faz parse
        const parsed = typeof payment.gatewayResponse === "string" 
          ? JSON.parse(payment.gatewayResponse)
          : payment.gatewayResponse;
        
        // Verifica se há erros
        if (!parsed.errors || parsed.errors.length === 0) {
          response = "Nenhum erro encontrado na resposta do gateway.";
          isError = false;
        } else if (parsed.errors[0].message) {
          const errorMessage = parsed.errors[0].message;
          
          // Traduções simples
          const translations: Record<string, string> = {
            "At least one customer phone is required.": "Pelo menos um telefone do cliente é obrigatório.",
            "Invalid customer data": "Dados do cliente inválidos",
            "Payment method not available": "Método de pagamento não disponível",
            "Insufficient funds": "Saldo insuficiente",
            "Transaction declined": "Transação recusada",
          };
          
          response = translations[errorMessage] || errorMessage;
          isError = true;
        } else {
          response = JSON.stringify(parsed, null, 2);
          isError = true;
        }
      } catch (e) {
        response = payment.gatewayResponse;
        isError = true;
      }
    }
    
    setGatewayResponseData(response);
    setHasError(isError);
    setShowGatewayResponse(true);
  };

  const handleShowReport = async (payment: any) => {
    setLoadingReport(true);
    try {
      const response = await api.get(`/api/payments/${payment.id}/report`);
      setReportData(response.data);
      setShowReport(true);
    } catch (error: any) {
      console.error("Erro ao carregar relatório:", error);
      alert(
        error.response?.data?.message || 
        "Erro ao carregar relatório do pagamento. Tente novamente."
      );
    } finally {
      setLoadingReport(false);
    }
  };

  const handleShowQrCode = async (payment: any) => {
    setLoadingQrCode(true);
    try {
      const response = await api.get(`/api/payments/${payment.id}`);
      setQrCodeData(response.data);
      setShowQrCode(true);
    } catch (error: any) {
      console.error("Erro ao carregar QR Code:", error);
      alert(
        error.response?.data?.message || 
        "Erro ao carregar QR Code do pagamento. Tente novamente."
      );
    } finally {
      setLoadingQrCode(false);
    }
  };

  const customActions = (payment: any) => {
    const hasErrorInGateway = checkIfHasError(payment);
    const buttonColor = hasErrorInGateway ? "#ef4444" : "#10b981";
    
    return (
      <>
        <button
          onClick={() => handleShowQrCode(payment)}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            marginRight: "8px",
          }}
          title="Ver QR Code PIX"
          disabled={loadingQrCode}
        >
          <FiImage />
        </button>
        <button
          onClick={() => handleShowReport(payment)}
          style={{
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            marginRight: "8px",
          }}
          title="Ver relatório de pagamento"
          disabled={loadingReport}
        >
          <FiFileText />
        </button>
        <button
          onClick={() => handleShowGatewayResponse(payment)}
          style={{
            backgroundColor: buttonColor,
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
          }}
          title={hasErrorInGateway ? "Ver erro do Gateway" : "Ver resposta do Gateway"}
        >
          <FiInfo />
        </button>
      </>
    );
  };

  // Renderizadores customizados para campos específicos
  const customRenderers = {
    createdAt: (value: any) => {
      if (!value) return "-";
      try {
        return new Date(value).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return String(value);
      }
    },
    paymentDate: (value: any) => {
      if (!value) return "-";
      try {
        return new Date(value).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return String(value);
      }
    },
    status: (value: any) => {
      const statusTranslations: Record<string, string> = {
        PENDING: "Pendente",
        PROCESSING: "Processando",
        PAID: "Pago",
        FAILED: "Falhou",
        CANCELLED: "Cancelado",
        REFUNDED: "Reembolsado",
        EXPIRED: "Expirado",
      };
      return statusTranslations[value] || value;
    },
  };

  // Permite deletar apenas pagamentos que falharam
  const canDeletePayment = (payment: any) => {
    return payment.status === 'FAILED' || payment.status === 'EXPIRED';
  };

  return (
    <>
      <EntityCRUD
        entityName="payment"
        pageTitle="Pagamentos"
        pageDescription="Visualize e gerencie os pagamentos da plataforma"
        disableCreate={true}
        disableView={true}
        disableEdit={true}
        hideArrayFields={true}
        showFields={["createdAt"]}
        customActions={customActions}
        customRenderers={customRenderers}
        canDelete={canDeletePayment}
      />
      
      {showReport && reportData && (
        <PaymentReportModal
          report={reportData}
          onClose={() => {
            setShowReport(false);
            setReportData(null);
          }}
        />
      )}
      
      {showQrCode && qrCodeData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => {
            setShowQrCode(false);
            setQrCodeData(null);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827" }}>
                QR Code PIX
              </h2>
              <button
                onClick={() => {
                  setShowQrCode(false);
                  setQrCodeData(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "4px",
                }}
              >
                ×
              </button>
            </div>

            {qrCodeData.pixQrCodeUrl ? (
              <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <img
                  src={qrCodeData.pixQrCodeUrl}
                  alt="QR Code PIX"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    height: "auto",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  marginBottom: "24px",
                  textAlign: "center",
                  color: "#92400e",
                }}
              >
                QR Code não disponível para este pagamento
              </div>
            )}

            {qrCodeData.pixQrCode && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", fontWeight: 600 }}>
                  Código PIX Copia e Cola:
                </div>
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    color: "#111827",
                    marginBottom: "12px",
                  }}
                >
                  {qrCodeData.pixQrCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeData.pixQrCode);
                    alert("Código PIX copiado para a área de transferência!");
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Copiar Código PIX
                </button>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Valor Total
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(qrCodeData.totalAmount || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Status
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor:
                      qrCodeData.status === "COMPLETED"
                        ? "#d1fae5"
                        : qrCodeData.status === "PENDING"
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      qrCodeData.status === "COMPLETED"
                        ? "#059669"
                        : qrCodeData.status === "PENDING"
                        ? "#92400e"
                        : "#dc2626",
                  }}
                >
                  {qrCodeData.status === "COMPLETED"
                    ? "Pago"
                    : qrCodeData.status === "PENDING"
                    ? "Pendente"
                    : qrCodeData.status === "FAILED"
                    ? "Falhou"
                    : qrCodeData.status}
                </div>
              </div>
            </div>

            {qrCodeData.expiresAt && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#92400e",
                  textAlign: "center",
                }}
              >
                Expira em: {new Date(qrCodeData.expiresAt).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        </div>
      )}
      
      {showGatewayResponse && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowGatewayResponse(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                {hasError ? "Erro do Gateway" : "Resposta do Gateway"}
              </h3>
              <button
                onClick={() => setShowGatewayResponse(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                backgroundColor: hasError ? "#fee" : "#efe",
                padding: "16px",
                borderRadius: "4px",
                fontSize: "14px",
                color: hasError ? "#c33" : "#2a7",
                lineHeight: "1.5",
              }}
            >
              {gatewayResponseData}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentCRUDPage;
