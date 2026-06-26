import { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import type { FoodProduct, RichAddonGroup, AddonSelection } from "./foodTypes";
import { brl } from "./foodTypes";
import type { BuilderSelection } from "./pizzaPricing";
import { computePizza, flavorCap, toAddonSelections, flatLabels } from "./pizzaPricing";

interface Props {
  product: FoodProduct | null;
  onClose: () => void;
  onConfirm: (args: {
    quantity: number;
    notes: string;
    addonSelections: AddonSelection[];
    richUnitPrice: number;
    richLabel: string[];
  }) => void;
}

/**
 * Builder do modelo rico (montagem de pizza) — web. Espelha o PizzaBuilderModal do mobile e a engine
 * do BE (matriz tamanho×sabor + média): grupos com regras, meio-a-meio, preço ao vivo, e "Adicionar"
 * só quando válido. O preço definitivo é recomputado pelo BE no checkout (autoritativo).
 */
export default function PizzaBuilderModal({ product, onClose, onConfirm }: Props) {
  const groups: RichAddonGroup[] = product?.addonGroups ?? [];
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [sel, setSel] = useState<BuilderSelection>({});

  useEffect(() => {
    setQuantity(1);
    setNotes("");
    const init: BuilderSelection = {};
    const sizeGroup = groups.find((g) => g.pricingMode === "SIZE_SELECTOR");
    if (sizeGroup && sizeGroup.options[0]) init[sizeGroup.id] = [sizeGroup.options[0].productId];
    setSel(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const result = useMemo(() => computePizza(groups, sel), [groups, sel]);
  const sizeGroup = groups.find((g) => g.pricingMode === "SIZE_SELECTOR");
  const sizeKey = sizeGroup ? String((sel[sizeGroup.id] ?? [])[0] ?? "") : "";
  const flavorsAllowed = sizeGroup
    ? sizeGroup.options.find((o) => String(o.productId) === sizeKey)?.flavorsAllowed ?? null
    : null;

  // Preço-âncora do tamanho: uniform=true (sorvete: sabores iguais → preço é do tamanho) vs varia (pizza).
  const flavorGroup = groups.find((g) => g.pricingMode === "FLAVOR_MATRIX");
  const sizePriceInfo = (sizeProductId: number): { min: number; uniform: boolean } | null => {
    if (!flavorGroup) return null;
    const prices = flavorGroup.options
      .map((o) => o.pricePerSize?.[String(sizeProductId)])
      .filter((p): p is number => p != null);
    if (!prices.length) return null;
    const min = Math.min(...prices);
    return { min, uniform: prices.every((p) => p === min) };
  };
  const selectedSizeUniform = sizeKey ? (sizePriceInfo(Number(sizeKey))?.uniform ?? false) : false;

  if (!product) return null;

  const selectSize = (groupId: number, productId: number) =>
    setSel((prev) => {
      const next: BuilderSelection = { ...prev, [groupId]: [productId] };
      const newAllowed = groups.find((g) => g.id === groupId)?.options.find((o) => o.productId === productId)?.flavorsAllowed ?? null;
      for (const g of groups) {
        if (g.pricingMode !== "FLAVOR_MATRIX") continue;
        const cap = flavorCap(g, newAllowed);
        if (cap != null && (next[g.id]?.length ?? 0) > cap) next[g.id] = (next[g.id] ?? []).slice(0, cap);
      }
      return next;
    });

  const toggleFlavor = (g: RichAddonGroup, productId: number) =>
    setSel((prev) => {
      const curr = prev[g.id] ?? [];
      if (curr.includes(productId)) return { ...prev, [g.id]: curr.filter((x) => x !== productId) };
      const cap = flavorCap(g, flavorsAllowed);
      if (cap != null && curr.length >= cap) return prev;
      return { ...prev, [g.id]: [...curr, productId] };
    });

  const toggleAdditive = (g: RichAddonGroup, productId: number) =>
    setSel((prev) => {
      const curr = prev[g.id] ?? [];
      if (curr.includes(productId)) return { ...prev, [g.id]: curr.filter((x) => x !== productId) };
      const cap = g.maxSelect ?? 1;
      const next = cap === 1 ? [productId] : [...curr, productId].slice(-cap);
      return { ...prev, [g.id]: next };
    });

  const confirm = () => {
    if (!result.valid || quantity < 1) return;
    onConfirm({
      quantity,
      notes: notes.trim(),
      addonSelections: toAddonSelections(groups, sel),
      richUnitPrice: result.unitPrice,
      richLabel: flatLabels(result),
    });
  };

  const lineTotal = result.unitPrice * quantity;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={S.title}>{product.name}</div>
            {product.description && <div style={S.subtitle}>{product.description}</div>}
          </div>
          <button style={S.closeBtn} onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        <div style={S.body}>
          {product.description && <p style={S.desc}>{product.description}</p>}

          {groups.map((g) => {
            const chosen = sel[g.id] ?? [];
            const cap = g.pricingMode === "FLAVOR_MATRIX" ? flavorCap(g, flavorsAllowed) : g.maxSelect;
            const hint =
              g.pricingMode === "SIZE_SELECTOR" ? "Escolha 1"
                : g.pricingMode === "FLAVOR_MATRIX"
                  ? (cap && cap > 1 ? `Escolha até ${cap}${g.allowFraction ? " (meio a meio)" : ""}` : "Escolha 1")
                  : (g.required ? "Escolha 1" : "Opcional");
            return (
              <div key={g.id}>
                <div style={S.groupHead}>
                  <span style={S.sectionLabel}>{g.name}</span>
                  <span style={{ ...S.badge, background: g.required ? "#fee2e2" : "#f3f4f6", color: g.required ? "#b91c1c" : "#6b7280" }}>
                    {g.required ? "Obrigatório" : "Opcional"}
                  </span>
                </div>
                <div style={S.hint}>{hint}</div>
                {g.options.map((o) => {
                  const isSel = chosen.includes(o.productId);
                  const priceForSize =
                    g.pricingMode === "FLAVOR_MATRIX" ? (sizeKey ? o.pricePerSize?.[sizeKey] : undefined)
                      : g.pricingMode === "ADDITIVE" ? (o.price ?? 0) : undefined;
                  const disabled = g.pricingMode === "FLAVOR_MATRIX" && !isSel && cap != null && chosen.length >= cap;
                  const onClick = () =>
                    g.pricingMode === "SIZE_SELECTOR" ? selectSize(g.id, o.productId)
                      : g.pricingMode === "FLAVOR_MATRIX" ? toggleFlavor(g, o.productId)
                        : toggleAdditive(g, o.productId);
                  return (
                    <button
                      key={o.productId}
                      onClick={onClick}
                      disabled={disabled}
                      style={{
                        ...S.optRow,
                        borderColor: isSel ? "#2563eb" : "#e5e7eb",
                        background: isSel ? "#dbeafe" : "#fff",
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <span style={{ ...S.dot, borderColor: isSel ? "#2563eb" : "#cbd5e1", background: isSel ? "#2563eb" : "transparent" }} />
                      <span style={{ ...S.optName, color: isSel ? "#1d4ed8" : "#111827" }}>
                        {o.name}
                        {g.pricingMode === "SIZE_SELECTOR" && o.flavorsAllowed != null && (
                          <span style={S.optSub}> · até {o.flavorsAllowed} {o.flavorsAllowed > 1 ? "sabores" : "sabor"}</span>
                        )}
                      </span>
                      {/* TAMANHO carrega o preço-âncora (sorvete: exato; pizza: "a partir de"). */}
                      {g.pricingMode === "SIZE_SELECTOR" && (() => {
                        const info = sizePriceInfo(o.productId);
                        if (!info) return null;
                        return <span style={S.optPrice}>{info.uniform ? brl(info.min) : `a partir de ${brl(info.min)}`}</span>;
                      })()}
                      {g.pricingMode === "ADDITIVE" && priceForSize != null && priceForSize > 0 && (
                        <span style={S.optPrice}>+ {brl(priceForSize)}</span>
                      )}
                      {/* SABOR só mostra preço quando há diferença entre sabores (premium); uniforme = sem preço. */}
                      {g.pricingMode === "FLAVOR_MATRIX" && priceForSize != null && !selectedSizeUniform && (
                        <span style={S.optPrice}>{brl(priceForSize)}</span>
                      )}
                      {g.pricingMode === "FLAVOR_MATRIX" && sizeKey && priceForSize == null && (
                        <span style={{ ...S.optPrice, color: "#b91c1c" }}>indisp.</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div>
            <div style={S.sectionLabel}>Observação</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: sem cebola, bem assada..." maxLength={500} style={S.notes} />
          </div>
        </div>

        <div style={S.footer}>
          <div style={S.qtyRow}>
            <button style={{ ...S.qtyBtn, ...S.qtyMinus }} onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir"><Minus size={18} /></button>
            <span style={S.qtyNum}>{quantity}</span>
            <button style={{ ...S.qtyBtn, ...S.qtyPlus }} onClick={() => setQuantity((q) => q + 1)} aria-label="Aumentar"><Plus size={18} /></button>
          </div>
          <button
            style={{ ...S.confirmBtn, background: result.valid ? "#2563eb" : "#e5e7eb", color: result.valid ? "#fff" : "#9ca3af", cursor: result.valid ? "pointer" : "not-allowed" }}
            onClick={confirm}
            disabled={!result.valid}
          >
            <ShoppingCart size={18} /> {result.valid ? `Adicionar · ${brl(lineTotal)}` : (result.errors[0] ?? "Complete a montagem")}
          </button>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2100, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: "#fff", width: "100%", maxWidth: 640, maxHeight: "92vh", borderTopLeftRadius: 20, borderTopRightRadius: 20, display: "flex", flexDirection: "column", boxShadow: "0 -8px 30px rgba(0,0,0,0.2)" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #eef0f2" },
  title: { fontSize: 18, fontWeight: 800, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  closeBtn: { border: "none", background: "transparent", color: "#111827", cursor: "pointer", padding: 4, lineHeight: 0 },
  body: { padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 },
  desc: { margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.45, whiteSpace: "pre-line" },
  groupHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7280" },
  badge: { fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 8px" },
  hint: { fontSize: 12, color: "#6b7280", margin: "2px 0 8px" },
  optRow: { display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", borderStyle: "solid", borderWidth: 1.5, borderRadius: 12, padding: "11px 12px", marginBottom: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderStyle: "solid", borderWidth: 2, flexShrink: 0 },
  optName: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  optSub: { color: "#6b7280", fontWeight: 500, fontSize: 12 },
  optPrice: { fontSize: 14, fontWeight: 800, color: "#111827", marginLeft: 8, whiteSpace: "nowrap" },
  notes: { width: "100%", minHeight: 64, resize: "vertical", padding: 12, borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, boxSizing: "border-box", fontFamily: "inherit" },
  footer: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid #eef0f2", background: "#f9fafb" },
  qtyRow: { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 12, padding: "4px 6px", border: "1px solid #e5e7eb" },
  qtyBtn: { width: 38, height: 38, borderRadius: 19, border: "none", padding: 0, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyMinus: { background: "#fee2e2", color: "#ef4444" },
  qtyPlus: { background: "#dbeafe", color: "#1d4ed8" },
  qtyNum: { minWidth: 24, textAlign: "center", color: "#111827", fontWeight: 800, fontSize: 18 },
  confirmBtn: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, border: "none", padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" },
};
