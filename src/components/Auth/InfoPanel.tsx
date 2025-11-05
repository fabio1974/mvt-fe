export default function InfoPanel() {
  return (
    <div className="info-panel">
      <h2>
        Bem-vindo ao Zapi10,{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #5b4cfa, #4c9aff)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          entregas e mototáxi
        </span>
      </h2>
      <div className="info-panel-subtitle">
        Com sua conta Zapi10, você encontra:
      </div>
      <ul>
        <li>
          <span>✓</span>
          <span>Taxas justas e transparentes</span>
        </li>
        <li>
          <span>✓</span>
          <span>Histórico completo de suas entregas</span>
        </li>
        <li>
          <span>✓</span>
          <span>Gestão de dados e pagamentos</span>
        </li>
      </ul>
      <div
        style={{
          marginTop: 40,
          padding: "16px 20px",
          background: "#f0f0f0",
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>🏍️</span>
        <div>
          <strong style={{ color: "#333", fontSize: "0.9rem" }}>Dica:</strong>
          <p
            style={{
              margin: "4px 0 0",
              color: "#666",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            Mantenha seus dados atualizados para receber mais oportunidades de
            entregas!
          </p>
        </div>
      </div>
    </div>
  );
}
