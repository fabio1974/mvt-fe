// Helpers compartilhados para impressão térmica (80mm) de recibos do módulo Zapi-Food.
// Gera cabeçalho com dados do estabelecimento; quando for pedido de mesa, inclui badge "MESA XX" alinhado à direita.

export interface StoreHeaderOptions {
  storeName: string | null | undefined;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  tableNumber?: number | null;
  /** Se true, inclui data/hora atual como última linha do header */
  includeDate?: boolean;
}

export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export function buildStoreHeader(opts: StoreHeaderOptions): string {
  const storeName = opts.storeName || "Estabelecimento";
  const storeDoc = opts.storeDocument ? `CNPJ: ${opts.storeDocument}` : "";
  const storePhone = opts.storePhone || "";
  const storeAddr = opts.storeAddress || "";
  const isTableOrder = opts.tableNumber != null;
  const now = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const tableBadge = isTableOrder
    ? `<div class="ph-table-badge">MESA<br><strong>${String(opts.tableNumber).padStart(2, "0")}</strong></div>`
    : "";

  let html = `<div class="ph-header">`;
  html += `<div class="ph-title-row">`;
  html += `<div class="ph-store-name">${escapeHtml(storeName)}</div>`;
  html += tableBadge;
  html += `</div>`;
  if (storeAddr) html += `<div class="ph-info">${escapeHtml(storeAddr)}</div>`;
  const docPhoneLine = [storeDoc, storePhone].filter(Boolean).map(escapeHtml).join(" • ");
  if (docPhoneLine) html += `<div class="ph-info">${docPhoneLine}</div>`;
  if (opts.includeDate !== false) html += `<div class="ph-info">${now}</div>`;
  html += `</div>`;
  return html;
}

/** CSS compartilhado para a estrutura gerada pelo buildStoreHeader + layout 80mm. */
export const PRINT_STYLES = `
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 4mm; color: #000; }
  .ph-header { border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
  .ph-title-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .ph-store-name { flex: 1; text-align: center; font-size: 20px; font-weight: 900; letter-spacing: 1px; }
  .ph-info { font-size: 11px; margin-top: 2px; text-align: center; }
  .ph-table-badge { border: 2px solid #000; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 700; text-align: center; line-height: 1.1; flex-shrink: 0; }
  .ph-table-badge strong { font-size: 16px; }
  .ph-section-title { font-weight: 900; text-align: center; margin: 8px 0 4px; font-size: 13px; letter-spacing: 1px; }
  .ph-order-meta { text-align: center; font-size: 11px; margin-bottom: 4px; }
  .ph-divider { border-bottom: 2px dashed #000; margin: 6px 0 8px; }
  .ph-cmd-title { font-size: 13px; font-weight: 700; margin: 10px 0 4px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
  .ph-items { width: 100%; border-collapse: collapse; }
  .ph-items td { padding: 2px 0; vertical-align: top; font-size: 13px; }
  .ph-qty { width: 32px; }
  .ph-note { color: #333; font-size: 11px; padding-left: 36px; font-style: italic; }
  .ph-total-row { margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
`;
