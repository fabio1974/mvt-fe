import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { getUserName, getUserRole, isAdmin } from "../../utils/auth";
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
  sidebarVisible,
  sidebarCollapsed,
}: HeaderProps = {}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
      case "ROLE_CLIENT":
      case "CLIENT":
      case "ROLE_CUSTOMER":
      case "CUSTOMER":
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Botões de ação */}
          <div className="actions modern-actions">
            {!isLoggedIn && (
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto", marginRight: "16px" }}>
            {/* Dropdown do usuário */}
            <div style={{ position: "relative" }}>
            <div
              className="user-info-button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                backgroundColor: "#3b82f6",
                borderRadius: 24,
                border: "1px solid #2563eb",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
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
                  className="user-name"
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
                  className="user-role"
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

              {/* Ícone de seta */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transition: "transform 0.2s ease",
                  transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                    minWidth: 220,
                    zIndex: 1000,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 0",
                    }}
                  >
                    <button
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: "0.95rem",
                        color: "#374151",
                        transition: "background-color 0.15s ease",
                      }}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/dados-pessoais");
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="7"
                          r="4"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Dados Pessoais</span>
                    </button>
                    
                    {/* Separador */}
                    <div
                      style={{
                        height: 1,
                        backgroundColor: "#e5e7eb",
                        margin: "4px 0",
                      }}
                    />
                    
                    {/* Botão Sair */}
                    <button
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: "0.95rem",
                        color: "#dc2626",
                        transition: "background-color 0.15s ease",
                      }}
                      onClick={() => {
                        setUserMenuOpen(false);
                        localStorage.removeItem("authToken");
                        navigate("/login");
                        window.location.reload();
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="16,17 21,12 16,7"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="21"
                          y1="12"
                          x2="9"
                          y2="12"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
            
            {/* Botão de Configurações - Apenas para ADMIN */}
            {isAdmin() && (
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/configuracoes")}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              aria-label="Configurações"
            >
              <FiSettings size={28} color="#64748b" />
            </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
