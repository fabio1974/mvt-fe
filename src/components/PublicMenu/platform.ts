/**
 * Detecção de plataforma + links das lojas, pro handoff "smooth" da página
 * pública de cardápio até o download do app Zapi10.
 *
 * IDs (ver memória reference_app_store_links):
 *  - Android package: com.mvt.mobile.zapi10
 *  - iOS App Store ID: 6759847860
 */

export type Platform = "ios" | "android" | "desktop";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.mvt.mobile.zapi10";
export const APP_STORE_URL = "https://apps.apple.com/br/app/id6759847860";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || (navigator as unknown as { vendor?: string }).vendor || "";

  // iOS clássico
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPadOS 13+ se passa por Mac — distingue pelo touch
  if (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document) {
    return "ios";
  }
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/** Link da loja correspondente à plataforma; null no desktop (lá usamos QR). */
export function storeUrlFor(platform: Platform): string | null {
  if (platform === "ios") return APP_STORE_URL;
  if (platform === "android") return PLAY_STORE_URL;
  return null;
}

/**
 * Custom scheme registrado no app (Info.plist CFBundleURLSchemes / Android). Hoje é
 * o do dev client (= bundle id); o app deve rotear `<scheme>://handoff?code=...` pra
 * fechar o auto-login (F4 nativo). Universal Links da MESMA origem não disparam no
 * Safari, por isso usamos o scheme pra "tentar abrir o app".
 */
export const APP_SCHEME = "com.mvt.mobile.zapi10";

/** Deep link do app pro handoff; carrega o código (auto-login zero-toque no instalado). */
export function appHandoffUrl(handoffCode: string | null): string {
  return handoffCode
    ? `${APP_SCHEME}://handoff?code=${encodeURIComponent("zapihandoff_" + handoffCode)}`
    : `${APP_SCHEME}://`;
}

/**
 * "Tenta abrir o app, senão vai pra loja." Navega pro deep link do app; se em ~1,4s
 * a página ainda estiver visível (o app não assumiu o foco = não instalado/não rotea),
 * cai pro link da loja. Pattern app-link-then-store.
 */
export function openAppOrStore(appUrl: string, storeUrl: string): void {
  if (typeof window === "undefined") return;
  let bailed = false;
  const onHidden = () => { bailed = true; };
  const onVis = () => { if (document.hidden) onHidden(); };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", onHidden);

  window.location.href = appUrl; // tenta o app

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pagehide", onHidden);
    if (!bailed && !document.hidden) {
      window.location.href = storeUrl; // app não abriu → loja
    }
  }, 1400);
}
