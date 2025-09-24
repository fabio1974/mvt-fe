import { useState } from "react";

export default function Section3() {
  const images = [
    {
      src: "https://dummyimage.com/400x180/cccccc/222222.png&text=Foto+1",
      alt: "Foto 1",
    },
    {
      src: "https://dummyimage.com/400x180/cccccc/222222.png&text=Foto+2",
      alt: "Foto 2",
    },
    {
      src: "https://dummyimage.com/400x180/cccccc/222222.png&text=Foto+3",
      alt: "Foto 3",
    },
  ];
  const [current, setCurrent] = useState(0);

  function prev() {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }
  function next() {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }

  return (
    <div
      style={{
        background: "#f8f9fa",
        padding: "48px 32px 64px 32px",
        margin: 0,
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{}}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "2.8rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 20,
              color: "#1a1a1a",
              fontFamily: "'Inter', Arial, sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Página exclusiva para divulgação
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              color: "#6c757d",
              textAlign: "center",
              marginBottom: 40,
              fontFamily: "'Inter', Arial, sans-serif",
              lineHeight: 1.6,
              maxWidth: 600,
            }}
          >
            Centralize todas as informações da sua competição esportiva.
          </p>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 400,
                height: 220,
                marginBottom: 20,
              }}
            >
              <img
                src={images[current].src}
                alt={images[current].alt}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 16,
                  objectFit: "cover",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <button
                onClick={prev}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 18,
                  color: "#0099ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#0099ff";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.95)";
                  e.currentTarget.style.color = "#0099ff";
                }}
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                onClick={next}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 18,
                  color: "#0099ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#0099ff";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.95)";
                  e.currentTarget.style.color = "#0099ff";
                }}
                aria-label="Próxima"
              >
                ›
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {images.map((img, idx) => (
                <button
                  key={img.src}
                  onClick={() => setCurrent(idx)}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: idx === current ? "#0099ff" : "#e0e7ef",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  aria-label={`Ir para imagem ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
