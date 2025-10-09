import EntityCRUD from "../Generic/EntityCRUD";

/**
 * EXEMPLO AVANÇADO - EventsCRUDPage com customizações visuais
 *
 * Use este exemplo SE você quiser customizar a renderização de campos específicos
 * na tabela (ex: badges coloridos para status).
 *
 * IMPORTANTE: As traduções dos enums já vêm do backend no metadata!
 * Só customize se precisar de formatação visual especial (cores, ícones, etc).
 */
const EventsCRUDPageAdvanced: React.FC = () => {
  // Exemplo: customizar apenas a COR do badge de status
  // O texto já vem traduzido do backend
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

  return (
    <EntityCRUD
      entityName="event"
      pageTitle="Eventos"
      pageDescription="Gerencie todos os eventos da plataforma"
      customRenderers={{
        // Customiza APENAS a aparência visual do status
        // O valor já vem traduzido do backend
        status: (value) => (
          <span
            className="status-badge"
            style={{
              backgroundColor: getStatusColor(String(value)),
              padding: "3px 6px",
              borderRadius: "12px",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {String(value)}
          </span>
        ),
      }}
    />
  );
};

export default EventsCRUDPageAdvanced;
