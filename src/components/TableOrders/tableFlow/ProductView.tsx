import { useMemo, useState } from "react";
import { FiArrowLeft, FiCheck, FiTrash2 } from "react-icons/fi";
import { newDraftId } from "./types";
import type { FlowViewProps, PendingAddon, ProductSummary } from "./types";

interface Props extends FlowViewProps {
  productId: number;
  editingDraftId?: string;
}

/**
 * View 3 do fluxo: detalhe do produto. Captura qty + observação + adicionais.
 * Cada confirmação empilha um PendingItem com identidade própria (draftId).
 * Modo edição (editingDraftId) carrega o draft existente e substitui ao salvar.
 */
export default function ProductView(props: Props) {
  const {
    data, productId, editingDraftId, goBack, navigate,
    activeCommandId, pendingItems, setPendingItems,
  } = props;

  const product = useMemo(() => data.products.find((p) => p.id === productId), [data.products, productId]);
  const editing = editingDraftId ? pendingItems.find((p) => p.draftId === editingDraftId) : undefined;

  const [quantity, setQuantity] = useState<number>(editing?.quantity ?? 1);
  const [observation, setObservation] = useState<string>(editing?.observation ?? "");
  const [addonQty, setAddonQty] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const a of editing?.addons ?? []) init[a.productId] = a.quantity;
    return init;
  });

  const availableAddons = useMemo(() => {
    const list = data.products.filter((p) => p.isAddon && p.available);
    const groups = new Map<string, ProductSummary[]>();
    for (const p of list) {
      const cat = p.categoryName || "Adicionais";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(p);
    }
    return Array.from(groups.entries()).map(([categoryName, items]) => ({ categoryName, items }));
  }, [data.products]);

  if (!product) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "#94a3b8" }}>Produto não encontrado</p>
        <button className="tom-payment-cancel" onClick={goBack}>Voltar</button>
      </div>
    );
  }

  const selectedAddons: PendingAddon[] = Object.entries(addonQty)
    .filter(([, q]) => q > 0)
    .map(([pid, q]) => {
      const p = data.products.find((x) => x.id === Number(pid));
      return {
        productId: Number(pid),
        productName: p?.name ?? "",
        unitPrice: p?.price ?? 0,
        quantity: q,
      };
    });

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);
  const subtotal = product.price * quantity + addonsTotal;
  const canConfirm = quantity > 0;

  const incAddon = (pid: number) => setAddonQty((prev) => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }));
  const decAddon = (pid: number) => setAddonQty((prev) => {
    const curr = prev[pid] ?? 0;
    if (curr <= 1) {
      const { [pid]: _, ...rest } = prev;
      return rest;
    }
    return { ...prev, [pid]: curr - 1 };
  });

  const handleConfirm = () => {
    if (!canConfirm) return;
    const obs = observation.trim();
    if (editingDraftId) {
      setPendingItems((prev) => prev.map((p) => p.draftId === editingDraftId
        ? { ...p, quantity, observation: obs || undefined, addons: selectedAddons }
        : p));
    } else {
      setPendingItems((prev) => [...prev, {
        draftId: newDraftId(),
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        observation: obs || undefined,
        addons: selectedAddons,
        commandId: activeCommandId,
      }]);
    }
    if (product.categoryName) {
      navigate({ kind: "menu", categoryName: product.categoryName });
    } else {
      navigate({ kind: "menu" });
    }
  };

  const handleDeleteDraft = () => {
    if (!editingDraftId) return;
    setPendingItems((prev) => prev.filter((p) => p.draftId !== editingDraftId));
    navigate({ kind: "detail" });
  };

  return (
    <div className="tfe-view">
      <div className="tfe-view-header">
        <button className="tfe-back-btn" onClick={goBack}><FiArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{product.name}</h3>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            R$ {product.price.toFixed(2).replace(".", ",")}{editing ? " · editando" : ""}
          </span>
        </div>
      </div>

      <div className="tfe-view-body">
        {product.description && (
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5, marginTop: 0 }}>{product.description}</p>
        )}

        {/* Quantidade */}
        <div className="tfe-section">
          <div className="tfe-section-label">Quantidade</div>
          <div className="tfe-qty-row">
            <button className="tfe-qty-btn minus" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir">
              <span className="tfe-btn-glyph">−</span>
            </button>
            <span className="tfe-qty-value">{quantity}</span>
            <button className="tfe-qty-btn plus" onClick={() => setQuantity((q) => q + 1)} aria-label="Aumentar">
              <span className="tfe-btn-glyph">+</span>
            </button>
          </div>
        </div>

        {/* Observação */}
        <div className="tfe-section">
          <div className="tfe-section-label">Observação para a cozinha</div>
          <textarea
            className="tfe-notes"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: sem cebola, ponto da carne..."
            maxLength={500}
            rows={3}
          />
        </div>

        {/* Adicionais */}
        {availableAddons.length > 0 ? (
          <div className="tfe-section">
            <div className="tfe-section-label">Adicionais</div>
            {availableAddons.map((group) => (
              <div key={group.categoryName} style={{ marginBottom: 12 }}>
                {availableAddons.length > 1 && (
                  <div style={{ color: "#7c3aed", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {group.categoryName}
                  </div>
                )}
                {group.items.map((a) => {
                  const q = addonQty[a.id] ?? 0;
                  const active = q > 0;
                  return (
                    <div key={a.id} className={`tfe-addon-row ${active ? "active" : ""}`}>
                      <button
                        className="tfe-addon-qty-btn minus"
                        onClick={() => decAddon(a.id)}
                        disabled={q <= 0}
                        aria-label="Diminuir adicional"
                      >
                        <span className="tfe-btn-glyph sm">−</span>
                      </button>
                      <span className="tfe-addon-qty-val">{q}</span>
                      <button className="tfe-addon-qty-btn plus" onClick={() => incAddon(a.id)} aria-label="Aumentar adicional">
                        <span className="tfe-btn-glyph sm">+</span>
                      </button>
                      <span className="tfe-addon-name">{a.name}</span>
                      <span className="tfe-addon-price">
                        +R$ {a.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: 16, border: "1px dashed #cbd5e1", borderRadius: 8,
            color: "#94a3b8", fontStyle: "italic", fontSize: 13, textAlign: "center",
          }}>
            Sem adicionais cadastrados
          </div>
        )}

        {editing && (
          <button
            onClick={handleDeleteDraft}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: 12, background: "none", color: "#ef4444", border: "none", cursor: "pointer",
              fontWeight: 700, width: "100%", marginTop: 8,
            }}
          >
            <FiTrash2 size={16} /> Remover este rascunho
          </button>
        )}
      </div>

      <div className="tfe-view-footer">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            Subtotal{selectedAddons.length > 0 ? ` · ${selectedAddons.reduce((s, a) => s + a.quantity, 0)} adicional(is)` : ""}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            R$ {subtotal.toFixed(2).replace(".", ",")}
          </div>
        </div>
        <button
          className="tfe-confirm-btn"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          <FiCheck size={18} /> {editing ? "Salvar" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}
