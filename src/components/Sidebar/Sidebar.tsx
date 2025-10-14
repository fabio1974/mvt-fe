import { useNavigate } from "react-router-dom";
import React from "react";
import { getUserRole } from "../../utils/auth";
import {
  FiCalendar,
  FiPlus,
  FiSettings,
  FiBookmark,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import "./Sidebar.css";

const menuItems = [
  {
    label: "Meus eventos",
    icon: <FiCalendar size={22} color="#0099ff" />,
    path: "/meus-eventos",
  },
  {
    label: "Gerenciar Eventos",
    icon: <FiPlus size={22} color="#0099ff" />,
    path: "/eventos",
  },
  {
    label: "Inscrições",
    icon: <FiUsers size={22} color="#0099ff" />,
    path: "/organizacao/inscricoes",
  },
  {
    label: "Organização",
    icon: <FiSettings size={22} color="#0099ff" />,
    path: "/organizacao",
  },
  {
    label: "Minhas inscrições",
    icon: <FiBookmark size={22} color="#0099ff" />,
    path: "/minhas-inscricoes",
  },
  {
    label: "Dados pessoais",
    icon: <FiUser size={22} color="#0099ff" />,
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

export default function Sidebar({
  collapsed,
  setCollapsed,
  isMobile = false,
  visible = true,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  // Get user role from JWT token
  const userRole = getUserRole();

  // Filtrar itens do menu baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter((item) => {
    // Menus exclusivos para organizadores e admins
    if (
      item.label === "Criar evento" ||
      item.label === "Meus eventos" ||
      item.label === "Organização" ||
      item.label === "Inscrições"
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
          className={`sidebar-overlay ${visible ? "visible" : ""}`}
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar${collapsed ? " collapsed" : ""}${
          isMobile && visible ? " mobile-visible" : ""
        }`}
      >
        <div className="sidebar-header">
          <img src="/vite.svg" alt="Logo" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="sidebar-menu-item"
              data-item={item.label}
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
