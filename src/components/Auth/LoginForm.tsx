import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const navigate = useNavigate();
  return (
    <form
      style={{
        maxWidth: 400,
        margin: "0 auto",
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
      >
        Acessar conta
      </button>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        Esqueceu sua senha?{" "}
        <a href="#" style={{ color: "#ff9900" }}>
          Clique aqui.
        </a>
      </div>
    </form>
  );
}
