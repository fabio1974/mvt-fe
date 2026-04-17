/**
 * Impressão de recibos térmicos via window.print() com iframe oculto.
 * Formata para papel de 80mm (padrão de impressoras térmicas).
 * Mesmo layout do mobile (ESC/POS) mas usando HTML/CSS.
 */

interface RoundReceiptData {
  orderId: number | null;
  tableNumber: number;
  establishmentName: string;
  authorName: string;
  roundNumber?: number;
  newItems: Array<{ productName: string; quantity: number; unitPrice: number }>;
  cancelledItems: Array<{ productName: string; quantity: number }>;
  notes?: string | null;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildRoundReceiptHTML(data: RoundReceiptData): string {
  const now = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  let itemsHTML = "";

  if (data.newItems.length > 0) {
    itemsHTML += `<tr><td colspan="3" class="section-header">NOVO</td></tr>`;
    for (const item of data.newItems) {
      itemsHTML += `
        <tr>
          <td class="col-qty">${item.quantity}x</td>
          <td class="col-name">${item.productName}</td>
          <td class="col-price">${formatMoney(item.unitPrice * item.quantity)}</td>
        </tr>`;
    }
  }

  if (data.cancelledItems.length > 0) {
    itemsHTML += `<tr><td colspan="3" class="section-header cancelled">CANCELAR</td></tr>`;
    for (const item of data.cancelledItems) {
      itemsHTML += `
        <tr class="cancelled-item">
          <td class="col-qty">${item.quantity}x</td>
          <td class="col-name">${item.productName}</td>
          <td class="col-price">—</td>
        </tr>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 80mm;
    padding: 4mm;
    color: #000;
  }
  .header {
    text-align: center;
    font-size: 22px;
    font-weight: 900;
    padding: 6px 0;
    border-bottom: 2px dashed #000;
    margin-bottom: 6px;
  }
  .round {
    text-align: center;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 4px;
  }
  .info {
    padding: 4px 0;
    border-bottom: 1px dashed #000;
    margin-bottom: 6px;
  }
  .info-row {
    display: flex;
    gap: 4px;
  }
  .info-row .label {
    font-weight: 700;
    min-width: 55px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
  }
  .section-header {
    font-weight: 900;
    font-size: 14px;
    padding: 6px 0 3px;
    border-bottom: 1px solid #000;
  }
  .section-header.cancelled {
    color: #000;
  }
  .col-qty {
    width: 30px;
    font-weight: 700;
    vertical-align: top;
    padding: 2px 0;
  }
  .col-name {
    padding: 2px 4px;
    vertical-align: top;
  }
  .col-price {
    width: 70px;
    text-align: right;
    vertical-align: top;
    padding: 2px 0;
  }
  .cancelled-item td {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .notes {
    padding: 4px 0;
    border-top: 1px dashed #000;
    margin-top: 4px;
  }
  .notes .label { font-weight: 700; }
  .footer {
    text-align: center;
    padding-top: 6px;
    border-top: 2px dashed #000;
    margin-top: 6px;
    font-size: 11px;
  }
</style>
</head>
<body>
  <div class="header">MESA #${data.tableNumber}</div>
  ${data.roundNumber && data.roundNumber > 1 ? `<div class="round">RODADA ${data.roundNumber}</div>` : ""}
  <div class="info">
    ${data.orderId ? `<div class="info-row"><span class="label">Pedido:</span> #${data.orderId}</div>` : ""}
    <div class="info-row"><span class="label">Hora:</span> ${now}</div>
  </div>
  <table>${itemsHTML}</table>
  ${data.notes ? `<div class="notes"><span class="label">OBS:</span> ${data.notes}</div>` : ""}
  <div class="footer">${data.authorName}</div>
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
