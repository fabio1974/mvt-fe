import DummyImage from "../../dummy_images/DummyImage";

export default function Section2() {
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "48px",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "left", maxWidth: 500, flex: 1 }}>
            <h2
              style={{
                fontSize: "2.8rem",
                fontWeight: 700,
                marginBottom: 20,
                color: "#1a1a1a",
                fontFamily: "'Inter', Arial, sans-serif",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Automatize a gestão das inscrições
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#6c757d",
                fontFamily: "'Inter', Arial, sans-serif",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Maximize o lucro do seu evento com gestão automatizada.
            </p>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <DummyImage alt="Gestão de inscrições" />
          </div>
        </div>
      </div>
    </div>
  );
}
