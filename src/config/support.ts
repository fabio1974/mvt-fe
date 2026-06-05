/**
 * Suporte ao usuário PRÉ-LOGIN (não consegue entrar / não confirmou e-mail).
 *
 * Espelha o mesmo canal do app (mvt-mobile/src/config/support.ts): o Fale Conosco
 * in-app exige login, e o usuário preso justamente não consegue logar. O WhatsApp
 * fecha o ciclo sem autenticação. Para usuários logados, usar o Fale Conosco.
 */

/** Número de WhatsApp do suporte Zapi10 (DDI+DDD, só dígitos). */
export const SUPPORT_WHATSAPP = "5588981087485";

/** Monta o link wa.me com a mensagem pré-preenchida. */
export function buildSupportWhatsappUrl(message: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/** Texto amigável de fallback (exibição). */
export const SUPPORT_WHATSAPP_DISPLAY = "(88) 98108-7485";
