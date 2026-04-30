import { useState } from "react";
import { FiArrowLeft, FiEdit2, FiPlus, FiSend, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { getUserId, getUserName } from "../../../utils/auth";
import { printRound, getSavedBridgeUrl } from "../../../services/printBridge";
import ItemsTableSection from "./ItemsTableSection";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_OPTIONS,
  TABLE_STATUS_COLORS,
  TABLE_STATUS_LABELS,
  commandLabel,
} from "./types";
import type {
  BillBreakdown,
  FlowViewProps,
  OrderCommand,
  OrderInfo,
  PendingItem,
} from "./types";

/**
 * View 1 do fluxo: dashboard da mesa.
 *
 * - Header com título + status da mesa
 * - Status bar com ênfase em Pedido #N + badge de status
 * - Barra de comandas (chips + add + fechar mesa/comanda)
 * - Tabela inline de itens lançados (ItemsTableSection)
 * - Card de drafts pendentes (click → edita)
 * - Card de cancelamentos com X pra desfazer
 * - Footer fixo "Enviar Pedido/Atualização"
 * - Modais: renomear, breakdown, pagamento (mesa toda), pagamento parcial, confirmar pgto
 */
export default function DetailView(props: FlowViewProps) {
  const {
    table, data, navigate, onExit, onUpdated,
    activeCommandId, setActiveCommandId,
    pendingItems, setPendingItems,
    cancelledItemIds, setCancelledItemIds,
  } = props;
  const routerNav = useNavigate();
  const clientId = getUserId();

  const [sending, setSending] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [renameTarget, setRenameTarget] = useState<OrderCommand | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [breakdown] = useState<BillBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [closingTarget, setClosingTarget] = useState<{ commandId: number | null; label: string; subtotal: number } | null>(null);

  const order = data.existingOrder;
  const itemCount = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const total = order?.total ?? 0;

  const pendingCount = pendingItems.reduce((s, p) => s + p.quantity, 0);
  const pendingTotal = pendingItems.reduce(
    (s, p) => s + p.unitPrice * p.quantity + p.addons.reduce((as, a) => as + a.unitPrice * a.quantity, 0),
    0,
  );
  const hasChanges = pendingItems.length > 0 || cancelledItemIds.size > 0;

  const hasMesaItems = !!order?.items.some((i) => i.commandId === null);
  const mesaPaid = order?.mesaStatus === "PAID";

  // -------- Comandas -------------------------------------------------------

  const handleAddCommand = async () => {
    try {
      let current = order;
      if (!current) {
        if (!clientId) return;
        const r = await api.post("/api/orders/table", { clientId, tableId: table.id, items: [] });
        current = r.data as OrderInfo;
        data.setExistingOrder(current);
      }
      const r = await api.post(`/api/orders/${current.id}/commands`, {});
      const newCmd = r.data as OrderCommand;
      data.setCommands((prev) => [...prev, newCmd]);
      setActiveCommandId(newCmd.id);
      setRenameTarget(newCmd);
      setRenameValue("");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao criar comanda");
    }
  };

  const handleRenameCommand = async () => {
    if (!renameTarget || !order) return;
    const newName = renameValue.trim() || null;
    try {
      const r = await api.patch(`/api/orders/${order.id}/commands/${renameTarget.id}`, { name: newName });
      const updated = r.data as OrderCommand;
      data.setCommands((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setRenameTarget(null);
      setRenameValue("");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao renomear comanda");
    }
  };

  const handleDeleteCommand = async (cmd: OrderCommand) => {
    if (!order) return;
    if (!window.confirm(`Remover ${commandLabel(cmd)}?`)) return;
    try {
      await api.delete(`/api/orders/${order.id}/commands/${cmd.id}`);
      data.setCommands((prev) => prev.filter((c) => c.id !== cmd.id));
      if (activeCommandId === cmd.id) setActiveCommandId(null);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao remover comanda");
    }
  };

  // -------- Envio -----------------------------------------------------------

  const handleSend = async () => {
    if (!hasChanges || !clientId) return;
    setSending(true);
    try {
      // 1. Cancelamentos
      let workingOrder: OrderInfo | null = order;
      if (workingOrder) {
        for (const itemId of cancelledItemIds) {
          try { await api.delete(`/api/orders/${workingOrder.id}/items/${itemId}`); } catch { /* tenta os outros */ }
        }
      }

      // 2. Adições — 1 OrderItemRequest por draft (sem agregação)
      const requests = pendingItems.map((p: PendingItem) => ({
        productId: p.productId,
        quantity: p.quantity,
        commandId: p.commandId ?? undefined,
        observation: p.observation,
        addons: p.addons.length > 0
          ? p.addons.map((a) => ({ productId: a.productId, quantity: a.quantity }))
          : undefined,
      }));

      let created: OrderInfo | null = null;
      if (requests.length > 0) {
        if (workingOrder) {
          await api.post(`/api/orders/${workingOrder.id}/add-items`, { items: requests });
        } else {
          const r = await api.post("/api/orders/table", { clientId, tableId: table.id, items: requests });
          created = r.data as OrderInfo;
        }
      }

      // 3. Imprimir recibo
      const labelForCommand = (cmdId: number | null): string | null => {
        if (cmdId === null) return null;
        const cmd = data.commands.find((c) => c.id === cmdId);
        return cmd ? commandLabel(cmd) : null;
      };
      const cancelledMeta = order ? order.items.filter((i) => cancelledItemIds.has(i.id)) : [];
      const obsLines = pendingItems
        .filter((p) => p.observation && p.observation.trim())
        .map((p) => `${p.quantity}x ${p.productName}: ${p.observation!.trim()}`);
      const receiptNotes = obsLines.length > 0 ? obsLines.join("\n") : null;
      const printSource = workingOrder ?? created;
      // Flag do estabelecimento (server-side): se false, pula toda impressão automática.
      const autoPrintEnabled = (printSource as { storeAutoPrintEnabled?: boolean })?.storeAutoPrintEnabled !== false;
      if (autoPrintEnabled && getSavedBridgeUrl()) {
        const r = await printRound({
          orderId: printSource?.id ?? null,
          tableNumber: table.number,
          establishmentName: printSource?.storeName ?? "",
          storeDocument: printSource?.storeDocument ?? null,
          storePhone: printSource?.storePhone ?? null,
          storeAddress: printSource?.storeAddress ?? null,
          waiterName: getUserName() || "Balcão",
          newItems: pendingItems.map((p) => ({
            productName: p.productName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            commandLabel: labelForCommand(p.commandId),
          })),
          cancelledItems: cancelledMeta.map((it) => ({
            productName: it.productName,
            quantity: it.quantity,
            commandLabel: labelForCommand(it.commandId),
          })),
          notes: receiptNotes,
        });
        if (!r.ok) console.warn("[BridgePrint] round print falhou:", r.error);
      }

      // 4. Reset + refresh
      setPendingItems([]);
      setCancelledItemIds(new Set());
      await data.refresh();
      onUpdated();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.response?.data?.error || "Erro ao enviar pedido");
    } finally {
      setSending(false);
    }
  };

  // -------- Fechar conta ---------------------------------------------------

  const handleOpenCloseActive = async () => {
    if (!order) return;
    try {
      const r = await api.get<BillBreakdown>(`/api/orders/${order.id}/bill-breakdown`);
      const bd = r.data;
      if (activeCommandId === null) {
        if (bd.mesa.status === "PAID") { alert("Mesa já foi paga."); return; }
        if (bd.mesa.items.length === 0) { alert("Mesa não tem itens para fechar."); return; }
        setClosingTarget({ commandId: null, label: "Mesa", subtotal: bd.mesa.subtotal });
      } else {
        const cb = bd.commands.find((c) => c.id === activeCommandId);
        if (!cb) return;
        if (cb.status === "PAID") { alert("Comanda já foi paga."); return; }
        if (cb.items.length === 0) { alert("Comanda não tem itens para fechar."); return; }
        setClosingTarget({ commandId: cb.id, label: cb.name || `Comanda #${cb.displayNumber}`, subtotal: cb.subtotal });
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao carregar comanda");
    }
  };

  const handleConfirmClosePartial = async (paymentMethod: string) => {
    if (!order || !closingTarget) return;
    setClosingBill(true);
    try {
      await api.patch(`/api/orders/${order.id}/close-partial`, {
        commandId: closingTarget.commandId,
        paymentMethod,
      });
      setClosingTarget(null);
      await data.refresh();
      onUpdated();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao fechar");
    } finally {
      setClosingBill(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    if (!window.confirm(`Mesa #${table.number} — R$ ${total.toFixed(2).replace(".", ",")}\n\nCliente efetuou o pagamento?`)) return;
    setClosingBill(true);
    try {
      await api.patch(`/api/orders/${order.id}/confirm-payment`, {});
      await data.refresh();
      onUpdated();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao confirmar pagamento");
    } finally {
      setClosingBill(false);
    }
  };

  // -------- Render ----------------------------------------------------------

  return (
    <div className="tfe-view">
      {/* Header */}
      <div className="tom-header">
        <div className="tom-header-left">
          <button className="tfe-back-btn" onClick={onExit} title="Fechar"><FiArrowLeft size={20} /></button>
          <h2>Mesa #{table.number}</h2>
          <span className="tom-status-badge" style={{ background: TABLE_STATUS_COLORS[data.tableStatus] }}>
            {TABLE_STATUS_LABELS[data.tableStatus]}
          </span>
        </div>
      </div>

      {/* Status bar: ênfase em Pedido #N + badge de status */}
      {order && (
        <div
          className={`tfe-status-bar ${order.status === "AWAITING_PAYMENT" ? "awaiting-payment" : "in-progress"}`}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className={`tfe-status-order-link ${order.status === "AWAITING_PAYMENT" ? "awaiting" : "progress"}`}
                onClick={() => { const id = order.id; onExit(); routerNav(`/pedidos?orderId=${id}`); }}
                title="Abrir detalhes do pedido"
              >
                Pedido #{order.id}
              </span>
              <span style={{
                background: ORDER_STATUS_COLORS[order.status] || "#94a3b8",
                color: "#fff", padding: "3px 8px", borderRadius: 6,
                fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5,
              }}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <div className="tfe-status-subline">
              {itemCount} itens — R$ {total.toFixed(2).replace(".", ",")}
            </div>
          </div>
          {order.status === "AWAITING_PAYMENT" && (
            <button className="tom-action-btn confirm" onClick={handleConfirmPayment} disabled={closingBill}>
              {closingBill ? "Confirmando..." : "Confirmar Pgto"}
            </button>
          )}
        </div>
      )}

      {/* Commands bar */}
      {(data.commands.length > 0 || hasMesaItems) && (() => {
        const activeCmd = activeCommandId !== null ? data.commands.find((c) => c.id === activeCommandId) : null;
        const activeIsPaid = activeCommandId === null ? mesaPaid : activeCmd?.status === "PAID";
        const activeHasItems = !!order?.items.some((i) =>
          activeCommandId === null ? i.commandId === null : i.commandId === activeCommandId,
        );
        const canCloseActive = !!activeHasItems && !activeIsPaid;
        return (
          <div className="tom-commands-tabs">
            {hasMesaItems && (
              <button
                className={`tom-cmd-tab ${activeCommandId === null ? "active" : ""} ${mesaPaid ? "paid" : ""}`}
                onClick={() => setActiveCommandId(null)}
                title={mesaPaid ? "Mesa paga" : "Itens na mesa"}
              >
                Mesa{mesaPaid && <span className="tom-cmd-paid-badge">✓</span>}
              </button>
            )}
            {data.commands.map((cmd) => {
              const isPaid = cmd.status === "PAID";
              return (
                <button
                  key={cmd.id}
                  className={`tom-cmd-tab ${activeCommandId === cmd.id ? "active" : ""} ${isPaid ? "paid" : ""}`}
                  onClick={() => setActiveCommandId(cmd.id)}
                  onDoubleClick={() => { if (!isPaid) { setRenameTarget(cmd); setRenameValue(cmd.name || ""); } }}
                  title={isPaid ? `${commandLabel(cmd)} — paga` : "Dois cliques pra renomear"}
                >
                  {commandLabel(cmd)}
                  {isPaid ? (
                    <span className="tom-cmd-paid-badge">✓</span>
                  ) : (
                    <span
                      className="tom-cmd-tab-del"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCommand(cmd); }}
                      title="Remover comanda"
                    >×</span>
                  )}
                </button>
              );
            })}
            <button className="tom-cmd-tab tom-cmd-add" onClick={handleAddCommand} title="Adicionar comanda">
              <FiPlus size={14} />
            </button>
            <div className="tom-cmd-spacer" />
            {canCloseActive && (
              <button
                className="tom-cmd-close-btn"
                onClick={handleOpenCloseActive}
                disabled={closingBill}
              >
                Fechar {activeCommandId === null ? "Mesa" : (activeCmd ? commandLabel(activeCmd) : "")}
              </button>
            )}
          </div>
        );
      })()}

      <div className="tfe-view-body" style={{ paddingBottom: hasChanges ? 120 : 16 }}>
        {/* Drafts pendentes */}
        {pendingItems.length > 0 && (
          <div className="tfe-card tfe-card-pending">
            <div className="tfe-card-header">
              ITENS PENDENTES ({pendingCount})
            </div>
            {pendingItems.map((p) => {
              const itemTotal = p.unitPrice * p.quantity + p.addons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);
              return (
                <div
                  key={p.draftId}
                  className="tfe-pending-row"
                  onClick={() => navigate({ kind: "product", productId: p.productId, editingDraftId: p.draftId })}
                  title="Editar rascunho"
                >
                  <div className="tfe-pending-main">
                    <span className="tfe-pending-qty">{p.quantity}x</span>
                    <div className="tfe-pending-name">
                      {p.productName}
                    </div>
                    <span className="tfe-pending-price">
                      R$ {itemTotal.toFixed(2).replace(".", ",")}
                    </span>
                    <FiEdit2 size={16} color="#94a3b8" />
                    <button
                      className="tfe-draft-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingItems((prev) => prev.filter((x) => x.draftId !== p.draftId));
                      }}
                      title="Remover rascunho"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  {p.addons.length > 0 && (
                    <div className="tfe-pending-addons">
                      {p.addons.map((a) => (
                        <div key={a.productId} className="tfe-pending-addon-line">
                          + {a.quantity}x {a.productName} (+R$ {(a.unitPrice * a.quantity).toFixed(2).replace(".", ",")})
                        </div>
                      ))}
                    </div>
                  )}
                  {p.observation && (
                    <div className="tfe-pending-obs">
                      Obs: {p.observation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {cancelledItemIds.size > 0 && (
          <div className="tfe-card tfe-card-cancelled">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="tfe-card-header" style={{ color: "#ef4444", flex: 1 }}>
                CANCELAMENTOS PENDENTES ({cancelledItemIds.size})
              </div>
              <button
                className="tfe-draft-remove"
                style={{ color: "#ef4444" }}
                onClick={() => setCancelledItemIds(new Set())}
                title="Desfazer todos"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Tabela inline de itens lançados */}
        <ItemsTableSection
          table={table}
          data={data}
          activeCommandId={activeCommandId}
          setActiveCommandId={setActiveCommandId}
          cancelledItemIds={cancelledItemIds}
          setCancelledItemIds={setCancelledItemIds}
        />

        {/* Botão adicionar item */}
        <button
          className="tfe-action-btn add-item"
          onClick={() => navigate({ kind: "menu" })}
          style={{ marginTop: 16 }}
        >
          <FiPlus size={18} /> Adicionar item
        </button>
      </div>

      {/* Footer fixo: enviar drafts */}
      {hasChanges && (
        <div className="tfe-footer">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {pendingCount > 0 && <span style={{ color: "#8b5cf6", fontWeight: 700 }}>+{pendingCount}</span>}
              {pendingCount > 0 && cancelledItemIds.size > 0 && " | "}
              {cancelledItemIds.size > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}>−{cancelledItemIds.size}</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              R$ {pendingTotal.toFixed(2).replace(".", ",")}
            </div>
          </div>
          <button className="tfe-send-btn" onClick={handleSend} disabled={sending}>
            <FiSend size={16} /> {sending ? "Enviando..." : order ? "Enviar Atualização" : "Enviar Pedido"}
          </button>
        </div>
      )}

      {/* Modal: renomear comanda */}
      {renameTarget && (
        <div className="tom-payment-overlay" onClick={() => setRenameTarget(null)}>
          <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nome da {commandLabel(renameTarget)}</h3>
            <p>Deixe em branco pra usar "Comanda #{renameTarget.displayNumber}"</p>
            <input
              className="tom-notes-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Ex: Ana, João..."
              autoFocus
              maxLength={50}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameCommand(); }}
            />
            <div className="tom-payment-options">
              <button className="tom-payment-btn" onClick={handleRenameCommand}>Salvar</button>
            </div>
            <button className="tom-payment-cancel" onClick={() => setRenameTarget(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal: breakdown */}
      {showBreakdown && breakdown && (
        <div className="tom-payment-overlay" onClick={() => setShowBreakdown(false)}>
          <div className="tom-payment-modal tom-breakdown-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Conta Mesa #{table.number}</h3>
            <div className="tom-breakdown-list">
              {breakdown.mesa.items.length > 0 && (
                <div className={`tom-breakdown-row ${breakdown.mesa.status === "PAID" ? "paid" : ""}`}>
                  <div className="tom-breakdown-name">
                    Mesa {breakdown.mesa.status === "PAID" && <span className="tom-breakdown-badge">PAGO</span>}
                  </div>
                  <div className="tom-breakdown-total">
                    <strong>R$ {breakdown.mesa.subtotal.toFixed(2).replace(".", ",")}</strong>
                  </div>
                </div>
              )}
              {breakdown.commands.map((cb) => (
                <div key={cb.id} className={`tom-breakdown-row ${cb.status === "PAID" ? "paid" : ""}`}>
                  <div className="tom-breakdown-name">
                    {cb.name || `Comanda #${cb.displayNumber}`}
                    {cb.status === "PAID" && <span className="tom-breakdown-badge">PAGO</span>}
                  </div>
                  <div className="tom-breakdown-total">
                    <strong>R$ {cb.subtotal.toFixed(2).replace(".", ",")}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="tom-breakdown-grand">
              Total: <strong>R$ {breakdown.grandTotal.toFixed(2).replace(".", ",")}</strong>
            </div>
            <div className="tom-payment-options">
              <button className="tom-payment-btn" onClick={() => { setShowBreakdown(false); setShowPaymentModal(true); }}>
                Fechar Mesa
              </button>
            </div>
            <button className="tom-payment-cancel" onClick={() => setShowBreakdown(false)}>Voltar</button>
          </div>
        </div>
      )}

      {/* Modal: pagamento parcial */}
      {closingTarget && (
        <div className="tom-payment-overlay" onClick={() => setClosingTarget(null)}>
          <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Fechar {closingTarget.label}</h3>
            <p>Subtotal: <strong>R$ {closingTarget.subtotal.toFixed(2).replace(".", ",")}</strong></p>
            <span className="tom-section-label">Forma de pagamento:</span>
            <div className="tom-payment-options">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className="tom-payment-btn"
                  onClick={() => handleConfirmClosePartial(opt.key)}
                  disabled={closingBill}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button className="tom-payment-cancel" onClick={() => setClosingTarget(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal de pagamento (mesa toda) — mantido pro fluxo de breakdown */}
      {showPaymentModal && order && (
        <div className="tom-payment-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Fechar Conta</h3>
            <p>Mesa #{table.number} — R$ {total.toFixed(2).replace(".", ",")}</p>
            <span className="tom-section-label">Forma de pagamento:</span>
            <div className="tom-payment-options">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className="tom-payment-btn"
                  disabled={closingBill}
                  onClick={async () => {
                    setClosingBill(true);
                    setShowPaymentModal(false);
                    try {
                      const bd = breakdown ?? (await api.get<BillBreakdown>(`/api/orders/${order.id}/bill-breakdown`)).data;
                      if (bd.mesa.status === "OPEN" && bd.mesa.items.length > 0) {
                        await api.patch(`/api/orders/${order.id}/close-partial`, { commandId: null, paymentMethod: opt.key });
                      }
                      for (const cb of bd.commands) {
                        if (cb.status === "OPEN" && cb.items.length > 0) {
                          await api.patch(`/api/orders/${order.id}/close-partial`, { commandId: cb.id, paymentMethod: opt.key });
                        }
                      }
                      await api.post(`/api/orders/${order.id}/auto-complete`);
                      onUpdated();
                      const targetId = order.id;
                      onExit();
                      routerNav(`/pedidos?orderId=${targetId}`);
                    } catch (e: any) {
                      alert(e?.response?.data?.error || "Erro ao fechar conta");
                    } finally {
                      setClosingBill(false);
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button className="tom-payment-cancel" onClick={() => setShowPaymentModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
