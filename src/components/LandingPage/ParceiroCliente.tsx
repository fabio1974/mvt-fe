import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiArrowLeft } from "react-icons/fi";

const ParceiroCliente: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const customerBenefits = [
    "Entregas rápidas em até 10 minutos na sua cidade",
    "Transporte seguro de passageiros via moto",
    "Rastreamento em tempo real de todas as entregas",
    "Pagamento facilitado via PIX, cartão ou wallet digital",
    "Suporte 24/7 para qualquer necessidade",
    "Histórico completo de todas as suas solicitações",
    "Avaliação e feedback dos entregadores",
    "Promoções e descontos exclusivos para clientes frequentes",
  ];

  const clientBenefits = [
    "Gerente exclusivo Zapi10 dedicado ao seu negócio",
    "Atendimento humanizado e resolução rápida de problemas",
    "Canal direto com a plataforma através do seu gerente",
    "Abra entregas pelo WhatsApp usando inteligência artificial",
    "Painel administrativo para gerenciar todas as entregas",
    "Múltiplos usuários e permissões personalizadas",
    "Relatórios detalhados de desempenho e custos",
    "Descontos progressivos por volume de entregas",
    "Faturamento diário consolidado para facilitar pagamentos",
    "Integração completa com seu sistema via API (sob consulta técnica)",
  ];

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      fontSize: "1.1rem",
      fontWeight: "600" as const,
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Bem-vindo ao Zapi10</h1>
        <p style={styles.subtitle}>
          Entregas rápidas e transporte seguro de passageiros.
          Escolha como você quer usar nossa plataforma.
        </p>
      </div>

      <div style={styles.content}>
        {/* Card Cliente Pessoa Física - Esquerda */}
        <div
          style={{
            ...styles.card,
            ...(hoveredCard === "customer" ? styles.cardHovered : {}),
          }}
          onMouseEnter={() => setHoveredCard("customer")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <h2 style={styles.cardTitle}>Cliente Pessoa Física</h2>
          <p style={styles.cardSubtitle}>
            Solicite entregas de objetos ou transporte de passageiros de forma
            rápida, segura e econômica para seu uso pessoal.
          </p>

          <div style={styles.benefitsList}>
            {customerBenefits.map((benefit, index) => (
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
            onClick={() => navigate("/login?tab=register&role=CUSTOMER&lockRole=true")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 6px 25px rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
            }}
          >
            Cadastrar como Cliente
          </button>
        </div>

        {/* Card Estabelecimento Comercial - Direita */}
        <div
          style={{
            ...styles.card,
            ...(hoveredCard === "client" ? styles.cardHovered : {}),
          }}
          onMouseEnter={() => setHoveredCard("client")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <h2 style={styles.cardTitle}>Estabelecimento Comercial</h2>
          <p style={styles.cardSubtitle}>
            Tenha um gerente exclusivo Zapi10 dedicado ao seu negócio para 
            atendimento personalizado, além de tecnologia de ponta com 
            WhatsApp e IA para facilitar suas entregas.
          </p>

          <div style={styles.benefitsList}>
            {clientBenefits.map((benefit, index) => (
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
            onClick={() => navigate("/login?tab=register&role=CLIENT&lockRole=true")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 6px 25px rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
            }}
          >
            Cadastrar como Estabelecimento
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

export default ParceiroCliente;
