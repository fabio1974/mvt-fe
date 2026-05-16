import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewOrderAlert } from "../../hooks/useNewOrderAlert";
import { showToast } from "../../utils/toast";
import "./NewOrderAlertModal.css";

const formatCurrency = (value: number): string =>
  `R$ ${(value ?? 0).toFixed(2).replace(".", ",")}`;

/**
 * Modal bloqueante que aparece para o CLIENT quando há pedido novo (status=PLACED).
 * Exibe o primeiro PLACED não-acked da fila. Botões:
 *  - "Aceitar": chama PATCH /orders/{id}/accept → move pra ACCEPTED no BE.
 *  - "Ver depois": ack local (não reabre modal nesta sessão). Pedido continua PLACED no BE
 *    e o badge no sidebar segue visível até o user aceitar ou cancelar de fato.
 */
const NewOrderAlertModal: React.FC = () => {
  const navigate = useNavigate();
  const { pendingModal, acknowledge, accept } = useNewOrderAlert();
  const [accepting, setAccepting] = useState(false);

  // Reset do loading quando o modal passa a exibir OUTRO pedido. O componente
  // não desmonta entre pedidos da fila — se ficar com `accepting=true` do
  // pedido anterior, o botão Aceitar do próximo nasce travado.
  useEffect(() => {
    setAccepting(false);
  }, [pendingModal?.id]);

  if (!pendingModal) return null;

  const order = pendingModal;
  const isTable = order.orderType === "TABLE";
  const locationLabel = isTable
    ? order.tableNumber != null
      ? `Mesa #${order.tableNumber}`
      : "Mesa (sem número)"
    : order.deliveryAddress ?? "Endereço não informado";

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      await accept(order.id);
      showToast(`Pedido #${order.id} aceito`, "success");
      navigate(`/pedidos?orderId=${order.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Falha ao aceitar pedido";
      showToast(msg, "error");
      setAccepting(false);
    }
  };

  const handleDefer = () => {
    acknowledge(order.id);
  };

  return (
    <div className="new-order-alert-overlay" role="dialog" aria-modal="true">
      <div className="new-order-alert-modal">
        <div className="new-order-alert-header">
          <span className="new-order-alert-icon">🔔</span>
          <span className="new-order-alert-title">Pedido novo!</span>
        </div>

        <div className="new-order-alert-body">
          <div className="new-order-alert-row">
            <span className="new-order-alert-label">Número</span>
            <span className="new-order-alert-value">#{order.id}</span>
          </div>
          <div className="new-order-alert-row">
            <span className="new-order-alert-label">Cliente</span>
            <span className="new-order-alert-value">{order.customerName ?? "—"}</span>
          </div>
          {order.customerPhone && (
            <div className="new-order-alert-row">
              <span className="new-order-alert-label">Telefone</span>
              <span className="new-order-alert-value">{order.customerPhone}</span>
            </div>
          )}
          <div className="new-order-alert-row">
            <span className="new-order-alert-label">{isTable ? "Mesa" : "Entrega"}</span>
            <span className="new-order-alert-value">{locationLabel}</span>
          </div>
          {order.items.length > 0 && (
            <div className="new-order-alert-items">
              <span className="new-order-alert-label">Itens</span>
              <ul>
                {order.items.map((it, i) => (
                  <li key={i}>
                    <span className="new-order-alert-item-qty">{it.quantity}×</span>
                    <span className="new-order-alert-item-name">
                      {it.productName ?? "Produto"}
                      {it.observation && (
                        <span className="new-order-alert-item-obs"> · {it.observation}</span>
                      )}
                    </span>
                    <span className="new-order-alert-item-price">
                      {formatCurrency(it.unitPrice * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="new-order-alert-row">
            <span className="new-order-alert-label">Total</span>
            <span className="new-order-alert-value new-order-alert-total">
              {formatCurrency(order.total)}
            </span>
          </div>
          {order.notes && (
            <div className="new-order-alert-notes">
              <span className="new-order-alert-label">Observações</span>
              <p>{order.notes}</p>
            </div>
          )}
        </div>

        <div className="new-order-alert-actions">
          <button
            type="button"
            className="new-order-alert-btn new-order-alert-btn-defer"
            onClick={handleDefer}
            disabled={accepting}
          >
            Ver depois
          </button>
          <button
            type="button"
            className="new-order-alert-btn new-order-alert-btn-accept"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? "Aceitando..." : "Aceitar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderAlertModal;
