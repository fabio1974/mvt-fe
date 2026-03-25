import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { FiHome, FiChevronRight, FiCreditCard, FiRefreshCw, FiClock, FiCheckCircle } from "react-icons/fi";
import "./CourierWalletPage.css";

interface PagarmeBalance {
  recipientId?: string;
  available: number;
  waitingFunds: number;
  transferred: number;
  currency?: string;
  updatedAt?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CourierWalletPage: React.FC = () => {
  const [balance, setBalance] = useState<PagarmeBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.get<any>("/api/payments/my-balance");
      const data = response.data;
      // Backend may return different shapes — normalise
      setBalance({
        recipientId: data.recipientId,
        available: data.availableBrl ?? data.available ?? 0,
        waitingFunds: data.waitingFundsBrl ?? data.waitingFunds ?? 0,
        transferred: data.transferredBrl ?? data.transferred ?? 0,
        currency: data.currency,
        updatedAt: data.updatedAt,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível carregar o saldo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  return (
    <div className="wallet-page">
      {/* Breadcrumb */}
      <div className="wallet-breadcrumb">
        <FiHome size={14} />
        <span>Home</span>
        <FiChevronRight size={14} />
        <span className="wallet-breadcrumb-current">Minha Carteira</span>
      </div>

      <div className="wallet-header">
        <h1 className="wallet-title">
          <FiCreditCard size={22} />
          Minha Carteira
        </h1>
        <button className="wallet-refresh-btn" onClick={loadBalance} disabled={loading}>
          <FiRefreshCw size={16} className={loading ? "spinning" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="wallet-loading">
          <div className="wallet-spinner" />
          <span>Carregando saldo...</span>
        </div>
      ) : error ? (
        <div className="wallet-error">
          <p>{error}</p>
          <button className="wallet-retry-btn" onClick={loadBalance}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Total available card */}
          <div className="wallet-total-card">
            <span className="wallet-total-label">SALDO DISPONÍVEL</span>
            <span className="wallet-total-amount">{fmt(balance?.available ?? 0)}</span>
            {(balance?.waitingFunds ?? 0) > 0 && (
              <span className="wallet-total-sub">
                + {fmt(balance!.waitingFunds)} aguardando liberação
              </span>
            )}
          </div>

          {/* Detail card */}
          <div className="wallet-detail-card">
            <div className="wallet-detail-header">
              <div className="wallet-detail-icon">
                <FiCreditCard size={20} color="#6366f1" />
              </div>
              <div>
                <p className="wallet-detail-title">Saldo Pagar.me</p>
                {balance?.recipientId && (
                  <p className="wallet-detail-subtitle">ID: {balance.recipientId}</p>
                )}
              </div>
            </div>

            <div className="wallet-available-box">
              <span className="wallet-available-label">DISPONÍVEL PARA SAQUE</span>
              <span className="wallet-available-amount">{fmt(balance?.available ?? 0)}</span>
            </div>

            <div className="wallet-divider" />

            <div className="wallet-row">
              <div className="wallet-row-left">
                <FiClock size={16} color="#f59e0b" />
                <span className="wallet-row-label">Aguardando liberação</span>
              </div>
              <span className="wallet-row-value pending">{fmt(balance?.waitingFunds ?? 0)}</span>
            </div>

            <div className="wallet-divider" />

            <div className="wallet-row">
              <div className="wallet-row-left">
                <FiCheckCircle size={16} color="#6b7280" />
                <span className="wallet-row-label">Total transferido</span>
              </div>
              <span className="wallet-row-value">{fmt(balance?.transferred ?? 0)}</span>
            </div>

            {balance?.updatedAt && (
              <>
                <div className="wallet-divider" />
                <p className="wallet-updated-at">
                  Atualizado em{" "}
                  {new Date(balance.updatedAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CourierWalletPage;
