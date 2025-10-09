import { useNavigate } from "react-router-dom";
import EntityTable from "../Generic/EntityTable";

const OrganizationRegistrationsPage: React.FC = () => {
  const navigate = useNavigate();

  // Tradução de status para português
  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      CANCELLED: "Cancelado",
      WAITING_LIST: "Lista de Espera",
      CHECKED_IN: "Check-in Realizado",
    };
    return texts[status] || status;
  };

  // Cores dos badges de status
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: "#f59e0b",
      CONFIRMED: "#10b981",
      CANCELLED: "#ef4444",
      WAITING_LIST: "#6b7280",
      CHECKED_IN: "#3b82f6",
    };
    return colors[status] || "#6b7280";
  };

  // Formatar data de forma mais legível
  const formatRegistrationDate = (date: string): string => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Handlers de ações
  const handleView = (registrationId: number) => {
    navigate(`/inscricoes/${registrationId}`);
  };

  const handleEdit = (registrationId: number) => {
    navigate(`/inscricoes/${registrationId}/editar`);
  };

  const handleDelete = (registrationId: number) => {
    if (window.confirm("Tem certeza que deseja cancelar esta inscrição?")) {
      console.log("Cancelar inscrição:", registrationId);
      // Implementar lógica de cancelamento
    }
  };

  return (
    <EntityTable
      entityName="registration"
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      showActions={true}
      customRenderers={{
        // Campos do usuário
        userName: (value, row) => row.userName || "-",
        user: (value, row) => row.userName || "-",
        "user.name": (value, row) => row.userName || "-",
        participant: (value, row) => row.userName || "-",

        // Campos do evento
        eventName: (value, row) => row.eventName || "-",
        event: (value, row) => row.eventName || "-",
        "event.name": (value, row) => row.eventName || "-",

        status: (value, row) => (
          <span
            className="status-badge"
            style={{
              backgroundColor: getStatusColor(row.status || value),
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {getStatusText(row.status || value)}
          </span>
        ),
        registrationDate: (value, row) => (
          <span style={{ whiteSpace: "nowrap" }}>
            {formatRegistrationDate(row.registrationDate || value)}
          </span>
        ),
        hasPaid: (value, row) => {
          const paid = row.hasPaid ?? value;
          return (
            <span
              style={{
                color: paid ? "#10b981" : "#ef4444",
                fontWeight: 600,
              }}
            >
              {paid ? "✓ Pago" : "✗ Pendente"}
            </span>
          );
        },
      }}
    />
  );
};

export default OrganizationRegistrationsPage;
