import { useState, useEffect, useCallback, useRef } from "react";
import { FiSearch, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { isAdmin } from "../../utils/auth";
import { api } from "../../services/api";
import EventFilters, { type Filters } from "./EventFilters";
import "./AdminEventsPage.css";

interface Event {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  city: string;
  state: string;
  sport: string;
  category: string;
  status: string;
  organizationName: string;
  participantsCount: number;
  maxParticipants: number;
}

interface EventsResponse {
  content: Event[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    finished: 0,
    cancelled: 0,
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Estado dos filtros separado para evitar re-renders
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    sport: "",
    state: "",
    organizationName: "",
  });

  // Debounce ref for search
  const debounceRef = useRef<number>(0);
  const filtersRef = useRef<Filters>(filters);

  // Atualiza a ref quando os filtros mudam
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<{
        total: number;
        active: number;
        finished: number;
        cancelled: number;
      }>("/events/stats");
      setStats(response.data);
    } catch (_err) {
      console.error("Erro ao buscar estatísticas:", _err);
    }
  }, []);

  const fetchEvents = useCallback(
    async (customFilters?: Filters) => {
      try {
        setLoading(true);
        setError(null);

        const currentFilters = customFilters || filtersRef.current;

        const params = new URLSearchParams({
          page: (currentPage - 1).toString(),
          size: itemsPerPage.toString(),
          ...(currentFilters.search && { search: currentFilters.search }),
          ...(currentFilters.status && { status: currentFilters.status }),
          ...(currentFilters.sport && { sport: currentFilters.sport }),
          ...(currentFilters.state && { state: currentFilters.state }),
          ...(currentFilters.organizationName && {
            organizationName: currentFilters.organizationName,
          }),
        });

        const response = await api.get(`/events?${params}`);
        const data = response.data as Event[] | EventsResponse;

        // Se vier um array direto, use como eventos
        if (Array.isArray(data)) {
          setEvents(data);
          setTotalPages(Math.ceil(data.length / itemsPerPage));
          setTotalElements(data.length);
        } else {
          setEvents(data.content || []);
          setTotalPages(data.totalPages || 1);
          setTotalElements(data.totalElements || 0);
        }
      } catch (err) {
        setError("Erro ao carregar eventos. Tente novamente.");
        console.error("Erro ao buscar eventos:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage]
  );

  const handleFilterChange = useCallback(
    (field: keyof Filters, value: string) => {
      const newFilters = { ...filtersRef.current, [field]: value };
      setFilters(newFilters);
      setCurrentPage(1);

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce API call for 300ms
      debounceRef.current = window.setTimeout(() => {
        fetchEvents(newFilters);
      }, 300);
    },
    [fetchEvents]
  );

  const clearFilters = useCallback(() => {
    const emptyFilters: Filters = {
      search: "",
      status: "",
      sport: "",
      state: "",
      organizationName: "",
    };

    setFilters(emptyFilters);
    setCurrentPage(1);

    // Clear any pending debounced calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    fetchEvents(emptyFilters);
  }, [fetchEvents]);

  // Initial load
  useEffect(() => {
    if (isAdmin()) {
      fetchEvents();
      fetchStats();
    }
  }, [fetchEvents, fetchStats]);

  // Effect para paginação
  useEffect(() => {
    if (isAdmin()) {
      fetchEvents();
    }
  }, [currentPage, itemsPerPage, fetchEvents]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "#10b981",
      FINISHED: "#6b7280",
      CANCELLED: "#ef4444",
      PUBLISHED: "#3b82f6",
    };
    return colors[status] || "#6b7280";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      ACTIVE: "Ativo",
      FINISHED: "Finalizado",
      CANCELLED: "Cancelado",
      PUBLISHED: "Publicado",
    };
    return texts[status] || status;
  };

  const handleView = (eventId: number) => {
    console.log(`Visualizar evento: ${eventId}`);
  };

  const handleEdit = (eventId: number) => {
    console.log(`Editar evento: ${eventId}`);
  };

  const handleDelete = async (eventId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      try {
        await api.delete(`/events/${eventId}`);
        fetchEvents();
        fetchStats();
      } catch {
        alert("Erro ao excluir evento. Tente novamente.");
      }
    }
  };

  if (!isAdmin()) {
    return (
      <div className="admin-events-error">
        <p>
          Acesso negado. Você precisa ser um administrador para acessar esta
          página.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-events-page">
      <div className="admin-events-header">
        <h1>Gerenciar Eventos</h1>
        <p>Visualize e gerencie todos os eventos da plataforma</p>
      </div>

      {/* Estatísticas */}
      <div className="admin-events-stats">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total de Eventos</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: "#10b981" }}>{stats.active}</h3>
          <p>Eventos Ativos</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: "#6b7280" }}>{stats.finished}</h3>
          <p>Eventos Finalizados</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: "#ef4444" }}>{stats.cancelled}</h3>
          <p>Eventos Cancelados</p>
        </div>
      </div>

      {/* Filtros */}
      <EventFilters
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onRefresh={() => fetchEvents()}
        initialValues={filters}
      />

      {error && (
        <div className="admin-events-error">
          <p>{error}</p>
          <button className="btn-retry" onClick={() => fetchEvents()}>
            Tentar Novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-events-loading">
          <div className="loading-spinner"></div>
          <p>Carregando eventos...</p>
        </div>
      ) : (
        <div className="admin-events-table-container">
          <table className="admin-events-table">
            <thead>
              <tr>
                <th>NOME DO EVENTO</th>
                <th>DATA</th>
                <th>LOCAL</th>
                <th>ESPORTE</th>
                <th>ORGANIZAÇÃO</th>
                <th>STATUS</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(events) && events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-events">
                    <FiSearch
                      style={{
                        fontSize: "3rem",
                        color: "#d1d5db",
                        marginBottom: "1rem",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Nenhum evento encontrado
                    </p>
                    <p style={{ fontSize: "0.875rem" }}>
                      Tente ajustar os filtros para ver mais resultados
                    </p>
                  </td>
                </tr>
              ) : (
                (Array.isArray(events) ? events : []).map((event) => (
                  <tr key={event.id ?? Math.random()}>
                    <td>
                      <div className="event-name" title={event.name || ""}>
                        {event.name || "-"}
                      </div>
                    </td>
                    <td>
                      {event.eventDate ? formatDate(event.eventDate) : "-"}
                    </td>
                    <td>
                      {(event.city || "-") +
                        (event.state ? ", " + event.state : "")}
                    </td>
                    <td>{event.sport || "-"}</td>
                    <td>{event.organizationName || "-"}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(event.status || ""),
                        }}
                      >
                        {getStatusText(event.status || "-")}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleView(event.id)}
                          title="Visualizar evento"
                        >
                          <FiEye />
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(event.id)}
                          title="Editar evento"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(event.id)}
                          title="Excluir evento"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="admin-events-pagination">
          <div className="pagination-info">
            <span>
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, totalElements)} de{" "}
              {totalElements} eventos
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>

          <div className="pagination-controls">
            <button
              className="btn-page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              ««
            </button>
            <button
              className="btn-page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  className={`btn-page ${
                    currentPage === pageNum ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="btn-page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              ›
            </button>
            <button
              className="btn-page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;
