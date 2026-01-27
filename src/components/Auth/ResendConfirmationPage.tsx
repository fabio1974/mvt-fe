import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { FiMail, FiCheckCircle, FiLoader } from "react-icons/fi";
import "./LoginRegisterPage.css";

/**
 * Página para Reenviar Email de Confirmação
 * 
 * Permite que o usuário solicite um novo email de confirmação
 * caso o anterior tenha expirado ou não tenha chegado.
 */
export default function ResendConfirmationPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus("error");
      setMessage("Por favor, informe seu email.");
      return;
    }

    // Validar formato do email
    const isValidEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim());
    if (!isValidEmail) {
      setStatus("error");
      setMessage("Por favor, informe um email válido.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await api.post("/auth/resend-confirmation", { username: email.trim() });
      setStatus("success");
      setMessage("Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.");
    } catch (err) {
      setStatus("error");
      
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
        if (response?.data?.message) {
          const msg = response.data.message.toLowerCase();
          if (msg.includes("not found") || msg.includes("user not found")) {
            setMessage("Não encontramos uma conta com este email.");
          } else if (msg.includes("already confirmed") || msg.includes("already verified")) {
            setMessage("Este email já foi confirmado. Você pode fazer login normalmente.");
          } else if (msg.includes("too many") || msg.includes("rate limit")) {
            setMessage("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
          } else {
            setMessage(response.data.message);
          }
        } else if (response?.data?.error) {
          setMessage(response.data.error);
        } else {
          setMessage("Erro ao reenviar email. Tente novamente mais tarde.");
        }
      } else {
        setMessage("Erro ao reenviar email. Tente novamente mais tarde.");
      }
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "16px",
    padding: "48px 40px",
    maxWidth: "450px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    background: status === "success"
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "14px 32px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: status === "loading" ? "not-allowed" : "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    opacity: status === "loading" ? 0.7 : 1,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconContainerStyle}>
          {status === "loading" ? (
            <FiLoader size={40} color="white" style={{ animation: "spin 1s linear infinite" }} />
          ) : status === "success" ? (
            <FiCheckCircle size={40} color="white" />
          ) : (
            <FiMail size={40} color="white" />
          )}
        </div>

        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "12px",
          textAlign: "center",
        }}>
          {status === "success" ? "Email Enviado!" : "Reenviar Email de Confirmação"}
        </h1>

        <p style={{
          fontSize: "1rem",
          color: "#64748b",
          lineHeight: 1.6,
          marginBottom: "24px",
          textAlign: "center",
        }}>
          {status === "success" 
            ? message
            : "Informe seu email para receber um novo link de confirmação."
          }
        </p>

        {status !== "success" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
              disabled={status === "loading"}
            />

            <button
              type="submit"
              style={buttonStyle}
              disabled={status === "loading"}
              onMouseEnter={(e) => {
                if (status !== "loading") {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
              }}
            >
              {status === "loading" ? "Enviando..." : "Reenviar Email"}
            </button>

            {status === "error" && message && (
              <div style={{
                color: "#ef4444",
                textAlign: "center",
                fontSize: "0.9rem",
                padding: "12px",
                background: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
              }}>
                {message}
              </div>
            )}
          </form>
        )}

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontSize: "0.95rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/login")}
          >
            Voltar para Login
          </button>
        </div>
      </div>

      {/* CSS para animação de loading */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
