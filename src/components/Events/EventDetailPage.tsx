import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { extractIdFromSlug } from "../../utils/slug";
import { getUserRole } from "../../utils/auth";
import DummyImage from "../dummy_images/DummyImage";
import "./EventDetailPage.css";

interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  slug?: string;
  image?: string;
  categories?: Array<{
    id: number;
    name: string;
    minAge?: number | null;
    maxAge?: number | null;
    gender?: string | null;
    distance?: number | null;
    distanceUnit?: string | null;
    price?: number | null;
    maxParticipants?: number | null;
    observations?: string | null;
  }>;
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se usuário está logado
  const isLoggedIn = Boolean(localStorage.getItem("authToken"));

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        // Extrair ID do slug usando utilitário
        const eventId = extractIdFromSlug(slug);
        if (!eventId) {
          setError("URL inválida");
          return;
        }

        // Verificar se é ADMIN ou ORGANIZER para poder ver eventos não publicados
        const userRole = getUserRole();
        const isAdminOrOrganizer =
          userRole === "ROLE_ADMIN" || userRole === "ROLE_ORGANIZER";

        // ADMIN e ORGANIZER podem ver qualquer evento (publicado ou não)
        // Outros usuários só veem eventos públicos
        const endpoint = isAdminOrOrganizer
          ? `/events/${eventId}`
          : `/events/public/${eventId}`;

        const response = await api.get(endpoint);
        setEvent(response.data as Event);
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setError("Evento não encontrado");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuito";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "#22c55e";
      case "DRAFT":
        return "#f59e0b";
      case "CANCELLED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Publicado";
      case "DRAFT":
        return "Rascunho";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            className="event-detail-loading"
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #0099ff",
              borderRadius: "50%",
            }}
          />
          <p style={{ color: "#6b7280", margin: 0 }}>Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          padding: "32px",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          Evento não encontrado
        </h2>
        <p
          style={{
            color: "#6b7280",
            marginBottom: "32px",
            fontSize: "1.1rem",
          }}
        >
          O evento que você está procurando não existe ou foi removido.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#0099ff",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0077cc")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0099ff")}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header com imagem principal */}
      <div
        className="event-detail-hero"
        style={{
          position: "relative",
          height: "60vh",
          minHeight: "400px",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Imagem de fundo (dummy por enquanto) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            opacity: 0.1,
          }}
        />

        {/* Container da imagem */}
        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            height: "80%",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <DummyImage alt={`Imagem do evento ${event.name}`} />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div
        className="event-detail-content"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <div
          className="event-detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "40px",
          }}
        >
          {/* Coluna principal */}
          <div>
            {/* Status badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                backgroundColor: getStatusColor(event.status),
                color: "white",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: "600",
                marginBottom: "16px",
              }}
            >
              {getStatusLabel(event.status)}
            </div>

            {/* Título */}
            <h1
              className="event-detail-title"
              style={{
                fontSize: "3rem",
                fontWeight: "800",
                color: "#1f2937",
                lineHeight: "1.1",
                marginBottom: "16px",
              }}
            >
              {event.name}
            </h1>

            {/* Localização */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#6b7280",
                fontSize: "1.1rem",
                marginBottom: "32px",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="10"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {event.location}
            </div>

            {/* Descrição */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "32px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                marginBottom: "32px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#1f2937",
                  marginBottom: "16px",
                }}
              >
                Sobre o evento
              </h2>
              <p
                style={{
                  color: "#4b5563",
                  lineHeight: "1.7",
                  fontSize: "1.1rem",
                  margin: 0,
                  marginBottom:
                    event.categories && event.categories.length > 0
                      ? "32px"
                      : 0,
                }}
              >
                {event.description}
              </p>

              {/* Categorias do Evento */}
              {event.categories && event.categories.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "700",
                      color: "#1f2937",
                      marginBottom: "16px",
                      marginTop: "32px",
                    }}
                  >
                    Categorias
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    {event.categories.map((category, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "16px 20px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#0099ff",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "1rem",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            {category.name}
                          </p>
                          {category.observations && (
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "0.875rem",
                                color: "#6b7280",
                              }}
                            >
                              {category.observations}
                            </p>
                          )}
                        </div>
                        {category.price !== null &&
                          category.price !== undefined && (
                            <div
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#e3f2fd",
                                borderRadius: "6px",
                                flexShrink: 0,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.9rem",
                                  fontWeight: "600",
                                  color: "#0099ff",
                                }}
                              >
                                {category.price === 0
                                  ? "Gratuito"
                                  : new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(category.price)}
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "32px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                position: "sticky",
                top: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  color: "#1f2937",
                  marginBottom: "24px",
                }}
              >
                Informações do evento
              </h3>

              {/* Data de início */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Data de início
                </label>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#1f2937",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {formatDate(event.startDate)}
                </p>
              </div>

              {/* Data de término */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Data de término
                </label>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#1f2937",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {formatDate(event.endDate)}
                </p>
              </div>

              {/* Participantes */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Participantes
                </label>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#1f2937",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {event.currentParticipants} / {event.maxParticipants}
                </p>

                {/* Indicador de vagas */}
                <p
                  style={{
                    fontSize: "0.85rem",
                    color:
                      event.maxParticipants - event.currentParticipants <= 5
                        ? "#ef4444"
                        : "#22c55e",
                    margin: "4px 0 0 0",
                    fontWeight: "600",
                  }}
                >
                  {event.maxParticipants - event.currentParticipants === 0
                    ? "🔴 Evento lotado"
                    : event.maxParticipants - event.currentParticipants <= 5
                    ? `⚠️ Apenas ${
                        event.maxParticipants - event.currentParticipants
                      } vagas restantes`
                    : `✅ ${
                        event.maxParticipants - event.currentParticipants
                      } vagas disponíveis`}
                </p>
                {/* Barra de progresso */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    marginTop: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${
                        (event.currentParticipants / event.maxParticipants) *
                        100
                      }%`,
                      height: "100%",
                      backgroundColor: "#0099ff",
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Preço */}
              <div style={{ marginBottom: "32px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Preço
                </label>
                <p
                  style={{
                    fontSize: "1.5rem",
                    color: "#0099ff",
                    margin: 0,
                    fontWeight: "700",
                  }}
                >
                  {formatPrice(event.price)}
                </p>
              </div>

              {/* Botão de inscrição */}
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    alert(
                      "Você precisa estar logado para se inscrever no evento."
                    );
                    navigate("/login");
                    return;
                  }
                  if (event.status !== "PUBLISHED") {
                    alert("Inscrições não estão disponíveis para este evento.");
                    return;
                  }
                  navigate(`/evento/${slug}/inscricao`);
                }}
                disabled={event.status !== "PUBLISHED"}
                style={{
                  width: "100%",
                  background:
                    event.status !== "PUBLISHED" ? "#9ca3af" : "#0099ff",
                  color: "white",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  cursor:
                    event.status !== "PUBLISHED" ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  if (event.status === "PUBLISHED") {
                    e.currentTarget.style.background = "#0077cc";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (event.status === "PUBLISHED") {
                    e.currentTarget.style.background = "#0099ff";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {event.status !== "PUBLISHED"
                  ? "Inscrições indisponíveis"
                  : isLoggedIn
                  ? "Fazer Inscrição"
                  : "Fazer login para se inscrever"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
