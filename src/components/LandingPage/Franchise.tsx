import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import BrandName from "../Brand/BrandName";

const Franchise = () => {
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
        background: "linear-gradient(135deg, hsl(260, 60%, 15%) 0%, hsl(220, 25%, 10%) 50%, hsl(260, 40%, 20%) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow decorativo */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-5rem", right: "-5rem", width: "20rem", height: "20rem", background: "#8b5cf6", borderRadius: "50%", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "-5rem", left: "-5rem", width: "16rem", height: "16rem", background: "#f59e0b", borderRadius: "50%", filter: "blur(80px)" }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? "2rem" : "3rem" }}>
          <span style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "20px",
            background: "rgba(139, 92, 246, 0.2)",
            color: "#c084fc",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}>
            Oportunidade
          </span>

          <h2 style={{
            fontSize: isMobile ? "2rem" : "3rem",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}>
            Seja um <span style={{ background: "linear-gradient(90deg, #8b5cf6, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Gerente Franqueado</span> <BrandName />
          </h2>

          <p style={{
            fontSize: isMobile ? "1.1rem" : "1.3rem",
            color: "rgba(255,255,255,0.7)",
            maxWidth: "700px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Coordene motoboys e estabelecimentos na sua região.
            Ganhe <strong style={{ color: "#4ade80" }}>automaticamente</strong> em cada operação — sem limite de ganhos.
          </p>
        </div>

        {/* Cards de benefícios */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: isMobile ? "2rem" : "3rem",
        }}>
          {[
            { icon: "🍕", title: "Zapi-Food", desc: "4% de cada pedido de delivery do seu grupo", highlight: "4% do total" },
            { icon: "📦", title: "Corridas Avulsas", desc: "5% de cada corrida de entrega dos estabelecimentos", highlight: "5% do frete" },
            { icon: "🍽️", title: "Serviço de Mesa", desc: "35% da fatura mensal de cada estabelecimento", highlight: "35% da fatura" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              textAlign: "center",
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{item.icon}</div>
              <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 600, marginBottom: "6px" }}>{item.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "10px" }}>{item.desc}</p>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                background: "rgba(74,222,128,0.15)",
                color: "#4ade80",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}>{item.highlight}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Button
            size="lg"
            onClick={() => window.open("/apresentacao-gerentes.html", "_blank")}
            style={{
              background: "linear-gradient(90deg, #8b5cf6, #f59e0b)",
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
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(139, 92, 246, 0.6)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.4)"; }}
          >
            Conhecer o Modelo de Negócio
            <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Franchise;
