import { useForm } from "react-hook-form";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { FormField, FormPasswordInput, FormButton } from "../Common/FormComponents";
import { FiCheckCircle } from "react-icons/fi";
import InfoPanel from "./InfoPanel";
import "./LoginRegisterPage.css";

interface NewPasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function NewPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordFormData>();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const password = watch("password");

  const onSubmit = async (data: NewPasswordFormData) => {
    setError("");

    if (!token) {
      setError("Token inválido ou ausente.");
      return;
    }

    try {
      await api.post("/auth/reset-password", { 
        token, 
        newPassword: data.password 
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || "Erro ao redefinir senha. O link pode ter expirado.");
      } else {
        setError("Erro ao redefinir senha. O link pode ter expirado.");
      }
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
              NOVA SENHA
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
              <h3 style={{ color: "#10b981", margin: 0 }}>Senha alterada com sucesso!</h3>
              <p style={{ color: "#666", textAlign: "center", margin: 0 }}>
                Você será redirecionado para o login em instantes...
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
              <FormField 
                label="Nova Senha" 
                required 
                error={errors.password?.message}
              >
                <FormPasswordInput
                  placeholder="Digite sua nova senha"
                  {...register("password", {
                    required: "Senha é obrigatória",
                    minLength: {
                      value: 6,
                      message: "Senha deve ter no mínimo 6 caracteres",
                    },
                    validate: {
                      hasLetter: (value) =>
                        /[a-zA-Z]/.test(value) || "Senha deve conter pelo menos uma letra",
                      hasNumber: (value) =>
                        /[0-9]/.test(value) || "Senha deve conter pelo menos um número",
                      hasSpecial: (value) =>
                        /[@#$%!&*]/.test(value) || "Senha deve conter pelo menos um caractere especial (@#$%!&*)",
                    },
                  })}
                />
              </FormField>

              <FormField 
                label="Confirmar Senha" 
                required 
                error={errors.confirmPassword?.message}
              >
                <FormPasswordInput
                  placeholder="Confirme sua nova senha"
                  {...register("confirmPassword", {
                    required: "Confirmação de senha é obrigatória",
                    validate: (value) =>
                      value === password || "As senhas não coincidem",
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
                  {isSubmitting ? "Salvando..." : "Salvar Nova Senha"}
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
