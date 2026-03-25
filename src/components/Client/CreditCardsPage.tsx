import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import {
  FiHome,
  FiChevronRight,
  FiCreditCard,
  FiRefreshCw,
  FiTrash2,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";
import "./CreditCardsPage.css";

interface CustomerCard {
  id: number;
  lastFourDigits?: string;
  last4?: string;
  brand?: string;
  holderName?: string;
  expirationMonth?: number;
  expirationYear?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

const brandColor: Record<string, string> = {
  visa: "#1a1f71",
  mastercard: "#eb001b",
  amex: "#007bc1",
  elo: "#f0c000",
  hipercard: "#c01818",
  default: "#6b7280",
};

const CreditCardsPage: React.FC = () => {
  const [cards, setCards] = useState<CustomerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<CustomerCard[]>("/api/customer-cards");
      setCards(Array.isArray(response.data) ? response.data : []);
    } catch {
      showToast("Erro ao carregar cartões", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const setDefault = async (cardId: number) => {
    setActionLoading(cardId);
    try {
      await api.put(`/api/customer-cards/${cardId}/set-default`);
      showToast("Cartão padrão atualizado", "success");
      await loadCards();
    } catch {
      showToast("Erro ao definir cartão padrão", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCard = async (cardId: number) => {
    if (!window.confirm("Deseja remover este cartão?")) return;
    setActionLoading(cardId);
    try {
      await api.delete(`/api/customer-cards/${cardId}`);
      showToast("Cartão removido", "success");
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch {
      showToast("Erro ao remover cartão", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const last4 = (card: CustomerCard) =>
    card.lastFourDigits ?? card.last4 ?? "****";

  const getBrand = (card: CustomerCard) =>
    card.brand?.toLowerCase() ?? "default";

  const getColor = (card: CustomerCard) =>
    brandColor[getBrand(card)] ?? brandColor.default;

  const formatExpiry = (card: CustomerCard) => {
    if (!card.expirationMonth || !card.expirationYear) return "";
    return `${String(card.expirationMonth).padStart(2, "0")}/${card.expirationYear}`;
  };

  return (
    <div className="cards-page">
      {/* Breadcrumb */}
      <div className="cards-breadcrumb">
        <FiHome size={14} />
        <span>Home</span>
        <FiChevronRight size={14} />
        <span className="cards-breadcrumb-current">Meus Cartões</span>
      </div>

      <div className="cards-header">
        <h1 className="cards-title">
          <FiCreditCard size={22} />
          Meus Cartões
        </h1>
        <button
          className="cards-refresh-btn"
          onClick={loadCards}
          disabled={loading}
        >
          <FiRefreshCw size={16} className={loading ? "spinning" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="cards-loading">
          <div className="cards-spinner" />
          <span>Carregando cartões...</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="cards-empty">
          <FiCreditCard size={48} color="#9ca3af" />
          <p>Nenhum cartão cadastrado</p>
          <span>
            Para cadastrar um cartão, utilize o aplicativo móvel ou entre em
            contato com o suporte.
          </span>
        </div>
      ) : (
        <div className="cards-list">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`cards-card ${card.isDefault ? "default" : ""}`}
            >
              {/* Card visual */}
              <div
                className="cards-visual"
                style={{ background: getColor(card) }}
              >
                <div className="cards-chip" />
                <div className="cards-number">
                  •••• •••• •••• {last4(card)}
                </div>
                <div className="cards-bottom-row">
                  <div>
                    {card.holderName && (
                      <div className="cards-holder">{card.holderName}</div>
                    )}
                    {formatExpiry(card) && (
                      <div className="cards-expiry">{formatExpiry(card)}</div>
                    )}
                  </div>
                  {card.brand && (
                    <div className="cards-brand-name">
                      {card.brand.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Card actions */}
              <div className="cards-actions">
                {card.isDefault ? (
                  <span className="cards-default-badge">
                    <FiCheckCircle size={14} />
                    Cartão Padrão
                  </span>
                ) : (
                  <button
                    className="cards-action-btn set-default"
                    onClick={() => setDefault(card.id)}
                    disabled={actionLoading === card.id}
                  >
                    <FiStar size={14} />
                    Definir como padrão
                  </button>
                )}

                <button
                  className="cards-action-btn delete"
                  onClick={() => deleteCard(card.id)}
                  disabled={actionLoading === card.id}
                >
                  <FiTrash2 size={14} />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreditCardsPage;
