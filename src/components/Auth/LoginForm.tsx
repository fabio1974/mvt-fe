import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.post<{ token: string }>("/auth/login", {
        username,
        password,
      });
      // Supondo que o token venha em response.data.token
      if (response.data && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        setSuccess("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/");
          window.location.reload(); // recarrega para atualizar estado global
        }, 1000);
      } else {
        setError("Token não recebido. Verifique a resposta da API.");
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Erro ao fazer login."
        );
      } else {
        setError("Erro ao fazer login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      style={{
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
      onSubmit={handleSubmit}
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
          }}
        />
      </label>
      <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
        Senha *
        <input
          type="password"
          placeholder="Digite sua senha"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 4,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
      </label>
      <button
        type="submit"
        style={{
          background: "#2ecc40",
          color: "#fff",
          fontWeight: 600,
          border: "none",
          borderRadius: 24,
          padding: "14px 0",
          fontSize: "1.1rem",
          marginTop: 8,
          cursor: "pointer",
        }}
        disabled={loading}
      >
        {loading ? "Enviando..." : "Acessar conta"}
      </button>
      {error && (
        <div style={{ color: "#e74c3c", textAlign: "left" }}>{error}</div>
      )}
      {success && (
        <div style={{ color: "#2ecc40", textAlign: "left" }}>{success}</div>
      )}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        Esqueceu sua senha?{" "}
        <a href="/recuperar-senha" style={{ color: "#ff9900" }}>
          Clique aqui.
        </a>
      </div>
    </form>
  );
}
