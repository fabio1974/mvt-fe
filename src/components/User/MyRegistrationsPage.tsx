import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { getUserId } from "../../utils/auth";
import PaymentProcessor from "../Payment/PaymentProcessor";
import {
  FiCalendar,
  FiMapPin,
  FiActivity,
  FiClock,
  FiDollarSign,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCreditCard,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import "./MyRegistrationsPage.css";

interface Registration {
  id: number;
  registrationDate: string;
  status: "ACTIVE" | "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  event: {
    id: number;
    name: string;
    description: string;
    startsAt: string;
    eventDate: string;
    eventTime?: string;
    location: string;
    // Campos opcionais para compatibilidade
    title?: string;
    startDate?: string;
    endDate?: string;
    city?: string;
    state?: string;
    price?: number;
    maxParticipants?: number;
    imageUrl?: string;
    eventType?: string;
    slug?: string;
  };
  user: {
    id: string;
    name: string;
  };
  payments: Array<{
    id: number;
    amount: number;
    paymentMethod: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
    createdAt: string;
  }>;
}

export default function MyRegistrationsPage() {
  const navigate = useNavigate();
  const userId = getUserId();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "pending" | "confirmed" | "cancelled"
  >("all");

  // Helper functions to simulate backend methods
  const getLatestPayment = (registration: Registration) => {
    if (!registration.payments || registration.payments.length === 0) {
      return null;
    }
    return registration.payments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  const getPaymentStatus = (registration: Registration) => {
    const latestPayment = getLatestPayment(registration);
    return latestPayment?.status || "PENDING";
  };

  const getPaymentAmount = (registration: Registration) => {
    const latestPayment = getLatestPayment(registration);
    // Prioridade: amount do payment > price do evento > fallback 50.0
    const amount = latestPayment?.amount || registration.event.price || 50.0;
    return amount;
  };

  const isPaid = (registration: Registration) => {
    const latestPayment = getLatestPayment(registration);
    return latestPayment?.status === "COMPLETED";
  };

  const fetchMyRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      // Usar o endpoint correto do backend
      const response = await api.get("/registrations/my-registrations");

      // Validação defensiva para garantir que seja um array
      const data = response.data;
      if (Array.isArray(data)) {
        setRegistrations(data as Registration[]);
      } else {
        console.warn("API returned non-array data:", data);
        setRegistrations([]);
        setError("Formato de dados inválido recebido do servidor.");
      }
    } catch (err) {
      setError(
        "Erro ao carregar suas inscrições. Verifique se você está logado e tente novamente."
      );
      console.error("Erro ao buscar inscrições:", err);
      setRegistrations([]); // Garantir que seja array em caso de erro
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchMyRegistrations();
  }, [userId, navigate, fetchMyRegistrations]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: {
        className: "status-badge status-confirmed",
        text: "Ativa",
        icon: FiCheck,
      },
      PENDING: {
        className: "status-badge status-pending",
        text: "Pendente",
        icon: FiClock,
      },
      CONFIRMED: {
        className: "status-badge status-confirmed",
        text: "Confirmada",
        icon: FiCheck,
      },
      CANCELLED: {
        className: "status-badge status-cancelled",
        text: "Cancelada",
        icon: FiX,
      },
      EXPIRED: {
        className: "status-badge status-expired",
        text: "Expirada",
        icon: FiAlertCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={config.className}>
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        className: "status-badge payment-pending",
        text: "Pagamento Pendente",
      },
      PROCESSING: {
        className: "status-badge payment-processing",
        text: "Processando",
      },
      COMPLETED: { className: "status-badge payment-completed", text: "Pago" },
      FAILED: {
        className: "status-badge payment-failed",
        text: "Falha no Pagamento",
      },
      CANCELLED: {
        className: "status-badge payment-cancelled",
        text: "Cancelado",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <span className={config.className}>
        <FiDollarSign size={12} />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handlePayment = (registration: Registration) => {
    console.log("=== PAYMENT BUTTON CLICKED ===");
    console.log("Registration:", registration);
    console.log("Registration ID:", registration.id);
    console.log("Payment Amount:", getPaymentAmount(registration));

    setSelectedRegistration(registration);
    setShowPayment(true);

    console.log("Selected Registration set to:", registration);
    console.log("Show Payment set to:", true);
  };

  const handlePaymentSuccess = () => {
    console.log("=== PAYMENT SUCCESS ===");
    setShowPayment(false);
    setSelectedRegistration(null);
    fetchMyRegistrations(); // Refresh data
  };

  const handlePaymentCancel = () => {
    console.log("=== PAYMENT CANCELLED ===");
    setShowPayment(false);
    setSelectedRegistration(null);
  };

  const handleViewEvent = (eventSlug?: string, eventId?: number) => {
    if (eventSlug) {
      navigate(`/evento/${eventSlug}`);
    } else if (eventId) {
      navigate(`/evento/${eventId}`);
    }
  };

  const filteredRegistrations = (registrations || []).filter((reg) => {
    if (filter === "all") return true;
    return reg.status.toLowerCase() === filter;
  });

  const getFilterCount = (filterType: string) => {
    if (filterType === "all") return (registrations || []).length;
    return (registrations || []).filter(
      (reg) => reg.status.toLowerCase() === filterType
    ).length;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <FiRefreshCw className="loading-spinner" />
          <p className="loading-text">Carregando suas inscrições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-registrations-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Minhas Inscrições</h1>
          <p className="page-subtitle">
            Gerencie suas inscrições em eventos, pagamentos e certificados
          </p>
        </div>

        {/* Filters */}
        <div className="filters-container">
          {[
            { key: "all", label: "Todas" },
            { key: "active", label: "Ativas" },
            { key: "pending", label: "Pendentes" },
            { key: "confirmed", label: "Confirmadas" },
            { key: "cancelled", label: "Canceladas" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() =>
                setFilter(
                  key as
                    | "all"
                    | "active"
                    | "pending"
                    | "confirmed"
                    | "cancelled"
                )
              }
              className={`filter-button ${
                filter === key ? "active" : "inactive"
              }`}
            >
              {label} ({getFilterCount(key)})
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <FiAlertCircle className="info-icon" />
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Content */}
        {filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <FiActivity className="empty-state-icon" />
            <h3 className="empty-state-title">
              {filter === "all"
                ? "Nenhuma inscrição encontrada"
                : `Nenhuma inscrição ${filter}`}
            </h3>
            <p className="empty-state-subtitle">
              {filter === "all"
                ? "Você ainda não se inscreveu em nenhum evento."
                : `Você não possui inscrições com status ${filter}.`}
            </p>
            <button
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  const eventsSection =
                    document.getElementById("explorar-eventos");
                  if (eventsSection) {
                    eventsSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
              }}
              className="empty-state-button"
            >
              Explorar Eventos
            </button>
          </div>
        ) : (
          <div className="registrations-grid">
            {filteredRegistrations.map((registration) => (
              <div key={registration.id} className="registration-card">
                <div className="card-content">
                  {/* Header */}
                  <div className="card-header">
                    <div className="card-title-section">
                      <h3 className="card-title">{registration.event.title}</h3>
                      <div className="status-badges">
                        {getStatusBadge(registration.status)}
                        {getPaymentStatusBadge(getPaymentStatus(registration))}
                      </div>
                    </div>

                    {registration.event.price && (
                      <div className="price-section">
                        <div className="price-value">
                          {formatCurrency(registration.event.price)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="event-info-grid">
                    <div className="info-item">
                      <FiCalendar className="info-icon" />
                      <span>{formatDate(registration.event.eventDate)}</span>
                    </div>
                    <div className="info-item">
                      <FiMapPin className="info-icon" />
                      <span>
                        {registration.event.city}, {registration.event.state}
                      </span>
                    </div>
                    <div className="info-item">
                      <FiActivity className="info-icon" />
                      <span>{registration.event.eventType}</span>
                    </div>
                    <div className="info-item">
                      <FiClock className="info-icon" />
                      <span>
                        Inscrito em {formatDate(registration.registrationDate)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="event-description">
                    {registration.event.description}
                  </p>

                  {/* Actions */}
                  <div className="card-actions">
                    <button
                      onClick={() =>
                        handleViewEvent(
                          registration.event.slug,
                          registration.event.id
                        )
                      }
                      className="action-button secondary"
                    >
                      <FiEye />
                      <span>Ver Evento</span>
                    </button>

                    {getPaymentStatus(registration) === "PENDING" &&
                      registration.status === "PENDING" && (
                        <button
                          onClick={() => {
                            console.log("Botão de pagamento clicado!");
                            console.log("Registration:", registration);
                            handlePayment(registration);
                          }}
                          className="action-button success"
                        >
                          <FiCreditCard />
                          <span>Realizar Pagamento</span>
                        </button>
                      )}

                    {getPaymentStatus(registration) === "FAILED" && (
                      <button
                        onClick={() => {
                          console.log("Botão de retry clicado!");
                          console.log("Registration:", registration);
                          handlePayment(registration);
                        }}
                        className="action-button warning"
                      >
                        <FiRefreshCw />
                        <span>Tentar Novamente</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && selectedRegistration && (
          <div className="payment-modal">
            <div className="payment-modal-content">
              <div className="payment-modal-header">
                <h2 className="payment-modal-title">
                  Pagamento -{" "}
                  {selectedRegistration.event.title ||
                    selectedRegistration.event.name}
                </h2>
                <button
                  onClick={handlePaymentCancel}
                  className="payment-modal-close"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="payment-modal-body">
                <PaymentProcessor
                  registrationId={selectedRegistration.id}
                  amount={getPaymentAmount(selectedRegistration)}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentCancel={handlePaymentCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
