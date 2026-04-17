import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import DeliveryRouteMap, { type DeliveryStop } from "./DeliveryRouteMap";
import { FiX, FiRefreshCw } from "react-icons/fi";

interface DeliveryRouteMapModalProps {
  deliveryId: string | number;
  isOpen: boolean;
  onClose: () => void;
}

interface DeliveryData {
  fromLatitude?: number;
  fromLongitude?: number;
  toLatitude?: number;
  toLongitude?: number;
  fromAddress?: string;
  toAddress?: string;
  distanceKm?: number;
  status?: string;
  inTransitAt?: string;
  stops?: DeliveryStop[];
  courier?: {
    id: number;
    name: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  };
}

/** Statuses que justificam polling de posição GPS */
const LIVE_STATUSES = ["IN_TRANSIT", "ACCEPTED"];
const POLL_INTERVAL_MS = 5000;

/**
 * Modal de mapa de rota da entrega.
 * Quando IN_TRANSIT ou ACCEPTED, atualiza a posição do motoboy a cada 5s.
 */
const DeliveryRouteMapModal: React.FC<DeliveryRouteMapModalProps> = ({
  deliveryId,
  isOpen,
  onClose,
}) => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [actualRoute, setActualRoute] = useState<Array<{ lat: number; lng: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Carrega dados da corrida + rota real em paralelo */
  const loadDelivery = async () => {
    setLoading(true);
    setError(null);
    try {
      const deliveryPromise = api.get(`/api/deliveries/${deliveryId}`);
      const trackPromise = api.get(`/api/deliveries/${deliveryId}/tracking`).catch(() => null) as Promise<any>;
      const [response, trackingRes] = await Promise.all([deliveryPromise, trackPromise]);

      const data = response.data as any;

      // Parseia rota real se disponível
      let route: Array<{ lat: number; lng: number }> = [];
      if (trackingRes?.data?.route) {
        const geoJson = typeof trackingRes.data.route === 'string' ? JSON.parse(trackingRes.data.route) : trackingRes.data.route;
        if (geoJson?.type === 'LineString' && Array.isArray(geoJson.coordinates)) {
          route = geoJson.coordinates.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
        }
      }

      // Seta rota real ANTES do deliveryData — evita flash da rota azul
      setActualRoute(route);
      setDeliveryData({
        fromLatitude: data.fromLatitude,
        fromLongitude: data.fromLongitude,
        toLatitude: data.toLatitude,
        toLongitude: data.toLongitude,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        distanceKm: data.distanceKm,
        status: data.status,
        inTransitAt: data.inTransitAt,
        stops: data.stops ?? [],
        courier: data.courier,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erro ao carregar dados da corrida:", err);
      setError("Erro ao carregar dados da corrida");
    } finally {
      setLoading(false);
    }
  };

  /** Poll leve: só atualiza courier GPS e status */
  const pollCourierPosition = async () => {
    try {
      const response = await api.get(`/api/deliveries/${deliveryId}`);
      const data = response.data as any;
      setDeliveryData((prev) =>
        prev
          ? {
              ...prev,
              status: data.status,
              courier: data.courier,
              stops: data.stops ?? prev.stops,
            }
          : prev
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("⚠️ Polling falhou:", err);
    }
  };

  // Carga inicial quando modal abre
  useEffect(() => {
    if (!isOpen || !deliveryId) return;
    loadDelivery();
  }, [deliveryId, isOpen]);

  // Polling ativo quando entrega está em movimento
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const isLive = deliveryData?.status && LIVE_STATUSES.includes(deliveryData.status);
    if (!isOpen || !deliveryId || !isLive) return;

    pollTimerRef.current = setInterval(pollCourierPosition, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, deliveryId, deliveryData?.status]);

  // Limpa timer ao fechar
  useEffect(() => {
    if (!isOpen && pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLive = deliveryData?.status && LIVE_STATUSES.includes(deliveryData.status);

  // Para multi-stop sem toLatitude, usa último stop como destino
  const lastStop = deliveryData?.stops?.length
    ? deliveryData.stops[deliveryData.stops.length - 1]
    : null;
  const effectiveToLat = deliveryData?.toLatitude ?? lastStop?.latitude ?? deliveryData?.fromLatitude;
  const effectiveToLng = deliveryData?.toLongitude ?? lastStop?.longitude ?? deliveryData?.fromLongitude;

  const hasStops = (deliveryData?.stops?.length ?? 0) > 0 &&
    deliveryData?.stops?.some(s => s.latitude && s.longitude);

  const hasCoords =
    deliveryData?.fromLatitude !== undefined &&
    deliveryData?.fromLongitude !== undefined &&
    (
      (deliveryData?.toLatitude !== undefined && deliveryData?.toLongitude !== undefined) ||
      hasStops
    );

  return (
    <>
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9998, animation: "fadeIn 0.2s ease-in-out" }}
        onClick={onClose}
      />

      <div
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgb(0 0 0/0.1)", zIndex: 9999, width: "90%", maxWidth: "1200px", maxHeight: "90vh", overflow: "hidden", animation: "slideIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600, color: "#111827" }}>
              🗺️ Rota #{String(deliveryId).padStart(8, "0")}
            </h2>
            {isLive && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", backgroundColor: "#f0fdf4", border: "1px solid #10b981", borderRadius: "12px", padding: "2px 10px", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
                AO VIVO
              </span>
            )}
            {lastUpdated && isLive && (
              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={loadDelivery}
              title="Recarregar"
              style={{ background: "none", border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
            >
              <FiRefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0", fontSize: "28px", fontWeight: "300", lineHeight: "1", color: "#6b7280", transition: "color 0.15s" }}
              title="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: "24px", maxHeight: "calc(90vh - 80px)", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#6b7280" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: "4px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <p>Carregando mapa...</p>
              </div>
            </div>
          ) : error ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#ef4444" }}>
              {error}
            </div>
          ) : hasCoords ? (
            <DeliveryRouteMap
              fromLatitude={deliveryData!.fromLatitude!}
              fromLongitude={deliveryData!.fromLongitude!}
              toLatitude={effectiveToLat!}
              toLongitude={effectiveToLng!}
              fromAddress={deliveryData!.fromAddress}
              toAddress={deliveryData!.toAddress}
              distance={deliveryData!.distanceKm}
              deliveryManGpsLatitude={deliveryData!.courier?.gpsLatitude}
              deliveryManGpsLongitude={deliveryData!.courier?.gpsLongitude}
              deliveryManName={deliveryData!.courier?.name}
              status={deliveryData!.status}
              inTransitAt={deliveryData!.inTransitAt}
              stops={deliveryData!.stops}
              actualRoute={actualRoute.length >= 2 ? actualRoute : undefined}
              height="500px"
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#6b7280" }}>
              Dados de coordenadas não disponíveis para esta corrida
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
};

export default DeliveryRouteMapModal;
