import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { FormContainer, FormField, FormInput } from "../Common/FormComponents";
import { buildStoreHeader, escapeHtml as escapeHtmlShared, PRINT_STYLES } from "./printHeader";
import BridgePrintButton from "../Common/BridgePrintButton";
import { printOrder as printOrderViaBridge, getSavedBridgeUrl } from "../../services/printBridge";
import "./FoodOrderEditPanel.css";

interface OrderItemAddon {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  observation?: string | null;
  addons?: OrderItemAddon[];
  productName: string | null;
  productId: number | null;
  commandId: number | null;
  packaged: boolean;
}

interface OrderCommand {
  id: number;
  displayNumber: number;
  name: string | null;
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
  storeName: string | null;
  storeDocument: string | null;
  storePhone: string | null;
  storeAddress: string | null;
  storeAutoPrintEnabled?: boolean;
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
  const navigate = useNavigate();
  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [commands, setCommands] = useState<OrderCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [dontAskPrint, setDontAskPrint] = useState(false);
  const [packagingItemId, setPackagingItemId] = useState<number | null>(null);

  const fetchOrder = async () => {
    try {
      const [orderRes, cmdsRes] = await Promise.all([
        api.get<FoodOrder>(`/api/orders/${orderId}`),
        api.get<OrderCommand[]>(`/api/orders/${orderId}/commands`).catch(() => ({ data: [] as OrderCommand[] })),
      ]);
      setOrder(orderRes.data);
      setCommands(cmdsRes.data || []);
    } catch (e) {
      console.error("Erro ao carregar pedido:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const togglePackaged = async (itemId: number, packaged: boolean) => {
    setPackagingItemId(itemId);
    // Atualização otimista pra UI responder imediatamente
    setOrder((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) => i.id === itemId ? { ...i, packaged } : i),
    } : prev);
    try {
      await api.patch(`/api/orders/${orderId}/items/${itemId}/packaged`, { packaged });
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao marcar item");
      // Reverte em caso de erro
      setOrder((prev) => prev ? {
        ...prev,
        items: prev.items.map((i) => i.id === itemId ? { ...i, packaged: !packaged } : i),
      } : prev);
    } finally {
      setPackagingItemId(null);
    }
  };

  const handlePrintPackaging = () => {
    if (!order) return;
    const packed = (order.items || []).filter((i) => i.packaged);
    if (packed.length === 0) return;
    const cmdLabel = (commandId: number | null) => {
      if (commandId == null) return "Mesa";
      const c = commands.find((x) => x.id === commandId);
      return c ? (c.name || `Comanda #${c.displayNumber}`) : `#${commandId}`;
    };
    const orderForCommand = (commandId: number | null): number => {
      if (commandId == null) return -1;
      const c = commands.find((x) => x.id === commandId);
      return c ? c.displayNumber : Number.MAX_SAFE_INTEGER;
    };
    const sorted = [...packed].sort((a, b) => orderForCommand(a.commandId) - orderForCommand(b.commandId));
    // Monta groups
    const groups = new Map<number | null, OrderItem[]>();
    for (const it of sorted) {
      const k = it.commandId ?? null;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(it);
    }
    const headerHtml = buildStoreHeader({
      storeName: order.storeName,
      storeDocument: order.storeDocument,
      storePhone: order.storePhone,
      storeAddress: order.storeAddress,
      tableNumber: order.tableNumber,
    });
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Embalagem — Pedido #${order.id}</title>`;
    html += `<style>${PRINT_STYLES}</style></head><body>`;
    html += headerHtml;
    html += `<div class="ph-section-title">📦 EMPACOTAR #${order.id}</div>`;
    html += `<div class="ph-divider"></div>`;
    for (const [cmdId, items] of groups) {
      html += `<div class="ph-cmd-title">${escapeHtmlShared(cmdLabel(cmdId))}</div>`;
      html += `<table class="ph-items">`;
      for (const it of items) {
        html += `<tr><td class="ph-qty"><strong>${it.quantity}x</strong></td><td>${escapeHtmlShared(it.productName || "Item")}</td></tr>`;
        if (it.notes) html += `<tr><td colspan="2" class="ph-note">📝 ${escapeHtmlShared(it.notes)}</td></tr>`;
      }
      html += `</table>`;
    }
    html += `</body></html>`;
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 100);
  };

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
    // Flag do estabelecimento: se false, aceita sem modal nem impressão automática.
    if (order?.storeAutoPrintEnabled === false) {
      await doAccept();
      return;
    }
    const pref = localStorage.getItem(PRINT_PREF_KEY);
    if (pref === "true") {
      await doAccept();
      if (order) silentPrintViaBridge(order.id);
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
    if (shouldPrint && order) silentPrintViaBridge(order.id);
  };

  /** Auto-print silencioso via bridge (sem alert se falhar). */
  const silentPrintViaBridge = async (id: number) => {
    if (!getSavedBridgeUrl()) return;
    const r = await printOrderViaBridge(id, "80mm");
    if (!r.ok) console.warn("[BridgePrint] auto-print falhou:", r.error);
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
            <BridgePrintButton orderId={order.id} paperWidth="80mm" label="Imprimir" />
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
            {order.tableNumber != null && (() => {
              const isFinal = order.status === "COMPLETED" || order.status === "CANCELLED";
              const label = `#${order.tableNumber}${order.tableLabel ? ` — ${order.tableLabel}` : ""}`;
              return (
                <FormField label="Mesa">
                  {isFinal ? (
                    <FormInput value={label} disabled />
                  ) : (
                    <div
                      className="fop-table-link"
                      onClick={() => navigate(`/mesas?openTable=${order.tableNumber}`)}
                      title="Abrir popup da mesa"
                    >
                      {label}
                    </div>
                  )}
                </FormField>
              );
            })()}
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
            {(() => {
              const isTableOrder = order.tableNumber != null;
              const cmdLabel = (commandId: number | null) => {
                if (commandId == null) return "Mesa";
                const c = commands.find((x) => x.id === commandId);
                return c ? (c.name || `Comanda #${c.displayNumber}`) : `#${commandId}`;
              };
              // Ordena os itens: Mesa (commandId null) primeiro; depois comandas por displayNumber
              const orderForCommand = (commandId: number | null): number => {
                if (commandId == null) return -1;
                const c = commands.find((x) => x.id === commandId);
                return c ? c.displayNumber : Number.MAX_SAFE_INTEGER;
              };
              const sortedItems = [...(order.items || [])].sort((a, b) => {
                const oa = orderForCommand(a.commandId);
                const ob = orderForCommand(b.commandId);
                if (oa !== ob) return oa - ob;
                return a.id - b.id;
              });
              // Mapa commandId → subtotal
              const subtotalByCmd = new Map<number | null, number>();
              for (const it of sortedItems) {
                const k = it.commandId ?? null;
                subtotalByCmd.set(k, (subtotalByCmd.get(k) || 0) + it.unitPrice * it.quantity);
              }
              const colCount = isTableOrder ? 6 : 4;
              return (
            <table className="entity-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Qtd</th>
                  <th>Item</th>
                  {isTableOrder && <th style={{ width: 140 }}>Comanda</th>}
                  <th style={{ width: 120, textAlign: "right" }}>Preço Unit.</th>
                  <th style={{ width: 120, textAlign: "right" }}>Total</th>
                  {isTableOrder && <th style={{ width: 100, textAlign: "center" }}>Empacotar</th>}
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, idx) => {
                  const prev = idx > 0 ? sortedItems[idx - 1] : null;
                  const cmdChanged = !prev || prev.commandId !== item.commandId;
                  const next = idx < sortedItems.length - 1 ? sortedItems[idx + 1] : null;
                  const lastOfGroup = !next || next.commandId !== item.commandId;
                  const addons = item.addons ?? [];
                  const addonsTotal = addons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);
                  const lineTotal = item.unitPrice * item.quantity + addonsTotal;
                  const obsText = item.observation || item.notes;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cmdChanged && isTableOrder ? "fop-cmd-first" : ""}>
                        <td><strong>{item.quantity}x</strong></td>
                        <td>
                          {item.productName || "Item"}
                          {addons.map((a) => (
                            <div key={a.id} style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
                              + {a.quantity}x {a.productName} (+{fmtMoney(a.unitPrice * a.quantity)})
                            </div>
                          ))}
                          {obsText && (
                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2, fontStyle: "italic" }}>
                              📝 {obsText}
                            </div>
                          )}
                        </td>
                        {isTableOrder && <td>{cmdLabel(item.commandId)}</td>}
                        <td style={{ textAlign: "right" }}>{fmtMoney(item.unitPrice)}</td>
                        <td style={{ textAlign: "right" }}>{fmtMoney(lineTotal)}</td>
                        {isTableOrder && (
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!item.packaged}
                              onChange={(e) => togglePackaged(item.id, e.target.checked)}
                              disabled={packagingItemId === item.id}
                              title="Empacotar pra viagem"
                            />
                          </td>
                        )}
                      </tr>
                      {isTableOrder && lastOfGroup && (
                        <tr className="fop-cmd-subtotal">
                          <td colSpan={colCount - 2} style={{ textAlign: "right", fontWeight: 600 }}>
                            Subtotal {cmdLabel(item.commandId)}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            {fmtMoney(subtotalByCmd.get(item.commandId) || 0)}
                          </td>
                          <td />
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="fop-tfoot-row">
                  <td colSpan={isTableOrder ? colCount - 2 : colCount - 1} style={{ textAlign: "right" }}>Subtotal</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(order.subtotal)}</td>
                  {isTableOrder && (
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="fop-pack-btn"
                        onClick={handlePrintPackaging}
                        disabled={!(order.items || []).some((i) => i.packaged)}
                        title="Imprimir etiqueta dos itens marcados pra viagem"
                      >
                        📦 Empacotar
                      </button>
                    </td>
                  )}
                </tr>
                <tr className="fop-tfoot-row">
                  <td colSpan={isTableOrder ? colCount - 2 : colCount - 1} style={{ textAlign: "right" }}>Taxa de entrega</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(order.deliveryFee || 0)}</td>
                  {isTableOrder && <td />}
                </tr>
                <tr className="fop-tfoot-total">
                  <td colSpan={isTableOrder ? colCount - 2 : colCount - 1} style={{ textAlign: "right" }}>Total</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(order.total)}</td>
                  {isTableOrder && <td />}
                </tr>
              </tfoot>
            </table>
              );
            })()}
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
