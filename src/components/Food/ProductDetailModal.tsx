import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import type { AddonGroup, CartAddon, FoodProduct } from "./foodTypes";
import { brl, productPrice } from "./foodTypes";

/**
 * Detalhe do produto (web) — porta do ProductDetailModal do mobile: quantidade +
 * adicionais por categoria (± qtd) + observação. Adicionais vêm dos produtos
 * is_addon da loja; quantidade livre, sem min/max. Confirmar cria uma nova linha.
 */
interface Props {
  product: FoodProduct | null;
  addonGroups: AddonGroup[];
  onClose: () => void;
  onConfirm: (quantity: number, notes: string, addons: CartAddon[]) => void;
}

export default function ProductDetailModal({ product, addonGroups, onClose, onConfirm }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [addonQty, setAddonQty] = useState<Record<number, number>>({});

  // Reseta a cada produto aberto.
  useEffect(() => {
    setQuantity(1);
    setNotes("");
    setAddonQty({});
  }, [product?.id]);

  // Trava o scroll do fundo.
  useEffect(() => {
    if (!product) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [product]);

  const selectedAddons: CartAddon[] = useMemo(() => {
    const all = addonGroups.flatMap((g) => g.items);
    return Object.entries(addonQty)
      .filter(([, q]) => q > 0)
      .map(([pid, q]) => {
        const p = all.find((x) => x.id === Number(pid));
        return {
          productId: Number(pid),
          productName: p?.name ?? "",
          unitPrice: p ? productPrice(p) : 0,
          quantity: q,
        };
      });
  }, [addonQty, addonGroups]);

  if (!product) return null;

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);
  const subtotal = productPrice(product) * quantity + addonsTotal;
  const addonCount = selectedAddons.reduce((s, a) => s + a.quantity, 0);

  const incAddon = (pid: number) => setAddonQty((p) => ({ ...p, [pid]: (p[pid] ?? 0) + 1 }));
  const decAddon = (pid: number) =>
    setAddonQty((p) => {
      const curr = p[pid] ?? 0;
      if (curr <= 1) {
        const { [pid]: _omit, ...rest } = p;
        return rest;
      }
      return { ...p, [pid]: curr - 1 };
    });

  const confirm = () => onConfirm(quantity, notes.trim(), selectedAddons);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={S.title}>{product.name}</div>
            <div style={S.subtitle}>{brl(productPrice(product))}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={S.body}>
          {product.description && <p style={S.desc}>{product.description}</p>}

          {/* Quantidade */}
          <div>
            <div style={S.sectionLabel}>Quantidade</div>
            <div style={S.qtyRow}>
              <button style={{ ...S.qtyBtn, ...S.qtyMinus }} onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir">
                <Minus size={20} />
              </button>
              <span style={S.qtyNum}>{quantity}</span>
              <button style={{ ...S.qtyBtn, ...S.qtyPlus }} onClick={() => setQuantity((q) => q + 1)} aria-label="Aumentar">
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Adicionais */}
          {addonGroups.length > 0 && (
            <div>
              <div style={S.sectionLabel}>Adicionais</div>
              {addonGroups.map((group) => (
                <div key={group.categoryName} style={{ marginBottom: 8 }}>
                  {addonGroups.length > 1 && <div style={S.groupLabel}>{group.categoryName}</div>}
                  {group.items.map((a) => {
                    const q = addonQty[a.id] ?? 0;
                    const active = q > 0;
                    return (
                      <div key={a.id} style={{ ...S.addonRow, borderColor: active ? "#f59e0b" : "#e5e7eb", borderWidth: active ? 1.5 : 1 }}>
                        <button style={{ ...S.addonQtyBtn, background: q > 0 ? "#fee2e2" : "#f3f4f6", color: q > 0 ? "#ef4444" : "#9ca3af" }} onClick={() => decAddon(a.id)} disabled={q <= 0} aria-label="Diminuir">
                          <Minus size={15} />
                        </button>
                        <span style={{ ...S.addonNum, color: active ? "#f59e0b" : "#111827" }}>{q}</span>
                        <button style={{ ...S.addonQtyBtn, background: "#f59e0b", color: "#fff" }} onClick={() => incAddon(a.id)} aria-label="Aumentar">
                          <Plus size={15} />
                        </button>
                        <span style={S.addonName}>{a.name}</span>
                        {productPrice(a) > 0 && <span style={S.addonPrice}>+{brl(productPrice(a))}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Observação */}
          <div>
            <div style={S.sectionLabel}>Observação</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, ponto da carne..."
              maxLength={500}
              style={S.notes}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div style={{ minWidth: 0 }}>
            <div style={S.footerLabel}>Subtotal{addonCount > 0 ? ` · ${addonCount} adicional(is)` : ""}</div>
            <div style={S.footerTotal}>{brl(subtotal)}</div>
          </div>
          <button style={S.confirmBtn} onClick={confirm}>
            <ShoppingCart size={18} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2100,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#fff", width: "100%", maxWidth: 640, maxHeight: "92vh",
    borderTopLeftRadius: 20, borderTopRightRadius: 20, display: "flex", flexDirection: "column",
    boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
    borderBottom: "1px solid #eef0f2",
  },
  title: { fontSize: 18, fontWeight: 800, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  closeBtn: { border: "none", background: "transparent", color: "#111827", cursor: "pointer", padding: 4, lineHeight: 0 },
  body: { padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 },
  desc: { margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.45, whiteSpace: "pre-line" },
  sectionLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7280", marginBottom: 8 },
  groupLabel: { color: "#d97706", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  qtyRow: { display: "flex", alignItems: "center", background: "#f9fafb", borderRadius: 12, padding: "10px 14px" },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, border: "none", padding: 0, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyMinus: { background: "#fee2e2", color: "#ef4444" },
  qtyPlus: { background: "#f59e0b", color: "#fff" },
  qtyNum: { flex: 1, textAlign: "center", color: "#111827", fontWeight: 800, fontSize: 24 },
  addonRow: { display: "flex", alignItems: "center", background: "#f9fafb", borderStyle: "solid", borderRadius: 10, padding: "7px 10px", marginBottom: 6 },
  addonQtyBtn: { width: 30, height: 30, borderRadius: 15, border: "none", padding: 0, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  addonNum: { width: 26, textAlign: "center", fontWeight: 800, fontSize: 15 },
  addonName: { flex: 1, marginLeft: 12, color: "#111827", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  addonPrice: { color: "#f59e0b", fontWeight: 700, fontSize: 13, marginLeft: 8, whiteSpace: "nowrap" },
  notes: { width: "100%", minHeight: 70, resize: "vertical", padding: 12, borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, boxSizing: "border-box", fontFamily: "inherit" },
  footer: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid #eef0f2", background: "#f9fafb" },
  footerLabel: { color: "#6b7280", fontSize: 11 },
  footerTotal: { color: "#111827", fontWeight: 800, fontSize: 20 },
  confirmBtn: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, background: "#f59e0b", color: "#fff", border: "none", padding: "13px 22px", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", whiteSpace: "nowrap" },
};
