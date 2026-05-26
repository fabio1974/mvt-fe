import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "./publicMenuApi";
import { productPrice } from "./publicMenuApi";

/**
 * Carrinho da página pública, persistido no localStorage por slug.
 * É só "intenção" — o pedido real é finalizado no app (handoff). Guardar por
 * loja permite manter o carrinho se o visitante recarregar o link do WhatsApp.
 */

export interface CartLine {
  product: PublicProduct;
  quantity: number;
}

const keyFor = (slug: string) => `zapi10_pubcart_${slug}`;

export function useCart(slug: string) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(keyFor(slug));
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(keyFor(slug), JSON.stringify(lines));
    } catch {
      /* localStorage cheio/indisponível — segue sem persistir */
    }
  }, [slug, lines]);

  const add = useCallback((product: PublicProduct) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((l) =>
          l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l
        );
      }
      return prev.filter((l) => l.product.id !== productId);
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const quantityOf = useCallback(
    (productId: number) => lines.find((l) => l.product.id === productId)?.quantity ?? 0,
    [lines]
  );

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + productPrice(l.product) * l.quantity, 0),
    [lines]
  );
  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  return { lines, add, remove, clear, quantityOf, total, count };
}
