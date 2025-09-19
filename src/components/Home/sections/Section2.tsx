import DummyImage from "../../dummy_images/DummyImage";

export default function Section2() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
      }}
    >
      <div style={{ textAlign: "left", maxWidth: 500 }}>
        <h2>Automatize a gestão das inscrições</h2>
        <p>Maximize o lucro do seu evento com gestão automatizada.</p>
      </div>
      <DummyImage alt="Gestão de inscrições" />
    </div>
  );
}
