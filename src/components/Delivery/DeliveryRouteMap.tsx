import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import motoIcon from "../../assets/moto.png";

interface DeliveryRouteMapProps {
  /** Latitude de origem */
  fromLatitude: number;
  /** Longitude de origem */
  fromLongitude: number;
  /** Latitude de destino */
  toLatitude: number;
  /** Longitude de destino */
  toLongitude: number;
  /** Endereço de origem (para tooltip) */
  fromAddress?: string;
  /** Endereço de destino (para tooltip) */
  toAddress?: string;
  /** Distância em km */
  distance?: number;
  /** Latitude GPS do motoboy */
  deliveryManGpsLatitude?: number;
  /** Longitude GPS do motoboy */
  deliveryManGpsLongitude?: number;
  /** Nome do motoboy */
  deliveryManName?: string;
  /** Status da entrega */
  status?: string;
  /** Data/hora que entrou em trânsito */
  inTransitAt?: string;
  /** Altura do mapa (padrão: 400px) */
  height?: string;
}

/**
 * Componente de mapa mostrando rota entre origem e destino de uma entrega
 * 
 * Exibe:
 * - Marcador verde na origem
 * - Marcador vermelho no destino
 * - Marcador azul do motoboy (se disponível)
 * - Linha conectando origem e destino
 * - Distância calculada
 * - Zoom automático para mostrar todos os pontos
 */
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
  height = "400px",
}) => {

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calcula o centro do mapa (ponto médio entre origem e destino)
  const center = {
    lat: (fromLatitude + toLatitude) / 2,
    lng: (fromLongitude + toLongitude) / 2,
  };

  // Busca a rota usando Directions API quando o mapa carregar
  useEffect(() => {
    
    if (!map) return;

    try {
      const directionsService = new google.maps.DirectionsService();
      
      const origin = { lat: fromLatitude, lng: fromLongitude };
      const destination = { lat: toLatitude, lng: toLongitude };

      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            
            // Extrai informações da rota
            const route = result.routes[0];
            if (route && route.legs[0]) {
              const leg = route.legs[0];
              setRouteInfo({
                distance: leg.distance?.text || "",
                duration: leg.duration?.text || "",
              });
            }

            // Ajusta o zoom para mostrar a rota completa
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            
            // Se tem posição do motoboy, inclui no bounds
            if (deliveryManGpsLatitude && deliveryManGpsLongitude) {
              bounds.extend({ lat: deliveryManGpsLatitude, lng: deliveryManGpsLongitude });
            }

            map.fitBounds(bounds, {
              top: 80,
              bottom: 80,
              left: 80,
              right: 80,
            });
          } else {
            console.error("❌ DeliveryRouteMap - Erro ao calcular rota:", status);
          }
        }
      );
    } catch (error) {
      console.error("❌ DeliveryRouteMap - Erro ao configurar mapa:", error);
    }
  }, [map, fromLatitude, fromLongitude, toLatitude, toLongitude, deliveryManGpsLatitude, deliveryManGpsLongitude]);

  if (!apiKey) {
    console.warn("⚠️ DeliveryRouteMap - API Key não encontrada");
    return (
      <div
        style={{
          height,
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
        }}
      >
        Google Maps API Key não configurada
      </div>
    );
  }

  // Coordenadas da origem e destino
  const origin = { lat: fromLatitude, lng: fromLongitude };
  const destination = { lat: toLatitude, lng: toLongitude };
  
  // Coordenadas do motoboy (se disponível)
  const deliveryManPosition = deliveryManGpsLatitude && deliveryManGpsLongitude
    ? { lat: deliveryManGpsLatitude, lng: deliveryManGpsLongitude }
    : null;

  /**
   * Calcula a distância entre dois pontos usando a fórmula de Haversine
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Calcula a distância restante até o destino
   */
  const calculateRemainingDistance = (): number | null => {
    if (!deliveryManPosition) {
      return null;
    }

    try {
      const distanceRemaining = calculateDistance(
        deliveryManPosition.lat,
        deliveryManPosition.lng,
        toLatitude,
        toLongitude
      );
      return distanceRemaining;
    } catch (error) {
      console.error("Erro ao calcular distância restante:", error);
      return null;
    }
  };

  /**
   * Calcula o ETA (tempo estimado de chegada) em minutos
   * Só retorna ETA se houver movimento detectável (velocidade >= 1 km/h)
   */
  const calculateETA = (): { minutes: number; avgSpeed: number } | null => {

    // Só calcula se estiver em trânsito e tiver todas as informações necessárias
    if (status !== "IN_TRANSIT" || !deliveryManPosition || !inTransitAt) {
      return null;
    }

    try {
      // Calcula distância percorrida (origem até posição atual do motoboy)
      const distanceTraveled = calculateDistance(
        fromLatitude,
        fromLongitude,
        deliveryManPosition.lat,
        deliveryManPosition.lng
      );

      // Calcula distância restante (posição atual até destino)
      const distanceRemaining = calculateDistance(
        deliveryManPosition.lat,
        deliveryManPosition.lng,
        toLatitude,
        toLongitude
      );

      // Calcula tempo decorrido desde que entrou em trânsito
      const startTime = new Date(inTransitAt).getTime();
      const currentTime = new Date().getTime();
      const timeElapsedHours = (currentTime - startTime) / (1000 * 60 * 60); // em horas

      // Se passou menos de 1 minuto, não temos dados suficientes
      if (timeElapsedHours < 0.0167) { // 0.0167h = 1 minuto
        return null;
      }

      // Calcula velocidade média (km/h)
      const avgSpeed = distanceTraveled / timeElapsedHours;

      // Se velocidade muito baixa (< 1 km/h), provavelmente parado
      if (avgSpeed < 1) {
        return null;
      }

      // Calcula tempo estimado para percorrer distância restante
      const etaHours = distanceRemaining / avgSpeed;
      const etaMinutes = Math.ceil(etaHours * 60);

      return { minutes: etaMinutes, avgSpeed };
    } catch (error) {
      console.error("Erro ao calcular ETA:", error);
      return null;
    }
  };

  const remainingDistance = calculateRemainingDistance();
  const eta = calculateETA();

  /**
   * Calcula o ângulo da rota (de origem para destino) em graus
   * Retorna true se a moto deve ficar virada para esquerda (flip horizontal)
   */
  const shouldFlipMoto = (): boolean => {
    // Calcula diferença de longitude (leste/oeste)
    const deltaLng = toLongitude - fromLongitude;
    
    // Se destino está mais à esquerda (oeste) que origem, flip a moto
    return deltaLng < 0;
  };

  const needsFlip = shouldFlipMoto();

  return (
    <>
      {/* CSS para animação do marker da moto */}
      <style>
        {`
          @keyframes motoMarkerPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
          }
          .gm-style img[src*="moto.png"] {
            animation: motoMarkerPulse 1.5s ease-in-out infinite !important;
            ${needsFlip ? 'transform: scaleX(-1) !important;' : ''}
          }
        `}
      </style>
      
      <div
        style={{
          marginBottom: "0",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        backgroundColor: "white",
      }}
    >
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
            mapTypeControlOptions: {
              style: 0, // HORIZONTAL_BAR
              position: 3, // TOP_RIGHT
              mapTypeIds: ["roadmap", "satellite", "hybrid"],
            },
            zoomControl: true,
          }}
        >
          {/* Marcador de origem (verde) */}
          <Marker
            position={origin}
            title={fromAddress || "Origem"}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
          />

          {/* Marcador de destino (vermelho) */}
          <Marker
            position={destination}
            title={toAddress || "Destino"}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }}
          />

          {/* Marcador do motoboy (ícone PNG piscante) - apenas se tiver posição GPS */}
          {deliveryManPosition && (
            <Marker
              position={deliveryManPosition}
              title={deliveryManName ? `🏍️ Motoboy: ${deliveryManName}` : "🏍️ Motoboy em rota"}
              icon={{
                url: motoIcon,
                scaledSize: typeof google !== 'undefined' ? new google.maps.Size(40, 40) : undefined,
                anchor: typeof google !== 'undefined' ? new google.maps.Point(20, 20) : undefined,
              }}
              zIndex={1000}
            />
          )}

          {/* Renderiza a rota real seguindo as estradas */}
          {directions && (
            <DirectionsRenderer 
              directions={directions}
              options={{
                suppressMarkers: true, // Não mostra marcadores padrão (já temos os customizados)
                polylineOptions: {
                  strokeColor: "#2563eb",
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                  icons: typeof google !== 'undefined' ? [
                    {
                      icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 3,
                        strokeColor: "#2563eb",
                        strokeWeight: 2,
                        fillColor: "#2563eb",
                        fillOpacity: 1,
                      },
                      offset: "25%",
                      repeat: "25%",
                    },
                  ] : undefined,
                },
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {/* Legenda e informações */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {/* Linha 1: Origem e Destino */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            fontSize: "14px",
            marginBottom: distance || deliveryManPosition ? "12px" : "0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 300px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#374151" }}>
              <strong>Origem:</strong> {fromAddress || "N/A"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 300px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#374151" }}>
              <strong>Destino:</strong> {toAddress || "N/A"}
            </span>
          </div>
        </div>

        {/* Linha 2: Distância, Motoboy e ETA */}
        {(routeInfo || distance || deliveryManPosition || eta) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              fontSize: "14px",
              paddingTop: "12px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            {/* Distância da Rota (se calculada pela API) ou Distância Direta */}
            {(routeInfo?.distance || distance) && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>📏</span>
                <span style={{ color: "#374151" }}>
                  <strong>Distância:</strong>{" "}
                  {routeInfo?.distance || `${distance?.toFixed(2)} km`}
                </span>
              </div>
            )}

            {/* Tempo Estimado (da API) */}
            {routeInfo?.duration && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>⏱️</span>
                <span style={{ color: "#374151" }}>
                  <strong>Tempo Est.:</strong> {routeInfo.duration}
                </span>
              </div>
            )}

            {/* Motoboy */}
            {deliveryManPosition && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#2563eb",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#374151" }}>
                  <strong>🏍️ Motoboy:</strong> {deliveryManName || "Em rota"}
                </span>
              </div>
            )}

            {/* Distância Restante (sempre mostra se tiver posição GPS) */}
            {remainingDistance !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>📍</span>
                <span style={{ color: "#374151" }}>
                  <strong>Faltam:</strong> {remainingDistance.toFixed(2)} km
                </span>
              </div>
            )}

            {/* ETA - Previsão de chegada */}
            {eta && (
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  backgroundColor: "#ecfdf5",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #10b981",
                }}
              >
                <span style={{ fontSize: "18px" }}>⏱️</span>
                <span style={{ color: "#065f46", fontWeight: "600" }}>
                  <strong>Chegada em:</strong> {eta.minutes} min
                  <span style={{ fontSize: "12px", color: "#059669", marginLeft: "6px" }}>
                    ({eta.avgSpeed.toFixed(1)} km/h)
                  </span>
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
