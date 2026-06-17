import { useState } from "react";
import { X } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";
import { api } from "../../services/api";
import { persistAuthSession, getUserName, type AuthUser } from "../../utils/auth";

interface Props {
  /** Fecha o modal sem trocar. */
  onClose: () => void;
  /** Chamado após autenticar com sucesso (login ou Google) — o pai recomputa a identidade. */
  onSwitched: () => void;
}

function extractMsg(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const d = (e as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return d?.message || d?.error || "";
  }
  return "";
}

/**
 * Modal de "Trocar de conta" (banner público). Reusa o GoogleSignInButton (sem reload,
 * via onAuthenticated) e o login por e-mail/senha. Uma auth bem-sucedida sobrescreve a
 * sessão atual (persistAuthSession), então é uma troca de fato; cancelar mantém a sessão.
 */
export default function SwitchAccountModal({ onClose, onSwitched }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const current = getUserName();
  // Largura responsiva do botão Google: cabe no card em telas estreitas (mobile).
  // Card maxWidth 360 menos paddings (~36) → no máx ~324; clamp pela viewport real.
  const gisWidth = Math.min(320, (typeof window !== "undefined" ? window.innerWidth : 360) - 56);
  const done = () => {
    onSwitched();
    onClose();
  };

  const emailLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; user?: AuthUser }>("/auth/login", {
        username: email.trim(),
        password,
      });
      persistAuthSession(data.token, data.user);
      done();
    } catch (e) {
      setError(extractMsg(e) || "Não foi possível entrar. Confira e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h2 style={title}>Trocar de conta</h2>
          <button style={iconBtn} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {current && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
            Você está como <strong style={{ color: "#374151" }}>{current}</strong>. Entre com outra conta:
          </p>
        )}

        {/* Google (menor atrito) */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleSignInButton role="CUSTOMER" mode="login" showDivider={false} onAuthenticated={done} width={gisWidth} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
          <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ color: "#9ca3af", fontSize: 13 }}>ou com e-mail</span>
          <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={input}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={input}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && emailLogin()}
          />
          {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}
          <button style={{ ...primaryBtn, ...(loading ? { opacity: 0.6 } : {}) }} disabled={loading} onClick={emailLogin}>
            {loading ? "Entrando..." : "Entrar com e-mail"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 12,
};
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  width: "100%",
  maxWidth: 360,
  padding: 18,
  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  maxHeight: "90vh",
  overflowY: "auto",
};
const header: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 };
const title: React.CSSProperties = { margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" };
const iconBtn: React.CSSProperties = { border: "none", background: "transparent", cursor: "pointer", color: "#6b7280", padding: 4 };
const input: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 15,
  boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  border: "none",
  borderRadius: 10,
  background: "#f97316",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};
