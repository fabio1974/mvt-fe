import { useMemo, useState } from "react";
import { FiPackage, FiRefreshCw, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { api } from "../../../services/api";
import { commandLabel } from "./types";
import type { OrderInfo, RestaurantTable, TableFlowData } from "./types";

type MoveMode =
  | { kind: "single"; id: number; productName: string; quantity: number; commandId: number | null }
  | { kind: "bulk"; itemIds: number[]; count: number; sourceCommandId: number | null };

interface Props {
  table: RestaurantTable;
  data: TableFlowData;
  activeCommandId: number | null;
  setActiveCommandId: (id: number | null) => void;
  cancelledItemIds: Set<number>;
  setCancelledItemIds: React.Dispatch<React.SetStateAction<Set<number>>>;
}

/**
 * Tabela inline de itens lançados — renderizada dentro da DetailView.
 *
 * Filtra por activeCommandId. Por item: marca/desmarca empacotado (PATCH otimista),
 * move entre comandas (modal single/bulk), cancela (toggle em cancelledItemIds).
 * Header tem bulk actions: empacotar todos (ícone pacote), mover todos, cancelar todos com confirm.
 *
 * Após move (single/bulk), troca o tab ativo pra comanda destino.
 */
export default function ItemsTableSection({
  table, data, activeCommandId, setActiveCommandId,
  cancelledItemIds, setCancelledItemIds,
}: Props) {
  const [packagingItemId, setPackagingItemId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [moveMode, setMoveMode] = useState<MoveMode | null>(null);

  const order = data.existingOrder;

  const items = useMemo(() => {
    if (!order) return [];
    return order.items.filter((i) => activeCommandId === null
      ? i.commandId === null
      : i.commandId === activeCommandId);
  }, [order, activeCommandId]);

  if (!order || order.items.length === 0) return null;

  const subtotal = items.reduce(
    (s, i) => s + i.unitPrice * i.quantity + (i.addons ?? []).reduce((as, a) => as + a.unitPrice * a.quantity, 0),
    0,
  );
  const hasPackaged = order.items.some((i) => i.packaged);
  const allPacked = items.length > 0 && items.every((i) => i.packaged);
  const allCancelled = items.length > 0 && items.every((i) => cancelledItemIds.has(i.id));
  const showMoveCol = data.commands.length > 0;

  const activeCmdName = activeCommandId === null ? "Mesa" : (
    data.commands.find((c) => c.id === activeCommandId)
      ? commandLabel(data.commands.find((c) => c.id === activeCommandId)!)
      : "Comanda"
  );

  const togglePackaged = async (itemId: number, packaged: boolean) => {
    setPackagingItemId(itemId);
    data.setExistingOrder((prev: OrderInfo | null) => prev ? {
      ...prev,
      items: prev.items.map((i) => i.id === itemId ? { ...i, packaged } : i),
    } : prev);
    try {
      await api.patch(`/api/orders/${order.id}/items/${itemId}/packaged`, { packaged });
    } catch (e: any) {
      data.setExistingOrder((prev: OrderInfo | null) => prev ? {
        ...prev,
        items: prev.items.map((i) => i.id === itemId ? { ...i, packaged: !packaged } : i),
      } : prev);
      alert(e?.response?.data?.error || "Erro ao marcar item");
    } finally {
      setPackagingItemId(null);
    }
  };

  const togglePackagedAll = async () => {
    if (items.length === 0) return;
    const nextState = !allPacked;
    setBulkBusy(true);
    data.setExistingOrder((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) => items.some((x) => x.id === i.id) ? { ...i, packaged: nextState } : i),
    } : prev);
    try {
      for (const it of items) {
        if (it.packaged !== nextState) {
          try { await api.patch(`/api/orders/${order.id}/items/${it.id}/packaged`, { packaged: nextState }); } catch { /* tenta os outros */ }
        }
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleMoveTo = async (targetCommandId: number | null) => {
    if (!moveMode) return;
    setBulkBusy(true);
    try {
      if (moveMode.kind === "single") {
        await api.patch(`/api/orders/${order.id}/items/${moveMode.id}/command`, { commandId: targetCommandId });
      } else {
        for (const id of moveMode.itemIds) {
          try { await api.patch(`/api/orders/${order.id}/items/${id}/command`, { commandId: targetCommandId }); } catch { /* tenta os outros */ }
        }
      }
      setMoveMode(null);
      await data.refresh();
      setActiveCommandId(targetCommandId);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao mover item");
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleCancel = (itemId: number) => {
    setCancelledItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleCancelAll = () => {
    if (items.length === 0) return;
    const visibleIds = items.map((i) => i.id);
    const apply = (mark: boolean) => {
      setCancelledItemIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) { if (mark) next.add(id); else next.delete(id); }
        return next;
      });
    };
    if (allCancelled) { apply(false); return; }
    if (window.confirm(`Marcar ${visibleIds.length} itens abaixo para cancelamento?\n\nO envio efetivo só acontece ao clicar "Enviar Atualização".`)) {
      apply(true);
    }
  };

  const handlePrintPackaging = () => {
    // FE: usa print nativo com window.print() após abrir uma janela com HTML do recibo.
    // Por enquanto, delegamos ao receiptPrinter existente (se houver) ou caímos em window.print.
    const packed = order.items.filter((i) => i.packaged);
    if (packed.length === 0) return;
    const lines = packed.map((it) => {
      const cmdName = it.commandId ? (data.commands.find((c) => c.id === it.commandId) ? commandLabel(data.commands.find((c) => c.id === it.commandId)!) : `Comanda #${it.commandId}`) : "Mesa";
      return `${cmdName} — ${it.quantity}x ${it.productName}${it.notes ? ` (${it.notes})` : ""}`;
    });
    alert(`Empacotar — Mesa #${table.number}\n\n${lines.join("\n")}`);
  };

  return (
    <div className="tom-order-summary">
      <table>
        <thead>
          <tr>
            <th className="col-qty">QTD</th>
            <th className="col-name">ITEM</th>
            <th className="col-price">VALOR</th>
            <th className="col-pack" title={allPacked ? "Desmarcar todos" : "Empacotar todos"}>
              <button
                className="tfe-hd-btn"
                onClick={togglePackagedAll}
                disabled={bulkBusy}
                aria-label={allPacked ? "Desmarcar empacotado de todos" : "Empacotar todos"}
              >
                <FiPackage size={18} color={allPacked ? "#8b5cf6" : "#94a3b8"} fill={allPacked ? "#8b5cf6" : "none"} />
              </button>
            </th>
            {showMoveCol && (
              <th className="col-move" title="Mover todos pra outra comanda">
                <button
                  className="tfe-hd-btn"
                  onClick={() => setMoveMode({ kind: "bulk", itemIds: items.map((i) => i.id), count: items.length, sourceCommandId: activeCommandId })}
                  disabled={bulkBusy}
                  aria-label="Mover todos"
                >
                  <FiRefreshCw size={16} />
                </button>
              </th>
            )}
            <th className="col-trash" title={allCancelled ? "Desfazer cancelamentos" : "Cancelar todos"}>
              <button className="tfe-hd-btn" onClick={toggleCancelAll} aria-label={allCancelled ? "Desfazer cancelamentos" : "Cancelar todos"}>
                {allCancelled
                  ? <FiRotateCcw size={16} color="#10b981" />
                  : <FiTrash2 size={16} color="#ef4444" />}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const willCancel = cancelledItemIds.has(it.id);
            const addons = it.addons ?? [];
            const addonsTotal = addons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);
            const itemTotal = it.unitPrice * it.quantity + addonsTotal;
            const obsText = it.observation || it.notes;
            return (
              <tr key={it.id} style={{ opacity: willCancel ? 0.4 : 1 }}>
                <td className="col-qty" style={{ textDecoration: willCancel ? "line-through" : "none", color: "#7c3aed", fontWeight: 700 }}>
                  {it.quantity}x
                </td>
                <td className="col-name" style={{ textDecoration: willCancel ? "line-through" : "none" }}>
                  {it.productName}
                  {addons.map((a) => (
                    <div key={a.id} style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
                      + {a.quantity}x {a.productName} (+R$ {(a.unitPrice * a.quantity).toFixed(2).replace(".", ",")})
                    </div>
                  ))}
                  {obsText && (
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2, fontStyle: "italic" }}>
                      📝 {obsText}
                    </div>
                  )}
                </td>
                <td className="col-price">R$ {itemTotal.toFixed(2).replace(".", ",")}</td>
                <td className="col-pack">
                  <input
                    type="checkbox"
                    checked={!!it.packaged}
                    disabled={packagingItemId === it.id || willCancel}
                    onChange={(e) => togglePackaged(it.id, e.target.checked)}
                    title="Empacotar pra viagem"
                  />
                </td>
                {showMoveCol && (
                  <td className="col-move">
                    <button
                      className="tom-move-btn"
                      onClick={() => setMoveMode({ kind: "single", id: it.id, productName: it.productName, quantity: it.quantity, commandId: it.commandId })}
                      disabled={willCancel}
                      title="Mover para outra comanda"
                    >⇄</button>
                  </td>
                )}
                <td className="col-trash">
                  <button
                    className="tfe-row-trash"
                    onClick={() => toggleCancel(it.id)}
                    title={willCancel ? "Desfazer cancelamento" : "Cancelar item"}
                  >
                    {willCancel ? <FiRotateCcw size={14} color="#10b981" /> : <FiTrash2 size={14} color="#ef4444" />}
                  </button>
                </td>
              </tr>
            );
          })}
          <tr className="total-row">
            <td className="col-qty"></td>
            <td className="col-name">Subtotal</td>
            <td className="col-price"><strong>R$ {subtotal.toFixed(2).replace(".", ",")}</strong></td>
            <td className="col-pack"></td>
            {showMoveCol && <td className="col-move"></td>}
            <td className="col-trash"></td>
          </tr>
        </tbody>
      </table>

      {hasPackaged && (
        <button
          className="tfe-pack-btn"
          onClick={handlePrintPackaging}
          style={{
            marginTop: 12, padding: "10px 14px", background: "#dbeafe",
            color: "#1d4ed8", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          }}
        >
          <FiPackage size={16} /> Imprimir empacotados
        </button>
      )}

      {cancelledItemIds.size > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", textAlign: "center", fontStyle: "italic" }}>
          {cancelledItemIds.size} cancelamento(s) marcado(s) — use "Enviar Atualização" pra confirmar.
        </div>
      )}

      {/* Modal: mover item(s) */}
      {moveMode && (
        <div className="tom-payment-overlay" onClick={() => setMoveMode(null)}>
          <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{moveMode.kind === "bulk" ? `Mover ${moveMode.count} itens` : "Mover item"}</h3>
            <p>
              {moveMode.kind === "single"
                ? <><strong>{moveMode.productName}</strong> ({moveMode.quantity}x)</>
                : <>Todos os itens de <strong>{activeCmdName}</strong></>}
            </p>
            <span className="tom-section-label">Enviar para:</span>
            <div className="tom-payment-options">
              {(() => {
                const sourceId = moveMode.kind === "single" ? moveMode.commandId : moveMode.sourceCommandId;
                return (
                  <>
                    {sourceId !== null && (
                      <button className="tom-payment-btn" onClick={() => handleMoveTo(null)} disabled={bulkBusy}>
                        Mesa
                      </button>
                    )}
                    {data.commands.filter((c) => sourceId !== c.id).map((c) => (
                      <button key={c.id} className="tom-payment-btn" onClick={() => handleMoveTo(c.id)} disabled={bulkBusy}>
                        {commandLabel(c)}
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>
            <button className="tom-payment-cancel" onClick={() => setMoveMode(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
