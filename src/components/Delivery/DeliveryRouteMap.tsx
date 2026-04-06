import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import motoIcon from "../../assets/moto.png";

export interface DeliveryStop {
  id?: number;
  address?: string;
  latitude: number;
  longitude: number;
  status?: string; // PENDING | COMPLETED | SKIPPED
  completionOrder?: number;
}

interface DeliveryRouteMapProps {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  fromAddress?: string;
  toAddress?: string;
  distance?: number;
  deliveryManGpsLatitude?: number;
  deliveryManGpsLongitude?: number;
  deliveryManName?: string;
  status?: string;
  inTransitAt?: string;
  /** Paradas intermediárias da entrega */
  stops?: DeliveryStop[];
  height?: string;
}

const DeliveryRouteMap: React.FC<DeliveryRouteMapProps> = ({
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
  fromAddress,
  toAddress,
  distance,
  deliveryManGpsLatitude,
  deliveryManGpsLongitude,
  deliveryManName,
  status,
  inTransitAt,
  stops = [],
  height = "400px",
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const center = {
    lat: (fromLatitude + toLatitude) / 2,
    lng: (fromLongitude + toLongitude) / 2,
  };

  // Paradas pendentes (não entregues nem puladas) para montar a rota
  const pendingStops = stops.filter(
    (s) => s.status !== "COMPLETED" && s.status !== "SKIPPED"
  );

  useEffect(() => {
    if (!map) return;

    try {
      const directionsService = new google.maps.DirectionsService();
      const origin = { lat: fromLatitude, lng: fromLongitude };

      // Determina destino final e waypoints
      // Se há stops, o destino é o último stop pendente; otherwise é toLatitude/toLongitude
      let destination: google.maps.LatLngLiteral;
      let waypoints: google.maps.DirectionsWaypoint[] = [];

      if (pendingStops.length > 0) {
        const lastStop = pendingStops[pendingStops.length - 1];
        destination = { lat: lastStop.latitude, lng: lastStop.longitude };
        waypoints = pendingStops.slice(0, -1).map((s) => ({
          location: { lat: s.latitude, lng: s.longitude },
          stopover: true,
        }));
      } else {
        destination = { lat: toLatitude, lng: toLongitude };
      }

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, routeStatus) => {
          if (routeStatus === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);

            // Soma distância e duração de todas as legs
            const route = result.routes[0];
            if (route?.legs) {
              let totalDistanceM = 0;
              let totalDurationS = 0;
              for (const leg of route.legs) {
                totalDistanceM += leg.distance?.value || 0;
                totalDurationS += leg.duration?.value || 0;
              }
              const distKm = (totalDistanceM / 1000).toFixed(1);
              const durMin = Math.ceil(totalDurationS / 60);
              setRouteInfo({
                distance: `${distKm} km`,
                duration: durMin >= 60
                  ? `${Math.floor(durMin / 60)}h ${durMin % 60}min`
                  : `${durMin} min`,
              });
            }

            // Ajusta o bounds para mostrar toda a rota + motoboy
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            waypoints.forEach((w) => {
              if (w.location) bounds.extend(w.location as google.maps.LatLngLiteral);
            });
            if (deliveryManGpsLatitude && deliveryManGpsLongitude) {
              bounds.extend({ lat: deliveryManGpsLatitude, lng: deliveryManGpsLongitude });
            }
            map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
          } else {
            console.error("❌ DeliveryRouteMap - Erro ao calcular rota:", routeStatus);
          }
        }
      );
    } catch (error) {
      console.error("❌ DeliveryRouteMap - Erro ao configurar mapa:", error);
    }
  }, [
    map,
    fromLatitude, fromLongitude,
    toLatitude, toLongitude,
    pendingStops.length, // eslint-disable-line react-hooks/exhaustive-deps
    deliveryManGpsLatitude, deliveryManGpsLongitude,
  ]);

  if (!apiKey) {
    return (
      <div style={{ height, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        Google Maps API Key não configurada
      </div>
    );
  }

  const origin = { lat: fromLatitude, lng: fromLongitude };
  const destination = { lat: toLatitude, lng: toLongitude };
  const deliveryManPosition =
    deliveryManGpsLatitude && deliveryManGpsLongitude
      ? { lat: deliveryManGpsLatitude, lng: deliveryManGpsLongitude }
      : null;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const remainingDistance = deliveryManPosition
    ? calculateDistance(deliveryManPosition.lat, deliveryManPosition.lng, toLatitude, toLongitude)
    : null;

  const calculateETA = () => {
    if (status !== "IN_TRANSIT" || !deliveryManPosition || !inTransitAt) return null;
    const distanceTraveled = calculateDistance(fromLatitude, fromLongitude, deliveryManPosition.lat, deliveryManPosition.lng);
    const distanceRemaining = calculateDistance(deliveryManPosition.lat, deliveryManPosition.lng, toLatitude, toLongitude);
    const elapsedHours = (Date.now() - new Date(inTransitAt).getTime()) / 3600000;
    if (elapsedHours < 0.0167) return null;
    const avgSpeed = distanceTraveled / elapsedHours;
    if (avgSpeed < 1) return null;
    return { minutes: Math.ceil((distanceRemaining / avgSpeed) * 60), avgSpeed };
  };

  const eta = calculateETA();
  const needsFlip = toLongitude - fromLongitude < 0;

  // Cores dos stops por status
  const stopColor = (s: DeliveryStop) => {
    if (s.status === "COMPLETED") return "#10b981"; // verde
    if (s.status === "SKIPPED") return "#9ca3af"; // cinza
    return "#f59e0b"; // amarelo = pendente
  };

  return (
    <>
      <style>{`
        @keyframes motoMarkerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .gm-style img[src*="moto.png"] {
          animation: motoMarkerPulse 1.5s ease-in-out infinite !important;
          ${needsFlip ? "transform: scaleX(-1) !important;" : ""}
        }
      `}</style>

      <div style={{ marginBottom: 0, border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)", backgroundColor: "white" }}>
        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height }}
            center={center}
            zoom={13}
            onLoad={setMap}
            options={{
              streetViewControl: false,
              fullscreenControl: true,
              mapTypeControl: true,
              mapTypeControlOptions: { style: 0, position: 3, mapTypeIds: ["roadmap", "satellite", "hybrid"] },
              zoomControl: true,
            }}
          >
            {/* Origem (verde) */}
            <Marker
              position={origin}
              title={fromAddress || "Origem"}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
            />

            {/* Destino final (vermelho) — só mostra se não há stops ou se é diferente do último stop */}
            {(stops.length === 0 || (stops[stops.length - 1]?.latitude !== toLatitude || stops[stops.length - 1]?.longitude !== toLongitude)) && (
              <Marker
                position={destination}
                title={toAddress || "Destino"}
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
              />
            )}

            {/* Paradas intermediárias com número */}
            {stops.map((stop, idx) => (
              <Marker
                key={`stop-${stop.id ?? idx}`}
                position={{ lat: stop.latitude, lng: stop.longitude }}
                title={`Parada ${idx + 1}${stop.address ? `: ${stop.address}` : ""}${stop.status === "COMPLETED" ? " ✓" : ""}`}
                icon={{
                  path: (typeof google !== "undefined" ? google.maps.SymbolPath.CIRCLE : 0),
                  scale: 10,
                  fillColor: stopColor(stop),
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                }}
                label={{
                  text: String(idx + 1),
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
                zIndex={500}
              />
            ))}

            {/* Motoboy */}
            {deliveryManPosition && (
              <Marker
                position={deliveryManPosition}
                title={deliveryManName ? `🏍️ ${deliveryManName}` : "🏍️ Motoboy em rota"}
                icon={{
                  url: motoIcon,
                  scaledSize: (typeof google !== "undefined" ? new google.maps.Size(40, 40) : undefined),
                  anchor: (typeof google !== "undefined" ? new google.maps.Point(20, 20) : undefined),
                }}
                zIndex={1000}
              />
            )}

            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: "#2563eb",
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    icons: [
                      {
                        icon: {
                          path: (typeof google !== "undefined" ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : 0),
                          scale: 3,
                          strokeColor: "#2563eb",
                          strokeWeight: 2,
                          fillColor: "#2563eb",
                          fillOpacity: 1,
                        },
                        offset: "25%",
                        repeat: "25%",
                      },
                    ],
                  },
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {/* Legenda */}
        <div style={{ padding: "16px 20px", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
          {/* Origem e destino */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "14px", marginBottom: (routeInfo || distance || deliveryManPosition || stops.length > 0) ? "12px" : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 250px" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e", flexShrink: 0 }} />
              <span style={{ color: "#374151" }}><strong>Origem:</strong> {fromAddress || "N/A"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 250px" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444", flexShrink: 0 }} />
              <span style={{ color: "#374151" }}><strong>Destino:</strong> {toAddress || "N/A"}</span>
            </div>
          </div>

          {/* Paradas */}
          {stops.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {stops.map((stop, idx) => (
                <div
                  key={stop.id ?? idx}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    backgroundColor: stop.status === "COMPLETED" ? "#f0fdf4" : stop.status === "SKIPPED" ? "#f9fafb" : "#fffbeb",
                    border: `1px solid ${stopColor(stop)}`,
                    borderRadius: "6px", padding: "4px 10px", fontSize: "13px",
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: stopColor(stop), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <span style={{ color: "#374151" }}>
                    {stop.address || `Parada ${idx + 1}`}
                    {stop.status === "COMPLETED" && <span style={{ marginLeft: 4, color: "#10b981" }}>✓</span>}
                    {stop.status === "SKIPPED" && <span style={{ marginLeft: 4, color: "#9ca3af" }}>–</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Métricas */}
          {(routeInfo || distance || deliveryManPosition || eta) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "14px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
              {(routeInfo?.distance || distance) && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: 18 }}>📏</span>
                  <span style={{ color: "#374151" }}><strong>Distância:</strong> {routeInfo?.distance || `${distance?.toFixed(2)} km`}</span>
                </div>
              )}
              {routeInfo?.duration && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: 18 }}>⏱️</span>
                  <span style={{ color: "#374151" }}><strong>Tempo est.:</strong> {routeInfo.duration}</span>
                </div>
              )}
              {deliveryManPosition && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#2563eb", flexShrink: 0 }} />
                  <span style={{ color: "#374151" }}><strong>🏍️ Motoboy:</strong> {deliveryManName || "Em rota"}</span>
                </div>
              )}
              {remainingDistance !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <span style={{ color: "#374151" }}><strong>Faltam:</strong> {remainingDistance.toFixed(2)} km</span>
                </div>
              )}
              {eta && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ecfdf5", padding: "6px 12px", borderRadius: "8px", border: "1px solid #10b981" }}>
                  <span style={{ fontSize: 18 }}>⏱️</span>
                  <span style={{ color: "#065f46", fontWeight: 600 }}>
                    <strong>Chegada em:</strong> {eta.minutes} min
                    <span style={{ fontSize: 12, color: "#059669", marginLeft: 6 }}>({eta.avgSpeed.toFixed(1)} km/h)</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DeliveryRouteMap;
