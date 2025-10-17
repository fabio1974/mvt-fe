import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

const Footer = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const handleLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "hsl(217, 91%, 60%)";
  };

  const handleLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "hsl(0, 0%, 70%)";
  };

  return (
    <footer
      style={{
        background: "hsl(220 20% 15%)",
        borderTop: "1px solid hsl(220 15% 25%)",
        padding: isMobile ? "2rem 0" : "3rem 0",
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
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(32 95% 55%) 100%)",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                }}
              >
                <Zap
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: "hsl(0, 0%, 100%)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(32 95% 55%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Zapi10
              </span>
            </div>
            <p
              style={{
                color: "hsl(0, 0%, 70%)",
                fontSize: "0.875rem",
                lineHeight: 1.6,
              }}
            >
              Entregas rápidas via motocicleta. Velocidade, segurança e
              tecnologia.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "1rem",
                color: "hsl(0, 0%, 100%)",
              }}
            >
              Serviços
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Entrega Expressa
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Entrega Agendada
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Rastreamento
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Seguro de Carga
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "1rem",
                color: "hsl(0, 0%, 100%)",
              }}
            >
              Empresa
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Sobre Nós
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Seja um Motociclista
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Carreiras
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "1rem",
                color: "hsl(0, 0%, 100%)",
              }}
            >
              Suporte
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Central de Ajuda
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Contato
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Termos de Uso
                </a>
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <a
                  href="#"
                  style={{
                    color: "hsl(0, 0%, 70%)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid hsl(220 15% 25%)",
            paddingTop: "2rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "hsl(0, 0%, 70%)",
          }}
        >
          <p>© 2024 Zapi10. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
