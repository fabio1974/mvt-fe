import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
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
        background:
          "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(32 95% 55%) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Elements */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
        <div
          style={{
            position: "absolute",
            top: "2.5rem",
            left: "2.5rem",
            width: "8rem",
            height: "8rem",
            background: "hsl(0, 0%, 100%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "2.5rem",
            right: "2.5rem",
            width: "10rem",
            height: "10rem",
            background: "hsl(0, 0%, 100%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
      </div>

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
            maxWidth: "48rem",
            margin: "0 auto",
            textAlign: "center",
            animation: "fadeUp 0.8s ease-out",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "2rem" : "3.75rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "hsl(0, 0%, 100%)",
            }}
          >
            Pronto para Entregas Ultra-Rápidas?
          </h2>
          <p
            style={{
              fontSize: isMobile ? "1.125rem" : "1.5rem",
              marginBottom: "2.5rem",
              color: "hsl(0, 0%, 100%)",
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            Junte-se a milhares de clientes satisfeitos que confiam no Zapi10
            para entregas rápidas e seguras todos os dias.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <Button
              size="lg"
              style={{
                background: "hsl(0, 0%, 100%)",
                color: "hsl(220, 25%, 10%)",
                fontSize: "1.125rem",
                padding: "0.75rem 2rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                borderRadius: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Começar Agora
              <ArrowRight
                style={{
                  marginLeft: "0.5rem",
                  width: "1.25rem",
                  height: "1.25rem",
                }}
              />
            </Button>
            <Button
              size="lg"
              style={{
                background: "transparent",
                border: "2px solid hsl(0, 0%, 100%)",
                color: "hsl(0, 0%, 100%)",
                fontSize: "1.125rem",
                cursor: "pointer",
                borderRadius: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(0, 0%, 100% / 0.1)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Falar com Suporte
            </Button>
          </div>

          {/* Trust Indicators */}
          <div
            style={{
              marginTop: "3rem",
              paddingTop: "3rem",
              borderTop: "1px solid hsl(0, 0%, 100% / 0.2)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: "2rem",
                color: "hsl(0, 0%, 100%)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.5rem)",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  10K+
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                    opacity: 0.9,
                  }}
                >
                  Entregas/mês
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.5rem)",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  4.9/5
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                    opacity: 0.9,
                  }}
                >
                  Avaliação
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.5rem)",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  24/7
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                    opacity: 0.9,
                  }}
                >
                  Suporte
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
