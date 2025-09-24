import DummyImage from "../../dummy_images/DummyImage";

export default function Section1() {
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
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "3.2rem",
            fontWeight: 700,
            marginBottom: 20,
            color: "#1a1a1a",
            fontFamily: "'Inter', Arial, sans-serif",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Aqui, os eventos esportivos acontecem
        </h2>
        <p
          style={{
            fontSize: "1.3rem",
            color: "#6c757d",
            marginBottom: 40,
            fontFamily: "'Inter', Arial, sans-serif",
            lineHeight: 1.5,
            maxWidth: 600,
            margin: "0 auto 40px auto",
          }}
        >
          Encontre seu próximo desafio e participe dos melhores eventos
          esportivos.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          <DummyImage alt="Banner principal" />
        </div>
      </div>
    </div>
  );
}
