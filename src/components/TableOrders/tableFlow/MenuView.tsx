import { useMemo, useState } from "react";
import { FiArrowLeft, FiChevronRight, FiFolder, FiSearch } from "react-icons/fi";
import { normalize } from "./types";
import type { FlowViewProps, ProductSummary } from "./types";

interface Props extends FlowViewProps {
  categoryName?: string;
}

/**
 * View 2 do fluxo: cardápio em 2 níveis.
 * Sem categoryName → lista de categorias com contagem.
 * Com categoryName → lista de produtos da categoria, com busca.
 * Filtra isAddon=true (adicionais só aparecem em ProductView).
 */
export default function MenuView(props: Props) {
  const { data, navigate, goBack, categoryName, activeCommandId, pendingItems } = props;
  const [search, setSearch] = useState("");

  // Produtos principais (não adicionais)
  const mainProducts = useMemo(() => data.products.filter((p) => !p.isAddon), [data.products]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of mainProducts) {
      const c = p.categoryName || "Outros";
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mainProducts]);

  const filteredProducts = useMemo(() => {
    if (!categoryName) return [];
    const inCat = mainProducts.filter((p) => (p.categoryName || "Outros") === categoryName);
    if (!search.trim()) return inCat;
    const q = normalize(search.trim());
    return inCat.filter((p) => normalize(p.name).includes(q));
  }, [mainProducts, categoryName, search]);

  const pendingCountForProduct = (productId: number) =>
    pendingItems
      .filter((p) => p.productId === productId && p.commandId === activeCommandId)
      .reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="tfe-view">
      <div className="tfe-view-header">
        <button className="tfe-back-btn" onClick={goBack}><FiArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{categoryName || "Cardápio"}</h3>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {categoryName
              ? `${filteredProducts.length} produto${filteredProducts.length === 1 ? "" : "s"}`
              : `${categories.length} categoria${categories.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {categoryName && (
        <div className="tfe-search-bar">
          <FiSearch size={16} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            autoFocus
          />
        </div>
      )}

      <div className="tfe-view-body">
        {!categoryName && categories.map((cat) => (
          <button
            key={cat.name}
            className="tfe-row"
            onClick={() => navigate({ kind: "menu", categoryName: cat.name })}
          >
            <FiFolder size={18} color="#7c3aed" />
            <span style={{ flex: 1, fontWeight: 600 }}>{cat.name}</span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              {cat.count} {cat.count === 1 ? "item" : "itens"}
            </span>
            <FiChevronRight size={18} color="#94a3b8" />
          </button>
        ))}

        {!categoryName && categories.length === 0 && (
          <EmptyState text="Cardápio vazio" />
        )}

        {categoryName && filteredProducts.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            pendingCount={pendingCountForProduct(p.id)}
            onClick={() => navigate({ kind: "product", productId: p.id })}
          />
        ))}

        {categoryName && filteredProducts.length === 0 && (
          <EmptyState text={search ? "Nenhum produto encontrado" : "Categoria vazia"} />
        )}
      </div>
    </div>
  );
}

function ProductRow({ product, pendingCount, onClick }: { product: ProductSummary; pendingCount: number; onClick: () => void }) {
  const highlight = pendingCount > 0;
  return (
    <button
      className={`tfe-row ${highlight ? "tfe-row-highlight" : ""}`}
      onClick={onClick}
    >
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{product.name}</span>
          {highlight && (
            <span style={{
              background: "#8b5cf6", color: "#fff",
              fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10,
            }}>
              +{pendingCount}
            </span>
          )}
        </div>
        {product.description && (
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{product.description}</div>
        )}
      </div>
      <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 14, marginLeft: 8 }}>
        R$ {product.price.toFixed(2).replace(".", ",")}
      </span>
      <FiChevronRight size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
      {text}
    </div>
  );
}
