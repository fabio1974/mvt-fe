import { useNavigate } from "react-router-dom";
import React from "react";
import { getUserName, getUserRole } from "../../utils/auth";
import "./Sidebar.css";

const menuItems = [
  {
    label: "Meus eventos",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4h16v16H4V4z"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/meus-eventos",
  },
  {
    label: "Criar evento",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5v14M5 12h14"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/criar-evento",
  },
  {
    label: "Organização",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 21h18M5 21V7l8-4v18M19 21v-5h-6v5"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/organizacao",
  },
  {
    label: "Minhas inscrições",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 12h8"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/inscricoes",
  },
  {
    label: "Favoritos",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/favoritos",
  },
  {
    label: "Dados pessoais",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 20v-1a7 7 0 0114 0v1"
          stroke="#0099ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "/dados-pessoais",
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ collapsed, setCollapsed, isMobile = false, visible = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  // Get user name from JWT token
  const userName = getUserName() || "";
  const userRole = getUserRole();

  // Filtrar itens do menu baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter((item) => {
    // Menus exclusivos para organizadores e admins
    if (
      item.label === "Criar evento" ||
      item.label === "Meus eventos" ||
      item.label === "Organização"
    ) {
      return userRole === "ROLE_ORGANIZER" || userRole === "ROLE_ADMIN";
    }
    return true;
  });

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && visible && (
        <div 
          className={`sidebar-overlay ${visible ? 'visible' : ''}`}
          onClick={onClose}
        />
      )}
      
      <aside className={`sidebar${collapsed ? " collapsed" : ""}${isMobile && visible ? " mobile-visible" : ""}`}>
      <div className="sidebar-header">
        <img src="/vite.svg" alt="Logo" className="sidebar-logo" />
        {!collapsed && <span className="sidebar-site-name">{userName}</span>}
      </div>
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="sidebar-menu-item"
          >
            {item.icon}
            {!collapsed && (
              <span className="sidebar-menu-label">{item.label}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => {
            localStorage.removeItem("authToken");
            navigate("/login");
            window.location.reload();
          }}
          className="sidebar-menu-item"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 17l-5-5 5-5"
              stroke="#0099ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 12H9"
              stroke="#0099ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!collapsed && <span className="sidebar-menu-label">Sair</span>}
        </button>
      </nav>
      <div className={`sidebar-footer${collapsed ? " collapsed" : ""}`}>
        <span
          className="sidebar-close-btn"
          title="Fechar menu"
          onClick={() => {
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8L20 16L12 24"
                stroke="#0099ff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 8L12 16L20 24"
                stroke="#0099ff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>
    </aside>
    </>
  );
}
