import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import "./FoodOrderEditPanel.css";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  product: { id: number; name: string } | null;
}

interface FoodOrder {
  id: number;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  customerName: string | null;
  customerEmail: string | null;
  estimatedPreparationMinutes: number | null;
  createdAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItem[];
}

interface FoodOrderEditPanelProps {
  orderId: number;
  viewMode: string;
  onBack: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PLACED: { label: "Novo Pedido", color: "#f59e0b", icon: "🔔" },
  ACCEPTED: { label: "Aceito", color: "#3b82f6", icon: "✅" },
  PREPARING: { label: "Em Preparo", color: "#8b5cf6", icon: "👨‍🍳" },
  READY: { label: "Pronto", color: "#06b6d4", icon: "📦" },
  DELIVERING: { label: "Entregando", color: "#10b981", icon: "🏍️" },
  COMPLETED: { label: "Entregue", color: "#10b981", icon: "✅" },
  CANCELLED: { label: "Cancelado", color: "#ef4444", icon: "❌" },
};

const FoodOrderEditPanel: React.FC<FoodOrderEditPanelProps> = ({ orderId, viewMode, onBack }) => {
  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleAction = async (action: string, label: string) => {
    setUpdating(true);
    try {
      if (action === "cancel") {
        await api.patch(`/api/orders/${orderId}/cancel`, { reason: "Cancelado pelo restaurante" });
      } else {
        await api.patch(`/api/orders/${orderId}/${action}`);
      }
      await fetchOrder();
    } catch (error: any) {
      alert(error?.response?.data?.message || `Erro ao ${label.toLowerCase()}`);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="food-order-loading"><div className="loading-spinner" /><p>Carregando pedido...</p></div>;
  }

  if (!order) {
    return <div className="food-order-loading"><p>Pedido não encontrado</p></div>;
  }

  const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: "#6b7280", icon: "📋" };
  const isTerminal = order.status === "COMPLETED" || order.status === "CANCELLED";

  return (
    <div className="food-order-edit">
      {/* Header */}
      <div className="food-order-edit-header">
        <button className="food-order-back-btn" onClick={onBack}>
          <FiArrowLeft size={20} /> Voltar
        </button>
        <h2>Pedido #{order.id}</h2>
        <div className="food-order-status-badge" style={{ backgroundColor: statusConfig.color }}>
          {statusConfig.icon} {statusConfig.label}
        </div>
      </div>

      <div className="food-order-edit-body">
        {/* Info do pedido */}
        <div className="food-order-section">
          <h3>📋 Informações</h3>
          <div className="food-order-info-grid">
            <div className="food-order-info-item">
              <span className="label">Cliente</span>
              <span className="value">{order.customerName || "—"}</span>
            </div>
            <div className="food-order-info-item">
              <span className="label">Email</span>
              <span className="value">{order.customerEmail || "—"}</span>
            </div>
            <div className="food-order-info-item">
              <span className="label">Endereço de entrega</span>
              <span className="value">{order.deliveryAddress || "—"}</span>
            </div>
            <div className="food-order-info-item">
              <span className="label">Criado em</span>
              <span className="value">{formatDate(order.createdAt)}</span>
            </div>
            {order.notes && (
              <div className="food-order-info-item full-width">
                <span className="label">Observações</span>
                <span className="value notes">{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="food-order-section">
          <h3>🍽️ Itens do Pedido</h3>
          <table className="food-order-items-table">
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Item</th>
                <th>Preço Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.quantity}x</td>
                  <td>
                    {item.product?.name || "Item"}
                    {item.notes && <span className="item-notes">({item.notes})</span>}
                  </td>
                  <td>R$ {item.unitPrice.toFixed(2).replace(".", ",")}</td>
                  <td>R$ {(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="food-order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>R$ {order.subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="total-row">
              <span>Taxa de entrega</span>
              <span>R$ {(order.deliveryFee || 0).toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="total-row total-final">
              <span>Total</span>
              <span>R$ {order.total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="food-order-section">
          <h3>⏱️ Timeline</h3>
          <div className="food-order-timeline">
            <div className={`timeline-step ${order.createdAt ? "done" : ""}`}>
              <span className="timeline-dot" />
              <span className="timeline-label">Pedido criado</span>
              <span className="timeline-date">{formatDate(order.createdAt)}</span>
            </div>
            <div className={`timeline-step ${order.acceptedAt ? "done" : ""}`}>
              <span className="timeline-dot" />
              <span className="timeline-label">Aceito</span>
              <span className="timeline-date">{formatDate(order.acceptedAt)}</span>
            </div>
            <div className={`timeline-step ${order.preparingAt ? "done" : ""}`}>
              <span className="timeline-dot" />
              <span className="timeline-label">Em preparo</span>
              <span className="timeline-date">{formatDate(order.preparingAt)}</span>
            </div>
            <div className={`timeline-step ${order.readyAt ? "done" : ""}`}>
              <span className="timeline-dot" />
              <span className="timeline-label">Pronto</span>
              <span className="timeline-date">{formatDate(order.readyAt)}</span>
            </div>
            <div className={`timeline-step ${order.completedAt ? "done" : ""}`}>
              <span className="timeline-dot" />
              <span className="timeline-label">Entregue</span>
              <span className="timeline-date">{formatDate(order.completedAt)}</span>
            </div>
            {order.cancelledAt && (
              <div className="timeline-step done cancelled">
                <span className="timeline-dot" />
                <span className="timeline-label">Cancelado: {order.cancellationReason || "—"}</span>
                <span className="timeline-date">{formatDate(order.cancelledAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        {!isTerminal && viewMode === "edit" && (
          <div className="food-order-section">
            <h3>🎯 Ações</h3>
            <div className="food-order-actions">
              {order.status === "PLACED" && (
                <button
                  className="food-order-action-btn accept"
                  onClick={() => handleAction("accept", "Aceitar")}
                  disabled={updating}
                >
                  <FiCheck size={24} />
                  <span className="action-label">✅ Aceitar Pedido</span>
                  <span className="action-desc">Confirme que o restaurante recebeu o pedido</span>
                </button>
              )}
              {order.status === "ACCEPTED" && (
                <button
                  className="food-order-action-btn preparing"
                  onClick={() => handleAction("preparing", "Iniciar Preparo")}
                  disabled={updating}
                >
                  <FiCheck size={24} />
                  <span className="action-label">👨‍🍳 Iniciar Preparo</span>
                  <span className="action-desc">O pedido está sendo preparado na cozinha</span>
                </button>
              )}
              {(order.status === "ACCEPTED" || order.status === "PREPARING") && (
                <button
                  className="food-order-action-btn ready"
                  onClick={() => handleAction("ready", "Marcar Pronto")}
                  disabled={updating}
                >
                  <FiCheck size={24} />
                  <span className="action-label">📦 Pronto para Entrega</span>
                  <span className="action-desc">O pedido está pronto — um motoboy será notificado</span>
                </button>
              )}
              {order.status !== "DELIVERING" && (
                <button
                  className="food-order-action-btn cancel"
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja cancelar este pedido?")) {
                      handleAction("cancel", "Cancelar");
                    }
                  }}
                  disabled={updating}
                >
                  <FiX size={24} />
                  <span className="action-label">❌ Cancelar Pedido</span>
                  <span className="action-desc">O cliente será notificado do cancelamento</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodOrderEditPanel;
