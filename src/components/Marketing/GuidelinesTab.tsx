import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { MarketingGuideline } from "./types";

const GuidelinesTab: React.FC = () => {
  const [list, setList] = useState<MarketingGuideline[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setList(await marketingApi.listGuidelines());
    } catch (e: any) {
      setError(e?.message || "falha");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await marketingApi.createGuideline({ text: text.trim() });
      setText("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "erro");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (g: MarketingGuideline) => {
    setBusy(true);
    try {
      await marketingApi.patchGuideline(g.id, { active: !g.active });
      load();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (g: MarketingGuideline) => {
    if (!confirm(`Deletar diretriz: "${g.text.slice(0, 60)}..."?`)) return;
    setBusy(true);
    try {
      await marketingApi.deleteGuideline(g.id);
      load();
    } finally {
      setBusy(false);
    }
  };

  const activeCount = list.filter((g) => g.active).length;

  return (
    <div>
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e3a8a",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        💡 Cada diretriz aqui é injetada automaticamente em <strong>todo prompt</strong> que vai pro Gemini.
        Use pra ensinar tom de voz, palavras a evitar, CTAs obrigatórias, etc. Vão se acumulando — quanto mais, melhor a consistência.
        Atualmente: <strong>{activeCount} ativas</strong>.
      </div>

      <form
        onSubmit={handleAdd}
        style={{
          background: "white",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
        }}
      >
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>
          Nova diretriz / observação permanente
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: 'Sempre mencionar frete grátis em pedidos acima de R$30'&#10;Ex: 'Evitar a palavra barato — usar preço justo'&#10;Ex: 'Tom mais formal pra audience RESTAURANT_OWNER'"
          rows={3}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          required
        />
        {error && <div style={{ color: "#991b1b", marginTop: 6, fontSize: 13 }}>{error}</div>}
        <button
          type="submit"
          disabled={busy || !text.trim()}
          style={{
            marginTop: 10,
            padding: "8px 16px",
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 500,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Salvando…" : "Adicionar diretriz"}
        </button>
      </form>

      {list.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
          Nenhuma diretriz ainda. Adicione uma acima.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((g) => (
            <div
              key={g.id}
              style={{
                background: "white",
                border: `1px solid ${g.active ? "#cbd5e1" : "#e2e8f0"}`,
                opacity: g.active ? 1 : 0.55,
                padding: 12,
                borderRadius: 10,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <input
                type="checkbox"
                checked={g.active}
                onChange={() => handleToggle(g)}
                disabled={busy}
                title={g.active ? "Ativa (clique pra desativar)" : "Inativa (clique pra ativar)"}
                style={{ marginTop: 4 }}
              />
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#1e293b" }}>
                {g.text}
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  #{g.id} · adicionada {new Date(g.createdAt).toLocaleDateString("pt-BR")}
                  {g.scope && ` · escopo: ${g.scope}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(g)}
                disabled={busy}
                title="Deletar"
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  color: "#dc2626",
                  border: "1px solid #dc2626",
                  borderRadius: 6,
                  cursor: busy ? "not-allowed" : "pointer",
                  fontSize: 12,
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidelinesTab;
