import { useState, useEffect } from "react";
import { FiMinus, FiPlus, FiTrash2, FiMessageSquare } from "react-icons/fi";
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
}

interface OrderInfo {
  id: number;
  status: string;
  total: number;
  notes: string | null;
  items: OrderItem[];
}

interface ProductQty {
  original: number;
  desired: number;
  itemIds: number[];
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [existingOrder, setExistingOrder] = useState<OrderInfo | null>(null);
  const [tableStatus, setTableStatus] = useState(table.status);
  const [qtys, setQtys] = useState<Record<number, ProductQty>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

      // Inicializar quantidades do pedido existente
      const initial: Record<number, ProductQty> = {};
      if (order) {
        for (const item of order.items) {
          const pid = item.productId || 0;
          if (!initial[pid]) {
            initial[pid] = { original: 0, desired: 0, itemIds: [] };
          }
          initial[pid].original += item.quantity;
          initial[pid].desired += item.quantity;
          initial[pid].itemIds.push(item.id);
        }
      }
      setQtys(initial);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getQty = (productId: number): ProductQty =>
    qtys[productId] || { original: 0, desired: 0, itemIds: [] };

  const increment = (productId: number) => {
    setQtys((prev) => {
      const q = prev[productId] || { original: 0, desired: 0, itemIds: [] };
      return { ...prev, [productId]: { ...q, desired: q.desired + 1 } };
    });
  };

  const decrement = (productId: number) => {
    setQtys((prev) => {
      const q = prev[productId];
      if (!q || q.desired <= 0) return prev;
      return { ...prev, [productId]: { ...q, desired: q.desired - 1 } };
    });
  };

  const additions = Object.entries(qtys).filter(([_, q]) => q.desired > q.original);
  const cancellations = Object.entries(qtys).filter(([_, q]) => q.desired < q.original);
  const addedCount = additions.reduce((sum, [_, q]) => sum + (q.desired - q.original), 0);
  const cancelledCount = cancellations.reduce((sum, [_, q]) => sum + (q.original - q.desired), 0);
  const hasChanges = addedCount > 0 || cancelledCount > 0;

  const existingTotal = existingOrder?.total ?? 0;
  const grandTotal = Object.entries(qtys).reduce((sum, [pid, q]) => {
    const product = products.find((p) => p.id === Number(pid));
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
      if (addedCount > 0) {
        const items = additions.map(([pid, q]) => ({
          productId: Number(pid),
          quantity: q.desired - q.original,
        }));

        if (existingOrder) {
          await api.post(`/api/orders/${existingOrder.id}/add-items`, { items });
        } else {
          await api.post("/api/orders/table", {
            clientId,
            tableId: table.id,
            items,
            notes: notes || undefined,
          });
        }
      }

      // Imprimir recibo (mesmo layout do mobile)
      const newItems = additions.map(([pid, q]) => {
        const product = products.find((p) => p.id === Number(pid));
        return {
          productName: product?.name || `Produto #${pid}`,
          quantity: q.desired - q.original,
          unitPrice: product?.price || 0,
        };
      });
      const cancelledItems = cancellations.map(([pid, q]) => {
        const product = products.find((p) => p.id === Number(pid));
        return {
          productName: product?.name || `Produto #${pid}`,
          quantity: q.original - q.desired,
        };
      });

      printRoundReceipt({
        orderId: existingOrder?.id ?? null,
        tableNumber: table.number,
        establishmentName: document.title || "Estabelecimento",
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

  const handleCloseBill = async (paymentMethod: string) => {
    if (!existingOrder) return;
    setClosingBill(true);
    setShowPaymentModal(false);
    try {
      await api.patch(`/api/orders/${existingOrder.id}/close-table`, { paymentMethod });
      fetchData();
      onUpdated();
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
              <span className="tom-order-status-badge" style={{ background: ORDER_STATUS_COLORS[existingOrder.status] || "#94a3b8" }}>
                Pedido #{existingOrder.id} · {ORDER_STATUS_LABELS[existingOrder.status] || existingOrder.status}
              </span>
            )}
          </div>
          <div className="tom-header-right">
            {existingOrder && existingOrder.status === "AWAITING_PAYMENT" ? (
              <button className="tom-action-btn confirm" onClick={handleConfirmPayment} disabled={closingBill}>
                {closingBill ? "Confirmando..." : "Confirmar Pgto"}
              </button>
            ) : existingOrder ? (
              <button className="tom-action-btn close-bill" onClick={() => setShowPaymentModal(true)} disabled={closingBill}>
                {closingBill ? "Fechando..." : "Fechar Conta"}
              </button>
            ) : null}
            <button className="tom-close-btn" onClick={onClose} title="Fechar">
              ×
            </button>
          </div>
        </div>

        {/* Resumo do pedido existente */}
        {existingOrder && existingOrder.items.length > 0 && (
          <div className="tom-order-summary">
            <table>
              <thead>
                <tr>
                  <th className="col-qty">QTD</th>
                  <th className="col-name">ITEM</th>
                  <th className="col-price">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {existingOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="col-qty">{item.quantity}x</td>
                    <td className="col-name">{item.productName}</td>
                    <td className="col-price">R$ {(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="col-qty"></td>
                  <td className="col-name">Total</td>
                  <td className="col-price"><strong>R$ {existingTotal.toFixed(2).replace(".", ",")}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

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
