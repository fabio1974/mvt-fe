import { useNavigate, useLocation } from "react-router-dom";
import React, { useState } from "react";
import { getUserRole } from "../../utils/auth";
import LOGO_PATH from "../../config/logo";
import {
  FiPlus,
  FiSettings,
  FiUser,
  FiBriefcase,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
} from "react-icons/fi";
import "./Sidebar.css";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

interface MenuGroup {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  roles?: string[];
}

// Itens de menu organizados por grupos
const menuStructure: (MenuItem | MenuGroup)[] = [
  // Grupo: Meus Dados
  {
    label: "Meus Dados",
    icon: <FiUser size={22} color="#0099ff" />,
    items: [
      {
        label: "Dados Pessoais",
        icon: <FiUser size={20} color="#60a5fa" />,
        path: "/dados-pessoais",
      },
      {
        label: "Organização",
        icon: <FiSettings size={20} color="#60a5fa" />,
        path: "/organizacao",
        roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
      },
    ].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
  },
  // Itens de primeiro nível (ordem alfabética)
  {
    label: "Gerenciar Eventos",
    icon: <FiPlus size={22} color="#60a5fa" />,
    path: "/eventos",
    roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
  },
  {
    label: "Grupos",
    icon: <FiBriefcase size={22} color="#60a5fa" />,
    path: "/organizacao/gerenciar",
    roles: ["ROLE_ADMIN"],
  },
].sort((a, b) => {
  // Mantém "Meus Dados" no topo, resto em ordem alfabética
  if ("items" in a && a.label === "Meus Dados") return -1;
  if ("items" in b && b.label === "Meus Dados") return 1;
  return a.label.localeCompare(b.label, "pt-BR");
});

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
  const location = useLocation();
  const userRole = getUserRole();

  // Estado para controlar grupos expandidos
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set() // Todos os grupos collapsed por padrão
  );

  // Verifica se item tem permissão
  const hasPermission = (item: MenuItem | MenuGroup): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole || "");
  };

  // Verifica se grupo tem pelo menos um item com permissão
  const groupHasVisibleItems = (group: MenuGroup): boolean => {
    return group.items.some((item) => hasPermission(item));
  };

  // Toggle grupo expandido
  const toggleGroup = (groupLabel: string) => {
    if (collapsed) {
      // Se sidebar está colapsado, expande ao clicar
      setCollapsed(false);
    }

    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      return newSet;
    });
  };

  // Verifica se caminho está ativo
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // Renderiza item de menu
  const renderMenuItem = (item: MenuItem, isSubItem = false) => {
    if (!hasPermission(item)) return null;

    return (
      <button
        key={item.path}
        onClick={() => {
          navigate(item.path);
          if (isMobile && onClose) onClose();
        }}
        className={`sidebar-menu-item${isSubItem ? " sidebar-sub-item" : ""}${
          isActive(item.path) ? " active" : ""
        }`}
        data-item={item.label}
      >
        {item.icon}
        {!collapsed && <span className="sidebar-menu-label">{item.label}</span>}
      </button>
    );
  };

  // Renderiza grupo de menu
  const renderMenuGroup = (group: MenuGroup) => {
    if (!hasPermission(group) || !groupHasVisibleItems(group)) return null;

    const isExpanded = expandedGroups.has(group.label);

    return (
      <div key={group.label} className="sidebar-menu-group">
        <button
          onClick={() => toggleGroup(group.label)}
          className="sidebar-menu-item sidebar-group-header"
        >
          {group.icon}
          {!collapsed && (
            <>
              <span className="sidebar-menu-label">{group.label}</span>
              {isExpanded ? (
                <FiChevronDown className="sidebar-group-chevron" />
              ) : (
                <FiChevronRight className="sidebar-group-chevron" />
              )}
            </>
          )}
        </button>
        {isExpanded && !collapsed && (
          <div className="sidebar-sub-items">
            {group.items.map((item) => renderMenuItem(item, true))}
          </div>
        )}
      </div>
    );
  };

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
          <img src={LOGO_PATH} alt="Logo" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          {menuStructure.map((item) => {
            if ("items" in item) {
              // É um grupo
              return renderMenuGroup(item);
            } else {
              // É um item simples
              return renderMenuItem(item);
            }
          })}

          {/* Separador antes do logout */}
          <div className="sidebar-menu-separator"></div>

          {/* Botão Sair - último item do menu */}
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              navigate("/login");
              window.location.reload();
            }}
            className="sidebar-menu-item sidebar-logout"
          >
            <FiLogOut size={22} color="#dc2626" />
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
