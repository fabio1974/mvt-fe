import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { getEventUrl } from "../../../utils/slug";

interface Event {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  eventType: string;
  startsAt: string;
  eventDate: string;
  eventTime?: string;
  location: string;
  address?: string;
  maxParticipants?: number;
  registrationOpen: boolean;
  registrationStartDate?: string;
  registrationEndDate?: string;
  price?: number;
  currency: string;
  termsAndConditions?: string;
  bannerUrl?: string;
  status: string;
  platformFeePercentage?: number;
  transferFrequency: string;
}

type EventCardProps = {
  id: number;
  image: string;
  date: string;
  title: string;
  location: string;
  city: string;
};
function EventCard({ id, image, date, title, location, city }: EventCardProps) {
  const eventUrl = getEventUrl(title, id);

  return (
    <Link to={eventUrl} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          width: 280,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "0 12px",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "pointer",
          border: "1px solid #f1f3f4",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-8px)";
          e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.15)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
        }}
      >
        <div
          style={{
            position: "relative",
            width: 240,
            height: 160,
            marginBottom: 16,
          }}
        >
          <img
            src={image}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 16,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(8px)",
              borderRadius: 12,
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              color: "#0099ff",
              border: "1px solid rgba(0, 153, 255, 0.2)",
            }}
          >
            {date}
          </div>
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 18,
            marginBottom: 12,
            textAlign: "center",
            width: "100%",
            color: "#1a1a1a",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#666",
            marginBottom: 6,
            width: "100%",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>📅</span> {location}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#666",
            marginBottom: 20,
            width: "100%",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>📍</span> {city}
        </div>
        <button
          style={{
            border: "2px solid #0099ff",
            borderRadius: 12,
            padding: "12px 20px",
            background: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            color: "#0099ff",
            fontSize: 14,
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#0099ff";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.color = "#0099ff";
          }}
        >
          Confira este evento
        </button>
      </div>
    </Link>
  );
}
export default function Section4() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Função para formatar a data
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Função para formatar a data completa para location
  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Gerar imagem dummy baseada no índice
  const getDummyImage = (index: number) => {
    const colors = ["0099ff", "cccccc", "222", "ff4444", "00cc66", "ff8800"];
    const color = colors[index % colors.length];
    const textColor =
      color === "222" || color === "ff4444"
        ? "fff"
        : color === "cccccc"
        ? "222"
        : "fff";
    return `https://dummyimage.com/228x140/${color}/${textColor}.png&text=Evento+${
      index + 1
    }`;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        // Buscar eventos públicos usando o endpoint específico
        const response = await api.get("/events/public");

        const eventsData = response.data as Event[];

        // Filtrar apenas eventos publicados e ordenar por data
        const publishedEvents = eventsData
          .filter((event) => event.status === "PUBLISHED")
          .sort(
            (a, b) =>
              new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          )
          .slice(0, 6); // Limitar a 6 eventos

        setEvents(publishedEvents);
      } catch (err) {
        console.error("Erro ao carregar eventos públicos:", err);
        setError("Erro ao carregar eventos públicos do servidor");

        // Fallback: usar dados mock se a API falhar
        const mockEvents: Event[] = [
          {
            id: 1,
            createdAt: "2025-08-23T10:00:00",
            updatedAt: "2025-08-23T10:00:00",
            name: "Copa Kids Edição Par 2025",
            slug: "copa-kids-edicao-par-2025",
            description: "Copa Kids Edição Par 2025",
            eventType: "RUNNING",
            startsAt: "2025-08-23T10:00:00",
            eventDate: "2025-08-23",
            location: "Vila Velha/ES",
            maxParticipants: 100,
            registrationOpen: true,
            currency: "BRL",
            status: "PUBLISHED",
            transferFrequency: "WEEKLY",
          },
          {
            id: 2,
            createdAt: "2025-09-20T08:00:00",
            updatedAt: "2025-09-20T08:00:00",
            name: "20º Revezamento São Chico",
            slug: "20-revezamento-sao-chico",
            description: "20º Revezamento São Chico",
            eventType: "RELAY",
            startsAt: "2025-09-20T08:00:00",
            eventDate: "2025-09-20",
            location: "São Francisco do Sul/SC",
            maxParticipants: 200,
            registrationOpen: true,
            currency: "BRL",
            status: "PUBLISHED",
            transferFrequency: "WEEKLY",
          },
          {
            id: 3,
            createdAt: "2025-09-20T14:00:00",
            updatedAt: "2025-09-20T14:00:00",
            name: "FREITAS CUP - Etapa ESP",
            slug: "freitas-cup-etapa-esp",
            description: "FREITAS CUP - Etapa ESP",
            eventType: "CUP",
            startsAt: "2025-09-20T14:00:00",
            eventDate: "2025-09-20",
            location: "São Paulo/SP",
            maxParticipants: 300,
            registrationOpen: true,
            currency: "BRL",
            status: "PUBLISHED",
            transferFrequency: "WEEKLY",
          },
          {
            id: 4,
            createdAt: "2025-09-21T09:00:00",
            updatedAt: "2025-09-21T09:00:00",
            name: "Kenda Cup Championship",
            slug: "kenda-cup-championship",
            description: "Kenda Cup Championship",
            eventType: "CHAMPIONSHIP",
            startsAt: "2025-09-21T09:00:00",
            eventDate: "2025-09-21",
            location: "Bueno Brandão/MG",
            maxParticipants: 150,
            registrationOpen: true,
            currency: "BRL",
            status: "PUBLISHED",
            transferFrequency: "WEEKLY",
          },
        ];
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Transformar os dados da API para o formato do EventCard
  const eventCards = events.map((event, index) => ({
    id: event.id,
    image: getDummyImage(index),
    date: formatEventDate(event.eventDate),
    title: event.name,
    location: formatFullDate(event.eventDate),
    city: event.location, // Usar location como city
  }));
  if (loading) {
    return (
      <div
        style={{
          background: "#f8f9fa",
          padding: "80px 0 100px 0",
          margin: "-40px -24px",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "4px solid #e9ecef",
            borderTop: "4px solid #0099ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: 24,
          }}
        />
        <h3
          style={{
            color: "#1a1a1a",
            fontSize: "1.4rem",
            fontWeight: 600,
            margin: 0,
            fontFamily: "'Inter', Arial, sans-serif",
          }}
        >
          Carregando eventos incríveis...
        </h3>
        <p
          style={{
            color: "#6c757d",
            fontSize: "1rem",
            margin: "8px 0 0 0",
          }}
        >
          Aguarde um momento
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
        <h2
          style={{
            fontSize: "2.8rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 32,
            color: "#1a1a1a",
            fontFamily: "'Inter', Arial, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Atleta, encontre seu próximo desafio
        </h2>

        {error && (
          <div
            style={{
              textAlign: "center",
              color: "#dc3545",
              marginBottom: 32,
              padding: "16px 24px",
              backgroundColor: "#f8d7da",
              borderRadius: 12,
              margin: "0 auto 32px auto",
              maxWidth: 600,
              border: "1px solid #f5c6cb",
            }}
          >
            {error} - Exibindo eventos de exemplo
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 40,
          }}
        >
          <button
            style={{
              border: "2px solid #0099ff",
              borderRadius: 12,
              padding: "14px 28px",
              background: "#ffffff",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#0099ff",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0, 153, 255, 0.15)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#0099ff";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#0099ff";
            }}
            onClick={() => (window.location.href = "/eventos")}
          >
            Ver todos os eventos <span style={{ fontSize: 20 }}>→</span>
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {eventCards.length > 0 ? (
            eventCards.map((eventCard, idx) => (
              <EventCard key={`event-${idx}`} {...eventCard} />
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#6c757d",
                fontSize: "1.2rem",
                padding: "60px 20px",
                backgroundColor: "#ffffff",
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏃‍♂️</div>
              <p style={{ margin: 0, fontWeight: 500 }}>
                Nenhum evento disponível no momento.
              </p>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "1rem",
                  color: "#8e9297",
                }}
              >
                Novos desafios em breve!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
