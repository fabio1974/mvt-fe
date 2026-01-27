import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

// Tipos de usuário para o wizard
type UserTypeOption = {
  value: string;
  label: string;
  description: string;
  icon: string;
};

const USER_TYPE_OPTIONS: UserTypeOption[] = [
  {
    value: "CUSTOMER",
    label: "Cliente Pessoa Física",
    description: "Quero solicitar entregas para uso pessoal",
    icon: "👤",
  },
  {
    value: "CLIENT",
    label: "Estabelecimento Comercial",
    description: "Tenho um negócio e preciso de entregas para meus clientes",
    icon: "🏪",
  },
  {
    value: "COURIER",
    label: "Motoboy / Entregador",
    description: "Quero trabalhar como entregador na plataforma",
    icon: "🏍️",
  },
  {
    value: "ORGANIZER",
    label: "Líder de Associação",
    description: "Represento uma associação de motoboys",
    icon: "👥",
  },
];

export default function AuthTabs() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const preselectedRole = searchParams.get("role") || undefined;
  const lockRole = searchParams.get("lockRole") === "true";
  
  const [activeView, setActiveView] = useState<"login" | "register">(initialTab);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(preselectedRole || "");
  const [isRoleLocked, setIsRoleLocked] = useState(lockRole);
  
  useEffect(() => {
    // Atualiza a view quando os search params mudam
    if (searchParams.get("tab") === "register") {
      // Se veio com role, vai direto pro cadastro
      if (preselectedRole) {
        setSelectedRole(preselectedRole);
        setIsRoleLocked(lockRole);
        setActiveView("register");
      } else {
        // Se veio pra register sem role, abre o wizard
        setShowWizard(true);
      }
    }
  }, [searchParams, preselectedRole, lockRole]);

  // Handler para clicar em "Ainda não estou cadastrado"
  const handleNotRegisteredClick = () => {
    setShowWizard(true);
  };

  // Handler para confirmar seleção no wizard
  const handleConfirmRole = () => {
    if (selectedRole) {
      setIsRoleLocked(true);
      setShowWizard(false);
      setActiveView("register");
    }
  };

  // Handler para fechar o wizard
  const handleCloseWizard = () => {
    setShowWizard(false);
    setSelectedRole("");
  };

  // Handler para voltar ao login
  const handleBackToLogin = () => {
    setActiveView("login");
    setSelectedRole("");
    setIsRoleLocked(false);
  };

  // Modal styles
  const modalStyles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: "1rem",
      maxWidth: "500px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "auto",
      position: "relative",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },
    header: {
      padding: "1.5rem",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#111827",
      margin: 0,
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
    },
    body: {
      padding: "1.5rem",
    },
    question: {
      fontSize: "1.125rem",
      color: "#374151",
      marginBottom: "1.5rem",
      textAlign: "center",
    },
    optionsList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    optionButton: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#f9fafb",
      border: "2px solid #e5e7eb",
      borderRadius: "0.75rem",
      cursor: "pointer",
      transition: "all 0.2s",
      textAlign: "left",
    },
    optionButtonSelected: {
      backgroundColor: "#eff6ff",
      borderColor: "#3b82f6",
    },
    optionIcon: {
      fontSize: "1.75rem",
      width: "48px",
      height: "48px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
      borderRadius: "0.5rem",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#111827",
      marginBottom: "0.25rem",
    },
    optionDescription: {
      fontSize: "0.875rem",
      color: "#6b7280",
    },
    continueButton: {
      marginTop: "1.5rem",
      width: "100%",
      padding: "0.875rem",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    continueButtonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed",
    },
  };

  // Link styles
  const linkStyles: React.CSSProperties = {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.95rem",
    color: "#6b7280",
  };

  const linkButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "0.95rem",
    padding: 0,
  };
  
  return (
    <div className="auth-panel">
      {activeView === "login" ? (
        <>
          <div className="auth-tabs">
            <div className="auth-tab active" style={{ cursor: "default", flex: 1 }}>
              ACESSAR CONTA
            </div>
          </div>
          <LoginForm />
          <div style={linkStyles}>
            Ainda não está cadastrado?{" "}
            <button
              style={linkButtonStyles}
              onClick={handleNotRegisteredClick}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3b82f6")}
            >
              Criar conta
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="auth-tabs">
            <div className="auth-tab active" style={{ cursor: "default", flex: 1 }}>
              CRIAR CONTA
            </div>
          </div>
          <RegisterForm 
            onSuccess={() => setActiveView("login")} 
            preselectedRole={selectedRole || preselectedRole}
            lockRole={isRoleLocked}
            onChangeRole={() => {
              setSelectedRole("");
              setIsRoleLocked(false);
              setShowWizard(true);
            }}
          />
          <div style={linkStyles}>
            Já possui uma conta?{" "}
            <button
              style={linkButtonStyles}
              onClick={handleBackToLogin}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3b82f6")}
            >
              Fazer login
            </button>
          </div>
        </>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div style={modalStyles.overlay} onClick={handleCloseWizard}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={modalStyles.title}>Qual é o seu perfil?</h2>
              <button
                style={modalStyles.closeButton}
                onClick={handleCloseWizard}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <div style={modalStyles.body}>
              <p style={modalStyles.question}>Selecione a opção que melhor descreve você:</p>
              <div style={modalStyles.optionsList}>
                {USER_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    style={{
                      ...modalStyles.optionButton,
                      ...(selectedRole === option.value ? modalStyles.optionButtonSelected : {}),
                    }}
                    onClick={() => setSelectedRole(option.value)}
                  >
                    <div style={modalStyles.optionIcon}>{option.icon}</div>
                    <div style={modalStyles.optionContent}>
                      <div style={modalStyles.optionLabel}>{option.label}</div>
                      <div style={modalStyles.optionDescription}>{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                style={{
                  ...modalStyles.continueButton,
                  ...(selectedRole ? {} : modalStyles.continueButtonDisabled),
                }}
                onClick={handleConfirmRole}
                disabled={!selectedRole}
                onMouseEnter={(e) => {
                  if (selectedRole) e.currentTarget.style.backgroundColor = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  if (selectedRole) e.currentTarget.style.backgroundColor = "#3b82f6";
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
