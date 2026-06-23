import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import BrandName from "../Brand/BrandName";
import { Download, ImageOff, Minus, Plus, ShoppingCart } from "lucide-react";
import type { PublicMenu, PublicProduct } from "./publicMenuApi";
import { fetchMenuBySlug, productPrice } from "./publicMenuApi";
import { startFunnel, stopFunnel, track } from "./funnel";
import { useCart } from "./useCart";
import AppDownloadModal from "./AppDownloadModal";
import { APP_STORE_URL, PLAY_STORE_URL } from "./platform";
import ProductDetailModal from "../Food/ProductDetailModal";
import CheckoutWizard from "../Food/CheckoutWizard";
import OrderingAsBadge from "../Food/steps/OrderingAsBadge";
import SwitchAccountModal from "../Auth/SwitchAccountModal";
import { addonGroupsForProduct, allProducts, productHasAddons } from "../Food/addonGroups";
import type { CartAddon } from "../Food/foodTypes";
import "./PublicMenu.css";

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

/** Seções renderizadas = categorias com produtos + (opcional) "Outros". */
interface Section {
  key: string;
  title: string;
  description?: string | null;
  products: PublicProduct[];
}

/** 2 botões grandes de loja lado a lado (App Store / Google Play) — porta de conversão pro app. */
function StoreCtaRow() {
  return (
    <div className="pm-store-cta-row">
      <a
        className="pm-store-cta"
        href={APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("getapp_click", "ios")}
      >
        <span className="pm-store-cta-sub">Baixar na</span>
        <span className="pm-store-cta-name"> App Store</span>
      </a>
      <a
        className="pm-store-cta"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("getapp_click", "android")}
      >
        <span className="pm-store-cta-sub">Disponível no</span>
        <span className="pm-store-cta-name"> Google Play</span>
      </a>
    </div>
  );
}

export default function PublicMenuPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<PublicProduct | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // "Trocar" no banner abre um modal de troca (OAuth / e-mail+senha).
  const [switchOpen, setSwitchOpen] = useState(false);
  // Força recomputar a identidade exibida após trocar de conta.
  const [authNonce, setAuthNonce] = useState(0);

  const cart = useCart(slug);
  // Todos os produtos (pra escopar os addons por categoria do produto aberto).
  const allProds = useMemo(() => (menu ? allProducts(menu) : []), [menu]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchMenuBySlug(slug)
      .then((data) => {
        if (!cancelled) setMenu(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Funil: marca a visita ao cardápio e ativa o tracker pros componentes profundos.
  useEffect(() => {
    if (!slug) return;
    startFunnel(slug);
    track("cardapio_view");
    return () => stopFunnel();
  }, [slug]);

  // Handlers instrumentados (cada clique relevante vira um passo do funil).
  const openDetail = (p: PublicProduct) => {
    track("product_open", p.name);
    setDetailProduct(p);
  };
  const quickAdd = (p: PublicProduct) => {
    track("cart_add", p.name);
    cart.addQuick(p);
  };
  const openCheckout = () => {
    track("checkout_open");
    setCheckoutOpen(true);
  };
  const openApp = () => {
    track("getapp_click");
    setModalOpen(true);
  };

  const store = menu?.store;

  // Título + meta no client (o preview rico do WhatsApp vem do prerender; isto
  // melhora a aba do navegador e quem já está com o app/site aberto).
  useEffect(() => {
    if (!store) return;
    document.title = `${store.name} · Cardápio | Zapi10`;
    const desc = store.description || `Veja o cardápio de ${store.name} e peça pelo Zapi10.`;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", desc);
  }, [store]);

  const sections: Section[] = useMemo(() => {
    if (!menu) return [];
    // Produtos is_addon não aparecem como itens do cardápio — só dentro do detalhe.
    const sellable = (ps: PublicProduct[]) => ps.filter((p) => !p.isAddon);
    const list: Section[] = menu.categories
      .map((c) => ({ key: `cat-${c.id}`, title: c.name, description: c.description, products: sellable(c.products) }))
      .filter((s: Section) => s.products.length > 0);
    const outros = sellable(menu.uncategorized ?? []);
    if (outros.length > 0) {
      list.push({ key: "outros", title: "Outros", products: outros });
    }
    return list;
  }, [menu]);

  // Scrollspy: destaca a aba da categoria visível.
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveKey(visible.target.getAttribute("data-key"));
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => {
      const el = sectionRefs.current[s.key];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="pm-root">
        <div className="pm-center">
          <div className="pm-spinner" />
          <span>Carregando cardápio…</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="pm-root">
        <div className="pm-center">
          <ImageOff size={40} />
          <h3 style={{ margin: 0 }}>Cardápio não encontrado</h3>
          <p style={{ margin: 0 }}>O link pode estar incorreto ou a loja saiu do ar.</p>
          <button className="pm-getapp" style={{ margin: 0 }} onClick={openApp}>
            <Download size={16} /> Baixar o app <BrandName />
          </button>
        </div>
        <AppDownloadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          storeName="Zapi10"
          lines={[]}
          total={0}
        />
      </div>
    );
  }

  const isOpen = store.isOpenNow !== false;
  const notEnabled = store.enabled === false;
  const logoLetter = (store.name || "?").trim().charAt(0).toUpperCase();
  const empty = sections.length === 0;

  return (
    <div className="pm-root">
      <div className="pm-container">
        {/* Cover */}
        <div className="pm-cover">
          {store.coverUrl ? (
            <img src={store.coverUrl} alt={store.name} />
          ) : (
            <div className="pm-cover-placeholder">
              <ImageOff size={40} />
            </div>
          )}
        </div>

        {/* Logo + nome */}
        <div className="pm-headbar">
          {store.logoUrl ? (
            <img className="pm-logo" src={store.logoUrl} alt={store.name} />
          ) : (
            <div className="pm-logo pm-logo-fallback">{logoLetter}</div>
          )}
          <div className="pm-headinfo">
            <h1 className="pm-store-name">{store.name}</h1>
          </div>
        </div>

        {/* Identidade logada (auto-oculta se não logado), alinhada à direita com "Trocar". */}
        <div style={{ margin: "2px 0 4px" }}>
          <OrderingAsBadge key={authNonce} align="right" onSwitchAccount={() => setSwitchOpen(true)} />
        </div>

        {/* Meta */}
        <div className="pm-meta-row">
          <span className={`pm-status ${isOpen ? "open" : "closed"}`}>
            <span className="pm-bullet" />
            {isOpen ? "Aberto agora" : "Fechado"}
          </span>
          {store.todayHours && (
            <>
              <span className="pm-dot" />
              <span>{store.todayHours}</span>
            </>
          )}
          {store.avgPreparationMinutes ? (
            <>
              <span className="pm-dot" />
              <span>~{store.avgPreparationMinutes} min</span>
            </>
          ) : null}
          {store.minOrder ? (
            <>
              <span className="pm-dot" />
              <span>Mín. {brl(store.minOrder)}</span>
            </>
          ) : null}
        </div>

        {store.description && <div className="pm-desc">{store.description}</div>}

        {/* Porta de conversão pro app: 2 botões grandes lado a lado (App Store / Google Play). */}
        <div className="pm-store-cta-label">
          <Download size={15} /> Baixe o app <BrandName /> pra pedir
        </div>
        <StoreCtaRow />

        {/* Banners */}
        {notEnabled && (
          <div className="pm-banner">
            Loja ainda não habilitada na plataforma — você pode ver o cardápio, mas os pedidos
            abrem em breve.
          </div>
        )}
        {!notEnabled && !isOpen && (
          <div className="pm-banner">
            Loja fechada agora — monte seu pedido e finalize pelo app assim que ela reabrir.
          </div>
        )}

        {/* Tabs de categoria */}
        {!empty && (
          <div className="pm-tabs">
            {sections.map((s) => (
              <button
                key={s.key}
                className={`pm-tab ${activeKey === s.key ? "active" : ""}`}
                onClick={() => scrollTo(s.key)}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        <div className="pm-menu">
          {empty ? (
            <div className="pm-empty">
              <ShoppingCart size={56} style={{ opacity: 0.4 }} />
              <h3>Cardápio em preparação</h3>
              <p>Esta loja ainda não cadastrou produtos. Volte em breve.</p>
            </div>
          ) : (
            sections.map((s) => (
              <div
                key={s.key}
                className="pm-cat"
                data-key={s.key}
                ref={(el) => {
                  sectionRefs.current[s.key] = el;
                }}
              >
                <h2 className="pm-cat-title">{s.title}</h2>
                {s.description && <p className="pm-cat-desc">{s.description}</p>}
                {s.products.map((p) => {
                  const qty = cart.quantityOf(p.id);
                  return (
                    <div key={p.id} className="pm-card">
                      <div className="pm-card-info">
                        <div
                          className="pm-prod-head"
                          role="button"
                          tabIndex={0}
                          onClick={() => openDetail(p)}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDetail(p)}
                        >
                          <h3 className="pm-prod-name">{p.name}</h3>
                          {p.description && <p className="pm-prod-desc">{p.description}</p>}
                        </div>
                        <div className="pm-card-bottom">
                          <span className="pm-price">{brl(productPrice(p))}</span>
                          <div className="pm-qty">
                            {qty > 0 && (
                              <button
                                className="pm-qty-btn minus"
                                aria-label="Remover"
                                onClick={() => cart.removeQuick(p.id)}
                              >
                                <Minus size={16} />
                              </button>
                            )}
                            {qty > 0 && <span className="pm-qty-num">{qty}</span>}
                            <button
                              className="pm-qty-btn plus"
                              aria-label="Adicionar"
                              onClick={() => (productHasAddons(allProds, p) ? openDetail(p) : quickAdd(p))}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div
                        className="pm-card-img"
                        role="button"
                        tabIndex={0}
                        onClick={() => openDetail(p)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDetail(p)}
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} />
                        ) : (
                          <ImageOff className="pm-img-fallback" size={32} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Rodapé: reforço de conversão pro app pra quem rolou o cardápio todo. */}
        <div className="pm-store-cta-foot">
          <div className="pm-store-cta-foot-title">
            Gostou? Peça pelo app <BrandName />
          </div>
          <div className="pm-store-cta-foot-sub">
            Pague, acompanhe a entrega e receba novidades — é rapidinho.
          </div>
          <StoreCtaRow />
        </div>

        {/* Barra fixa do carrinho → abre o checkout na própria web */}
        {cart.count > 0 && (
          <div className="pm-cartbar-wrap">
            <button className="pm-cartbar" onClick={openCheckout}>
              <span className="pm-cart-badge">{cart.count}</span>
              <span className="pm-cart-label">Finalizar pedido</span>
              <span className="pm-cart-total">{brl(cart.total)}</span>
            </button>
          </div>
        )}

        <AppDownloadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          storeName={store.name}
          lines={cart.lines}
          total={cart.total}
        />

        <ProductDetailModal
          product={detailProduct}
          addonGroups={detailProduct ? addonGroupsForProduct(allProds, detailProduct) : []}
          onClose={() => setDetailProduct(null)}
          onConfirm={(quantity, notes, addons: CartAddon[]) => {
            if (detailProduct) {
              track("cart_add", detailProduct.name);
              cart.addCustomLine(detailProduct, quantity, notes, addons);
            }
            setDetailProduct(null);
          }}
        />

        {checkoutOpen && (
          <CheckoutWizard store={store} cart={cart} onClose={() => setCheckoutOpen(false)} />
        )}

        {switchOpen && (
          <SwitchAccountModal onClose={() => setSwitchOpen(false)} onSwitched={() => setAuthNonce((n) => n + 1)} />
        )}
      </div>
    </div>
  );
}
