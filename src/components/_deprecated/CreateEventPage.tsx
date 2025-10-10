import { useNavigate } from "react-router-dom";
import EntityForm from "../Generic/EntityForm";
import { useFormMetadata } from "../../hooks/useFormMetadata";

export default function CreateEventPage() {
  const navigate = useNavigate();

  // Busca metadata do backend e converte para formulário
  const { formMetadata, isLoading, error } = useFormMetadata("event");

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          padding: "40px 20px",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ marginBottom: "16px", fontSize: "18px" }}>
            Carregando formulário...
          </div>
          <div style={{ fontSize: "14px" }}>
            Obtendo configurações do backend
          </div>
        </div>
      </div>
    );
  }

  if (error || !formMetadata) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          padding: "40px 20px",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#dc2626" }}>
          <div style={{ marginBottom: "16px", fontSize: "18px" }}>
            ⚠️ Erro ao carregar formulário
          </div>
          <div style={{ fontSize: "14px" }}>
            {error || "Metadata não encontrado para eventos"}
          </div>
          <button
            onClick={() => navigate("/eventos")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Voltar para Eventos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        padding: "40px 20px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <EntityForm
          metadata={formMetadata}
          onSuccess={(data) => {
            navigate(`/eventos/${(data as { id: number }).id}`);
          }}
          onCancel={() => navigate("/eventos")}
        />
      </div>
    </div>
  );
}
