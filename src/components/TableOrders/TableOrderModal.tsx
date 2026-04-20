import { useState, useEffect } from "react";
import { FiMinus, FiPlus, FiTrash2, FiMessageSquare } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { getUserId, getUserName } from "../../utils/auth";
import { printRoundReceipt } from "./receiptPrinter";
import "./TableOrderModal.css";

const ORDER_STATUS_COLORS: Record<string, string> = {
  PLACED: "#94a3b8",
  ACCEPTED: "#3b82f6",
  PREPARING: "#f59e0b",
  READY: "#22c55e",
  DELIVERING: "#8b5cf6",
  AWAITING_PAYMENT: "#f97316",
};

interface RestaurantTable {
  id: number;
  number: number;
  seats: number | null;
  active: boolean;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "UNAVAILABLE";
  clientId: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  available: boolean;
  categoryName: string | null;
}

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  commandId: number | null;
}

interface OrderInfo {
  id: number;
  status: string;
  total: number;
  notes: string | null;
  items: OrderItem[];
  mesaStatus?: "OPEN" | "PAID";
  mesaPaymentMethod?: string | null;
  mesaPaidAt?: string | null;
  storeName?: string | null;
  storeDocument?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
}

interface OrderCommand {
  id: number;
  displayNumber: number;
  name: string | null;
  status?: "OPEN" | "PAID";
  paymentMethod?: string | null;
  paidAt?: string | null;
}

interface CommandBreakdown {
  id: number;
  displayNumber: number;
  name: string | null;
  items: OrderItem[];
  subtotal: number;
  status: "OPEN" | "PAID";
  paymentMethod: string | null;
  paidAt: string | null;
}

interface MesaBreakdown {
  items: OrderItem[];
  subtotal: number;
  status: "OPEN" | "PAID";
  paymentMethod: string | null;
  paidAt: string | null;
}

interface BillBreakdown {
  commands: CommandBreakdown[];
  mesa: MesaBreakdown;
  grandTotal: number;
}

interface ProductQty {
  original: number;
  desired: number;
  itemIds: number[];
}

// Chave composta "commandId::productId" (commandId "null" = compartilhado)
const qtyKey = (commandId: number | null, productId: number) =>
  `${commandId ?? "null"}::${productId}`;

const commandLabel = (c: OrderCommand) => c.name || `Comanda #${c.displayNumber}`;

interface Props {
  table: RestaurantTable;
  onClose: () => void;
  onUpdated: () => void;
}

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Livre",
  RESERVED: "Reservada",
  OCCUPIED: "Ocupada",
  UNAVAILABLE: "Indisponível",
};

const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  RESERVED: "#f59e0b",
  OCCUPIED: "#8b5cf6",
  UNAVAILABLE: "#ef4444",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Novo",
  ACCEPTED: "Aceito",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERING: "Servido",
  AWAITING_PAYMENT: "Aguardando Pagamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const PAYMENT_OPTIONS = [
  { key: "PIX", label: "PIX" },
  { key: "CREDIT_CARD", label: "Cartão Crédito" },
  { key: "DEBIT_CARD", label: "Cartão Débito" },
  { key: "CASH", label: "Dinheiro" },
  { key: "NOT_INFORMED", label: "Não Informado" },
];

export default function TableOrderModal({ table, onClose, onUpdated }: Props) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [existingOrder, setExistingOrder] = useState<OrderInfo | null>(null);
  const [tableStatus, setTableStatus] = useState(table.status);
  const [qtys, setQtys] = useState<Record<string, ProductQty>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Comandas
  const [commands, setCommands] = useState<OrderCommand[]>([]);
  const [activeCommandId, setActiveCommandId] = useState<number | null>(null); // null = Mesa (compartilhado)
  const [showCommandsBar, setShowCommandsBar] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState<OrderCommand | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [breakdown, setBreakdown] = useState<BillBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [moveItem, setMoveItem] = useState<OrderItem | null>(null);

  // Pagamento parcial (comanda específica ou Mesa)
  // null = nenhum modal aberto; undefined = Mesa; number = commandId
  const [closingTarget, setClosingTarget] = useState<{ commandId: number | null; label: string; subtotal: number } | null>(null);

  const clientId = getUserId();

  const fetchData = async () => {
    if (!clientId) return;
    try {
      const [productRes, ordersRes, tablesRes] = await Promise.all([
        api.get(`/api/products/client/${clientId}`, { params: { channel: "TABLE" } }),
        api.get(`/api/orders/by-table/${table.id}`, { params: { activeOnly: true } }),
        api.get("/api/tables", { params: { activeOnly: false } }),
      ]);

      const prods = (productRes.data as Product[]).filter((p: Product) => p.available);
      setProducts(prods);

      const ordersData = ordersRes.data as any[];
      const order = ordersData.length > 0 ? ordersData[0] : null;
      setExistingOrder(order);

      const currentTable = (tablesRes.data as RestaurantTable[]).find((t: RestaurantTable) => t.id === table.id);
      if (currentTable) setTableStatus(currentTable.status);

      // Inicializar quantidades do pedido existente (chave = commandId::productId)
      const initial: Record<string, ProductQty> = {};
      if (order) {
        for (const item of order.items) {
          const key = qtyKey(item.commandId, item.productId || 0);
          if (!initial[key]) {
            initial[key] = { original: 0, desired: 0, itemIds: [] };
          }
          initial[key].original += item.quantity;
          initial[key].desired += item.quantity;
          initial[key].itemIds.push(item.id);
        }
      }
      setQtys(initial);

      // Carregar comandas se existe pedido
      if (order) {
        try {
          const cmdRes = await api.get(`/api/orders/${order.id}/commands`);
          setCommands(cmdRes.data as OrderCommand[]);
        } catch (e) {
          console.error("Erro ao carregar comandas:", e);
          setCommands([]);
        }
      } else {
        setCommands([]);
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova comanda — sempre persiste no BE. Cria pedido vazio se ainda não existir (mesa permanece LIVRE até ter itens).
  const handleAddCommand = async () => {
    try {
      let order = existingOrder;
      if (!order) {
        if (!clientId) return;
        const orderRes = await api.post("/api/orders/table", {
          clientId,
          tableId: table.id,
          items: [],
        });
        order = orderRes.data as OrderInfo;
        setExistingOrder(order);
      }
      const res = await api.post(`/api/orders/${order.id}/commands`, {});
      const newCmd = res.data as OrderCommand;
      setCommands((prev) => [...prev, newCmd]);
      setActiveCommandId(newCmd.id);
      setShowRenameModal(newCmd);
      setRenameValue("");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao criar comanda");
    }
  };

  const handleRenameCommand = async () => {
    if (!showRenameModal || !existingOrder) return;
    const newName = renameValue.trim() || null;
    try {
      const res = await api.patch(
        `/api/orders/${existingOrder.id}/commands/${showRenameModal.id}`,
        { name: newName }
      );
      const updated = res.data as OrderCommand;
      setCommands((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setShowRenameModal(null);
      setRenameValue("");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao renomear comanda");
    }
  };

  const handleDeleteCommand = async (cmd: OrderCommand) => {
    if (!existingOrder) return;
    if (!window.confirm(`Remover ${commandLabel(cmd)}?`)) return;
    try {
      await api.delete(`/api/orders/${existingOrder.id}/commands/${cmd.id}`);
      setCommands((prev) => prev.filter((c) => c.id !== cmd.id));
      if (activeCommandId === cmd.id) setActiveCommandId(null);
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao remover comanda");
    }
  };

  const handleMoveItemTo = async (targetCommandId: number | null) => {
    if (!moveItem || !existingOrder) return;
    try {
      await api.patch(
        `/api/orders/${existingOrder.id}/items/${moveItem.id}/command`,
        { commandId: targetCommandId }
      );
      setMoveItem(null);
      await fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao mover item");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Se a mesa está sem pedido e sem comandas, não faz sentido manter a barra visível: volta o botão "Dividir Mesa"
  useEffect(() => {
    if (!existingOrder && commands.length === 0 && showCommandsBar) {
      setShowCommandsBar(false);
    }
  }, [existingOrder, commands, showCommandsBar]);

  const getQty = (productId: number): ProductQty =>
    qtys[qtyKey(activeCommandId, productId)] || { original: 0, desired: 0, itemIds: [] };

  const increment = (productId: number) => {
    const key = qtyKey(activeCommandId, productId);
    setQtys((prev) => {
      const q = prev[key] || { original: 0, desired: 0, itemIds: [] };
      return { ...prev, [key]: { ...q, desired: q.desired + 1 } };
    });
  };

  const decrement = (productId: number) => {
    const key = qtyKey(activeCommandId, productId);
    setQtys((prev) => {
      const q = prev[key];
      if (!q || q.desired <= 0) return prev;
      return { ...prev, [key]: { ...q, desired: q.desired - 1 } };
    });
  };

  const parseKey = (key: string): { commandId: number | null; productId: number } => {
    const [cmdPart, pidPart] = key.split("::");
    return {
      commandId: cmdPart === "null" ? null : Number(cmdPart),
      productId: Number(pidPart),
    };
  };

  const additions = Object.entries(qtys).filter(([_, q]) => q.desired > q.original);
  const cancellations = Object.entries(qtys).filter(([_, q]) => q.desired < q.original);
  const addedCount = additions.reduce((sum, [_, q]) => sum + (q.desired - q.original), 0);
  const cancelledCount = cancellations.reduce((sum, [_, q]) => sum + (q.original - q.desired), 0);
  const hasChanges = addedCount > 0 || cancelledCount > 0;

  const existingTotal = existingOrder?.total ?? 0;
  const grandTotal = Object.entries(qtys).reduce((sum, [key, q]) => {
    const { productId } = parseKey(key);
    const product = products.find((p) => p.id === productId);
    return sum + (product ? product.price * q.desired : 0);
  }, 0);

  const handleSend = async () => {
    if (!hasChanges || !clientId) return;
    setSending(true);
    try {
      // 1. Cancelamentos
      for (const [_, q] of cancellations) {
        const diff = q.original - q.desired;
        const itemId = q.itemIds[q.itemIds.length - 1];
        if (itemId && existingOrder) {
          for (let i = 0; i < diff; i++) {
            await api.delete(`/api/orders/${existingOrder.id}/items/${itemId}`);
          }
        }
      }

      // 2. Adições
      let createdOrder: OrderInfo | null = null;
      if (addedCount > 0) {
        const items = additions.map(([key, q]) => {
          const { commandId, productId } = parseKey(key);
          return {
            productId,
            quantity: q.desired - q.original,
            commandId: commandId ?? undefined,
          };
        });
        if (existingOrder) {
          await api.post(`/api/orders/${existingOrder.id}/add-items`, { items });
        } else {
          const res = await api.post("/api/orders/table", {
            clientId,
            tableId: table.id,
            items,
            notes: notes || undefined,
          });
          createdOrder = res.data as OrderInfo;
        }
      }

      // Imprimir recibo (mesmo layout do mobile)
      const labelForCommand = (cmdId: number | null): string | null => {
        if (cmdId === null) return null; // Mesa (null)
        const cmd = commands.find((c) => c.id === cmdId);
        return cmd ? commandLabel(cmd) : null;
      };
      const newItems = additions.map(([key, q]) => {
        const { commandId, productId } = parseKey(key);
        const product = products.find((p) => p.id === productId);
        return {
          productName: product?.name || `Produto #${productId}`,
          quantity: q.desired - q.original,
          unitPrice: product?.price || 0,
          commandLabel: labelForCommand(commandId),
        };
      });
      const cancelledItems = cancellations.map(([key, q]) => {
        const { commandId, productId } = parseKey(key);
        const product = products.find((p) => p.id === productId);
        return {
          productName: product?.name || `Produto #${productId}`,
          quantity: q.original - q.desired,
          commandLabel: labelForCommand(commandId),
        };
      });

      const printSource = existingOrder ?? createdOrder;
      printRoundReceipt({
        orderId: printSource?.id ?? null,
        tableNumber: table.number,
        storeName: printSource?.storeName ?? null,
        storeDocument: printSource?.storeDocument ?? null,
        storePhone: printSource?.storePhone ?? null,
        storeAddress: printSource?.storeAddress ?? null,
        authorName: getUserName() || "Balcão",
        newItems,
        cancelledItems,
        notes: notes || null,
      });

      fetchData();
      onUpdated();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.response?.data?.error || "Erro ao enviar pedido");
    } finally {
      setSending(false);
    }
  };

  const handleOpenCloseBill = async () => {
    if (!existingOrder) return;
    // Carrega breakdown antes de mostrar opções de pagamento
    try {
      const res = await api.get<BillBreakdown>(`/api/orders/${existingOrder.id}/bill-breakdown`);
      const bd = res.data;
      // Se não sobrou nada a pagar (Mesa PAID/vazia e comandas OPEN restantes estão todas vazias)
      // dispara auto-complete direto, sem pedir forma de pagamento
      const mesaPending = bd.mesa.status === "OPEN" && bd.mesa.items.length > 0;
      const pendingCommands = bd.commands.filter((c) => c.status === "OPEN" && c.items.length > 0);
      if (!mesaPending && pendingCommands.length === 0) {
        setClosingBill(true);
        try {
          await api.post(`/api/orders/${existingOrder.id}/auto-complete`);
          onUpdated();
          const targetId = existingOrder.id;
          onClose();
          navigate(`/pedidos?orderId=${targetId}`);
          return;
        } catch (err: any) {
          alert(err?.response?.data?.error || "Erro ao finalizar conta");
        } finally {
          setClosingBill(false);
        }
        return;
      }
      setBreakdown(bd);
      setShowBreakdown(true);
    } catch (e) {
      // Fallback: se breakdown falhar, abre direto modal de pagamento
      setShowPaymentModal(true);
    }
  };

  // Abre modal de pagamento para comanda ativa (ou Mesa)
  const handleOpenCloseActive = async () => {
    if (!existingOrder) return;
    try {
      const res = await api.get<BillBreakdown>(`/api/orders/${existingOrder.id}/bill-breakdown`);
      const bd = res.data;
      if (activeCommandId === null) {
        // Mesa
        if (bd.mesa.status === "PAID") {
          alert("Mesa já foi paga.");
          return;
        }
        if (bd.mesa.items.length === 0) {
          alert("Mesa não tem itens para fechar.");
          return;
        }
        setClosingTarget({ commandId: null, label: "Mesa", subtotal: bd.mesa.subtotal });
      } else {
        const cb = bd.commands.find((c) => c.id === activeCommandId);
        if (!cb) return;
        if (cb.status === "PAID") {
          alert("Comanda já foi paga.");
          return;
        }
        if (cb.items.length === 0) {
          alert("Comanda não tem itens para fechar.");
          return;
        }
        setClosingTarget({ commandId: cb.id, label: cb.name || `Comanda #${cb.displayNumber}`, subtotal: cb.subtotal });
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao carregar comanda");
    }
  };

  const handleConfirmClosePartial = async (paymentMethod: string) => {
    if (!existingOrder || !closingTarget) return;
    setClosingBill(true);
    try {
      await api.patch(`/api/orders/${existingOrder.id}/close-partial`, {
        commandId: closingTarget.commandId,
        paymentMethod,
      });
      setClosingTarget(null);
      await fetchData();
      onUpdated();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao fechar");
    } finally {
      setClosingBill(false);
    }
  };

  const handleCloseBill = async (paymentMethod: string) => {
    if (!existingOrder) return;
    setClosingBill(true);
    setShowPaymentModal(false);
    setShowBreakdown(false);
    try {
      // Fecha Mesa + todas comandas ainda OPEN com o mesmo método
      const bd = breakdown ?? (await api.get<BillBreakdown>(`/api/orders/${existingOrder.id}/bill-breakdown`)).data;
      if (bd.mesa.status === "OPEN" && bd.mesa.items.length > 0) {
        await api.patch(`/api/orders/${existingOrder.id}/close-partial`, { commandId: null, paymentMethod });
      }
      for (const cb of bd.commands) {
        if (cb.status === "OPEN" && cb.items.length > 0) {
          await api.patch(`/api/orders/${existingOrder.id}/close-partial`, { commandId: cb.id, paymentMethod });
        }
      }
      // Garantir COMPLETED mesmo se sobraram comandas OPEN vazias
      await api.post(`/api/orders/${existingOrder.id}/auto-complete`);
      onUpdated();
      // Mesa liberada — navega pro pedido pra conferência/histórico
      const targetId = existingOrder.id;
      onClose();
      navigate(`/pedidos?orderId=${targetId}`);
      return;
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao fechar conta");
    } finally {
      setClosingBill(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!existingOrder) return;
    if (!window.confirm(`Mesa #${table.number} — R$ ${existingTotal.toFixed(2).replace(".", ",")}\n\nCliente efetuou o pagamento?`)) return;
    setClosingBill(true);
    try {
      await api.patch(`/api/orders/${existingOrder.id}/confirm-payment`, {});
      fetchData();
      onUpdated();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erro ao confirmar pagamento");
    } finally {
      setClosingBill(false);
    }
  };


  // Agrupar produtos por categoria
  const categories = [...new Set(products.map((p) => p.categoryName || "Outros"))];

  if (loading) {
    return (
      <div className="tom-overlay" onClick={onClose}>
        <div className="tom-panel" onClick={(e) => e.stopPropagation()}>
          <div className="tom-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tom-overlay" onClick={onClose}>
      <div className="tom-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tom-header">
          <div className="tom-header-left">
            <h2>Mesa #{table.number}</h2>
            <span className="tom-status-badge" style={{ background: TABLE_STATUS_COLORS[tableStatus] }}>
              {TABLE_STATUS_LABELS[tableStatus]}
            </span>
            {existingOrder && (
              <span
                className="tom-order-status-badge tom-order-link"
                style={{ background: ORDER_STATUS_COLORS[existingOrder.status] || "#94a3b8" }}
                onClick={() => { const id = existingOrder.id; onClose(); navigate(`/pedidos?orderId=${id}`); }}
                title="Abrir detalhes do pedido"
              >
                Pedido #{existingOrder.id} · {ORDER_STATUS_LABELS[existingOrder.status] || existingOrder.status}
              </span>
            )}
            {commands.length === 0 && !showCommandsBar && (
              <button
                className="tom-show-cmds-btn"
                onClick={() => {
                  setShowCommandsBar(true);
                  handleAddCommand();
                }}
                title="Dividir a conta por comandas"
              >
                Dividir Mesa
              </button>
            )}
          </div>
          <div className="tom-header-right">
            {existingOrder && existingOrder.status === "AWAITING_PAYMENT" ? (
              <button className="tom-action-btn confirm" onClick={handleConfirmPayment} disabled={closingBill}>
                {closingBill ? "Confirmando..." : "Confirmar Pgto"}
              </button>
            ) : existingOrder ? (
              <button className="tom-action-btn close-bill" onClick={handleOpenCloseBill} disabled={closingBill}>
                {closingBill ? "Fechando..." : "Fechar Conta"}
              </button>
            ) : null}
            <button className="tom-close-btn" onClick={onClose} title="Fechar">
              ×
            </button>
          </div>
        </div>

        {/* Tab bar de comandas — aparece quando há comandas ou o usuário clicou em "Dividir Mesa" */}
        {(commands.length > 0 || showCommandsBar) && (() => {
          const mesaPaid = existingOrder?.mesaStatus === "PAID";
          const activeCmd = activeCommandId !== null ? commands.find((c) => c.id === activeCommandId) : null;
          const activeIsPaid = activeCommandId === null ? mesaPaid : activeCmd?.status === "PAID";
          const activeHasItems = !!existingOrder?.items.some((i) =>
            activeCommandId === null ? i.commandId === null : i.commandId === activeCommandId
          );
          const canCloseActive = !activeIsPaid && activeHasItems;
          const hasMesaItems = !!existingOrder?.items.some((i) => i.commandId === null);
          return (
            <div className="tom-commands-tabs">
              {hasMesaItems && (
                <button
                  className={`tom-cmd-tab ${activeCommandId === null ? "active" : ""} ${mesaPaid ? "paid" : ""}`}
                  onClick={() => setActiveCommandId(null)}
                  title={mesaPaid ? "Mesa paga" : "Itens pendurados na mesa (mova para uma comanda se precisar)"}
                >
                  Mesa{mesaPaid && <span className="tom-cmd-paid-badge">✓</span>}
                </button>
              )}
              {commands.map((cmd) => {
                const isPaid = cmd.status === "PAID";
                return (
                  <button
                    key={cmd.id}
                    className={`tom-cmd-tab ${activeCommandId === cmd.id ? "active" : ""} ${isPaid ? "paid" : ""}`}
                    onClick={() => setActiveCommandId(cmd.id)}
                    onDoubleClick={() => {
                      if (isPaid) return;
                      setShowRenameModal(cmd);
                      setRenameValue(cmd.name || "");
                    }}
                    title={isPaid ? `${commandLabel(cmd)} — paga` : "Dois cliques para renomear"}
                  >
                    {commandLabel(cmd)}
                    {isPaid ? (
                      <span className="tom-cmd-paid-badge">✓</span>
                    ) : (
                      <span
                        className="tom-cmd-tab-del"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCommand(cmd); }}
                        title="Remover comanda"
                      >×</span>
                    )}
                  </button>
                );
              })}
              <button className="tom-cmd-tab tom-cmd-add" onClick={handleAddCommand} title="Adicionar comanda">
                +
              </button>
              <div className="tom-cmd-spacer" />
              {canCloseActive && (
                <button
                  className="tom-cmd-close-btn"
                  onClick={handleOpenCloseActive}
                  disabled={closingBill}
                  title={`Fechar ${activeCommandId === null ? "Mesa" : (activeCmd ? commandLabel(activeCmd) : "")}`}
                >
                  Fechar {activeCommandId === null ? "Mesa" : (activeCmd ? commandLabel(activeCmd) : "")}
                </button>
              )}
            </div>
          );
        })()}

        {/* Resumo do pedido existente — filtrado pela comanda ativa */}
        {existingOrder && existingOrder.items.length > 0 && (() => {
          const filteredItems = existingOrder.items.filter((item) =>
            activeCommandId === null ? item.commandId === null : item.commandId === activeCommandId
          );
          if (filteredItems.length === 0) {
            const activeCmd = activeCommandId !== null ? commands.find((c) => c.id === activeCommandId) : null;
            const label = activeCommandId === null || !activeCmd ? "Mesa" : commandLabel(activeCmd);
            return (
              <div className="tom-order-summary tom-empty-cmd">
                <em>Nenhum item em {label}</em>
              </div>
            );
          }
          const subtotal = filteredItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
          return (
            <div className="tom-order-summary">
              <table>
                <thead>
                  <tr>
                    <th className="col-qty">QTD</th>
                    <th className="col-name">ITEM</th>
                    <th className="col-price">VALOR</th>
                    <th className="col-move">MUDAR COMANDA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="col-qty">{item.quantity}x</td>
                      <td className="col-name">{item.productName}</td>
                      <td className="col-price">R$ {(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}</td>
                      <td className="col-move">
                        <button
                          className="tom-move-btn"
                          onClick={() => setMoveItem(item)}
                          title="Mover para outra comanda"
                        >⇄</button>
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td className="col-qty"></td>
                    <td className="col-name">Subtotal</td>
                    <td className="col-price"><strong>R$ {subtotal.toFixed(2).replace(".", ",")}</strong></td>
                    <td className="col-move"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Cardápio */}
        <div className="tom-menu">
          {categories.map((cat) => (
            <div key={cat} className="tom-category">
              <div className="tom-category-header">{cat}</div>
              {products
                .filter((p) => (p.categoryName || "Outros") === cat)
                .map((product) => {
                  const q = getQty(product.id);
                  const hasAny = q.desired > 0;
                  return (
                    <div key={product.id} className={`tom-product ${hasAny ? "active" : ""}`}>
                      <div className="tom-product-info">
                        <div className="tom-product-top">
                          <span className="tom-product-name">{product.name}</span>
                          <span className="tom-product-price">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        {product.description && (
                          <span className="tom-product-desc">{product.description}</span>
                        )}
                      </div>
                      <div className="tom-qty-controls">
                        {q.desired > 0 && (
                          <button className="tom-qty-btn minus" onClick={() => decrement(product.id)}>
                            {q.desired === 1 ? <FiTrash2 size={14} /> : <FiMinus size={14} />}
                          </button>
                        )}
                        <span
                          className="tom-qty-value"
                          style={{
                            color: q.desired > q.original ? "#8b5cf6"
                              : q.desired < q.original ? "#ef4444" : undefined,
                          }}
                        >
                          {q.desired}
                        </span>
                        <button className="tom-qty-btn plus" onClick={() => increment(product.id)}>
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
          {products.length === 0 && (
            <div className="tom-empty">Cardápio vazio</div>
          )}
        </div>

        {/* Footer com alterações */}
        {hasChanges && (
          <div className="tom-footer">
            <button className="tom-notes-toggle" onClick={() => setShowNotes(!showNotes)}>
              <FiMessageSquare size={14} />
              {notes ? `Obs: ${notes}` : "Adicionar observação"}
            </button>
            {showNotes && (
              <textarea
                className="tom-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem cebola..."
                autoFocus
                rows={2}
              />
            )}
            <div className="tom-footer-row">
              <div className="tom-footer-info">
                <span className="tom-footer-changes">
                  {addedCount > 0 && <span className="added">+{addedCount}</span>}
                  {addedCount > 0 && cancelledCount > 0 && " | "}
                  {cancelledCount > 0 && <span className="cancelled">-{cancelledCount}</span>}
                </span>
                <strong>R$ {grandTotal.toFixed(2).replace(".", ",")}</strong>
              </div>
              <button className="tom-send-btn" onClick={handleSend} disabled={sending}>
                {sending ? "Enviando..." : existingOrder ? "Enviar Atualização" : "Enviar Pedido"}
              </button>
            </div>
          </div>
        )}

        {/* Modal de fechar comanda/mesa específica */}
        {closingTarget && (
          <div className="tom-payment-overlay" onClick={() => setClosingTarget(null)}>
            <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Fechar {closingTarget.label}</h3>
              <p>Subtotal: <strong>R$ {closingTarget.subtotal.toFixed(2).replace(".", ",")}</strong></p>
              <span className="tom-section-label">Forma de pagamento:</span>
              <div className="tom-payment-options">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className="tom-payment-btn"
                    onClick={() => handleConfirmClosePartial(opt.key)}
                    disabled={closingBill}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button className="tom-payment-cancel" onClick={() => setClosingTarget(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Modal de mover item entre comandas */}
        {moveItem && (
          <div className="tom-payment-overlay" onClick={() => setMoveItem(null)}>
            <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Mover item</h3>
              <p><strong>{moveItem.productName}</strong> ({moveItem.quantity}x)</p>
              <span className="tom-section-label">Enviar para:</span>
              <div className="tom-payment-options">
                <button
                  className="tom-payment-btn"
                  disabled={moveItem.commandId === null}
                  onClick={() => handleMoveItemTo(null)}
                >
                  Mesa {moveItem.commandId === null && "(atual)"}
                </button>
                {commands.map((cmd) => (
                  <button
                    key={cmd.id}
                    className="tom-payment-btn"
                    disabled={moveItem.commandId === cmd.id}
                    onClick={() => handleMoveItemTo(cmd.id)}
                  >
                    {commandLabel(cmd)} {moveItem.commandId === cmd.id && "(atual)"}
                  </button>
                ))}
              </div>
              <button className="tom-payment-cancel" onClick={() => setMoveItem(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Modal de rename de comanda */}
        {showRenameModal && (
          <div className="tom-payment-overlay" onClick={() => setShowRenameModal(null)}>
            <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Nome da {commandLabel(showRenameModal)}</h3>
              <p>Deixe em branco para usar "Comanda #{showRenameModal.displayNumber}"</p>
              <input
                className="tom-notes-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Ex: Ana, Maria, João, Paulo..."
                autoFocus
                maxLength={50}
                onKeyDown={(e) => { if (e.key === "Enter") handleRenameCommand(); }}
              />
              <div className="tom-payment-options">
                <button className="tom-payment-btn" onClick={handleRenameCommand}>Salvar</button>
              </div>
              <button className="tom-payment-cancel" onClick={() => setShowRenameModal(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Modal de breakdown da conta por comanda */}
        {showBreakdown && breakdown && (
          <div className="tom-payment-overlay" onClick={() => setShowBreakdown(false)}>
            <div className="tom-payment-modal tom-breakdown-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Conta Mesa #{table.number}</h3>
              <div className="tom-breakdown-list">
                {breakdown.mesa.items.length > 0 && (
                  <div className={`tom-breakdown-row ${breakdown.mesa.status === "PAID" ? "paid" : ""}`}>
                    <div className="tom-breakdown-name">
                      Mesa {breakdown.mesa.status === "PAID" && <span className="tom-breakdown-badge">PAGO</span>}
                    </div>
                    <div className="tom-breakdown-total">
                      <strong>R$ {breakdown.mesa.subtotal.toFixed(2).replace(".", ",")}</strong>
                    </div>
                  </div>
                )}
                {breakdown.commands.map((cb) => (
                  <div key={cb.id} className={`tom-breakdown-row ${cb.status === "PAID" ? "paid" : ""}`}>
                    <div className="tom-breakdown-name">
                      {cb.name || `Comanda #${cb.displayNumber}`}
                      {cb.status === "PAID" && <span className="tom-breakdown-badge">PAGO</span>}
                    </div>
                    <div className="tom-breakdown-total">
                      <strong>R$ {cb.subtotal.toFixed(2).replace(".", ",")}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tom-breakdown-grand">
                Total: <strong>R$ {breakdown.grandTotal.toFixed(2).replace(".", ",")}</strong>
              </div>
              <div className="tom-payment-options">
                <button className="tom-payment-btn" onClick={() => { setShowBreakdown(false); setShowPaymentModal(true); }}>
                  Fechar Mesa
                </button>
              </div>
              <button className="tom-payment-cancel" onClick={() => setShowBreakdown(false)}>Voltar</button>
            </div>
          </div>
        )}

        {/* Modal de pagamento */}
        {showPaymentModal && (
          <div className="tom-payment-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="tom-payment-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Fechar Conta</h3>
              <p>Mesa #{table.number} — R$ {existingTotal.toFixed(2).replace(".", ",")}</p>
              <span className="tom-section-label">Forma de pagamento:</span>
              <div className="tom-payment-options">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button key={opt.key} className="tom-payment-btn" onClick={() => handleCloseBill(opt.key)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <button className="tom-payment-cancel" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
