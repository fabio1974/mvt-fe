import { useNavigate } from "react-router-dom";
import EntityTable from "../Generic/EntityTable";

const AdminEventsPage: React.FC = () => {
  const navigate = useNavigate();

  // Tradução de eventType para português
  const getSportText = (eventType: string): string => {
    const sports: Record<string, string> = {
      RUNNING: "Corrida",
      FOOTBALL: "Futebol",
      BASKETBALL: "Basquete",
      VOLLEYBALL: "Vôlei",
      TENNIS: "Tênis",
      SWIMMING: "Natação",
      CYCLING: "Ciclismo",
    };
    return sports[eventType] || eventType;
  };

  // Tradução de status para português
  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      DRAFT: "Pendente",
      ACTIVE: "Ativo",
      FINISHED: "Finalizado",
      CANCELLED: "Cancelado",
      PUBLISHED: "Publicado",
    };
    return texts[status] || status;
  };

  // Cores dos badges de status
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      DRAFT: "#6b7280",
      ACTIVE: "#10b981",
      FINISHED: "#3b82f6",
      CANCELLED: "#ef4444",
      PUBLISHED: "#8b5cf6",
    };
    return colors[status] || "#6b7280";
  };

  // Handlers de ações
  const handleView = (eventId: number) => {
    navigate(`/eventos/${eventId}`);
  };

  const handleEdit = (eventId: number) => {
    navigate(`/eventos/${eventId}/editar`);
  };

  const handleDelete = (eventId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      console.log("Excluir evento:", eventId);
      // Implementar lógica de exclusão
    }
  };

  return (
    <EntityTable
      entityName="event"
      apiEndpoint="/events"
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      showActions={true}
      customRenderers={{
        eventType: (value) => getSportText(value),
        status: (value) => (
          <span
            className="status-badge"
            style={{
              backgroundColor: getStatusColor(value),
              padding: "3px 6px",
              borderRadius: "12px",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {getStatusText(value)}
          </span>
        ),
      }}
    />
  );
};

export default AdminEventsPage;
