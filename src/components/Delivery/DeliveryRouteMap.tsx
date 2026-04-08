import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow, Polyline } from "@react-google-maps/api";
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
  /** Rota real percorrida (actual_route do banco) — se fornecida, desenha polyline em vez de Google Directions */
  actualRoute?: Array<{ lat: number; lng: number }>;
  height?: string;
}

const DeliveryRouteMap: React.FC<DeliveryRouteMapProps> = ({
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
  fromAddress,
  toAddress,
  distance: _distance,
  deliveryManGpsLatitude,
  deliveryManGpsLongitude,
  deliveryManName,
  status: _status,
  inTransitAt: _inTransitAt,
  stops = [],
  actualRoute,
  height = "400px",
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [_routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
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
    // Se tem rota real, não precisa calcular via Google Directions
    if (actualRoute && actualRoute.length >= 2) return;

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
    map, actualRoute,
    fromLatitude, fromLongitude,
    toLatitude, toLongitude,
    pendingStops.length, // eslint-disable-line react-hooks/exhaustive-deps
    deliveryManGpsLatitude, deliveryManGpsLongitude,
  ]);

  // Ajusta zoom para caber toda a rota real
  useEffect(() => {
    if (!map || !actualRoute || actualRoute.length < 2) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: fromLatitude, lng: fromLongitude });
    actualRoute.forEach(p => bounds.extend(p));
    stops.forEach(s => {
      if (s.latitude && s.longitude) bounds.extend({ lat: s.latitude, lng: s.longitude });
    });
    if (deliveryManGpsLatitude && deliveryManGpsLongitude) {
      bounds.extend({ lat: deliveryManGpsLatitude, lng: deliveryManGpsLongitude });
    }
    map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
  }, [map, actualRoute, fromLatitude, fromLongitude, stops, deliveryManGpsLatitude, deliveryManGpsLongitude]);

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

  const needsFlip = toLongitude - fromLongitude < 0;

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
            {/* Origem (pirulito verde) */}
            <Marker
              position={origin}
              icon={typeof google !== "undefined" ? {
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                fillColor: "#22c55e",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
                scale: 1.8,
                anchor: new google.maps.Point(12, 22),
              } : undefined}
              onClick={() => setSelectedPin("origin")}
            >
              {selectedPin === "origin" && (
                <InfoWindow onCloseClick={() => setSelectedPin(null)}>
                  <div style={{ fontSize: 13 }}>
                    <strong>Origem (coleta)</strong><br />
                    {fromAddress || "N/A"}
                  </div>
                </InfoWindow>
              )}
            </Marker>

            {/* Destino final (pirulito vermelho) — só se não duplicado com último stop */}
            {(stops.length === 0 || (stops[stops.length - 1]?.latitude !== toLatitude || stops[stops.length - 1]?.longitude !== toLongitude)) && (
              <Marker
                position={destination}
                icon={typeof google !== "undefined" ? {
                  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                  fillColor: "#ef4444",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                  scale: 1.8,
                  anchor: new google.maps.Point(12, 22),
                } : undefined}
                onClick={() => setSelectedPin("dest")}
              >
                {selectedPin === "dest" && (
                  <InfoWindow onCloseClick={() => setSelectedPin(null)}>
                    <div style={{ fontSize: 13 }}>
                      <strong>Destino final</strong><br />
                      {toAddress || "N/A"}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            )}

            {/* Paradas (pirulitos laranja/verde com número) */}
            {stops.map((stop, idx) => {
              const isLast = idx === stops.length - 1;
              const color = stop.status === "COMPLETED" ? "#22c55e" : stop.status === "SKIPPED" ? "#9ca3af" : isLast ? "#ef4444" : "#f59e0b";
              return (
                <Marker
                  key={`stop-${stop.id ?? idx}`}
                  position={{ lat: stop.latitude, lng: stop.longitude }}
                  icon={typeof google !== "undefined" ? {
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                    scale: 1.8,
                    anchor: new google.maps.Point(12, 22),
                    labelOrigin: new google.maps.Point(12, 10),
                  } : undefined}
                  label={{ text: String(idx + 1), color: "#fff", fontWeight: "bold", fontSize: "12px" }}
                  zIndex={500}
                  onClick={() => setSelectedPin(`stop-${idx}`)}
                >
                  {selectedPin === `stop-${idx}` && (
                    <InfoWindow onCloseClick={() => setSelectedPin(null)}>
                      <div style={{ fontSize: 13 }}>
                        <strong>{isLast ? "Destino final" : `Parada ${idx + 1}`}</strong>
                        {stop.status && <span style={{ marginLeft: 6, color: stop.status === "COMPLETED" ? "#22c55e" : "#9ca3af" }}>
                          {stop.status === "COMPLETED" ? "✓ Entregue" : stop.status === "SKIPPED" ? "– Pulada" : "⏳ Pendente"}
                        </span>}<br />
                        {stop.address || `Parada ${idx + 1}`}
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              );
            })}

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

            {/* Rota real (actual_route do banco) tem prioridade sobre Google Directions */}
            {actualRoute && actualRoute.length >= 2 ? (
              <Polyline
                path={actualRoute}
                options={{
                  strokeColor: "#111827",
                  strokeOpacity: 0.9,
                  strokeWeight: 4,
                }}
              />
            ) : directions ? (
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
            ) : null}
          </GoogleMap>
        </LoadScript>

      </div>
    </>
  );
};

export default DeliveryRouteMap;
