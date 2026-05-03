import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { CampaignDetail, MarketingCampaign, MarketingCreative } from "./types";

interface Props {
  campaigns: MarketingCampaign[];
  onChanged: () => void;
}

const ApprovalTab: React.FC<Props> = ({ campaigns, onChanged }) => {
  if (campaigns.length === 0) {
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
        Nada pra aprovar. Crie uma campanha em "Nova campanha" e gere as variações.
      </div>
    );
  }
  return (
    <div>
      {campaigns.map((c) => (
        <CampaignApprovalCard key={c.id} campaignId={c.id} onChanged={onChanged} />
      ))}
    </div>
  );
};

const CampaignApprovalCard: React.FC<{ campaignId: number; onChanged: () => void }> = ({
  campaignId,
  onChanged,
}) => {
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setDetail(await marketingApi.getCampaign(campaignId));
    } catch (e: any) {
      setError(e?.message || "falha");
    }
  };

  useEffect(() => {
    load();
  }, [campaignId]);

  const refresh = async () => {
    await load();
    onChanged();
  };

  const handleDelete = async () => {
    if (!confirm(`Deletar campanha #${campaignId}? Imagens também serão removidas do Cloudinary.`)) return;
    setBusy(-2);
    try {
      await marketingApi.deleteCampaign(campaignId);
      onChanged();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "falha deletando");
    } finally {
      setBusy(null);
    }
  };

  const approveAll = async (creatives: MarketingCreative[]) => {
    for (const c of creatives) {
      if (c.status === "GENERATED") {
        await marketingApi.approveCreative(c.id);
      }
    }
    await refresh();
  };

  const publishCarousel = async () => {
    if (!detail) return;
    const approved = detail.creatives.filter((c) => c.status === "APPROVED" && c.assetUrl);
    if (approved.length < 2) {
      setError("Selecione pelo menos 2 creatives APROVADOS pra publicar carrossel");
      return;
    }
    setBusy(-1);
    try {
      await marketingApi.publishCarousel(campaignId, approved.slice(0, 10).map((c) => c.id));
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "falha publicando");
    } finally {
      setBusy(null);
    }
  };

  if (!detail) {
    return (
      <div style={{ padding: 16, color: "#64748b" }}>
        Carregando campanha #{campaignId}…
        {error && <div style={{ color: "#991b1b" }}>{error}</div>}
      </div>
    );
  }

  const { campaign, creatives } = detail;
  const hasApproved = creatives.some((c) => c.status === "APPROVED");

  return (
    <div
      style={{
        background: "white",
        padding: 20,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            #{campaign.id} · {campaign.creativeType} · {campaign.targetAudience}
          </div>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>
            {campaign.briefing}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "2px 10px",
              background: campaign.status === "AWAITING_APPROVAL" ? "#fef3c7" : "#dbeafe",
              color: campaign.status === "AWAITING_APPROVAL" ? "#92400e" : "#1e40af",
              borderRadius: 12,
              fontSize: 12,
            }}
          >
            {campaign.status}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={busy !== null}
          title="Deletar campanha"
          style={{
            padding: "6px 10px",
            background: "transparent",
            color: "#dc2626",
            border: "1px solid #dc2626",
            borderRadius: 8,
            cursor: busy !== null ? "not-allowed" : "pointer",
            opacity: busy !== null ? 0.6 : 1,
            fontSize: 14,
          }}
        >
          {busy === -2 ? "…" : "🗑️ Deletar"}
        </button>
      </div>

      {campaign.status === "GENERATING" && (
        <div style={{ color: "#1d4ed8", fontSize: 14 }}>⏳ Gerando variações via IA…</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {creatives.map((c) => (
          <CreativeCard
            key={c.id}
            creative={c}
            busy={busy === c.id}
            onApprove={async () => {
              setBusy(c.id);
              try { await marketingApi.approveCreative(c.id); await refresh(); }
              finally { setBusy(null); }
            }}
            onReject={async () => {
              setBusy(c.id);
              try { await marketingApi.rejectCreative(c.id); await refresh(); }
              finally { setBusy(null); }
            }}
            onPublishSingle={async () => {
              setBusy(c.id);
              try { await marketingApi.publishCreative(c.id); await refresh(); }
              catch (e: any) { setError(e?.response?.data?.message || e?.message || "falha publicando"); }
              finally { setBusy(null); }
            }}
            onEditCaption={async (newCaption) => {
              setBusy(c.id);
              try { await marketingApi.approveCreative(c.id, newCaption); await refresh(); }
              finally { setBusy(null); }
            }}
          />
        ))}
      </div>

      {campaign.creativeType === "CAROUSEL" && hasApproved && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={() => approveAll(creatives)}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid #1d4ed8",
              color: "#1d4ed8",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Aprovar todos restantes
          </button>
          <button
            onClick={publishCarousel}
            disabled={busy === -1}
            style={{
              padding: "8px 14px",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              cursor: busy === -1 ? "not-allowed" : "pointer",
            }}
          >
            {busy === -1 ? "Publicando…" : `Publicar carrossel (${creatives.filter(c => c.status === "APPROVED").length})`}
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: "#991b1b", marginTop: 8, fontSize: 13 }}>{error}</div>
      )}
    </div>
  );
};

const CreativeCard: React.FC<{
  creative: MarketingCreative;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPublishSingle: () => void;
  onEditCaption: (newCaption: string) => void;
}> = ({ creative, busy, onApprove, onReject, onPublishSingle, onEditCaption }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(creative.caption || "");

  const cardBorder =
    creative.status === "APPROVED" ? "#10b981" :
    creative.status === "REJECTED" ? "#ef4444" :
    creative.status === "FAILED" ? "#dc2626" :
    creative.status === "PUBLISHED" ? "#1d4ed8" :
    "#e2e8f0";

  return (
    <div
      style={{
        border: `2px solid ${cardBorder}`,
        borderRadius: 10,
        overflow: "hidden",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "1/1", background: "#f1f5f9" }}>
        {creative.assetUrl ? (
          <img
            src={creative.assetUrl}
            alt={`Variação ${creative.variationIndex + 1}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            {creative.errorMessage ? "❌ falhou" : "Sem imagem"}
          </div>
        )}
      </div>

      <div style={{ padding: 10, fontSize: 12, color: "#475569" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
          var #{creative.variationIndex + 1} · {creative.status}
        </div>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            style={{ width: "100%", fontSize: 12, padding: 6, boxSizing: "border-box" }}
          />
        ) : (
          <div style={{ minHeight: 50 }}>{creative.caption || <em style={{ color: "#94a3b8" }}>sem caption</em>}</div>
        )}
        {creative.hashtags && (
          <div style={{ color: "#0891b2", fontSize: 11, marginTop: 4 }}>{creative.hashtags}</div>
        )}
        {creative.errorMessage && (
          <div style={{ color: "#dc2626", marginTop: 6, fontSize: 11 }}>{creative.errorMessage}</div>
        )}
      </div>

      <div style={{ padding: 8, borderTop: "1px solid #f1f5f9", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {creative.status === "GENERATED" && !editing && (
          <>
            <button onClick={onApprove} disabled={busy} style={btnSmGreen}>✓ Aprovar</button>
            <button onClick={() => { setEditing(true); setDraft(creative.caption || ""); }} disabled={busy} style={btnSmBlue}>✎ Editar</button>
            <button onClick={onReject} disabled={busy} style={btnSmGray}>✗</button>
          </>
        )}
        {creative.status === "APPROVED" && (
          <button onClick={onPublishSingle} disabled={busy} style={btnSmBlue}>
            {busy ? "…" : "Publicar"}
          </button>
        )}
        {creative.status === "PUBLISHED" && creative.instagramPermalink && (
          <a
            href={creative.instagramPermalink}
            target="_blank"
            rel="noreferrer"
            style={{ ...btnSmBlue, textDecoration: "none", display: "inline-block" }}
          >
            Ver no IG ↗
          </a>
        )}
        {editing && (
          <>
            <button onClick={() => onEditCaption(draft)} disabled={busy} style={btnSmGreen}>Salvar+Aprovar</button>
            <button onClick={() => setEditing(false)} disabled={busy} style={btnSmGray}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  );
};

const btnSmBase: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 11,
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 500,
};
const btnSmGreen: React.CSSProperties = { ...btnSmBase, background: "#dcfce7", color: "#166534" };
const btnSmBlue: React.CSSProperties = { ...btnSmBase, background: "#dbeafe", color: "#1d4ed8" };
const btnSmGray: React.CSSProperties = { ...btnSmBase, background: "#f1f5f9", color: "#64748b" };

export default ApprovalTab;
