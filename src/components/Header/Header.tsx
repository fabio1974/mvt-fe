import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <header className="serra-header">
      <div className="header-container">
        <a
          href="/"
          className="logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <img src="/vite.svg" alt="Corridas da Serra" />
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.3rem",
              color: "#0099ff",
              fontFamily: "Inter, Arial, sans-serif",
            }}
          >
            Corridas da Serra
          </span>
        </a>
        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <a href="/eventos">Encontrar Competições</a>
          <a href="/organizar-evento-esportivo">Materiais gratuitos</a>
          <a href="/blog">Blog</a>
        </nav>
        <div className="actions" style={{ display: "flex", gap: 12 }}>
          <a href="#" className="btn primary">
            Criar evento
          </a>
          <button
            className="btn secondary"
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
            }}
            onClick={() => navigate("/login")}
          >
            Acessar conta
          </button>
        </div>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>
      {menuOpen && (
        <div className="mobile-menu">
          <a href="/eventos" onClick={() => setMenuOpen(false)}>
            Encontrar Competições
          </a>
          <a
            href="/organizar-evento-esportivo"
            onClick={() => setMenuOpen(false)}
          >
            Materiais gratuitos
          </a>
          <a href="/blog" onClick={() => setMenuOpen(false)}>
            Blog
          </a>
          <a
            href="#"
            className="btn primary"
            onClick={() => setMenuOpen(false)}
          >
            Criar evento
          </a>
          <button
            className="btn secondary"
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
            }}
            onClick={() => {
              setMenuOpen(false);
              navigate("/login");
            }}
          >
            Acessar conta
          </button>
        </div>
      )}
    </header>
  );
}
