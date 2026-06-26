import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { PublicStore } from "../../PublicMenu/publicMenuApi";
import type { FoodCart } from "../useFoodCart";
import type { CreateOrderRequest, DeliveryAddress, FoodOrderInfo, OrderType } from "../foodTypes";
import { brl, lineTotal } from "../foodTypes";
import * as foodApi from "../foodApi";
import { cs } from "../checkoutStyles";

interface Props {
  store: PublicStore;
  cart: FoodCart;
  fulfillment: OrderType;
  deliveryAddress: DeliveryAddress | null;
  onSubmit: (order: FoodOrderInfo) => void;
  /** Token inválido/expirado/de conta deletada (401): limpa a sessão e volta pro login. */
  onAuthExpired: () => void;
  onBack: () => void;
}

function extractMsg(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const d = (e as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return d?.message || d?.error || "";
  }
  return "";
}

/** 401 = sessão inválida (token expirado / usuário deletado). Tratado como re-login, não como erro. */
function is401(e: unknown): boolean {
  return !!(
    e &&
    typeof e === "object" &&
    "response" in e &&
    (e as { response?: { status?: number } }).response?.status === 401
  );
}

export default function SummaryStep({ store, cart, fulfillment, deliveryAddress, onSubmit, onAuthExpired, onBack }: Props) {
  const isPickup = fulfillment === "PICKUP";
  const [fee, setFee] = useState<number | null>(isPickup ? 0 : null);
  const [feeLoading, setFeeLoading] = useState(!isPickup);
  const [feeError, setFeeError] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Cupom
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [suggestedCoupon, setSuggestedCoupon] = useState<string | null>(null);

  // Frete (só DELIVERY).
  useEffect(() => {
    if (isPickup || !deliveryAddress) return;
    let cancelled = false;
    setFeeLoading(true);
    setFeeError("");
    foodApi
      .previewFee(store.id, deliveryAddress.latitude, deliveryAddress.longitude)
      .then((r) => {
        if (!cancelled) setFee(r.deliveryFee);
      })
      .catch((e) => {
        if (cancelled) return;
        // Token velho (expirado / conta deletada): manda pro login em vez de mostrar
        // "Authentication required" sem saída. A auth é por callback, o carrinho sobrevive.
        if (is401(e)) return onAuthExpired();
        setFeeError(extractMsg(e) || "Não foi possível calcular o frete.");
      })
      .finally(() => {
        if (!cancelled) setFeeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store.id, deliveryAddress, isPickup]);

  // Cupom sugerido (1ª compra etc.) — só uma dica; o usuário aplica se quiser.
  useEffect(() => {
    let cancelled = false;
    foodApi
      .getAvailableCoupon()
      .then((c) => {
        if (!cancelled && c?.code) setSuggestedCoupon(c.code);
      })
      .catch(() => {
        /* sem cupom disponível */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = cart.total;
  const total = Math.max(0, subtotal + (fee ?? 0) - couponDiscount);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponMsg("");
    try {
      const r = await foodApi.validateCoupon(code, subtotal + (fee ?? 0));
      if (r.valid) {
        setCouponCode(code);
        setCouponDiscount(r.discount ?? 0);
        setCouponMsg(r.message || `Cupom aplicado: −${brl(r.discount ?? 0)}`);
      } else {
        setCouponCode(null);
        setCouponDiscount(0);
        setCouponMsg(r.message || "Cupom inválido.");
      }
    } catch (e) {
      setCouponCode(null);
      setCouponDiscount(0);
      setCouponMsg(extractMsg(e) || "Não foi possível validar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const body: CreateOrderRequest = {
        clientId: store.id,
        items: cart.lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          notes: l.notes || null,
          addons: l.addons.length > 0 ? l.addons.map((a) => ({ productId: a.productId, quantity: a.quantity })) : undefined,
          // Montagem rica (pizza): seleções por grupo. BE recomputa o preço autoritativamente.
          addonSelections: l.addonSelections && l.addonSelections.length > 0 ? l.addonSelections : undefined,
        })),
        notes: notes.trim() || null,
        deliveryAddress:
          !isPickup && deliveryAddress
            ? {
                address: deliveryAddress.address,
                latitude: deliveryAddress.latitude,
                longitude: deliveryAddress.longitude,
                complement: deliveryAddress.complement,
                referencePoint: deliveryAddress.referencePoint,
              }
            : undefined,
        orderType: fulfillment,
        paymentTiming: "AT_CHECKOUT",
        couponCode: couponCode || null,
      };
      const order = await foodApi.createOrder(body);
      onSubmit(order);
    } catch (e) {
      // Token velho (expirado / conta deletada): volta pro login em vez de "erro ao criar pedido".
      if (is401(e)) { onAuthExpired(); return; }
      setError(extractMsg(e) || "Não foi possível criar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div style={cs.body}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111827" }}>Resumo do pedido</h2>
          <p style={cs.muted}>{store.name}</p>
        </div>

        <div style={cs.card}>
          {cart.lines.map((l) => (
            <div key={l.id} style={{ marginBottom: 6 }}>
              <div style={cs.rowBetween}>
                <span style={{ fontSize: 14 }}>
                  {l.quantity}× {l.product.name}
                  {l.addons.length > 0 && <span style={{ color: "#9ca3af" }}> (+{l.addons.reduce((s, a) => s + a.quantity, 0)})</span>}
                </span>
                <span style={{ fontSize: 14 }}>{brl(lineTotal(l))}</span>
              </div>
              {l.richLabel?.map((lbl, i) => (
                <div key={i} style={{ fontSize: 12, color: "#6b7280", paddingLeft: 14 }}>• {lbl}</div>
              ))}
            </div>
          ))}
        </div>

        {!isPickup && deliveryAddress && (
          <div style={cs.card}>
            <div style={cs.label}>Entregar em</div>
            <div style={{ fontSize: 14, color: "#374151" }}>
              {deliveryAddress.address}
              {deliveryAddress.number ? `, ${deliveryAddress.number}` : ""}
              {deliveryAddress.complement ? ` — ${deliveryAddress.complement}` : ""}
            </div>
          </div>
        )}
        {isPickup && (
          <div style={cs.card}>
            <div style={cs.label}>Retirar na loja</div>
            <div style={{ fontSize: 14, color: "#374151" }}>{store.address || store.name}</div>
          </div>
        )}

        <div>
          <div style={cs.label}>Observação do pedido (opcional)</div>
          <textarea
            style={{ ...cs.input, minHeight: 60, resize: "vertical" }}
            placeholder="Ex: troco pra R$50, deixar na portaria..."
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Cupom */}
        <div>
          <div style={cs.label}>Cupom de desconto</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...cs.input, flex: 1, textTransform: "uppercase" }}
              placeholder={suggestedCoupon ? `Ex: ${suggestedCoupon}` : "Tem um cupom?"}
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !couponLoading && applyCoupon()}
            />
            <button
              style={{ ...cs.ghostBtn, width: "auto", padding: "0 18px", whiteSpace: "nowrap" }}
              onClick={applyCoupon}
              disabled={couponLoading || !couponInput.trim()}
            >
              {couponLoading ? "…" : "Aplicar"}
            </button>
          </div>
          {suggestedCoupon && !couponCode && (
            <button
              onClick={() => { setCouponInput(suggestedCoupon); }}
              style={{ border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontSize: 12.5, marginTop: 6, padding: 0 }}
            >
              🎁 Você tem o cupom {suggestedCoupon} — toque pra preencher
            </button>
          )}
          {couponMsg && (
            <div style={{ fontSize: 13, marginTop: 6, color: couponCode ? "#16a34a" : "#ef4444" }}>{couponMsg}</div>
          )}
        </div>

        <div style={cs.card}>
          <div style={{ ...cs.rowBetween, marginBottom: 6 }}>
            <span style={cs.muted}>Subtotal</span>
            <span>{brl(subtotal)}</span>
          </div>
          {!isPickup && (
            <div style={{ ...cs.rowBetween, marginBottom: 6 }}>
              <span style={cs.muted}>Entrega</span>
              <span>{feeLoading ? "calculando…" : feeError ? "—" : brl(fee ?? 0)}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div style={{ ...cs.rowBetween, marginBottom: 6, color: "#16a34a" }}>
              <span>Cupom {couponCode}</span>
              <span>−{brl(couponDiscount)}</span>
            </div>
          )}
          <div style={cs.totalRow}>
            <span>Total{feeError ? " (sem frete)" : ""}</span>
            <span>{brl(total)}</span>
          </div>
          {feeError && <div style={{ ...cs.error, marginTop: 8 }}>{feeError}</div>}
        </div>

        {error && <div style={cs.error}>{error}</div>}
      </div>

      <div style={cs.footer}>
        <button
          style={{ ...cs.primaryBtn, ...(submitting || feeLoading ? cs.primaryBtnDisabled : {}) }}
          disabled={submitting || feeLoading}
          onClick={submit}
        >
          {submitting ? "Enviando…" : `Finalizar e pagar · ${brl(total)}`}
        </button>
        <button style={cs.ghostBtn} onClick={onBack} disabled={submitting}>
          <ChevronLeft size={14} style={{ verticalAlign: "middle" }} /> Voltar
        </button>
      </div>
    </>
  );
}
