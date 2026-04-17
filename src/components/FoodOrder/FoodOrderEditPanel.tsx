import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { FormContainer, FormField, FormInput } from "../Common/FormComponents";
import printKitchenOrder from "./printKitchenOrder";
import "./FoodOrderEditPanel.css";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  productName: string | null;
  productId: number | null;
}

interface FoodOrder {
  id: number;
  status: string;
  orderType: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  estimatedPreparationMinutes: number | null;
  tableNumber: number | null;
  tableLabel: string | null;
  waiterName: string | null;
  createdAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItem[];
}

interface Props {
  orderId: number;
  viewMode: string;
  onBack: () => void;
}

const STEPS = [
  { key: "ACCEPTED", action: "accept", label: "Aceitar", icon: "✅", color: "#3b82f6" },
  { key: "PREPARING", action: "preparing", label: "Preparar", icon: "👨‍🍳", color: "#8b5cf6" },
  { key: "READY", action: "ready", label: "Pronto", icon: "📦", color: "#06b6d4" },
];

const STATUS_ORDER = ["PLACED", "ACCEPTED", "PREPARING", "READY", "AWAITING_PAYMENT", "DELIVERING", "COMPLETED"];
const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PLACED: { label: "Novo Pedido", color: "#f59e0b", icon: "🔔" },
  ACCEPTED: { label: "Aceito", color: "#3b82f6", icon: "✅" },
  PREPARING: { label: "Em Preparo", color: "#8b5cf6", icon: "👨‍🍳" },
  READY: { label: "Pronto", color: "#06b6d4", icon: "📦" },
  AWAITING_PAYMENT: { label: "Aguardando Pgto", color: "#f97316", icon: "💳" },
  DELIVERING: { label: "Entregando", color: "#10b981", icon: "🏍️" },
  COMPLETED: { label: "Entregue", color: "#10b981", icon: "✔️" },
  CANCELLED: { label: "Cancelado", color: "#ef4444", icon: "❌" },
};

const PRINT_PREF_KEY = "fop_skip_print_prompt";


const FoodOrderEditPanel: React.FC<Props> = ({ orderId, viewMode }) => {
  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [dontAskPrint, setDontAskPrint] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get<FoodOrder>(`/api/orders/${orderId}`);
      setOrder(res.data);
    } catch (e) {
      console.error("Erro ao carregar pedido:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const doAccept = async () => {
    setUpdating(true);
    try {
      await api.patch(`/api/orders/${orderId}/accept`);
      await fetchOrder();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao aceitar pedido");
      setUpdating(false);
      return;
    }
    setUpdating(false);
  };

  const handleAcceptClick = async () => {
    const pref = localStorage.getItem(PRINT_PREF_KEY);
    if (pref === "true") {
      await doAccept();
      if (order) printKitchenOrder(order);
      return;
    }
    if (pref === "skip") {
      await doAccept();
      return;
    }
    setShowPrintModal(true);
  };

  const handlePrintModalConfirm = async (shouldPrint: boolean) => {
    if (dontAskPrint) {
      localStorage.setItem(PRINT_PREF_KEY, shouldPrint ? "true" : "skip");
    }
    setShowPrintModal(false);
    await doAccept();
    if (shouldPrint && order) printKitchenOrder(order);
  };

  const handleAction = async (action: string) => {
    if (action === "accept") {
      await handleAcceptClick();
      return;
    }
    setUpdating(true);
    try {
      if (action === "cancel") {
        await api.patch(`/api/orders/${orderId}/cancel`, { reason: "Cancelado pelo restaurante" });
      } else {
        await api.patch(`/api/orders/${orderId}/${action}`);
      }
      await fetchOrder();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Erro ao atualizar pedido");
    } finally {
      setUpdating(false);
    }
  };

  const fmt = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const fmtMoney = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const whatsappLink = (phone: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    const br = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${br}`;
  };

  if (loading) return <div className="fop-loading"><div className="loading-spinner" /><p>Carregando...</p></div>;
  if (!order) return <div className="fop-loading"><p>Pedido não encontrado</p></div>;

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isTerminal = order.status === "COMPLETED" || order.status === "CANCELLED";
  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "#6b7280", icon: "📋" };

  return (
    <div className="fop-layout">
      {/* Modal de impressão no aceite */}
      {showPrintModal && (
        <div className="fop-modal-overlay">
          <div className="fop-modal">
            <div className="fop-modal-title">Imprimir pedido?</div>
            <p className="fop-modal-text">
              Deseja imprimir o pedido para a cozinha ao aceitar?
            </p>
            <label className="fop-modal-checkbox">
              <input
                type="checkbox"
                checked={dontAskPrint}
                onChange={(e) => setDontAskPrint(e.target.checked)}
              />
              Não perguntar isso novamente
            </label>
            <div className="fop-modal-actions">
              <button
                className="fop-modal-btn fop-modal-btn-secondary"
                onClick={() => handlePrintModalConfirm(false)}
              >
                Apenas aceitar
              </button>
              <button
                className="fop-modal-btn fop-modal-btn-primary"
                onClick={() => handlePrintModalConfirm(true)}
              >
                Aceitar e imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coluna esquerda — botões de status */}
      {viewMode === "edit" && !isTerminal && (
        <div className="fop-sidebar">
          <div className="fop-sidebar-title">Controle</div>
          {STEPS.map((step) => {
            const stepIdx = STATUS_ORDER.indexOf(step.key);
            const isDone = stepIdx <= currentIdx;
            const isNext = stepIdx === currentIdx + 1 || (step.key === "READY" && order.status === "ACCEPTED");
            const canClick = isNext && !isDone;

            return (
              <button
                key={step.key}
                className={`fop-status-btn ${isDone ? "done" : ""} ${isNext && !isDone ? "next" : ""}`}
                style={{
                  borderColor: step.color,
                  backgroundColor: isDone ? step.color : "transparent",
                  color: isDone ? "#fff" : step.color,
                  opacity: canClick || isDone ? 1 : 0.25,
                }}
                disabled={!canClick || updating}
                onClick={() => handleAction(step.action)}
              >
                <span className="fop-btn-icon">{step.icon}</span>
                <span className="fop-btn-label">{step.label}</span>
              </button>
            );
          })}
          {order.status === "AWAITING_PAYMENT" && (
            <button
              className="fop-status-btn next"
              style={{
                borderColor: "#10b981",
                backgroundColor: "transparent",
                color: "#10b981",
              }}
              disabled={updating}
              onClick={() => handleAction("confirm-payment")}
            >
              <span className="fop-btn-icon">💰</span>
              <span className="fop-btn-label">Confirmar Pgto</span>
            </button>
          )}
          <button
            className="fop-status-btn"
            style={{
              borderColor: "#ef4444",
              backgroundColor: "transparent",
              color: "#ef4444",
              opacity: order.status === "DELIVERING" ? 0.25 : 1,
            }}
            disabled={updating || order.status === "DELIVERING"}
            onClick={() => { if (window.confirm("Cancelar este pedido?")) handleAction("cancel"); }}
          >
            <span className="fop-btn-icon">❌</span>
            <span className="fop-btn-label">Cancelar</span>
          </button>
        </div>
      )}

      {/* Coluna direita — detalhes */}
      <div className="fop-content">
        <div className="fop-header">
          <h2>Pedido #{order.id}</h2>
          {order.status !== "PLACED" && order.status !== "CANCELLED" && (
            <button
              className="fop-print-btn"
              onClick={() => printKitchenOrder(order)}
              title="Reimprimir pedido para cozinha"
            >
              Imprimir
            </button>
          )}
          <span className="fop-badge" style={{ backgroundColor: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {/* Informações do pedido — mesmo grid do EntityForm */}
        <FormContainer title="">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            <FormField label="Tipo do Pedido">
              <FormInput value={order.orderType === "DELIVERY" ? "Entrega" : "Mesa"} disabled />
            </FormField>
            {order.tableNumber != null && (
              <FormField label="Mesa">
                <FormInput value={`#${order.tableNumber}${order.tableLabel ? ` — ${order.tableLabel}` : ""}`} disabled />
              </FormField>
            )}
            {order.waiterName && (
              <FormField label="Garçom">
                <FormInput value={order.waiterName} disabled />
              </FormField>
            )}
            <FormField label="Nome">
              <FormInput value={order.customerName || "—"} disabled />
            </FormField>
            <FormField label="Email">
              <FormInput value={order.customerEmail || "—"} disabled />
            </FormField>
            <FormField label="Telefone">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FormInput value={order.customerPhone || "—"} disabled style={{ flex: 1 }} />
                {order.customerPhone && (
                  <a href={whatsappLink(order.customerPhone) || "#"} target="_blank" rel="noopener noreferrer" className="fop-whatsapp-link">
                    WhatsApp ↗
                  </a>
                )}
              </div>
            </FormField>
            <FormField label="Endereço de entrega">
              <FormInput value={order.deliveryAddress || "—"} disabled />
            </FormField>
            <FormField label="Data do pedido">
              <FormInput value={fmt(order.createdAt)} disabled />
            </FormField>
            <FormField label="Tempo estimado">
              <FormInput value={order.estimatedPreparationMinutes ? `${order.estimatedPreparationMinutes} min` : "—"} disabled />
            </FormField>
          </div>
          {order.notes && (
            <div style={{ marginTop: 16 }}>
              <FormField label="Observações">
                <FormInput value={order.notes} disabled className="fop-notes-input" />
              </FormField>
            </div>
          )}
        </FormContainer>

        {/* Itens — tabela direta sem card wrapper */}
        <div className="fop-items-table-wrapper">
            <table className="entity-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Qtd</th>
                  <th>Item</th>
                  <th style={{ width: 120, textAlign: "right" }}>Preço Unit.</th>
                  <th style={{ width: 120, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.quantity}x</strong></td>
                    <td>
                      {item.productName || "Item"}
                      {item.notes && <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2 }}>📝 {item.notes}</div>}
                    </td>
                    <td style={{ textAlign: "right" }}>{fmtMoney(item.unitPrice)}</td>
                    <td style={{ textAlign: "right" }}>{fmtMoney(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fop-tfoot-row">
                  <td colSpan={3} style={{ textAlign: "right" }}>Subtotal</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(order.subtotal)}</td>
                </tr>
                <tr className="fop-tfoot-row">
                  <td colSpan={3} style={{ textAlign: "right" }}>Taxa de entrega</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(order.deliveryFee || 0)}</td>
                </tr>
                <tr className="fop-tfoot-total">
                  <td colSpan={3} style={{ textAlign: "right" }}>Total</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        {/* Timeline horizontal */}
        <FormContainer title="">
          <div className="fop-tl-horizontal">
            {[
              { label: "Criado", date: order.createdAt },
              { label: "Aceito", date: order.acceptedAt },
              { label: "Preparo", date: order.preparingAt },
              { label: "Pronto", date: order.readyAt },
              { label: "Entregue", date: order.completedAt },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className={`fop-tl-h-step ${step.date ? "done" : ""}`}>
                  <span className="fop-tl-h-dot" />
                  <span className="fop-tl-h-label">{step.label}</span>
                  <span className="fop-tl-h-date">{fmt(step.date)}</span>
                </div>
                {i < arr.length - 1 && <div className={`fop-tl-h-line ${step.date ? "done" : ""}`} />}
              </React.Fragment>
            ))}
          </div>
          {order.cancelledAt && (
            <div className="fop-tl-cancelled">
              ❌ Cancelado{order.cancellationReason ? `: ${order.cancellationReason}` : ""} — {fmt(order.cancelledAt)}
            </div>
          )}
        </FormContainer>
      </div>
    </div>
  );
};

export default FoodOrderEditPanel;
