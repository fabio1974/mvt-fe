import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiShoppingBag } from "react-icons/fi";
import { api } from "../../services/api";
import { getUserId } from "../../utils/auth";

/**
 * Preview do próprio restaurante (espelho exato do card que o CUSTOMER vê na
 * listagem mobile de Zapi-Food). Renderizado no Dashboard quando role=CLIENT
 * pra o lojista saber como aparece pros clientes.
 *
 * Endpoint reutilizado: GET /api/stores/{userId} — mesmo payload que o
 * mobile consome via foodService.getStores() pra cada item da lista.
 */
interface StoreInfo {
  id: string;
  name: string;
  hasMenu?: boolean;
  isOpen: boolean;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  todayHours?: string | null;
  isOpenNow?: boolean;
  serviceType?: string | null;
  address?: string | null;
  avgPreparationMinutes?: number | null;
  minOrder?: number | null;
  distanceKm?: number | null;
}

// Mesmo mapeamento de tipo do card mobile (StoresScreen.renderStore).
const serviceTypeLabel = (t?: string | null): string =>
  t === "DELIVERY" ? "🍽️ Restaurante" : t === "PASSENGER_TRANSPORT" ? "💊 Farmácia" : "🏪 Loja";

interface MyStoreCardProps {
  /** Quando definido, o badge segue este estado (compartilhado com o switch do
   * breadcrumb) em vez do isOpenNow vindo da própria busca — sincroniza ao vivo. */
  isOpenOverride?: boolean | null;
}

const MyStoreCard: React.FC<MyStoreCardProps> = ({ isOpenOverride }) => {
  const userId = getUserId();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get<StoreInfo>(`/api/stores/${userId}`);
        setStore(res.data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setError(err?.response?.data?.message || "Não foi possível carregar o estabelecimento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: 20,
          color: "var(--text-muted)",
          fontSize: "0.9rem",
        }}
      >
        Carregando seu estabelecimento…
      </div>
    );
  }

  if (error || !store) {
    return (
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "var(--text-muted)",
        }}
      >
        <FiAlertCircle color="#ef4444" />
        <span>{error || "Estabelecimento não encontrado."}</span>
      </div>
    );
  }

  const openNow = isOpenOverride ?? store.isOpenNow ?? store.isOpen;

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--card-shadow-sm)",
      }}
    >
      {store.coverUrl ? (
        <img
          src={store.coverUrl}
          alt={`Capa de ${store.name}`}
          style={{ width: "100%", aspectRatio: "3 / 1", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "3 / 1",
            background: "var(--surface-inset)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          <FiShoppingBag size={36} />
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* Header: logo circular + nome + tipo (igual StoresScreen.storeHeader do mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={`Logo ${store.name}`}
              style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: "var(--surface-inset)", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, flexShrink: 0 }}
            >
              {store.name.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {store.name}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
              {serviceTypeLabel(store.serviceType)}
            </div>
          </div>
        </div>

        {store.description && (
          <p style={{ fontSize: "0.875rem", lineHeight: 1.4, color: "var(--text-secondary, #475569)", margin: "0 0 8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {store.description}
          </p>
        )}

        {/* Footer: tags + status pill (igual storeFooter do mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {store.avgPreparationMinutes != null && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🕐 ~{store.avgPreparationMinutes} min</span>
          )}
          {store.minOrder != null && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mín. R$ {store.minOrder.toFixed(2).replace(".", ",")}</span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 12, fontSize: "0.78rem", fontWeight: 700, background: openNow ? "#dcfce7" : "#e5e7eb", color: openNow ? "#166534" : "#374151" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: openNow ? "#16a34a" : "#9ca3af" }} />
            {openNow ? "Aberto Agora" : "Fechado"}
          </span>
          {store.hasMenu === false && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 12, fontSize: "0.78rem", fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>
              ⏳ Cardápio em preparação
            </span>
          )}
        </div>

        {store.todayHours && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>
            {openNow ? "Aberto" : "Horário"} das {store.todayHours.replace(/-/g, " às ")}
          </p>
        )}
      </div>
    </div>
  );
};

export default MyStoreCard;
