import { api } from "../../services/api";
import { buildStoreHeader, escapeHtml, PRINT_STYLES } from "./printHeader";

/**
 * Fallback de impressão quando a Print Bridge (térmica) falha: busca o pedido, monta o recibo em
 * HTML (com a composição da montagem — Tamanho/Sabores/Borda) e abre a janela de impressão do
 * navegador, onde o lojista pode "Salvar como PDF" ou mandar pra qualquer impressora do SO.
 */

interface RawAddon {
  productName?: string | null;
  addonGroupName?: string | null;
  addonGroupId?: number | null;
  addonPricingMode?: string | null;
  fraction?: number | null;
  unitPrice?: number | null;
  quantity?: number | null;
}

/** Ordem de exibição da composição: Tamanho → Sabores → Borda/extras. */
const modeRank = (m?: string | null): number =>
  m === "SIZE_SELECTOR" ? 0 : m === "FLAVOR_MATRIX" ? 1 : m === "ADDITIVE" ? 2 : 3;

/** Linha de cada opção da composição. Tamanho carrega "(N sabores)". */
function addonLineLabel(a: RawAddon, flavorCount: number): string {
  const name = a.productName || "";
  const group = a.addonGroupName ? `${a.addonGroupName}: ` : "+ ";
  if (a.addonPricingMode === "SIZE_SELECTOR") {
    const sufN = flavorCount > 0 ? ` (${flavorCount} ${flavorCount > 1 ? "sabores" : "sabor"})` : "";
    return `${group}${name}${sufN}`;
  }
  const price = Number(a.unitPrice ?? 0) * Number(a.quantity ?? 1);
  const q = Number(a.quantity ?? 1) > 1 ? `${a.quantity}x ` : "";
  const sufPrice = price > 0 ? ` (+${money(price)})` : "";
  return `${group}${q}${fracSymbol(a.fraction)}${name}${sufPrice}`;
}
interface RawItem {
  productName?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  notes?: string | null;
  observation?: string | null;
  addons?: RawAddon[] | null;
}

const money = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`;

const fracSymbol = (f: number | null | undefined): string => {
  const v = f == null ? 1 : Number(f);
  if (v >= 0.99) return "";
  if (v >= 0.49 && v <= 0.51) return "½ ";
  if (v >= 0.32 && v <= 0.34) return "⅓ ";
  if (v >= 0.24 && v <= 0.26) return "¼ ";
  return "";
};

function itemsHtml(items: RawItem[]): string {
  let html = `<table class="ph-items">`;
  for (const it of items) {
    const qty = Number(it.quantity ?? 1);
    const lineUnit = Number(it.unitPrice ?? 0);
    // Ordena Tamanho → Sabores → Borda e conta os sabores (pra "Tamanho: X (N sabores)").
    const addons = (it.addons ?? []).slice().sort((a, b) => modeRank(a.addonPricingMode) - modeRank(b.addonPricingMode));
    const flavorCount = addons.filter((a) => a.addonPricingMode === "FLAVOR_MATRIX").length;
    const additive = addons.reduce((s, a) => s + Number(a.unitPrice ?? 0) * Number(a.quantity ?? 1), 0);
    const lineTotal = lineUnit * qty + additive;
    html += `<tr><td class="ph-qty"><strong>${qty}x</strong></td>` +
            `<td>${escapeHtml(it.productName || "Item")}</td>` +
            `<td style="text-align:right">${money(lineTotal)}</td></tr>`;
    for (const a of addons) {
      html += `<tr><td></td><td colspan="2" class="ph-note">${escapeHtml(addonLineLabel(a, flavorCount))}</td></tr>`;
    }
    const obs = it.observation || it.notes;
    if (obs) html += `<tr><td></td><td colspan="2" class="ph-note">📝 ${escapeHtml(obs)}</td></tr>`;
  }
  html += `</table>`;
  return html;
}

export async function printOrderAsPdf(orderId: number): Promise<{ ok: boolean; error?: string }> {
  let order: any;
  try {
    const { data } = await api.get(`/api/orders/${orderId}`);
    order = data;
  } catch (e: any) {
    return { ok: false, error: e?.response?.data?.message || e?.message || "Falha ao carregar o pedido" };
  }

  const header = buildStoreHeader({
    storeName: order.storeName,
    storeDocument: order.storeDocument,
    storePhone: order.storePhone,
    storeAddress: order.storeAddress,
    storeLogoUrl: order.storeLogoUrl,
    tableNumber: order.tableNumber,
  });

  const total = Number(order.total ?? 0);
  const subtotal = Number(order.subtotal ?? 0);
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const tipo = order.orderType === "PICKUP" ? "Retirada no balcão"
    : order.orderType === "TABLE" ? "Mesa" : "Entrega";

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido #${order.id}</title>`;
  html += `<style>${PRINT_STYLES}</style></head><body>`;
  html += `<div class="ph-frame">`;
  html += header;
  html += `<div class="ph-section-title">PEDIDO #${order.id}</div>`;
  html += `<div class="ph-divider"></div>`;
  html += `<div class="ph-info">${escapeHtml(tipo)}</div>`;
  if (order.customerName) html += `<div class="ph-info">Cliente: ${escapeHtml(order.customerName)}</div>`;
  if (order.deliveryAddress) html += `<div class="ph-info">${escapeHtml(order.deliveryAddress)}</div>`;
  if (order.deliveryCode) html += `<div class="ph-info">Código: <strong>${escapeHtml(String(order.deliveryCode))}</strong></div>`;
  html += `<div class="ph-divider"></div>`;
  html += itemsHtml(order.items ?? []);
  html += `<div class="ph-divider"></div>`;
  html += `<table class="ph-items">`;
  html += `<tr><td colspan="2">Subtotal</td><td style="text-align:right">${money(subtotal)}</td></tr>`;
  if (deliveryFee > 0) html += `<tr><td colspan="2">Taxa de entrega</td><td style="text-align:right">${money(deliveryFee)}</td></tr>`;
  html += `<tr><td colspan="2"><strong>TOTAL</strong></td><td style="text-align:right"><strong>${money(total)}</strong></td></tr>`;
  html += `</table>`;
  html += `</div>`; // .ph-frame
  html += `</body></html>`;

  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return { ok: false, error: "Pop-up bloqueado — permita pop-ups para imprimir como PDF." };
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 150);
  return { ok: true };
}
