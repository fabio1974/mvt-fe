import type { AddonGroup, FoodProduct } from "./foodTypes";

/** Todos os produtos do menu (categorias + sem categoria). */
export function allProducts(menu: {
  categories: { products: FoodProduct[] }[];
  uncategorized?: FoodProduct[] | null;
}): FoodProduct[] {
  return [
    ...menu.categories.flatMap((c) => c.products),
    ...(menu.uncategorized ?? []),
  ];
}

/**
 * Agrupa produtos is_addon por categoria. Adicionais indisponíveis (available ===
 * false) são omitidos. A ordem das categorias segue a 1ª aparição.
 */
export function buildAddonGroups(products: FoodProduct[]): AddonGroup[] {
  const byCat = new Map<string, FoodProduct[]>();
  for (const p of products) {
    if (!p.isAddon || p.available === false) continue;
    const cat = p.categoryName || "Adicionais";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(p);
  }
  return Array.from(byCat.entries()).map(([categoryName, items]) => ({ categoryName, items }));
}

/**
 * Adicionais aplicáveis a UM produto: só os is_addon da MESMA categoria do produto.
 * É como a loja escopa addons por categoria (ex.: sabores do Pop Coxinhas só nos
 * Salgados). Sem categoria → sem addons.
 */
export function addonGroupsForProduct(products: FoodProduct[], product: FoodProduct): AddonGroup[] {
  if (product.categoryId == null) return [];
  const sameCategory = products.filter((p) => p.categoryId === product.categoryId);
  return buildAddonGroups(sameCategory);
}

/** True se o produto tem ao menos um adicional disponível na sua categoria. */
export function productHasAddons(products: FoodProduct[], product: FoodProduct): boolean {
  if (product.categoryId == null) return false;
  return products.some(
    (p) => p.isAddon && p.available !== false && p.categoryId === product.categoryId
  );
}
