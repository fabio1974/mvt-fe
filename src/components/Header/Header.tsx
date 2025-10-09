import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserName, getUserRole } from "../../utils/auth";
import "./Header.css";

interface HeaderProps {
  isMobile?: boolean;
  isLoggedIn?: boolean;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
  sidebarCollapsed?: boolean;
}

export default function Header({
  isMobile: propIsMobile,
  isLoggedIn: propIsLoggedIn,
  onToggleSidebar,
  sidebarVisible,
  sidebarCollapsed,
}: HeaderProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = propIsMobile ?? window.innerWidth <= 600;

  // Informações do usuário logado
  const isLoggedIn =
    propIsLoggedIn ?? Boolean(localStorage.getItem("authToken"));
  const userName = getUserName();
  const userRole = getUserRole();

  // Determinar classes do header baseado no sidebar
  const headerClasses = [
    "serra-header",
    "modern",
    sidebarVisible && !isMobile ? "with-sidebar" : "",
    sidebarCollapsed && !isMobile ? "sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Função para retornar ícone baseado no tipo de usuário
  const getUserIcon = (role: string | null) => {
    switch (role) {
      case "ROLE_ADMIN":
      case "ROLE_ORGANIZER":
        // Ícone de usuário para organizadores e admins
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#0099ff" }}
          >
            <circle
              cx="12"
              cy="8"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20v-1a7 7 0 0114 0v1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "ROLE_USER":
        // Ícone de atleta (pessoa correndo)
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#0099ff" }}
          >
            <circle cx="12" cy="4" r="2" fill="currentColor" />
            <path
              d="M10.5 7.5L9 9l3 7 2-1-1.5-4.5L15 12l2-1-2.5-2.5-1.5-1z"
              fill="currentColor"
            />
            <path d="M7 21l2-4 1.5 1L9 21z" fill="currentColor" />
            <path d="M17 21l-2-4-1.5 1L15 21z" fill="currentColor" />
          </svg>
        );
      default:
        // Ícone padrão
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#0099ff" }}
          >
            <circle
              cx="12"
              cy="8"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20v-1a7 7 0 0114 0v1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };
  return (
    <header className={headerClasses}>
      <div className="header-container modern-inner">
        {/* Toggle do sidebar para mobile */}
        {isMobile && isLoggedIn && (
          <button
            onClick={onToggleSidebar}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              background: sidebarVisible ? "#f0f8ff" : "#fff",
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "16px",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              if (!sidebarVisible) {
                e.currentTarget.style.background = "#f8f9fa";
                e.currentTarget.style.borderColor = "#0099ff";
              }
            }}
            onMouseLeave={(e) => {
              if (!sidebarVisible) {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#e9ecef";
              }
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="2"
                fill={sidebarVisible ? "#0099ff" : "#6b7280"}
                rx="1"
              />
              <rect
                x="3"
                y="11"
                width="18"
                height="2"
                fill={sidebarVisible ? "#0099ff" : "#6b7280"}
                rx="1"
              />
              <rect
                x="3"
                y="16"
                width="18"
                height="2"
                fill={sidebarVisible ? "#0099ff" : "#6b7280"}
                rx="1"
              />
            </svg>
          </button>
        )}

        <a href="/" className="logo modern-brand">
          <div className="brand-logo-wrapper">
            <img src="/vite.svg" alt="Corridas da Serra" />
          </div>
          <div className="brand-text-block">
            <span className="brand-title">Corridas da Serra</span>
            <span className="brand-sub">Eventos Esportivos</span>
          </div>
        </a>
        <nav className={`nav modern-nav ${menuOpen ? "open" : ""}`}>
          <a href="/eventos">Eventos</a>
          <a href="/contato">Contato</a>
        </nav>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Botões de ação */}
          <div className="actions modern-actions">
            {!isMobile && !isLoggedIn && (
              <button
                className="btn header-ghost"
                onClick={() => navigate("/login")}
              >
                Entrar
              </button>
            )}
            {!isLoggedIn && (
              <a href="/login" className="btn header-cta">
                Inscrever-se
              </a>
            )}
          </div>
        </div>

        {/* Informações do usuário logado - sempre na extrema direita */}
        {isLoggedIn && userName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              backgroundColor: "#f8f9fa",
              borderRadius: 20,
              border: "1px solid #e9ecef",
              marginLeft: "auto", // Empurra para a direita
              marginRight: "16px", // Espaço entre o usuário e o botão menu
            }}
          >
            {/* Ícone de usuário */}
            {/* Nome do usuário */}
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#333",
              }}
            >
              {userName}
            </span>

            {/* Ícone baseado no tipo de usuário */}
            {getUserIcon(userRole)}
          </div>
        )}

        <button
          className={`menu-toggle modern ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="5" r="2" fill="#0099ff" />
            <circle cx="12" cy="12" r="2" fill="#0099ff" />
            <circle cx="12" cy="19" r="2" fill="#0099ff" />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="mobile-menu modern-mobile">
          {isLoggedIn ? (
            <button
              className="btn logout-btn"
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("organizationId");
                setMenuOpen(false);
                navigate("/");
                window.location.reload();
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: "8px" }}
              >
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="16 17 21 12 16 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="21"
                  y1="12"
                  x2="9"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sair
            </button>
          ) : (
            <>
              <a href="/eventos" onClick={() => setMenuOpen(false)}>
                Eventos
              </a>
              <a href="/contato" onClick={() => setMenuOpen(false)}>
                Contato
              </a>
              <button
                className="btn header-ghost"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
              >
                Entrar
              </button>
              <a href="/login" className="btn header-cta mobile">
                Inscrever-se
              </a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
