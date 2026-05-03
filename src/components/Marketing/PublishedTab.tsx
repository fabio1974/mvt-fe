import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { MarketingCreative, MetricSnapshot } from "./types";

interface Props {
  creatives: MarketingCreative[];
}

const PublishedTab: React.FC<Props> = ({ creatives }) => {
  if (creatives.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "#64748b",
          background: "white",
          borderRadius: 12,
          border: "1px dashed #cbd5e1",
        }}
      >
        Nenhum creative publicado ainda.
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {creatives.map((c) => (
        <PublishedRow key={c.id} creative={c} />
      ))}
    </div>
  );
};

const PublishedRow: React.FC<{ creative: MarketingCreative }> = ({ creative }) => {
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    marketingApi.creativeMetrics(creative.id).then(setMetrics).catch(() => {});
  }, [creative.id]);

  const latest = metrics[0];

  const refresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await marketingApi.refreshMetrics(creative.id);
      setMetrics(fresh);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        padding: 12,
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        display: "flex",
        gap: 14,
        alignItems: "center",
      }}
    >
      {creative.assetUrl && (
        <img
          src={creative.assetUrl}
          alt=""
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            borderRadius: 8,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {creative.caption || "(sem caption)"}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          Publicado em {creative.publishedAt ? new Date(creative.publishedAt).toLocaleString("pt-BR") : "?"}
        </div>
        {latest && (
          <div style={{ fontSize: 13, marginTop: 6, display: "flex", gap: 12, color: "#475569" }}>
            <span>👁️ {latest.reach}</span>
            <span>❤️ {latest.likes}</span>
            <span>💾 {latest.saves}</span>
            <span>💬 {latest.comments}</span>
            <span>🔄 {latest.shares}</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {creative.instagramPermalink && (
          <a
            href={creative.instagramPermalink}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "6px 10px",
              background: "#dbeafe",
              color: "#1d4ed8",
              borderRadius: 6,
              fontSize: 12,
              textDecoration: "none",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            Ver IG ↗
          </a>
        )}
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{
            padding: "6px 10px",
            background: "transparent",
            color: "#475569",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {refreshing ? "…" : "Atualizar"}
        </button>
      </div>
    </div>
  );
};

export default PublishedTab;
