import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

const Restaurants = () => {
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
        padding: isMobile ? "3rem 1.5rem" : "5rem 2rem",
        background: "linear-gradient(135deg, hsl(30, 60%, 15%) 0%, hsl(220, 25%, 10%) 50%, hsl(200, 50%, 18%) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-5rem", left: "-5rem", width: "20rem", height: "20rem", background: "#f59e0b", borderRadius: "50%", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "-5rem", right: "-5rem", width: "16rem", height: "16rem", background: "#3b82f6", borderRadius: "50%", filter: "blur(80px)" }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? "2rem" : "3rem" }}>
          <span style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "20px",
            background: "rgba(245, 158, 11, 0.2)",
            color: "#fbbf24",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}>
            Para Restaurantes e Bares
          </span>

          <h2 style={{
            fontSize: isMobile ? "2rem" : "3rem",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}>
            Seu restaurante com <span style={{ background: "linear-gradient(90deg, #f59e0b, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>controle total</span>
          </h2>

          <p style={{
            fontSize: isMobile ? "1.1rem" : "1.3rem",
            color: "rgba(255,255,255,0.7)",
            maxWidth: "780px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Atendimento de mesa, fluxo de caixa, delivery e corridas de entrega —
            tudo integrado em <strong style={{ color: "#fbbf24" }}>uma única plataforma</strong>.
            Cadastro <strong style={{ color: "#4ade80" }}>gratuito</strong>.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: isMobile ? "2rem" : "3rem",
        }}>
          {[
            { icon: "🍽️", title: "Mesa + Caixa", desc: "Garçom, rodadas, divisão de conta e fechamento de caixa num só módulo", highlight: "R$ 100/mês" },
            { icon: "🛵", title: "Delivery Próprio", desc: "Receba pedidos pelo seu app, sem depender de marketplace terceiro", highlight: "Cadastro grátis" },
            { icon: "📦", title: "Corridas Avulsas", desc: "Despache entregas dos seus pedidos de WhatsApp/telefone em um clique", highlight: "Motoboys da rede" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              textAlign: "center",
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{item.icon}</div>
              <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 600, marginBottom: "6px" }}>{item.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "10px" }}>{item.desc}</p>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                background: "rgba(251,191,36,0.15)",
                color: "#fbbf24",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}>{item.highlight}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Button
            size="lg"
            onClick={() => window.open("/apresentacao-restaurantes.html", "_blank")}
            style={{
              background: "linear-gradient(90deg, #f59e0b, #3b82f6)",
              color: "white",
              fontSize: "1.1rem",
              padding: "0.85rem 2.5rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(245, 158, 11, 0.6)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245, 158, 11, 0.4)"; }}
          >
            Ver como funciona
            <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Restaurants;
