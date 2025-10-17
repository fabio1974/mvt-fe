import { useState, useEffect } from "react";
import { Package, MapPin, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Solicite sua Entrega",
    description:
      "Informe origem, destino e detalhes do pacote através do nosso app ou site.",
    number: "01",
  },
  {
    icon: MapPin,
    title: "Rastreie em Tempo Real",
    description:
      "Acompanhe o motociclista em tempo real no mapa até a entrega ser concluída.",
    number: "02",
  },
  {
    icon: CheckCircle,
    title: "Receba com Segurança",
    description:
      "Confirme o recebimento e avalie o serviço. Simples, rápido e seguro.",
    number: "03",
  },
];

const HowItWorks = () => {
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
        padding: isMobile ? "3rem 0" : "5rem 0",
        background: "hsl(220, 25%, 10%)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "0 1.5rem" : "0 1rem",
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
            Como Funciona
          </h2>
          <p
            style={{
              fontSize: isMobile ? "1rem" : "1.25rem",
              color: "hsl(0, 0%, 70%)",
              maxWidth: "42rem",
              margin: "0 auto",
            }}
          >
            Em apenas 3 passos simples, sua entrega está a caminho.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            maxWidth: "80rem",
            margin: "0 auto",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                animation: `fadeUp 0.8s ease-out ${index * 0.15}s backwards`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  background: "hsl(220 20% 15%)",
                  border: "1px solid hsl(220 15% 25%)",
                  borderRadius: "1rem",
                  padding: "2rem",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(217 91% 60% / 0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 40px hsl(217 91% 60% / 0.3)";
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(220 15% 25%)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Number Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "-1rem",
                    right: "-1rem",
                    background:
                      "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(32 95% 55%) 100%)",
                    color: "hsl(0, 0%, 100%)",
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.125rem",
                    boxShadow: "0 0 40px hsl(217 91% 60% / 0.3)",
                  }}
                >
                  {step.number}
                </div>

                <div
                  style={{
                    background: "hsl(217 91% 60% / 0.1)",
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <step.icon
                    style={{
                      width: "2rem",
                      height: "2rem",
                      color: "hsl(217, 91%, 60%)",
                    }}
                  />
                </div>

                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                    color: "hsl(0, 0%, 100%)",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ color: "hsl(0, 0%, 70%)", lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
