import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import "./LoginRegisterPage.css";

/**
 * Página de Confirmação de Email
 * 
 * Esta página é acessada quando o usuário clica no link de confirmação
 * enviado por email após o registro.
 * 
 * URL esperada: /confirmar-email?token=xxx
 * 
 * Estados:
 * - loading: Verificando token
 * - success: Email confirmado com sucesso
 * - error: Token inválido ou expirado
 */
export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Token de confirmação não encontrado. Verifique o link enviado por email.");
        return;
      }

      try {
        await api.get(`/auth/confirm?token=${token}`);
        setStatus("success");
        setMessage("Seu email foi confirmado com sucesso! Agora você pode fazer login.");
      } catch (err) {
        setStatus("error");
        
        // Extrair mensagem de erro do backend
        if (err && typeof err === "object" && "response" in err) {
          const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
          if (response?.data?.message) {
            // Traduz mensagens comuns
            const msg = response.data.message.toLowerCase();
            if (msg.includes("expired")) {
              setMessage("O link de confirmação expirou. Solicite um novo link de confirmação.");
            } else if (msg.includes("invalid") || msg.includes("not found")) {
              setMessage("Link de confirmação inválido. Verifique se você copiou o link corretamente.");
            } else if (msg.includes("already confirmed")) {
              setMessage("Este email já foi confirmado anteriormente. Você pode fazer login normalmente.");
              setStatus("success"); // Trata como sucesso se já foi confirmado
            } else {
              setMessage(response.data.message);
            }
          } else if (response?.data?.error) {
            setMessage(response.data.error);
          } else {
            setMessage("Erro ao confirmar email. Tente novamente ou solicite um novo link.");
          }
        } else {
          setMessage("Erro ao confirmar email. Tente novamente mais tarde.");
        }
      }
    };

    confirmEmail();
  }, [searchParams]);

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
    textAlign: "center",
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
    background: status === "loading" 
      ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
      : status === "success"
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "12px",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "1rem",
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "32px",
  };

  const buttonStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "14px 32px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconContainerStyle}>
          {status === "loading" && (
            <FiLoader size={40} color="white" style={{ animation: "spin 1s linear infinite" }} />
          )}
          {status === "success" && <FiCheckCircle size={40} color="white" />}
          {status === "error" && <FiXCircle size={40} color="white" />}
        </div>

        <h1 style={titleStyle}>
          {status === "loading" && "Confirmando email..."}
          {status === "success" && "Email confirmado!"}
          {status === "error" && "Ops! Algo deu errado"}
        </h1>

        <p style={messageStyle}>
          {status === "loading" ? "Aguarde enquanto verificamos seu email..." : message}
        </p>

        {status !== "loading" && (
          <button
            style={buttonStyle}
            onClick={() => window.close()}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.4)";
            }}
          >
            Fechar
          </button>
        )}
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
