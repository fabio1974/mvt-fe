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
  street?: string;      // Logradouro (rua, avenida, etc)
  number?: string;      // Número
  neighborhood?: string; // Bairro
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
  height: "60vh", // Responsivo: 60% da altura da viewport
  minHeight: "400px", // Mínimo de 400px em telas pequenas
  maxHeight: "700px", // Máximo de 700px em telas grandes
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
  // label, // TODO: Implementar label se necessário
  disabled = false,
  // required = false, // TODO: Implementar validação required se necessário
  onAddressSelect,
  showConfirmButton = false,
}) => {
  // 📍 Monta o endereço completo para a busca inicial (rua + número)
  const buildInitialAddress = () => {
    let address = value.street || value.address || "";
    if (value.number) {
      address += `, ${value.number}`;
    }
    if (value.neighborhood) {
      address += ` - ${value.neighborhood}`;
    }
    if (value.city) {
      address += `, ${value.city}`;
    }
    if (value.state) {
      address += ` - ${value.state}`;
    }
    return address;
  };

  const [searchInput, setSearchInput] = useState(buildInitialAddress());
  const [mapCenter, setMapCenter] = useState(
    value.latitude && value.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : defaultCenter
  );
  const [isLocating, setIsLocating] = useState(false); // Estado para loading do botão
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // �️ Atualiza o centro do mapa quando as coordenadas do value mudarem
  React.useEffect(() => {
    if (value.latitude && value.longitude) {
      const newCenter = { lat: value.latitude, lng: value.longitude };
      setMapCenter(newCenter);
    }
  }, [value.latitude, value.longitude]);

  // �📍 Obtém localização do usuário do navegador
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
            street: getComponent("route"), // Logradouro
            number: getComponent("street_number"), // Número
            neighborhood: 
              getComponent("sublocality_level_1") ||
              getComponent("sublocality") ||
              getComponent("neighborhood"), // Bairro
          };

          console.log('📍 [AddressMapPicker] Dados extraídos do Google Maps:', newData);
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
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map; // Salva referência do mapa
    
    if (!inputRef.current || !isLoaded) return;

    try {
      // Verifica se a API do Places está disponível
      if (!google.maps.places || !google.maps.places.Autocomplete) {
        console.warn("Google Maps Places API não está carregada");
        return;
      }

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
    } catch (error) {
      console.warn("Erro ao inicializar autocomplete:", error);
    }
  }, [isLoaded, reverseGeocode]);

  // 📍 Função para centralizar no local atual do navegador
  const centerOnCurrentLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      alert("Geolocalização não suportada pelo navegador");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(userPos);
        reverseGeocode(userPos.lat, userPos.lng);
        setIsLocating(false);
      },
      (error) => {
        console.error("❌ Erro ao obter localização:", error.message);
        alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [reverseGeocode]);

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
        <div style={{ display: "flex", gap: "8px" }}>
          {!disabled && (
            <>
              <button
                type="button"
                className="address-search-button"
                onClick={() => geocodeAddress(searchInput)}
                title="Buscar endereço"
              >
                🔍
              </button>
              <button
                type="button"
                className="address-search-button"
                onClick={centerOnCurrentLocation}
                title="Centralizar na minha localização"
                disabled={isLocating}
                style={{
                  backgroundColor: isLocating ? "#ccc" : undefined,
                  cursor: isLocating ? "wait" : "pointer",
                }}
              >
                {isLocating ? "⏳" : "📍"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={17}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
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
      >
        {value.latitude && value.longitude && (
          <Marker 
            position={{ lat: value.latitude, lng: value.longitude }}
            draggable={!disabled}
            onDragEnd={(e) => {
              if (e.latLng && !disabled) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                // Atualiza posição e busca endereço
                reverseGeocode(lat, lng);
              }
            }}
            title="Arraste para ajustar a posição"
          />
        )}
      </GoogleMap>

      {/* Informações do endereço */}
      {value.latitude && value.longitude && (
        <div className="address-info" style={{ 
          display: "flex", 
          gap: "16px", 
          flexWrap: "wrap", 
          alignItems: "center",
          fontSize: "0.9em"
        }}>
          <div className="address-info-row">
            <strong>📍</strong> {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </div>
          {value.city && (
            <div className="address-info-row">
              <strong>🏙️</strong> {value.city} - {value.state}
            </div>
          )}
          {value.zipCode && (
            <div className="address-info-row">
              <strong>📮</strong> {value.zipCode}
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
