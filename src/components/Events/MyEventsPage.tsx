import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { getOrganizationId, getUserRole } from "../../utils/auth";

interface Event {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  location: string;
  city: string;
  state: string;
  eventType: string;
  status: string;
  maxParticipants?: number;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"created" | "registered">(
    "created"
  );

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);

        const userRole = getUserRole();
        const organizationId = getOrganizationId();

        // Buscar eventos criados pelo organizador (usando o organizationId)
        if (userRole === "ROLE_ORGANIZER" || userRole === "ROLE_ADMIN") {
          if (organizationId) {
            const createdResponse = await api.get(
              `/events/organization/${organizationId}`
            );
            setEvents((createdResponse.data as Event[]) || []);
          } else {
            setEvents([]);
            console.warn("Organizador sem organizationId definido");
          }
        } else {
          setEvents([]);
        }

        // Buscar eventos que o usuário se inscreveu
        try {
          const registrationsResponse = await api.get(
            "/registrations/my-registrations"
          );
          setRegistrations((registrationsResponse.data as Event[]) || []);
        } catch (regError) {
          console.warn("Erro ao carregar inscrições:", regError);
          setRegistrations([]);
        }
      } catch (err) {
        setError("Erro ao carregar eventos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          padding: "40px 20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #0099ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: 16,
          }}
        />
        <p style={{ color: "#666", fontSize: "1.1rem" }}>
          Carregando seus eventos...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
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
      <h2
        style={{
          color: "#0099ff",
          fontSize: "1.8rem",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Meus Eventos
      </h2>

      {/* Tabs */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <button
          onClick={() => setActiveTab("created")}
          style={{
            padding: "12px 24px",
            margin: "0 8px",
            border: "none",
            borderRadius: 8,
            background: activeTab === "created" ? "#0099ff" : "#f8f9fa",
            color: activeTab === "created" ? "white" : "#666",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Eventos Criados ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("registered")}
          style={{
            padding: "12px 24px",
            margin: "0 8px",
            border: "none",
            borderRadius: 8,
            background: activeTab === "registered" ? "#0099ff" : "#f8f9fa",
            color: activeTab === "registered" ? "white" : "#666",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Minhas Inscrições ({registrations.length})
        </button>
      </div>

      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {error && (
          <div
            style={{ color: "#e74c3c", textAlign: "center", marginBottom: 24 }}
          >
            {error}
          </div>
        )}

        {activeTab === "created" && (
          <div>
            {events.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  backgroundColor: "white",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  textAlign: "center",
                }}
              >
                <h3 style={{ color: "#0099ff", marginBottom: 16 }}>
                  Nenhum evento encontrado
                </h3>
                <p style={{ color: "#666", marginBottom: 24 }}>
                  Você ainda não criou nenhum evento para sua organização.
                </p>
                <button
                  onClick={() => (window.location.href = "/create-event")}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#0099ff",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Criar Primeiro Evento
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: 24,
                      backgroundColor: "white",
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <h3
                        style={{
                          color: "#0099ff",
                          marginBottom: 0,
                          fontSize: "1.2rem",
                        }}
                      >
                        {event.name}
                      </h3>
                      <span
                        style={{
                          padding: "4px 12px",
                          backgroundColor:
                            event.status === "ACTIVE" ? "#e8f5e8" : "#fff3cd",
                          color:
                            event.status === "ACTIVE" ? "#2d7d32" : "#856404",
                          borderRadius: 16,
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        {event.status === "ACTIVE" ? "Ativo" : event.status}
                      </span>
                    </div>

                    <p
                      style={{
                        color: "#666",
                        marginBottom: 16,
                        lineHeight: 1.5,
                      }}
                    >
                      {event.description}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 12,
                        fontSize: "0.9rem",
                        color: "#555",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>📅</span>
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>📍</span>
                        <span>
                          {event.city}, {event.state}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>🏃</span>
                        <span>{event.eventType}</span>
                      </div>
                      {event.maxParticipants && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span>👥</span>
                          <span>
                            Máx: {event.maxParticipants} participantes
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        paddingTop: 16,
                        borderTop: "1px solid #e9ecef",
                      }}
                    >
                      <button
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#0099ff",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        Ver Detalhes
                      </button>
                      <button
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "transparent",
                          color: "#0099ff",
                          border: "1px solid #0099ff",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "transparent",
                          color: "#666",
                          border: "1px solid #ddd",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        Inscrições
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "registered" && (
          <div>
            {registrations.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  backgroundColor: "white",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  textAlign: "center",
                }}
              >
                <p>Você ainda não se inscreveu em nenhum evento.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {registrations.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: 24,
                      backgroundColor: "white",
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <h3 style={{ color: "#0099ff", marginBottom: 8 }}>
                      {event.name}
                    </h3>
                    <p style={{ color: "#666", marginBottom: 12 }}>
                      {event.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: "0.9rem",
                        color: "#888",
                      }}
                    >
                      <span>📅 {formatDate(event.eventDate)}</span>
                      <span>
                        📍 {event.city}, {event.state}
                      </span>
                      <span>🏃 {event.eventType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
