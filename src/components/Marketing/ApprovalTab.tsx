import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { CampaignDetail, MarketingCampaign, MarketingCreative } from "./types";
import GeneratingModal from "./GeneratingModal";

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
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingDraft, setBriefingDraft] = useState("");
  const [memoryNote, setMemoryNote] = useState("");
  const [memoryStatus, setMemoryStatus] = useState<"idle" | "saving" | "saved">("idle");

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

  const startEdit = () => {
    if (!detail) return;
    setBriefingDraft(detail.campaign.briefing);
    setEditingBriefing(true);
  };

  const handleSaveAndRegenerate = async () => {
    if (!briefingDraft.trim()) return;
    if (!confirm("Isso vai DELETAR as variações atuais e gerar novas com o briefing modificado. Continuar?")) return;
    setBusy(-3);
    setError(null);
    try {
      await marketingApi.updateCampaign(campaignId, { briefing: briefingDraft.trim() });
      await marketingApi.regenerate(campaignId);
      setEditingBriefing(false);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "falha regenerando");
    } finally {
      setBusy(null);
    }
  };

  const handleSaveBriefingOnly = async () => {
    if (!briefingDraft.trim()) return;
    setBusy(-3);
    setError(null);
    try {
      await marketingApi.updateCampaign(campaignId, { briefing: briefingDraft.trim() });
      setEditingBriefing(false);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "falha salvando");
    } finally {
      setBusy(null);
    }
  };

  const handleAddMemory = async () => {
    if (!memoryNote.trim()) return;
    setMemoryStatus("saving");
    try {
      await marketingApi.observeMemory(memoryNote.trim());
      setMemoryNote("");
      setMemoryStatus("saved");
      setTimeout(() => setMemoryStatus("idle"), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "falha salvando memória");
      setMemoryStatus("idle");
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
    <>
    <GeneratingModal
      isOpen={busy === -3}
      variationsCount={campaign.requestedVariations}
      mode="regenerate"
    />
    <div
      style={{
        background: "white",
        padding: 20,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", marginBottom: 12, gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            #{campaign.id} · {campaign.creativeType} · {campaign.targetAudience}
          </div>
          {editingBriefing ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={briefingDraft}
                onChange={(e) => setBriefingDraft(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #1d4ed8",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button
                  onClick={handleSaveAndRegenerate}
                  disabled={busy !== null}
                  style={btnPrimarySm}
                  title="Deleta variações atuais e gera novas com o briefing modificado"
                >
                  {busy === -3 ? "Regenerando…" : "Salvar e regerar variações"}
                </button>
                <button
                  onClick={handleSaveBriefingOnly}
                  disabled={busy !== null}
                  style={btnSecondarySm}
                  title="Só atualiza o briefing, mantém variações"
                >
                  Salvar (sem regerar)
                </button>
                <button onClick={() => setEditingBriefing(false)} disabled={busy !== null} style={btnGhostSm}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>
              {campaign.briefing}
            </div>
          )}
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

        {/* Sidebar direita: editar / observação memória / deletar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: 240,
            flexShrink: 0,
            paddingLeft: 14,
            borderLeft: "1px solid #f1f5f9",
          }}
        >
          {!editingBriefing && (
            <button onClick={startEdit} disabled={busy !== null} style={btnSecondarySm} title="Editar briefing">
              ✎ Editar briefing
            </button>
          )}

          <div>
            <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>
              Anotar p/ memória global
            </label>
            <textarea
              value={memoryNote}
              onChange={(e) => setMemoryNote(e.target.value)}
              placeholder="Ex: 'imagens não devem ter texto sobreposto'"
              rows={2}
              style={{
                width: "100%",
                padding: 6,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "inherit",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <button
              onClick={handleAddMemory}
              disabled={memoryStatus === "saving" || !memoryNote.trim()}
              style={{ ...btnSecondarySm, marginTop: 4, width: "100%" }}
            >
              {memoryStatus === "saving"
                ? "Integrando…"
                : memoryStatus === "saved"
                ? "✓ Salvo"
                : "+ Adicionar à memória"}
            </button>
          </div>

          <button
            onClick={handleDelete}
            disabled={busy !== null}
            title="Deletar campanha"
            style={btnDangerSm}
          >
            {busy === -2 ? "…" : "🗑️ Deletar campanha"}
          </button>
        </div>
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
            onReset={async () => {
              setBusy(c.id);
              try { await marketingApi.resetCreative(c.id); await refresh(); }
              catch (e: any) { setError(e?.response?.data?.message || e?.message || "falha resetando"); }
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
    </>
  );
};

const CreativeCard: React.FC<{
  creative: MarketingCreative;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPublishSingle: () => void;
  onReset: () => void;
  onEditCaption: (newCaption: string) => void;
}> = ({ creative, busy, onApprove, onReject, onPublishSingle, onReset, onEditCaption }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(creative.caption || "");
  const [zoom, setZoom] = useState(false);
  const err = creative.errorMessage ? formatCreativeError(creative.errorMessage) : null;

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
      <div style={{ position: "relative", width: "100%", aspectRatio: creative.creativeType === "VIDEO" ? "9/16" : "1/1", background: "#f1f5f9" }}>
        {creative.assetUrl ? (
          creative.creativeType === "VIDEO" ? (
            <video
              src={creative.assetUrl}
              controls
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <>
              <img
                src={creative.assetUrl}
                alt={`Variação ${creative.variationIndex + 1}`}
                onClick={() => setZoom(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
              />
              <button
                onClick={() => setZoom(true)}
                title="Ampliar imagem"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(15,23,42,0.6)",
                  color: "white",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔍
              </button>
            </>
          )
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

      {zoom && creative.assetUrl && (
        <div
          onClick={() => setZoom(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          {creative.creativeType === "VIDEO" ? (
            <video
              src={creative.assetUrl}
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "95vw", maxHeight: "95vh", borderRadius: 8 }}
            />
          ) : (
            <img
              src={creative.assetUrl}
              alt={`Variação ${creative.variationIndex + 1} ampliada`}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }}
            />
          )}
          <button
            onClick={() => setZoom(false)}
            title="Fechar"
            style={{
              position: "fixed",
              top: 18,
              right: 22,
              width: 42,
              height: 42,
              borderRadius: 21,
              border: "none",
              background: "rgba(255,255,255,0.15)",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

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
        {err && (
          <div
            style={{
              marginTop: 6,
              padding: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "#b91c1c", fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
              ⚠️ {err.short}
            </div>
            {err.detail && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ color: "#dc2626", fontSize: 10, cursor: "pointer" }}>
                  ver detalhes técnicos
                </summary>
                <div
                  style={{
                    color: "#7f1d1d",
                    fontSize: 10,
                    marginTop: 3,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                  }}
                >
                  {err.detail}
                </div>
              </details>
            )}
          </div>
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
        {creative.status === "FAILED" && (
          <button
            onClick={onReset}
            disabled={busy}
            title="Reseta o erro e volta o creative pra revisão, pra você reenviar"
            style={btnSmAmber}
          >
            {busy ? "…" : "↻ Tentar de novo"}
          </button>
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
const btnSmAmber: React.CSSProperties = { ...btnSmBase, background: "#fef3c7", color: "#92400e" };

// Extrai a mensagem legível de um erro de creative (Graph API costuma vir como
// JSON cru tipo `400 ... {"error":{"error_user_msg":"...","message":"..."}}`).
function formatCreativeError(raw: string): { short: string; detail?: string } {
  if (!raw) return { short: "Erro desconhecido" };
  try {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const parsed = JSON.parse(raw.slice(first, last + 1));
      const e = parsed?.error ?? parsed;
      const short = e?.error_user_msg || e?.message || e?.error_user_title;
      if (short) return { short, detail: raw };
    }
  } catch {
    /* não é JSON — cai pro fallback */
  }
  const trimmed = raw.trim();
  return trimmed.length > 140
    ? { short: trimmed.slice(0, 140) + "…", detail: raw }
    : { short: trimmed };
}

// Botões da sidebar direita do card de campanha
const sidebarBtnBase: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 12,
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  textAlign: "center",
};
const btnPrimarySm: React.CSSProperties = {
  ...sidebarBtnBase,
  background: "#1d4ed8",
  color: "white",
  border: "none",
};
const btnSecondarySm: React.CSSProperties = {
  ...sidebarBtnBase,
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
};
const btnGhostSm: React.CSSProperties = {
  ...sidebarBtnBase,
  background: "transparent",
  color: "#64748b",
  border: "1px solid #cbd5e1",
};
const btnDangerSm: React.CSSProperties = {
  ...sidebarBtnBase,
  background: "transparent",
  color: "#dc2626",
  border: "1px solid #dc2626",
};

export default ApprovalTab;
