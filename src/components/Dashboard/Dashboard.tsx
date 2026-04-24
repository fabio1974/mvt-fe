import React, { useState, useEffect } from "react";
import { getUserName, getUserRole, isClient } from "../../utils/auth";
import {
  FiPackage,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiMenu,
  FiArrowRight,
  FiPlus,
  FiShoppingBag,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import MobileAppBanner from "./MobileAppBanner";

/**
 * Dashboard - Página inicial para usuários logados
 * 
 * Orienta o usuário a utilizar o menu lateral para acessar as funcionalidades
 */
const Dashboard: React.FC = () => {
  const userName = getUserName();
  const userRole = getUserRole();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const canUseWizard = isClient() || userRole === "ROLE_CUSTOMER" || userRole === "CUSTOMER";

  // Detecta mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Traduz o role para exibição
  const getRoleLabel = (role: string | null): string => {
    switch (role) {
      case "ROLE_ADMIN":
        return "Administrador";
      case "ROLE_ORGANIZER":
        return "Líder de Grupo";
      case "ROLE_COURIER":
        return "Motoboy";
      case "ROLE_CLIENT":
      case "CLIENT":
        return "Estabelecimento";
      case "ROLE_CUSTOMER":
      case "CUSTOMER":
        return "Cliente";
      default:
        return "Usuário";
    }
  };

  // Quick actions baseadas no role do usuário
  const quickActions: { icon: React.ReactNode; label: string; description: string; color: string; highlight?: boolean; onClick: () => void }[] = [];

  // Nova Corrida (CLIENT/CUSTOMER) substitui o card de Corridas — sempre primeiro
  if (canUseWizard) {
    quickActions.push({
      icon: <FiPlus size={28} />,
      label: "Nova Corrida",
      description: "Crie uma nova corrida agora",
      color: "#3b82f6",
      highlight: true,
      onClick: () => navigate("/deliveries", { state: { openWizard: true } }),
    });
  } else {
    quickActions.push({
      icon: <FiPackage size={28} />,
      label: "Corridas",
      description: "Visualize e gerencie suas corridas",
      color: "#3b82f6",
      onClick: () => navigate("/deliveries"),
    });
  }

  // Pedidos (apenas CLIENT — Zapi-Food)
  if (userRole === "ROLE_CLIENT" || userRole === "CLIENT") {
    quickActions.push({
      icon: <FiShoppingBag size={28} />,
      label: "Pedidos",
      description: "Gerencie pedidos do Zapi-Food",
      color: "#f59e0b",
      onClick: () => navigate("/pedidos"),
    });
  }

  quickActions.push({
    icon: <FiDollarSign size={28} />,
    label: "Pagamentos",
    description: "Acompanhe seus pagamentos",
    color: "#06b6d4",
    onClick: () => navigate("/pagamentos"),
  });

  quickActions.push({
    icon: <FiUser size={28} />,
    label: "Dados Pessoais",
    description: "Atualize suas informações",
    color: "#8b5cf6",
    onClick: () => navigate("/dados-pessoais"),
  });

  quickActions.push({
    icon: <FiMapPin size={28} />,
    label: "Endereço",
    description: "Gerencie seu endereço",
    color: "#ef4444",
    onClick: () => navigate("/dados-endereco"),
  });

  return (
    <div
      style={{
        flex: 1,
        padding: "32px 24px",
        background: "var(--app-bg)",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      {/* Header de boas-vindas */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
              {/* Banner de app mobile - só aparece em dispositivos pequenos */}
        <MobileAppBanner userName={userName || undefined} />

        {/* Header azul de boas-vindas - oculto em mobile */}
        {!isMobile && (
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
            color: "white",
            boxShadow: "0 10px 40px rgba(59, 130, 246, 0.3)",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Olá, {userName || "Usuário"}! 👋
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.9,
              marginBottom: "4px",
            }}
          >
            Bem-vindo(a) ao Zapi10
          </p>
          <span
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {getRoleLabel(userRole)}
          </span>
        </div>
        )}

        {/* Card de orientação - oculto em mobile */}
        {!isMobile && (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: "16px",
            padding: "24px 32px",
            marginBottom: "32px",
            boxShadow: "var(--card-shadow)",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            border: "1px solid var(--card-border)",
          }}
        >
          <div
            style={{
              background: "var(--surface-inset)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiMenu size={32} color="#3b82f6" />
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--text-strong)",
                marginBottom: "8px",
              }}
            >
              Use o menu lateral para navegar
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              Todas as funcionalidades estão disponíveis no menu à esquerda.
              Clique nos itens para acessar corridas, pagamentos, dados pessoais
              e muito mais.
            </p>
          </div>
        </div>
        )}

        {/* Quick Actions - oculto em mobile */}
        {!isMobile && (
        <>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--text-label)",
            marginBottom: "16px",
          }}
        >
          Acesso Rápido
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              style={{
                background: action.highlight
                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  : "var(--card-bg)",
                border: action.highlight ? "none" : "1px solid var(--card-border)",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                boxShadow: action.highlight
                  ? "0 4px 14px rgba(59, 130, 246, 0.4)"
                  : "var(--card-shadow-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = action.highlight
                  ? "0 8px 24px rgba(59, 130, 246, 0.5)"
                  : "var(--card-shadow)";
                if (!action.highlight) e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = action.highlight
                  ? "0 4px 14px rgba(59, 130, 246, 0.4)"
                  : "var(--card-shadow-sm)";
                if (!action.highlight) e.currentTarget.style.borderColor = "var(--card-border)";
              }}
            >
              <div
                style={{
                  background: action.highlight ? "rgba(255,255,255,0.2)" : `${action.color}25`,
                  borderRadius: "10px",
                  padding: "12px",
                  color: action.highlight ? "white" : action.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {action.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: action.highlight ? "white" : "var(--text-strong)",
                    marginBottom: "4px",
                  }}
                >
                  {action.label}
                </h4>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: action.highlight ? "rgba(255,255,255,0.8)" : "var(--text-muted)",
                  }}
                >
                  {action.description}
                </p>
              </div>
              <FiArrowRight size={20} color={action.highlight ? "rgba(255,255,255,0.7)" : "#94a3b8"} />
            </button>
          ))}
        </div>
        </>
        )}

      </div>

    </div>
  );
};

export default Dashboard;
