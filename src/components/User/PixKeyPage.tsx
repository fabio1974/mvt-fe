import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { getUserId } from "../../utils/auth";

/**
 * Cadastro/edição da chave PIX do usuário logado. Substituiu a antiga
 * "Dados Bancários" no Sidebar em 2026-05-07 — todo repasse agora sai
 * via PIX-out (PagarmeTransfer), então só PIX é necessário.
 *
 * Endpoints: GET /api/users/{id} pra carregar, PUT /api/users/{id} com
 * { pixKey, pixKeyType } pra salvar (campos não enviados ficam intocados).
 */

const PIX_KEY_TYPES: Array<{ value: string; label: string; placeholder: string }> = [
  { value: "CPF", label: "CPF", placeholder: "000.000.000-00" },
  { value: "CNPJ", label: "CNPJ", placeholder: "00.000.000/0000-00" },
  { value: "EMAIL", label: "E-mail", placeholder: "voce@exemplo.com" },
  { value: "PHONE", label: "Telefone", placeholder: "+5585999999999" },
  { value: "EVP", label: "Chave aleatória (EVP)", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
];

const PixKeyPage: React.FC = () => {
  const userId = getUserId();
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const resp = await api.get(`/api/users/${userId}`);
        const data = resp.data as { pixKey?: string; pixKeyType?: string };
        setPixKey(data.pixKey ?? "");
        setPixKeyType(data.pixKeyType ?? "CPF");
      } catch (e) {
        console.error("Erro ao carregar chave PIX:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setFeedback(null);
    try {
      await api.put(`/api/users/${userId}`, {
        pixKey: pixKey.trim(),
        pixKeyType,
      });
      setFeedback({ kind: "ok", msg: "Chave PIX salva com sucesso." });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Falha ao salvar";
      setFeedback({ kind: "err", msg });
    } finally {
      setSaving(false);
    }
  };

  if (!userId) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Erro: Usuário não autenticado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
        Carregando…
      </div>
    );
  }

  const placeholder = PIX_KEY_TYPES.find((t) => t.value === pixKeyType)?.placeholder ?? "";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 6 }}>Chave PIX</h2>
      <p style={{ color: "#6b7280", marginTop: 0, marginBottom: 24 }}>
        Cadastre a chave PIX onde você quer receber seus repasses. Todos os pagamentos da
        plataforma são feitos via PIX.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
          Tipo de chave
        </label>
        <select
          value={pixKeyType}
          onChange={(e) => setPixKeyType(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #d1d5db", marginBottom: 16, fontSize: 14,
          }}
        >
          {PIX_KEY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
          Chave PIX
        </label>
        <input
          type="text"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #d1d5db", marginBottom: 24, fontSize: 14,
            boxSizing: "border-box",
          }}
        />

        {feedback && (
          <div
            style={{
              padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14,
              background: feedback.kind === "ok" ? "#d1fae5" : "#fee2e2",
              color: feedback.kind === "ok" ? "#065f46" : "#991b1b",
            }}
          >
            {feedback.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: "#10b981", color: "#fff", fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
};

export default PixKeyPage;
