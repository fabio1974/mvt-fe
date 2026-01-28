import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { FormField, FormInput, FormButton } from "../Common/FormComponents";
import { FiCheckCircle } from "react-icons/fi";
import InfoPanel from "./InfoPanel";
import "./LoginRegisterPage.css";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError("");

    try {
      await api.post("/auth/forgot-password", {
        email: data.email,
      });
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch {
      // Mesmo que o email não exista, mostramos sucesso por segurança
      // para não revelar quais emails estão cadastrados
      setSubmittedEmail(data.email);
      setSuccess(true);
    }
  };

  // Link styles - mesmo padrão do AuthTabs
  const linkStyles: React.CSSProperties = {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.95rem",
    color: "#6b7280",
  };

  const linkButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "0.95rem",
    padding: 0,
  };

  return (
    <div className="login-register-page">
      <div className="login-register-container">
        <div className="auth-panel">
          {/* Header no mesmo padrão do Login */}
          <div className="auth-tabs">
            <div className="auth-tab active" style={{ cursor: "default", flex: 1 }}>
              RECUPERAR SENHA
            </div>
          </div>

          {success ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: 32,
                background: "#f0fdf4",
                borderRadius: 12,
                border: "1px solid #bbf7d0",
              }}
            >
              <FiCheckCircle size={48} color="#10b981" />
              <h3 style={{ color: "#10b981", margin: 0 }}>Email enviado!</h3>
              <p style={{ color: "#666", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                Se o email <strong>{submittedEmail}</strong> estiver cadastrado,
                você receberá um link para redefinir sua senha.
              </p>
              <p style={{ color: "#94a3b8", textAlign: "center", margin: 0, fontSize: "0.85rem" }}>
                Verifique também sua caixa de spam.
              </p>
            </div>
          ) : (
            <form
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
              onSubmit={handleSubmit(onSubmit)}
            >
              <FormField label="E-mail" required error={errors.email?.message}>
                <FormInput
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email", {
                    required: "E-mail é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "E-mail inválido",
                    },
                  })}
                />
              </FormField>

              {error && (
                <div
                  style={{
                    color: "#ef4444",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    padding: 12,
                    background: "#fef2f2",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <FormButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    background: "linear-gradient(90deg, #5b4cfa, #4c9aff)",
                    color: "#fff",
                    padding: "14px 0",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(91, 76, 250, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
                </FormButton>
              </div>
            </form>
          )}

          <div style={linkStyles}>
            Lembrou sua senha?{" "}
            <button
              style={linkButtonStyles}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3b82f6")}
            >
              Fazer login
            </button>
          </div>
        </div>
        <InfoPanel />
      </div>
    </div>
  );
}
