import { useEffect, useState } from "react";

const REDIRECT_SECONDS = 4;

/**
 * Overlay full-screen mostrado quando a API retorna 401.
 * Ouve `window` event "session-expired" disparado pelo interceptor de api.ts.
 * Redireciona para /login com countdown — bloqueia a UI antiga (que ficaria
 * com "Erro ao carregar dados" aparecendo).
 */
export default function SessionExpiredOverlay() {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const onExpired = () => {
      setSecondsLeft(REDIRECT_SECONDS);
      setVisible(true);
    };
    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          window.location.href = "/login?reason=expired";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: "#fef3c7",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          🔒
        </div>
        <h2
          id="session-expired-title"
          style={{ margin: "0 0 8px", fontSize: 20, color: "#1f2937" }}
        >
          Sessão expirada
        </h2>
        <p style={{ margin: "0 0 20px", color: "#4b5563", lineHeight: 1.5 }}>
          Por segurança, você precisa fazer login novamente para continuar.
        </p>
        <p style={{ margin: "0 0 16px", color: "#9ca3af", fontSize: 13 }}>
          Redirecionando em {secondsLeft}s…
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/login?reason=expired";
          }}
          style={{
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Ir para o login agora
        </button>
      </div>
    </div>
  );
}
