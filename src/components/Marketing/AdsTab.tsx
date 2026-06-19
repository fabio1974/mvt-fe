import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { MarketingCreative, MarketingPaidCampaign, AdSpendSnapshot } from "./types";

interface Props {
  published: MarketingCreative[];
}

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)} mil` : String(n));

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: "#f1f5f9", color: "#475569", label: "Rascunho" },
  CREATED: { bg: "#dbeafe", color: "#1d4ed8", label: "Criada (pausada)" },
  ACTIVE: { bg: "#dcfce7", color: "#15803d", label: "Ativa" },
  PAUSED: { bg: "#f1f5f9", color: "#475569", label: "Pausada" },
  FAILED: { bg: "#fee2e2", color: "#b91c1c", label: "Falhou" },
};

const AdsTab: React.FC<Props> = ({ published }) => {
  const [campaigns, setCampaigns] = useState<MarketingPaidCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creativeId, setCreativeId] = useState<number | "">("");
  const [budgetReais, setBudgetReais] = useState(30);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10));
  const [link, setLink] = useState("https://zapi10.com.br");

  const days = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 864e5) + 1
  );
  const totalReais = budgetReais * days;

  const [estimate, setEstimate] = useState<
    { lowerBound: number; upperBound: number; radiusKm: number; hasStore: boolean } | null
  >(null);
  useEffect(() => {
    if (!link.includes("/c/")) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      marketingApi
        .audienceEstimate(link)
        .then((e) => !cancelled && setEstimate(e))
        .catch(() => !cancelled && setEstimate(null));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [link]);
  const [promoting, setPromoting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setCampaigns(await marketingApi.listPaidCampaigns());
    } catch (e) {
      console.error("[Ads] reload failed:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    reload();
  }, []);

  const promote = async () => {
    if (!creativeId) {
      setErr("Escolha um post pra promover.");
      return;
    }
    setErr(null);
    setPromoting(true);
    try {
      await marketingApi.promoteCreative({
        creativeId: Number(creativeId),
        dailyBudgetCents: Math.round(budgetReais * 100),
        linkUrl: link,
        startDate,
        endDate,
      });
      setCreativeId("");
      await reload();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Falha ao promover");
    } finally {
      setPromoting(false);
    }
  };

  const creativeById = (id?: number | null) => published.find((c) => c.id === id);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Promover vencedor */}
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Promover um post vencedor 📣</h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
          Cria uma campanha paga <strong>PAUSADA</strong> (não gasta nada até você ativar), mandando
          tráfego pro link de destino.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <label style={{ fontSize: 13, color: "#475569" }}>
            Post (dos publicados)
            <select
              value={creativeId}
              onChange={(e) => setCreativeId(e.target.value ? Number(e.target.value) : "")}
              style={inputStyle}
            >
              <option value="">— escolher —</option>
              {published.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} · {(c.caption || "(sem caption)").slice(0, 50)}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <label style={{ fontSize: 13, color: "#475569", flex: 1 }}>
              Verba diária (R$)
              <input
                type="number"
                min={5}
                value={budgetReais}
                onChange={(e) => setBudgetReais(Number(e.target.value))}
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 13, color: "#475569", flex: 1 }}>
              Início
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ fontSize: 13, color: "#475569", flex: 1 }}>
              Fim
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <label style={{ fontSize: 13, color: "#475569" }}>
            Link de destino
            <input value={link} onChange={(e) => setLink(e.target.value)} style={inputStyle} />
          </label>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            ⏰ Período fixo de <strong>{days} dia(s)</strong> · total ≈ <strong>R$ {totalReais.toFixed(2).replace(".", ",")}</strong>{" "}
            (verba/dia × dias). Só veicula no <strong>horário de funcionamento da loja</strong> e <strong>para sozinho no fim</strong>.
          </div>
          {estimate && estimate.hasStore && estimate.upperBound > 0 && (
            <div
              style={{
                fontSize: 12,
                color: "#475569",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              👥 Público na área:{" "}
              <strong>
                ~{fmtK(estimate.lowerBound)}–{fmtK(estimate.upperBound)} pessoas
              </strong>{" "}
              (raio {estimate.radiusKm}km, 18–65).{" "}
              <span style={{ color: "#94a3b8" }}>
                É o total da região (pool); quanto você alcança disso depende da verba e do período.
              </span>
            </div>
          )}
          {err && <div style={{ color: "#b91c1c", fontSize: 13 }}>{err}</div>}
          <button
            onClick={promote}
            disabled={promoting || !creativeId}
            style={{ ...btnPrimary, opacity: promoting || !creativeId ? 0.6 : 1, width: "fit-content" }}
          >
            {promoting ? "Promovendo…" : "Promover (pausado)"}
          </button>
        </div>
      </div>

      {/* Lista de campanhas pagas */}
      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Campanhas pagas</h3>
        {loading && <div style={{ color: "#64748b" }}>Carregando…</div>}
        {!loading && campaigns.length === 0 && (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              color: "#64748b",
              background: "white",
              borderRadius: 12,
              border: "1px dashed #cbd5e1",
            }}
          >
            Nenhuma campanha paga ainda.
          </div>
        )}
        <div style={{ display: "grid", gap: 12 }}>
          {campaigns.map((pc) => (
            <PaidRow key={pc.id} pc={pc} creative={creativeById(pc.creativeId)} onChanged={reload} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PaidRow: React.FC<{
  pc: MarketingPaidCampaign;
  creative?: MarketingCreative;
  onChanged: () => void | Promise<void>;
}> = ({ pc, creative, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [spend, setSpend] = useState<AdSpendSnapshot | null>(null);
  const st = STATUS_STYLE[pc.status] || STATUS_STYLE.DRAFT;

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Erro");
    } finally {
      setBusy(false);
    }
  };

  const refreshSpend = async () => {
    setBusy(true);
    try {
      setSpend(await marketingApi.refreshAdSpend(pc.id));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Erro");
    } finally {
      setBusy(false);
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
      {creative?.assetUrl && (
        <img
          src={creative.assetUrl}
          alt=""
          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              background: st.bg,
              color: st.color,
              borderRadius: 8,
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {st.label}
          </span>
          <span style={{ fontSize: 13, color: "#64748b" }}>{brl(pc.dailyBudgetCents)}/dia</span>
        </div>
        <div
          style={{
            fontSize: 13,
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {creative?.caption || pc.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          → {pc.linkUrl}
        </div>
        {spend && (
          <div style={{ fontSize: 13, marginTop: 6, display: "flex", gap: 12, color: "#475569", flexWrap: "wrap" }}>
            <span>💸 {brl(spend.spendCents)}</span>
            <span>🖱️ {spend.clicks} cliques</span>
            <span>CPC {brl(spend.cpcCents)}</span>
            <span>👁️ {spend.reach}</span>
          </div>
        )}
        {pc.errorMessage && (
          <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{pc.errorMessage}</div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(pc.status === "CREATED" || pc.status === "PAUSED") && (
          <button onClick={() => act(() => marketingApi.launchPaid(pc.id))} disabled={busy} style={btnAction}>
            ▶ Ativar
          </button>
        )}
        {pc.status === "ACTIVE" && (
          <button onClick={() => act(() => marketingApi.pausePaid(pc.id))} disabled={busy} style={btnGhost}>
            ⏸ Pausar
          </button>
        )}
        <button onClick={refreshSpend} disabled={busy} style={btnGhost}>
          Ver gasto
        </button>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 16px",
  background: "#1d4ed8",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const btnAction: React.CSSProperties = {
  padding: "6px 12px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  color: "#475569",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

export default AdsTab;
