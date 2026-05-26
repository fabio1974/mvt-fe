import { useEffect, useMemo, useState } from "react";
import { Check, Download, Link2, Smartphone, X } from "lucide-react";
import type { CartLine } from "./useCart";
import { productPrice } from "./publicMenuApi";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  detectPlatform,
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

  // Bloqueia o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const storeUrl = storeUrlFor(platform);
  const hasItems = lines.length > 0;

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

        <h2>{hasItems ? "Quase lá! 🎉" : "Baixe o app Zapi10"}</h2>
        <p>
          {hasItems ? (
            <>
              Seu pedido foi montado. Para enviar pra <strong>{storeName}</strong>, pagar e
              acompanhar a entrega, é só baixar o app <strong>Zapi10</strong> — leva poucos segundos.
            </>
          ) : (
            <>
              Peça de <strong>{storeName}</strong>, pague com PIX e acompanhe a entrega em tempo real,
              tudo pelo app <strong>Zapi10</strong>.
            </>
          )}
        </p>

        {hasItems && (
          <div className="pm-modal-summary">
            {lines.map((l) => (
              <div key={l.product.id} className="pm-sum-line">
                <span>
                  {l.quantity}× {l.product.name}
                </span>
                <span>{brl(productPrice(l.product) * l.quantity)}</span>
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
              <a className="pm-store-btn" href={APP_STORE_URL} target="_blank" rel="noreferrer">
                App Store
              </a>
              <a className="pm-store-btn" href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
                Google Play
              </a>
            </div>
          </>
        ) : (
          <>
            <a className="pm-store-btn" href={storeUrl ?? PLAY_STORE_URL}>
              {platform === "ios" ? <Smartphone size={20} /> : <Download size={20} />}
              {platform === "ios" ? "Baixar na App Store" : "Baixar no Google Play"}
            </a>
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
