export default function InfoPanel() {
  return (
    <div
      style={{
        flex: 1,
        padding: "24px 32px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: 420, width: "100%" }}>
        <h2
          style={{
            fontWeight: 600,
            fontSize: "1.3rem",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Faça login na sua conta para comprar com mais agilidade
        </h2>
        <div
          style={{
            color: "#555",
            fontSize: "1rem",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Na sua conta da Corridas da Serra, você encontra:
        </div>
        <ul style={{ listStyle: "none", padding: "0 0 0 24px", margin: 0 }}>
          <li
            style={{ marginBottom: 12, display: "flex", alignItems: "center" }}
          >
            <span style={{ color: "#ff9900", fontSize: 22, marginRight: 8 }}>
              ✔
            </span>
            Seus eventos favoritos salvos
          </li>
          <li
            style={{ marginBottom: 12, display: "flex", alignItems: "center" }}
          >
            <span style={{ color: "#ff9900", fontSize: 22, marginRight: 8 }}>
              ✔
            </span>
            Informações dos últimos eventos
          </li>
          <li style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#ff9900", fontSize: 22, marginRight: 8 }}>
              ✔
            </span>
            Dados salvos para compras futuras
          </li>
        </ul>
      </div>
    </div>
  );
}
