import React, { useState, useEffect } from "react";
import { Zap, Clock, MapPin } from "lucide-react";
import heroImage from "../../assets/hero-delivery.jpg";

const Hero = () => {
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false);
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
      fontSize: isMobile ? "3rem" : "4.5rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      lineHeight: 1.2,
      color: "#ffffff",
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
            >
              Seja um Parceiro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
