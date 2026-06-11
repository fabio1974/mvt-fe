import { Minus, Plus, Trash2 } from "lucide-react";
import type { PublicStore } from "../../PublicMenu/publicMenuApi";
import type { FoodCart } from "../useFoodCart";
import type { FoodOrderInfo, OrderType } from "../foodTypes";
import { brl, lineTotal, productPrice } from "../foodTypes";
import { getUserName } from "../../../utils/auth";
import { cs } from "../checkoutStyles";

interface Props {
  store: PublicStore;
  cart: FoodCart;
  fulfillment: OrderType;
  setFulfillment: (f: OrderType) => void;
  onContinue: () => void;
  onSwitchAccount: () => void;
  pendingOrder: FoodOrderInfo | null;
  onResumePending: () => void;
}

export default function CartStep({ store, cart, fulfillment, setFulfillment, onContinue, onSwitchAccount, pendingOrder, onResumePending }: Props) {
  const loggedName = typeof localStorage !== "undefined" && localStorage.getItem("authToken") ? getUserName() : null;
  const minOrder = store.minOrder ?? 0;
  const belowMin = minOrder > 0 && cart.total < minOrder;
  const canContinue = cart.count > 0 && !belowMin;

  return (
    <>
      <div style={cs.body}>
        {/* Pedido pendente: oferece retomar em vez de criar outro (parity mobile) */}
        {pendingOrder && (
          <div style={{ ...cs.card, background: "#fff7ed", borderColor: "#fed7aa" }}>
            <div style={{ fontSize: 14, color: "#9a3412", marginBottom: 8 }}>
              Você tem o pedido <strong>#{pendingOrder.id}</strong> ({brl(pendingOrder.total)}) aguardando pagamento.
            </div>
            <button style={{ ...cs.primaryBtn, padding: "10px 0", fontSize: 14 }} onClick={onResumePending}>
              Pagar pedido #{pendingOrder.id} agora
            </button>
          </div>
        )}

        {/* Quem está finalizando (evita a confusão de "pedi sem conta") */}
        {loggedName && (
          <div style={{ ...cs.rowBetween, fontSize: 13, color: "#6b7280", padding: "0 2px" }}>
            <span>Pedindo como <strong style={{ color: "#374151" }}>{loggedName}</strong></span>
            <button onClick={onSwitchAccount} style={{ border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontWeight: 600, padding: 0 }}>
              Trocar
            </button>
          </div>
        )}

        {cart.lines.length === 0 ? (
          <p style={cs.muted}>Seu carrinho está vazio.</p>
        ) : (
          cart.lines.map((l) => (
            <div key={l.id} style={cs.card}>
              <div style={cs.rowBetween}>
                <strong style={{ fontSize: 15, color: "#111827" }}>{l.product.name}</strong>
                <button style={cs.iconBtn} onClick={() => cart.removeLine(l.id)} aria-label="Remover">
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>

              {l.addons.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
                  {l.addons.map((a) => (
                    <div key={a.productId}>
                      + {a.quantity}× {a.productName}
                      {a.unitPrice > 0 ? ` (${brl(a.unitPrice * a.quantity)})` : ""}
                    </div>
                  ))}
                </div>
              )}
              {l.notes && <div style={{ marginTop: 4, fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>“{l.notes}”</div>}

              <div style={{ ...cs.rowBetween, marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    style={qBtn("#fee2e2", "#ef4444")}
                    onClick={() => cart.updateLine(l.id, { quantity: Math.max(1, l.quantity - 1) })}
                    aria-label="Diminuir"
                  >
                    <Minus size={15} />
                  </button>
                  <span style={{ fontWeight: 800, minWidth: 18, textAlign: "center" }}>{l.quantity}</span>
                  <button style={qBtn("#f59e0b", "#fff")} onClick={() => cart.updateLine(l.id, { quantity: l.quantity + 1 })} aria-label="Aumentar">
                    <Plus size={15} />
                  </button>
                </div>
                <strong style={{ color: "#111827" }}>{brl(lineTotal(l))}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                {brl(productPrice(l.product))} cada
              </div>
            </div>
          ))
        )}

        {/* Tipo de entrega (só quando a loja aceita retirada) */}
        {store.pickupEnabled && cart.count > 0 && (
          <div>
            <div style={cs.label}>Como você quer receber?</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["DELIVERY", "PICKUP"] as OrderType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFulfillment(f)}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700,
                    border: `1.5px solid ${fulfillment === f ? "#f59e0b" : "#e5e7eb"}`,
                    background: fulfillment === f ? "#fff7ed" : "#fff",
                    color: fulfillment === f ? "#b45309" : "#374151",
                  }}
                >
                  {f === "DELIVERY" ? "🛵 Entrega" : "🏪 Retirar na loja"}
                </button>
              ))}
            </div>
          </div>
        )}

        {belowMin && (
          <div style={cs.error}>Pedido mínimo desta loja: {brl(minOrder)}. Adicione mais itens.</div>
        )}
      </div>

      <div style={cs.footer}>
        <div style={cs.totalRow}>
          <span>Subtotal</span>
          <span>{brl(cart.total)}</span>
        </div>
        <button
          style={{ ...cs.primaryBtn, ...(canContinue ? {} : cs.primaryBtnDisabled) }}
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    </>
  );
}

const qBtn = (bg: string, color: string): React.CSSProperties => ({
  width: 30, height: 30, borderRadius: 15, border: "none", padding: 0, flexShrink: 0, background: bg, color,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
});
