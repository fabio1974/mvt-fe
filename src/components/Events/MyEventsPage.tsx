import { useState, useEffect } from "react";
import { api } from "../../services/api";

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

        // Buscar eventos criados pelo usuário (se for organizador)
        const createdResponse = await api.get("/events/my-events");
        setEvents((createdResponse.data as Event[]) || []);

        // Buscar eventos que o usuário se inscreveu
        const registrationsResponse = await api.get(
          "/registrations/my-registrations"
        );
        setRegistrations((registrationsResponse.data as Event[]) || []);
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
        }}
      >
        <p>Carregando eventos...</p>
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
                <p>Você ainda não criou nenhum evento.</p>
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
                      <span>📊 {event.status}</span>
                      {event.maxParticipants && (
                        <span>👥 Máx: {event.maxParticipants}</span>
                      )}
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
