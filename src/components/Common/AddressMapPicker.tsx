import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import "./AddressMapPicker.css";
import "./AddressMapPicker.css";

export interface AddressData {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
}

interface AddressMapPickerProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  onAddressSelect?: (address: AddressData) => void;
  showConfirmButton?: boolean;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px",
};

// Centro padrão: Fortaleza, CE
const defaultCenter = {
  lat: -3.7327,
  lng: -38.5267,
};

/**
 * Componente de seleção de endereço com Google Maps
 * Permite clicar no mapa ou digitar endereço com autocomplete
 */
export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  onAddressSelect,
  showConfirmButton = false,
}) => {
  const [searchInput, setSearchInput] = useState(value.address || "");
  const [mapCenter, setMapCenter] = useState(
    value.latitude && value.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : defaultCenter
  );
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // 📍 Obtém localização do usuário do navegador
  React.useEffect(() => {
    // Se já tem endereço setado, não precisa buscar localização
    if (value.latitude && value.longitude) {
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(userPos);
          console.log("📍 Localização do usuário obtida:", userPos);
        },
        (error) => {
          console.warn("⚠️ Não foi possível obter localização do usuário:", error.message);
          // Mantém o centro padrão (Fortaleza)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  }, [value.latitude, value.longitude]);

  // Reverse Geocoding: Coordenadas → Endereço
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!isLoaded) return;

      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });

        if (response.results && response.results[0]) {
          const result = response.results[0];
          const addressComponents = result.address_components;

          // Extrai componentes do endereço
          const getComponent = (type: string) => {
            const comp = addressComponents.find((c) => c.types.includes(type));
            return comp?.long_name || "";
          };

          const newData: AddressData = {
            address: result.formatted_address,
            latitude: lat,
            longitude: lng,
            city:
              getComponent("locality") ||
              getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            zipCode: getComponent("postal_code"),
          };

          setSearchInput(result.formatted_address);
          onChange(newData);
        }
      } catch (error) {
        console.error("Erro ao fazer reverse geocoding:", error);
      }
    },
    [isLoaded, onChange]
  );

  // Geocoding: Endereço → Coordenadas
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
          await reverseGeocode(lat, lng);
        }
      } catch (error) {
        console.error("Erro ao fazer geocoding:", error);
      }
    },
    [isLoaded, reverseGeocode]
  );

  // Clique no mapa
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (disabled || !e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMapCenter({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [disabled, reverseGeocode]
  );

  // Inicializa autocomplete quando mapa carrega
  const onMapLoad = useCallback(() => {
    if (!inputRef.current || !isLoaded) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "br" }, // Apenas Brasil
      fields: ["formatted_address", "geometry", "address_components"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMapCenter({ lat, lng });
        reverseGeocode(lat, lng);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, reverseGeocode]);

  // Busca ao pressionar Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput) {
      e.preventDefault();
      geocodeAddress(searchInput);
    }
  };

  if (loadError) {
    return (
      <div className="address-map-error">Erro ao carregar Google Maps</div>
    );
  }

  if (!isLoaded) {
    return <div className="address-map-loading">Carregando mapa...</div>;
  }

  return (
    <div className="address-map-picker">
      <label className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>

      {/* Input de busca com autocomplete */}
      <div className="address-search-container">
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder="Digite o endereço ou clique no mapa..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        {!disabled && (
          <button
            type="button"
            className="address-search-button"
            onClick={() => geocodeAddress(searchInput)}
            title="Buscar endereço"
          >
            🔍
          </button>
        )}
      </div>

      {/* Mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={15}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {value.latitude && value.longitude && (
          <Marker position={{ lat: value.latitude, lng: value.longitude }} />
        )}
      </GoogleMap>

      {/* Informações do endereço */}
      {value.latitude && value.longitude && (
        <div className="address-info">
          <div className="address-info-row">
            <strong>📍 Coordenadas:</strong> {value.latitude.toFixed(6)},{" "}
            {value.longitude.toFixed(6)}
          </div>
          {value.city && (
            <div className="address-info-row">
              <strong>🏙️ Cidade:</strong> {value.city} - {value.state}
            </div>
          )}
          {value.zipCode && (
            <div className="address-info-row">
              <strong>📮 CEP:</strong> {value.zipCode}
            </div>
          )}
        </div>
      )}

      {/* Botão de confirmação (quando usado em modal) */}
      {showConfirmButton &&
        onAddressSelect &&
        value.latitude &&
        value.longitude && (
          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button
              type="button"
              className="address-confirm-button"
              onClick={() => onAddressSelect(value)}
            >
              ✅ Confirmar Endereço
            </button>
          </div>
        )}
    </div>
  );
};
