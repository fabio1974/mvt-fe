import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow } from "@react-google-maps/api";
import { FiPlus, FiTrash2, FiChevronRight, FiChevronLeft, FiMapPin, FiCheck } from "react-icons/fi";
import { AddressFieldWithMap } from "../Common/AddressFieldWithMap";
import type { AddressData } from "../Common/AddressMapPicker";
import { api } from "../../services/api";
import "./DeliveryWizard.css";

const MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

export interface WizardStop {
  id: string; // local key
  addressData: AddressData;
  recipientName: string;
  recipientPhone: string;
  itemDescription: string;
  itemValue: string; // valor COD em formato display (ex: "25,00")
}

interface DeliveryWizardProps {
  /** Dados pré-preenchidos (ex: cliente logado) */
  defaultValues?: {
    client?: { id: number | string; label: string };
    fromAddress?: string;
    fromLatitude?: number;
    fromLongitude?: number;
  };
  onSuccess: (deliveryId: number) => void;
  onCancel: () => void;
}

const emptyAddress = (): AddressData => ({
  address: "",
  latitude: 0,
  longitude: 0,
  city: "",
  state: "",
  zipCode: "",
});

const makeStopId = () => `stop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DeliveryWizard: React.FC<DeliveryWizardProps> = ({
  defaultValues,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1 — Origem
  const [originAddress, setOriginAddress] = useState<string>(defaultValues?.fromAddress ?? "");
  const [originData, setOriginData] = useState<AddressData>({
    address: defaultValues?.fromAddress ?? "",
    latitude: defaultValues?.fromLatitude ?? 0,
    longitude: defaultValues?.fromLongitude ?? 0,
    city: "",
    state: "",
    zipCode: "",
  });

  // Step 2 — Paradas
  const emptyStop = (): WizardStop => ({
    id: makeStopId(),
    addressData: emptyAddress(),
    recipientName: "",
    recipientPhone: "",
    itemDescription: "",
    itemValue: "",
  });
  const [stops, setStops] = useState<WizardStop[]>([emptyStop()]);

  // Step 3 — Resumo (calculado ao avançar para step 3)
  const [routeInfo, setRouteInfo] = useState<{
    directions: google.maps.DirectionsResult | null;
    totalDistanceKm: number;
    totalDurationMin: number;
    pricePerKm: number;
    estimatedPrice: number;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: MAPS_LIBRARIES,
  });

  // -----------------------------------------------------------------------
  // Step 1 helpers
  // -----------------------------------------------------------------------

  const handleOriginChange = (address: string, data?: AddressData) => {
    setOriginAddress(address);
    if (data) setOriginData(data);
  };

  const handleOriginDataChange = (data: AddressData) => {
    setOriginAddress(data.address);
    setOriginData(data);
  };

  // -----------------------------------------------------------------------
  // Step 2 helpers
  // -----------------------------------------------------------------------

  const addStop = () => {
    setStops((prev) => [...prev, emptyStop()]);
  };

  const removeStop = (id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, addressData: AddressData) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, addressData } : s)));
  };

  const updateStopAddress = (id: string, address: string) => {
    setStops((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, addressData: { ...s.addressData, address } } : s
      )
    );
  };

  const updateStopField = (id: string, field: keyof WizardStop, value: string) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  /** Formata telefone brasileiro: (XX) XXXXX-XXXX */
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  /** Soma dos valores COD de todas as paradas */
  const totalAmount = stops.reduce((sum, s) => {
    // Remove pontos de milhar e troca vírgula decimal por ponto
    const val = parseFloat((s.itemValue || "0").replace(/\./g, "").replace(",", "."));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  const step1Valid = originAddress.trim() !== "";
  const step2Valid = stops.length > 0 && stops.every((s) => s.addressData.address.trim() !== "");

  // -----------------------------------------------------------------------
  // Route calculation (step 2 → 3)
  // -----------------------------------------------------------------------

  const calculateRoute = useCallback(async () => {
    if (!isLoaded || stops.length === 0) return;

    setRouteLoading(true);
    try {
      // Busca pricePerKm da configuração do site
      let pricePerKm = 3.5; // fallback
      try {
        const configResp = await api.get("/api/site-configuration");
        const config = configResp.data as any;
        const raw = Array.isArray(config)
          ? config.find((c: any) => c.key === "pricePerKm")?.value
          : config?.pricePerKm ?? config?.price_per_km;
        if (raw) pricePerKm = parseFloat(String(raw));
      } catch {
        // usa fallback silenciosamente
      }

      // Monta rota via Directions API
      const origin = originData.latitude && originData.longitude
        ? { lat: originData.latitude, lng: originData.longitude }
        : originData.address;

      const lastStop = stops[stops.length - 1];
      const destination = lastStop.addressData.latitude && lastStop.addressData.longitude
        ? { lat: lastStop.addressData.latitude, lng: lastStop.addressData.longitude }
        : lastStop.addressData.address;

      const waypoints: google.maps.DirectionsWaypoint[] = stops.slice(0, -1).map((s) => ({
        location:
          s.addressData.latitude && s.addressData.longitude
            ? { lat: s.addressData.latitude, lng: s.addressData.longitude }
            : s.addressData.address,
        stopover: true,
      }));

      const directionsService = new google.maps.DirectionsService();
      const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (res, status) => {
            resolve(status === google.maps.DirectionsStatus.OK ? res : null);
          }
        );
      });

      let totalDistanceM = 0;
      let totalDurationS = 0;
      if (result?.routes[0]?.legs) {
        for (const leg of result.routes[0].legs) {
          totalDistanceM += leg.distance?.value ?? 0;
          totalDurationS += leg.duration?.value ?? 0;
        }
      }

      const totalDistanceKm = totalDistanceM / 1000;
      const totalDurationMin = Math.ceil(totalDurationS / 60);
      const estimatedPrice = parseFloat((totalDistanceKm * pricePerKm).toFixed(2));

      setRouteInfo({ directions: result, totalDistanceKm, totalDurationMin, pricePerKm, estimatedPrice });
    } catch (err) {
      console.error("Erro ao calcular rota:", err);
    } finally {
      setRouteLoading(false);
    }
  }, [isLoaded, originData, stops]);

  const goToStep3 = async () => {
    await calculateRoute();
    setStep(3);
  };

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const lastStop = stops[stops.length - 1];
      const payload: Record<string, unknown> = {
        fromAddress: originAddress,
        fromLatitude: originData.latitude || undefined,
        fromLongitude: originData.longitude || undefined,
        toAddress: lastStop.addressData.address,
        toLatitude: lastStop.addressData.latitude || undefined,
        toLongitude: lastStop.addressData.longitude || undefined,
        recipientName: stops[0]?.recipientName || undefined,
        recipientPhone: stops[0]?.recipientPhone?.replace(/\D/g, "") || undefined,
        itemDescription: stops[0]?.itemDescription || undefined,
        totalAmount: totalAmount > 0 ? totalAmount.toFixed(2) : undefined,
        distanceKm: routeInfo?.totalDistanceKm
          ? parseFloat(routeInfo.totalDistanceKm.toFixed(2))
          : undefined,
        notes: notes.trim() || undefined,
        stops: stops.map((s, idx) => ({
          address: s.addressData.address,
          latitude: s.addressData.latitude || undefined,
          longitude: s.addressData.longitude || undefined,
          recipientName: s.recipientName || undefined,
          recipientPhone: s.recipientPhone?.replace(/\D/g, "") || undefined,
          itemDescription: s.itemDescription || undefined,
          plannedOrder: idx + 1,
        })),
      };

      // Pré-preenche client se disponível
      if (defaultValues?.client) {
        payload.client = { id: defaultValues.client.id };
      }

      const response = await api.post("/api/deliveries", payload);
      const data = response.data as any;
      onSuccess(data.id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Erro ao criar entrega. Tente novamente.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Preview map for step 2
  // -----------------------------------------------------------------------

  const previewCenter =
    originData.latitude && originData.longitude
      ? { lat: originData.latitude, lng: originData.longitude }
      : { lat: -3.7327, lng: -38.5267 };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const StepIndicator = () => (
    <div className="wizard-steps">
      {(["1", "2", "3"] as const).map((s) => {
        const n = parseInt(s);
        const active = step === n;
        const done = step > n;
        return (
          <React.Fragment key={s}>
            <div className={`wizard-step ${active ? "active" : done ? "done" : ""}`}>
              <div className="wizard-step-circle">
                {done ? <FiCheck size={14} /> : n}
              </div>
              <span className="wizard-step-label">
                {s === "1" ? "Origem" : s === "2" ? "Paradas" : "Revisar"}
              </span>
            </div>
            {n < 3 && <div className={`wizard-step-connector ${done ? "done" : ""}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // -----------------------------------------------------------------------
  // Steps render
  // -----------------------------------------------------------------------

  const renderStep1 = () => (
    <div className="wizard-content">
      <h3 className="wizard-section-title">
        <FiMapPin /> Endereço de coleta (origem)
      </h3>
      <p className="wizard-section-desc">De onde o motoboy vai retirar a encomenda?</p>
      <AddressFieldWithMap
        value={originAddress}
        onChange={handleOriginChange}
        onAddressDataChange={handleOriginDataChange}
        initialLatitude={originData.latitude || undefined}
        initialLongitude={originData.longitude || undefined}
        label="Endereço de Origem"
        placeholder="Ex: Rua das Flores, 123 - Centro"
        required
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-content">
      <h3 className="wizard-section-title">
        <FiMapPin /> Paradas de entrega
      </h3>
      <p className="wizard-section-desc">
        Adicione os endereços de entrega em ordem. O motoboy vai seguir essa sequência.
      </p>

      <div className="wizard-stops-list">
        {stops.map((stop, idx) => (
          <div key={stop.id} className="wizard-stop-item">
            <div className="wizard-stop-header">
              <div className="wizard-stop-badge">{idx + 1}</div>
              <span className="wizard-stop-label">
                {idx === stops.length - 1 && stops.length === 1
                  ? "Destino final"
                  : idx === stops.length - 1
                  ? "Destino final"
                  : `Parada ${idx + 1}`}
              </span>
              {stops.length > 1 && (
                <button
                  type="button"
                  className="wizard-stop-remove"
                  onClick={() => removeStop(stop.id)}
                  title="Remover parada"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
            </div>
            <AddressFieldWithMap
              value={stop.addressData.address}
              onChange={(addr, data) => {
                if (data) updateStop(stop.id, data);
                else updateStopAddress(stop.id, addr);
              }}
              onAddressDataChange={(data) => updateStop(stop.id, data)}
              initialLatitude={stop.addressData.latitude || undefined}
              initialLongitude={stop.addressData.longitude || undefined}
              label={`Parada ${idx + 1}`}
              placeholder="Ex: Av. Bezerra de Menezes, 456"
              required
            />

            {/* Detalhes da parada — mesmo fluxo do mobile */}
            <div className="wizard-stop-details">
              <div className="wizard-stop-details-row">
                <div className="wizard-stop-field">
                  <label>Nome do destinatário</label>
                  <input
                    type="text"
                    placeholder="Quem vai receber?"
                    value={stop.recipientName}
                    onChange={(e) => updateStopField(stop.id, "recipientName", e.target.value)}
                  />
                </div>
                <div className="wizard-stop-field">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    placeholder="(85) 99999-9999"
                    value={stop.recipientPhone}
                    onChange={(e) => updateStopField(stop.id, "recipientPhone", formatPhone(e.target.value))}
                  />
                </div>
              </div>
              <div className="wizard-stop-details-row">
                <div className="wizard-stop-field" style={{ flex: 2 }}>
                  <label>Descrição do item</label>
                  <input
                    type="text"
                    placeholder="Ex: Caixa com documentos"
                    value={stop.itemDescription}
                    onChange={(e) => updateStopField(stop.id, "itemDescription", e.target.value)}
                  />
                </div>
                <div className="wizard-stop-field" style={{ flex: 1 }}>
                  <label>Valor a cobrar (R$)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={stop.itemValue}
                    onChange={(e) => {
                      // Extrai apenas dígitos
                      const digits = e.target.value.replace(/\D/g, "");
                      if (!digits) { updateStopField(stop.id, "itemValue", ""); return; }
                      // Converte para centavos → reais com 2 casas decimais
                      const cents = parseInt(digits, 10);
                      const formatted = (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      updateStopField(stop.id, "itemValue", formatted);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="wizard-add-stop" onClick={addStop}>
        <FiPlus size={16} /> Adicionar parada
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-content">
      <h3 className="wizard-section-title">
        <FiCheck /> Resumo e confirmação
      </h3>

      {routeLoading ? (
        <div className="wizard-loading">
          <div className="wizard-spinner" />
          <p>Calculando rota e preço...</p>
        </div>
      ) : (
        <>
          {/* Rota resumida */}
          <div className="wizard-summary-route">
            <div className="wizard-summary-point origin">
              <div className="wizard-summary-dot" style={{ background: "#22c55e" }} />
              <div>
                <div className="wizard-summary-point-label">Origem (coleta)</div>
                <div className="wizard-summary-point-address">{originAddress || "—"}</div>
              </div>
            </div>
            {stops.map((stop, idx) => (
              <div key={stop.id} className="wizard-summary-point">
                <div className="wizard-summary-dot" style={{ background: idx === stops.length - 1 ? "#ef4444" : "#f59e0b" }}>
                  <span style={{ fontSize: 9, color: "white", fontWeight: "bold" }}>{idx + 1}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="wizard-summary-point-label">
                    {idx === stops.length - 1 ? "Destino final" : `Parada ${idx + 1}`}
                  </div>
                  <div className="wizard-summary-point-address">{stop.addressData.address || "—"}</div>
                  {(stop.recipientName || stop.recipientPhone || stop.itemDescription) && (
                    <div className="wizard-summary-stop-details">
                      {stop.recipientName && <span>👤 {stop.recipientName}</span>}
                      {stop.recipientPhone && <span>📞 {stop.recipientPhone}</span>}
                      {stop.itemDescription && <span>📦 {stop.itemDescription}</span>}
                      {stop.itemValue && <span>💰 R$ {stop.itemValue}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mapa da rota com pins customizados */}
          {isLoaded && routeInfo?.directions && (
            <div style={{ marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "280px" }}
                center={previewCenter}
                zoom={12}
                onLoad={(m) => {
                  mapRef.current = m;
                  // Fit bounds para todos os pontos
                  const bounds = new google.maps.LatLngBounds();
                  if (originData.latitude && originData.longitude) bounds.extend({ lat: originData.latitude, lng: originData.longitude });
                  stops.forEach((s) => {
                    if (s.addressData.latitude && s.addressData.longitude) bounds.extend({ lat: s.addressData.latitude, lng: s.addressData.longitude });
                  });
                  m.fitBounds(bounds, 40);
                }}
                options={{ disableDefaultUI: true, zoomControl: true }}
                onClick={() => setSelectedMarker(null)}
              >
                <DirectionsRenderer
                  directions={routeInfo.directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: { strokeColor: "#2563eb", strokeOpacity: 0.85, strokeWeight: 4 },
                  }}
                />

                {/* Pin de origem (verde) */}
                {originData.latitude && originData.longitude && (
                  <Marker
                    position={{ lat: originData.latitude, lng: originData.longitude }}
                    icon={{
                      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                      fillColor: "#22c55e",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 1.8,
                      anchor: new google.maps.Point(12, 22),
                    }}
                    onClick={() => setSelectedMarker(-1)}
                  >
                    {selectedMarker === -1 && (
                      <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                        <div style={{ fontSize: 13 }}>
                          <strong>Origem (coleta)</strong><br />
                          {originAddress}
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                )}

                {/* Pins das paradas (laranja para intermediárias, vermelho para final) */}
                {stops.map((stop, idx) => {
                  if (!stop.addressData.latitude || !stop.addressData.longitude) return null;
                  const isLast = idx === stops.length - 1;
                  const color = isLast ? "#ef4444" : "#f59e0b";
                  return (
                    <Marker
                      key={stop.id}
                      position={{ lat: stop.addressData.latitude, lng: stop.addressData.longitude }}
                      label={{ text: String(idx + 1), color: "#fff", fontWeight: "bold", fontSize: "12px" }}
                      icon={{
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                        fillColor: color,
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                        scale: 1.8,
                        anchor: new google.maps.Point(12, 22),
                        labelOrigin: new google.maps.Point(12, 10),
                      }}
                      onClick={() => setSelectedMarker(idx)}
                    >
                      {selectedMarker === idx && (
                        <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                          <div style={{ fontSize: 13 }}>
                            <strong>{isLast ? "Destino final" : `Parada ${idx + 1}`}</strong><br />
                            {stop.addressData.address}<br />
                            {stop.recipientName && <span>👤 {stop.recipientName}</span>}
                            {stop.itemDescription && <><br />📦 {stop.itemDescription}</>}
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  );
                })}
              </GoogleMap>
            </div>
          )}

          {/* Métricas */}
          {routeInfo && (
            <div className="wizard-metrics">
              <div className="wizard-metric">
                <span className="wizard-metric-icon">📏</span>
                <div>
                  <div className="wizard-metric-label">Distância total</div>
                  <div className="wizard-metric-value">{routeInfo.totalDistanceKm.toFixed(1)} km</div>
                </div>
              </div>
              <div className="wizard-metric">
                <span className="wizard-metric-icon">⏱️</span>
                <div>
                  <div className="wizard-metric-label">Tempo estimado</div>
                  <div className="wizard-metric-value">
                    {routeInfo.totalDurationMin >= 60
                      ? `${Math.floor(routeInfo.totalDurationMin / 60)}h ${routeInfo.totalDurationMin % 60}min`
                      : `${routeInfo.totalDurationMin} min`}
                  </div>
                </div>
              </div>
              <div className="wizard-metric highlight">
                <span className="wizard-metric-icon">💰</span>
                <div>
                  <div className="wizard-metric-label">
                    Preço estimado <span style={{ fontSize: 11, color: "#6b7280" }}>(R$ {routeInfo.pricePerKm.toFixed(2)}/km)</span>
                  </div>
                  <div className="wizard-metric-value" style={{ color: "#059669" }}>
                    R$ {routeInfo.estimatedPrice.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total a cobrar (COD) */}
          {totalAmount > 0 && (
            <div className="wizard-metrics" style={{ marginBottom: 16 }}>
              <div className="wizard-metric highlight">
                <span className="wizard-metric-icon">🏷️</span>
                <div>
                  <div className="wizard-metric-label">Total a cobrar na entrega (COD)</div>
                  <div className="wizard-metric-value" style={{ color: "#2563eb" }}>
                    R$ {totalAmount.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="wizard-notes">
            <label className="wizard-notes-label" htmlFor="wizard-notes">
              Observações (opcional)
            </label>
            <textarea
              id="wizard-notes"
              className="wizard-notes-input"
              placeholder="Instruções para o motoboy, referências, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {submitError && (
            <div className="wizard-error">{submitError}</div>
          )}
        </>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal">
        {/* Header */}
        <div className="wizard-header">
          <h2 className="wizard-title">🚀 Nova Entrega</h2>
          <button className="wizard-close" onClick={onCancel} title="Cancelar">✕</button>
        </div>

        {/* Steps */}
        <div className="wizard-steps-container">
          <StepIndicator />
        </div>

        {/* Content */}
        <div className="wizard-body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer navigation */}
        <div className="wizard-footer">
          <button
            type="button"
            className="wizard-btn secondary"
            onClick={step === 1 ? onCancel : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
          >
            <FiChevronLeft size={16} />
            {step === 1 ? "Cancelar" : "Voltar"}
          </button>

          {step < 3 ? (
            <button
              type="button"
              className="wizard-btn primary"
              disabled={step === 1 ? !step1Valid : !step2Valid}
              onClick={() => {
                if (step === 1) setStep(2);
                else goToStep3();
              }}
            >
              Próximo <FiChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="wizard-btn primary"
              disabled={submitting || routeLoading}
              onClick={handleSubmit}
            >
              {submitting ? "Criando..." : "✅ Criar Entrega"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryWizard;
