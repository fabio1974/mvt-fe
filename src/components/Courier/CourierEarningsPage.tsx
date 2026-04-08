import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { FiHome, FiChevronRight, FiDollarSign, FiChevronDown, FiChevronUp, FiRefreshCw } from "react-icons/fi";
import "./CourierEarningsPage.css";

interface DeliveryEarning {
  deliveryId: number;
  completedAt: string;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  clientName: string;
  deliveryType: "DELIVERY" | "RIDE";
  paymentId: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: "PIX" | "CREDIT_CARD";
  courierAmount: number;
  courierPercentage: number;
  organizerAmount: number;
  organizerPercentage: number;
  organizerName: string | null;
  platformAmount: number;
  platformPercentage: number;
}

interface EarningsResponse {
  totalDeliveries: number;
  totalEarnings: number;
  deliveries: DeliveryEarning[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const translateMethod = (m: string) => (m === "PIX" ? "PIX" : "Cartão");
const translateType = (t: string) => (t === "RIDE" ? "Corrida" : "Corrida");

const CourierEarningsPage: React.FC = () => {
  const [showRecent, setShowRecent] = useState(true);
  const [recentDays, setRecentDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const loadEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<EarningsResponse>("/api/couriers/me/earnings", {
        params: { recent: showRecent },
      });
      setData(response.data);
    } catch (err) {
      showToast("Erro ao carregar recebimentos", "error");
    } finally {
      setLoading(false);
    }
  }, [showRecent]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get<{ content: any[] }>("/api/site-configuration", {
          params: { isActive: true, size: 1 },
        });
        const config = res.data?.content?.[0];
        if (config?.recentDays) setRecentDays(config.recentDays);
      } catch {
        // silently fail
      }
    };
    fetchConfig();
  }, []);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="earnings-page">
      {/* Breadcrumb */}
      <div className="earnings-breadcrumb">
        <FiHome size={14} />
        <span>Home</span>
        <FiChevronRight size={14} />
        <span className="earnings-breadcrumb-current">Meus Recebimentos</span>
      </div>

      <div className="earnings-header">
        <h1 className="earnings-title">
          <FiDollarSign size={22} />
          Meus Recebimentos
        </h1>
        <button className="earnings-refresh-btn" onClick={loadEarnings} disabled={loading}>
          <FiRefreshCw size={16} className={loading ? "spinning" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="earnings-filter-tabs">
        <button
          className={`earnings-filter-tab${showRecent ? " active" : ""}`}
          onClick={() => setShowRecent(true)}
        >
          Últimos {recentDays} dias
        </button>
        <button
          className={`earnings-filter-tab${!showRecent ? " active" : ""}`}
          onClick={() => setShowRecent(false)}
        >
          Todas
        </button>
      </div>

      {loading ? (
        <div className="earnings-loading">
          <div className="earnings-spinner" />
          <span>Carregando recebimentos...</span>
        </div>
      ) : !data || data.totalDeliveries === 0 ? (
        <div className="earnings-empty">
          <FiDollarSign size={48} color="#9ca3af" />
          <p>Nenhuma corrida encontrada</p>
          <span>
            {showRecent
              ? "Você não tem corridas pagas recentemente"
              : "Suas corridas pagas aparecerão aqui"}
          </span>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="earnings-summary-card">
            <div className="earnings-summary-icon">
              <FiDollarSign size={28} color="white" />
            </div>
            <div className="earnings-summary-content">
              <span className="earnings-summary-label">Seus Ganhos</span>
              <span className="earnings-summary-amount">{fmt(data.totalEarnings)}</span>
              <span className="earnings-summary-sub">
                {data.totalDeliveries}{" "}
                {data.totalDeliveries === 1 ? "corrida completada" : "corridas completadas"}
              </span>
            </div>
          </div>

          {/* Delivery list */}
          <div className="earnings-list">
            {data.deliveries.map((item) => {
              const isExpanded = expandedIds.has(item.deliveryId);
              const hasOrganizer = item.organizerAmount > 0;
              return (
                <div
                  key={item.deliveryId}
                  className="earnings-card"
                  onClick={() => toggleExpanded(item.deliveryId)}
                >
                  <div className="earnings-card-header">
                    <div className="earnings-card-title-row">
                      <div className="earnings-card-title">
                        <span className="earnings-card-type">
                          {translateType(item.deliveryType)} #{item.deliveryId}
                        </span>
                        <span className="earnings-paid-badge">Pago</span>
                        <span className="earnings-card-meta">
                          {translateMethod(item.paymentMethod)} · {fmtDate(item.completedAt)}
                        </span>
                      </div>
                      <div className="earnings-card-right">
                        <span className="earnings-amount-large">{fmt(item.courierAmount)}</span>
                        {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                      </div>
                    </div>

                    <div className="earnings-card-addresses">
                      <div className="earnings-address-row">
                        <span className="earnings-dot from" />
                        <span>{item.fromAddress}</span>
                      </div>
                      <div className="earnings-address-row">
                        <span className="earnings-dot to" />
                        <span>{item.toAddress}</span>
                      </div>
                    </div>

                    <div className="earnings-card-chips">
                      <span className="earnings-chip">{item.clientName}</span>
                      <span className="earnings-chip">{item.distanceKm.toFixed(1)} km</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="earnings-expanded" onClick={(e) => e.stopPropagation()}>
                      <p className="earnings-expanded-title">Detalhamento da Divisão</p>

                      {/* Courier row (you) */}
                      <div className="earnings-split-row you">
                        <div className="earnings-split-left">
                          <span className="earnings-you-badge">VOCÊ</span>
                          <span className="earnings-split-label">Motoboy</span>
                        </div>
                        <div className="earnings-split-right">
                          <span className="earnings-split-amount you">{fmt(item.courierAmount)}</span>
                          <span className="earnings-split-pct">{item.courierPercentage.toFixed(0)}%</span>
                        </div>
                      </div>

                      {hasOrganizer && (
                        <div className="earnings-split-row">
                          <div className="earnings-split-left">
                            <span className="earnings-split-label">Gerente</span>
                            {item.organizerName && (
                              <span className="earnings-split-sub">{item.organizerName}</span>
                            )}
                          </div>
                          <div className="earnings-split-right">
                            <span className="earnings-split-amount">{fmt(item.organizerAmount)}</span>
                            <span className="earnings-split-pct">{item.organizerPercentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}

                      <div className="earnings-split-row">
                        <div className="earnings-split-left">
                          <span className="earnings-split-label">Plataforma</span>
                        </div>
                        <div className="earnings-split-right">
                          <span className="earnings-split-amount">{fmt(item.platformAmount)}</span>
                          <span className="earnings-split-pct">{item.platformPercentage.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="earnings-split-row total">
                        <span className="earnings-split-total-label">Total da Corrida</span>
                        <span className="earnings-split-total-amount">{fmt(item.totalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CourierEarningsPage;
