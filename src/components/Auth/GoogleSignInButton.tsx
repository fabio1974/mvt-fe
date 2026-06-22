import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { persistAuthSession, type AuthUser } from "../../utils/auth";
import { maskCPF, validateCPF } from "../../utils/masks";
import { track } from "../PublicMenu/funnel";
import GoogleOnboardingWizard from "./GoogleOnboardingWizard";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleResponse {
  token?: string;
  user?: AuthUser;
  needsDocument?: boolean;
  isNewUser?: boolean;
  // Conta nova ainda sem papel: o BE não cria, devolve isto e o FE abre o wizard de onboarding.
  needsRole?: boolean;
  email?: string;
  name?: string;
}

// Carrega o script do Google Identity Services uma única vez.
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load error")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS load error"));
    document.head.appendChild(s);
  });
}

// Extrai mensagem amigável de erro do axios.
function extractMsg(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const data = (e as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  return "";
}

/**
 * Botão "Entrar com Google" (web). Só renderiza se VITE_GOOGLE_CLIENT_ID estiver
 * configurado — assim o recurso sobe "dark" até os client IDs do Google Cloud existirem.
 *
 * Fluxo: GIS devolve o ID token → POST /auth/google → persiste sessão →
 * se a conta não tem CPF (needsDocument), abre modal de CPF → PATCH /users/me/document.
 */
export default function GoogleSignInButton({
  role,
  mode = "login",
  showDivider = true,
  onAuthenticated,
  width = 300,
}: {
  role?: string;
  mode?: "login" | "signup";
  showDivider?: boolean;
  /** Quando passado, é chamado no fim da auth EM VEZ de redirecionar/recarregar
   *  (usado no checkout, pra não perder o estado do wizard/carrinho). */
  onAuthenticated?: () => void;
  /** Largura do botão GIS (px). Responsivo em telas estreitas (mobile). Máx 400 (limite do Google). */
  width?: number;
}) {
  const btnRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [needsDocument, setNeedsDocument] = useState(false);
  const [cpf, setCpf] = useState("");
  const [savingCpf, setSavingCpf] = useState(false);
  // Conta nova: dados pra abrir o wizard de onboarding (papel → CPF → requisitos do papel).
  const [wizard, setWizard] = useState<{ idToken: string; email: string; name?: string } | null>(null);
  // Ref pra o callback do GIS sempre ler o papel atual (evita closure velha do useEffect).
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (cancelled || !btnRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        g.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential });
        g.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          // Presets localizados do Google (texto custom não é possível no botão oficial):
          // login → "Fazer login com o Google"; cadastro → "Continuar com o Google".
          text: mode === "signup" ? "continue_with" : "signin_with",
          shape: "pill",
          logo_alignment: "center",
          width: Math.max(200, Math.min(400, width)),
          locale: "pt-BR",
        });
      })
      .catch(() => setError("Não foi possível carregar o login do Google."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHome = () => {
    navigate("/");
    window.location.reload();
  };

  // Fim da auth: no checkout avança o wizard (callback); fora dele, vai pra home.
  const finish = () => (onAuthenticated ? onAuthenticated() : goHome());

  const handleCredential = async (resp: { credential?: string }) => {
    setError("");
    const idToken = resp?.credential;
    if (!idToken) {
      setError("Login com Google cancelado.");
      return;
    }
    track("auth_google_credential");
    try {
      // Probe puro (sem role): o BE decide se é login (conta existe) ou cadastro novo.
      const { data } = await api.post<GoogleResponse>("/auth/google", { idToken });
      if (data.needsRole) {
        // Conta nova → wizard de onboarding (papel → CPF → requisitos). initialRole vem
        // da aba de cadastro (se o usuário já escolheu o perfil no wizard de cadastro).
        track("auth_google_new"); // cadastro novo → wizard (papel → CPF → telefone)
        setWizard({ idToken, email: data.email || "", name: data.name });
        return;
      }
      // Conta existente: login direto. needsDocument cobre contas antigas sem CPF.
      persistAuthSession(data.token || "", data.user);
      if (data.needsDocument) {
        track("auth_cpf_needed"); // abre modal "Falta só o CPF"
        setNeedsDocument(true);
        return;
      }
      track("auth_success", "google");
      finish();
    } catch (e) {
      const msg = extractMsg(e) || "Falha no login com Google.";
      track("auth_google_error", msg);
      setError(msg);
    }
  };

  const submitCpf = async () => {
    setError("");
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      track("auth_cpf_invalid");
      setError("CPF inválido. Confira os dígitos e tente novamente.");
      return;
    }
    setSavingCpf(true);
    track("auth_cpf_submit");
    try {
      const { data } = await api.patch<{ token?: string }>("/users/me/document", { document: cleanCpf });
      if (data.token) localStorage.setItem("authToken", data.token);
      track("auth_success", "google_cpf");
      finish();
    } catch (e) {
      const msg = extractMsg(e) || "CPF inválido. Confira e tente novamente.";
      track("auth_cpf_error", msg);
      setError(msg);
    } finally {
      setSavingCpf(false);
    }
  };

  if (!CLIENT_ID) return null;

  return (
    <div style={{ width: "100%" }}>
      {showDivider && (
        <div style={dividerWrap}>
          <span style={dividerLine} />
          <span style={dividerText}>ou</span>
          <span style={dividerLine} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div ref={btnRef} />
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {needsDocument && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setNeedsDocument(false)}>
          <div style={modalCard}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "#111827" }}>Falta só o CPF</h3>
            <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "#6b7280" }}>
              Precisamos do seu CPF pra concluir o cadastro e liberar pedidos.
            </p>
            <input
              autoFocus
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              maxLength={14}
              onKeyDown={(e) => e.key === "Enter" && !savingCpf && submitCpf()}
              style={cpfInput}
            />
            <button onClick={submitCpf} disabled={savingCpf} style={cpfButton}>
              {savingCpf ? "Salvando..." : "Concluir"}
            </button>
          </div>
        </div>
      )}

      {wizard && (
        <GoogleOnboardingWizard
          idToken={wizard.idToken}
          email={wizard.email}
          name={wizard.name}
          initialRole={roleRef.current}
          onComplete={finish}
          onClose={() => setWizard(null)}
        />
      )}
    </div>
  );
}

// ── estilos ────────────────────────────────────────────────────────────────
const dividerWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  margin: "16px 0",
};
const dividerLine: React.CSSProperties = { flex: 1, height: 1, background: "#e5e7eb" };
const dividerText: React.CSSProperties = { color: "#9ca3af", fontSize: "0.85rem" };
const errorBox: React.CSSProperties = {
  color: "#ef4444",
  textAlign: "center",
  fontSize: "0.9rem",
  padding: 12,
  marginTop: 12,
  background: "#fef2f2",
  borderRadius: 8,
  border: "1px solid #fecaca",
};
const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  padding: 16,
};
const modalCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  width: "100%",
  maxWidth: 360,
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
};
const cpfInput: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  boxSizing: "border-box",
};
const cpfButton: React.CSSProperties = {
  width: "100%",
  marginTop: 12,
  padding: "12px 0",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(90deg, #5b4cfa, #4c9aff)",
  color: "#fff",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: "pointer",
};
