import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { FunnelReport } from "./types";

/** Estágios na ordem do funil. `main` = marco do caminho principal (calcula queda). */
const STAGES: { key: string; label: string; main?: boolean; sub?: boolean; bad?: boolean; branch?: boolean }[] = [
  { key: "cardapio_view", label: "Viu o cardápio", main: true },
  { key: "product_open", label: "Abriu um produto", main: true },
  { key: "cart_add", label: "Montou o pedido (1º item)", main: true },
  { key: "checkout_open", label: "Abriu o checkout", main: true },
  { key: "checkout_step_auth", label: "Tela de login/cadastro", main: true },
  { key: "auth_view", label: "viu a tela de auth", sub: true },
  { key: "auth_email_submit", label: "tentou login (e-mail)", sub: true },
  { key: "auth_email_error", label: "erro no login e-mail", sub: true, bad: true },
  { key: "auth_google_credential", label: "tentou Google", sub: true },
  { key: "auth_google_new", label: "cadastro novo (Google → wizard CPF/telefone)", sub: true },
  { key: "auth_google_error", label: "erro no Google", sub: true, bad: true },
  { key: "auth_cpf_needed", label: "pediu CPF", sub: true },
  { key: "auth_cpf_invalid", label: "CPF inválido (validação)", sub: true, bad: true },
  { key: "auth_cpf_submit", label: "enviou CPF", sub: true },
  { key: "auth_cpf_error", label: "erro ao salvar CPF", sub: true, bad: true },
  { key: "auth_success", label: "Autenticou ✓", main: true },
  { key: "checkout_step_address", label: "Tela de endereço", main: true },
  { key: "address_submit", label: "confirmou endereço", sub: true },
  { key: "checkout_step_summary", label: "Resumo do pedido", main: true },
  { key: "checkout_step_pix", label: "Gerou PIX", main: true },
  { key: "order_placed", label: "Pedido criado 🎯", main: true },
  { key: "checkout_step_success", label: "Sucesso ✓", main: true },
];

/** Marcos compactos pra tabela por loja. */
const MILESTONES = [
  { key: "cardapio_view", label: "Viu" },
  { key: "product_open", label: "Abriu" },
  { key: "cart_add", label: "Montou" },
  { key: "checkout_open", label: "Checkout" },
  { key: "checkout_step_auth", label: "Login" },
  { key: "auth_success", label: "Autenticou" },
  { key: "order_placed", label: "Pedido" },
];

const pct = (n: number, base: number) => (base > 0 ? Math.round((n / base) * 100) : 0);

const FunnelTab: React.FC = () => {
  const [days, setDays] = useState(0); // default "Hoje" (desde 00:00 BR)
  const [report, setReport] = useState<FunnelReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    marketingApi
      .funnelReport(days)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [days]);

  const total = report?.total || {};
  const base = total["cardapio_view"] || 0;

  // queda relativa ao marco principal anterior
  let prevMain = 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>📊 Funil do cardápio</h3>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
            Visitantes únicos por estágio — onde exatamente o pessoal para.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid " + (days === d ? "#1d4ed8" : "#cbd5e1"),
                background: days === d ? "#1d4ed8" : "white",
                color: days === d ? "white" : "#475569",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {d === 0 ? "Hoje" : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ color: "#64748b" }}>Carregando…</div>}

      {!loading && base === 0 && (
        <div style={{ padding: 28, textAlign: "center", color: "#64748b", background: "white", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
          Ainda sem dados de funil {days === 0 ? "hoje" : `nos últimos ${days} dias`}. Os eventos aparecem conforme os visitantes
          abrem os cardápios (precisa do build novo no ar).
        </div>
      )}

      {!loading && base > 0 && (
        <>
          {/* Funil total */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Total (todas as lojas)</div>
            <div style={{ display: "grid", gap: 4 }}>
              {STAGES.map((s) => {
                const n = total[s.key] || 0;
                const widthPct = pct(n, base);
                let drop: number | null = null;
                if (s.main) {
                  if (prevMain > 0 && n < prevMain) drop = Math.round(((prevMain - n) / prevMain) * 100);
                  prevMain = n;
                }
                if (n === 0 && s.sub) return null; // não polui com sub-eventos zerados
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      paddingLeft: s.sub ? 18 : 0,
                    }}
                  >
                    <div style={{ width: 280, fontSize: s.sub ? 12 : 13, color: s.bad ? "#b91c1c" : s.sub ? "#64748b" : "#0f172a", fontWeight: s.main ? 600 : 400 }}>
                      {s.sub ? "└ " : ""}{s.label}
                    </div>
                    <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 6, height: s.sub ? 14 : 20, position: "relative", overflow: "hidden" }}>
                      <div
                        style={{
                          width: widthPct + "%",
                          height: "100%",
                          background: s.bad ? "#fca5a5" : s.main ? "#1d4ed8" : "#93c5fd",
                          borderRadius: 6,
                          transition: "width .3s",
                        }}
                      />
                    </div>
                    <div style={{ width: 110, fontSize: 12, color: "#475569", textAlign: "right" }}>
                      <strong>{n}</strong> ({pct(n, base)}%)
                      {drop != null && drop > 0 && (
                        <span style={{ color: drop >= 50 ? "#b91c1c" : "#d97706", marginLeft: 6 }}>↓{drop}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
              ↓ = queda em relação ao marco principal anterior. Vermelho = sub-evento de erro/abandono.
            </div>
          </div>

          {/* Por loja */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Por loja</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={th}>Loja</th>
                    {MILESTONES.map((m) => (
                      <th key={m.key} style={{ ...th, textAlign: "right" }}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report!.stores.map((st) => {
                    const sbase = st.counts["cardapio_view"] || 0;
                    return (
                      <tr key={st.slug || st.name} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ ...td, fontWeight: 600 }}>{st.name}</td>
                        {MILESTONES.map((m) => {
                          const n = st.counts[m.key] || 0;
                          return (
                            <td key={m.key} style={{ ...td, textAlign: "right" }}>
                              {n}
                              {m.key !== "cardapio_view" && sbase > 0 && (
                                <span style={{ color: "#94a3b8", fontSize: 11 }}> ({pct(n, sbase)}%)</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const th: React.CSSProperties = { padding: "8px 10px", fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 10px", whiteSpace: "nowrap" };

export default FunnelTab;
