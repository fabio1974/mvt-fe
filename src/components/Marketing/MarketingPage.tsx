import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUserRole } from "../../utils/auth";
import { marketingApi } from "./api";
import type { MarketingCampaign, MarketingCreative } from "./types";
import NewCampaignTab from "./NewCampaignTab";
import ApprovalTab from "./ApprovalTab";
import PublishedTab from "./PublishedTab";
import AdsTab from "./AdsTab";
import FunnelTab from "./FunnelTab";
import MemoryTab from "./MemoryTab";
import CharactersTab from "./CharactersTab";
import HealthBanner from "./HealthBanner";

type TabKey = "new" | "approval" | "published" | "ads" | "funnel" | "characters" | "memory";

const TABS: { key: TabKey; label: string }[] = [
  { key: "new", label: "Nova campanha" },
  { key: "approval", label: "Em aprovação" },
  { key: "published", label: "Publicados" },
  { key: "ads", label: "📣 Ads" },
  { key: "funnel", label: "📊 Funil" },
  { key: "characters", label: "🎭 Personagens" },
  { key: "memory", label: "🧠 Memória" },
];

const MarketingPage: React.FC = () => {
  const role = getUserRole();
  if (role !== "ROLE_ADMIN") {
    return <Navigate to="/" replace />;
  }

  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [published, setPublished] = useState<MarketingCreative[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [cs, ps] = await Promise.all([
        marketingApi.listCampaigns(),
        marketingApi.listPublished(),
      ]);
      setCampaigns(cs);
      setPublished(ps);
    } catch (e) {
      console.error("[Marketing] reload failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const awaitingApproval = campaigns.filter(
    (c) => c.status === "AWAITING_APPROVAL" || c.status === "GENERATING"
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
          Marketing — Zapi10
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          Pipeline automatizado: briefing → IA gera variações → você aprova → publica no @zapi10oficial.
        </p>
      </div>

      <HealthBanner />

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 20,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge =
            tab.key === "approval" ? awaitingApproval.length :
            tab.key === "published" ? published.length :
            0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid #1d4ed8" : "2px solid transparent",
                color: isActive ? "#1d4ed8" : "#475569",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              {tab.label}
              {badge > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    background: isActive ? "#1d4ed8" : "#cbd5e1",
                    color: "white",
                    borderRadius: 10,
                    padding: "1px 8px",
                    fontSize: 12,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ color: "#64748b", padding: 12 }}>Carregando…</div>
      )}

      {activeTab === "new" && (
        <NewCampaignTab onCreated={reload} campaigns={campaigns} />
      )}
      {activeTab === "approval" && (
        <ApprovalTab campaigns={awaitingApproval} onChanged={reload} />
      )}
      {activeTab === "published" && (
        <PublishedTab creatives={published} />
      )}
      {activeTab === "ads" && (
        <AdsTab published={published} />
      )}
      {activeTab === "funnel" && <FunnelTab />}
      {activeTab === "characters" && (
        <CharactersTab />
      )}
      {activeTab === "memory" && (
        <MemoryTab />
      )}
    </div>
  );
};

export default MarketingPage;
