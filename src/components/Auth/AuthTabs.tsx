import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import GoogleSignInButton from "./GoogleSignInButton";
import { buildSupportWhatsappUrl } from "../../config/support";

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
    description: "Quero pedir comida, fazer uma corrida ou uma entrega de objeto",
    icon: "👤",
  },
  {
    value: "CLIENT",
    label: "Estabelecimento Comercial",
    description: "Tenho um negócio e preciso de corridas para meus clientes",
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
    label: "Gerente Zapi10",
    description: "Tenho uma equipe de motoristas e estabelecimentos comerciais e ganho com as corridas deles",
    icon: "👥",
  },
  {
    value: "WAITER",
    label: "Garçom",
    description: "Trabalho como garçom em um estabelecimento",
    icon: "🧑‍🍳",
  },
];

export default function AuthTabs() {
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get("role") || undefined;
  const lockRole = searchParams.get("lockRole") === "true";
  // Sem role no link de cadastro → tela de escolha (Google vs formulário). Com role
  // (links de parceiro) → vai direto pro formulário manual com o papel travado.
  const initialView: "login" | "register" | "registerChoice" =
    searchParams.get("tab") === "register"
      ? (preselectedRole ? "register" : "registerChoice")
      : "login";

  const [activeView, setActiveView] = useState<"login" | "register" | "registerChoice">(initialView);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(preselectedRole || "");
  const [isMobile, setIsMobile] = useState(false);

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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
        // Sem role: tela de escolha (Google vs preencher formulário)
        setActiveView("registerChoice");
      }
    }
  }, [searchParams, preselectedRole, lockRole]);

  // "Criar conta" → tela de escolha do método de cadastro
  const handleNotRegisteredClick = () => {
    setActiveView("registerChoice");
  };

  // "Preencher Cadastro" → escolhe o papel no wizard e segue pro formulário manual
  const handlePreencherCadastro = () => {
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
      position: isMobile ? "fixed" : "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      zIndex: isMobile ? 1000 : 10,
      padding: isMobile ? "0" : "1rem",
      paddingTop: isMobile ? "0" : "5vh",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: isMobile ? "0" : "1rem",
      maxWidth: isMobile ? "100%" : "500px",
      width: "100%",
      minHeight: isMobile ? "100%" : "auto",
      maxHeight: isMobile ? "none" : "90vh",
      overflow: isMobile ? "visible" : "auto",
      position: "relative",
      boxShadow: isMobile ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      marginBottom: isMobile ? "0" : 0,
      paddingBottom: isMobile ? "100px" : 0,
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

  const supportLinkStyles: React.CSSProperties = {
    color: "#6b7280",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "0.9rem",
  };

  const dividerWrap: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "16px 0",
  };
  const dividerLine: React.CSSProperties = { flex: 1, height: 1, background: "#e5e7eb" };
  const dividerText: React.CSSProperties = { color: "#9ca3af", fontSize: "0.85rem" };

  // Botão secundário "Preencher Cadastro" — neutro/outline pra não competir com o do Google.
  const fillFormButtonStyles: React.CSSProperties = {
    width: "100%",
    padding: "12px 0",
    borderRadius: 9999,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
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
          <GoogleSignInButton mode="login" />
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
          {/* Saída pros casos em que o usuário fica preso (e-mail errado no cadastro,
              não confirmado e sem recuperar) — WhatsApp, único canal sem login. Espelha o app. */}
          <div style={{ ...linkStyles, marginTop: 8 }}>
            <a
              href={buildSupportWhatsappUrl(
                "Olá! Estou com problema para acessar minha conta no Zapi10."
              )}
              target="_blank"
              rel="noopener noreferrer"
              style={supportLinkStyles}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              Problemas para entrar? Falar no WhatsApp
            </a>
          </div>
        </>
      ) : activeView === "registerChoice" ? (
        <>
          <div className="auth-tabs">
            <div className="auth-tab active" style={{ cursor: "default", flex: 1 }}>
              CRIAR CONTA
            </div>
          </div>
          {/* Cadastro com Google: abre o wizard de onboarding (papel → CPF → requisitos). */}
          <GoogleSignInButton mode="signup" showDivider={false} />
          <div style={dividerWrap}>
            <span style={dividerLine} />
            <span style={dividerText}>ou</span>
            <span style={dividerLine} />
          </div>
          <button style={fillFormButtonStyles} onClick={handlePreencherCadastro}>
            Preencher Cadastro
          </button>
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
        <div style={{...modalStyles.overlay, width: "100%", maxWidth: "none"}} onClick={handleCloseWizard}>
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
