import React, { useCallback, useEffect, useState } from "react";
import {
  FiFolderPlus,
  FiPlusCircle,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiImage,
} from "react-icons/fi";
import PageContainer from "../Generic/PageContainer";
import ImageUploadField from "./ImageUploadField";
import { api } from "../../services/api";

/**
 * Meu Cardápio — CRUD de categorias e produtos pro CLIENT (estabelecimento).
 * Porte web do MenuManagementScreen.tsx do mobile, usando os mesmos endpoints:
 *   GET /api/categories/me, POST/PUT/DELETE /api/categories[/{id}]
 *   GET /api/products/me, POST/PUT/DELETE /api/products[/{id}], PATCH /api/products/{id}/toggle
 */

interface Category {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
  imageUrl: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  deliveryPrice: number | null;
  ifoodPrice: number | null;
  imageUrl: string | null;
  available: boolean;
  preparationTimeMinutes: number | null;
  displayOrder: number;
  isAddon: boolean;
  categoryId?: number | null;
  category: { id: number; name: string } | null;
}

const ORANGE = "#f59e0b";

const fmtPrice = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
const sortByName = (a: Product, b: Product) =>
  (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" });
const catOf = (p: Product) => p.categoryId ?? p.category?.id ?? null;

const StoreMenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de categoria
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");

  // Modal de produto
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDeliveryPrice, setProdDeliveryPrice] = useState("");
  const [prodIfoodPrice, setProdIfoodPrice] = useState("");
  const [prodPrepTime, setProdPrepTime] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState<number | null>(null);
  const [prodImageUrl, setProdImageUrl] = useState<string | null>(null);
  const [prodIsAddon, setProdIsAddon] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get<Category[]>("/api/categories/me"),
        api.get<Product[]>("/api/products/me"),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch {
      // erro de rede já tratado pelo interceptor; mantém o que tinha
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Categoria ----------
  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatDescription(cat.description || "");
    } else {
      setEditingCategory(null);
      setCatName("");
      setCatDescription("");
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) {
      window.alert("Nome da categoria é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: catName.trim(), description: catDescription.trim() || null };
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, payload);
      } else {
        await api.post("/api/categories", payload);
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (e: unknown) {
      window.alert(errMsg(e, "Erro ao salvar categoria"));
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (cat: Category) => {
    if (!window.confirm(`Remover "${cat.name}"? Todos os produtos da categoria serão removidos.`)) return;
    try {
      await api.delete(`/api/categories/${cat.id}`);
      fetchData();
    } catch {
      window.alert("Não foi possível remover");
    }
  };

  // ---------- Produto ----------
  const openProductModal = (prod?: Product, readOnly = false) => {
    setViewOnly(readOnly);
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdDescription(prod.description || "");
      setProdPrice(prod.price.toFixed(2).replace(".", ","));
      setProdDeliveryPrice(prod.deliveryPrice != null ? prod.deliveryPrice.toFixed(2).replace(".", ",") : "");
      setProdIfoodPrice(prod.ifoodPrice != null ? prod.ifoodPrice.toFixed(2).replace(".", ",") : "");
      setProdPrepTime(prod.preparationTimeMinutes?.toString() || "");
      setProdCategoryId(catOf(prod));
      setProdImageUrl(prod.imageUrl);
      setProdIsAddon(!!prod.isAddon);
    } else {
      setEditingProduct(null);
      setProdName("");
      setProdDescription("");
      setProdPrice("");
      setProdDeliveryPrice("");
      setProdIfoodPrice("");
      setProdPrepTime("");
      setProdCategoryId(categories.length > 0 ? categories[0].id : null);
      setProdImageUrl(null);
      setProdIsAddon(false);
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!prodName.trim()) {
      window.alert("Nome do produto é obrigatório");
      return;
    }
    const price = parseFloat(prodPrice.replace(",", "."));
    if (isNaN(price) || price <= 0) {
      window.alert("Preço inválido");
      return;
    }
    const parseOptPrice = (s: string): number | null => {
      const t = s.trim();
      if (!t) return null;
      const n = parseFloat(t.replace(",", "."));
      return isNaN(n) || n <= 0 ? NaN : n;
    };
    const deliveryPrice = parseOptPrice(prodDeliveryPrice);
    const ifoodPrice = parseOptPrice(prodIfoodPrice);
    if (Number.isNaN(deliveryPrice) || Number.isNaN(ifoodPrice)) {
      window.alert("Preço de canal inválido. Deixe em branco ou informe um valor > 0.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: prodName.trim(),
        description: prodDescription.trim() || null,
        price,
        deliveryPrice,
        ifoodPrice,
        preparationTimeMinutes: prodPrepTime ? parseInt(prodPrepTime, 10) : null,
        imageUrl: prodImageUrl,
        isAddon: prodIsAddon,
        category: prodCategoryId ? { id: prodCategoryId } : null,
      };
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      setShowProductModal(false);
      fetchData();
    } catch (e: unknown) {
      window.alert(errMsg(e, "Erro ao salvar produto"));
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (prod: Product) => {
    try {
      await api.patch(`/api/products/${prod.id}/toggle`);
      fetchData();
    } catch {
      window.alert("Não foi possível alterar disponibilidade");
    }
  };

  const deleteProduct = async (prod: Product) => {
    if (!window.confirm(`Remover "${prod.name}" permanentemente?`)) return;
    try {
      await api.delete(`/api/products/${prod.id}`);
      fetchData();
    } catch {
      window.alert("Não foi possível remover");
    }
  };

  // ---------- Render ----------
  const productsByCategory = categories.map((cat) => ({
    ...cat,
    items: products.filter((p) => catOf(p) === cat.id).sort(sortByName),
  }));
  const uncategorized = products.filter((p) => catOf(p) == null).sort(sortByName);

  const headerActions = (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => openCategoryModal()} style={btn("#dbeafe", "#1d4ed8")}>
        <FiFolderPlus size={16} /> Nova Categoria
      </button>
      <button onClick={() => openProductModal()} style={btn("#dcfce7", "#15803d")}>
        <FiPlusCircle size={16} /> Novo Produto
      </button>
    </div>
  );

  return (
    <PageContainer title="Meu Cardápio" headerActions={headerActions}>
      <div style={{ flex: 1, padding: "24px", background: "var(--app-bg)", minHeight: "calc(100vh - 180px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center" }}>Carregando cardápio...</p>
          ) : categories.length === 0 && products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "#64748b" }}>
              <FiImage size={48} />
              <h3 style={{ margin: "12px 0 4px", color: "#111827" }}>Cardápio vazio</h3>
              <p>Comece criando uma categoria e adicionando produtos.</p>
            </div>
          ) : (
            <>
              {productsByCategory.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </h3>
                    <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                      <IconBtn onClick={() => openCategoryModal(cat)} color="#64748b" title="Editar categoria"><FiEdit2 size={18} /></IconBtn>
                      <IconBtn onClick={() => deleteCategory(cat)} color="#ef4444" title="Remover categoria"><FiTrash2 size={18} /></IconBtn>
                    </div>
                  </div>
                  {cat.items.length === 0 && (
                    <p style={{ fontSize: 13, fontStyle: "italic", color: "#4b5563", marginBottom: 8 }}>
                      Nenhum produto nesta categoria
                    </p>
                  )}
                  {cat.items.map((prod) => (
                    <ProductCard key={prod.id} prod={prod} onView={() => openProductModal(prod, true)} onToggle={() => toggleProduct(prod)} onEdit={() => openProductModal(prod)} onDelete={() => deleteProduct(prod)} />
                  ))}
                </div>
              ))}

              {uncategorized.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Sem categoria</h3>
                  {uncategorized.map((prod) => (
                    <ProductCard key={prod.id} prod={prod} onView={() => openProductModal(prod, true)} onToggle={() => toggleProduct(prod)} onEdit={() => openProductModal(prod)} onDelete={() => deleteProduct(prod)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Categoria */}
      {showCategoryModal && (
        <ModalShell onClose={() => setShowCategoryModal(false)} title={editingCategory ? "Editar Categoria" : "Nova Categoria"}>
          <input style={inputStyle} placeholder="Nome da categoria (ex: Pizzas)" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} placeholder="Descrição (opcional)" value={catDescription} onChange={(e) => setCatDescription(e.target.value)} />
          <ModalActions>
            <button style={btn("#e2e8f0", "#475569")} onClick={() => setShowCategoryModal(false)}>Cancelar</button>
            <button style={btn("#dbeafe", "#1d4ed8")} onClick={saveCategory} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </ModalActions>
        </ModalShell>
      )}

      {/* Modal Produto */}
      {showProductModal && (
        <ModalShell onClose={() => setShowProductModal(false)} title={viewOnly ? "Detalhes do Produto" : editingProduct ? "Editar Produto" : "Novo Produto"}>
          <div style={{ pointerEvents: viewOnly ? "none" : "auto", opacity: viewOnly ? 0.85 : 1 }}>
            <ImageUploadField value={prodImageUrl} onChange={setProdImageUrl} folder="products" aspectRatio={4 / 3} label="Adicionar foto" />
          </div>
          <input style={{ ...inputStyle, marginTop: 12 }} placeholder="Nome do produto *" value={prodName} onChange={(e) => setProdName(e.target.value)} disabled={viewOnly} />
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} placeholder="Descrição (ex: ingredientes)" value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} disabled={viewOnly} />
          {/* iFood oculto até implementarmos o scraper — prodIfoodPrice segue no state/payload pra não apagar o dado salvo. */}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Preço balcão (R$) *"><input style={inputStyle} inputMode="decimal" placeholder="29,90" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} disabled={viewOnly} /></Field>
            <Field label="Preparo (min)"><input style={inputStyle} inputMode="numeric" placeholder="30" value={prodPrepTime} onChange={(e) => setProdPrepTime(e.target.value)} disabled={viewOnly} /></Field>
            <Field label="Preço Zapi-Food"><input style={inputStyle} inputMode="decimal" placeholder="(igual ao balcão)" value={prodDeliveryPrice} onChange={(e) => setProdDeliveryPrice(e.target.value)} disabled={viewOnly} /></Field>
          </div>
          <p style={{ fontSize: 11, color: "#4b5563", fontStyle: "italic", marginTop: -4 }}>Preço Zapi-Food em branco = usa o preço do balcão.</p>

          <label style={fieldLabelStyle}>Categoria</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Chip active={!prodCategoryId} onClick={() => !viewOnly && setProdCategoryId(null)}>Sem categoria</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={prodCategoryId === c.id} onClick={() => !viewOnly && setProdCategoryId(c.id)}>{c.name}</Chip>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Usar como adicional</div>
              <div style={{ fontSize: 11, color: "#4b5563", fontStyle: "italic" }}>
                Some do cardápio principal e aparece como opcional dentro de outros produtos
              </div>
            </div>
            <input type="checkbox" checked={prodIsAddon} onChange={(e) => setProdIsAddon(e.target.checked)} disabled={viewOnly} style={{ width: 20, height: 20 }} />
          </div>

          <ModalActions>
            <button style={btn("#e2e8f0", "#475569")} onClick={() => setShowProductModal(false)}>{viewOnly ? "Fechar" : "Cancelar"}</button>
            {!viewOnly && <button style={btn("#dcfce7", "#15803d")} onClick={saveProduct} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>}
          </ModalActions>
        </ModalShell>
      )}
    </PageContainer>
  );
};

// ---------- Subcomponentes / helpers ----------

const ProductCard: React.FC<{
  prod: Product;
  onView: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ prod, onView, onToggle, onEdit, onDelete }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: 10,
      marginBottom: 8,
      background: "#fff",
      opacity: prod.available ? 1 : 0.5,
    }}
  >
    {prod.imageUrl ? (
      <img src={prod.imageUrl} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
    ) : (
      <div style={{ width: 50, height: 50, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FiImage size={20} color="#94a3b8" />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.name}</span>
        {prod.isAddon && (
          <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>ADICIONAL</span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: ORANGE, marginTop: 2 }}>{fmtPrice(prod.price)}</div>
    </div>
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0, paddingLeft: 8 }}>
      <IconBtn onClick={onView} color="#1d4ed8" title="Ver detalhes do produto"><FiInfo size={24} /></IconBtn>
      <IconBtn onClick={onToggle} color={prod.available ? "#15803d" : "#ef4444"} title={prod.available ? "Esconda esse produto da visão do seu cliente" : "Mostre esse produto para o seu cliente"}>{prod.available ? <FiEye size={24} /> : <FiEyeOff size={24} />}</IconBtn>
      <IconBtn onClick={onEdit} color="#64748b" title="Editar produto"><FiEdit2 size={24} /></IconBtn>
      <IconBtn onClick={onDelete} color="#ef4444" title="Remover produto"><FiTrash2 size={22} /></IconBtn>
    </div>
  </div>
);

const IconBtn: React.FC<{ onClick: () => void; color: string; title: string; children: React.ReactNode }> = ({ onClick, color, title, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        aria-label={title}
        style={{ background: "none", border: "none", cursor: "pointer", color, display: "flex", alignItems: "center", padding: 0 }}
      >
        {children}
      </button>
      {hovered && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            background: "#1f2937",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.3,
            padding: "6px 10px",
            borderRadius: 8,
            whiteSpace: "normal",
            width: "max-content",
            maxWidth: 220,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", textAlign: "center", marginTop: 0, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  </div>
);

const ModalActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>{children}</div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ flex: 1 }}>
    <label style={fieldLabelStyle}>{label}</label>
    {children}
  </div>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 14px",
      borderRadius: 20,
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 600,
      background: active ? ORANGE : "#e2e8f0",
      color: active ? "#fff" : "#475569",
    }}
  >
    {children}
  </button>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  marginBottom: 12,
  boxSizing: "border-box",
};

const fieldLabelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4, display: "block" };

const btn = (bg: string, color: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  flex: 1,
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  background: bg,
  color,
  whiteSpace: "nowrap",
});

function errMsg(e: unknown, fallback: string): string {
  const resp = (e as { response?: { data?: { message?: string } } })?.response;
  return resp?.data?.message || fallback;
}

export default StoreMenuPage;
