import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Clock, MapPin, X } from "lucide-react";
import heroImage from "../../assets/hero-delivery.jpg";

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

const Hero = () => {
  const navigate = useNavigate();
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false);
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Estados do modal wizard
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<"initial" | "selectType">("initial");
  const [selectedUserType, setSelectedUserType] = useState<string>("");

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const styles: { [key: string]: React.CSSProperties } = {
    section: {
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      color: "#ffffff",
      textAlign: "left",
    },
    background: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundImage: `url(${heroImage})`,
      filter: "brightness(1.2)",
    },
    overlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      background:
        "linear-gradient(to right, rgba(0, 0, 0, 0.8) 20%, rgba(0, 0, 0, 0.3) 70%, transparent)",
    },
    container: {
      position: "relative",
      zIndex: 10,
      padding: isMobile ? "4rem 1.5rem" : "5rem 8rem",
      maxWidth: "1400px",
      margin: "0",
      width: "100%",
    },
    content: {
      maxWidth: "48rem",
      animation: "fadeUp 1s ease-out",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "rgba(59, 130, 246, 0.15)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      borderRadius: "9999px",
      padding: "0.5rem 1rem",
      marginBottom: "1.5rem",
    },
    badgeText: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#60a5fa",
    },
    title: {
      fontSize: isMobile ? "2.5rem" : "3.5rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      lineHeight: 1.2,
      color: "#ffffff",
      opacity: 0.95,
    },
    titleSpan: {
      background:
        "linear-gradient(to right, #3b82f6, #60a5fa, #eab308, #f97316)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    paragraph: {
      fontSize: isMobile ? "1rem" : "1.125rem",
      color: "#d1d5db",
      marginBottom: "2.5rem",
      lineHeight: 1.6,
      maxWidth: "36rem",
    },
    buttonContainer: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "1rem",
      marginBottom: "3rem",
    },
    primaryButton: {
      background: "linear-gradient(to right, #3b82f6, #f59e0b)",
      color: "#ffffff",
      padding: "0.75rem 2rem",
      borderRadius: "0.5rem",
      fontSize: "1.125rem",
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
      textAlign: "center",
    },
    secondaryButton: {
      backgroundColor: "rgba(31, 41, 55, 0.7)",
      color: "#ffffff",
      padding: "0.75rem 2rem",
      borderRadius: "0.5rem",
      fontSize: "1.125rem",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      cursor: "pointer",
      transition: "transform 0.2s, background-color 0.2s",
      textAlign: "center",
    },
    statsContainer: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "2rem",
      padding: "1.5rem",
      backgroundColor: "rgba(17, 24, 39, 0.5)",
      borderRadius: "0.75rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      maxWidth: "fit-content",
    },
    statItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    statIconContainer: {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      padding: "0.75rem",
      borderRadius: "9999px",
    },
    statTextContainer: {},
    statValue: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#ffffff",
    },
    statLabel: {
      fontSize: "0.875rem",
      color: "#9ca3af",
    },
  };

  const primaryButtonStyle = {
    ...styles.primaryButton,
    transform: isPrimaryHovered ? "scale(1.05)" : "scale(1)",
    boxShadow: isPrimaryHovered ? "0 0 20px rgba(59, 130, 246, 0.5)" : "none",
  };

  const secondaryButtonStyle = {
    ...styles.secondaryButton,
    transform: isSecondaryHovered ? "scale(1.05)" : "scale(1)",
    backgroundColor: isSecondaryHovered
      ? "rgba(55, 65, 81, 0.9)"
      : "rgba(31, 41, 55, 0.7)",
  };

  // Funções do wizard
  const openModal = () => {
    setShowModal(true);
    setWizardStep("initial");
    setSelectedUserType("");
  };

  const closeModal = () => {
    setShowModal(false);
    setWizardStep("initial");
    setSelectedUserType("");
  };

  const handleAlreadyRegistered = () => {
    closeModal();
    navigate("/login");
  };

  const handleNotRegistered = () => {
    setWizardStep("selectType");
  };

  const handleContinueToRegister = () => {
    if (selectedUserType) {
      closeModal();
      navigate(`/login?tab=register&role=${selectedUserType}&lockRole=true`);
    }
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
    buttonGroup: {
      display: "flex",
      gap: "1rem",
      justifyContent: "center",
    },
    yesButton: {
      padding: "0.875rem 2rem",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "background-color 0.2s",
      flex: 1,
      maxWidth: "200px",
    },
    noButton: {
      padding: "0.875rem 2rem",
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "background-color 0.2s",
      flex: 1,
      maxWidth: "200px",
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
    backButton: {
      marginTop: "0.75rem",
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "transparent",
      color: "#6b7280",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "color 0.2s",
    },
  };

  return (
    <section style={styles.section}>
      <div style={styles.background}>
        <div style={styles.overlay} />
      </div>

      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.badge}>
            <Zap width={16} height={16} color="#60a5fa" />
            <span style={styles.badgeText}>Entrega em até 10 minutos</span>
          </div>

          <h1 style={styles.title}>
            Velocidade que <br />
            <span style={styles.titleSpan}>transforma</span> sua <br />
            entrega
          </h1>

          <p style={styles.paragraph}>
            Conectamos você ao destino com a velocidade e segurança que só o
            Zapi10 oferece. Entregas rápidas via moto em toda a cidade.
          </p>

          <div style={styles.buttonContainer}>
            <button
              style={primaryButtonStyle}
              onMouseEnter={() => setIsPrimaryHovered(true)}
              onMouseLeave={() => setIsPrimaryHovered(false)}
              onClick={openModal}
            >
              Solicitar Entrega
            </button>
            <button
              style={secondaryButtonStyle}
              onMouseEnter={() => setIsSecondaryHovered(true)}
              onMouseLeave={() => setIsSecondaryHovered(false)}
            >
              Como Funciona
            </button>
          </div>

          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <div style={styles.statIconContainer}>
                <Clock width={24} height={24} color="#60a5fa" />
              </div>
              <div style={styles.statTextContainer}>
                <div style={styles.statValue}>10min</div>
                <div style={styles.statLabel}>Entrega média</div>
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIconContainer}>
                <Zap width={24} height={24} color="#60a5fa" />
              </div>
              <div style={styles.statTextContainer}>
                <div style={styles.statValue}>24/7</div>
                <div style={styles.statLabel}>Disponível</div>
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIconContainer}>
                <MapPin width={24} height={24} color="#60a5fa" />
              </div>
              <div style={styles.statTextContainer}>
                <div style={styles.statValue}>100%</div>
                <div style={styles.statLabel}>Cobertura</div>
              </div>
            </div>
          </div>

          {/* CTA para Motoboys */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              background: "rgba(34, 197, 94, 0.1)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: "#a3e635",
                marginBottom: "0.5rem",
              }}
            >
              💼 Quer trabalhar conosco?
            </p>
            <p
              style={{
                fontSize: "1rem",
                color: "#ffffff",
                marginBottom: "1rem",
              }}
            >
              <strong>Ganhe 85% do valor</strong> de cada entrega + formalização
              MEI
            </p>
            <button
              style={{
                background: "linear-gradient(to right, #22c55e, #16a34a)",
                color: "#ffffff",
                padding: "0.625rem 1.5rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              onClick={openModal}
            >
              Seja um Parceiro
            </button>
          </div>
        </div>
      </div>

      {/* Modal Wizard */}
      {showModal && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={modalStyles.title}>
                {wizardStep === "initial" ? "Bem-vindo ao Zapi10!" : "Qual é o seu perfil?"}
              </h2>
              <button
                style={modalStyles.closeButton}
                onClick={closeModal}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <div style={modalStyles.body}>
              {wizardStep === "initial" ? (
                <>
                  <p style={modalStyles.question}>Você já possui uma conta cadastrada?</p>
                  <div style={modalStyles.buttonGroup}>
                    <button
                      style={modalStyles.yesButton}
                      onClick={handleAlreadyRegistered}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                    >
                      Sim, já tenho conta
                    </button>
                    <button
                      style={modalStyles.noButton}
                      onClick={handleNotRegistered}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                    >
                      Não, quero me cadastrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={modalStyles.question}>Selecione a opção que melhor descreve você:</p>
                  <div style={modalStyles.optionsList}>
                    {USER_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        style={{
                          ...modalStyles.optionButton,
                          ...(selectedUserType === option.value ? modalStyles.optionButtonSelected : {}),
                        }}
                        onClick={() => setSelectedUserType(option.value)}
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
                      ...(selectedUserType ? {} : modalStyles.continueButtonDisabled),
                    }}
                    onClick={handleContinueToRegister}
                    disabled={!selectedUserType}
                    onMouseEnter={(e) => {
                      if (selectedUserType) e.currentTarget.style.backgroundColor = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUserType) e.currentTarget.style.backgroundColor = "#3b82f6";
                    }}
                  >
                    Continuar
                  </button>
                  <button
                    style={modalStyles.backButton}
                    onClick={() => setWizardStep("initial")}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                  >
                    ← Voltar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
