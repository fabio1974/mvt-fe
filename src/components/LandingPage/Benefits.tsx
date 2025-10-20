import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Zap, Shield, MapPin, Clock, Building2 } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Velocidade Extrema",
    description:
      "Entregas em até 10 minutos. Nossos motociclistas são treinados para agilidade e segurança.",
  },
  {
    icon: MapPin,
    title: "Rastreamento em Tempo Real",
    description:
      "Acompanhe sua entrega do início ao fim com precisão GPS em tempo real.",
  },
  {
    icon: Shield,
    title: "100% Seguro",
    description:
      "Seguro completo em todas as entregas. Sua encomenda está protegida conosco.",
  },
  {
    icon: Clock,
    title: "Disponível 24/7",
    description:
      "Estamos sempre prontos para atender. Entregas a qualquer hora, qualquer dia.",
  },
  {
    icon: Building2,
    title: "Parceria com Prefeituras",
    description:
      "Trabalho formal e reconhecido pelo poder público, com formalização via MEI e INSS.",
  },
];

const Benefits = () => {
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
        background: "hsl(220 20% 15% / 0.5)",
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
            Por que escolher o{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(32 95% 55%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Zapi10
            </span>
            ?
          </h2>
          <p
            style={{
              fontSize: isMobile ? "1rem" : "1.25rem",
              color: "hsl(0, 0%, 70%)",
              maxWidth: "42rem",
              margin: "0 auto",
            }}
          >
            Combinamos tecnologia de ponta com profissionais experientes para
            entregar o melhor serviço.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              style={{
                background: "hsl(220 20% 15%)",
                border: "1px solid hsl(220 15% 25%)",
                transition: "all 0.3s ease",
                animation: `fadeUp 0.8s ease-out ${index * 0.1}s backwards`,
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
              <CardContent style={{ padding: "1.5rem" }}>
                <div
                  style={{
                    background: "hsl(217 91% 60% / 0.1)",
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <benefit.icon
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      color: "hsl(217, 91%, 60%)",
                    }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                    color: "hsl(0, 0%, 100%)",
                  }}
                >
                  {benefit.title}
                </h3>
                <p style={{ color: "hsl(0, 0%, 70%)", lineHeight: 1.6 }}>
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
