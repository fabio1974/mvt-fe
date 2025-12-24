import React from "react";
import { FiX, FiPackage, FiUsers, FiDollarSign } from "react-icons/fi";

/**
 * Payment Report Modal Component
 * 
 * @version 1.1.0
 * @created 2024-12-24
 * 
 * Displays comprehensive payment report with:
 * - Consolidated split breakdown (Courier, Organizer, Platform)
 * - Individual delivery details with addresses
 * - Payment status and metadata
 * - Formatted currency and dates
 * 
 * Data Source: GET /api/payments/{id}/report
 * 
 * Props:
 * @param {PaymentReportResponse} report - Complete payment report data
 * @param {Function} onClose - Callback to close modal
 * 
 * Features:
 * - Responsive design (mobile-friendly)
 * - Color-coded status indicators
 * - Percentage and amount display for each recipient
 * - Pickup and delivery address information
 * - Per-delivery split breakdown
 */

interface SplitItem {
  recipientId: string;
  recipientName: string;
  recipientRole: "COURIER" | "ORGANIZER" | "PLATFORM";
  amount: number;
  percentage: number;
  liable: boolean;
}

interface DeliveryItem {
  deliveryId: number;
  shippingFee: number;
  clientName: string;
  pickupAddress: string;
  deliveryAddress: string;
  splits: SplitItem[];
}

interface PaymentReportResponse {
  paymentId: number;
  pagarmeOrderId: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  pixQrCode: string | null;
  pixQrCodeUrl: string | null;
  expiresAt: string | null;
  deliveries: DeliveryItem[];
  consolidatedSplits: SplitItem[];
}

interface PaymentReportModalProps {
  report: PaymentReportResponse;
  onClose: () => void;
}

const PaymentReportModal: React.FC<PaymentReportModalProps> = ({
  report,
  onClose,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      COURIER: "Motoboy",
      ORGANIZER: "Gerente",
      PLATFORM: "Plataforma",
    };
    return labels[role] || role;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      PROCESSING: "Processando",
      COMPLETED: "Completo",
      FAILED: "Falhou",
      REFUNDED: "Reembolsado",
      CANCELLED: "Cancelado",
      EXPIRED: "Expirado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: "#f59e0b",
      PROCESSING: "#3b82f6",
      COMPLETED: "#10b981",
      FAILED: "#ef4444",
      REFUNDED: "#6366f1",
      CANCELLED: "#6b7280",
      EXPIRED: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827" }}>
              Relatório de Pagamento #{report.paymentId}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
              {formatDateTime(report.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiX />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Resumo do Pagamento */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
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
                    backgroundColor: getStatusColor(report.status) + "20",
                    color: getStatusColor(report.status),
                  }}
                >
                  {getStatusLabel(report.status)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Valor Total
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                  {formatCurrency(report.totalAmount)}
                </div>
              </div>
              {report.pagarmeOrderId && (
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                    Order ID Pagar.me
                  </div>
                  <div style={{ fontSize: "14px", color: "#111827", fontFamily: "monospace" }}>
                    {report.pagarmeOrderId}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Splits Consolidados */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiDollarSign /> Distribuição do Pagamento
            </h3>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Recebedor
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Papel
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Percentual
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Valor
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Paga Taxas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.consolidatedSplits.map((split, index) => (
                    <tr
                      key={index}
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "12px", fontSize: "14px", color: "#111827" }}>
                        {split.recipientName}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                        {getRoleLabel(split.recipientRole)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        {split.percentage.toFixed(1)}%
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {formatCurrency(split.amount)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            backgroundColor: split.liable ? "#fee2e2" : "#d1fae5",
                            color: split.liable ? "#dc2626" : "#059669",
                          }}
                        >
                          {split.liable ? "Sim" : "Não"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Entregas */}
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiPackage /> Entregas Incluídas ({report.deliveries.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {report.deliveries.map((delivery, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      Entrega #{delivery.deliveryId}
                    </h4>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      {formatCurrency(delivery.shippingFee)}
                    </div>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                      Cliente
                    </div>
                    <div style={{ fontSize: "14px", color: "#111827" }}>
                      {delivery.clientName}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                        Origem
                      </div>
                      <div style={{ fontSize: "13px", color: "#111827" }}>
                        {delivery.pickupAddress}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                        Destino
                      </div>
                      <div style={{ fontSize: "13px", color: "#111827" }}>
                        {delivery.deliveryAddress}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiUsers /> Divisão desta entrega
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {delivery.splits.map((split, splitIndex) => (
                        <div
                          key={splitIndex}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            backgroundColor: "white",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        >
                          <span style={{ color: "#6b7280" }}>
                            {split.recipientName} ({getRoleLabel(split.recipientRole)})
                          </span>
                          <span style={{ fontWeight: 600, color: "#111827" }}>
                            {formatCurrency(split.amount)} ({split.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReportModal;
