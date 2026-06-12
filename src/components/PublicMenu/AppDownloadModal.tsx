import { useEffect, useMemo, useState } from "react";
import { Check, Link2, Smartphone, X } from "lucide-react";
import BrandName from "../Brand/BrandName";
import type { CartLine } from "./useCart";
import { lineTotal } from "../Food/foodTypes";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  appHandoffUrl,
  detectPlatform,
  openAppOrStore,
  storeUrlFor,
} from "./platform";
import type { Platform } from "./platform";

interface Props {
  open: boolean;
  onClose: () => void;
  storeName: string;
  lines: CartLine[];
  total: number;
}

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

/**
 * Surface de handoff: o momento de pico de intenção (visitante quer finalizar)
 * vira o empurrão pro download. Detecta a plataforma e manda direto pra loja
 * certa; no desktop instrui a reabrir no celular (onde a detecção faz o resto).
 */
export default function AppDownloadModal({ open, onClose, storeName, lines, total }: Props) {
  const platform: Platform = useMemo(() => detectPlatform(), []);
  const [copied, setCopied] = useState(false);
  // Handoff: se o visitante está logado, emite um código pro app entrar logado no
  // 1º launch (Android via Install Referrer; iOS lê o clipboard).
  const [handoff, setHandoff] = useState<string | null>(null);

  // Bloqueia o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !localStorage.getItem("authToken")) return;
    let cancelled = false;
    import("../../services/api").then(({ api }) =>
      api.post<{ code: string }>("/auth/handoff/issue")
        .then((r) => { if (!cancelled) setHandoff(r.data.code); })
        .catch(() => { /* sem handoff — download normal */ })
    );
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  const storeUrl = storeUrlFor(platform);
  const hasItems = lines.length > 0;
  // Android: carrega o handoff via Install Referrer.
  const playUrl = handoff
    ? `${PLAY_STORE_URL}&referrer=${encodeURIComponent("zapihandoff_" + handoff)}`
    : PLAY_STORE_URL;
  // iOS/desktop: deixa o código no clipboard pro app ler no 1º launch.
  const dropHandoffToClipboard = () => {
    if (handoff) navigator.clipboard?.writeText("zapihandoff_" + handoff).catch(() => {});
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — o usuário ainda vê a URL na barra do navegador */
    }
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-handle" />

        <h2>{hasItems ? "Quase lá! 🎉" : <>Baixe o app <BrandName /></>}</h2>
        <p>
          {hasItems ? (
            <>
              Seu pedido foi montado. Para enviar pra <strong>{storeName}</strong>, pagar e
              acompanhar a entrega, é só baixar o app <BrandName /> — leva poucos segundos.
            </>
          ) : (
            <>
              Peça de <strong>{storeName}</strong>, pague com PIX e acompanhe a entrega em tempo real,
              tudo pelo app <BrandName />.
            </>
          )}
        </p>

        {hasItems && (
          <div className="pm-modal-summary">
            {lines.map((l) => (
              <div key={l.id} className="pm-sum-line">
                <span>
                  {l.quantity}× {l.product.name}
                </span>
                <span>{brl(lineTotal(l))}</span>
              </div>
            ))}
            <div className="pm-sum-total">
              <span>Total</span>
              <span>{brl(total)}</span>
            </div>
          </div>
        )}

        {platform === "desktop" ? (
          <>
            <p style={{ marginBottom: 14 }}>
              📱 O app é pra celular. Abra este link no seu telefone (ou copie e mande pra você) pra
              finalizar pelo app.
            </p>
            <button className="pm-store-btn" onClick={copyLink}>
              {copied ? <Check size={20} /> : <Link2 size={20} />}
              {copied ? "Link copiado!" : "Copiar link do cardápio"}
            </button>
            <div className="pm-badges">
              <a className="pm-store-btn" href={APP_STORE_URL} target="_blank" rel="noreferrer" onClick={dropHandoffToClipboard}>
                App Store
              </a>
              <a className="pm-store-btn" href={playUrl} target="_blank" rel="noreferrer" onClick={dropHandoffToClipboard}>
                Google Play
              </a>
            </div>
          </>
        ) : (
          <>
            {handoff && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", borderRadius: 8, padding: "8px 10px", fontSize: 13, marginBottom: 10, textAlign: "center" }}>
                ✓ Você já vai entrar logado no app
              </div>
            )}
            <button
              type="button"
              className="pm-store-btn"
              onClick={() => {
                // iOS fresh-install lê o código do clipboard; o app instalado lê do deep link.
                dropHandoffToClipboard();
                openAppOrStore(appHandoffUrl(handoff), platform === "android" ? playUrl : (storeUrl ?? playUrl));
              }}
            >
              <Smartphone size={20} />
              Continuar no app
            </button>
            <div className="pm-badges">
              <a
                href={platform === "ios" ? PLAY_STORE_URL : APP_STORE_URL}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13, color: "#6b7280", textDecoration: "underline" }}
              >
                {platform === "ios" ? "Tenho Android" : "Tenho iPhone"}
              </a>
            </div>
          </>
        )}

        <button className="pm-modal-close" onClick={onClose}>
          <X size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Continuar vendo o cardápio
        </button>
      </div>
    </div>
  );
}
