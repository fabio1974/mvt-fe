import { useFoodCart } from "../Food/useFoodCart";

/**
 * Carrinho da página pública — wrapper fino sobre useFoodCart, com chave por slug.
 * O modelo de carrinho (linha com addons + observação) vive em ../Food/foodTypes.
 */
export type { CartLine, CartAddon } from "../Food/foodTypes";

export function useCart(slug: string) {
  return useFoodCart(`zapi10_pubcart_${slug}`);
}
