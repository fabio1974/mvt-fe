import { useState, useEffect } from "react";
import { Users, Heart, Building, TrendingUp } from "lucide-react";

const impactStats = [
  {
    icon: TrendingUp,
    value: "85%",
    label: "Vai direto para o motoboy",
    description: "Vs. 70-75% dos concorrentes",
    color: "#22c55e",
  },
  {
    icon: Users,
    value: "200+",
    label: "Trabalhadores ativos",
    description: "Formalizados via MEI",
    color: "#3b82f6",
  },
  {
    icon: Building,
    value: "5+",
    label: "Cidades parceiras",
    description: "Prefeituras conveniadas",
    color: "#f59e0b",
  },
  {
    icon: Heart,
    value: "R$ 714k",
    label: "Repassado aos motoboys",
    description: "Por mês em média",
    color: "#ef4444",
  },
];

const Impact = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  return (
    <section
      style={{
        padding: isMobile ? "4rem 0" : "6rem 0",
        background:
          "linear-gradient(135deg, hsl(220 25% 10%) 0%, hsl(220 20% 15%) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          background:
            "radial-gradient(circle, hsl(217 91% 60% / 0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "0 1.5rem" : "0 1rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: isMobile ? "3rem" : "4rem",
            animation: "fadeUp 0.8s ease-out",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "2rem" : "3rem",
              fontWeight: 700,
              marginBottom: "1rem",
              color: "hsl(0, 0%, 100%)",
            }}
          >
            Nosso{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(32 95% 55%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Impacto Social
            </span>
          </h2>
          <p
            style={{
              fontSize: isMobile ? "1rem" : "1.25rem",
              color: "hsl(0, 0%, 70%)",
              maxWidth: "42rem",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Mais que entregas rápidas, promovemos justiça social e autonomia
            econômica para trabalhadores locais em parceria com o poder público.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
          }}
        >
          {impactStats.map((stat, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "1rem",
                padding: "2rem",
                textAlign: "center",
                transition: "all 0.3s ease",
                animation: `fadeUp 0.8s ease-out ${index * 0.1}s backwards`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.borderColor = `${stat.color}50`;
                e.currentTarget.style.boxShadow = `0 20px 40px ${stat.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  background: `${stat.color}20`,
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <stat.icon
                  style={{
                    width: "2rem",
                    height: "2rem",
                    color: stat.color,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: isMobile ? "2.5rem" : "3rem",
                  fontWeight: "bold",
                  color: stat.color,
                  marginBottom: "0.5rem",
                }}
              >
                {stat.value}
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "hsl(0, 0%, 100%)",
                  marginBottom: "0.5rem",
                }}
              >
                {stat.label}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "hsl(0, 0%, 70%)",
                }}
              >
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Justice section */}
        <div
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            borderRadius: "1rem",
            padding: isMobile ? "2rem" : "3rem",
            marginTop: isMobile ? "3rem" : "4rem",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: 700,
              color: "hsl(0, 0%, 100%)",
              marginBottom: "1rem",
            }}
          >
            💰 Transparência Total nos Repasses
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "85fr 5fr 10fr",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                background: "#22c55e",
                borderRadius: "0.5rem",
                padding: "1rem",
                color: "white",
                fontWeight: "bold",
              }}
            >
              85% Motoboy
            </div>
            <div
              style={{
                background: "#f59e0b",
                borderRadius: "0.5rem",
                padding: "1rem",
                color: "white",
                fontWeight: "bold",
              }}
            >
              5% ADM
            </div>
            <div
              style={{
                background: "#3b82f6",
                borderRadius: "0.5rem",
                padding: "1rem",
                color: "white",
                fontWeight: "bold",
              }}
            >
              10% Plataforma
            </div>
          </div>
          <p
            style={{
              color: "hsl(0, 0%, 70%)",
              fontSize: isMobile ? "0.875rem" : "1rem",
            }}
          >
            Enquanto grandes apps ficam com 25-30%, no Zapi10 o trabalhador fica
            com a maior parte! 🚀
          </p>
        </div>
      </div>
    </section>
  );
};

export default Impact;
