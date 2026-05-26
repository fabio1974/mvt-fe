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
