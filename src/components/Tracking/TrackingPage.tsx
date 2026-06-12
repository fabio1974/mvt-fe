import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import BrandMark from "../Brand/BrandMark";
import BrandName from "../Brand/BrandName";
import "./TrackingPage.css";

const API_URL = (import.meta.env.VITE_API_URL || "https://mvt-events-api.onrender.com/api").replace(/\/api$/, "/api");

interface TrackingStop {
  stopOrder: number;
  address: string;
  latitude: number;
  longitude: number;
  recipientName: string;
  status: string;
  completedAt: string | null;
}

interface TrackingData {
  deliveryId: number;
  status: string;
  fromAddress: string;
  toAddress: string;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  recipientName: string;
  courierFirstName: string | null;
  courierLatitude: number | null;
  courierLongitude: number | null;
  vehicleType: string | null;
  vehicleDescription: string | null;
  acceptedAt: string | null;
  inTransitAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  stops: TrackingStop[] | null;
  plannedRoute: number[][] | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando motorista",
  WAITING_PAYMENT: "Aguardando pagamento",
  ACCEPTED: "Motorista a caminho",
  IN_TRANSIT: "Em trânsito",
  COMPLETED: "Entregue",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  WAITING_PAYMENT: "#f59e0b",
  ACCEPTED: "#3b82f6",
  IN_TRANSIT: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const STEPS = ["PENDING", "ACCEPTED", "IN_TRANSIT", "COMPLETED"];

function originSvg() {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="44">
      <rect x="13" y="20" width="4" height="24" rx="2" fill="#059669"/>
      <circle cx="15" cy="15" r="12" fill="#10b981" stroke="#059669" stroke-width="2"/>
      <text x="15" y="20" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">O</text>
    </svg>
  `)}`;
}

function stopSvg(num: number, color: string, border: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="44">
      <rect x="13" y="20" width="4" height="24" rx="2" fill="${border}"/>
      <circle cx="15" cy="15" r="12" fill="${color}" stroke="${border}" stroke-width="2"/>
      <text x="15" y="20" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${num}</text>
    </svg>
  `)}`;
}

function courierSvg() {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
      <circle cx="18" cy="18" r="16" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      <text x="18" y="24" text-anchor="middle" font-size="20">🏍️</text>
    </svg>
  `)}`;
}

function TrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const fetchTracking = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/tracking/${token}`);
      if (!res.ok) {
        setError("Link de rastreamento inválido ou expirado.");
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
      setError(null);

      // Para polling se entrega finalizada
      if (json.status === "COMPLETED" || json.status === "CANCELLED") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTracking]);

  if (loading) {
    return (
      <div className="tracking-loading">
        <div className="tracking-spinner" />
        <p>Carregando rastreamento...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="tracking-error">
        <div className="tracking-error-icon">📦</div>
        <h2>Rastreamento não encontrado</h2>
        <p>{error || "Este link de rastreamento é inválido ou expirou."}</p>
        <a href="/" className="tracking-home-link">Ir para o <BrandName /></a>
      </div>
    );
  }

  const currentStepIdx = STEPS.indexOf(data.status);
  const isActive = data.status === "ACCEPTED" || data.status === "IN_TRANSIT";

  // Centro do mapa
  const center = data.courierLatitude && data.courierLongitude
    ? { lat: data.courierLatitude, lng: data.courierLongitude }
    : { lat: data.fromLatitude, lng: data.fromLongitude };

  // Rota planejada
  const routePath = data.plannedRoute?.map(([lat, lng]) => ({ lat, lng })) || [];

  return (
    <div className="tracking-page">
      {/* Header */}
      <div className="tracking-header">
        <div className="tracking-logo"><BrandMark onDark height={20} /></div>
        <div className="tracking-delivery-id">Corrida #{String(data.deliveryId).padStart(6, "0")}</div>
      </div>

      {/* Status bar */}
      <div className="tracking-status-bar" style={{ background: STATUS_COLORS[data.status] || "#6b7280" }}>
        <span className="tracking-status-label">{STATUS_LABELS[data.status] || data.status}</span>
        {isActive && data.courierFirstName && (
          <span className="tracking-courier-name">
            {data.vehicleDescription ? `${data.courierFirstName} • ${data.vehicleDescription}` : data.courierFirstName}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {data.status !== "CANCELLED" && (
        <div className="tracking-progress">
          {STEPS.map((step, idx) => (
            <div key={step} className={`tracking-step ${idx <= currentStepIdx ? "active" : ""}`}>
              <div className="tracking-step-dot" />
              <span className="tracking-step-label">
                {step === "PENDING" ? "Pendente" : step === "ACCEPTED" ? "Aceita" : step === "IN_TRANSIT" ? "Em trânsito" : "Entregue"}
              </span>
              {idx < STEPS.length - 1 && <div className={`tracking-step-line ${idx < currentStepIdx ? "active" : ""}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Mapa */}
      <div className="tracking-map-container">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={14}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Origem */}
            <Marker
              position={{ lat: data.fromLatitude, lng: data.fromLongitude }}
              icon={{
                url: originSvg(),
                scaledSize: new google.maps.Size(30, 44),
                anchor: new google.maps.Point(15, 44),
              }}
              title="Origem"
            />

            {/* Paradas */}
            {data.stops?.map((stop, idx) => (
              <Marker
                key={idx}
                position={{ lat: stop.latitude, lng: stop.longitude }}
                icon={{
                  url: stopSvg(
                    idx + 1,
                    stop.status === "COMPLETED" ? "#10b981" : idx === (data.stops?.length || 1) - 1 ? "#ef4444" : "#f59e0b",
                    stop.status === "COMPLETED" ? "#059669" : idx === (data.stops?.length || 1) - 1 ? "#dc2626" : "#d97706",
                  ),
                  scaledSize: new google.maps.Size(30, 44),
                  anchor: new google.maps.Point(15, 44),
                }}
                title={stop.address}
              />
            ))}

            {/* Courier */}
            {data.courierLatitude && data.courierLongitude && isActive && (
              <Marker
                position={{ lat: data.courierLatitude, lng: data.courierLongitude }}
                icon={{
                  url: courierSvg(),
                  scaledSize: new google.maps.Size(36, 36),
                  anchor: new google.maps.Point(18, 18),
                }}
                title={data.courierFirstName || "Motorista"}
              />
            )}

            {/* Rota */}
            {routePath.length > 1 && (
              <Polyline
                path={routePath}
                options={{
                  strokeColor: "#3b82f6",
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                  icons: [{
                    icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: "#1d4ed8", fillOpacity: 1, strokeWeight: 1 },
                    repeat: "120px",
                    offset: "50%",
                  }],
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="tracking-map-loading">Carregando mapa...</div>
        )}
      </div>

      {/* Detalhes */}
      <div className="tracking-details">
        <div className="tracking-detail-card">
          <div className="tracking-detail-icon" style={{ color: "#10b981" }}>📍</div>
          <div>
            <div className="tracking-detail-label">Origem</div>
            <div className="tracking-detail-value">{data.fromAddress}</div>
          </div>
        </div>

        {data.stops && data.stops.length > 0 ? (
          data.stops.map((stop, idx) => (
            <div key={idx} className="tracking-detail-card">
              <div className="tracking-detail-icon" style={{ color: stop.status === "COMPLETED" ? "#10b981" : "#f59e0b" }}>
                {stop.status === "COMPLETED" ? "✅" : "📦"}
              </div>
              <div>
                <div className="tracking-detail-label">
                  Parada {stop.stopOrder} {stop.recipientName ? `— ${stop.recipientName}` : ""}
                </div>
                <div className="tracking-detail-value">{stop.address}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="tracking-detail-card">
            <div className="tracking-detail-icon" style={{ color: "#ef4444" }}>🏁</div>
            <div>
              <div className="tracking-detail-label">Destino {data.recipientName ? `— ${data.recipientName}` : ""}</div>
              <div className="tracking-detail-value">{data.toAddress}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="tracking-footer">
        <span>Rastreamento <BrandName /> • Atualizado a cada 10s</span>
      </div>
    </div>
  );
}

export default TrackingPage;
