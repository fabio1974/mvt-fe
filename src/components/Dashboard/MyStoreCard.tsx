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
}

const MyStoreCard: React.FC = () => {
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

  const openNow = store.isOpenNow ?? store.isOpen;

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

      <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={`Logo ${store.name}`}
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              objectFit: "cover",
              background: "var(--surface-inset)",
              border: "1px solid var(--card-border)",
            }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#f59e0b",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {store.name.charAt(0)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "1.05rem",
              color: "var(--text-strong)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {store.name}
          </div>
          {store.todayHours && (
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
              {store.todayHours}
            </div>
          )}
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: "0.8rem",
            fontWeight: 600,
            background: openNow ? "#dcfce7" : "#e5e7eb",
            color: openNow ? "#15803d" : "#4b5563",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: openNow ? "#16a34a" : "#9ca3af",
            }}
          />
          {openNow ? "Aberto" : "Fechado"}
        </span>
      </div>

      {store.hasMenu === false && (
        <div
          style={{
            padding: "10px 16px",
            background: "#fef3c7",
            color: "#92400e",
            fontSize: "0.85rem",
            borderTop: "1px solid var(--card-border)",
          }}
        >
          ⚠️ Cardápio em preparação — adicione produtos pra aparecer pros clientes.
        </div>
      )}
    </div>
  );
};

export default MyStoreCard;
