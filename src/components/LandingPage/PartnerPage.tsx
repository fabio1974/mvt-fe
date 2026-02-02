import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiArrowLeft } from "react-icons/fi";

const PartnerPage: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const courierBenefits = [
    "Flexibilidade total de horários - trabalhe quando quiser",
    "Ganhe até 87% do valor de cada entrega",
    "Receba pagamentos diários, semanais ou mensais automaticamente",
    "Sistema inteligente de rotas otimizadas",
    "Suporte 24/7 via aplicativo",
    "Sem taxas de cadastro ou mensalidades",
    "Bônus por desempenho e pontualidade",
    "Seguro contra acidentes incluído",
  ];

  const managerBenefits = [
    "Gerencie sua equipe de motoboys com facilidade",
    "Receba comissão por todas as entregas da sua equipe",
    "Painel administrativo completo e intuitivo",
    "Controle financeiro em tempo real",
    "Relatórios detalhados de performance",
    "Suporte dedicado para gestores",
    "Treinamento completo para sua equipe",
    "Ferramentas de recrutamento integradas",
  ];

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      position: "relative" as const,
      overflow: "hidden",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "50px",
      color: "#ffffff",
      fontSize: "0.95rem",
      fontWeight: "500" as const,
      cursor: "pointer",
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
    },
    header: {
      textAlign: "center" as const,
      paddingTop: "3rem",
      paddingBottom: "3rem",
      color: "#ffffff",
    },
    title: {
      fontSize: "3rem",
      fontWeight: "700" as const,
      marginBottom: "1rem",
      textShadow: "0 2px 20px rgba(0,0,0,0.1)",
    },
    subtitle: {
      fontSize: "1.25rem",
      opacity: 0.9,
      maxWidth: "700px",
      margin: "0 auto",
      lineHeight: "1.6",
    },
    content: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "0 2rem 2rem",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "3rem",
    },
    backButtonWrapper: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "2rem 2rem 6rem",
    },
    card: {
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "24px",
      padding: "3rem",
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      transition: "all 0.4s ease",
      backdropFilter: "blur(10px)",
    },
    cardHovered: {
      transform: "translateY(-8px)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
    },
    cardTitle: {
      fontSize: "2rem",
      fontWeight: "700" as const,
      marginBottom: "1rem",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    cardSubtitle: {
      fontSize: "1rem",
      color: "#666",
      marginBottom: "2.5rem",
      lineHeight: "1.6",
    },
    benefitsList: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.25rem",
    },
    benefitItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "1rem",
      animation: "slideInRight 0.6s ease",
    },
    checkIcon: {
      width: "28px",
      height: "28px",
      minWidth: "28px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ffffff",
      marginTop: "2px",
    },
    benefitText: {
      fontSize: "1.05rem",
      color: "#333",
      lineHeight: "1.6",
      fontWeight: "500" as const,
    },
    ctaButton: {
      marginTop: "2.5rem",
      width: "100%",
      padding: "1.25rem",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      fontSize: "1.1rem",
      fontWeight: "600" as const,
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Seja um Parceiro Zapi10</h1>
        <p style={styles.subtitle}>
          Junte-se a nós e faça parte da revolução das entregas justas e eficientes. 
          Escolha como você quer crescer conosco.
        </p>
      </div>

      <div style={styles.content}>
        {/* Card Gerente/Representante - Esquerda */}
        <div
          style={{
            ...styles.card,
            ...(hoveredCard === "manager" ? styles.cardHovered : {}),
          }}
          onMouseEnter={() => setHoveredCard("manager")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <h2 style={styles.cardTitle}>Gerente Zapi10</h2>
          <p style={styles.cardSubtitle}>
            Represente uma associação de motoboys e ganhe comissões recorrentes
            gerenciando sua própria equipe de entregadores.
          </p>

          <div style={styles.benefitsList}>
            {managerBenefits.map((benefit, index) => (
              <div key={index} style={styles.benefitItem}>
                <div style={styles.checkIcon}>
                  <FiCheck size={16} strokeWidth={3} />
                </div>
                <span style={styles.benefitText}>{benefit}</span>
              </div>
            ))}
          </div>

          <button
            style={styles.ctaButton}
            onClick={() => navigate("/login?tab=register&role=ORGANIZER&lockRole=true")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 6px 25px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            Cadastrar como Gerente
          </button>
        </div>

        {/* Card Motoboy - Direita */}
        <div
          style={{
            ...styles.card,
            ...(hoveredCard === "courier" ? styles.cardHovered : {}),
          }}
          onMouseEnter={() => setHoveredCard("courier")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <h2 style={styles.cardTitle}>Motoboy Parceiro</h2>
          <p style={styles.cardSubtitle}>
            Trabalhe com flexibilidade, receba bem e tenha todo o suporte
            necessário para fazer entregas de sucesso.
          </p>

          <div style={styles.benefitsList}>
            {courierBenefits.map((benefit, index) => (
              <div key={index} style={styles.benefitItem}>
                <div style={styles.checkIcon}>
                  <FiCheck size={16} strokeWidth={3} />
                </div>
                <span style={styles.benefitText}>{benefit}</span>
              </div>
            ))}
          </div>

          <button
            style={styles.ctaButton}
            onClick={() => navigate("/login?tab=register&role=COURIER&lockRole=true")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 6px 25px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            Cadastrar como Motoboy
          </button>
        </div>
      </div>

      <div style={styles.backButtonWrapper}>
        <button
          style={styles.backButton}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FiArrowLeft size={20} />
          Voltar
        </button>
      </div>
    </div>
  );
};

export default PartnerPage;
