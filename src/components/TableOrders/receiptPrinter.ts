/**
 * Impressão de recibos térmicos de rodada (novos itens / cancelamentos).
 * Usa o cabeçalho compartilhado (buildStoreHeader) + PRINT_STYLES pra manter consistência
 * com as outras impressões do módulo (pedido geral, embalar).
 */

import { buildStoreHeader, escapeHtml, PRINT_STYLES } from "../FoodOrder/printHeader";

interface RoundReceiptData {
  orderId: number | null;
  tableNumber: number;
  storeName?: string | null;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  authorName: string;
  roundNumber?: number;
  newItems: Array<{ productName: string; quantity: number; unitPrice: number; commandLabel?: string | null }>;
  cancelledItems: Array<{ productName: string; quantity: number; commandLabel?: string | null }>;
  notes?: string | null;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildRoundReceiptHTML(data: RoundReceiptData): string {
  const headerHtml = buildStoreHeader({
    storeName: data.storeName,
    storeDocument: data.storeDocument,
    storePhone: data.storePhone,
    storeAddress: data.storeAddress,
    tableNumber: data.tableNumber,
  });

  // Agrupa por comanda (Mesa primeiro, depois alfabético)
  const groupByCommand = <T extends { commandLabel?: string | null }>(items: T[]): Map<string, T[]> => {
    const groups = new Map<string, T[]>();
    for (const item of items) {
      const key = item.commandLabel || "Mesa";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return new Map([...groups.entries()].sort((a, b) => {
      if (a[0] === "Mesa") return -1;
      if (b[0] === "Mesa") return 1;
      return a[0].localeCompare(b[0]);
    }));
  };

  const renderSection = (title: string, items: typeof data.newItems | typeof data.cancelledItems, cancelled: boolean): string => {
    if (items.length === 0) return "";
    let html = `<div class="rr-section-header${cancelled ? " cancelled" : ""}">${title}</div>`;
    const groups = groupByCommand(items);
    for (const [cmdLabel, groupItems] of groups) {
      if (groups.size > 1 || cmdLabel !== "Mesa") {
        html += `<div class="rr-cmd-header">» ${escapeHtml(cmdLabel)}</div>`;
      }
      html += `<table class="rr-items">`;
      for (const item of groupItems) {
        const priceCell = cancelled ? "—" : formatMoney(("unitPrice" in item ? (item as any).unitPrice : 0) * item.quantity);
        const rowClass = cancelled ? "rr-cancelled" : "";
        html += `<tr class="${rowClass}"><td class="rr-qty"><strong>${item.quantity}x</strong></td><td>${escapeHtml(item.productName)}</td><td class="rr-price">${priceCell}</td></tr>`;
      }
      html += `</table>`;
    }
    return html;
  };

  // Título principal + divisor (mesmo padrão do PEDIDO #56 / EMPACOTAR #56)
  const orderLabel = data.orderId ? `PEDIDO #${data.orderId}` : "PEDIDO";
  const roundLine = data.roundNumber && data.roundNumber > 1
    ? `<div class="ph-order-meta">Rodada ${data.roundNumber}</div>`
    : "";
  const body = `
    <div class="ph-section-title">${orderLabel}</div>
    ${roundLine}
    <div class="ph-divider"></div>
    ${renderSection("NOVO", data.newItems, false)}
    ${renderSection("CANCELAR", data.cancelledItems, true)}
    ${data.notes ? `<div class="rr-notes"><span class="rr-label">OBS:</span> ${escapeHtml(data.notes)}</div>` : ""}
    <div class="rr-footer">${escapeHtml(data.authorName)}</div>
  `;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${PRINT_STYLES}
  .rr-section-header { font-weight: 900; font-size: 14px; padding: 6px 0 3px; border-bottom: 1px solid #000; margin-top: 4px; }
  .rr-cmd-header { font-weight: 700; font-size: 12px; padding: 4px 0 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .rr-items { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .rr-items td { padding: 2px 0; vertical-align: top; font-size: 13px; }
  .rr-qty { width: 30px; }
  .rr-price { width: 70px; text-align: right; }
  .rr-cancelled td { text-decoration: line-through; opacity: 0.7; }
  .rr-notes { padding: 4px 0; border-top: 1px dashed #000; margin-top: 4px; }
  .rr-notes .rr-label { font-weight: 700; }
  .rr-footer { text-align: center; padding-top: 6px; border-top: 2px dashed #000; margin-top: 6px; font-size: 11px; }
</style>
</head>
<body>
  ${headerHtml}
  ${body}
</body>
</html>`;
}

export function printRoundReceipt(data: RoundReceiptData): void {
  const html = buildRoundReceiptHTML(data);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "80mm";
  iframe.style.height = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;

  iframe.onload = () => {
    if (printed) return;
    printed = true;
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 1000);
    }, 200);
  };
}
