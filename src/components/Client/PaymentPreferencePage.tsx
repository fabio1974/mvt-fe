import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import {
  FiHome,
  FiChevronRight,
  FiSettings,
  FiRefreshCw,
  FiCheck,
} from "react-icons/fi";
import "./PaymentPreferencePage.css";

type PaymentMethod = "PIX" | "CREDIT_CARD";

interface Preference {
  preferredPaymentMethod?: PaymentMethod;
  defaultCardId?: number | null;
}

interface CustomerCard {
  id: number;
  lastFourDigits?: string;
  last4?: string;
  brand?: string;
  holderName?: string;
  isDefault?: boolean;
}

const PaymentPreferencePage: React.FC = () => {
  const [preference, setPreference] = useState<Preference>({});
  const [cards, setCards] = useState<CustomerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("PIX");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prefRes, cardsRes] = await Promise.all([
        api.get<Preference>("/api/customers/me/payment-preference"),
        api.get<CustomerCard[]>("/api/customer-cards").catch(() => ({ data: [] as CustomerCard[] })),
      ]);
      const pref = prefRes.data;
      setPreference(pref);
      setSelectedMethod(pref.preferredPaymentMethod ?? "PIX");
      setSelectedCardId(pref.defaultCardId ?? null);
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
    } catch {
      showToast("Erro ao carregar preferências", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/customers/me/payment-preference", {
        preferredPaymentMethod: selectedMethod,
        defaultCardId: selectedMethod === "CREDIT_CARD" ? selectedCardId : null,
      });
      showToast("Preferências salvas com sucesso", "success");
    } catch {
      showToast("Erro ao salvar preferências", "error");
    } finally {
      setSaving(false);
    }
  };

  const last4 = (card: CustomerCard) =>
    card.lastFourDigits ?? card.last4 ?? "****";

  const isDirty =
    selectedMethod !== (preference.preferredPaymentMethod ?? "PIX") ||
    selectedCardId !== (preference.defaultCardId ?? null);

  return (
    <div className="pref-page">
      {/* Breadcrumb */}
      <div className="pref-breadcrumb">
        <FiHome size={14} />
        <span>Home</span>
        <FiChevronRight size={14} />
        <span className="pref-breadcrumb-current">Preferências de Pagamento</span>
      </div>

      <div className="pref-header">
        <h1 className="pref-title">
          <FiSettings size={22} />
          Preferências de Pagamento
        </h1>
        <button className="pref-refresh-btn" onClick={load} disabled={loading}>
          <FiRefreshCw size={16} className={loading ? "spinning" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="pref-loading">
          <div className="pref-spinner" />
          <span>Carregando...</span>
        </div>
      ) : (
        <>
          <div className="pref-section">
            <p className="pref-section-title">Método de Pagamento Padrão</p>
            <p className="pref-section-desc">
              Escolha como você prefere pagar pelas suas entregas
            </p>

            <div className="pref-methods">
              {/* PIX */}
              <button
                className={`pref-method ${selectedMethod === "PIX" ? "selected" : ""}`}
                onClick={() => setSelectedMethod("PIX")}
              >
                <div className="pref-method-icon pix">PIX</div>
                <div className="pref-method-info">
                  <span className="pref-method-name">PIX</span>
                  <span className="pref-method-desc">
                    Pagamento instantâneo, sem taxas adicionais
                  </span>
                </div>
                {selectedMethod === "PIX" && (
                  <FiCheck size={20} className="pref-method-check" />
                )}
              </button>

              {/* Cartão de Crédito */}
              <button
                className={`pref-method ${selectedMethod === "CREDIT_CARD" ? "selected" : ""}`}
                onClick={() => setSelectedMethod("CREDIT_CARD")}
              >
                <div className="pref-method-icon card">💳</div>
                <div className="pref-method-info">
                  <span className="pref-method-name">Cartão de Crédito</span>
                  <span className="pref-method-desc">
                    Pague com seu cartão cadastrado
                  </span>
                </div>
                {selectedMethod === "CREDIT_CARD" && (
                  <FiCheck size={20} className="pref-method-check" />
                )}
              </button>
            </div>
          </div>

          {/* Card selector (only when CREDIT_CARD selected) */}
          {selectedMethod === "CREDIT_CARD" && (
            <div className="pref-section">
              <p className="pref-section-title">Cartão Padrão</p>
              {cards.length === 0 ? (
                <div className="pref-no-cards">
                  <p>Nenhum cartão cadastrado.</p>
                  <span>
                    Cadastre um cartão pelo aplicativo móvel para usar esta opção.
                  </span>
                </div>
              ) : (
                <div className="pref-cards">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      className={`pref-card-item ${selectedCardId === card.id ? "selected" : ""}`}
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <span className="pref-card-brand">
                        {card.brand?.toUpperCase() ?? "CARD"}
                      </span>
                      <span className="pref-card-number">
                        •••• {last4(card)}
                      </span>
                      {card.holderName && (
                        <span className="pref-card-holder">{card.holderName}</span>
                      )}
                      {selectedCardId === card.id && (
                        <FiCheck size={16} className="pref-card-check" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pref-footer">
            <button
              className="pref-save-btn"
              onClick={save}
              disabled={saving || !isDirty}
            >
              {saving ? "Salvando..." : "Salvar Preferências"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentPreferencePage;
