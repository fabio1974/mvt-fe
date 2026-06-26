import type { RichAddonGroup, AddonSelection } from "./foodTypes";

/** Estado do builder: groupId -> productIds das opções escolhidas (na ordem). */
export type BuilderSelection = Record<number, number[]>;

export interface PizzaPriceResult {
  base: number;
  additive: number;
  unitPrice: number;
  valid: boolean;
  errors: string[];
  labels: { groupName: string; label: string }[];
}

const FRACTION_SYMBOL: Record<number, string> = { 1: "", 2: "½ ", 3: "⅓ ", 4: "¼ " };
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function selectedSize(groups: RichAddonGroup[], sel: BuilderSelection) {
  const sizeGroup = groups.find((g) => g.pricingMode === "SIZE_SELECTOR");
  if (!sizeGroup) return { sizeKey: null as string | null, flavorsAllowed: null as number | null };
  const chosen = (sel[sizeGroup.id] ?? [])[0];
  if (chosen == null) return { sizeKey: null, flavorsAllowed: null };
  const opt = sizeGroup.options.find((o) => o.productId === chosen);
  return { sizeKey: String(chosen), flavorsAllowed: opt?.flavorsAllowed ?? null };
}

/** Teto efetivo de sabores = min(maxSelect, flavorsAllowed do tamanho). */
export function flavorCap(group: RichAddonGroup, flavorsAllowed: number | null): number | null {
  const caps = [group.maxSelect, flavorsAllowed].filter((n): n is number => n != null);
  return caps.length ? Math.min(...caps) : null;
}

function combineFlavors(rule: RichAddonGroup["fractionRule"], prices: number[]): number {
  if (prices.length === 0) return 0;
  switch (rule) {
    case "HIGHEST":
      return Math.max(...prices);
    case "AVG":
    case "PROPORTIONAL":
    default:
      return prices.reduce((s, p) => s + p, 0) / prices.length;
  }
}

/** Computa preço + validação + rótulos espelhando a engine do BE (matriz tamanho×sabor + média). */
export function computePizza(groups: RichAddonGroup[], sel: BuilderSelection): PizzaPriceResult {
  const { sizeKey, flavorsAllowed } = selectedSize(groups, sel);
  let base = 0;
  let additive = 0;
  const errors: string[] = [];
  const labels: { groupName: string; label: string }[] = [];

  for (const g of groups) {
    const chosenIds = sel[g.id] ?? [];
    const chosenOpts = chosenIds
      .map((pid) => g.options.find((o) => o.productId === pid))
      .filter((o): o is NonNullable<typeof o> => o != null);

    const min = Math.max(g.required ? Math.max(1, g.minSelect) : g.minSelect, 0);
    const cap = g.pricingMode === "FLAVOR_MATRIX" ? flavorCap(g, flavorsAllowed) : g.maxSelect;
    if (chosenOpts.length < min) {
      errors.push(`Escolha ${min > 1 ? `${min} opções` : ""} em "${g.name}"`.replace("  ", " ").trim() || `Escolha em "${g.name}"`);
    }
    if (cap != null && chosenOpts.length > cap) errors.push(`Máximo de ${cap} em "${g.name}"`);

    if (g.pricingMode === "SIZE_SELECTOR") {
      if (chosenOpts.length) labels.push({ groupName: g.name, label: chosenOpts[0].name });
    } else if (g.pricingMode === "FLAVOR_MATRIX") {
      const n = chosenOpts.length;
      const prices: number[] = [];
      for (const o of chosenOpts) {
        const p = sizeKey != null ? o.pricePerSize?.[sizeKey] : o.price ?? undefined;
        if (p == null) errors.push(`"${o.name}" indisponível neste tamanho`);
        else prices.push(p);
      }
      if (prices.length === n && n > 0) base += combineFlavors(g.fractionRule, prices);
      if (n) {
        const sym = FRACTION_SYMBOL[n] ?? "";
        labels.push({ groupName: g.name, label: chosenOpts.map((o) => `${sym}${o.name}`).join(", ") });
      }
    } else {
      for (const o of chosenOpts) additive += o.price ?? 0;
      if (chosenOpts.length) labels.push({ groupName: g.name, label: chosenOpts.map((o) => o.name).join(", ") });
    }
  }

  base = round2(base);
  additive = round2(additive);
  return { base, additive, unitPrice: round2(base + additive), valid: errors.length === 0, errors, labels };
}

/** Converte o estado do builder no payload de seleções (AddonSelection[]). */
export function toAddonSelections(groups: RichAddonGroup[], sel: BuilderSelection): AddonSelection[] {
  const out: AddonSelection[] = [];
  for (const g of groups) {
    const ids = sel[g.id] ?? [];
    if (!ids.length) continue;
    if (g.pricingMode === "FLAVOR_MATRIX") {
      const frac = Math.round((1 / ids.length) * 1000) / 1000;
      out.push({ groupId: g.id, options: ids.map((pid) => ({ productId: pid, fraction: frac })) });
    } else if (g.pricingMode === "SIZE_SELECTOR") {
      out.push({ groupId: g.id, options: [{ productId: ids[0], fraction: 1 }] });
    } else {
      out.push({ groupId: g.id, options: ids.map((pid) => ({ productId: pid, quantity: 1 })) });
    }
  }
  return out;
}

export function flatLabels(result: PizzaPriceResult): string[] {
  return result.labels.map((l) => l.label);
}
