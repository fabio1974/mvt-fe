import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";

const HealthBanner: React.FC = () => {
  const [state, setState] = useState<{
    vertex_configured: boolean;
    instagram_configured: boolean;
    instagram_token_check?: { ok?: boolean; error?: string; name?: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    marketingApi.health().then(setState).catch((e) => setError(e?.message || "falhou"));
  }, []);

  if (error) {
    return (
      <div
        style={{
          background: "#fee2e2",
          color: "#991b1b",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        ⚠️ Não consegui verificar saúde do pipeline ({error}).
      </div>
    );
  }

  if (!state) return null;

  const allOk =
    state.vertex_configured &&
    state.instagram_configured &&
    state.instagram_token_check?.ok;

  if (allOk) {
    return (
      <div
        style={{
          background: "#dcfce7",
          color: "#166534",
          padding: 10,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        ✅ Vertex AI + Instagram Graph API configurados e respondendo.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fef9c3",
        color: "#854d0e",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
      }}
    >
      ⚠️ Configuração parcial — verifique env vars:
      <ul style={{ margin: "6px 0 0 20px", padding: 0 }}>
        <li>Vertex AI: {state.vertex_configured ? "✅" : "❌ falta VERTEX_AI_*"}</li>
        <li>
          Instagram: {state.instagram_configured ? "✅" : "❌ falta INSTAGRAM_BUSINESS_ACCOUNT_ID/TOKEN"}
        </li>
        <li>
          Token check: {state.instagram_token_check?.ok ? "✅" : `❌ ${state.instagram_token_check?.error || "?"}`}
        </li>
      </ul>
    </div>
  );
};

export default HealthBanner;
