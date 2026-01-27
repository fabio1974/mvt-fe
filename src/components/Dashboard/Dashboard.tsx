import React from "react";
import { getUserName, getUserRole } from "../../utils/auth";
import {
  FiPackage,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiMenu,
  FiArrowRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

/**
 * Dashboard - Página inicial para usuários logados
 * 
 * Orienta o usuário a utilizar o menu lateral para acessar as funcionalidades
 */
const Dashboard: React.FC = () => {
  const userName = getUserName();
  const userRole = getUserRole();
  const navigate = useNavigate();

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
  const getQuickActions = () => {
    const actions = [];

    // Entregas - disponível para todos
    actions.push({
      icon: <FiPackage size={28} />,
      label: "Entregas",
      description: "Visualize e gerencie suas entregas",
      path: "/deliveries",
      color: "#3b82f6",
    });

    // Pagamentos - disponível para todos
    actions.push({
      icon: <FiDollarSign size={28} />,
      label: "Pagamentos",
      description: "Acompanhe seus pagamentos",
      path: "/pagamentos",
      color: "#06b6d4",
    });

    // Dados pessoais - disponível para todos
    actions.push({
      icon: <FiUser size={28} />,
      label: "Dados Pessoais",
      description: "Atualize suas informações",
      path: "/dados-pessoais",
      color: "#8b5cf6",
    });

    // Endereço - disponível para todos
    actions.push({
      icon: <FiMapPin size={28} />,
      label: "Endereço",
      description: "Gerencie seu endereço",
      path: "/dados-endereco",
      color: "#ef4444",
    });

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div
      style={{
        flex: 1,
        padding: "32px 24px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
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

        {/* Card de orientação */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px 32px",
            marginBottom: "32px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
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
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Use o menu lateral para navegar
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              Todas as funcionalidades estão disponíveis no menu à esquerda.
              Clique nos itens para acessar entregas, pagamentos, dados pessoais
              e muito mais.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#475569",
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
              key={action.path}
              onClick={() => navigate(action.path)}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0, 0, 0, 0.04)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div
                style={{
                  background: `${action.color}15`,
                  borderRadius: "10px",
                  padding: "12px",
                  color: action.color,
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
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  {action.label}
                </h4>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                  }}
                >
                  {action.description}
                </p>
              </div>
              <FiArrowRight size={20} color="#94a3b8" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
