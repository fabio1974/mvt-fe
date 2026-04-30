import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { getUserRole, getUserId } from "../../utils/auth";
import { api } from "../../services/api";
import LOGO_PATH from "../../config/logo";
import {
  FiSettings,
  FiBriefcase,
  FiChevronDown,
  FiChevronRight,
  FiTruck,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiMapPin,
  FiUsers,
  FiCreditCard,
  FiTrendingUp,
  FiHome,
  FiGrid,
  FiBarChart2,
  FiFileText,
  FiInbox,
  FiAlertCircle,
  FiBell,
  FiMessageSquare,
  FiSmartphone,
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
  // Início - visível para todos
  {
    label: "Início",
    icon: <FiHome size={22} color="#60a5fa" />,
    path: "/",
  },
  // Grupo - promovido para menu principal (apenas ORGANIZER)
  {
    label: "Grupo",
    icon: <FiSettings size={22} color="#60a5fa" />,
    path: "/organizacao",
    roles: ["ROLE_ORGANIZER"],
  },
  // Itens de primeiro nível (ordem alfabética)
  {
    label: "Corridas",
    icon: <FiPackage size={22} color="#60a5fa" />,
    path: "/deliveries",
    roles: ["ROLE_ADMIN", "ROLE_ORGANIZER", "ROLE_COURIER", "ROLE_CLIENT", "CLIENT", "ROLE_CUSTOMER", "CUSTOMER"],
  },
  // Grupo Pessoas (apenas ADMIN)
  {
    label: "Pessoas",
    icon: <FiUsers size={22} color="#60a5fa" />,
    roles: ["ROLE_ADMIN"],
    items: [
      {
        label: "Clientes",
        icon: <FiShoppingBag size={22} color="#60a5fa" />,
        path: "/estabelecimentos",
        roles: ["ROLE_ADMIN"],
      },
      {
        label: "Gerentes",
        icon: <FiUsers size={22} color="#8b5cf6" />,
        path: "/gerentes",
        roles: ["ROLE_ADMIN"],
      },
      {
        label: "Grupos",
        icon: <FiBriefcase size={22} color="#60a5fa" />,
        path: "/organizacao/gerenciar",
        roles: ["ROLE_ADMIN"],
      },
      {
        label: "Motoboy",
        icon: <FiTruck size={22} color="#60a5fa" />,
        path: "/motoboy",
        roles: ["ROLE_ADMIN"],
      },
    ],
  },
  {
    label: "Pedidos",
    icon: <FiShoppingBag size={22} color="#f59e0b" />,
    path: "/pedidos",
    roles: ["ROLE_ADMIN", "ROLE_CLIENT", "CLIENT"],
  },
  {
    label: "Caixa/Mesas",
    icon: <FiInbox size={22} color="#16a34a" />,
    roles: ["ROLE_CLIENT", "CLIENT"],
    items: [
      {
        label: "Caixa",
        icon: <FiInbox size={22} color="#16a34a" />,
        path: "/caixa",
        roles: ["ROLE_CLIENT", "CLIENT"],
      },
      {
        label: "Mesas",
        icon: <FiGrid size={22} color="#8b5cf6" />,
        path: "/mesas",
        roles: ["ROLE_CLIENT", "CLIENT"],
      },
      {
        label: "Relatório de Caixa",
        icon: <FiFileText size={22} color="#10b981" />,
        path: "/relatorios/caixa",
        roles: ["ROLE_CLIENT", "CLIENT"],
      },
    ],
  },
  {
    label: "Pagamentos",
    icon: <FiDollarSign size={22} color="#06b6d4" />,
    path: "/pagamentos",
    roles: ["ROLE_ADMIN", "ROLE_ORGANIZER", "ROLE_COURIER", "ROLE_CLIENT", "CLIENT", "ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Balanço Financeiro",
    icon: <FiDollarSign size={22} color="#10b981" />,
    path: "/balanco-financeiro",
    roles: ["ROLE_ORGANIZER", "ORGANIZER"],
  },
  {
    label: "Meus Ganhos",
    icon: <FiTrendingUp size={22} color="#10b981" />,
    path: "/meus-ganhos",
    roles: ["ROLE_COURIER", "COURIER"],
  },
  {
    label: "Minha Carteira",
    icon: <FiCreditCard size={22} color="#6366f1" />,
    path: "/minha-carteira",
    roles: ["ROLE_COURIER", "COURIER"],
  },
  {
    label: "Dados Bancários",
    icon: <FiCreditCard size={22} color="#f59e0b" />,
    path: "/dados-bancarios",
    roles: ["ROLE_COURIER", "COURIER", "ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Meus Cartões",
    icon: <FiCreditCard size={22} color="#8b5cf6" />,
    path: "/meus-cartoes",
    roles: ["ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Preferências de Pagamento",
    icon: <FiSettings size={22} color="#06b6d4" />,
    path: "/preferencias-pagamento",
    roles: ["ROLE_CUSTOMER", "CUSTOMER"],
  },
  {
    label: "Processar Pagamentos",
    icon: <FiDollarSign size={22} color="#8b5cf6" />,
    path: "/processar-pagamentos",
    roles: ["ROLE_ADMIN"],
  },
  {
    label: "Repasses",
    icon: <FiAlertCircle size={22} color="#f97316" />,
    path: "/repasses",
    roles: ["ROLE_ADMIN"],
  },
  {
    label: "Zonas Especiais",
    icon: <FiMapPin size={22} color="#ef4444" />,
    path: "/zonas-especiais",
    roles: ["ROLE_ADMIN"],
  },
  {
    label: "Anúncios",
    icon: <FiBell size={22} color="#3b82f6" />,
    path: "/anuncios",
    roles: ["ROLE_ADMIN"],
  },
  {
    label: "Versões Mobile",
    icon: <FiSmartphone size={22} color="#06b6d4" />,
    path: "/versoes-mobile",
    roles: ["ROLE_ADMIN"],
  },
  // Fale Conosco / Suporte — visível pra todos os roles autenticados
  {
    label: "Fale Conosco",
    icon: <FiMessageSquare size={22} color="#3b82f6" />,
    path: "/suporte",
  },
].sort((a, b) => {
  // "Início" sempre no topo absoluto
  if (a.label === "Início") return -1;
  if (b.label === "Início") return 1;
  // "Pessoas" sempre em segundo
  if (a.label === "Pessoas") return -1;
  if (b.label === "Pessoas") return 1;
  // Resto em ordem alfabética
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
  const [tableOrdersEnabled, setTableOrdersEnabled] = useState(false);

  // Buscar store profile do CLIENT para saber se módulo de mesas está ativo
  useEffect(() => {
    if (userRole === "ROLE_CLIENT" || userRole === "CLIENT") {
      const userId = getUserId();
      if (userId) {
        api.get(`/api/users/${userId}`)
          .then((res) => {
            setTableOrdersEnabled(Boolean((res.data as any)?.storeProfile?.tableOrdersEnabled));
          })
          .catch(() => {});
      }
    }
  }, [userRole]);

  // Estado para controlar grupos expandidos
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set() // Todos os grupos collapsed por padrão
  );

  // Verifica se item tem permissão
  const hasPermission = (item: MenuItem | MenuGroup): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!item.roles.includes(userRole || "")) return false;
    // "Mesas" só aparece se tableOrdersEnabled
    if ("path" in item && item.path === "/mesas" && !tableOrdersEnabled) return false;
    // "Caixa" só aparece se tableOrdersEnabled
    if ("path" in item && item.path === "/caixa" && !tableOrdersEnabled) return false;
    // "Relatórios" e seus subitens só aparecem se tableOrdersEnabled
    if (item.label === "Relatórios" && !tableOrdersEnabled) return false;
    if ("path" in item && item.path.startsWith("/relatorios") && !tableOrdersEnabled) return false;
    return true;
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
                  stroke="currentColor"
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
                  stroke="currentColor"
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
