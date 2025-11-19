import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserName, getUserRole } from "../../utils/auth";
import LOGO_PATH from "../../config/logo";
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
    isLoggedIn ? "theme-light" : "theme-dark",
    sidebarVisible && !isMobile ? "with-sidebar" : "",
    sidebarCollapsed && !isMobile ? "sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Função para traduzir o role do usuário
  const getRoleTranslation = (role: string | null): string => {
    switch (role) {
      case "ROLE_ADMIN":
        return "Admin";
      case "ROLE_ORGANIZER":
        return "Gerente";
      case "ROLE_COURIER":
      case "ROLE_MOTOBOY":
        return "Motoboy";
      case "ROLE_USER":
        return "Cliente";
      default:
        return "Usuário";
    }
  };

  // Função para retornar ícone baseado no tipo de usuário
  const getUserIcon = (role: string | null) => {
    switch (role) {
      case "ROLE_ADMIN":
      case "ROLE_ORGANIZER":
        // Ícone de usuário para organizadores e admins
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#ffffff" }}
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
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#ffffff" }}
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
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#ffffff" }}
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
              background: sidebarVisible
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "16px",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!sidebarVisible) {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                e.currentTarget.style.borderColor = "#3b82f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!sidebarVisible) {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
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
                fill={sidebarVisible ? "#3b82f6" : "#60a5fa"}
                rx="1"
              />
              <rect
                x="3"
                y="11"
                width="18"
                height="2"
                fill={sidebarVisible ? "#3b82f6" : "#60a5fa"}
                rx="1"
              />
              <rect
                x="3"
                y="16"
                width="18"
                height="2"
                fill={sidebarVisible ? "#3b82f6" : "#60a5fa"}
                rx="1"
              />
            </svg>
          </button>
        )}

        <a href="/" className="logo modern-brand">
          {/* Logo PNG fica oculto quando o usuário está logado */}
          <div
            className={`brand-logo-wrapper ${isLoggedIn ? "hidden-logo" : ""}`}
          >
            <img src={LOGO_PATH} alt="Zapi10" />
          </div>
          <div
            className="brand-text-block"
            style={{ alignItems: "flex-start" }}
          >
            <span className="brand-title">Zapi10</span>
            <span className="brand-sub">Mobilidade com propósito social</span>
          </div>
        </a>
        <nav className={`nav modern-nav ${menuOpen ? "open" : ""}`}>
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
          </div>
        </div>

        {/* Informações do usuário logado - sempre na extrema direita */}
        {isLoggedIn && userName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              backgroundColor: "#3b82f6",
              borderRadius: 24,
              border: "1px solid #2563eb",
              marginLeft: "auto", // Empurra para a direita
              marginRight: "16px", // Espaço entre o usuário e o botão menu
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
            }}
          >
            {/* Ícone baseado no tipo de usuário */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {getUserIcon(userRole)}
            </div>
            
            {/* Nome e tipo do usuário */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  lineHeight: 1.2,
                }}
              >
                {userName}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  color: "rgba(255, 255, 255, 0.8)",
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                {getRoleTranslation(userRole)}
              </span>
            </div>
          </div>
        )}

        {isMobile && (
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
              <circle cx="12" cy="5" r="2" fill="#60a5fa" />
              <circle cx="12" cy="12" r="2" fill="#60a5fa" />
              <circle cx="12" cy="19" r="2" fill="#60a5fa" />
            </svg>
          </button>
        )}
      </div>
      {menuOpen && (
        <>
          {/* Overlay de fundo escuro */}
          <div
            className="mobile-menu-overlay"
            onClick={() => setMenuOpen(false)}
          ></div>

          <div
            className={`mobile-menu modern-mobile ${menuOpen ? "open" : ""}`}
          >
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
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
