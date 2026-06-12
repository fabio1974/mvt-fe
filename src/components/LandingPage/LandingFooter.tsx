import { useState, useEffect } from "react";
import BrandMark from "../Brand/BrandMark";

export default function LandingFooter() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  return (
    <footer
      style={{
        background:
          "linear-gradient(180deg, hsl(220, 25%, 12%), hsl(220, 25%, 10%))",
        borderTop: "1px solid rgba(59, 130, 246, 0.2)",
        padding: isMobile ? "3rem 1rem" : "4rem 2rem 2rem",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "0 1.5rem" : "0 16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(250px, 1fr))",
            gap: isMobile ? "2.5rem" : "3rem",
            marginBottom: "3rem",
          }}
        >
          {/* Coluna Logo e Descrição */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <BrandMark onDark height={40} />
            </div>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#cbd5e1",
                lineHeight: "1.7",
                margin: 0,
              }}
            >
              Conectando pessoas e empresas através de uma plataforma moderna e
              eficiente de delivery e logística.
            </p>
          </div>

          {/* Coluna Produto */}
          <div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#f1f5f9",
                marginBottom: "1.25rem",
                marginTop: 0,
              }}
            >
              Produto
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <li>
                <a
                  href="/promocoes"
                  style={{
                    color: "#cbd5e1",
                    textDecoration: "none",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  Promoções
                </a>
              </li>
              {["Recursos", "Preços", "Casos de Uso", "Integrações"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        color: "#cbd5e1",
                        textDecoration: "none",
                        fontSize: "0.95rem",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#60a5fa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#cbd5e1")
                      }
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Coluna Empresa */}
          <div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#f1f5f9",
                marginBottom: "1.25rem",
                marginTop: 0,
              }}
            >
              Empresa
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {["Sobre Nós", "Carreiras", "Blog", "Contato"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    style={{
                      color: "#cbd5e1",
                      textDecoration: "none",
                      fontSize: "0.95rem",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#60a5fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#cbd5e1")
                    }
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna Suporte */}
          <div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#f1f5f9",
                marginBottom: "1.25rem",
                marginTop: 0,
              }}
            >
              Suporte
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[
                "Central de Ajuda",
                "Documentação",
                "Tutoriais",
                "Status do Sistema",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    style={{
                      color: "#cbd5e1",
                      textDecoration: "none",
                      fontSize: "0.95rem",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#60a5fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#cbd5e1")
                    }
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Linha de Separação */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
            margin: "2rem 0",
          }}
        />

        {/* Rodapé Final */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "1.5rem" : "1rem",
            paddingTop: "1rem",
          }}
        >
          <p
            style={{
              fontSize: "0.9rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            © 2025 Moveltrack Sistemas. Todos os direitos reservados.
          </p>

          <div
            style={{
              display: "flex",
              gap: isMobile ? "1.5rem" : "2rem",
              flexWrap: "wrap",
            }}
          >
            {["Termos de Uso", "Política de Privacidade", "Cookies"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    color: "#94a3b8",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#60a5fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#94a3b8")
                  }
                >
                  {item}
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
