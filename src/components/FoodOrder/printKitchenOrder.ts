export interface PrintableOrder {
  id: number;
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  items: { quantity: number; productName: string | null; notes: string | null }[];
}

const printKitchenOrder = (order: PrintableOrder) => {
  const fmtTime = (d: string) =>
    new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  const itemsHtml = order.items
    ?.map(
      (item) =>
        `<tr>
          <td style="font-size:18px;font-weight:bold;padding:6px 4px;border-bottom:1px dashed #999">${item.quantity}x</td>
          <td style="font-size:18px;padding:6px 4px;border-bottom:1px dashed #999">
            ${item.productName || "Item"}
            ${item.notes ? `<div style="font-size:14px;font-style:italic;color:#666;margin-top:2px">Obs: ${item.notes}</div>` : ""}
          </td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Pedido #${order.id}</title>
<style>
  @page { margin: 4mm; }
  body { font-family: 'Courier New', monospace; margin: 0; padding: 8px; max-width: 300px; }
  h1 { font-size: 22px; text-align: center; margin: 4px 0; border-bottom: 2px solid #000; padding-bottom: 6px; }
  .info { font-size: 14px; margin: 6px 0; }
  .info b { display: inline-block; min-width: 70px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .obs-geral { font-size: 16px; font-style: italic; border: 1px solid #000; padding: 6px; margin: 8px 0; }
  .footer { text-align: center; font-size: 12px; margin-top: 12px; border-top: 2px solid #000; padding-top: 6px; }
  .destaque { font-size: 20px; font-weight: bold; text-align: center; margin: 8px 0; }
</style>
</head><body>
<h1>PEDIDO #${order.id}</h1>
<div class="info"><b>Hora:</b> ${fmtTime(order.createdAt)}</div>
<div class="info"><b>Cliente:</b> ${order.customerName || "---"}</div>
<div class="info"><b>Tel:</b> ${order.customerPhone || "---"}</div>
${order.deliveryAddress ? `<div class="info"><b>Entrega:</b> ${order.deliveryAddress}</div>` : ""}
<table>${itemsHtml}</table>
${order.notes ? `<div class="obs-geral">OBS: ${order.notes}</div>` : ""}
<div class="destaque">TOTAL: R$ ${order.total.toFixed(2).replace(".", ",")}</div>
<div class="footer">Aceito em: ${fmtTime(new Date().toISOString())}</div>
</body></html>`;

  const printWindow = window.open("", "_blank", "width=350,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }
};

export default printKitchenOrder;
