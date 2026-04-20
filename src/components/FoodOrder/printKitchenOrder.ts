import { buildStoreHeader, escapeHtml, PRINT_STYLES } from "./printHeader";

export interface PrintableOrderItem {
  quantity: number;
  productName: string | null;
  notes: string | null;
  commandId?: number | null;
  unitPrice?: number;
}

export interface PrintableOrderCommand {
  id: number;
  displayNumber: number;
  name: string | null;
}

export interface PrintableOrder {
  id: number;
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  tableNumber?: number | null;
  storeName?: string | null;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  items: PrintableOrderItem[];
  /** Lista de comandas do pedido (opcional, só usada em pedidos de mesa) */
  commands?: PrintableOrderCommand[];
}

const fmtMoney = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const fmtTime = (d: string) =>
  new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

const commandLabel = (commandId: number | null | undefined, commands: PrintableOrderCommand[]): string => {
  if (commandId == null) return "Mesa";
  const c = commands.find((x) => x.id === commandId);
  return c ? (c.name || `Comanda #${c.displayNumber}`) : `Comanda #${commandId}`;
};

const printKitchenOrder = (order: PrintableOrder): void => {
  const commands = order.commands || [];
  const isTableOrder = order.tableNumber != null;

  // Agrupa itens por comanda (Mesa primeiro, depois por displayNumber)
  const orderForCommand = (commandId: number | null | undefined): number => {
    if (commandId == null) return -1;
    const c = commands.find((x) => x.id === commandId);
    return c ? c.displayNumber : Number.MAX_SAFE_INTEGER;
  };
  const sorted = [...(order.items || [])].sort(
    (a, b) => orderForCommand(a.commandId) - orderForCommand(b.commandId)
  );
  const groups = new Map<number | null, PrintableOrderItem[]>();
  for (const it of sorted) {
    const k = it.commandId ?? null;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }

  const headerHtml = buildStoreHeader({
    storeName: order.storeName,
    storeDocument: order.storeDocument,
    storePhone: order.storePhone,
    storeAddress: order.storeAddress,
    tableNumber: order.tableNumber,
  });

  // Body
  let bodyHtml = `<div class="ph-section-title">PEDIDO #${order.id}</div>`;
  // Para pedidos de delivery, mostra contato/endereço (crítico pro motoboy).
  // Pedidos de mesa já têm tudo no header — mantém o corpo limpo.
  if (!isTableOrder) {
    bodyHtml += `<div class="ph-order-meta">${fmtTime(order.createdAt)}</div>`;
    if (order.customerName) bodyHtml += `<div class="ph-order-meta">Cliente: ${escapeHtml(order.customerName)}</div>`;
    if (order.customerPhone) bodyHtml += `<div class="ph-order-meta">Tel: ${escapeHtml(order.customerPhone)}</div>`;
    if (order.deliveryAddress) bodyHtml += `<div class="ph-order-meta">Entrega: ${escapeHtml(order.deliveryAddress)}</div>`;
  }
  bodyHtml += `<div class="ph-divider"></div>`;

  // Quando houver comandas efetivas, imprime com agrupamento. Caso contrário, tabela simples.
  const hasMultipleGroups = isTableOrder && (commands.length > 0 || groups.size > 1);
  if (hasMultipleGroups) {
    for (const [cmdId, items] of groups) {
      bodyHtml += `<div class="ph-cmd-title">${escapeHtml(commandLabel(cmdId, commands))}</div>`;
      bodyHtml += `<table class="ph-items">`;
      for (const it of items) {
        bodyHtml += `<tr><td class="ph-qty"><strong>${it.quantity}x</strong></td><td>${escapeHtml(it.productName || "Item")}</td></tr>`;
        if (it.notes) bodyHtml += `<tr><td colspan="2" class="ph-note">📝 ${escapeHtml(it.notes)}</td></tr>`;
      }
      bodyHtml += `</table>`;
    }
  } else {
    bodyHtml += `<table class="ph-items">`;
    for (const it of sorted) {
      bodyHtml += `<tr><td class="ph-qty"><strong>${it.quantity}x</strong></td><td>${escapeHtml(it.productName || "Item")}</td></tr>`;
      if (it.notes) bodyHtml += `<tr><td colspan="2" class="ph-note">📝 ${escapeHtml(it.notes)}</td></tr>`;
    }
    bodyHtml += `</table>`;
  }

  if (order.notes) {
    bodyHtml += `<div class="ph-order-meta" style="margin-top:8px;font-style:italic">OBS: ${escapeHtml(order.notes)}</div>`;
  }

  bodyHtml += `<div class="ph-total-row"><span>TOTAL</span><span>${fmtMoney(order.total)}</span></div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido #${order.id}</title><style>${PRINT_STYLES}</style></head><body>${headerHtml}${bodyHtml}</body></html>`;

  const printWindow = window.open("", "_blank", "width=420,height=640");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
};

export default printKitchenOrder;
