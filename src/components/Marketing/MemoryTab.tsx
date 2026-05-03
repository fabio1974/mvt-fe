import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

interface CurrentMemory {
  content: string;
  updatedAt: string;
  observationCount: number;
}

interface Observation {
  id: number;
  observation: string;
  applied: boolean;
  errorMessage?: string | null;
  createdAt: string;
}

const MEM_BASE = "/api/admin/marketing/memory";

const MemoryTab: React.FC = () => {
  const [observation, setObservation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [current, setCurrent] = useState<CurrentMemory | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loadingObs, setLoadingObs] = useState(false);

  const reload = async () => {
    try {
      const { data } = await api.get<CurrentMemory>(MEM_BASE);
      setCurrent(data);
    } catch {
      // ignore
    }
  };

  const loadObservations = async () => {
    setLoadingObs(true);
    try {
      const { data } = await api.get<Observation[]>(`${MEM_BASE}/observations`);
      setObservations(data);
    } finally {
      setLoadingObs(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observation.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`${MEM_BASE}/observe`, { observation: observation.trim() });
      setSuccess("✓ Observação integrada à memória. Próximas campanhas já vão considerar.");
      setObservation("");
      reload();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e3a8a",
          padding: 14,
          borderRadius: 10,
          marginBottom: 18,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        🧠 <strong>Memória do negócio.</strong> Cada observação que você adicionar aqui é{" "}
        integrada inteligentemente pelo Gemini à memória existente — não vira append cru,
        contradições e duplicatas são resolvidas automaticamente. Toda nova campanha já
        usa a memória atualizada.
        <br />
        <br />
        <em>
          Exemplos: "Organizer é parceiro Zapi10 — gerente de vários estabelecimentos e líder de motoboys" •
          "Não usar emoji de fogo, prefiro corações" • "Frete grátis acima de R$30 em Fortaleza".
        </em>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: 18,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 16,
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 500,
            color: "#1e293b",
            marginBottom: 8,
          }}
        >
          Nova observação ou correção
        </label>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Ex: 'Da próxima vez, lembre-se: organizer no Zapi10 é o parceiro que gerencia vários estabelecimentos e lidera um grupo de motoboys, não é organizador de eventos.'"
          rows={4}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
            resize: "vertical",
          }}
          required
        />
        {error && (
          <div
            style={{
              color: "#991b1b",
              background: "#fee2e2",
              padding: 8,
              borderRadius: 6,
              marginTop: 10,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              color: "#166534",
              background: "#dcfce7",
              padding: 8,
              borderRadius: 6,
              marginTop: 10,
              fontSize: 13,
            }}
          >
            {success}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
          <button
            type="submit"
            disabled={busy || !observation.trim()}
            style={{
              padding: "10px 20px",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Integrando…" : "Adicionar à memória"}
          </button>
          {current && (
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {current.observationCount} observações registradas
              {current.updatedAt && ` · última atualização ${new Date(current.updatedAt).toLocaleString("pt-BR")}`}
            </span>
          )}
        </div>
      </form>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          onClick={() => {
            setShowCurrent((v) => !v);
            if (!showCurrent) reload();
          }}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            color: "#475569",
          }}
        >
          {showCurrent ? "Ocultar contexto atual" : "Ver contexto atual (debug)"}
        </button>
        <button
          onClick={() => {
            if (observations.length === 0) loadObservations();
            else setObservations([]);
          }}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            color: "#475569",
          }}
        >
          {observations.length > 0 ? "Ocultar histórico" : "Ver histórico de observações"}
        </button>
      </div>

      {showCurrent && current && (
        <pre
          style={{
            marginTop: 12,
            padding: 14,
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {current.content || "(memória vazia — adicione a primeira observação acima)"}
        </pre>
      )}

      {observations.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {loadingObs && <div style={{ fontSize: 12, color: "#64748b" }}>carregando…</div>}
          {observations.map((o) => (
            <div
              key={o.id}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                #{o.id} · {new Date(o.createdAt).toLocaleString("pt-BR")}
                {o.applied ? " · ✅ aplicada" : " · ⚠️ não aplicada"}
                {o.errorMessage && ` · ${o.errorMessage}`}
              </div>
              <div style={{ color: "#1e293b" }}>{o.observation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryTab;
