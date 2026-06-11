import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import GoogleSignInButton from "../../Auth/GoogleSignInButton";
import { api } from "../../../services/api";
import { persistAuthSession, type AuthUser } from "../../../utils/auth";
import { cs } from "../checkoutStyles";

interface Props {
  onAuthenticated: () => void;
  onBack: () => void;
}

function extractMsg(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const d = (e as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return d?.message || d?.error || "";
  }
  return "";
}

/**
 * Porta de autenticação do checkout. NÃO recarrega a página (passa onAuthenticated
 * pro GoogleSignInButton), então o carrinho/estado do wizard sobrevive. Google é o
 * caminho de menor atrito (cria CUSTOMER com CPF+telefone); e-mail/senha cobre quem
 * já tem conta.
 */
export default function AuthGateStep({ onAuthenticated, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      onAuthenticated();
    } catch (e) {
      setError(extractMsg(e) || "Não foi possível entrar. Confira e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={cs.body}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Falta pouco! 🎉</h2>
          <p style={cs.muted}>Entre pra finalizar o pedido — leva segundos. Seu carrinho fica guardado.</p>
        </div>

        {/* Google (menor atrito) */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleSignInButton role="CUSTOMER" mode="signup" showDivider={false} onAuthenticated={onAuthenticated} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
          <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ color: "#9ca3af", fontSize: 13 }}>ou com e-mail</span>
          <span style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={cs.input}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={cs.input}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && emailLogin()}
          />
          {error && <div style={cs.error}>{error}</div>}
        </div>
      </div>

      <div style={cs.footer}>
        <button style={{ ...cs.primaryBtn, ...(loading ? cs.primaryBtnDisabled : {}) }} disabled={loading} onClick={emailLogin}>
          {loading ? "Entrando..." : "Entrar com e-mail"}
        </button>
        <button style={cs.ghostBtn} onClick={onBack}>
          <ChevronLeft size={14} style={{ verticalAlign: "middle" }} /> Voltar ao carrinho
        </button>
      </div>
    </>
  );
}
