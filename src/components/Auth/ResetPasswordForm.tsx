import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function ResetPasswordForm() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        username,
        newPassword,
      });

      setSuccess("Senha alterada com sucesso! Redirecionando para o login...");

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      interface ApiError {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      const errorMessage =
        (err as ApiError)?.response?.data?.message ||
        "Erro ao alterar senha. Verifique se o email existe e tente novamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginBottom: 16,
          color: "#333",
          fontSize: "1.2rem",
        }}
      >
        Recuperar Senha
      </h3>
      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: 20,
          fontSize: "0.9rem",
        }}
      >
        Digite seu e-mail e defina uma nova senha para sua conta.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
          E-mail *
          <input
            type="email"
            placeholder="Digite seu e-mail"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
          Nova Senha *
          <input
            type="password"
            placeholder="Digite sua nova senha"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
          Confirmar Nova Senha *
          <input
            type="password"
            placeholder="Confirme sua nova senha"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            background: "#ff9900",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: 24,
            padding: "14px 0",
            fontSize: "1.1rem",
            marginTop: 8,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#e68900";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#ff9900";
            }
          }}
        >
          {loading ? "Alterando senha..." : "Alterar Senha"}
        </button>
      </form>

      {error && (
        <div
          style={{ color: "#dc3545", textAlign: "center", fontSize: "0.9rem" }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{ color: "#28a745", textAlign: "center", fontSize: "0.9rem" }}
        >
          {success}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "#0099ff",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
