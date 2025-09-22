import React, { useState } from "react";
import { api } from "../../services/api";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });
      setSuccess("Usuário registrado com sucesso!");
    } catch (err) {
      setError("Erro ao registrar usuário.");
      console.error(err);
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
        gap: 16,
      }}
      onSubmit={handleSubmit}
    >
      <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
        Nome *
        <input
          type="text"
          placeholder="Digite seu primeiro nome"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 4,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
      </label>
      {/* ...other fields as before, omitted for brevity... */}
      <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
        E-mail *
        <input
          type="email"
          placeholder="Digite seu e-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
      {/* ...other fields as before, omitted for brevity... */}
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
        {loading ? "Enviando..." : "Cadastrar"}
      </button>
      {error && (
        <div style={{ color: "#e74c3c", textAlign: "left" }}>{error}</div>
      )}
      {success && (
        <div style={{ color: "#2ecc40", textAlign: "left" }}>{success}</div>
      )}
    </form>
  );
}
