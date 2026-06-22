import { api } from "../../services/api";

/**
 * Tracker de funil do cardápio público (/c/<slug>). Singleton de módulo: a página de
 * cardápio chama startFunnel(slug); os componentes profundos (CheckoutWizard, AuthGateStep,
 * GoogleSignInButton, AddressStep) só chamam track(). Quando NÃO há funil ativo (ex.: o
 * GoogleSignInButton usado na página de login), track() é no-op — não vaza eventos.
 *
 * Grava first-party no nosso BE (/api/public/menu-events) E, se configurado
 * (VITE_META_PIXEL_ID), dispara o evento padrão equivalente no Meta Pixel.
 */
let slug: string | null = null;
let sessionId: string | null = null;
let pixelReady = false;

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

/** funil → evento padrão do Meta Pixel (só os principais). */
const PIXEL_MAP: Record<string, string> = {
  cardapio_view: "ViewContent",
  cart_add: "AddToCart",
  checkout_open: "InitiateCheckout",
  auth_view: "Lead",
  order_placed: "Purchase",
};

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "s-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

function loadPixel() {
  if (!PIXEL_ID || pixelReady || typeof window === "undefined") return;
  /* Meta Pixel base code */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  (window as any).fbq("init", PIXEL_ID);
  (window as any).fbq("track", "PageView");
  /* eslint-enable @typescript-eslint/no-explicit-any */
  pixelReady = true;
}

/** Inicia o funil pra um cardápio (chamado pela PublicMenuPage). */
export function startFunnel(s: string) {
  slug = s;
  sessionId = sessionStorage.getItem("zfunnel_sid");
  if (!sessionId) {
    sessionId = uuid();
    sessionStorage.setItem("zfunnel_sid", sessionId);
  }
  loadPixel();
}

export function stopFunnel() {
  slug = null;
}

/** Registra um passo/clique. No-op se não há funil ativo. */
export function track(event: string, detail?: string) {
  if (!slug || !sessionId) return;
  api
    .post("/public/menu-events", { sessionId, slug, event, detail: detail ?? null })
    .catch(() => {});
  const std = PIXEL_MAP[event];
  if (std && pixelReady && (window as any).fbq) {
    try {
      (window as any).fbq("track", std, detail ? { content_name: detail } : {});
    } catch {
      /* ignore */
    }
  }
}
