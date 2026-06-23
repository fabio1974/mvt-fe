import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { MarketingCreative, MarketingPaidCampaign, AdSpendSnapshot } from "./types";
import "../Generic/EntityTable.css";

const PAGE_SIZE = 8;

interface Props {
  published: MarketingCreative[];
}

const CARDAPIO_BASE = "https://zapi10.com.br/c/";

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
  const [budgetReais, setBudgetReais] = useState(20);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10));
  const [link, setLink] = useState("https://zapi10.com.br");
  const [storeHint, setStoreHint] = useState<string | null>(null);

  // Ao escolher um post: se a campanha for de uma loja, pré-preenche o link /c/<slug>
  const onPickCreative = (c: MarketingCreative) => {
    setCreativeId(c.id);
    if (c.storeSlug) {
      setLink(CARDAPIO_BASE + c.storeSlug);
      setStoreHint(c.storeName || c.storeSlug);
    } else {
      setStoreHint(null);
    }
  };

  const days = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 864e5) + 1
  );
  const totalReais = budgetReais * days;

  const [estimate, setEstimate] = useState<
    { lowerBound: number; upperBound: number; radiusKm: number; hasStore: boolean; scheduleSummary: string | null } | null
  >(null);
  const [page, setPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = campaigns.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
          <div>
            <label style={{ fontSize: 13, color: "#475569" }}>Post (dos publicados)</label>
            {published.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Nenhum post publicado ainda. Publique um na aba "Publicados".
              </div>
            ) : (
              <div
                style={{
                  marginTop: 4,
                  maxHeight: 320,
                  overflowY: "auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 8,
                  padding: 4,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                }}
              >
                {published.map((c) => {
                  const selected = creativeId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onPickCreative(c)}
                      title={c.caption || ""}
                      style={{
                        textAlign: "left",
                        padding: 0,
                        background: "white",
                        border: selected ? "2px solid #1d4ed8" : "1px solid #e2e8f0",
                        borderRadius: 8,
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#f1f5f9" }}>
                        {c.assetUrl && (
                          <img
                            src={c.assetUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                        {selected && (
                          <div
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              background: "#1d4ed8",
                              color: "white",
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 6 }}>
                        {c.storeName ? (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#15803d",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🏪 {c.storeName}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
                            Zapi10 (institucional)
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            marginTop: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          #{c.id} · {c.caption || "(sem caption)"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setStoreHint(null);
              }}
              style={inputStyle}
            />
          </label>
          {storeHint && (
            <div style={{ fontSize: 12, color: "#15803d", marginTop: -4 }}>
              🏪 Link do cardápio de <strong>{storeHint}</strong> preenchido automaticamente.
            </div>
          )}
          {estimate?.scheduleSummary && (
            <div style={{ fontSize: 12, color: "#475569", marginTop: -2 }}>
              ⏰ Veicula: <strong>{estimate.scheduleSummary}</strong>
            </div>
          )}
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

      {/* Lista de campanhas pagas — tabela responsiva paginada */}
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
        {campaigns.length > 0 && (
          <div className="entity-table-container">
            <div className="entity-table-scroll">
              <table className="entity-table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}></th>
                    <th>Status</th>
                    <th>Anúncio</th>
                    <th>⏰ Veiculação</th>
                    <th>Verba/dia</th>
                    <th>Gasto</th>
                    <th style={{ width: 90 }}>Atualizar</th>
                    <th style={{ width: 96 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((pc) => (
                    <PaidRow key={pc.id} pc={pc} creative={creativeById(pc.creativeId)} onChanged={reload} />
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  padding: "10px 4px",
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                <span>
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, campaigns.length)} de{" "}
                  {campaigns.length}
                </span>
                <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} style={btnGhost}>
                  ‹ Anterior
                </button>
                <span>
                  {safePage}/{totalPages}
                </span>
                <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} style={btnGhost}>
                  Próxima ›
                </button>
              </div>
            )}
          </div>
        )}
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

  // Carrega o gasto automaticamente ao montar (célula mostra só o dado, sem botão "Ver gasto").
  useEffect(() => {
    if (pc.fbCampaignId) refreshSpend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      console.error("[Ads] refreshSpend failed:", e?.response?.data?.message || e?.message || e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>
        {creative?.assetUrl ? (
          <img
            src={creative.assetUrl}
            alt=""
            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, display: "block" }}
          />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f1f5f9" }} />
        )}
      </td>
      <td>
        <span
          style={{
            background: st.bg,
            color: st.color,
            borderRadius: 8,
            padding: "2px 8px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {st.label}
        </span>
      </td>
      <td>
        <div style={{ maxWidth: 340 }}>
          {creative?.storeName && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>🏪 {creative.storeName}</div>
          )}
          <div
            style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={creative?.caption || pc.name}
          >
            {creative?.caption || pc.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={pc.linkUrl}
          >
            → {pc.linkUrl}
          </div>
          {pc.errorMessage && (
            <div
              style={{
                fontSize: 11,
                color: "#b91c1c",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={pc.errorMessage}
            >
              ⚠️ {pc.errorMessage}
            </div>
          )}
        </div>
      </td>
      <td style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
        {pc.scheduleSummary || "—"}
      </td>
      <td style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>{brl(pc.dailyBudgetCents)}</td>
      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
        {spend ? (
          <div style={{ color: "#475569", lineHeight: 1.5 }}>
            <div>💸 {brl(spend.spendCents)}</div>
            <div>🖱️ {spend.clicks} · CPC {brl(spend.cpcCents)}</div>
            <div>👁️ {spend.reach}</div>
          </div>
        ) : (
          <span style={{ color: "#94a3b8" }}>{busy ? "atualizando…" : "—"}</span>
        )}
      </td>
      <td style={{ textAlign: "center" }}>
        <button
          onClick={refreshSpend}
          disabled={busy || !pc.fbCampaignId}
          style={{ ...btnGhost, padding: "6px 10px" }}
          title="Atualizar gasto/cliques/impressões desta campanha"
        >
          {busy ? "…" : "🔄"}
        </button>
      </td>
      <td>
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
        </div>
      </td>
    </tr>
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
