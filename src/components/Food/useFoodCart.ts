import { useCallback, useEffect, useMemo, useState } from "react";
import type { AddonSelection, CartAddon, CartLine, FoodProduct } from "./foodTypes";
import { lineTotal, newLineId } from "./foodTypes";

/**
 * Carrinho do Zapi-Food (web), persistido no localStorage por `cartKey`.
 * Modelo de LINHA igual ao mobile: addons + observação por linha, então o mesmo
 * produto com sabores diferentes coexiste em linhas distintas. Vive independente
 * do login, então sobrevive ao fluxo de OAuth no checkout.
 */

/** Linha "plana": sem observação e sem addons — alvo dos botões ± do cardápio. */
const isPlainLine = (l: CartLine) => l.notes === "" && l.addons.length === 0;

function load(cartKey: string): CartLine[] {
  try {
    const raw = localStorage.getItem(cartKey);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Partial<CartLine>[];
    // Migra linhas antigas {product, quantity} pro modelo novo.
    return arr
      .filter((l) => l && l.product)
      .map((l) => ({
        id: l.id ?? newLineId(),
        product: l.product as FoodProduct,
        quantity: l.quantity ?? 1,
        notes: l.notes ?? "",
        addons: Array.isArray(l.addons) ? l.addons : [],
      }));
  } catch {
    return [];
  }
}

export function useFoodCart(cartKey: string) {
  const [lines, setLines] = useState<CartLine[]>(() => load(cartKey));

  // Troca de loja (cartKey) → recarrega o carrinho daquela loja.
  useEffect(() => {
    setLines(load(cartKey));
  }, [cartKey]);

  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(lines));
    } catch {
      /* localStorage cheio/indisponível — segue sem persistir */
    }
  }, [cartKey, lines]);

  const addQuick = useCallback((product: FoodProduct) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id && isPlainLine(l));
      if (existing) {
        return prev.map((l) => (l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { id: newLineId(), product, quantity: 1, notes: "", addons: [] }];
    });
  }, []);

  const removeQuick = useCallback((productId: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === productId && isPlainLine(l));
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map((l) => (l.id === existing.id ? { ...l, quantity: l.quantity - 1 } : l));
      }
      return prev.filter((l) => l.id !== existing.id);
    });
  }, []);

  const addCustomLine = useCallback(
    (product: FoodProduct, quantity: number, notes: string, addons: CartAddon[]) => {
      setLines((prev) => [
        ...prev,
        { id: newLineId(), product, quantity: Math.max(1, quantity), notes, addons },
      ]);
    },
    []
  );

  /** Linha de montagem rica (pizza): seleções + preço já computado. */
  const addRichLine = useCallback(
    (
      product: FoodProduct,
      args: { quantity: number; notes: string; addonSelections: AddonSelection[]; richUnitPrice: number; richLabel: string[] }
    ) => {
      setLines((prev) => [
        ...prev,
        {
          id: newLineId(), product, quantity: Math.max(1, args.quantity), notes: args.notes, addons: [],
          addonSelections: args.addonSelections, richUnitPrice: args.richUnitPrice, richLabel: args.richLabel,
        },
      ]);
    },
    []
  );

  const updateLine = useCallback(
    (id: string, patch: Partial<Pick<CartLine, "quantity" | "notes" | "addons">>) => {
      setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    []
  );

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  /** Qtd da linha "plana" desse produto (badge ± do cardápio; ignora linhas com addons). */
  const quantityOf = useCallback(
    (productId: number) =>
      lines
        .filter((l) => l.product.id === productId && isPlainLine(l))
        .reduce((s, l) => s + l.quantity, 0),
    [lines]
  );

  const total = useMemo(() => lines.reduce((s, l) => s + lineTotal(l), 0), [lines]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  return {
    lines,
    addQuick,
    removeQuick,
    addCustomLine,
    addRichLine,
    updateLine,
    removeLine,
    clear,
    quantityOf,
    total,
    count,
  };
}

export type FoodCart = ReturnType<typeof useFoodCart>;
