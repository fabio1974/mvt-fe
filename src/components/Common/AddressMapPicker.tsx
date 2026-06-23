import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import "./AddressMapPicker.css";

export interface AddressData {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
  street?: string;
  number?: string;
  neighborhood?: string;
}

interface AddressMapPickerProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  onAddressSelect?: (address: AddressData) => void;
  showConfirmButton?: boolean;
  /** Centro inicial do mapa quando não há endereço (ex.: GPS salvo do usuário). Tem
   *  prioridade sobre a geolocation do browser e sobre o default. */
  fallbackCenter?: { lat: number; lng: number } | null;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "60vh",
  minHeight: "400px",
  maxHeight: "700px",
  borderRadius: "8px",
};

const defaultCenter = {
  lat: -3.7327,
  lng: -38.5267,
};

/**
 * Componente de seleção de endereço com Google Maps.
 *
 * Texto e coordenadas são INDEPENDENTES:
 * - O usuário pode digitar livremente no campo de texto (endereço personalizado)
 * - O usuário pode posicionar o pin no mapa de forma independente
 * - Quando o usuário seleciona via autocomplete do Google, o texto segue o Google
 * - Quando o usuário digita manualmente, mover o pin NÃO sobrescreve o texto
 */
export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  value,
  onChange,
  disabled = false,
  onAddressSelect,
  showConfirmButton = false,
  fallbackCenter = null,
}) => {
  const buildInitialAddress = () => {
    let address = value.street || value.address || "";
    if (value.number) address += `, ${value.number}`;
    if (value.neighborhood) address += ` - ${value.neighborhood}`;
    if (value.city) address += `, ${value.city}`;
    if (value.state) address += ` - ${value.state}`;
    return address;
  };

  const [searchInput, setSearchInput] = useState(buildInitialAddress());
  const [mapCenter, setMapCenter] = useState(
    value.latitude && value.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : fallbackCenter ?? defaultCenter // GPS salvo do usuário tem prioridade sobre o default
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);

  /**
   * Flag de texto manual — espelha o isAddressManuallyEdited do mobile.
   * true  → usuário digitou; mover o pin preserva o texto
   * false → texto vem do Google (autocomplete ou reverse geocode)
   */
  const isManualTextRef = useRef(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const idleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    if (value.latitude && value.longitude) {
      // Só atualiza o centro do mapa se a posição realmente mudou
      // (evita loop: onIdle → onChange → useEffect → re-center → onIdle)
      setMapCenter((prev) => {
        if (
          Math.abs(prev.lat - value.latitude) < 0.000001 &&
          Math.abs(prev.lng - value.longitude) < 0.000001
        ) {
          return prev;
        }
        return { lat: value.latitude, lng: value.longitude };
      });
    }
  }, [value.latitude, value.longitude]);

  // Geolocation do browser só como FALLBACK: quando não há endereço inicial NEM GPS salvo
  // do usuário (fallbackCenter). Se temos o GPS salvo, centramos nele sem prompt do browser.
  useEffect(() => {
    if (value.latitude && value.longitude) return;
    if (fallbackCenter) return;
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.warn("⚠️ Não foi possível obter localização do usuário:", error.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [value.latitude, value.longitude]);

  /**
   * Reverse geocoding: converte coordenadas em endereço.
   * IMPORTANTE: só atualiza o texto do input se o usuário NÃO editou manualmente
   * (isManualTextRef.current === false). As coordenadas sempre são atualizadas.
   */
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!isLoaded) return;
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          const result = response.results[0];
          const addressComponents = result.address_components;
          const getComponent = (type: string) =>
            addressComponents.find((c) => c.types.includes(type))?.long_name || "";

          const newData: AddressData = {
            address: result.formatted_address,
            latitude: lat,
            longitude: lng,
            city: getComponent("locality") || getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            zipCode: getComponent("postal_code"),
            street: getComponent("route"),
            number: getComponent("street_number"),
            neighborhood:
              getComponent("sublocality_level_1") ||
              getComponent("sublocality") ||
              getComponent("neighborhood"),
          };

          // Só atualiza o texto se o usuário não escreveu manualmente
          if (!isManualTextRef.current) {
            setSearchInput(result.formatted_address);
            onChange(newData);
          } else {
            // Preserva o texto do usuário, atualiza apenas as coordenadas e metadados
            onChange({
              ...newData,
              address: searchInput, // mantém o texto que o usuário digitou
            });
          }
        }
      } catch (error) {
        console.error("Erro ao fazer reverse geocoding:", error);
      }
    },
    [isLoaded, onChange, searchInput]
  );

  const geocodeAddress = useCallback(
    async (address: string) => {
      if (!isLoaded || !address) return;
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ address });
        if (response.results && response.results[0]) {
          const result = response.results[0];
          const location = result.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          setMapCenter({ lat, lng });
          if (mapRef.current) mapRef.current.panTo({ lat, lng });
          await reverseGeocode(lat, lng);
        }
      } catch (error) {
        console.error("Erro ao fazer geocoding:", error);
      }
    },
    [isLoaded, reverseGeocode]
  );

  /**
   * Map idle: lê o centro do mapa e atualiza as coordenadas.
   * Debounce de 400ms para evitar chamadas excessivas ao geocoder.
   */
  const handleMapIdle = useCallback(() => {
    if (!mapRef.current || disabled) return;
    const center = mapRef.current.getCenter();
    if (!center) return;

    const lat = center.lat();
    const lng = center.lng();

    // Não dispara se a posição não mudou significativamente (evita loop de feedback)
    if (
      Math.abs(lat - value.latitude) < 0.000001 &&
      Math.abs(lng - value.longitude) < 0.000001
    ) {
      setIsMapDragging(false);
      return;
    }

    if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
    idleDebounceRef.current = setTimeout(() => {
      setIsMapDragging(false);
      if (isManualTextRef.current) {
        // Preserva o texto, só atualiza coordenadas
        onChange({ ...value, latitude: lat, longitude: lng });
      } else {
        reverseGeocode(lat, lng);
      }
    }, 400);
  }, [disabled, onChange, reverseGeocode, value]);

  const handleMapDragStart = useCallback(() => {
    setIsMapDragging(true);
    if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
  }, []);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (!inputRef.current || !isLoaded) return;
      try {
        if (!google.maps.places?.Autocomplete) {
          console.warn("Google Maps Places API não está carregada");
          return;
        }
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "br" },
          fields: ["formatted_address", "geometry", "address_components"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            // Seleção via autocomplete: texto vem do Google → desativa flag manual
            isManualTextRef.current = false;
            setMapCenter({ lat, lng });
            map.panTo({ lat, lng });
            reverseGeocode(lat, lng);
          }
        });
        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.warn("Erro ao inicializar autocomplete:", error);
      }
    },
    [isLoaded, reverseGeocode]
  );

  const centerOnCurrentLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      alert("Geolocalização não suportada pelo navegador");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapCenter(userPos);
        if (mapRef.current) mapRef.current.panTo(userPos);
        reverseGeocode(userPos.lat, userPos.lng);
        setIsLocating(false);
      },
      (error) => {
        console.error("❌ Erro ao obter localização:", error.message);
        alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput) {
      e.preventDefault();
      isManualTextRef.current = false; // busca explícita = aceita texto do Google
      geocodeAddress(searchInput);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isManualTextRef.current = true; // usuário editou manualmente
    setSearchInput(e.target.value);
  };

  /**
   * Confirmar endereço: usa o texto digitado pelo usuário + coordenadas do mapa.
   * Texto e coordenadas são independentes — não é necessária correspondência com o Google.
   */
  const handleConfirm = () => {
    if (!onAddressSelect) return;
    onAddressSelect({
      ...value,
      address: searchInput,
    });
  };

  if (loadError) {
    return <div className="address-map-error">Erro ao carregar Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="address-map-loading">Carregando mapa...</div>;
  }

  const hasAddress = searchInput.trim() !== "";
  const hasCoordinates = value.latitude !== 0 || value.longitude !== 0;

  return (
    <div className="address-map-picker">
      {/* Input de busca com autocomplete */}
      <div className="address-search-container">
        <div className="address-search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            placeholder="Digite o endereço ou mova o mapa para posicionar o pin..."
            value={searchInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
          />
          {isManualTextRef.current && hasAddress && (
            <span className="address-manual-badge" title="Endereço personalizado (texto independente do mapa)">
              ✏️ personalizado
            </span>
          )}
        </div>
        {!disabled && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="address-search-button"
              onClick={() => {
                isManualTextRef.current = false;
                geocodeAddress(searchInput);
              }}
              title="Buscar endereço no Google"
            >
              🔍
            </button>
            <button
              type="button"
              className="address-search-button"
              onClick={centerOnCurrentLocation}
              title="Centralizar na minha localização"
              disabled={isLocating}
              style={{ backgroundColor: isLocating ? "#ccc" : undefined, cursor: isLocating ? "wait" : "pointer" }}
            >
              {isLocating ? "⏳" : "📍"}
            </button>
            {showConfirmButton && onAddressSelect && hasAddress && (
              <button
                type="button"
                className="address-confirm-button"
                onClick={handleConfirm}
                style={{ whiteSpace: "nowrap" }}
              >
                ✅ Confirmar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Instrução de uso do mapa */}
      {!disabled && (
        <div className="address-map-hint">
          Clique ou arraste o mapa para posicionar o pin
        </div>
      )}

      {/* Mapa com pin fixo no centro */}
      <div className="address-map-container">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={17}
          onLoad={onMapLoad}
          onIdle={handleMapIdle}
          onDragStart={handleMapDragStart}
          onClick={(e) => {
            if (disabled || !e.latLng) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            // Move o mapa para o ponto clicado e faz geocode reverso
            mapRef.current?.panTo({ lat, lng });
            if (isManualTextRef.current) {
              onChange({ ...value, latitude: lat, longitude: lng });
            } else {
              reverseGeocode(lat, lng);
            }
          }}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            scrollwheel: false,
            gestureHandling: "cooperative",
            streetViewControl: true,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_RIGHT,
              mapTypeIds: [
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.SATELLITE,
                google.maps.MapTypeId.HYBRID,
                google.maps.MapTypeId.TERRAIN,
              ],
            },
            fullscreenControl: true,
          }}
        />
        {/* Pin fixo no centro do mapa (posição atual) */}
        {!disabled && (
          <div className={`address-center-pin${isMapDragging ? " dragging" : ""}`}>
            <div className="address-center-pin-icon" />
            <div className="address-center-pin-shadow" />
          </div>
        )}
      </div>

      {/* Informações resumidas em uma linha */}
      <div className="address-info" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", fontSize: "0.8rem", color: "#6b7280" }}>
        <span>
          📍 {hasCoordinates
            ? `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`
            : "sem coordenadas"}
        </span>
        {hasAddress && (
          <span>
            📝 {searchInput}
            {isManualTextRef.current && <span className="address-info-badge" style={{ marginLeft: 4 }}>personalizado</span>}
          </span>
        )}
        {value.city && <span>🏙️ {value.city} - {value.state}</span>}
        {value.zipCode && <span>📮 {value.zipCode}</span>}
      </div>

      {/* Aviso sem coordenadas */}
      {showConfirmButton && onAddressSelect && hasAddress && !hasCoordinates && (
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <span className="address-no-coords-warning">⚠️ Sem posição no mapa (só texto)</span>
        </div>
      )}
    </div>
  );
};
