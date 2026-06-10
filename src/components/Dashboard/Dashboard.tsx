import React, { useEffect, useState } from "react";
import { FiHome, FiChevronDown } from "react-icons/fi";
import { getUserName, getUserRole } from "../../utils/auth";
import { api } from "../../services/api";
import MobileAppBanner from "./MobileAppBanner";
import MyStoreCard from "./MyStoreCard";
import ShareMenuCard from "./ShareMenuCard";
import StoreOpenToggle from "./StoreOpenToggle";
import { useHeaderCollapsed } from "../../hooks/useHeaderCollapsed";
import "../Generic/EntityCRUD.css";

const Dashboard: React.FC = () => {
  const userName = getUserName();
  const userRole = getUserRole();
  const [headerCollapsed, toggleHeader] = useHeaderCollapsed();
  const isClient = userRole === "ROLE_CLIENT" || userRole === "CLIENT";

  // Estado de abertura da loja, compartilhado entre o switch do breadcrumb e o
  // badge do MyStoreCard — assim os dois sincronizam ao vivo, sem refresh.
  const [storeOpen, setStoreOpen] = useState<boolean | null>(null);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    (async () => {
      try {
        const res = await api.get<{ isOpen: boolean }>("/api/store-profile/me");
        setStoreOpen(!!res.data.isOpen);
      } catch {
        // sem perfil de loja → switch não aparece
      }
    })();
  }, [isClient]);

  const toggleStore = async () => {
    if (togglingStore || storeOpen === null) return;
    setTogglingStore(true);
    const next = !storeOpen;
    setStoreOpen(next); // otimista — switch e badge atualizam na hora
    try {
      const res = await api.patch<{ isOpen: boolean }>("/api/store-profile/me/toggle");
      setStoreOpen(!!res.data.isOpen);
    } catch {
      setStoreOpen(!next); // reverte em caso de erro
    } finally {
      setTogglingStore(false);
    }
  };

  return (
    <div className="entity-crud-container">
      <div className="entity-crud-breadcrumb">
        <div className="breadcrumb-content">
          <div className="breadcrumb-item breadcrumb-current">
            <FiHome className="breadcrumb-icon" />
            <span>Início</span>
          </div>
        </div>
        {isClient && (
          <StoreOpenToggle isOpen={storeOpen} busy={togglingStore} onToggle={toggleStore} />
        )}
        {headerCollapsed && (
          <button
            className="breadcrumb-expand-header-btn"
            onClick={toggleHeader}
            title="Mostrar header"
          >
            <FiChevronDown size={16} />
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: "32px 24px",
          background: "var(--app-bg)",
          minHeight: "calc(100vh - 180px)",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <MobileAppBanner userName={userName || undefined} />

          <div
            style={{
              textAlign: "center",
              padding: "24px 16px 16px",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 600,
                color: "var(--text-strong)",
              }}
            >
              Olá, {userName || "Usuário"}
            </h1>
          </div>

          {isClient && (
            <div style={{ marginTop: 8 }}>
              <h2
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text-label)",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Como seus clientes veem você
              </h2>
              <MyStoreCard isOpenOverride={storeOpen} />
              <ShareMenuCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
